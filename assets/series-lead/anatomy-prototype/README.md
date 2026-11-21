# Articulated anatomy prototype

The [motion index](../README.md#find-a-reference-by-action) groups the clips by angle. The times below are local to each clip at 24 fps and frames start at zero.

## Cinematic face and camera motions

Open the combined [cinematic face & camera reference reel](cinematic-face-camera-reel.mp4) (`16.0 s`, `384` frames at `24 fps`) or inspect the individual motion clips below. All six scenes reuse `drawFaceAngle` and `drawCinematicFaceReelFrame` in [art.js](art.js) on top of the official Series Lead turnaround geometry.

| Beat | Clip | Technique & timing to study |
| --- | --- | --- |
| Audio cue eye-dart + sweat | [face-eye-dart.mp4](face-eye-dart.mp4) (`2.5 s`) | Calm neutral hold → snappy sideways eye-dart (`0.62–0.78 s`) → `head-notice` + sliding temple sweat drop (`0.92–2.07 s`). |
| Eerie head tilt + slow push-in | [face-head-tilt.mp4](face-head-tilt.mp4) (`3.0 s`) | Level shoulders while head tilts smoothly `0° → 12°` as camera creeps in `1.0× → 1.18×` and upper-face dread shadow deepens. |
| Looking up (high threat) | [face-look-up.mp4](face-look-up.mp4) (`2.5 s`) | Gaze & head pitch tilt upward (`0.45–1.00 s`) into `head-alarm` shock gasp facing a towering/ceiling threat. |
| Looking down (floor clue) | [face-look-down.mp4](face-look-down.mp4) (`2.5 s`) | Gaze & head pitch bow downward (`0.45–1.10 s`) with subtle push-in, motivating a downward POV prop cut. |
| Quick glance over shoulder | [face-glance-back.mp4](face-glance-back.mp4) (`2.5 s`) | Side-profile lead snaps head back over shoulder (`0.80 s`) with `head-alarm` and a damped camera jolt. |
| Off-center ECU crash-zoom | [face-ecu-dread.mp4](face-ecu-dread.mp4) (`3.0 s`) | Tight dread portrait → 5-frame crash-zoom (`0.72–0.94 s`) off-center onto eye & nose bridge → creeping dread tremble + sweat slide. |

## Dynamic survival movements

Open the combined [dynamic movement showcase reel](dynamic-movements-reel.mp4) (`17.0 s`, `408` OpenToonz frames at `24 fps`) or inspect the individual side-view clips below. All six actions are exported from [poses.mjs](poses.mjs) (`sneakAt`, `sprintAt`, and `dynamicScenes`) and IK-validated on import.

| Action | Clip | Reuse API | Key beats and contacts to study |
| --- | --- | --- | --- |
| Stealth crouch-creep | [sneak.mp4](sneak.mp4) (`3.0 s`) | `sneakAt(frame)` | 36-frame crouched loop with `head-sneak`, level gaze, forward-balanced hands, and toe-first quiet landings. |
| Scare flinch & stumble back | [flinch.mp4](flinch.mp4) (`2.5 s`) | `dynamicScenes[1]` | Alert idle (`0.00–0.45 s`), recoil lean + defensive guard (`0.52–1.05 s`, `head-alarm` → `head-dread`), stumble step back into `head-panic` (`1.45–2.50 s`). |
| Desperate full-out sprint | [sprint.mp4](sprint.mp4) (`3.0 s`) | `sprintAt(frame)` | 17-frame sprint cycle with `24°` forward lean, wide counter-pumping arms, high knee drive, and airborne flight phase (`head-determined`). |
| Heavy barricade shove | [shove.mp4](shove.mp4) (`3.0 s`) | `dynamicScenes[3]` | Back-foot coil (`0.00–0.48 s`), flush two-hand barricade drive (`0.82–1.85 s`, `hand-brace` + `head-strain`), exhausted step-back recovery (`2.15–3.00 s`). |
| Weapon windup & snappy slash | [slash.mp4](slash.mp4) (`2.5 s`) | `dynamicScenes[4]` | Coiled overhead windup (`0.00–0.50 s`), lunge + full straight-arm overhead-to-forward survival pipe slash (`0.58–0.90 s`, `hand-pipe` + `head-angry`), combat guard recovery (`1.35–2.50 s`). |
| One-handed obstacle vault | [vault.mp4](vault.mp4) (`3.0 s`) | `dynamicScenes[5]` | Crouch launch (`0.00–0.42 s`), planted palm contact on barrier top (`0.74–1.22 s`, `hand-brace` + `head-strain`), tucked mid-air pass (`1.18 s`), far-side landing (`1.76–2.42 s`). |

## Running

Open the [side](run-side.mp4), [front](run-front.mp4), or [back](run-rear.mp4) clip. Each repeats the same 18-frame cycle four times.

| First cycle | Look for |
| --- | --- |
| Frames 0 and 9 (0.00 and 0.38 s) | Alternating landings. The opposite arm leads as the foot takes weight. |
| Frames 2 and 11 (0.08 and 0.46 s) | The support leg compresses and the pelvis dips. |
| Frames 7 and 16 (0.29 and 0.67 s) | The support heel rises into toe-off. |
| Frames 8 and 17 (0.33 and 0.71 s) | Both feet clear the floor. Check clearance in profile and the alternating arm swing from the front or back. |

The side clip has floor marks for checking stance travel. The torso leans slightly forward, the landing foot reaches ahead without locking the knee, and the trailing foot clears the ground. Keep the hands loose in front of the ribs or beside the waist as the arms alternate. Check the sleeve join from the front and back, and keep the support leg and phase aligned between views. Use `gaitAt('run', frame)` for the reusable poses. [Pose tracks](poses.mjs)

## Walking and stepping

- **Continuous walk.** Open the [side](walk-side.mp4), [front](walk-front.mp4), or [back](walk-rear.mp4) clip. Each repeats a 28-frame cycle with a longer stance leg, low swing-foot clearance, and a small arm swing from the shoulders. Let the elbows stay softly bent. Check alternating heel contacts at frames 0 and 14 (0.00 and 0.58 s) and the passing foot around frames 8 and 22 (0.33 and 0.92 s). The [front pose sheet](../walking-front.png) uses frames 0, 3, 8, and 16 from the same loop.
- **Single step and heel detail.** Open the [side step](step.mp4) and use frames 14–42 (0.58–1.75 s) for lift through sole settling. Frame 36 (1.50 s) shows heel contact with the toes still up. The rear shoe pivots on its toe through frame 51 (2.13 s) as the pelvis advances.
- **Check on mute.** The planted shoe should hold its ground position until toe release. Keep the heel-to-flat roll visible and avoid dragging the swing shoe. Preserve the supporting leg and gait phase when cutting between angles.

## Sitting

Open the [side](sit.mp4) or [front](sit-front.mp4) clip. The arms start loose at the sides, reach forward as the hips descend, and settle on the thighs in sequence. Check frames 23–38 (0.96–1.58 s) for the reach and descent. At frame 38 the hips meet the seat. Scrub frames 38–54 (1.58–2.25 s) for the hands settling.

## Bracing

Open the [side](brace.mp4), [front](brace-front.mp4), or [back](brace-rear.mp4) clip. Check frames 25–52 (1.04–2.17 s) for fixed palm contact. As the body moves forward, the free elbow trails below and behind the shoulder, with its wrist lower than the elbow. Compare the front and back to see which shoulder reaches and which arm stays free.

The [pose tracks](poses.mjs) key the pelvis, chest, neck, head, shoulder reach, wrists, and ankles independently. Each action selects its elbow bend. The [artwork](art.js) includes a slim shirt silhouette, tapered thighs and calves, shaped elbows, separate hands, and shoes with distinct heel and toe contact points. The movement reel uses the side rig and tests the flat bracing hand in motion. The [character turnaround](../reference-sheet.png) supplies the other camera angles for shot design.

Render from the project root with the installed local Edge, OpenToonz, and FFmpeg. The default command rebuilds the original side studies and their reel. Add `--reference` to rebuild the 3-view turnaround and 12-reaction sheets, `--dynamic` to rebuild the 6-action dynamic survival reel and clips, or `--motion` (`--motion run`) to rebuild the multi-angle gait studies.

```powershell
node assets/series-lead/anatomy-prototype/render.mjs --reference
node assets/series-lead/anatomy-prototype/render.mjs --dynamic
node assets/series-lead/anatomy-prototype/render.mjs --cinematic
node assets/series-lead/anatomy-prototype/render.mjs
node assets/series-lead/anatomy-prototype/render.mjs --motion
```

The render checks joint reach over all frames (252 base study frames and 408 dynamic survival frames), seat height after contact, the palm and front foot during the brace, and both heel and toe anchor points during the step. OpenToonz composites the pieces using [the prototype rig script](articulate.toonzscript).
