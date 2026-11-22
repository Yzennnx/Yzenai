# Pose Grounding & Anatomy QA Pipeline (`$0` Local)

Eliminates awkward hand-guessed poses across all episodes by combining:

1. **Layer 1 — Headless Blender 3D-to-2D Mannequin Projector (`project-pose.py`)**
   - Poses an anatomically proportioned 3D rig (`lead`, `witch`, `charger`, `tank`) with strict human joint limits from any camera angle (`side`, `front`, `back`, `ots`, `low-angle`, `high-angle`).
   - Saves exact 2D projected joint coordinates + a mannequin silhouette SVG into `assets/series-lead/pose-library/`.
   ```bash
   blender --background --python tools/pose-grounding/project-pose.py -- \
     --preset lead-crouch-stealth --camera side \
     --out assets/series-lead/pose-library/lead-crouch-stealth
   ```

2. **Layer 2 — Automated Biomechanical Validator (`validate-pose.mjs`)**
   - Import and run `validatePoseTrack(poseFn, totalFrames)` at the bottom of every chapter's `poses.mjs`.
   - Fails fast before rendering if any frame stretches/collapses limbs, sinks below the floor, or snaps head/torso angles.

3. **Layer 3 — `draw-and-paint-art` Visual QA Contact Sheet (`qa-flip-silhouette.mjs`)**
   - Generates a 3-panel `Original | Horizontally Flipped | Silhouette` PNG for every `--stills` frame so lean, proportion, and silhouette errors jump out immediately.
   ```bash
   node tools/pose-grounding/qa-flip-silhouette.mjs episodes/.../still-36.png
   ```
