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
