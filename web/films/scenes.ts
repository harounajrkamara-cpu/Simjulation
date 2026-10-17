import { brushTitle, defs, esc, particles, ridges, seal, speedLines } from './fx';
import { FilmSpec } from './runtime';
import { bladeRing, drumsFar, heartbeat, shakuhachi, swish, taiko, warCry, wind } from './sound';

// The seven films of docs/FILMS.md, in one style: Kingdom framing, sumi-e ink silhouettes, a dark palette with seal red
// and gold. Each returns a FilmSpec for web/films/runtime.ts; all motion is in web/films.css (selectors
// `.film--<id>[data-shot="n"] .shN …`). Owner choice (Oct 10): the opening keeps the Twin Demon a mystery — no wooden
// dragon, nothing that ties the boy to him.

const flashAt = (ms: number) => ({ at: ms, fn: () => document.querySelector('#film')?.classList.add('is-impact') });
const clearImpact = (ms: number) => ({ at: ms, fn: () => document.querySelector('#film')?.classList.remove('is-impact') });

// ---------- 1. The opening ----------

const CITY = 'M0 900 L0 640 L90 640 L90 600 L120 585 L150 600 L150 640 L260 640 L260 560 L240 560 L300 520 L360 560 L340 560 L340 640 L470 640 L470 590 L520 565 L570 590 L570 640 L640 640 L640 520 L610 520 L700 455 L790 520 L760 520 L760 640 L880 640 L880 600 L920 580 L960 600 L960 640 L1080 640 L1080 570 L1060 570 L1120 535 L1180 570 L1160 570 L1160 640 L1300 640 L1300 600 L1340 585 L1380 600 L1380 640 L1600 640 L1600 900Z';
// Ragged flame tongues: three jagged tips each, two tones (outer red, inner gold), behind and between the roofs.
const FLAMES = Array.from({ length: 16 }, (_, k) => {
  const x = 30 + k * 100 + ((k * 37) % 50);
  const h = 120 + ((k * 53) % 170);
  const w = 60 + ((k * 29) % 40);
  const tip = (dx: number, f: number) => `L${x + dx} ${640 - h * f}`;
  const outer = `M${x - w / 2} 640 ${tip(-w * 0.35, 0.55)} ${tip(-w * 0.15, 0.78)} ${tip(-w * 0.05, 0.62)} ${tip(w * 0.05, 1)} ${tip(w * 0.18, 0.66)} ${tip(w * 0.3, 0.84)} ${tip(w * 0.4, 0.5)} L${x + w / 2} 640Z`;
  const inner = `M${x - w / 4} 640 L${x - w * 0.1} ${640 - h * 0.45} L${x + w * 0.03} ${640 - h * 0.7} L${x + w * 0.15} ${640 - h * 0.42} L${x + w / 4} 640Z`;
  return `<g class="fl-flame" style="animation-delay:-${(k % 5) * 0.17}s"><path class="fl-flame-out" d="${outer}"/><path class="fl-flame-in" d="${inner}"/></g>`;
}).join('');
const BANNERS = Array.from({ length: 7 }, (_, k) => `<path class="fl-banner" style="--tx:${[-620, -420, -200, 0, 220, 430, 640][k]}px;--ty:${[-260, 120, -330, 260, -300, 150, -220][k]}px;--r:${[-40, 25, -15, 35, 20, -30, 45][k]}deg;animation-delay:${(k * 0.12).toFixed(2)}s" d="M${640 + k * 48} 470 l0 -50 l26 6 l-8 10 l8 10 l-26 6z"/>`).join('');
const MAP_REGIONS = [
  'M300 300 L560 250 L620 420 L420 520 L280 460Z', 'M560 250 L860 220 L900 380 L620 420Z', 'M860 220 L1180 260 L1220 420 L900 380Z',
  'M1180 260 L1340 340 L1320 520 L1220 420Z', 'M420 520 L620 420 L760 560 L560 680 L400 620Z', 'M620 420 L900 380 L960 560 L760 560Z',
  'M900 380 L1220 420 L1320 520 L1180 640 L960 560Z',
].map((d, k) => `<path class="fl-region" style="animation-delay:${(k * 0.35).toFixed(2)}s" d="${d}"/>`).join('');
const RIDERS = Array.from({ length: 9 }, (_, k) => `<use href="#fl-rider" class="fl-rider" x="${-180 - k * 110}" y="${470 - (k % 3) * 10}" width="120" height="90" style="animation-delay:${(k * 0.15).toFixed(2)}s"/>`).join('');
const ARMY = (x: number, n: number, cls: string) => Array.from({ length: n }, (_, k) => `<use href="#fl-soldier" class="${cls}" x="${x + k * 34}" y="${582 + (k % 2) * 6}" width="20" height="90"/>`).join('');

export function opening(): FilmSpec {
  const svg = `${defs}
  <rect class="fl-sky fl-sky--dawn" width="1600" height="900" fill="url(#fl-sky-dawn)"/>
  <rect class="fl-sky fl-sky--fire sh2" width="1600" height="900" fill="url(#fl-sky-fire)"/>
  <rect class="fl-sky fl-sky--night sh4 sh5 sh6 sh7 sh8" width="1600" height="900" fill="url(#fl-sky-night)"/>
  <g class="fl-parallax sh1 sh2 sh4">${ridges()}</g>
  <g class="fl-city sh1 sh2"><path class="fl-ink" d="${CITY}"/>${Array.from({ length: 7 }, (_, k) => `<path class="fl-flag" d="M${300 + k * 170} 520 l0 -40 l22 6 l-22 6z"/>`).join('')}</g>
  <ellipse class="fl-glow sh2" cx="800" cy="640" rx="900" ry="260"/>
  <g class="fl-flames sh2">${FLAMES}</g>
  <g class="sh3"><rect width="1600" height="900" fill="#171A20"/><path class="fl-land" d="M260 300 C420 200 1100 180 1360 330 C1420 470 1300 700 1000 720 C700 760 360 700 280 560 C220 460 230 360 260 300Z"/>${MAP_REGIONS}${BANNERS}</g>
  <g class="sh4"><path class="fl-river" d="M-50 720 C400 690 800 760 1650 700"/>${ARMY(120, 12, 'fl-army fl-army--a')}${ARMY(1040, 12, 'fl-army fl-army--b')}<g class="fl-riders">${RIDERS}</g></g>
  <g class="sh5 fl-demon">
    <path class="fl-river-far" d="M-50 560 C400 540 900 600 1650 560 L1650 600 C900 640 400 590 -50 610Z"/>
    ${Array.from({ length: 18 }, (_, k) => `<path class="fl-tiny-banner" d="M${180 + k * 70} ${575 - (k % 3) * 6} l0 -18 l9 3 l-9 3z"/>`).join('')}
    <path class="fl-hill" d="M-50 900 L-50 760 C300 700 520 660 760 690 C1000 720 1300 780 1650 760 L1650 900Z"/>
    <g class="fl-general" transform="translate(760 430)">
      <path class="fl-coat" d="M-60 260 C-70 170 -50 90 -40 40 L40 40 C50 90 70 170 64 260 C30 250 -20 250 -60 260Z"/>
      <circle class="fl-ink" cx="0" cy="14" r="26"/>
      <path class="fl-ink" d="M-44 40 L-70 150 M44 40 L70 150" stroke="#08090B" stroke-width="16" stroke-linecap="round"/>
      <path class="fl-sword" d="M-72 148 C-110 190 -150 230 -200 270"/><path class="fl-sword" d="M72 148 C110 190 150 230 200 270"/>
      <circle class="fl-sash" cx="-6" cy="96" r="18"/>
      <path class="fl-cloth" d="M-30 50 C-80 40 -140 60 -200 30 C-170 60 -120 80 -60 90Z"/>
      <path class="fl-cloth fl-cloth--2" d="M-10 0 C-40 -6 -70 4 -110 -6 C-80 12 -40 16 -12 14Z"/>
    </g>
  </g>
  <g class="sh6"><rect width="1600" height="900" fill="#12151A" filter="url(#fl-paper)"/><rect width="1600" height="900" fill="#171A20" opacity=".85"/>
    <path class="fl-blade" d="M520 260 C700 420 900 560 1100 660"/><path class="fl-blade" d="M1080 250 C900 410 700 560 500 670"/>
    <path class="fl-guard" d="M590 318 l40 -30 M1010 310 l-40 -30"/></g>
  <g class="sh7 fl-pass">
    <path class="fl-cliff" d="M-50 0 L520 0 C600 160 560 300 700 420 C760 470 700 560 640 620 L-50 700Z"/>
    <path class="fl-slope" d="M-50 900 L-50 640 C300 600 700 560 1100 470 C1300 430 1500 400 1650 380 L1650 900Z"/>
    <path class="fl-slope-line" d="M-50 700 C400 640 900 560 1650 430"/>
    <ellipse class="fl-lantern-glow" cx="946" cy="450" rx="160" ry="70"/>
    <g transform="translate(900 330) scale(1.7)"><path class="fl-ink" d="M0 0 a12 12 0 1 1 0 .1 M-15 18 C-10 14 10 14 15 18 L24 92 L-24 92Z"/><path class="fl-ink" d="M12 30 L26 58" stroke="#050506" stroke-width="5"/><circle class="fl-lantern" cx="27" cy="64" r="7"/></g>
    <g transform="translate(780 410) scale(1.7)"><path class="fl-ink" d="M0 0 a8 8 0 1 1 0 .1 M-10 12 C-6 10 6 10 10 12 L14 56 L-14 56Z"/></g>
    <g class="fl-gusts">${Array.from({ length: 14 }, (_, k) => `<path d="M${-200 + (k * 137) % 1700} ${80 + (k * 61) % 700} l260 -46" style="animation-delay:-${((k * 0.31) % 1.6).toFixed(2)}s"/>`).join('')}</g>
  </g>
  <g class="sh8"><rect width="1600" height="900" fill="#08090B"/></g>`;
  const html = `
    ${particles('ember', 40).replace('fl-particles--ember', 'fl-particles--ember sh2')}
    ${particles('snow', 70).replace('fl-particles--snow', 'fl-particles--snow sh7')}
    <div class="fl-titlecard sh8">${brushTitle('One boy. Seven kingdoms at war.', 'fl-brush--title')}${brushTitle('A father\'s name he must not say.', 'fl-brush--sub', 0.3)}${seal('兵', 2.6)}</div>`;
  return {
    id: 'opening', svg, html, ambient: () => wind(0.18),
    shots: [
      { dur: 5000, caption: 'For four hundred years, one Empire ruled the land.' },
      { dur: 5000, caption: 'Then the capital burned.', cues: [{ at: 2200, fn: () => taiko(true) }, flashAt(2200), clearImpact(2700)] },
      { dur: 5000, caption: 'Seven Wardens crowned themselves. Seven kingdoms.' },
      { dur: 5000, caption: 'A hundred years of war.', cues: [{ at: 300, fn: () => drumsFar(4.5) }] },
      { dur: 7000, caption: 'In Suiren a peasant\'s son rose with two swords. They called him the Twin Demon.' },
      { dur: 7000, caption: 'In Year 95 he fell on a night road. "Kurogane raiders," the songs say.' },
      { dur: 5000 },
      { dur: 6000, speak: "One boy. Seven kingdoms at war. A father's name he must not say.", cues: [{ at: 400, fn: () => shakuhachi(4.5) }] },
    ],
  };
}

// ---------- 2. Li's first battle ----------

export function firstBattle(d: { name: string; numbers: string }): FilmSpec {
  const row = (y: number, n: number, cls: string, size: number, gap: number, x0: number) =>
    Array.from({ length: n }, (_, k) => `<use href="#fl-soldier" class="${cls}" x="${x0 + k * gap}" y="${y - size * 0.5 + (k % 2) * 5}" width="${size / 3}" height="${size * 1.5}"/>`).join('');
  const svg = `${defs}
  <rect width="1600" height="900" fill="url(#fl-sky-mist)"/>
  <g class="fl-parallax">${ridges(-40)}</g>
  <rect class="fl-mist" y="380" width="1600" height="260" fill="url(#fl-mist)"/>
  <g class="fl-enemy sh1 sh2 sh5">${row(470, 40, 'fl-foe', 70, 40, 0)}</g>
  <g class="fl-allies sh1 sh5">${row(640, 30, 'fl-ally', 90, 54, -10)}</g>
  <g class="sh3 fl-ours">${row(560, 12, 'fl-ally fl-ally--big', 300, 140, -40)}<use href="#fl-soldier" class="fl-ally fl-li" x="720" y="500" width="70" height="315"/></g>
  <g class="sh4 fl-grip"><rect width="1600" height="900" fill="#171A20"/>
    <path class="fl-shaft" d="M200 900 L1500 -40"/><path class="fl-fist" d="M640 520 c40 -60 160 -90 220 -40 c30 30 20 90 -30 120 c-60 30 -160 20 -190 -20z"/>
    <path class="fl-sweat" d="M940 400 c-8 18 -8 30 0 34 c8 -4 8 -16 0 -34z"/></g>
  ${speedLines(48, 'sh2 sh5')}`;
  const html = `<div class="fl-titlecard fl-titlecard--battle sh5">${brushTitle(d.name, 'fl-brush--title', 0.2)}<p class="fl-numbers">${esc(d.numbers)}</p></div>`;
  return {
    id: 'battle', svg, html,
    shots: [
      { dur: 3000, cues: [{ at: 100, fn: () => drumsFar(7) }] },
      { dur: 2500 },
      { dur: 2500 },
      { dur: 2000, cues: [{ at: 0, fn: () => warCry(2) }] },
      { dur: 3000, speak: `${d.name}. ${d.numbers}.`, cues: [{ at: 0, fn: () => taiko(true) }, flashAt(0), clearImpact(500)] },
    ],
  };
}

// ---------- 3. The Zone waking ----------

// A manga eye: a sharp almond, a heavy upper lash line in brush, an iris of ink streaks, hair falling across it.
const IRIS_STREAKS = Array.from({ length: 36 }, (_, k) => {
  const a = (k / 36) * Math.PI * 2;
  return `<line x1="${(Math.cos(a) * 46).toFixed(1)}" y1="${(Math.sin(a) * 46).toFixed(1)}" x2="${(Math.cos(a) * 112).toFixed(1)}" y2="${(Math.sin(a) * 112).toFixed(1)}"/>`;
}).join('');
const EYE = `<g class="fl-eye" transform="translate(800 450)">
  <path class="fl-eye-shape" d="M-460 30 C-300 -120 -60 -170 200 -130 C320 -110 420 -60 470 -10 C330 110 120 160 -80 140 C-250 124 -380 90 -460 30Z"/>
  <g class="fl-iris-g"><circle class="fl-iris" r="118"/><g class="fl-streaks">${IRIS_STREAKS}</g><circle class="fl-pupil" r="44"/><path class="fl-glint" d="M28 -60 l26 -8 l-6 22z"/></g>
  <path class="fl-lid" d="M-480 40 C-320 -150 -60 -200 210 -150 C340 -126 440 -70 500 -10 L520 -340 L-520 -340Z"/>
  <path class="fl-lash" d="M-470 34 C-320 -140 -60 -186 205 -142 C330 -120 430 -66 486 -12" />
  <path class="fl-hair" d="M-560 -380 C-420 -220 -300 -160 -160 -110 M-260 -400 C-140 -260 -40 -200 80 -150 M120 -420 C170 -300 240 -220 360 -150 M-420 -420 C-300 -300 -230 -260 -120 -230"/>
</g>`;
const RING = `<circle class="fl-ring" cx="800" cy="450" r="150"/>`;

export function zone(): FilmSpec {
  const svg = `${defs}<rect width="1600" height="900" fill="#0E1014"/>
  <g class="sh1 sh2 sh4 fl-gray">${EYE}</g>
  <g class="sh4">${RING}</g>
  <g class="sh3"><path class="fl-blade-frozen" d="M200 120 L1000 620"/><path class="fl-blade-edge" d="M200 120 L1000 620"/></g>
  ${speedLines(64, 'fl-speed--in sh3')}
  <text class="fl-kanji sh5" x="800" y="560" text-anchor="middle">真剣ノ流</text>`;
  const html = `${particles('dust', 50).replace('fl-particles--dust', 'fl-particles--dust sh3')}
    <div class="fl-titlecard fl-titlecard--zone sh5">${brushTitle('SHINKEN NO RYŪ', 'fl-brush--title', 0.15)}</div>`;
  return {
    id: 'zone', svg, html,
    shots: [
      { dur: 1500, cues: [{ at: 0, fn: heartbeat }] },
      { dur: 1000, cues: [{ at: 0, fn: heartbeat }] },
      { dur: 1500 },
      { dur: 1000 },
      { dur: 3000, speak: 'Shinken no Ryū.', cues: [{ at: 0, fn: bladeRing }, { at: 0, fn: () => taiko(false) }, flashAt(0), clearImpact(400)] },
    ],
  };
}

// ---------- 4. "I AM LI HATTORI" ----------

export function nameReveal(d: { words: string }): FilmSpec {
  const crowd = Array.from({ length: 12 }, (_, k) => `<use href="#fl-figure" class="fl-turner" x="${80 + k * 125}" y="${560 + (k % 3) * 12}" width="70" height="210" style="animation-delay:${(k * 0.06).toFixed(2)}s"/>`).join('');
  const svg = `${defs}<rect width="1600" height="900" fill="url(#fl-sky-night)"/>
  <g class="fl-parallax">${ridges(60)}</g>
  <g class="sh1">${crowd}</g>
  <g class="sh2 fl-li-close"><path class="fl-ink" d="M800 260 a90 90 0 1 1 0 .1 M650 420 C690 380 910 380 950 420 L1010 900 L590 900Z"/>
    <g class="fl-strands"><path d="M760 240 C700 230 660 250 620 230"/><path d="M820 230 C880 210 930 220 980 200"/><path d="M790 220 C770 180 740 170 710 150"/></g></g>
  <g class="sh4">${[[380, 1], [800, 0], [1220, 1]].map(([x, back], k) => `<use href="#fl-figure" class="fl-witness${back ? ' fl-witness--back' : ''}" x="${x - 60}" y="420" width="120" height="360" style="animation-delay:${k * 0.15}s"/>`).join('')}</g>`;
  const html = `<div class="fl-titlecard fl-titlecard--shout sh3">${brushTitle(d.words, 'fl-brush--shout', 0.12)}${seal('名', 0.8)}</div>`;
  return {
    id: 'name', svg, html,
    shots: [
      { dur: 2000 },
      { dur: 1500 },
      { dur: 2500, cues: [{ at: 0, fn: () => taiko(true) }, flashAt(0), clearImpact(450)] },
      { dur: 2500 },
    ],
  };
}

// ---------- 5. A promotion (static panel + stamp) ----------

export function promotion(d: { rank: string; men: string; line: string }): FilmSpec {
  return {
    id: 'card', svg: `${defs}<rect width="1600" height="900" fill="#0E1014"/>`, waitAtEnd: true,
    html: `<div class="fl-paper sh1"><p class="fl-kicker">Promotion</p>${brushTitle(d.rank, 'fl-brush--rank', 0.2)}<p class="fl-men">${esc(d.men)}</p><p class="fl-line">${esc(d.line)}</p>${seal('昇', 1.1)}</div>`,
    shots: [{ dur: 2500, speak: `Promotion. ${d.rank}, ${d.men}. ${d.line}`, cues: [{ at: 1100, fn: () => taiko(false) }] }],
  };
}

// ---------- 5b. A life milestone (goal Oct 17: big goals are milestones with their own film) ----------
// Marriage, a child, land, the family found, the truth about his father, a side at court: the promotion card's style.

export function milestone(d: { kicker: string; title: string; line: string; seal: string }): FilmSpec {
  return {
    id: 'card', svg: `${defs}<rect width="1600" height="900" fill="#0E1014"/>`, waitAtEnd: true,
    html: `<div class="fl-paper sh1"><p class="fl-kicker">${esc(d.kicker)}</p>${brushTitle(d.title, 'fl-brush--rank', 0.2)}<p class="fl-line">${esc(d.line)}</p>${seal(d.seal, 1.1)}</div>`,
    shots: [{ dur: 2800, speak: `${d.kicker}. ${d.title}. ${d.line}`, cues: [{ at: 1100, fn: () => taiko(false) }] }],
  };
}

// ---------- 6. A death (static panel, near stillness, no sound) ----------

export function death(d: { name: string; line: string }): FilmSpec {
  return {
    id: 'death', svg: `${defs}<rect width="1600" height="900" fill="#08090B"/><path class="fl-petal" d="M0 0 c8 -10 20 -10 24 0 c-4 10 -16 10 -24 0z"/>`,
    waitAtEnd: true, holdMs: 2000,
    html: `<div class="fl-death sh1"><p class="fl-vname">${esc(d.name)}</p><p class="fl-line">${esc(d.line)}</p></div>`,
    shots: [{ dur: 5000, speak: d.line }],
  };
}

// ---------- 7. A chapter end (ink wipe + card) ----------

export function chapterEnd(d: { n: number; title: string; text: string }): FilmSpec {
  const first = d.text.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  return {
    id: 'chapter', waitAtEnd: true,
    svg: `${defs}<path class="fl-wipe" d="M-100 450 C300 380 700 520 1100 430 S1500 470 1700 440"/>`,
    html: `<div class="fl-paper fl-paper--chapter sh1"><p class="fl-kicker">Chapter ${d.n}</p>${brushTitle(d.title, 'fl-brush--rank', 0.2)}<p class="fl-line">${esc(first)}</p></div>`,
    shots: [{ dur: 3000, speak: `Chapter ${d.n}. ${d.title}. ${first}`, cues: [{ at: 0, fn: swish }] }],
  };
}

// ---------- 8. First victory (owner, Oct 12: "more and cooler films") ----------
// Li's first duel the code decided in his favour: two figures, the rush, a frozen impact, a gold cut, the foe falls.

export function victory(d: { foe: string; deadly: boolean }): FilmSpec {
  const svg = `${defs}<rect width="1600" height="900" fill="url(#fl-sky-night)"/>
  <g class="fl-parallax">${ridges(80)}</g>
  <g class="sh1 sh2 fv-duelists">
    <use href="#fl-figure" class="fv-li" x="300" y="430" width="120" height="360"/>
    <use href="#fl-figure" class="fv-foe" x="1180" y="410" width="135" height="390"/>
  </g>
  ${speedLines(56, 'fl-speed--in sh2')}
  <g class="sh3"><path class="fv-cut" d="M260 180 L1340 700"/><path class="fv-cut fv-cut--thin" d="M300 230 L1300 650"/></g>
  <g class="sh4"><use href="#fl-figure" class="fv-stand" x="640" y="520" width="100" height="300"/><use href="#fl-figure" class="fv-fall" x="860" y="520" width="110" height="300"/></g>`;
  const title = d.deadly ? 'FIRST BLOOD' : 'FIRST VICTORY';
  const html = `<div class="fl-titlecard fv-title sh4">${brushTitle(title, 'fl-brush--shout', 0.1)}<p class="fl-men">${esc(d.foe)}</p>${seal('勝', 1.2)}</div>`;
  return {
    id: 'victory', svg, html, waitAtEnd: true,
    shots: [
      { dur: 1600, cues: [{ at: 0, fn: heartbeat }, { at: 800, fn: heartbeat }] },
      { dur: 700, cues: [{ at: 0, fn: swish }] },
      { dur: 1300, cues: [{ at: 0, fn: bladeRing }, flashAt(0), clearImpact(500)] },
      { dur: 3200, speak: `${title.charAt(0)}${title.slice(1).toLowerCase()}. ${d.foe}.`, cues: [{ at: 300, fn: () => taiko(true) }] },
    ],
  };
}

// ---------- 9. Freedom ----------
// The chain breaks; dawn over the ridge; one figure; "FREE".

export function freedom(d: { how: string }): FilmSpec {
  const links = Array.from({ length: 9 }, (_, k) => {
    const x = 455 + k * 70;
    const fly = [[-260, -220, -60], [-200, 180, 40], [-140, -260, 80], [-60, 240, -30], [0, -300, 120], [70, 260, -90], [150, -240, 50], [210, 200, -120], [280, -180, 70]][k];
    const side = k % 2 === 1; // links alternate: one seen flat, the next edge-on, so they interlock
    return `<rect class="fv-link${side ? ' fv-link--side' : ''}" x="${x}" y="${side ? 443 : 428}" width="95" height="${side ? 14 : 44}" rx="${side ? 7 : 22}" style="--tx:${fly[0]}px;--ty:${fly[1]}px;--r:${fly[2]}deg"/>`;
  }).join('');
  const svg = `${defs}<rect width="1600" height="900" fill="#0B0C0F"/>
  <rect class="fv-dawn sh3 sh4" width="1600" height="900" fill="url(#fl-sky-dawn)"/>
  <g class="sh1 sh2">${links}</g>
  <g class="sh3 sh4 fl-parallax">${ridges(140)}<use href="#fl-figure" class="fv-alone" x="770" y="520" width="60" height="180"/></g>`;
  const html = `${particles('dust', 40).replace('fl-particles--dust', 'fl-particles--dust sh3')}
    <div class="fl-titlecard fv-title sh4">${brushTitle('FREE', 'fl-brush--shout', 0.2)}<p class="fl-men">${esc(d.how)}</p>${seal('自', 1)}</div>`;
  return {
    id: 'freedom', svg, html, waitAtEnd: true, ambient: wind,
    shots: [
      { dur: 1800, cues: [{ at: 0, fn: heartbeat }, { at: 900, fn: heartbeat }] },
      { dur: 1200, cues: [{ at: 0, fn: bladeRing }, flashAt(0), clearImpact(400)] },
      { dur: 2600, cues: [{ at: 200, fn: shakuhachi }] },
      { dur: 3200, speak: `Free. ${d.how}.`, cues: [{ at: 0, fn: () => taiko(false) }] },
    ],
  };
}
