// The renderer: one canvas, 960x540, painted every frame. It draws the
// scrolling farm (sky, parallax hills, ground), the obstacles, the turkey
// and the farmer from sprites.js, the HUD, and the title, pause and end
// screens. Nothing here loads a file: every pixel is drawn in code.
import { FIELD, TURKEY, FARMER, RUN_LENGTH, STAGES } from './config.js';
import { stageIndexAt, KIND_OVEN, KIND_KNIFE_DROP, KIND_HAYSTACK, KIND_GATE } from './level.js';
import { drawTurkey, drawFarmer, drawOven, drawKnife, drawCorn, drawFeather } from './sprites.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export const BUTTON_RUN = { x: 380, y: 398, w: 200, h: 56 };
export const BUTTON_AGAIN = { x: 380, y: 412, w: 200, h: 56 };

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  let lastStage = -1;
  let bannerText = '';
  let bannerUntil = -1;

  function screenX(state, trackX) {
    return TURKEY.x + (trackX - state.distance);
  }

  function drawBackground(state) {
    const stage = STAGES[state.stage];
    const grad = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    grad.addColorStop(0, stage.sky[0]);
    grad.addColorStop(1, stage.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);

    // Sun and drifting clouds.
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(820, 74, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 3; i += 1) {
      const cx = ((i * 340 + 120 - state.distance * 0.12) % 1100 + 1100) % 1100 - 80;
      ctx.beginPath();
      ctx.ellipse(cx, 70 + i * 36, 52, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Parallax hills, trees and fences.
    ctx.fillStyle = 'rgba(120, 90, 40, 0.35)';
    for (let i = 0; i < 5; i += 1) {
      const hx = ((i * 260 - state.distance * 0.25) % 1200 + 1200) % 1200 - 120;
      ctx.beginPath();
      ctx.ellipse(hx, FIELD.groundY, 190, 66, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5a7a2e';
    for (let i = 0; i < 8; i += 1) {
      const tx = ((i * 190 + 60 - state.distance * 0.5) % 1100 + 1100) % 1100 - 60;
      ctx.beginPath();
      ctx.arc(tx, FIELD.groundY - 34, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(tx - 4, FIELD.groundY - 34, 8, 34);
      ctx.fillStyle = '#5a7a2e';
    }

    // Stage dressing: the barn in stage 2, the kitchen wall in stage 3.
    if (state.stage === 1) {
      ctx.fillStyle = '#a83a2e';
      ctx.fillRect(640, 250, 220, 202);
      ctx.fillStyle = '#7a2a20';
      ctx.beginPath();
      ctx.moveTo(620, 252);
      ctx.lineTo(750, 180);
      ctx.lineTo(880, 252);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8e0c8';
      ctx.fillRect(720, 330, 60, 122);
      ctx.strokeStyle = '#e8e0c8';
      ctx.lineWidth = 4;
      ctx.strokeRect(720, 330, 60, 122);
    }
    if (state.stage === 2) {
      ctx.fillStyle = 'rgba(122, 74, 38, 0.55)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
      ctx.fillStyle = '#f7e8c8';
      ctx.fillRect(80, 90, 130, 110);
      ctx.fillStyle = '#7fb2d9';
      ctx.fillRect(92, 102, 106, 86);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(140, 102, 8, 86);
      ctx.fillRect(92, 140, 106, 8);
    }

    // Ground: dirt with a grass strip on top.
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = stage.grass;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 12);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let i = 0; i < 24; i += 1) {
      const gx = ((i * 97 - state.distance) % 1000 + 1000) % 1000 - 20;
      ctx.fillRect(gx, FIELD.groundY + 30 + (i % 3) * 18, 26, 4);
    }
  }

  function drawFence(x, y, w, h) {
    ctx.fillStyle = '#a8873f';
    ctx.fillRect(x, y + 8, 8, h - 8);
    ctx.fillRect(x + w - 8, y + 8, 8, h - 8);
    ctx.fillRect(x - 4, y + 12, w + 8, 7);
    ctx.fillRect(x - 4, y + 30, w + 8, 7);
  }

  function drawHaybale(x, y, w, h) {
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a8873f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 6, h / 2 - 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 8, y + h / 2);
    ctx.lineTo(x + w - 8, y + h / 2);
    ctx.stroke();
  }

  function drawHaystack(x, y, w, h) {
    ctx.fillStyle = '#e8b84b';
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.quadraticCurveTo(x + w / 2, y - 14, x + w, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b98a2e';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + i * 12, y + 12);
      ctx.lineTo(x + w / 2 + i * 14, y + h - 4);
      ctx.stroke();
    }
  }

  function drawMud(x, y, w) {
    ctx.fillStyle = '#5a3a1e';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, FIELD.groundY + 6, w / 2, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5230';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, FIELD.groundY + 5, w * 0.2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCrate(x, y, w, h) {
    ctx.fillStyle = '#b98a2e';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + w - 2, y + h - 2);
    ctx.moveTo(x + w - 2, y + 2);
    ctx.lineTo(x + 2, y + h - 2);
    ctx.stroke();
  }

  function drawGate(x, y, w, h) {
    ctx.fillStyle = '#5a7a2e';
    ctx.fillRect(x - 8, y, 12, h);
    ctx.fillRect(x + w - 4, y, 12, h);
    ctx.fillStyle = '#7da23f';
    ctx.fillRect(x - 14, y - 8, w + 28, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOREST →', x + w / 2, y - 16);
    ctx.fillStyle = '#2e5a1e';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h + 10, 60, Math.PI, 0);
    ctx.fill();
  }

  function drawObstacles(state) {
    for (const ob of state.level.obstacles) {
      const sx = screenX(state, ob.x);
      if (sx > FIELD.width + 80 || sx + ob.w < -80) continue;
      const oy = FIELD.groundY - ob.h;
      if (ob.kind === 'fence') drawFence(sx, oy, ob.w, ob.h);
      else if (ob.kind === 'haybale') drawHaybale(sx, oy, ob.w, ob.h);
      else if (ob.kind === 'mud') drawMud(sx, oy, ob.w);
      else if (ob.kind === 'crate') drawCrate(sx, oy, ob.w, ob.h);
      else if (ob.kind === KIND_OVEN) drawOven(ctx, sx, oy, ob.w, ob.h, state.time);
      else if (ob.kind === KIND_KNIFE_DROP) {
        // Telegraph: a red shadow where the knife will land.
        if (ob.armed && ob.stuck <= 0 && ob.timer > 0) {
          ctx.fillStyle = 'rgba(192, 57, 43, 0.5)';
          ctx.beginPath();
          ctx.ellipse(sx + 15, FIELD.groundY + 4, 22, 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        if (ob.armed && ob.stuck <= 0 && ob.timer <= 0) {
          drawKnife(ctx, sx, ob.knifeY ?? -90, 30, 64, Math.PI / 2);
        } else if (ob.armed && ob.stuck > 0) {
          // Stuck in the ground, leaning — the handle shows above the dirt.
          drawKnife(ctx, sx, FIELD.groundY - 64, 30, 64, Math.PI / 2 + 0.22);
        }
      } else if (ob.kind === KIND_GATE) drawGate(sx, oy, ob.w, ob.h);
    }
    for (const h of state.level.haystacks) {
      const sx = screenX(state, h.x);
      if (sx > FIELD.width + 80 || sx + h.w < -80) continue;
      drawHaystack(sx, FIELD.groundY - h.h, h.w, h.h);
      // Name the hiding spot only while the turkey is close enough to
      // use it; a label over every haystack on screen is noise.
      if (Math.abs(h.x - state.distance) > 260) continue;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDE ↓', sx + h.w / 2, FIELD.groundY - h.h - 10);
    }
  }

  function drawPickups(state) {
    for (const p of state.level.pickups) {
      if (p.taken) continue;
      const sx = screenX(state, p.x);
      if (sx > FIELD.width + 40 || sx < -40) continue;
      if (p.kind === 'corn') drawCorn(ctx, sx, p.y, 26, state.time);
      else drawFeather(ctx, sx, p.y, 26, state.time);
    }
  }

  function drawHearts(x, y, lives) {
    for (let i = 0; i < 3; i += 1) {
      const hx = x + i * 30;
      ctx.fillStyle = i < lives ? '#e74c3c' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx + 8, y + 6);
      ctx.bezierCurveTo(hx, y - 4, hx - 8, y + 4, hx + 8, y + 16);
      ctx.bezierCurveTo(hx + 24, y + 4, hx + 16, y - 4, hx + 8, y + 6);
      ctx.fill();
    }
  }

  function drawHud(state, best) {
    // Top bar: score and distance on the left, lives and corn on the right.
    ctx.fillStyle = 'rgba(42, 26, 14, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, 46);
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 14, 31);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(`${Math.floor(state.distance)} m  ·  ${STAGES[state.stage].name}`, 190, 30);
    ctx.fillText(`BEST ${best}`, 560, 30);
    drawHearts(700, 12, state.lives);
    drawCorn(ctx, 812, 22, 18, state.time);
    ctx.fillStyle = '#e8c33d';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.corn}`, 826, 30);

    // Danger meter: how close the farmer is, bottom centre.
    const gap = TURKEY.x - (state.farmer.x + FARMER.width);
    const danger = Math.max(0, Math.min(1, 1 - gap / 340));
    ctx.fillStyle = 'rgba(42, 26, 14, 0.72)';
    ctx.fillRect(330, 500, 300, 26);
    ctx.fillStyle = danger > 0.66 ? '#e74c3c' : danger > 0.33 ? '#e8a33d' : '#7da23f';
    ctx.fillRect(336, 505, 288 * danger, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(danger > 0.66 ? 'FARMER RIGHT BEHIND YOU!' : 'FARMER', 480, 517);
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = 'rgba(42, 26, 14, 0.88)';
    ctx.strokeStyle = '#e8a33d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();
  }

  function button(rect, label) {
    ctx.fillStyle = '#e8a33d';
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a1a0e';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }

  function drawTitle(state, best) {
    panel(180, 60, 600, 400);
    ctx.fillStyle = '#e8a33d';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOBBLE DASH', 480, 140);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText("Turkey's Great Escape", 480, 178);
    ctx.fillStyle = '#ffd98a';
    ctx.font = '17px sans-serif';
    ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', 480, 214);
    ctx.fillText('Run 6000 m through farmyard, barn and kitchen —', 480, 240);
    ctx.fillText('dodge the oven and the carving knives, and reach the forest!', 480, 264);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('← → speed up / slow down    SPACE jump    ↓ hide in haystacks', 480, 306);
    ctx.fillText('SHIFT dash    P pause    M mute    Click or ENTER to run', 480, 330);
    if (best > 0) {
      ctx.fillStyle = '#e8c33d';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`BEST SCORE ${best}`, 480, 362);
    }
    button(BUTTON_RUN, '▶  RUN!');
    // A turkey posing on the title, mid-gobble.
    drawTurkey(ctx, 120, 330, 90, 104, { time: state.time, running: false, sliding: false, scared: false });
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(330, 200, 300, 130);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 480, 252);
    ctx.font = '17px sans-serif';
    ctx.fillText('P or ESC to keep running', 480, 292);
  }

  function drawOver(state, best) {
    const escaped = state.escaped;
    panel(230, 90, 500, 380);
    ctx.textAlign = 'center';
    if (escaped) {
      ctx.fillStyle = '#7da23f';
      ctx.font = 'bold 58px sans-serif';
      ctx.fillText('ESCAPED!', 480, 168);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px sans-serif';
      ctx.fillText('You made it to the forest. No dinner today!', 480, 208);
    } else {
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 58px sans-serif';
      ctx.fillText('CAUGHT!', 480, 168);
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px sans-serif';
      ctx.fillText('The farmer got you… dinner is served. Ugh.', 480, 208);
    }
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 480, 262);
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Distance ${Math.floor(state.distance)} m  ·  Corn ${state.corn}  ·  Best ${Math.max(best, Math.floor(state.score))}`, 480, 296);
    ctx.fillText(escaped ? 'The forest cheers. Gobble gobble!' : 'Tip: hide in haystacks, dash past the oven.', 480, 340);
    button(BUTTON_AGAIN, '↻  RUN AGAIN');
  }

  function drawBanner(state, screen) {
    if (screen !== SCREEN_PLAY || bannerUntil < 0 || state.time >= bannerUntil) return;
    const remain = bannerUntil - state.time;
    ctx.globalAlpha = Math.min(1, remain);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(42,26,14,0.8)';
    ctx.lineWidth = 6;
    ctx.strokeText(bannerText, 480, 150);
    ctx.fillText(bannerText, 480, 150);
    ctx.globalAlpha = 1;
  }

  return {
    draw(state, screen, best) {
      if (state.stage !== lastStage) {
        lastStage = state.stage;
        bannerText = state.stage === 0 ? '' : STAGES[state.stage].name;
        // World time, not draw calls: in shot mode the scene is painted
        // only twice, long after the stage changed, so a frame-counted
        // banner would still be showing.
        bannerUntil = state.stage === 0 ? -1 : state.time + 2;
      }

      ctx.save();
      if (state.shake > 0) {
        const mag = state.shake * 7;
        ctx.translate(Math.sin(state.time * 47) * mag, Math.cos(state.time * 39) * mag);
      }
      drawBackground(state);
      state.particles.drawLeaves(ctx);
      drawObstacles(state);
      drawPickups(state);

      // The turkey: hidden means tucked inside the haystack, so it is
      // drawn under the haystacks — here, simply not drawn at all.
      const t = state.turkey;
      const gap = TURKEY.x - (state.farmer.x + FARMER.width);
      if (!t.hidden) {
        const blink = t.invulnerableTimer > 0 && Math.floor(state.time * 12) % 2 === 0;
        if (!blink) {
          drawTurkey(ctx, TURKEY.x, t.y, TURKEY.width, TURKEY.height, {
            time: state.time, running: screen === SCREEN_PLAY, sliding: t.sliding, scared: gap < 150,
          });
        }
      }
      state.particles.drawBurst(ctx);

      // The farmer, chasing from the left.
      drawFarmer(ctx, state.farmer.x, FIELD.groundY - FARMER.height, FARMER.width, FARMER.height, {
        time: state.time, state: state.farmer.state,
      });

      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state, best);
      drawBanner(state, screen);
      if (screen === SCREEN_TITLE) drawTitle(state, best);
      else if (screen === SCREEN_PAUSED) drawPaused();
      else if (screen === SCREEN_OVER) drawOver(state, best);
      ctx.restore();
    },
  };
}
