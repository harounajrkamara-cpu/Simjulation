# Numbers Sheet – Sengoku Soldier (v0.3 ✅ approved)

The exact numbers behind the World Bible rules. Code uses these; the AI never invents numbers.
Every value states its **unit**. All results are deterministic (ch. 12b). These are **first values**; the balance tests (§12) will tune them.
v0.2 adds the owner-approved fixes from the second external review (merit split, lower contact losses, duel cap, obedience vs loyalty, decay classes, faction power, ledgers). Owner decisions kept: **fast progression** and the **Kurogane head-for-freedom law**.

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

## 3. Command capacity (ch. 5 + 12b) — official, replaces the ch. 5 band numbers
**Capacity C = 10^(1 + LEA ÷ 25) men** → LEA 0: 10 · 25: 100 · 50: 1,000 · 75: 10,000 · 100: 100,000.
**Overload o = men ÷ C.** If o > 1:
- order delay: +1 step per doubling (o = 2 → +1, o = 4 → +2);
- morale losses × (1 + 0.5 × log₂ o).

**Delegation (v0.3):** a commander's **load** = men he leads directly + **20%** of the men under capable sub-commanders (each one not overloaded himself). Overload uses load ÷ C. Example: Kagami (C ≈ 48,000) with 10,000 direct and 90,000 under good lieutenants carries 28,000 → fine; with poor lieutenants the full 100,000 counts → heavily overloaded. Great generals need great lieutenants.

Players only see a broad label, never the exact capacity:
| LEA | Capacity (men) | Label |
|---|---|---|
| 0–14 | 10–36 | handles a few |
| 15–29 | 40–145 | small unit |
| 30–44 | 160–575 | company |
| 45–59 | 640–2,300 | battalion |
| 60–74 | 2,500–9,000 | large formation |
| 75–89 | 10,000–36,000 | army |
| 90–100 | 40,000–100,000 | great army |

## 4. Duels (ch. 6a)
**Combat Power (CP) per round** = VAL × style factor × condition factor × (1 + situational modifiers).
- **Condition factor** = 1 + condition + fatigue (wounds and tiredness, not capped).
- **Situational modifiers** (clash, observation, surprise, terrain, matchup, ability) are added and then **capped at +50% / −50%**.
- Surprise and observation do not stack: use the higher of the two.
- Abilities preferably **change options** (block one counter, turn a wound into fatigue, stop a retreat, reveal a habit, win the next clash) instead of adding more %.
Style factor (v0.3, narrowed so upsets are possible): mastery 0–20 ×0.8 · 21–40 ×1.0 · 41–60 ×1.15 · 61–80 ×1.3 · 81–100 ×1.45.

| Situational modifier (capped ±50% total) | Value |
|---|---|
| choice clash (two-sided) | winner +25% · loser −15% |
| observed rounds (knowledge) | +5% per round, max +15% |
| surprise (first round only) | +30% |
| terrain / weather advantage | ±10% |
| reach or style matchup | ±10% |
| ability | as written on the ability |
Condition: Fresh 0 · Hurt −10% · Wounded −25% · Badly wounded −45%. Fatigue: −5% per step (max 3). Aura is **not** a CP modifier (ch. 12b).

Check (v0.3): same rank → choices decide · 1 rank up → winnable with good play (clash + observation) · 2 ranks up → only with 3–4 factors (clash, surprise, the stronger one tired or wounded) · 3+ ranks → practically impossible. Matches ch. 6a.

**Round result** by gap g = (CP winner − CP loser) ÷ CP loser:
- g < 10%: loser pushed back, +1 fatigue;
- 10–30%: loser one wound step;
- 30–60%: two steps;
- above 60%: loser Down.
- Exact tie: both +1 fatigue. Initiative tie-break, in order: whoever won the previous clash → lower fatigue → the defender if he guarded → fixed character ID (hidden, stored in the replay log).

**Draw** after 10 rounds without Down or yield.

**Healing** (days of rest): Hurt 3 · Wounded 21 · Badly wounded 60–90 (by location).
**Permanent injury:** only when a **Badly wounded** result comes from a gap above 100%. The engine picks the body area from the attack type, in a fixed order.

## 5. Battles (ch. 6b)
**Unit strength** = men × quality × commander × morale × (1 + sum of modifiers).
- Quality: levy 0.6 · ashigaru 1.0 · veteran 1.3 · samurai/elite 1.6.
- Commander: 1 + (LEA − 50) ÷ 200, reduced by overload (§3).
- Morale factor: Steady 1.0 · Wavering 0.8 · Routing 0.3.
- Modifiers: flank +20% · rear +40% · high ground +15% · fortification +30–60% · spears vs cavalry +30% · surprise/ambush +40% (first phase).

**Losses per phase in contact** (ratio r = stronger ÷ weaker, ≥ 1), as % of the unit's current men, **per phase**:

| Side | Contact loss per phase |
|---|---|
| weaker side | 1.5% × √r, max 5% |
| stronger side | 0.75% ÷ √r |
| equal (r = 1) | both 1.1% |

Normal fighting is slow; **big losses come from collapse**: routing, being surrounded or cut off, enemy cavalry, a blocked retreat or no organised withdrawal.

Split of casualties during fighting: 40% dead · 45% wounded · 15% captured or missing.

**Rout & pursuit:** a routing unit loses an extra 10% per phase, +10% if the enemy has ≥ 20% cavalry. An orderly retreat (Wavering, commander alive) loses 3% per phase. These give the ch. 6b totals **per battle, as % of starting strength, all casualty kinds together**: ~3–10% in the fight itself, 20–30%+ for a side that routs and is pursued, ~10–20% for an orderly retreat.

**Battle report** (always this format, never a loose %):
```
Battle: 5 phases (no rout) · Starting strength 1,000
Dead 22 · Wounded 24 · Captured 5 · Missing 3 · Deserted 6
Permanent losses 36 · Recoverable (wounded) 24 · Total 60 (6%)
```

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
Three kinds of merit, confirmed after the battle by witnesses, reports or the head count.

**Combat merit** (personal deeds):

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

**Command merit** (leading), size class: 5-man = 1 · 10 = 2 · 50 = 3 · 100 = 4 · 300 = 5 · 1,000 = 6 · 5,000 = 7 · 10,000+ = 8:
| Deed | Merit |
|---|---|
| unit completes its objective | 5 × size class |
| unit wins its fight | 3 × size class |
| losses below half of the expected | +2 × size class |
| orderly withdrawal that saved the unit | 3 × size class |
| unit morale never fell below Wavering | +1 × size class |
| supply kept (no hunger days on campaign) | +1 × size class |
| disobeyed an order and it clearly paid off | +3 × size class (if it failed: −3 × size class) |

**Political merit**: negotiation won 5–30 · useful intelligence 5–20 · good governance per season 5 · protecting civilians 3–10.

**Promotion score** = combat × w₁ + command × w₂ + (political + reputation + sponsor) × w₃, by the **target** rank:
| Target rank | Combat w₁ | Command w₂ | Political / reputation / sponsor w₃ |
|---|---|---|---|
| Gochō – Kogashira | 0.6 | 0.3 | 0.1 |
| Gojū-gashira – Hyakunin-gashira | 0.35 | 0.5 | 0.15 |
| Sanbyakunin-shō – Sennin-shō | 0.15 | 0.6 | 0.25 |
| Gosennin-shō – Taishō | 0.05 | 0.55 | 0.4 |
| Dai-Shōgun | 0.05 | 0.45 | 0.5 |
Result: a pure fighter reaches Kogashira fast, but cannot become a general on heads alone (e.g. Sanbyakunin-shō → Sennin-shō needs a score of 900; with weight 0.15, heads alone would need 6,000 combat merit).

**Promotion thresholds** (promotion score, counted over the whole career, not reset after a promotion):

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

**Social barrier** (ch. 7) multiplies the score needed for low-born or ex-slaves: Kurogane ×1.0 (merit law) · Kitakaze ×1.0 · Hayate ×1.25 · Takane ×1.25 · Ushio ×1.5 · Tatara ×1.25 · Suiren ×2.0.

**Also required:** a **vacancy** (an officer dies, is promoted, or a new unit is formed; filled at reward ceremonies, best merit first). From Sanbyakunin-shō up, a **sponsor** is also needed: a superior with opinion ≥ +40 of Li.

**The barrier is shown, not hidden:** when a promotion is blocked, Li sees the reason ("the elders reject a low-born", "a noble candidate has priority", "a sponsor is required", "your owner refuses to release you").

**Freedom through merit** (Kurogane law, owner's decision kept): one enemy head of Kogashira rank or higher, **or** 30 combat + command merit, frees a slave. Conditions: the deed is **witnessed** and done in **official Kurogane service** (enlisted as a levy or lent by the owner). Kurogane pays the owner **10 ryō**. Officer duels only happen when a battle offers them; Li cannot create them at will.

## 7. Money, pay & land (ch. 7)
**Three ledgers:** food reserve in **koku** · treasury in **ryō** · daily spending in **mon**.
**Game conversion (fixed, fictional, not historical):** 1 koku = 1 ryō = 1,000 mon. Hidden causes (bad harvest, war) can change food *prices* in mon locally, never the conversion itself.

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

**Fading by kind** (time until a change is gone, linear):
| Kind | Fades over |
|---|---|
| casual insult or slight | 1–3 months |
| rumour (unless repeated) | 1 month |
| public humiliation, harsh punishment | 6–12 months |
| shared hardship | 2–5 years |
| broken promise | leaves a permanent **trust scar** of half its size; the rest recovers over 2 years of kept promises |
| saved life, betrayal | permanent |

**Loyalty** (0–100, inner commitment) = 0.45 × Trust + 0.30 × Respect + 0.25 × Affection + modifiers (blood ties +15, oath +10, shared identity +5, passed over −15, unpaid −20).
**Obedience** (0–100, doing what he is told) = 0.4 × lord's authority (rank, legitimacy) + 0.4 × Fear + 0.2 × enforcement (guards, hostages, nearness).

| Obedience / Loyalty | Behaviour |
|---|---|
| high / high | reliable core supporter |
| high / low | obeys while watched; defects when a chance comes |
| low / high | may disobey an order but stays personally committed |
| low / low | desertion or betrayal risk now |

**Summary opinion** (−100 … +100) = ((Trust − 50) + (Respect − 50) + (Affection − 50)) × 2 ÷ 3 − Rivalry ÷ 2 − max(0, Fear − 50) ÷ 2, clamped. All values at 50 with no rivalry → 0 (neutral).

**Betrayal** happens only when all three hold (ch. 8): loyalty < 40 · opportunity score ≥ 60 (better offer, the lord looks weak, own land threatened, enough power) · obedience < 50 (not too much fear or enforcement).

## 9. Factions (ch. 13b + 12b)
**Power ratio** = (faction's committed troops + reliable allies) ÷ (Crown troops + reliably loyal families), where every side counts **effective troops** = available men × readiness × supply × cohesion (each 0–1).

**Discontent change per month** = 10 × (power ratio − 0.6) + grievance (0–5) + foreign support (0–3) + leader legitimacy (0–2) − Crown authority ÷ 20 − Crown dread ÷ 25.
Clamped to 0–100. **Ultimatum at 100.**

## 10. Time & healing
Uses ch. 9: walking 30 km/day · army 15–20 km/day · battle phase = part of a day (3–4 per day) · healing as in §4.

## 11. Fuse numbers (engine only, 🔒)
Full decision trees per fuse (eligible actors, decision order, scored actions, tie-breaker, visible evidence, outcome, side effects) are written in **build stage 4**; the AI narrates fuses but never decides them.
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
Expected pace for a **strong** player in Kurogane (owner's choice: fast progression is allowed; a weak or cautious player is slower; nothing is guaranteed):

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
- Head-hunting may not beat command merit after Hyakunin-gashira (checked with the §6 weights).
- A normal battle (no rout) costs each side under ~10% of its men in total.
- No career may get stuck for more than 3 years without any route forward.

### 11b. Fuse dates and weights (Oct 15, ⚠ PROVISIONAL — owner may change)
Until the decision trees of build stage 4, each fuse fires on a fixed day (after its "not before") and picks its outcome by **weights**: a base weight per outcome plus Li's levers (+2 per lever toward an outcome; each listed lever counts once per fuse, owner decision Oct 15); highest wins, a tie goes to the side Li pushed (owner, Oct 15), otherwise to the first listed. Days count from Year 100, Month 1, Day 1 (360 per year).
| Fuse | Fires (day) | Outcomes (base weight) |
|---|---|---|
| Gōda's coup | Y101 M2 D25 (414) | crushed (3) · purge of the Chancellor (2) · the king killed (1) |
| Hostage prince's revenge | Y101 M6 D15 (524) | discovered early (2) · fails, war of revenge (3) · succeeds, Kurogane in chaos (1) |
| Bribed slander (Hayate) | Y101 M9 D1 (600) | plot exposed (2) · Kagami rebels (1) · Kagami executed (3) |
| Pass revolt (Takane) | Y101 M10 D1 (630) | no revolt (3) · revolt, the pass opens (2) · revolt crushed (1) |
| Great canal | Y102 M6 D1 (870) | finished, the land grows green (2) · exposed (1) · bankrupts the treasury (3) |
| Hostage heir (Suiren) | Y102 M8 D1 (930) | stays a hostage (3) · breaks away (2) · crushed (1) |
| Slow usurpation (Ushio) | Y103 M6 D1 (1230) | smooth (3) · civil war (2) · the child king murdered (1) |
| King's death (Tatara) | Y103 M10 D1 (1350) | heir crowned, the prince loyal (3) · the prince rules (2) |

## 13. Phase 6 additions (Oct 17 build, ⚠ PROVISIONAL — owner kan terugdraaien)
**Block A (audit gaps 11, 12, 13, 20, 22):**
- **Pay:** a free man in service gets the middle of his rank's yearly pay (ch. 7) in twelve monthly parts, at the end of each month (Ashigaru 2.5 ryō → 208 mon a month). From Sanbyakunin-shō the land pays him instead.
- **Obedience inputs:** Li's authority over his own people = 20 + 8 × his command rank level (Ashigaru 20 … Dai-Shōgun 92). Enforcement = 40, +20 when Li holds land, + half his dread.
- **Loyalty modifiers** (§8): blood (spouse, child) +15 · oath +10 · passed over −15 · unpaid (his land left men unpaid) −20.
- **Opportunity score** (betrayal): 30, +20 if Li lost his last fight, +20 if he is Wounded or worse, +20 if his kingdom is in civil war, +20 if his men went unpaid. When loyalty < 40, obedience < 50 and opportunity ≥ 60, a threat clock "X is thinking of leaving Li" opens at the end of the month; when full, the betrayal happens.
- **Dread:** each act of cruelty Li becomes known for: +5 (max 100).
- **Promises:** kept → Trust +10 (fades like shared hardship); broken → Trust −25: −12.5 permanent scar, −12.5 heals over 2 years.
- **Permanent injury cost** (§4 area by attack): sword arm −2 VAL · shoulder −1.5 · leg −1 · side −1. Recorded once per area.
- **Overload** (§3): the commander factor is divided by (1 + 0.1 × log₂ o); morale shocks from losses × (1 + 0.5 × log₂ o); a new order reaches the unit after floor(log₂ o) phases. Li's own unit now uses his real LEA (was a fixed 40).
