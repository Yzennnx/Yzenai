import { floor, fps, rigAt } from '../../../../assets/series-lead/anatomy-prototype/poses.mjs';
import { validatePoseTrack } from '../../../../tools/pose-grounding/validate-pose.mjs';

export const duration = 76;
export const totalFrames = duration * fps; // 1824

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

// Low-ready tactical walk (continuous floating-point local frames, grounded on floor)
// Matches Blender-grounded lead-low-ready-walk.json proportions & Ch 2C Shot 26 continuity.
function tacticalReadyWalk(local, cycle = 32, speed = 132, expr = 'head-determined') {
  const support = 0.63;
  const phase = (local % cycle) / cycle;
  const phases = [(phase + 0.5) % 1, phase];
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
    expression: [[0, expr]],
  }, 0);
}

// Low-crouch stealth creep grounded from Blender lead-crouch-stealth.json
// Keeps both feet low & quiet, knees deeply bent, shotgun tucked tight against chest.
function stealthGlassCreep(local, cycle = 44, expr = 'head-sneak', freeze = false) {
  const phase = freeze ? 0.34 : (local % cycle) / cycle;
  const support = 0.68;
  const phases = [(phase + 0.5) % 1, phase];
  const speed = 104;
  const contactX = 34;
  const centre = 270;
  const bob = freeze ? 0 : Math.cos((phase - 0.1) * 4 * Math.PI);
  const gaitHeight = 566 + 1.8 * bob; // Deep stealth crouch
  const pelvisAngle = 14;
  const chestAngle = 22;
  const landingAngle = -6;
  const toeAngle = 14;

  function ankle(p) {
    const rollStart = support - 0.14;
    if (p <= support) {
      const x = centre + contactX - speed * p;
      if (p < 0.10) return sole(x - 14, landingAngle * (1 - ease(p / 0.10)), -14);
      return p < rollStart
        ? sole(x)
        : sole(x + 24, toeAngle * ease((p - rollStart) / 0.14), 24);
    }
    const t = (p - support) / (1 - support);
    const release = sole(centre + contactX - speed * support + 24, toeAngle, 24);
    const landing = sole(centre + contactX - 14, landingAngle, -14);
    const swing = Math.sin(Math.PI * t);
    return [
      release[0] + (landing[0] - release[0]) * ease(t) - 4 * swing,
      release[1] + (landing[1] - release[1]) * ease(t) - 10 * swing,
      release[2] + (landing[2] - release[2]) * t - 4 * Math.sin(2 * Math.PI * t),
    ];
  }

  const ankles = phases.map(ankle);
  const reach = thigh + shin - 3.0;
  const hips = Math.max(gaitHeight, ...ankles.map(([x, y], index) => {
    const [hipX, hipY] = at([centre, 0, pelvisAngle], index ? 8 : -9, index ? 7 : 5);
    return y - hipY - Math.sqrt(reach ** 2 - (x - hipX) ** 2);
  }));

  const torso = [...at([centre, hips, pelvisAngle], 0, -28), chestAngle];
  const shoulderFar = at(torso, -17, -106);
  const shoulderNear = at(torso, 15, -108);
  const swayX = freeze ? 0 : Math.sin(phase * 2 * Math.PI) * 1.4;
  const swayY = freeze ? 0 : bob * 1.1;

  // Shotgun lowered & tucked tight across chest so it never rises toward the Witch
  const farWrist = [shoulderFar[0] + 92 + swayX, shoulderFar[1] + 104 + swayY, 16];
  const nearWrist = [shoulderNear[0] + 18 + swayX, shoulderNear[1] + 96 + swayY, 18];

  return rigAt({
    pelvis: [[0, centre, hips, pelvisAngle]],
    chest: [[0, chestAngle]],
    neck: [[0, -10]],
    head: [[0, -14]],
    shoulder: [[0, 4, 2]],
    elbowBends: [1, 1],
    far: [[0, ...farWrist]],
    near: [[0, ...nearWrist]],
    feet: () => ankles,
    nearHand: [[0, 'hand-grip']],
    farHand: [[0, 'hand-far']],
    expression: [[0, expr]],
  }, 0);
}

export function ch3aPose(frame) {
  if (frame >= 0 && frame <= 76) return tacticalReadyWalk(frame - 0, 32, 132, 'head-determined');       // Seg 1: Shot 1
  if (frame >= 706 && frame <= 777) return stealthGlassCreep(frame - 706, 44, 'head-sneak', false);    // Seg 2: Shot 11
  if (frame >= 984 && frame <= 1041) {                                                                 // Seg 3: Shot 15 (DEAD FREEZE)
    const expr = frame < 1010 ? 'head-alarm' : 'head-dread';
    return stealthGlassCreep(0, 44, expr, true);
  }
  if (frame >= 1430 && frame <= 1501) return stealthGlassCreep(frame - 1430, 44, 'head-sneak', false); // Seg 4: Shot 21
  if (frame >= 1574 && frame <= 1650) return tacticalReadyWalk(frame - 1574, 32, 132, 'head-determined'); // Seg 5: Shot 23
  return [];
}

// Layer 2 Anti-Awkward-Pose Gate: Biomechanical validation across all 356 OpenToonz frames!
validatePoseTrack(ch3aPose, totalFrames);
