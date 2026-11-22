/**
 * Sculpted 2-Layer Weapon & Survival Hand Kit (Part 3+ Shared Asset)
 *
 * Eliminates plain oval/circle hands permanently by providing anatomically sculpted,
 * knuckle-segmented dark brown leather work gloves (with optional bare-skin mode)
 * using mandatory BACK -> PROP -> FRONT sandwich layering:
 *   1. window.drawWeaponHandBack(ctx, pose, x, y, scale, angleDeg, opts)
 *   2. drawPumpShotgun / drawPistol / drawPhone
 *   3. window.drawWeaponHandFront(ctx, pose, x, y, scale, angleDeg, opts)
 *
 * Poses:
 *   - 'shotgun-grip'         : Right hand gripping stock/receiver (opts.offTrigger = true/false)
 *   - 'shotgun-forend'       : Left hand cradling ribbed pump forend from underneath
 *   - 'pistol-twohand'       : Two-handed 9mm thumbs-forward grip
 *   - 'phone-cradle'         : Palm + 4 curled side fingers + opposing thumb on side power button
 *   - 'knife-grip'           : Vertical forearm rising from bottom, 4 curled fingers + top thumb locking horizontal/angled chef's knife handle
 *   - 'front-shotgun-grip-L' : Front-facing sculpted gloved fist gripping stock (low-angle / Front)
 *   - 'front-shotgun-grip-R' : Front-facing sculpted gloved fist gripping forend (low-angle / Front)
 */
(() => {
  const INK = '#101b21';

  function palette(opts = {}) {
    if (opts.bare) {
      return { base: '#e7ae87', dark: '#c88e72', hi: '#f3c39d', stitch: '#9e6755', nail: '#f1c2a8', ink: '#253a3b', cuff: '#ede5d0' };
    }
    // Dark brown leather work gloves (permanent Ch 2C -> Part 3 upgrade)
    return { base: '#553622', dark: '#392315', hi: '#784f34', stitch: '#8f6445', nail: '#784f34', ink: INK, cuff: '#412819' };
  }

  function pShape(ctx, d, fill, stroke = INK, w = 2.2) {
    const p = new Path2D(d);
    if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke(p);
    }
  }

  function withTransform(ctx, x, y, scale, angleDeg, fn) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angleDeg || 0) * Math.PI / 180);
    ctx.scale(scale || 1, scale || 1);
    fn();
    ctx.restore();
  }

  // Layer 1: Drawn BEHIND the weapon/prop (palm web, rear thumb, back-of-hand cuff)
  window.drawWeaponHandBack = function drawWeaponHandBack(ctx, pose, x, y, scale = 1, angleDeg = 0, opts = {}) {
    const c = palette(opts);
    withTransform(ctx, x, y, scale, angleDeg, () => {
      if (pose === 'shotgun-grip') {
        // Rear wrist cuff + inner palm + opposing thumb wrapping OVER top of stock tang
        pShape(ctx, 'M-56 14 L-24 6 L-12 42 L-48 52 Z', c.cuff, INK, 2.2);
        pShape(ctx, 'M-26 2 Q-8 -18 14 -14 Q26 -10 22 4 L-12 20 Z', c.dark, INK, 2.2);
      } else if (pose === 'shotgun-forend') {
        // Inner palm cradling underside + thumb ridge tucked behind barrel
        pShape(ctx, 'M-34 10 Q-16 -10 18 -10 Q32 -8 30 8 L-24 22 Z', c.dark, INK, 2.2);
      } else if (pose === 'pistol-twohand') {
        // Support hand back palm + rear wrist cuff
        pShape(ctx, 'M-52 12 L-16 2 L-8 46 L-48 54 Z', c.cuff, INK, 2.2);
        pShape(ctx, 'M-22 2 Q-2 -14 20 -10 L14 26 L-20 26 Z', c.dark, INK, 2.2);
      } else if (pose === 'phone-cradle') {
        // Sculpted palm & wrist behind the smartphone (plus optional connected cream sleeve extending off-frame)
        if (opts.showSleeve) {
          pShape(ctx, 'M-42 122 L42 118 L58 290 L-54 290 Z', '#e8e1cc', '#253a3b', 2.4);
          pShape(ctx, 'M-40 124 L-18 124 L-28 290 L-52 290 Z', '#bab49f', null);
          pShape(ctx, 'M-44 108 L44 104 L48 130 L-46 134 Z', '#ede5d0', '#253a3b', 2.4);
        }
        pShape(ctx, 'M-44 68 L34 64 L44 114 L-40 118 Z', c.cuff, INK, 2.4);
        pShape(ctx, 'M-62 -28 Q-70 36 -44 78 L42 74 Q68 38 64 -26 Q0 -44 -62 -28 Z', c.dark, INK, 2.4);
      } else if (pose === 'knife-grip') {
        // Studio-consistent vertical forearm rising from below + rear palm behind horizontal knife handle
        const ln = c.ink || INK;
        if (opts.showSleeve) {
          // Tapered cream shirt sleeve matching studio drawCuff() proportions
          pShape(ctx, 'M-22 46 L22 46 L31 260 L-31 260 Z', '#e8e1cc', ln, 2.3);
          pShape(ctx, 'M-21 48 L-8 48 L-15 260 L-30 260 Z', '#bab49f', null);
          // Pleated studio cuff + button
          pShape(ctx, 'M-25 26 Q0 29 25 26 L28 48 Q0 52 -28 48 Z', '#ede5d0', ln, 2.3);
          pShape(ctx, 'M-24 41 Q0 45 24 41', null, '#a49c86', 1.2);
          ctx.beginPath();
          ctx.ellipse(16, 36, 2.6, 2.6, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#c6bda8'; ctx.fill();
          ctx.strokeStyle = '#8a8575'; ctx.lineWidth = 0.9; ctx.stroke();
        }
        // Rear dorsal palm & wrist heel behind the knife handle
        pShape(ctx, 'M-19 28 Q-25 14 -24 -6 Q-20 -24 4 -24 Q24 -24 27 -6 Q26 14 19 28 Z', c.dark, ln, 2.2);
      } else if (pose === 'front-shotgun-grip-L' || pose === 'front-shotgun-grip-R') {
        // Back palm cushion behind receiver/forend
        pShape(ctx, 'M-20 -16 Q0 -24 20 -16 L18 18 Q0 24 -18 18 Z', c.dark, INK, 2.0);
      }
    });
  };

  // Layer 2: Drawn IN FRONT OF the weapon/prop (curled segmented fingers, knuckle planes, trigger finger, front thumb)
  window.drawWeaponHandFront = function drawWeaponHandFront(ctx, pose, x, y, scale = 1, angleDeg = 0, opts = {}) {
    const c = palette(opts);
    const tremble = opts.tremble || 0;
    withTransform(ctx, x, y, scale, angleDeg, () => {
      if (pose === 'shotgun-grip') {
        // Sculpted back-of-hand & metacarpal ridge
        pShape(ctx, 'M-36 10 Q-16 -6 8 -2 L22 14 Q24 38 6 48 L-28 46 Q-42 32 -36 10 Z', c.base, INK, 2.3);
        // Leather knuckle reinforcement patch + stitching
        pShape(ctx, 'M-18 8 L8 6 L12 18 L-14 20 Z', c.hi, INK, 1.5);
        // Three curled lower fingers (middle, ring, pinky) wrapping tightly around stock grip
        pShape(ctx, 'M10 14 Q28 12 30 22 Q28 30 12 30 Z', c.base, INK, 2.0);
        pShape(ctx, 'M8 26 Q26 25 27 34 Q24 41 10 40 Z', c.base, INK, 2.0);
        pShape(ctx, 'M4 37 Q20 37 21 44 Q18 50 4 49 Z', c.dark, INK, 1.9);
        // Toggleable index finger: straight along matte receiver (offTrigger) vs curled on trigger!
        if (opts.offTrigger !== false) {
          pShape(ctx, `M8 ${-4 + tremble} L56 ${-10 + tremble} Q64 ${-10 + tremble} 64 ${-3 + tremble} Q63 ${3 + tremble} 55 ${4 + tremble} L10 ${10 + tremble} Z`, c.hi, INK, 2.2);
          pShape(ctx, `M30 ${-5 + tremble} L31 ${4 + tremble} M46 ${-7 + tremble} L47 ${2 + tremble}`, null, c.dark, 1.4); // Knuckle creases
        } else {
          pShape(ctx, 'M10 0 Q30 -4 34 8 Q34 18 22 18 L12 12 Z', c.hi, INK, 2.2);
        }
        // Leather wrist cinch strap
        pShape(ctx, 'M-46 14 L-26 10 L-20 44 L-40 48 Z', c.dark, INK, 2.0);
      } else if (pose === 'shotgun-forend') {
        // Sculpted cradling palm + 4 staggered wrapped leather fingertips gripping up over ribbed forend
        pShape(ctx, 'M-34 6 Q0 28 34 6 L30 26 Q0 40 -30 26 Z', c.base, INK, 2.3);
        const fx = [-22, -7, 8, 22];
        const fh = [-14, -18, -17, -12];
        for (let i = 0; i < 4; i++) {
          const xx = fx[i], hh = fh[i];
          pShape(ctx, `M${xx - 6} 12 L${xx - 5} ${hh} Q${xx} ${hh - 6} ${xx + 6} ${hh} L${xx + 7} 12 Z`, i % 2 ? c.hi : c.base, INK, 2.0);
          pShape(ctx, `M${xx - 4} ${hh + 7} L${xx + 5} ${hh + 7}`, null, c.dark, 1.3); // Finger joint crease
        }
        // Subtle leather palm highlight
        pShape(ctx, 'M-22 18 Q0 28 22 18', null, c.stitch, 1.6);
      } else if (pose === 'pistol-twohand') {
        // Support hand fingers locked cleanly over dominant grip + thumbs-forward alignment
        pShape(ctx, 'M-24 6 L16 4 L22 44 L-20 46 Z', c.base, INK, 2.3);
        for (let i = 0; i < 3; i++) {
          const yy = 12 + i * 11;
          pShape(ctx, `M10 ${yy} L32 ${yy - 1} Q37 ${yy + 4} 32 ${yy + 9} L10 ${yy + 9} Z`, i === 0 ? c.hi : c.base, INK, 2.0);
        }
        // Forward-pointing support thumb locked along frame
        pShape(ctx, 'M-6 -2 L38 -8 Q46 -7 45 0 L38 5 L-4 8 Z', c.hi, INK, 2.1);
        // Trigger finger
        if (opts.offTrigger) {
          pShape(ctx, 'M10 -4 L48 -8 Q54 -7 54 -1 L10 4 Z', c.base, INK, 2.0);
        }
      } else if (pose === 'phone-cradle') {
        // Four sculpted curled fingers wrapping around LEFT edge of phone
        const fy = [-38, -12, 14, 38];
        for (let i = 0; i < 4; i++) {
          const y0 = fy[i];
          pShape(ctx, `M-74 ${y0 - 9} Q-56 ${y0 - 11} -48 ${y0 - 4} Q-44 ${y0 + 5} -52 ${y0 + 11} L-74 ${y0 + 11} Q-82 ${y0 + 1} -74 ${y0 - 9} Z`, i < 2 ? c.hi : c.base, INK, 2.2);
          pShape(ctx, `M-62 ${y0 - 6} L-61 ${y0 + 8}`, null, c.dark, 1.4);
        }
        // Opposing sculpted RIGHT thumb pressing side power button!
        pShape(ctx, 'M82 14 Q74 -14 54 -24 Q42 -26 42 -14 Q44 -2 58 6 L72 28 Z', c.hi, INK, 2.3);
        pShape(ctx, 'M58 -16 L54 -4', null, c.dark, 1.4);
      } else if (pose === 'knife-grip') {
        // Anatomically true RIGHT-HAND palm-side grip (vertical forearm, blade pointing right):
        //   - Four organically tapered curled fingers (pinky on left -> index on right, closest to blade)
        //   - Fleshy thumb base (thenar pad) rising organically from LOWER-RIGHT palm
        //   - Thumb curling naturally UP and LEFT across the curled index & middle fingers!
        const ln = c.ink || INK;
        // Lower palm & heel rising from vertical wrist
        pShape(ctx, 'M-20 27 Q-25 14 -23 2 L22 2 Q26 14 20 27 Z', c.base, ln, 2.2);
        // Subtle inner palm shadow on left (pinky side) & warm highlight on right (thenar side)
        pShape(ctx, 'M-19 26 Q-23 15 -22 4 L-12 4 Q-13 15 -10 26 Z', c.dark, null);
        pShape(ctx, 'M4 8 Q14 8 19 18 Q12 24 2 23 Z', c.hi, null);

        // Four organically curved & tapered fingers (left-to-right: pinky, ring, middle, index)
        const fingers = [
          { x: -19, w: 5.4, top: -12, bot: 10, fill: c.dark }, // Pinky (shortest, tucked by butt)
          { x: -7.5, w: 6.0, top: -15, bot: 12, fill: c.base }, // Ring
          { x: 5.0, w: 6.3, top: -16, bot: 12.5, fill: c.base }, // Middle
          { x: 17.5, w: 6.2, top: -15, bot: 11.5, fill: c.hi }, // Index (closest to steel bolster)
        ];
        for (const f of fingers) {
          pShape(
            ctx,
            `M${f.x - f.w} ${f.top + 3} Q${f.x} ${f.top - 3} ${f.x + f.w} ${f.top + 3} Q${f.x + f.w + 0.8} ${(f.top + f.bot) * 0.5} ${f.x + f.w - 0.6} ${f.bot - 2} Q${f.x} ${f.bot + 4} ${f.x - f.w + 0.6} ${f.bot - 2} Q${f.x - f.w - 0.8} ${(f.top + f.bot) * 0.5} ${f.x - f.w} ${f.top + 3} Z`,
            f.fill,
            ln,
            2.0,
          );
          // Soft organic finger joint crease
          pShape(ctx, `M${f.x - f.w * 0.55} ${f.top + 11} Q${f.x} ${f.top + 13} ${f.x + f.w * 0.55} ${f.top + 11}`, null, c.stitch, 1.3);
        }

        // Anatomically grounded THUMB rising from the RIGHT (blade-side) palm & wrapping LEFT over index + middle!
        pShape(
          ctx,
          'M18 23 Q27 12 26 -2 Q25 -15 14 -19 L-6 -20 Q-15 -19 -16 -12 Q-16 -5 -6 -5 L10 -5 Q15 -4 14 6 Q12 15 6 22',
          c.base,
          ln,
          2.2,
        );
        // Thumb shadow underside & warm dorsal highlight
        pShape(ctx, 'M-13 -8 Q-4 -6 10 -6 Q16 -5 15 4 L12 12 Q10 4 8 -2 L-11 -4 Z', c.dark, null);
        pShape(ctx, 'M-4 -17 Q8 -18 18 -12 Q22 -6 21 4 Q18 -6 12 -11 Q4 -15 -4 -17 Z', c.hi, null);
        // Thumb knuckle crease + natural thumbnail on the LEFT tip of the thumb
        pShape(ctx, 'M4 -17 Q6 -12 5 -7', null, c.stitch, 1.4);
        pShape(ctx, 'M-14 -14 Q-13 -18 -7 -18 L-5 -13 Q-6 -9 -11 -9 Q-14 -10 -14 -14 Z', c.nail, c.stitch, 1.0);
      } else if (pose === 'front-shotgun-grip-L' || pose === 'front-shotgun-grip-R') {
        const flip = pose === 'front-shotgun-grip-R' ? -1 : 1;
        ctx.scale(flip, 1);
        // Front-facing sculpted gloved fist with 4 distinct knuckle segments + thumb wrap!
        pShape(ctx, 'M-20 -12 L20 -12 Q25 0 22 14 L-22 14 Q-25 0 -20 -12 Z', c.base, INK, 2.2);
        for (let i = 0; i < 4; i++) {
          const xx = -15 + i * 10;
          pShape(ctx, `M${xx - 4} -11 L${xx + 4} -11 L${xx + 4} 11 L${xx - 4} 11 Z`, i % 2 ? c.hi : c.base, INK, 1.7);
          pShape(ctx, `M${xx - 3} -1 L${xx + 3} -1`, null, c.dark, 1.3);
        }
        // Opposing thumb wrapping cleanly over top edge
        pShape(ctx, 'M-18 -14 Q0 -22 16 -14 Q14 -6 -12 -6 Z', c.hi, INK, 2.0);
        // Leather wrist strap below fist
        pShape(ctx, 'M-18 14 L18 14 L20 26 L-20 26 Z', c.dark, INK, 2.0);
      }
    });
  };
})();
