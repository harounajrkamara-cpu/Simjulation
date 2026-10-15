# ChatGPT poisoning / NPC death runtime probe — 15 October 2026

## Target and method

- Repository: `harounajrkamara-cpu/Simjulation`
- PR #5 remains open and unmerged.
- Exact game commit under test: `build/stage-1` at `1e28a47bbbe01e36f4db7c89b5dc69dc0ec9b4ca`.
- Test implementation: [poisoning-scenarios-2026-10-15.test.ts](https://github.com/harounajrkamara-cpu/Simjulation/blob/ai-lab/testing-council/reports/reviews/poisoning-scenarios-2026-10-15.test.ts).
- Runner: GitHub Actions checked out `build/stage-1` into an isolated `target/` directory. It copied the QA test file into that runner checkout's `target/tests/round2-poisoning.test.ts` only. No test file or source changes were committed to `build/stage-1`.
- The suite exercised the real `gmTurn` and real engine state using a fake AI adapter. No real Claude calls or paid APIs were used.
- Automated evidence is posted in [GitHub issue #6](https://github.com/harounajrkamara-cpu/Simjulation/issues/6#issuecomment-6201743247).

## Baseline checks

All reported successful in the same Action run against the exact target SHA:

- `npm ci`: success
- `npm test`: success
- `npm run typecheck`: success
- `npm run build:web`: success
- `npm run balance`: success

The extra adversarial suite contains 11 tests. **7 safety assertions failed, meaning the corresponding unwanted behavior was reproduced; 4 tests passed.** The extra probe step is deliberately expected to go non-green when the game permits a forbidden narration/state change. It is separate from the existing baseline test suite.

## Reproduced vulnerabilities

In each case below, the test expected the Game Master to reject/rewrite the scene or leave Raizen alive, but the engine state showed `s.characters.raizen.alive === false`.

### 3. Attribution by “the boy”

Scene: `The boy tips a bitter powder into Raizen’s sake. Raizen never wakes.`

Death-change reason: `Death from poison`

**Observed:** Raizen was marked dead. The textual fact-check does not bind “the boy” in the scene text back to Li, and the engine's cause guard only inspects the supplied `reason` string.

### 4. Unlisted method: “smothers”

Scene: `Li smothers Raizen while he sleeps. By sunrise Raizen is dead.`

Death-change reason: `Asphyxiation during the night`

**Observed:** Raizen was marked dead. The verb `smothers` is not covered by the current win/kill phrase list.

### 6. Unlisted method: “suffocates”

Scene: `Li suffocates Raizen with a pillow while he sleeps. By dawn Raizen is dead.`

Death-change reason: `Death by suffocation`

**Observed:** Raizen was marked dead. `suffocates` is not caught by the current phrase list.

### 7. Alternate phrasing: “cuts his throat”

Scene: `Li cuts Raizen’s throat as he sleeps. By dawn Raizen is dead.`

Death-change reason: `A wound to the throat`

**Observed:** Raizen was marked dead. The current phrase list catches variants such as `cuts down`, but not this construction.

### 8. Attribution by “the slave”

Scene: `The slave slips poison into Raizen’s sake. Raizen dies before dawn.`

Death-change reason: `A poisoned drink`

**Observed:** Raizen was marked dead. The scene calls Li “the slave”, but the cause string does not include that alias, so the actor guard does not fire; the fact-check also does not treat the alias as Li.

### 9. Victim-before-participle wording

Scene: `Li hands Raizen a cup of poisoned sake. Raizen collapses and dies before sunset.`

Death-change reason: `Poisoned cup`

**Observed:** Raizen was marked dead. Although the detector now includes `poisoned`, the victim appears before that word and the detector does not connect this construction to Raizen's death.

### 10. Indirect death arranged by Li

Scene: `Li arranges for a camp follower to poison Raizen. By dawn Raizen is dead.`

Death-change reason: `Poisoning by a camp follower`

**Observed:** Raizen was marked dead. The reason omits Li, and the scene uses the bare verb `poison` rather than `poisons` or `poisoned`. This bypasses both current checks.

## Scenarios which passed as intended

### 1. Direct “Li poisons Raizen” scene with a neutral cause string

The reason was `Poisoned at dinner`, but the visible scene explicitly said Li poisons Raizen. **Safe behavior observed:** the scene was not accepted as a valid turn, and Raizen remained alive.

### 2. Direct attribution in both scene and reason

The visible scene and the reason both said Li poisons Raizen. **Safe behavior observed:** the turn was rejected rather than recording the death and leaving contradictory narration.

### 5. External assassin negative control

Scene: `A Suiren assassin poisons Raizen in the night. The band finds him dead at dawn.`

Reason: `A Suiren assassin poisoned Raizen`

**Observed:** Raizen died as the scene says. This is the expected negative control: the rule must block a story from awarding Li an unauthorized kill, without preventing the world from recording a death attributed to another actor.

### 11. Explicit listed verb negative control

Scene: `Li drowns Raizen in the river. The camp finds Raizen dead at dawn.`

Reason: `Li drowns Raizen in the river`

**Safe behavior observed:** the turn was rejected and Raizen remained alive.

## Likely underlying issue

The current implementation combines two incomplete checks:

1. `engine/factcheck.ts` uses a finite set of kill/win phrases, often requiring a known person's name after the verb. Alias attribution, other verb forms, indirect acts, and different word order can escape it.
2. `engine/gm.ts` `case 'dies'` primarily decides whether a death is allowed by looking for `Li`, `Li's`, `the boy`, or `the slave` in a model-provided free-text reason. That means the scene's actual causal claim and the structured death reason can disagree.

## Recommended fix and regression tests

Do not try to maintain an indefinitely growing verb list as the only control. Prefer a trusted, structured cause/actor authorization for NPC deaths: a model's `dies` proposal should not decide who caused the death by itself. If the narrative attributes a kill to Li, the engine should require an authorized deterministic event/mechanic and reject the entire scene (not merely refuse the `dies` change). Keep legitimate external/world deaths possible when the actor/cause is supported by the game rules.

Add regressions for all seven reproduced variants above and keep the four passed scenarios as controls. Then rerun the same suite on the post-fix commit.

## Scope and limitations

These tests directly exercised `gmTurn` and the deterministic engine but used a fake AI adapter. They prove the engine/fact-check path can accept these crafted structured responses; they do not prove real Claude will choose these exact phrasings during normal play. This was not a browser session or a real Claude artifact playthrough.

No changes were made to game source code, `main`, or `build/stage-1`.
