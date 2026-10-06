// Career simulation (Numbers §12 target: a strong player is free at 13–15). No dice: fixed policies, fixed world.
import { ageOn } from '../engine/calendar';
import { autoMove } from '../engine/duel';
import { li, options, skipDays, startGame, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { GameState } from '../engine/types';

export interface Career { freeAt?: { age: number; year: number; month: number }; merit: number; skirmishes: number; won: number; days: number }

/** A strong player: steps forward for the levy, trains at night, reads each opponent and answers him. */
export function strongCareer(maxDays = 360 * 4): Career {
  const s: GameState = startGame();
  let skirmishes = 0; let won = 0;
  for (let guard = 0; guard < 20000 && today(s) < maxDays && li(s).status === 'slave'; guard++) {
    if (s.duel && !s.duel.over) {
      const id = s.duel.id;
      const m = s.duel.round === 0 ? 'observe' : autoMove(s.duel);
      handleInput(s, m);
      if (!s.duel && id.startsWith('skirmish_')) { skirmishes++; if (s.flags[`duel_${id}_won`]) won++; }
      continue;
    }
    const o = options(s).find((x) => x.action.kind === 'choose' && /Step forward|fight|Take the chest/.test(x.label));
    if (o) { handleInput(s, o.key); continue; }
    const r = skipDays(s, 30, { night: 'train' });
    if (!r.events.length) handleInput(s, '1');
  }
  const c = li(s);
  const freeEv = s.events.find((e) => e.type === 'status');
  const d = freeEv ? { year: 100 + Math.floor(freeEv.day / 360), month: Math.floor((freeEv.day % 360) / 30) + 1, day: (freeEv.day % 30) + 1 } : undefined;
  return {
    freeAt: d ? { age: ageOn(c.born, { ...d, part: 'morning' }), year: d.year, month: d.month } : undefined,
    merit: s.flags.merit_service ?? 0, skirmishes, won, days: today(s),
  };
}

if (process.argv[1]?.endsWith('career.ts')) console.log(strongCareer());
