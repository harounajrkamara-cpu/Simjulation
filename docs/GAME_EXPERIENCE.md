# Game Experience Bible – Sengoku Soldier (v0.1, 📝 in progress)

The World Bible says **what** exists. This file says **how the game looks, feels and plays**, and how the simulation and the story are fused.
Same process as the World Bible: propose → research → owner approves → write → build. Ends with a master build prompt and build plan (ch. 10).

Status per chapter: ✅ approved · 📝 proposal · ⏳ not started

| # | Chapter | Status |
|---|---|---|
| 1 | Vision & feel | ✅ |
| 2 | Platform & format | ✅ |
| 3 | Screens & flow | ⏳ |
| 4 | Core loop | ⏳ |
| 5 | Simulation + story fused | ⏳ |
| 6 | Look & style | ⏳ |
| 7 | AI narrator | ⏳ |
| 8 | Onboarding | ⏳ |
| 9 | Pacing | ⏳ |
| 10 | Master build prompt + build plan | ⏳ |

---

## Owner answers (Oct 5, round 1)
- Plays **mostly on PC**.
- Look: **text + drawn visuals** (map, character cards, ink-style art, all drawn by code; no paid art tools).
- Loved most in the old simulations: **epic scenes** and **freedom of choice** (typing anything and the world reacting).
- Turn feel: **mixed by moment** – short for daily life, long and epic for big moments.

## Chapter 1 – Vision & feel ✅
**One sentence:** *You are a nameless slave boy in a burning age; every choice you type is answered by a world that remembers, and the road to great general is yours to walk or lose.*

**Three feelings the game must give (player experience goals):**
1. **Epic weight** – big moments land like a manhwa chapter climax: raids, duels, speeches, reveals. The screen changes for them.
2. **Real freedom** – you can type anything; the world answers sensibly and remembers. Numbered choices exist for speed, never as a cage.
3. **Earned rise** – every step up (freedom, first command, first land) is felt, because the start is hard and the world is fair (no dice).

**What it must never feel like:** a spreadsheet, a quiz with four buttons, a chatbot that agrees with everything.

**Main reference (owner, Oct 5): *Mount & Blade II: Bannerlord* (with mods) × *Kingdom*.**
- From **Bannerlord**: start from nothing and grow into everything – your own party, then your own army, clan, land, kingdom politics; a campaign map where armies move; a troop roster; a world that goes on without you.
- From **Kingdom**: the scale – battles with **thousands to hundreds of thousands** of soldiers; Shin's rise from a slave boy to the commander of his own famous unit and army; great generals with legendary auras; battle maps with formations and arrows.
- Other references: *Disco Elysium* (free, rich text, a world that judges you) · *80 Days* / *Pentiment* (beautiful drawn text-game presentation) · *Crusader Kings* (living world, people with memory).
- **Honest limit:** Bannerlord is a 3D real-time game. We build its *structure and feeling* (campaign map, roster, army, clan, battles of huge size) as a browser game with drawn 2D visuals and text, not 3D action.

## Chapter 2 – Platform & format ✅
- **PC first** (browser), wide layout: story in the centre, a side panel with Li, people and the map. Phone works, simplified to one column.
- **Text + code-drawn visuals**: map, crests, character cards, ink-wash scene headers, system windows for big moments.
- **Freedom of choice requires the AI layer**: the AI reads typed actions (structured, asks when unclear) and the AI narrator writes the scenes. Without it, free text stays limited. → AI narrator moves from "later" to **core**.
- **Text length mixed by moment** (ch. 11 of the World Bible: ~150–200 words normally, ~300+ for epic moments), with a "Continue" beat between long parts.
- Sound: ⏳ later (optional ambient + a few effects).
