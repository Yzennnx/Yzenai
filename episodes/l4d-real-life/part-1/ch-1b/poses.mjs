import assert from 'node:assert/strict';
import { floor, fps, gaitAt, rigAt, sneakAt } from '../../../../assets/series-lead/anatomy-prototype/poses.mjs';

export const duration = 85;
export const totalFrames = duration * fps; // 2040

const key = (frame, ...values) => [frame / fps, ...values];
const rad = Math.PI / 180;
function sole(x, angle = 0, pivot = 0) {
  const a = angle * rad;
  const dx = pivot * Math.cos(a) - 18 * Math.sin(a);
  const dy = pivot * Math.sin(a) + 18 * Math.cos(a);
  return [x - dx, floor - dy, angle];
}

function shot9QuietBarricadeEase(frame) {
  // f547..623 (22.8..26.0s, local 0..76): Careful quiet two-handed pull/ease of heavy bookshelf away from door!
  const local = frame - 547;
  const scene = {
    elbowBends: [1, 1],
    pelvis: [
      key(0, 244, 548, 6),
      key(22, 232, 550, 2),
      key(56, 212, 544, -2),
      key(77, 218, 538, 0),
    ],
    chest: [key(0, 24), key(22, 16), key(56, 6), key(77, 4)],
    neck: [key(0, 12), key(22, 8), key(56, 3), key(77, 2)],
    head: [key(0, -4), key(22, -2), key(56, 0), key(77, 0)],
    shoulder: [key(0, 10, 2), key(22, 6, 1), key(56, 2, 0), key(77, 0, 0)],
    feet: () => [sole(188), sole(252)],
    far: [key(0, 350, 492), key(22, 326, 498), key(56, 294, 506), key(77, 246, 542)],
    near: [key(0, 362, 498, -82), key(22, 338, 504, -76), key(56, 306, 512, -62), key(77, 260, 542, 74)],
    nearHand: [key(0, 'hand-brace'), key(62, 'hand-near')],
    expression: [key(0, 'head-sneak'), key(28, 'head-strain'), key(62, 'head-sneak')],
  };
  return rigAt(scene, local);
}

function shot12HallwaySneak(frame) {
  // f840..1019 (35.0..42.5s): Upgraded dynamic sneakAt crouch-creep silently past pounding Apt 708 zombie!
  return sneakAt(frame - 840);
}

function shot15BlackoutEscape(frame) {
  // f1245..1379 (51.9..57.5s, local 0..134): Quick low crouch phone scoop (0..38) -> silent sneakAt glide right into STAIRS!
  const local = frame - 1245;
  if (local >= 38) return sneakAt(local - 38);
  const scene = {
    elbowBends: [1, 1],
    pelvis: [key(0, 252, 584, 14), key(18, 256, 616, 24), key(38, 264, 590, 10)],
    chest: [key(0, 32), key(18, 52), key(38, 28)],
    neck: [key(0, 14), key(18, 22), key(38, 14)],
    head: [key(0, 2), key(18, 12), key(38, 2)],
    shoulder: [key(0, 8, 4), key(18, 14, 10), key(38, 8, 4)],
    feet: () => [sole(216, 16, 30), sole(294)],
    far: [key(0, 320, 560), key(18, 316, 608), key(38, 344, 548)],
    near: [key(0, 338, 558, 20), key(18, 344, 650, 48), key(38, 362, 536, 14)],
    nearHand: [key(0, 'hand-near'), key(14, 'hand-grip'), key(32, 'hand-near')],
    expression: [key(0, 'head-panic'), key(20, 'head-sneak')],
  };
  return rigAt(scene, local);
}

function shot17StairDescent(frame) {
  // f1452..1595 (1:00.5..1:06.5): Real OpenToonz walking descent down the red-lit concrete stairwell!
  const local = frame - 1452;
  const pose = gaitAt('walk', local);
  return pose.map(entry => entry[0] === 'head' ? ['head-sneak', ...entry.slice(1)] : entry);
}

function shot18LobbyExitGlide(frame) {
  // f1949..2039 (1:21.2..1:25.0): Quiet tense crouch-glide out the glass lobby doors into foggy midnight street!
  return sneakAt(frame - 1949);
}

export function ch1bPose(frame) {
  if (frame < 547) return []; // Shots 1-8: Wall tally, window OTS, aerial street, packing, cardboard armor, low-angle gear-up
  if (frame < 624) return shot9QuietBarricadeEase(frame); // Shot 9: Quiet bookshelf ease aside
  if (frame < 840) return []; // Shots 10-11: POV taped-cuff unlock, door-crack POV, Apt 708 stepped push-in
  if (frame < 1020) return shot12HallwaySneak(frame); // Shot 12: OpenToonz sneakAt crouch-creep past pounding zombie
  if (frame < 1245) return []; // Shots 13-14 + blackout stutter: Phone drop, zombie snap, glance-back, ECU crash-zoom, tube flicker
  if (frame < 1380) return shot15BlackoutEscape(frame); // Shot 15: Pitch-black phone scoop & sneakAt escape under red EXIT
  if (frame < 1452) return []; // Shot 16: POV dead elevator bell-press
  if (frame < 1596) return shot17StairDescent(frame); // Shot 17: Real OpenToonz walking descent down red-lit concrete stairs!
  if (frame < 1949) return []; // Shots 18A-18D: 1F pillar lean-out OTS, panic->think->look-down, broken glass vase pickup, emphasized bouncing/sliding glass throw!
  return shot18LobbyExitGlide(frame); // Shot 18E: Quiet lobby exit glide into midnight street fog
}

for (let f = 0; f < totalFrames; f++) ch1bPose(f);
assert.equal(ch1bPose(100).length, 0);
assert.equal(ch1bPose(1160).length, 0);
