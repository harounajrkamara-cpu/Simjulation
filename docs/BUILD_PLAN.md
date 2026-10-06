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
| V4 ✅ | Onboarding | GE ch. 8 | New life → prologue → chapter card → first-week beats ✚ → WAIT lesson → Daisuke sparring ✚; GUIDE hints, example lines, "Why?", tooltips, How to play; ch. 8 time targets met in a Playwright run |
| V5 ✅ | Big moments + pacing core | GE ch. 3b, 9 | 4 moment tiers; title card, duel overlay, legend screen; director phases with beat windows (slave stage); session-end summary |
| V6 ✅ (owner playtest open) | Slice test | GE ch. 8–9; Numbers §4, §12 | Monte Carlo duel tests; determinism tests; **owner playtest**; fixes done |

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

### V4 report (Oct 6) ✅
- ✅ **New life screen** (way of play: Ironman; Story mode shown as "comes later" · Storyteller Claude / plain · Guidance full / light / off · Ink speed slow / fast / instant), remembered per browser; opens on every new life.
- ✅ **Prologue**: 7 hand-written ink slides (`PROLOGUE` in `engine/content.ts`, only what Li knows), Skip / Continue / "Begin the chronicle".
- ✅ `ui:check` walks New life → prologue → game at 1440 / 900 / 390 px (screens in `docs/screens/v4/`).
- ✅ Chapter card after the prologue ("Chapter 1 · The Red Crane"), reusable title card (click or key to end).
- ✅ First-week beats ✚ as story events, with **story choices** that lapse when the part of the day ends: Gonza's chest (Day 1 morning; take it ⚠ or look away), the cook tent, the first night, Sukezō's WAIT lesson (Day 7 evening).
- ✅ **Daisuke sparring bout** (Month 1, Day 20, Sasabe threshing floor; fight or walk past). Duel outcomes now live in each duel template (text, journal, growth, merit, relationships, memories, wound cap: sticks leave at worst Hurt). Winnable by reading him: 31 of 178 move lines win.
- ✅ GUIDE hint line (one at a time, once per life, closes when the player acts; Light = only screen hints), example lines under the write box until 3 free-text turns, "Why?" on results (the choice + Li's journal lines), gold-underlined terms with tooltips (only learned Encyclopedia entries), How to play (strip + New life screen; six points).
- Not done: measuring the ch. 8 real-time targets (needs a human playtest, V6).

### V5 report (Oct 6) ✅
- **Pacing director** (`engine/director.ts`): build-up → peak → fade → relax, computed from the event log (no dice); slave stage rests at least 3 days after a peak. It only times Li-local beats.
- **Conditional story beats** (`day: -1` + `when`): fire at their part of the first day the condition holds, after the director's rest.
- **First legend moment**: *Kurose no Ryū — the Dragon of the Kurose* (the approved ch. 6 mockup). Only if Li won the raid, the word reached ≥ 3 people, and the rest days passed; at the fire, in the evening. Legend screen (letterbox, giant name, 黒瀬の龍 behind it, red seal, date, the band as witnesses), journal "Legend:" line, nickname on Li's card. Never given to a boy who ran (test).
- **Title cards** for title-tier moments (Sticks at Sasabe, Fire on the river) and the turn of each season; **duel display** with two fighters, wound tracks, round and what Li has read; **"A good place to rest"** summary once the quiet after a peak begins (journal lines of the session, game saved).
- **Evidence**: `npm test` 133 passed (new `tests/v5.test.ts`); `ui:check` loads saves made just before the raid and the nickname (`scripts/fixtures.ts`) and checks the title card, duel display and legend screen; screenshots in `docs/screens/v5/`.
- **Later**: ceremonies (reward ceremony with witnesses) arrive with stage 2 promotions; more legend moments per ch. 3b as their deeds become possible.

### V6 report (Oct 6) ✅ — owner playtest still open
- **Full playthrough test** (`tests/v6.test.ts`): from the first morning through Gonza's chest, the cook tent, the inspection, the Sasabe youths, the WAIT lesson, Sayo's visit, the spar, the raid and the nickname, with no dead end; the save of the whole slice reloads to the same state. A player who skips quiet days needs **25 turns** for the chapter (one or two sessions, GE ch. 9).
- **Balance** (`npm run balance`, `scripts/balance.ts`): every opponent in a fixed grid (strength × five fighting habits) against fixed player policies — no dice.
  | Matchup | Measured | Target (Numbers §12) |
  |---|---|---|
  | C vs B, bad choices (always attack) | 1.9% | < 3% ✅ |
  | C vs B, good choices (read, then answer his last move) | **3.1%** | 10–20% ⚠️ |
  | C vs B, perfect reading (upper bound) | 54% | – |
  | same rank | 48% | a real fight ✅ |
  | D vs B (two ranks up) | 0% | none ✅ |
- ⚠️ **Open balance question for the owner:** with ordinary good play a C beats a B about 3% of the time, below the 10–20% target. The result depends almost entirely on reading the opponent (0% to 54%). Options: (a) let observing reveal more (hint after 1 observe already exists; e.g. +observe bonus per Numbers §4), (b) raise the clash bonus, (c) accept 3% as "upsets are rare". Not changed: the Numbers Sheet is approved and changes need the owner.
- **Determinism**: replay/hash tests across the whole slice. **Owner playtest**: still to do (the owner plays the published page).

## Phase 2 – Stage 1 complete: the slave arc (→ freedom, 8–12 h)

### Phase 2 report (Oct 6) 🟡 first version — content is a 📝 proposal for owner review
- **Hagiwara levy** (Year 100, Month 4, Day 1): Raizen lends bearers to the levy; Li may step forward (⚠ real fighting) → official Kurogane service — or stay with the baggage.
- **Border raids** on a fixed schedule (Atlas §9 border war; months 4–9, days 8 and 22, every year): a skirmish duel at the ford against a fixed rotation of five Suiren raiders (`engine/campaign.ts`); a witnessed win = 1 merit in service; wounds at worst Wounded.
- **Freedom routes** (WB 10.4): merit law — **30 merit in service** frees Li (legend moment "Free · by the merit law of Kurogane", his paper burned, Kurogane pays Raizen 10 ryō); **buying** — "Pay Rokubei the price: fifteen ryō" (15,000 mon) in the evening once the price is known; **Raizen's word** — when his trust and respect pass 85. Each sets Li free (new `status` event), closes stage 1, and the Goals panel shows the routes with progress.
- **Career simulation** (`scripts/career.ts`, test): a strong player (steps forward, trains at night, reads opponents) is **free at 15** (Year 103, Month 6; 42 skirmishes, 30 won) — inside the Numbers §12 target 13–15.
- First version left out: escape, an officer's head, contract seasons, beats between raids, money earning — **done in the completion round below**.

### Phase 2 completion (Oct 6, evening) ✅ — content is a 📝 proposal for owner review
- **Officers at the ford** (Numbers §6: "officer duels only happen when a battle offers them"): fixed schedule — every year the raid of Month 6, Day 22 is led by a **Gochō** (W ~29) and the last raid, Month 9, Day 22, by a **Kogashira** (W ~37). Li chooses *Go for the officer* (⚠ can be badly wounded) or *Hold your place in the line* (an ordinary skirmish). A won officer fight: 3 merit + his purse; a **Kogashira head frees Li** (legend "Free · by an officer's head").
- **Yearly contract**: Month 10, Day 1 the paid seasons end and Lord Hagiwara renews for a year (rumour: "never broken a contract"); the levy goes home for winter. A boy who stayed with the baggage is **offered the levy again every summer** (no career stuck, Numbers §12).
- **Money** (for the buy route): loot from a won skirmish (40–200 mon), an officer's purse (600 / 1,000), payday tips (10 mon on days 1 and 16), stitching levy men on raid days (20), and **Raizen's share** of the Kurogane reward at the contract (50 mon per merit, Numbers §7 "an owner may share") — only if his respect is above 50 (he starts at 40).
- **Escape** (WB 10.4 route 4): Sukezō, to a good student who knows about the iron box, tells of **Tatara over the Black Hills** (no slavery, Atlas §12). Then a night option *Run for Tatara* (⚠ hunted). No dice: Li gets away if Gonza does not walk the camp that night and Li has stealth ≥ 25, endurance ≥ 40, fatigue ≤ 1 and is at worst Hurt; otherwise he is caught, told exactly why, wounded, and Raizen's trust drops. If Hachi asked for the promise, Hachi runs with him. Result: free, **hunted**, in Tatara (legend "Free · by his own feet, and hunted"; "Seen by: nobody"). Stealth now grows a little with every undetected night of training.
- **Beats between raids** (wait for the director's quiet days): Daisuke joins the levy beside Li · Kaname at the ford (if Li saved her) · Sayo counts his notches · Hisame: "count his breaths" · Gonza mocks the notches · Raizen sits at Li's fire ("ten ryō") · Hachi in winter quarters · Sukezō's Black Hills talk.
- **UI**: Goals panel lists the officer route and the escape route with progress; legend screens can name their own witnesses; Encyclopedia: the levy, the yearly contract, Tatara. Free text: "I run for Tatara", "I buy my freedom".
- **Evidence**: `npm test` **163 passed** (19 new in `tests/phase2b.test.ts`: officer schedule and choice, Kogashira head frees, contract and Raizen's share, levy re-offered, tips and loot, escape success / with Hachi / caught by Gonza / caught by a sentry, three beats, replay of a levy year); typecheck clean; `npm run ui:check` passed at 1440 / 900 / 390 px plus two new save fixtures (the Gochō's raid and an escape night): screenshots in `docs/screens/phase2/`. Chat mode (`npm run turn`) smoke-tested. `DATA_VERSION` 4 → 5 (older saves start a new life with a note).
- **Career numbers** (no dice, fixed policies):
  | Player | Free at | How |
  |---|---|---|
  | strong (levy, night training, reads opponents, goes for an officer only when nearly his match) | **14** (Year 102, Month 9) | Kogashira head; 23 merit, 3,352 mon by then |
  | escape-minded (studies with Sukezō, trains at night, runs on the first good night) | **13** (Year 101, Month 2) | escape, hunted |
  | cautious (stays with the baggage, no levy) | not free in 4 years | levy offered again each summer; tips only ≈ 240 mon a year |

### Phase 2 — owner decisions needed
1. **Escape is the fastest route (age 13).** Is that fine given its price (hunted, the band and Kaname/Sayo left behind, Stage 2 starting in Tatara)? Or raise the bar (e.g. stealth 35, or only in winter when the band is in quarters)?
2. **Buying is very slow.** A strong player has ~3,400 of 15,000 mon when he is freed by merit; a cautious one earns ≈ 240 mon a year. Keep buying as a rare late route, or add a real way to earn (e.g. selling Sukezō's medicines, gambling at the fire)?
3. **Officers**: a Gochō and a Kogashira once a year each, on fixed days — right rhythm? (Numbers §6 says officer duels only come when a battle offers them.)
4. **Runaway in Stage 2**: Stage 2 is designed as Kurogane soldier life; a runaway in Tatara needs its own start (hunters, a Tatara smithy or militia). Needs a design decision before Stage 2.
5. **Raizen's share** threshold (respect > 50) and size (half the 0.1 ryō per merit).
Freedom routes, contract seasons, Year 100 story calendar, timeskip summary, Journal/RECAP, save slots. Done when simulated strong careers reach freedom at 13–15 and the owner has played to freedom.

## Phase 3 – Stage 2: soldier life · Phase 4 – Stage 3: land & family · Phase 5 – Stage 4: court & kingdoms + epilogue
Each phase gets its own milestone table at its start (spec → plan → tasks). Details: GE ch. 10 Part B.

## Testing (every phase)
Unit · determinism replay · Monte Carlo balance (Numbers §12) · narrator golden set · Playwright UI (1440 / 390 px) · owner playtest at the end of the slice and of each phase.
