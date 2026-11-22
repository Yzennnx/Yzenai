(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  const W = 960, H = 540; // 16:9 logical widescreen scaled 2x -> 1920x1080
  const ink = '#101b21';

  const clamp = (n) => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const tween = (frame, start, end) => {
    const t = clamp((frame - start) / (end - start));
    return t * t * (3 - 2 * t);
  };

  const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
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
  const label = (txt, x, y, size, color = '#f2e8d4', align = 'center') => {
    ctx.font = `bold ${size}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(txt, x, y);
  };

  // Cutout film grain texture
  const grain = document.createElement('canvas');
  grain.width = W;
  grain.height = H;
  const gctx = grain.getContext('2d');
  let seed = 731;
  const rand = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 24000; i++) {
    gctx.fillStyle = i % 3 ? '#f4e4c40e' : '#060c122e';
    gctx.fillRect(rand() * W, rand() * H, 0.8 + rand() * 2.2, 0.6 + rand() * 0.9);
  }

  function loadPng(base64) {
    const img = new Image();
    img.src = `data:image/png;base64,${base64}`;
    return img.decode().then(() => img);
  }

  function drawCornerClock(text, alpha = 1) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    rect('#0b1218cc', 24, 22, 126, 36);
    shape('M24 22 H150 V58 H24Z', null, '#4d6472', 1.8);
    label(text, 87, 46, 16, '#ffd44d');
    ctx.restore();
  }

  function drawCuff(armored = true) {
    shape('M-23 -2 Q0 2 25 -3 C26 17 32 33 39 56 L-41 56 C-35 38 -27 15 -23 -2Z', '#e8e1cc', '#253a3b', 2.4);
    shape('M-22 2 L-12 6 L-21 56 L-39 56 Q-27 25 -22 2Z', '#bab49f');
    shape('M-24 -3 Q1 0 25 -4 L28 13 Q2 19 -28 13Z', '#ede5d0', '#253a3b', 2.4);
    shape('M-25 9 Q2 14 25 8', null, '#a49c86', 1.2);
    oval(19, 7, 2.5, 2.5, '#c6bda8', '#8a8575', 0.8);
    if (armored) {
      shape('M-29 14 Q0 20 31 14 L38 56 L-40 56Z', '#a88156', '#253a3b', 2.2);
      shape('M-32 24 Q0 30 33 24 L35 36 Q0 42 -35 36Z', '#8c969e', '#253a3b', 1.8);
      shape('M-36 44 Q0 49 37 44 L39 54 Q0 58 -39 54Z', '#8c969e', '#253a3b', 1.6);
    }
  }

  // Draw the OpenToonz armored Series Lead with joint-locked backpack (normal or bulging!), cardboard wraps, optional neck scuff, and optional kitchen knife!
  async function drawArmoredLead(cutout, anchors, worldX, worldFloorY, scale, opts = {}) {
    if (!cutout) return;
    const { flipLeft = false, bulgingPack = false, neckScuff = false, holdKnife = false, bentKnife = false, noShadow = false } = opts;
    const img = await loadPng(cutout);
    if (!noShadow) {
      ctx.fillStyle = '#070c1088';
      ctx.beginPath();
      ctx.ellipse(worldX, worldFloorY, 48 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    if (flipLeft) {
      ctx.translate(worldX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-worldX, 0);
    }
    const ox = worldX - 250 * scale;
    const oy = worldFloorY - 756 * scale;

    // 1. Dark canvas backpack anchored behind chest (expands visibly after market raid!)
    if (anchors?.chest) {
      const [cx, cy, ca] = anchors.chest;
      ctx.save();
      ctx.translate(ox + cx * scale, oy + cy * scale);
      ctx.rotate(ca * Math.PI / 180);
      ctx.scale(scale, scale);
      if (bulgingPack) {
        shape('M-64 -122 Q-86 -108 -86 -56 L-76 6 Q-50 20 -22 8 L-20 -122 Q-42 -134 -64 -122Z', '#2d3a34', ink, 2.6);
        shape('M-80 -68 H-30 V-14 H-80Z', '#222d28', ink, 2.0);
        shape('M-78 -94 Q-52 -84 -24 -94', null, '#53685d', 2.2);
      } else {
        shape('M-54 -116 Q-64 -106 -64 -66 L-58 -8 Q-44 6 -24 2 L-22 -118 Q-38 -124 -54 -116Z', '#2d3a34', ink, 2.4);
        shape('M-60 -66 H-28 V-26 H-60Z', '#232e29', ink, 1.8);
        shape('M-58 -92 Q-42 -86 -26 -92', null, '#4a5c52', 2.0);
      }
      ctx.restore();
    }

    // 2. Official OpenToonz character layer
    ctx.drawImage(img, ox, oy, 540 * scale, 960 * scale);

    // 3. Tracked backpack shoulder strap + corrugated cardboard & duct-tape arm/shin wraps + optional red neck scuff!
    const drawWrap = (anchor, len, w, yOff) => {
      if (!anchor) return;
      const [ax, ay, aa] = anchor;
      ctx.save();
      ctx.translate(ox + ax * scale, oy + ay * scale);
      ctx.rotate(aa * Math.PI / 180);
      ctx.scale(scale, scale);
      shape(`M${-w} ${yOff} H${w} L${w - 1.5} ${yOff + len} H${-w + 1.5}Z`, '#a88156', '#253a3b', 2.0);
      rect('#8c969e', -w - 1, yOff + len * 0.2, (w + 1) * 2, len * 0.22);
      rect('#8c969e', -w - 1, yOff + len * 0.62, (w + 1) * 2, len * 0.22);
      ctx.restore();
    };
    if (anchors?.chest) {
      const [cx, cy, ca] = anchors.chest;
      ctx.save();
      ctx.translate(ox + cx * scale, oy + cy * scale);
      ctx.rotate(ca * Math.PI / 180);
      ctx.scale(scale, scale);
      shape('M-16 -124 Q8 -80 12 -24', null, '#222b26', 6.5);
      ctx.restore();
    }
    if (neckScuff && anchors?.neck) {
      const [nx, ny, na] = anchors.neck;
      ctx.save();
      ctx.translate(ox + nx * scale, oy + ny * scale);
      ctx.rotate(na * Math.PI / 180);
      ctx.scale(scale, scale);
      shape('M-14 -8 Q2 -2 18 -6', null, '#a83430cc', 4.2);
      ctx.restore();
    }
    drawWrap(anchors?.shinFar, 54, 13, 18);
    drawWrap(anchors?.shinNear, 54, 14, 18);
    drawWrap(anchors?.forearmNear, 42, 10, 14);

    // 4. Optional gleaming stainless kitchen knife locked directly to near hand during straight-arm slash!
    if (holdKnife && anchors?.handNear) {
      const [hx, hy, ha] = anchors.handNear;
      ctx.save();
      ctx.translate(ox + hx * scale, oy + hy * scale);
      ctx.rotate((ha - 180) * Math.PI / 180);
      ctx.scale(scale, scale);
      shape('M-10 -24 H8 V16 H-10Z', '#1f282e', ink, 2.2);
      if (bentKnife) {
        shape('M-8 16 H8 L12 88 L22 118 L-4 94Z', '#dcecf5', ink, 2.2);
      } else {
        shape('M-8 16 H8 L10 92 Q6 116 -2 122 L-10 92Z', '#dcecf5', ink, 2.2);
      }
      shape('M-4 22 H2 L4 96 L-4 90Z', '#ffffffaa');
      ctx.restore();
    }
    ctx.restore();
  }

  // Reusable hunched/running common infected silhouette
  function drawInfected(x, y, scale, opts = {}) {
    const { facingRight = true, running = false, phase = 0, dark = false } = opts;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facingRight ? scale : -scale, scale);
    const body = dark ? '#182024' : '#2d393f';
    const skin = dark ? '#364347' : '#657573';
    oval(0, 0, 40, 7, '#060a0d99');
    const stride = running ? Math.sin(phase) * 26 : 0;
    shape(`M-14 -92 L${-26 - stride} -42 ${-18 - stride} 0 ${-2 - stride} 0 ${-10 - stride * 0.5} -44 4 -92Z`, '#202a2e', ink, 2.2);
    shape(`M4 -92 L${20 + stride} -44 ${14 + stride} 0 ${30 + stride} 0 ${34 + stride * 0.5} -46 18 -92Z`, '#29353a', ink, 2.2);
    const lean = running ? 16 : 6;
    shape(`M-20 -88 Q-24 -146 ${lean} -174 L${34 + lean} -166 Q${38 + lean} -130 22 -88Z`, body, ink, 2.4);
    const ay = running ? -144 + Math.cos(phase) * 18 : -148;
    shape(`M${14 + lean * 0.5} -158 L${62 + lean} ${ay} L${86 + lean} ${ay + 8} L${82 + lean} ${ay + 22} L${54 + lean} ${ay + 12} L${10 + lean * 0.5} -142Z`, body, ink, 2.2);
    const hx = 28 + lean, hy = -190;
    oval(hx, hy, 21, 23, skin, ink, 2.4);
    shape(`M${hx - 18} ${hy - 6} Q${hx - 10} ${hy - 26} ${hx + 16} ${hy - 20} Q${hx + 22} ${hy - 10} ${hx + 16} ${hy - 2} L${hx + 6} ${hy - 12}Z`, '#182024', ink, 1.8);
    oval(hx + 13, hy - 2, 3.8, 3.0, '#e0f2be');
    ctx.restore();
  }

  // Reusable foggy midnight street backdrop (supports scrolling & flickering 24H MARKET neon right!)
  function drawMidnightStreet(frame, scrollX = 0, showMarket = true, amberStrobe = 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#070e16');
    sky.addColorStop(0.68, '#132230');
    sky.addColorStop(1, '#1d3040');
    rect(sky, 0, 0, W, H);

    const bgOff = (scrollX * 0.35) % 480;
    for (let i = -1; i < 4; i++) {
      const bx = i * 480 - bgOff;
      rect('#0d1620', bx + 20, 120, 145, 322);
      rect('#0a121a', bx + 178, 72, 165, 370);
      rect('#0f1a25', bx + 356, 144, 114, 298);
      for (let wy = 160; wy < 360; wy += 44) {
        rect('#182836', bx + 44, wy, 26, 22);
        rect('#182836', bx + 98, wy, 26, 22);
      }
    }

    if (showMarket) {
      const mx = 690 - scrollX * 0.12;
      rect('#121c24', mx, 160, 270, 282);
      rect('#1b2e2a', mx + 24, 250, 220, 192);
      shape(`M${mx + 24} 250 H${mx + 244} V442 H${mx + 24}Z`, null, '#0b1216', 5);
      const flick = (frame % 37 === 0 || frame % 53 === 0) ? 0.35 : 0.95;
      rect('#0e171c', mx + 16, 174, 238, 56);
      shape(`M${mx + 16} 174 H${mx + 254} V230 H${mx + 16}Z`, null, `rgba(116, 240, 168, ${flick})`, 3);
      label('24H MARKET', mx + 135, 211, 24, `rgba(146, 255, 190, ${flick})`);
      const ng = ctx.createRadialGradient(mx + 135, 202, 12, mx + 135, 240, 200);
      ng.addColorStop(0, `rgba(116, 240, 168, ${0.22 * flick})`);
      ng.addColorStop(1, 'rgba(116, 240, 168, 0)');
      rect(ng, mx - 80, 60, 420, 380);
    }

    rect('#18222a', 0, 442, W, 98);
    rect('#293640', 0, 434, W, 10);
    const dashOff = scrollX % 110;
    for (let x = -110; x < W + 110; x += 110) rect('#5e533255', x - dashOff, 488, 54, 6);

    const lampOff = (scrollX * 0.85) % 520;
    for (let i = -1; i < 3; i++) {
      const lx = i * 520 + 260 - lampOff;
      rect('#161f26', lx, 56, 10, 384);
      shape(`M${lx} 64 L${lx + 52} 76 L${lx + 52} 86 L${lx} 78Z`, '#202b34', ink, 2);
      oval(lx + 46, 84, 12, 6, '#ffe09c');
      const lg = ctx.createRadialGradient(lx + 46, 90, 10, lx + 46, 260, 230);
      lg.addColorStop(0, 'rgba(246, 202, 118, 0.24)');
      lg.addColorStop(1, 'rgba(246, 202, 118, 0)');
      rect(lg, lx - 180, 40, 460, 440);
    }

    if (amberStrobe > 0.02) {
      rect(`rgba(255, 184, 62, ${0.22 * amberStrobe})`, 0, 0, W, H);
    }
  }

  // SHOT 2 (f164..292, 0:06.8..0:12.2): Wet Cough Freeze -> eye-dart -> look-up skyward!
  function drawShot2CoughLookUp(frame) {
    const dartP = tween(frame, 206, 224);
    const lookP = tween(frame, 228, 260);
    const zoom = mix(1.0, 1.09, tween(frame, 164, 292));
    drawMidnightStreet(frame, 180, true);
    rect('#070d14aa', 0, 0, W, H);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);
    window.drawAnatomyTurnaround(ctx, 480, 1310, 2.58, 'front', {
      hideLimbs: false,
      expression: frame < 216 ? 'head-notice' : 'head-alarm',
      headPitch: mix(0, -0.78, lookP),
      eyeOffset: [mix(0, 4.2, dartP) * (1 - lookP), mix(0, -2.6, lookP)],
      sweat: tween(frame, 220, 268) * 0.78,
    });
    shape('M402 384 L414 554 H440 L428 378Z M558 384 L546 554 H520 L532 378Z', '#26322d', ink, 2.6);
    ctx.restore();
    drawCornerClock('00:15 AM', 1);
  }

  // SHOT 3 (f293..350, 0:12.2..0:14.6): Rapid Upward Rooftop Whip-Pan -> Stepped 1.38x Smoker Silhouette & Barbed Tongue Launch!
  function drawShot3SmokerRooftop(frame) {
    const whip = tween(frame, 293, 304);
    const stepZ = frame < 318 ? 1.0 : mix(1.26, 1.42, tween(frame, 318, 350));
    const panY = mix(220, 0, whip);
    const lash = tween(frame, 336, 350);

    ctx.save();
    ctx.translate(480, 270 + panY);
    ctx.scale(stepZ, stepZ);
    ctx.translate(-480, -270);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#070f15');
    sky.addColorStop(1, '#162724');
    rect(sky, 0, -240, W, H + 300);
    oval(220, 108, 32, 32, 'rgba(210, 232, 245, 0.28)');

    shape('M0 320 L960 278 V560 H0Z', '#0e161d', ink, 4);
    shape('M0 320 L960 278 L960 296 L0 338Z', '#1e2b33', ink, 3);

    const puff = Math.sin(frame * 0.25) * 8;
    for (const [sx, sy, sr] of [[440, 210, 95], [535, 195, 110], [600, 238, 86], [485, 255, 92]]) {
      const sg = ctx.createRadialGradient(sx + puff, sy, 12, sx + puff, sy, sr);
      sg.addColorStop(0, 'rgba(136, 218, 122, 0.34)');
      sg.addColorStop(1, 'rgba(136, 218, 122, 0)');
      rect(sg, sx - sr, sy - sr, sr * 2, sr * 2);
    }

    ctx.save();
    ctx.translate(520, 302);
    shape('M-46 0 L-36 -108 Q-12 -156 32 -142 L56 -88 L42 0Z', '#1b2622', ink, 3.2);
    shape('M-34 -96 L-64 -24 L-44 6 L-18 -56Z', '#141e1a', ink, 2.6);
    shape('M38 -88 L68 -18 L48 6 L22 -52Z', '#141e1a', ink, 2.6);
    oval(-28, -118, 16, 13, '#4c6e44', ink, 2);
    oval(-40, -100, 12, 11, '#5d8452', ink, 2);
    oval(-16, -134, 11, 10, '#5d8452', ink, 1.8);
    oval(14, -148, 28, 32, '#495c4e', ink, 2.8);
    oval(4, -154, 5.5, 4, '#eaffb0');
    oval(24, -154, 5.5, 4, '#eaffb0');
    oval(14, -130, 14, lash > 0.05 ? 16 : 8, '#260b0f', ink, 2.2);
    ctx.restore();

    if (lash > 0.02) {
      const tx = mix(534, 240, lash);
      const ty = mix(172, 540, lash);
      const w = mix(6, 38, lash);
      shape(`M534 172 Q${mix(534, 410, lash)} ${mix(172, 340, lash)} ${tx} ${ty}`, null, '#7a1922', w);
      shape(`M534 172 Q${mix(534, 410, lash)} ${mix(172, 340, lash)} ${tx} ${ty}`, null, '#bf3440', w * 0.45);
      oval(tx, ty, w * 0.72, w * 0.65, '#9e232e', ink, 2.4);
    }
    ctx.restore();
    if (frame < 303) rect('rgba(16, 28, 36, 0.25)', 0, 0, W, H);
    drawCornerClock('00:15 AM', 1);
  }

  // SHOT 5 (f490..614, 0:20.4..0:25.6): Tight Neck/Cuff Wedge Insert -> 5-Frame Off-Center ECU Dread Crash-Zoom!
  function drawShot5ThroatAndCrashZoom(frame) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#091216');
    bg.addColorStop(1, '#162420');
    rect(bg, 0, 0, W, H);

    if (frame < 557) {
      const pull = Math.sin(frame * 0.8) * 3.2;
      const wedge = tween(frame, 502, 540);
      ctx.save();
      ctx.translate(pull * 0.6, 0);
      window.drawAnatomyTurnaround(ctx, 480, 1680, 3.65, 'front', {
        hideLimbs: false,
        expression: 'head-strain',
        sweat: 0.72,
      });
      shape('M352 340 L372 544 H410 L390 332Z M608 340 L588 544 H550 L570 332Z', '#26322d', ink, 3.0);
      shape('M430 276 Q480 294 532 272', null, '#b82e2acc', 10);
      shape(`M420 268 Q480 ${294 - wedge * 12} 540 264 L960 72 L960 110 L542 292 Q480 ${320 - wedge * 12} 420 294Z`, '#8c1d27', ink, 3.0);
      shape(`M426 276 Q480 ${300 - wedge * 12} 538 272 L960 86`, null, '#c9404c', 4.8);
      for (const [bx, by] of [[584, 244], [652, 214], [722, 182], [798, 148]]) {
        shape(`M${bx} ${by} L${bx + 12} ${by - 18} L${bx + 20} ${by - 6}Z`, '#5c1118', ink, 1.8);
      }

      // Taped cardboard-cuff left hand wedging cleanly underneath the tongue — forearm aligned 100% flush with cuff!
      ctx.save();
      ctx.translate(mix(235, 386, wedge), mix(456, 308, wedge));
      ctx.rotate(-0.26);
      ctx.scale(1.80, 1.80);
      ctx.translate(-90, -120);
      // Draw forearm & cuff in ONE exact aligned coordinate system behind the palm!
      ctx.save();
      ctx.translate(55, 148);
      ctx.rotate(59 * Math.PI / 180);
      ctx.scale(0.68, 0.80);
      shape('M-40 50 H38 L48 220 H-50Z', '#a88156', '#253a3b', 2.4);
      shape('M-43 92 Q0 98 43 92 L45 112 Q0 118 -45 112Z', '#8c969e', '#253a3b', 1.8);
      drawCuff(true);
      ctx.restore();
      shape('M48 137 Q68 122 87 108 Q101 99 116 97 Q128 96 142 93 L163 89 Q169 88 172 92 Q173 97 167 99 L148 104 Q135 108 124 115 L112 145 Q93 155 68 161Z', '#e7ae87', '#253a3b', 2.4);
      shape('M113 130 Q133 128 139 136 Q142 145 132 149 Q117 152 103 145Z', '#cf9378', '#253a3b', 2.0);
      shape('M122 114 Q144 112 150 121 Q153 131 142 136 Q127 139 113 132Z', '#dba081', '#253a3b', 2.1);
      ctx.restore();
      ctx.restore();
    } else {
      const crash = tween(frame, 557, 563);
      const creep = tween(frame, 563, 614);
      const zoom = 2.65 + 4.35 * crash + 0.50 * creep;
      const panX = 480 - 74 * crash - 12 * creep;
      const panY = 270 + 16 * crash;
      const shake = frame <= 568 ? Math.sin(frame * 3.1) * 7 * (1 - (frame - 557) / 11) : Math.sin(frame * 1.6) * 2.0;

      window.drawAnatomyTurnaround(ctx, panX + shake, panY + 434 * zoom + shake * 0.4, zoom, 'front', {
        hideLimbs: false,
        expression: 'head-strain',
        eyeOffset: [1.5, -0.5],
        sweat: 0.45 + 0.55 * creep,
        dreadWash: 0.45 + 0.50 * crash,
      });
    }
    drawCornerClock('00:15 AM', 1);
  }

  // SHOT 7 (f730..839, 0:30.4..0:35.0): Tight POV Bent & Chipped Kitchen Knife Continuity Insert!
  function drawShot7BentKnifeInsert(frame) {
    const zoom = mix(1.0, 1.09, tween(frame, 730, 839));
    const tremor = Math.sin(frame * 0.55) * 2.2;
    drawMidnightStreet(frame, 220, true);
    rect('#070d12cc', 0, 0, W, H);

    ctx.save();
    ctx.translate(480 + tremor, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    ctx.save();
    ctx.translate(462, 358);
    ctx.rotate(148 * Math.PI / 180);
    ctx.scale(1.92, 1.92);
    ctx.translate(-126, -124);
    shape('M100 105 Q90 108 85 119 Q79 130 82 143 Q82 151 88 155 Q93 159 100 155 Q104 153 104 148 Q104 144 98 143 L95 143 Q92 137 97 132 L111 119Z', '#c88e72', '#253a3b', 2.4);
    shape('M78 111 H184 V138 H78Z', '#1f282e', '#253a3b', 2.4);
    oval(148, 124, 3.2, 3.2, '#b8c4cc');
    shape('M78 112 H-18 L-28 118 L-36 112 L-96 98 L-60 132 L-16 138 H78Z', '#d6e7f0', '#253a3b', 2.2);
    shape('M74 115 H-16 L-78 106 L-52 125 L74 124Z', '#ffffffaa');
    shape('M-24 114 L-28 134', null, '#687d8a', 1.8);
    for (let k = 0; k < 4; k++) {
      const sx = -45 - k * 18 - ((frame - 730) % 24) * 0.9;
      const sy = 114 + Math.sin(frame * 0.2 + k) * 9;
      oval(sx, sy, 10 + k * 2, 7 + k * 1.5, 'rgba(136, 222, 124, 0.28)');
    }
    shape('M99 61 Q102 72 96 83 Q90 95 91 109 Q91 118 95 123 Q97 130 98 147 Q98 158 101 162 Q106 168 112 162 Q115 159 115 151 L114 128 Q117 137 118 153 Q119 166 124 168 Q131 171 135 165 Q137 161 135 153 L132 128 Q136 136 139 153 Q141 163 146 163 Q154 163 155 156 Q156 151 152 142 L149 125 Q154 132 157 144 Q160 153 166 153 Q173 152 172 145 Q170 132 164 112 Q161 100 154 94 Q143 81 139 61Z', '#e7ae87', '#253a3b', 2.4);
    shape('M139 63 Q143 80 154 94 Q161 100 164 112 L172 145 Q173 152 166 152 Q160 153 157 144 L150 123 Q156 117 154 110 Q148 99 140 93 Q130 82 130 63Z', '#c88e72');
    shape('M98 106 Q98 88 106 79 Q117 77 133 87 Q143 94 146 104 Q133 102 124 105 Q110 106 98 106Z', '#f3c39d');
    shape('M98 114 Q104 109 110 113 M117 116 Q123 110 129 114 M136 115 Q142 109 146 112 M153 117 L160 115 M101 136 Q106 133 111 135 M121 140 Q126 136 131 139 M140 138 L148 136 M158 136 L166 133', null, '#9e6755', 1.6);
    ctx.save();
    ctx.translate(118, 66);
    ctx.rotate(Math.PI);
    ctx.scale(0.84, 1.05);
    drawCuff(true);
    ctx.restore();
    ctx.restore();
    ctx.restore();
    drawCornerClock('00:16 AM', 1);
  }

  // SHOT 9 (f1018..1166, 0:42.4..0:48.6): Corner 24H MARKET OTS Peek -> Stepped 1.45x Horde Reveal Inside!
  function drawShot9MarketHordePeek(frame) {
    const insideCut = frame >= 1069;
    const zoom = insideCut ? mix(1.24, 1.46, tween(frame, 1069, 1166)) : 1.0;

    ctx.save();
    ctx.translate(540, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-540, -270);

    const flk = (frame % 31 === 0) ? 0.45 : 0.94;
    rect('#121c1a', 0, 0, W, H);
    rect('#1d2c28', 180, 70, 740, 390);
    for (const fx of [360, 640]) {
      rect(`rgba(196, 255, 212, ${0.85 * flk})`, fx - 54, 86, 108, 8);
    }
    for (const sx of [240, 440, 640]) {
      rect('#293834', sx, 160, 150, 260);
      for (const sy of [200, 250, 300, 350]) {
        rect('#182220', sx + 6, sy, 138, 6);
        rect('#c74d44', sx + 14, sy - 22, 18, 22);
        rect('#d99e45', sx + 38, sy - 22, 18, 22);
        rect('#6ebce6', sx + 66, sy - 26, 16, 26);
        rect('#4e8a6b', sx + 94, sy - 20, 20, 20);
      }
    }
    for (let i = 0; i < 12; i++) {
      const zx = 260 + (i % 6) * 98 + Math.sin(frame * 0.08 + i) * 6;
      const zy = i < 6 ? 410 : 458;
      const sc = i < 6 ? 0.56 : 0.72;
      drawInfected(zx, zy, sc, { facingRight: i % 2 === 0, running: false, phase: frame * 0.1 + i, dark: i < 6 });
    }
    shape('M180 70 H920 V460 H180Z', 'rgba(130, 188, 174, 0.10)', '#0b1214', 10);
    rect('#0b1214', 540, 70, 10, 390);
    shape('M640 160 L710 240 L680 310 M710 240 L785 268', null, 'rgba(220, 246, 240, 0.45)', 2.0);
    label('24H MARKET', 545, 52, 26, '#8cf5b6');
    ctx.restore();

    if (!insideCut) {
      rect('#1a1414', 0, 0, 194, H);
      rect('#291f1e', 178, 0, 20, H);
      window.drawAnatomyTurnaround(ctx, 214, 1110, 1.98, 'rear');
      shape('M142 374 Q214 348 286 374 L294 548 H134Z', '#2d3a34', ink, 3.0);
      shape('M158 436 H270 V526 H158Z', '#222d28', ink, 2.4);
      shape('M148 406 Q214 422 280 406', null, '#495b52', 2.4);
    }
    drawCornerClock('00:34 AM', 1);
  }

  // SHOT 10 (f1167..1315, 0:48.6..0:54.8): Failed Pebble Test -> Front Bust eye-dart Locking onto Parked Sedan!
  function drawShot10PebbleAndEyeDart(frame) {
    if (frame < 1237) {
      rect('#121c1a', 0, 0, W, H);
      rect('#1c2a26', 120, 60, 720, 400);
      for (let i = 0; i < 7; i++) {
        drawInfected(220 + i * 86, 446, 0.76, { facingRight: i === 2 && frame > 1196 ? false : true, dark: i % 2 === 1 });
      }
      shape('M120 60 H840 V460 H120Z', 'rgba(130, 188, 174, 0.12)', '#0b1214', 10);
      const t = clamp((frame - 1177) / 18);
      if (frame < 1195) {
        oval(mix(200, 480, t), mix(420, 260, t) - Math.sin(Math.PI * t) * 70, 5, 4, '#9aa6ab', ink, 1.4);
      } else if (frame < 1216) {
        const dt = (frame - 1195) / 21;
        oval(mix(480, 420, dt), mix(260, 470, dt), 5, 4, '#9aa6ab', ink, 1.4);
        oval(480, 260, 8 + dt * 36, 8 + dt * 36, null, `rgba(210, 240, 255, ${(1 - dt) * 0.55})`, 1.8);
      }
    } else {
      const dart = tween(frame, 1252, 1270);
      const zoom = mix(1.0, 1.10, tween(frame, 1237, 1315));
      drawMidnightStreet(frame, 300, false);
      rect('#081018bb', 0, 0, W, H);
      ctx.save();
      ctx.translate(480, 270);
      ctx.scale(zoom, zoom);
      ctx.translate(-480, -270);
      window.drawAnatomyTurnaround(ctx, 480, 1300, 2.58, 'front', {
        hideLimbs: false,
        expression: 'head-determined',
        eyeOffset: [mix(0, -4.8, dart), 0],
      });
      shape('M444 334 Q480 344 516 332', null, '#b8322ecc', 6);
      shape('M402 374 L414 544 H440 L428 368Z M558 374 L546 544 H520 L532 368Z', '#26322d', ink, 2.6);
      if (frame >= 1254 && frame <= 1268) {
        const s = 1 - Math.abs(frame - 1261) / 8;
        ctx.save();
        ctx.translate(454, 248);
        shape(`M0 ${-16 * s} L${3 * s} ${-3 * s} L${16 * s} 0 L${3 * s} ${3 * s} L0 ${16 * s} L${-3 * s} ${3 * s} L${-16 * s} 0 L${-3 * s} ${-3 * s}Z`, '#fff6c4dd');
        ctx.restore();
      }
      ctx.restore();
    }
    drawCornerClock('00:34 AM', 1);
  }

  // SHOT 11 (f1316..1435, 0:54.8..0:59.8): POV Curb Rock Smash -> Blinding Car Alarm Ignition (HONK-HONK-HONK)!
  function drawShot11CarAlarmSmash(frame) {
    const smashed = frame >= 1373;
    const shake = (frame >= 1373 && frame <= 1379) ? Math.sin((frame - 1373) * 3.1) * 7 : 0;
    const strobeOn = smashed && frame >= 1380 && ((frame - 1380) % 14) < 7;

    ctx.save();
    ctx.translate(shake, shake * 0.5);
    drawMidnightStreet(frame, 360, false, strobeOn ? 0.85 : 0);

    const cx = 480, cy = 430;
    oval(cx, cy + 16, 260, 22, '#060a0daa');
    shape('M220 426 L236 330 L328 240 L578 232 L688 312 L746 334 L748 426Z', '#6e2326', ink, 4.0);
    shape('M236 330 L688 312 L746 334 L746 370 L224 374Z', '#8a2f32');
    shape('M344 252 L564 246 L658 314 L320 322Z', '#1b2c38', ink, 3.2);
    oval(320, 428, 48, 48, '#141a1e', ink, 4);
    oval(320, 428, 22, 22, '#5a6870', ink, 2.4);
    oval(648, 428, 48, 48, '#141a1e', ink, 4);
    oval(648, 428, 22, 22, '#5a6870', ink, 2.4);
    oval(732, 356, 16, 22, strobeOn ? '#fff2b0' : '#4a4e48', ink, 2.6);
    oval(232, 356, 12, 20, strobeOn ? '#ff4642' : '#4a1c1c', ink, 2.4);

    if (!smashed) {
      const t = tween(frame, 1340, 1372);
      const rx = mix(820, 510, t);
      const ry = mix(490, 286, t) - Math.sin(Math.PI * t) * 120;
      const sc = mix(1.9, 0.9, t);
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(t * 4.2);
      ctx.scale(sc, sc);
      shape('M-24 -14 L6 -24 L26 -6 L16 20 L-18 18Z', '#78848a', ink, 2.6);
      ctx.restore();
    } else {
      for (const [dx, dy] of [[-78, -24], [64, -32], [-96, 18], [88, 22], [-34, -42], [28, 36], [-12, 34]]) {
        shape(`M510 286 L${510 + dx} ${286 + dy}`, null, '#e6f7ffdd', 2.4);
      }
      oval(510, 286, 22, 16, null, '#e6f7ffaa', 2.0);
      oval(510, 286, 48, 32, null, '#e6f7ff66', 1.6);
      if (frame <= 1405) {
        const sp = (frame - 1373) / 32;
        for (const [vx, vy] of [[-120, -90], [110, -80], [-70, -130], [85, -110], [-145, -20], [135, -30]]) {
          const sx = 510 + vx * sp, sy = 286 + vy * sp + 150 * sp * sp;
          shape(`M${sx - 6} ${sy} L${sx + 5} ${sy - 6} L${sx + 6} ${sy + 5}Z`, '#d6f2ff', ink, 1.4);
        }
      }
      if (strobeOn) {
        const hc = ctx.createRadialGradient(736, 356, 14, 860, 380, 320);
        hc.addColorStop(0, 'rgba(255, 226, 118, 0.72)');
        hc.addColorStop(1, 'rgba(255, 190, 60, 0)');
        rect(hc, 520, 140, 440, 400);
        const rc = ctx.createRadialGradient(232, 356, 10, 180, 360, 180);
        rc.addColorStop(0, 'rgba(255, 70, 62, 0.52)');
        rc.addColorStop(1, 'rgba(255, 70, 62, 0)');
        rect(rc, 40, 180, 340, 340);
      }
      const hp = ((frame - 1380) % 14) / 14;
      if (frame >= 1380) {
        const a = (1 - hp) * 0.88;
        oval(560, 270, 30 + hp * 220, 24 + hp * 160, null, `rgba(255, 224, 110, ${a})`, 3.6);
        oval(560, 270, 16 + hp * 150, 12 + hp * 110, null, `rgba(255, 255, 220, ${a * 0.8})`, 2.4);
      }
    }
    ctx.restore();
    drawCornerClock('00:35 AM', 1);
  }

  // SHOT 13 (f1556..1732, 1:04.8..1:12.2): Low-Angle Dumpster Cover POV -> 22+ Supermarket Horde Stampede Right -> Left!
  function drawShot13DumpsterStampede(frame) {
    const strobeOn = ((frame - 1380) % 14) < 7;
    drawMidnightStreet(frame, 420, true, strobeOn ? 0.55 : 0);

    for (let i = 0; i < 22; i++) {
      const startF = 1556 + i * 6;
      const runP = (frame - startF) / 62;
      if (runP < -0.15 || runP > 1.35) continue;
      const zx = mix(920, -90, runP);
      const zy = 428 + (i % 3) * 18;
      const sc = 0.58 + (i % 3) * 0.09;
      drawInfected(zx, zy, sc, { facingRight: false, running: true, phase: frame * 0.45 + i * 1.1, dark: i % 3 === 0 });
    }

    ctx.save();
    window.drawAnatomyTurnaround(ctx, 212, 1170, 1.98, 'front', {
      hideLimbs: false,
      expression: 'head-dread',
      eyeOffset: [3.2, -1.0],
      sweat: 0.48,
    });
    shape('M186 432 Q212 440 238 430', null, '#b8322ecc', 4.5);
    shape('M152 464 L162 548 H182 L172 460Z M272 464 L262 548 H242 L252 460Z', '#26322d', ink, 2.2);
    shape('M0 370 L320 352 L338 540 H0Z', '#1b2b22', ink, 4.0);
    shape('M0 370 L320 352 L322 374 L0 392Z', '#293e32', ink, 3.0);
    if (strobeOn) rect('rgba(255, 190, 64, 0.14)', 0, 0, W, H);
    ctx.restore();
    drawCornerClock('00:36 AM', 1);
  }

  // SHOT 14 (f1733..1900, 1:12.2..1:19.2): Rhythmic 3-Beat POV Supermarket Raid Montage + Visibly Bulging Full Pack!
  function drawShot14MarketRaid(frame) {
    if (frame < 1789) {
      const sweep = tween(frame, 1739, 1782);
      rect('#121a18', 0, 0, W, H);
      rect('#222e2b', 60, 80, 840, 340);
      rect('#344540', 60, 290, 840, 22);
      for (let i = 0; i < 6; i++) {
        const cx = mix(220 + i * 96, 120, clamp(sweep * 1.4 - i * 0.12));
        const cy = mix(244, 420, clamp(sweep * 1.5 - i * 0.16));
        const col = ['#c74d44', '#d99e45', '#4e8a6b', '#6ebce6', '#c74d44', '#6ebce6'][i];
        rect(col, cx - 22, cy - 30, 44, 60);
        shape(`M${cx - 22} ${cy - 30} H${cx + 22} V${cy + 30} H${cx - 22}Z`, null, ink, 2.6);
        rect('#f5ebd4', cx - 18, cy - 12, 36, 18);
      }
      ctx.save();
      ctx.translate(mix(790, 260, sweep), 268);
      shape('M-24 -34 H320 V34 H-24Z', '#e8e1cc', '#253a3b', 3.0);
      shape('M26 -36 H320 V36 H26Z', '#a88156', '#253a3b', 3.0);
      rect('#8c969e', 64, -38, 44, 76);
      rect('#8c969e', 174, -38, 44, 76);
      ctx.save();
      ctx.translate(-22, 0);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(0.85, 0.85);
      shape('M-24 0 C-36 -8 -45 -24 -46 -40 L-49 -64 Q-56 -72 -62 -86 Q-65 -94 -58 -98 Q-51 -102 -45 -94 L-33 -74 L-33 -114 Q-33 -124 -25 -124 Q-17 -124 -17 -114 L-15 -78 L-11 -128 Q-11 -138 -3 -138 Q5 -138 5 -128 L6 -80 L12 -124 Q13 -134 21 -134 Q29 -133 28 -123 L23 -76 L32 -110 Q34 -119 41 -118 Q48 -116 46 -107 L35 -60 C35 -36 32 -14 24 0Z', '#e7ae87', '#253a3b', 2.4);
      ctx.restore();
      ctx.restore();
    } else if (frame < 1845) {
      const reach = tween(frame, 1791, 1811);
      const grab = tween(frame, 1813, 1842);
      rect('#121a18', 0, 0, W, H);
      rect('#253136', 90, 60, 780, 400);
      rect('#3a484e', 90, 300, 780, 24);
      const tx = mix(360, 220, grab), ty = mix(246, 396, grab);
      oval(tx, ty, 54, 54, '#8c969e', ink, 3.4);
      oval(tx, ty, 24, 24, '#a88156', ink, 2.6);
      const bx = mix(570, 450, grab), by = mix(244, 410, grab);
      shape(`M${bx - 76} ${by - 48} H${bx + 76} V${by + 48} H${bx - 76}Z`, '#f2ece1', ink, 3.0);
      rect('#c93832', bx - 12, by - 28, 24, 56);
      rect('#c93832', bx - 28, by - 12, 56, 24);
      const hx = mix(860, 560, reach) - grab * 120;
      const hy = mix(490, 280, reach) + grab * 166;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(-1.88, 1.88);
      ctx.translate(-122, -124);
      shape('M-160 310 L46 154 L88 192 L-110 380Z', '#a88156', '#253a3b', 2.4);
      shape('M91 147 Q101 147 111 140 C117 146 113 158 105 162 Q97 166 88 161Z', '#c78c73', '#253a3b', 1.7);
      shape('M108 126 Q116 117 125 121 Q127 131 126 140 L121 153 Q117 160 111 157 Q106 155 107 148 L110 136Z', '#ce9479', '#253a3b', 1.7);
      shape('M120 108 Q133 102 142 110 Q147 116 145 125 L143 145 Q142 153 137 154 Q131 153 130 148 L129 131 Q126 126 119 126Z', '#dba382', '#253a3b', 1.8);
      shape('M40 165 Q61 148 72 132 L84 116 C90 106 96 101 106 100 L126 96 Q135 94 140 97 Q146 101 143 107 L130 118 Q123 124 113 129 Q110 144 102 155 C95 169 79 176 58 184Z', '#e7ae87', '#253a3b', 2.4);
      shape('M87 144 Q97 138 108 127 L123 112 Q129 105 134 103 Q142 99 146 105 Q150 110 145 116 L133 128 L118 144 Q111 154 100 159', '#e7ae87', '#253a3b', 2.0);
      ctx.save();
      ctx.translate(50, 174);
      ctx.rotate(42 * Math.PI / 180);
      ctx.scale(0.66, 1.0);
      drawCuff(true);
      ctx.restore();
      ctx.restore();
    } else {
      const zip = tween(frame, 1858, 1888);
      rect('#1a2426', 0, 0, W, H);
      rect('#323f44', 60, 40, W - 120, H - 80);
      ctx.save();
      ctx.translate(480, 270);
      shape('M-240 -170 Q0 -218 240 -170 L264 168 Q0 218 -264 168Z', '#2d3a34', ink, 4.4);
      shape('M-204 -138 Q0 -174 204 -138 L220 132 Q0 168 -220 132Z', '#1b2420', ink, 3.2);
      for (const [x, y, c] of [[-120, -40, '#c74d44'], [-70, -34, '#d99e45'], [-20, -42, '#4e8a6b'], [40, -48, '#6ebce6'], [92, -48, '#6ebce6'], [-110, 56, '#d99e45']]) {
        rect(c, x - 20, y - 28, 40, 56);
      }
      oval(128, 56, 38, 38, '#8c969e', ink, 2.6);
      oval(128, 56, 16, 16, '#a88156', ink, 2.0);
      shape('M-60 22 H60 V94 H-60Z', '#f2ece1', ink, 2.6);
      rect('#c93832', -10, 34, 20, 48);
      rect('#c93832', -24, 48, 48, 20);
      ctx.save();
      ctx.translate(226, 40);
      ctx.rotate(-0.36);
      shape('M-10 -8 L78 -12 L96 8 L-10 14Z', '#d6e5ed', ink, 2.4);
      shape('M-64 -8 H-10 V12 H-64Z', '#20282e', ink, 2.4);
      ctx.restore();
      if (zip > 0.02) {
        shape(`M-240 -170 Q0 -218 240 -170 L${mix(240, 260, zip)} ${mix(-140, 86, zip)} Q0 ${mix(-110, 146, zip)} ${mix(-240, -260, zip)} ${mix(-140, 86, zip)}Z`, '#36453e', ink, 3.8);
        const zx = mix(-210, 210, zip), zy = mix(-132, 102, zip);
        shape(`M-216 ${zy} Q0 ${zy + 28} 216 ${zy}`, null, '#18201d', 6.5);
        rect('#b8c4c9', zx - 12, zy - 6, 24, 26);
      }
      ctx.restore();
    }
    drawCornerClock('00:37 AM', 1);
  }

  // SHOT 16 (f2285..2447, 1:35.2..1:42.0): Part 1 Cliffhanger — Official look-up Into Pale Gray Eastern Dawn (05:08 AM)!
  function drawShot16DawnCliffhanger(frame) {
    const p = tween(frame, 2285, 2447);
    const zoom = mix(1.0, 1.14, p);
    const dawn = tween(frame, 2295, 2430);

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `rgb(${Math.round(mix(16, 36, dawn))}, ${Math.round(mix(26, 52, dawn))}, ${Math.round(mix(42, 70, dawn))})`);
    sky.addColorStop(0.65, `rgb(${Math.round(mix(32, 92, dawn))}, ${Math.round(mix(46, 112, dawn))}, ${Math.round(mix(64, 132, dawn))})`);
    sky.addColorStop(1, `rgb(${Math.round(mix(44, 156, dawn))}, ${Math.round(mix(58, 166, dawn))}, ${Math.round(mix(74, 176, dawn))})`);
    rect(sky, 0, 0, W, H);
    rect('#111a24', 20, 260, 140, 280);
    rect('#0e1720', 180, 190, 120, 350);
    rect('#14202c', 640, 210, 130, 330);
    rect('#0d1620', 790, 120, 116, 420);
    if (Math.floor(frame / 14) % 2 === 0) oval(848, 112, 5, 5, '#ff4842');

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);
    window.drawAnatomyTurnaround(ctx, 480, 1300, 2.58, 'front', {
      hideLimbs: false,
      expression: frame < 2365 ? 'head-dread' : 'head-determined',
      headPitch: -0.62,
      eyeOffset: [0, -2.4],
    });
    shape('M444 334 Q480 344 516 332', null, '#b8322ecc', 6);
    shape('M394 372 L408 546 H438 L424 366Z M566 372 L552 546 H522 L536 366Z', '#26322d', ink, 2.8);
    rect(`rgba(196, 218, 232, ${0.14 * dawn})`, 0, 0, W, H);
    ctx.restore();
    drawCornerClock('05:08 AM', 1);
  }

  window.renderCh1cFrame = async (frame, cutout, anchors) => {
    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    if (frame < 164) {
      // Shot 1 (0:00..0:06.8): Upright steady WALKING down the midnight street (NOT sneaking!) + 1.5x pole parallax!
      const p = tween(frame, 0, 163);
      drawMidnightStreet(frame, p * 210, true);
      await drawArmoredLead(cutout, anchors, mix(155, 535, p), 468, 0.74);
      oval(420 - p * 95, 474, 260, 42, 'rgba(130, 174, 204, 0.13)');
      rect('#080d12ee', mix(890, -80, p), 0, 38, H);
      drawCornerClock('00:15 AM', 1);
    } else if (frame < 293) {
      drawShot2CoughLookUp(frame);
    } else if (frame < 351) {
      drawShot3SmokerRooftop(frame);
    } else if (frame < 490) {
      // Shot 4 (0:14.6..0:20.4): TRUE PHYSICS DRAG! Smoker upper-right pulls lead FORWARD-RIGHT (230 -> 510)
      // while he leans hard BACKWARD with both heels dug stiffly into asphalt & skid streaks trailing LEFT!
      const dragP = tween(frame, 361, 489);
      const shake = frame < 362 ? Math.sin((frame - 351) * 3.1) * 6 : (Math.sin(frame * 1.4) * 1.4);
      ctx.save();
      ctx.translate(shake, shake * 0.4);
      drawMidnightStreet(frame, 180 + dragP * 75, true);
      const wx = mix(235, 515, dragP);
      const sc = 0.78;
      // White asphalt skid streaks trailing LEFT behind his digging heels as he's dragged right!
      if (dragP > 0.03) {
        const tg = ctx.createLinearGradient(wx - 150, 468, wx + 45, 468);
        tg.addColorStop(0, 'rgba(206, 228, 240, 0)');
        tg.addColorStop(1, 'rgba(206, 228, 240, 0.48)');
        shape(`M${wx - 140} 467 L${wx + 42} 467 M${wx - 110} 472 L${wx + 12} 472`, null, tg, 3.2);
        for (let k = 0; k < 5; k++) {
          oval(wx - 14 - k * 14, 466 - ((frame + k * 2) % 6) * 2.2, 3, 2, '#e2f4ffcc');
        }
      }
      await drawArmoredLead(cutout, anchors, wx, 468, sc, { neckScuff: true });
      // Taut pulsing crimson barbed tongue pulling HARD toward upper-right rooftop (960, 22)!
      const ox = wx - 250 * sc, oy = 468 - 756 * sc;
      const nx = anchors?.neck ? ox + anchors.neck[0] * sc : wx - 10;
      const ny = anchors?.neck ? oy + anchors.neck[1] * sc : 300;
      shape(`M${nx} ${ny} L960 22`, null, '#7a1720', 10.5);
      shape(`M${nx} ${ny} L960 22`, null, '#d43f4b', 3.6);
      // Tension barbs along taut line
      for (const u of [0.18, 0.34, 0.50, 0.66, 0.82]) {
        const bx = mix(nx, 960, u), by = mix(ny, 22, u);
        shape(`M${bx} ${by} L${bx + 6} ${by - 10} L${bx + 12} ${by - 3}Z`, '#5c1118', ink, 1.4);
      }
      ctx.restore();
      drawCornerClock('00:15 AM', 1);
    } else if (frame < 615) {
      drawShot5ThroatAndCrashZoom(frame);
    } else if (frame < 730) {
      // Shot 6 (0:25.6..0:30.4): BUTTER-SMOOTH 24 FPS straight-arm 1-handed knife slash slicing tongue at f663 (27.625s)!
      const sliced = frame >= 663;
      const shake = (frame >= 663 && frame <= 669) ? Math.sin((frame - 663) * 3.1) * 7 : 0;
      ctx.save();
      ctx.translate(shake, shake * 0.5);
      drawMidnightStreet(frame, 240, true);
      const wx = 390, sc = 0.84;
      await drawArmoredLead(cutout, anchors, wx, 474, sc, { neckScuff: true, holdKnife: true, bentKnife: sliced });

      const ox = wx - 250 * sc, oy = 474 - 756 * sc;
      const nx = anchors?.neck ? ox + anchors.neck[0] * sc : wx + 12;
      const ny = anchors?.neck ? oy + anchors.neck[1] * sc : 284;
      const cutX = wx + 165, cutY = 236;

      if (!sliced) {
        shape(`M${nx} ${ny} Q${cutX} ${cutY + 12} 960 40`, null, '#8c1d27', 10);
        shape(`M${nx} ${ny} Q${cutX} ${cutY + 12} 960 40`, null, '#d4424e', 3.4);
      } else {
        const sp = clamp((frame - 663) / 28);
        shape(`M${mix(cutX, 880, sp)} ${mix(cutY, 64, sp)} Q${mix(cutX + 120, 920, sp)} ${mix(cutY - 40, 48, sp)} 960 36`, null, '#8c1d27', 9 * (1 - sp * 0.4));
        if (sp < 0.75) shape(`M${nx} ${ny} Q${nx + 36} ${ny + 24 + sp * 70} ${nx + 62} ${ny + 52 + sp * 110}`, null, '#8c1d27', 7);
        if (frame <= 674) {
          const sa = 1 - (frame - 663) / 12;
          shape(`M${wx + 20} 138 Q${wx + 230} 184 ${wx + 190} 364`, null, `rgba(235, 252, 255, ${sa})`, 14);
          shape(`M${wx + 26} 144 Q${wx + 218} 188 ${wx + 184} 354`, null, `rgba(255, 240, 150, ${sa * 0.85})`, 5);
        }
        const bp = clamp((frame - 663) / 36);
        for (const [vx, vy, r] of [[40, -35, 34], [-25, -50, 28], [80, 15, 38], [20, 40, 30], [110, -25, 26]]) {
          oval(cutX + vx * bp, cutY + vy * bp, r * (0.4 + bp), r * (0.35 + bp * 0.8), `rgba(132, 224, 118, ${(1 - bp) * 0.48})`);
        }
      }
      ctx.restore();
      drawCornerClock('00:16 AM', 1);
    } else if (frame < 840) {
      drawShot7BentKnifeInsert(frame);
    } else if (frame < 1018) {
      // Shot 8 (0:35.0..0:42.4): Full-speed OpenToonz sprintAt flight + rapid 1.65x foreground pole parallax wipes!
      const p = tween(frame, 840, 1017);
      const scroll = (frame - 840) * 14.5;
      drawMidnightStreet(frame, scroll, true);
      await drawArmoredLead(cutout, anchors, mix(240, 560, p), 470, 0.78, { neckScuff: true });
      const poleX = W + 120 - (((frame - 840) * 26) % (W + 320));
      rect('#070b0fee', poleX, 0, 44, H);
      rect('#121c24cc', poleX + 38, 0, 6, H);
      drawCornerClock('00:18 AM', 1);
    } else if (frame < 1167) {
      drawShot9MarketHordePeek(frame);
    } else if (frame < 1316) {
      drawShot10PebbleAndEyeDart(frame);
    } else if (frame < 1436) {
      drawShot11CarAlarmSmash(frame);
    } else if (frame < 1556) {
      // Shot 12 (0:59.8..1:04.8): ATHLETIC 24 FPS 1-HANDED HURDLE VAULT OVER STEEL ALLEY DUMPSTER & LOW COVER DUCK!
      const strobeOn = ((frame - 1380) % 14) < 7;
      drawMidnightStreet(frame, 390, false, strobeOn ? 0.45 : 0);
      rect('#121920', 0, 48, W, 396);
      rect('#1d2730', 30, 80, W - 60, 360);
      if (strobeOn) rect('rgba(255, 188, 62, 0.16)', 0, 0, W, H);

      // Align steel alley dumpster's top rim EXACTLY with athleticVaultScene palm contact (294, 516)!
      const wx = 430, wy = 472, sc = 0.78;
      const ox = wx - 250 * sc, oy = wy - 756 * sc;
      const rimX = ox + 294 * sc; // exact vertical palm contact x!
      const rimY = oy + 516 * sc; // exact vertical palm contact y!
      // Heavy dark-green steel dumpster positioned cleanly beneath vaulting hand & split hurdle legs!
      shape(`M${rimX - 42} ${rimY} H${rimX + 76} L${rimX + 68} ${wy + 4} H${rimX - 34}Z`, '#1f3328', ink, 3.6);
      rect('#2c4738', rimX - 48, rimY - 8, 130, 16);
      shape(`M${rimX - 48} ${rimY - 8} H${rimX + 82} V${rimY + 8} H${rimX - 48}Z`, null, ink, 3.2);
      rect('#15241c', rimX - 24, rimY + 28, 86, 10);
      rect('#15241c', rimX - 22, rimY + 62, 82, 10);

      // Athletic split-leg hurdle vault & deep low cover crouch behind far right side of dumpster!
      await drawArmoredLead(cutout, anchors, wx, wy, sc, { neckScuff: true, noShadow: true });
      drawCornerClock('00:35 AM', 1);
    } else if (frame < 1733) {
      drawShot13DumpsterStampede(frame);
    } else if (frame < 1901) {
      drawShot14MarketRaid(frame);
    } else if (frame < 2021) {
      // Shot 15A (1:19.2..1:24.2, 00:38 AM!): Sneaking quietly out the back market alley right as the car alarm sputters out!
      const p = tween(frame, 1901, 2020);
      const dyingStrobe = frame < 1954 && ((frame - 1380) % 14) < 5 ? 0.28 : 0;
      drawMidnightStreet(frame, 480 + p * 75, false, dyingStrobe);
      rect('#10171d', 0, 52, 220, 392);
      await drawArmoredLead(cutout, anchors, mix(250, 595, p), 472, 0.80, { bulgingPack: true, neckScuff: true });
      oval(480 - p * 70, 470, 260, 44, 'rgba(130, 174, 204, 0.13)');
      drawCornerClock('00:38 AM', 1);
    } else if (frame < 2088) {
      // Shot 15B-1 (1:24.2..1:27.0, 02:15 AM): Hours wandering shuttered storefronts testing locked metal doors!
      const p = tween(frame, 2021, 2087);
      drawMidnightStreet(frame, 740 + p * 110, false);
      // Shuttered commercial block with locked metal roll-down gates & barred doorway
      rect('#131b22', 90, 150, 780, 292);
      for (const gx of [130, 390, 650]) {
        rect('#202b34', gx, 230, 180, 212);
        for (let gy = 250; gy < 435; gy += 18) rect('#131b22', gx + 4, gy, 172, 3);
        rect('#36444f', gx + 76, 390, 28, 22); // Heavy padlock!
      }
      label('CLOSED', 480, 206, 22, '#697b87');
      await drawArmoredLead(cutout, anchors, mix(190, 580, p), 470, 0.74, { bulgingPack: true, neckScuff: true });
      // Dark foreground bus-stop shelter frame wiping smoothly past!
      rect('#080d12ea', mix(890, 140, p), 100, 26, H);
      drawCornerClock('02:15 AM', 1);
    } else if (frame < 2156) {
      // Shot 15B-2 (1:27.0..1:29.8, 03:40 AM): Different fogged block — wrecked city bus & stray sluggish infected far right!
      const p = tween(frame, 2088, 2155);
      drawMidnightStreet(frame, 1020 + p * 95, false);
      // Wrecked dark city bus silhouette angled on curb background-left
      shape('M60 434 L76 266 L430 262 L446 434Z', '#152028', ink, 3.2);
      for (const wx of [100, 180, 260, 340]) rect('#0d161e', wx, 288, 62, 54);
      oval(140, 436, 32, 32, '#0c1216', '#26343d', 2.4);
      oval(370, 436, 32, 32, '#0c1216', '#26343d', 2.4);
      // Distant sluggish stray infected swaying down a dark alley far right (he stays well clear!)
      drawInfected(810 + Math.sin(frame * 0.06) * 6, 444, 0.62, { facingRight: false, running: false, dark: true });
      await drawArmoredLead(cutout, anchors, mix(180, 495, p), 472, 0.74, { bulgingPack: true, neckScuff: true });
      oval(620 - p * 80, 466, 300, 48, 'rgba(130, 174, 204, 0.16)');
      drawCornerClock('03:40 AM', 1);
    } else if (frame < 2285) {
      // Shot 15C (1:29.8..1:35.2, 04:55 AM): Exhausted slow walk under first deep pre-dawn indigo light searching for open shelter!
      const p = tween(frame, 2156, 2284);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0e1726');
      sky.addColorStop(0.68, '#1d2d42');
      sky.addColorStop(1, '#2c4057');
      rect(sky, 0, 0, W, H);
      // Tall shuttered downtown apartment & office facades
      rect('#121a24', 20, 90, 210, 352);
      rect('#0f1720', 250, 60, 240, 382);
      rect('#141e29', 515, 110, 220, 332);
      rect('#0d151e', 755, 80, 190, 362);
      for (const bx of [54, 130, 286, 376, 552, 642]) {
        for (const by of [140, 205, 270]) rect('#1c2a38', bx, by, 44, 34);
      }
      rect('#1a242e', 0, 442, W, 98);
      rect('#293640', 0, 434, W, 10);
      for (let x = 40; x < W; x += 110) rect('#5e533244', x, 488, 54, 6);
      // Exhausted armored lead walking slower across the quiet indigo street with heavy bulging pack!
      await drawArmoredLead(cutout, anchors, mix(180, 610, p), 472, 0.78, { bulgingPack: true, neckScuff: true });
      oval(480 - p * 90, 474, 320, 46, 'rgba(146, 182, 210, 0.14)');
      drawCornerClock('04:55 AM', 1);
    } else {
      drawShot16DawnCliffhanger(frame);
    }

    ctx.drawImage(grain, 0, 0);
    const vig = ctx.createRadialGradient(480, 270, 260, 480, 270, 620);
    vig.addColorStop(0, '#050a0f00');
    vig.addColorStop(1, '#050a0f8c');
    rect(vig, 0, 0, W, H);

    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  };
})();
