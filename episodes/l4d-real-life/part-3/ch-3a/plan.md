# Chapter 3A Scene-by-Scene Production Plan — *The Weeping Plaza*

**Parent plans:** [Part 3 Master Plan](../plan.md) · [Series Master Plan](../../series-plan.md)  
**Creative & motion references:** [Nightmare Roulette Guide](../../../../references/long-form-camera-voice/README.md) · [Series Lead Turnaround](../../../../assets/series-lead/reference-sheet.png) · [Cinematic Angles](../../../../assets/series-lead/angles-sheet.png) · [Face Angles](../../../../assets/series-lead/face-angles.png) · [POV Survival Hands](../../../../assets/series-lead/hands/pov-survival-sheet.png) · [Dynamic Movements](../../../../assets/series-lead/anatomy-prototype/README.md#dynamic-survival-movements)

**Status:** **Scene-by-Scene Plan Ready (Awaiting Approval)** — do NOT generate audio or render until approved.  
**Specs:** `1920 × 1080` (16:9 widescreen, logical `960 × 540` scaled `2×`) · `24 fps` · **`76.0 s` (`1,824` frames)** · **`25` interactive shots** (avg **`3.04 s/shot`**, range `2.4–3.8 s`, ZERO long plain shots).

---

## 1. Exact Continuity & Visual Contract (Entering `Ch 3A` @ `00:48 AM`)

| Element | Locked Visual & Mechanical State Throughout `Ch 3A` |
| --- | --- |
| **Time & Setting** | `00:48 AM` → `00:56 AM` (3 minutes after leaving Miller Custom Gunsmith in `Ch 2C`). Four dark blocks from Apex Tower, crossing a shattered civic plaza under one dying flickering cyan streetlamp. |
| **Clothing & Armor (Unified Bone Transform)** | Cream collared shirt (loosened burgundy tie), charcoal-blue trousers, scuffed brown shoes, cardboard-and-tape shin wraps, **Hunter-shredded right forearm cardboard reinforced with heavy dark brown leather work gloves & wrist straps** (from `Ch 2C`). Zero cuff/sleeve seam drift. |
| **Wound & Wear** | **Raw red Smoker rope-burn centered on mid-lower front neck** (fixed turnaround coordinate from `Ch 1C`), subtle workshop dust on sleeves, bulging dark canvas backpack (drawn *behind* torso in Front view, clean shoulder straps only). |
| **Weapons & Ammo** | **12-gauge pump shotgun: `6` shells (`1` chambered + `5` in tube)** — **0 fired in `Ch 3A`** (strict silence discipline!). **9mm pistol: `24` rounds** (`12` in mag + `12` spare at belt) — holstered entire chapter. |
| **Smartphone** | Cracked screen at **`3% BATTERY`**, flashlight OFF; double-checked and killed completely dark in Shot 8 (`0:20.4–0:23.2`). |
| **New Articulated Infected Rig — The Witch** | Original cutout `drawWitch(cx, cy, scale, state, phase)`: curved hunched spine/ribs, bent elbows & knees, long tangled dark hair curtain, razor-elongated jointed fingers, and animated crimson eye-glow (`0.0` sobbing → `1.0` startled growl → `0.0` settling back down). Zero flat triangles or stick limbs. |

---

## 2. OpenToonz Side-Rig Segments (`ch-3a/poses.mjs`, `356` Total Frames)

Only the 5 side-view body-action shots invoke OpenToonz (`rigAt` with continuous floating-point `local` frames — never `Math.round()`). All other 20 shots use `drawCinematicAngle`, `drawFaceAngle`, Front bust rigs, macro prop/boot inserts, or studio POV hands with unified leather-gloved cuffs.

| Segment | Shot # | Frame Range (`24 fps`) | Local Time | Frames | Pose Track & Continuity |
| --- | --- | --- | --- | --- | --- |
| **Seg 1** | Shot 1 | `f0..76` | `0:00.0–0:03.2` | `77` | `shot1ReadyWalk` — seamless continuation of `Ch 2C` Shot 26 low-ready tactical walk (`head-determined`, leather gloves anchored on shotgun forend & stock). |
| **Seg 2** | Shot 11 | `f706..777` | `0:29.4–0:32.4` | `72` | `shot11StealthCreep` — low-crouch `sneakAt` stealth glide left → right along plaza wall (`head-sneak`, shotgun tucked low against chest). |
| **Seg 3** | Shot 15 | `f984..1041` | `0:41.0–0:43.4` | `58` | `shot15GlassFreeze` — locked mid-stride crouch freeze (`head-alarm` → `head-dread`), rear heel half-lifted over snapped glass shard, zero body wobble. |
| **Seg 4** | Shot 21 | `f1430..1501` | `0:59.6–1:02.6` | `72` | `shot21StealthExit` — slow cautious `sneakAt` clearing the final 10 yards to the dark side-avenue archway (`head-sneak`). |
| **Seg 5** | Shot 23 | `f1574..1650` | `1:05.6–1:08.8` | `77` | `shot23AvenueWalk` — rising smoothly out of stealth into steady low-ready `shot1ReadyWalk` down the foggy avenue (`head-determined`). |

---

## 3. Scene-by-Scene & Shot-by-Shot Production Blueprint (`25` Shots · `f0..1823`)

### Scene 1 — Entering the Shattered Civic Plaza (`Shots 1–3`, `0:00.0–0:08.8`, `f0..211`)

- **Shot 1 (`0:00.0–0:03.2`, `f0..76`, `3.2 s`) — Midnight Fog Wide + Foreground Pole Parallax**
  - **Render mode:** OpenToonz `Seg 1` (`shot1ReadyWalk`) + widescreen foggy avenue background + corner clock `00:48 AM` + fast foreground dark lamp-post parallax wipe (`f36..54`).
  - **Composition:** Lead walks left → right (`x = 260 → 470`) with leather-gloved hands holding pump shotgun low-ready, bulging pack, cardboard shin wraps. Distant Apex Tower red beacon blinks softly far right.
  - **Audio:** Cold midnight wind, cautious rubber soles on damp asphalt, low stalking bass (`76 BPM`).

- **Shot 2 (`0:03.2–0:06.0`, `f77..143`, `2.8 s`) — Tight Front Bust (`head-determined`)**
  - **Render mode:** Front bust (`art.js` Front view + `drawFrontNeckBurn` centered mid-lower neck + backpack hidden *behind* torso, clean shoulder straps only + faint red beacon catchlight in eyes).
  - **Camera:** Slow creeping `1.00× → 1.07×` push-in with gentle walking bob as he steps out of the narrow gunsmith alley mouth into open plaza shadow.
  - **Audio:** Steady footsteps; faint distant city groan.

- **Shot 3 (`0:06.0–0:08.8`, `f144..211`, `2.8 s`) — Subjective POV Plaza Sweep**
  - **Render mode:** First-person POV (`1.00× → 1.12×` push-in + subtle horizontal pan left → right): wide moonlit civic plaza, overturned concrete benches, glittering broken glass shards carpeting the foreground apron, dry stone fountain pedestal right-center under one dying flickering cyan streetlamp (`~18 Hz` subtle flicker).
  - **Audio:** Faint wind-chime tinkle of loose glass; buzzing cyan streetlamp.

### Scene 2 — The Sobbing & The Witch Reveal (`Shots 4–9`, `0:08.8–0:26.2`, `f211..628`)

- **Shot 4 (`0:08.8–0:11.6`, `f211..278`, `2.8 s`) — Audio Cue → `eye-dart` Freeze**
  - **Render mode:** Official `drawFaceAngle('eye-dart')` (`head-notice` → `head-dread`, neutral eye offset so pupils track cleanly right inside sclera, mid-neck burn visible, single sweat bead forming at `f245`).
  - **Action:** **HARD MUSIC DROPOUT at `0:09.0`!** Eerie hollow female sobbing drifts in at `0:09.4`; lead freezes dead still and pupils snap right.
  - **Audio:** **SILENT VOICE GAP (`09.00–10.20 s`)** — hollow echoing Witch sobbing (`09.4 s`) cuts through dead silence.

- **Shot 5 (`0:11.6–0:14.4`, `f278..345`, `2.8 s`) — Slow Creeping POV Pan Toward Fountain**
  - **Render mode:** Subjective POV panning slowly left → right (`1.00× → 1.14×` push-in) across shattered concrete toward the flickering cyan lamp pool around the dry fountain pedestal.
  - **Audio:** Echoing sobs grow clearer and closer; cold wind hush.

- **Shot 6 (`0:14.4–0:17.8`, `f345..427`, `3.4 s`) — Stepped Push-In (`1.00× → 1.32×`) — The Weeping Stalker (Witch)**
  - **Render mode:** Articulated `drawWitch(520, 385, 1.0, 'sobbing', phase)` crouched on the cracked stone fountain base directly beneath the buzzing cyan lamp: hunched pale ribs/shoulders rocking gently, long dark hair curtain hanging over knees, razor-long fingers covering her face, zero red eye glow yet.
  - **Audio:** Shivering high violin harmonic + haunting rhythmic sobbing breath.

- **Shot 7 (`0:17.8–0:20.4`, `f427..489`, `2.6 s`) — Off-Center `ecu-dread` Crash-Zoom**
  - **Render mode:** Official `drawFaceAngle('ecu-dread')` (`head-dread`, dark upper-face horror shadow wash, sweat bead sliding down temple, mid-neck Smoker burn visible in lower third).
  - **Camera:** Crisp off-center punch (`1.06× → 1.16×`) locking onto his right eye.
  - **Audio:** Close-mic heartbeat enters (`72 BPM`); distant sobbing.

- **Shot 8 (`0:20.4–0:23.2`, `f489..556`, `2.8 s`) — Downward POV Phone Kill (`3% → BLACK`)**
  - **Render mode:** Studio POV hand (`drawUnifiedArmoredCuff` with shredded right forearm + dark brown leather work glove & wrist strap) holding cracked smartphone showing dim `3% · FLASHLIGHT OFF`; gloved thumb clicks side power button at `f518` → screen snaps completely black and slides cleanly into trouser pocket.
  - **Audio:** Tiny dull button click (`0:21.6`); quiet cloth pocket rustle.

- **Shot 9 (`0:23.2–0:26.2`, `f556..628`, `3.0 s`) — Close-Up Shotgun Lower (`pov-pipe-grip` Leather Gloves)**
  - **Render mode:** Tight chest-level insert of both leather-gloved hands (`drawUnifiedArmoredCuff` unified transform) slowly lowering the matte-black pump shotgun barrel downward across his coat, index finger lifting cleanly straight *outside* the trigger guard.
  - **Audio:** Soft leather creak; zero metallic clink; sobbing echoing in distance.

### Scene 3 — The Glass Crossing (`Shots 10–13`, `0:26.2–0:38.2`, `f628..916`)

- **Shot 10 (`0:26.2–0:29.4`, `f628..705`, `3.2 s`) — High-Angle Plaza Geography Reset**
  - **Render mode:** `drawCinematicAngle('high-angle')` establishing spatial map: lead crouched on far-left shadowed wall (`x = 175`), jagged glass apron carpeting foreground (`x = 240..700`), Witch sobbing mid-right under cyan lamp (`x = 610`), dark exit archway far right (`x = 875`).
  - **Camera:** Slow `1.00× → 1.06×` drift.
  - **Audio:** Hollow night air; sobbing echoes cleanly across open stone.

- **Shot 11 (`0:29.4–0:32.4`, `f706..777`, `3.0 s`) — OpenToonz Side Stealth (`sneakAt`) + Foreground Pillar Wipe**
  - **Render mode:** OpenToonz `Seg 2` (`shot11StealthCreep`, `head-sneak`, shotgun tucked tight) gliding left → right along shadowed brick wall; a dark foreground stone colonnade pillar wipes across the lens (`f734..754`) while the glowing cyan Witch pool sits softly out of focus in mid-right background.
  - **Audio:** Ultra-soft rubber soles; low tense sub-drone (`76 BPM`).

- **Shot 12 (`0:32.4–0:35.2`, `f778..844`, `2.8 s`) — Low Ground-Level Boot Insert Stepping Around Shards**
  - **Render mode:** Ground-level macro insert: articulated bent knee, charcoal trouser leg, cardboard-and-tape shin wrap, and brown boot **extending cleanly past `y < -60` top frame edge** (zero severed/floating limb!). Toe lowers carefully in slow motion between three glittering triangular glass shards (`f795..835`).
  - **Audio:** Faint dust whisper; held breath.

- **Shot 13 (`0:35.2–0:38.2`, `f845..916`, `3.0 s`) — Rear `ots` Mid-Plaza Check**
  - **Render mode:** Official `drawCinematicAngle('ots')` (bulging dark canvas pack + leather-gloved shoulder in lower-left foreground; clear night plaza background); 25 feet ahead right-center, `drawWitch(..., 'sobbing')` still rocks beneath the flickering cyan lamp.
  - **Audio:** Rhythmic sobbing; heartbeat climbs (`84 BPM`).

### Scene 4 — The Glass Crunch & The Statue Test (`Shots 14–20`, `0:38.2–0:59.6`, `f917..1429`)

- **Shot 14 (`0:38.2–0:41.0`, `f917..983`, `2.8 s`) — Tight Boot Close-Up — Hidden Glass Shard Snaps (`CRK-CRUNCH!`)**
  - **Render mode:** Ground-level boot insert (bent knee & taped shin extending cleanly past top frame edge): back heel eases down in deep shadow onto a hidden glass sliver—at **`f941` (`0:39.2 s`)**, the shard **fractures into three bright white splinters** under the sole!
  - **Audio:** **SILENT VOICE GAP (`38.60–40.90 s`)** — sharp piercing glass **`CRK-CRUNCH!` (`0:39.2 s`)** → Witch sobbing **CUTS DEAD INSTANTLY (`0:39.5 s`)!**

- **Shot 15 (`0:41.0–0:43.4`, `f984..1041`, `2.4 s`) — Instant Freeze — Side `sneakAt` Locked Mid-Stride**
  - **Render mode:** OpenToonz `Seg 3` (`shot15GlassFreeze`, `head-alarm` → `head-dread`): lead locked completely motionless mid-step, back heel half-lifted over the cracked shard, shotgun frozen against chest—zero sway. Slow `1.00× → 1.08×` creeping camera push-in keeps the hold alive.
  - **Audio:** `"The sobbing stops."` (`40.90–42.40 s`) → **`1.10 s` TOTAL HORROR SILENCE (`42.40–43.50 s`)!**

- **Shot 16 (`0:43.4–0:47.0`, `f1042..1127`, `3.6 s`) — Stepped Push-In (`1.00× → 1.38×`) — Witch Raises Her Head**
  - **Render mode:** Articulated `drawWitch(500, 390, 1.15, 'alert-lift', phase)`: rocking stops dead; razor-fingered hands slowly part away from her face (`f1050..1095`), dark hair curtain splits, and **two glowing crimson pinpoint eyes ignite (`glow: 0 → 0.92`)** locking straight toward the shadowed wall!
  - **Audio:** Deep wet guttural Witch warning growl (`0:44.4 s`) + piercing dissonant violin harmonic!

- **Shot 17 (`0:47.0–0:50.0`, `f1128..1199`, `3.0 s`) — Off-Center `ecu-dread` Hold**
  - **Render mode:** Official `drawFaceAngle('ecu-dread')` (`head-dread`, creeping `1.00× → 1.12×` push-in, sweat drop rolling steadily past his cheek, mid-neck burn visible): eyes locked dead forward without blinking.
  - **Audio:** Pounding close-mic heartbeat (`104 BPM`); low Witch growl hovering underneath.

- **Shot 18 (`0:50.0–0:53.0`, `f1200..1271`, `3.0 s`) — Macro Trigger-Guard Restraint (Leather Glove)**
  - **Render mode:** Macro close-up of dark brown leather-gloved right hand (`drawUnifiedArmoredCuff` unified sleeve/strap) gripping matte-black shotgun receiver: gloved index finger rests **straight along the metal frame millimeters above the trigger**, trembling microscopically (`±0.6 px`) without pulling!
  - **Audio:** Faint leather tension creak; Witch's low snarl peaks.

- **Shot 19 (`0:53.0–0:56.8`, `f1272..1362`, `3.8 s`) — Long-Lens Witch Tension Hold & Settle**
  - **Render mode:** Articulated `drawWitch(500, 385, 1.20, 'poised-listen', phase)` (`1.00× → 1.10×` push-in): rises half an inch off her heels (`f1272..1315`, `glow = 1.0`, claws scraping stone) → holds listening in total tension (`f1315..1336`) → **at `f1338` (`0:55.8 s`), crimson eye glow dims (`1.0 → 0.0`)** as her shoulders slump and hands drop back over her face!
  - **Audio:** **SILENT VOICE GAP (`54.80–56.40 s`)** — Witch growl hovers (`54.8–55.6 s`), then dissolves cleanly back into hollow echoing sobbing (`55.8 s`)!

- **Shot 20 (`0:56.8–0:59.6`, `f1363..1429`, `2.8 s`) — Tight Front Relief Exhale**
  - **Render mode:** Front bust (`head-dread` → `head-relief`, mid-neck burn, subtle cold mist breath puff escaping his nose at `f1385`, shoulders easing down half an inch while eyes stay fixed right).
  - **Audio:** Soft shaky exhale (`0:57.5 s`); dissonant violin eases down.

### Scene 5 — Clearing the Plaza & Closing on Apex Tower (`Shots 21–25`, `0:59.6–1:16.0`, `f1430..1823`)

- **Shot 21 (`0:59.6–1:02.6`, `f1430..1501`, `3.0 s`) — OpenToonz Side `sneakAt` — Final 10 Yards to Arch**
  - **Render mode:** OpenToonz `Seg 4` (`shot21StealthExit`, `head-sneak`) gliding silently left → right over clean stone pavers into the dark stone side-avenue archway (`x = 760`).
  - **Audio:** Ultra-quiet footsteps; distant sobbing fading behind left.

- **Shot 22 (`1:02.6–1:05.6`, `f1502..1573`, `3.0 s`) — Rear `ots` Glance-Back from Dark Archway**
  - **Render mode:** Official `drawCinematicAngle('ots')` from deep archway shadow looking back across the plaza: the Witch is now a small hunched silhouette rocking undisturbed under the lonely flickering cyan lamp far behind.
  - **Audio:** Faint distant sobbing + hollow midnight avenue wind.

- **Shot 23 (`1:05.6–1:08.8`, `f1574..1650`, `3.2 s`) — OpenToonz Upright Walk Into Foggy Avenue**
  - **Render mode:** OpenToonz `Seg 5` (`shot23AvenueWalk`, `head-determined`): past the archway, lead straightens out of stealth into a steady tactical walk left → right, leather gloves shifting firmly onto the shotgun forend, foreground streetlamp wiping past (`f1608..1624`).
  - **Audio:** Steady boots on damp pavement; disciplined low pulse (`82 BPM`) returns.

- **Shot 24 (`1:08.8–1:12.4`, `f1651..1736`, `3.6 s`) — 2-Beat Skyline Lock: `look-up` (`1.6 s`) → Apex Tower Closer (`2.0 s`)**
  - **Render mode:** `f1651..1689` (`1:08.8–1:10.4`): Official `drawFaceAngle('look-up')` (`head-determined`, mid-neck burn). `f1690..1736` (`1:10.4–1:12.4`): Stepped `1.00× → 1.28×` skyline push-in onto **Apex Tower** looming noticeably larger through the fog, red rooftop beacon pulsing (`BLINK… BLINK…`).
  - **Audio:** Rhythmic distant beacon pulse + rising cold night strings.

- **Shot 25 (`1:12.4–1:16.0`, `f1737..1823`, `3.6 s`) — Dramatic `low-angle` Cliffhanger Push-In**
  - **Render mode:** Official `drawCinematicAngle('low-angle')` (`hideLimbs: true` + connected bent cream-sleeved arms, shredded right wrap under leather wrist straps, sculpted leather-gloved hands gripping pump shotgun, `head-determined`), slow `1.00× → 1.14×` push-in facing down the dark avenue toward Apex Tower's red beacon, cutting cleanly to black at `f1823` (`1:16.0`).
  - **Audio:** Deep ominous horror brass swell (`1:14.4–1:15.8 s`) → clean cut to black (`1:16.0 s`).

---

## 4. Exact Voice Script & Timing Contract (`ch-3a/generate-voice.py`)

Unified close-mic baritone horror profile (`exaggeration=0.45`, `temperature=0.68`, `top_p=0.90`, `semitones=-1.35`, `minimum_speed=0.91`, clean close-mic studio EQ + `acompressor`, zero `aecho`, zero hyphens, zero `!`). Every chunk is **`0.43–0.52 s/word`** (`>= 0.42 s/word` guardrail).

| # | Window (`s`) | Dur | Words (`s/w`) | Spoken Line (Split Across Caption Pages) | Emphasis Words |
| --- | --- | --- | --- | --- | --- |
| 1 | `0.15–5.90` | `5.75 s` | `12` (`0.48`) | `["Six shotgun shells, twenty four pistol rounds,", "and four dark blocks left."]` | `SIX SHELLS TWENTY FOUR BLOCKS` |
| 2 | `6.00–9.00` | `3.00 s` | `7` (`0.43`) | `["Your shortcut cuts across a glass plaza."]` | `SHORTCUT GLASS PLAZA` |
| — | *`9.00–10.20`* | *`1.20 s`* | *SFX GAP* | *(Score drops out → eerie Witch sobbing starts at `09.4 s`)* | — |
| 3 | `10.20–14.30` | `4.10 s` | `9` (`0.46`) | `["Wait. Stop moving.", "Do you hear that crying ahead."]` | `WAIT STOP CRYING` |
| 4 | `14.40–17.75` | `3.35 s` | `7` (`0.48`) | `["A Witch, sobbing beneath the flickering lamp."]` | `WITCH SOBBING LAMP` |
| 5 | `17.85–23.10` | `5.25 s` | `11` (`0.48`) | `["Rule number one.", "Kill your light before she ever sees it."]` | `RULE ONE KILL LIGHT` |
| 6 | `23.20–26.15` | `2.95 s` | `6` (`0.49`) | `["Lower the shotgun. Stay completely quiet."]` | `LOWER SHOTGUN QUIET` |
| 7 | `26.25–32.30` | `6.05 s` | `12` (`0.50`) | `["Thirty yards of broken glass.", "Crouch low and edge along the wall."]` | `BROKEN GLASS CROUCH LOW` |
| 8 | `32.40–38.60` | `6.20 s` | `12` (`0.52`) | `["Every step takes three seconds.", "Halfway across, and she is still rocking."]` | `THREE SECONDS STILL ROCKING` |
| — | *`38.60–40.90`* | *`2.30 s`* | *SFX GAP* | *(Hidden glass shard `CRK-CRUNCH!` at `39.2 s` → sobbing stops dead at `39.5 s`)* | — |
| 9 | `40.90–42.40` | `1.50 s` | `3` (`0.50`) | `["The sobbing stops."]` | `SOBBING STOPS` |
| — | *`42.40–43.50`* | *`1.10 s`* | *SILENCE* | *(Frozen mid-stride in total horror silence)* | — |
| 10 | `43.50–46.95` | `3.45 s` | `7` (`0.49`) | `["Her hands drop, and red eyes lift."]` | `HANDS DROP RED EYES` |
| 11 | `47.05–52.95` | `5.90 s` | `12` (`0.49`) | `["Every instinct begs you to shoot.", "Hold your finger off the trigger."]` | `SHOOT OFF TRIGGER` |
| 12 | `53.05–54.80` | `1.75 s` | `4` (`0.44`) | `["Become a stone statue."]` | `STONE STATUE` |
| — | *`54.80–56.40`* | *`1.60 s`* | *SFX GAP* | *(Witch growl hovers → red glow dims & sinks back into sobbing at `55.8 s`)* | — |
| 13 | `56.40–59.55` | `3.15 s` | `7` (`0.45`) | `["She sinks back down into her hands."]` | `SINKS BACK DOWN` |
| 14 | `59.65–65.50` | `5.85 s` | `12` (`0.49`) | `["Inch by inch, you clear the square,", "leaving her undisturbed behind you."]` | `CLEAR SQUARE UNDISTURBED` |
| 15 | `65.60–70.20` | `4.60 s` | `10` (`0.46`) | `["All six shells still loaded.", "Not a single infected alerted."]` | `SIX SHELLS LOADED` |
| 16 | `70.30–74.40` | `4.10 s` | `9` (`0.46`) | `["Apex Tower blinks closer.", "Silence will not last forever."]` | `APEX TOWER SILENCE` |
| — | *`74.40–76.00`* | *`1.60 s`* | *SWELL* | *(Deep ominous brass swell → clean cut to black at `76.0 s`)* | — |

---

## 5. Pre-Render Visual Still QA Checklist (`--stills`)

Before committing to the full `1,824`-frame Edge + OpenToonz render, inspect these **16 key-pose stills**:
`--stills 36 110 245 390 460 520 595 665 745 815 880 945 1010 1095 1235 1320 1780`

1. **Shot 1 (`f36`):** OpenToonz `shot1ReadyWalk` — leather gloves anchored flush on pump shotgun, shredded right wrap & straps aligned, pole parallax wipe clean.
2. **Shot 2 (`f110`) & Shot 4 (`f245`):** Front bust & `eye-dart` — backpack hidden behind torso (no floating green bars), mid-neck Smoker burn centered, pupils aligned cleanly inside sclera.
3. **Shot 6 (`f390`), Shot 16 (`f1095`), Shot 19 (`f1320`):** Articulated Witch rig — curved hunched spine/elbows/claws (zero flat triangles), hair curtain parts cleanly, crimson eye glow reads clearly at phone size.
4. **Shot 8 (`f520`) & Shot 9 (`f595`):** Studio POV hands — unified leather gloves + torn cardboard cuffs, cracked `3%` phone screen legible, trigger finger cleanly off trigger.
5. **Shot 12 (`f815`) & Shot 14 (`f945`):** Boot inserts — bent knees & taped shins extend cleanly past `y < -60` top frame edge (zero severed/floating limbs); glass shard clearly fractures at `f945`.
6. **Shot 13 (`f880`):** Rear `ots` — full plaza background clear, pack & shoulder properly anchored in lower-left foreground.
7. **Shot 15 (`f1010`):** OpenToonz `shot15GlassFreeze` — locked mid-stride crouch over broken glass, zero wobble.
8. **Shot 18 (`f1235`):** Macro trigger-guard restraint — gloved index finger clearly straight beside trigger on matte receiver.
9. **Shot 25 (`f1780`):** `low-angle` cliffhanger — connected bent cream-sleeved arms with leather cuffs/gloves holding shotgun cleanly against foggy avenue & red Apex Tower beacon.
