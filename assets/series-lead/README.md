# Series lead

The [reference sheet](reference-sheet.png) is the master visual design, color palette, and proportion bible for our Series Lead (slim chest, swept chestnut fringe, sculpted eyes with irises and catchlights, cream collared shirt, burgundy tie, charcoal-blue trousers, and brown shoes).

For **all new episodes**, use our **Hybrid 3D-to-2D Pipeline** ([tools/blender-rig/README.md](../../tools/blender-rig/README.md)):
- **Multi-Angle Body & Camera Rig (`rig-3d/lead-rig.blend`):** Stylized 2-tone cel-shaded Blender 5.2 rig with GPv3 `#253a3b` ink outlines, 10 camera presets (`cameras.json`), 18 universal actions (`actions.json`), 6 toon lighting moods (`lighting.json`), 5 attachment sockets, `gloves`/`backpack`/`condition` toggles, and `--export-guide` horizon/floor-grid overlays.
- **Dedicated 5-Finger Close-Up & POV Hand Rig (`rig-3d/hand-closeup-rig.blend`):** 19-bone subdivided 5-finger cel-shaded hand rig with full connected cream sleeve, bare/gloved toggle, and true 3D prop wrapping (`hand-poses.json` / `render-hand.py`).
- **2D Illustrated Extreme Close-Ups:** Keep our crisp 2D [reactions-front.png](reactions-front.png), [reactions-side.png](reactions-side.png), and [face-angles.png](face-angles.png) for tight facial horror beats, composited under the same shared paper/cutout grain.

## Universal Hybrid Reference Sheets

| Sheet / Reel | Purpose |
| --- | --- |
| [8-Angle True-Perspective Sheet](angles-sheet.png) | Side parity vs. 2D, `3q-front`, `3q-back-ots`, `low-24mm`, `high-cornered`, `overhead`, `pov-arms` (5-finger rig), and `floor-level` |
| [18 Universal Actions Sheet](universal-actions-sheet.png) | Reusable poses & cycles across locomotion, domestic/science, physical extremes, and horror (`tools/blender-rig/actions.json`) |
| [Framing & 3-Depth-Plane Cheat Sheet](framing-cheatsheet.png) | Standard foreground + midground + background templates (Corridor OTS, Doorframe Peek POV, Locker Vents, Under-Bed Boots, CCTV) |
| [Hybrid 3D-to-2D Seam Check](hybrid-seam-check.png) | Side-by-side continuity check cutting between Blender cel-shaded body shots and 2D `face-angles.png` close-ups |
| [Universal 5-Finger Close-Up & POV Hands](hands/universal-hands-sheet.png) | Dedicated 3D cel-shaded bare & gloved hands (`pov-flashlight`, `cup-bottle-grip`, `pinch-pick`, `knob-handle-turn`, `button-switch-press`, `open-reach-tremble`) |
| [Special Infected 3D Cast Sheet](infected-sheet.png) | Cel-shaded 3D rigs for `hunter`, `smoker`, `witch`, `charger`, and `tank` (`rig-3d/infected/*.blend`, `tools/blender-rig/infected-actions.json`) sharing exact camera/lighting parity with the Lead |
| [Silent Multi-Angle Camera Proof Reel](rig-3d/camera-proof-reel.mp4) | 7.0 s `1080 × 1920` motion proof combining 3/4 walk, 2D eye-dart cut, POV flashlight peek, and 3/4 back OTS push-in |

## Face expressions

Use the 12-emotion [front reaction sheet](reactions-front.png) and [side reaction sheet](reactions-side.png) when planning close-ups, reaction beats, and expression swaps. Both sheets share the same 12 expression keys in [art.js](anatomy-prototype/art.js):

| Expression key | Emotion / use |
| --- | --- |
| `head` | Neutral |
| `head-notice` | Alert / Noticing |
| `head-alarm` | Shock / Gasp |
| `head-dread` | Cold Dread (upper-face horror shadow) |
| `head-panic` | Panic |
| `head-strain` | Heavy Effort / Strain |
| `head-determined` | Determined |
| `head-angry` | Fierce / Shout |
| `head-exhausted` | Exhausted |
| `head-pain` | Pain / Wince |
| `head-sneak` | Stealth / Narrowed focus |
| `head-relief` | Relief / Exhale |

## Close-up hand references

For all **new episodes**, use the **[Universal 5-Finger Close-Up & POV Hand Sheet](hands/universal-hands-sheet.png)** rendered from `rig-3d/hand-closeup-rig.blend` (`tools/blender-rig/render-hand.py`, `hand-poses.json`) — bare or gloved, with full connected sleeves (zero severed wrists) and true 3D prop wrapping. For legacy 2D *L4D* weapon inserts, keep **[weapon-hands-sheet.png](hands/weapon-hands-sheet.png)** ([weapon-hands.js](hands/weapon-hands.js)) and **[hands/reference-sheet.png](hands/reference-sheet.png)** (v3). **Never render hands as plain ovals or circles.**

For AI-assisted artwork, supply the single image that matches the shot angle and action. Keep the tapered palm, slim fingers, thumb position, and wrist-to-cuff alignment consistent. At a doorbell, the index fingertip meets the button and the other fingers curl into the palm. At a horizontal push bar, the camera sees the back of the hand as the palm meets the bar. Let the wrists lead the approach and withdrawal. For the ticket, the thumb and index pads press opposite faces at the same corner. From the chosen three-quarter angle, the index is partly hidden and the free fingers curl below the paper. For a short chalk nub, the thumb and index pinch near the working tip and the middle finger curls behind for support.

The original ticket drawing uses the finger placement and overlap observed in a [card-holding photo](https://www.pngwing.com/id/free-png-dhrpz) and the joint bends in the [i-CARE tip-to-tip pinch demonstration](https://www.alazhar.edu.ps/icare/attachedFile_asp-id_no-1803.pdf#page=8). Both are study references.

These sources informed the other original drawings. The photos and footage served as study material.

- **Side profile.** Check the relaxed wrist, thumb clearance, and staggered fingertips. [Relaxed hand profile photo](https://st4.depositphotos.com/10302016/21908/i/450/depositphotos_219083698-stock-photo-side-view-of-beautiful-relaxed.jpg)
- **Chalk grip.** Study how close the thumb and index sit to the chalk tip and how the other fingers overlap in the rear three-quarter view. [Cottonbro Studio chalk-writing photo](https://www.pexels.com/photo/person-holding-white-chalk-3825273/)
- **Doorbell.** Study the index approach and pad contact at roughly 0.5–1 s in the first clip. Use roughly 2.5–3.5 s in the second clip for the wrist and finger moving away after contact. [Index-finger approach and press](https://www.pexels.com/video/person-ringing-the-doorbell-7702049/) · [Button release close-up](https://www.pexels.com/video/close-up-shot-of-a-person-pushing-a-button-4196235/)
- **Push bar.** Frame close enough to read the wrist, knuckles, and palm contact. During the reach and release, the fingers curl toward the palm and their nails turn out of view. The press reuses the back-of-hand drawing at a closer scale, with the open hand and nails facing the camera. For an overhand hold, the fingers curl over the top edge and the opposing thumb hooks below the rail. Use the still for the hand angle and study the lift off the bar around 14–15 s in the tabletop demo. [Push bar hand photo](https://www.ivim.sk/e-shop/stavebne_kovanie/panikove_kovanie) · [Canton Hyland demonstration](https://cantonlock.com/products/panic-exit-devices/314-alarm-panic-bar-exit-device/#video)

## Cinematic camera and face angles

In addition to the Front, Side, and Back turnaround, use these cinematography sheets (rendered via `drawCinematicAngle` and `drawFaceAngle` in [art.js](anatomy-prototype/art.js)) for zooming, looking-around POV, and horror tension staging:

- **Body & camera perspectives:** [Cinematic anatomy angles](angles-sheet.png) — `ots` (Over-the-Shoulder corridor foreground), `overhead` (Top-Down god-view), `low-angle` (dramatic low upward framing), and `high-angle` (vulnerable high downward framing).
- **Face tilts, gazes & crash-zooms:** [Face angles and crash-zoom sheet](face-angles.png) and [animated face & camera reference reel](anatomy-prototype/cinematic-face-camera-reel.mp4) (`16.0 s`, `24 fps`) — `eye-dart` (audio cue before whip-pan), `head-tilt` (`12°` eerie tilt + slow push-in), `look-up` (ceiling/towering threat), `look-down` (setup for downward prop POV), `glance-back` (quick over-shoulder profile turn), and `ecu-dread` (off-center tight detail crash-zoom with sweat & dread wash).

## Find a reference by action

Use the [three-view turnaround](reference-sheet.png) for standard Front, Side, and Back proportions, and the [cinematic angles](#cinematic-camera-and-face-angles) for OTS, overhead, low/high angles, gazes, and crash-zooms. For motion, choose the action and camera angle below. Use the clips to review what the viewer sees and the [pose tracks](anatomy-prototype/poses.mjs) for precise joint positions, timing, and reuse. The frame guides point to the contacts, holds, and releases.

| Action | Side | Front | Back | Key frames |
| --- | --- | --- | --- | --- |
| Face reactions (12 emotions) | [Side reactions](reactions-side.png) | [Front reactions](reactions-front.png) |  | [Face expressions](#face-expressions) |
| Face tilts, gazes & ECU crash-zoom | [Glance back](anatomy-prototype/face-glance-back.mp4) | [Face angles sheet](face-angles.png) · [Video reel](anatomy-prototype/cinematic-face-camera-reel.mp4) |  | [Cinematic face & camera motions](anatomy-prototype/README.md#cinematic-face-and-camera-motions) |
| Cinematic camera perspectives |  | [Low / High / Overhead](angles-sheet.png) | [Over-the-Shoulder (OTS)](angles-sheet.png) | [Cinematic camera and face angles](#cinematic-camera-and-face-angles) |
| Dynamic survival reel (6 actions) | [Showcase reel](anatomy-prototype/dynamic-movements-reel.mp4) |  |  | [Dynamic survival movements](anatomy-prototype/README.md#dynamic-survival-movements) · [Stealth](anatomy-prototype/sneak.mp4) · [Flinch](anatomy-prototype/flinch.mp4) · [Sprint](anatomy-prototype/sprint.mp4) · [Shove](anatomy-prototype/shove.mp4) · [Slash](anatomy-prototype/slash.mp4) · [Vault](anatomy-prototype/vault.mp4) |
| Run | [Clip](anatomy-prototype/run-side.mp4) | [Clip](anatomy-prototype/run-front.mp4) | [Clip](anatomy-prototype/run-rear.mp4) | [Running](anatomy-prototype/README.md#running) |
| Walk or step | [Walk cycle](anatomy-prototype/walk-side.mp4) · [Single step](anatomy-prototype/step.mp4) | [Clip](anatomy-prototype/walk-front.mp4) | [Clip](anatomy-prototype/walk-rear.mp4) | [Walking](anatomy-prototype/README.md#walking-and-stepping) |
| Sit down | [Clip](anatomy-prototype/sit.mp4) | [Clip](anatomy-prototype/sit-front.mp4) |  | [Seat contact](anatomy-prototype/README.md#sitting) |
| Catch a lean or brace | [Clip](anatomy-prototype/brace.mp4) | [Clip](anatomy-prototype/brace-front.mp4) | [Clip](anatomy-prototype/brace-rear.mp4) | [Palm contact](anatomy-prototype/README.md#bracing) |

When a new action has a reusable preview, add it here under its action and angle. Link the clip and note the frames that show the critical contact or change.

## Character build for new episodes

Use the same [artwork](anatomy-prototype/art.js) and [articulated pose system](anatomy-prototype/poses.mjs) in previews and final builds. Key the pelvis, chest, neck, head, shoulders, feet, and wrists for the shot, or start directly from the exported generators (`gaitAt`, `sprintAt`, `sneakAt`, `rigAt`, and `dynamicScenes` in [poses.mjs](anatomy-prototype/poses.mjs)). Match the sleeve color, hand, and grip when cutting from an external view to first person. Stick to **Front, Side, and Back** views (avoid front/rear three-quarter views). The side rig is ready for OpenToonz. The front and back studies project its joint tracks for planning.

Choose expression or hand assets with `[seconds, partName]` keys in `scene.expression`, `scene.nearHand`, and `scene.farHand`. The neutral head is `head`. Alternate faces are `head-notice`, `head-alarm`, `head-dread`, `head-panic`, `head-strain`, `head-determined`, `head-angry`, `head-exhausted`, `head-pain`, `head-sneak`, and `head-relief`. Use `hand-near` or `hand-far` for the relaxed poses, `hand-run-near` / `hand-run-far` for sprinting fists, `hand-grip` for an empty grip, `hand-pipe` for a wrist-locked steel survival pipe grip, and `hand-brace` for the flat palm. Use `[seconds, x, y, angle]` wrist keys when the hand needs an independent angle. Keep prop contact consistent with the hand's wrist position and angle.

Regenerate the turnaround, 12-reaction sheets, and dynamic movement reel with the local render commands.

```powershell
node assets/series-lead/anatomy-prototype/render.mjs --reference
node assets/series-lead/anatomy-prototype/render.mjs --dynamic
node assets/series-lead/anatomy-prototype/render.mjs --cinematic
```

## Original cutout layers for existing episodes

[character.js](character.js) supplies the green-cap and ochre-jacket artwork used by the original cutout scenes. Its render commands load these layers for revisions of those scenes.

For an episode at `episodes/<episode-slug>/`, load this script before the episode's own scene scripts.

```html
<script src="../../assets/series-lead/character.js"></script>
```

Use `window.makeCutout(part)` in the browser to generate each transparent PNG layer for the [shared OpenToonz renderer](../../tools/opentoonz/README.md). The function returns base64 PNG data at the existing joint alignment and scale.

| Body layer | Expression |
| --- | --- |
| `body0` | Neutral |
| `body1` | Uneasy |
| `body2` | Alarmed |
| `body3` | Warm strain |
| `body4` | Flushed strain |
| `body5` | Sip |

The original cutout renderer loads `body0`–`body2` by default. Request `body3`–`body5` through `extraParts` when a shot uses them.

## Anatomy prototype

The [articulated anatomy study](anatomy-prototype/README.md) tests a sit, a one-handed brace, and a heel-first step in separate setups for review.
