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
    if (part === 'shoulder') {
      // Rounded deltoid cap with top arc stroke only (avoids harsh robot ball-joint circle seam!)
      oval(ctx, 0, 1, 17, 19, tones.fabric, null);
      path(ctx, [M(-16, 4), Q(-17, -18, 0, -18), Q(17, -18, 16, 4)], null, ink, 2);
    }
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
    } else if (part === 'hand' && side === 'pipe') {
      // Gripping hand holding a rugged survival steel pipe / crowbar locked directly to wrist track!
      // Pipe shaft extending cleanly upward-outward from the fist (-128..+24 in local Y)
      path(ctx,[M(11,-124),L(21,-124),L(20,24),L(12,24)],'#6d7b85',ink,2);
      // Metallic highlight streak & flared pipe coupling near tip
      path(ctx,[M(14,-118),L(14,-16)],null,'#b5c4ce',2.2);
      path(ctx,[M(9,-112),L(23,-112),L(23,-102),L(9,-102)],'#56636d',ink,1.8);
      // Cloth grip wrap at handle
      path(ctx,[M(11,-12),L(21,-12),L(21,18),L(11,18)],'#3c3936',ink,1.6);
      // Hand palm + wrapped fingers overlapping the pipe handle
      path(ctx,[M(-7,-7),L(6,-10),Q(13,-15,19,-11),L(25,-5),Q(29,2,25,8),
        Q(20,14,12,10),L(6,6),L(-7,6)],tones.skin);
      path(ctx,[M(10,-4),L(23,-4),M(11,1),L(24,1),M(12,6),L(23,6)],null,'#946450',1.4);
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
      path(ctx,[M(-12,-130),Q(10,-136,24,-124),Q(31,-114,32,-92),
        C(33,-68,27,-48,23,-26),Q(20,-12,23,11),Q(4,19,-24,13),
        Q(-30,-14,-30,-44),Q(-32,-68,-32,-92),Q(-32,-118,-12,-130)],shirt);
      path(ctx,[M(-30,-96),Q(-25,-100,-20,-84),Q(-18,-62,-22,-40),Q(-24,-8,-18,12),
        Q(-25,12,-27,8),L(-30,-38),Q(-32,-76,-30,-96)],'#c8c1ac',null);
      path(ctx,[M(21,-115),L(26,-117),L(28,-85),L(24,-55),L(19,-67),L(23,-93)],tie,ink,1.3);
      path(ctx,[M(-8,-130),Q(8,-125,19,-133),L(28,-121),L(23,-112),L(15,-121),L(6,-112)],'#f6efdf',ink,1.4);
      path(ctx,[M(23,-52),Q(20,-23,21,5)],null,'#a49c86',1.6);
    }
    if (part === 'neck') {
      path(ctx,[M(-13,8),Q(-9,-4,-11,-26),L(14,-27),Q(14,-9,19,5),
        Q(7,15,-13,8)],'#cf956f');
      // Subtle under-jaw cast shadow & sternocleidomastoid line
      path(ctx,[M(-11,-25),Q(2,-14,14,-19),L(14,-27),L(-11,-26)],'rgba(115,64,46,0.28)',null);
      path(ctx,[M(-2,-14),Q(2,-3,8,4)],null,'rgba(128,74,54,0.38)',1.3);
    }
    if (part === 'head') {
      const expr = variant ?? 'neutral';
      const pale = expr === 'dread' || expr === 'exhausted';
      const skinTone = pale ? '#dfae90' : '#e7ae87';
      const shadeTone = pale ? '#c69377' : '#d69975';
      const deepShadow = 'rgba(72,38,34,0.22)';

      // Sculpted profile head silhouette (cranium, brow ridge, distinct nasal bridge, lips, defined chin & jaw!)
      path(ctx,[
        M(-25,-15), Q(-39,-30,-35,-53), Q(-29,-76,-5,-82),
        Q(15,-84,28,-68), Q(35,-58,34,-48), // brow ridge
        L(33,-43), L(42,-32), Q(44,-28,37,-26), // crisp sculpted nose
        L(36,-22), L(38,-18), L(35,-14), // upper/lower lip profile hint
        Q(35,-6,25,-3), L(14,1), Q(8,3,2,0), L(-12,-6)
      ], skinTone);

      // Subtle cheekbone/jaw plane shading & under-nose cast shadow (gives 3D portrait volume!)
      path(ctx,[M(-14,-6),Q(4,-3,24,-5),Q(31,-9,33,-16),Q(20,-10,2,-11),Q(-10,-12,-14,-6)], shadeTone, null);
      path(ctx,[M(32,-26),L(40,-27),L(36,-23),L(32,-24)], 'rgba(130,74,52,0.32)', null);
      // Hair fringe cast shadow on upper forehead
      path(ctx,[M(4,-56),Q(20,-54,34,-49),L(34,-54),Q(18,-60,2,-60)], 'rgba(92,54,40,0.20)', null);

      // Dread upper-face shadow wash (classic horror dread lighting!)
      if (expr === 'dread') {
        path(ctx,[M(-28,-54),Q(10,-62,35,-49),L(34,-34),Q(12,-32,-24,-36)], 'rgba(26,34,48,0.22)', null);
      }

      // Sculpted chestnut hair & multi-tone highlight
      path(ctx,[M(-32,-15),L(-37,-25),L(-36,-43),L(-41,-39),Q(-41,-68,-21,-78),
        Q(3,-94,25,-77),Q(38,-69,40,-52),L(33,-54),L(31,-47),L(26,-57),
        L(17,-49),L(17,-56),Q(8,-48,-1,-45),L(-6,-33),Q(-14,-46,-20,-32),L(-18,-13)],hair);
      path(ctx,[M(-31,-61),Q(-10,-84,12,-75),Q(25,-71,33,-61),Q(16,-70,4,-64),
        L(-13,-56),L(-8,-64),Q(-20,-61,-30,-51)],hairLight,null);

      // Detailed ear (outer helix + inner cartilage fold)
      oval(ctx,-15,-31,6.5,8.8,'#dda07d',ink);
      path(ctx,[M(-17,-35),Q(-12,-33,-14,-27),M(-16,-31),L(-14,-29)],null,'#a46b51',1.3);

      // Sweat bead helper for dread / panic / exhausted / strain
      const drawSweat = (sx, sy, s = 1) => {
        path(ctx,[M(sx,sy-6*s),Q(sx+4*s,sy+1*s,sx,sy+5*s),Q(sx-4*s,sy+1*s,sx,sy-6*s)],'#d6f0ff','#4e7a91',1.1);
        oval(ctx,sx-1*s,sy-0.5*s,1*s,1.4*s,'#ffffff');
      };

      // Realistic profile eye helper (eyelid crease, thick lash, iris, dark pupil, white specular catchlight!)
      const drawProfileEye = (ey, openH, pupilX, pupilR, lidDroop = 0, underBag = false) => {
        if (underBag) {
          path(ctx,[M(17,ey+openH+2.5),Q(25,ey+openH+5.5,33,ey+openH+2)],null,'rgba(92,58,64,0.36)',1.8);
        }
        // Sclera
        path(ctx,[M(17,ey),Q(25,ey-openH,33,ey),Q(26,ey+openH*0.85,17,ey)],'#fff5e8',ink,1.1);
        // Iris + dark pupil + specular catchlight
        const ir = Math.min(openH * 0.72, pupilR * 1.45);
        oval(ctx, pupilX, ey + lidDroop * 0.35, ir * 0.82, ir, '#5d3e33');
        oval(ctx, pupilX + 0.5, ey + lidDroop * 0.35, pupilR * 0.62, pupilR * 0.82, '#161b1e');
        oval(ctx, pupilX - 0.8, ey + lidDroop * 0.35 - ir * 0.35, 1.15, 1.15, '#ffffff');
        // Optional heavy upper eyelid droop (exhausted / determined / sneak)
        if (lidDroop > 0) {
          path(ctx,[M(16,ey-openH-1),L(34,ey-openH-1),L(33,ey-openH+lidDroop),Q(25,ey-openH+lidDroop+1.5,17,ey-openH+lidDroop)], skinTone, null);
        }
        // Crisp tapered upper eyelash + eyelid crease above
        const topY = ey - openH + lidDroop;
        path(ctx,[M(16.5,ey+0.5),Q(25,topY-0.5,33.5,ey-0.5)],null,ink,2.3);
        path(ctx,[M(19,topY-2.8),Q(26,topY-4.8,32,topY-2.5)],null,'#9c644c',1.1);
      };

      // Subtle cheekbone contour & under-lip shadow
      path(ctx,[M(6,-23),Q(13,-25,18,-22)],null,'#c68567',1.4);
      path(ctx,[M(28,-10),Q(32,-9,35,-10)],null,'rgba(128,70,52,0.35)',1.2);

      if (expr === 'notice') {
        path(ctx,[M(14,-51),Q(23,-57,33,-51)],null,ink,2.2);
        drawProfileEye(-40, 5.8, 29.2, 2.3, 0.5, false);
        path(ctx,[M(25,-15),Q(31,-17,36,-15)],null,ink,2);
      } else if (expr === 'alarm') {
        path(ctx,[M(14,-56),Q(23,-63,33,-55)],null,ink,2.5);
        drawProfileEye(-41, 8.2, 28.5, 1.9, 0, false);
        // Open gasping mouth with subtle upper teeth edge
        path(ctx,[M(26,-16),Q(33,-21,36,-14),Q(36,-7,30,-8),Q(25,-10,26,-16)],'#5e302a',ink,1.8);
        path(ctx,[M(28,-16),L(35,-15),L(34,-13),L(28,-13.5)],'#fff4e4',null);
      } else if (expr === 'dread') {
        // Knitted terrified brows + forehead worry creases + tiny pinpoint pupil + under-eye hollow + sweat!
        path(ctx,[M(14,-50),Q(22,-56,32,-54)],null,ink,2.3);
        path(ctx,[M(18,-58),Q(25,-60,31,-58)],null,'#9e6850',1.1);
        drawProfileEye(-40, 7.6, 28.8, 1.35, 0, true);
        path(ctx,[M(26,-15),Q(31,-18,36,-15),Q(33,-11,26,-15)],'#63342e',ink,1.6);
        drawSweat(4, -36, 1.0);
      } else if (expr === 'panic') {
        // High strained brows, forehead lines, wide watery eye, hyperventilating open mouth, double sweat!
        path(ctx,[M(14,-53),Q(22,-60,32,-56)],null,ink,2.5);
        path(ctx,[M(16,-59),Q(24,-63,31,-60)],null,'#9e6850',1.2);
        drawProfileEye(-41, 8.0, 29.0, 1.55, 0, true);
        path(ctx,[M(23,-16),Q(30,-22,37,-15),Q(37,-7,29,-8),Q(23,-10,23,-16)],'#5b2c27',ink,1.9);
        path(ctx,[M(26,-16.5),L(35,-15.5),L(34,-13),L(26,-14)],'#fff4e4',null);
        path(ctx,[M(27,-9.5),L(34,-9.5),L(33,-11),L(27,-11)],'#fff4e4',null);
        drawSweat(2, -37, 1.05);
        drawSweat(10, -28, 0.72);
      } else if (expr === 'strain') {
        oval(ctx,16,-27,9.5,5.5,'rgba(210,118,98,0.68)');
        path(ctx,[M(14,-52),L(32,-46),M(16,-39),Q(24,-35,31,-42)],null,ink,2.7);
        // Crow's-feet strain creases beside eye
        path(ctx,[M(12,-41),L(16,-40),M(13,-37),L(16,-38)],null,'#9c644c',1.2);
        path(ctx,[M(23,-16),Q(30,-21,36,-17),L(36,-11),Q(29,-9,23,-16)],'#fff4e4',ink,1.6);
        path(ctx,[M(25,-14),L(35,-14)],null,'#b59e88',1.1);
        drawSweat(4, -36, 0.85);
      } else if (expr === 'determined') {
        // Fierce lowered angled brow + focused sharp narrowed eye + firm jaw!
        path(ctx,[M(14,-50),L(33,-45)],null,ink,2.8);
        drawProfileEye(-39.5, 5.2, 29.4, 2.3, 2.2, false);
        path(ctx,[M(24,-15),Q(30,-16,36,-15)],null,ink,2.2);
      } else if (expr === 'angry') {
        // Steep V-brow, nose scrunch, glaring pinned eye, wide shouting snarling mouth!
        oval(ctx,17,-28,8,4.5,'rgba(208,112,92,0.45)');
        path(ctx,[M(14,-53),L(33,-44)],null,ink,3.0);
        path(ctx,[M(29,-40),L(33,-38)],null,'#9c644c',1.3);
        drawProfileEye(-39.5, 6.2, 29.5, 1.85, 2.0, false);
        path(ctx,[M(22,-17),Q(30,-23,37,-16),L(36,-7),Q(28,-6,22,-12)],'#582723',ink,2);
        path(ctx,[M(24,-17),L(35,-16),L(34,-13),L(24,-14)],'#fff4e4',null);
        path(ctx,[M(25,-9),L(34,-8.5),L(34,-10.5),L(25,-11)],'#fff4e4',null);
      } else if (expr === 'exhausted') {
        // Heavy half-closed drooping lids, dark under-eye bags, slack open breathing mouth, sweat!
        path(ctx,[M(15,-49),Q(23,-52,32,-48)],null,ink,1.9);
        drawProfileEye(-39, 5.5, 28.0, 2.1, 3.8, true);
        path(ctx,[M(26,-15),Q(32,-17,36,-13),Q(33,-9,27,-12)],'#663630',ink,1.6);
        drawSweat(6, -34, 0.95);
      } else if (expr === 'pain') {
        // Tight painful wince, asymmetrical brow scrunch, grimacing bared teeth!
        path(ctx,[M(14,-48),Q(23,-55,32,-48)],null,ink,2.7);
        path(ctx,[M(16,-40),L(25,-37),L(32,-42)],null,ink,2.6);
        path(ctx,[M(12,-41),L(16,-40),M(13,-37),L(16,-38)],null,'#9c644c',1.2);
        path(ctx,[M(22,-14),Q(29,-21,36,-16),L(35,-10),Q(28,-11,22,-14)],'#fff4e4',ink,1.7);
        path(ctx,[M(24,-13.5),L(34,-13)],null,'#b59e88',1.2);
      } else if (expr === 'sneak') {
        // Cautious narrowed squinting eye glancing ahead, tightly sealed lips!
        path(ctx,[M(14,-48),Q(23,-50,33,-47)],null,ink,2.4);
        drawProfileEye(-39.5, 4.4, 29.8, 2.1, 1.8, false);
        path(ctx,[M(25,-15),Q(30,-14,36,-15.5)],null,ink,2.1);
      } else if (expr === 'relief') {
        path(ctx,[M(15,-48),Q(23,-52,32,-47)],null,ink,2.0);
        path(ctx,[M(17,-39),Q(24,-34,32,-39)],null,ink,2.2);
        path(ctx,[M(24,-16),Q(30,-10,36,-15)],null,ink,2.0);
      } else {
        // Upgraded realistic Neutral: natural brow, detailed lidded eye with iris/catchlight, relaxed lips!
        path(ctx,[M(15,-48),Q(24,-52,33,-48)],null,ink,2.0);
        drawProfileEye(-39.5, 5.4, 28.4, 2.2, 1.0, false);
        path(ctx,[M(25,-15),Q(31,-15.5,36,-15)],null,ink,1.9);
      }
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
    // Consistent clockwise turnaround: Front (0°) -> Front-3/4 (45° R) -> Side (90° R) -> Rear-3/4 (135° R-away) -> Back (180°)
    const shift = quarter ? (rear ? 10 : 13) : 0;
    const neckX = quarter ? (rear ? 3 : 5) : 0;
    const shoulder = quarter ? 40 : 50;
    const leftShoulder = -shoulder + (quarter ? (rear ? -2 : -9) : 0);
    const rightShoulder = shoulder + (quarter ? (rear ? -4 : -6) : 0);
    const hip = quarter ? 31 : 36;
    const waist = hip - 2;
    const crown = -480;
    const shoulderY = -360;
    const hipY = -226;
    const [bodyX, bodyY] = pose?.body ?? [0, 0];

    const drawArm = (side) => {
      const [, , , , wristX, wristY] = pose?.limbs?.[side] ?? [0, 0, 0, 0, 0, 0];
      const far = quarter && side === 1; // Facing right (45° & 135°): right side (+1) is far, left side (-1) is near!
      const tones = far ? palette.far : palette.near;
      const top = side === 1 ? rightShoulder - 4 : leftShoulder + 4;
      const elbow = top + side * 4 + wristX / 2;
      const wrist = top + side * 2 + wristX;
      ctx.save();
      ctx.translate(bodyX, bodyY);
      path(ctx, [M(top - 10, shoulderY + 10), C(top - 9, shoulderY - 3, top + 9, shoulderY - 3, top + 10, shoulderY + 10),
        Q(elbow + 10, -315 + wristY / 4, elbow + 10, -282 + wristY / 3), L(wrist + 8, -210 + wristY), L(wrist - 8, -210 + wristY),
        L(elbow - 10, -282 + wristY / 3), Q(elbow - 10, -315 + wristY / 4, top - 10, shoulderY + 10)], tones.fabric);
      path(ctx, [M(elbow - 4, -301), L(wrist - 3, -218 + wristY),
        M(wrist - 8, -220 + wristY), L(wrist + 8, -220 + wristY)],
      null, tones.shade, 2);
      ctx.translate(0, wristY);
      path(ctx, [M(wrist - 7, -210), L(wrist + 7, -210), Q(wrist + 12, -196, wrist + 5, -188),
        Q(wrist, -184, wrist - 4, -190), L(wrist - 8, -199)], tones.skin);
      ctx.restore();
    };

    for (const side of pose?.hideLimbs ? [] : [1, -1]) {
      const [ankleX, ankleY, kneeY, toeDepth] = pose?.limbs?.[side] ?? [0, 0, 0, 0, 0, 0];
      const far = quarter && side === 1;
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
      const toe = ankle + (quarter ? (rear ? 9 : 12) : 0);
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

      // Draw far arm (or both in orthographic Front/Back) behind torso; near arm in 3/4 overlaps in front of torso!
      if (!quarter || side === 1) drawArm(side);
    }

    ctx.translate(bodyX, bodyY);
    path(ctx, [M(-waist, -255), L(waist, -255), L(hip, hipY), Q(19,-211,4,-209),
      L(-4,-209), Q(-19,-211,-hip,hipY)], palette.near.pants);
    // Proportional natural neck seated smoothly into trapezius/collar
    path(ctx, [M(neckX - 12, -408), L(neckX + 12, -408), Q(neckX + 12, -386, neckX + 15, -374),
      Q(neckX, -367, neckX - 15, -374), Q(neckX - 12, -386, neckX - 12, -408)], '#cf956f');
    // Smoothly sloped trapezius & rounded shoulder seams blending cleanly into sleeves
    path(ctx, [M(neckX - 14, -380), C(leftShoulder + 22, -376, leftShoulder + 6, -370, leftShoulder + 1, -356),
      Q(leftShoulder + 5, -326, -waist, -298), L(-waist, -255), Q(0, -247, waist, -255), L(waist, -299),
      Q(rightShoulder - 6, -330, rightShoulder - 1, -356),
      C(rightShoulder - 6, -370, neckX + 28, -376, neckX + 14, -380), Q(neckX, -369, neckX - 14, -380)], shirt);
    path(ctx, [M(leftShoulder + 2, -356), Q(leftShoulder + 16, -330, -waist + 6, -287), L(-waist + 6, -256), L(-waist, -255),
      L(-waist, -294), Q(leftShoulder + 5, -330, leftShoulder + 2, -356)], '#c8c1ac', null);
    if (rear) {
      const spineX = quarter ? -6 : 0;
      path(ctx, [M(leftShoulder + 7, -356), Q(spineX, -344, rightShoulder - 7, -357),
        M(spineX, -346), Q(spineX - 2, -328, spineX - 1, -314)],
        null, '#a49c86', 1.8);
      path(ctx, [M(neckX - 15, -380), Q(neckX, -370, neckX + 15, -380), L(neckX + 17, -372),
        Q(neckX, -363, neckX - 17, -373)], '#f6efdf', ink, 1.4);
    } else {
      path(ctx, [M(neckX-4,-366), L(neckX+5,-366), L(neckX+7,-283), L(neckX+1,-272),
        L(neckX-6,-282)], tie, ink, 1.4);
      path(ctx, [M(neckX-12,-382), L(neckX,-368), L(neckX+13,-382), L(neckX+20,-374),
        L(neckX+9,-358), L(neckX,-367), L(neckX-9,-358), L(neckX-19,-375)], '#f6efdf', ink, 1.4);
      path(ctx, [M(neckX-6,-367), L(neckX+6,-367), L(neckX+3,-357), L(neckX-3,-357)], tie, ink, 1.4);
    }

    // In 3/4 views, overlap the near (left) arm cleanly over the near edge of the torso!
    if (quarter && !pose?.hideLimbs) {
      ctx.save();
      ctx.translate(-bodyX, -bodyY);
      drawArm(-1);
      ctx.restore();
    }

    // Optional head tilt (pivoted at real skull-neck joint y=-404 so neck never steps!) and pitch (looking up/down)
    const headTilt = pose?.headTilt ?? 0;
    const headPitch = pose?.headPitch ?? 0; // -1 = looking up, +1 = looking down
    const [eyeDx, eyeDy] = pose?.eyeOffset ?? [0, 0];
    const extraSweat = pose?.sweat ?? 0; // 0..1 animated sweat bead slide
    const extraDread = pose?.dreadWash ?? 0; // 0..1 extra upper-face dread shadow
    ctx.save();
    if (headTilt) {
      ctx.translate(neckX, -404);
      ctx.rotate(headTilt * Math.PI / 180);
      ctx.translate(-neckX, 404);
    }
    const featY = headPitch * 9.5; // Features shift UP when looking up (-), DOWN when looking down (+)
    const earY = -431 - headPitch * 7; // Ears shift opposite pitch for real 3D head foreshortening!

    const left = -34;
    const right = quarter ? 35 : 34;
    // Consistent ears: Front & Back show both; Front-3/4 (45° R) & Rear-3/4 (135° R-away) both show the near-left ear!
    oval(ctx, left - 1, earY, 6, 9, '#dda07d', ink);
    if (!quarter) oval(ctx, right + 1, earY, 6, 9, '#dda07d', ink);
    if (rear && quarter) {
      // Rear-3/4 turning right-away (135°): clean nape + subtle right cheek/jaw edge turning away on the right!
      path(ctx, [M(left, -449), Q(left, -476, 0, crown), Q(right + 1, -475, right + 2, -448),
        Q(right + 5, -433, right + 2, -422), Q(right - 3, -409, neckX + 12, -405),
        Q(neckX, -400, neckX - 12, -405), Q(left + 8, -409, left + 1, -425)], palette.near.skin);
    } else if (rear) {
      path(ctx, [M(left,-450), Q(left,-476,0,crown), Q(right,-476,right,-450),
        Q(right,-431,right-7,-420), Q(right-15,-409,neckX+10,-408),
        Q(neckX,-401,neckX-10,-407), Q(left+4,-411,left,-429)], palette.near.skin);
    } else if (quarter) {
      path(ctx, [M(left,-451), Q(left,-477,0,crown), Q(26,-480,35,-456), Q(39,-445,37,-434),
        L(41,-426), Q(42,-423,37,-421), Q(35,-414,28,-407), Q(22,-401,15,-399),
        Q(9,-397,2,-401), L(-16,-409), Q(-31,-417,-33,-432)], palette.near.skin);
    } else {
      const chinY = -397 + headPitch * 4;
      path(ctx, [M(left,-450), Q(left,-476,0,crown), Q(right,-476,right,-450),
        L(29,-425 + headPitch * 3), Q(27,-417 + headPitch * 3,15,-407 + headPitch * 4),
        L(5,chinY - 3), Q(0,chinY,-5,chinY - 3),
        L(-16,-407 + headPitch * 4), Q(-28,-416 + headPitch * 3,left+2,-429 + headPitch * 2)], palette.near.skin);
      // Subtle under-chin shadow plane when tilted looking UP!
      if (headPitch < -0.2) {
        path(ctx, [M(-18,-408 + headPitch * 4), Q(0,chinY + 2,18,-408 + headPitch * 4),
          Q(0,chinY - 6,-18,-408 + headPitch * 4)], `rgba(116,62,44,${(-headPitch * 0.34).toFixed(2)})`, null);
      }
    }

    if (rear) {
      path(ctx, [M(left-2,-435), L(left-5,-446), Q(left-6,-475,-17,-480), Q(10,-492,29,-472),
        Q(right+5,-466,right+4,-441), Q(right-1,-428,right-7,-423), L(22,-416),
        L(10,-417), L(neckX+4,-410), L(-13,-417), L(-22,-416), Q(left+4,-423,left-2,-435)], hair);
      path(ctx, [M(left+4,-453), Q(-15,-477,6,-477), Q(22,-475,30,-464),
        Q(9,-472,-1,-461), L(-16,-447), L(-10,-460)], hairLight,null);
    } else {
      const expression = pose?.expression ?? 'head';
      const expr = expression.startsWith('head-') ? expression.slice(5) : 'neutral';
      const pale = expr === 'dread' || expr === 'exhausted' || extraDread > 0.35;
      if (pale) {
        // Subtle pale dread/fatigue skin tint over base face
        path(ctx, [M(left,-450), Q(left,-476,0,crown), Q(right,-476,right,-450),
          L(29,-425), Q(27,-417,15,-407), L(5,-400), Q(0,-397,-5,-400),
          L(-16,-407), Q(-28,-416,left+2,-429)], 'rgba(214,220,232,0.22)', null);
      }
      // Portrait plane shading: soft cheekbone/jaw side shadow + under-nose shadow + hair cast shadow on forehead!
      path(ctx, [M(-31,-438), Q(-25,-415,-5,-400), L(0,-399), Q(-15,-409,-24,-424), Q(-29,-433,-31,-438)], 'rgba(136,78,56,0.20)', null);
      path(ctx, [M(-29,-448 + featY * 0.4), Q(0,-456 + featY * 0.4,29,-448 + featY * 0.4), L(28,-455 + featY * 0.4), Q(0,-463 + featY * 0.4,-28,-455 + featY * 0.4)], 'rgba(84,48,36,0.18)', null);
      const dreadStrength = Math.max(expr === 'dread' ? 1 : 0, extraDread);
      if (dreadStrength > 0.01) {
        const dg = ctx.createLinearGradient(0, -464, 0, -422 + featY);
        dg.addColorStop(0, `rgba(18,26,42,${(0.38 * dreadStrength).toFixed(2)})`);
        dg.addColorStop(1, 'rgba(18,26,42,0)');
        path(ctx, [M(-33,-460), Q(0,-468,33,-460), L(31,-422 + featY), Q(0,-420 + featY,-31,-422 + featY)], dg, null);
      }
      // Detailed inner ear cartilage folds
      path(ctx, [M(left-3,earY-4), Q(left-1,earY,left-2,earY+5)], null, '#a46b51', 1.2);
      if (!quarter) path(ctx, [M(right+3,earY-4), Q(right+1,earY,right+2,earY+5)], null, '#a46b51', 1.2);

      // Swept chestnut hair & warm highlight (fringe drops slightly when looking down, lifts slightly when looking up!)
      const fy = headPitch * 6.5;
      path(ctx, [M(left+4,-427 + fy * 0.4), L(left-3,-439 + fy * 0.3), L(left-5,-451), Q(left-4,-476,-17,-480),
        Q(10,-492 - Math.max(0, headPitch) * 3,29,-472), Q(right+4,-465,right+4,-445 + fy * 0.3),
        L(right-3,-451 + fy), L(right-6,-445 + fy), L(right-11,-458 + fy),
        L(shift+9,-448 + fy), L(shift+9,-458 + fy), L(shift-5,-447 + fy), L(shift-3,-456 + fy),
        L(shift-17,-440 + fy), L(shift-14,-455 + fy), Q(left+9,-450 + fy * 0.6,left+4,-427 + fy * 0.4)], hair);
      path(ctx, [M(left+4,-453 + fy * 0.3), Q(-15,-477,6,-477), Q(22,-475,30,-464),
        Q(9,-474,-1,-461 + fy * 0.4), L(-16,-448 + fy * 0.5), L(-10,-460 + fy * 0.3)], hairLight,null);

      // Front-view sweat bead helper
      const drawFrontSweat = (sx, sy, s = 1) => {
        path(ctx, [M(sx,sy-5.5*s), Q(sx+3.5*s,sy+1*s,sx,sy+4.5*s), Q(sx-3.5*s,sy+1*s,sx,sy-5.5*s)], '#d6f0ff', '#4e7a91', 1.0);
        oval(ctx, sx-0.9*s, sy-0.5*s, 0.9*s, 1.2*s, '#ffffff');
      };

      // Realistic front eye helper (eyelid crease, thick tapered upper lash, iris + dark pupil + specular catchlight!)
      const drawFrontEye = (ex, ey, ew, eh, pdx, pdy, pr, lidDroop = 0, underBag = false) => {
        const fx = pdx + eyeDx;
        const fyEye = pdy + eyeDy + headPitch * 1.4;
        if (underBag) {
          path(ctx, [M(ex-ew*0.85, ey+eh+2.2), Q(ex, ey+eh+4.8, ex+ew*0.85, ey+eh+2.2)], null, 'rgba(92,58,64,0.34)', 1.5);
        }
        path(ctx, [M(ex-ew, ey), Q(ex, ey-eh, ex+ew, ey), Q(ex, ey+eh*0.88, ex-ew, ey)], '#fff5e8', ink, 1.1);
        const ir = Math.min(eh * 0.72, pr * 1.48);
        oval(ctx, ex + fx, ey + fyEye, ir, ir, '#5d3e33');
        oval(ctx, ex + fx, ey + fyEye, pr, pr, '#161b1e');
        oval(ctx, ex + fx - 1.1, ey + fyEye - 1.3, 1.15, 1.15, '#ffffff');
        if (lidDroop > 0) {
          path(ctx, [M(ex-ew-1, ey-eh-1), L(ex+ew+1, ey-eh-1), L(ex+ew, ey-eh+lidDroop),
            Q(ex, ey-eh+lidDroop+1.4, ex-ew, ey-eh+lidDroop)], pale ? '#dfae90' : '#e7ae87', null);
        }
        const topY = ey - eh + lidDroop;
        path(ctx, [M(ex-ew-0.5, ey+0.3), Q(ex, topY-0.5, ex+ew+0.5, ey+0.3)], null, ink, 2.2);
        path(ctx, [M(ex-ew*0.75, topY-2.6), Q(ex, topY-4.4, ex+ew*0.75, topY-2.6)], null, '#9c644c', 1.0);
      };

      // Shift eyes, brows, nose, mouth smoothly by featY when pitching head up/down!
      ctx.save();
      ctx.translate(0, featY);
      for (const side of [-1, 1]) {
        const eye = shift + side * (quarter ? (side === 1 ? 14 : 13) : 15);
        const w = quarter && side === 1 ? 6 : 8.5;
        const innerX = eye - side * w;
        const outerX = eye + side * w;
        if (expr === 'strain') {
          oval(ctx, eye + side * 4, -422, 8.2, 4.6, 'rgba(210,118,98,0.65)');
          path(ctx, [M(outerX,-449), L(innerX,-443),
            M(eye-7,-435), Q(eye,-431,eye+7,-435)], null, ink, 2.4);
          path(ctx, [M(eye+side*8,-436), L(eye+side*11,-438), M(eye+side*8,-433), L(eye+side*11,-432)], null, '#9c644c', 1.0);
        } else if (expr === 'pain') {
          path(ctx, [M(outerX,-444), Q(eye,-449,innerX,-449)], null, ink, 2.4);
          if (side === -1) {
            path(ctx, [M(eye-7,-436), L(eye+6,-433), L(eye-7,-431)], null, ink, 2.4);
          } else {
            drawFrontEye(eye, -434, w, 4.2, 0, 0, 1.9, 1.4, true);
          }
        } else if (expr === 'relief') {
          path(ctx, [M(outerX,-443), Q(eye,-446,innerX,-443)], null, ink, 1.9);
          path(ctx, [M(eye-7.5,-434), Q(eye,-430,eye+7.5,-434)], null, ink, 2.1);
        } else if (expr === 'alarm') {
          path(ctx, [M(outerX,-447), Q(eye,-453,innerX,-449)], null, ink, 2.1);
          drawFrontEye(eye, -435, w, 7.6, 0, 0, 1.75, 0, false);
        } else if (expr === 'dread') {
          path(ctx, [M(outerX,-444), Q(eye,-448,innerX,-450)], null, ink, 2.1);
          drawFrontEye(eye, -435, w, 7.2, 0, 0.3, 1.25, 0, true);
        } else if (expr === 'panic') {
          path(ctx, [M(outerX,-445), Q(eye,-451,innerX,-453)], null, ink, 2.3);
          drawFrontEye(eye, -435, w, 7.6, 0, 0, 1.45, 0, true);
        } else if (expr === 'determined') {
          path(ctx, [M(outerX,-447), L(innerX,-441.5)], null, ink, 2.6);
          drawFrontEye(eye, -435, w, 4.8, 0, 0.5, 2.1, 1.5, false);
        } else if (expr === 'angry') {
          oval(ctx, eye + side * 4, -424, 6.5, 3.6, 'rgba(208,112,92,0.40)');
          path(ctx, [M(outerX,-450), L(innerX,-439.5)], null, ink, 2.9);
          drawFrontEye(eye, -435, w, 5.8, 0, 0.4, 1.75, 1.7, false);
        } else if (expr === 'exhausted') {
          path(ctx, [M(outerX,-442), Q(eye,-445,innerX,-445.5)], null, ink, 1.8);
          drawFrontEye(eye, -434, w, 5.2, 0, 0.6, 1.9, 3.4, true);
        } else if (expr === 'sneak') {
          path(ctx, [M(outerX,-445), Q(eye,-445,innerX,-442.5)], null, ink, 2.2);
          drawFrontEye(eye, -435, w, 4.1, 2.8, 0.3, 1.9, 1.4, false);
        } else if (expr === 'notice') {
          path(ctx, [M(outerX,-444-(side===-1?2.5:0)), Q(eye,-448,innerX,-444)], null, ink, 2.0);
          drawFrontEye(eye, -435, w, 5.8, 2.6, 0, 2.1, 0.4, false);
        } else {
          path(ctx, [M(outerX,-444), Q(eye,-446.5,innerX,-443.5)], null, ink, 1.9);
          drawFrontEye(eye, -435, w, 5.2, 0, 0, 2.1, 0.9, false);
        }
      }

      // Forehead tension creases & sweat beads for high-stress horror reactions
      if (expr === 'dread' || expr === 'panic') {
        path(ctx, [M(-9,-453), Q(0,-455,9,-453)], null, '#9c644c', 1.1);
        drawFrontSweat(24, -440 + extraSweat * 9, 1.0);
        if (expr === 'panic') drawFrontSweat(-24, -434 + extraSweat * 7, 0.72);
      } else if (expr === 'exhausted' || expr === 'strain') {
        drawFrontSweat(24, -439 + extraSweat * 6, 0.85);
      } else if (extraSweat > 0.05) {
        drawFrontSweat(24, -443 + extraSweat * 11, 0.85 + 0.2 * extraSweat);
      } else if (expr === 'angry') {
        path(ctx, [M(-3,-444), L(-2,-438), M(3,-444), L(2,-438)], null, '#9c644c', 1.2);
      }

      // Sculpted nose (shows slight upturned nostril plane when looking UP, crisp downward point when looking DOWN!)
      const noseX = quarter ? 17 : 0;
      if (headPitch < -0.35) {
        path(ctx, [M(noseX-1,-431), L(noseX+4,-423), L(noseX-2.5,-422)], null, ink, 1.7);
        oval(ctx, noseX - 1.6, -422.5, 1.1, 0.8, '#7a4b38');
        oval(ctx, noseX + 2.2, -422.5, 1.1, 0.8, '#7a4b38');
      } else {
        path(ctx, [M(noseX-1,-432), L(noseX+4.5,-421 + headPitch * 2), L(noseX-2,-419 + headPitch * 2)], null, ink, 1.7);
        path(ctx, [M(noseX-2.5,-419 + headPitch * 2), Q(noseX+1,-417 + headPitch * 2,noseX+4,-419.5 + headPitch * 2)], null, 'rgba(130,74,52,0.34)', 1.6);
      }

      // Expressive front mouth + subtle under-lip chin shadow!
      const mouthX = quarter ? 16 : 0;
      path(ctx, [M(mouthX-4,-405), Q(mouthX,-403.5,mouthX+4,-405)], null, 'rgba(128,70,52,0.32)', 1.3);
      if (expr === 'alarm') {
        path(ctx, [M(mouthX-6,-413), Q(mouthX,-418,mouthX+6,-413), Q(mouthX+6,-405,mouthX,-405), Q(mouthX-6,-405,mouthX-6,-413)], '#5e302a', ink, 1.8);
        path(ctx, [M(mouthX-4,-413.5), L(mouthX+4,-413.5), L(mouthX+3.5,-411.5), L(mouthX-3.5,-411.5)], '#fff4e4', null);
      } else if (expr === 'dread') {
        path(ctx, [M(mouthX-6,-411), Q(mouthX,-414.5,mouthX+6,-411), Q(mouthX,-408.5,mouthX-6,-411)], '#63342e', ink, 1.6);
      } else if (expr === 'panic') {
        path(ctx, [M(mouthX-8,-413), Q(mouthX,-418,mouthX+8,-413), Q(mouthX+7,-405,mouthX,-405), Q(mouthX-7,-405,mouthX-8,-413)], '#5b2c27', ink, 1.8);
        path(ctx, [M(mouthX-6,-413.5), L(mouthX+6,-413.5), L(mouthX+5,-411.5), L(mouthX-5,-411.5)], '#fff4e4', null);
        path(ctx, [M(mouthX-5,-407), L(mouthX+5,-407), L(mouthX+4.5,-408.5), L(mouthX-4.5,-408.5)], '#fff4e4', null);
      } else if (expr === 'strain') {
        path(ctx, [M(mouthX-8.5,-413), Q(mouthX,-417,mouthX+8.5,-413), L(mouthX+6.5,-408), L(mouthX-6.5,-408)], '#fff4e4', ink, 1.6);
        path(ctx, [M(mouthX-7,-410.5), L(mouthX+7,-410.5)], null, '#b59e88', 1.1);
      } else if (expr === 'angry') {
        path(ctx, [M(mouthX-9.5,-414), Q(mouthX,-419,mouthX+9.5,-414), L(mouthX+8,-405.5), Q(mouthX,-404,mouthX-8,-405.5)], '#582723', ink, 1.9);
        path(ctx, [M(mouthX-7.5,-414), L(mouthX+7.5,-414), L(mouthX+6.5,-411.5), L(mouthX-6.5,-411.5)], '#fff4e4', null);
        path(ctx, [M(mouthX-6.5,-406.5), L(mouthX+6.5,-406.5), L(mouthX+6,-408.5), L(mouthX-6,-408.5)], '#fff4e4', null);
      } else if (expr === 'pain') {
        path(ctx, [M(mouthX-8,-411), Q(mouthX-2,-417,mouthX+8,-413), L(mouthX+6,-408), Q(mouthX-2,-410,mouthX-8,-411)], '#fff4e4', ink, 1.7);
      } else if (expr === 'exhausted') {
        path(ctx, [M(mouthX-5.5,-411), Q(mouthX,-414,mouthX+5.5,-411), Q(mouthX,-407,mouthX-5.5,-411)], '#663630', ink, 1.6);
      } else if (expr === 'determined') {
        path(ctx, [M(mouthX-7.5,-411.5), Q(mouthX,-413,mouthX+7.5,-411.5)], null, ink, 2.1);
      } else if (expr === 'sneak') {
        path(ctx, [M(mouthX-6,-411.5), Q(mouthX,-410.5,mouthX+6,-412)], null, ink, 1.9);
      } else if (expr === 'relief') {
        path(ctx, [M(mouthX-7,-412), Q(mouthX,-406.5,mouthX+7,-412)], null, ink, 1.9);
      } else if (expr === 'notice') {
        path(ctx, [M(mouthX-7,-411), Q(mouthX,-414,mouthX+6.5,-411.5)], null, ink, 1.8);
      } else {
        path(ctx, [M(mouthX-7,-411.5), Q(mouthX,-412.5,mouthX+7,-411.5)], null, ink, 1.8);
      }
      ctx.restore();
    }
    ctx.restore();
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
    if (id === 'shove') {
      // Heavy wooden crate/barricade wall on the right for shove contact study
      path(ctx,[M(378,430),L(492,430),L(492,floor),L(378,floor)],'#8a644a');
      path(ctx,[M(378,430),L(492,430),L(492,452),L(378,452)],'#a47b5c');
      path(ctx,[M(392,462),L(478,462),L(478,floor-12),L(392,floor-12)],'#70503b');
    }
    if (id === 'vault') {
      // Waist-high barrier/crate centered at x=238..310, top y=554 for one-handed speed vault study!
      path(ctx,[M(238,556),L(310,556),L(310,floor),L(238,floor)],'#8c6a51');
      path(ctx,[M(232,550),L(316,550),L(316,568),L(232,568)],'#ad8566');
    }
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

  // Cinematic camera angles for horror/survival framing (OTS, Overhead, Low-Angle, High-Angle)
  // All front/rear perspectives reuse the official drawAnatomyTurnaround geometry so character identity stays 100% on-model!
  window.drawCinematicAngle = (ctx, x, y, scale, angle) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const skin = palette.near.skin;

    if (angle === 'ots') {
      // Full-bleed dark corridor behind official rear-view Series Lead anchored in lower-right foreground!
      path(ctx, [M(-162, -180), L(162, -180), L(162, 180), L(-162, 180)], '#25313a', null);
      path(ctx, [M(-78, -180), L(-18, -36), L(-18, 56), L(-145, 180), L(-162, 180), L(-162, -180)], '#1c252c', null);
      path(ctx, [M(102, -180), L(35, -36), L(35, 56), L(162, 180), L(162, -180)], '#1c252c', null);
      path(ctx, [M(-18, 56), L(35, 56), L(162, 180), L(-145, 180)], '#33404a', null);
      const lamp = ctx.createRadialGradient(4, -12, 4, 4, -12, 86);
      lamp.addColorStop(0, 'rgba(248, 212, 134, 0.40)');
      lamp.addColorStop(1, 'rgba(248, 212, 134, 0)');
      ctx.fillStyle = lamp;
      ctx.fillRect(-90, -110, 190, 200);
      // Official rear Series Lead head & right shoulder framed in lower-right foreground
      drawAnatomyTurnaround(ctx, 76, 804, 1.82, 'rear', { hideLimbs: false });
    } else if (angle === 'overhead') {
      // Overhead / Top-Down God-View (standing on ground looking straight down!)
      oval(ctx, 0, 16, 68, 36, 'rgba(37,58,59,0.16)', null);
      path(ctx, [M(-32, 34), Q(-22, 64, -10, 62), Q(-2, 58, -6, 32)], shoe, ink, 2.2);
      path(ctx, [M(10, 32), Q(6, 58, 16, 62), Q(28, 64, 34, 34)], shoe, ink, 2.2);
      path(ctx, [M(-42, 14), Q(0, 44, 42, 14), L(32, -8), L(-32, -8)], palette.near.pants, ink, 2.0);
      path(ctx, [M(-64, 4), Q(-76, 26, -60, 44), Q(-48, 48, -44, 30), L(-46, 6)], shirt, ink, 2.2);
      oval(ctx, -54, 44, 9, 11, skin, ink);
      path(ctx, [M(64, 4), Q(76, 26, 60, 44), Q(48, 48, 44, 30), L(46, 6)], shirt, ink, 2.2);
      oval(ctx, 54, 44, 9, 11, skin, ink);
      path(ctx, [M(-70, -4), Q(-68, -42, 0, -44), Q(68, -42, 70, -4), Q(66, 30, 0, 34), Q(-66, 30, -70, -4)], shirt, ink, 2.4);
      path(ctx, [M(-60, -2), Q(-28, -26, 0, -24), Q(28, -26, 60, -2)], null, '#bab49f', 2.2);
      path(ctx, [M(-7, 26), L(0, 46), L(7, 26)], tie, ink, 1.5);
      path(ctx, [M(-6, 30), Q(0, 38, 6, 30)], skin, ink, 1.8);
      oval(ctx, -40, -4, 6, 11, '#dda07d', ink);
      oval(ctx, 40, -4, 6, 11, '#dda07d', ink);
      path(ctx, [M(-38, -8), Q(-42, -52, 0, -56), Q(42, -52, 38, -8), Q(38, 28, 12, 33),
        L(6, 22), L(-4, 34), L(-14, 24), Q(-38, 24, -38, -8)], hair, ink, 2.5);
      path(ctx, [M(-22, -32), Q(0, -44, 22, -26), Q(6, -24, -18, -18)], hairLight, null);
      path(ctx, [M(-4, -22), Q(4, -12, 16, -8), M(-6, -18), Q(-16, -6, -22, 6)], null, ink, 1.6);
    } else if (angle === 'low-angle') {
      // Dramatic Low-Angle: official Series Lead looming upward from chest/waist height!
      ctx.save();
      ctx.translate(0, 26);
      ctx.scale(1.12, 1.04);
      drawAnatomyTurnaround(ctx, 0, 646, 1.68, 'front', {
        expression: 'head-determined',
        headPitch: -0.95,
        eyeOffset: [0, -1.2],
      });
      ctx.restore();
    } else {
      // Vulnerable High-Angle: official Series Lead viewed from above looking up in alarm!
      ctx.save();
      ctx.translate(0, -16);
      drawAnatomyTurnaround(ctx, 0, 476, 1.15, 'front', {
        expression: 'head-alarm',
        headPitch: 0.92,
        eyeOffset: [0, -2.8],
        sweat: 0.7,
      });
      ctx.restore();
    }
    ctx.restore();
  };

  // Cinematic Face Angles, Tilts, Gazes & Off-Center Crash-Zoom ECU
  // Uses the EXACT official Series Lead head geometry from drawAnatomyTurnaround & drawPart!
  window.drawFaceAngle = (ctx, x, y, scale, mode, opts = {}) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (mode === 'eye-dart') {
      drawAnatomyTurnaround(ctx, 0, 882, 2.04, 'front', {
        hideLimbs: true,
        expression: opts.expression ?? 'head',
        eyeOffset: [opts.dart ?? 3.6, opts.eyeDy ?? 0],
        sweat: opts.sweat ?? 0.85,
      });
    } else if (mode === 'head-tilt') {
      drawAnatomyTurnaround(ctx, 0, 882, 2.04, 'front', {
        hideLimbs: true,
        expression: opts.expression ?? 'head-notice',
        headTilt: opts.tilt ?? 12,
        eyeOffset: [opts.dart ?? -1.8, 0],
        dreadWash: opts.dread ?? 0.35,
      });
    } else if (mode === 'look-up') {
      drawAnatomyTurnaround(ctx, 0, 882, 2.04, 'front', {
        hideLimbs: true,
        expression: opts.expression ?? 'head-alarm',
        headPitch: opts.pitch ?? -0.95,
        eyeOffset: [0, opts.eyeDy ?? -1.8],
      });
    } else if (mode === 'look-down') {
      drawAnatomyTurnaround(ctx, 0, 882, 2.04, 'front', {
        hideLimbs: true,
        expression: opts.expression ?? 'head',
        headPitch: opts.pitch ?? 0.95,
        eyeOffset: [0, opts.eyeDy ?? 1.6],
      });
    } else if (mode === 'glance-back') {
      // Official side-profile Series Lead turning sharply back over shoulder — full crown & collar cleanly framed!
      const dir = opts.flip === false ? 1 : -1;
      ctx.save();
      ctx.translate(0, 214);
      ctx.scale(dir * 1.32, 1.32);
      drawPart(ctx, 'chest');
      ctx.save();
      ctx.translate(3, -127);
      drawPart(ctx, 'neck');
      ctx.translate(0, -21);
      ctx.rotate((opts.headAngle ?? -4) * Math.PI / 180);
      drawPart(ctx, opts.expression ?? 'head-alarm');
      ctx.restore();
      ctx.restore();
    } else {
      // Off-Center ECU Crash-Zoom Dread: LITERAL tight zoom of our official Series Lead front face!
      const zoom = opts.zoom ?? 5.95;
      const panX = opts.panX ?? -72;
      const panY = opts.panY ?? 34;
      drawAnatomyTurnaround(ctx, panX, 434 * zoom + panY, zoom, 'front', {
        hideLimbs: true,
        expression: opts.expression ?? 'head-dread',
        eyeOffset: [opts.dart ?? 0, opts.eyeDy ?? 0],
        sweat: opts.sweat ?? 0.45,
        dreadWash: opts.dread ?? 1.0,
      });
    }
    ctx.restore();
  };

  // First-person POV survival & action hand poses built directly from the studio SVG anatomy of hands/reference-sheet.svg!
  window.drawPovSurvivalHand = (ctx, mode) => {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const svgPath = (d, fill, stroke = ink, width = 2.4) => {
      const p = new Path2D(d);
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill(p);
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.stroke(p);
      }
    };

    const drawSvgCuff = (tx, ty, rotDeg, sx = 1, sy = 1) => {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(rotDeg * Math.PI / 180);
      ctx.scale(sx, sy);
      svgPath('M-23 -2 Q0 2 25 -3 C26 17 32 33 39 56 L-41 56 C-35 38 -27 15 -23 -2Z', '#e8e1cc', ink, 2.4);
      svgPath('M-22 2 L-12 6 L-21 56 L-39 56 Q-27 25 -22 2Z', '#bab49f', null);
      svgPath('M-24 -3 Q1 0 25 -4 L28 13 Q2 19 -28 13Z', '#ede5d0', ink, 2.4);
      svgPath('M-25 9 Q2 14 25 8', null, '#a49c86', 1.2);
      oval(ctx, 19, 7, 2.5, 2.5, '#c6bda8', '#8a8575');
      ctx.restore();
    };

    // Exact #bar-hold cylindrical wrap hand from hands/reference-sheet.svg, oriented cleanly for bottom-right POV!
    const drawCylinderGripHand = (drawPropFn, rotDeg, cx = 176, cy = 216, sc = 1.10) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotDeg * Math.PI / 180);
      ctx.scale(sc, sc);
      ctx.translate(-126, -124);
      // Opposing thumb hooking cleanly behind the shaft
      svgPath('M100 105 Q90 108 85 119 Q79 130 82 143 Q82 151 88 155 Q93 159 100 155 Q104 153 104 148 Q104 144 98 143 L95 143 Q92 137 97 132 L111 119Z', '#c88e72', ink, 2.4);
      // Cylindrical prop passing right through the gripped hand!
      drawPropFn();
      // Main dorsal palm + 4 anatomically tapered fingers wrapping cleanly around the shaft
      svgPath('M99 61 Q102 72 96 83 Q90 95 91 109 Q91 118 95 123 Q97 130 98 147 Q98 158 101 162 Q106 168 112 162 Q115 159 115 151 L114 128 Q117 137 118 153 Q119 166 124 168 Q131 171 135 165 Q137 161 135 153 L132 128 Q136 136 139 153 Q141 163 146 163 Q154 163 155 156 Q156 151 152 142 L149 125 Q154 132 157 144 Q160 153 166 153 Q173 152 172 145 Q170 132 164 112 Q161 100 154 94 Q143 81 139 61Z', '#e7ae87', ink, 2.4);
      // Core ulnar shadow & warm radial highlight
      svgPath('M139 63 Q143 80 154 94 Q161 100 164 112 L172 145 Q173 152 166 152 Q160 153 157 144 L150 123 Q156 117 154 110 Q148 99 140 93 Q130 82 130 63Z', '#c88e72', null);
      svgPath('M98 106 Q98 88 106 79 Q117 77 133 87 Q143 94 146 104 Q133 102 124 105 Q110 106 98 106Z', '#f3c39d', null);
      // Knuckle & joint creases
      svgPath('M98 114 Q104 109 110 113 M117 116 Q123 110 129 114 M136 115 Q142 109 146 112 M153 117 L160 115 M101 136 Q106 133 111 135 M121 140 Q126 136 131 139 M140 138 L148 136 M158 136 L166 133 M101 154 Q107 151 112 154 M122 158 Q127 154 133 157 M143 153 Q147 150 153 151', null, '#9e6755', 1.6);
      drawSvgCuff(118, 66, 180, 0.83, 0.82);
      ctx.restore();
    };

    if (mode === 'pov-pipe-grip') {
      // Bottom-right POV survival steel pipe grip using exact #bar-hold finger anatomy!
      drawCylinderGripHand(() => {
        // Steel pipe running along y=111..138 extending cleanly far out to the right (which rotates to upper-left!)
        svgPath('M-64 111 H208 V138 H-64Z', '#6d7b85', ink, 2.4);
        svgPath('M-64 111 H208 V119 H-64Z', '#9eb0bc', ink, 1.5);
        svgPath('M-64 132 H208 V138 H-64Z', '#4d5963', null);
        // Threaded pipe coupling collar near striking end
        svgPath('M-44 106 H-22 V143 H-44Z', '#56636d', ink, 2.2);
        // Dark cloth grip tape under fingers
        svgPath('M82 110 H176 V139 H82Z', '#3b3936', ink, 1.8);
      }, 148);
    } else if (mode === 'pov-flashlight') {
      // Bottom-right POV tactical flashlight hold using exact #bar-hold finger anatomy!
      drawCylinderGripHand(() => {
        // Warm flashlight light cone fanning ahead from lens (x < -12)
        const beam = ctx.createLinearGradient(-12, 124, -120, 124);
        beam.addColorStop(0, 'rgba(255, 240, 178, 0.62)');
        beam.addColorStop(1, 'rgba(255, 240, 178, 0)');
        ctx.fillStyle = beam;
        path(ctx, [M(-16, 102), L(-118, 52), L(-118, 196), L(-16, 146)], beam, null);
        // Tactical flashlight barrel + flared bezel + glowing lens
        svgPath('M12 110 H196 Q204 110 204 124 Q204 138 196 138 H12Z', '#46535d', ink, 2.4);
        svgPath('M14 111 H192 V118 H14Z', '#72828e', null);
        svgPath('M-16 101 L14 108 V140 L-16 147Z', '#323c44', ink, 2.4);
        svgPath('M-22 103 Q-14 124 -22 145 L-14 146 V102Z', '#fbe9aa', ink, 1.8);
        // Recessed tactical side button
        oval(ctx, 56, 124, 9, 6, '#232a30', ink);
      }, 146);
    } else if (mode === 'pov-door-lock') {
      // Exact #ticket-pinch right hand from hands/reference-sheet.svg pinching and turning a metallic deadbolt latch!
      ctx.save();
      ctx.translate(170, 178);
      ctx.scale(1.32, 1.32);
      ctx.translate(-122, -124);
      // Deadbolt escutcheon plate behind latch
      oval(ctx, 168, 98, 44, 44, '#7d868c', ink);
      oval(ctx, 168, 98, 34, 34, '#9aa3a8', ink);
      // Far fingers curled cleanly below
      svgPath('M91 147 Q101 147 111 140 C117 146 113 158 105 162 Q97 166 88 161Z', '#c78c73', ink, 1.7);
      svgPath('M108 126 Q116 117 125 121 Q127 131 126 140 L121 153 Q117 160 111 157 Q106 155 107 148 L110 136Z', '#ce9479', ink, 1.7);
      svgPath('M120 108 Q133 102 142 110 Q147 116 145 125 L143 145 Q142 153 137 154 Q131 153 130 148 L129 131 Q126 126 119 126Z', '#dba382', ink, 1.8);
      // Dorsal hand & arched index finger gripping upper side of deadbolt latch
      svgPath('M40 165 Q61 148 72 132 L84 116 C90 106 96 101 106 100 L126 96 Q135 94 140 97 Q146 101 143 107 L130 118 Q123 124 113 129 Q110 144 102 155 C95 169 79 176 58 184Z', '#e7ae87', ink, 2.4);
      svgPath('M41 165 Q61 148 72 132 Q82 119 87 113 Q93 107 101 105 Q90 117 85 132 Q76 149 64 157 L50 173Z', '#c88e72', null);
      svgPath('M100 106 Q98 110 100 114 M119 99 Q116 102 118 106 M134 134 L140 134 M111 146 L117 148', null, '#9e6755', 1.6);
      // Metallic deadbolt thumb-turn lever sandwiched cleanly between index & thumb!
      ctx.save();
      ctx.translate(168, 98);
      ctx.rotate(-16 * Math.PI / 180);
      path(ctx, [M(-32, -9), L(32, -9), Q(40, 0, 32, 9), L(-32, 9), Q(-40, 0, -32, -9)], '#d2d9dd', ink, 2.1);
      path(ctx, [M(-26, -4), L(26, -4)], null, '#eef3f5', 2.0);
      ctx.restore();
      // Opposing thumb pinching near side of deadbolt latch + nail & creases
      svgPath('M87 144 Q97 138 108 127 L123 112 Q129 105 134 103 Q142 99 146 105 Q150 110 145 116 L133 128 L118 144 Q111 154 100 159', '#e7ae87', ink, 2.0);
      svgPath('M99 155 Q108 148 116 138 L138 115 Q144 110 146 108 Q148 113 143 117 L130 130 L117 144 Q108 155 101 157Z', '#c88e72', null);
      svgPath('M134 106 Q139 103 143 106 Q145 109 142 112 L137 116 Q133 115 131 111Z', '#f1c2a8', '#b98573', 0.85);
      svgPath('M119 120 Q120 124 124 126 M114 124 Q116 128 119 130 M93 145 Q96 147 97 151', null, '#9e6755', 1.6);
      drawSvgCuff(50, 174, 42, 0.64, 1.0);
      ctx.restore();
    } else {
      // Exact #palm right hand from hands/reference-sheet.svg raised defensively at an urgent angle!
      ctx.save();
      ctx.translate(182, 184);
      ctx.rotate(-14 * Math.PI / 180);
      ctx.scale(1.26, 1.26);
      ctx.translate(-120, -124);
      // Mirror horizontally like #palm so thumb sits on inner-right side for right-hand open palm facing forward
      ctx.save();
      ctx.translate(24, 0);
      ctx.scale(0.84, 1);
      ctx.translate(240, 0);
      ctx.scale(-1, 1);
      svgPath('M98 169 C99 153 95 144 88 133 L68 108 C61 99 66 91 73 94 Q80 95 87 106 L97 114 L96 57 C96 48 106 47 109 55 L114 91 L115 40 C115 30 128 29 130 40 L133 90 L137 48 C138 39 150 40 151 50 L151 96 L158 66 C160 57 171 60 171 69 L166 116 Q165 136 151 151 Q145 157 145 168Z', '#e7ae87', ink, 2.4);
      svgPath('M98 117 Q116 113 124 133 Q122 151 106 153 Q102 137 98 117Z', '#f3c39d', null);
      svgPath('M160 115 Q155 142 143 151 L142 166 L132 166 Q140 149 143 134Z', '#c88e72', null);
      svgPath('M101 116 Q119 123 117 146 M106 108 Q127 103 151 107 M119 118 Q137 112 149 115 M116 157 Q127 159 138 156 M102 77 L108 77 M121 65 L127 65 M142 73 L148 73 M160 86 L166 87', null, '#9e6755', 1.6);
      drawSvgCuff(120, 165, 0, 1, 1);
      ctx.restore();
      // Crisp defensive snap-raise motion arcs flanking the fingertips
      path(ctx, [M(62, 46), Q(52, 68, 56, 92), M(184, 52), Q(194, 74, 188, 98)], null, 'rgba(37,58,59,0.34)', 2.0);
      ctx.restore();
    }
    ctx.restore();
  };

  // Animated Cinematic Face, Gaze & Crash-Zoom Video Reference Frame Generator (1080x1920 @ 24fps)
  window.drawCinematicFaceReelFrame = (ctx, w, h, sceneId, t, dur) => {
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const smooth = v => { const c = clamp(v); return c * c * (3 - 2 * c); };
    ctx.save();
    // Warm parchment studio gradient backdrop matching dynamic-movements-reel.mp4
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#f9efd9');
    bg.addColorStop(1, '#e8d7b6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (sceneId === 'eye-dart') {
      // 0..0.65s calm neutral -> 0.65..0.85s SNAPPY eye-dart sideways -> 1.0..2.2s sweat bead pops & slides!
      const dart = smooth((t - 0.62) / 0.16) * 4.2;
      const sweat = t > 0.92 ? smooth((t - 0.92) / 1.15) : 0;
      const zoom = 1 + 0.05 * smooth((t - 0.62) / 1.4);
      const expr = t > 0.72 ? 'head-notice' : 'head';
      drawFaceAngle(ctx, w / 2, h * 0.52, 3.05 * zoom, 'eye-dart', { expression: expr, dart, sweat });
    } else if (sceneId === 'head-tilt') {
      // Slow creeping horror push-in (1.0 -> 1.18x) while head tilts eerily 0 -> 12 deg and dread wash deepens!
      const p = smooth((t - 0.45) / 1.85);
      const zoom = 1 + 0.18 * smooth(t / dur);
      drawFaceAngle(ctx, w / 2, h * 0.52, 3.0 * zoom, 'head-tilt', {
        expression: p > 0.6 ? 'head-dread' : 'head-notice',
        tilt: 12 * p,
        dart: -1.6 * p,
        dread: 0.75 * p,
      });
    } else if (sceneId === 'look-up') {
      // Level gaze -> sharp tilt upward looking at looming ceiling threat + shock gasp!
      const p = smooth((t - 0.45) / 0.55);
      const zoom = 1 + 0.08 * p;
      drawFaceAngle(ctx, w / 2, h * 0.52 + 24 * p, 3.05 * zoom, 'look-up', {
        expression: t > 0.72 ? 'head-alarm' : 'head-notice',
        pitch: -0.95 * p,
        eyeDy: -1.8 * p,
      });
    } else if (sceneId === 'look-down') {
      // Level gaze -> bows head down toward floor clue / prop in hand + gentle push-in!
      const p = smooth((t - 0.45) / 0.65);
      const zoom = 1 + 0.10 * smooth(t / dur);
      drawFaceAngle(ctx, w / 2, h * 0.52 - 16 * p, 3.05 * zoom, 'look-down', {
        expression: t > 1.15 ? 'head-notice' : 'head',
        pitch: 0.95 * p,
        eyeDy: 1.6 * p,
      });
    } else if (sceneId === 'glance-back') {
      // Side profile looking right -> snappy startled turn glancing back left over shoulder (bust framing to bottom edge!)
      const snap = t > 0.80;
      const jolt = snap && t < 0.96 ? Math.sin((t - 0.80) * 90) * 10 * (1 - (t - 0.80) / 0.16) : 0;
      const zoom = snap ? 1.12 + 0.05 * smooth((t - 0.80) / 1.4) : 1.0;
      drawFaceAngle(ctx, w / 2 + jolt, h * 0.61, 4.35 * zoom, 'glance-back', {
        flip: snap,
        expression: snap ? 'head-alarm' : 'head-notice',
        headAngle: snap ? -6 : 2,
      });
    } else {
      // Off-Center ECU Crash-Zoom Dread: tight portrait (0..0.72s) -> SNAPPY 5-frame crash-zoom off-center onto left eye -> creeping dread!
      const crash = smooth((t - 0.72) / 0.22);
      const creep = smooth((t - 0.94) / 2.0);
      const zoom = 2.45 + 5.8 * crash + 0.65 * creep;
      const panX = -124 * crash - 14 * creep;
      const panY = 26 * crash;
      const shake = t > 0.72 && t < 1.05 ? Math.sin(t * 140) * 6 * (1 - (t - 0.72) / 0.33) : Math.sin(t * 24) * 1.2 * crash;
      const sweat = 0.2 + 0.8 * smooth((t - 0.85) / 1.8);
      drawFaceAngle(ctx, w / 2 + shake, h * 0.50, 2.5, 'ecu-dread', {
        expression: 'head-dread',
        zoom,
        panX,
        panY,
        sweat,
        dread: 0.65 + 0.35 * crash,
      });
    }
    ctx.restore();
  };

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
