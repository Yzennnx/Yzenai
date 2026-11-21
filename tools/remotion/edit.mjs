import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const [episode, mode] = process.argv.slice(2);
assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(episode ?? '') && (!mode || mode === '--studio'),
  'Usage: node tools/remotion/edit.mjs <episode-slug> [--studio]');

const tool = import.meta.dirname;
const folder = resolve(tool, '../../episodes', episode);
const assets = join(folder, 'assets');
const manifest = join(folder, 'remotion-edit.json');
const { duration, shots, picture = 'remotion-picture.mp4', audio, captionsFile } = JSON.parse(await readFile(manifest, 'utf8'));
assert(Number.isFinite(duration) && duration > 0 && shots?.[0]?.start === 0 &&
  shots.every(({ start }, index) => Number.isFinite(start) && start < duration && (index === 0 || start > shots[index - 1].start)),
  'Shot starts must increase from zero and fall within the episode');
for (const file of [picture, audio, captionsFile].filter(Boolean)) await access(join(assets, file));

const studio = mode === '--studio';
const output = join(folder, 'exports', `${episode}-remotion-revision.mp4`);
const cli = join(tool, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
await access(cli).catch(() => { throw new Error('Install the local editor with npm ci --prefix tools/remotion'); });
if (!studio) await mkdir(join(folder, 'exports'), { recursive: true });
const args = [
  cli, studio ? 'studio' : 'render', 'timeline.jsx',
  ...(studio ? [] : ['Episode', output, '--license-key=free-license', '--concurrency=3',
    '--codec=h264', '--audio-codec=aac', '--pixel-format=yuv420p', '--crf=18']),
  `--public-dir=${assets}`, `--props=${manifest}`, '--ask-ai=false',
];
const result = spawnSync(process.execPath, args, { cwd: tool, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
