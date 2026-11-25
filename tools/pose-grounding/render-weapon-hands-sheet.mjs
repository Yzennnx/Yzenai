import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { resolveBrowser, resolveToolsDir } from '../render-env.mjs';

const tools = resolveToolsDir();
const browserBin = resolveBrowser();
const work = await mkdtemp(join(tools, 'wh-sheet-'));
const profile = join(work, 'browser');
const browser = spawn(browserBin, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-sandbox',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
const stopped = once(browser, 'close');
let socket;

try {
  let endpoint;
  for (let i = 0; i < 100 && !endpoint; i++) {
    const port = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
    if (port) {
      const tabs = await fetch(`http://127.0.0.1:${port.trim().split(/\r?\n/)[0]}/json/list`).then(r => r.json()).catch(() => []);
      endpoint = tabs.find(t => t.type === 'page' && t.url === 'about:blank')?.webSocketDebuggerUrl;
    }
    if (!endpoint) await delay(100);
  }
  socket = new WebSocket(endpoint);
  await once(socket, 'open', { signal: AbortSignal.timeout(10000) });

  const wh = await readFile(new URL('../../assets/series-lead/hands/weapon-hands.js', import.meta.url), 'utf8');
  const script = `(() => {
    ${wh}
    const c = document.createElement('canvas');
    c.width = 1600; c.height = 960;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2eadc'; ctx.fillRect(0, 0, 1600, 960);
    ctx.fillStyle = '#8b2e2e'; ctx.font = 'bold 20px Arial'; ctx.fillText('SERIES LEAD — SCULPTED 2-LAYER HAND KIT (BACK -> PROP -> FRONT)', 48, 48);
    ctx.fillStyle = '#1d2d35'; ctx.font = 'bold 40px Arial'; ctx.fillText('Weapon & Survival Hands (Zero-Oval-Hand Standard)', 48, 94);

    const cards = [
      { title: 'shotgun-grip (offTrigger)', fn: (cx, cy) => {
        window.drawWeaponHandBack(ctx, 'shotgun-grip', cx - 10, cy + 10, 1.8, 0, { offTrigger: true });
        ctx.fillStyle = '#2a333b'; ctx.fillRect(cx - 110, cy - 26, 230, 36);
        ctx.strokeStyle = '#101b21'; ctx.lineWidth = 3; ctx.strokeRect(cx - 110, cy - 26, 230, 36);
        window.drawWeaponHandFront(ctx, 'shotgun-grip', cx - 10, cy + 10, 1.8, 0, { offTrigger: true });
      }},
      { title: 'shotgun-grip (onTrigger)', fn: (cx, cy) => {
        window.drawWeaponHandBack(ctx, 'shotgun-grip', cx - 10, cy + 10, 1.8, 0, { offTrigger: false });
        ctx.fillStyle = '#2a333b'; ctx.fillRect(cx - 110, cy - 26, 230, 36);
        ctx.strokeStyle = '#101b21'; ctx.lineWidth = 3; ctx.strokeRect(cx - 110, cy - 26, 230, 36);
        window.drawWeaponHandFront(ctx, 'shotgun-grip', cx - 10, cy + 10, 1.8, 0, { offTrigger: false });
      }},
      { title: 'shotgun-forend', fn: (cx, cy) => {
        window.drawWeaponHandBack(ctx, 'shotgun-forend', cx, cy + 12, 1.9, 0);
        ctx.fillStyle = '#1f262c'; ctx.fillRect(cx - 120, cy - 20, 240, 36);
        ctx.strokeStyle = '#101b21'; ctx.lineWidth = 3; ctx.strokeRect(cx - 120, cy - 20, 240, 36);
        window.drawWeaponHandFront(ctx, 'shotgun-forend', cx, cy + 12, 1.9, 0);
      }},
      { title: 'pistol-twohand', fn: (cx, cy) => {
        window.drawWeaponHandBack(ctx, 'pistol-twohand', cx - 10, cy + 16, 1.8, 0);
        ctx.fillStyle = '#262f37'; ctx.fillRect(cx - 50, cy - 42, 165, 34);
        ctx.strokeStyle = '#101b21'; ctx.lineWidth = 3; ctx.strokeRect(cx - 50, cy - 42, 165, 34);
        window.drawWeaponHandFront(ctx, 'pistol-twohand', cx - 10, cy + 16, 1.8, 0);
      }},
      { title: 'phone-cradle', fn: (cx, cy) => {
        window.drawWeaponHandBack(ctx, 'phone-cradle', cx, cy + 10, 1.15, -8);
        ctx.save(); ctx.translate(cx, cy + 10); ctx.rotate(-8 * Math.PI / 180);
        ctx.fillStyle = '#141e26'; ctx.fillRect(-68, -120, 136, 224);
        ctx.strokeStyle = '#101b21'; ctx.lineWidth = 3; ctx.strokeRect(-68, -120, 136, 224);
        ctx.fillStyle = '#1d3c4e'; ctx.fillRect(-56, -102, 112, 186);
        ctx.restore();
        window.drawWeaponHandFront(ctx, 'phone-cradle', cx, cy + 10, 1.15, -8);
      }},
      { title: 'front-shotgun-grip-L / R', fn: (cx, cy) => {
        window.drawWeaponHandBack(ctx, 'front-shotgun-grip-L', cx - 64, cy + 10, 1.5, 0);
        window.drawWeaponHandBack(ctx, 'front-shotgun-grip-R', cx + 64, cy + 10, 1.5, 0);
        ctx.fillStyle = '#252d34'; ctx.fillRect(cx - 140, cy - 12, 280, 32);
        ctx.strokeStyle = '#101b21'; ctx.lineWidth = 3; ctx.strokeRect(cx - 140, cy - 12, 280, 32);
        window.drawWeaponHandFront(ctx, 'front-shotgun-grip-L', cx - 64, cy + 10, 1.5, 0);
        window.drawWeaponHandFront(ctx, 'front-shotgun-grip-R', cx + 64, cy + 10, 1.5, 0);
      }},
    ];

    cards.forEach((card, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 48 + col * 510, y = 132 + row * 400, w = 486, h = 376;
      ctx.fillStyle = '#fbf7ef'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#d3c9b4'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      card.fn(x + w * 0.5, y + h * 0.46);
      ctx.fillStyle = '#1d2d35'; ctx.font = 'bold 22px Arial'; ctx.textAlign = 'center';
      ctx.fillText(card.title, x + w * 0.5, y + h - 22);
      ctx.textAlign = 'left';
    });
    return c.toDataURL('image/png').split(',')[1];
  })()`;

  const recv = once(socket, 'message', { signal: AbortSignal.timeout(15000) });
  socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: script, returnByValue: true } }));
  const [ev] = await recv;
  const b64 = JSON.parse(ev.data).result.result.value;
  const out = new URL('../../assets/series-lead/hands/weapon-hands-sheet.png', import.meta.url);
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log('Wrote', out.pathname);
} finally {
  socket?.close();
  browser.kill();
  await stopped;
  await rm(work, { recursive: true, force: true });
}
