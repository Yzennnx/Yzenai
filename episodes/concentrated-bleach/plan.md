# What if you accidentally drank concentrated bleach?

**Original production reference:** [Lava pilot](../lava-pool/exports/lava-pool-character-revision.mp4)  
**Status:** Revision delivered. The [60-second revision](exports/concentrated-bleach-revision.mp4) is the current verified export.  
**Premise:** The lead mistakes a pale liquid in a kitchen tumbler for water. It is concentrated chlorine bleach containing sodium hypochlorite.

## Revision plan

**Runtime:** 60 seconds with 155 scripted words, up from 85 in the first cut. The shot list uses approximate times.  
**Opening hook:** “What if that water was concentrated bleach?”  
**Main event:** Keep the sip around 0:04. The rim meets the lips, the lead swallows, and their head snaps back before they set the glass down and grab their throat.  
**Ending payoff:** The lead doubles over in pain, slips off the counter edge, and drops to one knee and then both. They pull the phone off the counter and call for help from the kitchen floor. The tumbler stays where they set it down, visible above them in the last shot.  
**Narrator and tone:** Same approved Chatterbox Nano voice, local pilot reference WAV, and half-semitone lift. The revised script follows the character in second person, with a thought or action over each major shot. Read conversationally through the recoil, slow briefly for “sodium hypochlorite,” then pick up as the lead struggles for breath and reaches for the phone. Leave a short beat for the swallow and the first knee hitting the floor.

### Story and sources

Treat this as one severe hypothetical exposure. Concentrated sodium hypochlorite can injure tissue on contact, and throat swelling can make breathing difficult. The ensuing knee drop is this character's response to pain and distress. The cutaway compresses elapsed time between the first throat pain and labored breathing. The final line directs viewers to emergency help when someone has trouble breathing after swallowing bleach. [MedlinePlus](https://medlineplus.gov/ency/article/002488.htm) · [Poison Control](https://www.poison.org/articles/what-is-bleach)

### Revised script and shots

| Time | Narration | Visual and motion | Performance and sound |
| --- | --- | --- | --- |
| 0:00–0:03.5 | What if that water was concentrated bleach? | Medium close-up. The lead raises the tumbler and glances at the rim. Establish the phone near the counter edge in the same shot. | Curious and direct. Stress WATER and BLEACH. |
| 0:03.5–0:10 | You take one sip. By the time you set the glass down, your throat feels like it's on fire. | Tight profile for rim contact and swallow. Snap back to the opening angle as the lead jerks their head away, strikes the counter with the base of the glass, and brings a hand to their throat. | Leave a brief swallow beat after SIP. The glass knocks against the counter as the pace quickens. |
| 0:10–0:18 | That's sodium hypochlorite, the active ingredient in bleach. In a concentrated solution, it can injure tissue as soon as it touches it. | Stay close on the lead. They squeeze their eyes shut, lower their chin, and brace their free palm flat on the counter. End the opening preview here. | Give SODIUM HYPOCHLORITE room. Stress INJURE TISSUE. |
| 0:18–0:24 | You lean over the counter, waiting for the burning to ease. Then it gets harder to breathe. | Widen enough to see the weight shift onto the bracing arm. The lead opens their mouth and takes a short, visibly strained inhale. | Start as an observation, then turn urgent on BREATHE. |
| 0:24–0:30 | In a severe case, your throat can swell. That leaves less room for air to pass. | Brief profile cutaway. The tissue grows inward as the opening narrows. Match back to the lead's tilted head and hand at their throat. | Stress SWELL and LESS ROOM. Carry the room tone across the cut. |
| 0:30–0:39 | Back at the counter, your shoulders lift with every breath. You open your mouth wider, and it still feels like you can't get enough air. | Return fully to the lead. Shoulders hitch twice, the mouth opens wider, and the bracing elbow bends as the character folds forward. Reveal their feet and knees before the drop. | Keep the phrases connected. Let a strained inhale come through between sentences. |
| 0:39–0:48 | The pain doubles you over. Your hand slips off the counter. One knee hits the tile, then the other. | Hold a three-quarter wide shot. The free palm slides off the edge. One knee lands, the other follows, and the lead catches their weight on the free hand while still clutching their throat. | Stress SLIPS and KNEE. Give the first impact a short gap, then let the second land under the narration. |
| 0:48–0:55 | You can just reach the phone. You drag it over the edge and hit the emergency call button. | From floor height, the lead looks up and hooks the phone with their fingertips. It slides off the counter into their hand. Show the thumb pressing the screen, then return to the lead's face. | Stress PHONE and EMERGENCY. Use a scrape and one quiet call tone. |
| 0:55–1:00 | If someone swallows bleach and has trouble breathing, get emergency help now. | Hold the kneeling lead in focus with the lit phone in hand and the glass visible above them on the counter. Their shoulders are still heaving under the final caption. | Slow down on EMERGENCY HELP NOW. Hold the final caption through the cut. |

### Assets and production approach

- Reused the existing kitchen, tumbler, lead, and airway art. Built the [full-body pose reference](assets/revision-character-poses.png) from the planted palm, forward fold, first knee landing, second knee landing, and kneeling reach. Extended the kitchen down to the tile and cabinet base and animated each leg in the existing Canvas scene.
- Audition two reads of the revised opening through 0:18 using the local CPU voice. Read full sentences in both. Compare a conversational take with a quicker take through the recoil, then reuse the selected audio in the revised full cut. Lock the rest of the timing against the recorded narration. [Chatterbox Nano, MIT](https://huggingface.co/ResembleAI/chatterbox-nano)
- Use the existing local Edge, Node.js, and FFmpeg workflow at $0. Use original synthesized effects for the glass knock, inhales, knee impacts, phone slide, and call tone. Keep the white and yellow captions clear of the knees and phone. Use separate revision filenames for the opening preview and full MP4. The first cut's render entry point is documented below.
- From the project root, run `node episodes/concentrated-bleach/render.mjs --revision --full` to build from the saved narration and caption cues. Omit `--full` to render the measured opening. Substitute `--ending` to preview the last 21 seconds. To regenerate the local narration, invoke `generate-voice.py` with `--revision` for the two opening takes or `--revision measured` for the full read. Regeneration estimates page breaks from text length. The saved JSON includes the reviewed phrase timing.

### Review before delivery

- [x] Reviewed [the measured opening preview](exports/bleach-revision-opening-measured.mp4) at phone size through the throat grab and first explanation. Compared both local reads using word timestamps. The measured take leaves more space at the end of the sip, and the preview shows contact, recoil, and throat grab as distinct actions.
- [x] Reviewed the [21-second ending preview](exports/bleach-revision-ending.mp4) at phone size. Shortened the jacket in the full-body pose and sped up the last part of each drop so the two knee contacts read separately. The phone press has a close-up, and the glass stays visible above the lead in the last shot.
- [x] Checked caption changes against local word timestamps. Verified that the full narration track reuses the measured opening sample for sample.
- [x] Fully decoded the revised export. Verified 60 seconds, 1080 × 1920 at 24 fps, H.264 video, AAC audio at 48 kHz, and a decoded audio peak of −1.01 dBFS. Reviewed sampled frames at phone size and checked the final narration by local transcription and waveform levels.

**Verified revision export:** [Concentrated bleach revision](exports/concentrated-bleach-revision.mp4). The first and second knee impacts land around 0:44 and 0:47. The emergency call starts at 0:53 and the final caption holds until 1:00.

## Remotion revision

- The head recoils before the shoulders follow the sip. The bracing hand holds at the counter before it slides and releases. The feet hold through the start of each knee drop, then skid and settle independently. The hips follow through after each impact.
- Keep the measured narration, airway cutaway, and phone-call payoff. Bring the first sharp inhale closer to the recoil. Reuse the narration cue file for white captions with yellow emphasis, positioned above the floor action.
- From the project root, run `node episodes/concentrated-bleach/render.mjs --full --revision --edit-source` to generate the clean picture and mix from the existing Canvas character art. Run `node tools/remotion/edit.mjs concentrated-bleach --studio` to review the [edit](remotion-edit.json) or omit `--studio` to export. OpenToonz is the default for new shots using the shared character rig. This revision builds on the episode's existing poses and character artwork. [Remotion workflow and license](../../tools/remotion/README.md)
- Fully decoded the [60-second Remotion revision](exports/concentrated-bleach-remotion-revision.mp4) at 1080 × 1920, 24 fps, with H.264 and AAC. Compared the recoil, brace, and knee contacts against the prior cut at phone size. Checked caption placement at the airway cutaway, call, and closing hold. The audio matches the revised local mix, with a decoded peak of −1.0 dBFS.

## Delivered first cut

**Target runtime:** 46 seconds.  
**Opening hook:** “What if that water was concentrated bleach?”  
**Main event:** At about 4 seconds, the tilted rim meets the lead’s lips. They swallow once, recoil, and grab their throat. In this severe case, swelling then makes it hard to breathe.  
**Ending payoff:** The camera returns to the glass as the lead, still struggling to breathe, reaches for the phone.  
**Narrator and tone:** Approved local Chatterbox Nano reference with the pilot’s half-semitone pitch lift. Start curious, leave room for the recoil, and pause again so the labored inhale comes through.

### Story and sources

- The story follows a hypothetical symptomatic exposure to concentrated sodium hypochlorite. The shot timing is for storytelling. Symptoms and severity vary with the concentration and amount swallowed. Some bleach products have a yellow tint, reflected in the storyboard’s faint straw-colored liquid. [Poison Control](https://www.poison.org/articles/what-is-bleach)
- Contact can injure tissue. The lead first recoils from throat pain. In this severe case, swelling makes breathing difficult. The cutaway shows the swollen tissue around the upper airway, with the esophagus labeled separately. Back at the counter, the lead’s hand stays at their throat, but their shoulders rise and their mouth opens as they struggle to draw breath. Treat the edit from the cutaway to the gasp as elapsed time. [MedlinePlus](https://medlineplus.gov/ency/article/002488.htm) · [Poison Control](https://www.poison.org/articles/what-is-bleach)
- The lead reaches for help. The final cut can close with “Swallowed bleach? Get medical help immediately.” [MedlinePlus](https://medlineplus.gov/ency/article/002488.htm)

### Script and shots

| Time | Narration | Visual and motion | Sound and caption emphasis |
| --- | --- | --- | --- |
| 0:00–0:03 | What if that water was concentrated bleach? | Kitchen medium close-up. The lead lifts a plain tumbler and glances at the rim. | Curious read. Stress WATER and BLEACH. |
| 0:03–0:07 | You take one sip. Then your throat starts to burn. | Cut close on the rim touching the lips. Tilt the tumbler, hold for the swallow, then snap the head back. | Pause after SIP. Small swallow, then a sharp inhale. |
| 0:07–0:15 | The active ingredient is sodium hypochlorite. In a concentrated solution, it can injure the tissue it touches. | Match the opening angle. The lead sets the glass down hard and grabs their throat. Cut off the opening preview here. | Brief knock on the counter. Stress SODIUM HYPOCHLORITE and TOUCHES. |
| 0:15–0:23 | In a severe case, the tissue in your throat can swell. That leaves less room for air to get through. | Stay with the lead through the first signs of breathing trouble. Cut to a profile around 0:19 and narrow the airway as tissue swells. Label the esophagus separately. | Stress SWELL and AIR. |
| 0:23–0:36 | Your shoulders lift. You open your mouth wider. And it’s still hard to pull in a breath. | Cut back later in the same scene to a tighter view. The lead keeps a hand at their throat, braces against the counter, and folds forward with their mouth open as they try to inhale. | Give the inhale a beat on its own. Keep sound focused on the lead’s effort. |
| 0:36–0:46 | The glass still looks ordinary. If someone swallows bleach, get medical help immediately. | Focus on the intact glass as the lead reaches for the phone behind it. Hold long enough to read the final caption. | Quiet callback. Stress MEDICAL HELP. |

### Assets and render

- Original local Canvas art. Use the pilot lead’s angular cap, warm jacket, and textured cutout treatment. A cool kitchen, one warm practical light, rust-red anatomy emphasis, and white captions with yellow stress tie the shots together.
- [Storyboard source](storyboard.html) renders the six static 9:16 compositions in Edge. [Storyboard PNG](exports/storyboard.png) is the approval copy. Open the source directly in Edge to view the responsive frame layout.
- Local Chatterbox Nano CPU narration uses the existing approved pilot WAV. The measured read leaves a longer beat for the swallow and recoil. The first 15 seconds of the full narration reuse that take sample for sample. [Chatterbox Nano, MIT](https://huggingface.co/ResembleAI/chatterbox-nano)
- Original code-drawn art and synthesized sound effects use no third-party media. Captions use system Arial. Animation and export use local Edge, Node.js, and FFmpeg.
- Run `node episodes/concentrated-bleach/render.mjs --full` from the project root to render the full cut from saved WAV and caption cues. Omit `--full` for the measured opening preview or substitute `--quick` for the alternate take.

### Review and delivery

- [x] The storyboard shows the sip early and carries the lead’s throat reaction across the airway cutaway into the labored inhale.
- [x] Storyboard approved for animation.
- [x] Measured and quick opening reads auditioned. Measured selected for the full cut.
- [x] Reviewed phone-size frames from the opening and full cut without audio. The rim meets the lips, the lead recoils and grabs their throat, and the lead is still braced at the counter after the airway cutaway.
- [x] Verified the exported narration with local speech recognition, aligned caption changes to phrase boundaries, and checked levels and full-file decoding.
- [x] Checked title-safe caption placement and labels at phone size. The closing help message holds through 0:45.4.

**Opening previews:** [Measured](exports/bleach-opening-measured.mp4) and [early quick audition](exports/bleach-opening-quick.mp4). The measured preview closes the gap between the rim and lips, adds a swallow motion, and shows the lead grabbing their throat after setting down the glass.  
**Verified episode export:** [Concentrated bleach](exports/concentrated-bleach.mp4), 46 seconds, 1080 × 1920 at 24 fps, H.264 with 48 kHz AAC and burned-in captions.  
**Review notes:** The full cut stays on the lead for the first breathing change, shows the airway narrowing, then returns to the lead with their hand still at their throat. Both the glass and the phone are visible in the closing shot. The final cutaway labels stay readable during the caption-free hold. Visual review used sampled frames, and audio review used waveform levels and local transcription.

## Social post copy

**Post caption** — What if you mistook concentrated bleach for water?

**Description** — One wrong sip changes everything. This fictional animation follows the lead as throat pain turns into trouble breathing and they reach for help.

**Tags** — What Happens Next, concentrated bleach, accidental poisoning, human body, what if animation

**Hashtags** — #WhatHappensNext #AccidentalPoisoning #HumanBody #AnimatedShort
