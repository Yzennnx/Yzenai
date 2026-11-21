import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const tools = join(process.env.LOCALAPPDATA, 'AIShortVideos');
const release = (await readdir(tools)).find((entry) => /^ffmpeg-.*_build$/.test(entry));
assert(release, 'Portable FFmpeg is missing');
const ffmpeg = join(tools, release, 'bin', 'ffmpeg.exe');
const ffprobe = join(tools, release, 'bin', 'ffprobe.exe');
const edge = join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
const framesPerSecond = 24;
const revision = process.argv.includes('--revision');
const endingPreview = revision && process.argv.includes('--ending');
const fullEpisode = process.argv.includes('--full');
const editSource = process.argv.includes('--edit-source');
assert(!editSource || (fullEpisode && revision), 'Use --full --revision with --edit-source');
assert(!(fullEpisode && endingPreview), 'Choose a full render or an ending preview');
const duration = fullEpisode || endingPreview ? (revision ? 60 : 46) : (revision ? 18 : 15);
const startFrame = endingPreview ? 39 * framesPerSecond : 0;
const renderDuration = duration - startFrame / framesPerSecond;
const voiceAsset = (revision ? 'revision-' : '') + (fullEpisode || endingPreview ? 'episode-voice' : process.argv.includes('--quick') ? 'opening-quick' : 'opening-measured');
const assets = join(import.meta.dirname, 'assets');
const output = editSource ? join(assets, 'remotion-picture.mp4') : join(import.meta.dirname, 'exports', endingPreview ? 'bleach-revision-ending.mp4' :
  fullEpisode ? `concentrated-bleach${revision ? '-revision' : ''}.mp4` : `bleach-${voiceAsset}.mp4`);
const work = await mkdtemp(join(tools, 'bleach-preview-'));
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
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
    return response;
  }
  for (let attempt = 0; attempt < 80 && !await evaluate('Boolean(window.renderFrame)'); attempt++) await delay(100);
  assert(await evaluate('Boolean(window.renderFrame)'), 'Preview script did not load');
  await evaluate(`window.pages = ${JSON.stringify(pages)}; true`);

  const noise = '(random(0)*2-1)';
  const strike = (at, level, hz) => String.raw`if(gte(t\,${at})\,${level}*exp(-26*(t-${at}))*sin(2*PI*${hz}*(t-${at}))\,0)`;
  const cloth = (at, level, width) => `${level}*${noise}*exp(-${width}*(t-${at})^2)`;
  const inhale = (at, level) => `(0.62*${noise}+0.18*sin(2*PI*390*t))*${level}*exp(-9*(t-${at})^2)`;
  const cues = revision ? [
    cloth(2.55,.025,33), strike(4.41,.035,173), inhale(editSource ? 4.59 : 4.79,.04),
    strike(6.16,.13,260), strike(6.16,.09,530), cloth(7.21,.037,34),
    inhale(22.8,.06), inhale(32.04,.07), inhale(34.10,.105), inhale(37.90,.075),
    cloth(42.10,.06,16), strike(43.89,.20,95), cloth(43.89,.10,38),
    strike(46.68,.15,105), cloth(46.68,.075,38), inhale(47.20,.08),
    cloth(50.83,.07,18), strike(51.70,.06,320),
    strike(53.09,.09,720), inhale(56.5,.045),
  ] : [
    cloth(2.55,.025,33), strike(3.08,.035,280), strike(4.81,.038,173),
    inhale(5.02,.032), strike(7.22,.13,260), strike(7.22,.10,530),
    cloth(7.53,.037,34), cloth(24.10,.045,36), inhale(26.40,.06),
    inhale(30.38,.115), inhale(34.37,.065), cloth(37.55,.055,25),
    strike(38.93,.06,330),
  ];
  const sound = `aevalsrc=${['0.006*sin(2*PI*54*t)', `0.005*${noise}`, ...cues].join('+')}:s=48000:d=${duration}`;
  const mix = '[1:a][2:a]amix=inputs=2:normalize=0,alimiter=limit=0.94[audio]';
  const seek = endingPreview ? ['-ss', String(startFrame / framesPerSecond)] : [];
  encoder = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(framesPerSecond), '-vcodec', 'mjpeg', '-i', 'pipe:0', ...seek, '-i', voice, ...seek, '-f', 'lavfi', '-i', sound, '-filter_complex', mix, '-map', '0:v:0', '-map', '[audio]', '-t', String(renderDuration), '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output], { stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true });
  const exit = once(encoder, 'close');
  encoder.stdin.on('error', () => {});
  for (let frame = startFrame; frame < duration * framesPerSecond; frame++) {
    const encoded = await evaluate(`window.renderFrame(${frame / framesPerSecond}, ${editSource ? '[]' : 'window.pages'}, ${revision}, ${editSource}); document.getElementById('scene').toDataURL('image/jpeg', 0.91).split(',')[1]`);
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
  assert(dirname(cache) === await realpath(tools) && basename(cache).startsWith('bleach-preview-'), 'Unexpected preview cache path');
  await rm(cache, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch((error) => console.warn(`Could not clean preview cache: ${error.message}`));
}

