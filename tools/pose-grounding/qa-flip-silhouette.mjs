#!/usr/bin/env node
/**
 * draw-and-paint-art Visual Anatomy QA Sheet Generator.
 *
 * Given one or more rendered still PNGs, creates a 3-panel contact sheet per still:
 *   [ Original ] | [ Horizontally Flipped (catches lean/proportion errors) ] | [ Pure High-Contrast Silhouette ]
 *
 * Usage:
 *   node tools/pose-grounding/qa-flip-silhouette.mjs path/to/still1.png [still2.png ...]
 */

import { spawnSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node tools/pose-grounding/qa-flip-silhouette.mjs <still.png> [...]');
  process.exit(1);
}

for (const file of files) {
  const out = join(dirname(file), `qa-${basename(file)}`);
  const filter = [
    '[0:v]scale=640:360,split=3[orig][f1][s1]',
    '[f1]hflip[flipped]',
    '[s1]format=gray,eq=contrast=3.2:brightness=-0.12,format=rgb24[sil]',
    '[orig][flipped][sil]hstack=inputs=3[out]',
  ].join(';');
  const res = spawnSync('ffmpeg', [
    '-hide_banner', '-v', 'error', '-y',
    '-i', file, '-filter_complex', filter, '-map', '[out]', out,
  ], { stdio: 'inherit' });
  if (res.status !== 0) {
    console.error(`Failed QA sheet for ${file}`);
    process.exit(res.status ?? 1);
  }
  console.log(`Wrote QA anatomy sheet: ${out}`);
}
