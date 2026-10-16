import { met, today } from './engine';
import { currentPlan, planSteps } from './plan';
import { opinion, opinionLabel } from './relations';
import { masteryLabel } from './rules';
import { GameState } from './types';

// Sparks (Game Experience Bible: "a relationship turns · a skill unlock · a rumour about Li spreads" → a short glowing line,
// about every 10 minutes). The classic chronicle had them; Game Master mode showed none, so progress was invisible
// (night Oct 16, owner kan terugdraaien). Read from the state before and after a scene: the code decides, nothing is invented.

export interface SparkSnapshot { seq?: number; opinions: Record<string, string>; skills: Record<string, number>; styles: Record<string, string>; plan: string[]; clocks: string[] }

export function sparkSnapshot(s: GameState): SparkSnapshot {
  const c = s.characters[s.liId];
  const plan = currentPlan(s);
  return {
    seq: s.nextSeq,
    opinions: Object.fromEntries(Object.keys(s.relations).filter((id) => met(s, id) && s.characters[id]?.alive).map((id) => [id, opinionLabel(opinion(s.relations[id], today(s)))])),
    skills: Object.fromEntries(Object.entries(c.skills).map(([k, v]) => [k, Math.floor(v / 10)])),
    styles: Object.fromEntries(Object.entries(c.styles).map(([k, v]) => [k, masteryLabel(v)])),
    plan: plan ? planSteps(s, plan).filter((x) => x.done).map((x) => x.text.split(':')[0]) : [],
    clocks: (s.gm?.clocks ?? []).filter((x) => x.open).map((x) => x.name),
  };
}

/** What turned since the snapshot, as short lines for the player (never numbers he could not know). */
export function sparksSince(s: GameState, before: SparkSnapshot): string[] {
  const now = sparkSnapshot(s);
  const out: string[] = [];
  for (const [id, label] of Object.entries(now.opinions)) {
    if (before.opinions[id] && before.opinions[id] !== label) out.push(`${s.characters[id].name} ${label === 'indifferent' ? 'no longer cares either way about Li' : `now ${label}`}.`);
  }
  out.push(...relationSigns(s, before.seq ?? s.nextSeq, new Set(out.map((l) => l.split(' ')[0]))));
  for (const [k, tier] of Object.entries(now.skills)) if (tier > (before.skills[k] ?? tier)) out.push(`Li's ${k.replace(/_/g, ' ')} grows: he can feel the difference.`);
  for (const [k, label] of Object.entries(now.styles)) if (before.styles[k] && before.styles[k] !== label) out.push(`Li's ${k.replace(/_/g, ' ')}: ${label}.`);
  for (const step of now.plan) if (!before.plan.includes(step)) out.push(`A step toward his plan: ${step}.`);
  for (const name of now.clocks) if (!before.clocks.includes(name)) out.push(`Li feels something brewing: ${name}.`);
  return out.slice(0, 4);
}

/** PROVISIONAL: a hidden change this big (summed per person and feeling, in one scene) shows a sign (WB 12b #11). */
export const SIGN_AT = 5;
const SIGN: Record<string, [string, string]> = {
  trust: ['trusts Li a little more', 'trusts Li less'], respect: ['looks at Li with new respect', 'thinks less of Li'],
  affection: ['warms to Li', 'cools toward Li'], fear: ['is wary of Li now', 'is less afraid of Li'], rivalry: ['sees Li as a rival', 'lets the rivalry go'],
};

/** Every big hidden relation change since `fromSeq` shows one sign Li can notice, never the number (World Bible ch. 12b #11):
 * the change's own words when the code wrote them for the player ("Raizen sees through Li's lie"), else a plain line. */
export function relationSigns(s: GameState, fromSeq: number, skip = new Set<string>()): string[] {
  const sum = new Map<string, { npc: string; field: string; value: number; fact?: string }>();
  for (const e of s.events) {
    if (e.seq < fromSeq || e.type !== 'relation') continue;
    const d = e.data as { npc: string; field: string; value: number };
    const k = `${d.npc}:${d.field}`;
    const x = sum.get(k) ?? { npc: d.npc, field: d.field, value: 0 };
    x.value += d.value;
    if (e.visible && !x.fact) x.fact = e.fact;
    sum.set(k, x);
  }
  const out: string[] = [];
  const said = new Set<string>();
  for (const x of sum.values()) {
    const p = s.characters[x.npc];
    if (!p || said.has(x.npc) || skip.has(p.name.split(' ')[0]) || (!x.fact && Math.abs(x.value) < SIGN_AT)) continue;
    said.add(x.npc);
    out.push(x.fact ? `${x.fact.replace(/\.$/, '')}.` : `${p.name} ${SIGN[x.field]?.[x.value > 0 ? 0 : 1] ?? 'sees Li differently'}.`);
  }
  return out;
}
