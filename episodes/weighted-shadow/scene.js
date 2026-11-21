const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const clamp = (x) => Math.max(0, Math.min(x, 1));
const mix = (a, b, x) => a + (b - a) * x;
const ease = (x) => clamp(x) ** 2 * (3 - 2 * clamp(x));
const noise = (i) => Math.abs(Math.sin(i * 52.37 + 3.4) * 43210.358 % 1);
const ink = '#172026';
const { lead, limb } = createSeriesLeadArt(canvas);

function polygon(points, fill, stroke, width = 2) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function line(points, color, width) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function ellipse(x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function wash(x, y, rx, ry, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  const light = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  light.addColorStop(0, color);
  light.addColorStop(1, 'transparent');
  ellipse(0, 0, 1, 1, light);
  ctx.restore();
}

const scenery = document.createElement('canvas');
scenery.width = 1080;
scenery.height = 1920;
let streetReady = false;
function paintStreet() {
  const gradient = ctx.createLinearGradient(0, 0, 0, 960);
  gradient.addColorStop(0, '#0b1725');
  gradient.addColorStop(.52, '#233846');
  gradient.addColorStop(1, '#18252d');
  ctx.fillStyle = gradient;
  ctx.fillRect(-180, -200, 900, 1400);
  polygon([[-100,125],[108,98],[108,566],[-110,590]], '#263240');
  polygon([[110,202],[254,183],[256,554],[110,566]], '#1f2d3c');
  polygon([[259,106],[555,155],[600,579],[257,554]], '#283647');
  for (let i = 0; i < 12; i++) {
    const x = 268 + i % 4 * 74;
    const y = 210 + Math.floor(i / 4) * 92 + 0.12 * (x - 268);
    polygon([[x,y],[x+47,y+5],[x+45,y+61],[x,y+55]], '#172633', '#405061', 3);
    polygon([[x+6,y+7],[x+39,y+12],[x+39,y+51],[x+6,y+47]], i === 1 || i === 6 ? '#767050' : '#233547');
    line([[x+22,y+8],[x+22,y+52]], '#354556', 2);
  }
  for (let i = 0; i < 13; i++) {
    const y = 230 + i * 26;
    line([[-80,y],[109,y-12],[253,y-25]], '#344553', 1.5);
  }
  polygon([[-100,548],[303,525],[680,561],[680,713],[-100,696]], '#26333e');
  line([[-90,602],[301,572],[657,603]], '#55676f', 1.5);
  line([[291,623],[376,620],[431,623]], '#797466', 3);
  polygon([[-120,685],[304,632],[670,667],[670,1140],[-120,1140]], '#46515c');
  polygon([[-120,680],[304,628],[670,662],[670,673],[305,640],[-120,695]], '#67727a');
  polygon([[-100,740],[335,666],[670,695],[670,1130],[-100,1130]], '#3d4a55');
  for (let i = 0; i < 7; i++) {
    line([[290+i*22,637],[-255+i*200,1100]], '#293942', 2.2);
  }
  for (let i = 0; i < 7; i++) {
    const y = 650 + i * i * 10;
    line([[-90,y+35],[303,y],[660,y+37]], '#2c3a46', 2);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  wash(134, 683, 390, 144, '#9e7340');
  wash(107, 265, 122, 129, '#82623d');
  ctx.restore();
  polygon([[87,646],[113,646],[121,655],[118,663],[81,665],[77,657]], '#27323b', '#172831');
  polygon([[89,657],[92,269],[104,265],[105,656]], '#344550', '#1b2b38', 3);
  line([[97,644],[99,269],[119,250],[151,250]], '#778081', 4);
  polygon([[119,247],[159,244],[177,258],[167,269],[123,268],[109,262]], '#273340', '#14222b');
  polygon([[122,260],[173,258],[164,269],[123,270]], '#ffe9a7');
  wash(145, 269, 67, 43, '#ffe08280');
}

const grain = document.createElement('canvas');
grain.width = 360;
grain.height = 640;
const textureContext = grain.getContext('2d');
const texture = textureContext.createImageData(grain.width, grain.height);
for (let i = 0; i < texture.data.length; i += 4) {
  const tone = noise(i) < .56 ? 0 : 240;
  texture.data.set([tone, tone, tone, noise(i + 1) * 47], i);
}
textureContext.putImageData(texture, 0, 0);

function camera(t) {
  if (t < 2.97) return [1.10, 254 + 13 * ease(t / 2.6), 482];
  if (t < 7.45) return [1.19 + .11 * ease((t - 3) / 3.9), 302, 515];
  if (t < 10.55) return [1.72, 333, 590];
  if (t < 14) return [1.25, 316, 520];
  if (t < 18.45) return [1.25, mix(316, 278, ease((t - 14) / 3.8)), 520];
  if (t < 28) return [1.17, mix(269, 218, ease((t - 21) / 7)), 501];
  if (t < 32.8) return [1.24, 220, 501];
  if (t < 36.65) return [1.85, 150, 490];
  return [1.10, 245, 485];
}

// Foot position, stride, hip displacement, crouch, torso lean, arm spread, alarm.
const keyframes = [
  [0,207,-21,0,0,0,0,0], [1.10,223,25,5,0,.07,.10,0],
  [1.90,245,-23,4,2,.09,.15,0], [2.69,267,23,-3,4,.07,.15,.19],
  [3.00,274,25,-5,3,.05,.20,.24], [3.14,295,24,-25,12,-.13,.72,.85],
  [3.47,324,27,-37,43,-.22,1,1], [3.88,324,30,-24,50,-.10,.77,.8],
  [4.62,328,29,-28,45,.04,.52,.66], [5.22,320,40,-35,39,.13,.48,.52],
  [6.20,318,42,-35,45,.18,.38,.62], [7.28,327,42,-43,46,.22,.48,.75],
  [8.73,326,44,-45,46,.25,.44,.62], [9.67,319,48,-44,37,.19,.44,.61],
  [10.49,322,44,-41,41,.17,.43,.59], [11.48,334,40,-48,49,.22,.68,.73],
  [12.20,334,47,-55,49,.18,.48,.64], [14,332,52,-52,46,.19,.45,.54],
  [14.9,332,54,-57,52,.28,.46,.57], [15.5,330,57,-64,53,.35,.57,.6],
  [16.2,302,3,-32,43,.31,.47,.48], [17.35,302,2,-37,42,.28,.38,.42],
  [18.55,303,3,-40,45,.32,.45,.47], [20.2,270,-64,-19,34,.26,.34,.35],
  [21.55,270,-64,-26,36,.26,.36,.35], [22.9,269,-62,-36,38,.28,.48,.39],
  [23.8,222,27,-18,23,.17,.31,.24], [25.65,222,27,-25,27,.21,.36,.28],
  [26.58,170,-66,-14,16,.13,.22,.19], [27.50,147,-20,-3,9,.08,.12,.13],
  [29.15,145,-13,0,0,.01,.04,.05], [33,145,-13,0,0,0,0,0],
  [34.1,145,-13,1,0,-.033,0,0], [35.2,145,-13,0,1,.02,.04,.03],
  [36.65,145,-13,0,0,.02,.03,.06], [37.1,145,-13,1,3,-.07,.12,.28],
  [39.6,145,-13,-1,5,-.09,.22,.4], [39.8,147,-12,-8,8,-.16,.56,.82],
  [40.55,148,-10,-14,12,-.16,.55,.87], [42.18,150,-10,-22,23,-.18,.73,.92],
  [42.62,153,-3,-22,23,-.20,.85,1], [42.88,196,13,-26,36,.07,1,1,.72],
  [43.24,255,22,-23,67,.2,.84,1,1.19], [43.48,264,14,-28,78,.2,.55,.83,1.23],
  [44.25,264,14,-28,79,.15,.46,.67,1.18], [46,264,14,-28,78,.15,.44,.60,1.18]
];

// Alternate the lifted shoe while the planted one holds its ground.
const steps = [[0,.55,8],[.62,1.10,-10],[1.42,1.90,9],[2.15,2.69,-9],
  [15.5,16.2,-12],[18.55,20.2,15],[22.90,23.80,-18],[25.65,26.58,19],[26.68,27.50,-14]];

function pose(t) {
  const index = keyframes.findIndex((frame) => frame[0] > t);
  const left = keyframes[index < 0 ? keyframes.length - 1 : index - 1];
  const right = keyframes[index] ?? left;
  const p = left === right ? 0 : ease((t - left[0]) / (right[0] - left[0]));
  const [x, stride, hip, drop, lean, spread, alarm] = left.slice(1, 8).map((a, i) => mix(a, right[i + 1], p));
  const step = steps.find(([start, end]) => t > start && t < end);
  const lift = step ? step[2] * Math.sin(Math.PI * (t - step[0]) / (step[1] - step[0])) : 0;
  return { x, stride, hip, drop, lean, spread, alarm, lift, fall: mix(left[8] ?? 0, right[8] ?? 0, p) };
}

function projectedShadow(p, t, dx, dy, fill) {
  ctx.save();
  ctx.translate(p.x, 680);
  ctx.transform(1, 0, -dx / 230, -dy / 230, 0, 0);
  ctx.translate(-p.x, -680);
  lead(p, t, fill);
  ctx.restore();
}

function skid(t, start, x, distance) {
  const age = t - start;
  if (age < 0) return;
  const finish = x + distance * ease(age * 2);
  for (let i = 0; i < 2; i++) {
    line([[x-18*i,681+6*i],[finish-18*i,679+6*i]], '#4c423e', 3);
    line([[x-18*i,684+6*i],[finish-18*i,682+6*i]], '#897563', 1.4);
  }
  if (age < 1) {
    for (let i = 0; i < 18; i++) {
      const xx = finish - 27 * age + noise(i) * (19 + 40 * age);
      const yy = 683 - noise(i+20) * Math.sin(age * 2.9) * 18;
      ctx.globalAlpha = (1 - age) * .73;
      ellipse(xx, yy, 1 + noise(i + 8) * 2, 1, '#dfc096');
    }
    ctx.globalAlpha = 1;
  }
}

function parkedCar(t, headlights) {
  const reveal = ease((t - 36.40) / .75);
  const body = reveal > 0 ? '#394d61' : '#2c3846';
  const wheels = '#19232e';
  ellipse(122, 621, 102, 12, '#1d2933');
  ellipse(66, 613, 14, 19, wheels);
  ellipse(197, 617, 15, 19, wheels);
  polygon([[38,592],[51,570],[76,564],[98,530],[158,530],[191,573],[213,587],[216,614],[38,611]], body, '#182431', 3);
  polygon([[87,564],[105,538],[151,538],[175,568]], '#222f3d', '#51606a', 2);
  line([[131,538],[134,565]], '#394959', 2);
  polygon([[42,590],[75,575],[188,577],[210,587],[211,609],[47,607]], '#354554', '#202e3b', 2);
  polygon([[105,592],[151,592],[152,605],[105,604]], '#23303c');
  line([[115,598],[142,598]], '#5b6773', 2);
  for (const [x,y] of [[76,592],[181,595]]) {
    ellipse(x,y,13,6,headlights > 0 ? '#f1fcff' : '#536473');
    if (!headlights) continue;
    ctx.save();
    ctx.globalAlpha = headlights;
    ctx.globalCompositeOperation = 'screen';
    wash(x,y,38,28,'#83cdff');
    wash(x+24,715,161,95,'#6493c28c');
    polygon([[x-9,y],[x+10,y],[x+128,789],[x-75,769]], '#94cafa37');
    ctx.restore();
  }
}

function overhead(p,t) {
  ctx.save();
  ctx.translate(270,500);
  ctx.scale(1.66,1.66);
  ctx.translate(-286,-680);
  ctx.fillStyle = '#4b545c';
  ctx.fillRect(0,370,620,620);
  for (let x = 40; x < 620; x += 94) {
    line([[x,370],[x,980]], '#39454e', 2);
  }
  for (let y = 410; y < 980; y += 82) {
    line([[0,y],[620,y]], '#39454e', 2);
  }
  wash(118,650,275,212,'#977751');
  skids(t);
  projectedShadow(p,t,(p.x-145)*1.10,18+(p.x-145)*.23,'#1a232d');
  const body = [p.x + p.hip - 13,653];
  const toe = [p.x - p.stride * .5 - 8,685 + Math.min(0,p.lift)];
  const heel = [p.x + p.stride * .5,675 - Math.max(0,p.lift)];
  for (const [x,y] of [toe,heel]) {
    limb(body,[mix(body[0],x,.65),y-17],[x,y],'#405c62','#77918c',13);
    polygon([[x-17,y-6],[x+7,y-8],[x+8,y+7],[x-17,y+8],[x-22,y+2]], '#4e666a', ink, 2);
  }
  polygon([[body[0]-25,body[1]-17],[body[0]+16,body[1]-15],[body[0]+22,body[1]+11],[body[0]-24,body[1]+15]], '#d29b4a', ink, 3);
  ellipse(body[0]-18,body[1]-3,16,14,'#354a43');
  line([[body[0]-29,body[1]+3],[body[0]-13,body[1]+8]], '#68776a', 3);
  ctx.restore();
}

function skids(t) {
  skid(t,3.13,283,57);
  skid(t,11.26,331,17);
  skid(t,42.62,152,113);
}

function captions(t, pages) {
  const cue = pages.find(({start, end}) => t >= start && t < end);
  if (!cue) return;
  ctx.font = '900 34px Arial, sans-serif';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#111821';
  const width = ctx.measureText(cue.text).width;
  ctx.save();
  ctx.translate(258, 808);
  ctx.scale(Math.min(1, 420 / width), 1);
  let x = -width / 2;
  for (const word of cue.text.split(' ')) {
    ctx.strokeText(word, x, 0);
    ctx.fillStyle = cue.emphasis.includes(word.replace(/[^A-Z]/g, '')) ? '#ffda64' : '#fff9e9';
    ctx.fillText(word, x, 0);
    x += ctx.measureText(word + ' ').width;
  }
  ctx.restore();
}

window.renderFrame = (t, pages, cutout, silhouette) => {
  ctx.setTransform(2,0,0,2,0,0);
  const p = pose(t);
  const [scale, x, y] = camera(t);
  ctx.save();
  ctx.translate(270, 480);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);
  if (!streetReady) {
    ctx.save();
    ctx.setTransform(2,0,0,2,0,0);
    paintStreet();
    ctx.restore();
    scenery.getContext('2d').drawImage(canvas,0,0);
    streetReady = true;
  }
  if (t >= 18.45 && t < 21.15) {
    ctx.restore();
    ctx.save();
    overhead(p,t);
  } else {
    ctx.drawImage(scenery,0,0,540,960);
    const headlights = ease((t - 39.62) / .18);
    parkedCar(t,headlights);
    const weight = ease((t - 2.94) / .24);
    const distance = Math.max(0,p.x - 145);
    const shadowLength = t < 14 ? (p.x - 130) * (.80 + .28 * weight) : 8 + distance * 1.13;
    const shadowDepth = t < 14 ? 42 + weight * 25 : 9 + distance * .31;
    if (cutout) {
      ctx.save();
      ctx.translate(p.x, 680);
      ctx.transform(1, 0, -shadowLength / 230, -shadowDepth / 230, 0, 0);
      ctx.translate(-p.x, -680);
      ctx.drawImage(silhouette, 155, 360, 320, 350);
      ctx.restore();
    } else {
      projectedShadow(p,t,shadowLength,shadowDepth,'#141b25');
    }
    if (headlights > 0) {
      const extension = headlights * mix(.74,1,ease((t - 40.70) / 1.20));
      projectedShadow(p,t,(-137 + (p.x - 145) * .39) * extension,142 * extension,'#101a28');
      projectedShadow(p,t,(137 + (p.x - 145) * .39) * extension,152 * extension,'#121d2c');
    }
    skids(t);
    if (cutout) ctx.drawImage(cutout, 155, 360, 320, 350);
    else lead(p,t);
  }
  ctx.restore();
  const vignette = ctx.createRadialGradient(265,503,212,266,480,555);
  vignette.addColorStop(0,'transparent');
  vignette.addColorStop(1,'#090f1bce');
  ctx.fillStyle = vignette;
  ctx.fillRect(0,0,540,960);
  ctx.globalAlpha = .70;
  ctx.drawImage(grain,0,0,540,960);
  ctx.globalAlpha = 1;
  captions(t,pages);
};

renderFrame(0, []);
