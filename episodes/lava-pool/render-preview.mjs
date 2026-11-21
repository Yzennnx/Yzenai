import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const tools = join(process.env.LOCALAPPDATA, 'AIShortVideos');
const release = (await readdir(tools)).find((entry) => /^ffmpeg-.*_build$/.test(entry));
assert(release, 'Portable FFmpeg is missing');
const ffmpeg = join(tools, release, 'bin', 'ffmpeg.exe');
const ffprobe = join(tools, release, 'bin', 'ffprobe.exe');
const python = join(tools, 'piper', 'Scripts', 'python.exe');
const model = join(tools, 'voices', 'en_US-joe-medium.onnx');
const edge = join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
const framesPerSecond = 24;
const fullEpisode = process.argv.includes('--full');
const editSource = process.argv.includes('--edit-source');
assert(!editSource || fullEpisode, 'Use --full with --edit-source');
const duration = fullEpisode ? 55 : 15;
const referenceVoice = fullEpisode || process.argv.includes('--reference-voice');
const voiceAsset = fullEpisode ? 'episode-voice' : 'opening-voice-reference';
const exportName = fullEpisode ? 'lava-pool-character-revision.mp4' : referenceVoice ? 'lava-opening-reference-voice.mp4' : 'lava-opening-revised.mp4';
const assets = join(import.meta.dirname, 'assets');
const output = editSource ? join(assets, 'remotion-picture.mp4') : join(import.meta.dirname, 'exports', exportName);
const work = await mkdtemp(join(tools, 'lava-preview-'));
await mkdir(join(import.meta.dirname, 'exports'), { recursive: true });
await mkdir(assets, { recursive: true });

const impact = 4.20;
const narration = [
  { start: .24, line: 'What happens to your body', rate: 1.16, pitch: 2.8, emphasis: ['BODY'] },
  { line: 'if you jump into lava?', rate: 1.00, pitch: 3.8, emphasis: ['JUMP', 'LAVA'] },
  { start: 4.56, line: 'Your feet hit', rate: 1.12, pitch: 1.1, emphasis: [] },
  { line: 'molten rock.', rate: .86, pitch: .3, emphasis: ['MOLTEN', 'ROCK'] },
  { start: 7.30, line: 'Fresh lava at Kīlauea', rate: 1.14, pitch: 1.4, emphasis: ['KĪLAUEA'] },
  { line: 'can be hotter than', rate: 1.20, pitch: 1.7, emphasis: [] },
  { line: 'eleven hundred', rate: .90, pitch: 2.4, emphasis: ['ELEVEN', 'HUNDRED'] },
  { line: 'degrees Celsius.', rate: 1.04, pitch: 1.0, emphasis: [] },
  { start: 11.92, line: 'On contact,', rate: 1.09, pitch: .5, emphasis: ['CONTACT'] },
  { line: 'your skin starts', rate: 1.14, pitch: .3, emphasis: ['SKIN'] },
  { line: 'taking damage.', rate: 1.02, pitch: 0, emphasis: ['DAMAGE'] },
];

function audioDuration(file) {
  return Number(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }));
}

function buildRead(name, measured) {
  let cursor = 0;
  const pages = [];
  const files = [];
  for (const [index, part] of narration.entries()) {
    const raw = join(work, 'raw.wav');
    const file = join(work, `${name}-${index}.wav`);
    const pitch = 2 ** ((part.pitch + (measured ? -.65 : 0)) / 12);
    const rate = part.rate * (measured && index < 4 ? .92 : 1);
    execFileSync(python, ['-X', 'utf8', '-m', 'piper', '-m', model, '--sentence-silence', '0', '-f', raw, '--', part.line]);
    const filter = `silenceremove=start_periods=1:start_threshold=-46dB:start_silence=0.018,areverse,silenceremove=start_periods=1:start_threshold=-46dB:start_silence=0.035,areverse,asetrate=${Math.round(22050 * pitch)},aresample=48000,atempo=${rate / pitch},highpass=f=75,volume=0.78`;
    execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', raw, '-af', filter, file]);
    const seconds = audioDuration(file);
    assert(Number.isFinite(seconds) && seconds > 0, 'Missing narration audio');
    const start = part.start ?? cursor;
    assert(start >= (pages.at(-1)?.end ?? 0), `Overlapping narration at "${part.line}"`);
    const end = start + seconds;
    pages.push({ start, end, text: part.line.toUpperCase(), emphasis: part.emphasis });
    files.push(file);
    cursor = end + (measured && index === 2 ? .21 : index === 2 ? .10 : .045);
  }
  assert(pages.at(-1).end <= duration, 'Narration runs past the preview');
  const filters = pages.map((page, index) => `[${index}:a]adelay=${Math.round(page.start * 1000)}:all=1[v${index}]`);
  filters.push(`${pages.map((_, index) => `[v${index}]`).join('')}amix=inputs=${pages.length}:normalize=0,apad=whole_dur=${duration}[voice]`);
  const voice = join(assets, `opening-voice-${name}.wav`);
  execFileSync(ffmpeg, ['-v', 'error', '-y', ...files.flatMap((file) => ['-i', file]), '-filter_complex', filters.join(';'), '-map', '[voice]', voice]);
  return { pages, voice };
}

let browser;
let socket;
let encoder;
try {
  const { pages, voice } = referenceVoice
    ? {
        pages: JSON.parse(await readFile(join(assets, `${voiceAsset}.json`), 'utf8')),
        voice: join(assets, `${voiceAsset}.wav`),
      }
    : buildRead('quick', false);
  if (!referenceVoice) buildRead('measured', true);
  assert(pages.length > 0 && pages.every((page, index) => page.start >= (pages[index - 1]?.end ?? 0)
    && page.end > page.start && page.end <= duration), 'Invalid caption timing');
  assert(Math.abs(audioDuration(voice) - duration) < .05, 'Voice track does not match the video duration');
  console.log(`Last caption ends at ${pages.at(-1).end.toFixed(2)}s. Impact at ${impact.toFixed(2)}s.`);

  const profile = join(work, 'edge');
  browser = spawn(edge, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, pathToFileURL(join(import.meta.dirname, 'preview.html')).href], { stdio: 'ignore', windowsHide: true });
  let endpoint;
  for (let attempt = 0; attempt < 100; attempt++) {
    const portFile = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
    if (portFile) {
      const tabs = await fetch(`http://127.0.0.1:${portFile.split(/\r?\n/)[0]}/json/list`).then((response) => response.json());
      endpoint = tabs.find((tab) => tab.type === 'page' && tab.url.includes('preview.html'))?.webSocketDebuggerUrl;
      if (endpoint) break;
    }
    await delay(100);
  }
  assert(endpoint, 'Edge did not load the preview');
  socket = new WebSocket(endpoint);
  await once(socket, 'open');
  let commandId = 0;
  async function evaluate(expression) {
    const id = ++commandId;
    const response = new Promise((resolve, reject) => {
      const receive = (event) => {
        const result = JSON.parse(event.data);
        if (result.id !== id) return;
        socket.removeEventListener('message', receive);
        if (result.error || result.result.exceptionDetails) reject(new Error(JSON.stringify(result.error ?? result.result.exceptionDetails)));
        else resolve(result.result.result.value);
      };
      socket.addEventListener('message', receive);
    });
    socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
    return response;
  }
  for (let attempt = 0; attempt < 80 && !await evaluate('Boolean(window.renderFrame)'); attempt++) await delay(100);
  assert(await evaluate('Boolean(window.renderFrame)'), 'Preview script did not load');
  await evaluate(`window.pages = ${JSON.stringify(pages)}; true`);

  const sinceImpact = `(t-${impact.toFixed(4)})`;
  const sinceBoard = `(t-${(impact - (editSource ? .92 : 1.12)).toFixed(4)})`;
  const episodeSound = fullEpisode
    ? '+(random(2)*2-1)*(0.055*exp(-1.8*(t-23.4)^2)+0.031*exp(-2.1*(t-30.7)^2))'
      + '+between(t\\,9.2\\,33.7)*(random(3)*2-1)*(0.013+0.027*pow(max(sin(t*31)\\,0)\\,9))'
      + '+between(t\\,34.2\\,47.4)*0.063*exp(-16*mod(t-34.2\\,0.76))*sin(2*PI*68*mod(t-34.2\\,0.76))'
      + '+0.068*exp(-8*(t-53.0)^2)*sin(2*PI*(110*(t-53.0)+11*(t-53.0)^2))'
    : '';
  const sound = `aevalsrc=0.032*sin(2*PI*46*t)*(0.75+0.25*sin(2*PI*1.3*t))+0.022*(random(0)*2-1)+0.055*sin(2*PI*(95*t+62*t*t))*exp(-18*(t-0.38)*(t-0.38))+if(gte(${sinceBoard}\\,0)\\,0.15*exp(-14*${sinceBoard})*sin(2*PI*143*${sinceBoard})\\,0)+if(gte(${sinceImpact}\\,0)\\,(0.30*sin(2*PI*(83*${sinceImpact}-17*${sinceImpact}*${sinceImpact}))*exp(-11*${sinceImpact})+0.16*(random(1)*2-1)*exp(-2.6*${sinceImpact}))\\,0)${episodeSound}:s=48000:d=${duration}`;
  const mix = '[1:a][2:a]amix=inputs=2:normalize=0,alimiter=limit=0.94[audio]';
  encoder = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(framesPerSecond), '-vcodec', 'mjpeg', '-i', 'pipe:0', '-i', voice, '-f', 'lavfi', '-i', sound, '-filter_complex', mix, '-map', '0:v:0', '-map', '[audio]', '-t', String(duration), '-c:v', 'libx264', '-preset', 'fast', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', output], { stdio: ['pipe', 'ignore', 'inherit'], windowsHide: true });
  const exit = once(encoder, 'close');
  encoder.stdin.on('error', () => {});
  for (let frame = 0; frame < duration * framesPerSecond; frame++) {
    const encoded = await evaluate(`window.renderFrame(${frame / framesPerSecond}, ${impact}, window.pages, ${editSource}); document.getElementById('scene').toDataURL('image/jpeg', 0.91).split(',')[1]`);
    assert(encoded, `Missing frame ${frame}`);
    await new Promise((resolve, reject) => encoder.stdin.write(Buffer.from(encoded, 'base64'), (error) => error ? reject(error) : resolve()));
    if (fullEpisode && frame % (framesPerSecond * 10) === 0 && frame > 0) console.log(`Rendered ${frame / framesPerSecond}s of ${duration}s`);
  }
  encoder.stdin.end();
  assert.equal((await exit)[0], 0, 'FFmpeg failed');
  console.log(output);
} finally {
  socket?.close();
  if (encoder && encoder.exitCode === null) encoder.kill();
  if (browser && browser.exitCode === null) {
    const exited = once(browser, 'close');
    browser.kill();
    await exited;
  }
  const cache = await realpath(work);
  assert(dirname(cache) === await realpath(tools) && basename(cache).startsWith('lava-preview-'), 'Unexpected preview cache path');
  await rm(cache, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }).catch((error) => console.warn(`Could not clean preview cache: ${error.message}`));
}
