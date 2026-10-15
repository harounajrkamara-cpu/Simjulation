# Independent current-head regression review — round 2

Date: 15 October 2026

## Target and method

- Repository: `harounajrkamara-cpu/Simjulation`
- PR: [#5](https://github.com/harounajrkamara-cpu/Simjulation/pull/5), still open and not merged.
- Exact source inspected: `build/stage-1`, commit `e3d24468a4530fdd4e34962d514e05c5b6ef63bd`.
- Files inspected remotely: `engine/gm.ts`, `engine/factcheck.ts`, `tests/gm.test.ts`, `tests/factcheck.test.ts`, `engine/fuses.ts`, `engine/seeds.ts`, `web/main.ts`, and the lab workflow.
- This round was a **source-level review**, not a fresh runtime reproduction. A local `git clone` could not reach GitHub from this environment (`Could not resolve host: github.com`), and no installed dependency tree for this commit was available. GitHub's commit-status response for the target SHA contained no reported statuses.
- Earlier GitHub issue #6 comment from Claude reports `npm test` (313 passed), `npm run typecheck`, `npm run build:web`, and `npm run balance` passing on `d447d9b6a9d788c4279d98d6d86a8d72da15fbeb`. Those are **reported results from that comment, not commands independently run in this round**. The inspected head `e3d2446` has a latest commit whose visible diff is a documentation path correction in `docs/STATUS.md`; nevertheless the run history/checks for the latest SHA were not independently confirmed here.
- The lab workflow was updated in commit `5242fec0a005904fe702d12bd7e45d325489dc3f` to check out `build/stage-1` and run `npm ci`, `npm test`, `npm run typecheck`, `npm run build:web`, and `npm run balance`. The connected tools available in this review did not expose a readable push-run result, so workflow success is **not claimed**.

## What now appears fixed in source

The four prior Copilot findings have corresponding source changes and regression tests in the inspected target:

1. **Non-lethal officer fight rewards:** `gmDuelStart` gates officer merit, ordinary enemy merit, and head credit on `f.deadly`. `tests/gm.test.ts` now includes a practice-win regression expecting no head, no service merit, and no freedom by head.
2. **Raid officer at a remote location:** `fightFacts` checks Li's recorded place or the current scene place for the ford/Kurose before counting a raid. The regression test checks a fight at the rice fields.
3. **Fake officer labels:** the raid-day path substitutes the registered officer's actual identity and strength only when the location/date/raid conditions match; other officer labels are not trusted.
4. **Several unearned-win wordings:** the fact-check source and the regression tests cover “won the spar”, “punches Gonza to the ground”, and “leaves Gonza unable to rise”, with nearby non-fight sentences included to reduce false alarms.

These findings were addressed in source and tests. This report does **not** claim I reran the tests in the current environment.

## Candidate residual risk — poisoning can still bypass the death/fight guard

- **Severity:** medium to high for story-state integrity.
- **Confidence:** strongly supported by current source inspection; **not runtime-reproduced on this exact head**.
- **Files/functions:** `engine/gm.ts`, `checkChanges` branch `case 'dies'`; `engine/factcheck.ts`, the `WIN` phrase detector in `checkGmScene`.

### Candidate reproduction

Have the Game Master return a scene like:

```json
{
  "scene": "Li poisons Raizen at dinner. Raizen drinks, collapses, and dies before the candles burn out.",
  "changes": [
    { "kind": "dies", "npc": "raizen", "reason": "Poisoned at dinner" }
  ]
}
```

Expected: a completed kill of a known person attributed to Li must not be narrated or recorded unless the engine authorizes it through the appropriate deterministic mechanic. If `dies` is rejected, the scene should also be rejected or rewritten so narration and state cannot contradict each other.

### Why the source suggests a gap

- The `dies` branch currently rejects a reason that literally names `Li`, `Li's`, `the boy`, or `the slave`. A reason such as `Poisoned at dinner` does not match that guard, and the code path otherwise records the NPC as dead.
- The current `WIN` detector includes several killing and victory verbs, but does not include `poisons`, `poisoned`, or `poisoning`. Therefore the scene phrasing above appears able to bypass the text-side fight check as well.
- The existing regression checks that the exact reason `Li poisons Raizen at dinner` does not kill Raizen. It does not test a cause-neutral `dies` reason combined with poisoning in the scene text, nor does it verify that a rejected `dies` change causes the contradictory scene itself to be rejected.

### Recommended regression tests

1. A fake-adapter `gmTurn` answer with the scene text above and `reason: "Poisoned at dinner"` must not make Raizen dead without a permitted engine event.
2. The exact textual claim `Li poisons Raizen at dinner` must be rejected/re-written even when the corresponding `dies` change is absent or refused.
3. Add variants such as `strangles`, `drowns`, or `smothers` only if they are within the rule that Li cannot resolve an NPC kill through narrative text. Keep separately authorized world deaths possible.
4. Assert both sides of the invariant: the stored NPC state and the scene shown to the player must agree.

A more robust fix is to authorize NPC death by trusted cause/mechanic, not by trying to infer the actor solely from a free-text `reason`. This is a proposed fix, not a code change made by this reviewer.

## Pacing / time / free-world source review

- `sceneTime` and `gmTimeDrafts` clamp/skips forward and keep the time-correction route gated to “Something's wrong”; time corrections are refused during a live duel/battle.
- `leverDrafts` checks that the fuse exists, the outcome is valid, the fuse has not fired, and Li is in the recorded place where it plays out.
- `seedDrafts` checks valid seed/state, eligibility by life stage/location, and that a seed is planted before it can be grown or killed.
- The pacing code caps consecutive automatic routine scenes at four; typing cancels a pending timer, and the player-action path calls `stopAuto()`. Source inspection did not establish a new pacing defect.

These are source observations only. The actual browser, scheduled timer behavior, and live Claude artifact were not exercised in this round.

## Test status and handoff

- Current-head runtime execution by this reviewer: **NOT RUN**.
- Target-commit CI checks read back by this reviewer: **none returned**.
- Reported test results on parent commit `d447d9b`: 313 tests passed; typecheck and web build passed; balance reported C-vs-B skilled 14.7%. See the existing issue #6 comment for its author and exact wording.
- UI/Chromium and real Claude artifact: **NOT RUN** in this round.
- No game-source changes were made. `main` and `build/stage-1` were not modified by this reviewer. PR #5 remains unmerged.

Next priority: add the three poisoning/actor-attribution regression cases, run the official suite against the exact active branch head, and then perform a real Claude artifact playtest for opening/pacing.
