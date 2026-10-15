import { publicWorld } from './world-public';
import { GameState } from './types';

// The houses and lords as the land knows them (owner, Oct 12: scenes said "the Lord" and "the border lord" without a
// name, and the guide could not answer "who are the Hagiwara"). Copied from docs/WORLD_ATLAS.md §3.1 and §4, PUBLIC
// columns only: never the 🔒 secrets. Ages are in Year 100. The Game Master gets these in its memory, so a lord or a
// house is named, and named right.

export interface PublicHouse { name: string; kingdom: string; land: string; head: string; family: string; stands: string; known: string }

export const KUROGANE_HOUSES: PublicHouse[] = [
  { name: 'Hagiwara', kingdom: 'Kurogane', land: 'Akaishi, the southern border province on the Suiren border (castle town: Akaishi)',
    head: 'Lord Hagiwara Munenori (49), the border lord: cautious and pragmatic', family: 'heir Hagiwara Tadaoki (26); daughter Hagiwara Sayo (13), bright and curious',
    stands: 'neutral at court', known: 'lost 2,000 men to Suiren raids last year; has hired Raizen\'s Red Crane band to hold the Kurose ford' },
  { name: 'Ishizue', kingdom: 'Kurogane', land: 'Kōri District under the Hagiwara; holds Kōri fort on the border',
    head: 'Ishizue Gonroku (40), a Sanbyakunin-shō', family: '', stands: 'serves the Hagiwara', known: 'despises mercenaries and slaves' },
  { name: 'Tsurumaki', kingdom: 'Kurogane', land: 'two old heartland provinces',
    head: 'Tsurumaki Sanetaka (51), Pillar seat 3, head of the Old Blood', family: 'heir Tsurumaki Kagetoshi (24), an arrogant duelist',
    stands: 'the Old Blood', known: 'wants noble privilege back and the merit law gone' },
  { name: 'Kamio', kingdom: 'Kurogane', land: 'the northern pass province on the Kitakaze border',
    head: 'Kamio Ujihide (60), old and loyal', family: 'grandson Kamio Seijūrō (19), the young king\'s friend',
    stands: 'the King\'s Men', known: 'holds the north' },
  { name: 'Gōda', kingdom: 'Kurogane', land: 'two provinces granted by the Queen Mother',
    head: 'Gōda Ensai (32), the Queen Mother\'s favourite', family: '', stands: 'the Favourite\'s faction', known: 'rose fast at court' },
  { name: 'Ebisawa', kingdom: 'Kurogane', land: 'one granted province',
    head: 'Chancellor Ebisawa Rokusai (56), who governs until the king comes of age', family: 'adopted son Ebisawa Tōma (30)',
    stands: 'the Chancellor\'s House', known: 'a former Kinza merchant; compiled the Ebisawa Annals' },
  { name: 'Kirishima', kingdom: 'Kurogane', land: 'one province, granted for merit',
    head: 'Kirishima Hyōe (44), Pillar seat 2, born a peasant, rose on enemy heads', family: 'son Kirishima Ryūnosuke (17)',
    stands: 'the King\'s Men', known: 'proof that a commoner can lead' },
];

/** The public world for Claude: the kingdoms and their rulers, and the great houses of the kingdom Li lives in. */
export function publicWorldText(s: GameState): string {
  const w = publicWorld(s.date);
  const kingdoms = w.kingdoms.map((k) => `- ${k.name}, ${k.epithet} (capital ${k.capital}): ${k.ruler}`);
  const houses = KUROGANE_HOUSES.map((h) => `- House ${h.name} — ${h.land}. Head: ${h.head}.${h.family ? ` Family: ${h.family}.` : ''} ${h.stands}; ${h.known}.`);
  return `THE WORLD AS EVERYONE KNOWS IT (public; use these names, never "the Lord" without one):\n${kingdoms.join('\n')}\nGREAT HOUSES OF KUROGANE (Li's kingdom):\n${houses.join('\n')}\nWhen a lord or a house appears in a scene, name him clearly the first time (e.g. "Lord Hagiwara Munenori, the border lord of Akaishi").`;
}
