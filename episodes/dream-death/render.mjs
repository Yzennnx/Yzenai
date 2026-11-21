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
const fullEpisode = process.argv.includes('--full');
const quick = process.argv.includes('--quick');
const cardiac = process.argv.includes('--cardiac');
const prefix = cardiac ? 'cardiac-' : '';
const duration = fullEpisode ? 60 : cardiac ? 14 : 13;
const voiceAsset = prefix + (fullEpisode ? 'episode-voice' : quick ? 'opening-quick' : 'opening-measured');
const assets = join(import.meta.dirname, 'assets');
const output = join(import.meta.dirname, 'exports', fullEpisode ?
  cardiac ? 'dream-death-cardiac-revision.mp4' : 'dream-death.mp4' : `dream-death-${voiceAsset}.mp4`);
const work = await mkdtemp(join(tools, 'dream-preview-'));
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
  const frameRenderer = cardiac ? 'window.renderCardiacFrame' : 'window.renderFrame';
  for (let attempt = 0; attempt < 80 && !await evaluate(`Boolean(${frameRenderer})`); attempt++) await delay(100);
  assert(await evaluate(`Boolean(${frameRenderer})`), 'Preview script did not load');
  await evaluate(`window.pages = ${JSON.stringify(pages)}; true`);

  const effects = join(assets, prefix + (fullEpisode ? 'episode-effects.wav' : 'opening-effects.wav'));
  assert(Math.abs(audioDuration(effects) - duration) < .05, 'Effects track does not match the video duration');
  const mix = '[1:a]pan=stereo|FL=c0|FR=c0[voice];[voice][2:a]amix=inputs=2:normalize=0,alimiter=limit=0.92[audio]';
  encoder = spawn(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(framesPerSecond),
    '-vcodec', 'mjpeg', '-i', 'pipe:0', '-i', voice, '-i', effects, '-filter_complex', mix,
    '-map', '0:v:0', '-map', '[audio]', '-t', String(duration), '-c:v', 'libx264', '-preset', 'fast',
    '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output,
  ], { stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true });
  const exit = once(encoder, 'close');
  encoder.stdin.on('error', () => {});
  for (let frame = 0; frame < duration * framesPerSecond; frame++) {
    const encoded = await evaluate(`${frameRenderer}(${frame / framesPerSecond}, window.pages); document.getElementById('scene').toDataURL('image/jpeg', 0.91).split(',')[1]`);
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
  assert(dirname(cache) === await realpath(tools) && basename(cache).startsWith('dream-preview-'), 'Unexpected preview cache path');
  await rm(cache, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch((error) => console.warn(`Could not clean preview cache: ${error.message}`));
}

