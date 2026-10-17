import { has, li, today } from './engine';
import { careerOf } from './gm-career';
import { rankLevel } from './career';
import { clockDrafts } from './clocks';
import { memberOf } from './court';
import { reputation } from './reputation';
import { KINGDOMS, treasury, atWar } from './kingdoms';
import { publicWorld, KingdomId } from './world-public';
import { Draft, GameState } from './types';

// The world's texture (World Bible ch. 2 extras 7–8, ch. 7; Atlas §3.8, §8, §12–§13). Phase 6 block G (audit gaps 12–14),
// built Oct 17: the neutral powers Li can deal with, weather and trade, festivals, the Imperial treasures, governors.
// ⚠ PROVISIONAL numbers (owner kan terugdraaien). No dice: weather is fixed by the world number and the year.

const hash = (x: string) => { let h = 7; for (const ch of x) h = (h * 31 + ch.charCodeAt(0)) % 100_003; return h; };
const where = (s: GameState) => li(s).location.toLowerCase() + ' ' + (s.characters[s.liId].location ?? '');
const at = (s: GameState, ...words: string[]) => words.some((w) => where(s).includes(w));
const year = (s: GameState) => s.date.year;
const ryo = (n: number) => n * 1_000;

// ── Weather (hidden causes, ch. 7) ──

export type Weather = 'drought' | 'floods' | 'harsh winter' | 'a good year' | 'an ordinary year';
/** Fixed by the world number, the year and the kingdom. */
export function weatherOf(s: GameState, k: KingdomId, y = year(s)): Weather {
  const r = hash(`${s.worldNumber}-${y}-${k}`) % 10;
  return r === 0 ? 'drought' : r === 1 ? 'floods' : r === 2 && (k === 'kitakaze' || k === 'takane') ? 'harsh winter' : r >= 8 ? 'a good year' : 'an ordinary year';
}
/** PROVISIONAL: share of a harvest lost (a good year: −0.1, i.e. gained). */
export const WEATHER_LOSS: Record<Weather, number> = { drought: 0.25, floods: 0.15, 'harsh winter': 0.05, 'a good year': -0.1, 'an ordinary year': 0 };

/** The turn of a year: a harsh northern winter sends the Horo raiding; a poor Suiren feeds the Single Path. */
export function worldYearDrafts(s: GameState, from: number, to: number): Draft[] {
  const out: Draft[] = [];
  for (let k = from + 1; k <= to; k++) {
    if (k % 360 !== 0) continue;
    const y = 100 + Math.floor(k / 360);
    const mine = careerOf(s).kingdom;
    if (weatherOf(s, 'kitakaze', y) === 'harsh winter') out.push({ type: 'story', fact: 'A hard winter in the north: the Horo clans raid the Long Palisade.', visible: mine === 'kitakaze', data: { world: 'horo' } });
    if (weatherOf(s, 'suiren', y) === 'drought') out.push({ type: 'story', fact: 'A bad harvest in Suiren: rice is short, and Tatara goes hungry.', visible: mine === 'suiren' || mine === 'tatara', data: { world: 'hunger' } });
    if (treasury(s, 'suiren') < 40) {
      out.push({ type: 'story', fact: 'The Single Path rises among Suiren\'s poor and slaves: "all souls are equal". The lords send soldiers.', visible: mine === 'suiren', data: { world: 'single_path' } });
      out.push({ type: 'flag', fact: 'the uprising costs Suiren', visible: false, data: { key: 'treasury_suiren', value: Math.max(0, treasury(s, 'suiren') - 5) } });
    }
    // Embargoes bite once a year (below).
    for (const e of embargoes(s)) out.push({ type: 'flag', fact: `the embargo bites ${e.to}`, visible: false, data: { key: `treasury_${e.to}`, value: Math.max(0, treasury(s, e.to) - (LACKS[e.to].includes(EXPORTS[e.from][0]) ? 8 : 5)) } });
    // Debt to Kinza grows 20% a year.
    if (has(s, 'debt_mon')) out.push({ type: 'flag', fact: 'the Kinza loan grows', visible: true, data: { key: 'debt_mon', value: Math.round(has(s, 'debt_mon') * 1.2) } });
    // A governor's season of work (counted yearly here: 4 seasons × 5 political merit, Numbers §6).
    if (has(s, 'governor')) out.push({ type: 'flag', fact: 'a year of governing: political merit +20', visible: true, data: { key: 'merit_political', value: has(s, 'merit_political') + 20 } });
  }
  return out;
}

// ── Trade and embargoes (Atlas §8) ──

export const EXPORTS: Record<KingdomId, string[]> = { kurogane: ['iron', 'horses'], suiren: ['rice', 'silk'], hayate: ['horses', 'wool'], ushio: ['salt', 'coin'], takane: ['copper', 'timber'], tatara: ['steel', 'crossbows'], kitakaze: ['furs', 'horses'] };
export const LACKS: Record<KingdomId, string[]> = { kurogane: ['water', 'luxury'], suiren: ['iron', 'horses'], hayate: ['grain', 'iron'], ushio: ['soldiers', 'timber'], takane: ['food', 'rice'], tatara: ['food', 'rice'], kitakaze: ['grain', 'iron'] };
const embargoKey = (a: KingdomId, b: KingdomId) => `embargo_${a}_${b}`;
export const embargoes = (s: GameState) => KINGDOMS.flatMap((a) => KINGDOMS.filter((b) => has(s, embargoKey(a, b))).map((b) => ({ from: a, to: b })));

/** {kind:"embargo", from, to, end?}: a kingdom stops its trade with another. Li can move it from inside his own court. */
export function embargoDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const a = x.from as KingdomId, b = x.to as KingdomId;
  if (!KINGDOMS.includes(a) || !KINGDOMS.includes(b) || a === b) { notes.push('an embargo needs two different kingdoms'); return []; }
  if (a !== careerOf(s).kingdom || !memberOf(s)) { notes.push('Li can push an embargo only from inside the court he serves'); return []; }
  const key = embargoKey(a, b);
  if (x.end) return has(s, key) ? [{ type: 'flag', fact: `${a} trades with ${b} again`, visible: true, data: { key, value: 0 } }] : [];
  if (has(s, key)) { notes.push('that embargo already holds'); return []; }
  return [{ type: 'flag', fact: `${a} stops its ${EXPORTS[a].join(' and ')} going to ${b}`, visible: true, data: { key, value: 1 } }];
}

/** Numbers §7 prices, moved by war and embargo (a seller at war with you, or holding back, sells dear). */
const BASE_PRICE: [string, number, KingdomId][] = [['a warhorse', 20, 'hayate'], ['good armour', 20, 'tatara'], ['a crossbow', 20, 'tatara'], ['a bow', 3.5, 'takane'], ['a year of rice', 1, 'suiren'], ['salt for a year', 0.5, 'ushio']];
export function pricesText(s: GameState): string {
  const mine = careerOf(s).kingdom;
  const war = (k: KingdomId) => publicWorld(s.date).relations.some((r) => r.stance === 'war' && ((r.a === k && r.b === mine) || (r.b === k && r.a === mine)));
  return `PRICES where Li is (in ryō; 1 ryō = 1,000 mon): ${BASE_PRICE.map(([n, p, seller]) => {
    const m = (war(seller) || has(s, embargoKey(seller, mine)) ? 1.5 : 1) * (seller === 'tatara' && mine === 'tatara' && n === 'a crossbow' ? 0.4 : 1);
    return `${n} ${Math.round(p * m * 10) / 10}`;
  }).join(' · ')}.`;
}

// ── The neutral powers (Atlas §3.8) ──

/** PROVISIONAL Kinza loans: up to 10 ryō per rank step, 20% a year; at twice the loan, the collectors come. */
export function loanDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  if (x.repay) {
    const debt = has(s, 'debt_mon');
    const pay = Math.min(debt, s.money, Math.round(Number(x.repay) * 1000) || debt);
    if (!debt || !pay) { notes.push(debt ? 'Li has no money to repay' : 'Li owes Kinza nothing'); return []; }
    return [{ type: 'money', fact: `Li repays Kinza ${pay} mon`, visible: true, data: { amount: -pay } }, { type: 'flag', fact: 'debt', visible: true, data: { key: 'debt_mon', value: debt - pay } }];
  }
  if (!at(s, 'kinza')) { notes.push('loans are made in Kinza'); return []; }
  if (li(s).status === 'slave') { notes.push('Kinza lends nothing to a slave'); return []; }
  const max = ryo(10 * (rankLevel(careerOf(s).rank) + 1));
  const want = Math.round(Number(x.ryo) * 1000);
  if (!want || has(s, 'debt_mon') + want > max) { notes.push(`Kinza lends Li at most ${max / 1000} ryō in all`); return []; }
  return [{ type: 'money', fact: `Li borrows ${want / 1000} ryō from a Kinza house`, visible: true, data: { amount: want } }, { type: 'flag', fact: 'debt', visible: false, data: { key: 'debt_mon', value: has(s, 'debt_mon') + want } }, { type: 'flag', fact: 'loan', visible: false, data: { key: 'loan_mon', value: has(s, 'loan_mon') + want } }];
}
export function debtClockDrafts(s: GameState): Draft[] {
  if (!has(s, 'loan_mon') || has(s, 'debt_mon') < 2 * has(s, 'loan_mon') || (s.gm?.clocks ?? []).some((c) => c.id === 'kinza_debt' && c.open)) return [];
  return clockDrafts(s, { id: 'kinza_debt', name: 'Kinza wants its money', doom: 'Kinza\'s collectors come for Li: his goods, his name, or his men', size: 4 }, []);
}

/** PROVISIONAL Kinza mercenaries: 250 mon a man a month, paid up front; they march in Li's unit until the contract ends. */
export function hireDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  if (!at(s, 'kinza')) { notes.push('mercenaries are hired in Kinza'); return []; }
  if (rankLevel(careerOf(s).rank) < 1) { notes.push('only a man who leads men hires swords'); return []; }
  const men = Math.max(0, Math.round(Number(x.men) || 0)), months = Math.max(1, Math.round(Number(x.months) || 1));
  const cost = men * months * 250;
  if (!men) return [];
  if (cost > s.money) { notes.push(`${men} men for ${months} months cost ${cost} mon; Li has ${s.money}`); return []; }
  return [{ type: 'money', fact: `Li hires ${men} Kinza swords for ${months} months`, visible: true, data: { amount: -cost } }, { type: 'flag', fact: 'mercenaries', visible: false, data: { key: 'mercs', value: men } }, { type: 'flag', fact: 'contract', visible: false, data: { key: 'mercs_until', value: today(s) + 30 * months } }];
}
export const mercsNow = (s: GameState) => (has(s, 'mercs_until') > today(s) ? has(s, 'mercs') : 0);

/** Mist Valley shinobi (2 ryō): they find one person's secret; never twice against the same target in a year (Atlas §3.8). */
export function shinobiDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const id = String(x.target ?? '');
  const p = s.characters[id];
  const secret = s.gm?.agendas[id]?.secret;
  if (!p) { notes.push(`no person "${id}"`); return []; }
  if (li(s).status === 'slave' || s.money < 2_000) { notes.push('the Mist Valley wants 2 ryō, paid by a free man'); return []; }
  const key = `shinobi_${id}`;
  if (has(s, key) && has(s, key) > today(s) - 360) { notes.push('the Mist Valley never works twice against the same target in one year'); return []; }
  return [
    { type: 'money', fact: 'Li pays the Mist Valley', visible: true, data: { amount: -2_000 } },
    { type: 'flag', fact: 'shinobi hired', visible: false, data: { key, value: today(s) || 1 } },
    { type: 'lore', fact: `The Mist Valley reports on ${p.name}`, visible: true, data: { title: `Mist Valley report: ${p.name}`, text: secret ? `They found: ${secret}` : `${p.name} hides nothing the shinobi could find.` } },
  ];
}

/** Mount Shōgen: sanctuary (no one seizes a man inside the temple walls) and gifts to the temples (peasants hear of it). */
export function shogenDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  if (!at(s, 'shogen', 'shōgen')) { notes.push('Li is not at Mount Shōgen'); return []; }
  if (x.gift) {
    const gift = Math.round(Number(x.gift) * 1000);
    if (!gift || gift > s.money) { notes.push('Li cannot give what he does not have'); return []; }
    return [{ type: 'money', fact: `Li gives ${gift / 1000} ryō to the temples`, visible: true, data: { amount: -gift } }, { type: 'flag', fact: 'the poor hear of the gift', visible: true, data: { key: 'rep_peasants', value: Math.min(100, reputation(s, 'peasants') + Math.min(10, Math.ceil(gift / 2_000))) } }];
  }
  return [{ type: 'flag', fact: 'Li takes sanctuary at Mount Shōgen', visible: true, data: { key: 'sanctuary', value: 1 } }];
}

/** The Seiran Academy exam (Ushio, the commoners' route): INT 50 passes; once a year. */
export function examDrafts(s: GameState, notes: string[]): Draft[] {
  if (!at(s, 'kaisei')) { notes.push('the Seiran exam is held in Kaisei'); return []; }
  if (has(s, 'seiran_scholar')) { notes.push('Li has passed already'); return []; }
  if (has(s, 'seiran_tried') === year(s)) { notes.push('the exam is held once a year'); return []; }
  if (li(s).stats.INT < 50) return [{ type: 'flag', fact: 'Li fails the Seiran exam', visible: true, data: { key: 'seiran_tried', value: year(s) } }];
  return [
    { type: 'flag', fact: 'Li passes the Seiran exam: a scholar of the Academy', visible: true, journal: 'I passed the Seiran exam. A slave\'s son with a scholar\'s seal.', data: { key: 'seiran_scholar', value: 1 } },
    { type: 'flag', fact: 'political merit +10', visible: true, data: { key: 'merit_political', value: has(s, 'merit_political') + 10 } },
    { type: 'flag', fact: 'nobles take note', visible: false, data: { key: 'rep_nobles', value: Math.min(100, reputation(s, 'nobles') + 5) } },
  ];
}

// ── Festivals (the year's rhythm) ──

export const FESTIVALS: { name: string; month: number; day: number; kingdom?: KingdomId }[] = [
  { name: 'New Year', month: 1, day: 1 }, { name: 'the festival of the dead', month: 7, day: 15 }, { name: 'the harvest festival', month: 9, day: 15 },
  { name: 'the horse festival of Hayate', month: 5, day: 5, kingdom: 'hayate' }, { name: 'the lotus festival of Suiren', month: 6, day: 10, kingdom: 'suiren' },
  { name: 'the fire festival of the forges', month: 11, day: 1, kingdom: 'tatara' }, { name: 'the wolf moon of the north', month: 12, day: 15, kingdom: 'kitakaze' },
  { name: 'the opening of the Mirror at Mount Shōgen', month: 4, day: 8 },
];
export function festivalDrafts(s: GameState, from: number, to: number): Draft[] {
  const out: Draft[] = [];
  const mine = careerOf(s).kingdom;
  for (let k = from + 1; k <= to; k++) {
    const m = Math.floor((k % 360) / 30) + 1, d = (k % 30) + 1;
    for (const f of FESTIVALS) if (f.month === m && f.day === d && (!f.kingdom || f.kingdom === mine)) out.push({ type: 'story', fact: `Festival: ${f.name}.`, visible: true, data: { festival: f.name } });
  }
  return out.slice(-2);
}

// ── The Imperial treasures (Atlas §1) ──

export const TREASURES = [
  { id: 'seal', name: 'the Jade Seal', start: 'suiren' },
  { id: 'mirror', name: 'the Mirror "Masumi"', start: 'shogen' },
  { id: 'sword', name: 'the Sword "Amenokiri"', start: 'lost' },
] as const;
const HOLDERS = ['suiren', 'shogen', 'lost', 'li', ...KINGDOMS];
export const holderOf = (s: GameState, id: string) => HOLDERS[has(s, `treasure_${id}`) - 1] ?? TREASURES.find((t) => t.id === id)!.start;

/** {kind:"treasure", id, holder, reason}: a treasure changes hands. The sword can only be found in the ruins of Amatsu-kyō. */
export function treasureDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const t = TREASURES.find((y) => y.id === x.id);
  const holder = String(x.holder ?? '');
  if (!t || !HOLDERS.includes(holder)) { notes.push(`no treasure "${String(x.id)}" or holder "${holder}"`); return []; }
  if (holder === 'li' && t.id === 'sword' && !at(s, 'amatsu')) { notes.push('the Sword lies where no one looks: not here'); return []; }
  if (holder === 'li' && holderOf(s, t.id) !== 'lost' && !String(x.reason ?? '').trim()) { notes.push('a treasure taken needs the deed'); return []; }
  const out: Draft[] = [{ type: 'flag', fact: `${t.name} is now held by ${holder === 'li' ? 'Li' : holder}`, visible: true, data: { key: `treasure_${t.id}`, value: HOLDERS.indexOf(holder) + 1 } }];
  if (holder === 'li') out.push({ type: 'flag', fact: 'the great hear of it', visible: false, data: { key: 'rep_nobles', value: Math.min(100, reputation(s, 'nobles') + 20) } });
  return out;
}

// ── Governors (WB ch. 2, System A) ──

export const STATES = ['the Akaishi march', 'the Seikyō heartland', 'the North Gate state', 'the Iron Gate state', 'the Jōga river state', 'the Red Slope state'];
/** {kind:"governor", state}: the king appoints Li governor of a state of the kingdom he serves (from Sennin-shō, with the court's trust). */
export function governorDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const k = STATES.indexOf(String(x.state ?? ''));
  if (k < 0) { notes.push(`no state "${String(x.state)}" (${STATES.join(', ')})`); return []; }
  if (rankLevel(careerOf(s).rank) < rankLevel('senninsho') || !memberOf(s)) { notes.push('a governor is a Sennin-shō or higher with a place at court'); return []; }
  return [{ type: 'flag', fact: `Li is named governor of ${STATES[k]}`, visible: true, journal: `The king made me governor of ${STATES[k]}. I collect for the Crown now.`, data: { key: 'governor', value: k + 1 } }];
}

/** For Claude's memory. */
export function textureText(s: GameState): string {
  const mine = careerOf(s).kingdom;
  const next = FESTIVALS.filter((f) => !f.kingdom || f.kingdom === mine).map((f) => ({ f, d: ((f.month - 1) * 30 + f.day - 1 - (today(s) % 360) + 360) % 360 })).sort((a, b) => a.d - b.d)[0];
  return [
    `WEATHER this year: ${KINGDOMS.map((k) => `${k} ${weatherOf(s, k)}`).join(', ')} (it moves harvests; a drought in Suiren starves Tatara).`,
    pricesText(s),
    embargoes(s).length ? `EMBARGOES: ${embargoes(s).map((e) => `${e.from} → ${e.to}`).join(', ')}.` : '',
    `THE NEUTRAL POWERS Li can deal with (the code checks each): Kinza loans {"kind":"loan","ryo":n} (repay with "repay") and swords for hire {"kind":"hire","men":n,"months":n}; the Mist Valley finds one person's secret {"kind":"shinobi","target":"<id>"} (2 ryō); Mount Shōgen gives sanctuary {"kind":"shogen"} or takes gifts {"kind":"shogen","gift":n}; the Seiran exam in Kaisei {"kind":"exam"}.${has(s, 'debt_mon') ? ` LI OWES KINZA ${has(s, 'debt_mon')} mon (it grows 20% a year).` : ''}${mercsNow(s) ? ` ${mercsNow(s)} hired swords march with Li.` : ''}${has(s, 'sanctuary') ? ' Li is in sanctuary at Mount Shōgen: no one seizes him there.' : ''}`,
    `THE IMPERIAL TREASURES: ${TREASURES.map((t) => `${t.name}: ${holderOf(s, t.id) === 'lost' ? 'lost since the Burning (rumours: Suiren, Kurogane, the pirates)' : holderOf(s, t.id) === 'li' ? 'LI holds it' : holderOf(s, t.id)}`).join('; ')}. SECRET: the Sword lies sealed in the crypt under the burned throne hall of Amatsu-kyō. Move one with {"kind":"treasure","id":"seal|mirror|sword","holder":"...","reason":"..."}.`,
    has(s, 'governor') ? `Li is governor of ${STATES[has(s, 'governor') - 1]} (governing gives political merit each year).` : rankLevel(careerOf(s).rank) >= rankLevel('senninsho') ? `The king may name Li governor of a state ({"kind":"governor","state":"${STATES[0]}"}): ${STATES.join(', ')}.` : '',
    next ? `NEXT FESTIVAL: ${next.f.name} in ${next.d} days.` : '',
    atWar(s, mine) ? '' : '',
  ].filter(Boolean).join('\n');
}
