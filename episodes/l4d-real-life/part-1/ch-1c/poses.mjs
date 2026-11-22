import assert from 'node:assert/strict';
import { dynamicScenes, floor, fps, gaitAt, rigAt, sneakAt, sprintAt } from '../../../../assets/series-lead/anatomy-prototype/poses.mjs';

export const duration = 102;
export const totalFrames = duration * fps; // 2448

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

const slashScene = dynamicScenes.find(s => s.id === 'slash').scene;

// SHOT 1 (f0..163, 0:00..0:06.8): Upright steady WALKING down the empty midnight street (NOT sneaking!)
function shot1StreetWalk(frame) {
  const pose = gaitAt('walk', frame);
  return pose.map(entry => entry[0] === 'head' ? ['head-notice', ...entry.slice(1)] : entry);
}

// SHOT 4 (f351..489, 0:14.6..0:20.4, 139 frames): TRUE PHYSICS DRAG!
// Smoker on upper-right rooftop pulls lead FORWARD-RIGHT while he leans hard BACKWARD, heels dug stiffly into asphalt,
// fighting the pull with both hands clawing at the tongue around his throat! Native 24fps smooth interpolation (ZERO lag!).
const dragScene = {
  elbowBends: [1, 1],
  pelvis: [
    [0.00, 250, 536, 2],
    [0.28, 254, 542, -6],     // Tongue snaps onto throat -> sudden jerk!
    [0.65, 224, 558, -14],    // Hips drop low & lean hard BACK fighting rightward pull!
    [1.80, 222, 560, -16],
    [3.40, 226, 558, -15],
    [4.60, 222, 562, -16],
    [5.85, 224, 560, -15],
  ],
  chest: [
    [0.00, 4], [0.28, -8], [0.65, -24], [1.80, -27], [3.40, -23], [4.60, -28], [5.85, -25],
  ],
  neck: [
    [0.00, 2], [0.28, 12], [0.65, 20], [1.80, 22], [3.40, 18], [4.60, 22], [5.85, 20],
  ],
  head: [
    [0.00, 0], [0.28, -4], [0.65, -8], [1.80, -6], [3.40, -10], [4.60, -6], [5.85, -8],
  ],
  shoulder: [
    [0.00, 0, 0], [0.28, 8, -4], [0.65, 14, -6], [3.40, 12, -5], [5.85, 14, -6],
  ],
  feet: t => {
    // Both heels dug stiffly FORWARD-RIGHT against the asphalt drag (toes tilted UP fighting the rightward pull!)
    const fFar = samplePts([
      [0.00, ...sole(230)],
      [0.45, ...sole(270, -14, -18)],
      [2.20, ...sole(274, -18, -18)],
      [4.20, ...sole(268, -15, -18)],
      [5.85, ...sole(272, -17, -18)],
    ], t);
    const fNear = samplePts([
      [0.00, ...sole(272)],
      [0.45, ...sole(322, -16, -18)],
      [2.20, ...sole(328, -20, -18)],
      [4.20, ...sole(318, -16, -18)],
      [5.85, ...sole(324, -18, -18)],
    ], t);
    return [fFar, fNear];
  },
  // Far hand clutches up at the taut tongue on his throat; near hand grabs desperately at the barbed rope pulling right!
  far: [
    [0.00, 260, 540], [0.35, 238, 434], [0.75, 232, 412], [2.40, 238, 416], [4.20, 230, 410], [5.85, 234, 414],
  ],
  near: [
    [0.00, 282, 536, 75],
    [0.35, 260, 428, -68],
    [0.75, 272, 414, -56],
    [2.40, 282, 410, -48],
    [4.20, 268, 416, -54],
    [5.85, 276, 412, -50],
  ],
  nearHand: [[0, 'hand-near'], [0.30, 'hand-grip']],
  expression: [[0, 'head-alarm'], [0.40, 'head-panic'], [2.60, 'head-pain'], [4.20, 'head-strain']],
};

function shot4SmokerDrag(frame) {
  return rigAt(dragScene, frame - 351);
}

// SHOT 6 (f615..729, 0:25.6..0:30.4, 115 frames): BUTTER-SMOOTH 24 FPS STRAIGHT-ARM 1-HANDED KNIFE SLASH!
// Uses continuous floating-point local time (ZERO Math.round frame duplication!) so every frame is fluid 24fps!
// Strike apex (t=0.76s = local 18.24, 152.9px/155px straight-arm reach!) lands EXACTLY at f663 (27.625s)!
function shot6StraightArmSlash(frame) {
  const f = frame - 615;
  const local = f <= 48
    ? (f / 48) * 18.24
    : Math.min(59.5, 18.24 + ((f - 48) / 66) * 41.26);
  const pose = rigAt(slashScene, local);
  return pose.map(entry => entry[0] === 'hand-pipe' ? ['hand-grip', ...entry.slice(1)] : entry);
}

// SHOT 8 (f840..1017, 0:35.0..0:42.4): Full-speed OpenToonz sprintAt flight!
function shot8DesperateSprint(frame) {
  return sprintAt(frame - 840);
}

// SHOT 12 (f1436..1555, 0:59.8..1:04.8, 120 frames): ATHLETIC 24 FPS 1-HANDED HURDLE VAULT & LOW COVER DUCK!
// True parkour speed-vault biomechanics (ZERO awkward frog squat, ZERO frame lag!):
// 1. Run-in approach (0..0.75s) -> 2. Palm plants flush on dumpster top-left corner (266, 546) ->
// 3. Split-leg athletic hurdle clearing cleanly OVER rim (0.75..1.65s) ->
// 4. Far-side foot landing & deep LOW COVER DUCK tucked safely behind the dumpster (1.65..5.0s)!
const athleticVaultScene = {
  elbowBends: [1, 1],
  pelvis: [
    [0.00, 114, 536, 8],
    [0.45, 158, 550, 14],     // Takeoff coil
    [0.85, 208, 504, 18],     // Explosive drive onto planted supporting arm
    [1.22, 264, 488, 20],     // Peak athletic hurdle apex clearing cleanly above dumpster rim!
    [1.62, 340, 506, 16],     // Descending cleanly past far side of dumpster
    [2.05, 392, 566, 14],     // Soft athletic landing absorbing impact
    [2.60, 404, 598, 22],     // Deep low duck behind cover!
    [5.00, 404, 600, 22],
  ],
  chest: [
    [0.00, 14], [0.45, 22], [0.85, 28], [1.22, 30], [1.62, 24], [2.05, 26], [2.60, 38], [5.00, 38],
  ],
  neck: [
    [0.00, 6], [0.45, 10], [0.85, 14], [1.22, 16], [1.62, 12], [2.05, 10], [2.60, 14], [5.00, 14],
  ],
  head: [
    [0.00, -2], [0.45, -8], [0.85, -14], [1.22, -16], [1.62, -10], [2.05, -6], [2.60, -14], [5.00, -14],
  ],
  shoulder: [
    [0.00, 4, 0], [0.85, 10, 4], [1.22, 10, 6], [1.62, 6, 2], [2.60, 6, 2], [5.00, 6, 2],
  ],
  feet: t => {
    // Athletic SPLIT-LEG HURDLE: near leg leads cleanly forward-over the lid while far leg trails smoothly behind!
    const far = t < 0.50 ? sole(96, t > 0.28 ? 22 * ((t - 0.28) / 0.22) : 0, 30)
      : t < 2.10 ? samplePts([
        [0.50, ...sole(96, 22, 30)],
        [0.95, 146, 578, 34],      // Trailing leg kicking back cleanly on push-off!
        [1.28, 222, 508, 28],      // Trailing leg clearing waist-high rim smoothly behind hips!
        [1.68, 306, 574, 12],      // Coming down over far edge
        [2.10, ...sole(354)],      // Back foot lands solidly behind dumpster
      ], t)
      : sole(354);
    const near = t < 0.42 ? sole(148)
      : t < 1.92 ? samplePts([
        [0.42, ...sole(148)],
        [0.85, 232, 550, -12],     // Lead knee driving forward-up over dumpster corner!
        [1.20, 326, 496, -18],     // Lead leg extended cleanly forward in classic hurdle!
        [1.56, 392, 594, -10],     // Reaching down for far-side landing
        [1.92, ...sole(424)],      // Lead foot plants first on far side!
      ], t)
      : sole(424);
    return [far, near];
  },
  // Near palm plants FLUSH on waist-high steel dumpster rim (294, 516) from t=0.72..1.18, pushes off cleanly, then ducks low!
  far: [
    [0.00, 144, 524], [0.45, 188, 534], [0.85, 266, 474], [1.22, 346, 452], [1.65, 420, 502], [2.05, 454, 558], [2.60, 468, 586], [5.00, 468, 586],
  ],
  near: [
    [0.00, 166, 528, 26],
    [0.45, 224, 520, 8],
    [0.72, 294, 516, 0],     // Flush vertical palm plant directly under driving shoulder!
    [1.18, 294, 516, 0],     // Supporting weight straight down through steel rim as split legs hurdle!
    [1.48, 356, 490, 20],    // Clean athletic push-off release
    [2.05, 434, 564, 34],
    [2.60, 456, 590, 42],    // Low hidden crouch behind cover!
    [5.00, 456, 590, 42],
  ],
  nearHand: [[0, 'hand-near'], [0.64, 'hand-brace'], [1.22, 'hand-near']],
  expression: [[0, 'head-determined'], [0.72, 'head-strain'], [1.95, 'head-sneak']],
};

function shot12DumpsterVault(frame) {
  return rigAt(athleticVaultScene, frame - 1436);
}

// SHOT 15A (f1901..2020, 1:19.2..1:24.2, 00:38 AM): Sneaking quietly out the back alley as the car alarm dies!
function shot15ASneakOut(frame) {
  return sneakAt(frame - 1901);
}

// SHOTS 15B & 15C (f2021..2284, 1:24.2..1:35.2, 02:15 AM -> 03:40 AM -> 04:55 AM):
// Hours wandering dead backstreets searching for shelter (upright tired walk with bulging full backpack!)
function shot15ShelterWander(frame) {
  const local = frame - 2021;
  const pose = gaitAt('walk', local);
  const expr = frame < 2156 ? 'head-notice' : 'head-exhausted';
  return pose.map(entry => entry[0] === 'head' ? [expr, ...entry.slice(1)] : entry);
}

export function ch1cPose(frame) {
  if (frame < 164) return shot1StreetWalk(frame); // Shot 1: Steady upright WALKING on midnight street!
  if (frame < 351) return []; // Shots 2-3: Cough eye-dart/look-up + Rooftop Smoker whip-pan reveal
  if (frame < 490) return shot4SmokerDrag(frame); // Shot 4: TRUE PHYSICS DRAG forward-right fighting heels!
  if (frame < 615) return []; // Shot 5: Tight throat/cuff wedge + 5-frame off-center ECU dread crash-zoom
  if (frame < 730) return shot6StraightArmSlash(frame); // Shot 6: Butter-smooth 24fps straight-arm 1-handed slash!
  if (frame < 840) return []; // Shot 7: Tight POV chipped/bent kitchen knife insert
  if (frame < 1018) return shot8DesperateSprint(frame); // Shot 8: Full-speed OpenToonz sprintAt flight
  if (frame < 1436) return []; // Shots 9-11: Market OTS horde reveal, pebble test, sedan eye-dart, rock smash & car alarm
  if (frame < 1556) return shot12DumpsterVault(frame); // Shot 12: Butter-smooth 24fps athletic split-leg hurdle vault & low duck!
  if (frame < 1901) return []; // Shots 13-14: Low-angle dumpster cover horde stampede + rhythmic POV supermarket raid montage
  if (frame < 2021) return shot15ASneakOut(frame); // Shot 15A (00:38 AM): Sneaking out back alley as alarm dies!
  if (frame < 2285) return shot15ShelterWander(frame); // Shots 15B-15C (02:15 -> 03:40 -> 04:55 AM): Hours wandering searching for shelter!
  return []; // Shot 16 (05:08 AM): Part 1 cliffhanger look-up into pale gray dawn skyline!
}

for (let frame = 0; frame < totalFrames; frame++) {
  const pose = ch1cPose(frame);
  if (pose.length) assert(pose.every(([, x, y, a]) => [x, y, a].every(Number.isFinite)));
}
