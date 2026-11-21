import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { renderCutout } from '../../tools/opentoonz/render-cutout.mjs';

const tools = join(process.env.LOCALAPPDATA, 'AIShortVideos');
const release = (await readdir(tools)).find((entry) => /^ffmpeg-.*_build$/.test(entry));
assert(release, 'Portable FFmpeg is missing');
const ffmpeg = join(tools, release, 'bin', 'ffmpeg.exe');
const ffprobe = join(tools, release, 'bin', 'ffprobe.exe');
const edge = join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
const framesPerSecond = 24;
const motionTest = process.argv.includes('--motion-test');
const testStart = 2.5;
const testDuration = 3.5;
const fullEpisode = process.argv.includes('--full');
assert(!(motionTest && fullEpisode), 'Choose either the motion test or the full episode');
const duration = fullEpisode ? 46 : 14;
const voiceAsset = fullEpisode ? 'episode-voice' : process.argv.includes('--quick') ? 'opening-quick' : 'opening-measured';
const assets = join(import.meta.dirname, 'assets');
const exports = join(import.meta.dirname, 'exports');
const output = join(exports, motionTest ? 'shadow-yank-opentoonz.mp4' : fullEpisode ? 'weighted-shadow.mp4' : `shadow-${voiceAsset}.mp4`);
const work = await mkdtemp(join(tools, 'shadow-preview-'));
await mkdir(dirname(output), { recursive: true });

function audioDuration(file) {
  return Number(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }));
}

let browser;
let socket;
let encoder;
try {
  const pages = JSON.parse(await readFile(join(assets, `${voiceAsset}.json`), 'utf8'));
  const voice = join(assets, `${voiceAsset}.wav`);
  assert(pages.length && pages.every((page, index) => page.start >= (pages[index - 1]?.end ?? 0)
    && page.end > page.start && page.end <= duration), 'Invalid caption timing');
  assert(Math.abs(audioDuration(voice) - duration) < .05, 'Voice track does not match the video duration');

  const profile = join(work, 'edge');
  browser = spawn(edge, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, pathToFileURL(join(import.meta.dirname, 'preview.html')).href], { stdio: 'ignore', windowsHide: true });
  let endpoint;
  for (let attempt = 0; attempt < 100; attempt++) {
    const portFile = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
    if (portFile) {
      const tabs = await fetch(`http://127.0.0.1:${portFile.split(/\r?\n/)[0]}/json/list`).then((response) => response.json());
      endpoint = tabs.find((tab) => tab.type === 'page' && tab.url.includes('preview.html'))?.webSocketDebuggerUrl;
      if (endpoint) break;
    }
    await delay(100);
  }
  assert(endpoint, 'Edge did not load the preview');
  socket = new WebSocket(endpoint);
  await once(socket, 'open');
  let commandId = 0;
  async function evaluate(expression) {
    const id = ++commandId;
    const response = new Promise((resolve, reject) => {
      const receive = (event) => {
        const result = JSON.parse(event.data);
        if (result.id !== id) return;
        socket.removeEventListener('message', receive);
        if (result.error || result.result.exceptionDetails) reject(new Error(JSON.stringify(result.error ?? result.result.exceptionDetails)));
        else resolve(result.result.result.value);
      };
      socket.addEventListener('message', receive);
    });
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
    return response;
  }
  for (let attempt = 0; attempt < 80 && !await evaluate('Boolean(window.renderFrame)'); attempt++) await delay(100);
  assert(await evaluate('Boolean(window.renderFrame)'), 'Preview script did not load');
  await evaluate(`window.pages = ${JSON.stringify(pages)}; true`);

  let cutoutFrames;
  if (motionTest) {
    cutoutFrames = await renderCutout({
      work,
      shotFile: join(import.meta.dirname, 'shadow-yank.toonzscript'),
      frameCount: testDuration * framesPerSecond,
      drawPart: async (part) => Buffer.from(await evaluate(`window.makeCutout(${JSON.stringify(part)})`), 'base64'),
    });
    await evaluate(`window.silhouette = document.createElement('canvas');
      silhouette.width = 640; silhouette.height = 700;
      window.cutout = new Image(); true`);
  }

  const noise = '(random(0)*2-1)';
  const hit = (at, level, frequency) => String.raw`if(gte(t\,${at})\,${level}*exp(-13*(t-${at}))*sin(2*PI*${frequency}*(t-${at}))\,0)`;
  const scuff = (at, level) => `${level}*${noise}*exp(-18*(t-${at})^2)`;
  const footfalls = [1.1,1.9,2.69,16.2,20.2,23.8,27.5].map((at) => hit(at, .07, 106));
  const scrapes = [3.24, 7.22, 11.4, 15.1, 19.1, 42.68].map((at) => scuff(at, .09));
  const engine = '(0.052*sin(2*PI*(57*(t-36.3)+2.2*(t-36.3)^2))+0.026*sin(2*PI*108*t))*exp(-0.46*(t-38.6)^2)';
  const sound = `aevalsrc=${['0.013*sin(2*PI*47*t)', `0.011*${noise}`, ...footfalls, ...scrapes, hit(3.14,.19,77), engine, hit(39.62,.10,160), hit(42.63,.21,70), hit(43.24,.17,64)].join('+')}:s=48000:d=${duration}`;
  const mix = '[1:a][2:a]amix=inputs=2:normalize=0,alimiter=limit=0.94[audio]';
  const clipDuration = motionTest ? testDuration : duration;
  const audio = motionTest
    ? ['-ss', String(testStart), '-i', join(exports, 'shadow-opening-measured.mp4'), '-map', '0:v:0', '-map', '1:a:0']
    : ['-i', voice, '-f', 'lavfi', '-i', sound, '-filter_complex', mix, '-map', '0:v:0', '-map', '[audio]'];
  encoder = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(framesPerSecond), '-vcodec', 'mjpeg', '-i', 'pipe:0', ...audio, '-t', String(clipDuration), '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output], { stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true });
  const exit = once(encoder, 'close');
  encoder.stdin.on('error', () => {});
  for (let frame = 0; frame < clipDuration * framesPerSecond; frame++) {
    const t = frame / framesPerSecond + (motionTest ? testStart : 0);
    let drawCutout = '';
    if (motionTest) {
      const png = await readFile(cutoutFrames[frame], 'base64');
      drawCutout = `cutout.src = 'data:image/png;base64,${png}'; await cutout.decode();
        const shadow = silhouette.getContext('2d');
        shadow.clearRect(0,0,640,700);
        shadow.globalCompositeOperation = 'source-over';
        shadow.drawImage(cutout,0,0);
        shadow.globalCompositeOperation = 'source-in';
        shadow.fillStyle = '#141b25';
        shadow.fillRect(0,0,640,700);`;
    }
    const encoded = await evaluate(`(async () => {
      ${drawCutout}
      window.renderFrame(${t}, window.pages${motionTest ? ', cutout, silhouette' : ''});
      return document.getElementById('scene').toDataURL('image/jpeg', 0.91).split(',')[1];
    })()`);
    assert(encoded, `Missing frame ${frame}`);
    await new Promise((resolve, reject) => encoder.stdin.write(Buffer.from(encoded, 'base64'), (error) => error ? reject(error) : resolve()));
    if (frame % (framesPerSecond * 10) === 0 && frame > 0) console.log(`Rendered ${frame / framesPerSecond}s of ${duration}s`);
  }
  encoder.stdin.end();
  assert.equal((await exit)[0], 0, 'FFmpeg failed');
  console.log(output);
} finally {
  socket?.close();
  if (encoder && encoder.exitCode === null) encoder.kill();
  if (browser && browser.exitCode === null) {
    const exited = once(browser, 'close');
    browser.kill();
    await exited;
  }
  const cache = await realpath(work);
  assert(dirname(cache) === await realpath(tools) && basename(cache).startsWith('shadow-preview-'), 'Unexpected preview cache path');
  await rm(cache, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch((error) => console.warn(`Could not clean preview cache: ${error.message}`));
}
