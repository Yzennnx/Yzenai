window.drawAnatomyReference = async (panels, frames, parts, backgrounds, walkingPoses, motionFloor) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1524;
  const ctx = canvas.getContext('2d');
  const ink = '#263a39';
  const secondary = '#566860';
  const backgroundColor = '#f1e8d6';
  const png = () => canvas.toDataURL('image/png').split(',')[1];

  const load = async png => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    return image;
  };
  function text(value, x, y, size, weight = 400, color = ink) {
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }
  function card(x, y, width, height) {
    ctx.fillStyle = '#faf5e8';
    ctx.fillRect(x, y, width, height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#cbbb9d';
    ctx.strokeRect(x + .5, y + .5, width - 1, height - 1);
  }
  function fit(image, crop, x, y, width, height) {
    const [sx, sy, sw, sh] = crop;
    const scale = Math.min(width / sw, height / sh);
    const w = sw * scale;
    const h = sh * scale;
    ctx.drawImage(image, sx, sy, sw, sh, x + (width - w) / 2, y + (height - h) / 2, w, h);
  }

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text('WHAT HAPPENS NEXT?', 48, 50, 20, 700, '#9c473b');
  text('Series lead', 48, 107, 54, 700);
  text('Character turnaround, motion poses, expressions, and hands', 50, 144, 23, 400, secondary);

  const views = [
    ['front', 'Front'], ['profile', 'Side'], ['rear', 'Back'],
  ];
  const profile = await load(frames[0]);
  const floor = 548;
  for (const [i, [view, label]] of views.entries()) {
    const x = 48 + i * 508;
    card(x, 174, 488, 400);
    ctx.fillStyle = '#d9cdb5';
    ctx.fillRect(x + 40, floor, 408, 1);
    if (view === 'profile') {
      // Align Side view crown (floor - 331) and soles (floor) identically with Front & Back turnarounds!
      ctx.drawImage(profile, 300, 488, 440, 1024, x + 170, floor - 349, 150, 349);
    } else {
      drawAnatomyTurnaround(ctx, x + 244, floor, .69, view);
    }
    text(label, x + 18, 602, 24, 700);
  }
  text('Motion poses', 48, 644, 26, 700);
  ctx.translate(0, 484);

  await Promise.all(panels.map(async ({ id, crop, label, contact }, i) => {
    const [background, figure] = await Promise.all([load(backgrounds[id]), load(frames[i])]);
    const x = 48 + i * 380;
    card(x, 174, 364, 454);
    fit(background, crop, x + 16, 186, 332, 363);
    fit(figure, crop, x + 16, 186, 332, 363);
    text(label, x + 20, 582, 26, 700);
    text(contact, x + 20, 610, 18, 400, secondary);
  }));

  text('Side-facing expressions', 48, 685, 28, 700);
  text('Hand poses', 1064, 685, 28, 700);
  const expressions = [
    ['head', 'Neutral'], ['head-notice', 'Noticing'], ['head-alarm', 'Alarm'],
    ['head-strain', 'Strain'], ['head-relief', 'Relief'],
  ];
  await Promise.all(expressions.map(async ([part, label], i) => {
    const image = await load(parts[part]);
    const x = 48 + i * 200;
    card(x, 707, 188, 219);
    fit(image, [228,139,197,198], x + 13, 716, 162, 160);
    text(label, x + 16, 903, 21, 700);
  }));
  const hands = [['hand-near', 'Relaxed'], ['hand-grip', 'Grip'], ['hand-brace', 'Flat palm']];
  await Promise.all(hands.map(async ([part, label], i) => {
    const image = await load(parts[part]);
    const x = 1064 + i * 164;
    card(x, 707, 160, 219);
    fit(image, [297,278,118,86], x + 8, 731, 144, 148);
    text(label, x + 14, 903, 20, 700);
  }));

  const colors = ['#644638', '#e7ae87', '#e8e1cc', '#813b43', '#465366', '#60453d'];
  for (const [i, color] of colors.entries()) {
    ctx.fillStyle = color;
    ctx.fillRect(48 + i * 30, 975, 23, 23);
  }
  text('Match the sleeve, hand, and grip when cutting between first and third person.',
    248, 995, 22, 400, secondary);
  const overview = png();

  const phases = [
    ['1. Heel contact', 'Lead heel down, rear toe still down'],
    ['2. Weight transfer', 'Lead foot flat, hips settle'],
    ['3. Passing', 'Swing foot clears the floor'],
    ['4. Push-off', 'Trailing heel lifts into toe release'],
  ];
  canvas.height = 590;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text('Walking toward camera', 48, 73, 49, 700);
  text('Front view · Four key poses from the walking loop', 50, 109, 22, 400, secondary);
  for (const [i, [label, note]] of phases.entries()) {
    const x = 48 + i * 380;
    card(x, 138, 364, 374);
    ctx.fillStyle = '#d9cdb5';
    ctx.fillRect(x + 26, 481, 312, 1);
    ctx.save();
    ctx.translate(x + 182, 481);
    ctx.scale(.65, .65);
    ctx.translate(0, -motionFloor);
    const [frame, pose] = walkingPoses[i];
    drawAnatomyDepthPose(ctx, pose, 'front', 'walk', 0, motionFloor, anatomyGaitSway('walk', frame));
    ctx.restore();
    text(label, x + 9, 544, 24, 700);
    text(note, x + 9, 570, 18, 400, secondary);
  }
  const walking = png();

  const allReactions = [
    ['head', 'Neutral'], ['head-notice', 'Alert / Noticing'], ['head-alarm', 'Shock / Gasp'], ['head-dread', 'Cold Dread'],
    ['head-panic', 'Panic'], ['head-strain', 'Heavy Effort'], ['head-determined', 'Determined'], ['head-angry', 'Fierce / Shout'],
    ['head-exhausted', 'Exhausted'], ['head-pain', 'Pain / Wince'], ['head-sneak', 'Stealth'], ['head-relief', 'Relief / Exhale'],
  ];

  // High-res 12-reaction Front expression sheet (4x3 grid, 1600x1160)
  canvas.height = 1160;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text('Front-view reactions (12 expressions)', 48, 72, 46, 700);
  text('Sculpted planes, lidded eyes with iris & catchlight, sweat & shadow cues', 50, 108, 22, 400, secondary);
  for (const [i, [part, label]] of allReactions.entries()) {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 48 + col * 380;
    const y = 136 + row * 336;
    card(x, y, 364, 276);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, 362, 274);
    ctx.clip();
    drawAnatomyTurnaround(ctx, x + 182, y + 1390, 2.85, 'front', { hideLimbs: true, expression: part });
    ctx.restore();
    text(label, x + 12, y + 312, 24, 700);
  }
  const reactions = png();

  // High-res 12-reaction Side profile expression sheet (4x3 grid, 1600x1160)
  canvas.height = 1160;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text('Side-profile reactions (12 expressions)', 48, 72, 46, 700);
  text('Matching OpenToonz cutout head layers for all 12 emotions', 50, 108, 22, 400, secondary);
  await Promise.all(allReactions.map(async ([part, label], i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 48 + col * 380;
    const y = 136 + row * 336;
    card(x, y, 364, 276);
    const image = await load(parts[part]);
    fit(image, [224, 134, 206, 206], x + 56, y + 18, 252, 244);
    text(label, x + 12, y + 312, 24, 700);
  }));
  const reactionsSide = png();

  // Cinematic Anatomy & Camera Angles sheet (1600x640, 4 cards: OTS, Overhead, Low-Angle, High-Angle)
  canvas.height = 640;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text('Cinematic anatomy angles', 48, 72, 46, 700);
  text('Horror & survival camera perspectives (zero three-quarter turnarounds)', 50, 108, 22, 400, secondary);
  const cinematicCards = [
    ['ots', 'Over-the-Shoulder (OTS)', 'Foreground head/shoulder framing depth corridor'],
    ['overhead', 'Overhead / Top-Down', 'Geography resets, bed traps, and floor pickups'],
    ['low-angle', 'Low-Angle Dramatic', 'Looming tension, confrontation, or upward jump'],
    ['high-angle', 'High-Angle Vulnerable', 'Cornered horror beats looking down at the lead'],
  ];
  for (const [i, [angle, label, note]] of cinematicCards.entries()) {
    const x = 48 + i * 380;
    card(x, 136, 364, 412);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, 137, 362, 410);
    ctx.clip();
    drawCinematicAngle(ctx, x + 182, 342, 1.18, angle);
    ctx.restore();
    text(label, x + 10, 582, 23, 700);
    text(note, x + 10, 608, 16, 400, secondary);
  }
  const anglesSheet = png();

  // Cinematic Face Tilts, Gazes & Crash-Zoom ECU sheet (1600x920, 3x2 grid)
  canvas.height = 920;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text('Face angles, gazes & crash-zoom framing', 48, 72, 46, 700);
  text('Micro-acting cues for audio turns, zooms, and looking-around POV', 50, 108, 22, 400, secondary);
  const faceCards = [
    ['eye-dart', 'Eye-Dart Sideways', 'Hearing a cue off-screen before whipping around'],
    ['head-tilt', 'Eerie Head Tilt (12°)', 'Uncanny questions, realization, or dread beat'],
    ['look-up', 'Looking Up (High Threat)', 'Foreshortened chin gazing toward looming danger'],
    ['look-down', 'Looking Down (Floor Clue)', 'Setup for downward POV prop or ground insert'],
    ['glance-back', 'Quick Glance Over Shoulder', 'Startled side profile turn on footsteps behind'],
    ['ecu-dread', 'Off-Center ECU Crash-Zoom', 'Tight detail punch-in with dread shadow & sweat'],
  ];
  for (const [i, [mode, label, note]] of faceCards.entries()) {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 48 + col * 510;
    const y = 136 + row * 382;
    card(x, y, 488, 310);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, 486, 308);
    ctx.clip();
    drawFaceAngle(ctx, x + 244, y + 156, mode === 'ecu-dread' ? 1.44 : 1.32, mode);
    ctx.restore();
    text(label, x + 12, y + 340, 23, 700);
    text(note, x + 12, y + 364, 17, 400, secondary);
  }
  const faceAngles = png();

  // First-Person POV Survival Hands sheet (1600x600) + individual 512x512 transparent PNGs!
  const povHandCards = [
    ['pov-pipe-grip', 'POV Pipe / Weapon Grip', 'Bottom-right survival weapon hold into frame'],
    ['pov-flashlight', 'POV Flashlight Sweep', 'Tactical light aimed ahead, thumb on switch'],
    ['pov-door-lock', 'POV Deadbolt Lock Turn', 'Rhythmic lock-the-door beat in tight POV'],
    ['pov-shield-face', 'POV Defensive Shield', 'Splayed palm recoil against scare or glare'],
  ];
  const povHands = {};
  const handCanvas = document.createElement('canvas');
  handCanvas.width = 512;
  handCanvas.height = 512;
  const hctx = handCanvas.getContext('2d');
  for (const [id] of povHandCards) {
    hctx.clearRect(0, 0, 512, 512);
    hctx.save();
    hctx.scale(512 / 360, 512 / 360);
    drawPovSurvivalHand(hctx, id);
    hctx.restore();
    povHands[id] = handCanvas.toDataURL('image/png').split(',')[1];
  }

  canvas.height = 600;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text('First-person POV survival hands', 48, 72, 46, 700);
  text('Right hand with cream shirt cuff for POV weapon, light, lock, and recoil inserts', 50, 108, 22, 400, secondary);
  await Promise.all(povHandCards.map(async ([id, label, note], i) => {
    const x = 48 + i * 380;
    card(x, 136, 364, 376);
    const img = await load(povHands[id]);
    ctx.drawImage(img, x + 12, 146, 340, 340);
    text(label, x + 10, 544, 23, 700);
    text(note, x + 10, 570, 16, 400, secondary);
  }));
  const povHandsSheet = png();

  return { overview, walking, reactions, reactionsSide, anglesSheet, faceAngles, povHandsSheet, povHands };
};
