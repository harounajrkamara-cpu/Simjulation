# Project status

## ▶ Start the next session with this (copy-paste)
> Continue building Sengoku Soldier in the Simjulation repo on branch **`build/stage-1`** (push there; never to main; no PRs).
> Read `CLAUDE.md`, `docs/STATUS.md`, `docs/MASTER_BUILD_PROMPT.md` and `docs/BUILD_PLAN.md` first, then only the chapters the milestone names.
> **Owner decision Oct 7: Claude is the Game Master** (the fixed chronicle felt like a menu game). **Oct 9–10: the owner's vision is in `docs/VISIE.md`** (📝 proposal until his playtest; read it). The owner wants the work done **without subagents** (Oct 10: "remove all the agents and do the work yourself").
> Local clone: `C:\Users\harou\Simjulation` (Windows; `git config core.longpaths true`). Verify with `npm test`, `npm run typecheck`; check the page in the browser (`npx vite web --port 5173`, laptop first, the owner said phone is not needed for now). Publish with `node scripts/build-artifact.mjs` and republish `dist-web/sengoku-soldier.html` to https://claude.ai/artifact/AcDN6DV8D9SC5dBJybhcdx (capabilities `sample` + `downloads`). Update STATUS and BUILD_PLAN at the end.

**Where things are (Oct 10, late):** VISIE waves 1–3 built and published (page version 15), 284 tests. Wave 1:
- **Game Master brain** (`ai/gm.ts`, `engine/gm.ts`): (brackets) = story wishes, never rules (refusals in "gmNote") · five **long goals** with derived status (chances keep coming, nothing forced; Zone only at a true near-death moment; the name only when the player writes it; an early family *lead*) · **chained Skip ahead** (`gmSkip`, within the day cap, stops at anything important) · **Something's wrong** (`gmFix` → corrections through the referee, Ironman kept; bug rewinds max 3 scenes, never across a fight, always logged) · CORRECTIONS and referee cuts in Claude's memory. Fixed: reading the GM memory no longer changes a fresh game's state (saves failed their own check).
- **Opening** (`engine/content.ts`, `engine/prologue.ts`): a ten-slide film (the Twin Demon only as the world tells it; open question below) → the playable night of Year 95, Month 8 (five choices, canon outcome, first journal lines) → Five years later.
- **Map**: two views, Li's eyes and the world (public facts only, `engine/world-public.ts`).
- **Web**: Skip ahead and Something's wrong buttons (GM mode with Claude), the GM's note under a scene, Download save.
- **Sources**: the owner's old stories in `docs/sources/` (per world, originals + text, index).
- **Waves 2–3, built the same day (Oct 10, page version 15, 284 tests), each with tests and the browser checked where it shows:**
  - **Fact-check before a scene is shown** (`engine/factcheck.ts`): the dead stay silent, known names spelled right, Li's age, rank and freedom right, no game words or "you"; one rewrite, never a loop.
  - **Growing panel + progress chips** ("↗ VAL 62% to 15"): growth visible every turn without fake numbers.
  - **Chapter recaps** (`engine/recaps.ts`, every 20 scenes, written once) — Claude sees every chapter + all later scenes. **Model mix**: the strongest tier for the opening, fight/battle aftermaths, wishes and long moves; default otherwise.
  - **Ranks, merit, promotion** (`engine/career.ts` reviewed + `engine/gm-career.ts`): deeds with witnesses, promotions only when a post opens, the barrier shown with reasons, serving another kingdom; **reward ceremonies** (0.1 ryō per merit, fill posts) and **titles**.
  - **Life stages** (`engine/stages.ts`): slave · soldier · officer · general; longest skip a month · a season · a year.
  - **Battles** (`engine/battle.ts` + `engine/gm-battle.ts`): sectors, phases, morale, routs, pursuit, collapsing flanks, reports by rank; Li commands only his unit; Claude sets the field and tells the aftermath; command merit at the end. Balance in `scripts/battle-sim.ts`.
  - **Land** (`engine/domain.ts` reviewed + `engine/gm-domain.ts`): grants from Sanbyakunin-shō up (sized by rank), projects, big orders; the land runs itself every month (harvest, tax day, wages, desertion).
  - **Everyone grows** (`engine/growth.ts`): seasonal growth by each person's life, VAL decline with age, Claude-proposed growth and new roles.
  - **Account saves** (`web/cloud-save.ts`): owner-only `saves/life<n>` in the page's db (chunked, head written last); continues a longer life from another device. Claude can read it with ArtifactData (checked: access works, empty until the first save).
- **Films (Oct 10, version 16):** the seven anime films of `docs/FILMS.md` play on their game events (opening before the playable night, first battle, Zone, the name, promotion, death, chapter end), with synthesized sound and a mute toggle. **Escape** in Game Master mode now only in winter quarters and with the skill bar (Phase 2 #1).
- **Not built yet:** the rest of the Phase 2 decisions in VISIE ( more ways to earn, officers when battles offer them, a Tatara start for a runaway); the career-pace report (`scripts/career-visie.ts` is an unreviewed draft); world facts per stage for Claude beyond the Atlas text already in the memory.
- **Owner questions:** the battle stall drain is −3 per phase (sheet: −5) so equal armies pull back at night instead of breaking together; `engine/domain.ts` PROVISIONAL numbers (loyalty, famine, project costs) are not on the Numbers Sheet yet.
- **Open question for the owner:** the film's last slides (the Twin Demon falls · Year 95 Month 8, a boy in the snow) let the player guess the boy is his son. VISIE said "legend, not the truth". Keep the hint, or cut the boy slide?

**Before (Oct 7):** Game Master mode v1 (177 tests). Before that, Oct 6: code + newest docs on `build/stage-1`: V1–V6 done, Phase 2 row fully built (content = proposal), 168 tests. Design history on `design/world-bible`. `main` = old prototype. Plugins are enabled in `.claude/settings.json`; the playwright plugin needs Google Chrome (missing in cloud), so use `npm run ui:check` (playwright-core + /opt/pw-browsers Chromium). Owner feedback so far: loves the war chronicle; story and choices scroll as one column (fixed Oct 6).


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
- **Building, branch `build/stage-1`:** V1–V6 ✅ (vertical slice) · Phase 2 ✅ complete as a 📝 proposal (Oct 6 evening: officers at the ford, yearly contract, money, escape to Tatara, beats between raids; 163 tests). **NEXT:** owner playtest + answers to the V6 balance question and the five Phase 2 questions (BUILD_PLAN), then Stage 2 design. (Phase 2 row fully built Oct 6 night: timeskip summary, Journal arcs + trophies, three save slots; 168 tests.) Local play: `play` skill + `npm run turn`.
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

- **Narrator (Oct 10):** the story can be read aloud (header button "Narrator"). Default voice is **George**: the Kokoro-82M AI voice (`bm_george`) running on the graphics card (WebGPU) in a worker (`web/voice-ai.ts`). The first use downloads ~330 MB once. Without WebGPU, or if the page blocks it, the browser voice reads and the panel says why. Films use pre-rendered George lines (`web/films/voice-lines.ts`). Works in the local dev page; **still to check on the claude.ai page** (the owner presses Test there).

## Open issues
- Security tradeoff (accepted for now): George's code is loaded at runtime from jsdelivr (`kokoro-js@1.2.1`, pinned) and the model from Hugging Face. Safer later: bundle kokoro-js into the build and pin the model revision.
- Old Google key: blanked in `legacy/server.ts` and **revoked by the owner (Oct 5)**; it remains in `main`'s first commit (harmless now).
- Old app code (`src/`, `server.ts`) predates the World Bible and will be rebuilt.

## Source material (owner's uploads, not in repo)
Old chats and docs: ARC 1/2 (old slave "Ali" story), ARC 1 manhwa + Li Hattori summary (1540 Twin Demon story), complete 1540 simulation doc, tracking systems, master tracking PDF v3, Simulatie systeem/ChatGPT docs, Black Clover / Bleach / Solo Leveling / Naruto chats.

## Plan for the next session (Oct 11, to discuss with the owner first)
1. Owner's phone playtest feedback → fix what he found.
2. Phone layout: the page was made for PC (one breakpoint at 1180px); make it work at phone width (header, tabs, story padding, side panel under the story).
3. Four small fixes from the Hermes bot test: "Talk to whom?" lists known people as numbers; "Skip 7 days" as a numbered option; a clear "FREE" line when Li is free; a freedom-progress line once Li knows his price. No numbers change.
4. George on the claude.ai page: read the status line; if blocked, bundle kokoro-js into the page.
5. AI players: `npm run ai-players` (scripts/ai-players.ts) lets 2 free models play via OmniRoute and write a review to saves/ai-players/. Needs OMNIROUTE_URL / OMNIROUTE_KEY / AI_MODELS in .env (owner sets the key; never in chat).
Note: someone ran npm install for Linux in this folder (esbuild broke); fixed with `npm install` on Windows. Hermes left loose simulate*.js/.cjs/.ts files in the root (uncommitted).
