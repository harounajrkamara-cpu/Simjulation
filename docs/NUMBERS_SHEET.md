# Numbers Sheet – Sengoku Soldier (v0.1, 📝 draft for approval)

The exact numbers behind the World Bible rules. Code uses these; the AI never invents numbers.
Every value states its **unit**. All results are deterministic (ch. 12b). These are **first values**; the balance tests (§12) will tune them.

Conventions: stats are stored with one decimal and shown as whole numbers · "per day / phase / season / year" always stated · % = percent of the stated base.

---

## 1. Rank scores (ch. 5)
| Score | Formula |
|---|---|
| Warrior | (VAL + best style mastery) ÷ 2 |
| Commander | (LEA + INT) ÷ 2 |
| Statesman | (POL + INT) ÷ 2 |
| Overall | highest of the three |

Bands: F 0–14 · E 15–29 · D 30–44 · C 45–59 · B 60–74 · A 75–89 · S 90–100 (± = top/bottom third of a band).
Check: Li at start = Warrior (14+6)/2 = 10 · Commander 11.5 · Statesman 11 → **F**.

## 2. Stat & mastery growth
**Gain per event = base × age × room × challenge**, never above the hidden potential.

| Factor | Values |
|---|---|
| **age** | ≤15: ×1.3 · 16–25: ×1.2 · 26–35: ×1.0 · 36–45: ×0.8 · 46+: ×0.5 |
| **room** (diminishing returns) | (potential − current) ÷ potential |
| **challenge** (opponent's rank vs yours) | −2 or lower: ×0.2 · −1: ×0.5 · equal: ×1.0 · +1: ×1.5 · +2: ×2.5 · +3: ×4 (survival only) |

**Age decline:** VAL −0.5 per year after 45, −1 per year after 55. LEA, INT, POL do not decline before 65.

| Event | Stat | Base gain |
|---|---|---|
| training day, alone | trained stat or style | 0.02 |
| training day with a teacher (teacher ≥ 2 ranks higher) | trained stat or style | 0.05 |
| real fight survived (skirmish) | VAL, style | 0.4 |
| duel won | VAL, style | 1.0 |
| duel lost but survived | VAL, style | 0.5 |
| leading a unit through a battle | LEA | 0.8 |
| battle won as commander | LEA, INT | 1.0 |
| successful plan or ambush | INT | 0.8 |
| study day (books, maps) | INT | 0.02 |
| negotiation won | POL | 0.6 |
| governing a domain, per season | POL | 0.5 |
| near-death event | VAL or will | 1.5 (also a possible ability trigger) |

**Training cap:** max **2.0** per stat per **season** from training/study alone ("training helps a little"). Real danger has no cap.

**Style unlocks** (ch. 5): mastery 30 / 50 / 70 / 100 → choice of 1 of 2.

## 3. Command capacity (ch. 5 + 12b)
**Capacity C = 10^(1 + LEA ÷ 25) men** → LEA 0: 10 · 25: 100 · 50: 1,000 · 75: 10,000 · 100: 100,000.
**Overload o = men ÷ C.** If o > 1:
- order delay: +1 step per doubling (o = 2 → +1, o = 4 → +2);
- morale losses × (1 + 0.5 × log₂ o).
The ch. 5 table stays as player-facing labels.

## 4. Duels (ch. 6a)
**Combat Power (CP) per round** = VAL × style factor × (1 + sum of modifiers).
Style factor: mastery 0–20 ×0.7 · 21–40 ×1.0 · 41–60 ×1.3 · 61–80 ×1.6 · 81–100 ×2.0.

| Modifier | Value |
|---|---|
| condition: Fresh / Hurt / Wounded / Badly wounded | 0 / −10% / −25% / −45% |
| fatigue (per tired step, max 3) | −5% |
| winning the choice clash | +25% |
| observed rounds (knowledge) | +5% per round, max +15% |
| surprise (first round only) | +30% |
| terrain / weather advantage | ±10% |
| reach or style matchup | ±10% |
| ability | as written on the ability |
Aura is **not** a CP modifier (ch. 12b).

**Round result** by gap g = (CP winner − CP loser) ÷ CP loser:
- g < 10%: loser pushed back, +1 fatigue;
- 10–30%: loser one wound step;
- 30–60%: two steps;
- above 60%: loser Down.
- Exact tie: both +1 fatigue; tie-breaker for initiative: higher INT, then whoever attacked last round.

**Draw** after 10 rounds without Down or yield.

**Healing** (days of rest): Hurt 3 · Wounded 21 · Badly wounded 60–90 (by location).
**Permanent injury:** only when a **Badly wounded** result comes from a gap above 100%. The engine picks the body area from the attack type, in a fixed order.

## 5. Battles (ch. 6b)
**Unit strength** = men × quality × commander × morale × (1 + sum of modifiers).
- Quality: levy 0.6 · ashigaru 1.0 · veteran 1.3 · samurai/elite 1.6.
- Commander: 1 + (LEA − 50) ÷ 200, reduced by overload (§3).
- Morale factor: Steady 1.0 · Wavering 0.8 · Routing 0.3.
- Modifiers: flank +20% · rear +40% · high ground +15% · fortification +30–60% · spears vs cavalry +30% · surprise/ambush +40% (first phase).

**Losses per phase in contact** (ratio r = stronger ÷ weaker, ≥ 1):

| Side | Loss per phase (% of current men) |
|---|---|
| weaker side | 4% × √r, max 10% |
| stronger side | 2% ÷ √r |

Split of casualties during fighting: 40% dead · 45% wounded · 15% captured or missing.

**Rout & pursuit:** a routing unit loses an extra 10% per phase, +10% if the enemy has ≥ 20% cavalry. An orderly retreat (Wavering, commander alive) loses 3% per phase. These give the ch. 6b totals: ~3–10% dead in the fight, 20–30%+ after a rout, ~10–20% in an orderly retreat.

**Morale points** (0–100):
- Steady ≥ 60 · Wavering 30–59 · Routing < 30.
- A routing unit can only **rally** when it gets back to ≥ 45, and it returns as Wavering.

| Morale shock | Points |
|---|---|
| every 5% casualties in one phase | −5 |
| flanked / attacked from the rear | −15 / −25 |
| neighbouring unit routs | −10 |
| own commander killed or captured | −30 (units directly under him) |
| stand-in commander takes over | +10 next phase |
| speech, aura, command ability | +5 to +15 |
| hunger | −5 per day |
| long fight with no progress (3+ phases) | −5 per phase |

**Shattered** = commander dead **and** the unit is at < 30, cut off, or has no stand-in (ch. 12b).

## 6. Merit & promotion (ch. 4, 7)
**Merit points**, earned per deed and confirmed after the battle by witnesses or the head count:

| Deed | Merit |
|---|---|
| enemy ashigaru killed (witnessed) | 1 |
| enemy Gochō or Kogashira head | 3 |
| Gojū-gashira or Hyakunin-gashira head | 10 |
| Sanbyakunin-shō head | 25 |
| Sennin-shō head | 60 |
| Gosennin-shō head | 120 |
| Taishō head | 250 |
| enemy standard captured | 20 |
| first over the wall in an assault | 15 |
| saving an officer's life | 10 |
| useful scouting report | 3 |
| own unit wins its fight | 2 × size class (5-man = 1 … 1,000-man = 6) |

**Promotion thresholds** (total merit):

| From → To | Merit needed |
|---|---|
| Ashigaru → Gochō | 15 |
| Gochō → Kogashira | 40 |
| Kogashira → Gojū-gashira | 100 |
| Gojū-gashira → Hyakunin-gashira | 220 |
| Hyakunin-gashira → Sanbyakunin-shō | 450 |
| Sanbyakunin-shō → Sennin-shō | 900 |
| Sennin-shō → Gosennin-shō | 1,800 |
| Gosennin-shō → Taishō | 3,500 |
| Taishō → Dai-Shōgun | 7,000 |

**Social barrier** (ch. 7) multiplies the merit needed for low-born or ex-slaves: Kurogane ×1.0 (merit law) · Kitakaze ×1.0 · Hayate ×1.25 · Takane ×1.25 · Ushio ×1.5 · Tatara ×1.25 · Suiren ×2.0.

**Also required:** a **vacancy** (an officer dies, is promoted, or a new unit is formed; filled at reward ceremonies, best merit first). From Sanbyakunin-shō up, a **sponsor** is also needed: a superior with opinion ≥ +40 of Li.

**Freedom through merit** (Kurogane law): one enemy head of Kogashira rank or higher, **or** 30 merit, frees a slave in Kurogane service. Kurogane pays the owner **10 ryō**.

## 7. Money, pay & land (ch. 7)
- Pay per year: as ch. 7.
- **Ceremony reward:** 0.1 ryō per merit point earned in that campaign. Slaves get none (an owner may share).
- **Buying freedom:** Raizen's price for Li is **15 ryō** (he paid 8).

| Rank (Crown or family service) | Land granted |
|---|---|
| Sanbyakunin-shō | a village, ~300 koku |
| Sennin-shō | 2,000–5,000 koku |
| Gosennin-shō | 10,000–20,000 koku |
| Taishō | 30,000–100,000 koku |
| Dai-Shōgun | 100,000+ koku |

- **Land income:** harvest × tax rate (40–60%), arriving at the end of Month 9.
- **Land duty:** the holder must keep **2–2.5 armed men per 100 koku**, the same ratio as ch. 7. Each man costs ~1 koku food + 2–3 ryō pay per year.
- Example: a 300-koku village at 50% tax = 150 ryō a year; 7 men cost ~25 ryō; ~125 ryō is left.
- Troops a commander leads in Crown service are **Crown troops**; his land pays him, it does not supply his whole unit.

| Extra price | Ryō |
|---|---|
| simple armour | 2 |
| good armour | 10–30 |
| bow | 2–5 |
| 100 arrows | 0.5 |
| crossbow (Tatara) | 8; outside Tatara 20+ |
| warhorse | 10–30 (ch. 7) |
| rice for 1 person, 1 year | 1 koku ≈ 1 ryō (≈ 3 mon per day) |

## 8. Relationships & loyalty (ch. 8)
| Event | Effect |
|---|---|
| promise kept | Trust +10 |
| promise broken | Trust −25 |
| saved his life | Affection +20 (permanent) · Trust +10 |
| beat him fairly in front of others | Respect +10 · Rivalry +10 |
| humiliated him in public | Affection −15 · Rivalry +15 (fades over 1 year) |
| punished him in front of the men | Fear +10 · Affection −10 (fades over 1 year) |
| shared hardship (a campaign or season) | Affection +5 · Trust +5 |
| cruelty Li is known for | Dread +5 (world) |

**Fading:** non-permanent changes lose 1/12 of their value per month.

**Loyalty** (0–100), derived = 0.35 × Trust + 0.25 × Respect + 0.20 × Affection + 0.20 × min(Fear, 60) + modifiers (blood ties +15, oath +10, passed over −15, unpaid −20).

**Summary opinion** (−100 … +100) = ((Trust − 50) + (Respect − 50) + (Affection − 50)) × 2 ÷ 3 − Rivalry ÷ 2 − max(0, Fear − 50) ÷ 2, clamped. All values at 50 with no rivalry → 0 (neutral).

**Betrayal** happens only when all three hold: loyalty < 40 · opportunity score ≥ 60 (better offer, the lord looks weak, own land threatened, enough power) · Fear < 50.

## 9. Factions (ch. 13b + 12b)
**Discontent change per month** = 10 × (power ratio − 0.6) + grievance (0–5) + foreign support (0–3) + leader legitimacy (0–2) − Crown authority ÷ 20 − Crown dread ÷ 25.
Clamped to 0–100. **Ultimatum at 100.**

## 10. Time & healing
Uses ch. 9: walking 30 km/day · army 15–20 km/day · battle phase = part of a day (3–4 per day) · healing as in §4.

## 11. Fuse numbers (engine only, 🔒)
| Fuse | Not before | Trigger | Outcome decided by |
|---|---|---|---|
| Gōda's coup (Kurogane) | Year 100, Month 9 | King Tokinari turns 20 in **Year 101, Month 3**; Gōda has ≥ 6,500 men; the Chancellor's suspicion < 50 | who controls the palace guard on the night (Ōtori's choice, the King's Men's readiness) |
| Great canal | Year 101 | Kurogane treasury < 40 → an inquiry; or anyone reports Kawabe's letters | inquiry result; finished in Year 104 if not stopped |
| Hostage heir (Suiren) | Year 102 | Suiren authority < 20, **or** Suiren loses a major battle while Tōmaru is outside Hanaoka | Okitsu's troop ratio vs Akabane |
| Bribed slander (Hayate) | Year 101, Month 3 (truce ends) | Kurogane at war with Hayate and Kurogane's spy funds ≥ 2,000 ryō | Kagami's loyalty to the king vs to his men |
| Slow usurpation (Ushio) | Year 103 | regent's popularity ≥ 75 and Crown authority ≤ 25 | Admiral Isonokami's choice; Shinsuke's patience |
| Pass revolt (Takane) | Year 101 | Sakaguchi loyalty < 40 and Hayate's offer active and Takane loses a battle | faction power ratio |
| King's death (Tatara) | – | hidden lifespan ends **Year 103, Month 10**; −1 month for every war year, −3 if the canal plot is exposed | heir's age; Prince Akifumi's loyalty |
| Hostage prince's revenge (Kitakaze) | Year 101, Month 6 | a Kitakaze embassy is received in Seikyō (treaty renewal) | guard alertness; Kamio border bribes; whether anyone warns the court |

## 12. Balance targets (to test with thousands of simulated careers)
Expected pace for a **strong** player in Kurogane (a weak player is slower; nothing is guaranteed):

| Milestone | Target age |
|---|---|
| freedom | 13–15 |
| Gochō (5) | ~15 |
| Kogashira (10) | ~16 |
| Hyakunin-gashira (100) | 18–19 |
| Sanbyakunin-shō (300) + first land | 20–21 |
| Sennin-shō (1,000+) | 22–24 |
| Taishō (10,000+) | 27–32 |
| Dai-Shōgun | 32+ (rare) |

**Tests:**
- How often does a C beat a B in a duel? Target: 10–20% with good choices, < 3% with bad ones.
- No single strategy may win more than 60% of careers (e.g. only hunting heads, only training).
- Head-hunting may not beat command merit after Hyakunin-gashira.
- No career may get stuck for more than 3 years without any route forward.
