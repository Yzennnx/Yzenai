import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { copyFile, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { renderCutout } from '../../../tools/opentoonz/render-cutout.mjs';
import { floor, fps, gaitAt, rigAt, scenes, seat, table } from './poses.mjs';

const tools = join(process.env.LOCALAPPDATA, 'AIShortVideos');
const release = (await readdir(tools)).find(name => /^ffmpeg-.*_build$/.test(name));
assert(release, 'Portable FFmpeg is missing');
const ffmpeg = join(tools, release, 'bin', 'ffmpeg.exe');
const edge = join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
const work = await mkdtemp(join(tools, 'anatomy-test-'));
const reference = process.argv[2] === '--reference';
const motion = process.argv[2] === '--motion';
const panels = [
  { id: 'ready', scene: 0, frame: 0, crop: [126,256,295,536], label: 'Ready stance', contact: 'Hips, chest, and head on separate pivots' },
  { id: 'sit', scene: 0, frame: 62, crop: [111,260,335,531], label: 'Seat contact', contact: 'Hips on the seat, feet planted' },
  { id: 'brace', scene: 1, frame: 30, crop: [130,248,400,545], label: 'Palm brace', contact: 'Palm planted, free elbow trailing', head: 'head-strain' },
  { id: 'step', scene: 2, frame: 36, crop: [168,254,305,540], label: 'Heel landing', contact: 'Front heel down, toes still lifted' },
];

function readPage(page) {
  const dom = execFileSync(edge, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--disable-background-networking', '--disable-extensions', '--dump-dom',
    `--user-data-dir=${join(work, 'edge')}`, pathToFileURL(page).href],
  { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 16 * 1024 * 1024, timeout: 30000 });
  return dom.match(/<pre id="result">([^<]+)<\/pre>/)?.[1];
}

async function drawInEdge(profileName, scripts, functionName, args) {
  const profile = join(work, profileName);
  const browser = spawn(edge, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--disable-background-networking', '--disable-extensions', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  const stopped = once(browser, 'close');
  let socket;
  try {
    let endpoint;
    for (let attempt = 0; attempt < 100 && !endpoint; attempt++) {
      const port = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
      if (port) {
        const tabs = await fetch(`http://127.0.0.1:${port.trim().split(/\r?\n/)[0]}/json/list`)
          .then(response => response.json()).catch(() => []);
        endpoint = tabs.find(tab => tab.type === 'page' && tab.url === 'about:blank')?.webSocketDebuggerUrl;
      }
      if (!endpoint) await delay(100);
    }
    assert(endpoint, 'Edge did not open the reference renderer');
    socket = new WebSocket(endpoint);
    await once(socket, 'open', { signal: AbortSignal.timeout(10000) });
    const received = once(socket, 'message', { signal: AbortSignal.timeout(15000) });
    socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
      expression: `(async () => {
        ${scripts.join('\n')}
        return JSON.stringify(await window[${JSON.stringify(functionName)}](...${JSON.stringify(args)}));
      })()`,
      awaitPromise: true,
      returnByValue: true,
    } }));
    const [event] = await received;
    const response = JSON.parse(event.data);
    const failure = response.error ?? response.result?.exceptionDetails;
    assert(!failure, failure?.exception?.description ?? JSON.stringify(failure));
    assert(typeof response.result?.result?.value === 'string', 'Edge did not return reference images');
    return JSON.parse(response.result.result.value);
  } finally {
    socket?.close();
    browser.kill();
    await stopped;
  }
}

async function renderMotion() {
  const art = await readFile(new URL('./art.js', import.meta.url), 'utf8');
  const motionArt = await readFile(new URL('./motion-reference.js', import.meta.url), 'utf8');
  const requested = process.argv[3];
  assert(!requested || ['run', 'walk', 'sit', 'brace'].includes(requested), 'Choose run, walk, sit, or brace');
  for (const action of requested ? [requested] : ['run', 'walk', 'sit', 'brace']) {
    const gaitFrames = { run: 72, walk: 84 }[action];
    const scene = scenes.find(({ id }) => id === action);
    const frames = gaitFrames ?? scene.seconds * fps;
    const poses = Array.from({ length: frames }, (_, frame) =>
      gaitFrames ? gaitAt(action, frame) : rigAt(scene, frame));
    const views = gaitFrames ? ['side', 'front', 'rear'] : action === 'sit' ? ['front'] : ['front', 'rear'];
    const images = await drawInEdge(`edge-${action}`, [art, motionArt], 'drawMotionReference',
      [action, views, poses, floor, fps]);
    for (const view of views) {
      const shot = `${action}-${view}`;
      assert.equal(images[view].length, frames);
      await Promise.all(images[view].map((png, frame) =>
        writeFile(join(work, `${shot}-${String(frame).padStart(3, '0')}.png`), Buffer.from(png, 'base64'))));
      const output = join(import.meta.dirname, `${shot}.mp4`);
      execFileSync(ffmpeg, ['-hide_banner', '-v', 'error', '-y', '-framerate', String(fps),
        '-i', join(work, `${shot}-%03d.png`), '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', output], { stdio: 'inherit', windowsHide: true });
      console.log(`${output} (${frames} frames)`);
    }
  }
}

try {
  if (motion) {
    await renderMotion();
  } else {
    await renderAnatomy();
  }
} finally {
  const cache = await realpath(work);
  assert(dirname(cache) === await realpath(tools) && basename(cache).startsWith('anatomy-test-'));
  await rm(cache, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    .catch(error => console.warn(`Could not clean prototype cache: ${error.message}`));
}

async function renderAnatomy() {
  const poses = reference ? panels.map(({ scene, frame, head }) =>
    rigAt({ ...scenes[scene], expression: head ? [[0, head]] : [] }, frame),
  ) : scenes.flatMap(scene => Array.from({ length: scene.seconds * fps }, (_, frame) => {
    try {
      return rigAt(scene, frame);
    } catch (error) {
      throw new Error(`${scene.id}, frame ${frame}: ${error.message}`, { cause: error });
    }
  }));
  const partNames = [...new Set([
    ...poses.flatMap(pose => pose.map(([part]) => part)), 'hand-grip',
    ...(reference ? ['head-notice', 'head-alarm', 'head-strain', 'head-relief'] : []),
  ])];
  const art = await readFile(new URL('./art.js', import.meta.url), 'utf8');
  const page = join(work, 'art.html');
  const layout = { floor, seat, table, ids: (reference ? panels : scenes).map(scene => scene.id) };
  await writeFile(page, `<!doctype html><meta charset="utf-8"><pre id="result"></pre>
    <script>${art}</script><script>
    document.getElementById('result').textContent =
      JSON.stringify(makeAnatomyAssets(${JSON.stringify(partNames)}, ${JSON.stringify(layout)}));
    </script>`);
  const result = readPage(page);
  assert(result, 'Edge did not create the artwork');
  const { parts, backgrounds } = JSON.parse(result);
  const shotFile = join(work, 'poses.toonzscript');
  await writeFile(shotFile, `var poses = ${JSON.stringify(poses)};`);
  const frames = await renderCutout({
    work,
    shotFile,
    rigFile: new URL('./articulate.toonzscript', import.meta.url),
    partNames,
    frameCount: poses.length,
    drawPart: part => Buffer.from(parts[part], 'base64'),
  });

  if (reference) {
    const referenceArt = await readFile(new URL('./reference.js', import.meta.url), 'utf8');
    const pngFrames = await Promise.all(frames.map(async file => (await readFile(file)).toString('base64')));
    const view = panels.map(({ crop, ...panel }) => ({ ...panel, crop: crop.map(value => value * 2) }));
    const walkingPoses = [0, 3, 8, 16].map(frame => [frame, gaitAt('walk', frame)]);
    const { overview, walking, reactions } = await drawInEdge('sheet-edge', [art, referenceArt], 'drawAnatomyReference',
      [view, pngFrames, parts, backgrounds, walkingPoses, floor]);
    for (const [image, height, name] of [
      [overview, 1524, 'reference-sheet.png'], [walking, 590, 'walking-front.png'],
      [reactions, 470, 'reactions-front.png'],
    ]) {
      const png = Buffer.from(image, 'base64');
      assert(png.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')));
      assert(png.readUInt32BE(16) === 1600 && png.readUInt32BE(20) === height);
      const output = join(import.meta.dirname, '..', name);
      await writeFile(output, png);
      console.log(output);
    }
  } else {
    const encode = args => execFileSync(ffmpeg, ['-hide_banner', '-v', 'error', '-y', ...args],
      { stdio: 'inherit', windowsHide: true });
    let first = 1;
    for (const scene of scenes) {
      const background = join(work, `${scene.id}.png`);
      await writeFile(background, Buffer.from(backgrounds[scene.id], 'base64'));
      encode(['-loop', '1', '-framerate', String(fps), '-i', background,
        '-framerate', String(fps), '-start_number', String(first),
        '-i', join(dirname(frames[0]), 'cutout-%05d.png'), '-filter_complex', '[0:v][1:v]overlay',
        '-frames:v', String(scene.seconds * fps), '-an', '-c:v', 'libx264', '-preset', 'fast',
        '-crf', '17', '-pix_fmt', 'yuv420p', join(work, `${scene.id}.mp4`)]);
      first += scene.seconds * fps;
    }
    const list = join(work, 'sequence.txt');
    await writeFile(list, scenes.map(({ id }) => `file '${id}.mp4'`).join('\n') + '\n');
    const rendered = join(work, 'preview.mp4');
    encode(['-f', 'concat', '-safe', '1', '-i', list, '-c', 'copy', '-movflags', '+faststart', rendered]);
    const output = join(import.meta.dirname, 'anatomy-preview.mp4');
    await copyFile(rendered, output);
    for (const { id } of scenes) {
      await copyFile(join(work, `${id}.mp4`), join(import.meta.dirname, `${id}.mp4`));
    }
    console.log(`Rendered and checked ${frames.length} OpenToonz poses.\n${output}`);
  }
}
