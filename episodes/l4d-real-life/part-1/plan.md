# Part 1: The 7th Floor & First Night Out (What if Left 4 Dead Became Real?)

**Creative reference:** [Nightmare Roulette camera, pacing, and voice guide](../../../references/long-form-camera-voice/README.md) · [Master series plan](../series-plan.md).

**Status:** Planning — Awaiting user approval on detailed shot-by-shot script, intense horror music design, and horror voice direction before implementation  
**Premise:** The exact second the lead dies playing *Left 4 Dead* late at night in his 7th-floor apartment, a federal bio-lab breach triggers a real citywide outbreak with *Left 4 Dead*–style special infected. With only five days of food and a kitchen knife, he barricades, crafts cardboard-and-tape armor, sneaks out at midnight through a sudden citywide blackout, slashes free from a Smoker-type's tongue on the silent road, and triggers a car alarm to loot a zombie-packed grocery store just before dawn.  
**Format and aspect ratio:** Long-form Part 1 of 3 (divided into 3 modular chapters: `ch-1a`, `ch-1b`, `ch-1c`), **16:9 widescreen (1920 × 1080, 24 fps)**.  
**Target runtime:** **3 minutes 20 seconds (200 seconds)** — `Ch 1A: 65 s` · `Ch 1B: 70 s` · `Ch 1C: 65 s`.  
**Opening hook:** “What if *Left 4 Dead* suddenly became real—the exact second you died in the game?”  
**Main event on screen and when it happens:** `0:02.8–0:07.8` — phone rattles across the dark gaming desk with a red `FEDERAL BIO-LAB BREACH — CITYWIDE LOCKDOWN` emergency alert as sirens erupt outside, leading to the 7th-floor window reveal of special infected swarming the street (`0:36–0:51`).  
**Part 1 ending payoff:** After hacking through a Smoker-type's barbed tongue (`2:27`) and triggering a car alarm to empty a zombie-packed grocery store (`2:54`), the lead emerges with a full backpack as cold dawn light rims the skyscrapers—minutes left to find shelter.

---

## Horror Voice Direction & Audition Options *(Approve before voice generation)*

All narration runs 100% locally at **$0 cost** on CPU via Chatterbox Nano (`%LOCALAPPDATA%\AIShortVideos\chatterbox`). We will audition two reads of `Ch 1A` (`0:00–0:16`) first and lock the winning voice treatment for all 3 Parts:

- **Option 1 — Dark Horror Series Narrator *(Recommended default; stays consistent with `AGENTS.md`)*:** Uses the approved series narrator reference WAV with darker horror performance pacing: slower, hushed close-mic delivery during stealth beats, tight breathless acceleration on ambushes, deliberate 0.5–1.0 s silent drops before sound scares, warm low-end presence (`+3 dB` shelf around 110–140 Hz), very subtle dark-room ambience tail, and a slightly lower pitch lift (`0.0` to `+0.2` semitone instead of bright `+0.5`) for heavier midnight tension.
- **Option 2 — Deeper Dedicated Horror Timbre:** Same local Chatterbox Nano model pitched **-1.5 to -2.0 semitones** with heavier chest-resonance EQ and cold horror reverb tail (closer to a classic creepypasta / *Nightmare Roulette* horror narrator). *(Or we can clone a local user-supplied horror voice clip if you want a completely separate narrator for this series.)*

**Delivery rules across Part 1:**
- **Hook (`0:00–0:08`):** Dry, hushed, intimate—leaning into the silence after the game-over chime.
- **Panic (`0:11–0:17`):** Clipped, tight, faster rhythm matching the 130 BPM heartbeat, then dropping cleanly to a calm, controlled baritone on *"breathe"*.
- **Stealth (`1:32–2:01`):** Near-whisper cadence with hard stops so the knocking door, phone clatter, and blackout transformer hum carry the terror alone.
- **Ambush & Action (`2:21–3:07`):** Urgent, punchy short phrases with crisp 0.4–0.6 s gaps letting the tongue whip, knife slash, and car alarm land unobstructed.

---

## Intense Horror Music & Sound Architecture ($0 Local Procedural Score)

Synthesized locally via Python/NumPy + FFmpeg (100% original, zero copyright claims, mixed cleanly under narration at `-18` to `-22 LUFS` with automatic ducking and hard silence dropouts before scares):

| Time Range | Musical Layer & Mood | Key Sound Effects & Silence Drops |
| --- | --- | --- |
| `0:00–0:04.8` | **Cold Gaming Room:** Sparse 52 Hz sub-bass room drone; quiet dark stillness. | Game death chime (`0:00.2`), controller plastic clack (`0:01.4`), phone violent wood buzz (`0:02.8`), piercing EAS double-tone (`0:03.2`). |
| `0:04.8–0:15.0` | **Lockdown Dread & Panic:** Deep horror sub-boom (`0:05.0`), dissonant bowed metallic riser climbing slowly, pulsing muffled heartbeat (`92 → 130 BPM`) + subtle tinnitus ring during panic attack. | Distant city sirens swelling, glass crash (`0:09.1`), chair scrape (`0:11.6`), **hard music cutoff** on exhale (`0:14.8`). |
| `0:15.0–0:36.0` | **Tactical Focus:** Cold pulsing low-pass synth bass (`88 BPM`) + crisp clock-like metallic tick driving barricading and fridge check. | Deadbolt snap (`0:21.2`), heavy bookshelf wood drag (`0:24.0`), fridge door suction & empty hum (`0:29.5`). |
| `0:36.0–1:05.0` | **Window Horror Reveal:** Eerie detuned minor-second horror strings swell over deep bass rumble as special infected appear below; fades to stark cold drone on the kitchen knife. | Muffled street screams, distant car crunch, wet Smoker cough (`0:43.5`), high Hunter screech (`0:47.0`), drawer rattle & knife steel ring (`0:55.0`). |
| `1:05–1:32.0` | **5-Day Prep Tension:** Rhythmic industrial low pulse + rhythmic scrape/tape hits synchronizing with tally marks and armor wrapping. | Chalk/pencil scratches (`1:06`), backpack zip (`1:17`), sharp duct-tape rips (`1:22`, `1:26`), cardboard crinkles. |
| `1:32–2:01.0` | **Midnight Hallway Stealth (Extreme Suspense):** Music drops to **bare sub-drone + hollow metallic wind**; tension builds purely on sound space. | Heavy wood drag (`1:34`), slow hinge creak (`1:36`), **rhythmic THUD-THUD-THUD** on Apt 708 door (`1:39–1:49`), **PHONE CLATTER ON TILE (`1:51.0` — dead silence!)**, sharp zombie hiss (`1:53.0`), **MASSIVE POWER-GRID SHUTDOWN BOOM (`1:55.5`)** plunging into pitch black. |
| `2:01–2:15.0` | **Descent & Escape:** Low creeping cello-like bass pulse returns softly through empty stairwell; tight high string tension at lobby exit. | Dead elevator button click (`2:02`), hollow stair footsteps (`2:04–2:07`), concrete stone bounce-clatter (`2:10.5`), glass door easing shut (`2:14.2`). |
| `2:15–2:39.0` | **Smoker Ambush & Sprint:** Dead silent street ambience → **JARRING HORROR STINGER SLAM (`2:22.5`)** → pounding distorted industrial percussion (`142 BPM`) & frantic string ostinato through the knife cut and street sprint! | Soft asphalt steps (`2:16–2:21`), wet whip-snap (`2:22.5`), choking gasp, wet slice + Smoker shriek (`2:29.5`), pounding sprinting footsteps (`2:31–2:38`). |
| `2:39–3:07.0` | **Grocery Heist & Car Alarm Chaos:** Low stalking bass behind glass → **EXPLOSIVE PERCUSSIVE SURGE (`2:53.5`)** layered with real-time rhythmic car-alarm horn blasts and horde stampede! | Muffled groans behind glass, useless pebble tink (`2:46.5`), brick-on-windshield smash (`2:53.5`), piercing car alarm (`HONK-HONK-HONK`), glass doors bursting & massive horde footstep rush (`2:56–3:05`). |
| `3:07–3:20.0` | **Cold Dawn Cliffhanger:** Car alarm fades into distance; lone haunting minor synth chord rises over icy wind as gray dawn breaks. | Can rattle & backpack zip (`3:10`), distant fading alarm, eerie dawn wind swell holding into black (`3:19–3:20`). |

---

## Location Blocking Sketches (16:9 Widescreen — `960 × 540` logical, rendered `1920 × 1080`)

### 1. 7th-Floor Apartment (`Ch 1A` & `Ch 1B` prep)
```text
BACK WALL    [FRONT DOOR (x=95) + DEADBOLT]   [GAMING DESK (x=280)]   [KITCHEN: FRIDGE + KNIFE (x=540)]   [7F WINDOW (x=820)]
PROPS        Heavy bookshelf (x=195 → pushed to x=105) · Office chair · Backpack & cardboard box on floor (x=420)
CAMERA       16:9 wide establishing; OTS gaming desk; POV phone/deadbolt/fridge/knife inserts; high-angle 7F window POV
```

### 2. 7th-Floor Hallway, Stairwell & 1st-Floor Lobby (`Ch 1B`)
```text
7F HALL      [APT 704 (x=90)] ──→ mid-hall phone drop (x=460) ──→ [APT 708: 1 zombie banging (x=660)] ──→ [ELEVATOR (dead)] + [STAIRS (x=870)]
STAIRWELL    Concrete flights winding down 7F → 1F (screen left-to-right alternation, red emergency exit light)
1F LOBBY     [STAIRS DOOR (x=90)] ──→ pillar cover (x=280) ──→ [STONE TARGET (far left x=160)]   [3 ZOMBIES at GLASS EXIT (x=760)]
```

### 3. Dark Road & Corner Grocery Plaza (`Ch 1C`)
```text
ROAD         [DARK ASPHALT (left)] ──→ [ROOFTOP SMOKER PERCH (upper right)] ──→ [SPRINT RIGHT →]
PLAZA        [METAL DUMPSTER (x=160)]   [PARKED SEDAN (x=410)]   [GROCERY GLASS DOORS (x=740, horde inside)]
CONTINUITY   Lead moves left → right; car alarm pulls horde right → left past dumpster, clearing store entrance!
```

---

## Ultra-Specific Shot-by-Shot Script (`Ch 1A`, `Ch 1B`, `Ch 1C` — 2 to 5 s beats)

### Chapter 1A — *Game Over, Lockdown Real* (`0:00–1:05`, 65 s · 1,560 frames)

| Time | Camera / Viewpoint | Exact Pose, Action & Continuity | Narration & Delivery | Music / SFX Cue |
| --- | --- | --- | --- | --- |
| `0:00.0–0:02.0` | **Over-the-shoulder (OTS) dark desk** | Crimson monitor glow (`YOU ARE DEAD — OVERRUN`). Lead hunched forward (`chest +18°`, `head-strain`), thumbs twitching on gamepad. At `0:01.4` shoulders slump back; controller drops onto desk. | *"What if **Left 4 Dead**…"* *(hushed, dry)* | 52 Hz dark hum; game death tone (`0:00.2`); controller clack (`0:01.4`). |
| `0:02.0–0:04.8` | **Tight desk insert (3/4 top-down)** | Smartphone beside controller **violently rattles** across wood (`0:02.8`), screen snapping bright red-white. Right hand (updated `edge`/reach cuff) enters lower-left (`0:03.4`), fingers wrap edges (`0:04.1`) and lift phone. | *"...suddenly became **real**—the exact second you **died** in the game?"* | Phone buzz on wood (`0:02.8`); sharp EAS double-tone (`0:03.2`). |
| `0:04.8–0:07.8` | **First-person POV phone** | Right thumb holds left bezel; blazing red alert: `FEDERAL BIO-LAB BREACH · CITYWIDE LOCKDOWN · STAY INDOORS`. At `0:05.8` subtle hand tremor starts; red/blue siren flashes sweep across cream cuff. | *"You check your phone. / A federal bio-lab just went into **lockdown**."* | Sub-bass horror boom (`0:05.0`); bowed string riser; distant sirens (`0:06.2`). |
| `0:07.8–0:11.5` | **Tight face close-up (side/3/4)** | Dark room; phone lights chin blue-red while siren strobes rake the wall behind him. Eyes widen (`head-alarm`); at `0:09.2` pupils snap right toward the window on a distant crash. | *"Zombies didn't stay on the screen. / They're **outside**."* | Distant glass shatter & tire screech (`0:09.1`); heartbeat kick starts (`92 BPM`). |
| `0:11.5–0:16.5` | **Medium side shot (desk → stand)** | Chair scrapes back as lead shoots upright, staggering half a step left. Left hand clutches chest (`head-strain`, rapid shoulder heave, sweat bead); right palm slams flat onto desk edge (`brace` pose!). At `0:14.5` eyes close for one hard exhale—shoulders drop, jaw sets (`head-notice`), head snaps left to door. | *"Seventh floor. Alone. / For three seconds, **panic** locks your lungs. / Then you force yourself to **breathe**."* *(fast → sudden calm)* | Heartbeat speeds to `130 BPM` + tinnitus whine → **HARD SILENCE CUT** on exhale (`0:14.8`). |
| `0:16.5–0:21.5` | **Wide apartment → POV deadbolt insert** | Lead strides left (`walk-side`) to front door (`0:16.5–0:19.2`). Cuts at `0:19.2` to POV right hand (`ticket-pinch` grip) snapping heavy brass deadbolt vertical (`0:20.4`) and hooking safety chain. | *"First: lock the **door**."* | Focused cold synth pulse (`88 BPM`) enters; crisp steel deadbolt clack (`0:20.4`). |
| `0:21.5–0:28.0` | **Wide side shot (door barricade)** | Lead plants both palms against the tall oak bookshelf (`x=195`, `brace` lean, rear heel lifted in toe-off drive). Legs drive hard leftward (`0:23.0–0:26.5`) sliding shelf flush against door frame (`x=105`); books rattle on top shelf as he catches breath. | *"Drag everything **heavy** against it. / Seventh floor keeps you safe—for **now**."* | Heavy wood-on-wood scrape (`0:23.0–0:26.5`); muffled thud as shelf seats against frame. |
| `0:28.0–0:35.5` | **Medium kitchen → POV open fridge insert** | Lead walks right to fridge (`0:28.0–0:30.0`), pulls handle open—cold white fridge light washes his face. Cuts (`0:30.5`) to POV looking inside: half-empty shelves, 5 scattered cans, one half-full water jug, wilted carton. Subtle dim stamp: `5 DAYS MAX`. | *"Next, the **fridge**. / You never went grocery shopping. / Five days of food. **Max**."* | Fridge door suction pop (`0:29.5`); cold compressor hum; ominous tick. |
| `0:35.5–0:41.5` | **Rear OTS at 7th-floor window** | Lead steps up to window (`x=820`), right palm bracing glass frame (`head-alarm` reflected faintly in glass). Flashing amber flames and spinning red/blue strobes light the dark skyline below. | *"You look down from the **window**… / and your stomach **drops**."* | Muffled street chaos swells; eerie minor-second strings enter. |
| `0:41.5–0:51.5` | **High-angle POV street pan (7F looking down)** | Slow widescreen pan down the jammed avenue: dozens of frantic **Common Runners** swarming stalled cars (`0:41.5–0:44.0`); drifting pale-green spore fog reveals a tall hunched **Smoker-type** coughing beside a streetlamp (`0:44.0–0:46.5`); a bloated glowing-pustule **Boomer-type** wobbles past (`0:46.5–0:48.5`); a hooded **Hunter-type** vaults cleanly from a taxi hood onto a bus roof (`0:48.5–0:51.5`). | *"The street is a **frenzy**. / Not just runners—the **special** ones too. / Towering smoke. Bloated shadows. Something **leaping** across cars."* | Wet Smoker cough (`0:44.5`), low Boomer gurgle (`0:47.0`), sharp Hunter shriek (`0:49.0`). |
| `0:51.5–0:59.0` | **Kitchen counter wide → POV knife draw** | Lead turns fast back to kitchen counter (`0:51.5`), yanks utility drawer open (`0:53.5`)—empty spoons, torn foil, no real weapons. Cuts (`0:55.0`) to POV right hand (`bar-hold` wrap) lifting a **stainless chef's kitchen knife** from the wooden block; steel glints cold blue. | *"You tear through every drawer for a **weapon**. / All you find… is a **kitchen knife**."* | Drawer clatter (`0:53.5`); sharp cold steel ring (`0:55.5`). |
| `0:59.0–1:05.0` | **Wide apartment hold (window silhouette)** | Lead stands center-right holding kitchen knife low at his side, staring out at the burning dark avenue (`head-notice`). Camera eases slowly in. | *"Staying here means starving. / You have **five days** to get ready."* | Cold ticking drone + low brass swell holding to cut. |

---

### Chapter 1B — *Five Days & Midnight Escape* (`1:05–2:15`, 70 s · 1,680 frames)

| Time | Camera / Viewpoint | Exact Pose, Action & Continuity | Narration & Delivery | Music / SFX Cue |
| --- | --- | --- | --- | --- |
| `1:05.0–1:12.0` | **Wall tally close-up → split day/night window** | POV right hand (`chalk-grip`!) scratches the 5th diagonal line across four tally marks (`|||||`). Cuts (`1:08.0`) to 7F window time-lapse: frantic daytime runners slow into sluggish, drifting midnight silhouettes under dim streetlamps. | *"Five days pass. / Watching from above, you spot a **pattern**. / Past **midnight**, they go sluggish in the **dark**."* | Sharp scratch (`1:06.2`); rhythmic low industrial pulse begins. |
| `1:12.0–1:20.0` | **Medium table packing shot** | Open dark canvas backpack on counter. Hands drop in remaining cans, two water bottles, a white red-cross first-aid pouch, and tuck the **kitchen knife** into a quick-draw side sheath; zipper pulls tight (`1:18.5`). | *"You pack what's left: / canned food, water, first aid… / and your **kitchen knife**."* | Can clinks, zipper zip (`1:18.5`). |
| `1:20.0–1:32.0` | **Detail insert (forearm & shin) → wide gear-up** | Tight shot on left forearm: corrugated cardboard bends neatly around the cream shirt cuff as right hand pulls thick gray duct tape tight (`1:22.0`, `1:26.0`), then matching shin wraps over charcoal trousers. Cuts (`1:28.5`) to wide shot: lead hoists backpack, stands armored at the barricaded door (`head-notice`). | *"Then you wrap **cardboard** and **tape** / around your arms and legs. / Cheap armor—anything to stop a **bite**."* | Loud duct-tape tears (`1:22.0`, `1:26.0`), cardboard crinkle, heavy strap cinch. |
| `1:32.0–1:38.5` | **Wide door → POV handle & crack** | Midnight blue darkness (`00:00` subtle corner clock). Lead braces palms on bookshelf (`brace`), easing it back quietly (`1:32.0–1:35.5`) with zero scrape. Cuts (`1:35.5`) to POV right hand twisting deadbolt open and easing door ajar two inches. | *"Midnight. / You slide the barricade aside… / and crack the **door**."* *(whisper-quiet)* | Music strips to bare hollow sub-drone; slow wood slide; tiny hinge creak (`1:37.2`). |
| `1:38.5–1:46.0` | **POV hallway crack → wide corridor establish** | Looking down the flickering fluorescent 7th-floor hallway: 20 feet down on the right (`Apt 708`), **one hunched infected** repeatedly slams both fists against a neighbor's door (`THUD… THUD… THUD…`), its back partially angled away. Lead checks the `STAIRS` sign past it on the far right. | *"One infected— / hammering on your neighbor's **door**."* *(0.8 s silent hold for pounding!)* | Rhythmic echoing door THUD-THUD-THUD (`1:39.5`, `1:41.0`, `1:42.5`), buzzing fluorescent tube. |
| `1:46.0–1:51.0` | **Side tracking medium (stealth creep)** | Lead steps cleanly into the hall (`step.mp4` heel-first silent creep), knees slightly bent, backpack snug, right hand near knife handle, keeping eyes locked on the pounding zombie (`head-notice`). Clears halfway (`x=460`). | *"Step by **silent** step, / you edge past its back—"* | Barely audible heel taps; pounding continues ahead. |
| `1:51.0–1:55.5` | **Floor insert (phone drop) → tight zombie turn → face freeze!** | **CLATTER!** Smartphone slips out of his loose pocket and lands face-up on the hallway tile (`1:51.0`), screen flaring bright blue! Cut (`1:52.2`) to Apt 708: the banging **STOPS DEAD**. Zombie slowly jerks its pale-eyed head left toward the blue glow (`1:53.0`). Cut (`1:54.0`) to lead frozen mid-step, breath caught (`head-alarm`)! | *"—until your **phone** slips."* *(0.7 s dead silence!)* *"Its head snaps **straight** at you."* | Sharp plastic-on-tile clatter (`1:51.0`) → **TOTAL AUDIO DROPOUT** → raspy wet zombie hiss (`1:53.0`)! |
| `1:55.5–2:01.0` | **WIDE HALLWAY — PITCH BLACKOUT!** | At `1:55.5` overhead fluorescents stutter twice (`1:55.5–1:56.0`) and **DIE COMPLETELY**—plunging the entire corridor into near-pitch darkness lit only by the faint red `EXIT` sign! Zombie gropes blindly left (`1:57.0`); lead crouches low, snatches his dimmed phone (`1:58.2`), and glides silently right past it into darkness (`1:59.5`). | *"Then the **power** dies. / Blind in the dark, it loses you."* *(hushed relief)* | Heavy building transformer *THOOM-BZZZT* power-down (`1:55.5`); blind zombie snarl; quiet sneaker glide. |
| `2:01.0–2:07.5` | **Elevator panel insert → dark stairwell descent** | POV updated `bell-press` finger jabs dead elevator button—no light, no hum (`2:01.5`). Cuts (`2:03.2`) to wide concrete stairwell lit by dim red battery emergency lamps: lead descends swiftly flight after flight (`7F → 4F → 1F`), checking every landing corner—luckily empty! | *"The elevator is **dead**. / Seven empty flights of **stairs** down."* | Hollow plastic click (`2:01.5`); echoing quick sneaker steps descending (`2:03.5–2:07.0`). |
| `2:07.5–2:15.0` | **1F lobby pillar cover → POV stone toss → wide exit slip** | Lead peeks from behind a dark lobby pillar (`2:07.5`): **3 infected** sway right in front of the glass exit doors (`x=760`). Lead picks up a loose plaster/concrete chunk (`2:09.2`) and pitches it leftward into the far lobby alcove (`2:10.3`). All 3 heads whip left and shamble toward the bounce (`2:11.5–2:13.5`); lead glides silently out the right glass exit door into the midnight street (`2:14.2`). | *"At the first-floor exit: **three** more. / One **stone** the other way… / and you're **out**."* | Stone click-bounce-clatter (`2:10.5`); shuffling snarls fading left; glass door hush (`2:14.2`). |

---

### Chapter 1C — *The Tongue & The Car Alarm* (`2:15–3:20`, 65 s · 1,560 frames)

| Time | Camera / Viewpoint | Exact Pose, Action & Continuity | Narration & Delivery | Music / SFX Cue |
| --- | --- | --- | --- | --- |
| `2:15.0–2:22.0` | **Wide dark city road (left-to-right walk)** | Lead walks swiftly right along an empty fog-draped street littered with abandoned cars, eyes scanning rooftops (`head-notice`). Ahead right, a corner grocery store's backup neon sign flickers softly (`OPEN / MARKET`). Dead eerie silence. | *"First priority: **food**. / The dark road to the corner store is **dead silent**. / Too silent."* | Cold wind & lone asphalt steps; subtle rising sub-rumble—music holds breath. |
| `2:22.0–2:26.0` | **Wide ambush → jarring recoil yank!** | At `2:22.4` a wet **barbed crimson tongue** whips down diagonally from a dark awning/rooftop above right, coiling tight around the lead's neck (`2:22.7`)! Both heels dig hard into asphalt (`skid` weight-drop), torso jerking backward off balance, left hand clawing throat (`head-alarm`), green spore haze drifting from above! | *"Something whips around your **neck**— / a long, barbed **tongue** dragging you back into the dark!"* *(sudden intense spike)* | **HORROR STINGER SLAM (`2:22.4`)** + wet whip-snap + choking gasp + booming 142 BPM industrial drums erupt! |
| `2:26.0–2:32.0` | **Tight neck/hand close-up → blade slash!** | Tight shot: taut wet crimson tongue pressing against lead's collar; left hand hooks two fingers between tongue and throat to breathe (`2:26.5`). Right hand (cardboard-wrapped cuff!) flashes up gripping the **kitchen knife** (`2:27.5`), sawing hard across the tendon—**SLASH (`2:29.5`)!** Tongue snaps apart in a burst of dark green mist; a tiny visible **nick/bend** glints on the thin blade edge! | *"You grab your **kitchen knife** and **slash**— / slicing straight through it…"* | Strain grunts, wet tear/slice (`2:29.5`), distant Smoker recoil shriek fading above (`2:30.0`). |
| `2:32.0–2:39.0` | **Wide tracking sprint (`run-side`)** | Lead catches his footing, glances once back at the mist-shrouded roof, and sprints full-speed right (`run-side.mp4` 18-frame flight cycle) down the empty avenue, clutching the nicked knife—no other infected nearby to cut him off! | *"—and **sprint** as fast as your legs will carry you."* | Pounding drums + heavy sprinting steps + ragged breathing. |
| `2:39.0–2:45.5` | **Wide grocery exterior → glass-door peek** | Lead skids to a stop beside the flickering `MARKET` storefront (`2:39.5`), chest heaving. Cuts (`2:41.5`) to close-up peeking through cracked glass: **a dozen+ infected silhouettes** sway and shamble throughout the dim aisles inside. | *"You reach the **grocery** store. / One problem: / the inside is **packed**."* | Drums drop to tense stalking bass; chorus of muffled groans behind glass. |
| `2:45.5–2:52.0` | **Medium toss → glass bounce → eyes lock onto car** | Lead picks up a loose stone and pitches it past the glass doors (`2:46.5`)—tiny *tink* on concrete. Inside, two heads barely twitch, then turn back; nobody leaves. Lead frowns (`head-strain`), eyes scanning left (`2:49.5`) until locking onto a dusty **parked sedan** at the curb (`head-notice`). | *"A stone isn't enough. / You need something a lot **louder**."* | Tiny useless pebble bounce (`2:46.5`); tense 0.6 s pause; low synth swell. |
| `2:52.0–2:57.5` | **Wide curb bash → flashing headlights blast!** | Lead sprints to the sedan (`2:52.2`), hoists a heavy loose cinder/paving rock with both hands, and **SLAMS** it straight into the hood/windshield (`2:53.8`)! Glass spiderwebs—**HONK-HONK-HONK!** Amber headlights strobe blindingly across the street! | *"You slam a parked **car** with everything you've got. / The **alarm** screams to life."* | Heavy windshield/metal smash (`2:53.8`), piercing car alarm horn + rhythmic strobe blasts! |
| `2:57.5–3:06.5` | **Low dumpster hide view (foreground lead / background horde rush)** | Lead sprints left and vaults cleanly behind a dark steel dumpster (`2:58.0–2:59.5`), crouching tight (`sit`/crouch) with knife ready as the grocery glass doors burst open (`3:00.2`) and the entire **horde of runners floods right-to-left** straight past his cover toward the screaming sedan! | *"You dive behind cover / as the entire store floods **out** toward the noise."* | Explosive horde stampede rushing right-to-left + overlapping car alarm + pounding score! |
| `3:06.5–3:13.5` | **Quick interior aisle loot (POV + medium)** | Store is now eerie and empty; strobing car headlights flicker weakly through the shattered doors. Lead moves fast down the canned-goods shelf (`3:07.5`), sweeping tins, protein bars, and water bottles straight into his open backpack and zipping it bulging full (`3:12.0`). | *"Now's your chance. / You sweep the shelves clean and **fill** your pack."* | Fast metallic can sweeps, heavy backpack zip (`3:12.0`), car alarm muffled outside. |
| `3:13.5–3:20.0` | **Wide street exit → pale dawn horizon cliffhanger** | Lead slips back out onto the curb (`3:14.0`), backpack heavy on shoulders, nicked knife in hand, the horde still mobbing the distant honking car far left. He pauses (`3:16.0`) and tilts his head up (`head-notice`): beyond the jagged city towers, the eastern sky is shifting from pitch black to **cold pale gray**. | *"You made it out with food. / Look east—**morning** is almost here. / You need a **shelter**. **Now**."* | Alarm fades into distance; lone haunting minor horror chord swells over dawn wind, cutting to black at `3:20.0`. |

---

## Motion Briefs (Part 1)

### 1. Opening phone alert, panic brace & bookshelf barricade (`Ch 1A`, 0:00–0:28)
- **Viewer takeaway:** Game death snaps into real bio-lab lockdown panic, then deliberate action as the lead bolts and barricades his 7th-floor door.
- **Staging & reference:** [side brace](../../../assets/series-lead/anatomy-prototype/brace.mp4) (frames 25–52 for desk panic-brace and bookshelf shove), [side step](../../../assets/series-lead/anatomy-prototype/step.mp4), and updated [hand references](../../../assets/series-lead/hands/reference-sheet.png) (`edge`, `ticket-pinch`, `bar-press`).
- **Pass on mute:** Controller drop → red lockdown phone tremor → chest-clutch panic → steady exhale → deadbolt lock → palms driving heavy bookshelf flush against door.

### 2. Cardboard armor wrap, blackout hallway phone drop & lobby stone lure (`Ch 1B`, 1:20–2:15)
- **Viewer takeaway:** Taped cardboard armor goes on, a dropped phone nearly gets him killed beside a pounding hallway zombie until a city blackout saves him, and a thrown stone clears 3 lobby zombies.
- **Staging & reference:** [side step](../../../assets/series-lead/anatomy-prototype/step.mp4) (heel-first silent creep), updated `chalk-grip` (5-day wall tally), updated `bell-press` (dead elevator button), and `bar-hold` (tape wrap).
- **Pass on mute:** Cardboard wraps stay visible on cuffs/shins; phone blue screen visibly alerts zombie before full blackout kills hallway light; all 3 lobby zombies turn left toward the thrown stone while lead exits right.

### 3. Smoker tongue snare, knife cut & car-alarm horde pull (`Ch 1C`, 2:22–3:07)
- **Viewer takeaway:** Barbed tongue drags the lead back on the silent street, kitchen knife slices free (blade nicks), and smashing a car trips an alarm that visibly empties the grocery store while he hides behind a dumpster.
- **Staging & reference:** [side run](../../../assets/series-lead/anatomy-prototype/run-side.mp4) (frames 0/9 landings, 8/17 flight), `weighted-shadow` skid weight-drop timing for backward neck yank, updated `bar-hold` for knife slash.
- **Pass on mute:** Tongue holds taut on neck until blade crosses it; green mist bursts on cut; rock impact immediately flashes car headlights and draws the entire horde right-to-left out of the store.

---

## Next Step (Pending Your Approval)
No code, audio, or frames have been generated yet. Once you approve:
1. Confirm **Horror Voice Option 1** (dark-directed series narrator) vs **Option 2** (deeper pitched horror variant).
2. Confirm if you'd like any tweaks to the **0:00–0:16 hook**, **2–5 s shot pacing**, or **music/SFX cues** above.
3. Then we'll start implementation cleanly with **Part 1**: add 16:9 support to Remotion, audition the two horror opening reads for `Ch 1A`, build the full `3:20` Part 1 rough cut, and animate Chapters `1A → 1B → 1C`!

---

## Chapter 1A Production Log (`0:00–1:15`, Complete & Verified)

- **Shared turnaround sheet updated:** Removed `Front three-quarter` and `Rear three-quarter` from [reference.js](../../../assets/series-lead/anatomy-prototype/reference.js) and [README.md](../../../assets/series-lead/README.md); regenerated clean 3-view (**Front / Side / Back**) [reference-sheet.png](../../../assets/series-lead/reference-sheet.png) with rounded shoulders, proportional neck, and seamless side shoulder arc.
- **Full Chapter 1A voice (`75s`):** [chapter-voice.wav](ch-1a/assets/chapter-voice.wav) / [chapter-voice.json](ch-1a/assets/chapter-voice.json) — Dark Horror Series Narrator (`opening-intense` take reused + `REST` generated at unhurried `0.93–1.00×` speed, verified clear end-to-end with zero rushing or hallucinations).
- **Full Chapter 1A procedural horror score & SFX (`75s`):** [score.wav](ch-1a/assets/score.wav) generated via [generate-score.py](generate-score.py) — sub-bass horror drones, EAS alert buzz, police sirens, `92 → 132 BPM` heartbeat + silence drop, metallic deadbolt snap, heavy wood bookshelf drag, fridge pop, Smoker/Boomer/Hunter snarls, drawer rattle, chef's knife steel ring, and ending sub-boom.
- **Full Chapter 1A multi-angle visuals (`15` shot segments across `1,800` frames):**
  - OTS gaming desk (`YOU ARE DEAD`) → Top-down desk phone alert/grab → POV red lockdown alert → Front close-up siren reaction → Side-angle grounded panic brace (OpenToonz) → Walk to door → POV brass deadbolt snap (`LOCKED`) → Side heavy bookshelf barricade push (OpenToonz) → Fridge walk & open → POV nearly-empty 5-day fridge → OTS 7th-floor burning skyline window → High-angle 7th-floor aerial street pan (Runners, Smoker, Boomer, Hunter leap) → Kitchen drawer weapon search → POV gleaming stainless kitchen knife draw → Hero knife hold ending with firelight & sirens.
- **Render commands:**
  - `node episodes/l4d-real-life/part-1/ch-1a/render.mjs`
  - `node tools/remotion/edit.mjs l4d-real-life/part-1/ch-1a`
- **Verified full export:** [ch-1a-remotion-revision.mp4](ch-1a/exports/ch-1a-remotion-revision.mp4) (`1920×1080`, `24 fps`, `75.01s`, `57.8 MB`, stereo AAC `48 kHz`, mean `-16.0 dB`, peak `-0.0 dB`). Watched and listened end-to-end: unhurried dark horror cadence, crisp multi-angle variety, grounded contacts, synced SFX/score, and readable bottom-third widescreen captions. Awaiting user review before building **Ch 1B** and **Ch 1C**.
