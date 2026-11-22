import assert from 'node:assert/strict';
import { floor, fps, gaitAt, rigAt } from '../../../../assets/series-lead/anatomy-prototype/poses.mjs';

export const duration = 78;
export const totalFrames = duration * fps; // 1872

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

// SEGMENT 1 (f0..85, 0:00.0..0:03.6): Weary upright dawn street walk (left -> right)
// Continuous floating-point local frame (local * 0.92) for smooth native 24fps gait.
function seg1DawnWalk(frame) {
  const local = frame;
  const pose = gaitAt('walk', local * 0.92);
  return pose.map(entry => entry[0] === 'head' ? ['head-exhausted', ...entry.slice(1)] : entry);
}

// SEGMENT 2 (f278..330, 0:11.6..0:13.8, 53 frames / 2.21 s): Dynamic curb crouch -> explosive upward leap ->
// overhead iron fire ladder rung catch -> pulling weight downward onto descending ladder.
const leapCatchScene = {
  elbowBends: [1, 1],
  pelvis: [
    [0.00, 240, 540, 4],
    [0.42, 248, 594, 14],    // Deep curb crouch coil
    [0.68, 262, 500, 4],     // Explosive upward drive off curb
    [0.98, 272, 434, -4],    // Peak leap catching overhead iron rung
    [1.35, 274, 468, 2],     // Pulling body weight down onto descending ladder
    [1.75, 274, 546, 6],     // Feet touch down absorbing drop
    [2.25, 276, 548, 8],     // Settled gripped stance ready to climb
  ],
  chest: [
    [0.00, 8], [0.42, 24], [0.68, 6], [0.98, -2], [1.35, 6], [1.75, 12], [2.25, 14],
  ],
  neck: [
    [0.00, 4], [0.42, 10], [0.68, 4], [0.98, -2], [1.35, 2], [1.75, 4], [2.25, 4],
  ],
  head: [
    [0.00, -8], [0.42, -16], [0.68, -22], [0.98, -24], [1.35, -18], [1.75, -14], [2.25, -14],
  ],
  shoulder: [
    [0.00, 2, 0], [0.42, 4, -4], [0.68, 8, -10], [0.98, 10, -14], [1.35, 8, -8], [1.75, 6, -4], [2.25, 6, -4],
  ],
  feet: t => {
    const fFar = t < 0.45 ? sole(220)
      : t < 1.75 ? samplePts([
        [0.45, ...sole(220)],
        [0.68, 230, 678, 28],
        [0.98, 242, 608, 24],
        [1.35, 244, 650, 14],
        [1.75, ...sole(246)],
      ], t)
      : sole(246);
    const fNear = t < 0.45 ? sole(274)
      : t < 1.75 ? samplePts([
        [0.45, ...sole(274)],
        [0.68, 274, 650, 22],
        [0.98, 292, 588, 18],
        [1.35, 290, 642, 10],
        [1.75, ...sole(298)],
      ], t)
      : sole(298);
    return [fFar, fNear];
  },
  far: [
    [0.00, 230, 536],
    [0.42, 220, 558],
    [0.68, 292, 296],
    [0.98, 298, 174],        // Far hand catches overhead iron rung
    [1.35, 298, 222],        // Riding descending ladder rung down
    [1.75, 308, 308],
    [2.25, 314, 316],
  ],
  near: [
    [0.00, 266, 530, 32],
    [0.42, 244, 562, 42],
    [0.68, 314, 286, -72],
    [0.98, 318, 168, -82],   // Near hand locks onto overhead iron rung
    [1.35, 316, 218, -80],   // Hauling spring-loaded ladder downward
    [1.75, 326, 304, -72],
    [2.25, 332, 312, -70],
  ],
  nearHand: [[0, 'hand-near'], [0.45, 'hand-brace'], [0.85, 'hand-grip']],
  expression: [[0, 'head-determined'], [0.42, 'head-strain'], [1.45, 'head-determined']],
};

function seg2LeapCatch(frame) {
  const local = frame - 278;
  return rigAt(leapCatchScene, local);
}

// SEGMENT 3 (f494..580, 0:20.6..0:24.2, 87 frames / 3.62 s): Leaning at 2F window sill ->
// two strained upward iron ladder hoists (0.35..2.35s) -> slamming steel catch hook shut (2.35..3.05s) ->
// pulling back inside (3.05..3.62s).
const hoistLadderScene = {
  elbowBends: [1, 1],
  pelvis: [
    [0.00, 258, 566, 12],
    [0.35, 262, 570, 14],    // Braced low over 2F window sill gripping rung
    [1.05, 244, 552, 2],     // Pull #1 apex: heaving heavy iron ladder straight up
    [1.48, 256, 564, 10],    // Quick low re-grip for Pull #2
    [2.25, 242, 548, -2],    // Pull #2 apex: final strained hoist past window sill
    [2.65, 248, 550, 2],     // Reaching to steel catch hook
    [2.95, 250, 554, 4],     // Slamming steel catch hook shut
    [3.65, 238, 546, 0],     // Pulling back safely inside 2F loft
  ],
  chest: [
    [0.00, 28], [0.35, 30], [1.05, 8], [1.48, 24], [2.25, 4], [2.65, 10], [2.95, 14], [3.65, 4],
  ],
  neck: [
    [0.00, 14], [0.35, 16], [1.05, 6], [1.48, 12], [2.25, 4], [2.65, 6], [2.95, 8], [3.65, 2],
  ],
  head: [
    [0.00, 10], [0.35, 12], [1.05, -4], [1.48, 6], [2.25, -8], [2.65, -4], [2.95, 0], [3.65, -2],
  ],
  shoulder: [
    [0.00, 10, 4], [0.35, 12, 6], [1.05, 4, -6], [1.48, 10, 2], [2.25, 4, -10], [2.65, 8, -6], [2.95, 8, -2], [3.65, 2, 0],
  ],
  feet: () => [sole(218), sole(276)],
  far: [
    [0.00, 368, 540],
    [0.35, 372, 546],
    [1.05, 336, 418],        // Pull #1 upward heave
    [1.48, 360, 524],        // Re-grip low
    [2.25, 328, 362],        // Pull #2 high hoist
    [2.65, 334, 376],        // Holding ladder frame steady
    [2.95, 332, 396],
    [3.65, 278, 496],
  ],
  near: [
    [0.00, 388, 554, 62],
    [0.35, 392, 560, 64],
    [1.05, 356, 424, -10],   // Pull #1 upward heave
    [1.48, 380, 536, 52],    // Re-grip low
    [2.25, 348, 366, -34],   // Pull #2 high hoist
    [2.65, 378, 362, -18],   // Lining up steel catch hook
    [2.95, 378, 424, 0],     // Slamming steel catch hook shut
    [3.65, 304, 492, 26],    // Pulling back inside
  ],
  nearHand: [[0, 'hand-grip'], [2.55, 'hand-brace'], [3.10, 'hand-near']],
  expression: [[0, 'head-strain'], [2.95, 'head-determined']],
};

function seg3HoistLadder(frame) {
  const local = frame - 494;
  return rigAt(hoistLadderScene, local);
}

export function ch2aPose(frame) {
  if (frame >= 0 && frame < 86) return seg1DawnWalk(frame);
  if (frame >= 278 && frame < 331) return seg2LeapCatch(frame);
  if (frame >= 494 && frame < 581) return seg3HoistLadder(frame);
  return [];
}

for (let frame = 0; frame < totalFrames; frame++) {
  const pose = ch2aPose(frame);
  if (pose.length) assert(pose.every(([, x, y, a]) => [x, y, a].every(Number.isFinite)));
}
