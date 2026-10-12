# FILMS — short anime films in Sengoku Soldier (✅ built Oct 10, page version 16)

**Built:** all seven films in `web/films/` + `web/films.css`, sound synthesized with Web Audio (`web/films/sound.ts`, no files). **Owner decisions (Oct 10):** images yes, sound yes, **mystery**: the opening has no wooden dragon and nothing ties the boy to the Twin Demon. **Deviation:** the three AI stills were generated in Canva (Twin Demon, snow pass, eye; same style) but Canva only returned 200-px thumbnails here, so every shot is drawn in SVG ink silhouettes instead; the stills can replace shots 5 and 7 of the opening and the eye of the Zone later (Canva media MAHXmFrEGyg, MAHXmF-KDVw, MAHXmCDjLMY).

Built from the owner's film brief. Filled in from the canon: **Premise** — Li Hattori, twelve, a slave of a mercenary band in the seven kingdoms, is the lost son of the murdered general called the Twin Demon; he must rise from nothing without ever saying his father's name. **Style direction** — Kingdom anime framing plus sumi-e ink painting, dark palette (chosen; see Style).

**Adaptation to the game (one honest note):** the brief asks for one long scroll page where each moment plays when it scrolls into view. The game shows its moments when they *happen* (an event), as a full-screen overlay. The spec below keeps both: every film is a self-contained `<section class="film">` that the same runtime can start **on scroll into view** (a showcase page) or **on a game event** (the game). Same markup, same CSS, two triggers.

---

## 1. The opening

- **Verdict:** short film. It is the first thing every player sees and sets the whole look; today it is ten text slides.
- **Shots:**
  1. Wide, establishing: a golden imperial city under a pale sky, seven banners on its walls. Slow push-in.
  2. Wide: the same city burning at night; embers rising. Impact freeze on a falling roof (3 frames white flash, then still).
  3. Mid: seven banners tear free one by one and fly apart across a map of the land (ink map, seven coloured washes bleeding out).
  4. Wide: riders cross the screen left to right on a ridge line, banners of two kingdoms facing each other across a river (the Kurose).
  5. Mid, still image: the Twin Demon, two swords, back to camera, on a hill above a river battle (Ken Burns zoom). Narration of the legend.
  6. Close-up: two crossed swords on a wall, a hand-carved wooden dragon below them. Cut to black.
  7. Wide, still image: a mountain pass in a snowstorm; a lantern carried low; a small boy behind a woman. Snow falls in front (CSS particles).
  8. Title card: the line in brush letters, painted stroke by stroke.
- **Duration:** about 42 s (shots of 5 / 5 / 5 / 5 / 7 / 4 / 6 / 5).
- **Skippable:** yes. Click or tap = next shot; the "Skip" button (top right) or Escape = straight to the title card; a second press ends the film.
- **Text:** narration, one line per shot, set at the bottom in Spectral italic:
  1. "For four hundred years, one Empire ruled the land."
  2. "Then the capital burned."
  3. "Seven Wardens crowned themselves. Seven kingdoms."
  4. "A hundred years of war."
  5. "In Suiren a peasant's son rose with two swords. They called him the Twin Demon."
  6. "In Year 95 he fell on a night road. 'Kurogane raiders,' the songs say."
  7. (none — wind only)
  8. Title, brush: "One boy. Seven kingdoms at war. A father's name he must not say."
- **Sound:** yes. Low wind bed throughout; one taiko hit on shot 2's freeze; silence on shot 6; a single shakuhachi note under the title.
- **Build:**
  - **Layers (back to front):** sky gradient → far ridge → mid ridge → city silhouette (shots 1–2) / map wash (3) / still image (5, 7) → flame haze (2) → embers (2) → riders (4) → snow particles (7) → impact flash → letterbox bars → vignette → caption bar → skip button.
  - **Tech:** mix. SVG/CSS for shots 1–4, 6, 8; AI stills for shots 5 and 7.
  - **How:**
    - Root: `<section class="film" data-film="opening">` holding one `<svg class="stage" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">` plus one `<div class="shot" data-dur="5000">` per shot.
    - Sky: `<rect class="layer--sky" fill="url(#sky-dawn)">`; shot 2 swaps the gradient to `#sky-fire` by toggling `.is-night` on the stage (CSS `transition: fill 1.2s`).
    - Ridges: two `<path class="layer--ridge-far|mid">` (shared component, below). Parallax: `@keyframes drift { from { transform: translateX(0) } to { transform: translateX(-40px) } }` on the far ridge, `-90px` on the mid ridge, `linear`, over the shot duration.
    - Push-in (shot 1): `.stage { animation: push 5s cubic-bezier(.2,.0,.2,1) forwards }`, `@keyframes push { from { transform: scale(1) } to { transform: scale(1.08) } }`.
    - City silhouette: one `<path class="layer--city">` with rooflines; fire = `<g class="layer--flames">` of 12 `<path>` tongues animated with `@keyframes flicker { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(1.15) } }`, `transform-origin: bottom`, 0.6–1.1 s, `ease-in-out`, `alternate`, staggered `animation-delay` by `nth-child`.
    - Embers: shared particle component (`.fx-embers`), 40 `<i>` elements, `@keyframes rise { to { transform: translate(var(--dx), -900px); opacity: 0 } }`, 4–7 s, `linear`, `infinite`, per-element `--dx` and delay set in the markup.
    - Impact freeze: `.fx-flash` (full-screen white `<div>`) `@keyframes flash { 0% { opacity: .9 } 100% { opacity: 0 } }` 120 ms `steps(2)`; at the same moment add `.is-frozen` to the stage: `animation-play-state: paused` on all layers for 400 ms.
    - Map (shot 3): `<g class="layer--map">` with 7 `<path>` regions, each `fill-opacity` 0 → .55 with `@keyframes bleed` (0.8 s, `ease-out`, delay 0.35 s × index); the banners are 7 small `<path>` flags that fly out with `transform: translate(var(--tx), var(--ty)) rotate(var(--r))` over 1.4 s `cubic-bezier(.5,0,.2,1)`.
    - Riders (shot 4): one `<symbol id="rider">` (horse + rider silhouette) used 9 times with `<use>`, a `@keyframes ride { from { transform: translateX(-200px) } to { transform: translateX(1800px) } }` 4.5 s `linear`, staggered 0.15 s; a 2-frame bob `@keyframes gallop { 50% { transform: translateY(-4px) } }` 0.32 s `steps(2) infinite` on an inner `<g>`.
    - Stills (shots 5, 7): `<image class="layer--still" href="…">` inside the stage, Ken Burns `@keyframes kenburns { from { transform: scale(1.04) translate(0,0) } to { transform: scale(1.14) translate(-2%, -1%) } }` over the shot, `ease-out`.
    - Swords (shot 6): two `<path class="sword">` drawn with `stroke-dasharray`/`stroke-dashoffset` from length → 0 in 1.2 s `ease-out`; the wooden dragon is a small still or an SVG silhouette, `opacity` 0 → 1 after the swords.
    - Snow (shot 7): shared `.fx-snow`, 60 `<i>`, `@keyframes fall { to { transform: translate(var(--dx), 950px) } }` 6–11 s, `linear`, `infinite`, two depths (big and blurred in front, small behind).
    - Title (shot 8): shared brush title component: each word is an SVG `<text>` with a mask whose `<path>` reveals it via `stroke-dashoffset` (1.6 s per line, `cubic-bezier(.6,0,.2,1)`), then a red seal `<rect>` stamps in (`scale(1.4) → 1`, 180 ms, `cubic-bezier(.2,1.6,.4,1)`).
    - Trigger: the game calls `Film.play('opening')` after "Begin"; on a showcase page it starts when 60% of the section is in view.
  - **Assets:** two AI stills, 1920×1080 (16:9), WebP ≈ 250 KB each, plus a 1080×1350 crop for phones: `opening-twin-demon.webp` (shot 5), `opening-snow-pass.webp` (shot 7). Stored as page assets (artifact `assets` capability) or inline. Sounds: `wind-loop.mp3`, `taiko-hit.mp3`, `shakuhachi-note.mp3` (CC0 sources, ≤ 150 KB each).
  - **Canon check (open owner question):** shots 5 → 7 let a player guess that the boy is the Twin Demon's son. Keep it as the hook, or move the wooden dragon (shot 6) out to keep it a true mystery.

## 2. Li's first battle

- **Verdict:** short film — only the first battle (later battles get the 2-second title card). The first battle is the moment the slave arc turns into the war.
- **Shots:**
  1. Wide: dawn mist over the field, two lines of banners face each other; the camera slides right (parallax ridges).
  2. Wide: the enemy line steps forward, spears lowered; speed lines from the edges.
  3. Mid: Li's own unit from behind, small figures in the line (silhouettes), one smaller than the rest.
  4. Close-up: a hand tightening on a spear shaft (still or silhouette), a drop of sweat.
  5. Impact: the lines meet — white flash, shake, freeze; the battle's name in brush letters.
- **Duration:** about 12 s (3 / 2.5 / 2.5 / 2 / 2).
- **Skippable:** yes, click/tap = next shot, Skip = the battle panel.
- **Text:** shot 5 only: the battle's name and the numbers the code gives, e.g. "The ford at Kōri · ~6,000 against ~4,800". No inner voice (the canon: Claude never writes what Li thinks or says for him).
- **Sound:** yes. Distant drums from shot 1, rising; a war cry swell into shot 5; hard cut to silence on the freeze.
- **Build:**
  - **Layers:** sky gradient (`#sky-dawn`) → far ridge → mid ridge → mist band → enemy line → ally line → Li's unit → speed lines → impact flash → letterbox bars → vignette → caption.
  - **Tech:** pure SVG/CSS (one optional still for shot 4).
  - **How:**
    - Lines of soldiers: `<symbol id="soldier">` (spear + helmet silhouette) placed with `<use>` in two `<g class="layer--line">` rows of ~40; the enemy row `transform: translateY(0) → translateY(30px)` and `scale(1) → 1.05` in 2.5 s `ease-in` (stepping forward); spears tilt via `rotate(-35deg) → rotate(-70deg)` on each `<use>`'s spear `<g>`.
    - Mist: `<rect class="layer--mist" fill="url(#mist)">` with `@keyframes drift` (shared) at 60 px over 12 s and `opacity .7 → .3`.
    - Speed lines: shared `.fx-speed` — an `<svg>` of 48 `<line>` from the edges toward the centre, `stroke-dasharray: 60 900`, `@keyframes rush { from { stroke-dashoffset: 960 } to { stroke-dashoffset: 0 } }` 0.35 s `linear infinite`, `opacity` 0 → .8.
    - Impact (shot 5): shared `.fx-flash` (120 ms) + shared `.fx-shake` on the stage (`@keyframes shake { 0%{transform:translate(0,0)} 25%{transform:translate(-8px,4px)} 50%{transform:translate(6px,-6px)} 75%{transform:translate(-4px,2px)} 100%{transform:translate(0,0)} }` 240 ms `steps(4)`), then 600 ms freeze (`animation-play-state: paused`), then the brush title (shared).
    - Trigger: the game calls `Film.play('battle-first', { name, numbers })` when the first `battle` event is recorded; later battles call `Film.card(name)`.
  - **Assets:** none required; optional `battle-grip.webp` 1600×900. Sounds: `drums-far.mp3`, `war-cry.mp3`.

## 3. The Zone waking

- **Verdict:** short film. It is Li's hidden gift (SHINKEN NO RYŪ) waking at a true near-death moment, once in the whole game; the canon requires the name to appear.
- **Shots:**
  1. Close-up: Li's eye, half shut; the screen drains to grey (colour gone).
  2. Extreme close-up: a single heartbeat — the frame pulses; sound drops away.
  3. Mid, frozen: the enemy's blade stopped in the air, dust motes hanging still; thin speed lines pulled inward.
  4. Close-up: the eye opens; a red ring (the seal colour) flares in the iris.
  5. Impact: "SHINKEN NO RYŪ" slams onto the screen in brush letters with the kanji 真剣ノ流 large and faint behind it; colour floods back.
- **Duration:** about 7 s (1.5 / 1 / 1.5 / 1 / 2).
- **Skippable:** yes (click/tap = jump to shot 5); never auto-skipped, because it plays once.
- **Text:** shot 5 only: "SHINKEN NO RYŪ". Nothing else.
- **Sound:** yes, then silence: two heartbeats, total silence on shots 3–4, one sharp blade ring on shot 5.
- **Build:**
  - **Layers:** last scene's frame (a CSS snapshot: the duel display behind) → grey filter overlay → eye still → dust motes → blade silhouette → inward speed lines → red iris ring → kanji backdrop → title → vignette.
  - **Tech:** mix: one AI still (the eye), the rest SVG/CSS.
  - **How:**
    - Colour drain: on the film root `filter: grayscale(0) → grayscale(1)` and `contrast(1) → contrast(1.3)` over 1.2 s `ease-in`; colour back on shot 5 in 200 ms.
    - Heartbeat: `@keyframes beat { 0%,100% { transform: scale(1) } 15% { transform: scale(1.03) } 30% { transform: scale(1) } }` 0.9 s, twice, on the stage.
    - Freeze: dust motes = shared particle component with `animation-play-state: paused`; the blade = `<path class="blade">` static at an angle.
    - Inward speed lines: shared `.fx-speed` with `animation-direction: reverse` and `stroke` at 30% opacity.
    - Iris ring: `<circle class="iris" r="38">` over the eye still, `stroke: var(--seal)`, `stroke-dasharray` circumference → 0 (draws itself) in 0.5 s, then `@keyframes glow { to { filter: drop-shadow(0 0 12px var(--seal)) } }`.
    - Title: shared impact (flash + shake) and the brush title; the kanji `<text class="kanji">` at 30% opacity, `scale(1.3) → 1` in 400 ms `cubic-bezier(.2,1.4,.4,1)`.
    - Trigger: the game calls `Film.play('zone')` when the knowledge key `shinken_no_ryu` is first recorded (the code only allows it when Li is badly wounded).
  - **Assets:** `zone-eye.webp`, 1920×1080, an extreme close-up of a boy's eye in ink style, dark. Sounds: `heartbeat.mp3`, `blade-ring.mp3`.

## 4. "I AM LI HATTORI"

- **Verdict:** short film. The second-biggest moment of the story (a long goal); it plays only when the player writes the name.
- **Shots:**
  1. Wide: the scene goes silent — the people around Li turn as one (silhouettes rotating toward camera); letterbox bars close in.
  2. Close-up: Li's face in shadow, the wind lifting his hair (silhouette).
  3. Impact: the shout in huge brush letters across the frame, shake, the red seal stamps.
  4. Mid: the faces of those who heard (two or three silhouettes) — one steps back.
- **Duration:** about 8 s (2 / 1.5 / 2.5 / 2).
- **Skippable:** yes (click/tap = next shot).
- **Text:** shot 3: the player's own words, set in the brush title (whatever they wrote, e.g. "I AM LI HATTORI"). No narration.
- **Sound:** yes: wind cuts out on shot 1 (silence), one huge taiko hit on shot 3, wind back on shot 4.
- **Build:**
  - **Layers:** dark sky gradient → crowd silhouettes → Li silhouette → hair/cloth strips → letterbox bars → impact flash → title → seal → vignette.
  - **Tech:** pure SVG/CSS.
  - **How:**
    - Crowd turn: `<use href="#figure">` × 12 with `transform: scaleX(1) → scaleX(-1)` staggered 60 ms (a flip reads as "turning to look"), `ease-in-out`, 300 ms each.
    - Letterbox: shared `.fx-letterbox` (two black `<div>`s) `height: 0 → 12vh` in 600 ms `cubic-bezier(.4,0,.2,1)`.
    - Hair/cloth: 5 `<path>`s with `@keyframes sway { 50% { transform: skewX(-8deg) } }` 1.4 s `ease-in-out infinite`.
    - Shout: shared brush title at 1.6× size, revealed in 500 ms (faster than the opening's), shared flash + shake + seal stamp.
    - Trigger: the game calls `Film.play('name', { words })` when the knowledge key `said_hattori` is first recorded (the code records it only when the player's own text contains the name).
  - **Assets:** none. Sound: `taiko-big.mp3`, `wind-loop.mp3` (shared).

## 5. A promotion

- **Verdict:** static panel with one stamp. It happens many times; a film would get in the way after the second time.
- **Shots:** one panel: the new rank in brush letters on paper, the men commanded below, a red seal stamps in.
- **Duration:** about 2.5 s, then it waits for a click.
- **Skippable:** yes (any click/tap closes it).
- **Text:** the rank and men, e.g. "Gochō · 5 men", and the line from the record ("Made Gochō at the reward ceremony").
- **Sound:** one drum hit with the stamp.
- **Build:**
  - **Layers:** ink background → paper card → rank title → men line → seal → vignette.
  - **Tech:** pure CSS (reuses the legend screen that exists today).
  - **How:** paper card `transform: translateY(20px) → 0`, `opacity 0 → 1`, 400 ms `ease-out`; title via the shared brush title (0.8 s); seal stamp (shared, 180 ms). Trigger: the game calls `Film.card('promotion', { rank, men, line })` on a `status` event that sets a new rank.
  - **Assets:** none. Sound: `drum-single.mp3`.

## 6. A death

- **Verdict:** static panel, almost no motion. In Kingdom-style drama a death lands harder in stillness than in effects.
- **Shots:** one panel: the person's name written vertically in brush on the right, a single falling petal (or ash, in a battle) crossing the frame once, slow fade.
- **Duration:** about 5 s, then it waits for a click.
- **Skippable:** yes, but only after 2 s (a first click before that is ignored, so a death cannot be clicked away by accident).
- **Text:** the name, and one line from the record ("Hachi died at the ford."). Nothing else.
- **Sound:** none — the wind cuts to silence.
- **Build:**
  - **Layers:** ink background (desaturated) → vertical name → petal → vignette (heavier than elsewhere).
  - **Tech:** pure SVG/CSS.
  - **How:** the name is `<text writing-mode="vertical-rl">` revealed by a mask `stroke-dashoffset` over 1.8 s `ease-in-out`; the petal is one `<path>` on `offset-path` (a CSS motion path) over 4 s `ease-in-out`, once; the whole panel `opacity 0 → 1` over 800 ms. Trigger: `Film.card('death', { name, line })` on a `status` event with `alive: false` for a person Li has met.
  - **Assets:** none.

## 7. A chapter end

- **Verdict:** short film, very short: an ink wipe, then the chapter card. It marks time passing, like the end of a manga volume.
- **Shots:**
  1. An ink stroke sweeps across the screen left to right, covering the last scene.
  2. The card: "Chapter 3 · The Ford", the first lines of the chapter recap in Spectral italic.
- **Duration:** about 3 s for the wipe and title, then it waits for a click.
- **Skippable:** yes (click/tap).
- **Text:** the chapter number, its title, the first two sentences of the recap Claude wrote.
- **Sound:** a soft brush swish.
- **Build:**
  - **Layers:** last scene → ink wipe → paper card → title → recap lines.
  - **Tech:** pure SVG/CSS.
  - **How:** the wipe is one wide `<path class="ink-wipe">` with a ragged brush edge, `stroke-dashoffset` from length → 0 in 900 ms `cubic-bezier(.7,0,.3,1)`; the card fades in after it (400 ms); the title uses the shared brush title. Trigger: `Film.card('chapter', { n, title, text })` on a `chapter` event.
  - **Assets:** none. Sound: `brush-swish.mp3`.

---

## Style

- **One look:** *Kingdom* (the 2012 anime and its manga) for framing and impact — wide armies, banners, speed lines, hard freezes on a hit — painted like *Vagabond*'s ink pages: sumi-e brush edges, paper grain, silhouettes instead of detailed faces. Motion stays limited-animation (2- and 4-step loops, holds on key poses), like TV anime, not smooth motion graphics.
- **Palette: dark.** Ink black `#0E1014` and `#171A20`, paper `#E9E0CA`, faded `#A79F8C`, seal red `#A8361F` (blood, the Zone, stamps), gold `#C9A55E` (titles, honour). Two scene accents only: ember orange `#C8452F` (fire) and snow blue `#8FA7BC` (cold). These are the game's approved tokens, so the films and the game read as one thing.
- **AI stills share one fixed prompt tail:** "sumi-e ink painting in the style of a dark seinen manga, heavy brush strokes, paper texture, limited palette of black, warm paper and a single red accent, cinematic 16:9 composition, no text". Every still is generated with it, and only those that match the rest are kept.

## Build system

- **One file:** the game is already built into one self-contained HTML page (`dist-web/sengoku-soldier.html`). The films are vanilla HTML, CSS and JavaScript inside it: no framework, nothing to install for the player. (The game's own source is TypeScript bundled by one script; the film runtime is written as plain JavaScript-compatible TypeScript, so it ports anywhere.)
- **Markup convention:**
  - `<section class="film" data-film="<id>">` — one per moment; hidden until played.
  - inside: `<svg class="stage" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">` with `<g class="layer layer--<name>">` back to front;
  - shots: `<div class="shot" data-dur="<ms>">` holding the caption for that shot; the runtime adds `.is-on` to the active shot and `data-shot="<n>"` to the film, and CSS selectors like `.film[data-shot="2"] .layer--flames { … }` start each shot's animations;
  - shared effects: `.fx-flash`, `.fx-shake`, `.fx-speed`, `.fx-letterbox`, `.fx-embers`, `.fx-snow`, `.fx-vignette`, `.brush-title`, `.seal-stamp`;
  - shared SVG `<defs>` once per page: gradients `#sky-dawn`, `#sky-fire`, `#sky-night`, `#mist`; symbols `#ridge-far`, `#ridge-mid`, `#rider`, `#soldier`, `#figure`; the paper-grain `<filter id="paper">` (feTurbulence + feDisplacementMap).
- **Runtime (about 80 lines):** `Film.play(id, data)` returns a Promise that resolves when the film ends: it fills the data slots (names, numbers, words), shows the section, walks the shots by their `data-dur` with `setTimeout`, and toggles the classes. Click/tap anywhere = next shot; the Skip button or Escape = last shot, a second press = end. `Film.card(kind, data)` is the same runtime for one-shot panels. CSS does all motion (`@keyframes` on `transform`, `opacity`, `stroke-dashoffset`, `filter` only — never layout properties).
- **Triggers:** in the game, engine events call `Film.play` (the opening after "Begin", the first `battle`, `shinken_no_ryu`, `said_hattori`, a rank `status`, a death, a `chapter`). For a showcase page, one `IntersectionObserver` (threshold 0.6) calls the same function when a section scrolls into view. **Cinematic autoplay variant:** `Film.playAll(['opening', 'battle-first', 'zone', 'name', 'promotion', 'death', 'chapter'])` chains the Promises with no input.
- **Rules every film keeps:** `prefers-reduced-motion` shows each shot's last frame for its duration with no motion; sound only starts after the player's first click (browser rule) and has a mute toggle; every film can be skipped; each film is under ~60 KB of markup and CSS, stills ≤ 300 KB each.
- **Porting later:** each `section.film` maps to one component with props (`data` slots) and one method (`play`); the shared effects map to small components; the CSS ports as is.

## Priority order

1. **The opening** — every player sees it first, and it sets the style for all the others.
2. **The Zone waking** — the single biggest power moment of the story.
3. **Li's first battle** — it turns the slave arc into the war, and its pieces (lines, speed lines, impact) are reused by the other films.
