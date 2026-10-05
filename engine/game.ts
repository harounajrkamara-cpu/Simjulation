import { has, li, maxSkipDays, options, skipDays, startGame, takeAction, today } from './engine';
import { HELP, changesLine, findPerson, infochar, logText, noticeable, optionsText, recap, relationsText, shortDashboard, status, visibleFacts } from './render';
import { Action, GameState } from './types';

// One input → one reply. Shared by the terminal, the chat mode and the browser.
// Without an AI, free text is read with simple keyword rules; if unclear, the game asks (ch. 12b #1).

export interface Reply {
  text: string;
  /** Set when the caller should save/load (handled by the CLI or browser). */
  command?: 'save' | 'load' | 'new';
}

export function newGame(worldNumber = 1): { state: GameState; text: string } {
  const state = startGame(worldNumber);
  const intro = state.events.filter((e) => e.type === 'story').map((e) => e.fact).join('\n\n');
  return { state, text: `${intro}\n\n${shortDashboard(state)}\n\n${optionsText(state)}` };
}

/** Free-text reader for the no-AI mode. Returns an action, a question, or null. */
export function parseFreeText(s: GameState, input: string): { action?: Action; ask?: string } {
  const t = input.toLowerCase();
  const part = s.date.part;
  if (s.duel && !s.duel.over) {
    const map: [RegExp, string][] = [
      [/\b(simulate|auto|play out)\b/, 'auto'], [/\b(run|flee|escape)\b/, 'flee'], [/\b(yield|surrender|give up)\b/, 'yield'],
      [/\b(feint|fake|trick)\b/, 'feint'], [/\b(counter|defend|block|parry|guard)\b/, 'counter'],
      [/\b(observe|watch|read|wait|study)\b/, 'observe'], [/\b(attack|strike|stab|slash|charge|hit)\b/, 'attack'],
    ];
    const hit = map.filter(([re]) => re.test(t));
    if (hit.length === 1) return { action: { kind: 'duel', target: hit[0][1] } };
    if (hit.length > 1) return { ask: `Do you mean: ${hit.map((h) => h[1]).join(' or ')}?` };
    return { ask: 'Li is in a fight! Attack, counter, feint, observe, simulate, run or yield?' };
  }
  const who = (words: string) => findPerson(s, words);
  const m = t.match(/(?:talk|speak|ask|chat)(?: to| with)?\s+(.+)/);
  if (m) {
    const id = who(m[1]);
    return id ? { action: { kind: 'talk', target: id } } : { ask: `Talk to whom? Li knows: ${Object.keys(s.relations).filter((id) => has(s, `met_${id}`)).join(', ')}.` };
  }
  const want = (re: RegExp) => re.test(t);
  const matches: Action[] = [];
  if (want(/\b(train(ing)?|practi[cs]e|sticks?|spar)\b/)) matches.push({ kind: 'train', target: want(/\b(body|strength|run|stone|endurance|val)\b/) ? 'VAL' : 'two_swords' });
  if (want(/\b(sleep|bed)\b/)) matches.push({ kind: 'sleep' });
  if (want(/\b(rest|relax)\b/)) matches.push({ kind: 'rest' });
  if (want(/\b(chores?|work(ing)?|water|wood|clean(ing)?)\b/)) matches.push({ kind: 'chores' });
  if (want(/\b(sukez|cook|kitchen|wounded|medicine)\b/) && !want(/letter|lesson|read/)) matches.push({ kind: 'help_sukezo' });
  if (want(/\b(watch(ing)?|observe|drills?)\b/)) matches.push({ kind: 'watch_drill' });
  if (want(/\b(letters?|lessons?|read(ing)?|study|write|writing)\b/)) matches.push({ kind: 'lesson' });
  if (want(/\b(listen(ing)?|rumou?rs?|fire|gossip)\b/)) matches.push({ kind: 'listen' });
  if (want(/\b(eat|food|meal)\b/)) matches.push({ kind: 'eat_with', target: 'hachi' });
  const allowed = options(s).map((o) => o.action.kind);
  const fitting = matches.filter((a) => allowed.includes(a.kind));
  if (fitting.length === 1) return { action: fitting[0] };
  if (fitting.length > 1) return { ask: `Do you mean: ${fitting.map((a) => a.kind.replace('_', ' ')).join(' or ')}?` };
  if (matches.length) return { ask: `That is not possible in the ${part}. ${partHint(part)}` };
  return { ask: `I did not understand that. ${partHint(part)} (Type HELP for commands.)` };
}

function partHint(part: string): string {
  if (part === 'night') return 'At night Li can sleep or train in secret.';
  if (part === 'evening') return 'In the evening Li can study, eat, talk, listen or rest.';
  return 'By day Li works: chores, help Sukezō, or watch the drill.';
}

export function handleInput(s: GameState, raw: string): Reply {
  const input = raw.trim();
  const upper = input.toUpperCase();
  if (!input) return { text: optionsText(s) };
  if (upper === 'HELP') return { text: HELP };
  if (upper === 'STATUS') return { text: status(s) };
  if (upper.startsWith('INFOCHAR')) return { text: infochar(s, input.slice(8)) };
  if (upper === 'RELATIONS') return { text: relationsText(s) };
  if (upper === 'RECAP') return { text: recap(s) };
  if (upper === 'LOG') return { text: logText(s) };
  if (upper === 'SAVE') return { text: 'Saving…', command: 'save' };
  if (upper === 'LOAD') return { text: 'Loading…', command: 'load' };
  if (upper === 'NEW') return { text: 'Starting a new game…', command: 'new' };

  const before = noticeable(s);
  const w = upper.match(/^(WAIT|SKIP)\s+(\d+)(\s+TRAIN)?$/);
  if (w) {
    const asked = Number(w[2]);
    const days = Math.min(asked, maxSkipDays(s));
    const capped = asked > days ? `(Li can plan at most ${days} days ahead${li(s).status === 'slave' ? ' as a slave' : ''}: skipping ${days} days.)\n` : '';
    const dayBefore = today(s);
    const r = skipDays(s, days, { night: w[3] ? 'train' : 'sleep' });
    const passed = today(s) - dayBefore;
    const head = capped + (r.interrupted ? `⏸ The days pass… until something happens:\n\n${r.interrupted}` : `⏩ ${passed} days pass in the usual routine.`);
    const alerts = r.events.filter((e) => e.type === 'alert' || e.type === 'rumour').map((e) => `${e.type === 'rumour' ? '◆' : '⚠'} ${e.fact}`);
    return { text: [head, ...alerts.slice(-3), '', shortDashboard(s), changesLine(before, noticeable(s)), '', optionsText(s)].filter((x) => x !== undefined).join('\n') };
  }

  let action: Action | undefined;
  const opt = options(s).find((o) => o.key === input);
  if (opt) action = opt.action;
  if (!action) {
    const p = parseFreeText(s, input);
    if (p.ask) return { text: p.ask };
    action = p.action;
  }
  if (action!.kind === 'talk' && !action!.target) return { text: 'Talk to whom? Type for example: talk hisame' };

  const dayBefore = today(s);
  const r = takeAction(s, action!);
  const facts = visibleFacts(r.events);
  const out = [facts.join('\n\n')];
  if (r.refused) return { text: out.join('\n') };
  out.push('', shortDashboard(s));
  const ch = changesLine(before, noticeable(s));
  if (ch) out.push(ch);
  if (today(s) !== dayBefore && li(s).wound > 0) out.push(`(Healing: ${li(s).healDays} days left for this wound step.)`);
  out.push('', optionsText(s));
  return { text: out.join('\n') };
}
