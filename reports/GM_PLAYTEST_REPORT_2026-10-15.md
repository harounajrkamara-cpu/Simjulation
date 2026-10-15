# Simjulation — GM playtest and PR #5 review

**Date:** 15 October 2026  
**Review target:** [PR #5](https://github.com/harounajrkamara-cpu/Simjulation/pull/5)  
**Exact current source inspected:** `build/stage-1` at `fb6aae37b2e5de8ea4f5b13af2c85dbf4e0a5792`  
**Testing branch for this report:** `ai-lab/testing-council`  
**Recommendation:** Do not merge PR #5 until the blocking findings below are tested and resolved.

## Read this first: scope and evidence

This report deliberately separates three kinds of evidence:

1. **Local engine playtest:** 12 scripted GM-style sessions were run in an isolated local snapshot from the uploaded `Simjulation-main.zip`, based on `main` commit `8a717861431155d0b2017d05bd09224de294ca30` (12 October), **not** the current 15 October PR #5 head.
2. **Current source inspection:** the exact current `build/stage-1` source was read from GitHub at commit `fb6aae37b2e5de8ea4f5b13af2c85dbf4e0a5792`.
3. **Current-head execution:** the official npm test suite, typecheck, build, UI Playwright checks and real Claude artifact were **not** executed against that exact current commit in this environment. GitHub returned zero check-runs for the current head when inspected.

Do not describe the 12 sessions as a complete v25 run. The local archive lacked cached npm dependencies and this environment could not install them. The local findings help demonstrate engine behaviour, while current-branch issues below are additionally supported by source inspection and need regression tests on the exact current head.

## 1. Local GM-style playtest

I authored GM-style scene payloads and let the deterministic engine handle state changes, caps, duels, outcomes and replay.

| Measure | Result |
|---|---:|
| Scripted sessions | 12 |
| Recorded scenes | 72 |
| Recorded engine events | 410 |
| Engine-decided duels | 12 |
| Harness assertions failed | 0 |
| Save/replay mismatches | 0 |
| Same engine result from two different narration styles | Yes |

The sessions covered quiet, dramatic and plain narration; patient, aggressive, auto and smart player move policies; opponents from F through A; and lethal/non-lethal fights. These are short smoke plays of six GM scenes each, not long playthroughs or a statistically valid combat-balance sample. All 12 selected duel attempts in these early-game states were losses; **do not infer overall balance from that sample**.

The engine capped or refused the tested attempts to award 999,999 mon, add +60 relationship in one scene, exceed the wound limit, kill Li directly, grant unsupported freedom, and exceed the seasonal training cap.

See [the compact machine-readable run summary](GM_PLAYTEST_RESULTS_2026-10-15.json).

## 2. Balance measurement

The deterministic grid and unchanged duel engine produced these results:

| Scenario | Measured win rate |
|---|---:|
| C vs B, hint-reading `skilled` policy | **14.7%** |
| C vs B, simple policy responding to previous move | **3.1%** |
| C vs B, repeated attack | 1.9% |
| C vs C, simple policy | 48.1% |
| D vs B, simple policy | 0.0% |

This reproduces the reported 14.7% for the specific policy/grid in `scripts/balance.ts`. It does **not** prove every human player will win at those rates. The current PR changes the balance measurement policy, not the combat formulas.

## 3. Findings that need fixes or targeted verification

### P1 — Non-lethal officer fight may award an officer head and merit

**Current source inspected:** `engine/gm.ts`, `fightFacts` around line 681 and `gmDuelStart` around line 711; `freedomCheck` around line 628.

In the current source, officer merit is conditioned on officer identity, enemy credit and service; the `kogashira_head` flag is conditioned on officer rank, enemy credit and service. Neither condition checks `f.deadly`. The head-based freedom route subsequently trusts the `kogashira_head` flag.

**Local reproduction:** the underlying reward mechanism was reproduced on the available older local snapshot: a non-lethal duel labelled as a Kogashira was won and awarded `kogashira_head = 1` and 3 service merit. That snapshot predates the new raid identity fix.

**Current-head status:** source-level issue still appears present, but the exact v25 head has not been run locally.  
**Regression to add on exact PR #5 head:** on a valid raid day, with Li in service and at the ford, start a Kogashira fight with `deadly: false` and `witnessedEnemy: true`. Win it. Assert no officer head, no officer-kill merit, and no head-based freedom. Also cover a regular non-officer practice fight.

### P1 — Indirect NPC death can bypass the `dies` guard

**Current source inspected:** `engine/gm.ts`, `checkChanges`, case `dies`, around line 572.

The guard blocks Li-caused deaths only when `reason` contains one of a limited set of verbs such as `kill`, `stab`, `cut` or `fight`. It does not include poisoning. A change such as

```json
{"kind":"dies","npc":"raizen","reason":"Li poisons Raizen at dinner"}
```

contains Li but does not match the listed action verbs, so the code path can mark the NPC dead directly instead of requiring an engine-decided fight or a separately authorised mechanic.

**Local reproduction:** the behaviour was reproduced on the available older local snapshot; it recorded Raizen as dead. The relevant limited guard is still present in the current PR source.  
**Current-head status:** source-level issue supported; not executed against the exact PR #5 head.

**Expected fix:** do not rely on a growing list of kill verbs. Player-caused deaths should be denied by default unless a specific deterministic mechanic has authorised them. Add regression cases for poison, drowning, burning, suffocation, a fall and indirect wording, and assert that the NPC stays alive when no authorised mechanic resolves the death.

### P1/P2 — Raid officer selection appears not to validate Li's location

**Current source inspected:** `engine/gm.ts`, `fightFacts` around line 681; `engine/campaign.ts`, `raidOfficerOn`.

The function gets the scheduled raid officer from the current day and raid index. The officer-substitution condition shown in the current source does not require Li or the fight to be at the ford. The `place` field appears to be used for fight presentation/location rather than eligibility.

**Current-head status:** source-level hypothesis; not reproduced at runtime against exact PR #5 head.  
**Regression to add:** on a scheduled raid day, place Li at a different known location and submit an officer claim with a remote `place`. Assert the ford's officer is not substituted and no raid reward is earned away from the ford unless the world rules explicitly allow it.

### P2 — Fact-checker may miss unsupported wins described with alternate words

**Current source inspected:** `engine/factcheck.ts`, `checkGmScene` around line 95.

The win detector uses a fixed verb list including `beats`, `defeats`, `disarms`, `overpowers` and `takes the head of`. It does not clearly cover common formulations such as `won` or `punches`. That may permit a scene to state that Li won a fight which the engine never decided.

**Current-head status:** source-level gap; not yet shown as a complete bypass through the full `ai/gm.ts` pipeline.  
**Regression to add:** with no duel-end event since the last scene, try `Li won the spar against Gonza.`, `Li punches Gonza to the ground.`, `Li leaves Gonza unable to rise.`, and `Li takes Gonza's weapon after overpowering him.`. Verify they are rejected when the story asserts an unearned outcome. Do not reject legitimate aftermath narration that follows a real engine-decided duel.

## 4. Improvements observed in PR #5

The following changes are visible in the current source and should be preserved:

- Raid-day officer claims can substitute the actual officer recorded for the raid, using his recorded name and strength, rather than trusting a model-invented officer label.
- Flags `raid_officer_<n>` and `raid_fight_<n>` appear intended to prevent multiple qualifying officer/enemy-credit fights on the same raid. `tests/gm.test.ts` includes a farmhand-on-raid-day case and a second-fight case.
- `ai/gm.ts` rechecks the rewritten scene and throws a controlled `bad_answer` error when the rewrite still fails the fact-check.
- The balance script now measures a hint-reading policy that targets the user's 10–20% C-vs-B upset goal without changing combat formulas.

These improvements do not resolve the blocking questions above.

## 5. CI, browser and merge status

- [PR #5](https://github.com/harounajrkamara-cpu/Simjulation/pull/5) was open and not merged at the time inspected.
- Current head: `fb6aae37b2e5de8ea4f5b13af2c85dbf4e0a5792`.
- GitHub's check-runs endpoint returned **zero checks** for this head at the time of inspection.
- The earlier green Actions run is for `ai-lab/testing-council` on 13 October. It is not evidence that this 15 October PR head passed CI.
- The README says the Claude artifact uses the `sample` capability and the repo status says the real Claude artifact has not been tested with these changes. A real Claude playtest is still required.
- The lab branch is intentionally a separate, older snapshot and does not automatically sync from `build/stage-1`. This report records findings about the exact current head but does not make the lab code current.

**Merge recommendation:** do not merge PR #5 until the non-lethal reward and indirect-death rules are fixed and regression-tested, the remote-location officer scenario is tested, and current-head CI is green. Then playtest the real artifact for the new opening, routine auto-pacing, UI choice behaviour and model-failure handling.

## 6. Same test packet for Claude, Hermes, Copilot and other reviewers

All reviewers should receive the same base commit, setup and scenario list. Each must report `REPRODUCED`, `NOT REPRODUCED` or `NOT EXECUTED`, with exact evidence.

1. **Determinism:** same state, same structured GM turn and same player duel moves twice; vary narration wording only. Compare state, rewards and event logs.
2. **Basic GM simulation:** new opening, routine work, relationship change, training, practice duel, aftermath, save/load replay.
3. **Caps and forbidden state:** attempt 999,999 mon, +60 relationship, wound 4, direct death of Li and unsupported `freedom: head`.
4. **Non-lethal officer exploit:** scheduled raid day, service, at ford, `officer: Kogashira`, `deadly: false`, `witnessedEnemy: true`; win and assert no head, no officer-kill merit and no head-route freedom.
5. **Wrong location:** same raid day, but Li and the fight are at a remote place. Assert no ford-officer substitution/reward without an explicit canon rule.
6. **Indirect death:** use the poison change shown above; assert the NPC remains alive unless an authorised mechanic resolves the death.
7. **Narrative victory bypass:** test `won`, `punches`, `leaves unable to rise` and similar claims without a duel-end event.
8. **Time and pacing:** test `sleeps: true`, backwards part-of-day, oversized time skip, active-fight clock freezing, routine auto-continue cap, player takeover and model failure. Confirm no unseen extra scenes or calls.
9. **Exact-current-head verification:** run `npm test`, `npm run typecheck`, `npm run build:web`, `npm run balance` and `npm run ui:check` on commit `fb6aae37b2e5de8ea4f5b13af2c85dbf4e0a5792` after fixes; attach actual command output/CI. Distinguish fake-AI tests from a live playtest with the real Claude artifact.

Do not merge, publish, deploy or change `main` as part of this review. Fixes belong on a dedicated review/fix branch or child branch until the owner approves them.
