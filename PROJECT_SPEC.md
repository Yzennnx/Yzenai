# Animated What If Shorts

**Working title:** What Happens Next?

## Series concept

Each episode puts the viewer inside an extreme or impossible situation, shows the event on screen, and follows what happens next. The series stays recognizable through an original recurring character, an expressive narrator with dry humor, textured cutout animation, and white captions with yellow emphasis.

The first audience is people scrolling TikTok, Instagram Reels, Facebook Reels, or YouTube Shorts. Each episode should stand on its own and be easy to follow on a phone with the sound on or off.

## Episode format

- **Creative reference.** Use the [Nightmare Roulette study](references/long-form-camera-voice/source-study.md) and [camera, pacing, and voice guide](references/long-form-camera-voice/README.md) for both formats. Stage original scenes with the series lead and narrator.
- **Runtime.** 45–90 seconds for a short. Use 3–5 minutes for the long episode format. Choose the format in the episode plan.
- **Opening.** Start directly on the scene and ask the question in the first few seconds. Show the main event early by default. When suspense calls for a later reveal, show a clear first step toward it.
- **Middle.** Show two or three consequences on the character as they unfold. Use changes in appearance and movement to let viewers follow the cause and effect. Use a brief anatomy cutaway or inset to explain a hidden mechanism, then return to the character to show its effect. Carry their condition across shots.
- **Ending.** Pay off the opening question with a surprising consequence, a clear answer, or a visual callback.
- **Viewpoint and pacing.** Use first-person views for discoveries and contact and third-person views for reactions, body motion, and spatial orientation. Give each cut a job and each pause something to look or listen for. In long episodes, time a full rough cut before detailed animation.
- **Accuracy.** For science episodes, source the claims that drive the story and state assumptions when they affect the outcome. For fictional episodes, establish the rules of the premise and follow them consistently.

Possible future premises include **What if the Moon disappeared tonight?** and **What if everyone froze for 60 seconds except you?** Check the [episode index](EPISODES.md) before developing a premise.

## Art, motion, and sound

- **Art.** Use original articulated cutout characters, textured settings, and a strong accent color. Reuse the [shared series lead](assets/series-lead/README.md) across settings, with episode-specific outfits where the story calls for them. Use the [Front / Side / Back turnaround](assets/series-lead/reference-sheet.png) (skip three-quarter views), the [cinematic anatomy angles](assets/series-lead/angles-sheet.png), the 12-emotion [front](assets/series-lead/reactions-front.png) and [side](assets/series-lead/reactions-side.png) reaction sheets, the [face angles and crash-zoom sheet](assets/series-lead/face-angles.png), and the [POV survival hands](assets/series-lead/hands/pov-survival-sheet.png) for consistent anatomy, gazes, and expressions.
- **Motion.** Use close framing for expressions and details, and wider views when the viewer needs to track movement through space. Animate anticipation, action, and reaction with distinct poses—start from the [character motion index](assets/series-lead/README.md#find-a-reference-by-action), [dynamic survival movement reel](assets/series-lead/anatomy-prototype/dynamic-movements-reel.mp4), [cinematic face & camera motion reel](assets/series-lead/anatomy-prototype/cinematic-face-camera-reel.mp4), and [zooming, POV, and motion intensification guide](references/long-form-camera-voice/README.md#zooming-looking-around-pov-and-intensifying-motion). Time lighting, particles, camera zooms, foreground parallax wipes, and environmental movement to the action that causes them. Give each explanation its own visual change, such as a layer being revealed or a diagram narrowing as the narrator describes it.
- **Voice.** Use the approved series narrator with the same local Chatterbox Nano reference and half-semitone pitch lift. Vary the performance within each episode with a curious hook, clear word stress, changes in pace at story turns, and a short pause for the main event.
- **Captions.** Burn in short, timed phrases in bold white with yellow emphasis on key words. Keep the type readable against busy shots and clear of the action and platform controls. Check line breaks and timing against the final voice track.
- **Sound.** Use ambience and effects to mark story beats. Keep speech clear in the final mix.

## Zero-cost production tools

The production budget is **$0** using the existing computer. Use tools that run locally and are free for the intended use. Production must work without subscriptions, paid credits, trials, or a billing account.

- **Artwork.** Create original character and background layers with code or Krita. ComfyUI is optional for generating stills locally if a suitable model runs on the existing machine and its license fits the intended use. Keep scenes reproducible with code-drawn layers if local generation is too slow. [Krita](https://krita.org/en/download/) · [ComfyUI](https://github.com/Comfy-Org/ComfyUI)
- **Narration.** Run the approved voice locally on the CPU using the workflow's reference WAV and Chatterbox Nano. The model card lists the MIT license. [Chatterbox Nano model card](https://huggingface.co/ResembleAI/chatterbox-nano)
- **Animation and export.** Use OpenToonz and the shared cutout rig for character action, the local browser for clean picture compositing, and FFmpeg for sound mixing and export checks. Use Remotion locally under its free license to assemble shots, sync captions and audio, and export the final MP4. The browser-and-FFmpeg workflow is the fallback. [OpenToonz workflow](tools/opentoonz/README.md) · [Remotion workflow](tools/remotion/README.md) · [FFmpeg](https://ffmpeg.org/) · [Remotion license FAQ](https://www.remotion.dev/docs/license/faq)
- **Sound and fonts.** Use original effects or free assets with terms that allow the intended social posts and future monetization. Record sources, licenses, and any required attribution in the episode plan.

## Delivery and review

Deliver a 1080 × 1920, 9:16 MP4 with H.264 video, AAC audio, and burned-in captions unless the plan specifies a different aspect ratio. Keep the episode plan and the assets and render instructions needed for revisions in its folder. Before delivery, verify the runtime, playback, narration clarity, caption sync, and readability at the intended viewing size. Each episode should make its premise clear immediately and resolve the opening question by the end.

Episode videos, shared character-motion clips, and third-party study media are local files. Links to those files in the plans and guides open from the production workspace.

Deliver ready-to-paste social post copy with each finished episode. Save the caption, description, and relevant tags with the episode plan.

Follow the [project workflow](AGENTS.md) and start each new episode plan from the [episode template](templates/episode-plan.md).
