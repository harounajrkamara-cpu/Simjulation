# Night log (Oct 16–17): Claude builds on its own, owner asleep

Owner's permission (Oct 16, /loop): build on `build/stage-1`; new features allowed if they fit the World Bible and the end goal; each new feature its own commit; each design choice in the World Bible marked "(nacht Oct 16, owner kan terugdraaien)"; tests, typecheck and balance green before every commit; never main; PR #5 not merged.

## 1. Why the opening was refused live: FOUND and FIXED (page v37)
- **Live testing was not possible:** the built-in browser is not signed in to claude.ai, and Claude may not sign in for the owner. No API key in the repo either.
- **What I did instead:** dumped the exact prompt the page sends for the opening (26 KB) and answered it the way Claude answers it, then ran the answers through the real `gmTurn`.
- **The cause:** Claude titles the opening scene **"Who Taught You"** (Raizen's canon line). The checks read the title together with the scene, and the rule "no *you* outside dialogue" counted the title as story text. The one rewrite kept the title, so the scene was thrown away. Every opening, every time.
- **The fix:** the title is checked like a quoted line (names and the dead still count, "you" does not). Also: dialogue in single curly quotes ‘…’ and thoughts in *italics* count as quoted, so "you" there no longer refuses a scene.
- **Tests:** `tests/opening-live.test.ts` (3 openings written the way Claude writes them + quote rules). 350 tests.
- **Lesson kept in memory:** before shipping a refusal rule, check the GM prompt for what it asks Claude to write, and run Claude-style openings.

## 2. The first stretch, played offline (live play was not possible: no claude.ai sign-in)
- Played the opening and five turns through the real Game Master flow with scenes written the way Claude writes them (a lie to Raizen, quiet work, the soldiers' fire with Gonza's coins, waiting twice). **No false refusals.** The waiting rule fired on the second "I wait", as designed; the Gonza threat showed up under "stories in motion".
- **Bug found and fixed:** the "already said" list told Claude to avoid "the horse lines" (a place, not a tic), and phrases ran across sentences. Places are now cut out before counting, and phrases stay within one sentence. Test added (351 tests).
- **Not measurable offline:** the Game Experience Bible targets (first real choice within 2 minutes; a spark about every 10 minutes). Offline, the opening ends on Raizen's question with 2–4 choices, so the first choice comes in the first scene. The spark rhythm needs the owner's real play.

## 3. Li's plan: BUILT (page v38)
- Li tab: "Li's plan" with five ambitions from the freedom routes (earn freedom in service · an enemy officer's head · win Raizen over · buy freedom · escape to Tatara). Choosing one is an event (journal line), and the steps come straight from the referee's own numbers (`engine/plan.ts`, same rules as `freedomCheck`). Claude's memory gets the plan, its steps and the next step to build chances toward. Nothing is granted by the plan itself.
- Checked in the browser: the five buttons, choosing "Escape" shows stealth 15 of 25, endurance 25 of 40, fit ✓, winter quarters ○.
- Canon: World Bible ch. 11 "(nacht Oct 16, owner kan terugdraaien)". Tests: `tests/plan.test.ts`. To undo: revert the commit "Li's plan".
- Later idea (not built): plans beyond freedom (family lead, first battle, a rank) once Li is free.
