'use strict';
/* =====================================================================
   AIRPLANE'S LAND
   A gentle, no-lose exploring game for Michael (age 4½).
   Controls: the ARROW KEYS to walk, the SPACE BAR to pick an activity
   and to pat dragons and dinos.
   Grown-ups: M = sound on/off, B = background music on/off, Esc = back to the menu.

   HOW THIS FILE IS ORGANISED (search for the section numbers):
     1. CONFIG .............. colors, sizes, speeds, how many things
     2. Helpers ............. small math + drawing helpers
     3. Sound ............... every sound, made with the Web Audio API
     4. Michael's picture ... loads assets/michael.png, removes the white background
     5. Screen & keys ....... canvas scaling and arrow-key input
     6. Building the world .. where everything is placed
     7. Particles ........... sparkles, hearts, confetti, smoke
     8. Activities .......... menu, sky hunt, hide & seek, feeding, grumpy dragon,
                              airplane ride, house + TV, patting creatures
     9. Updating ............ everything that moves each frame
    10. Drawing ............. how everything looks
    11. Main loop
   ===================================================================== */


/* =====================================================================
   1. CONFIG — change these numbers and colors to tweak the game
   ===================================================================== */
const CONFIG = {
  // ----- Michael -----
  CHARACTER_HEIGHT: 140,       // Michael's height in px (world is 1440 x 810, scaled to fit the window)
  HOUSE_CHARACTER_SCALE: 1.6,  // Michael looks this much bigger inside the house
  MOVE_SPEED: 280,             // top walking speed, px per second
  MOVE_SMOOTHNESS: 9,          // higher = snappier start/stop, lower = more glide

  // ----- How many things -----
  NUMBER_OF_FOOD_ITEMS: 6,      // food lying around the world at once
  MAX_FOOD_CARRIED: 4,          // how many foods Michael can stack on his head
  NUMBER_OF_FRIENDLY_DRAGONS: 4,
  NUMBER_OF_FRIENDLY_DINOS: 4,
  NUMBER_OF_HIDING_DINOS: 4,    // hide & seek (at most 6, one per tree)
  NUMBER_OF_TOWNSPEOPLE: 5,
  NUMBER_OF_SNOWFLAKES: 150,
  NUMBER_OF_CLOUDS: 6,

  // ----- Time of day (sets the dragons' menu) -----
  // 'cycle'  = morning -> noon -> night, round and round (so he sees every food)
  // 'clock'  = follow the real clock (before 11 morning, 11-16 noon, after that night)
  // 'morning' / 'noon' / 'night' = stay at that time
  TIME_OF_DAY: 'cycle',
  SECONDS_PER_TIME_OF_DAY: 90,

  // ----- Activities -----
  GRUMPY_GETS_GRUMPY_AGAIN_AFTER: 120, // seconds of happiness before he needs cheering up again (0 = stays happy)
  FLIGHT_SECONDS: 18,                  // airplane ride length
  PARADE_SECONDS: 16,                  // dragon parade length
  FEEDS_TO_FINISH: 3,                  // "Feed the Dragons" is done after this many happy meals

  // ----- Sound & feel -----
  SOUND_VOLUME: 0.6,   // 0 = silent, 1 = loud
  MUSIC_VOLUME: 0.5,   // soft background music (0 = no music)
  SCREEN_SHAKE: true,  // the grumpy dragon's stomp gives a tiny wobble

  // ----- World colors -----
  COLORS: {
    sky: '#ff9a3c',               // default orange sky
    grassTop: '#5d93f2',          // the grass is always blue
    grassBottom: '#2b5bc4',
    grassTuftDark: '#2a52b0',
    grassTuftLight: '#8db6ff',
    snow: '#ffffff',
    snowShadow: '#c4d8ff',
    mountains: '#e6d8ff',
    clouds: '#ffb0d4',            // pink clouds
    cloudHighlight: '#ffd9ea',
    treeTrunk: '#d7263d',         // red trunks
    treeLeaves: '#ff8a1f',        // orange leaves
    treeLeavesLight: '#ffb54d',
    buildings: ['#ff4f9a', '#2ec4b6', '#ffd23f', '#9b5de5', '#7ae582', '#ff6b35', '#3aa0ff', '#f15bb5', '#00d1a0'],
    rockets: [
      { body: '#ff4d6d', nose: '#ffd23f', fin: '#3a86ff' },
      { body: '#7ae582', nose: '#ff5d8f', fin: '#9b5de5' },
      { body: '#3aa0ff', nose: '#ff9f1c', fin: '#ff4d6d' },
      { body: '#c77dff', nose: '#2ec4b6', fin: '#ffd23f' },
      { body: '#ffd23f', nose: '#ff4d6d', fin: '#2ec4b6' },
    ],
    dragons: [ // body, belly, spikes/wings
      ['#5fd38d', '#fff3b0', '#ff7eb6'],
      ['#ff8fcf', '#fff0f7', '#a66cff'],
      ['#6ec6ff', '#e9fbff', '#ffd23f'],
      ['#b28dff', '#f3ebff', '#7ae582'],
      ['#ffb347', '#fff4dc', '#ff5d5d'],
      ['#ff6b6b', '#ffe9e0', '#ffd23f'],
      ['#2ec4b6', '#e0fff9', '#ff8fcf'],
    ],
    dinos: [
      ['#9be564', '#f4ffd9', '#ffb347'],
      ['#ffd23f', '#fffbe0', '#ff6b6b'],
      ['#7fdbff', '#eefcff', '#b28dff'],
      ['#ff9ecb', '#fff0f7', '#5fd38d'],
      ['#c3a6ff', '#f6f0ff', '#ffd23f'],
      ['#ffa07a', '#fff1ea', '#3aa0ff'],
    ],
    grumpyDragon: ['#8a7f99', '#b9b0c4', '#5c5070'],
    happyDragon: ['#ff7ec4', '#ffe3f2', '#ffd23f'],
    coats: ['#ff4d6d', '#3a86ff', '#ffd23f', '#7ae582', '#c77dff', '#ff9f1c', '#2ec4b6'],
    hats: ['#ffffff', '#ff5d8f', '#3a86ff', '#ffd23f', '#7ae582', '#9b5de5'],
    skins: ['#ffd7b5', '#f1c27d', '#c68642', '#8d5524', '#ffe0c7'],
  },

  // ----- Sky Color Hunt buttons (in the order they show at the top) -----
  SKY_BUTTONS: ['#8b5a2b' /* brown */, '#4fb3ff' /* blue */, '#ffe347' /* yellow */,
                '#6fdc5a' /* green */, '#ff9a3c' /* orange (back to normal) */],

  // ----- Advanced: white background removal for Michael's picture -----
  BG_WHITE_MIN: 240,   // a pixel counts as "background white" if r, g and b are all at least this
  BG_MAX_TINT: 24,     // ...and its colors differ by no more than this (so it's grey/white, not cream skin)
};

// The world is always 1440 x 810 and gets scaled to fit the window.
const WORLD_W = 1440;
const WORLD_H = 810;
const HORIZON_Y = 300;     // where the sky ends and the blue grass starts
const GROUND_TOP = 345;    // Michael's feet can't go higher than this
const C = CONFIG.COLORS;


/* =====================================================================
   2. HELPERS
   ===================================================================== */
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t); // ease in-out for 0..1
const TAU = Math.PI * 2;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// A random number generator that gives the same numbers every time,
// so the town (buildings, grass, snow patches) looks the same each visit.
function seededRandom(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Colors
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(rgb) {
  return '#' + rgb.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
function mixColor(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)]);
}
const shadeCache = {};
// shade('#ff0000', -0.3) = 30% darker, shade(c, 0.3) = 30% lighter
function shade(hex, amt) {
  const key = hex + amt;
  if (!shadeCache[key]) shadeCache[key] = mixColor(hex, amt < 0 ? '#000000' : '#ffffff', Math.abs(amt));
  return shadeCache[key];
}

// Shapes
function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}
function circle(ctx, x, y, r, fill) { ellipse(ctx, x, y, r, r, fill); }
function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function roundRect(ctx, x, y, w, h, r, fill, stroke, lineWidth) {
  roundRectPath(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth || 2; ctx.stroke(); }
}
function starPath(ctx, x, y, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}
function heartPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s * 0.1, s * 0.2, -s * 0.6, s * 0.05, -s * 0.5, -s * 0.3);
  ctx.bezierCurveTo(-s * 0.4, -s * 0.65, -s * 0.05, -s * 0.55, 0, -s * 0.25);
  ctx.bezierCurveTo(s * 0.05, -s * 0.55, s * 0.4, -s * 0.65, s * 0.5, -s * 0.3);
  ctx.bezierCurveTo(s * 0.6, s * 0.05, s * 0.1, s * 0.2, 0, s * 0.35);
  ctx.closePath();
}
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// Is Michael's feet inside the oval around (x, y)?
function touching(x, y, rx, ry) {
  const dx = (michael.x - x) / rx, dy = (michael.y - y) / ry;
  return dx * dx + dy * dy < 1;
}
// True only at the moment Michael ARRIVES at something (not every frame while he stands there).
function arrived(obj, isTouching) {
  if (!isTouching) { obj.armed = true; return false; }
  if (obj.armed === false) return false;
  obj.armed = false;
  return true;
}


/* =====================================================================
   3. SOUND — everything is synthesized, no audio files
   ===================================================================== */
const Sound = {
  ctx: null,
  master: null,
  muted: false,
  noiseBuffer: null,
  engine: null,

  // Browsers only allow sound after a key press or click, so we call this then.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = CONFIG.SOUND_VOLUME;
      this.master.connect(this.ctx.destination);
      this.tuneBus = this.ctx.createGain(); // little songs go here so they can be stopped
      this.tuneBus.connect(this.master);
      // one second of white noise, reused for puffs, chomps, whooshes
      const len = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  ready() { return this.ctx && this.ctx.state === 'running'; },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : CONFIG.SOUND_VOLUME;
  },

  // One note. The pitch can slide from f1 to f2.
  tone(f1, f2, dur, type = 'sine', vol = 0.3, delay = 0, dest = null) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(t); o.stop(t + dur + 0.05);
  },
  // A burst of filtered noise (whoosh, puff, crunch). Filter frequency can slide.
  noise(dur, vol, filterType, freq, delay = 0, freqEnd) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer; src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = filterType; f.frequency.setValueAtTime(freq, t); f.Q.value = 1.2;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur + 0.05);
  },
  // Plays a little song. notes = [[midiNote or 0 for a rest, beats], ...]
  playTune(notes, bpm, type = 'triangle', vol = 0.18, repeat = 1, delay = 0) {
    const beat = 60 / bpm;
    let t = delay;
    for (let r = 0; r < repeat; r++) {
      for (const [m, b] of notes) {
        if (m) { const f = 440 * Math.pow(2, (m - 69) / 12); this.tone(f, f, b * beat * 0.9, type, vol, t, this.tuneBus); }
        t += b * beat;
      }
    }
    return t;
  },
  // Silences any song that is still playing (e.g. when going back to the menu)
  stopTunes() {
    if (!this.ctx) return;
    this.tuneBus.disconnect();
    this.tuneBus = this.ctx.createGain();
    this.tuneBus.connect(this.master);
  },

  // ---- The game's sounds ----
  pop()     { this.tone(300, 900, 0.09, 'sine', 0.35); },
  sparkle() { [1320, 1660, 1980, 2640].forEach((f, i) => this.tone(f, f, 0.2, 'triangle', 0.1, 0.05 + i * 0.06)); },
  click()   { this.tone(1100, 700, 0.06, 'square', 0.07); },
  magic()   { for (let i = 0; i < 8; i++) this.tone(500 + i * 140, 520 + i * 160, 0.16, 'triangle', 0.09, i * 0.045); },
  chirp(p = 1) { this.tone(700 * p, 1300 * p, 0.08, 'sine', 0.25); this.tone(900 * p, 1600 * p, 0.1, 'sine', 0.22, 0.1); },
  hello(p = 1) { this.tone(440 * p, 540 * p, 0.16, 'triangle', 0.28); this.tone(640 * p, 560 * p, 0.24, 'triangle', 0.28, 0.18); },
  hmm()     { this.tone(392, 392, 0.14, 'triangle', 0.22); this.tone(330, 349, 0.22, 'triangle', 0.22, 0.17); },
  grumble() { this.tone(170, 120, 0.25, 'triangle', 0.32); this.tone(140, 95, 0.35, 'triangle', 0.32, 0.22); },
  stomp()   { this.tone(110, 45, 0.22, 'sine', 0.3); this.noise(0.12, 0.06, 'lowpass', 400); },
  puff()    { this.noise(0.3, 0.04, 'bandpass', 900, 0, 400); },
  whoosh()  { this.noise(0.6, 0.12, 'bandpass', 300, 0, 2400); },
  chomp()   { for (let i = 0; i < 3; i++) { this.noise(0.06, 0.2, 'bandpass', 1300, i * 0.17); this.tone(240, 150, 0.07, 'square', 0.05, i * 0.17); } },
  boing(p = 1) {
    if (!this.ready()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    const lfo = this.ctx.createOscillator(), lfoGain = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110 * p, t);
    o.frequency.linearRampToValueAtTime(380 * p, t + 0.08);
    o.frequency.linearRampToValueAtTime(220 * p, t + 0.6);
    lfo.frequency.value = 16; lfoGain.gain.value = 45 * p;   // the wobbly "oing-oing-oing"
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    o.connect(g); g.connect(this.master);
    o.start(t); lfo.start(t); o.stop(t + 0.7); lfo.stop(t + 0.7);
  },
  cheer() {
    this.noise(0.7, 0.07, 'bandpass', 1500, 0, 2600); // "yaaay" crowd hiss
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.22, 'triangle', 0.2, i * 0.09));
    this.tone(1047, 1319, 0.35, 'sine', 0.15, 0.36);
  },
  fanfare() { this.playTune([[72, 0.5], [76, 0.5], [79, 0.5], [84, 1.5], [79, 0.5], [84, 2]], 220, 'square', 0.07); },
  chime()   { this.tone(1568, 1568, 0.5, 'sine', 0.15); this.tone(2093, 2093, 0.6, 'sine', 0.12, 0.15); },
  tick()    { this.tone(900, 1100, 0.05, 'triangle', 0.15); },
  purr()    { for (let i = 0; i < 5; i++) this.tone(180 + (i % 2) * 30, 200 + (i % 2) * 30, 0.12, 'triangle', 0.16, i * 0.11); this.tone(880, 1180, 0.15, 'sine', 0.1, 0.55); },
  rawr(p = 1) { this.tone(420 * p, 260 * p, 0.28, 'sawtooth', 0.05); this.tone(640 * p, 380 * p, 0.28, 'triangle', 0.18); },
  sparkleBreath() { this.noise(0.8, 0.05, 'bandpass', 2000, 0, 5000); for (let i = 0; i < 6; i++) this.tone(1400 + i * 220, 1500 + i * 220, 0.15, 'triangle', 0.07, 0.1 + i * 0.1); },

  // Airplane engine hum (starts and stops)
  startEngine() {
    if (!this.ready() || this.engine) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(60, t); o.frequency.linearRampToValueAtTime(95, t + 2);
    f.type = 'lowpass'; f.frequency.value = 420;
    lfo.frequency.value = 9; lg.gain.value = 5; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 1);
    o.connect(f); f.connect(g); g.connect(this.master);
    o.start(t); lfo.start(t);
    this.engine = { o, lfo, g };
  },
  stopEngine() {
    if (!this.engine) return;
    const t = this.ctx.currentTime, e = this.engine;
    e.g.gain.cancelScheduledValues(t);
    e.g.gain.setValueAtTime(e.g.gain.value, t);
    e.g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    e.o.stop(t + 1.1); e.lfo.stop(t + 1.1);
    this.engine = null;
  },
};

// Songs (MIDI note numbers: 60 = middle C)
const TUNES = {
  parade: [[67, 0.5], [72, 0.5], [72, 0.5], [74, 0.5], [76, 1], [72, 1], [74, 0.5], [76, 0.5], [77, 0.5], [76, 0.5], [74, 1], [67, 1],
           [69, 0.5], [71, 0.5], [72, 0.5], [74, 0.5], [76, 0.5], [77, 0.5], [79, 1], [76, 0.5], [74, 0.5], [72, 3]],
  paradeBass: [[48, 1], [55, 1], [48, 1], [55, 1], [50, 1], [55, 1], [43, 1], [55, 1], [45, 1], [52, 1], [43, 1], [50, 1], [48, 2], [55, 1], [48, 1]],
  landing: [[72, 0.5], [79, 0.5], [76, 0.5], [84, 1.5]],
  tv: [[76, 0.5], [79, 0.5], [84, 0.5], [79, 0.5], [81, 1]],
  happyDragon: [[72, 0.5], [74, 0.5], [76, 0.5], [79, 0.5], [84, 0.5], [79, 0.5], [84, 1.5]],
  dance: [[72, 0.5], [76, 0.5], [79, 0.5], [76, 0.5], [81, 0.5], [79, 0.5], [84, 1]],
};

// ---------- Background music ----------
// A gentle music-box tune over soft chords (C - Am - F - G), looping forever.
// Notes are scheduled a little ahead of time so it never stutters.
const MUSIC_STEP = 0.32; // seconds per eighth note
const MUSIC_CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
const MUSIC_BASS = [48, 45, 41, 43];
const MUSIC_MELODY = [ // 8 bars of 8 eighth notes (0 = rest)
  [76, 0, 79, 0, 84, 0, 79, 0], [76, 0, 72, 0, 69, 0, 72, 0], [77, 0, 81, 0, 84, 0, 81, 0], [79, 0, 74, 0, 71, 0, 74, 0],
  [72, 0, 76, 0, 79, 0, 0, 0], [81, 0, 79, 0, 76, 0, 0, 0], [77, 0, 76, 0, 72, 0, 69, 0], [71, 0, 74, 0, 79, 0, 0, 0],
];
const Music = {
  bus: null, playing: false, enabled: true, level: 1, nextTime: 0, step: 0,
  start() {
    if (this.playing || !Sound.ready() || !CONFIG.MUSIC_VOLUME) return;
    this.bus = Sound.ctx.createGain();
    this.bus.gain.value = 0;
    this.bus.gain.setTargetAtTime(CONFIG.MUSIC_VOLUME, Sound.ctx.currentTime, 1.5); // fade in
    this.bus.connect(Sound.master);
    this.nextTime = Sound.ctx.currentTime + 0.2;
    this.playing = true;
    setInterval(() => this.schedule(), 120);
  },
  // Turn the music down (e.g. during the parade song) or back up. level 0..1
  setLevel(level) {
    const target = this.enabled ? level : 0;
    if (!this.bus || this.level === target) return;
    this.level = target;
    this.bus.gain.setTargetAtTime(CONFIG.MUSIC_VOLUME * target, Sound.ctx.currentTime, 0.4);
  },
  toggle() { this.enabled = !this.enabled; this.level = -1; },
  schedule() {
    const now = Sound.ctx.currentTime;
    if (this.nextTime < now) this.nextTime = now + 0.05; // after the tab was asleep
    while (this.nextTime < now + 0.4) { this.playStep(this.step, this.nextTime); this.nextTime += MUSIC_STEP; this.step++; }
  },
  note(midi, t, dur, type, vol, attack) {
    const ctx = Sound.ctx, f = 440 * Math.pow(2, (midi - 69) / 12);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t + dur + 0.05);
  },
  playStep(s, t) {
    const bar = Math.floor(s / 8) % MUSIC_MELODY.length, i = s % 8, chord = bar % 4;
    if (i === 0) {
      for (const m of MUSIC_CHORDS[chord]) this.note(m, t, MUSIC_STEP * 8, 'sine', 0.035, 0.5);   // soft pad
      this.note(MUSIC_BASS[chord], t, MUSIC_STEP * 6, 'triangle', 0.07, 0.05);                     // bass
    }
    if (i === 4) this.note(MUSIC_BASS[chord] + 7, t, MUSIC_STEP * 3, 'triangle', 0.045, 0.05);
    const m = MUSIC_MELODY[bar][i];
    if (m) { // music box: a bell-like note plus a quiet octave
      this.note(m, t, 1.1, 'sine', 0.06, 0.01);
      this.note(m + 12, t, 0.5, 'sine', 0.015, 0.01);
    }
  },
};


/* =====================================================================
   4. MICHAEL'S PICTURE
   Loads assets/michael.png and removes the white background by
   FLOOD-FILLING from the edges of the picture (so his white shoes,
   which are inside his outline, stay white). If there is no picture,
   a simple drawn boy is used instead.
   ===================================================================== */
let michaelSprite = null; // { aspect, anchorX, small, large }

function cutOutBackground(img) {
  const W = img.naturalWidth, H = img.naturalHeight, N = W * H;
  const cv = makeCanvas(W, H);
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.drawImage(img, 0, 0);
  const imageData = c.getImageData(0, 0, W, H); // browsers may refuse this on file:// (we handle that)
  const d = imageData.data;
  const MIN = CONFIG.BG_WHITE_MIN, TINT = CONFIG.BG_MAX_TINT;

  const isBackgroundWhite = (i) => {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    const lo = Math.min(r, g, b), hi = Math.max(r, g, b);
    return lo >= MIN && hi - lo <= TINT;
  };
  const isPureWhite = (i) => {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    const lo = Math.min(r, g, b), hi = Math.max(r, g, b);
    return lo >= 248 && hi - lo <= 10;
  };

  // --- Step 1: flood fill from every edge pixel ---
  const removed = new Uint8Array(N);
  const queue = new Int32Array(N);
  let head = 0, tail = 0;
  const seed = (i) => { if (!removed[i] && isBackgroundWhite(i)) { removed[i] = 1; queue[tail++] = i; } };
  const flood = () => {
    while (head < tail) {
      const i = queue[head++], x = i % W;
      if (x > 0) seed(i - 1);
      if (x < W - 1) seed(i + 1);
      if (i >= W) seed(i - W);
      if (i < N - W) seed(i + W);
    }
  };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  flood();

  // --- Step 2: big pockets of pure white that the fill couldn't reach
  // (like the gap between his legs or between arm and body). Shoes only have
  // tiny white highlights, far below this size, so they are left alone.
  const seen = new Uint8Array(N);
  const pocket = new Int32Array(N);
  const minPocket = Math.max(60, N * 0.00015);
  for (let s = 0; s < N; s++) {
    if (removed[s] || seen[s] || !isPureWhite(s)) continue;
    let ph = 0, pt = 0;
    pocket[pt++] = s; seen[s] = 1;
    while (ph < pt) {
      const i = pocket[ph++], x = i % W;
      const near = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W];
      for (const j of near) {
        if (j >= 0 && j < N && !seen[j] && !removed[j] && isPureWhite(j)) { seen[j] = 1; pocket[pt++] = j; }
      }
    }
    if (pt >= minPocket) { for (let k = 0; k < pt; k++) seed(pocket[k]); flood(); }
  }

  // --- Step 3: trim faint floor shadow that sticks out sideways at his feet ---
  const colCount = new Int32Array(W);
  for (let i = 0; i < N; i++) if (!removed[i]) colCount[i % W]++;
  const minCol = H * 0.03;
  for (let x = 0; x < W && colCount[x] < minCol; x++) for (let y = 0; y < H; y++) removed[y * W + x] = 1;
  for (let x = W - 1; x >= 0 && colCount[x] < minCol; x--) for (let y = 0; y < H; y++) removed[y * W + x] = 1;

  // --- Step 4: make removed pixels see-through; soften the outline a little ---
  for (let i = 0; i < N; i++) {
    if (removed[i]) { d[i * 4 + 3] = 0; continue; }
    const x = i % W;
    const edge = (x > 0 && removed[i - 1]) || (x < W - 1 && removed[i + 1]) ||
                 (i >= W && removed[i - W]) || (i < N - W && removed[i + W]);
    if (edge) {
      const lo = Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      const whiteness = clamp((lo - 190) / 65, 0, 1);
      d[i * 4 + 3] = Math.round(255 * (1 - 0.85 * whiteness));
    }
  }

  // --- Step 5: find the box around Michael, and his middle (for flipping) ---
  let x0 = W, y0 = H, x1 = -1, y1 = -1, sumX = 0, count = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] > 0) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
        sumX += x; count++;
      }
    }
  }
  if (count < 100) throw new Error('Nothing left after removing background');
  c.putImageData(imageData, 0, 0);
  return { canvas: cv, sx: x0, sy: y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1, anchorX: (sumX / count - x0) / (x1 - x0 + 1) };
}

// Shrinks a picture in halves (looks much smoother than one big jump).
function downscale(src, tw, th) {
  let cur = makeCanvas(src.sw, src.sh);
  cur.getContext('2d').drawImage(src.canvas, src.sx, src.sy, src.sw, src.sh, 0, 0, src.sw, src.sh);
  while (cur.width / 2 > tw) {
    const next = makeCanvas(cur.width / 2, cur.height / 2);
    const nc = next.getContext('2d');
    nc.imageSmoothingQuality = 'high';
    nc.drawImage(cur, 0, 0, next.width, next.height);
    cur = next;
  }
  const out = makeCanvas(tw, th);
  const oc = out.getContext('2d');
  oc.imageSmoothingQuality = 'high';
  oc.drawImage(cur, 0, 0, tw, th);
  return out;
}

function buildSprite(src) {
  const aspect = src.sw / src.sh;
  const smallH = CONFIG.CHARACTER_HEIGHT * 2.5;   // extra pixels so he stays sharp on big screens
  const largeH = CONFIG.CHARACTER_HEIGHT * CONFIG.HOUSE_CHARACTER_SCALE * 2.5;
  return {
    aspect,
    anchorX: src.anchorX,
    small: downscale(src, smallH * aspect, smallH),
    large: downscale(src, largeH * aspect, largeH),
  };
}

// A simple drawn boy (black t-shirt, mint shorts, white shoes) used if the picture is missing.
function makePlaceholderMichael() {
  const cv = makeCanvas(200, 440), c = cv.getContext('2d');
  // legs
  roundRect(c, 70, 300, 24, 100, 10, '#f2b48c'); roundRect(c, 106, 300, 24, 100, 10, '#f2b48c');
  // shoes
  roundRect(c, 56, 392, 44, 30, 14, '#ffffff', '#b7c2d6', 3); roundRect(c, 100, 392, 44, 30, 14, '#ffffff', '#b7c2d6', 3);
  // shorts
  roundRect(c, 62, 250, 76, 70, 12, '#a8e6cf', '#6fbf9f', 3);
  // arms
  roundRect(c, 36, 160, 22, 110, 10, '#f2b48c'); roundRect(c, 142, 160, 22, 110, 10, '#f2b48c');
  // t-shirt
  roundRect(c, 50, 150, 100, 115, 20, '#1d1d1f');
  roundRect(c, 32, 150, 40, 45, 14, '#1d1d1f'); roundRect(c, 128, 150, 40, 45, 14, '#1d1d1f');
  // head
  circle(c, 100, 92, 58, '#f6c3a0');
  circle(c, 44, 96, 12, '#f2b48c'); circle(c, 156, 96, 12, '#f2b48c');
  // hair
  c.fillStyle = '#8a5a2b';
  c.beginPath(); c.ellipse(100, 58, 62, 36, 0, Math.PI, TAU); c.fill();
  c.beginPath(); c.moveTo(42, 62); c.quadraticCurveTo(80, 82, 120, 52); c.quadraticCurveTo(140, 70, 160, 62); c.lineTo(158, 45); c.lineTo(44, 45); c.fill();
  // face
  circle(c, 80, 96, 8, '#3a2214'); circle(c, 120, 96, 8, '#3a2214');
  circle(c, 82, 93, 3, '#fff'); circle(c, 122, 93, 3, '#fff');
  ellipse(c, 68, 116, 9, 6, 'rgba(255,120,120,0.35)'); ellipse(c, 132, 116, 9, 6, 'rgba(255,120,120,0.35)');
  c.fillStyle = '#9b2c2c';
  c.beginPath(); c.arc(100, 118, 18, 0.1 * Math.PI, 0.9 * Math.PI); c.closePath(); c.fill();
  return { canvas: cv, sx: 0, sy: 0, sw: 200, sh: 440, anchorX: 0.5 };
}

function loadMichael() {
  michaelSprite = buildSprite(makePlaceholderMichael()); // shows right away, replaced when the photo is ready
  const fromDisk = location.protocol === 'file:';
  const embedded = window.MICHAEL_IMAGE_DATA; // from assets/michael-data.js (works when opened from disk)
  // On file:// the browser won't let us read photo pixels, so use the embedded copy first.
  const sources = fromDisk ? [embedded, 'assets/michael.png'] : ['assets/michael.png', embedded];
  tryNextSource(sources.filter(Boolean), 0);
}
function tryNextSource(sources, index) {
  if (index >= sources.length) { console.info('Michael picture not found - using the drawn placeholder.'); return; }
  const img = new Image();
  img.onload = () => {
    try { michaelSprite = buildSprite(cutOutBackground(img)); }
    catch (err) { console.warn('Could not use this Michael picture:', err.message); tryNextSource(sources, index + 1); }
  };
  img.onerror = () => tryNextSource(sources, index + 1);
  img.src = sources[index];
}


/* =====================================================================
   5. SCREEN & KEYS
   ===================================================================== */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const view = { scale: 1, offX: 0, offY: 0, dpr: 1 };

function resize() {
  view.dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * view.dpr);
  canvas.height = Math.round(window.innerHeight * view.dpr);
  view.scale = Math.min(window.innerWidth / WORLD_W, window.innerHeight / WORLD_H);
  view.offX = (window.innerWidth - WORLD_W * view.scale) / 2;
  view.offY = (window.innerHeight - WORLD_H * view.scale) / 2;
}
window.addEventListener('resize', resize);
resize();

const keys = { left: false, right: false, up: false, down: false };
const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
window.addEventListener('keydown', (e) => {
  Sound.unlock();
  const k = KEYMAP[e.key];
  if (k) {
    keys[k] = true; e.preventDefault();
    if (game.mode === 'menu') { if (!e.repeat) moveMenuSelection(k); }
    else game.started = true;
  }
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) pressAction(); }
  if (e.key === 'Escape') goMenu();
  if (e.key === 'm' || e.key === 'M') Sound.toggleMute();
  if (e.key === 'b' || e.key === 'B') Music.toggle();
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.key];
  if (k) { keys[k] = false; e.preventDefault(); }
});
window.addEventListener('blur', () => { keys.left = keys.right = keys.up = keys.down = false; });
window.addEventListener('pointerdown', (e) => { Sound.unlock(); handlePointer(e); });


/* =====================================================================
   6. BUILDING THE WORLD
   ===================================================================== */
const game = {
  time: 0,
  mode: 'menu',          // 'menu', 'sky', 'seek', 'feed', 'grumpy', 'plane' or 'free'
  menuIndex: 0,          // which picture card is picked on the menu
  complete: null,        // set while the "you did it!" celebration shows
  finishIn: 0,           // countdown to that celebration
  fedCount: 0,           // happy meals so far in "Feed the Dragons"
  petTarget: null,       // the creature Michael is next to (shows the pat bubble)
  patAnim: null,         // the patting hand animation
  scene: 'world',        // 'world' or 'house'
  started: false,        // has Michael pressed an arrow yet? (hides the arrow-key hint)
  skyRGB: hexToRgb(C.sky),
  skyTarget: C.sky,
  rainbow: 0,            // 0..1, rainbow sky during the parade
  timeOfDay: 'morning',
  night: 0,              // 0..1 how dark it is
  sunX: 250, sunY: 120,
  shake: 0,
  fade: null,            // screen fade when going in/out of the house
  parade: null,
  paradeDelay: 0,
  flight: null,
  camera: { x: WORLD_W / 2, y: WORLD_H / 2, zoom: 1 },
  hud: { skyPop: 0, starPop: 0, timePop: 0 },
};

const michael = {
  x: 720, y: 600, vx: 0, vy: 0,
  facing: 1, flipX: 1, walkPhase: 0, moveAmt: 0,
  carry: [],             // foods stacked on his head
  hidden: true,          // true on the menu and while he's in the airplane
};

// Fixed places for the big things
const house = { x: 175, y: 505 };
const plane = { homeX: 1290, homeY: 412, x: 1290, y: 412, alt: 0, facing: -1, tilt: 0, prop: 0 };
const picnic = { x: 705, y: 452 };
const TREE_SPOTS = [[420, 430], [285, 720], [585, 665], [905, 495], [880, 790], [1390, 800]];
const ROCKET_SPOTS = [[535, 525, 150], [440, 805, 165], [1205, 520, 140], [70, 775, 160], [1010, 580, 125]]; // x, y, height
const GRUMPY_AREA = { x1: 1070, x2: 1290, y1: 640, y2: 770 }; // the grumpy dragon's corner
const WANDER_AREA = { x1: 60, x2: 1380, y1: 360, y2: 795 };

const trees = TREE_SPOTS.map(([x, y], i) => ({ x, y, seed: i * 1.7, shake: 0 }));
const rockets = ROCKET_SPOTS.map(([x, y, h], i) => ({ x, y, h, colors: C.rockets[i % C.rockets.length], wobT: 99, armed: true }));

// Big things that food and buttons shouldn't land on
const obstacles = [
  { x: house.x, y: house.y - 60, r: 160 },
  { x: plane.homeX, y: plane.homeY, r: 150 }, { x: 1080, y: 412, r: 90 },
  { x: picnic.x, y: picnic.y - 10, r: 150 },
  ...trees.map((t) => ({ x: t.x, y: t.y, r: 80 })),
  ...rockets.map((r) => ({ x: r.x, y: r.y, r: 65 })),
  { x: 1180, y: 705, r: 110 }, // the grumpy dragon's corner
];
function findFreeSpot(minGap, extra = []) {
  for (let tries = 0; tries < 200; tries++) {
    const x = rand(70, WORLD_W - 70), y = rand(375, WORLD_H - 25);
    const all = obstacles.concat(extra);
    if (all.every((o) => Math.hypot(o.x - x, o.y - y) > o.r + minGap) &&
        Math.hypot(michael.x - x, michael.y - y) > 110) return { x, y };
  }
  return { x: rand(70, WORLD_W - 70), y: rand(375, WORLD_H - 25) };
}

// ---- Creatures (dragons & dinosaurs) ----
function makeCreature(kind, colors, x, y, size) {
  return {
    kind, x, y, size,
    color: colors[0], belly: colors[1], spikes: colors[2],
    facing: Math.random() < 0.5 ? -1 : 1,
    speed: rand(35, 60), tx: x, ty: y, idle: rand(0, 2),
    walkPhase: rand(0, 6), moving: false,
    jump: 0, happyT: 0, mouthOpen: 0, lookUp: 0,
    mood: 'happy', seed: rand(0, 100), pitch: rand(0.85, 1.35),
  };
}
const creatures = [];
for (let i = 0; i < CONFIG.NUMBER_OF_FRIENDLY_DRAGONS; i++) {
  const p = findFreeSpot(10);
  creatures.push(makeCreature('dragon', C.dragons[i % C.dragons.length], p.x, p.y, rand(1.0, 1.25)));
}
for (let i = 0; i < CONFIG.NUMBER_OF_FRIENDLY_DINOS; i++) {
  const p = findFreeSpot(10);
  creatures.push(makeCreature('dino', C.dinos[i % C.dinos.length], p.x, p.y, rand(0.95, 1.2)));
}

// ---- Two hungry baby dragons at the picnic (Feed the Dragons) ----
const hungryDragons = [
  Object.assign(makeCreature('dragon', C.dragons[5], picnic.x - 62, picnic.y + 4, 1.1), { facing: 1 }),
  Object.assign(makeCreature('dragon', C.dragons[6], picnic.x + 62, picnic.y + 4, 1.1), { facing: -1 }),
];
hungryDragons.forEach((d) => { d.want = null; d.state = 'waiting'; d.stateT = 0; d.bubblePop = 0; });

// ---- The grumpy dragon ----
const grumpy = Object.assign(makeCreature('dragon', C.grumpyDragon, 1180, 700, 1.45), {
  mood: 'grumpy', moodMix: 0,     // moodMix: 0 = grumpy colors, 1 = happy colors
  speed: 28, want: null, state: 'grumpy', stateT: 0,
  stompT: 2, stompAnim: 0, smokeT: 1, happyTime: 0, bubblePop: 0,
});

// ---- Hide & seek dinos ----
const seek = { dinos: [], celebrate: 0 };
function setupHideAndSeek() {
  const count = Math.min(CONFIG.NUMBER_OF_HIDING_DINOS, trees.length);
  const treeOrder = shuffle(trees.map((_, i) => i));
  for (let i = 0; i < count; i++) {
    const colors = C.dinos[(i + 2) % C.dinos.length];
    const d = makeCreature('dino', colors, 0, 0, 0.9);
    d.state = 'hidden'; d.tree = treeOrder[i]; d.side = Math.random() < 0.5 ? -1 : 1; d.found = false; d.armed = true;
    d.x = trees[d.tree].x; d.y = trees[d.tree].y - 2;
    seek.dinos.push(d);
  }
}
setupHideAndSeek();

// ---- Townspeople ----
const people = [];
for (let i = 0; i < CONFIG.NUMBER_OF_TOWNSPEOPLE; i++) {
  const p = findFreeSpot(10);
  people.push({
    x: p.x, y: p.y, facing: 1,
    coat: C.coats[i % C.coats.length], hat: pick(C.hats), skin: C.skins[i % C.skins.length],
    scarf: pick(C.coats), hatStyle: i % 3, // 0 beanie, 1 earmuffs, 2 tall hat
    walker: i % 5 < 3,                     // some walk around, some stand
    speed: rand(25, 40), tx: p.x, ty: p.y, idle: rand(0, 3), walkPhase: 0, moving: false,
    waveT: 0, pitch: rand(0.85, 1.25),
  });
}

// ---- Sky Color Hunt buttons ----
const skyButtons = CONFIG.SKY_BUTTONS.map((color, i) => ({ color, x: 0, y: 0, found: false, press: 0, mound: 1, armed: true, tw: i * 1.3 }));
function hideSkyButtons() {
  const placed = [];
  for (const b of skyButtons) {
    const p = findFreeSpot(40, placed.map((q) => ({ x: q.x, y: q.y, r: 140 })));
    Object.assign(b, { x: p.x, y: p.y, found: false, press: 0, mound: 1, armed: true });
    placed.push(p);
  }
}
hideSkyButtons();

// ---- Food ----
const FOOD_TYPES = ['pancakes', 'grilledCheese', 'pasta', 'pizza'];
const MENU = { morning: ['pancakes'], noon: ['grilledCheese'], night: ['pasta', 'pizza'] };
const foods = [];      // food lying in the world
const flyingFoods = []; // food flying through the air (to Michael's head or a dragon's mouth)
let foodSpawnTimer = 0;
function spawnFood(type, x, y) {
  const p = x === undefined ? findFreeSpot(25, foods.map((f) => ({ x: f.x, y: f.y, r: 40 }))) : { x, y };
  foods.push({ type, x: p.x, y: p.y, appear: 0, seed: rand(0, 10) });
  burst('sparkle', p.x, p.y - 20, 6, { color: '#fff7b0', speed: 80 });
}

// ---- Snowflakes and clouds ----
const snowflakes = [];
for (let i = 0; i < CONFIG.NUMBER_OF_SNOWFLAKES; i++) {
  snowflakes.push({ x: rand(0, WORLD_W), y: rand(0, WORLD_H), r: rand(1.5, 4.2), speed: rand(25, 60), sway: rand(0.5, 1.5), phase: rand(0, TAU) });
}
const clouds = [];
for (let i = 0; i < CONFIG.NUMBER_OF_CLOUDS; i++) {
  clouds.push({ x: rand(-100, WORLD_W), y: rand(35, 200), s: rand(0.7, 1.3), speed: rand(6, 16) });
}
const nightStars = [];
for (let i = 0; i < 50; i++) nightStars.push({ x: rand(0, WORLD_W), y: rand(10, 250), r: rand(1, 2.5), p: rand(0, TAU) });

// ---- The background picture (mountains, buildings, blue grass, snow patches) ----
// Drawn once, then reused every frame. The sky is drawn separately so it can change color.
const backgroundLayer = makeCanvas(WORLD_W * 2, WORLD_H * 2);
function paintBackgroundLayer() {
  const b = backgroundLayer.getContext('2d');
  b.scale(2, 2);
  const rnd = seededRandom(7);
  const r = (a, c) => a + rnd() * (c - a);

  // Far snowy mountains
  b.fillStyle = C.mountains;
  b.beginPath(); b.moveTo(0, HORIZON_Y);
  const peaks = [];
  for (let x = -60; x <= WORLD_W + 120; x += r(140, 220)) peaks.push([x, r(130, 190)]);
  for (const [x, y] of peaks) { b.lineTo(x - 70, HORIZON_Y - 40); b.lineTo(x, y); }
  b.lineTo(WORLD_W, HORIZON_Y); b.closePath(); b.fill();
  b.fillStyle = '#ffffff';
  for (const [x, y] of peaks) {
    b.beginPath(); b.moveTo(x, y); b.lineTo(x - 26, y + 34); b.lineTo(x - 10, y + 28); b.lineTo(x, y + 38);
    b.lineTo(x + 12, y + 27); b.lineTo(x + 26, y + 34); b.closePath(); b.fill();
  }

  // Colorful buildings along the back
  let x = -20, ci = 0;
  while (x < WORLD_W + 10) {
    const w = r(85, 140), h = r(70, 175), color = C.buildings[ci++ % C.buildings.length];
    drawBuilding(b, x, HORIZON_Y + 8, w, h, color, Math.floor(r(0, 3)), rnd);
    x += w + r(8, 24);
  }

  // Blue grass
  const g = b.createLinearGradient(0, HORIZON_Y, 0, WORLD_H);
  g.addColorStop(0, C.grassTop); g.addColorStop(1, C.grassBottom);
  b.fillStyle = g;
  b.beginPath(); b.moveTo(0, WORLD_H);
  for (let gx = 0; gx <= WORLD_W; gx += 30) b.lineTo(gx, HORIZON_Y + Math.sin(gx * 0.012) * 4);
  b.lineTo(WORLD_W, WORLD_H); b.closePath(); b.fill();

  // Snow patches lying on the grass
  for (let i = 0; i < 20; i++) {
    const px = r(20, WORLD_W - 20), py = r(HORIZON_Y + 25, WORLD_H - 10), sc = r(0.6, 1.3);
    const blobs = [];
    for (let k = 0; k < 4; k++) blobs.push([px + r(-45, 45) * sc, py + r(-8, 8) * sc, r(22, 55) * sc, r(7, 15) * sc]);
    for (const [bx, by, rx, ry] of blobs) ellipse(b, bx, by + 3, rx, ry, C.snowShadow);
    for (const [bx, by, rx, ry] of blobs) ellipse(b, bx, by, rx, ry, C.snow);
  }

  // Blue grass tufts
  b.lineWidth = 2; b.lineCap = 'round';
  for (let i = 0; i < 260; i++) {
    const tx = r(0, WORLD_W), ty = r(HORIZON_Y + 15, WORLD_H);
    b.strokeStyle = rnd() < 0.6 ? C.grassTuftDark : C.grassTuftLight;
    b.beginPath(); b.moveTo(tx - 5, ty - 7); b.lineTo(tx, ty); b.lineTo(tx + 1, ty - 9); b.moveTo(tx, ty); b.lineTo(tx + 6, ty - 6); b.stroke();
  }

  // Airplane runway
  roundRect(b, 975, plane.homeY - 22, 465, 44, 22, '#9fb4e0', '#7d93c4', 3);
  b.strokeStyle = '#ffffff'; b.lineWidth = 4; b.setLineDash([22, 18]);
  b.beginPath(); b.moveTo(995, plane.homeY); b.lineTo(1430, plane.homeY); b.stroke(); b.setLineDash([]);
  for (let lx = 990; lx < 1435; lx += 36) {
    circle(b, lx, plane.homeY - 22, 3.5, ['#ff4d6d', '#ffd23f', '#7ae582'][(lx / 36 | 0) % 3]);
    circle(b, lx, plane.homeY + 22, 3.5, ['#ff4d6d', '#ffd23f', '#7ae582'][(lx / 36 | 0) % 3]);
  }

  // Picnic blanket (red & white checks)
  b.save();
  b.beginPath(); b.ellipse(picnic.x, picnic.y, 130, 40, 0, 0, TAU); b.clip();
  for (let cx = -140; cx < 140; cx += 20) {
    for (let cy = -50; cy < 50; cy += 14) {
      b.fillStyle = ((cx + cy / 14 * 20) / 20) % 2 === 0 ? '#ff5d6c' : '#ffffff';
      b.fillRect(picnic.x + cx, picnic.y + cy, 20, 14);
    }
  }
  b.restore();
  b.strokeStyle = '#d63a4a'; b.lineWidth = 3;
  b.beginPath(); b.ellipse(picnic.x, picnic.y, 130, 40, 0, 0, TAU); b.stroke();
}

function drawBuilding(b, x, baseY, w, h, color, roof, rnd) {
  const top = baseY - h, dark = shade(color, -0.35);
  b.lineWidth = 3; b.strokeStyle = dark;
  b.fillStyle = color; b.fillRect(x, top, w, h); b.strokeRect(x, top, w, h);
  if (roof === 1) { // pointy roof
    b.fillStyle = shade(color, -0.25);
    b.beginPath(); b.moveTo(x - 8, top); b.lineTo(x + w / 2, top - w * 0.42); b.lineTo(x + w + 8, top); b.closePath(); b.fill(); b.stroke();
    b.strokeStyle = '#ffffff'; b.lineWidth = 9; b.lineCap = 'round';
    b.beginPath(); b.moveTo(x - 4, top - 3); b.lineTo(x + w / 2, top - w * 0.42 + 2); b.lineTo(x + w + 4, top - 3); b.stroke();
  } else if (roof === 2) { // round dome
    b.fillStyle = shade(color, 0.3);
    b.beginPath(); b.arc(x + w / 2, top, w * 0.38, Math.PI, TAU); b.closePath(); b.fill(); b.stroke();
    ellipse(b, x + w / 2, top - w * 0.3, w * 0.2, w * 0.1, '#ffffff');
    circle(b, x + w / 2, top - w * 0.42, 5, '#ffd23f');
  } else { // flat roof with a thick snow blanket and icicles
    roundRect(b, x - 6, top - 10, w + 12, 16, 8, '#ffffff');
    b.fillStyle = '#e6f2ff';
    for (let ix = x + 4; ix < x + w - 4; ix += 11) {
      b.beginPath(); b.moveTo(ix, top + 5); b.lineTo(ix + 3, top + 5 + 6 + (ix % 3) * 3); b.lineTo(ix + 6, top + 5); b.fill();
    }
  }
  // windows
  const cols = Math.max(1, Math.floor((w - 16) / 26)), rows = Math.max(1, Math.floor((h - 46) / 30));
  const gapX = (w - cols * 15) / (cols + 1);
  for (let cx = 0; cx < cols; cx++) {
    for (let cy = 0; cy < rows; cy++) {
      const wx = x + gapX + cx * (15 + gapX), wy = top + 16 + cy * 30;
      roundRect(b, wx, wy, 15, 17, 3, rnd() < 0.75 ? '#fff3a8' : '#bfe6ff', '#ffffff', 2);
    }
  }
  // door
  roundRect(b, x + w / 2 - 10, baseY - 28, 20, 28, 6, dark);
}


/* =====================================================================
   7. PARTICLES — sparkles, hearts, confetti, smoke, dust, music notes
   ===================================================================== */
const particles = [];
function addParticle(p) {
  if (particles.length > 700) return;
  particles.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, age: 0, life: 1, size: 6, color: '#fff', rot: rand(0, TAU), vr: rand(-4, 4), type: 'sparkle' }, p));
}
function burst(type, x, y, n, opt = {}) {
  const speed = opt.speed || 120;
  for (let i = 0; i < n; i++) {
    const a = rand(0, TAU), s = rand(0.3, 1) * speed;
    addParticle({
      type, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (opt.up || 0),
      g: opt.g || 0, life: rand(0.6, 1.1) * (opt.life || 1), size: (opt.size || 7) * rand(0.7, 1.3),
      color: opt.colors ? pick(opt.colors) : (opt.color || '#fff'),
    });
  }
}
const RAINBOW = ['#ff4d6d', '#ff9f1c', '#ffd23f', '#7ae582', '#3a86ff', '#9b5de5', '#ff8fcf'];
function hearts(x, y, n = 5) { burst('heart', x, y, n, { colors: ['#ff4d8d', '#ff7eb6', '#ff5d6c'], speed: 60, up: 70, size: 13, life: 1.3 }); }
function confetti(x, y, n = 30) { burst('confetti', x, y, n, { colors: RAINBOW, speed: 260, up: 160, g: 380, size: 8, life: 1.6 }); }

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    if (p.age >= p.life) { particles.splice(i, 1); continue; }
    p.vy += p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.rot += p.vr * dt;
    if (p.type === 'smoke' || p.type === 'heart' || p.type === 'note') { p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 0.8; }
  }
}
function drawParticles(c) {
  for (const p of particles) {
    const k = p.age / p.life, alpha = 1 - k;
    c.save();
    c.globalAlpha = alpha;
    c.translate(p.x, p.y);
    switch (p.type) {
      case 'sparkle': {
        const s = p.size * (1 - k * 0.5);
        c.rotate(p.rot); c.fillStyle = p.color;
        starPath(c, 0, 0, s, s * 0.35, 4); c.fill();
        break;
      }
      case 'heart':
        c.scale(1 + k * 0.3, 1 + k * 0.3); c.fillStyle = p.color; heartPath(c, p.size); c.fill();
        break;
      case 'confetti':
        c.rotate(p.rot); c.fillStyle = p.color; c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        break;
      case 'smoke':
        c.globalAlpha = alpha * 0.6; circle(c, 0, 0, p.size * (1 + k * 1.6), p.color);
        break;
      case 'dust':
        c.globalAlpha = alpha * 0.7; circle(c, 0, 0, p.size * (1 + k), p.color);
        break;
      case 'note':
        c.fillStyle = p.color; c.strokeStyle = p.color; c.lineWidth = 2.5;
        ellipse(c, 0, 0, 5, 4, p.color);
        c.beginPath(); c.moveTo(4.5, 0); c.lineTo(4.5, -16); c.quadraticCurveTo(10, -12, 11, -6); c.stroke();
        break;
      default:
        circle(c, 0, 0, p.size, p.color);
    }
    c.restore();
  }
}


/* =====================================================================
   8. ACTIVITIES
   ===================================================================== */

// ---------- Modes: the menu, the 5 activities and free play ----------
// The menu cards, in order (3 on top, 3 below)
const MENU_CARDS = ['sky', 'seek', 'feed', 'grumpy', 'plane', 'free'];
// Is this activity switched on right now? (Free play switches everything on.)
function activityOn(name) { return game.mode === name || game.mode === 'free'; }
function usesFood() { return activityOn('feed') || activityOn('grumpy'); }

function moveMenuSelection(dir) {
  const i = game.menuIndex;
  if (dir === 'left') game.menuIndex = i % 3 === 0 ? i + 2 : i - 1;
  if (dir === 'right') game.menuIndex = i % 3 === 2 ? i - 2 : i + 1;
  if (dir === 'up' || dir === 'down') game.menuIndex = (i + 3) % 6;
  Sound.tick();
}
// The SPACE BAR (or Enter): pick on the menu, pat a creature, change the TV channel
function pressAction() {
  if (game.fade) return;
  if (game.mode === 'menu') { startMode(MENU_CARDS[game.menuIndex]); return; }
  if (game.complete) { if (game.complete.t > 1.5) goMenu(); return; }
  if (game.scene === 'house') { changeChannel(); return; }
  if (game.petTarget) petCreature(game.petTarget);
}
// Clicks and taps: menu cards, the home button, the pat bubble
function handlePointer(e) {
  const x = (e.clientX - view.offX) / view.scale, y = (e.clientY - view.offY) / view.scale;
  if (game.fade) return;
  if (game.mode === 'menu') {
    MENU_CARDS.forEach((mode, i) => {
      const r = menuCardRect(i);
      if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) { game.menuIndex = i; startMode(mode); }
    });
    return;
  }
  if (Math.hypot(x - HOME_BUTTON.x, y - HOME_BUTTON.y) < HOME_BUTTON.r + 6) { goMenu(); return; }
  if (game.complete) { if (game.complete.t > 1.5) goMenu(); return; }
  if (game.petTarget) {
    const p = promptPos(game.petTarget);
    if (Math.hypot(x - p.x, y - p.y) < 45) petCreature(game.petTarget);
  }
}

function startMode(mode) {
  if (game.fade) return;
  Sound.magic(); Sound.chirp(1.2);
  fadeTo(() => {
    game.mode = mode;
    game.started = false;
    resetWorldForMode(mode);
  });
}
function goMenu() {
  if (game.fade || game.mode === 'menu') return;
  Sound.chirp(0.9);
  fadeTo(() => { game.mode = 'menu'; resetWorldForMode('menu'); });
}
// Puts everything back in place so each activity starts fresh
function resetWorldForMode(mode) {
  Sound.stopEngine(); Sound.stopTunes();
  game.scene = 'world'; game.complete = null; game.finishIn = 0;
  game.flight = null; game.parade = null; game.paradeDelay = 0; game.skyTarget = C.sky;
  game.petTarget = null; game.patAnim = null; game.fedCount = 0;
  Object.assign(plane, { x: plane.homeX, y: plane.homeY, alt: 0, facing: -1, tilt: 0, armed: true });
  Object.assign(game.camera, { x: WORLD_W / 2, y: WORLD_H / 2, zoom: 1 });
  Object.assign(michael, { x: 720, y: 600, vx: 0, vy: 0, carry: [], hidden: mode === 'menu', facing: 1, flipX: 1 });
  flyingFoods.length = 0; foods.length = 0;
  hideSkyButtons();
  resetHideAndSeek();
  resetGrumpy();
  hungryDragons.forEach((d) => { d.state = 'waiting'; d.mouthOpen = 0; d.happyT = 0; newWish(d); });
  if (usesFood()) for (let i = 0; i < CONFIG.NUMBER_OF_FOOD_ITEMS; i++) spawnFood(Math.random() < 0.6 ? pick(MENU[game.timeOfDay]) : pick(FOOD_TYPES));
  particles.length = 0;
}
// "You did it!" - big star, cheering, then back to the menu
function completeActivity() {
  if (game.mode === 'menu' || game.mode === 'free') return;
  game.complete = { t: 0 };
  Sound.fanfare(); Sound.cheer();
  for (let i = 0; i < 6; i++) confetti(rand(200, 1240), rand(100, 400), 25);
}
function updateFinishing(dt) {
  if (game.finishIn > 0) {
    game.finishIn -= dt;
    if (game.finishIn <= 0) completeActivity();
  }
  if (game.complete) {
    game.complete.t += dt;
    if (Math.random() < dt * 12) addParticle({ type: 'confetti', x: rand(0, WORLD_W), y: -10, vx: rand(-30, 30), vy: rand(80, 150), g: 30, life: 5, size: 10, color: pick(RAINBOW) });
    if (game.complete.t > 6) goMenu();
  }
}

// ---------- Patting dragons and dinos (SPACE BAR) ----------
// Each press does the next thing: 1) pat  2) a trick  3) a dance
function pettableCreatures() {
  const list = creatures.concat(hungryDragons, [grumpy]);
  for (const d of seek.dinos) if (d.state === 'following') list.push(d);
  return list;
}
function updatePetting(dt) {
  if (game.patAnim) { game.patAnim.t += dt; if (game.patAnim.t > 1) game.patAnim = null; }
  game.petTarget = null;
  if (game.mode === 'menu' || game.complete || game.flight || michael.hidden || game.scene !== 'world') return;
  let best = null, bestD = 1;
  for (const c of pettableCreatures()) {
    const dx = (michael.x - c.x) / (95 * c.size), dy = (michael.y - c.y) / (55 * c.size);
    const d = dx * dx + dy * dy;
    if (d < bestD) { best = c; bestD = d; }
  }
  game.petTarget = best;
}
function isBusy(c) { return c.petT > 0 || c.spinT > 0 || c.danceT > 0 || c.trickT > 0; }
function petCreature(c) {
  if (c === grumpy && grumpy.mood === 'grumpy') {
    // the grumpy dragon doesn't want pats yet - "hmph!"
    Sound.grumble();
    c.facing = michael.x > c.x ? -1 : 1;
    c.bubblePop = 1;
    for (let i = 0; i < 5; i++) addParticle({ type: 'smoke', x: c.x, y: c.y - 95 * c.size, vx: rand(-30, 30), vy: rand(-50, -20), size: rand(5, 8), color: '#b8b2c4', life: 1.1 });
    return;
  }
  if (c.state === 'eating' || c.state === 'catching' || c.state === 'transforming' || isBusy(c)) return;
  c.petCount = (c.petCount || 0) + 1;
  c.facing = michael.x > c.x ? 1 : -1;
  const action = (c.petCount - 1) % 3;
  if (action === 0) {        // pat: closes eyes happily, hearts
    c.petT = 1.2;
    game.patAnim = { c, t: 0 };
    Sound.purr();
    hearts(c.x, c.y - 80 * c.size, 7);
  } else if (action === 1) { // trick: dragons breathe rainbow sparkles, dinos do a spin and a little "rawr"
    if (c.kind === 'dragon') { c.trickT = 1.3; Sound.sparkleBreath(); }
    else { c.spinT = 0.8; Sound.rawr(c.pitch); burst('sparkle', c.x, c.y - 40, 10, { colors: RAINBOW, speed: 150 }); }
  } else {                   // dance with music notes
    c.danceT = 2.2;
    Sound.playTune(TUNES.dance, 260, 'triangle', 0.14);
  }
}
function promptPos(cr) {
  const hasBubble = (activityOn('feed') && hungryDragons.includes(cr) && (cr.state === 'waiting' || cr.state === 'catching')) ||
                    (cr === grumpy && activityOn('grumpy') && (cr.state === 'grumpy' || cr.state === 'catching'));
  if (hasBubble) { const side = michael.x < cr.x ? 1 : -1; return { x: cr.x + side * 85 * cr.size, y: cr.y - 70 * cr.size - cr.jump }; }
  return { x: cr.x, y: cr.y - 118 * cr.size - cr.jump };
}

// ---------- Time of day: decides the dragons' menu ----------
function currentTimeOfDay() {
  const mode = CONFIG.TIME_OF_DAY;
  if (mode === 'morning' || mode === 'noon' || mode === 'night') return mode;
  if (mode === 'clock') {
    const h = new Date().getHours();
    return h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 16 ? 'noon' : 'night';
  }
  const phases = ['morning', 'noon', 'night'];
  return phases[Math.floor(Math.max(0, game.time) / CONFIG.SECONDS_PER_TIME_OF_DAY) % 3];
}
function updateTimeOfDay(dt) {
  const tod = currentTimeOfDay();
  if (tod !== game.timeOfDay) {
    game.timeOfDay = tod;
    game.hud.timePop = 1;
    Sound.chime();
    // dragons whose wish isn't on the new menu ask for something new
    for (const d of hungryDragons) if (d.state === 'waiting' && !MENU[tod].includes(d.want)) newWish(d);
    if (grumpy.state === 'grumpy' && !MENU[tod].includes(grumpy.want)) { grumpy.want = pick(MENU[tod]); grumpy.bubblePop = 1; }
  }
  const sunTarget = { morning: [250, 120], noon: [720, 75], night: [720, 420] }[tod];
  game.sunX = lerp(game.sunX, sunTarget[0], 1 - Math.exp(-dt * 0.8));
  game.sunY = lerp(game.sunY, sunTarget[1], 1 - Math.exp(-dt * 0.8));
  game.night = lerp(game.night, tod === 'night' ? 1 : 0, 1 - Math.exp(-dt * 0.8));
}

// ---------- Food: collecting and keeping enough around ----------
function wantedFoods() {
  const list = activityOn('feed') ? hungryDragons.filter((d) => d.state === 'waiting' && d.want).map((d) => d.want) : [];
  if (activityOn('grumpy') && grumpy.state === 'grumpy' && grumpy.want) list.push(grumpy.want);
  return list;
}
function updateFoods(dt) {
  // Make sure every food a dragon is asking for can be found somewhere
  for (const want of wantedFoods()) {
    const around = foods.some((f) => f.type === want) || michael.carry.includes(want) || flyingFoods.some((f) => f.type === want);
    if (!around) spawnFood(want);
  }
  // Top up the rest, mostly with food from the current menu
  foodSpawnTimer -= dt;
  if (foods.length < CONFIG.NUMBER_OF_FOOD_ITEMS && foodSpawnTimer <= 0) {
    foodSpawnTimer = 3;
    spawnFood(Math.random() < 0.7 ? pick(MENU[game.timeOfDay]) : pick(FOOD_TYPES));
  }
  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i];
    f.appear = Math.min(1, f.appear + dt * 3);
    if (Math.random() < dt * 0.4) addParticle({ type: 'sparkle', x: f.x + rand(-18, 18), y: f.y - 20 + rand(-14, 10), size: 6, color: '#fffbd0', life: 0.6, vr: 2 });
    if (!michael.hidden && game.scene === 'world' && touching(f.x, f.y, 42, 30)) {
      foods.splice(i, 1);
      Sound.pop(); Sound.sparkle();
      burst('sparkle', f.x, f.y - 15, 14, { colors: ['#fff27a', '#ffffff', '#ffb3e6'], speed: 160 });
      // fly onto Michael's head
      flyingFoods.push({
        type: f.type, x0: f.x, y0: f.y - 15, t: 0, dur: 0.45, arc: 40,
        to: () => headStackPos(michael.carry.length),
        done: () => {
          michael.carry.push(f.type);
          if (michael.carry.length > CONFIG.MAX_FOOD_CARRIED) {
            const dropped = michael.carry.shift(); // oldest one hops back into the world
            spawnFood(dropped);
          }
        },
      });
    }
  }
  // food flying through the air
  for (let i = flyingFoods.length - 1; i >= 0; i--) {
    const f = flyingFoods[i];
    f.t += dt;
    if (f.t >= f.dur) { flyingFoods.splice(i, 1); f.done(); }
  }
}
function headStackPos(i) {
  return { x: michael.x, y: michael.y - CONFIG.CHARACTER_HEIGHT - 16 - i * 24 };
}
// Gives the top matching food from Michael's head to a dragon. Returns true if he had it.
function giveFood(type, toX, toY, onEaten) {
  const idx = michael.carry.lastIndexOf(type);
  if (idx < 0) return false;
  michael.carry.splice(idx, 1);
  const from = headStackPos(idx);
  flyingFoods.push({ type, x0: from.x, y0: from.y, t: 0, dur: 0.6, arc: 60, to: () => ({ x: toX, y: toY }), done: onEaten });
  Sound.whoosh();
  return true;
}

// ---------- Feed the Dragons ----------
function newWish(d) {
  const menu = MENU[game.timeOfDay];
  const other = hungryDragons.find((o) => o !== d);
  let options = menu.filter((f) => !other || other.want !== f);
  if (options.length === 0) options = menu;
  d.want = pick(options);
  d.bubblePop = 1;
}
function mouthPos(c) {
  return { x: c.x + c.facing * 40 * c.size, y: c.y - (46 + c.jump) * c.size };
}
function updateHungryDragons(dt) {
  for (const d of hungryDragons) {
    d.stateT -= dt;
    d.bubblePop = Math.max(0, d.bubblePop - dt * 2);
    d.walkPhase += dt;
    const near = !michael.hidden && touching(d.x, d.y, 95, 60);
    if (!activityOn('feed')) { updateHop(d, dt); continue; }
    if (d.state === 'waiting') {
      // look toward Michael when he's close
      if (Math.abs(michael.x - d.x) < 250 && Math.abs(michael.y - d.y) < 150) d.facing = michael.x > d.x ? 1 : -1;
      if (near && michael.carry.includes(d.want)) {
        const m = mouthPos(d);
        giveFood(d.want, m.x, m.y, () => { d.state = 'eating'; d.stateT = 1.1; Sound.chomp(); });
        d.state = 'catching';
        d.mouthOpen = 1;
      } else if (arrived(d, near)) {
        d.bubblePop = 1; Sound.hmm(); // "this one, please!"
      }
    } else if (d.state === 'eating') {
      d.mouthOpen = (Math.sin(game.time * 18) > 0) ? 1 : 0.2;
      if (d.stateT <= 0) {
        d.state = 'happy'; d.stateT = 2.6; d.happyT = 1.4; d.mouthOpen = 1;
        Sound.cheer(); Sound.chirp(d.pitch);
        game.fedCount++;
        if (game.mode === 'feed' && game.fedCount >= CONFIG.FEEDS_TO_FINISH) game.finishIn = 2.8;
        hearts(d.x, d.y - 80 * d.size, 8);
        confetti(d.x, d.y - 60, 24);
      }
    } else if (d.state === 'happy') {
      if (Math.random() < dt * 3) hearts(d.x, d.y - 80 * d.size, 1);
      if (d.stateT <= 0) { d.state = 'waiting'; d.mouthOpen = 0; d.armed = !near; newWish(d); }
    }
    updateHop(d, dt);
  }
}

// ---------- Cheer Up the Grumpy Dragon ----------
function updateGrumpy(dt) {
  const g = grumpy;
  g.stateT -= dt;
  g.bubblePop = Math.max(0, g.bubblePop - dt * 2);
  const near = !michael.hidden && touching(g.x, g.y, 110, 65);

  if (g.state === 'grumpy') {
    // slow, stompy walking in his corner of the world
    if (g.stompAnim > 0) {
      g.stompAnim -= dt;
      g.moving = false;
      if (g.stompAnim <= 0) { // foot comes down
        Sound.stomp();
        if (CONFIG.SCREEN_SHAKE) game.shake = 3;
        burst('dust', g.x + rand(-20, 20), g.y, 8, { color: '#e8eefc', speed: 70, size: 7, life: 0.7 });
      }
    } else {
      wander(g, dt, GRUMPY_AREA);
      g.stompT -= dt;
      if (g.stompT <= 0) { g.stompT = rand(2.5, 4.5); g.stompAnim = 0.35; }
    }
    // little puffs of smoke from his nose
    g.smokeT -= dt;
    if (g.smokeT <= 0) {
      g.smokeT = rand(0.9, 1.6);
      const nose = { x: g.x + g.facing * 46 * g.size, y: g.y - (50 + g.jump) * g.size };
      for (let i = 0; i < 3; i++) addParticle({ type: 'smoke', x: nose.x, y: nose.y, vx: g.facing * rand(20, 50), vy: rand(-45, -25), size: rand(4, 7), color: '#a9a3b5', life: 1.2 });
      if (near) Sound.puff();
    }
    if (!activityOn('grumpy')) {
      // just stomping around today
    } else if (near && michael.carry.includes(g.want)) {
      g.facing = michael.x > g.x ? 1 : -1;
      const m = mouthPos(g);
      giveFood(g.want, m.x, m.y, () => { g.state = 'eating'; g.stateT = 1.2; Sound.chomp(); });
      g.state = 'catching'; g.mouthOpen = 1; g.moving = false;
    } else if (arrived(g, near)) {
      // "Hmph!" - turns away and puffs, but never does anything to Michael
      Sound.grumble();
      g.facing = michael.x > g.x ? -1 : 1;
      g.bubblePop = 1;
      for (let i = 0; i < 5; i++) addParticle({ type: 'smoke', x: g.x, y: g.y - 95 * g.size, vx: rand(-30, 30), vy: rand(-50, -20), size: rand(5, 8), color: '#b8b2c4', life: 1.1 });
    }
  } else if (g.state === 'catching') {
    g.moving = false;
  } else if (g.state === 'eating') {
    g.moving = false;
    g.mouthOpen = (Math.sin(game.time * 18) > 0) ? 1 : 0.2;
    if (g.stateT <= 0) { g.state = 'transforming'; g.stateT = 1.4; Sound.magic(); }
  } else if (g.state === 'transforming') {
    g.moodMix = clamp(1 - g.stateT / 1.4, 0, 1);
    if (g.moodMix > 0.5) g.mood = 'happy';
    g.mouthOpen = 1;
    if (Math.random() < dt * 30) addParticle({ type: 'sparkle', x: g.x + rand(-60, 60), y: g.y - rand(0, 120), size: 9, color: pick(RAINBOW), life: 0.8 });
    if (g.stateT <= 0) {
      g.state = 'happy'; g.mood = 'happy'; g.moodMix = 1; g.happyT = 1.4; g.happyTime = 0; g.speed = 45; g.mouthOpen = 0;
      Sound.cheer(); Sound.playTune(TUNES.happyDragon, 260, 'triangle', 0.14, 1, 0.3);
      hearts(g.x, g.y - 120, 12); confetti(g.x, g.y - 100, 40);
      if (game.mode === 'grumpy') game.finishIn = 3;
    }
  } else if (g.state === 'happy') {
    if (g.happyT <= 0 && !isBusy(g)) wander(g, dt, WANDER_AREA);
    else g.moving = false;
    g.mouthOpen = g.happyT > 0 ? 1 : 0;
    if (arrived(g, near)) { g.happyT = 1.4; Sound.chirp(0.8); hearts(g.x, g.y - 110, 6); }
    g.happyTime += dt;
    if (game.mode === 'free' && CONFIG.GRUMPY_GETS_GRUMPY_AGAIN_AFTER > 0 && g.happyTime > CONFIG.GRUMPY_GETS_GRUMPY_AGAIN_AFTER && !near) {
      // a little grey cloud comes back...
      g.state = 'grumpy'; g.mood = 'grumpy'; g.moodMix = 0; g.speed = 28; g.want = pick(MENU[game.timeOfDay]); g.bubblePop = 1;
      for (let i = 0; i < 10; i++) addParticle({ type: 'smoke', x: g.x + rand(-40, 40), y: g.y - rand(60, 140), vx: rand(-20, 20), vy: rand(-30, 0), size: 8, color: '#b8b2c4', life: 1.2 });
      g.tx = clamp(g.x, GRUMPY_AREA.x1, GRUMPY_AREA.x2); g.ty = clamp(g.y, GRUMPY_AREA.y1, GRUMPY_AREA.y2);
    }
  }
  if (g.state !== 'eating' && g.state !== 'transforming' && g.state !== 'catching' && g.mood === 'grumpy') g.mouthOpen = 0;
  updateHop(g, dt);
}

function resetGrumpy() {
  Object.assign(grumpy, {
    state: 'grumpy', mood: 'grumpy', moodMix: 0, speed: 28, want: pick(MENU[game.timeOfDay]), bubblePop: 0,
    happyTime: 0, mouthOpen: 0, happyT: 0, x: 1180, y: 700, tx: 1180, ty: 700, idle: 1, armed: true,
  });
}

// ---------- Sky Color Hunt ----------
function updateSkyButtons(dt) {
  if (!activityOn('sky')) return;
  for (const b of skyButtons) {
    b.press = Math.max(0, b.press - dt * 2.5);
    if (b.found) b.mound = Math.max(0, b.mound - dt * 3);
    const near = !michael.hidden && touching(b.x, b.y, 34, 22);
    if (arrived(b, near)) {
      b.press = 1;
      game.skyTarget = b.color;
      Sound.click(); Sound.magic();
      burst('sparkle', b.x, b.y - 10, 16, { color: b.color, speed: 170 });
      burst('sparkle', b.x, b.y - 10, 8, { color: '#ffffff', speed: 120 });
      if (!b.found) {
        b.found = true;
        game.hud.skyPop = 1;
        burst('dust', b.x, b.y - 6, 14, { color: '#ffffff', speed: 110, size: 6, life: 0.8 });
        if (skyButtons.every((s) => s.found) && !game.parade) game.paradeDelay = 1.3;
      }
    }
  }
  if (game.paradeDelay > 0) {
    game.paradeDelay -= dt;
    if (game.paradeDelay <= 0) startParade();
  }
}

// The surprise: a dragon parade under a rainbow sky
function startParade() {
  const dragons = [];
  for (let i = 0; i < 7; i++) {
    const d = makeCreature('dragon', C.dragons[i % C.dragons.length], -120 - i * 135, 372, 1.15);
    d.facing = 1; d.moving = true; d.balloon = RAINBOW[(i + 2) % RAINBOW.length];
    dragons.push(d);
  }
  game.parade = { t: 0, dragons, speed: (WORLD_W + 240 + 7 * 135) / CONFIG.PARADE_SECONDS };
  Sound.cheer();
  const songLength = 16 * 60 / 180; // 16 beats at 180 beats per minute
  const repeats = Math.ceil(CONFIG.PARADE_SECONDS / songLength);
  Sound.playTune(TUNES.parade, 180, 'square', 0.06, repeats, 0.4);
  Sound.playTune(TUNES.paradeBass, 180, 'triangle', 0.12, repeats, 0.4);
}
function updateParade(dt) {
  const p = game.parade;
  if (!p) return;
  p.t += dt;
  p.dragons.forEach((d, i) => {
    d.x = -120 - i * 135 + p.t * p.speed;
    d.walkPhase += dt * 7;
    d.jump = Math.abs(Math.sin(p.t * 5 + i)) * 10;
  });
  if (Math.random() < dt * 14) addParticle({ type: 'confetti', x: rand(0, WORLD_W), y: -10, vx: rand(-30, 30), vy: rand(60, 120), g: 30, life: 5, size: 9, color: pick(RAINBOW) });
  // everyone in town is excited
  if (Math.random() < dt * 1.5) { const c = pick(creatures); c.happyT = 1.4; hearts(c.x, c.y - 70, 2); }
  if (p.t >= CONFIG.PARADE_SECONDS) {
    game.parade = null;
    game.skyTarget = C.sky;
    if (game.mode === 'sky') game.finishIn = 0.6;
    else hideSkyButtons(); // free play: ready to be found again
  }
}

// ---------- Hide and Seek ----------
function resetHideAndSeek() {
  const order = shuffle(trees.map((_, i) => i));
  seek.dinos.forEach((d, i) => Object.assign(d, {
    state: 'hidden', tree: order[i], side: Math.random() < 0.5 ? -1 : 1, found: false, armed: true,
    x: trees[order[i]].x, y: trees[order[i]].y - 2, jump: 0, happyT: 0, moving: false,
  }));
  seek.celebrate = 0;
}
function updateHideAndSeek(dt) {
  if (!activityOn('seek')) return;
  let followIndex = 0;
  for (const d of seek.dinos) {
    const tree = trees[d.tree];
    if (d.state === 'hidden') {
      const near = !michael.hidden && touching(tree.x, tree.y, 100, 60);
      if (!near) d.armed = true;
      if (near && d.armed) {
        // Found one! Pop out with a cheer.
        d.state = 'popping'; d.popT = 0; d.found = true;
        d.fromX = tree.x; d.fromY = tree.y - 2;
        d.toX = clamp(tree.x + d.side * 75, 60, WORLD_W - 60); d.toY = clamp(tree.y + 20, GROUND_TOP, WORLD_H - 10);
        tree.shake = 1;
        game.hud.starPop = 1;
        Sound.pop(); Sound.cheer(); Sound.chirp(1.3);
        confetti(tree.x, tree.y - 100, 30);
        burst('sparkle', tree.x, tree.y - 110, 12, { color: '#ffd23f', speed: 200 });
        const foundCount = seek.dinos.filter((x) => x.found).length;
        if (foundCount === seek.dinos.length) {
          seek.celebrate = 4.5;
          if (game.mode === 'seek') game.finishIn = 3;
          else setTimeout(() => Sound.fanfare(), 600);
        }
      }
    } else if (d.state === 'popping') {
      d.popT += dt / 0.6;
      const k = Math.min(1, d.popT);
      d.x = lerp(d.fromX, d.toX, k); d.y = lerp(d.fromY, d.toY, k);
      d.jump = Math.sin(k * Math.PI) * 70;
      d.facing = d.side;
      if (k >= 1) { d.state = 'following'; d.jump = 0; d.happyT = 1.4; hearts(d.x, d.y - 60, 4); }
    } else if (d.state === 'following') {
      // Found dinos follow Michael around like little ducklings
      const leader = followIndex === 0 ? { x: michael.x - michael.facing * 40, y: michael.y + 4 } : seek.dinos.filter((x) => x.state === 'following')[followIndex - 1];
      followIndex++;
      const dx = leader.x - d.x, dy = leader.y - d.y, dd = Math.hypot(dx, dy);
      if (dd > 55) {
        const s = Math.min((dd - 55) * 4, 420) * dt;
        d.x += (dx / dd) * s; d.y += (dy / dd) * s;
        d.moving = true; d.walkPhase += dt * 10;
        if (Math.abs(dx) > 3) d.facing = dx > 0 ? 1 : -1;
      } else d.moving = false;
      d.y = clamp(d.y, GROUND_TOP, WORLD_H - 5);
      if (seek.celebrate > 0 && d.happyT <= 0) { d.happyT = 1.4; hearts(d.x, d.y - 60, 2); }
    } else if (d.state === 'returning') {
      // Running back to a new tree to hide again
      const dx = tree.x - d.x, dy = (tree.y - 2) - d.y, dd = Math.hypot(dx, dy);
      if (dd < 8) {
        d.state = 'hidden'; d.x = tree.x; d.y = tree.y - 2; d.moving = false; d.armed = false;
        burst('dust', tree.x, tree.y - 30, 8, { color: '#ffffff', speed: 80, size: 6 });
      } else {
        const s = Math.min(dd, 300 * dt);
        d.x += (dx / dd) * s; d.y += (dy / dd) * s; d.moving = true; d.walkPhase += dt * 14;
        d.facing = dx > 0 ? 1 : -1;
      }
    }
    updateHop(d, dt);
  }
  // After all are found: a little party, then they run off to hide again
  if (seek.celebrate > 0) {
    seek.celebrate -= dt;
    if (Math.random() < dt * 8) confetti(michael.x + rand(-100, 100), michael.y - 160, 3);
    if (seek.celebrate <= 0 && game.mode === 'free') {
      const nearestTree = trees.indexOf(trees.slice().sort((a, b) => Math.hypot(a.x - michael.x, a.y - michael.y) - Math.hypot(b.x - michael.x, b.y - michael.y))[0]);
      const freeTrees = shuffle(trees.map((_, i) => i).filter((i) => i !== nearestTree));
      seek.dinos.forEach((d, i) => {
        d.state = 'returning'; d.found = false; d.tree = freeTrees[i % freeTrees.length]; d.side = Math.random() < 0.5 ? -1 : 1;
      });
      Sound.whoosh();
    }
  }
  for (const t of trees) t.shake = Math.max(0, t.shake - dt * 1.5);
}

// ---------- Airplane Ride ----------
// The airplane flies along these points (where its shadow is on the ground)
const FLIGHT_PATH = [[1290, 412], [1120, 410], [900, 385], [600, 360], [300, 390], [140, 560], [300, 740], [700, 690], [1050, 760], [1330, 670], [1360, 520], [1290, 412]];
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
function flightPathAt(u) {
  const P = FLIGHT_PATH, n = P.length - 1;
  const f = clamp(u, 0, 0.99999) * n, i = Math.floor(f), t = f - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  return { x: catmullRom(p0[0], p1[0], p2[0], p3[0], t), y: catmullRom(p0[1], p1[1], p2[1], p3[1], t) };
}
function flightAltitude(u) {
  const up = clamp((u - 0.05) / 0.12, 0, 1), down = clamp((0.97 - u) / 0.12, 0, 1);
  return 175 * smooth(Math.min(up, down));
}
function startFlight() {
  game.flight = { phase: 'boarding', t: 0, bt: 0, fromX: michael.x, fromY: michael.y, cloudT: 0, clouds: [] };
  michael.vx = michael.vy = 0;
  Sound.boing(1.4); Sound.chirp(1.2);
}
function updateFlight(dt) {
  const f = game.flight;
  plane.prop += dt * (f ? 40 : 2);
  if (!f) return;
  if (f.phase === 'boarding') {
    f.bt += dt;
    if (f.bt >= 0.7) { f.phase = 'flying'; michael.hidden = true; Sound.startEngine(); Sound.whoosh(); }
  } else if (f.phase === 'flying') {
    f.t += dt;
    const u = f.t / CONFIG.FLIGHT_SECONDS;
    const prevX = plane.x, prevY = plane.y - plane.alt;
    const p = flightPathAt(u);
    plane.x = p.x; plane.y = p.y; plane.alt = flightAltitude(u);
    const vx = plane.x - prevX, vy = (plane.y - plane.alt) - prevY;
    if (Math.abs(vx) > 0.3) plane.facing = vx > 0 ? 1 : -1;
    plane.tilt = lerp(plane.tilt, clamp(Math.atan2(vy, Math.abs(vx) + 0.001) * 0.6, -0.35, 0.35), 1 - Math.exp(-dt * 5));
    // dragons, dinos and people below look up and wave
    for (const c of creatures.concat(seek.dinos.filter((d) => d.state !== 'hidden'), [grumpy], hungryDragons)) {
      if (Math.hypot(c.x - plane.x, c.y - plane.y) < 200 && !(c.waveCool > 0)) {
        c.waveCool = 3; c.happyT = 1.4; c.lookUp = 1.5; hearts(c.x, c.y - 70 * c.size, 2);
        Sound.chirp(c.pitch * 1.2);
      }
      c.waveCool = (c.waveCool || 0) - dt;
    }
    for (const person of people) {
      if (Math.hypot(person.x - plane.x, person.y - plane.y) < 200 && person.waveT <= 0) person.waveT = 2;
    }
    // big fluffy pink clouds rushing past the window
    f.cloudT -= dt;
    if (f.cloudT <= 0 && u > 0.12 && u < 0.88) {
      f.cloudT = rand(0.8, 1.6);
      f.clouds.push({ x: plane.facing > 0 ? WORLD_W + 200 : -200, y: rand(80, WORLD_H - 120), s: rand(1.4, 2.4), v: -plane.facing * rand(380, 520) });
    }
    if (u >= 1) {
      f.phase = 'landing'; f.bt = 0;
      plane.x = plane.homeX; plane.y = plane.homeY; plane.alt = 0; plane.tilt = 0; plane.facing = -1;
      Sound.stopEngine(); Sound.playTune(TUNES.landing, 200, 'triangle', 0.18);
      michael.hidden = false;
    }
  } else if (f.phase === 'landing') {
    f.bt += dt;
    if (f.bt >= 0.7) {
      game.flight = null;
      michael.x = plane.homeX - 170; michael.y = plane.homeY + 75;
      plane.armed = false;
      hearts(michael.x, michael.y - 150, 6);
      if (game.mode === 'plane') game.finishIn = 1.5;
      return;
    }
  }
  for (let i = f.clouds.length - 1; i >= 0; i--) {
    const c = f.clouds[i];
    c.x += c.v * dt;
    if (c.x < -400 || c.x > WORLD_W + 400) f.clouds.splice(i, 1);
  }
}
function updateCamera(dt) {
  const cam = game.camera, f = game.flight;
  let zoomTarget = 1, tx = WORLD_W / 2, ty = WORLD_H / 2;
  if (f && f.phase === 'flying') {
    const u = f.t / CONFIG.FLIGHT_SECONDS;
    const amt = smooth(clamp(Math.min(u / 0.12, (1 - u) / 0.12), 0, 1));
    zoomTarget = 1 + 0.7 * amt;
    tx = lerp(WORLD_W / 2, plane.x, amt); ty = lerp(WORLD_H / 2, plane.y - plane.alt, amt);
  }
  const k = 1 - Math.exp(-dt * 4);
  cam.zoom = lerp(cam.zoom, zoomTarget, k);
  cam.x = lerp(cam.x, tx, k); cam.y = lerp(cam.y, ty, k);
  const hw = WORLD_W / 2 / cam.zoom, hh = WORLD_H / 2 / cam.zoom;
  cam.x = clamp(cam.x, hw, WORLD_W - hw); cam.y = clamp(cam.y, hh, WORLD_H - hh);
}

// ---------- The house with the TV ----------
const tv = { channel: 0, channelT: 0, staticT: 0, armed: true };
const doormat = { armed: false };
const TV_CHANNELS = 4;
function fadeTo(callback) {
  game.fade = { t: 0, callback, done: false };
}
function updateFade(dt) {
  const f = game.fade;
  if (!f) return;
  f.t += dt;
  if (f.t >= 0.35 && !f.done) { f.done = true; f.callback(); }
  if (f.t >= 0.7) game.fade = null;
}
function enterHouse() {
  Sound.chirp(1.1);
  fadeTo(() => {
    game.scene = 'house';
    michael.x = 720; michael.y = 700; michael.vx = michael.vy = 0;
    particles.length = 0;
    tv.armed = false; tv.channelT = 0; tv.staticT = 0.4;
    Sound.playTune(TUNES.tv, 220, 'triangle', 0.15, 1, 0.3);
  });
}
function leaveHouse() {
  Sound.chirp(0.9);
  fadeTo(() => {
    game.scene = 'world';
    michael.x = house.x; michael.y = house.y + 70; michael.vx = michael.vy = 0;
    house.armed = false;
    particles.length = 0;
  });
}
function changeChannel() {
  tv.channel = (tv.channel + 1) % TV_CHANNELS;
  tv.channelT = 0; tv.staticT = 0.35;
  Sound.click(); Sound.playTune(TUNES.tv, 240, 'triangle', 0.12, 1, 0.3);
}
function updateHouseScene(dt) {
  tv.channelT += dt;
  tv.staticT = Math.max(0, tv.staticT - dt);
  const nearTV = michael.y < 560 && Math.abs(michael.x - 720) < 240;
  if (arrived(tv, nearTV) || tv.channelT > 12) changeChannel(); // walk up to the TV (or press SPACE) to change the channel
  // walk onto the doormat at the bottom to go back outside
  const onMat = michael.y > 770 && Math.abs(michael.x - 720) < 120;
  if (arrived(doormat, onMat) && !game.fade) leaveHouse();
  if (Math.random() < dt * 1.5) addParticle({ type: 'note', x: rand(540, 900), y: 380, vx: rand(-20, 20), vy: -50, life: 2, color: pick(RAINBOW) });
}


/* =====================================================================
   9. UPDATING — called every frame
   ===================================================================== */
function updateMichael(dt, bounds) {
  let ix = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let iy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  const len = Math.hypot(ix, iy) || 1;
  ix /= len; iy /= len;
  const speed = CONFIG.MOVE_SPEED * (bounds.speedScale || 1);
  const k = 1 - Math.exp(-CONFIG.MOVE_SMOOTHNESS * dt); // smooth speeding up / slowing down
  michael.vx += (ix * speed - michael.vx) * k;
  michael.vy += (iy * speed * 0.85 - michael.vy) * k;
  michael.x += michael.vx * dt;
  michael.y += michael.vy * dt;
  // stay on screen
  const halfW = bounds.halfWidth;
  if (michael.x < bounds.x1 + halfW) { michael.x = bounds.x1 + halfW; michael.vx = 0; }
  if (michael.x > bounds.x2 - halfW) { michael.x = bounds.x2 - halfW; michael.vx = 0; }
  if (michael.y < bounds.y1) { michael.y = bounds.y1; michael.vy = 0; }
  if (michael.y > bounds.y2) { michael.y = bounds.y2; michael.vy = 0; }

  const sp = Math.hypot(michael.vx, michael.vy);
  michael.moveAmt = clamp(sp / speed, 0, 1);
  if (michael.vx < -20) michael.facing = -1;
  else if (michael.vx > 20) michael.facing = 1;
  michael.flipX = lerp(michael.flipX, michael.facing, 1 - Math.exp(-dt * 16));
  if (michael.moveAmt > 0.05) michael.walkPhase += dt * 11;
  else michael.walkPhase = 0;
}
function michaelHalfWidth(scale) {
  return (CONFIG.CHARACTER_HEIGHT * scale * (michaelSprite ? michaelSprite.aspect : 0.45)) / 2 + 4;
}

// Wandering for dragons, dinos and people
function wander(c, dt, area) {
  if (c.idle > 0) {
    c.idle -= dt; c.moving = false;
    if (c.idle <= 0) {
      // pick a new spot to walk to (others stay out of the grumpy dragon's corner)
      for (let tries = 0; tries < 10; tries++) {
        c.tx = rand(area.x1, area.x2); c.ty = rand(area.y1, area.y2);
        if (area === GRUMPY_AREA || c === grumpy || !inGrumpyCorner(c.tx, c.ty)) break;
      }
    }
    return;
  }
  const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
  if (d < 4) { c.idle = rand(1, 3.5); c.moving = false; return; }
  const s = Math.min(d, c.speed * dt);
  c.x += (dx / d) * s; c.y += (dy / d) * s;
  c.moving = true;
  if (Math.abs(dx) > 2) c.facing = dx > 0 ? 1 : -1;
  c.walkPhase += dt * 8;
}
function inGrumpyCorner(x, y) {
  return x > GRUMPY_AREA.x1 - 80 && x < GRUMPY_AREA.x2 + 80 && y > GRUMPY_AREA.y1 - 60 && y < GRUMPY_AREA.y2 + 60;
}
// Happy hops (two bounces)
// (also runs the pat / trick / dance animations)
function updateHop(c, dt) {
  c.lookUp = Math.max(0, (c.lookUp || 0) - dt);
  c.petT = Math.max(0, (c.petT || 0) - dt);
  c.spinT = Math.max(0, (c.spinT || 0) - dt);
  let jump = 0;
  if (c.happyT > 0) {
    c.happyT = Math.max(0, c.happyT - dt);
    jump = Math.abs(Math.sin((c.happyT / 0.7) * Math.PI)) * 24;
  }
  if (c.spinT > 0) jump = Math.max(jump, Math.sin((1 - c.spinT / 0.8) * Math.PI) * 30);
  if (c.danceT > 0) {
    c.danceT = Math.max(0, c.danceT - dt);
    jump = Math.max(jump, Math.abs(Math.sin(c.danceT * 9)) * 14);
    c.facing = Math.sin(c.danceT * 6) > 0 ? 1 : -1;
    if (Math.random() < dt * 4) addParticle({ type: 'note', x: c.x + rand(-30, 30), y: c.y - 90 * c.size, vx: rand(-20, 20), vy: -50, life: 1.4, color: pick(RAINBOW) });
  }
  if (c.trickT > 0) { // rainbow sparkle breath
    c.trickT = Math.max(0, c.trickT - dt);
    if (Math.random() < dt * 45) {
      const m = mouthPos(c);
      addParticle({ type: 'sparkle', x: m.x, y: m.y, vx: c.facing * rand(120, 240), vy: rand(-70, 10), size: rand(6, 11), color: pick(RAINBOW), life: 0.9, g: 40 });
    }
  }
  if (c.state !== 'popping') c.jump = jump;
}

function updateCreatures(dt) {
  for (const c of creatures) {
    if (c.happyT <= 0 && !isBusy(c)) wander(c, dt, WANDER_AREA);
    else c.moving = false;
    if (arrived(c, !michael.hidden && touching(c.x, c.y, 45 * c.size, 26 * c.size))) {
      c.happyT = 1.4;
      c.facing = michael.x > c.x ? 1 : -1;
      Sound.chirp(c.pitch);
      hearts(c.x, c.y - 75 * c.size, 5);
    }
    c.mouthOpen = c.happyT > 0 ? 1 : 0;
    updateHop(c, dt);
  }
}

function updatePeople(dt) {
  for (const p of people) {
    if (p.walker && p.waveT <= 0) wander(p, dt, WANDER_AREA);
    else p.moving = false;
    p.waveT = Math.max(0, p.waveT - dt);
    if (arrived(p, !michael.hidden && touching(p.x, p.y, 40, 24))) {
      p.waveT = 1.8;
      p.facing = michael.x > p.x ? 1 : -1;
      Sound.hello(p.pitch);
      addParticle({ type: 'note', x: p.x, y: p.y - 115, vx: rand(-15, 15), vy: -40, life: 1.4, color: pick(RAINBOW) });
      hearts(p.x, p.y - 110, 2);
    }
  }
}

function updateRockets(dt) {
  for (const r of rockets) {
    r.wobT += dt;
    if (arrived(r, !michael.hidden && touching(r.x, r.y, 55, 28))) {
      r.wobT = 0; // silly wobble, never launches
      Sound.boing(rand(0.85, 1.2));
      burst('sparkle', r.x, r.y - r.h * 0.6, 6, { colors: [r.colors.body, r.colors.nose, '#ffffff'], speed: 120 });
    }
  }
}

function updateWorldScene(dt) {
  const playing = game.mode !== 'menu' && !game.complete;
  if (playing && !game.flight) updateMichael(dt, { x1: 0, x2: WORLD_W, y1: GROUND_TOP, y2: WORLD_H - 6, halfWidth: michaelHalfWidth(1) });
  updateCreatures(dt);
  updatePeople(dt);
  updateRockets(dt);
  updateSkyButtons(dt);
  if (usesFood()) updateFoods(dt);
  updateHungryDragons(dt);
  updateGrumpy(dt);
  updateHideAndSeek(dt);
  updateParade(dt);
  updateFlight(dt);
  updateCamera(dt);
  updatePetting(dt);

  // walk to the house door to go inside (free play)
  if (playing && game.mode === 'free' && !game.flight && !game.fade && arrived(house, touching(house.x, house.y + 6, 42, 26))) enterHouse();
  // walk to the airplane to hop on
  if (playing && activityOn('plane') && !game.flight && !game.fade && arrived(plane, touching(plane.homeX, plane.homeY, 115, 45))) startFlight();
  // chimney smoke
  if (Math.random() < dt * 2) addParticle({ type: 'smoke', x: house.x + 71, y: house.y - 255, vx: rand(5, 20), vy: -30, size: 7, color: '#f3eefc', life: 2.2 });
}

function updateSky(dt) {
  const target = hexToRgb(game.skyTarget);
  const k = 1 - Math.exp(-dt * 3);
  game.skyRGB = game.skyRGB.map((v, i) => lerp(v, target[i], k));
  game.rainbow = lerp(game.rainbow, game.parade ? 1 : 0, 1 - Math.exp(-dt * 2));
  for (const c of clouds) {
    c.x += c.speed * dt;
    if (c.x > WORLD_W + 150) { c.x = -150; c.y = rand(35, 200); }
  }
  for (const s of snowflakes) {
    s.y += s.speed * dt;
    s.x += Math.sin(game.time * s.sway + s.phase) * 12 * dt;
    if (s.y > WORLD_H + 5) { s.y = -5; s.x = rand(0, WORLD_W); }
  }
}

function update(dt) {
  game.time += dt;
  updateTimeOfDay(dt);
  updateSky(dt);
  if (game.scene === 'world') updateWorldScene(dt);
  else {
    if (!game.fade) updateMichael(dt, { x1: 0, x2: WORLD_W, y1: 520, y2: WORLD_H - 4, halfWidth: michaelHalfWidth(CONFIG.HOUSE_CHARACTER_SCALE), speedScale: 1.2 });
    updateHouseScene(dt);
  }
  updateFinishing(dt);
  updateParticles(dt);
  updateFade(dt);
  // background music: starts after the first key press, quieter while songs play
  Music.start();
  Music.setLevel(game.parade || game.complete || game.scene === 'house' ? 0.3 : 1);
  game.shake = Math.max(0, game.shake - dt * 12);
  for (const k of ['skyPop', 'starPop', 'timePop']) game.hud[k] = Math.max(0, game.hud[k] - dt * 2.5);
}


/* =====================================================================
   10. DRAWING
   ===================================================================== */

// ---------- Michael ----------
function drawMichael(c, x, y, height, opts = {}) {
  const spr = michaelSprite;
  if (!spr) return;
  const bounce = opts.bounce !== undefined ? opts.bounce : Math.abs(Math.sin(michael.walkPhase)) * 8 * michael.moveAmt;
  const tilt = opts.tilt !== undefined ? opts.tilt : Math.sin(michael.walkPhase) * 0.07 * michael.moveAmt;
  const flip = opts.flip !== undefined ? opts.flip : michael.flipX;
  const breathe = 1 + Math.sin(game.time * 2.2) * 0.008;
  const w = height * spr.aspect;
  c.save();
  c.translate(x, y);
  if (!opts.noShadow) ellipse(c, 0, 0, w * 0.42, 8 * height / CONFIG.CHARACTER_HEIGHT, 'rgba(20,40,110,0.28)');
  c.translate(0, -bounce);
  c.rotate(tilt);
  c.scale(flip, breathe);
  const img = height > CONFIG.CHARACTER_HEIGHT * 1.2 ? spr.large : spr.small;
  c.imageSmoothingQuality = 'high';
  c.drawImage(img, -w * spr.anchorX, -height, w, height);
  c.restore();
}
function drawCarriedFood(c, x, y, height, list) {
  list.forEach((type, i) => {
    const bob = Math.sin(game.time * 3 + i * 0.8) * 2;
    drawFood(c, type, x + Math.sin(game.time * 2 + i) * 2, y - height - 16 - i * 24 + bob, 0.75);
  });
}

// ---------- Food pictures ----------
function drawFood(c, type, x, y, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = 'round';
  if (type === 'pancakes') {
    ellipse(c, 0, 13, 26, 8, '#ffffff');
    c.strokeStyle = '#b8c8e8'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 13, 26, 8, 0, 0, TAU); c.stroke();
    for (let i = 0; i < 3; i++) {
      ellipse(c, 0, 9 - i * 7, 20, 7, '#c9813a');
      ellipse(c, 0, 7 - i * 7, 20, 6, '#f2b45f');
    }
    c.fillStyle = '#8a4513'; // syrup
    c.beginPath(); c.ellipse(0, -8, 14, 4.5, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(10, -7); c.quadraticCurveTo(15, 0, 12, 6); c.quadraticCurveTo(9, 0, 6, -6); c.fill();
    roundRect(c, -5, -15, 10, 7, 2, '#fff27a', '#e6cc3a', 1.5); // butter
  } else if (type === 'grilledCheese') {
    // two toasted bread slices with melty cheese in the middle
    const slice = (dy, fill) => {
      c.beginPath();
      c.moveTo(-20, 10 + dy); c.lineTo(-20, -6 + dy);
      c.bezierCurveTo(-28, -10 + dy, -24, -22 + dy, -12, -20 + dy);
      c.quadraticCurveTo(0, -27 + dy, 12, -20 + dy);
      c.bezierCurveTo(24, -22 + dy, 28, -10 + dy, 20, -6 + dy);
      c.lineTo(20, 10 + dy); c.closePath();
      c.fillStyle = fill; c.fill();
      c.strokeStyle = '#a8641f'; c.lineWidth = 3.5; c.stroke();
    };
    slice(8, '#e9a646');
    c.fillStyle = '#ffd31a'; // cheese oozing out between the slices
    c.beginPath(); c.moveTo(-23, 10); c.lineTo(23, 10); c.lineTo(23, 16); c.quadraticCurveTo(14, 15, 12, 24);
    c.quadraticCurveTo(9, 15, 0, 17); c.quadraticCurveTo(-8, 15, -10, 22); c.quadraticCurveTo(-13, 15, -23, 16); c.closePath(); c.fill();
    slice(0, '#f4bd5c');
    c.strokeStyle = '#c47f2a'; c.lineWidth = 2.5; // grill marks
    for (const gx of [-10, 0, 10]) { c.beginPath(); c.moveTo(gx - 4, 4); c.lineTo(gx + 4, -12); c.stroke(); }
  } else if (type === 'pasta') {
    c.fillStyle = '#4fa8ff'; // bowl
    c.beginPath(); c.moveTo(-25, 0); c.quadraticCurveTo(-24, 22, 0, 22); c.quadraticCurveTo(24, 22, 25, 0); c.closePath(); c.fill();
    ellipse(c, 0, 0, 25, 7, '#ffffff');
    ellipse(c, 0, -2, 21, 9, '#ffd66b');
    c.strokeStyle = '#f5b83d'; c.lineWidth = 2.5; // noodle squiggles
    for (let i = -2; i <= 2; i++) {
      c.beginPath(); c.moveTo(i * 7 - 6, 2);
      c.bezierCurveTo(i * 7 - 2, -12, i * 7 + 3, 6, i * 7 + 6, -8); c.stroke();
    }
    ellipse(c, 0, -6, 11, 5, '#e8412c'); // sauce
    circle(c, -3, -9, 5, '#8a4b2a'); circle(c, 6, -7, 4.5, '#8a4b2a'); // meatballs
    ellipse(c, 1, -14, 4, 2, '#37b24d'); // basil
  } else if (type === 'pizza') {
    c.beginPath(); c.moveTo(-22, -14); c.lineTo(22, -14); c.lineTo(0, 22); c.closePath();
    c.fillStyle = '#ffd447'; c.fill(); c.strokeStyle = '#e6a92a'; c.lineWidth = 2; c.stroke();
    roundRect(c, -24, -21, 48, 11, 5.5, '#d98c3a', '#a8641f', 2);
    circle(c, -8, -4, 4.5, '#d6382d'); circle(c, 7, -3, 4.5, '#d6382d'); circle(c, 0, 8, 4, '#d6382d');
    ellipse(c, -2, 14, 2, 4, '#ffd447');
  }
  c.restore();
}
function drawFoodBubble(c, x, y, type, pop) {
  const s = 1 + pop * 0.35 * Math.sin(pop * Math.PI);
  const bob = Math.sin(game.time * 3) * 3;
  c.save();
  c.translate(x, y + bob);
  c.scale(s, s);
  circle(c, -22, 38, 6, '#ffffff');
  circle(c, -30, 50, 3.5, '#ffffff');
  circle(c, 0, 0, 33, '#ffffff');
  c.strokeStyle = '#9ec5ff'; c.lineWidth = 3;
  c.beginPath(); c.arc(0, 0, 33, 0, TAU); c.stroke();
  drawFood(c, type, 0, 0, 0.85);
  c.restore();
}

// ---------- Dragons and dinosaurs ----------
// Drawn facing right with feet at (0,0), then flipped/scaled. Cute on purpose: big head, big eyes.
function drawCreature(c, d, colorsOverride) {
  const t = game.time;
  const color = colorsOverride ? colorsOverride[0] : d.color;
  const belly = colorsOverride ? colorsOverride[1] : d.belly;
  const spikes = colorsOverride ? colorsOverride[2] : d.spikes;
  const line = shade(color, -0.4);
  const grumpyFace = d.mood === 'grumpy';
  c.save();
  c.translate(d.x, d.y);
  ellipse(c, 0, 0, 30 * d.size, 8 * d.size, 'rgba(20,40,110,0.22)');
  let stomp = 0;
  if (d.stompAnim > 0) stomp = Math.sin((1 - d.stompAnim / 0.35) * Math.PI) * 10;
  c.translate(0, -d.jump - stomp);
  if (d.danceT > 0) c.rotate(Math.sin(d.danceT * 10) * 0.12);
  c.scale(d.facing * d.size, d.size);
  if (d.spinT > 0) c.scale(Math.cos((1 - d.spinT / 0.8) * TAU), 1); // a little twirl
  const step = d.moving ? Math.sin(d.walkPhase) : 0;
  const bob = d.moving ? Math.abs(Math.cos(d.walkPhase)) * 2 : Math.sin(t * 2 + d.seed) * 0.8;
  c.lineWidth = 2.5; c.lineJoin = 'round'; c.lineCap = 'round';

  // tail
  c.save();
  c.translate(-20, -20 - bob);
  c.rotate(Math.sin(t * 3 + d.seed) * 0.15);
  c.beginPath(); c.moveTo(4, -11); c.quadraticCurveTo(-20, -8, -36, -26); c.quadraticCurveTo(-24, 2, 4, 9); c.closePath();
  c.fillStyle = color; c.fill(); c.strokeStyle = line; c.stroke();
  if (d.kind === 'dragon') {
    c.beginPath(); c.moveTo(-36, -26); c.lineTo(-44, -34); c.lineTo(-30, -33); c.closePath(); c.fillStyle = spikes; c.fill(); c.stroke();
  }
  c.restore();

  // far legs (a bit darker)
  const far = shade(color, -0.18);
  roundRect(c, -16, -16 - Math.max(0, -step) * 5, 12, 16, 5, far, line, 2);
  roundRect(c, 8, -16 - Math.max(0, step) * 5, 12, 16, 5, far, line, 2);

  // wings (dragons only), flapping gently
  if (d.kind === 'dragon') {
    c.save();
    c.translate(-4, -42 - bob);
    c.rotate(-0.2 + Math.sin(t * 5 + d.seed) * 0.25);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-8, -30, -30, -36);
    c.quadraticCurveTo(-24, -22, -28, -14); c.quadraticCurveTo(-18, -12, -18, -5); c.quadraticCurveTo(-9, -6, 0, 0); c.closePath();
    c.fillStyle = spikes; c.fill(); c.strokeStyle = line; c.stroke();
    c.restore();
  }

  // back spikes
  c.fillStyle = spikes; c.strokeStyle = line;
  for (let i = 0; i < 4; i++) {
    const sx = -17 + i * 10;
    const sy = -26 - bob - 21 * Math.sqrt(Math.max(0, 1 - (sx / 27) ** 2)) + 4;
    c.beginPath();
    if (d.kind === 'dino') { c.moveTo(sx - 6, sy + 2); c.quadraticCurveTo(sx, sy - 16, sx + 6, sy + 2); }
    else { c.moveTo(sx - 5, sy + 2); c.lineTo(sx, sy - 10); c.lineTo(sx + 5, sy + 2); }
    c.closePath(); c.fill(); c.stroke();
  }

  // body + head as one outlined shape (outline first, then fill on top)
  const parts = [[0, -26 - bob, 27, 21], [14, -38 - bob, 12, 14], [24, -52 - bob, 20, 19], [37, -47 - bob, 12, 10]];
  c.fillStyle = line;
  for (const [px, py, rx, ry] of parts) { c.beginPath(); c.ellipse(px, py, rx + 2.5, ry + 2.5, 0, 0, TAU); c.fill(); }
  // horns behind the head (dragons)
  if (d.kind === 'dragon') {
    for (const hx of [16, 29]) {
      c.beginPath(); c.moveTo(hx - 5, -64 - bob); c.lineTo(hx, -79 - bob); c.lineTo(hx + 5, -64 - bob); c.closePath();
      c.fillStyle = '#fff1c1'; c.fill(); c.strokeStyle = line; c.stroke();
    }
  }
  c.fillStyle = color;
  for (const [px, py, rx, ry] of parts) { c.beginPath(); c.ellipse(px, py, rx, ry, 0, 0, TAU); c.fill(); }
  // belly
  ellipse(c, 6, -22 - bob, 15, 13, belly);
  if (d.kind === 'dragon') {
    c.strokeStyle = shade(belly, -0.15); c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-6, -28 + i * 6 - bob); c.quadraticCurveTo(6, -25 + i * 6 - bob, 18, -28 + i * 6 - bob); c.stroke(); }
  } else {
    for (const [sx, sy, sr] of [[-14, -34, 4], [-6, -40, 3], [-18, -24, 3]]) circle(c, sx, sy - bob, sr, shade(color, 0.3));
  }

  // near legs
  roundRect(c, -12, -16 - Math.max(0, step) * 5, 13, 16, 5, color, line, 2);
  roundRect(c, 12, -16 - Math.max(0, -step) * 5, 13, 16, 5, color, line, 2);
  c.fillStyle = '#ffffff';
  for (const lx of [-8, 16]) circle(c, lx, -2 - (lx < 0 ? Math.max(0, step) : Math.max(0, -step)) * 5, 1.8, '#ffffff');

  // face
  const look = d.lookUp > 0 ? -2.5 : 0;
  const blink = (Math.sin(t * 0.9 + d.seed * 3) > 0.985) ? 0.15 : 1;
  if (d.petT > 0 && !grumpyFace) {
    // eyes closed happily while being patted  ^ ^
    c.strokeStyle = '#2b1d3a'; c.lineWidth = 2.5;
    for (const ex of [19, 31]) { c.beginPath(); c.arc(ex, -53 - bob, 5, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke(); }
  } else {
    for (const ex of [19, 31]) {
      c.save();
      c.translate(ex, -55 - bob);
      c.scale(1, blink);
      circle(c, 0, 0, 6.5, '#ffffff');
      circle(c, 1.6, 0.5 + look, 4, '#2b1d3a');
      circle(c, 2.8, -1.2 + look, 1.5, '#ffffff');
      c.restore();
    }
  }
  if (grumpyFace) {
    // heavy eyelids + cross eyebrows
    c.fillStyle = color;
    for (const ex of [19, 31]) { c.beginPath(); c.arc(ex, -55 - bob, 7, Math.PI, TAU); c.fill(); }
    c.strokeStyle = '#3d2f4d'; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(12, -64 - bob); c.lineTo(23, -59 - bob); c.stroke();
    c.beginPath(); c.moveTo(27, -59 - bob); c.lineTo(38, -64 - bob); c.stroke();
  } else {
    ellipse(c, 40, -45 - bob, 4.5, 3, 'rgba(255,110,150,0.55)'); // rosy cheek
  }
  circle(c, 45, -51 - bob, 1.4, line); circle(c, 41, -52 - bob, 1.4, line); // nostrils
  c.strokeStyle = '#3d2f4d'; c.lineWidth = 2.2;
  const mouth = Math.max(d.mouthOpen || 0, d.trickT > 0 || d.danceT > 0 || d.spinT > 0 ? 1 : 0);
  if (mouth > 0.5) {
    c.fillStyle = '#9b2c4a';
    c.beginPath(); c.ellipse(38, -42 - bob, 6, 4 * mouth + 1, 0, 0, Math.PI); c.closePath(); c.fill();
    ellipse(c, 38, -40 - bob + 2 * mouth, 3, 1.6, '#ff8fa8');
  } else if (grumpyFace) {
    c.beginPath(); c.arc(37, -38 - bob, 5, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
  } else {
    c.beginPath(); c.arc(37, -45 - bob, 5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  }
  c.restore();
}

// A dino hiding behind a tree: only a wiggly tail shows, and now and then it peeks out.
function drawHidingDino(c, d, tree) {
  const t = game.time, side = d.side;
  const line = shade(d.color, -0.4);
  c.save();
  c.translate(tree.x + side * 6, tree.y - 14);
  c.scale(side, 1);
  c.rotate(Math.sin(t * 4 + d.seed) * 0.25);
  c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(28, -14, 44, -34); c.quadraticCurveTo(36, -4, 0, 6); c.closePath();
  c.fillStyle = d.color; c.fill(); c.strokeStyle = line; c.lineWidth = 2.5; c.stroke();
  c.fillStyle = d.spikes;
  for (const sx of [16, 28]) { c.beginPath(); c.moveTo(sx - 4, -15 - (sx - 16) * 0.6); c.lineTo(sx + 2, -24 - (sx - 16) * 0.7); c.lineTo(sx + 5, -16 - (sx - 16) * 0.7); c.fill(); }
  c.restore();
  const ph = (t + d.seed) % 6;
  if (ph < 1.3) { // peek!
    const s = Math.sin((ph / 1.3) * Math.PI);
    const hx = tree.x - side * (48 + 24 * s), hy = tree.y - 92;
    c.save();
    c.translate(hx, hy);
    c.scale(-side, 1);
    circle(c, 0, 0, 19, line); circle(c, 0, 0, 17, d.color);
    circle(c, 4, -3, 6, '#ffffff'); circle(c, 5.5, -2.5, 3.6, '#2b1d3a'); circle(c, 6.5, -4, 1.3, '#fff');
    circle(c, -6, -3, 5, '#ffffff'); circle(c, -4.5, -2.5, 3, '#2b1d3a');
    c.restore();
  }
}

// ---------- Trees (red trunk, orange leaves) ----------
function drawTree(c, tree) {
  const t = game.time;
  c.save();
  c.translate(tree.x, tree.y);
  ellipse(c, 0, 3, 52, 12, 'rgba(20,40,110,0.22)');
  c.fillStyle = C.treeTrunk; c.strokeStyle = shade(C.treeTrunk, -0.4); c.lineWidth = 3;
  c.beginPath(); c.moveTo(-16, 0); c.quadraticCurveTo(-9, -22, -10, -75); c.lineTo(10, -75); c.quadraticCurveTo(9, -22, 16, 0); c.closePath();
  c.fill(); c.stroke();
  c.rotate(Math.sin(t * 1.2 + tree.seed) * 0.015 + Math.sin(t * 45) * 0.06 * tree.shake);
  const blobs = [[0, -84, 40], [-42, -102, 36], [42, -102, 36], [0, -128, 46], [-25, -158, 32], [25, -156, 32]];
  c.fillStyle = shade(C.treeLeaves, -0.3);
  for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(bx, by, r + 3, 0, TAU); c.fill(); }
  c.fillStyle = C.treeLeaves;
  for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(bx, by, r, 0, TAU); c.fill(); }
  c.fillStyle = C.treeLeavesLight;
  for (const [bx, by, r] of blobs) { c.beginPath(); c.arc(bx - r * 0.3, by - r * 0.3, r * 0.42, 0, TAU); c.fill(); }
  // snow on top
  for (const [bx, by, r] of [blobs[3], blobs[4], blobs[5], blobs[1], blobs[2]]) ellipse(c, bx, by - r * 0.72, r * 0.62, r * 0.3, '#ffffff');
  c.restore();
}

// ---------- Rockets (just decorations — they never fly) ----------
function drawRocket(c, r) {
  const h = r.h, w = h * 0.3, col = r.colors;
  const wob = Math.exp(-3 * r.wobT) * Math.sin(r.wobT * 13);
  c.save();
  c.translate(r.x, r.y);
  ellipse(c, 0, 2, w * 1.3, 11, 'rgba(20,40,110,0.25)');
  c.rotate(wob * 0.25);
  c.scale(1 + wob * 0.06, 1 - wob * 0.06);
  c.lineWidth = 3; c.lineJoin = 'round';
  const line = shade(col.body, -0.45);
  // side fins
  c.fillStyle = col.fin; c.strokeStyle = shade(col.fin, -0.4);
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(s * w * 0.45, -h * 0.4); c.quadraticCurveTo(s * w * 1.15, -h * 0.22, s * w * 1.05, 0); c.lineTo(s * w * 0.3, -h * 0.1); c.closePath();
    c.fill(); c.stroke();
  }
  // nozzle (no flames ever)
  roundRect(c, -w * 0.3, -h * 0.1, w * 0.6, h * 0.08, 4, '#8d99ae', '#5c677d', 2);
  // body
  const body = () => {
    c.beginPath(); c.moveTo(-w / 2, -h * 0.09); c.lineTo(-w / 2, -h * 0.62);
    c.quadraticCurveTo(-w / 2, -h * 0.92, 0, -h); c.quadraticCurveTo(w / 2, -h * 0.92, w / 2, -h * 0.62);
    c.lineTo(w / 2, -h * 0.09); c.quadraticCurveTo(0, -h * 0.05, -w / 2, -h * 0.09); c.closePath();
  };
  body(); c.fillStyle = col.body; c.fill();
  c.save(); body(); c.clip();
  c.fillStyle = col.nose; c.fillRect(-w, -h * 1.05, w * 2, h * 0.33);
  c.fillStyle = col.fin; c.fillRect(-w, -h * 0.3, w * 2, h * 0.06);
  c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(-w * 0.34, -h, w * 0.13, h);
  c.restore();
  body(); c.strokeStyle = line; c.stroke();
  // front fin
  c.beginPath(); c.ellipse(0, -h * 0.13, w * 0.09, h * 0.12, 0, 0, TAU); c.fillStyle = col.fin; c.fill(); c.strokeStyle = shade(col.fin, -0.4); c.stroke();
  // round window with a smiley face
  const wy = -h * 0.52, wr = w * 0.27;
  circle(c, 0, wy, wr + 3, '#ffffff');
  circle(c, 0, wy, wr, '#bfe6ff');
  c.strokeStyle = line; c.lineWidth = 2.5; c.beginPath(); c.arc(0, wy, wr + 3, 0, TAU); c.stroke();
  circle(c, -wr * 0.35, wy - wr * 0.15, wr * 0.13, '#2b1d3a'); circle(c, wr * 0.35, wy - wr * 0.15, wr * 0.13, '#2b1d3a');
  c.lineWidth = 2; c.beginPath(); c.arc(0, wy + wr * 0.05, wr * 0.42, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  // little star sticker
  c.fillStyle = '#ffffff'; starPath(c, 0, -h * 0.75, w * 0.12, w * 0.05, 5); c.fill();
  c.restore();
}

// ---------- The airplane ----------
// Drawn with its nose to the right at facing = 1. withMichael puts Michael in the open cockpit.
function drawAirplane(c, x, y, o) {
  c.save();
  c.translate(x, y);
  c.scale(o.facing, 1);
  c.rotate(o.tilt || 0);
  c.lineWidth = 3; c.lineJoin = 'round';
  const body = '#ffd23f', wing = '#ff4d6d', tail = '#3a86ff', line = '#b07d00';
  // wheels
  if (!o.flying) {
    c.strokeStyle = '#555'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-30, -30); c.lineTo(-30, -10); c.moveTo(40, -30); c.lineTo(40, -10); c.stroke();
    for (const wx of [-30, 40]) { circle(c, wx, -9, 10, '#333'); circle(c, wx, -9, 4, '#bbb'); }
  }
  // far wing
  ellipse(c, 0, -52, 60, 9, shade(wing, -0.25));
  // tail fin
  c.beginPath(); c.moveTo(-92, -58); c.lineTo(-118, -104); c.quadraticCurveTo(-106, -110, -95, -102); c.lineTo(-62, -62); c.closePath();
  c.fillStyle = tail; c.fill(); c.strokeStyle = shade(tail, -0.4); c.lineWidth = 3; c.stroke();
  ellipse(c, -104, -54, 26, 7, shade(wing, -0.1));
  // Michael in the cockpit (drawn before the body so the plane hides his legs)
  if (o.withMichael && michaelSprite) {
    drawMichael(c, 20, -38, 74, { bounce: Math.sin(game.time * 4) * 1.5, tilt: 0, flip: 1, noShadow: true });
  } else {
    roundRect(c, 8, -92, 22, 24, 6, '#6b4f9e');
  }
  // body
  const parts = [[-10, -50, 106, 27], [76, -50, 32, 28]];
  c.fillStyle = line;
  for (const [px, py, rx, ry] of parts) { c.beginPath(); c.ellipse(px, py, rx + 3, ry + 3, 0, 0, TAU); c.fill(); }
  c.fillStyle = body;
  for (const [px, py, rx, ry] of parts) { c.beginPath(); c.ellipse(px, py, rx, ry, 0, 0, TAU); c.fill(); }
  c.save();
  c.beginPath(); c.ellipse(-10, -50, 106, 27, 0, 0, TAU); c.clip();
  c.fillStyle = wing; c.fillRect(-120, -46, 240, 8);
  c.restore();
  // cockpit rim and windshield
  roundRect(c, -4, -80, 50, 9, 4.5, shade(body, -0.25), line, 2);
  c.beginPath(); c.moveTo(46, -78); c.lineTo(54, -100); c.lineTo(62, -100); c.lineTo(66, -74); c.closePath();
  c.fillStyle = 'rgba(190,230,255,0.75)'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.stroke();
  // passenger windows
  for (const wx of [-70, -46, -22]) { circle(c, wx, -56, 7.5, '#ffffff'); circle(c, wx, -56, 5.5, '#bfe6ff'); }
  // happy face on the nose
  ellipse(c, 84, -58, 8, 10, '#ffffff');
  circle(c, 86, -57, 5, '#2b1d3a'); circle(c, 87.5, -59, 1.8, '#ffffff');
  ellipse(c, 76, -42, 5, 3, 'rgba(255,110,150,0.6)');
  c.strokeStyle = '#2b1d3a'; c.lineWidth = 2.5;
  c.beginPath(); c.arc(90, -44, 7, 0.1 * Math.PI, 0.75 * Math.PI); c.stroke();
  // near wing
  ellipse(c, 2, -40, 62, 11, wing);
  c.strokeStyle = shade(wing, -0.4); c.lineWidth = 2.5; c.beginPath(); c.ellipse(2, -40, 62, 11, 0, 0, TAU); c.stroke();
  ellipse(c, -10, -43, 40, 3, 'rgba(255,255,255,0.35)');
  // propeller
  circle(c, 110, -50, 7, '#ff4d6d');
  const blade = Math.abs(Math.cos(plane.prop)) * 32;
  ellipse(c, 113, -50, 4, Math.max(3, blade), '#6b4f9e');
  if (o.flying) ellipse(c, 113, -50, 3, 32, 'rgba(255,255,255,0.35)');
  c.restore();
}

// ---------- People in winter coats ----------
function drawPerson(c, p) {
  const step = p.moving ? Math.sin(p.walkPhase) : 0;
  const bob = p.moving ? Math.abs(Math.cos(p.walkPhase)) * 2 : 0;
  c.save();
  c.translate(p.x, p.y);
  ellipse(c, 0, 0, 22, 6, 'rgba(20,40,110,0.25)');
  c.scale(0.9 * p.facing, 0.9);
  const coatLine = shade(p.coat, -0.4);
  // legs + boots
  roundRect(c, -12, -30 + step * 3, 10, 26, 4, '#3d4a7a');
  roundRect(c, 2, -30 - step * 3, 10, 26, 4, '#3d4a7a');
  roundRect(c, -15, -9 + step * 3, 15, 10, 4, '#5b3a29');
  roundRect(c, 0, -9 - step * 3, 15, 10, 4, '#5b3a29');
  // back arm
  roundRect(c, -27, -72 - bob, 11, 36, 5, shade(p.coat, -0.15), coatLine, 2);
  circle(c, -21, -36 - bob, 6, p.hat === '#ffffff' ? '#ff5d8f' : p.hat);
  // puffy coat
  roundRect(c, -21, -78 - bob, 42, 54, 14, p.coat, coatLine, 2.5);
  c.strokeStyle = shade(p.coat, 0.25); c.lineWidth = 2;
  for (const ly of [-62, -46]) { c.beginPath(); c.moveTo(-17, ly - bob); c.quadraticCurveTo(0, ly + 4 - bob, 17, ly - bob); c.stroke(); }
  for (const by of [-66, -54, -42]) circle(c, 0, by - bob, 2.2, '#ffffff');
  // front arm (waves when Michael says hi)
  c.save();
  c.translate(19, -70 - bob);
  if (p.waveT > 0) c.rotate(-2.5 + Math.sin(game.time * 14) * 0.4);
  roundRect(c, -5, -2, 11, 36, 5, p.coat, coatLine, 2);
  circle(c, 0.5, 34, 6.5, p.hat === '#ffffff' ? '#ff5d8f' : p.hat);
  c.restore();
  // scarf
  roundRect(c, -15, -82 - bob, 30, 9, 4.5, p.scarf);
  roundRect(c, 4, -78 - bob, 8, 20, 4, p.scarf);
  // head
  circle(c, 0, -96 - bob, 16, p.skin);
  circle(c, -5.5, -97 - bob, 2.2, '#2b1d3a'); circle(c, 5.5, -97 - bob, 2.2, '#2b1d3a');
  ellipse(c, -10, -91 - bob, 3.5, 2.2, 'rgba(255,110,130,0.5)'); ellipse(c, 10, -91 - bob, 3.5, 2.2, 'rgba(255,110,130,0.5)');
  c.strokeStyle = '#2b1d3a'; c.lineWidth = 2;
  c.beginPath(); c.arc(0, -92 - bob, p.waveT > 0 ? 6 : 4.5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  // hat
  if (p.hatStyle === 0) {
    c.fillStyle = p.hat; c.beginPath(); c.arc(0, -101 - bob, 16.5, Math.PI, TAU); c.fill();
    roundRect(c, -17.5, -104 - bob, 35, 8, 4, shade(p.hat === '#ffffff' ? '#dfe7ff' : p.hat, -0.15));
    circle(c, 0, -119 - bob, 6, p.hat === '#ffffff' ? '#ff5d8f' : '#ffffff');
  } else if (p.hatStyle === 1) {
    c.strokeStyle = shade(p.hat, -0.3); c.lineWidth = 3;
    c.beginPath(); c.arc(0, -98 - bob, 17, 1.05 * Math.PI, 1.95 * Math.PI); c.stroke();
    circle(c, -16, -96 - bob, 6.5, p.hat === '#ffffff' ? '#ff9ecb' : p.hat); circle(c, 16, -96 - bob, 6.5, p.hat === '#ffffff' ? '#ff9ecb' : p.hat);
    c.fillStyle = '#6b4226'; c.beginPath(); c.arc(0, -100 - bob, 16, 1.1 * Math.PI, 1.9 * Math.PI); c.fill();
  } else {
    roundRect(c, -18, -108 - bob, 36, 7, 3.5, '#3d3d5c');
    roundRect(c, -12, -128 - bob, 24, 22, 4, '#3d3d5c');
    roundRect(c, -12, -112 - bob, 24, 5, 2, p.scarf);
  }
  c.restore();
}

// ---------- The house (go in the door to watch TV) ----------
function drawHouse(c) {
  const t = game.time;
  const near = touching(house.x, house.y + 10, 130, 80) && !michael.hidden;
  c.save();
  c.translate(house.x, house.y);
  ellipse(c, 0, 4, 140, 14, 'rgba(20,40,110,0.22)');
  c.lineWidth = 3; c.lineJoin = 'round';
  // chimney
  roundRect(c, 55, -250, 32, 62, 3, '#e0533d', '#9b2c1f', 3);
  roundRect(c, 51, -258, 40, 12, 6, '#ffffff');
  // walls
  c.fillStyle = '#b57bff'; c.fillRect(-120, -170, 240, 170);
  c.strokeStyle = '#6b3fb5'; c.strokeRect(-120, -170, 240, 170);
  // roof with snow
  c.beginPath(); c.moveTo(-148, -165); c.lineTo(0, -262); c.lineTo(148, -165); c.closePath();
  c.fillStyle = '#ff5fa2'; c.fill(); c.strokeStyle = '#c2306f'; c.stroke();
  c.strokeStyle = '#ffffff'; c.lineWidth = 15; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-142, -170); c.lineTo(0, -256); c.lineTo(142, -170); c.stroke();
  c.lineCap = 'butt';
  c.fillStyle = '#e8f3ff';
  for (let ix = -114; ix < 114; ix += 14) { c.beginPath(); c.moveTo(ix, -166); c.lineTo(ix + 4, -154 - (Math.abs(ix) % 3) * 3); c.lineTo(ix + 8, -166); c.fill(); }
  // TV antenna
  c.strokeStyle = '#4a4a6a'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-40, -232); c.lineTo(-58, -290); c.moveTo(-40, -232); c.lineTo(-20, -292); c.stroke();
  circle(c, -58, -290, 4, '#ff4d6d'); circle(c, -20, -292, 4, '#ffd23f');
  // window with the TV glowing inside
  const glow = `hsl(${(t * 80) % 360}, 90%, 70%)`;
  roundRect(c, -102, -140, 60, 52, 6, glow, '#ffffff', 5);
  c.strokeStyle = '#ffffff'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-72, -140); c.lineTo(-72, -88); c.moveTo(-102, -114); c.lineTo(-42, -114); c.stroke();
  // window with curtains
  roundRect(c, 42, -140, 60, 52, 6, '#fff1a6', '#ffffff', 5);
  c.fillStyle = '#ff8fcf';
  c.beginPath(); c.moveTo(44, -138); c.quadraticCurveTo(60, -112, 48, -90); c.lineTo(44, -90); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(100, -138); c.quadraticCurveTo(84, -112, 96, -90); c.lineTo(100, -90); c.closePath(); c.fill();
  // flower boxes
  roundRect(c, -106, -88, 68, 10, 4, '#7ae582'); roundRect(c, 38, -88, 68, 10, 4, '#7ae582');
  // door (glows when Michael is close)
  if (near) ellipse(c, 0, -50, 52 + Math.sin(t * 6) * 4, 70, 'rgba(255,240,150,0.45)');
  c.beginPath(); c.moveTo(-32, 0); c.lineTo(-32, -78); c.arc(0, -78, 32, Math.PI, TAU); c.lineTo(32, 0); c.closePath();
  c.fillStyle = near ? '#ffe07a' : '#ffcf3f'; c.fill(); c.strokeStyle = '#a86a1f'; c.lineWidth = 3; c.stroke();
  circle(c, 0, -80, 11, '#bfe6ff');
  circle(c, 20, -40, 4, '#a86a1f');
  // snowflake decoration on the door
  c.strokeStyle = '#ffffff'; c.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3; c.beginPath(); c.moveTo(-Math.cos(a) * 8, -45 - Math.sin(a) * 8); c.lineTo(Math.cos(a) * 8, -45 + Math.sin(a) * 8); c.stroke(); }
  // welcome mat
  ellipse(c, 0, 10, 46, 10, '#ff9f1c');
  c.restore();
}

// ---------- Sky color buttons (hidden under little snow mounds) ----------
function drawSkyButton(c, b) {
  const t = game.time;
  const h = 8 * (1 - b.press * 0.7);
  ellipse(c, b.x, b.y + 3, 19, 8, 'rgba(20,40,110,0.25)');
  ellipse(c, b.x, b.y, 17, 8, shade(b.color, -0.4));
  c.fillStyle = shade(b.color, -0.15); c.fillRect(b.x - 14, b.y - h, 28, h);
  ellipse(c, b.x, b.y - h, 14, 7, b.color);
  ellipse(c, b.x - 4, b.y - h - 2, 5, 2.2, 'rgba(255,255,255,0.6)');
  if (b.mound > 0.01) {
    c.save();
    c.globalAlpha = b.mound;
    ellipse(c, b.x, b.y + 4, 28 * b.mound, 13 * b.mound, C.snowShadow);
    ellipse(c, b.x - 8, b.y - 1, 18 * b.mound, 11 * b.mound, C.snow);
    ellipse(c, b.x + 10, b.y, 17 * b.mound, 10 * b.mound, C.snow);
    ellipse(c, b.x + 1, b.y + 3, 24 * b.mound, 10 * b.mound, C.snow);
    c.restore();
  }
  // a little twinkle every few seconds so he can spot it
  const tw = (t + b.tw) % 3.5;
  if (tw < 0.6) {
    const s = Math.sin((tw / 0.6) * Math.PI) * 9;
    c.save(); c.translate(b.x + 9, b.y - 14); c.rotate(t * 2);
    c.fillStyle = b.found ? '#ffffff' : b.color; starPath(c, 0, 0, s, s * 0.3, 4); c.fill();
    c.restore();
  }
}

// ---------- Sky, sun, moon, clouds, rainbow ----------
function drawSky(c) {
  const sky = rgbToHex(game.skyRGB);
  const g = c.createLinearGradient(0, 0, 0, HORIZON_Y + 20);
  g.addColorStop(0, mixColor(sky, '#000000', 0.12));
  g.addColorStop(1, mixColor(sky, '#ffffff', 0.25));
  c.fillStyle = g;
  c.fillRect(0, 0, WORLD_W, WORLD_H);
  if (game.rainbow > 0.01) {
    c.save();
    c.globalAlpha = game.rainbow;
    const rg = c.createLinearGradient(0, 0, 0, HORIZON_Y + 20);
    RAINBOW.forEach((col, i) => rg.addColorStop(i / (RAINBOW.length - 1), shade(col, 0.25)));
    c.fillStyle = rg;
    c.fillRect(0, 0, WORLD_W, WORLD_H);
    c.restore();
  }
}
function drawSkyThings(c) {
  const t = game.time;
  // stars at night
  if (game.night > 0.05) {
    for (const s of nightStars) {
      c.globalAlpha = game.night * (0.5 + 0.5 * Math.sin(t * 2 + s.p));
      circle(c, s.x, s.y, s.r, '#fffbe0');
    }
    c.globalAlpha = 1;
  }
  // sun
  c.save();
  c.translate(game.sunX, game.sunY);
  c.rotate(t * 0.2);
  c.fillStyle = 'rgba(255,240,150,0.5)';
  starPath(c, 0, 0, 62, 44, 12); c.fill();
  c.restore();
  circle(c, game.sunX, game.sunY, 40, '#fff27a');
  circle(c, game.sunX - 12, game.sunY - 4, 4, '#c98b00'); circle(c, game.sunX + 12, game.sunY - 4, 4, '#c98b00');
  c.strokeStyle = '#c98b00'; c.lineWidth = 3; c.beginPath(); c.arc(game.sunX, game.sunY + 4, 13, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
  // moon
  if (game.night > 0.05) {
    c.save();
    c.globalAlpha = game.night;
    circle(c, 1180, 95, 46, 'rgba(255,248,214,0.3)');
    circle(c, 1180, 95, 38, '#fff8d6');
    circle(c, 1196, 78, 6, '#efe3b5'); circle(c, 1162, 116, 4, '#efe3b5');
    circle(c, 1168, 92, 3.5, '#8a7a4a'); circle(c, 1192, 92, 3.5, '#8a7a4a');
    c.strokeStyle = '#8a7a4a'; c.lineWidth = 2.5; c.beginPath(); c.arc(1180, 100, 9, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    c.restore();
  }
  // rainbow arc during the parade
  if (game.rainbow > 0.01) {
    c.save();
    c.globalAlpha = game.rainbow * 0.85;
    c.lineWidth = 16;
    RAINBOW.slice(0, 6).forEach((col, i) => {
      c.strokeStyle = col;
      c.beginPath(); c.arc(720, HORIZON_Y + 40, 470 - i * 16, Math.PI, TAU); c.stroke();
    });
    c.restore();
  }
  for (const cl of clouds) drawCloud(c, cl.x, cl.y, cl.s, 1);
}
function drawCloud(c, x, y, s, alpha) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.scale(s, s);
  const puffs = [[-40, 6, 26], [-14, -10, 32], [18, -6, 28], [42, 8, 22], [0, 10, 28]];
  for (const [px, py, r] of puffs) circle(c, px, py, r, C.clouds);
  for (const [px, py, r] of puffs) circle(c, px - r * 0.2, py - r * 0.25, r * 0.6, C.cloudHighlight);
  c.restore();
}

// ---------- The whole outdoor world ----------
function drawWorld(c) {
  const cam = game.camera;
  drawSky(c);
  c.save();
  // camera (zooms in to follow the airplane)
  c.translate(WORLD_W / 2, WORLD_H / 2);
  c.scale(cam.zoom, cam.zoom);
  c.translate(-cam.x, -cam.y);
  if (game.shake > 0) c.translate(rand(-1, 1) * game.shake, rand(-1, 1) * game.shake);

  drawSkyThings(c);
  c.drawImage(backgroundLayer, 0, 0, WORLD_W, WORLD_H);

  // things lying flat on the ground
  if (activityOn('sky')) for (const b of skyButtons) drawSkyButton(c, b);

  // everything that stands up is drawn back-to-front (higher on screen = further away)
  const list = [];
  for (const tree of trees) list.push({ y: tree.y, draw: () => {
    const hider = activityOn('seek') && seek.dinos.find((d) => d.state === 'hidden' && d.tree === trees.indexOf(tree));
    if (hider) drawHidingDino(c, hider, tree);
    drawTree(c, tree);
  } });
  for (const r of rockets) list.push({ y: r.y, draw: () => drawRocket(c, r) });
  for (const cr of creatures) list.push({ y: cr.y, draw: () => drawCreature(c, cr) });
  for (const d of hungryDragons) list.push({ y: d.y, draw: () => drawCreature(c, d) });
  if (activityOn('seek')) for (const d of seek.dinos) if (d.state !== 'hidden') list.push({ y: d.y, draw: () => drawCreature(c, d) });
  list.push({ y: grumpy.y, draw: () => drawCreature(c, grumpy, grumpyColors()) });
  for (const p of people) list.push({ y: p.y, draw: () => drawPerson(c, p) });
  for (const f of foods) list.push({ y: f.y, draw: () => {
    const s = smooth(f.appear);
    ellipse(c, f.x, f.y, 20 * s, 6 * s, 'rgba(20,40,110,0.22)');
    drawFood(c, f.type, f.x, f.y - 22 + Math.sin(game.time * 2.5 + f.seed) * 4, s);
  } });
  list.push({ y: house.y, draw: () => drawHouse(c) });
  if (plane.alt < 1) list.push({ y: plane.y, draw: () => drawAirplane(c, plane.x, plane.y, { facing: plane.facing, withMichael: game.flight && game.flight.phase === 'flying' }) });
  if (game.parade) for (const d of game.parade.dragons) list.push({ y: d.y, draw: () => drawParadeDragon(c, d) });
  if (!game.flight && !michael.hidden) list.push({ y: michael.y, draw: () => {
    drawMichael(c, michael.x, michael.y, CONFIG.CHARACTER_HEIGHT);
    drawCarriedFood(c, michael.x, michael.y, CONFIG.CHARACTER_HEIGHT, michael.carry);
  } });
  list.sort((a, b) => a.y - b.y);
  for (const item of list) item.draw();

  // food wish bubbles always on top
  if (activityOn('feed')) for (const d of hungryDragons) if (d.state === 'waiting' || d.state === 'catching') drawFoodBubble(c, d.x + d.facing * 10, d.y - 135, d.want, d.bubblePop);
  if (activityOn('grumpy') && (grumpy.state === 'grumpy' || grumpy.state === 'catching')) drawFoodBubble(c, grumpy.x + 20, grumpy.y - 175, grumpy.want, grumpy.bubblePop);

  // flying food
  for (const f of flyingFoods) {
    const k = smooth(Math.min(1, f.t / f.dur)), to = f.to();
    drawFood(c, f.type, lerp(f.x0, to.x, k), lerp(f.y0, to.y, k) - Math.sin(k * Math.PI) * f.arc, 0.8);
  }

  drawFlightLayer(c);
  drawParticles(c);
  drawPatHand(c);
  drawPetPrompt(c);
  drawGuideArrow(c);
  c.restore();

  // night: a soft purple dusk over everything
  if (game.night > 0.01) {
    c.fillStyle = `rgba(50, 30, 110, ${0.28 * game.night})`;
    c.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  // falling snow (in front of everything)
  c.fillStyle = '#ffffff';
  for (const s of snowflakes) { c.globalAlpha = 0.85; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
  // big clouds rushing past during the airplane ride
  if (game.flight) for (const cl of game.flight.clouds) drawCloud(c, cl.x, cl.y, cl.s, 0.8);
}
function grumpyColors() {
  const g = grumpy, a = C.grumpyDragon, b = C.happyDragon;
  if (g.moodMix <= 0) return a;
  if (g.moodMix >= 1) return b;
  return [mixColor(a[0], b[0], g.moodMix), mixColor(a[1], b[1], g.moodMix), mixColor(a[2], b[2], g.moodMix)];
}
function drawParadeDragon(c, d) {
  // balloon on a string
  const bx = d.x - 10 + Math.sin(game.time * 2 + d.seed) * 6, by = d.y - 150 - d.jump;
  c.strokeStyle = '#ffffff'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(d.x + 10, d.y - 60 - d.jump); c.quadraticCurveTo(bx + 10, by + 50, bx, by + 24); c.stroke();
  ellipse(c, bx, by, 18, 22, d.balloon);
  ellipse(c, bx - 6, by - 8, 5, 7, 'rgba(255,255,255,0.5)');
  drawCreature(c, d);
}
function drawFlightLayer(c) {
  const f = game.flight;
  if (!f) return;
  if (f.phase === 'flying' && plane.alt >= 1) {
    // shadow on the ground, then the plane up in the air
    const s = 1 - plane.alt / 400;
    ellipse(c, plane.x, plane.y, 90 * s, 14 * s, 'rgba(20,40,110,0.25)');
    drawAirplane(c, plane.x, plane.y - plane.alt, { facing: plane.facing, tilt: plane.tilt, withMichael: true, flying: true });
  }
  if (f.phase === 'boarding' || f.phase === 'landing') {
    // Michael hops on / off
    const k = smooth(Math.min(1, f.bt / 0.7));
    const seat = { x: plane.homeX + plane.facing * 20, y: plane.homeY - 38 };
    const ground = f.phase === 'boarding' ? { x: f.fromX, y: f.fromY } : { x: plane.homeX - 170, y: plane.homeY + 75 };
    const a = f.phase === 'boarding' ? ground : seat, b = f.phase === 'boarding' ? seat : ground;
    const h = f.phase === 'boarding' ? lerp(CONFIG.CHARACTER_HEIGHT, 74, k) : lerp(74, CONFIG.CHARACTER_HEIGHT, k);
    drawMichael(c, lerp(a.x, b.x, k), lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 90, h, { bounce: 0, tilt: Math.sin(k * Math.PI) * 0.3, noShadow: true });
  }
}

// ---------- Pat bubble, patting hand, guide arrow ----------
function drawHand(c, x, y, s, rot) {
  const skin = '#f6c3a0', line = '#c98b6a';
  c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s);
  for (let i = 0; i < 4; i++) roundRect(c, -15 + i * 8, -27 + (i === 0 || i === 3 ? 4 : 0), 7, 20, 3.5, skin, line, 2);
  c.save(); c.translate(-16, -2); c.rotate(-0.8); roundRect(c, -3.5, -13, 7, 16, 3.5, skin, line, 2); c.restore();
  roundRect(c, -16, -12, 31, 22, 9, skin, line, 2);
  c.restore();
}
function drawSpaceKey(c, x, y, s) {
  roundRect(c, x - 30 * s, y - 9 * s, 60 * s, 18 * s, 6 * s, '#ffffff', '#3a86ff', 3);
  c.fillStyle = '#3a86ff'; c.fillRect(x - 14 * s, y + 1 * s, 28 * s, 3 * s);
}
function drawDownArrow(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(-14, -34); c.lineTo(14, -34); c.lineTo(14, -10); c.lineTo(30, -10); c.lineTo(0, 22); c.lineTo(-30, -10); c.lineTo(-14, -10); c.closePath();
  c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.lineJoin = 'round'; c.stroke();
  c.restore();
}
// The bubble that pops up over the dragon or dino Michael is next to: "press SPACE to pat"
function drawPetPrompt(c) {
  const cr = game.petTarget;
  if (!cr) return;
  const p = promptPos(cr), s = 1 + Math.sin(game.time * 6) * 0.05;
  c.save(); c.translate(p.x, p.y + Math.sin(game.time * 4) * 4); c.scale(s, s);
  circle(c, 0, 0, 28, '#ffffff');
  c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 28, 0, TAU); c.stroke();
  drawHand(c, 0, 9, 0.8, Math.sin(game.time * 8) * 0.15);
  drawSpaceKey(c, 0, 44, 0.9);
  c.restore();
}
function drawPatHand(c) {
  const p = game.patAnim;
  if (!p) return;
  const cr = p.c, bob = Math.abs(Math.sin(p.t * 3 * Math.PI)) * 14;
  c.save();
  c.globalAlpha = p.t < 0.85 ? 1 : (1 - p.t) / 0.15;
  drawHand(c, cr.x + cr.facing * 22 * cr.size, cr.y - cr.jump - 82 * cr.size - 10 - bob, 1, Math.PI * 0.95);
  c.restore();
}
// A bouncing arrow that shows where to go next (only when it helps)
function drawGuideArrow(c) {
  if (game.flight || game.complete || game.mode === 'menu') return;
  let target = null;
  if (game.mode === 'plane') target = { x: plane.homeX - 20, y: plane.homeY - 135 };
  if (activityOn('feed')) for (const d of hungryDragons) if (d.state === 'waiting' && michael.carry.includes(d.want)) target = { x: d.x + d.facing * 10, y: d.y - 200 };
  if (activityOn('grumpy') && grumpy.state === 'grumpy' && michael.carry.includes(grumpy.want)) target = { x: grumpy.x + 20, y: grumpy.y - 240 };
  if (target) drawDownArrow(c, target.x, target.y - Math.abs(Math.sin(game.time * 4)) * 14, 1);
}

// ---------- The menu: 6 big picture cards (no reading needed) ----------
function menuCardRect(i) {
  const w = 340, h = 240, col = i % 3, row = Math.floor(i / 3);
  return { x: 170 + col * (w + 40), y: 225 + row * (h + 45), w, h };
}
// little creatures that live on the cards
const cardCritters = {
  seek: Object.assign(makeCreature('dino', C.dinos[1], 0, 0, 1.3), { facing: -1 }),
  feed: Object.assign(makeCreature('dragon', C.dragons[5], 0, 0, 1.25), { facing: 1 }),
  grumpy: Object.assign(makeCreature('dragon', C.grumpyDragon, 0, 0, 1.0), { facing: 1, mood: 'grumpy' }),
  happy: Object.assign(makeCreature('dragon', C.happyDragon, 0, 0, 1.0), { facing: -1, mouthOpen: 1 }),
  free: Object.assign(makeCreature('dino', C.dinos[2], 0, 0, 0.9), { facing: -1 }),
};
function drawMenu(c) {
  const t = game.time;
  c.fillStyle = 'rgba(29, 47, 107, 0.45)';
  c.fillRect(0, 0, WORLD_W, WORLD_H);
  // Michael flying his airplane across the top
  const facing = Math.cos(t * 0.45) >= 0 ? 1 : -1;
  c.save();
  c.translate(720 + Math.sin(t * 0.45) * 430, 160 + Math.sin(t * 1.7) * 8);
  c.scale(0.85, 0.85);
  drawAirplane(c, 0, 0, { facing, tilt: Math.sin(t * 1.7) * 0.06, withMichael: true, flying: true });
  c.restore();
  MENU_CARDS.forEach((mode, i) => drawMenuCard(c, i, mode, i === game.menuIndex));
}
function drawMenuCard(c, i, mode, selected) {
  const r = menuCardRect(i), t = game.time;
  const pop = selected ? 1.06 + Math.sin(t * 4) * 0.015 : 1;
  c.save();
  c.translate(r.x + r.w / 2, r.y + r.h / 2);
  c.scale(pop, pop);
  roundRect(c, -r.w / 2 + 6, -r.h / 2 + 10, r.w, r.h, 30, 'rgba(10, 20, 60, 0.35)');
  c.save();
  roundRectPath(c, -r.w / 2, -r.h / 2, r.w, r.h, 30); c.clip();
  drawCardScene(c, mode, r.w, r.h);
  if (!selected) { c.fillStyle = 'rgba(29, 47, 107, 0.2)'; c.fillRect(-r.w / 2, -r.h / 2, r.w, r.h); }
  c.restore();
  roundRect(c, -r.w / 2, -r.h / 2, r.w, r.h, 30, null, selected ? '#ffd23f' : '#ffffff', selected ? 10 : 5);
  c.restore();
  if (selected) {
    drawDownArrow(c, r.x + r.w / 2, r.y - 30 - Math.abs(Math.sin(t * 4)) * 10, 0.9);
    drawSpaceKey(c, r.x + r.w / 2, r.y + r.h + 26, 1.4);
  }
}
function drawCardScene(c, mode, w, h) {
  const t = game.time, bottom = h / 2;
  const scene = (skyColor) => {
    const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, mixColor(skyColor, '#000000', 0.08)); g.addColorStop(1, mixColor(skyColor, '#ffffff', 0.3));
    c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h);
    c.fillStyle = C.grassTop; c.fillRect(-w / 2, bottom - 70, w, 70);
    ellipse(c, -95, bottom - 45, 55, 10, C.snow); ellipse(c, 105, bottom - 18, 45, 8, C.snow);
  };
  const snow = () => { for (let i = 0; i < 14; i++) circle(c, ((i * 53 + t * 12) % w) - w / 2, ((i * 37 + t * 35) % h) - h / 2, 2.2, '#ffffff'); };
  const critter = (d, x, y, colors) => { d.x = x; d.y = y; d.walkPhase = t * 8; drawCreature(c, d, colors); };

  if (mode === 'sky') {            // Sky Color Hunt: the sky keeps changing color
    const list = CONFIG.SKY_BUTTONS, k = (t / 1.3) % list.length, i = Math.floor(k);
    scene(mixColor(list[i], list[(i + 1) % list.length], smooth(k - i)));
    c.lineWidth = 9;
    RAINBOW.slice(0, 6).forEach((col, j) => { c.strokeStyle = col; c.beginPath(); c.arc(0, 40, 125 - j * 9, Math.PI, TAU); c.stroke(); });
    list.forEach((color, j) => drawSkyButton(c, { x: -120 + j * 60, y: bottom - 30, color, press: j === i ? 0.6 : 0, mound: 0, found: true, tw: j }));
  } else if (mode === 'seek') {    // Hide and Seek: a dino peeks out from behind a tree
    scene(C.sky);
    c.save(); c.translate(-20, bottom - 25); c.scale(0.62, 0.62);
    critter(cardCritters.seek, 70 + Math.max(0, Math.sin(t * 1.6)) * 55, 0);
    drawTree(c, { x: 0, y: 0, seed: 0, shake: 0 });
    c.restore();
    for (let j = 0; j < 3; j++) {
      c.save(); c.translate(-125 + j * 40, -h / 2 + 32); c.rotate(Math.sin(t * 3 + j) * 0.15);
      starPath(c, 0, 0, 16, 7, 5); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = '#e09b00'; c.lineWidth = 2.5; c.stroke();
      c.restore();
    }
  } else if (mode === 'feed') {    // Feed the Dragons: a dragon wishing for food
    scene(C.sky);
    ellipse(c, -20, bottom - 30, 115, 24, '#ff5d6c');
    for (let j = 0; j < 6; j++) circle(c, -95 + j * 30, bottom - 30 + (j % 2 ? 8 : -8), 5, '#ffffff');
    cardCritters.feed.mouthOpen = Math.sin(t * 3) > 0 ? 1 : 0;
    critter(cardCritters.feed, -45, bottom - 32);
    drawFoodBubble(c, 85, -40, FOOD_TYPES[Math.floor(t / 1.5) % 4], 0);
  } else if (mode === 'grumpy') {  // Cheer Up the Grumpy Dragon: grumpy -> happy
    scene(C.sky);
    critter(cardCritters.grumpy, -95, bottom - 30, C.grumpyDragon);
    for (let j = 0; j < 3; j++) {
      const k = (t * 0.6 + j / 3) % 1;
      c.globalAlpha = 1 - k; circle(c, -52 + k * 20, -10 - k * 60, 6 + k * 8, '#b8b2c4'); c.globalAlpha = 1;
    }
    c.save(); c.translate(0, -5 + Math.sin(t * 3) * 3);
    c.beginPath(); c.moveTo(-26, -8); c.lineTo(6, -8); c.lineTo(6, -22); c.lineTo(30, 0); c.lineTo(6, 22); c.lineTo(6, 8); c.lineTo(-26, 8); c.closePath();
    c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.stroke();
    c.restore();
    cardCritters.happy.jump = Math.abs(Math.sin(t * 4)) * 10;
    critter(cardCritters.happy, 100, bottom - 30, C.happyDragon);
    c.save(); c.translate(100, -75 - Math.abs(Math.sin(t * 2)) * 10); c.fillStyle = '#ff4d8d'; heartPath(c, 26); c.fill(); c.restore();
  } else if (mode === 'plane') {   // Airplane Ride
    scene(C.sky);
    for (let j = 0; j < 3; j++) drawCloud(c, (((j * 150 - t * 60) % (w + 200)) + w + 200) % (w + 200) - w / 2 - 100, -70 + j * 40, 0.55, 1);
    for (let j = 0; j < 4; j++) {
      const tx = (((j * 110 - t * 90) % (w + 60)) + w + 60) % (w + 60) - w / 2 - 30;
      c.fillStyle = C.treeTrunk; c.fillRect(tx - 3, bottom - 50, 6, 18);
      circle(c, tx, bottom - 58, 15, C.treeLeaves);
    }
    c.save(); c.translate(0, 10 + Math.sin(t * 2) * 10); c.scale(0.72, 0.72);
    drawAirplane(c, 0, 50, { facing: 1, tilt: Math.sin(t * 2) * 0.08, withMichael: true, flying: true });
    c.restore();
    snow();
  } else {                         // Free play: Michael strolling around town
    scene(C.sky);
    c.save(); c.translate(-118, bottom - 22); c.scale(0.55, 0.55);
    drawRocket(c, { x: 0, y: 0, h: 210, colors: C.rockets[0], wobT: 99 });
    c.restore();
    cardCritters.free.moving = true;
    critter(cardCritters.free, 112, bottom - 24);
    const flip = Math.cos(t * 0.8) >= 0 ? 1 : -1;
    drawMichael(c, Math.sin(t * 0.8) * 45, bottom - 18, 165, { bounce: Math.abs(Math.sin(t * 9)) * 6, tilt: Math.sin(t * 9) * 0.06, flip });
    snow();
  }
}

// ---------- "You did it!" ----------
function drawComplete(c) {
  const t = game.complete.t, k = smooth(Math.min(1, t / 0.6));
  c.fillStyle = `rgba(255, 240, 200, ${0.35 * k})`;
  c.fillRect(0, 0, WORLD_W, WORLD_H);
  // sun rays
  c.save(); c.translate(860, 390); c.rotate(t * 0.4); c.globalAlpha = 0.5 * k;
  for (let i = 0; i < 16; i++) {
    c.fillStyle = i % 2 ? '#fff27a' : '#ffffff';
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 1000, (i * TAU) / 16, ((i + 1) * TAU) / 16); c.closePath(); c.fill();
  }
  c.restore();
  // a big smiling star
  c.save(); c.translate(860, 380);
  const s = k * (1 + Math.sin(t * 4) * 0.04);
  c.scale(Math.max(0.01, s), Math.max(0.01, s)); c.rotate(Math.sin(t * 2) * 0.06);
  starPath(c, 0, 0, 175, 85, 5);
  c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = '#e09b00'; c.lineWidth = 10; c.lineJoin = 'round'; c.stroke();
  circle(c, -32, -12, 11, '#2b1d3a'); circle(c, 32, -12, 11, '#2b1d3a');
  circle(c, -28, -16, 4, '#ffffff'); circle(c, 36, -16, 4, '#ffffff');
  ellipse(c, -56, 14, 14, 9, 'rgba(255,110,150,0.5)'); ellipse(c, 56, 14, 14, 9, 'rgba(255,110,150,0.5)');
  c.strokeStyle = '#2b1d3a'; c.lineWidth = 8; c.lineCap = 'round';
  c.beginPath(); c.arc(0, 10, 34, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  c.restore();
  // Michael jumping for joy
  drawMichael(c, 470, 720, Math.max(1, 330 * k), { bounce: Math.abs(Math.sin(t * 5)) * 30, tilt: Math.sin(t * 5) * 0.06, flip: 1 });
}

// ---------- Inside the house ----------
function drawHouseInside(c) {
  const t = game.time;
  // wallpaper
  c.fillStyle = '#ffe8b0'; c.fillRect(0, 0, WORLD_W, 480);
  c.fillStyle = '#ffd98a';
  for (let x = 0; x < WORLD_W; x += 60) c.fillRect(x, 0, 28, 480);
  for (let x = 30; x < WORLD_W; x += 120) for (let y = 40; y < 440; y += 90) { c.fillStyle = '#ff9ecb'; starPath(c, x + 14, y, 8, 3.5, 5); c.fill(); }
  c.fillStyle = '#c77dff'; c.fillRect(0, 440, WORLD_W, 40);
  // wooden floor
  c.fillStyle = '#d9975a'; c.fillRect(0, 480, WORLD_W, WORLD_H - 480);
  c.strokeStyle = '#b97a42'; c.lineWidth = 2;
  for (let y = 520; y < WORLD_H; y += 44) { c.beginPath(); c.moveTo(0, y); c.lineTo(WORLD_W, y); c.stroke(); }
  // rainbow rug
  RAINBOW.slice(0, 6).forEach((col, i) => ellipse(c, 720, 640, 330 - i * 40, 100 - i * 13, col));
  // window showing the snowy world outside
  c.save();
  roundRectPath(c, 110, 90, 220, 190, 10); c.clip();
  c.fillStyle = rgbToHex(game.skyRGB); c.fillRect(110, 90, 220, 190);
  c.fillStyle = C.grassTop; c.fillRect(110, 230, 220, 50);
  ellipse(c, 170, 240, 40, 8, '#ffffff');
  drawCloud(c, 180 + Math.sin(t * 0.3) * 30, 140, 0.6, 1);
  c.fillStyle = '#ffffff';
  for (let i = 0; i < 18; i++) { const sx = 110 + ((i * 53 + t * 15) % 220), sy = 90 + ((i * 37 + t * 40) % 190); c.beginPath(); c.arc(sx, sy, 2.5, 0, TAU); c.fill(); }
  c.restore();
  roundRect(c, 110, 90, 220, 190, 10, null, '#ffffff', 10);
  c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.moveTo(220, 90); c.lineTo(220, 280); c.moveTo(110, 185); c.lineTo(330, 185); c.stroke();
  c.fillStyle = '#ff8fcf';
  c.beginPath(); c.moveTo(95, 80); c.quadraticCurveTo(140, 180, 100, 300); c.lineTo(80, 300); c.lineTo(80, 80); c.fill();
  c.beginPath(); c.moveTo(345, 80); c.quadraticCurveTo(300, 180, 340, 300); c.lineTo(360, 300); c.lineTo(360, 80); c.fill();
  // picture of a dragon on the wall
  roundRect(c, 1090, 110, 170, 140, 8, '#bfe6ff', '#ff9f1c', 10);
  drawCreature(c, { kind: 'dragon', x: 1170, y: 230, size: 1.1, facing: 1, color: C.dragons[0][0], belly: C.dragons[0][1], spikes: C.dragons[0][2], moving: false, walkPhase: 0, jump: 0, mouthOpen: 1, seed: 1, mood: 'happy' });
  // plant
  roundRect(c, 1340, 380, 50, 60, 8, '#ff6b35', '#c2410c', 3);
  for (let i = 0; i < 5; i++) ellipse(c, 1365 + Math.cos(i * 1.2 - 2.4) * 22, 365 + Math.sin(i * 1.2 - 2.4) * 30, 12, 24, '#37b24d');
  // TV cabinet + TV
  roundRect(c, 470, 395, 500, 85, 12, '#9b5de5', '#6b3fb5', 4);
  circle(c, 600, 437, 7, '#ffd23f'); circle(c, 840, 437, 7, '#ffd23f');
  c.strokeStyle = '#4a4a6a'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(720, 100); c.lineTo(660, 30); c.moveTo(720, 100); c.lineTo(785, 25); c.stroke();
  circle(c, 660, 30, 7, '#ff4d6d'); circle(c, 785, 25, 7, '#7ae582');
  roundRect(c, 500, 100, 440, 290, 24, '#3b3b58', '#22223a', 5);
  const sx = 525, sy = 122, sw = 390, sh = 246;
  c.save();
  roundRectPath(c, sx, sy, sw, sh, 14); c.clip();
  c.translate(sx, sy);
  if (tv.staticT > 0) drawTVStatic(c, sw, sh);
  else drawTVShow(c, tv.channel, t, sw, sh);
  c.restore();
  // screen shine
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 140, sy); c.lineTo(sx, sy + 120); c.closePath(); c.fill();
  // a big comfy couch (side view)
  roundRect(c, 1070, 470, 260, 60, 20, '#ff5d8f', '#c2306f', 4);
  roundRect(c, 1060, 520, 280, 60, 20, '#ff7ea8', '#c2306f', 4);
  roundRect(c, 1040, 480, 40, 110, 18, '#ff5d8f', '#c2306f', 4);
  roundRect(c, 1320, 480, 40, 110, 18, '#ff5d8f', '#c2306f', 4);
  // doormat with a bouncing arrow: walk down here to go back outside
  roundRect(c, 600, 770, 240, 50, 16, '#ff9f1c', '#c2410c', 4);
  const ay = 778 + Math.abs(Math.sin(t * 4)) * 8;
  c.fillStyle = '#37b24d'; c.strokeStyle = '#ffffff'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(700, ay - 40); c.lineTo(740, ay - 40); c.lineTo(740, ay - 18); c.lineTo(758, ay - 18); c.lineTo(720, ay + 14); c.lineTo(682, ay - 18); c.lineTo(700, ay - 18); c.closePath();
  c.fill(); c.stroke();

  drawParticles(c);
  const h = CONFIG.CHARACTER_HEIGHT * CONFIG.HOUSE_CHARACTER_SCALE;
  drawMichael(c, michael.x, michael.y, h);
  michael.carry.forEach((type, i) => drawFood(c, type, michael.x, michael.y - h - 22 - i * 34 + Math.sin(game.time * 3 + i) * 2, 1.05));
}
function drawTVStatic(c, w, h) {
  for (let y = 0; y < h; y += 12) for (let x = 0; x < w; x += 12) {
    c.fillStyle = `hsl(${Math.random() * 360}, 70%, ${50 + Math.random() * 40}%)`;
    c.fillRect(x, y, 12, 12);
  }
}
function drawTVShow(c, ch, t, w, h) {
  if (ch === 0) {
    // bouncing smiley balls
    const hue = (t * 40) % 360;
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hue}, 90%, 75%)`); g.addColorStop(1, `hsl(${hue + 80}, 90%, 65%)`);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      const bounce = Math.abs(Math.sin(t * 3 + i * 0.9));
      const x = (i + 0.5) * (w / 6), y = h - 28 - bounce * (h - 90);
      const squash = bounce < 0.12 ? 1.25 : 1;
      c.save(); c.translate(x, y); c.scale(squash, 1 / squash);
      circle(c, 0, 0, 24, RAINBOW[i]);
      circle(c, -8, -5, 3.5, '#2b1d3a'); circle(c, 8, -5, 3.5, '#2b1d3a');
      c.strokeStyle = '#2b1d3a'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 3, 9, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      c.restore();
    }
  } else if (ch === 1) {
    // a dancing dragon on stage
    c.fillStyle = '#2a2350'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) {
      c.fillStyle = `hsla(${(t * 60 + i * 120) % 360}, 90%, 70%, 0.35)`;
      c.beginPath(); c.moveTo(w * (0.2 + i * 0.3), 0); c.lineTo(w / 2 - 90 + Math.sin(t * 2 + i) * 60, h); c.lineTo(w / 2 + 90 + Math.sin(t * 2 + i) * 60, h); c.closePath(); c.fill();
    }
    c.fillStyle = '#ff9f1c'; c.fillRect(0, h - 30, w, 30);
    drawCreature(c, { kind: 'dragon', x: w / 2, y: h - 30, size: 2, facing: Math.sin(t * 2) > 0 ? 1 : -1, color: '#7ae582', belly: '#fff3b0', spikes: '#ff7eb6', moving: true, walkPhase: t * 8, jump: Math.abs(Math.sin(t * 4)) * 14, mouthOpen: 1, seed: 2, mood: 'happy' });
    for (let i = 0; i < 4; i++) {
      const nx = (i * 97 + t * 50) % w, ny = h - 40 - ((t * 60 + i * 70) % (h - 40));
      c.fillStyle = RAINBOW[i]; ellipse(c, nx, ny, 7, 5, RAINBOW[i]); c.fillRect(nx + 5, ny - 22, 3, 22);
    }
  } else if (ch === 2) {
    // airplane flying over Airplane's Land
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ff8a1f'); g.addColorStop(1, '#ffc078');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 3; i++) drawCloud(c, ((i * 170 - t * 60) % (w + 200) + w + 200) % (w + 200) - 100, 40 + i * 50, 0.6, 1);
    c.fillStyle = C.grassTop; c.fillRect(0, h - 40, w, 40);
    for (let i = 0; i < 4; i++) {
      const tx = ((i * 120 - t * 120) % (w + 60) + w + 60) % (w + 60) - 30;
      c.fillStyle = C.treeTrunk; c.fillRect(tx - 3, h - 55, 6, 18);
      circle(c, tx, h - 62, 16, C.treeLeaves);
    }
    c.save();
    c.translate(w / 2, h / 2 + Math.sin(t * 2) * 18);
    c.scale(0.6, 0.6);
    drawAirplane(c, 0, 50, { facing: 1, tilt: Math.sin(t * 2) * 0.1, withMichael: true, flying: true });
    c.restore();
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 20; i++) circle(c, (i * 47 + t * 20) % w, (i * 31 + t * 50) % h, 2, '#ffffff');
  } else {
    // spinning rainbow with a smiling star
    c.save();
    c.translate(w / 2, h / 2);
    c.rotate(t * 0.8);
    for (let i = 0; i < 12; i++) {
      c.fillStyle = RAINBOW[i % RAINBOW.length];
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 400, (i * TAU) / 12, ((i + 1) * TAU) / 12); c.closePath(); c.fill();
    }
    c.restore();
    const s = 60 + Math.sin(t * 3) * 8;
    c.fillStyle = '#fff27a'; c.strokeStyle = '#e09b00'; c.lineWidth = 5;
    starPath(c, w / 2, h / 2, s, s * 0.5, 5); c.fill(); c.stroke();
    circle(c, w / 2 - 12, h / 2 - 4, 4.5, '#2b1d3a'); circle(c, w / 2 + 12, h / 2 - 4, 4.5, '#2b1d3a');
    c.strokeStyle = '#2b1d3a'; c.lineWidth = 3; c.beginPath(); c.arc(w / 2, h / 2 + 4, 10, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  }
}

// ---------- HUD (no words: only pictures) ----------
const HOME_BUTTON = { x: 52, y: 758, r: 30 };
function drawHomeButton(c) {
  const { x, y, r } = HOME_BUTTON;
  circle(c, x, y + 3, r, 'rgba(10, 20, 60, 0.3)');
  circle(c, x, y, r, '#ffffff');
  c.strokeStyle = '#3a86ff'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
  c.fillStyle = '#ff5fa2';
  c.beginPath(); c.moveTo(x - 17, y - 1); c.lineTo(x, y - 16); c.lineTo(x + 17, y - 1); c.closePath(); c.fill();
  c.fillStyle = '#b57bff'; c.fillRect(x - 12, y - 2, 24, 17);
  c.fillStyle = '#ffcf3f'; c.fillRect(x - 4, y + 5, 8, 10);
}
function drawHUD(c) {
  if (game.mode === 'menu') return;
  drawHomeButton(c); // back to the menu
  if (game.scene !== 'world') return;
  const t = game.time;
  if (activityOn('sky')) {
    // Top-left: sky buttons found
    const n = skyButtons.length;
    roundRect(c, 16, 14, 84 + (n - 1) * 40 + 30 - 16, 56, 28, 'rgba(255,255,255,0.55)');
    drawCloud(c, 44, 44, 0.32, 1);
    skyButtons.forEach((b, i) => {
      const x = 84 + i * 40, y = 42;
      const pop = b.found ? 1 + game.hud.skyPop * 0.4 : 1;
      if (b.found) { circle(c, x, y, 15 * pop, b.color); circle(c, x - 5, y - 5, 4, 'rgba(255,255,255,0.6)'); }
      c.strokeStyle = b.found ? '#ffffff' : 'rgba(80,90,140,0.4)'; c.lineWidth = 3;
      c.beginPath(); c.arc(x, y, 15 * pop, 0, TAU); c.stroke();
    });
  }
  if (activityOn('seek')) {
    // Top-middle: one star per hiding dino found
    const dinos = seek.dinos, found = dinos.filter((d) => d.found).length;
    const rowW = dinos.length * 52;
    roundRect(c, WORLD_W / 2 - rowW / 2 - 14, 14, rowW + 28, 56, 28, 'rgba(255,255,255,0.55)');
    dinos.forEach((d, i) => {
      const x = WORLD_W / 2 - rowW / 2 + 26 + i * 52, y = 42;
      const on = i < found;
      const s = on && i === found - 1 ? 1 + game.hud.starPop * 0.5 : 1;
      c.save(); c.translate(x, y); c.scale(s, s);
      if (on) c.rotate(Math.sin(t * 3 + i) * 0.1);
      starPath(c, 0, 0, 21, 9.5, 5);
      c.fillStyle = on ? '#ffd23f' : 'rgba(255,255,255,0.5)'; c.fill();
      c.strokeStyle = on ? '#e09b00' : 'rgba(80,90,140,0.4)'; c.lineWidth = 3; c.stroke();
      c.restore();
    });
  }
  if (game.mode === 'feed') {
    // Top-middle: one plate per happy meal
    const n = CONFIG.FEEDS_TO_FINISH, rowW = n * 64;
    roundRect(c, WORLD_W / 2 - rowW / 2 - 14, 14, rowW + 28, 56, 28, 'rgba(255,255,255,0.55)');
    for (let i = 0; i < n; i++) {
      const x = WORLD_W / 2 - rowW / 2 + 32 + i * 64, y = 42, on = i < game.fedCount;
      ellipse(c, x, y, 26, 15, on ? '#ffffff' : 'rgba(255,255,255,0.5)');
      c.strokeStyle = on ? '#9ec5ff' : 'rgba(80,90,140,0.4)'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, 26, 15, 0, 0, TAU); c.stroke();
      if (on) { c.save(); c.translate(x, y + 1); c.scale(1 + Math.sin(t * 4 + i) * 0.08, 1 + Math.sin(t * 4 + i) * 0.08); c.fillStyle = '#ff4d8d'; heartPath(c, 20); c.fill(); c.restore(); }
    }
  }
  if (usesFood()) {
    // Top-right: what time it is and what's on the menu
    const tod = game.timeOfDay, menu = MENU[tod];
    const boxW = 80 + menu.length * 54, bx = WORLD_W - 16 - boxW;
    roundRect(c, bx, 14, boxW, 56, 28, 'rgba(255,255,255,0.55)');
    const ix = bx + 36, iy = 42, pop = 1 + game.hud.timePop * 0.4;
    c.save(); c.translate(ix, iy); c.scale(pop, pop);
    if (tod === 'night') {
      circle(c, 0, 0, 22, '#3d3a8c');
      circle(c, 2, 0, 13, '#fff8d6'); circle(c, 8, -4, 11, '#3d3a8c');
      circle(c, -12, -10, 1.6, '#fff'); circle(c, -8, 12, 1.4, '#fff');
    } else if (tod === 'noon') {
      circle(c, 0, 0, 22, '#7fd1ff');
      circle(c, 0, -4, 11, '#fff27a');
      c.strokeStyle = '#fff27a'; c.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8; c.beginPath(); c.moveTo(Math.cos(a) * 14, -4 + Math.sin(a) * 14); c.lineTo(Math.cos(a) * 18, -4 + Math.sin(a) * 18); c.stroke(); }
    } else {
      circle(c, 0, 0, 22, '#ffb36b');
      c.save(); c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.clip();
      circle(c, 0, 8, 12, '#fff27a');
      c.fillStyle = C.grassTop; c.fillRect(-22, 8, 44, 20);
      c.restore();
  }
  c.restore();
  menu.forEach((type, i) => drawFood(c, type, ix + 58 + i * 54, iy, 0.75));
  }

  // muted speaker (for grown-ups)
  if (Sound.muted) {
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath(); c.moveTo(1380, 775); c.lineTo(1392, 775); c.lineTo(1404, 763); c.lineTo(1404, 797); c.lineTo(1392, 785); c.lineTo(1380, 785); c.closePath(); c.fill();
    c.strokeStyle = '#ff4d6d'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(1410, 770); c.lineTo(1426, 790); c.moveTo(1426, 770); c.lineTo(1410, 790); c.stroke();
  }

  // Arrow-key hint until Michael first moves
  if (!game.started && !game.complete) {
    const p = 1 + Math.sin(t * 4) * 0.06;
    c.save(); c.translate(WORLD_W / 2, WORLD_H - 120); c.scale(p, p);
    const keyBox = (x, y, rot) => {
      roundRect(c, x - 28, y - 28, 56, 56, 12, 'rgba(255,255,255,0.9)', '#3a86ff', 4);
      c.save(); c.translate(x, y); c.rotate(rot);
      c.fillStyle = '#3a86ff'; c.beginPath(); c.moveTo(0, -14); c.lineTo(14, 8); c.lineTo(-14, 8); c.closePath(); c.fill();
      c.restore();
    };
    keyBox(0, -32, 0); keyBox(-62, 30, -Math.PI / 2); keyBox(0, 30, Math.PI); keyBox(62, 30, Math.PI / 2);
    c.restore();
  }
}


/* =====================================================================
   11. MAIN LOOP
   ===================================================================== */
function draw() {
  const c = ctx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#1d2f6b';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.offX * view.dpr, view.offY * view.dpr);
  c.save();
  c.beginPath(); c.rect(0, 0, WORLD_W, WORLD_H); c.clip();
  if (game.scene === 'world') drawWorld(c);
  else drawHouseInside(c);
  if (game.mode === 'menu') drawMenu(c);
  drawHUD(c);
  if (game.complete) drawComplete(c);
  if (game.fade) {
    const a = game.fade.t < 0.35 ? game.fade.t / 0.35 : 1 - (game.fade.t - 0.35) / 0.35;
    c.fillStyle = `rgba(255, 245, 230, ${clamp(a, 0, 1)})`;
    c.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  c.restore();
}

let lastTime = performance.now();
function frame(now) {
  const dt = clamp((now - lastTime) / 1000, 0, 0.05); // cap so a slow frame never jumps far
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

paintBackgroundLayer();
loadMichael();
game.timeOfDay = currentTimeOfDay();
resetWorldForMode('menu');
requestAnimationFrame(frame);

// Handy for grown-ups testing in the browser console, e.g. AirplanesLand.startParade()
window.AirplanesLand = { game, michael, CONFIG, startMode, goMenu, startParade, startFlight, enterHouse, leaveHouse, seek, grumpy, hungryDragons, foods, skyButtons, creatures, petCreature };
