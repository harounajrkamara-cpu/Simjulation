import { FactPacket, packetText } from './packet';

// Fact check before showing (Game Experience ch. 7): code, not AI.
// A narration may only use names, numbers and deaths that are in the fact packet, must keep every hand-written
// line of dialogue word for word, must speak of Li in the third person, and may not use game-mechanic words.

/** Every proper name in the world (Atlas §15 registry, kingdoms, places, legends). Any of these not in the packet is a leak. */
export const WORLD_NAMES = [
  // family names (Atlas §15)
  'Amatsu', 'Asagiri', 'Ebisawa', 'Gōda', 'Ōtori', 'Kirishima', 'Tsurumaki', 'Nagi', 'Kawabe', 'Kamio', 'Hagiwara', 'Ishizue', 'Hasunuma',
  'Shirasagi', 'Akabane', 'Kinugasa', 'Yashiro', 'Tōno', 'Okitsu', 'Shinonome', 'Ugaki', 'Kagami', 'Homura', 'Tobita', 'Kurokoma', 'Wadatsumi',
  'Tagami', 'Isonokami', 'Daikokuya', 'Hamazaki', 'Kiriyama', 'Ōkura', 'Shiraiwa', 'Haguro', 'Sakaguchi', 'Tatara', 'Tobe', 'Kanemori', 'Hibiki',
  'Fuyutsuki', 'Utsugi', 'Garyū', 'Shiramine', 'Ebisu-ya', 'Mikumo', 'Matsukaze', 'Ōno', 'Hattori',
  // given names in use and reserved
  'Hayame', 'Shion', 'Nami', 'Tōta', 'Tsubasa', 'Ryūnosuke', 'Kunimaru', 'Sayuri', 'Ofuji', 'Yuki', 'Mei', 'Kenjiko', 'Takeshi',
  'Raizen', 'Gonza', 'Rokubei', 'Hisame', 'Sukezō', 'Hachi', 'Sayo', 'Kaname', 'Daisuke', 'Gonroku', 'Tokinari', 'Kaede', 'Rokusai', 'Ensai',
  'Gensai', 'Hyōe', 'Sanetaka', 'Tadafusa', 'Kiyotaka', 'Nobuhisa', 'Gendayū', 'Yasumichi', 'Yasutoki', 'Seigen', 'Munenori', 'Tadaoki', 'Tessai', 'Sumiharu', 'Ganzō',
  // kingdoms and places
  'Kurogane', 'Suiren', 'Hayate', 'Ushio', 'Takane', 'Kitakaze', 'Amatsu-kyō', 'Seikyō', 'Hanaoka', 'Kinza', 'Akaishi', 'Kōri', 'Sasabe', 'Kurose',
  'Ōmizu', 'Shinju', 'Sekiba', 'Jōga', 'Shōgen', 'Horo',
  // legends and treasures
  'Twin Demon', 'Kage', 'Hikari', 'Masumi', 'Amenokiri', 'Little Dragon', 'Red Crane', 'Six Pillars', 'Three Storms',
];

/** Words that turn the story into a game sheet (ch. 7: no stats or dice language in the prose). */
const MECHANICS = /\b(VAL|LEA|INT|POL|stats?|dice|rolls?|rolled|hit points?|HP|XP|level(?:ed)? up|percent|%)\b/;
const DEATH = /\b(dies|died|dead|death|kill(?:s|ed)?|slain|corpse)\b/i;
const NUMBER_WORDS = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fifteen', 'twenty', 'thirty', 'fifty', 'hundred', 'thousand'];

export interface CheckResult { ok: boolean; problems: string[] }

const strip = (t: string) => t.normalize('NFC');
const outsideQuotes = (t: string) => t.replace(/"[^"]*"|“[^”]*”/g, '""');

export function checkNarration(text: string, p: FactPacket): CheckResult {
  const problems: string[] = [];
  const narration = strip(text).replace(/[“”]/g, '"');
  const allowed = strip(packetText(p));
  const allowedLower = allowed.toLowerCase();

  if (!narration.trim()) problems.push('empty');

  // 1. Names: no world name that the packet does not contain (catches leaks of secrets and invented people).
  for (const name of WORLD_NAMES) {
    const re = new RegExp(`(^|[^\\p{L}])${name}(?![\\p{L}])`, 'u');
    if (re.test(narration) && !re.test(allowed)) problems.push(`name not in the facts: ${name}`);
  }
  // Capitalised words mid-sentence that appear nowhere in the packet are likely invented names.
  const midSentence = outsideQuotes(narration).match(/(?<=[a-zō,;:—–-]\s)[A-ZŌŪ][\p{L}-]{2,}/gu) ?? [];
  for (const w of new Set(midSentence)) {
    if (!allowed.includes(w) && !['Li', 'Year', 'Month', 'Day'].includes(w)) problems.push(`unknown name: ${w}`);
  }

  // 2. Numbers: digits and number words must come from the packet.
  for (const n of new Set(narration.match(/\d+/g) ?? [])) if (!new RegExp(`(^|\\D)${n}(\\D|$)`).test(allowed)) problems.push(`number not in the facts: ${n}`);
  for (const w of NUMBER_WORDS) {
    const re = new RegExp(`\\b${w}\\b`, 'i');
    if (re.test(narration) && !re.test(allowedLower)) problems.push(`number not in the facts: ${w}`);
  }

  // 3. No deaths that the engine did not report.
  if (DEATH.test(outsideQuotes(narration)) && !DEATH.test(p.facts.join(' '))) problems.push('a death or killing that is not in the facts');

  // 4. Hand-written lines of dialogue appear word for word.
  for (const line of p.coreLines) if (!narration.includes(line)) problems.push(`missing core line: ${line.slice(0, 50)}`);

  // 5. Third person; no game language.
  if (/\b(you|your|yours|yourself)\b/i.test(outsideQuotes(narration))) problems.push('second person outside dialogue');
  if (MECHANICS.test(outsideQuotes(narration))) problems.push('game-mechanic words in the prose');

  // 6. Length within the word budget (ch. 2, 11), with some room.
  const words = narration.split(/\s+/).filter(Boolean).length;
  if (words > p.words[1] * 1.5) problems.push(`too long: ${words} words`);

  return { ok: problems.length === 0, problems };
}
