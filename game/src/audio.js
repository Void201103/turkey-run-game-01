// All sound is synthesised with WebAudio: no audio files, no network.
// Short blips and slides for jumps, coins, hits and alarms, a gobble made
// of three fast pitch drops, and a quiet banjo-ish pluck loop for music.
// Nothing here runs until the player first presses a key or clicks.
export function createAudio() {
  let context = null;
  let muted = false;
  let musicTimer = null;
  let musicStep = 0;

  function ensure() {
    if (context === null) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + dur);
    amp.gain.setValueAtTime(gain, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  // The pluck loop: a cheerful I–V–vi–IV walk, one note per beat.
  const MELODY = [392, 494, 587, 494, 440, 494, 587, 659, 587, 494, 440, 392, 330, 392, 440, 494];
  function startMusic() {
    if (musicTimer !== null) return;
    musicTimer = window.setInterval(() => {
      if (muted) return;
      const note = MELODY[musicStep % MELODY.length];
      musicStep += 1;
      tone(note, 0.22, 'triangle', 0.05);
      tone(note / 2, 0.22, 'sine', 0.03);
    }, 240);
  }

  return {
    unlock() {
      ensure();
      startMusic();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    jump() {
      tone(280, 0.16, 'sine', 0.12, 620);
    },
    dash() {
      tone(900, 0.12, 'sawtooth', 0.05, 300);
    },
    corn() {
      tone(880, 0.09, 'square', 0.06);
      window.setTimeout(() => tone(1320, 0.12, 'square', 0.06), 70);
    },
    feather() {
      tone(660, 0.1, 'triangle', 0.08, 990);
      window.setTimeout(() => tone(990, 0.14, 'triangle', 0.08, 1320), 90);
    },
    hit() {
      tone(160, 0.25, 'sawtooth', 0.14, 60);
    },
    gobble() {
      // Three fast gobbles: a pitch drop each, like a real turkey.
      [0, 110, 220].forEach((delay) => {
        window.setTimeout(() => tone(420, 0.09, 'square', 0.07, 180), delay);
      });
    },
    alarm() {
      tone(520, 0.14, 'square', 0.07, 780);
      window.setTimeout(() => tone(520, 0.14, 'square', 0.07, 780), 160);
    },
    sizzle() {
      tone(2400, 0.3, 'sawtooth', 0.015, 1800);
    },
    stageClear() {
      [523, 659, 784].forEach((freq, index) => {
        window.setTimeout(() => tone(freq, 0.18, 'triangle', 0.09), index * 110);
      });
    },
    win() {
      [523, 659, 784, 1047, 784, 1047].forEach((freq, index) => {
        window.setTimeout(() => tone(freq, 0.22, 'triangle', 0.1), index * 130);
      });
    },
    lose() {
      [392, 370, 349, 311].forEach((freq, index) => {
        window.setTimeout(() => tone(freq, 0.3, 'triangle', 0.09), index * 170);
      });
    },
  };
}
