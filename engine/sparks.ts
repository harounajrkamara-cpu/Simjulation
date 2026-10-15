import { met, today } from './engine';
import { currentPlan, planSteps } from './plan';
import { opinion, opinionLabel } from './relations';
import { masteryLabel } from './rules';
import { GameState } from './types';

// Sparks (Game Experience Bible: "a relationship turns · a skill unlock · a rumour about Li spreads" → a short glowing line,
// about every 10 minutes). The classic chronicle had them; Game Master mode showed none, so progress was invisible
// (night Oct 16, owner kan terugdraaien). Read from the state before and after a scene: the code decides, nothing is invented.

export interface SparkSnapshot { opinions: Record<string, string>; skills: Record<string, number>; styles: Record<string, string>; plan: string[]; clocks: string[] }

export function sparkSnapshot(s: GameState): SparkSnapshot {
  const c = s.characters[s.liId];
  const plan = currentPlan(s);
  return {
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
  for (const [k, tier] of Object.entries(now.skills)) if (tier > (before.skills[k] ?? tier)) out.push(`Li's ${k.replace(/_/g, ' ')} grows: he can feel the difference.`);
  for (const [k, label] of Object.entries(now.styles)) if (before.styles[k] && before.styles[k] !== label) out.push(`Li's ${k.replace(/_/g, ' ')}: ${label}.`);
  for (const step of now.plan) if (!before.plan.includes(step)) out.push(`A step toward his plan: ${step}.`);
  for (const name of now.clocks) if (!before.clocks.includes(name)) out.push(`Li feels something brewing: ${name}.`);
  return out.slice(0, 3);
}
