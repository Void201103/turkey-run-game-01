// The farmer's brain: three states, one goal — dinner.
//
// CHASE: runs after the turkey at chase speed, gaining when the turkey
// stumbles and losing ground when it dashes or grabs corn.
// SEARCH: the turkey is hidden in a haystack. The farmer stops at the
// haystack, looks around ("?") for a couple of seconds, then gives up and
// jogs on — but the turkey slips further ahead while he looks.
// CORNER: the turkey is close to the screen's right edge (or the farmer
// is very close), so the farmer sprints. A narrow escape is fair: the
// sprint only lasts while the turkey is cornered, and a jump or dash
// breaks it.
import { FARMER, TURKEY } from './config.js';

export function createFarmer() {
  return {
    x: TURKEY.x - FARMER.startGap - FARMER.width,
    state: 'chase',
    searchTimer: 0,
    cornerTimer: 0,
    alarmed: false,
  };
}

// The farmer moves in screen space, so his speed is relative to the
// turkey's: he closes in only when the turkey is slower than him
// (stumbled, in mud, dawdling) and falls behind when it dashes or runs
// flat out. `gap` is the distance between farmer and turkey.
// Returns 'alarm' when the farmer starts cornering, else null.
export function updateFarmer(farmer, dt, gap, turkeyHidden, turkeyCornered, turkeySpeed) {
  let event = null;
  if (turkeyHidden && farmer.state !== 'search') {
    farmer.state = 'search';
    farmer.searchTimer = 2.2;
  }

  if (farmer.state === 'search') {
    farmer.searchTimer -= dt;
    // The turkey is frozen in its haystack, so the farmer advances at
    // his own speed toward it — then gives up and falls behind.
    farmer.x += FARMER.searchSpeed * dt;
    if (farmer.searchTimer <= 0) {
      farmer.state = 'chase';
      farmer.x -= 60;
    }
    return event;
  }

  if (turkeyCornered && farmer.state !== 'corner') {
    farmer.state = 'corner';
    farmer.cornerTimer = 1.4;
    event = 'alarm';
  }
  if (farmer.state === 'corner') {
    farmer.cornerTimer -= dt;
    farmer.x += (FARMER.cornerSpeed - turkeySpeed) * dt;
    if (farmer.cornerTimer <= 0 || gap > 320) farmer.state = 'chase';
    return event;
  }

  farmer.x += (FARMER.chaseSpeed - turkeySpeed) * dt;
  return event;
}
