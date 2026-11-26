#!/usr/bin/env python3
"""
Hybrid 3D-to-2D Widescreen Compositor (Native 30 fps) for L4D Part 3 — Ch 3A Preview (32.4s -> 52.0s).
Composites Blender 5.2 cel-shaded 3D ground/plaza + 3D Lead/Witch/Hand renders over a moody 2D night
skyline + Apex Tower beacon + volumetric fog + 2D illustrated ECU + shared paper grain + timed captions.
"""
import json
import math
import os
import random
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

CH_DIR = Path(__file__).resolve().parent
REPO_ROOT = CH_DIR.parents[3]
WORK_3D = CH_DIR / "assets" / "hybrid-preview-3d"
EXPORTS = CH_DIR / "exports"
EXPORTS.mkdir(parents=True, exist_ok=True)
OUT_MP4 = EXPORTS / "ch-3a-hybrid-preview.mp4"

W, H = 1920, 1080
FPS = 30
SLICE_START = 32.4
SLICE_DUR = 19.6  # 32.4 -> 52.0s
TOTAL_FRAMES = int(round(SLICE_DUR * FPS))  # 588 native 30fps frames


def load_font(size: int, bold: bool = True):
    paths = [
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf",
        "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Regular.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make_grain_tile(w=W, h=H, seed=42):
    rng = random.Random(seed)
    gw, gh = w // 2, h // 2
    buf = bytearray(gw * gh)
    for i in range(gw * gh):
        buf[i] = rng.randint(114, 142)
    return Image.frombytes("L", (gw, gh), bytes(buf)).resize((w, h), Image.NEAREST)


def make_vignette(w=W, h=H):
    vw, vh = w // 4, h // 4
    img = Image.new("RGBA", (vw, vh), (0, 0, 0, 0))
    px = img.load()
    cx, cy = vw * 0.5, vh * 0.5
    max_d = math.hypot(cx, cy)
    for y in range(vh):
        for x in range(vw):
            d = math.hypot((x - cx) * 0.88, (y - cy) * 1.12) / max_d
            a = int(max(0.0, min(1.0, (d - 0.42) / 0.58)) ** 1.7 * 155)
            px[x, y] = (6, 10, 16, a)
    return img.resize((w, h), Image.BILINEAR)


def make_night_sky_backdrop(horizon_y: int = 560) -> Image.Image:
    """2D atmospheric night sky + distant windowed city skyline + Apex Tower spire (sits behind 3D set)."""
    img = Image.new("RGBA", (W, H), (11, 17, 25, 255))
    d = ImageDraw.Draw(img, "RGBA")
    for y in range(0, H, 6):
        t = min(1.0, y / max(1, horizon_y))
        r = int(10 + 18 * t)
        g = int(16 + 26 * t)
        b = int(26 + 30 * t)
        d.rectangle([0, y, W, min(H, y + 6)], fill=(r, g, b, 255))

    rng = random.Random(512)
    bx = -20
    while bx < W + 40:
        bw = rng.randint(85, 175)
        bh = rng.randint(110, 340)
        y0 = max(30, horizon_y - bh)
        d.rectangle([bx, y0, bx + bw - 6, H], fill=(16, 24, 34, 255), outline=(26, 38, 48, 255), width=2)
        for wy in range(y0 + 18, horizon_y - 10, 22):
            for wx in range(bx + 12, bx + bw - 20, 18):
                if rng.random() < 0.7:
                    lit = rng.random() < 0.04
                    d.rectangle([wx, wy, wx + 8, wy + 11], fill=(135, 180, 195, 85) if lit else (10, 15, 22, 165))
        bx += bw

    # Apex Tower spire (upper right)
    tx, ty = 1520, max(28, horizon_y - 410)
    d.polygon([(tx, H), (tx + 12, ty), (tx + 84, ty), (tx + 96, H)], fill=(13, 19, 28, 255), outline=(30, 44, 56, 255))
    d.line([(tx + 48, ty), (tx + 48, max(6, ty - 40))], fill=(48, 66, 78, 255), width=4)

    # Low horizon mist band
    fog = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fog, "RGBA")
    fd.rectangle([0, max(0, horizon_y - 60), W, min(H, horizon_y + 90)], fill=(54, 82, 98, 62))
    fog = fog.filter(ImageFilter.GaussianBlur(30))
    return Image.alpha_composite(img, fog)


def paste_scaled(base: Image.Image, fg: Image.Image, scale: float, dx: int = 0, dy: int = 0) -> Image.Image:
    if abs(scale - 1.0) < 1e-4 and dx == 0 and dy == 0:
        return Image.alpha_composite(base, fg)
    nw, nh = int(round(fg.width * scale)), int(round(fg.height * scale))
    r = fg.resize((nw, nh), Image.BILINEAR)
    ox = (W - nw) // 2 + dx
    oy = (H - nh) // 2 + dy
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(r, (ox, oy), r)
    return Image.alpha_composite(base, layer)


def load_seq_paths(subdir: Path) -> list[Path]:
    files = sorted(subdir.glob("frame-*.png"))
    if not files:
        raise FileNotFoundError(f"No frame-*.png in {subdir}")
    return files


def draw_captions(img: Image.Image, t_abs: float, captions: list, font_cap):
    active = None
    for c in captions:
        if c["start"] <= t_abs <= c["end"]:
            active = c
            break
    if not active:
        return
    words = active["text"].split()
    emph = set(w.upper().strip(".,!?") for w in active.get("emphasis", []))
    d = ImageDraw.Draw(img, "RGBA")
    space_w = d.textlength(" ", font=font_cap)
    widths = [d.textlength(w, font=font_cap) for w in words]
    total_w = sum(widths) + space_w * max(0, len(words) - 1)
    x = (W - total_w) / 2.0
    y = H - 122

    pad_x, pad_y = 28, 14
    d.rounded_rectangle(
        [x - pad_x, y - pad_y, x + total_w + pad_x, y + 62 + pad_y],
        radius=12,
        fill=(8, 12, 18, 190),
    )
    for w, ww in zip(words, widths):
        clean = w.upper().strip(".,!?")
        col = (255, 224, 72, 255) if clean in emph else (250, 250, 250, 255)
        for ox, oy in ((-3, 0), (3, 0), (0, -3), (0, 3), (-2, -2), (2, 2)):
            d.text((x + ox, y + oy), w, fill=(10, 14, 18, 255), font=font_cap)
        d.text((x, y), w, fill=col, font=font_cap)
        x += ww + space_w


def main():
    captions = json.loads((CH_DIR / "assets" / "chapter-voice.json").read_text(encoding="utf-8"))
    font_cap = load_font(54, bold=True)

    lead_floor_p = load_seq_paths(WORK_3D / "lead-floor")
    lead_ots_p = load_seq_paths(WORK_3D / "lead-ots")
    witch_sob_p = load_seq_paths(WORK_3D / "witch-sob")
    boot_macro_p = load_seq_paths(WORK_3D / "boot-macro-glass")
    boot_tracks = json.loads((WORK_3D / "boot-macro-tracks.json").read_text(encoding="utf-8"))["frames"]
    lead_freeze_p = load_seq_paths(WORK_3D / "lead-freeze")
    witch_alert_p = load_seq_paths(WORK_3D / "witch-alert")
    hand_pov = Image.open(WORK_3D / "hand-gloved-pov.png").convert("RGBA")

    # 2D illustrated ECU-dread crop from face-angles.png
    fa = Image.open(REPO_ROOT / "assets" / "series-lead" / "face-angles.png").convert("RGBA")
    fw, fh = fa.size
    ecu_crop = fa.crop((int(fw * 0.675), int(fh * 0.545), int(fw * 0.972), int(fh * 0.875)))
    ecu_crop = ImageEnhance.Brightness(ecu_crop).enhance(0.70)
    ecu_crop = ImageEnhance.Color(ecu_crop).enhance(0.84)

    sky_bg = make_night_sky_backdrop(horizon_y=540)
    grain = make_grain_tile()
    grain_rgba = Image.merge("RGBA", (grain, grain, grain, Image.new("L", (W, H), 22)))
    vignette = make_vignette()

    voice_wav = CH_DIR / "assets" / "chapter-voice.wav"
    score_wav = CH_DIR / "assets" / "score.wav"

    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-vcodec", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-ss", str(SLICE_START), "-t", str(SLICE_DUR), "-i", str(voice_wav),
        "-ss", str(SLICE_START), "-t", str(SLICE_DUR), "-i", str(score_wav),
        "-filter_complex",
        "[1:a]volume=1.05[v];[2:a]volume=0.82[s];[v][s]amix=inputs=2:duration=shortest:dropout_transition=0[aout]",
        "-map", "0:v", "-map", "[aout]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(OUT_MP4),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    # Preload small repeated sequences; stream larger 3D-set sequences on demand to keep RAM low
    witch_sob_imgs = [Image.open(p).convert("RGBA") for p in witch_sob_p]

    for f in range(TOTAL_FRAMES):
        t = f / FPS
        t_abs = SLICE_START + t

        # Subtle pulsing red Apex Tower beacon on 2D sky
        frame = sky_bg.copy()
        d_sky = ImageDraw.Draw(frame, "RGBA")
        ba = int(170 + 85 * math.sin(t * 3.4))
        d_sky.ellipse([1556, 80, 1580, 104], fill=(235, 38, 42, ba))

        if t < 2.8:
            # Shot 1: 3D Lead physically walking across 3D civic-plaza flagstones (real 3D travel + push-in!)
            idx = min(len(lead_floor_p) - 1, f)
            fg = Image.open(lead_floor_p[idx]).convert("RGBA")
            frame = Image.alpha_composite(frame, fg)

        elif t < 5.8:
            # Shot 2: 3D Lead 3q-back-ots creeping forward on 3D civic-plaza + sobbing Witch by fountain
            local_f = f - int(round(2.8 * FPS))
            p = (t - 2.8) / 3.0
            idx = min(len(lead_ots_p) - 1, local_f)
            fg = Image.open(lead_ots_p[idx]).convert("RGBA")
            frame = Image.alpha_composite(frame, fg)
            # Composite sobbing Witch in front of the 3D stone fountain (scaled gently with the 3D push-in!)
            w_img = witch_sob_imgs[local_f % len(witch_sob_imgs)]
            frame = paste_scaled(frame, w_img, scale=0.40 + 0.05 * p, dx=120, dy=20)

        elif t < 8.6:
            # Shot 3: 3D boot-macro crushing 3D inked glass shards on 3D civic-plaza flagstones!
            # Map t=5.8->6.8 (30f) to frames 0..29 (approach -> contact at f=30), t=6.8->7.4 (18f) to 30..47 (scatter!), then hold
            local_f = f - int(round(5.8 * FPS))
            bm_idx = min(len(boot_macro_p) - 1, local_f)
            shake_x = int(math.sin(f * 3.7) * 10) if 6.78 <= t <= 7.06 else 0
            shake_y = int(math.cos(f * 4.3) * 8) if 6.78 <= t <= 7.06 else 0
            fg = Image.open(boot_macro_p[bm_idx]).convert("RGBA")
            frame = paste_scaled(frame, fg, scale=1.0, dx=shake_x, dy=shake_y)

            # Pixel-locked 2D impact star-glint & micro-splinters right at the crushed sole!
            if 6.78 <= t <= 7.18:
                bones = boot_tracks[bm_idx]["bones"]
                cx = int(bones["foot_L"]["x"]) + shake_x
                cy = int(bones["foot_L"]["y"]) + shake_y
                bt = (t - 6.78) / 0.40
                d = ImageDraw.Draw(frame, "RGBA")
                if bt < 0.28:
                    r = int(40 * (1.0 - bt * 2.5))
                    d.line([(cx - r, cy), (cx + r, cy)], fill=(245, 254, 255, 240), width=4)
                    d.line([(cx, cy - r), (cx, cy + r)], fill=(245, 254, 255, 240), width=4)
                    d.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=(225, 250, 255, 210))
                for k in range(8):
                    ang = -math.pi * 0.08 - (k / 7.0) * math.pi * 0.84
                    dist = 18 + bt * 150
                    sx, sy = cx + math.cos(ang) * dist, cy + math.sin(ang) * dist * 0.65
                    a = int((1.0 - bt) * 230)
                    d.polygon([(sx, sy - 6), (sx + 8, sy + 5), (sx - 6, sy + 6)], fill=(210, 246, 255, a))

        elif t < 11.0:
            # Shot 4: 3D Lead 3q-front frozen dead still on 3D civic-plaza with REAL 3D camera push-in!
            local_f = f - int(round(8.6 * FPS))
            idx = min(len(lead_freeze_p) - 1, local_f)
            fg = Image.open(lead_freeze_p[idx]).convert("RGBA")
            frame = Image.alpha_composite(frame, fg)

        elif t < 14.6:
            # Shot 5: 3D Witch 3q-front alert-lift on 3D civic-plaza with REAL 3D camera push-in (0.22)!
            local_f = f - int(round(11.0 * FPS))
            idx = min(len(witch_alert_p) - 1, local_f)
            fg = Image.open(witch_alert_p[idx]).convert("RGBA")
            frame = Image.alpha_composite(frame, fg)

        elif t < 17.1:
            # Shot 6: 2D Illustrated ECU Dread (face-angles.png, smooth 30fps push-in)
            p = (t - 14.6) / 2.5
            frame = Image.new("RGBA", (W, H), (12, 17, 24, 255))
            sc = max(W / ecu_crop.width, H / ecu_crop.height) * (0.96 + 0.08 * p)
            frame = paste_scaled(frame, ecu_crop, scale=sc, dx=int(-15 * p), dy=-155 + int(10 * p))

        else:
            # Shot 7: 3D 5-Finger Gloved POV Hand trembling over the 3D alerted Witch plaza!
            p = (t - 17.1) / 2.5
            bg3d = Image.open(witch_alert_p[-1]).convert("RGBA")
            frame = Image.alpha_composite(frame, bg3d)
            tx = int(math.sin(f * 1.5) * 4)
            ty = int(math.cos(f * 1.9) * 3)
            frame = paste_scaled(frame, hand_pov, scale=1.08 + 0.03 * p, dx=110 + tx, dy=110 + ty)

        # Shared cutout paper grain + cinematic vignette
        frame = Image.alpha_composite(frame, grain_rgba)
        frame = Image.alpha_composite(frame, vignette)

        # Timed white + yellow emphasis captions
        draw_captions(frame, t_abs, captions, font_cap)

        proc.stdin.write(frame.convert("RGB").tobytes())

    proc.stdin.close()
    rc = proc.wait()
    if rc != 0:
        raise RuntimeError(f"FFmpeg exited with code {rc}")
    print(f"Saved {OUT_MP4} (30 fps, {TOTAL_FRAMES} frames)")


if __name__ == "__main__":
    main()
