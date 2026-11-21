(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  const W = 540, H = 960;
  const ink = '#18272b', cream = '#eee2c7', gold = '#e4b969', teal = '#80c3b5';
  const skin = '#e7ae87', shadow = '#c28770';
  const grain = document.createElement('canvas');
  grain.width = W;
  grain.height = H;
  const grainInk = grain.getContext('2d');
  let seed = 74;
  const random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 17000; i++) {
    grainInk.fillStyle = i % 3 ? '#f8ddac10' : '#0c0e172b';
    grainInk.fillRect(random() * W, random() * H, .5 + random() * 2.3, .6 + random());
  }

  function rect(color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }
  function shape(commands, color, outline = null, width = 2) {
    const path = new Path2D(commands);
    if (color) { ctx.fillStyle = color; ctx.fill(path); }
    if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = width; ctx.stroke(path); }
  }
  function oval(x, y, rx, ry, color, outline = null, width = 2) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = width; ctx.stroke(); }
  }
  function label(value, x, y, size, color = cream, align = 'center') {
    ctx.font = `bold ${size}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
  }
  function tone(top, bottom) {
    const gradient = ctx.createLinearGradient(0, 0, 420, 940);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    rect(gradient, 0, 0, W, H);
  }
  const clamp = n => Math.max(0, Math.min(1, n));
  function ease(t, start, end) {
    const x = clamp((t - start) / (end - start));
    return x * x * (3 - 2 * x);
  }
  const mix = (a, b, t) => a + (b - a) * t;

  function crumb(x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    shape('M-14 5 L-10 -5 -1 -10 11 -5 14 4 6 10 -7 8Z', '#63665a', ink);
    shape('M-10 -5 L-1 -10 11 -5 6 1 -6 1Z', '#999481');
    shape('M-4 -3 L2 -6 5 -4 M-8 5 L-3 6', null, '#b6ab89', 1.2);
    ctx.restore();
  }
  function placard(x, y, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    shape('M-58 -18 H58 V19 H-58Z', '#cda96a', '#4c4234');
    rect('#814b43', -58, -18, 6, 37);
    label('URANIUM', 3, 6, 15, '#382b2d');
    ctx.restore();
  }

  function room(clinic = false) {
    tone(clinic ? '#2e4650' : '#293e3e', clinic ? '#63817c' : '#577067');
    const cell = clinic ? 106 : 113;
    for (let x = -25; x < W; x += cell) rect('#112b2e46', x, 200, 2, 545);
    for (let y = 270; y < 745; y += 89) rect('#a7cbad23', 0, y, W, 2);
    rect('#192f35', 306, 249, 143, 208);
    rect('#476969', 311, 255, 132, 196);
    for (let y = 268; y <= 428; y += 20) rect('#67898580', 319, y, 116, 3);
    shape('M174 247 L330 247 458 710 56 710Z', '#f9df9c16');
    rect('#233940', 169, 225, 166, 19);
    rect('#f0d398', 182, 238, 139, 7);
    rect('#253c3c', 0, 745, W, 14);
    rect(clinic ? '#455f62' : '#404e49', 0, 759, W, 201);
  }

  function worktable(clinic, t) {
    const surface = clinic ? '#7e9b94' : '#9d896b';
    shape('M239 525 L454 519 503 559 227 566Z', surface, ink, 2);
    shape('M227 566 L503 559 503 579 227 586Z', clinic ? '#385c61' : '#624e3e', ink);
    rect('#344b48', 240, 584, 13, 145);
    rect('#344b48', 481, 577, 13, 152);
    if (!clinic) {
      shape('M333 530 L410 528 429 548 330 553Z', '#bfb5a0', ink);
      placard(378, 545, .49);
      if (t > 45.9) return;
      shape('M308 529 L337 528 347 539 314 540Z', '#14272d', '#25383d', 1);
      shape('M311 530 L335 529 341 536 316 537Z', '#5b8385');
    }
  }

  // Dorsal view. The thumb stays on the inside and the three free fingers fold under.
  function pickupHand(x, y, grip, lift) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(mix(-.49, -.66, lift));
    ctx.scale(mix(1, .94, lift), 1);
    shape('M-5 102 Q-5 131 -12 165 L-27 352 H65 L47 165 Q39 129 36 102Z', '#e8e1cc', ink, 2.6);
    shape('M-4 113 L7 122 Q2 186 -15 345 H-25 L-11 165Z', '#bab49f');
    shape('M33 136 Q34 164 39 180 M4 138 Q2 159 0 169', null, '#a9a494', 1.4);

    // Both silhouettes share the wrist and the three flexed knuckles.
    const thumbTop = mix(43, 4, grip), thumbOuter = mix(-20, -17, grip);
    const thumbInner = mix(-9, -5, grip);
    const thumb = [
      'Q', thumbOuter-mix(3, 12, grip), thumbTop+mix(14, 27, grip), thumbOuter, thumbTop+5,
      'Q', thumbOuter+3, thumbTop-2, thumbInner-4, thumbTop,
      'Q', thumbInner+1, thumbTop+1, thumbInner, thumbTop+8,
      'Q', mix(-9, -15, grip), mix(54, 34, grip), -7, 50,
    ].join(' ');
    shape('M-4 105 Q-6 94-14 83 Q-22 71-22 60 ' + thumb +
      ' Q-6 44-7 35 L-8 9 Q-9-1-3-5 Q4-9 8-2 Q11 2 11 11 L13 47 ' +
      'Q13 38 19 33 Q25 28 32 32 Q40 36 40 48 Q43 43 49 45 Q56 48 55 61 ' +
      'Q59 57 64 61 Q69 65 66 76 L60 88 Q53 99 38 106Z', skin, ink, 2.6);
    shape('M-20 61 Q-18 76-9 85 Q-1 96 0 104 L9 104 Q6 91-1 81 Q-12 70-11 61Z', shadow);
    shape('M8 64 Q15 50 25 52 Q38 51 47 64 Q43 79 33 85 Q17 85 8 74Z', '#efb991');
    shape('M39 47 Q37 54 39 61 M55 60 Q53 68 51 73 M13 47 Q14 53 13 58', null, '#a6735f', 1.35);
    shape('M-6 18 Q1 16 8 18 M-6 33 Q0 32 9 34 M-18 64 Q-16 68-12 71', null, '#a6735f', 1.25);
    shape('M-4 0 Q0-3 5 0 L6 6 Q4 10-2 8 L-4 6Z', '#f0c1a4', '#b5836d', .8);
    shape('M-5 102 Q14 106 37 101 L40 118 Q17 125-8 119Z', '#f1e8d1', ink, 2.3);
    shape('M-5 114 Q16 119 37 112', null, '#aca68f', 1.2);
    ctx.restore();
  }

  function supportingHand() {
    ctx.save();
    ctx.translate(92, 720);
    ctx.rotate(.52);
    shape('M-18 17 Q-34 1-42-29 L-49-71 Q-42-100-18-111 Q6-119 27-98 L35-64 Q61-64 61-47 L49-14 Q39 2 23 14Z', '#493c3039');
    shape('M-22-1 L-27 53 -34 224 H49 L28 48 23-1Z', '#e8e1cc', ink, 2.5);
    shape('M-22 10 L-12 19 -21 222 H-33Z', '#bab49f');
    shape('M-19 4 Q-21-11-27-23 Q-33-34-35-45 L-41-70 Q-42-77-37-80 Q-31-83-28-76 L-26-73 L-29-91 Q-32-99-26-102 Q-19-104-15-96 L-13-90 L-14-104 Q-15-112-8-113 Q0-114 3-106 L5-98 Q6-104 11-105 Q18-105 21-95 L27-65 Q31-55 32-46 L41-54 Q46-59 51-56 Q57-52 52-45 L42-23 Q37-14 30-10 L22 5Z', skin, ink, 2.4);
    shape('M-37-65 Q-28-51-24-39 Q-18-27-8-19 Q-3-11-5 1 L-18 1 Q-20-10-27-24 Q-32-34-35-46Z', shadow);
    shape('M-12-49 Q-4-56 7-52 Q20-47 22-34 Q15-24 4-25 Q-7-27-12-38Z', '#efb991');
    shape('M-25-72 Q-24-61-19-51 M-13-88 Q-12-71-7-57 M5-97 Q6-78 12-61 M31-45 Q28-41 27-34', null, '#aa755f', 1.35);
    shape('M-34-65 L-28-66 M-19-76 L-13-77 M-4-84 L3-84 M13-79 L20-79 M-16-42 Q-11-45-8-43 M2-48 L8-48 M14-46 L20-44', null, '#a77762', 1.1);
    shape('M-39-73 Q-35-78-32-74 L-31-69 Q-34-67-38-69Z M-26-96 Q-22-100-19-95 L-18-90 Q-21-88-25-91Z M-10-106 Q-7-110-3-106 L-2-100 Q-6-98-9-101Z M8-99 Q12-102 16-98 L17-92 Q14-90 10-93Z', '#edbea1', '#bc8b74', .65);
    shape('M-21 0 Q1 4 23 0 L25 16 Q3 22-24 16Z', '#f1e8d1', ink, 2.1);
    shape('M-21 12 Q2 17 21 11', null, '#aaa18a', 1.2);
    ctx.restore();
  }

  function pov(t) {
    tone('#314849', '#23383b');
    ctx.save();
    const zoom = 1.25 + .09 * ease(t, .2, 3.1);
    ctx.translate(255, 526);
    ctx.scale(zoom, zoom);
    ctx.translate(-248, -512);
    shape('M-20 376 L384 340 568 437 565 892 -45 767Z', '#95846d', ink, 4);
    shape('M-20 726 L565 793 565 892 -45 767Z', '#584f45');
    for (let i = 0; i < 7; i++) {
      const y = 426 + i * 46;
      shape(`M0 ${y} L540 ${y+45}`, null, '#d7c7a224', 1.2);
    }
    shape('M113 442 L362 428 435 586 83 605Z', '#3c5050', '#2a3d3c', 4);
    shape('M128 450 L352 440 409 571 104 590Z', '#adb1a0', '#60736a', 2);
    shape('M130 461 L345 450 386 552 119 569Z', '#8c9b90');
    const arrive = ease(t, .9, 3);
    const grip = ease(t, 4.75, 5.83);
    const lift = ease(t, 5.83, 6.75);
    const x = mix(394, 249, arrive) + 46 * lift;
    const y = mix(661, 504, arrive) - 39 * lift;
    if (t < 5.83) {
      oval(244, 513, 15, 5, '#1c2b3152');
      crumb(244, 503, .74);
    }
    pickupHand(x, y, grip, lift);
    if (t >= 5.83) crumb(x - 5, y + 1, .74);
    supportingHand();
    ctx.restore();
  }

  function figure(t, image, anchors) {
    const clinic = t >= 54.75;
    room(clinic);
    ctx.save();
    const close = t < 12.5 ? 2.82 : t < 27.25 ? 2.69 : clinic ? 2.1 : 2.24;
    ctx.translate(t >= 22 && t < 27.25 ? 216 : 254, 658);
    ctx.scale(close, close);
    ctx.translate(-258, -448);
    worktable(clinic, t);
    ctx.drawImage(image, 0, 0, W, H);
    const [x, y, angle] = anchors.wrist;
    if (t < 9.75) {
      const a = angle * Math.PI / 180;
      crumb(x + 26*Math.cos(a), y + 26*Math.sin(a), .31);
    }
    if (t > 45.82 && t < 48) {
      ctx.save();
      ctx.translate(x+10, y-6);
      ctx.rotate((angle+22)*Math.PI/180);
      shape('M-8-16 H5 Q8-16 8-13 V13 Q8 16 5 16 H-8Z', '#1c3038', '#102129', 1);
      rect('#85b4b0', -6, -13, 12, 22);
      ctx.restore();
    }
    if (clinic) {
      sampleCup(339 + 75 * ease(t, 56.1, 59.35), 515, .46);
    }
    ctx.restore();
    if (clinic) label('LATER', 420, 311, 22, teal);
  }

  const gutPath = 'M270 392 C265 440 309 448 323 494 C341 548 320 581 280 580 C238 579 212 572 206 608 Q197 641 231 651 Q272 658 290 681 Q306 708 257 726 L257 759';
  function gut(t) {
    tone('#203537', '#16282d');
    oval(267, 568, 207, 205, '#364446', '#5b6662', 2);
    shape('M214 382 Q237 343 268 343 Q300 343 325 382 L395 422 420 711 Q365 786 270 789 Q175 787 118 711 L146 435Z', '#715750', '#a2786a', 2);
    shape('M274 468 C309 458 349 475 351 517 C352 550 327 576 293 577 C250 578 236 567 212 579 Q188 589 188 622 L174 622 Q163 580 204 552 Q220 538 224 505 Q228 474 274 468Z', '#b47468', '#503b41', 4);
    shape('M178 622 C169 590 195 579 225 588 L348 588 Q372 589 374 617 L366 722 Q361 750 326 751 H267 L259 774', null, '#ce9280', 24);
    shape('M203 620 Q237 608 299 620 Q337 631 309 646 L231 653 Q208 655 223 671 Q243 689 303 675 Q337 671 331 699 Q326 717 249 724', null, '#e0a18a', 15);
    shape(gutPath, null, '#533f48', 12);
    const p = ease(t, 12.5, 21.8);
    const nodes = [[270,392],[271,431],[301,459],[322,494],[328,541],[309,570],[280,580],
      [230,578],[206,608],[213,640],[256,660],[290,681],[281,710],[257,726],[257,759]];
    const i = Math.min(nodes.length - 2, Math.floor(p*(nodes.length - 1)));
    const f = p * (nodes.length - 1) - i;
    const x = mix(nodes[i][0], nodes[i+1][0], f);
    const y = mix(nodes[i][1], nodes[i+1][1], f);
    oval(x, y, 9, 9, gold, '#322e37');
    label('DIGESTIVE TRACT', 270, 315, 23, gold);
    if (t > 18.8) label('MOST PASSES THROUGH', 270, 826, 22, cream);
  }

  function blood(t) {
    tone('#152f37', '#173d46');
    shape('M0 388 C151 324 225 472 322 454 C408 437 428 372 540 407 L540 481 C429 451 403 518 334 532 C198 556 138 429 0 461Z', '#986760', '#d19479', 4);
    shape('M0 657 C143 615 229 737 333 655 C374 623 392 572 540 606 L540 724 C416 697 409 742 359 777 C234 859 110 739 0 782Z', '#724d50', '#aa7170', 5);
    for (let i = 0; i < 9; i++) {
      const x = ((i * 64 + (t - 27.25) * 58) % 610) - 35;
      const y = 701 + 37*Math.sin(x/86);
      oval(x, y, 17, 8, '#ba7571', '#de9082', 1);
      oval(x, y, 7, 3, '#9f5d61');
    }
    for (let i = 0; i < 6; i++) {
      const p = ease(t, 27.65 + .27*i, 32.3 + .20*i);
      const x = 173 + i*32 + 19*Math.sin(p*6+i);
      const y = mix(458+i*6, 685+i*6, p);
      oval(x, y, 5, 5, gold, '#322b35', 1);
    }
    label('INTESTINE', 270, 325, 23, gold);
    label('BLOODSTREAM', 270, 844, 23, teal);
  }

  function kidney(t) {
    tone('#2c323c', '#192c34');
    const p = ease(t, 34, 36.5);
    shape('M270 410 L270 619 M270 479 Q232 459 196 513 M270 479 Q305 459 342 513', null, '#b96b73', 15);
    shape('M174 451 C124 448 100 481 103 542 C106 592 141 628 182 610 C210 595 200 566 190 548 C176 527 192 526 204 513 C225 480 206 451 174 451Z', '#b47a76', '#612f45', 4);
    shape('M366 451 C416 448 440 481 437 542 C434 592 399 628 358 610 C330 595 340 566 350 548 C364 527 348 526 336 513 C315 480 334 451 366 451Z', '#b47a76', '#612f45', 4);
    shape('M153 492 Q125 522 145 560 Q152 576 168 579 M387 492 Q415 522 395 560 Q388 576 372 579', null, '#eead93', 6);
    oval(270, mix(412, 483, p), 6, 6, gold);
    for (const side of [-1, 1]) oval(270 + 68*side*p, 486 + 25*p, 6, 6, gold);
    label('KIDNEYS', 270, 320, 25, gold);
    if (t >= 39.1) {
      ctx.globalAlpha = ease(t, 39.1, 39.55);
      shape('M345 570 L310 647', null, teal, 2);
      oval(270, 745, 192, 106, '#25383d', teal, 2);
      shape('M139 731 Q165 696 188 726 T238 730 T288 732 T339 727 T395 734 M139 760 Q165 725 188 755 T238 759 T288 761 T339 756 T395 763', null, '#bc8482', 10);
      const injury = ease(t, 41.10, 43.5);
      for (let i = 0; i < 5; i++) {
        const x = 245 + i*14;
        oval(x, 751 + 7*Math.sin(i), 3 + 3*injury, 3, i > 1 && injury > .5 ? '#d97e76' : gold);
      }
      label('TUBULES', 270, 823, 19, teal);
      ctx.globalAlpha = 1;
    }
  }

  function sampleCup(x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    shape('M-48-48 H48 L39 49 Q0 60-39 49Z', '#a1bdaf', ink, 3);
    shape('M-42 17 Q0 24 42 16 L38 46 Q0 55-38 46Z', '#bfa15e');
    rect('#eee3c5', -35, -23, 69, 32);
    label('SAMPLE', 0, -1, 13, '#253839');
    oval(0, -45, 51, 12, '#5d8480', ink, 2);
    rect('#385b5b', -51, -46, 102, 9);
    oval(0, -48, 51, 11, '#739d94', ink, 2);
    ctx.restore();
  }
  function sample(t) {
    room(true);
    shape('M0 570 L540 552 540 960 H0Z', '#7e9b94', ink, 3);
    shape('M0 687 L540 663 540 960 H0Z', '#466667');
    const settle = ease(t, 51.7, 54.5);
    const x = mix(242, 272, settle), y = mix(544, 615, settle);
    const withdraw = ease(t, 54.25, 54.73);
    oval(x, 668, 70, 16, '#34575765');
    ctx.save();
    ctx.translate(x + 120*withdraw, y + 74*withdraw);
    shape('M65 56 Q92 72 131 99 L291 242 271 305 116 166 37 95Z', '#e8e1cc', ink, 3.5);
    shape('M64 53 L88 76 67 109 38 90Z', '#f0e6cb', ink, 2.8);
    shape('M41 91 Q23 75 14 51 L-12 24 Q-22 13 -13 1 Q-7 -5 1 2 L23 19 Q21 7 33 1 Q44 -4 53 6 Q66 21 69 38 Q72 51 64 62Z', skin, ink, 3);
    ctx.restore();
    sampleCup(x, y, 1.16);
    ctx.save();
    ctx.translate(x + 120*withdraw, y + 74*withdraw);
    shape('M64 63 Q53 65 44 57 Q35 50 33 40 Q30 34 21 31 L9 25 Q0 20 4 13 Q8 8 16 11 L46 17 Q58 19 64 26 Q73 36 69 48', skin, ink, 2.8);
    shape('M12 14 Q20 14 25 18 L22 23 Q14 22 10 19Z', '#f3c09d', '#af7967', 1.1);
    shape('M38 24 Q43 30 44 34', null, '#ad7460', 1.5);
    ctx.restore();
  }

  function trayLabel() {
    tone('#354746', '#726651');
    shape('M-25 462 L444 418 558 684 -14 741Z', '#89988b', '#384e4f', 7);
    shape('M-20 488 L435 446 513 660 -20 702Z', '#a6ac98', '#657a70', 3);
    placard(276, 572, 2.85);
  }

  function load(base64) {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    return image.decode().then(() => image);
  }
  window.renderUraniumFrame = async (frame, cutout, anchors) => {
    const t = frame/24;
    ctx.setTransform(2,0,0,2,0,0);
    ctx.lineCap = ctx.lineJoin = 'round';
    if (t < 6.75) pov(t);
    else if (t >= 24.75 && t < 25.5) trayLabel();
    else if (cutout) figure(t, await load(cutout), anchors);
    else if (t < 22) gut(t);
    else if (t < 34) blood(t);
    else if (t < 48) kidney(t);
    else sample(t);
    ctx.drawImage(grain, 0, 0);
    const vignette = ctx.createRadialGradient(270,489,270,270,489,560);
    vignette.addColorStop(0, '#05141900');
    vignette.addColorStop(1, '#0612156c');
    rect(vignette, 0, 0, W, H);
    return canvas.toDataURL('image/jpeg', .93).split(',')[1];
  };
})();
