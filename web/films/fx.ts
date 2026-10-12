// Shared pieces every film reuses (docs/FILMS.md, Build system): SVG defs, ridges, particles, speed lines, the brush
// title and the seal. They return markup strings; all motion lives in web/films.css. Deterministic: positions come from
// the index, never from chance, so a film looks the same every time.

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Gradients, symbols and the paper grain, once per stage. */
export const defs = `<defs>
  <linearGradient id="fl-sky-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2E36"/><stop offset=".6" stop-color="#6B5A45"/><stop offset="1" stop-color="#C7A878"/></linearGradient>
  <linearGradient id="fl-sky-fire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E0B0B"/><stop offset=".55" stop-color="#3A1810"/><stop offset="1" stop-color="#C8452F"/></linearGradient>
  <linearGradient id="fl-sky-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08090B"/><stop offset="1" stop-color="#1E242C"/></linearGradient>
  <linearGradient id="fl-sky-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3F49"/><stop offset="1" stop-color="#A79F8C"/></linearGradient>
  <linearGradient id="fl-mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9E0CA" stop-opacity="0"/><stop offset=".5" stop-color="#E9E0CA" stop-opacity=".35"/><stop offset="1" stop-color="#E9E0CA" stop-opacity="0"/></linearGradient>
  <filter id="fl-paper"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .91  0 0 0 0 .88  0 0 0 0 .79  0 0 0 .08 0"/></filter>
  <symbol id="fl-soldier" viewBox="0 -30 20 90" overflow="visible"><path d="M10 6a4 4 0 1 1 0 .1M6 12h8l2 22-3 26h-3l-1-18-1 18H5L2 34z"/><path class="spear" d="M14 14 L18 -26" stroke="currentColor" stroke-width="1.6"/></symbol>
  <symbol id="fl-rider" viewBox="0 0 80 60"><g class="gallop"><path d="M8 38c6-10 20-14 36-12l12-8 10 2-4 8-6 2c2 6 0 12-6 14l-4 14h-4l2-12H22l-4 12h-4l2-14c-6-2-8-4-8-6z"/><path d="M32 22l4-14h6l-2 14z M38 6l2-6 10 20z"/></g></symbol>
  <symbol id="fl-figure" viewBox="0 0 30 90"><path d="M15 2a7 7 0 1 1 0 .1M7 18h16l4 34-4 38h-5l-3-30-3 30H7L3 52z"/></symbol>
</defs>`;

/** Two mountain ridges (far and mid) for parallax. */
export const ridges = (y = 0) => `
  <path class="fl-ridge fl-ridge--far" transform="translate(0 ${y})" d="M-100 560 L80 470 L210 520 L360 430 L520 505 L700 420 L860 500 L1020 440 L1200 515 L1380 450 L1560 500 L1700 470 L1700 900 L-100 900Z"/>
  <path class="fl-ridge fl-ridge--mid" transform="translate(0 ${y})" d="M-100 650 L120 590 L330 630 L560 575 L800 640 L1040 590 L1270 650 L1500 600 L1700 640 L1700 900 L-100 900Z"/>`;

const at = (i: number, a: number, m: number) => (i * a) % m;

/** Particles (HTML spans) with fixed per-index positions: embers rise, snow and dust fall. */
export function particles(kind: 'ember' | 'snow' | 'dust', n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    const left = at(i, 37, 100);
    const delay = (at(i, 73, 600) / 100).toFixed(2);
    const dx = at(i, 53, 160) - 80;
    const size = kind === 'snow' ? 2 + at(i, 7, 6) : kind === 'ember' ? 2 + at(i, 3, 3) : 1 + at(i, 5, 3);
    const dur = kind === 'snow' ? 6 + at(i, 11, 5) : kind === 'ember' ? 4 + at(i, 13, 4) : 9;
    const near = kind === 'snow' && i % 4 === 0 ? ' near' : '';
    out += `<i class="fl-p fl-p--${kind}${near}" style="left:${left}%;--dx:${dx}px;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:-${delay}s"></i>`;
  }
  return `<div class="fl-particles fl-particles--${kind}" aria-hidden="true">${out}</div>`;
}

/** Speed lines from the edges toward the centre (SVG, inside the stage). */
export function speedLines(n = 48, cls = ''): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x1 = 800 + Math.cos(a) * 1100;
    const y1 = 450 + Math.sin(a) * 700;
    const x2 = 800 + Math.cos(a) * (380 + at(i, 41, 160));
    const y2 = 450 + Math.sin(a) * (250 + at(i, 29, 110));
    out += `<line x1="${x1.toFixed(0)}" y1="${y1.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" style="animation-delay:-${(at(i, 17, 35) / 100).toFixed(2)}s"/>`;
  }
  return `<g class="fl-speed ${cls}">${out}</g>`;
}

/** A brush title: each word is painted on in turn (clip-path wipe), with a brush stroke under it. */
export function brushTitle(text: string, cls = '', step = 0.35): string {
  const words = text.split(/\s+/).filter(Boolean);
  return `<div class="fl-brush ${cls}">${words.map((w, k) => `<span style="animation-delay:${(k * step).toFixed(2)}s">${esc(w)}</span>`).join(' ')}
    <svg class="fl-brush-stroke" viewBox="0 0 600 30" preserveAspectRatio="none" aria-hidden="true"><path d="M6 18 C120 6 260 26 400 14 S560 10 594 16" style="animation-delay:${(words.length * step).toFixed(2)}s"/></svg></div>`;
}

/** The red seal stamp. */
export const seal = (glyph: string, delay = 0) => `<span class="fl-seal" style="animation-delay:${delay}s" aria-hidden="true">${esc(glyph)}</span>`;
