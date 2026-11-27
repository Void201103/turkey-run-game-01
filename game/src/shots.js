// The screenshot scenes behind ?shot=title|farm|kitchen|escaped. Each one
// plays the real rules forward from a fresh world for a fixed number of
// steps, steered by a simple autopilot (jump before an obstacle, hide in
// a haystack when the farmer closes in, dash when the way is clear), so
// the frame is what a short game really looks like and the same seed
// always gives the same frame.
import { FIELD, FARMER, STEP, TURKEY } from './config.js';
import { EVENT_OVER, EVENT_ESCAPED } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const TITLE_SECONDS = 4;
const FARM_SECONDS = 5;
const KITCHEN_SECONDS = 16;
const ESCAPE_LIMIT_SECONDS = 400;
const SAMPLE = 1 / 30;

/** The autopilot's move for this step: jump, hide, dash, or steer. */
function autopilot(state) {
  const input = { dir: 0, jump: false, hide: false, dash: false };
  const t = state.turkey;
  if (t.hidden) {
    input.hide = true;
    return input;
  }
  const ahead = state.distance + 170;
  let threat = null;
  for (const ob of state.level.obstacles) {
    if (ob.x + ob.w < state.distance || ob.x > ahead) continue;
    if (ob.kind === 'mud') continue;
    if (threat === null || ob.x < threat.x) threat = ob;
  }
  const gap = TURKEY.x - (state.farmer.x + 58);
  const nearHaystack = state.level.haystacks.find((h) => (
    h.x > state.distance - 20 && h.x < state.distance + 90
  ));
  if (nearHaystack && gap < 120) {
    input.hide = true;
    return input;
  }
  if (threat !== null) {
    const distTo = threat.x - state.distance;
    if (threat.kind === 'knifedrop') {
      // A falling knife is dodged by waiting for it to stick, then
      // jumping over it; rushing under it is how turkeys get carved.
      const falling = threat.armed && threat.timer <= 0 && threat.stuck <= 0;
      const stuck = threat.armed && threat.stuck > 0;
      if (stuck || (falling && (threat.knifeY ?? -90) > 150)) {
        if (distTo < 140 && t.onGround) {
          input.jump = true;
          input.dir = 1;
        }
        return input;
      }
      if (distTo < 260) {
        input.dir = -1;
        return input;
      }
      input.dir = 1;
      return input;
    }
    // Approach every jump at full speed: the leap has to carry the
    // whole obstacle, and it only does at top speed.
    input.dir = 1;
    if (distTo < 150 && t.onGround) input.jump = true;
    return input;
  }
  // Clear road: speed up, and dash when the farmer is breathing down.
  input.dir = 1;
  if (gap < 90 && t.dashCooldown <= 0) input.dash = true;
  return input;
}

/**
 * The autopilot's slow move: dawdle (dir -1) while still jumping the
 * obstacles and ducking into haystacks. The turkey slows to a crawl, so
 * the farmer — who only gains on a turkey slower than him — closes in
 * until he is right behind it. This is how the staged farm and kitchen
 * frames catch the chase on screen: a turkey that runs flat out leaves
 * the farmer far behind, and a frame of that shows no chase at all.
 * `allowHide` false means the turkey comes out of its haystack and
 * stays out, so the frame ends with both of them visible.
 */
function cautious(state, allowHide) {
  const input = { dir: -1, jump: false, hide: false, dash: false };
  const t = state.turkey;
  if (t.hidden) {
    input.hide = allowHide;
    return input;
  }
  const ahead = state.distance + 170;
  let threat = null;
  for (const ob of state.level.obstacles) {
    if (ob.x + ob.w < state.distance || ob.x > ahead) continue;
    if (ob.kind === 'mud') continue;
    if (threat === null || ob.x < threat.x) threat = ob;
  }
  const nearHaystack = state.level.haystacks.find((h) => (
    h.x > state.distance - 20 && h.x < state.distance + 90
  ));
  if (allowHide && nearHaystack) {
    input.hide = true;
    return input;
  }
  if (threat !== null) {
    const distTo = threat.x - state.distance;
    if (threat.kind === 'knifedrop') {
      const stuck = threat.armed && threat.stuck > 0;
      if (stuck) {
        if (distTo < 140 && t.onGround) input.jump = true;
        return input;
      }
      return input;
    }
    if (distTo < 150 && t.onGround) input.jump = true;
    return input;
  }
  return input;
}

/**
 * Set `world` to the named scene and return the screen to draw over it
 * and the best score to show. Any unknown name stages the title.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'farm' && name !== 'kitchen' && name !== 'escaped') {
    for (let index = 0; index < TITLE_SECONDS / STEP; index += 1) {
      world.step(STEP, { dir: 0, jump: false, hide: false, dash: false }, true);
    }
    return { screen: SCREEN_TITLE, best: 1240 };
  }
  const limit = name === 'farm' ? FARM_SECONDS : name === 'kitchen' ? KITCHEN_SECONDS : ESCAPE_LIMIT_SECONDS;
  for (let index = 0; index < limit / STEP; index += 1) {
    const events = world.step(STEP, autopilot(world.state), false);
    if (events & EVENT_OVER) break;
  }
  if (!world.state.over && (name === 'farm' || name === 'kitchen')) {
    // Let the farmer close in so the chase reads in the frame: dawdle
    // with the cautious autopilot until he is on screen (gap under 110
    // puts his sprite just inside the left edge), then bring the turkey
    // out of its haystack so the frame ends with both of them visible.
    // A flat-out run leaves him hundreds of metres behind, so without
    // this the gameplay frames show a danger meter and no farmer.
    const gap = () => TURKEY.x - (world.state.farmer.x + FARMER.width);
    for (let index = 0; index < 25 / STEP; index += 1) {
      if (gap() < 110 || world.state.over) break;
      world.step(STEP, cautious(world.state, true), false);
    }
    for (let index = 0; index < 3 / STEP; index += 1) {
      if (!world.state.turkey.hidden && gap() < 115) break;
      const events = world.step(STEP, cautious(world.state, false), false);
      if (events & EVENT_OVER) break;
    }
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: Math.floor(world.state.score) };
}

export { FIELD };
