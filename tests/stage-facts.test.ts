import { describe, it, expect } from 'vitest';
import { createWorld, createWorldTataraStart } from '../engine/data';
import { lifeStage, STAGE_FACTS } from '../engine/stages';
import { gmMemoryText } from '../engine/gm';

describe('Stage facts per life stage', () => {
  it('slave stage has freedom routes in facts', () => {
    const s = createWorld();
    expect(STAGE_FACTS[lifeStage(s)]).toContain(
      'Li is still a slave; the freedom routes are: 30 merit in Kurogane service (a Kogashira head frees him too), buying for 15 ryō, Raizen\'s word, or escape to Tatara (hunted, winter quarters only).'
    );
  });

  it('soldier stage mentions Kurogane merit law and promotions', () => {
    const s = createWorld();
    s.characters[s.liId].status = 'free';
    const stage = lifeStage(s);
    expect(stage).toBe('soldier');
    expect(STAGE_FACTS[stage]).toContain(
      'Li is free and in the ranks: Kurogane merit law counts his deeds. He has a unit (Ashigaru = himself, up), follows orders, can be promoted by witnessed merit.'
    );
  });

  it('officer stage mentions land grants and war councils', () => {
    const s = createWorld();
    s.characters[s.liId].status = 'free';
    s.flags.rank_level = 3;
    const stage = lifeStage(s);
    expect(stage).toBe('officer');
    expect(STAGE_FACTS[stage].some((f) => f.includes('first land grant'))).toBe(true);
  });

  it('general stage mentions court factions and endgame path', () => {
    const s = createWorld();
    s.characters[s.liId].status = 'free';
    s.flags.rank_level = 6;
    const stage = lifeStage(s);
    expect(stage).toBe('general');
    expect(STAGE_FACTS[stage].some((f) => f.includes('Six Pillars'))).toBe(true);
    expect(STAGE_FACTS[stage].some((f) => f.includes('Endgame'))).toBe(true);
  });

  it('gmMemoryText includes WORLD FACTS for THIS STAGE section', () => {
    const s = createWorld();
    const text = gmMemoryText(s);
    expect(text).toContain('WORLD FACTS FOR THIS STAGE');
    expect(text).toContain('freedom routes');
  });

  it('Tatara start (hunted) is soldier stage with facts', () => {
    const s = createWorldTataraStart();
    const stage = lifeStage(s);
    expect(stage).toBe('soldier');
    expect(STAGE_FACTS[stage]).toContain(
      'Campaign raids continue each year (months 4–9, days 8 and 22). Li may go for an officer head, hold his place in the line, or be assigned other duties (scouting, messenger, gate duty).'
    );
  });

  it('all four stages have at least 3 world facts', () => {
    for (const stage of ['slave', 'soldier', 'officer', 'general'] as const) {
      expect(STAGE_FACTS[stage].length).toBeGreaterThanOrEqual(3);
    }
  });
});
