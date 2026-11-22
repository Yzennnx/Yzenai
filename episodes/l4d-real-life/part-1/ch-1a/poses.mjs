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

function shot5DeskResolve(frame) {
  // f463..530 (19.3..22.1s, local 0..67): Grounded palm brace on desk edge -> hard exhale (head-relief) -> jaw sets (head-determined)!
  const local = frame - 463;
  const heave = local < 22 ? Math.sin(local * 0.85) * 2.4 : 0;
  const scene = {
    pelvis: [
      key(0, 256, 555, 8),
      key(22, 254, 554, 7),
      key(46, 228, 542, 2),
      key(62, 218, 536, 0),
      key(68, 218, 536, 0),
    ],
    chest: [
      key(0, 36 + heave),
      key(22, 32 + heave),
      key(46, 12),
      key(62, 3),
      key(68, 2),
    ],
    neck: [key(0, 22), key(22, 20), key(46, 7), key(68, 2)],
    head: [key(0, -12), key(22, -6), key(46, 0), key(68, 0)],
    shoulder: [key(0, 14, 6), key(22, 12, 5), key(46, 4, 1), key(68, 0, 0)],
    elbowBends: [1, 1],
    feet: (t) => {
      const f = t * fps;
      const roll = f < 24 ? 18 : f < 52 ? 18 * (1 - (f - 24) / 28) : 0;
      return [sole(184, roll, 30), sole(248)];
    },
    far: [key(0, 234, 559), key(22, 232, 558), key(48, 214, 555), key(68, 208, 554)],
    near: [
      key(0, 374, 554, 0),
      key(24, 374, 554, 0),
      key(42, 322, 534, 30),
      key(60, 248, 544, 80),
      key(68, 244, 544, 82),
    ],
    nearHand: [key(0, 'hand-brace'), key(30, 'hand-near')],
    expression: [key(0, 'head-strain'), key(10, 'head-relief'), key(38, 'head-determined')],
  };
  return rigAt(scene, local);
}

function shot6WalkToDoor(frame) {
  // f581..642 (24.2..26.8s): crisp walk cycle left toward front door (with foreground parallax lamp wipe!)
  return gaitAt('walk', frame - 581);
}

function shot7BarricadeShove(frame) {
  // f703..813 (29.3..33.9s, local 0..110): Upgraded Heavy Barricade Shove (dynamicScenes[3] coil -> drive -> exhausted settle!)
  const local = frame - 703;
  const strain = (local >= 24 && local <= 80) ? Math.sin(local * 0.95) * 2.2 : 0;
  const scene = {
    elbowBends: [1, 1],
    pelvis: [
      key(0, 224, 540, 2),
      key(14, 200, 548, -2),
      key(26, 256, 556, 10),
      key(78, 262, 558, 11),
      key(96, 226, 544, 2),
      key(111, 220, 538, 0),
    ],
    chest: [
      key(0, 8),
      key(14, -4),
      key(26, 36 + strain),
      key(52, 38 + strain),
      key(78, 36 + strain),
      key(96, 10),
      key(111, 4),
    ],
    neck: [key(0, 4), key(14, -2), key(26, 20), key(78, 22), key(96, 6), key(111, 2)],
    head: [key(0, 0), key(14, 6), key(26, -14), key(78, -12), key(96, 0), key(111, 0)],
    shoulder: [key(0, 0, 0), key(14, -6, 2), key(26, 16, 4), key(78, 18, 5), key(96, 2, 0), key(111, 0, 0)],
    feet: (t) => {
      const f = t * fps;
      const roll = f < 16 ? 0 : f < 28 ? 20 * ((f - 16) / 12) : f < 82 ? 20 : f < 98 ? 20 * (1 - (f - 82) / 16) : 0;
      return [sole(182, roll, 30), sole(256)];
    },
    far: [key(0, 248, 526), key(14, 218, 504), key(26, 364, 484), key(78, 366, 484), key(96, 246, 544), key(111, 236, 552)],
    near: [key(0, 278, 520, 10), key(14, 242, 494, -16), key(26, 374, 492, -86), key(78, 375, 492, -86), key(96, 268, 538, 54), key(111, 256, 548, 82)],
    nearHand: [key(0, 'hand-near'), key(22, 'hand-brace'), key(86, 'hand-near')],
    expression: [key(0, 'head-determined'), key(22, 'head-strain'), key(88, 'head-exhausted')],
  };
  return rigAt(scene, local);
}

function shot8WalkAndFridgePull(frame) {
  // f814..880 (33.9..36.7s, local 0..66): walks right to fridge with doorframe parallax wipe -> pulls handle open!
  const local = frame - 814;
  if (local < 32) return gaitAt('walk', local);
  const s = local - 32;
  const scene = {
    pelvis: [key(0, 240, 538, 1), key(35, 236, 540, 0)],
    chest: [key(0, 6), key(14, 13), key(35, 4)],
    neck: [key(0, 3), key(35, 2)],
    head: [key(0, 0), key(35, 4)],
    shoulder: [key(0, 4, 0), key(14, 10, 0), key(35, 2, 0)],
    elbowBends: [1, 1],
    feet: () => [sole(208), sole(256)],
    far: [key(0, 224, 550), key(35, 222, 552)],
    near: [key(0, 314, 494, -18), key(14, 356, 478, -12), key(35, 302, 488, -42)],
    nearHand: [key(0, 'hand-grip')],
    expression: [key(0, 'head-notice'), key(20, 'head-dread')],
  };
  return rigAt(scene, s);
}

function shot11CounterRush(frame) {
  // f1471..1517 (61.3..63.2s, local 0..46): frantic rush & lunge to yank kitchen drawer open!
  const local = frame - 1471;
  const scene = {
    pelvis: [key(0, 226, 540, 3), key(20, 250, 546, 7), key(47, 238, 542, 3)],
    chest: [key(0, 12), key(20, 26), key(47, 16)],
    neck: [key(0, 6), key(20, 14), key(47, 8)],
    head: [key(0, 10), key(20, 18), key(47, 12)],
    shoulder: [key(0, 6, 0), key(20, 14, 2), key(47, 6, 0)],
    elbowBends: [1, 1],
    feet: () => [sole(198), sole(258)],
    far: [key(0, 246, 546), key(20, 310, 524), key(47, 286, 534)],
    near: [key(0, 306, 524, 0), key(20, 360, 520, -10), key(47, 308, 524, -24)],
    nearHand: [key(0, 'hand-grip')],
    expression: [key(0, 'head-panic'), key(26, 'head-strain')],
  };
  return rigAt(scene, local);
}

export function ch1aPose(frame) {
  if (frame < 463) return []; // Shots 1-4C: OTS desk, overhead phone grab, POV alert, Front eye-dart, POV whip-pan, ECU crash-zoom!
  if (frame < 531) return shot5DeskResolve(frame); // Shot 5: Side desk brace -> exhale -> determined snap
  if (frame < 581) return []; // Shot 6A: High-angle vulnerable room wide
  if (frame < 643) return shot6WalkToDoor(frame); // Shot 6B: Side stride left with foreground parallax lamp wipe
  if (frame < 703) return []; // Shot 6C: Studio SVG POV deadbolt lock turn
  if (frame < 814) return shot7BarricadeShove(frame); // Shot 7: Dynamic heavy barricade shove (bookshelf)
  if (frame < 881) return shot8WalkAndFridgePull(frame); // Shot 8A: Side walk right (doorframe parallax) & fridge pull
  if (frame < 1471) return []; // Shots 8A-face, 8B POV fridge, 9A OTS window, 9B look-down, 10 stepped aerial street zoom!
  if (frame < 1518) return shot11CounterRush(frame); // Shot 11A: Frantic counter lunge
  return []; // Shots 11B/C rhythmic POV drawers, 11D POV knife star-glint, 12 Low-angle hero hold!
}

for (let f = 0; f < totalFrames; f++) ch1aPose(f);
assert.equal(ch1aPose(100).length, 0);
assert.equal(ch1aPose(420).length, 0);
assert.equal(ch1aPose(1350).length, 0);
