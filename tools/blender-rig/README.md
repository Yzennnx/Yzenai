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

## Mandatory Production Guardrails (Prevent Recurring Defects)

1. **Automatic `16:9` / `9:16` Framing & Headroom Check:** `render-shot.py` automatically switches to `sensor_fit = "VERTICAL"` (`36 mm`) whenever `width > height` (`1920 × 1080` widescreen) so every `cameras.json` preset preserves full headroom and grounded boots. Full-body renders (`--env none`) also emit a `[WARN]` if character pixels touch `y == 0`.
2. **Native `30 fps` (or `24 fps`) Hero Motion & Exact Cycle Lengths:** Render hero 3D action shots at **native `30 fps`** (`--fps 30 --samples 4`, or `--fps 24` for legacy 24 fps chapters) matching the exact shot frame count so motion stays silky with zero judder. Never stretch 12 frames over 3+ seconds and never truncate a cycling action shorter than its JSON `length` (`render-shot.py` warns if `span < length`).
3. **True 3D Ground & Core Structures (`--env` + `--travel` + `--push-in`):** Never zoom a 3D character PNG over a static 2D wallpaper or slide an in-place walk PNG sideways (`dx`). Use `--env <set>` (`tools/blender-rig/env_sets.py`, e.g. `civic-plaza`) so the character physically walks on 3D cel-shaded flagstones/structures (`--travel <meters>`) while Blender's real 3D camera executes `--push-in` with 100% perspective parallax. Composite only distant sky, skyline beacon, volumetric fog, rain glow, paper grain, and 2D facial ECUs behind the transparent sky.
4. **Grounded Physical Contact FX (`boot-macro` + `--floor-prop` + `--export-tracks`):** For hero foot/hand contact impacts (stepping on glass, puddles, rubble, shell casings), use `boot-macro` + `--floor-prop glass-shard --impact-frame <n>` for true 3D occlusion/shatter, and pass `--export-tracks <json>` to lock 2D contact shadows, impact star-glints, and micro-splinters to the exact bone pixel on every frame.
5. **Composite Still QA Gate:** Before rendering a full multi-second sequence, inspect a 1-frame composited contact sheet (character + 3D set + sky/fog + caption) for every distinct shot setup.
