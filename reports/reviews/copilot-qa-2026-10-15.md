# Independent Copilot QA review — PR #5

**Date:** 15 October 2026
**Reviewer/tool:** GitHub Copilot CLI, Auto-selected model (specific model not exposed)
**Repository:** `harounajrkamara-cpu/Simjulation`
**PR:** [#5 — Fair fights, explicit time, playtest fixes, world facts, pacing test, new opening and films](https://github.com/harounajrkamara-cpu/Simjulation/pull/5)
**Exact tested head:** `build/stage-1` at `6dfcc42cea6ca29df8a204f3465365f7bdd4253e`
**PR base:** `main` at `8a717861431155d0b2017d05bd09224de294ca30`
**Source location:** local detached worktree created from the verified PR head; the report is on `ai-lab/testing-council`.

## Summary

Four current-head engine/fact-checker issues were **REPRODUCED** with deterministic engine calls: a non-lethal recorded officer win awards the head and merit and can free Li; a free-text poisoning reason kills Raizen through `dies`; a raid officer and raid reward can be recorded while Li is in the rice fields; and three alternate unearned-win sentences pass the full `gmTurn` pipeline when supplied by a fake adapter. These are code-path reproductions, not evidence that real Claude generated those scenes.

The full automated suite, typecheck, web build and balance script passed. The UI check could not launch because the Playwright Chromium executable is absent. GitHub reports no checks for the current PR head. No live Claude artifact, browser playthrough or paid API was used.

| Finding | Severity | Result | Evidence | Confidence |
|---|---|---|---|---:|
| Non-lethal Kogashira win grants head, merit and head-route freedom | HIGH / P1 | **REPRODUCED** | Exact-head duel ended WON with `deadly: false`; `kogashira_head=1`, `merit_service=3`; `freedom: head` changed Li to free | 10/10 |
| `dies` change kills Raizen with reason “Li poisons Raizen at dinner” | HIGH / P1 | **REPRODUCED** | Exact-head `gmApply` set `raizen.alive=false`; no notes or secret notes | 10/10 |
| Raid officer substitution/reward works away from the ford | HIGH / P1–P2 | **REPRODUCED** | On raid day 261 with Li at “the rice fields,” the engine substituted the recorded Kogashira; winning the lethal fight awarded head and 3 merit | 10/10 |
| Alternate narration bypasses the no-unearned-win fact check | MEDIUM / P2 | **REPRODUCED** | Exact-head `checkGmScene` returned no problems and fake-adapter `gmTurn` accepted each phrase without a duel-end event | 9/10 |
| Tested time advancement and skip rules | — | **NOT REPRODUCED** | Current-head tests cover sleep, backwards parts, day caps, fight freeze, skip bounds, model errors and takeover-independent engine stops; all passed | 8/10 |
| Browser presentation and real-Claude behavior | — | **NOT RUN** | Chromium missing; no live artifact or Claude account capability invoked | — |

## Reproductions

All runtime cases below used `node --import tsx --input-type=module -` in the detached checkout at the exact SHA above. The harness called the repository’s `startGmGame`, `gmApply`, `handleInput`, `foeMove`, `clashWinner`, `checkGmScene` and `gmTurn` functions directly; it created no fixture or source files. For the two win cases, the test fixture set Li’s `VAL` to 100 so the engine would decide a successful duel deterministically. The recorded result is still the duel engine’s result, not a narration claim.

### 1. Non-lethal officer reward and freedom — REPRODUCED

**Initial state:** `startGmGame()`, Li joins service, time advances to day index 261 (the scheduled Kogashira raid). Li’s `VAL` is set to 100 for a deterministic win.
**Fight payload:**

```json
{
  "fight": {
    "foe": "A random farmhand",
    "rank": "F",
    "look": "a peasant with a staff",
    "officer": "Kogashira",
    "deadly": false,
    "witnessedEnemy": true,
    "place": "at the ford"
  }
}
```

The current code correctly replaces the invented farmhand with the recorded Suiren Kogashira. The harness selected a move that beats the engine’s deterministic predicted foe move; the duel ended in one round with `Li WON`. Despite `deadly: false`, the state had `kogashira_head = 1` and `merit_service = 3`. Applying `{ "kind": "freedom", "route": "head" }` then recorded `Li is free` and changed Li’s status to `free`.

**Expected:** a practice/non-lethal fight cannot represent an officer kill, award officer-kill merit or satisfy the head-based freedom route.
**Actual:** all three rewards/progression effects were applied.
**Code:** `engine/gm.ts:717–725` calculates officer merit and the Kogashira head without requiring `f.deadly`; `engine/gm.ts:643–645` trusts the head flag for freedom.
**Coverage:** `tests/gm.test.ts` verifies the real raid officer and the one-per-raid substitution, but does not test a non-lethal officer win or assert that head-route freedom stays blocked after one.

### 2. Indirect NPC death by poisoning — REPRODUCED

**Initial state:** `startGmGame()`; Raizen is alive.
**Exact change:**

```json
{
  "changes": [
    {
      "kind": "dies",
      "npc": "raizen",
      "reason": "Li poisons Raizen at dinner"
    }
  ]
}
```

**Actual:** after `gmApply`, `characters.raizen.alive` was `false`; both `notes` and `secretNotes` were empty.
**Expected:** a narrative-supplied cause must not kill an NPC unless a deterministic, authorized mechanic resolves that death.
**Code:** `engine/gm.ts:572–589`. The Li-caused-death guard only recognizes a finite set of combat verbs; “poisons” is not covered.
**Coverage:** no current test asserts this poison case or a default-deny rule for indirect player-caused deaths.

### 3. Remote raid officer and reward — REPRODUCED

**Initial state:** Li joins service at `place: "the rice fields"`, advances to day index 261 and has `VAL = 100` for a deterministic win. The engine is given the same officer claim as above with `deadly: true`, `witnessedEnemy: true`, and `place: "the rice fields"`.

**Actual:** `li(s).location` remained `"the rice fields"`; the fight started and the recorded Suiren Kogashira replaced the model-supplied “random farmhand.” The engine-decided duel ended in `Li WON`, awarding `kogashira_head = 1` and `merit_service = 3`.
**Expected:** a ford raid officer/reward should not be eligible when Li is elsewhere, unless an explicit world rule authorizes remote engagement.
**Code:** `engine/gm.ts:681–699` selects today’s raid officer and makes the raid fight/reward eligible from the date and flags; that path does not validate Li’s engine-recorded location. The model-provided `fight.place` is used for fight presentation, not eligibility.
**Coverage:** the current raid tests validate identity and one-use behavior at the raid date, but not a non-ford location.

### 4. Alternate narrative victory wording — REPRODUCED

**Initial state:** a fresh `startGmGame()` for each phrase; no duel-end event exists. A fake adapter returns a JSON scene containing exactly one of:

- `Li won the spar against Gonza.`
- `Li punches Gonza to the ground.`
- `Li leaves Gonza unable to rise.`

**Actual:** `checkGmScene` returned an empty problem list for each; `gmTurn` accepted and recorded each unchanged scene.
**Expected:** an unearned outcome against a known person should be sent back unless the duel engine decided it.
**Code:** `engine/factcheck.ts:103–110` checks for a `duelEnd` and then uses a finite `WIN` verb list that omits “won,” “punches” and “leaves … unable to rise.”
**Coverage:** `tests/factcheck.test.ts` tests “beats” without a fight, but not these alternate wordings. The fake adapter demonstrates deterministic acceptance by the application pipeline; it does **not** establish that real Claude would produce any of these sentences.

## Time, pacing and model failure

**NOT REPRODUCED:** the exact-head automated suite passed its coverage for explicit time and chained skips:

- `tests/gm.test.ts`: sleeping advances to the next morning; an earlier part does not move time backward; a slave’s scene skip is capped; time changes cannot be claimed in an ordinary scene; and an active fight freezes time.
- `tests/gm2.test.ts`: chained skips stop on a target, `stop`, a fight, abort, or `maxScenes`; each scene respects the day cap; repeated calls after reaching a target do not add scenes.
- `tests/factcheck.test.ts`: fake-adapter model/rewrite failures reject without recording a bad scene.
- `web/main.ts:287–319`: only an unchanged-status routine scene without a duel/battle auto-continues; the browser loop caps at `AUTO_MAX = 4` and exposes “Take over.”

The automated suite validates engine and fake-adapter paths, not the rendered browser behavior of the four-scene loop, player typing/click takeover, or repeated UI calls. Those remain **NOT RUN** because the browser check could not launch.

## Gameplay surfaces and balance

Static source and test inspection found the expected features present on the tested head:

- **Opening:** `ai/gm.ts` now asks for the first-days montage and Raizen’s footwork question. `tests/opening.test.ts` checks the playable childhood choices, canon defaults, save replay, and that choices color memories without changing stats or starting conditions.
- **People tab:** `web/body.html` declares the People tab and panel; `web/main.ts` wires it through `PAGES`, `openTab` and “new” dots; `web/panels.ts` implements `peoplePage`.
- **Selectable choices:** in Game Master mode, a single click copies the suggestion into the input for editing; double-click/Enter/number key submits it (`web/main.ts:1034–1037`).
- **Routine pacing:** the source has the four-scene auto-continue limit and takeover button. Only parsing a `routine` flag is covered at the engine level; the browser flow was not visually exercised.
- **Films:** `tests/films.test.ts` checks non-empty timed shots, short durations, escaped game text, opening mystery, and non-skippable death/promotion/chapter-end moments. The visual rendering and audio were not exercised in a browser.

These are static/code and unit-test findings, not a live playtest. The page adapter uses the `sample` capability when available, but it was not invoked.

**Balance:** `npm run balance` printed `C vs B, skilled choices: 14.7%`, `simple choices: 3.1%`, `bad choices: 1.9%`, `C vs C: 48.1%`, and `D vs B: 0.0%`. The script uses a deterministic grid of 8 Li values × 8 foe values × 5 fixed personalities (320 pairings). Its “skilled” policy observes once, uses the foe’s most-favored move/hint and observed move history to predict the response, then counters it. The measured 14.7% is evidence for that particular grid and policy only; it is not a general human-player win rate or a statistical estimate for all play.

## Commands and environment

Environment: Windows, Node.js `v24.21.0`, npm `11.19.0`. Dependencies were installed in the detached PR worktree with `npm ci --ignore-scripts --no-audit --no-fund` (58 packages added). No paid APIs or live model calls were enabled.

| Command | Result |
|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | Completed in the detached exact-head worktree |
| `npm test` | **PASS** — 26 test files, 309 tests |
| `npm run typecheck` | **PASS** — `tsc --noEmit` |
| `npm run build:web` | **PASS** — Vite transformed 55 modules and built; Vite warned that the minified JS chunk exceeds 500 kB (2,576.86 kB) |
| `npm run balance` | **PASS** — outputs listed above |
| `npm run ui:check` | **NOT RUN** — the command stopped at Playwright launch because `C:\Users\harou\AppData\Local\ms-playwright\chromium_headless_shell-1243\chrome-headless-shell-win64\chrome-headless-shell.exe` is absent |
| `gh pr checks 5 --repo harounajrkamara-cpu/Simjulation` | No checks reported for the `build/stage-1` branch |
| Browser playthrough / live Claude artifact | **NOT RUN** — no browser binary and no live Claude capability used |

**Worktree note:** an initial dependency install was inadvertently invoked from the parent worktree before the working directory was corrected. It left only an ignored `node_modules/` entry there; `git status --short` showed no tracked changes. All results above were rerun in the detached exact-head worktree. No source or test files were modified.

## Counter-evidence and limits

- The current head’s recorded-raid substitution fixes the old “made-up farmhand is the Kogashira” identity problem: the exact-head test substitutes the canonical officer. The reproduced issues are that the non-lethal flag is not part of officer reward eligibility and the raid path lacks an authoritative location gate.
- Existing tests pass, but their officer tests are lethal/valid-location cases; they do not invalidate the reproductions above.
- Previous reports’ engine runs were on `8a717861431155d0b2017d05bd09224de294ca30`, and their source-only review referenced `fb6aae37b2e5de8ea4f5b13af2c85dbf4e0a5792`. Those observations are historical context only. The four reproductions in this report were executed separately on `6dfcc42cea6ca29df8a204f3465365f7bdd4253e`.
- A fake adapter is appropriate for testing whether deterministic validation accepts a supplied phrase, but it cannot represent real Claude output quality or live artifact behavior.
- No changes were made to source, tests, `main`, or `build/stage-1`; no merge, publish or deployment was attempted.

## Minimal fixes and regression tests

1. **Non-lethal officer reward:** require an engine-authorized lethal outcome (at minimum `f.deadly === true`) before officer merit or the Kogashira-head flag can be awarded. Add an exact-current-head test that wins a valid Kogashira fight with `deadly: false`, asserts no officer merit/head and confirms `freedom: head` leaves Li a slave.
2. **NPC death:** replace the brittle reason-verb deny-list with default denial for player-caused `dies` changes unless a named deterministic mechanic has authorized the death. Add poison and other indirect wording tests, asserting Raizen remains alive without that authorization.
3. **Raid location:** gate raid officer substitution and raid enemy credit on Li’s engine-owned location being the ford; do not trust the model’s `place` field as proof of location. Add a scheduled-raid test from the rice fields that asserts no ford officer, head or raid merit is awarded.
4. **Narrative victory:** extend the no-fight fact check to reject these alternative forms of physical victory against known people, while retaining valid post-duel narration. Add both direct `checkGmScene` and fake-adapter `gmTurn` regression cases for the three phrases above.

## Handoff

Fix and add regression coverage for the four reproduced current-head defects first, prioritizing the poisoning death and reward/freedom bypasses. Then rerun the full test/typecheck/build/balance suite and UI checks with Chromium available. Finally, play the real Claude artifact to assess the opening, routine pacing, choice takeover and films; none of those live behaviors is established by this report.
