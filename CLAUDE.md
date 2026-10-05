# Instructions for Claude in this repo

This repo holds **Sengoku Soldier**, a deterministic text simulation (slave → great general) in a fictional Sengoku-inspired world, designed together with the owner (Harouna).

## Playing the game (not building)
If the owner wants to **play** ("let's play", a game action), use the `play` skill and **do not read `docs/` or the engine's data files**: they hold hidden truths and future story. Narrate only from the engine's output.

## Read first, every design or build session
1. `docs/STATUS.md` – where we are, decisions, next step.
2. `docs/WORLD_BIBLE.md` – the canon design. **The World Bible wins over memory, chat history and old documents.**
3. Canon order (higher wins): World Bible → `WORLD_ATLAS.md` → `NUMBERS_SHEET.md` → `GAME_EXPERIENCE.md` → `BUILD_PLAN.md` → `STATUS.md`. All beat memory and chat history.
4. **Build sessions** start from `docs/MASTER_BUILD_PROMPT.md`.

## Working rules
- Design goes chapter by chapter: propose → research (games, professionals) → owner approves → write to the World Bible → commit and push.
- Before proposing anything, re-read the relevant World Bible chapters and check for contradictions with every other chapter.
- Be honest: say clearly when an idea of the owner is not the best, with reasons and sources. Do not just agree.
- Core principles: code owns numbers, the AI only narrates; deterministic (no dice); the world runs on hidden causes; Li cannot die (hidden rule).
- Build in stages; each stage must be playable before the next starts.
- Never commit secrets (keys only in `.env`, git-ignored). The old Google key from the AI Studio export was blanked in `legacy/server.ts` and **revoked by the owner (Oct 5)**; it still exists in `main`'s first commit, which is harmless now. Never restore anything from `legacy/server.ts`.
- Update `docs/STATUS.md` at the end of every work session.
