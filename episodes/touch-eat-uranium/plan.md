# What if you touched and ate uranium?

**Creative reference** — [Nightmare Roulette camera, pacing, and voice guide](../../references/long-form-camera-voice/README.md). Use its prop-level point of view and return to the lead for visible reactions.

**Status** — Full export verified.

**Premise** — The lead briefly touches a crumb from a specimen containing natural uranium with intact skin, then swallows it. The crumb's composition and amount are unspecified. The story follows what could happen to absorbed uranium and leaves the severity of the lead's exposure open.

**Format and runtime** — 60-second vertical short at 9:16. 24 fps.

**Opening hook** — “What if you touched uranium… and then swallowed it?”

**Main event on screen** — Fingertip contact at 0:03. The lead pinches the crumb, brings it to their lips, and visibly swallows at about 0:10.

**Ending payoff** — The same fingers that picked up the crumb now cup a urine sample under a clinic lamp. A kidney test can check for harm even while the lead looks unchanged.

**Narrator and tone** — Approved local series narrator. The 146-word read uses short conversational questions and leaves room for the swallow. The measured opening take carries into the full edit. Both opening takes were checked with local transcription. The measured read matched the script more closely.

## Story and sources

- **Touch.** A brief touch through intact skin has a different exposure pathway from swallowing. Skin blocks uranium's alpha particles, and absorption through skin is generally very small and depends on the material. No immediate mark or skin reaction is depicted for this specific encounter. [EPA facts about uranium](https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1012FFH.TXT) · [ATSDR public health statement](https://wwwn.cdc.gov/TSP/PHS/PHS.aspx?phsid=438&toxid=77)
- **Swallow.** Most ingested uranium passes through the gut. The amount that enters the blood varies by chemical form and solubility. Use a branched diagram showing the main route through the gut and a smaller branch into blood, without assigning a percentage to the fictional crumb. [ATSDR public health statement](https://wwwn.cdc.gov/TSP/PHS/PHS.aspx?phsid=438&toxid=77)
- **Kidneys.** Absorbed natural uranium can harm the kidneys through its chemical toxicity. The kidney cutaway depicts a possible effect at sufficient absorbed exposure. The subsequent urine sample represents clinical assessment, with no test result or fixed injury timeline shown. [ATSDR biological fate](https://archive.cdc.gov/www_atsdr_cdc_gov/csem/uranium/biological_fate.html) · [ATSDR clinical assessment](https://archive.cdc.gov/www_atsdr_cdc_gov/csem/uranium/clinical_assessment.html)

## Script and shots

The specimen tray stays screen right on a worktable. The lead leans in to look down and right at the tray, with their left hand resting lightly at the near edge. The cream-cuffed right hand carries the crumb from tray to mouth. Keep the tray from moving across the POV cut.

The exact conversational read and timings are recorded in the [narration generator](generate-voice.py) and the [aligned captions](assets/episode-voice.json).

| Time | Narration beats | Viewpoint and action | Sound and emphasis |
| --- | --- | --- | --- |
| 0:00–0:05 | “What if you **touched uranium**… and then swallowed it?” | Start on the dull gray crumb. In POV, the right index touches it at 0:03. The left hand rests on the table edge at the bottom of frame. | Room tone, tiny click on contact. |
| 0:05–0:12 | “Your skin blocks the alpha particles.” Pause for the swallow. | Match the right cuff and grip into a three-quarter close-up. Thumb and index lift the crumb. Cut at the lips. Show the fingers returning empty and the throat moving at 0:10. | Cut the room tone under the swallow. |
| 0:12–0:22 | “Now it’s inside. Most of the uranium you swallow passes through the gut.” | Hold on the lead's face as they look down. Follow the swallow into a brief gut cutaway, then return to the same posture. | Emphasize **most**. |
| 0:22–0:34 | “But some can dissolve and enter your blood. How much depends on the form it’s in.” | The lead sees the uranium label on the tray and freezes. Their left fingers curl into the table edge. Insert the gut branch into a blood vessel. Return with the eyes still on the label. | Room tone falls away. Emphasize **blood**. |
| 0:34–0:48 | “Once it reaches your kidneys, enough absorbed uranium can damage the tiny tubes that help clean your blood.” | Follow the blood to a kidney cutaway. Show one tubule in a possible-injury inset. Return as the lead straightens and reaches for their phone. | Emphasize **kidneys**. |
| 0:48–1:00 | “Later, a urine test can check for signs of kidney injury. Your hand still looks the same. The question is what happened inside.” | Match the fingers in the opening insert to the same hand cupping a lab sample. Pull back to the clinic and hold on the lead watching the sample leave frame. | Cup clicks down. Brief silence on the end frame. |

## Motion briefs

### Opening contact, pinch, and swallow

- **Viewer takeaway** — The lead leans in, touches the crumb, picks it up, and swallows it.
- **Staging and reference** — Study the [side profile](../../assets/series-lead/hands/edge.png) for finger overlap and the [ticket pinch](../../assets/series-lead/hands/ticket-pinch.png) for opposing thumb and index pads. Draw the narrower pinch and wrist angle around the crumb. Keep the same right-hand prop contact across the camera cut.
- **Contact and continuity** — Both feet stay planted. The left palm rests on the table while the lead leans in. The right index touches first at 0:03, the thumb closes before pickup at about 0:06, and the pinch releases at the mouth before the 0:10 swallow. The right hand comes away empty.
- **Pass on mute** — The left palm stays planted through the lean. The crumb moves only once the right-hand pinch closes. The empty hand and throat motion sell the swallow.

### Recognition and table release

- **Viewer takeaway** — The lead reads the label and tenses. Then they straighten to reach for their phone.
- **Staging and contact** — Study the [front noticing and alarm reactions](../../assets/series-lead/reactions-front.png) for the expression and the [bar hold](../../assets/series-lead/hands/bar-hold.png) for how curled fingers overlap an edge. Eyes find the label around 0:24. The left fingers bend around the table lip and hold through the blood cutaway. They open around 0:46 as weight returns to both feet and the right hand reaches for the phone.
- **Pass on mute** — The eyes find the label before the fingers tense. Let the left fingers straighten and clear the edge before the hand leaves the table.

### Sample callback

- **Viewer takeaway** — The same hand from the opening now holds the sample for a test.
- **Staging and contact** — Use the [palm reference](../../assets/series-lead/hands/palm.png) to build the cup grip. The right hand supports the cup until its base touches the clinic counter. Fingers open before the hand withdraws. Match the cream cuff and finger silhouettes from the first insert.
- **Pass on mute** — The cup stays with the hand until set-down. The cut back clearly establishes the clinic.

## Assets and render

- Original cutout props, gut and kidney inserts, and the shared series lead. OpenToonz (Modified BSD) renders the side rig with the episode pose tracks, and local Edge composites the custom POV hand artwork and anatomy inserts. FFmpeg mixes original synthesized sound effects. Remotion uses the project's eligible free license. The approved Chatterbox Nano CPU model is MIT licensed. The cached faster-whisper base.en model is MIT licensed and used locally for caption alignment.
- The [opening review](exports/uranium-opening-review.mp4) covers the first 16 seconds. The [silent motion reel](exports/uranium-motion-review.mp4) covers touch and lift, the swallow, phone pickup, and cup contact. After feedback on the POV hands, the right hand was redrawn with a separate index and thumb and three curled fingers behind them. The left wrist and palm were redrawn at the table edge. Reviewed frames 72, 140, and 157 for contact, pickup, and carry. The revised POV through frame 161 replaced the same frame range of the picture master before final assembly.
- The [caption timing file](assets/episode-voice.json) contains 45 cards aligned to all 146 locally transcribed words. The full edit uses white captions and yellow emphasis.
- The second POV pass used photographs to set wrist alignment, keep the resting fingers close, and show the right thumb rotating toward the index finger. The original illustrations match the camera angle and crumb size. The photos served as study material. [Resting hand](https://medium.com/bambuu/overcoming-reptitive-strain-injury-rsi-what-worked-and-what-didnt-e315e737b96a) · [Index touching a table](https://note.com/hatanohiroshi/n/ncac53f8f6b64) · [Thumb-and-index pinch](https://www.pngwing.com/id/free-png-dhrpz)
- The next pass addressed the close-up at fingertip contact. In the previous silhouette the long digit read as a raised thumb. The new dorsal silhouette follows the photographed index gesture, with three bent knuckles and a short thumb lobe on the opposite side that rotates toward the crumb. Checked the approach, contact, closure, and lift at frames 48, 72, 140, and 156. [Dorsal index-finger photo](https://www.nicepng.com/ourpic/u2e6r5t4w7y3a9a9_one-minute-touchscreen-set-up-hand-touching-screen/)
- From the project root, rebuild the picture and mix with `node episodes/touch-eat-uranium/render.mjs`. Use `node episodes/touch-eat-uranium/render.mjs --preview FIRST_FRAME FRAME_COUNT` for silent motion or `--stills FRAME ...` to check the first frame of a contact. Use `node tools/remotion/edit.mjs touch-eat-uranium --studio` for review and `node tools/remotion/edit.mjs touch-eat-uranium` for export.
- Narration was generated with `& "$env:LOCALAPPDATA/AIShortVideos/chatterbox/Scripts/python.exe" episodes/touch-eat-uranium/generate-voice.py`. Retain the verified caption timing file when reusing the same narration.

## Review and delivery

- [x] Approve the sequence.
- [x] Choose an opening read and review the opening preview.
- [x] Review the silent motion reel and final phone-size frames for contact, continuity, and caption clearance. Verify narration timing and levels.

**Verified export** — [Touch and eat uranium, hand revision](exports/touch-eat-uranium-hand-revision.mp4). 1,440 picture frames at 24 fps, 1080 × 1920 H.264, with 48 kHz AAC audio. Remotion reassembled the revised first 162 frames and FFmpeg decoded the entire new export. The original audio mix carries forward and peaks at −1.0 dBFS. Checked the fingertip contact at 0:03 and the pinch and lift at phone size.

## Social post copy

**Post caption** — What if you touched uranium… then swallowed it?

**Description** — A fingertip touch becomes a completely different exposure once the crumb is swallowed. This animated what-if follows where the uranium can go inside the body.

**Tags** — What Happens Next, uranium, uranium exposure, toxicology, kidney health, science animation

**Hashtags** — #WhatHappensNext #Uranium #Toxicology #ScienceAnimation
