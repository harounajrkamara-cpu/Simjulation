# Game Experience Bible – Sengoku Soldier (v0.1, 📝 in progress)

The World Bible says **what** exists. This file says **how the game looks, feels and plays**, and how the simulation and the story are fused.
Same process as the World Bible: propose → research → owner approves → write → build. Ends with a master build prompt and build plan (ch. 10).

Status per chapter: ✅ approved · 📝 proposal · ⏳ not started

| # | Chapter | Status |
|---|---|---|
| 1 | Vision & feel | ✅ |
| 2 | Platform & format | ✅ |
| 3 | Screens & flow | ✅ |
| 3b | Big moments | ✅ |
| 4 | Core loop | ✅ |
| 5 | Simulation + story fused | ✅ |
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
- Sound: ⏳ later (optional ambient + a few effects). Owner has set up the free sound sources (Pixabay / Freesound, Oct 5).

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

## Chapter 3 – Screens & flow ✅
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

## Chapter 3b – Big moments ✅
Owner (Oct 5): *every* ceremony and big event must be special; the first time someone calls Li by his nickname and the first time he unlocks his own ability must be "crazy special".

### Research
- *Ghost of Tsushima*: the **standoff** uses a letterbox frame and the samurai-film weight of drawing a blade; every deed spreads **"the Ghost" legend**, so the name itself grows in the world ([Game Developer](https://www.gamedeveloper.com/game-platforms/ghost-of-tsushima-design-analysis), [GamesRadar](https://www.gamesradar.com/ghost-of-tsushima-best-standoffs/)).
- *Crusader Kings III*: **ceremonies with witnesses** (coronations, feasts) – the people present see it, remember it and react.
- *Bannerlord* mods: players asked for **feasts, weddings, funerals and knighting ceremonies** where lords really travel to attend ([Feast and Gatherings](https://www.nexusmods.com/mountandblade2bannerlord/mods/12192), [Vassal Barons](https://www.nexusmods.com/mountandblade2bannerlord/mods/8579)) – proof that ceremonies make a sandbox feel alive.
- Cutscene design: big scenes **reward the player, show the effect of his actions and create emotional connection** ([Game Developer](https://www.gamedeveloper.com/design/better-game-design-through-cutscenes)).

### Four tiers
| Tier | When | How it looks |
|---|---|---|
| **Legend moment** (once in a life) | first time someone calls Li by his **nickname** · first **ability awakening** (SHINKEN NO RYŪ) · freedom · first enemy officer's head · learning his father was **the Twin Demon** · finding his family · genpuku at 15 · first command · first land · a seat among the **Six Pillars** · reaching an **S** rank · facing his father's killers · *(owner ✅ added)* the death of a close friend · first meeting with a living **S-rank** (feeling the aura) · **his own unit's name and banner** (like Shin's Hi Shin unit) · every big **rival encounter** (Akabane Hayame and others) | the full staging recipe below |
| **Ceremony** (recurring, with witnesses) | reward ceremony after a campaign (rank order) · promotion · genpuku · marriage · funerals · feasts · oaths | ceremony screen: who stands where, who is honoured, every witness reacts by their own opinion and remembers it |
| **Title card** | new chapter · rank up · battle begins · season turns · a famous enemy appears | full-screen brush title for 2–3 seconds |
| **Spark** | a relationship turns · a skill unlock · a rumour about Li spreads | a short glowing line in the story and the notification feed |

### Staging recipe for a Legend moment
1. **Silence**: the screen darkens, letterbox bars slide in (Ghost of Tsushima standoff).
2. **Slow text**: the scene appears line by line; the AI narrator writes it long and epic (~300+ words).
3. **The name or word** lands as a **giant gold brush title**: e.g. *"SHINKEN NO RYŪ"*, or the nickname spoken by the person who gives it.
4. **Witnesses**: character cards of everyone present, each with their reaction (from their own opinion and personality).
5. **The world hears**: the deed becomes a rumour with Li's nickname; it spreads to who could hear it (ch. 8).
6. **Legend page**: a permanent page in the Journal ("The Night of Fire – where the boy got his name"), with date, witnesses and the title.

### Nicknames
- Nicknames are **earned by deeds**, decided by the engine from what Li did and who saw it (no dice); the first person to use it in front of others is a witness of the deed.
- Li can be called different things by different groups (soldiers vs nobles vs enemies, ch. 8 reputation).
- **Style (owner ✅):** Japanese name + English meaning, e.g. *"Kurose no Ryū — the Dragon of the Kurose"*.
- **Who decides (owner ✅):** the world decides, from his deeds and the witnesses; the player never picks.

## Chapter 4 – Core loop ✅
What the player does, from one minute to a whole life. Bannerlord's loop (travel → fight → recruit → upgrade → grow) and Kingdom's arc (fight → merit → promotion → bigger battles) are the models.

| Scale | Loop | What keeps it from being boring |
|---|---|---|
| **Turn** (a minute) | read the scene → choose or type → see the result and one visible sign → new situation | every turn shows *why* something happened; free text always possible |
| **Day** | morning & afternoon = duty · evening = people · night = secrets (training, sneaking) | each part offers a real trade-off (safety vs growth vs people) |
| **Season** (3 months) | training caps, campaigns in summer/autumn, politics in winter; ends with a **season title card + summary** | something is always brewing: rumours, rivals, hidden fuses surfacing |
| **Life stage** | slave → soldier → officer → commander → landholder → general → lord of the realm | each stage **unlocks new screens and systems** (ch. 12 World Bible): roster, battle map, domain, court |
| **Life arcs** | freedom · the truth about the father · finding the family · rivals (Akabane Hayame) · the Six Pillars · the fate of the kingdoms | a **Goals panel** with Li's current 3 goals and visible progress |

**Anti-boredom rules**
1. Routine is never played turn by turn: **WAIT / skip** with a plan, stopping when something matters.
2. Every play session reaches at least one **meaningful choice** (the pacing director brings the next one closer).
3. Every big result gets a **moment** (ch. 3b), and every small one a visible sign.
4. The world moves without Li (Bannerlord): news arrives, people change, kingdoms fall.

## Chapter 5 – Simulation + story fused ✅
The heart of "freedom of choice": you can type anything, the world answers fairly, and the numbers never lie.

### Research
- **Hidden Door** (LLM story game, 2025): an engine of human-written, structured story beats that ML recombines with world rules and player choices; the LLM only does what it is good at; player input does not execute directly but is turned into choices first ([PC Gamer](https://www.pcgamer.com/hidden-door-ai-game-narrative-rpg/), [Ian Bicking review](https://ianbicking.org/blog/2025/08/hidden-door-design-review-llm-driven-game.html)).
- **Intent parsing** (Ian Bicking, *Intra*): split free input into **dialogue**, **an action**, or **a direct command**, each with its own pipeline ([Intra design notes](https://ianbicking.org/blog/2025/07/intra-llm-text-adventure)).
- Research pattern: the LLM turns language into **structured data (JSON)** and a **deterministic back end** executes it ([Real-Time World Crafting, 2025](https://arxiv.org/pdf/2510.16952)). Most AI games then roll dice – we don't (World Bible: no dice).

### Four roles
| Role | Who | Does | Never does |
|---|---|---|---|
| **Engine** | code | owns every number, rule, person, memory and hidden truth; resolves every action | write prose |
| **Director** | code | picks what scene comes next and when hidden causes surface (pacing director, ch. 12) | invent events or randomness |
| **Interpreter** | AI | turns typed text into a structured intent; asks when unclear | decide outcomes |
| **Narrator** | AI | writes the scene and NPC voices from the facts it gets | change numbers, add names, reveal secrets |

### What happens when you type
1. **Interpreter** sorts the input: **say** something to someone · **do** something · **look/ask** about the world · **command** (STATUS, WAIT…).
2. It fills a fixed form: *verb, target, method, manner (careful / bold / sly), what Li says, any promise or lie*.
3. **Engine checks** possibility: is it physically possible here and now, for a 12-year-old slave? Impossible → refused in-world ("Your chains don't reach that far"); unclear → the game **asks**.
4. **Engine resolves deterministically**:
   - known actions use their own rules (training, duel, work…);
   - **any other action** = the best fitting skill/stat vs a fixed difficulty + modifiers (place, time, who watches, wounds). Margin decides the degree. **No dice.**
5. **Consequences** become events: relationships (with reasons), memories of witnesses, rumours, flags, wounds, merit.
6. **Narrator** writes the scene only from those facts; a checker rejects invented names, numbers or events.
7. **Options** for the next moment come from the engine; the AI may phrase them.

### Talking freely
- You can talk to anyone present in your own words. The AI plays the NPC **inside fences**: their personality, mood, opinion of Li, and **only what they know** (ch. 8).
- *What* an NPC reveals is decided by the engine (beats unlocked by opinion and flags); the AI only decides *how* they say it.
- Tone is read from what you write: polite · rude · threat · flattery · **promise** · **lie** · question. Promises are stored and tracked (kept → trust up, broken → trust scar). Lies are caught or not by fixed rules (the NPC's INT/observation vs Li's POL and what they know).

### Crazy actions are allowed
"I attack Raizen", "I steal the slave papers", "I run away tonight", "I insult Ishizue": all possible if physically possible, with **real consequences** through the defeat ladder (ch. 12b). Li cannot die, but he can be beaten, chained, sold, branded or hunted.

### Hand-written core, AI connective tissue (Hidden Door lesson)
- **Story beats, legend moments, ceremonies and key NPC lines** are written by us in the content files (deterministic, checked against the World Bible).
- The AI writes the connective scenes, daily life, and NPC replies around them.

### Determinism with AI
- The structured intent is **stored** in the save; outcomes depend only on it.
- The narration text is **stored** too, so loading shows the same story; REWRITE only re-words it.
- Without an AI (offline or no key), the game still runs on template text and the numbered options.

## Tools & sources (owner ✅ Oct 5)
- **AI narrator online without a key:** the published claude.ai page can ask Claude directly (each player uses their own Claude account, with permission on first use). Used in ch. 7. Outside claude.ai: a pluggable adapter (Gemini free tier, OmniRoute or Ollama), key never in code or chat.
- **Icons:** [game-icons.net](https://game-icons.net/) (CC BY 3.0 → credit line in the game).
- **Crests:** our own, code-drawn, inspired by kamon ([Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:SVG_Japanese_family_crests)).
- **Map:** drawn by Claude in code (owner chose not to use Azgaar).
- **Sound (later):** [Pixabay](https://pixabay.com/sound-effects/) (no credit needed) and [Freesound](https://freesound.org/) (CC0 preferred, CC BY credited).
- **Plugins:** frontend-design, Design, code-review, playwright installed by the owner.
- **Not used:** Blender (3D, not our style), paid map tools.
- **Publishing elsewhere (itch.io) only on the owner's go.**
