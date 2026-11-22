import assert from 'node:assert/strict';
import { floor, fps, rigAt } from '../../../../assets/series-lead/anatomy-prototype/poses.mjs';

export const duration = 82;
export const totalFrames = duration * fps; // 1968

const rad = Math.PI / 180;
const thigh = 105;
const shin = 101;
const ease = t => t * t * (3 - 2 * t);

function at(origin, x, y) {
  const a = origin[2] * rad;
  return [
    origin[0] + x * Math.cos(a) - y * Math.sin(a),
    origin[1] + x * Math.sin(a) + y * Math.cos(a),
  ];
}

function sole(x, angle = 0, pivot = 0) {
  const [dx, dy] = at([0, 0, angle], pivot, 18);
  return [x - dx, floor - dy, angle];
}

function samplePts(keys, t) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      const u = (t - a[0]) / (b[0] - a[0]);
      const e = ease(u);
      return a.slice(1).map((v, j) => v + (b[j + 1] - v) * e);
    }
  }
  return keys.at(-1).slice(1);
}

// SHOT 21 (f1320..1401, 0:55.0-0:58.4, 82 frames = 3.42s):
// Gear-up & pump-shotgun ready stance inside the gunsmith workshop (head-determined).
// Grounded on both soles; settles backpack weight/straps (0.00-0.95s), then brings both
// leather-gloved hands into a disciplined low-ready shotgun hold with steady breathing.
const gearUpReadyScene = {
  elbowBends: [1, 1],
  pelvis: [
    [0.00, 270, 536, 1],
    [0.55, 269, 539, 2],
    [1.15, 271, 536, 3],
    [2.10, 271, 534, 3],
    [2.85, 271, 537, 3],
    [3.42, 271, 535, 3],
  ],
  chest: [
    [0.00, 3],
    [0.55, 5],
    [1.15, 7],
    [2.10, 6],
    [2.85, 7],
    [3.42, 6],
  ],
  neck: [
    [0.00, 2],
    [0.55, 3],
    [1.15, 4],
    [2.10, 3],
    [3.42, 4],
  ],
  head: [
    [0.00, 1],
    [0.55, 3],
    [1.15, -2],
    [2.10, -3],
    [3.42, -2],
  ],
  shoulder: [
    [0.00, 1, -2],
    [0.55, 3, -5],   // Subtle shoulder shrug settling heavy pack straps
    [1.15, 4, 0],
    [2.10, 4, -1],
    [2.85, 4, 1],
    [3.42, 4, 0],
  ],
  feet: t => {
    const fFar = samplePts([
      [0.00, ...sole(244)],
      [0.95, ...sole(242)],
      [3.42, ...sole(242)],
    ], t);
    const fNear = samplePts([
      [0.00, ...sole(296)],
      [0.95, ...sole(302)],
      [3.42, ...sole(302)],
    ], t);
    return [fFar, fNear];
  },
  // Far hand rises onto pump forend forward of chest (low-ready angle)
  far: [
    [0.00, 344, 514, 18],
    [0.55, 354, 502, 12],
    [1.15, 368, 504, 10],
    [2.10, 369, 502, 9],
    [2.85, 368, 505, 10],
    [3.42, 368, 503, 10],
  ],
  // Near hand ('hand-grip') settles onto shotgun stock/pistol grip
  near: [
    [0.00, 310, 488, 6],
    [0.55, 314, 482, 4],
    [1.15, 318, 496, 12],
    [2.10, 319, 494, 11],
    [2.85, 318, 497, 12],
    [3.42, 318, 495, 12],
  ],
  nearHand: [[0, 'hand-grip'], [3.42, 'hand-grip']],
  farHand: [[0, 'hand-far'], [3.42, 'hand-far']],
  expression: [[0, 'head-determined'], [3.42, 'head-determined']],
};

function shot21GearUpReady(frame) {
  return rigAt(gearUpReadyScene, frame - 1320);
}

// SHOT 26 (f1670..1741, 1:09.6-1:12.6, 72 frames = 3.00s):
// Cautious low-ready walk stepping out of the rear workshop alley into midnight fog (head-determined).
// Smooth native 24 fps floating-point gait grounded on floor, with both arms locked forward in a
// disciplined low-ready pump-shotgun hold so scene.js anchors the shotgun cleanly between handNear & handFar.
function shot26ReadyWalk(frame) {
  const local = frame - 1670;
  const cycle = 32; // Deliberate, cautious tactical stride
  const support = 0.63;
  const phase = (local % cycle) / cycle;
  const phases = [(phase + 0.5) % 1, phase];
  const speed = 132;
  const contactX = 42;
  const centre = 270;
  const bob = Math.cos((phase - 0.12) * 4 * Math.PI);
  const gaitHeight = 532 + 2.2 * bob;
  const pelvisAngle = 3;
  const chestAngle = 8;
  const landingAngle = -10;
  const toeAngle = 17;

  function ankle(p) {
    const rollStart = support - 0.15;
    if (p <= support) {
      const x = centre + contactX - speed * p;
      if (p < 0.10) return sole(x - 18, landingAngle * (1 - ease(p / 0.10)), -18);
      return p < rollStart
        ? sole(x)
        : sole(x + 30, toeAngle * ease((p - rollStart) / 0.15), 30);
    }
    const t = (p - support) / (1 - support);
    const release = sole(centre + contactX - speed * support + 30, toeAngle, 30);
    const landing = sole(centre + contactX - 18, landingAngle, -18);
    const swing = Math.sin(Math.PI * t);
    return [
      release[0] + (landing[0] - release[0]) * ease(t) - 6 * swing,
      release[1] + (landing[1] - release[1]) * ease(t) - 16 * swing,
      release[2] + (landing[2] - release[2]) * t - 5 * Math.sin(2 * Math.PI * t),
    ];
  }

  const ankles = phases.map(ankle);
  const reach = thigh + shin - 2.0;
  const hips = Math.max(gaitHeight, ...ankles.map(([x, y], index) => {
    const [hipX, hipY] = at([centre, 0, pelvisAngle], index ? 8 : -9, index ? 7 : 5);
    return y - hipY - Math.sqrt(reach ** 2 - (x - hipX) ** 2);
  }));

  const torso = [...at([centre, hips, pelvisAngle], 0, -28), chestAngle];
  const shoulderFar = at(torso, -17, -106);
  const shoulderNear = at(torso, 15, -108);
  const swayX = Math.sin(phase * 2 * Math.PI) * 2.0;
  const swayY = bob * 1.4;

  // Low-ready pump-shotgun grip locked smoothly to upper torso with subtle tactical gait damping
  const farWrist = [shoulderFar[0] + 102 + swayX, shoulderFar[1] + 98 + swayY, 10];
  const nearWrist = [shoulderNear[0] + 22 + swayX, shoulderNear[1] + 90 + swayY, 12];

  return rigAt({
    pelvis: [[0, centre, hips, pelvisAngle]],
    chest: [[0, chestAngle]],
    neck: [[0, 4]],
    head: [[0, -3]],
    shoulder: [[0, 4, 0]],
    elbowBends: [1, 1],
    far: [[0, ...farWrist]],
    near: [[0, ...nearWrist]],
    feet: () => ankles,
    nearHand: [[0, 'hand-grip']],
    farHand: [[0, 'hand-far']],
    expression: [[0, 'head-determined']],
  }, 0);
}

export function ch2cPose(frame) {
  if (frame >= 1320 && frame <= 1401) return shot21GearUpReady(frame);
  if (frame >= 1670 && frame <= 1741) return shot26ReadyWalk(frame);
  return [];
}

for (let frame = 0; frame < totalFrames; frame++) {
  const pose = ch2cPose(frame);
  if (pose.length) assert(pose.every(([, x, y, a]) => [x, y, a].every(Number.isFinite)));
}
