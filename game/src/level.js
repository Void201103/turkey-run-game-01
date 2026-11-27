// Level generation: the run is a flat 1800-metre track, seeded, with
// obstacles, pickups and haystacks placed by stage. Each stage has its
// own danger set, and the gaps shrink as the turkey runs further, so the
// farmyard teaches jumping, the barn adds ducking, and the kitchen
// throws ovens and falling knives at a turkey that is nearly home.
import { FIELD, RUN_LENGTH, STAGES } from './config.js';

export const KIND_FENCE = 'fence';
export const KIND_HAYBALE = 'haybale';
export const KIND_MUD = 'mud';
export const KIND_CRATE = 'crate';
export const KIND_OVEN = 'oven';
export const KIND_KNIFE_DROP = 'knifedrop';
export const KIND_HAYSTACK = 'haystack';
export const KIND_CORN = 'corn';
export const KIND_FEATHER = 'feather';
export const KIND_GATE = 'gate';

// Metres are world units: 1 metre = 1 world unit on the track.
function stageAt(distance) {
  for (const stage of STAGES) {
    if (distance < stage.to) return stage;
  }
  return STAGES[STAGES.length - 1];
}

export function stageIndexAt(distance) {
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance < STAGES[i].to) return i;
  }
  return STAGES.length - 1;
}

export function buildLevel(random) {
  const obstacles = [];
  const pickups = [];
  const haystacks = [];
  let x = 260;
  let sinceHaystack = 0;

  while (x < RUN_LENGTH - 120) {
    const stage = stageIndexAt(x);
    // Gaps shrink with distance: 150–260 early, 110–190 late.
    const progress = x / RUN_LENGTH;
    // Gaps stay wider than a full-speed jump carries (about 285 units),
    // so the turkey always lands with room to spot and jump the next one.
    const gap = random.range(320, 470) - progress * 30;
    x += gap;
    sinceHaystack += gap;

    const roll = random.next();
    if (stage === 0) {
      if (roll < 0.4) obstacles.push({ kind: KIND_FENCE, x, w: 26, h: 52 });
      else if (roll < 0.7) obstacles.push({ kind: KIND_HAYBALE, x, w: 40, h: 44 });
      else obstacles.push({ kind: KIND_MUD, x, w: 90, h: 10 });
    } else if (stage === 1) {
      if (roll < 0.3) obstacles.push({ kind: KIND_FENCE, x, w: 26, h: 52 });
      else if (roll < 0.55) obstacles.push({ kind: KIND_CRATE, x, w: 48, h: 52 });
      else if (roll < 0.8) obstacles.push({ kind: KIND_HAYBALE, x, w: 40, h: 44 });
      else obstacles.push({ kind: KIND_MUD, x, w: 90, h: 10 });
    } else {
      if (roll < 0.35) obstacles.push({ kind: KIND_OVEN, x, w: 74, h: 92 });
      else if (roll < 0.65) obstacles.push({ kind: KIND_KNIFE_DROP, x, w: 30, h: 0, armed: false, timer: 0 });
      else if (roll < 0.85) obstacles.push({ kind: KIND_CRATE, x, w: 48, h: 52 });
      else obstacles.push({ kind: KIND_FENCE, x, w: 26, h: 52 });
    }

    // Corn trails: a small arc over low obstacles, a line on flat ground.
    const last = obstacles[obstacles.length - 1];
    if (last.kind === KIND_FENCE || last.kind === KIND_HAYBALE || last.kind === KIND_CRATE) {
      pickups.push({ kind: KIND_CORN, x: last.x - 34, y: FIELD.groundY - 130 });
      pickups.push({ kind: KIND_CORN, x: last.x + last.w / 2, y: FIELD.groundY - 160 });
      pickups.push({ kind: KIND_CORN, x: last.x + last.w + 30, y: FIELD.groundY - 130 });
    } else {
      pickups.push({ kind: KIND_CORN, x: x + 40, y: FIELD.groundY - 90 });
      pickups.push({ kind: KIND_CORN, x: x + 76, y: FIELD.groundY - 90 });
    }
    if (random.next() < 0.12) {
      pickups.push({ kind: KIND_FEATHER, x: x + random.range(0, 120), y: FIELD.groundY - 170 });
    }

    // A haystack to hide in every 350–500 metres, never inside a stage's
    // first 80 metres, so the player learns to spot them.
    if (sinceHaystack > 380 && x > 120) {
      haystacks.push({ kind: KIND_HAYSTACK, x: x + 130, w: 70, h: 64 });
      sinceHaystack = 0;
    }
  }

  // The forest gate: the finish line the turkey is running for.
  obstacles.push({ kind: KIND_GATE, x: RUN_LENGTH, w: 40, h: 150 });
  return { obstacles, pickups, haystacks, stageAt };
}

export function groundAt() {
  return FIELD.groundY;
}
