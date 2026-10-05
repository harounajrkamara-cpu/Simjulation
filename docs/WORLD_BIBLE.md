# World Bible – Sengoku-inspired simulation (v0.1)

Status per chapter: ✅ approved · 📝 proposal · ⏳ not started

---

## Chapter 1 – World & history ✅

- Setting: a **fictional land inspired by Sengoku Japan**. Japanese culture, armor, weapons, names and rank terms; our own map, kingdoms, families and history.
- **The Empire** ruled the whole land for centuries.
- **100 years ago** the Empire collapsed and split into **7 kingdoms**.
- The imperial bloodline **still exists**: powerless, possibly hidden. Who and where is decided later.
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
- **Li cannot die.** Defeat = badly wounded, captured, humiliated, or losses around him.
- **Permanent injuries** are possible for Li (scars, lasting effects such as a weaker arm).
- **Friends and allies can die**; other characters, including famous enemies, can die.
- **Aftermath**: wounds persist and heal over days/weeks (lower stats, may block abilities) · growth (most from beating stronger foes) · trophy collection (name, rank, men commanded, date, battle) · reputation & memories (witnesses and the loser) · ability costs (e.g. Zone penalty).

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
