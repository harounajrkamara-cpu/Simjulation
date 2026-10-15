import { ageOn, dateFromIndex } from './calendar';
import { rankLevel } from './career';
import { has, li, met, today } from './engine';
import { careerOf } from './gm-career';
import { relSnapshot } from './relations';
import { Draft, GameState } from './types';

// Li's house: marriage and children (World Bible ch. 8 "Romance & marriage"; Stage 3 "land & family"; goal Oct 17, owner
// kan terugdraaien). Claude proposes; the code checks status, age and feelings, records it, and keeps the family in the
// memory. Numbers below are night choices, marked PROVISIONAL.

/** PROVISIONAL (goal Oct 17): ages, the love bar, time between children. */
export const FAMILY = { liMinAge: 16, spouseMinAge: 15, loveAffection: 70, loveTrust: 50, childEveryDays: 300, maxChildren: 6 } as const;

const NOBLE = /\b(?:Hagiwara|Ishizue|Tsurumaki|Kamio|Gōda|Ebisawa|Kirishima|Asagiri|lord|lady|princess|prince|heir|daughter of Lord)\b/i;
/** A person of a noble house (World Atlas houses, or a lord's family by role). */
export const isNoble = (s: GameState, id: string) => NOBLE.test(`${s.characters[id]?.name ?? ''} ${s.characters[id]?.role ?? ''}`);

export const spouseOf = (s: GameState): string | undefined => Object.keys(s.flags).find((k) => k.startsWith('spouse_') && s.flags[k] > 0)?.slice(7);
export const childrenOf = (s: GameState): string[] => Object.keys(s.characters).filter((id) => id.startsWith('child_'));

const slug = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);

/** A marriage Claude proposes: love (feelings) or alliance (standing); a low-born man marrying into a noble house needs a
 * great rank (World Bible: "low-born + noble is very hard"). */
export function marryDrafts(s: GameState, x: { npc?: unknown; alliance?: unknown; reason?: unknown }, notes: string[]): Draft[] {
  const c = li(s);
  const id = String(x.npc ?? '');
  const p = s.characters[id];
  const spouse = spouseOf(s);
  if (c.status === 'slave') { notes.push('a slave cannot marry'); return []; }
  if (ageOn(c.born, s.date) < FAMILY.liMinAge) { notes.push(`Li is too young to marry (${FAMILY.liMinAge})`); return []; }
  if (spouse && s.characters[spouse]?.alive) { notes.push(`Li is already married to ${s.characters[spouse].name}`); return []; }
  if (!p || id === s.liId || !p.alive || !met(s, id)) { notes.push(`no living person "${id}" Li knows to marry`); return []; }
  if (ageOn(p.born, s.date) < FAMILY.spouseMinAge) { notes.push(`${p.name} is too young to marry`); return []; }
  const v = relSnapshot(s.relations[id], today(s));
  const rank = rankLevel(careerOf(s).rank);
  const love = v.affection >= FAMILY.loveAffection && v.trust >= FAMILY.loveTrust;
  const alliance = x.alliance === true && rank >= rankLevel('sanbyakuninsho');
  if (!love && !alliance) { notes.push(`no marriage: ${p.name} does not love Li enough (affection ${Math.floor(v.affection)} of ${FAMILY.loveAffection}, trust ${Math.floor(v.trust)} of ${FAMILY.loveTrust}), and Li is too low for an alliance (Sanbyakunin-shō)`); return []; }
  if (isNoble(s, id) && rank < rankLevel('senninsho')) { notes.push(`no marriage: ${p.name}'s house will not marry into a low-born man's line below Sennin-shō`); return []; }
  return [
    { type: 'flag', fact: `Li marries ${p.name}${x.reason ? ` (${String(x.reason).slice(0, 80)})` : ''}`, visible: true, journal: `I married ${p.name}.`, data: { key: `spouse_${id}`, value: 1 } },
    { type: 'flag', fact: 'married', visible: false, data: { key: 'married', value: 1 } },
  ];
}

/** A child is born: only to a married Li whose spouse lives, at most one per CHILD_EVERY_DAYS. */
export function childDrafts(s: GameState, x: { name?: unknown; son?: unknown }, notes: string[]): Draft[] {
  const spouse = spouseOf(s);
  if (!spouse || !s.characters[spouse]?.alive) { notes.push('no child: Li has no living wife'); return []; }
  const kids = childrenOf(s);
  if (kids.length >= FAMILY.maxChildren) { notes.push('no more children'); return []; }
  const since = [...s.events].reverse().find((e) => e.type === 'person' && String((e.data as { id?: string }).id).startsWith('child_'))?.day
    ?? s.events.find((e) => (e.data as { key?: string }).key === `spouse_${spouse}`)?.day ?? today(s);
  const wait = (kids.length ? FAMILY.childEveryDays : 270) - (today(s) - since);
  if (wait > 0) { notes.push(`no child yet (${wait} more days)`); return []; }
  const name = String(x.name ?? '').trim().slice(0, 40);
  if (!name) { notes.push('a child needs a name'); return []; }
  const son = x.son !== false;
  const id = `child_${slug(name)}`;
  if (s.characters[id]) { notes.push(`there is already a child called ${name}`); return []; }
  const born = dateFromIndex(today(s));
  return [{ type: 'person', fact: `Li's ${son ? 'son' : 'daughter'} ${name} is born`, visible: true, journal: `My ${son ? 'son' : 'daughter'} ${name} was born.`,
    data: { id, name, role: `Li's ${son ? 'son' : 'daughter'}`, desc: `Li's ${son ? 'son' : 'daughter'}, born ${born.year}/${born.month}.`, goal: 'Grow up in his father\'s house.', base: { trust: 80, respect: 60, affection: 85, fear: 0, rivalry: 0 }, day: today(s), born: { year: born.year, month: born.month, day: born.day } } }];
}

/** For Claude's memory: Li's house. */
export function familyText(s: GameState): string {
  const spouse = spouseOf(s);
  if (!spouse) return li(s).status === 'slave' ? '' : `LI'S HOUSE: unmarried. A marriage (for love: affection ${FAMILY.loveAffection}+ and trust ${FAMILY.loveTrust}+; for alliance: Li Sanbyakunin-shō+; a noble house needs Sennin-shō+) with {"kind":"marry","npc":"<id>","alliance":false,"reason":"..."}.`;
  const kids = childrenOf(s).map((id) => `${s.characters[id].name} (${s.characters[id].role.replace("Li's ", '')}, age ${ageOn(s.characters[id].born, s.date)})`);
  return `LI'S HOUSE: married to ${s.characters[spouse].name}${s.characters[spouse].alive ? '' : ' (dead; Li may marry again)'}. Children: ${kids.join(', ') || 'none yet'}. A birth with {"kind":"child","name":"...","son":true|false} (the code allows one about every ${FAMILY.childEveryDays} days).`;
}

/** Children grow up: the memory shows ages; an heir comes of age at 15. */
export const heirOf = (s: GameState) => childrenOf(s).find((id) => s.characters[id].alive && ageOn(s.characters[id].born, s.date) >= 15 && has(s, `met_${id}`) > 0);
