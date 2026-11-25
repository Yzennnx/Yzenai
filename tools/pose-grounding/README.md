# Pose Grounding & Anatomy QA Pipeline (`$0` Local)

Eliminates awkward hand-guessed poses across all episodes by combining:

1. **Layer 1 — Ad-Hoc Headless Blender 3D-to-2D Mannequin Projector (`project-pose.py`)**
   - *Note:* The Series Lead (`lead-rig.blend`) and 5 Special Infected (`rig-3d/infected/*.blend`) now render directly as cel-shaded 3D rigs via [tools/blender-rig/render-shot.mjs](../blender-rig/render-shot.mjs). Use `project-pose.py` as an ad-hoc anatomical grounding fallback for one-off non-rigged 2D guest characters or creatures at any camera angle (`side`, `front`, `back`, `3q-front`, `3q-back`, `ots`, `low-angle`, `high-angle`).
   ```bash
   blender --background --python tools/pose-grounding/project-pose.py -- \
     --preset lead-crouch-stealth --camera 3q-front \
     --out /tmp/guest-pose-guide
   ```

2. **Layer 2 — Automated Biomechanical Validator (`validate-pose.mjs`)**
   - Import and run `validatePoseTrack(poseFn, totalFrames)` at the bottom of every chapter's `poses.mjs`.
   - Fails fast before rendering if any frame stretches/collapses limbs, sinks below the floor, or snaps head/torso angles.

3. **Layer 3 — `draw-and-paint-art` Visual QA Contact Sheet (`qa-flip-silhouette.mjs`)**
   - Generates a 3-panel `Original | Horizontally Flipped | Silhouette` PNG for every `--stills` frame so lean, proportion, and silhouette errors jump out immediately.
   ```bash
   node tools/pose-grounding/qa-flip-silhouette.mjs episodes/.../still-36.png
   ```
