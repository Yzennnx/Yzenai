(() => {
  const ink = '#253a3b';
  const hair = '#644638';
  const hairLight = '#89624c';
  const shirt = '#e8e1cc';
  const tie = '#813b43';
  const shoe = '#60453d';
  const palette = {
    near: { fabric: shirt, shade: '#bab49f', pants: '#465366', legShade: '#374456', skin: '#e7ae87' },
    far: { fabric: '#c8c1ac', shade: '#a29b86', pants: '#374456', legShade: '#2e3847', skin: '#be876d' },
  };

  function path(ctx, steps, fill, stroke = ink, width = 2) {
    ctx.beginPath();
    for (const [command, ...points] of steps) ctx[command](...points);
    if (fill) {
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
  }

  function oval(ctx, x, y, rx, ry, fill, stroke) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  const M = (x,y) => ['moveTo',x,y];
  const L = (x,y) => ['lineTo',x,y];
  const Q = (a,b,x,y) => ['quadraticCurveTo',a,b,x,y];
  const C = (a,b,c,d,x,y) => ['bezierCurveTo',a,b,c,d,x,y];

  function segment(ctx, length, top, bottom, fill, shade) {
    path(ctx, [M(-top+4,-9), Q(0,-top-3,top-4,-8),
      C(top+3,length*.15,bottom+2,length*.72,bottom,length-4),
      Q(bottom+1,length+8,0,length+bottom*.58), Q(-bottom-2,length+9,-bottom-1,length-4),
      C(-bottom-3,length*.65,-top-3,length*.24,-top+4,-9)], fill);
    path(ctx, [M(-top+2,5), Q(-top+3,length*.47,-bottom+3,length-5)],
      null, shade, 3);
  }

  function drawPart(ctx, name) {
    const [part, variant, handSide] = name.split('-');
    const side = handSide ?? variant;
    const tones = palette[side] ?? palette.near;
    if (part === 'thigh') segment(ctx,105,23,16,tones.pants,tones.legShade);
    if (part === 'shin') segment(ctx,101,16,11,tones.pants,tones.legShade);
    if (part === 'arm') segment(ctx,83,16,11,tones.fabric,tones.shade);
    if (part === 'forearm') segment(ctx,72,12,8,tones.fabric,tones.shade);
    if (part === 'shoulder') oval(ctx,0,1,18,20,tones.fabric,ink);
    if (part === 'foot') {
      path(ctx,[M(-14,-17),Q(0,-22,13,-14),L(17,-5),Q(24,0,36,1),
        Q(44,3,43,10),Q(39,15,30,18),L(-18,18),Q(-23,14,-22,7),L(-19,-11)],
      side === 'near' ? shoe : '#493937');
      path(ctx,[M(-21,11),Q(-11,13,5,12),L(36,12),Q(38,13,30,18),L(-18,18),Q(-21,15,-21,11)],
        '#ead8b5',ink,1.3);
      path(ctx,[M(9,-4),L(22,-1),M(11,0),L(25,3)],null,'#f2c98e',1.6);
    }
    if (part === 'hand' && side === 'brace') {
      path(ctx,[M(-7,-6),Q(3,-10,13,-6),L(19,-3),L(36,0),Q(41,2,37,5),
        L(33,7),L(11,7),Q(3,7,-7,5)],tones.skin);
      path(ctx,[M(19,2),L(33,3),M(10,-2),L(19,1)],null,'#946450',1.2);
    } else if (part === 'hand' && variant === 'run') {
      path(ctx,[M(-5,-5),L(4,-6),Q(8,-10,14,-7),L(19,-4),Q(23,0,19,6),
        Q(14,10,8,7),L(-5,5)],tones.skin);
      path(ctx,[M(9,-2),Q(13,0,17,-3)],null,'#946450',1.3);
    } else if (part === 'hand' && side === 'grip') {
      path(ctx,[M(-7,-7),L(6,-10),Q(13,-16,19,-11),L(25,-5),Q(29,2,25,8),
        Q(20,14,12,10),L(6,6),L(-7,6)],tones.skin);
      path(ctx,[M(10,-3),Q(16,0,20,-5),M(16,5),L(23,5)],null,'#946450',1.4);
    } else if (part === 'hand') {
      path(ctx,[M(-7,-7),Q(1,-9,9,-6),L(15,-3),Q(24,0,23,6),
        Q(22,12,16,12),L(6,8),Q(-1,6,-7,6)],tones.skin);
      path(ctx,[M(11,0),Q(14,7,20,7)],null,'#946450',1.4);
    }
    if (part === 'pelvis') {
      path(ctx,[M(-28,-26),Q(0,-34,27,-24),L(31,9),Q(25,23,6,24),
        Q(-22,24,-29,11)],palette.near.pants);
      path(ctx,[M(-24,-18),Q(0,-13,26,-19)],null,'#344f61',2.5);
      path(ctx,[M(16,-13),Q(12,-2,12,8)],null,'#344f61',1.8);
    }
    if (part === 'chest') {
      path(ctx,[M(-11,-132),Q(10,-138,24,-125),Q(32,-116,33,-93),
        C(35,-70,26,-53,21,-29),Q(18,-16,24,10),Q(4,19,-25,13),
        Q(-32,-13,-32,-43),Q(-36,-66,-35,-91),Q(-36,-119,-11,-132)],shirt);
      path(ctx,[M(-33,-97),Q(-27,-101,-22,-85),Q(-19,-63,-23,-41),Q(-26,-8,-19,12),
        Q(-27,12,-29,8),L(-33,-38),Q(-36,-76,-33,-97)],'#c8c1ac',null);
      path(ctx,[M(21,-115),L(26,-117),L(28,-85),L(24,-55),L(19,-67),L(23,-93)],tie,ink,1.3);
      path(ctx,[M(-8,-131),Q(8,-126,19,-134),L(28,-122),L(23,-113),L(15,-122),L(6,-113)],'#f6efdf',ink,1.4);
      path(ctx,[M(23,-52),Q(19,-23,21,5)],null,'#a49c86',1.6);
    }
    if (part === 'neck') {
      path(ctx,[M(-11,8),Q(-7,-5,-10,-27),L(13,-29),Q(13,-10,18,5),
        Q(7,15,-11,8)],'#cf956f');
    }
    if (part === 'head') {
      path(ctx,[M(-25,-15),Q(-39,-30,-35,-52),Q(-29,-75,-6,-81),
        Q(14,-83,27,-68),Q(35,-58,35,-46),L(41,-36),Q(44,-31,37,-29),
        L(36,-17),Q(33,-9,24,-5),L(14,0),Q(9,2,3,0),L(-12,-6)],'#e7ae87');
      path(ctx,[M(-32,-15),L(-37,-25),L(-36,-43),L(-41,-39),Q(-41,-68,-21,-78),
        Q(3,-94,25,-77),Q(38,-69,40,-52),L(33,-54),L(31,-47),L(26,-57),
        L(17,-49),L(17,-56),Q(8,-48,-1,-45),L(-6,-33),Q(-14,-46,-20,-32),L(-18,-13)],hair);
      path(ctx,[M(-31,-61),Q(-10,-84,12,-75),Q(25,-71,33,-61),Q(16,-70,4,-64),
        L(-13,-56),L(-8,-64),Q(-20,-61,-30,-51)],hairLight,null);
      oval(ctx,-15,-31,6,8,'#dda07d',ink);
      if (side === 'notice') {
        path(ctx,[M(15,-50),Q(23,-56,32,-50),M(26,-14),Q(33,-18,36,-14)],null,ink,2);
        oval(ctx,25,-40,7.5,6.5,'#fff1dd');
        oval(ctx,29,-41,2.5,3.4,ink);
      } else if (side === 'alarm') {
        path(ctx,[M(15,-55),Q(23,-61,32,-54)],null,ink,2.4);
        oval(ctx,25,-41,8,8.5,'#fff1dd');
        oval(ctx,28.5,-40,2.8,4,ink);
        oval(ctx,32,-13,5.2,6.6,'#70463b',ink);
      } else if (side === 'strain') {
        oval(ctx,16,-27,9,5.8,'#ce806a');
        path(ctx,[M(15,-51),L(31,-46),M(16,-39),Q(24,-35,31,-42)],null,ink,2.7);
        path(ctx,[M(24,-15),Q(29,-20,36,-17),L(36,-12),Q(30,-10,24,-15)],'#fff1dd',ink,1.5);
      } else if (side === 'relief') {
        path(ctx,[M(16,-47),Q(23,-50,32,-46),M(16,-40),Q(23,-34,31,-40),
          M(25,-16),Q(29,-10,36,-15)],null,ink,2);
      } else {
        path(ctx,[M(16,-46),Q(24,-51,33,-47),M(26,-14),Q(31,-15,36,-15)],null,ink,1.9);
        path(ctx,[M(18,-38),Q(25,-44,33,-39),Q(27,-33,18,-38)],'#fff1dd',ink,1);
        oval(ctx,27.6,-39,2.25,2.9,'#543e39');
      }
      path(ctx,[M(6,-22),Q(13,-24,17,-22)],null,'#d29376',2);
    }
  }

  // Turnaround drawings share the rig palette and the same head, shoulder, hip and floor heights.
  window.drawAnatomyTurnaround = (ctx, x, floor, scale, view, pose) => {
    ctx.save();
    ctx.translate(x, floor);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const quarter = view.includes('quarter');
    const rear = view.startsWith('rear');
    const shift = quarter ? (rear ? -16 : 13) : 0;
    const neckX = quarter ? Math.sign(shift) * 5 : 0;
    const shoulder = quarter ? 40 : 50;
    const leftShoulder = -shoulder + (quarter ? (rear ? 8 : -9) : 0);
    const rightShoulder = shoulder + (quarter ? (rear ? 8 : -6) : 0);
    const hip = quarter ? 30 : 36;
    const waist = hip - 2;
    const crown = -480;
    const shoulderY = -360;
    const hipY = -226;
    const [bodyX, bodyY] = pose?.body ?? [0, 0];

    for (const side of pose?.hideLimbs ? [] : [1, -1]) {
      const [ankleX, ankleY, kneeY, toeDepth, wristX, wristY] = pose?.limbs[side] ?? [0, 0, 0, 0, 0, 0];
      const far = quarter && side === (rear ? -1 : 1);
      const tones = far ? palette.far : palette.near;
      const leg = bodyX + shift / 2 + side * hip * .58;
      const ankle = shift / 2 + side * (hip * .58 + 4) + ankleX;
      const knee = (leg + ankle) / 2;
      path(ctx, [M(leg - 19, hipY + bodyY), L(leg + 19, hipY + bodyY),
        Q(leg + 16, -142 + bodyY, knee + 12, -96 + kneeY),
        L(ankle + 9, -25 + ankleY), L(ankle - 11, -25 + ankleY),
        L(knee - 15, -99 + kneeY), Q(leg - 21, -174 + bodyY, leg - 19, hipY + bodyY)],
      tones.pants);
      path(ctx, [M(leg + 6, -183 + bodyY), Q(knee + 7, -112 + kneeY, ankle + 4, -39 + ankleY)],
        null, tones.legShade, 2);
      const toe = ankle + (quarter ? (rear ? -11 : 12) : 0);
      ctx.save();
      ctx.translate(0, ankleY);
      path(ctx, [M(ankle - 11,-28), L(ankle + 11,-28), Q(ankle + 11,-20,toe + 14,-14 + toeDepth),
        Q(toe + 17,-7 + toeDepth,toe + 13,-2 + toeDepth),
        Q(toe,-1 + toeDepth,toe - 14,-2 + toeDepth), Q(toe - 17,-7 + toeDepth,ankle - 12,-18)],
        far ? '#493937' : shoe);
      path(ctx, [M(toe - 13,-5 + toeDepth), Q(toe,-3 + toeDepth,toe + 13,-5 + toeDepth)], null, '#ead8b5', 2);
      if (ankleY > 0) {
        path(ctx, [M(toe-10,-7+toeDepth), Q(toe,-4+toeDepth,toe+10,-7+toeDepth),
          L(toe+6,-4), Q(toe,-4,toe-6,-4)], '#ead8b5', ink, 1.1);
      }
      ctx.restore();

      const top = side === 1 ? rightShoulder : leftShoulder;
      const elbow = top + side * 6 + wristX / 2;
      const wrist = top + side * 2 + wristX;
      ctx.save();
      ctx.translate(bodyX, bodyY);
      path(ctx, [M(top - 14,shoulderY), Q(top,-370,top + 14,shoulderY),
        L(elbow + 11,-282 + wristY / 3), L(wrist + 8,-210 + wristY), L(wrist - 8,-210 + wristY),
        L(elbow - 11,-282 + wristY / 3), L(top - 14,shoulderY)], tones.fabric);
      path(ctx, [M(elbow - 4,-301), L(wrist - 3,-218 + wristY),
        M(wrist - 8,-220 + wristY), L(wrist + 8,-220 + wristY)],
      null, tones.shade, 2);
      ctx.translate(0, wristY);
      path(ctx, [M(wrist - 7,-210), L(wrist + 7,-210), Q(wrist + 12,-196,wrist + 5,-188),
        Q(wrist,-184,wrist - 4,-190), L(wrist - 8,-199)], tones.skin);
      ctx.restore();
    }

    ctx.translate(bodyX, bodyY);
    path(ctx, [M(-waist, -255), L(waist, -255), L(hip, hipY), Q(19,-211,4,-209),
      L(-4,-209), Q(-19,-211,-hip,hipY)], palette.near.pants);
    path(ctx, [M(neckX-10,-413), L(neckX+10,-413), Q(neckX+9,-388,neckX+12,-376),
      Q(neckX,-369,neckX-12,-376), Q(neckX-9,-388,neckX-10,-413)], '#cf956f');
    path(ctx, [M(neckX-12,-382), Q(leftShoulder+15,-380,leftShoulder,-362),
      Q(leftShoulder+4,-330,-waist,-300), L(-waist,-255), Q(0,-247,waist,-255), L(waist,-301),
      Q(rightShoulder-6,-335,rightShoulder,-362),
      Q(42,-378,neckX+12,-382), Q(neckX,-371,neckX-12,-382)], shirt);
    path(ctx, [M(leftShoulder,-360), Q(leftShoulder+16,-332,-waist+6,-287), L(-waist+6,-256), L(-waist,-255),
      L(-waist,-294), Q(leftShoulder+4,-332,leftShoulder,-360)], '#c8c1ac', null);
    if (rear) {
      path(ctx, [M(leftShoulder + 7,-355), Q(neckX,-341,rightShoulder - 7,-358),
        M(neckX,-348), Q(neckX+4,-329,neckX+2,-315)],
        null, '#a49c86', 1.8);
      path(ctx, [M(neckX-13,-382), Q(neckX,-372,neckX+13,-382), L(neckX+15,-374),
        Q(neckX,-365,neckX-15,-375)], '#f6efdf', ink, 1.4);
    } else {
      path(ctx, [M(neckX-4,-366), L(neckX+5,-366), L(neckX+7,-283), L(neckX+1,-272),
        L(neckX-6,-282)], tie, ink, 1.4);
      path(ctx, [M(neckX-12,-382), L(neckX,-368), L(neckX+13,-382), L(neckX+20,-374),
        L(neckX+9,-358), L(neckX,-367), L(neckX-9,-358), L(neckX-19,-375)], '#f6efdf', ink, 1.4);
      path(ctx, [M(neckX-6,-367), L(neckX+6,-367), L(neckX+3,-357), L(neckX-3,-357)], tie, ink, 1.4);
    }

    const left = quarter ? -35 : -34;
    const right = quarter ? 36 : 34;
    oval(ctx,left-2,-431,6,9,'#dda07d',ink);
    if (!quarter) oval(ctx,right+2,-431,6,9,'#dda07d',ink);
    if (rear) {
      path(ctx, [M(left,-450), Q(left,-476,0,crown), Q(right,-476,right,-450),
        Q(right,-431,right-7,-420), Q(right-15,-409,neckX+10,-408),
        Q(neckX,-401,neckX-10,-407), Q(left+4,-411,left,-429)], palette.near.skin);
    } else if (quarter) {
      path(ctx, [M(left,-451), Q(left,-477,0,crown), Q(26,-480,35,-456), Q(39,-445,37,-434),
        L(41,-426), Q(42,-423,37,-421), Q(35,-414,28,-407), Q(22,-401,15,-399),
        Q(9,-397,2,-401), L(-16,-409), Q(-31,-417,-33,-432)], palette.near.skin);
    } else {
      path(ctx, [M(left,-450), Q(left,-476,0,crown), Q(right,-476,right,-450),
        L(29,-425), Q(27,-417,15,-407), L(5,-400), Q(0,-397,-5,-400),
        L(-16,-407), Q(-28,-416,left+2,-429)], palette.near.skin);
    }

    if (rear) {
      path(ctx, [M(left-2,-435), L(left-5,-446), Q(left-6,-475,-17,-480), Q(10,-492,29,-472),
        Q(right+5,-466,right+4,-441), Q(right-1,-428,right-7,-423), L(quarter ? 18 : 22,-416),
        L(10,-417), L(neckX+4,-410), L(-13,-417), L(-22,-416), Q(left+4,-423,left-2,-435)], hair);
      path(ctx, [M(left+4,-453), Q(-15,-477,6,-477), Q(22,-475,30,-464),
        Q(9,-472,-1,-461), L(-16,-447), L(-10,-460)], hairLight,null);
    } else {
      path(ctx, [M(left+4,-427), L(left-3,-439), L(left-5,-451), Q(left-4,-476,-17,-480),
        Q(10,-492,29,-472), Q(right+4,-465,right+4,-445), L(right-3,-451), L(right-6,-445),
        L(right-11,-458), L(shift+9,-448), L(shift+9,-458), L(shift-5,-447), L(shift-3,-456),
        L(shift-17,-440), L(shift-14,-455), Q(left+9,-450,left+4,-427)], hair);
      path(ctx, [M(left+4,-453), Q(-15,-477,6,-477), Q(22,-475,30,-464),
        Q(9,-474,-1,-461), L(-16,-448), L(-10,-460)], hairLight,null);
      const expression = pose?.expression ?? 'head';
      const alarm = expression === 'head-alarm';
      const notice = expression === 'head-notice';
      const strain = expression === 'head-strain';
      const relief = expression === 'head-relief';
      for (const side of [-1, 1]) {
        const eye = shift + side * (quarter && side === 1 ? 10 : 15);
        const width = quarter && side === 1 ? 5 : 8;
        if (strain) {
          oval(ctx,eye + side * 4,-423,8,4.8,'#d68170');
          path(ctx,[M(eye-8,-446-side*3),L(eye+8,-446+side*3),
            M(eye-7,-435),Q(eye,-431,eye+7,-435)],null,ink,2.4);
        } else if (relief) {
          path(ctx,[M(eye-8,-442),Q(eye,-445,eye+8,-442),
            M(eye-7,-434),Q(eye,-430,eye+7,-434)],null,ink,2);
        } else {
          const brow = alarm ? -448 : notice ? -445 - (side === -1 ? 2 : 0) : -442;
          path(ctx,[M(eye-width,brow),Q(eye,brow-2,eye+width,brow+1)],null,ink,1.8);
          if (alarm) oval(ctx,eye,-435,7.2,6.1,'#fff1dd',ink);
          else path(ctx,[M(eye-width,-435),Q(eye,notice ? -443 : -440,eye+width,-435),
            Q(eye,-430,eye-width,-435)],'#fff1dd',ink,1.1);
          oval(ctx,eye+(notice ? 2.5 : 1),-435,alarm ? 2 : 2.6,3.3,'#543e39');
        }
      }
      const noseX = quarter ? 26 : 0;
      path(ctx,[M(noseX+1,-433),L(noseX+4,-422),L(noseX-1,-420)],null,ink,1.7);
      if (alarm) oval(ctx,noseX,-412,5.8,6.2,'#70463b',ink);
      else if (strain) path(ctx,[M(noseX-8,-413),Q(noseX,-417,noseX+7,-412),
        L(noseX+5,-408),L(noseX-6,-408)],'#fff1dd',ink,1.5);
      else path(ctx,[M(noseX-7,-412),Q(noseX,relief ? -407 : notice ? -415 : -413,noseX+6,-412)],null,ink,1.7);
    }
    ctx.restore();
  };

  window.drawAnatomySidePose = (ctx, pose) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [part, x, y, angle] of pose) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle * Math.PI / 180);
      drawPart(ctx, part);
      ctx.restore();
    }
  };

  window.anatomyGaitSway = (action, frame) => {
    const run = action === 'run';
    return (run ? 6 : 10) * Math.cos((frame / (run ? 18 : 28) - .19) * 2 * Math.PI);
  };

  window.drawAnatomyDepthPose = (ctx, layers, view, action, center, floor, sway) => {
    const points = Object.fromEntries(layers.map(([part, ...position]) => [part, position]));
    const rear = view === 'rear';
    const direction = rear ? -1 : 1;
    const reach = action === 'brace';
    const run = action === 'run';
    const bodyDepth = points.pelvis[0];
    const project = (depth, y, width) => {
      const perspective = 1 + direction * (depth - 270) * .00165;
      return [center + width * direction * perspective, floor + (y - floor) * perspective
        + (depth - 270) * direction * .080];
    };
    const [bodyX, bodyY] = project(bodyDepth, points.pelvis[1], sway);
    function layer(part, width) {
      return project(...points[part].slice(0, 2), width);
    }
    const torsoScale = (bodyY - layer('neck', sway)[1]) / 150;
    if (action === 'sit') {
      const [x, y] = project(222, floor - 100, 0);
      const [, ground] = project(222, floor, 0);
      ctx.fillStyle = '#a88269';
      ctx.fillRect(x - 64, y + 10, 13, ground - y - 10);
      ctx.fillRect(x + 51, y + 10, 13, ground - y - 10);
      ctx.fillStyle = '#b17a5e';
      ctx.fillRect(x - 70, y, 140, 12);
    }
    if (reach) {
      const [x, y] = project(375, floor - 202, 82.5);
      const [, ground] = project(375, floor, 0);
      const edge = x + 90 * direction;
      ctx.fillStyle = '#a88269';
      ctx.fillRect(edge - 7, y + 10, 14, ground - y - 10);
      ctx.fillStyle = '#b17a5e';
      ctx.fillRect(Math.min(x, edge) - 7, y, 104, 14);
    }
    function segmentBetween(a, b, top, bottom, color, shade) {
      ctx.save();
      ctx.translate(...a);
      ctx.rotate(Math.atan2(b[1]-a[1], b[0]-a[0]) - Math.PI / 2);
      segment(ctx, Math.max(4, Math.hypot(b[0]-a[0], b[1]-a[1])), top, bottom, color, shade);
      ctx.restore();
    }
    function leg(side, width) {
      const ankle = points[`foot-${side}`];
      const depth = direction * (ankle[0] - bodyDepth);
      const hip = layer(`thigh-${side}`, width * .82 + sway);
      const knee = layer(`shin-${side}`, width * 1.12 + sway * .33);
      const foot = layer(`foot-${side}`, width * 1.16);
      const colors = palette[side];
      segmentBetween(hip, knee, 20, 15, colors.pants, colors.legShade);
      segmentBetween(knee, [foot[0], foot[1] - 2], 15, 10, colors.pants, colors.legShade);
      ctx.save();
      ctx.translate(...foot);
      ctx.scale(1 + depth * .0012, 1);
      const lift = Math.abs(ankle[2]) * .34;
      const toe = rear ? 10 : 17;
      path(ctx, [M(-10,-8), Q(0,-13,10,-8), L(toe,-lift+9), Q(toe+2,17,-2,17),
        Q(-toe,17,-toe,-lift+9)], side === 'near' ? shoe : '#493937');
      path(ctx, [M(-toe+2,13), Q(0,16,toe-1,12)], null, '#ead8b5', 2);
      ctx.restore();
    }
    function arm(side, width) {
      const shoulder = layer(`arm-${side}`, width + sway);
      const shoulderLine = bodyY - 134 * torsoScale;
      const upper = run ? [
        bodyX + width * .90 * direction,
        shoulderLine + 5 + Math.max(-3, Math.min(3, (shoulder[1] - shoulderLine) * .25)),
      ] : shoulder;
      const elbowWidth = run ? 1.01 : action === 'sit' ? 1.03 : reach ? 1.19 : 1.12;
      const elbow = layer(`forearm-${side}`, width * elbowWidth + sway * .65);
      const bracing = side === 'near' && points['hand-brace'];
      const handPart = bracing ? 'hand-brace' : run ? `hand-run-${side}` : `hand-${side}`;
      const extension = reach && side === 'near' ? (points[handPart][0] - 235) * .34 : 0;
      const onLap = action === 'sit' ? Math.min(1, Math.max(0, (points[handPart][1] - 560) / 68)) : 0;
      const wrist = layer(handPart, width * (.9 - .40 * onLap) + Math.max(0, extension) + sway * .55);
      const colors = palette[side];
      segmentBetween(upper, elbow, run ? 12 : 14, 11, colors.fabric, colors.shade);
      segmentBetween(elbow, wrist, 11, 8, colors.fabric, colors.shade);
      if (bracing) {
        ctx.save();
        ctx.translate(...wrist);
        ctx.scale(direction, 1);
        path(ctx, [M(-8,-4), Q(8,-9,19,-3), L(18,5), L(-7,5)], colors.skin);
        ctx.restore();
      } else if (run) {
        ctx.save();
        ctx.translate(...wrist);
        ctx.rotate(Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]));
        ctx.scale(.72, 1);
        drawPart(ctx, handPart);
        ctx.restore();
      } else {
        oval(ctx,wrist[0],wrist[1]+5,8 + 3 * onLap,11 - 6 * onLap,colors.skin,ink);
      }
    }
    const limbs = [['far', -25], ['near', 25]].sort(([a], [b]) =>
      direction * (points[`foot-${a}`][0] - points[`foot-${b}`][0]));
    for (const [side, width] of limbs) leg(side, width);
    if (rear) for (const [side, width] of limbs) arm(side, width * 1.95);
    ctx.save();
    ctx.translate(bodyX, bodyY);
    ctx.scale(1, torsoScale);
    const expression = layers.find(([part]) => part === 'head' || part.startsWith('head-'))?.[0];
    window.drawAnatomyTurnaround(ctx, 0, 226, 1, view, { hideLimbs: true, expression });
    ctx.restore();
    if (!rear) for (const [side, width] of limbs) arm(side, width * 1.95);
  };

  function stage(ctx, { id, floor, seat, table }) {
    const color = ctx.createLinearGradient(0,0,540,960);
    color.addColorStop(0,'#f9efd9');
    color.addColorStop(1,'#e9d8b7');
    ctx.fillStyle = color;
    ctx.fillRect(0,0,540,960);
    ctx.fillStyle = '#decda9';
    ctx.fillRect(0,floor,540,960-floor);
    path(ctx,[M(24,floor),L(516,floor)],null,'#95896f',1);
    ctx.globalAlpha = .34;
    oval(ctx,id === 'step' ? 262 : 265,floor+7,id === 'step' ? 151 : 155,9,'#b09b77');
    ctx.globalAlpha = 1;
    if (id === 'sit') {
      path(ctx,[M(145,seat+13),L(164,seat+13),L(160,floor),L(140,floor)],'#b88768');
      path(ctx,[M(244,seat+13),L(260,seat+13),L(265,floor),L(250,floor)],'#b88768');
      path(ctx,[M(134,seat),L(268,seat),Q(275,seat+2,274,seat+13),
        L(134,seat+16),Q(127,seat+10,134,seat)],'#ad7056');
      path(ctx,[M(139,seat+3),L(262,seat+3)],null,'#d8aa83',2);
    }
    if (id === 'brace') {
      path(ctx,[M(397,table+16),L(413,table+16),L(409,floor),L(391,floor)],'#a88269');
      path(ctx,[M(477,table+16),L(496,table+16),L(500,floor),L(483,floor)],'#a88269');
      path(ctx,[M(366,table),L(510,table),L(510,table+17),L(367,table+17),
        Q(361,table+9,366,table)],'#b17a5e');
      path(ctx,[M(369,table+4),L(508,table+4)],null,'#dcaf8d',2);
    }
    const label = { sit:'Sit down', brace:'Catch the lean', step:'Take a step' }[id];
    if (label) {
      ctx.fillStyle = '#263f40';
      ctx.font = 'bold 34px Arial';
      ctx.fillText(label,46,120);
    }
  }

  window.makeAnatomyAssets = (names, layout = { ids: [] }) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const parts = {};
    for (const name of names) {
      canvas.width = 640;
      canvas.height = 640;
      ctx.setTransform(2,0,0,2,320,320);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      drawPart(ctx,name);
      parts[name] = canvas.toDataURL().split(',')[1];
    }
    const backgrounds = {};
    for (const id of layout.ids) {
      canvas.width = 1080;
      canvas.height = 1920;
      ctx.scale(2,2);
      stage(ctx,{ ...layout, id });
      backgrounds[id] = canvas.toDataURL().split(',')[1];
    }
    return { parts, backgrounds };
  };
})();
