// Every character and prop is drawn with canvas paths — original art,
// no image files. The turkey is a plump brown bird with a fanned tail,
// red wattle and a panicked eye; the farmer is a tall figure in a straw
// hat, checked shirt and apron, pitchfork in hand; the oven glows, the
// carving knife flashes, and the forest gate is the way out.
export function drawTurkey(ctx, x, y, w, h, pose) {
  const t = pose.time;
  const runBob = pose.running ? Math.sin(t * 14) * 3 : 0;
  const flap = pose.running ? Math.sin(t * 14) * 0.35 : 0.1;
  const squash = pose.sliding ? 0.55 : 1;
  ctx.save();
  ctx.translate(x + w / 2, y + h);
  ctx.scale(1, squash);

  // Fanned tail: five feathers behind the body.
  ctx.fillStyle = '#8a5a2b';
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.rotate(i * 0.32 + flap * 0.4);
    ctx.beginPath();
    ctx.ellipse(-16, -h * 0.72, 9, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c98f3d';
    ctx.beginPath();
    ctx.ellipse(-16, -h * 0.86, 4, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    ctx.restore();
  }

  // Body: a plump brown oval.
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.42 + runBob, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(2, -h * 0.38 + runBob, w * 0.34, h * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing, flapping as it runs.
  ctx.fillStyle = '#5a3a1e';
  ctx.save();
  ctx.translate(-2, -h * 0.45 + runBob);
  ctx.rotate(-0.5 - flap);
  ctx.beginPath();
  ctx.ellipse(-8, 0, 16, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Legs, scissoring while running.
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const legSwing = pose.running ? Math.sin(t * 14) * 10 : 0;
  ctx.beginPath();
  ctx.moveTo(-6, -h * 0.08);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(6, -h * 0.08);
  ctx.lineTo(6 - legSwing, 0);
  ctx.stroke();

  // Neck and head, looking ahead with a wide panicked eye.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(12, -h * 0.78 + runBob, 8, 14, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d97b2f';
  ctx.beginPath();
  ctx.arc(16, -h * 0.92 + runBob, 11, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#e8a33d';
  ctx.beginPath();
  ctx.moveTo(24, -h * 0.92 + runBob);
  ctx.lineTo(36, -h * 0.88 + runBob);
  ctx.lineTo(24, -h * 0.84 + runBob);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(24, -h * 0.8 + runBob, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Panicked eye.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(19, -h * 0.96 + runBob, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(20.5, -h * 0.96 + runBob, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Sweat drop when the farmer is close.
  if (pose.scared) {
    ctx.fillStyle = '#7fd4ff';
    ctx.beginPath();
    ctx.ellipse(30, -h * 1.05 + runBob, 4, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFarmer(ctx, x, y, w, h, pose) {
  const t = pose.time;
  const bob = Math.sin(t * 11) * 2;
  const lean = pose.state === 'corner' ? 0.18 : 0.08;
  ctx.save();
  ctx.translate(x + w / 2, y + h);
  ctx.rotate(lean);

  // Legs, pounding after the turkey.
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const swing = Math.sin(t * 11) * 12;
  ctx.beginPath();
  ctx.moveTo(-8, -h * 0.42);
  ctx.lineTo(-8 + swing, 0);
  ctx.moveTo(8, -h * 0.42);
  ctx.lineTo(8 - swing, 0);
  ctx.stroke();

  // Apron over a checked shirt.
  ctx.fillStyle = '#b03a2e';
  ctx.fillRect(-w * 0.32, -h * 0.78 + bob, w * 0.64, h * 0.4);
  ctx.fillStyle = '#e8e0c8';
  ctx.fillRect(-w * 0.24, -h * 0.74 + bob, w * 0.48, h * 0.32);
  ctx.fillStyle = '#b03a2e';
  ctx.fillRect(-w * 0.24, -h * 0.74 + bob, w * 0.48, 5);

  // Arms reaching forward, one holding the pitchfork.
  ctx.strokeStyle = '#d97b2f';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.7 + bob);
  ctx.lineTo(26, -h * 0.5 + bob);
  ctx.stroke();

  // Head with a moustache and a straw hat.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(4, -h * 0.86 + bob, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a3a1e';
  ctx.beginPath();
  ctx.ellipse(10, -h * 0.82 + bob, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c33d';
  ctx.beginPath();
  ctx.ellipse(4, -h * 0.97 + bob, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -h * 1.0 + bob, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b03a2e';
  ctx.fillRect(-8, -h * 0.99 + bob, 24, 4);

  // Angry eye.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(10, -h * 0.88 + bob, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Pitchfork, tines up.
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(26, -h * 0.5 + bob);
  ctx.lineTo(40, -h * 1.15 + bob);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(40, -h * 1.15 + bob);
  ctx.lineTo(34, -h * 1.3 + bob);
  ctx.moveTo(40, -h * 1.15 + bob);
  ctx.lineTo(40, -h * 1.32 + bob);
  ctx.moveTo(40, -h * 1.15 + bob);
  ctx.lineTo(46, -h * 1.3 + bob);
  ctx.stroke();

  ctx.restore();

  // Speech bubble: "!" when cornering, "?" while searching.
  if (pose.state === 'corner' || pose.state === 'search') {
    const mark = pose.state === 'corner' ? '!' : '?';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + w + 14, y - 6, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mark, x + w + 14, y - 5);
  }
}

export function drawOven(ctx, x, y, w, h, time) {
  const glow = 0.5 + Math.sin(time * 5) * 0.2;
  ctx.save();
  // Heat glow on the floor.
  ctx.fillStyle = `rgba(255, 120, 20, ${0.25 * glow})`;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h, w * 0.7, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#555555';
  ctx.fillRect(x, y, w, 10);
  // Door window with fire inside.
  ctx.fillStyle = '#ff7b1c';
  ctx.fillRect(x + 10, y + h * 0.3, w - 20, h * 0.45);
  ctx.fillStyle = `rgba(255, 220, 80, ${0.6 + glow * 0.3})`;
  ctx.beginPath();
  ctx.moveTo(x + 14, y + h * 0.72);
  ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.35, x + w * 0.45, y + h * 0.72);
  ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.4, x + w - 14, y + h * 0.72);
  ctx.closePath();
  ctx.fill();
  // Knobs and a "HOT!" sign.
  ctx.fillStyle = '#dddddd';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 16 + i * 16, y + 16, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT!', x + w / 2, y + h * 0.92);
  ctx.restore();
}

export function drawKnife(ctx, x, y, w, h, angle) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  // Blade.
  ctx.fillStyle = '#dfe6ea';
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h * 0.2);
  ctx.lineTo(w * 0.32, -h * 0.2);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w * 0.32, h * 0.2);
  ctx.lineTo(-w / 2, h * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-w * 0.1, -h * 0.14, w * 0.3, 2);
  // Handle.
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(-w / 2 - 14, -h * 0.16, 16, h * 0.32);
  ctx.restore();
}

export function drawCorn(ctx, x, y, size, time) {
  const bob = Math.sin(time * 4 + x) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#e8c33d';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.32, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c99a1e';
  for (let row = -1; row <= 1; row += 1) {
    for (let col = -1; col <= 1; col += 1) {
      ctx.beginPath();
      ctx.arc(col * 4, row * 6, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#7da23f';
  ctx.beginPath();
  ctx.ellipse(-size * 0.28, size * 0.2, size * 0.16, size * 0.4, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFeather(ctx, x, y, size, time) {
  const bob = Math.sin(time * 3 + x) * 4;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(Math.sin(time * 2) * 0.2);
  ctx.fillStyle = '#e8c33d';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.22, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.2, size * 0.14, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(0, size * 0.55);
  ctx.stroke();
  ctx.restore();
}
