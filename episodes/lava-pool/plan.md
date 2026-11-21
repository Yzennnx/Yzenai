# What if you jumped into a pool of lava?

**Status:** User approved.  
**Premise:** An adult diver jumps feet-first from a fictional diving board into a pool of fresh, Kīlauea-like lava.  
**Runtime:** 55 seconds. The first 15 seconds carry the approved opening through the start of the skin cutaway.  
**Opening hook:** A close-up shows the diver's heel lifting as the board flexes. Cut wide for the feet-first jump and keep the board, diver, and lava surface in view through contact.  
**Ending payoff:** Explain how extensive burns can affect the whole body even after contact ends. Return to the empty diving board for the final line.  
**Narrator and tone:** User-approved local Chatterbox Nano voice with a half-semitone pitch lift. Retain the accepted opening audio for the full render. Start with curious urgency, leave a short gap for impact, and settle into the first injury explanation.

## Reference and redesign

Reference reviewed from `E:\Games\High on life\22ea5f2c-6223-4c1e-95b1-adfb3c28bd14.mp4`. In the first 12 seconds, the clip shifts between face close-ups, wider room views, and a cyan-and-orange inset. The character’s brows and mouth change with the delivery. Around 13–19 seconds, the camera follows a quantity as it grows across the room. Around 19–25 seconds, a globe and hourglass turn the quantity into something the viewer can see. Apply the same staging principles to the original diver, lava chamber, and anatomy cutaways.

The first lava preview uses nearly the same framing before and after the jump. After the splash, the diver holds a similar pose through most of the temperature line. Your feedback sets the performance target for the new read. Pitch estimates from the clips’ mixed audio give a secondary cue: the reference sits higher, while the pilot clusters toward its lower register. Judge the new take by audible changes in emphasis and pace against the picture.

| Target time | Framing and action | Performance and sound |
| --- | --- | --- |
| 0:00–0:02.5 | Start tight on the heel and flexing board. Cut to the diver glancing down, with rising orange light on the face and a tightening grip. | Deliver the question as one quick thought, leaning into **JUMP INTO LAVA**. Set a short board creak under the glance. |
| 0:02.5–0:04.5 | Cut to the side view. Crouch, release the board, and show the diver's feet clearing the edge and reaching the lava in one continuous shot. Animate the board rebounding behind the diver. | Leave a gap at contact for the snap and a short, dense hit. |
| 0:04.2–0:07.3 | Keep contact readable as a hot rim wraps the lower legs. Push in as the shoulders recoil and the arms pull inward. Show nearby crust shifting and the glow catching the face. | Land **MOLTEN ROCK** just after the hit. Let the hiss decay under the narration. |
| 0:07.3–0:15 | Cut tighter on the point of contact. Reveal **>1,100°C** on the spoken number, then match the orange flash into a skin cross-section. Show the affected surface first and begin the deeper reveal on the next spoken beat. | Slow the temperature phrase and stress **ELEVEN HUNDRED**. Drop to a more focused tone for the first injury. |

The revised render uses the [quick Piper read](assets/opening-voice-quick.wav) for its faster hook and shorter break inside the impact line. The [measured read](assets/opening-voice-measured.wav) gives the hook more space and separates **MOLTEN ROCK** with a longer pause. Both use phrase-level pace and pitch changes and the same voice. Captions follow the start and end of each rendered phrase.

### Reference voice revision

Use the supplied clip's narrator as the voice reference for new readings of the lava script. The prompt is a local mono extract from 7.7–18.2 seconds of the reference. Chatterbox Nano generates whole sentences on the CPU and FFmpeg lifts pitch by half a semitone, with timing adjusted to fit the existing shots. The source clip stays on this computer. Chatterbox Nano's model card lists MIT. [Model and license](https://huggingface.co/ResembleAI/chatterbox-nano)

For voice regeneration, the installed CPU environment is `%LOCALAPPDATA%\AIShortVideos\chatterbox\Scripts\python.exe`, with the model in `chatterbox\nano\` and the extracted prompt in `chatterbox\voice-reference.wav`, relative to the tools folder. It uses the Chatterbox source at commit `ab55923`, PyTorch 2.6 CPU, and Setuptools 80.9 for the built-in PerTh watermarker. Run that Python with `episodes/lava-pool/generate-reference-voice.py`. The generator estimates caption timings. For this take, the saved caption cues were adjusted to word timestamps from a local transcription. To render from the saved narration and cues, run `node episodes/lava-pool/render-preview.mjs --reference-voice` from the project root.

## Story and sources

- Fresh Kīlauea lava provides the example temperature. The pool and board are fictional. The diver's lower legs enter the surface in this imagined shot. Actual immersion would depend on the impact and the lava’s density and viscosity. [USGS on Hawaiian lava temperatures](https://www.usgs.gov/faqs/how-hot-a-hawaiian-volcano) · [USGS study on lava lake density](https://www.usgs.gov/publications/continuous-gravity-measurements-reveal-a-low-density-lava-lake-kilauea-volcano-hawaii) · [USGS eruption guide](https://pubs.usgs.gov/gip/117/gip117.pdf)
- The body effects are an inference from established burn physiology. Direct contact causes severe thermal injury. A full-thickness burn destroys the outer and inner layers of skin, and deeper burns can damage tissue underneath. [American Burn Association referral guidelines](https://www.ameriburn.org/burn-care-team/resources/guidelines-for-burn-patient-referral)
- Inhaled heat or smoke from burning material can injure the upper airway. Extensive burns can also cause fluid to leak from blood vessels, lowering circulation and leading to burn shock. Present shock as a complication that can develop after the injury. [Vanderbilt burn center inhalation injury protocol](https://www.vumc.org/burn/sites/default/files/public_files/Protocols/Adult%20Inhalation%20Injury%20-%20August%202024.pdf) · [American Burn Association burn care guidelines](https://ameriburn.org/wp-content/uploads/2020/04/1.-guidelines-for-austere-conditions-introduction-to-burn-disaster-airway-and-ventilator-2.pdf)

## Script and shots

Times follow the final narration. The continuation was tightened from 58 to 55 seconds to reduce pauses between injury beats.

The review cut left the diver offscreen for most of the aftermath. Stage the revised cut around visible injury and reaction. Show the first scorching as the feet contact lava, then show flames, smoke, and char climbing from the contact area. Cut briefly to each internal mechanism after its visible cue and return to the same character with damage carried forward. Use the saved full narration and captions.

| Time | Narration | Visual and motion | Sound and caption emphasis |
| --- | --- | --- | --- |
| 0:00–0:11.9 | What happens to your body if you jump into lava? Your feet hit molten rock. Fresh lava at Kīlauea can be hotter than eleven hundred degrees Celsius. | Use heel and face inserts, a continuous side-view jump and impact, and a contact push-in. Reveal the temperature on the spoken number. | Board creak, snap, impact, and hiss. Highlight **MOLTEN ROCK** and the spoken temperature. |
| 0:11.9–0:22.2 | On contact, your skin starts taking damage. A deep burn can destroy the entire thickness of your skin and reach the tissue underneath. | Show the diver recoil as trouser cuffs and jacket darken and ignite. Intercut the skin section as damage reaches deeper layers, then return to the burned clothing and smoke. | Low rumble under **DAMAGE** and **DEEP BURN**. |
| 0:22.2–0:33.7 | If you breathe in very hot air or smoke from burning material, your throat can be injured too. As it swells, it gets harder to breathe. | Follow smoke toward the face. Show the diver coughing, reaching for the throat, and struggling for air. Briefly show the airway narrowing, then return to shallow breaths. | Fade a breath under the voice. Highlight **HARDER** and **BREATHE**. |
| 0:33.7–0:47.7 | Even if you were pulled out, extensive burns could make fluid leak from your blood vessels. Your blood pressure can fall, leaving your organs with too little oxygen. That’s burn shock. | Show the hypothetical rescue on the ledge. Intercut fluid leaving the vessel and weaker circulation as the burned diver loses strength and slumps. | Run a faint pulse under the narration. Highlight **BURN SHOCK**. |
| 0:47.7–0:55 | The lava would do its damage on contact. What makes the jump so deadly is how far that damage can spread. | Return to the empty board above the pool and slowly pull back. | End on the board’s last creak. Highlight **CONTACT** and **SPREAD**. |

## Assets and render

- Build an original angular cutout diver with separate brows, eyelids, mouth, hands, arms, and torso. Draw a heel lift, crouch, launch, feet-first descent, and recoil. Use charcoal tiles and orange lava, with a tighter orange rim at contact and cooler shadows around the anatomy cutaways.
- Animate the diver, board, pool, and glow as separate layers. Track scorched fabric, smoke, the hand moving to the throat, and the slumped posture across shots. The injury treatment uses stylized flames and surface marks. Intercut the skin, airway, and circulation diagrams at their spoken cues. Set captions in short white phrases with yellow emphasis.
- Local Piper `en_US-joe-medium` voice. The installed model card lists CC0 for the training dataset and base model. The canvas artwork and synthesized effects are original. The supplied reference clip was used for review. [Piper model card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/joe/medium/MODEL_CARD)
- The full render reads `assets/episode-voice.wav` and `assets/episode-voice.json`. Run `node episodes/lava-pool/render-preview.mjs --full` from the project root to render the character revision. The animation is in `preview.html` and `episode-scenes.js`. Run the Chatterbox Python with `episodes/lava-pool/generate-reference-voice.py --full` to regenerate the continuation and initial caption cues. The regeneration copies the approved first 15 seconds.

## Review and delivery

- [x] Record the approved reference voice and preserve the chosen opening take.
- [x] Review the opening through the first injury reveal at phone size. The viewer approved the reference-voice preview's narration.
- [x] Opening communicates the premise and the ending pays it off.
- [x] Final export decodes at 1080 × 1920 and runs 55 seconds.
- [x] Check the final mix for clipping and compare caption cues against local transcription.
- [x] Spot-check captions at phone size with room below for player controls.
- [x] Spot-check the diver's injury and reaction at phone size with captions out of frame. Scorch marks and altered posture carry across the anatomy cutaways.
- [ ] Review the final mix by ear for narration delivery and effects balance.

**First preview export:** [lava-opening-preview.mp4](exports/lava-opening-preview.mp4)  
**Verified revised preview export:** [lava-opening-revised.mp4](exports/lava-opening-revised.mp4)  
**Approved reference voice preview:** [lava-opening-reference-voice.mp4](exports/lava-opening-reference-voice.mp4) · [Voice-only WAV](assets/opening-voice-reference.wav). The user approved this voice for upcoming episodes.  
**Previous full review cut:** [lava-pool.mp4](exports/lava-pool.mp4)  
**Approved character revision:** [lava-pool-character-revision.mp4](exports/lava-pool-character-revision.mp4)  
**Review notes:** The revision decodes end to end at 55 seconds, 1080 × 1920, 24 fps, with H.264 video and AAC audio. It uses the prior narration and caption timing. Phone-size frame sequences show flames and darkening clothing, coughing and a hand at the throat, and a progressively deeper slump after the conditional rescue. The spotted reactions remain visible with captions out of frame. The sound mix adds a low fire crackle. A sound-on listening pass for effects balance remains for review.

## Remotion revision

- Hold the diver on the board through the crouch and finish the push-off in a shorter flight. Offset the legs in the air, stagger the arm swings, and compress the body at contact. Move the board snap with the release and retain the impact around 0:04.2.
- Keep this episode's approved narration and caption cues, the on-character consequences, and the empty-board callback. Use the existing Canvas diver for the revised poses.
- From the project root, run `node episodes/lava-pool/render-preview.mjs --full --edit-source` to generate the clean picture and mix. Run `node tools/remotion/edit.mjs lava-pool --studio` to review the [edit](remotion-edit.json) or omit `--studio` to export. [Remotion workflow and license](../../tools/remotion/README.md)
- Fully decoded the [55-second Remotion revision](exports/lava-pool-remotion-revision.mp4) at 1080 × 1920, 24 fps, with H.264 and AAC. Compared the push-off, flight, contact, and recoil against the prior cut at phone size. Checked caption placement at the skin and circulation diagrams and the empty-board callback. The audio matches the revised local mix, with a decoded peak of −0.7 dBFS.
