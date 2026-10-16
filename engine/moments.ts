import { ageOn } from './calendar';
import { has, li, met, today } from './engine';
import { careerOf, titlesOf } from './gm-career';
import { rankLevel } from './career';
import { opinion, opinionLabel } from './relations';
import { rankScores } from './rules';
import { reputation } from './reputation';
import { liAbilities } from './abilities';
import { Draft, GameState } from './types';

// Big moments (Game Experience ch. 3, 3b; World Bible ch. 8): legend pages kept in the Journal, rumours about Li in Game
// Master mode, ceremonies with witnesses who react and remember, feasts, funerals and oaths, Li's own banner, nicknames per
// group. Phase 6 block D (audit gaps 20–22, 24, 25, 30), built Oct 17; PROVISIONAL numbers, owner kan terugdraaien.

export interface Rumour { id: string; text: string; day: number; about: string; reach: 0 | 1 | 2; true: boolean }
export const REACH = ['the camp', 'the kingdom', 'the whole land'] as const;
/** PROVISIONAL: a rumour reaches one step further each month; a true deed of Li's lifts his name when it does. */
export const RUMOUR_RULES = { soldiersAtKingdom: 3, noblesAtLand: 2, maxOpen: 8 } as const;

export const rumoursOf = (s: GameState): Rumour[] => (s.gm as { rumours?: Rumour[] } | undefined)?.rumours ?? [];
const rumourDraft = (r: Rumour, fact: string, visible = false): Draft => ({ type: 'talk', fact, visible, data: { rumour: r } });

/** A new rumour (from a deed, a legend, a title, or Claude's story). Only the newest few travel. */
export function newRumour(s: GameState, text: string, isTrue = true, about = s.liId): Draft[] {
  const t = text.trim().slice(0, 160);
  if (!t || rumoursOf(s).some((r) => r.text === t)) return [];
  return [rumourDraft({ id: `r${s.nextSeq}`, text: t, day: today(s), about, reach: 0, true: isTrue }, `A rumour starts: ${t}`, true)];
}

/** {kind:"rumour", text, false?:true, about?}: Claude starts talk in the world (true or not). */
export function rumourChangeDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const text = String(x.text ?? '');
  if (!text.trim()) { notes.push('a rumour needs its words'); return []; }
  const about = String(x.about ?? s.liId);
  if (!s.characters[about]) { notes.push(`no person "${about}" for the rumour`); return []; }
  return newRumour(s, text, x.false !== true, about);
}

/** Each month that ends: rumours travel one step; a true rumour about Li's deeds lifts his name as it goes. */
export function rumourTimeDrafts(s: GameState, from: number, to: number): Draft[] {
  let months = 0;
  for (let k = from + 1; k <= to; k++) if (k % 30 === 0) months++;
  if (!months) return [];
  const out: Draft[] = [];
  for (const r of rumoursOf(s).filter((x) => x.reach < 2).slice(-RUMOUR_RULES.maxOpen)) {
    const reach = Math.min(2, r.reach + months) as 0 | 1 | 2;
    out.push(rumourDraft({ ...r, reach }, `The talk spreads to ${REACH[reach]}: ${r.text}`, r.about === s.liId));
    if (r.about !== s.liId || !r.true) continue;
    if (r.reach < 1 && reach >= 1) out.push({ type: 'flag', fact: 'soldiers hear of Li', visible: false, data: { key: 'rep_soldiers', value: Math.min(100, reputation(s, 'soldiers') + RUMOUR_RULES.soldiersAtKingdom) } });
    if (r.reach < 2 && reach >= 2) out.push({ type: 'flag', fact: 'nobles hear of Li', visible: false, data: { key: 'rep_nobles', value: Math.min(100, reputation(s, 'nobles') + RUMOUR_RULES.noblesAtLand) } });
  }
  return out;
}

// ── Witnesses (GE 3b step 4): the people Li knows who are there ──

export function witnessesHere(s: GameState, max = 6): string[] {
  const c = li(s);
  return Object.keys(s.characters).filter((id) => id !== s.liId && met(s, id) && s.characters[id].alive && s.characters[id].location === c.location && s.relations[id]).slice(0, max);
}
const reactionOf = (s: GameState, id: string) => {
  const op = opinion(s.relations[id], today(s));
  return op >= 30 ? 'proud of him' : op >= 10 ? 'pleased' : op > -10 ? 'watches without a word' : op > -30 ? 'cold' : 'looks away, bitter';
};
const witnessMemory = (s: GameState, id: string, what: string): Draft => ({ type: 'memory', fact: `${s.characters[id].name} remembers: ${what}`, visible: false, data: { npc: id, what, source: 'saw', certainty: 100, weight: 60 } });

export interface CeremonyView { title: string; kind: string; rows: { name: string; role: string; reaction: string }[] }
/** Who stands where and how each reacts, by their own opinion (GE ch. 3 "Ceremony"). */
export function ceremonyView(s: GameState, title: string, kind: string): CeremonyView {
  return { title, kind, rows: witnessesHere(s).map((id) => ({ name: s.characters[id].name, role: s.characters[id].role, reaction: reactionOf(s, id) })) };
}

/** A ceremony's witnesses remember it (ch. 8); the story event carries the screen. */
export function ceremonyWitnessDrafts(s: GameState, title: string, kind: string, what: string): Draft[] {
  const view = ceremonyView(s, title, kind);
  return [
    { type: 'story', fact: `${title}: ${view.rows.map((r) => `${r.name} ${r.reaction}`).join('; ') || 'no one Li knows is there'}`, visible: false, data: { ceremonyView: view } },
    ...witnessesHere(s).map((id) => witnessMemory(s, id, what)),
  ];
}

/** {kind:"gathering", what:"feast|funeral|oath|wedding", npc?, reason}: a gathering with witnesses (GE 3b ceremonies). */
export function gatheringDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  const what = String(x.what ?? '');
  const why = String(x.reason ?? '').trim().slice(0, 140);
  const npc = String(x.npc ?? '');
  const p = s.characters[npc];
  if (!['feast', 'funeral', 'oath', 'wedding'].includes(what)) { notes.push(`no gathering "${what}" (feast, funeral, oath, wedding)`); return []; }
  if (!why) { notes.push(`a ${what} needs its reason`); return []; }
  const out: Draft[] = [];
  if (what === 'funeral') {
    if (!p || p.alive) { notes.push('a funeral is for someone who has died'); return []; }
    out.push(...ceremonyWitnessDrafts(s, `The funeral of ${p.name}`, what, `stood with Li at ${p.name}'s funeral`));
    for (const id of witnessesHere(s)) out.push({ type: 'relation', fact: `${s.characters[id].name} grieved beside Li`, visible: false, data: { npc: id, field: 'affection', value: 3, reason: 'shared grief', fade: 1095 } });
  } else if (what === 'oath') {
    if (!p || !p.alive || !met(s, npc)) { notes.push('an oath is sworn by someone Li knows'); return []; }
    if (has(s, `oath_${npc}`)) { notes.push(`${p.name} is already sworn to Li`); return []; }
    out.push(...ceremonyWitnessDrafts(s, `${p.name} swears an oath to Li`, what, `saw ${p.name} swear to Li`));
    out.push({ type: 'flag', fact: `${p.name} is sworn to Li (oath: loyalty +10)`, visible: true, journal: `${p.name} swore an oath to me. I will not make it a burden.`, data: { key: `oath_${npc}`, value: 1 } });
  } else if (what === 'feast') {
    if (rankLevel(careerOf(s).rank) < rankLevel('kogashira') && !s.domain) { notes.push('Li cannot hold a feast yet: no men of his own and no hall'); return []; }
    out.push(...ceremonyWitnessDrafts(s, 'A feast', what, 'feasted with Li'));
    out.push({ type: 'flag', fact: 'the feast is talked about', visible: false, data: { key: 'rep_soldiers', value: Math.min(100, reputation(s, 'soldiers') + 2) } });
  } else {
    out.push(...ceremonyWitnessDrafts(s, `A wedding${p ? `: ${p.name}` : ''}`, what, 'saw the wedding'));
  }
  out.unshift({ type: 'story', fact: `${what[0].toUpperCase()}${what.slice(1)}: ${why}`, visible: true, data: {} });
  return out;
}

// ── Li's own unit: name and banner (GE 3b, like Shin's Hi Shin unit) ──

export const BANNER_RANK = 'hyakuningashira';
export const bannerOf = (s: GameState): string | undefined => s.gm?.threads.find((t) => t.id === 'li_banner')?.text;

/** {kind:"banner", name, sign}: Li's unit takes a name and a banner, from Hyakunin-gashira (PROVISIONAL). */
export function bannerDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  if (bannerOf(s)) { notes.push('Li\'s unit already has its name'); return []; }
  if (rankLevel(careerOf(s).rank) < rankLevel(BANNER_RANK)) { notes.push('a unit of his own with a name and banner comes at Hyakunin-gashira'); return []; }
  const name = String(x.name ?? '').trim().slice(0, 40);
  const sign = String(x.sign ?? '').trim().slice(0, 60);
  if (!name || !sign) { notes.push('a banner needs the unit\'s name and its sign'); return []; }
  return [{ type: 'thread', fact: `Li's unit is named: ${name} (${sign})`, visible: true, journal: `My men have a name now: ${name}. Our banner: ${sign}.`, data: { id: 'li_banner', text: `${name} — ${sign}`, open: false } }];
}

// ── Nicknames per group (GE 3b: the world decides, from deeds and witnesses; soldiers vs nobles vs enemies) ──

export const NICKNAME_GROUPS = ['soldiers', 'nobles', 'peasants', 'enemies'] as const;
/** PROVISIONAL: a group names Li only after a deed in the last 60 days, and when it has heard of him (regard 10+). */
export const NICKNAME_RULES = { recentDays: 60, regard: 10 } as const;
export function recentDeed(s: GameState): boolean {
  const from = today(s) - NICKNAME_RULES.recentDays;
  return s.events.some((e) => e.day >= from && ((e.type === 'flag' && /^merit_(combat|command|political)$/.test(String((e.data as { key?: string }).key))) || (e.type === 'story' && (e.data as { result?: string }).result === 'won')));
}
/** Titles per group, oldest first ("all" for those from before groups). */
export function nicknamesByGroup(s: GameState): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const e of s.events) {
    const d = e.data as { title?: unknown; group?: string };
    if (e.type === 'knowledge' && typeof d.title === 'string') (out[d.group ?? 'all'] ??= []).push(d.title);
  }
  return out;
}

// ── Legend moments (GE 3b) ──

interface Legend { id: string; title: string; native?: string; meaning?: string; screen: boolean; test: (s: GameState) => boolean; rumour: string }
const S_RANKED = ['otori_gensai', 'kagami_soun', 'garyu_tessai', 'kinugasa_ayane'];
const RIVALS = ['akabane_hayame', 'kirishima_ryunosuke', 'kagami_shion', 'shiramine_tsubasa', 'nagi_shoma'];
export const LEGENDS: Legend[] = [
  { id: 'zone', title: 'SHINKEN NO RYŪ', native: '真剣の龍', meaning: 'the dragon of the true blade', screen: true, test: (s) => liAbilities(s).some((a) => a.id === 'zone'), rumour: 'they say the slave boy fought like a thing possessed when he should have died' },
  { id: 'nickname', title: 'A name of his own', native: '名', meaning: 'the world gives him a name', screen: true, test: (s) => titlesOf(s).length > 0, rumour: 'the men have a name for the boy now' },
  { id: 'freedom', title: 'Free', native: '自由', meaning: 'the paper burns', screen: false, test: (s) => has(s, 'gm_mode') > 0 && li(s).status !== 'slave', rumour: 'the Red Crane\'s slave boy is a free man' },
  { id: 'first_head', title: 'The first officer\'s head', native: '首', meaning: 'an enemy officer falls to him', screen: true, test: (s) => has(s, 'kogashira_head') > 0, rumour: 'a boy took an enemy officer\'s head' },
  { id: 'genpuku', title: 'Genpuku', native: '元服', meaning: 'he comes of age', screen: true, test: (s) => has(s, 'genpuku_li') > 0, rumour: 'the young soldier has come of age' },
  { id: 'first_command', title: 'First command', native: '伍長', meaning: 'five men follow him', screen: true, test: (s) => has(s, 'rank_level') >= 1, rumour: 'the former slave leads men now' },
  { id: 'banner', title: 'His own banner', native: '旗', meaning: 'his men have a name', screen: true, test: (s) => !!bannerOf(s), rumour: 'there is a new banner on the field' },
  { id: 'first_land', title: 'Land of his own', native: '領地', meaning: 'a village is his', screen: false, test: (s) => !!s.domain, rumour: 'the commoner officer was given land' },
  { id: 'father', title: 'The truth', native: '真実', meaning: 'how his father really died', screen: false, test: (s) => s.knowledge.includes('father_truth'), rumour: '' },
  { id: 'family', title: 'Found', native: '家族', meaning: 'his mother and sisters', screen: false, test: (s) => s.knowledge.includes('family_found'), rumour: '' },
  { id: 'pillar', title: 'A Pillar of the kingdom', native: '柱', meaning: 'a seat among the Six Pillars', screen: true, test: (s) => titlesOf(s).some((t) => /pillar/i.test(t)), rumour: 'a new Pillar sits in Seikyō' },
  { id: 's_rank', title: 'S', native: '無双', meaning: 'one of the few', screen: true, test: (s) => rankScores(li(s)).overall >= 90, rumour: 'they speak of him like the old legends now' },
  { id: 's_meeting', title: 'A living legend', native: '覇気', meaning: 'he feels the aura of an S-rank', screen: true, test: (s) => S_RANKED.some((id) => met(s, id)), rumour: '' },
  { id: 'rival', title: 'A rival', native: '宿敵', meaning: 'one of his own age, his equal', screen: true, test: (s) => RIVALS.some((id) => met(s, id)), rumour: '' },
  { id: 'friend_death', title: 'A friend falls', native: '別れ', meaning: 'it is remembered forever', screen: true, test: (s) => Object.keys(s.relations).some((id) => met(s, id) && s.characters[id] && !s.characters[id].alive && (s.relations[id].base.affection >= 70)), rumour: '' },
];

/** New legend moments: a page in the Journal, a screen for the big ones, witnesses who remember, a rumour. Once each. */
export function legendDrafts(s: GameState): Draft[] {
  const out: Draft[] = [];
  for (const L of LEGENDS) {
    if (has(s, `legend_${L.id}`) || !L.test(s)) continue;
    const ws = witnessesHere(s);
    const names = ws.map((id) => s.characters[id].name);
    const card = { label: 'Legend moment', title: L.title, native: L.native, meaning: L.meaning, witnesses: names.length ? `Seen by: ${names.join(' · ')}` : 'Seen by: nobody Li knows' };
    out.push({ type: 'flag', fact: `legend: ${L.id}`, visible: false, data: { key: `legend_${L.id}`, value: 1 } });
    out.push({ type: 'story', fact: `Legend: ${L.title}${L.meaning ? ` — ${L.meaning}` : ''}.`, visible: true, journal: `Legend: ${L.title}.`, data: { id: `legend_${L.id}`, tier: L.screen ? 'legend' : 'page', card, legendPage: { id: L.id, ...card, age: ageOn(li(s).born, s.date) } } });
    for (const id of ws) out.push(witnessMemory(s, id, `was there when Li: ${L.meaning ?? L.title}`));
    if (L.rumour) out.push(...newRumour(s, L.rumour));
  }
  return out;
}

/** The Journal's legend pages, oldest first (Game Master legends and the chronicle's own legend moments). */
export function legendPages(s: GameState): { title: string; meaning?: string; witnesses?: string; day: number }[] {
  return s.events.filter((e) => e.type === 'story' && ((e.data as { legendPage?: unknown }).legendPage || (e.data as { tier?: string }).tier === 'legend'))
    .map((e) => { const c = (e.data as { card?: { title: string; meaning?: string; witnesses?: string } }).card; return { title: c?.title ?? e.fact, meaning: c?.meaning, witnesses: c?.witnesses, day: e.day }; });
}

/** For Claude's memory. */
export function momentsText(s: GameState): string {
  const rs = rumoursOf(s).slice(-6).map((r) => `- [${REACH[r.reach]}] ${r.text}${r.true ? '' : ' (NOT TRUE)'}${r.about !== s.liId ? ` (about ${s.characters[r.about]?.name ?? r.about})` : ''}`);
  const nick = Object.entries(nicknamesByGroup(s)).map(([g, t]) => `${g === 'all' ? 'People' : g[0].toUpperCase() + g.slice(1)} call him ${t.map((x) => `"${x}"`).join(', ')}`);
  const banner = bannerOf(s);
  return [
    rs.length ? `WHAT PEOPLE SAY (rumours travel a step a month; start one with {"kind":"rumour","text":"...","false":true if it is a lie}):\n${rs.join('\n')}` : 'No talk about Li yet. Start a rumour with {"kind":"rumour","text":"..."} when people would talk.',
    nick.length ? `${nick.join('. ')}. A new name comes only from a deed with witnesses: {"kind":"title","title":"...","group":"soldiers|nobles|peasants|enemies","reason":"the deed"}.` : '',
    banner ? `Li's unit: ${banner}.` : rankLevel(careerOf(s).rank) >= rankLevel(BANNER_RANK) ? 'Li leads a hundred: his unit may take a name and banner ({"kind":"banner","name":"...","sign":"..."}) when the story gets there.' : '',
    'Gatherings with witnesses: {"kind":"gathering","what":"feast|funeral|oath|wedding","npc":"<id>","reason":"..."} (an oath binds a man to Li).',
  ].filter(Boolean).join('\n');
}
