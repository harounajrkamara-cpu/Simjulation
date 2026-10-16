import { has, li, met, today } from './engine';
import { careerOf } from './gm-career';
import { rankLevel } from './career';
import { ALL_FACTIONS, standing } from './court';
import { reputation } from './reputation';
import { underLi } from './loyalty';
import { FADE, opinion } from './relations';
import { Draft, GameState } from './types';
import { KINGDOMS, LAWS, captorOf } from './kingdoms';
import type { KingdomId } from './world-public';

// Li's fate when things go wrong (Phase 6 block E, audit gaps 9 and 23; built Oct 17, PROVISIONAL, owner kan terugdraaien).
// - Lies are caught or believed by a fixed rule (Game Experience ch. 5): the listener's INT and eye against Li's POL.
// - The defeat ladder (World Bible ch. 12b #10): Li cannot die, so losing must cost. Each defeat within a year climbs one
//   step; a win steps back down. The code applies the cost of each step; Claude tells it.

// ── Lies ──

/** PROVISIONAL: the listener sees through a lie when INT + half his observation beats Li's POL + 15 (+15 when he trusts Li). */
export function seesThrough(s: GameState, npc: string, truthKnown = false): boolean {
  const p = s.characters[npc];
  if (!p) return false;
  if (truthKnown) return true;
  const trusts = (s.relations[npc]?.base.trust ?? 0) >= 60;
  const eye = p.stats.INT + (p.skills.observation ?? 0) / 2;
  return eye > li(s).stats.POL + 15 + (trusts ? 15 : 0);
}

const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24);
export const openLies = (s: GameState) => (s.gm?.threads ?? []).filter((t) => t.open && t.id.startsWith('lie_'));

/** {kind:"lie", npc, about, truthKnown?, believed?, discovered?}: the code decides whether the lie holds. */
export function lieDrafts(s: GameState, x: Record<string, unknown>, notes: string[], secretNotes: string[]): Draft[] {
  const npc = String(x.npc ?? '');
  const p = s.characters[npc];
  if (!p || !s.relations[npc]) { notes.push(`no person "${npc}" for the lie`); return []; }
  const about = String(x.about ?? '').trim().slice(0, 120);
  if (x.discovered) {
    const t = openLies(s).find((y) => y.id.startsWith(`lie_${npc}_`));
    if (!t) { notes.push(`Li told ${p.name} no lie that is still hidden`); return []; }
    return [
      { type: 'thread', fact: `found out: ${t.text}`, visible: false, data: { id: t.id, text: t.text, open: false } },
      { type: 'relation', fact: `${p.name} finds out Li lied`, visible: true, data: { npc, field: 'trust', value: -8, reason: 'a lie found out (scar)', fade: FADE.permanent } },
      { type: 'relation', fact: 'lie found out', visible: false, data: { npc, field: 'trust', value: -7, reason: 'a lie found out', fade: FADE.humiliation } },
    ];
  }
  if (!about) { notes.push('a lie needs what it was about'); return []; }
  const caught = seesThrough(s, npc, x.truthKnown === true);
  if (typeof x.believed === 'boolean' && x.believed === caught) secretNotes.push(`${p.name} ${caught ? 'saw through' : 'believed'} Li's lie about ${about}: the code decided it (tell it so next scene)`);
  if (caught) return [
    { type: 'relation', fact: `${p.name} sees through Li's lie`, visible: true, data: { npc, field: 'trust', value: -8, reason: `caught lying about ${about}`, fade: FADE.humiliation } },
    { type: 'memory', fact: `${p.name} remembers the lie`, visible: false, data: { npc, what: `caught Li lying about ${about}`, source: 'saw', certainty: 100, weight: 60 } },
  ];
  return [{ type: 'thread', fact: `${p.name} believes Li (about ${about})`, visible: false, data: { id: `lie_${npc}_${slug(about)}`, text: `Li lied to ${p.name} about ${about}; ${p.name} believed him (for now)`, open: true } }];
}

/** For Claude: who near Li would see through a lie now. */
export function liesText(s: GameState): string {
  const near = Object.keys(s.relations).filter((id) => met(s, id) && s.characters[id]?.alive && s.characters[id].location === li(s).location);
  if (!near.length) return '';
  const caught = near.filter((id) => seesThrough(s, id)).map((id) => s.characters[id].name);
  const fooled = near.filter((id) => !seesThrough(s, id)).map((id) => s.characters[id].name);
  return `IF LI LIES NOW (the code decides; record it with {"kind":"lie","npc":"<id>","about":"...","believed":true|false}): ${caught.length ? `${caught.join(', ')} would see through it` : 'nobody here would see through it'}${fooled.length ? `; ${fooled.join(', ')} would believe him` : ''}. Someone who knows the truth always sees through it ("truthKnown":true). A lie found out later: {"kind":"lie","npc":"<id>","discovered":true}.${openLies(s).length ? `\nLIES STILL HIDDEN: ${openLies(s).map((t) => t.text).join(' · ')}` : ''}`;
}

// ── The defeat ladder ──

export const LADDER = ['setback', 'wound and recovery time', 'a lost chance', 'public humiliation', 'a disappointed sponsor', 'rank loss', 'capture', 'a follower dies because of Li\'s failure', 'permanent political damage'] as const;
/** PROVISIONAL: a defeat older than this no longer counts toward the next step. */
export const LADDER_WINDOW = 360;
export const LOST_CHANCE_DAYS = 90;
export const ladderStep = (s: GameState) => (today(s) - has(s, 'defeat_day') > LADDER_WINDOW ? 0 : has(s, 'defeat_step'));

/** A defeat (a deadly fight lost, a battle lost, an order disobeyed that failed): one step up, and its cost. */
export function defeatDrafts(s: GameState, cause: string): Draft[] {
  const step = Math.min(LADDER.length, ladderStep(s) + 1);
  const out: Draft[] = [
    { type: 'flag', fact: `defeat: ${cause}`, visible: false, data: { key: 'defeat_step', value: step } },
    { type: 'flag', fact: 'defeat day', visible: false, data: { key: 'defeat_day', value: today(s) } },
  ];
  const c = li(s);
  const what = LADDER[step - 1];
  switch (step) {
    case 1: case 2: break; // a setback; the wound and its days are the fight's own
    case 3: out.push({ type: 'flag', fact: 'Li loses his chance: no promotion for a while', visible: true, data: { key: 'chance_lost_until', value: today(s) + LOST_CHANCE_DAYS } }); break;
    case 4:
      out.push({ type: 'flag', fact: 'the soldiers talk of Li\'s defeat', visible: true, data: { key: 'rep_soldiers', value: Math.max(0, reputation(s, 'soldiers') - 5) } });
      for (const id of Object.keys(s.relations).filter((x) => met(s, x) && s.characters[x]?.alive && s.characters[x].location === c.location)) out.push({ type: 'relation', fact: `${s.characters[id].name} saw Li shamed`, visible: false, data: { npc: id, field: 'respect', value: -5, reason: 'saw Li humiliated', fade: FADE.humiliation } });
      break;
    case 5:
      for (const id of Object.keys(s.relations).filter((x) => met(s, x) && s.characters[x]?.alive && /(lord|commander|general|gashira|shō|taishō|captain|rōnin)/i.test(s.characters[x].role) && opinion(s.relations[x], today(s)) >= 30))
        out.push({ type: 'relation', fact: `${s.characters[id].name} is disappointed in Li`, visible: true, data: { npc: id, field: 'respect', value: -10, reason: 'Li failed him', fade: FADE.hardship } });
      break;
    case 6:
      if (rankLevel(careerOf(s).rank) > 0) out.push({ type: 'flag', fact: 'Li is stripped of a rank', visible: true, journal: 'They took my rank. I will earn it back.', data: { key: 'rank_level', value: has(s, 'rank_level') - 1 } });
      else out.push({ type: 'flag', fact: 'the soldiers talk of Li\'s defeat', visible: true, data: { key: 'rep_soldiers', value: Math.max(0, reputation(s, 'soldiers') - 10) } });
      break;
    case 7:
      out.push({ type: 'flag', fact: `Li is taken captive by ${captorOf(s)}`, visible: true, journal: 'They have me. Chains again.', data: { key: 'captive', value: 1 } });
      out.push({ type: 'flag', fact: 'captive since', visible: false, data: { key: 'captive_day', value: today(s) } });
      out.push({ type: 'flag', fact: 'captors', visible: false, data: { key: 'captive_by', value: KINGDOMS.indexOf(captorOf(s)) + 1 } });
      out.push({ type: 'thread', fact: 'open: Li is a captive', visible: false, data: { id: 'captive', text: 'Li is held captive by the enemy: ransom, escape (a fight the code runs) or release ends it ({"kind":"captivity","end":"ransom|escape|released"})', open: true } });
      break;
    case 8: {
      const follower = underLi(s).sort()[0] ?? Object.keys(s.relations).filter((x) => met(s, x) && s.characters[x]?.alive && x !== 'raizen' && s.relations[x].base.affection >= 60).sort()[0];
      if (follower) out.push({ type: 'status', fact: `${s.characters[follower].name} dies because of Li's failure`, visible: true, journal: `${s.characters[follower].name} died because I failed. I will carry it.`, data: { char: follower, status: s.characters[follower].status, role: s.characters[follower].role, alive: false } });
      break;
    }
    default:
      out.push({ type: 'flag', fact: 'Li\'s name is damaged among the great', visible: true, data: { key: 'rep_nobles', value: Math.max(0, reputation(s, 'nobles') - 15) } });
      for (const f of ALL_FACTIONS.filter((x) => x.kingdom === careerOf(s).kingdom)) out.push({ type: 'flag', fact: `${f.name} think less of Li`, visible: false, data: { key: `court_${f.id}`, value: Math.max(0, standing(s, f.id) - 10 + 100) } });
  }
  out.splice(2, 0, { type: 'story', fact: `The defeat costs Li: ${what}.`, visible: true, data: { defeat: step } });
  return out;
}

/** A win steps the ladder back down one. */
export function victoryDrafts(s: GameState): Draft[] {
  const step = ladderStep(s);
  return step > 0 ? [{ type: 'flag', fact: 'a win steadies Li', visible: false, data: { key: 'defeat_step', value: step - 1 } }] : [];
}

/** {kind:"captivity", end:"ransom"|"escape"|"released", reason}: how a captivity ends. */
export function captivityDrafts(s: GameState, x: Record<string, unknown>, notes: string[]): Draft[] {
  if (!has(s, 'captive')) { notes.push('Li is not a captive'); return []; }
  const end = String(x.end ?? '');
  const close: Draft[] = [{ type: 'flag', fact: 'Li is free of his captors', visible: true, data: { key: 'captive', value: 0 } }, { type: 'thread', fact: 'closed: captive', visible: false, data: { id: 'captive', text: 'Li was a captive', open: false } }];
  if (end === 'escape') {
    const won = [...s.events].reverse().find((e) => e.type === 'story' && (e.data as { duelEnd?: string }).duelEnd);
    if ((won?.data as { result?: string } | undefined)?.result !== 'won') { notes.push('an escape is a fight the code runs: start one with "fight" and win it first'); return []; }
    return close;
  }
  if (end === 'ransom') {
    // PROVISIONAL: 2 ryō per rank step, in mon, times the captors' law (Suiren ×2, Ushio ×½; Atlas §12).
    const price = Math.round(2_000 * (rankLevel(careerOf(s).rank) + 1) * LAWS[captors(s)].ransom);
    if (s.money >= price) return [{ type: 'money', fact: `Li pays his own ransom: ${price} mon`, visible: true, data: { amount: -price } }, ...close];
    return [{ type: 'flag', fact: 'Li\'s lord pays the ransom; it is remembered', visible: true, data: { key: 'rep_nobles', value: Math.max(0, reputation(s, 'nobles') - 5) } }, ...close];
  }
  if (end === 'released') return close;
  notes.push(`no captivity end "${end}" (ransom, escape, released)`);
  return [];
}

const captors = (s: GameState): KingdomId => KINGDOMS[has(s, 'captive_by') - 1] ?? captorOf(s);

/** The law of the captors frees a captive in time (Tatara keeps no man; Kitakaze's captives work a year). */
export function captivityTimeDrafts(s: GameState, to: number): Draft[] {
  if (!has(s, 'captive')) return [];
  const law = LAWS[captors(s)];
  if (!law.releaseDays || to - has(s, 'captive_day') < law.releaseDays) return [];
  return [{ type: 'flag', fact: `By the law of ${captors(s)}, Li is let go`, visible: true, journal: 'They let me go. Their law, not their mercy.', data: { key: 'captive', value: 0 } }, { type: 'thread', fact: 'closed: captive', visible: false, data: { id: 'captive', text: 'Li was a captive', open: false } }];
}

/** For Claude: where Li stands on the ladder, and captivity. */
export function fateText(s: GameState): string {
  const step = ladderStep(s);
  return [
    step ? `DEFEAT LADDER: Li has lost ${step} time${step > 1 ? 's' : ''} within a year (last cost: ${LADDER[step - 1]}). The next defeat costs: ${LADDER[Math.min(LADDER.length - 1, step)]}. A win steadies him a step.` : '',
    has(s, 'captive') ? `LI IS A CAPTIVE of ${captors(s)} (their law: ${LAWS[captors(s)].captive}): no service, no promotion; the story is about getting out.` : '',
    has(s, 'chance_lost_until') > today(s) ? 'Li lost his chance: no promotion until the shame fades.' : '',
    liesText(s),
  ].filter(Boolean).join('\n');
}

/** Who Li lied to: someone he knows named in the player's words, else the one the scene names most (fixed order). */
export function liarTarget(s: GameState, said: string, scene: string): string | undefined {
  const known = Object.keys(s.relations).filter((id) => id !== s.liId && met(s, id) && s.characters[id]?.alive);
  const word = (id: string) => s.characters[id].name.split(/\s+/).filter((w) => w.length >= 3 && !/^(the|old|lord|lady|king)$/i.test(w));
  const named = known.find((id) => word(id).some((w) => said.includes(w)));
  if (named) return named;
  const count = (id: string) => word(id).reduce((n, w) => n + (scene.split(w).length - 1), 0);
  return known.map((id) => [id, count(id)] as const).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}
