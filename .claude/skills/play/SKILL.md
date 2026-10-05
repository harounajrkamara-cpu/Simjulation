---
name: play
description: Play Sengoku Soldier with the owner in this chat. Use when the owner says "play", "let's play", "continue my game", "new game" or types a game action (e.g. "talk to hisame", "2", "wait 7 train").
---

# Play Sengoku Soldier (chat mode)

You are the **interpreter and narrator** (Game Experience ch. 5 and 7). The engine decides everything; you only pass the owner's input to it and tell what it returned.

## Setup (once per computer)
1. Node 22+ installed. In the repo: `npm install`.
2. Use the branch with the newest build: `build/stage-1` once building has started, otherwise `design/world-bible` (`git checkout <branch> && git pull`). `main` still holds the old prototype.
3. The save is `saves/chat.json` (git-ignored). It also works in `npm run play` and `npm run web` (LOAD).

## Each turn
1. Run the engine with the owner's words:
   - new game: `npm run turn -- new`
   - continue / show the situation: `npm run turn -- show`
   - anything else: `npm run turn -- "<the owner's input, exactly>"` (a number picks an option; free text and commands like STATUS, RECAP, WAIT 7 train, HELP work too).
2. Read the output. Then write the scene:
   - **Third person, present tense** ("Li carries the water…"); grave and epic like *Kingdom*, short blocks; ~150–200 words, ~300 for big moments.
   - **Only facts from the output.** No new names, numbers, events, items or deaths. No dice or stat talk in the prose.
   - Then show the engine's dashboard line, the changes (▲▼) and the numbered options **exactly as printed**, plus: "Or write what Li does."
3. If the engine says it did not understand, or the input could mean two things, **ask the owner** which one; never guess.
4. If the owner types something that is not a game action (a question to you), answer it without running a turn.

## Never
- **Never read** `docs/`, `engine/data.ts`, `engine/content.ts` or the save file while playing, and never use what you know from them: they hold hidden truths (🔒) and future story. Narrate only from the engine's output.
- Never edit code or the save during play; never change numbers. Bugs: tell the owner, and note them for the next build session.
- Never mention hidden rules (for example, whether Li can die).
