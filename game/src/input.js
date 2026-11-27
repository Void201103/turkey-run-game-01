// Keyboard and mouse input. The game reads a snapshot each frame: which
// movement keys are held, and which actions were pressed since the last
// frame (confirm, jump, hide, dash, pause, mute). Clicks land on the
// canvas and are reported with their position, so the title and end
// screens can offer real buttons.
export const ACTION_CONFIRM = 1;
export const ACTION_JUMP = 2;
export const ACTION_HIDE = 4;
export const ACTION_DASH = 8;
export const ACTION_PAUSE = 16;
export const ACTION_MUTE = 32;

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  Space: ACTION_JUMP,
  ArrowUp: ACTION_JUMP,
  KeyW: ACTION_JUMP,
  ArrowDown: ACTION_HIDE,
  KeyS: ACTION_HIDE,
  KeyH: ACTION_HIDE,
  ShiftLeft: ACTION_DASH,
  ShiftRight: ACTION_DASH,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
  KeyR: ACTION_CONFIRM,
};

export function createInput(canvas) {
  const held = new Set();
  let pressed = 0;
  let click = null;

  function onKeyDown(event) {
    if (event.repeat) return;
    held.add(event.code);
    const action = KEY_ACTIONS[event.code];
    if (action !== undefined) {
      pressed |= action;
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    click = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // -1 (slow down) / 0 / +1 (speed up) from the held movement keys.
    direction() {
      const left = held.has('ArrowLeft') || held.has('KeyA');
      const right = held.has('ArrowRight') || held.has('KeyD');
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    hiding() {
      return held.has('ArrowDown') || held.has('KeyS') || held.has('KeyH');
    },
    takeActions() {
      const actions = pressed;
      pressed = 0;
      return actions;
    },
    takeClick() {
      const at = click;
      click = null;
      return at;
    },
  };
}
