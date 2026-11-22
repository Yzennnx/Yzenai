# Series Lead & Infected Pose Library (Blender 3D → 2D Grounded)

Every pose below is projected via headless Blender ([project-pose.py](../../../tools/pose-grounding/project-pose.py)) with anatomical joint limits enforced, outputting both exact 2D joint coordinates (`.json`) and a mannequin silhouette reference (`.svg`).

## Series Lead (`lead/`)

### Locomotion (`lead/locomotion/`)
- [lead-low-ready-walk.svg](lead/locomotion/lead-low-ready-walk.svg) · [.json](lead/locomotion/lead-low-ready-walk.json) — Tactical low-ready shotgun walk (`Ch 2C`, `Ch 3A`)
- [lead-crouch-stealth.svg](lead/locomotion/lead-crouch-stealth.svg) · [.json](lead/locomotion/lead-crouch-stealth.json) — Low crouched stealth creep (`Ch 1B`, `Ch 3A`)
- [lead-glass-freeze.svg](lead/locomotion/lead-glass-freeze.svg) · [.json](lead/locomotion/lead-glass-freeze.json) — Locked mid-stride freeze (`Ch 3A`)
- [lead-stair-descend.svg](lead/locomotion/lead-stair-descend.svg) · [.json](lead/locomotion/lead-stair-descend.json) — Walking down concrete stairs (`Ch 1B`)
- [lead-stair-climb.svg](lead/locomotion/lead-stair-climb.svg) · [.json](lead/locomotion/lead-stair-climb.json) — Two-step stairwell climb (`Ch 3E`)

### Actions (`lead/actions/`)
- [lead-barricade-shove.svg](lead/actions/lead-barricade-shove.svg) · [.json](lead/actions/lead-barricade-shove.json) — Heavy bookshelf / workbench barricade shove (`Ch 1A`, `Ch 2B`)
- [lead-knife-slash.svg](lead/actions/lead-knife-slash.svg) · [.json](lead/actions/lead-knife-slash.json) — Full-extension straight-arm slash (`Ch 1C`, `Ch 2B`)
- [lead-barrier-vault.svg](lead/actions/lead-barrier-vault.svg) · [.json](lead/actions/lead-barrier-vault.json) — Athletic split-leg dumpster / concrete barrier vault (`Ch 1C`, `Ch 3B`)

### Combat & Ground States (`lead/combat/`)
- [lead-hunter-knockdown.svg](lead/combat/lead-hunter-knockdown.svg) · [.json](lead/combat/lead-hunter-knockdown.json) — Supine asphalt knockdown with defensive forearm guard (`Ch 2B`)
- [lead-pistol-brace.svg](lead/combat/lead-pistol-brace.svg) · [.json](lead/combat/lead-pistol-brace.json) — Two-handed 9mm cover brace (`Ch 3B`)
- [lead-kneel-shotgun-aim.svg](lead/combat/lead-kneel-shotgun-aim.svg) · [.json](lead/combat/lead-kneel-shotgun-aim.json) — Kneeling shotgun firing stance (`Ch 3C`)

## Original Infected Cast (`infected/`)

### Hunter (`infected/hunter/`)
- [hunter-crouch-perch.svg](infected/hunter/hunter-crouch-perch.svg) · [.json](infected/hunter/hunter-crouch-perch.json) — Coiled awning crouch (`Ch 2B`)
- [hunter-pounce-launch.svg](infected/hunter/hunter-pounce-launch.svg) · [.json](infected/hunter/hunter-pounce-launch.json) — Explosive diagonal pounce (`Ch 2B`)
- [hunter-ground-pin.svg](infected/hunter/hunter-ground-pin.svg) · [.json](infected/hunter/hunter-ground-pin.json) — Ground-pin forearm bite (`Ch 2B`)

### Smoker (`infected/smoker/`)
- [smoker-rooftop-snare.svg](infected/smoker/smoker-rooftop-snare.svg) · [.json](infected/smoker/smoker-rooftop-snare.json) — Tall hunched rooftop tongue snare (`Ch 1C`)

### Witch (`infected/witch/`)
- [witch-sobbing.svg](infected/witch/witch-sobbing.svg) · [.json](infected/witch/witch-sobbing.json) — Hunched weeping silhouette (`Ch 3A`)
- [witch-alert-lift.svg](infected/witch/witch-alert-lift.svg) · [.json](infected/witch/witch-alert-lift.json) — Startled head-lift & crimson eyes (`Ch 3A`)

### Charger (`infected/charger/`)
- [charger-bull-charge.svg](infected/charger/charger-bull-charge.svg) · [.json](infected/charger/charger-bull-charge.json) — Asymmetric shoulder-down bull charge (`Ch 3C`)

### Tank (`infected/tank/`)
- [tank-slab-heave.svg](infected/tank/tank-slab-heave.svg) · [.json](infected/tank/tank-slab-heave.json) — Overhead concrete/marble slab heave (`Ch 3D–3F`)
