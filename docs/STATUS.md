# Project status

## ▶ Start the next session with this (copy-paste)
> Continue building Sengoku Soldier in the Simjulation repo on branch **`build/stage-1`** (push there; never to main; no PRs).
> Read `CLAUDE.md`, `docs/STATUS.md`, `docs/MASTER_BUILD_PROMPT.md` and `docs/BUILD_PLAN.md` first, then only the chapters the milestone names.
> Vertical slice V1–V6 done. Phase 2 (slave arc → freedom) is complete as a 📝 proposal: levy, border raids, officers at the ford, yearly contract, money, all four freedom routes (merit, officer head, buying, Raizen, escape), beats between raids — see "Phase 2 report" in BUILD_PLAN. Open for the owner: playtest, the C-vs-B balance question (BUILD_PLAN V6), and the Phase 2 questions (BUILD_PLAN Phase 2 "Owner decisions").
> Next build work (only after the owner's answers, or if he says go): the rest of the Phase 2 row — timeskip summary screen, Journal/RECAP polish, save slots. Stage 2 (soldier life) needs owner design first, including where a runaway starts.
> Verify with `npm test`, `npm run typecheck` and `npm run ui:check` (start `npm run web` first). Publish the game with `node scripts/build-artifact.mjs` and republish `dist-web/sengoku-soldier.html` to https://claude.ai/artifact/AcDN6DV8D9SC5dBJybhcdx (keep the `sample` capability). Update STATUS and BUILD_PLAN at the end.

**Where things are (Oct 6, evening):** code + newest docs on `build/stage-1`: V1–V6 done, Phase 2 complete (proposal), 163 tests. Design history on `design/world-bible`. `main` = old prototype. Plugins are enabled in `.claude/settings.json`; the playwright plugin needs Google Chrome (missing in cloud), so use `npm run ui:check` (playwright-core + /opt/pw-browsers Chromium). Owner feedback so far: loves the war chronicle; story and choices scroll as one column (fixed Oct 6).


## Where we are
- **Game Experience Bible (Oct 5):** `docs/GAME_EXPERIENCE.md` ch. 1–7 ✅, **ch. 8 Onboarding ✅** (approved with 6 fixes, applied), **ch. 9 Pacing ✅**, **ch. 10 ✅** — Game Experience Bible complete (v1.0). Local play with Claude: `play` skill + chat mode (`.claude/skills/play/`). Ch. 8 example screens (New life · prologue slide · first free text) added as row 2 of the style canvas. Visual style example: https://claude.ai/artifact/SYrfY3m7VaNDTs5GC3TJpK (approved). Owner installed plugins (frontend-design, Design, code-review, playwright) locally; turned on for the claude.ai account and enabled for this repo in `.claude/settings.json` (Oct 5).
- **Stage 1 build started (Oct 5):** new engine in `engine/`, playable in browser (`npm run web`), terminal (`npm run play`) and chat (`npm run turn`). M0–M3 and M5 done (duel engine + Sasabe raid), M4 partly. Online page: https://claude.ai/artifact/AcDN6DV8D9SC5dBJybhcdx. Continues with **build plan v2** (vertical slice V1–V6), see `docs/BUILD_PLAN.md`.
- Ch. 10 Li's background ✅ approved. Kingdom names are now used everywhere (epithets only as nicknames). Elite titles: Six Pillars (Kurogane), Three Storms (Hayate). Family Mibu renamed Tsurumaki (real clan name).
- Numbers sheet `docs/NUMBERS_SHEET.md` **v0.3 ✅ approved** (owner kept fast progression and the Kurogane head-for-freedom law). Next: **build stage 1** (Li as a slave: turn loop, dashboard, RECAP, people & memories, training, duels).
- World Bible **v0.5** (ch. 12b determinism & feedback rules, S-rank rule, no magic approved)
- Language of the simulation: **English**.
- Build plan: 4 stages, each playable.
  1. Li as a slave: turn loop, dashboard, RECAP, people & memories, training, duels
  2. Soldier life: units, battles, ranks, promotions, pacing director
  3. Land & economy, family politics
  4. Court, kingdoms, full world

## Next step
- **Building, branch `build/stage-1`:** V1–V6 ✅ (vertical slice) · Phase 2 ✅ complete as a 📝 proposal (Oct 6 evening: officers at the ford, yearly contract, money, escape to Tatara, beats between raids; 163 tests). **NEXT:** owner playtest + answers to the V6 balance question and the five Phase 2 questions (BUILD_PLAN), then the rest of the Phase 2 row (timeskip summary, RECAP, save slots). Local play: `play` skill + `npm run turn`.
- Done: ch. 10, 12b, 13, 13b, 13c, numbers sheet v0.2. `docs/WORLD_ATLAS.md` v0.3 ✅ approved.
- Done (Oct 5): full read + fact check of all files; consistency fixes applied; duel balance fix and army delegation rule approved (numbers sheet v0.3). **Design complete → build stage 1.**
- Decided: crossbows exist (Tatara, the Smiths' Kingdom). The two giants stay close in size and both are internally divided.

Big worldbuilding round:
1. The 7 kingdoms (names, map, rulers, size, cultures, relations).
2. Families per kingdom, branches, key characters.
3. Imperial bloodline and the Imperial treasures.
4. Li's background (ch. 10): based on the old 1540 backstory (Twin Demon father), checked and fixed for the new world; Li starts as a slave.
   - Decided: **option C** – Li alone was captured and sold as a boy, separated from mother and sisters (finding them is a later goal).
   - Decided: **Li was young** when his father died, so he barely remembers him.
   - Decided: family names stay (mother Yuki, sisters Mei & Kenjiko); the warrior girl and the rival recruit get new names.
   - Decided: old real-world names (Imagawa, Anegakoji, Shiina, Takeda, Kawanakajima) get invented names.
   - Decided: Li starts at **age 12**.
   - Decided: the **Suiren (Southern Giant)** kingdom murdered Li's father.
   - Decided: Li starts as the slave of a famous rōnin's mercenary band in the Kurogane (Iron West) (World Bible ch. 13).
- Decided: **no firearms** in this world.
Then: numbers sheet → build stage 1.

## Open issues
- Old Google key: blanked in `legacy/server.ts` and **revoked by the owner (Oct 5)**; it remains in `main`'s first commit (harmless now).
- Old app code (`src/`, `server.ts`) predates the World Bible and will be rebuilt.

## Source material (owner's uploads, not in repo)
Old chats and docs: ARC 1/2 (old slave "Ali" story), ARC 1 manhwa + Li Hattori summary (1540 Twin Demon story), complete 1540 simulation doc, tracking systems, master tracking PDF v3, Simulatie systeem/ChatGPT docs, Black Clover / Bleach / Solo Leveling / Naruto chats.
