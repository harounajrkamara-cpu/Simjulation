import { PLACES } from './data';
import { has } from './engine';
import { lifeStage, Stage } from './stages';
import { Draft, GameState } from './types';

// Story seeds, the free space of the world (World Bible ch. 13d, owner approved Oct 15: keep all 15). A seed is a
// situation, never a script: Claude plants one when Li's place and life stage fit; the code records planted / grown /
// dead, so nothing is repeated or forgotten. Every seed comes from the Atlas or the World Bible.

export interface Seed { id: string; name: string; where: string[]; stages: Stage[]; needs: string; becomes: string }

export const SEEDS: Seed[] = [
  { id: 'footwork', name: 'The man who knew the footwork', where: [], stages: ['slave', 'soldier'], needs: 'a veteran of the Suiren wars sees Li fight', becomes: 'an ally, or a danger (the "son lives" fuse, World Bible 10.6)' },
  { id: 'bridge', name: "Raizen's bridge", where: ['Red Crane', 'camp', 'Kōri'], stages: ['slave'], needs: 'Raizen drunk, a night, Li close', becomes: 'the truth: 120 men, not 300, and part of why Raizen left Suiren' },
  { id: 'side_trade', name: "Gonza's side trade", where: ['Red Crane', 'camp', 'Kōri'], stages: ['slave'], needs: 'Li sees band supplies sold at night', becomes: 'leverage, a deal, or a beating' },
  { id: 'hisame', name: "Hisame's past", where: ['Red Crane', 'camp', 'Kōri'], stages: ['slave', 'soldier'], needs: 'real trust with Hisame', becomes: 'the Mist Valley deserter: a teacher of the bow, or a hunted man' },
  { id: 'kaname', name: "Kaname's village", where: ['Sasabe', 'village', 'Kōri', 'border'], stages: ['slave', 'soldier'], needs: 'the raid on Sasabe, or the border villages', becomes: 'a fighter who remembers who helped' },
  { id: 'daisuke', name: "Daisuke's challenge", where: ['levy', 'camp', 'Kōri', 'Akaishi'], stages: ['slave', 'soldier'], needs: 'Li and Daisuke both near the levy', becomes: 'a rival who becomes a brother-in-arms, or a grudge' },
  { id: 'sayo', name: "Sayo's question", where: ['Akaishi', 'Hagiwara', 'stable'], stages: ['slave', 'soldier'], needs: 'Li works near the Hagiwara household', becomes: 'a door into the nobility; the barrier made personal' },
  { id: 'canal_letters', name: "The canal's letters", where: ['canal', 'Kawabe', 'Seikyō'], stages: ['soldier', 'officer'], needs: 'Li carries or sees Kawabe\'s papers', becomes: 'the great canal fuse' },
  { id: 'embassy', name: 'The northern embassy', where: ['Seikyō'], stages: ['soldier', 'officer'], needs: 'Li in Seikyō when the Kitakaze embassy comes', becomes: 'the hostage prince\'s revenge fuse' },
  { id: 'sword', name: 'A sword for sale', where: ['Kinza', 'castle town', 'market'], stages: ['slave', 'soldier', 'officer', 'general'], needs: 'money and a merchant', becomes: 'a blade with a history (never Kage or Hikari unless the canon path leads there)' },
  { id: 'false_name', name: 'The girl under a false name', where: ['Takane', 'Kumoi', 'mining'], stages: ['officer', 'general'], needs: 'Li travels to Takane', becomes: 'Shiraiwa Tōta, then Mei: the family goal' },
  { id: 'ryunosuke', name: "Ryūnosuke's pride", where: ['Seikyō', 'army', 'camp'], stages: ['soldier', 'officer'], needs: 'both rise in Kurogane\'s army', becomes: 'a rival inside Li\'s own army' },
  { id: 'hayame', name: 'Akabane Hayame', where: ['Suiren', 'Hanaoka', 'battle'], stages: ['officer', 'general'], needs: 'Li fights Suiren', becomes: 'the nemesis: son of the man who set the trap' },
  { id: 'single_path', name: 'The Single Path', where: ['Suiren', 'Hanaoka'], stages: ['slave', 'soldier', 'officer', 'general'], needs: 'high taxes among Suiren\'s poor', becomes: 'an uprising Li can join, use or crush' },
  { id: 'song', name: 'A song about the Twin Demon', where: ['market', 'town', 'Kinza'], stages: ['slave', 'soldier', 'officer', 'general'], needs: 'a singer and a crowd', becomes: 'the official lie, and a chance to learn one true detail' },
];

const STATE = { planted: 1, grown: 2, dead: 3 } as const;
const key = (id: string) => `seed_${id}`;
const where = (s: GameState) => { const loc = s.characters[s.liId].location; return (PLACES[loc] ?? loc).toLowerCase(); };
/** The seed fits Li now: his life stage, and his place (a seed without places can grow anywhere). */
export const fits = (s: GameState, x: Seed) => x.stages.includes(lifeStage(s)) && (!x.where.length || x.where.some((w) => where(s).includes(w.toLowerCase())));

/** A seed change from the Game Master: planted only when it fits now; grown or dead only once planted. */
export function seedDrafts(s: GameState, x: { id?: unknown; state?: unknown; note?: unknown }, notes: string[]): Draft[] {
  const seed = SEEDS.find((y) => y.id === x.id);
  const st = STATE[x.state as keyof typeof STATE];
  if (!seed || !st) { notes.push(`no seed "${String(x.id)}" / state "${String(x.state)}"`); return []; }
  const now = has(s, key(seed.id));
  if (st === 1 && (now || !fits(s, seed))) { notes.push(`seed "${seed.name}" cannot be planted now`); return []; }
  // planted → grown or dead; grown → dead.
  if (st > 1 && (!now || now >= st)) { notes.push(`seed "${seed.name}" cannot become ${String(x.state)} now`); return []; }
  return [{ type: 'flag', fact: `seed ${seed.name}: ${String(x.state)}${x.note ? ` (${String(x.note).slice(0, 100)})` : ''}`, visible: false, data: { key: key(seed.id), value: st } }];
}

/** Open seeds and the ones that could be planted here and now, for Claude's memory. */
export function seedsText(s: GameState): string {
  const open = SEEDS.filter((x) => [1, 2].includes(has(s, key(x.id)))).map((x) => `- [${x.id}] ${x.name} (${has(s, key(x.id)) === 1 ? 'planted' : 'grown'}): can become ${x.becomes}.`);
  const ready = SEEDS.filter((x) => !has(s, key(x.id)) && fits(s, x)).slice(0, 4).map((x) => `- [${x.id}] ${x.name}: needs ${x.needs}; can become ${x.becomes}.`);
  if (!open.length && !ready.length) return '';
  return `STORY SEEDS (situations, never scripts; plant at most one when it fits, with {"kind":"seed","id":"<id>","state":"planted"}, later "grown" or "dead"):\n${[...open, ...ready].join('\n')}`;
}
