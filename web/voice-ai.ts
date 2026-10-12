// George, the AI narrator (owner request, Oct 10: "the browser voices are bad"). Kokoro-82M (voice bm_george) runs on
// the graphics card (WebGPU) in a background worker, so the page never freezes. Measured on the owner's laptop (Intel
// Iris Xe): faster than speech after warm-up, so while one sentence plays the next is made — no pauses after the first.
// The first use downloads the model once (~330 MB, then cached by the browser). No WebGPU or a blocked download: the
// caller falls back to the browser voice and says why.

const KOKORO_URL = 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm';

/** The worker: loads Kokoro once on WebGPU, then makes one sentence per message (in order). */
const WORKER = `import { KokoroTTS } from '${KOKORO_URL}';
let tts = null;
const load = async () => {
  if (tts) return tts;
  tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'fp32', device: 'webgpu',
    progress_callback: (p) => { if (p.status === 'progress' && p.total) postMessage({ type: 'progress', file: p.file, loaded: p.loaded, total: p.total }); },
  });
  postMessage({ type: 'ready' });
  return tts;
};
onmessage = async (e) => {
  const m = e.data;
  try {
    const t = await load();
    if (m.type !== 'say') return;
    const a = await t.generate(m.text, { voice: m.voice, speed: m.speed });
    postMessage({ type: 'audio', id: m.id, run: m.run, audio: a.audio, rate: a.sampling_rate }, [a.audio.buffer]);
  } catch (err) { postMessage({ type: 'error', id: m.id, error: String(err && err.message || err) }); }
};`;

export type AiStatus = { state: 'off' } | { state: 'loading'; pct: number } | { state: 'ready' } | { state: 'failed'; why: string };
let status: AiStatus = { state: 'off' };
const watchers = new Set<(s: AiStatus) => void>();
const setStatus = (s: AiStatus) => { status = s; for (const w of watchers) w(s); };
export const aiStatus = () => status;
export function onAiStatus(f: (s: AiStatus) => void) { watchers.add(f); f(status); }

/** WebGPU is there (the model needs the graphics card to be fast enough). */
export const aiVoicePossible = () => typeof navigator !== 'undefined' && 'gpu' in navigator && typeof Worker !== 'undefined';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, (r: { audio?: Float32Array; rate?: number; error?: string }) => void>();
const sizes = new Map<string, [number, number]>();

function ensureWorker(): Worker | null {
  if (worker) return worker;
  if (!aiVoicePossible()) { setStatus({ state: 'failed', why: 'this browser has no WebGPU (the AI voice needs the graphics card)' }); return null; }
  try {
    worker = new Worker(URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' })), { type: 'module' });
  } catch (e) {
    setStatus({ state: 'failed', why: `the page does not allow the voice worker (${String(e)})` });
    return null;
  }
  setStatus({ state: 'loading', pct: 0 });
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data as { type: string; id?: number; file?: string; loaded?: number; total?: number; audio?: Float32Array; rate?: number; error?: string };
    if (m.type === 'progress' && m.file && m.total) {
      sizes.set(m.file, [m.loaded ?? 0, m.total]);
      let a = 0; let b = 0;
      for (const [l, t] of sizes.values()) { a += l; b += t; }
      setStatus({ state: 'loading', pct: Math.min(99, Math.floor((a / b) * 100)) });
    } else if (m.type === 'ready') setStatus({ state: 'ready' });
    else if (m.type === 'error') {
      if (status.state !== 'ready') setStatus({ state: 'failed', why: m.error ?? 'unknown error' });
      pending.get(m.id ?? 0)?.({ error: m.error });
      pending.delete(m.id ?? 0);
    } else if (m.type === 'audio' && m.id) { pending.get(m.id)?.({ audio: m.audio, rate: m.rate }); pending.delete(m.id); }
  };
  worker.onerror = (e) => setStatus({ state: 'failed', why: e.message || 'the voice worker could not start here' });
  worker.postMessage({ type: 'load' });
  return worker;
}

/** Start loading George now (from the narrator panel), so the first scene does not wait. */
export function warmAiVoice() { ensureWorker(); }

function make(text: string, voice: string, speed: number, run: number): Promise<{ audio?: Float32Array; rate?: number; error?: string }> {
  const w = ensureWorker();
  if (!w) return Promise.resolve({ error: 'no worker' });
  const id = nextId++;
  return new Promise((done) => { pending.set(id, done); w.postMessage({ type: 'say', id, run, text, voice, speed }); });
}

let ctx: AudioContext | null = null;
let run = 0;
let playing: AudioBufferSourceNode[] = [];
let endAt = 0;

export function stopAi() {
  run++;
  for (const s of playing) { try { s.stop(); } catch { /* ended */ } }
  playing = [];
  endAt = 0;
}

/**
 * Speak sentences with George. All sentences are sent to the worker at once (it makes them in order); each plays as
 * soon as it is ready and the one before has ended. `queue` adds after what is playing. Resolves false when George
 * cannot speak here (the caller then uses the browser voice).
 */
export async function speakAi(sentences: string[], speed = 1, queue = false, voice = 'bm_george'): Promise<boolean> {
  if (!queue) stopAi();
  const my = run;
  if (!ensureWorker()) return false;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') await ctx.resume().catch(() => undefined);
  const jobs = sentences.map((s) => make(s, voice, speed, my));
  for (const job of jobs) {
    const r = await job;
    if (my !== run) return true;
    if (!r.audio || !r.rate) return status.state === 'ready';
    const buf = ctx.createBuffer(1, r.audio.length, r.rate);
    buf.copyToChannel(r.audio, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const at = Math.max(ctx.currentTime + 0.03, endAt);
    src.start(at);
    endAt = at + buf.duration + 0.22; // a breath between sentences
    playing.push(src);
    src.onended = () => { playing = playing.filter((x) => x !== src); };
  }
  return true;
}
