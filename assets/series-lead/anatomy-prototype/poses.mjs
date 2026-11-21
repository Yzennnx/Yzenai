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
