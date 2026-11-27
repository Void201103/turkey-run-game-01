// The world: one run of Gobble Dash, stepped in fixed 1/60 s slices.
// The turkey runs right at a speed the player steers; the world scrolls
// past it. Obstacles, pickups and haystacks live in track coordinates
// (metres from the start); the screen shows them at
// TURKEY.x + (trackX - distance). The farmer chases in screen space:
// his x grows toward the turkey's, and he catches it when the gap closes.
import {
  FIELD, TURKEY, FARMER, LIVES, RUN_LENGTH, SCORE_CORN, SCORE_FEATHER,
  SCORE_STAGE, SCORE_ESCAPE, STEP,
} from './config.js';
import { buildLevel, stageIndexAt, KIND_OVEN, KIND_KNIFE_DROP, KIND_HAYSTACK, KIND_MUD } from './level.js';
import { createFarmer, updateFarmer } from './farmer.js';
import { createParticles } from './particles.js';

export const EVENT_HIT = 1;
export const EVENT_CORN = 2;
export const EVENT_FEATHER = 4;
export const EVENT_STAGE = 8;
export const EVENT_OVER = 16;
export const EVENT_ESCAPED = 32;
export const EVENT_ALARM = 64;
export const EVENT_HIDE = 128;

export function createWorld(random) {
  const level = buildLevel(random);
  const particles = createParticles(random);
  const state = freshState(level, particles);
  return {
    state,
    reset() {
      const next = freshState(level, particles);
      Object.keys(state).forEach((key) => delete state[key]);
      Object.assign(state, next);
    },
    // Advance one fixed step. `input` is { dir, jump, hide, dash }.
    // Returns an event bitmask for sounds and announcements.
    step(dt, input, attract) {
      return stepWorld(state, level, particles, dt, input, attract);
    },
  };
}

function freshState(level, particles) {
  return {
    level,
    time: 0,
    distance: 0,
    score: 0,
    corn: 0,
    lives: LIVES,
    stage: 0,
    over: false,
    escaped: false,
    turkey: {
      y: FIELD.groundY - TURKEY.height, vy: 0, onGround: true,
      speed: TURKEY.baseSpeed, sliding: false, slideTimer: 0,
      dashTimer: 0, dashCooldown: 0, stumbleTimer: 0,
      invulnerableTimer: 0, hidden: false, hideTimer: 0,
    },
    farmer: createFarmer(),
    knives: [],
    shake: 0,
    particles,
    attract: false,
  };
}

function turkeyRect(state) {
  const t = state.turkey;
  const h = t.sliding ? TURKEY.height * 0.55 : TURKEY.height;
  return {
    x: TURKEY.x + 6, y: t.y + (TURKEY.height - h), w: TURKEY.width - 12, h,
  };
}

function screenX(state, trackX) {
  return TURKEY.x + (trackX - state.distance);
}

function stepWorld(state, level, particles, dt, input, attract) {
  let events = 0;
  const t = state.turkey;
  state.time += dt;
  particles.update(dt);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 3);

  // --- Turkey speed: steered, dashed, stumbled, slowed by mud. ---
  if (t.stumbleTimer > 0) t.stumbleTimer -= dt;
  if (t.dashCooldown > 0) t.dashCooldown -= dt;
  if (t.invulnerableTimer > 0) t.invulnerableTimer -= dt;
  if (t.slideTimer > 0) {
    t.slideTimer -= dt;
    if (t.slideTimer <= 0) t.sliding = false;
  }

  const onMud = !attract && t.onGround && level.obstacles.some((o) => (
    o.kind === KIND_MUD && screenX(state, o.x) < TURKEY.x + TURKEY.width && screenX(state, o.x + o.w) > TURKEY.x
  ));

  let targetSpeed = TURKEY.baseSpeed + input.dir * 95;
  if (t.stumbleTimer > 0) targetSpeed = 120;
  if (onMud) targetSpeed *= 0.55;
  if (t.dashTimer > 0) {
    t.dashTimer -= dt;
    targetSpeed = TURKEY.dashSpeed;
  }
  if (input.dash && t.dashCooldown <= 0 && t.dashTimer <= 0 && !t.hidden) {
    t.dashTimer = TURKEY.dashTime;
    t.dashCooldown = TURKEY.dashCooldown;
    state.farmer.x -= 26;
  }
  const accel = t.speed < targetSpeed ? TURKEY.accel : TURKEY.accel * 1.6;
  t.speed += Math.max(-accel * dt, Math.min(accel * dt, targetSpeed - t.speed));
  t.speed = Math.max(90, Math.min(TURKEY.maxSpeed + 220, t.speed));

  // --- Hiding: only inside a haystack, only while the key is held. ---
  const nearHaystack = level.haystacks.find((h) => (
    screenX(state, h.x) < TURKEY.x + TURKEY.width && screenX(state, h.x + h.w) > TURKEY.x
  ));
  if (!attract && input.hide && nearHaystack && t.onGround && !t.hidden) {
    t.hidden = true;
    t.hideTimer = 0;
    events |= EVENT_HIDE;
  }
  if (t.hidden) {
    t.hideTimer += dt;
    if (!input.hide || !nearHaystack || t.hideTimer > 4) t.hidden = false;
  }
  if (input.hide && t.onGround && !t.hidden && t.slideTimer <= 0) {
    t.sliding = true;
    t.slideTimer = TURKEY.slideTime;
  }

  // --- Jump physics. ---
  if (input.jump && t.onGround && !t.hidden) {
    t.vy = -TURKEY.jumpSpeed;
    t.onGround = false;
  }
  if (!t.onGround) {
    t.vy += FIELD.gravity * dt;
    t.y += t.vy * dt;
    if (t.y >= FIELD.groundY - TURKEY.height) {
      t.y = FIELD.groundY - TURKEY.height;
      t.vy = 0;
      t.onGround = true;
    }
  }

  // --- Advance the run, unless hidden or in attract mode. ---
  if (!attract && !t.hidden) {
    state.distance += t.speed * dt;
    state.score += t.speed * dt * 0.1;
  }
  if (attract) state.distance += 60 * dt;

  // --- Stage crossings: bonus points and a banner. ---
  const stage = stageIndexAt(state.distance);
  if (stage !== state.stage) {
    state.stage = stage;
    state.score += SCORE_STAGE;
    events |= EVENT_STAGE;
  }

  // --- The farmer: chase, search, corner. ---
  const gap = TURKEY.x - (state.farmer.x + FARMER.width);
  const cornered = gap < 70;
  const farmerEvent = updateFarmer(state.farmer, dt, gap, t.hidden, cornered && !attract, t.hidden ? 0 : t.speed);
  if (farmerEvent === 'alarm') events |= EVENT_ALARM;

  // --- Falling knives: arm as the turkey nears, then drop. ---
  for (const ob of level.obstacles) {
    if (ob.kind !== KIND_KNIFE_DROP) continue;
    const sx = screenX(state, ob.x);
    if (!ob.armed && sx < FIELD.width + 40 && sx > TURKEY.x - 200) {
      ob.armed = true;
      ob.timer = 0.7;
      ob.knifeY = -90;
      ob.stuck = 0;
    }
    if (ob.armed && ob.stuck <= 0) {
      ob.timer -= dt;
      if (ob.timer <= 0) {
        ob.knifeY += 950 * dt;
        if (ob.knifeY >= FIELD.groundY - 64) {
          ob.knifeY = FIELD.groundY - 64;
          ob.stuck = 0.7;
        }
      }
    } else if (ob.armed && ob.stuck > 0) {
      ob.stuck -= dt;
    }
  }

  // --- Collisions (skipped while invulnerable or hidden). ---
  if (!attract && t.invulnerableTimer <= 0 && !t.hidden) {
    const rect = turkeyRect(state);
    for (const ob of level.obstacles) {
      const sx = screenX(state, ob.x);
      if (sx > FIELD.width + 60 || sx + ob.w < -60) continue;
      if (ob.kind === KIND_KNIFE_DROP) {
        if (ob.armed && ob.stuck <= 0 && ob.timer <= 0) {
          const kx = sx + 2;
          const ky = ob.knifeY ?? -90;
          if (rect.x < kx + 26 && rect.x + rect.w > kx && rect.y < ky + 64 && rect.y + rect.h > ky) {
            events |= hitTurkey(state);
            break;
          }
        }
        continue;
      }
      if (ob.kind === KIND_MUD || ob.kind === 'gate') continue;
      const oy = ob.kind === KIND_OVEN ? FIELD.groundY - ob.h : FIELD.groundY - ob.h;
      if (rect.x < sx + ob.w - 6 && rect.x + rect.w > sx + 6 && rect.y < oy + ob.h && rect.y + rect.h > oy + 8) {
        events |= hitTurkey(state);
        break;
      }
    }
  }

  // --- Pickups. ---
  if (!attract && !t.hidden) {
    const rect = turkeyRect(state);
    for (const p of level.pickups) {
      if (p.taken) continue;
      const sx = screenX(state, p.x);
      if (sx > FIELD.width + 40 || sx < -40) continue;
      const py = p.y;
      if (rect.x < sx + 22 && rect.x + rect.w > sx - 22 && rect.y < py + 22 && rect.y + rect.h > py - 22) {
        p.taken = true;
        if (p.kind === 'corn') {
          state.corn += 1;
          state.score += SCORE_CORN;
          state.farmer.x -= 8;
          events |= EVENT_CORN;
        } else {
          state.score += SCORE_FEATHER;
          state.lives = Math.min(LIVES, state.lives + 1);
          events |= EVENT_FEATHER;
        }
      }
    }
  }

  // --- Caught? The farmer touches the turkey, or no lives are left. ---
  if (!attract && !state.over) {
    const caught = (state.farmer.x + FARMER.width >= TURKEY.x + 4) || state.lives <= 0;
    if (caught) {
      state.over = true;
      state.escaped = false;
      events |= EVENT_OVER;
    }
    if (state.distance >= RUN_LENGTH) {
      state.over = true;
      state.escaped = true;
      state.score += SCORE_ESCAPE;
      events |= EVENT_ESCAPED | EVENT_OVER;
    }
  }

  return events;
}

function hitTurkey(state) {
  const t = state.turkey;
  state.lives -= 1;
  t.invulnerableTimer = 1.5;
  t.stumbleTimer = 0.5;
  t.speed = 120;
  state.farmer.x += 25;
  state.shake = 1;
  state.particles.burst(TURKEY.x + 27, t.y + 20, 'feather', 14);
  return EVENT_HIT;
}

export { STEP };
