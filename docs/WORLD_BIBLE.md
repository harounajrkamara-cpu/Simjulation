# World Bible – Sengoku-inspired simulation (v0.5)

Status per chapter: ✅ approved · 📝 proposal · ⏳ not started

### ✅ Owner decision (Oct 7): Claude is the Game Master
The game felt like a fixed menu, not a living world. From now on **Claude runs the world**: the player can try anything, people act on their own plans, the story moves scene by scene and skips dull time itself. **The code is the memory and the referee**: every person, promise, wound, coin and storyline is stored as an event (saves replay, nothing is forgotten), every number Claude proposes is checked against fixed limits, freedom needs a real route, and fights are decided by the duel engine. The hand-written chapter stays as the offline "Classic chronicle". Where this book says "the AI only narrates", Game Master mode overrides it.

### Core principle: no dice ✅
- **Deterministic wherever the player acts**: duels, battles, conversations, promotions — same situation, same outcome.
- **The world runs on hidden causes, not luck**: weather, harvests, disease, disasters follow seasons and conditions (neglect, war, overpopulation). Causes are not shown in advance, so events still feel surprising, but nothing is pure chance.

### ✅ Done (was "to design later"): see ch. 10, 13, 13b and `WORLD_ATLAS.md`
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
- The imperial bloodline **still exists**: powerless, partly hidden (details in `WORLD_ATLAS.md` §1).
- The great goal of the world: whoever reunites the 7 kingdoms becomes the new Empire.
- All families have **invented names** (no real clans like Takeda/Oda). **One exception ✅:** Li's own family name **Hattori** (the owner's character across all simulations).
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
- Promotion = merit (combat, command and political merit, weighted by rank: `NUMBERS_SHEET.md` §6) + status + a free position; big campaigns end with a reward ceremony (in rank order, with reactions).

## Chapter 5 – Character system ✅

### Part 1 – Stats & Power Rank ✅
Stats 0–100:
- **LEA** – troop strength & morale, how many men handled well. Grows from commanding, speeches, won battles; not from duels.
  - **Command capacity**: each LEA level can handle a certain number of men well. Leading more than that = slower orders and faster morale loss (e.g. a strong fighter promoted too fast).
  - ⚠️ The numbers in this table are replaced by the formula in `NUMBERS_SHEET.md` §3 (up to 100,000 at LEA 100); the table stays as a rough guide.
  - ✅ **Delegation:** big armies are led through sub-commanders; only 20% of the men under capable lieutenants count toward the general's load (`NUMBERS_SHEET.md` §3).
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
- **Combat Power** per round = VAL × style-mastery factor (0–20 ×0.8 · 21–40 ×1.0 · 41–60 ×1.15 · 61–80 ×1.3 · 81–100 ×1.45, v0.3) ± condition ± ability ± terrain/weather ± matchup (reach, style) ± choice clash ± knowledge (observation) ± surprise (aura: morale/hesitation only, ch. 12b). ⚠️ Exact formula, caps and thresholds: `NUMBERS_SHEET.md` §4.
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
- **Battle overview every phase**: all sectors for both sides, numbers, changes since last phase, your unit (men, morale, kills). **Information depends on position**: own sector exact · other allied sectors as reports (roughly right, sometimes late) · **enemy numbers are estimates (~)**. Higher rank = better information (messengers, scouts). The overview is still shown every phase, but outside Li's sector as reports with source, age and confidence (ch. 12b #6). A quiet phase may change only position, fatigue or information (ch. 12b).
- Each unit: men · type (spear, bow, samurai, cavalry) · quality (training, gear) · morale · fatigue · formation · commander (LEA, INT, command abilities).
- **Unit strength** = men × quality × commander factor (LEA) × morale × formation ± terrain ± matchup (spears vs cavalry, archers at range) ± surprise/ambush ± flank/rear ± command abilities.
- Each phase, units in contact fight; losses follow the strength ratio. **Morale breaks before men run out**: below a limit a unit wavers, then routs. A collapsing flank exposes its neighbours (chain reaction).
- Morale changes: commander dies or loses a duel (big drop) · flanked/surrounded · speeches, aura, command abilities · long fight without progress · hunger/bad supply.
- Flow: war council → deployment → phases (**one phase ≈ part of a day, 3–4 per day**) → night (multi-day: rest, wounds, scouts, desertion, reinforcements) → end (rout, retreat, surrender) → aftermath (losses, merit, trophies, reputation, later the reward ceremony).
- Unimportant fights auto-simulate; duels vs officers/commanders and key moments are offered to the player first; "simulate until the final battle" is allowed.
- **INT in battle**: spotting ambushes and traps, how much your tactics add, accuracy of enemy estimates.
- **Maneuver phase** (during deployment): no losses; INT, terrain and scouting decide who starts with the advantage.
- **Morale states**: Steady → Wavering → Routing → Shattered (ch. 12b: only if their general died **and** the unit was already wavering, cut off, or has no stand-in commander). **Chain rout**: a routing unit lowers the morale of its neighbours. Flank/rear attacks give big morale hits; attacked from three sides a unit breaks fast.
- **Taking the general's head**: killing or capturing the enemy commander is a heavy morale shock (−30) to the units under him; they only **shatter** if already wavering, cut off or without a stand-in commander (ch. 12b #5). Duels can turn battles, but do not decide them alone.
- **Local superiority**: what counts is how many men you bring to one spot (soft Lanchester for melee); cutting the enemy into pieces lets a smaller army win.
- **Realistic losses** (per battle, % of starting strength, all casualty kinds): ~3–10% in the fight itself; most losses come after a rout (20–30%+, more if the winner has cavalry); an orderly retreat keeps losses ~10–20%. Formulas: `NUMBERS_SHEET.md` §5.
- **Pursuit phase** after every battle: cavalry chases routers; good commanders limit the damage.
- **Losses split into four kinds**: dead · wounded (return after healing) · captured (can be ransomed) · deserted.
- **Sieges** are their own battle type: starve (slow, defenders' morale drops over time) or assault (fast, very bloody); supply decides how long both sides last.

## Chapter 7 – Economy ✅

### Money ✅
- **Mon** (copper coin, daily things) · **Ryō** (gold coin, big purchases, pay, rewards) · **Koku** (rice to feed 1 person for 1 year; measures land and family wealth).
- Game rule: **1 koku ≈ 1 ryō ≈ 1,000 mon**. Fact check: in the Sengoku period 1 koku of rice was worth about **1 kanmon (1,000 mon)** on average, swinging roughly 500–1,300 mon with harvests; the Edo-era official rate (1609) was **1 ryō = 4,000 mon**. So koku = 1,000 mon is close to history; ryō = 1,000 mon is a **game simplification**.
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
- Fact check: Japan's 1649 Keian levy table asked ~235 **people** per 10,000 koku, of whom only ~80 were fighters (the rest servants and porters). Our world is deliberately **more militarised** (closer to Warring States China's mass armies): the 200–250 count as men under arms.
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
- ✅ **Obedience ≠ loyalty:** obedience comes from authority, fear and enforcement; loyalty from trust, respect and affection. A frightened man obeys while watched and defects when he can (formulas: `NUMBERS_SHEET.md` §8).
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
- **Same result as playing it** (Game Experience ch. 9 §6): a skip with a plan gives exactly what playing those days with the same routine gives (training cap: Numbers §2). No reward for clicking through routine.
- **A skip also stops for** a once-only chance, a peak from the pacing director, a season change and a birthday that matters (genpuku at 15).
- **Longest skip:** slave 1 month · soldier 1 season · officer and up 1 year.

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
| 90 | **Battle of the Kurose**: Takeshi (Commander A+, LEA ~94, enough for ~57,000 men), as Taishō with ~60,000 men, beats a Kurogane army on the border river. Kurogane veterans still hate the name "Twin Demon". |
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
INFOCHAR · STATUS · RECAP · TROPHIES · RELATIONS · WORLD · THREATS · LOG · SAVE / LOAD · REWRITE · CORRECT · **WAIT** (timeskip with a plan, ch. 9) · **HELP** (the How to play page, Game Experience ch. 8).

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
- Full rules (four phases, beat windows, no rubber-banding, the 6-month "never stuck" check): Game Experience ch. 9 §2. It schedules only Li-local beats and news delivery, never world events.

### Systems unlock with Li's life
- Slave: survival, people, training · Soldier: unit, battles · Landholder: economy, domain · Court: politics. The game grows with Li.

### Numbers sheet & balance tests
- Before building, a numbers sheet: stat growth per event, merit per deed, promotion thresholds, prices, losses. → `docs/NUMBERS_SHEET.md` (✅ v0.3).
- Automatic tests: the engine simulates thousands of careers/duels to check e.g. how long slave → general takes and how often a C-rank beats a B-rank; also watches for dominant strategies.

### Name registry
- Every name is stored; new names must be unique (no more two Yukis / two Takeshis), taken from name lists per region and family **in a fixed order** (ch. 12b).

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

Free territories: **Kinza** (Merchant City, inspired by Sakai, which really was run by a council of 36 merchants: walled, independent), **Mount Shōgen** (Monk Mountain), the **northern border tribes**.

### Li's start ✅
- Li (12) is the **slave of a famous rōnin who leads a mercenary band**, hired by a border family in **Kurogane** (the Hagiwara of Akaishi). He carries gear, sees real fights, learns by watching. Later he can choose to enlist in the Kurogane army, where merit can free him (Qin's real law also let men trade rank to free enslaved relatives).

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
5. **Neutral powers:** every kingdom has local temples and guild branches; **Mount Shōgen** (Monk Mountain) and **Kinza** (Merchant City) are their independent headquarters.
6. **Payment to the Crown scales with Crown Authority:** ~5% of tax income in Suiren, ~20%+ in Tatara (replaces the flat 10–20% of ch. 7 per kingdom).
7. **Mercenaries:** a band is hired by contract (pay per season + share of loot). Ranks inside a band are not Crown or family ranks; a famous rōnin can still be Warrior A.
8. **Fuse numbers** (thresholds, "not before" dates) go on the numbers sheet.

### Family tiers ✅ (scale fix: 100+ great families exist)
- **Tier A:** 3–5 key great families per kingdom, fully designed (head, heir, general, branches, goals, secrets).
- **Tier B:** the other great families: named, with head and values.
- **Tier C:** lesser families and branches, generated only when Li gets close, then saved permanently in the name registry.
