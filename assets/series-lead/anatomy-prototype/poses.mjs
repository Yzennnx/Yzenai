import assert from 'node:assert/strict';

export const fps = 24;
export const floor = 756;
export const seat = 656;
export const table = 556;
const thigh = 105;
const shin = 101;
const upperArm = 83;
const forearm = 72;
const rad = Math.PI / 180;
const ease = t => t * t * (3 - 2 * t);

function sample(keys, t) {
  const next = keys.findIndex(key => key[0] > t);
  if (next === 0) return keys[0].slice(1);
  if (next === -1) return keys.at(-1).slice(1);
  const a = keys[next - 1];
  const b = keys[next];
  const amount = ease((t - a[0]) / (b[0] - a[0]));
  return a.slice(1).map((value, index) => value + (b[index + 1] - value) * amount);
}

function partAt(keys, t, fallback) {
  return keys?.findLast(([start]) => start <= t)?.[1] ?? fallback;
}

function at(origin, x, y) {
  const angle = origin[2] * rad;
  return [origin[0] + x * Math.cos(angle) - y * Math.sin(angle),
    origin[1] + x * Math.sin(angle) + y * Math.cos(angle)];
}

function sole(x, angle = 0, pivot = 0) {
  const [dx, dy] = at([0, 0, angle], pivot, 18);
  return [x - dx, floor - dy, angle];
}

export function gaitAt(action, frame) {
  const run = action === 'run';
  const cycle = run ? 18 : 28;
  const support = run ? .39 : .61;
  const phase = frame % cycle / cycle;
  const phases = [(phase + .5) % 1, phase];
  const speed = run ? 304 : 145;
  const contactX = run ? 60 : 45;
  const centre = 270;
  const bob = Math.cos((phase - .12) * 4 * Math.PI);
  const gaitHeight = (run ? 535 : 527) + (run ? 5 : 2) * bob;
  const pelvisAngle = run ? 5 : 1;
  const chestAngle = run ? 12 : 4;
  const landingAngle = run ? 0 : -12;
  const toeAngle = run ? 27 : 19;

  function ankle(p) {
    const rollStart = support - .15;
    if (p <= support) {
      const x = centre + contactX - speed * p;
      if (p < .10 && landingAngle) return sole(x - 18, landingAngle * (1 - ease(p / .10)), -18);
      return p < rollStart
        ? sole(x)
        : sole(x + 30, toeAngle * ease((p - rollStart) / .15), 30);
    }
    const t = (p - support) / (1 - support);
    const release = sole(centre + contactX - speed * support + 30, toeAngle, 30);
    const landing = landingAngle ? sole(centre + contactX - 18, landingAngle, -18) : sole(centre + contactX);
    const swing = Math.sin(Math.PI * t);
    return [
      release[0] + (landing[0] - release[0]) * ease(t) - (run ? 37 : 6) * swing,
      release[1] + (landing[1] - release[1]) * ease(t) - (run ? 55 : 18) * swing,
      release[2] + (landing[2] - release[2]) * t - (run ? 15 : 6) * Math.sin(2 * Math.PI * t),
    ];
  }

  const ankles = phases.map(ankle);
  // Keep a small knee bend when either foot reaches the end of its stride.
  const reach = thigh + shin - 1.75;
  const hips = Math.max(gaitHeight, ...ankles.map(([x, y], index) => {
    const [hipX, hipY] = at([centre, 0, pelvisAngle], index ? 8 : -9, index ? 7 : 5);
    return y - hipY - Math.sqrt(reach ** 2 - (x - hipX) ** 2);
  }));
  const torso = [...at([centre, hips, pelvisAngle], 0, -28), chestAngle];
  const arms = phases.map((p, index) => {
    const swing = Math.cos(2 * Math.PI * p);
    const shoulder = at(torso, index ? 11 : -17, index ? -108 : -106);
    const upper = ((run ? 91 : 92) + (run ? 31 : 12) * swing) * rad;
    const lower = upper - (run ? 78 : 10 + 3 * swing) * rad;
    return [[0, shoulder[0] + upperArm * Math.cos(upper) + forearm * Math.cos(lower),
      shoulder[1] + upperArm * Math.sin(upper) + forearm * Math.sin(lower)]];
  });
  const scene = {
    pelvis: [[0, centre, hips, pelvisAngle]],
    chest: [[0, chestAngle]], neck: [[0, run ? 6 : 2]], head: [[0, -3]],
    shoulder: [[0, 0, 0]], elbowBends: [1, 1], far: arms[0], near: arms[1],
    feet: () => ankles,
    nearHand: run ? [[0, 'hand-run-near']] : undefined,
    farHand: run ? [[0, 'hand-run-far']] : undefined,
  };
  const pose = rigAt(scene, 0);
  if (run && phases.every(p => p > support)) {
    assert(ankles.every(point => at(point, 30, 18)[1] < floor + 1),
      'Running flight must leave both toes off the floor');
  }
  return pose;
}

function limb(start, target, upper, lower, bend) {
  const dx = target[0] - start[0];
  const dy = target[1] - start[1];
  const distance = Math.hypot(dx, dy);
  assert(distance > Math.abs(upper - lower) && distance < upper + lower,
    `Joint target ${target.map(value => value.toFixed(1)).join(', ')} is ${distance.toFixed(1)} from ${start.map(value => value.toFixed(1)).join(', ')} (reach ${upper + lower})`);
  const direction = Math.atan2(dy, dx);
  const flex = Math.acos((upper ** 2 + distance ** 2 - lower ** 2) / (2 * upper * distance));
  const angle = direction + bend * flex;
  const elbow = [start[0] + upper * Math.cos(angle), start[1] + upper * Math.sin(angle)];
  const next = Math.atan2(target[1] - elbow[1], target[0] - elbow[0]) / rad;
  return [[...start, angle / rad - 90], [...elbow, next - 90], [...target.slice(0, 2), next]];
}

export const scenes = [
  {
    id: 'sit',
    studyCheck: 'sit',
    seconds: 3.5,
    elbowBends: [1, 1],
    pelvis: [[0,270,532,0],[.48,265,539,2],[.95,249,570,3],[1.42,224,624,-5],
      [1.56,220,632,-7],[1.80,220,632,-7],[2.20,223,632,-3],[3.5,223,632,-3]],
    chest: [[0,0],[.48,12],[.98,26],[1.42,32],[1.62,27],[2.24,12],[3.5,10]],
    neck: [[0,0],[.72,14],[1.53,23],[2.32,7]],
    head: [[0,0],[.58,6],[1.12,-2],[1.56,-9],[1.88,3],[2.53,0]],
    shoulder: [[0,0,0],[.91,5,1],[1.48,8,0],[2.36,1,0]],
    feet: () => [sole(267), sole(309)],
    far: [[0,252,547,82],[.47,262,549,78],[.94,282,571,56],[1.28,294,598,35],
      [1.68,291,629,17],[1.96,278,635,8],[2.26,269,637,8],[3.5,269,637,8]],
    near: [[0,285,549,88],[.56,293,550,82],[.96,323,565,53],[1.29,339,594,33],
      [1.59,325,622,20],[1.85,312,633,10],[2.20,303,635,6],[3.5,303,635,6]],
  },
  {
    id: 'brace',
    studyCheck: 'brace',
    seconds: 3.5,
    elbowBends: [1, 1],
    pelvis: [[0,195,535,0],[.45,207,534,2],[.75,239,541,7],[1.05,252,552,9],
      [1.27,259,557,8],[1.65,259,557,8],[2.08,244,548,2],[2.58,216,539,0],[3.4,215,536,0]],
    chest: [[0,1],[.44,4],[.76,14],[1.05,32],[1.22,38],[1.62,34],[2.12,20],[2.61,5],[3.4,1]],
    neck: [[0,1],[.70,5],[1.12,27],[1.40,22],[2.38,6]],
    head: [[0,0],[.63,10],[.85,-9],[1.12,-17],[1.42,-4],[2.15,0]],
    shoulder: [[0,0,0],[.69,5,-5],[1.02,11,1],[1.18,15,8],[1.61,10,4],[2.36,3,0],[2.87,0,0]],
    feet: t => {
      const [toeRoll] = sample([[0,0],[.56,0],[1.06,19],[1.6,19],[2.24,0]], t);
      return [sole(183, toeRoll, 30), sole(247)];
    },
    // Let the elbow lead behind the shoulder and the wrist stay below it.
    far: [[0,178,551],[.45,194,550],[.75,198,547],[1.05,220,552],[1.25,231,558],
      [1.55,239,563],[1.90,233,563],[2.20,237,561],[2.60,211,554],[3.40,206,554]],
    near: [[0,220,522],[.50,242,515],[.74,303,511],[.92,345,529],[1.04,375,549],
      [2.20,375,549],[2.31,350,530],[2.48,326,524],[2.96,256,533],[3.4,239,528]],
  },
  {
    id: 'step',
    studyCheck: 'step',
    seconds: 3.5,
    elbowBends: [1, 1],
    pelvis: [[0,210,535,-1],[.55,224,531,2],[.89,251,530,4],[1.24,267,536,2],
      [1.5,278,543,1],[1.69,286,550,2],[1.96,317,543,1],[2.4,340,538,0],[3.5,341,537,0]],
    chest: [[0,0],[.55,7],[1.06,13],[1.49,8],[1.72,15],[2.31,4],[3.5,1]],
    neck: [[0,0],[.85,7],[1.68,9],[2.5,1]],
    head: [[0,0],[.82,-4],[1.50,-2],[1.80,4],[2.5,0]],
    shoulder: [[0,0,0],[.91,-2,2],[1.65,-7,2],[2.42,0,0]],
    feet: t => {
      const [push] = sample([[0,0],[1.51,0],[2.12,26],[3.5,26]], t);
      const heelStrike = sole(325, -17, -18);
      let near;
      if (t < .6) {
        const [roll] = sample([[0,0],[.40,0],[.60,20]], t);
        near = sole(208, roll, 30);
      } else if (t < 1.5) {
        near = sample([[.6,...sole(208,20,30)],[.94,237,697,1],
          [1.23,300,707,-9],[1.5,...heelStrike]], t);
      } else {
        const [roll] = sample([[1.5,-17],[1.76,0]], t);
        near = sole(325, roll, -18);
      }
      return [sole(270, push, 30), near];
    },
    far: [[0,190,522],[.58,246,519],[1.11,301,511],[1.55,318,514],
      [1.95,329,520],[2.36,324,517],[3.5,326,519]],
    near: [[0,228,522],[.65,229,519],[1.10,231,512],[1.54,247,516],
      [1.96,289,525],[2.4,344,526],[3.5,363,522]],
  },
];

export function sprintAt(frame) {
  // High-intensity desperate sprint: deep 24deg lean, explosive knee drive, wide pumping arms, clear flight!
  const cycle = 17;
  const support = .34;
  const phase = (frame % cycle) / cycle;
  const phases = [(phase + .5) % 1, phase];
  const speed = 345;
  const contactX = 64;
  const centre = 270;
  const bob = Math.cos((phase - .12) * 4 * Math.PI);
  const gaitHeight = 544 + 8 * bob;
  const pelvisAngle = 11;
  const chestAngle = 24;
  const toeAngle = 32;

  function ankle(p) {
    const rollStart = support - .14;
    if (p <= support) {
      const x = centre + contactX - speed * p;
      return p < rollStart
        ? sole(x)
        : sole(x + 30, toeAngle * ease((p - rollStart) / .14), 30);
    }
    const t = (p - support) / (1 - support);
    const release = sole(centre + contactX - speed * support + 30, toeAngle, 30);
    const landing = sole(centre + contactX);
    const swing = Math.sin(Math.PI * t);
    return [
      release[0] + (landing[0] - release[0]) * ease(t) - 44 * swing,
      release[1] + (landing[1] - release[1]) * ease(t) - 72 * swing,
      release[2] + (landing[2] - release[2]) * t - 18 * Math.sin(2 * Math.PI * t),
    ];
  }

  const ankles = phases.map(ankle);
  const reach = thigh + shin - 2.0;
  const hips = Math.max(gaitHeight, ...ankles.map(([x, y], index) => {
    const [hipX, hipY] = at([centre, 0, pelvisAngle], index ? 8 : -9, index ? 7 : 5);
    return y - hipY - Math.sqrt(reach ** 2 - (x - hipX) ** 2);
  }));
  const torso = [...at([centre, hips, pelvisAngle], 0, -28), chestAngle];
  const arms = phases.map((p, index) => {
    const swing = Math.cos(2 * Math.PI * p);
    const shoulder = at(torso, index ? 13 : -15, index ? -108 : -106);
    // Athletic counter-pump: back arm swings cleanly behind hip, front arm drives high past chest!
    const upper = (98 + 50 * swing) * rad;
    const lower = upper - (83 - 13 * swing) * rad;
    return [[0, shoulder[0] + upperArm * Math.cos(upper) + forearm * Math.cos(lower),
      shoulder[1] + upperArm * Math.sin(upper) + forearm * Math.sin(lower)]];
  });
  return rigAt({
    pelvis: [[0, centre, hips, pelvisAngle]],
    chest: [[0, chestAngle]], neck: [[0, 10]], head: [[0, -4]],
    shoulder: [[0, 4, 0]], elbowBends: [1, 1], far: arms[0], near: arms[1],
    feet: () => ankles,
    nearHand: [[0, 'hand-run-near']],
    farHand: [[0, 'hand-run-far']],
    expression: [[0, 'head-determined']],
  }, 0);
}

export function sneakAt(frame) {
  // Low, tense stealth crouch-creep: deep bent knees, careful toe-first placement, forward balancing hands!
  const cycle = 36;
  const support = .66;
  const phase = (frame % cycle) / cycle;
  const phases = [(phase + .5) % 1, phase];
  const speed = 112;
  const contactX = 48;
  const centre = 266;
  const bob = Math.cos((phase - .12) * 4 * Math.PI);
  const gaitHeight = 588 + 5 * bob;
  const pelvisAngle = 9;
  const chestAngle = 28;

  function ankle(p) {
    const rollStart = support - .16;
    if (p <= support) {
      const x = centre + contactX - speed * p;
      return p < rollStart
        ? sole(x)
        : sole(x + 30, 18 * ease((p - rollStart) / .16), 30);
    }
    const t = (p - support) / (1 - support);
    const release = sole(centre + contactX - speed * support + 30, 18, 30);
    const landing = sole(centre + contactX);
    const swing = Math.sin(Math.PI * t);
    return [
      release[0] + (landing[0] - release[0]) * ease(t) - 8 * swing,
      release[1] + (landing[1] - release[1]) * ease(t) - 24 * swing,
      release[2] + (landing[2] - release[2]) * t + 10 * swing, // Toe-first quiet placement!
    ];
  }

  const ankles = phases.map(ankle);
  const reach = thigh + shin - 2.0;
  const hips = Math.max(gaitHeight, ...ankles.map(([x, y], index) => {
    const [hipX, hipY] = at([centre, 0, pelvisAngle], index ? 8 : -9, index ? 7 : 5);
    return y - hipY - Math.sqrt(reach ** 2 - (x - hipX) ** 2);
  }));
  const s = Math.sin(2 * Math.PI * phase);
  // Hands poised forward & low with elbows tucked naturally near ribs; head level scanning forward!
  const farW = [centre + 84 + s * 10, hips - 42];
  const nearW = [centre + 104 - s * 12, hips - 54];
  return rigAt({
    pelvis: [[0, centre, hips, pelvisAngle]],
    chest: [[0, chestAngle]], neck: [[0, 14]], head: [[0, 2]],
    shoulder: [[0, 8, 4]], elbowBends: [1, 1],
    far: [[0, farW[0], farW[1]]],
    near: [[0, nearW[0], nearW[1], 14]],
    feet: () => ankles,
    nearHand: [[0, 'hand-near']],
    expression: [[0, 'head-sneak']],
  }, 0);
}

export const dynamicScenes = [
  {
    id: 'sneak',
    label: 'Stealth Crouch-Creep',
    seconds: 3.0,
    poseAt: frame => sneakAt(frame),
  },
  {
    id: 'flinch',
    label: 'Scare Flinch & Stumble Back',
    seconds: 2.5,
    scene: {
      elbowBends: [1, 1],
      pelvis: [[0,278,536,1],[.45,280,537,1],[.62,254,546,-11],[1.05,214,554,-10],[1.42,204,548,-3],[1.85,212,538,0],[2.5,212,538,0]],
      chest: [[0,4],[.45,5],[.62,-18],[1.05,-14],[1.42,8],[1.85,4],[2.5,3]],
      neck: [[0,2],[.45,2],[.62,-11],[1.05,-8],[1.42,5],[1.85,2],[2.5,2]],
      head: [[0,0],[.45,0],[.62,-12],[1.05,-6],[1.45,4],[1.90,0],[2.5,0]],
      shoulder: [[0,0,0],[.45,0,0],[.62,-8,-8],[1.05,-5,-4],[1.48,2,0],[2.5,0,0]],
      feet: t => {
        const back = t < .55 ? sole(252)
          : t < .88 ? sample([[.55,...sole(252)],[.72,202,718,10],[.88,...sole(170)]], t)
          : sole(170);
        const front = t < .62 ? sole(294)
          : t < 1.05 ? sample([[.62,...sole(294)],[.82,272,720,-14],[1.05,...sole(244)]], t)
          : sole(244);
        return [back, front];
      },
      // Relaxed hanging idle -> both hands snap up defensively to chest/chin guard on scare -> guarded stance!
      far: [[0,274,548],[.45,276,548],[.62,334,434],[1.05,314,444],[1.45,288,482],[1.95,264,514],[2.5,264,514]],
      near: [[0,300,548,80],[.45,302,548,80],[.62,344,424,-68],[1.05,322,434,-56],[1.45,296,474,-24],[1.95,276,512,22],[2.5,276,512,22]],
      nearHand: [[0,'hand-near'],[.56,'hand-brace'],[1.45,'hand-grip']],
      expression: [[0,'head-notice'],[.52,'head-alarm'],[.92,'head-dread'],[1.52,'head-panic']],
    },
  },
  {
    id: 'sprint',
    label: 'Desperate Full-Out Sprint',
    seconds: 3.0,
    poseAt: frame => sprintAt(frame),
  },
  {
    id: 'shove',
    label: 'Heavy Barricade Shove',
    seconds: 3.0,
    scene: {
      elbowBends: [1, 1],
      // Deep back-foot coil anticipation -> explosive drive forward -> straining tremble -> settle!
      pelvis: [[0,224,540,2],[.48,200,548,-2],[.82,256,556,10],[1.85,262,558,11],[2.30,226,544,2],[3.0,220,538,0]],
      chest: [[0,8],[.48,-4],[.82,36],[1.35,38],[1.85,36],[2.35,10],[3.0,4]],
      neck: [[0,4],[.48,-2],[.82,20],[1.85,22],[2.35,6],[3.0,2]],
      head: [[0,0],[.48,6],[.82,-14],[1.85,-12],[2.35,0],[3.0,0]],
      shoulder: [[0,0,0],[.48,-6,2],[.82,16,4],[1.85,18,5],[2.35,2,0],[3.0,0,0]],
      feet: t => {
        const roll = t < .55 ? 0 : t < .85 ? 20 * ease((t - .55) / .30) : t < 1.95 ? 20 : t < 2.35 ? 20 * (1 - ease((t - 1.95) / .40)) : 0;
        return [sole(182, roll, 30), sole(256)];
      },
      far: [[0,248,526],[.48,218,504],[.82,364,484],[1.85,366,484],[2.35,246,544],[3.0,236,552]],
      near: [[0,278,520,10],[.48,242,494,-16],[.82,374,492,-86],[1.85,375,492,-86],[2.35,268,538,54],[3.0,256,548,82]],
      nearHand: [[0,'hand-near'],[.72,'hand-brace'],[2.05,'hand-near']],
      expression: [[0,'head-determined'],[.72,'head-strain'],[2.15,'head-exhausted']],
    },
  },
  {
    id: 'slash',
    label: 'Weapon Windup & Snappy Slash',
    seconds: 2.5,
    scene: {
      elbowBends: [1, 1],
      // Coiled anticipation -> explosive forward lunge + fast 5-frame slash arc -> low combat guard settle!
      pelvis: [[0,234,538,2],[.52,212,550,-4],[.74,274,556,11],[1.05,282,558,10],[1.55,256,546,5],[2.5,256,546,5]],
      chest: [[0,6],[.52,-10],[.74,30],[1.05,26],[1.55,14],[2.5,14]],
      neck: [[0,3],[.52,-4],[.74,16],[1.55,8],[2.5,8]],
      head: [[0,0],[.52,4],[.74,-12],[1.55,-6],[2.5,-6]],
      shoulder: [[0,0,0],[.52,-10,-4],[.74,16,6],[1.55,6,2],[2.5,6,2]],
      feet: t => {
        const front = t < .50 ? sole(264)
          : t < .76 ? sample([[.50,...sole(264)],[.64,306,718,-14],[.76,...sole(336)]], t)
          : sole(336);
        const backRoll = t < .52 ? 0 : t < .76 ? 22 * ease((t - .52) / .24) : 14;
        return [sole(204, backRoll, 30), front];
      },
      // Far arm balances out cleanly; near arm grips survival pipe -> winds back -> snaps down-forward -> combat guard!
      far: [[0,262,530],[.52,296,474],[.74,230,520],[1.55,274,518],[2.5,274,518]],
      near: [[0,282,534,12],[.50,186,436,-55],[.64,344,412,18],[.76,396,522,92],[1.05,368,540,104],[1.55,332,498,18],[2.5,332,498,18]],
      nearHand: [[0,'hand-pipe']],
      expression: [[0,'head-determined'],[.54,'head-angry'],[1.35,'head-determined']],
    },
  },
  {
    id: 'vault',
    label: 'One-Handed Obstacle Vault',
    seconds: 3.0,
    scene: {
      elbowBends: [1, 1],
      // Crouch anticipation -> palm plants on barrier (x=292, y=544) -> center of mass passes cleanly over planted hand -> landing!
      pelvis: [[0,148,540,4],[.42,162,578,12],[.78,204,516,18],[1.18,246,492,20],[1.58,330,520,14],[1.92,382,582,12],[2.42,394,540,2],[3.0,394,538,0]],
      chest: [[0,10],[.42,26],[.78,40],[1.18,42],[1.58,28],[1.92,26],[2.42,6],[3.0,2]],
      neck: [[0,4],[.42,12],[1.18,18],[1.92,12],[2.42,3],[3.0,2]],
      head: [[0,0],[.42,-8],[1.18,-14],[1.92,-6],[2.42,0],[3.0,0]],
      shoulder: [[0,2,0],[.78,10,6],[1.18,10,8],[1.92,6,2],[2.42,0,0],[3.0,0,0]],
      feet: t => {
        // Both feet push off ground -> tuck high over barrier (y=550!) -> land cleanly on far side!
        const far = t < .50 ? sole(130, t > .32 ? 20 * ease((t - .32) / .18) : 0, 30)
          : t < 1.82 ? sample([[.50,...sole(130,20,30)],[.95,186,618,26],[1.22,264,538,18],[1.52,334,620,-10],[1.82,...sole(362)]], t)
          : sole(362);
        const near = t < .46 ? sole(176)
          : t < 1.76 ? sample([[.46,...sole(176)],[.88,220,582,16],[1.18,296,526,12],[1.48,372,612,-14],[1.76,...sole(410)]], t)
          : sole(410);
        return [far, near];
      },
      // Near hand plants firmly on top of barrier (292, 544) during vault, pushes off cleanly at t=1.22!
      far: [[0,174,532],[.42,194,548],[.85,254,482],[1.25,332,456],[1.92,430,542],[2.42,386,554],[3.0,384,554]],
      near: [[0,192,538,24],[.42,226,562,10],[.74,292,544,0],[1.22,292,544,0],[1.58,342,512,20],[1.92,438,548,32],[2.42,418,544,82],[3.0,418,544,82]],
      nearHand: [[0,'hand-near'],[.66,'hand-brace'],[1.26,'hand-near']],
      expression: [[0,'head-determined'],[.70,'head-strain'],[1.82,'head-notice'],[2.35,'head-determined']],
    },
  },
];

// Validate all dynamic action frames on import!
for (const action of dynamicScenes) {
  const count = Math.round(action.seconds * fps);
  for (let f = 0; f < count; f++) {
    action.poseAt ? action.poseAt(f) : rigAt(action.scene, f);
  }
}

export function rigAt(scene, frame) {
  const t = frame / fps;
  const pelvis = sample(scene.pelvis, t);
  const chest = [...at(pelvis, 0, -28), sample(scene.chest, t)[0]];
  const neck = [...at(chest, 3, -127), sample(scene.neck, t)[0]];
  const head = [...at(neck, 0, -21), sample(scene.head, t)[0]];
  const [reachX, reachY] = sample(scene.shoulder, t);
  const wrists = [sample(scene.far, t), sample(scene.near, t)];
  const ankles = scene.feet(t);

  if (scene.studyCheck === 'sit' && t >= 1.56) assert(Math.abs(at(pelvis, 0, 24)[1] - seat) < 1);
  if (scene.studyCheck === 'brace' && t >= 1.04 && t <= 2.2) {
    assert.deepEqual(wrists[1], [375, table - 7]);
    assert.deepEqual(ankles[1], sole(247));
  }
  if (scene.studyCheck === 'step') {
    const [ballX, ballY] = at(ankles[0], 30, 18);
    assert(Math.hypot(ballX - 270, ballY - floor) < 1e-6);
    if (t >= 1.5) {
      const [heelX, heelY] = at(ankles[1], -18, 18);
      assert(Math.hypot(heelX - 325, heelY - floor) < 1e-6);
    }
  }

  const leg = side => {
    const index = side === 'far' ? 0 : 1;
    const ankle = ankles[index];
    const [top, bottom] = limb(at(pelvis, index ? 8 : -9, index ? 7 : 5), ankle, thigh, shin, -1);
    return [[`thigh-${side}`, ...top], [`shin-${side}`, ...bottom], [`foot-${side}`, ...ankle]];
  };
  const arm = side => {
    const near = side === 'near';
    const bracing = near && scene.studyCheck === 'brace' && t >= .76 && t <= 2.3;
    const start = at(chest, near ? 11 + reachX : -17, near ? -108 + reachY : -106);
    const index = near ? 1 : 0;
    const [top, bottom, end] = limb(start, wrists[index], upperArm, forearm, scene.elbowBends[index]);
    if (!near && scene.studyCheck === 'brace' && t >= 1.04 && t <= 2.2) {
      assert(bottom[0] < start[0] && start[1] < bottom[1] && bottom[1] < end[1],
        'Free arm must trail behind the shoulder with the wrist below the elbow during the brace');
    }
    const angle = wrists[index][2] ?? end[2];
    end[2] = bracing ? sample([[.76,30],[1.04,0],[2.2,0],[2.3,17]], t)[0] : angle;
    const hand = partAt(near ? scene.nearHand : scene.farHand, t, bracing ? 'hand-brace' : `hand-${side}`);
    return [[`shoulder-${side}`, ...start, chest[2]], [`arm-${side}`, ...top],
      [`forearm-${side}`, ...bottom], [hand, ...end]];
  };
  return [...arm('far'), ...leg('far'), ...leg('near'), ['pelvis', ...pelvis],
    ['chest', ...chest], ['neck', ...neck], [partAt(scene.expression, t, 'head'), ...head], ...arm('near')];
}
