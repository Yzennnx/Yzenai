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

  // Siren red/blue wash helper (flashes through 7F window from f175 onward!)
  function drawSirenWash(frame, strength = 1) {
    if (frame < 175) return;
    const phase = Math.sin(frame * 0.34);
    const isRed = phase >= 0;
    const a = Math.abs(phase) * 0.24 * strength;
    const g = ctx.createRadialGradient(840, 210, 40, 840, 210, 620);
    g.addColorStop(0, isRed ? `rgba(255, 58, 52, ${a})` : `rgba(54, 148, 255, ${a})`);
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    rect(g, 0, 0, W, H);
  }

  // Shot 1 (f0..83): OVER-THE-SHOULDER REAR-3/4 VIEW looking past lead's hunched back straight at YOU ARE DEAD monitor!
  function drawShot1OtsGaming(frame) {
    const slump = tween(frame, 54, 78);

    // Dark apartment back wall + depth
    const wall = ctx.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, '#0e161d');
    wall.addColorStop(0.75, '#1b2833');
    wall.addColorStop(1, '#121b22');
    rect(wall, 0, 0, W, H);
    for (let x = 60; x < W; x += 130) rect('#09101566', x, 0, 2, H);

    // Right background: 7th-floor dark night skyline window (calm before sirens!)
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

    // Wide wooden gaming desk stretching across mid-ground
    rect('#2b211a', 175, 376, 560, 24);
    rect('#1a1410', 175, 400, 560, 140);
    // Keyboard & mouse & dark phone sitting on desk right of monitor
    shape('M392 384 L558 384 568 395 384 395Z', '#192128', ink, 1.8);
    oval(592, 389, 12, 6, '#1c252c', ink, 1.4);
    // Dark phone face-up on right edge of desk (foreshadowing Shot 2!)
    shape('M644 382 L674 382 682 396 648 396Z', '#151c22', ink, 1.8);

    // HUGE glowing crimson desktop monitor ("YOU ARE DEAD" — Left 4 Dead death screen!)
    const mx = 490, my = 205;
    // Monitor stand & base
    rect('#151c22', mx - 24, my + 106, 48, 66);
    shape(`M${mx - 68} ${my + 166} H${mx + 68} L${mx + 78} ${my + 176} H${mx - 78}Z`, '#202a32', ink, 2);
    // Bezel
    shape(`M${mx - 178} ${my - 108} H${mx + 178} V${my + 108} H${mx - 178}Z`, '#141a20', ink, 3.2);
    // Crimson death screen
    const scr = ctx.createLinearGradient(mx, my - 98, mx, my + 98);
    scr.addColorStop(0, '#6e1418');
    scr.addColorStop(0.55, '#8f1b1f');
    scr.addColorStop(1, '#4a0d10');
    rect(scr, mx - 168, my - 98, 336, 196);
    // Subtle dark zombie hand silhouette on death screen
    shape(`M${mx - 90} ${my + 98} L${mx - 76} ${my + 26} ${mx - 60} ${my + 28} ${mx - 64} ${my + 72} ${mx - 42} ${my + 10} ${mx - 26} ${my + 14} ${mx - 36} ${my + 70} ${mx - 10} ${my + 18} ${mx + 4} ${my + 24} ${mx - 10} ${my + 74} ${mx + 18} ${my + 40} ${mx + 30} ${my + 50} ${mx + 10} ${my + 98}Z`, 'rgba(20, 6, 8, 0.35)');
    // Death screen text
    const pulse = 0.85 + 0.15 * Math.sin(frame * 0.25);
    ctx.save();
    ctx.globalAlpha = pulse;
    label('YOU ARE DEAD', mx, my - 8, 36, '#ffd44d');
    label('RESTARTING CHAPTER...', mx, my + 32, 14, '#ffb0a8');
    ctx.restore();

    // Unclipped crimson screen glow flooding the room and hitting the lead's shoulder/hair
    const mg = ctx.createRadialGradient(mx, my, 30, mx, my, 390);
    mg.addColorStop(0, 'rgba(240, 48, 42, 0.30)');
    mg.addColorStop(1, 'rgba(240, 48, 42, 0)');
    rect(mg, 0, 0, W, H);

    // Foreground-left: Hand-crafted organic Rear-3/4 Over-the-Shoulder lead (smooth shoulders, natural neck & tousled hair!)
    ctx.save();
    const breath = Math.sin(frame * 0.14) * 2.2;
    const lx = 242 + (frame < 46 ? Math.sin(frame * 1.1) * 0.9 : 0);
    const ly = 266 + slump * 16 + breath;
    const headDrop = slump * 10;

    // Subtle left & right upper arms leaning forward naturally toward desk/controller (tucked inside rounded shoulders)
    shape(`M${lx - 72} ${ly + 66} Q${lx - 76} ${ly + 125} ${lx - 68} ${ly + 195} L${lx - 26} ${ly + 195} L${lx - 28} ${ly + 70}Z`, '#c8c1ac', '#253a3b', 2.6);
    shape(`M${lx + 64} ${ly + 52} Q${lx + 96} ${ly + 96} ${lx + 108} ${ly + 148} L${lx + 68} ${ly + 168} Q${lx + 52} ${ly + 118} ${lx + 38} ${ly + 72}Z`, '#e8e1cc', '#253a3b', 2.6);

    // Smoothly curved cream shirt back & natural sloped trapezius/shoulders (ZERO boxy shoulder spikes!)
    shape(
      `M${lx - 24} ${ly - 6} Q${lx} ${ly + 4} ${lx + 24} ${ly - 6} ` +
      `C${lx + 52} ${ly + 4} ${lx + 84} ${ly + 22} ${lx + 88} ${ly + 56} ` +
      `L${lx + 70} ${ly + 215} H${lx - 68} L${lx - 76} ${ly + 60} ` +
      `C${lx - 74} ${ly + 24} ${lx - 50} ${ly + 4} ${lx - 24} ${ly - 6}Z`,
      '#e8e1cc', '#253a3b', 3
    );
    // Natural shirt shadow & back yoke seam
    shape(`M${lx - 68} ${ly + 58} C${lx - 54} ${ly + 110} ${lx - 50} ${ly + 160} ${lx - 48} ${ly + 212} H${lx - 68} L${lx - 76} ${ly + 60}Z`, '#c8c1ac');
    shape(`M${lx - 52} ${ly + 32} Q${lx + 2} ${ly + 46} ${lx + 58} ${ly + 28}`, null, '#a49c86', 2);
    shape(`M${lx - 2} ${ly + 42} Q${lx + 4} ${ly + 82} ${lx} ${ly + 120}`, null, '#b8b09b', 1.8);
    // Shirt back collar neatly hugging the neck
    shape(`M${lx - 25} ${ly - 8} Q${lx} ${ly + 6} ${lx + 25} ${ly - 8} L${lx + 29} ${ly + 6} Q${lx} ${ly + 19} ${lx - 29} ${ly + 6}Z`, '#f6efdf', '#253a3b', 2.4);

    // Proportional natural neck
    shape(`M${lx - 19} ${ly - 34 + headDrop * 0.5} L${lx + 19} ${ly - 34 + headDrop * 0.5} L${lx + 23} ${ly - 3} Q${lx} ${ly + 7} ${lx - 23} ${ly - 3}Z`, '#cf956f', '#253a3b', 2.6);

    // Head from rear-3/4 (naturally seated on neck — tilts slightly forward when playing, droops softly on death!)
    const hx = lx + 4, hy = ly - 76 + headDrop;
    // Left ear peeking naturally on the 3/4 side
    oval(hx - 48, hy + 10, 9, 14, '#dda07d', '#253a3b', 2.6);
    // Lower nape & jawline
    shape(`M${hx - 44} ${hy + 6} Q${hx - 36} ${hy + 44} ${hx} ${hy + 50} Q${hx + 38} ${hy + 46} ${hx + 46} ${hy + 12} L${hx + 44} ${hy - 22} H${hx - 44}Z`, '#e7ae87', '#253a3b', 2.6);
    // Organic sculpted chestnut hair crown & tapered nape (matching reference-sheet palette!)
    shape(
      `M${hx - 48} ${hy + 10} C${hx - 58} ${hy - 18} ${hx - 50} ${hy - 56} ${hx - 14} ${hy - 64} ` +
      `C${hx + 22} ${hy - 72} ${hx + 56} ${hy - 46} ${hx + 54} ${hy - 6} ` +
      `C${hx + 52} ${hy + 18} ${hx + 40} ${hy + 32} ${hx + 24} ${hy + 38} ` +
      `L${hx + 10} ${hy + 33} L${hx} ${hy + 44} L${hx - 14} ${hy + 34} L${hx - 28} ${hy + 36} ` +
      `Q${hx - 42} ${hy + 26} ${hx - 48} ${hy + 10}Z`,
      '#644638', '#253a3b', 3
    );
    // Warm chestnut hair highlight sweep
    shape(`M${hx - 34} ${hy - 26} Q${hx - 6} ${hy - 56} ${hx + 28} ${hy - 44} Q${hx + 44} ${hy - 34} ${hx + 44} ${hy - 16} Q${hx + 18} ${hy - 36} ${hx - 8} ${hy - 24} L${hx - 26} ${hy - 12}Z`, '#89624c');
    // Subtle crimson monitor rim-light along right silhouette edge of hair & shoulder!
    shape(`M${hx + 34} ${hy - 46} Q${hx + 56} ${hy - 24} ${hx + 50} ${hy + 12}`, null, 'rgba(255, 104, 86, 0.55)', 3.2);
    shape(`M${lx + 62} ${ly + 16} Q${lx + 86} ${ly + 32} ${lx + 86} ${ly + 66}`, null, 'rgba(255, 104, 86, 0.45)', 3);

    // Tall sleek ergonomic swivel chair backrest rising behind his lower/mid back
    const cy = 374 + slump * 8;
    shape(`M136 ${cy + 24} Q142 ${cy - 8} 184 ${cy - 10} H282 Q322 ${cy - 8} 328 ${cy + 24} L342 548 H122Z`, '#182026', ink, 3.2);
    shape(`M164 ${cy + 14} Q170 ${cy + 2} 194 ${cy + 2} H272 Q296 ${cy + 2} 302 ${cy + 14} L312 542 H154Z`, '#232e36');
    shape(`M168 ${cy + 46} H298`, null, '#151c22', 2.4);
    ctx.restore();

    // Soft ambient red screen bounce
    const rim = ctx.createRadialGradient(340, 260, 10, 340, 260, 185);
    rim.addColorStop(0, 'rgba(255, 70, 58, 0.18)');
    rim.addColorStop(1, 'rgba(255, 70, 58, 0)');
    rect(rim, 0, 0, W, H);
  }

  // Shot 4 (f278..371): Hand-crafted expressive FRONT CLOSE-UP -> SMOOTH continuous head turn toward window!
  function drawShot4FrontReaction(frame) {
    const local = frame - 278;
    const eyeDart = tween(frame, 306, 314); // Eyes dart right first when sirens swell!
    const headTurn = tween(frame, 314, 332); // Smooth continuous head turn from front (0) -> 3/4 look right (1)!
    const tremorX = Math.sin(local * 1.6) * 1.3;
    const tremorY = Math.cos(local * 1.2) * 1.0;

    // Dark apartment room depth behind him (bookshelf left, front door right)
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d151c');
    bg.addColorStop(1, '#18242e');
    rect(bg, 0, 0, W, H);
    rect('#221813', 70, 40, 165, 500);
    rect('#3b2a20', 80, 52, 145, 488);
    for (const sy of [140, 260, 380]) {
      rect('#211610', 84, sy, 138, 12);
      rect('#5e292e', 94, sy - 54, 22, 54);
      rect('#2a424a', 122, sy - 64, 26, 64);
      rect('#78623c', 154, sy - 50, 20, 50);
      rect('#394a39', 180, sy - 58, 24, 58);
    }
    rect('#121a20', 742, 36, 176, 504);
    rect('#2e2520', 754, 48, 152, 492);
    oval(776, 320, 8, 8, '#a68b52');

    // Swivel chair headrest cleanly behind shoulders
    shape('M348 338 Q356 294 408 290 H552 Q604 294 612 338 L628 548 H332Z', '#182026', ink, 3);

    // Smooth camera push-in (1.0 -> 1.08) + sculpted close-up bust matching official series-lead design!
    const zoom = mix(1.0, 1.08, tween(frame, 278, 371));
    ctx.save();
    ctx.translate(480, 275);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -275);

    const cx = 480 + tremorX;
    const cy = 372 + tremorY;

    // Smoothly curved shoulders & cream dress shirt (ZERO boxy shoulder spikes!)
    shape(
      `M${cx - 32} ${cy - 18} C${cx - 82} ${cy - 8} ${cx - 122} ${cy + 14} ${cx - 134} ${cy + 62} ` +
      `L${cx - 152} ${cy + 200} H${cx + 152} L${cx + 134} ${cy + 62} ` +
      `C${cx + 122} ${cy + 14} ${cx + 82} ${cy - 8} ${cx + 32} ${cy - 18}Z`,
      '#e8e1cc', '#253a3b', 3.2
    );
    // Natural sleeve seam curves & smooth soft left shadow (no hard rectangular cutoff!)
    shape(`M${cx - 98} ${cy + 26} Q${cx - 90} ${cy + 95} ${cx - 96} ${cy + 195}`, null, '#a49c86', 2.4);
    shape(`M${cx + 98} ${cy + 26} Q${cx + 90} ${cy + 95} ${cx + 96} ${cy + 195}`, null, '#a49c86', 2.4);
    shape(`M${cx - 104} ${cy + 22} Q${cx - 126} ${cy + 40} ${cx - 134} ${cy + 62} L${cx - 152} ${cy + 200} H${cx - 122} Q${cx - 110} ${cy + 100} ${cx - 104} ${cy + 22}Z`, '#d4cdba');

    // Burgundy tie & crisp shirt collar
    const tieX = cx + headTurn * 10;
    shape(`M${tieX - 11} ${cy + 14} H${tieX + 11} L${tieX + 18} ${cy + 196} H${tieX - 18}Z`, '#813b43', '#253a3b', 2.6);
    shape(`M${cx - 30} ${cy - 20} L${tieX} ${cy + 10} L${cx + 30} ${cy - 20} L${cx + 46} ${cy - 4} L${tieX + 24} ${cy + 30} L${tieX} ${cy + 12} L${tieX - 24} ${cy + 30} L${cx - 46} ${cy - 4}Z`, '#f6efdf', '#253a3b', 2.6);
    shape(`M${tieX - 14} ${cy + 8} H${tieX + 14} L${tieX + 9} ${cy + 28} H${tieX - 9}Z`, '#813b43', '#253a3b', 2.6);

    // Proportional human neck (matching reference-sheet.png ratio!)
    shape(`M${cx - 21} ${cy - 54} H${cx + 21} L${cx + 26} ${cy - 14} Q${cx} ${cy + 2} ${cx - 26} ${cy - 14}Z`, '#cf956f', '#253a3b', 2.8);

    // Head seated naturally on neck with smooth continuous perspective shift (front -> 3/4 look right!)
    const hx = cx + headTurn * 6;
    const hy = cy - 112;
    const shift = headTurn * 24;

    // Ears (right ear recedes cleanly behind head as he turns right!)
    oval(hx - 68 - headTurn * 6, hy + 12, 11, 17, '#dda07d', '#253a3b', 2.8);
    if (headTurn < 0.72) {
      oval(hx + 68 - headTurn * 12, hy + 12, 11 * (1 - headTurn * 0.7), 17, '#dda07d', '#253a3b', 2.6);
    }

    // Sculpted face contour (smoothly shifts jaw/cheekbone on headTurn)
    shape(
      `M${hx - 66} ${hy - 22} Q${hx - 66} ${hy - 74} ${hx} ${hy - 82} ` +
      `Q${hx + 66} ${hy - 74} ${hx + 66} ${hy - 20} ` +
      `Q${hx + 64 + headTurn * 8} ${hy + 12} ${hx + 34 + headTurn * 12} ${hy + 48} ` +
      `Q${hx + headTurn * 14} ${hy + 70} ${hx - 18 + headTurn * 6} ${hy + 62} ` +
      `Q${hx - 54} ${hy + 44} ${hx - 64} ${hy + 8}Z`,
      '#e7ae87', '#253a3b', 3.2
    );

    // Swept chestnut hair & fringe matching reactions-front.png!
    shape(
      `M${hx - 62} ${hy + 12} L${hx - 72} ${hy - 12} C${hx - 78} ${hy - 56} ${hx - 48} ${hy - 94} ${hx + 2} ${hy - 94} ` +
      `C${hx + 48} ${hy - 94} ${hx + 76} ${hy - 62} ${hx + 74} ${hy - 16} ` +
      `L${hx + 62} ${hy - 26} L${hx + 54} ${hy - 14} L${hx + 44} ${hy - 38} ` +
      `L${hx + 18 + shift * 0.45} ${hy - 20} L${hx + 16 + shift * 0.45} ${hy - 38} ` +
      `L${hx - 8 + shift * 0.4} ${hy - 18} L${hx - 6 + shift * 0.4} ${hy - 36} ` +
      `L${hx - 34 + shift * 0.3} ${hy - 10} L${hx - 30 + shift * 0.3} ${hy - 34} ` +
      `Q${hx - 52} ${hy - 22} ${hx - 62} ${hy + 12}Z`,
      '#644638', '#253a3b', 3.2
    );
    shape(`M${hx - 54} ${hy - 34} Q${hx - 14} ${hy - 82} ${hx + 34} ${hy - 74} Q${hx + 58} ${hy - 66} ${hx + 62} ${hy - 46} Q${hx + 22} ${hy - 68} ${hx - 14} ${hy - 44} L${hx - 44} ${hy - 22}Z`, '#89624c');

    // Wide terrified eyes (left & right with clean spacing + smooth pupil dart right!)
    const leftEyeX = hx - 28 + shift * 0.85;
    const rightEyeX = hx + 28 + shift * 0.62;
    const rightEyeRx = mix(15, 11.5, headTurn);
    const pupilDx = eyeDart * 5.2 + headTurn * 2.2;
    const eyeY = hy - 2;

    // Raised tense alarmed eyebrows
    shape(`M${leftEyeX - 16} ${eyeY - 22} Q${leftEyeX} ${eyeY - 29} ${leftEyeX + 16} ${eyeY - 22}`, null, '#253a3b', 3.4);
    shape(`M${rightEyeX - rightEyeRx} ${eyeY - 22} Q${rightEyeX} ${eyeY - 29} ${rightEyeX + rightEyeRx} ${eyeY - 22}`, null, '#253a3b', 3.4);
    // Sclera
    oval(leftEyeX, eyeY, 15, 13, '#fff1dd', '#253a3b', 2.8);
    oval(rightEyeX, eyeY, rightEyeRx, 13, '#fff1dd', '#253a3b', 2.8);
    // Trembling dilated/pinned fear pupils
    oval(leftEyeX + pupilDx, eyeY, 4.4, 6.2, '#253a3b');
    oval(rightEyeX + pupilDx * 0.85, eyeY, 3.8, 6.2, '#253a3b');
    oval(leftEyeX + pupilDx - 1.5, eyeY - 2.2, 1.5, 1.5, '#ffffff');
    oval(rightEyeX + pupilDx * 0.85 - 1.2, eyeY - 2.2, 1.5, 1.5, '#ffffff');

    // Clean nose strictly BETWEEN the eyes (moves smoothly with shift, NEVER collides with right eye!)
    const noseX = hx + shift * 0.76;
    shape(`M${noseX} ${eyeY + 2} L${noseX + 5 + headTurn * 5} ${eyeY + 20} L${noseX - 2} ${eyeY + 23}`, null, '#253a3b', 2.8);

    // Shocked open mouth
    oval(hx + shift * 0.72, eyeY + 42, mix(11, 9.5, headTurn), 13.5, '#70463b', '#253a3b', 3);

    ctx.restore();

    // Strong crimson phone screen glow washing UPWARD from bottom center across chin, cheeks & eyes!
    const pg = ctx.createRadialGradient(480, 520, 20, 480, 480, 390);
    pg.addColorStop(0, 'rgba(255, 58, 50, 0.44)');
    pg.addColorStop(0.6, 'rgba(255, 58, 50, 0.14)');
    pg.addColorStop(1, 'rgba(255, 58, 50, 0)');
    rect(pg, 0, 0, W, H);

    // Dramatic red/blue police siren sweeps across his face from right window!
    const phase = Math.sin(frame * 0.42);
    const isRed = phase >= 0;
    const sa = Math.abs(phase) * 0.34;
    const sg = ctx.createLinearGradient(960, 140, 280, 360);
    sg.addColorStop(0, isRed ? `rgba(255, 52, 48, ${sa})` : `rgba(54, 152, 255, ${sa})`);
    sg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    rect(sg, 0, 0, W, H);
  }

  // Shared 16:9 7th-floor dark apartment backdrop
  function drawApartment(frame, opts = {}) {
    const { shelfShift = 0, fridgeOpen = 0, drawerOpen = 0, knifeTaken = false, gameScreenRed = true, chairShift = 0 } = opts;

    // Dark midnight walls
    const wall = ctx.createLinearGradient(0, 0, 0, 450);
    wall.addColorStop(0, '#121c24');
    wall.addColorStop(0.7, '#22323d');
    wall.addColorStop(1, '#18242c');
    rect(wall, 0, 0, W, H);

    // Subtle apartment wallpaper panels & baseboard
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
    oval(122, 302, 5, 5, '#d6b267', ink, 1.5); // handle
    oval(122, 278, 4, 4, '#d6b267', ink, 1.5); // deadbolt

    // Tall wooden bookshelf (slides left across door during Shot 7!)
    const bx = 186 - shelfShift * 102;
    rect('#261b15', bx, 186, 74, 254);
    rect('#4f3728', bx + 4, 190, 66, 246);
    for (const sy of [234, 286, 338, 390]) {
      rect('#2c1e16', bx + 6, sy, 62, 6);
      // Colored book spines
      rect('#753238', bx + 10, sy - 28, 10, 28);
      rect('#34525c', bx + 22, sy - 32, 12, 32);
      rect('#967c4c', bx + 36, sy - 26, 9, 26);
      rect('#495c48', bx + 48, sy - 30, 12, 30);
    }

    // Center-left: Gaming desk + crimson monitor (`YOU ARE DEAD`)
    rect('#2b221c', 292, 336, 146, 12);
    rect('#1c1612', 300, 348, 10, 96);
    rect('#1c1612', 420, 348, 10, 96);
    // Monitor
    rect('#12181d', 324, 248, 96, 66);
    rect(gameScreenRed ? '#5e161a' : '#243a42', 330, 254, 84, 54);
    rect('#1a2329', 364, 314, 16, 22);
    rect('#2b363d', 350, 332, 44, 6);
    if (gameScreenRed) {
      label('YOU ARE', 372, 276, 10, '#ff7369');
      label('DEAD', 372, 292, 14, '#ffd44d');
      // Soft crimson screen glow across wall & desk (unclipped rect so zero hard edge!)
      const mg = ctx.createRadialGradient(372, 280, 10, 372, 280, 155);
      mg.addColorStop(0, 'rgba(230, 48, 42, 0.34)');
      mg.addColorStop(1, 'rgba(230, 48, 42, 0)');
      rect(mg, 0, 0, W, H);
    }

    // Swivel gaming/office chair behind desk (sits flush under lead's hips; rolls left in Shot 5!)
    const cx = 256 - chairShift * 42;
    // Backrest & spine post
    shape(`M${cx - 34} 308 Q${cx - 36} 300 ${cx - 26} 300 H${cx - 18} Q${cx - 12} 300 ${cx - 14} 310 L${cx - 18} 396 H${cx - 32}Z`, '#1f282e', ink, 2);
    rect('#151c20', cx - 22, 392, 10, 14);
    // Seat cushion
    shape(`M${cx - 34} 394 H${cx + 34} Q${cx + 40} 394 ${cx + 40} 402 V408 H${cx - 34}Z`, '#26323a', ink, 2);
    // Center gas cylinder & rolling caster base
    rect('#192126', cx - 4, 408, 8, 36);
    shape(`M${cx} 440 L${cx - 28} 454 H${cx - 18} L${cx} 446 L${cx + 18} 454 H${cx + 28}Z`, '#1b242a', ink, 1.8);
    oval(cx - 24, 456, 4, 4, '#10161a');
    oval(cx + 24, 456, 4, 4, '#10161a');
    oval(cx, 456, 4, 4, '#10161a');

    // Center-right: Kitchen counter + knife block + refrigerator
    // Counter & drawer
    rect('#3a444a', 474, 334, 126, 108);
    rect('#6b767c', 470, 326, 134, 10);
    rect('#283136', 484, 346, 106, 26);
    if (drawerOpen > 0.02) {
      rect('#475359', 484 - drawerOpen * 26, 348, 106, 24);
      rect('#1e262b', 488 - drawerOpen * 26, 352, 98, 16);
    }
    // Knife block on counter
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
      // Cold white interior light spilling out cleanly (unclipped rect gradient!)
      rect('#d8f2ff', 618, 272, 74, 160);
      const fg = ctx.createRadialGradient(620, 340, 10, 620, 340, 185);
      fg.addColorStop(0, `rgba(215, 244, 255, ${0.52 * fridgeOpen})`);
      fg.addColorStop(1, 'rgba(215, 244, 255, 0)');
      rect(fg, 0, 0, W, H);
    }

    // Far right: Large 7th-floor window looking out over burning night city skyline!
    rect('#0b1117', 744, 96, 176, 236);
    ctx.save();
    ctx.beginPath();
    ctx.rect(750, 102, 164, 224);
    ctx.clip();
    // Night skyline + distant fires + glowing amber haze (clipped cleanly inside window glass!)
    const sky = ctx.createLinearGradient(744, 96, 744, 332);
    sky.addColorStop(0, '#09101a');
    sky.addColorStop(0.65, '#1d2230');
    sky.addColorStop(1, frame >= 175 ? '#592522' : '#242c38');
    rect(sky, 750, 102, 164, 224);
    // City towers silhouette
    rect('#0e151d', 756, 188, 36, 138);
    rect('#111a24', 798, 146, 44, 180);
    rect('#0c131b', 848, 170, 58, 156);
    // Blinking red aviation light on tallest tower (Apex Tower foreshadow!)
    if (Math.floor(frame / 18) % 2 === 0) oval(820, 142, 3, 3, '#ff4842');
    // Distant fire glow at street level (clipped softly inside glass!)
    if (frame >= 175) {
      const flick = 0.75 + 0.25 * Math.sin(frame * 0.6);
      const wg = ctx.createRadialGradient(832, 326, 8, 832, 326, 88);
      wg.addColorStop(0, `rgba(255, 118, 48, ${0.52 * flick})`);
      wg.addColorStop(1, 'rgba(255, 118, 48, 0)');
      rect(wg, 750, 102, 164, 224);
    }
    ctx.restore();
    // Window frame & mullions
    shape('M744 96 H920 V332 H744Z', null, '#152028', 7);
    rect('#152028', 830, 96, 5, 236);
    rect('#152028', 744, 212, 176, 5);

    drawSirenWash(frame, 1.0);
  }

  // Helper to composite the 540x960 OpenToonz lead into 960x540 widescreen space!
  async function drawLead(cutout, worldX, worldFloorY, scale, flipLeft = false) {
    if (!cutout) return;
    const img = await loadPng(cutout);
    // Contact shadow
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

  // Shot 2 (f84..155): High-angle top-down desk insert — controller + violently vibrating phone + hand pickup!
  function drawShot2DeskPhone(frame) {
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

    // Smartphone vibrating violently on desk from f96 (4.00s), lifted by right hand from f136!
    const vib = frame >= 96 && frame < 136 ? Math.sin(frame * 4.5) * 4.5 : 0;
    const lift = tween(frame, 136, 155);
    const px = 610 + vib - lift * 60;
    const py = 275 + vib * 0.5 - lift * 95;
    const lit = frame >= 96;

    if (lit) {
      const glow = ctx.createRadialGradient(px, py, 20, px, py, 270);
      glow.addColorStop(0, 'rgba(255, 62, 54, 0.52)');
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
      // Vibration arcs beside phone
      if (frame < 136) {
        shape('M-70 -40 Q-78 0 -70 40 M70 -40 Q78 0 70 40', null, '#ff9482aa', 3);
      }
    }
    ctx.restore();

    // Right hand entering from bottom-right edge to grip lower-right side of phone bezel cleanly (f116..155)
    if (frame >= 116) {
      const reach = tween(frame, 116, 138);
      ctx.save();
      ctx.translate(mix(790, px + 56, reach), mix(545, py + 78, reach));
      ctx.rotate(-0.42);
      // Forearm sleeve extending cleanly past bottom-right border (zero floating cutoff!)
      shape('M-34 86 L40 86 L72 320 L-46 320Z', '#e8e1cc', '#253a3b', 3);
      shape('M-36 74 Q4 82 42 72 L46 100 Q4 110 -40 100Z', '#ede5d0', '#253a3b', 3);
      oval(28, 90, 4, 4, '#c6bda8', '#8a8575', 1);
      // Natural curved gripping hand wrapping phone's lower-right edge (leaving ALERT & LOCKDOWN readable!)
      shape('M-28 78 Q-34 42 -42 18 Q-48 2 -34 -6 Q-22 -12 -14 8 L-6 26 L-12 -36 Q-12 -52 0 -52 Q12 -52 12 -34 L14 8 L16 -46 Q18 -62 30 -60 Q40 -58 38 -40 L34 12 L42 -32 Q46 -46 56 -42 Q66 -38 60 -18 L48 34 Q44 62 36 76Z', '#e7ae87', '#253a3b', 2.8);
      ctx.restore();
    }
  }

  // Shot 3 (f115..186): First-person POV glaring red FEDERAL BIO-LAB BREACH phone screen!
  function drawShot3PovPhone(frame) {
    rect('#0a1118', 0, 0, W, H);
    drawSirenWash(frame, 1.35);

    const shake = frame >= 138 ? Math.sin(frame * 2.1) * 2.2 : 0;
    const cx = 480 + shake, cy = 270 + shake * 0.6;

    // Soft unclipped phone glow halo
    const g = ctx.createRadialGradient(cx, cy, 35, cx, cy, 400);
    g.addColorStop(0, 'rgba(255, 52, 46, 0.42)');
    g.addColorStop(1, 'rgba(255, 52, 46, 0)');
    rect(g, 0, 0, W, H);

    // Fingers gripping right side behind bezel
    for (let i = 0; i < 4; i++) {
      oval(cx + 124, cy - 56 + i * 44, 24, 15, '#d99e7e', '#253a3b', 2.4);
    }

    // Large portrait phone frame centered in 16:9
    shape(`M${cx - 122} ${cy - 210} Q${cx - 122} ${cy - 228} ${cx - 104} ${cy - 228} H${cx + 104} Q${cx + 122} ${cy - 228} ${cx + 122} ${cy - 210} V${cy + 210} Q${cx + 122} ${cy + 228} ${cx + 104} ${cy + 228} H${cx - 104} Q${cx - 122} ${cy + 228} ${cx - 122} ${cy + 210}Z`, '#151c22', ink, 3.5);
    rect('#1a1014', cx - 110, cy - 206, 220, 412);

    // Flashing red emergency header
    const pulse = 0.72 + 0.28 * Math.sin(frame * 0.45);
    rect(`rgba(220, 34, 34, ${pulse})`, cx - 106, cy - 198, 212, 68);
    label('EMERGENCY ALERT', cx, cy - 166, 19, '#fff7e5');
    label('CITYWIDE LOCKDOWN', cx, cy - 142, 16, '#ffd44d');

    // Warning triangle icon
    shape(`M${cx} ${cy - 108} L${cx + 38} ${cy - 44} ${cx - 38} ${cy - 44}Z`, '#ffd44d', ink, 2.5);
    label('!', cx, cy - 55, 34, '#1a1014');

    label('FEDERAL BIO-LAB', cx, cy - 6, 20, '#ff8075');
    label('CONTAINMENT BREACH', cx, cy + 20, 17, '#f2e8d4');
    rect('#36181c', cx - 96, cy + 44, 192, 86);
    label('HOSTILE INFECTED', cx, cy + 72, 15, '#ffd44d');
    label('SIGHTED DOWNTOWN', cx, cy + 94, 15, '#f2e8d4');
    label('LOCK ALL DOORS', cx, cy + 116, 14, '#ff7369');

    // Scrolling bottom live ticker
    rect('#85181b', cx - 106, cy + 150, 212, 34);
    label('00:14 AM  ·  SHELTER IN PLACE', cx, cy + 172, 12, '#fff7e5');

    // Left-bezel gripping thumb, fuller palm heel & angled cream cuff from bottom-left!
    ctx.save();
    ctx.translate(cx - 120, cy + 64);
    shape('M-76 196 L-44 64 Q-32 8 -6 -14 Q16 -28 30 -12 Q42 4 22 26 Q8 42 4 64 L10 124 Q8 164 -10 196Z', '#e7ae87', '#253a3b', 2.8);
    // Subtle palm crease + natural thumb nail
    shape('M-24 62 Q-6 58 2 68', null, '#b98573', 1.6);
    oval(14, -4, 9, 12, '#f1c2a8', '#b98573', 1.1);
    ctx.translate(-46, 186);
    ctx.rotate(0.24);
    ctx.scale(1.85, 1.6);
    drawCuff();
    ctx.restore();
  }

  // Shot 6b (f461..515): POV right hand snapping heavy brass deadbolt vertical!
  function drawShot6Deadbolt(frame) {
    rect('#2b221c', 0, 0, W, H);
    rect('#3d3129', 140, 0, 680, H);
    rect('#121a20', 816, 0, 16, H);

    const turn = tween(frame, 480, 496);
    const bx = 560, by = 240;
    // Brass lock plate
    oval(bx, by, 72, 72, '#8c6d3e', ink, 3.5);
    oval(bx, by, 58, 58, '#c9a259', ink, 2.5);
    // Rotating thumb-turn lever (horizontal unlocked -> vertical LOCKED!)
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(mix(0, Math.PI / 2, turn));
    shape('M-46 -12 H46 Q52 0 46 12 H-46 Q-52 0 -46 -12Z', '#e6c178', ink, 2.8);
    ctx.restore();

    // Right hand pinching and snapping the lever vertical — forearm sleeve extends cleanly off bottom-left edge!
    const reach = tween(frame, 461, 478);
    ctx.save();
    ctx.translate(mix(310, bx - 40, reach), mix(360, by + 28, reach));
    ctx.rotate(mix(-0.2, 0.25, turn));
    ctx.scale(1.9, 1.9);
    ctx.translate(-110, -110);
    // Long cream shirt sleeve running off-screen bottom-left (no floating severed cuff!)
    shape('M-140 285 L52 152 L88 190 L-85 355Z', '#e8e1cc', '#253a3b', 2.4);
    // Pinching hand geometry matching our updated reference-sheet.svg
    shape('M40 165 Q61 148 72 132 L84 116 C90 106 96 101 106 100 L126 96 Q135 94 140 97 Q146 101 143 107 L130 118 Q123 124 113 129 Q110 144 102 155 C95 169 79 176 58 184Z', '#e7ae87', '#253a3b', 2.4);
    shape('M87 144 Q97 138 108 127 L123 112 Q129 105 134 103 Q142 99 146 105 Q150 110 145 116 L133 128 L118 144 Q111 154 100 159', '#e7ae87', '#253a3b', 2.1);
    ctx.save();
    ctx.translate(50, 174);
    ctx.rotate(42 * Math.PI / 180);
    ctx.scale(0.68, 1);
    drawCuff();
    ctx.restore();
    ctx.restore();
    if (turn > 0.9) label('LOCKED', bx, by + 115, 22, '#ffd44d');
  }

  // Shot 8b (f732..851): POV open empty refrigerator — 5 days of food max!
  function drawShot8PovFridge(frame) {
    // Cold stark interior fridge view
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#c8e4f2');
    bg.addColorStop(1, '#7ea0b3');
    rect(bg, 0, 0, W, H);
    // Inner walls
    shape('M0 0 H150 V540 H0Z', '#5a7887', ink, 3);
    shape('M810 0 H960 V540 H810Z', '#5a7887', ink, 3);
    // Glass shelves (mostly starkly EMPTY!)
    for (const sy of [175, 315, 450]) {
      rect('#3f5b69', 150, sy, 660, 12);
      rect('#e6f7ff', 150, sy, 660, 4);
    }
    // Sparse food: 5 lone cans + half-empty water jug + 1 small milk carton
    const cans = [[230, 134, '#c74d44'], [278, 134, '#d99e45'], [326, 134, '#4e8a6b'], [560, 274, '#c74d44'], [608, 274, '#4e8a6b']];
    for (const [cx, cy, col] of cans) {
      rect(col, cx, cy, 34, 42);
      shape(`M${cx} ${cy} H${cx + 34} V${cy + 42} H${cx}Z`, null, ink, 2);
      rect('#f5ebd4', cx + 4, cy + 12, 26, 14);
    }
    // Half-empty water jug
    shape('M645 78 H705 L716 112 V175 H634 V112Z', '#dff4ff', ink, 2.4);
    rect('#8cd4f5', 636, 136, 78, 37);
    // Small wilted carton
    shape('M240 245 L268 228 296 245 V315 H240Z', '#ece3cf', ink, 2.2);

    // Subtle mental tally badge fading in at f770
    const a = tween(frame, 765, 795);
    if (a > 0.02) {
      ctx.save();
      ctx.globalAlpha = a;
      rect('#0e1920dc', 330, 355, 300, 62);
      shape('M330 355 H630 V417 H330Z', null, '#ff7369', 2.5);
      label('FOOD LEFT: ~5 DAYS', 480, 394, 24, '#ffd44d');
      ctx.restore();
    }
  }

  // Shot 10 (f996..1235): High-angle 7th-floor POV street frenzy with L4D special infected silhouettes!
  function drawShot10StreetFrenzy(frame) {
    const pan = tween(frame, 996, 1235);
    ctx.save();
    ctx.translate(-pan * 180, 0); // Smooth widescreen pan across chaos avenue!

    // Dark wet asphalt avenue (width 1180 for pan)
    rect('#141c24', 0, 0, 1180, H);
    rect('#1f2a33', 0, 95, 1180, 350);
    // Dashed yellow center line
    for (let x = 20; x < 1160; x += 90) rect('#9e834466', x, 265, 48, 8);
    // Sidewalks top & bottom
    rect('#2d3840', 0, 0, 1180, 95);
    rect('#2d3840', 0, 445, 1180, 95);

    // Stalled wrecked cars & taxi with blazing headlights & flames!
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
    drawCar(590, 325, -0.35, '#9e7d34', true); // Yellow taxi
    drawCar(940, 220, 0.12, '#3a4952', false); // Wrecked bus/van

    // Flickering car fire at x=240
    const flk = 0.8 + 0.2 * Math.sin(frame * 0.7);
    oval(245, 225, 36 * flk, 28 * flk, 'rgba(255, 112, 40, 0.65)');
    oval(245, 225, 18 * flk, 14 * flk, 'rgba(255, 220, 110, 0.85)');

    // 1. Swarming Common Runners (frantic fast jerky motion with outstretched arms!)
    for (let i = 0; i < 16; i++) {
      const rx = ((i * 88 + frame * (2.6 + (i % 3) * 1.1)) % 1140);
      const ry = 130 + ((i * 53) % 270) + Math.sin(frame * 0.45 + i) * 7;
      oval(rx, ry + 14, 14, 5, '#070b0f88');
      // Outstretched reaching zombie arms!
      shape(`M${rx + 6} ${ry - 4} L${rx + 20} ${ry - 10} M${rx + 6} ${ry + 2} L${rx + 21} ${ry + 1}`, null, '#4c5e66', 3.4);
      shape(`M${rx - 9} ${ry - 6} L${rx + 8} ${ry - 8} ${rx + 12} ${ry + 12} ${rx - 10} ${ry + 12}Z`, '#36444a', ink, 1.6);
      oval(rx + 2, ry - 12, 7.5, 7.5, '#64757a', ink, 1.4);
    }

    // 2. SPECIAL INFECTED #1 — SMOKER-TYPE (tall hunched silhouette wreathed in soft glowing green spore mist!)
    const sx = 470 + Math.sin(frame * 0.08) * 10, sy = 155;
    const smg = ctx.createRadialGradient(sx + Math.sin(frame * 0.08) * 12, sy - 6, 10, sx, sy, 92);
    smg.addColorStop(0, 'rgba(104, 238, 122, 0.56)');
    smg.addColorStop(0.55, 'rgba(92, 210, 110, 0.24)');
    smg.addColorStop(1, 'rgba(92, 210, 110, 0)');
    rect(smg, sx - 100, sy - 100, 200, 200);
    // Long gaunt Smoker arms & hunched silhouette
    shape(`M${sx - 10} ${sy - 16} L${sx - 28} ${sy + 6} M${sx + 12} ${sy - 16} L${sx + 32} ${sy - 2}`, null, '#2e453a', 4.5);
    shape(`M${sx - 13} ${sy + 26} L${sx - 9} ${sy - 26} ${sx + 14} ${sy - 24} ${sx + 18} ${sy + 26}Z`, '#263830', ink, 2.2);
    oval(sx + 6, sy - 32, 10.5, 10.5, '#4f6e5c', ink, 1.8);
    // Glowing green spore boils & whipping tongue hint
    oval(sx + 12, sy - 28, 3.5, 3.5, '#9eff9c');
    shape(`M${sx + 14} ${sy - 26} Q${sx + 50} ${sy - 16 + Math.sin(frame * 0.4) * 11} ${sx + 82} ${sy - 2}`, null, '#b83c48', 3.4);

    // 3. SPECIAL INFECTED #2 — BLOATED BOOMER-TYPE (wide blistered silhouette with glowing yellow pustules at x=700!)
    const bx = 695 + Math.sin(frame * 0.06) * 14, by = 365;
    oval(bx, by + 26, 28, 10, '#070b0f88');
    oval(bx, by, 28, 25, '#465242', ink, 2.4);
    oval(bx, by - 26, 11, 10, '#62705a', ink, 1.8);
    // Glowing sickly yellow-green bile pustules
    for (const [px, py] of [[-12, -4], [10, 4], [2, -12], [-6, 12]]) {
      oval(bx + px, by + py, 5, 4, '#d9f26b', '#526324', 1);
    }

    // 4. SPECIAL INFECTED #3 — HOODED HUNTER-TYPE vaulting across taxi to van roof (f1140..1235)!
    const leap = tween(frame, 1140, 1192);
    const hx = mix(595, 920, leap);
    const hy = mix(318, 206, leap) - Math.sin(Math.PI * leap) * 120;
    shape(`M${hx - 16} ${hy + 10} Q${hx} ${hy - 18} ${hx + 18} ${hy - 6} L${hx + 22} ${hy + 14} ${hx - 14} ${hy + 16}Z`, '#2a333d', ink, 2.2);
    oval(hx + 12, hy - 10, 9, 9, '#3d4a57', ink, 1.8); // hooded head
    oval(hx + 16, hy - 11, 2.2, 2.2, '#ffd44d'); // feral eye glint

    ctx.restore();
    drawSirenWash(frame, 1.2);
  }

  // Shot 11b (f1320..1415): POV right hand drawing stainless chef's kitchen knife!
  function drawShot11PovKnife(frame) {
    rect('#121c24', 0, 0, W, H);
    rect('#253138', 0, 310, W, 230); // dark counter
    rect('#4b5860', 0, 304, W, 8);

    const lift = tween(frame, 1326, 1384);
    ctx.save();
    ctx.translate(480, mix(360, 260, lift));
    ctx.rotate(mix(0.32, -0.06, lift));

    // Gleaming stainless steel chef's kitchen knife blade!
    shape('M-20 -18 L215 -18 Q250 -14 275 18 L-20 34Z', '#c5d6df', ink, 2.8);
    shape('M-20 -16 L215 -16 266 16 -20 12Z', '#eaf5fa');
    // Cold light glint sweeping blade
    const glintX = mix(-10, 220, tween(frame, 1352, 1404));
    shape(`M${glintX} -16 L${glintX + 26} -16 ${glintX + 10} 26 ${glintX - 16} 26Z`, 'rgba(255, 255, 255, 0.55)');
    // Dark riveted handle
    shape('M-150 -14 H-18 V24 H-150 Q-162 5 -150 -14Z', '#222a30', ink, 2.8);
    for (const rx of [-124, -84, -44]) oval(rx, 5, 4, 4, '#a6b5bd');

    // Right hand gripping handle cleanly + cream shirt sleeve extending off left screen edge (no floating cuff!)
    ctx.save();
    ctx.translate(-86, 14);
    shape('M-460 -28 L-62 -24 L-62 32 L-460 54Z', '#e8e1cc', '#253a3b', 2.8);
    shape('M-46 -22 Q-20 -38 22 -34 L46 -26 Q56 0 42 30 Q18 46 -26 42 L-54 28Z', '#e7ae87', '#253a3b', 2.8);
    // Wrapped fingers over handle
    for (let i = 0; i < 4; i++) {
      shape(`M${-34 + i * 21} -16 Q${-24 + i * 21} -24 ${-14 + i * 21} -16 V24 Q${-24 + i * 21} 34 ${-34 + i * 21} 24Z`, '#e7ae87', '#253a3b', 2.2);
    }
    ctx.translate(-68, 6);
    ctx.rotate(1.52);
    ctx.scale(1.15, 1.15);
    drawCuff();
    ctx.restore();

    ctx.restore();
    drawSirenWash(frame, 0.7);
  }

  // Shot 9 (f1038..1175): OTS REAR-3/4 at 7th-floor window looking past his shoulder over burning night skyline!
  function drawShot9OtsWindow(frame) {
    const lean = tween(frame, 1044, 1084);
    const breath = Math.sin(frame * 0.14) * 1.8;

    // Dark apartment interior wall framing huge right/center window
    rect('#121b23', 0, 0, W, H);
    // Large panoramic 7th-floor window looking out over burning downtown!
    const sky = ctx.createLinearGradient(0, 24, 0, 440);
    sky.addColorStop(0, '#09101a');
    sky.addColorStop(0.55, '#1e2230');
    sky.addColorStop(1, '#6b2822');
    rect(sky, 270, 28, 650, 412);
    // City skyline silhouettes + Apex Tower blinking red beacon!
    rect('#0e151e', 295, 190, 96, 250);
    rect('#121c27', 410, 128, 118, 312);
    rect('#0c131c', 550, 160, 108, 280);
    rect('#101924', 680, 96, 126, 344); // Tallest tower (Apex Tower foreshadow!)
    rect('#0b111a', 822, 178, 86, 262);
    if (Math.floor(frame / 16) % 2 === 0) oval(743, 88, 5, 5, '#ff4842');
    // Distant rising orange/amber street fires & smoke plumes!
    const flk = 0.78 + 0.22 * Math.sin(frame * 0.55);
    const fg = ctx.createRadialGradient(560, 425, 20, 560, 425, 290);
    fg.addColorStop(0, `rgba(255, 118, 42, ${0.56 * flk})`);
    fg.addColorStop(1, 'rgba(255, 118, 42, 0)');
    rect(fg, 270, 28, 650, 412);
    // Window frame, sill & dark mullions
    shape('M270 28 H920 V440 H270Z', null, '#152028', 12);
    rect('#152028', 592, 28, 10, 412);
    rect('#152028', 270, 232, 650, 10);
    rect('#222f38', 256, 438, 680, 18);

    // Foreground-left: Lead from Rear-3/4 leaning gently forward, natural bent arm bracing palm onto window frame!
    ctx.save();
    const lx = 212 + lean * 22;
    const ly = 258 + breath;
    // Natural right upper arm + bent forearm bracing palm squarely onto the left vertical window mullion (x=270..295)!
    shape(`M${lx + 42} ${ly + 32} Q${lx + 84} ${ly + 52} ${lx + 102} ${ly + 82} L${lx + 124} ${ly + 14} L${lx + 96} ${ly + 4} L${lx + 76} ${ly + 48} L${lx + 46} ${ly + 14}Z`, '#e8e1cc', '#253a3b', 2.8);
    // Natural flat hand braced upright against window frame (tapered fingers, not a round oval!)
    shape(`M${lx + 102} ${ly + 8} L${lx + 114} ${ly - 22} Q${lx + 120} ${ly - 28} ${lx + 126} ${ly - 20} L${lx + 132} ${ly + 8} Q${lx + 126} ${ly + 20} ${lx + 110} ${ly + 18}Z`, '#e7ae87', '#253a3b', 2.4);
    // Smoothly curved cream shirt back tapering naturally into waist & dark slate trousers!
    shape(
      `M${lx - 26} ${ly - 6} Q${lx} ${ly + 4} ${lx + 26} ${ly - 6} ` +
      `C${lx + 56} ${ly + 4} ${lx + 82} ${ly + 24} ${lx + 82} ${ly + 58} ` +
      `Q${lx + 74} ${ly + 140} ${lx + 58} ${ly + 208} H${lx - 58} ` +
      `Q${lx - 72} ${ly + 140} ${lx - 78} ${ly + 60} ` +
      `C${lx - 76} ${ly + 24} ${lx - 52} ${ly + 4} ${lx - 26} ${ly - 6}Z`,
      '#e8e1cc', '#253a3b', 3.2
    );
    // Dark charcoal-blue trousers below waist (breaks up the tall cylinder!)
    shape(`M${lx - 58} ${ly + 206} H${lx + 58} L${lx + 64} 548 H${lx - 64}Z`, '#465366', '#253a3b', 3);
    shape(`M${lx - 72} ${ly + 60} Q${lx - 62} ${ly + 135} ${lx - 48} ${ly + 206} H${lx - 58} Q${lx - 72} ${ly + 140} ${lx - 78} ${ly + 60}Z`, '#c8c1ac');
    shape(`M${lx - 52} ${ly + 34} Q${lx + 2} ${ly + 48} ${lx + 56} ${ly + 30}`, null, '#a49c86', 2);
    shape(`M${lx - 26} ${ly - 8} Q${lx} ${ly + 6} ${lx + 26} ${ly - 8} L${lx + 30} ${ly + 6} Q${lx} ${ly + 19} ${lx - 30} ${ly + 6}Z`, '#f6efdf', '#253a3b', 2.6);
    // Left arm hanging relaxed along left side of torso (curved top blending seamlessly into shoulder!)
    shape(`M${lx - 76} ${ly + 56} Q${lx - 86} ${ly + 132} ${lx - 74} ${ly + 225} L${lx - 48} ${ly + 222} Q${lx - 56} ${ly + 132} ${lx - 54} ${ly + 66}`, '#e8e1cc', '#253a3b', 2.8);
    // Proportional neck
    shape(`M${lx - 20} ${ly - 34} H${lx + 20} L${lx + 24} ${ly - 3} Q${lx} ${ly + 7} ${lx - 24} ${ly - 3}Z`, '#cf956f', '#253a3b', 2.6);
    // Rear-3/4 head tilted slightly down looking at the street below!
    const hx = lx + 10, hy = ly - 74 + lean * 8;
    oval(hx - 48, hy + 8, 9, 14, '#dda07d', '#253a3b', 2.6);
    shape(`M${hx - 44} ${hy + 6} Q${hx - 36} ${hy + 44} ${hx + 2} ${hy + 50} Q${hx + 40} ${hy + 44} ${hx + 48} ${hy + 10} L${hx + 44} ${hy - 22} H${hx - 44}Z`, '#e7ae87', '#253a3b', 2.6);
    shape(
      `M${hx - 48} ${hy + 10} C${hx - 58} ${hy - 18} ${hx - 50} ${hy - 56} ${hx - 14} ${hy - 64} ` +
      `C${hx + 22} ${hy - 72} ${hx + 56} ${hy - 46} ${hx + 54} ${hy - 6} ` +
      `C${hx + 52} ${hy + 18} ${hx + 40} ${hy + 32} ${hx + 24} ${hy + 38} ` +
      `L${hx + 10} ${hy + 33} L${hx} ${hy + 44} L${hx - 14} ${hy + 34} L${hx - 28} ${hy + 36} ` +
      `Q${hx - 42} ${hy + 26} ${hx - 48} ${hy + 10}Z`,
      '#644638', '#253a3b', 3
    );
    shape(`M${hx - 34} ${hy - 26} Q${hx - 6} ${hy - 56} ${hx + 28} ${hy - 44} Q${hx + 44} ${hy - 34} ${hx + 44} ${hy - 16} Q${hx + 18} ${hy - 36} ${hx - 8} ${hy - 24} L${hx - 26} ${hy - 12}Z`, '#89624c');
    // Warm orange city-fire rim light along his right hair & shoulder!
    shape(`M${hx + 34} ${hy - 44} Q${hx + 56} ${hy - 22} ${hx + 50} ${hy + 14}`, null, 'rgba(255, 142, 68, 0.65)', 3.4);
    shape(`M${lx + 60} ${ly + 16} Q${lx + 86} ${ly + 32} ${lx + 86} ${ly + 70}`, null, 'rgba(255, 142, 68, 0.5)', 3);
    ctx.restore();

    drawSirenWash(frame, 1.35);
  }

  // Shot 12 (f1632..1799): Dramatic FRONT-3/4 HERO HOLD — gripping gleaming kitchen knife low, firelight & sirens on determined face!
  function drawShot12HeroHold(frame) {
    const zoom = mix(1.0, 1.11, tween(frame, 1632, 1799));
    const breath = Math.sin(frame * 0.11) * 1.6;

    // Dark apartment room behind him + barricaded door far left + glowing night city window right!
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d151d');
    bg.addColorStop(1, '#1a2732');
    rect(bg, 0, 0, W, H);
    // Barricaded door & bookshelf far left (continuity callback!)
    rect('#2b221c', 48, 86, 146, 454);
    rect('#4b3526', 64, 128, 122, 412);
    for (const sy of [210, 310, 410]) rect('#261a12', 70, sy, 110, 10);
    // Glowing fiery 7th-floor window on right
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
    ctx.translate(460, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-460, -270);

    const cx = 445, cy = 352 + breath;
    // Smoothly curved Front-3/4 bust (facing slightly right toward the burning city window!)
    shape(
      `M${cx - 32} ${cy - 18} C${cx - 82} ${cy - 8} ${cx - 122} ${cy + 14} ${cx - 134} ${cy + 62} ` +
      `L${cx - 148} ${cy + 210} H${cx + 128} L${cx + 112} ${cy + 58} ` +
      `C${cx + 102} ${cy + 14} ${cx + 72} ${cy - 8} ${cx + 30} ${cy - 18}Z`,
      '#e8e1cc', '#253a3b', 3.2
    );
    shape(`M${cx - 98} ${cy + 26} Q${cx - 90} ${cy + 95} ${cx - 96} ${cy + 205}`, null, '#a49c86', 2.4);
    shape(`M${cx - 104} ${cy + 22} Q${cx - 126} ${cy + 40} ${cx - 134} ${cy + 62} L${cx - 148} ${cy + 210} H${cx - 118} Q${cx - 108} ${cy + 100} ${cx - 104} ${cy + 22}Z`, '#d4cdba');
    // Burgundy tie & crisp collar shifted slightly right for 3/4 turn
    const tieX = cx + 14;
    shape(`M${tieX - 10} ${cy + 14} H${tieX + 10} L${tieX + 16} ${cy + 206} H${tieX - 16}Z`, '#813b43', '#253a3b', 2.6);
    shape(`M${cx - 28} ${cy - 20} L${tieX} ${cy + 10} L${cx + 30} ${cy - 20} L${cx + 44} ${cy - 4} L${tieX + 22} ${cy + 30} L${tieX} ${cy + 12} L${tieX - 24} ${cy + 30} L${cx - 44} ${cy - 4}Z`, '#f6efdf', '#253a3b', 2.6);
    shape(`M${tieX - 13} ${cy + 8} H${tieX + 13} L${tieX + 8} ${cy + 28} H${tieX - 8}Z`, '#813b43', '#253a3b', 2.6);

    // Proportional neck
    shape(`M${cx - 21} ${cy - 54} H${cx + 21} L${cx + 26} ${cy - 14} Q${cx} ${cy + 2} ${cx - 26} ${cy - 14}Z`, '#cf956f', '#253a3b', 2.8);

    // Front-3/4 head with hardened, determined survivor expression looking out right toward the city!
    const hx = cx + 8, hy = cy - 110;
    const shift = 22;
    oval(hx - 72, hy + 12, 11, 17, '#dda07d', '#253a3b', 2.8);
    shape(
      `M${hx - 66} ${hy - 22} Q${hx - 66} ${hy - 74} ${hx} ${hy - 82} ` +
      `Q${hx + 66} ${hy - 74} ${hx + 66} ${hy - 20} ` +
      `Q${hx + 72} ${hy + 12} ${hx + 44} ${hy + 48} ` +
      `Q${hx + 14} ${hy + 70} ${hx - 12} ${hy + 62} ` +
      `Q${hx - 54} ${hy + 44} ${hx - 64} ${hy + 8}Z`,
      '#e7ae87', '#253a3b', 3.2
    );
    shape(
      `M${hx - 62} ${hy + 12} L${hx - 72} ${hy - 12} C${hx - 78} ${hy - 56} ${hx - 48} ${hy - 94} ${hx + 2} ${hy - 94} ` +
      `C${hx + 48} ${hy - 94} ${hx + 76} ${hy - 62} ${hx + 74} ${hy - 16} ` +
      `L${hx + 62} ${hy - 26} L${hx + 54} ${hy - 14} L${hx + 44} ${hy - 38} ` +
      `L${hx + 28} ${hy - 20} L${hx + 26} ${hy - 38} ` +
      `L${hx + 1} ${hy - 18} L${hx + 3} ${hy - 36} ` +
      `L${hx - 27} ${hy - 10} L${hx - 23} ${hy - 34} ` +
      `Q${hx - 52} ${hy - 22} ${hx - 62} ${hy + 12}Z`,
      '#644638', '#253a3b', 3.2
    );
    shape(`M${hx - 54} ${hy - 34} Q${hx - 14} ${hy - 82} ${hx + 34} ${hy - 74} Q${hx + 58} ${hy - 66} ${hx + 62} ${hy - 46} Q${hx + 22} ${hy - 68} ${hx - 14} ${hy - 44} L${hx - 44} ${hy - 22}Z`, '#89624c');

    // Focused, narrowed determined eyes & furrowed brows (ready to survive!)
    const leftEyeX = hx - 9, rightEyeX = hx + 42, eyeY = hy - 2;
    shape(`M${leftEyeX - 15} ${eyeY - 19} L${leftEyeX + 15} ${eyeY - 14}`, null, '#253a3b', 3.6);
    shape(`M${rightEyeX - 11} ${eyeY - 14} L${rightEyeX + 12} ${eyeY - 19}`, null, '#253a3b', 3.6);
    oval(leftEyeX, eyeY, 13.5, 9.5, '#fff1dd', '#253a3b', 2.6);
    oval(rightEyeX, eyeY, 11, 9.5, '#fff1dd', '#253a3b', 2.6);
    oval(leftEyeX + 4.5, eyeY, 4.2, 5.2, '#253a3b');
    oval(rightEyeX + 3.5, eyeY, 3.6, 5.2, '#253a3b');
    // Clean nose strictly between eyes
    const noseX = hx + 17;
    shape(`M${noseX} ${eyeY + 2} L${noseX + 9} ${eyeY + 20} L${noseX - 2} ${eyeY + 23}`, null, '#253a3b', 2.8);
    // Set, grim closed mouth
    shape(`M${hx + 4} ${eyeY + 41} Q${hx + 18} ${eyeY + 38} ${hx + 32} ${eyeY + 41}`, null, '#253a3b', 3);

    // Connected left-foreground arm bending naturally from rounded left shoulder across chest to grip the gleaming chef's knife!
    shape(`M${cx - 132} ${cy + 62} L${cx - 120} ${cy + 166} L${cx + 58} ${cy + 150} L${cx + 54} ${cy + 110} L${cx - 72} ${cy + 120} L${cx - 94} ${cy + 62}`, '#e8e1cc', null);
    shape(`M${cx - 132} ${cy + 62} L${cx - 120} ${cy + 166} L${cx + 58} ${cy + 150} L${cx + 54} ${cy + 110} L${cx - 72} ${cy + 120} L${cx - 94} ${cy + 62}`, null, '#253a3b', 3);
    ctx.save();
    ctx.translate(cx + 126, cy + 126);
    ctx.rotate(-0.20);
    // Gleaming stainless steel blade catching red/orange city light!
    shape('M12 -14 L156 -16 Q182 -12 196 12 L12 24Z', '#c9dbe4', ink, 2.8);
    shape('M12 -12 L156 -14 188 10 12 8Z', '#eef7fc');
    const glint = mix(20, 158, tween(frame, 1680, 1760));
    shape(`M${glint} -14 L${glint + 22} -14 ${glint + 8} 18 ${glint - 14} 18Z`, 'rgba(255, 255, 255, 0.58)');
    // Dark handle & gripping fist with wrapped finger lines + neat cuff
    shape('M-54 -10 H14 V18 H-54Z', '#20282e', ink, 2.6);
    shape('M-46 -22 Q-20 -32 8 -24 Q20 0 10 24 Q-18 32 -46 22Z', '#e7ae87', '#253a3b', 2.8);
    for (const fx of [-30, -16, -2]) shape(`M${fx} -20 V20`, null, '#946450', 1.8);
    shape('M-76 -23 L-44 -20 L-44 24 L-76 28Z', '#ede5d0', '#253a3b', 2.8);
    ctx.restore();

    ctx.restore();

    // Warm orange city-fire glow from right window + police siren strobes!
    const flk = 0.82 + 0.18 * Math.sin(frame * 0.45);
    const fg = ctx.createRadialGradient(840, 260, 20, 840, 260, 560);
    fg.addColorStop(0, `rgba(255, 112, 46, ${0.34 * flk})`);
    fg.addColorStop(1, 'rgba(255, 112, 46, 0)');
    rect(fg, 0, 0, W, H);
    drawSirenWash(frame, 1.2);
  }

  window.renderCh1aFrame = async (frame, cutout, anchors) => {
    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    if (frame < 86) {
      // Shot 1 (0..3.6s): Over-the-Shoulder (Rear-3/4) behind chair looking at crimson YOU ARE DEAD monitor!
      drawShot1OtsGaming(frame);
    } else if (frame < 158) {
      // Shot 2 (3.6..6.6s): High-angle top-down desk insert (dropped controller + rattling red ALERT phone + hand pickup)
      drawShot2DeskPhone(frame);
    } else if (frame < 278) {
      // Shot 3 (6.6..11.6s): First-person POV glaring red FEDERAL BIO-LAB BREACH phone screen!
      drawShot3PovPhone(frame);
    } else if (frame < 372) {
      // Shot 4 (11.6..15.5s): Dead-on FRONT CLOSE-UP -> smooth continuous FRONT-3/4 head turn toward window!
      drawShot4FrontReaction(frame);
    } else if (frame < 528) {
      // Shot 5 (15.5..22.0s): Side-angle medium shot (OpenToonz side rig matching official brace & ready stance!)
      const chairRoll = mix(0.65, 1.35, tween(frame, 372, 396));
      ctx.save();
      ctx.translate(480, 270);
      ctx.scale(1.38, 1.38);
      ctx.translate(-340, -305);
      drawApartment(frame, { gameScreenRed: true, chairShift: chairRoll });
      await drawLead(cutout, 260, 466, 0.66, false);
      ctx.restore();
    } else if (frame < 600) {
      // Shot 6a (22.0..25.0s): Wide apartment — walks left toward front door
      drawApartment(frame, { gameScreenRed: true, chairShift: 1.35 });
      const wx = mix(275, 165, tween(frame, 528, 599));
      await drawLead(cutout, wx, 466, 0.66, true);
    } else if (frame < 660) {
      // Shot 6b (25.0..27.5s): First-person POV heavy brass deadbolt snap!
      drawShot6Deadbolt(frame - 139);
    } else if (frame < 822) {
      // Shot 7 (27.5..34.25s): Heavy bookshelf barricade shove leftward flush to door! (chair tucked cleanly under desk out of the way!)
      const shift = tween(frame, 690, 784);
      drawApartment(frame, { shelfShift: shift, gameScreenRed: true, chairShift: -1.8 });
      const leadX = mix(348, 246, shift);
      await drawLead(cutout, leadX, 466, 0.66, true);
    } else if (frame < 894) {
      // Shot 8a (34.25..37.25s): Walks right to fridge & pulls door open
      const open = tween(frame, 862, 888);
      drawApartment(frame, { shelfShift: 1, fridgeOpen: open, gameScreenRed: true, chairShift: -1.8 });
      const lx = mix(454, 554, tween(frame, 822, 854));
      await drawLead(cutout, lx, 466, 0.66, false);
    } else if (frame < 1038) {
      // Shot 8b (37.25..43.25s): First-person POV inside nearly-empty refrigerator (5 days left!)
      drawShot8PovFridge(frame - 162);
    } else if (frame < 1176) {
      // Shot 9 (43.25..49.0s): OTS Rear-3/4 at 7th-floor window looking out over burning city skyline!
      drawShot9OtsWindow(frame);
    } else if (frame < 1440) {
      // Shot 10 (49.0..60.0s): High-angle 7th-floor aerial POV pan across street frenzy (Runners, Smoker, Boomer, Hunter!)
      drawShot10StreetFrenzy(frame - 180);
    } else if (frame < 1536) {
      // Shot 11a (60.0..64.0s): Kitchen counter drawer search (zoomed medium!)
      const dOpen = tween(frame, 1474, 1506);
      ctx.save();
      ctx.translate(480, 270);
      ctx.scale(1.32, 1.32);
      ctx.translate(-515, -315);
      drawApartment(frame, { shelfShift: 1, drawerOpen: dOpen, gameScreenRed: true, chairShift: -1.8 });
      await drawLead(cutout, 438, 466, 0.66, false);
      ctx.restore();
    } else if (frame < 1632) {
      // Shot 11b (64.0..68.0s): First-person POV gleaming stainless chef's kitchen knife draw!
      drawShot11PovKnife(frame - 216);
    } else {
      // Shot 12 (68.0..75.0s): Dramatic Front-3/4 hero hold holding kitchen knife low, firelight & sirens on face!
      drawShot12HeroHold(frame);
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
