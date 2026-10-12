import { describe, expect, it } from 'vitest';
import {
  HEAD_MERIT, PROMOTION_THRESHOLD, capacity, capacityLabel, checkPromotion, freedomByMerit, landDutyMen, meritOf, powerScores,
  promotionScore, rankLabel, rankFromTitle,
} from '../engine/career';
import { commitDrafts, fromSave, li, stateHash, toSave } from '../engine/engine';
import { checkGmScene } from '../engine/factcheck';
import { gmApply, gmMemoryText, parseGmTurn, startGmGame } from '../engine/gm';
import { careerOf } from '../engine/gm-career';
import { GameState } from '../engine/types';

// Ranks, merit and promotion (World Bible ch. 4, Numbers §1, §3, §6, §7) and their use in Game Master mode.

describe('career rules match the Numbers Sheet', () => {
  it('rank labels and titles', () => {
    expect(rankLabel('hyakuningashira')).toBe('Hyakunin-gashira (100)');
    expect(rankLabel('senninsho', 2400)).toBe('Sennin-shō (2,400)');
    expect(rankFromTitle('gocho')).toBe('gocho');
    expect(rankFromTitle('Great General')).toBe('daishogun');
  });
  it('merit per deed (§6)', () => {
    expect(HEAD_MERIT.kogashira).toBe(3);
    expect(HEAD_MERIT.taisho).toBe(250);
    expect(meritOf({ kind: 'standard' }).amount).toBe(20);
    expect(meritOf({ kind: 'command', deed: 'objective', unit: 'hyakuningashira' }).amount).toBe(20); // 5 × class 4
    expect(meritOf({ kind: 'political', deed: 'negotiation', amount: 99 }).amount).toBe(30); // clamped
    expect(meritOf({ kind: 'standard', confirmed: false }).amount).toBe(0);
  });
  it('a pure fighter cannot become a general on heads alone (§6 example)', () => {
    expect(PROMOTION_THRESHOLD.senninsho).toBe(900);
    expect(promotionScore({ combat: 6000, command: 0, political: 0 }, 'senninsho')).toBe(900);
  });
  it('the barrier, the vacancy, the sponsor and the owner are all shown with reasons', () => {
    const base = { merit: { combat: 100, command: 0, political: 0 }, birth: 'commoner' as const, armyMen: 150_000, vacancy: true };
    expect(checkPromotion({ ...base, rank: 'ashigaru', kingdom: 'kurogane' }).ok).toBe(true);
    expect(checkPromotion({ ...base, rank: 'ashigaru', kingdom: 'kurogane', bond: 'slave' }).blocks.map((b) => b.reason)).toContain('your owner refuses to release you');
    expect(checkPromotion({ ...base, rank: 'ashigaru', kingdom: 'kurogane', vacancy: false }).blocks.map((b) => b.code)).toContain('vacancy');
    // Suiren ×2: 15 × 2 = 30 needed; score 100 × 0.6 = 60 passes, but 40 combat (24) does not.
    expect(checkPromotion({ ...base, merit: { combat: 40, command: 0, political: 0 }, rank: 'ashigaru', kingdom: 'suiren' }).blocks.map((b) => b.reason)).toContain('the elders reject a low-born');
    const high = { ...base, merit: { combat: 0, command: 5000, political: 0 }, rank: 'hyakuningashira' as const, kingdom: 'kurogane' as const };
    expect(checkPromotion(high).blocks.map((b) => b.reason)).toContain('a sponsor is required');
    expect(checkPromotion({ ...high, sponsorOpinion: 45 }).ok).toBe(true);
  });
  it('freedom by merit, command capacity, land duty, power ranks', () => {
    expect(freedomByMerit({ kuroganeService: true, witnessedHeads: ['kogashira'], combatPlusCommand: 0 })).toMatchObject({ free: true, route: 'head', ownerPaidRyo: 10 });
    expect(freedomByMerit({ kuroganeService: false, witnessedHeads: ['taisho'], combatPlusCommand: 99 }).free).toBe(false);
    expect(Math.round(capacity(50))).toBe(1000);
    expect(capacityLabel(50)).toBe('battalion');
    expect(landDutyMen(300)).toEqual([6, 7]);
    expect(powerScores({ LEA: 6, VAL: 14, INT: 17, POL: 5 }, { two_swords: 6 }).overall).toBe(11.5); // Numbers §1 check: F
  });
});

// ---------- Game Master mode ----------

const turn = (changes: unknown[]) => parseGmTurn({ scene: 'Li stands in the line.', summary: 'A deed.', changes })!;

const checkFactsLi = (s: GameState, text: string) => checkGmScene(s, text).map((p) => p.kind);

/** A free Li in Kurogane service (as after the merit law). */
function freeLi(): GameState {
  const s = startGmGame();
  commitDrafts(s, [
    { type: 'status', fact: 'free', visible: true, data: { char: s.liId, status: 'free', role: 'a free youth' } },
    { type: 'flag', fact: 'service', visible: true, data: { key: 'levy_service', value: 1 } },
  ]);
  return s;
}

describe('the career in Game Master mode', () => {
  it('a witnessed deed adds merit by the table (and counts toward the merit law in service)', () => {
    const s = freeLi();
    const r = gmApply(s, turn([{ kind: 'deed', deed: 'standard', reason: 'took the Suiren standard at the ford, the whole line saw it' }]));
    expect(r.notes).toEqual([]);
    expect(careerOf(s).merit.combat).toBe(20);
    expect(s.flags.merit_service).toBe(20);
  });

  it('refuses deeds without a reason, too many deeds, kills, and command deeds without a unit', () => {
    const s = freeLi();
    const r = gmApply(s, turn([
      { kind: 'deed', deed: 'scouting' },
      { kind: 'deed', deed: 'kill', reason: 'x' },
      { kind: 'deed', deed: 'objective', reason: 'held the ford' },
      { kind: 'deed', deed: 'scouting', reason: 'found the ford' },
      { kind: 'deed', deed: 'scouting', reason: 'again' },
      { kind: 'deed', deed: 'scouting', reason: 'and again' },
    ]));
    expect(careerOf(s).merit.combat).toBe(6); // two scouting reports; the third hits the 2-per-scene cap
    expect(r.notes.join(' ')).toMatch(/needs witnesses and a reason/);
    expect(r.notes.join(' ')).toMatch(/fights the code runs/);
    expect(r.notes.join(' ')).toMatch(/leads no unit/);
    expect(r.notes.join(' ')).toMatch(/at most 2 deeds/);
  });

  it('a slave outside service earns no merit; a promotion is blocked by his owner', () => {
    const s = startGmGame();
    const r = gmApply(s, turn([{ kind: 'deed', deed: 'scouting', reason: 'saw raiders' }, { kind: 'promotion', reason: 'a Gochō fell' }]));
    expect(careerOf(s).merit.combat).toBe(0);
    expect(r.notes.join(' ')).toMatch(/only in official service/);
    expect(r.notes.join(' ')).toMatch(/your owner refuses to release you/);
  });

  it('promotion: blocked with reasons, then granted when merit and a free post are there; it replays', () => {
    const s = freeLi();
    let r = gmApply(s, turn([{ kind: 'promotion', reason: 'a Gochō fell at the ford' }]));
    expect(r.notes.join(' ')).toMatch(/not promoted to Gochō: not enough merit yet/);
    gmApply(s, turn([{ kind: 'deed', deed: 'standard', reason: 'took a standard; the line saw it' }, { kind: 'deed', deed: 'saved_officer', reason: 'pulled the Gochō out of the river' }]));
    r = gmApply(s, turn([{ kind: 'promotion' }]));
    expect(r.notes.join(' ')).toMatch(/no free position was named/);
    r = gmApply(s, turn([{ kind: 'promotion', reason: 'a Gochō fell at the ford' }]));
    expect(r.notes).toEqual([]);
    expect(careerOf(s).rank).toBe('gocho');
    expect(li(s).role).toBe('Gochō (5) in Kurogane service');
    expect(gmMemoryText(s)).toMatch(/rank Gochō \(5\)/);
    expect(gmMemoryText(s)).toMatch(/Next: Kogashira \(10\)/);
    expect(stateHash(fromSave(toSave(s)))).toBe(stateHash(s));
  });

  it('serving another kingdom changes the barrier', () => {
    const s = freeLi();
    gmApply(s, turn([{ kind: 'serve', kingdom: 'suiren' }]));
    expect(careerOf(s).kingdom).toBe('suiren');
    expect(gmMemoryText(s)).toMatch(/serves Suiren/);
  });

  it('the fact-check knows Li\'s new rank', () => {
    const s = freeLi();
    gmApply(s, turn([{ kind: 'deed', deed: 'standard', reason: 'took a standard; the line saw it' }, { kind: 'deed', deed: 'saved_officer', reason: 'pulled the Gochō out of the river' }]));
    gmApply(s, turn([{ kind: 'promotion', reason: 'a Gochō fell' }]));
    expect(checkFactsLi(s, 'Gochō Li barks an order.')).toEqual([]);
    expect(checkFactsLi(s, 'Kogashira Li barks an order.')).toEqual(['rank']);
  });
});
