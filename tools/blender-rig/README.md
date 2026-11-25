# Stylized 2D-Look Blender Rig & Multi-Angle Shot Renderer

Headless Blender 5.2.4 LTS pipeline for rendering our Series Lead (`--rig lead`) and 5 Special Infected (`--rig hunter|smoker|witch|charger|tank`) from **any camera angle** (`3/4 Front`, `3/4 Back OTS`, `Low 24mm`, `High Cornered`, `Overhead`, `Grounded POV Arms`, `Doorframe Peek POV`, `Floor-Level`, `CCTV`, `Side`) with flat 2-tone cel shading, Grease Pencil v3 `#253a3b` ink outlines, and exact color/proportion matching to `assets/series-lead/reference-sheet.png`.

## Hybrid Cut Rule

- **Use `renderRigShot()` (Blender Cel-Shaded Rig)** for wide/medium body action, 3/4 walks & sprints, OTS corridors, low/high/overhead angles, grounded POV arms, and camera push-ins.
- **Use 2D Illustrated Art** (`assets/series-lead/face-angles.png`, `reactions-front.png`, `hands/weapon-hands.js`) for extreme facial close-ups (eye-darts, dread crash-zooms, sweat drops), tactile macro inserts, and internal cutaways.
- Composite both under the **same procedural paper grain and vignette** in the episode's browser Canvas / Remotion pipeline.

## Quick Usage (Node.js)

```js
import { renderRigShot } from '../../tools/blender-rig/render-shot.mjs';

const { frames, guidePath } = await renderRigShot({
  work: tempDir,
  camera: '3q-front',
  action: 'walk-cycle',
  expression: 'head-notice',
  lighting: 'horror-dark-rim',
  backpack: true,
  gloves: false,
  condition: 'clean',
  fps: 12,
  startFrame: 1,
  frameCount: 24,
  width: 1080,
  height: 1920,
  pushIn: 0.08,
  exportGuide: join(tempDir, 'horizon-guide.png'),
});
```

## CLI Usage

```bash
# Single still + horizon/floor-grid guide
node tools/blender-rig/render-shot.mjs \
  --camera 3q-back-ots --action idle-alert --lighting horror-dark-rim \
  --frame 1 --out /tmp/ots.png --export-guide /tmp/ots-guide.png

# 24-frame sequence on twos (12 fps)
node tools/blender-rig/render-shot.mjs \
  --camera 3q-front --action walk-cycle --lighting neutral-day \
  --fps 12 --start 1 --count 24 --out /tmp/walk-seq
# Special Infected cast render (`hunter`, `smoker`, `witch`, `charger`, `tank`)
node tools/blender-rig/render-shot.mjs \
  --rig tank --camera low-24mm --action tank-slab-heave --lighting horror-dark-rim \
  --frame 1 --out /tmp/tank.png --export-guide /tmp/tank-guide.png
```

## Snapping 2D Backgrounds with `--export-guide`

Passing `--export-guide <path>` outputs a transparent RGBA PNG matching the exact render resolution with:
- **Gold horizontal line:** Analytical camera horizon height
- **Gold circles:** Vanishing points (`±X`, `±Y`)
- **Teal / Red / Blue lines:** 1-meter `z = 0` floor grid + world axes
- **White crosshair:** Character origin `(0, 0, 0)`

Load the guide PNG as a temporary alignment layer while coding your 2D Canvas/SVG background so hallway walls, doors, and floor tiles snap directly to the Blender camera lens—eliminating floating feet and perspective mismatch.

## Presets & Regeneration

- **Rebuild the Lead rig:** `blender --background --python tools/blender-rig/build-lead-rig.py`
- **Rebuild the 5 Infected rigs:** `blender --background --python tools/blender-rig/build-infected-rigs.py` (supports `--only hunter,tank`)
- **Regenerate Infected QA sheet:** `python3 tools/blender-rig/generate-infected-sheet.py` → `assets/series-lead/infected-sheet.png`
- **Camera presets (10):** `tools/blender-rig/cameras.json`
- **Universal Lead actions (18):** `tools/blender-rig/actions.json`
- **Special Infected actions (9):** `tools/blender-rig/infected-actions.json`
- **Toon lighting moods (6):** `tools/blender-rig/lighting.json`
- **Important:** Always run heavy Blender renders **serially** (one process at a time) on local hardware.
