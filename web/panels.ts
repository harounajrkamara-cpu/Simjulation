import { ageOn, formatDate } from '../engine/calendar';
import { ENCYCLOPEDIA, STORY } from '../engine/content';
import { PLACES } from '../engine/data';
import { has, li, met, today } from '../engine/engine';
import { visibleOpinion } from '../engine/relations';
import { STAT_NAMES, WOUND_LABEL, masteryLabel, rankLetter, rankScores } from '../engine/rules';
import { GameState, STAT_KEYS } from '../engine/types';

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
  return (SHORT_PLACE[loc] ?? PLACES[loc]).split(',')[0];
}

export function scene(s: GameState): { label: string; title: string; day: boolean } {
  const story = [...STORY].reverse().find((e) => e.day === today(s) && has(s, `story_${e.id}`));
  const part = s.date.part;
  const title = s.duel && !s.duel.over ? 'Sasabe burns' : story?.title ?? PART_TITLE[part];
  return { label: `${placeShort(s)} · ${part}`, title, day: part === 'morning' || part === 'afternoon' };
}

export function strip(s: GameState) {
  const c = li(s);
  return {
    date: formatDate(s.date),
    place: s.duel && !s.duel.over && s.duel.place ? s.duel.place : SHORT_PLACE[c.location] ?? PLACES[c.location],
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
    <div class="who"><span class="name">Li</span><span class="sub">Age ${ageOn(c.born, s.date)} · slave of the Red Crane</span>${s.knowledge.includes('nickname_kurose_no_ryu') ? '<span class="sub gold">Called Kurose no Ryū by the band</span>' : ''}<div class="ranks">${ranks(s)}</div></div>`;
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
  const evs = s.events.filter((e) => e.visible && (e.type === 'story' || e.type === 'rumour')).slice(-5).reverse();
  if (!evs.length) return '<li class="empty">Nothing yet.</li>';
  return evs.map((e) => {
    const when = e.day === today(s) ? `Today · ${e.part}` : `Day ${e.day + 1} · ${e.part}`;
    const first = e.fact.split(/(?<=[.!?])\s/)[0];
    return `<li><span class="when">${e.type === 'rumour' ? 'Heard' : esc(when)}</span><span class="${e.type === 'rumour' ? 'rumour' : ''}">${esc(first)}</span></li>`;
  }).join('');
}

const bar = (v: number) => `<span class="bar" aria-hidden="true"><i style="width:${Math.min(100, v)}%"></i></span>`;

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
    <h2 class="label">Goals</h2><p>Survive · Win his freedom · Find his mother and sisters · Learn why his father died</p>`;
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
  const days = new Map<number, string[]>();
  for (const j of s.journal) days.set(j.day, [...(days.get(j.day) ?? []), j.text]);
  const blocks = [...days.entries()].reverse().map(([d, lines]) =>
    `<section><h3>Month ${Math.floor(d / 30) % 12 + 1}, Day ${(d % 30) + 1}</h3>${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</section>`).join('');
  return `<h1>Journal</h1><p class="lead">In Li's own words. Only what he knows, and he can be wrong.</p><div class="journal">${blocks}</div>`;
}

export function knownEntries(s: GameState) {
  return ENCYCLOPEDIA.filter((e) => !e.needs || has(s, e.needs) > 0);
}

export function encyclopediaPage(s: GameState): string {
  const list = knownEntries(s).map((e) => `<article class="entry"><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p></article>`).join('');
  return `<h1>Encyclopedia</h1><p class="lead">What Li has learned about the world. It grows as he learns more.</p>${list}`;
}

export function mapPage(s: GameState): string {
  return `<h1>The land, as Li knows it</h1><p class="lead">Only Akaishi and the river. The rest of the seven kingdoms is fog until Li learns it.</p>
    <div style="max-width:760px">${mapSvg(s, true)}</div>`;
}
