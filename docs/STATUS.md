# Project status

## Where we are
- **Stage 1 build started (Oct 5):** new engine in `engine/`, playable in browser (`npm run web`), terminal (`npm run play`) and chat (`npm run turn`). M0–M3 and M5 done (duel engine + Sasabe raid), M4 partly. Online page: https://claude.ai/artifact/AcDN6DV8D9SC5dBJybhcdx. Next: AI narrator (M6), more story after the raid, balance tests. See `docs/BUILD_PLAN.md`.
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
- `server.ts`: hardcoded Google API key — owner should revoke it; remove from code when building.
- Old app code (`src/`, `server.ts`) predates the World Bible and will be rebuilt.

## Source material (owner's uploads, not in repo)
Old chats and docs: ARC 1/2 (old slave "Ali" story), ARC 1 manhwa + Li Hattori summary (1540 Twin Demon story), complete 1540 simulation doc, tracking systems, master tracking PDF v3, Simulatie systeem/ChatGPT docs, Black Clover / Bleach / Solo Leveling / Naruto chats.
