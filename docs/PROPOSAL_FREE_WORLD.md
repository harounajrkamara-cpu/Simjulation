# ✅ APPROVED (Oct 15) — The free world · canon: World Bible ch. 13d, Numbers §11b · built: engine/fuses.ts, engine/seeds.ts

Owner question (Oct 12): *"If I can go to any kingdom, how does the world stay fixed but free, with cool events?"*
Owner decision (Oct 15): write a proposal now; the game has **no end** (a life story, big goals are milestones).

**What already exists in canon (this proposal does not change it):**
- **World Bible ch. 13b** — hidden kingdom values (Authority, Royal Share, Unity, Succession Risk, Treasury), factions with Discontent, and **hidden fuses**: trigger conditions, a "not before" date, 2–3 outcomes, never a script; what reaches Li is limited by distance and messengers.
- **Numbers Sheet §11** — the 8 fuses with "not before", trigger and who decides (decision trees: build stage 4).
- **World Bible §10.6** — "The son lives" fuse (Li's identity).
- **Atlas §3, §10, §13, §14** — houses, Li's generation, legends, rumours.
- **Code today** — `WORLD_CLOCK` (5 fixed dates near Li), `GM_SECRETS`, `atlas-public.ts`.

**What is missing, and what this proposal adds:** (A) how news travels to Li, (B) how Li can push each fuse, (C) story seeds, (D) what the code keeps. Three layers, as discussed on Oct 12: **fixed core** (the canon above) · **living layer** (A, B) · **free space** (C, plus people Claude invents and the code records).

---

## A. News travels (distance and delay) — proposal

A fuse fires on its own date wherever Li is. What Li *learns*, and when, depends on where he is (World Bible ch. 12b "what reaches Li").

| Where Li is, relative to the event | First he hears | Delay | How exact |
|---|---|---|---|
| In the same place | he sees it | 0 | true |
| Same province | soldiers' talk | 1–3 days | mostly true |
| Same kingdom | a messenger, the market | 7–15 days (Kurogane relay posts: 4–8) | the official version |
| Another kingdom | a merchant, a refugee | 20–40 days | half true, changed |
| Far side of the land | a rumour, a song | 40–90 days | a legend, often wrong |

Each event has a **true version** (code) and a **public version** (what people say). Claude only ever gets the public version unless Li is there.

## B. How Li can push each fuse — proposal (the outcomes stay those of the canon)

| Fuse (canon) | Not before | What Li could do (if he is there, with enough rank/trust) | Effect (code decides) |
|---|---|---|---|
| Gōda's coup (Kurogane) | Y100 M9 | carry a warning to the King's Men; guard the palace that night; or serve Gōda | changes "the King's Men's readiness" / who holds the palace guard |
| Great canal (Kurogane) | Y101 | find or report Kawabe's letters; protect Kawabe | starts the inquiry early, or delays it |
| Hostage heir (Suiren) | Y102 | free or escort Okitsu Tōmaru out of Hanaoka | removes the hostage condition |
| Bribed slander (Hayate) | Y101 M3 | expose the bribe; or carry the money | Kagami executed / rebels / plot exposed |
| Slow usurpation (Ushio) | Y103 | protect the child king; or back the regent | changes popularity / authority |
| Pass revolt (Takane) | Y101 | win or lose the battle that triggers it; carry Hayate's offer | changes Sakaguchi's loyalty or the battle condition |
| King's death (Tatara) | — | expose the canal plot (−3 months) | moves the date |
| Hostage prince's revenge (Kitakaze) | Y101 M6 | warn the court; catch the bribed Kamio guards | "whether anyone warns the court" |
| The son lives (§10.6) | — | how Li fights in front of veterans; what he says | an ally reaches out / a veteran turns hostile / killers from Suiren |

Rule: Li can **only change the inputs** a fuse already has in the canon. The outcome is still decided by the code, deterministically. If Li is far away, the fuse runs without him.

## C. Story seeds — proposal (the free space)

A seed is a situation, not a script. Claude may **plant** one when Li's place and stage fit; the code records it (planted / grown / dead) so it is never forgotten or repeated. A missed seed can return in another form (GM rule 10).

Format: **name · where it can grow · stage · what it needs · what it can become**

1. **The man who knew the footwork** · anywhere with old soldiers · slave → soldier · a veteran of the Suiren wars sees Li fight · an ally, or a danger (feeds §10.6).
2. **Raizen's bridge** · the band · slave · Raizen drunk, a night, Li close · Li learns the legend was 120 men, not 300, and why Raizen left Suiren (Atlas §4 secret, partly).
3. **Gonza's side trade** · the band · slave · Li sees supplies sold at night · leverage, a deal, or a beating (Atlas §4 secret).
4. **Hisame's past** · the band · slave → soldier · trust with Hisame · the Mist Valley deserter; a teacher of the bow, or someone hunted.
5. **Kaname's village** · Sasabe and the border · slave → soldier · the Y100 raid (WORLD_CLOCK day 35) · a fighter who remembers who helped.
6. **Daisuke's challenge** · the levy · slave → soldier · Li and Daisuke both enlist · a rival who becomes a brother-in-arms, or a grudge.
7. **Sayo's question** · Akaishi · slave → soldier · Li works near the Hagiwara household · a door into the nobility; "the barrier" made personal.
8. **The canal's letters** · near Kawabe Sekkei · soldier → officer · Li carries or sees papers · the Great canal fuse (B).
9. **The northern embassy** · Seikyō · soldier → officer · Y101 M6 · the assassination fuse (B).
10. **A sword for sale** · Kinza or a castle town · any · money, a merchant · a blade with a history (never Kage or Hikari unless the canon path leads there).
11. **The girl under a false name** · Takane, a mining village · officer+ · Li travels to Takane · Shiraiwa Tōta, then Mei (Atlas §10 🔒) — the family goal.
12. **Ryūnosuke's pride** · Kurogane army · soldier → officer · both rise · a rival inside Li's own army (Atlas §10).
13. **Akabane Hayame** · Suiren, or a battlefield · officer+ · Li fights Suiren · the nemesis: son of the man who set the trap (Atlas §10).
14. **The Single Path** · Suiren's poor, slaves · any · high taxes in Suiren · an uprising Li can join, use or crush (Atlas §12).
15. **A song about the Twin Demon** · any market · any · a singer, a crowd · the official lie (Atlas §13); a chance for Li to learn one true detail.

More seeds are added the same way; each comes from the Atlas or the World Bible, never invented outside them without the owner.

## D. What the code keeps — proposal

- **Fuses:** each fuse is a record (state: waiting / armed / fired / changed; inputs; outcome). Firing and outcomes are deterministic (Numbers §11; decision trees in build stage 4). Events like every other change.
- **News:** a fired fuse makes one *public* event per region with its delay (A); Claude's memory gets only what has reached Li.
- **Seeds:** planted / grown / dead, with the place and day; Claude sees the open ones near Li.
- **Invented people:** everyone Claude names is recorded at once (already true: the `person` change); never contradicted.

## E. Build order — proposal

1. News delay (A) and the public versions of the 5 dates already in `WORLD_CLOCK`.
2. The two Kurogane fuses Li can reach first (Gōda's coup, the canal) as records with the Numbers §11 triggers; Li's inputs (B).
3. Seeds (C): the record, the planting rule, seeds 1–7 (slave and early soldier life).
4. The other fuses and seeds when Li's life reaches them (stage by stage).

## Questions for the owner

1. The news delays in A: right feel, or should news travel faster (more drama) or slower (more realistic)?
2. In B, should Li be able to *serve* the bad side (Gōda, the regent), or only resist them?
3. Any seed in C you want removed, or one you want added? (Your dream moments from earlier fit here.)
4. Build order E: start with the coup and the canal, or with the seeds near the band?
