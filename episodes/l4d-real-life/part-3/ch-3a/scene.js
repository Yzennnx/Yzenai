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
    const t = clamp((frame - start) / Math.max(1, end - start));
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
  const starGlint = (x, y, s, color = '#fffbe8ee') => {
    if (s <= 0.5) return;
    ctx.save();
    ctx.translate(x, y);
    shape(`M0 ${-s} L${s * 0.22} ${-s * 0.22} L${s} 0 L${s * 0.22} ${s * 0.22} L0 ${s} L${-s * 0.22} ${s * 0.22} L${-s} 0 L${-s * 0.22} ${-s * 0.22}Z`, color);
    ctx.restore();
  };

  // Cutout film & paper grain texture
  const grain = document.createElement('canvas');
  grain.width = W;
  grain.height = H;
  const gctx = grain.getContext('2d');
  let seed = 3011;
  const rand = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 24000; i++) {
    gctx.fillStyle = i % 3 ? '#f4e4c40d' : '#050a1030';
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
    rect('#080f16cc', 24, 22, 126, 36);
    shape('M24 22 H150 V58 H24Z', null, '#4d6472', 1.8);
    label(text, 87, 46, 16, '#ffd44d');
    ctx.restore();
  }

  // Raw red Smoker rope-burn scar centered cleanly on mid-lower front neck (fixed continuity from Ch 1C)
  function drawFrontNeckBurn(cx, cy, scale = 1, alpha = 0.88) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    shape('M-34 -2 Q0 9 34 -4', null, '#7a1919', 7.2);
    shape('M-32 -1 Q0 8 32 -3', null, '#bf342e', 4.4);
    shape('M-22 2 Q0 7 24 0', null, '#e35b52', 1.6);
    ctx.restore();
  }

  // Unified armored cuff + shredded right cardboard + dark brown leather work glove wrist strap
  function drawLeatherArmoredCuff(extendLen = 195, shreddedRightArm = true) {
    const endY = 56 + extendLen;
    // Cream shirt sleeve beneath wrap
    shape(`M-38 ${endY - 26} L38 ${endY - 26} L44 ${endY + 34} L-44 ${endY + 34}Z`, '#ece4d0', ink, 2.2);
    // Corrugated cardboard wrap
    shape(`M-36 16 Q0 22 36 16 L${43 + extendLen * 0.03} ${endY - 12} L${-43 - extendLen * 0.03} ${endY - 12}Z`, '#a37b51', '#253a3b', 2.4);
    if (shreddedRightArm) {
      // Hunter-bite ragged tear from Ch 2B under leather strap
      shape('M-24 44 L-4 54 L14 42 L24 58 L12 74 L-12 68 L-22 80 L-30 58Z', '#593e24', '#253a3b', 1.7);
      shape('M-36 42 L-50 52 L-40 66 L-28 54Z', '#b88e60', '#253a3b', 1.6);
      shape('M32 46 L48 58 L38 74 L26 60Z', '#b88e60', '#253a3b', 1.6);
    }
    // Gray duct-tape bands
    shape('M-38 28 Q0 34 38 28 L40 44 Q0 50 -40 44Z', '#8c969e', '#253a3b', 1.9);
    shape('M-41 86 Q0 92 41 86 L43 104 Q0 110 -43 104Z', '#8c969e', '#253a3b', 1.9);
    // Heavy dark brown leather work glove cuff & cinch strap (Ch 2C permanent upgrade)
    shape('M-40 -4 Q0 4 40 -4 L42 30 Q0 38 -42 30Z', '#4d311f', ink, 2.4);
    shape('M-42 8 Q0 16 42 8 L43 20 Q0 28 -43 20Z', '#362114', ink, 1.8);
    rect('#c69f59', -10, 10, 20, 11);
    shape('M-10 10 H10 V21 H-10Z', null, ink, 1.5);
  }

  // Pump-action 12-gauge shotgun prop (matte black steel + ribbed pump forend + stock)
  function drawPumpShotgun(x, y, angleDeg = 0, scale = 1, glint = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleDeg * Math.PI / 180);
    ctx.scale(scale, scale);
    // Buttstock
    shape('M-112 -8 L-52 -10 L-42 6 L-56 14 L-116 20 Z', '#2d2621', ink, 2.3);
    // Receiver & trigger guard
    shape('M-52 -12 L18 -12 L22 10 L-46 10 Z', '#252d34', ink, 2.3);
    shape('M-34 10 Q-22 25 -8 10', null, '#1a2026', 2.4);
    shape('M-24 10 L-22 18', null, '#64717b', 2.0); // Trigger
    // Ejection port (closed — 1 shell chambered)
    rect('#14191e', -26, -8, 22, 7);
    // Barrel & magazine tube
    shape('M18 -10 L146 -10 L146 -3 L18 -3 Z', '#313b44', ink, 2.0);
    shape('M18 -2 L134 -2 L134 5 L18 5 Z', '#232b32', ink, 1.9);
    // Ribbed pump forend
    shape('M46 -4 L106 -4 L106 10 L46 10 Z', '#1b2025', ink, 2.2);
    for (let rx = 54; rx <= 98; rx += 8) {
      shape(`M${rx} -3 L${rx} 9`, null, '#44505b', 1.4);
    }
    if (glint > 0.05) starGlint(78, -9, 10 * glint);
    ctx.restore();
  }

  // =========================================================================
  // ARTICULATED CUTOUT WITCH RIG (Blender-grounded from witch-sobbing.json
  // and witch-alert-lift.json — curved spine/ribs, bent elbows/knees, razor
  // claws, hanging dark hair curtain, variable crimson eye glow).
  // =========================================================================
  function drawWitch(cx, cy, scale = 1, state = 'sobbing', phase = 0, redGlow = 0) {
    // Interpolate between Blender-grounded sobbing & alert-lift poses
    const lift = state === 'sobbing' ? 0 : state === 'alert-lift' ? clamp(phase) : clamp(1 - Math.max(0, (phase - 0.62) / 0.38));
    const rock = state === 'sobbing' ? Math.sin(phase * Math.PI * 2) * 5.5 : (state === 'poised-listen' ? Math.sin(phase * 14) * 1.4 : 0);
    const riseY = state === 'poised-listen' && phase < 0.62 ? -10 * Math.sin(Math.min(1, phase / 0.4) * Math.PI * 0.5) : 0;

    // Grounded joint offsets relative to pelvis (derived from Blender witch-sobbing.json -> witch-alert-lift.json, scaled to unit height)
    const S = 0.68;
    const pelvis = [0, riseY];
    const chest = [mix(-136, -115, lift) * S + rock, mix(-55, -90, lift) * S + riseY];
    const neck = [mix(-174, -138, lift) * S + rock, mix(-55, -121, lift) * S + riseY];
    const head = [mix(-206, -150, lift) * S + rock, mix(-40, -156, lift) * S + riseY];

    const kneeF = [mix(-142, -141, lift) * S, mix(29, 40, lift) * S];
    const ankleF = [mix(-34, -45, lift) * S, mix(130, 151, lift) * S];
    const kneeN = [mix(-151, -150, lift) * S, mix(29, 39, lift) * S];
    const ankleN = [mix(-40, -51, lift) * S, mix(131, 150, lift) * S];

    const shF = [chest[0] + 10, chest[1] + 4];
    const elF = [mix(-154, -113, lift) * S + rock * 0.6, mix(51, 44, lift) * S + riseY];
    const wrF = [mix(-227, -215, lift) * S + rock * 0.5, mix(-48, 69, lift) * S + riseY];

    const shN = [chest[0] - 4, chest[1] + 8];
    const elN = [mix(-177, -118, lift) * S + rock * 0.6, mix(84, 54, lift) * S + riseY];
    const wrN = [mix(-265, -245, lift) * S + rock * 0.5, mix(-27, 100, lift) * S + riseY];

    // Tapered anatomical limb polygon (eliminates stick-tube look while staying 100% Blender-joint-locked!)
    const taperedLimb = (a, b, r1, r2, col, shade = null) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const p1x = a[0] + nx * r1, p1y = a[1] + ny * r1;
      const p2x = b[0] + nx * r2, p2y = b[1] + ny * r2;
      const p3x = b[0] - nx * r2, p3y = b[1] - ny * r2;
      const p4x = a[0] - nx * r1, p4y = a[1] - ny * r1;
      shape(`M${p1x} ${p1y} L${p2x} ${p2y} Q${b[0] + dx / len * r2 * 0.7} ${b[1] + dy / len * r2 * 0.7} ${p3x} ${p3y} L${p4x} ${p4y} Q${a[0] - dx / len * r1 * 0.6} ${a[1] - dy / len * r1 * 0.6} ${p1x} ${p1y} Z`, col, ink, 2.2);
      if (shade) {
        shape(`M${(p1x + p4x) * 0.5} ${(p1y + p4y) * 0.5} L${p2x} ${p2y} L${(p2x + p3x) * 0.5} ${(p2y + p3y) * 0.5} Z`, shade);
      }
    };
    const claws = (wr, dirX, dirY) => {
      ctx.save();
      ctx.translate(wr[0], wr[1]);
      oval(0, 0, 5.5, 4.5, '#9eaab2', ink, 1.6);
      for (let i = -2; i <= 2; i++) {
        const ang = Math.atan2(dirY, dirX) + i * 0.17;
        const len = 20 + (i === 0 ? 5 : 0);
        shape(`M0 0 Q${Math.cos(ang) * len * 0.55} ${Math.sin(ang) * len * 0.55 - 2} ${Math.cos(ang) * len} ${Math.sin(ang) * len}`, null, '#7e2a32', 2.4);
      }
      ctx.restore();
    };

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Ground contact shadow
    oval(-45, 114, 102, 20, '#040910bb');

    // Far leg & arm (darker cool shadow tone for depth separation)
    taperedLimb(pelvis, kneeF, 12, 8.5, '#6a7882');
    taperedLimb(kneeF, ankleF, 8, 5.5, '#5f6d76');
    taperedLimb(shF, elF, 7.5, 5.5, '#6a7882');
    taperedLimb(elF, wrF, 5.5, 4, '#606e77');
    claws(wrF, lift > 0.4 ? -0.8 : -0.3, lift > 0.4 ? 0.6 : -0.9);

    // Curved hunched torso & tattered draped dress + bony spine curve
    shape(
      `M${pelvis[0] + 20} ${pelvis[1] + 24} Q${(pelvis[0] + chest[0]) * 0.5 + 34} ${(pelvis[1] + chest[1]) * 0.5 - 24} ${chest[0] + 18} ${chest[1] - 18} ` +
      `L${chest[0] - 16} ${chest[1] + 18} Q${(pelvis[0] + chest[0]) * 0.5 - 10} ${(pelvis[1] + chest[1]) * 0.5 + 32} ${pelvis[0] - 20} ${pelvis[1] + 38} ` +
      `L${pelvis[0] - 2} ${pelvis[1] + 54} L${pelvis[0] + 14} ${pelvis[1] + 40} Z`,
      '#243039', ink, 2.6
    );
    // Pale gaunt shoulder & back highlight
    shape(
      `M${chest[0] + 14} ${chest[1] - 14} Q${(pelvis[0] + chest[0]) * 0.5 + 24} ${(pelvis[1] + chest[1]) * 0.5 - 16} ${pelvis[0] + 10} ${pelvis[1] + 4} ` +
      `L${chest[0] - 4} ${chest[1] + 8} Z`,
      '#8f9ea8', ink, 2.0
    );

    // Near leg (tapered pale thigh & calf)
    taperedLimb(pelvis, kneeN, 13, 9, '#9baab3', '#75859066');
    taperedLimb(kneeN, ankleN, 8.5, 5.8, '#8d9ca6', '#69798466');
    oval(ankleN[0] - 8, ankleN[1] + 6, 12, 5.5, '#7c8b94', ink, 1.8); // Pale bare foot

    // Neck & pale gaunt head
    taperedLimb(chest, neck, 7.5, 6, '#96a5ae');
    oval(head[0], head[1], 19, 22, '#b6c4cc', ink, 2.4);

    // Lush cascading dark hair curtain draping past shoulders & knees
    const hairPart = lift * 12;
    shape(
      `M${head[0] + 18} ${head[1] - 18} Q${head[0] + 38} ${head[1] + 24} ${head[0] + 26} ${head[1] + 84} ` +
      `L${head[0] + 8} ${head[1] + 68} L${head[0] - 4} ${head[1] + 82} Q${head[0] + 4} ${head[1] + 20} ${head[0] - 12 + hairPart} ${head[1] - 16} Z`,
      '#10171e', ink, 2.2
    );
    shape(
      `M${head[0] - 6} ${head[1] - 22} Q${head[0] - 26 - hairPart * 0.4} ${head[1] + 16} ${head[0] - 32 - hairPart * 0.5} ${head[1] + 74} ` +
      `L${head[0] - 14} ${head[1] + 58} Q${head[0] - 12} ${head[1] + 14} ${head[0] + 6} ${head[1] - 20} Z`,
      '#17212b', ink, 2.0
    );

    // Glowing crimson pinpoint eyes when startled!
    if (redGlow > 0.03) {
      ctx.save();
      ctx.globalAlpha = clamp(redGlow);
      const gx = head[0] - 10, gy = head[1] - 2;
      const radG = ctx.createRadialGradient(gx, gy, 1, gx, gy, 28);
      radG.addColorStop(0, '#ff3535ee');
      radG.addColorStop(0.45, '#ff1f1f66');
      radG.addColorStop(1, '#ff1f1f00');
      ctx.fillStyle = radG;
      ctx.beginPath(); ctx.arc(gx, gy, 28, 0, Math.PI * 2); ctx.fill();
      oval(gx - 3, gy, 3.8, 2.3, '#ff6868');
      oval(gx + 5, gy - 1, 3.4, 2.1, '#ff6868');
      ctx.restore();
    }

    // Near arm & razor claws
    taperedLimb(shN, elN, 8, 6, '#a5b4bd');
    taperedLimb(elN, wrN, 6, 4.2, '#99a8b1');
    claws(wrN, lift > 0.4 ? -0.9 : -0.2, lift > 0.4 ? 0.5 : -0.95);

    ctx.restore();
  }

  // =========================================================================
  // SHATTERED CIVIC PLAZA & MIDNIGHT AVENUE ENVIRONMENTS
  // =========================================================================
  function drawSkyAndApexTower(frame, towerScale = 1.0, towerX = 760, horizonY = 305) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY + 80);
    sky.addColorStop(0, '#040910');
    sky.addColorStop(0.55, '#0b1826');
    sky.addColorStop(1, '#142738');
    rect(sky, 0, 0, W, H);

    // Distant jagged city skyline
    shape(`M0 ${horizonY} L0 210 L85 210 L85 165 L160 165 L160 225 L250 225 L250 180 L340 180 L340 230 L455 230 L455 190 L550 190 L550 235 L660 235 L660 175 L735 175 L735 220 L860 220 L860 185 L960 185 L960 ${horizonY + 40} L0 ${horizonY + 40}Z`, '#09121c');

    // APEX TOWER piercing the fog with blinking red rooftop aviation beacon
    const tw = 56 * towerScale;
    const th = 220 * towerScale;
    const tx = towerX - tw * 0.5;
    const ty = horizonY - th + 35;
    rect('#0e1b28', tx, ty, tw, th + 20);
    shape(`M${tx} ${ty} H${tx + tw} V${ty + th} H${tx}Z`, null, '#22384c', 1.6);
    // Spire
    shape(`M${towerX} ${ty} L${towerX} ${ty - 36 * towerScale}`, null, '#344c61', 2.4);
    const blink = Math.sin(frame * 0.22) > 0.15 ? 1 : 0.18;
    const bx = towerX, by = ty - 38 * towerScale;
    const glow = ctx.createRadialGradient(bx, by, 1, bx, by, 34 * towerScale * (0.5 + 0.5 * blink));
    glow.addColorStop(0, `rgba(255,48,48,${0.95 * blink})`);
    glow.addColorStop(0.45, `rgba(255,32,32,${0.38 * blink})`);
    glow.addColorStop(1, 'rgba(255,32,32,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(bx, by, 38 * towerScale, 0, Math.PI * 2); ctx.fill();
    oval(bx, by, 3.6 * towerScale, 3.6 * towerScale, blink > 0.5 ? '#ff7272' : '#6e2020');

    // Drifting midnight fog bands
    const drift = (frame * 0.55) % W;
    ctx.save();
    ctx.globalAlpha = 0.24;
    for (let i = -1; i <= 1; i++) {
      oval(drift + i * W + 240, horizonY + 12, 340, 38, '#5a829c');
      oval(-drift * 0.6 + i * W + 620, horizonY + 46, 390, 44, '#3d617a');
    }
    ctx.restore();
  }

  function drawPlazaGround(frame, lampX = 590, lampY = 120, flicker = true) {
    // Ground asphalt & stone plaza tiles
    rect('#121d27', 0, 315, W, H - 315);
    shape('M0 315 H960', null, '#233646', 2);
    // Perspective tile joints
    ctx.save();
    ctx.strokeStyle = '#1d2d3b';
    ctx.lineWidth = 1.6;
    for (let x = -120; x <= 1080; x += 110) {
      ctx.beginPath(); ctx.moveTo(x, 315); ctx.lineTo(x + (x - 480) * 0.55, H); ctx.stroke();
    }
    for (const gy of [355, 405, 465]) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    ctx.restore();

    // Dying flickering cyan streetlamp & cone
    const fl = flicker ? (Math.sin(frame * 1.9) * Math.sin(frame * 0.43) > -0.68 ? 1 : 0.35) : 0.9;
    shape(`M${lampX + 18} 345 L${lampX + 18} ${lampY} L${lampX - 18} ${lampY + 8}`, null, '#1a2834', 7);
    oval(lampX - 18, lampY + 11, 14, 6, fl > 0.5 ? '#9bf5ff' : '#385d66');

    const cone = ctx.createRadialGradient(lampX - 18, lampY + 20, 10, lampX - 18, 410, 260);
    cone.addColorStop(0, `rgba(125,235,255,${0.32 * fl})`);
    cone.addColorStop(0.55, `rgba(74,178,204,${0.12 * fl})`);
    cone.addColorStop(1, 'rgba(30,80,100,0)');
    ctx.fillStyle = cone;
    shape(`M${lampX - 38} ${lampY + 14} L${lampX + 4} ${lampY + 14} L${lampX + 190} 540 L${lampX - 240} 540 Z`, cone);

    // Dry stone fountain pedestal
    shape(`M${lampX - 115} 405 L${lampX + 75} 405 L${lampX + 90} 442 L${lampX - 130} 442 Z`, '#23313d', ink, 2.4);
    shape(`M${lampX - 95} 388 L${lampX + 55} 388 L${lampX + 68} 405 L${lampX - 108} 405 Z`, '#2d3e4c', ink, 2.2);

    // Scattered glittering broken glass shards across foreground apron
    const shards = [
      [110, 468, 12], [178, 492, 16], [244, 456, 11], [312, 502, 15], [386, 474, 14],
      [448, 510, 18], [520, 488, 13], [650, 496, 15], [730, 462, 12], [820, 498, 14],
    ];
    for (const [sx, sy, sz] of shards) {
      shape(`M${sx} ${sy} L${sx + sz} ${sy + 4} L${sx + sz * 0.4} ${sy + sz * 0.65} Z`, '#8ad8eb55', '#cdeef888', 1.1);
    }
  }

  // Composite OpenToonz cutout PNG (exact 540x960 scale!) + unified bone-locked pack, wraps, leather gloves & shotgun
  async function drawSideLead(cutoutBase64, anchors, x, y, scale) {
    const ox = x - 270 * scale;
    const oy = y - 756 * scale;
    const drawWrap = (anchor, len, w1, w2, leather = false) => {
      if (!anchor) return;
      const [ax, ay, aa] = anchor;
      ctx.save();
      ctx.translate(ox + ax * scale, oy + ay * scale);
      ctx.rotate(aa * Math.PI / 180);
      ctx.scale(scale, scale);
      shape(`M${-w1} 6 L${w1} 6 L${w2} ${len} L${-w2} ${len} Z`, '#a37b51', ink, 2.0);
      shape(`M${-w1 - 1} 14 L${w1 + 1} 14 L${w1 + 1} 23 L${-w1 - 1} 23 Z`, '#8c969e', ink, 1.5);
      if (leather) {
        shape(`M${-w2 - 1} ${len - 10} L${w2 + 1} ${len - 10} L${w2 + 2} ${len + 8} L${-w2 - 2} ${len + 8} Z`, '#4d311f', ink, 1.8);
      }
      ctx.restore();
    };
    const drawGlove = (anchor, r = 11.5) => {
      if (!anchor) return;
      const [gx, gy, ga] = anchor;
      ctx.save();
      ctx.translate(ox + gx * scale, oy + gy * scale);
      ctx.rotate((ga || 0) * Math.PI / 180);
      ctx.scale(scale, scale);
      oval(0, 4, r, r * 1.12, '#4d301e', ink, 2.0);
      ctx.restore();
    };

    // 1. Bulging dark canvas backpack behind chest
    if (anchors?.chest) {
      const [cx, cy, ca] = anchors.chest;
      ctx.save();
      ctx.translate(ox + cx * scale, oy + cy * scale);
      ctx.rotate(ca * Math.PI / 180);
      ctx.scale(scale, scale);
      shape('M-64 -122 Q-88 -106 -88 -54 L-78 8 Q-50 22 -22 8 L-20 -122 Q-42 -134 -64 -122Z', '#2d3a34', ink, 2.6);
      shape('M-82 -68 H-30 V-14 H-82Z', '#222d28', ink, 2.0);
      ctx.restore();
    }
    drawWrap(anchors?.forearmFar, 40, 9.5, 13, true);
    drawGlove(anchors?.handFar, 10.5);

    // 2. Official OpenToonz character layer (540 x 960 exact coordinate space!)
    if (cutoutBase64) {
      const img = await loadPng(cutoutBase64);
      ctx.drawImage(img, ox, oy, 540 * scale, 960 * scale);
    }

    // 3. Tracked backpack strap, mid-neck Smoker burn, shin & near forearm wraps
    if (anchors?.chest) {
      const [cx, cy, ca] = anchors.chest;
      ctx.save();
      ctx.translate(ox + cx * scale, oy + cy * scale);
      ctx.rotate(ca * Math.PI / 180);
      ctx.scale(scale, scale);
      shape('M-16 -124 Q8 -80 12 -24', null, '#222b26', 6.5);
      ctx.restore();
    }
    if (anchors?.neck) {
      const [nx, ny, na] = anchors.neck;
      ctx.save();
      ctx.translate(ox + nx * scale, oy + ny * scale);
      ctx.rotate(na * Math.PI / 180);
      ctx.scale(scale, scale);
      shape('M-13 -4 Q2 1 16 -3', null, '#b4302ccc', 4.4);
      ctx.restore();
    }
    drawWrap(anchors?.shinFar, 54, 13, 18, false);
    drawWrap(anchors?.shinNear, 54, 14, 18, false);
    drawWrap(anchors?.forearmNear, 42, 10, 14, true);

    // 4. Matte-black 12-gauge pump shotgun locked cleanly to handNear -> handFar!
    if (anchors?.handNear) {
      const [hx, hy, ha] = anchors.handNear;
      const sx = ox + hx * scale;
      const sy = oy + hy * scale;
      let gunAng = (ha - 76);
      if (anchors?.handFar) {
        const [fx, fy] = anchors.handFar;
        const dx = fx - hx, dy = fy - hy;
        if (Math.hypot(dx, dy) > 18) gunAng = Math.atan2(dy, dx) * 180 / Math.PI;
      }
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(gunAng * Math.PI / 180);
      drawPumpShotgun(54 * scale * 0.65, -4 * scale * 0.65, 0, scale * 0.72, 0.45);
      ctx.restore();
    }
    drawGlove(anchors?.handNear, 11.5);
  }

  // Front bust helper using EXACT art.js drawFaceAngle(ctx, cx, cy, scale, mode, opts) signature!
  function drawLeadFrontBust(cx, cy, scale, expr = 'head-determined', opts = {}) {
    ctx.save();
    if (typeof window.drawFaceAngle === 'function') {
      const mode = opts.faceMode || 'head-tilt';
      window.drawFaceAngle(ctx, cx, cy, scale, mode, {
        expression: expr,
        sweat: opts.sweat ? 1 : 0,
        tiltDeg: opts.faceMode ? undefined : 0,
      });
    }
    // Fixed mid-lower front neck Smoker rope-burn scar
    drawFrontNeckBurn(cx, cy + 88 * scale, 0.75 * scale, 0.9);
    if (opts.breathMist) {
      ctx.save();
      ctx.globalAlpha = opts.breathMist * 0.42;
      oval(cx + (20 + opts.breathMist * 24) * scale, cy + (44 + opts.breathMist * 8) * scale, (22 + opts.breathMist * 22) * scale, (10 + opts.breathMist * 8) * scale, '#cfe8f5');
      ctx.restore();
    }
    ctx.restore();
  }

    // Clean transparent-background OTS silhouette (matching Back turnaround, ZERO corridor box!)
  function drawCleanOtsLead(cx, cy, scale = 1.0) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    // Bulging dark canvas backpack
    shape('M-92 86 Q-108 165 -98 260 L98 260 Q108 165 92 86 Q0 62 -92 86 Z', '#253330', ink, 3.0);
    shape('M-68 128 H68 V210 H-68 Z', '#1d2926', ink, 2.2);
    // Cream collared shirt shoulders
    shape('M-112 95 Q0 58 112 95 L128 260 L-128 260 Z', '#e6dec9', ink, 3.0);
    // Backpack shoulder straps
    shape('M-76 78 L-52 84 L-58 260 L-84 260 Z', '#283834', ink, 2.2);
    shape('M76 78 L52 84 L58 260 L84 260 Z', '#283834', ink, 2.2);
    // Back of neck & ears
    shape('M-24 14 L24 14 L28 84 Q0 92 -28 84 Z', '#d9aa86', ink, 2.6);
    oval(-62, -22, 13, 20, '#d9aa86', ink, 2.4);
    oval(62, -22, 13, 20, '#d9aa86', ink, 2.4);
    // Back of chestnut hair (exact turnaround tone)
    shape('M-64 -26 Q-68 -96 0 -98 Q68 -96 64 -26 Q58 26 24 34 L12 22 L-4 36 L-22 24 L-44 30 Q-62 12 -64 -26 Z', '#6b4a35', ink, 3.0);
    shape('M-34 -74 Q0 -88 34 -68 Q12 -62 -10 -70 Z', '#835d44');
    ctx.restore();
  }

  // Ground-level bent-knee boot insert extending cleanly past y < -60 (ZERO severed limbs!)
  function drawGlassBootInsert(frame, stepProgress, cracked = false) {
    rect('#0b141d', 0, 0, W, H);
    // Textured concrete plaza slabs
    rect('#182530', 0, 310, W, 230);
    shape('M0 310 H960', null, '#2b3e4f', 2.4);
    shape('M290 310 L210 540 M670 310 L750 540', null, '#101a22', 2.2);

    // Scattered glittering glass shards on stone
    const shards = [
      [250, 425, 38, 16], [390, 458, 32, 14], [555, 444, 44, 18], [670, 412, 34, 15],
    ];
    for (const [sx, sy, sw, sh] of shards) {
      shape(`M${sx} ${sy} L${sx + sw} ${sy + 5} L${sx + sw * 0.45} ${sy + sh} Z`, '#9ce4f566', '#dcf7ffaa', 1.8);
    }

    // Target shard under heel (cracks into 3 bright splinters in Shot 14!)
    if (!cracked) {
      shape('M468 430 L512 436 L486 450 Z', '#a7ebfa77', '#e5fbffbb', 1.9);
    } else {
      const sp = clamp((frame - 941) / 14);
      shape(`M${462 - sp * 28} ${432 - sp * 18} L${486 - sp * 22} ${436 - sp * 10} L${472 - sp * 24} ${446 - sp * 12} Z`, '#d6f8ffdd', '#ffffff', 2.0);
      shape(`M${494 + sp * 34} ${434 - sp * 22} L${522 + sp * 40} ${440 - sp * 14} L${504 + sp * 30} ${450 - sp * 10} Z`, '#d6f8ffdd', '#ffffff', 2.0);
      shape(`M${480} ${442 + sp * 10} L${498 + sp * 12} ${450 + sp * 14} L${484} ${456 + sp * 12} Z`, '#bceeffcc', '#ffffff', 1.8);
      if (sp < 0.7) starGlint(488, 434, 28 * (1 - sp), '#ffffff');
    }

    // Bent thigh + knee + cardboard-and-tape shin + brown boot extending past y < -80!
    const dropY = mix(-68, 0, stepProgress);
    ctx.save();
    ctx.translate(450, 424 + dropY);
    // Upper thigh angled smoothly up-left off top frame edge (y < -480)
    shape('M-190 -520 L-62 -520 L18 -210 L-108 -195 Z', '#2a3d4d', ink, 3.2);
    // Lower shin angled cleanly into ankle
    shape('M-98 -212 L16 -204 L-12 -18 L-92 -24 Z', '#2e4354', ink, 3.2);
    // Corrugated cardboard & gray duct-tape shin wrap
    shape('M-96 -175 L12 -168 L-8 -36 L-88 -42 Z', '#a37b51', ink, 2.6);
    shape('M-96 -146 L10 -140 L8 -118 L-94 -124 Z', '#8c969e', ink, 2.2);
    shape('M-91 -82 L2 -77 L0 -55 L-90 -60 Z', '#8c969e', ink, 2.2);
    // Brown survival shoe
    shape('M-94 -26 L-8 -22 Q48 -18 76 12 L72 28 L-98 28 Q-106 8 -94 -26 Z', '#5a3a26', ink, 3.0);
    shape('M-98 18 L74 18 L72 28 L-98 28 Z', '#261a14', ink, 2.2);
    ctx.restore();
  }

  // =========================================================================
  // MAIN 25-SHOT FRAME RENDERER (f0..1823 @ 24 fps = 76.0 s)
  // =========================================================================
  window.renderCh3aFrame = async function renderCh3aFrame(frame, cutoutBase64, anchors) {
    ctx.save();
    ctx.scale(2, 2); // Render in 960x540 logical space -> 1920x1080 output
    rect('#050a10', 0, 0, W, H);

    // SHOT 1 (0:00.0–0:03.2, f0..76): Midnight Fog Wide + OpenToonz Walk + Pole Parallax
    if (frame <= 76) {
      const t = tween(frame, 0, 76);
      drawSkyAndApexTower(frame, 0.88, 790, 300);
      rect('#111c26', 0, 300, W, 240);
      shape('M0 300 H960', null, '#223444', 2);
      // Dark storefront silhouettes left
      rect('#09121a', 0, 90, 210, 225);
      await drawSideLead(cutoutBase64, anchors, mix(250, 480, t), 468, 0.44);
      // Fast foreground dark lamp-post parallax wipe (f34..56)
      if (frame >= 32 && frame <= 60) {
        const px = mix(1060, -140, tween(frame, 32, 60));
        rect('#04080d', px, 0, 46, H);
      }
      drawCornerClock('00:48 AM', 1);
    }
    // SHOT 2 (0:03.2–0:06.0, f77..143): Tight Front Bust (head-determined) + Red Beacon Eye Glint
    else if (frame <= 143) {
      const z = mix(1.0, 1.07, tween(frame, 77, 143));
      const bob = Math.sin((frame - 77) * 0.25) * 3.5;
      drawSkyAndApexTower(frame, 0.7, 810, 330);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.52);
      ctx.scale(z, z);
      drawLeadFrontBust(0, 52 + bob, 1.38, 'head-determined', { beaconEye: true });
      ctx.restore();
    }
    // SHOT 3 (0:06.0–0:08.8, f144..211): Subjective POV Plaza Sweep
    else if (frame <= 211) {
      const t = tween(frame, 144, 211);
      const z = mix(1.0, 1.12, t);
      ctx.save();
      ctx.translate(W * 0.5 + mix(36, -36, t), H * 0.5);
      ctx.scale(z, z);
      ctx.translate(-W * 0.5, -H * 0.5);
      drawSkyAndApexTower(frame, 0.92, 780, 305);
      drawPlazaGround(frame, 610, 118, true);
      // Overturned concrete bench left
      shape('M90 365 L235 348 L244 378 L98 394 Z', '#212e3a', ink, 2.4);
      ctx.restore();
    }
    // SHOT 4 (0:08.8–0:11.6, f211..278): Audio Cue -> eye-dart Freeze
    else if (frame <= 278) {
      const t = tween(frame, 211, 278);
      drawSkyAndApexTower(frame, 0.75, 800, 340);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(mix(1.02, 1.10, t), mix(1.02, 1.10, t));
      const expr = frame < 235 ? 'head-notice' : 'head-dread';
      drawLeadFrontBust(0, 62, 1.52, expr, { faceMode: 'eye-dart', sweat: clamp((frame - 238) / 36) });
      ctx.restore();
    }
    // SHOT 5 (0:11.6–0:14.4, f278..345): Slow Creeping POV Pan Toward Cyan Lamp & Fountain
    else if (frame <= 345) {
      const t = tween(frame, 278, 345);
      const z = mix(1.05, 1.20, t);
      ctx.save();
      ctx.translate(W * 0.5 + mix(65, -40, t), H * 0.5);
      ctx.scale(z, z);
      ctx.translate(-W * 0.5, -H * 0.5);
      drawSkyAndApexTower(frame, 0.92, 810, 300);
      drawPlazaGround(frame, 575, 110, true);
      drawWitch(565, 368, 0.58, 'sobbing', (frame - 278) / 36, 0);
      ctx.restore();
    }
    // SHOT 6 (0:14.4–0:17.8, f345..427): Stepped Push-In on Hunched Sobbing Witch
    else if (frame <= 427) {
      const t = tween(frame, 345, 427);
      const z = mix(1.0, 1.32, t);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.54);
      ctx.scale(z, z);
      ctx.translate(-W * 0.5, -H * 0.54);
      drawSkyAndApexTower(frame, 0.85, 820, 290);
      drawPlazaGround(frame, 535, 95, true);
      drawWitch(515, 345, 0.92, 'sobbing', (frame - 345) / 30, 0);
      ctx.restore();
    }
    // SHOT 7 (0:17.8–0:20.4, f427..489): Off-Center ECU Dread Crash-Zoom
    else if (frame <= 489) {
      const t = tween(frame, 427, 489);
      rect('#071018', 0, 0, W, H);
      ctx.save();
      ctx.translate(W * 0.44, H * 0.54);
      ctx.scale(mix(1.06, 1.18, t), mix(1.06, 1.18, t));
      drawLeadFrontBust(0, 72, 2.05, 'head-dread', { faceMode: 'ecu-dread', sweat: t });
      ctx.restore();
      // Upper-face dark horror vignette
      const vig = ctx.createLinearGradient(0, 0, 0, 240);
      vig.addColorStop(0, '#02060bdd');
      vig.addColorStop(1, '#02060b00');
      rect(vig, 0, 0, W, 240);
    }
    // SHOT 8 (0:20.4–0:23.2, f489..556): Downward POV Phone Kill (3% -> BLACK)
    else if (frame <= 556) {
      rect('#08121b', 0, 0, W, H);
      const off = frame >= 518;
      const pocketDrop = tween(frame, 526, 556);
      ctx.save();
      ctx.translate(520, 325 + pocketDrop * 210);
      ctx.rotate(-12 * Math.PI / 180);
      // Unified leather-gloved cuff + shredded right wrap
      ctx.save();
      ctx.translate(45, 70);
      ctx.rotate(14 * Math.PI / 180);
      drawLeatherArmoredCuff(195, true);
      ctx.restore();
      // Back sculpted leather palm & wrist behind smartphone
      window.drawWeaponHandBack(ctx, 'phone-cradle', 0, 12, 1.0, 0);
      // Cracked smartphone
      shape('M-64 -116 H64 V116 H-64 Z', '#161f26', ink, 3.0);
      rect(off ? '#070b0f' : '#122938', -54, -98, 108, 192);
      if (!off) {
        label('3%', 0, -24, 34, '#ff5959');
        label('FLASHLIGHT OFF', 0, 12, 11, '#a9d8ec');
        label('00:50 AM', 0, 56, 14, '#7ba4b8');
      }
      // Screen crack lines
      shape('M-46 -78 L-10 -34 L22 -48 M-10 -34 L12 22', null, '#ffffff44', 1.3);
      // Front sculpted 4 curled fingers + opposing thumb pressing side power button!
      window.drawWeaponHandFront(ctx, 'phone-cradle', 0, 12, 1.0, 0);
      ctx.restore();
    }
    // SHOT 9 (0:23.2–0:26.2, f556..628): Close-Up Shotgun Lower (Leather Gloves Off Trigger)
    else if (frame <= 628) {
      const t = tween(frame, 556, 628);
      rect('#08111a', 0, 0, W, H);
      // Cream shirt & backpack straps blurred behind
      rect('#1e2a33', 180, 0, 600, H);
      shape('M260 0 L315 0 L300 540 L245 540 Z', '#253531', ink, 2.2);
      shape('M645 0 L700 0 L715 540 L660 540 Z', '#253531', ink, 2.2);
      const yShift = mix(-18, 48, t);
      const ang = mix(10, 26, t);
      ctx.save();
      ctx.translate(480, 290 + yShift);
      // Connected 2-Bone IK Arms (shoulder off-frame -> elbow OUTWARD & DOWN -> wrist) + 2-Layer Sculpted Hands!
      window.drawArmChain(ctx, [-300, -290], [-116, 12], { upperLen: 240, lowerLen: 195, bendDir: 1, upperWidth: 44, elbowWidth: 36, wristWidth: 28, cardboard: true, leatherStrap: true });
      window.drawArmChain(ctx, [320, -290], [148, 62], { upperLen: 245, lowerLen: 205, bendDir: -1, upperWidth: 44, elbowWidth: 36, wristWidth: 28, cardboard: true, leatherStrap: true });
      window.drawWeaponHandBack(ctx, 'shotgun-forend', 148, 56, 1.35, ang);
      window.drawWeaponHandBack(ctx, 'shotgun-grip', -94, -10, 1.35, ang, { offTrigger: true });
      drawPumpShotgun(0, 0, ang, 2.25, 0.35);
      window.drawWeaponHandFront(ctx, 'shotgun-forend', 148, 56, 1.35, ang);
      window.drawWeaponHandFront(ctx, 'shotgun-grip', -94, -10, 1.35, ang, { offTrigger: true });
      ctx.restore();
    }
    // SHOT 10 (0:26.2–0:29.4, f628..705): High-Angle Plaza Geography Reset
    else if (frame <= 705) {
      const z = mix(1.0, 1.07, tween(frame, 628, 705));
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(z, z);
      ctx.translate(-W * 0.5, -H * 0.5);
      rect('#09131c', 0, 0, W, H);
      drawPlazaGround(frame, 610, 62, true);
      // Dark archway far right (escape goal)
      shape('M820 210 H960 V430 H820 Z', '#0b141d', ink, 2.4);
      shape('M848 265 Q900 225 948 265 V430 H848 Z', '#03060a', ink, 2.2);
      // Witch center-right under cyan cone
      drawWitch(595, 362, 0.62, 'sobbing', (frame - 628) / 30, 0);
      // Lead crouched far-left shadowed wall
      if (typeof window.drawCinematicAngle === 'function') {
        window.drawCinematicAngle(ctx, 185, 390, 0.72, 'high-angle');
      }
      ctx.restore();
    }
    // SHOT 11 (0:29.4–0:32.4, f706..777): OpenToonz Side Stealth (sneakAt) + Foreground Pillar Wipe
    else if (frame <= 777) {
      const t = tween(frame, 706, 777);
      drawSkyAndApexTower(frame, 0.88, 820, 300);
      drawPlazaGround(frame, 660, 112, true);
      drawWitch(648, 370, 0.56, 'sobbing', (frame - 706) / 30, 0);
      await drawSideLead(cutoutBase64, anchors, mix(210, 410, t), 478, 0.45);
      // Foreground stone colonnade pillar wipe (f730..758)
      if (frame >= 728 && frame <= 760) {
        const px = mix(1040, -160, tween(frame, 728, 760));
        rect('#060b10', px, 0, 74, H);
      }
    }
    // SHOT 12 (0:32.4–0:35.2, f778..844): Low Ground-Level Boot Insert Stepping Around Shards
    else if (frame <= 844) {
      drawGlassBootInsert(frame, tween(frame, 784, 836), false);
    }
    // SHOT 13 (0:35.2–0:38.2, f845..916): Rear OTS Mid-Plaza Check
    else if (frame <= 916) {
      drawSkyAndApexTower(frame, 0.90, 790, 298);
      drawPlazaGround(frame, 615, 112, true);
      drawWitch(605, 368, 0.68, 'sobbing', (frame - 845) / 30, 0);
      // Foreground OTS shoulder + bulging pack lower-left (clean transparent background!)
      drawCleanOtsLead(200, 395, 1.12);
    }
    // SHOT 14 (0:38.2–0:41.0, f917..983): Tight Boot Close-Up — Hidden Glass Shard Cracks!
    else if (frame <= 983) {
      const shake = (frame >= 941 && frame <= 948) ? (frame % 2 ? 6 : -6) : 0;
      ctx.save();
      ctx.translate(shake, 0);
      drawGlassBootInsert(frame, tween(frame, 920, 941), frame >= 941);
      ctx.restore();
    }
    // SHOT 15 (0:41.0–0:43.4, f984..1041): Instant OpenToonz Freeze Locked Mid-Stride
    else if (frame <= 1041) {
      const z = mix(1.0, 1.09, tween(frame, 984, 1041));
      ctx.save();
      ctx.translate(W * 0.45, H * 0.52);
      ctx.scale(z, z);
      ctx.translate(-W * 0.45, -H * 0.52);
      drawSkyAndApexTower(frame, 0.88, 820, 300);
      drawPlazaGround(frame, 680, 114, false);
      await drawSideLead(cutoutBase64, anchors, 400, 478, 0.47);
      ctx.restore();
    }
    // SHOT 16 (0:43.4–0:47.0, f1042..1127): Stepped Push-In — Witch Lifts Head & Crimson Eyes Ignite!
    else if (frame <= 1127) {
      const t = tween(frame, 1042, 1127);
      const z = mix(1.0, 1.38, t);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.52);
      ctx.scale(z, z);
      ctx.translate(-W * 0.5, -H * 0.52);
      drawSkyAndApexTower(frame, 0.84, 830, 290);
      drawPlazaGround(frame, 535, 95, true);
      const glow = clamp((frame - 1068) / 38);
      drawWitch(515, 345, 0.96, 'alert-lift', t, glow);
      ctx.restore();
    }
    // SHOT 17 (0:47.0–0:50.0, f1128..1199): Off-Center ECU Dread Hold
    else if (frame <= 1199) {
      const t = tween(frame, 1128, 1199);
      rect('#060e16', 0, 0, W, H);
      ctx.save();
      ctx.translate(W * 0.43, H * 0.53);
      ctx.scale(mix(1.06, 1.18, t), mix(1.06, 1.18, t));
      drawLeadFrontBust(0, 72, 2.08, 'head-dread', { faceMode: 'ecu-dread', sweat: 0.2 + t * 0.8 });
      ctx.restore();
    }
    // SHOT 18 (0:50.0–0:53.0, f1200..1271): Macro Leather-Glove Trigger-Guard Restraint
    else if (frame <= 1271) {
      const tremble = Math.sin(frame * 1.8) * 1.1;
      rect('#070f18', 0, 0, W, H);
      ctx.save();
      ctx.translate(480, 275);
      // 2-Layer Sandwich: Armored Cuff + Back Palm -> Giant Macro Receiver -> Sculpted Gloved Hand & Trembling Off-Trigger Index!
      ctx.save();
      ctx.translate(-112, 68);
      ctx.rotate(14 * Math.PI / 180);
      drawLeatherArmoredCuff(195, true);
      ctx.restore();
      window.drawWeaponHandBack(ctx, 'shotgun-grip', -72, 16, 2.1, 6, { offTrigger: true, tremble });
      drawPumpShotgun(90, -10, 6, 3.8, 0.25);
      window.drawWeaponHandFront(ctx, 'shotgun-grip', -72, 16, 2.1, 6, { offTrigger: true, tremble });
      ctx.restore();
    }
    // SHOT 19 (0:53.0–0:56.8, f1272..1362): Long-Lens Witch Poised-Listen Hold & Settle Back Down
    else if (frame <= 1362) {
      const t = tween(frame, 1272, 1362);
      const z = mix(1.02, 1.12, t);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.52);
      ctx.scale(z, z);
      ctx.translate(-W * 0.5, -H * 0.52);
      drawSkyAndApexTower(frame, 0.84, 830, 290);
      drawPlazaGround(frame, 535, 95, true);
      const glow = frame < 1336 ? 0.95 : clamp(1 - (frame - 1336) / 22);
      drawWitch(515, 345, 0.98, 'poised-listen', t, glow);
      ctx.restore();
    }
    // SHOT 20 (0:56.8–0:59.6, f1363..1429): Tight Front Relief Exhale
    else if (frame <= 1429) {
      const t = tween(frame, 1363, 1429);
      drawSkyAndApexTower(frame, 0.78, 810, 330);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.52);
      const expr = frame < 1384 ? 'head-dread' : 'head-relief';
      drawLeadFrontBust(0, 56 + t * 8, 1.46, expr, { breathMist: clamp((frame - 1382) / 34) });
      ctx.restore();
    }
    // SHOT 21 (0:59.6–1:02.6, f1430..1501): OpenToonz Side Stealth Exit Toward Dark Archway
    else if (frame <= 1501) {
      const t = tween(frame, 1430, 1501);
      drawSkyAndApexTower(frame, 0.90, 810, 300);
      drawPlazaGround(frame, 250, 118, true);
      // Dark stone archway right
      shape('M730 165 H960 V480 H730 Z', '#0c1620', ink, 2.8);
      shape('M775 235 Q865 180 950 235 V480 H775 Z', '#03060a', ink, 2.4);
      await drawSideLead(cutoutBase64, anchors, mix(320, 690, t), 478, 0.45);
    }
    // SHOT 22 (1:02.6–1:05.6, f1502..1573): Rear OTS Glance-Back from Archway (Witch Undisturbed)
    else if (frame <= 1573) {
      drawSkyAndApexTower(frame, 0.72, 180, 305);
      drawPlazaGround(frame, 410, 128, true);
      drawWitch(402, 376, 0.48, 'sobbing', (frame - 1502) / 30, 0);
      // Dark archway framing right edge
      shape('M690 0 H960 V540 H740 Q710 260 690 0 Z', '#050a10', ink, 2.6);
      drawCleanOtsLead(775, 405, 1.05);
    }
    // SHOT 23 (1:05.6–1:08.8, f1574..1650): OpenToonz Upright Tactical Walk Into Foggy Avenue
    else if (frame <= 1650) {
      const t = tween(frame, 1574, 1650);
      drawSkyAndApexTower(frame, 1.05, 780, 295);
      rect('#111c26', 0, 295, W, 245);
      shape('M0 295 H960', null, '#223444', 2);
      await drawSideLead(cutoutBase64, anchors, mix(240, 500, t), 468, 0.45);
      if (frame >= 1605 && frame <= 1630) {
        const px = mix(1060, -140, tween(frame, 1605, 1630));
        rect('#04080d', px, 0, 44, H);
      }
      drawCornerClock('00:56 AM', 1);
    }
    // SHOT 24 (1:08.8–1:12.4, f1651..1736): 2-Beat Skyline Lock (look-up -> Apex Tower Closer)
    else if (frame <= 1736) {
      if (frame <= 1689) {
        drawSkyAndApexTower(frame, 0.9, 800, 340);
        drawLeadFrontBust(W * 0.5, H * 0.62, 1.48, 'head-determined', { faceMode: 'look-up', beaconEye: true });
      } else {
        const z = mix(1.0, 1.28, tween(frame, 1690, 1736));
        ctx.save();
        ctx.translate(W * 0.56, H * 0.45);
        ctx.scale(z, z);
        ctx.translate(-W * 0.56, -H * 0.45);
        drawSkyAndApexTower(frame, 1.42, 540, 380);
        ctx.restore();
      }
    }
    // SHOT 25 (1:12.4–1:16.0, f1737..1823): Dramatic Low-Angle Cliffhanger Push-In
    else {
      const t = tween(frame, 1737, 1823);
      const z = mix(1.0, 1.14, t);
      ctx.save();
      ctx.translate(W * 0.5, H * 0.54);
      ctx.scale(z, z);
      ctx.translate(-W * 0.5, -H * 0.54);
      drawSkyAndApexTower(frame, 1.25, 740, 325);
      rect('#0f1a24', 0, 325, W, 215);
      if (typeof window.drawCinematicAngle === 'function') {
        window.drawCinematicAngle(ctx, 480, 305, 1.25, 'low-angle', { hideLimbs: true, backpack: true });
      }
      // Fixed mid-lower neck Smoker burn + Connected 2-Bone IK Arms from shoulders -> wrists + Sculpted Gloved Fists!
      drawFrontNeckBurn(480, 354, 0.72, 0.9);
      window.drawArmChain(ctx, [372, 405], [426, 468], { upperLen: 112, lowerLen: 96, bendDir: 1, upperWidth: 22, elbowWidth: 19, wristWidth: 15, cardboard: true, leatherStrap: true });
      window.drawArmChain(ctx, [588, 405], [532, 462], { upperLen: 112, lowerLen: 96, bendDir: -1, upperWidth: 22, elbowWidth: 19, wristWidth: 15, cardboard: true, leatherStrap: true });
      window.drawWeaponHandBack(ctx, 'front-shotgun-grip-L', 426, 468, 0.92, -4);
      window.drawWeaponHandBack(ctx, 'front-shotgun-grip-R', 532, 462, 0.92, -4);
      drawPumpShotgun(486, 466, -4, 1.25, 0.65);
      window.drawWeaponHandFront(ctx, 'front-shotgun-grip-L', 426, 468, 0.92, -4);
      window.drawWeaponHandFront(ctx, 'front-shotgun-grip-R', 532, 462, 0.92, -4);
      ctx.restore();
      // Clean fade/cut to black on final 4 frames
      if (frame >= 1818) {
        ctx.save();
        ctx.globalAlpha = clamp((frame - 1818) / 5);
        rect('#000000', 0, 0, W, H);
        ctx.restore();
      }
    }

    // Subtle film grain & vignette
    ctx.drawImage(grain, 0, 0);
    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
  };
})();
