# AI workflow for Animated What If Shorts

Apply this workflow to work in this project folder. Read [PROJECT_SPEC.md](PROJECT_SPEC.md) before planning or producing an episode. Start each new episode with [templates/episode-plan.md](templates/episode-plan.md). Keep production decisions and progress in the episode plan.

Use the [Nightmare Roulette study](references/long-form-camera-voice/source-study.md) and [camera, pacing, and voice guide](references/long-form-camera-voice/README.md) as the creative reference for both shorts (45–90 seconds) and long episodes (3–5 minutes). Apply the viewpoint changes, [zooming, looking-around POV, and motion intensification](references/long-form-camera-voice/README.md#zooming-looking-around-pov-and-intensifying-motion) techniques, scene variety, and voice timing to original scenes with our lead and narrator.

Keep the series' textured cutout style, white captions with yellow emphasis, and visual callbacks. Show the main event early. Keep the character on screen as each consequence starts, use brief cutaways for hidden effects, and return to the character with the change still visible.

The project budget is **$0**. Use the existing computer and free local tools. Skip paid services, subscriptions, trials, payment-card signups, metered APIs, and credit-based generation. If a tool's cost is unclear or the local hardware can't run it, choose a free local fallback. Record model and third-party asset licenses in the plan and include any required credits with delivery.

On the current Windows PC, reusable tools are under `%LOCALAPPDATA%\AIShortVideos`. Use `chatterbox\Scripts\python.exe` for the approved series narrator. The model is in `chatterbox\nano\` and the reusable reference is `chatterbox\voice-reference.wav`. Use `ffmpeg.exe` and `ffprobe.exe` from the FFmpeg release folder's `bin\` directory. Edge and Node.js are already available on this PC.

Use OpenToonz by default for character action in new episodes. It is installed at `C:\Program Files\OpenToonz\OpenToonz.exe`. Use the [shared cutout rig and renderer](tools/opentoonz/README.md) with the episode's motion briefs.

Use the [articulated series lead](assets/series-lead/README.md) for the recurring character in new episodes. Use the same [artwork](assets/series-lead/anatomy-prototype/art.js) and [pose tracks](assets/series-lead/anatomy-prototype/poses.mjs) in the opening preview and final render. Check proportions, outfit, and contact poses against the matching view in the [three-view turnaround](assets/series-lead/reference-sheet.png) (**Front, Side, and Back views only** — do not use front or rear three-quarter turnaround views) and the [cinematic anatomy angles](assets/series-lead/angles-sheet.png) (`ots`, `overhead`, `low-angle`, `high-angle`). Pick facial acting from the 12-emotion [front reaction sheet](assets/series-lead/reactions-front.png), [side reaction sheet](assets/series-lead/reactions-side.png) (`head`, `head-notice`, `head-alarm`, `head-dread`, `head-panic`, `head-strain`, `head-determined`, `head-angry`, `head-exhausted`, `head-pain`, `head-sneak`, `head-relief`), [face angles and crash-zoom sheet](assets/series-lead/face-angles.png), and [cinematic face & camera motion reel](assets/series-lead/anatomy-prototype/cinematic-face-camera-reel.mp4) (`eye-dart`, `head-tilt`, `look-up`, `look-down`, `glance-back`, `ecu-dread`). For dynamic body actions, check the [dynamic survival movement reel](assets/series-lead/anatomy-prototype/dynamic-movements-reel.mp4) and [frame guide](assets/series-lead/anatomy-prototype/README.md#dynamic-survival-movements) (`sneak`, `flinch`, `sprint`, `shove`, `slash` with straight-arm `hand-pipe` extension, and `vault`) before building custom tracks. For first-person inserts, match the lead's sleeve, hand, and grip across the camera cut using the [POV survival hand sheet](assets/series-lead/hands/pov-survival-sheet.png) and [close-up hand references](assets/series-lead/README.md#close-up-hand-references). The shared rig animates the side view. For other angles, build the shot layers from the matching turnaround or cinematic angle helper (`drawCinematicAngle`, `drawFaceAngle`, `drawPovSurvivalHand`) and record the view or costume variant in the episode plan.

For hand close-ups and first-person inserts, study the [series lead's close-up hand references](assets/series-lead/README.md#close-up-hand-references) for anatomy, joint bends, overlap, and contact. Pose the hand for the shot's action, camera angle, and prop shape. For AI-assisted artwork, supply the closest reference and describe how the shot's pose differs. Check the thumb side, cuff, and prop contact across the cut.

Search for pose references before drawing or animating each distinct character action. Start with the [character motion index](assets/series-lead/README.md#find-a-reference-by-action), the [reaction sheets](assets/series-lead/README.md#face-expressions), and the [three-view turnaround](assets/series-lead/reference-sheet.png). If they do not show the relevant movement, camera angle, or contact, find and inspect a real photo or clip, or record a local reference. Match the action phase, camera angle, and prop or surface. Use the reference to check silhouette, joint bends, foreshortening, overlap, balance, and contact. Adapt the pose to the lead and the shot.

Use the official Remotion Best Practices skill for episode editing and assembly. Use the [local Remotion editor](tools/remotion/README.md) for the preview and final edit when the project qualifies for the free license. The editor uses local files and the existing caption timing.

Use the approved series narrator with the same reference WAV, Chatterbox Nano CPU model, and half-semitone pitch lift. The [narration generator](episodes/lava-pool/generate-reference-voice.py) records the tested settings and the [voice provenance](episodes/lava-pool/plan.md) identifies the original user-supplied clip. Keep voice reference processing local.

## 1. Brainstorm

Check [EPISODES.md](EPISODES.md) before suggesting or committing to a premise. Look for the same event and consequences under different titles. If a premise matches, link to the existing episode and use its plan for any requested revision.

Use the user's premise if they have picked one. If they are exploring, suggest a few distinct premises or treatments. For each, pitch the opening image, the extreme or impossible event the viewer will actually see, and the most surprising consequence. Recommend the option with the strongest sequence of actions and consequences that can be animated with the project's local tools. A brainstorming request ends with options and a recommendation.

## 2. Plan

When the user asks to plan or make an episode, create or update `episodes/<episode-slug>/plan.md` using [templates/episode-plan.md](templates/episode-plan.md). Continue the existing plan when resuming an episode.

For a new episode, check [EPISODES.md](EPISODES.md) and existing episode plans before creating its folder. If the premise is already in production, continue that plan.

Plan the shot that delivers the premise first. Write what the viewer sees during the event and where it lands in the timeline. Default to showing it in the opening sequence so the rest of the short can follow the consequences. If the story needs a later reveal, make the opening show a clear step toward it and give the buildup a specific purpose.

Build the timed shot list around two or three consequences that follow from the event. Show the consequence happening to the character as it unfolds. Give each beat a visible change in the body, clothing, posture, movement, or expression. Use narration to explain what caused it. For effects inside the body, use a brief cutaway or inset tied to that exact reaction, then return to the character with the change still visible. Reserve the ending for a final consequence, reveal, or callback that answers the opening question.

Record the runtime, voice, narration, asset needs, and free tools. Include sources for factual claims and assumptions that materially affect the scenario. Choose how to animate each shot locally. Check the timing against the narration and simplify the visual treatment if a shot exceeds the production budget.

Mark the words to stress, where the narrator should pause or speed up, and where the tone should shift. Break the opening into camera setups and write what changes in each one. Plan the character's anticipation, action, and reaction poses, what the environment does in response, and how the first explanation will reveal a change on screen. Use reference clips to identify performance, staging, and editing techniques for original scenes. Look up the action and angle in the [character motion index](assets/series-lead/README.md#find-a-reference-by-action). In the motion brief, link the specific clip or pose sheet and name the frame range or pose to study.

For each character action shot, mark the supporting foot or hand, when contact begins and ends, how the hips or torso shift weight, and which limbs react first. Tie any slip, release, recoil, or settling pose to a story beat. Use the same character state on either side of cutaways. When cutting between side, front, and back views in the middle of a movement, match the support limb, contact state, and phase across the cut.

### Camera and beat planning

Choose the format in the plan. Use the timed shot list to give every beat a visible change or a reason to hold. For a short, compress the sequence into the hook, the event, its clearest consequences, and the payoff. For a 3–5-minute episode, also group the consequences into a timed beat map. Start with roughly 6–8 beats and plan a reversal that changes the lead's next action.

Sketch the geography of each main location and mark the direction of travel, eyelines, and recurring props. Label the shot's viewpoint and purpose. Use first-person views for what the lead sees or interacts with, third-person views for body action and spatial relationships, and close-ups or inserts for reactions and proof. Match eyelines, contact, and prop state when switching. Identify the first frame on which a new detail becomes visible and record narration or sound cues that should lead, land on, or follow that frame.

### Motion briefs

In the episode plan, write a motion brief for the opening event, the action that shows each major consequence, and any story beat that depends on contact with a prop or surface. Use the fields in the [episode template](templates/episode-plan.md#motion-briefs). A brief can cover several actions that share the same shot. Start with the single action the viewer should be able to identify on mute.

- **Stage the action.** Specify the starting silhouette and screen direction, where the supporting body parts and props are, and which camera angle keeps the crucial contact and expression visible. Link the pose or clip, give the relevant frame or time range, and record the detail it resolves. For a difficult grip or weight shift, study the approach, contact, and release.
- **Key the important poses.** Record the episode time range and frame rate. Time the anticipation, first contact, weight transfer, strongest reaction, release, and settled pose as applicable. Include holds and the order of movement. For example, name the knee that buckles first, what the hips do during the next few frames, and when the chair shifts. Retiming a shot also updates the brief.
- **Describe the physical result.** Name each contact pair and its start and end. Identify the visible changes in the face, pose, prop, or setting, what starts each change, and what carries across a cut. Specify the final resting position when a limb or object sets down.
- **Define a pass on mute.** Describe two or three things the viewer must see at phone size. Name the specific defect that calls for a retry, such as a rim that stops short of the lips, a hip gap above a seat, or a phone that starts sliding before the grip.

A request for a plan ends with the saved plan. A request to make a finished episode authorizes continuing into production after the plan is saved. Use the user's chosen premise, or the strongest documented option when the user delegates the choice. Ask only when an unresolved decision materially changes the deliverable or requires separate authorization.

## 3. Generate and assemble

Pose the shared series lead with the expressions and body positions needed for the opening. Compare the key-pose stills with the reference sheet. Audition at least two reads of the same opening locally using the approved narrator, including the hook, the impact line, and the first explanation. Generate full sentences so the intonation carries across caption breaks. Vary performance with phrasing and pauses within the same voice. Listen for clear stress, shifts in pace, and a pause that gives the impact room. Once the user approves an opening take, reuse its audio when assembling the full episode. Choose takes before locking shot timing and align captions to the spoken words during playback.

Supply transparent character layers and write shot-specific pose tracks under the episode folder. Call the shared OpenToonz renderer from the episode render command so both the opening preview and final render generate their character frames automatically. Composite those frames in the browser with the environment and cutaways. Use FFmpeg for the local audio mix. Render a clean picture master and use Remotion for the shot timeline, audio placement, timed captions, and final export. Tune the cut, audio cue, and caption emphasis against the same impact frame in Studio. If Remotion is unavailable or the project no longer qualifies for its free license, apply captions and encode with the local browser and FFmpeg path. If OpenToonz is unavailable, use the local canvas renderer with fixed contact points and independently timed limbs. Record any fallback in the plan.

Build an opening preview through the first visible consequence before animating the remaining shots. Watch at phone size with the sound off. Check that framing directs the eye, poses make anticipation and reaction readable, planted limbs hold until release, and the scene visibly responds to the impact. Listen with sound on to check that narration, cuts, captions, and effects land together. Revise and retest the opening if either pass falls short. Record the chosen read, what changed, and the preview path in the episode plan. Update the plan as production choices change.

For a long episode, make a full-length rough cut with storyboards or key poses and timed narration before animating the remaining shots in detail. Check pace, viewpoint handoffs, pauses, and the ending in sequence. Resolve confusing geography or repetitive beats while shots are still cheap to change. Time the edit in chapters and render the costly motion after the rough cut reads.

For each motion brief, first inspect the key poses as stills. Check the silhouette, visible contacts, balance, and framing before spending time on the full movement. Then render a short silent preview, usually 2–6 seconds. Budget roughly 3–5 motion previews for a minute-long episode. For longer episodes, choose ranges around difficult body actions, prop contact, viewpoint transitions, and the payoff. Let one clip cover adjacent actions where it gives enough time to see each beat, and count a reviewed opening clip toward that total when it covers a brief.

Compare the stills to the chosen pose reference at the intended camera angle. If a gesture still reads awkwardly, identify the failing frame and look for a clearer reference for that phase before redrawing it. Recheck the revised still and the surrounding movement at phone size.

Play the preview at phone size without captions, then scrub through contact, weight shift, release, and recovery. Animate held props from the same wrist track that poses the hand. Check the first and last grip against the prop's resting position. Compare revisions with the same camera and edit timing where practical. If the action fails its pass conditions, identify the first failing frame or time range, change that beat, and rerender the affected range. Record the preview path, command, and review result in the plan.

When sharing several previews, combine them into one short local review reel with the shot names or episode times. Use the opening preview for the separate narration and impact sync check. Assemble the full episode after the planned action previews pass their motion checks.

Keep each episode's plan, prompts or asset notes, and media together under `episodes/<episode-slug>/`. Use `assets/` for episode media and `exports/` for rendered versions. Create these folders as needed. Save the render command or project entry point in the plan so the episode can be revised later.

## 4. Review and deliver

Check the exported file's duration, dimensions, and audio. At phone size, watch once on mute while looking away from the captions. Confirm that the main event and each consequence register on the character and that their condition carries across cutaways. Then check caption timing, space for platform controls, narration clarity, sound cues, and the ending payoff. Fix recoverable issues and recheck the final render.

For either format, verify that the audience can tell whose viewpoint they are in and that landmarks and props carry across cuts. Check narration-free holds and sound-led cuts against the intended reveal timing. For a long episode, also verify that each chapter changes the situation.

Record the verified export path and review notes in the plan. Fill in [Social post copy](templates/episode-plan.md#social-post-copy) for every completed episode and include it with the delivery. Draft a short caption built around the episode question, a description that accurately previews the final cut, and relevant tags or hashtags. Use episode-specific terms and include `#WhatHappensNext` for the series. Include source links or required credits where they belong in the description. Label a version by platform when the user needs different copy for that platform.

Share the local file and ready-to-paste post copy with the user. Publishing requires the user's explicit request.

When an episode has a verified full export, add it to [EPISODES.md](EPISODES.md) with its premise, consequences, plan, and export. Update the existing entry when a revised cut supersedes the listed export.
