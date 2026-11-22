import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { renderCutout } from '../../../../tools/opentoonz/render-cutout.mjs';
import { fps } from '../../../../assets/series-lead/anatomy-prototype/poses.mjs';
import { ch2bPose, duration } from './poses.mjs';

const chapter = import.meta.dirname;
const anatomy = new URL('../../../../assets/series-lead/anatomy-prototype/', import.meta.url);
const tools = join(process.env.LOCALAPPDATA, 'AIShortVideos');
const release = (await readdir(tools)).find(name => /^ffmpeg-.*_build$/.test(name));
assert(release, 'Portable FFmpeg is missing');
const ffmpeg = join(tools, release, 'bin', 'ffmpeg.exe');
const edge = join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');

const [mode, ...args] = process.argv.slice(2);
assert(!mode || mode === '--preview' || (mode === '--stills' && args.length > 0),
  'Usage: node render.mjs [--stills FRAME ...] | [--preview START LEN]');

const preview = mode === '--preview';
const from = preview ? Number(args[0] ?? 0) : 0;
const length = preview ? Number(args[1] ?? 144) : duration * fps;
assert(Number.isInteger(from) && Number.isInteger(length) && from >= 0 && length > 0 && from + length <= duration * fps);

const requested = mode === '--stills' ? args.map(Number) : Array.from({ length }, (_, i) => i + from);
const assets = join(chapter, 'assets');
const exportsDir = join(chapter, 'exports');
await mkdir(assets, { recursive: true });
await mkdir(exportsDir, { recursive: true });

const work = await mkdtemp(join(tools, 'l4d-ch2b-'));
const profile = join(work, 'edge');
const browser = spawn(edge, [
  '--headless=new', '--disable-gpu', '--no-first-run',
  '--disable-background-networking', '--disable-extensions',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });
const browserDone = once(browser, 'close');
let socket, encoder;

async function connect() {
  for (let i = 0; i < 100; i++) {
    const ports = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
    if (ports) {
      const tabs = await fetch(`http://127.0.0.1:${ports.split(/\r?\n/)[0]}/json/list`).then(r => r.json()).catch(() => []);
      const page = tabs.find(t => t.type === 'page' && t.url === 'about:blank');
      if (page) return new WebSocket(page.webSocketDebuggerUrl);
    }
    await delay(100);
  }
  throw new Error('Edge could not start the ch-2b compositor');
}

let id = 0;
async function evaluate(expression) {
  const current = ++id;
  socket.send(JSON.stringify({ id: current, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }));
  while (true) {
    const [event] = await once(socket, 'message', { signal: AbortSignal.timeout(25000) });
    const result = JSON.parse(event.data);
    if (result.id !== current) continue;
    const failure = result.error ?? result.result.exceptionDetails;
    assert(!failure, failure?.exception?.description ?? JSON.stringify(failure));
    return result.result.result.value;
  }
}

try {
  socket = await connect();
  await once(socket, 'open', { signal: AbortSignal.timeout(10000) });
  const [art, scene] = await Promise.all([
    readFile(new URL('art.js', anatomy), 'utf8'),
    readFile(join(chapter, 'scene.js'), 'utf8'),
  ]);
  const poses = requested.map(ch2bPose);
  const characterPoses = poses.filter(p => p.length);
  const parts = [...new Set(characterPoses.flatMap(p => p.map(([part]) => part)))];
  const layers = await evaluate(`(async () => { ${art}\n${scene}\nreturn makeAnatomyAssets(${JSON.stringify(parts)}).parts; })()`);
  const shotFile = join(work, 'poses.toonzscript');
  await writeFile(shotFile, `var poses = ${JSON.stringify(characterPoses)};`);
  const cutouts = characterPoses.length ? await renderCutout({
    work,
    shotFile,
    rigFile: new URL('articulate.toonzscript', anatomy),
    partNames: parts,
    frameCount: characterPoses.length,
    drawPart: part => Buffer.from(layers[part], 'base64'),
  }) : [];
  console.log(`OpenToonz rendered ${cutouts.length} frames`);

  const output = preview ? join(exportsDir, `motion-${from}-${from + length}.mp4`)
    : join(assets, 'remotion-picture.mp4');

  let finished;
  if (mode !== '--stills') {
    const voiceFile = join(assets, 'chapter-voice.wav');
    const scoreFile = join(assets, 'score.wav');
    const sec = length / fps;
    encoder = spawn(ffmpeg, [
      '-hide_banner', '-v', 'error', '-y',
      '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', 'pipe:0',
      ...(preview
        ? ['-an', '-vf', 'scale=640:360']
        : ['-i', voiceFile, '-i', scoreFile,
          '-filter_complex', '[1:a]pan=stereo|c0=c0|c1=c0,volume=1.24[v];[2:a]volume=0.76[m];[v][m]amix=inputs=2:duration=shortest:normalize=0,alimiter=limit=0.94[a]',
          '-map', '0:v:0', '-map', '[a]']),
      '-t', String(sec),
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output,
    ], { stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true });
    encoder.stdin.on('error', () => {});
    finished = once(encoder, 'close');
  }

  let cutoutIndex = 0;
  for (const [index, frame] of requested.entries()) {
    const pose = poses[index];
    const png = pose.length ? await readFile(cutouts[cutoutIndex++], 'base64') : null;
    const find = name => pose.find(([p]) => p === name)?.slice(1) ?? null;
    const findHand = () => pose.find(([p]) => p === 'hand-grip' || p === 'hand-near' || p === 'hand-brace' || p === 'hand-run-near')?.slice(1) ?? null;
    const anchors = pose.length ? {
      chest: find('chest'),
      neck: find('neck'),
      forearmNear: find('forearm-near'),
      forearmFar: find('forearm-far'),
      shinNear: find('shin-near'),
      shinFar: find('shin-far'),
      handNear: findHand(),
    } : null;
    const jpeg = await evaluate(`renderCh2bFrame(${frame}, ${JSON.stringify(png)}, ${JSON.stringify(anchors)})`);
    const buffer = Buffer.from(jpeg, 'base64');
    if (mode === '--stills') await writeFile(join(assets, `pose-${frame}.jpg`), buffer);
    else await new Promise((resolve, reject) => encoder.stdin.write(buffer, err => err ? reject(err) : resolve()));
  }

  if (encoder) {
    encoder.stdin.end();
    assert.equal((await finished)[0], 0, 'FFmpeg failed');
    console.log(output);
  }
} finally {
  socket?.close();
  if (encoder?.exitCode === null) encoder.kill();
  browser.kill();
  await browserDone;
  const cache = await realpath(work);
  assert(dirname(cache) === await realpath(tools) && basename(cache).startsWith('l4d-ch2b-'));
  await rm(cache, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
