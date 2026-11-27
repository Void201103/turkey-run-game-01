// Tunables for Gobble Dash: one place for every number the world, the
// farmer and the renderer agree on, so tuning stays a one-line change.
export const STEP = 1 / 60;
export const BEST_KEY = 'gobble-dash-best';

// The run is 6000 metres long, split into three stages with their own
// look and dangers. The turkey escapes through the forest gate at the end.
export const RUN_LENGTH = 6000;
export const STAGES = [
  { name: 'FARMYARD', from: 0, to: 2000, sky: ['#ffd9a0', '#ff9e57'], ground: '#8a5a2b', grass: '#7da23f' },
  { name: 'BARN', from: 2000, to: 4000, sky: ['#e8b06a', '#b06a3a'], ground: '#6b4423', grass: '#a8873f' },
  { name: 'KITCHEN', from: 4000, to: 6000, sky: ['#f7c873', '#d97b2f'], ground: '#7a4a26', grass: '#c98f3d' },
];

// The playfield, in world units. The camera follows the turkey; the
// farmer chases from the left edge of the screen.
export const FIELD = { width: 960, height: 540, groundY: 452, gravity: 2200 };

export const TURKEY = {
  width: 54, height: 62, x: 170,
  baseSpeed: 235, maxSpeed: 430, accel: 900,
  jumpSpeed: 950, dashSpeed: 640, dashTime: 0.22, dashCooldown: 1.1,
  slideTime: 0.55,
};

export const FARMER = {
  width: 58, height: 96,
  chaseSpeed: 225, searchSpeed: 120, cornerSpeed: 340,
  catchDistance: 46, startGap: 260,
};

export const LIVES = 3;
export const SCORE_CORN = 50;
export const SCORE_FEATHER = 200;
export const SCORE_STAGE = 500;
export const SCORE_ESCAPE = 1000;

// How far ahead of the turkey obstacles and pickups are generated, and
// how far behind they are forgotten.
export const SPAWN_AHEAD = 1150;
export const DESPAWN_BEHIND = 320;
