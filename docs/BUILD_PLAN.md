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
| V1 ✅ | Engine catch-up | WB ch. 8, 11; GE ch. 7 | rumour spreading done; all engine text in third person; HELP/WAIT per ch. 11; replay test green |
| V2 ✅ | War chronicle UI | GE ch. 3, 6 | Story tab + side panel + tabs (Army = outside view) match the reference screens at 1440 and 390 px; contrast and 44 px checks pass |
| V3 ✅ | AI layer | GE ch. 5, 7 | interpreter (asks when unsure) + narrator + fact checker; claude.ai page mode, chat mode and no-AI mode; ink streaming; REWRITE / CORRECT; golden set ≥ 20 fact packets passes |
| V4 🟡 | Onboarding | GE ch. 8 | New life → prologue → chapter card → first-week beats ✚ → WAIT lesson → Daisuke sparring ✚; GUIDE hints, example lines, "Why?", tooltips, How to play; ch. 8 time targets met in a Playwright run |
| V5 | Big moments + pacing core | GE ch. 3b, 9 | 4 moment tiers; title card, duel overlay, legend screen; director phases with beat windows (slave stage); session-end summary |
| V6 | Slice test | GE ch. 8–9; Numbers §4, §12 | Monte Carlo duel tests; determinism tests; **owner playtest**; fixes done |

### V1 report (Oct 5) ✅
- **Rumours** (`engine/rumours.ts`): every night at the fire each story moves one step along a fixed "who talks to whom" list (same place only; Hisame, Ishizue and Sayo pass nothing on). Witness → "told" (certainty −10), later steps → "rumour" (−20); weight ×0.75; stops below weight 25 or certainty 30. Each retelling: numbers ×1.25 (the Atlas legend check: 120 → 300 men in four retellings), details in [brackets] drop below certainty 60. Hearers' view of Li changes (scaled by certainty, fades in 30 days, Numbers §8); a cruel hearer (Gonza) resents good news (rivalry instead of respect). Li sees a sign when it reaches someone he knows (max 2 a night, ch. 12b #11).
- **Third person** in all engine narration, labels and the dashboard ("Toward Li: likes Li"); dialogue in quotes and questions to the player keep "you". A source scan test guards it.
- **WAIT**: a slave plans at most 30 days; a skip stops for story, a fight or the turn of a season; skipping equals playing the same routine (test). HELP rewritten ("write what Li does, as I…").
- **Saves**: DATA_VERSION 3 → 4 (character texts changed); older saves are refused with the "older game version" message.
- **Evidence**: `npm test` 32 passed (19 old + 13 new in `tests/v1.test.ts`), `npm run typecheck` clean, replay/save tests green; code review (medium) found 4 issues, all fixed; chat mode smoke test OK.
- **Not yet**: rumours between the camp and Sasabe on visit days; TROPHIES/WORLD/THREATS/REWRITE/CORRECT (later milestones).

### V2 report (Oct 5) ✅
- **War chronicle** (`web/`): top strip (chapter, date, place, condition, money, Save file, New life) · tabs Story · Map · Li · Army · People · Journal · Encyclopedia with gold "new" dots · Story tab with drawn scene header (day/night, campfire), turns (the player's words, story, ▲▼ chips, "New:" people), choices with tested skill and ⚠ risk, "Or write it" line · side panel with Li card, fogged ink map, chronicle feed, goals. Approved ch. 6 tokens and type only; no emoji in the interface.
- **Tabs**: Li (condition, stats, styles, skills, season training, traits, goals) · People and Army (cards with Li's estimate of strength and opinion; Army = the band seen from the baggage line, ch. 3) · Journal (Li's words by day) · Encyclopedia (only learned entries, new `ENCYCLOPEDIA` data) · Map (Akaishi, Kōri, Sasabe when known, the Kurose; Suiren to the south, per the Atlas).
- **Phone (390 px)**: one column, the page scrolls, choices pinned at the bottom; side panel content lives in the Li and Map tabs. Number keys pick options on desktop.
- **Markup in one place**: `web/body.html` feeds both `index.html` (new `web/vite.config.ts`) and the published page; fonts switched to Shippori Mincho + Spectral; inline favicon.
- **Evidence**: new `npm run ui:check` (`scripts/ui-check.mjs`, playwright-core + the pre-installed Chromium): plays turns and opens every tab at 1440 and 390 px; checks contrast ≥ 4.5:1, targets ≥ 44 px, no emoji, no horizontal scroll, no page errors, and that an old save starts a new life instead of breaking. Passed on the dev page and on the built single file. Screenshots: `docs/screens/v2/`. `npm test` 32 passed, typecheck clean. Code review (medium) found 3 issues, all fixed.
- **Deviation**: the map runs the Kurose west–east with Suiren to the south (Atlas), not north–south as in the ch. 6 sketch.
- **Not yet** (later milestones): "Why?" links, hints and example lines (V4), title cards and duel overlay (V5), AI narration (V3). The playwright plugin needs Google Chrome, which is not installed in cloud sessions; `ui:check` is used instead.

### V3 report (Oct 5) ✅
- **`ai/` module** (no AI inside the engine): `packet.ts` builds the fact packet (visible facts only, people present with public look/personality/opinion label, Li's voice, tier, word range, hand-written dialogue as core lines; 🔒 truths and hidden numbers never enter it) · `checker.ts` is the code fact check (no world name outside the packet, so secrets like "Hattori" cannot leak; no new numbers or deaths; core lines word for word; third person; no game words; length) · `narrate.ts` = write → check → one rewrite with the reasons → template text · `interpret.ts` maps free text to one action the engine allows now (or a command, or a question back, or "none") · `prompts.ts` (narrator rules from WB ch. 11 + GE ch. 7 style; player text fenced as data) · `adapter.ts` one interface.
- **Claude in the page** (`web/ai-page.ts`): the claude.ai `sample` capability, the player's own account; **Storyteller** switch in the strip; free text → interpreter → **confirmation** ("Li will: … ⚠ … Do it / Change") for risky or uncertain readings (this is CORRECT, ch. 11) → engine → narrator for free text, people and story moments (routine stays template, owner decision ch. 7) → shown only after the check, then **inked in** word by word (click to finish; instant with reduced motion) → **Rewrite** = same facts, new words. Permanent errors (not granted, disabled) switch to the plain chronicle with one note; the game never stops.
- **Saves** store the intent behind each AI-read action and every approved narration (`intent` / `narration` events; they change nothing in the world); a loaded game shows the last narration again.
- **Chat mode** (local play): `npm run turn` prints a narrator packet after story moments; the `play` skill reads the owner's words like the interpreter (asks when unclear, confirms ⚠ options) and narrates from the packet under the same rules.
- **Evidence**: `npm test` 121 passed — the **narrator golden set** = 25 real moments of play (arrival, chores, every band member's talk, all five rumours, Gonza catching Li twice, night training, the story days, the raid start and its won/fled/lost endings, word spreading): no secret in any packet; the template passes the check; six planted mistakes (invented name, the name Hattori, a new number, an invented death, "you", stat words) and a dropped dialogue line are all caught; the loop is tested with a fake AI (accept, rewrite once, fall back). `npm run ui:check` also plays the AI path in Chromium with a fake Claude in the page (interpret → confirm → engine → narrate → Rewrite → refusal → saved notes). Code review (medium) found 4 issues, all fixed.
- **Not proven yet**: the real Claude in the claude.ai viewer (no viewer in this sandbox) — the owner should try free text on the published page; how often real narrations pass the check first time. **Later**: engine use of tone, promises and lies (stored already); "any other action" resolution by skill vs difficulty (GE ch. 5 step 4) — today the interpreter maps only to actions the engine already has.

### V4 progress (Oct 6) 🟡
- ✅ **New life screen** (way of play: Ironman; Story mode shown as "comes later" · Storyteller Claude / plain · Guidance full / light / off · Ink speed slow / fast / instant), remembered per browser; opens on every new life.
- ✅ **Prologue**: 7 hand-written ink slides (`PROLOGUE` in `engine/content.ts`, only what Li knows), Skip / Continue / "Begin the chronicle".
- ✅ `ui:check` walks New life → prologue → game at 1440 / 900 / 390 px (screens in `docs/screens/v4/`).
- ⏳ Still to do: chapter card · first-week teaching beats ✚ (Gonza's chest Day 1 morning, the cook tent, first night, Sukezō's WAIT lesson Day 7) · Daisuke sparring bout (Month 1, ~Day 20) · GUIDE hint line (uses the Guidance setting) · example lines under the write box until 3 free-text turns · "Why?" on changes · nested tooltips · How to play page · ch. 8 time targets in a Playwright run.

## Phase 2 – Stage 1 complete: the slave arc (→ freedom, 8–12 h)
Freedom routes, contract seasons, Year 100 story calendar, timeskip summary, Journal/RECAP, save slots. Done when simulated strong careers reach freedom at 13–15 and the owner has played to freedom.

## Phase 3 – Stage 2: soldier life · Phase 4 – Stage 3: land & family · Phase 5 – Stage 4: court & kingdoms + epilogue
Each phase gets its own milestone table at its start (spec → plan → tasks). Details: GE ch. 10 Part B.

## Testing (every phase)
Unit · determinism replay · Monte Carlo balance (Numbers §12) · narrator golden set · Playwright UI (1440 / 390 px) · owner playtest at the end of the slice and of each phase.
