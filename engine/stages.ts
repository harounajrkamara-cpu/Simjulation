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

/** The life-stage block of Claude's memory. */
export function stageText(s: GameState): string {
  const st = lifeStage(s);
  const land = landKoku(s);
  return `LIFE STAGE: ${st} (a stage says where Li stands, never what must happen). ${ABOUT[st]}${land ? ` He holds land of about ${land} koku: family or officers run it, Li gives big orders.` : ''} Longest skip in one scene now: ${STAGE_DAYS[st]} days.`;
}
