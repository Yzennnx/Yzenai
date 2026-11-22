import assert from 'node:assert/strict';
import { dynamicScenes, floor, fps, rigAt, sneakAt, sprintAt } from '../../../../assets/series-lead/anatomy-prototype/poses.mjs';

export const duration = 82;
export const totalFrames = duration * fps; // 1968

const shoveScene = dynamicScenes.find(s => s.id === 'shove').scene;

const rad = Math.PI / 180;
function sole(x, angle = 0, pivot = 0) {
  const a = angle * rad;
  const dx = pivot * Math.cos(a) - 18 * Math.sin(a);
  const dy = pivot * Math.sin(a) + 18 * Math.cos(a);
  return [x - dx, floor - dy, angle];
}

function samplePts(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      const u = (t - a[0]) / (b[0] - a[0]);
      const e = u * u * (3 - 2 * u);
      return a.slice(1).map((v, j) => v + (b[j + 1] - v) * e);
    }
  }
  return keys.at(-1).slice(1);
}

function withHead(pose, expr) {
  return pose.map(entry => entry[0].startsWith('head') ? [expr, ...entry.slice(1)] : entry);
}

// SHOT 4 (f202..268, 0:08.4-0:11.2, 67 frames): Alley stealth crouch-creep past tin awning (head-sneak)
function shot4AlleySneak(frame) {
  return sneakAt(frame - 202);
}

// SHOT 8 (f442..508, 0:18.4-0:21.2, 67 frames = 2.79s):
// TRUE KNOCKDOWN TO WET CONCRETE GROUND!
// 0.00-0.45s: Hunter slams chest -> hips fly back & boots lift off asphalt
// 0.45-1.25s: Back slams FLAT onto wet concrete (pelvis y=716, chest reclined -74 deg)
// 1.25-2.79s: Pinned flat on back, knees bent up, right forearm snapping UP to shield face!
const knockdownScene = {
  elbowBends: [1, 1],
  pelvis: [
    [0.00, 276, 538, -4],
    [0.42, 246, 578, -28],
    [0.95, 224, 668, -62],
    [1.35, 218, 706, -78],
    [2.80, 216, 710, -80],
  ],
  chest: [
    [0.00, -8], [0.42, -32], [0.95, -66], [1.35, -80], [2.80, -82],
  ],
  neck: [
    [0.00, 4], [0.42, 16], [0.95, 32], [1.35, 40], [2.80, 42],
  ],
  head: [
    [0.00, 0], [0.42, 12], [0.95, 28], [1.35, 36], [2.80, 38],
  ],
  shoulder: [
    [0.00, 0, 0], [0.42, 4, -6], [1.35, 8, -10], [2.80, 8, -10],
  ],
  feet: t => {
    const fFar = samplePts([
      [0.00, ...sole(250)],
      [0.42, 290, 694, -22],
      [0.95, 338, 704, -18],
      [1.35, ...sole(362, -10, -10)],
      [2.80, ...sole(366, -8, -10)],
    ], t);
    const fNear = samplePts([
      [0.00, ...sole(296)],
      [0.42, 336, 680, -34],
      [0.95, 378, 712, -20],
      [1.35, ...sole(400, -12, -10)],
      [2.80, ...sole(404, -10, -10)],
    ], t);
    return [fFar, fNear];
  },
  // Far arm braces downward against wet asphalt; near arm (right forearm) snaps UP defensively across face!
  far: [
    [0.00, 304, 504], [0.42, 210, 588], [0.95, 134, 686], [1.35, 118, 708], [2.80, 118, 708],
  ],
  near: [
    [0.00, 326, 476, -34],
    [0.42, 256, 518, -56],
    [0.95, 178, 566, -78],
    [1.35, 168, 580, -86],
    [2.80, 176, 574, -84],
  ],
  nearHand: [[0, 'hand-brace'], [1.0, 'hand-brace']],
  expression: [[0, 'head-alarm'], [0.35, 'head-panic']],
};

function shot8Knockdown(frame) {
  return rigAt(knockdownScene, frame - 442);
}

// SHOT 12 (f706..777, 0:29.4-0:32.4, 72 frames = 3.0s):
// TRUE SUPINE GROUND-FIGHT UPWARD KNIFE STAB!
// Lead stays PINNED ON HIS BACK on wet asphalt (100% continuous with Shots 8-11!).
// Far arm braces upward holding Hunter's jaws back; near arm (gripping bent knife) chambers low
// then drives STRAIGHT UPWARD cleanly into the Hunter's shoulder at exact strike apex f740 (t=1.42s)!
const groundStabScene = {
  elbowBends: [1, 1],
  pelvis: [
    [0.00, 218, 708, -80],
    [0.80, 220, 706, -78],
    [1.42, 228, 698, -72], // Hips bridge slightly upward on thrust!
    [2.20, 224, 704, -76],
    [3.00, 222, 706, -78],
  ],
  chest: [
    [0.00, -82], [0.80, -78], [1.42, -68], [2.20, -74], [3.00, -78],
  ],
  neck: [
    [0.00, 42], [0.80, 40], [1.42, 34], [2.20, 38], [3.00, 40],
  ],
  head: [
    [0.00, 38], [0.80, 36], [1.42, 30], [2.20, 34], [3.00, 36],
  ],
  shoulder: [
    [0.00, 6, -8], [0.80, 4, -8], [1.42, 14, -14], [3.00, 8, -10],
  ],
  feet: t => {
    const fFar = samplePts([
      [0.00, ...sole(366, -8, -10)],
      [1.42, ...sole(360, -4, -10)],
      [3.00, ...sole(364, -8, -10)],
    ], t);
    const fNear = samplePts([
      [0.00, ...sole(404, -10, -10)],
      [1.42, ...sole(398, -6, -10)],
      [3.00, ...sole(402, -10, -10)],
    ], t);
    return [fFar, fNear];
  },
  // Far arm (shredded cardboard) braces straight UP pushing Hunter away from his throat
  far: [
    [0.00, 148, 594], [0.80, 156, 584], [1.42, 168, 570], [3.00, 158, 584],
  ],
  // Near arm chambers low by hip -> drives STRAIGHT UPWARD with bent knife at t=1.42s (f740)!
  near: [
    [0.00, 142, 686, -12],
    [0.75, 138, 692, -24],    // Chambered coil low by hip
    [1.18, 162, 622, -64],    // Explosive upward drive
    [1.42, 174, 566, -88],    // EXACT STRIKE APEX (straight-arm upward stab into Hunter!)
    [1.85, 168, 576, -84],    // Follow-through hold
    [3.00, 160, 602, -68],
  ],
  nearHand: [[0, 'hand-grip'], [3.0, 'hand-grip']],
  expression: [[0, 'head-strain'], [0.95, 'head-angry'], [2.2, 'head-strain']],
};

function shot12GroundUpwardStab(frame) {
  return rigAt(groundStabScene, frame - 706);
}

// SHOT 14 (f850..921, 0:35.4-0:38.4, 72 frames = 3.0s):
// SUPINE BOOT KICK-OFF -> ATHLETIC SCRAMBLE UPRIGHT ONTO FEET!
// 0.00-0.90s: Both boots plant into Hunter's chest & KICK violently upward/right!
// 0.90-2.10s: Rolls forward onto hands/feet, pushing off concrete
// 2.10-3.00s: Scrambles upright into forward sprint launch stance!
const groundKickScrambleScene = {
  elbowBends: [1, 1],
  pelvis: [
    [0.00, 218, 706, -76],
    [0.45, 224, 696, -70],    // Explosive double-boot kick extension!
    [1.05, 248, 668, -28],    // Sitting up rapidly
    [1.85, 286, 592, 16],     // Rising off wet asphalt
    [2.55, 326, 552, 22],     // Upright athletic sprint launch!
    [3.00, 344, 548, 24],
  ],
  chest: [
    [0.00, -76], [0.45, -68], [1.05, -22], [1.85, 26], [2.55, 24], [3.00, 26],
  ],
  neck: [
    [0.00, 38], [0.45, 34], [1.05, 12], [1.85, -8], [2.55, -8], [3.00, -8],
  ],
  head: [
    [0.00, 34], [0.45, 30], [1.05, 8], [1.85, -10], [2.55, -10], [3.00, -10],
  ],
  shoulder: [
    [0.00, 4, -8], [1.05, 6, 0], [1.85, 8, 4], [3.00, 8, 4],
  ],
  feet: t => {
    const fFar = samplePts([
      [0.00, 316, 650, -45],
      [0.45, 382, 594, -58],  // High boot kick into Hunter!
      [1.05, ...sole(270)],
      [1.85, ...sole(256)],
      [2.55, ...sole(286)],
      [3.00, ...sole(306)],
    ], t);
    const fNear = samplePts([
      [0.00, 340, 636, -50],
      [0.45, 396, 586, -64],  // Lead boot slamming Hunter into trash cans!
      [1.05, ...sole(334)],
      [1.85, ...sole(336)],
      [2.55, ...sole(364)],
      [3.00, ...sole(392)],
    ], t);
    return [fFar, fNear];
  },
  far: [
    [0.00, 126, 700], [0.45, 138, 698], [1.05, 218, 666], [1.85, 336, 578], [2.55, 388, 504], [3.00, 410, 494],
  ],
  near: [
    [0.00, 172, 636, -40],
    [0.45, 184, 636, -30],
    [1.05, 266, 646, 20],
    [1.85, 338, 604, 30],
    [2.55, 376, 514, 24],
    [3.00, 392, 502, 20],
  ],
  nearHand: [[0, 'hand-grip'], [3.0, 'hand-grip']],
  expression: [[0, 'head-angry'], [1.1, 'head-determined'], [2.2, 'head-panic']],
};

function shot14GroundKickScramble(frame) {
  return rigAt(groundKickScrambleScene, frame - 850);
}

// SHOT 15 (f922..983, 0:38.4-0:41.0, 62 frames): Escape Cut #1 - full-speed sprintAt (24 deg forward lean)
function shot15EscapeSprint(frame) {
  return sprintAt(frame - 922);
}

// SHOT 22 (f1354..1420, 0:56.4-0:59.2, 67 frames): Heavy shove workbench heave (head-strain, hands locked to bench edge)
function shot22WorkbenchShove(frame) {
  const f = frame - 1354;
  const local = 6 + (f / 66) * 42;
  return withHead(rigAt(shoveScene, local), 'head-strain');
}

export function ch2bPose(frame) {
  if (frame >= 202 && frame <= 268) return shot4AlleySneak(frame);
  if (frame >= 442 && frame <= 508) return shot8Knockdown(frame);
  if (frame >= 706 && frame <= 777) return shot12GroundUpwardStab(frame);
  if (frame >= 850 && frame <= 921) return shot14GroundKickScramble(frame);
  if (frame >= 922 && frame <= 983) return shot15EscapeSprint(frame);
  if (frame >= 1354 && frame <= 1420) return shot22WorkbenchShove(frame);
  return [];
}

for (let frame = 0; frame < totalFrames; frame++) {
  const pose = ch2bPose(frame);
  if (pose.length) assert(pose.every(([, x, y, a]) => [x, y, a].every(Number.isFinite)));
}
