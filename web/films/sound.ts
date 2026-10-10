// Film sound, synthesized in the browser with Web Audio (owner: sound yes). No files, no licences, a few kB: wind is
// filtered noise, a taiko is a falling low tone with a hit of noise, a heartbeat is two soft thumps, the shakuhachi is a
// breathy sine with slow vibrato, a blade ring is a few high partials. Sound starts only after the player's first click
// (browser rule) and can be muted; the choice is remembered.

const MUTE_KEY = 'sengoku-soldier-mute';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* storage blocked */ }

/** Call from a click: browsers only allow audio after the player has interacted. */
export function unlockSound() {
  if (ctx || typeof window === 'undefined') return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.8;
  master.connect(ctx.destination);
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* fine */ }
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05);
}

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = b.getChannelData(0);
  // A fixed pseudo-random sequence (the same noise every time).
  let x = 12345;
  for (let i = 0; i < d.length; i++) { x = (x * 1103515245 + 12345) & 0x7fffffff; d[i] = (x / 0x3fffffff) - 1; }
  return b;
}

/** A sound the film can stop early (a skip). */
export interface Playing { stop(): void }
const none: Playing = { stop() { /* nothing */ } };

/** Wind: band-passed noise whose filter sways slowly. Loops until stopped. */
export function wind(volume = 0.25): Playing {
  if (!ctx || !master) return none;
  const c = ctx;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 4);
  src.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 500;
  bp.Q.value = 0.7;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.15;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 250;
  lfo.connect(lfoGain).connect(bp.frequency);
  const g = c.createGain();
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(volume, c.currentTime + 1.5);
  src.connect(bp).connect(g).connect(master);
  src.start();
  lfo.start();
  return {
    stop() {
      const t = c.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.6);
      src.stop(t + 0.7);
      lfo.stop(t + 0.7);
    },
  };
}

/** A taiko hit: a low tone falling in pitch, plus a short thud of noise. `big` for the loudest moments. */
export function taiko(big = false) {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(big ? 110 : 140, t);
  o.frequency.exponentialRampToValueAtTime(big ? 38 : 55, t + 0.6);
  const g = c.createGain();
  g.gain.setValueAtTime(big ? 1.0 : 0.7, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + (big ? 1.6 : 0.9));
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 1.7);
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, 0.2);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  const ng = c.createGain();
  ng.gain.setValueAtTime(big ? 0.6 : 0.4, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  n.connect(lp).connect(ng).connect(master);
  n.start(t);
}

/** Distant war drums: a slow pattern of soft taiko hits for `seconds`. */
export function drumsFar(seconds: number) {
  if (!ctx) return;
  const beats = [0, 0.55, 1.4, 1.95];
  for (let bar = 0; bar * 2.4 < seconds; bar++) {
    for (const b of beats) {
      const at = bar * 2.4 + b;
      if (at < seconds) setTimeout(() => softHit(0.25 + 0.05 * bar), at * 1000);
    }
  }
}
function softHit(volume: number) {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.4);
  const g = c.createGain();
  g.gain.setValueAtTime(Math.min(0.6, volume), t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.7);
}

/** One heartbeat (lub-dub). */
export function heartbeat() {
  if (!ctx || !master) return;
  const c = ctx;
  for (const [off, vol] of [[0, 0.8], [0.22, 0.55]] as const) {
    const t = c.currentTime + off;
    const o = c.createOscillator();
    o.frequency.setValueAtTime(60, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.15);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.3);
  }
}

/** A single shakuhachi-like note: a breathy sine with slow vibrato, swelling and fading. */
export function shakuhachi(seconds = 3, freq = 392) {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.value = freq;
  const vib = c.createOscillator();
  vib.frequency.value = 5;
  const vg = c.createGain();
  vg.gain.setValueAtTime(0, t);
  vg.gain.linearRampToValueAtTime(6, t + seconds * 0.5);
  vib.connect(vg).connect(o.frequency);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.28, t + 0.5);
  g.gain.setValueAtTime(0.28, t + seconds - 1);
  g.gain.linearRampToValueAtTime(0, t + seconds);
  o.connect(g).connect(master);
  const breath = c.createBufferSource();
  breath.buffer = noiseBuffer(c, seconds);
  const hp = c.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.value = freq * 2;
  hp.Q.value = 2;
  const bg = c.createGain();
  bg.gain.setValueAtTime(0, t);
  bg.gain.linearRampToValueAtTime(0.05, t + 0.3);
  bg.gain.linearRampToValueAtTime(0, t + seconds);
  breath.connect(hp).connect(bg).connect(master);
  o.start(t); vib.start(t); breath.start(t);
  o.stop(t + seconds); vib.stop(t + seconds); breath.stop(t + seconds);
}

/** A blade ring: a few high partials with a long, bright decay. */
export function bladeRing() {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  for (const [f, v] of [[2093, 0.18], [3136, 0.1], [4699, 0.06]] as const) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 2.2);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 2.3);
  }
}

/** A brush swish: a quick sweep of high-passed noise. */
export function swish() {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, 0.6);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(800, t);
  f.frequency.exponentialRampToValueAtTime(4000, t + 0.45);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.35, t + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
  n.connect(f).connect(g).connect(master);
  n.start(t);
}

/** A war cry: a swelling roar of band-passed noise over `seconds`, cut hard at the end. */
export function warCry(seconds = 2) {
  if (!ctx || !master) return;
  const c = ctx;
  const t = c.currentTime;
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, seconds + 0.1);
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 350;
  f.Q.value = 1.2;
  const g = c.createGain();
  g.gain.setValueAtTime(0.01, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + seconds);
  g.gain.setValueAtTime(0, t + seconds);
  n.connect(f).connect(g).connect(master);
  n.start(t);
  n.stop(t + seconds + 0.05);
}
