import { Character, GameState, Relation, RelField, StatKey } from './types';

// Start data for stage 1, taken from WORLD_ATLAS.md §4 and WORLD_BIBLE.md ch. 10.
// Exact stats follow the Atlas ranks via Numbers §1.

type CharSeed = Omit<Character, 'wound' | 'healDays' | 'fatigue' | 'alive'>;

const st = (LEA: number, VAL: number, INT: number, POL: number): Record<StatKey, number> => ({ LEA, VAL, INT, POL });

export const PLACES: Record<string, string> = {
  kori_camp: 'Red Crane camp, below Kōri fort (Akaishi province, Kurogane)',
  sasabe: 'Sasabe village',
  akaishi: 'Akaishi castle town',
};

const SEEDS: CharSeed[] = [
  {
    id: 'li', name: 'Li', born: { year: 87, month: 11, day: 3 }, role: 'slave of the Red Crane band', status: 'slave',
    stats: st(6, 14, 17, 5), potential: st(95, 97, 86, 72),
    styles: { two_swords: 6, unarmed: 4 },
    skills: { endurance: 25, camp_work: 30, horse_care: 20, medicine: 12, reading: 15, stealth: 15, observation: 20 },
    traits: ['quiet', 'watchful', 'stubborn', 'protective of the weak', 'hides his anger', 'fears fire at night'],
    location: 'kori_camp', desc: 'Twelve years old, thin, small for his age. A slave of the Red Crane band.',
  },
  {
    id: 'raizen', name: 'Mikumo Raizen', born: { year: 53, month: 4, day: 18 }, role: 'rōnin, leader of the Red Crane band', status: 'ronin',
    stats: st(52, 88, 60, 35), potential: st(60, 99, 70, 45), styles: { sword: 90 }, skills: { tactics: 55 },
    traits: ['hard', 'keeps his contracts', 'drinks'], location: 'kori_camp',
    desc: '"The Red Crane". A famous rōnin with a stiff left knee. He owns Li.', publicRank: 'Warrior A? (famous)',
  },
  {
    id: 'gonza', name: 'Gonza "One-Ear"', born: { year: 60, month: 7, day: 2 }, role: "Raizen's second", status: 'free',
    stats: st(30, 50, 25, 15), potential: st(35, 55, 30, 20), styles: { spear: 48 }, skills: {},
    traits: ['cruel', 'greedy'], location: 'kori_camp', desc: 'Missing his left ear. Hits slaves for fun.', publicRank: 'Warrior C?',
  },
  {
    id: 'rokubei', name: 'Matsukaze Rokubei', born: { year: 65, month: 2, day: 20 }, role: 'quartermaster', status: 'free',
    stats: st(25, 20, 38, 40), potential: st(30, 25, 45, 50), styles: {}, skills: { administration: 50 },
    traits: ['careful', 'counts everything'], location: 'kori_camp', desc: 'Keeps the money, the stores and the slave papers.', publicRank: '?',
  },
  {
    id: 'hisame', name: 'Hisame', born: { year: 72, month: 9, day: 9 }, role: 'archer of the band', status: 'free',
    stats: st(35, 58, 45, 20), potential: st(40, 65, 55, 25), styles: { bow: 66 }, skills: { stealth: 60 },
    traits: ['silent', 'sees everything'], location: 'kori_camp', desc: 'A silent archer who rarely speaks to anyone.', publicRank: 'Warrior B? (bow)',
  },
  {
    id: 'sukezo', name: 'Old Sukezō', born: { year: 37, month: 1, day: 15 }, role: 'slave cook and medic', status: 'slave',
    stats: st(10, 10, 45, 25), potential: st(10, 10, 50, 30), styles: {}, skills: { medicine: 55, reading: 60, cooking: 60 },
    traits: ['kind', 'patient'], location: 'kori_camp', desc: 'The old slave cook. He taught Li his first letters.', publicRank: '–',
  },
  {
    id: 'hachi', name: 'Hachi', born: { year: 88, month: 6, day: 1 }, role: 'slave boy', status: 'slave',
    stats: st(8, 8, 22, 12), potential: st(40, 35, 70, 55), styles: {}, skills: { stealth: 25 },
    traits: ['small', 'clever', 'scared of Gonza'], location: 'kori_camp', desc: 'Eleven, small and clever. Li\'s friend.', publicRank: '–',
  },
  {
    id: 'sayo', name: 'Hagiwara Sayo', born: { year: 87, month: 3, day: 25 }, role: "the border lord's daughter", status: 'noble',
    stats: st(20, 12, 42, 30), potential: st(45, 25, 80, 80), styles: {}, skills: { reading: 70 },
    traits: ['bright', 'curious'], location: 'akaishi', desc: 'The daughter of Lord Hagiwara of Akaishi.', publicRank: '?',
  },
  {
    id: 'kaname', name: 'Kaname', born: { year: 85, month: 8, day: 12 }, role: "headman's daughter of Sasabe", status: 'free',
    stats: st(20, 34, 25, 15), potential: st(55, 80, 50, 35), styles: { naginata: 30 }, skills: {},
    traits: ['fierce', 'proud'], location: 'sasabe', desc: 'A fierce girl from Sasabe who trains with a naginata.', publicRank: 'Warrior D?',
  },
  {
    id: 'daisuke', name: 'Ōno Daisuke', born: { year: 87, month: 5, day: 30 }, role: 'farm boy of Sasabe', status: 'free',
    stats: st(18, 32, 15, 10), potential: st(60, 85, 45, 30), styles: { spear: 28 }, skills: {},
    traits: ['strong', 'loud', 'competitive'], location: 'sasabe', desc: 'A big, strong farm boy from Sasabe.', publicRank: 'Warrior D?',
  },
  {
    id: 'ishizue', name: 'Ishizue Gonroku', born: { year: 60, month: 10, day: 5 }, role: 'commander of Kōri fort (Sanbyakunin-shō)', status: 'noble',
    stats: st(42, 52, 35, 30), potential: st(48, 58, 40, 35), styles: { sword: 50 }, skills: {},
    traits: ['proud', 'despises mercenaries'], location: 'kori_camp', desc: 'Commander of Kōri fort. He despises mercenaries and slaves.', publicRank: 'Warrior C?',
  },
];

/** How each NPC sees Li at the start (trust, respect, affection, fear, rivalry). */
const REL_START: Record<string, [number, number, number, number, number]> = {
  raizen: [50, 40, 40, 0, 0], // owner: cool, not hostile
  gonza: [35, 30, 15, 0, 0],
  rokubei: [50, 45, 45, 0, 0],
  hisame: [55, 45, 50, 0, 0],
  sukezo: [70, 55, 75, 0, 0],
  hachi: [80, 60, 85, 0, 0],
  sayo: [50, 45, 55, 0, 0],
  kaname: [45, 40, 45, 0, 10],
  daisuke: [45, 40, 45, 0, 30],
  ishizue: [25, 20, 20, 0, 0],
};

/** People Li already knows at the start (others are met through story events). */
export const KNOWN_AT_START = ['raizen', 'gonza', 'rokubei', 'hisame', 'sukezo', 'hachi'];

export function createWorld(worldNumber = 1): GameState {
  const characters: Record<string, Character> = {};
  for (const s of SEEDS) {
    characters[s.id] = { ...structuredClone(s), wound: 0, healDays: 0, fatigue: 0, alive: true };
  }
  const relations: Record<string, Relation> = {};
  for (const [id, v] of Object.entries(REL_START)) {
    const fields: RelField[] = ['trust', 'respect', 'affection', 'fear', 'rivalry'];
    const base = {} as Record<RelField, number>;
    fields.forEach((f, i) => (base[f] = v[i]));
    relations[id] = { base, mods: [], heard: [], lastTalkDay: -1 };
  }
  const flags: Record<string, number> = {};
  for (const id of KNOWN_AT_START) flags[`met_${id}`] = 1;
  return {
    version: 1,
    worldNumber,
    date: { year: 100, month: 1, day: 1, part: 'morning' },
    liId: 'li',
    characters,
    relations,
    memories: [],
    journal: [],
    knowledge: ['own_name', 'father_soldier_killed', 'family_names', 'came_from_suiren', 'white_rock_crest', 'wooden_dragon'],
    flags,
    money: 12,
    seasonGains: {},
    seasonKey: '100-Spring',
    events: [],
    nextSeq: 1,
  };
}
