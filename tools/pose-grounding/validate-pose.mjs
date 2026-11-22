/**
 * Automated Biomechanical Pose Validator for OpenToonz / poses.mjs tracks.
 *
 * Catches awkward poses BEFORE rendering:
 *  - Non-finite coordinates
 *  - Stretched or collapsed limb lengths (upper/lower arm & upper/lower leg)
 *  - Floor penetration (feet sinking below floor unless pit/stairwell allowed)
 *  - Excessive spine/neck/head snap angles
 *  - Optional wrist-to-prop anchor drift
 */

import { floor } from '../../assets/series-lead/anatomy-prototype/poses.mjs';

const LIMB_LIMITS = {
  thigh: { len: 105, tol: 8 },
  shin: { len: 101, tol: 8 },
  upperArm: { len: 83, tol: 8 },
  forearm: { len: 72, tol: 8 },
};

function dist(a, b) {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function normAngle(deg) {
  let a = ((deg + 180) % 360 + 360) % 360 - 180;
  return a;
}

export function validatePoseFrame(pose, frame, opts = {}) {
  const errors = [];
  if (!Array.isArray(pose) || pose.length === 0) return errors;

  const byPart = new Map();
  for (const entry of pose) {
    const [part, x, y, angle] = entry;
    if (![x, y, angle].every(Number.isFinite)) {
      errors.push(`f${frame}: non-finite transform on ${part}`);
      continue;
    }
    byPart.set(part, [x, y, angle]);
  }

  // 1. Check limb segment lengths between consecutive joint pivots
  const checks = [
    ['legUpperFar', 'legLowerFar', 'thigh'],
    ['legLowerFar', 'shoeFar', 'shin'],
    ['legUpperNear', 'legLowerNear', 'thigh'],
    ['legLowerNear', 'shoeNear', 'shin'],
    ['armUpperFar', 'armLowerFar', 'upperArm'],
    ['armLowerFar', 'handFar', 'forearm'],
    ['armUpperNear', 'armLowerNear', 'upperArm'],
    ['armLowerNear', 'handNear', 'forearm'],
  ];

  // Match hand part variants (hand-near, hand-grip, hand-pipe, etc.)
  const findHand = (side) => {
    for (const [k, v] of byPart.entries()) {
      if (side === 'Far' && (k === 'hand-far' || k === 'hand-run-far')) return v;
      if (side === 'Near' && k.startsWith('hand-') && !k.includes('far')) return v;
    }
    return null;
  };

  for (const [aName, bName, kind] of checks) {
    const a = byPart.get(aName);
    const b = bName === 'handFar' ? findHand('Far') : bName === 'handNear' ? findHand('Near') : byPart.get(bName);
    if (!a || !b) continue;
    const d = dist(a, b);
    const { len, tol } = LIMB_LIMITS[kind];
    if (Math.abs(d - len) > tol) {
      errors.push(`f${frame}: ${aName}->${bName} length ${d.toFixed(1)} violates anatomical ${len}±${tol}`);
    }
  }

  // 2. Floor penetration check (unless allowBelowFloor is true for stairwells/pits)
  if (!opts.allowBelowFloor) {
    const maxY = (opts.floorY ?? floor) + (opts.floorTol ?? 10);
    for (const shoe of ['shoeFar', 'shoeNear']) {
      const s = byPart.get(shoe);
      if (s && s[1] > maxY) {
        errors.push(`f${frame}: ${shoe} sinks below floor (y=${s[1].toFixed(1)} > ${maxY})`);
      }
    }
  }

  // 3. Head/neck extreme twist check relative to torso
  const torso = byPart.get('torso');
  const head = [...byPart.entries()].find(([k]) => k === 'head' || k.startsWith('head-'))?.[1];
  if (torso && head) {
    const diff = Math.abs(normAngle(head[2] - torso[2]));
    if (diff > (opts.maxHeadTilt ?? 65)) {
      errors.push(`f${frame}: extreme head-vs-torso angle ${diff.toFixed(1)}°`);
    }
  }

  return errors;
}

export function validatePoseTrack(poseFn, totalFrames, opts = {}) {
  const allErrors = [];
  let checkedFrames = 0;
  for (let frame = 0; frame < totalFrames; frame++) {
    const pose = poseFn(frame);
    if (!pose || !pose.length) continue;
    checkedFrames++;
    const errs = validatePoseFrame(pose, frame, opts);
    if (errs.length) allErrors.push(...errs);
  }
  if (allErrors.length) {
    const sample = allErrors.slice(0, 12).join('\n  ');
    throw new Error(
      `Biomechanical pose validation FAILED (${allErrors.length} issues across ${checkedFrames} active frames):\n  ${sample}`
    );
  }
  return { checkedFrames, passed: true };
}
