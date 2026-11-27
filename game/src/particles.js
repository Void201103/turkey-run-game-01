// Lightweight particles: falling autumn leaves, dust puffs from running
// feet, feathers when the turkey is hit, and sparks over a hot oven.
// Everything is drawn from a small fixed pool, so the frame stays cheap.
export function createParticles(random) {
  const items = [];
  const leaves = [];
  for (let i = 0; i < 26; i += 1) {
    leaves.push({
      x: random.range(0, 960), y: random.range(-40, 540),
      size: random.range(5, 10), speed: random.range(18, 42),
      sway: random.range(0.6, 1.6), phase: random.range(0, Math.PI * 2),
      color: random.pick(['#d97b2f', '#c0392b', '#e8c33d', '#a8641e']),
    });
  }

  return {
    burst(x, y, kind, count) {
      for (let i = 0; i < count; i += 1) {
        items.push({
          x, y,
          vx: (random.next() - 0.5) * 260,
          vy: -random.next() * 220 - 40,
          life: random.range(0.4, 0.9), maxLife: 0.9,
          size: random.range(3, 8),
          color: kind === 'feather' ? '#ffffff' : kind === 'spark' ? '#ffb347' : '#d8cbb0',
          gravity: kind === 'feather' ? 60 : 500,
        });
      }
    },
    update(dt) {
      for (const leaf of leaves) {
        leaf.y += leaf.speed * dt;
        leaf.x += Math.sin(leaf.phase + leaf.y * 0.01) * leaf.sway;
        if (leaf.y > 560) {
          leaf.y = -20;
          leaf.x = random.range(0, 960);
        }
      }
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const p = items[i];
        p.life -= dt;
        if (p.life <= 0) {
          items.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    },
    drawLeaves(ctx) {
      for (const leaf of leaves) {
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(Math.sin(leaf.phase + leaf.y * 0.02) * 0.8);
        ctx.fillStyle = leaf.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size, leaf.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    drawBurst(ctx) {
      for (const p of items) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  };
}
