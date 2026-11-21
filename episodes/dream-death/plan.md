# What happens when you die in your dream?

**Original production reference:** [Lava pilot](../lava-pool/exports/lava-pool-character-revision.mp4)  
**Status:** Revision delivered. The [cardiac arrest cut](exports/dream-death-cardiac-revision.mp4) is the current export.

## Cardiac arrest during sleep

**Title:** What if your heart stopped while you were dreaming?  
**Runtime:** 60 seconds. Every camera angle is third person, including detail shots.  
**Opening:** A wide rooftop shot shows the lead's grip give way. Cut from their open hand in the dream to the same hand lying slack beside the bed. The audience sees the real emergency by about 0:08.  
**Ending:** Later in the hospital, the lead squeezes their partner's hand. Return to the opening close-up of their fingers. The first time, they go slack. This time, they close with purpose.

### Story and sources

The rooftop fall is the character's nightmare. At the same time, a dangerous heart rhythm causes cardiac arrest while they sleep. Later evaluation identifies Brugada syndrome in this character. Brugada syndrome is rare and can cause dangerous rhythms during sleep. The edit makes the two events feel simultaneous. The medical explanation attributes the arrest to the rhythm, and the story treats the dream as a dramatic parallel. [MedlinePlus Genetics](https://medlineplus.gov/genetics/condition/brugada-syndrome/)

The bed partner sees irregular gasps followed by a lack of response, calls emergency services and starts CPR. Paramedics recognize a shockable rhythm and defibrillate. The narrative jumps forward to recovery in hospital. [American Heart Association adult basic life support guidelines](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support/) · [American Heart Association cardiac arrest treatment](https://www.heart.org/en/health-topics/cardiac-arrest/emergency-treatment-of-cardiac-arrest)

### Script and shots

| Time | Narration | Third-person action and sound |
| --- | --- | --- |
| 0:00–0:06 | “What if your heart stopped while you were dreaming? In the dream, you're falling.” | Side wide on the roof. One hand peels away and the shoulder drops before the second hand releases. Cut to a wider fall, then from the open hand to the hand beside the bed. Wind cuts to room tone. |
| 0:06–0:14 | “In the bedroom, your partner hears a gasp. They say your name and shake your shoulder. You don't respond.” | Start overhead to establish both people. Then cut close from the bedside as the lead gives a short, uneven gasp and the partner tries to wake them. The fingers stay slack. |
| 0:14–0:23 | “Your heart's electrical rhythm has gone haywire. It's stopped pumping blood effectively. Those gasps aren't normal breathing.” | Brief cutaway shows the lower chambers lose their coordinated squeeze. Return to the same bedside angle and the lead's unchanged posture. |
| 0:23–0:36 | “Your partner calls emergency services, puts the phone on speaker, and starts CPR. They're trying to keep blood moving until help arrives.” | Phone screen beside the bed, then a floor-level wide with the lead on their back and the partner performing CPR. Carry the dispatcher audio across the edit. |
| 0:36–0:47 | “The paramedics find a rhythm they can shock. For a moment, everyone backs away. Then they go right back to work.” | Red light crosses the wall. Show pads applied, hands clearing, and the team promptly resuming CPR. One beep breaks the room tone. Hold the lead in frame. |
| 0:47–1:00 | “You survive. Later, doctors find a rare condition called Brugada syndrome. It can trigger a dangerous heart rhythm during sleep. That night, your partner heard you gasp.” | Dissolve to a hospital two-shot later in recovery. Match the opening hand detail as the awake lead squeezes their partner's hand. |

### Character and motion redesign

- Keep the recognizable face and jacket in the dream. Give the adult lead a proportioned torso, a distinct pelvis, and separately articulated shoulders, elbows, wrists, hips, knees, and ankles. Use a sleep shirt in the bedroom and establish the same face and hand in both settings.
- Draw turnaround and pose studies first. For the fall, lock the supporting hand to the ledge, let the shoulder take the load, swing the hips underneath, and release the fingers one at a time. Keep limb lengths consistent through the cut.
- For the bedroom, animate breathing through the ribs and blanket. On the shoulder shake, let the head and loose arm follow with a slight delay. Keep the mattress and floor contacts fixed. For the rescue, animate the partner's movement from the shoulders and torso and keep their hands planted in the CPR shot.
- Reuse local Canvas, Edge, Node.js, FFmpeg, and the approved local narrator. Build the body with tapered segments of fixed limb lengths. The rooftop keeps the support wrist anchored until release. The bedside shot uses a delayed wrist and head reaction to the shoulder shake. A phone-size review led to a tighter bedside angle that makes the two faces and the shoulder contact easier to see.

### Revision assets and render

- [Measured opening preview](exports/dream-death-cardiac-opening-measured.mp4) and [opening pose reference](assets/cardiac-pose-reference.png). Auditioned both local reads with word timestamps and kept the measured take for the full cut.
- Original Canvas art and synthesized effects. The wind gives way to the bedroom room tone, then irregular gasps. The call carries a filtered dispatcher line into the rescue. The recovery scene uses a quieter pulse and room tone. Narration and dialogue use the existing local Chatterbox Nano model with its MIT license and the pilot's reference WAV. [Chatterbox Nano](https://huggingface.co/ResembleAI/chatterbox-nano)
- Run `node episodes/dream-death/render.mjs --cardiac --full` from the project root. Omit `--full` to render the 14-second opening. The local Chatterbox Python can run `generate-voice.py --cardiac` for both opening auditions and `generate-voice.py --cardiac measured` for the full read and dispatcher. Run `sound.py --cardiac --opening` for preview effects or `sound.py --cardiac` for the full mix. The saved caption JSON contains calibrated phrase timings and the dispatcher line.

### Revision review and delivery

- [x] Reviewed the rooftop grip and bedside reaction in sampled frames at phone size. The support hand stays at the ledge before release, and the lead's arm and head follow the shoulder shake with delayed motion.
- [x] Reviewed both rescue angles and the closing hand squeeze. Moved the heart diagram label clear of the burned-in captions before the final render.
- [x] Verified 38 caption cues, sample-for-sample reuse of the measured opening in the narration, and transcription of the final narration and dispatcher. The decoded mix peaks at −0.79 dBFS.
- [x] Fully decoded the [60-second revision](exports/dream-death-cardiac-revision.mp4) and verified 1080 × 1920, 24 fps, H.264 video and 48 kHz stereo AAC. Visual review used sampled frames, and audio review used local transcription and level measurements.

## Delivered original cut

**Premise:** The lead dies in a dream and follows their alarm into their bedroom, where they watch something else wake up in their body.  
**Runtime:** 60 seconds with 133 scripted words.  
**Opening hook:** “What happens when you die in your dream?”  
**Main event on screen and when it happens:** First-person grip gives way before 0:03. Cut outside the body for the fall and to black on impact around 0:04.  
**Ending payoff:** The double says “Let go,” sends the lead back to the rooftop, and peels the last finger loose. The same alarm rings again.  
**Narrator and tone:** Approved local Chatterbox Nano CPU narrator and pilot WAV with the half-semitone lift. Conversational discovery, a low deliberate final line, and room for the cut to black.

## Story and sources

The episode uses dream logic. The person who died can see and hear the waking world through a door, but ordinary people pass through them. The double can see and touch the lead. Its grip returns the lead to the last moment of the dream. The alarm is the first bridge to the bedroom and the last thing the lead hears before the sequence starts again.

## Script and shots

| Time | Narration | Visual and motion | Sound and emphasis |
| --- | --- | --- | --- |
| 0:00–0:04 | What happens when you die in your dream? | First person. Both bare hands grip a rooftop edge. One slips. Cut wide to the lead falling past lit windows, then to black on impact. | Stress DIE and DREAM. Wind rises after the question. One heavy impact and a short silence. |
| 0:04–0:08 | You open your eyes on the pavement. Then you hear your alarm. | First person. A blink opens on wet pavement. The eye line rises to a freestanding bedroom door under an amber streetlight. | A familiar alarm with a muffled, uneven echo. Stress ALARM. |
| 0:08–0:13 | Same room. Same bed. So who just turned it off? | First-person push on the door gives way to a side view showing the lead and the double together as the double sits up. End opening preview here. | The alarm stops a beat before the face turns. |
| 0:13–0:23 | You follow yourself into the hall. Someone comes toward you. You call out, and they walk right through you. Then they say good morning. | Third person. Lead steps in front of a person with a mug. The person crosses through the lead, whose body flickers, then greets the double. | Heel taps pass through the lead’s position. Drop the low room tone briefly on contact. Stress THROUGH. |
| 0:23–0:34 | In the bathroom, you put both hands on the sink. In the mirror there’s only one face. Then its eyes move. It’s looking right at you. | First person. The lead grips the sink in the foreground. The double is visible at the side and in the mirror. The other half of the glass shows an empty doorway. The double’s reflected eyes move first. | Uneven drips and a faint sustained tone. Leave a short gap before EYES. |
| 0:34–0:45 | You get between it and the front door. It grabs your wrist. You can feel every finger. Then it leans in and whispers. Let go. | Third person for the block and catch, then first person looking down at the grip and up at the double’s face. | Dry sleeve scrape, then near-silence around LET GO. |
| 0:45–1:00 | Now you’re hanging from the same ledge. You look up. It’s there. It lifts one finger, then another. And just before you hit, you hear your alarm again. | Match cut from the wrist to the ledge. Side view shows the double crouched above you. Back in first person, its hand pulls your last fingers loose. The image falls away, then black and the alarm. | Wind returns in stages. Let the final alarm ring into black. |

## Assets and render

- Original textured Canvas art in the series palette with moonlit blues, amber practicals and a muted red clock. Build a lead and double pose reference using the rooftop grip, fall, bedroom turn, hallway pass-through, and wrist grab.
- Use the approved local Chatterbox Nano CPU narrator and pilot reference. Compare a measured opening with a quicker one through 0:13 and carry the selected take into the full cut. [Chatterbox Nano, MIT](https://huggingface.co/ResembleAI/chatterbox-nano)
- Use locally synthesized wind, concrete impact, three-tone alarm, footsteps, drips, cloth, and low strained tones. The alarm travels across stereo around a centered narration. The room tone recedes for “Let go,” delivered quietly with a short reflection. Original art and effects, with system Arial captions.
- Local Edge, Node.js, FFmpeg and the existing voice environment. Render entry point is `node episodes/dream-death/render.mjs` for the opening or `node episodes/dream-death/render.mjs --full` for the full episode. The existing Chatterbox Python can run `generate-voice.py` with no argument to audition both openings or with `measured` to generate the full read. Run `sound.py --opening` and `sound.py` for the original effects. The saved caption JSON contains reviewed timings.

## Review and delivery

- [x] Compared the two readings using local word timestamps and selected the measured read. Reviewed the opening at phone size, then added a bedside close-up so the alarm cutoff and face reveal have separate shots.
- [x] Reviewed the hallway pass-through, mirror absence, wrist grab, and return to the opening ledge in phone-size frames. In the final pass, the bathroom camera moves closer, the wrist grab enters from the opposite side, and the rooftop side view keeps the hanging lead in frame.
- [x] Aligned 42 caption cues to the measured and full narration. Verified the first 13 seconds of voice were reused sample for sample.
- [x] Verified 60 seconds, 1080 × 1920 at 24 fps, H.264 video, 48 kHz stereo AAC, and full-file decoding. Audio review used local transcription and measured levels. The breath before “Let go” is silent, and the decoded mix peaks at −0.66 dBFS.

**Opening preview path and review notes:** [13-second measured opening](exports/dream-death-opening-measured.mp4) and [opening pose reference](assets/opening-reference.png). The hand release, outside view of the fall, door, and double are legible at phone size.  
**Verified export path:** [Dream death, 60-second MP4](exports/dream-death.mp4).  
**Review notes:** The first fall cuts to black around 0:04. The bedside alarm stops around 0:10, before the double finishes sitting up. The final alarm returns around 0:59 and continues over black.
