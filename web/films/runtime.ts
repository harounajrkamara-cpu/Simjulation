import { esc } from './fx';
import { Playing, isMuted, setMuted, unlockSound } from './sound';
import { narrate } from '../narrator';

// The film runtime (docs/FILMS.md, Build system). One overlay; a film is a list of shots with durations. The runtime
// sets data-shot on the overlay, CSS starts that shot's animations, cues fire sounds at fixed times. Click or tap = the
// next shot; Skip or Escape = the last shot, a second press ends it. Every film can be skipped (a death only after its
// first two seconds). Resolves when the film is over. The same `play` serves game events and scroll triggers.

export interface Cue { at: number; fn: () => void }
export interface Shot {
  /** Milliseconds this shot runs. */
  dur: number;
  /** Narration under the picture (plain text). */
  caption?: string;
  /** What the narrator reads for this shot when there is no caption (a title card). */
  speak?: string;
  /** Sounds and class changes at fixed times inside the shot. */
  cues?: Cue[];
}
export interface FilmSpec {
  id: string;
  /** The SVG stage content (inside a 1600×900 viewBox) and any HTML layers above it. */
  svg: string;
  html?: string;
  shots: Shot[];
  /** A sound that runs under the whole film (wind), stopped at the end. */
  ambient?: () => Playing;
  /** The last shot waits for a click instead of ending on its own. */
  waitAtEnd?: boolean;
  /** Clicks are ignored for this long at the start (a death cannot be clicked away by accident). */
  holdMs?: number;
}

let root: HTMLElement | null = null;

function ensureRoot(): HTMLElement {
  if (root) return root;
  root = document.createElement('div');
  root.id = 'film';
  root.className = 'film';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  document.body.appendChild(root);
  return root;
}

/** Play one film. Resolves when it ends (played through, skipped, or closed). */
export function play(spec: FilmSpec): Promise<void> {
  unlockSound(); // films start from a click, so the browser allows sound now
  const el = ensureRoot();
  el.className = `film film--${spec.id}`;
  el.setAttribute('aria-label', `Film: ${spec.id}`);
  el.innerHTML = `
    <svg class="fl-stage" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${spec.svg}</svg>
    ${spec.html ?? ''}
    <div class="fl-flash" aria-hidden="true"></div>
    <div class="fl-letterbox fl-letterbox--top" aria-hidden="true"></div><div class="fl-letterbox fl-letterbox--bottom" aria-hidden="true"></div>
    <div class="fl-vignette" aria-hidden="true"></div>
    <p class="fl-caption" aria-live="polite"></p>
    <div class="fl-controls">
      <button type="button" class="fl-mute" aria-pressed="${isMuted()}">${isMuted() ? 'Sound off' : 'Sound on'}</button>
      <button type="button" class="fl-skip">Skip</button>
    </div>
    <p class="fl-hint">Click for the next shot · Esc to skip</p>`;
  el.hidden = false;
  const caption = el.querySelector<HTMLElement>('.fl-caption')!;
  const ambient = spec.ambient?.();
  const started = performance.now();
  let k = -1;
  let timer: number | undefined;
  const cueTimers: number[] = [];
  return new Promise((done) => {
    const clearCues = () => { while (cueTimers.length) clearTimeout(cueTimers.pop()); };
    const end = () => {
      clearTimeout(timer);
      clearCues();
      ambient?.stop();
      document.removeEventListener('keydown', onKey);
      el.classList.add('is-ending');
      setTimeout(() => { el.hidden = true; el.className = 'film'; el.innerHTML = ''; done(); }, 350);
    };
    const show = (n: number) => {
      clearTimeout(timer);
      clearCues();
      k = n;
      const s = spec.shots[n];
      el.dataset.shot = String(n + 1);
      caption.textContent = s.caption ?? '';
      caption.classList.toggle('is-on', !!s.caption);
      if (s.speak ?? s.caption) narrate((s.speak ?? s.caption)!);
      for (const c of s.cues ?? []) cueTimers.push(window.setTimeout(c.fn, c.at));
      const last = n === spec.shots.length - 1;
      if (!(last && spec.waitAtEnd)) timer = window.setTimeout(() => (last ? end() : show(n + 1)), s.dur);
    };
    const held = () => performance.now() - started < (spec.holdMs ?? 0);
    const next = () => { if (held()) return; if (k >= spec.shots.length - 1) end(); else show(k + 1); };
    const skip = () => { if (held()) return; if (k >= spec.shots.length - 1) end(); else show(spec.shots.length - 1); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); skip(); }
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); next(); }
    };
    el.onclick = (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('.fl-mute')) { setMuted(!isMuted()); t.textContent = isMuted() ? 'Sound off' : 'Sound on'; t.setAttribute('aria-pressed', String(isMuted())); return; }
      if (t.closest('.fl-skip')) { skip(); return; }
      next();
    };
    document.addEventListener('keydown', onKey);
    el.querySelector<HTMLButtonElement>('.fl-skip')!.focus();
    show(0);
  });
}

/** Play films in order without input (the cinematic autoplay variant). */
export async function playAll(specs: FilmSpec[]) {
  for (const s of specs) await play(s);
}

/** For a showcase page: play each `[data-film]` section's spec when 60% of it scrolls into view (once). */
export function playOnScroll(sections: { el: Element; spec: () => FilmSpec }[]) {
  const seen = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting || seen.has(e.target)) continue;
      seen.add(e.target);
      const s = sections.find((x) => x.el === e.target);
      if (s) play(s.spec());
    }
  }, { threshold: 0.6 });
  for (const s of sections) io.observe(s.el);
}

export { esc };

/** For checking by hand: show one shot of a film and hold it (no timers, no sound). `close()` removes it. */
export function preview(spec: FilmSpec, shot: number): { close(): void } {
  play(spec);
  const el = ensureRoot();
  // Freeze the film where it is: stop every pending timer the runtime started, then pin the requested shot.
  let t = window.setTimeout(() => undefined, 0);
  while (t > 0) clearTimeout(t--);
  el.dataset.shot = String(shot);
  const s = spec.shots[shot - 1];
  const cap = el.querySelector<HTMLElement>('.fl-caption')!;
  cap.textContent = s?.caption ?? '';
  cap.classList.toggle('is-on', !!s?.caption);
  return { close() { el.hidden = true; el.innerHTML = ''; } };
}
