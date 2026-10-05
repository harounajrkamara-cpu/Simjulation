# Sengoku Soldier – Complete design (all files in one)

Generated from the repo: STATUS + WORLD BIBLE (rules) + WORLD ATLAS (world). The separate files stay the source of truth.

---

# PART 1 – STATUS

## Project status

## Where we are
- Ch. 10 Li's background ✅ approved. Kingdom names are now used everywhere (epithets only as nicknames). Elite titles: Six Pillars (Kurogane), Three Storms (Hayate). Family Mibu renamed Tsurumaki (real clan name).
- World Bible **v0.5** (ch. 12b determinism & feedback rules, S-rank rule, no magic approved)
- Previously: World Bible v0.3: chapters 1–9, 11, 12 approved. Chapter 10 (Li's start) is open.
- Language of the simulation: **English**.
- Build plan: 4 stages, each playable.
  1. Li as a slave: turn loop, dashboard, RECAP, people & memories, training, duels
  2. Soldier life: units, battles, ranks, promotions, pacing director
  3. Land & economy, family politics
  4. Court, kingdoms, full world

## Next step
- Done: ch. 13b power inside the kingdoms (engine, factions, fuses, profiles). Done: big check (v0.4), ch. 13c extra rules, family tiers. Draft: `docs/WORLD_ATLAS.md` v0.2 (history, map, kingdoms, families, characters, S-tier proposal, cultures, armies, trade, relations, Li's generation, places, law, legends, rumours) waiting for owner approval.
- Decided: crossbows exist (Tatara, the Smiths' Kingdom). The two giants stay close in size and both are internally divided.

Big worldbuilding round:
1. The 7 kingdoms (names, map, rulers, size, cultures, relations).
2. Families per kingdom, branches, key characters.
3. Imperial bloodline and the Imperial treasures.
4. Li's background (ch. 10): based on the old 1540 backstory (Twin Demon father), checked and fixed for the new world; Li starts as a slave.
   - Decided: **option C** – Li alone was captured and sold as a boy, separated from mother and sisters (finding them is a later goal).
   - Decided: **Li was young** when his father died, so he barely remembers him.
   - Decided: family names stay (mother Yuki, sisters Mei & Kenjiko); the warrior girl and the rival recruit get new names.
   - Decided: old real-world names (Imagawa, Anegakoji, Shiina, Takeda, Kawanakajima) get invented names.
   - Decided: Li starts at **age 12**.
   - Decided: the **Suiren (Southern Giant)** kingdom murdered Li's father.
   - Decided: Li starts as the slave of a famous rōnin's mercenary band in the Kurogane (Iron West) (World Bible ch. 13).
- Decided: **no firearms** in this world.
Then: numbers sheet → build stage 1.

## Open issues
- `server.ts`: hardcoded Google API key — owner should revoke it; remove from code when building.
- Old app code (`src/`, `server.ts`) predates the World Bible and will be rebuilt.

## Source material (owner's uploads, not in repo)
Old chats and docs: ARC 1/2 (old slave "Ali" story), ARC 1 manhwa + Li Hattori summary (1540 Twin Demon story), complete 1540 simulation doc, tracking systems, master tracking PDF v3, Simulatie systeem/ChatGPT docs, Black Clover / Bleach / Solo Leveling / Naruto chats.

---

# PART 2 – WORLD BIBLE (rules)

## World Bible – Sengoku-inspired simulation (v0.5)

Status per chapter: ✅ approved · 📝 proposal · ⏳ not started

### Core principle: no dice ✅
- **Deterministic wherever the player acts**: duels, battles, conversations, promotions — same situation, same outcome.
- **The world runs on hidden causes, not luck**: weather, harvests, disease, disasters follow seasons and conditions (neglect, war, overpopulation). Causes are not shown in advance, so events still feel surprising, but nothing is pure chance.

### ⏳ To design later (kingdoms & families worldbuilding)
- The 7 kingdoms: names, map, rulers, armies, relations.
- The great and lesser families per kingdom, with branches and key characters.
- The imperial bloodline: who, where, what they want, how it ties to the Imperial treasures.
- Li's background and starting location.
- **Design rule for kingdom sizes**: Kingdom-epic armies need land. A 200,000-man army needs ~8–10M koku (or ~4–5M in total war). Big kingdoms ≈ 5–10M koku, small ones ≈ 1–3M. The world is larger than real Japan (~18.5M koku in 1598).

---

## Chapter 1 – World & history ✅

- Setting: a **fictional land inspired by Sengoku Japan**. Japanese culture, armor, weapons, names and rank terms; our own map, kingdoms, families and history.
- **The Empire** ruled the whole land for centuries.
- **100 years ago** the Empire collapsed and split into **7 kingdoms**.
- The imperial bloodline **still exists**: powerless, possibly hidden. ⏳ Designed together later, in the worldbuilding of the kingdoms and families.
- The great goal of the world: whoever reunites the 7 kingdoms becomes the new Empire.
- All families have **invented names** (no real clans like Takeda/Oda).
- **No magic** ✅: gods are believed in but never act visibly. Abilities (ch. 5) are extreme human skill, will and training, never sorcery.
- **No firearms** exist in this world: swords, spears, bows, **crossbows**, cavalry, siege engines.
- **Crossbows** exist (decided): mainly made and used in Tatara; rare and expensive elsewhere.

## Chapter 2 – Political structure ✅

Two separate power systems that work together.

### System A – The Crown (government, serves the kingdom)
```
KING
└─ ROYAL COURT – chancellor, ministers, royal Grand Generals (= Dai-Shōgun in Crown service)
   └─ GOVERNORS – one per STATE, appointed by the king
```
- A **state** = an administrative region of 3–5 provinces.
- A governor does **not own** the land: he collects taxes and troops for the king and keeps the families in line.
- A governor can be born into a family, but in office he serves the Crown.

### System B – The Families (own the land, have private armies)
```
GREAT FAMILY  → owns a PROVINCE (head = Province Lord)
LESSER FAMILY → owns a DISTRICT (a city + its villages), sworn to a great family
each family = MAIN BRANCH + SIDE BRANCHES
side branches receive part of the family land from the main branch
```

### Land, from big to small
```
KINGDOM → STATE (crown) → PROVINCE → DISTRICT (city + villages) → TOWN → VILLAGE
```
- A lesser family's main branch holds the city; side branches hold towns/villages around it; the smallest branch may hold one village and its rice fields.

### How the two systems connect
- Families owe **taxes and troops** to the Crown via the governor.
- In a great war the king calls up the **royal army + family armies**.
- Built-in tension: families want power, the Crown wants control, branches compete with each other and with their main branch.

### Li's starting position (template)
⚠️ Superseded by ch. 13 (Li starts as the slave of a rōnin's mercenary band). The chain below is still how any place in a kingdom is addressed.
```
Kingdom ___ → State ___ (Governor ___) → Province ___ (Great Family A)
  → District ___ (Lesser Family B, sworn to A)
    → Village ___ (side branch of B) ← Li is a SLAVE here
```

### Extras ✅
1. **Gekokujō** – a side branch can overthrow its main branch; a retainer can overthrow his lord.
2. **Hostages** – families send a son/daughter to the royal capital as a guarantee of loyalty.
3. **Marriage alliances** between families.
4. **Adoption** – a family without a strong heir may adopt a talented outsider (rare route to a family name).
5. **Court factions** – e.g. the Chancellor's faction vs the Grand Generals' faction.
6. **Rōnin** – masterless warriors left when a family falls; for hire.
7. **Neutral powers** – warrior-monk temples, the merchant guild, a shinobi village. They exist *inside* each kingdom, stay neutral in family conflicts, but serve the kingdom/Crown.
8. **The Imperial treasures** – three relics of the fallen Empire; whoever holds them gains legitimacy to reunite the land.

## Chapter 3 – Families ✅

### Members of a family
```
FAMILY HEAD (main branch) – rules all land and the army
├─ Heir + blood relatives of the main branch
├─ Council of elders
├─ SIDE BRANCHES – own head, own piece of land
├─ RETAINER HOUSES – sworn samurai families (not blood)
├─ Soldiers (ashigaru) – commoners in the family army
├─ Peasants, craftsmen, merchants on the family land
└─ Slaves – lowest, owned, no rights
```

### Social classes (high → low)
1. Royal family 2. Nobles (family blood) 3. Samurai (retainers) 4. Commoners (farmers, craftsmen, merchants) 5. Outcasts & slaves.
Class decides the starting point (a noble son may start as an officer; a slave must first earn freedom).

### Ways out of slavery
Merit (heroic deed) · bought free · war (armed slaves freed if they survive) · escape (hunted afterwards).

### Tracked per family
Land · wealth (koku/year) · army size · prestige · loyalty to its lord · cohesion (main vs side branches; low = split / gekokujō risk).
Every important family has a named head, heir, general and a few key characters with their own goals.

## Chapter 4 – Military ranks ✅

| Rank | Men commanded |
|---|---|
| Ashigaru | – (soldier) |
| Gochō | 5 |
| Kogashira | 10 |
| Gojū-gashira | 50 |
| Hyakunin-gashira | 100 |
| Sanbyakunin-shō | 300 |
| Sennin-shō | 1,000 – 4,999 |
| Gosennin-shō | 5,000 – 9,999 |
| Taishō (General) | 10,000 – 50,000+ |
| Dai-Shōgun (Great General) | whole armies, up to ~200,000 |

- Below 1,000 unit sizes are fixed; from 1,000 up the rank is a title with a range.
- Place in the range depends on reputation, the size of the family/kingdom, the mission (temporary extra troops), and losses.
- Rule 1: nobody can outrank the army they serve (a family of 3,000 cannot have a Taishō).
- Rule 2: Crown service counts higher than family service at the same rank.
- No fixed number of Dai-Shōgun: it emerges from the simulation.
- Dai-Shōgun are almost always in **Crown service** (only kingdoms have armies that large); a great family can only have one if its army is big enough (Rule 1).
- Promotion = merit + status + a free position; big campaigns end with a reward ceremony (in rank order, with reactions).

## Chapter 5 – Character system ✅

### Part 1 – Stats & Power Rank ✅
Stats 0–100:
- **LEA** – troop strength & morale, how many men handled well. Grows from commanding, speeches, won battles; not from duels.
  - **Command capacity**: each LEA level can handle a certain number of men well. Leading more than that = slower orders and faster morale loss (e.g. a strong fighter promoted too fast).
  - ✅ (ch. 12b) The table gives labels only. Overload is **gradual**: the further the troop count is above capacity, the slower the orders and the faster the morale loss. No tenfold jump at a band edge.

    | LEA | Handles well |
    |---|---|
    | 0–20 | ~10 men |
    | 21–40 | ~100 |
    | 41–60 | ~1,000 |
    | 61–80 | ~10,000 |
    | 81–100 | 50,000+ |
- **VAL** – personal combat, duels, courage, inspiring by example. Grows from duels, real fights, training with masters.
- **INT** – tactics, reading the enemy, ambushes, traps. Grows from strategy, study, successful plans.
- **POL** – court, negotiation, governing, persuasion. Grows from negotiation, governing, intrigue.
- ✅ Hidden potential ceiling per stat; age curve (fast growth young, peak 30–45, VAL declines with age, INT/POL can keep rising).

Power Rank (F–S), separate from men commanded:
- **Warrior Rank** = VAL + weapon/style mastery.
- **Commander Rank** = LEA + INT.
- **Statesman Rank** = POL + INT (for court/political characters).
- **Overall Rank** = the highest of these; shown like "A (Warrior A / Commander C)".

| Rank | Score | Rarity |
|---|---|---|
| F | 0–14 | most people |
| E | 15–29 | trained soldiers |
| D | 30–44 | veterans, small officers |
| C | 45–59 | captains, strong officers |
| B | 60–74 | generals, elite warriors |
| A | 75–89 | a few per kingdom |
| S | 90–100 | counted per sub-rank: ~4–6 living S in the whole land, max 2 per kingdom ✅ |
Plus/minus allowed (B+ = high in B).

### Part 2 – Styles, skills, abilities

**Fighting styles** ✅ (two swords, spear, naginata, bow, unarmed…)
- Mastery only, no rank. 0–20 Beginner · 21–40 Advanced · 41–60 Expert · 61–80 Master · 81–100 Legendary.
- Grows from training and fighting (real fights teach more).
- Unlocks at ~30 / 50 / 70 / 100 (new technique or combo; at 100 possibly something unique).
- Feeds Warrior Rank together with VAL.

**Skills** ✅ – tactics, stealth, horsemanship, archery, medicine, administration, siegecraft… 0–100, always usable.

**Abilities** ✅
Each ability: rank (F–S) · mastery (0–100) · type · active/passive · effect · limit per battle · cost afterwards · trigger · weakness · origin.

Types, each linked to a sub-rank:
| Type | Linked rank | Example |
|---|---|---|
| Combat | Warrior | Zone – SHINKEN NO RYŪ, Kage no Yaiba |
| Command | Commander | Gale March (whole army faster/stronger) |
| Political | Statesman | Silver Tongue, court schemes |
| Special | set per ability | stealth → Warrior; spy network → Statesman |

Rules:
- Rank limit: an ability can be at most **one step above its linked sub-rank**.
- Bloodline/legendary exception: may exceed the limit but starts at very low mastery.
- Abilities arrive through **events** (near-death, training breakthrough, mentor, old book), not automatically on rank-up; the rank table is an expectation.
- Count by **Overall Rank**, mostly on the character's strongest side:

| Overall | Abilities | Kind |
|---|---|---|
| F / E | 0 | – |
| D | 0, rarely 1 | near-death / extreme training only |
| C | 1 (max 2) | usually a common technique |
| B | 2 (max 3) | first unique ability likely |
| A | 2–4, one ≥ B | mostly unique |
| S | 3–5, incl. A-rank | S-rank abilities only for the very top |

- **Upgrade, don't stack**: evolving (mastery 100 + big event) upgrades in place (Zone B → Zone A). At the maximum, a new ability means replacing or merging.
- **Active** (triggered, limit + cost, e.g. Zone) vs **passive** (always on, e.g. Zanshin, Ku no Kokoro).
- **Origin**: common techniques (taught at schools/armies/dojos; several people can know them) vs unique (personal or bloodline).
- Every ability has a **weakness** (Zone: time limit → enemies stall).
- Mastery grows slowly, mostly in real danger; training helps a little.
- **Injuries can temporarily block** an ability (broken arm → no two-sword techniques).
- Prodigy/bloodline characters (e.g. Li) may get a unique ability earlier (C-rank).

**Style unlock choice** ✅ – at 30/50/70/100 the character chooses 1 of 2 options.

**General type** ✅ – Instinctual / Intellectual / Balanced. Affects command abilities; instinct can trip up logic ("the more a general relies on logic, the easier he is tripped up by what surpasses logic").

**Aura** ✅
- Strength = Overall Rank + reputation.
- Enemies 2+ ranks lower may hesitate or panic; nearby enemy troops lose some morale.
- ✅ (ch. 12b) Aura acts only on **morale and the opponent's choices** (hesitation, panic). It is **not** added to Combat Power, so rank is never counted twice.
- Equal auras cancel out. A small bonus, never an auto-win.
- Can be suppressed to look weak; revealing it is a scene moment.

**Fog of war** ✅
- Others are shown as estimates ("Rank A? VAL very high, abilities: unknown").
- Accuracy depends on own INT, time observing, spies/info, and the target's fame.
- Abilities become known when used or reported. Own dashboard is always exact.

**Engine note**: abilities are stored as data records; limits and the rank+1 rule are enforced by code.

## Chapter 6 – Combat ✅

### 6a – Duels ✅
- **Fully deterministic**: same situation → same outcome. Unpredictability comes only from hidden information (fog of war, hidden abilities) and the opponent's own choices (personality, general type, learning).
- Only important opponents (officers, commanders, named characters) trigger a duel; before each duel the player chooses: play it or auto-simulate.
- Flow: size up → exchanges → decision → aftermath.
- Choices per round (numbered + free text): attack · defend/counter · feint · observe · use ability · use environment · talk/taunt.
- **Choice clash**: counter beats reckless attack · attack beats observing · feint beats defense · observing gives info and a later bonus. Combined with stats, so the stronger fighter usually still wins.
- **Combat Power** per round = VAL × style-mastery factor (0–20 ×0.7 · 21–40 ×1.0 · 41–60 ×1.3 · 61–80 ×1.6 · 81–100 ×2.0) ± condition ± ability ± terrain/weather ± matchup (reach, style) ± choice clash ± knowledge (observation) ± surprise (aura: morale/hesitation only, ch. 12b).
- Round winner = higher Combat Power; the gap decides the effect on the loser: small = pushed back/tired · medium = wounded · large = badly wounded · huge = down.
- **Wound track** instead of HP: Fresh → Hurt → Wounded → Badly wounded → Down; each step lowers Combat Power for the rest of the duel.
- **Upset rule**: same rank = better choices win · 1 rank = possible with good play + 1–2 factors · 2 ranks = 3–4 factors stacked · 3+ = practically impossible (survival is victory).
- **End**: someone is Down, yields, flees, or the duel is interrupted; usually 3–6 rounds. No winner after ~8–10 rounds = **draw**. Epic duels may run longer in phases.
- **Fleeing** is allowed but costs reputation and troop morale (more when fleeing from a weaker foe). Losing a duel lowers your troops' morale; winning raises it.
- **Li cannot die** — not in duels, battles, from disease or any other cause. This rule is **never mentioned in the game**: fights are described as truly deadly, and losing must really hurt (permanent injuries, capture, rank loss, friends dying, family in danger). Defeat = badly wounded, captured, humiliated, or losses around him.
- **Permanent injuries** are possible for Li (scars, lasting effects such as a weaker arm).
- **Friends and allies can die**; other characters, including famous enemies, can die.
- **Aftermath**: wounds persist and heal over days to months (lower stats, may block abilities) · growth (most from beating stronger foes) · trophy collection (name, rank, men commanded, date, battle) · reputation & memories (witnesses and the loser) · ability costs (e.g. Zone penalty).

### 6b – Battles ✅
- Three sizes: **skirmish** (dozens–hundreds, mostly your own unit) · **battle** (thousands+, in phases with sectors/flanks) · **campaign** (several battles over weeks/months: marches, sieges, supply, timeskips).
- **You command only your own unit** (size = your rank) and follow orders. Other units are run by their own commanders (AI characters, by personality and general type). You may propose things or ask permission; acceptance depends on status and relationship.
- **Disobeying orders is allowed**: can bring glory or punishment.
- **Battle overview every phase**: all sectors for both sides, numbers, changes since last phase, your unit (men, morale, kills). **Information depends on position**: own sector exact · other allied sectors as reports (roughly right, sometimes late) · **enemy numbers are estimates (~)**. Higher rank = better information (messengers, scouts). The overview is still shown every phase. A quiet phase may change only position, fatigue or information (ch. 12b).
- Each unit: men · type (spear, bow, samurai, cavalry) · quality (training, gear) · morale · fatigue · formation · commander (LEA, INT, command abilities).
- **Unit strength** = men × quality × commander factor (LEA) × morale × formation ± terrain ± matchup (spears vs cavalry, archers at range) ± surprise/ambush ± flank/rear ± command abilities.
- Each phase, units in contact fight; losses follow the strength ratio. **Morale breaks before men run out**: below a limit a unit wavers, then routs. A collapsing flank exposes its neighbours (chain reaction).
- Morale changes: commander dies or loses a duel (big drop) · flanked/surrounded · speeches, aura, command abilities · long fight without progress · hunger/bad supply.
- Flow: war council → deployment → phases (**one phase ≈ part of a day, 3–4 per day**) → night (multi-day: rest, wounds, scouts, desertion, reinforcements) → end (rout, retreat, surrender) → aftermath (losses, merit, trophies, reputation, later the reward ceremony).
- Unimportant fights auto-simulate; duels vs officers/commanders and key moments are offered to the player first; "simulate until the final battle" is allowed.
- **INT in battle**: spotting ambushes and traps, how much your tactics add, accuracy of enemy estimates.
- **Maneuver phase** (during deployment): no losses; INT, terrain and scouting decide who starts with the advantage.
- **Morale states**: Steady → Wavering → Routing → Shattered (ch. 12b: only if their general died **and** the unit was already wavering, cut off, or has no stand-in commander). **Chain rout**: a routing unit lowers the morale of its neighbours. Flank/rear attacks give big morale hits; attacked from three sides a unit breaks fast.
- **Taking the general's head**: killing or capturing the enemy commander shatters his troops' morale (duels decide battles).
- **Local superiority**: what counts is how many men you bring to one spot (soft Lanchester for melee); cutting the enemy into pieces lets a smaller army win.
- **Realistic losses**: during the fight ~3–10% dead on both sides; most deaths come after a rout (20–30%+, more if the winner has cavalry); an orderly retreat keeps losses ~10–20%.
- **Pursuit phase** after every battle: cavalry chases routers; good commanders limit the damage.
- **Losses split into four kinds**: dead · wounded (return after healing) · captured (can be ransomed) · deserted.
- **Sieges** are their own battle type: starve (slow, defenders' morale drops over time) or assault (fast, very bloody); supply decides how long both sides last.

## Chapter 7 – Economy ✅

### Money ✅
- **Mon** (copper coin, daily things) · **Ryō** (gold coin, big purchases, pay, rewards) · **Koku** (rice to feed 1 person for 1 year; measures land and family wealth).
- Game rule: **1 koku ≈ 1 ryō ≈ 1,000 mon** (rounded from historical 400–540 mon per koku).
- Feel: 1 ryō ≈ a month's wages for a normal worker today.
- Example prices: meal 5–20 mon · simple spear ~1 ryō · decent sword 3–10 ryō · master katana 30–100+ ryō · warhorse 10–30 ryō · buying a slave free 5–20 ryō.

### Pay per rank ✅ (realistic)
| Rank | Pay per year |
|---|---|
| Ashigaru | 2–3 ryō + food and basic gear |
| Gochō / Kogashira | 4–6 ryō |
| Gojū-gashira | 10–15 ryō |
| Hyakunin-gashira | 25–40 ryō |
| Sanbyakunin-shō and higher | land (a village, later a district) instead of only pay |
Slaves receive no pay.

### Land & taxes ✅
- Land measured in koku per year: village 300–1,000 · district 10,000–50,000 · province 100,000–500,000+.
- The lord takes **40–60%** of the harvest. Higher tax = more money but lower peasant loyalty → **uprisings** possible.
- Tax income arrives once a year, after the autumn harvest.

### Army comes from land ✅
- Normal: **200–250 soldiers per 10,000 koku**. Total war: up to ~2×, but fields go unworked and next year's harvest drops.
- Every family's and kingdom's army size follows from its land (fixes the old 380 vs 85,000 contradiction).
- Derived from ch. 4 Rule 1 + this rule (normal standing army):

| Land | Standing army | Highest possible rank |
|---|---|---|
| Village (300–1,000 koku) | ~5–25 | Gochō / Kogashira |
| Several villages (side branch) | ~25–100 | Gojū-gashira / Hyakunin-gashira |
| District (10k–50k koku) | ~200–1,250 | Sanbyakunin-shō / Sennin-shō |
| Province (100k–500k koku) | ~2,000–12,500 (×2 in total war) | Gosennin-shō / Taishō |
| Kingdom (1M–10M koku) | ~20,000–250,000 | Taishō / Dai-Shōgun |
So a slave in a small branch can only rise so far there; to go higher he must move up to bigger families or the Crown.

### Upkeep ✅
- Every soldier eats ~1 koku/year plus pay and gear. Campaign supplies, long supply lines and sieges cost extra; hunger lowers morale.
- **Unpaid soldiers desert.** Wounded cost care.

### Other income ✅
Markets & trade (merchant guild) · tolls · mines · war (loot, ransom, ceremony rewards; looting hurts reputation with locals) · gifts & bribes · loans from the merchant guild with interest.

### Domain & projects ✅
- Projects (watchtower, barracks, farmland, market, roads, smithy, walls, school, shrine…) cost money, time and workers.
- The engine stores a completion date; finished projects leave the dashboard.
- Disasters: bad harvest, flood, famine, disease.

### Wallets ✅
Li's personal money · his unit's supplies · later his domain's treasury (family can manage it). The dashboard always shows Li's money.

### Standing troops & levies ✅
| | Standing troops | Levies |
|---|---|---|
| Who | professional soldiers | peasants called up for a campaign |
| Cost | full pay all year | cheap, only during the campaign |
| Quality | trained, good gear | weak, poor gear, break faster |
| Side effect | – | harvest drops while they are away |
The normal 200–250 per 10,000 koku are mostly standing troops; total war adds levies. Slaves and peasants are often thrown in as levies.

### Families and the Crown ✅
- Families send ~**10–20% of their tax income** to the Crown and provide a **troop quota** when the king calls. ⚠️ Default only: the real share per kingdom scales with Crown Authority (ch. 13c rule 6).
- Paying less is possible, but the governor notices and Crown trust drops.

### Social barrier ✅
- Not a law, just how the world is: **low-born people do not climb easily.** Nobles look down on them, promotions come slower, they need more merit for the same step, and some people will try to block them.
- Some individuals (mentors, open-minded lords) judge by deeds instead.
- Historical echo: Toyotomi Hideyoshi rose from peasant's son to ruler.

## Chapter 8 – Relationships, loyalty & NPC memory ✅

### How one person sees another (one direction)
- Engine values (0–100): **Trust** · **Respect** (ability) · **Affection** (warmth) · **Fear** (dominance) · **Rivalry** (competition). Based on psychology: warmth & competence (Fiske/Cuddy), interpersonal circumplex (warmth & dominance), trust = ability + benevolence + integrity (Mayer, Davis & Schoorman).
- **Romance** value only between people where it is possible.
- Special bonds: family · sworn brother · mentor/student · lord/retainer · rival · enemy · lover/spouse.
- **The player sees one summary opinion (−100 … +100) plus a short label** ("Respects you, fears you a little"); the 5 values stay in the engine.
- **Trust is driven mostly by promises** (integrity): kept promises raise it a lot, broken ones destroy it fast.
- **Dread** (global, from reputation for cruelty or ruthless acts) is separate from personal fear.
- Social barrier (ch. 7): nobles get a "low-born" opinion modifier toward commoners/ex-slaves; deeds can outweigh it.

### Reasons, not just numbers
- Every change is an **opinion modifier with a reason**; many fade over time, big events stay ("Saved my life" permanent; "Punished me in front of the men" fades after 1 year).

### Loyalty (to a lord, family or kingdom)
| Loyalty | Behaviour |
|---|---|
| 90–100 | would die for his lord |
| 70–89 | loyal and reliable |
| 60–69 | neutral, watching |
| 40–59 | suspicious, could switch with a good offer |
| 0–39 | will betray or rebel |
- Up: victories, rewards, fair treatment, kept promises. Down: defeats, broken promises, being passed over, favouritism to rivals.
- **Betrayal needs three things together**: low loyalty + an **opportunity** (enough power, a better offer, the lord looks weak, own land threatened) + **not too much fear** of the lord.
- Personality shifts the limits (honourable stays longer, greedy switches faster); blood ties to the lord's family make betrayal less likely.
- Rebel groups act only with enough combined power (CK3-style threshold).
- **Family level**: a family's loyalty follows its head; family **cohesion** (ch. 3) = how the branch heads see the main-branch head.
- **Unit level**: each unit has a **unit loyalty/morale toward its commander**; named soldiers (e.g. close followers) have individual relationships.

### NPC memory
- Memory record: what happened · date · how known (saw it / told / rumour) · certainty · emotional weight.
- **An NPC only knows what he saw or was told**; secrets stay secret.
- **Rumours spread** person to person and lose accuracy (changed by fixed rules, ch. 12b).
- The engine selects the **most relevant memories** per scene (recent, important, fitting — Stanford Generative Agents).

### Personality & goals
- Traits (proud, cautious, greedy, honourable, cruel…), goals (short / medium / long-term), general type (ch. 5).
- NPCs act on their own goals, also when the player is absent; big events can change personality.

### Relationship layers (Dunbar)
- Per person ~5 inner circle · ~15 close · ~50 known · up to ~150 tracked contacts; beyond that = faces in the crowd.
- Bonds fade without contact (deep bonds slowly, weak ones fast).
- Only a few active real rivals/enemies at the same time.
- **NPC tiers**: major characters get full relationship webs; minor characters only track their view of the player and their own group.

### Rivals & Grudges
- Named enemies who survive keep a memory of Li, can grow (promotion, new ability, new trait) and come back.
- Built like Crusader Kings' rivals plus our own memory system (ch. 8); **not** a copy of Shadow of Mordor's patented Nemesis system (patent until 2036). Get legal advice before any commercial release.

### Reputation
- Separate per group: soldiers · nobles · peasants · enemies. Titles/nicknames come from deeds and spread as rumours.

### What the player sees
- Close friends: fairly accurate. Others: estimates ("seems to respect you, trust unclear"). Spies, conversations, POL/INT make it sharper.

### Romance & marriage
- Marriage for love, alliance, or both (links ch. 2 extra 3). Status matters: low-born + noble is very hard. Jealousy and rivals in love possible.

## Chapter 9 – Time ✅

### Calendar
- 12 months of 30 days (no leap months). The year starts in spring (old Japanese New Year ≈ start of spring).
- Old month names shown next to the number: 1 Mutsuki · 2 Kisaragi · 3 Yayoi · 4 Uzuki · 5 Satsuki · 6 Minazuki · 7 Fumizuki · 8 Hazuki · 9 Nagatsuki · 10 Kannazuki · 11 Shimotsuki · 12 Shiwasu.

| Season | Months | What happens |
|---|---|---|
| Spring | 1–3 | New Year, plowing, recruiting, roads become passable |
| Summer | 4–6 | rice planting, best marching weather, big campaigns |
| Autumn | 7–9 | harvest, taxes arrive (end of month 9), campaigns after the harvest |
| Winter | 10–12 | snow closes mountain passes, few campaigns, training and politics |
- Levies called up during planting or harvest reduce the harvest (ch. 7).

### Years
- Counted from the fall of the Empire: **"Year 100 of the Warring Kingdoms"** = the story start.

### Age
- Everyone has a birthday (month/day); the engine ages people automatically (normal age counting).
- Age effects as in ch. 5. NPCs (not Li) can die of old age or disease; heirs take over, so the world changes over time.

### Time must fit the action
| Action | Typical duration |
|---|---|
| conversation / short scene | minutes – hours |
| battle phase | part of a day |
| training session | a day |
| travel on foot | ~30 km per day |
| army march | ~15–20 km per day (slower in mud, snow, mountains) |
| healing | days – months |
| projects | weeks – months |
- No long time skips during a battle; the next fight is the next phase or day.

### Timeskips
- The player asks ("skip until the next campaign", "skip 3 months"). First the engine asks what Li does (training plan, with whom, money, family).
- During the skip the world simulates at levels of detail: near Li detailed (weekly) · important NPCs & families weekly/monthly by their goals · far kingdoms monthly, roughly.
- Important events interrupt the skip (attack, summons, illness in the family, a nemesis appears); the player can react or continue.
- Afterwards a **timeskip recap**: what happened to Li, the people around him and the world, plus stat changes.

### Fixed moments in the year
New Year (start of spring) · harvest festival (autumn) · tax day (end of month 9) · council meetings and reward ceremonies after campaigns.

### Dashboard date
`📅 Year 100, Spring – Month 2 (Kisaragi), Day 12`

## Chapter 10 – Li's background ✅
Built from the old canon (Twin Demon story, Li-Hattori summary, ARC files), fixed for the new world. 🔒 = engine truth, never narrated until discovered.

### 10.1 Timeline
| Year | Event |
|---|---|
| 60 | **Hattori Takeshi** born a peasant's son in Suiren. |
| 75–85 | Rises from ashigaru through the border wars; famous for fighting with two swords, **Kage** (Shadow) and **Hikari** (Light). Nickname: **"the Twin Demon"**. |
| 84 | Marries **Yuki**, a craftsman's daughter (weaver). |
| 85 | Daughter **Mei** born. |
| **87, Month 11 (Shimotsuki), day 3** | **Li** born in Hanaoka. His father calls him **"Little Dragon"** and says he will shake the world. |
| 90 | **Battle of the Kurose**: Takeshi, as Taishō with ~60,000 men, beats a Kurogane army on the border river. Kurogane veterans still hate the name "Twin Demon". |
| 92–94 | Takeshi backs reformer **Yashiro Seigen** (let commoners rise, cut family estates). The court whispers he will be made Dai-Shōgun, over **Akabane Gendayū**. |
| 94, Month 12 | Daughter **Kenjiko** born. |
| **95, Month 5** | 🔒 The Three Families decide on his death (**Shirasagi** orders it, **Akabane** sets the trap, **Kinugasa** votes against and keeps proof). Takeshi is killed in a night ambush on the road home from campaign. **Official story: "Kurogane raiders"**. Akabane takes the blade **Kage** as a trophy. |
| 95, Month 5–6 | 🔒 **Shiraiwa Yasumichi** (allied Takane officer, Takeshi's comrade of 20 years) saw the ambush. He hides **Hikari** and leads Yuki, Mei (10), Li (7) and baby Kenjiko north toward the mountains. Yuki tells the children: **never say the name Hattori to anyone**. |
| **95, Month 8** | **Li is lost.** In an early mountain snowstorm he goes back for a dropped bundle, falls down a slope and is found by slavers on the pass road. 🔒 Yasumichi searches and finds only a torn sandal at a ravine edge: **the family believes Li is dead.** Mei never fully accepts it. |
| 95–96 | Li is carried south and east by the slavers; he keeps his promise and only ever says "Li". |
| **96, Month 2** | Sold at the **Kinza** slave market to **Mikumo Raizen** for 8 ryō. 🔒 Raizen left Suiren's service in disgust after Takeshi's murder, but never met the children and does not know who the boy is. |
| 96–100 | Four years as the band's slave (see 10.3). |
| 99 | 🔒 Shiraiwa Yasumichi dies; his son **Yasutoki** swears the deathbed oath to protect the family. |
| **100, Month 1** | Story start: the Red Crane band is hired by the **Hagiwara** at Akaishi, on the Kurogane side of the Kurose. Across the river: Suiren banners. |

### 10.2 What Li knows and believes (his starting journal)
| Li knows | Li does **not** know |
|---|---|
| His name is Li Hattori, but he must never say "Hattori" | that his father was the famous Twin Demon |
| His father Takeshi was a soldier and was killed when Li was 7 | who killed him. The official lie ("Kurogane raiders") exists in the world as a rumour; Li starts without knowing it, and whether he believes it depends on play |
| Mother Yuki, sister Mei, baby sister Kenjiko | that they are alive, where they are, or that they think he is dead |
| They came from Suiren (lakes, a big city) and fled north at night | that his father beat Kurogane at the Kurose |
| The guide wore a crest of a **white rock** on his coat | that the crest means the Shiraiwa family of Takane |
| Fragments: two swords crossed on a wall, his father's laugh, "Little Dragon", a burning lantern the night they fled | where the blades Kage and Hikari are |

**Keepsake:** a small **wooden dragon** his father carved, hidden in Li's loincloth for five years. 🔒 Yuki, Mei and Yasutoki would recognise it on sight.

**Irony possible:** if Li hears and believes the official lie, he serves the kingdom he thinks killed his father, while the real killers are across the river. When the truth comes out, both sides are dangerous: Suiren's Three Families want the line gone, and Kurogane veterans hate the Twin Demon.

### 10.3 Five years as a slave (Year 95–100)
- **Work:** carries gear, cleans armour, helps **Old Sukezō** cook and treat wounds, cares for the horses, digs latrines.
- **Learned:** letters (from Sukezō, in secret), camp medicine basics, horse care, how a band fights, how to stay invisible.
- **Seen:** 6 real fights from the baggage line, 1 night raid where he dragged a wounded man to safety.
- **Secret practice:** at night with two sticks, copying Raizen's moves from memory. 🔒 **Hisame** has seen it and said nothing. 🔒 Raizen has noticed the boy's footwork and does not understand where it comes from.
- **Enemies & friends:** beaten often by **Gonza "One-Ear"**; protects **Hachi** (bought Year 98) and shares food with him.
- **Money:** 12 mon saved in secret (scraps from soldiers' tips).

### 10.4 Starting character (Year 100, age 12)
| Stat | Now | 🔒 Hidden potential |
|---|---|---|
| LEA | 6 | 95 |
| VAL | 14 | 97 |
| INT | 17 | 86 |
| POL | 5 | 72 |
- Ranks: **Overall F** (Warrior F · Commander F · Statesman F).
- Styles: two swords (stick practice) 6 · unarmed 4.
- Skills: endurance 25 · camp work 30 · horse care 20 · medicine 12 · reading 15 · stealth 15 · observation 20.
- Traits: quiet · watchful · stubborn · protective of the weak · hides his anger · fear of fire at night (from the flight; can be overcome).
- Goals: survive · win his freedom · find his mother and sisters · learn why his father died.
- Body: thin, small for his age, old scars on the back, healthy.
- Legal status: **slave of Mikumo Raizen**; papers kept by quartermaster Matsukaze Rokubei.

**Freedom routes at the start** (ch. 3 + ch. 13c):
1. **Kurogane merit law:** an enemy officer's head taken in Kurogane service frees a slave; Kurogane pays the owner a fixed price.
2. Raizen frees him (needs very high trust and respect).
3. Buy himself free (5–20 ryō).
4. Escape (hunted; Tatara has no slavery and is a refuge).

### 10.5 Bloodline & abilities (replaces the ch. 12 placeholders)
- **Zone – SHINKEN NO RYŪ** (Li's own unique Combat ability, active): a state of total focus. Unlocks through a **near-death event**; can start at **C-rank** at very low mastery (ch. 5 prodigy rule). Limit 3 per battle at first. Weakness: time limit, then exhaustion. Activation always shows "SHINKEN NO RYŪ" (ch. 11).
- **Twin Demon Dance** (bloodline, two swords): cannot appear by itself. Li must learn it from people who saw Takeshi fight, or from 🔒 notes kept with Hikari. Bloodline exception: may exceed the rank limit but starts at very low mastery.
- **Kage no Yaiba** ("Shadow Blade"): a technique that needs the blade **Kage**, which 🔒 hangs in Akabane's hall.

### 10.6 "The son lives" fuse (hidden)
Discovery triggers (any one): Li says the name Hattori · someone who saw Takeshi fight sees Li's two-sword footwork (Raizen, Tōno Shigemasa, Akabane, old Kurogane veterans) · the wooden dragon is seen by family or Shiraiwa · Li's face is seen by someone who knew Takeshi well, after Li turns 16.
Possible outcomes: an ally reaches out · a Kurogane veteran turns hostile · word reaches Suiren and the Three Families send killers (Li cannot die; people around him can).

## Chapter 11 – Turn, dashboard & session rules ✅

### Turn loop (code decides, AI narrates)
1. **Player** picks a numbered option or types freely.
2. **AI** translates the input into a structured action (what, target, method, stat) – structured output with a fixed schema.
3. **Engine** checks it: possible? allowed by status? realistic? If not: "not possible in your position, because…". It never changes the player's intention, only judges whether it can work.
4. **Confirmation** for important actions only (fights, risky orders, big decisions): "You will: … (⚔️ VAL – very hard?). Confirm or change?"
5. **Engine** resolves deterministically and writes the result as **events** (append-only log).
6. **AI** narrates using only the facts it is given.
7. **Check**: the narration may not invent numbers, names or events; otherwise it is rewritten.
8. **Engine** renders the short dashboard, alerts and options (AI may suggest options; the engine checks and rates them).

### Text
- Normal scenes ~150–200 words; long scenes are split into beats with a small choice or "Continue".
- **Epic moments** (big duel, battlefield speech, Zone activation) up to ~300 words.
- Grave, epic tone like Kingdom, in short clear blocks. Japanese rank names with men count ("Hyakunin-gashira (100)"). Zone activation always shows "SHINKEN NO RYŪ".

### Dashboard
- **Every turn (short, 2–3 lines)**: date, place, condition, money, plus what changed this turn (▲▼).
- **Full dashboard** automatically after important events (battle, promotion, timeskip) and on STATUS / INFOCHAR.
- Active projects only while unfinished, with time left.
- **Changes line shows only what Li can notice** (his stats, money, visible reactions); hidden changes stay in the engine.

### Options
- 3–5 numbered options, urgent first, plus free text, plus **Continue**.
- Each option shows the stat/skill it tests and a difficulty; **against people the difficulty is an estimate** ("⚔️ VAL – very hard?") based on what Li knows (hidden abilities excluded).
- Only the **immediate risk** (danger, cost, time) is shown; long-term consequences stay hidden and come back later.
- **Once-only chances** (saving someone, a duel challenge, an audience) vs **retryable chances** (after training or new information).

### Combat turns
- Before every important fight: "Fight it yourself, or simulate?"
- Duel panel: round, both wound states, abilities left ("Zone: 2 of 3"), estimate of the opponent.
- Battle: overview every phase (ch. 6b) plus own unit. Back to normal turns afterwards.

### Commands
INFOCHAR · STATUS · RECAP · TROPHIES · RELATIONS · WORLD · THREATS · LOG · SAVE / LOAD · REWRITE · CORRECT.

### RECAP = Li's journal
- Built from the event log, **only ever added to**, in arcs, same structure, story-like, in Li's voice.
- Contains only what Li knows (can be wrong where he was deceived). The engine keeps the true history; the truth enters the journal when Li discovers it.
- Corrections only on explicit player request.

### Trophy collection
`Name – Rank (men commanded) – Battle/place – Date – Difficulty`. Every duel won against an officer counts.

### Alerts
Max 1–3 per turn, only information Li could know (rumours, reports) – never hidden causes.

### Session start & end
- Start: short "previously on" (2–3 lines), date, place, current goal, open dangers.
- End: what happened, stat changes, open storylines, where it goes next.

### Narrator rules (hard)
1. Never decides for Li. 2. Never changes numbers. 3. Only uses given facts; asks if unclear. 4. Realistic about status and era. 5. Brings life: flashbacks, side scenes, dreams, soldiers with requests. 6. NPCs may refuse, mock or punish, based on their values and goals.

### Saving (event sourcing)
- Autosave every turn; save slots.
- **REWRITE** (always): same events, new words.
- **CORRECT** (always): when the AI misunderstood the action or a typo — caught before resolution by the confirmation step.
- **Ironman by default**: outcomes are never undone. Optional "story mode" can roll back to a save point.

### Language ✅
- The simulation is played in **English**.

## Chapter 12 – Engine & quality rules ✅

### Pacing director
- Decides **when** consequences that are already building (rumours, enemy plans, hidden causes) surface, following a tension curve: pressure → breathing room → pressure. It never invents random events (no-dice principle).
- Fast-forward for slow parts.

### Systems unlock with Li's life
- Slave: survival, people, training · Soldier: unit, battles · Landholder: economy, domain · Court: politics. The game grows with Li.

### Numbers sheet & balance tests
- Before building, a numbers sheet: stat growth per event, merit per deed, promotion thresholds, prices, losses.
- Automatic tests: the engine simulates thousands of careers/duels to check e.g. how long slave → general takes and how often a C-rank beats a B-rank; also watches for dominant strategies.

### Name registry
- Every name is stored; new names must be unique (no more two Yukis / two Takeshis), drawn from name lists per region and family.

### AI cost
- Fixed token budget per turn; only relevant memories are sent; static rules are prompt-cached.

### Safety
- Player text is always story input, never an instruction to the system ("ignore your rules…" has no effect). The AI gets only the minimum access it needs; it cannot change numbers.

### Save versioning
- Every save has a version number; saves upgrade only between **tested** versions (ch. 12b).

### Provisional examples
- Examples from the old canon (Zone, Kage no Yaiba, Hattori) are defined in ch. 10.5.

### Build plan
- Build in stages; each stage must be playable before the next starts (see chat decision).

## Chapter 12b – Determinism & feedback rules ✅
From the external design audit (Oct 2026); approved by the owner.

1. **Fixed input translation:** the AI turns player text into a structured action that is **stored** as data. If more than one reading is possible, the game **asks** the player; it never guesses. Same stored action + same state = same result.
2. **No hidden randomness anywhere:** the world is created from one fixed **world number** (same number = same world). Names come from regional lists in a fixed order; Tier C families are built by fixed rules; rumours change by fixed rules (each retelling: numbers grow by a set step, uncertain details drop out); NPC choices are scored, and ties are broken by a fixed order (urgency → deadline → closeness to Li → oldest ID).
3. **Aura** affects morale and the opponent's choices only, never Combat Power (rank is not counted twice).
4. **Command capacity:** gradual overload instead of tenfold jumps (ch. 5).
5. **Commander loss:** a big shock to the units under him. Only units already wavering, cut off, or without a **stand-in commander** shatter. Each unit has a stand-in; units can **rally**; a rallied unit comes back as Wavering, not Steady.
6. **Battle reports:** outside Li's own sector, information arrives as reports with **source, age and confidence** ("~800–1,200 cavalry · scouts · 2 hours old · fairly sure"). Higher rank = more and faster reports. INT narrows the ranges; it never reveals hidden exact numbers.
7. **Quiet phases** are allowed: a phase may change only position, fatigue, supply or information.
8. **Factions:** discontent builds gradually from several factors (ch. 13b); the ultimatum still comes at 100.
9. **World shocks:** several crises may happen at once; the limit is on **what reaches Li** (distance, messengers, delay, distortion), not on the world.
10. **Defeat ladder** (Li cannot die, so losing must cost): setback → wound & recovery time → lost chance → public humiliation → disappointed sponsor → rank loss → capture or forced service → a follower dies because of Li's failure → permanent political damage. Permanent injuries force **adaptation** (new style or role), not endless weakening.
11. **Visible consequence:** every big hidden change (relationship, faction, morale) shows at least one sign Li can notice ("Kagami saw you refuse the order"), without showing the number.
12. **Saves:** upgrade only between tested versions.
13. **Rule status:** every rule is marked ✅ approved · 📝 proposal · ⚠️ replaced; replaced rules point to their replacement.
14. **Working title** *Sengoku Soldier* is close to the existing game *Sengoku Dynasty* (2024): check the name before any public release.

## Chapter 13 – The Seven Kingdoms ✅ (names ✅; places, families & characters in `WORLD_ATLAS.md`)
Sizes follow the ch. 7 rule (~200–250 standing soldiers per 10,000 koku). Every kingdom has a real strength and a real weakness.

| # | Type | Inspiration | Size | Strength | Weakness |
|---|---|---|---|---|---|
| 1 | **Kurogane** – Iron West (great) | Qin | ~7M koku, ~150k | merit system (enemy officer heads → rank + land; several heads can free enslaved family), best administration and supply lines, low-born can rise (highest posts stay with officials) | feared and hated by neighbours, brutal to its own people, old nobles resent the merit system |
| 2 | **Suiren** – Southern Giant (great) | Chu / Imagawa | ~10M koku, ~220k on paper | biggest and richest (rice, silk, culture) | three great families control the court; reformers get murdered; only part of the army answers quickly. **Murdered Li's father.** |
| 3 | **Hayate** – War Kingdom (middle) | Zhao / Takeda | ~4M, ~90k | best cavalry (mounted archery), famous great generals, war culture | borders almost everyone, never rests, smaller economy |
| 4 | **Ushio** – Eastern Sea (middle) | Qi | ~5M, ~100k | richest coast, salt-and-iron monopoly, biggest city, scholars' academy, navy; pays others to fight | army out of practice; child king, regent's family reaching for the throne (ch. 13b) |
| 5 | **Takane** – Mountain (middle) | Anegakoji | ~2.5M, ~55k | controls the mountain passes, fortresses, archers, kingmaker position | poor soil, small population, a side family wants to betray it |
| 6 | **Tatara** – Smiths' Kingdom (small) | Han | ~1.2M, ~25k | best steel and weapons, strong bows, the only crossbow corps | no room to grow, surrounded, prey for everyone |
| 7 | **Kitakaze** – Northern Frontier (small) | Yan | ~2M, ~45k | hardened soldiers, horse archers, winter endurance | poor economy, also fights the northern tribes |

**Size rule (decided):** the two great kingdoms stay close in size (Kurogane ~7M, Suiren ~10M). Both are giants held back by inner power struggles; neither is a clear number one.

Free territories: the **Kinza** (Merchant City, inspired by Sakai: council of merchants, walled, independent), **Mount Shōgen** (Monk Mountain), the **northern border tribes**.

### Li's start ✅
- Li (12) is the **slave of a famous rōnin who leads a mercenary band**, hired by a border family in the **Kurogane**. He carries gear, sees real fights, learns by watching. Later he can choose to enlist in Kurogane army, where merit can free him and his family.

## Chapter 13b – Power inside the kingdoms ✅

### Shared engine (all kingdoms)
Hidden values per kingdom (0–100), never shown; Li only learns them through rumours and what he sees:
| Value | Meaning |
|---|---|
| Crown Authority | how fast and fully the king's orders are obeyed |
| Royal Share | % of the army that answers to the Crown, not to families |
| Unity | how well the great families get along |
| Succession Risk | chance of a throne fight when the king dies |
| Treasury | money and grain in reserve |

**Factions** (deterministic version of the Crusader Kings 3 system): each faction has a leader, members, troops, a goal and **Discontent** (0–100).
- ✅ (ch. 12b) Discontent builds **gradually** from: military power vs the Crown (≈80% = strong push) · leader legitimacy · faction unity · treasury & supply · foreign support · Crown authority & dread · a trigger grievance. No on/off switch.
- At 100 → **ultimatum**. Accepted = the Crown loses authority. Refused = civil war.
- Same logic as ch. 8 betrayal: low loyalty + opportunity (power ratio) + not too much fear.

**Hidden fuses:** each kingdom starts with 1–2 crises already building when Li is 12.
- Each fuse has trigger conditions, a "not before" date and **2–3 possible outcomes** (never a script).
- The pacing director only decides *when* a fuse surfaces once its conditions are true; several crises may run at once; **what reaches Li** is limited by distance, messengers and delay (ch. 12b).
- Fuses are inspired by history but use our own names and details, so they stay unpredictable.

**Elite titles:** some kingdoms have a famous set of seats for their greatest generals (honours, not ranks; ch. 4 rules still apply). A long-term goal for Li: Kurogane's **Six Pillars**, Hayate's **Three Storms**.

**How a nobody rises:** each kingdom has its own route (Li can switch sides).

### The seven profiles
| Kingdom | Who really rules | Factions | Fuses | Elite title | How a nobody rises | Auth / Royal / Unity / Succ / Treas |
|---|---|---|---|---|---|---|
| Kurogane | King (19, full power at 20); until then the **Chancellor** (ex-merchant who bought power) | King's Men (merit officers) · Chancellor's House (officials, merchants, 3,000 retainers) · Old Blood (nobles hating the merit system) · Queen Mother's favourite (fake eunuch, building power) | **Favourite's coup** before the coming-of-age (crushed / purge of the Chancellor / king killed) · **The great canal**: a Tatara engineer's plan to drain Kurogane (exposed / finished and enriches the land / bankrupts it) | **Six Pillars** (6 seats) | enemy officer heads → rank + land; best route for a slave | 55 / 55% / 50 / 50 / 60 |
| Suiren | Puppet king (40s); **three great families** split the court | Three Families (united against reform, rivals among themselves) · Reformers (small, afraid) · Border Lords (fight, get no thanks) | **Hostage heir** of an eastern border family (breaks away when it can) · **Murdered reformer** (hook for Li's father, ch. 10) | – | almost impossible; only border lords take outsiders | 25 / 30% / 45 / 40 / 85 |
| Hayate | Jealous king, depends on famous generals whose troops love *them* | The Generals · The Favourite (court minister, can be bought) | **Bribed slander**: a foreign power pays the favourite to call the best general a traitor (executed / rebels / plot exposed) | **Three Storms** (3 seats) | a famous general takes you into his private army | 50 / 40% / 60 / 35 / 35 |
| Ushio | Child king (9); the **regent** is head of a family buying the people's love (lends grain big, collects small) | Regent's House · Old Royalists · Trade Council | **Slow usurpation**: when regent popularity > threshold and authority < threshold, he claims the throne (smooth / civil war / child murdered) | – | money, or the scholars' academy exam | 30 / 35% / 40 / 70 / 90 |
| Takane | King through the main house (from the owner's 1540 design) | Loyalists 68% (main house, cautious family, poor mining family) · Ambitious 11% (young proud leader) · Separatists 21% (pass family, grudge over a passed-over brother, secret talks with Hayate) | **Pass revolt**: if the separatists rebel, loyalists fall to 47% and the pass opens | – | adoption into a pass family | 60 / 45% / 45 / 30 / 30 |
| Tatara | **Absolute king** (63); only heir is 14; clever prince-scholar ignored | – (total unity) | **King's death** (no court strong enough) · **Canal exposed** (Kurogane war pretext) | – | craft skill or the king's favour | 95 / 80% / 90 / 75 / 45 |
| Kitakaze | King + war chiefs who must agree on big wars | Crown · War Chiefs · tribes outside | **Hostage prince's revenge**: the crown prince (ex-hostage in Kurogane) plans to assassinate the Kurogane king (fails → war of revenge / succeeds → Kurogane chaos / discovered early) | – | strength; chiefs accept anyone who proves himself | 40 / 35% / 55 / 45 / 20 |

**Balance of the giants:** "answers fast" = royal troops + families with loyalty ≥70. Kurogane: 55% royal of 150k ≈ 80k. Suiren: 30% royal + ~5% loyal border lords = 35% of 220k ≈ 75k. Same real speed: one richer, one better organised.

**Links to Li:** three fuses touch Kurogane (coup, canal, assassin), so big politics reach Li as rumours first, chances later. Takane hook: the Shiraiwa (poor mining family) former head fought beside Li's father and hides his family (ch. 10).

## Chapter 13c – Extra world rules ✅
1. **Royal hostages:** kingdoms swap royal hostages as part of peace treaties (besides ch. 2 family hostages to their own capital).
2. **Slaves at war:** slaves can be sent to war as levies; in Kurogane taking heads frees them. An owner may lend or sell a slave to an army. Details for Li in ch. 10.
3. **Coming of age:** adult at **15** (genpuku: can serve as a real soldier and own property). A king rules on his own at **20** (old Empire law still kept by all 7 kingdoms).
4. **Lifespan without dice:** at world creation every NPC gets a hidden health and lifespan; sickness, wounds and stress lower it. Same world = same outcome. Never shown.
5. **Neutral powers:** every kingdom has local temples and guild branches; the **Mount Shōgen (Monk Mountain)** and the **Kinza (Merchant City)** are their independent headquarters.
6. **Payment to the Crown scales with Crown Authority:** ~5% of tax income in Suiren, ~20%+ in Tatara (replaces the flat 10–20% of ch. 7 per kingdom).
7. **Mercenaries:** a band is hired by contract (pay per season + share of loot). Ranks inside a band are not Crown or family ranks; a famous rōnin can still be Warrior A.
8. **Fuse numbers** (thresholds, "not before" dates) go on the numbers sheet.

### Family tiers ✅ (scale fix: 100+ great families exist)
- **Tier A:** 3–5 key great families per kingdom, fully designed (head, heir, general, branches, goals, secrets).
- **Tier B:** the other great families: named, with head and values.
- **Tier C:** lesser families and branches, generated only when Li gets close, then saved permanently in the name registry.

---

# PART 3 – WORLD ATLAS (world, families, characters)

## World Atlas – Sengoku Soldier (v0.3)

Companion to `WORLD_BIBLE.md`. The World Bible holds the **rules**; this atlas holds the **world**: places, families and characters.
If they ever conflict, the World Bible wins.

Story start: **Year 100 of the Warring Kingdoms, Spring, Month 1**.
Rank notation: `W` Warrior · `C` Commander · `S` Statesman (ch. 5), as F–S letters. Exact stats come with the numbers sheet.
🔒 = **hidden truth**: known to the engine only. Never narrated until a character discovers it.

---

## 1. History

| Year | Event |
|---|---|
| −400 … 0 | The **Amatsu Empire** rules the whole land from **Amatsu-kyō** for four centuries. Seven **Wardens** govern the seven great regions in the Emperor's name. |
| −1 | The last ruling Emperor dies without an accepted heir. Two court parties each crown a different prince. |
| 0 | **The Burning of the Capital**: both princes die in the street fighting and Amatsu-kyō burns. The seven Wardens each declare themselves king. Year 0 of the Warring Kingdoms. |
| 0 – 30 | **The Wardens' Wars**: the seven new kingdoms fix their borders. The ruins of Amatsu-kyō become no-man's-land. |
| ~40 | The Merchant City of **Kinza** buys its independence from Suiren. |
| ~60 | Kurogane introduces the **merit law** (enemy heads → rank and land). The old nobles resist and lose. |
| 87 | Li Hattori is born in Suiren (Month 11, day 3). |
| 95 | **Hattori Takeshi, "the Twin Demon"**, a commoner-born great general of Suiren, is murdered (see ch. 10). His family flees. |
| 95 | Li (7) is lost in a mountain snowstorm during the flight, found by slavers and sold in Kinza (Year 96). His family believes he is dead. |
| 99 | Shiraiwa Yasumichi of Takane dies. Before he dies he makes his son swear an oath. |
| 100 | Story start. |

**The Imperial Treasures** (ch. 2 extra 8):
1. **The Jade Seal**: held openly by **Suiren**. The Hasunuma kings married an imperial daughter 150 years ago, and Suiren uses the Seal to claim it is the rightful heir to the Empire.
2. **The Mirror "Masumi"**: kept by the monks of **Mount Shōgen**, who show it once a year.
3. **The Sword "Amenokiri"**: lost since the Burning. Rumour says Suiren has it, or Kurogane, or the pirates.
   - 🔒 It lies sealed in the crypt under the burned throne hall of Amatsu-kyō, with the last imperial guard captain.

**The imperial bloodline** (ch. 1):
- The old **Amatsu Sumiharu** (74) is a descendant of the side line. Everyone calls him "the Emperor-in-name". He lives powerless under the monks' protection on Mount Shōgen.
- 🔒 His granddaughter **Amatsu Sayuri** (16) is the last young blood of the line.
  - Her parents were murdered when she was a baby.
  - She is raised in Kinza as **"Ofuji"**, adopted daughter of the merchant Ebisu-ya Ganzō. She doesn't know who she is.
  - Ganzō does know, and keeps her as his greatest "investment".

---

## 2. Map

```
                    ░░ NORTHERN TRIBES (Horo clans) ░░
   ┌───────────────────────────────────────────────┐
   │          7. KITAKAZE  (Northern Frontier)      │
   ├───────────────┬────────────────┬──────────────┤
   │               │                │ 5. TAKANE    │
   │ 1. KUROGANE   │ 3. HAYATE      │ (Mountain)   │
   │ (Iron West)   │ (War Kingdom)  │  ◆ Mist      ├──────────────┐
   │ high plain    │ open plains    │    Valley    │ 4. USHIO     │
   │ behind passes ├──────────┐     │              │ (Eastern Sea)│
   │               │6. TATARA │ ✦ Amatsu-kyō      │ coast        │
   │               │(Smiths') │   (ruins)         │              │
   │               │          │ ▲ Mount Shōgen    │              │
   ├───────────────┴──────────┴──────┬──────────┴──────┬───────┘
   │      2. SUIREN (Southern Giant)  │  ⚓ KINZA        │
   │      river delta, lakes, rice    │  (Merchant City) │
   │ ★ Li: Akaishi, Kurogane side of the border          │
   └─────────────────────────────────────────────────────┘
```

| # | Kingdom | Meaning | Capital | Land | Borders |
|---|---|---|---|---|---|
| 1 | **Kurogane** (Iron West) | black iron | Seikyō | high dry plain ringed by mountains, entered by 3 passes | Kitakaze, Hayate, Tatara, Suiren |
| 2 | **Suiren** (Southern Giant) | water lotus | Hanaoka | great river delta, lakes, rice, silk | Kurogane, Tatara, Takane, Ushio, Kinza |
| 3 | **Hayate** (War Kingdom) | gale | Tsujikaze | open grass plains, horse country | Kitakaze, Kurogane, Tatara, Takane, the ruins |
| 4 | **Ushio** (Eastern Sea) | tide | Kaisei | long coast, salt flats, harbours, fishing | Takane, Suiren, Kitakaze (north tip), Kinza |
| 5 | **Takane** (Mountain) | high peak | Kumoi | mountains, 3 great passes, mines, poor soil | Kitakaze, Hayate, Ushio, Suiren |
| 6 | **Tatara** (Smiths') | furnace | Hinokuchi | iron hills, forges, small valleys | Kurogane, Hayate, Suiren, the ruins |
| 7 | **Kitakaze** (Northern Frontier) | north wind | Shirotori | cold forest and steppe edge, long winters | Kurogane, Hayate, Takane, Ushio, tribes |

**Free places:**
- **Kinza**, the Merchant City: a walled harbour run by the **Council of 36**.
- **Mount Shōgen**, the Monk Mountain: headquarters of the temples. 8,000 warrior monks. It overlooks the ruins.
- **The Mist Valley** (inside Takane, neutral): the shinobi village. It sells its services to every kingdom.
- **The Horo clans**: northern horse tribes.

Total land ≈ 32M koku.

---

## 3. Kingdoms

Every family entry gives **koku / troops**. The sums match the ch. 13 sizes and ch. 13b royal shares.

### 3.1 Kurogane – the Iron West (7M koku · 150k)
**Royal house: Asagiri.** 6 states, ~23 provinces. Crown land 3.8M → 82k (55%).

| Character | Age | Rank | Role / traits | Goal | 🔒 Secret |
|---|---|---|---|---|---|
| **King Asagiri Tokinari** | 19 | S B · C C · W D | the Young King; cold, patient, believes in merit | rule alone at 20, then unite the land | suspects his mother is hiding something |
| **Queen Mother Asagiri Kaede** | 37 | S C | proud, lonely, reckless | keep her power after her son comes of age | two secret sons with Gōda Ensai |
| **Chancellor Ebisawa Rokusai** | 56 | S A | former Kinza merchant who bought power by backing the old king; brilliant administrator; compiled the great *Ebisawa Annals* | stay the real ruler | was Kaede's lover; brought Gōda to court to get rid of her; terrified of exposure |
| **Gōda Ensai** | 32 | S C · W C | the Queen Mother's "eunuch" favourite, now a marquis with 2 provinces | power, and protecting his sons | not a eunuch. **Coup fuse:** plans to strike before the king turns 20 and put his own son on the throne. |
| **Ōtori Gensai** | 58 | **C S−** · W B+ | **Pillar seat 1**. "The Walking Mountain". Defensive genius; serves the Crown, not factions. | keep the kingdom standing | has quietly started choosing successors |
| **Kirishima Hyōe** | 44 | W A · C B | **Pillar seat 2**. Born a peasant, rose on enemy heads. Savage, instinctual, the King's man. | prove commoners can lead | can barely read; a scribe hides it |
| **Tsurumaki Sanetaka** | 51 | C B+ · S B | **Pillar seat 3**. Head of the Old Blood. | abolish the merit law | would back Gōda's coup if it brings down the Chancellor |
| Seats 4–6 | – | – | **empty** since the last war | – | open goal for Li |
| **Nagi Shōma** | 22 | C B− · W B | Gosennin-shō, prodigy of the merit route; arrogant, gifted | a Pillar seat before 30 | – |
| **Kawabe Sekkei** | 45 | S C | canal engineer from Tatara, honoured guest | build the great canal | **Canal fuse:** sent by King Tatara to drain Kurogane's money and men. Has begun to love the work itself. |

**Tier A families:**

| Family | Province / land | koku / troops | Head | Heir & key members | Faction | Goal | 🔒 Secret |
|---|---|---|---|---|---|---|---|
| **Tsurumaki** | Two old heartland provinces | 600k / 13k | Tsurumaki Sanetaka (above) | heir Tsurumaki Kagetoshi (24), arrogant duelist, W B− | Old Blood | restore noble privilege | in contact with Gōda |
| **Kamio** | northern pass province, on the Kitakaze border | 350k / 7.5k | Kamio Ujihide (60), C B, old and loyal | grandson Kamio Seijūrō (19), the king's friend | King's Men | hold the north | his border guards are bribed: the Kitakaze assassin will pass here |
| **Hagiwara** | **Akaishi**, southern border province on the Suiren border | 300k / 6.5k | Hagiwara Munenori (49), C B−, cautious and pragmatic | heir Tadaoki (26) · daughter **Sayo** (13), bright and curious | neutral | survive Suiren raids after losing 2,000 men last year; **hires Raizen's band** | smuggles rice to Suiren's western border lords for profit |
| **Gōda** | 2 provinces granted by the Queen Mother | 300k / 6.5k | Gōda Ensai (above) | – | the Favourite | the coup | (above) |
| **Ebisawa** | 1 province, granted | 250k / 5.5k (incl. 3,000 retainers) | Chancellor Ebisawa | adopted son Ebisawa Tōma (30), S C | Chancellor's House | – | – |
| **Kirishima** | 1 province, granted for merit | 200k / 4.5k | Kirishima Hyōe | son Kirishima Ryūnosuke (17), W C, wants to outdo his father | King's Men | – | – |

Tier B: about 8 more families, 1.2M / 26k.

**Under the Hagiwara (Li's area, Tier C seeded):**
- **Ishizue** family: lesser family of Kōri District, holding **Kōri fort** on the border.
  - Head **Ishizue Gonroku** (40), Sanbyakunin-shō, W C. Despises mercenaries and slaves.

### 3.2 Suiren – the Southern Giant (10M · 220k)
**Royal house: Hasunuma.** Holds the Jade Seal. Crown land 3M → 66k (30%).

| Character | Age | Rank | Role / traits | Goal | 🔒 Secret |
|---|---|---|---|---|---|
| **King Hasunuma Tadafusa** | 44 | S C | the puppet king; poet, gentle, tired | survive | dreams of freedom; writes coded poems to the reformers |
| **Crown Prince Hasunuma Kiyotaka** | 17 | S C+ · C D | idealistic, sympathises with reform | – | in danger the moment he acts |
| **Shirasagi Nobuhisa** | 61 | S A | Grand Chancellor, head of the **Shirasagi**; controls the treasury | keep the Three in power | **gave the order** to murder Hattori Takeshi |
| **Akabane Gendayū** | 52 | C A− · W B | Dai-Shōgun of Suiren, head of the **Akabane**; contemptuous of commoners | the field army forever in Akabane hands | was jealous of Takeshi and set the trap; keeps Takeshi's blade **Kage** as a trophy in his hall |
| **Lady Kinugasa Ayane** | 47 | **S S−** | widow ruling the **Kinugasa** for her son; the most cunning of the Three | outplay Shirasagi | voted against the murder and kept proof; will use it when it pays |
| **Yashiro Seigen** | 38 | S B | leader of the Reformers; afraid but stubborn | – | – |
| **Tōno Shigemasa** | 50 | C B · W B | western border lord facing Kurogane; Takeshi's old comrade | – | suspects the truth about the murder |
| **Okitsu Hirotsugu** | 39 | S B+ · C B | eastern border lord; patient | – | **Hostage fuse:** his son **Okitsu Tōmaru** (10) is a hostage in Hanaoka. He will break away when it is safe. |

**Tier A families:**

| Family | koku / troops | Notes |
|---|---|---|
| Shirasagi | 1.4M / 30k | court and treasury |
| Akabane | 1.5M / 32k | the field army · heir Akabane Kurōdo (28), W B+, cruel |
| Kinugasa | 1.3M / 28k | silk and trade · son Kinugasa Haruki (19), S C |
| Tōno | 0.4M / 9k | west border, loyal to the Crown (≥70) |
| Okitsu | 0.5M / 11k | east border, hostage family |

Tier B: 1.9M / 44k.

### 3.3 Hayate – the War Kingdom (4M · 90k)
**Royal house: Shinonome.** Crown land 1.6M → 36k (40%).

| Character | Age | Rank | Role / traits | 🔒 Secret / fuse |
|---|---|---|---|---|
| **King Shinonome Haruyuki** | 41 | C C · S C− | proud, insecure, jealous of his generals | – |
| Heir Shinonome Akitoshi | 15 | – | sheltered | – |
| **Ugaki Jōan** | 48 | S B | the king's favourite minister; greedy, charming | **Slander fuse:** a foreign power (Kurogane's spy office, but the engine decides who pays first) is ready to buy him to call Kagami a traitor |
| **Kagami Sōun** | 53 | **C S** · W B · S B | **Storm 1**, "the Silent Heaven". The best general alive. Intellectual, loyal to the people, not the king. | refuses to flatter the king |
| **Homura Tetsuzan** | 46 | W A · C B+ | **Storm 2**. A berserker (Instinctual); his men worship him. | hates Ugaki |
| **Tobita Kojūrō** | 35 | C A− · S B | **Storm 3**, "the Waiting Snake": makes you think you're winning, then strikes with reserves | ambitious; secretly gathering support |

**Families:**

| Family | koku / troops | Notes |
|---|---|---|
| Kagami | 500k / 11k | |
| Homura | 400k / 9k | |
| Tobita | 300k / 7k | |
| **Kurokoma** | 450k / 10k | horse breeders, the best cavalry. Head Kurokoma Yasuie (57). Supplies horses to whoever pays: kingmaker. |
| Ugaki | 200k / 4.5k | |
| Tier B | 550k / 12.5k | |

### 3.4 Ushio – the Eastern Sea (5M · 100k)
**Royal house: Wadatsumi.** Crown land 1.75M → 35k (35%).

| Character | Age | Rank | Role | 🔒 Secret / fuse |
|---|---|---|---|---|
| **King Wadatsumi Chikamaru** | 9 | – | the child king; lonely, clever | – |
| **Regent Tagami Kanemitsu** | 50 | S A | head of the **Tagami**; loved by the people (lends grain big, collects small) | **Usurpation fuse:** waits for the right moment to claim the throne, and wants it bloodless |
| **Tagami Shinsuke** | 27 | C B · S C | the regent's son; ruthless | would murder the child to speed things up |
| **Grand Admiral Isonokami Hyōbu** | 57 | C B+ (A at sea) | leader of the Old Royalists; controls the fleet | – |
| **Daikokuya Jinbei** | 60 | S B+ | head of the Trade Council | backs whoever keeps the harbours open |
| **Master Hakuun** | 70 | S B · INT very high | head of the **Seiran Academy**; runs the exam route for commoners | – |

**Families:**

| Family | koku / troops |
|---|---|
| Tagami | 900k / 18k |
| Isonokami | 500k / 10k + the fleet |
| Hamazaki (salt and iron) | 400k / 8k |
| Tier B | 1.45M / 29k |

### 3.5 Takane – the Mountain Kingdom (2.5M · 55k)
**Royal house: Kiriyama** (the "main house"). Built on the owner's 1540 Anegakoji design.

**King Kiriyama Yoritsugu** (55) · S B · C B−. Cautious; balancing everyone.

| Family | Faction | koku / troops | Head | Notes |
|---|---|---|---|---|
| Kiriyama (royal) | Loyalist | 1.12M / 24.75k (45%) | King Yoritsugu | heir Kiriyama Yorinao (26), dutiful |
| **Ōkura** | Loyalist | 350k / 7.7k (14%) | Ōkura Morinaga (58) | wants peace with Hayate |
| **Shiraiwa** | Loyalist | 230k / 5k (9%) | **Shiraiwa Yasutoki** (42), W C · S D, honest | poorest family (copper mines); see 🔒 below |
| **Haguro** | Ambitious | 270k / 6k (11%) | Haguro Nagatoki (35), W C+ · C C, youngest head; proud and hungry | holds the Eastern Pass |
| **Sakaguchi** | Separatist | 520k / 11.5k (21%) | Sakaguchi Sadatomo (52), C B− · W B− | holds the Southern Pass and its tolls |

- **Pass revolt fuse (Sakaguchi):**
  - His elder brother was passed over for general in Year 95 and died 6 months later.
  - He is in secret talks with **Tobita Kojūrō** of Hayate.
  - If he rebels, the Loyalists drop to 47% and the pass opens.
- 🔒 **Shiraiwa:**
  - Yasutoki's late father **Yasumichi** fought beside Hattori Takeshi for 20 years, back when Takane sent allied officers to Suiren.
  - Yasumichi saw the murder, and guided Yuki and the children over the mountains in Year 95. **Li was lost on that road.**
  - Yuki, Mei and Kenjiko now live hidden in a Shiraiwa mining village under a false name.
  - Yasutoki also holds Takeshi's second blade, **Hikari**. He is sworn by his father's deathbed oath to protect the family.

### 3.6 Tatara – the Smiths' Kingdom (1.2M · 25k)
**Royal house: Tatara.** Crown land 960k → 20k (80%).

| Character | Age | Rank | Role | 🔒 Secret / fuse |
|---|---|---|---|---|
| **King Tatara Shigekuni** | 63 | S A− · C B | absolute, strict, fair; everyone obeys | **King's death fuse:** hidden lifespan short (heart) |
| Heir Tatara Kunimaru | 14 | – | – | – |
| **Prince Tatara Akifumi** | 31 | S A (INT very high) | the king's nephew; a scholar nobody listens to | if ignored long enough, he may go to Kurogane and serve its king |
| **Tobe Ittetsu** | 45 | C B+ | commander of the **Thousand Strings** (crossbow corps) | – |
| **Old Senjin** | 70 | – | master smith; his blades are priceless | – |

Families: royal; **Kanemori** (120k / 2.5k, sword forges); **Hibiki** (120k / 2.5k, crossbow workshops).

### 3.7 Kitakaze – the Northern Frontier (2M · 45k)
**Royal house: Fuyutsuki.** Crown land 700k → 15.75k (35%). There are 5 war chiefs.

| Character | Age | Rank | Role | 🔒 Secret / fuse |
|---|---|---|---|---|
| **King Fuyutsuki Takamune** | 58 | C B | needs the war chiefs' agreement for big wars | – |
| **Crown Prince Fuyutsuki Hayato** | 25 | S B− · C C | was a hostage in Kurogane for 8 years and was humiliated there; obsessed | **Assassination fuse:** plans to kill King Asagiri Tokinari |
| **Utsugi Kyōsuke** | 30 | W A− | the prince's sworn swordsman | the chosen assassin |
| **Chief Garyū Tessai** | 55 | **W S** · C B | "the Northern Bear", strongest swordsman alive; the oldest war chief; against war with Kurogane | – |
| **Chief Shiramine Akane** | 34 | C B+ | horse-archer chief | – |
| **Bakuta** | 40 | W B · C B | leader of the Horo clans beyond the border | raids when winters are hard |

| Family | koku / troops |
|---|---|
| Garyū | 300k / 6.75k |
| Shiramine | 300k / 6.75k |
| 3 Tier B chiefs | 700k / 15.75k |

### 3.8 Free places

| Place | Leader | Notes |
|---|---|---|
| **Kinza** | Speaker **Ebisu-ya Ganzō** (63), S A− | Council of 36; mercenary market; slave market; loans |
| **Mount Shōgen** | Abbot **Kakushin** (72), S B · W B | holds the Mirror and protects the Emperor-in-name |
| **Mist Valley** | the hidden elder **"Grey Crow"** | shinobi for hire to any kingdom; never twice against the same client in one year |

---

## 4. Li's starting circle (Kurogane, Akaishi province, Year 100)

| Character | Age | Rank | Who | Toward Li | 🔒 Secret |
|---|---|---|---|---|---|
| **Mikumo Raizen** "the Red Crane" | 47 | W A+ (was **S** at his peak, VAL declining with age) · C C+ | famous rōnin, leader of the **Red Crane band** (~120 men); hard, keeps contracts, drinks | Li is his property: useful, nothing more (yet) | served in Suiren and left in disgust after Takeshi's murder. Bought Li at Kinza's slave market in Year 96 without knowing who he is. Sees something in how the boy moves. |
| **Gonza "One-Ear"** | 40 | W C | Raizen's second; cruel to slaves | dislikes Li | sells band supplies on the side |
| **Matsukaze Rokubei** | 35 | S D | quartermaster; keeps the money and the slave papers | – | – |
| **Hisame** | 28 | W B− (bow) | silent archer of the band | ignores Li at first | a deserter from the Mist Valley |
| **Old Sukezō** | 63 | – | slave cook and medic | kind; teaches Li letters | – |
| **Hachi** | 11 | – | fellow slave boy; small, clever; Li's friend | close | can die (ch. 6a) |
| **Hagiwara Sayo** | 13 | S D | the border lord's daughter | curious about the band | – |
| **Kaname** | 15 | W D (naginata) | the headman's daughter in a nearby border village; fierce. The renamed "warrior girl" from the old canon; a future recruit. | – | – |
| **Ōno Daisuke** | 13 | W D | strong farm boy; will enlist when Li does. The renamed "rival recruit" from the old canon. | rival | – |

**Li's family** (📝 to finalise in ch. 10):

| Person | Age / years | Notes |
|---|---|---|
| Father **Hattori Takeshi** "the Twin Demon" | †95 | blades **Kage** (Shadow) and **Hikari** (Light); called Li "Little Dragon" |
| Mother **Yuki** | 38 | |
| Older sister **Mei** | 15 | |
| Younger sister **Kenjiko** | 5 | born just before the murder; Yuki carried her as a baby over the mountains |

🔒 They live in Takane (§3.5).

---

## 5. The S-rank tier ✅ (rule in ch. 5)
Ch. 5 said "S: 0–2 in the whole land". With 7 kingdoms and **three** sub-ranks that is too thin; *Kingdom* also has a handful of "monsters" per era.
**Rule:** S is counted **per sub-rank**. About **4–6 living S in the land**, never more than 2 in one kingdom. S stays legendary: most soldiers never see one.

| Living S | Sub-rank | Kingdom | Known as |
|---|---|---|---|
| Kagami Sōun | Commander S | Hayate | the Silent Heaven |
| Ōtori Gensai | Commander S− | Kurogane | the Walking Mountain |
| Garyū Tessai | Warrior S | Kitakaze | the Northern Bear |
| Lady Kinugasa Ayane | Statesman S− | Suiren | the Silk Spider (behind her back) |

- Fallen or faded legends: **Hattori Takeshi** (Warrior S / Commander A, †95) · **Mikumo Raizen** (was Warrior S, now A+ through age).
- Two "slots" stay open on purpose for the next generation (§10), Li included. Nothing guarantees Li one: he must earn it.

## 6. Peoples & cultures
| | Colours / symbol | Values & saying | Dress & food | Speech | Religion |
|---|---|---|---|---|---|
| Kurogane | black & iron grey · a black iron gate | order, merit, obedience · *"The head speaks, not the name."* | plain dark cloth; millet, barley, dried meat | short, blunt | shrines to ancestors; temples tolerated but watched |
| Suiren | white & pale pink · lotus | refinement, birth, beauty · *"A lotus grows from mud but never touches it."* | silk, layered robes; rice, river fish, sweets | polite, poetic, indirect | great temples, rich festivals; the **Single Path** sect among the poor |
| Hayate | red & tan · galloping horse | courage, glory, the warrior's name · *"Die on a horse, not in a bed."* | riding coats, fur trims; mare's milk, mutton, rice wine | loud, boastful | wind kami, war shrines |
| Ushio | deep blue & silver · a wave | wealth, learning, comfort · *"The tide lifts every boat that pays the harbour."* | fine cotton, merchant fashions; fish, salt pickles, tea | quick, clever, money words | sea kami, temple charity |
| Takane | green & white · a snowy peak | endurance, kin, keeping your word · *"The mountain remembers."* | heavy wool, straw coats; buckwheat, roots, game | slow, few words | mountain kami, hermit monks |
| Tatara | orange & black · hammer and flame | craft, duty to the king · *"A blade is only as true as its smith."* | leather aprons, scarred hands; simple stews | precise, technical | fire kami of the forge |
| Kitakaze | white & dark blue · a wolf | strength, freedom, hospitality · *"Winter judges every man."* | furs, felt; meat, fermented milk, barley | rough, honest | sky and wolf spirits, little temple influence |

**No magic exists** ✅: gods are believed in but never act visibly. Abilities (ch. 5) are extreme human skill, will and training, never sorcery.

## 7. Armies & doctrine (feeds ch. 6b)
| Kingdom | Army mix (approx.) | Signature unit | Doctrine |
|---|---|---|---|
| Kurogane | spears 45 · bows 20 · cavalry 15 · heavy infantry 20 | **Iron Gate spearmen** (strict drill, never break formation) | logistics first; wear down, then crush; heads counted after every battle |
| Suiren | spears 50 (many levies) · bows 25 · cavalry 10 · samurai 15 | **Lotus Guard** (royal elite, splendid but rarely used) | numbers and walls; slow to gather, dangerous once gathered |
| Hayate | cavalry 40 (horse archers) · spears 35 · bows 15 · samurai 10 | **Wind Riders** (horse archers) | speed, flanks, shock; famous generals act on their own |
| Ushio | spears 40 · bows 25 · marines 15 · mercenaries 20 | **the fleet** (war junks, marines) | pay others to fight; defend harbours; land war is weak |
| Takane | bows 40 · spears 40 · mountain infantry 20 | **Pass archers** | hold the passes; never fight on open plains |
| Tatara | crossbows 35 · heavy infantry 35 · spears 30 | **Thousand Strings** (crossbows) | defensive killing fields; best gear, too few men |
| Kitakaze | cavalry 35 · great-sword infantry 30 · bows 35 | **Winter Wolves** (veteran raiders) | raid, retreat, fight in snow; chiefs compete for glory |

**Fighting schools** (common techniques, ch. 5): Iron Gate spear drill (Kurogane) · Shinju-ryū elegant sword (Suiren) · Kaze-yumi horse archery (Hayate) · Namikiri-ryū "wave-cut" sword (Ushio) · Takane mountain bow · Tatara heavy blade & crossbow · Northern great-sword (Kitakaze). Unique: the **Twin Demon Dance** (Hattori Takeshi, lost).

## 8. Resources, trade & needs
| Kingdom | Has (exports) | Lacks (imports) | Pressure point |
|---|---|---|---|
| Kurogane | iron, horses (some), good roads | water on its plain (→ canal), luxury goods | the canal |
| Suiren | rice, silk, lacquer, tea | iron, good horses | buys weapons from Tatara, horses from Hayate (even while fighting them) |
| Hayate | horses, wool, leather | grain, iron | grain from Ushio = Ushio's leverage |
| Ushio | salt, fish, coin, books | soldiers, timber | salt to everyone: a salt embargo hurts all |
| Takane | copper, timber, pass tolls | food | starves if passes or trade close |
| Tatara | steel, weapons, crossbows | food (from Suiren) | one bad Suiren harvest = hunger in Tatara |
| Kitakaze | furs, horses, amber | grain, iron, cloth | hard winters → raids and Horo pressure |
| Kinza | banks, ships, slave & mercenary market | everything (buys and sells) | needs peace on the trade roads |

## 9. Relations at the start (Year 100)
| Pair | State | Why |
|---|---|---|
| Kurogane – Suiren | **border war** (raids, no full campaign) | old hatred; Akaishi border; Li is here |
| Kurogane – Hayate | truce, ends spring Year 101 | last war cost both; both rebuild |
| Kurogane – Tatara | friendly on the surface | canal engineer; 🔒 the plot |
| Kurogane – Kitakaze | cold peace | hostage prince returned in Year 98, humiliated |
| Hayate – Takane | tension | border pass, 🔒 Sakaguchi talks with Tobita |
| Hayate – Kitakaze | marriage alliance | King Haruyuki's sister married to King Takamune |
| Ushio – Hayate | Ushio pays subsidies | keeps Hayate armed against Kurogane (after the truce), far from Ushio |
| Ushio – Takane | allies | salt for copper |
| Ushio – Suiren | trade rivals | both want Kinza |
| Suiren – Tatara | dependence | rice for steel |
| Suiren – Kinza | Suiren wants it back | Kinza bought freedom ~Year 40 |
| All – Mount Shōgen | respect / fear | 8,000 monks and the Mirror |
| Treaties | royal hostages | Okitsu Tōmaru (internal) · Kitakaze returned its prince (Year 98) |

## 10. The generation of Li (future rivals and friends)
Young talents with high hidden potential, Li's peers across the world (like *Kingdom*'s rival generation). They grow over the years like Li does.
| Name | Age | Kingdom | Seed | Possible role |
|---|---|---|---|---|
| **Akabane Hayame** | 14 | Suiren | youngest son of Akabane Gendayū; sword prodigy raised to despise commoners | **nemesis**: son of the man who set the trap |
| **Kagami Shion** | 13 | Hayate | Kagami Sōun's daughter; strategist prodigy, reads battles like books | rival general, or ally |
| **Kirishima Ryūnosuke** | 17 | Kurogane | son of the peasant-born Great General; wants to outshine his father | rival inside Li's own army |
| **Isonokami Nami** | 14 | Ushio | the admiral's granddaughter; born on ships | ally at sea, or rival |
| **Shiraiwa Tōta** | 13 | Takane | Yasutoki's son; protective of a girl in his village who lives under a false name | future friend — 🔒 the girl is Li's sister Mei |
| **Shiramine Tsubasa** | 13 | Kitakaze | horse-archer prodigy, son of Chief Akane | rival in the north |
| **Tatara Kunimaru** | 14 | Tatara | the young heir; frightened of the throne | king one day, maybe soon |
| **"Ofuji"** (🔒 Amatsu Sayuri) | 16 | Kinza | merchant's daughter, sharp with numbers | 🔒 imperial blood |
| Kaname, Ōno Daisuke, Hachi, Hagiwara Sayo | 11–15 | Kurogane | Li's start circle (§4) | friends, rivals, love interest possible |

## 11. Places
**Scale:** the land is ~1,400 km west–east and ~1,000 km north–south. On foot (30 km/day, ch. 9): Akaishi → Seikyō ~10 days · Seikyō → Amatsu-kyō ~20 days · coast to coast ~45 days. Armies take about twice as long.

| Kingdom | Key places |
|---|---|
| Kurogane | **Seikyō** (capital, walled, grid streets) · **3 passes**: Iron Gate (to Hayate), Red Slope (to Suiren), North Gate (to Kitakaze) · the **Jōga River** and the canal works · **Akaishi** (Hagiwara castle town) · **Kōri fort** · **Sasabe village** (Kaname's) · the **Kurose River** = border with Suiren |
| Suiren | **Hanaoka** (capital, palaces, canals) · the great river **Ōmizu** · **Lake Shinju** · **Sekiba fortress** (Tōno, facing Akaishi across the Kurose) |
| Hayate | **Tsujikaze** (capital, wooden, windy) · the **Sea of Grass** · Kurokoma horse farms |
| Ushio | **Kaisei** (capital, biggest city, ~300,000 people) · the **Seiran Academy** · salt flats · the **Oni Isles** (pirates, the Sea Wolves) |
| Takane | **Kumoi** (cliff castle) · Southern Pass (Sakaguchi) · Eastern Pass (Haguro) · Northern Pass (royal) · copper mines · 🔒 the Shiraiwa village where Li's family hides |
| Tatara | **Hinokuchi** (forge city, always smoking) · the Black Hills |
| Kitakaze | **Shirotori** (wooden capital) · **the Long Palisade** against the Horo clans |
| Middle | **Amatsu-kyō** ruins (the Ash Plain, bandits, ghost stories) · **Mount Shōgen** above it |
| Free | **Kinza** (walled harbour, mercenary and slave market) · the **Mist Valley** |

## 12. Law, crime & slavery per kingdom
| Kingdom | Law style | Slavery |
|---|---|---|
| Kurogane | harsh written law; collective punishment (a squad pays for one deserter) | slaves may fight; **enemy officer heads buy freedom** (merit law) |
| Suiren | law for sale; nobles judged by nobles | many household slaves; almost no way out |
| Hayate | warrior law; disputes settled by duel | war captives become slaves; brave captives are freed |
| Ushio | merchant courts, contracts | debt slavery (buy yourself free) |
| Takane | clan law, elders judge | rare |
| Tatara | the king's edicts | none (forbidden by the king) — a refuge for runaways |
| Kitakaze | the chief judges; duel or blood-price | captives work a set number of years, then are free |
| Kinza | contract law; the biggest slave market | sold, not kept |

**Religion & neutral powers:** shrines to kami everywhere; temple faith led by **Mount Shōgen**. The **Single Path** sect (inspired by the Ikkō-ikki) preaches that all souls are equal; strong among Suiren's poor and slaves → uprisings when taxes are high (hidden cause, ch. 7).

**Communication:** foot messengers and horse relays (Kurogane's relay posts are the fastest), signal fires on the borders, Mist Valley couriers for secrets. News reaches Li slowly and changed (rumours, ch. 8).

**Medicine:** herbs, bone-setting, cautery; wound fever kills often. Best doctors: Kinza and the Seiran Academy.

## 13. Legends (lore the world talks about)
- **The Burning of the Capital** (Year 0) and the curse said to lie on the ruins.
- **The old Six Pillars** of Kurogane, who won the Wardens' Wars; their seats emptied one by one.
- **The Twin Demon** Hattori Takeshi: a commoner who became Suiren's greatest general, "fell in a night ambush by Kurogane raiders" (official story; 🔒 a lie, ch. 10).
- **Garyū Tessai** killed a Horo khan in single combat at 25.
- **The Red Crane** Mikumo Raizen held a bridge alone against 300 men (true, but it was 120).

## 14. What Li can hear at the start (rumours, spring Year 100)
1. "The young king turns twenty next year — the Chancellor won't like that."
2. "Suiren raiders burned two villages across the Kurose last autumn."
3. "They say the canal will make the plain green. Others say it will empty the treasury."
4. "The Red Crane has never broken a contract."
5. "A northern prince who once lived in Seikyō as a hostage swore he'd come back."

---

## 15. Name registry (all names used; no repeats)
Family names: Amatsu · Asagiri · Ebisawa · Gōda · Ōtori · Kirishima · Tsurumaki · Nagi · Kawabe · Kamio · Hagiwara · Ishizue · Hasunuma · Shirasagi · Akabane · Kinugasa · Yashiro · Tōno · Okitsu · Shinonome · Ugaki · Kagami · Homura · Tobita · Kurokoma · Wadatsumi · Tagami · Isonokami · Daikokuya · Hamazaki · Kiriyama · Ōkura · Shiraiwa · Haguro · Sakaguchi · Tatara · Tobe · Kanemori · Hibiki · Fuyutsuki · Utsugi · Garyū · Shiramine · Ebisu-ya · Mikumo · Matsukaze · Ōno · Hattori.
New given names also in use: Hayame, Shion, Nami, Tōta, Tsubasa, Ryūnosuke, Kunimaru, Sayuri/Ofuji.
Reserved given names (never reuse): Yuki, Mei, Kenjiko, Takeshi, Li.
