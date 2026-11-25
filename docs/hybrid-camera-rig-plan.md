# Hybrid 3D-to-2D Camera & Character Rig Plan (Option C)

**Status:** Completed (Phases 1–4 + Dedicated 5-Finger Close-Up Hand Rig `hand-closeup-rig.blend`)  
**Scope:** Channel-wide character rig, dedicated 5-finger POV/macro hand rig, cinematography vocabulary, universal reference library, and reference-first episode planning workflow  
**Budget:** $0 (100% local using Blender 5.2.4 LTS, Node.js, Chromium/Edge, OpenToonz, Remotion, and FFmpeg)

---

## 1. Problem Diagnosis & Why Option C (Hybrid)

### Why current episodes feel stuck in side-view
1. **Side-view rig bottleneck:** Only the side profile has a full articulated OpenToonz cutout rig (`poses.mjs`, `articulate.toonzscript`), while three-quarter views were previously banned (`Front, Side, and Back only`). Any time the lead walks, ducks, vaults, or interacts with a prop, production defaults back to a flat side-scroller angle.
2. **Flat non-side angles ("sticker syndrome"):** Current `low-angle` and `high-angle` stills in `assets/series-lead/angles-sheet.png` are scaled/tilted variations of the symmetrical Front portrait without true perspective foreshortening (no underside of jaw/chin, no looming shoulders, no receding torso). Pure symmetrical Front/Back views naturally read stiff.
3. **Unanchored POV hands:** Individual 2D POV hand drawings feel pasted on when cuffs float in the corner without forearm perspective extending past the lens edge, handheld walk-bob/breathing sway, and room-matched lighting.

### Why Option C (Hybrid) beats Pure 2D and Pure 3D
| Dimension | Pure 3D (Option A) | Pure 2D Limited-Anim (Option B) | **Hybrid (Option C — Chosen)** |
| --- | --- | --- | --- |
| **Body & camera angles** | Blender 3D for all shots | Side rig + static 2D key-poses | **Blender cel-shaded 3D rig** for all body movement, 3/4, OTS, low/high, overhead, and grounded POV arms |
| **Face close-ups & macros** | 3D facial rig (risk of stiff/plastic close-ups) | Existing 2D `face-angles.png` & hand art | **Existing 2D illustrated art** (`face-angles.png`, `reactions-front.png`, `weapon-hands.js`) for extreme reactions & tactile macros |
| **Angle freedom** | Unlimited | Limited; every new dramatic pose requires custom 2D drawing | **Unlimited** for body/camera + ultra-sharp 2D for horror beats |
| **Awkwardness risk** | Uncanny 3D faces in tight close-ups | Broken foreshortening & repetitive flat staging | **Lowest risk:** 3D handles perspective math; 2D handles expressive horror acting |

---

## 2. Architecture & Visual Continuity Rules

### The Hybrid Cut Rule (When to Use 3D vs. 2D)
- **Use the Blender Cel-Shaded Lead Rig (`tools/blender-rig/`) for:**
  - Wide and medium body actions (walking, sprinting, stealth, sitting, climbing, crawling, falling, combat)
  - All `3/4 Front`, `3/4 Back OTS`, `Low-Angle (24mm)`, `High-Angle / Cornered`, `Overhead`, and `Floor-Level` shots
  - Grounded First-Person POV shots where forearms, cuffs, and held props enter from the bottom lens edges with breathing/walk sway
  - Any shot with dynamic camera motion (push-in, whip-pan, handheld sway, orbital drift)
- **Use 2D Illustrated Art (`assets/series-lead/`) for:**
  - Extreme facial close-ups (eye-darts, dread crash-zooms, sweat drops, jaw tension) via `face-angles.png` / `reactions-front.png`
  - Tactile macro inserts (finger on trigger/button, deadbolt snap, phone screen detail) via `weapon-hands.js`
  - Internal body cutaways / medical explainers

### Matching the 2D Cutout Style in Blender (Zero "Plastic 3D" Look)
1. **Exact Palette Lock:** Sample exact hex values from `assets/series-lead/reference-sheet.png` (cream collared shirt, burgundy tie, charcoal-blue trousers, brown shoes, chestnut hair, warm skin tone + subtle cheek/jaw shadow).
2. **Flat 2-Tone Cel Shading:** Diffuse BSDF → `Shader to RGB` → hard-stepped `ColorRamp` (base tone + crisp 1-step shadow tone, zero glossy/plastic specular highlights).
3. **Grease Pencil Line Art Outlines:** Consistent dark charcoal ink lines matching the stroke weight of our 2D sheets, applied to contours, creases, and silhouette edges.
4. **Sculpted Head Silhouette + 2D Face Expressions:** Sculpt a clean stylized 3D nose, brow ridge, jaw, and swept chestnut fringe so `Side`, `3/4 Back OTS`, and `Low-Angle` silhouettes read sharply; project/UV-map our 12 crisp 2D eye/brow/mouth expression textures cleanly onto the front facial curve.
5. **Frame Stepping & Shared Finish:** Support both `24 fps` smooth motion and `12 fps` ("on twos") stepped rendering for a punchy hand-drawn feel; composite all 3D and 2D shots under the exact same subtle paper/cutout grain and color grade in the browser/Remotion pipeline.
6. **Rule of 3 Depth Planes:** Stage non-close-up shots with **Foreground (dark/soft frame element)** + **Midground (Lead)** + **Background (environment/threat)** to eliminate flat staging.

---

## 3. Universal Starter Kit Specifications

To ensure this system works universally across **all** channel genres—horror/survival (`l4d-real-life`), science *"What If You Ate/Touched X"* (`uranium`, `bleach`, `mud-cookies`), environmental extremes (`lava-pool`, `walk-in-freezer`), and psychological loops (`station-loop`, `dream-death`)—the starter kit includes five modular components:

### A. Camera Presets (`tools/blender-rig/cameras.json`)
| Preset Key | Focal Length | Staging & Story Job |
| --- | --- | --- |
| `side` | 55 mm | Classic profile action & parity check against legacy 2D side rig |
| `3q-front` | 45 mm | Hero diagonal walk/approach; breaks symmetrical front-view stiffness |
| `3q-back-ots` | 38 mm | Foreground cheek/jaw + shoulder on rule-of-thirds edge looking down corridor/threat |
| `low-24mm` | 24 mm | Dramatic worm's-eye / looming confrontation / knockdown perspective |
| `high-cornered` | 32 mm | High corner camera tilting down; floor dominates frame to sell vulnerability |
| `overhead` | 35 mm | Top-down geography reset, bed trap, floor clue, or room layout |
| `pov-arms` | 28 mm | Grounded first-person view with shoulders/forearms/hands anchored off bottom lens edges |
| `pov-peek` | 35 mm | Lean-out peek around doorframe/wall (foreground occluder on left/right 35% of frame) |
| `floor-level` | 28 mm | Under-bed / under-car / low hallway shot framing boots and lower legs |
| `cctv-wide` | 24 mm | High corner surveillance / security-cam wide angle |

### B. Universal Action Library (`tools/blender-rig/actions.json`)
Every action is authored in 3D armature space so it can be shot from **any** camera preset above:
1. **Core Locomotion (4):** `idle-alert`, `walk-cycle`, `sprint-cycle`, `stealth-crouch-walk`
2. **Domestic / "What If" Science & Tabletop (5):** `sit-chair-table`, `reach-pickup-prop`, `inspect-object-hand`, `sip-eat-prop`, `hunch-nausea-pain`
3. **Environmental / Physical Extremes (4):** `shiver-huddle`, `brace-push-wall`, `slip-fall-back`, `climb-stairs`
4. **Horror / Survival / Psychological (5):** `bed-wake-situp`, `peek-around-corner`, `glance-back-startle`, `knockdown-ground-back`, `crawl-scramble`

### C. Toon Lighting Mood Presets (`tools/blender-rig/lighting.json`)
Prevents the cel-shaded character from looking like a neutral studio sticker when composited into dramatic environments:
1. `neutral-day` — Clean daylight key + soft warm bounce (science/domestic episodes)
2. `horror-dark-rim` — Deep cool shadow fill + sharp rim highlight (night hallways/survival)
3. `overhead-fluorescent` — Harsh top-down sterile office/hospital/station lighting
4. `warm-underlight` — Orange/red glow from below (lava, fire, explosion, phone/monitor underglow)
5. `cold-blue` — Icy desaturated cyan-blue rim + crisp shadow (freezer, winter, underwater)
6. `flashlight-spot` — Focused cone light casting strong directional contrast

### D. Modular Attachment Sockets & Condition Toggles
Built directly into `lead-rig.blend` so props and consequences never drift across cuts:
- **Sockets:** `hand_R_socket`, `hand_L_socket`, `back_socket` (backpack/gear), `forearm_R_socket` / `forearm_L_socket` (watch, armor wraps, bandages)
- **Condition & Outfit Toggles:** `gloves` (on/off), `backpack` (on/off), `condition` (`clean` | `sweat` | `frost` | `scorch` | `dusty`)

### E. Camera-Matched Horizon & Floor-Grid Guide Export
When `render-shot.py` renders a shot (or reference), passing `--export-guide` outputs a lightweight transparent PNG showing the **exact 3D horizon line, vanishing points, and 1-meter floor grid** from that shot's Blender camera. When drawing 2D Canvas/HTML backgrounds, walls and floors snap directly to this guide so feet always sit solidly on the floor with zero perspective mismatch.

### F. Hybrid Hands System (3D Stylized Swaps + 2D Universal Macro Kit)
Hands follow the same Hybrid Cut Rule—never over-rigging 15 tiny 3D finger bones that muddy Grease Pencil Line Art at phone size, while never leaving floating/severed 2D cuffs in close-ups:
- **3D Blender Rig (`LeadHands_Bare` / `LeadHands_Gloves`) — 3 Swappable Hand Shapes (No Finger Clutter):**
  - `relaxed` (default natural curl for walks, idle, OTS)
  - `grip` (closed fist / cylindrical prop wrap for sprints, flashlight, pipe, mug, phone)
  - `open-flat` (flat splayed palm for `brace-push-wall`, `crawl-scramble`, defensive recoil)
  - Controlled via `--hand-pose relaxed|grip|open-flat` in `render-shot.py` and `apply_rig_state()`.
- **2D Macro & Tactile POV Kit (`assets/series-lead/hands/weapon-hands.js`) — Universal Bare + Gloved Coverage:**
  - Keeps mandatory `drawWeaponHandBack` → prop → `drawWeaponHandFront` sandwich layering, `opts.bare` (skin + cream cuff) vs. leather glove mode, and `opts.showSleeve = true` (connected forearm extending cleanly past frame edge — zero severed wrists).
  - **Existing combat/survival poses (kept):** `shotgun-grip`, `shotgun-forend`, `pistol-twohand`, `phone-cradle`, `knife-grip`, `front-shotgun-grip-L/R`, plus `bar-press` and `bar-hold`.
  - **5 New Universal Everyday/Science/Horror Macro Poses (added to `weapon-hands.js`):**
    1. `pinch-pick` — Thumb + index pinching small objects (uranium pellet, pill, key, coin, ticket)
    2. `cup-bottle-grip` — Fingers wrapping a mug, glass, or chemical bottle
    3. `knob-handle-turn` — Grasping/twisting a doorknob, lever, or deadbolt
    4. `button-switch-press` — Index fingertip pressing an elevator button, light switch, or alarm
    5. `open-reach-tremble` — Splayed reaching/trembling palm (shock, frostbite, heat/burn, waking up)
  - Consolidated into **`assets/series-lead/hands/universal-hands-sheet.png`** (bare + gloved, full connected sleeves) alongside **`weapon-hands-sheet.png`**.

---

## 4. Living "Reference-First" Workflow & Plan Approval Gate

Every future episode continuously strengthens this library instead of improvising ungrounded poses mid-render:

1. **Plan & Reference Audit (`episodes/<slug>/plan.md`):**
   - While authoring the timed shot list and motion briefs, audit every required movement, camera angle, POV grip, prop socket, and lighting mood against `assets/series-lead/` and `tools/blender-rig/`.
2. **Missing References Table (Mandatory Approval Gate):**
   - List every unreferenced movement, angle, prop, or creature pose in a dedicated `## New references needed (Approval Gate)` table inside `plan.md`:
     ```markdown
     ## New references needed (Approval Gate)

     | Missing movement / angle / prop | Shots needing it | Pipeline (3D Rig / 2D Macro) | Permanent target path | Approved |
     | --- | --- | --- | --- | --- |
     | Example: Ladder climb (3/4 back) | Shot 12–13 | 3D Rig (`actions.json`) | `assets/series-lead/rig-3d/actions/ladder-climb.png` | [ ] |
     ```
3. **Wait for User Approval → Generate & Register First:**
   - **No episode rendering begins until the user approves the missing-references list.**
   - Once approved, generate those new references first, inspect them at phone size (including flip/silhouette QA), and permanently register them into `tools/blender-rig/` (`actions.json` / `cameras.json`) and `assets/series-lead/` so all future episodes inherit them automatically.
4. **Episode Production:**
   - Only after all required references exist and pass visual inspection does episode rendering begin.

---

## 5. Implementation Phases & Approval Gates

### Phase 1 — Core Stylized Blender Rig & Renderer
**Goal:** Build the reusable cel-shaded Series Lead rig, pose/camera/lighting engines, and horizon-guide exporter.
- [ ] Export transparent 2D facial expression overlays (`head.png` … `head-relief.png`) from `assets/series-lead/anatomy-prototype/art.js` into `assets/series-lead/rig-3d/face-textures/`.
- [ ] Build `tools/blender-rig/build-lead-rig.py` to procedurally generate `assets/series-lead/rig-3d/lead-rig.blend` with exact Lead proportions, sculpted head/fringe silhouette, armature with IK/FK + anatomical joint limits, attachment sockets, flat 2-tone cel materials, and Grease Pencil Line Art.
- [ ] Author `tools/blender-rig/cameras.json` (10 presets), `tools/blender-rig/actions.json` (18 universal poses/cycles), and `tools/blender-rig/lighting.json` (6 toon moods).
- [ ] Build `tools/blender-rig/render-shot.py` supporting still renders, frame-range animations (`12 fps` or `24 fps`), expression swaps, lighting moods, condition toggles, and `--export-guide` horizon/floor-grid output.

### Phase 2 — Universal Reference Pack & Visual Proof (APPROVAL GATE)
**Goal:** Prove the 2D-look visual match and multi-angle cinematography before touching existing episodes or deleting any legacy files.
- [ ] Generate **`assets/series-lead/angles-sheet-v2.png`** (8-angle true-perspective showcase + direct side-by-side comparison against our existing 2D side lead).
- [ ] Generate **`assets/series-lead/universal-actions-sheet.png`** (contact sheet of all 18 universal starter poses/actions across domestic, disaster, and horror genres).
- [ ] Generate **`assets/series-lead/framing-cheatsheet.png`** (3-depth-plane staging templates: Corridor OTS, Doorframe Peek POV, Locker Vent, Under-Bed Boots, CCTV Corner).
- [ ] Generate **`assets/series-lead/hybrid-seam-check.png`** (Blender cel-shaded 3/4 & OTS frames placed directly beside 2D `face-angles.png` close-ups with shared paper grain).
- [ ] Render **`assets/series-lead/rig-3d/camera-proof-reel.mp4`** (6–8s silent 4-shot motion proof: *3/4 diagonal corridor walk with foreground wipe → 2D eye-dart close-up → Grounded POV flashlight peek around corner → 3/4 Back OTS slow push-in*).
- [ ] **GATE:** User reviews stills and silent proof reel at phone size. Iterate on toon shading, ink lineweight, head silhouette, or framing until approved.

### Phase 3 — Episode Pipeline Integration
**Goal:** Make the new rig a one-line drop-in for any episode's `render.mjs`.
- [ ] Build `tools/blender-rig/render-shot.mjs` (Node wrapper matching the ergonomics of `tools/opentoonz/render-cutout.mjs`).
- [ ] Write `tools/blender-rig/README.md` with copy-paste examples for calling `renderRigShot()`, compositing transparent frames over 2D browser environments using the horizon guide, and pairing with 2D close-ups.
- [ ] Run a quick local smoke test confirming transparent PNG sequence compositing + Remotion/FFmpeg output works end-to-end with zero errors.

### Phase 4 — Legacy Reference Retirement & Workflow Docs Update
**Goal:** Clean out superseded legacy references (only after Phase 2 approval) and codify the Hybrid + Reference-First workflow across project rules.
- [ ] Promote `angles-sheet-v2.png` → `assets/series-lead/angles-sheet.png` (replacing the old flat sheet).
- [ ] Delete approved legacy reference files (see Section 6C below).
- [ ] Update `AGENTS.md`, `templates/episode-plan.md`, `assets/series-lead/README.md`, `references/long-form-camera-voice/README.md`, and `tools/pose-grounding/project-pose.py`.

---

## 6. Complete File Inventory

### A. Files to CREATE
- `tools/blender-rig/build-lead-rig.py` — Procedural stylized 2D-look Blender Lead rig builder (including 3 swappable 3D hand poses: `relaxed`, `grip`, `open-flat`)
- `tools/blender-rig/render-shot.py` — Headless Blender shot/reference/horizon-guide renderer
- `tools/blender-rig/render-shot.mjs` — Node.js integration wrapper for episode render scripts
- `tools/blender-rig/generate-references.py` — Serial Phase 2 reference pack & proof-reel generator
- `tools/blender-rig/cameras.json` — 10 reusable cinematography camera presets
- `tools/blender-rig/actions.json` — 18 universal character action & pose presets
- `tools/blender-rig/lighting.json` — 6 flat-cel toon lighting mood presets
- `tools/blender-rig/README.md` — Pipeline documentation & hybrid compositing guide
- `assets/series-lead/rig-3d/lead-rig.blend` — Generated master cel-shaded Blender rig
- `assets/series-lead/rig-3d/face-textures/*.png` — 12 transparent 2D facial expression overlays
- `assets/series-lead/rig-3d/camera-proof-reel.mp4` — 6–8s silent 4-shot multi-angle proof reel
- `assets/series-lead/universal-actions-sheet.png` — Visual contact sheet of all 18 universal starter actions
- `assets/series-lead/framing-cheatsheet.png` — 3-depth-plane composition & staging templates
- `assets/series-lead/hybrid-seam-check.png` — 3D-to-2D cut continuity verification sheet
- `assets/series-lead/hands/universal-hands-sheet.png` — Unified bare + gloved 2D macro hand sheet (5 new universal poses + full connected sleeves, zero severed wrists)

### B. Files to EDIT
- `assets/series-lead/hands/weapon-hands.js` — Add the 5 missing universal macro hand poses (`pinch-pick`, `cup-bottle-grip`, `knob-handle-turn`, `button-switch-press`, `open-reach-tremble`) with bare/gloved + connected sleeve support
- `tools/pose-grounding/render-hands-reference.mjs` — Update to render `assets/series-lead/hands/universal-hands-sheet.png` (instead of the old overlapping sheet)
- `AGENTS.md` — Lift the "no 3/4 views" restriction; adopt the Hybrid Cut Rule (body + hands) and the Plan-Stage Reference Approval Gate
- `templates/episode-plan.md` — Add `## New references needed (Approval Gate)` table; update motion-brief reference links and remove "no three-quarter" wording
- `assets/series-lead/README.md` — Index the new 8-angle sheet, universal actions sheet, framing cheat sheet, universal hands sheet, `rig-3d/`, and remove links to deleted legacy sheets
- `references/long-form-camera-voice/README.md` — Document the expanded angle vocabulary (`3/4`, `peek POV`, `floor-level`, `through-the-prop`, `CCTV`) and 3-Depth-Plane staging rule
- `tools/pose-grounding/project-pose.py` — Add `3q-front` and `3q-back` camera presets for infected/custom pose grounding parity

### C. Files to DELETE (Only After Phase 2 Approval)
- `assets/series-lead/angles-sheet.png` *(old flat-front-scaled OTS/Low/High sheet — replaced by the new 8-angle true-perspective sheet)*
- `assets/series-lead/walking-front.png` *(superseded flat symmetrical front-walk sheet)*
- `assets/series-lead/hands/reference-sheet.svg` *(stale pre-v3 legacy SVG — superseded by `hands/universal-hands-sheet.png` & `hands/reference-sheet.png`)*
- `assets/series-lead/hands/pov-door-lock.png`, `pov-flashlight.png`, `pov-pipe-grip.png`, `pov-shield-face.png`, `pov-survival-sheet.png` *(floating short-cuff 2D POV stickers — retire once `universal-hands-sheet.png` connected-sleeve macros + 3D `pov-arms`/`pov-peek` with `grip` hands replace them)*
- **Conditional (decide during Phase 2 review):**
  - `assets/series-lead/hands/reference-sheet.png` — currently holds v3 bare/gloved push-bar + bar-hold + duplicate weapon panels; keep until its push-bar/bar-hold panels are folded into `universal-hands-sheet.png`, then retire to eliminate duplicate hand sheets
  - `assets/series-lead/pose-library/lead/` stick-figure SVGs — optionally clear/replace once real cel-shaded pose previews supersede them

### D. Files to KEEP (Do Not Delete)
- **Active Hybrid assets:** `assets/series-lead/reference-sheet.png`, `reactions-front.png`, `reactions-side.png`, `face-angles.png`, `hands/weapon-hands.js`, `hands/weapon-hands-sheet.png`
- **Backward-compatibility runtime files (imported by existing episodes):** `assets/series-lead/character.js`, `assets/series-lead/anatomy-prototype/{art.js,poses.mjs,articulate.toonzscript}`, `assets/series-lead/pose-library/infected/`

---

## 7. Phone-Size QA & Anti-Awkwardness Checklist

Every new rig render, reference sheet, and future episode shot must pass these checks on mute at phone size:
- [ ] **No plastic 3D look:** Flat 2-tone cel shading + consistent dark ink outline matches `reference-sheet.png` and cuts cleanly into `face-angles.png`.
- [ ] **True perspective & grounded contact:** Feet sit firmly on the exported horizon/floor grid; held props lock cleanly to hand sockets with zero floating or drift.
- [ ] **Readable silhouette & flip check:** Silhouette reads clearly on mute (even in dark horror rim-lighting) and passes horizontal-flip proportion check.
- [ ] **3-Depth-Plane staging:** Non-close-up shots establish depth with foreground framing, midground subject, and perspective-matched background.
- [ ] **Lighting & grain unity:** Character lighting mood matches the environment, and shared paper/cutout grain ties 3D and 2D cuts together.
