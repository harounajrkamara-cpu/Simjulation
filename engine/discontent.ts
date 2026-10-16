import { dateFromIndex } from './calendar';
import { KingdomId } from './career';
import { ALL_FACTIONS, memberOf } from './court';
import { careerOf } from './gm-career';
import { Draft, GameState } from './types';

// Faction discontent (World Bible ch. 13 factions + ch. 12b; Numbers §9, approved formula; goal Oct 17). Every month:
//   change = 10 × (power ratio − 0.6) + grievance + foreign support + leader legitimacy − Crown authority ÷ 20 − dread ÷ 25
// clamped 0–100. At 100 an ultimatum: accepted (the faction is the stronger, ratio ≥ 1) → the Crown loses authority;
// refused → civil war. Then discontent starts again from 0. No dice. The per-faction inputs are PROVISIONAL (owner kan
// terugdraaien); Crown authority starts from the seven-profiles table.

/** Crown authority and dread per kingdom (authority: WB profile "Auth"; dread PROVISIONAL). */
export const CROWN: Record<KingdomId, { authority: number; dread: number }> = {
  kurogane: { authority: 55, dread: 40 }, suiren: { authority: 25, dread: 30 }, hayate: { authority: 50, dread: 45 },
  ushio: { authority: 30, dread: 20 }, takane: { authority: 60, dread: 35 }, tatara: { authority: 95, dread: 90 }, kitakaze: { authority: 40, dread: 50 },
};

/** PROVISIONAL inputs per faction, read from the profile text: [power ratio, grievance 0–5, foreign 0–3, legitimacy 0–2]. */
export const INPUTS: Record<string, [number, number, number, number]> = {
  old_blood: [0.7, 4, 0, 2], kings_men: [0.8, 1, 0, 2], favourite: [0.8, 3, 0, 1], chancellor: [0.6, 1, 0, 1],
  suiren_families: [1.2, 1, 0, 2], suiren_reformers: [0.2, 3, 0, 1], suiren_border: [0.5, 4, 0, 1],
  hayate_generals: [0.9, 3, 0, 2], hayate_favourite: [0.3, 1, 2, 0],
  ushio_regent: [0.9, 1, 0, 2], ushio_royalists: [0.4, 3, 0, 2], ushio_trade: [0.4, 2, 1, 1],
  takane_loyalists: [0.6, 0, 0, 2], takane_ambitious: [0.2, 3, 0, 1], takane_separatists: [0.35, 4, 3, 1],
  kitakaze_crown: [0.6, 0, 0, 2], kitakaze_chiefs: [0.9, 2, 0, 2],
};

export const discontent = (s: GameState, f: string) => s.flags[`disc_${f}`] ?? 0;
export const authority = (s: GameState, k: KingdomId) => s.flags[`auth_${k}`] ?? CROWN[k].authority;

/** One month's change for a faction (Numbers §9). Li in the faction as a general adds his men to its power. */
export function monthlyChange(s: GameState, f: string): number {
  const fac = ALL_FACTIONS.find((x) => x.id === f);
  const inp = INPUTS[f];
  if (!fac || !inp) return 0;
  const liPower = memberOf(s) === f && careerOf(s).kingdom === fac.kingdom ? 0.1 : 0;
  const [ratio, grievance, foreign, legit] = inp;
  return 10 * (ratio + liPower - 0.6) + grievance + foreign + legit - authority(s, fac.kingdom) / 20 - CROWN[fac.kingdom].dread / 25;
}

/** Time passes from `from` to `to`: each month that begins moves every faction; an ultimatum fires at 100. */
export function discontentDrafts(s: GameState, from: number, to: number): Draft[] {
  const months = Math.floor(to / 30) - Math.floor(from / 30);
  if (months <= 0) return [];
  const out: Draft[] = [];
  const disc: Record<string, number> = Object.fromEntries(ALL_FACTIONS.map((f) => [f.id, discontent(s, f.id)]));
  const auth: Partial<Record<KingdomId, number>> = {};
  const authOf = (k: KingdomId) => auth[k] ?? authority(s, k);
  for (let m = 1; m <= months; m++) {
    for (const f of ALL_FACTIONS) {
      if (!INPUTS[f.id]) continue;
      const fakeAuth = { ...s, flags: { ...s.flags, [`auth_${f.kingdom}`]: authOf(f.kingdom) } } as GameState;
      disc[f.id] = Math.max(0, Math.min(100, disc[f.id] + monthlyChange(fakeAuth, f.id)));
      if (disc[f.id] < 100) continue;
      const date = dateFromIndex((Math.floor(from / 30) + m) * 30);
      const accepted = INPUTS[f.id][0] >= 1;
      const k = `${f.kingdom[0].toUpperCase()}${f.kingdom.slice(1)}`;
      const news = accepted
        ? `In ${k}, ${f.name} sent the throne an ultimatum, and the throne gave way: the Crown is weaker now.`
        : `In ${k}, ${f.name} sent the throne an ultimatum; it was refused, and there is civil war.`;
      if (accepted) auth[f.kingdom] = Math.max(5, authOf(f.kingdom) - 10);
      const here = careerOf(s).kingdom === f.kingdom;
      out.push({ type: here ? 'story' : 'flag', fact: `Year ${date.year}, Month ${date.month}: ${news}`, visible: here, journal: here ? `News: ${news}` : undefined, data: here ? { news: `ultimatum_${f.id}` } : { key: `ultimatum_${f.id}`, value: (s.flags[`ultimatum_${f.id}`] ?? 0) + 1 } });
      if (!accepted) out.push({ type: 'flag', fact: `civil war in ${k}`, visible: false, data: { key: `civil_war_${f.kingdom}`, value: 1 } });
      disc[f.id] = 0;
    }
  }
  for (const f of ALL_FACTIONS) if (INPUTS[f.id] && disc[f.id] !== discontent(s, f.id)) out.push({ type: 'flag', fact: `${f.name}: discontent ${Math.round(disc[f.id])}`, visible: false, data: { key: `disc_${f.id}`, value: Math.round(disc[f.id] * 10) / 10 } });
  for (const [k, v] of Object.entries(auth)) out.push({ type: 'flag', fact: `${k}: Crown authority ${v}`, visible: false, data: { key: `auth_${k}`, value: v } });
  return out;
}

/** In words, for the memory and the court. */
export const discontentWord = (v: number) => (v >= 85 ? 'near an ultimatum' : v >= 60 ? 'angry' : v >= 30 ? 'restless' : 'quiet');
