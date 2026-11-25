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

  // Film/cutout texture grain (960x540)
  const grain = document.createElement('canvas');
  grain.width = W;
  grain.height = H;
  const gctx = grain.getContext('2d');
  let seed = 217;
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

  function drawCuff() {
    shape('M-23 -2 Q0 2 25 -3 C26 17 32 33 39 56 L-41 56 C-35 38 -27 15 -23 -2Z', '#e8e1cc', '#253a3b', 2.4);
    shape('M-22 2 L-12 6 L-21 56 L-39 56 Q-27 25 -22 2Z', '#bab49f');
    shape('M-24 -3 Q1 0 25 -4 L28 13 Q2 19 -28 13Z', '#ede5d0', '#253a3b', 2.4);
    shape('M-25 9 Q2 14 25 8', null, '#a49c86', 1.2);
    oval(19, 7, 2.5, 2.5, '#c6bda8', '#8a8575', 0.8);
  }

  // Nightmare Roulette 4-point cold metallic star glint helper
  function drawStarGlint(x, y, r, alpha = 1) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    shape(`M0 ${-r} L${r * 0.22} ${-r * 0.22} L${r} 0 L${r * 0.22} ${r * 0.22} L0 ${r} L${-r * 0.22} ${r * 0.22} L${-r} 0 L${-r * 0.22} ${-r * 0.22}Z`, '#ffffff');
    oval(0, 0, r * 0.35, r * 0.35, 'rgba(210, 244, 255, 0.7)');
    ctx.restore();
  }

  // Siren red/blue wash helper (flashes through 7F window from f210 onward!)
  function drawSirenWash(frame, strength = 1) {
    if (frame < 210) return;
    const phase = Math.sin(frame * 0.36);
    const isRed = phase >= 0;
    const a = Math.abs(phase) * 0.24 * strength;
    const g = ctx.createRadialGradient(840, 210, 40, 840, 210, 640);
    g.addColorStop(0, isRed ? `rgba(255, 58, 52, ${a})` : `rgba(54, 148, 255, ${a})`);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    rect(g, 0, 0, W, H);
  }

  // Shared 16:9 7th-floor dark apartment backdrop
  function drawApartment(frame, opts = {}) {
    const { shelfShift = 0, fridgeOpen = 0, drawerOpen = 0, knifeTaken = false, gameScreenRed = true, chairShift = 0 } = opts;

    const wall = ctx.createLinearGradient(0, 0, 0, 450);
    wall.addColorStop(0, '#121c24');
    wall.addColorStop(0.7, '#22323d');
    wall.addColorStop(1, '#18242c');
    rect(wall, 0, 0, W, H);

    for (let x = 40; x < W; x += 120) rect('#0d161c55', x, 0, 2, 446);
    rect('#121a20', 0, 438, W, 10);
    const fl = ctx.createLinearGradient(0, 448, 0, H);
    fl.addColorStop(0, '#3a322a');
    fl.addColorStop(1, '#231e19');
    rect(fl, 0, 448, W, H - 448);
    for (let y = 464; y < H; y += 22) rect('#19141066', 0, y, W, 2);

    // Left: Front apartment door (#704) + deadbolt
    rect('#11191f', 42, 146, 98, 294);
    rect('#3d322b', 48, 152, 86, 288);
    rect('#2c241f', 58, 174, 66, 96);
    rect('#2c241f', 58, 290, 66, 126);
    oval(122, 302, 5, 5, '#d6b267', ink, 1.5);
    oval(122, 278, 4, 4, '#d6b267', ink, 1.5);

    // Tall wooden bookshelf (slides flush across door during Shot 7!)
    const bx = 186 - shelfShift * 102;
    const rattle = shelfShift > 0.05 && shelfShift < 0.96 ? Math.sin(frame * 2.4) * 1.4 : 0;
    rect('#261b15', bx, 186, 74, 254);
    rect('#4f3728', bx + 4, 190, 66, 246);
    for (const sy of [234, 286, 338, 390]) {
      rect('#2c1e16', bx + 6, sy, 62, 6);
      rect('#753238', bx + 10 + rattle, sy - 28, 10, 28);
      rect('#34525c', bx + 22 - rattle, sy - 32, 12, 32);
      rect('#967c4c', bx + 36 + rattle, sy - 26, 9, 26);
      rect('#495c48', bx + 48 - rattle, sy - 30, 12, 30);
    }

    // Center-left: Gaming desk + crimson monitor
    rect('#2b221c', 292, 336, 146, 12);
    rect('#1c1612', 300, 348, 10, 96);
    rect('#1c1612', 420, 348, 10, 96);
    rect('#12181d', 324, 248, 96, 66);
    rect(gameScreenRed ? '#5e161a' : '#243a42', 330, 254, 84, 54);
    rect('#1a2329', 364, 314, 16, 22);
    rect('#2b363d', 350, 332, 44, 6);
    if (gameScreenRed) {
      label('YOU ARE', 372, 276, 10, '#ff7369');
      label('DEAD', 372, 292, 14, '#ffd44d');
      const mg = ctx.createRadialGradient(372, 280, 10, 372, 280, 155);
      mg.addColorStop(0, 'rgba(230, 48, 42, 0.34)');
      mg.addColorStop(1, 'rgba(230, 48, 42, 0)');
      rect(mg, 0, 0, W, H);
    }

    // Swivel office chair behind desk
    const cx = 256 - chairShift * 42;
    shape(`M${cx - 34} 308 Q${cx - 36} 300 ${cx - 26} 300 H${cx - 18} Q${cx - 12} 300 ${cx - 14} 310 L${cx - 18} 396 H${cx - 32}Z`, '#1f282e', ink, 2);
    rect('#151c20', cx - 22, 392, 10, 14);
    shape(`M${cx - 34} 394 H${cx + 34} Q${cx + 40} 394 ${cx + 40} 402 V408 H${cx - 34}Z`, '#26323a', ink, 2);
    rect('#192126', cx - 4, 408, 8, 36);
    shape(`M${cx} 440 L${cx - 28} 454 H${cx - 18} L${cx} 446 L${cx + 18} 454 H${cx + 28}Z`, '#1b242a', ink, 1.8);
    oval(cx - 24, 456, 4, 4, '#10161a');
    oval(cx + 24, 456, 4, 4, '#10161a');
    oval(cx, 456, 4, 4, '#10161a');

    // Kitchen counter + drawer + knife block
    rect('#3a444a', 474, 334, 126, 108);
    rect('#6b767c', 470, 326, 134, 10);
    rect('#283136', 484, 346, 106, 26);
    if (drawerOpen > 0.02) {
      rect('#475359', 484 - drawerOpen * 26, 348, 106, 24);
      rect('#1e262b', 488 - drawerOpen * 26, 352, 98, 16);
    }
    shape('M544 326 L556 296 574 296 566 326Z', '#6e4e35', ink, 1.8);
    if (!knifeTaken) {
      shape('M554 296 L562 276 568 278 560 296Z', '#222b30', ink, 1.4);
    }

    // Refrigerator (x=612..704)
    rect('#1d272e', 608, 182, 96, 262);
    rect('#8fa3ad', 612, 186, 88, 254);
    rect('#758a94', 612, 266, 88, 3);
    rect('#50616b', 620, 214, 5, 36);
    rect('#50616b', 620, 284, 5, 58);
    if (fridgeOpen > 0.02) {
      rect('#d8f2ff', 618, 272, 74, 160);
      const fg = ctx.createRadialGradient(620, 340, 10, 620, 340, 185);
      fg.addColorStop(0, `rgba(215, 244, 255, ${0.52 * fridgeOpen})`);
      fg.addColorStop(1, 'rgba(215, 244, 255, 0)');
      rect(fg, 0, 0, W, H);
    }

    // 7th-floor window looking out over burning night city skyline
    rect('#0b1117', 744, 96, 176, 236);
    ctx.save();
    ctx.beginPath();
    ctx.rect(750, 102, 164, 224);
    ctx.clip();
    const sky = ctx.createLinearGradient(744, 96, 744, 332);
    sky.addColorStop(0, '#09101a');
    sky.addColorStop(0.65, '#1d2230');
    sky.addColorStop(1, frame >= 210 ? '#592522' : '#242c38');
    rect(sky, 750, 102, 164, 224);
    rect('#0e151d', 756, 188, 36, 138);
    rect('#111a24', 798, 146, 44, 180);
    rect('#0c131b', 848, 170, 58, 156);
    if (Math.floor(frame / 18) % 2 === 0) oval(820, 142, 3, 3, '#ff4842');
    if (frame >= 210) {
      const flick = 0.75 + 0.25 * Math.sin(frame * 0.6);
      const wg = ctx.createRadialGradient(832, 326, 8, 832, 326, 88);
      wg.addColorStop(0, `rgba(255, 118, 48, ${0.52 * flick})`);
      wg.addColorStop(1, 'rgba(255, 118, 48, 0)');
      rect(wg, 750, 102, 164, 224);
    }
    ctx.restore();
    shape('M744 96 H920 V332 H744Z', null, '#152028', 7);
    rect('#152028', 830, 96, 5, 236);
    rect('#152028', 744, 212, 176, 5);

    drawSirenWash(frame, 1.0);
  }

  // Helper to composite the 540x960 OpenToonz lead into 960x540 widescreen space!
  async function drawLead(cutout, worldX, worldFloorY, scale, flipLeft = false) {
    if (!cutout) return;
    const img = await loadPng(cutout);
    ctx.fillStyle = '#09101566';
    ctx.beginPath();
    ctx.ellipse(worldX, worldFloorY, 44 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (flipLeft) {
      ctx.translate(worldX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-worldX, 0);
    }
    ctx.drawImage(img, worldX - 250 * scale, worldFloorY - 756 * scale, 540 * scale, 960 * scale);
    ctx.restore();
  }

  // SHOT 1 (f0..119, 0:00..0:05.0): Official OTS dark gaming desk + slow 1.0 -> 1.12x creeping push-in + controller drop!
  function drawShot1OtsGaming(frame) {
    const zoom = mix(1.0, 1.12, tween(frame, 0, 119));
    const slump = tween(frame, 88, 112);

    ctx.save();
    ctx.translate(480, 250);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -250);

    const wall = ctx.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, '#0e161d');
    wall.addColorStop(0.75, '#1b2833');
    wall.addColorStop(1, '#121b22');
    rect(wall, 0, 0, W, H);
    for (let x = 60; x < W; x += 130) rect('#09101566', x, 0, 2, H);

    // Calm midnight 7F window right
    rect('#0b1117', 742, 46, 186, 260);
    const sky = ctx.createLinearGradient(742, 46, 742, 306);
    sky.addColorStop(0, '#080e17');
    sky.addColorStop(1, '#1d2634');
    rect(sky, 748, 52, 174, 248);
    rect('#0e151e', 758, 152, 38, 148);
    rect('#111a24', 804, 108, 46, 192);
    rect('#0c131b', 858, 134, 54, 166);
    if (Math.floor(frame / 18) % 2 === 0) oval(827, 104, 3.2, 3.2, '#ff4842');
    shape('M742 46 H928 V306 H742Z', null, '#152028', 7);
    rect('#152028', 834, 46, 5, 260);
    rect('#152028', 742, 176, 186, 5);

    // Gaming desk + keyboard + dark face-up phone + dropped controller at f101
    rect('#2b211a', 175, 376, 560, 24);
    rect('#1a1410', 175, 400, 560, 140);
    shape('M392 384 L558 384 568 395 384 395Z', '#192128', ink, 1.8);
    oval(592, 389, 12, 6, '#1c252c', ink, 1.4);
    shape('M644 382 L674 382 682 396 648 396Z', '#151c22', ink, 1.8);
    if (frame >= 98) {
      const drop = tween(frame, 98, 106);
      shape(`M316 ${mix(352, 384, drop)} H366 L372 ${mix(364, 396, drop)} H310Z`, '#202930', ink, 1.8);
    }

    // Crimson monitor ("YOU ARE DEAD — OVERRUN")
    const mx = 490, my = 205;
    rect('#151c22', mx - 24, my + 106, 48, 66);
    shape(`M${mx - 68} ${my + 166} H${mx + 68} L${mx + 78} ${my + 176} H${mx - 78}Z`, '#202a32', ink, 2);
    shape(`M${mx - 178} ${my - 108} H${mx + 178} V${my + 108} H${mx - 178}Z`, '#141a20', ink, 3.2);
    const scr = ctx.createLinearGradient(mx, my - 98, mx, my + 98);
    scr.addColorStop(0, '#6e1418');
    scr.addColorStop(0.55, '#8f1b1f');
    scr.addColorStop(1, '#4a0d10');
    rect(scr, mx - 168, my - 98, 336, 196);
    shape(`M${mx - 90} ${my + 98} L${mx - 76} ${my + 26} ${mx - 60} ${my + 28} ${mx - 64} ${my + 72} ${mx - 42} ${my + 10} ${mx - 26} ${my + 14} ${mx - 36} ${my + 70} ${mx - 10} ${my + 18} ${mx + 4} ${my + 24} ${mx - 10} ${my + 74} ${mx + 18} ${my + 40} ${mx + 30} ${my + 50} ${mx + 10} ${my + 98}Z`, 'rgba(20, 6, 8, 0.35)');
    const pulse = 0.85 + 0.15 * Math.sin(frame * 0.25);
    ctx.save();
    ctx.globalAlpha = pulse;
    label('YOU ARE DEAD', mx, my - 8, 36, '#ffd44d');
    label('OVERRUN · RESTARTING CHAPTER...', mx, my + 32, 13, '#ffb0a8');
    ctx.restore();

    const mg = ctx.createRadialGradient(mx, my, 30, mx, my, 400);
    mg.addColorStop(0, 'rgba(240, 48, 42, 0.30)');
    mg.addColorStop(1, 'rgba(240, 48, 42, 0)');
    rect(mg, 0, 0, W, H);

    // Official Rear Over-the-Shoulder Series Lead (using drawAnatomyTurnaround 'rear' — ZERO awkward 3/4!)
    const breath = Math.sin(frame * 0.14) * 2.2;
    const lx = 248 + (frame < 84 ? Math.sin(frame * 1.1) * 0.9 : 0);
    const ly = 1120 + slump * 24 + breath;
    window.drawAnatomyTurnaround(ctx, lx, ly, 2.02, 'rear');

    // Swivel chair backrest rising behind his lower back
    const cy = 374 + slump * 10;
    shape(`M136 ${cy + 24} Q142 ${cy - 8} 184 ${cy - 10} H312 Q352 ${cy - 8} 358 ${cy + 24} L372 548 H122Z`, '#182026', ink, 3.2);
    shape(`M164 ${cy + 14} Q170 ${cy + 2} 194 ${cy + 2} H302 Q326 ${cy + 2} 332 ${cy + 14} L342 542 H154Z`, '#232e36');

    const rim = ctx.createRadialGradient(340, 260, 10, 340, 260, 200);
    rim.addColorStop(0, 'rgba(255, 70, 58, 0.20)');
    rim.addColorStop(1, 'rgba(255, 70, 58, 0)');
    rect(rim, 0, 0, W, H);
    ctx.restore();
  }

  // SHOT 2 (f120..201, 0:05.0..0:08.4): Overhead top-down desk insert + punch-in + studio hand phone grab!
  function drawShot2DeskPhone(frame) {
    const zoom = mix(1.0, 1.08, tween(frame, 120, 201));
    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    const wood = ctx.createLinearGradient(0, 0, W, H);
    wood.addColorStop(0, '#291f19');
    wood.addColorStop(1, '#17110e');
    rect(wood, 0, 0, W, H);
    for (let y = 30; y < H; y += 38) rect('#0e0a0844', 0, y, W, 3);

    // Dropped dark gamepad on left
    ctx.save();
    ctx.translate(270, 290);
    ctx.rotate(-0.22);
    shape('M-92 -24 Q-40 -52 40 -52 Q92 -52 104 6 Q112 58 76 62 Q48 64 36 22 H-36 Q-48 64 -76 62 Q-112 58 -104 6Z', '#222a30', ink, 3);
    oval(-46, -4, 16, 16, '#14191d', '#3e4d57', 2);
    oval(46, -4, 16, 16, '#14191d', '#3e4d57', 2);
    oval(64, -22, 6, 6, '#e04f47');
    oval(80, -8, 6, 6, '#47a8e0');
    ctx.restore();

    // Smartphone rattling violently from f130 (5.4s), lifted cleanly at f180!
    const vib = frame >= 130 && frame < 180 ? Math.sin(frame * 4.8) * 5.0 : 0;
    const lift = tween(frame, 180, 201);
    const px = 608 + vib - lift * 64;
    const py = 274 + vib * 0.5 - lift * 88;
    const lit = frame >= 130;

    if (lit) {
      const glow = ctx.createRadialGradient(px, py, 20, px, py, 280);
      glow.addColorStop(0, 'rgba(255, 62, 54, 0.54)');
      glow.addColorStop(1, 'rgba(255, 62, 54, 0)');
      rect(glow, 0, 0, W, H);
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(0.14 - lift * 0.14);
    ctx.scale(1 + lift * 0.25, 1 + lift * 0.25);
    shape('M-56 -104 Q-56 -116 -44 -116 H44 Q56 -116 56 -104 V104 Q56 116 44 116 H-44 Q-56 116 -56 104Z', '#151c22', ink, 3);
    rect(lit ? '#991b1e' : '#1b262e', -48, -98, 96, 196);
    if (lit) {
      rect('#ff3b30', -44, -64, 88, 34);
      label('ALERT', 0, -40, 18, '#fff7e5');
      label('LOCKDOWN', 0, 8, 13, '#ffd44d');
      if (frame < 180) shape('M-70 -40 Q-78 0 -70 40 M70 -40 Q78 0 70 40', null, '#ff9482aa', 3);
    }
    ctx.restore();

    // Studio SVG right hand entering from bottom-right to grab lower-right phone bezel cleanly!
    if (frame >= 148) {
      const reach = tween(frame, 148, 180);
      ctx.save();
      ctx.translate(mix(820, px + 50, reach), mix(560, py + 76, reach));
      ctx.rotate(-0.34);
      ctx.scale(1.68, 1.68);
      ctx.translate(-120, -108);
      // Forearm sleeve running past bottom edge
      shape('M88 188 L152 188 L178 360 L72 360Z', '#e8e1cc', '#253a3b', 2.4);
      // Exact studio #bar-reach curled approaching hand wrapping onto phone edge!
      shape('M101 169 Q100 156 93 145 L75 123 Q70 116 75 111 Q80 108 86 114 L96 125 Q98 126 99 123 L98 106 Q98 96 105 95 Q111 94 112 104 L113 119 L114 98 Q114 89 121 89 Q128 89 128 99 L128 119 L131 102 Q132 93 139 94 Q145 95 144 105 L142 123 L147 112 Q149 105 155 107 Q160 110 158 120 L152 141 Q148 154 139 161 L138 169Z', '#e7ae87', '#253a3b', 2.2);
      shape('M156 117 L151 141 Q147 154 138 161 L137 168 H129 Q132 156 139 146 Q146 135 148 120Z', '#c88e72');
      shape('M104 128 Q116 120 133 124 L138 139 Q124 150 109 149Z', '#f3c39d');
      ctx.save();
      ctx.translate(119, 167);
      ctx.scale(0.86, 0.78);
      drawCuff();
      ctx.restore();
      ctx.restore();
    }
    ctx.restore();
  }

  // SHOT 3 (f202..277, 0:08.4..0:11.6): Downward First-Person POV red lockdown alert + creeping zoom + tremor + sirens!
  function drawShot3PovPhone(frame) {
    rect('#0a1118', 0, 0, W, H);
    drawSirenWash(frame, 1.35);

    const zoom = mix(1.0, 1.10, tween(frame, 202, 277));
    const tremorAmt = tween(frame, 224, 260);
    const shake = tremorAmt * Math.sin(frame * 2.4) * 2.5;
    const cx = 480 + shake, cy = 270 + shake * 0.6;

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    const g = ctx.createRadialGradient(cx, cy, 35, cx, cy, 420);
    g.addColorStop(0, 'rgba(255, 52, 46, 0.44)');
    g.addColorStop(1, 'rgba(255, 52, 46, 0)');
    rect(g, 0, 0, W, H);

    // Sculpted 2-Layer Phone Cradle Hand (BACK -> PHONE -> FRONT, ZERO oval fingers!)
    window.drawWeaponHandBack(ctx, 'phone-cradle', cx, cy + 88, 2.02, 0, { bare: true, showSleeve: true });

    shape(`M${cx - 122} ${cy - 210} Q${cx - 122} ${cy - 228} ${cx - 104} ${cy - 228} H${cx + 104} Q${cx + 122} ${cy - 228} ${cx + 122} ${cy - 210} V${cy + 210} Q${cx + 122} ${cy + 228} ${cx + 104} ${cy + 228} H${cx - 104} Q${cx - 122} ${cy + 228} ${cx - 122} ${cy + 210}Z`, '#151c22', ink, 3.5);
    rect('#1a1014', cx - 110, cy - 206, 220, 412);

    const pulse = 0.72 + 0.28 * Math.sin(frame * 0.48);
    rect(`rgba(220, 34, 34, ${pulse})`, cx - 106, cy - 198, 212, 68);
    label('EMERGENCY ALERT', cx, cy - 166, 19, '#fff7e5');
    label('CITYWIDE LOCKDOWN', cx, cy - 142, 16, '#ffd44d');

    shape(`M${cx} ${cy - 108} L${cx + 38} ${cy - 44} ${cx - 38} ${cy - 44}Z`, '#ffd44d', ink, 2.5);
    label('!', cx, cy - 55, 34, '#1a1014');

    label('FEDERAL LAB BREACH', cx, cy - 6, 19, '#ff8075');
    label('CONTAINMENT FAILED', cx, cy + 20, 16, '#f2e8d4');
    rect('#36181c', cx - 96, cy + 44, 192, 86);
    label('HOSTILE INFECTED', cx, cy + 72, 15, '#ffd44d');
    label('SIGHTED DOWNTOWN', cx, cy + 94, 15, '#f2e8d4');
    label('LOCK ALL DOORS', cx, cy + 116, 14, '#ff7369');

    rect('#85181b', cx - 106, cy + 150, 212, 34);
    label('00:14 AM  ·  SHELTER IN PLACE', cx, cy + 172, 12, '#fff7e5');

    // Front layer: 4 sculpted curled fingers on left bezel + opposing thumb on right bezel!
    window.drawWeaponHandFront(ctx, 'phone-cradle', cx, cy + 88, 2.02, 0, { bare: true });
    ctx.restore();
  }

  // Dark room portrait backdrop helper for official front reactions & ECU crash-zoom
  function drawDarkRoomPortraitBg() {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0c141b');
    bg.addColorStop(1, '#18242e');
    rect(bg, 0, 0, W, H);
    rect('#221813', 66, 36, 165, 504);
    rect('#3b2a20', 76, 48, 145, 492);
    for (const sy of [136, 256, 376]) {
      rect('#211610', 80, sy, 138, 12);
      rect('#5e292e', 90, sy - 54, 22, 54);
      rect('#2a424a', 118, sy - 64, 26, 64);
      rect('#78623c', 150, sy - 50, 20, 50);
      rect('#394a39', 176, sy - 58, 24, 58);
    }
    rect('#121a20', 742, 36, 176, 504);
    rect('#2e2520', 754, 48, 152, 492);
    oval(776, 320, 8, 8, '#a68b52');
  }

  // SHOT 4A (f278..337, 0:11.6..0:14.1): Official sculpted Front Reaction -> snappy audio-cue eye-dart + sliding sweat!
  function drawShot4aEyeDart(frame) {
    drawDarkRoomPortraitBg();
    const zoom = mix(1.0, 1.09, tween(frame, 278, 337));
    const dart = tween(frame, 310, 316) * 4.2; // Snaps sharply right on 0:13.0 glass crash!
    const sweat = frame >= 314 ? tween(frame, 314, 337) : 0.15;
    const breath = Math.sin((frame - 278) * 0.45) * 1.6;

    ctx.save();
    ctx.translate(480, 285);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -285);
    window.drawAnatomyTurnaround(ctx, 480, 1368 + breath, 2.66, 'front', {
      hideLimbs: false,
      expression: frame >= 312 ? 'head-alarm' : 'head-dread',
      eyeOffset: [dart, 0],
      sweat,
      dreadWash: 0.45,
    });
    ctx.restore();

    // Phone crimson up-glow + flashing red/blue police siren rake
    const pg = ctx.createRadialGradient(480, 520, 20, 480, 480, 390);
    pg.addColorStop(0, 'rgba(255, 58, 50, 0.36)');
    pg.addColorStop(1, 'rgba(255, 58, 50, 0)');
    rect(pg, 0, 0, W, H);
    drawSirenWash(frame, 1.5);
  }

  // SHOT 4B (f338..373, 0:14.1..0:15.6): Rapid Subjective POV Whip-Pan right across dark wall onto strobe-lit window!
  function drawShot4bWhipPan(frame) {
    const pan = tween(frame, 338, 352); // Fast 14-frame subjective whip-pan!
    const driftX = frame > 352 ? Math.sin((frame - 352) * 0.25) * 4 : 0;
    const driftY = frame > 352 ? Math.cos((frame - 352) * 0.20) * 3 : 0;
    const panSpeed = frame >= 338 && frame <= 352 ? Math.sin(Math.PI * (frame - 338) / 14) : 0;

    ctx.save();
    ctx.translate(-mix(0, 620, pan) + driftX, driftY);
    // Extended dark apartment wall -> right 7th-floor rain-streaked strobe window (width 1580)
    const wall = ctx.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, '#0d151c');
    wall.addColorStop(1, '#18242e');
    rect(wall, 0, 0, 1620, H);
    for (let x = 60; x < 1600; x += 150) rect('#09101566', x, 0, 3, H);
    // Wall poster / picture frame whipping past during the pan!
    rect('#121a20', 220, 120, 170, 210);
    rect('#25313a', 232, 132, 146, 186);

    // Target 7th-floor wide window at x=770..1430 blazing with red/blue sirens & orange street fire!
    rect('#0b1117', 760, 44, 680, 452);
    const sky = ctx.createLinearGradient(760, 44, 760, 496);
    sky.addColorStop(0, '#080e17');
    sky.addColorStop(0.55, '#1e2230');
    sky.addColorStop(1, '#7a2b20');
    rect(sky, 774, 58, 652, 424);
    // City skyline silhouettes
    rect('#0e151e', 804, 214, 96, 268);
    rect('#111a26', 924, 146, 118, 336);
    rect('#0c131c', 1070, 180, 114, 302);
    rect('#101924', 1208, 118, 126, 364);
    if (Math.floor(frame / 14) % 2 === 0) oval(1271, 108, 5, 5, '#ff4842');
    // Blazing fire & siren blooms outside glass
    const phase = Math.sin(frame * 0.55);
    const sg = ctx.createRadialGradient(1100, 370, 20, 1100, 370, 340);
    sg.addColorStop(0, phase >= 0 ? 'rgba(255, 62, 52, 0.55)' : 'rgba(54, 156, 255, 0.52)');
    sg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    rect(sg, 774, 58, 652, 424);
    // Raindrops on dark window glass
    for (let i = 0; i < 32; i++) {
      const rx = 795 + (i * 193) % 610;
      const ry = 76 + ((i * 89 + frame * 1.4) % 390);
      oval(rx, ry, 1.8, 5.5, 'rgba(205, 228, 245, 0.32)');
    }
    shape('M760 44 H1440 V496 H760Z', null, '#152028', 14);
    rect('#152028', 1096, 44, 10, 452);
    rect('#152028', 760, 266, 680, 10);
    ctx.restore();

    // Subtle horizontal motion-blur streaks during the fast whip-pan peak!
    if (panSpeed > 0.1) {
      ctx.save();
      ctx.globalAlpha = panSpeed * 0.28;
      for (let y = 40; y < H; y += 36) {
        rect('#d8e6f033', 0, y, W, 6);
      }
      ctx.restore();
    }
    drawSirenWash(frame, 1.2);
  }

  // SHOT 4C (f374..462, 0:15.6..0:19.3): Tight Front Panic Portrait -> SNAPPY 5-FRAME OFF-CENTER ECU CRASH-ZOOM DREAD!
  function drawShot4cCrashZoomDread(frame) {
    drawDarkRoomPortraitBg();
    const crash = tween(frame, 415, 421); // Snappy 5-frame Nightmare Roulette crash-zoom at 0:17.3 ("PURE PANIC")!
    const creep = tween(frame, 421, 462); // Slow suffocating creep after impact!
    const zoom = 2.65 + 5.75 * crash + 0.65 * creep;
    const panX = 480 - 142 * crash - 14 * creep;
    const panY = 270 + 18 * crash;
    const shake = frame >= 415 && frame <= 426
      ? Math.sin(frame * 3.1) * 7 * (1 - (frame - 415) / 11)
      : Math.sin(frame * 1.4) * (1.2 + 0.8 * crash);
    const sweat = 0.25 + 0.75 * tween(frame, 390, 460);

    window.drawAnatomyTurnaround(ctx, panX + shake, panY + 434 * zoom + shake * 0.4, zoom, 'front', {
      hideLimbs: false,
      expression: frame < 415 ? 'head-panic' : 'head-dread',
      eyeOffset: [0, 0],
      sweat,
      dreadWash: 0.4 + 0.6 * crash,
    });
    drawSirenWash(frame, 1.45);
  }

  // SHOT 6A (f531..580, 0:22.1..0:24.2): Vulnerable High-Angle Apartment Wide looking down at lead on strobe-lit floor!
  function drawShot6aHighAngleWide(frame) {
    const zoom = mix(1.0, 1.07, tween(frame, 531, 580));
    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // High-angle perspective apartment floor & receding back wall
    const fl = ctx.createLinearGradient(0, 0, 0, H);
    fl.addColorStop(0, '#141e26');
    fl.addColorStop(0.28, '#28231e');
    fl.addColorStop(1, '#3d332a');
    rect(fl, 0, 0, W, H);
    // Perspective floorboards
    for (let y = 165; y < H; y += 34) rect('#19141055', 0, y, W, 2);
    // Back wall strip with door far-left, desk center-left, window far-right casting long strobe beams across floor!
    rect('#152028', 0, 0, W, 154);
    rect('#3a2e26', 64, 24, 110, 130); // Front door
    rect('#4b3526', 194, 48, 86, 106); // Bookshelf
    rect('#2b211a', 320, 96, 160, 74); // Gaming desk top
    rect('#75181c', 360, 72, 82, 34); // Glowing red monitor top
    // Long red/blue window light trapezoid sweeping diagonally across the apartment floor!
    const phase = Math.sin(frame * 0.36);
    shape('M790 154 L960 154 L960 540 L480 540Z', phase >= 0 ? 'rgba(255, 68, 54, 0.16)' : 'rgba(54, 152, 255, 0.16)');
    // Shadow under lead + official High-Angle Vulnerable Series Lead!
    oval(480, 444, 52, 16, 'rgba(8, 12, 16, 0.45)');
    window.drawCinematicAngle(ctx, 480, 312, 1.18, 'high-angle');
    ctx.restore();
  }

  // SHOT 6C (f643..702, 0:26.8..0:29.3): Studio SVG POV Brass Deadbolt Lock Turn (drawPovSurvivalHand geometry!)
  function drawShot6cPovDeadbolt(frame) {
    const turn = tween(frame, 666, 676); // Snappy deadbolt turn at 0:27.9!
    const jolt = frame >= 675 && frame <= 681 ? Math.sin((frame - 675) * 2.5) * 3.5 : 0;
    const zoom = mix(1.0, 1.07, tween(frame, 643, 702));

    ctx.save();
    ctx.translate(480 + jolt, 270 + jolt * 0.5);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Rich dark apartment door wood + steel frame
    rect('#2b221c', 0, 0, W, H);
    rect('#3d3129', 140, 0, 680, H);
    rect('#121a20', 816, 0, 18, H);
    for (let x = 180; x < 800; x += 68) rect('#261d1744', x, 0, 3, H);

    const bx = 540, by = 248;
    // Brass deadbolt escutcheon plate
    oval(bx, by, 82, 82, '#8c6d3e', ink, 3.8);
    oval(bx, by, 64, 64, '#c9a259', ink, 2.6);

    // Studio SVG #ticket-pinch right hand entering from bottom-left (full sleeve extending off-screen!)
    const reach = tween(frame, 643, 664);
    ctx.save();
    ctx.translate(mix(280, bx - 90, reach), mix(360, by + 44, reach));
    ctx.rotate(mix(-0.18, 0.24, turn));
    ctx.scale(2.05, 2.05);
    ctx.translate(-122, -124);
    // Long cream sleeve extending past bottom-left frame border
    shape('M-160 310 L46 154 L88 192 L-110 380Z', '#e8e1cc', '#253a3b', 2.4);
    // Exact studio SVG #ticket-pinch fingers, dorsal hand, shading, opposing thumb & cuff!
    shape('M91 147 Q101 147 111 140 C117 146 113 158 105 162 Q97 166 88 161Z', '#c78c73', '#253a3b', 1.7);
    shape('M108 126 Q116 117 125 121 Q127 131 126 140 L121 153 Q117 160 111 157 Q106 155 107 148 L110 136Z', '#ce9479', '#253a3b', 1.7);
    shape('M120 108 Q133 102 142 110 Q147 116 145 125 L143 145 Q142 153 137 154 Q131 153 130 148 L129 131 Q126 126 119 126Z', '#dba382', '#253a3b', 1.8);
    shape('M40 165 Q61 148 72 132 L84 116 C90 106 96 101 106 100 L126 96 Q135 94 140 97 Q146 101 143 107 L130 118 Q123 124 113 129 Q110 144 102 155 C95 169 79 176 58 184Z', '#e7ae87', '#253a3b', 2.4);
    shape('M41 165 Q61 148 72 132 Q82 119 87 113 Q93 107 101 105 Q90 117 85 132 Q76 149 64 157 L50 173Z', '#c88e72');
    ctx.restore();

    // Rotating brass thumb-turn lever (horizontal -> vertical LOCKED!)
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(mix(0, Math.PI / 2, turn));
    shape('M-54 -14 H54 Q62 0 54 14 H-54 Q-62 0 -54 -14Z', '#e6c178', ink, 3.0);
    shape('M-44 -6 H44', null, '#fff4cf', 2.4);
    ctx.restore();

    // Opposing near thumb overlapping the latch + cuff
    ctx.save();
    ctx.translate(mix(280, bx - 90, reach), mix(360, by + 44, reach));
    ctx.rotate(mix(-0.18, 0.24, turn));
    ctx.scale(2.05, 2.05);
    ctx.translate(-122, -124);
    shape('M87 144 Q97 138 108 127 L123 112 Q129 105 134 103 Q142 99 146 105 Q150 110 145 116 L133 128 L118 144 Q111 154 100 159', '#e7ae87', '#253a3b', 2.0);
    shape('M99 155 Q108 148 116 138 L138 115 Q144 110 146 108 Q148 113 143 117 L130 130 L117 144 Q108 155 101 157Z', '#c88e72');
    shape('M134 106 Q139 103 143 106 Q145 109 142 112 L137 116 Q133 115 131 111Z', '#f1c2a8', '#b98573', 0.85);
    ctx.save();
    ctx.translate(50, 174);
    ctx.rotate(42 * Math.PI / 180);
    ctx.scale(0.66, 1.0);
    drawCuff();
    ctx.restore();
    ctx.restore();

    if (turn > 0.92) {
      drawStarGlint(bx, by - 44, 24 * (1 - tween(frame, 676, 692)), 0.95);
      label('LOCKED', bx, by + 124, 24, '#ffd44d');
    }
    ctx.restore();
  }

  // SHOT 8A-FACE (f881..925, 0:36.7..0:38.6): Tight Front look-down reaction washed in cold white refrigerator light!
  function drawShot8aFridgeFace(frame) {
    drawDarkRoomPortraitBg();
    const zoom = mix(1.0, 1.09, tween(frame, 881, 925));
    const pitch = mix(0.25, 0.92, tween(frame, 881, 905));

    ctx.save();
    ctx.translate(480, 275);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -275);
    window.drawAnatomyTurnaround(ctx, 480, 1348, 2.62, 'front', {
      hideLimbs: false,
      expression: frame > 904 ? 'head-dread' : 'head-notice',
      headPitch: pitch,
      eyeOffset: [0, 1.6],
      dreadWash: frame > 904 ? 0.55 : 0.15,
    });
    ctx.restore();

    // Harsh cold-white fridge light spilling upward across his face!
    const fg = ctx.createRadialGradient(480, 520, 30, 480, 440, 440);
    fg.addColorStop(0, 'rgba(210, 244, 255, 0.46)');
    fg.addColorStop(0.65, 'rgba(180, 230, 255, 0.16)');
    fg.addColorStop(1, 'rgba(180, 230, 255, 0)');
    rect(fg, 0, 0, W, H);
  }

  // SHOT 8B (f926..1043, 0:38.6..0:43.5): Downward POV Empty Fridge + slow 1.0 -> 1.15x creeping push-in!
  function drawShot8bPovFridge(frame) {
    const zoom = mix(1.0, 1.15, tween(frame, 926, 1043));
    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#c8e4f2');
    bg.addColorStop(1, '#7ea0b3');
    rect(bg, 0, 0, W, H);
    shape('M0 0 H150 V540 H0Z', '#5a7887', ink, 3);
    shape('M810 0 H960 V540 H810Z', '#5a7887', ink, 3);
    for (const sy of [175, 315, 450]) {
      rect('#3f5b69', 150, sy, 660, 12);
      rect('#e6f7ff', 150, sy, 660, 4);
    }
    const cans = [[230, 134, '#c74d44'], [278, 134, '#d99e45'], [326, 134, '#4e8a6b'], [560, 274, '#c74d44'], [608, 274, '#4e8a6b']];
    for (const [cx, cy, col] of cans) {
      rect(col, cx, cy, 34, 42);
      shape(`M${cx} ${cy} H${cx + 34} V${cy + 42} H${cx}Z`, null, ink, 2);
      rect('#f5ebd4', cx + 4, cy + 12, 26, 14);
    }
    shape('M645 78 H705 L716 112 V175 H634 V112Z', '#dff4ff', ink, 2.4);
    rect('#8cd4f5', 636, 136, 78, 37);
    shape('M240 245 L268 228 296 245 V315 H240Z', '#ece3cf', ink, 2.2);
    ctx.restore();

    const a = tween(frame, 976, 1002);
    if (a > 0.02) {
      ctx.save();
      ctx.globalAlpha = a;
      rect('#0e1920e0', 330, 355, 300, 62);
      shape('M330 355 H630 V417 H330Z', null, '#ff7369', 2.5);
      label('FOOD LEFT: 5 DAYS MAX', 480, 394, 22, '#ffd44d');
      ctx.restore();
    }
  }

  // SHOT 9A (f1044..1110, 0:43.5..0:46.3): Official Rear OTS at 7th-floor burning window + slow push-in!
  function drawShot9aOtsWindow(frame) {
    const zoom = mix(1.0, 1.09, tween(frame, 1044, 1110));
    const breath = Math.sin(frame * 0.14) * 1.8;

    ctx.save();
    ctx.translate(540, 250);
    ctx.scale(zoom, zoom);
    ctx.translate(-540, -250);

    rect('#121b23', 0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 24, 0, 440);
    sky.addColorStop(0, '#09101a');
    sky.addColorStop(0.55, '#1e2230');
    sky.addColorStop(1, '#6b2822');
    rect(sky, 270, 28, 650, 412);
    rect('#0e151e', 295, 190, 96, 250);
    rect('#121c27', 410, 128, 118, 312);
    rect('#0c131c', 550, 160, 108, 280);
    rect('#101924', 680, 96, 126, 344);
    rect('#0b111a', 822, 178, 86, 262);
    if (Math.floor(frame / 16) % 2 === 0) oval(743, 88, 5, 5, '#ff4842');
    const flk = 0.78 + 0.22 * Math.sin(frame * 0.55);
    const fg = ctx.createRadialGradient(560, 425, 20, 560, 425, 290);
    fg.addColorStop(0, `rgba(255, 118, 42, ${0.56 * flk})`);
    fg.addColorStop(1, 'rgba(255, 118, 42, 0)');
    rect(fg, 270, 28, 650, 412);
    shape('M270 28 H920 V440 H270Z', null, '#152028', 12);
    rect('#152028', 592, 28, 10, 412);
    rect('#152028', 270, 232, 650, 10);
    rect('#222f38', 256, 438, 680, 18);

    // Official Rear Over-the-Shoulder Series Lead anchored foreground-left!
    window.drawAnatomyTurnaround(ctx, 214, 1126 + breath, 2.08, 'rear');
    ctx.restore();
    drawSirenWash(frame, 1.35);
  }

  // SHOT 9B (f1111..1153, 0:46.3..0:48.1): Tight Front look-down dread cut lit by window firelight ("and your stomach drops")!
  function drawShot9bLookDownDread(frame) {
    drawDarkRoomPortraitBg();
    const zoom = mix(1.0, 1.12, tween(frame, 1111, 1153));
    const pitch = mix(0.45, 0.96, tween(frame, 1111, 1135));
    const sweat = 0.35 + 0.65 * tween(frame, 1111, 1153);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);
    window.drawAnatomyTurnaround(ctx, 480, 1378, 2.72, 'front', {
      hideLimbs: false,
      expression: 'head-dread',
      headPitch: pitch,
      eyeOffset: [0, 1.8],
      sweat,
      dreadWash: 0.85,
    });
    ctx.restore();

    const flk = 0.8 + 0.2 * Math.sin(frame * 0.65);
    const fg = ctx.createRadialGradient(840, 460, 30, 620, 360, 520);
    fg.addColorStop(0, `rgba(255, 112, 42, ${0.42 * flk})`);
    fg.addColorStop(1, 'rgba(255, 112, 42, 0)');
    rect(fg, 0, 0, W, H);
    drawSirenWash(frame, 1.3);
  }

  // SHOT 10 (f1154..1470, 0:48.1..1:01.3): 4 STEPPED ESCALATING NOUN PUSH-INS (Nightmare Roulette 0:46-0:58 grammar!)
  function drawShot10SteppedStreetFrenzy(frame) {
    // 4 discrete escalating focal crops synced directly to spoken nouns in chapter-voice.json:
    // 1) f1154..1302 (1.0x Wide): Swarming Common Runners
    // 2) f1303..1374 (1.42x Push-In 1): Hunched Smoker in green spore fog (x=470, y=165)
    // 3) f1375..1405 (1.62x Push-In 2): Bloated Boomer with glowing pustules (x=695, y=355)
    // 4) f1406..1470 (1.72x Tracking Pan): Hooded Hunter vaulting taxi -> bus roof (x=595 -> 920)
    const leap = tween(frame, 1412, 1456);
    const hx = mix(595, 920, leap);
    const hy = mix(318, 206, leap) - Math.sin(Math.PI * leap) * 120;

    let camX = 520, camY = 270, camZ = 1.0;
    if (frame < 1303) {
      camZ = mix(1.0, 1.08, tween(frame, 1154, 1302));
      camX = mix(495, 560, tween(frame, 1154, 1302));
      camY = 270;
    } else if (frame < 1375) {
      camZ = mix(1.38, 1.50, tween(frame, 1303, 1374));
      camX = 485;
      camY = 185;
    } else if (frame < 1406) {
      camZ = mix(1.58, 1.68, tween(frame, 1375, 1405));
      camX = 695;
      camY = 350;
    } else {
      camZ = mix(1.66, 1.78, tween(frame, 1406, 1470));
      camX = clamp((hx - 540) / 420) * 260 + 620;
      camY = mix(300, 215, leap);
    }

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(camZ, camZ);
    ctx.translate(-camX, -camY);

    rect('#141c24', 0, 0, 1220, H);
    rect('#1f2a33', 0, 95, 1220, 350);
    for (let x = 20; x < 1200; x += 90) rect('#9e834466', x, 265, 48, 8);
    rect('#2d3840', 0, 0, 1220, 95);
    rect('#2d3840', 0, 445, 1220, 95);

    const drawCar = (x, y, ang, col, lights = false) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      if (lights) {
        shape('M64 -24 L240 -78 240 28 64 -10Z', 'rgba(255, 224, 146, 0.24)');
        shape('M64 10 L240 -28 240 78 64 24Z', 'rgba(255, 224, 146, 0.24)');
      }
      shape('M-64 -30 H64 V30 H-64Z', col, ink, 2.8);
      rect('#213038', -30, -23, 52, 46);
      ctx.restore();
    };
    drawCar(210, 210, 0.25, '#4b5c66', true);
    drawCar(590, 325, -0.35, '#9e7d34', true);
    drawCar(940, 220, 0.12, '#3a4952', false);

    const flk = 0.8 + 0.2 * Math.sin(frame * 0.7);
    oval(245, 225, 36 * flk, 28 * flk, 'rgba(255, 112, 40, 0.65)');
    oval(245, 225, 18 * flk, 14 * flk, 'rgba(255, 220, 110, 0.85)');

    // 1. Articulated Common Runners (high-angle striding legs, hunched torsos, bent reaching arms)
    for (let i = 0; i < 16; i++) {
      const rx = ((i * 88 + frame * (2.6 + (i % 3) * 1.1)) % 1160);
      const ry = 130 + ((i * 53) % 270) + Math.sin(frame * 0.45 + i) * 7;
      const stride = Math.sin(frame * 0.55 + i * 1.7);
      const coat = i % 3 === 0 ? '#39474d' : i % 3 === 1 ? '#453b38' : '#313d42';
      ctx.save();
      ctx.translate(rx, ry);
      oval(0, 17, 15, 5.5, '#070b0f88');
      // Back & front striding legs with bent knees
      shape(`M-4 6 L${-6 - stride * 7} 13 L${-10 - stride * 10} 18`, null, '#1d252b', 4.2);
      shape(`M3 6 L${7 + stride * 7} 12 L${10 + stride * 10} 17`, null, '#242e35', 4.2);
      // Far reaching arm (elbow + forearm)
      shape(`M5 -7 L${14 + stride * 3} -12 L${22 + stride * 4} -8`, null, '#5a6b6e', 3.2);
      // Hunched forward-leaning torso & shoulders
      shape('M-11 6 Q-12 -5 -4 -10 Q6 -12 11 -5 L9 8 Q0 11 -11 6 Z', coat, ink, 1.7);
      // Near reaching arm with bent elbow
      shape(`M4 -2 L${13 - stride * 3} 3 L${23 - stride * 3} 0`, null, '#6b7d80', 3.4);
      // Forward-pitched head & neck
      shape('M2 -10 L6 -14', null, '#56686b', 4);
      oval(7, -15, 6.8, 6.2, '#6c7e80', ink, 1.5);
      oval(10, -15, 1.4, 1.4, '#d95b52');
      ctx.restore();
    }

    // 2. Articulated Smoker-type (gaunt hunched ribcage, bony asymmetrical clawed arms, pulsing spore cloud, coiled crimson tongue)
    const sx = 470 + Math.sin(frame * 0.08) * 10, sy = 155;
    const smSway = Math.sin(frame * 0.22) * 3;
    const smg = ctx.createRadialGradient(sx + Math.sin(frame * 0.08) * 12, sy - 6, 10, sx, sy, 98);
    smg.addColorStop(0, 'rgba(104, 238, 122, 0.56)');
    smg.addColorStop(0.55, 'rgba(92, 210, 110, 0.22)');
    smg.addColorStop(1, 'rgba(92, 210, 110, 0)');
    rect(smg, sx - 104, sy - 104, 208, 208);
    ctx.save();
    ctx.translate(sx, sy);
    oval(0, 32, 22, 7.5, '#070b0f88');
    // Gaunt bent legs
    shape('M-7 10 L-14 22 L-11 33 M8 10 L15 21 L18 32', null, '#1e2c26', 5.2);
    // Long gaunt asymmetrical left arm (hunched elbow + drooping claw)
    shape(`M-11 -16 L-26 -4 L-32 ${13 + smSway}`, null, '#2e453a', 4.8);
    shape(`M-32 ${13 + smSway} L-37 ${19 + smSway} M-32 ${13 + smSway} L-28 ${20 + smSway}`, null, '#587866', 2.0);
    // Hunched bony spine & torn dark jacket torso
    shape('M-13 14 Q-18 -6 -10 -22 Q4 -28 15 -18 Q19 -4 13 14 Q0 18 -13 14 Z', '#24362e', ink, 2.2);
    shape('M-6 -14 Q2 -16 9 -10 M-7 -5 Q2 -7 9 -2', null, '#3b5749', 1.6);
    // Outstretched right arm reaching with crooked elbow + claws
    shape(`M12 -14 L27 -10 L36 ${-2 - smSway}`, null, '#385446', 4.6);
    shape(`M36 ${-2 - smSway} L42 ${-5 - smSway} M36 ${-2 - smSway} L41 ${3 - smSway}`, null, '#587866', 2.0);
    // Hunched neck + sunken jaw & glowing green cheek boils
    shape('M1 -21 L7 -28', null, '#476654', 6.5);
    shape('M0 -37 Q10 -41 16 -33 Q18 -24 10 -21 Q2 -21 -2 -29 Z', '#51705e', ink, 1.9);
    oval(11, -28, 3.8, 3.4, '#9eff9c', '#3c6e44', 1.0);
    oval(5, -34, 2.6, 2.2, '#b4ff9c');
    // Thick muscular coiling crimson tongue with wet specular line
    const tw = Math.sin(frame * 0.4) * 12;
    shape(`M14 -27 Q36 ${-20 + tw} 56 ${-10 - tw * 0.5} T88 ${-2 + tw * 0.3}`, null, '#a82d3a', 4.4);
    shape(`M16 -27 Q36 ${-21 + tw} 56 ${-11 - tw * 0.5} T86 ${-3 + tw * 0.3}`, null, '#e36470', 1.4);
    ctx.restore();

    // 3. Articulated Boomer-type (bloated gut with bile pustules, hunched shoulders, stubby splayed arms & legs)
    const bx = 695 + Math.sin(frame * 0.06) * 12, by = 365;
    const bWaddle = Math.sin(frame * 0.28) * 3;
    ctx.save();
    ctx.translate(bx, by);
    oval(0, 29, 32, 10, '#070b0f88');
    // Wide planted stubby legs
    shape(`M-14 14 L-19 26 L-23 30 M14 14 L19 26 L23 30`, null, '#343e31', 7.5);
    // Stubby splayed arms with bent elbows & hands
    shape(`M-22 -8 L-34 ${2 + bWaddle} L-38 ${12 + bWaddle}`, null, '#4d5c48', 6.2);
    shape(`M22 -8 L34 ${2 - bWaddle} L38 ${12 - bWaddle}`, null, '#4d5c48', 6.2);
    // Hunched bloated torso + sagging abdomen
    shape('M-24 -12 Q-16 -24 0 -24 Q16 -24 24 -12 Q32 4 24 19 Q0 29 -24 19 Q-32 4 -24 -12 Z', '#485443', ink, 2.4);
    shape('M-18 6 Q0 16 18 6', null, '#323b2e', 1.8); // Belly fold crease
    // Glowing bile pustules & blisters
    for (const [px, py, pr] of [[-12, -5, 4.8], [11, 4, 5.2], [2, -13, 4.0], [-5, 11, 4.4], [15, -7, 3.4]]) {
      oval(px, py, pr, pr * 0.82, '#d9f26b', '#526324', 1.2);
      oval(px - 1, py - 1, pr * 0.35, pr * 0.35, '#f6ffba');
    }
    // Swollen hunched head & neck
    shape('M-9 -24 Q0 -38 11 -26 Q13 -16 0 -15 Q-11 -16 -9 -24 Z', '#62705a', ink, 2.0);
    oval(4, -24, 2.2, 1.8, '#d9f26b');
    ctx.restore();

    // 4. Articulated Hooded Hunter-type (crouched coil on taxi -> stretched mid-air pounce -> tucked landing!)
    ctx.save();
    ctx.translate(hx, hy);
    const airborne = Math.sin(Math.PI * leap);
    ctx.rotate(mix(-0.18, 0.24, leap) - airborne * 0.25);
    if (airborne < 0.15) oval(0, 18, 22, 6, '#070b0f88');
    // Athletic crouched / extended hind legs (coiled on roof, kicking back mid-leap!)
    const legExt = airborne * 18;
    shape(`M-12 6 L${-20 - legExt * 0.5} ${14 - legExt * 0.2} L${-12 - legExt} ${20 - legExt * 0.1}`, null, '#1e252c', 5.2);
    shape(`M-6 8 L${-10 - legExt * 0.6} ${17 - legExt * 0.3} L${-2 - legExt * 1.1} ${22 - legExt * 0.2}`, null, '#28313b', 5.2);
    // Arched hooded torso (dark torn blue-grey hoodie)
    shape('M-18 8 Q-12 -12 8 -12 Q20 -10 22 2 L14 12 Q-4 14 -18 8 Z', '#2a3440', ink, 2.2);
    shape('M-10 4 Q2 -4 14 2', null, '#3e4c5c', 1.5);
    // Outstretched predatory arms with taped wrists & claws
    const armReach = 8 + airborne * 12;
    shape(`M12 -4 L${22 + armReach * 0.5} ${4 - airborne * 6} L${28 + armReach} ${10 - airborne * 10}`, null, '#333f4d', 4.6);
    shape(`M${25 + armReach * 0.75} ${7 - airborne * 8} L${28 + armReach} ${10 - airborne * 10}`, null, '#cfc6b0', 4.4); // Taped wrist
    shape(`M8 2 L${18 + armReach * 0.4} ${12 - airborne * 4} L${24 + armReach * 0.85} ${16 - airborne * 8}`, null, '#26303b', 4.4);
    // Pointed hood & shadowed face with amber eyes
    shape('M6 -14 Q16 -22 24 -12 Q25 -2 14 0 Q6 -4 6 -14 Z', '#364352', ink, 2.0);
    oval(19, -9, 2.1, 1.8, '#ffd44d');
    ctx.restore();

    ctx.restore();
    drawSirenWash(frame, 1.25);
  }

  // SHOT 11B/C (f1518..1597, 1:03.2..1:06.6): Rhythmic Overhead POV Empty Drawer Yanks ("No bat. No pipe.")!
  function drawShot11PovDrawer(frame, secondDrawer) {
    const start = secondDrawer ? 1558 : 1518;
    const pull = tween(frame, start, start + 14);
    const jolt = frame >= start + 13 && frame <= start + 18 ? Math.sin((frame - start) * 2.6) * 4 : 0;

    rect('#1a232a', 0, 0, W, H);
    rect('#4b5860', 0, 0, W, 110); // Counter edge top
    rect('#253138', 0, 106, W, 12);

    ctx.save();
    ctx.translate(0, mix(-180, 10, pull) + jolt);
    // Wooden kitchen drawer interior box yanked open toward camera
    rect('#3a2c22', 140, 120, 680, 340);
    rect('#544032', 162, 142, 636, 296);
    shape('M140 120 H820 V460 H140Z', null, ink, 4);
    shape('M162 142 H798 V438 H162Z', null, '#241a13', 3);

    if (!secondDrawer) {
      // Drawer #1: Wooden tray with useless spoons, forks, torn foil — NO WEAPON!
      rect('#453327', 180, 160, 180, 260);
      rect('#453327', 380, 160, 180, 260);
      rect('#453327', 580, 160, 200, 260);
      // Small spoons & forks
      for (const sx of [215, 255, 295]) {
        rect('#aebcc4', sx, 220, 8, 130);
        oval(sx + 4, 205, 11, 18, '#c8d6de', ink, 1.8);
      }
      // Crumpled aluminum foil box
      shape('M610 190 H750 V380 H610Z', '#9aa9b2', ink, 2.2);
      label('FOIL', 680, 295, 22, '#222d34');
      // Empty middle tray dust
      oval(470, 290, 42, 12, 'rgba(20, 14, 10, 0.25)');
    } else {
      // Drawer #2: Empty folded dishcloths & rubber bands — NO BAT, NO PIPE!
      shape('M200 180 L430 195 L415 385 L185 370Z', '#5a6b73', ink, 2.4);
      shape('M220 220 H400 M215 270 H395 M210 320 H390', null, '#7a8c94', 2);
      shape('M510 210 L740 190 L760 365 L525 390Z', '#786c5c', ink, 2.4);
      oval(470, 395, 26, 12, null, '#a84842', 3); // lone rubber band
    }
    // Drawer pull handle at bottom edge
    rect('#222a30', 380, 456, 200, 22);
    rect('#8fa0a8', 410, 464, 140, 8);
    ctx.restore();
    drawSirenWash(frame, 0.75);
  }

  // SHOT 11D (f1598..1705, 1:06.6..1:11.1): Vertical-Arm POV Knife Draw + Back->Knife->Front Grip + Star Glint Sweep!
  function drawShot11dPovKnife(frame) {
    rect('#121c24', 0, 0, W, H);
    rect('#253138', 0, 326, W, 214);
    rect('#4b5860', 0, 318, W, 10);

    const lift = tween(frame, 1606, 1656);
    const zoom = mix(1.0, 1.09, tween(frame, 1598, 1705));

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Vertical forearm rising cleanly from bottom-center-left; knife held horizontally/slightly angled!
    ctx.save();
    ctx.translate(390, mix(390, 286, lift));
    ctx.rotate(mix(0.16, -0.04, lift));

    // 1) BACK LAYER: Vertical cream shirt sleeve, flush cuff & rear palm behind the knife handle
    window.drawWeaponHandBack(ctx, 'knife-grip', 0, 0, 2.05, 0, { bare: true, showSleeve: true });

    // 2) PROP LAYER: Dark riveted chef's knife handle (butt extending cleanly past pinky) + gleaming steel blade
    shape('M-94 -15 H48 V19 H-94 Q-108 2 -94 -15 Z', '#20282e', ink, 2.8);
    for (const rx of [-76, -54]) oval(rx, 2, 4.2, 4.2, '#a6b5bd');
    // Steel bolster + wide chef's blade emerging cleanly forward from index-finger/thumb web
    shape('M46 -18 L60 -18 L60 28 L46 22 Z', '#9cb0ba', ink, 2.2);
    shape('M58 -18 L314 -18 Q352 -14 384 16 Q290 36 58 32 Z', '#c5d6df', ink, 2.8);
    shape('M60 -15 L312 -15 372 13 60 10 Z', '#eaf5fa');
    const glintT = tween(frame, 1644, 1692);
    const glintX = mix(68, 336, glintT);
    shape(`M${glintX} -16 L${glintX + 26} -16 ${glintX + 10} 26 ${glintX - 16} 26 Z`, 'rgba(255, 255, 255, 0.64)');
    if (glintT > 0.05 && glintT < 0.95) {
      drawStarGlint(glintX + 14, -4, 30 * Math.sin(Math.PI * glintT), 0.95);
    }

    // 3) FRONT LAYER: 4 sculpted curled fingers wrapping over the handle + opposing thumb locked on TOP!
    window.drawWeaponHandFront(ctx, 'knife-grip', 0, 0, 2.05, 0, { bare: true });

    ctx.restore();
    ctx.restore();
    drawSirenWash(frame, 0.75);
  }

  // SHOT 12 (f1706..1799, 1:11.1..1:15.0): Official Dramatic LOW-ANGLE Hero Hold + Slow 1.0 -> 1.16x Creeping Push-In!
  function drawShot12LowAngleHero(frame) {
    const zoom = mix(1.0, 1.16, tween(frame, 1706, 1799));
    const breath = Math.sin(frame * 0.11) * 1.6;

    // Dark apartment room behind him + barricaded bookshelf door left + burning city window right
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0c141c');
    bg.addColorStop(1, '#1a2732');
    rect(bg, 0, 0, W, H);
    rect('#2b221c', 48, 86, 146, 454);
    rect('#4b3526', 64, 128, 122, 412);
    for (const sy of [210, 310, 410]) rect('#261a12', 70, sy, 110, 10);

    rect('#0b1117', 716, 44, 210, 310);
    const sky = ctx.createLinearGradient(716, 44, 716, 354);
    sky.addColorStop(0, '#0a111c');
    sky.addColorStop(0.6, '#261d28');
    sky.addColorStop(1, '#752b22');
    rect(sky, 724, 52, 194, 294);
    rect('#0e151f', 744, 150, 52, 196);
    rect('#101924', 816, 114, 58, 232);
    if (Math.floor(frame / 16) % 2 === 0) oval(845, 108, 4, 4, '#ff4842');
    shape('M716 44 H926 V354 H716Z', null, '#152028', 8);
    rect('#152028', 820, 44, 6, 310);
    rect('#152028', 716, 198, 210, 6);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Official Dramatic Low-Angle Front Series Lead (hideLimbs: true so both arms connect cleanly via 2-bone IK!)
    ctx.save();
    ctx.scale(1.06, 1.0);
    window.drawAnatomyTurnaround(ctx, 453, 1296 + breath, 2.52, 'front', {
      hideLimbs: true,
      expression: 'head-determined',
      headPitch: -0.72,
      eyeOffset: [0, -1.0],
    });
    ctx.restore();

    // Connected Left Arm hanging naturally down-left from real left shoulder
    window.drawArmChain(ctx, [368, 412 + breath], [344, 640 + breath], {
      upperLen: 126, lowerLen: 120, bendDir: 1, width: 42, cardboard: false, gloved: false,
    });

    // Connected Right Arm: elbow drops DOWNWARD (bendDir: 1) so forearm rises VERTICALLY to grip the chef's knife!
    const wristX = 654, wristY = 452 + breath;
    window.drawArmChain(ctx, [592, 412 + breath], [wristX, wristY + 18], {
      upperLen: 126, lowerLen: 120, bendDir: 1, width: 42, cardboard: false, gloved: false,
    });

    // Sculpted 2-Layer Knife Grip (BACK -> KNIFE -> FRONT) anchored directly on his right wrist!
    ctx.save();
    ctx.translate(wristX, wristY);
    ctx.rotate(-0.18);
    window.drawWeaponHandBack(ctx, 'knife-grip', 0, 0, 1.24, 0, { bare: true });
    shape('M-56 -9 H28 V12 H-56 Q-64 1 -56 -9 Z', '#20282e', ink, 2.4);
    for (const rx of [-44, -30]) oval(rx, 1.5, 2.6, 2.6, '#a6b5bd');
    shape('M26 -12 L35 -12 L35 17 L26 14 Z', '#9cb0ba', ink, 2.0);
    shape('M34 -12 L182 -12 Q204 -10 220 10 Q168 23 34 20 Z', '#c9dbe4', ink, 2.6);
    shape('M36 -10 L180 -10 212 8 36 6 Z', '#eef7fc');
    const glint = mix(42, 184, tween(frame, 1730, 1782));
    shape(`M${glint} -11 L${glint + 20} -11 ${glint + 8} 17 ${glint - 12} 17 Z`, 'rgba(255, 255, 255, 0.58)');
    window.drawWeaponHandFront(ctx, 'knife-grip', 0, 0, 1.24, 0, { bare: true });
    ctx.restore();

    ctx.restore();

    // Warm orange city-fire glow from right window + police siren strobes!
    const flk = 0.82 + 0.18 * Math.sin(frame * 0.45);
    const fg = ctx.createRadialGradient(840, 260, 20, 840, 260, 560);
    fg.addColorStop(0, `rgba(255, 112, 46, ${0.36 * flk})`);
    fg.addColorStop(1, 'rgba(255, 112, 46, 0)');
    rect(fg, 0, 0, W, H);
    drawSirenWash(frame, 1.25);
  }

  // Foreground dark parallax wipe helper (Nightmare Roulette 1:03 / 2:36 urgency speed technique!)
  function drawForegroundParallaxWipe(progress, xStart, xEnd, width, isLamp = false) {
    const px = mix(xStart, xEnd, progress);
    if (px < -140 || px > W + 140) return;
    ctx.save();
    if (isLamp) {
      // Dark silhouetted foreground floor lamp post & shade wiping in front of the walking lead!
      rect('#070d12dd', px, 115, 14, 425);
      shape(`M${px - 36} 125 L${px + 50} 125 L${px + 34} 38 L${px - 20} 38Z`, '#0a1218ee', '#04070a', 3);
    } else {
      // Dark kitchen doorframe pillar wiping smoothly across foreground!
      rect('#070d12e8', px, 0, width, H);
      rect('#121d26aa', px + width - 6, 0, 6, H);
    }
    ctx.restore();
  }

  window.renderCh1aFrame = async (frame, cutout, anchors) => {
    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    if (frame < 120) {
      // Shot 1 (0:00.0..0:05.0): Official Rear OTS dark gaming desk + slow push-in + controller drop!
      drawShot1OtsGaming(frame);
    } else if (frame < 202) {
      // Shot 2 (0:05.0..0:08.4): Overhead desk insert — rattling phone + studio SVG hand grab!
      drawShot2DeskPhone(frame);
    } else if (frame < 278) {
      // Shot 3 (0:08.4..0:11.6): Downward POV glaring red FEDERAL LAB BREACH phone + tremor + sirens!
      drawShot3PovPhone(frame);
    } else if (frame < 338) {
      // Shot 4A (0:11.6..0:14.1): Official sculpted Front Reaction -> snappy sideways eye-dart + sweat drop!
      drawShot4aEyeDart(frame);
    } else if (frame < 374) {
      // Shot 4B (0:14.1..0:15.6): Rapid Subjective POV Whip-Pan right across dark wall onto strobe-lit window!
      drawShot4bWhipPan(frame);
    } else if (frame < 463) {
      // Shot 4C (0:15.6..0:19.3): Tight Front Panic Portrait -> 5-frame OFF-CENTER ECU CRASH-ZOOM DREAD!
      drawShot4cCrashZoomDread(frame);
    } else if (frame < 531) {
      // Shot 5 (0:19.3..0:22.1): Side OpenToonz grounded desk brace -> hard exhale -> determined resolve!
      ctx.save();
      ctx.translate(480, 270);
      ctx.scale(1.38, 1.38);
      ctx.translate(-340, -305);
      drawApartment(frame, { gameScreenRed: true, chairShift: 1.35 });
      await drawLead(cutout, 260, 466, 0.66, false);
      ctx.restore();
    } else if (frame < 581) {
      // Shot 6A (0:22.1..0:24.2): Official High-Angle Vulnerable apartment wide!
      drawShot6aHighAngleWide(frame);
    } else if (frame < 643) {
      // Shot 6B (0:24.2..0:26.8): Side stride left toward door + foreground parallax floor-lamp wipe!
      const p = tween(frame, 581, 642);
      drawApartment(frame, { gameScreenRed: true, chairShift: 1.35 });
      await drawLead(cutout, mix(295, 165, p), 466, 0.66, true);
      drawForegroundParallaxWipe(p, 110, 460, 24, true);
    } else if (frame < 703) {
      // Shot 6C (0:26.8..0:29.3): Studio SVG POV brass deadbolt lock turn + impact micro-jolt!
      drawShot6cPovDeadbolt(frame);
    } else if (frame < 814) {
      // Shot 7 (0:29.3..0:33.9): Dynamic OpenToonz Heavy Barricade Shove sliding bookshelf flush against door!
      const shift = tween(frame, 725, 782);
      drawApartment(frame, { shelfShift: shift, gameScreenRed: true, chairShift: -1.8 });
      await drawLead(cutout, mix(356, 254, shift), 466, 0.66, true);
    } else if (frame < 881) {
      // Shot 8A (0:33.9..0:36.7): Side walk right to fridge (with foreground doorframe parallax wipe!) & handle pull!
      const walkP = tween(frame, 814, 846);
      const open = tween(frame, 854, 878);
      drawApartment(frame, { shelfShift: 1, fridgeOpen: open, gameScreenRed: true, chairShift: -1.8 });
      await drawLead(cutout, mix(448, 554, walkP), 466, 0.66, false);
      drawForegroundParallaxWipe(walkP, 620, 240, 56, false);
    } else if (frame < 926) {
      // Shot 8A-Face (0:36.7..0:38.6): Tight Front look-down reaction bathed in cold fridge light!
      drawShot8aFridgeFace(frame);
    } else if (frame < 1044) {
      // Shot 8B (0:38.6..0:43.5): Downward POV empty 5-day fridge + creeping push-in!
      drawShot8bPovFridge(frame);
    } else if (frame < 1111) {
      // Shot 9A (0:43.5..0:46.3): Official Rear OTS at 7th-floor burning window!
      drawShot9aOtsWindow(frame);
    } else if (frame < 1154) {
      // Shot 9B (0:46.3..0:48.1): Tight look-down dread reaction ("and your stomach drops")!
      drawShot9bLookDownDread(frame);
    } else if (frame < 1471) {
      // Shot 10 (0:48.1..1:01.3): 4 Stepped Escalating Noun Push-Ins (Runners -> Smoker -> Boomer -> Hunter vault!)
      drawShot10SteppedStreetFrenzy(frame);
    } else if (frame < 1518) {
      // Shot 11A (1:01.3..1:03.2): Side OpenToonz frantic lunge to kitchen counter!
      const dOpen = tween(frame, 1488, 1512);
      ctx.save();
      ctx.translate(480, 270);
      ctx.scale(1.32, 1.32);
      ctx.translate(-515, -315);
      drawApartment(frame, { shelfShift: 1, drawerOpen: dOpen, gameScreenRed: true, chairShift: -1.8 });
      await drawLead(cutout, 438, 466, 0.66, false);
      ctx.restore();
    } else if (frame < 1558) {
      // Shot 11B (1:03.2..1:04.9): Rhythmic Overhead POV Drawer Yank #1 (empty spoons & foil!)
      drawShot11PovDrawer(frame, false);
    } else if (frame < 1598) {
      // Shot 11C (1:04.9..1:06.6): Rhythmic Overhead POV Drawer Yank #2 (dishcloths — "No bat. No pipe.")!
      drawShot11PovDrawer(frame, true);
    } else if (frame < 1706) {
      // Shot 11D (1:06.6..1:11.1): Studio SVG POV gleaming stainless kitchen knife draw + metallic star glint!
      drawShot11dPovKnife(frame);
    } else {
      // Shot 12 (1:11.1..1:15.0): Official Dramatic Low-Angle Hero Hold + slow creeping push-in!
      drawShot12LowAngleHero(frame);
    }

    // Film grain & cinematic horror vignette
    ctx.drawImage(grain, 0, 0);
    const vig = ctx.createRadialGradient(480, 270, 260, 480, 270, 620);
    vig.addColorStop(0, '#050a0f00');
    vig.addColorStop(1, '#050a0f88');
    rect(vig, 0, 0, W, H);

    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  };
})();
