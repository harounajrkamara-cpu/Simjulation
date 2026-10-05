import { GameEvent } from '../engine/types';
import { AiAdapter } from './adapter';
import { checkNarration } from './checker';
import { FactPacket } from './packet';
import { narratorPrompt } from './prompts';

// The narrator loop (Game Experience ch. 7): write → fact check → one automatic rewrite → template text.
// The player never sees a narration that failed the check.

export interface Narration { text: string; source: 'ai' | 'template'; problems: string[] }

export function templateText(p: FactPacket): string {
  return p.facts.join('\n\n');
}

/** AI writes for free text, people and story moments; routine stays template (owner decision, ch. 7). */
export function shouldNarrate(events: GameEvent[], freeText: boolean): boolean {
  if (freeText) return true;
  return events.some((e) => e.visible && (e.type === 'story' || e.type === 'rumour' || (e.type === 'work' && !!(e.data as { beat?: string }).beat)));
}

export async function narrate(ai: AiAdapter, p: FactPacket, signal?: AbortSignal): Promise<Narration> {
  if (!p.facts.length) return { text: '', source: 'template', problems: [] };
  const tier = p.tier === 'legend' ? 'complex' : 'default';
  let problems: string[] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = (await ai.ask(narratorPrompt(p, problems), { tier, signal })).trim();
    const check = checkNarration(text, p);
    if (check.ok) return { text, source: 'ai', problems: [] };
    problems = check.problems;
  }
  return { text: templateText(p), source: 'template', problems };
}
