// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens:
// title, play, paused and game over.
//
// ?seed=N fixes the farm's layout. ?shot=title|farm|kitchen|escaped (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ALARM, EVENT_CORN, EVENT_ESCAPED, EVENT_FEATHER, EVENT_HIDE, EVENT_HIT, EVENT_OVER, EVENT_STAGE } from './world.js';
import { ACTION_CONFIRM, ACTION_DASH, ACTION_HIDE, ACTION_JUMP, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { BUTTON_AGAIN, BUTTON_RUN, createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function inButton(at, rect) {
  if (at === null) return false;
  const scaleX = canvas.width / canvas.getBoundingClientRect().width;
  const scaleY = canvas.height / canvas.getBoundingClientRect().height;
  const x = at.x * scaleX;
  const y = at.y * scaleY;
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.gobble();
    announce(`Playing. ${LIVES} lives. Run for the forest!`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    const score = Math.floor(world.state.score);
    if (score > best) {
      best = score;
      saveBest(best);
    }
    if (world.state.escaped) audio.win();
    else audio.lose();
    announce(world.state.escaped
      ? `Escaped! Score ${score}. Best ${best}.`
      : `Caught. Score ${score}. Best ${best}.`);
  }

  function playEvents(events) {
    if (events & EVENT_HIT) {
      audio.hit();
      announce(world.state.lives === 1 ? 'Hit. 1 life left.' : `Hit. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_CORN) audio.corn();
    if (events & EVENT_FEATHER) audio.feather();
    if (events & EVENT_STAGE) {
      audio.stageClear();
      announce(`Stage ${world.state.stage + 1}.`);
    }
    if (events & EVENT_ALARM) audio.alarm();
    if (events & EVENT_HIDE) announce('Hidden in the haystack. Stay quiet…');
    if (events & EVENT_ESCAPED) announce('Escaped to the forest!');
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    // Dash and jump are edge-triggered: read them once per frame, before
    // the fixed steps consume them.
    const actions = input.takeActions();
    let jumpPressed = Boolean(actions & ACTION_JUMP);
    let dashPressed = Boolean(actions & ACTION_DASH);
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      const click = input.takeClick();
      if ((actions & ACTION_CONFIRM)
        || (screen === SCREEN_TITLE && inButton(click, BUTTON_RUN))
        || (screen === SCREEN_OVER && inButton(click, BUTTON_AGAIN))) {
        startGame();
      }
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (screen === SCREEN_TITLE) {
      while (accumulator >= STEP) {
        world.step(STEP, { dir: 0, jump: false, hide: false, dash: false }, true);
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        const events = world.step(STEP, {
          dir: input.direction(),
          jump: jumpPressed,
          hide: input.hiding(),
          dash: dashPressed,
        }, false);
        playEvents(events);
        if (events & EVENT_OVER) {
          endGame();
          accumulator = 0;
          break;
        }
        accumulator -= STEP;
      }
      // Edge-triggered presses are spent after one step, not every step.
      jumpPressed = false;
      dashPressed = false;
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the farmer catch the turkey unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gobble Dash. Press Enter or click Run to escape the farmer.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
