# Instructions for Claude in this repo

This repo holds **Sengoku Soldier**, a deterministic text simulation (slave → great general) in a fictional Sengoku-inspired world, designed together with the owner (Harouna).

## Read first, every session
1. `docs/STATUS.md` – where we are, decisions, next step.
2. `docs/WORLD_BIBLE.md` – the canon design. **The World Bible wins over memory, chat history and old documents.**

## Working rules
- Design goes chapter by chapter: propose → research (games, professionals) → owner approves → write to the World Bible → commit and push.
- Before proposing anything, re-read the relevant World Bible chapters and check for contradictions with every other chapter.
- Be honest: say clearly when an idea of the owner is not the best, with reasons and sources. Do not just agree.
- Core principles: code owns numbers, the AI only narrates; deterministic (no dice); the world runs on hidden causes; Li cannot die (hidden rule).
- Build in stages; each stage must be playable before the next starts.
- Never commit secrets. `server.ts` still contains a hardcoded Google API key from the original AI Studio export: the owner must revoke it, and it must be removed when building starts.
- Update `docs/STATUS.md` at the end of every work session.
