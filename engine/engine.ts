import { dateFromIndex, dayIndex, nextPart, seasonKey } from './calendar';
import { BEATS, DUELS, Effect, RUMOURS, STORY, StoryEvent } from './content';
import { DuelMove, DuelState, MOVE_LABEL, autoMove, duelRound } from './duel';
import { challengeFactor, rankLetter, rankScores, RANK_BANDS } from './rules';
import { createWorld } from './data';
import { hashValue } from './hash';
import { opinion } from './relations';
import { HEAL_DAYS, SEASON_TRAINING_CAP, growthGain, r3 } from './rules';
import { ageOn } from './calendar';
import { spreadDrafts } from './rumours';
import { Action, Draft, GameEvent, GameState, Option, Part, StatKey, Wound } from './types';

// The deterministic core: resolve(state, action) → events; apply(state, event) → state.
// No randomness anywhere (World Bible ch. 12b). Hidden causes are fixed rules.

// ---------- apply (reducer) ----------

export function apply(state: GameState, ev: GameEvent): void {
  const d = ev.data as Record<string, any>;
  switch (ev.type) {
    case 'time': {
      state.date = d.to;
      const key = seasonKey(state.date);
      if (key !== state.seasonKey) {
        state.seasonKey = key;
        state.seasonGains = {};
      }
      break;
    }
    case 'stat':
      state.characters[d.char].stats[d.stat as StatKey] = r3(state.characters[d.char].stats[d.stat as StatKey] + d.amount);
      if (d.capKey) state.seasonGains[d.capKey] = r3((state.seasonGains[d.capKey] ?? 0) + d.amount);
      break;
    case 'style': {
      const c = state.characters[d.char];
      c.styles[d.style] = r3((c.styles[d.style] ?? 0) + d.amount);
      if (d.capKey) state.seasonGains[d.capKey] = r3((state.seasonGains[d.capKey] ?? 0) + d.amount);
      break;
    }
    case 'skill': {
      const c = state.characters[d.char];
      c.skills[d.skill] = r3(Math.min(100, (c.skills[d.skill] ?? 0) + d.amount));
      break;
    }
    case 'fatigue':
      state.characters[d.char].fatigue = d.value;
      break;
    case 'wound':
      state.characters[d.char].wound = d.wound;
      state.characters[d.char].healDays = d.healDays;
      break;
    case 'relation':
      state.relations[d.npc].mods.push({ id: ev.seq, field: d.field, value: d.value, reason: d.reason, startDay: ev.day, fadeDays: d.fade });
      break;
    case 'memory':
      state.memories.push({ id: ev.seq, npc: d.npc, day: ev.day, what: d.what, source: d.source, certainty: d.certainty, weight: d.weight, key: d.key, from: d.from, rel: d.rel, sign: d.sign });
      break;
    case 'knowledge':
      if (!state.knowledge.includes(d.key)) state.knowledge.push(d.key);
      break;
    case 'flag':
      state.flags[d.key] = d.value;
      break;
    case 'money':
      state.money += d.amount;
      break;
    case 'duel':
      state.duel = d.state ? structuredClone(d.state) : null;
      break;
    case 'heard':
      state.relations[d.npc].heard.push(d.beat);
      state.relations[d.npc].lastTalkDay = ev.day;
      break;
    default:
      break; // story, work, alert: text only
  }
  if (ev.journal) state.journal.push({ day: ev.day, text: ev.journal });
  state.events.push(ev);
  state.nextSeq = ev.seq + 1;
}

function commit(state: GameState, drafts: Draft[]): GameEvent[] {
  const out: GameEvent[] = [];
  for (const dr of drafts) {
    const ev: GameEvent = { ...dr, seq: state.nextSeq, day: dayIndex(state.date), part: state.date.part };
    apply(state, ev);
    out.push(ev);
  }
  return out;
}

// ---------- helpers ----------

export const li = (s: GameState) => s.characters[s.liId];
export const today = (s: GameState) => dayIndex(s.date);
export const has = (s: GameState, key: string): number => s.flags[key] ?? (s.knowledge.includes(key) ? 1 : 0);
export const met = (s: GameState, id: string) => has(s, `met_${id}`) > 0;
export const liAge = (s: GameState) => ageOn(li(s).born, s.date);

/** Hidden cause: Gonza walks the camp every fourth night, except on paydays (1st and 16th) when he is drunk. */
export function gonzaPatrols(s: GameState): boolean {
  const payday = s.date.day === 1 || s.date.day === 16;
  return !payday && today(s) % 4 === 1;
}

/** Hidden cause: Gonza checks the drill ground every third day. */
export function gonzaWatchesDrill(s: GameState): boolean {
  return today(s) % 3 === 0;
}

function growth(s: GameState, kind: 'stat' | 'style', key: string, base: number, capped: boolean, why: string): Draft[] {
  const c = li(s);
  const current = kind === 'stat' ? c.stats[key as StatKey] : c.styles[key] ?? 0;
  const potential = kind === 'stat' ? c.potential[key as StatKey] : c.potential.VAL; // style ceiling follows VAL potential
  let gain = growthGain(base, liAge(s), current, potential);
  const capKey = capped ? `${kind}:${key}` : undefined;
  if (capKey) gain = Math.min(gain, Math.max(0, SEASON_TRAINING_CAP - (s.seasonGains[capKey] ?? 0)));
  gain = r3(gain);
  if (gain <= 0) return [];
  const data: Record<string, unknown> = kind === 'stat' ? { char: c.id, stat: key, amount: gain } : { char: c.id, style: key, amount: gain };
  if (capKey) data.capKey = capKey;
  return [{ type: kind, fact: `${why}: ${key} +${gain}`, visible: false, data }];
}

function skill(s: GameState, key: string, amount: number): Draft[] {
  return [{ type: 'skill', fact: `skill ${key} +${amount}`, visible: false, data: { char: s.liId, skill: key, amount } }];
}

function rel(npc: string, field: string, value: number, reason: string, fade: number | null, visible = false): Draft {
  return { type: 'relation', fact: `${npc}: ${field} ${value > 0 ? '+' : ''}${value} (${reason})`, visible, data: { npc, field, value, reason, fade } };
}

function fatigue(s: GameState, value: number): Draft[] {
  const v = Math.max(0, Math.min(3, value));
  if (v === li(s).fatigue) return [];
  return [{ type: 'fatigue', fact: `Li fatigue → ${v}`, visible: true, data: { char: s.liId, value: v } }];
}

function effectDrafts(s: GameState, e: Effect | undefined): Draft[] {
  if (!e) return [];
  const out: Draft[] = [];
  if (e.knowledge && !s.knowledge.includes(e.knowledge)) out.push({ type: 'knowledge', fact: `Li learns: ${e.knowledge}`, visible: false, data: { key: e.knowledge } });
  if (e.flag) out.push({ type: 'flag', fact: `flag ${e.flag[0]} = ${e.flag[1]}`, visible: false, data: { key: e.flag[0], value: e.flag[1] } });
  for (const r of e.rel ?? []) out.push(rel(r.npc, r.field, r.value, r.reason, r.fade));
  if (e.style) out.push({ type: 'style', fact: `advice: ${e.style.style} +${e.style.amount}`, visible: false, data: { char: s.liId, style: e.style.style, amount: e.style.amount } });
  if (e.memory) out.push({ type: 'memory', fact: `${e.memory.npc} remembers: ${e.memory.what}`, visible: false, data: { ...e.memory } });
  return out;
}

// ---------- options (ch. 11: 3–5 numbered options + free text + Continue) ----------

export function options(s: GameState): Option[] {
  if (s.duel && !s.duel.over) {
    const moves: Option[] = (['attack', 'counter', 'feint', 'observe'] as DuelMove[]).map((m, i) => ({ key: String(i + 1), label: MOVE_LABEL[m], action: { kind: 'duel', target: m }, test: '⚔️ VAL' }));
    moves.push({ key: '5', label: 'Let the fight play out (simulate)', action: { kind: 'duel', target: 'auto' } });
    moves.push({ key: '6', label: 'Run', action: { kind: 'duel', target: 'flee' }, risk: DUELS[s.duel.id]?.fleeRisk ?? 'shame' });
    return moves;
  }
  const part = s.date.part;
  const opts: Omit<Option, 'key'>[] = [];
  const open = openChoice(s);
  if (open) open.choice!.options.forEach((o, i) => opts.push({ label: o.label, action: { kind: 'choose', target: `${open.choice!.id}:${i}` }, test: o.test, risk: o.risk }));
  const knowsPatrol = s.knowledge.includes('gonza_patrol');
  if (part === 'morning' || part === 'afternoon') {
    opts.push({ label: 'Do the chores in the camp', action: { kind: 'chores' }, test: 'camp work' });
    opts.push({ label: 'Help Old Sukezō with cooking and the wounded', action: { kind: 'help_sukezo' }, test: 'medicine' });
    opts.push({ label: 'Work near the drill ground and watch Raizen train the men', action: { kind: 'watch_drill' }, test: '👁 observation', risk: 'Gonza may catch Li idling' });
  } else if (part === 'evening') {
    if (has(s, 'lessons_open')) opts.push({ label: 'Letters with Old Sukezō', action: { kind: 'lesson' }, test: '📖 INT' });
    opts.push({ label: 'Eat with Hachi', action: { kind: 'eat_with', target: 'hachi' } });
    opts.push({ label: 'Talk to someone (raizen, gonza, rokubei, hisame, sukezo, hachi…)', action: { kind: 'talk' } });
    opts.push({ label: 'Sit near the soldiers\' fire and listen', action: { kind: 'listen' }, test: '👂 rumours' });
    opts.push({ label: 'Rest', action: { kind: 'rest' } });
  } else {
    opts.push({ label: 'Sleep', action: { kind: 'sleep' } });
    const risk = knowsPatrol ? (gonzaPatrols(s) ? 'Gonza patrols tonight!' : 'Gonza does not patrol tonight') : 'Gonza sometimes walks the camp at night';
    opts.push({ label: 'Train in secret with two sticks', action: { kind: 'train', target: 'two_swords' }, test: '⚔️ two swords', risk });
    opts.push({ label: 'Train the body in secret (strength, endurance)', action: { kind: 'train', target: 'VAL' }, test: '⚔️ VAL', risk });
  }
  for (const id of ['sayo', 'kaname', 'daisuke']) {
    if (isVisitingToday(s, id) && s.relations[id].lastTalkDay !== today(s)) opts.unshift({ label: `Talk to ${s.characters[id].name} (visiting today)`, action: { kind: 'talk', target: id } });
  }
  return opts.slice(0, 6).map((o, i) => ({ ...o, key: String(i + 1) }));
}

// ---------- resolve ----------

function storyAt(s: GameState): StoryEvent[] {
  return STORY.filter((e) => e.day === today(s) && e.part === s.date.part && !has(s, `story_${e.id}`));
}

/** Story beats that fire at the current moment (before the player acts). */
export function storyDrafts(s: GameState): Draft[] {
  const out: Draft[] = [];
  for (const e of storyAt(s)) {
    out.push({ type: 'story', fact: e.text, visible: true, journal: e.journal, data: { id: e.id } });
    out.push({ type: 'flag', fact: `story ${e.id} done`, visible: false, data: { key: `story_${e.id}`, value: 1 } });
    for (const m of e.meet ?? []) out.push({ type: 'flag', fact: `met ${m}`, visible: false, data: { key: `met_${m}`, value: 1 } });
    if (e.duel) out.push(...startDuel(s, e.duel));
    if (e.choice) out.push({ type: 'flag', fact: `choice ${e.choice.id} open`, visible: false, data: { key: `choice_${e.choice.id}`, value: 1 } });
  }
  return out;
}

/** The story choice open right now, if any (it lapses when the part of the day ends). */
export function openChoice(s: GameState): StoryEvent | undefined {
  return STORY.find((e) => e.choice && has(s, `choice_${e.choice.id}`) === 1);
}

function nextBeat(s: GameState, npc: string) {
  const r = s.relations[npc];
  const op = opinion(r, today(s));
  return BEATS.find((b) => b.npc === npc && !r.heard.includes(b.id) && op >= b.minOpinion && (b.needs ?? []).every(([k, v]) => has(s, k) >= v));
}

function talk(s: GameState, npc: string): Draft[] {
  const c = s.characters[npc];
  if (!c || npc === s.liId) return [{ type: 'alert', fact: 'There is nobody by that name here.', visible: true, data: {} }];
  if (!met(s, npc)) return [{ type: 'alert', fact: `Li does not know anyone called ${c.name} yet.`, visible: true, data: {} }];
  const here = c.location === 'kori_camp' || isVisitingToday(s, npc);
  if (!here) return [{ type: 'alert', fact: `${c.name} is not in the camp.`, visible: true, data: {} }];
  const r = s.relations[npc];
  if (r.lastTalkDay === today(s)) return [{ type: 'work', fact: `${c.name} has no more to say to Li today.`, visible: true, data: { npc } }];
  const b = nextBeat(s, npc);
  const warm: Draft[] = npc === 'gonza' || npc === 'ishizue' ? [] : [rel(npc, 'trust', 1, 'Spent time together', 60), rel(npc, 'affection', 1, 'Spent time together', 60)];
  if (!b) return [{ type: 'work', fact: `Li talks with ${c.name} a while, but nothing new comes of it.`, visible: true, data: { npc } }, { type: 'heard', fact: 'talked', visible: false, data: { npc, beat: `chat_${today(s)}` } }, ...warm];
  return [
    { type: 'work', fact: b.text, visible: true, journal: b.journal, data: { npc, beat: b.id } },
    { type: 'heard', fact: `heard ${b.id}`, visible: false, data: { npc, beat: b.id } },
    { type: 'flag', fact: `${b.id} done`, visible: false, data: { key: `${b.id}_done`, value: 1 } },
    ...effectDrafts(s, b.effect),
    ...warm,
  ];
}

/** Visitors from story events stay in the camp for the day they arrive. */
function isVisitingToday(s: GameState, npc: string): boolean {
  return STORY.some((e) => e.day === today(s) && (e.meet ?? []).includes(npc) && has(s, `story_${e.id}`) > 0);
}

export function resolve(s: GameState, a: Action): Draft[] {
  const c = li(s);
  const out: Draft[] = [];
  const part = s.date.part;
  switch (a.kind) {
    case 'chores': {
      out.push({ type: 'work', fact: 'Li hauls water, splits wood and cleans armour all through the ' + part + '.', visible: true, data: {} });
      out.push(...skill(s, 'camp_work', 0.1), ...skill(s, 'endurance', 0.05));
      out.push({ type: 'flag', fact: 'chores done', visible: false, data: { key: 'chores_total', value: has(s, 'chores_total') + 1 } });
      if ((has(s, 'chores_total') + 1) % 10 === 0) out.push(rel('rokubei', 'trust', 2, 'Works hard without being told', 1095), rel('raizen', 'trust', 1, 'A slave who does his work', 1095));
      break;
    }
    case 'help_sukezo': {
      out.push({ type: 'work', fact: 'Li helps Old Sukezō at the cooking fire and with a soldier\'s infected cut.', visible: true, data: {} });
      out.push(...skill(s, 'medicine', 0.15));
      if (s.relations.sukezo.lastTalkDay !== today(s)) out.push(rel('sukezo', 'affection', 1, 'Helped me', 1095));
      out.push({ type: 'flag', fact: 'chores done', visible: false, data: { key: 'chores_total', value: has(s, 'chores_total') + 1 } });
      break;
    }
    case 'watch_drill': {
      out.push({ type: 'work', fact: 'Li carries arrows near the drill ground and watches Raizen correct the spearmen, every step, every turn of the hips.', visible: true, data: {} });
      out.push(...growth(s, 'style', 'two_swords', 0.02, true, 'watching Raizen'));
      out.push(...growth(s, 'stat', 'INT', 0.01, true, 'reading the drill'));
      out.push(...skill(s, 'observation', 0.1));
      out.push({ type: 'flag', fact: 'watched drill', visible: false, data: { key: 'watched_drill', value: has(s, 'watched_drill') + 1 } });
      if (gonzaWatchesDrill(s)) {
        out.push({ type: 'alert', fact: 'Gonza catches Li standing still and cuffs him hard across the head. "Work, rat!"', visible: true, journal: 'Gonza caught me watching the drill and hit me.', data: {} });
        out.push(...fatigue(s, c.fatigue + 1));
        out.push({ type: 'memory', fact: 'Gonza remembers: the slave boy watches the drills instead of working.', visible: false, data: { npc: 'gonza', what: 'The slave boy idles at the drill ground.', source: 'saw', certainty: 100, weight: 20 } });
      }
      break;
    }
    case 'lesson': {
      if (!has(s, 'lessons_open')) return [{ type: 'alert', fact: 'Sukezō has not offered Li lessons yet. Talk to him first.', visible: true, data: {} }];
      out.push({ type: 'work', fact: 'By the cooking fire Old Sukezō draws characters in the ash, and Li copies them.', visible: true, data: {} });
      out.push(...skill(s, 'reading', 0.3), ...growth(s, 'stat', 'INT', 0.02, true, 'study'));
      out.push({ type: 'flag', fact: 'lesson', visible: false, data: { key: 'lessons', value: has(s, 'lessons') + 1 } });
      if (has(s, 'lessons') % 5 === 4) out.push(rel('sukezo', 'affection', 2, 'A good student', 1095));
      break;
    }
    case 'eat_with': {
      const npc = a.target ?? 'hachi';
      out.push({ type: 'work', fact: `Li eats his rice beside ${s.characters[npc].name}.`, visible: true, data: {} });
      out.push(...talk(s, npc));
      if (s.relations[npc].lastTalkDay !== today(s)) out.push(rel(npc, 'affection', 1, 'Shared a meal', 1095));
      break;
    }
    case 'talk': {
      if (!a.target) return [{ type: 'alert', fact: 'Talk to whom? Type for example: talk hisame', visible: true, data: {} }];
      out.push(...talk(s, a.target));
      break;
    }
    case 'listen': {
      const n = has(s, 'rumours_heard');
      if (n < RUMOURS.length) {
        out.push({ type: 'work', fact: `Li sits in the shadows near the soldiers' fire. Someone says: ${RUMOURS[n]}`, visible: true, journal: `Rumour at the fire: ${RUMOURS[n]}`, data: {} });
        out.push({ type: 'flag', fact: 'rumour heard', visible: false, data: { key: 'rumours_heard', value: n + 1 } });
      } else {
        out.push({ type: 'work', fact: 'The soldiers talk about dice, women and pay. Nothing new tonight.', visible: true, data: {} });
      }
      out.push(...skill(s, 'observation', 0.05));
      break;
    }
    case 'rest': {
      out.push({ type: 'work', fact: 'Li rests his aching body.', visible: true, data: {} });
      out.push(...fatigue(s, c.fatigue - 1));
      break;
    }
    case 'sleep': {
      out.push({ type: 'work', fact: 'Li sleeps on the straw by the horse lines.', visible: true, data: {} });
      out.push(...fatigue(s, c.fatigue - 2));
      out.push(...heal(s));
      break;
    }
    case 'train': {
      if (c.fatigue >= 3) return [{ type: 'alert', fact: 'Li is too exhausted to train. Sleep first.', visible: true, data: {} }];
      if (c.wound >= 2) return [{ type: 'alert', fact: 'Li\'s wound will not let him train.', visible: true, data: {} }];
      const target = a.target === 'VAL' ? 'VAL' : 'two_swords';
      if (gonzaPatrols(s)) {
        out.push({ type: 'alert', fact: 'Halfway through, a torch comes around the horse lines. Gonza. He drags Li up by the hair and beats him with the butt of his spear.', visible: true, journal: 'Gonza caught me training at night and beat me.', data: {} });
        out.push({ type: 'wound', fact: 'Li is Hurt', visible: true, data: { char: c.id, wound: Math.max(c.wound, 1) as Wound, healDays: HEAL_DAYS[1] } });
        out.push(...fatigue(s, c.fatigue + 1));
        out.push({ type: 'memory', fact: 'Gonza remembers: the slave boy trains with sticks at night.', visible: false, data: { npc: 'gonza', what: 'Caught the slave boy training [with two sticks] at night.', source: 'saw', certainty: 100, weight: 40, key: 'li_trains_at_night' } });
        out.push(rel('gonza', 'rivalry', 5, 'A slave who wants to be a soldier', 270));
        break;
      }
      out.push({ type: 'work', fact: target === 'VAL'
        ? 'In the dark behind the horse lines Li runs, lifts stones and pushes his body until his arms shake.'
        : 'In the dark behind the horse lines Li moves through Raizen\'s steps with two sticks, again and again.', visible: true, data: {} });
      if (target === 'VAL') out.push(...growth(s, 'stat', 'VAL', 0.02, true, 'night training'), ...skill(s, 'endurance', 0.1));
      else out.push(...growth(s, 'style', 'two_swords', 0.02, true, 'night training'));
      out.push(...fatigue(s, c.fatigue + 1));
      out.push({ type: 'flag', fact: 'trained', visible: false, data: { key: 'trained_nights', value: has(s, 'trained_nights') + 1 } });
      break;
    }
    case 'meet':
      out.push(...talk(s, a.target ?? ''));
      break;
    case 'duel':
      out.push(...duelTurn(s, a.target ?? 'attack'));
      break;
    case 'choose':
      out.push(...choose(s, a.target ?? ''));
      break;
  }
  return out;
}

/** A story choice (GE ch. 8 teaching beats, later story): its outcome, or the duel it starts. */
function choose(s: GameState, target: string): Draft[] {
  const [id, idx] = target.split(':');
  const ev = STORY.find((e) => e.choice?.id === id);
  const opt = ev?.choice?.options[Number(idx)];
  if (!ev || !opt || has(s, `choice_${id}`) !== 1) return [{ type: 'alert', fact: 'That chance has passed.', visible: true, data: {} }];
  const out: Draft[] = [{ type: 'flag', fact: `choice ${id} made`, visible: false, data: { key: `choice_${id}`, value: 3 + Number(idx) } }];
  if (opt.duel) return out.concat(startDuel(s, opt.duel));
  const res = opt.outcome!;
  out.push({ type: 'story', fact: res.fact, visible: true, journal: res.journal, data: { choice: id, option: Number(idx) } });
  if (res.skill) out.push(...skill(s, res.skill[0], res.skill[1]));
  for (const r of res.rel ?? []) out.push(rel(r.npc, r.field, r.value, r.reason, r.fade));
  for (const m of res.memory ?? []) out.push({ type: 'memory', fact: `${s.characters[m.npc]?.name ?? m.npc} remembers`, visible: false, data: { ...m } });
  return out;
}

// ---------- duels (ch. 6a) ----------

const rankIndex = (score: number) => RANK_BANDS.length - 1 - RANK_BANDS.findIndex(([min]) => score >= min);

function startDuel(s: GameState, id: string): Draft[] {
  const t = DUELS[id];
  const c = li(s);
  const mastery = Math.max(0, ...Object.values(c.styles));
  const state: DuelState = {
    id, round: 0, over: false, surprise: t.surprise, prefs: { ...t.prefs }, place: t.place, estimate: t.foe.estimate,
    li: { id: c.id, name: 'Li', val: c.stats.VAL, mastery, wound: c.wound, fatigue: c.fatigue, observed: 0, history: [] },
    foe: { id: t.foe.id, name: t.foe.name, val: t.foe.val, mastery: t.foe.mastery, wound: t.foe.wound, fatigue: t.foe.fatigue, observed: 0, history: [] },
  };
  return [
    { type: 'story', fact: `${t.intro}\n\nOpponent (Li\'s estimate): ${t.foe.estimate}.`, visible: true, data: { duel: id } },
    { type: 'duel', fact: `duel ${id} begins`, visible: false, data: { state } },
  ];
}

function duelTurn(s: GameState, choice: string): Draft[] {
  if (!s.duel || s.duel.over) return [{ type: 'alert', fact: 'There is no fight going on.', visible: true, data: {} }];
  let d = s.duel;
  const out: Draft[] = [];
  if (choice === 'flee') {
    d = { ...structuredClone(d), over: true, result: 'fled' };
    out.push({ type: 'work', fact: DUELS[d.id].fleeText, visible: true, data: {} });
  } else if (choice === 'yield') {
    d = { ...structuredClone(d), over: true, result: 'yielded' };
    out.push({ type: 'work', fact: DUELS[d.id].yieldText, visible: true, data: {} });
  } else {
    const auto = choice === 'auto';
    let guard = 0;
    do {
      const move = (auto ? autoMove(d) : choice) as DuelMove;
      const r = duelRound(d, move);
      d = r.state;
      out.push({ type: 'work', fact: r.lines.join(' '), visible: true, data: { round: d.round } });
      guard++;
    } while (auto && !d.over && guard < 10);
  }
  out.push({ type: 'duel', fact: `duel round → ${d.round}`, visible: false, data: { state: d } });
  if (d.over) out.push(...duelEnd(s, d));
  return out;
}

function duelEnd(s: GameState, d: DuelState): Draft[] {
  const c = li(s);
  const t = DUELS[d.id];
  const res = t.outcomes[d.result as keyof typeof t.outcomes];
  const out: Draft[] = [];
  const liWound = Math.min(t.maxWound, d.li.wound) as Wound;
  const foeRank = rankIndex((d.foe.val + d.foe.mastery) / 2);
  const myRank = rankIndex(rankScores(c).warrior);
  const ch = challengeFactor(foeRank - myRank);
  const age = liAge(s);
  if (liWound !== c.wound) out.push({ type: 'wound', fact: `Li is ${liWound >= 3 ? 'badly wounded' : liWound === 2 ? 'wounded' : liWound === 1 ? 'hurt' : 'unhurt'}`, visible: true, data: { char: c.id, wound: liWound, healDays: HEAL_DAYS[liWound] } });
  out.push(...fatigue(s, Math.min(3, d.li.fatigue + 1)));
  if (liWound >= 3) out.push({ type: 'flag', fact: 'near-death', visible: false, data: { key: 'near_death', value: has(s, 'near_death') + 1 } });
  out.push({ type: 'story', fact: res.fact, visible: true, journal: res.journal, data: { duelEnd: d.id, result: d.result } });
  if (res.grow > 0) {
    for (const [kind, key] of [['stat', 'VAL'], ['style', 'two_swords']] as const) {
      const cur = kind === 'stat' ? c.stats.VAL : c.styles.two_swords ?? 0;
      const g = r3(growthGain(res.grow, age, cur, c.potential.VAL, ch));
      if (g > 0) out.push({ type: kind, fact: `duel growth: ${key} +${g}`, visible: false, data: kind === 'stat' ? { char: c.id, stat: 'VAL', amount: g } : { char: c.id, style: 'two_swords', amount: g } });
    }
  }
  if (res.merit) out.push({ type: 'flag', fact: `combat merit +${res.merit.amount} (${res.merit.why})`, visible: true, data: { key: 'merit_combat', value: has(s, 'merit_combat') + res.merit.amount } });
  for (const r of res.rel ?? []) out.push(rel(r.npc, r.field, r.value, r.reason, r.fade));
  for (const m of res.memory ?? []) out.push({ type: 'memory', fact: `${s.characters[m.npc]?.name ?? m.npc} remembers the fight`, visible: false, data: { ...m } });
  for (const m of res.meet ?? []) out.push({ type: 'flag', fact: `met ${m}`, visible: false, data: { key: `met_${m}`, value: 1 } });
  out.push({ type: 'flag', fact: `duel ${d.id} done`, visible: false, data: { key: `duel_${d.id}_${d.result}`, value: 1 } });
  out.push({ type: 'duel', fact: 'duel over', visible: false, data: { state: null } });
  return out;
}

function heal(s: GameState): Draft[] {
  const c = li(s);
  if (c.wound === 0) return [];
  const left = c.healDays - 1;
  if (left > 0) return [{ type: 'wound', fact: `healing: ${left} days left`, visible: false, data: { char: c.id, wound: c.wound, healDays: left } }];
  const w = (c.wound - 1) as Wound;
  return [{ type: 'wound', fact: w === 0 ? 'Li\'s wound has healed' : 'Li\'s wound is better', visible: true, data: { char: c.id, wound: w, healDays: HEAL_DAYS[w] } }];
}

// ---------- turns ----------

export interface TurnResult {
  events: GameEvent[];
  /** True when the action was refused (no time passes). */
  refused: boolean;
}

/** Advance time by one part and fire any story that starts then. */
function advance(s: GameState): GameEvent[] {
  const to = nextPart(s.date);
  const open = openChoice(s);
  if (open) commit(s, [{ type: 'flag', fact: `choice ${open.choice!.id} lapsed`, visible: false, data: { key: `choice_${open.choice!.id}`, value: 2 } }]);
  const evs = commit(s, [{ type: 'time', fact: `time → ${to.year}/${to.month}/${to.day} ${to.part}`, visible: false, data: { to } }]);
  // Night falls: what was said at the fire moves one step further (rumours, ch. 8).
  if (to.part === 'night') evs.push(...commit(s, spreadDrafts(s, (id) => met(s, id))));
  return evs.concat(commit(s, storyDrafts(s)));
}

/** Fire story for the very first moment of a new game. */
export function startGame(worldNumber = 1): GameState {
  const s = createWorld(worldNumber);
  commit(s, storyDrafts(s));
  return s;
}

/**
 * Record what the AI layer did, without changing the world (ch. 12b #1, GE ch. 5): the stored intent behind an action,
 * or the approved narration of a turn, so a loaded game shows the same story. Time does not pass.
 */
export function recordNote(s: GameState, type: 'intent' | 'narration', fact: string, data: Record<string, unknown>): GameEvent {
  return commit(s, [{ type, fact, visible: false, data }])[0];
}

export function takeAction(s: GameState, a: Action): TurnResult {
  const wasDuel = !!s.duel && !s.duel.over;
  const drafts = resolve(s, a);
  const refused = drafts.length > 0 && drafts.every((d) => d.type === 'alert') && !drafts.some((d) => d.journal);
  const events = commit(s, drafts);
  if (refused) return { events, refused };
  // During a duel, time stands still until it ends.
  if (wasDuel && s.duel) return { events, refused };
  return { events: events.concat(advance(s)), refused };
}

/** Default routine used by WAIT/skip (ch. 9 timeskips). */
export function routineAction(s: GameState, plan: { night: 'sleep' | 'train' }): Action {
  const part: Part = s.date.part;
  if (part === 'morning' || part === 'afternoon') return { kind: 'chores' };
  if (part === 'evening') return has(s, 'lessons_open') ? { kind: 'lesson' } : { kind: 'eat_with', target: 'hachi' };
  if (plan.night === 'train' && li(s).fatigue < 2 && li(s).wound < 2 && !(s.knowledge.includes('gonza_patrol') && gonzaPatrols(s))) return { kind: 'train', target: 'two_swords' };
  return { kind: 'sleep' };
}

/**
 * Longest skip per life stage (Game Experience ch. 9 §6): slave 1 month · soldier 1 season.
 * Officer and up (1 year) arrives with ranks in stage 2.
 */
export function maxSkipDays(s: GameState): number {
  return li(s).status === 'slave' ? 30 : 90;
}

/**
 * Skip whole days with a routine (World Bible ch. 9). Same result as playing those days with the same routine.
 * Stops early for a story event, a fight, or the turn of a season.
 */
export function skipDays(s: GameState, days: number, plan: { night: 'sleep' | 'train' }): { events: GameEvent[]; interrupted?: string } {
  const all: GameEvent[] = [];
  const endDay = today(s) + Math.min(days, maxSkipDays(s));
  while (today(s) < endDay) {
    if (s.duel) return { events: all, interrupted: 'A fight is going on.' };
    const season = s.seasonKey;
    const r = takeAction(s, routineAction(s, plan));
    all.push(...r.events);
    const stories = r.events.filter((e) => e.type === 'story');
    if (stories.length) return { events: all, interrupted: stories.map((e) => e.fact).join('\n\n') };
    if (s.seasonKey !== season) {
      const [year, name] = s.seasonKey.split('-');
      return { events: all, interrupted: `The season turns: ${name}, Year ${year}.` };
    }
  }
  return { events: all };
}

// ---------- saves & determinism ----------

export function stateHash(s: GameState): string {
  const { events, ...rest } = s;
  return hashValue({ rest, events: events.length });
}

/** Rebuild a game from its event log (event sourcing). */
export function replay(worldNumber: number, events: GameEvent[]): GameState {
  const s = createWorld(worldNumber);
  for (const ev of events) apply(s, structuredClone(ev));
  return s;
}

/** Bump when start data or rules change in a way that breaks old saves (ch. 12b #12). */
export const DATA_VERSION = 4;

export interface SaveFile {
  game: 'sengoku-soldier';
  saveVersion: 1;
  dataVersion: number;
  worldNumber: number;
  hash: string;
  events: GameEvent[];
}

export function toSave(s: GameState): SaveFile {
  return { game: 'sengoku-soldier', saveVersion: 1, dataVersion: DATA_VERSION, worldNumber: s.worldNumber, hash: stateHash(s), events: s.events };
}

export function fromSave(f: SaveFile): GameState {
  if (f.game !== 'sengoku-soldier' || f.saveVersion !== 1) throw new Error('Unknown save file version.');
  if (f.dataVersion !== DATA_VERSION) throw new Error(`This save was made with an older game version (${f.dataVersion ?? 1}, now ${DATA_VERSION}) and cannot be upgraded yet.`);
  const s = replay(f.worldNumber, f.events);
  if (stateHash(s) !== f.hash) throw new Error('Save file check failed: the replayed state does not match.');
  return s;
}

export { dateFromIndex };
