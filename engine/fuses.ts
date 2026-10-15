import { PLACES } from './data';
import { has, today } from './engine';
import { Draft, GameState } from './types';
import { KingdomId, WORLD_START } from './world-public';

// The free world, living layer (World Bible ch. 13b/13d, Numbers §11/§11b — owner approved Oct 15). The eight canon
// fuses fire on fixed days and pick a canon outcome by weights plus Li's levers; Li can push either side, but only
// where the fuse plays out. News reaches Li by distance (fast, for drama). No dice: the same world gives the same
// history, and only what Li pushed can change it. ⚠ The days and weights are PROVISIONAL (Numbers §11b).

export interface Fuse {
  id: string;
  name: string;
  kingdom: KingdomId;
  /** Words that mark the place it plays out (Li is "there" when his location names one). */
  where: string[];
  /** Day it fires (days since Year 100, Month 1, Day 1). */
  day: number;
  /** Canon outcomes, each with a base weight and the news people tell. */
  outcomes: { id: string; weight: number; news: string }[];
  /** What Li can do there, and which outcome it pushes (Claude offers these as chances). */
  levers: { text: string; toward: string }[];
  /** Signs Claude may show before it fires (hidden foreshadowing; never the outcome). */
  signs: string;
}

export const FUSES: Fuse[] = [
  { id: 'coup', name: "Gōda's coup", kingdom: 'kurogane', where: ['Seikyō', 'palace'], day: 414,
    outcomes: [
      { id: 'crushed', weight: 3, news: 'In Seikyō, Gōda Ensai\'s men tried to seize the palace before the king came of age. The guard held; Gōda is dead or fled.' },
      { id: 'purge', weight: 2, news: 'In Seikyō, a night of blood at court: the Chancellor Ebisawa Rokusai has fallen, and Gōda Ensai stands beside the Queen Mother.' },
      { id: 'king_killed', weight: 1, news: 'In Seikyō, the young king Asagiri Tokinari is dead, a month before he would have ruled alone. Gōda Ensai holds the palace.' },
    ],
    levers: [{ text: 'warn the King\'s Men or Ōtori Gensai', toward: 'crushed' }, { text: 'hold the palace gate for the guard', toward: 'crushed' }, { text: 'serve Gōda against the Chancellor', toward: 'purge' }, { text: 'open a door for Gōda\'s killers', toward: 'king_killed' }],
    signs: 'Gōda\'s retainers buy horses and armour in Seikyō; the Queen Mother receives him at night; the Chancellor\'s spies are nervous.' },
  { id: 'revenge', name: "The hostage prince's revenge", kingdom: 'kurogane', where: ['Seikyō', 'embassy'], day: 524,
    outcomes: [
      { id: 'discovered', weight: 2, news: 'In Seikyō, a Kitakaze plot against King Tokinari was discovered before the blow fell. The embassy was sent home in chains.' },
      { id: 'failed', weight: 3, news: 'In Seikyō, an assassin from the Kitakaze embassy struck at King Tokinari and failed. The north calls it an insult; war is coming.' },
      { id: 'succeeded', weight: 1, news: 'In Seikyō, King Tokinari was killed by a man of the Kitakaze embassy. Kurogane is in chaos.' },
    ],
    levers: [{ text: 'warn the court about the embassy', toward: 'discovered' }, { text: 'catch the bribed Kamio border guards', toward: 'discovered' }, { text: 'help the assassin', toward: 'succeeded' }],
    signs: 'A Kitakaze embassy comes for the treaty; the crown prince Fuyutsuki Hayato rides with it; Kamio border guards spend more than they earn.' },
  { id: 'slander', name: 'The bribed slander', kingdom: 'hayate', where: ['Tsujikaze', 'Hayate'], day: 600,
    outcomes: [
      { id: 'exposed', weight: 2, news: 'In Hayate, a plot to call the general Kagami Sōun a traitor was exposed. The minister Ugaki Jōan has fallen.' },
      { id: 'rebels', weight: 1, news: 'In Hayate, the general Kagami Sōun was called a traitor and rose against the king with his army.' },
      { id: 'executed', weight: 3, news: 'In Hayate, the great general Kagami Sōun was executed as a traitor. The Silent Storm is gone.' },
    ],
    levers: [{ text: 'expose the bribe to Kagami\'s men', toward: 'exposed' }, { text: 'warn Kagami Sōun', toward: 'rebels' }, { text: 'carry the bribe to Ugaki Jōan', toward: 'executed' }],
    signs: 'Foreign silver reaches the minister Ugaki Jōan; the king of Hayate grows cold to his best general.' },
  { id: 'pass', name: 'The pass revolt', kingdom: 'takane', where: ['Takane', 'Kumoi', 'Southern Pass'], day: 630,
    outcomes: [
      { id: 'none', weight: 3, news: 'In Takane, the talk of the Sakaguchi breaking away came to nothing; the Southern Pass stays in loyal hands.' },
      { id: 'opens', weight: 2, news: 'In Takane, the Sakaguchi rose; the Southern Pass is open to Hayate.' },
      { id: 'crushed', weight: 1, news: 'In Takane, the Sakaguchi rose and were crushed by the loyal houses.' },
    ],
    levers: [{ text: 'carry Hayate\'s offer to the Sakaguchi', toward: 'opens' }, { text: 'warn the loyal houses', toward: 'crushed' }, { text: 'calm the Sakaguchi', toward: 'none' }],
    signs: 'Sakaguchi Sadatomo meets Hayate men in secret; his loyalty to the king wears thin.' },
  { id: 'canal', name: 'The great canal', kingdom: 'kurogane', where: ['canal', 'Kawabe'], day: 870,
    outcomes: [
      { id: 'green', weight: 2, news: 'In Kurogane, the great canal is finished: the plain turns green, and men praise the engineer Kawabe Sekkei.' },
      { id: 'exposed', weight: 1, news: 'In Kurogane, the canal engineer Kawabe Sekkei was exposed as a Tatara agent. Seikyō speaks of war with Tatara.' },
      { id: 'bankrupt', weight: 3, news: 'In Kurogane, the great canal has emptied the treasury; soldiers go unpaid and the king borrows from Kinza.' },
    ],
    levers: [{ text: 'find and report Kawabe\'s letters to Tatara', toward: 'exposed' }, { text: 'protect Kawabe and his work', toward: 'green' }],
    signs: 'The canal swallows more men and silver every season; Kawabe writes many letters home.' },
  { id: 'hostage', name: 'The hostage heir', kingdom: 'suiren', where: ['Hanaoka', 'Okitsu'], day: 930,
    outcomes: [
      { id: 'stays', weight: 3, news: 'In Suiren, the Okitsu boy is still a hostage in Hanaoka, and the eastern border lord still bows.' },
      { id: 'breaks', weight: 2, news: 'In Suiren, Lord Okitsu Hirotsugu broke away from Hanaoka; his son is free.' },
      { id: 'crushed', weight: 1, news: 'In Suiren, Lord Okitsu tried to break away and was crushed by the Akabane.' },
    ],
    levers: [{ text: 'get Okitsu Tōmaru out of Hanaoka', toward: 'breaks' }, { text: 'betray the escape to the Akabane', toward: 'crushed' }],
    signs: 'Okitsu\'s men come and go in Hanaoka; the boy Tōmaru is watched closely.' },
  { id: 'usurp', name: 'The slow usurpation', kingdom: 'ushio', where: ['Kaisei', 'Ushio'], day: 1230,
    outcomes: [
      { id: 'smooth', weight: 3, news: 'In Ushio, the regent Tagami Kanemitsu has taken the throne without a drop of blood. The people cheer.' },
      { id: 'civil_war', weight: 2, news: 'In Ushio, the regent claimed the throne and the old royalists took up arms: civil war.' },
      { id: 'child_killed', weight: 1, news: 'In Ushio, the child king is dead, and the regent wears the crown.' },
    ],
    levers: [{ text: 'protect the child king', toward: 'civil_war' }, { text: 'serve the regent', toward: 'smooth' }],
    signs: 'The regent lends grain big and collects small; the court praises him louder each month.' },
  { id: 'tatara_king', name: "The king's death", kingdom: 'tatara', where: ['Tatara', 'Hinokuchi'], day: 1350,
    outcomes: [
      { id: 'heir', weight: 3, news: 'In Tatara, the old king Shigekuni is dead. The young heir Kunimaru is crowned, and Prince Akifumi stands loyal beside him.' },
      { id: 'prince', weight: 2, news: 'In Tatara, the old king is dead, and Prince Akifumi rules in the young heir\'s name.' },
    ],
    levers: [{ text: 'stand by the young heir', toward: 'heir' }, { text: 'serve Prince Akifumi', toward: 'prince' }],
    signs: 'The old king of Tatara tires easily and holds his chest.' },
];

const fuseById = (id: string) => FUSES.find((f) => f.id === id);
const KINGDOM_WORDS: [KingdomId, string[]][] = WORLD_START.kingdoms.map((k) => [k.id, [k.name, k.capital]]);

/** Where Li is, as text the code can read (a place id or the Game Master's place line). */
const liWhere = (s: GameState) => { const loc = s.characters[s.liId].location; return PLACES[loc] ?? loc; };
/** The kingdom Li is in (from his place); the start is Kurogane. */
export function liKingdom(s: GameState): KingdomId {
  const w = liWhere(s).toLowerCase();
  return KINGDOM_WORDS.find(([, words]) => words.some((x) => w.includes(x.toLowerCase())))?.[0] ?? 'kurogane';
}
/** Li is where this fuse plays out. */
export const liIsAt = (s: GameState, f: Fuse) => f.where.some((x) => liWhere(s).toLowerCase().includes(x.toLowerCase()));
/** Days until the news of a fuse reaches Li (World Bible 13d, fast for drama). */
export const newsDelay = (s: GameState, f: Fuse) => (liIsAt(s, f) ? 0 : liKingdom(s) === f.kingdom ? 3 : 10);

const leverKey = (fuse: string, outcome: string) => `lever_${fuse}_${outcome}`;

/** The outcome a fuse takes: base weight + 2 per lever Li pulled toward it; ties go to the first listed. */
export function fuseOutcome(s: GameState, f: Fuse) {
  let best = f.outcomes[0];
  let bestW = -1;
  for (const o of f.outcomes) {
    const w = o.weight + 2 * has(s, leverKey(f.id, o.id));
    if (w > bestW) { best = o; bestW = w; }
  }
  return best;
}

/** A lever Li pulls (a Game Master change): only where the fuse plays out, before it fires. */
export function leverDrafts(s: GameState, x: { fuse?: unknown; toward?: unknown; reason?: unknown }, notes: string[]): Draft[] {
  const f = fuseById(String(x.fuse ?? ''));
  if (!f) { notes.push(`no fuse "${String(x.fuse)}"`); return []; }
  const o = f.outcomes.find((y) => y.id === x.toward);
  if (!o) { notes.push(`"${String(x.toward)}" is not an outcome of ${f.name}`); return []; }
  if (has(s, `fuse_${f.id}`)) { notes.push(`${f.name} has already happened`); return []; }
  if (!liIsAt(s, f)) { notes.push(`Li is not where ${f.name} plays out (${f.where[0]})`); return []; }
  const key = leverKey(f.id, o.id);
  return [{ type: 'flag', fact: `Li pushes ${f.name} toward "${o.id}" (${String(x.reason ?? '').slice(0, 100)})`, visible: false, data: { key, value: has(s, key) + 1 } }];
}

/** Time passes from `from` to `to`: fuses whose day comes fire (outcome decided now); news that reaches Li arrives. */
export function fuseDrafts(s: GameState, from: number, to: number): Draft[] {
  const out: Draft[] = [];
  for (const f of FUSES) {
    if (!has(s, `fuse_${f.id}`) && f.day > from && f.day <= to) {
      const o = fuseOutcome(s, f);
      out.push({ type: 'flag', fact: `${f.name}: ${o.id}`, visible: false, data: { key: `fuse_${f.id}`, value: f.outcomes.indexOf(o) + 1 } });
      out.push({ type: 'flag', fact: `${f.name} fired`, visible: false, data: { key: `fuse_${f.id}_day`, value: f.day } });
    }
  }
  for (const f of FUSES) {
    const fired = out.some((d) => d.data.key === `fuse_${f.id}`) || has(s, `fuse_${f.id}`) > 0;
    if (!fired || has(s, `news_${f.id}`)) continue;
    const idx = (out.find((d) => d.data.key === `fuse_${f.id}`)?.data.value as number | undefined) ?? has(s, `fuse_${f.id}`);
    const day = (out.find((d) => d.data.key === `fuse_${f.id}_day`)?.data.value as number | undefined) ?? has(s, `fuse_${f.id}_day`);
    if (day + newsDelay(s, f) > to) continue;
    const news = f.outcomes[idx - 1].news;
    out.push({ type: 'story', fact: `News reaches Li: ${news}`, visible: true, journal: `News: ${news}`, data: { news: f.id } });
    out.push({ type: 'flag', fact: `news of ${f.name} heard`, visible: false, data: { key: `news_${f.id}`, value: 1 } });
  }
  return out;
}

/** The world as it reaches Li, and what is coming near him (hidden), for Claude's memory. */
export function fusesText(s: GameState): string {
  const now = today(s);
  const heard = FUSES.filter((f) => has(s, `news_${f.id}`)).map((f) => `- ${f.outcomes[has(s, `fuse_${f.id}`) - 1].news}`);
  const soon = FUSES.filter((f) => !has(s, `fuse_${f.id}`) && f.day - now <= 90 && (f.kingdom === liKingdom(s) || liIsAt(s, f)));
  const coming = soon.map((f) => `- ${f.name} (in ${f.day - now} days, ${f.where[0]}). Signs you may show: ${f.signs}${liIsAt(s, f) ? ` LI IS THERE: he can push it with a "lever" change (fuse "${f.id}", toward one of ${f.outcomes.map((o) => `"${o.id}"`).join(', ')}): ${f.levers.map((l) => `${l.text} → ${l.toward}`).join('; ')}. Either side; never force it.` : ''}`);
  return [
    heard.length ? `WORLD NEWS LI HAS HEARD:\n${heard.join('\n')}` : '',
    coming.length ? `WORLD EVENTS COMING (SECRET: only signs and rumours until they happen; the code decides the outcome):\n${coming.join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
}
