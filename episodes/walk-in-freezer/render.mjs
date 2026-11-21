import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { renderCutout } from '../../tools/opentoonz/render-cutout.mjs';
import { fps } from '../../assets/series-lead/anatomy-prototype/poses.mjs';
import { duration, freezerPose } from './poses.mjs';

const episode = import.meta.dirname;
const anatomy = new URL('../../assets/series-lead/anatomy-prototype/', import.meta.url);
const tools = join(process.env.LOCALAPPDATA, 'AIShortVideos');
const release = (await readdir(tools)).find(name => /^ffmpeg-.*_build$/.test(name));
assert(release, 'Portable FFmpeg is missing');
const ffmpeg = join(tools, release, 'bin', 'ffmpeg.exe');
const edge = join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');

const [mode, ...args] = process.argv.slice(2);
assert(!mode || ['--preview', '--opening', '--picture-range'].includes(mode) || (mode === '--stills' && args.length > 0),
  'Usage: node render.mjs [--stills FRAME ...] | [--preview START LEN] | [--opening [TAKE]]');

const preview = mode === '--preview';
const opening = mode === '--opening';
const range = mode === '--picture-range';
const openingTake = opening ? (args[0] ?? 'opening-measured') : null;
const from = preview || range ? Number(args[0] ?? 0) : 0;
const length = preview || range ? Number(args[1] ?? 144) : (opening ? 14 * fps : duration * fps);
assert(Number.isInteger(from) && Number.isInteger(length) && from >= 0 &&
  length > 0 && from + length <= duration * fps, 'Frame range must fit the episode');

const requested = mode === '--stills' ? args.map(Number) : Array.from({ length }, (_, i) => i + from);
assert(requested.every(f => Number.isInteger(f) && f >= 0 && f < duration * fps));

const assets = join(episode, 'assets');
const exportsDir = join(episode, 'exports');
await mkdir(assets, { recursive: true });
await mkdir(exportsDir, { recursive: true });

const work = await mkdtemp(join(tools, 'freezer-render-'));
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
      const tabs = await fetch(`http://127.0.0.1:${ports.split(/\r?\n/)[0]}/json/list`)
        .then(r => r.json()).catch(() => []);
      const page = tabs.find(tab => tab.type === 'page' && tab.url === 'about:blank');
      if (page) return new WebSocket(page.webSocketDebuggerUrl);
    }
    await delay(100);
  }
  throw new Error('Edge could not start the freezer compositor');
}

let id = 0;
async function evaluate(expression) {
  const current = ++id;
  socket.send(JSON.stringify({
    id: current,
    method: 'Runtime.evaluate',
    params: { expression, awaitPromise: true, returnByValue: true },
  }));
  while (true) {
    const [event] = await once(socket, 'message', { signal: AbortSignal.timeout(25000) });
    const result = JSON.parse(event.data);
    if (result.id !== current) continue;
    const failure = result.error ?? result.result.exceptionDetails;
    assert(!failure, failure?.exception?.description ?? JSON.stringify(failure));
    return result.result.result.value;
  }
}

function sound(totalSec) {
  const noise = '(random(0)*2-1)';
  const dust = (t, v, k) => `${v}*${noise}*exp(-${k}*(t-${t})^2)`;
  const tone = (t, v, hz, d) => String.raw`if(gte(t\,${t})\,${v}*exp(-${d}*(t-${t}))*sin(2*PI*${hz}*(t-${t}))\,0)`;
  const steps = [0.25, 0.85, 1.45, 2.05];
  const layers = [
    // Unrelenting industrial freezer compressor hum through the entire fatal ending
    `0.008*sin(2*PI*62*t)+0.005*sin(2*PI*124*t)+0.004*${noise}`,
    // Heavy insulated door slam & latch clunk at 0.90s
    dust(0.90, 0.14, 180), tone(0.90, 0.14, 76, 12), tone(0.94, 0.08, 220, 28),
    // Footsteps
    ...steps.filter(t => t < totalSec).flatMap(t => [dust(t, 0.045, 540), tone(t, 0.065, 108, 30)]),
    // Bare palm slap on aluminum push bar (4.08s) + sharp ice freeze crackle (4.35s, 4.75s) + yank (5.80s)
    dust(4.08, 0.12, 1600), tone(4.08, 0.09, 340, 38),
    dust(4.35, 0.08, 1200), tone(4.38, 0.05, 1650, 44),
    dust(4.78, 0.06, 950), tone(4.80, 0.04, 1420, 42),
    dust(5.80, 0.13, 620), tone(5.80, 0.07, 190, 18),
  ];
  if (totalSec > 14) {
    layers.push(
      // Cutaway 1 heartbeat / vessel constriction pulse (15..21s)
      ...[15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0].map(t => tone(t, 0.06, 68, 14)),
      // Clumsy slip on bar (29.2s)
      dust(29.2, 0.07, 700), tone(29.2, 0.05, 290, 24),
      // Collapse palm brace thump onto metal crate (34.25s)
      dust(34.25, 0.12, 320), tone(34.25, 0.11, 95, 16),
      // Vasodilation warm surge whoosh (38.0s)
      dust(38.0, 0.06, 8), tone(38.0, 0.07, 118, 4),
      // Relay clunk & fluorescent flicker (47.42s)
      dust(47.42, 0.11, 1800), tone(47.42, 0.10, 480, 42), tone(47.56, 0.05, 120, 10),
      // Frozen jammed plunger: dull hard impact + frost chip (51.85s), desperate second jab (54.10s) — NO latch click!
      dust(51.85, 0.10, 1400), tone(51.85, 0.09, 175, 28), tone(52.05, 0.04, 1520, 48),
      dust(54.10, 0.11, 1500), tone(54.10, 0.09, 162, 26),
      // Heavy body collapse onto diamond-plate steel floor (58.92s) + slowing final heartbeats stopping at 60.2s
      dust(58.92, 0.18, 120), tone(58.92, 0.16, 64, 10),
      tone(57.8, 0.07, 62, 14), tone(59.1, 0.06, 58, 13), tone(60.25, 0.05, 54, 11),
      // Subtle icy wind/frost resonance as body freezes in silence
      String.raw`if(gte(t\,60.25)\,0.014*sin(2*PI*440*t)*exp(-0.9*(t-60.25))\,0)`,
    );
  }
  return `aevalsrc=${layers.join('+')}:s=48000:d=${totalSec}`;
}

try {
  socket = await connect();
  await once(socket, 'open', { signal: AbortSignal.timeout(10000) });
  const [art, scene] = await Promise.all([
    readFile(new URL('art.js', anatomy), 'utf8'),
    readFile(join(episode, 'scene.js'), 'utf8'),
  ]);
  const poses = requested.map(freezerPose);
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
    : opening ? join(exportsDir, `opening-${openingTake}.mp4`)
    : range ? join(exportsDir, `picture-${from}-${from + length}.mp4`)
    : join(assets, 'remotion-picture.mp4');

  let finished;
  if (mode !== '--stills') {
    const audioFile = opening ? join(assets, `${openingTake}.wav`) : join(assets, 'episode-voice.wav');
    const sec = length / fps;
    encoder = spawn(ffmpeg, [
      '-hide_banner', '-v', 'error', '-y',
      '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', 'pipe:0',
      ...(preview || range
        ? ['-an', ...(preview ? ['-vf', 'scale=360:640'] : [])]
        : ['-i', audioFile, '-f', 'lavfi', '-i', sound(sec),
          '-filter_complex', '[1:a][2:a]amix=inputs=2:normalize=0,alimiter=limit=0.94[a]',
          '-map', '0:v:0', '-map', '[a]', ...(opening ? ['-vf', 'scale=540:960'] : [])]),
      '-t', String(sec),
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output,
    ], { stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true });
    encoder.stdin.on('error', () => {});
    finished = once(encoder, 'close');
  }

  let cutoutIndex = 0;
  for (const [index, frame] of requested.entries()) {
    const pose = poses[index];
    const png = pose.length ? await readFile(cutouts[cutoutIndex++], 'base64') : null;
    const anchors = pose.length ? {
      pelvis: pose.find(([p]) => p === 'pelvis')?.slice(1),
      chest: pose.find(([p]) => p === 'chest')?.slice(1),
      shoulder: pose.find(([p]) => p === 'shoulder-near')?.slice(1),
      head: pose.find(([p]) => p.startsWith('head'))?.slice(1),
      wrist: pose.at(-1)?.slice(1),
    } : null;
    const jpeg = await evaluate(`renderFreezerFrame(${frame}, ${JSON.stringify(png)}, ${JSON.stringify(anchors)})`);
    const buffer = Buffer.from(jpeg, 'base64');
    if (mode === '--stills') {
      await writeFile(join(assets, `pose-${frame}.jpg`), buffer);
    } else {
      await new Promise((resolve, reject) => encoder.stdin.write(buffer, err => err ? reject(err) : resolve()));
    }
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
  assert(dirname(cache) === await realpath(tools) && basename(cache).startsWith('freezer-render-'));
  await rm(cache, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
