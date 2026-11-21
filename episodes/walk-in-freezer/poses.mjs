import assert from 'node:assert/strict';
import { floor, fps, gaitAt, rigAt } from '../../assets/series-lead/anatomy-prototype/poses.mjs';

export const duration = 64;
export const totalFrames = duration * fps; // 1536

const key = (frame, ...values) => [frame / fps, ...values];
const rad = Math.PI / 180;
function sole(x, angle = 0, pivot = 0) {
  const a = angle * rad;
  const dx = pivot * Math.cos(a) - 18 * Math.sin(a);
  const dy = pivot * Math.sin(a) + 18 * Math.cos(a);
  return [x - dx, floor - dy, angle];
}

const walk = (frame, origin) => gaitAt('walk', frame).map(([part, x, y, angle]) =>
  [part, x + origin - 270 + 145 * frame / 28, y, angle]);

function shot1Open(frame) {
  // f0..41 walk right from x=88 toward door bar, f42..83 settle cleanly left of crate & reach near hand toward bar
  if (frame < 42) return walk(frame, 88);
  const last = walk(42, 88);
  const [x, y, angle] = last.find(([p]) => p === 'pelvis').slice(1);
  const far = last.find(([p]) => p === 'foot-far').slice(1);
  const near = last.find(([p]) => p === 'foot-near').slice(1);
  const farW = last.find(([p]) => p === 'hand-far').slice(1, 3);
  const nearW = last.find(([p]) => p === 'hand-near').slice(1, 3);
  const restX = x + 16;
  const nearLanding = sole(x + 28);
  const local = frame - 42;
  const scene = {
    pelvis: [key(0, x, y, angle), key(8, x + 10, y + 4, 2), key(18, restX, 542, 4), key(42, restX, 542, 4)],
    chest: [key(0, 4), key(10, 14), key(24, 20), key(42, 20)],
    neck: [key(0, 2), key(14, 7), key(42, 7)],
    head: [key(0, -3), key(14, -2), key(42, 0)],
    shoulder: [key(0, 0, 0), key(26, 12, 0), key(42, 14, 0)],
    elbowBends: [1, 1],
    feet: (t) => {
      const f = t * fps;
      const amt = Math.min(f / 5, 1);
      const rock = far[2] * (1 - amt);
      const heel = far[0] - 18 * Math.cos(far[2] * rad) - 18 * Math.sin(far[2] * rad);
      const roll = rock * rad;
      const front = [heel + 18 * Math.cos(roll) + 18 * Math.sin(roll),
        floor + 18 * Math.sin(roll) - 18 * Math.cos(roll), rock];
      const swing = Math.max(0, Math.min((f - 1) / 13, 1));
      const back = near.map((v, i) => v + (nearLanding[i] - v) * swing);
      back[1] -= 22 * Math.sin(Math.PI * swing);
      return [front, back];
    },
    far: [key(0, ...farW), key(16, restX - 24, 546), key(42, restX - 22, 548)],
    near: [key(0, ...nearW), key(14, restX + 46, 502, -14), key(36, restX + 104, 476, -6), key(42, restX + 108, 475, -6)],
    nearHand: [key(18, 'hand-brace')],
    expression: [key(0, 'head-notice'), key(22, 'head-notice')],
  };
  return rigAt(scene, local);
}

function shot3Recoil(frame) {
  // f192..335 (local 0..143): recoil back from bar cradling raw near hand to chest
  const local = frame - 192;
  const shiver = local > 84 ? Math.sin(local * 1.45) * 2.2 : 0;
  const scene = {
    pelvis: [key(0, 266, 542, -3), key(14, 240, 546, -4), key(36, 232, 544, -2), key(144, 230, 546, 0)],
    chest: [key(0, -10), key(18, -6), key(48, 8 + shiver), key(110, 12 + shiver), key(144, 14 + shiver)],
    neck: [key(0, -6), key(24, 4), key(72, 9), key(144, 10)],
    head: [key(0, -6), key(20, 6), key(60, 12), key(110, 8), key(144, 6)],
    shoulder: [key(0, -4, -3), key(24, 2, -6), key(84, 3, -5 + shiver * 0.5), key(144, 4, -5)],
    elbowBends: [1, 1],
    feet: (t) => {
      const f = t * fps;
      // Near foot stays planted at 262; far foot steps back cleanly from 230 to 196 in f0..18
      const s = Math.max(0, Math.min(f / 18, 1));
      const e = s * s * (3 - 2 * s);
      const farX = 230 - 34 * e;
      const farLift = -16 * Math.sin(Math.PI * s);
      const farFoot = s < 1 ? [farX, floor - 18 + farLift, 8 * Math.sin(Math.PI * s)] : sole(196);
      return [farFoot, sole(262)];
    },
    far: [key(0, 212, 530), key(22, 232, 502), key(56, 258, 488), key(144, 260, 492)],
    near: [key(0, 326, 474, -22), key(16, 286, 466, -108), key(44, 276, 472, -118),
      key(96, 278 + shiver, 470, -116), key(144, 276 + shiver, 472, -116)],
    nearHand: [key(0, 'hand-near'), key(16, 'hand-grip')],
    expression: [key(0, 'head-alarm'), key(28, 'head-strain'), key(90, 'head-strain')],
  };
  return rigAt(scene, local);
}

function shot5ShiverAndBrace(frame) {
  // f528..875 (local 0..347):
  // 0..132 (22..27.5s): hunched violent shivering
  // 132..228 (27.5..31.5s): clumsy reach toward bar, slips off, recoils
  // 240..347 (32..36.5s): shivering cuts off at local 256 (32.67s), knees buckle, palm braces on crate top (y=556)
  const local = frame - 528;
  const shiverAmt = local < 248 ? 1 : Math.max(0, 1 - (local - 248) / 14);
  const shX = Math.sin(local * 1.9) * 3.2 * shiverAmt;
  const shY = Math.cos(local * 2.3) * 2.2 * shiverAmt;
  const shA = Math.sin(local * 1.7) * 2.5 * shiverAmt;

  const scene = {
    pelvis: [
      key(0, 224, 545, 2), key(132, 226, 546, 3),
      key(174, 248, 545, 5), key(206, 244, 547, 3), key(236, 228, 546, 2),
      key(264, 232, 550, 5), key(294, 256, 562, 9), key(314, 260, 566, 9), key(348, 260, 566, 9),
    ],
    chest: [
      key(0, 14 + shA), key(132, 16 + shA),
      key(174, 22 + shA), key(212, 12 + shA), key(244, 15),
      key(274, 28), key(300, 38), key(348, 36),
    ],
    neck: [
      key(0, 10), key(132, 11), key(176, 8), key(244, 12),
      key(280, 22), key(306, 26), key(348, 24),
    ],
    head: [
      key(0, 8 + shA * 0.7), key(132, 6 + shA * 0.7), key(176, -2),
      key(244, 6), key(286, -8), key(314, 6), key(348, 12),
    ],
    shoulder: [
      key(0, 4 + shX * 0.5, -5 + shY * 0.4), key(132, 5 + shX * 0.5, -5 + shY * 0.4),
      key(178, 13, 0), key(238, 4, -4),
      key(288, 13, 4), key(312, 15, 7), key(348, 14, 7),
    ],
    elbowBends: [1, 1],
    feet: (t) => {
      const f = t * fps;
      // Feet firmly planted; far heel rolls up during crate brace (f274..348) just like brace.mp4!
      const roll = f < 268 ? 0 : Math.min((f - 268) / 36, 1) * 19;
      return [sole(220, roll, 30), sole(252)];
    },
    far: [
      key(0, 252 + shX, 492 + shY), key(132, 254 + shX, 492 + shY),
      key(178, 226, 526), key(236, 244, 502),
      key(278, 224, 550), key(308, 236, 560), key(348, 238, 562),
    ],
    near: [
      key(0, 272 + shX, 474 + shY, -118), key(132, 274 + shX, 476 + shY, -118),
      key(162, 336 + shX, 480 + shY, -14), key(184, 380 + shX, 478 + shY, -6),
      key(200, 366, 506, 28), key(234, 282, 492, -88),
      key(272, 326, 524, 20), key(294, 366, 549, 0), key(348, 366, 549, 0),
    ],
    nearHand: [key(0, 'hand-grip'), key(148, 'hand-brace'), key(200, 'hand-near'), key(280, 'hand-brace')],
    expression: [key(0, 'head-strain'), key(184, 'head-alarm'), key(210, 'head-strain'), key(260, 'head-notice'), key(304, 'head-strain')],
  };
  return rigAt(scene, local);
}

function shot7ParadoxicalTie(frame) {
  // f984..1199 (local 0..215):
  // 0..154 (41..47.4s): dazed warm flush, rises slightly from crate and tugs burgundy tie knot
  // 154..215 (47.4..50s): light flickers, green plunger glows right, hand lowers slightly, head snaps right
  const local = frame - 984;
  const scene = {
    pelvis: [key(0, 258, 564, 8), key(34, 246, 552, 4), key(140, 244, 550, 3), key(176, 248, 544, 2), key(216, 254, 542, 3)],
    chest: [key(0, 32), key(36, 16), key(144, 14), key(174, 10), key(216, 13)],
    neck: [key(0, 18), key(42, 8), key(144, 10), key(168, 4), key(216, 4)],
    head: [key(0, 10), key(48, 8), key(112, 12), key(152, 8), key(166, -4), key(216, -2)],
    shoulder: [key(0, 10, 4), key(44, 4, 0), key(144, 5, -2), key(182, 7, 0), key(216, 9, 0)],
    elbowBends: [1, 1],
    feet: (t) => {
      const f = t * fps;
      const roll = f < 36 ? 16 * (1 - f / 36) : 0;
      return [sole(220, roll, 30), sole(252)];
    },
    far: [key(0, 236, 558), key(44, 224, 548), key(144, 226, 546), key(216, 228, 548)],
    near: [
      key(0, 366, 549, 0), key(24, 342, 514, -40),
      key(56, 302, 456, -128), key(88, 314, 460, -118), key(114, 304, 454, -126), key(144, 312, 460, -118),
      key(166, 324, 488, -32), key(216, 362, 474, -12),
    ],
    nearHand: [key(0, 'hand-brace'), key(36, 'hand-grip'), key(162, 'hand-near')],
    expression: [key(0, 'head-strain'), key(28, 'head-relief'), key(154, 'head-notice'), key(216, 'head-notice')],
  };
  return rigAt(scene, local);
}

function shot9CollapseAndFreeze(frame) {
  // f1368..1535 (local 0..167): severe hypothermia (<28C) — knees give out, hand slips off crate,
  // lead collapses heavily onto the frosted steel floor and freezes motionless there!
  const local = frame - 1368;
  const scene = {
    pelvis: [
      key(0, 252, 548, 4),
      key(16, 248, 578, 12),
      key(30, 240, 646, 18),
      key(46, 224, 718, -14),
      key(58, 222, 724, -18),
      key(168, 222, 724, -18),
    ],
    chest: [
      key(0, 16),
      key(18, 34),
      key(34, 48),
      key(52, 56),
      key(72, 62),
      key(168, 62),
    ],
    neck: [
      key(0, 6),
      key(20, 18),
      key(46, 36),
      key(72, 46),
      key(168, 46),
    ],
    head: [
      key(0, 2),
      key(18, 14),
      key(46, 38),
      key(76, 52),
      key(168, 52),
    ],
    shoulder: [
      key(0, 8, 2),
      key(22, 12, 6),
      key(52, 6, 4),
      key(168, 6, 4),
    ],
    elbowBends: [1, 1],
    feet: (t) => {
      const f = t * fps;
      // Feet hold until f20, then slide forward along the frosted steel floor as hips hit at f46
      const s = Math.max(0, Math.min((f - 20) / 28, 1));
      const e = s * s * (3 - 2 * s);
      const farX = 220 + 112 * e;
      const nearX = 252 + 124 * e;
      const farAng = -14 * e;
      const nearAng = -22 * e;
      return [sole(farX, farAng, 0), sole(nearX, nearAng, 0)];
    },
    far: [
      key(0, 232, 548),
      key(22, 268, 582),
      key(46, 296, 720),
      key(68, 304, 734),
      key(168, 304, 734),
    ],
    near: [
      key(0, 356, 488, -14),
      key(14, 362, 549, 0),
      key(28, 366, 594, 26),
      key(48, 354, 722, 68),
      key(66, 366, 738, 78),
      key(168, 366, 738, 78),
    ],
    nearHand: [key(0, 'hand-near'), key(12, 'hand-brace'), key(28, 'hand-near')],
    expression: [key(0, 'head-alarm'), key(18, 'head-strain'), key(52, 'head-relief')],
  };
  return rigAt(scene, local);
}

export function freezerPose(frame) {
  if (frame < 84) return shot1Open(frame);
  if (frame < 192) return []; // Shot 2: POV aluminum bar stick & palm-up reveal
  if (frame < 336) return shot3Recoil(frame);
  if (frame < 528) return []; // Shot 4: Vasoconstriction cutaway
  if (frame < 876) return shot5ShiverAndBrace(frame);
  if (frame < 984) return []; // Shot 6b: Vasomotor fatigue cutaway
  if (frame < 1200) return shot7ParadoxicalTie(frame);
  if (frame < 1368) return []; // Shot 8: POV frozen jammed safety plunger
  return shot9CollapseAndFreeze(frame);
}

// Self-verify all 1536 frames have valid IK reach!
for (let f = 0; f < totalFrames; f++) {
  freezerPose(f);
}
assert.equal(freezerPose(84).length, 0);
assert.equal(freezerPose(336).length, 0);
assert.equal(freezerPose(1200).length, 0);
