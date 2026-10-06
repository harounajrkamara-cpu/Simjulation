// Career simulation (Numbers §12 target: a strong player is free at 13–15). No dice: fixed policies, fixed world.
import { ageOn } from '../engine/calendar';
import { autoMove } from '../engine/duel';
import { li, options, skipDays, startGame, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { rankScores } from '../engine/rules';
import { GameState } from '../engine/types';

export interface Career { freeAt?: { age: number; year: number; month: number }; how?: string; merit: number; skirmishes: number; won: number; officers: number; money: number; days: number }

/** Officer strength (Warrior score) the strong player is willing to face: within 4 points of his own. */
const OFFICER_SCORE = { 'Gochō': 29, 'Kogashira': 37 } as const;

/**
 * A strong player: steps forward for the levy, trains at night, reads each opponent and answers him, and goes for an
 * officer at the ford only when Li is nearly his match (otherwise he holds the line).
 */
export function strongCareer(maxDays = 360 * 4): Career {
  const s: GameState = startGame();
  let skirmishes = 0; let won = 0; let officers = 0;
  for (let guard = 0; guard < 20000 && today(s) < maxDays && li(s).status === 'slave'; guard++) {
    if (s.duel && !s.duel.over) {
      const id = s.duel.id;
      const m = s.duel.round === 0 ? 'observe' : autoMove(s.duel);
      handleInput(s, m);
      if (!s.duel && /^(skirmish|officer)_/.test(id)) { skirmishes++; if (s.flags[`duel_${id}_won`]) won++; if (id.startsWith('officer_')) officers++; }
      continue;
    }
    const opts = options(s);
    const officer = opts.find((x) => /^Go for the /.test(x.label));
    if (officer) {
      const rank = officer.label.replace('Go for the ', '') as keyof typeof OFFICER_SCORE;
      const brave = rankScores(li(s)).warrior >= OFFICER_SCORE[rank] - 4;
      handleInput(s, brave ? officer.key : opts.find((x) => /Hold your place/.test(x.label))!.key);
      continue;
    }
    const o = opts.find((x) => x.action.kind === 'choose' && /Step forward|fight|Take the chest/.test(x.label));
    if (o) { handleInput(s, o.key); continue; }
    const r = skipDays(s, 30, { night: 'train' });
    if (!r.events.length) handleInput(s, '1');
  }
  const c = li(s);
  const freeEv = s.events.find((e) => e.type === 'status');
  const d = freeEv ? { year: 100 + Math.floor(freeEv.day / 360), month: Math.floor((freeEv.day % 360) / 30) + 1, day: (freeEv.day % 30) + 1 } : undefined;
  return {
    freeAt: d ? { age: ageOn(c.born, { ...d, part: 'morning' }), year: d.year, month: d.month } : undefined,
    how: s.knowledge.find((k) => k === 'hunted') ? 'escape' : (s.flags.kogashira_head ?? 0) > 0 ? 'officer head' : freeEv ? 'merit' : undefined,
    merit: s.flags.merit_service ?? 0, skirmishes, won, officers, money: s.money, days: today(s),
  };
}

if (process.argv[1]?.endsWith('career.ts')) console.log(strongCareer());
