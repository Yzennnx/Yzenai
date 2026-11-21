# What if your shadow suddenly had weight?

**Original production reference:** [Lava pilot](../lava-pool/exports/lava-pool-character-revision.mp4)  
**Status:** Abandoned. The animation did not meet the user’s expectations.  
**Premise:** On a quiet sidewalk, the lead's shadow starts pulling on their heels.  
**Target runtime:** 46 seconds.  
**Opening hook:** “What if your shadow suddenly had weight?”  
**Main event on screen and when it happens:** Around 3 seconds, the lead plants a foot outside the brightest part of a streetlight. Their long shadow goes taut and both heels skid back as their arms swing forward.  
**Ending payoff:** The lead stands up under the streetlight. A parked car switches on its two headlights. Two long shadows spread apart and pull the lead off their feet, echoing the opening.  
**Narrator and tone:** Approved Chatterbox Nano reference on CPU, lifted by half a semitone. Open with curious urgency, pause for the first skid, settle into the explanation, and leave room for the final yank.

## Story and sources

The weight is fictional. Every visible shadow cast by the lead pulls away from its light source at the shoes. A longer shadow pulls harder. Two headlights make two shadows and their pulls add together. The streetlight stays on. The car stays at the curb.

First the lead buckles under the long shadow. They get a toe down and discover the pull weakens as they work their way back toward the lamp. They straighten under the lamp, breathe out, and get pulled flat when the headlights come on. A brief overhead cutaway shows the same shoes, scuffs, and shadow as the lead tests the distance. The sidewalk carries both the initial scuff and the final longer skid.

## Script and shots

| Time | Narration | Visual and motion | Sound and caption emphasis |
| --- | --- | --- | --- |
| 0:00–0:03 | What if your shadow suddenly had weight? | Sidewalk wide. Lead takes a step out of the pool of light. Shadow stretches out behind the planted heel. | Curious, stress SHADOW and WEIGHT. Footfall. |
| 0:03–0:07 | One step, and it pulls your feet right out from under you. | Shadow snaps taut. Tighten on the lead as they skid, windmill, and catch themselves low. | Gap for skid, then quick delivery. Stress FEET. |
| 0:07–0:13 | The longer it gets, the harder it pulls. And it's attached to your heels. | Low angle follows the lead's planted toe, then their heel slips another few inches. | Stress LONGER, HARDER, HEELS. End of opening preview. |
| 0:13–0:22 | You plant a toe and shove toward the light. Even half a step makes the shadow shorter. | Lead leans forward and shuffles left. Brief overhead insert tracks the same feet and the receding shadow. | Shoe scrape, two footfalls. Stress LIGHT and SHORTER. |
| 0:22–0:33 | So you take another step. And another. Right under the lamp, there's barely any shadow left to pull you. | Second and third strides. Bent knees and back gradually straighten. Under the lamp, the lead loosens their fists. | Let the short sentences breathe. Stress BARELY. |
| 0:33–0:39 | For a second, you can stand up straight. Then you hear a car. | Hold on the lead's relieved face. Dim parked car becomes readable at the edge of the frame. | Pace drops, then engine turns over. Stress STRAIGHT and CAR. |
| 0:39–0:46 | Two headlights. Two long shadows. Both pulling on the same pair of shoes. | Both beams strike. Two shadows unfurl. Return to the opening framing for the final skid and seated landing. | Two clipped phrases, gap before the yank, dry final line. Stress TWO and SAME. |

## Assets and render

- Original layered canvas artwork and synthesized sound effects. Textured navy street scene, amber lamp, cool headlights, and the recurring pilot lead in street clothes.
- Local Edge, Node.js, FFmpeg, and Chatterbox Nano. Chatterbox Nano is MIT licensed. [Model card](https://huggingface.co/ResembleAI/chatterbox-nano)
- Use the approved local reference WAV documented in the [lava pilot plan](../lava-pool/plan.md).
- Opening audition compares a measured read and a quick read. The opening audio selected for the preview will also be used in the full cut.

## Review and delivery

- [ ] Audition both opening readings and choose the take.
- [ ] Review the opening on mute at phone size and with sound.
- [ ] Follow the character's changing posture and marks across each cut.
- [ ] Verify final dimensions, duration, audio, and caption placement.

**Opening preview path and review notes:** Pending.  
**Verified export path:** Pending.  
**Review notes:** Pending.

## OpenToonz motion test

- A 3.5-second comparison uses the existing opening from 0:02.5 to 0:06.0. The test keeps the street art, camera, captions, and measured narration mix. The original character art supplies the torso and expressions.
- In the new movement, one foot plants before the pull, the other skids, the hips drop, and the far arm reacts before the near arm. The feet use fixed targets in street coordinates during holds. ToonzScript positions the cutout layers with two-joint inverse kinematics and renders 84 transparent PNG frames for the browser compositor.
- OpenToonz 1.8.0 runs locally on Windows. The installer matched the SHA-256 from the official release. The main software uses the Modified BSD license. All cutout artwork is original to this episode. [Release](https://github.com/opentoonz/opentoonz/releases/tag/v1.8.0) · [License](https://github.com/opentoonz/opentoonz/blob/v1.8.0/LICENSE.txt)
- The user approved this motion test as the reference for future shorts. From the project folder, run `node episodes/weighted-shadow/render.mjs --motion-test`. The command uses the audio from `exports/shadow-opening-measured.mp4` and calls the [shared OpenToonz renderer](../../tools/opentoonz/README.md). Edit the pose and contact timing in [shadow-yank.toonzscript](shadow-yank.toonzscript).
- Reviewed contact, skid, crouch, and recovery frames at 270 pixels wide. The final files each contain 84 frames at 24 fps with AAC audio. The [vertical test](exports/shadow-yank-opentoonz.mp4) is 1080 × 1920. The [side-by-side comparison](exports/shadow-yank-comparison.mp4) has the original on the left and the new motion on the right.
