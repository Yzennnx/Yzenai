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
const args = process.argv.slice(2);
const opening = args[0] === '--opening' && args.length === 1;
const preview = args[0] === '--shot' && args.length === 3;
assert(!args.length || opening || preview, 'Usage: node render.mjs [--opening | --shot START END]');
const episodeDuration = opening ? 13 : 66;
const startFrame = preview ? Math.round(Number(args[1]) * framesPerSecond) : 0;
const endFrame = preview ? Math.round(Number(args[2]) * framesPerSecond) : episodeDuration * framesPerSecond;
assert(!preview || (args.slice(1).every((value) => /^\d+(\.\d+)?$/.test(value))
  && startFrame >= 0 && startFrame < endFrame && endFrame <= episodeDuration * framesPerSecond),
'Shot preview needs an increasing frame range between 0 and 66 seconds');
const frameCount = endFrame - startFrame;
const duration = frameCount / framesPerSecond;
const voiceAsset = opening ? 'opening-measured' : 'episode-voice';
const assets = join(import.meta.dirname, 'assets');
const output = opening
  ? join(import.meta.dirname, 'exports', 'mud-cookies-opening.mp4')
  : preview
    ? join(import.meta.dirname, 'exports', `mud-cookies-shot-${startFrame}-${endFrame}.mp4`)
    : join(assets, 'remotion-picture.mp4');
const work = await mkdtemp(join(tools, 'mud-preview-'));
await mkdir(dirname(output), { recursive: true });

function audioDuration(file) {
  return Number(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }));
}

let browser;
let socket;
let encoder;
try {
  const pages = preview ? [] : JSON.parse(await readFile(join(assets, `${voiceAsset}.json`), 'utf8'));
  const voice = join(assets, `${voiceAsset}.wav`);
  if (!preview) {
    assert(pages.length && pages.every((page, index) => page.start >= (pages[index - 1]?.end ?? 0)
      && page.end > page.start && page.end <= duration), 'Invalid caption timing');
    assert(Math.abs(audioDuration(voice) - duration) < .05, 'Voice track does not match the video duration');
  }

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
  for (let attempt = 0; attempt < 80 && !await evaluate('Boolean(window.renderMudFrame)'); attempt++) await delay(100);
  assert(await evaluate('Boolean(window.renderMudFrame)'), 'Preview script did not load');



  const cutoutFrames = await renderCutout({
    work,
    shotFile: join(import.meta.dirname, 'poses.js'),
    startFrame,
    frameCount,
    extraParts: ['body3', 'body4', 'body5', 'legUpperFarAlt', 'legLowerFarAlt', 'legUpperNearAlt', 'legLowerNearAlt'],
    drawPart: async (part) => Buffer.from(await evaluate(`window.makeCutout(${JSON.stringify(part)})`), 'base64'),
  });

  const noise = '(random(0)*2-1)';
  const dust = (at, volume, width) => `${volume}*${noise}*exp(-${width}*(t-${at})^2)`;
  const ring = (at, volume, hz, decay) => String.raw`if(gte(t\,${at})\,${volume}*exp(-${decay}*(t-${at}))*sin(2*PI*${hz}*(t-${at}))\,0)`;
  const sounds = [
    '0.008*sin(2*PI*53*t)', `0.006*${noise}`,
    dust(2.42,.15,245), dust(2.51,.09,620), dust(2.65,.04,380), ring(2.43,.12,132,35),
    ring(5.95,.06,140,20), dust(7.79,.04,7), ring(8.18,.055,117,8),
    dust(10.74,.08,26), ring(10.74,.064,87,18), ring(11.15,.055,980,44),
    ring(12.39,.046,108,24), dust(12.41,.030,320),
    ring(15.19,.07,87,13), dust(17,.036,24), dust(21.37,.036,19),
    dust(24.60,.034,36), dust(25.50,.043,43), dust(26.33,.048,27),
    ring(28.08,.093,304,43), dust(28.10,.062,510),
    ring(32.58,.034,432,39), ring(39.35,.055,990,46), ring(39.49,.045,958,39),
    ring(39.67,.039,1012,45), dust(40.04,.037,140), ring(40.30,.040,110,25),
    dust(40.31,.026,310), dust(50.9,.045,12),
    dust(53.21,.045,50), dust(54.03,.11,26), ring(54.04,.16,81,17),
    ring(56.30,.09,94,13), dust(58.04,.11,31), ring(58.04,.08,131,18),
    dust(58.19,.046,78), ring(60.17,.052,430,68),
  ];
  const sound = `aevalsrc=${sounds.join('+')}:s=48000:d=${duration}`;
  encoder = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe',
    '-framerate', String(framesPerSecond), '-vcodec', 'mjpeg', '-i', 'pipe:0',
    ...(preview ? ['-an'] : ['-i', voice, '-f', 'lavfi', '-i', sound, '-filter_complex',
      '[1:a][2:a]amix=inputs=2:normalize=0,alimiter=limit=0.94[audio]',
      '-map', '0:v:0', '-map', '[audio]']),
    '-t', String(duration), '-c:v', 'libx264',
    '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k',
    '-movflags', '+faststart', output], { stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true });
  const exit = once(encoder, 'close');
  encoder.stdin.on('error', () => {});
  for (let frame = 0; frame < frameCount; frame++) {
    const t = (startFrame + frame) / framesPerSecond;
    const useCutout = await evaluate(`window.mudNeedsCharacter(${t})`);
    const png = useCutout ? await readFile(cutoutFrames[frame], 'base64') : null;
    const caption = opening ? pages.find(({start,end}) => start <= t && t < end) ?? null : null;
    const encoded = await evaluate(`(async () => {
      await window.renderMudFrame(${t}, ${JSON.stringify(png)}, ${JSON.stringify(caption)});
      return document.getElementById('picture').toDataURL('image/jpeg', .93).split(',')[1];
    })()`);
    assert(encoded, `Missing frame ${frame}`);
    await new Promise((resolve, reject) => encoder.stdin.write(Buffer.from(encoded, 'base64'), (error) => error ? reject(error) : resolve()));
    if (frame % (framesPerSecond * 10) === 0 && frame > 0) console.log(`Rendered ${t}s of ${duration}s`);
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
  assert(dirname(cache) === await realpath(tools) && basename(cache).startsWith('mud-preview-'), 'Unexpected preview cache path');
  await rm(cache, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch((error) => console.warn(`Could not clean preview cache: ${error.message}`));
}
