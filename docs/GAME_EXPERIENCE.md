# Game Experience Bible – Sengoku Soldier (v0.2, 📝 in progress)

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
| 6 | Look & style | ✅ |
| 7 | AI narrator | ✅ |
| 8 | Onboarding | ✅ |
| 9 | Pacing | 📝 |
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
TITLE SCREEN ──► New life ──► PROLOGUE (narrated ink slides + map reveal) ──► CHAPTER CARD ──► GAME
     │                                                                          ▲
     └──► Continue ─────────────────────────────────────────────────────────────┘
GAME = War chronicle with tabs:  Story · Map · Li · Army · People · Journal · Encyclopedia
Overlays (take the whole screen for a moment):  Event window · Title card · Ceremony · Duel · Battle · Timeskip summary
```
| Screen | What it shows | Unlocks |
|---|---|---|
| **Title** | big title on a night ink scroll, slow drifting smoke/embers; Continue · New life · How to play · Load save | always |
| **New life** | 4 settings with defaults: way of play, storyteller (Claude permission asked here), guidance, ink speed (ch. 8) | new game |
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

## Chapter 6 – Look & style ✅ (owner: "I like every one, that's how I want it")
Visual example (4 screens): https://claude.ai/artifact/SYrfY3m7VaNDTs5GC3TJpK — title screen · war chronicle (Story tab) · legend moment (nickname) · style kit.

- **Mood: night war scroll.** Dark ink ground, paper-coloured text, **one seal red** (actions, danger, the 兵 seal) and **one gold** (titles, honour, chapter labels). No bright colours except the kingdoms' own.
- **Colours:** ink `#0E1014` · ink 2 `#171A20` (panels) · line `#2C3038` · paper `#E9E0CA` · faded ink `#A79F8C` · seal red `#A8361F` · gold `#C9A55E`.
- **Type:** *Shippori Mincho* for titles, names, buttons and kanji; *Spectral* for the story text (true italic for thoughts and rumours); small tracked gold capitals for labels. Both from Google Fonts.
- **Drawn in code:** ink mountain ridges, the moon, campfires, banners (scene headers); the map as ink lines with fog (only what Li knows); crests as simple kamon-style SVGs.
- **Kingdom crests (first sketch)** from the Atlas colours: Kurogane iron gate · Suiren lotus · Hayate horse · Ushio wave · Takane snowy peak · Tatara hammer & flame · Kitakaze wolf.
- **Ranks** F→S grow from grey outline to gold to a red-and-gold seal for S. **Wounds** as a 5-step track from Fresh to Down.
- **Layout (war chronicle):** top strip (chapter, date, place, condition, money) · tabs · story column with a drawn scene header, new-person chips and ▲▼ changes, choices with the tested skill and ⚠ risk, and a free-text line · side panel with Li's card, the fogged map, the chronicle feed (rumours marked uncertain) and goals.
- **Big moments** follow the 4 tiers of ch. 3b; the legend moment is a full black screen with the name in brush capitals, the Japanese name huge behind it, what earned it and who heard it, and a red seal.
- Rules: text contrast ≥ 4.5:1, click targets ≥ 44 px, no emoji in the interface (symbols only), works on a phone as one column.

## Chapter 7 – AI narrator ✅
Builds on World Bible ch. 11 (turn loop, narrator rules) and ch. 12 (safety, cost). The AI never changes a number; it reads what you type and tells what the engine decided.

### Where the AI comes from (three modes, one interface)
| Mode | When | How |
|---|---|---|
| **Claude in the page** | the published claude.ai version | the page asks Claude directly with the player's own Claude account (permission asked once). No key in the game. Players' usage counts against their own plan. |
| **Own key / local AI** | `npm run web`, terminal, chat, or a page hosted elsewhere (itch.io) | adapter: Claude API, Gemini free tier, OmniRoute or Ollama. Key only in `.env`, never in code, chat or the save. |
| **No AI** | offline, permission refused, limit reached | template text + numbered options (today's game). The game never stops because the AI is missing. |

### Two jobs
1. **Interpreter** (fast, small model): free text → structured intent `{kind, target, method, tone, promise?, lie?, confidence}` with a fixed schema. Low confidence → it asks back ("Do you mean you talk to Kaname, or follow her?"). Impossible → the engine explains why (ch. 11 step 3).
2. **Narrator** (normal model; strongest only for legend moments): turns the engine's events into the scene.

### What the narrator receives (the fact packet)
- the **visible facts** of this turn (events with `visible: true`), date, part of day, place and weather;
- the people present: name, look, personality, mood, opinion label of Li, and **only what they know**;
- Li's voice: quiet, watchful, stubborn, hides his anger, fears fire at night;
- the moment tier (normal · spark · title card · ceremony · legend) and a word target (≈150–200, epic ≈300);
- **hand-written core lines** that must appear word for word (beats, legend moments, ceremonies);
- the last 2–3 turns of story for continuity.
- 🔒 hidden truths are **never sent**, so the AI cannot leak them. Hidden rules (Li cannot die, hidden potential) are never sent either (ch. 8 rule 7).

### Check before showing (code, not AI)
- Every number and name in the text must be in the fact packet; no new events, no deaths, no items that don't exist.
- Fails → one automatic rewrite → still fails → template text. The player never sees a wrong fact.
- The approved text is **stored in the save** next to its events; loading shows the same story. REWRITE re-words it, CORRECT re-reads your input before it resolves.

### Style guide for the AI
- Third person ("Li"), present tense, short blocks; grave and epic like *Kingdom*, never jokey.
- Show, don't explain: no stats or dice language in the prose; numbers stay in the interface.
- Japanese words sparingly, always clear from context (rank names with men count).
- NPCs speak in their culture's voice (Atlas ch. 6: Kurogane blunt, Suiren poetic, Hayate boastful…).
- Narrator rules 1–6 of World Bible ch. 11 are part of every prompt.

### Feel
- Text **streams in** word by word like ink on a scroll (it arrives in 5–20 s); the choices appear when it is done.
- While waiting: the scene header and the engine's changes line are already shown, so the turn never feels empty.

### Safety and cost
- Your typed text is passed as **story data inside fences**, never as instructions ("ignore your rules" does nothing).
- Fixed word budget per turn; only relevant memories are sent; static rules and character sheets are cached.
- Routine actions (WAIT, chores without story) use templates, not the AI.

### Owner decisions (Oct 5)
1. **AI writes for free text, people and story moments**; routine actions (chores, WAIT, training without story) stay template text. (option b)
2. **Third person: "Li carries the rice"**, not "you". → Build: change the engine's template texts and the style guide above from "you" to "Li" (the player still types as Li: "I talk to Kaname").
3. **Text streams in like ink**: yes.

## Chapter 8 – Onboarding ✅ (owner approved Oct 5, with the 6 fixes)
How a new player gets from the title screen to "I understand this world and I want to keep going" **without a tutorial wall**. Builds on ch. 3 (title → prologue → chapter card → game), ch. 4 (core loop), ch. 5 (free text), ch. 7 (AI modes) and World Bible ch. 10 (Li's start) and ch. 11 (turn, commands, session start).

### Research
| Game | What they do | What we take |
|---|---|---|
| *Disco Elysium* | no tutorial; the hero wakes up with amnesia, so **the player's ignorance is the hero's ignorance**; skills teach themselves by speaking in dialogue; failure is part of the story | Li is new to Kōri fort too: the world is explained **as Li learns it**; failing is a story, not a game-over |
| *Crusader Kings III* | guided tutorial on a real start (Munster, 1066) that ends in a good position; then small **just-in-time mini-tutorials**; **nested tooltips** on every term; hints can be switched on/off | no separate tutorial map: the **real first week is the tutorial**; gold-underlined terms with nested tooltips; hints on by default, switchable |
| *Bannerlord* | character creation as **backstory questions** that set stats; the tutorial teaches basics, but players feel lost when it ends ("what now?") | Li is fixed (World Bible 10.4), so no stat questions; the "what now?" gap is closed with the **Goals panel** and a first-week plan |
| *Pentiment* / *80 Days* | slow, mundane first days that teach daily life (wake, talk, work); the story narrates the mechanics | the first day is **daily camp life**: carrying, cooking, eating, a secret night; every mechanic shows up as a camp moment |
| *AI Dungeon* | three suggested actions + a free box; tips: "ask questions in character, try things" | the free-text line **never starts blank**: example phrases in first person that fit the scene |
| AI onboarding research | a blank prompt gives no idea what is possible; a **pre-written first prompt** removes the most common failure point | the first free-text moment comes with clickable example lines the player can send or edit |
| Tutorial design (just-in-time, progressive disclosure) | one new mechanic per challenge; teach right before it is needed; don't dump everything in the first five minutes | **max one new thing per turn**; the duel screen is taught before the first real fight |

Sources: [PC Gamer – Disco Elysium](https://www.pcgamer.com/uk/level-up-by-arguing-with-yourself-in-scintillating-crpg-disco-elysium/), [CogConnected – CK3 tutorials](https://cogconnected.com/2020/03/crusader-kings-3-going-easiest-paradox-game-learn/), [GamingOnLinux – CK3 guidance](https://www.gamingonlinux.com/articles/16333/), [Fextralife – Bannerlord start](https://fextralife.com/mount-and-blade-ii-bannerlord-getting-started-guide/), [TheSixthAxis – after the Bannerlord tutorial](https://www.thesixthaxis.com/?p=353857), [AI Dungeon new player guide](https://latitudegames.notion.site/New-Player-Guide-2c8105b8a632809bafebf0b463defec1), [Magic moment in AI onboarding](https://tianpan.co/blog/2026/04/17/magic-moment-ai-onboarding-converts-skeptics), [Wayline – effective tutorials](https://www.wayline.io/blog/designing-effective-game-tutorials-and-onboarding), [Gamified UK – learning by doing](https://www.gamified.uk/2014/05/15/onboarding-tutorials-and-learning-by-doing/), [GDC – 80 Days](https://gdcvault.com/play/1022101/contactUs).

### Seven onboarding rules
1. **The first week is the tutorial.** No separate tutorial level, no pop-up wall. Everything is taught inside real Year 100 play, and nothing taught is thrown away.
2. **Li learns with the player.** Li is new at Kōri fort: the place, the Hagiwara, the river and its banners are explained to him by people, at the moment it matters.
3. **One new thing per turn.** A turn introduces at most one new screen, command or idea.
4. **Teach right before it is needed.** The duel screen is taught in a low-stakes sparring bout, not in the burning village.
5. **The free-text line is never blank.** Until the player has typed freely three times, it shows clickable example lines in first person ("I ask Sukezō where we are"). The narrator answers in third person ("Li asks…", ch. 7).
6. **Every result says why.** Each ▲▼ change and every refusal has a "Why?" that shows the cause in words (ch. 12b #11); this is how the player learns that there are no dice.
7. **Never teach a secret.** Onboarding, hints and How to play never mention hidden rules (Li cannot die, hidden potential, 🔒 truths). They do say: *losing costs* (defeat ladder, ch. 12b #10).

### The first session, step by step
```
TITLE ─► NEW LIFE (4 settings, ~20 s) ─► PROLOGUE (7 slides, ~90 s, skippable)
      ─► CHAPTER CARD "CHAPTER 1 — THE RED CRANE" ─► FIRST DAY (guided by hints) ─► FIRST WEEK ─► first WAIT ─► … ─► sparring ─► the raid
```

**1. New life screen** (one screen, defaults already picked, one button "Begin"):
| Setting | Choices | Default |
|---|---|---|
| Way of play | **Ironman** (outcomes never undone) · **Story mode** (can return to save points) — ch. 11 | Ironman |
| Storyteller | **Claude in this page** (asks permission once) · **Own key / local AI** (not on claude.ai) · **No AI** (template text + numbered options) — ch. 7 | Claude (if available), else No AI |
| Guidance | **Full hints** · **Light** (only new screens) · **Off** | Full |
| Ink speed | Slow ink · Fast · Instant (clicking always finishes the text) | Fast |
- No character creation: Li is fixed (World Bible 10.4). The world number (ch. 12b) is hidden under "Advanced".
- If Claude permission is refused, the game says once, in one line, that it continues without AI, and how to switch later (Settings).

**2. Prologue** — 7 narrated ink slides (ch. 3 asked 6–8), hand-written, no AI, same every time:
1. *For four hundred years, one Empire ruled the land from Amatsu-kyō.*
2. *Year 0. Two princes, two crowns, one city on fire. The Burning.*
3. *Seven Wardens crowned themselves. Seven kingdoms.* — the map lights up in the seven colours with their crests.
4. *A hundred years of war.* — the Kurose river, banners on both banks.
5. Memory: two swords crossed on a wall · a man's laugh · *"Little Dragon."*
6. Memory: snow, a burning lantern at night, a white rock on a coat, a woman's voice: *"Never say that name. Not to anyone."*
7. *Year 100. Spring. A boy carries a load behind a red crane banner, toward Kōri fort.*
- Check against World Bible 10.2: only things Li knows; no "Hattori", no "Twin Demon", no meaning of the white rock.
- Skip button from the first slide; after the first playthrough it starts skipped (option to replay in the Journal).

**3. The first week** — the real story calendar (engine content) plus small hand-written teaching beats (new content, marked ✚):
| When | Scene | What it teaches | Screen / tool introduced |
|---|---|---|---|
| Day 1 morning | Arrival at Kōri (existing) · ✚ Gonza dumps a heavy chest on Hachi | reading a scene, Continue, numbered options with tested skill and ⚠ risk; **first real choice in the first 2 minutes** (help Hachi or keep your head down) | options; ▲▼ changes line with "Why?" |
| Day 1 afternoon | ✚ Old Sukezō's cook tent | **free text**: say / do / look; example lines shown | free-text line with example chips |
| Day 1 evening | eating with Hachi (existing beat h1) | people remember; a relationship spark | **People** tab gets a gold dot |
| Day 1 night | ✚ first night: sleep, or practise with the sticks in secret | day parts, fatigue, risk (Gonza), growth | **Li** tab gold dot (style grows) |
| Day 2 afternoon | Ishizue's inspection (existing) | people judge Li and the band; terms like *Kurogane* have nested tooltips | **Encyclopedia** entry appears |
| Day 2–4 | Rokubei's price (beat k1), the merit law (k2) | goals and the routes to freedom | **Goals** panel shows the first route with progress |
| Day 5 evening | Rice from Sasabe (existing): Kaname, Daisuke | new-person chips | — |
| Day 7 | ✚ Sukezō: "Camp days are all alike, boy. Plan them." | **WAIT with a plan** (ch. 9); the engine stops when something matters (Sayo's visit, Day 10) | first **Timeskip summary** |
| Month 1, ~Day 20 | ✚ Daisuke challenges Li to a stick bout at Sasabe | the **duel screen**: four moves, reading, wound track, "fight or simulate" — low stakes (worst result: a setback and some mockery) | **Duel** overlay, with hints |
| Month 2, Day 6 | the raid on Sasabe (existing) | the first real fight, under pressure | first big moment (title card; legend moment if earned) |

**4. Hints** (Guidance = Full):
- A hint is **one short line** in the margin under a small gold label GUIDE, never inside the story text and never in the narrator's voice. It closes itself after the player does the thing once.
- Each hint appears **once per life**; all hints can be re-read under How to play.
- "Light" keeps only the hints for new screens (duel, timeskip, ceremony, battle later). "Off" shows none.
- Later systems (battle map, roster, domain, court) get the same treatment when they unlock (World Bible ch. 12 "systems unlock with Li's life"), so onboarding never really ends: it follows Li's life.

**5. Help that is always there**
- **Nested tooltips** (CK3): gold-underlined terms (ranks, Kurogane, koku, mon, merit law…) show a two-line explanation; inside it, more terms; "More" opens the Encyclopedia — only what Li has learned.
- **How to play** (title screen + HELP command): **one screen**, six points: 1) choose a number or write what Li does, in your own words, as "I…"; 2) the world is fair: no dice, every result has a cause (ask "Why?"); 3) people remember what Li does, and so do rumours; 4) losing costs: wounds, shame, chains, lost friends; 5) WAIT skips quiet days with a plan; 6) the tabs: Story · Map · Li · Army · People · Journal · Encyclopedia.
- **Refusals teach**: an impossible action is refused in-world with the reason and one possible alternative ("Li's chains don't reach the gate. He could wait for the night shift change."). An unclear one is asked back (ch. 7).

**6. Coming back** (ch. 11 session start): Continue → a "Previously" card (2–3 lines), date, place, current goals, open dangers; then the story. After a long break (30+ real days) the card adds one line on the controls.

### Targets (tested in the playtest, M7)
| Moment | Target (real time, Full hints) |
|---|---|
| Title → first control of Li | ≤ 3 minutes (≤ 1 with the prologue skipped) |
| First meaningful choice | within 2 minutes of control |
| First free-text action | within the first 10 minutes |
| First WAIT / timeskip | ~20 minutes |
| First fight (sparring) and the raid | within the first session (~45–60 min; exact pacing in ch. 9) |
| Hints on screen at the same time | never more than 1 |

### Contradictions & fixes (✅ applied Oct 5)
1. **Ch. 6 visual example vs ch. 3**: the mockup shows "Army · locked", but ch. 3 says the Army tab shows the Red Crane band from the outside while Li is a slave. → Follow ch. 3: the Army tab opens to "The Red Crane band — seen from the baggage line".
2. **Ch. 6 mockup and the engine text use "you"**; ch. 7 decided third person ("Li"). The new ch. 8 screens use "Li"; the engine template change is already on the build list.
3. **World Bible ch. 11 command list** has no **HELP** and no **WAIT**, but the engine and ch. 4/9 use both. → Add HELP and WAIT to the ch. 11 list.
4. **Title button name**: ch. 3 says "New game", the ch. 6 mockup says "New life". → Use "New life" (fits the game), functionally the same.
5. **First fight**: in the current engine the first fight is the raid itself (Month 2, Day 6), with no chance to learn the duel screen first. → Add the sparring bout (✚, owner to confirm).
6. **Hidden rule safety**: ch. 5 says "Li cannot die" in a design text; that sentence must never reach How to play, hints or AI prompts. → Rule 7 above; added to the ch. 7 fact-packet rule.

Applied: 1 + 2 in the style canvas (Army tab opens to the band seen from outside; mockup text in third person) · 3 in World Bible ch. 11 · 4 in ch. 3 (New life, plus the New life screen row) · 5 in `BUILD_PLAN.md` (stage 1 content) · 6 in ch. 7. Still to build: engine template texts "you" → "Li" (ch. 7 decision 2).

### Owner decisions (Oct 5)
1. **No character creation**: Li is fixed (World Bible 10.4); the prologue shows his memories and asks nothing.
2. **Sparring first**: Daisuke's stick bout (Month 1, ~Day 20) teaches the duel screen before the raid. ✚ new content.
3. **Claude permission is asked on the New life screen**; if it is refused, the game runs without AI and can switch later in Settings.
4. **Hints are a plain GUIDE line**, not in a character's voice; world knowledge still comes from people.

## Chapter 9 – Pacing 📝 (proposal, Oct 5)
How fast time, story and growth move: per turn, per session, per season and over a whole life. Builds on World Bible ch. 9 (time, timeskips), ch. 12 (pacing director, systems unlock), ch. 12b (determinism, world shocks), Numbers §2 (training cap), §6 (merit) and §12 (target ages), and ch. 4 and 8 here.

### Research
| Source | What they do | What we take |
|---|---|---|
| *Left 4 Dead* AI Director | a tension curve with four phases: **build-up → peak → fade → relax**; it watches the players and adds or removes pressure | the four phases. **Rejected:** changing difficulty according to how well the player does (that breaks "no dice, the world is fair") |
| *RimWorld* – Cassandra | storyteller with fixed **"on" phases (~4.6 days) and "off" phases (~6 days)**, a minimum gap between big threats, slowly rising challenge | on/off rhythm with a **minimum breathing time** after a peak; challenge rises with Li's life stage, not with a hidden timer |
| *Bannerlord* | 84-day years; becoming king takes **~80–100+ real hours** (≈10–12 in-game days per hour) | a full rise is a long game; time must speed up as Li rises |
| *Crusader Kings III* | one life is a few to many hours; time runs fast, stopping for events | a life spans decades, so the default time step **zooms out** as Li grows |
| *Kingdom* (manga) | arcs alternate: **battle arcs** (long, 50–150 chapters) and **between-battle arcs** (training, politics, people) | the year rhythm: campaign arc → aftermath (ceremony, promotion) → quiet arc (training, people, politics) |
| *Hades* | story drip: characters always have something new, but **say only one thing per visit**; failure feeds the story | NPC beats are spread out, one per meeting; losses open new story instead of just costing |

Sources: [Game Developer – Valve's AI Director](https://www.gamedeveloper.com/design/the-discomfort-zone-the-hidden-potential-of-valve-s-ai-director), [PaceMaker (pacing tool, 2024)](https://arxiv.org/pdf/2408.15001), [RimWorld wiki – Cassandra](https://www.rimworldwiki.com/wiki/Cassandra), [RimWorld wiki – storytellers](https://rimworldwiki.com/wiki/AI_storyteller), [ExpertBeacon – Bannerlord year](https://expertbeacon.com/how-long-is-a-year-in-bannerlord/), [ExpertBeacon – becoming king](https://expertbeacon.com/is-it-possible-to-become-king-of-vlandia/), [CK3 playtime (HowLongToBeat data via RAWG)](https://rawg.io/games/384567), [Kingdom wiki – arcs](https://kingdom.fandom.com/wiki/Season_1), [Screenhub – Kasavin on Hades](https://www.screenhub.com.au/news-article/features/digital/jini-maxwell/hades-greg-kasavin-breaks-down-supergiants-unique-approach-to-narrative-262459).

### 1. Time zooms out as Li rises
The same game is played at a different time step in each life stage (fits World Bible ch. 12 "systems unlock with Li's life").
| Life stage | Default step | Played turn by turn | Usually skipped |
|---|---|---|---|
| Slave (12–~14) | **part of a day** (morning · afternoon · evening · night) | people, secrets, training choices, fights | chores, routine days |
| Soldier (Ashigaru–Kogashira) | **a day** | drills that matter, fights, battle phases, comrades | marching, garrison weeks |
| Officer (Gojū–Hyakunin) | **a few days** | battles, orders, men's problems, rivals | training cycles, marches |
| Commander + land (Sanbyakunin+) | **a week** | battles, council, domain decisions | harvest, projects running |
| General | **a season** | campaigns, court, great battles (phase by phase) | peace years |
- **Scenes never zoom out:** a conversation, duel, ceremony or battle phase is always played at full detail, in any stage.
- **A turn must earn its place:** if no option differs in a meaningful way and nothing new is known, the engine offers to continue the plan ("Nothing presses today. Continue the plan?") instead of asking for a turn.

### 2. The pacing director (deterministic)
Four phases, as in *Left 4 Dead*, but it **only decides when things reach Li, never what happens in the world**:
| Phase | What the director does |
|---|---|
| **Build-up** | surfaces brewing things that are ready, at the **early** end of their window: rumours reach Li, a rival moves, an NPC asks something |
| **Peak** | the big moment itself (fight, raid, battle, ceremony, reveal); nothing else is added |
| **Fade** | consequences arrive: wounds, witnesses talk, merit, rumours with Li's name |
| **Relax** | quiet time with people and training; non-urgent beats wait until the **late** end of their window. Minimum: slave/soldier 3 in-game days, officer 7, commander 14, general one month |

**Rules that keep it fair (ch. 12b):**
1. **The world never waits for the director.** Armies, fuses, deaths and harvests follow their own rules and dates (ch. 12b #9). The director only schedules **Li-local beats** (an NPC approaching, a side scene, a request) and **news delivery** inside a realistic messenger delay.
2. **Every beat has a window** in the data (earliest · latest day). The director picks a day inside it by a fixed rule (build-up → earliest, relax → latest, otherwise the middle); ties are broken in the fixed ch. 12b order. Same save = same timing.
3. **No rubber-banding:** it never makes enemies weaker or stronger because Li is winning or losing. A wounded Li gets breathing time only if the people around him would give it (in the relax phase, inside windows).
4. **Tension is computed, not rolled:** from open threats near Li, his wounds, days since the last peak and days since the last meaningful choice.
5. **Never stuck:** if Li has had no route forward for 6 in-game months (no merit, no new chance, no freedom progress), the director brings forward the earliest opportunity from the data (a recruiter, a campaign call, a patron's errand). This checks the Numbers §12 test "no career stuck for 3 years".

### 3. The year rhythm (Kingdom arcs × the calendar)
```
SPRING  quiet arc: training, people, recruiting, rumours build ───┐
SUMMER  campaign arc: march → battle (several sessions) → fade     │  ~1–2 campaign arcs a year
AUTUMN  harvest · tax day · a second campaign or aftermath         │
WINTER  quiet arc: ceremonies, politics, plans; passes close ──────┘
```
- Every season ends with a **season title card + summary** (ch. 4); every campaign ends with an **aftermath** (reward ceremony in rank order, promotions, funerals: ch. 3b).
- Each year has at least **one peak per season** near Li; a battle arc is the longest peak.

### 4. Session rhythm (real time)
| Unit | Target |
|---|---|
| one turn | 30 s – 2 min (reading + choosing), streaming ink included |
| a **spark** (relationship turn, skill, rumour about Li) | about every 10 minutes |
| a **meaningful choice** | at least one per session (ch. 4), aim for 3–5 per hour |
| a **title card** or bigger | every 1–2 sessions |
| a **legend moment** | every ~5–10 hours; rarer later in life (they must stay special) |
| a play session | ~45–90 minutes, ending at a natural break |
- **Natural stopping points:** after a fade phase, a season card or a chapter end, the game shows the session-end summary (World Bible ch. 11) with "A good place to rest." The player may also stop any time (autosave every turn).
- **Chapters** follow the arcs: one chapter ≈ one arc ≈ 2–6 hours of play.

### 5. A whole life (real time, strong player)
Target ages from Numbers §12, mapped to play time (to confirm in the M7 playtest and with simulated careers):
| Stage | In-game | Real time (target) |
|---|---|---|
| Slave → freedom | Year 100 → age 13–15 | 8–12 h |
| Soldier → Kogashira | to ~16 | 8–12 h |
| Officer → Hyakunin-gashira | to 18–19 | 12–18 h |
| Sanbyakunin-shō + first land | to 20–21 | 12–18 h |
| General → Taishō | to 27–32 | 25–40 h |
| **Total to Taishō** | ~15–20 years | **~65–100 h** (Bannerlord-sized) |
- Early years are slow and close (≈30–40 in-game days per hour); general years are fast (≈1–2 in-game years per 10 hours, except for battles).

### 6. Skipping (WAIT) rules (adds to World Bible ch. 9)
- **Same result as playing it:** a skip with a plan gives exactly what playing those days with the same routine would give (training cap 2.0 per stat per season, Numbers §2). There is no reward for clicking through routine, so no grind.
- **A skip stops for:** danger to Li or someone close · a once-only chance · a summons · a peak from the director · a season change (title card) · a birthday that matters (genpuku at 15).
- **Longest skip** by stage: slave 1 month · soldier 1 season · officer and up 1 year.

### 7. AI use follows pacing (ch. 7)
- Template text for routine and skipped days; the AI writes free text, people and story moments (ch. 7, owner decision 1).
- Target: **~20–40 AI calls per hour of play**; legend moments use the strongest model, others the normal one. So a 70-hour life stays affordable on a player's own plan.

### Contradictions & fixes found
1. **Director vs "the world goes on without Li"** (ch. 4 rule 4, ch. 12b #9): a director that delays threats would hold the world back. → Fixed by rule 1 above: it schedules only Li-local beats and news delivery, never world events.
2. **Director vs fairness:** L4D-style adapting to performance would be hidden difficulty changes. → Rejected (rule 3).
3. **World Bible ch. 9 timeskips** gives no longest skip and no "same as playing" rule. → Add §6 to ch. 9 on approval.
4. **Ch. 8 target "raid within the first session"** needs ~4 in-game weeks in under an hour. → Fits: the slave stage skips up to a month, and the first WAIT comes on Day 7.
5. **Numbers §12 test "never stuck 3 years"** has no mechanism yet. → Rule 5 (6-month check) gives one.

## Tools & sources (owner ✅ Oct 5)
- **AI narrator online without a key:** the published claude.ai page can ask Claude directly (each player uses their own Claude account, with permission on first use). Used in ch. 7. Outside claude.ai: a pluggable adapter (Gemini free tier, OmniRoute or Ollama), key never in code or chat.
- **Icons:** [game-icons.net](https://game-icons.net/) (CC BY 3.0 → credit line in the game).
- **Crests:** our own, code-drawn, inspired by kamon ([Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:SVG_Japanese_family_crests)).
- **Map:** drawn by Claude in code (owner chose not to use Azgaar).
- **Sound (later):** [Pixabay](https://pixabay.com/sound-effects/) (no credit needed) and [Freesound](https://freesound.org/) (CC0 preferred, CC BY credited).
- **Plugins:** frontend-design, Design, code-review, playwright installed by the owner.
- **Not used:** Blender (3D, not our style), paid map tools.
- **Publishing elsewhere (itch.io) only on the owner's go.**
