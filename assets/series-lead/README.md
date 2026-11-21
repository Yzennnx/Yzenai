# Series lead

The [reference sheet](reference-sheet.png) shows the lead from the **front, side, and back only** (front and rear three-quarter views are intentionally excluded). The revised design uses a slim chest, swept chestnut fringe, sharper sculpted eyes with irises and catchlights, cheek/jaw shading, a cream collared shirt, a burgundy tie, charcoal-blue trousers, and brown shoes. The sheet also shows the ready stance, seat contact, palm brace, and heel-first landing, plus profile expressions and hand poses.

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

Use the [hand reference sheet](hands/reference-sheet.png) for hand close-ups and first-person inserts. The original cutout drawings use the lead's warm skin tone, dark outline, and cream cuff. The sheet shows the right hand. Match the thumb side and sleeve to the hand established in the preceding shot. The [editable artwork](hands/reference-sheet.svg) and individual transparent PNGs are in `hands/`.

| Shot | Image to supply as a reference |
| --- | --- |
| Hand anatomy and camera angle | [Back of hand](hands/back.png) · [Palm](hands/palm.png) · [Side profile](hands/edge.png) |
| Doorbell or small button | [Reach](hands/bell-reach.png) · [Index-finger press](hands/bell-press.png) · [Release](hands/bell-release.png) |
| Horizontal push bar from the lead's viewpoint | [Reach](hands/bar-reach.png) · [Palm press](hands/bar-press.png) · [Release](hands/bar-release.png) |
| Grasp a horizontal bar | [Overhand hold](hands/bar-hold.png) |
| Small prop contact | [Ticket pinch](hands/ticket-pinch.png) · [Chalk grip](hands/chalk-grip.png) |

For AI-assisted artwork, supply the single image that matches the shot angle and action. Keep the tapered palm, slim fingers, thumb position, and wrist-to-cuff alignment consistent. At a doorbell, the index fingertip meets the button and the other fingers curl into the palm. At a horizontal push bar, the camera sees the back of the hand as the palm meets the bar. Let the wrists lead the approach and withdrawal. For the ticket, the thumb and index pads press opposite faces at the same corner. From the chosen three-quarter angle, the index is partly hidden and the free fingers curl below the paper. For a short chalk nub, the thumb and index pinch near the working tip and the middle finger curls behind for support.

The original ticket drawing uses the finger placement and overlap observed in a [card-holding photo](https://www.pngwing.com/id/free-png-dhrpz) and the joint bends in the [i-CARE tip-to-tip pinch demonstration](https://www.alazhar.edu.ps/icare/attachedFile_asp-id_no-1803.pdf#page=8). Both are study references.

These sources informed the other original drawings. The photos and footage served as study material.

- **Side profile.** Check the relaxed wrist, thumb clearance, and staggered fingertips. [Relaxed hand profile photo](https://st4.depositphotos.com/10302016/21908/i/450/depositphotos_219083698-stock-photo-side-view-of-beautiful-relaxed.jpg)
- **Chalk grip.** Study how close the thumb and index sit to the chalk tip and how the other fingers overlap in the rear three-quarter view. [Cottonbro Studio chalk-writing photo](https://www.pexels.com/photo/person-holding-white-chalk-3825273/)
- **Doorbell.** Study the index approach and pad contact at roughly 0.5–1 s in the first clip. Use roughly 2.5–3.5 s in the second clip for the wrist and finger moving away after contact. [Index-finger approach and press](https://www.pexels.com/video/person-ringing-the-doorbell-7702049/) · [Button release close-up](https://www.pexels.com/video/close-up-shot-of-a-person-pushing-a-button-4196235/)
- **Push bar.** Frame close enough to read the wrist, knuckles, and palm contact. During the reach and release, the fingers curl toward the palm and their nails turn out of view. The press reuses the back-of-hand drawing at a closer scale, with the open hand and nails facing the camera. For an overhand hold, the fingers curl over the top edge and the opposing thumb hooks below the rail. Use the still for the hand angle and study the lift off the bar around 14–15 s in the tabletop demo. [Push bar hand photo](https://www.ivim.sk/e-shop/stavebne_kovanie/panikove_kovanie) · [Canton Hyland demonstration](https://cantonlock.com/products/panic-exit-devices/314-alarm-panic-bar-exit-device/#video)

## Find a reference by action

Use the [three-view turnaround](reference-sheet.png) for the face, outfit, or proportions. For motion, choose the action and camera angle below. Use the clips to review what the viewer sees and the [pose tracks](anatomy-prototype/poses.mjs) for precise joint positions, timing, and reuse. The frame guides point to the contacts, holds, and releases.

| Action | Side | Front | Back | Key frames |
| --- | --- | --- | --- | --- |
| Face reactions (12 emotions) | [Side reactions](reactions-side.png) | [Front reactions](reactions-front.png) |  | [Face expressions](#face-expressions) |
| Dynamic survival reel (6 actions) | [Showcase reel](anatomy-prototype/dynamic-movements-reel.mp4) |  |  | [Dynamic survival movements](anatomy-prototype/README.md#dynamic-survival-movements) · [Stealth](anatomy-prototype/sneak.mp4) · [Flinch](anatomy-prototype/flinch.mp4) · [Sprint](anatomy-prototype/sprint.mp4) · [Shove](anatomy-prototype/shove.mp4) · [Slash](anatomy-prototype/slash.mp4) · [Vault](anatomy-prototype/vault.mp4) |
| Run | [Clip](anatomy-prototype/run-side.mp4) | [Clip](anatomy-prototype/run-front.mp4) | [Clip](anatomy-prototype/run-rear.mp4) | [Running](anatomy-prototype/README.md#running) |
| Walk or step | [Walk cycle](anatomy-prototype/walk-side.mp4) · [Single step](anatomy-prototype/step.mp4) | [Clip](anatomy-prototype/walk-front.mp4) · [Pose sheet](walking-front.png) | [Clip](anatomy-prototype/walk-rear.mp4) | [Walking](anatomy-prototype/README.md#walking-and-stepping) |
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
