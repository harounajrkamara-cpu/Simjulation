import { describe, expect, it } from 'vitest';
import { gmApply, startGmGame } from '../engine/gm';
import type { GmTurn } from '../engine/gm';
import { dramaText, fightRecords } from '../engine/drama';
import type { GameState } from '../engine/types';

// The drama layer (owner, Oct 16: "find ways to make it more interesting, and build it").
const scene = (t: Partial<GmTurn> = {}): GmTurn => ({ scene: 'The camp goes about its work.', summary: 'x', ...t });
/** A fight the code ran against Gonza, as the event log records it (start with the foe, end with the result). */
function fought(s: GameState, result: 'won' | 'lost') {
  const id = `gm_t${s.nextSeq}`;
  const at = { day: s.events.at(-1)!.day, part: s.date.part };
  s.events.push({ seq: s.nextSeq++, ...at, type: 'duel', fact: 'fight begins: Gonza', visible: false, data: { state: { id, foe: { id: 'gonza', name: 'Gonza' } } } });
  s.events.push({ seq: s.nextSeq++, ...at, type: 'story', fact: 'the fight ends', visible: true, data: { duelEnd: id, result } });
}

describe('K. rivals who remember (Nemesis)', () => {
  it('the score with a known person is kept, and a beaten one opens a revenge threat once', () => {
    const s = startGmGame();
    gmApply(s, scene({ days: 1 }));
    fought(s, 'lost');
    expect(fightRecords(s)).toMatchObject([{ id: 'gonza', fights: 1, won: 0, lost: 1, last: 'lost' }]);
    gmApply(s, scene());
    expect(s.gm?.clocks ?? []).toEqual([]); // Gonza won: he taunts, he does not need revenge
    fought(s, 'won');
    gmApply(s, scene());
    expect(s.gm!.clocks!.find((c) => c.id === 'revenge_gonza')).toMatchObject({ name: expect.stringMatching(/^Gonza.*wants it back$/), open: true, size: 6 });
    gmApply(s, scene());
    expect(s.gm!.clocks!.filter((c) => c.id === 'revenge_gonza')).toHaveLength(1);
    expect(dramaText(s)).toMatch(/SCORES WITH LI.*Gonza[^:]*: 2 fights, Li won 1, lost 1; last won/);
  });
});

describe('L + M. reactions, payoffs, open questions, chapter hooks', () => {
  it('what Li did is talked about; with no open storyline the next scene plants a question', () => {
    const s = startGmGame();
    expect(dramaText(s)).toMatch(/NO OPEN QUESTION/);
    gmApply(s, scene({ turns: 'Li exposed the oat thief', changes: [{ kind: 'thread', id: 'coat', text: 'Who wore the white rock coat?' } as never] }));
    const t = dramaText(s);
    expect(t).toMatch(/WHAT PEOPLE TALK ABOUT.*Li exposed the oat thief/);
    expect(t).not.toMatch(/NO OPEN QUESTION/);
  });

  it('an old open storyline waits for its payoff; the last scene of a chapter ends on a hook', () => {
    const s = startGmGame();
    gmApply(s, scene({ changes: [{ kind: 'thread', id: 'coat', text: 'Who wore the white rock coat?' } as never] }));
    gmApply(s, scene({ days: 15 }));
    expect(dramaText(s)).toMatch(/SETUPS WAITING FOR A PAYOFF.*white rock coat/);
    for (let k = 0; k < 17; k++) gmApply(s, scene({ days: 1 }));
    expect(dramaText(s)).toMatch(/THE CHAPTER ENDS WITH THIS SCENE/);
  });
});
