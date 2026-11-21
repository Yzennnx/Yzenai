import React from 'react';
import { AbsoluteFill, Composition, OffthreadVideo, registerRoot, Sequence, staticFile, Track,
  useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';

const FPS = 24;
const toFrame = (seconds, fps) => Math.ceil(seconds * fps - 1e-9);

function Captions({ pages, topFrom, top, widescreen }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const time = frame / fps;
  const page = pages.find(({ start, end }) => start <= time && time < end);
  if (!page) return null;

  const boxWidth = widescreen ? Math.round(width * 0.78) : 850;
  const left = Math.round((width - boxWidth) / 2);
  const pos = widescreen
    ? { bottom: 68 }
    : (time >= topFrom ? { top } : { bottom: 345 });

  return (
    <div style={{
      position: 'absolute', left, width: boxWidth, ...pos,
      textAlign: 'center', fontFamily: 'Arial, sans-serif', fontWeight: 900,
      fontSize: widescreen ? 54 : 68, lineHeight: 1.12, color: '#fff7e5',
      WebkitTextStroke: widescreen ? '9px #101615' : '11px #101615', paintOrder: 'stroke fill',
    }}>
      {page.text.split(' ').map((word, index) => (
        <React.Fragment key={index}>
          {index > 0 ? ' ' : ''}
          <span style={{ color: page.emphasis.includes(word.replace(/[^\p{L}\p{N}]/gu, '')) ? '#ffd44d' : undefined }}>
            {word}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function Episode({ duration, shots, picture, audio, captions, topCaptionsFrom, topCaptionOffset = 298 }) {
  const { fps, width, height } = useVideoConfig();
  const widescreen = width > height;
  return (
    <AbsoluteFill style={{ backgroundColor: '#101615' }}>
      <Track name="Picture">
        {shots.map(({ start, name, sourceStart = start }, index) => {
          const from = toFrame(start, fps);
          const end = toFrame(shots[index + 1]?.start ?? duration, fps);
          return (
            <Sequence key={name} name={name} from={from} durationInFrames={end - from}>
              <OffthreadVideo src={staticFile(picture)} trimBefore={toFrame(sourceStart, fps)} muted showInTimeline={false}
                style={{ width: '100%', height: '100%' }} />
            </Sequence>
          );
        })}
      </Track>
      <Audio name="Narration and effects" src={staticFile(audio ?? picture)} />
      <Captions pages={captions} topFrom={topCaptionsFrom ?? Infinity} top={topCaptionOffset} widescreen={widescreen} />
    </AbsoluteFill>
  );
}

function Root() {
  return <Composition id="Episode" component={Episode} width={1080} height={1920} fps={FPS}
    durationInFrames={FPS}
    defaultProps={{ duration: 1, shots: [], picture: 'remotion-picture.mp4', captions: [] }}
    calculateMetadata={async ({ props }) => {
      const dims = {
        width: props.width ?? 1080,
        height: props.height ?? 1920,
        durationInFrames: toFrame(props.duration, FPS),
      };
      if (!props.captionsFile) return dims;
      const response = await fetch(staticFile(props.captionsFile));
      if (!response.ok) throw new Error(`Could not load ${props.captionsFile}`);
      return {
        ...dims,
        props: { ...props, captions: await response.json() },
      };
    }} />;
}

registerRoot(Root);
