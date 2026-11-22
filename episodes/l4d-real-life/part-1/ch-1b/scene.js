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
  let seed = 319;
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

  function drawCuff(armored = false) {
    shape('M-23 -2 Q0 2 25 -3 C26 17 32 33 39 56 L-41 56 C-35 38 -27 15 -23 -2Z', '#e8e1cc', '#253a3b', 2.4);
    shape('M-22 2 L-12 6 L-21 56 L-39 56 Q-27 25 -22 2Z', '#bab49f');
    shape('M-24 -3 Q1 0 25 -4 L28 13 Q2 19 -28 13Z', '#ede5d0', '#253a3b', 2.4);
    shape('M-25 9 Q2 14 25 8', null, '#a49c86', 1.2);
    oval(19, 7, 2.5, 2.5, '#c6bda8', '#8a8575', 0.8);
    if (armored) {
      // Corrugated cardboard & gray duct-tape forearm armor wrap right over the sleeve!
      shape('M-29 14 Q0 20 31 14 L38 56 L-40 56Z', '#a88156', '#253a3b', 2.2);
      shape('M-32 24 Q0 30 33 24 L35 36 Q0 42 -35 36Z', '#8c969e', '#253a3b', 1.8);
      shape('M-36 44 Q0 49 37 44 L39 54 Q0 58 -39 54Z', '#8c969e', '#253a3b', 1.6);
    }
  }

  // Subtle corner midnight clock badge (Nightmare Roulette style!)
  function drawCornerClock(text, alpha = 1) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    rect('#0b1218cc', 24, 22, 126, 36);
    shape('M24 22 H150 V58 H24Z', null, '#4d6472', 1.8);
    label(text, 87, 46, 16, '#ffd44d');
    ctx.restore();
  }

  // Helper to composite the 540x960 OpenToonz lead + tracked dark backpack & cardboard arm/shin armor!
  async function drawArmoredLead(cutout, anchors, worldX, worldFloorY, scale, flipLeft = false, darkTint = 0) {
    if (!cutout) return;
    const img = await loadPng(cutout);
    ctx.fillStyle = '#070c1088';
    ctx.beginPath();
    ctx.ellipse(worldX, worldFloorY, 46 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (flipLeft) {
      ctx.translate(worldX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-worldX, 0);
    }
    const ox = worldX - 250 * scale;
    const oy = worldFloorY - 756 * scale;

    // 1. Dark canvas backpack anchored behind chest!
    if (anchors?.chest) {
      const [cx, cy, ca] = anchors.chest;
      ctx.save();
      ctx.translate(ox + cx * scale, oy + cy * scale);
      ctx.rotate(ca * Math.PI / 180);
      ctx.scale(scale, scale);
      shape('M-54 -116 Q-64 -106 -64 -66 L-58 -8 Q-44 6 -24 2 L-22 -118 Q-38 -124 -54 -116Z', '#2d3a34', ink, 2.4);
      shape('M-60 -66 H-28 V-26 H-60Z', '#232e29', ink, 1.8);
      shape('M-58 -92 Q-42 -86 -26 -92', null, '#4a5c52', 2.0);
      ctx.restore();
    }

    // 2. Official OpenToonz character layer
    ctx.drawImage(img, ox, oy, 540 * scale, 960 * scale);

    // 3. Tracked backpack shoulder strap + corrugated cardboard & gray duct-tape forearm & shin wraps!
    const drawWrap = (anchor, len, w, yOff) => {
      if (!anchor) return;
      const [ax, ay, aa] = anchor;
      ctx.save();
      ctx.translate(ox + ax * scale, oy + ay * scale);
      ctx.rotate(aa * Math.PI / 180);
      ctx.scale(scale, scale);
      // Corrugated cardboard pad
      shape(`M${-w} ${yOff} H${w} L${w - 1.5} ${yOff + len} H${-w + 1.5}Z`, '#a88156', '#253a3b', 2.0);
      // Two gray duct-tape bands
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
    drawWrap(anchors?.shinFar, 54, 13, 18);
    drawWrap(anchors?.shinNear, 54, 14, 18);
    drawWrap(anchors?.forearmNear, 42, 10, 14);

    // Optional pitch-black blackout shadow tint over character
    if (darkTint > 0.02) {
      ctx.globalCompositeOperation = 'source-atop';
      rect(`rgba(10, 6, 8, ${darkTint})`, ox, oy, 540 * scale, 960 * scale);
    }
    ctx.restore();
  }

  // Reusable hunched common infected silhouette (side view facing left or right)
  function drawHallwayZombie(x, y, scale, armRaise = 0, headTurnLeft = 0, darkRed = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const bodyCol = darkRed ? '#1b1114' : '#313d42';
    const skinCol = darkRed ? '#2e1d20' : '#657573';
    oval(0, 0, 42, 7, '#060a0d99');
    // Legs
    shape('M-16 -96 L-28 -44 -20 0 -4 0 -10 -46 2 -96Z', '#222c30', ink, 2.2);
    shape('M4 -96 L22 -46 14 0 32 0 38 -48 18 -96Z', '#2a363b', ink, 2.2);
    // Hunched jagged torso leaning right toward Apt 708 door
    shape('M-22 -92 Q-28 -148 4 -176 L34 -168 Q40 -132 22 -90Z', bodyCol, ink, 2.4);
    // Outstretched pounding arms slamming right!
    const ay = -152 - armRaise * 28;
    shape(`M14 -162 L62 ${ay} L88 ${ay + 8} L84 ${ay + 22} L54 ${ay + 12} L10 -146Z`, bodyCol, ink, 2.2);
    oval(90, ay + 15, 9, 8, skinCol, ink, 1.8);
    // Pale-eyed infected head (turns sharply left toward dropped phone when headTurnLeft > 0!)
    const hx = 28 - headTurnLeft * 18;
    const hy = -194;
    oval(hx, hy, 22, 24, skinCol, ink, 2.4);
    // Tattered dark hair wisps
    shape(`M${hx - 20} ${hy - 6} Q${hx - 12} ${hy - 28} ${hx + 16} ${hy - 22} Q${hx + 24} ${hy - 12} ${hx + 18} ${hy - 2} L${hx + 8} ${hy - 12} L${hx - 4} ${hy - 8}Z`, '#1b2326', ink, 1.8);
    // Glowing pale eyes!
    if (headTurnLeft > 0.25) {
      oval(hx - 10, hy - 2, 4.2, 3.2, '#e6f5cc');
      oval(hx - 2, hy - 2, 4.2, 3.2, '#e6f5cc');
      shape(`M${hx - 14} ${hy + 10} Q${hx - 6} ${hy + 6} ${hx + 2} ${hy + 11}`, '#2a1214', ink, 1.8);
    } else {
      oval(hx + 14, hy - 2, 3.8, 3.0, '#d8ebba');
    }
    ctx.restore();
  }

  // SHOT 1 (f0..100, 0:00..0:04.2): Studio POV chalk-grip scratching 5th diagonal tally mark on dark plaster!
  function drawShot1WallTally(frame) {
    const zoom = mix(1.0, 1.09, tween(frame, 0, 100));
    const slash = tween(frame, 36, 62);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Textured dark apartment wall beside window edge
    const wall = ctx.createLinearGradient(0, 0, W, H);
    wall.addColorStop(0, '#18242c');
    wall.addColorStop(0.6, '#23333d');
    wall.addColorStop(1, '#121b22');
    rect(wall, 0, 0, W, H);
    for (let x = 80; x < W; x += 140) rect('#0e171e44', x, 0, 2, H);
    // Subtle late-day window light strip on right edge
    rect('rgba(235, 178, 114, 0.10)', 760, 0, 200, H);

    // Four existing white chalk tally marks + 5th diagonal line drawn live by hand!
    const tx = 410, ty = 175;
    for (let i = 0; i < 4; i++) {
      shape(`M${tx + i * 38} ${ty} L${tx + i * 38 - 6} ${ty + 152}`, null, '#ece4d0', 9);
    }
    if (slash > 0.01) {
      const sx0 = tx - 26, sy0 = ty + 128;
      const sx1 = mix(sx0, tx + 150, slash);
      const sy1 = mix(sy0, ty + 24, slash);
      shape(`M${sx0} ${sy0} L${sx1} ${sy1}`, null, '#f8f2e4', 10);
      // Tiny chalk dust flecks falling during scratch!
      if (slash < 0.98) {
        for (let k = 0; k < 5; k++) {
          oval(sx1 + (k - 2) * 7, sy1 + 10 + (frame % 7) * 5 + k * 4, 2, 2, '#f2ead8aa');
        }
      }
    }
    label('DAY 5', 472, 128, 20, '#9bb0ba');

    // Exact studio SVG #chalk-grip right hand from hands/reference-sheet.svg + long cream sleeve!
    const hx = mix(tx - 26, tx + 150, slash);
    const hy = mix(ty + 128, ty + 24, slash);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(1.92, 1.92);
    ctx.translate(-152, -56);
    // Long cream shirt sleeve running cleanly off bottom-left
    shape('M-160 360 L44 162 L92 198 L-96 390Z', '#e8e1cc', '#253a3b', 2.4);
    shape('M108 134 L145 142 Q151 151 141 161 Q127 170 106 172 L96 154Z', '#c58b72', '#253a3b', 1.9);
    shape('M112 118 L156 127 Q162 139 150 148 Q136 156 116 154 L106 138Z', '#d2977a', '#253a3b', 2.0);
    shape('M116 102 L159 105 Q168 116 157 129 Q143 139 122 137 L110 120Z', '#dda484', '#253a3b', 2.1);
    shape('M56 160 Q72 142 84 122 Q95 104 110 92 Q121 82 135 76 Q145 73 153 77 Q160 82 156 90 Q152 96 144 96 L128 97 Q122 106 123 122 L127 156 Q113 172 90 183 L80 188Z', '#e7ae87', '#253a3b', 2.4);
    shape('M74 148 Q87 126 100 110 Q112 97 127 89 Q114 106 111 124 Q96 141 80 153Z', '#f3c39d');
    ctx.save();
    ctx.translate(150, 96);
    ctx.rotate(14 * Math.PI / 180);
    ctx.translate(-150, -96);
    shape('M142 54 Q149 51 156 54 L156 116 Q149 119 142 116Z', '#f2ead8', '#253a3b', 1.9);
    ctx.restore();
    shape('M90 158 Q100 144 108 132 Q115 120 124 110 L137 95 Q143 89 149 93 Q154 98 149 105 L136 121 Q128 132 122 144 Q114 157 100 168', '#e7ae87', '#253a3b', 2.3);
    shape('M138 95 Q143 92 146 96 Q147 100 143 103 L138 104 Q136 100 138 95Z', '#f1c2a8', '#b98573', 0.85);
    ctx.save();
    ctx.translate(68, 173);
    ctx.rotate(36 * Math.PI / 180);
    ctx.scale(0.76, 0.95);
    drawCuff(false);
    ctx.restore();
    ctx.restore();
    ctx.restore();
  }

  // SHOT 2 (f101..167, 0:04.2..0:07.0): Official Rear OTS 7F Window Day-to-Midnight Time-Lapse!
  function drawShot2OtsWindowLapse(frame) {
    const night = tween(frame, 108, 160);
    const zoom = mix(1.0, 1.09, tween(frame, 101, 167));

    ctx.save();
    ctx.translate(540, 250);
    ctx.scale(zoom, zoom);
    ctx.translate(-540, -250);

    rect('#121b23', 0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 28, 0, 440);
    const r0 = Math.round(mix(196, 8, night)), g0 = Math.round(mix(124, 15, night)), b0 = Math.round(mix(72, 26, night));
    const r1 = Math.round(mix(238, 18, night)), g1 = Math.round(mix(154, 28, night)), b1 = Math.round(mix(92, 46, night));
    sky.addColorStop(0, `rgb(${r0},${g0},${b0})`);
    sky.addColorStop(1, `rgb(${r1},${g1},${b1})`);
    rect(sky, 270, 28, 650, 412);
    // Skyline towers + Apex Tower red blinking beacon
    rect('#0e151e', 295, 190, 96, 250);
    rect('#121c27', 410, 128, 118, 312);
    rect('#0c131c', 550, 160, 108, 280);
    rect('#101924', 680, 96, 126, 344);
    rect('#0b111a', 822, 178, 86, 262);
    if (night > 0.4 && Math.floor(frame / 14) % 2 === 0) oval(743, 88, 5, 5, '#ff4842');
    // Setting sun -> rising cold moon arc
    if (night < 0.5) oval(490, mix(140, 410, night * 2), 34, 34, 'rgba(255, 224, 152, 0.72)');
    else oval(835, mix(360, 96, (night - 0.5) * 2), 20, 20, 'rgba(220, 238, 255, 0.85)');

    shape('M270 28 H920 V440 H270Z', null, '#152028', 12);
    rect('#152028', 592, 28, 10, 412);
    rect('#152028', 270, 232, 650, 10);
    rect('#222f38', 256, 438, 680, 18);

    // Official Rear Over-the-Shoulder Series Lead observing from window!
    window.drawAnatomyTurnaround(ctx, 214, 1126, 2.08, 'rear');
    ctx.restore();
    drawCornerClock('00:00 AM', tween(frame, 136, 158));
  }

  // SHOT 3 (f168..239, 0:07.0..0:10.0): High-Angle Aerial Street -> Stepped 1.35x Push-In on Sluggish Midnight Zombies!
  function drawShot3MidnightStreet(frame) {
    const camZ = frame < 200 ? mix(1.0, 1.08, tween(frame, 168, 199)) : mix(1.32, 1.44, tween(frame, 200, 239));
    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(camZ, camZ);
    ctx.translate(-480, -270);

    rect('#0b121a', 0, 0, W, H);
    rect('#151e27', 0, 95, W, 350);
    for (let x = 20; x < W; x += 90) rect('#6a5b3644', x, 265, 48, 8);
    rect('#1e2730', 0, 0, W, 95);
    rect('#1e2730', 0, 445, W, 95);

    // Warm dim amber streetlamp pools
    for (const lx of [240, 560, 820]) {
      const g = ctx.createRadialGradient(lx, 115, 8, lx, 115, 160);
      g.addColorStop(0, 'rgba(246, 202, 118, 0.34)');
      g.addColorStop(1, 'rgba(246, 202, 118, 0)');
      rect(g, lx - 170, 0, 340, 320);
    }

    // Sluggish, barely swaying midnight infected silhouettes (very slow drift!)
    for (let i = 0; i < 10; i++) {
      const rx = 140 + i * 78 + Math.sin(frame * 0.04 + i) * 5;
      const ry = 145 + ((i * 67) % 240) + Math.cos(frame * 0.03 + i) * 3;
      oval(rx, ry + 14, 14, 5, '#05080b88');
      shape(`M${rx - 9} ${ry - 6} L${rx + 8} ${ry - 8} ${rx + 10} ${ry + 12} ${rx - 10} ${ry + 12}Z`, '#28343a', ink, 1.6);
      oval(rx + 1, ry - 12, 7.5, 7.5, '#526369', ink, 1.4);
    }
    ctx.restore();
    drawCornerClock('00:00 AM', 1);
  }

  // SHOTS 4 & 5 (f240..371, 0:10.0..0:15.5): Overhead Top-Down Counter Packing Montage!
  function drawShot45Packing(frame, knifeBeat) {
    rect('#222c33', 0, 0, W, H);
    rect('#4b5860', 40, 30, W - 80, H - 60);
    rect('#3a454d', 52, 42, W - 104, H - 84);

    const zip = knifeBeat ? tween(frame, 340, 362) : 0;
    const jolt = knifeBeat && frame >= 360 && frame <= 366 ? Math.sin((frame - 360) * 2.5) * 3.5 : 0;

    ctx.save();
    ctx.translate(480 + jolt, 270);
    // Open dark canvas backpack centered on counter
    shape('M-190 -160 Q0 -195 190 -160 L210 150 Q0 185 -210 150Z', '#2d3a34', ink, 4);
    shape('M-162 -130 Q0 -158 162 -130 L176 122 Q0 148 -176 122Z', '#1b2420', ink, 3);

    // Supplies already inside or dropping in!
    const drop1 = knifeBeat ? 1 : tween(frame, 246, 266);
    const drop2 = knifeBeat ? 1 : tween(frame, 266, 286);
    const drop3 = knifeBeat ? 1 : tween(frame, 284, 302);
    // 3 Food cans
    ctx.save();
    ctx.translate(mix(260, -90, drop1), mix(-120, -45, drop1));
    for (const [cx, cy, col] of [[0, 0, '#c74d44'], [46, 4, '#d99e45'], [92, -2, '#4e8a6b']]) {
      rect(col, cx - 18, cy - 24, 36, 48);
      shape(`M${cx - 18} ${cy - 24} H${cx + 18} V${cy + 24} H${cx - 18}Z`, null, ink, 2.2);
      rect('#f5ebd4', cx - 14, cy - 10, 28, 16);
    }
    ctx.restore();
    // 2 Water bottles
    ctx.save();
    ctx.translate(mix(-260, 75, drop2), mix(140, -52, drop2));
    for (const wx of [0, 52]) {
      shape(`M${wx - 16} -38 H${wx + 16} V42 H${wx - 16}Z`, '#a9dcf5', ink, 2.2);
      rect('#6ebce6', wx - 14, -8, 28, 46);
      rect('#f2f8fc', wx - 9, -50, 18, 12);
    }
    ctx.restore();
    // White Red-Cross First-Aid Pouch
    ctx.save();
    ctx.translate(mix(240, -50, drop3), mix(160, 62, drop3));
    shape('M-64 -38 H64 V38 H-64Z', '#f2ece1', ink, 2.6);
    rect('#c93832', -10, -24, 20, 48);
    rect('#c93832', -24, -10, 48, 20);
    ctx.restore();

    if (knifeBeat) {
      // Thin stainless kitchen knife sliding cleanly into the backpack side sheath!
      const tuck = tween(frame, 310, 336);
      ctx.save();
      ctx.translate(mix(300, 118, tuck), mix(120, 48, tuck));
      ctx.rotate(-0.42);
      shape('M-10 -12 L126 -12 Q146 -8 160 12 L-10 22Z', '#d6e5ed', ink, 2.4);
      shape('M-92 -10 H-10 V16 H-92Z', '#20282e', ink, 2.4);
      ctx.restore();
      // Canvas flap & zipper closing cleanly across top!
      if (zip > 0.02) {
        shape(`M-190 -160 Q0 -195 190 -160 L${mix(190, 204, zip)} ${mix(-140, 70, zip)} Q0 ${mix(-120, 110, zip)} ${mix(-190, -204, zip)} ${mix(-140, 70, zip)}Z`, '#36453e', ink, 3.6);
        // Zipper track & slider pull
        const zx = mix(-165, 165, zip);
        const zy = mix(-130, 80, zip);
        shape(`M-170 ${zy} Q0 ${zy + 24} 170 ${zy}`, null, '#18201d', 6);
        rect('#b8c4c9', zx - 10, zy - 6, 20, 24);
      }
    }
    ctx.restore();
  }

  // SHOTS 6 & 7 (f372..494, 0:15.5..0:20.6): Tight Cardboard & Gray Duct-Tape Armor Wrap Inserts!
  function drawShot67ArmorWrap(frame, isShin) {
    const start = isShin ? 444 : 372;
    const tape1 = tween(frame, start + 14, start + 34);
    const tape2 = tween(frame, start + 30, start + 48);
    const zoom = mix(1.0, 1.08, tween(frame, start, start + 50));

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    rect('#162028', 0, 0, W, H);
    rect('#222f38', 0, 390, W, 150);

    if (!isShin) {
      // Forearm (cream dress shirt sleeve & right hand) horizontally across center!
      shape('M80 218 H720 V322 H80Z', '#e8e1cc', '#253a3b', 3.4);
      shape('M80 288 H720 V322 H80Z', '#c8c1ac');
      // Cuff & clean studio SVG right hand extending horizontally out of cuff!
      shape('M640 214 H724 V326 H640Z', '#ede5d0', '#253a3b', 3.2);
      oval(690, 294, 6, 6, '#c6bda8', '#8a8575', 1.4);
      ctx.save();
      ctx.translate(722, 270);
      ctx.rotate(Math.PI / 2);
      ctx.scale(1.22, 1.22);
      // Studio SVG #palm fingers & palm from hands/reference-sheet.svg
      shape('M-24 0 C-36 -8 -45 -24 -46 -40 L-49 -64 Q-56 -72 -62 -86 Q-65 -94 -58 -98 Q-51 -102 -45 -94 L-33 -74 L-33 -114 Q-33 -124 -25 -124 Q-17 -124 -17 -114 L-15 -78 L-11 -128 Q-11 -138 -3 -138 Q5 -138 5 -128 L6 -80 L12 -124 Q13 -134 21 -134 Q29 -133 28 -123 L23 -76 L32 -110 Q34 -119 41 -118 Q48 -116 46 -107 L35 -60 C35 -36 32 -14 24 0Z', '#e7ae87', '#253a3b', 2.4);
      shape('M-24 -44 Q0 -52 24 -44 M-20 -26 Q0 -33 20 -26', null, '#c2876f', 1.8);
      ctx.restore();

      // Corrugated brown cardboard armor sheet wrapped over forearm!
      shape('M230 202 H600 V336 H230Z', '#a88156', ink, 3.4);
      for (let y = 216; y < 330; y += 16) rect('#8a664088', 234, y, 362, 4);

      // Two thick gray duct-tape bands pulling snugly across cardboard!
      if (tape1 > 0.02) {
        const h1 = 152 * tape1;
        rect('#8c969e', 300, 194, 72, h1);
        shape(`M300 194 H372 V${194 + h1} H300Z`, null, ink, 2.8);
        rect('#aeb8c088', 312, 196, 16, Math.max(0, h1 - 4));
      }
      if (tape2 > 0.02) {
        const h2 = 152 * tape2;
        rect('#8c969e', 474, 194, 72, h2);
        shape(`M474 194 H546 V${194 + h2} H474Z`, null, ink, 2.8);
        rect('#aeb8c088', 486, 196, 16, Math.max(0, h2 - 4));
      }
      // Silver duct-tape roll pulling off bottom on tape2!
      if (tape2 > 0.05 && tape2 < 0.96) {
        oval(510, 194 + 152 * tape2 + 44, 46, 46, '#8c969e', ink, 3.2);
        oval(510, 194 + 152 * tape2 + 44, 20, 20, '#a88156', ink, 2.4);
      }
    } else {
      // Charcoal-blue trouser shin standing vertically above brown shoe!
      shape('M394 40 H566 L546 436 H414Z', '#465366', ink, 3.6);
      shape('M394 40 H448 L456 436 H414Z', '#374456');
      // Brown shoe at bottom
      shape('M406 436 H554 Q620 448 630 486 Q624 510 564 510 H396 Q386 480 406 436Z', '#60453d', ink, 3.4);
      rect('#ead8b5', 396, 492, 224, 16);
      // Corrugated cardboard shin guard + gray duct-tape bands!
      shape('M386 116 H574 L560 398 H400Z', '#a88156', ink, 3.4);
      for (let x = 408; x < 556; x += 22) rect('#8a664088', x, 120, 5, 274);
      if (tape1 > 0.02) {
        const w1 = 204 * tape1;
        rect('#8c969e', 378, 164, w1, 56);
        shape(`M378 164 H${378 + w1} V220 H378Z`, null, ink, 2.8);
      }
      if (tape2 > 0.02) {
        const w2 = 186 * tape2;
        rect('#8c969e', 387, 304, w2, 56);
        shape(`M387 304 H${387 + w2} V360 H387Z`, null, ink, 2.8);
      }
    }
    ctx.restore();
  }

  // SHOT 8 (f495..546, 0:20.6..0:22.8): Dramatic LOW-ANGLE Armored Gear-Up Hold!
  function drawShot8LowAngleGearUp(frame) {
    const zoom = mix(1.0, 1.11, tween(frame, 495, 546));
    const breath = Math.sin(frame * 0.14) * 1.6;
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a121a');
    bg.addColorStop(1, '#16232e');
    rect(bg, 0, 0, W, H);
    // Barricaded door left + midnight window right
    rect('#2b221c', 48, 86, 146, 454);
    rect('#4b3526', 64, 128, 122, 412);
    rect('#0b1117', 716, 44, 210, 310);
    rect('#0c1724', 724, 52, 194, 294);
    shape('M716 44 H926 V354 H716Z', null, '#152028', 8);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Official Dramatic Low-Angle Front Series Lead (headPitch -0.68, head-determined!)
    ctx.save();
    ctx.scale(1.06, 1.0);
    window.drawAnatomyTurnaround(ctx, 453, 1296 + breath, 2.52, 'front', {
      hideLimbs: false,
      expression: 'head-determined',
      headPitch: -0.68,
      eyeOffset: [0, -0.8],
    });
    ctx.restore();
    // Dark canvas backpack straps gripping both shoulders cleanly!
    shape(`M378 ${372 + breath} Q392 ${450 + breath} 388 ${546 + breath} H414 Q418 ${450 + breath} 404 ${366 + breath}Z`, '#26322d', ink, 2.6);
    shape(`M582 ${372 + breath} Q568 ${450 + breath} 572 ${546 + breath} H546 Q542 ${450 + breath} 556 ${366 + breath}Z`, '#26322d', ink, 2.6);
    ctx.restore();
    drawCornerClock('00:00 AM', 1);
  }

  // Midnight Apartment backdrop for Shot 9 (quiet bookshelf pull-back)
  function drawMidnightApartment(shelfOpen = 0) {
    const wall = ctx.createLinearGradient(0, 0, 0, 450);
    wall.addColorStop(0, '#0a121b');
    wall.addColorStop(1, '#162431');
    rect(wall, 0, 0, W, H);
    rect('#121a20', 0, 438, W, 10);
    rect('#24201c', 0, 448, W, H - 448);

    // Front Door 704
    rect('#11191f', 42, 146, 98, 294);
    rect('#322923', 48, 152, 86, 288);
    oval(122, 302, 5, 5, '#c4a158', ink, 1.5);
    oval(122, 278, 4, 4, '#c4a158', ink, 1.5);

    // Bookshelf sliding gently right (from x=84 flush on door -> x=196!)
    const bx = 84 + shelfOpen * 112;
    rect('#221812', bx, 186, 74, 254);
    rect('#443022', bx + 4, 190, 66, 246);
    for (const sy of [234, 286, 338, 390]) {
      rect('#261a12', bx + 6, sy, 62, 6);
      rect('#612b30', bx + 10, sy - 28, 10, 28);
      rect('#2c444d', bx + 22, sy - 32, 12, 32);
      rect('#7d6740', bx + 36, sy - 26, 9, 26);
    }

    // Dark gaming desk & moonlit window far right
    rect('#211a15', 310, 336, 140, 12);
    rect('#151b20', 340, 248, 92, 66);
    rect('#121c24', 346, 254, 80, 54);
    rect('#0b1117', 744, 96, 176, 236);
    rect('#0e1c2e', 750, 102, 164, 224);
    shape('M744 96 H920 V332 H744Z', null, '#152028', 7);
    // Faint blue moonlight shaft
    shape('M750 102 L914 102 L680 540 L480 540Z', 'rgba(116, 168, 226, 0.08)');
  }

  // SHOT 10 (f624..683, 0:26.0..0:28.5): Studio SVG pov-door-lock Unlock WITH cardboard-taped cuff!
  function drawShot10UnlockDoor(frame) {
    const turn = tween(frame, 642, 656); // Vertical LOCKED -> Horizontal UNLOCKED at 0:27.0!
    const crack = tween(frame, 664, 683);

    rect('#1e1814', 0, 0, W, H);
    rect('#2e2520', 140, 0, 680, H);
    // Thin glowing sickly-green fluorescent hallway slit opening along right edge of door!
    if (crack > 0.02) {
      rect('#496b54', 816 - crack * 32, 0, crack * 38, H);
      const g = ctx.createLinearGradient(816, 0, 640, 0);
      g.addColorStop(0, `rgba(148, 212, 160, ${0.38 * crack})`);
      g.addColorStop(1, 'rgba(148, 212, 160, 0)');
      rect(g, 600, 0, 240, H);
    }
    rect('#121a20', 816, 0, 18, H);

    const bx = 540 - crack * 26, by = 248;
    oval(bx, by, 82, 82, '#7d6136', ink, 3.8);
    oval(bx, by, 64, 64, '#b8944f', ink, 2.6);

    const reach = tween(frame, 624, 640);
    ctx.save();
    ctx.translate(mix(280, bx - 90, reach), mix(360, by + 44, reach));
    ctx.rotate(mix(0.24, -0.18, turn));
    ctx.scale(2.05, 2.05);
    ctx.translate(-122, -124);
    shape('M-160 310 L46 154 L88 192 L-110 380Z', '#a88156', '#253a3b', 2.4); // Armored forearm!
    shape('M91 147 Q101 147 111 140 C117 146 113 158 105 162 Q97 166 88 161Z', '#c78c73', '#253a3b', 1.7);
    shape('M108 126 Q116 117 125 121 Q127 131 126 140 L121 153 Q117 160 111 157 Q106 155 107 148 L110 136Z', '#ce9479', '#253a3b', 1.7);
    shape('M120 108 Q133 102 142 110 Q147 116 145 125 L143 145 Q142 153 137 154 Q131 153 130 148 L129 131 Q126 126 119 126Z', '#dba382', '#253a3b', 1.8);
    shape('M40 165 Q61 148 72 132 L84 116 C90 106 96 101 106 100 L126 96 Q135 94 140 97 Q146 101 143 107 L130 118 Q123 124 113 129 Q110 144 102 155 C95 169 79 176 58 184Z', '#e7ae87', '#253a3b', 2.4);
    ctx.restore();

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(mix(Math.PI / 2, 0, turn));
    shape('M-54 -14 H54 Q62 0 54 14 H-54 Q-62 0 -54 -14Z', '#e0ba72', ink, 3.0);
    ctx.restore();

    ctx.save();
    ctx.translate(mix(280, bx - 90, reach), mix(360, by + 44, reach));
    ctx.rotate(mix(0.24, -0.18, turn));
    ctx.scale(2.05, 2.05);
    ctx.translate(-122, -124);
    shape('M87 144 Q97 138 108 127 L123 112 Q129 105 134 103 Q142 99 146 105 Q150 110 145 116 L133 128 L118 144 Q111 154 100 159', '#e7ae87', '#253a3b', 2.0);
    shape('M134 106 Q139 103 143 106 Q145 109 142 112 L137 116 Q133 115 131 111Z', '#f1c2a8', '#b98573', 0.85);
    ctx.save();
    ctx.translate(50, 174);
    ctx.rotate(42 * Math.PI / 180);
    ctx.scale(0.66, 1.0);
    drawCuff(true); // Cardboard & gray duct tape visible on cuff!
    ctx.restore();
    ctx.restore();
    drawCornerClock('00:02 AM', 1);
  }

  // Reusable 7th-floor flickering green fluorescent hallway backdrop (supports normal, blackout & crimson EXIT mode!)
  function draw7fHallway(frame, opts = {}) {
    const { blackout = false, flicker = 1.0, zombieArm = 0, zombieTurn = 0, zombieX = 685, phoneOnTile = false, phoneBright = false } = opts;

    if (blackout) {
      rect('#050608', 0, 0, W, H);
      // Faint crimson battery EXIT glow far right!
      rect('#7a1216', 842, 74, 78, 30);
      label('EXIT', 881, 96, 18, '#ff5c54');
      const rg = ctx.createRadialGradient(880, 96, 10, 740, 260, 620);
      rg.addColorStop(0, 'rgba(255, 42, 38, 0.34)');
      rg.addColorStop(0.55, 'rgba(180, 22, 24, 0.14)');
      rg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      rect(rg, 0, 0, W, H);
      // Faint silhouettes of doors & hallway baseboard
      rect('#120a0c', 0, 444, W, 96);
      rect('#140c0e', 60, 148, 92, 296);
      rect('#140c0e', 726, 148, 98, 296);
    } else {
      const wall = ctx.createLinearGradient(0, 0, 0, 446);
      wall.addColorStop(0, '#182422');
      wall.addColorStop(0.65, '#273832');
      wall.addColorStop(1, '#1a2623');
      rect(wall, 0, 0, W, H);
      // Tile floor
      rect('#293330', 0, 444, W, 96);
      for (let x = 0; x < W; x += 64) rect('#19211f88', x, 444, 2, 96);
      rect('#121a18', 0, 438, W, 8);

      // Flickering overhead fluorescent tubes
      for (const fx of [220, 560]) {
        rect('#202b28', fx - 64, 14, 128, 12);
        rect(`rgba(218, 255, 224, ${0.85 * flicker})`, fx - 56, 20, 112, 7);
        const fg = ctx.createRadialGradient(fx, 28, 12, fx, 140, 320);
        fg.addColorStop(0, `rgba(176, 244, 192, ${0.24 * flicker})`);
        fg.addColorStop(1, 'rgba(176, 244, 192, 0)');
        rect(fg, fx - 340, 0, 680, 460);
      }

      // Apt 704 left, Apt 706 center-left, Apt 708 right (pounding target!), STAIRS door far right + red EXIT sign!
      for (const [dx, num] of [[52, '704'], [340, '706'], [738, '708']]) {
        rect('#121a18', dx, 148, 92, 292);
        rect('#3d322a', dx + 6, 154, 80, 286);
        rect('#2a221c', dx + 16, 174, 60, 96);
        label(num, dx + 46, 140, 15, '#c4b89b');
      }
      // Red EXIT sign & STAIRS doorway far right
      rect('#521418', 854, 76, 74, 28);
      label('EXIT', 891, 96, 17, '#ff6860');
      rect('#1a2224', 862, 148, 86, 292);
      label('STAIRS', 905, 224, 12, '#8fa69d');
    }

    // Dropped smartphone on hallway tile (f1020..1285)
    if (phoneOnTile) {
      if (phoneBright) {
        const pg = ctx.createRadialGradient(470, 468, 6, 470, 468, 120);
        pg.addColorStop(0, 'rgba(92, 186, 255, 0.55)');
        pg.addColorStop(1, 'rgba(92, 186, 255, 0)');
        rect(pg, 330, 340, 280, 200);
      }
      shape('M454 464 H486 L492 474 H450Z', phoneBright ? '#68c4ff' : '#1b262e', ink, 1.8);
    }

    // Pounding Apt 708 Infected!
    drawHallwayZombie(zombieX, 462, 1.0, zombieArm, zombieTurn, blackout);
  }

  // SHOT 11 (f684..839, 0:28.5..0:35.0): Door-Crack POV -> Stepped 1.45x Push-In on Apt 708 Pounding Zombie!
  function drawShot11DoorCrackAndZombie(frame) {
    const flicker = (frame % 29 === 0 || frame % 43 === 0) ? 0.35 : 0.92;
    // Rhythmic pounding beat synced to score THUDs (30.8s=f739, 32.4s=f778, 34.0s=f816)
    const poundPhase = Math.max(0, Math.sin((frame - 726) * 0.163));

    if (frame < 763) {
      // Narrow door-crack POV looking down flickering corridor
      draw7fHallway(frame, { flicker, zombieArm: poundPhase, zombieX: 676 });
      // Dark foreground door edge left & door jamb right framing the tense peep slit!
      rect('#090d10', 0, 0, 220, H);
      rect('#1e1814', 214, 0, 14, H);
      rect('#090d10', 810, 0, 150, H);
      rect('#141c20', 804, 0, 10, H);
    } else {
      // Stepped 1.45x Push-In onto the hunched zombie hammering Apt 708!
      const zoom = mix(1.42, 1.54, tween(frame, 763, 839));
      const thudShake = poundPhase > 0.85 ? Math.sin(frame * 3.2) * 3.5 : 0;
      ctx.save();
      ctx.translate(480 + thudShake, 270 + thudShake * 0.5);
      ctx.scale(zoom, zoom);
      ctx.translate(-680, -320);
      draw7fHallway(frame, { flicker, zombieArm: poundPhase, zombieX: 676 });
      ctx.restore();
    }
    drawCornerClock('00:04 AM', 1);
  }

  // SHOT 13 (f1020..1108, 0:42.5..0:46.2): Overhead Tile Phone Drop -> Tight 1.55x Zombie Snap-Turn!
  function drawShot13PhoneDropAndTurn(frame) {
    if (frame < 1056) {
      // Overhead hallway linoleum tiles — phone drops & smacks face-up flaring blinding blue!
      const drop = tween(frame, 1022, 1036);
      const bounce = frame >= 1036 && frame <= 1044 ? Math.sin(Math.PI * (frame - 1036) / 8) * 18 : 0;
      const lit = frame >= 1036;
      rect('#222b29', 0, 0, W, H);
      for (let x = 0; x < W; x += 120) rect('#151c1a', x, 0, 4, H);
      for (let y = 0; y < H; y += 120) rect('#151c1a', 0, y, W, 4);

      const px = mix(380, 480, drop), py = mix(120, 290, drop) - bounce;
      if (lit) {
        const bg = ctx.createRadialGradient(px, py, 16, px, py, 320);
        bg.addColorStop(0, 'rgba(98, 196, 255, 0.56)');
        bg.addColorStop(1, 'rgba(98, 196, 255, 0)');
        rect(bg, 0, 0, W, H);
      }
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(mix(-0.4, 0.24, drop));
      shape('M-52 -98 Q-52 -110 -40 -110 H40 Q52 -110 52 -98 V98 Q52 110 40 110 H-40 Q-52 110 -52 98Z', '#151c22', ink, 3.2);
      rect(lit ? '#1c4f7a' : '#10181e', -44, -90, 88, 180);
      if (lit) {
        label('00:07', 0, -24, 24, '#e6f7ff');
        label('NO SIGNAL', 0, 12, 12, '#ffd44d');
        if (frame < 1048) shape('M-76 -26 L-96 -34 M76 -26 L96 -34 M-70 30 L-90 42 M70 30 L90 42', null, '#cceeffaa', 3);
      }
      ctx.restore();
    } else {
      // DEAD SILENCE! Tight 1.55x cut on Apt 708: fists freeze mid-air, pale-eyed head slowly jerks left!
      const turn = tween(frame, 1068, 1094);
      const zoom = mix(1.52, 1.66, tween(frame, 1056, 1108));
      ctx.save();
      ctx.translate(480, 270);
      ctx.scale(zoom, zoom);
      ctx.translate(-680, -305);
      draw7fHallway(frame, { flicker: 0.9, zombieArm: 0.55, zombieTurn: turn, zombieX: 676, phoneOnTile: true, phoneBright: true });
      ctx.restore();
      // Eerie blue phone light glow from lower-left hitting the turning zombie!
      const bl = ctx.createRadialGradient(120, 480, 20, 320, 380, 480);
      bl.addColorStop(0, 'rgba(92, 188, 255, 0.28)');
      bl.addColorStop(1, 'rgba(92, 188, 255, 0)');
      rect(bl, 0, 0, W, H);
    }
    drawCornerClock('00:07 AM', 1);
  }

  // SHOT 14 (f1109..1223, 0:46.2..0:51.0): Startled glance-back -> SNAPPY 5-FRAME OFF-CENTER ECU CRASH-ZOOM DREAD!
  function drawShot14GlanceAndCrashZoom(frame) {
    // Flickering dark green corridor behind him
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0e1715');
    bg.addColorStop(1, '#1b2924');
    rect(bg, 0, 0, W, H);

    if (frame < 1157) {
      // Official side-profile startled glance-back frozen mid-crouch, lit blue from below by dropped phone!
      const jolt = frame < 1117 ? Math.sin((frame - 1109) * 2.4) * 5 : 0;
      const zoom = mix(1.0, 1.09, tween(frame, 1109, 1156));
      ctx.save();
      ctx.translate(480 + jolt, 316);
      ctx.scale(zoom * 2.18, zoom * 2.18);
      window.drawFaceAngle(ctx, 0, 0, 1.0, 'glance-back', { flip: false, expression: 'head-alarm', headAngle: -6 });
      // Dark canvas backpack shoulder strap & pack edge for full wardrobe continuity!
      shape('M-52 54 Q-64 78 -62 118 H-36 Q-36 82 -26 56Z', '#2d3a34', ink, 1.5);
      shape('M-22 52 Q-8 82 -6 118 H8 Q6 80 -8 50Z', '#222c27', ink, 1.4);
      ctx.restore();
      // Blue upward phone glow on chin!
      const pg = ctx.createRadialGradient(480, 520, 20, 480, 460, 380);
      pg.addColorStop(0, 'rgba(88, 188, 255, 0.42)');
      pg.addColorStop(1, 'rgba(88, 188, 255, 0)');
      rect(pg, 0, 0, W, H);
    } else {
      // 5-FRAME SNAPPY OFF-CENTER ECU CRASH-ZOOM DREAD (Nightmare Roulette 2:05 technique!)
      const crash = tween(frame, 1157, 1163);
      const creep = tween(frame, 1163, 1223);
      const zoom = 2.65 + 4.45 * crash + 0.55 * creep;
      const panX = 480 - 76 * crash - 12 * creep;
      const panY = 270 + 18 * crash;
      const shake = frame <= 1168 ? Math.sin(frame * 3.1) * 7 * (1 - (frame - 1157) / 11) : Math.sin(frame * 1.4) * 1.8;
      const sweat = 0.25 + 0.75 * tween(frame, 1157, 1220);

      window.drawAnatomyTurnaround(ctx, panX + shake, panY + 434 * zoom + shake * 0.4, zoom, 'front', {
        hideLimbs: false,
        expression: 'head-dread',
        eyeOffset: [0, 0],
        sweat,
        dreadWash: 0.45 + 0.55 * crash,
      });
      const pg = ctx.createRadialGradient(480, 520, 20, 480, 460, 420);
      pg.addColorStop(0, 'rgba(88, 188, 255, 0.28)');
      pg.addColorStop(1, 'rgba(88, 188, 255, 0)');
      rect(pg, 0, 0, W, H);
    }
    drawCornerClock('00:07 AM', 1);
  }

  // SHOT 16 (f1380..1451, 0:57.5..1:00.5): Studio SVG bell-press jabbing dead unlit elevator call button!
  function drawShot16DeadElevator(frame) {
    rect('#151c20', 0, 0, W, H);
    rect('#253036', 220, 0, 520, H);
    // Scratched stainless steel call plate
    shape('M540 130 H660 V360 H540Z', '#5a6870', ink, 3.6);
    shape('M554 144 H646 V346 H554Z', '#74848c', '#3c484f', 2);
    // Dead unlit circular call buttons (up & down)
    oval(600, 214, 24, 24, '#2b3338', ink, 3);
    oval(600, 214, 17, 17, '#3f4a50', ink, 1.8);
    oval(600, 286, 24, 24, '#2b3338', ink, 3);
    oval(600, 286, 17, 17, '#3f4a50', ink, 1.8);
    label('OUT OF POWER', 600, 172, 10, '#2a3338');

    // Two distinct futile button jabs (f1400 & f1422)!
    const jab1 = Math.sin(Math.PI * clamp((frame - 1392) / 18));
    const jab2 = Math.sin(Math.PI * clamp((frame - 1414) / 18));
    const press = Math.max(jab1, jab2);

    // Exact studio SVG #bell-press hand from hands/reference-sheet.svg WITH cardboard armor cuff!
    ctx.save();
    ctx.translate(mix(410, 446, press), 258);
    ctx.scale(1.88, 1.88);
    ctx.translate(-90, -96);
    shape('M-240 245 L44 134 L82 174 L-190 315Z', '#a88156', '#253a3b', 2.4); // Armored sleeve
    shape('M104 143 Q120 142 126 149 Q129 156 120 160 Q107 163 94 157Z', '#c2876f', '#253a3b', 1.9);
    shape('M113 130 Q133 128 139 136 Q142 145 132 149 Q117 152 103 145Z', '#cf9378', '#253a3b', 2.0);
    shape('M122 114 Q144 112 150 121 Q153 131 142 136 Q127 139 113 132Z', '#dba081', '#253a3b', 2.1);
    shape('M48 137 Q68 122 87 108 Q101 99 116 97 Q128 96 142 93 L163 89 Q169 88 172 92 Q173 97 167 99 L148 104 Q135 108 124 115 L112 145 Q93 155 68 161Z', '#e7ae87', '#253a3b', 2.4);
    shape('M64 130 L90 112 Q103 103 118 102 Q125 102 132 104 Q118 109 107 120 Q92 132 72 137Z', '#f3c39d');
    shape('M161 90 Q167 89 170 92 Q169 96 164 96 L160 94Z', '#f1c2a8', '#b98573', 0.85);
    shape('M88 137 Q96 127 104 120 Q112 114 122 114 L135 115 Q143 116 143 123 Q142 129 134 130 L120 131 Q109 135 98 144 Q92 149 84 152', '#e7ae87', '#253a3b', 2.2);
    ctx.save();
    ctx.translate(55, 148);
    ctx.rotate(59 * Math.PI / 180);
    ctx.scale(0.66, 0.78);
    drawCuff(true);
    ctx.restore();
    ctx.restore();
  }

  // SHOT 17 (f1452..1595, 1:00.5..1:06.5): Real OpenToonz Walking Descent Down Red-Lit Concrete Stairs (7F -> 1F LOBBY)!
  async function drawShot17RedStairwellWalk(frame, cutout, anchors) {
    const flk = 0.85 + 0.15 * Math.sin(frame * 0.45);
    const flight2 = frame >= 1524;

    rect('#140b0e', 0, 0, W, H);
    rect('#22161a', 52, 0, W - 104, H);
    // Red emergency battery lamp overhead casting eerie crimson wash
    rect('#84171b', 420, 16, 120, 20);
    const rg = ctx.createRadialGradient(480, 36, 14, 480, 190, 500);
    rg.addColorStop(0, `rgba(255, 52, 46, ${0.34 * flk})`);
    rg.addColorStop(1, 'rgba(255, 52, 46, 0)');
    rect(rg, 0, 0, W, H);

    if (!flight2) {
      // Flight 1 (f1452..1523): 7F descending LEFT -> RIGHT on exact diagonal concrete steps!
      const p = tween(frame, 1452, 1523);
      label('7F', 150, 112, 46, 'rgba(232, 204, 190, 0.36)');
      label('STAIRS', 760, 112, 22, 'rgba(232, 204, 190, 0.28)');
      // Back wall handrail
      shape('M110 162 L850 488', null, '#150d10', 8);
      // Solid concrete staircase mass + 11 crisp stepped treads (slope dy/dx = 0.44)
      shape('M52 208 H160 L820 498 H908 V540 H52Z', '#1b1114', ink, 3);
      for (let i = 0; i < 11; i++) {
        const sx = 160 + i * 60;
        const sy = 208 + i * 26.4;
        rect('#36262b', sx, sy, 66, 32);
        shape(`M${sx} ${sy} H${sx + 66} V${sy + 26.4}`, null, '#140c0f', 2.8);
      }
      // OpenToonz armored lead walking smoothly down every concrete tread with clean headroom!
      const wx = mix(205, 735, p);
      const wy = 208 + (wx - 160) * 0.44 + 14;
      await drawArmoredLead(cutout, anchors, wx, wy, 0.60, false);
      // Foreground dark steel banister bar & posts for depth
      shape('M90 242 L840 572', null, '#120a0d', 10);
      for (const px of [210, 440, 670]) rect('#120a0dcc', px, 242 + (px - 90) * 0.44, 8, 120);
    } else {
      // Flight 2 (f1524..1595): Descending RIGHT -> LEFT down onto 1F — LOBBY landing facing the LOBBY steel door!
      const pDesc = tween(frame, 1524, 1574);
      const pFlat = tween(frame, 1574, 1595);
      label('1F — LOBBY', 700, 108, 36, 'rgba(232, 204, 190, 0.38)');
      // Heavy steel LOBBY exit door on flat 1F landing (left side)
      rect('#2d1f23', 82, 174, 150, 278);
      shape('M82 174 H232 V452 H82Z', null, '#10090b', 5);
      label('LOBBY', 157, 240, 20, '#ead4c8');
      rect('#a6968a', 104, 322, 106, 14);
      // Back wall handrail
      shape('M850 180 L360 408', null, '#150d10', 8);
      // Solid concrete floor + mirrored descending steps (x=780..370, y=218..452)
      shape('M52 452 H370 L780 218 H908 V540 H52Z', '#1b1114', ink, 3);
      rect('#291c20', 52, 452, 330, 88);
      for (let i = 0; i < 9; i++) {
        const sx = 780 - (i + 1) * 45.5;
        const sy = 218 + i * 26.0;
        rect('#36262b', sx, sy, 52, 30);
        shape(`M${sx} ${sy} H${sx + 52}`, null, '#140c0f', 2.8);
      }
      // OpenToonz armored lead walking left down the last flight onto the 1F floor!
      const wx = frame < 1574 ? mix(748, 372, pDesc) : mix(372, 274, pFlat);
      const wy = frame < 1574 ? 218 + (780 - wx) * 0.57 + 10 : 460;
      await drawArmoredLead(cutout, anchors, wx, wy, 0.62, true);
      // Foreground dark railing corner post
      shape('M860 250 L380 470', null, '#120a0d', 10);
    }
    drawCornerClock('00:11 AM', 1);
  }

  // Helper: Dark moonlit 1F apartment lobby backdrop (reused by 18A pillar lean-out & 18D emphasized glass throw!)
  function draw1fLobbyBackdrop(frame, zombieShift = 0, zombieTurn = 0) {
    const wall = ctx.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, '#091119');
    wall.addColorStop(1, '#182531');
    rect(wall, 0, 0, W, H);
    // Glossy polished dark lobby tile floor with subtle reflection grid
    rect('#1f2b33', 0, 442, W, 98);
    for (let x = 0; x < W; x += 80) rect('#121a2066', x, 442, 2, 98);
    rect('#2d3e4a44', 0, 444, W, 14);
    // Huge street-facing glass exit doors on right (moonlit street fog outside!)
    rect('#122230', 600, 92, 310, 350);
    const fog = ctx.createLinearGradient(600, 92, 600, 442);
    fog.addColorStop(0, '#102030');
    fog.addColorStop(1, '#2d4659');
    rect(fog, 610, 102, 290, 338);
    shape('M600 92 H910 V442 H600Z', null, '#10181e', 10);
    rect('#10181e', 752, 92, 8, 350);
    // Pale moonlight puddle across lobby floor
    const ml = ctx.createLinearGradient(600, 442, 340, 540);
    ml.addColorStop(0, 'rgba(130, 184, 224, 0.16)');
    ml.addColorStop(1, 'rgba(130, 184, 224, 0)');
    rect(ml, 220, 442, 690, 98);

    // 3 Hunched lobby zombies blocking glass exit -> snap left & chase glass sound!
    for (const [idx, baseX, baseY, sc] of [[0, 668, 456, 0.86], [1, 748, 464, 0.92], [2, 822, 458, 0.88]]) {
      const zx = baseX - zombieShift * (290 + idx * 24);
      const stepBob = zombieShift > 0.02 ? Math.abs(Math.sin(frame * 0.42 + idx * 1.4)) * 5 : 0;
      drawHallwayZombie(zx, baseY - stepBob, sc, 0.08 * Math.sin(frame * 0.12 + idx) + (zombieTurn > 0.3 ? 0.25 : 0), zombieTurn > 0.2 ? 1 : 0, false);
    }
  }

  // SHOT 18A (f1596..1679, 1:06.5..1:10.0): Reach 1F Lobby — Lean Past Marble Pillar & Spot 3 Infected!
  function drawShot18ALobbyLean(frame) {
    draw1fLobbyBackdrop(frame, 0, 0);
    // Dark marble lobby pillar foreground-left
    rect('#0d141b', 0, 0, 198, H);
    rect('#18232d', 180, 0, 22, H);
    // Official Rear OTS Series Lead physically leaning out from behind pillar WITH dark canvas backpack!
    const lean = tween(frame, 1602, 1636);
    ctx.save();
    ctx.translate(mix(160, 232, lean), 540);
    ctx.rotate(mix(0, 0.11, lean));
    ctx.translate(-218, -540);
    window.drawAnatomyTurnaround(ctx, 218, 1110, 1.98, 'rear');
    shape('M146 374 Q218 348 290 374 L298 548 H138Z', '#2d3a34', ink, 3.0);
    shape('M162 436 H274 V526 H162Z', '#222d28', ink, 2.4);
    shape('M152 406 Q218 422 284 406', null, '#495b52', 2.4);
    shape('M144 374 Q166 346 184 352 L176 382Z M292 374 Q270 346 252 352 L260 382Z', '#1f2924', ink, 2.2);
    ctx.restore();
    drawCornerClock('00:13 AM', 1);
  }

  // SHOT 18B (f1680..1756, 1:10.0..1:13.2): Brief Panic Behind Pillar -> Steadying Breath -> Eye-Dart & Look-Down!
  function drawShot18BPanicAndThink(frame) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a121a');
    bg.addColorStop(1, '#162430');
    rect(bg, 0, 0, W, H);
    // Dark marble lobby pillar edge right behind his shoulder!
    rect('#0c131a', 650, 0, 310, H);
    rect('#1a2733', 642, 0, 14, H);

    const isThinking = frame >= 1713;
    const thinkP = tween(frame, 1713, 1746);
    const zoom = mix(1.0, 1.09, tween(frame, 1680, 1756));
    const tremble = !isThinking ? Math.sin(frame * 2.6) * 2.4 : 0;
    const breath = !isThinking ? Math.sin(frame * 0.55) * 3.0 : Math.sin(frame * 0.16) * 1.2;

    ctx.save();
    ctx.translate(450 + tremble, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-450, -270);
    window.drawAnatomyTurnaround(ctx, 430, 1310 + breath, 2.58, 'front', {
      hideLimbs: false,
      expression: !isThinking ? (frame < 1696 ? 'head-alarm' : 'head-dread') : 'head-determined',
      headPitch: isThinking ? mix(0, 0.58, thinkP) : -0.06,
      eyeOffset: isThinking ? [mix(0, 4.0, thinkP), mix(0, 2.6, thinkP)] : [-1.8, -0.5],
      sweat: !isThinking ? 0.72 : mix(0.65, 0.15, thinkP),
      dreadWash: !isThinking ? 0.35 : mix(0.35, 0.0, thinkP),
    });
    // Dark backpack straps on shoulders
    shape(`M352 ${384 + breath} L364 ${554 + breath} H390 L378 ${378 + breath}Z M508 ${384 + breath} L496 ${554 + breath} H470 L482 ${378 + breath}Z`, '#26322d', ink, 2.6);
    ctx.restore();
    drawCornerClock('00:13 AM', 1);
  }

  // SHOT 18C (f1757..1819, 1:13.2..1:15.8): Floor Insert — Broken Glass Vase Shards + Taped-Cuff Hand Pickup!
  function drawShot18CBrokenVasePickup(frame) {
    const zoom = mix(1.0, 1.07, tween(frame, 1757, 1819));
    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Dark polished lobby tile floor beside marble pillar base
    rect('#19242c', 0, 0, W, H);
    for (let x = 0; x < W; x += 130) rect('#10171c', x, 0, 4, H);
    for (let y = 0; y < H; y += 130) rect('#10171c', 0, y, W, 4);
    rect('#0e151c', 0, 0, 160, H);
    rect('#1b2731', 156, 0, 10, H);
    // Cool moonlight beam catching the broken glass!
    const glow = ctx.createRadialGradient(470, 270, 24, 470, 270, 320);
    glow.addColorStop(0, 'rgba(160, 224, 255, 0.22)');
    glow.addColorStop(1, 'rgba(160, 224, 255, 0)');
    rect(glow, 0, 0, W, H);

    // Shattered translucent pale-teal glass vase base lying on its side (left-center)
    oval(338, 294, 96, 36, '#09101588');
    shape('M244 268 Q272 204 360 214 L404 246 L378 274 L416 306 L342 332 Q264 328 244 268Z', 'rgba(148, 212, 232, 0.72)', '#233b44', 3.0);
    shape('M262 252 Q298 224 352 232 L338 252 Q290 246 262 252Z', 'rgba(232, 250, 255, 0.65)');
    // Scattered gleaming glass vase shards around the floor
    for (const pts of [
      'M432 192 L478 176 L466 218Z',
      'M392 346 L448 338 L428 378Z',
      'M296 364 L334 352 L322 390Z',
      'M488 342 L532 356 L502 384Z',
    ]) {
      shape(pts, 'rgba(164, 226, 246, 0.78)', '#233b44', 2.4);
    }

    // Grabbing hand (studio SVG pinch anatomy WITH taped cardboard cuff!) reaching in to scoop the heavy hero glass shard!
    const reach = tween(frame, 1768, 1794);
    const lift = tween(frame, 1796, 1819);
    const shardX = mix(512, 690, lift);
    const shardY = mix(274, 340, lift);
    const shardRot = mix(0, 0.24, lift);

    // Heavy hero jagged glass vase shard (lifts cleanly with hand!)
    ctx.save();
    ctx.translate(shardX, shardY);
    ctx.rotate(shardRot);
    shape('M-44 -14 L18 -46 L52 4 L12 42 L-38 24Z', 'rgba(176, 236, 255, 0.88)', '#1d323b', 3.0);
    shape('M-22 -8 L14 -32 L24 -12 L-10 10Z', 'rgba(245, 253, 255, 0.78)');
    // Moonlight glint sparkle on pickup moment!
    if (frame >= 1790 && frame <= 1804) {
      const s = 1 - Math.abs(frame - 1797) / 8;
      shape(`M0 ${-30 * s} L${6 * s} ${-6 * s} L${30 * s} 0 L${6 * s} ${6 * s} L0 ${30 * s} L${-6 * s} ${6 * s} L${-30 * s} 0 L${-6 * s} ${-6 * s}Z`, '#ffffffcc');
    }
    ctx.restore();

    // Taped-cuff studio SVG pinching hand from bottom-right!
    const hx = mix(840, 560, reach) + lift * 178;
    const hy = mix(460, 294, reach) + lift * 66;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(-1.95, 1.95);
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
    ctx.restore();
    drawCornerClock('00:13 AM', 1);
  }

  // SHOT 18D (f1820..1948, 1:15.8..1:21.2): EMPHASIZED GLASS VASE SHARD THROW — Double Bounce + Long Spinning Floor Slide + Loud Acoustic Ripples!
  function drawShot18DGlassBounceAndSlide(frame) {
    const turn = tween(frame, 1852, 1864);
    const lure = tween(frame, 1866, 1948);
    // Subtle 2-frame camera jolt right on loud Bounce #1 (f1847)!
    const impactShake = (frame >= 1847 && frame <= 1850) ? Math.sin((frame - 1847) * 3.1) * 3.2 : 0;

    ctx.save();
    ctx.translate(impactShake, impactShake * 0.5);
    draw1fLobbyBackdrop(frame, lure, turn);

    // Compute exact glass shard arc -> Bounce #1 (f1847) -> Bounce #2 (f1868) -> Long Spinning/Rattling Floor Slide (f1869..1916)!
    let gx = 560, gy = 310, grot = 0, visible = false, skidTrail = 0;
    if (frame >= 1822 && frame < 1847) {
      // Throw arc across dark lobby
      const t = (frame - 1822) / 25;
      gx = mix(570, 368, t);
      gy = mix(304, 466, t) - Math.sin(Math.PI * t) * 140;
      grot = t * 5.2;
      visible = true;
      // Faint curved throw motion streak
      shape(`M${gx + 26} ${gy - 14} Q${gx + 64} ${gy - 36} ${gx + 105} ${gy - 20}`, null, 'rgba(186, 236, 255, 0.28)', 2.4);
    } else if (frame >= 1847 && frame < 1868) {
      // Bounce #1 -> Bounce #2 parabolic hop!
      const t = (frame - 1847) / 21;
      gx = mix(368, 248, t);
      gy = 466 - Math.sin(Math.PI * t) * 72;
      grot = 5.2 + t * 5.6;
      visible = true;
    } else if (frame >= 1868) {
      // EMPHASIZED LONG SPINNING & RATTLING SLIDE ACROSS POLISHED FLOOR (f1868..1918)!
      const t = clamp((frame - 1868) / 50);
      const decel = 1 - Math.pow(1 - t, 2.2);
      gx = mix(248, 84, decel);
      const chatter = t < 0.92 ? Math.abs(Math.sin((frame - 1868) * 1.9)) * 3.8 * (1 - t) : 0;
      gy = 468 - chatter;
      grot = 10.8 + decel * 8.4;
      skidTrail = decel;
      visible = true;
    }

    // Polished-floor bright scratch/skid motion trail behind the sliding glass shard!
    if (skidTrail > 0.02) {
      const trailAlpha = Math.max(0.14, 0.65 * (1 - clamp((frame - 1906) / 36)));
      const tg = ctx.createLinearGradient(gx, 468, 248, 468);
      tg.addColorStop(0, `rgba(216, 246, 255, ${trailAlpha})`);
      tg.addColorStop(1, 'rgba(160, 224, 255, 0)');
      shape(`M${gx + 8} 468 L248 468`, null, tg, 4.2);
      shape(`M${gx + 14} 472 L240 471`, null, tg, 1.8);
    }

    // Emphasized concentric acoustic soundwave rings for BOUNCE #1 (f1847), BOUNCE #2 (f1868), and SLIDING SCRAPE PULSES!
    const drawSoundPulse = (cx, cy, startF, span, maxR, strong = true) => {
      if (frame < startF || frame > startF + span) return;
      const p = (frame - startF) / span;
      const alpha = (1 - p) * (strong ? 0.96 : 0.72);
      // Outer & inner elliptical floor soundwave ripples (bold & legible at phone size!)
      oval(cx, cy, 18 + p * maxR, 7 + p * maxR * 0.42, null, `rgba(210, 246, 255, ${alpha})`, strong ? 3.8 : 2.6);
      if (p > 0.12) {
        const p2 = (p - 0.12) / 0.88;
        oval(cx, cy, 12 + p2 * maxR * 0.76, 5 + p2 * maxR * 0.30, null, `rgba(255, 228, 130, ${alpha * 0.88})`, strong ? 2.8 : 2.0);
      }
      // Sharp radial noise accent burst ticks on impact frames!
      if (strong && p < 0.44) {
        const r0 = 20 + p * 40, r1 = 44 + p * 64;
        for (const ang of [-2.7, -2.15, -1.6, -1.05, -0.45]) {
          shape(`M${cx + Math.cos(ang) * r0} ${cy + Math.sin(ang) * r0} L${cx + Math.cos(ang) * r1} ${cy + Math.sin(ang) * r1}`, null, `rgba(255, 244, 196, ${alpha})`, 3.2);
        }
      }
    };
    drawSoundPulse(368, 466, 1847, 26, 168, true);  // HUGE BOUNCE #1 SOUNDWAVE!
    drawSoundPulse(248, 468, 1868, 24, 138, true);  // CRISP BOUNCE #2 SOUNDWAVE!
    drawSoundPulse(202, 468, 1875, 18, 96, false);  // Sliding skitter ripple #1
    drawSoundPulse(156, 468, 1884, 18, 88, false);  // Sliding skitter ripple #2
    drawSoundPulse(116, 468, 1894, 20, 82, false);  // Sliding skitter ripple #3
    drawSoundPulse(88, 468, 1906, 20, 68, false);   // Final rattling settle ripple!

    // Tiny flying glass splinters scattering off Bounce #1!
    if (frame >= 1847 && frame <= 1878) {
      const sp = (frame - 1847) / 31;
      for (const [vx, vy] of [[-58, -36], [42, -44], [-96, -22], [24, -26]]) {
        const sx = 368 + vx * sp;
        const sy = 466 + vy * sp + 56 * sp * sp;
        if (sy <= 474) shape(`M${sx - 5} ${sy} L${sx + 4} ${sy - 5} L${sx + 5} ${sy + 4}Z`, '#d8f4ff', '#1b2f38', 1.4);
      }
    }

    // Draw the jagged translucent glass vase shard itself (1.35x bolder, spinning + glinting brightly!)
    if (visible) {
      oval(gx, 470, 18, 5, '#05090d99');
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(grot);
      ctx.scale(1.35, 1.35);
      shape('M-15 -5 L6 -14 L17 2 L4 13 L-12 8Z', 'rgba(182, 238, 255, 0.96)', '#182b34', 2.2);
      shape('M-7 -2 L5 -9 L8 -3 L-2 3Z', '#ffffffdd');
      ctx.restore();
    }

    ctx.restore();
    drawCornerClock('00:13 AM', 1);
  }

  window.renderCh1bFrame = async (frame, cutout, anchors) => {
    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    if (frame < 101) {
      drawShot1WallTally(frame);
    } else if (frame < 168) {
      drawShot2OtsWindowLapse(frame);
    } else if (frame < 240) {
      drawShot3MidnightStreet(frame);
    } else if (frame < 307) {
      drawShot45Packing(frame, false);
    } else if (frame < 372) {
      drawShot45Packing(frame, true);
    } else if (frame < 444) {
      drawShot67ArmorWrap(frame, false);
    } else if (frame < 495) {
      drawShot67ArmorWrap(frame, true);
    } else if (frame < 547) {
      drawShot8LowAngleGearUp(frame);
    } else if (frame < 624) {
      // Shot 9 (0:22.8..0:26.0): Quiet bookshelf pull-back in midnight apartment!
      const open = tween(frame, 558, 608);
      drawMidnightApartment(open);
      await drawArmoredLead(cutout, anchors, mix(258, 368, open), 474, 0.78, true);
      drawCornerClock('00:00 AM', 1);
    } else if (frame < 684) {
      drawShot10UnlockDoor(frame);
    } else if (frame < 840) {
      drawShot11DoorCrackAndZombie(frame);
    } else if (frame < 1020) {
      // Shot 12 (0:35.0..0:42.5): Dynamic OpenToonz sneakAt crouch-creep + foreground hallway doorway parallax wipes!
      const p = tween(frame, 840, 1019);
      const flicker = (frame % 31 === 0) ? 0.35 : 0.92;
      const pound = Math.max(0, Math.sin((frame - 726) * 0.163));
      draw7fHallway(frame, { flicker, zombieArm: pound, zombieX: 676 });
      await drawArmoredLead(cutout, anchors, mix(155, 515, p), 466, 0.68, false);
      // Dark foreground hallway doorway pillar wiping smoothly across lens at 1.45x speed!
      const wipeX = mix(820, 140, p);
      rect('#080d0ee6', wipeX, 0, 52, H);
      rect('#162120aa', wipeX + 46, 0, 6, H);
      drawCornerClock('00:06 AM', 1);
    } else if (frame < 1109) {
      drawShot13PhoneDropAndTurn(frame);
    } else if (frame < 1224) {
      drawShot14GlanceAndCrashZoom(frame);
    } else if (frame < 1380) {
      // Shot 15 (0:51.0..0:57.5): Fluorescent stutter -> PITCH BLACKOUT -> Crimson EXIT silhouette escape!
      const isDark = frame >= 1245;
      const flick = (frame === 1230 || frame === 1231 || frame === 1238 || frame === 1239) ? 0.12 : 0.95;
      const blindLunge = isDark ? tween(frame, 1254, 1318) : 0;
      const escP = isDark ? tween(frame, 1280, 1379) : 0;
      const pickedUp = frame >= 1265;
      draw7fHallway(frame, {
        blackout: isDark,
        flicker: flick,
        zombieArm: 0.9,
        zombieTurn: 1,
        zombieX: 676 - blindLunge * 270,
        phoneOnTile: !pickedUp,
        phoneBright: !isDark && !pickedUp,
      });
      if (isDark) {
        await drawArmoredLead(cutout, anchors, mix(468, 864, escP), 466, 0.68, false, 0.62);
      }
      drawCornerClock('00:08 AM', isDark ? 0.65 : 1);
    } else if (frame < 1452) {
      drawShot16DeadElevator(frame);
    } else if (frame < 1596) {
      await drawShot17RedStairwellWalk(frame, cutout, anchors);
    } else if (frame < 1680) {
      drawShot18ALobbyLean(frame);
    } else if (frame < 1757) {
      drawShot18BPanicAndThink(frame);
    } else if (frame < 1820) {
      drawShot18CBrokenVasePickup(frame);
    } else if (frame < 1949) {
      drawShot18DGlassBounceAndSlide(frame);
    } else {
      // Shot 18E (1:21.2..1:25.0): Armored lead glides out lobby glass doors into foggy midnight street!
      const p = tween(frame, 1949, 2039);
      const zoom = mix(1.0, 1.12, p);
      ctx.save();
      ctx.translate(580, 310);
      ctx.scale(zoom, zoom);
      ctx.translate(-580, -310);
      // Dark foggy midnight city sky & distant apartment silhouettes
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#070e16');
      sky.addColorStop(0.7, '#152533');
      sky.addColorStop(1, '#1e3242');
      rect(sky, 0, 0, W, H);
      // Distant dark skyline silhouettes across the street
      rect('#0d1620', 310, 140, 130, 304);
      rect('#0a121a', 454, 96, 156, 348);
      rect('#0e1924', 626, 162, 140, 282);
      rect('#0b141d', 780, 118, 170, 326);
      // Asphalt street + wet curb + broken yellow lane dashes
      rect('#19232b', 0, 442, W, 98);
      rect('#293640', 0, 434, W, 10);
      for (let x = 280; x < W; x += 110) rect('#5e533255', x, 488, 54, 6);
      // Tall flickering amber streetlamp pole & warm cone right!
      rect('#182128', 816, 56, 12, 384);
      shape('M816 64 L760 76 L760 88 L816 80Z', '#222d36', ink, 2);
      oval(766, 86, 14, 7, '#ffe09c');
      const lg = ctx.createRadialGradient(766, 92, 10, 766, 260, 270);
      lg.addColorStop(0, 'rgba(246, 202, 118, 0.34)');
      lg.addColorStop(1, 'rgba(246, 202, 118, 0)');
      rect(lg, 460, 40, 500, 460);
      // Abandoned wrecked sedan silhouette parked along the fogged curb far-right!
      shape('M648 424 L672 384 L746 376 L798 408 L852 414 L858 438 L644 438Z', '#111a21', ink, 2.4);
      shape('M682 390 L740 384 L774 406 L678 406Z', '#1f303d', ink, 1.6);
      oval(690, 438, 18, 18, '#0b1014', '#26343d', 2.4);
      oval(816, 438, 18, 18, '#0b1014', '#26343d', 2.4);
      // Open apartment lobby glass exit doorway on left
      rect('#101920', 0, 48, 250, 396);
      rect('#1e3140', 148, 72, 94, 370);
      shape('M148 72 H242 V442 H148Z', null, '#0b1116', 5);
      // Armored lead gliding silently out onto the foggy street (larger hero framing!)
      await drawArmoredLead(cutout, anchors, mix(310, 620, p), 474, 0.84, false);
      // Drifting low midnight fog wisps across boots & road!
      const fogShift = p * 56;
      oval(420 - fogShift, 468, 240, 44, 'rgba(130, 174, 204, 0.14)');
      oval(760 - fogShift * 0.7, 452, 260, 52, 'rgba(130, 174, 204, 0.12)');
      // Foreground dark marble lobby pillar wiping past left edge!
      rect('#090f14e8', mix(220, -90, p), 0, 72, H);
      ctx.restore();
      drawCornerClock('00:14 AM', 1);
    }

    // Film grain & cinematic horror vignette
    ctx.drawImage(grain, 0, 0);
    const vig = ctx.createRadialGradient(480, 270, 260, 480, 270, 620);
    vig.addColorStop(0, '#050a0f00');
    vig.addColorStop(1, '#050a0f8c');
    rect(vig, 0, 0, W, H);

    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  };
})();
