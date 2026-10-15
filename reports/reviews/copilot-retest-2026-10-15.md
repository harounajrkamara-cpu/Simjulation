# Copilot independent retest — 2026-10-15

## Tested revision

PR #5 (`build/stage-1`), exact live head tested: `1e28a47bbbe01e36f4db7c89b5dc69dc0ec9b4ca`.

The original retest worktree was at `e3d24468a4530fdd4e34962d514e05c5b6ef63bd`, but GitHub advanced the PR during the retest. The tests below were rerun against the later observed head in a separate detached worktree. The four-fix commit `d447d9b6a9d788c4279d98d6d86a8d72da15fbeb` is an ancestor of the tested revision. No tracked game/source/test files were changed.

Runtime: Windows, Node `v24.21.0`, npm `11.19.0`, Vite `6.4.3`, Vitest `3.2.7`, Playwright Core `1.63.0`. `npm ci` restored the lockfile dependencies. npm reported 3 dependency advisories (1 moderate, 2 critical); they were not investigated or modified in this retest.

## Commands and results

| Command | Result |
|---|---|
| `npm ci` | Passed; installed 58 packages. |
| `npm test` | Passed: 27 files, 319 tests. |
| `npm run typecheck` | Passed. |
| `npm run build:web` | Passed; Vite emitted its existing >500 kB JavaScript chunk warning. |
| `npm run balance` | C vs B skilled 14.7%; simple 3.1%; bad 1.9%; C vs C good 48.1%; D vs B good 0.0%. |
| Independent engine/fake-GM harness | Passed all cases below. |
| `npm run ui:check` | Did not complete: after the New Life screen, Playwright found `#pr-next` but it was not visible and timed out after 30 seconds in `passIntro`. The same failure occurred on the immediately preceding PR head; the UI flow is inconclusive, not a pass. |
| `gh pr checks 5` | No checks reported for `build/stage-1`. |

## Exploit retest

- A winning non-lethal (`deadly: false`) Kogashira practice duel on the raid day gave no officer head or service merit; requesting head-based freedom left Li a slave.
- `dies` with reason `Li poisons Raizen at dinner` was refused; Raizen remained alive.
- A Kogashira officer substitution while Li was at the rice fields did not count as a raid officer and awarded no raid officer result.
- A fake GM adapter returning each of `Li won the spar against Gonza`, `Li punches Gonza to the ground`, and `Li leaves Gonza unable to rise` was rejected after the single rewrite; no scene was recorded.
- The three false-positive controls (`Li puts the bucket down near Gonza`, `Li leaves Gonza's tent`, and `Li sends Hachi to fetch water`) were accepted by the same fake-GM flow.

The exploit fixes remain effective in the tested revision. Existing automated time/sleep and GM pacing tests also passed within the full suite; this was not a live Claude playtest.

## Not run / remaining uncertainty

- Real Claude on the published claude.ai artifact: not run; no paid API was used.
- UI browser flow: inconclusive due to the hidden `#pr-next` element in the existing UI-check path.
- GitHub CI: no checks were reported for the PR branch.