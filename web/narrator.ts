// The narrator (owner request, Oct 10): the story read aloud with the browser's own voice (Web Speech API). Free, no
// files, no keys; the voices are the ones on the player's device (on Windows: the Microsoft voices, best the "Natural"
// or "Online" ones). Off until the player turns it on; voice and speed are remembered. A new turn stops the old reading.

const KEY = 'sengoku-soldier-narrator';
interface Prefs { on: boolean; voice: string; rate: number }
let prefs: Prefs = { on: false, voice: '', rate: 1 };
try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { /* storage blocked */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* fine */ } };

const synth = (): SpeechSynthesis | null => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);
export const narratorAvailable = () => !!synth();
export const narratorOn = () => prefs.on && narratorAvailable();
export const narratorRate = () => prefs.rate;

/** English voices on this device, the most natural first. */
export function voices(): SpeechSynthesisVoice[] {
  const all = synth()?.getVoices() ?? [];
  const score = (v: SpeechSynthesisVoice) => (/natural|neural|online/i.test(v.name) ? 0 : 1) + (/en-GB/i.test(v.lang) ? 0 : 0.5) + (v.localService ? 0.2 : 0);
  return all.filter((v) => /^en/i.test(v.lang)).sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
}
function voice(): SpeechSynthesisVoice | undefined {
  const vs = voices();
  return vs.find((v) => v.voiceURI === prefs.voice) ?? vs[0];
}

export function setNarrator(p: Partial<Prefs>) {
  prefs = { ...prefs, ...p };
  save();
  if (!prefs.on) stopNarrator();
}
export const narratorVoice = () => voice()?.voiceURI ?? '';

/** Long texts are read sentence by sentence (some browsers cut one long utterance off after ~15 seconds). */
function chunks(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').replace(/[*_#]/g, '').trim();
  const sentences = clean.match(/[^.!?…]+[.!?…]+["'”’)]*|[^.!?…]+$/g) ?? [clean];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > 220 && cur) { out.push(cur.trim()); cur = ''; }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Read a text aloud. `interrupt` (default) stops what is being read first; otherwise it is queued after it. */
export function narrate(text: string, interrupt = true) {
  const s = synth();
  if (!s || !narratorOn() || !text.trim()) return;
  if (interrupt) s.cancel();
  const v = voice();
  for (const c of chunks(text)) {
    const u = new SpeechSynthesisUtterance(c);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = prefs.rate;
    u.pitch = 0.95;
    s.speak(u);
  }
}

export function stopNarrator() { synth()?.cancel(); }
