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
  const starGlint = (x, y, s, color = '#fffbe0ee') => {
    if (s <= 0.5) return;
    ctx.save();
    ctx.translate(x, y);
    shape(`M0 ${-s} L${s * 0.22} ${-s * 0.22} L${s} 0 L${s * 0.22} ${s * 0.22} L0 ${s} L${-s * 0.22} ${s * 0.22} L${-s} 0 L${-s * 0.22} ${-s * 0.22}Z`, color);
    ctx.restore();
  };

  // Cutout film grain texture
  const grain = document.createElement('canvas');
  grain.width = W;
  grain.height = H;
  const gctx = grain.getContext('2d');
  let seed = 2026;
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

  // Unified cuff + corrugated cardboard + gray duct-tape forearm in ONE exact coordinate transform.
  // Supports shreddedRightArm = true (deep ragged Hunter bite gashes & hanging gray tape strips from Shot 10 onward!)
  function drawUnifiedArmoredCuff(extendLen = 190, shreddedRightArm = false) {
    const endY = 56 + extendLen;
    if (!shreddedRightArm) {
      // Clean intact corrugated cardboard forearm behind cuff
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
      // SHREDDED corrugated cardboard & torn gray duct tape after Shot 10 Hunter bite!
      shape(`M-36 16 Q0 22 36 16 L${44 + extendLen * 0.04} ${endY} L${-44 - extendLen * 0.04} ${endY}Z`, '#a37b51', '#253a3b', 2.4);
      // Exposed dark corrugated flute interior inside bite gashes
      shape('M-28 42 L-6 54 L12 40 L26 58 L14 78 L-10 72 L-24 88 L-34 62Z', '#593e24', '#253a3b', 1.8);
      for (let fy = 48; fy <= 78; fy += 7) {
        shape(`M-22 ${fy} L18 ${fy - 3}`, null, '#382515', 1.3);
      }
      // Subtle corrugation ribs on intact portions
      for (let rx = -24; rx <= 24; rx += 12) {
        shape(`M${rx} 84 L${rx * 1.15} ${endY - 4}`, null, '#7e5d3b66', 1.1);
      }
      // Ragged peeled-back cardboard flaps sticking outward
      shape('M-36 38 L-58 50 L-44 68 L-30 56Z', '#b88e60', '#253a3b', 1.9);
      shape('M34 46 L56 62 L42 84 L28 66Z', '#b88e60', '#253a3b', 1.9);
      shape('M-14 74 L-26 98 L-6 94 L4 78Z', '#9e764d', '#253a3b', 1.6);
      // Upper gray duct-tape band — chewed & split cleanly in middle
      shape('M-37 26 Q-14 31 -4 29 L-6 43 Q-18 45 -39 42Z', '#8c969e', '#253a3b', 1.9);
      shape('M10 29 Q24 30 37 26 L39 42 Q24 45 12 43Z', '#8c969e', '#253a3b', 1.9);
      // Dangling torn gray duct-tape strips hanging off both edges
      shape('M-38 56 L-64 92 L-50 100 L-32 72Z', '#96a0a8', '#253a3b', 1.8);
      shape('M36 62 L62 104 L48 112 L32 76Z', '#859098', '#253a3b', 1.8);
      // Lower intact-ish tape band with claw nick
      if (extendLen > 90) {
        shape('M-43 114 Q0 120 43 114 L45 134 Q0 140 -45 134Z', '#8c969e', '#253a3b', 1.8);
        shape('M-18 116 L-4 132 M12 115 L22 134', null, '#3c4850', 1.5);
      }
    }
    // Cream shirt cuff flush at wrist seam (skin underneath untouched!)
    shape('M-24 -3 Q1 0 25 -4 L28 15 Q2 21 -28 15Z', '#ede5d0', '#253a3b', 2.4);
    shape('M-25 10 Q2 15 25 9', null, '#a49c86', 1.2);
    oval(19, 7, 2.5, 2.5, '#c6bda8', '#8a8575', 0.8);
  }

  // Raw red Smoker rope-burn scar across front-view neck
  function drawFrontNeckBurn(cx, cy, scale = 1, alpha = 0.86) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    shape('M-34 -2 Q0 9 34 -4', null, '#7a1919', 7.2);
    shape('M-32 -1 Q0 8 32 -3', null, '#bf342e', 4.4);
    shape('M-22 2 Q0 7 24 0', null, '#e35b52', 1.6);
    ctx.restore();
  }

  // Chipped & slightly bent thin stainless kitchen knife (handle x:-80..0, blade x:0..140)
  function drawChippedBentKnife(glintT = -1) {
    shape('M-76 -11 H0 V12 H-76 Q-84 1 -76 -11Z', '#1f282e', ink, 2.3);
    oval(-56, 0, 2.8, 2.8, '#b8c4cc');
    oval(-28, 0, 2.8, 2.8, '#b8c4cc');
    shape('M0 -10 H66 L74 -2 L83 -10 L138 -20 L110 10 L76 13 H0Z', '#d6e7f0', ink, 2.2);
    shape('M4 -7 H62 L120 -15 L100 4 H4Z', '#ffffff99');
    shape('M72 -2 L76 11 M102 -12 L96 8', null, '#687d8a', 1.6);
    if (glintT >= 0 && glintT <= 1) {
      const gx = mix(10, 128, glintT);
      const gy = mix(0, -14, glintT);
      starGlint(gx, gy, Math.sin(glintT * Math.PI) * 14);
    }
  }

  // Snapped-off kitchen knife handle (only jagged 14px steel stub remaining!)
  function drawBrokenKnifeHandle() {
    shape('M-76 -11 H0 V12 H-76 Q-84 1 -76 -11Z', '#1f282e', ink, 2.3);
    oval(-56, 0, 2.8, 2.8, '#b8c4cc');
    oval(-28, 0, 2.8, 2.8, '#b8c4cc');
    // Jagged broken steel stub
    shape('M0 -10 L15 -8 L8 1 L17 7 L11 12 H0Z', '#c9dbe6', ink, 2.0);
    shape('M2 -7 L11 -6 L6 2 H2Z', '#ffffffaa');
  }

  // Detached snapped stainless blade shard
  function drawBrokenBladeShard() {
    shape('M-4 -10 L4 -2 L-2 6 L4 12 L72 12 L106 9 L134 -20 L78 -10 L70 -2 L62 -10Z', '#d6e7f0', ink, 2.2);
    shape('M4 -6 H58 L116 -15 L96 4 H4Z', '#ffffff99');
  }

  // OpenToonz armored Series Lead with joint-locked bulging backpack, cardboard wraps on ALL 4 limbs,
  // Smoker neck burn, optional shreddedRightArm (Shots 12-30!), and wrist-locked bentKnife / brokenHandle!
  async function drawArmoredLead(cutout, anchors, worldX, worldFloorY, scale, opts = {}) {
    if (!cutout) return;
    const {
      flipLeft = false,
      bulgingPack = true,
      neckScuff = true,
      noShadow = false,
      shreddedRightArm = false,
      shreddedFarArm = false,
      bentKnife = false,
      brokenHandle = false,
      bodyRotateDeg = 0,
      knifeRotOffset = -84,
    } = opts;
    const img = await loadPng(cutout);
    if (!noShadow) {
      ctx.fillStyle = '#05090e88';
      ctx.beginPath();
      ctx.ellipse(worldX, worldFloorY, 50 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    if (bodyRotateDeg !== 0) {
      ctx.translate(worldX, worldFloorY - 90 * scale);
      ctx.rotate(bodyRotateDeg * Math.PI / 180);
      ctx.translate(-worldX, -(worldFloorY - 90 * scale));
    }
    if (flipLeft) {
      ctx.translate(worldX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-worldX, 0);
    }
    const ox = worldX - 250 * scale;
    const oy = worldFloorY - 756 * scale;

    const drawWrap = (anchor, len, w, yOff, shredded = false) => {
      if (!anchor) return;
      const [ax, ay, aa] = anchor;
      ctx.save();
      ctx.translate(ox + ax * scale, oy + ay * scale);
      ctx.rotate(aa * Math.PI / 180);
      ctx.scale(scale, scale);
      if (!shredded) {
        shape(`M${-w} ${yOff} H${w} L${w - 1.5} ${yOff + len} H${-w + 1.5}Z`, '#a88156', '#253a3b', 2.0);
        rect('#8c969e', -w - 1, yOff + len * 0.2, (w + 1) * 2, len * 0.22);
        rect('#8c969e', -w - 1, yOff + len * 0.62, (w + 1) * 2, len * 0.22);
      } else {
        // Ragged bitten cardboard wrap + dangling torn flaps & gray duct-tape tails!
        shape(`M${-w} ${yOff} H${w} L${w - 1.5} ${yOff + len} H${-w + 1.5}Z`, '#9c754d', '#253a3b', 2.0);
        // Dark bite notch
        shape(`M${-w + 2} ${yOff + len * 0.26} L2 ${yOff + len * 0.42} L${w - 2} ${yOff + len * 0.30} L${w - 4} ${yOff + len * 0.56} L-2 ${yOff + len * 0.50} L${-w + 3} ${yOff + len * 0.60}Z`, '#4d351e', '#253a3b', 1.4);
        // Torn cardboard flaps sticking out
        shape(`M${-w} ${yOff + len * 0.25} L${-w - 11} ${yOff + len * 0.46} L${-w - 4} ${yOff + len * 0.58} L${-w + 2} ${yOff + len * 0.42}Z`, '#b88e60', '#253a3b', 1.5);
        shape(`M${w} ${yOff + len * 0.34} L${w + 12} ${yOff + len * 0.54} L${w + 5} ${yOff + len * 0.68} L${w - 1} ${yOff + len * 0.52}Z`, '#b88e60', '#253a3b', 1.5);
        // Torn gray duct-tape strips dangling
        rect('#8c969e', -w - 1, yOff + len * 0.14, (w + 1) * 2, len * 0.14);
        shape(`M${-w} ${yOff + len * 0.56} L${-w - 14} ${yOff + len * 0.92} L${-w - 6} ${yOff + len * 0.98} L${-w + 4} ${yOff + len * 0.66}Z`, '#949fa8', '#253a3b', 1.4);
        shape(`M${w} ${yOff + len * 0.62} L${w + 13} ${yOff + len * 0.96} L${w + 5} ${yOff + len * 1.02} L${w - 3} ${yOff + len * 0.72}Z`, '#88939c', '#253a3b', 1.4);
      }
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

    // Far forearm wrap behind body (shreddedFarArm when right arm is the far bracing arm in supine fight!)
    drawWrap(anchors?.forearmFar, 40, 9.5, 14, shreddedFarArm);

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
      shape('M-13 -4 Q2 1 16 -3', null, '#b4302ccc', 4.4);
      ctx.restore();
    }
    drawWrap(anchors?.shinFar, 54, 13, 18, false);
    drawWrap(anchors?.shinNear, 54, 14, 18, false);
    drawWrap(anchors?.forearmNear, 42, 10, 14, shreddedRightArm);

    // 4. Wrist-locked weapon prop (bent kitchen knife in Shot 12, broken handle in Shot 14)
    if ((bentKnife || brokenHandle) && anchors?.handNear) {
      const [hx, hy, ha] = anchors.handNear;
      ctx.save();
      ctx.translate(ox + hx * scale, oy + hy * scale);
      ctx.rotate((ha + knifeRotOffset) * Math.PI / 180);
      ctx.scale(scale * 0.72, scale * 0.72);
      ctx.translate(36, 0);
      if (bentKnife) drawChippedBentKnife(-1);
      else drawBrokenKnifeHandle();
      ctx.restore();
    }
    ctx.restore();
  }

  // Reusable Hooded Hunter (Left 4 Dead special infected: dark tattered zip hoodie, glowing pale eyes, taut claws)
  function drawHunter(x, y, scale, opts = {}) {
    const {
      mode = 'crouched', // 'crouched' | 'pounce' | 'lunge' | 'knockback' | 'wallbounce'
      facingRight = false,
      snarl = 0.5,
      phase = 0,
    } = opts;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(facingRight ? scale : -scale, scale);

    const hood = '#242c36';
    const hoodDark = '#151b22';
    const pants = '#2a2826';
    const tape = '#7e868c';
    const skin = '#767f78';

    if (mode === 'crouched') {
      // Coiled predatory crouch on tin awning
      oval(0, 12, 68, 12, '#04080eaa');
      // Hind legs folded taut
      shape('M-46 10 Q-72 -44 -28 -68 L10 -46 Q-24 -28 -18 10Z', pants, ink, 2.6);
      shape('M16 10 Q48 -38 22 -64 L-6 -46 Q18 -26 4 10Z', '#1f1e1d', ink, 2.4);
      // Duct-tape ankle wraps
      rect(tape, -44, -6, 20, 10);
      rect(tape, 10, -6, 18, 10);
      // Hunched hoodie torso
      shape('M-54 -48 Q-36 -112 24 -108 Q64 -98 58 -48 Q24 -28 -54 -48Z', hood, ink, 2.8);
      shape('M-42 -54 Q-16 -94 34 -92 Q14 -68 -24 -52Z', hoodDark);
      // Taut clawed arms gripping awning edge
      shape('M16 -84 L54 -30 L42 12 L24 10 L32 -28 L-4 -66Z', hood, ink, 2.5);
      shape('M-10 -78 L26 -24 L14 14 L-4 12 L4 -26 L-28 -62Z', hoodDark, ink, 2.4);
      // Wrist tape + long pale claws
      rect(tape, 24, -12, 18, 10);
      rect(tape, -4, -10, 18, 10);
      shape('M24 10 L18 24 M32 11 L30 26 M40 10 L46 22', null, '#b5bfb4', 2.4);
      shape('M-4 12 L-10 25 M4 13 L4 26 M12 12 L18 23', null, '#b5bfb4', 2.4);
      // Deep hooded head angled forward
      shape('M18 -116 Q54 -132 76 -96 Q80 -64 46 -56 Q16 -64 18 -116Z', hood, ink, 2.8);
      shape('M34 -108 Q64 -116 74 -90 Q72 -66 46 -64 Q30 -78 34 -108Z', '#0b0f14');
      // Glowing pale Hunter eyes + subtle eye aura
      const eg = ctx.createRadialGradient(58, -88, 2, 58, -88, 26);
      eg.addColorStop(0, 'rgba(218, 245, 190, 0.58)');
      eg.addColorStop(1, 'rgba(218, 245, 190, 0)');
      rect(eg, 32, -114, 52, 52);
      oval(52, -88, 4.4, 2.6, '#e6fad2');
      oval(66, -86, 4.2, 2.5, '#e6fad2');
      if (snarl > 0.2) {
        shape('M48 -72 Q60 -66 70 -72 Q62 -60 48 -68Z', '#3a1618', ink, 1.4);
        shape('M52 -71 L54 -67 M58 -70 L60 -66 M64 -70 L65 -67', null, '#e8e4d4', 1.5);
      }
    } else if (mode === 'pounce' || mode === 'lunge') {
      // Articulated mid-air predatory pounce / lunge (curved spine, bent knees, elbows, taut claws!)
      const stretch = Math.sin(phase) * 7;
      // Far trailing thigh + bent calf + duct-tape ankle wrap
      shape(`M-48 -2 Q-82 14 -106 ${42 + stretch} L-94 ${52 + stretch} Q-70 28 -36 12Z`, '#1c1b1a', ink, 2.4);
      shape(`M-104 ${42 + stretch} L-134 ${26 + stretch} L-128 ${14 + stretch} L-94 ${32 + stretch}Z`, '#181716', ink, 2.2);
      // Near trailing thigh + bent calf + ankle tape
      shape(`M-40 -10 Q-76 2 -98 ${28 - stretch} L-84 ${38 - stretch} Q-62 16 -26 6Z`, pants, ink, 2.6);
      shape(`M-96 ${28 - stretch} L-128 ${12 - stretch} L-120 ${0 - stretch} L-84 ${18 - stretch}Z`, pants, ink, 2.4);
      rect(tape, -118, 8 - stretch, 14, 12);
      // Curved muscular hooded torso & hunched back
      shape('M-52 -16 Q-28 -58 26 -54 Q66 -46 68 -14 Q58 14 14 16 Q-28 18 -52 -16Z', hood, ink, 2.8);
      shape('M-34 -18 Q-12 -44 36 -42 Q26 -20 -14 -8Z', hoodDark);
      // Far bent arm reaching forward with elbow & claws
      shape('M26 -6 Q58 8 88 26 L94 14 Q64 -4 34 -18Z', hoodDark, ink, 2.4);
      rect(tape, 78, 12, 13, 14);
      shape('M92 16 L114 12 M94 22 L118 24 M90 27 L112 36', null, '#cfd9cd', 2.4);
      // Near bent arm slashing forward-up with distinct elbow & wrist tape
      shape('M34 -32 Q68 -48 96 -46 L98 -32 Q68 -32 38 -16Z', hood, ink, 2.6);
      rect(tape, 82, -48, 14, 15);
      shape('M96 -46 L118 -56 M98 -40 L122 -42 M96 -33 L118 -28', null, '#cfd9cd', 2.6);
      // Deep hooded snarling head tucked into shoulders
      shape('M44 -56 Q82 -66 96 -34 Q94 -6 62 -4 Q36 -18 44 -56Z', hood, ink, 2.8);
      shape('M58 -50 Q84 -54 92 -32 Q88 -10 66 -12 Q52 -26 58 -50Z', '#090d12');
      oval(75, -36, 4.4, 2.8, '#ebffd8');
      oval(87, -33, 4.0, 2.6, '#ebffd8');
      shape('M64 -22 Q80 -26 92 -16 Q84 0 66 -8Z', '#52181c', ink, 1.8);
      shape('M68 -21 L71 -14 M76 -21 L78 -13 M84 -19 L86 -12 M70 -8 L73 -14 M78 -7 L80 -13', null, '#efe9d8', 1.7);
    } else if (mode === 'pinning') {
      // Articulated Hunter hunched OVER supine lead on concrete (bent knees planted, hunched spine, claws raking!)
      const heave = Math.sin(phase) * 4;
      // Far bent leg planted back on asphalt
      shape('M-34 -8 Q-68 18 -72 64 L-56 66 Q-50 28 -18 6Z', '#1d1c1b', ink, 2.5);
      shape('M-72 62 L-48 86 L-36 78 L-56 54Z', '#181716', ink, 2.4);
      // Near bent thigh + calf crouched taut on asphalt
      shape('M-18 -4 Q-52 20 -52 68 L-34 70 Q-32 32 0 10Z', pants, ink, 2.6);
      shape('M-52 66 L-24 90 L-12 80 L-34 58Z', pants, ink, 2.5);
      rect(tape, -44, 62, 16, 11);
      // Hunched curved hoodie torso leaning forward over prey
      shape(`M-38 ${-16 + heave} Q-14 ${-76 + heave} 44 ${-68 + heave} Q80 ${-54 + heave} 68 ${-8 + heave} Q30 ${12 + heave} -38 ${-16 + heave}Z`, hood, ink, 2.8);
      shape(`M-22 ${-22 + heave} Q4 ${-60 + heave} 48 ${-54 + heave} Q32 ${-28 + heave} -6 ${-10 + heave}Z`, hoodDark);
      // Far arm clawing downward
      shape(`M30 ${-48 + heave} L76 ${-10 + heave} L66 ${32 + heave} L50 ${28 + heave} L58 ${-6 + heave} L18 ${-36 + heave}Z`, hoodDark, ink, 2.4);
      // Near bent arm reaching forward-down toward lead's forearm/throat
      shape(`M40 ${-42 + heave} L86 ${-6 + heave} L82 ${36 + heave} L64 ${34 + heave} L68 ${-2 + heave} L26 ${-28 + heave}Z`, hood, ink, 2.6);
      rect(tape, 64, 16 + heave, 16, 12);
      shape(`M66 ${34 + heave} L60 ${50 + heave} M74 ${35 + heave} L74 ${52 + heave} M82 ${34 + heave} L88 ${48 + heave}`, null, '#cfd9cd', 2.4);
      // Hooded snarling head ducked low
      shape(`M48 ${-78 + heave} Q88 ${-84 + heave} 102 ${-48 + heave} Q96 ${-18 + heave} 64 ${-20 + heave} Q40 ${-36 + heave} 48 ${-78 + heave}Z`, hood, ink, 2.8);
      shape(`M62 ${-70 + heave} Q88 ${-74 + heave} 96 ${-46 + heave} Q92 ${-24 + heave} 68 ${-26 + heave} Q54 ${-42 + heave} 62 ${-70 + heave}Z`, '#090d12');
      oval(79, -52 + heave, 4.4, 2.8, '#ebffd8');
      oval(91, -49 + heave, 4.0, 2.6, '#ebffd8');
      shape(`M68 ${-38 + heave} Q84 ${-42 + heave} 94 ${-32 + heave} Q86 ${-18 + heave} 68 ${-26 + heave}Z`, '#52181c', ink, 1.8);
      shape(`M72 ${-37 + heave} L74 ${-30 + heave} M80 ${-37 + heave} L82 ${-29 + heave} M88 ${-35 + heave} L89 ${-28 + heave}`, null, '#efe9d8', 1.7);
    } else if (mode === 'knockback') {
      // Articulated Hunter recoiling/rearing backward in pain with bent knees & elbows (ZERO stick X-limbs!)
      // Bent legs kicking back
      shape('M-24 14 Q-54 38 -62 78 L-44 82 Q-38 46 -8 24Z', '#1e1d1c', ink, 2.5);
      shape('M4 16 Q38 42 46 82 L28 86 Q20 50 -8 26Z', pants, ink, 2.6);
      rect(tape, 28, 66, 16, 11);
      // Curved arched-back hoodie torso recoiling upward
      shape('M-40 -12 Q-26 -64 24 -66 Q58 -58 50 -10 Q28 24 -24 22 Q-42 14 -40 -12Z', hood, ink, 2.8);
      shape('M-24 -18 Q-8 -52 30 -52 Q18 -24 -12 -6Z', hoodDark);
      // Bent arms flailing upward-back from impact
      shape('M-24 -46 Q-58 -68 -74 -96 L-60 -104 Q-44 -78 -12 -58Z', hoodDark, ink, 2.4);
      shape('M34 -42 Q66 -66 78 -94 L92 -86 Q78 -54 44 -28Z', hood, ink, 2.6);
      rect(tape, 74, -84, 15, 11);
      shape('M78 -94 L76 -112 M84 -90 L90 -108 M90 -86 L102 -100', null, '#cfd9cd', 2.3);
      // Head thrown back howling
      shape('M-16 -96 Q20 -114 44 -82 Q42 -52 10 -50 Q-18 -62 -16 -96Z', hood, ink, 2.8);
      shape('M-2 -88 Q22 -100 38 -78 Q34 -56 12 -56Z', '#090d12');
      oval(14, -78, 4.2, 2.8, '#ebffd8');
      oval(28, -74, 4.0, 2.6, '#ebffd8');
      shape('M8 -64 Q22 -68 32 -56 Q22 -44 8 -54Z', '#5c1a1e', ink, 1.6);
    } else {
      // 'wallbounce' — articulated predatory bound off brick wall in OTS chase!
      const stride = Math.sin(phase) * 18;
      // Bent hind & lead legs pushing dynamically off wall
      shape(`M-18 12 Q-48 32 ${-64 - stride} 62 L${-48 - stride} 70 Q-34 42 -4 24Z`, pants, ink, 2.5);
      shape(`M10 14 Q42 30 ${56 + stride} 58 L${40 + stride} 68 Q26 42 -4 26Z`, '#1f1e1d', ink, 2.5);
      // Curved leaning hoodie torso
      shape('M-34 -26 Q-10 -68 38 -52 Q60 -22 38 18 Q-10 28 -34 -26Z', hood, ink, 2.8);
      shape('M-20 -28 Q4 -54 34 -44 Q20 -22 -8 -10Z', hoodDark);
      // Articulated bent arms reaching forward
      shape(`M24 -36 Q56 -30 ${78 + stride * 0.4} -10 L${68 + stride * 0.4} 4 Q46 -14 16 -20Z`, hood, ink, 2.4);
      shape(`M-12 -26 Q-44 -22 ${-62 - stride * 0.4} -4 L${-52 - stride * 0.4} 10 Q-34 -8 -4 -12Z`, hoodDark, ink, 2.4);
      // Hooded head
      shape('M-8 -84 Q28 -100 50 -68 Q48 -38 18 -38 Q-10 -48 -8 -84Z', hood, ink, 2.8);
      shape('M8 -78 Q32 -86 44 -64 Q40 -42 18 -44Z', '#090d12');
      oval(22, -64, 4.4, 2.8, '#ebffd8');
      oval(35, -62, 4.2, 2.6, '#ebffd8');
    }

    ctx.restore();
  }

  // Textured brick wall helper
  function drawBrickWall(x, y, w, h, baseColor = '#2b2024', mortarColor = '#151013') {
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
    rect('#05080d66', cx - half + 6, topY + 4, 8, bottomY - topY);
    rect('#05080d66', cx + half - 2, topY + 4, 8, bottomY - topY);
    rect('#333438', cx - half, topY, 8, bottomY - topY);
    rect('#333438', cx + half - 8, topY, 8, bottomY - topY);
    shape(`M${cx - half} ${topY} H${cx - half + 8} V${bottomY} H${cx - half}Z`, null, ink, 2.0);
    shape(`M${cx + half - 8} ${topY} H${cx + half} V${bottomY} H${cx + half - 8}Z`, null, ink, 2.0);
    for (let y = topY + 20; y <= bottomY - 12; y += rungStep) {
      rect('#49474a', cx - half + 6, y, width - 12, 7);
      rect('#6e7076', cx - half + 8, y + 1, width - 16, 2);
      shape(`M${cx - half + 6} ${y} H${cx + half - 6} V${y + 7} H${cx - half + 6}Z`, null, ink, 1.8);
    }
  }

  // Wet midnight alley backdrop (deep indigo-slate sky, damp brick facades, glistening asphalt puddles)
  function drawMidnightAlley(frame, scrollX = 0, opts = {}) {
    const { awning = false, rain = true, lampGlow = true } = opts;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#060c16');
    sky.addColorStop(0.55, '#101d2e');
    sky.addColorStop(1, '#1a2b3d');
    rect(sky, 0, 0, W, H);

    // Distant midnight skyline
    const bgOff = (scrollX * 0.25) % 480;
    for (let i = -1; i < 4; i++) {
      const bx = i * 480 - bgOff;
      rect('#0b1420', bx + 12, 76, 152, 366);
      rect('#09101a', bx + 178, 38, 174, 404);
      rect('#0e1926', bx + 362, 102, 114, 340);
    }

    // Alley brick wall along rear
    const wallOff = (scrollX * 0.65) % 540;
    drawBrickWall(-wallOff, 118, W + 600, 324, '#241d22', '#120e12');
    // Dark shuttered service doors & utility pipes along brick
    for (let i = -1; i < 3; i++) {
      const dx = i * 540 - wallOff;
      rect('#161b22', dx + 96, 250, 108, 192);
      shape(`M${dx + 96} 250 H${dx + 204} V442 H${dx + 96}Z`, null, ink, 3.0);
      rect('#29333d', dx + 320, 118, 16, 324);
      shape(`M${dx + 320} 118 V442 M${dx + 336} 118 V442`, null, ink, 2.0);
    }

    // Corrugated tin storefront awning overhead if requested (Shots 4, 8, 12, 14)
    if (awning) {
      shape('M260 120 L780 120 L840 198 L200 198Z', '#2d3742', ink, 3.2);
      for (let ax = 240; ax <= 780; ax += 28) {
        shape(`M${ax} 120 L${ax + (ax - 520) * 0.12} 198`, null, '#182028', 2.0);
      }
      shape('M200 198 H840 V210 H200Z', '#3b4856', ink, 2.4);
      // Support struts
      shape('M240 210 L240 264 M790 210 L790 264', null, '#1c242c', 4.5);
    }

    // Cold distant sodium/moon alley glow
    if (lampGlow) {
      const lg = ctx.createRadialGradient(690 - (scrollX * 0.2) % 300, 150, 12, 690 - (scrollX * 0.2) % 300, 150, 220);
      lg.addColorStop(0, 'rgba(136, 178, 220, 0.22)');
      lg.addColorStop(1, 'rgba(136, 178, 220, 0)');
      rect(lg, 0, 0, W, 420);
    }

    // Wet midnight asphalt & reflective puddles
    rect('#141c24', 0, 440, W, 100);
    rect('#222e3a', 0, 434, W, 8);
    const pOff = scrollX % 320;
    for (let i = -1; i < 4; i++) {
      const px = i * 320 - pOff;
      oval(px + 130, 488, 92, 16, '#23364a88', '#3c587344', 1.4);
      oval(px + 138, 486, 48, 5, '#6a94bd33');
    }

    // Fine diagonal midnight mist/drizzle
    if (rain) {
      ctx.strokeStyle = 'rgba(176, 206, 232, 0.16)';
      ctx.lineWidth = 1.2;
      for (let r = 0; r < 42; r++) {
        const rx = ((r * 73 + frame * 11) % (W + 120)) - 60;
        const ry = ((r * 47 + frame * 19) % (H + 80)) - 40;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 8, ry + 26);
        ctx.stroke();
      }
    }
  }

  // Reusable #bar-hold studio SVG cylindrical grip hand with unified armored cuff
  function drawStudioCylinderGrip(drawPropFn, x, y, rotDeg, sc = 1.65, shredded = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.scale(sc, sc);
    ctx.translate(-126, -124);
    shape('M100 105 Q90 108 85 119 Q79 130 82 143 Q82 151 88 155 Q93 159 100 155 Q104 153 104 148 Q104 144 98 143 L95 143 Q92 137 97 132 L111 119Z', '#c88e72', '#253a3b', 2.4);
    drawPropFn();
    shape('M99 61 Q102 72 96 83 Q90 95 91 109 Q91 118 95 123 Q97 130 98 147 Q98 158 101 162 Q106 168 112 162 Q115 159 115 151 L114 128 Q117 137 118 153 Q119 166 124 168 Q131 171 135 165 Q137 161 135 153 L132 128 Q136 136 139 153 Q141 163 146 163 Q154 163 155 156 Q156 151 152 142 L149 125 Q154 132 157 144 Q160 153 166 153 Q173 152 172 145 Q170 132 164 112 Q161 100 154 94 Q143 81 139 61Z', '#e7ae87', '#253a3b', 2.4);
    shape('M139 63 Q143 80 154 94 Q161 100 164 112 L172 145 Q173 152 166 152 Q160 153 157 144 L150 123 Q156 117 154 110 Q148 99 140 93 Q130 82 130 63Z', '#c88e72');
    shape('M98 106 Q98 88 106 79 Q117 77 133 87 Q143 94 146 104 Q133 102 124 105 Q110 106 98 106Z', '#f3c39d');
    shape('M98 114 Q104 109 110 113 M117 116 Q123 110 129 114 M136 115 Q142 109 146 112 M153 117 L160 115 M101 136 Q106 133 111 135 M121 140 Q126 136 131 139 M140 138 L148 136 M158 136 L166 133', null, '#9e6755', 1.6);
    ctx.save();
    ctx.translate(118, 66);
    ctx.rotate(Math.PI);
    ctx.scale(0.84, 1.0);
    drawUnifiedArmoredCuff(190, shredded);
    ctx.restore();
    ctx.restore();
  }

  // Reusable #bar-press open-palm shove/slam hand with unified armored cuff
  function drawStudioPalmPress(x, y, rotDeg, sc = 1.75, shredded = false, extendLen = 210) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotDeg * Math.PI / 180);
    ctx.scale(sc, sc);
    ctx.translate(-120, -124);
    // Open palm pressing forward/outward
    shape('M98 169 C99 153 95 144 88 133 L68 108 C61 99 66 91 73 94 Q80 95 87 106 L97 114 L96 57 C96 48 106 47 109 55 L114 91 L115 40 C115 30 128 29 130 40 L133 90 L137 48 C138 39 150 40 151 50 L151 96 L158 66 C160 57 171 60 171 69 L166 116 Q165 136 151 151 Q145 157 145 168Z', '#e7ae87', '#253a3b', 2.4);
    shape('M98 117 Q116 113 124 133 Q122 151 106 153 Q102 137 98 117Z', '#f3c39d');
    shape('M160 115 Q155 142 143 151 L142 166 L132 166 Q140 149 143 134Z', '#c88e72');
    shape('M101 116 Q119 123 117 146 M106 108 Q127 103 151 107 M119 118 Q137 112 149 115 M116 157 Q127 159 138 156', null, '#9e6755', 1.6);
    ctx.save();
    ctx.translate(120, 166);
    ctx.scale(0.96, 1.0);
    drawUnifiedArmoredCuff(extendLen, shredded);
    ctx.restore();
    ctx.restore();
  }

  // Dark moonlit gunsmith workshop interior backdrop (Shots 22-30)
  function drawWorkshopInterior(panX = 0, moonlight = 1.0) {
    rect('#090e14', 0, 0, W, H);
    // Concrete block back wall
    rect('#121a22', 0, 0, W, 386);
    for (let wy = 44; wy < 386; wy += 44) {
      shape(`M0 ${wy} H${W}`, null, '#0a0f14', 1.6);
    }
    for (let wx = -(panX % 96); wx < W + 96; wx += 96) {
      shape(`M${wx} 0 V386`, null, '#0a0f14aa', 1.4);
    }
    // Concrete workshop floor
    rect('#171e26', 0, 386, W, 154);
    shape('M0 386 H960', null, '#080c10', 3.0);
    // High frosted transom window moonlight shafts
    if (moonlight > 0.05) {
      ctx.save();
      ctx.globalAlpha = moonlight;
      shape(`M${320 - panX * 0.4} 0 L${480 - panX * 0.4} 0 L${660 - panX * 0.4} 540 L${390 - panX * 0.4} 540Z`, 'rgba(138, 178, 224, 0.11)');
      ctx.restore();
    }
  }

  // =========================================================================
  // SHOT 1 (f0..71): High-Angle Alley Descent (00:10 AM, iron fire ladder, wet midnight alley)
  // =========================================================================
  function drawShot1HighAngleDescent(frame) {
    const p = tween(frame, 0, 62);
    const descendY = mix(-88, 24, p);
    const zoom = mix(1.06, 1.0, tween(frame, 0, 71));

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Wet midnight alley asphalt seen from steep high-angle
    const ground = ctx.createLinearGradient(0, 0, 0, H);
    ground.addColorStop(0, '#0e1620');
    ground.addColorStop(1, '#1a2633');
    rect(ground, 0, 0, W, H);
    // Glistening alley puddles below
    oval(540, 456, 190, 32, '#22384e99', '#496e9144', 1.6);
    oval(320, 488, 110, 18, '#1e314488');

    // Brick wall dropping steeply down left-center
    drawBrickWall(0, 0, 340, H, '#2a1f24', '#140f12');
    shape('M340 0 V540', null, ink, 4.2);

    // Iron fire ladder descending wall into wet alley
    drawIronLadder(388, -10, 420, 74, 34);

    // High-angle Series Lead easing silently down final rungs onto wet asphalt!
    ctx.save();
    ctx.translate(456, 176 + descendY);
    // Subtle dark canvas backpack silhouette BEHIND torso (never awkward floating green bars in front!)
    shape('M-46 0 Q-56 44 -48 92 H48 Q56 44 46 0 Q0 -14 -46 0Z', '#26332d', ink, 2.2);
    window.drawAnatomyTurnaround(ctx, 0, 324, 0.88, 'front', {
      hideLimbs: false,
      expression: 'head-sneak',
      headPitch: 0.82,
      eyeOffset: [1.2, -1.6],
    });
    // Clean dark backpack shoulder straps over cream shirt
    shape('M-34 2 L-30 92 M34 2 L30 92', null, '#222d28', 6.5);
    // Smoker red rope-burn locked cleanly to lower-mid neck
    drawFrontNeckBurn(0, -11, 0.38, 0.86);
    // Cardboard forearm wraps aligned accurately to lower forearms (y=78..118 right above wrists!)
    shape('M-52 78 H-36 L-37 116 H-51Z', '#a88156', '#253a3b', 1.8);
    rect('#8c969e', -53, 86, 18, 7);
    rect('#8c969e', -52, 102, 16, 7);
    shape('M36 78 H52 L51 116 H37Z', '#a88156', '#253a3b', 1.8);
    rect('#8c969e', 35, 86, 18, 7);
    rect('#8c969e', 36, 102, 16, 7);
    // Cardboard shin wraps aligned accurately to lower shins (y=222..270 right above brown shoes!)
    shape('M-30 222 H-11 L-12 268 H-29Z', '#a88156', '#253a3b', 1.8);
    rect('#8c969e', -31, 232, 21, 8);
    rect('#8c969e', -30, 250, 19, 8);
    shape('M11 222 H30 L29 268 H12Z', '#a88156', '#253a3b', 1.8);
    rect('#8c969e', 10, 232, 21, 8);
    rect('#8c969e', 11, 250, 19, 8);
    // Sheathed bent knife hilt tucked cleanly at left waist belt
    rect('#1f282e', -37, 94, 8, 20);
    ctx.restore();

    // Subtle concentric water ripple when boots touch wet asphalt silently at f56..71
    if (frame >= 54) {
      const rp = (frame - 54) / 18;
      oval(456, 462, 20 + rp * 54, 5 + rp * 12, null, `rgba(148, 196, 232, ${(1 - rp) * 0.65})`, 1.8);
    }

    ctx.restore();
    drawCornerClock('00:10 AM', 1);
  }

  // =========================================================================
  // SHOT 2 (f72..133): POV Smashed Hardware Window (1.0x -> 1.12x, empty tool hooks, broken glass)
  // =========================================================================
  function drawShot2HardwareWindowPov(frame) {
    const p = tween(frame, 72, 133);
    const zoom = mix(1.0, 1.12, p);
    const panX = mix(-24, 28, p);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480 - panX, -270);

    // Dark looted hardware store interior behind shattered storefront window
    rect('#0b1016', -60, 0, W + 120, H);
    // Pegboard wall with rows of EMPTY tool hooks!
    rect('#222a33', 80, 126, 800, 310);
    shape('M80 126 H880 V436 H80Z', null, ink, 3.0);
    for (let hx = 136; hx <= 824; hx += 68) {
      for (let hy = 178; hy <= 340; hy += 74) {
        // Faint dust outline where crowbars/axes/hammers used to hang
        rect('#1b222a', hx - 12, hy - 14, 24, 56);
        // Empty metal peg hook
        shape(`M${hx} ${hy} L${hx} ${hy + 12} Q${hx} ${hy + 20} ${hx + 10} ${hy + 16}`, null, '#7e8e9c', 2.6);
      }
    }
    // Overturned empty metal counter
    rect('#182028', 110, 412, 740, 128);
    shape('M110 412 H850 V540 H110Z', null, ink, 3.2);

    // Storefront transom header: HARDWARE
    rect('#1a222b', -60, 0, W + 120, 118);
    rect('#2a3642', 180, 26, 600, 68);
    shape('M180 26 H780 V94 H180Z', null, '#b8a060', 3.0);
    label('HARDWARE', 480, 74, 42, '#e6d8ad');

    // Shattered window frame + jagged glass teeth around perimeter
    shape('M-60 118 H1020 V136 H-60Z', '#303b46', ink, 3.0);
    shape('M80 136 L142 136 L112 224 L158 290 L98 358 L128 436 H80Z', 'rgba(166, 206, 232, 0.24)', '#b4d8f088', 2.2);
    shape('M880 136 L810 136 L844 214 L792 276 L856 348 L820 436 H880Z', 'rgba(166, 206, 232, 0.24)', '#b4d8f088', 2.2);
    shape('M260 436 L306 392 L348 436Z M590 436 L632 384 L676 436Z', 'rgba(176, 214, 240, 0.28)', '#c0e2f788', 2.0);
    // Scattered broken glass shards glinting on sill
    for (const [gx, gy] of [[212, 434], [418, 438], [520, 432], [744, 436]]) {
      shape(`M${gx} ${gy} L${gx + 14} ${gy - 6} L${gx + 22} ${gy + 4}Z`, '#cfe8f888');
    }

    ctx.restore();
    drawCornerClock('00:11 AM', 1);
  }

  // =========================================================================
  // SHOT 3 (f134..201): Tactile Close-Up — Jammed Police Cruiser Trunk (bar-hold, taped cuffs)
  // =========================================================================
  function drawShot3JammedTrunk(frame) {
    const yank1 = Math.sin(clamp((frame - 144) / 18) * Math.PI);
    const yank2 = Math.sin(clamp((frame - 170) / 20) * Math.PI);
    const pull = Math.max(yank1, yank2);
    const tremorX = pull > 0.2 ? Math.sin(frame * 4.5) * 4.5 * pull : 0;
    const tremorY = pull > 0.2 ? -pull * 10 : 0;

    ctx.save();
    ctx.translate(tremorX, 0);

    // Midnight street background top edge
    rect('#0c1520', 0, 0, W, 160);

    // Abandoned dented police cruiser rear trunk lid (matte navy & white stripe + rust!)
    shape('M0 112 Q480 86 960 112 V540 H0Z', '#1e2a36', ink, 3.6);
    // Faded white police side-to-rear stripe & stenciled lettering
    rect('#cad4dc33', 0, 174, W, 38);
    label('POLICE', 216, 202, 26, '#c8d4de88');
    label('UNIT 14', 760, 202, 22, '#c8d4de77');
    // Tail lights flanking trunk
    rect('#5c1c1e', 18, 198, 126, 74);
    shape('M18 198 H144 V272 H18Z', null, ink, 3.0);
    rect('#5c1c1e', 816, 198, 126, 74);
    shape('M816 198 H942 V272 H816Z', null, ink, 3.0);

    // Dented trunk seam & heavy rust corrosion around lock/latch!
    shape('M144 352 Q480 342 816 352', null, '#0a0f14', 6.0);
    oval(480, 326, 86, 36, '#5c362688');
    oval(452, 342, 48, 20, '#6e3d28aa');
    oval(524, 336, 44, 18, '#4f2c1eaa');

    // Chrome/rusted trunk handle lip & jammed keyhole
    rect('#5c6670', 416, 294, 128, 34);
    shape('M416 294 H544 V328 H416Z', null, ink, 2.8);
    oval(480, 310, 12, 12, '#3a424a', ink, 2.2);
    rect('#12161a', 478, 304, 4, 12);

    // Rust flakes popping when he yanks hard!
    if (pull > 0.35) {
      for (let i = 0; i < 6; i++) {
        const fx = 430 + i * 20 + Math.sin(frame + i) * 8;
        const fy = 338 + ((frame * 5 + i * 19) % 44);
        oval(fx, fy, 3.2, 2.2, '#7d442b');
      }
    }

    // Studio POV #bar-hold taped-cuff hand yanking upward on rusted trunk handle lip!
    drawStudioCylinderGrip(() => {
      shape('M54 114 H200 V134 H54Z', '#6a747e', ink, 2.4);
    }, 488, 338 + tremorY, 180, 1.88, false);

    ctx.restore();
    drawCornerClock('00:11 AM', 1);
  }

  // =========================================================================
  // SHOT 5 (f269..321): Audio Cue -> Sharp eye-dart & Freeze (head-alarm, sweat bead pop)
  // =========================================================================
  function drawShot5EyeDartFreeze(frame) {
    // 269..277 creeping -> 278 SHARP METALLIC CLAW SCRAPE ABOVE -> snap upward freeze!
    const snap = tween(frame, 278, 286);
    const jolt = (frame >= 278 && frame <= 284) ? Math.sin((frame - 278) * 3.8) * 5 : 0;
    const zoom = mix(1.0, 1.10, tween(frame, 278, 321));
    const sweat = tween(frame, 288, 316);

    drawMidnightAlley(frame, 210, { awning: true, rain: true });
    rect('#070d1699', 0, 0, W, H);

    ctx.save();
    ctx.translate(480 + jolt, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    window.drawFaceAngle(ctx, 480, 290, 1.26, 'eye-dart', {
      expression: frame < 280 ? 'head-notice' : 'head-alarm',
      dart: mix(1.4, 0.2, snap),
      eyeDy: mix(0.2, -4.4, snap),
      sweat: 0.15 + sweat * 0.95,
    });
    drawFrontNeckBurn(480, 414, 0.86, 0.90);
    shape('M394 456 L406 548 H436 L424 452Z M566 456 L554 548 H524 L536 452Z', '#26322d', ink, 2.6);

    // Sharp metallic audio-cue shock arcs above head on f278..292!
    if (frame >= 278 && frame <= 294) {
      const a = 1 - (frame - 278) / 16;
      shape('M340 72 L364 96 M480 44 L480 78 M620 72 L596 96', null, `rgba(255, 232, 148, ${a})`, 3.4);
    }

    ctx.restore();
    drawCornerClock('00:12 AM', 1);
  }

  // =========================================================================
  // SHOT 6 (f322..388): Rapid Upward POV Whip-Pan -> Stepped 1.42x Hooded Hunter Reveal
  // =========================================================================
  function drawShot6HunterReveal(frame) {
    if (frame < 334) {
      // Fast vertical upward whip-pan blur streaks
      const wp = (frame - 322) / 12;
      rect('#09101a', 0, 0, W, H);
      for (let i = 0; i < 18; i++) {
        const x = i * 56;
        const y = ((i * 83 + wp * 900) % (H + 260)) - 130;
        rect(i % 2 === 0 ? '#1b263499' : '#2c222888', x, y, 32, 240);
      }
      return;
    }

    // Stepped 1.0x -> 1.20x -> 1.42x push-in onto crouched hooded Hunter on tin awning!
    let zoom = 1.0 + tween(frame, 334, 350) * 0.05;
    if (frame >= 352 && frame < 368) zoom = 1.20 + tween(frame, 352, 368) * 0.04;
    else if (frame >= 368) zoom = 1.38 + tween(frame, 368, 388) * 0.04;

    ctx.save();
    ctx.translate(520, 230);
    ctx.scale(zoom, zoom);
    ctx.translate(-520, -230);

    // Midnight sky behind roofline
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#040912');
    sky.addColorStop(0.6, '#0f1c2e');
    sky.addColorStop(1, '#1a293a');
    rect(sky, -120, -80, W + 240, H + 160);

    // Cold moon halo upper-left behind awning silhouette
    oval(240, 124, 38, 38, '#d4e6f7cc');
    const mg = ctx.createRadialGradient(240, 124, 20, 240, 124, 180);
    mg.addColorStop(0, 'rgba(182, 214, 245, 0.28)');
    mg.addColorStop(1, 'rgba(182, 214, 245, 0)');
    rect(mg, 40, -60, 400, 360);

    // Steep brick wall right & corrugated tin awning jutting outward
    drawBrickWall(650, -60, 420, 680, '#231b20', '#100c0f');
    shape('M160 320 L680 280 L710 348 L140 378Z', '#303c48', ink, 3.4);
    for (let ax = 180; ax <= 660; ax += 32) {
      shape(`M${ax} 316 L${ax + 14} 366`, null, '#182028', 2.2);
    }
    shape('M140 378 L710 348 L710 364 L140 392Z', '#425263', ink, 2.6);

    // Hooded crouched Hunter locked straight onto camera!
    const breathe = Math.sin((frame - 334) * 0.25) * 2.5;
    drawHunter(516, 304 + breathe, 1.38, {
      mode: 'crouched',
      facingRight: false,
      snarl: tween(frame, 358, 386),
    });

    // Subtle claw-scrape sparks on tin edge
    if (frame >= 342 && frame <= 360) {
      const a = 1 - (frame - 342) / 18;
      shape('M466 324 L450 338 M478 326 L472 344', null, `rgba(255, 224, 148, ${a})`, 2.4);
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 7 (f389..441): Explosive High-Angle Hunter Pounce Launch diagonally across frame!
  // =========================================================================
  function drawShot7HunterPounce(frame) {
    const p = tween(frame, 389, 441);
    const shake = (frame >= 390 && frame <= 400) ? Math.sin((frame - 390) * 3.8) * 7 : 0;

    ctx.save();
    ctx.translate(shake, shake * 0.6);

    // High-angle wet midnight alley looking down from tin awning edge
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a121e');
    bg.addColorStop(1, '#1a2634');
    rect(bg, -20, -20, W + 40, H + 40);
    // Wet alley pavement far below
    oval(280, 440, 210, 42, '#25394f88');

    // Corrugated tin awning corner in upper-right foreground
    shape('M640 -20 L980 -20 L980 210 L580 120Z', '#313d4a', ink, 3.6);
    for (let i = 0; i < 6; i++) {
      shape(`M${660 + i * 52} -20 L${600 + i * 58} 140`, null, '#182028', 2.4);
    }

    // Explosive metallic tin kick-off sparks & rain mist burst at awning edge!
    if (frame <= 424) {
      const sp = clamp((frame - 389) / 30);
      for (let i = 0; i < 8; i++) {
        const ang = 2.1 + i * 0.22;
        const sx = 630 + Math.cos(ang) * (20 + sp * 110);
        const sy = 112 + Math.sin(ang) * (20 + sp * 90);
        shape(`M${sx} ${sy} L${sx - Math.cos(ang) * 18} ${sy - Math.sin(ang) * 18}`, null, `rgba(255, 224, 138, ${1 - sp})`, 2.6);
      }
      oval(634, 118, 30 + sp * 74, 18 + sp * 42, `rgba(170, 206, 236, ${(1 - sp) * 0.35})`);
    }

    // Diagonal velocity speed lines tearing upper-right -> lower-left
    for (let i = 0; i < 14; i++) {
      const lx = 140 + ((i * 83) % 720);
      const ly = 40 + ((i * 59) % 420);
      shape(`M${lx + 90} ${ly - 54} L${lx} ${ly}`, null, 'rgba(205, 226, 245, 0.22)', 2.2);
    }

    // Hunter exploding downward diagonally across frame!
    const hx = mix(690, 250, p);
    const hy = mix(118, 376, p);
    const hScale = mix(1.05, 1.92, p);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-0.48);
    drawHunter(0, 0, hScale, { mode: 'pounce', facingRight: false, phase: frame * 0.5 });
    ctx.restore();

    ctx.restore();
  }

  // =========================================================================
  // SHOT 9 (f509..565): Studio POV Defensive Block (drawPovSurvivalHand('pov-shield-face') + Cardboard Armor!)
  // =========================================================================
  function drawShot9PovDefensiveBlock(frame) {
    const snap = tween(frame, 509, 524);
    const biteImpact = frame >= 534;
    const shakeX = biteImpact ? Math.sin(frame * 4.8) * 7.5 : 0;
    const shakeY = biteImpact ? Math.cos(frame * 5.2) * 5.5 : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Midnight wet alley sky seen lying on back looking straight up!
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#070e18');
    sky.addColorStop(1, '#1a2736');
    rect(sky, -20, -20, W + 40, H + 40);
    // Flanking brick alley walls converging upward
    drawBrickWall(-20, 0, 170, H, '#221a1f', '#100c0f');
    drawBrickWall(810, 0, 170, H, '#221a1f', '#100c0f');

    // Hunter lunging straight down from top-center with snapping jaws!
    const lungeY = mix(80, 212, tween(frame, 509, 538));
    ctx.save();
    ctx.translate(480, lungeY);
    ctx.scale(2.25, 2.25);
    // Dark hoodie shoulders & clawed hands lunging toward camera
    shape('M-138 -90 Q0 -138 138 -90 L166 48 H-166Z', '#1e2630', ink, 2.4);
    shape('M-76 -110 Q0 -140 76 -110 Q86 -34 54 -14 Q0 8 -54 -14 Q-86 -34 -76 -110Z', '#252e3a', ink, 2.6);
    shape('M-56 -96 Q0 -116 56 -96 Q62 -40 42 -24 Q0 -10 -42 -24 Q-62 -40 -56 -96Z', '#090d12');
    // Glowing pale eyes
    oval(-22, -62, 7.5, 4.5, '#ebffd8');
    oval(22, -62, 7.5, 4.5, '#ebffd8');
    // Wide snapping jaws clamping downward onto forearm!
    const jawGap = biteImpact ? 14 : 34;
    shape(`M-36 -34 Q0 -42 36 -34 L30 ${-24 + jawGap} Q0 ${-14 + jawGap} -30 ${-24 + jawGap}Z`, '#5c171b', ink, 2.0);
    // Upper & lower jagged teeth
    for (let tx = -24; tx <= 24; tx += 10) {
      shape(`M${tx - 3} -34 L${tx} -22 L${tx + 3} -34Z`, '#f0ead6', ink, 1.0);
      shape(`M${tx - 3} ${-24 + jawGap} L${tx} ${-34 + jawGap} L${tx + 3} ${-24 + jawGap}Z`, '#f0ead6', ink, 1.0);
    }
    ctx.restore();

    // Studio POV Defensive Block: official drawPovSurvivalHand('pov-shield-face') + unified corrugated cardboard forearm!
    const armY = mix(510, 294, snap);
    const armRot = mix(24, -46, snap);
    ctx.save();
    ctx.translate(456, armY);
    ctx.rotate(armRot * Math.PI / 180);
    // Official studio POV hand scaled cleanly
    ctx.save();
    ctx.scale(1.62, 1.62);
    ctx.translate(-182, -184);
    window.drawPovSurvivalHand(ctx, 'pov-shield-face');
    ctx.restore();
    // Unified corrugated cardboard + gray duct-tape forearm locked seamlessly over the wrist cuff!
    ctx.save();
    ctx.translate(-22, 86);
    ctx.rotate(-0.24);
    ctx.scale(1.88, 1.72);
    drawUnifiedArmoredCuff(195, false);
    ctx.restore();
    ctx.restore();

    // Impact burst lines when jaws slam into cardboard!
    if (frame >= 534 && frame <= 552) {
      const a = 1 - (frame - 534) / 18;
      shape('M370 250 L330 220 M590 250 L630 220 M420 214 L400 176 M540 214 L560 176', null, `rgba(255, 232, 168, ${a})`, 3.4);
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 10 (f566..642): Macro ECU Insert — Cardboard & Tape Stops the Bite!
  // =========================================================================
  function drawShot10MacroCardboardBite(frame) {
    const rip1 = tween(frame, 578, 598);
    const rip2 = tween(frame, 608, 628);
    const rip = clamp(rip1 * 0.55 + rip2 * 0.45);
    const zoom = mix(1.0, 1.08, tween(frame, 566, 642));
    const shake = ((frame >= 578 && frame <= 590) || (frame >= 608 && frame <= 622))
      ? Math.sin(frame * 4.5) * 6 : 0;

    ctx.save();
    ctx.translate(480 + shake, 270 + shake * 0.5);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Dark atmospheric midnight alley bokeh background
    rect('#091018', -40, -40, W + 80, H + 80);
    oval(220, 120, 180, 120, 'rgba(92, 134, 174, 0.14)');
    oval(760, 420, 200, 120, 'rgba(72, 106, 142, 0.12)');

    // MACRO horizontal right forearm across center-left -> right:
    // Left side: cream shirt cuff & untouched skin wrist (proving skin is safe!)
    ctx.save();
    ctx.translate(480, 316);
    ctx.rotate(-0.14);

    // Untouched wrist skin on far left
    shape('M-460 -62 H-310 V62 H-460Z', '#e7ae87', ink, 3.0);
    // Cream shirt cuff flush at wrist
    shape('M-340 -74 H-244 V74 H-340Z', '#ede5d0', ink, 3.4);
    shape('M-318 -70 V70', null, '#a49c86', 2.0);
    oval(-274, 34, 8, 8, '#c6bda8', '#8a8575', 1.6);

    // Thick corrugated brown cardboard armor wrap!
    shape('M-244 -86 H380 V86 H-244Z', '#a88156', ink, 3.6);
    // Visible corrugated cross-section flute ribs along top edge
    for (let cx = -230; cx <= 360; cx += 24) {
      shape(`M${cx} -82 V82`, null, '#7a593866', 2.0);
    }

    // Exposed dark corrugated interior where teeth chew through!
    if (rip > 0.05) {
      shape(`M-110 -86 L${-80} ${-32 + rip * 26} L-20 ${-54 + rip * 18} L48 ${-22 + rip * 30} L118 ${-58 + rip * 16} L160 -86Z`, '#4d341c', ink, 2.8);
      for (let rx = -96; rx <= 140; rx += 16) {
        shape(`M${rx} -82 V${-40 + rip * 22}`, null, '#2e1d0f', 2.2);
      }
      // Peeled-back shredded cardboard flaps curling outward!
      shape(`M-112 -86 L${-154 - rip * 28} ${-116 - rip * 20} L${-118 - rip * 16} ${-56} L-86 -72Z`, '#bc9264', ink, 2.6);
      shape(`M158 -86 L${208 + rip * 34} ${-124 - rip * 24} L${176 + rip * 18} ${-58} L134 -72Z`, '#bc9264', ink, 2.6);
    }

    // Gray duct-tape wrap bands ripping & stretching under teeth!
    shape('M-212 -90 H-128 V90 H-212Z', '#8c969e', ink, 3.0);
    // Middle tape band tearing apart cleanly
    shape(`M-44 ${-90 + rip * 34} H64 V90 H-44Z`, '#8c969e', ink, 3.0);
    if (rip > 0.1) {
      // Torn dangling duct-tape strips peeling up!
      shape(`M-44 -70 L${-78 - rip * 22} ${-134 - rip * 18} L${-42 - rip * 10} ${-144 - rip * 14} L-14 -72Z`, '#9ba6ae', ink, 2.4);
      shape(`M64 -72 L${108 + rip * 26} ${-136 - rip * 14} L${74 + rip * 16} ${-146 - rip * 12} L38 -72Z`, '#828d96', ink, 2.4);
    }
    shape('M198 -90 H292 V90 H198Z', '#8c969e', ink, 3.0);

    // Hunter's jagged upper jaw & teeth sinking into the cardboard wrap from above!
    const biteY = mix(-148, -96, rip1) + Math.sin(frame * 1.6) * 5;
    ctx.save();
    ctx.translate(16, biteY);
    shape('M-164 -160 H164 L138 -20 Q0 8 -138 -20Z', '#222b36', ink, 3.4);
    shape('M-130 -44 Q0 -18 130 -44 L120 -12 Q0 14 -120 -12Z', '#631a1f', ink, 2.6);
    // Razor-sharp teeth gripping cardboard (stopping millimeters short of skin!)
    for (let tx = -98; tx <= 98; tx += 28) {
      const th = (Math.abs(tx) === 42 || Math.abs(tx) === 70) ? 46 : 34;
      shape(`M${tx - 11} -14 L${tx} ${-14 + th} L${tx + 11} -14Z`, '#efe8d5', ink, 2.2);
    }
    ctx.restore();

    // Flying shredded cardboard & tape scraps bursting outward
    if (rip > 0.15) {
      for (let i = 0; i < 8; i++) {
        const ang = -2.6 + i * 0.34;
        const dist = 60 + rip * 160 + (i % 3) * 26;
        const fx = Math.cos(ang) * dist;
        const fy = -86 + Math.sin(ang) * dist;
        shape(`M${fx} ${fy} L${fx + 14} ${fy - 8} L${fx + 18} ${fy + 6}Z`, i % 2 === 0 ? '#b58a5c' : '#96a0a8', ink, 1.4);
      }
    }

    ctx.restore();
    ctx.restore();
  }

  // =========================================================================
  // SHOT 11 (f643..705): Off-Center ecu-dread Crash-Zoom (head-strain -> head-angry) + Knife Draw
  // =========================================================================
  function drawShot11EcuKnifeDraw(frame) {
    const crash = tween(frame, 643, 654);
    const drawP = tween(frame, 668, 696);
    const zoom = mix(2.8, 5.4, crash) + tween(frame, 654, 705) * 0.4;
    const shake = (frame >= 643 && frame <= 654) ? Math.sin(frame * 4.5) * 6 : Math.sin(frame * 1.4) * 1.2;

    rect('#080f18', 0, 0, W, H);
    ctx.save();
    ctx.translate(480 + shake, 270);
    window.drawFaceAngle(ctx, 0, 0, 0.92, 'ecu-dread', {
      expression: frame < 672 ? 'head-strain' : 'head-angry',
      zoom,
      panX: mix(-18, -86, crash),
      panY: mix(10, 32, crash),
      sweat: 0.72,
      dread: 0.85,
    });
    ctx.restore();

    // Foreground lower-left: left hand ripping the bent kitchen knife out of his belt sheath!
    if (frame >= 662) {
      const kx = mix(110, 266, drawP);
      const ky = mix(556, 396, drawP);
      drawStudioCylinderGrip(() => {
        ctx.save();
        ctx.translate(148, 124);
        ctx.scale(1.18, 1.18);
        drawChippedBentKnife(tween(frame, 676, 702));
        ctx.restore();
      }, kx, ky, mix(24, -18, drawP), 1.56, false);
    }
  }

  // =========================================================================
  // SHOT 13 (f778..849): Tight POV Blade Snap Insert (SNAP-PING! Steel shard clatters on wet asphalt)
  // =========================================================================
  function drawShot13BladeSnapInsert(frame) {
    // 778..792 strained drive -> f793 SNAP-PING! -> 793..849 shard spins & clatters onto wet asphalt!
    const snapped = frame >= 793;
    const snapP = tween(frame, 793, 836);
    const shake = (frame >= 793 && frame <= 804) ? Math.sin((frame - 793) * 4.4) * 9 : 0;

    ctx.save();
    ctx.translate(shake, shake * 0.5);

    // Midnight wet asphalt & dark Hunter hoodie shoulder on upper-right
    rect('#0b121b', -20, -20, W + 40, H + 40);
    // Wet glistening asphalt in lower half
    rect('#141d26', -20, 340, W + 40, 220);
    oval(580, 446, 220, 34, '#243a5088');
    // Hunter's torn dark hoodie shoulder receding top-right after snap
    ctx.save();
    ctx.translate(mix(640, 740, snapP), mix(120, 40, snapP));
    shape('M-110 -120 Q30 -160 190 -80 L210 140 Q40 160 -110 80Z', '#222a34', ink, 3.6);
    shape('M-80 20 L-10 44 L-40 62Z', '#4d1a1e', ink, 2.0);
    ctx.restore();

    if (!snapped) {
      // Pre-snap: bent blade bowing violently under bone impact!
      const flex = tween(frame, 778, 792);
      drawStudioCylinderGrip(() => {
        ctx.save();
        ctx.translate(154, 124);
        ctx.rotate(mix(-0.04, 0.16, flex));
        ctx.scale(1.38, 1.38);
        drawChippedBentKnife(-1);
        ctx.restore();
      }, 330 + flex * 18, 290 - flex * 12, -32, 1.82, false);
    } else {
      // Post-snap: hand recoils holding ONLY the snapped plastic handle!
      const recoil = tween(frame, 793, 810);
      drawStudioCylinderGrip(() => {
        ctx.save();
        ctx.translate(154, 124);
        ctx.scale(1.38, 1.38);
        drawBrokenKnifeHandle();
        ctx.restore();
      }, mix(348, 276, recoil), mix(278, 326, recoil), mix(-32, -48, recoil), 1.82, false);

      // Detached bent stainless blade shard spinning through air & clattering onto wet asphalt!
      const bounce = frame >= 822 ? Math.abs(Math.sin((frame - 822) * 0.55)) * 22 * (1 - clamp((frame - 822) / 26)) : 0;
      const sx = mix(496, 628, snapP);
      const sy = mix(204, 444, snapP * snapP) - bounce;
      const srot = mix(-0.4, 8.6, snapP);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(srot);
      ctx.scale(1.52, 1.52);
      drawBrokenBladeShard();
      ctx.restore();

      // Water splash ripple when shard hits wet asphalt at f822
      if (frame >= 822) {
        const rp = clamp((frame - 822) / 24);
        oval(628, 448, 14 + rp * 56, 4 + rp * 14, null, `rgba(168, 214, 246, ${(1 - rp) * 0.72})`, 2.0);
      }
    }

    // Crisp metallic SNAP-PING! star flash & steel sparks at f793..806
    if (frame >= 793 && frame <= 808) {
      const sp = (frame - 793) / 15;
      starGlint(488, 206, (1 - sp) * 56, '#fff8ccee');
      for (let i = 0; i < 10; i++) {
        const a = i * 0.62;
        const r1 = 18 + sp * 95;
        const r2 = r1 + 24;
        shape(`M${488 + Math.cos(a) * r1} ${206 + Math.sin(a) * r1} L${488 + Math.cos(a) * r2} ${206 + Math.sin(a) * r2}`, null, `rgba(255, 234, 152, ${1 - sp})`, 2.8);
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 16 (f984..1026): Escape Cut #2 — Low Boot-Level Puddle Splash Running (FULL articulated stride!)
  // Thighs & bent knees extend cleanly OFF top of frame (y < -120) — ZERO severed floating leg stumps!
  // =========================================================================
  function drawShot16BootPuddleSplash(frame) {
    const cycle = (frame - 984) * 0.44;
    const shake = Math.sin(cycle * 2) * 4.5;

    ctx.save();
    ctx.translate(0, shake);

    // Fast-streaking midnight alley horizon & wet asphalt
    rect('#09111b', 0, 0, W, 240);
    drawBrickWall(-((frame - 984) * 38) % 540, 0, W + 600, 246, '#211a1f', '#100c0f');
    // Horizontal motion-blur speed streaks across brick wall
    for (let i = 0; i < 8; i++) {
      const sy = 34 + i * 26;
      const sx = 960 - (((frame - 984) * (48 + i * 7) + i * 190) % 1280);
      rect('rgba(160, 196, 228, 0.09)', sx, sy, 220, 3);
    }
    rect('#121a22', 0, 240, W, 300);
    // Glowing black alley puddles streaking rapidly right -> left
    const puddleShift = ((frame - 984) * 44) % 480;
    for (let i = -1; i < 3; i++) {
      const px = i * 480 - puddleShift;
      oval(px + 280, 418, 240, 52, '#1f344a', '#486d9155', 2.0);
      oval(px + 280, 410, 150, 14, '#7aaad433');
    }

    // Articulated sprinting leg helper: draws full thigh off top edge -> bent knee -> cardboard-wrapped shin -> angled boot!
    const drawFullSprintLeg = (hipX, kneeX, kneeY, ankleX, ankleY, footAngleDeg, isFront) => {
      const pant = isFront ? '#465366' : '#323e4d';
      const shoe = isFront ? '#60453d' : '#493937';
      // 1. Full thigh extending cleanly past top of canvas (y = -140) down to bent knee!
      const dxT = kneeX - hipX, dyT = kneeY - (-140);
      const lenT = Math.hypot(dxT, dyT);
      const nxT = -dyT / lenT, nyT = dxT / lenT;
      shape(
        `M${hipX - nxT * 52} ${-140 - nyT * 52} L${hipX + nxT * 52} ${-140 + nyT * 52} ` +
        `L${kneeX + nxT * 42} ${kneeY + nyT * 42} L${kneeX - nxT * 42} ${kneeY - nyT * 42}Z`,
        pant, ink, 3.2
      );
      // Rounded knee joint
      oval(kneeX, kneeY, 42, 36, pant, ink, 2.8);

      // 2. Angled shin + corrugated cardboard & gray duct-tape shin armor!
      const shinAng = Math.atan2(ankleY - kneeY, ankleX - kneeX);
      const shinLen = Math.hypot(ankleX - kneeX, ankleY - kneeY);
      ctx.save();
      ctx.translate(kneeX, kneeY);
      ctx.rotate(shinAng - Math.PI / 2);
      shape(`M-38 0 H38 L32 ${shinLen} H-32Z`, pant, ink, 3.0);
      shape(`M-38 ${shinLen * 0.12} H38 L33 ${shinLen * 0.88} H-33Z`, '#a88156', '#253a3b', 2.8);
      rect('#8c969e', -40, shinLen * 0.25, 80, 22);
      rect('#8c969e', -37, shinLen * 0.60, 74, 22);
      ctx.restore();

      // 3. Brown sprinting boot with angled heel/toe strike!
      ctx.save();
      ctx.translate(ankleX, ankleY);
      ctx.rotate(footAngleDeg * Math.PI / 180);
      shape('M-34 -18 H32 L64 4 Q96 14 94 34 Q86 48 60 50 H-42 Q-52 40 -48 20Z', shoe, ink, 3.2);
      shape('M-46 34 H90 L82 50 H-42Z', '#ead8b5', ink, 1.8);
      ctx.restore();
    };

    // True forward left -> right sprint biomechanics (shared hip at top, scissors V-stride — ZERO backpedalling!)
    const sprintLegPose = (p01) => {
      // p01 in [0, 1): 0.0=FRONT leg heel-strike on puddle, 0.25=mid-stance under hip, 0.50=REAR leg kicking high behind knee, 0.75=forward knee drive!
      const ang = p01 * Math.PI * 2;
      const hipX = 450;
      const c = Math.cos(ang); // +1 = front (right), -1 = rear (left)
      const s = Math.sin(ang); // +1 = stance/down, -1 = swing/up
      const kneeX = 455 + c * 155;
      const kneeY = 172 + s * 32;
      // Front leg (c > 0) extends forward-down to strike puddle; rear leg (c < 0) folds sharply BACK behind knee!
      const shinX = c >= 0 ? c * 75 - s * 45 : c * 135;
      const ankleX = kneeX + shinX;
      // Rear leg lifts high off ground (c < 0 or swing s < 0); front leg plants solidly on wet asphalt (ankleY = 396)!
      const rearLift = Math.max(0, -c) * 118 + Math.max(0, -s) * 42;
      const ankleY = Math.min(396, 396 - rearLift);
      // Planted front boot is level/heel-first (-8..0 deg); lifted rear boot tilts toe-down/heel-up (+36..+50 deg)!
      const footAng = ankleY > 372 ? mix(-8, 4, clamp(0.5 + s * 0.5)) : mix(22, 48, clamp(rearLift / 115));
      return { hipX, kneeX, kneeY, ankleX, ankleY, footAng };
    };

    const tNorm = (((frame - 984) * 0.068) % 1 + 1) % 1;
    const farP = sprintLegPose((tNorm + 0.5) % 1);
    const nearP = sprintLegPose(tNorm);

    drawFullSprintLeg(farP.hipX, farP.kneeX, farP.kneeY, farP.ankleX, farP.ankleY, farP.footAng, false);
    drawFullSprintLeg(nearP.hipX, nearP.kneeX, nearP.kneeY, nearP.ankleX, nearP.ankleY, nearP.footAng, true);

    // Explosive forward-sweeping silver puddle spray fan from whichever boot is striking the wet asphalt!
    const strikeLeg = nearP.ankleY >= farP.ankleY ? nearP : farP;
    const strikeX = strikeLeg.ankleX + 26;
    const splashPulse = clamp(1 - (396 - strikeLeg.ankleY) / 48);
    for (let i = 0; i < 20; i++) {
      const ang = -Math.PI * 0.88 + (i / 19) * Math.PI * 0.76;
      const dist = 34 + splashPulse * 160 + (i % 3) * 28;
      const sx = strikeX + Math.cos(ang) * dist * 1.45;
      const sy = 424 + Math.sin(ang) * dist * 0.88;
      oval(sx, sy, 6 + (i % 4) * 3, 3.5 + (i % 3) * 2, 'rgba(190, 228, 252, 0.78)');
    }
    oval(strikeX, 428, 56 + splashPulse * 150, 13 + splashPulse * 26, null, `rgba(182, 222, 250, ${0.76 * (0.4 + splashPulse * 0.6)})`, 2.8);

    ctx.restore();
  }

  // =========================================================================
  // SHOT 17 (f1027..1089): Escape Cut #3 — Tight Front Panting + glance-back Terror!
  // =========================================================================
  function drawShot17GlanceBackTerror(frame) {
    const snap = frame >= 1052;
    const bobX = Math.sin((frame - 1027) * 0.65) * 8;
    const bobY = Math.abs(Math.sin((frame - 1027) * 0.65)) * 14;
    const jolt = (frame >= 1052 && frame <= 1060) ? Math.sin((frame - 1052) * 4.0) * 9 : 0;

    // Speed-blurred midnight alley walls streaking past behind him
    rect('#09111b', 0, 0, W, H);
    const streakOff = ((frame - 1027) * 42) % 320;
    for (let i = -1; i < 5; i++) {
      const sx = i * 320 - streakOff;
      rect('#1e1920aa', sx, 0, 140, H);
      rect('#29344066', sx + 180, 0, 34, H);
    }

    ctx.save();
    ctx.translate(480 + bobX + jolt, 286 + bobY);
    if (!snap) {
      // Front-view frantic panting sprint bust
      window.drawAnatomyTurnaround(ctx, 0, 1080, 2.38, 'front', {
        hideLimbs: false,
        expression: 'head-panic',
        headPitch: 0.14,
        eyeOffset: [1.8, 0.4],
        sweat: 0.92,
      });
      drawFrontNeckBurn(0, 166, 0.88, 0.92);
      shape('M-84 204 L-72 280 H-44 L-56 200Z M84 204 L72 280 H44 L56 200Z', '#26322d', ink, 2.8);
    } else {
      // Official glance-back terror over shoulder!
      window.drawFaceAngle(ctx, 0, 36, 1.44, 'glance-back', {
        flip: true,
        expression: 'head-panic',
        headAngle: -7,
      });
      // Red Smoker neck burn locked accurately to lower-mid NECK (just above white shirt collar — NEVER on cheek!)
      shape('M-20 92 Q-3 98 13 92', null, '#b8322ecc', 5.2);
    }

    // Sweat droplets flying off temple
    for (let s = 0; s < 5; s++) {
      const st = ((frame - 1027 + s * 7) % 18) / 18;
      oval(-96 - st * 120, -82 + s * 22 + st * 48, 3.8, 2.4, `rgba(194, 228, 250, ${1 - st})`);
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 18 (f1090..1151): Escape Cut #4 — Rear OTS Alley Rush (Hunter Wall-Bounce!)
  // =========================================================================
  function drawShot18OtsHunterChase(frame) {
    const p = tween(frame, 1090, 1151);
    const bob = Math.abs(Math.sin((frame - 1090) * 0.65)) * 10;

    // Narrow midnight brick alley stretching behind him (clear full frame first!)
    rect('#08101a', 0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, 360);
    sky.addColorStop(0, '#050b14');
    sky.addColorStop(0.65, '#142336');
    sky.addColorStop(1, '#1d2d3e');
    rect(sky, 0, 0, W, 370);
    // Distant alley fog & faint streetlight glow at vanishing point
    oval(480, 290, 145, 70, 'rgba(130, 168, 205, 0.14)');

    // Perspective alley walls
    shape('M0 0 L340 160 V360 L0 540Z', '#271e23', ink, 3.2);
    shape('M960 0 L620 160 V360 L960 540Z', '#21191e', ink, 3.2);
    // Perspective brick mortar lines
    for (let i = 1; i < 7; i++) {
      const t = i / 7;
      shape(`M0 ${mix(40, 480, t)} L340 ${mix(170, 350, t)}`, null, '#140f12', 1.8);
      shape(`M960 ${mix(40, 480, t)} L620 ${mix(170, 350, t)}`, null, '#140f12', 1.8);
    }
    // Wet alley pavement floor
    shape('M340 360 H620 L960 540 H0Z', '#151f29', ink, 2.6);
    oval(480, 442, 160, 26, '#23384e77');

    // Hunter bounding off the right brick wall 20 feet back & closing the gap!
    const bounceArc = Math.sin(clamp((frame - 1106) / 26) * Math.PI);
    const hx = mix(570, 466, p) + bounceArc * 94;
    const hy = mix(348, 396, p) - bounceArc * 116;
    const hScale = mix(0.68, 1.18, p);
    drawHunter(hx, hy, hScale, { mode: 'wallbounce', facingRight: false, phase: frame * 0.6 });

    // Brick dust & scrape sparks on right wall kick at f1118..1130
    if (frame >= 1116 && frame <= 1134) {
      const sp = (frame - 1116) / 18;
      oval(650, 276, 22 + sp * 46, 18 + sp * 34, `rgba(186, 198, 212, ${(1 - sp) * 0.42})`);
      shape(`M656 266 L${628 - sp * 20} ${252 - sp * 16} M652 288 L${622 - sp * 18} ${304 + sp * 14}`, null, `rgba(255, 228, 148, ${1 - sp})`, 2.6);
    }

    // Foreground lower-left: official rear-view Series Lead + bulging dark canvas backpack (OTS framing!)
    ctx.save();
    ctx.translate(0, bob);
    window.drawAnatomyTurnaround(ctx, 206, 1140, 2.02, 'rear', { hideLimbs: false });
    shape('M114 364 Q206 332 296 364 L310 548 H102Z', '#2d3a34', ink, 3.2);
    shape('M136 432 H276 V530 H136Z', '#222d28', ink, 2.4);
    shape('M126 398 Q206 418 286 398', null, '#53685d', 2.6);
    ctx.restore();
  }

  // =========================================================================
  // SHOT 19 (f1152..1213): Escape Cut #5 — Subjective First-Person POV Alley Dash
  // =========================================================================
  function drawShot19PovAlleyDash(frame) {
    const p = tween(frame, 1152, 1213);
    const zoom = mix(1.0, 1.56, p);
    const bobX = Math.sin((frame - 1152) * 0.72) * 10;
    const bobY = Math.abs(Math.sin((frame - 1152) * 0.72)) * 18;

    ctx.save();
    ctx.translate(480 + bobX, 270 + bobY);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Midnight alley walls rushing inward toward recessed heavy steel workshop door!
    rect('#070d16', -120, -80, W + 240, H + 160);
    shape('M-80 -60 L340 120 V410 L-80 580Z', '#251c21', ink, 3.4);
    shape('M1040 -60 L620 120 V410 L1040 580Z', '#1f181c', ink, 3.4);
    shape('M340 410 H620 L1040 580 H-80Z', '#141d26', ink, 2.8);

    // Back wall & dead alley lamp cage above doorway
    drawBrickWall(340, 80, 280, 330, '#2c2227', '#151013');
    rect('#1f262e', 456, 124, 48, 22);
    oval(480, 146, 14, 10, '#3a4652', ink, 2.0);

    // Recessed heavy gray steel workshop service door cracked half an inch!
    rect('#11161c', 404, 174, 152, 236);
    shape('M404 174 H556 V410 H404Z', null, '#485460', 5.0);
    // Heavy steel door panel ajar on right edge revealing dark black crack!
    rect('#3a4652', 410, 180, 130, 228);
    shape('M410 180 H540 V408 H410Z', null, ink, 2.8);
    rect('#4b5968', 424, 198, 102, 86);
    rect('#4b5968', 424, 302, 102, 86);
    // Vertical pitch-black half-inch crack along right jamb!
    rect('#030508', 540, 180, 12, 228);
    // Steel handle
    rect('#7f8d99', 514, 294, 18, 10);

    ctx.restore();
  }

  // =========================================================================
  // SHOT 20 (f1214..1285): Studio POV Door Slam (bar-press + shredded cuff, shut 0.6s before Hunter impact!)
  // =========================================================================
  function drawShot20PovDoorSlam(frame) {
    // 1214..1256 slamming heavy steel door shut -> f1256 FLUSH SHUT! -> f1270 (0.6s later) HUNTER IMPACT BOOM!
    const slamP = tween(frame, 1214, 1256);
    const doorClosed = frame >= 1256;
    const doorShake = (frame >= 1256 && frame <= 1262) ? Math.sin((frame - 1256) * 3.6) * 6 : 0;
    const hunterHit = (frame >= 1270 && frame <= 1283) ? Math.sin((frame - 1270) * 4.4) * 14 * (1 - (frame - 1270) / 14) : 0;

    ctx.save();
    ctx.translate(doorShake + hunterHit, hunterHit * 0.45);

    // Midnight alley visible through shrinking vertical gap until f1256!
    if (!doorClosed) {
      drawMidnightAlley(frame, 480, { rain: true, lampGlow: false });
      // Hunter lunging into the shrinking gap right behind him!
      const hClose = tween(frame, 1222, 1255);
      drawHunter(mix(740, 620, hClose), 330, mix(0.85, 1.38, hClose), { mode: 'lunge', facingRight: false, phase: frame * 0.5 });
    } else {
      rect('#090e14', 0, 0, W, H);
    }

    // Interior workshop dark steel jamb on right
    rect('#141b22', 780, 0, 180, H);
    shape('M780 0 V540', null, ink, 4.5);

    // Heavy gray steel door swinging cleanly left -> right to slam flush into right jamb at f1256!
    const doorRightX = mix(410, 782, slamP);
    rect('#323d48', -40, 0, doorRightX + 40, H);
    rect('#3d4a57', -20, 44, doorRightX - 40, 200);
    rect('#3d4a57', -20, 286, doorRightX - 40, 210);
    shape(`M${doorRightX} 0 V540`, null, ink, 4.0);
    // Steel interior push bar / handle & deadbolt housing
    rect('#6d7b87', doorRightX - 92, 260, 58, 22);
    shape(`M${doorRightX - 92} 260 H${doorRightX - 34} V282 H${doorRightX - 92}Z`, null, ink, 2.4);

    // Studio POV #bar-press palm + SHREDDED cardboard cuff slamming steel door shut!
    drawStudioPalmPress(doorRightX - 134, 300, mix(-16, 4, slamP), 1.88, true);

    // Metallic dust & shock ring when Hunter slams into exterior at f1270!
    if (frame >= 1270 && frame <= 1284) {
      const hp = (frame - 1270) / 14;
      oval(480, 270, 80 + hp * 240, 80 + hp * 240, null, `rgba(218, 232, 245, ${(1 - hp) * 0.45})`, 4.0);
      oval(776, 180, 24 + hp * 54, 40 + hp * 70, `rgba(190, 200, 210, ${(1 - hp) * 0.36})`);
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 21 (f1286..1353): Studio POV Heavy Deadbolt Throw (drawPovSurvivalHand('pov-door-lock') + shredded cuff!)
  // =========================================================================
  function drawShot21DeadboltThrow(frame) {
    // 1286..1308 reach & throw deadbolt -> f1308 CLANK! -> f1326 outside impact shudder!
    const throwP = tween(frame, 1294, 1312);
    const boomShake = (frame >= 1326 && frame <= 1342) ? Math.sin((frame - 1326) * 4.5) * 10 * (1 - (frame - 1326) / 16) : 0;
    const tremor = Math.sin(frame * 2.1) * 1.6;

    ctx.save();
    ctx.translate(boomShake + tremor, boomShake * 0.4);

    // Interior heavy gray steel door surface & right jamb
    rect('#2b3540', -20, -20, W + 40, H + 40);
    rect('#1a222a', 710, -20, 270, H + 40);
    shape('M710 -20 V560', null, ink, 5.0);
    // Heavy steel strike plate on jamb
    rect('#6b7782', 694, 188, 54, 124);
    shape('M694 188 H748 V312 H694Z', null, ink, 2.8);

    // Sliding steel deadbolt bar visibly shooting right into strike plate!
    const boltX = mix(580, 686, throwP);
    rect('#8d9aa6', boltX, 232, 54, 34);
    shape(`M${boltX} 232 H${boltX + 54} V266 H${boltX}Z`, null, ink, 2.4);

    // Official studio POV drawPovSurvivalHand('pov-door-lock') + SHREDDED cardboard cuff locked over wrist!
    ctx.save();
    ctx.translate(454, 294);
    ctx.rotate(mix(-0.24, 0.28, throwP));
    ctx.scale(2.14, 2.14);
    ctx.translate(-170, -178);
    window.drawPovSurvivalHand(ctx, 'pov-door-lock');
    // Layer shredded cardboard + torn gray duct-tape cuff right over the wrist cuff seam!
    ctx.save();
    ctx.translate(170, 178);
    ctx.scale(1.32, 1.32);
    ctx.translate(-122, -124);
    ctx.translate(50, 174);
    ctx.rotate(42 * Math.PI / 180);
    ctx.scale(0.66, 0.96);
    drawUnifiedArmoredCuff(170, true);
    ctx.restore();
    ctx.restore();

    // Crisp metallic CLANK! star glint when bolt seats at f1312..1324
    if (frame >= 1312 && frame <= 1326) {
      starGlint(704, 248, Math.sin(((frame - 1312) / 14) * Math.PI) * 32);
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 23 (f1421..1482): Barricade Cut #2 — Low Floor-Level Steel Legs Jamming Door Base
  // =========================================================================
  function drawShot23LegsJammingDoor(frame) {
    // 1421..1458 steel legs grinding right -> left across concrete -> f1458 THUNK flush against door base!
    const slideP = tween(frame, 1421, 1458);
    const thunkShake = (frame >= 1458 && frame <= 1468) ? Math.sin((frame - 1458) * 4.2) * 8 * (1 - (frame - 1458) / 10) : 0;

    ctx.save();
    ctx.translate(thunkShake, thunkShake * 0.4);

    // Low floor-level concrete workshop floor & steel door base on left
    rect('#10161e', -20, -20, W + 40, 320);
    rect('#1a222b', -20, 310, W + 40, 250);
    shape('M-20 310 H980', null, '#080c10', 3.4);

    // Rattling heavy steel workshop door base on left edge (x=0..226)
    const doorRattle = frame < 1458 ? Math.sin(frame * 3.8) * 3.5 : 0;
    rect('#2f3b47', -20 + doorRattle, 0, 236, 372);
    shape(`M${216 + doorRattle} 0 V372 H-20`, null, ink, 4.2);
    // Threshold metal strip
    rect('#4b5866', 0, 366, 230, 14);

    // Heavy iron workbench legs grinding across concrete -> locking flush at x=216!
    const legX = mix(490, 218, slideP);
    // Concrete scrape gouge marks trailing behind legs
    shape(`M${legX + 54} 430 H960 M${legX + 180} 372 H960`, null, 'rgba(130, 146, 162, 0.35)', 4.5);

    // Workbench underside & thick bolted steel legs
    rect('#3a2e25', legX - 10, 0, 740, 66);
    shape(`M${legX - 10} 66 H${legX + 730}`, null, ink, 4.0);
    // Rear steel leg
    rect('#3a4550', legX + 140, 66, 44, 308);
    shape(`M${legX + 140} 66 H${legX + 184} V374 H${legX + 140}Z`, null, ink, 3.0);
    // Foreground heavy steel leg jamming flush against door base!
    rect('#4b5866', legX, 66, 54, 368);
    shape(`M${legX} 66 H${legX + 54} V434 H${legX}Z`, null, ink, 3.4);
    // Steel cross-brace & floor footplate
    rect('#3d4854', legX + 46, 260, 680, 26);
    rect('#62707d', legX - 8, 418, 70, 18);
    shape(`M${legX - 8} 418 H${legX + 62} V436 H${legX - 8}Z`, null, ink, 2.6);

    // Grinding concrete sparks & dust puffs while sliding (f1421..1464)
    if (frame <= 1466) {
      const sp = frame < 1458 ? 0.8 : (1 - (frame - 1458) / 8);
      for (let i = 0; i < 6; i++) {
        const sx = legX + 44 + ((frame * 11 + i * 29) % 72);
        const sy = 428 - ((frame * 5 + i * 17) % 34);
        shape(`M${sx} ${sy} L${sx + 16} ${sy - 8}`, null, `rgba(255, 224, 138, ${sp})`, 2.4);
      }
      oval(legX + 24, 434, 36, 12, `rgba(176, 188, 200, ${sp * 0.35})`);
    }
    // Crisp THUNK! impact flash at f1458..1468
    if (frame >= 1458 && frame <= 1468) {
      starGlint(218, 352, Math.sin(((frame - 1458) / 10) * Math.PI) * 34);
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 24 (f1483..1545): Rattling Steel Door Impact (1.0x -> 1.08x, 2 final savage blows, dust puff)
  // =========================================================================
  function drawShot24RattlingDoor(frame) {
    const zoom = mix(1.0, 1.08, tween(frame, 1483, 1545));
    // Two final savage blows: Blow 1 @ f1492..1504, Blow 2 @ f1516..1528 -> abrupt stop!
    const b1 = (frame >= 1492 && frame <= 1504) ? Math.sin((frame - 1492) * 4.5) * 12 * (1 - (frame - 1492) / 12) : 0;
    const b2 = (frame >= 1516 && frame <= 1528) ? Math.sin((frame - 1516) * 4.5) * 14 * (1 - (frame - 1516) / 12) : 0;
    const shake = b1 + b2;

    ctx.save();
    ctx.translate(480 + shake, 270 + shake * 0.45);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    drawWorkshopInterior(0, 0.55);

    // Bolted heavy steel door centered-left
    rect('#1a222a', 174, 36, 260, 392);
    rect('#323e4a', 188, 48, 232, 376);
    shape('M188 48 H420 V424 H188Z', null, ink, 3.6);
    rect('#404e5c', 210, 74, 188, 138);
    rect('#404e5c', 210, 240, 188, 152);
    // Locked steel deadbolt
    rect('#8b98a4', 392, 212, 38, 16);

    // Heavy iron workbench wedged solidly across door base!
    rect('#495663', 420, 266, 28, 168);
    rect('#495663', 686, 266, 28, 168);
    rect('#3d4854', 448, 366, 238, 18);
    rect('#47382c', 410, 236, 320, 34);
    shape('M410 236 H730 V270 H410Z', null, ink, 3.2);

    // Dust puffing down from top door frame on both savage impacts!
    for (const startF of [1492, 1516]) {
      if (frame >= startF && frame <= startF + 24) {
        const dp = (frame - startF) / 24;
        oval(304, 52 + dp * 38, 60 + dp * 86, 16 + dp * 28, `rgba(182, 196, 210, ${(1 - dp) * 0.44})`);
        for (let d = 0; d < 8; d++) {
          oval(210 + d * 28, 64 + dp * (80 + (d % 3) * 35), 2.6, 2.6, `rgba(210, 222, 234, ${1 - dp})`);
        }
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 25 (f1546..1612): Tight Front Bust in Pitch Dark — Silence Falls (head-exhausted)
  // =========================================================================
  function drawShot25PitchDarkSilence(frame) {
    const heave = Math.sin((frame - 1546) * 0.16) * 4.5;
    const zoom = mix(1.0, 1.05, tween(frame, 1546, 1612));

    // Pitch-dark barricaded steel door behind his back
    rect('#05080d', 0, 0, W, H);
    rect('#141c24', 180, 0, 600, H);
    shape('M180 0 V540 M780 0 V540', null, '#070a0e', 5.0);

    ctx.save();
    ctx.translate(480, 270 + heave);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    window.drawAnatomyTurnaround(ctx, 480, 1460, 3.04, 'front', {
      hideLimbs: false,
      expression: 'head-exhausted',
      headPitch: 0.34,
      eyeOffset: [0, 1.2],
      sweat: 0.55,
    });
    drawFrontNeckBurn(480, 293, 1.12, 0.85);
    shape('M356 392 L374 550 H416 L396 384Z M604 392 L586 550 H544 L564 384Z', '#1f2924', ink, 3.0);

    // Dim moonlight slit across upper cheekbone & pitch-dark vignette
    shape('M0 0 H960 V540 H0Z', 'rgba(4, 9, 16, 0.58)');
    shape('M340 120 L580 120 L540 240 L310 240Z', 'rgba(136, 178, 222, 0.12)');

    ctx.restore();
    drawCornerClock('00:14 AM', 0.88);
  }

  // =========================================================================
  // SHOT 26 (f1613..1679): Downward POV Insert #1 — Broken Knife Handle in Moonlight Slit
  // =========================================================================
  function drawShot26BrokenHandlePov(frame) {
    const p = tween(frame, 1613, 1679);
    const zoom = mix(1.0, 1.08, p);
    const tremor = Math.sin(frame * 0.45) * 2.2;

    rect('#05080d', 0, 0, W, H);
    ctx.save();
    ctx.translate(480 + tremor, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Dim concrete floor & narrow silver moonlight slit from high transom
    rect('#0b1016', 0, 0, W, H);
    shape('M260 0 L680 0 L780 540 L180 540Z', 'rgba(136, 178, 224, 0.16)');

    // Left open palm holding the useless snapped-off kitchen knife handle!
    ctx.save();
    ctx.translate(476, 318);
    ctx.rotate(-0.18);
    // Intact left cardboard forearm (right arm is the shredded one!)
    ctx.save();
    ctx.translate(-156, 140);
    ctx.rotate(2.26);
    ctx.scale(1.26, 1.26);
    drawUnifiedArmoredCuff(170, false);
    ctx.restore();
    // Open palm cradling broken plastic hilt
    shape('M-110 20 Q-70 -46 34 -46 Q116 -46 140 -12 Q152 14 128 34 L158 50 Q168 68 144 76 L98 66 L132 96 Q138 114 114 118 L52 94 Q-20 112 -96 78Z', '#d8a07e', ink, 3.0);
    shape('M-40 10 Q18 -6 76 12 M-22 36 Q28 24 82 40', null, '#94624f', 2.0);
    // Snapped-off kitchen knife handle resting squarely across palm
    ctx.save();
    ctx.translate(48, 12);
    ctx.rotate(-0.12);
    ctx.scale(1.62, 1.62);
    drawBrokenKnifeHandle();
    ctx.restore();
    // Thumb curling over bottom edge
    shape('M-84 36 Q-44 6 6 24 Q24 44 -4 62 Q-52 72 -84 36Z', '#e7ae87', ink, 2.8);
    ctx.restore();

    ctx.restore();
  }

  // =========================================================================
  // SHOT 27 (f1680..1751): Downward POV Insert #2 — Shredded Cardboard Bite Marks on Right Forearm
  // =========================================================================
  function drawShot27ShreddedWrapPov(frame) {
    const p = tween(frame, 1680, 1751);
    const zoom = mix(1.0, 1.12, p);
    const tilt = Math.sin(p * Math.PI) * 6;

    rect('#05080d', 0, 0, W, H);
    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    // Narrow cold moonlight slit illuminating the shredded right forearm!
    shape('M220 0 L720 0 L810 540 L160 540Z', 'rgba(142, 186, 232, 0.18)');

    // Official studio-reference SVG hand + unified SHREDDED armored forearm extending cleanly past right frame edge!
    drawStudioPalmPress(240, 314, -99 + tilt, 2.02, true, 380);

    // Subtle moonlight sheen catching torn duct-tape edges
    shape('M390 198 L434 142 M594 186 L638 134', null, 'rgba(218, 238, 255, 0.34)', 2.2);

    ctx.restore();
  }

  // =========================================================================
  // SHOT 28 (f1752..1818): Tight Front Bust (head-exhausted -> head-notice) catching gun-oil scent
  // =========================================================================
  function drawShot28GunOilNotice(frame) {
    const notice = frame >= 1778;
    const lift = tween(frame, 1774, 1804);
    const zoom = mix(1.0, 1.09, tween(frame, 1752, 1818));

    rect('#05090e', 0, 0, W, H);
    rect('#121a22', 180, 0, 600, H);

    ctx.save();
    ctx.translate(480, 270);
    ctx.scale(zoom, zoom);
    ctx.translate(-480, -270);

    window.drawAnatomyTurnaround(ctx, 480, 1450, 3.02, 'front', {
      hideLimbs: false,
      expression: notice ? 'head-notice' : 'head-exhausted',
      headPitch: mix(0.32, -0.14, lift),
      eyeOffset: [mix(0, 3.4, lift), mix(1.0, -0.6, lift)],
      sweat: 0.30,
    });
    drawFrontNeckBurn(480, 290, 1.12, 0.85);
    shape('M356 392 L374 550 H416 L396 384Z M604 392 L586 550 H544 L564 384Z', '#1f2924', ink, 3.0);

    // Cold moonlight dark wash lifting slightly as eyes adjust
    shape('M0 0 H960 V540 H0Z', `rgba(4, 9, 16, ${mix(0.54, 0.38, lift)})`);
    shape('M330 110 L600 110 L560 250 L300 250Z', 'rgba(142, 186, 232, 0.14)');

    ctx.restore();
    drawCornerClock('00:15 AM', 0.88);
  }

  // =========================================================================
  // SHOT 29 (f1819..1890): Moonlit Workshop Pan — Lathes, Iron Vises & Brass Casings
  // =========================================================================
  function drawShot29WorkshopPan(frame) {
    const p = tween(frame, 1819, 1890);
    const panX = mix(0, 280, p);

    drawWorkshopInterior(panX, 0.95);

    ctx.save();
    ctx.translate(-panX, 0);

    // Heavy industrial steel workbench & metal lathe silhouette (x=120..560)
    rect('#1c252f', 120, 290, 440, 160);
    shape('M120 290 H560 V450 H120Z', null, ink, 3.2);
    // Metal lathe headstock, chuck, bed & tailstock
    rect('#25313e', 156, 174, 108, 116);
    shape('M156 174 H264 V290 H156Z', null, ink, 3.0);
    oval(268, 224, 16, 36, '#394858', ink, 2.4);
    rect('#2b3846', 284, 246, 210, 44);
    rect('#202b36', 444, 198, 72, 92);
    // Moonlight silver rim highlight along lathe bed
    shape('M158 176 H262 M284 248 H492', null, 'rgba(164, 206, 242, 0.42)', 2.4);

    // Second bench with heavy iron vise silhouette (x=660..1080)
    rect('#1a222b', 660, 304, 420, 146);
    shape('M660 304 H1080 V450 H660Z', null, ink, 3.2);
    // Iron bench vise
    shape('M740 304 V246 H786 V278 H822 V246 H864 V304Z', '#2a3644', ink, 2.8);
    shape('M724 276 H890', null, '#5a6d80', 4.5);
    // Pegboard tools silhouette above bench
    rect('#161e26', 700, 110, 340, 140);
    shape('M700 110 H1040 V250 H700Z', null, ink, 2.6);

    // Spent brass casings glinting faintly on the dark concrete floor!
    const casings = [[280, 476], [334, 492], [442, 468], [588, 498], [672, 474], [790, 504], [886, 480], [964, 496]];
    for (let i = 0; i < casings.length; i++) {
      const [cx, cy] = casings[i];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(i * 0.7);
      rect('#b59445', -9, -3.5, 18, 7);
      rect('#e6c973', -7, -2.5, 12, 2.5);
      ctx.restore();
      if ((frame + i * 11) % 34 < 8) {
        starGlint(cx, cy, 8, '#ffe9a3cc');
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // SHOT 30 (f1891..1967): Stepped Push-In Cliffhanger (1.0x -> 1.24x) — Locked Glass Counter Glint -> Black
  // =========================================================================
  function drawShot30GlassCounterCliffhanger(frame) {
    // Stepped push-in: 1.0 -> 1.12 -> 1.24 with subtle creep
    let zoom = 1.0 + tween(frame, 1891, 1914) * 0.03;
    if (frame >= 1916 && frame < 1940) zoom = 1.12 + tween(frame, 1916, 1940) * 0.03;
    else if (frame >= 1940) zoom = 1.20 + tween(frame, 1940, 1964) * 0.04;

    ctx.save();
    ctx.translate(490, 286);
    ctx.scale(zoom, zoom);
    ctx.translate(-490, -286);

    drawWorkshopInterior(280, 1.0);

    // Back wall pegboard racks (mostly bare, hinting at gunsmith shop)
    rect('#141c24', 210, 64, 560, 210);
    shape('M210 64 H770 V274 H210Z', null, ink, 3.0);

    // Locked glass display counter in the back gloom!
    rect('#1c242d', 236, 368, 508, 122);
    shape('M236 368 H744 V490 H236Z', null, ink, 3.4);
    // Reinforced glass display case top
    rect('rgba(130, 174, 212, 0.14)', 244, 248, 492, 122);
    shape('M244 248 H736 V370 H244Z', null, '#5b7288', 3.4);
    // Faint tantalizing dark silhouette of long shotgun barrel & handgun inside gloom
    shape('M316 308 H596 V320 H316Z M596 312 L646 336 L638 348 L586 322Z', '#0c1218cc');
    shape('M640 338 H686 V348 H668 L674 364 H658 L652 348 H640Z', '#0c1218cc');

    // Brass display lock at center-top edge
    rect('#947a3e', 476, 248, 28, 22);
    shape('M476 248 H504 V270 H476Z', null, ink, 2.0);

    // Cold moonlight beam slicing diagonally across the glass pane
    shape('M340 0 L520 0 L680 540 L440 540Z', 'rgba(156, 198, 240, 0.14)');
    // Crisp silver diagonal glass reflection + sweeping star glint!
    shape('M356 250 L432 250 L370 368 L296 368Z', 'rgba(204, 232, 255, 0.22)');
    shape('M456 250 L482 250 L422 368 L396 368Z', 'rgba(204, 232, 255, 0.16)');

    const glintP = tween(frame, 1924, 1958);
    if (glintP > 0.02 && glintP < 0.98) {
      starGlint(mix(360, 560, glintP), mix(264, 306, glintP), Math.sin(glintP * Math.PI) * 38, '#f0f8ffee');
    }

    ctx.restore();
    drawCornerClock('00:15 AM', 0.85);

    // Clean cut to black on final frames (f1965..1967)
    if (frame >= 1965) {
      rect(`rgba(0, 0, 0, ${clamp((frame - 1964) / 2)})`, 0, 0, W, H);
    }
  }

  // =========================================================================
  // MASTER COMPOSITOR ENTRY POINT: renderCh2bFrame (1,968 frames, 82.0 s @ 24 fps)
  // =========================================================================
  globalThis.renderCh2bFrame = async function renderCh2bFrame(frame, cutoutBase64, anchors) {
    ctx.save();
    ctx.setTransform(2, 0, 0, 2, 0, 0);

    if (frame < 72) {
      // Shot 1 (0..71): High-Angle Alley Descent (00:10 AM)
      drawShot1HighAngleDescent(frame);
    } else if (frame < 134) {
      // Shot 2 (72..133): POV Smashed Hardware Window (1.0x -> 1.12x)
      drawShot2HardwareWindowPov(frame);
    } else if (frame < 202) {
      // Shot 3 (134..201): Tactile Close-Up — Jammed Police Cruiser Trunk
      drawShot3JammedTrunk(frame);
    } else if (frame < 269) {
      // Shot 4 (202..268): Side Alley Creep (OpenToonz sneakAt) + tin awning + foreground pipe parallax wipe
      const p = tween(frame, 202, 268);
      drawMidnightAlley(frame, p * 180, { awning: true, rain: true });
      await drawArmoredLead(cutoutBase64, anchors, mix(190, 560, p), 468, 0.76, {
        bulgingPack: true,
        neckScuff: true,
        shreddedRightArm: false,
      });
      // Foreground dark drainpipe parallax wipe across lens
      const pipeX = mix(940, -120, clamp(p * 1.35));
      rect('#090e14ee', pipeX, 0, 44, H);
      rect('#1e2a36cc', pipeX + 36, 0, 8, H);
      drawCornerClock('00:12 AM', 1);
    } else if (frame < 322) {
      // Shot 5 (269..321): Audio Cue -> Sharp eye-dart & Freeze
      drawShot5EyeDartFreeze(frame);
    } else if (frame < 389) {
      // Shot 6 (322..388): Rapid Upward POV Whip-Pan -> Stepped 1.42x Hooded Hunter Reveal
      drawShot6HunterReveal(frame);
    } else if (frame < 442) {
      // Shot 7 (389..441): Explosive High-Angle Hunter Pounce Launch
      drawShot7HunterPounce(frame);
    } else if (frame < 509) {
      // Shot 8 (442..508): TRUE KNOCKDOWN TO WET CONCRETE GROUND + Articulated Hunter Tackle & Pin!
      const slamT = tween(frame, 454, 476);
      const impactShake = (frame >= 464 && frame <= 480) ? Math.sin((frame - 464) * 4.2) * 12 * (1 - (frame - 464) / 16) : 0;
      ctx.save();
      ctx.translate(impactShake, impactShake * 0.55);
      drawMidnightAlley(frame, 220, { awning: true, rain: true });
      // Lead tackled & slammed FLAT onto his back on wet alley concrete (true knockdown pose track!)
      await drawArmoredLead(cutoutBase64, anchors, mix(410, 354, slamT), 482, 0.82, {
        bulgingPack: true,
        neckScuff: true,
        shreddedRightArm: false,
      });
      // Explosive wet puddle splash when his back slams the concrete at f464..496!
      if (frame >= 464 && frame <= 500) {
        const sp = (frame - 464) / 36;
        oval(338, 480, 36 + sp * 130, 10 + sp * 24, null, `rgba(176, 218, 248, ${(1 - sp) * 0.82})`, 2.6);
        for (let i = 0; i < 10; i++) {
          const ang = -Math.PI * 0.92 + (i / 9) * Math.PI * 0.84;
          const sx = 338 + Math.cos(ang) * (24 + sp * 95);
          const sy = 472 + Math.sin(ang) * (16 + sp * 74);
          oval(sx, sy, 4.5, 3, `rgba(186, 226, 252, ${(1 - sp) * 0.85})`);
        }
      }
      // Articulated Hunter tackling from upper-right -> pinning directly over his chest!
      drawHunter(mix(740, 444, tween(frame, 442, 484)), mix(210, 378, tween(frame, 442, 484)), mix(1.05, 1.32, slamT), {
        mode: frame < 474 ? 'pounce' : 'pinning',
        facingRight: false,
        phase: frame * 0.45,
      });
      ctx.restore();
    } else if (frame < 566) {
      // Shot 9 (509..565): Studio POV Defensive Block (pov-shield-face + Cardboard Armor)
      drawShot9PovDefensiveBlock(frame);
    } else if (frame < 643) {
      // Shot 10 (566..642): Macro ECU Insert — Cardboard & Tape Stops the Bite! (shreddedRightArm begins!)
      drawShot10MacroCardboardBite(frame);
    } else if (frame < 706) {
      // Shot 11 (643..705): Off-Center ecu-dread Crash-Zoom + Knife Draw
      drawShot11EcuKnifeDraw(frame);
    } else if (frame < 778) {
      // Shot 12 (706..777): TRUE SUPINE GROUND-FIGHT UPWARD STAB!
      // Lead stays PINNED ON HIS BACK on wet concrete; far/right shredded-cardboard arm braces Hunter back
      // while near/left arm drives bent kitchen knife STRAIGHT UPWARD into pinning Hunter's shoulder at f740!
      const hit = frame >= 738;
      const shake = (frame >= 738 && frame <= 752) ? Math.sin((frame - 738) * 4.4) * 11 * (1 - (frame - 738) / 14) : 0;
      ctx.save();
      ctx.translate(shake, shake * 0.5);
      drawMidnightAlley(frame, 220, { awning: true, rain: true });
      // Supine lead on wet concrete driving bent knife straight upward!
      await drawArmoredLead(cutoutBase64, anchors, 356, 482, 0.82, {
        bulgingPack: true,
        neckScuff: true,
        shreddedFarArm: true,
        shreddedRightArm: false,
        bentKnife: true,
        knifeRotOffset: -18,
      });
      // Articulated Hunter pinning over him -> rearing backward howling when stabbed at f738!
      const recoil = tween(frame, 738, 774);
      drawHunter(mix(446, 548, recoil), mix(376, 308, recoil), 1.32, {
        mode: hit ? 'knockback' : 'pinning',
        facingRight: false,
        phase: frame * 0.45,
      });
      if (frame >= 738 && frame <= 756) {
        const sp = (frame - 738) / 18;
        starGlint(418, 314, (1 - sp) * 40, '#fff6c4ee');
      }
      ctx.restore();
    } else if (frame < 850) {
      // Shot 13 (778..849): Tight POV Blade Snap Insert (SNAP-PING!)
      drawShot13BladeSnapInsert(frame);
    } else if (frame < 922) {
      // Shot 14 (850..921): Dynamic OpenToonz shove Kick-Off & Scramble Up + Hunter into Trash Cans!
      const p = tween(frame, 850, 921);
      const canHit = frame >= 874;
      const shake = (frame >= 874 && frame <= 886) ? Math.sin((frame - 874) * 4.2) * 9 * (1 - (frame - 874) / 12) : 0;
      ctx.save();
      ctx.translate(shake, shake * 0.45);
      drawMidnightAlley(frame, 240, { awning: true, rain: true });
      // Aluminum alley trash cans on right crashing & scattering!
      const scatter = tween(frame, 874, 916);
      ctx.save();
      ctx.translate(768 + scatter * 68, 434 - Math.sin(scatter * Math.PI) * 24);
      ctx.rotate(scatter * 1.18);
      rect('#6f7b85', -34, -56, 68, 96);
      shape('M-34 -56 H34 V40 H-34Z', null, ink, 2.8);
      for (let ry = -38; ry <= 24; ry += 16) shape(`M-32 ${ry} H32`, null, '#4c5761', 2.0);
      ctx.restore();
      // Flying trash can lid spinning
      ctx.save();
      ctx.translate(772 + scatter * 116, 368 - Math.sin(scatter * Math.PI) * 86);
      ctx.rotate(scatter * 4.2);
      oval(0, 0, 38, 10, '#8b98a3', ink, 2.4);
      ctx.restore();
      // Hunter thrown backward into trash cans!
      drawHunter(mix(512, 748, tween(frame, 854, 906)), mix(356, 404, tween(frame, 854, 906)) - Math.sin(clamp((frame - 854) / 48) * Math.PI) * 52, 1.24, {
        mode: 'knockback',
        facingRight: false,
      });
      // Lead kicking off & scrambling upright clutching broken knife handle (with shreddedRightArm!)
      await drawArmoredLead(cutoutBase64, anchors, mix(350, 424, p), 472, 0.80, {
        bulgingPack: true,
        neckScuff: true,
        shreddedRightArm: true,
        brokenHandle: true,
        knifeRotOffset: -45,
      });
      if (canHit && frame <= 892) {
        const sp = (frame - 874) / 18;
        shape(`M720 380 L${694 - sp * 20} ${364 - sp * 16} M760 356 L${784 + sp * 22} ${338 - sp * 18}`, null, `rgba(255, 236, 168, ${1 - sp})`, 2.8);
      }
      ctx.restore();
    } else if (frame < 984) {
      // Shot 15 (922..983): Escape Cut #1 — Side sprintAt (shreddedRightArm!) + Whipping Foreground Pipe Parallax
      const p = tween(frame, 922, 983);
      drawMidnightAlley(frame, 260 + (frame - 922) * 18, { awning: false, rain: true });
      await drawArmoredLead(cutoutBase64, anchors, mix(260, 620, p), 468, 0.78, {
        bulgingPack: true,
        neckScuff: true,
        shreddedRightArm: true,
      });
      // Fast-whipping foreground drainpipe parallax wipe
      const pipeX = mix(1020, -180, clamp(p * 1.42));
      rect('#080d14f0', pipeX, 0, 52, H);
      rect('#1e2a36cc', pipeX + 42, 0, 10, H);
    } else if (frame < 1027) {
      // Shot 16 (984..1026): Escape Cut #2 — Low Boot-Level Puddle Splash Close-Up
      drawShot16BootPuddleSplash(frame);
    } else if (frame < 1090) {
      // Shot 17 (1027..1089): Escape Cut #3 — Tight Front Panting + glance-back Terror
      drawShot17GlanceBackTerror(frame);
    } else if (frame < 1152) {
      // Shot 18 (1090..1151): Escape Cut #4 — Rear OTS Alley Rush (Hunter Wall-Bounce!)
      drawShot18OtsHunterChase(frame);
    } else if (frame < 1214) {
      // Shot 19 (1152..1213): Escape Cut #5 — Subjective First-Person POV Alley Dash
      drawShot19PovAlleyDash(frame);
    } else if (frame < 1286) {
      // Shot 20 (1214..1285): Studio POV Door Slam (bar-press + shredded cuff)
      drawShot20PovDoorSlam(frame);
    } else if (frame < 1354) {
      // Shot 21 (1286..1353): Studio POV Heavy Deadbolt Throw (pov-door-lock + shredded cuff)
      drawShot21DeadboltThrow(frame);
    } else if (frame < 1421) {
      // Shot 22 (1354..1420): Barricade Cut #1 — OpenToonz shove Heavy Iron Workbench Heave (right -> left!)
      const p = tween(frame, 1354, 1420);
      const rattle = Math.sin(frame * 3.2) * 3.5;
      drawWorkshopInterior(0, 0.72);
      // Rattling heavy steel workshop door on left (x=0..160)
      rect('#2e3a46', -10 + rattle, 54, 152, 386);
      shape(`M${142 + rattle} 54 V440`, null, ink, 4.2);
      rect('#8b98a4', 114 + rattle, 232, 30, 14);

      // Heavy steel-legged iron workbench being shoved right -> left!
      const benchX = mix(412, 206, p);
      rect('#495663', benchX + 12, 276, 20, 184);
      rect('#495663', benchX + 210, 276, 20, 184);
      rect('#3d4854', benchX + 32, 392, 178, 14);
      rect('#47382c', benchX, 248, 244, 30);
      shape(`M${benchX} 248 H${benchX + 244} V278 H${benchX}Z`, null, ink, 3.0);

      // Lead facing left (flipLeft: true) pushing bench right -> left with shreddedRightArm!
      await drawArmoredLead(cutoutBase64, anchors, benchX + 294, 466, 0.80, {
        flipLeft: true,
        bulgingPack: true,
        neckScuff: true,
        shreddedRightArm: true,
      });
    } else if (frame < 1483) {
      // Shot 23 (1421..1482): Barricade Cut #2 — Low Floor-Level Steel Legs Jamming Door Base
      drawShot23LegsJammingDoor(frame);
    } else if (frame < 1546) {
      // Shot 24 (1483..1545): Rattling Steel Door Impact (1.0x -> 1.08x)
      drawShot24RattlingDoor(frame);
    } else if (frame < 1613) {
      // Shot 25 (1546..1612): Tight Front Bust in Pitch Dark — Silence Falls
      drawShot25PitchDarkSilence(frame);
    } else if (frame < 1680) {
      // Shot 26 (1613..1679): Downward POV Insert #1 — Broken Knife Handle
      drawShot26BrokenHandlePov(frame);
    } else if (frame < 1752) {
      // Shot 27 (1680..1751): Downward POV Insert #2 — Shredded Cardboard Bite Marks
      drawShot27ShreddedWrapPov(frame);
    } else if (frame < 1819) {
      // Shot 28 (1752..1818): Tight Front Bust (head-exhausted -> head-notice) catching gun-oil scent
      drawShot28GunOilNotice(frame);
    } else if (frame < 1891) {
      // Shot 29 (1819..1890): Moonlit Workshop Pan — Lathes, Vises & Brass Casings
      drawShot29WorkshopPan(frame);
    } else {
      // Shot 30 (1891..1967): Stepped Push-In Cliffhanger (1.0x -> 1.24x) — Glass Counter Glint -> Black
      drawShot30GlassCounterCliffhanger(frame);
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
    return canvas.toDataURL('image/jpeg', 0.94).split(',')[1];
  };
})();
