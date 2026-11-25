# Episode title

**Creative reference:** [Nightmare Roulette camera, pacing, and voice guide](../references/long-form-camera-voice/README.md). In an episode plan, use `../../references/long-form-camera-voice/README.md` for this link.

**Status:** Planning / In production / In review / Delivered  
**Premise:**  
**Format and aspect ratio:** Short or long episode. Default 9:16.  
**Target runtime:**  
**Opening hook:**  
**Main event on screen and when it happens:**  
**Ending payoff:**  
**Narrator and tone:** Approved series narrator. Record episode-specific delivery notes and the chosen opening take.

## Story and sources

Trace two or three consequences from the main event. For each one, note what changes on the character while it happens and what the narration adds. If an anatomy cutaway or inset helps, specify the on-character shot immediately before and after it and what changes carry across the cut. For science episodes, record the source beside each claim that drives the story. For fictional episodes, state the rules of the scenario.

## Script and shots

List the exact narration in order and mark stress, pauses, and tone shifts. Link a sketch of any location where the viewpoint changes. Mark the important props, landmarks, eyelines, and direction of travel. For both formats, record what each camera change reveals and what matches across the cut. Mark the main event and first consequence for the early preview. Update times after choosing the narration take.

| Time | Narration and delivery | Viewpoint and purpose | Action and continuity | Sound and captions |
| --- | --- | --- | --- | --- |
| 0:00– | | First-person, third-person, overhead, or insert | | |

### Long episode beat map

Use this section for 3–5-minute episodes. Group the shots into beats and identify the first visible event, the reversal, the lead's decision, and the payoff.

| Time | What changes | Question or action that carries into the next beat |
| --- | --- | --- |
| 0:00– | | |

**Full-length rough cut and review notes** — Save path, runtime, and changes to pace, viewpoint continuity, or payoff.

## New references needed (Approval Gate)

Audit every shot against `tools/blender-rig/` (`cameras.json`, `actions.json`, `hand-poses.json`, `lighting.json`) and `assets/series-lead/` before production. **Do not begin episode animation until the user approves this table and all listed references are generated, visually verified, and registered into the shared library.** Write `None — all shots covered by existing universal references.` if no new references are needed.

| Missing movement / angle / hand grip / prop | Shots needing it | Pipeline (3D Body Rig / 3D Hand Rig / 2D Close-Up) | Permanent target path | Approved |
| --- | --- | --- | --- | --- |
| | | | | [ ] |

## Motion briefs

Copy this brief for the opening event, each major consequence, and any prop or surface contact that sells a story beat. Group actions in the same setup if one preview can verify them all.

### Shot or action name

- **Viewer takeaway** — The one action or reaction that must read on mute.
- **Timing** — Episode time range, frame rate, and key frames or timestamps. Say whether frame numbers refer to the shot or the episode.
- **Staging and reference** — Camera preset from `tools/blender-rig/cameras.json` ([8-angle sheet](../assets/series-lead/angles-sheet.png): `side`, `3q-front`, `3q-back-ots`, `low-24mm`, `high-cornered`, `overhead`, `pov-arms`, `pov-peek`, `floor-level`, `cctv-wide`), action preset from `actions.json` ([18-action sheet](../assets/series-lead/universal-actions-sheet.png)), lighting mood from `lighting.json`, 3-depth-plane staging ([framing cheat sheet](../assets/series-lead/framing-cheatsheet.png)), and hand/face references ([universal 3D hands](../assets/series-lead/hands/universal-hands-sheet.png), [face angles](../assets/series-lead/face-angles.png)). In a saved episode plan, prefix those paths with `../../`.
- **Pose reference search** — Record the source for each distinct action, the camera angle and action phase it shows, and the detail to check. If the shared references lack a match, inspect a real photo or clip, or record a local reference. Note how the shot adapts the reference to its prop, angle, and contact.
- **Contact and continuity** — Which part supports the body, which parts meet, the pickup and release points, and where props settle. Record the pose, expression, and prop state on either side of a cutaway where applicable.

| Time or frame | Pose and direction | Contact, weight, and visible response |
| --- | --- | --- |
| | Starting pose and anticipation | |
| | First contact and weight transfer | |
| | Strongest action or reaction and hold | |
| | Release and settled pose | |

- **Pass on mute** — Two or three visible conditions at phone size. Describe the defect that would trigger a retry.
- **Preview and result** — Record the key-pose check, render command or review reel timestamp, clip path, and pass or revise result. For a retry, record the first frame or time range that failed and what changed.

## Assets and render

- Free local tools and fallback if a tool or model is unavailable
- Reuse the [articulated series lead](../assets/series-lead/README.md) ([3-view turnaround](../assets/series-lead/reference-sheet.png), [8-angle perspective sheet](../assets/series-lead/angles-sheet.png), [universal actions](../assets/series-lead/universal-actions-sheet.png), [universal 5-finger hands](../assets/series-lead/hands/universal-hands-sheet.png), [special infected 3D cast](../assets/series-lead/infected-sheet.png), [front reactions](../assets/series-lead/reactions-front.png), [side reactions](../assets/series-lead/reactions-side.png), [face angles](../assets/series-lead/face-angles.png), [framing cheat sheet](../assets/series-lead/framing-cheatsheet.png), and [hybrid seam check](../assets/series-lead/hybrid-seam-check.png)). In an episode plan, prefix those paths with `../../`. Record the rig (`--rig`), camera preset, action/hand-pose preset, lighting mood, expression keys (`head-*`), and any outfit or condition changes.
- OpenToonz cutout layers, shot pose tracks, and how the episode render command calls the shared renderer for the preview and final
- Short action previews and optional review reel. Start with roughly 3–5 previews of 2–6 seconds for a minute-long episode.
- Remotion edit manifest, clean picture master, local audio, and caption cue file
- Episode-specific art or clips, with prompts or source references
- Narration and sound files
- Two opening reads and the chosen take, with notes on delivery and timing
- Model and third-party asset licenses and any required attribution
- Render command or project entry point

## Review and delivery

- [ ] The opening sets up the premise, the main event happens on screen, and the ending answers the opening question.
- [ ] The opening voice audition gives the hook, impact, and first explanation distinct delivery.
- [ ] The early preview makes anticipation, impact, reaction, and the first consequence readable at phone size on mute.
- [ ] Supporting feet and hands hold through contact. Skids and releases are intentional, and the torso and limbs show the weight shift and recovery.
- [ ] Compared key poses at the shot angle against the recorded references. Rechecked any redrawn silhouettes and contacts in motion at phone size.
- [ ] Inspected the key poses, then checked the motion briefs in silent phone-size previews with captions off. Rerendered failed ranges and recorded the results before full assembly.
- [ ] With sound on, the opening performance, cuts, captions, and effects land on the intended beats.
- [ ] In the local edit timeline, the cut, impact sound, and caption emphasis land on the intended frames.
- [ ] Each consequence is visible on the character at phone size with the sound off and captions ignored. Visible damage and reactions carry across cutaways.
- [ ] For a long episode, the rough cut was reviewed end to end before detailed animation. The viewpoint handoffs read, every chapter changes the situation, and the closing cue connects to the opening or an earlier clue.
- [ ] Viewpoint changes, narration pauses, and the ending cue serve the story, using the Nightmare Roulette study as the editing reference.
- [ ] Final export plays at the planned aspect ratio and runs within the chosen format. Shorts run 45–90 seconds. Long episodes run 3–5 minutes.
- [ ] Narration is clear, effects are balanced, and captions match the final audio.
- [ ] Captions read at phone size and clear the action and platform controls.
- [ ] Social post copy matches the verified export and includes any required credits.

**Opening preview path and review notes:**  
**Verified export path:**  
**Review notes:**

## Social post copy

**Post caption** — Write a ready-to-paste one-line hook that names the premise. This goes in the social post.

**Description** — In one to three sentences, say what the episode follows and give viewers a reason to watch. Mark fictional scenarios where context matters. Use language that matches the final cut and include any relevant source links or required credits. Keep the payoff for the video when possible.

**Tags and hashtags** — Use `#WhatHappensNext` and a short set of episode-specific tags. Give plain keywords when an upload form uses a separate tag field.

**Platform-specific copy** — Add a labeled variant when the title, caption, description, or tag field needs different text for a requested platform.
