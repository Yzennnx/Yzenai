window.drawMotionReference = (action, views, poses, floor, fps) => {
  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 620;
  const ctx = canvas.getContext('2d');
  const run = action === 'run';
  const gait = run || action === 'walk';
  const label = { run: 'Run', walk: 'Walk', sit: 'Sit down', brace: 'Catch the lean' }[action];
  return Object.fromEntries(views.map(view => [view, poses.map((pose, frame) => {
    ctx.fillStyle = '#f9efd9';
    ctx.fillRect(0, 0, 540, 620);
    ctx.fillStyle = '#e9d8b7';
    ctx.fillRect(0, 523, 540, 97);
    ctx.fillStyle = '#aa9570';
    ctx.fillRect(0, 523, 540, 1);
    ctx.save();
    ctx.translate(270, 523);
    ctx.scale(.93, .93);
    ctx.translate(-270, -floor);
    if (view === 'side') {
      const offset = frame * (run ? 304 / 18 : 145 / 28) % 75;
      for (let x = 0; x < 615; x += 75) ctx.fillRect(x - offset, floor + 4, 19, 2);
      drawAnatomySidePose(ctx, pose);
    } else {
      const sway = gait ? anatomyGaitSway(action, frame) : 0;
      drawAnatomyDepthPose(ctx, pose, view, action, 270, floor, sway);
    }
    ctx.restore();
    ctx.fillStyle = '#253a3b';
    ctx.font = 'bold 24px Arial';
    const angle = view === 'rear' ? 'Back' : view === 'front' ? 'Front' : 'Side';
    ctx.fillText(`${label} · ${angle}`, 20, 33);
    ctx.font = '16px Consolas';
    ctx.fillText(`Frame ${String(frame).padStart(2, '0')}  ·  ${(frame / fps).toFixed(2)} s`, 20, 595);
    if (gait) ctx.fillText('In-place cycle', 387, 595);
    return canvas.toDataURL('image/png').split(',')[1];
  })]));
};
