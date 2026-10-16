import { describe, expect, it } from 'vitest';
import { startGame } from '../engine/engine';
import { handleInput } from '../engine/game';
import { shortDashboard } from '../engine/render';

// The small fixes from the Hermes bot test (STATUS, plan of Oct 11 #3), in the classic chronicle.
describe('classic chronicle small fixes', () => {
  it('"talk" without a name lists known people by number; "talk 1" works', () => {
    const s = startGame();
    const ask = handleInput(s, 'talk to nobody here');
    expect(ask.text ?? '').toMatch(/Talk to whom\? Li knows: 1 [^,]+, 2 /);
    const r = handleInput(s, 'talk 1');
    expect(r.text ?? '').not.toMatch(/Talk to whom/);
  });

  it('the dashboard shows the price once Li knows it, and FREE once he is', () => {
    const s = startGame();
    expect(shortDashboard(s)).not.toMatch(/price|FREE/);
    s.knowledge.push('own_price_15');
    expect(shortDashboard(s)).toMatch(/His price: fifteen ryō · \d+ of 15000 mon/);
    s.characters[s.liId].status = 'free';
    s.characters[s.liId].role = 'a free youth';
    expect(shortDashboard(s)).toMatch(/FREE · a free youth/);
  });
});
