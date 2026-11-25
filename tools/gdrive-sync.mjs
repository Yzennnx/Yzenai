#!/usr/bin/env node
/**
 * Upload episode export videos ONLY to Google Drive via rclone ($0 local tool).
 *
 * Usage:
 *   node tools/gdrive-sync.mjs --setup                    # One-time Google Drive OAuth login
 *   node tools/gdrive-sync.mjs --check                    # Verify rclone + Drive connection
 *   node tools/gdrive-sync.mjs --episode <slug>           # Upload videos in episodes/<slug>/exports/
 *   node tools/gdrive-sync.mjs --all                      # Upload videos from all episode exports/
 *   node tools/gdrive-sync.mjs <path/to/video.mp4>        # Upload a single video file
 *
 * Options:
 *   --remote <name>          rclone remote name (default: GDRIVE_REMOTE or "gdrive")
 *   --folder <path>          Destination folder on Drive (default: GDRIVE_FOLDER or "Yzenai-Videos")
 *   --dry-run                Preview uploads without transferring files
 *   --include-intermediates  Also upload remotion-picture.mp4 / *-picture.mp4 masters
 *   --help                   Show this help
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const EPISODES_DIR = join(REPO_ROOT, 'episodes');
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.mkv', '.webm']);
const INTERMEDIATE_PATTERNS = [/^remotion-picture\.mp4$/i, /-picture\.mp4$/i];

function resolveRclone() {
  if (process.env.RCLONE_BIN) return process.env.RCLONE_BIN;
  const localBin = join(homedir(), '.local', 'bin', process.platform === 'win32' ? 'rclone.exe' : 'rclone');
  if (existsSync(localBin)) return localBin;
  const check = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['rclone'], { stdio: 'ignore' });
  if (check.status === 0) return 'rclone';
  throw new Error(
    'rclone not found. Install it (Linux: ~/.local/bin/rclone or `sudo dnf install rclone`; Windows: `winget install Rclone.Rclone`) or set RCLONE_BIN.',
  );
}

function runRclone(rclone, args, { capture = false } = {}) {
  const res = spawnSync(rclone, args, {
    stdio: capture ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8',
  });
  return res;
}

function hasRemote(rclone, remoteName) {
  const res = runRclone(rclone, ['listremotes'], { capture: true });
  if (res.status !== 0) return false;
  const target = `${remoteName}:`;
  return res.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .includes(target);
}

function isVideoFile(filePath, includeIntermediates) {
  const ext = extname(filePath).toLowerCase();
  if (!VIDEO_EXTS.has(ext)) return false;
  if (!includeIntermediates) {
    const name = basename(filePath);
    if (INTERMEDIATE_PATTERNS.some((re) => re.test(name))) return false;
  }
  return true;
}

function collectVideos(dir, includeIntermediates) {
  if (!existsSync(dir)) return [];
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectVideos(full, includeIntermediates));
    } else if (entry.isFile() && isVideoFile(full, includeIntermediates)) {
      found.push(full);
    }
  }
  return found.sort();
}

function rcloneFilterArgs(includeIntermediates) {
  const args = [];
  if (!includeIntermediates) {
    args.push('--exclude', 'remotion-picture.mp4', '--exclude', '*-picture.mp4');
  }
  for (const ext of VIDEO_EXTS) {
    args.push('--include', `*${ext}`, '--include', `*${ext.toUpperCase()}`);
  }
  args.push('--exclude', '*');
  return args;
}

function printHelp() {
  console.log(`Upload episode export videos ONLY to Google Drive via rclone.

Usage:
  node tools/gdrive-sync.mjs --setup                    One-time Google Drive OAuth login
  node tools/gdrive-sync.mjs --check                    Verify rclone + Google Drive remote
  node tools/gdrive-sync.mjs --episode <slug>           Upload videos from episodes/<slug>/exports/
  node tools/gdrive-sync.mjs --all                      Upload videos from all episodes/*/exports/
  node tools/gdrive-sync.mjs <path/to/video.mp4>        Upload a single video file

Options:
  --remote <name>          rclone remote name (default: GDRIVE_REMOTE or "gdrive")
  --folder <path>          Drive folder path (default: GDRIVE_FOLDER or "Yzenai-Videos")
  --dry-run                Show what would be uploaded without transferring
  --min-age <duration>     Skip files modified more recently (e.g. 1m, useful for background sync)
  --include-intermediates  Include remotion-picture.mp4 / *-picture.mp4 masters
  --help                   Show this help`);
}

function parseArgs(argv) {
  const opts = {
    setup: false,
    check: false,
    all: false,
    dryRun: false,
    includeIntermediates: false,
    help: false,
    episode: null,
    minAge: null,
    remote: process.env.GDRIVE_REMOTE || 'gdrive',
    folder: process.env.GDRIVE_FOLDER || 'Yzenai-Videos',
    positional: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--setup') opts.setup = true;
    else if (arg === '--check') opts.check = true;
    else if (arg === '--all') opts.all = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--include-intermediates') opts.includeIntermediates = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--episode') opts.episode = argv[++i];
    else if (arg === '--min-age') opts.minAge = argv[++i];
    else if (arg === '--remote') opts.remote = argv[++i];
    else if (arg === '--folder') opts.folder = argv[++i];
    else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      opts.positional.push(arg);
    }
  }
  return opts;
}

function ensureRemoteConfigured(rclone, remote) {
  if (!hasRemote(rclone, remote)) {
    throw new Error(
      `Google Drive remote "${remote}:" is not configured yet.\n` +
        `Run once in a terminal with browser access:\n` +
        `  node tools/gdrive-sync.mjs --setup`,
    );
  }
}

function findExportDirs(episodeDir) {
  if (!existsSync(episodeDir)) return [];
  const dirs = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = join(dir, entry.name);
      if (entry.name === 'exports') {
        dirs.push(full);
      } else if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'assets') {
        walk(full);
      }
    }
  }
  walk(episodeDir);
  return dirs.sort();
}

function uploadEpisode(rclone, slug, opts) {
  const episodeDir = join(EPISODES_DIR, slug);
  const exportDirs = findExportDirs(episodeDir);
  let totalUploaded = 0;

  for (const exportsDir of exportDirs) {
    const videos = collectVideos(exportsDir, opts.includeIntermediates);
    if (videos.length === 0) continue;

    // Strip the "exports" segment for a clean Drive path:
    //   episodes/<slug>/exports/a.mp4 -> <folder>/<slug>/a.mp4
    //   episodes/<slug>/part-1/ch-1a/exports/a.mp4 -> <folder>/<slug>/part-1/ch-1a/a.mp4
    const relExports = relative(episodeDir, exportsDir);
    const parentSub = relExports === 'exports' ? '' : relExports.replace(/(^|[\\/])exports$/, '');
    const dest = parentSub
      ? `${opts.remote}:${opts.folder}/${slug}/${parentSub.replaceAll('\\', '/')}`
      : `${opts.remote}:${opts.folder}/${slug}`;

    console.log(`[upload] ${slug}${parentSub ? `/${parentSub}` : ''}: ${videos.length} video(s) -> ${dest}`);
    for (const v of videos) {
      console.log(`  - ${relative(REPO_ROOT, v)}`);
    }

    const args = [
      'copy',
      exportsDir,
      dest,
      ...rcloneFilterArgs(opts.includeIntermediates),
      ...(process.stdout.isTTY ? ['--progress', '--stats-one-line'] : ['--stats=0', '-v']),
    ];
    if (opts.minAge) args.push('--min-age', opts.minAge);
    if (opts.dryRun) args.push('--dry-run');

    const res = runRclone(rclone, args);
    if (res.status !== 0) {
      throw new Error(`rclone copy failed for "${relative(REPO_ROOT, exportsDir)}" (exit ${res.status})`);
    }
    totalUploaded += videos.length;
  }

  if (totalUploaded === 0) {
    console.log(`[skip] ${slug}: no export videos found under ${relative(REPO_ROOT, episodeDir)}`);
  }
  return totalUploaded;
}

function uploadSingleFile(rclone, targetPath, opts) {
  const abs = resolve(targetPath);
  if (!existsSync(abs) || !statSync(abs).isFile()) {
    throw new Error(`File not found: ${targetPath}`);
  }
  if (!VIDEO_EXTS.has(extname(abs).toLowerCase())) {
    throw new Error(
      `Refusing to upload non-video file "${basename(abs)}". Only video files (${[...VIDEO_EXTS].join(', ')}) are allowed.`,
    );
  }

  // Place under <folder>/<slug>/ if file lives inside episodes/<slug>/...
  const relFromEpisodes = relative(EPISODES_DIR, abs);
  let dest = `${opts.remote}:${opts.folder}`;
  if (!relFromEpisodes.startsWith('..') && relFromEpisodes.includes('/')) {
    const slug = relFromEpisodes.split(/[\\/]/)[0];
    dest = `${opts.remote}:${opts.folder}/${slug}`;
  }

  console.log(`[upload] ${relative(REPO_ROOT, abs)} -> ${dest}/${basename(abs)}`);
  const args = [
    'copy',
    abs,
    dest,
    ...(process.stdout.isTTY ? ['--progress', '--stats-one-line'] : ['--stats=0', '-v']),
  ];
  if (opts.minAge) args.push('--min-age', opts.minAge);
  if (opts.dryRun) args.push('--dry-run');

  const res = runRclone(rclone, args);
  if (res.status !== 0) {
    throw new Error(`rclone copy failed for "${targetPath}" (exit ${res.status})`);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || (!opts.setup && !opts.check && !opts.all && !opts.episode && opts.positional.length === 0)) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  const rclone = resolveRclone();

  if (opts.setup) {
    if (hasRemote(rclone, opts.remote)) {
      console.log(`Remote "${opts.remote}:" already exists. Reconnecting OAuth token...`);
      const res = runRclone(rclone, ['config', 'reconnect', `${opts.remote}:`]);
      process.exit(res.status ?? 1);
    }
    console.log(`Creating Google Drive remote "${opts.remote}:" (opens browser for OAuth login)...`);
    const res = runRclone(rclone, ['config', 'create', opts.remote, 'drive', 'scope=drive']);
    if (res.status !== 0) process.exit(res.status ?? 1);
    console.log(`\nRemote "${opts.remote}:" configured. Creating folder "${opts.folder}" on Google Drive...`);
    runRclone(rclone, ['mkdir', `${opts.remote}:${opts.folder}`]);
    console.log('Done! Verify anytime with: node tools/gdrive-sync.mjs --check');
    process.exit(0);
  }

  if (opts.check) {
    console.log(`rclone: ${rclone}`);
    ensureRemoteConfigured(rclone, opts.remote);
    const dest = `${opts.remote}:${opts.folder}`;
    console.log(`Remote "${opts.remote}:" is configured. Listing ${dest}:`);
    runRclone(rclone, ['mkdir', dest]);
    const res = runRclone(rclone, ['ls', dest]);
    process.exit(res.status ?? 1);
  }

  ensureRemoteConfigured(rclone, opts.remote);

  if (opts.all) {
    const slugs = readdirSync(EPISODES_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    let total = 0;
    for (const slug of slugs) {
      total += uploadEpisode(rclone, slug, opts);
    }
    console.log(`\nDone. ${opts.dryRun ? 'Would upload' : 'Uploaded'} ${total} video(s).`);
    return;
  }

  if (opts.episode) {
    uploadEpisode(rclone, opts.episode, opts);
    return;
  }

  for (const target of opts.positional) {
    const abs = resolve(target);
    if (existsSync(abs) && statSync(abs).isDirectory()) {
      const rel = relative(EPISODES_DIR, abs);
      if (!rel.startsWith('..')) {
        const slug = rel.split(/[\\/]/)[0];
        uploadEpisode(rclone, slug, opts);
        continue;
      }
      throw new Error(`Directory "${target}" is not inside episodes/. Pass --episode <slug> or a video file path.`);
    }
    uploadSingleFile(rclone, target, opts);
  }
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
