#!/usr/bin/env node
/**
 * Serial Blender 5.2 Native-30fps 3D-Set + Character Renderer for Ch 3A Hybrid Preview (32.4s -> 52.0s).
 * Renders real 3D cel-shaded ground & civic plaza structures (--env civic-plaza) with world-space
 * stride travel (--travel), real 3D camera push-ins (--push-in), and 3D glass-shard crush (--floor-prop).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderRigShot, resolveBlender } from '../../../../tools/blender-rig/render-shot.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../..');
const WORK_DIR = join(__dirname, 'assets', 'hybrid-preview-3d');

rmSync(WORK_DIR, { recursive: true, force: true });
mkdirSync(WORK_DIR, { recursive: true });

async function main() {
  console.log('=== Step 1/7: 3D Lead floor-level on 3D civic-plaza (30 fps, 84f, travel=0.55m, push-in=0.08) ===');
  await renderRigShot({
    rig: 'lead',
    work: WORK_DIR,
    out: join(WORK_DIR, 'lead-floor'),
    camera: 'floor-level',
    action: 'stealth-crouch-walk',
    expression: 'head-sneak',
    lighting: 'cold-blue',
    env: 'civic-plaza',
    travel: 0.55,
    pushIn: 0.08,
    gloves: true,
    backpack: true,
    fps: 30,
    startFrame: 1,
    frameCount: 84,
    width: 1920,
    height: 1080,
    samples: 4,
  });

  console.log('=== Step 2/7: 3D Lead 3q-back-ots on 3D civic-plaza (30 fps, 90f, travel=0.45m, push-in=0.12) ===');
  await renderRigShot({
    rig: 'lead',
    work: WORK_DIR,
    out: join(WORK_DIR, 'lead-ots'),
    camera: '3q-back-ots',
    action: 'stealth-crouch-walk',
    expression: 'head-dread',
    lighting: 'horror-dark-rim',
    env: 'civic-plaza',
    travel: 0.45,
    pushIn: 0.12,
    gloves: true,
    backpack: true,
    fps: 30,
    startFrame: 1,
    frameCount: 90,
    width: 1920,
    height: 1080,
    samples: 4,
  });

  console.log('=== Step 3/7: 3D Witch sobbing overlay for OTS (30 fps, 48f cycle, transparent) ===');
  await renderRigShot({
    rig: 'witch',
    work: WORK_DIR,
    out: join(WORK_DIR, 'witch-sob'),
    camera: '3q-front',
    action: 'witch-sobbing',
    lighting: 'horror-dark-rim',
    fps: 30,
    startFrame: 1,
    frameCount: 48,
    width: 1920,
    height: 1080,
    samples: 4,
  });

  console.log('=== Step 4/7: 3D boot-macro glass crunch on 3D civic-plaza (30 fps, 48f, impact=30, tracks) ===');
  await renderRigShot({
    rig: 'lead',
    work: WORK_DIR,
    out: join(WORK_DIR, 'boot-macro-glass'),
    camera: 'boot-macro',
    action: 'stealth-crouch-walk',
    expression: 'head-sneak',
    lighting: 'horror-dark-rim',
    env: 'civic-plaza',
    floorProp: 'glass-shard',
    impactFrame: 30,
    pushIn: 0.06,
    gloves: true,
    backpack: true,
    fps: 30,
    startFrame: 1,
    frameCount: 48,
    width: 1920,
    height: 1080,
    samples: 4,
    exportTracks: join(WORK_DIR, 'boot-macro-tracks.json'),
  });

  console.log('=== Step 5/7: 3D Lead 3q-front frozen on 3D civic-plaza (30 fps, 72f, real 3D push-in=0.14) ===');
  await renderRigShot({
    rig: 'lead',
    work: WORK_DIR,
    out: join(WORK_DIR, 'lead-freeze'),
    camera: '3q-front',
    action: 'idle-alert',
    expression: 'head-alarm',
    lighting: 'horror-dark-rim',
    env: 'civic-plaza',
    pushIn: 0.14,
    gloves: true,
    backpack: true,
    fps: 30,
    startFrame: 1,
    frameCount: 72,
    width: 1920,
    height: 1080,
    samples: 4,
  });

  console.log('=== Step 6/7: 3D Witch 3q-front alert-lift on 3D civic-plaza (30 fps, 108f, real 3D push-in=0.22) ===');
  await renderRigShot({
    rig: 'witch',
    work: WORK_DIR,
    out: join(WORK_DIR, 'witch-alert'),
    camera: '3q-front',
    action: 'witch-alert-lift',
    lighting: 'horror-dark-rim',
    env: 'civic-plaza',
    pushIn: 0.22,
    fps: 30,
    startFrame: 1,
    frameCount: 108,
    width: 1920,
    height: 1080,
    samples: 4,
  });

  console.log('=== Step 7/7: 3D 5-Finger Gloved POV Hand (hand-closeup-rig.blend) ===');
  const blenderBin = resolveBlender();
  const handRes = spawnSync(
    blenderBin,
    [
      '--background',
      join(REPO_ROOT, 'assets', 'series-lead', 'rig-3d', 'hand-closeup-rig.blend'),
      '--python',
      join(REPO_ROOT, 'tools', 'blender-rig', 'render-hand.py'),
      '--',
      '--pose',
      'pov-flashlight',
      '--gloves',
      'on',
      '--lighting',
      'horror-dark-rim',
      '--width',
      '1920',
      '--height',
      '1080',
      '--samples',
      '8',
      '--out',
      join(WORK_DIR, 'hand-gloved-pov.png'),
    ],
    { stdio: 'inherit' },
  );
  if (handRes.status !== 0) {
    throw new Error(`render-hand.py failed with status ${handRes.status}`);
  }

  console.log('=== All native 30 fps 3D-set + character layers rendered cleanly to', WORK_DIR, '===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
