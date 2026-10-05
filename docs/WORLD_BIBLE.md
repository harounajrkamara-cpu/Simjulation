# World Bible – Sengoku-inspired simulation (v0.3)

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

## Chapter 5 – Character system

### Part 1 – Stats & Power Rank ✅
Stats 0–100:
- **LEA** – troop strength & morale, how many men handled well. Grows from commanding, speeches, won battles; not from duels.
  - **Command capacity**: each LEA level can handle a certain number of men well. Leading more than that = slower orders and faster morale loss (e.g. a strong fighter promoted too fast).

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
| S | 90–100 | 0–2 in the whole land |
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
| Command | Commander | Fūrinkazan (whole army faster/stronger) |
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
- Equal auras cancel out. A small bonus, never an auto-win.
- Can be suppressed to look weak; revealing it is a scene moment.

**Fog of war** ✅
- Others are shown as estimates ("Rank A? VAL very high, abilities: unknown").
- Accuracy depends on own INT, time observing, spies/info, and the target's fame.
- Abilities become known when used or reported. Own dashboard is always exact.

**Engine note**: abilities are stored as data records; limits and the rank+1 rule are enforced by code.

## Chapter 6 – Combat

### 6a – Duels ✅
- **Fully deterministic**: same situation → same outcome. Unpredictability comes only from hidden information (fog of war, hidden abilities) and the opponent's own choices (personality, general type, learning).
- Only important opponents (officers, commanders, named characters) trigger a duel; before each duel the player chooses: play it or auto-simulate.
- Flow: size up → exchanges → decision → aftermath.
- Choices per round (numbered + free text): attack · defend/counter · feint · observe · use ability · use environment · talk/taunt.
- **Choice clash**: counter beats reckless attack · attack beats observing · feint beats defense · observing gives info and a later bonus. Combined with stats, so the stronger fighter usually still wins.
- **Combat Power** per round = VAL × style-mastery factor (0–20 ×0.7 · 21–40 ×1.0 · 41–60 ×1.3 · 61–80 ×1.6 · 81–100 ×2.0) ± condition ± ability ± terrain/weather ± matchup (reach, style) ± choice clash ± knowledge (observation) ± aura (rank gap ≥2) ± surprise.
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
- **Battle overview every phase**: all sectors for both sides, numbers, changes since last phase, your unit (men, morale, kills). **Information depends on position**: own sector exact · other allied sectors as reports (roughly right, sometimes late) · **enemy numbers are estimates (~)**. Higher rank = better information (messengers, scouts). The overview is still shown every phase. Numbers always change between phases.
- Each unit: men · type (spear, bow, samurai, cavalry) · quality (training, gear) · morale · fatigue · formation · commander (LEA, INT, command abilities).
- **Unit strength** = men × quality × commander factor (LEA) × morale × formation ± terrain ± matchup (spears vs cavalry, archers at range) ± surprise/ambush ± flank/rear ± command abilities.
- Each phase, units in contact fight; losses follow the strength ratio. **Morale breaks before men run out**: below a limit a unit wavers, then routs. A collapsing flank exposes its neighbours (chain reaction).
- Morale changes: commander dies or loses a duel (big drop) · flanked/surrounded · speeches, aura, command abilities · long fight without progress · hunger/bad supply.
- Flow: war council → deployment → phases (**one phase ≈ part of a day, 3–4 per day**) → night (multi-day: rest, wounds, scouts, desertion, reinforcements) → end (rout, retreat, surrender) → aftermath (losses, merit, trophies, reputation, later the reward ceremony).
- Unimportant fights auto-simulate; duels vs officers/commanders and key moments are offered to the player first; "simulate until the final battle" is allowed.
- **INT in battle**: spotting ambushes and traps, how much your tactics add, accuracy of enemy estimates.
- **Maneuver phase** (during deployment): no losses; INT, terrain and scouting decide who starts with the advantage.
- **Morale states**: Steady → Wavering → Routing → Shattered (if their general died). **Chain rout**: a routing unit lowers the morale of its neighbours. Flank/rear attacks give big morale hits; attacked from three sides a unit breaks fast.
- **Taking the general's head**: killing or capturing the enemy commander shatters his troops' morale (duels decide battles).
- **Local superiority**: what counts is how many men you bring to one spot (soft Lanchester for melee); cutting the enemy into pieces lets a smaller army win.
- **Realistic losses**: during the fight ~3–10% dead on both sides; most deaths come after a rout (20–30%+, more if the winner has cavalry); an orderly retreat keeps losses ~10–20%.
- **Pursuit phase** after every battle: cavalry chases routers; good commanders limit the damage.
- **Losses split into four kinds**: dead · wounded (return after healing) · captured (can be ransomed) · deserted.
- **Sieges** are their own battle type: starve (slow, defenders' morale drops over time) or assault (fast, very bloody); supply decides how long both sides last.

## Chapter 7 – Economy

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
- Families send ~**10–20% of their tax income** to the Crown and provide a **troop quota** when the king calls.
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
- **Rumours spread** person to person and lose accuracy (sometimes exaggerated).
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

### ⏳ Open
- Language of the simulation (Dutch / English / choosable).

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
- Every save has a version number; the engine upgrades old saves automatically when the design changes.

### Provisional examples
- Examples from the old canon (Zone, Kage no Yaiba, Hattori) are placeholders until Li's background and the kingdoms are designed.

### Build plan
- Build in stages; each stage must be playable before the next starts (see chat decision).
