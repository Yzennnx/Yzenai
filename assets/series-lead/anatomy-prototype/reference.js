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
    ['front', 'Front'], ['front-quarter', 'Front three-quarter'], ['profile', 'Side'],
    ['rear-quarter', 'Rear three-quarter'], ['rear', 'Back'],
  ];
  const profile = await load(frames[0]);
  const floor = 548;
  for (const [i, [view, label]] of views.entries()) {
    const x = 48 + i * 304;
    card(x, 174, 288, 400);
    ctx.fillStyle = '#d9cdb5';
    ctx.fillRect(x + 19, floor, 250, 1);
    if (view === 'profile') {
      ctx.drawImage(profile, 320, 512, 440, 1000, x + 68, floor - 345, 151.8, 345);
    } else {
      drawAnatomyTurnaround(ctx, x + 144, floor, .69, view);
    }
    text(label, x + 16, 602, 24, 700);
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

  canvas.height = 470;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text('Front-view reactions', 48, 73, 49, 700);
  for (const [i, [part, label]] of expressions.entries()) {
    const x = 48 + i * 304;
    card(x, 118, 288, 278);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, 119, 286, 276);
    ctx.clip();
    drawAnatomyTurnaround(ctx, x + 144, 1515, 2.85, 'front', { hideLimbs: true, expression: part });
    ctx.restore();
    text(label, x + 10, 434, 26, 700);
  }
  return { overview, walking, reactions: png() };
};
