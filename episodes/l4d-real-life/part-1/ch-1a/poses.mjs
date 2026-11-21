import assert from 'node:assert/strict';
import { floor, fps, gaitAt, rigAt } from '../../../../assets/series-lead/anatomy-prototype/poses.mjs';

export const duration = 75;
export const totalFrames = duration * fps; // 1800

const key = (frame, ...values) => [frame / fps, ...values];
const rad = Math.PI / 180;
function sole(x, angle = 0, pivot = 0) {
  const a = angle * rad;
  const dx = pivot * Math.cos(a) - 18 * Math.sin(a);
  const dy = pivot * Math.sin(a) + 18 * Math.cos(a);
  return [x - dx, floor - dy, angle];
}

function shot5PanicBrace(frame) {
  // f372..527 (local 0..155): grounded athletic brace matching official reference-sheet.png "Palm brace" & "Ready stance"!
  // Steps/stumbles off pushed-back chair -> plants flat palm solidly on desk edge while heaving -> exhales & stands tall.
  const local = frame - 372;
  const heave = (local >= 34 && local <= 96) ? Math.sin(local * 0.95) * 2.8 : 0;
  const scene = {
    pelvis: [
      key(0, 206, 538, 2),
      key(16, 236, 543, 6),
      key(32, 256, 555, 8),
      key(96, 258, 556, 8),
      key(122, 234, 544, 2),
      key(144, 218, 536, 0),
      key(156, 218, 536, 0),
    ],
    chest: [
      key(0, 8),
      key(18, 22),
      key(34, 36 + heave),
      key(96, 34 + heave),
      key(124, 14),
      key(144, 3),
      key(156, 2),
    ],
    neck: [
      key(0, 4),
      key(20, 14),
      key(34, 24),
      key(96, 22),
      key(124, 8),
      key(144, 2),
      key(156, 2),
    ],
    head: [
      key(0, 4),
      key(20, -6),
      key(34, -14 + heave * 0.4),
      key(96, -8 + heave * 0.4),
      key(124, 0),
      key(144, 0),
      key(156, 0),
    ],
    shoulder: [
      key(0, 2, 0),
      key(20, 8, 2),
      key(34, 14, 7),
      key(96, 12, 6),
      key(124, 4, 1),
      key(144, 0, 0),
      key(156, 0, 0),
    ],
    elbowBends: [1, 1],
    feet: (t) => {
      const f = t * fps;
      let roll = 0;
      if (f >= 10 && f < 32) roll = 18 * ((f - 10) / 22);
      else if (f >= 32 && f <= 98) roll = 18;
      else if (f > 98 && f < 130) roll = 18 * (1 - (f - 98) / 32);
      return [sole(184, roll, 30), sole(248)];
    },
    // Far arm trails naturally downward behind shoulder/hip (official brace pose — zero chicken-wing elbow!)
    far: [
      key(0, 194, 550),
      key(18, 210, 550),
      key(34, 232, 559),
      key(96, 238, 562),
      key(124, 218, 556),
      key(144, 208, 554),
      key(156, 208, 554),
    ],
    // Near arm plants flat palm firmly onto desk edge (374, 554), holds solid during panic, then lowers cleanly to side!
    near: [
      key(0, 272, 520, 40),
      key(18, 340, 532, 18),
      key(30, 374, 554, 0),
      key(98, 374, 554, 0),
      key(114, 336, 534, 24),
      key(134, 266, 540, 68),
      key(146, 244, 542, 82),
      key(156, 244, 542, 82),
    ],
    nearHand: [key(0, 'hand-near'), key(22, 'hand-brace'), key(106, 'hand-near')],
    expression: [key(0, 'head-alarm'), key(28, 'head-strain'), key(114, 'head-notice')],
  };
  return rigAt(scene, local);
}

function shot6Walk(frame) {
  // f528..599 (22.0..25.0s): crisp walk cycle left toward front door
  return gaitAt('walk', frame - 528);
}

function shot7BarricadePush(frame) {
  // f660..821 (27.5..34.25s, local 0..161): grounded athletic two-handed heavy bookshelf push (matching reference-sheet brace!)
  const local = frame - 660;
  const strain = (local >= 28 && local <= 124) ? Math.sin(local * 0.85) * 2.0 : 0;
  const scene = {
    pelvis: [key(0, 210, 538, 2), key(26, 248, 554, 9), key(124, 254, 556, 10), key(150, 224, 540, 1), key(162, 224, 540, 1)],
    chest: [key(0, 8), key(26, 35 + strain), key(124, 37 + strain), key(150, 6), key(162, 4)],
    neck: [key(0, 4), key(26, 20), key(124, 22), key(150, 3), key(162, 2)],
    head: [key(0, 0), key(26, -12), key(124, -10), key(150, 0), key(162, 0)],
    shoulder: [key(0, 4, 0), key(26, 14, 4), key(124, 15, 4), key(150, 2, 0), key(162, 0, 0)],
    elbowBends: [1, 1],
    feet: (t) => {
      const f = t * fps;
      const push = f < 24 ? f / 24 : (f < 126 ? 1 : Math.max(0, 1 - (f - 126) / 24));
      return [sole(184, 18 * push, 30), sole(252)];
    },
    far: [key(0, 246, 524), key(26, 360, 488), key(124, 362, 488), key(150, 216, 552), key(162, 216, 552)],
    near: [key(0, 286, 520, -10), key(26, 372, 496, -86), key(124, 374, 496, -86), key(150, 250, 542, 78), key(162, 250, 542, 78)],
    nearHand: [key(0, 'hand-brace'), key(138, 'hand-near')],
    expression: [key(0, 'head-notice'), key(22, 'head-strain'), key(136, 'head-notice')],
  };
  return rigAt(scene, local);
}

function shot8FridgeOpen(frame) {
  // f822..893 (34.25..37.2s, local 0..71): walks to fridge & pulls handle open cleanly
  const local = frame - 822;
  if (local < 32) return gaitAt('walk', local);
  const s = local - 32;
  const scene = {
    pelvis: [key(0, 240, 538, 1), key(40, 236, 540, 0)],
    chest: [key(0, 6), key(18, 12), key(40, 4)],
    neck: [key(0, 3), key(40, 2)],
    head: [key(0, 0), key(40, 4)],
    shoulder: [key(0, 4, 0), key(18, 10, 0), key(40, 2, 0)],
    elbowBends: [1, 1],
    feet: () => [sole(208), sole(256)],
    far: [key(0, 224, 550), key(40, 222, 552)],
    near: [key(0, 314, 494, -18), key(16, 356, 478, -12), key(40, 304, 488, -42)],
    nearHand: [key(0, 'hand-grip')],
    expression: [key(0, 'head-notice'), key(24, 'head-alarm')],
  };
  return rigAt(scene, s);
}

function shot11DrawerSearch(frame) {
  // f1440..1535 (60.0..64.0s, local 0..95): rushes to kitchen counter, yanks drawer open in desperation
  const local = frame - 1440;
  const scene = {
    pelvis: [key(0, 230, 540, 2), key(32, 246, 545, 6), key(68, 236, 542, 2), key(96, 240, 542, 3)],
    chest: [key(0, 10), key(32, 24), key(68, 14), key(96, 16)],
    neck: [key(0, 5), key(32, 12), key(96, 8)],
    head: [key(0, 10), key(32, 18), key(68, 10), key(96, 12)],
    shoulder: [key(0, 6, 0), key(32, 12, 2), key(68, 4, 0), key(96, 8, 0)],
    elbowBends: [1, 1],
    feet: () => [sole(200), sole(256)],
    far: [key(0, 246, 548), key(32, 308, 526), key(96, 286, 536)],
    near: [key(0, 306, 524, 0), key(32, 358, 520, -10), key(62, 310, 524, -24), key(96, 344, 504, -14)],
    nearHand: [key(0, 'hand-grip')],
    expression: [key(0, 'head-strain'), key(74, 'head-notice')],
  };
  return rigAt(scene, local);
}

export function ch1aPose(frame) {
  if (frame < 372) return []; // Shots 1-4: OTS rear-quarter desk, top-down phone insert, POV alert, Front->3/4 close-up
  if (frame < 528) return shot5PanicBrace(frame); // Shot 5: Side panic brace & ready stance
  if (frame < 600) return shot6Walk(frame); // Shot 6a: Walk left toward door
  if (frame < 660) return []; // Shot 6b: POV deadbolt lock
  if (frame < 822) return shot7BarricadePush(frame); // Shot 7: Heavy bookshelf push flush to door
  if (frame < 894) return shot8FridgeOpen(frame); // Shot 8a: Walk to fridge & open
  if (frame < 1038) return []; // Shot 8b: POV empty 5-day fridge
  if (frame < 1176) return []; // Shot 9: OTS Rear-3/4 at 7F window looking down at burning city!
  if (frame < 1440) return []; // Shot 10: High-angle 7F aerial POV street frenzy (Runners, Smoker, Boomer, Hunter!)
  if (frame < 1536) return shot11DrawerSearch(frame); // Shot 11a: Kitchen drawer yank search
  if (frame < 1632) return []; // Shot 11b: POV gleaming chef's kitchen knife draw
  return []; // Shot 12: Dramatic Front-3/4 hero hold holding gleaming kitchen knife by window!
}

for (let f = 0; f < totalFrames; f++) ch1aPose(f);
assert.equal(ch1aPose(100).length, 0);
assert.equal(ch1aPose(1300).length, 0);
