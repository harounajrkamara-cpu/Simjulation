# Sengoku Soldier

A deterministic text simulation: **Li Hattori**, a 12-year-old slave in a mercenary band, rises (maybe) to great general in a fictional Sengoku-inspired world.
The engine decides everything (no dice); the narrator only tells what happened. Design: `docs/` (start with `docs/STATUS.md`).

## Play

```bash
npm install
```

**Online** (no install): https://claude.ai/artifact/AcDN6DV8D9SC5dBJybhcdx (rebuild with `node scripts/build-artifact.mjs`).

**In the browser** (buttons, journal, save file copy/paste):
```bash
npm run web        # open the address it prints, e.g. http://localhost:5173
```

**In the terminal**:
```bash
npm run play       # autosaves to saves/autosave.json
```

**With Claude on your own computer** (Claude Code, terminal or the desktop app's Code tab): open this repo on the newest build branch (`build/stage-1` once it exists, else `design/world-bible`), run `npm install`, then just say **"let's play"**. The `play` skill (`.claude/skills/play/SKILL.md`) runs the engine for each of your inputs and narrates only what the engine returns.

**In a chat with Claude** (one input per call):
```bash
npm run turn -- new          # new game
npm run turn -- 2            # choose option 2
npm run turn -- "talk to hisame"
npm run turn -- "wait 7 train"
```

Commands: `STATUS` · `INFOCHAR <name>` · `RELATIONS` · `RECAP` · `LOG` · `WAIT <days> [train]` · `SAVE` · `LOAD` · `HELP`.
Saves are the event log, so a save works in every mode.

## Develop

```bash
npm test           # determinism, replay, rules
npm run typecheck
```

`engine/` is pure TypeScript with no UI and no AI inside. `legacy/` holds the old AI Studio prototype (not used).
