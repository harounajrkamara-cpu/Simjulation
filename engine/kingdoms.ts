import { ageOn } from './calendar';
import { has } from './engine';
import { ALL_FACTIONS } from './court';
import { discontent } from './discontent';
import { careerOf } from './gm-career';
import { publicWorld, KingdomId } from './world-public';
import { Draft, GameState } from './types';

// The kingdoms' hidden values beyond authority (World Bible ch. 13b; Atlas §3, §8, §12) and their laws. Phase 6 block F
// (audit gaps 10, 11), built Oct 17. ⚠ PROVISIONAL starting values read from the Atlas (owner kan terugdraaien).

export const KINGDOMS: KingdomId[] = ['kurogane', 'suiren', 'hayate', 'ushio', 'takane', 'tatara', 'kitakaze'];
const NAME: Record<KingdomId, string> = { kurogane: 'Kurogane', suiren: 'Suiren', hayate: 'Hayate', ushio: 'Ushio', takane: 'Takane', tatara: 'Tatara', kitakaze: 'Kitakaze' };

/** Atlas §3: the Crown's share of the land (crown koku ÷ kingdom koku). */
export const ROYAL_SHARE: Record<KingdomId, number> = { kurogane: 55, suiren: 30, hayate: 40, ushio: 35, takane: 45, tatara: 80, kitakaze: 35 };
/** PROVISIONAL treasury at the start (0–100), from Atlas §3/§8: Ushio coin-rich, Takane poor, Kurogane drained by the canal. */
export const TREASURY_START: Record<KingdomId, number> = { kurogane: 55, suiren: 70, hayate: 45, ushio: 85, takane: 30, tatara: 60, kitakaze: 35 };
/** The royal house of each kingdom (engine/houses.ts ids). */
export const ROYAL: Record<KingdomId, string> = { kurogane: 'asagiri', suiren: 'hasunuma', hayate: 'shinonome', ushio: 'wadatsumi', takane: 'kiriyama', tatara: 'tatara', kitakaze: 'fuyutsuki' };
/** PROVISIONAL yearly treasury changes: at war −3; Kurogane's canal −5 until it is decided; otherwise +3 toward 60. */
export const TREASURY_RULES = { war: -3, canal: -5, calm: 3, rest: 60, poor: 25 } as const;

export const treasury = (s: GameState, k: KingdomId) => s.flags[`treasury_${k}`] ?? TREASURY_START[k];
/** Unity = 100 − the average discontent of the kingdom's court factions (Tatara has none: 95). */
export function unity(s: GameState, k: KingdomId): number {
  const fs = ALL_FACTIONS.filter((f) => f.kingdom === k);
  return fs.length ? Math.round(100 - fs.reduce((a, f) => a + discontent(s, f.id), 0) / fs.length) : 95;
}
/** Succession: a grown heir is secure; a child heir or none is not. */
export function succession(s: GameState, k: KingdomId): { word: string; score: number } {
  const h = s.houses?.[ROYAL[k]];
  const heir = h?.heir ? s.characters[h.heir] : undefined;
  if (!h) return { word: 'unknown', score: 50 };
  if (!heir || !heir.alive) return { word: 'contested: no heir', score: 15 };
  return ageOn(heir.born, s.date) >= 15 ? { word: `secure (${heir.name})`, score: 70 } : { word: `a child heir (${heir.name})`, score: 35 };
}
export const atWar = (s: GameState, k: KingdomId) => publicWorld(s.date).relations.some((r) => r.stance === 'war' && (r.a === k || r.b === k));
/** The Crown cannot pay in full when its treasury is low: soldiers in its service get half (engine/pay.ts). */
export const crownPoor = (s: GameState, k: KingdomId) => treasury(s, k) < TREASURY_RULES.poor;

/** Each year that turns: treasuries move. */
export function kingdomYearDrafts(s: GameState, from: number, to: number): Draft[] {
  let years = 0;
  for (let k = from + 1; k <= to; k++) if (k % 360 === 0) years++;
  if (!years) return [];
  const out: Draft[] = [];
  for (const k of KINGDOMS) {
    const t = treasury(s, k);
    const change = (atWar(s, k) ? TREASURY_RULES.war : 0) + (k === 'kurogane' && !has(s, 'fuse_canal') ? TREASURY_RULES.canal : 0);
    const next = Math.max(0, Math.min(100, change ? t + change * years : t + Math.sign(TREASURY_RULES.rest - t) * Math.min(Math.abs(TREASURY_RULES.rest - t), TREASURY_RULES.calm * years)));
    if (next !== t) out.push({ type: 'flag', fact: `${NAME[k]} treasury ${next}`, visible: false, data: { key: `treasury_${k}`, value: next } });
  }
  return out;
}

// ── Laws (Atlas §12) ──

export interface Law { style: string; slavery: string; captive: string; ransom: number; releaseDays?: number }
/** What each kingdom's law does to a man; `ransom` multiplies a captive's price; `releaseDays` frees a captive by law. */
export const LAWS: Record<KingdomId, Law> = {
  kurogane: { style: 'harsh written law; collective punishment (a squad pays for one deserter)', slavery: 'slaves may fight; an enemy officer\'s head or 30 merit in service frees a slave (merit law)', captive: 'held hard until ransomed', ransom: 1 },
  suiren: { style: 'law for sale; nobles judged by nobles', slavery: 'many household slaves; almost no way out', captive: 'ransom costs double: the law is for sale', ransom: 2 },
  hayate: { style: 'warrior law; disputes settled by duel', slavery: 'war captives become slaves; brave captives are freed', captive: 'a captive who wins a fight is freed with honour', ransom: 1 },
  ushio: { style: 'merchant courts and contracts', slavery: 'debt slavery: a man can buy himself free', captive: 'ransom at half: a contract like any other', ransom: 0.5 },
  takane: { style: 'clan law; the elders judge', slavery: 'rare', captive: 'the elders decide; ransom as usual', ransom: 1 },
  tatara: { style: "the king's edicts", slavery: 'none: forbidden by the king; a refuge for runaways', captive: 'no man is kept: released within a month', ransom: 0, releaseDays: 30 },
  kitakaze: { style: 'the chief judges; a duel or a blood-price', slavery: 'captives work a set number of years, then go free', captive: 'works a year, then goes free', ransom: 1, releaseDays: 360 },
};

/** The kingdom that holds Li captive: the one his own kingdom is at war with (first listed), else his own. */
export function captorOf(s: GameState): KingdomId {
  const mine = careerOf(s).kingdom;
  const r = publicWorld(s.date).relations.find((x) => x.stance === 'war' && (x.a === mine || x.b === mine) && KINGDOMS.includes((x.a === mine ? x.b : x.a) as KingdomId));
  return ((r ? (r.a === mine ? r.b : r.a) : mine) as KingdomId);
}

/** For Claude's memory: Li's kingdom in full, the others in one line; the law where Li is. */
export function kingdomsText(s: GameState): string {
  const mine = careerOf(s).kingdom;
  const line = (k: KingdomId, full: boolean) => {
    const sc = succession(s, k);
    const t = treasury(s, k);
    return full
      ? `- ${NAME[k]}: treasury ${t} (${t < TREASURY_RULES.poor ? 'POOR: soldiers get half pay' : t >= 70 ? 'rich' : 'enough'}), unity ${unity(s, k)}, succession ${sc.word}, Crown land ${ROYAL_SHARE[k]}%${atWar(s, k) ? ', at war' : ''}. LAW: ${LAWS[k].style}. SLAVERY: ${LAWS[k].slavery}.`
      : `- ${NAME[k]}: treasury ${t}, unity ${unity(s, k)}, succession ${sc.word}.`;
  };
  return [`THE KINGDOMS (hidden values; the code moves them):`, line(mine, true), ...KINGDOMS.filter((k) => k !== mine).map((k) => line(k, false))].join('\n');
}

