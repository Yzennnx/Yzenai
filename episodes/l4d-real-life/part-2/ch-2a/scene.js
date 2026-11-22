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

  // Cutout film grain texture
  const grain = document.createElement('canvas');
  grain.width = W;
  grain.height = H;
  const gctx = grain.getContext('2d');
  let seed = 824;
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

  // Unified cuff + corrugated cardboard + gray duct-tape forearm in ONE exact coordinate transform (zero seam drift!)
  function drawUnifiedArmoredCuff(extendLen = 190) {
    const endY = 56 + extendLen;
    // Extended corrugated cardboard forearm behind cuff
    shape(`M-36 16 Q0 22 36 16 L${44 + extendLen * 0.04} ${endY} L${-44 - extendLen * 0.04} ${endY}Z`, '#a88156', '#253a3b', 2.4);
    // Subtle corrugation ribs
    for (let rx = -24; rx <= 24; rx += 12) {
      shape(`M${rx} 24 L${rx * 1.15} ${endY - 4}`, null, '#7e5d3b66', 1.1);
    }
    // Gray duct-tape wrap bands locked to cardboard forearm
    shape('M-37 26 Q0 32 37 26 L39 42 Q0 48 -39 42Z', '#8c969e', '#253a3b', 1.9);
    shape('M-40 62 Q0 68 40 62 L42 82 Q0 88 -42 82Z', '#8c969e', '#253a3b', 1.9);
    if (extendLen > 90) {
      shape('M-43 114 Q0 120 43 114 L45 134 Q0 140 -45 134Z', '#8c969e', '#253a3b', 1.8);
    }
    // Cream shirt cuff flush at wrist seam
    shape('M-24 -3 Q1 0 25 -4 L28 15 Q2 21 -28 15Z', '#ede5d0', '#253a3b', 2.4);
    shape('M-25 10 Q2 15 25 9', null, '#a49c86', 1.2);
    oval(19, 7, 2.5, 2.5, '#c6bda8', '#8a8575', 0.8);
  }

  // Raw red Smoker rope-burn scar across front-view neck (fits cleanly inside neck column)
  function drawFrontNeckBurn(cx, cy, scale = 1, alpha = 0.86) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    shape('M-22 -1 Q0 6 22 -2', null, '#7a1919', 4.8);
    shape('M-20 0 Q0 5 20 -1', null, '#bf342e', 2.8);
    shape('M-14 2 Q0 5 14 0', null, '#e35b52', 1.2);
    ctx.restore();
  }

  // Chipped & slightly bent thin stainless kitchen knife in local coords (handle x:-80..0, blade x:0..140)
  function drawChippedBentKnife(glintT = -1) {
    // Dark handle + rivets
    shape('M-76 -11 H0 V12 H-76 Q-84 1 -76 -11Z', '#1f282e', ink, 2.3);
    oval(-56, 0, 2.8, 2.8, '#b8c4cc');
    oval(-28, 0, 2.8, 2.8, '#b8c4cc');
    // Thin stainless blade with jagged V-chip around x=72 and bent tip curving up-right
    shape('M0 -10 H66 L74 -2 L83 -10 L138 -20 L110 10 L76 13 H0Z', '#d6e7f0', ink, 2.2);
    // Steel specular sheen
    shape('M4 -7 H62 L120 -15 L100 4 H4Z', '#ffffff99');
    // Stress crease near chip & bend
    shape('M72 -2 L76 11 M102 -12 L96 8', null, '#687d8a', 1.6);
    if (glintT >= 0 && glintT <= 1) {
      const gx = mix(10, 128, glintT);
      const gy = mix(0, -14, glintT);
      const s = Math.sin(glintT * Math.PI) * 14;
      shape(`M${gx} ${gy - s} L${gx + s * 0.22} ${gy - s * 0.22} L${gx + s} ${gy} L${gx + s * 0.22} ${gy + s * 0.22} L${gx} ${gy + s} L${gx - s * 0.22} ${gy + s * 0.22} L${gx - s} ${gy} L${gx - s * 0.22} ${gy - s * 0.22}Z`, '#fffbe0ee');
    }
  }

  // OpenToonz armored Series Lead with joint-locked bulging backpack, cardboard wraps on ALL 4 limbs, and Smoker neck burn
  async function drawArmoredLead(cutout, anchors, worldX, worldFloorY, scale, opts = {}) {
    if (!cutout) return;
    const { flipLeft = false, bulgingPack = true, neckScuff = true, noShadow = false } = opts;
    const img = await loadPng(cutout);
    if (!noShadow) {
      ctx.fillStyle = '#070c1077';
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
      } else {
        shape('M-54 -116 Q-64 -106 -64 -66 L-58 -8 Q-44 6 -24 2 L-22 -118 Q-38 -124 -54 -116Z', '#2d3a34', ink, 2.4);
      }
      ctx.restore();
    }

    // Far forearm wrap behind body
    drawWrap(anchors?.forearmFar, 40, 9.5, 14);

    // 2. Official OpenToonz character layer
    ctx.drawImage(img, ox, oy, 540 * scale, 960 * scale);

    // 3. Tracked backpack shoulder strap, red Smoker neck burn, shin & near forearm wraps
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
      shape('M-14 -8 Q2 -2 18 -6', null, '#b4302ccc', 4.6);
      ctx.restore();
    }
    drawWrap(anchors?.shinFar, 54, 13, 18);
    drawWrap(anchors?.shinNear, 54, 14, 18);
    drawWrap(anchors?.forearmNear, 42, 10, 14);
    ctx.restore();
  }

  // Reusable hunched/running common infected silhouette
  function drawInfected(x, y, scale, opts = {}) {
    const { facingRight = true, running = false, phase = 0, dark = false, reachingUp = false } = opts;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facingRight ? scale : -scale, scale);
    const body = dark ? '#182024' : '#2d393f';
    const skin = dark ? '#364347' : '#657573';
    oval(0, 0, 40, 7, '#060a0d88');
    const stride = running ? Math.sin(phase) * 28 : 0;
    shape(`M-14 -92 L${-26 - stride} -42 ${-18 - stride} 0 ${-2 - stride} 0 ${-10 - stride * 0.5} -44 4 -92Z`, '#202a2e', ink, 2.2);
    shape(`M4 -92 L${20 + stride} -44 ${14 + stride} 0 ${30 + stride} 0 ${34 + stride * 0.5} -46 18 -92Z`, '#29353a', ink, 2.2);
    const lean = running ? 18 : 6;
    shape(`M-20 -88 Q-24 -146 ${lean} -174 L${34 + lean} -166 Q${38 + lean} -130 22 -88Z`, body, ink, 2.4);
    if (reachingUp) {
      const reachY = -238 + Math.sin(phase) * 14;
      shape(`M${12 + lean * 0.4} -158 L${44 + lean} ${reachY} L${58 + lean} ${reachY + 6} L${24 + lean * 0.4} -140Z`, body, ink, 2.2);
      shape(`M${-4 + lean * 0.4} -154 L${22 + lean} ${reachY + 12} L${36 + lean} ${reachY + 18} L${8 + lean * 0.4} -138Z`, body, ink, 2.0);
    } else {
      const ay = running ? -144 + Math.cos(phase) * 18 : -148;
      shape(`M${14 + lean * 0.5} -158 L${62 + lean} ${ay} L${86 + lean} ${ay + 8} L${82 + lean} ${ay + 22} L${54 + lean} ${ay + 12} L${10 + lean * 0.5} -142Z`, body, ink, 2.2);
    }
    const hx = 28 + lean, hy = -190;
    oval(hx, hy, 21, 23, skin, ink, 2.4);
    shape(`M${hx - 18} ${hy - 6} Q${hx - 10} ${hy - 26} ${hx + 16} ${hy - 20} Q${hx + 22} ${hy - 10} ${hx + 16} ${hy - 2} L${hx + 6} ${hy - 12}Z`, '#182024', ink, 1.8);
    oval(hx + 13, hy - 2, 3.8, 3.0, '#e6f5be');
    ctx.restore();
  }

  // Pale gray dawn street backdrop (05:08-05:10 AM)
  function drawDawnStreet(frame, scrollX = 0, sunHit = 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1e2c3c');
    sky.addColorStop(0.55, '#4b5f73');
    sky.addColorStop(0.86, sunHit > 0.1 ? '#c79b74' : '#8a9198');
    sky.addColorStop(1, sunHit > 0.1 ? '#e8bd86' : '#a9a29c');
    rect(sky, 0, 0, W, H);

    // Distant skyline silhouettes
    const bgOff = (scrollX * 0.3) % 480;
    for (let i = -1; i < 4; i++) {
      const bx = i * 480 - bgOff;
      rect('#212c38', bx + 16, 130, 148, 312);
      rect('#1a2430', bx + 178, 78, 168, 364);
      rect('#26323e', bx + 358, 152, 112, 290);
      for (let wy = 165; wy < 360; wy += 44) {
        rect('#334454', bx + 44, wy, 26, 22);
        rect('#334454', bx + 98, wy, 26, 22);
      }
    }

    // Mist veil
    const mist = ctx.createLinearGradient(0, 290, 0, 445);
    mist.addColorStop(0, 'rgba(182, 198, 210, 0)');
    mist.addColorStop(1, 'rgba(182, 198, 210, 0.24)');
    rect(mist, 0, 290, W, 155);

    // Asphalt + curb
    rect('#252f38', 0, 442, W, 98);
    rect('#3a4650', 0, 434, W, 10);
    const dashOff = scrollX % 110;
    for (let x = -110; x < W + 110; x += 110) rect('#887a4e66', x - dashOff, 488, 54, 6);

    if (sunHit > 0.02) {
      const sg = ctx.createLinearGradient(0, 120, W, 480);
      sg.addColorStop(0, `rgba(255, 206, 128, ${0.34 * sunHit})`);
      sg.addColorStop(1, 'rgba(255, 196, 110, 0)');
      rect(sg, 0, 0, W, H);
    }
  }

  // Textured brick wall helper
  function drawBrickWall(x, y, w, h, baseColor = '#4a322d', mortarColor = '#281a18') {
    rect(baseColor, x, y, w, h);
    ctx.strokeStyle = mortarColor;
    ctx.lineWidth = 1.6;
    const rowH = 22, colW = 54;
    for (let ry = y; ry < y + h; ry += rowH) {
      ctx.beginPath();
      ctx.moveTo(x, ry);
      ctx.lineTo(x + w, ry);
      ctx.stroke();
      const offset = (Math.floor((ry - y) / rowH) % 2) * (colW * 0.5);
      for (let rx = x + offset; rx < x + w; rx += colW) {
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx, Math.min(y + h, ry + rowH));
        ctx.stroke();
      }
    }
  }

  // Iron drop-down fire ladder helper
  function drawIronLadder(cx, topY, bottomY, width = 76, rungStep = 36) {
    const half = width * 0.5;
    // Drop shadow
    rect('#080d1155', cx - half + 6, topY + 4, 8, bottomY - topY);
    rect('#080d1155', cx + half - 2, topY + 4, 8, bottomY - topY);
    // Side rails
    rect('#3a3634', cx - half, topY, 8, bottomY - topY);
    rect('#3a3634', cx + half - 8, topY, 8, bottomY - topY);
    shape(`M${cx - half} ${topY} H${cx - half + 8} V${bottomY} H${cx - half}Z`, null, ink, 2.0);
    shape(`M${cx + half - 8} ${topY} H${cx + half} V${bottomY} H${cx + half - 8}Z`, null, ink, 2.0);
    // Rungs
    for (let y = topY + 20; y <= bottomY - 12; y += rungStep) {
      rect('#524844', cx - half + 6, y, width - 12, 7);
      rect('#78635a', cx - half + 8, y + 1, width - 16, 2);
      shape(`M${cx - half + 6} ${y} H${cx + half - 6} V${y + 7} H${cx - half + 6}Z`, null, ink, 1.8);
    }
  }

  // Dusty 2F bookstore loft interior backdrop (supports morning / afternoon / dusk / night lighting)
  function drawBookstoreLoft(frame, mood = 'morning', beamShift = 0) {
    const palettes = {
      morning: { wall: '#283036', floor: '#382c24', shelf: '#2e221b', beam: 'rgba(232, 238, 245, 0.20)', shade: '#0d141a33' },
      afternoon: { wall: '#362d26', floor: '#4a3625', shelf: '#362519', beam: 'rgba(255, 206, 122, 0.34)', shade: '#18100a22' },
      dusk: { wall: '#1f222d', floor: '#282224', shelf: '#21191a', beam: 'rgba(232, 134, 84, 0.22)', shade: '#0c101a44' },
      night: { wall: '#0f1620', floor: '#171a20', shelf: '#14181e', beam: 'rgba(110, 152, 204, 0.14)', shade: '#060a1066' },
    };
    const p = palettes[mood] || palettes.morning;

    rect(p.wall, 0, 0, W, 380);
    // Wooden plank floorboards
    rect(p.floor, 0, 380, W, 160);
    for (let py = 396; py < H; py += 20) {
      shape(`M0 ${py} H${W}`, null, '#120e0b66', 1.6);
    }
    for (let px = 40; px < W; px += 120) {
      shape(`M${px} 380 L${px - 50} 540`, null, '#120e0b44', 1.4);
    }

    // Tall wooden bookshelves along back wall
    const bookColors = ['#6e322e', '#2f4c42', '#7a5d32', '#3a4961', '#5a3a4d', '#4f4c3d'];
    for (const sx of [56, 290, 524]) {
      rect(p.shelf, sx, 46, 208, 336);
      shape(`M${sx} 46 H${sx + 208} V382 H${sx}Z`, null, ink, 2.8);
      for (let sy = 104; sy <= 344; sy += 60) {
        rect('#1d1510', sx + 8, sy, 192, 8);
        for (let bx = sx + 12; bx < sx + 186; bx += 18) {
          const bh = 32 + ((bx * 7 + sy) % 18);
          const col = bookColors[(bx + sy) % bookColors.length];
          rect(col, bx, sy - bh, 14, bh);
          shape(`M${bx} ${sy - bh} H${bx + 14} V${sy} H${bx}Z`, null, '#0c101488', 1.2);
        }
      }
    }

    // Right-side slatted wooden front shutter
    rect('#1a1412', 776, 70, 146, 250);
    for (let ly = 82; ly < 312; ly += 18) {
      rect('#342820', 784, ly, 130, 11);
      shape(`M784 ${ly} H914 V${ly + 11} H784Z`, null, ink, 1.5);
    }
    shape('M776 70 H922 V320 H776Z', null, ink, 3.2);

    // Diagonal light bars from shutters
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const by = 92 + i * 32;
      const sx = 780;
      const tx = 280 + beamShift - i * 24;
      shape(`M${sx} ${by} L${sx} ${by + 12} L${tx} ${by + 190} L${tx - 38} ${by + 172}Z`, p.beam);
    }
    ctx.restore();

    // Floating dust motes in sunbeams
    if (mood !== 'night') {
      for (let d = 0; d < 26; d++) {
        const dx = 320 + ((d * 67 + frame * 0.45) % 450);
        const dy = 110 + ((d * 43 + Math.sin(frame * 0.05 + d) * 14) % 270);
        oval(dx, dy, 1.6, 1.6, 'rgba(255, 246, 224, 0.45)');
      }
    }
    rect(p.shade, 0, 0, W, H);
  }

  // Reusable #bar-hold studio SVG cylindrical grip hand with unified armored cuff
  function drawStudioCylinderGrip(drawPropFn, x, y, rotDeg, sc = 1.65) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.scale(sc, sc);
    ctx.translate(-126, -124);
    // Opposing thumb behind shaft
    shape('M100 105 Q90 108 85 119 Q79 130 82 143 Q82 151 88 155 Q93 159 100 155 Q104 153 104 148 Q104 144 98 143 L95 143 Q92 137 97 132 L111 119Z', '#c88e72', '#253a3b', 2.4);
    // Prop passing cleanly through gripped palm
    drawPropFn();
    // Dorsal palm & 4 curled fingers
    shape('M99 61 Q102 72 96 83 Q90 95 91 109 Q91 118 95 123 Q97 130 98 147 Q98 158 101 162 Q106 168 112 162 Q115 159 115 151 L114 128 Q117 137 118 153 Q119 166 124 168 Q131 171 135 165 Q137 161 135 153 L132 128 Q136 136 139 153 Q141 163 146 163 Q154 163 155 156 Q156 151 152 142 L149 125 Q154 132 157 144 Q160 153 166 153 Q173 152 172 145 Q170 132 164 112 Q161 100 154 94 Q143 81 139 61Z', '#e7ae87', '#253a3b', 2.4);
    shape('M139 63 Q143 80 154 94 Q161 100 164 112 L172 145 Q173 152 166 152 Q160 153 157 144 L150 123 Q156 117 154 110 Q148 99 140 93 Q130 82 130 63Z', '#c88e72');
    shape('M98 106 Q98 88 106 79 Q117 77 133 87 Q143 94 146 104 Q133 102 124 105 Q110 106 98 106Z', '#f3c39d');
    shape('M98 114 Q104 109 110 113 M117 116 Q123 110 129 114 M136 115 Q142 109 146 112 M153 117 L160 115 M101 136 Q106 133 111 135 M121 140 Q126 136 131 139 M140 138 L148 136 M158 136 L166 133', null, '#9e6755', 1.6);
    // Unified armored cuff + taped cardboard forearm locked flush at wrist
    ctx.save();
    ctx.translate(118, 66);
    ctx.rotate(Math.PI);
    ctx.scale(0.84, 1.0);
    drawUnifiedArmoredCuff(190);
    ctx.restore();
    ctx.restore();
  }

  // Reusable #ticket-pinch studio SVG pinching hand with unified armored cuff
  function drawStudioPinchHand(x, y, rotDeg, sc = 1.65, flipX = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.scale(flipX ? -sc : sc, sc);
    ctx.translate(-122, -124);
    // Unified armored cuff + taped cardboard forearm locked flush behind palm
    ctx.save();
    ctx.translate(50, 174);
    ctx.rotate(42 * Math.PI / 180);
    ctx.scale(0.66, 0.96);
    drawUnifiedArmoredCuff(210);
    ctx.restore();
    // Far curled fingers
    shape('M91 147 Q101 147 111 140 C117 146 113 158 105 162 Q97 166 88 161Z', '#c78c73', '#253a3b', 1.7);
    shape('M108 126 Q116 117 125 121 Q127 131 126 140 L121 153 Q117 160 111 157 Q106 155 107 148 L110 136Z', '#ce9479', '#253a3b', 1.7);
    shape('M120 108 Q133 102 142 110 Q147 116 145 125 L143 145 Q142 153 137 154 Q131 153 130 148 L129 131 Q126 126 119 126Z', '#dba382', '#253a3b', 1.8);
    // Dorsal hand & index finger
    shape('M40 165 Q61 148 72 132 L84 116 C90 106 96 101 106 100 L126 96 Q135 94 140 97 Q146 101 143 107 L130 118 Q123 124 113 129 Q110 144 102 155 C95 169 79 176 58 184Z', '#e7ae87', '#253a3b', 2.4);
    shape('M41 165 Q61 148 72 132 Q82 119 87 113 Q93 107 101 105 Q90 117 85 132 Q76 149 64 157 L50 173Z', '#c88e72');
    // Opposing thumb
    shape('M87 144 Q97 138 108 127 L123 112 Q129 105 134 103 Q142 99 146 105 Q150 110 145 116 L133 128 L118 144 Q111 154 100 159', '#e7ae87', '#253a3b', 2.0);
    shape('M134 106 Q139 103 143 106 Q145 109 142 112 L137 116 Q133 115 131 111Z', '#f1c2a8', '#b98573', 0.85);
    ctx.restore();
  }

  // =========================================================================
  // SHOT 2 (f86..138): Tight Front Bust eye-dart (head-exhausted -> head-notice)
  // =========================================================================
  function drawShot2EyeDart(frame) {
    const dart = tween(frame, 102, 122);
    const zoom = mix(1.0, 1.08, tween(frame, 86, 138));
    drawDawnStreet(frame, 180, 0.12);
    rect('#121c2699', 0, 0, W, H);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);
    window.drawFaceAngle(ctx, 480, 290, 1.24, 'eye-dart', {
      expression: frame < 108 ? 'head-exhausted' : 'head-notice',
      dart: mix(0, 4.6, dart),
      eyeDy: mix(0.4, -2.5, dart),
      sweat: 0.65,
    });
    // Neck burn & backpack shoulder straps aligned to front bust
    drawFrontNeckBurn(480, 398, 1.05, 0.88);
    shape('M392 390 L406 544 H438 L424 384Z M568 390 L554 544 H522 L536 384Z', '#26322d', ink, 2.8);
    // Subtle metallic glint spark upper-right on notice beat
    if (frame >= 110 && frame <= 128) {
      const s = Math.sin(((frame - 110) / 18) * Math.PI) * 18;
      ctx.save();
      ctx.translate(740, 118);
      shape(`M0 ${-s} L${s * 0.22} ${-s * 0.22} L${s} 0 L${s * 0.22} ${s * 0.22} L0 ${s} L${-s * 0.22} ${s * 0.22} L${-s} 0 L${-s * 0.22} ${-s * 0.22}Z`, '#fff6c8ee');
      ctx.restore();
    }
    ctx.restore();
    drawCornerClock('05:08 AM', 1);
  }

  // =========================================================================
  // SHOT 3 (f139..210): Subjective Upward POV Tilt at 2F BOOKS & PRINT Loft & Iron Ladder
  // =========================================================================
  function drawShot3LoftTiltPov(frame) {
    const p = tween(frame, 139, 210);
    const zoom = mix(1.0, 1.18, p);
    const tiltY = mix(64, -28, p);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270 + tiltY);

    // Pale dawn sky slice at top of narrow brick alley
    const sky = ctx.createLinearGradient(0, -80, 0, 180);
    sky.addColorStop(0, '#3a4f66');
    sky.addColorStop(1, '#9ea8b2');
    rect(sky, 0, -90, W, 240);

    // Narrow brick alley perspective walls
    drawBrickWall(0, 20, 210, 580, '#382522', '#1d1211');
    drawBrickWall(210, 44, 540, 560, '#523731', '#2c1c19');
    drawBrickWall(750, 10, 210, 590, '#32211e', '#1a100f');
    shape('M210 44 V600 M750 10 V600', null, ink, 4.0);

    // Roof cornice
    rect('#2b201e', 196, 32, 568, 26);
    shape('M196 32 H764 V58 H196Z', null, ink, 3.0);

    // Shuttered 2F loft sign: BOOKS & PRINT
    rect('#1f2629', 300, 74, 360, 52);
    shape('M300 74 H660 V126 H300Z', null, '#b5a27d', 2.8);
    label('BOOKS & PRINT', 480, 109, 28, '#e8dcc2');

    // 2F open/cracked window + wooden shutters
    rect('#11181e', 418, 146, 124, 136);
    rect('#2d221c', 362, 146, 54, 136);
    rect('#2d221c', 544, 146, 54, 136);
    for (let ly = 158; ly < 276; ly += 14) {
      rect('#1e1612', 368, ly, 42, 4);
      rect('#1e1612', 550, ly, 42, 4);
    }
    shape('M418 146 H542 V282 H418Z', null, '#6b5546', 4.5);
    rect('#6b5546', 406, 278, 148, 14);

    // Hanging spring-loaded iron drop-down fire ladder swaying gently 7ft off ground
    const sway = Math.sin(frame * 0.14) * 3.5;
    ctx.save();
    ctx.translate(480, 276);
    ctx.rotate(sway * 0.008);
    ctx.translate(-480, -276);
    // Steel spring chain housing
    rect('#2c3033', 432, 266, 96, 16);
    drawIronLadder(480, 278, 466, 78, 34);
    ctx.restore();

    // Alley ground below
    rect('#242b30', 210, 536, 540, 80);
    ctx.restore();
    drawCornerClock('05:09 AM', 1);
  }

  // =========================================================================
  // SHOT 4 (f211..277): Rear OTS Glance-Back — First Sunlight Hits Street & 2 Infected Snap Upright!
  // =========================================================================
  function drawShot4OtsDawnRunners(frame) {
    const sun = tween(frame, 220, 258);
    const wake = tween(frame, 232, 254);
    const sprint = tween(frame, 250, 277);

    drawDawnStreet(frame, 260, 0.25 + sun * 0.75);

    // Golden-amber dawn shaft hitting the street behind him
    if (sun > 0.05) {
      shape(`M580 0 L960 0 L960 540 L${mix(780, 420, sun)} 540Z`, `rgba(255, 204, 118, ${0.26 * sun})`);
    }

    // Two dark infected snapping upright and beginning to charge!
    const z1x = mix(640, 545, sprint);
    const z2x = mix(765, 650, sprint);
    const z1y = 446 + sprint * 14;
    const z2y = 440 + sprint * 12;
    drawInfected(z1x, z1y, mix(0.56, 0.68, sprint), {
      facingRight: false,
      running: frame >= 248,
      phase: frame * 0.42,
      dark: true,
    });
    drawInfected(z2x, z2y, mix(0.50, 0.60, sprint), {
      facingRight: false,
      running: frame >= 252,
      phase: frame * 0.45 + 1.8,
      dark: true,
    });

    // Wake-up alert shock lines around infected heads
    if (frame >= 234 && frame <= 252) {
      const a = 1 - (frame - 234) / 18;
      for (const [ax, ay] of [[z1x, z1y - 118], [z2x, z2y - 106]]) {
        shape(`M${ax - 22} ${ay - 12} L${ax - 34} ${ay - 22} M${ax} ${ay - 18} L${ax} ${ay - 34} M${ax + 22} ${ay - 12} L${ax + 34} ${ay - 22}`, null, `rgba(255, 224, 130, ${a})`, 2.6);
      }
    }

    // Brick alley corner wall framing left edge
    drawBrickWall(0, 0, 140, H, '#362320', '#1c1110');
    shape('M140 0 V540', null, ink, 4.0);

    // Foreground lower-left: official rear-view Series Lead + bulging dark canvas backpack (OTS framing)
    ctx.save();
    ctx.translate(mix(0, -10, wake), 0);
    window.drawAnatomyTurnaround(ctx, 218, 1140, 2.02, 'rear', { hideLimbs: false });
    // Bulging heavy dark canvas backpack in lower-left foreground
    shape('M126 364 Q218 332 308 364 L322 548 H114Z', '#2d3a34', ink, 3.2);
    shape('M148 432 H288 V530 H148Z', '#222d28', ink, 2.4);
    shape('M138 398 Q218 418 298 398', null, '#53685d', 2.6);
    ctx.restore();

    drawCornerClock('05:09 AM', 1);
  }

  // =========================================================================
  // SHOT 6 (f331..378): Tight Studio POV Hand Grip Clamping Rusted Iron Rung & Hoisting Upward
  // =========================================================================
  function drawShot6RungGripPov(frame) {
    const p = tween(frame, 331, 378);
    const zoom = mix(1.0, 1.10, p);
    const hoistY = mix(24, -22, p);
    const tremor = Math.sin(frame * 1.1) * 1.6;

    ctx.save();
    ctx.translate(480 + tremor, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Close-up textured brick wall sliding downward as he climbs up
    drawBrickWall(0, -80 + hoistY * 1.4, W, H + 160, '#50352f', '#281917');
    rect('#0b101555', 0, 0, W, H);

    // Vertical iron rails framing sides
    rect('#3a3533', 136, -60, 28, H + 120);
    rect('#3a3533', 796, -60, 28, H + 120);
    shape('M136 -60 V600 M164 -60 V600 M796 -60 V600 M824 -60 V600', null, ink, 3.0);

    // Studio POV #bar-hold hand clamping rusted horizontal iron rung with unified taped cardboard cuff!
    drawStudioCylinderGrip(() => {
      // Rusted horizontal iron rung passing straight through gripped fingers
      shape('M-240 109 H390 V139 H-240Z', '#5a4a44', ink, 2.6);
      shape('M-240 109 H390 V118 H-240Z', '#876d62', null);
      shape('M-240 132 H390 V139 H-240Z', '#362c29', null);
      // Rust flecks along iron rung
      oval(28, 124, 14, 5, '#7a493688');
      oval(210, 122, 18, 6, '#7a493688');
    }, 488, 282 + hoistY * 0.4, 180, 1.92);

    ctx.restore();
    drawCornerClock('05:09 AM', 1);
  }

  // =========================================================================
  // SHOT 7 (f379..436): Dramatic Steep Low-Angle Climb Up Brick Wall
  // =========================================================================
  function drawShot7LowAngleClimb(frame) {
    const p = tween(frame, 379, 436);
    const climbShift = mix(0, 126, p);

    // Steep upward perspective sky wedge at top
    const sky = ctx.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0, '#445c73');
    sky.addColorStop(1, '#b6b0a6');
    rect(sky, 0, 0, W, 190);

    // Brick wall looming steeply upward with converging vertical edges
    ctx.save();
    shape('M0 540 L190 0 H770 L960 540Z', '#4d332d', ink, 4.0);
    ctx.clip();
    drawBrickWall(0, -140 + (climbShift % 44), W, H + 200, '#4d332d', '#281917');
    ctx.restore();

    // Open dark 2F window approaching at top center
    const winY = mix(-32, 36, p);
    rect('#0e151a', 396, winY, 168, 120);
    shape(`M396 ${winY} H564 V${winY + 120} H396Z`, null, '#6b5546', 5);
    rect('#6b5546', 384, winY + 114, 192, 14);

    // Converging steep iron fire ladder rails & rungs
    shape('M352 540 L432 80 L446 80 L370 540Z', '#3b3634', ink, 2.4);
    shape('M590 540 L514 80 L528 80 L608 540Z', '#3b3634', ink, 2.4);
    for (let i = 0; i < 10; i++) {
      const t = ((i * 0.115) + (climbShift * 0.0022)) % 1.05;
      const ry = mix(105, 535, t);
      const lx = mix(436, 358, t);
      const rx = mix(524, 602, t);
      rect('#574a44', lx, ry, rx - lx, 6 + t * 5);
      shape(`M${lx} ${ry} H${rx} V${ry + 6 + t * 5} H${lx}Z`, null, ink, 1.8);
    }

    // Climbing lead viewed steeply from below: torso/bulging pack upper center, alternating cardboard-wrapped shins & brown boots!
    const stepCycle = (frame - 379) * 0.24;
    const leftLift = Math.max(0, Math.sin(stepCycle)) * 38;
    const rightLift = Math.max(0, -Math.sin(stepCycle)) * 38;
    const bodyY = mix(360, 250, p);

    ctx.save();
    ctx.translate(480, bodyY);
    // Bulging backpack + cream shirt hem looming above
    shape('M-76 -160 Q0 -195 76 -160 L88 -42 Q0 -18 -88 -42Z', '#2d3a34', ink, 3.2);
    shape('M-56 -110 H56 V-46 H-56Z', '#222d28', ink, 2.2);
    shape('M-64 -48 H64 L72 28 H-72Z', '#39464f', ink, 3.0);

    // Left climbing leg + cardboard & duct-tape shin wrap + brown boot
    const ly = 48 - leftLift;
    shape(`M-64 16 L-76 ${ly + 72} H-24 L-14 18Z`, '#39464f', ink, 2.8);
    shape(`M-76 ${ly + 14} H-22 L-26 ${ly + 76} H-72Z`, '#a88156', '#253a3b', 2.4);
    rect('#8c969e', -77, ly + 26, 56, 12);
    rect('#8c969e', -75, ly + 52, 52, 12);
    shape(`M-78 ${ly + 74} H-20 L-16 ${ly + 106} Q-48 ${ly + 116} -84 ${ly + 104}Z`, '#664331', ink, 2.8);
    rect('#332018', -82, ly + 96, 66, 10);

    // Right climbing leg + cardboard & duct-tape shin wrap + brown boot
    const ry = 48 - rightLift;
    shape(`M14 18 L24 ${ry + 72} H76 L64 16Z`, '#39464f', ink, 2.8);
    shape(`M22 ${ry + 14} H76 L72 ${ry + 76} H26Z`, '#a88156', '#253a3b', 2.4);
    rect('#8c969e', 21, ry + 26, 56, 12);
    rect('#8c969e', 23, ry + 52, 52, 12);
    shape(`M20 ${ry + 74} H78 L84 ${ry + 104} Q48 ${ry + 116} 16 ${ry + 106}Z`, '#664331', ink, 2.8);
    rect('#332018', 16, ry + 96, 66, 10);
    ctx.restore();

    drawCornerClock('05:10 AM', 1);
  }

  // =========================================================================
  // SHOT 8 (f437..493): High-Angle Look-Down POV from 2F Ledge — 2 Runners Slam Wall Below!
  // =========================================================================
  function drawShot8LookDownRunners(frame) {
    const slam = tween(frame, 437, 458);
    const shake = (frame >= 458 && frame <= 466) ? Math.sin((frame - 458) * 3.2) * 7 : 0;

    ctx.save();
    ctx.translate(shake, shake * 0.5);

    // Sunlit alley asphalt far below
    const road = ctx.createLinearGradient(0, 140, 0, H);
    road.addColorStop(0, '#5a5c5e');
    road.addColorStop(1, '#2f363d');
    rect(road, 0, 0, W, H);
    // Golden sunrise stripe across alley concrete
    shape('M540 0 L960 0 L960 540 L420 540Z', 'rgba(255, 206, 122, 0.24)');

    // Brick wall dropping steeply down left/top edge
    drawBrickWall(0, 0, 260, H, '#4a322d', '#241715');
    shape('M260 0 V540', null, ink, 4.5);

    // Iron fire ladder plunging straight down the brick wall
    shape('M270 0 L356 440 L372 440 L292 0Z', '#3b3634', ink, 2.4);
    shape('M444 0 L438 440 L452 440 L466 0Z', '#3b3634', ink, 2.4);
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const ry = mix(34, 412, t);
      const lx = mix(276, 354, t);
      const rx = mix(452, 444, t);
      rect('#574a44', lx, ry, rx - lx, mix(11, 5, t));
      shape(`M${lx} ${ry} H${rx} V${ry + mix(11, 5, t)} H${lx}Z`, null, ink, 1.6);
    }

    // Two daytime runners sprinting into the brick wall and clawing wildly at the bottom rung!
    const r1x = mix(760, 416, slam);
    const r2x = mix(860, 488, slam);
    const clawed = frame >= 458;
    drawInfected(r1x, 486, 0.72, { facingRight: false, running: !clawed, reachingUp: clawed, phase: frame * 0.55, dark: false });
    drawInfected(r2x, 514, 0.78, { facingRight: false, running: !clawed, reachingUp: clawed, phase: frame * 0.52 + 1.6, dark: true });

    // Impact dust & brick scrape sparks when they slam the wall
    if (frame >= 458 && frame <= 486) {
      const sp = (frame - 458) / 28;
      oval(380, 444, 24 + sp * 45, 16 + sp * 28, `rgba(210, 196, 178, ${(1 - sp) * 0.45})`);
      shape(`M386 410 L${386 + 18 * sp} ${394 - 16 * sp} M416 402 L${434 + 14 * sp} ${388 - 12 * sp}`, null, `rgba(255, 232, 168, ${1 - sp})`, 2.6);
    }

    // Lead's brown boot & cardboard-wrapped shin perched on upper rung at top-left foreground!
    ctx.save();
    ctx.translate(332, 24);
    shape('M-34 -30 H34 L28 42 H-28Z', '#a88156', '#253a3b', 2.4);
    rect('#8c969e', -34, -8, 68, 16);
    shape('M-36 38 H36 L44 74 Q0 88 -42 74Z', '#664331', ink, 3.0);
    ctx.restore();

    ctx.restore();
    drawCornerClock('05:10 AM', 1);
  }

  // =========================================================================
  // SHOT 10 (f581..642): Studio POV Window Sash Slam & Brass Latch Throw (Unified Taped Cuff!)
  // =========================================================================
  function drawShot10WindowLatchPov(frame) {
    const slamP = tween(frame, 581, 608);
    const latchP = tween(frame, 612, 630);
    const shake = (frame >= 608 && frame <= 614) ? Math.sin((frame - 608) * 3.1) * 5.5 : 0;

    ctx.save();
    ctx.translate(shake * 0.5, shake);

    // Bright morning alley visible outside window glass
    drawDawnStreet(frame, 300, 0.72);

    // Interior dusty wooden window frame
    rect('#2b201b', 0, 0, 130, H);
    rect('#2b201b', 830, 0, 130, H);
    rect('#241a15', 0, 418, W, 122);
    rect('#4f3c31', 110, 404, 740, 26);
    shape('M110 404 H850 V430 H110Z', null, ink, 3.2);

    // Upper sliding wooden window sash slamming down to meet sill
    const sashY = mix(-150, 0, slamP);
    ctx.save();
    ctx.translate(0, sashY);
    rect('rgba(194, 218, 228, 0.20)', 130, 0, 700, 386);
    // Diagonal dust streaks on glass
    shape('M210 60 L340 280 M520 40 L670 300', null, 'rgba(255, 250, 236, 0.18)', 4);
    rect('#4b382e', 130, 356, 700, 48);
    shape('M130 356 H830 V404 H130Z', null, ink, 3.2);
    rect('#3d2d25', 466, 0, 28, 360);
    ctx.restore();

    // Dust puff at sill impact
    if (frame >= 607 && frame <= 626) {
      const dp = (frame - 607) / 19;
      oval(320, 406, 40 + dp * 60, 12 + dp * 14, `rgba(222, 210, 188, ${(1 - dp) * 0.42})`);
      oval(640, 406, 40 + dp * 60, 12 + dp * 14, `rgba(222, 210, 188, ${(1 - dp) * 0.42})`);
    }

    // Heavy brass window latch plate & rotating lever on meeting rail
    const lx = 480, ly = 382 + sashY;
    rect('#9c7b38', lx - 54, ly - 18, 108, 36);
    shape(`M${lx - 54} ${ly - 18} H${lx + 54} V${ly + 18} H${lx - 54}Z`, null, ink, 2.4);
    oval(lx - 38, ly, 4.5, 4.5, '#5e491f', ink, 1.4);
    oval(lx + 38, ly, 4.5, 4.5, '#5e491f', ink, 1.4);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(mix(-0.78, 0.78, latchP));
    shape('M-44 -10 H44 Q54 0 44 10 H-44 Q-54 0 -44 -10Z', '#e0ba5a', ink, 2.4);
    shape('M-34 -4 H34', null, '#fff0b0', 2.2);
    ctx.restore();

    // Crisp 4-point brass glint when locked
    if (frame >= 629 && frame <= 641) {
      const s = Math.sin(((frame - 629) / 12) * Math.PI) * 26;
      ctx.save();
      ctx.translate(lx + 24, ly - 10);
      shape(`M0 ${-s} L${s * 0.22} ${-s * 0.22} L${s} 0 L${s * 0.22} ${s * 0.22} L0 ${s} L${-s * 0.22} ${s * 0.22} L${-s} 0 L${-s * 0.22} ${-s * 0.22}Z`, '#fff6c4ee');
      ctx.restore();
    }

    // Studio POV pinching hand (unified taped cardboard cuff!) driving sash & throwing brass latch
    const hx = mix(512, 474, latchP);
    const hy = mix(270, 412, slamP) + mix(0, 12, latchP);
    drawStudioPinchHand(hx, hy, mix(-10, 14, latchP), 1.82, false);

    ctx.restore();
    drawCornerClock('05:11 AM', 1);
  }

  // =========================================================================
  // SHOT 11 (f643..733): High-Angle Relief Pull-Back Inside Dusty 2F Bookstore Loft
  // =========================================================================
  function drawShot11LoftRelief(frame) {
    const p = tween(frame, 643, 733);
    const zoom = mix(1.13, 1.0, p);
    const slumpY = mix(0, 42, tween(frame, 650, 704));

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    drawBookstoreLoft(frame, 'morning', 0);

    // Heavy bulging backpack dropped beside him on floorboards
    ctx.save();
    ctx.translate(586, 434);
    shape('M-46 -64 Q0 -80 46 -64 L54 22 Q0 36 -54 22Z', '#2d3a34', ink, 3.0);
    shape('M-34 -24 H34 V16 H-34Z', '#222d28', ink, 2.2);
    ctx.restore();

    // Lead slumping back against bookshelf (high-angle vulnerability + relief -> exhausted)
    ctx.save();
    ctx.translate(454, 246 + slumpY);
    window.drawAnatomyTurnaround(ctx, 0, 250, 0.92, 'front', {
      hideLimbs: false,
      expression: frame < 694 ? 'head-relief' : 'head-exhausted',
      headPitch: mix(0.28, 0.56, p),
      sweat: mix(0.5, 0.15, p),
    });
    drawFrontNeckBurn(0, -104, 0.44, 0.85);
    // Cardboard forearm & shin wraps visible in seated slump
    rect('#a88156', -62, -40, 16, 40);
    rect('#8c969e', -63, -26, 18, 10);
    rect('#a88156', 46, -40, 16, 40);
    rect('#8c969e', 45, -26, 18, 10);
    ctx.restore();

    ctx.restore();
    drawCornerClock('05:11 AM', 1);
  }

  // =========================================================================
  // SHOT 12 (f734..815): Overhead Top-Down Floor Unpack Insert
  // =========================================================================
  function drawShot12FloorUnpack(frame) {
    const p = tween(frame, 734, 815);
    const zoom = mix(1.0, 1.06, p);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Overhead wooden plank floor
    rect('#3a2d24', 0, 0, W, H);
    for (let y = 0; y < H; y += 54) {
      rect(y % 108 === 0 ? '#3f3127' : '#352921', 0, y, W, 52);
      shape(`M0 ${y} H${W}`, null, '#18110c88', 2.2);
    }

    // Unzipped bulging dark canvas backpack top-left
    ctx.save();
    ctx.translate(250, 260);
    ctx.rotate(-0.14);
    shape('M-150 -140 Q0 -174 150 -140 L166 138 Q0 172 -166 138Z', '#2d3a34', ink, 4.0);
    shape('M-116 -108 Q0 -134 116 -108 L128 96 Q0 120 -128 96Z', '#1b2420', ink, 3.0);
    shape('M-128 -102 Q0 -124 128 -102', null, '#b8c4c9', 4.0);
    ctx.restore();

    // Food cans (3 tins)
    for (const [cx, cy, col] of [[492, 166, '#c74d44'], [574, 152, '#d99e45'], [534, 232, '#4e8a6b']]) {
      oval(cx + 5, cy + 6, 36, 36, '#0a0d1055');
      oval(cx, cy, 35, 35, col, ink, 3.0);
      oval(cx, cy, 27, 27, '#c7d0d4', ink, 2.0);
      oval(cx, cy, 18, 18, null, '#8c989e', 1.4);
    }

    // Two water bottles
    for (const [wx, wy, rot] of [[684, 174, 0.18], [768, 206, -0.10]]) {
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(rot);
      shape('M-24 -64 H24 V66 Q0 76 -24 66Z', '#78bfe6cc', ink, 2.8);
      rect('#e6f4faaa', -22, -16, 44, 34);
      rect('#2c7fb8', -12, -82, 24, 18);
      shape('M-12 -82 H12 V-64 H-12Z', null, ink, 2.2);
      ctx.restore();
    }

    // Fresh gray duct-tape roll
    oval(496, 368, 52, 52, '#8c969e', ink, 3.2);
    oval(496, 368, 22, 22, '#a88156', ink, 2.6);
    oval(496, 368, 15, 15, '#3a2d24', ink, 1.8);

    // Chipped & slightly bent kitchen knife laid prominently lower-right
    ctx.save();
    ctx.translate(684, 368);
    ctx.rotate(-0.22);
    ctx.scale(1.42, 1.42);
    drawChippedBentKnife(tween(frame, 760, 804));
    ctx.restore();

    // Soft morning light shaft across floor
    shape('M420 0 L920 0 L760 540 L240 540Z', 'rgba(235, 242, 250, 0.14)');
    ctx.restore();
    drawCornerClock('05:11 AM', 1);
  }

  // =========================================================================
  // SHOT 13 (f816..892): Tight Front Bust — Touching Raw Red Smoker Rope-Burn on Neck
  // =========================================================================
  function drawShot13TouchNeckBurn(frame) {
    const reach = tween(frame, 824, 854);
    const wince = tween(frame, 856, 876);
    const zoom = mix(1.0, 1.07, tween(frame, 816, 892));

    drawBookstoreLoft(frame, 'morning', -30);
    rect('#0b111688', 0, 0, W, H);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    window.drawAnatomyTurnaround(ctx, 480, 1490, 3.12, 'front', {
      hideLimbs: false,
      expression: frame < 862 ? 'head-pain' : 'head-dread',
      headTilt: mix(0, -5, wince),
      eyeOffset: [mix(0, -2.0, wince), 1.0],
      sweat: 0.42,
    });

    // Prominent raw red Smoker rope-burn across mid-neck
    drawFrontNeckBurn(480, 286, 1.32, 0.92);

    // Unified taped cardboard-cuff hand brushing gently across the neck burn
    const hx = mix(710, 524, reach) + wince * 16;
    const hy = mix(510, 306, reach) + wince * 8;
    drawStudioPinchHand(hx, hy, mix(-28, -14, reach), 1.62, true);

    ctx.restore();
    drawCornerClock('05:11 AM', 1);
  }

  // =========================================================================
  // SHOT 14 (f893..988): Downward POV Blade Inspection (pov-pipe-grip + Unified Taped Cuff!)
  // =========================================================================
  function drawShot14BladeInspection(frame) {
    const p = tween(frame, 893, 988);
    const zoom = mix(1.0, 1.15, p);
    const tilt = Math.sin(p * Math.PI) * 10;

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Dusty loft floorboards behind blade
    rect('#261e19', 0, 0, W, H);
    for (let y = 0; y < H; y += 64) {
      rect(y % 128 === 0 ? '#2b221c' : '#221a15', 0, y, W, 62);
      shape(`M0 ${y} H${W}`, null, '#100c09aa', 2.4);
    }

    // Shaft of morning daylight slicing across the blade
    shape('M140 0 L480 0 L680 540 L310 540Z', 'rgba(235, 242, 248, 0.16)');

    // Studio POV cylinder grip hand turning the chipped & bent kitchen knife
    drawStudioCylinderGrip(() => {
      ctx.save();
      ctx.translate(78, 124);
      ctx.scale(-1.26, 1.26);
      drawChippedBentKnife(tween(frame, 912, 972));
      ctx.restore();
    }, 526, 332, 148 + tilt, 1.96);

    ctx.restore();
    drawCornerClock('05:11 AM', 1);
  }

  // =========================================================================
  // SHOT 15 (f989..1065): Slatted Wooden Shutter POV — Blazing Daylight Horde (09:15 AM)
  // =========================================================================
  function drawShot15ShutterHordePov(frame) {
    const peek = Math.sin(tween(frame, 989, 1065) * Math.PI) * 24;

    ctx.save();
    ctx.translate(-peek, 0);
    // Blazing morning sunlit street
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#c8dff0');
    sky.addColorStop(0.55, '#f2e0b6');
    sky.addColorStop(1, '#c4b8a6');
    rect(sky, -40, 0, W + 80, H);

    // Opposite sunlit storefronts
    rect('#877463', -20, 60, 280, 260);
    rect('#756658', 280, 30, 320, 290);
    rect('#8c7968', 620, 70, 380, 250);
    rect('#585a5c', -40, 310, W + 80, 230);

    // Fast-moving daytime runners swarming both directions in harsh sun!
    for (let i = 0; i < 10; i++) {
      const dirRight = i % 2 === 0;
      const spd = 11 + (i % 3) * 3.5;
      const rawX = ((frame - 989) * spd + i * 145) % (W + 260) - 130;
      const zx = dirRight ? rawX : W - rawX;
      const zy = 372 + (i % 4) * 34;
      drawInfected(zx, zy, 0.56 + (i % 3) * 0.09, {
        facingRight: dirRight,
        running: true,
        phase: frame * 0.52 + i * 1.3,
        dark: false,
      });
    }
    rect('rgba(255, 236, 184, 0.20)', -40, 0, W + 80, H);
    ctx.restore();

    // Dark horizontal wooden shutter louvers framing the POV peek
    for (let ly = 0; ly < H; ly += 84) {
      rect('#1a1410', 0, ly, W, 38);
      rect('#2c221b', 0, ly + 30, W, 8);
      shape(`M0 ${ly} H${W} M0 ${ly + 38} H${W}`, null, '#0a0806', 2.4);
    }
    rect('#120e0b', 0, 0, 56, H);
    rect('#120e0b', W - 56, 0, 56, H);
    drawCornerClock('09:15 AM', 1);
  }

  // =========================================================================
  // SHOT 16 (f1066..1141): Time-Lapse #1 (14:20 PM) — Sweeping Afternoon Sunbeams
  // =========================================================================
  function drawShot16AfternoonTimelapse(frame) {
    const p = tween(frame, 1066, 1141);
    const beamShift = mix(-140, 120, p);
    drawBookstoreLoft(frame, 'afternoon', beamShift);

    // Bulging backpack beside him
    ctx.save();
    ctx.translate(310, 444);
    shape('M-42 -58 Q0 -72 42 -58 L48 20 Q0 32 -48 20Z', '#2d3a34', ink, 2.8);
    ctx.restore();

    // Lead seated quietly eating from a tin can against far bookshelf
    ctx.save();
    ctx.translate(412, 286);
    window.drawAnatomyTurnaround(ctx, 0, 240, 0.88, 'front', {
      hideLimbs: false,
      expression: 'head-exhausted',
      headPitch: 0.44,
    });
    drawFrontNeckBurn(0, -98, 0.42, 0.82);
    // Tin can held in lap
    rect('#d99e45', -14, -22, 28, 32);
    shape('M-14 -22 H14 V10 H-14Z', null, ink, 2.0);
    ctx.restore();

    drawCornerClock('14:20 PM', 1);
  }

  // =========================================================================
  // SHOT 17 (f1142..1223): Time-Lapse #2 (20:45 PM) — Dusk Cools Into Deep Indigo Night
  // =========================================================================
  function drawShot17DuskToNight(frame) {
    const p = tween(frame, 1142, 1223);
    drawBookstoreLoft(frame, p < 0.45 ? 'dusk' : 'night', mix(80, 180, p));

    // Smooth dusk-to-night color wash transition
    rect(`rgba(10, 18, 32, ${mix(0.12, 0.48, p)})`, 0, 0, W, H);

    // Bulging backpack & cracked phone lying beside his knee on floor
    ctx.save();
    ctx.translate(310, 444);
    shape('M-42 -58 Q0 -72 42 -58 L48 20 Q0 32 -48 20Z', '#242e29', ink, 2.8);
    ctx.restore();
    // Dark smartphone resting on floorboards to right of his knee
    rect('#151c24', 506, 466, 36, 16);
    shape('M506 466 H542 V482 H506Z', null, '#3b4a59', 1.6);

    // Lead slumped exhausted in dim shadow
    ctx.save();
    ctx.translate(412, 286);
    window.drawAnatomyTurnaround(ctx, 0, 240, 0.88, 'front', {
      hideLimbs: false,
      expression: 'head-exhausted',
      headPitch: 0.58,
    });
    drawFrontNeckBurn(0, -98, 0.42, 0.72);
    ctx.restore();

    drawCornerClock('20:45 PM', 1);
  }

  // =========================================================================
  // SHOT 18 (f1224..1300): Sudden Floorboard Insert — Phone Vibrates Violently (7% EMERGENCY BROADCAST!)
  // =========================================================================
  function drawShot18PhoneBuzzFloor(frame) {
    const lit = frame >= 1238;
    const buzz1 = frame >= 1238 && frame <= 1254;
    const buzz2 = frame >= 1264 && frame <= 1280;
    const buzzing = buzz1 || buzz2;
    const vx = buzzing ? Math.sin(frame * 4.8) * 6.5 : 0;
    const vy = buzzing ? Math.cos(frame * 5.2) * 3.5 : 0;

    // Dark wooden floorboards
    rect('#151314', 0, 0, W, H);
    for (let y = 0; y < H; y += 64) {
      rect(y % 128 === 0 ? '#1c1817' : '#161312', 0, y, W, 62);
      shape(`M0 ${y} H${W}`, null, '#090808', 2.4);
    }

    // Blue glow spilled onto floorboards when screen flares ON
    if (lit) {
      const bg = ctx.createRadialGradient(480, 276, 30, 480, 276, 360);
      bg.addColorStop(0, 'rgba(116, 196, 255, 0.44)');
      bg.addColorStop(1, 'rgba(70, 140, 220, 0)');
      rect(bg, 80, 0, 800, H);
    }

    // Edge of his trouser knee & taped shin wrap left
    shape('M0 160 L156 230 L132 540 H0Z', '#263038', ink, 3.2);
    shape('M118 330 L176 350 L156 540 H96Z', '#785c3e', ink, 2.4);
    rect('#687278', 110, 410, 62, 26);

    // Cracked smartphone on floorboards
    ctx.save();
    ctx.translate(486 + vx, 276 + vy);
    ctx.rotate(-0.18);
    shape('M-136 -74 Q-136 -86 -124 -86 H124 Q136 -86 136 -74 V74 Q136 86 124 86 H-124 Q-136 86 -136 74Z', '#181e24', ink, 4.0);
    rect(lit ? '#12273c' : '#0b1015', -116, -68, 232, 136);
    if (lit) {
      rect('#b82828', -106, -58, 212, 28);
      label('7% BATTERY', 0, -38, 16, '#fff2b0');
      label('EMERGENCY', 0, 8, 24, '#ffffff');
      label('BROADCAST', 0, 38, 24, '#ffd44d');
      // Subtle glass cracks
      shape('M-116 -12 L-54 10 L-18 68 M-54 10 L14 -32', null, 'rgba(220, 240, 255, 0.35)', 1.6);
    }
    // Vibration motion arcs during BZZZ-BZZZ bursts
    if (buzzing) {
      shape('M-156 -48 Q-172 0 -156 48 M-172 -32 Q-186 0 -172 32 M156 -48 Q172 0 156 48 M172 -32 Q186 0 172 32', null, '#9ed8ffdd', 3.4);
    }
    ctx.restore();

    drawCornerClock('21:10 PM', 1);
  }

  // =========================================================================
  // SHOT 19 (f1301..1362): Tight Front Reaction (head-alarm -> head-notice, Blue Under-Glow)
  // =========================================================================
  function drawShot19PhoneGrabReaction(frame) {
    const lunge = tween(frame, 1326, 1358);
    const zoom = mix(1.0, 1.12, lunge);

    drawBookstoreLoft(frame, 'night', 160);
    rect('#050910bb', 0, 0, W, H);

    ctx.save();
    ctx.translate(480, 270 + lunge * 28);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    window.drawAnatomyTurnaround(ctx, 480, 1340, 2.66, 'front', {
      hideLimbs: false,
      expression: frame < 1330 ? 'head-alarm' : 'head-notice',
      headPitch: mix(0.15, 0.62, lunge),
      eyeOffset: [0, mix(0.6, 2.8, lunge)],
      sweat: 0.45,
    });
    drawFrontNeckBurn(480, 342, 1.12, 0.90);

    // Cold blue screen under-glow rising onto his face & collar
    const ug = ctx.createRadialGradient(480, 520, 24, 480, 330, 340);
    ug.addColorStop(0, 'rgba(118, 202, 255, 0.44)');
    ug.addColorStop(1, 'rgba(118, 202, 255, 0)');
    rect(ug, 120, 80, 720, 460);

    ctx.restore();
    drawCornerClock('21:10 PM', 1);
  }

  // =========================================================================
  // SHOT 20 (f1363..1482): Downward POV Phone Screen (APEX TOWER EVAC + 7% -> 6% Tick!)
  // =========================================================================
  function drawShot20PhoneBroadcastPov(frame) {
    const p = tween(frame, 1363, 1482);
    const zoom = mix(1.0, 1.18, p);
    const batt6 = frame >= 1435;
    const redFlash = batt6 && Math.floor((frame - 1435) / 6) % 2 === 0;

    drawBookstoreLoft(frame, 'night', 160);
    rect('#060b12cc', 0, 0, W, H);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Blue screen aura
    const bg = ctx.createRadialGradient(480, 260, 40, 480, 260, 340);
    bg.addColorStop(0, 'rgba(104, 188, 255, 0.34)');
    bg.addColorStop(1, 'rgba(104, 188, 255, 0)');
    rect(bg, 120, 0, 720, H);

    // Unified taped cardboard-cuff forearm + thumb/hand cradling glowing smartphone
    ctx.save();
    ctx.translate(316, 468);
    ctx.rotate(-0.46);
    ctx.scale(1.18, 1.18);
    drawUnifiedArmoredCuff(170);
    ctx.restore();
    // Fingers gripping right bezel behind phone
    for (const fy of [188, 240, 292, 342]) {
      shape(`M606 ${fy} Q646 ${fy} 648 ${fy + 16} Q648 ${fy + 32} 606 ${fy + 32}Z`, '#d49a79', '#253a3b', 2.4);
    }

    // Smartphone chassis
    shape('M332 76 Q332 54 354 54 H606 Q628 54 628 76 V446 Q628 468 606 468 H354 Q332 468 332 446Z', '#181f26', ink, 4.2);
    rect('#0f2236', 348, 76, 264, 370);

    // Top status bar + battery tick 7% -> 6%
    rect('#0a1624', 348, 76, 264, 34);
    label('21:10', 384, 99, 15, '#cde4f5');
    rect(redFlash ? '#ff4642' : '#c9302c', 536, 84, 64, 20);
    label(batt6 ? '6%' : '7%', 568, 100, 15, '#ffffff');

    // Red emergency banner
    rect('#b82828', 358, 120, 244, 34);
    label('EMERGENCY BROADCAST', 480, 143, 16, '#fff2b0');

    // Broadcast body copy
    label('FINAL EVAC', 480, 198, 26, '#ffffff');
    label('HELICOPTER', 480, 230, 26, '#ffffff');
    rect('#ffd44d', 384, 248, 192, 3);
    label('APEX TOWER', 480, 286, 25, '#ffd44d');
    label('ROOFTOP', 480, 316, 24, '#ffd44d');
    label('TOMORROW DAWN', 480, 356, 20, '#d8eefc');
    label('DO NOT MISS WINDOW', 480, 386, 17, '#ff7b76');

    // Subtle sonar pulse graphic at bottom
    const pulse = ((frame - 1363) % 24) / 24;
    oval(480, 418, 10 + pulse * 54, 4 + pulse * 14, null, `rgba(128, 214, 255, ${(1 - pulse) * 0.75})`, 2.0);

    // Cracked screen glass lines
    shape('M348 166 L418 202 L462 272 M418 202 L488 156', null, 'rgba(220, 242, 255, 0.32)', 1.6);

    // Left thumb wrapping cleanly over lower-left bezel
    shape('M312 310 Q344 300 364 318 Q376 336 356 356 Q334 368 308 354Z', '#e7ae87', '#253a3b', 2.4);

    ctx.restore();
    drawCornerClock('21:10 PM', 1);
  }

  // =========================================================================
  // SHOT 21 (f1483..1564): eye-dart Right -> Fast Whip-Pan -> Fingers Parting Dusty Shutter Louvers
  // =========================================================================
  function drawShot21EyeDartWhipShutter(frame) {
    if (frame < 1515) {
      const dart = tween(frame, 1488, 1506);
      drawBookstoreLoft(frame, 'night', 160);
      rect('#050a12aa', 0, 0, W, H);
      window.drawFaceAngle(ctx, 480, 290, 1.24, 'eye-dart', {
        expression: 'head-notice',
        dart: mix(0, 5.2, dart),
        eyeDy: -0.6,
        sweat: 0.25,
      });
      drawFrontNeckBurn(480, 398, 1.05, 0.88);
    } else if (frame < 1530) {
      // Fast horizontal whip-pan motion-blur streaks sweeping right
      const wp = (frame - 1515) / 15;
      rect('#0d141d', 0, 0, W, H);
      for (let i = 0; i < 18; i++) {
        const y = i * 32;
        const x = ((i * 97 - wp * 1200) % (W + 300));
        rect(i % 2 === 0 ? '#24303e88' : '#18212b99', x, y, 360, 18);
      }
      rect('rgba(16, 26, 38, 0.35)', 0, 0, W, H);
    } else {
      // Close-up taped-cuff fingers parting two dusty wooden shutter louvers
      const open = tween(frame, 1534, 1560);
      // Cold midnight sky + faint red distant pinpoint peeking through the widening slit
      rect('#091322', 0, 0, W, H);
      const slitH = mix(18, 92, open);
      // Distant Apex Tower silhouette & red beacon pinpoint in the slit
      rect('#121d2b', 454, 210, 44, 120);
      if (Math.floor(frame / 10) % 2 === 0) {
        oval(476, 232, 6, 6, '#ff423d');
        const rg = ctx.createRadialGradient(476, 232, 4, 476, 232, 42);
        rg.addColorStop(0, 'rgba(255, 66, 61, 0.55)');
        rg.addColorStop(1, 'rgba(255, 66, 61, 0)');
        rect(rg, 430, 190, 92, 84);
      }
      // Upper & lower shutter louvers parting cleanly
      rect('#221a15', 0, 0, W, 240 - slitH * 0.5);
      rect('#221a15', 0, 240 + slitH * 0.5, W, H);
      for (let ly = 24; ly < 220 - slitH * 0.5; ly += 48) {
        shape(`M0 ${ly} H${W}`, null, '#0c0907', 4);
      }
      for (let ly = 290 + slitH * 0.5; ly < H; ly += 48) {
        shape(`M0 ${ly} H${W}`, null, '#0c0907', 4);
      }
      shape(`M0 ${240 - slitH * 0.5} H${W} M0 ${240 + slitH * 0.5} H${W}`, null, '#46372d', 4);

      // Taped-cuff hand reaching from lower-right to press bottom louver open
      drawStudioPinchHand(660, 290 + open * 36, -12, 1.78, true);
    }
    drawCornerClock('21:10 PM', 1);
  }

  // =========================================================================
  // SHOT 22 (f1565..1669): Stepped 1.0x -> 1.38x Skyline Push-In — APEX TOWER Blinking Red Beacon!
  // =========================================================================
  function drawShot22ApexTowerBeacon(frame) {
    // Stepped push-in (1.0 -> 1.18 -> 1.38 with subtle micro-creep)
    let zoom = 1.0 + tween(frame, 1565, 1595) * 0.04;
    if (frame >= 1598 && frame < 1632) zoom = 1.18 + tween(frame, 1598, 1632) * 0.04;
    else if (frame >= 1632) zoom = 1.34 + tween(frame, 1632, 1669) * 0.06;

    const beaconOn = Math.floor((frame - 1565) / 14) % 2 === 0;
    const fogDrift = (frame - 1565) * 0.55;

    ctx.save();
    ctx.translate(540, 230);
    ctx.scale(zoom, zoom);
    ctx.translate(-540, -230);

    // Midnight indigo sky
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050b14');
    sky.addColorStop(0.65, '#102033');
    sky.addColorStop(1, '#1d3247');
    rect(sky, -120, -80, W + 240, H + 160);

    // Drifting mid-air cloud/fog layers
    oval(260 + fogDrift, 290, 260, 48, 'rgba(134, 168, 198, 0.12)');
    oval(680 - fogDrift * 0.8, 320, 300, 56, 'rgba(134, 168, 198, 0.14)');

    // APEX TOWER (tallest tapered skyscraper piercing the clouds)
    shape('M498 460 L512 154 L536 118 L544 118 L568 154 L582 460Z', '#0c1622', ink, 2.8);
    rect('#17283b', 518, 162, 44, 240);
    // Faint vertical glass ribs on Apex Tower
    for (let gx = 524; gx <= 556; gx += 10) {
      shape(`M${gx} 164 V400`, null, '#243c54', 1.4);
    }
    // Tall rooftop spire mast
    shape('M540 118 V76', null, '#485f75', 3.4);

    // Blinking red rooftop aviation beacon!
    if (beaconOn) {
      const rg = ctx.createRadialGradient(540, 76, 4, 540, 76, 118);
      rg.addColorStop(0, 'rgba(255, 68, 62, 0.92)');
      rg.addColorStop(0.35, 'rgba(255, 52, 48, 0.36)');
      rg.addColorStop(1, 'rgba(255, 48, 44, 0)');
      rect(rg, 420, -44, 240, 240);
      oval(540, 76, 6.5, 6.5, '#ff6862');
      oval(540, 76, 22, 22, null, 'rgba(255, 110, 102, 0.55)', 2.0);
    } else {
      oval(540, 76, 4, 4, '#591818');
    }

    // Jagged foreground dark rooftops
    shape('M-80 540 V340 L60 326 L60 390 L180 370 L180 310 L310 310 L310 410 L430 392 L430 430 L640 412 L640 330 L780 342 L780 388 L920 350 L1040 370 V540Z', '#091119', ink, 3.0);
    // Low fog rolling across rooftops
    oval(480 + fogDrift * 0.6, 420, 440, 52, 'rgba(130, 166, 196, 0.16)');

    ctx.restore();
    drawCornerClock('21:10 PM', 1);
  }

  // =========================================================================
  // SHOT 23 (f1670..1761): Tight POV Knife Into Sheath + Heavy Backpack Strap Cinch
  // =========================================================================
  function drawShot23SheathAndStrap(frame) {
    drawBookstoreLoft(frame, 'night', 160);
    rect('#050a10aa', 0, 0, W, H);

    if (frame < 1716) {
      // Beat A: Sliding chipped & bent kitchen knife cleanly into backpack side sheath
      const slide = tween(frame, 1676, 1710);
      // Heavy dark canvas backpack side panel + leather/canvas knife sheath
      ctx.save();
      ctx.translate(460, 280);
      shape('M-220 -210 Q-20 -240 160 -190 L190 240 H-240Z', '#2d3a34', ink, 4.2);
      shape('M-160 -120 H80 V180 H-160Z', '#222d28', ink, 3.0);
      // Sheath pocket
      shape('M-40 -10 H60 L48 210 H-28Z', '#181e1b', ink, 3.4);
      // Chipped & bent knife sliding cleanly downward into sheath
      ctx.save();
      ctx.translate(10, mix(-124, 16, slide));
      ctx.rotate(Math.PI / 2);
      ctx.scale(1.38, 1.38);
      drawChippedBentKnife(-1);
      ctx.restore();
      // Front sheath lip overlapping blade as it enters
      shape('M-40 -10 H60 L48 210 H-28Z', '#1b2420', ink, 3.4);
      rect('#495c52', -34, 4, 88, 10);
      ctx.restore();

      // Unified taped cardboard-cuff hand pushing handle down
      drawStudioPinchHand(522, mix(118, 258, slide), 18, 1.72, true);
    } else {
      // Beat B: Cinching heavy dark canvas backpack strap tight!
      const cinch = tween(frame, 1722, 1752);
      // Torso/cream shirt + diagonal heavy canvas backpack strap
      shape('M190 40 H770 V540 H190Z', '#d4ccb8', ink, 3.6);
      shape('M290 40 L348 540 H434 L374 40Z', '#242e29', ink, 3.6);
      // Plastic buckle + cinch pull webbing
      const pullY = mix(270, 344, cinch);
      rect('#151a1d', 324, 240, 86, 48);
      shape('M324 240 H410 V288 H324Z', null, '#5a6870', 2.4);
      shape(`M354 288 L${354 + cinch * 18} ${pullY + 90} L${394 + cinch * 18} ${pullY + 86} L388 288Z`, '#1b2320', ink, 2.8);

      // Unified taped cardboard-cuff hand gripping & yanking strap taut
      drawStudioCylinderGrip(() => {}, 430 + cinch * 16, pullY + 20, 152, 1.88);
    }

    drawCornerClock('21:10 PM', 1);
  }

  // =========================================================================
  // SHOT 24 (f1762..1871): Dramatic Low-Angle Cliffhanger Hold (1.0x -> 1.14x, Fade to Black 1870..1872)
  // =========================================================================
  function drawShot24LowAngleCliffhanger(frame) {
    const p = tween(frame, 1762, 1870);
    const zoom = mix(1.0, 1.14, p);
    const beaconOn = Math.floor((frame - 1762) / 14) % 2 === 0;

    // Midnight loft interior with open 2F window revealing fog & blinking red Apex Tower beacon behind him
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#070e18');
    sky.addColorStop(0.65, '#132436');
    sky.addColorStop(1, '#1c2f42');
    rect(sky, 0, 0, W, H);

    // Distant Apex Tower silhouette & blinking red beacon outside window right
    rect('#0b141f', 710, 130, 56, 280);
    shape('M738 130 V88', null, '#3e5266', 3.0);
    if (beaconOn) {
      const rg = ctx.createRadialGradient(738, 88, 3, 738, 88, 72);
      rg.addColorStop(0, 'rgba(255, 62, 58, 0.85)');
      rg.addColorStop(1, 'rgba(255, 52, 48, 0)');
      rect(rg, 660, 14, 156, 150);
      oval(738, 88, 5, 5, '#ff6862');
    }

    // Dark loft window mullions & side bookshelf framing
    rect('#12161b', 0, 0, 210, H);
    rect('#12161b', 830, 0, 130, H);
    shape('M210 0 V540 M830 0 V540 M210 380 H830', null, ink, 5.0);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Official cinematic low-angle Series Lead (head-determined, looming upward!)
    window.drawCinematicAngle(ctx, 480, 326, 1.48, 'low-angle');

    // Continuity details locked cleanly to low-angle torso/neck:
    // 1. Raw red Smoker rope-burn across mid-neck
    drawFrontNeckBurn(480, 352, 1.06, 0.88);
    // 2. Heavy dark canvas backpack shoulder straps
    shape('M392 356 L406 544 H440 L424 348Z M568 356 L554 544 H520 L536 348Z', '#26322d', ink, 2.8);

    // 3. Subtle red Apex Tower beacon catchlight glinting inside his pupils
    if (beaconOn) {
      oval(446, 204, 2.0, 2.0, '#ff6e68cc');
      oval(514, 204, 2.0, 2.0, '#ff6e68cc');
    }

    ctx.restore();
    drawCornerClock('21:10 PM', 1);

    // Clean fade/cut to black at 1870..1872
    if (frame >= 1870) {
      rect(`rgba(0, 0, 0, ${clamp((frame - 1869) / 2)})`, 0, 0, W, H);
    }
  }

  // =========================================================================
  // MASTER COMPOSITOR ENTRY POINT: renderCh2aFrame (1,872 frames, 78.0 s @ 24 fps)
  // =========================================================================
  globalThis.renderCh2aFrame = async function renderCh2aFrame(frame, cutoutBase64, anchors) {
    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    if (frame < 86) {
      // Shot 1 (0..85, 0:00.0-0:03.6): Pale gray dawn wide (05:08 AM) + 1.5x foreground streetlamp pole parallax wipe
      const p = tween(frame, 0, 85);
      drawDawnStreet(frame, p * 180, 0.15);
      await drawArmoredLead(cutoutBase64, anchors, mix(170, 540, p), 468, 0.75, { bulgingPack: true, neckScuff: true });
      oval(440 - p * 90, 474, 270, 42, 'rgba(176, 198, 214, 0.14)');
      const poleX = mix(920, -140, clamp(p * 1.35));
      rect('#0b1016ee', poleX, 0, 42, H);
      rect('#1a2530cc', poleX + 36, 0, 6, H);
      drawCornerClock('05:08 AM', 1);
    } else if (frame < 139) {
      // Shot 2 (86..138, 0:03.6-0:05.8): Tight front bust eye-dart
      drawShot2EyeDart(frame);
    } else if (frame < 211) {
      // Shot 3 (139..210, 0:05.8-0:08.8): Subjective upward POV tilt at BOOKS & PRINT loft & iron fire ladder
      drawShot3LoftTiltPov(frame);
    } else if (frame < 278) {
      // Shot 4 (211..277, 0:08.8-0:11.6): Rear OTS glance-back — first sunrise wakes 2 runners!
      drawShot4OtsDawnRunners(frame);
    } else if (frame < 331) {
      // Shot 5 (278..330, 0:11.6-0:13.8): Dynamic alley side leap-catch pulling spring-loaded iron ladder down!
      const dropP = tween(frame, 298, 314);
      const shake = (frame >= 298 && frame <= 306) ? Math.sin((frame - 298) * 3.1) * 6.5 : 0;
      ctx.save();
      ctx.translate(shake, shake * 0.5);
      drawDawnStreet(frame, 240, 0.45);
      drawBrickWall(320, 0, 640, 442, '#4c322c', '#261816');
      shape('M320 0 V442', null, ink, 4.0);
      // 2F window high up
      rect('#121a20', 474, 0, 124, 92);
      shape('M474 0 V92 H598 V0', null, '#6b5546', 4.5);
      // Iron drop-down fire ladder dropping cleanly on catch!
      const ladderBottom = mix(244, 396, dropP);
      drawIronLadder(536, 62, ladderBottom, 74, 34);
      // Metallic impact dust/sparks on catch
      if (frame >= 298 && frame <= 316) {
        const sp = (frame - 298) / 18;
        shape(`M490 250 L${466 - sp * 18} ${238 - sp * 14} M582 250 L${606 + sp * 18} ${238 - sp * 14}`, null, `rgba(255, 232, 166, ${1 - sp})`, 2.6);
      }
      await drawArmoredLead(cutoutBase64, anchors, mix(360, 504, tween(frame, 278, 304)), 468, 0.78, { bulgingPack: true, neckScuff: true });
      ctx.restore();
      drawCornerClock('05:09 AM', 1);
    } else if (frame < 379) {
      // Shot 6 (331..378, 0:13.8-0:15.8): Tight studio POV hand grip clamping rusted iron rung
      drawShot6RungGripPov(frame);
    } else if (frame < 437) {
      // Shot 7 (379..436, 0:15.8-0:18.2): Dramatic steep low-angle climb up brick wall
      drawShot7LowAngleClimb(frame);
    } else if (frame < 494) {
      // Shot 8 (437..493, 0:18.2-0:20.6): High-angle look-down POV — 2 runners slam brick wall below!
      drawShot8LookDownRunners(frame);
    } else if (frame < 581) {
      // Shot 9 (494..580, 0:20.6-0:24.2): Side 2F window hoist hauling heavy iron ladder UP & locking steel catch!
      const hoistP = tween(frame, 498, 560);
      const locked = frame >= 562;
      const shake = (frame >= 562 && frame <= 569) ? Math.sin((frame - 562) * 3.1) * 5.5 : 0;
      ctx.save();
      ctx.translate(shake, shake * 0.4);
      drawDawnStreet(frame, 290, 0.65);
      // Loft interior wall left + brick exterior right
      rect('#292420', 0, 0, 560, H);
      rect('#3b2d24', 0, 442, 560, 98);
      drawBrickWall(560, 0, 400, 442, '#4d332d', '#281917');
      // Open 2F window frame & sill
      rect('#4f3c31', 536, 0, 38, 120);
      rect('#4f3c31', 536, 366, 38, 174);
      rect('#695244', 524, 358, 66, 18);
      shape('M524 358 H590 V376 H524Z', null, ink, 2.8);
      // Iron ladder hoisting straight UP past the 2F sill — aligned flush with gripping hands!
      const ladderTop = mix(190, 20, hoistP);
      drawIronLadder(596, ladderTop, ladderTop + 340, 68, 34);
      // Steel wall catch hook snapping shut at frame 562
      rect('#2f353b', 556, 134, 30, 18);
      shape(locked ? 'M576 142 L598 142 L594 162' : 'M576 142 L594 122', null, '#94a2ac', 5.0);
      if (frame >= 562 && frame <= 574) {
        const s = Math.sin(((frame - 562) / 12) * Math.PI) * 20;
        ctx.save();
        ctx.translate(588, 144);
        shape(`M0 ${-s} L${s * 0.22} ${-s * 0.22} L${s} 0 L${s * 0.22} ${s * 0.22} L0 ${s} L${-s * 0.22} ${s * 0.22} L${-s} 0 L${-s * 0.22} ${-s * 0.22}Z`, '#fff6c4ee');
        ctx.restore();
      }
      await drawArmoredLead(cutoutBase64, anchors, 474, 466, 0.80, { bulgingPack: true, neckScuff: true });
      ctx.restore();
      drawCornerClock('05:10 AM', 1);
    } else if (frame < 643) {
      // Shot 10 (581..642, 0:24.2-0:26.8): Studio POV window sash slam & brass latch throw
      drawShot10WindowLatchPov(frame);
    } else if (frame < 734) {
      // Shot 11 (643..733, 0:26.8-0:30.6): High-angle relief pull-back inside dusty 2F bookstore loft
      drawShot11LoftRelief(frame);
    } else if (frame < 816) {
      // Shot 12 (734..815, 0:30.6-0:34.0): Overhead top-down floor unpack insert
      drawShot12FloorUnpack(frame);
    } else if (frame < 893) {
      // Shot 13 (816..892, 0:34.0-0:37.2): Tight front bust touching raw red Smoker neck burn
      drawShot13TouchNeckBurn(frame);
    } else if (frame < 989) {
      // Shot 14 (893..988, 0:37.2-0:41.2): Downward POV blade inspection (chipped & bent tip)
      drawShot14BladeInspection(frame);
    } else if (frame < 1066) {
      // Shot 15 (989..1065, 0:41.2-0:44.4): Slatted wooden shutter POV (09:15 AM) — daytime horde
      drawShot15ShutterHordePov(frame);
    } else if (frame < 1142) {
      // Shot 16 (1066..1141, 0:44.4-0:47.6): Time-lapse #1 (14:20 PM) — sweeping afternoon sunbeams
      drawShot16AfternoonTimelapse(frame);
    } else if (frame < 1224) {
      // Shot 17 (1142..1223, 0:47.6-0:51.0): Time-lapse #2 (20:45 PM) — dusk cools into indigo night
      drawShot17DuskToNight(frame);
    } else if (frame < 1301) {
      // Shot 18 (1224..1300, 0:51.0-0:54.2): Sudden floorboard insert — phone vibrates violently!
      drawShot18PhoneBuzzFloor(frame);
    } else if (frame < 1363) {
      // Shot 19 (1301..1362, 0:54.2-0:56.8): Tight front reaction + blue under-glow lunging for phone
      drawShot19PhoneGrabReaction(frame);
    } else if (frame < 1483) {
      // Shot 20 (1363..1482, 0:56.8-1:01.8): Downward POV phone screen (APEX TOWER EVAC + 7%->6%)
      drawShot20PhoneBroadcastPov(frame);
    } else if (frame < 1565) {
      // Shot 21 (1483..1564, 1:01.8-1:05.2): eye-dart right -> whip-pan -> fingers parting dusty shutter louvers
      drawShot21EyeDartWhipShutter(frame);
    } else if (frame < 1670) {
      // Shot 22 (1565..1669, 1:05.2-1:09.6): Stepped 1.0x -> 1.38x skyline push-in — APEX TOWER blinking red beacon!
      drawShot22ApexTowerBeacon(frame);
    } else if (frame < 1762) {
      // Shot 23 (1670..1761, 1:09.6-1:13.4): Tight POV knife into sheath + backpack strap cinch
      drawShot23SheathAndStrap(frame);
    } else {
      // Shot 24 (1762..1871, 1:13.4-1:18.0): Dramatic low-angle cliffhanger hold + clean black cut
      drawShot24LowAngleCliffhanger(frame);
    }

    // Textured cutout film grain & subtle widescreen vignette (skip over pure black end frames)
    if (frame < 1871) {
      ctx.drawImage(grain, 0, 0);
      const vig = ctx.createRadialGradient(480, 270, 260, 480, 270, 620);
      vig.addColorStop(0, '#050a0f00');
      vig.addColorStop(1, '#050a0f88');
      rect(vig, 0, 0, W, H);
    }

    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  };
})();
