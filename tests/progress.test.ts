import { describe, expect, it } from 'vitest';
import { progressChips } from '../engine/render';

// Progress toward the next whole point (owner vision Oct 10): growth shows every turn, without fake numbers.

describe('progress chips', () => {
  it('show quiet progress inside the same whole point, biggest first', () => {
    expect(progressChips({ VAL: 14.2, 'style:two_swords': 6.1 }, { VAL: 14.62, 'style:two_swords': 6.2 })).toEqual(['↗ VAL 62% to 15', '↗ two swords 20% to 7']);
  });
  it('leave whole-point changes to the changes line, and ignore tiny or no change', () => {
    expect(progressChips({ VAL: 14.9 }, { VAL: 15.1 })).toEqual([]);
    expect(progressChips({ VAL: 14.2 }, { VAL: 14.201 })).toEqual([]);
    expect(progressChips({ VAL: 14.2 }, { VAL: 14.1 })).toEqual([]);
  });
  it('show at most three', () => {
    const before = { a: 1.1, b: 1.1, c: 1.1, d: 1.1 };
    expect(progressChips(before, { a: 1.2, b: 1.3, c: 1.4, d: 1.5 })).toHaveLength(3);
  });
});
