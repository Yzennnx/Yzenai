# What if Left 4 Dead Suddenly Became Real? — Master Series Plan

**Creative reference:** [Nightmare Roulette camera, pacing, and voice guide](../../references/long-form-camera-voice/README.md) (especially [Zooming, looking-around POV, and intensifying motion](../../references/long-form-camera-voice/README.md#zooming-looking-around-pov-and-intensifying-motion)) and [source study](../../references/long-form-camera-voice/source-study.md).

**Status:** **Part 1 Complete & Verified** (`4:22` master [part-1-master.mp4](part-1/exports/part-1-master.mp4)) · **Part 2 Complete & Verified** (`4:02` master [part-2-master.mp4](part-2/exports/part-2-master.mp4) · Combined `8:24` [l4d-real-life-parts-1-2.mp4](exports/l4d-real-life-parts-1-2.mp4)) · **Part 3 ready to plan**.  
**Premise:** The moment the lead dies playing *Left 4 Dead* late at night in his 7th-floor apartment, a federal bio-lab breach triggers a real citywide zombie outbreak with *Left 4 Dead*–style special infected. Over two nights and two dawns, he barricades, crafts improvised armor, sneaks out for supplies, scores a pump-action shotgun and pistol at a shuttered gunsmith workshop, fights his way past special infected to the tallest skyscraper for Dawn Evacuation, and survives a final Tank chase onto the rooftop when a military rescue helicopter arrives.  
**Format and aspect ratio:** Long-form 3-Part feature, **16:9 widescreen (1920 × 1080, 24 fps)**. Built as **12 modular chapters (~65–102 s each)** that stitch into **3 standalone Parts** and **1 full ~15:00 compilation**.  
**Target runtime:** ~15 minutes total (`Part 1: 4:22 verified` · `Part 2: ~4:00 planned` · `Part 3: ~6:50`).  
**Narrator and tone:** Approved **Dark Horror Series Narrator** (local Chatterbox Nano CPU, approved reference WAV, unhurried `0.93–1.04×` cadence, `<= 18` words/chunk, no hyphens). Second-person immersive narration (*"What if Left 4 Dead suddenly became real..."*). Grounded, tense, observant delivery with deliberate silent holds for sound cues (banging doors, dropped phone, crying Witch, Tank footsteps, helicopter rotors).

---

## Modular Production Architecture

Each chapter stays at ~60–70 seconds (~1,440–1,680 frames)—matching the proven memory and render footprint of our 64-second shorts on this Windows PC—so we never risk OpenToonz/Edge/Remotion overload and can revise any single chapter in minutes.

```text
episodes/l4d-real-life/
  series-plan.md                  # This master continuity & structure bible
  part-1/
    plan.md                       # Detailed script, maps, and motion briefs (Ch 1A–1C)
    ch-1a/  ch-1b/  ch-1c/        # Independent chapter folders (poses, scene, voice, render, edit)
    exports/
      part-1-rough-cut.mp4        # Full 3:20 rough cut verified before detailed animation
      part-1-final.mp4            # Final stitched ~3:20 Part 1
  part-2/
    plan.md                       # Detailed script, maps, and motion briefs (Ch 2A–2C)
    ch-2a/  ch-2b/  ch-2c/
    exports/part-2-final.mp4      # Final stitched ~3:20 Part 2
  part-3/
    plan.md                       # Detailed script, maps, and motion briefs (Ch 3A–3F)
    ch-3a/  ch-3b/  ch-3c/  ch-3d/  ch-3e/  ch-3f/
    exports/part-3-final.mp4      # Final stitched ~6:35 Part 3
  exports/
    l4d-real-life-full-13min.mp4  # Complete stitched ~13-minute feature
```

### Build order per Part (following `AGENTS.md` long-form rules)
1. Save `part-N/plan.md` with overhead maps, timed shot list, and motion briefs.
2. Audition two opening reads for the Part's opening chapter; lock the chosen voice take and generate chapter narration blocks.
3. Build a **Part-length rough cut** (key poses + simple blocking + timed narration + sound placeholders) and review pacing, geography, and chapter handoffs end to end.
4. Animate and motion-check each chapter (`--stills` + silent phone/widescreen motion previews) in order (`A → B → C ...`), render clean 1920 × 1080 masters, assemble captions/timings in Remotion, and stitch the verified Part MP4.
5. Only after Part 1 is verified, draft `part-2/plan.md` (carrying exact continuity from Part 1), then `part-3/plan.md`, and finally stitch Parts 1–3 into the full compilation.

---

## Master 3-Part / 12-Chapter Beat Map

| Part & Chapter | Est. Time | Running Time | Core Event & Situation Change | Question / Action Carrying Forward |
| --- | --- | --- | --- | --- |
| **Part 1 — Ch 1A:** *Game Over, Lockdown Real* | 1:15 | 0:00–1:15 | Dies in-game; phone flashes federal lab breach lockdown alert; `eye-dart` → POV whip-pan → `ecu-dread` crash-zoom panic → calms down → locks deadbolt (`pov-door-lock`) & barricades door (`shove`); fridge holds 5 days of food; stepped high-angle reveal of special infected below; draws thin kitchen knife. | Food will run out in 5 days—how do you get out alive? |
| **Part 1 — Ch 1B:** *Five Days & Midnight Escape* | 1:25 | 1:15–2:40 | 5-day wall tally (`chalk-grip`); packs bag & wraps cardboard + tape armor; midnight `sneakAt` crouch-creep past pounding hallway zombie; phone drops & lights up (`ecu-dread` + `glance-back`)—saved by sudden citywide blackout; dead elevator (`bell-press`) → walks down empty stairs → 1F pillar lean-out spots 3 zombies → brief panic → spots broken glass vase & throws a shard that bounces and skids loudly across the lobby tile to lure them away. | Outside on the dark street with low supplies—find food fast. |
| **Part 1 — Ch 1C:** *The Tongue & The Car Alarm* | 1:42 | 2:40–4:22 | Walks steadily down the foggy street toward a flickering market; Smoker-type tongue snares neck & drags him forward fighting heels; straight-arm 24 fps `slash` cuts free with kitchen knife (blade chips/bends) → `sprintAt` with pole parallax wipes; grocery store packed inside; smashes parked car to trigger alarm, athletic split-leg `vault` behind dumpster as horde empties out, raids bulging pack, then sneaks out (`00:38 AM`) and wanders shuttered backstreets (`02:15 AM → 03:40 AM → 04:55 AM`) searching for cover as gray dawn breaks (`05:08 AM`, `look-up`). | Morning is minutes away—find a defensible city shelter now. |
| **Part 2 — Ch 2A:** *Shelter Before Sunrise* | 1:18 | 4:22–5:40 | `24` fast-cut shots (`1.8–4.4 s` avg): spots 2nd-floor shuttered bookstore loft with iron pull-up fire ladder; jumps & climbs as dawn-waking runners slam the wall below; hauls ladder up & bolts window; checks Smoker neck burn & chipped/bent kitchen knife; daylight shutter-slit horde time-lapse; `7%` battery phone buzzes with looped alert: *"EVAC HELICOPTER — APEX TOWER ROOFTOP, DAWN."* | You have a destination and deadline, but the bent kitchen knife won't survive the streets. |
| **Part 2 — Ch 2B:** *Night Weapon Run & The Pouncer* | 1:22 | 5:40–7:02 | `30` fast-cut shots (`1.8–3.2 s`, `2.73 s` avg): Night 2 search hits looted hardware store & jammed cruiser; hooded Hunter drops from tin awning; **cardboard-and-tape arm wrap stops the bite** (shredding cardboard); upward stab snaps the kitchen knife blade clean off at the hilt; **5-angle dynamic escape sprint** (side `sprintAt` → puddle boot splash → front `glance-back` → OTS Hunter leap → POV alley dash) through a heavy steel workshop side door, barricaded with an iron workbench before spotting a glinting glass counter in the dark. | Unarmed inside a dark locked workshop smelling of gun oil—what's inside? |
| **Part 2 — Ch 2C:** *The Gunsmith Jackpot* | 1:20 | 7:02–8:22 | `24` fast-cut shots (`1.8–4.5 s` avg): `4%` phone flashlight (`pov-flashlight`) reveals a shuttered custom **gunsmith workshop**; stepped beam reveal & tactile load of a **pump-action shotgun (6 shells)** and **9mm pistol (12 rounds + spare mag)**; straps **heavy leather work gloves** over torn cardboard armor; cracks rear alley door, sights Apex Tower's blinking red beacon, and racks one shell. | Armed at last—cross the infected city quietly and save every shell for emergencies. |
| **Part 3 — Ch 3A:** *The Weeping Plaza* | 1:05 | 6:40–7:45 | Four blocks from the tower, eerie sobbing halts you; knowing gunfire will draw the whole block and you never startle a Witch, you lower the shotgun, kill your flashlight, and creep over broken glass past the crouched **Weeping Stalker (Witch-type)**—freezing dead still on a single crunch until she settles. | Two blocks left—silence holds, but the intersection ahead is blocked. |
| **Part 3 — Ch 3B:** *Bile & Acid at the Barricade* | 1:05 | 7:45–8:50 | Outside Apex Tower's outer barricade, a bloated **Boomer-type** and rooftop **Spitter-type** cut off the street; using the game's rule not to get close, you aim your **pistol** from cover and **pop the Boomer at safe range**—splashing bile away from you into the Spitter's acid alley while runners swarm the noise, letting you sprint into the narrow tower approach lane. | Your first gunshots broke the silence—and something heavy bellows at the far end of the lane. |
| **Part 3 — Ch 3C:** *The Bottleneck Charge (Charger)* | 1:05 | 8:50–9:55 | Between stalled cars in the narrow approach to Apex Tower, a lopsided **Charger-type** (massive oversized right smashing arm) lowers its shoulder and **bull-charges full-speed straight at you**; you dive behind a concrete bollard at the last split-second as it crashes headfirst into a wrecked van, dazed—then rack the **pump shotgun** and drop it with **two thunderous close-range blasts** before bolting through Apex Tower's shattered glass entrance. | Your shotgun just proved its stopping power—but those loud blasts echoed straight into the skyscraper. |
| **Part 3 — Ch 3D:** *The Lobby Ambush (Tank)* | 1:05 | 9:55–11:00 | Drawn by the shotgun blasts, rhythmic concrete thumps shake dust from the dark marble lobby ceiling; you turn to see a **massive Tank** blocking the shattered entrance; you fire two blasts from the **same shotgun** into its chest—unlike the Charger, it barely flinches and hurls a marble slab across the lobby as you dive into the `STAIRS` door. | Even buckshot can't stop it—outrun the Tank up 40+ flights of stairs. |
| **Part 3 — Ch 3E:** *Forty Flights Up* | 1:05 | 11:00–12:05 | Vertical chase past `12F` → `24F` → `38F`; Tank smashes straight through concrete railings below; you fire retreating shotgun blasts down the shaft to stagger it just enough to keep climbing—until the shotgun clicks **empty** on Floor 38; you drop it, draw your **pistol**, and scramble battered through the `ROOF ACCESS` hatch. | Shotgun gone and down to your last pistol mag—reach the dawn helipad. |
| **Part 3 — Ch 3F:** *Nowhere Left Up & Dawn Rescue* | 1:10 | 12:05–13:15 | Tank punches straight through the roof hatch onto the windy dawn helipad; backing toward the ledge, you unload your **final pistol rounds** until the **slide locks dry (`CLICK-CLICK`)**; weaponless and exhausted, you drop to your knees and give up—then a military rescue helicopter rises over the ledge, **minigun tracers** shred the Tank down, and lifts you off over the burning dawn skyline. | Closing callback: cracked phone screen reads `NO SIGNAL` as the tower shrinks below. |

---

## Continuity Bible (Character, Props, and Original Infected Cast)

### Series Lead Visual & Cinematography System (v2 — Zero Three-Quarter Turnarounds)
Every chapter uses the upgraded [articulated series lead](../../assets/series-lead/README.md) (`art.js` + `poses.mjs`) and applies the *Nightmare Roulette* [zooming, looking-around POV, and motion-intensification playbook](../../references/long-form-camera-voice/README.md#zooming-looking-around-pov-and-intensifying-motion):

- **Body & camera perspectives:** Strictly **Front, Side, and Back** from [reference-sheet.png](../../assets/series-lead/reference-sheet.png) (never front/rear three-quarter turnarounds) plus [cinematic anatomy angles](../../assets/series-lead/angles-sheet.png) via `drawCinematicAngle` (`ots`, `overhead`, `low-angle`, `high-angle`).
- **12 sculpted emotions & face micro-acting:** [front reactions](../../assets/series-lead/reactions-front.png) + [side reactions](../../assets/series-lead/reactions-side.png) (`head`, `head-notice`, `head-alarm`, `head-dread`, `head-panic`, `head-strain`, `head-determined`, `head-angry`, `head-exhausted`, `head-pain`, `head-sneak`, `head-relief`), plus [face angles & crash-zooms](../../assets/series-lead/face-angles.png) and [cinematic face & camera motion reel](../../assets/series-lead/anatomy-prototype/cinematic-face-camera-reel.mp4) (`eye-dart`, `head-tilt`, `look-up`, `look-down`, `glance-back`, `ecu-dread`).
- **6 dynamic survival movement tracks:** [dynamic survival movement reel](../../assets/series-lead/anatomy-prototype/dynamic-movements-reel.mp4) and [frame guide](../../assets/series-lead/anatomy-prototype/README.md#dynamic-survival-movements) — `sneak` (`sneakAt` for `Ch 1B` hallway & `Ch 3A` Witch), `flinch` (`Ch 1C` Smoker & `Ch 2B` Hunter), `sprint` (`sprintAt` for `Ch 1C`, `Ch 3B–3E`), `shove` (`Ch 1A` bookshelf barricade), straight-arm `slash` (`Ch 1C` tongue cut & `Ch 2B` Hunter stab), and `vault` (`Ch 1C` dumpster & `Ch 3C` Charger dodge).
- **First-person POV hands:** [POV survival hand sheet](../../assets/series-lead/hands/pov-survival-sheet.png) via `drawPovSurvivalHand` (`pov-door-lock` for `Ch 1A`/`1B`/`2B`, `pov-flashlight` for `Ch 2C`/`3A`, `pov-pipe-grip` for melee/knife weapon inserts, `pov-shield-face` for `Ch 2B`/`3C`/`3D` shock/recoil) alongside [close-up hand references](../../assets/series-lead/hands/reference-sheet.png) (`chalk-grip`, `bell-press`, `bar-press`, `bar-hold`, `ticket-pinch`).
- **Mandatory cinematography rules across all 12 chapters:**
  1. **Zero dead holds:** Every tension hold uses a slow `5–15%` creeping push-in plus sequential micro-acting (`eye-dart` → sweat drop slide → `head-tilt` → metallic blade glint).
  2. **Stepped push-in escalation:** Multi-detail reveals (window special infected in `1A`, gunsmith weapons in `2C`, Tank lobby reveal in `3D`) step closer on each spoken noun.
  3. **Audio-motivated POV turns:** Pair an off-screen sound cue with `eye-dart` or `glance-back` → fast horizontal POV whip-pan → 1.5–2 s search hold.
  4. **Foreground parallax wipes:** Pass dark doorframes, pillars, and streetlights *in front of* the lead faster than the background during walks and sprints (`Ch 1A`, `1B`, `1C`, `3B–3E`).
  5. **Rhythmic POV lockdown montages:** Compress urgent multi-prop actions into crisp ~1 s tactile inserts locked to hard foley snaps (`door lock → barricade shove` in `1A`, `drawer yank → knife glint` in `1A`, `shotgun rack → blast` in `3C–3E`).
  6. **Zero long plain shots (Interactive Multi-Angle Rule — Part 2 & Part 3):** Never hold a single plain side-view run, walk, or climb for 5–7+ seconds. Target **`1.5–4.0 s` per camera setup** (`23–26` distinct shots per ~80 s chapter), breaking longer actions into interactive angle shifts (`side sprint` → `boot/hand close-up` → `front reaction / glance-back` → `POV rush` → `OTS threat check`).

| Chapters | Outfit & Armor | Weapon & Pack | Condition / Wear |
| --- | --- | --- | --- |
| `1A` | Cream collared shirt (tie loosened/off at home), charcoal-blue trousers, brown shoes | None → **kitchen knife** (stainless chef blade) | Clean, pale panic sweat during lockdown alert |
| `1B–1C` | Shirt + **corrugated cardboard & gray duct-tape forearm/shin wraps** | Dark canvas backpack (low → full after grocery) + **kitchen knife** (blade nicks/bends slightly in `1C`) | Dusty knees, neck scuff/red line from Smoker tongue (`1C`) |
| `2A–2B` | Same cardboard wraps (**right forearm cardboard shredded with bite marks** in `2B`) | Backpack + bent kitchen knife (**snaps off in `2B`**) | Exhausted dark under-eyes, bruised shoulder |
| `2C–3C` | Torn cardboard reinforced with **heavy leather work gloves/straps** | Backpack + **pump-action shotgun** (strapped/two-handed, first fired in `3C` to kill the Charger) + **9mm pistol** (drawn in `3B`) | Workshop dust on sleeves, disciplined `head-notice` |
| `3D–3F` | Leather straps scuffed, cream shirt torn & concrete-dusted | Fires shotgun in `3D–3E` until **empty** (dropped on 38F); empties **pistol** on rooftop (`3F`, slide locks back) → unarmed | Bleeding scrape on cheek, gunpowder haze, heavy exhaustion (`head-strain` → slumped acceptance → `head-relief` on chopper) |

### Original Cutout Infected Cast *(Left 4 Dead–inspired archetypes, 100% original project art)*
All infected are built as original textured cutout rigs/silhouettes in the series' dark-outlined painterly style (zero third-party game models, textures, or audio):
1. **Common Runners (`1A–3B`):** Lean, jagged-posture gray-slate silhouettes with pale eyes and tattered clothes; sluggish/hunched at night, frantic when alerted by light or sound.
2. **Tongue-Snarer / Smoker-type (`1A` cameo, `1C` ambush):** Tall, hunched silhouette wreathed in pale toxic-green spore haze, whipping a long dark-crimson barbed tongue from rooftop shadows.
3. **Pouncer / Hunter-type (`1A` cameo, `2B` ambush):** Hooded crouched runner with taut muscular limbs, low raspy growl, explosive leaping silhouette.
4. **Weeping Stalker / Witch-type (`3A`):** Gaunt pale silhouette with long dark hair and razor-like elongated fingers, hunched sobbing under dim light; glows faint crimson only when startled.
5. **Bile-Carrier / Boomer-type (`1A` cameo, `3B`):** Heavily bloated, blistered silhouette with glowing sickly-yellow pustules; bursts violently if slashed at close range.
6. **Acid-Spitter / Spitter-type (`3B`):** Elongated, crooked-neck silhouette dripping neon-green luminescent bile that pools and sizzles on asphalt.
7. **The Charger (`3C`):** Asymmetric, broad-chested brute with one **enormous, mutated right smashing arm** and a tiny shriveled left arm; lowers its shoulder and bull-charges in a straight line, shattering cars or walls when dodged.
8. **The Tank (`3D–3F`):** Massive, towering broad-shouldered concrete-scarred colossus (nearly 2.5× the lead's shoulder width) built as a dedicated heavy-limb OpenToonz/canvas cutout rig that shakes camera framing on every footstep.

### Recurring Props & Sound Callbacks
- **Smartphone:** Buzzes with lockdown alert (`1A`) → clatters face-up on 7th-floor tile (`1B`) → 7% battery dawn-evac text (`2A`) → flashlight beam in gunsmith (`2C`) & killed before Witch (`3A`) → final `NO SIGNAL` cracked-screen beat (`3F`).
- **Sound & Ammo Discipline:** Heavy door banging (`1B`) → thrown stone clicks (`1B`, `1C`) → blaring car alarm (`1C`) → dead-silent glass steps past the Witch (`3A`) → first **pistol shots** popping the Boomer (`3B`) → **Charger bull-roar & first shotgun blasts** (`3C`, proving the shotgun's power while alerting the Tank!) → **shotgun blasts & pump racks** echoing up the stairwell (`3D–3E`) → hollow **empty trigger clicks** (`3E–3F`) → roaring helicopter rotors + **minigun tracers** (`3F`).

---

## Zero-Cost Local Toolchain & Widescreen Note

- **Tools ($0 local):** OpenToonz 1.8.0 (Modified BSD) via [shared cutout renderer](../../tools/opentoonz/README.md), headless Microsoft Edge canvas compositor (`1920 × 1080` widescreen; logical coordinate space `960 × 540` scaled `2×`), portable FFmpeg 9.0.2 for audio mixing and chapter/Part stitching, Chatterbox Nano CPU narrator (MIT, local reference WAV +0.5 semitone), and local Remotion editor (eligible free license).
- **Widescreen Remotion support:** Already added optional `width` / `height` props in `tools/remotion/timeline.jsx` and `tools/remotion/edit.mjs` (defaulting to `1080 × 1920` for shorts, while `1920 × 1080` widescreen chapters render clean bottom-third captions clear of action).
- **Chapter stitching:** `ffmpeg -f concat` joins verified chapter exports (`ch-1a`, `ch-1b`, `ch-1c`) into `part-1/exports/part-1-final.mp4`, and later joins Parts 1–3 into the full 12-minute feature with lossless stream copy or single clean master encode.
