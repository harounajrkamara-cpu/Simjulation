# ChatGPT independent GM audit — 15 October 2026

## Target and method

- Repository: `harounajrkamara-cpu/Simjulation`
- Current PR #5 source inspected remotely: `build/stage-1` commit `fb6aae37b2e5de8ea4f5b13af2c85dbf4e0a5792`.
- Local runtime snapshot: uploaded `Simjulation-main.zip`, base `main` commit `8a717861431155d0b2017d05bd09224de294ca30` dated 12 October 2026. This is **not** the PR #5 head.
- Runtime: Node.js v22.16.0, globally installed TypeScript 5.8.3. I used a small temporary CommonJS require hook that transpiles the source TypeScript files with TypeScript's `transpileModule` and calls the real deterministic engine functions. No npm package dependencies were installed. This is a custom direct-engine reproduction, **not** Vitest, not a typecheck, not a browser test and not a live Claude test.
- `npm ci --offline --ignore-scripts --no-audit --no-fund` failed with `ENOTCACHED` because `why-is-node-running@2.3.0` was absent from the local npm cache. The official package scripts were therefore not run in this audit.

## Results

### REPRODUCED on the older main snapshot: indirect death by poisoning

Input passed through `parseGmTurn` and `gmApply`:

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

Observed result:
- `notes: []`
- `secretNotes: []`
- `s.characters.raizen.alive === false`
- Event recorded: `Mikumo Raizen dies (Li poisons Raizen at dinner)`

Expected: a model-supplied free-text reason must not be allowed to kill an NPC outside a specific deterministic mechanic authorised by the game's rules.

Current PR #5 source inspection: the limited verb check in `engine/gm.ts` case `dies` still does not include `poison`/ `poisons`. **The exact current PR head still requires a targeted runtime regression test.**

### REPRODUCED on the older main snapshot: non-lethal fake officer can earn head/merit

Setup:
1. Start a Game Master state.
2. Set Li into service.
3. Advance the engine to day index 261, a scheduled raid day.
4. Start this fight and resolve it with repeated `feint` moves:

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

Observed result:
- Li won against the random farmhand.
- `kogashira_head === 1`.
- `merit_service === 3`.
- Event recorded: `combat merit +3 (enemy Kogashira head)`.

Expected: a non-lethal/practice fight cannot award an officer's head or officer-kill merit.

Current PR #5 source inspection: the raid fix now substitutes the registered raid officer's identity/strength, so this exact farmhand identity test should not be asserted as the current-head output. However, `gmDuelStart` still appears to grant officer merit/head without requiring `f.deadly === true`. **Add and run the adapted non-lethal raid-officer regression against exact PR #5 head.**

### SOURCE-LEVEL RISK: raid officer location not validated

In current PR #5 `engine/gm.ts`, `fightFacts` resolves `raidOfficerOn(today(s))` and checks the date/flags; the substitution path does not visibly require that Li or the fight be at the ford. This has not been reproduced at runtime on the current head.

Required test: on a scheduled raid day, put Li at another location and submit an officer fight there. Verify whether the ford's officer is incorrectly substituted and whether rewards are possible. Mark the result `NOT RUN` until executed against the exact PR head.

### SOURCE-LEVEL RISK: alternate wording for an unearned win

Current `engine/factcheck.ts` has a limited win-verb list. Wording such as `Li won the spar against Gonza` or `Li punches Gonza to the ground` may evade it, but a full-pipeline bypass has not yet been executed. Add tests without a corresponding `duelEnd` event and distinguish actual bypass from a limitation of the word-based detector.

## CI and live-test status

At the time of inspection, GitHub returned zero check-runs for PR #5 head `fb6aae37b2e5de8ea4f5b13af2c85dbf4e0a5792`. The green Actions run from the separate lab branch is not evidence of CI passing on this PR head.

Not run on the exact PR #5 head:
- `npm test`
- `npm run typecheck`
- `npm run build:web`
- `npm run balance`
- `npm run ui:check`
- Real Claude playthrough on the published artifact

## Handoff

Do not merge PR #5 yet. First add current-head regression tests for (1) non-lethal officer reward, (2) indirect death, (3) officer selection away from the ford, and (4) alternative wording for unearned wins. Then run all official checks against the exact current head and separately playtest the real Claude artifact.

Use `reports/AI_REVIEW_PROMPT.md` for independent reviewers and comment evidence/commit details on issue #6.