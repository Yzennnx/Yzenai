import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const parts = ['body0', 'body1', 'body2', 'shoeFar', 'shoeNear',
  'legUpperFar', 'legLowerFar', 'legUpperNear', 'legLowerNear',
  'armUpperFar', 'armLowerFar', 'armUpperNear', 'armLowerNear'];

// The episode owns the work directory and removes it after compositing.
export async function renderCutout({ work, shotFile, startFrame = 0, frameCount,
  partNames = parts, extraParts = [], rigFile = new URL('./cutout-rig.toonzscript', import.meta.url), drawPart }) {
  assert(Number.isInteger(startFrame) && startFrame >= 0, 'OpenToonz needs a nonnegative starting frame');
  assert(Number.isInteger(frameCount) && frameCount > 0, 'OpenToonz needs a positive frame count');
  const workDir = await mkdtemp(join(work, 'opentoonz-'));
  const [shot, rig] = await Promise.all([
    readFile(shotFile, 'utf8'),
    readFile(rigFile, 'utf8'),
  ]);
  const shotParts = [...partNames, ...extraParts];
  for (const part of shotParts) {
    const png = await drawPart(part);
    assert(Buffer.isBuffer(png) && png.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
      `Missing or invalid PNG for OpenToonz part ${part}`);
    await writeFile(join(workDir, `${part}.png`), png);
  }

  const script = join(workDir, 'cutout.toonzscript');
  await writeFile(script, [
    `var workDir = ${JSON.stringify(workDir.replaceAll('\\', '/'))};`,
    `var parts = ${JSON.stringify(shotParts)};`,
    `var frameCount = ${frameCount};`,
    `var startFrame = ${startFrame};`,
    shot,
    rig,
  ].join('\n'));
  const executable = join(process.env.ProgramFiles, 'OpenToonz', 'OpenToonz.exe');
  const render = spawn(executable, [script], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let diagnostics = '';
  for (const stream of [render.stdout, render.stderr]) {
    stream.setEncoding('utf8').on('data', (chunk) => { diagnostics += chunk; });
  }
  // OpenToonz's script entry point can return 1 after a successful run.
  await once(render, 'close').catch((error) => {
    throw new Error(`Could not launch OpenToonz at ${executable}`, { cause: error });
  });
  const files = new Set(await readdir(workDir));
  return Array.from({ length: frameCount }, (_, index) => {
    const name = `cutout-${String(index + 1).padStart(5, '0')}.png`;
    assert(files.has(name), `OpenToonz did not render frame ${index + 1} of ${frameCount}. ${diagnostics}`);
    return join(workDir, name);
  });
}
