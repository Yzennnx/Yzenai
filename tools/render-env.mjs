/**
 * Cross-platform (Linux + Windows) resolver for local $0 render tools:
 *  - Chromium / Edge headless browser
 *  - FFmpeg binary
 *  - Shared AIShortVideos tool directory
 */

import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function resolveToolsDir() {
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return join(process.env.LOCALAPPDATA, 'AIShortVideos');
  }
  return join(homedir(), '.local', 'share', 'AIShortVideos');
}

export function resolveFfmpeg() {
  if (process.env.FFMPEG_BIN) return process.env.FFMPEG_BIN;
  if (process.platform === 'win32') {
    const tools = resolveToolsDir();
    const release = readdirSync(tools).find((n) => /^ffmpeg-.*_build$/.test(n));
    if (release) return join(tools, release, 'bin', 'ffmpeg.exe');
  }
  return 'ffmpeg';
}

export function resolveBrowser() {
  if (process.env.BROWSER_BIN) return process.env.BROWSER_BIN;
  if (process.platform === 'win32') {
    return join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
  }
  for (const bin of ['chromium', 'chromium-browser', 'google-chrome', 'microsoft-edge']) {
    if (spawnSync('which', [bin], { stdio: 'ignore' }).status === 0) return bin;
  }
  throw new Error('No headless Chromium/Chrome/Edge browser found. Install chromium or set BROWSER_BIN.');
}
