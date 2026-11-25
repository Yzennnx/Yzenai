# Implementation Plan — Cel-Shaded 3D Infected Cast & Unified Rig Pipeline

**Branch:** `feat/hybrid-3d-camera-rig`  
**Status:** Completed (Phases 1–4)  
**Budget:** $0 (Local Blender 5.2.4 LTS, Node.js, Python/PIL)  
**Companion Plan:** [hybrid-camera-rig-plan.md](hybrid-camera-rig-plan.md)

---

## 1. Goal

Bring the 5 recurring Left 4 Dead-inspired special infected (`hunter`, `smoker`, `witch`, `charger`, `tank`) onto the **exact same cel-shaded 3D-to-2D Blender pipeline** as the Series Lead (`lead-rig.blend`), eliminating perspective, line-weight, and shadow mismatches in multi-angle shots (`3q-front`, `3q-back-ots`, `low-24mm`, `high-cornered`, `cctv-wide`) and retiring the legacy 2D stick-figure `pose-library/`.

---

## 2. Decision on `assets/series-lead/reference-sheet.png`

- **KEEP `assets/series-lead/reference-sheet.png`.**
- It is the canonical 2D character design bible for the Series Lead (exact hex palette swatches, Front/Side/Back proportions, tie/shirt/trouser/shoe design, and side-facing expressions). Both `build-lead-rig.py` and the 2D close-up sheets (`face-angles.png`, `reactions-front.png`, `reactions-side.png`) are calibrated against it.

---

## 3. Orchestration Strategy

To keep development fast without overloading local CPU/GPU (Iris Xe / MX330):
- **Parallel authoring (subagents):**
  - **Worker A (`Infected Rig Builder`):** Writes `tools/blender-rig/build-infected-rigs.py`.
  - **Worker B (`Actions & Multi-Rig Renderer`):** Writes `tools/blender-rig/infected-actions.json` and extends `render-shot.py` + `render-shot.mjs` with `--rig`.
- **Serialized Blender execution (coordinator):**
  - Runs `build-infected-rigs.py` once to generate all 5 `.blend` files.
  - Renders `assets/series-lead/infected-sheet.png` serially.
  - Performs visual QA at phone size and iterates any pose/proportion fixes before Phase 4 cleanup.

---

## 4. Phase-by-Phase Plan

### Phase 1 — Procedural Cel-Shaded 3D Infected Rig Builder
**Deliverable:** `tools/blender-rig/build-infected-rigs.py` → outputs 5 rigs under `assets/series-lead/rig-3d/infected/`:
1. `hunter-rig.blend` — Agile crouched build (`pelvis_z=0.88`), torn dark slate-navy hoodie + pointed hood cowl, pale ash skin, clawed hands, taped forearms.
2. `smoker-rig.blend` — Tall gaunt hunched build (`pelvis_z=1.06`, long neck/limbs), tattered olive shirt, spore-blister bumps along shoulder/neck, `tongue_socket` on head.
3. `witch-rig.blend` — Slender gaunt build (`pelvis_z=0.86`), elongated forearms (`0.38m`) with long dark-crimson claws, hanging pale-gray hair drape, torn tank/shorts, glowing crimson eye planes.
4. `charger-rig.blend` — Asymmetric heavy build (`pelvis_z=1.02`, `arm_scale_r=1.45`, `arm_scale_l=0.58`), massive right shoulder/arm/fist + shriveled left arm, torn denim overalls.
5. `tank-rig.blend` — Massive brute build (`pelvis_z=1.24`, `shoulder_half_w=0.46`, `torso_r=0.31`), oversized forearms/fists, heavy brow/jaw, ripped charcoal trousers, `slab_socket` between hands.

**Shared Technical Standards (100% Parity with `lead-rig.blend`):**
- Exact Blender 5.2.4 LTS 2-tone cel shader (`ShaderNodeShaderToRGB` → `CONSTANT` ColorRamp) matching `lighting.json` moods.
- Exact GPv3 Line Art (`#253a3b` ink, `LINEART` modifier on `RigMeshes` collection, clean silhouette + crease lines).
- Shared bone hierarchy (`pelvis`, `spine`, `chest`, `neck`, `head`, `upper_arm_L/R`, `forearm_L/R`, `hand_L/R`, `thigh_L/R`, `shin_L/R`, `foot_L/R`) with rigid-segment skinning (zero noodle arms/knees) and `auto_ground` floor contact.

---

### Phase 2 — Signature Infected Actions & Multi-Rig Renderer Support
**Deliverables:**
- `tools/blender-rig/infected-actions.json` — All 8 canonical actions migrated from `pose-library/infected/` + neutral stances:
  - `hunter-crouch-perch`, `hunter-pounce-launch`, `hunter-ground-pin`
  - `smoker-rooftop-snare`
  - `witch-sobbing`, `witch-alert-lift`
  - `charger-bull-charge`
  - `tank-slab-heave`
  - `infected-idle` (generic menacing 3/4 stance for turnaround QA)
- Update `tools/blender-rig/render-shot.py` & `tools/blender-rig/render-shot.mjs`:
  - Add `--rig lead|hunter|smoker|witch|charger|tank` (defaults to `lead`, 100% backward-compatible).
  - Auto-select `.blend` file and action JSON (`actions.json` vs. `infected-actions.json`).
  - Support both `LeadMeshes` and `RigMeshes` collections in `lowest_mesh_z()` so `auto_ground` and `--export-guide` floor-grid alignment work identically for all 6 characters.
  - Auto-apply gentle framing scale (`tank` height compensation) when using standard `cameras.json` presets so the Tank never clips the top of frame.

---

### Phase 3 — Visual QA Contact Sheet (`infected-sheet.png`)
**Deliverable:** `assets/series-lead/infected-sheet.png` (generated via `tools/blender-rig/generate-infected-sheet.py`)
- **Layout (5 rows × 3 columns = 15 panels):**
  - Col 1: `3q-front` menacing stance (checks 3/4 silhouette, palette, ink weight, and cel shading)
  - Col 2: `side` profile (checks hunch, arm asymmetry, and silhouette clarity)
  - Col 3: Signature action pose at a dramatic camera angle (e.g., `hunter-pounce-launch` @ `low-24mm`, `smoker-rooftop-snare` @ `low-24mm`, `witch-alert-lift` @ `3q-front`, `charger-bull-charge` @ `low-24mm`, `tank-slab-heave` @ `low-24mm`)
- **QA Gate:** Inspect `infected-sheet.png` at phone size alongside `angles-sheet.png` (verify consistent `#253a3b` ink thickness, 2-tone cel lighting, zero floating limbs, readable silhouettes on mute). Refine and re-render any failing rig/pose before Phase 4.

---

### Phase 4 — Legacy Cleanup, Doc Sync & Verification
**Deletes (Verified Zero Runtime Imports):**
- Remove `assets/series-lead/pose-library/` (all 19 superseded stick-figure `.svg`/`.json` pairs for both `lead/` and `infected/`, plus `pose-library/INDEX.md`).

**Keeps:**
- `assets/series-lead/reference-sheet.png` (canonical 2D Lead style/palette bible).
- `assets/series-lead/reactions-front.png`, `reactions-side.png`, `face-angles.png`, `hands/weapon-hands.js`, `hands/weapon-hands-sheet.png`, `hands/reference-sheet.png`.
- Legacy runtime files imported by existing episodes (`character.js`, `anatomy-prototype/*`).
- `tools/pose-grounding/project-pose.py` (marked as ad-hoc fallback for one-off non-rigged guest characters).

**Doc Updates:**
- `AGENTS.md` — Update Layer 1 & Hybrid Pipeline rules to reference `--rig lead|hunter|smoker|witch|charger|tank` and `assets/series-lead/infected-sheet.png`; remove outdated `pose-library/` stick-figure instructions.
- `assets/series-lead/README.md` — Add `infected-sheet.png` and `rig-3d/infected/*.blend` to the asset index; remove `pose-library/` links.
- `tools/blender-rig/README.md` — Document `--rig` usage, `infected-actions.json`, and `build-infected-rigs.py`.
- `tools/pose-grounding/README.md` — Note `3q-front`/`3q-back` presets and clarify ad-hoc fallback role.

**Verification:**
- Smoke-test `node tools/blender-rig/render-shot.mjs --rig tank --camera low-24mm --action tank-slab-heave --lighting horror-dark-rim --frame 1 --out /tmp/smoke-tank.png --export-guide /tmp/smoke-tank-guide.png` and `render-shot.mjs --rig lead ...` (backward compatibility).
- Clean any `__pycache__` and `/tmp` scratch files.
- Present `infected-sheet.png` for final user approval, then commit all changes on `feat/hybrid-3d-camera-rig`.
