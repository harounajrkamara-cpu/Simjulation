import { has, li } from './engine';
import { GameState } from './types';

// Li's life stages (World Bible ch. 12 "systems unlock with Li's life", ch. 9 longest skips; owner vision Oct 10: the
// stages only say where Li stands, never what must happen). Pure.

export type Stage = 'slave' | 'soldier' | 'officer' | 'general';

/** rank_level: 0 Ashigaru · 1 Gochō · 2 Kogashira · 3 Gojū-gashira … 6 Sennin-shō … 9 Dai-Shōgun (engine/career.ts). */
export function lifeStage(s: GameState): Stage {
  if (li(s).status === 'slave') return 'slave';
  const lvl = has(s, 'rank_level');
  if (lvl >= 6) return 'general';
  if (lvl >= 3) return 'officer';
  return 'soldier';
}

/** Land Li holds, in koku (0 until a grant). */
export const landKoku = (s: GameState) => has(s, 'land_koku');

/** Longest skip in one scene (World Bible ch. 9): slave 1 month · soldier 1 season · officer and up 1 year. */
export const STAGE_DAYS: Record<Stage, number> = { slave: 30, soldier: 90, officer: 360, general: 360 };
export const stageDayCap = (s: GameState) => STAGE_DAYS[lifeStage(s)];

const ABOUT: Record<Stage, string> = {
  slave: 'Li is a slave: survival, the people around him, secret training, and a way to freedom. He owns nothing and commands no one.',
  soldier: 'Li is a free soldier in the ranks: he follows orders and commands at most his own small unit; merit and witnesses decide promotions; low-born men climb slower (nobles grumble). Battles are seen from the line: his sector exact, the rest as reports.',
  officer: 'Li is an officer: he leads his own unit, sits in war councils at the edge, may propose plans (accepted by status and trust), and his men\'s morale and loyalty are his to keep. Reward ceremonies, rivals among officers, first land at Sanbyakunin-shō.',
  general: 'Li is a general: armies, sub-commanders, supply and politics; the court, factions, hostages and marriages reach him; his name moves people.',
};

/** World facts per stage for Claude (VISIE §6 memory). Beyond the Atlas text already sent,
 *  these tell Claude what systems are live and what kind of events are possible at each stage. */
export const STAGE_FACTS: Record<Stage, string[]> = {
  slave: [
    'Li is still a slave; the freedom routes are: 30 merit in Kurogane service (a Kogashira head frees him too), buying for 15 ryō, Raizen\'s word, or escape to Tatara (hunted, winter quarters only).',
    'The world clock this year: raid days on the ford (months 4–9, days 8 and 22), the yearly contract on Month 10 Day 1, the levy going home for winter.',
    'Li can train at night (two sticks), read letters with Sukezō, help in the camp, watch drills, talk to people by the fire.',
  ],
  soldier: [
    'Li is free and in the ranks: Kurogane merit law counts his deeds. He has a unit (Ashigaru = himself, up), follows orders, can be promoted by witnessed merit.',
    'Campaign raids continue each year (months 4–9, days 8 and 22). Li may go for an officer head, hold his place in the line, or be assigned other duties (scouting, messenger, gate duty).',
    'Promotion needs a vacant post and enough merit × barrier factor (low-born multiplier). Reward ceremonies happen at the year-end contract; Kurogane pays 0.1 ryō per merit to the owner (Raizen shares only if respect ≥ 50).',
    'Li can join a battle (Sector view: his unit, his sector exact; other sectors as reports). Command merit is awarded for successful actions under fire.',
    'Free time between raids: drill sergeants, camp followers, dice games on paydays (days 1 and 16), stitching levy men, letters from home, rumours at the fire.',
    'Starting weapons: the two sticks become bokken or a real blade when Li can afford or receive one. Stamina and skill grow with fights.',
  ],
  officer: [
    'Li has a command rank (Gojū-gashira or higher) and leads his own unit of men. He sits at war councils, may propose battle plans (accepted by status and trust).',
    'He has received his first land grant (from Sanbyakunin-shō up, ~300+ koku). The land runs itself monthly: harvest, tax day, wages, desertion, projects. Li gives big orders, family or officers handle day-to-day.',
    'Large battles: Li sees sectors, morale, routs, pursuit. He commands only his unit but reports on the whole. Command merit is the main path to higher ranks now.',
    'Rivals among officers: promotions are zero-sum. Ceremonies include witness lists, rival remarks, and the tension of competing for the same post.',
    'Court life begins: brief audiences with nobles, requests for favours, marriage proposals for relatives, demands for protection money from villages.',
    'Zone and aura may awaken in real near-death moments. Clan techniques require teachers who saw the Twin Demon fight.',
  ],
  general: [
    'Li is a general (Sennin-shō or higher): armies, sub-commanders, supply lines, and court politics. His name moves people and other generals watch his moves.',
    'He commands 1,000+ men across multiple units. Battles are large-scale: coalition warfare, sieges, flanking manoeuvres, and the fate of whole campaigns decided by his choices.',
    'Court faction play: the Six Pillars of Kurogane, the Three Storms of Hayate, hostages and marriages. Choices have kingdom-wide consequences that echo for years.',
    'He receives major land grants (1,000–100,000+ koku) and must appoint stewards, judge disputes, raise levies, and manage treasury and supply across provinces.',
    'The name Hattori: if it surfaces in play, Suiren\'s Three Families and Kurogane veterans react. Assassins, offers, and betrayals may follow.',
    'Endgame path: the best general ever, the Jade Seal, the Sword Amenokiri, and the truth of the Twin Demon. The world can end in unification or total war.',
  ],
};

/** The life-stage block of Claude's memory. */
export function stageText(s: GameState): string {
  const st = lifeStage(s);
  const land = landKoku(s);
  return `LIFE STAGE: ${st} (a stage says where Li stands, never what must happen). ${ABOUT[st]}${land ? ` He holds land of about ${land} koku: family or officers run it, Li gives big orders.` : ''} Longest skip in one scene now: ${STAGE_DAYS[st]} days.`;
}
