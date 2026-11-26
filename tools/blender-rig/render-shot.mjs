import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const RIG_3D_DIR = join(REPO_ROOT, 'assets', 'series-lead', 'rig-3d');
const DEFAULT_BLEND = join(RIG_3D_DIR, 'lead-rig.blend');
const VALID_RIGS = ['lead', 'hunter', 'smoker', 'witch', 'charger', 'tank'];
const RENDER_SCRIPT = join(__dirname, 'render-shot.py');
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function resolveBlendFile(rig = 'lead') {
  assert(VALID_RIGS.includes(rig), `Unknown rig '${rig}'. Valid: ${VALID_RIGS.join(', ')}`);
  if (rig === 'lead') return DEFAULT_BLEND;
  return join(RIG_3D_DIR, 'infected', `${rig}-rig.blend`);
}

export function resolveBlender() {
  if (process.env.BLENDER_BIN) return process.env.BLENDER_BIN;
  if (process.platform === 'win32') {
    const winCandidates = [
      'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe',
    ];
    for (const c of winCandidates) {
      if (existsSync(c)) return c;
    }
    return 'blender.exe';
  }
  const which = spawnSync('which', ['blender'], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  return 'blender';
}

async function assertValidPng(filePath) {
  const buf = await readFile(filePath);
  assert(buf.length > 64, `PNG file too small: ${filePath}`);
  assert(buf.subarray(0, 8).equals(PNG_MAGIC), `Invalid PNG signature: ${filePath}`);
}

/**
 * Render a stylized Series Lead still or transparent RGBA PNG sequence via headless Blender 5.2.
 * Mirrors tools/opentoonz/render-cutout.mjs ergonomics.
 *
 * @param {object} options
 * @param {string} [options.work] - Caller-owned temp directory (creates isolated blender-rig-* subdir)
 * @param {string} [options.out] - Explicit output PNG path (still) or directory (sequence)
 * @param {string} [options.rig='lead'] - Rig key: lead | hunter | smoker | witch | charger | tank
 * @param {string} [options.blendFile] - Optional explicit .blend path override
 * @param {string} [options.camera='3q-front'] - Preset key in cameras.json
 * @param {string} [options.action] - Preset key in actions.json (lead) or infected-actions.json (infected)
 * @param {string} [options.expression] - Optional expression override (head .. head-relief, lead only)
 * @param {string} [options.lighting='neutral-day'] - Preset key in lighting.json
 * @param {boolean|string} [options.gloves=false]
 * @param {boolean|string} [options.backpack=false]
 * @param {string} [options.condition='clean'] - clean | sweat | frost | scorch | dusty
 * @param {string} [options.prop='none'] - none | flashlight | pipe | mug | phone
 * @param {number} [options.fps=24] - 12 or 24
 * @param {number|null} [options.frame=null] - Set integer frame for single still mode
 * @param {number} [options.startFrame=1]
 * @param {number} [options.frameCount=24]
 * @param {number} [options.width=1080]
 * @param {number} [options.height=1920]
 * @param {number} [options.samples=8]
 * @param {number} [options.pushIn=0]
 * @param {string|null} [options.exportGuide=null] - Path to save transparent horizon/floor-grid PNG
 * @returns {Promise<{frames: string[], guidePath: string|null, outDir: string}>}
 */
export async function renderRigShot({
  work,
  out,
  rig = 'lead',
  blendFile,
  camera = '3q-front',
  action,
  expression,
  lighting = 'neutral-day',
  gloves = false,
  backpack = false,
  condition = 'clean',
  handPose = 'auto',
  prop = 'none',
  env = 'none',
  travel = 0,
  floorProp = 'none',
  impactFrame = 18,
  fps = 24,
  frame = null,
  startFrame = 1,
  frameCount = 24,
  width = 1080,
  height = 1920,
  samples = 8,
  pushIn = 0,
  exportGuide = null,
  exportTracks = null,
} = {}) {
  assert(VALID_RIGS.includes(rig), `Unknown rig '${rig}'. Valid: ${VALID_RIGS.join(', ')}`);
  const resolvedBlend = blendFile || resolveBlendFile(rig);
  const resolvedAction = action || (rig === 'lead' ? 'idle-alert' : 'infected-idle');

  assert(existsSync(resolvedBlend), `Missing ${rig} rig blend file: ${resolvedBlend}`);
  assert(fps === 12 || fps === 24 || fps === 30, `fps must be 12, 24, or 30, got ${fps}`);
  assert(Number.isInteger(width) && width > 0, `Invalid width: ${width}`);
  assert(Number.isInteger(height) && height > 0, `Invalid height: ${height}`);

  let targetOut = out;
  if (!targetOut) {
    assert(work, 'Provide either `out` or `work` directory');
    targetOut = await mkdtemp(join(work, 'blender-rig-'));
  }

  const boolStr = (v) => (v === true || v === 'on' || v === '1' || v === 1 ? 'on' : 'off');
  const args = [
    '--background',
    resolvedBlend,
    '--python',
    RENDER_SCRIPT,
    '--',
    '--rig', rig,
    '--camera', camera,
    '--action', resolvedAction,
    '--lighting', lighting,
    '--gloves', boolStr(gloves),
    '--backpack', boolStr(backpack),
    '--condition', condition,
    '--hand-pose', handPose,
    '--prop', prop,
    '--fps', String(fps),
    '--width', String(width),
    '--height', String(height),
    '--samples', String(samples),
    '--push-in', String(pushIn),
    '--out', targetOut,
  ];

  if (expression) args.push('--expression', expression);
  if (env && env !== 'none') args.push('--env', env);
  if (travel) args.push('--travel', String(travel));
  if (floorProp && floorProp !== 'none') args.push('--floor-prop', floorProp, '--impact-frame', String(impactFrame));
  if (exportGuide) args.push('--export-guide', exportGuide);
  if (exportTracks) args.push('--export-tracks', exportTracks);

  const isStill = frame !== null && frame !== undefined;
  if (isStill) {
    assert(Number.isInteger(frame) && frame >= 1, `Invalid frame: ${frame}`);
    args.push('--frame', String(frame));
  } else {
    assert(Number.isInteger(startFrame) && startFrame >= 1, `Invalid startFrame: ${startFrame}`);
    assert(Number.isInteger(frameCount) && frameCount > 0, `Invalid frameCount: ${frameCount}`);
    const endFrame = startFrame + frameCount - 1;
    args.push('--start', String(startFrame), '--end', String(endFrame));
  }

  const blenderBin = resolveBlender();
  const child = spawn(blenderBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  let stdout = '';
  child.stdout.on('data', (d) => { stdout += d.toString(); });
  child.stderr.on('data', (d) => { stderr += d.toString(); });

  const [code] = await once(child, 'close');
  assert.equal(code, 0, `Blender render-shot.py exited with ${code}.\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);

  let frames = [];
  let outDir = targetOut;
  if (isStill) {
    const stillPath = targetOut.toLowerCase().endsWith('.png')
      ? targetOut
      : join(targetOut, `frame-${String(frame).padStart(5, '0')}.png`);
    await assertValidPng(stillPath);
    frames = [stillPath];
    outDir = dirname(stillPath);
  } else {
    const entries = (await readdir(targetOut))
      .filter((f) => /^frame-\d+\.png$/i.test(f))
      .sort();
    assert(entries.length > 0, `No rendered PNG frames found in ${targetOut}`);
    frames = entries.map((f) => join(targetOut, f));
    for (const fp of frames) {
      await assertValidPng(fp);
    }
  }

  if (exportGuide) {
    await assertValidPng(exportGuide);
  }

  return { frames, guidePath: exportGuide || null, outDir };
}

// CLI entrypoint
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const opts = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--rig') { opts.rig = next; i++; }
    else if (a === '--blend') { opts.blendFile = next; i++; }
    else if (a === '--camera') { opts.camera = next; i++; }
    else if (a === '--action') { opts.action = next; i++; }
    else if (a === '--expression') { opts.expression = next; i++; }
    else if (a === '--lighting') { opts.lighting = next; i++; }
    else if (a === '--gloves') { opts.gloves = next; i++; }
    else if (a === '--backpack') { opts.backpack = next; i++; }
    else if (a === '--condition') { opts.condition = next; i++; }
    else if (a === '--hand-pose') { opts.handPose = next; i++; }
    else if (a === '--prop') { opts.prop = next; i++; }
    else if (a === '--env') { opts.env = next; i++; }
    else if (a === '--travel') { opts.travel = Number(next); i++; }
    else if (a === '--floor-prop') { opts.floorProp = next; i++; }
    else if (a === '--impact-frame') { opts.impactFrame = Number(next); i++; }
    else if (a === '--fps') { opts.fps = Number(next); i++; }
    else if (a === '--frame') { opts.frame = Number(next); i++; }
    else if (a === '--start') { opts.startFrame = Number(next); i++; }
    else if (a === '--count') { opts.frameCount = Number(next); i++; }
    else if (a === '--width') { opts.width = Number(next); i++; }
    else if (a === '--height') { opts.height = Number(next); i++; }
    else if (a === '--samples') { opts.samples = Number(next); i++; }
    else if (a === '--push-in') { opts.pushIn = Number(next); i++; }
    else if (a === '--export-guide') { opts.exportGuide = next; i++; }
    else if (a === '--export-tracks') { opts.exportTracks = next; i++; }
    else if (a === '--out') { opts.out = next; i++; }
    else if (a === '--work') { opts.work = next; i++; }
  }
  const result = await renderRigShot(opts);
  console.log(JSON.stringify(result, null, 2));
}
