import { dayIndex } from './calendar';
import { GameDate } from './types';

// The land as everyone knows it: what a merchant, monk or soldier anywhere could tell (World Bible ch. 13, 13b;
// Atlas §1, 2, 3, 5, 9, 11, 13). Public parts only: no hidden truths, no hidden kingdom values, no real troop counts,
// nothing Li must discover to play (laws that open freedom routes stay in the Encyclopedia). The world clock changes it
// through dated entries in PUBLIC_CLOCK, so the same date always gives the same picture.

export type KingdomId = 'kurogane' | 'suiren' | 'hayate' | 'ushio' | 'takane' | 'tatara' | 'kitakaze';
export type FreeId = 'kinza' | 'shogen' | 'horo' | 'ruins';
export type PowerId = KingdomId | FreeId;
export type Stance = 'war' | 'truce' | 'tension' | 'cold peace' | 'alliance' | 'friendly' | 'rivals' | 'trade';

export interface PublicKingdom { id: KingdomId; name: string; epithet: string; capital: string; ruler: string; land: string; size: string; knownFor: string }
export interface PublicFree { id: FreeId; name: string; epithet: string; text: string }
export interface PublicRelation { a: PowerId; b: PowerId; stance: Stance; text: string }
export interface PublicSeat { holder: string | null; known?: string; text: string }
export interface PublicTitle { id: string; name: string; kingdom: KingdomId; text: string; seats: PublicSeat[] }
export interface PublicName { name: string; known: string; text: string }
export interface PublicLegend { when: string; title: string; text: string }
export interface PublicWorld {
  year: number;
  kingdoms: PublicKingdom[];
  free: PublicFree[];
  relations: PublicRelation[];
  titles: PublicTitle[];
  famous: PublicName[];
  legends: PublicLegend[];
}

/** One public change on a fixed day (days since Year 100, Month 1, Day 1). */
export interface PublicChange {
  day: number;
  kingdom?: Partial<PublicKingdom> & { id: KingdomId };
  relation?: PublicRelation;
  seat?: { title: string; seat: number } & PublicSeat;
  legend?: PublicLegend;
}

export const STANCE_LABEL: Record<Stance, string> = {
  war: 'At war', truce: 'Truce', tension: 'Tension', 'cold peace': 'Cold peace', alliance: 'Allied', friendly: 'Friendly', rivals: 'Rivals', trade: 'Trade',
};

/** Spring, Year 100: the start of the story. */
export const WORLD_START: PublicWorld = {
  year: 100,
  kingdoms: [
    { id: 'kurogane', name: 'Kurogane', epithet: 'the Iron West', capital: 'Seikyō',
      ruler: 'The young King Asagiri Tokinari. Until he comes of age at twenty, Chancellor Ebisawa Rokusai governs.',
      land: 'A high, dry plain ringed by mountains and entered by three passes.', size: 'About 7 million koku · about 150,000 soldiers',
      knownFor: 'Hard written law, the best roads and supply lines, and the Iron Gate spearmen. Feared by its neighbours.' },
    { id: 'suiren', name: 'Suiren', epithet: 'the Southern Giant', capital: 'Hanaoka',
      ruler: 'King Hasunuma Tadafusa. Three great families hold the court.',
      land: 'A great river delta of lakes, rice fields and silk towns.', size: 'About 10 million koku · about 220,000 soldiers',
      knownFor: 'The biggest and richest kingdom. It holds the Jade Seal of the old Empire and calls itself the Empire\'s heir.' },
    { id: 'hayate', name: 'Hayate', epithet: 'the War Kingdom', capital: 'Tsujikaze',
      ruler: 'King Shinonome Haruyuki, served by famous generals.',
      land: 'Open grass plains, the Sea of Grass: horse country.', size: 'About 4 million koku · about 90,000 soldiers',
      knownFor: 'The best cavalry and horse archers, the Wind Riders, and the Three Storms. It borders almost everyone.' },
    { id: 'ushio', name: 'Ushio', epithet: 'the Eastern Sea', capital: 'Kaisei',
      ruler: 'The child King Wadatsumi Chikamaru. Regent Tagami Kanemitsu governs for him.',
      land: 'A long coast of salt flats and harbours. Kaisei is the biggest city in the land.', size: 'About 5 million koku · about 100,000 soldiers',
      knownFor: 'The richest coast, salt and iron, the Seiran Academy and a war fleet. It pays others to fight.' },
    { id: 'takane', name: 'Takane', epithet: 'the Mountain', capital: 'Kumoi',
      ruler: 'King Kiriyama Yoritsugu, a cautious king.',
      land: 'Mountains, copper mines and three great passes. Poor soil.', size: 'About 2.5 million koku · about 55,000 soldiers',
      knownFor: 'Holds the mountain passes: fortresses, tolls and the Pass archers.' },
    { id: 'tatara', name: 'Tatara', epithet: 'the Smiths\' Kingdom', capital: 'Hinokuchi',
      ruler: 'King Tatara Shigekuni, who rules alone and is obeyed in everything. His heir is young.',
      land: 'Iron hills and forges in small valleys. The forge city never stops smoking.', size: 'About 1.2 million koku · about 25,000 soldiers',
      knownFor: 'The best steel and weapons in the land, and the only crossbow corps, the Thousand Strings.' },
    { id: 'kitakaze', name: 'Kitakaze', epithet: 'the Northern Frontier', capital: 'Shirotori',
      ruler: 'King Fuyutsuki Takamune. His five war chiefs must agree before any great war.',
      land: 'Cold forest and the edge of the steppe, with long winters. The Long Palisade faces the tribes.', size: 'About 2 million koku · about 45,000 soldiers',
      knownFor: 'Hardened soldiers, horse archers and the Winter Wolves. It also fights the northern tribes.' },
  ],
  free: [
    { id: 'kinza', name: 'Kinza', epithet: 'the Merchant City', text: 'A walled harbour run by the Council of 36. The land\'s great market for mercenaries and slaves, and its bankers. It bought its freedom from Suiren around Year 40.' },
    { id: 'shogen', name: 'Mount Shōgen', epithet: 'the Monk Mountain', text: 'Home of the temples, with about 8,000 warrior monks. It keeps the Mirror Masumi, shown once a year, and shelters the powerless Emperor-in-name.' },
    { id: 'horo', name: 'The Horo clans', epithet: 'the northern tribes', text: 'Horse tribes beyond Kitakaze\'s Long Palisade. They raid when the winters are hard.' },
    { id: 'ruins', name: 'Amatsu-kyō', epithet: 'the Ash Plain', text: 'The burned capital of the old Empire, below Mount Shōgen. A no-man\'s-land of bandits and ghost stories.' },
  ],
  relations: [
    { a: 'kurogane', b: 'suiren', stance: 'war', text: 'Border war on the Kurose: raids across the river, no full campaign yet.' },
    { a: 'kitakaze', b: 'horo', stance: 'war', text: 'Raids along the Long Palisade whenever the winters are hard.' },
    { a: 'kurogane', b: 'hayate', stance: 'truce', text: 'A truce after a costly war. It runs out in spring, Year 101.' },
    { a: 'hayate', b: 'takane', stance: 'tension', text: 'Tension over the border passes.' },
    { a: 'suiren', b: 'kinza', stance: 'tension', text: 'Suiren wants back the city that bought its freedom.' },
    { a: 'kurogane', b: 'kitakaze', stance: 'cold peace', text: 'Cold peace. Kitakaze\'s crown prince lived in Seikyō as a royal hostage until Year 98.' },
    { a: 'hayate', b: 'kitakaze', stance: 'alliance', text: 'Marriage alliance: King Haruyuki\'s sister is married to King Takamune.' },
    { a: 'ushio', b: 'takane', stance: 'alliance', text: 'Allies: Ushio salt for Takane copper.' },
    { a: 'ushio', b: 'hayate', stance: 'friendly', text: 'Ushio pays Hayate subsidies.' },
    { a: 'kurogane', b: 'tatara', stance: 'friendly', text: 'Friendly.' },
    { a: 'ushio', b: 'suiren', stance: 'rivals', text: 'Trade rivals. Both want Kinza.' },
    { a: 'suiren', b: 'tatara', stance: 'trade', text: 'Suiren rice for Tatara steel.' },
  ],
  titles: [
    { id: 'six_pillars', name: 'The Six Pillars', kingdom: 'kurogane', text: 'Six seats for Kurogane\'s greatest generals: an honour, not a rank. The first Pillars won the Wardens\' Wars.',
      seats: [
        { holder: 'Ōtori Gensai', known: 'the Walking Mountain', text: 'A master of defence who serves the Crown alone.' },
        { holder: 'Kirishima Hyōe', text: 'Born a peasant, he rose on enemy heads. The King\'s man.' },
        { holder: 'Tsurumaki Sanetaka', text: 'Head of the old noble houses.' },
        { holder: null, text: 'Empty since the last war.' },
        { holder: null, text: 'Empty since the last war.' },
        { holder: null, text: 'Empty since the last war.' },
      ] },
    { id: 'three_storms', name: 'The Three Storms', kingdom: 'hayate', text: 'Hayate\'s three great generals. Their troops love them more than the king.',
      seats: [
        { holder: 'Kagami Sōun', known: 'the Silent Storm', text: 'Called the best general alive.' },
        { holder: 'Homura Tetsuzan', text: 'A berserker in battle; his men worship him.' },
        { holder: 'Tobita Kojūrō', known: 'the Waiting Snake', text: 'He lets the enemy think it is winning, then strikes with his reserves.' },
      ] },
  ],
  famous: [
    { name: 'Garyū Tessai', known: 'the Northern Bear', text: 'Kitakaze\'s oldest war chief, called the strongest swordsman alive.' },
    { name: 'Mikumo Raizen', known: 'the Red Crane', text: 'A famous rōnin who leads a mercenary band. They say he once held a bridge alone against 300 men.' },
    { name: 'Isonokami Hyōbu', known: 'the Grand Admiral', text: 'Commands Ushio\'s war fleet.' },
    { name: 'Tobe Ittetsu', known: 'master of the Thousand Strings', text: 'Commands Tatara\'s crossbow corps.' },
  ],
  legends: [
    { when: 'Year 0', title: 'The Burning of the Capital', text: 'The last Emperor died without an accepted heir. Two crowned princes fought in the streets until both were dead and Amatsu-kyō burned. The seven Wardens each declared themselves king.' },
    { when: 'Years 0–30', title: 'The Wardens\' Wars', text: 'The seven new kingdoms fought until their borders held. Kurogane\'s first Six Pillars made their names here.' },
    { when: 'About Year 40', title: 'Kinza buys its freedom', text: 'The Merchant City paid Suiren to leave it free. Suiren has regretted it ever since.' },
    { when: 'About Year 70', title: 'The Northern Bear and the khan', text: 'At twenty-five, Garyū Tessai killed a Horo khan in single combat.' },
    { when: 'Year 90', title: 'The Battle of the Kurose', text: 'A Suiren army beat a Kurogane army on the border river. Kurogane veterans still curse the Suiren general who led it.' },
    { when: 'Year 99', title: 'Fire on the Kurose', text: 'Suiren raiders burned two villages across the river. The Hagiwara of Akaishi lost 2,000 men.' },
  ],
};

/** Public changes on fixed days, in order. Only what the whole land would hear. */
export const PUBLIC_CLOCK: PublicChange[] = [
  { day: 420, kingdom: { id: 'kurogane', ruler: 'King Asagiri Tokinari, of age since Year 101, Month 3. He rules alone.' } },
];

/** The land as everyone knows it on a given date. Pure: the same date always gives the same world. */
export function publicWorld(date: GameDate, clock: PublicChange[] = PUBLIC_CLOCK): PublicWorld {
  const w: PublicWorld = structuredClone(WORLD_START);
  w.year = date.year;
  const today = dayIndex(date);
  for (const c of clock) {
    if (c.day > today) continue;
    if (c.kingdom) Object.assign(w.kingdoms.find((k) => k.id === c.kingdom!.id)!, c.kingdom);
    if (c.relation) {
      const pair = (r: PublicRelation) => [r.a, r.b].sort().join('|');
      const at = w.relations.findIndex((r) => pair(r) === pair(c.relation!));
      if (at >= 0) w.relations[at] = { ...c.relation }; else w.relations.push({ ...c.relation });
    }
    if (c.seat) { const { title, seat, ...s } = c.seat; w.titles.find((t) => t.id === title)!.seats[seat] = s; }
    if (c.legend) w.legends.push({ ...c.legend });
  }
  return w;
}
