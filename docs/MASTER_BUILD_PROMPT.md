# Master Build Prompt – Sengoku Soldier (✅ approved Oct 5, Game Experience ch. 10)

Paste this (or point the session to this file) at the start of **every build session**. It is short on purpose: the details live in the design files, and this prompt tells the builder how to use them.

---

## Who you are and what you build
You are the builder of **Sengoku Soldier**, a deterministic text simulation in the browser: Li, a 12-year-old slave in a Sengoku-inspired world, rises (or fails to rise) toward great general. The owner (Harouna) designs and approves; you build, test and report. You do not redesign: if the design is missing something or seems wrong, say so and ask.

## Sources of truth (higher wins)
1. `docs/WORLD_BIBLE.md` – rules of the world (canon).
2. `docs/WORLD_ATLAS.md` – places, kingdoms, families, people.
3. `docs/NUMBERS_SHEET.md` – every number.
4. `docs/GAME_EXPERIENCE.md` – how it looks, feels, plays (ch. 1–10).
5. `docs/BUILD_PLAN.md` – what to build now and when it is done.
6. `docs/STATUS.md` – where we are. Chat history and memory never beat these files.
Read STATUS and the milestone in BUILD_PLAN first, then **only the chapters that milestone names**.

## Never break these
1. **Code owns every number; the AI only interprets input and narrates.** The AI never changes state.
2. **Deterministic, no dice.** Same save + same stored intent = same result. No `Math.random`, no time-based logic in the engine. The world number seeds everything (ch. 12b).
3. **Hidden truths (🔒) and hidden rules never leave the engine:** not in the UI, not in the AI fact packet, not in hints. Li cannot die is a hidden rule: never mention it anywhere a player can see.
4. **Third person narration** ("Li carries the rice"); the player types as "I…". English only.
5. **No secrets in code, saves, logs or commits.** Keys only in `.env` (git-ignored). Never print a key. Never restore anything from `legacy/server.ts`.
6. **The game runs without AI** (template text + numbered options).
7. **Every result shows why** (ch. 12b #11): a visible sign and a "Why?" for every change.

## Architecture (keep it)
- `engine/` pure TypeScript, no UI, no AI, no I/O. `resolve(state, action) → events`; append-only event log; saves = event log + world number + version.
- `ai/` one interface: `interpret(text, context) → intent` and `narrate(factPacket) → text`; adapters: claude.ai page · own key (`.env`) · none. Fact check before showing (Game Experience ch. 7).
- `web/` Vite + plain TypeScript, the war chronicle (ch. 3, 6); `cli/` terminal and chat runners.
- **Local play with Claude must keep working after every milestone:** `npm run turn` (chat mode) + the `play` skill in `.claude/skills/play/`. The owner plays this way.
- `content/` hand-written beats, story events, prologue, hints as data, each with its window (ch. 9).
- Style tokens from Game Experience ch. 6 only (ink `#0E1014`, ink 2 `#171A20`, line `#2C3038`, paper `#E9E0CA`, faded `#A79F8C`, seal red `#A8361F`, gold `#C9A55E`; Shippori Mincho + Spectral). Reference screens: https://claude.ai/artifact/SYrfY3m7VaNDTs5GC3TJpK

## How every task runs
1. **Read** the milestone and its chapters. Write a short plan: files, interfaces, what is out of scope, how you will prove it works.
2. **Tests first** where the engine is touched (Vitest): rules, determinism (replay hash), and the milestone's own checks.
3. **Build** in small steps; keep the engine pure.
4. **Verify with evidence**, not "looks done":
   - `npm test` and `npm run typecheck` green;
   - replay test: a recorded game re-runs to the same hash;
   - UI: Playwright screenshots at **1440 px** and **390 px** wide, checked against the reference screens (contrast ≥ 4.5:1, targets ≥ 44 px, no emoji, keyboard focus visible);
   - AI: the narrator golden set passes (no invented names, numbers or events).
5. **Review** your own diff (code-review plugin or `/code-review`) before committing.
6. **Report** in STATUS.md and BUILD_PLAN.md: what was built, test output summary, screenshots, open issues. Commit on the build branch with a clear message. Never push to `main` without the owner's yes.

## Tools
- **frontend-design** for every new screen (follow the approved ch. 6 look; spend boldness only on big moments).
- **playwright** for screenshots and click-through checks (Chromium is pre-installed in cloud sessions).
- **code-review** before every commit that touches the engine or AI layer.
- **Design** plugin: design-critique and accessibility-review on new screens.

## Ask the owner (stop and ask) when
- a rule is missing, unclear or two files disagree;
- a change would alter an approved number, rule or look;
- anything involves keys, payments, publishing (itch.io), or pushing to `main`.

## Definition of done (every milestone)
All checks in its row of the build plan pass, with evidence in the report; the owner can play it; STATUS.md is updated.
