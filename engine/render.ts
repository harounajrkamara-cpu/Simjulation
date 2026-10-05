import { ageOn, formatDate } from './calendar';
import { PLACES } from './data';
import { has, li, met, options, today } from './engine';
import { opinion, relSnapshot, visibleOpinion } from './relations';
import { STAT_NAMES, WOUND_LABEL, capacityLabel, masteryLabel, rankLetter, rankScores, rankSummary } from './rules';
import { GameEvent, GameState, STAT_KEYS } from './types';

// Text rendering (ch. 11). Shows only what Li can know; hidden values stay in the engine.

const i = (x: number) => Math.floor(x);

export function shortDashboard(s: GameState): string {
  const c = li(s);
  const place = s.duel && !s.duel.over && s.duel.place ? s.duel.place : PLACES[c.location];
  const inDuel = s.duel && !s.duel.over;
  const wound = inDuel ? s.duel!.li.wound : c.wound;
  const fat = inDuel ? s.duel!.li.fatigue : c.fatigue;
  return `📅 ${formatDate(s.date)}\n📍 ${place} | ❤ ${WOUND_LABEL[wound]} · Fatigue ${fat}/3 | 💰 ${s.money} mon`;
}

/** Snapshot of what Li can notice, for the ▲▼ changes line. */
export function noticeable(s: GameState): Record<string, number> {
  const c = li(s);
  const snap: Record<string, number> = { money: s.money, fatigue: c.fatigue, wound: c.wound };
  for (const k of STAT_KEYS) snap[k] = i(c.stats[k]);
  for (const [k, v] of Object.entries(c.styles)) snap[`style:${k}`] = i(v);
  for (const [k, v] of Object.entries(c.skills)) snap[`skill:${k}`] = i(v);
  return snap;
}

export function changesLine(before: Record<string, number>, after: Record<string, number>): string {
  const parts: string[] = [];
  for (const k of Object.keys(after)) {
    const d = after[k] - (before[k] ?? 0);
    if (d === 0) continue;
    const name = k.replace('style:', '').replace('skill:', '').replace('_', ' ');
    if (k === 'wound') parts.push(`wound → ${WOUND_LABEL[after[k] as 0]}`);
    else parts.push(`${d > 0 ? '▲' : '▼'} ${name} ${d > 0 ? '+' : ''}${d}`);
  }
  return parts.length ? `Changes: ${parts.join(' · ')}` : '';
}

export function duelPanel(s: GameState): string {
  const d = s.duel;
  if (!d || d.over) return '';
  const lines = [
    `⚔ DUEL — round ${d.round + 1}/10`,
    `Li: ${WOUND_LABEL[d.li.wound]} · fatigue ${d.li.fatigue}/3${d.li.observed ? ` · read him ${Math.min(3, d.li.observed)}/3` : ''}`,
    `${d.foe.name}: ${WOUND_LABEL[d.foe.wound]} · fatigue ${d.foe.fatigue}/3 · ${d.estimate ?? ''}`,
  ];
  if (d.hint) lines.push(`What Li has read: ${d.hint}`);
  return lines.join('\n');
}

export function optionsText(s: GameState): string {
  const panel = duelPanel(s);
  const lines = options(s).map((o) => {
    const extra = [o.test, o.risk ? `⚠ ${o.risk}` : ''].filter(Boolean).join(' · ');
    return `${o.key}. ${o.label}${extra ? `  (${extra})` : ''}`;
  });
  lines.push(panel ? 'Or write what Li does: attack, counter, feint, observe, simulate, run, yield.' : 'Or write what Li does ("I…"), "wait 7" to skip a week, or HELP for commands.');
  return (panel ? panel + '\n\n' : '') + lines.join('\n');
}

export function status(s: GameState): string {
  const c = li(s);
  const r = rankScores(c);
  const age = ageOn(c.born, s.date);
  const lines = [
    `== LI · age ${age} · ${c.role} ==`,
    `Rank: ${rankSummary(c)}`,
    `Condition: ${WOUND_LABEL[c.wound]}${c.wound ? ` (${c.healDays} days to heal a step)` : ''} · Fatigue ${c.fatigue}/3 · Money ${s.money} mon`,
    'Stats: ' + STAT_KEYS.map((k) => `${k} ${c.stats[k].toFixed(1)}`).join(' · '),
    `Command: ${capacityLabel(c.stats.LEA)}`,
    'Styles: ' + Object.entries(c.styles).map(([k, v]) => `${k.replace('_', ' ')} ${v.toFixed(1)} (${masteryLabel(v)})`).join(' · '),
    'Skills: ' + Object.entries(c.skills).map(([k, v]) => `${k.replace('_', ' ')} ${i(v)}`).join(' · '),
    `Scores: Warrior ${r.warrior.toFixed(1)} · Commander ${r.commander.toFixed(1)} · Statesman ${r.statesman.toFixed(1)}`,
    `Traits: ${c.traits.join(', ')}`,
    `Training this season: ${Object.entries(s.seasonGains).map(([k, v]) => `${k.split(':')[1]} +${v.toFixed(2)}/2`).join(' · ') || 'none yet'}`,
    'Goals: survive · win his freedom · find his mother and sisters · learn why his father died',
  ];
  return lines.join('\n');
}

export function infochar(s: GameState, query: string): string {
  const id = findPerson(s, query);
  if (!id) return `Li does not know anyone called "${query}".`;
  if (id === s.liId) return status(s);
  const c = s.characters[id];
  const age = ageOn(c.born, s.date);
  return [
    `== ${c.name} · about ${age} · ${c.role} ==`,
    c.desc,
    `Estimated strength: ${c.publicRank ?? '?'}`,
    `Toward Li: ${visibleOpinion(s, id)}`,
  ].join('\n');
}

export function relationsText(s: GameState): string {
  const ids = Object.keys(s.relations).filter((id) => met(s, id));
  return ['== PEOPLE LI KNOWS ==', ...ids.map((id) => `${s.characters[id].name}: ${visibleOpinion(s, id)}`)].join('\n');
}

export function recap(s: GameState): string {
  if (!s.journal.length) return 'Li\'s journal is empty.';
  let lastDay = -1;
  const lines = ['== LI\'S JOURNAL =='];
  for (const j of s.journal) {
    if (j.day !== lastDay) {
      const m = Math.floor(j.day / 30) % 12 + 1;
      lines.push(`— Month ${m}, Day ${(j.day % 30) + 1}`);
      lastDay = j.day;
    }
    lines.push(`  ${j.text}`);
  }
  return lines.join('\n');
}

export function logText(s: GameState, n = 20): string {
  return s.events.filter((e) => e.visible).slice(-n).map((e) => `#${e.seq} [day ${e.day + 1}, ${e.part}] ${e.fact}`).join('\n');
}

export function findPerson(s: GameState, query: string): string | undefined {
  const q = query.toLowerCase().trim();
  if (!q) return undefined;
  if (['li', 'me', 'myself'].includes(q)) return s.liId;
  const ids = Object.keys(s.characters).filter((id) => id === s.liId || met(s, id));
  return ids.find((id) => id === q || s.characters[id].name.toLowerCase().includes(q) || q.includes(id));
}

export const HELP = [
  'Pick an option by number, or write what Li does, as "I…": "I train with the sticks", "I talk to Hisame", "I listen at the fire".',
  'Commands: STATUS · INFOCHAR <name> · RELATIONS · RECAP · LOG · WAIT <days> [train] (a slave plans at most 30 days; stops when something happens or the season turns) · SAVE · LOAD · HELP',
  'More commands (TROPHIES, WORLD, THREATS, REWRITE, CORRECT) come with later builds.',
].join('\n');

/** Facts the narrator may use for this turn (ch. 11 step 6). */
export function visibleFacts(events: GameEvent[]): string[] {
  return events.filter((e) => e.visible && e.type !== 'fatigue' && e.type !== 'wound').map((e) => e.fact);
}

export { rankLetter, opinion, relSnapshot, STAT_NAMES, today, has };
