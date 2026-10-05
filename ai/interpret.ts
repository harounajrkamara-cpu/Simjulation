import { options } from '../engine/engine';
import { met } from '../engine/engine';
import { Action, GameState } from '../engine/types';
import { AiAdapter } from './adapter';
import { Choice, interpreterPrompt } from './prompts';

// The interpreter (Game Experience ch. 5 + 7): free text → one structured action the engine allows right now.
// It never decides outcomes. When unsure it asks; when nothing fits it says so; the engine still checks everything.

export type Reading =
  | { kind: 'action'; action: Action; label: string; confidence: number; tone: string; says: string | null; risky: boolean }
  | { kind: 'command'; command: string }
  | { kind: 'ask'; question: string }
  | { kind: 'none' };

const COMMANDS: Choice[] = [
  { id: 'cmd:STATUS', label: "look at Li's own condition, stats and skills" },
  { id: 'cmd:RELATIONS', label: 'think about the people Li knows and how they see him' },
  { id: 'cmd:RECAP', label: "read Li's journal" },
  { id: 'cmd:HELP', label: 'ask how to play' },
  { id: 'wait:N', label: 'let N days pass in the usual routine (N = 1 to 30; "wait:7:train" to also train at night)' },
];

/** The possible actions now: the engine's options, talking to people who are here, and commands. */
export function choicesFor(s: GameState): { choices: Choice[]; map: Map<string, { action: Action; label: string; risky: boolean }> } {
  const map = new Map<string, { action: Action; label: string; risky: boolean }>();
  for (const o of options(s)) {
    if (o.action.kind === 'talk' && !o.action.target) continue;
    map.set(`opt:${o.key}`, { action: o.action, label: o.label, risky: !!o.risk });
  }
  if (s.date.part === 'evening' && !(s.duel && !s.duel.over)) {
    for (const [id, c] of Object.entries(s.characters)) {
      if (id === s.liId || !met(s, id) || c.location !== 'kori_camp') continue;
      if (!map.has(`talk:${id}`)) map.set(`talk:${id}`, { action: { kind: 'talk', target: id }, label: `Talk to ${c.name}`, risky: false });
    }
  }
  const choices = [...map.entries()].map(([id, v]) => ({ id, label: v.label }));
  return { choices: s.duel && !s.duel.over ? choices : choices.concat(COMMANDS), map };
}

/** Pull the first JSON object out of a reply (models sometimes add a sentence). */
export function parseJson(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export function readReply(s: GameState, reply: string): Reading {
  const j = parseJson(reply);
  if (!j) return { kind: 'none' };
  const { map } = choicesFor(s);
  const id = String(j.choice ?? 'none');
  const confidence = Math.max(0, Math.min(1, Number(j.confidence ?? 0)));
  const question = typeof j.question === 'string' && j.question.trim() ? j.question.trim() : null;
  if (question && confidence < 0.8) return { kind: 'ask', question };
  if (id.startsWith('cmd:')) return { kind: 'command', command: id.slice(4) };
  const w = id.match(/^wait:(\d{1,2})(:train)?$/);
  if (w) return { kind: 'command', command: `WAIT ${w[1]}${w[2] ? ' TRAIN' : ''}` };
  const hit = map.get(id);
  if (!hit) return { kind: 'none' };
  if (confidence < 0.5) return { kind: 'ask', question: question ?? `Do you mean: ${hit.label.toLowerCase()}?` };
  return { kind: 'action', action: hit.action, label: hit.label, confidence, tone: String(j.tone ?? 'neutral'), says: typeof j.says === 'string' ? j.says : null, risky: hit.risky };
}

export async function interpret(ai: AiAdapter, s: GameState, input: string, situation: string): Promise<Reading> {
  const { choices } = choicesFor(s);
  const reply = await ai.ask(interpreterPrompt(input, choices, situation), { json: true, tier: 'quick' });
  return readReply(s, reply);
}
