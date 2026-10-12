import { Character, StatKey, Wound } from './types';

// Numbers Sheet v0.3 formulas. Every function is pure and deterministic.

export const RANK_BANDS: [number, string][] = [
  [90, 'S'], [75, 'A'], [60, 'B'], [45, 'C'], [30, 'D'], [15, 'E'], [0, 'F'],
];

export function rankLetter(score: number): string {
  for (const [min, letter] of RANK_BANDS) if (score >= min) return letter;
  return 'F';
}

export function bestStyle(c: Character): number {
  return Math.max(0, ...Object.values(c.styles));
}

/** Numbers §1. */
export function rankScores(c: Character) {
  const warrior = (c.stats.VAL + bestStyle(c)) / 2;
  const commander = (c.stats.LEA + c.stats.INT) / 2;
  const statesman = (c.stats.POL + c.stats.INT) / 2;
  return { warrior, commander, statesman, overall: Math.max(warrior, commander, statesman) };
}

export function rankSummary(c: Character): string {
  const s = rankScores(c);
  return `${rankLetter(s.overall)} (Warrior ${rankLetter(s.warrior)} / Commander ${rankLetter(s.commander)} / Statesman ${rankLetter(s.statesman)})`;
}

/** Numbers §2 age factor. */
export function ageFactor(age: number): number {
  if (age <= 15) return 1.3;
  if (age <= 25) return 1.2;
  if (age <= 35) return 1.0;
  if (age <= 45) return 0.8;
  return 0.5;
}

/** Numbers §2 challenge factor by rank difference (opponent − self, in bands). */
export function challengeFactor(rankDiff: number): number {
  if (rankDiff <= -2) return 0.2;
  if (rankDiff === -1) return 0.5;
  if (rankDiff === 0) return 1.0;
  if (rankDiff === 1) return 1.5;
  if (rankDiff === 2) return 2.5;
  return 4;
}

/** Gain = base × age × room × challenge (Numbers §2). Never above potential. */
export function growthGain(base: number, age: number, current: number, potential: number, challenge = 1): number {
  if (potential <= 0 || current >= potential) return 0;
  const room = (potential - current) / potential;
  const gain = base * ageFactor(age) * room * challenge;
  return Math.min(gain, potential - current);
}

/** Training/study cap per stat per season (Numbers §2). */
export const SEASON_TRAINING_CAP = 2.0;

/** Round to 3 decimals so stored values stay stable. */
export function r3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

/** Command capacity (Numbers §3). */
export function commandCapacity(lea: number): number {
  return Math.round(10 ** (1 + lea / 25));
}

export function capacityLabel(lea: number): string {
  if (lea < 15) return 'handles a few';
  if (lea < 30) return 'small unit';
  if (lea < 45) return 'company';
  if (lea < 60) return 'battalion';
  if (lea < 75) return 'large formation';
  if (lea < 90) return 'army';
  return 'great army';
}

export const WOUND_LABEL: Record<Wound, string> = {
  0: 'Fresh', 1: 'Hurt', 2: 'Wounded', 3: 'Badly wounded', 4: 'Down',
};

/** Healing days per wound step (Numbers §4). */
export const HEAL_DAYS: Record<Wound, number> = { 0: 0, 1: 3, 2: 21, 3: 75, 4: 75 };

export function masteryLabel(m: number): string {
  if (m <= 20) return 'Beginner';
  if (m <= 40) return 'Advanced';
  if (m <= 60) return 'Expert';
  if (m <= 80) return 'Master';
  return 'Legendary';
}

export const STAT_NAMES: Record<StatKey, string> = {
  LEA: 'Leadership', VAL: 'Valour', INT: 'Intellect', POL: 'Politics',
};
