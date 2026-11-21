# OpenToonz character animation

The episode's Node render command runs OpenToonz locally at `C:\Program Files\OpenToonz\OpenToonz.exe`. The shared renderer takes the episode's cutout layers and pose tracks and returns one transparent PNG per frame. Use the same tracks and frame rate for the opening preview and full export. [OpenToonz 1.8.0 release](https://github.com/opentoonz/opentoonz/releases/tag/v1.8.0) · [Project license](https://github.com/opentoonz/opentoonz/blob/v1.8.0/LICENSE.txt)

Use the [articulated series lead](../../assets/series-lead/README.md) for new episodes. Develop the camera and timing with the [series creative guide](../../references/long-form-camera-voice/README.md).

## Set up a shot with the articulated lead

Use the episode's pose tracks with `rigAt(scene, frame)` (or reusable generators `gaitAt`, `sprintAt`, `sneakAt`, and `dynamicScenes`) from [poses.mjs](../../assets/series-lead/anatomy-prototype/poses.mjs). Each frame returns ordered layer placements. Write the list of frames as `var poses = [...];` in the shot file. Pass [articulate.toonzscript](../../assets/series-lead/anatomy-prototype/articulate.toonzscript) as `rigFile` and the layer names used by the shot as `partNames` (including any of the 12 `head-*` reactions and `hand-near`, `hand-far`, `hand-run-near`, `hand-run-far`, `hand-brace`, `hand-grip`, or `hand-pipe`). Use the [artwork generator](../../assets/series-lead/anatomy-prototype/art.js) to supply those layers through `drawPart`, and call `drawCinematicAngle`, `drawFaceAngle`, `drawPovSurvivalHand`, or `drawCinematicFaceReelFrame` in browser composition for non-side angles, crash-zooms, and POV hand inserts. Check the [character motion index](../../assets/series-lead/README.md#find-a-reference-by-action), [cinematic face & camera motions guide](../../assets/series-lead/anatomy-prototype/README.md#cinematic-face-and-camera-motions), and [dynamic survival movements guide](../../assets/series-lead/anatomy-prototype/README.md#dynamic-survival-movements) for verified timings. The [movement-study render command](../../assets/series-lead/anatomy-prototype/render.mjs) shows the complete call.

## Revise an existing cutout shot

1. Generate the original character's transparent layers with `window.makeCutout(part)`. For additional characters or costume layers, draw PNGs at twice the scene scale and center each image on its joint. The default torso images (`body0`, `body1`, `body2`) pivot at the pelvis. `shoeFar` and `shoeNear` pivot at the ankles. Provide `legUpper`, `legLower`, `armUpper`, and `armLower` for each of the Far and Near sides, for example `armLowerNear.png`. Draw each segment pointing down from its pivot, with lengths of 55 and 53 scene units for upper and lower legs and 34 and 31 for upper and lower arms.
2. Author the shot tracks from the episode's motion briefs. `bounds` gives the origin and size of the transparent layer in scene units. `pelvis` keys are `[frame, x, y, clockwiseDegrees]`. Each of the two `feet` tracks uses that same format in scene coordinates. Each of the two `wrists` tracks uses `[frame, dx, dy]` relative to its shoulder. Put the far side first in each pair. `expressions` switches torso images at `[frame, imageIndex]` cues. Frame numbers start at zero for each shot and increase within each track. Repeat a foot position at the end of its contact interval to hold it in place. Delay individual wrist keys to show the direction of force and the recovery.
3. Call the shared renderer once per shot from the episode render command. Pass the shot's frame count at the episode frame rate. Composite each returned PNG at `bounds` using the matching episode frame and camera transform. The episode render command owns the temporary directory and removes it after encoding. For browser-generated art, decode the base64 PNG data into a buffer in the `drawPart` callback.

Set `wristSpace: 'scene'` in a shot to key both wrists directly in scene coordinates. Repeat a contact position across several keys to pin a hand to a prop or surface. Keep the wrist within the arm's reach as the torso shifts.

```js
import { renderCutout } from '../../tools/opentoonz/render-cutout.mjs';

const cutoutFrames = await renderCutout({
  work,
  shotFile: join(import.meta.dirname, 'opening-impact.toonzscript'),
  frameCount: shotEndFrame - shotStartFrame,
  drawPart: (part) => readFile(join(assets, 'cutout', `${part}.png`)),
});
```

The rig stores motion in shot scripts. Its planted-foot check catches positions beyond the leg's reach. Adjust the pose tracks when a shot needs different timing, and review the contact, weight shift, and follow-through at phone size before animating the remaining shots.

For an episode-time preview, pass the first frame as `startFrame` and the length as `frameCount`. The pose keys stay in episode frame coordinates. The returned PNG array starts at index zero for the requested range. Document the episode's command for rendering a silent preview in the plan.

Pass `extraParts` to supply more `bodyN` expression layers through the same `drawPart` callback. A shot can also use `alternateLegs: [startFrame, endFrame]` with four additional leg layers named `legUpperFarAlt`, `legLowerFarAlt`, `legUpperNearAlt`, and `legLowerNearAlt`. This swaps the art from the first frame up to the end frame while preserving the leg pose and shoe position.
