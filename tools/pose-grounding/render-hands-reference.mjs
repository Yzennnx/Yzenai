import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { resolveBrowser, resolveToolsDir } from '../render-env.mjs';

const tools = resolveToolsDir();
const browserBin = resolveBrowser();
const work = await mkdtemp(join(tools, 'hands-ref-'));
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

  const [art, wh] = await Promise.all([
    readFile(new URL('../../assets/series-lead/anatomy-prototype/art.js', import.meta.url), 'utf8'),
    readFile(new URL('../../assets/series-lead/hands/weapon-hands.js', import.meta.url), 'utf8'),
  ]);

  const script = `(() => {
    ${art}
    ${wh}
    const INK = '#101b21';
    const c = document.createElement('canvas');
    c.width = 1680; c.height = 1040;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2eadc'; ctx.fillRect(0, 0, 1680, 1040);

    ctx.fillStyle = '#8b2e2e'; ctx.font = 'bold 20px Arial';
    ctx.fillText('WHAT HAPPENS NEXT? — REVISED CLOSE-UP HANDS REFERENCE (ZERO SEVERED WRISTS / ZERO OVAL HANDS)', 48, 46);
    ctx.fillStyle = '#1d2d35'; ctx.font = 'bold 42px Arial';
    ctx.fillText('Series Lead — Survival & Weapon Hands (v3)', 48, 94);

    function shape(d, fill, stroke = INK, w = 2.4) {
      const p = new Path2D(d);
      if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(p); }
    }

    function drawConnectedForearm(cx, yStart, yEnd, armored = true) {
      const topW = 34, botW = 46;
      const dir = yEnd > yStart ? 1 : -1;
      const yMid = yStart + (yEnd - yStart) * 0.12;
      // Forearm extends cleanly to card edge (ZERO floating severed cuff!)
      shape(\`M\${cx - topW} \${yStart} L\${cx + topW} \${yStart} L\${cx + botW} \${yEnd} L\${cx - botW} \${yEnd} Z\`, armored ? '#a37b51' : '#e8e1cc');
      if (armored) {
        const t1 = yStart + (yEnd - yStart) * 0.34;
        const t2 = yStart + (yEnd - yStart) * 0.68;
        shape(\`M\${cx - 38} \${t1 - 8} L\${cx + 38} \${t1 - 8} L\${cx + 40} \${t1 + 8} L\${cx - 40} \${t1 + 8} Z\`, '#8c969e', INK, 1.8);
        shape(\`M\${cx - 42} \${t2 - 8} L\${cx + 42} \${t2 - 8} L\${cx + 44} \${t2 + 8} L\${cx - 44} \${t2 + 8} Z\`, '#8c969e', INK, 1.8);
        // Leather wrist cuff strap
        shape(\`M\${cx - 36} \${yStart} L\${cx + 36} \${yStart} L\${cx + 38} \${yMid + dir * 16} L\${cx - 38} \${yMid + dir * 16} Z\`, '#4d311f', INK, 2.0);
      } else {
        // Cream shirt cuff band with button
        shape(\`M\${cx - 35} \${yStart} L\${cx + 35} \${yStart} L\${cx + 37} \${yMid + dir * 14} L\${cx - 37} \${yMid + dir * 14} Z\`, '#f3ecdc', INK, 2.0);
      }
    }

    function drawBarPressHand(cx, cy, yBot, gloved) {
      const skin = gloved ? '#553622' : '#e5b28b';
      const shade = gloved ? '#392315' : '#c68f69';
      // Horizontal panic bar
      shape(\`M\${cx - 150} \${cy - 18} H\${cx + 150} V\${cy + 6} H\${cx - 150} Z\`, '#b89455', INK, 2.6);
      shape(\`M\${cx - 150} \${cy - 2} H\${cx + 150} V\${cy + 6} H\${cx - 150} Z\`, '#8f6e38', INK, 1.6);
      // Connected forearm to bottom card edge!
      drawConnectedForearm(cx, cy + 72, yBot, gloved);
      // Sculpted back of hand + 4 close fingers pressing rail + opposing thumb
      shape(\`M\${cx - 34} \${cy + 74} Q\${cx - 44} \${cy + 26} \${cx - 36} \${cy - 18} L\${cx + 34} \${cy - 18} Q\${cx + 44} \${cy + 26} \${cx + 34} \${cy + 74} Z\`, skin, INK, 2.4);
      // Thumb on left
      shape(\`M\${cx - 36} \${cy + 36} Q\${cx - 64} \${cy + 14} \${cx - 58} \${cy - 16} Q\${cx - 50} \${cy - 26} \${cx - 36} \${cy - 10} Z\`, skin, INK, 2.3);
      // 4 sculpted fingers pressing forward over rail
      const fx = [-26, -9, 9, 26];
      const fh = [-86, -104, -96, -74];
      for (let i = 0; i < 4; i++) {
        const xx = cx + fx[i], top = cy + fh[i];
        shape(\`M\${xx - 8} \${cy - 12} L\${xx - 7} \${top} Q\${xx} \${top - 10} \${xx + 7} \${top} L\${xx + 8} \${cy - 12} Z\`, skin, INK, 2.2);
        shape(\`M\${xx - 5} \${top + 28} L\${xx + 5} \${top + 28}\`, null, shade, 1.5);
      }
      shape(\`M\${cx - 24} \${cy + 12} Q\${cx} \${cy + 2} \${cx + 24} \${cy + 12}\`, null, shade, 2.0);
    }

    function drawBarHoldHand(cx, cy, yTop, gloved) {
      const skin = gloved ? '#553622' : '#e5b28b';
      const shade = gloved ? '#392315' : '#c68f69';
      // Back thumb hooking under rail
      shape(\`M\${cx - 52} \${cy + 18} Q\${cx - 42} \${cy + 44} \${cx - 18} \${cy + 36} L\${cx - 24} \${cy + 14} Z\`, shade, INK, 2.2);
      // Horizontal iron ladder / rail bar
      shape(\`M\${cx - 150} \${cy - 16} H\${cx + 150} V\${cy + 22} H\${cx - 150} Z\`, '#7f8c96', INK, 2.6);
      shape(\`M\${cx - 150} \${cy + 8} H\${cx + 150} V\${cy + 22} H\${cx - 150} Z\`, '#59656e', INK, 1.6);
      // Connected forearm to top card edge!
      drawConnectedForearm(cx, cy - 68, yTop, gloved);
      // Back of hand + 4 curled fingers wrapping cleanly OVER the front of the bar
      shape(\`M\${cx - 36} \${cy - 72} L\${cx + 36} \${cy - 72} Q\${cx + 46} \${cy - 22} \${cx + 36} \${cy + 6} L\${cx - 36} \${cy + 6} Q\${cx - 46} \${cy - 22} \${cx - 36} \${cy - 72} Z\`, skin, INK, 2.4);
      const fx = [-26, -9, 9, 26];
      const fb = [44, 52, 48, 38];
      for (let i = 0; i < 4; i++) {
        const xx = cx + fx[i], bot = cy + fb[i];
        shape(\`M\${xx - 8} \${cy - 10} L\${xx - 8} \${bot} Q\${xx} \${bot + 10} \${xx + 8} \${bot} L\${xx + 8} \${cy - 10} Z\`, skin, INK, 2.2);
        shape(\`M\${xx - 5} \${cy + 16} L\${xx + 5} \${cy + 16}\`, null, shade, 1.5);
      }
    }

    const cards = [
      // Row 1: Survival Utility Hands (Connected Forearms — Bare & Leather Glove!)
      { title: 'Push bar press (bare)', sub: 'Connected forearm, palm on rail', fn: (x, y, w, h) => drawBarPressHand(x + w * 0.5, y + h * 0.50, y + h - 56, false) },
      { title: 'Push bar press (gloved)', sub: 'Armored cuff + leather glove', fn: (x, y, w, h) => drawBarPressHand(x + w * 0.5, y + h * 0.50, y + h - 56, true) },
      { title: 'Bar hold (bare)', sub: 'Fingers over bar, thumb under', fn: (x, y, w, h) => drawBarHoldHand(x + w * 0.5, y + h * 0.54, y, false) },
      { title: 'Bar hold (gloved)', sub: 'Armored ladder/rail grip', fn: (x, y, w, h) => drawBarHoldHand(x + w * 0.5, y + h * 0.54, y, true) },
      // Row 2: Sculpted 2-Layer Weapon & Prop Hands (Back -> Prop -> Front)
      { title: 'Shotgun grip (offTrigger)', sub: 'Index straight along receiver', fn: (x, y, w, h) => {
        const cx = x + w * 0.5, cy = y + h * 0.45;
        window.drawWeaponHandBack(ctx, 'shotgun-grip', cx - 10, cy + 10, 1.65, 0, { offTrigger: true });
        shape(\`M\${cx - 100} \${cy - 24} H\${cx + 115} V\${cy + 10} H\${cx - 100} Z\`, '#2a333b', INK, 2.6);
        window.drawWeaponHandFront(ctx, 'shotgun-grip', cx - 10, cy + 10, 1.65, 0, { offTrigger: true });
      }},
      { title: 'Shotgun forend', sub: '4 staggered wrapped fingers', fn: (x, y, w, h) => {
        const cx = x + w * 0.5, cy = y + h * 0.46;
        window.drawWeaponHandBack(ctx, 'shotgun-forend', cx, cy + 10, 1.75, 0);
        shape(\`M\${cx - 110} \${cy - 18} H\${cx + 110} V\${cy + 14} H\${cx - 110} Z\`, '#1f262c', INK, 2.6);
        window.drawWeaponHandFront(ctx, 'shotgun-forend', cx, cy + 10, 1.75, 0);
      }},
      { title: 'Pistol two-hand', sub: 'Thumbs-forward 9mm lock', fn: (x, y, w, h) => {
        const cx = x + w * 0.5, cy = y + h * 0.48;
        window.drawWeaponHandBack(ctx, 'pistol-twohand', cx - 8, cy + 14, 1.65, 0);
        shape(\`M\${cx - 46} \${cy - 38} H\${cx + 105} V\${cy - 8} H\${cx - 46} Z\`, '#262f37', INK, 2.6);
        window.drawWeaponHandFront(ctx, 'pistol-twohand', cx - 8, cy + 14, 1.65, 0);
      }},
      { title: 'Phone cradle', sub: '4 curled fingers + side thumb', fn: (x, y, w, h) => {
        const cx = x + w * 0.5, cy = y + h * 0.42;
        window.drawWeaponHandBack(ctx, 'phone-cradle', cx, cy + 8, 1.0, -8);
        ctx.save(); ctx.translate(cx, cy + 8); ctx.rotate(-8 * Math.PI / 180);
        shape('M-58 -104 H58 V94 H-58 Z', '#141e26', INK, 2.6);
        shape('M-48 -88 H48 V78 H-48 Z', '#1d3c4e', null);
        ctx.restore();
        window.drawWeaponHandFront(ctx, 'phone-cradle', cx, cy + 8, 1.0, -8);
      }},
    ];

    cards.forEach((card, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 48 + col * 402, y = 132 + row * 440, w = 382, h = 414;
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = '#fbf7ef'; ctx.fillRect(x, y, w, h);
      card.fn(x, y, w, h);
      // Clean label bar at bottom
      ctx.fillStyle = '#fbf7ef'; ctx.fillRect(x, y + h - 56, w, 56);
      ctx.fillStyle = '#1d2d35'; ctx.font = 'bold 21px Arial'; ctx.fillText(card.title, x + 16, y + h - 28);
      ctx.fillStyle = '#5c6b73'; ctx.font = '15px Arial'; ctx.fillText(card.sub, x + 16, y + h - 9);
      ctx.restore();
      ctx.strokeStyle = '#d3c9b4'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    });

    return c.toDataURL('image/png').split(',')[1];
  })()`;

  const recv = once(socket, 'message', { signal: AbortSignal.timeout(15000) });
  socket.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: script, returnByValue: true } }));
  const [ev] = await recv;
  const b64 = JSON.parse(ev.data).result.result.value;
  const out = new URL('../../assets/series-lead/hands/reference-sheet.png', import.meta.url);
  await writeFile(out, Buffer.from(b64, 'base64'));
  console.log('Wrote revised', out.pathname);
} finally {
  socket?.close();
  browser.kill();
  await stopped;
  await rm(work, { recursive: true, force: true });
}
