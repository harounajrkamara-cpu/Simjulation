import { ageOn, formatDate } from '../engine/calendar';
import { ENCYCLOPEDIA, STORY } from '../engine/content';
import { ESCAPE_NEEDS, MERIT_FOR_FREEDOM, PRICE_MON, inService } from '../engine/campaign';
import { PLACES } from '../engine/data';
import { has, li, met, today } from '../engine/engine';
import { journalArcs, pctToNext, trophies } from '../engine/render';
import { visibleOpinion } from '../engine/relations';
import { STAT_NAMES, WOUND_LABEL, masteryLabel, rankLetter, rankScores } from '../engine/rules';
import { GameState, STAT_KEYS } from '../engine/types';
import { STANCE_LABEL, Stance, publicWorld } from '../engine/world-public';
import { WORLD_CSS, liPoint, worldSvg } from './world-map';

// The war chronicle's tabs and side panel (Game Experience ch. 3, 6). Only what Li can know is shown.

/** Escape text for HTML. */
export const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** No emoji in the interface (ch. 6): keep words, drop pictographs. */
export const plain = (t: string) => t.replace(/[\p{Extended_Pictographic}️]/gu, '').replace(/\s{2,}/g, ' ').trim();

const BAND = ['raizen', 'gonza', 'rokubei', 'hisame', 'sukezo', 'hachi'];
const PART_TITLE: Record<string, string> = { morning: 'Morning duties', afternoon: 'Afternoon duties', evening: 'By the fire', night: 'Night behind the horse lines' };

/** Short place names for the strip and scene header (the full name is in the Encyclopedia and map). */
const SHORT_PLACE: Record<string, string> = { kori_camp: 'Kōri camp, Akaishi', sasabe: 'Sasabe village', akaishi: 'Akaishi' };

export function placeShort(s: GameState): string {
  if (s.duel && !s.duel.over && s.duel.place) return s.duel.place.split(',')[0];
  const loc = li(s).location;
  return (SHORT_PLACE[loc] ?? PLACES[loc] ?? loc).split(',')[0];
}

export function scene(s: GameState): { label: string; title: string; day: boolean } {
  const story = [...STORY].reverse().find((e) => e.day === today(s) && has(s, `story_${e.id}`));
  const part = s.date.part;
  const gmScene = s.flags.gm_mode ? [...s.events].reverse().find((e) => e.type === 'scene') : undefined;
  const gmTitle = (gmScene?.data as { title?: string } | undefined)?.title;
  const title = s.duel && !s.duel.over ? (s.flags.gm_mode ? 'A fight' : 'Sasabe burns') : gmTitle ?? story?.title ?? PART_TITLE[part];
  return { label: `${placeShort(s)} · ${part}`, title, day: part === 'morning' || part === 'afternoon' };
}

export function strip(s: GameState) {
  const c = li(s);
  return {
    date: formatDate(s.date),
    place: s.duel && !s.duel.over && s.duel.place ? s.duel.place : SHORT_PLACE[c.location] ?? PLACES[c.location] ?? c.location,
    cond: `${WOUND_LABEL[c.wound]} · Fatigue ${c.fatigue}/3`,
    money: `${s.money} mon`,
  };
}

function ranks(s: GameState): string {
  const r = rankScores(li(s));
  return `<span class="rank">Warrior ${rankLetter(r.warrior)}</span><span class="rank">Cmdr ${rankLetter(r.commander)}</span><span class="rank">State ${rankLetter(r.statesman)}</span>`;
}

export function liCard(s: GameState): string {
  const c = li(s);
  return `<div class="crest" aria-hidden="true">李</div>
    <div class="who"><span class="name">Li</span><span class="sub">Age ${ageOn(c.born, s.date)} · ${c.status === 'slave' ? 'slave of the Red Crane' : esc(c.role || 'free')}</span>${s.knowledge.includes('nickname_kurose_no_ryu') ? '<span class="sub gold">Called Kurose no Ryū by the band</span>' : ''}<div class="ranks">${ranks(s)}</div></div>`;
}

/** The fogged ink map: only the places Li knows (ch. 6). Akaishi is Kurogane's southern border; Suiren lies south across the Kurose. */
export function mapSvg(s: GameState, big = false): string {
  const sasabe = has(s, 'story_sasabe_rice') > 0;
  return `<svg class="map" viewBox="0 0 360 200" role="img" aria-label="Map: Akaishi province on the Kurogane side of the Kurose river, Suiren to the south${sasabe ? ', Sasabe village nearby' : ''}; the rest is unknown">
    <path class="land" d="M18 40 Q90 8 180 22 Q280 10 344 46 Q356 110 326 166 Q230 194 124 186 Q34 176 14 112 Z"></path>
    <path class="kg" d="M108 52 L236 46 L244 102 L166 108 L102 100 Z"></path>
    <path class="sr-land" d="M104 120 L240 112 L248 162 L118 170 Z"></path>
    <path class="river" d="M20 114 Q96 96 170 110 Q240 124 344 104"></path>
    <circle class="here" cx="186" cy="97" r="5"></circle>
    <circle class="place" cx="150" cy="68" r="3"></circle>
    ${sasabe ? '<circle class="place" cx="226" cy="72" r="3"></circle><text x="232" y="68">Sasabe</text>' : ''}
    <text x="158" y="64">Akaishi</text>
    <text x="192" y="94">Kōri</text>
    <text x="40" y="70">Kurogane</text>
    <text x="40" y="160">Suiren</text>
    <text class="water" x="262" y="102">Kurose</text>
    <text class="unknown" x="262" y="40">unknown lands</text>
    ${big ? '<text class="unknown" x="262" y="176">unknown lands</text>' : ''}
  </svg>`;
}

export function chronicle(s: GameState): string {
  const evs = s.events.filter((e) => e.visible && (e.type === 'story' || e.type === 'rumour' || e.type === 'scene')).slice(-5).reverse();
  if (!evs.length) return '<li class="empty">Nothing yet.</li>';
  return evs.map((e) => {
    const when = e.day === today(s) ? `Today · ${e.part}` : `Day ${e.day + 1} · ${e.part}`;
    const first = e.type === 'scene' ? String((e.data as { summary?: string }).summary ?? '') : e.fact.split(/(?<=[.!?])\s/)[0];
    return `<li><span class="when">${e.type === 'rumour' ? 'Heard' : esc(when)}</span><span class="${e.type === 'rumour' ? 'rumour' : ''}">${esc(first)}</span></li>`;
  }).join('');
}

const bar = (v: number) => `<span class="bar" aria-hidden="true"><i style="width:${Math.min(100, v)}%"></i></span>`;

const UNLOCKS = [30, 50, 70, 100];

/** "Growing" (owner vision Oct 10): every stat and style with its bar toward the next whole point, and the next style unlock. */
export function growthHtml(s: GameState): string {
  const c = li(s);
  const row = (name: string, v: number, note = '') => {
    const pct = pctToNext(v);
    return `<li><span class="g-name">${esc(name)}</span><span class="g-val">${Math.floor(v)} → ${Math.floor(v) + 1}</span>${bar(pct)}<span class="g-pct">${pct}%</span>${note ? `<span class="g-note">${esc(note)}</span>` : ''}</li>`;
  };
  const stats = STAT_KEYS.map((k) => row(k, c.stats[k])).join('');
  const styles = Object.entries(c.styles).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => {
    const next = UNLOCKS.find((u) => u > v);
    return row(k.replace('_', ' '), v, next ? `unlock at ${next}` : '');
  }).join('');
  return `<ul class="growth">${stats}${styles}</ul>`;
}

export function liPage(s: GameState): string {
  const c = li(s);
  const r = rankScores(c);
  const stats = STAT_KEYS.map((k) => `<tr><th>${STAT_NAMES[k]}</th><td>${c.stats[k].toFixed(1)}${bar(c.stats[k])}</td></tr>`).join('');
  const styles = Object.entries(c.styles).map(([k, v]) => `<tr><th>${esc(k.replace('_', ' '))}</th><td>${v.toFixed(1)} · ${masteryLabel(v)}</td></tr>`).join('');
  const skills = Object.entries(c.skills).map(([k, v]) => `<tr><th>${esc(k.replace('_', ' '))}</th><td>${Math.floor(v)}${bar(v)}</td></tr>`).join('');
  const season = Object.entries(s.seasonGains).map(([k, v]) => `${k.split(':')[1].replace('_', ' ')} +${v.toFixed(2)} of 2`).join(' · ') || 'none yet';
  return `<div class="card">${liCard(s)}</div>
    <h2 class="label">Condition</h2>
    <table class="table"><tr><th>Wounds</th><td>${WOUND_LABEL[c.wound]}${c.wound ? ` · ${c.healDays} days to heal a step` : ''}</td></tr>
      <tr><th>Fatigue</th><td>${c.fatigue} of 3</td></tr><tr><th>Money</th><td>${s.money} mon</td></tr>
      <tr><th>Rank</th><td>Overall ${rankLetter(r.overall)} · Warrior ${r.warrior.toFixed(1)} · Commander ${r.commander.toFixed(1)} · Statesman ${r.statesman.toFixed(1)}</td></tr></table>
    <h2 class="label">Stats</h2><table class="table">${stats}</table>
    <h2 class="label">Fighting styles</h2><table class="table">${styles}</table>
    <h2 class="label">Skills</h2><table class="table">${skills}</table>
    <h2 class="label">Training this season</h2><p>${esc(season)}</p>
    <h2 class="label">Traits</h2><p>${esc(c.traits.join(' · '))}</p>
    <div class="goals">${goalsHtml(s)}</div>`;
}

function personCard(s: GameState, id: string): string {
  const p = s.characters[id];
  return `<article class="person"><div class="top"><div class="crest small" aria-hidden="true">${esc(p.name[0])}</div>
    <div class="who"><span class="name">${esc(p.name)}</span><span class="sub">${esc(p.role)}</span></div></div>
    <p>${esc(p.desc)}</p><p>Strength (Li's guess): ${esc(p.publicRank ?? '?')}</p>
    <p class="op">Toward Li: ${esc(visibleOpinion(s, id))}</p></article>`;
}

export function peoplePage(s: GameState): string {
  const ids = Object.keys(s.relations).filter((id) => met(s, id));
  return `<h1>People</h1><p class="lead">Everyone Li knows, and how they seem to see him. Close friends are easy to read; others are a guess.</p>
    <div class="grid">${ids.map((id) => personCard(s, id)).join('')}</div>`;
}

export function armyPage(s: GameState): string {
  const ids = BAND.filter((id) => met(s, id));
  return `<h1>The Red Crane band</h1><p class="lead">Seen from the baggage line. About 120 hired swords; Li carries their gear but is not one of them. The full roster opens when Li leads men of his own.</p>
    <div class="grid">${ids.map((id) => personCard(s, id)).join('')}</div>`;
}

export function journalPage(s: GameState): string {
  if (!s.journal.length) return '<h1>Journal</h1><p class="empty">Li has written nothing yet.</p>';
  const won = trophies(s);
  const trophyHtml = won.length ? `<h2 class="label">Trophies</h2><ul class="trophies">${won.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
  const arcs = journalArcs(s).reverse().map((a) => `<h2 class="label">${esc(a.title)}</h2>${a.days.slice().reverse().map((d) =>
    `<section><h3>${esc(d.label)}</h3>${d.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</section>`).join('')}`).join('');
  const chapters = (s.gm?.chapters ?? []).map((c, k) => `<section class="chapter"><h3>Chapter ${k + 1} · ${esc(c.title)}</h3><p>${esc(c.text)}</p></section>`).reverse().join('');
  const chapterHtml = chapters ? `<h2 class="label">Chapters</h2><div class="journal">${chapters}</div>` : '';
  return `<h1>Journal</h1><p class="lead">In Li's own words. Only what he knows, and he can be wrong.</p>${chapterHtml}${trophyHtml}<div class="journal">${arcs}</div>`;
}

export function knownEntries(s: GameState) {
  const lore = (s.gm?.lore ?? []).map((l, i) => ({ id: `gm_${i}`, title: l.title, text: l.text }));
  return ENCYCLOPEDIA.filter((e) => !e.needs || has(s, e.needs) > 0).concat(lore);
}

export function encyclopediaPage(s: GameState): string {
  const list = knownEntries(s).map((e) => `<article class="entry"><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p></article>`).join('');
  return `<h1>Encyclopedia</h1><p class="lead">What Li has learned about the world. It grows as he learns more.</p>${list}`;
}

const KEY_SVG: Record<string, string> = {
  war: '<path class="b-war" d="M2 6 L26 6"></path><path class="x-war" d="M10 2 L18 10 M18 2 L10 10"></path>',
  truce: '<path class="b-truce" d="M2 6 L26 6"></path>',
  tension: '<path class="b-tension" d="M2 6 L26 6"></path>',
  cap: '<rect class="cap" x="11" y="3" width="6" height="6"></rect>',
  li: '<circle cx="14" cy="6" r="4.5" fill="#C8452F"></circle>',
};
const key = (k: string, label: string) => `<span><svg viewBox="0 0 28 12" aria-hidden="true">${KEY_SVG[k]}</svg>${label}</span>`;

/** "The world" (zoomed out): the public state of the land, even what Li is too low to know. Never a hidden truth. */
export function worldView(s: GameState): string {
  const w = publicWorld(s.date);
  const name = (id: string) => w.kingdoms.find((k) => k.id === id)?.name ?? w.free.find((f) => f.id === id)?.name ?? id;
  const ties = (id: string) => w.relations.filter((r) => (r.a === id || r.b === id) && ['war', 'truce', 'tension'].includes(r.stance))
    .map((r) => `${r.stance === 'war' ? 'At war with' : r.stance === 'truce' ? 'Truce with' : 'Tension with'} ${name(r.a === id ? r.b : r.a)}`);
  const stance = (st: Stance) => `<b class="${st === 'war' ? 'st-war' : st === 'truce' ? 'st-truce' : 'st-other'}">${STANCE_LABEL[st]}</b>`;
  const kingdoms = w.kingdoms.map((k) => `<article class="wcard c-${k.id}"><h3>${esc(k.name)} <span class="sub">${esc(k.epithet)}</span></h3>
    <p>Capital: ${esc(k.capital)}</p><p>${esc(k.ruler)}</p><p>${esc(k.land)}</p><p>${esc(k.knownFor)}</p><p class="size">${esc(k.size)}</p>
    ${ties(k.id).length ? `<p>${esc(ties(k.id).join(' · '))}</p>` : ''}</article>`).join('');
  const free = w.free.map((f) => `<article class="wcard"><h3>${esc(f.name)} <span class="sub">${esc(f.epithet)}</span></h3><p>${esc(f.text)}</p></article>`).join('');
  const relations = w.relations.map((r) => `<tr><th>${esc(name(r.a))} and ${esc(name(r.b))}</th><td>${stance(r.stance)} · ${esc(r.text)}</td></tr>`).join('');
  const titles = w.titles.map((t) => `<article class="wcard c-${t.kingdom}"><h3>${esc(t.name)} <span class="sub">${esc(name(t.kingdom))}</span></h3><p>${esc(t.text)}</p>
    <ol>${t.seats.map((x) => x.holder ? `<li><b>${esc(x.holder)}</b>${x.known ? `, "${esc(x.known)}"` : ''}. ${esc(x.text)}</li>` : `<li class="open">${esc(x.text)}</li>`).join('')}</ol></article>`).join('');
  const famous = w.famous.map((f) => `<li><b>${esc(f.name)}</b>, ${esc(f.known)}. ${esc(f.text)}</li>`).join('');
  const legends = w.legends.map((l) => `<tr><th>${esc(l.when)}</th><td><b>${esc(l.title)}</b>. ${esc(l.text)}</td></tr>`).join('');
  return `<p class="lead">The land as everyone knows it in Year ${w.year}: what any merchant, monk or soldier could tell. Li may not know all of it yet.</p>
    <div class="mv-map">${worldSvg(w, liPoint(w, li(s).location))}</div>
    <p class="mv-key">${key('war', 'At war')}${key('truce', 'Truce')}${key('tension', 'Tension')}${key('cap', 'Capital')}${key('li', 'Li')}</p>
    <h2 class="label">The seven kingdoms</h2><div class="grid">${kingdoms}</div>
    <h2 class="label">War and peace</h2><table class="table">${relations}</table>
    <h2 class="label">Free lands</h2><div class="grid">${free}</div>
    <h2 class="label">Great titles</h2><div class="grid">${titles}</div>
    <h2 class="label">Famous names</h2><div class="wcard mv-famous"><ul>${famous}</ul></div>
    <h2 class="label">Remembered battles</h2><table class="table mv-years">${legends}</table>`;
}

/** Two views (owner): Li's eyes (default, fogged, only what Li knows) and the world (public state). CSS switches them, no script. */
export function mapPage(s: GameState): string {
  return `<div class="mapviews"><style>${WORLD_CSS}</style>
    <h1>The land</h1>
    <fieldset class="mv-switch"><legend>Map view</legend>
      <label><input type="radio" name="mapview" id="mv-li" value="li" checked>Li's eyes</label>
      <label><input type="radio" name="mapview" id="mv-world" value="world">The world</label>
    </fieldset>
    <section class="mv-li" aria-label="Li's eyes"><p class="lead">As Li knows it: only Akaishi and the river. The rest of the seven kingdoms is fog until Li learns it.</p>
      <div class="mv-map">${mapSvg(s, true)}</div></section>
    <section class="mv-world" aria-label="The world">${worldView(s)}</section>
  </div>`;
}

/** Goals panel (GE ch. 4): Li's goals and the freedom routes he knows, with visible progress. */
export function goalsHtml(s: GameState): string {
  const c = li(s);
  const routes: string[] = [];
  if (c.status === 'slave') {
    const serving = inService(s);
    if (has(s, 'kurogane_merit_law') || serving) {
      routes.push(`Merit in Kurogane service: ${s.flags.merit_service ?? 0} of ${MERIT_FOR_FREEDOM}${serving ? '' : ' (needs service)'}`);
      routes.push(`Or one enemy officer's head, Kogashira or higher, in Kurogane service${serving ? '' : ' (needs service)'}`);
    }
    if (has(s, 'own_price_15')) routes.push(`His price: fifteen ryō · Li has ${s.money} of ${PRICE_MON} mon`);
    if (has(s, 'tatara_refuge') && has(s, 'papers_in_iron_box')) {
      const sk = c.skills;
      routes.push(`Run for Tatara (hunted) · stealth ${Math.floor(sk.stealth ?? 0)} of ${ESCAPE_NEEDS.stealth} · endurance ${Math.floor(sk.endurance ?? 0)} of ${ESCAPE_NEEDS.endurance} · rested, unhurt, a night without Gonza`);
    }
  }
  const now = c.status === 'slave' ? 'Survive · Win his freedom' : has(s, 'hunted') ? 'Free, and hunted. The first book of his life is closed.' : 'Free. The first book of his life is closed.';
  const later = c.status === 'slave' ? 'Find his mother and sisters · Learn why his father died' : 'Next: soldier life (stage 2) · Find his mother and sisters · Learn why his father died';
  return `<h2 class="label">Goals</h2><p class="goal-now">${now}</p>${routes.map((r) => `<p class="goal-route">${esc(r)}</p>`).join('')}<p class="goal-later">${later}</p>`;
}
