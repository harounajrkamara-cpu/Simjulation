# Build Plan v2 (✅ approved Oct 5, Game Experience ch. 10)

Every build session starts from `docs/MASTER_BUILD_PROMPT.md`. Build branch: **`build/stage-1`** (made from `design/world-bible` at the first build session); merging into `main` only on the owner's yes.
**Always playable locally:** after every milestone the game runs in chat mode with Claude (`npm run turn` + the `play` skill).

## Tech (unchanged from v1)
TypeScript on Node 22 · engine = pure library in `engine/` (Vitest) · `ai/` one interface (`interpret`, `narrate`), adapters: claude.ai page · Claude Code chat (local play) · no AI; key adapters later · web = Vite + plain TS · saves = event log + world number + version.

## Done before v2 (stage 1, v1 plan)
- ✅ M0 clean-up (old code in `legacy/`, key line blanked; key revoked by the owner Oct 5) · ✅ M1 engine core · ✅ M2 start data · ✅ M3 turn loop (terminal, chat, browser) · ✅ M5 training, growth, duel engine, Sasabe raid · 🟡 M4 people & memory (rumour spreading missing) · online page published.
- Checked Oct 5: 19 tests pass, typecheck clean, no key in the current code.

## Phase 1 – Vertical slice "The Red Crane's boy" (Year 100, Month 1 → after the raid, final look)
| # | Milestone | Uses | Done when |
|---|---|---|---|
| V1 | Engine catch-up | WB ch. 8, 11; GE ch. 7 | rumour spreading done; all engine text in third person; HELP/WAIT per ch. 11; replay test green |
| V2 | War chronicle UI | GE ch. 3, 6 | Story tab + side panel + tabs (Army = outside view) match the reference screens at 1440 and 390 px; contrast and 44 px checks pass |
| V3 | AI layer | GE ch. 5, 7 | interpreter (asks when unsure) + narrator + fact checker; claude.ai page mode, chat mode and no-AI mode; ink streaming; REWRITE / CORRECT; golden set ≥ 20 fact packets passes |
| V4 | Onboarding | GE ch. 8 | New life → prologue → chapter card → first-week beats ✚ → WAIT lesson → Daisuke sparring ✚; GUIDE hints, example lines, "Why?", tooltips, How to play; ch. 8 time targets met in a Playwright run |
| V5 | Big moments + pacing core | GE ch. 3b, 9 | 4 moment tiers; title card, duel overlay, legend screen; director phases with beat windows (slave stage); session-end summary |
| V6 | Slice test | GE ch. 8–9; Numbers §4, §12 | Monte Carlo duel tests; determinism tests; **owner playtest**; fixes done |

## Phase 2 – Stage 1 complete: the slave arc (→ freedom, 8–12 h)
Freedom routes, contract seasons, Year 100 story calendar, timeskip summary, Journal/RECAP, save slots. Done when simulated strong careers reach freedom at 13–15 and the owner has played to freedom.

## Phase 3 – Stage 2: soldier life · Phase 4 – Stage 3: land & family · Phase 5 – Stage 4: court & kingdoms + epilogue
Each phase gets its own milestone table at its start (spec → plan → tasks). Details: GE ch. 10 Part B.

## Testing (every phase)
Unit · determinism replay · Monte Carlo balance (Numbers §12) · narrator golden set · Playwright UI (1440 / 390 px) · owner playtest at the end of the slice and of each phase.
