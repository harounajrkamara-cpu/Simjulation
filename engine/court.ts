import { rankLevel } from './career';
import { has } from './engine';
import { careerOf } from './gm-career';
import { Draft, GameState } from './types';

// The court (Stage 4: "court & kingdoms"; World Bible ch. 13 factions, World Atlas houses; goal Oct 17, owner kan
// terugdraaien). Li's standing with each faction of Kurogane's court, moved by what he does (Claude proposes, ±10 a
// scene with a reason), and membership of one faction once he is a general. The great crises themselves stay the fuses
// (engine/fuses.ts); the court is where a general takes sides. PROVISIONAL numbers.

export const FACTIONS = [
  { id: 'old_blood', name: 'the Old Blood', head: 'Tsurumaki Sanetaka', wants: 'noble privilege back and the merit law gone', hatesLowBorn: true },
  { id: 'kings_men', name: "the King's Men", head: 'Kamio Ujihide (with Kirishima Hyōe)', wants: 'the young king ruling alone at twenty', hatesLowBorn: false },
  { id: 'favourite', name: "the Favourite's faction", head: 'Gōda Ensai', wants: 'power through the Queen Mother', hatesLowBorn: false },
  { id: 'chancellor', name: "the Chancellor's House", head: 'Chancellor Ebisawa Rokusai', wants: 'to keep governing after the king comes of age', hatesLowBorn: false },
] as const;
export type FactionId = (typeof FACTIONS)[number]['id'];

/** PROVISIONAL (goal Oct 17): per-scene change, the rank that opens the court, the standing to be let in. */
export const COURT = { delta: 10, joinRank: 'senninsho', joinStanding: 30 } as const;

const key = (f: FactionId) => `court_${f}`;
/** Standing −100..100, stored offset by 100 in a flag (flags hold counts). */
export const standing = (s: GameState, f: FactionId) => (s.flags[key(f)] ?? 100) - 100;
export const memberOf = (s: GameState): FactionId | undefined => FACTIONS[has(s, 'court_member') - 1]?.id;

/** A faction change: standing moves (any rank: even a soldier makes friends and enemies), or Li joins/leaves (generals). */
export function factionDrafts(s: GameState, x: { faction?: unknown; delta?: unknown; join?: unknown; leave?: unknown; reason?: unknown }, notes: string[]): Draft[] {
  const k = FACTIONS.findIndex((f) => f.id === x.faction);
  if (k < 0) { notes.push(`no court faction "${String(x.faction)}"`); return []; }
  const f = FACTIONS[k];
  if (x.leave) return memberOf(s) === f.id ? [{ type: 'flag', fact: `Li leaves ${f.name}`, visible: true, data: { key: 'court_member', value: 0 } }] : [];
  if (x.join) {
    if (rankLevel(careerOf(s).rank) < rankLevel(COURT.joinRank)) { notes.push(`${f.name} does not take men below Sennin-shō`); return []; }
    if (standing(s, f.id) < COURT.joinStanding) { notes.push(`${f.name} does not trust Li enough (standing ${standing(s, f.id)} of ${COURT.joinStanding})`); return []; }
    if (f.hatesLowBorn && careerOf(s).bond === 'freed') { notes.push(`${f.name} will never take a freed slave`); return []; }
    // Changing sides costs the old side's trust (review Oct 17: a switch was silent).
    const old = FACTIONS.find((o) => o.id === memberOf(s) && o.id !== f.id);
    return [
      ...(old ? [{ type: 'flag' as const, fact: `Li leaves ${old.name} for ${f.name}`, visible: true, data: { key: key(old.id), value: Math.max(-100, standing(s, old.id) - 30) + 100 } }] : []),
      { type: 'flag', fact: `Li joins ${f.name}`, visible: true, journal: `I have chosen a side at court: ${f.name}.`, data: { key: 'court_member', value: k + 1 } },
    ];
  }
  const d = Math.max(-COURT.delta, Math.min(COURT.delta, Math.round(Number(x.delta) || 0)));
  if (!d) return [];
  const next = Math.max(-100, Math.min(100, standing(s, f.id) + d));
  return [{ type: 'flag', fact: `${f.name}: ${d > 0 ? '+' : ''}${d} (${String(x.reason ?? '').slice(0, 80)})`, visible: false, data: { key: key(f.id), value: next + 100 } }];
}

/** For Claude's memory: the court as Li stands with it. Shown from Hyakunin-gashira up (before that the court is far). */
export function courtText(s: GameState): string {
  if (rankLevel(careerOf(s).rank) < rankLevel('hyakuningashira') && !FACTIONS.some((f) => s.flags[key(f.id)] !== undefined)) return '';
  const m = memberOf(s);
  const word = (v: number) => (v >= 60 ? 'trusts him' : v >= 20 ? 'favours him' : v > -20 ? 'watches him' : v > -60 ? 'distrusts him' : 'wants him gone');
  return [
    `THE COURT OF KUROGANE (factions; change Li's standing with {"kind":"faction","faction":"<id>","delta":<-${COURT.delta}..${COURT.delta}>,"reason":"..."}; from Sennin-shō a general may join one with "join":true):`,
    ...FACTIONS.map((f) => `- [${f.id}] ${f.name} (${f.head}; wants ${f.wants}): ${word(standing(s, f.id))} (${standing(s, f.id)})${m === f.id ? ' — LI IS A MEMBER' : ''}.`),
  ].join('\n');
}

/** What Li feels at court, for the Li tab (no numbers). */
export function courtFeelings(s: GameState): string[] {
  if (!FACTIONS.some((f) => s.flags[key(f.id)] !== undefined) && !memberOf(s)) return [];
  return FACTIONS.map((f) => {
    const v = standing(s, f.id);
    return `${f.name}: ${memberOf(s) === f.id ? 'his side' : v >= 20 ? 'friendly' : v > -20 ? 'watching' : 'hostile'}`;
  });
}
