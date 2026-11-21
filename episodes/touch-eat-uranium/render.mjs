import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { renderCutout } from '../../tools/opentoonz/render-cutout.mjs';
import { fps } from '../../assets/series-lead/anatomy-prototype/poses.mjs';
import { duration, uraniumPose } from './poses.mjs';

const episode = import.meta.dirname;
const anatomy = new URL('../../assets/series-lead/anatomy-prototype/', import.meta.url);
const tools = join(process.env.LOCALAPPDATA, 'AIShortVideos');
const release = (await readdir(tools)).find(name => /^ffmpeg-.*_build$/.test(name));
assert(release, 'Portable FFmpeg is missing');
const ffmpeg = join(tools, release, 'bin', 'ffmpeg.exe');
const edge = join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
const [mode, ...frames] = process.argv.slice(2);
assert(!mode || ['--preview', '--picture-range'].includes(mode) || (mode === '--stills' && frames.length > 0));
const preview = mode === '--preview';
const range = mode === '--picture-range';
const from = preview || range ? Number(frames[0] ?? 0) : 0;
const length = preview || range ? Number(frames[1] ?? 384) : duration * fps;
assert(Number.isInteger(from) && Number.isInteger(length) && from >= 0 &&
  length > 0 && from + length <= duration * fps, 'Frame range must fit the episode');
const requested = mode === '--stills' ? frames.map(Number) :
  Array.from({ length }, (_, frame) => frame + from);
assert(requested.every(frame => Number.isInteger(frame) && frame >= 0 && frame < duration * fps));
const manifest = JSON.parse(await readFile(join(episode, 'remotion-edit.json'), 'utf8'));
assert.equal(manifest.duration, duration);
const assets = join(episode, 'assets');
await mkdir(assets, { recursive: true });
const work = await mkdtemp(join(tools, 'uranium-render-'));
const profile = join(work, 'edge');
const browser = spawn(edge, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--disable-background-networking', '--disable-extensions', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
const browserDone = once(browser, 'close');
let socket, encoder;

async function connect() {
  for (let i = 0; i < 100; i++) {
    const ports = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
    if (ports) {
      const tabs = await fetch(`http://127.0.0.1:${ports.split(/\r?\n/)[0]}/json/list`)
        .then(response => response.json()).catch(() => []);
      const page = tabs.find(tab => tab.type === 'page' && tab.url === 'about:blank');
      if (page) return new WebSocket(page.webSocketDebuggerUrl);
    }
    await delay(100);
  }
  throw new Error('Edge could not start the uranium compositor');
}

let id = 0;
async function evaluate(expression) {
  const current = ++id;
  socket.send(JSON.stringify({ id: current, method: 'Runtime.evaluate', params: {
    expression, awaitPromise: true, returnByValue: true,
  } }));
  while (true) {
    const [event] = await once(socket, 'message', { signal: AbortSignal.timeout(20000) });
    const result = JSON.parse(event.data);
    if (result.id !== current) continue;
    const failure = result.error ?? result.result.exceptionDetails;
    assert(!failure, failure?.exception?.description ?? JSON.stringify(failure));
    return result.result.result.value;
  }
}

function sound() {
  const noise = '(random(0)*2-1)';
  const dust = (t, v, tightness) => `${v}*${noise}*exp(-${tightness}*(t-${t})^2)`;
  const tone = (t, v, hz, decay) => String.raw`if(gte(t\,${t})\,${v}*exp(-${decay}*(t-${t}))*sin(2*PI*${hz}*(t-${t}))\,0)`;
  const layers = ['0.006*sin(2*PI*57*t)', `0.006*${noise}`,
    dust(3,.055,650), tone(3,.028,420,35), dust(9.8,.03,440),
    tone(10.05,.075,126,10), dust(10.05,.032,140),
    tone(22.04,.046,93,5), tone(34,.036,105,5),
    dust(45.83,.036,420), tone(45.83,.026,260,33),
    dust(55.92,.075,650), tone(55.92,.072,615,31)];
  return `aevalsrc=${layers.join('+')}:s=48000:d=${duration}`;
}

try {
  socket = await connect();
  await once(socket, 'open', { signal: AbortSignal.timeout(10000) });
  const [art, scene] = await Promise.all([readFile(new URL('art.js', anatomy), 'utf8'),
    readFile(join(episode, 'scene.js'), 'utf8')]);
  const poses = requested.map(uraniumPose);
  const characterPoses = poses.filter(pose => pose.length);
  const parts = [...new Set(characterPoses.flatMap(pose => pose.map(([part]) => part)))];
  const layers = await evaluate(`(async () => { ${art}\n${scene}\n
    return makeAnatomyAssets(${JSON.stringify(parts)}).parts; })()`);
  const shotFile = join(work, 'poses.toonzscript');
  await writeFile(shotFile, `var poses = ${JSON.stringify(characterPoses)};`);
  const cutouts = characterPoses.length ? await renderCutout({ work, shotFile,
    rigFile: new URL('articulate.toonzscript', anatomy), partNames: parts,
    frameCount: characterPoses.length, drawPart: part => Buffer.from(layers[part], 'base64') }) : [];
  console.log(`OpenToonz rendered ${cutouts.length} frames`);

  const output = preview || range ? join(episode, 'exports', `${preview ? 'motion' : 'picture'}-${from}-${from + length}.mp4`) : join(assets, 'remotion-picture.mp4');
  await mkdir(join(episode, 'exports'), {recursive:true});
  let finished;
  if (mode !== '--stills') {
    encoder = spawn(ffmpeg, ['-hide_banner', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps),
      '-vcodec', 'mjpeg', '-i', 'pipe:0',
      ...(preview || range ? ['-an', ...(preview ? ['-vf', 'scale=540:960'] : [])] : ['-i', join(assets, 'episode-voice.wav'), '-f', 'lavfi', '-i', sound(),
      '-filter_complex', '[1:a][2:a]amix=inputs=2:normalize=0,alimiter=limit=0.94[a]', '-map', '0:v:0', '-map', '[a]']),
      '-t', String(length / fps), '-c:v', 'libx264', '-preset', 'fast', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output],
    { stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true });
    encoder.stdin.on('error', () => {});
    finished = once(encoder, 'close');
  }
  let cutoutIndex = 0;
  for (const [index, frame] of requested.entries()) {
    const png = poses[index].length ? await readFile(cutouts[cutoutIndex++], 'base64') : null;
    const pose = poses[index];
    const anchors = { wrist: pose.at(-1)?.slice(1), head: pose.find(([part]) => part.startsWith('head'))?.slice(1) };
    const jpeg = await evaluate(`renderUraniumFrame(${frame}, ${JSON.stringify(png)}, ${JSON.stringify(anchors)})`);
    const buffer = Buffer.from(jpeg, 'base64');
    if (mode === '--stills') await writeFile(join(assets, `pose-${frame}.jpg`), buffer);
    else await new Promise((resolve, reject) => encoder.stdin.write(buffer, error => error ? reject(error) : resolve()));
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
  assert(dirname(cache) === await realpath(tools) && basename(cache).startsWith('uranium-render-'));
  await rm(cache, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
