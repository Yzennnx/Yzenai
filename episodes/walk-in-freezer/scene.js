(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  const W = 540, H = 960;
  const ink = '#13242b';
  const frostLight = '#dcf1fa';
  const frostMid = '#9bc6d9';
  const glowGreen = '#7cf28c';

  const clamp = (n) => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const tween = (frame, start, end) => {
    const t = clamp((frame - start) / (end - start));
    return t * t * (3 - 2 * t);
  };

  const rect = (color, x, y, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const shape = (d, fill, stroke = null, width = 2.2) => {
    const p = new Path2D(d);
    if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke(p);
    }
  };
  const oval = (x, y, rx, ry, fill, stroke = null, width = 2) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  };
  const label = (text, x, y, size, color = '#e9f6fc', align = 'center') => {
    ctx.font = `bold ${size}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  };

  // Textured paper/cold grain overlay
  const grain = document.createElement('canvas');
  grain.width = W;
  grain.height = H;
  const gctx = grain.getContext('2d');
  let seed = 109;
  const rand = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 20000; i++) {
    gctx.fillStyle = i % 3 ? '#d8f1ff11' : '#0812182c';
    gctx.fillRect(rand() * W, rand() * H, 0.7 + rand() * 2.4, 0.6 + rand() * 0.9);
  }

  // Exact cream shirt cuff matching assets/series-lead/hands/reference-sheet.svg
  function drawCuff(frostAmt = 0) {
    shape('M-23 -2 Q0 2 25 -3 C26 17 32 33 39 56 L-41 56 C-35 38 -27 15 -23 -2Z', '#e8e1cc', '#253a3b', 2.4);
    shape('M-22 2 L-12 6 L-21 56 L-39 56 Q-27 25 -22 2Z', '#bab49f');
    shape('M-24 -3 Q1 0 25 -4 L28 13 Q2 19 -28 13Z', '#ede5d0', '#253a3b', 2.4);
    shape('M-25 9 Q2 14 25 8', null, '#a49c86', 1.2);
    oval(19, 7, 2.5, 2.5, '#c6bda8', '#8a8575', 0.8);
    if (frostAmt > 0.05) {
      ctx.save();
      ctx.globalAlpha = frostAmt * 0.65;
      shape('M-24 -2 Q0 2 24 -3 L26 4 Q0 9 -26 4Z', '#dcf1fa');
      ctx.restore();
    }
  }

  function atJoint(joint, dx, dy) {
    const a = (joint[2] ?? 0) * Math.PI / 180;
    return [joint[0] + dx * Math.cos(a) - dy * Math.sin(a),
      joint[1] + dx * Math.sin(a) + dy * Math.cos(a)];
  }

  function softPuff(x, y, r, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(220, 242, 255, 0)');
    oval(x, y, r, r * 0.72, g);
    ctx.restore();
  }

  function drawBreath(x, y, frame, intensity = 1) {
    const cycle = (frame % 36) / 36;
    if (cycle > 0.84) return;
    const t = cycle / 0.84;
    const alpha = Math.sin(Math.PI * t) * 0.62 * intensity;
    for (let i = 0; i < 4; i++) {
      const drift = t * (28 + i * 12);
      const lift = -t * (10 + i * 5) + Math.sin(frame * 0.16 + i) * 2;
      softPuff(x + drift, y + lift, 11 + t * 18 + i * 4, 'rgba(225, 245, 255, 0.92)', alpha);
    }
  }

  function drawFreezerRoom(frame, opts = {}) {
    const { doorOpen = 0, frostLevel = 0.25, flickerDim = 0, plungerGlow = 0.22, handprint = false } = opts;

    // Cold steel wall gradient
    const bg = ctx.createLinearGradient(0, 60, 0, 760);
    bg.addColorStop(0, '#13222b');
    bg.addColorStop(0.45, '#2b4452');
    bg.addColorStop(1, '#1d323d');
    rect(bg, 0, 0, W, H);

    // Insulated stainless panel seams
    for (let x = 28; x < 410; x += 92) {
      rect('#0d1a2266', x, 140, 2, 616);
      rect('#9bc6d922', x + 2, 140, 2, 616);
    }
    for (let y = 260; y < 740; y += 160) {
      rect('#0d1a2244', 0, y, 415, 2);
    }

    // Overhead evaporator fan box & louvers
    rect('#1a2d37', 134, 152, 224, 68);
    rect('#395666', 140, 158, 212, 56);
    for (let y = 166; y < 208; y += 9) rect('#14242c', 150, y, 134, 4);
    // Spinning fan vents right side of evaporator
    oval(322, 186, 20, 20, '#162730', '#7ca1b2', 2);
    const fanSpin = frame * (flickerDim > 0.3 ? 0.08 : 0.45);
    ctx.save();
    ctx.translate(322, 186);
    ctx.rotate(fanSpin);
    for (let a = 0; a < 3; a++) {
      ctx.rotate((Math.PI * 2) / 3);
      rect('#4c7082', -3, -15, 6, 15);
    }
    ctx.restore();

    // Digital -20°C temperature readout panel
    rect('#101d24', 202, 240, 108, 42);
    rect('#1d303a', 206, 244, 100, 34);
    label('-20°C', 256, 269, 24, '#7be0ff');

    // Overhead caged fluorescent tube & cold light cone
    const lampAlpha = Math.max(0.18, 1 - flickerDim * 0.72);
    rect('#223640', 174, 106, 168, 14);
    rect(`rgba(218, 244, 255, ${lampAlpha})`, 186, 117, 144, 7);
    ctx.save();
    ctx.globalAlpha = 0.14 * lampAlpha;
    shape('M182 124 L334 124 440 756 76 756Z', '#cdeeff');
    ctx.restore();

    // Left metal shelving with frosted boxes
    rect('#1d313b', 16, 308, 128, 448);
    rect('#324d5c', 22, 314, 10, 442);
    rect('#324d5c', 128, 314, 10, 442);
    for (const sy of [340, 456, 572, 686]) {
      rect('#496a7a', 18, sy, 124, 10);
      rect('#b4d9e8', 20, sy, 120, 3);
    }
    // Frosted boxes on shelves
    rect('#587687', 34, 376, 84, 80);
    rect('#7597a8', 38, 380, 76, 18);
    rect('#4b6675', 36, 496, 80, 76);
    rect('#6d8c9e', 40, 500, 72, 16);
    rect('#506d7d', 34, 610, 86, 76);
    // Icicles / frost rim along shelves
    if (frostLevel > 0.15) {
      ctx.save();
      ctx.globalAlpha = clamp(frostLevel);
      for (let x = 26; x < 132; x += 18) {
        shape(`M${x} 350 L${x + 6} 350 ${x + 3} ${350 + 8 + (x % 7)}Z`, frostLight);
        shape(`M${x} 466 L${x + 5} 466 ${x + 2} ${466 + 6 + (x % 5)}Z`, frostLight);
      }
      ctx.restore();
    }

    // Floor: frosted diamond-plate steel
    rect('#1a2b34', 0, 744, W, 12);
    const fl = ctx.createLinearGradient(0, 756, 0, H);
    fl.addColorStop(0, '#415b69');
    fl.addColorStop(1, '#263944');
    rect(fl, 0, 756, W, H - 756);
    for (let y = 776; y < H; y += (y - 700) * 0.22) rect('#17283055', 0, y, W, 2);
    for (let x = -60; x <= W + 60; x += 62) {
      shape(`M${x} 756 L${x + 2} 756 ${270 + (x - 270) * 1.9} 960 ${268 + (x - 270) * 1.9} 960Z`, '#1728304a');
    }

    // Foreground metal supply crate beside door wall (y=556 top surface for brace contact!)
    rect('#14242c', 330, 556, 76, 198);
    rect('#3a5564', 335, 562, 66, 188);
    rect('#58798a', 335, 562, 66, 14);
    rect('#c7e4f0', 333, 556, 70, 5); // frosted metal rim at y=556!
    for (let y = 594; y < 740; y += 34) rect('#263d48', 340, y, 56, 4);

    // Right wall: heavy insulated freezer door & doorway
    const doorX = 414;
    rect('#101d24', doorX - 8, 308, 124, 448); // thick rubber gasket frame

    // Warm amber hallway revealed behind open door!
    if (doorOpen > 0.01) {
      const hall = ctx.createLinearGradient(doorX, 316, W, 756);
      hall.addColorStop(0, '#ffdfa0');
      hall.addColorStop(0.6, '#efb663');
      hall.addColorStop(1, '#c88743');
      rect(hall, doorX, 316, 118, 440);
      // Warm light spill flooding across the blue freezer floor and wall!
      ctx.save();
      ctx.globalAlpha = clamp(doorOpen) * 0.52;
      const spill = ctx.createLinearGradient(doorX + 20, 420, 60, 760);
      spill.addColorStop(0, '#ffe19e');
      spill.addColorStop(0.55, '#f2b76688');
      spill.addColorStop(1, '#f2b76600');
      shape(`M${doorX} 316 L${doorX} 756 40 960 40 520Z`, spill);
      ctx.restore();
    } else {
      rect('#0c171d', doorX, 316, 118, 440);
    }

    // Swinging insulated stainless door panel
    const closedW = 114 * (1 - doorOpen * 0.88);
    if (closedW > 8) {
      const swingSkew = doorOpen * 32;
      shape(`M${doorX + 114} 316 L${doorX + 114 - closedW} ${316 + swingSkew} ${doorX + 114 - closedW} ${754 - swingSkew * 0.6} ${doorX + 114} 756Z`, '#5c7886', ink, 2.4);
      // Door inner highlight & frost band
      shape(`M${doorX + 110} 324 L${doorX + 110 - closedW * 0.85} ${324 + swingSkew * 0.85} ${doorX + 110 - closedW * 0.85} ${400 + swingSkew * 0.6} ${doorX + 110} 400Z`, '#7c9aa8');
      // Horizontal frosted aluminum push bar (at y=472..490, matching hand reach!)
      const barLeft = doorX + 114 - closedW * 0.92;
      const barW = closedW * 0.82;
      rect('#223540', barLeft, 472, barW, 20);
      rect('#bfd6e0', barLeft + 3, 474, Math.max(2, barW - 6), 13);
      rect('#eef8fc', barLeft + 3, 474, Math.max(2, barW - 6), 4);
      if (handprint && barW > 20) {
        // Frosted palm print left behind on the aluminum bar!
        oval(barLeft + barW * 0.45, 480, Math.min(10, barW * 0.16), 6, '#e8f7ff');
      }
    }

    // Recessed phosphorescent green safety release plunger beside the door frame (x=396, y=496)
    rect('#15242b', 388, 476, 22, 46);
    rect('#2a424d', 391, 479, 16, 40);
    if (plungerGlow > 0.35) {
      ctx.save();
      const radGlow = ctx.createRadialGradient(399, 499, 2, 399, 499, 42 * plungerGlow);
      radGlow.addColorStop(0, `rgba(140, 255, 156, ${0.85 * plungerGlow})`);
      radGlow.addColorStop(0.5, `rgba(92, 232, 120, ${0.35 * plungerGlow})`);
      radGlow.addColorStop(1, 'rgba(92, 232, 120, 0)');
      oval(399, 499, 44 * plungerGlow, 44 * plungerGlow, radGlow);
      ctx.restore();
    }
    oval(399, 499, 6.5, 6.5, plungerGlow > 0.35 ? '#8eff9e' : '#4a7a5c', ink, 1.5);

    // Cold frost mist drifting across floor & edges
    if (frostLevel > 0.2) {
      ctx.save();
      ctx.globalAlpha = 0.18 * frostLevel;
      const drift = (frame * 0.9) % 140;
      for (let i = 0; i < 5; i++) {
        oval(((i * 130 + drift) % (W + 120)) - 60, 748 + (i % 2) * 18, 95, 22, '#cce8f5');
      }
      ctx.restore();
    }

    // Dim overlay during light flicker
    if (flickerDim > 0.01) {
      rect(`rgba(7, 15, 22, ${flickerDim * 0.56})`, 0, 0, W, H);
      // Re-draw plunger glow brightly on top of the dim overlay so the eye snaps right to it!
      if (plungerGlow > 0.4) {
        const g = ctx.createRadialGradient(399, 499, 2, 399, 499, 54);
        g.addColorStop(0, 'rgba(154, 255, 168, 0.92)');
        g.addColorStop(0.45, 'rgba(95, 238, 125, 0.38)');
        g.addColorStop(1, 'rgba(95, 238, 125, 0)');
        oval(399, 499, 54, 54, g);
        oval(399, 499, 7, 7, '#baffbe', '#1c4026', 1.4);
      }
    }

    // Progressive frost vignette on screen edges
    if (frostLevel > 0.3) {
      ctx.save();
      ctx.globalAlpha = (frostLevel - 0.25) * 0.55;
      const iceEdge = ctx.createRadialGradient(270, 480, 190, 270, 480, 520);
      iceEdge.addColorStop(0, 'rgba(205, 238, 252, 0)');
      iceEdge.addColorStop(1, 'rgba(182, 228, 248, 0.72)');
      rect(iceEdge, 0, 0, W, H);
      ctx.restore();
    }

    ctx.drawImage(grain, 0, 0);
  }

  // Shot 2 (f84..191): First-person POV aluminum bar stick -> yank -> palm-up raw red stripe
  function drawPovBar(frame) {
    // Backdrop: close-up frosted stainless freezer door
    const doorGrad = ctx.createLinearGradient(0, 0, W, H);
    doorGrad.addColorStop(0, '#446270');
    doorGrad.addColorStop(0.55, '#628190');
    doorGrad.addColorStop(1, '#2b434f');
    rect(doorGrad, 0, 0, W, H);
    // Vertical brushed steel streaks & frost patches
    for (let x = 20; x < W; x += 28) rect('#d4eef911', x, 0, 4, H);
    for (let i = 0; i < 6; i++) oval(80 + i * 85, 240 + (i % 3) * 180, 95, 65, '#d7eef712');

    // Horizontal frosted aluminum push bar across y=445..505
    rect('#1a2c35', 22, 434, W - 44, 78);
    rect('#2b414c', 36, 444, W - 72, 58);
    rect('#8ea9b7', 42, 452, W - 84, 44);
    rect('#c9e0ea', 42, 452, W - 84, 30);
    rect('#eef9fd', 42, 452, W - 84, 7);
    // Frost crystals rimming the aluminum bar
    for (let x = 52; x < W - 56; x += 22) {
      oval(x, 453 + (x % 3), 9, 4, '#eefaffaa');
    }

    if (frame < 162) {
      const reach = tween(frame, 84, 98);
      const freeze = tween(frame, 98, 122);
      const strain = frame >= 122 && frame < 139 ? tween(frame, 122, 138) : 0;
      const shake = frame >= 122 && frame < 139 ? Math.sin(frame * 2.8) * 3.5 : 0;
      const yank = tween(frame, 139, 158);

      // Ice bond crystals radiating from under palm/bar interface at contact
      if (frame >= 98) {
        const iceA = frame < 139 ? freeze : Math.max(0.28, 1 - yank * 0.72);
        ctx.save();
        ctx.globalAlpha = iceA * 0.94;
        const ig = ctx.createRadialGradient(274, 472, 16, 274, 472, 108 * (0.45 + 0.55 * freeze));
        ig.addColorStop(0, 'rgba(235, 251, 255, 0.95)');
        ig.addColorStop(0.55, 'rgba(174, 226, 246, 0.52)');
        ig.addColorStop(1, 'rgba(174, 226, 246, 0)');
        oval(274, 472, 108 * (0.45 + 0.55 * freeze), 36 * (0.5 + 0.5 * freeze), ig);
        for (let i = 0; i < 14; i++) {
          const ang = (i / 14) * Math.PI * 2;
          const rx = 56 + 44 * freeze + (i % 3) * 8;
          const ry = 20 + 16 * freeze;
          const cx = 274 + Math.cos(ang) * rx;
          const cy = 472 + Math.sin(ang) * ry;
          shape(`M${cx} ${cy - 8} L${cx + 5} ${cy} ${cx} ${cy + 8} ${cx - 5} ${cy}Z`, '#ffffff', '#7dbbd6', 1.1);
        }
        ctx.restore();
      }

      // Draw hand using updated sleek tapered reference-sheet.svg bar-reach / back-of-hand geometry!
      ctx.save();
      if (frame < 96) {
        // Updated sleek curled approach below the frosted bar (matches fixed reference-sheet.svg #bar-reach!)
        const yOff = mix(205, 52, reach);
        ctx.translate(274, 545 + yOff);
        ctx.scale(2.45, 2.45);
        ctx.translate(-119, -135);
        shape('M101 169 Q100 156 93 145 L75 123 Q70 116 75 111 Q80 108 86 114 L96 125 Q98 126 99 123 L98 106 Q98 96 105 95 Q111 94 112 104 L113 119 L114 98 Q114 89 121 89 Q128 89 128 99 L128 119 L131 102 Q132 93 139 94 Q145 95 144 105 L142 123 L147 112 Q149 105 155 107 Q160 110 158 120 L152 141 Q148 154 139 161 L138 169Z', '#e7ae87', '#253a3b', 2.2);
        shape('M156 117 L151 141 Q147 154 138 161 L137 168 H129 Q132 156 139 146 Q146 135 148 120Z', '#c88e72');
        shape('M104 128 Q116 120 133 124 L138 139 Q124 150 109 149Z', '#f3c39d');
        shape('M100 106 Q105 103 110 105 M116 101 Q121 98 126 101 M133 105 Q138 102 142 105 M148 116 Q152 113 156 116 M103 123 Q107 121 111 122 M118 121 Q122 119 126 121 M133 123 Q137 121 140 123 M96 131 Q101 137 103 145', null, '#9e6755', 1.45);
        ctx.save();
        ctx.translate(119, 167);
        ctx.scale(0.84, 0.88);
        drawCuff(0.18);
        ctx.restore();
      } else {
        // Palm flat on bar (bar-press), sticking/straining, then yanked sharply downward!
        const pullY = strain * 16 + yank * 290;
        ctx.translate(274 + shake, 494 + pullY);
        ctx.scale(2.1, 2.42);
        ctx.translate(-122, -108);
        shape('M98 169 C99 153 95 144 88 133 L68 108 C61 99 66 91 73 94 Q80 95 87 106 L97 114 L96 57 C96 48 106 47 109 55 L114 91 L115 40 C115 30 128 29 130 40 L133 90 L137 48 C138 39 150 40 151 50 L151 96 L158 66 C160 57 171 60 171 69 L166 116 Q165 136 151 151 Q145 157 145 168Z', '#e7ae87', '#253a3b', 2.4);
        shape('M169 77 L164 116 Q164 137 151 149 Q143 159 143 167 L134 167 Q136 156 145 144 Q155 130 156 117Z', '#c88e72');
        shape('M108 104 Q119 93 135 102 L142 118 Q127 133 112 133Z', '#f3c39d');
        shape('M99 118 Q104 125 106 132 M113 108 Q118 105 123 106 M130 107 Q135 105 139 108 M145 111 L151 109 M103 80 L108 79 M120 69 L127 69 M140 76 L148 76 M158 91 L165 92', null, '#9e6755', 1.6);
        // Fingernails
        for (const [nx, ny] of [[99, 55], [119, 38], [141, 47], [162, 66], [67, 99]]) {
          shape(`M${nx} ${ny} Q${nx + 3} ${ny - 3} ${nx + 6} ${ny} L${nx + 6} ${ny + 6} Q${nx + 3} ${ny + 8} ${nx} ${ny + 6}Z`, '#f1c2a8', '#b98573', 0.85);
        }
        // Subtle chilled pale rim on fingertips & bar-edge frost glint (no floating oval over knuckles!)
        if (freeze > 0.1) {
          ctx.save();
          ctx.globalAlpha = freeze * 0.55;
          for (const [fx, fy] of [[102, 56], [122, 41], [144, 50], [164, 68], [70, 99]]) {
            oval(fx, fy, 4.5, 6, '#e2f6ff');
          }
          ctx.restore();
        }
        ctx.save();
        ctx.translate(120, 165);
        drawCuff(freeze * 0.3);
        ctx.restore();
      }
      ctx.restore();
    } else {
      // f162..191: Flip to Palm-up reveal showing organic raw frost-abraded skin across center of palm!
      const rise = tween(frame, 162, 174);
      // Frozen white palm print left behind on bar, pushed back into soft dark depth
      ctx.save();
      ctx.globalAlpha = 0.75;
      oval(276, 472, 54, 15, '#eef9ff');
      ctx.restore();
      rect('rgba(10, 21, 29, 0.64)', 0, 0, W, H);

      ctx.save();
      ctx.translate(274, mix(705, 560, rise));
      ctx.rotate(mix(0.14, -0.05, rise));
      ctx.scale(2.2, 2.52);
      ctx.translate(-120, -110);
      // Mirror horizontally for right-hand palm (exact reference-sheet.svg #palm!)
      ctx.translate(240, 0);
      ctx.scale(-1, 1);
      shape('M98 169 C99 153 95 144 88 133 L68 108 C61 99 66 91 73 94 Q80 95 87 106 L97 114 L96 57 C96 48 106 47 109 55 L114 91 L115 40 C115 30 128 29 130 40 L133 90 L137 48 C138 39 150 40 151 50 L151 96 L158 66 C160 57 171 60 171 69 L166 116 Q165 136 151 151 Q145 157 145 168Z', '#e7ae87', '#253a3b', 2.4);
      shape('M98 117 Q116 113 124 133 Q122 151 106 153 Q102 137 98 117Z', '#f3c39d');
      shape('M160 115 Q155 142 143 151 L142 166 L132 166 Q140 149 143 134Z', '#c88e72');
      // Organic cold-torn raw red palm abrasion with pale frost-blanched rim (not a rigid box!)
      const woundG = ctx.createRadialGradient(128, 106, 6, 128, 106, 36);
      woundG.addColorStop(0, 'rgba(196, 46, 42, 0.92)');
      woundG.addColorStop(0.55, 'rgba(218, 76, 66, 0.72)');
      woundG.addColorStop(0.85, 'rgba(232, 130, 114, 0.35)');
      woundG.addColorStop(1, 'rgba(231, 174, 135, 0)');
      oval(128, 106, 33, 13, woundG);
      shape('M102 104 Q118 98 134 102 Q146 100 155 106 Q146 114 128 112 Q112 115 101 109Z', 'rgba(182, 38, 36, 0.72)');
      shape('M109 103 Q126 101 144 105', null, '#f2988d', 1.3);
      // Pale frosted fingertips
      for (const [fx, fy] of [[102, 56], [122, 41], [144, 50], [164, 68]]) {
        oval(fx, fy, 5, 7, '#dfeef588');
      }
      shape('M101 116 Q119 123 117 146 M106 108 Q127 103 151 107 M119 118 Q137 112 149 115 M116 157 Q127 159 138 156 M102 77 L108 77 M121 65 L127 65 M142 73 L148 73 M160 86 L166 87', null, '#8f473d', 1.5);
      ctx.save();
      ctx.translate(120, 165);
      drawCuff(0.35);
      ctx.restore();
      ctx.restore();
    }
    ctx.drawImage(grain, 0, 0);
  }

  // Shot 4 (f336..527) & Shot 6b (f876..983): Textured internal blood-vessel / core-heat cutaways
  function drawCutaway(frame, mode) {
    // mode === 'constrict' (f336..527) or 'dilate' (f876..983)
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0f1d26');
    bg.addColorStop(1, '#1c3240');
    rect(bg, 0, 0, W, H);

    // Subtle scientific grid
    for (let x = 30; x < W; x += 60) rect('#6ba5bd16', x, 0, 1, H);
    for (let y = 30; y < H; y += 60) rect('#6ba5bd16', 0, y, W, 1);

    const p = mode === 'constrict' ? tween(frame, 354, 498) : tween(frame, 900, 960);
    const pulse = 0.5 + 0.5 * Math.sin(frame * (mode === 'constrict' ? 0.35 : 0.22));

    // Top-right core temp telemetry pill (clear of top captions at y~208..330? Put below captions at y=342!)
    const temp = mode === 'constrict' ? mix(36.8, 34.8, p) : mix(32.1, 30.8, p);
    rect('#11212b', 330, 326, 178, 50);
    shape('M330 326 H508 V376 H330Z', null, mode === 'constrict' ? '#70c5e0' : '#ff7b5c', 2.2);
    label(`CORE ${temp.toFixed(1)}°C`, 419, 359, 21, mode === 'constrict' ? '#9de6ff' : '#ff9c78');

    // Upper-body human silhouette centered at (270, 560)
    ctx.save();
    ctx.translate(270, 540);
    // Head + neck + torso + outstretched arms
    const bodyD = 'M-28 -155 C-28 -195 28 -195 28 -155 C28 -130 16 -116 14 -106 L74 -92 C98 -86 112 -64 128 -20 L166 76 C171 88 155 96 147 84 L106 -12 L88 -42 L78 135 H-78 L-88 -42 L-106 -12 L-147 84 C-155 96 -171 88 -166 76 L-128 -20 C-112 -64 -98 -86 -74 -92 L-14 -106 C-16 -116 -28 -130 -28 -155Z';
    shape(bodyD, '#223a48', '#78acc2', 2.8);

    // Core heat radial glow
    const coreR = mode === 'constrict' ? mix(96, 62, p) : mix(56, 118, p);
    const cg = ctx.createRadialGradient(0, -10, 10, 0, -10, coreR);
    cg.addColorStop(0, mode === 'constrict' ? 'rgba(255, 114, 72, 0.92)' : 'rgba(255, 92, 66, 0.85)');
    cg.addColorStop(0.55, mode === 'constrict' ? 'rgba(235, 74, 56, 0.45)' : 'rgba(255, 115, 76, 0.55)');
    cg.addColorStop(1, 'rgba(235, 74, 56, 0)');
    oval(0, -10, coreR, coreR * 1.15, cg);

    // Cold blue soft frost creep along hands/arms (retreats slightly in fake-heat surge)
    const coldReach = mode === 'constrict' ? p : 1 - p * 0.72;
    for (const dir of [-1, 1]) {
      const hg = ctx.createRadialGradient(dir * 145, 58, 6, dir * 145, 58, 64);
      hg.addColorStop(0, `rgba(122, 213, 255, ${0.72 * coldReach})`);
      hg.addColorStop(1, 'rgba(122, 213, 255, 0)');
      oval(dir * 145, 58, 58, 72, hg);
    }

    // Arterial tree from heart down both arms
    const vesselW = mode === 'constrict' ? mix(7.5, 2.2, p) : mix(2.2, 8.8, p);
    const armColor = mode === 'constrict'
      ? `rgb(${Math.round(mix(235, 110, p))}, ${Math.round(mix(72, 165, p))}, ${Math.round(mix(66, 215, p))})`
      : `rgb(${Math.round(mix(110, 245, p))}, ${Math.round(mix(165, 78, p))}, ${Math.round(mix(215, 68, p))})`;

    ctx.strokeStyle = armColor;
    ctx.lineWidth = vesselW;
    ctx.lineCap = 'round';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.quadraticCurveTo(dir * 54, -76, dir * 102, -32);
      ctx.lineTo(dir * 150, 72);
      ctx.stroke();
    }
    // Pulsing heart icon
    const hs = 1 + pulse * 0.09;
    ctx.save();
    ctx.translate(6, -34);
    ctx.scale(hs, hs);
    shape('M0 24 C-22 10 -30 -10 -16 -22 C-6 -30 0 -18 0 -14 C0 -18 6 -30 16 -22 C30 -10 22 10 0 24Z', '#e84d45', '#ffd0c4', 1.8);
    ctx.restore();
    ctx.restore();

    // Magnified blood vessel cross-section inset cleanly clipped inside oval lens at y=775!
    oval(270, 775, 188, 92, '#13242e');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(270, 775, 186, 90, 0, 0, Math.PI * 2);
    ctx.clip();
    const lumenH = mode === 'constrict' ? mix(46, 12, p) : mix(12, 54, p);
    // Outer vessel muscle wall
    rect('#87373c', 80, 775 - 64, 380, 128);
    // Inner blood lumen narrowing or flying wide open!
    rect('#e34a42', 80, 775 - lumenH, 380, lumenH * 2);
    // Moving red blood cells inside lumen
    const speed = mode === 'constrict' ? mix(4.2, 1.4, p) : mix(1.4, 7.5, p);
    for (let i = 0; i < 9; i++) {
      const bx = 92 + ((i * 44 + frame * speed) % 356);
      const by = 775 + Math.sin(i * 2.1 + frame * 0.1) * Math.max(2, lumenH - 8);
      oval(bx, by, 10, Math.min(6, Math.max(3, lumenH * 0.45)), '#ff9482', '#9c2824', 1.2);
    }
    ctx.restore();
    oval(270, 775, 188, 92, null, '#88bfd6', 3.2);
    // Inward / outward arrows on vessel wall
    const arrowColor = mode === 'constrict' ? '#8ce0ff' : '#ffd44d';
    for (const ax of [190, 270, 350]) {
      if (mode === 'constrict') {
        shape(`M${ax} 702 V728 M${ax - 7} 720 L${ax} 730 ${ax + 7} 720`, null, arrowColor, 3);
        shape(`M${ax} 848 V822 M${ax - 7} 830 L${ax} 820 ${ax + 7} 830`, null, arrowColor, 3);
      } else {
        shape(`M${ax} 734 V706 M${ax - 7} 714 L${ax} 704 ${ax + 7} 714`, null, arrowColor, 3);
        shape(`M${ax} 816 V844 M${ax - 7} 836 L${ax} 846 ${ax + 7} 836`, null, arrowColor, 3);
      }
    }
    label(mode === 'constrict' ? 'VASOCONSTRICTION' : 'VASODILATION SURGE', 270, 898, 22, arrowColor);
    ctx.drawImage(grain, 0, 0);
  }

  // Shot 8 (f1200..1367): First-person POV — upgraded proportional pointing hand tries to press the
  // glowing green safety plunger, but moisture has FROZEN THE ROD SOLID! Two desperate pushes fail.
  function drawPovPlunger(frame) {
    const reach = tween(frame, 1200, 1244);
    // First strained push (f1244..1286), brief pullback (f1286..1298), desperate second jab (f1298..1330), weak drop (f1330..1367)
    const pushing1 = frame >= 1244 && frame < 1286;
    const pushing2 = frame >= 1298 && frame < 1332;
    const pullback = frame >= 1286 && frame < 1298 ? Math.sin(Math.PI * (frame - 1286) / 12) : 0;
    const drop = tween(frame, 1332, 1366);
    const strainShake = (pushing1 || pushing2) ? Math.sin(frame * 3.1) * 3.2 : 0;
    const chipFall = frame >= 1252 ? tween(frame, 1252, 1296) : 0;

    // Dim cold steel frame backdrop — door stays LOCKED SHUT (no warm light ever appears!)
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0f1c25');
    bg.addColorStop(1, '#1d313d');
    rect(bg, 0, 0, W, H);

    // Locked steel door seam encrusted with frost on far right
    rect('#091218', W - 26, 0, 8, H);
    for (let y = 80; y < H - 80; y += 64) {
      oval(W - 22, y, 7, 18, '#c5e6f540');
    }

    // Recessed industrial safety plunger housing on right (x=336..444, y=376..626)
    const housingX = 336;
    rect('#0e1a21', housingX - 8, 368, 124, 266);
    rect('#263c47', housingX, 376, 108, 250);
    shape(`M${housingX + 6} 384 H${housingX + 100} V618`, null, '#5a7887', 2.4);
    label('PUSH', housingX + 54, 424, 21, '#b9ffbe');
    label('TO EXIT', housingX + 54, 600, 17, '#9be0a6');

    // Phosphorescent green glow halo (cold & eerie)
    const px = housingX + 54;
    const py = 500;
    const halo = ctx.createRadialGradient(px, py, 10, px, py, 140);
    halo.addColorStop(0, 'rgba(148, 245, 162, 0.72)');
    halo.addColorStop(0.45, 'rgba(92, 224, 124, 0.28)');
    halo.addColorStop(1, 'rgba(92, 224, 124, 0)');
    oval(px, py, 140, 140, halo);

    // Plunger base ring & glowing dome — JAMMED SOLID (barely shudders 1px under pressure!)
    const budge = (pushing1 || pushing2) ? 1.5 : 0;
    oval(px, py, 44, 48, '#2b6138', ink, 3.2);
    oval(px + budge, py, 36, 40, '#78e688', '#1c4226', 2.8);
    oval(px - 8 + budge, py - 10, 11, 13, '#d7ffdc');

    // Thick blue-white ICE COLLAR sealing the plunger rod solid inside the housing!
    shape(`M${px - 44} ${py - 28} L${px - 22} ${py - 46} ${px + 12} ${py - 48} ${px + 44} ${py - 26} ${px + 38} ${py - 12} ${px + 14} ${py - 34} ${px - 18} ${py - 32} ${px - 36} ${py - 12}Z`, '#d8f2fc', '#7cb3cc', 1.8);
    shape(`M${px - 44} ${py + 22} L${px - 26} ${py + 46} ${px + 18} ${py + 48} ${px + 44} ${py + 26} ${px + 34} ${py + 12} ${px + 14} ${py + 35} ${px - 20} ${py + 34} ${px - 34} ${py + 14}Z`, '#c4e6f5', '#7cb3cc', 1.8);
    // Sharp ice spikes locking the rim
    for (const [ix, iy, dx, dy] of [
      [px - 42, py - 2, -14, -4], [px - 38, py + 24, -12, 10],
      [px + 38, py - 24, 12, -10], [px + 40, py + 16, 13, 8],
    ]) {
      shape(`M${ix} ${iy - 6} L${ix + dx} ${iy + dy} ${ix} ${iy + 6}Z`, '#eefaff', '#7ab2cb', 1.2);
    }
    // Tiny frost flake chipping off on impact (proving hard force with zero movement!)
    if (chipFall > 0.01 && chipFall < 0.99) {
      ctx.save();
      ctx.globalAlpha = 1 - chipFall;
      shape(`M${px - 32 - chipFall * 22} ${py + 12 + chipFall * 86} l8 -4 5 7 -9 4Z`, '#eefaff', '#7ab2cb', 1);
      shape(`M${px - 24 - chipFall * 12} ${py + 22 + chipFall * 108} l6 -3 4 6 -7 3Z`, '#d7f1fc');
      ctx.restore();
    }

    // Updated proportional pointing hand matching fixed reference-sheet.svg (#bell-reach / #bell-press)!
    ctx.save();
    const handX = mix(128, 286, reach) - pullback * 34 - drop * 44 + strainShake * 0.6;
    const handY = mix(538, 502, reach) + drop * 175 + strainShake;
    ctx.translate(handX, handY);
    ctx.rotate(drop * 0.28);
    ctx.scale(2.22, 2.22);
    ctx.translate(-128, -102);

    // Layered curled pinky, ring, and middle fingers
    shape('M104 143 Q120 142 126 149 Q129 156 120 160 Q107 163 94 157Z', '#c2876f', '#253a3b', 1.9);
    shape('M113 130 Q133 128 139 136 Q142 145 132 149 Q117 152 103 145Z', '#cf9378', '#253a3b', 2.0);
    shape('M122 114 Q144 112 150 121 Q153 131 142 136 Q127 139 113 132Z', '#dba081', '#253a3b', 2.1);

    // Main dorsal hand & proportional index finger (~0.85x palm length)
    const pressed = pushing1 || pushing2;
    const handPath = pressed
      ? 'M48 137 Q68 122 87 108 Q101 99 116 97 Q128 96 142 93 L163 89 Q169 88 172 92 Q173 97 167 99 L148 104 Q135 108 124 115 L112 145 Q93 155 68 161Z'
      : 'M48 137 Q68 122 87 108 Q101 99 116 97 Q127 95 140 92 L159 88 Q166 87 169 91 Q172 95 166 99 L147 104 Q135 108 124 115 L112 145 Q93 155 68 161Z';
    shape(handPath, '#e7ae87', '#253a3b', 2.4);
    shape('M64 130 L90 112 Q103 103 118 102 Q125 102 132 104 Q118 109 107 120 Q92 132 72 137Z', '#f3c39d');
    shape('M115 137 Q98 148 70 158 L64 151 Q87 143 107 132Z', '#c88e72');
    // Chilled blue-pale fingertip + continuity raw red palm edge
    oval(162, 94, 9, 4.5, '#d4ecf766');
    shape('M114 134 Q132 132 142 124 Q140 135 124 142Z', '#c9494170');
    shape(pressed
      ? 'M161 90 Q167 89 170 92 Q169 96 164 96 L160 94Z'
      : 'M159 89 Q165 88 168 91 Q167 95 162 95 L158 93Z', '#f1c2a8', '#b98573', 0.85);
    shape('M136 95 L138 101 M151 92 L153 97 M115 101 Q120 103 123 107', null, '#9e6755', 1.5);

    // Near-side thumb resting naturally against the curled middle finger
    shape('M88 137 Q96 127 104 120 Q112 114 122 114 L135 115 Q143 116 143 123 Q142 129 134 130 L120 131 Q109 135 98 144 Q92 149 84 152', '#e7ae87', '#253a3b', 2.2);
    shape('M141 124 Q140 128 133 129 L119 130 Q108 134 97 143 Q91 147 85 150 L82 146 Q94 138 103 131 Q113 126 125 125Z', '#c88e72');
    shape('M133 117 Q139 117 141 121 Q139 125 134 125 L131 121Z', '#f1c2a8', '#b98573', 0.85);
    shape('M118 117 Q119 122 118 126 M98 131 Q101 136 105 139', null, '#9e6755', 1.5);

    // Frosted cream shirt cuff
    ctx.save();
    ctx.translate(55, 148);
    ctx.rotate(59 * Math.PI / 180);
    ctx.scale(0.66, 0.78);
    drawCuff(0.82);
    ctx.restore();
    ctx.restore();

    ctx.drawImage(grain, 0, 0);
  }

  function loadPng(base64) {
    const img = new Image();
    img.src = `data:image/png;base64,${base64}`;
    return img.decode().then(() => img);
  }

  function drawBadge(text, accent = '#8ce0ff') {
    rect('#0f1d26d8', 24, 52, 212, 42);
    shape('M24 52 H236 V94 H24Z', null, accent, 2);
    label(text, 130, 80, 18, accent);
  }

  window.renderFreezerFrame = async (frame, cutout, anchors) => {
    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    if (frame >= 84 && frame < 192) {
      drawPovBar(frame);
    } else if (frame >= 336 && frame < 528) {
      drawCutaway(frame, 'constrict');
    } else if (frame >= 876 && frame < 984) {
      drawCutaway(frame, 'dilate');
    } else if (frame >= 1200 && frame < 1368) {
      drawPovPlunger(frame);
    } else {
      // Character shots inside freezer — door slams at f0..22 and NEVER opens again!
      const doorOpen = frame < 22 ? 0.85 * (1 - tween(frame, 0, 22)) : 0;
      const frostLevel = frame < 84 ? 0.22
        : frame < 336 ? mix(0.28, 0.44, tween(frame, 192, 336))
        : frame < 876 ? mix(0.58, 0.85, tween(frame, 528, 876))
        : frame < 1200 ? 0.92
        : mix(0.95, 1.35, tween(frame, 1368, 1535));
      const flickerDim = frame >= 1138 && frame < 1200
        ? (frame < 1146 ? ((frame % 2) ? 0.9 : 0.2) : 0.88)
        : (frame >= 1368 ? mix(0.45, 0.72, tween(frame, 1410, 1535)) : 0);
      const plungerGlow = frame >= 1138 ? 0.92 : 0.24;
      const handprint = frame >= 192;

      // Medium-close camera zoom during paradoxical tie-loosen (Shot 7) without exposing room edge!
      const zoom = frame >= 984 && frame < 1200
        ? mix(1.28, 1.0, tween(frame, 1138, 1168)) : 1;

      rect('#13222b', 0, 0, W, H);
      ctx.save();
      if (zoom > 1.001) {
        const zt = (zoom - 1) / 0.28;
        ctx.translate(270, 480);
        ctx.scale(zoom, zoom);
        ctx.translate(-mix(270, 286, zt), -mix(480, 456, zt));
      }

      drawFreezerRoom(frame, { doorOpen, frostLevel, flickerDim, plungerGlow, handprint });

      // Contact shadow under shoes (widens across floor as lead collapses in Shot 9)
      const px = anchors?.pelvis?.[0] ?? 240;
      const collapsed = frame >= 1368 ? tween(frame, 1396, 1424) : 0;
      ctx.fillStyle = '#0a161d68';
      ctx.beginPath();
      ctx.ellipse(px + 10 + collapsed * 58, 755, 62 + collapsed * 44, 8 + collapsed * 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // OpenToonz articulated lead frame
      if (cutout) {
        ctx.drawImage(await loadPng(cutout), 0, 0, W, H);
      }

      // Condition overlays anchored accurately to rotated joint positions!
      const head = anchors?.head;
      const shoulder = anchors?.shoulder;
      const wrist = anchors?.wrist;

      // Raw red contact mark on near hand after the 4s bar yank (persists all episode!)
      if (frame >= 192 && wrist) {
        oval(wrist[0] + 5, wrist[1] + 2, 9, 6, 'rgba(205, 54, 48, 0.58)');
      }

      // Subtle soft frost dusting on hair crown & top of near shoulder — intensifies to heavy rime in Shot 9!
      if (frame >= 220 && shoulder && head) {
        const crown = atJoint(head, -4, -64);
        softPuff(crown[0], crown[1], 18 + collapsed * 10, 'rgba(222, 246, 255, 0.88)', clamp(frostLevel * 0.55));
        softPuff(shoulder[0] - 5, shoulder[1] - 12, 16 + collapsed * 12, 'rgba(222, 246, 255, 0.88)', clamp(frostLevel * 0.55));
      }

      // Heavy freezing frost encrusting collapsed body on floor (f1420..1535)
      if (frame >= 1420 && head && shoulder) {
        const freezeOver = tween(frame, 1420, 1526);
        softPuff(px + 42, 718, 56, 'rgba(194, 232, 248, 0.65)', freezeOver * 0.72);
        softPuff(head[0] + 8, head[1] - 20, 34, 'rgba(202, 238, 252, 0.72)', freezeOver * 0.68);
        // Pale blue frozen skin chill over slumped face & frost neutralizing mouth curve
        const face = atJoint(head, 14, -22);
        softPuff(face[0], face[1], 24, 'rgba(165, 218, 245, 0.78)', freezeOver * 0.62);
        const lip = atJoint(head, 23, -12);
        oval(lip[0], lip[1], 6, 4, `rgba(176, 206, 224, ${0.45 + freezeOver * 0.4})`);
      }

      // Paradoxical warmth rosy flush squarely on the CHEEK during Shot 7 + loosened burgundy tie pull!
      if (frame >= 992 && frame < 1168 && head) {
        const flush = tween(frame, 992, 1040) * (1 - tween(frame, 1142, 1168));
        const cheek = atJoint(head, 15, -24);
        const cg = ctx.createRadialGradient(cheek[0], cheek[1], 2, cheek[0], cheek[1], 15);
        cg.addColorStop(0, `rgba(255, 92, 76, ${flush * 0.72})`);
        cg.addColorStop(1, 'rgba(255, 92, 76, 0)');
        oval(cheek[0], cheek[1], 15, 11, cg);
      }
      // Pulled burgundy tie tail held in near fingers during tie-loosen tug (f1036..1138)
      if (frame >= 1036 && frame < 1138 && wrist && shoulder) {
        const tug = tween(frame, 1036, 1068) * (1 - tween(frame, 1120, 1138));
        ctx.save();
        ctx.globalAlpha = tug;
        shape(`M${shoulder[0] + 10} ${shoulder[1] + 6} Q${wrist[0] - 4} ${wrist[1] - 6} ${wrist[0] + 6} ${wrist[1] + 14} L${wrist[0] - 3} ${wrist[1] + 18} Q${shoulder[0] + 6} ${shoulder[1] + 22} ${shoulder[0] + 4} ${shoulder[1] + 10}Z`, '#7d2834', ink, 1.8);
        ctx.restore();
      }

      // Breath mist plumes from exact mouth position — fades out and STOPS completely after cardiac arrest (f1458)!
      if (head && frame < 1464) {
        const mouth = atJoint(head, 32, -14);
        const breathInt = frame >= 1368 ? 1 - tween(frame, 1388, 1460) : (frame >= 528 ? 1.25 : 0.95);
        if (breathInt > 0.04) drawBreath(mouth[0], mouth[1], frame, breathInt);
      }

      // Cold mist blanket creeping over the floor in final freeze
      if (frame >= 1410) {
        const mist = tween(frame, 1410, 1528);
        ctx.save();
        ctx.globalAlpha = mist * 0.45;
        const mg = ctx.createLinearGradient(0, 680, 0, H);
        mg.addColorStop(0, 'rgba(176, 224, 245, 0)');
        mg.addColorStop(0.55, 'rgba(176, 224, 245, 0.55)');
        mg.addColorStop(1, 'rgba(130, 192, 224, 0.85)');
        rect(mg, 0, 680, W, H - 680);
        ctx.restore();
      }

      ctx.restore();

      // Subtle clinical time/core-temp badge for hypothermia progression beats
      if (frame >= 528 && frame < 768) drawBadge('25 MIN  ·  34°C', '#8ce0ff');
      else if (frame >= 768 && frame < 876) drawBadge('40 MIN  ·  31°C', '#ff9d78');
      else if (frame >= 984 && frame < 1142) drawBadge('FALSE WARMTH', '#ff8266');
      else if (frame >= 1368) {
        const flat = frame >= 1446;
        drawBadge(flat ? '65 MIN  ·  27°C' : '60 MIN  ·  28°C', flat ? '#ff5f57' : '#ff9d78');
        // Minimal ECG heartbeat line beside badge that slows then flatlines at f1446!
        rect('#0f1d26d8', 248, 52, 138, 42);
        shape('M248 52 H386 V94 H248Z', null, flat ? '#ff5f57' : '#ff9d78', 2);
        ctx.beginPath();
        ctx.strokeStyle = flat ? '#ff5f57' : '#ff9d78';
        ctx.lineWidth = 2.2;
        for (let i = 0; i <= 120; i += 3) {
          const x = 256 + i;
          let y = 73;
          if (!flat) {
            const p = ((i + frame * 3.5) % 60);
            if (p > 24 && p < 30) y = 73 - 13;
            else if (p >= 30 && p < 34) y = 73 + 9;
          }
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // Series vignette
    const vig = ctx.createRadialGradient(270, 480, 220, 270, 480, 560);
    vig.addColorStop(0, '#07141b00');
    vig.addColorStop(1, '#07141b66');
    rect(vig, 0, 0, W, H);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  };
})();
