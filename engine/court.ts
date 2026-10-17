import { influenceCap } from './abilities';
import { KingdomId, rankLevel } from './career';
import { has } from './engine';
import { careerOf } from './gm-career';
import { discontent, discontentWord } from './discontent';
import { Draft, GameState } from './types';

// The court (Stage 4: "court & kingdoms"; World Bible ch. 13 "The seven profiles" factions, World Atlas houses; goal Oct
// 17, owner kan terugdraaien). Li's standing with the factions of the kingdom he serves, moved by what he does (Claude
// proposes, ±10 a scene with a reason), and membership of one faction once he is a general. The great crises stay the
// fuses (engine/fuses.ts); the court is where a general takes sides. Tatara has no factions (total unity). PROVISIONAL.

interface Faction { id: string; kingdom: KingdomId; name: string; head: string; wants: string; hatesLowBorn: boolean }
const F = (kingdom: KingdomId, id: string, name: string, head: string, wants: string, hatesLowBorn = false): Faction => ({ id, kingdom, name, head, wants, hatesLowBorn });

/** Every court faction (Kurogane's ids are the first ones, kept as they were). */
export const ALL_FACTIONS: Faction[] = [
  F('kurogane', 'old_blood', 'the Old Blood', 'Tsurumaki Sanetaka', 'noble privilege back and the merit law gone', true),
  F('kurogane', 'kings_men', "the King's Men", 'Kamio Ujihide (with Kirishima Hyōe)', 'the young king ruling alone at twenty'),
  F('kurogane', 'favourite', "the Favourite's faction", 'Gōda Ensai', 'power through the Queen Mother'),
  F('kurogane', 'chancellor', "the Chancellor's House", 'Chancellor Ebisawa Rokusai', 'to keep governing after the king comes of age'),
  F('suiren', 'suiren_families', 'the Three Families', 'the heads of Shirasagi, Akabane and Kinugasa', 'the court split among themselves, and no reform', true),
  F('suiren', 'suiren_reformers', 'the Reformers', 'a few frightened officials', 'reform without being murdered for it'),
  F('suiren', 'suiren_border', 'the Border Lords', 'the eastern march lords', 'thanks and pay for the men who fight'),
  F('hayate', 'hayate_generals', 'the Generals', 'Kagami Sōun and the great generals', 'a king who trusts his armies'),
  F('hayate', 'hayate_favourite', "the Favourite's men", 'the minister Ugaki Jōan', 'the king\'s ear, and silver from anyone'),
  F('ushio', 'ushio_regent', "the Regent's House", 'Regent Tagami Kanemitsu', 'the throne, slowly and with the people\'s love'),
  F('ushio', 'ushio_royalists', 'the Old Royalists', 'the old court families', 'the child king safe on his throne'),
  F('ushio', 'ushio_trade', 'the Trade Council', 'the great merchant houses', 'open harbours and low tolls'),
  F('takane', 'takane_loyalists', 'the Loyalists', 'the main house of King Kiriyama', 'the kingdom as it is'),
  F('takane', 'takane_ambitious', 'the Ambitious', 'a young, proud house head', 'a seat at the top table'),
  F('takane', 'takane_separatists', 'the Separatists', 'Sakaguchi Sadatomo of the pass', 'the pass for themselves, with Hayate behind them'),
  F('kitakaze', 'kitakaze_crown', 'the Crown', 'King Fuyutsuki Takamune', 'the war chiefs bound to the king'),
  F('kitakaze', 'kitakaze_chiefs', 'the War Chiefs', 'the five war chiefs', 'their say over every great war'),
];
/** Kurogane's court, as before (tests and saves use these ids). */
export const FACTIONS = ALL_FACTIONS.filter((f) => f.kingdom === 'kurogane');
export type FactionId = string;

/** PROVISIONAL (goal Oct 17): per-scene change, the rank that opens the court, the standing to be let in. */
export const COURT = { delta: 10, joinRank: 'senninsho', joinStanding: 30 } as const;

const key = (f: FactionId) => `court_${f}`;
/** Standing −100..100, stored offset by 100 in a flag (flags hold counts). */
export const standing = (s: GameState, f: FactionId) => (s.flags[key(f)] ?? 100) - 100;
export const memberOf = (s: GameState): FactionId | undefined => ALL_FACTIONS[has(s, 'court_member') - 1]?.id;
/** The court of the kingdom Li serves. */
export const courtOf = (s: GameState) => ALL_FACTIONS.filter((f) => f.kingdom === careerOf(s).kingdom);

/** A faction change: standing moves with any faction (friends and enemies abroad too); Li joins only his own court. */
export function factionDrafts(s: GameState, x: { faction?: unknown; delta?: unknown; join?: unknown; leave?: unknown; discontent?: unknown; reason?: unknown }, notes: string[]): Draft[] {
  const k = ALL_FACTIONS.findIndex((f) => f.id === x.faction);
  if (k < 0) { notes.push(`no court faction "${String(x.faction)}"`); return []; }
  const f = ALL_FACTIONS[k];
  if (x.discontent !== undefined) {
    // Li stirs a faction up or calms it down (goal Oct 17): at most ±10 a scene, with a reason.
    const dd = Math.max(-COURT.delta, Math.min(COURT.delta, Math.round(Number(x.discontent) || 0)));
    return dd ? [{ type: 'flag', fact: `${f.name} discontent ${dd > 0 ? '+' : ''}${dd} (${String(x.reason ?? '').slice(0, 80)})`, visible: false, data: { key: `disc_${f.id}`, value: Math.max(0, Math.min(99, discontent(s, f.id) + dd)) } }] : [];
  }
  if (x.leave) return memberOf(s) === f.id ? [{ type: 'flag', fact: `Li leaves ${f.name}`, visible: true, data: { key: 'court_member', value: 0 } }] : [];
  if (x.join) {
    if (f.kingdom !== careerOf(s).kingdom) { notes.push(`${f.name} is a faction of another kingdom's court`); return []; }
    if (rankLevel(careerOf(s).rank) < rankLevel(COURT.joinRank)) { notes.push(`${f.name} does not take men below Sennin-shō`); return []; }
    if (standing(s, f.id) < COURT.joinStanding) { notes.push(`${f.name} does not trust Li enough (standing ${standing(s, f.id)} of ${COURT.joinStanding})`); return []; }
    if (f.hatesLowBorn && careerOf(s).bond === 'freed') { notes.push(`${f.name} will never take a freed slave`); return []; }
    // Changing sides costs the old side's trust (review Oct 17: a switch was silent).
    const old = ALL_FACTIONS.find((o) => o.id === memberOf(s) && o.id !== f.id);
    return [
      ...(old ? [{ type: 'flag' as const, fact: `Li leaves ${old.name} for ${f.name}`, visible: true, data: { key: key(old.id), value: Math.max(-100, standing(s, old.id) - 30) + 100 } }] : []),
      { type: 'flag', fact: `Li joins ${f.name}`, visible: true, journal: `I have chosen a side at court: ${f.name}.`, data: { key: 'court_member', value: k + 1 } },
    ];
  }
  const cap = influenceCap(s, COURT.delta); // Silver Tongue: ±15
  const d = Math.max(-cap, Math.min(cap, Math.round(Number(x.delta) || 0)));
  if (!d) return [];
  const next = Math.max(-100, Math.min(100, standing(s, f.id) + d));
  return [{ type: 'flag', fact: `${f.name}: ${d > 0 ? '+' : ''}${d} (${String(x.reason ?? '').slice(0, 80)})`, visible: false, data: { key: key(f.id), value: next + 100 } }];
}

const KINGDOM = (k: KingdomId) => `${k[0].toUpperCase()}${k.slice(1)}`;

/** For Claude's memory: the court Li serves, as he stands with it. From Hyakunin-gashira up (before that it is far). */
export function courtText(s: GameState): string {
  const court = courtOf(s);
  const kingdom = careerOf(s).kingdom;
  if (rankLevel(careerOf(s).rank) < rankLevel('hyakuningashira') && !court.some((f) => s.flags[key(f.id)] !== undefined)) return '';
  if (!court.length) return `THE COURT OF ${KINGDOM(kingdom).toUpperCase()}: no factions; the king rules alone and is obeyed in everything.`;
  const m = memberOf(s);
  const word = (v: number) => (v >= 60 ? 'trusts him' : v >= 20 ? 'favours him' : v > -20 ? 'watches him' : v > -60 ? 'distrusts him' : 'wants him gone');
  return [
    `THE COURT OF ${KINGDOM(kingdom).toUpperCase()} (factions; change Li's standing with {"kind":"faction","faction":"<id>","delta":<-${COURT.delta}..${COURT.delta}>,"reason":"..."}; from Sennin-shō a general may join one with "join":true):`,
    ...court.map((f) => `- [${f.id}] ${f.name} (${f.head}; wants ${f.wants}): ${word(standing(s, f.id))} (${standing(s, f.id)}); the faction is ${discontentWord(discontent(s, f.id))} (discontent ${Math.round(discontent(s, f.id))} of 100, ultimatum at 100)${m === f.id ? ' — LI IS A MEMBER' : ''}.`),
    'What Li does can stir a faction or calm it: {"kind":"faction","faction":"<id>","discontent":<-10..10>,"reason":"..."}.',
  ].join('\n');
}

/** What Li feels at the court he serves, for the Li tab (no numbers). */
export function courtFeelings(s: GameState): string[] {
  const court = courtOf(s);
  if (!court.some((f) => s.flags[key(f.id)] !== undefined) && !memberOf(s)) return [];
  return court.map((f) => {
    const v = standing(s, f.id);
    return `${f.name}: ${memberOf(s) === f.id ? 'his side' : v >= 20 ? 'friendly' : v > -20 ? 'watching' : 'hostile'}`;
  });
}
