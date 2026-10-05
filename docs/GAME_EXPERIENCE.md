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

## Owner answers (Oct 5, round 2)
- Main screen: **War chronicle** – a wide story page with tabs on top (Story · Map · Li · Army · People · Journal).
- Mood: **Night war scroll** – dark ink background, gold and steel accents, banners glowing like fire.
- Big battles: **battle map + story** – top-down map with unit blocks, banners and arrows (like Kingdom's battle diagrams) plus the story of Li's own unit.
- Cool details: **all of it** – big ceremonies, title cards, moving army map, banners & crests, troop roster. "Look at Bannerlord, Three Kingdoms, Nobunaga, Crusader Kings, the Dynasty games and how they do it."

### Research: how those games make it feel big
| Game | What they do | What we take |
|---|---|---|
| *Total War: Three Kingdoms* | character-first UI; big character portraits on **animated black ink**; unit cards in smoke; the five elements tied into the look | ink-wash **character cards** and unit cards; each kingdom's colour and crest everywhere |
| *Crusader Kings III* | every event in an **illustrated event window** with characters placed on a scene backdrop; **coronation ceremonies** where vassals gather and witness | **event windows** with drawn scene headers; **ceremonies** (reward ceremony, genpuku at 15, freedom, promotion) as their own screens with witnesses and their reactions |
| *Nobunaga's Ambition: Awakening* | Japanese-styled UI; cutscenes as **slide-by-slide narrated stills**; officers and council matter; map-centred | the **prologue and big moments as narrated slides**; council/court screens later |
| *Bannerlord* | campaign map with moving parties; **notifications** on the map side that open the right screen; **party screen** (troops, upgrades), **clan screen**, **encyclopedia** of everyone | notification feed; troop **roster**; clan screen later; an **encyclopedia** of every person, family and kingdom Li knows |
Sources: [TW wiki – UI](https://totalwar.fandom.com/wiki/User_interface), [CK3 Dev Diary #97](https://forum.paradoxplaza.com/forum/developer-diary/ck3-dev-diary-97-event-illustration-showcase-and-workflow.1524206/), [CK3 Coronations](https://ck3.paradoxwikis.com/Coronations), [Nobunaga Awakening review](https://www.mkaugaming.com/all-review-list/nobunagas-ambition-awakening-review/), [Bannerlord update notes](https://fextralife.com/bannerlord-update-unveils-ui-multiplayer-celebration-clans-and-more/).

## Chapter 3 – Screens & flow 📝
```
TITLE SCREEN ──► New game ──► PROLOGUE (narrated ink slides + map reveal) ──► CHAPTER CARD ──► GAME
     │                                                                          ▲
     └──► Continue ─────────────────────────────────────────────────────────────┘
GAME = War chronicle with tabs:  Story · Map · Li · Army · People · Journal · Encyclopedia
Overlays (take the whole screen for a moment):  Event window · Title card · Ceremony · Duel · Battle · Timeskip summary
```
| Screen | What it shows | Unlocks |
|---|---|---|
| **Title** | big title on a night ink scroll, slow drifting smoke/embers; Continue · New game · How to play · Load save | always |
| **Prologue** | 6–8 narrated slides: the Amatsu Empire → the Burning → the 7 kingdoms lighting up on the map → Li's memory fragments → "Year 100. Kōri fort." Skippable | new game |
| **Story** (main tab) | chapter heading, the scene text, choices + free text, a slim status strip (date, place, wounds, money) and a notification feed on the side | always |
| **Map** | the land drawn as an ink map; kingdoms in their colours and crests; Li's position; armies moving (later); fog of war: only what Li knows | always (mostly fogged at start) |
| **Li** | character card: portrait-crest, rank F–S, stats, styles, skills, wounds, abilities, goals, trophies | always |
| **Army** | Bannerlord-style roster: men by name/type, morale, wounds; as a slave it shows the Red Crane band from the outside | full once Li leads men |
| **People** | character cards of everyone Li knows: crest, rank estimate, opinion label, what Li knows about them | always |
| **Journal** | Li's RECAP journal by chapter; trophies | always |
| **Encyclopedia** | kingdoms, families, places, legends – only what Li has learned | grows with knowledge |
| **Event window** | important events: drawn scene header + characters + text + choices | story events |
| **Title card** | full-screen moment: "CHAPTER 2 — THE NIGHT OF FIRE", "SHINKEN NO RYŪ", "PROMOTED: GOCHŌ (5)" | big moments |
| **Ceremony** | reward ceremony in rank order, genpuku, freedom, promotion: who stands where, who reacts how | when they happen |
| **Duel** | two character cards facing each other, wound tracks, the four moves, what Li has read | duels |
| **Battle** | battle map with unit blocks, banners and arrows per phase + the story of Li's unit + reports with age/confidence | stage 2 |
| **Timeskip summary** | what happened to Li, his people and the world, with changes | after WAIT |
