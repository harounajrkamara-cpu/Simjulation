import { Character, GameState, Relation, RelField, StatKey } from './types';

// Start data for stage 1, taken from WORLD_ATLAS.md §4 and WORLD_BIBLE.md ch. 10.
// Exact stats follow the Atlas ranks via Numbers §1.

type CharSeed = Omit<Character, 'wound' | 'healDays' | 'fatigue' | 'alive'>;

const st = (LEA: number, VAL: number, INT: number, POL: number): Record<StatKey, number> => ({ LEA, VAL, INT, POL });

export const PLACES: Record<string, string> = {
  kori_camp: 'Red Crane camp, below Kōri fort (Akaishi province, Kurogane)',
  sasabe: 'Sasabe village',
  akaishi: 'Akaishi castle town',
  tatara: 'Tatara — the Smiths\' kingdom, iron-rich mountains east of the Shōu',
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

/** Characters specific to the Tatara runaway start (world 2). */
export const TATARA_SEEDS: CharSeed[] = [
  {
    id: 'kane', name: 'Kane the Smith', born: { year: 48, month: 6, day: 14 }, role: 'master smith of Tatara', status: 'free',
    stats: st(55, 75, 50, 35), potential: st(60, 80, 55, 40), styles: { hammer: 85, sword: 40 }, skills: { smithing: 80, endurance: 55 },
    traits: ['gruff', 'honourable', 'protective of runaways', 'distrusts soldiers'], location: 'tatara',
    desc: 'A weathered man whose arms are thick as rope from the forge. He took Li in without asking questions.', publicRank: '?',
  },
  {
    id: 'masaru', name: 'Masaru the Headman', born: { year: 50, month: 3, day: 22 }, role: 'headman of Tatara village', status: 'noble',
    stats: st(38, 40, 55, 30), potential: st(45, 48, 70, 40), styles: {}, skills: { administration: 60, persuasion: 40 },
    traits: ['calculating', 'wary of outsiders', 'pragmatic'], location: 'tatara',
    desc: 'A thin man with ink-stained fingers. He keeps careful records and watches the border.', publicRank: '?',
  },
  {
    id: 'shinobu', name: 'Shinobu the Hunter', born: { year: 67, month: 11, day: 7 }, role: 'hunter-trackr of Tatara', status: 'free',
    stats: st(30, 55, 40, 25), potential: st(35, 70, 50, 35), styles: { bow: 72, unarmed: 30 }, skills: { tracking: 75, stealth: 60, survival: 50 },
    traits: ['solitary', 'observant', 'has his own agenda'], location: 'tatara',
    desc: 'Tracks more than game — Li has seen him reading the trail signs near the village.', publicRank: 'Warrior D?',
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

/** Relations override for the Tatara runaway start (world 2): old band sees Li as a runaway, Tatara hosts are wary/protective. */
const TATARA_REL_START: Record<string, [number, number, number, number, number]> = {
  // Old band — relations degraded by the escape
  raizen: [20, 10, 0, 40, 10],   // cool former owner, now hunted
  gonza: [-20, 0, -30, 30, 40],  // cruel enforcer becomes an active threat
  rokubei: [15, 10, 0, 20, 0],   // quartermaster holds the papers
  hisame: [30, 20, 10, 15, 0],   // silent archer, ambiguous
  sukezo: [70, 60, 80, 0, 0],    // the cook who helped him flee — still trusted
  hachi: [30, 20, 25, 10, 0],    // slave-boy friend, left behind
  // Tatara hosts
  kane: [80, 75, 85, 0, 0],      // master smith, protecting Li
  masaru: [50, 40, 30, 20, 0],   // headman, wary but curious
  shinobu: [35, 45, 25, 30, 0],  // tracker, has his own agenda
};

/** People Li already knows at the Tatara start. */
export const KNOWN_AT_START_TATARA = ['sukezo', 'hachi', 'kane', 'masaru'];

/** People Li already knows in the slave start (others are met through story events). */
export const KNOWN_AT_START = ['raizen', 'gonza', 'rokubei', 'hisame', 'sukezo', 'hachi'];

export function createWorld(worldNumber = 1): GameState {
  if (worldNumber === 2) {
    return createWorldTataraStart();
  }
  // Default to world 1 (slave start)
  return createWorldSlaveStart();
}
export function createWorldSlaveStart(): GameState {
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
    worldNumber: 1,
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
export function createWorldTataraStart(): GameState {
  // Start from slave base, then morph into the Tatara runaway start.
  const s = createWorldSlaveStart();

  // Add Tatara characters.
  for (const seed of TATARA_SEEDS) {
    s.characters[seed.id] = { ...structuredClone(seed), wound: 0, healDays: 0, fatigue: 0, alive: true };
  }

  // Override relations with Tatara-specific values (old band degraded, Tatara hosts added).
  for (const [id, v] of Object.entries(TATARA_REL_START)) {
    const fields: RelField[] = ['trust', 'respect', 'affection', 'fear', 'rivalry'];
    const base = {} as Record<RelField, number>;
    fields.forEach((f, i) => (base[f] = v[i]));
    s.relations[id] = { base, mods: [], heard: [], lastTalkDay: -1 };
  }

  // Mark Tatara characters as already met.
  for (const id of KNOWN_AT_START_TATARA) {
    s.flags[`met_${id}`] = 1;
  }

  // Li is now free, in Tatara, working as a smith's apprentice.
  const li = s.characters['li'];
  li.role = 'smith\'s apprentice in Tatara';
  li.status = 'free';
  li.location = 'tatara';
  li.desc = 'Free but hunted. A former slave who escaped to Tatara and now works in the forge.';

  // Mutate the starting state for the runaway life.
  s.worldNumber = 2;
  s.money = 0;
  s.date = { year: 101, month: 1, day: 1, part: 'morning' };
  s.seasonKey = '101-Spring';
  s.knowledge = ['own_name', 'father_soldier_killed', 'family_names', 'came_from_suiren', 'white_rock_crest', 'wooden_dragon', 'tatara_refuge', 'hunted_by_band'];
  s.flags = { ...s.flags, hunted: 1, runaway: 1 };

  return s;
}
