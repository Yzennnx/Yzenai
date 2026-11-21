# Articulated anatomy prototype

The [motion index](../README.md#find-a-reference-by-action) groups the clips by angle. The times below are local to each clip at 24 fps and frames start at zero.

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

Render from the project root with the installed local Edge, OpenToonz, and FFmpeg. The default command rebuilds the original side studies and their reel. Add `--motion` to build the angle library, or `--motion run` to rebuild only one action. The new angle clips are motion studies from the same joint tracks, with separate artwork needed for episode framing, contact props, and expression close-ups.

```powershell
node assets/series-lead/anatomy-prototype/render.mjs
node assets/series-lead/anatomy-prototype/render.mjs --motion
```

The render checks joint reach over all 252 frames, seat height after contact, the palm and front foot during the brace, and both heel and toe anchor points during the step. OpenToonz composites the pieces using [the prototype rig script](articulate.toonzscript).
