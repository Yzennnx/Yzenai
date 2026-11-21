(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);
  const W = 540, H = 960;
  const ink = '#122528';
  const light = '#f3d9a2';
  const rect = (color, x, y, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const polygon = (color, points) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  const label = (value, x, y, size, color = light, align = 'center') => {
    ctx.font = `bold ${size}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
  };
  const tween = (frame, start, end) => {
    const t = Math.max(0, Math.min(1, (frame - start) / (end - start)));
    return t * t * (3 - 2 * t);
  };

  function texture() {
    const paper = document.createElement('canvas');
    paper.width = W;
    paper.height = H;
    const surface = paper.getContext('2d');
    let seed = 83;
    const random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 22000; i++) {
      surface.fillStyle = i % 3 ? '#e2c69d13' : '#080f1333';
      surface.fillRect(random() * W, random() * H, 1 + random() * 3, .5 + random() * .8);
    }
    return paper;
  }
  const grain = texture();

  function ticket(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(-.12);
    polygon('#21252688', [[-31,-8],[31,-8],[35,11],[-30,14]]);
    polygon('#f1dcae', [[-32,-11],[22,-11],[31,-3],[31,9],[-32,10]]);
    rect('#a64e47', -24,-11,8,21);
    rect('#a59572', 15,-7,1,14);
    label('ONE WAY', -1, 2, 6, '#493e35');
    ctx.restore();
  }

  function door(x, letter, open) {
    rect('#101d20', x-7, 345, 112, 410);
    rect('#0d181b', x, 353, 98, 402);
    polygon('#364b47', [[x,353],[x+97*(1-open),353+open*34],
      [x+97*(1-open),754-open*28],[x,754]]);
    if (open < .95) {
      rect('#142d30', x+12*(1-open), 387, 74*(1-open), 79);
      rect('#62877c', x+16*(1-open), 391, 66*(1-open), 70);
      rect('#73998b', x+18*(1-open), 393, 6*(1-open), 65);
      rect('#263434', x+12*(1-open), 486, 79*(1-open), 15);
      rect('#d1ad69', x+16*(1-open), 485, 72*(1-open), 8);
      rect('#b2a075', x+3, 735, 86*(1-open), 3);
    }
    rect('#65756b', x-7, 345, 5, 410);
    rect('#62736b', x-7, 345, 111, 5);
    rect('#121f21', x-2, 289, 103, 39);
    rect('#426956', x+2, 293, 95, 30);
    label(`EXIT ${letter}`, x+49, 314, 17, '#def0be');
  }

  function bench() {
    rect('#26302c', 215, 619, 10, 119);
    rect('#26302c', 310, 619, 10, 119);
    rect('#634936', 205, 606, 121, 34);
    rect('#9b6b4e', 205, 607, 121, 13);
    rect('#ae7e57', 206, 626, 120, 10);
    polygon('#be8a5d', [[208,652],[323,652],[335,681],[196,681]]);
    rect('#654939', 196, 681, 139, 13);
    rect('#c29667', 199, 679, 133, 3);
    rect('#8b603f', 203, 665, 124, 2);
    ticket(267, 668, .65);
  }

  function station(frame) {
    const wall = ctx.createLinearGradient(0, 120, 0, 760);
    wall.addColorStop(0, '#18272b');
    wall.addColorStop(.66, '#51645a');
    wall.addColorStop(1, '#344a46');
    rect(wall, 0, 0, W, H);
    polygon('#bec39312', [[199,226],[342,226],[469,748],[73,748]]);
    rect('#142327', 0, 65, W, 47);
    rect('#294043', 0, 112, W, 6);
    rect('#0e2024', 152, 68, 236, 39);
    rect('#77806a', 157, 72, 226, 2);
    label('END OF THE LINE', 270, 95, 19, '#bfb68e');
    rect('#182b2e', 0, 252, W, 12);
    rect('#5e7062', 0, 264, W, 3);
    for (let y = 354; y < 700; y += 54) {
      rect('#6d817627', 0, y, W, 1);
      for (let x = y % 108 ? -10 : 40; x < W; x += 75) rect('#233f394d', x, y, 1, 54);
    }
    rect('#1d3134', 175, 400, 187, 344);
    rect('#364849', 181, 408, 175, 336);
    for (let y = 421; y < 745; y += 14) {
      rect('#202f33', 181, y, 175, 3);
      rect('#63766e45', 181, y+3, 175, 1);
    }
    rect('#253937', 0, 744, W, 12);
    rect('#5c6255', 0, 756, W, 204);
    for (let y = 777; y < H; y += (y - 690) * .21) rect('#263d374d', 0, y, W, 2);
    for (let x = -70; x <= W + 70; x += 56) {
      polygon('#233c364e', [[x,756],[x+1,756],[270+(x-270)*2,960],[268+(x-270)*2,960]]);
    }
    polygon('#bd9b55', [[0,856],[W,845],[W,860],[0,874]]);
    polygon('#e2ba6b', [[0,856],[W,845],[W,848],[0,860]]);
    door(26, 'B', frame >= 126 ? .90 * (1-tween(frame, 135, 156)) : 0);
    door(410, 'A', 0);
    bench();
    ctx.drawImage(grain, 0, 0);
  }

  function pov(frame, hand, sleeve) {
    const reach = tween(frame, 78, 91);
    const press = tween(frame, 91, 96);
    const swing = tween(frame, 97, 119);
    const fade = tween(frame, 119, 126);
    const shift = 510 * swing;
    rect('#142327', 0, 0, W, H);
    ctx.save();
    ctx.translate(shift, 0);
    rect('#334947', -6, 36, W+22, H);
    rect('#1a2c30', 22, 59, W-44, 851);
    const paint = ctx.createLinearGradient(26, 59, 480, 850);
    paint.addColorStop(0, '#638074');
    paint.addColorStop(1, '#283e3f');
    rect(paint, 30, 65, W-60, 838);
    rect('#173034', 86, 179, 368, 250);
    rect('#597a73', 95, 190, 350, 229);
    polygon('#76958b', [[95,191],[282,191],[95,337]]);
    ctx.drawImage(grain, 0, 0);
    rect('#132b2c', 64, 510, 412, 59);
    rect('#3d3830', 78, 521, 384, 37);
    const barY = 520 + 10 * press;
    rect('#a4814d', 91, barY + 6, 358, 27);
    rect('#d2ad69', 91, barY, 358, 22);
    rect('#ebc686', 91, barY, 358, 4);
    ctx.restore();

    const release = tween(frame, 104, 118);
    const wristX = 265 + (1-reach) * 74 + shift * (1-release) + release * 94;
    const wristY = 589 + (1-reach) * 42 + press * 10 + release * 341;
    ctx.save();
    ctx.translate(wristX, wristY);
    ctx.rotate(-1.40 + (1-reach)*.40 + release*.6);
    ctx.scale(2, 2);
    ctx.save();
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(sleeve, -160, -448, 320, 896);
    ctx.restore();
    ctx.drawImage(hand, -160, -160, 320, 320);
    ctx.restore();
    rect(`rgba(11,19,21,${fade})`, 0, 0, W, H);
  }

  function loadPng(base64) {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    return image.decode().then(() => image);
  }

  let hand, sleeve;
  window.loadStationParts = async () => {
    const { parts } = window.makeAnatomyAssets(['hand-brace','forearm-near']);
    [hand, sleeve] = await Promise.all(Object.values(parts).map(loadPng));
  };

  window.renderStationFrame = async (frame, cutout, pelvisX) => {
    if (frame >= 78 && frame < 126) {
      pov(frame, hand, sleeve);
    } else if (frame >= 204 && frame < 240) {
      ctx.save();
      ctx.translate(270, 520);
      const push = 5 + tween(frame, 204, 240) * .35;
      ctx.scale(push, push);
      ctx.translate(-267, -668);
      station(frame);
      ctx.restore();
    } else {
      station(frame);
      ctx.fillStyle = '#162a2a50';
      ctx.beginPath();
      ctx.ellipse(pelvisX + 11, 755, 61, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(await loadPng(cutout), 0, 0, W, H);
    }
    const vignette = ctx.createRadialGradient(271, 470, 230, 271, 470, 540);
    vignette.addColorStop(0, '#08181e00');
    vignette.addColorStop(1, '#08181e64');
    rect(vignette, 0, 0, W, H);
    return canvas.toDataURL('image/jpeg', .95).split(',')[1];
  };
})();
