# Build Plan – Stage 1 (✅ approved · in progress)

Goal of stage 1: **Li as a slave in the Red Crane band is fully playable** – daily life, people who remember, training, one real duel – with the engine deciding everything and the AI only narrating (World Bible ch. 11, 12, 12b).

## Tech choices
- **TypeScript** on Node 22, a fresh project (owner: "build a new one"). Browser UI = Vite + plain TypeScript; terminal and chat runners use tsx.
- **Engine = a pure TypeScript library** in `engine/` with no UI and no AI inside it. Same state + same action = same result (ch. 12b). Tested with **Vitest**.
- **AI layer** behind one interface (`narrate`, `parseIntent`). Claude first; adapters for Gemini, DeepSeek, Ollama and OmniRoute later (owner's plan). A **no-AI mode** with simple template text, so the game runs and is testable without any key.
- **Saves** = the append-only event log + world number, stored as JSON (ch. 11, event sourcing).
- The old prototype code (`src/`, `server.ts`, `gameEngine.ts`) moves to `legacy/`; the hardcoded Google key is removed (owner must revoke it first).

## Milestones
| # | Milestone | Done when |
|---|---|---|
| M0 | Clean-up | old code in `legacy/`, key removed, Vitest runs, folder structure in place |
| M1 | Engine core | state, calendar (ch. 9), world number, `resolve(state, action) → events`, event log, save/load, replay test (same input → same hash) |
| M2 | Start data | Li, Raizen's band, Hachi, Sukezō, Gonza, Hisame, Hagiwara family, Akaishi / Kōri fort / Sasabe as data files from the Atlas; hidden truths flagged 🔒 |
| M3 | Turn loop (no AI) | numbered options + free-text commands, actions (work, train, talk, observe, rest, sneak, help someone), time passing, short + full dashboard, alerts, commands STATUS / INFOCHAR / RECAP / RELATIONS / LOG / SAVE / LOAD |
| M4 | People & memory | 5 relationship values, opinion, loyalty vs obedience, memories with source and certainty, decay classes, rumours (fixed rules), visible consequences (ch. 12b #11) |
| M5 | Growth & duel | training and growth (Numbers §2, caps), duel engine (Numbers §4, v0.3), wound track, defeat ladder, one scripted-free duel situation (e.g. Gonza, or a night raid) |
| M6 | AI layer | intent parser (structured output, asks when unsure), narrator using only given facts, fact check on the narration, REWRITE / CORRECT |
| M7 | Tests & playtest | Monte Carlo duel tests (upset rates), first-year growth pace, determinism tests; owner plays the first weeks of Year 100 and gives feedback |

Stage 1 is finished when the owner can play from Year 100, Month 1 for at least a few in-game months, and can always see **why** something happened.

## Progress
- ✅ M0 clean-up (old code in `legacy/`, key line blanked, Vitest)
- ✅ M1 engine core (calendar, event log, resolve/apply, saves with replay check)
- ✅ M2 start data (Li, the band, Sasabe youths, Sayo, Ishizue; Kōri camp)
- ✅ M3 turn loop (options, free text, WAIT, dashboard, commands) — terminal, chat and browser modes
- 🟡 M4 people & memory: relationships, opinion, decay, beats, memories done; rumour spreading between NPCs next
- ✅ M5 training & growth, **duel engine** (4 moves, clash table, capped bonuses, learning opponent, simulate/run/yield, defeat ladder) and the Sasabe raid (Month 2, Day 6)
- ✅ Online version published as a claude.ai page
- ⏳ M6 AI narrator · ⏳ M7 Monte Carlo tests & playtest

## Not in stage 1 (later stages)
Battles and units, promotions (stage 2) · land and economy (stage 3) · kingdoms, factions, fuses (stage 4). The world data exists already; those systems are simply not switched on yet (ch. 12 "systems unlock with Li's life").
