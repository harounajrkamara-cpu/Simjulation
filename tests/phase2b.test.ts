import { describe, expect, it } from 'vitest';
import { ESCAPE_NEEDS, PAYDAY_TIP, SHARE_PER_MERIT, STITCH_TIP, officerOf, officerTemplate, skirmishTemplate } from '../engine/campaign';
import { fromSave, gonzaPatrols, li, options, startGame, stateHash, takeAction, toSave, today } from '../engine/engine';
import { handleInput } from '../engine/game';
import { GameState } from '../engine/types';

// Phase 2 completion (📝 proposal): officer raids, the yearly contract, money, escape, beats between raids.

function quiet(s: GameState) {
  const p = s.date.part;
  if (s.duel && !s.duel.over) return handleInput(s, 'counter');
  return takeAction(s, p === 'night' ? { kind: 'sleep' } : p === 'evening' ? { kind: 'rest' } : { kind: 'chores' });
}
function toDay(s: GameState, day: number, part = 'morning') { while (!(today(s) === day && s.date.part === part)) quiet(s); }
function serve(s: GameState) { toDay(s, 90); handleInput(s, '1'); }
const storyIds = (s: GameState) => s.events.filter((e) => e.type === 'story').map((e) => String((e.data as { id?: string }).id ?? ''));

describe('officers at the ford (Numbers §6: a Kogashira head frees a slave)', () => {
  it('a Gochō leads the Month 6, Day 22 raid and a Kogashira the last raid of each year', () => {
    expect(officerOf(5)).toBe('gocho');
    expect(officerOf(11)).toBe('kogashira');
    expect(officerOf(17)).toBe('gocho');
    expect([0, 1, 4, 6, 10, 12].map(officerOf).every((x) => x === undefined)).toBe(true);
  });

  it('on an officer raid Li chooses: go for the officer or hold his place in the line', () => {
    const s = startGame();
    serve(s);
    toDay(s, 171); // Year 100, Month 6, Day 22
    const o = options(s);
    expect(o[0].label).toBe('Go for the Gochō');
    expect(o[1].label).toBe('Hold your place in the line');
    handleInput(s, '2');
    expect(s.duel?.id).toBe('skirmish_5');
  });

  it('going for him starts a harder fight that can leave Li badly wounded', () => {
    const s = startGame();
    serve(s);
    toDay(s, 171);
    handleInput(s, '1');
    expect(s.duel?.id).toBe('officer_5');
    const t = officerTemplate(5);
    expect(t.maxWound).toBe(3);
    expect(t.foe.val).toBeGreaterThan(skirmishTemplate(5).foe.val);
  });

  it('a won officer fight gives 3 merit and his purse; only a Kogashira head frees', () => {
    expect(officerTemplate(5).outcomes.won.merit!.amount).toBe(3);
    expect(officerTemplate(5).outcomes.won.flag).toBeUndefined();
    expect(officerTemplate(11).outcomes.won.flag).toEqual(['kogashira_head', 1]);
    expect(officerTemplate(11).outcomes.won.money).toBeGreaterThan(0);
  });

  it('the evening after a Kogashira head, Li is freed under the merit law', () => {
    const s = startGame();
    s.flags.kogashira_head = 1;
    toDay(s, 3, 'night');
    expect(li(s).status).toBe('free');
    expect(storyIds(s)).toContain('freed_head');
    expect(s.journal.some((j) => j.text.startsWith('Legend: for the head of a Suiren Kogashira'))).toBe(true);
  });
});

describe('the yearly contract and levy', () => {
  it('the contract is renewed when the raiding season ends (Month 10, Day 1)', () => {
    const s = startGame();
    toDay(s, 270, 'afternoon');
    expect(storyIds(s)).toContain('contract_100');
  });

  it('Raizen shares the Kurogane reward only if he respects Li', () => {
    const a = startGame();
    a.flags.merit_service = 6;
    a.relations.raizen.base.respect = 60;
    toDay(a, 269, 'night');
    const before = a.money;
    quiet(a);
    expect(a.money - before).toBe(6 * SHARE_PER_MERIT);
    const b = startGame();
    b.flags.merit_service = 6;
    toDay(b, 269, 'night');
    const before2 = b.money;
    quiet(b);
    expect(b.money).toBe(before2);
    expect(b.flags.merit_shared).toBe(6);
  });

  it('a boy who stayed with the baggage is offered the levy again next summer; a serving one is not asked', () => {
    const s = startGame();
    toDay(s, 90);
    handleInput(s, '2');
    toDay(s, 450);
    expect(options(s)[0].label).toBe('Step forward: serve in the Hagiwara levy');
    handleInput(s, '1');
    expect(s.flags.levy_service).toBe(1);
    const t = startGame();
    serve(t);
    toDay(t, 450);
    expect(storyIds(t)).not.toContain('levy_call_101');
  });
});

describe('money for the buy route', () => {
  it('paydays: a soldier tips Li for an errand on days 1 and 16', () => {
    const s = startGame();
    const m = s.money;
    toDay(s, 15, 'afternoon');
    expect(s.money - m).toBe(2 * PAYDAY_TIP); // Day 1 and Day 16 mornings
  });

  it('stitching levy men after a raid earns a tip; a won skirmish keeps the raider\'s purse', () => {
    const s = startGame();
    toDay(s, 97, 'afternoon'); // Month 4, Day 8: a raid day
    const m = s.money;
    takeAction(s, { kind: 'help_sukezo' });
    expect(s.money - m).toBe(STITCH_TIP);
    expect(skirmishTemplate(0).outcomes.won.money).toBe(120);
  });
});

describe('escape (WB 10.4 route 4)', () => {
  function ready(s: GameState) {
    s.knowledge.push('tatara_refuge', 'papers_in_iron_box');
    li(s).skills.stealth = ESCAPE_NEEDS.stealth;
    li(s).skills.endurance = ESCAPE_NEEDS.endurance;
  }
  function toNight(s: GameState, patrol: boolean) {
    do { toDay(s, today(s) + 1, 'night'); } while (gonzaPatrols(s) !== patrol);
  }

  it('is not offered before Li knows about the papers and Tatara', () => {
    const s = startGame();
    toDay(s, 2, 'night');
    expect(options(s).some((o) => o.action.kind === 'escape')).toBe(false);
  });

  it('on a night without Gonza, a quiet and fit boy reaches Tatara: free and hunted', () => {
    const s = startGame();
    ready(s);
    toNight(s, false);
    const o = options(s).find((x) => x.action.kind === 'escape')!;
    expect(o.risk).toBe('hunted; if caught, punished');
    handleInput(s, o.key);
    expect(li(s).status).toBe('free');
    expect(s.knowledge).toContain('hunted');
    expect(s.knowledge).toContain('stage1_complete');
    expect(s.characters.hachi.status).toBe('slave');
  });

  it('keeps the promise to Hachi if he asked', () => {
    const s = startGame();
    ready(s);
    s.flags.hachi_asked_promise = 1;
    toNight(s, false);
    handleInput(s, options(s).find((x) => x.action.kind === 'escape')!.key);
    expect(s.characters.hachi.status).toBe('free');
  });

  it('is caught on a night Gonza walks the camp, and told why', () => {
    const s = startGame();
    ready(s);
    toNight(s, true);
    const r = handleInput(s, options(s).find((x) => x.action.kind === 'escape')!.key);
    expect(li(s).status).toBe('slave');
    expect(li(s).wound).toBe(2);
    expect(r.text).toContain('Gonza is walking the camp tonight');
  });

  it('is caught by a sentry when Li is not quiet enough', () => {
    const s = startGame();
    ready(s);
    li(s).skills.stealth = ESCAPE_NEEDS.stealth - 1;
    toNight(s, false);
    const r = handleInput(s, 'I escape to Tatara');
    expect(li(s).status).toBe('slave');
    expect(r.text).toContain('a sentry hears him');
  });
});

describe('beats between raids', () => {
  it('Daisuke joins the levy after Li steps forward', () => {
    const s = startGame();
    serve(s);
    toDay(s, 96, 'night');
    expect(storyIds(s)).toContain('daisuke_levy');
  });

  it('Hachi asks his question in winter quarters, after the contract', () => {
    const s = startGame();
    toDay(s, 280);
    expect(storyIds(s)).toContain('hachi_winter');
  });

  it('Sukezō tells a good student where a runaway is safe', () => {
    const s = startGame();
    s.knowledge.push('papers_in_iron_box');
    s.flags.lessons = 15;
    toDay(s, 12);
    expect(s.knowledge).toContain('tatara_refuge');
  });
});

describe('determinism', () => {
  it('a year in the levy, with an officer raid and the contract, replays to the same state', () => {
    const play = () => {
      const s = startGame();
      serve(s);
      toDay(s, 171);
      handleInput(s, '1'); // go for the Gochō
      toDay(s, 300);
      return s;
    };
    const a = play();
    const b = play();
    expect(stateHash(a)).toBe(stateHash(b));
    expect(stateHash(fromSave(toSave(a)))).toBe(stateHash(a));
    expect(a.events.some((e) => (e.data as { id?: string }).id === 'contract_100')).toBe(true);
  });
});
