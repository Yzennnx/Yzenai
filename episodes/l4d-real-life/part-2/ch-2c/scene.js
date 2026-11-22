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
  let seed = 2027;
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

  // Raw red Smoker rope-burn scar centered cleanly on mid-lower front neck
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

  // Unified cuff + corrugated cardboard + gray duct-tape forearm (+ optional leather wrist strap after Shot 20!)
  // Rendered inside ONE unified coordinate transform so wrist seams never drift.
  function drawUnifiedArmoredCuff(extendLen = 195, shreddedRightArm = false, leatherStrap = false) {
    const endY = 56 + extendLen;
    if (!shreddedRightArm) {
      shape(`M-36 16 Q0 22 36 16 L${44 + extendLen * 0.04} ${endY} L${-44 - extendLen * 0.04} ${endY}Z`, '#a88156', '#253a3b', 2.4);
      for (let rx = -24; rx <= 24; rx += 12) {
        shape(`M${rx} 24 L${rx * 1.15} ${endY - 4}`, null, '#7e5d3b66', 1.1);
      }
      shape('M-37 26 Q0 32 37 26 L39 42 Q0 48 -39 42Z', '#8c969e', '#253a3b', 1.9);
      shape('M-40 62 Q0 68 40 62 L42 82 Q0 88 -42 82Z', '#8c969e', '#253a3b', 1.9);
      if (extendLen > 90) {
        shape('M-43 114 Q0 120 43 114 L45 134 Q0 140 -45 134Z', '#8c969e', '#253a3b', 1.8);
      }
    } else {
      // Shredded Hunter-bite cardboard & frayed gray duct tape on outer-mid right forearm
      shape(`M-36 16 Q0 22 36 16 L${44 + extendLen * 0.04} ${endY} L${-44 - extendLen * 0.04} ${endY}Z`, '#a37b51', '#253a3b', 2.4);
      shape('M-28 42 L-6 54 L12 40 L26 58 L14 78 L-10 72 L-24 88 L-34 62Z', '#593e24', '#253a3b', 1.8);
      for (let fy = 48; fy <= 78; fy += 7) {
        shape(`M-22 ${fy} L18 ${fy - 3}`, null, '#382515', 1.3);
      }
      for (let rx = -24; rx <= 24; rx += 12) {
        shape(`M${rx} 84 L${rx * 1.15} ${endY - 4}`, null, '#7e5d3b66', 1.1);
      }
      shape('M-36 38 L-58 50 L-44 68 L-30 56Z', '#b88e60', '#253a3b', 1.9);
      shape('M34 46 L56 62 L42 84 L28 66Z', '#b88e60', '#253a3b', 1.9);
      shape('M-14 74 L-26 98 L-6 94 L4 78Z', '#9e764d', '#253a3b', 1.6);
      shape('M-37 26 Q-14 31 -4 29 L-6 43 Q-18 45 -39 42Z', '#8c969e', '#253a3b', 1.9);
      shape('M10 29 Q24 30 37 26 L39 42 Q24 45 12 43Z', '#8c969e', '#253a3b', 1.9);
      if (!leatherStrap) {
        shape('M-38 56 L-64 92 L-50 100 L-32 72Z', '#96a0a8', '#253a3b', 1.8);
        shape('M36 62 L62 104 L48 112 L32 76Z', '#859098', '#253a3b', 1.8);
      }
      if (extendLen > 90) {
        shape('M-43 114 Q0 120 43 114 L45 134 Q0 140 -45 134Z', '#8c969e', '#253a3b', 1.8);
        shape('M-18 116 L-4 132 M12 115 L22 134', null, '#3c4850', 1.5);
      }
    }

    if (leatherStrap) {
      // Heavy dark brown leather work glove gauntlet cuff + cinched strap & brass buckle over torn cardboard!
      shape('M-30 -6 Q0 0 30 -6 L42 54 Q0 62 -42 54Z', '#4d301e', ink, 2.5);
      shape('M-26 2 Q0 7 26 2 L34 46 Q0 52 -34 46Z', '#5e3b25');
      // Stitching lines
      shape('M-34 42 Q0 49 34 42', null, '#8f6544', 1.4);
      // Heavy cinched wrist strap + brass buckle
      shape('M-38 14 Q0 20 38 14 L40 31 Q0 37 -40 31Z', '#331e12', ink, 2.2);
      rect('#b89248', 12, 16, 15, 14);
      shape('M12 16 H27 V30 H12Z', null, ink, 1.6);
      rect('#331e12', 16, 20, 7, 6);
    } else {
      // Cream shirt cuff flush at wrist seam
      shape('M-24 -3 Q1 0 25 -4 L28 15 Q2 21 -28 15Z', '#ede5d0', '#253a3b', 2.4);
      shape('M-25 10 Q2 15 25 9', null, '#a49c86', 1.2);
      oval(19, 7, 2.5, 2.5, '#c6bda8', '#8a8575', 0.8);
    }
  }

  // Reusable #bar-hold studio SVG cylindrical grip hand with unified armored cuff
  // Supports leatherGlove = true (Shot 20 onward) in the exact same anatomical geometry!
  function drawStudioCylinderGrip(drawPropFn, x, y, rotDeg, sc = 1.65, opts = {}) {
    const { shredded = false, leatherGlove = false, extendLen = 210 } = opts;
    const baseFill = leatherGlove ? '#523421' : '#e7ae87';
    const shadeFill = leatherGlove ? '#382214' : '#c88e72';
    const hiFill = leatherGlove ? '#6b462e' : '#f3c39d';
    const creaseStroke = leatherGlove ? '#24140b' : '#9e6755';

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.scale(sc, sc);
    ctx.translate(-126, -124);
    shape('M100 105 Q90 108 85 119 Q79 130 82 143 Q82 151 88 155 Q93 159 100 155 Q104 153 104 148 Q104 144 98 143 L95 143 Q92 137 97 132 L111 119Z', shadeFill, '#253a3b', 2.4);
    drawPropFn();
    shape('M99 61 Q102 72 96 83 Q90 95 91 109 Q91 118 95 123 Q97 130 98 147 Q98 158 101 162 Q106 168 112 162 Q115 159 115 151 L114 128 Q117 137 118 153 Q119 166 124 168 Q131 171 135 165 Q137 161 135 153 L132 128 Q136 136 139 153 Q141 163 146 163 Q154 163 155 156 Q156 151 152 142 L149 125 Q154 132 157 144 Q160 153 166 153 Q173 152 172 145 Q170 132 164 112 Q161 100 154 94 Q143 81 139 61Z', baseFill, '#253a3b', 2.4);
    shape('M139 63 Q143 80 154 94 Q161 100 164 112 L172 145 Q173 152 166 152 Q160 153 157 144 L150 123 Q156 117 154 110 Q148 99 140 93 Q130 82 130 63Z', shadeFill);
    shape('M98 106 Q98 88 106 79 Q117 77 133 87 Q143 94 146 104 Q133 102 124 105 Q110 106 98 106Z', hiFill);
    shape('M98 114 Q104 109 110 113 M117 116 Q123 110 129 114 M136 115 Q142 109 146 112 M153 117 L160 115 M101 136 Q106 133 111 135 M121 140 Q126 136 131 139 M140 138 L148 136 M158 136 L166 133', null, creaseStroke, 1.6);
    if (leatherGlove) {
      // Leather knuckle reinforcement seam
      shape('M96 104 Q122 98 156 108', null, '#8f6544', 1.4);
    }
    ctx.save();
    ctx.translate(118, 66);
    ctx.rotate(Math.PI);
    ctx.scale(0.84, 1.0);
    drawUnifiedArmoredCuff(extendLen, shredded, leatherGlove);
    ctx.restore();
    ctx.restore();
  }

  // Reusable #bar-press open-palm hand with unified armored cuff
  function drawStudioPalmPress(x, y, rotDeg, sc = 1.75, shredded = false, extendLen = 220, leatherGlove = false) {
    const baseFill = leatherGlove ? '#523421' : '#e7ae87';
    const shadeFill = leatherGlove ? '#382214' : '#c88e72';
    const hiFill = leatherGlove ? '#6b462e' : '#f3c39d';
    const creaseStroke = leatherGlove ? '#24140b' : '#9e6755';

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.scale(sc, sc);
    ctx.translate(-120, -124);
    shape('M98 169 C99 153 95 144 88 133 L68 108 C61 99 66 91 73 94 Q80 95 87 106 L97 114 L96 57 C96 48 106 47 109 55 L114 91 L115 40 C115 30 128 29 130 40 L133 90 L137 48 C138 39 150 40 151 50 L151 96 L158 66 C160 57 171 60 171 69 L166 116 Q165 136 151 151 Q145 157 145 168Z', baseFill, '#253a3b', 2.4);
    shape('M98 117 Q116 113 124 133 Q122 151 106 153 Q102 137 98 117Z', hiFill);
    shape('M160 115 Q155 142 143 151 L142 166 L132 166 Q140 149 143 134Z', shadeFill);
    shape('M101 116 Q119 123 117 146 M106 108 Q127 103 151 107 M119 118 Q137 112 149 115 M116 157 Q127 159 138 156', null, creaseStroke, 1.6);
    ctx.save();
    ctx.translate(120, 166);
    ctx.scale(0.96, 1.0);
    drawUnifiedArmoredCuff(extendLen, shredded, leatherGlove);
    ctx.restore();
    ctx.restore();
  }

  // Detailed matte-black 12-gauge pump-action shotgun (origin = receiver center, muzzle pointing +X!)
  function drawPumpShotgun(opts = {}) {
    const { pumpOffset = 0, glintT = -1, showChamberShell = false } = opts;
    // Matte-black polymer/wood buttstock & pistol grip (x: -188 .. -48)
    shape('M-188 -6 L-108 -14 L-66 -4 L-48 -14 L-44 12 L-82 20 L-108 16 L-184 36 Q-194 14 -188 -6Z', '#1f252b', ink, 2.4);
    shape('M-182 -2 L-108 -9 L-68 0 L-108 8 L-180 18Z', '#2d3640');
    // Buttpad
    rect('#12161a', -192, -6, 8, 42);
    // Trigger guard & trigger
    shape('M-52 12 Q-38 30 -16 24 L-12 12', null, '#181e24', 3.0);
    shape('M-34 12 Q-32 22 -36 22', null, '#485460', 2.0);
    // Steel receiver (x: -50 .. 46)
    shape('M-50 -16 H44 L48 12 H-48Z', '#232b33', ink, 2.6);
    shape('M-46 -13 H42 V-7 H-46Z', '#3c4854');
    // Ejection port (opens when pumpOffset < -4!)
    const portOpen = clamp(-pumpOffset / 28);
    rect('#11161c', -10, -10, 34, 11);
    if (showChamberShell && portOpen > 0.25) {
      // Glimpse of bright red 12-gauge shell & brass base feeding into chamber!
      rect('#c92a2a', -6, -8, 22, 7);
      rect('#d9b452', -6, -8, 7, 7);
    } else {
      rect('#495663', -8 + portOpen * 22, -9, Math.max(4, 30 - portOpen * 22), 9);
    }
    // Under-barrel magazine tube (x: 44 .. 204)
    rect('#202830', 44, -1, 160, 11);
    shape('M44 -1 H204 V10 H44Z', null, ink, 2.0);
    // Long matte-black 12-gauge barrel (x: 44 .. 238)
    rect('#26303a', 44, -15, 194, 13);
    shape('M44 -15 H238 V-2 H44Z', null, ink, 2.2);
    rect('#4b5b6b', 46, -13, 188, 3.5);
    // Front brass bead sight & barrel clamp
    rect('#d9b452', 231, -19, 5, 5);
    rect('#1a2026', 194, -16, 12, 28);
    // Movable ribbed polymer pump forend (x: 82 + pumpOffset .. 166 + pumpOffset)
    const px = 82 + pumpOffset;
    shape(`M${px} -4 H${px + 84} Q${px + 90} 6 ${px + 84} 16 H${px} Q${px - 6} 6 ${px} -4Z`, '#1c2228', ink, 2.4);
    for (let rx = px + 8; rx <= px + 76; rx += 9) {
      shape(`M${rx} -2 V14`, null, '#38434f', 2.0);
    }
    // Sweeping cold silver steel star glint
    if (glintT >= 0 && glintT <= 1) {
      const gx = mix(-20, 224, glintT);
      const gy = mix(-10, -12, glintT);
      starGlint(gx, gy, Math.sin(glintT * Math.PI) * 26, '#f4fbffee');
    }
  }

  // Compact matte-black 9mm pistol (origin = trigger/frame center, muzzle pointing +X)
  function drawCompact9mm(magOffset = 0, glintT = -1) {
    // Detachable steel magazine sliding into grip
    ctx.save();
    ctx.translate(-34 - magOffset * 0.32, 42 + magOffset);
    ctx.rotate(0.24);
    shape('M-13 -38 H13 V38 H-13Z', '#35404a', ink, 2.2);
    rect('#526270', -9, -34, 6, 66);
    // Brass top 9mm cartridge visible when magazine is partially out!
    if (magOffset > 8) {
      rect('#d9b452', -9, -43, 18, 7);
      oval(9, -39.5, 5, 3.5, '#c4833e', ink, 1.2);
    }
    // Baseplate
    rect('#1b2126', -16, 34, 32, 9);
    ctx.restore();

    // Polymer grip
    shape('M-52 2 L-16 2 L-30 70 L-66 64Z', '#1e242b', ink, 2.5);
    shape('M-48 12 L-26 12 L-36 58 L-58 54Z', '#2a333d');
    // Trigger guard & trigger
    shape('M-16 2 H24 V24 Q4 28 -18 22Z', null, '#1a2026', 3.4);
    shape('M4 4 Q2 16 8 18', null, '#4d5b68', 2.4);
    // Frame & matte-black slide
    shape('M-56 -22 H74 V4 H-50Z', '#252e37', ink, 2.6);
    shape('M-54 -19 H72 V-12 H-54Z', '#495868');
    // Slide serrations & ejection port
    for (let sx = -46; sx <= -28; sx += 6) {
      shape(`M${sx} -18 V-3`, null, '#141a20', 1.8);
    }
    rect('#141a20', 6, -20, 22, 8);
    // Front & rear iron sights
    rect('#1a2026', -52, -27, 8, 6);
    rect('#1a2026', 64, -27, 7, 6);
    oval(67, -24, 2, 2, '#eef6ff');
    if (glintT >= 0 && glintT <= 1) {
      starGlint(mix(-40, 68, glintT), -18, Math.sin(glintT * Math.PI) * 20, '#f4fbffee');
    }
  }

  // Bright red brass-headed 12-gauge shotgun shell (horizontal, brass rim at -X, crimp at +X)
  function drawRedShell(x, y, rotDeg = 0, sc = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.scale(sc, sc);
    // Red ribbed plastic hull
    shape('M-12 -11 H26 V11 H-12Z', '#c92a2a', ink, 2.0);
    rect('#e84a43', -10, -8, 34, 4);
    rect('#8f1b1b', -10, 5, 34, 4);
    // High-brass head & rim
    shape('M-26 -11 H-10 V11 H-26Z', '#d6b04b', ink, 2.0);
    rect('#f5dc82', -24, -8, 12, 4);
    rect('#b89030', -29, -13, 4, 26);
    ctx.restore();
  }

  // Cold blue-steel gunsmith flat pry-bar (origin = grip center)
  function drawSteelPryBar(glintT = -1) {
    shape('M-96 -8 H92 L126 -24 L132 -12 L96 8 H-96 L-122 22 L-128 10Z', '#5a6a78', ink, 2.4);
    shape('M-92 -5 H88 L118 -19 L88 1 H-92Z', '#8da0b0');
    if (glintT >= 0 && glintT <= 1) {
      starGlint(mix(-70, 118, glintT), -6, Math.sin(glintT * Math.PI) * 20, '#f4fbffee');
    }
  }

  // Volumetric warm-white dusty flashlight cone
  function drawFlashlightCone(frame, ox, oy, tx, ty, spread = 175, intensity = 0.56) {
    if (intensity <= 0.01) return;
    const dx = tx - ox;
    const dy = ty - oy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const g = ctx.createLinearGradient(ox, oy, tx, ty);
    g.addColorStop(0, `rgba(255, 246, 206, ${intensity})`);
    g.addColorStop(0.55, `rgba(255, 238, 184, ${intensity * 0.48})`);
    g.addColorStop(1, 'rgba(255, 232, 168, 0)');
    shape(
      `M${ox} ${oy} L${tx + nx * spread} ${ty + ny * spread} L${tx - nx * spread} ${ty - ny * spread}Z`,
      g
    );
    // Floating illuminated dust motes inside cone
    for (let i = 0; i < 16; i++) {
      const t = 0.16 + ((i * 0.19 + frame * 0.004) % 0.78);
      const s = Math.sin(i * 2.4 + frame * 0.05) * spread * t * 0.65;
      const mx = ox + dx * t + nx * s;
      const my = oy + dy * t + ny * s;
      oval(mx, my, 1.4 + (i % 3) * 0.6, 1.4 + (i % 3) * 0.6, `rgba(255, 248, 214, ${intensity * (0.45 + (i % 3) * 0.15)})`);
    }
  }

  // Gunsmith workshop interior backdrop
  function drawWorkshopInterior(panX = 0, moonlight = 0.75, warmBounce = 0) {
    rect('#070b10', 0, 0, W, H);
    rect('#111820', 0, 0, W, 390);
    for (let wy = 44; wy < 390; wy += 44) {
      shape(`M0 ${wy} H${W}`, null, '#0a0f14', 1.6);
    }
    for (let wx = -((panX % 96) + 96) % 96; wx < W + 96; wx += 96) {
      shape(`M${wx} 0 V390`, null, '#0a0f14aa', 1.4);
    }
    rect('#161d25', 0, 390, W, 150);
    shape('M0 390 H960', null, '#070b0f', 3.0);
    if (moonlight > 0.04) {
      ctx.save();
      ctx.globalAlpha = moonlight;
      shape(`M${320 - panX * 0.35} 0 L${485 - panX * 0.35} 0 L${665 - panX * 0.35} 540 L${380 - panX * 0.35} 540Z`, 'rgba(132, 174, 222, 0.11)');
      ctx.restore();
    }
    if (warmBounce > 0.02) {
      const wg = ctx.createRadialGradient(480, 290, 20, 480, 290, 520);
      wg.addColorStop(0, `rgba(255, 230, 168, ${warmBounce * 0.24})`);
      wg.addColorStop(1, 'rgba(255, 230, 168, 0)');
      rect(wg, 0, 0, W, H);
    }
  }

  // Midnight fogged downtown alley + Apex Tower skyline backdrop
  function drawMidnightFogAlley(frame, scrollX = 0, opts = {}) {
    const { showBeacon = false, fogStrength = 0.85 } = opts;
    const sky = ctx.createLinearGradient(0, 0, 0, 390);
    sky.addColorStop(0, '#040912');
    sky.addColorStop(0.55, '#0d1a2c');
    sky.addColorStop(1, '#192c40');
    rect(sky, 0, 0, W, 410);

    // Distant downtown skyline silhouettes
    const skyOff = (scrollX * 0.18) % 360;
    const towers = [
      [40, 110, 96, 300], [156, 150, 84, 260], [260, 88, 108, 322],
      [410, 58, 92, 352], [536, 134, 110, 276], [674, 96, 98, 314],
      [792, 140, 116, 270], [928, 106, 98, 304],
    ];
    for (const [bx, by, bw, bh] of towers) {
      rect('#09111b', bx - skyOff, by, bw, bh);
      rect('#122030', bx - skyOff + 6, by + 10, bw - 12, 4);
    }

    if (showBeacon) {
      const ax = 456 - skyOff;
      shape(`M${ax} 58 V24`, null, '#3c4c5c', 2.4);
      const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame * 0.24));
      const bg = ctx.createRadialGradient(ax, 24, 2, ax, 24, 58 * pulse);
      bg.addColorStop(0, `rgba(255, 54, 48, ${0.95 * pulse})`);
      bg.addColorStop(0.45, `rgba(255, 36, 36, ${0.38 * pulse})`);
      bg.addColorStop(1, 'rgba(255, 36, 36, 0)');
      rect(bg, ax - 70, -40, 140, 130);
      oval(ax, 24, 5, 5, '#ff4d45');
    }

    // Mid-ground brick alley walls & rear workshop exit door
    const wallOff = scrollX % 520;
    for (let i = -1; i < 3; i++) {
      const wx = i * 520 - wallOff;
      rect('#1a171c', wx, 84, 290, 356);
      shape(`M${wx} 84 H${wx + 290} V440 H${wx}Z`, null, ink, 2.8);
      // Shuttered rear metal exit door
      rect('#293440', wx + 66, 212, 112, 228);
      shape(`M${wx + 66} 212 H${wx + 178} V440 H${wx + 66}Z`, null, ink, 2.6);
      // High frosted transom above door
      rect('rgba(148, 192, 232, 0.16)', wx + 66, 174, 112, 28);
    }

    // Wet midnight asphalt & reflective puddles
    rect('#121a24', 0, 440, W, 100);
    rect('#223040', 0, 434, W, 8);
    const pOff = scrollX % 300;
    for (let i = -1; i < 4; i++) {
      const px = i * 300 - pOff;
      oval(px + 130, 488, 96, 16, '#20364c88', '#3c5c7a44', 1.4);
    }

    // Drifting layered blue midnight fog wisps
    if (fogStrength > 0.05) {
      for (let f = 0; f < 5; f++) {
        const fx = ((f * 260 - frame * (1.2 + f * 0.35) - scrollX * 0.4) % (W + 420) + (W + 420)) % (W + 420) - 210;
        const fy = 330 + f * 34;
        oval(fx, fy, 220, 42, `rgba(128, 168, 206, ${0.11 * fogStrength})`);
      }
    }
  }

  // OpenToonz armored Series Lead with joint-locked bulging backpack, Smoker neck burn,
  // reinforced forearm/shin wraps, dark brown leather work gloves (Shots 21 & 26!), and pump shotgun!
  async function drawArmoredLead(cutout, anchors, worldX, worldFloorY, scale, opts = {}) {
    if (!cutout) return;
    const {
      flipLeft = false,
      bulgingPack = true,
      neckScuff = true,
      leatherGloves = true,
      reinforcedRightArm = true,
      shotgun = true,
      noShadow = false,
    } = opts;
    const img = await loadPng(cutout);
    if (!noShadow) {
      ctx.fillStyle = '#05090e88';
      ctx.beginPath();
      ctx.ellipse(worldX, worldFloorY, 50 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
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

    const drawWrap = (anchor, len, w, yOff, withLeatherStrap = false) => {
      if (!anchor) return;
      const [ax, ay, aa] = anchor;
      ctx.save();
      ctx.translate(ox + ax * scale, oy + ay * scale);
      ctx.rotate(aa * Math.PI / 180);
      ctx.scale(scale, scale);
      shape(`M${-w} ${yOff} H${w} L${w - 1.5} ${yOff + len} H${-w + 1.5}Z`, '#a37b51', '#253a3b', 2.0);
      rect('#8c969e', -w - 1, yOff + len * 0.22, (w + 1) * 2, len * 0.20);
      rect('#8c969e', -w - 1, yOff + len * 0.62, (w + 1) * 2, len * 0.20);
      if (withLeatherStrap) {
        // Dark brown leather gauntlet cuff & cinched wrist strap over cardboard seam
        shape(`M${-w - 1.5} ${yOff + len * 0.62} H${w + 1.5} V${yOff + len + 6} H${-w - 1.5}Z`, '#4d301e', ink, 1.8);
        rect('#331e12', -w - 2, yOff + len * 0.72, (w + 2) * 2, 7);
        rect('#b89248', 2, yOff + len * 0.72, 6, 7);
      }
      ctx.restore();
    };

    const drawGlove = (anchor, rad = 11) => {
      if (!anchor) return;
      const [hx, hy, ha] = anchor;
      ctx.save();
      ctx.translate(ox + hx * scale, oy + hy * scale);
      ctx.rotate(ha * Math.PI / 180);
      ctx.scale(scale, scale);
      oval(0, 4, rad, rad * 1.12, '#4d301e', ink, 2.0);
      shape(`M${-rad + 2} 1 Q0 -3 ${rad - 2} 1`, null, '#7d5438', 1.4);
      ctx.restore();
    };

    // 1. Bulging dark canvas backpack behind chest
    if (anchors?.chest) {
      const [cx, cy, ca] = anchors.chest;
      ctx.save();
      ctx.translate(ox + cx * scale, oy + cy * scale);
      ctx.rotate(ca * Math.PI / 180);
      ctx.scale(scale, scale);
      if (bulgingPack) {
        shape('M-64 -122 Q-88 -106 -88 -54 L-78 8 Q-50 22 -22 8 L-20 -122 Q-42 -134 -64 -122Z', '#2d3a34', ink, 2.6);
        shape('M-82 -68 H-30 V-14 H-82Z', '#222d28', ink, 2.0);
        shape('M-80 -94 Q-52 -84 -24 -94', null, '#53685d', 2.2);
      }
      ctx.restore();
    }

    // Far arm wrap + far leather glove behind torso
    drawWrap(anchors?.forearmFar, 40, 9.5, 14, leatherGloves);
    if (leatherGloves) drawGlove(anchors?.handFar, 10.5);

    // 2. Official OpenToonz character layer
    ctx.drawImage(img, ox, oy, 540 * scale, 960 * scale);

    // 3. Tracked backpack shoulder strap, mid-neck Smoker burn, shin & near forearm wraps
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
      shape('M-13 -4 Q2 1 16 -3', null, '#b4302ccc', 4.4);
      ctx.restore();
    }
    drawWrap(anchors?.shinFar, 54, 13, 18, false);
    drawWrap(anchors?.shinNear, 54, 14, 18, false);
    drawWrap(anchors?.forearmNear, 42, 10, 14, leatherGloves && reinforcedRightArm);

    // 4. Matte-black 12-gauge pump shotgun locked cleanly to handNear -> handFar!
    if (shotgun && anchors?.handNear) {
      const [hx, hy, ha] = anchors.handNear;
      const sx = ox + hx * scale;
      const sy = oy + hy * scale;
      let gunAng = (ha - 76) * Math.PI / 180;
      if (anchors?.handFar) {
        const [fx, fy] = anchors.handFar;
        const dx = (fx - hx);
        const dy = (fy - hy);
        if (Math.hypot(dx, dy) > 18) {
          gunAng = Math.atan2(dy, dx);
        }
      }
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(gunAng);
      ctx.scale(scale * 0.62, scale * 0.62);
      ctx.translate(54, -4);
      drawPumpShotgun({ pumpOffset: 0, glintT: -1 });
      ctx.restore();
    }

    // Near dark brown leather work glove gripping receiver/grip
    if (leatherGloves) drawGlove(anchors?.handNear, 11.5);

    ctx.restore();
  }

  // =========================================================================
  // SHOT 1 (f0..61): Pitch-Dark Silhouette Bust (00:28 AM, head-exhausted -> head-notice)
  // =========================================================================
  function drawShot1PitchDarkBust(frame) {
    const notice = frame >= 28;
    const lift = tween(frame, 24, 52);
    const zoom = mix(1.0, 1.07, tween(frame, 0, 61));
    const breath = Math.sin(frame * 0.16) * 3.5;

    rect('#04070c', 0, 0, W, H);
    rect('#0f161f', 190, 0, 580, H);

    ctx.save();
    ctx.translate(480, 270 + breath);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Backpack silhouette behind torso (front-view backpack rule!)
    shape('M332 372 Q480 344 628 372 L646 548 H314Z', '#1b2420', ink, 2.8);

    window.drawAnatomyTurnaround(ctx, 480, 1456, 3.04, 'front', {
      hideLimbs: false,
      expression: notice ? 'head-notice' : 'head-exhausted',
      headPitch: mix(0.28, -0.10, lift),
      eyeOffset: [mix(0, 2.8, lift), mix(1.2, -0.4, lift)],
      sweat: 0.32,
    });
    drawFrontNeckBurn(480, 292, 1.12, 0.88);
    // Clean backpack shoulder straps in front
    shape('M356 392 L374 550 H416 L396 384Z M604 392 L586 550 H544 L564 384Z', '#1f2924', ink, 3.0);

    // Heavy pitch-dark gloom with narrow cold moonlight slit from high transom across face & neck burn
    shape('M0 0 H960 V540 H0Z', `rgba(3, 7, 13, ${mix(0.66, 0.54, lift)})`);
    shape('M330 80 L610 80 L560 340 L290 340Z', 'rgba(138, 182, 230, 0.15)');

    ctx.restore();
    drawCornerClock('00:28 AM', 0.92);
  }

  // =========================================================================
  // SHOT 2 (f62..119): POV Pocket Pull — Cracked Phone 4% BATTERY Cold Blue Glow
  // =========================================================================
  function drawShot2PhonePocketPull(frame) {
    const pull = tween(frame, 62, 92);
    const wake = tween(frame, 76, 86);
    const zoom = mix(1.0, 1.07, tween(frame, 62, 119));
    const tremor = Math.sin(frame * 0.55) * 1.8;

    rect('#05090f', 0, 0, W, H);
    ctx.save();
    ctx.translate(480 + tremor, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Cold blue screen radiance spilling across darkness when screen wakes at f76
    if (wake > 0.02) {
      const bg = ctx.createRadialGradient(468, 250, 20, 468, 250, 340);
      bg.addColorStop(0, `rgba(116, 184, 255, ${0.38 * wake})`);
      bg.addColorStop(1, 'rgba(52, 108, 186, 0)');
      rect(bg, 0, 0, W, H);
    }

    // Dark trouser pocket corner lower-left
    shape('M-20 340 L310 420 L270 560 H-20Z', '#19222b', ink, 3.2);
    shape('M20 364 L290 434', null, '#3a4b5c', 2.2);

    // Phone + torn-cardboard-cuff right hand rising cleanly out of pocket!
    const py = mix(420, 258, pull);
    const px = mix(380, 468, pull);
    const rot = mix(-14, -4, pull);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot * Math.PI / 180);

    // Unified shredded right forearm extending cleanly off bottom-right edge!
    ctx.save();
    ctx.translate(88, 128);
    ctx.rotate(-0.46);
    ctx.scale(1.52, 1.52);
    drawUnifiedArmoredCuff(240, true, false);
    ctx.restore();

    // Back palm & curled fingers holding cracked smartphone
    shape('M-84 -32 Q-98 20 -78 104 L76 118 Q106 72 94 -26Z', '#c88e72', ink, 2.8);

    // Cracked smartphone chassis
    shape('M-76 -144 H76 Q88 -144 88 -132 V126 Q88 138 76 138 H-76 Q-88 138 -88 126 V-132 Q-88 -144 -76 -144Z', '#1b222a', ink, 3.2);
    // Phone screen
    const scrFill = wake > 0.05 ? `rgba(16, 44, 78, ${0.35 + wake * 0.65})` : '#0a0e14';
    rect(scrFill, -76, -124, 152, 238);
    if (wake > 0.05) {
      ctx.save();
      ctx.globalAlpha = wake;
      label('00:28', 0, -56, 36, '#e6f3ff');
      // Red critical 4% battery icon
      shape('M-46 -12 H36 V32 H-46Z', '#111c28', '#ff524d', 3.2);
      rect('#ff524d', 36, 0, 8, 20);
      rect('#ff3b36', -40, -6, 14, 32);
      label('4% BATTERY', 0, 68, 18, '#ff6862');
      // Flashlight quick-icon at bottom
      oval(0, 96, 13, 13, '#274666', '#9ed0ff', 1.8);
      ctx.restore();
    }
    // Hairline cracked screen glass spiderweb
    shape('M-76 -92 L-18 -46 L38 -110 M-18 -46 L14 26 L76 62 M-18 -46 L-64 14', null, 'rgba(218, 238, 255, 0.55)', 1.6);

    // Right thumb gripping right bezel cleanly
    shape('M64 12 Q98 6 106 34 Q108 62 78 68 Q56 62 56 36Z', '#e7ae87', ink, 2.6);
    ctx.restore();

    ctx.restore();
  }

  // =========================================================================
  // SHOT 3 (f120..181): Studio POV Flashlight Ignition (pov-flashlight + torn right cardboard!)
  // =========================================================================
  function drawShot3FlashlightIgnition(frame) {
    const on = frame >= 139;
    const beamP = tween(frame, 139, 156);
    const sweep = Math.sin(tween(frame, 142, 181) * Math.PI * 0.85) * 70;
    const snapJolt = (frame >= 139 && frame <= 145) ? Math.sin((frame - 139) * 3.8) * 5 : 0;

    ctx.save();
    ctx.translate(snapJolt, snapJolt * 0.4);

    drawWorkshopInterior(40, 0.25, on ? 0.65 * beamP : 0);

    // Faint looming workshop silhouettes in darkness (revealed when beam snaps ON at f139!)
    ctx.save();
    ctx.globalAlpha = on ? mix(0.22, 0.88, beamP) : 0.16;
    rect('#1c252f', 64, 240, 290, 150);
    rect('#25313e', 110, 148, 120, 92);
    rect('#1a232d', 440, 224, 310, 166);
    ctx.restore();

    // Official studio SVG POV flashlight hand (art.js pov-flashlight) positioned lower-left-center aiming UP-RIGHT across the workshop!
    // Single wide volumetric beam aligned cleanly to the full bezel width — ZERO fake backward beam, ZERO awkward hand shapes!
    ctx.save();
    ctx.translate(415, 376);
    ctx.rotate(mix(0.08, -0.05, beamP) + Math.sin(tween(frame, 142, 181) * Math.PI) * 0.04);
    ctx.scale(1.88, 1.88);
    ctx.translate(-176, -216);

    // 1. Extended wide volumetric warm-white LED beam in the EXACT local coordinate space of pov-flashlight's bezel!
    //    (pov-flashlight rotates by 146 deg around (176,216), lens spans y=102..146 at x=-18, aiming toward -X!)
    if (on) {
      ctx.save();
      ctx.translate(176, 216);
      ctx.rotate(146 * Math.PI / 180);
      ctx.scale(1.10, 1.10);
      ctx.translate(-126, -124);
      const wideBeam = ctx.createLinearGradient(-16, 124, -440, 124);
      wideBeam.addColorStop(0, `rgba(255, 244, 194, ${0.58 * beamP})`);
      wideBeam.addColorStop(0.55, `rgba(255, 232, 162, ${0.24 * beamP})`);
      wideBeam.addColorStop(1, 'rgba(255, 224, 142, 0)');
      shape('M-16 102 L-440 -58 L-440 306 L-16 146Z', wideBeam);
      // Floating dust motes strictly INSIDE the forward beam cone
      for (let i = 0; i < 16; i++) {
        const u = ((i * 0.19 + frame * 0.004) % 0.85) + 0.08;
        const dx = mix(-28, -360, u);
        const spread = mix(18, 130, u);
        const dy = 124 + Math.sin(i * 2.7 + frame * 0.05) * spread;
        oval(dx, dy, 1.2 + (i % 3) * 0.55, 1.2 + (i % 3) * 0.55, `rgba(255, 248, 218, ${(0.45 * (1 - u)) * beamP})`);
      }
      ctx.restore();
    }

    // 2. Official studio SVG hand + flashlight from art.js
    window.drawPovSurvivalHand(ctx, 'pov-flashlight');

    // 3. Before f139 (OFF state): darken lens & mask built-in beam so the click ON pops cleanly!
    if (!on) {
      ctx.save();
      ctx.translate(176, 216);
      ctx.rotate(146 * Math.PI / 180);
      ctx.scale(1.10, 1.10);
      ctx.translate(-126, -124);
      shape('M-16 101 L-124 46 L-124 202 L-16 147Z', '#090e16');
      shape('M-22 103 Q-14 124 -22 145 L-14 146 V102Z', '#3b4652', ink, 1.8);
      ctx.restore();
    }

    // 4. Unified shredded cardboard forearm locked directly below the cream cuff along the exact wrist axis!
    ctx.save();
    ctx.translate(176, 216);
    ctx.rotate(146 * Math.PI / 180);
    ctx.scale(1.10, 1.10);
    ctx.translate(-126, -124);
    ctx.translate(118, 66);
    ctx.rotate(Math.PI);
    ctx.scale(0.84, 0.96);
    drawUnifiedArmoredCuff(240, true, false);
    ctx.restore();

    ctx.restore();

    if (!on) {
      rect('rgba(3, 6, 12, 0.42)', 0, 0, W, H);
    }
    ctx.restore();
  }

  // =========================================================================
  // SHOT 4 (f182..244): Flashlight POV Sweep #1 — Spent Brass Casings + Angled Boot Kick (f211)
  // =========================================================================
  function drawShot4BrassFloorSweep(frame) {
    const p = tween(frame, 182, 244);
    const kickP = tween(frame, 198, 224);
    const rollP = tween(frame, 211, 242);

    // Oil-stained concrete workshop floor seen from downward POV
    rect('#121820', 0, 0, W, H);
    // Oil stains & concrete cracks
    oval(420, 310, 210, 95, '#0b1016bb');
    oval(700, 190, 150, 74, '#0c1118aa');
    shape('M120 80 L310 190 L520 164 L780 340 M310 190 L260 440', null, '#090d12', 2.2);

    // Warm-white flashlight pool sweeping across concrete floor
    const beamX = mix(360, 620, p);
    const beamY = mix(340, 260, p);
    const pool = ctx.createRadialGradient(beamX, beamY, 24, beamX, beamY, 330);
    pool.addColorStop(0, 'rgba(255, 240, 186, 0.42)');
    pool.addColorStop(0.6, 'rgba(255, 224, 154, 0.16)');
    pool.addColorStop(1, 'rgba(255, 224, 154, 0)');
    rect(pool, 0, 0, W, H);

    // Scattered spent brass shell casings glittering on concrete
    const casings = [
      [280, 390, 22], [350, 420, -34], [430, 360, 58], [492, 434, 14],
      [540, 290, -18], [608, 356, 74], [654, 246, -52], [720, 314, 30],
      [412, 244, -12], [580, 412, 42], [688, 404, -26], [312, 286, 66],
    ];
    for (let i = 0; i < casings.length; i++) {
      const [cx, cy, ang] = casings[i];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang * Math.PI / 180);
      rect('#b59038', -13, -5, 26, 10);
      shape('M-13 -5 H13 V5 H-13Z', null, ink, 1.6);
      rect('#f0d47a', -11, -3.5, 18, 3);
      rect('#8a6b24', 10, -5.5, 3, 11);
      ctx.restore();
      if ((frame + i * 7) % 24 < 6) {
        starGlint(cx, cy, 10, '#fff4b8cc');
      }
    }

    // Hero brass casing nudged spinning across floor at f211!
    const hx = mix(366, 646, rollP);
    const hy = mix(326, 264, rollP) - Math.sin(rollP * Math.PI) * 18;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(0.4 + rollP * 9.5);
    rect('#c79f40', -17, -6.5, 34, 13);
    shape('M-17 -6.5 H17 V6.5 H-17Z', null, ink, 2.0);
    rect('#ffe68f', -14, -4.5, 24, 4);
    ctx.restore();
    if (frame >= 211 && frame <= 223) {
      starGlint(384, 322, (1 - (frame - 211) / 12) * 28, '#fff7c8ee');
    }

    // Angled brown leather boot & dark trouser leg extending cleanly off TOP-LEFT edge (y < -60, ZERO floating tube!)
    const bootShiftX = mix(-46, 36, Math.sin(kickP * Math.PI));
    const bootShiftY = mix(-24, 18, Math.sin(kickP * Math.PI));
    ctx.save();
    ctx.translate(bootShiftX, bootShiftY);
    // Angled thigh & knee extending far above top-left frame edge (y = -110!)
    shape('M-40 -110 L132 -110 L236 168 L112 212Z', '#263038', ink, 3.2);
    // Cardboard shin wrap anchored around lower leg
    shape('M108 110 L214 74 L242 156 L136 194Z', '#a37b51', ink, 2.6);
    shape('M120 138 L224 102 L232 124 L128 160Z', '#8c969e', ink, 2.0);
    // Brown leather survival boot toeing the brass casing cleanly
    shape('M138 188 L244 152 L354 278 Q376 312 332 332 L212 316 Q162 292 138 188Z', '#5a3a26', ink, 3.2);
    shape('M216 316 L342 330 L348 314 L218 298Z', '#241812', ink, 2.2);
    shape('M196 200 L256 266 M218 190 L276 254', null, '#3b2416', 2.4);
    ctx.restore();
  }

  // =========================================================================
  // SHOT 5 (f245..311): Flashlight POV Sweep #2 — Lathe, Vises & MILLER CUSTOM GUNSMITH Sign
  // =========================================================================
  function drawShot5LatheAndSign(frame) {
    const p = tween(frame, 245, 311);
    const panX = mix(-40, 48, p);
    const zoom = mix(1.0, 1.07, p);

    ctx.save();
    ctx.translate(480 - panX, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    drawWorkshopInterior(120 + panX, 0.25, 0.35);

    // Framed brass-trimmed workshop wall sign: MILLER CUSTOM GUNSMITH & REPAIR
    rect('#2b1e14', 248, 52, 488, 128);
    shape('M248 52 H736 V180 H248Z', null, '#c7a24b', 4.6);
    shape('M258 62 H726 V170 H258Z', null, '#8f702d', 1.8);
    label('MILLER', 492, 108, 42, '#f2dfa8');
    label('CUSTOM GUNSMITH & REPAIR', 492, 148, 22, '#d9ba6c');

    // Heavy steel workbench across bottom
    rect('#2a231d', 40, 360, 880, 32);
    shape('M40 360 H920 V392 H40Z', null, ink, 3.2);
    rect('#1a222b', 60, 392, 840, 150);

    // Heavy industrial metal lathe (left-center)
    rect('#2b3947', 110, 242, 128, 118);
    shape('M110 242 H238 V360 H110Z', null, ink, 3.0);
    oval(244, 294, 18, 42, '#465768', ink, 2.6);
    rect('#324252', 262, 314, 234, 46);
    shape('M262 314 H496 V360 H262Z', null, ink, 2.8);
    rect('#24303c', 432, 266, 78, 94);
    oval(338, 344, 18, 18, null, '#8c9eab', 3.4);
    oval(412, 344, 14, 14, null, '#8c9eab', 3.0);

    // Heavy iron bench vise (right)
    shape('M640 360 V284 H698 V324 H742 V284 H798 V360Z', '#354454', ink, 3.0);
    shape('M618 324 H834', null, '#7a8e9e', 6.0);
    oval(836, 324, 9, 9, '#9ab0c2', ink, 2.0);

    // Warm flashlight beam sweeping from lathe -> framed gunsmith sign!
    const bx = mix(240, 520, p);
    const by = mix(300, 122, p);
    drawFlashlightCone(frame, 880, 540, bx, by, 215, 0.56);
    const spot = ctx.createRadialGradient(bx, by, 20, bx, by, 280);
    spot.addColorStop(0, 'rgba(255, 242, 190, 0.34)');
    spot.addColorStop(1, 'rgba(255, 242, 190, 0)');
    rect(spot, 0, 0, W, H);

    ctx.restore();
  }

  // =========================================================================
  // SHOT 6 (f312..369): Tight Front Reaction (head-notice -> head-relief, warm flashlight bounce)
  // =========================================================================
  function drawShot6FrontHopeReaction(frame) {
    const relief = frame >= 336;
    const shift = tween(frame, 330, 356);
    const zoom = mix(1.0, 1.08, tween(frame, 312, 369));

    drawWorkshopInterior(160, 0.2, 0.52);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Backpack silhouette behind torso
    shape('M332 372 Q480 344 628 372 L646 548 H314Z', '#222d28', ink, 2.8);

    window.drawAnatomyTurnaround(ctx, 480, 1450, 3.02, 'front', {
      hideLimbs: false,
      expression: relief ? 'head-relief' : 'head-notice',
      headPitch: mix(-0.08, 0.04, shift),
      eyeOffset: [mix(1.5, 0, shift), -0.4],
      sweat: 0.24,
    });
    drawFrontNeckBurn(480, 290, 1.12, 0.88);
    shape('M356 392 L374 550 H416 L396 384Z M604 392 L586 550 H544 L564 384Z', '#24302a', ink, 3.0);

    // Warm golden bounced flashlight illumination from below-front
    const wg = ctx.createRadialGradient(480, 420, 20, 480, 300, 390);
    wg.addColorStop(0, 'rgba(255, 228, 162, 0.34)');
    wg.addColorStop(1, 'rgba(255, 214, 134, 0)');
    rect(wg, 0, 0, W, H);

    ctx.restore();
  }

  // =========================================================================
  // SHOT 7 (f370..431): Flashlight Sweep #3 — Stripped Empty Wall Rifle Pegs
  // =========================================================================
  function drawShot7EmptyRifleWall(frame) {
    const p = tween(frame, 370, 431);
    const panX = mix(0, 220, p);

    drawWorkshopInterior(200 + panX, 0.18, 0.25);

    ctx.save();
    ctx.translate(-panX, 0);

    // Long stripped wooden/pegboard gun rack wall
    rect('#221b16', 60, 74, 1080, 286);
    shape('M60 74 H1140 V360 H60Z', null, ink, 3.4);
    // Faint dusty silhouettes of long-gone rifles & bare metal J-hooks
    for (let i = 0; i < 6; i++) {
      const rx = 110 + i * 170;
      const ry = 132 + (i % 2) * 102;
      // Dust outline of missing rifle
      shape(`M${rx} ${ry} H${rx + 124} V${ry + 12} H${rx + 46} L${rx + 12} ${ry + 26} L${rx} ${ry + 14}Z`, 'rgba(220, 206, 184, 0.09)');
      // Bare steel pegs
      shape(`M${rx + 26} ${ry + 8} V${ry + 24} Q${rx + 26} ${ry + 30} ${rx + 34} ${ry + 28}`, null, '#7e8e9c', 3.4);
      shape(`M${rx + 102} ${ry + 8} V${ry + 24} Q${rx + 102} ${ry + 30} ${rx + 110} ${ry + 28}`, null, '#7e8e9c', 3.4);
      // Crooked dangling paper price tag
      ctx.save();
      ctx.translate(rx + 68, ry + 26);
      ctx.rotate((i % 2 ? 0.25 : -0.22));
      rect('#d9cfb8', -12, 0, 24, 16);
      ctx.restore();
    }
    label('EMPTY', 360, 396, 18, '#5a6b7855');

    ctx.restore();

    // Sweeping warm flashlight cone crossing bare hooks
    const bx = mix(220, 780, p);
    drawFlashlightCone(frame, 480, 560, bx, 210, 210, 0.56);
    const spot = ctx.createRadialGradient(bx, 210, 20, bx, 210, 260);
    spot.addColorStop(0, 'rgba(255, 238, 182, 0.30)');
    spot.addColorStop(1, 'rgba(255, 238, 182, 0)');
    rect(spot, 0, 0, W, H);
  }

  // =========================================================================
  // SHOT 8 (f432..489): Tight Front Bust drawFaceAngle('eye-dart') Down-Right -> Glint!
  // =========================================================================
  function drawShot8EyeDartGlint(frame) {
    const snap = tween(frame, 450, 460);
    const zoom = mix(1.0, 1.09, tween(frame, 432, 489));

    drawWorkshopInterior(280, 0.22, 0.32);
    rect('#060b1277', 0, 0, W, H);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    window.drawFaceAngle(ctx, 480, 290, 1.26, 'eye-dart', {
      expression: frame < 454 ? 'head-dread' : 'head',
      dart: mix(-0.4, 2.8, snap),
      eyeDy: 0,
      sweat: 0.36,
    });
    drawFrontNeckBurn(480, 414, 0.86, 0.90);
    shape('M394 456 L406 548 H436 L424 452Z M566 456 L554 548 H524 L536 452Z', '#24302a', ink, 2.6);

    // Sharp metallic glint chime catching in lower-right corner & eye!
    if (frame >= 454 && frame <= 482) {
      const gp = (frame - 454) / 28;
      starGlint(812, 396, Math.sin(gp * Math.PI) * 34, '#f2faffff');
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 9 (f490..551): Stepped Beam Push-In #1 (1.0x) — Padlocked Glass Display Case
  // =========================================================================
  function drawShot9LockedGlassCase(frame) {
    const p = tween(frame, 490, 551);
    const zoom = mix(1.0, 1.09, p);

    ctx.save();
    ctx.translate(480, 286);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -286);

    drawWorkshopInterior(320, 0.25, 0.35);

    // Heavy wooden back counter framing low display case
    rect('#2c2118', 110, 398, 740, 144);
    shape('M110 398 H850 V542 H110Z', null, ink, 3.4);

    // Reinforced dusty glass display case
    rect('#151d26', 180, 174, 600, 226);
    // Padded dark red felt backing inside case
    rect('#2b181b', 196, 190, 568, 194);
    // Faint tantalizing weapon silhouettes inside glass
    ctx.save();
    ctx.translate(396, 254);
    ctx.scale(0.86, 0.86);
    drawPumpShotgun({ pumpOffset: 0, glintT: -1 });
    ctx.restore();
    ctx.save();
    ctx.translate(648, 316);
    ctx.scale(0.68, 0.68);
    drawCompact9mm(0, -1);
    ctx.restore();
    // Red shell box silhouette
    rect('#6e2424', 524, 316, 62, 46);

    // Glass pane sheen & dust streaks
    rect('rgba(164, 206, 238, 0.14)', 188, 182, 584, 210);
    shape('M260 182 L360 182 L286 392 L188 392Z', 'rgba(218, 240, 255, 0.14)');
    shape('M180 174 H780 V400 H180Z', null, '#63788a', 4.0);

    // Heavy brass padlock locked tight on center clasp!
    rect('#6d7b87', 462, 168, 36, 24);
    shape('M470 186 V174 Q480 162 490 174 V186', null, '#aebbc7', 4.0);
    rect('#c79f40', 464, 186, 32, 34);
    shape('M464 186 H496 V220 H464Z', null, ink, 2.2);
    oval(480, 202, 4, 5, '#2b2010');

    // Flashlight beam locking onto the brass padlock & glass case
    drawFlashlightCone(frame, 480, 560, 480, 260, 240, 0.52);
    if (frame >= 514 && frame <= 544) {
      starGlint(480, 196, Math.sin(((frame - 514) / 30) * Math.PI) * 26, '#fff7c4ee');
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 10 (f552..618): Stepped Beam Push-In #2 (1.42x) — 12-Gauge Pump Shotgun + Star Glint!
  // =========================================================================
  function drawShot10ShotgunReveal(frame) {
    const p = tween(frame, 552, 618);
    const zoom = mix(1.34, 1.46, p);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Dark crimson-felt padded display rack inside glass case
    rect('#211316', 0, 0, W, H);
    for (let x = 0; x < W; x += 64) {
      shape(`M${x} 0 V${H}`, null, '#180d10', 1.4);
    }
    // Padded wooden rack hooks cradling the pump shotgun
    shape('M332 282 V330 H354 V282Z M624 274 V324 H646 V274Z', '#4d3828', ink, 2.4);

    // Hero matte-black 12-gauge pump-action shotgun + sweeping cold silver star glint!
    ctx.save();
    ctx.translate(444, 264);
    ctx.scale(1.48, 1.48);
    drawPumpShotgun({ pumpOffset: 0, glintT: tween(frame, 568, 608) });
    ctx.restore();

    // Flashlight beam & glass reflection overlay
    const spot = ctx.createRadialGradient(mix(360, 580, p), 264, 30, 480, 264, 320);
    spot.addColorStop(0, 'rgba(255, 244, 200, 0.30)');
    spot.addColorStop(1, 'rgba(255, 244, 200, 0)');
    rect(spot, 0, 0, W, H);
    shape('M260 0 L380 0 L240 540 L120 540Z', 'rgba(208, 234, 255, 0.12)');

    ctx.restore();
  }

  // =========================================================================
  // SHOT 11 (f619..685): Stepped Beam Push-In #3 (1.65x) — 9mm Pistol, Spare Mag & Red Shells!
  // =========================================================================
  function drawShot11PistolAndShells(frame) {
    const p = tween(frame, 619, 685);
    const zoom = mix(1.52, 1.68, p);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Padded display case shelf
    rect('#221417', 0, 0, W, H);
    rect('#2d2219', 0, 344, W, 200);
    shape('M0 344 H960', null, ink, 3.0);

    // Compact matte-black 9mm pistol (left)
    ctx.save();
    ctx.translate(340, 274);
    ctx.rotate(-0.08);
    ctx.scale(1.36, 1.36);
    drawCompact9mm(0, tween(frame, 632, 662));
    ctx.restore();

    // Loaded spare steel magazine beside pistol
    ctx.save();
    ctx.translate(468, 304);
    ctx.rotate(0.42);
    rect('#35404a', -14, -44, 28, 86);
    shape('M-14 -44 H14 V42 H-14Z', null, ink, 2.2);
    rect('#d9b452', -10, -50, 20, 8);
    rect('#1b2126', -17, 38, 34, 10);
    ctx.restore();

    // Half-empty vintage cardboard box of bright red 12-gauge shells (right!)
    rect('#9c2b26', 548, 250, 128, 106);
    shape('M548 250 H676 V356 H548Z', null, ink, 2.6);
    rect('#f2e2ba', 558, 274, 108, 44);
    label('12 GA', 612, 304, 22, '#7a1919');
    // 6 bright red 12-gauge shells protruding from open box top!
    for (let i = 0; i < 6; i++) {
      drawRedShell(564 + i * 19, 232, -90, 0.88);
    }

    // Flashlight cone highlight
    const spot = ctx.createRadialGradient(mix(380, 580, p), 280, 24, 480, 280, 290);
    spot.addColorStop(0, 'rgba(255, 244, 198, 0.34)');
    spot.addColorStop(1, 'rgba(255, 244, 198, 0)');
    rect(spot, 0, 0, W, H);
    shape('M640 0 L740 0 L610 540 L510 540Z', 'rgba(208, 234, 255, 0.10)');

    ctx.restore();
  }

  // =========================================================================
  // SHOT 12 (f686..748): Tactile Pegboard Grab — Steel Pry-Bar (torn right cuff!)
  // =========================================================================
  function drawShot12PryBarGrab(frame) {
    const reach = tween(frame, 686, 706);
    const snatch = tween(frame, 708, 742);

    // Gunsmith tool pegboard wall
    rect('#1b1917', 0, 0, W, H);
    rect('#2b241d', 40, 30, 880, 480);
    shape('M40 30 H920 V510 H40Z', null, ink, 3.6);
    // Pegboard holes grid
    for (let py = 66; py < 490; py += 36) {
      for (let px = 76; px < 900; px += 40) {
        oval(px, py, 2.8, 2.8, '#0f0c0a');
      }
    }
    // Background hanging wrenches & files
    shape('M170 96 V290 M158 96 Q170 76 182 96', null, '#4d5b68', 14);
    shape('M244 116 V310', null, '#5a6874', 10);
    shape('M740 100 V320', null, '#485662', 12);
    // Two steel peg hooks where pry-bar hangs
    shape('M380 264 H406 M574 264 H600', null, '#94a4b2', 5.0);

    // Warm flashlight spill
    const spot = ctx.createRadialGradient(480, 260, 20, 480, 260, 340);
    spot.addColorStop(0, 'rgba(255, 238, 184, 0.30)');
    spot.addColorStop(1, 'rgba(255, 238, 184, 0)');
    rect(spot, 0, 0, W, H);

    // Steel pry-bar position: resting on hooks until f706, then snatched cleanly with hand!
    const handX = mix(640, 484, reach) + mix(0, 126, snatch);
    const handY = mix(496, 266, reach) + mix(0, 84, snatch);
    const handRot = mix(24, 6, reach) + mix(0, -18, snatch);

    if (frame < 706) {
      ctx.save();
      ctx.translate(486, 262);
      ctx.scale(1.48, 1.48);
      drawSteelPryBar(-1);
      ctx.restore();
      drawStudioCylinderGrip(() => {}, handX, handY, handRot, 1.88, { shredded: true, leatherGlove: false, extendLen: 260 });
    } else {
      drawStudioCylinderGrip(() => {
        ctx.save();
        ctx.translate(126, 124);
        ctx.scale(0.80, 0.80);
        drawSteelPryBar(tween(frame, 708, 738));
        ctx.restore();
      }, handX, handY, handRot, 1.88, { shredded: true, leatherGlove: false, extendLen: 260 });
    }
  }

  // =========================================================================
  // SHOT 13 (f749..820): Close-Up Brass Lock Pry & Snap (f792 SNAP! + glass door slides open)
  // =========================================================================
  function drawShot13LockPrySnap(frame) {
    const strain = tween(frame, 749, 791);
    const snapped = frame >= 792;
    const flyP = tween(frame, 792, 818);
    const slideP = tween(frame, 798, 820);
    const shake = (frame >= 792 && frame <= 800) ? Math.sin((frame - 792) * 4.8) * 10 * (1 - (frame - 792) / 8) : (frame < 792 ? Math.sin(frame * 3.4) * 2.2 * strain : 0);

    ctx.save();
    ctx.translate(shake, shake * 0.45);

    // Close-up of glass display case & metal frame
    rect('#151d26', -20, -20, W + 40, H + 40);
    rect('#291619', 80, 96, 800, 380);

    // Sliding glass door moving open left -> right after lock pops!
    const doorOff = mix(0, 290, slideP);
    rect('rgba(164, 210, 242, 0.16)', 80 + doorOff, 96, 800, 380);
    shape(`M${80 + doorOff} 96 H${880 + doorOff} V476 H${80 + doorOff}Z`, null, '#6e8496', 5.0);
    shape(`M${200 + doorOff} 96 L${310 + doorOff} 96 L${210 + doorOff} 476 L${100 + doorOff} 476Z`, 'rgba(220, 242, 255, 0.16)');

    // Fixed steel lock hasp at center-top
    rect('#6d7b87', 416, 86, 128, 48);
    shape('M416 86 H544 V134 H416Z', null, ink, 3.0);

    // Brass padlock: straining -> SNAPS CLEAN OFF at f792 and tumbles lower-right!
    ctx.save();
    const lockX = snapped ? mix(480, 690, flyP) : 480;
    const lockY = snapped ? mix(194, 496, flyP) - Math.sin(flyP * Math.PI) * 52 : 194;
    ctx.translate(lockX, lockY);
    ctx.rotate(snapped ? flyP * 5.2 : mix(0, -0.14, strain));
    // Shackle (snapped open after f792)
    shape(snapped ? 'M-22 -44 V-66 Q0 -88 26 -62' : 'M-22 -40 V-64 Q0 -86 22 -64 V-40', null, '#b5c2ce', 9.0);
    // Brass body
    rect('#c79f40', -38, -42, 76, 84);
    shape('M-38 -42 H38 V42 H-38Z', null, ink, 3.2);
    rect('#ebca6e', -32, -36, 14, 72);
    oval(0, 0, 9, 11, '#2b2010');
    ctx.restore();

    // Steel pry-bar wedged into shackle & torquing sharply with torn-cuff hand extending off lower-left!
    const barAngle = snapped ? mix(-26, -42, tween(frame, 792, 808)) : mix(-10, -26, strain);
    drawStudioCylinderGrip(() => {
      ctx.save();
      ctx.translate(184, 124);
      ctx.scale(1.42, 1.42);
      drawSteelPryBar(snapped ? tween(frame, 792, 812) : -1);
      ctx.restore();
    }, mix(276, 254, strain), mix(332, 304, strain), barAngle, 1.88, { shredded: true, leatherGlove: false, extendLen: 260 });

    // Bright metallic SNAP! burst & star glint at f792..804
    if (frame >= 792 && frame <= 806) {
      const sp = (frame - 792) / 14;
      starGlint(480, 146, (1 - sp) * 48, '#fffbe0ff');
      shape(`M444 124 L${412 - sp * 34} ${94 - sp * 24} M516 124 L${548 + sp * 34} ${94 - sp * 24}`, null, `rgba(255, 232, 146, ${1 - sp})`, 3.6);
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 14 (f821..882): SUDDEN SUSPENSE FREEZE — Outer Steel Shutter Vibrates (f830)
  // =========================================================================
  function drawShot14SuspenseFreeze(frame) {
    const alarm = frame >= 830;
    const dip = tween(frame, 830, 844);
    const vib = (frame >= 830 && frame <= 848) ? Math.sin((frame - 830) * 5.2) * 5.5 * (1 - (frame - 830) / 18) : 0;
    const zoom = mix(1.0, 1.09, tween(frame, 830, 882));

    ctx.save();
    ctx.translate(480 + vib, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    drawWorkshopInterior(240, 0.45, mix(0.45, 0.0, dip));

    // Backpack silhouette behind torso
    shape('M332 372 Q480 344 628 372 L646 548 H314Z', '#1b2420', ink, 2.8);

    window.drawAnatomyTurnaround(ctx, 480, 1450, 3.02, 'front', {
      hideLimbs: false,
      expression: alarm ? 'head-alarm' : 'head-notice',
      headPitch: alarm ? -0.10 : 0.04,
      eyeOffset: [alarm ? -3.6 : 0, alarm ? -1.4 : 0],
      sweat: alarm ? 0.35 + tween(frame, 834, 876) * 0.65 : 0.15,
    });
    drawFrontNeckBurn(480, 290, 1.12, 0.90);
    shape('M356 392 L374 550 H416 L396 384Z M604 392 L586 550 H544 L564 384Z', '#1f2924', ink, 3.0);

    // Room plunges abruptly into cold moonlight as flashlight dips to floor!
    shape('M0 0 H960 V540 H0Z', `rgba(3, 8, 15, ${mix(0.24, 0.56, dip)})`);
    shape('M310 60 L580 60 L530 310 L270 310Z', 'rgba(136, 182, 232, 0.14)');

    // Sharp metallic scrape vibration arcs from front shutter upper-left at f830..848!
    if (frame >= 830 && frame <= 850) {
      const a = 1 - (frame - 830) / 20;
      shape('M110 92 Q150 130 118 176 M146 76 Q192 130 156 190', null, `rgba(255, 224, 142, ${a})`, 3.6);
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 15 (f883..945): POV Frosted Front Transom Glass — Articulated Infected Silhouette Passing!
  // =========================================================================
  function drawShot15FrostedGlassShadow(frame) {
    const zoom = mix(1.0, 1.06, tween(frame, 883, 945));
    // Moves left -> center (883..906), pauses scraping glass (906..922), shambles off right (922..945)
    let sx;
    if (frame < 906) sx = mix(160, 476, tween(frame, 883, 906));
    else if (frame < 922) sx = 476 + Math.sin((frame - 906) * 0.7) * 4;
    else sx = mix(476, 870, tween(frame, 922, 945));
    const shambleBob = (frame >= 906 && frame < 922) ? Math.sin(frame * 0.3) * 3 : Math.abs(Math.sin(frame * 0.38)) * 9;

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Dark interior steel shutter wall framing high frosted transom window
    rect('#0b1017', 0, 0, W, H);
    // Corrugated steel shutter below window
    rect('#1a222b', 0, 384, W, 156);
    for (let cy = 404; cy < 540; cy += 22) {
      shape(`M0 ${cy} H960`, null, '#0f151c', 3.0);
    }

    // Cold moonlit frosted glass transom pane
    const glass = ctx.createLinearGradient(0, 60, 0, 376);
    glass.addColorStop(0, '#1e354d');
    glass.addColorStop(0.5, '#335474');
    glass.addColorStop(1, '#243c54');
    rect(glass, 74, 62, 812, 314);

    // Articulated hunched infected silhouette OUTSIDE frosted glass (clipped to window!)
    ctx.save();
    ctx.beginPath();
    ctx.rect(74, 62, 812, 314);
    ctx.clip();

    ctx.save();
    ctx.translate(sx, 266 + shambleBob);
    // Hunched articulated spine/ribs, drooping head/neck, bent elbow & clawed arm dragging along glass!
    const scrapeY = (frame >= 906 && frame < 922) ? mix(-22, 36, (frame - 906) / 16) : 12;
    // Far trailing shoulder & bent arm
    shape('M-26 -58 Q-64 -28 -78 24 L-58 34 Q-44 -10 -12 -38Z', 'rgba(8, 13, 20, 0.72)');
    // Hunched curved torso & ribcage
    shape('M-46 -64 Q-16 -108 34 -94 Q74 -78 62 -16 L46 116 H-56 Q-62 20 -46 -64Z', 'rgba(7, 12, 18, 0.86)');
    // Forward-jutting neck & twitching head
    shape('M26 -96 Q62 -104 82 -74 Q88 -44 58 -36 Q28 -44 26 -96Z', 'rgba(6, 10, 16, 0.90)');
    // Near bent arm (upper arm -> elbow -> forearm -> splayed claws pressed against frosted glass!)
    shape(`M18 -56 Q62 -46 96 ${scrapeY - 22} L114 ${scrapeY + 18} L94 ${scrapeY + 26} L74 ${scrapeY - 6} Q46 -22 6 -34Z`, 'rgba(7, 12, 18, 0.86)');
    shape(`M110 ${scrapeY + 16} L128 ${scrapeY + 28} M106 ${scrapeY + 22} L118 ${scrapeY + 40} M96 ${scrapeY + 24} L102 ${scrapeY + 42}`, null, 'rgba(6, 10, 16, 0.88)', 4.5);
    ctx.restore();

    // Frosted glass mist haze & diagonal wire-mesh reinforcement grid OVER shadow
    rect('rgba(162, 204, 240, 0.16)', 74, 62, 812, 314);
    for (let gx = 40; gx < 960; gx += 44) {
      shape(`M${gx} 62 L${gx + 90} 376 M${gx + 90} 62 L${gx} 376`, null, 'rgba(18, 28, 38, 0.34)', 1.2);
    }
    ctx.restore();

    // Heavy steel window mullions & frame
    shape('M74 62 H886 V376 H74Z', null, '#10161d', 10);
    shape('M344 62 V376 M616 62 V376', null, '#10161d', 7);

    ctx.restore();
  }

  // =========================================================================
  // SHOT 16 (f946..1017): POV Shotgun Lift & Weight Check (pov-pipe-grip + torn right wrap!)
  // =========================================================================
  function drawShot16ShotgunLift(frame) {
    const lift = tween(frame, 946, 988);
    const zoom = mix(1.0, 1.12, tween(frame, 946, 1017));
    const sway = Math.sin((frame - 946) * 0.14) * 3.5;

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    drawWorkshopInterior(320, 0.25, 0.42);
    // Open glass display case receding below
    rect('#221417', 110, 360, 740, 180);
    shape('M110 360 H850', null, '#63788a', 4.0);

    // Matte-black 12-gauge pump shotgun lifting smoothly into horizontal tactical weight check!
    const gy = mix(382, 266, lift) + sway;
    const gRot = mix(8, -4, lift);

    ctx.save();
    ctx.translate(474, gy);
    ctx.rotate(gRot * Math.PI / 180);

    // Left hand (intact cardboard cuff extending off bottom-left) supporting ribbed pump forend!
    drawStudioCylinderGrip(() => {}, -126, 20, -14, 1.38, { shredded: false, leatherGlove: false, extendLen: 260 });

    // Hero pump shotgun
    ctx.save();
    ctx.scale(-1.56, 1.56); // Muzzle pointing upper-left!
    drawPumpShotgun({ pumpOffset: 0, glintT: tween(frame, 968, 1010) });
    ctx.restore();

    // Right hand using official drawPovSurvivalHand('pov-pipe-grip') overlaid with unified shredded right cuff!
    ctx.save();
    ctx.translate(154, 48);
    ctx.rotate(0.28);
    ctx.scale(1.24, 1.24);
    ctx.translate(-176, -216);
    window.drawPovSurvivalHand(ctx, 'pov-pipe-grip');
    ctx.save();
    ctx.translate(176, 216);
    ctx.rotate(148 * Math.PI / 180);
    ctx.scale(1.10, 1.10);
    ctx.translate(-126, -124);
    ctx.translate(118, 66);
    ctx.rotate(Math.PI);
    ctx.scale(0.84, 1.0);
    drawUnifiedArmoredCuff(230, true, false);
    ctx.restore();
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }

  // =========================================================================
  // SHOT 17 (f1018..1108): Rhythmic Macro Insert — Thumb-Loading 6 Red Shells!
  // =========================================================================
  function drawShot17ShellLoading(frame) {
    // 4 rhythmic thumb-loading beats: f1032, f1051, f1070, f1090
    const beats = [1032, 1051, 1070, 1090];
    let activeBeat = 0;
    for (let i = 0; i < beats.length; i++) {
      if (frame >= beats[i] - 10) activeBeat = i;
    }
    const beatF = beats[activeBeat];
    const pushP = tween(frame, beatF - 10, beatF + 3);
    const retractP = tween(frame, beatF + 4, beatF + 14);
    const shellPush = pushP * (1 - retractP * 0.85);
    const clickJolt = (frame >= beatF && frame <= beatF + 3) ? Math.sin((frame - beatF) * 4.5) * 4.5 : 0;

    ctx.save();
    ctx.translate(clickJolt, clickJolt * 0.5);

    // Dark workshop bench bokeh backdrop
    rect('#0e141b', -20, -20, W + 40, H + 40);
    rect('#292019', 0, 412, W, 130);
    shape('M0 412 H960', null, ink, 3.0);

    // Vintage cardboard shell box sitting on bench lower-left — visibly emptying shell by shell!
    const shellsLeft = Math.max(0, 4 - activeBeat - (frame >= beatF ? 1 : 0));
    rect('#9c2b26', 84, 370, 152, 114);
    shape('M84 370 H236 V484 H84Z', null, ink, 2.8);
    rect('#f2e2ba', 98, 404, 124, 46);
    label('12 GA', 160, 436, 22, '#7a1919');
    for (let s = 0; s < shellsLeft; s++) {
      drawRedShell(112 + s * 28, 352, -90, 1.05);
    }

    // MACRO recognizable matte-black pump shotgun tilted upside-down/angled across upper-center!
    ctx.save();
    ctx.translate(454, 198);
    ctx.rotate(-0.07);
    // Dark polymer stock wrist extending off left edge
    shape('M-470 -56 L-246 -42 V36 L-470 84Z', '#1b2128', ink, 3.4);
    shape('M-460 -46 L-252 -34 V-12 L-460 -18Z', '#2d3742');
    // Trigger guard & trigger behind loading port
    shape('M-228 46 Q-204 102 -136 88 L-126 46Z', null, '#222b34', 9.0);
    shape('M-228 46 Q-204 102 -136 88 L-126 46Z', null, ink, 2.6);
    shape('M-182 48 Q-188 72 -172 78', null, '#556575', 5.0);
    // Contoured matte-black steel receiver body
    shape('M-248 -58 H216 Q226 -58 226 -46 V46 Q226 56 214 56 H-248Z', '#222a32', ink, 3.6);
    shape('M-244 -52 H214 V-32 H-244Z', '#3e4c5a');
    // Trigger pins & receiver contour line
    oval(-176, 16, 5, 5, '#4c5b6a', ink, 1.4);
    oval(-86, 16, 4.5, 4.5, '#4c5b6a', ink, 1.4);
    // Underside/side recessed loading port with gleaming silver spring-loaded carrier flap!
    shape('M-84 8 H118 V54 H-84Z', '#0f141a', ink, 3.2);
    shape(`M-78 ${16 + shellPush * 14} H110 V32 H-78Z`, '#90a0ad', ink, 2.0);
    // Barrel & ribbed pump forend extending cleanly off right edge!
    rect('#26303a', 226, -48, 300, 32);
    shape('M226 -48 H526 V-16 H226Z', null, ink, 3.2);
    rect('#495868', 226, -44, 300, 8);
    // Magazine tube & ribbed pump forend below barrel
    rect('#1a222a', 226, -12, 300, 34);
    shape('M226 -12 H526 V22 H226Z', null, ink, 3.0);
    shape('M298 -18 H478 Q490 -18 490 6 Q490 30 478 30 H298 Q286 30 286 6 Q286 -18 298 -18Z', '#192028', ink, 3.2);
    for (let rx = 314; rx <= 462; rx += 16) {
      shape(`M${rx} -14 V26`, null, '#34414f', 3.0);
    }
    ctx.restore();

    // Studio SVG #ticket-pinch hand (exact anatomy from art.js / hands/reference-sheet.png!)
    // pinching the bright red 12-gauge shell cleanly between thumb & index finger and feeding it into the loading port!
    ctx.save();
    const hx = mix(348, 396, shellPush);
    const hy = mix(382, 294, shellPush);
    ctx.translate(hx, hy);
    ctx.rotate(mix(0.08, -0.06, shellPush));
    ctx.scale(1.62, 1.62);
    ctx.translate(-122, -124);

    // 1. Unified shredded cardboard forearm locked directly below the studio cream cuff pointing DOWN-LEFT!
    ctx.save();
    ctx.translate(48, 174);
    ctx.rotate(42 * Math.PI / 180);
    ctx.scale(0.84, 0.86);
    drawUnifiedArmoredCuff(260, true, false);
    ctx.restore();

    // 2. Far fingers curled cleanly below (exact art.js #ticket-pinch SVG paths!)
    shape('M91 147 Q101 147 111 140 C117 146 113 158 105 162 Q97 166 88 161Z', '#c78c73', ink, 1.7);
    shape('M108 126 Q116 117 125 121 Q127 131 126 140 L121 153 Q117 160 111 157 Q106 155 107 148 L110 136Z', '#ce9479', ink, 1.7);
    shape('M120 108 Q133 102 142 110 Q147 116 145 125 L143 145 Q142 153 137 154 Q131 153 130 148 L129 131 Q126 126 119 126Z', '#dba382', ink, 1.8);

    // 3. Dorsal hand & arched index finger guiding the upper side of the red 12-gauge shell!
    shape('M40 165 Q61 148 72 132 L84 116 C90 106 96 101 106 100 L126 96 Q135 94 140 97 Q146 101 143 107 L130 118 Q123 124 113 129 Q110 144 102 155 C95 169 79 176 58 184Z', '#e7ae87', ink, 2.2);
    shape('M41 165 Q61 148 72 132 Q82 119 87 113 Q93 107 101 105 Q90 117 85 132 Q76 149 64 157 L50 173Z', '#c88e72');
    shape('M100 106 Q98 110 100 114 M119 99 Q116 102 118 106 M134 134 L140 134 M111 146 L117 148', null, '#9e6755', 1.5);

    // 4. Bright red brass-headed 12-gauge shotgun shell sandwiched cleanly between index finger & thumb!
    drawRedShell(160, 100, -14, 1.18);

    // 5. Opposing thumb pressing cleanly onto the near side of the brass base + fingernail & creases!
    shape('M87 144 Q97 138 108 127 L123 112 Q129 105 134 103 Q142 99 146 105 Q150 110 145 116 L133 128 L118 144 Q111 154 100 159', '#e7ae87', ink, 2.0);
    shape('M99 155 Q108 148 116 138 L138 115 Q144 110 146 108 Q148 113 143 117 L130 130 L117 144 Q108 155 101 157Z', '#c88e72');
    shape('M134 106 Q139 103 143 106 Q145 109 142 112 L137 116 Q133 115 131 111Z', '#f1c2a8', '#b98573', 0.85);
    shape('M119 120 Q120 124 124 126 M114 124 Q116 128 119 130 M93 145 Q96 147 97 151', null, '#9e6755', 1.5);

    // 6. Clean cream shirt cuff joining wrist seamlessly to the shredded cardboard wrap
    ctx.save();
    ctx.translate(48, 174);
    ctx.rotate(42 * Math.PI / 180);
    shape('M-22 -14 H22 L28 16 H-28Z', '#ebe2ce', ink, 2.0);
    oval(14, -2, 3.2, 3.2, '#d4cab4', ink, 1.0);
    ctx.restore();

    ctx.restore();

    // Crisp click star glint when shell locks into tube!
    if (frame >= beatF && frame <= beatF + 7) {
      starGlint(446, 224, (1 - (frame - beatF) / 7) * 28, '#fff7c8ee');
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 18 (f1109..1175): Rhythmic Tactile Insert — 9mm Mag Slap (f1133) & Belt Tuck
  // =========================================================================
  function drawShot18PistolMagSlap(frame) {
    const slapP = tween(frame, 1109, 1133);
    const tuckP = tween(frame, 1144, 1173);
    const jolt = (frame >= 1133 && frame <= 1139) ? Math.sin((frame - 1133) * 4.5) * 8 * (1 - (frame - 1133) / 6) : 0;

    ctx.save();
    ctx.translate(jolt * 0.4, -jolt);

    drawWorkshopInterior(340, 0.2, 0.36);

    // Belt & dark trousers rising into lower frame during belt-tuck phase (f1144..1175)
    const beltY = mix(580, 398, tuckP);
    rect('#1f2830', 0, beltY, W, 240);
    rect('#3a2719', 0, beltY, W, 38);
    shape(`M0 ${beltY} H960 M0 ${beltY + 38} H960`, null, ink, 3.0);
    // Steel belt buckle left
    rect('#7c8a96', 250, beltY - 4, 52, 46);
    shape(`M250 ${beltY - 4} H302 V${beltY + 42} H250Z`, null, ink, 2.4);
    // Spare magazine tucked neatly at belt right
    if (tuckP > 0.2) {
      rect('#35404a', 606, beltY - 14, 28, 62);
      shape(`M606 ${beltY - 14} H634 V${beltY + 48} H606Z`, null, ink, 2.2);
    }

    // Compact 9mm pistol + slapping steel magazine
    const gunX = mix(466, 488, tuckP);
    const gunY = mix(228, beltY + 10, tuckP);
    const gunRot = mix(-14, 72, tuckP);
    const magOffset = mix(118, 0, slapP);

    ctx.save();
    ctx.translate(gunX, gunY);
    ctx.rotate(gunRot * Math.PI / 180);
    ctx.scale(2.15, 2.15);
    drawCompact9mm(magOffset, frame >= 1133 ? tween(frame, 1133, 1152) : -1);
    ctx.restore();

    // Right palm (torn cardboard cuff extending off bottom-right) slapping magazine base UP into grip!
    if (frame < 1154) {
      const palmX = mix(424, 412, slapP) + mix(0, 140, tween(frame, 1138, 1154));
      const palmY = mix(492, 378, slapP) + mix(0, 140, tween(frame, 1138, 1154));
      drawStudioPalmPress(palmX, palmY, -24, 1.54, true, 240, false);
    }

    // Crisp CLACK! star glint at f1133..1142
    if (frame >= 1133 && frame <= 1143) {
      starGlint(404, 344, (1 - (frame - 1133) / 10) * 34, '#fffbe0ee');
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 19 (f1176..1242): Macro Damage Check — Shredded Hunter-Bite Cardboard on Right Forearm
  // =========================================================================
  function drawShot19ShreddedDamageCheck(frame) {
    const p = tween(frame, 1176, 1242);
    const zoom = mix(1.0, 1.11, p);
    const tilt = Math.sin(p * Math.PI) * 5;

    rect('#090e14', 0, 0, W, H);
    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Warm flashlight pool illuminating the shredded right forearm!
    const spot = ctx.createRadialGradient(480, 286, 24, 480, 286, 330);
    spot.addColorStop(0, 'rgba(255, 238, 184, 0.36)');
    spot.addColorStop(1, 'rgba(255, 238, 184, 0)');
    rect(spot, 0, 0, W, H);

    // Official studio hand + unified SHREDDED right forearm extending cleanly off right frame edge!
    drawStudioPalmPress(236, 308, -98 + tilt, 2.04, true, 400, false);

    // Warm edge glint catching torn gray duct-tape strips
    shape('M392 194 L436 144 M592 184 L636 138', null, 'rgba(255, 242, 198, 0.32)', 2.2);

    ctx.restore();
  }

  // =========================================================================
  // SHOT 20 (f1243..1319): Armor Upgrade Insert — Strapping Heavy Dark Brown Leather Work Gloves!
  // =========================================================================
  function drawShot20LeatherGloveUpgrade(frame) {
    const pullP = tween(frame, 1243, 1280);
    const cinchP = tween(frame, 1280, 1304);
    const clenchP = tween(frame, 1304, 1319);
    const cinchJolt = (frame >= 1291 && frame <= 1296) ? Math.sin((frame - 1291) * 4.5) * 4 : 0;

    ctx.save();
    ctx.translate(cinchJolt, cinchJolt * 0.4);

    // Warm-lit gunsmith wooden workbench surface
    rect('#1a1410', -20, -20, W + 40, H + 40);
    rect('#33251b', -20, 120, W + 40, 440);
    for (let wy = 160; wy < 540; wy += 52) {
      shape(`M-20 ${wy} H980`, null, '#241a12', 2.0);
    }
    const spot = ctx.createRadialGradient(480, 290, 24, 480, 290, 380);
    spot.addColorStop(0, 'rgba(255, 234, 178, 0.34)');
    spot.addColorStop(1, 'rgba(255, 234, 178, 0)');
    rect(spot, 0, 0, W, H);

    // Right forearm horizontal across center-right (extending cleanly past right frame edge!)
    ctx.save();
    ctx.translate(456, 296);
    ctx.rotate(-0.08 + clenchP * 0.06);

    // Shredded corrugated cardboard forearm extending off right edge (visible under leather gauntlet!)
    ctx.save();
    ctx.translate(80, 0);
    ctx.rotate(-Math.PI / 2);
    ctx.scale(1.85, 1.85);
    drawUnifiedArmoredCuff(280, true, false);
    ctx.restore();

    // Heavy dark brown leather work glove sliding smoothly onto right hand & over torn wrist cuff!
    const gloveSlide = mix(-140, 0, pullP);
    ctx.save();
    ctx.translate(gloveSlide, 0);
    // Leather gauntlet cuff overlapping shredded cardboard seam
    shape('M12 -64 L138 -72 L144 72 L12 64Z', '#4a2e1d', ink, 3.2);
    shape('M24 -54 L126 -60 L130 60 L24 54Z', '#5e3b25');
    // Stitched dark leather hand & curling fingers (clenching into fist at f1304!)
    const curl = clenchP * 24;
    shape(`M-158 ${-42 + curl * 0.4} Q-128 -68 -56 -64 L20 -60 V60 L-68 ${64 - curl * 0.3} Q-148 ${56 - curl * 0.5} -162 ${12}Z`, '#523421', ink, 3.4);
    shape('M-136 -38 Q-76 -48 -14 -40 L-14 38 Q-84 44 -136 22Z', '#69442d');
    // Knuckle pad & finger stitching
    shape('M-84 -52 V50 M-118 -44 V38', null, '#2e1b10', 2.4);
    shape('M-24 -56 V56', null, '#946b48', 1.8);
    // Thumb wrapping over bottom
    shape('M-86 42 Q-38 78 24 58 Q36 28 -14 22 Q-64 20 -86 42Z', '#4d301e', ink, 3.0);

    // Heavy leather wrist strap + brass buckle cinching tight over the torn cardboard cuff!
    const strapTight = mix(22, 0, cinchP);
    shape(`M48 ${-70 - strapTight * 0.4} H92 V${70 + strapTight * 0.4} H48Z`, '#331e12', ink, 2.8);
    rect('#c79f40', 54, -22, 32, 38);
    shape('M54 -22 H86 V16 H54Z', null, ink, 2.2);
    rect('#331e12', 62, -12, 16, 18);
    ctx.restore();

    ctx.restore();

    // Left leather-gloved hand reaching in from bottom-left to pull & cinch the wrist strap tight!
    if (frame >= 1264 && frame <= 1314) {
      const lx = mix(220, 520, tween(frame, 1264, 1288)) - mix(0, 60, cinchP);
      const ly = mix(510, 356, tween(frame, 1264, 1288)) + mix(0, 46, cinchP);
      drawStudioCylinderGrip(() => {}, lx, ly, -38, 1.44, { shredded: false, leatherGlove: true, extendLen: 240 });
    }

    // Crisp buckle cinch glint at f1291..1302
    if (frame >= 1291 && frame <= 1303) {
      starGlint(524, 290, (1 - (frame - 1291) / 12) * 32, '#fff7c8ee');
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 22 (f1402..1473): Tight Front Bust — The Silence Rule (head-dread -> head-determined)
  // =========================================================================
  function drawShot22SilenceRule(frame) {
    const det = frame >= 1434;
    const shift = tween(frame, 1428, 1456);
    const zoom = mix(1.0, 1.08, tween(frame, 1402, 1473));

    drawWorkshopInterior(360, 0.35, 0.36);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Backpack silhouette BEHIND torso
    shape('M332 372 Q480 344 628 372 L646 548 H314Z', '#222d28', ink, 2.8);

    window.drawAnatomyTurnaround(ctx, 480, 1444, 2.98, 'front', {
      hideLimbs: false,
      expression: det ? 'head-determined' : 'head-dread',
      headPitch: mix(0.08, -0.06, shift),
      eyeOffset: [mix(-1.8, 0, shift), mix(0.6, -0.2, shift)],
      sweat: 0.22,
    });
    drawFrontNeckBurn(480, 288, 1.10, 0.88);
    shape('M356 392 L374 550 H416 L396 384Z M604 392 L586 550 H544 L564 384Z', '#24302a', ink, 3.0);

    // Foreground lower-center: dark brown leather-gloved grip lowering matte-black shotgun barrel thoughtfully!
    ctx.save();
    ctx.translate(474, mix(466, 496, shift));
    ctx.rotate(mix(-0.12, 0.08, shift));
    ctx.scale(1.18, 1.18);
    drawPumpShotgun({ pumpOffset: 0, glintT: -1 });
    // Dark brown leather-gloved fingers curled firmly over forend & grip
    oval(118, 6, 22, 18, '#4d301e', ink, 2.4);
    oval(-68, 8, 22, 18, '#4d301e', ink, 2.4);
    ctx.restore();

    ctx.restore();
  }

  // =========================================================================
  // SHOT 23 (f1474..1535): Overhead Bench Insert — Battery 4% -> 3% & Flashlight OFF (f1502)
  // =========================================================================
  function drawShot23BatteryThreePercent(frame) {
    const tick3 = frame >= 1492;
    const off = frame >= 1502;
    const tapP = tween(frame, 1484, 1502);
    const pullBack = tween(frame, 1504, 1528);
    const zoom = mix(1.0, 1.07, tween(frame, 1474, 1535));

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Overhead dark gunsmith wooden workbench surface
    rect(off ? '#121822' : '#2b2017', 0, 0, W, H);
    for (let wy = 48; wy < H; wy += 64) {
      shape(`M0 ${wy} H960`, null, off ? '#0b1018' : '#1e150f', 2.2);
    }

    // Warm overhead flashlight spill until f1502, then cool midnight moonlight!
    if (!off) {
      const wg = ctx.createRadialGradient(480, 270, 30, 480, 270, 460);
      wg.addColorStop(0, 'rgba(255, 236, 178, 0.34)');
      wg.addColorStop(1, 'rgba(255, 236, 178, 0)');
      rect(wg, 0, 0, W, H);
    } else {
      shape('M220 0 L680 0 L790 540 L140 540Z', 'rgba(130, 178, 232, 0.14)');
    }

    // Cracked smartphone lying flat on workbench
    ctx.save();
    ctx.translate(456, 266);
    ctx.rotate(-0.08);
    shape('M-94 -168 H94 Q108 -168 108 -154 V154 Q108 168 94 168 H-94 Q-108 168 -108 154 V-154 Q-108 -168 -94 -168Z', '#1b222a', ink, 3.6);
    rect(off ? '#0c1826' : '#143354', -92, -144, 184, 288);
    label('00:44', 0, -76, 40, off ? '#94b8db' : '#e6f4ff');
    // Red battery bar ticking 4% -> 3%
    shape('M-54 -22 H44 V30 H-54Z', '#101822', '#ff4d48', 3.4);
    rect('#ff4d48', 44, -8, 10, 24);
    rect('#ff3b36', -46, -14, tick3 ? 11 : 16, 36);
    label(tick3 ? '3% BATTERY' : '4% BATTERY', 0, 68, 20, '#ff6862');
    // Flashlight toggle button
    oval(0, 108, 20, 20, off ? '#1c2b3a' : '#f7d86a', '#9ed0ff', 2.2);
    label(off ? 'OFF' : 'ON', 0, 114, 12, off ? '#8ca8c4' : '#18222c');
    // Hairline glass cracks
    shape('M-92 -108 L-22 -54 L46 -130 M-22 -54 L18 32 L92 74', null, 'rgba(218, 238, 255, 0.48)', 1.8);
    ctx.restore();

    // Dark brown leather-gloved right thumb & hand reaching in from bottom-right to tap OFF!
    const hx = mix(648, 534, tapP) + mix(0, 96, pullBack);
    const hy = mix(466, 398, tapP) + mix(0, 74, pullBack);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-0.42);
    // Unified leather gauntlet + cinched strap + torn cardboard extending off bottom-right!
    ctx.save();
    ctx.translate(106, 104);
    ctx.rotate(-0.82);
    ctx.scale(1.56, 1.56);
    drawUnifiedArmoredCuff(240, true, true);
    ctx.restore();
    // Leather-gloved hand & extended thumb tapping screen icon
    shape('M-64 -16 Q-22 -42 36 -20 L92 34 Q82 88 22 92 L-48 44Z', '#4a2e1d', ink, 2.8);
    shape('M-94 -22 Q-52 -42 6 -24 Q24 -6 10 14 Q-38 22 -94 -22Z', '#5c3a24', ink, 2.8);
    shape('M-62 -24 Q-34 -32 -8 -20', null, '#8f6544', 1.6);
    ctx.restore();

    ctx.restore();
  }

  // =========================================================================
  // SHOT 24 (f1536..1602): Studio POV Rear Deadbolt Unlock (pov-door-lock + Leather Glove!) -> 00:45 AM
  // =========================================================================
  function drawShot24RearDeadboltUnlock(frame) {
    const turnP = tween(frame, 1542, 1564);
    const openP = tween(frame, 1566, 1600);

    // Cold blue drifting midnight fog visible outside as rear steel door eases open!
    drawMidnightFogAlley(frame, 120, { showBeacon: false, fogStrength: 1.0 });

    // Interior rear wall & steel doorframe on right
    rect('#151c24', 736, 0, 224, H);
    shape('M736 0 V540', null, ink, 5.0);

    // Heavy gray steel rear exit door easing left/open to reveal midnight fog slit!
    const doorRightX = mix(736, 486, openP);
    rect('#2a343f', -40, 0, doorRightX + 40, H);
    rect('#34414f', -20, 44, doorRightX - 44, 196);
    rect('#34414f', -20, 286, doorRightX - 44, 210);
    shape(`M${doorRightX} 0 V540`, null, ink, 4.4);
    // Steel deadbolt bar retracting left into door
    const boltX = mix(doorRightX - 18, doorRightX - 66, turnP);
    rect('#8d9aa6', boltX, 234, 52, 32);
    shape(`M${boltX} 234 H${boltX + 52} V266 H${boltX}Z`, null, ink, 2.4);

    // Official studio POV drawPovSurvivalHand('pov-door-lock') overlaid with DARK BROWN LEATHER GLOVE & WRIST STRAP!
    ctx.save();
    ctx.translate(doorRightX - 244, 294);
    ctx.rotate(mix(0.24, -0.26, turnP));
    ctx.scale(2.12, 2.12);
    ctx.translate(-170, -178);
    window.drawPovSurvivalHand(ctx, 'pov-door-lock');
    // Unified dark brown leather work glove overlay locked directly onto the exact #ticket-pinch coordinates!
    ctx.save();
    ctx.translate(170, 178);
    ctx.scale(1.32, 1.32);
    ctx.translate(-122, -124);
    shape('M91 147 Q101 147 111 140 C117 146 113 158 105 162 Q97 166 88 161Z', '#3b2416', ink, 1.7);
    shape('M108 126 Q116 117 125 121 Q127 131 126 140 L121 153 Q117 160 111 157 Q106 155 107 148 L110 136Z', '#42291a', ink, 1.7);
    shape('M120 108 Q133 102 142 110 Q147 116 145 125 L143 145 Q142 153 137 154 Q131 153 130 148 L129 131 Q126 126 119 126Z', '#4a2e1d', ink, 1.8);
    shape('M40 165 Q61 148 72 132 L84 116 C90 106 96 101 106 100 L126 96 Q135 94 140 97 Q146 101 143 107 L130 118 Q123 124 113 129 Q110 144 102 155 C95 169 79 176 58 184Z', '#523421', ink, 2.4);
    // Re-draw metallic deadbolt thumb-turn lever sandwiched cleanly between leather-gloved index & thumb!
    ctx.save();
    ctx.translate(168, 98);
    ctx.rotate(-16 * Math.PI / 180);
    shape('M-32 -9 H32 Q40 0 32 9 H-32 Q-40 0 -32 -9Z', '#d2d9dd', ink, 2.1);
    ctx.restore();
    // Leather-gloved opposing thumb pinching near side of latch
    shape('M87 144 Q97 138 108 127 L123 112 Q129 105 134 103 Q142 99 146 105 Q150 110 145 116 L133 128 L118 144 Q111 154 100 159Z', '#523421', ink, 2.0);
    shape('M94 144 Q112 128 134 108', null, '#8f6544', 1.2);
    // Unified leather gauntlet wrist strap over torn cardboard forearm!
    ctx.translate(50, 174);
    ctx.rotate(42 * Math.PI / 180);
    ctx.scale(0.66, 0.96);
    drawUnifiedArmoredCuff(180, true, true);
    ctx.restore();
    ctx.restore();

    if (frame >= 1558 && frame <= 1568) {
      starGlint(doorRightX - 38, 250, (1 - (frame - 1558) / 10) * 26, '#e8f5ffee');
    }

    drawCornerClock('00:45 AM', tween(frame, 1568, 1584));
  }

  // =========================================================================
  // SHOT 25 (f1603..1669): Rear OTS Alley Exit Check (drawCinematicAngle('ots') + misty alley!)
  // =========================================================================
  function drawShot25OtsAlleyCheck(frame) {
    const p = tween(frame, 1603, 1669);
    const panX = mix(-14, 18, p);
    const zoom = mix(1.0, 1.07, p);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Base OTS framing anchor
    window.drawCinematicAngle(ctx, 480, 270, 1.5, 'ots');

    // Rich misty empty downtown brick alley opening onto foggy avenues
    ctx.save();
    ctx.translate(-panX, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, 380);
    sky.addColorStop(0, '#040912');
    sky.addColorStop(0.6, '#0f1e30');
    sky.addColorStop(1, '#1d3247');
    rect(sky, -40, -20, W + 80, 410);
    // Distant downtown skyline & fogged intersection at alley mouth
    rect('#09111b', 330, 120, 86, 250);
    rect('#0c1624', 446, 86, 98, 284);
    rect('#09111b', 572, 134, 84, 236);
    oval(480, 316, 210, 72, 'rgba(132, 174, 216, 0.20)');
    // Converging midnight brick alley walls
    shape('M-40 -20 L340 164 V372 L-40 560Z', '#221a1f', ink, 3.2);
    shape('M1000 -20 L620 164 V372 L1000 560Z', '#1c151a', ink, 3.2);
    // Wet alley pavement floor
    shape('M340 372 H620 L1000 560 H-40Z', '#141e28', ink, 2.8);
    oval(480, 444, 150, 24, '#243a5088');
    // Drifting fog wisps across empty alley
    for (let i = 0; i < 4; i++) {
      const fx = ((i * 220 + frame * 1.6) % 720) + 120;
      oval(fx, 344 + i * 22, 170, 28, 'rgba(146, 186, 224, 0.14)');
    }
    ctx.restore();

    // Foreground lower-right: official rear-view Series Lead + bulging backpack + leather-gloved shotgun barrel!
    ctx.save();
    ctx.translate(panX * 0.4, Math.sin((frame - 1603) * 0.12) * 3);
    window.drawAnatomyTurnaround(ctx, 738, 1146, 2.02, 'rear', { hideLimbs: false });
    // Bulging dark canvas backpack
    shape('M648 368 Q738 336 828 368 L842 552 H634Z', '#2d3a34', ink, 3.2);
    shape('M670 434 H810 V532 H670Z', '#222d28', ink, 2.4);
    shape('M660 400 Q738 420 816 400', null, '#53685d', 2.6);
    // Matte-black shotgun barrel & dark brown leather-gloved left hand extending cautiously into alley!
    ctx.save();
    ctx.translate(606, 404);
    ctx.rotate(-2.78);
    ctx.scale(1.18, 1.18);
    drawPumpShotgun({ pumpOffset: 0, glintT: -1 });
    ctx.restore();
    oval(622, 420, 26, 22, '#4d301e', ink, 2.6);
    shape('M608 416 Q622 410 636 416', null, '#8f6544', 1.5);
    ctx.restore();

    ctx.restore();
    drawCornerClock('00:45 AM', 0.92);
  }

  // =========================================================================
  // SHOT 27 (f1742..1828): 2-Beat Skyline Lock: look-up Bust -> Apex Tower Blinking Red Beacon!
  // =========================================================================
  function drawShot27SkylineBeaconLock(frame) {
    if (frame < 1780) {
      // Beat 1 (f1742..1779): Official drawFaceAngle('look-up') (head-determined, mid-neck burn, red beacon glint)
      const p = tween(frame, 1742, 1779);
      const zoom = mix(1.0, 1.08, p);
      const pulse = 0.5 + 0.5 * Math.sin(frame * 0.28);

      drawMidnightFogAlley(frame, 260, { showBeacon: false, fogStrength: 0.7 });
      rect('#050b1488', 0, 0, W, H);

      ctx.save();
      ctx.translate(480, 270);
      ctx.scale(zoom, zoom);
      ctx.translate(-480, -270);

      window.drawFaceAngle(ctx, 480, 294, 1.28, 'look-up', {
        expression: 'head-determined',
        pitch: mix(-0.35, -0.94, tween(frame, 1742, 1762)),
        eyeDy: -1.8,
      });
      drawFrontNeckBurn(480, 424, 0.88, 0.90);
      shape('M394 462 L406 548 H436 L424 456Z M566 462 L554 548 H524 L536 456Z', '#24302a', ink, 2.6);

      // Faint pulsing red aviation-beacon light kissing his brow & cheekbones!
      const rg = ctx.createRadialGradient(480, 160, 10, 480, 210, 230);
      rg.addColorStop(0, `rgba(255, 62, 54, ${0.20 * pulse})`);
      rg.addColorStop(1, 'rgba(255, 62, 54, 0)');
      rect(rg, 220, 20, 520, 380);

      ctx.restore();
    } else {
      // Beat 2 (f1780..1828): Stepped zoom onto Apex Tower's blinking red rooftop beacon above fogged skyline!
      let zoom = 1.0 + tween(frame, 1780, 1796) * 0.05;
      if (frame >= 1796 && frame < 1812) zoom = 1.16 + tween(frame, 1796, 1812) * 0.05;
      else if (frame >= 1812) zoom = 1.30 + tween(frame, 1812, 1828) * 0.06;

      ctx.save();
      ctx.translate(480, 168);
      ctx.scale(zoom, zoom);
      ctx.translate(-480, -168);

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#030710');
      sky.addColorStop(0.58, '#0c192b');
      sky.addColorStop(1, '#1c324a');
      rect(sky, -100, -80, W + 200, H + 160);

      // Dark fogged downtown skyscrapers
      const bldgs = [
        [20, 240, 120, 320], [156, 194, 114, 366], [286, 250, 110, 310],
        [572, 230, 116, 330], [704, 188, 124, 372], [844, 246, 130, 314],
      ];
      for (const [bx, by, bw, bh] of bldgs) {
        rect('#080f18', bx, by, bw, bh);
        shape(`M${bx} ${by} H${bx + bw} V${by + bh} H${bx}Z`, null, '#1a2a3b', 1.8);
      }

      // Hero Apex Tower centered towering above skyline!
      shape('M414 560 V184 L438 148 H522 L546 184 V560Z', '#0c1522', '#263b50', 2.4);
      rect('#132234', 446, 164, 68, 22);
      // Tall rooftop steel spire
      shape('M480 148 V78', null, '#485d72', 4.0);
      shape('M462 126 H498 M468 104 H492', null, '#3b4e60', 2.4);

      // Bright blinking red rooftop aviation beacon!
      const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame - 1780) * 0.34));
      const halo = ctx.createRadialGradient(480, 78, 3, 480, 78, 136 * blink);
      halo.addColorStop(0, `rgba(255, 72, 64, ${0.98 * blink})`);
      halo.addColorStop(0.35, `rgba(255, 36, 36, ${0.46 * blink})`);
      halo.addColorStop(1, 'rgba(255, 36, 36, 0)');
      rect(halo, 320, -60, 320, 280);
      oval(480, 78, 8.5, 8.5, '#ff4d45');
      oval(480, 78, 4.0, 4.0, '#ffe4df');
      if (blink > 0.72) {
        starGlint(480, 78, blink * 42, 'rgba(255, 164, 156, 0.85)');
      }

      // Low midnight fog banks curling between towers
      for (let f = 0; f < 5; f++) {
        const fx = 140 + f * 180 + Math.sin(frame * 0.04 + f) * 24;
        oval(fx, 434 + (f % 2) * 32, 240, 56, 'rgba(128, 168, 206, 0.18)');
      }

      ctx.restore();
    }
  }

  // =========================================================================
  // SHOT 28 (f1829..1885): Extreme Close-Up — Shotgun Pump Rack (CHK-CHK! at f1848!)
  // =========================================================================
  function drawShot28ShotgunPumpRack(frame) {
    // 1829..1843 grip settle -> 1844..1851 SHARP BACK RACK (CHK!) -> 1852..1860 SHARP FORWARD RACK (CHK!)
    const backP = tween(frame, 1844, 1851);
    const fwdP = tween(frame, 1852, 1860);
    const pumpOffset = mix(0, -44, backP) + mix(0, 44, fwdP);
    const shake1 = (frame >= 1848 && frame <= 1851) ? Math.sin((frame - 1848) * 5.2) * 7 : 0;
    const shake2 = (frame >= 1858 && frame <= 1863) ? Math.sin((frame - 1858) * 5.2) * 9 * (1 - (frame - 1858) / 5) : 0;
    const shake = shake1 + shake2;
    const zoom = mix(1.0, 1.07, tween(frame, 1829, 1885));

    ctx.save();
    ctx.translate(480 + shake, 270 + shake * 0.45);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Dark blue midnight fog bokeh backdrop
    rect('#070d16', -30, -30, W + 60, H + 60);
    oval(220, 120, 210, 130, 'rgba(92, 138, 184, 0.16)');
    oval(760, 110, 160, 100, 'rgba(255, 58, 52, 0.12)');
    oval(720, 430, 240, 130, 'rgba(72, 114, 158, 0.14)');

    // EXTREME CLOSE-UP horizontal 12-gauge pump shotgun across center!
    ctx.save();
    ctx.translate(320, 256);
    ctx.scale(2.75, 2.75);
    drawPumpShotgun({
      pumpOffset,
      glintT: frame >= 1856 ? tween(frame, 1856, 1878) : -1,
      showChamberShell: frame >= 1846 && frame <= 1858,
    });
    ctx.restore();

    // Dark brown leather-gloved left hand & natural diagonal support forearm wrapping the ribbed pump forend!
    // Forearm enters cleanly from bottom-left at -56 deg so receiver & red chambered shell stay 100% unobstructed!
    const handX = 320 + (124 + pumpOffset) * 2.75;
    ctx.save();
    ctx.translate(handX, 276);

    // 1. Natural diagonal forearm (buckled dark leather cuff + taped cardboard sleeve) extending off BOTTOM-LEFT!
    ctx.save();
    ctx.translate(-12, 92);
    ctx.rotate(0.52);
    ctx.scale(1.65, 1.65);
    drawUnifiedArmoredCuff(280, false, true);
    ctx.restore();

    // 2. Cast shadow of gloved fingers onto the ribbed black pump forend
    shape('M-70 -26 H66 V22 H-70Z', 'rgba(8, 12, 18, 0.34)');

    // 3. Sculpted leather palm & wrist flowing naturally from the diagonal buckled cuff
    shape('M-74 14 Q-78 72 -44 104 Q4 114 48 96 Q74 68 68 12 L52 -10 H-60Z', '#5a3722', ink, 3.2);
    shape('M-54 58 Q-2 72 48 52', null, '#8c6242', 2.2);
    shape('M-40 82 Q4 92 42 78', null, '#3c2214', 2.0);

    // 4. Four staggered, tapered leather fingers wrapping snugly along the ribbed forend (curved knuckle arc!)
    const gFingers = [
      { x: -64, y: -22, w: 28, h: 48, rot: -0.05 }, // Pinky-side
      { x: -34, y: -28, w: 30, h: 56, rot: -0.02 }, // Ring
      { x: -2, y: -31, w: 31, h: 60, rot: 0.01 },   // Middle
      { x: 30, y: -27, w: 30, h: 55, rot: 0.05 },   // Index (angled slightly forward toward muzzle)
    ];
    for (const f of gFingers) {
      ctx.save();
      ctx.translate(f.x + f.w * 0.5, f.y + f.h * 0.5);
      ctx.rotate(f.rot);
      const hw = f.w * 0.5, hh = f.h * 0.5;
      shape(`M${-hw} ${-hh + 7} Q0 ${-hh - 5} ${hw} ${-hh + 7} L${hw - 1} ${hh - 7} Q0 ${hh + 4} ${-hw + 1} ${hh - 7}Z`, '#6b4329', ink, 3.0);
      shape(`M${-hw + 5} ${-7} Q0 ${-11} ${hw - 5} ${-7}`, null, '#946a49', 1.8);
      shape(`M${-hw + 5} ${9} Q0 ${13} ${hw - 5} ${9}`, null, '#3e2415', 1.8);
      ctx.restore();
    }

    // 5. Leather thumb pad bracing firmly along the right side of the forend
    shape('M54 -6 Q84 -14 86 14 Q82 44 50 48Z', '#52321e', ink, 3.0);
    shape('M62 12 Q74 10 78 20', null, '#8c6242', 1.6);
    ctx.restore();

    // Bright 4-point cold steel star glint on CHK-CHK! lock-up at f1858..1872
    if (frame >= 1856 && frame <= 1874) {
      starGlint(348, 224, Math.sin(((frame - 1856) / 18) * Math.PI) * 44, '#f5fbffff');
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 29 (f1886..1967): Dramatic low-angle Part 2 Cliffhanger Push-In (1.0x -> 1.15x) -> Black!
  // =========================================================================
  function drawShot29LowAngleCliffhanger(frame) {
    const p = tween(frame, 1886, 1964);
    const zoom = mix(1.0, 1.15, p);
    const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame * 0.28));

    ctx.save();
    ctx.translate(480, 286);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -286);

    // Dramatic low-angle midnight fogged avenue + distant Apex Tower red beacon!
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#040912');
    sky.addColorStop(0.55, '#0e1d30');
    sky.addColorStop(1, '#1d344c');
    rect(sky, -60, -40, W + 120, H + 80);

    // Towering converging midnight city buildings framing our hero
    shape('M-40 -40 L210 70 V560 H-40Z', '#0b121c', ink, 3.0);
    shape('M1000 -40 L750 70 V560 H1000Z', '#0b121c', ink, 3.0);
    // Distant Apex Tower silhouette & pulsing red beacon upper-right
    shape('M648 540 V124 L668 96 H710 L730 124 V540Z', '#0c1624', '#22364a', 2.0);
    shape('M689 96 V52', null, '#485d72', 3.0);
    const halo = ctx.createRadialGradient(689, 52, 2, 689, 52, 74 * pulse);
    halo.addColorStop(0, `rgba(255, 64, 56, ${0.95 * pulse})`);
    halo.addColorStop(0.45, `rgba(255, 36, 36, ${0.38 * pulse})`);
    halo.addColorStop(1, 'rgba(255, 36, 36, 0)');
    rect(halo, 600, -30, 180, 160);
    oval(689, 52, 5.5, 5.5, '#ff4d45');

    // Low drifting blue midnight fog behind hero
    for (let f = 0; f < 4; f++) {
      oval(200 + f * 190 + Math.sin(frame * 0.05 + f) * 18, 430 + (f % 2) * 34, 240, 48, 'rgba(136, 178, 218, 0.16)');
    }

    // Bulging dark canvas backpack drawn BEHIND low-angle torso (front-view backpack rule!)
    shape('M352 332 Q480 306 608 332 L624 554 H336Z', '#26322d', ink, 3.0);

    // Official low-angle Series Lead with hideLimbs:true so there are ZERO double/ghost arms behind the shotgun hold!
    ctx.save();
    ctx.translate(480, 240);
    ctx.scale(1.22, 1.22);
    ctx.translate(0, 26);
    ctx.scale(1.12, 1.04);
    window.drawAnatomyTurnaround(ctx, 0, 646, 1.68, 'front', {
      hideLimbs: true,
      expression: 'head-determined',
      headPitch: -0.95,
      eyeOffset: [0, -1.2],
    });
    ctx.restore();

    // Smoker mid-neck burn centered accurately on mid-lower neck!
    drawFrontNeckBurn(480, 273, 0.72, 0.90);
    // Clean dark canvas backpack shoulder straps in front
    shape('M394 342 L408 552 H440 L424 338Z M566 342 L552 552 H520 L536 338Z', '#24302a', ink, 2.8);

    // Subtle cast shadow of forearms & pump shotgun across his cream shirt & tie for real 3D depth!
    shape('M338 446 L688 388 L694 426 L342 504Z', 'rgba(18, 28, 38, 0.24)');

    // Clean, anatomically constructed bent arms extending smoothly from BOTH deltoid shoulders (zero ghost limbs!):
    // 1. RIGHT ARM (viewer-left): deltoid -> upper arm -> bent elbow -> forearm angling inward to shotgun stock grip
    shape('M382 342 Q344 352 326 408 L314 484 Q316 516 350 518 L412 492 L400 448 L368 456 L384 398Z', '#ebe2ce', ink, 3.0);
    shape('M332 456 Q356 462 372 452', null, '#c2b8a3', 2.2); // elbow fold crease
    // Buckled dark leather wrist cuff on right forearm
    shape('M378 446 L408 438 L422 486 L390 494Z', '#5a3722', ink, 2.6);
    shape('M384 468 L416 460', null, '#382114', 5.0);
    rect('#d9b452', 396, 459, 9, 9);

    // 2. LEFT ARM (viewer-right): deltoid -> upper arm -> bent elbow -> forearm angling up-inward to pump forend
    shape('M578 342 Q618 352 638 404 L654 468 Q652 500 618 496 L584 442 L614 426 L596 420 L576 394Z', '#ebe2ce', ink, 3.0);
    shape('M618 446 Q636 452 644 438', null, '#c2b8a3', 2.2); // elbow fold crease
    // Buckled dark leather wrist cuff on left forearm
    shape('M592 430 L626 422 L638 468 L604 476Z', '#5a3722', ink, 2.6);
    shape('M598 452 L632 444', null, '#382114', 5.0);
    rect('#d9b452', 610, 443, 9, 9);

    // Matte-black 12-gauge pump shotgun held authoritatively at low-ready across chest!
    ctx.save();
    ctx.translate(492, 434);
    ctx.rotate(-0.18);
    ctx.scale(1.18, 1.18);
    drawPumpShotgun({ pumpOffset: 0, glintT: tween(frame, 1916, 1954) });

    // Sculpted dark brown leather-gloved LEFT hand cradling the ribbed pump forend from underneath!
    ctx.save();
    ctx.translate(122, 6);
    shape('M-22 2 Q-24 20 -12 24 H14 Q24 20 22 2 L18 -14 H-18Z', '#5a3722', ink, 2.4);
    for (let i = 0; i < 4; i++) {
      const fx = -17 + i * 9;
      shape(`M${fx} -14 Q${fx + 4} -18 ${fx + 8} -14 L${fx + 8} 6 Q${fx + 4} 10 ${fx} 6Z`, '#6b4329', ink, 2.0);
    }
    shape('M-14 14 Q0 18 14 14', null, '#8f6544', 1.4);
    ctx.restore();

    // Sculpted dark brown leather-gloved RIGHT hand wrapping the stock wrist (index finger along frame!)
    ctx.save();
    ctx.translate(-68, 8);
    shape('M-20 -12 H18 Q24 8 14 22 H-18 Q-24 8 -20 -12Z', '#5a3722', ink, 2.4);
    // Curled middle/ring/pinky fingers around stock grip
    for (let i = 0; i < 3; i++) {
      const fx = -15 + i * 9.5;
      shape(`M${fx} -6 Q${fx + 4} -10 ${fx + 8.5} -6 L${fx + 8.5} 14 Q${fx + 4} 18 ${fx} 14Z`, '#6b4329', ink, 1.9);
    }
    // Straight indexed trigger finger resting safely along the receiver side!
    shape('M14 -12 H34 Q38 -12 38 -7 Q38 -2 34 -2 H14Z', '#6b4329', ink, 2.0);
    ctx.restore();

    ctx.restore();

    ctx.restore();

    // Clean cut to pure black on final frames (f1965..1967)
    if (frame >= 1965) {
      rect(`rgba(0, 0, 0, ${clamp((frame - 1964) / 2)})`, 0, 0, W, H);
    }
  }

  // =========================================================================
  // MASTER COMPOSITOR ENTRY POINT: renderCh2cFrame (1,968 frames, 82.0 s @ 24 fps)
  // =========================================================================
  globalThis.renderCh2cFrame = async function renderCh2cFrame(frame, png, anchors) {
    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    if (frame < 62) {
      // Shot 1 (0..61): Pitch-Dark Silhouette Bust (00:28 AM)
      drawShot1PitchDarkBust(frame);
    } else if (frame < 120) {
      // Shot 2 (62..119): POV Pocket Pull — 4% BATTERY Cold Blue Glow
      drawShot2PhonePocketPull(frame);
    } else if (frame < 182) {
      // Shot 3 (120..181): Studio POV Flashlight Ignition (pov-flashlight + torn right cardboard!)
      drawShot3FlashlightIgnition(frame);
    } else if (frame < 245) {
      // Shot 4 (182..244): Flashlight POV Sweep #1 — Spent Brass Casings & Boot Kick
      drawShot4BrassFloorSweep(frame);
    } else if (frame < 312) {
      // Shot 5 (245..311): Flashlight POV Sweep #2 — Lathe, Vises & MILLER CUSTOM GUNSMITH Sign
      drawShot5LatheAndSign(frame);
    } else if (frame < 370) {
      // Shot 6 (312..369): Tight Front Reaction (head-notice -> head-relief)
      drawShot6FrontHopeReaction(frame);
    } else if (frame < 432) {
      // Shot 7 (370..431): Flashlight Sweep #3 — Stripped Empty Wall Rifle Pegs
      drawShot7EmptyRifleWall(frame);
    } else if (frame < 490) {
      // Shot 8 (432..489): Tight Front Bust drawFaceAngle('eye-dart') Down-Right -> Glint!
      drawShot8EyeDartGlint(frame);
    } else if (frame < 552) {
      // Shot 9 (490..551): Stepped Beam Push-In #1 — Padlocked Glass Display Case
      drawShot9LockedGlassCase(frame);
    } else if (frame < 619) {
      // Shot 10 (552..618): Stepped Beam Push-In #2 (1.42x) — 12-Gauge Pump Shotgun + Star Glint
      drawShot10ShotgunReveal(frame);
    } else if (frame < 686) {
      // Shot 11 (619..685): Stepped Beam Push-In #3 (1.65x) — 9mm Pistol, Spare Mag & Red Shells
      drawShot11PistolAndShells(frame);
    } else if (frame < 749) {
      // Shot 12 (686..748): Tactile Pegboard Grab — Steel Pry-Bar
      drawShot12PryBarGrab(frame);
    } else if (frame < 821) {
      // Shot 13 (749..820): Close-Up Brass Lock Pry & Snap (f792) + Glass Door Slides Open
      drawShot13LockPrySnap(frame);
    } else if (frame < 883) {
      // Shot 14 (821..882): SUDDEN SUSPENSE FREEZE — Outer Shutter Vibrates (f830)
      drawShot14SuspenseFreeze(frame);
    } else if (frame < 946) {
      // Shot 15 (883..945): POV Frosted Front Transom Glass — Articulated Infected Shadow
      drawShot15FrostedGlassShadow(frame);
    } else if (frame < 1018) {
      // Shot 16 (946..1017): POV Shotgun Lift & Weight Check (pov-pipe-grip)
      drawShot16ShotgunLift(frame);
    } else if (frame < 1109) {
      // Shot 17 (1018..1108): Rhythmic Macro Insert — Thumb-Loading 6 Red Shells
      drawShot17ShellLoading(frame);
    } else if (frame < 1176) {
      // Shot 18 (1109..1175): Rhythmic Tactile Insert — 9mm Mag Slap (f1133) & Belt Tuck
      drawShot18PistolMagSlap(frame);
    } else if (frame < 1243) {
      // Shot 19 (1176..1242): Macro Damage Check — Shredded Hunter-Bite Cardboard
      drawShot19ShreddedDamageCheck(frame);
    } else if (frame < 1320) {
      // Shot 20 (1243..1319): Armor Upgrade Insert — Dark Brown Leather Work Gloves & Straps!
      drawShot20LeatherGloveUpgrade(frame);
    } else if (frame < 1402) {
      // Shot 21 (1320..1401): OpenToonz Side View — Workshop Gear-Up Unveiling Leather-Gloved Rig!
      const p = tween(frame, 1320, 1401);
      const zoom = mix(1.0, 1.07, p);
      ctx.save();
      ctx.translate(480, 290);
      ctx.scale(zoom, zoom);
      ctx.translate(-480, -290);
      drawWorkshopInterior(340, 0.35, 0.42);
      // Background open glass display case & metal lathe
      rect('#1e2732', 86, 260, 240, 130);
      rect('#221417', 580, 206, 300, 184);
      shape('M580 206 H880 V390 H580Z', null, '#5a6f82', 3.0);
      await drawArmoredLead(png, anchors, mix(360, 476, p), 468, 0.80, {
        bulgingPack: true,
        neckScuff: true,
        leatherGloves: true,
        reinforcedRightArm: true,
        shotgun: true,
      });
      ctx.restore();
    } else if (frame < 1474) {
      // Shot 22 (1402..1473): Tight Front Bust — The Silence Rule
      drawShot22SilenceRule(frame);
    } else if (frame < 1536) {
      // Shot 23 (1474..1535): Overhead Bench Insert — Battery 4% -> 3% & Flashlight OFF (f1502)
      drawShot23BatteryThreePercent(frame);
    } else if (frame < 1603) {
      // Shot 24 (1536..1602): Studio POV Rear Deadbolt Unlock (pov-door-lock + Leather Glove!)
      drawShot24RearDeadboltUnlock(frame);
    } else if (frame < 1670) {
      // Shot 25 (1603..1669): Rear OTS Alley Exit Check (drawCinematicAngle('ots') + Misty Alley!)
      drawShot25OtsAlleyCheck(frame);
    } else if (frame < 1742) {
      // Shot 26 (1670..1741): OpenToonz Side View — Step Into Blue Midnight Fog + Lamp Post Wipe!
      const p = tween(frame, 1670, 1741);
      drawMidnightFogAlley(frame, p * 165, { showBeacon: true, fogStrength: 0.92 });
      await drawArmoredLead(png, anchors, mix(210, 560, p), 468, 0.78, {
        bulgingPack: true,
        neckScuff: true,
        leatherGloves: true,
        reinforcedRightArm: true,
        shotgun: true,
      });
      // Foreground dark iron lamp post wiping cleanly across lens at 1.55x parallax!
      const poleX = mix(1040, -180, clamp(p * 1.55));
      rect('#070b10f2', poleX, 0, 48, H);
      rect('#1e2a38cc', poleX + 38, 0, 10, H);
      drawCornerClock('00:45 AM', 0.90);
    } else if (frame < 1829) {
      // Shot 27 (1742..1828): 2-Beat Skyline Lock (look-up Bust -> Apex Tower Blinking Red Beacon)
      drawShot27SkylineBeaconLock(frame);
    } else if (frame < 1886) {
      // Shot 28 (1829..1885): Extreme Close-Up — Shotgun Pump Rack (CHK-CHK! at f1848!)
      drawShot28ShotgunPumpRack(frame);
    } else {
      // Shot 29 (1886..1967): Dramatic low-angle Part 2 Cliffhanger Push-In -> Clean Black
      drawShot29LowAngleCliffhanger(frame);
    }

    // Textured cutout film grain & subtle widescreen vignette (skip over pure black end frames)
    if (frame < 1966) {
      ctx.drawImage(grain, 0, 0);
      const vig = ctx.createRadialGradient(480, 270, 250, 480, 270, 620);
      vig.addColorStop(0, '#04080f00');
      vig.addColorStop(1, '#04080f94');
      rect(vig, 0, 0, W, H);
    }

    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
  };
})();
