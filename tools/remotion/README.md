# Remotion editing

Use the [official Remotion Best Practices skill](https://github.com/remotion-dev/skills/tree/main/skills/remotion-best-practices) when building or revising an edit. This project uses the local Remotion free license for eligible individual and small-team use. The timeline uses existing local captions and audio. [License FAQ](https://www.remotion.dev/docs/license/faq)

Restore the pinned editor packages with `npm ci --prefix tools/remotion` when setting up a new checkout. Commands below run from the project root.

1. Finish the character performance in [OpenToonz](../opentoonz/README.md) and composite picture in the browser. Render a caption-free 1080 × 1920, 24 fps master to `episodes/<slug>/assets/remotion-picture.mp4`. The master can carry the FFmpeg audio mix, or the manifest can name a separate local audio file.
2. Add `episodes/<slug>/remotion-edit.json`. Give the edit a `duration` in seconds, a local `captionsFile` with the episode's existing `start`, `end`, `text`, and `emphasis` cues, and a `shots` array with a `name` and `start` time in seconds for each shot. A shot can set `sourceStart` to take picture from a different point. `topCaptionsFrom` moves captions above action in the lower part of the frame. The optional `picture` and `audio` fields name files relative to the episode's assets folder.
3. Open Studio to review the cuts, cue timing, and safe area. Edit the manifest to change shot timing and the caption JSON to change cue timing, wording, or emphasis. Rerender the picture master when changing the performance or camera inside a shot.

```powershell
node tools/remotion/edit.mjs episode-slug --studio
node tools/remotion/edit.mjs episode-slug
```

The export command writes `episodes/<slug>/exports/<slug>-remotion-revision.mp4`. Verify picture, caption timing, and audio at phone size, then record the verified path in the episode plan.
