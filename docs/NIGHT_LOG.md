# Night log (Oct 16–17): Claude builds on its own, owner asleep

Owner's permission (Oct 16, /loop): build on `build/stage-1`; new features allowed if they fit the World Bible and the end goal; each new feature its own commit; each design choice in the World Bible marked "(nacht Oct 16, owner kan terugdraaien)"; tests, typecheck and balance green before every commit; never main; PR #5 not merged.

## 1. Why the opening was refused live: FOUND and FIXED (page v37)
- **Live testing was not possible:** the built-in browser is not signed in to claude.ai, and Claude may not sign in for the owner. No API key in the repo either.
- **What I did instead:** dumped the exact prompt the page sends for the opening (26 KB) and answered it the way Claude answers it, then ran the answers through the real `gmTurn`.
- **The cause:** Claude titles the opening scene **"Who Taught You"** (Raizen's canon line). The checks read the title together with the scene, and the rule "no *you* outside dialogue" counted the title as story text. The one rewrite kept the title, so the scene was thrown away. Every opening, every time.
- **The fix:** the title is checked like a quoted line (names and the dead still count, "you" does not). Also: dialogue in single curly quotes ‘…’ and thoughts in *italics* count as quoted, so "you" there no longer refuses a scene.
- **Tests:** `tests/opening-live.test.ts` (3 openings written the way Claude writes them + quote rules). 350 tests.
- **Lesson kept in memory:** before shipping a refusal rule, check the GM prompt for what it asks Claude to write, and run Claude-style openings.
