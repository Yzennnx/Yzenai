#!/usr/bin/env python3
"""Phase 3 Visual QA Contact Sheet Generator for the 5 Cel-Shaded 3D Infected Rigs.

Runs as a standard Python 3 script (NOT inside Blender), invoking headless Blender
serially via `tools/blender-rig/render-shot.py` for each of the 15 panels (5 rows x 3 cols)
and compositing them into `assets/series-lead/infected-sheet.png` matching the exact
cream paper backdrop (#f4efe6), typography, and card borders of `angles-sheet.png`.

Usage:
  python3 tools/blender-rig/generate-infected-sheet.py [--samples 6] [--out assets/series-lead/infected-sheet.png]
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
ASSETS_LEAD = REPO_ROOT / "assets" / "series-lead"
INFECTED_RIG_DIR = ASSETS_LEAD / "rig-3d" / "infected"
RENDER_SCRIPT = SCRIPT_DIR / "render-shot.py"
DEFAULT_OUT = ASSETS_LEAD / "infected-sheet.png"

# 5 rows x 3 columns = 15 panels
# Each panel: (card_title, camera, action, lighting)
SHEET_ROWS = [
    (
        "hunter",
        "HUNTER",
        "Agile crouched ambusher · torn navy hoodie & taped claws",
        (66, 86, 114),
        [
            ("3/4 Front Stance", "3q-front", "infected-idle", "neutral-day"),
            ("Side Perch Crouch", "side", "hunter-crouch-perch", "neutral-day"),
            ("Low-24mm Pounce Launch", "low-24mm", "hunter-pounce-launch", "horror-dark-rim"),
            ("Horror Face Close-Up", "face-closeup", "infected-idle", "horror-dark-rim"),
        ],
    ),
    (
        "smoker",
        "SMOKER",
        "Tall gaunt hunched stalker · tattered olive shirt & spore blisters",
        (82, 108, 78),
        [
            ("3/4 Front Stance", "3q-front", "infected-idle", "neutral-day"),
            ("Side Rooftop Snare", "side", "smoker-rooftop-snare", "neutral-day"),
            ("Low-24mm Rooftop Snare", "low-24mm", "smoker-rooftop-snare", "horror-dark-rim"),
            ("Horror Face Close-Up", "face-closeup", "infected-idle", "horror-dark-rim"),
        ],
    ),
    (
        "witch",
        "WITCH",
        "Slender crouched weeper · elongated crimson claws & hair drape",
        (132, 68, 86),
        [
            ("3/4 Front Sobbing", "3q-front", "witch-sobbing", "neutral-day"),
            ("Side Sobbing", "side", "witch-sobbing", "neutral-day"),
            ("3/4 Front Alert Lift", "3q-front", "witch-alert-lift", "horror-dark-rim"),
            ("Horror Face Close-Up", "face-closeup", "witch-alert-lift", "horror-dark-rim"),
        ],
    ),
    (
        "charger",
        "CHARGER",
        "Asymmetric heavy rusher · massive right arm & torn overalls",
        (124, 84, 60),
        [
            ("3/4 Front Stance", "3q-front", "infected-idle", "neutral-day"),
            ("Side Bull Charge", "side", "charger-bull-charge", "neutral-day"),
            ("Low-24mm Bull Charge", "low-24mm", "charger-bull-charge", "horror-dark-rim"),
            ("Horror Face Close-Up", "face-closeup", "infected-idle", "horror-dark-rim"),
        ],
    ),
    (
        "tank",
        "TANK",
        "Massive 2.25m brute · oversized forearms & overhead slab heave",
        (114, 62, 58),
        [
            ("3/4 Front Stance", "3q-front", "infected-idle", "neutral-day"),
            ("Side Slab Heave", "side", "tank-slab-heave", "neutral-day"),
            ("Low-24mm Slab Heave", "low-24mm", "tank-slab-heave", "horror-dark-rim"),
            ("Horror Face Close-Up", "face-closeup", "infected-idle", "horror-dark-rim"),
        ],
    ),
]


def resolve_blender() -> str:
    env_bin = os.environ.get("BLENDER_BIN")
    if env_bin:
        return env_bin
    if sys.platform == "win32":
        for cand in (
            r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe",
            r"C:\Program Files\Blender Foundation\Blender\blender.exe",
        ):
            if Path(cand).exists():
                return cand
        return "blender.exe"
    return shutil.which("blender") or "blender"


def get_font(size: int, bold: bool = False):
    candidates = [
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf",
        "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def fit_paste(canvas: Image.Image, img: Image.Image, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    scale = min(bw / img.width, bh / img.height)
    nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = x0 + (bw - nw) // 2
    oy = y0 + (bh - nh) // 2
    canvas.alpha_composite(resized, (ox, oy))


def render_panel(
    blender_bin: str,
    rig: str,
    camera: str,
    action: str,
    lighting: str,
    out_png: Path,
    width: int,
    height: int,
    samples: int,
) -> Image.Image:
    blend_path = INFECTED_RIG_DIR / f"{rig}-rig.blend"
    if not blend_path.exists():
        raise FileNotFoundError(f"Missing infected rig blend file: {blend_path}")

    cmd = [
        blender_bin,
        "--background",
        str(blend_path),
        "--python",
        str(RENDER_SCRIPT),
        "--",
        "--rig",
        rig,
        "--camera",
        camera,
        "--action",
        action,
        "--lighting",
        lighting,
        "--frame",
        "1",
        "--width",
        str(width),
        "--height",
        str(height),
        "--samples",
        str(samples),
        "--out",
        str(out_png),
    ]
    print(f"  [render] {rig:<7s} | cam={camera:<9s} | act={action:<20s} | light={lighting}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not out_png.exists():
        raise RuntimeError(
            f"Blender failed for {rig} ({camera}/{action}) with exit code {res.returncode}.\n"
            f"STDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}"
        )
    return Image.open(out_png).convert("RGBA")


def build_infected_sheet(out_path: Path, samples: int = 6, render_w: int = 540, render_h: int = 760) -> None:
    blender_bin = resolve_blender()
    print(f"=== Generating {out_path} (5x3 = 15 panels via {blender_bin}) ===")

    # Exact cream paper backdrop (#f4efe6) and 5x4 card styling matching angles-sheet.png
    W, H = 2940, 3260
    sheet = Image.new("RGBA", (W, H), (244, 239, 230, 255))
    d = ImageDraw.Draw(sheet)

    f_title = get_font(44, bold=True)
    f_sub = get_font(22)
    f_row = get_font(24, bold=True)
    f_row_sub = get_font(18)
    f_lbl = get_font(21, bold=True)
    f_cap = get_font(16)

    d.text((54, 34), "SPECIAL INFECTED CAST — 3D HORROR CEL-SHADED REFERENCE SHEET", fill=(37, 58, 59), font=f_title)
    d.text(
        (54, 92),
        "Blender 5.2 3-tone horror cel shader + grime/rim + GPv3 #253a3b ink + face-closeup angle | Parity with Series Lead",
        fill=(90, 102, 100),
        font=f_sub,
    )

    pad_x = 54
    top_y = 148
    bottom_pad = 44
    col_gap = 24
    row_gap = 26
    row_hdr_h = 38
    cols = 4
    rows = len(SHEET_ROWS)

    cw = (W - pad_x * 2 - col_gap * (cols - 1)) // cols
    row_total_h = (H - top_y - bottom_pad - row_gap * (rows - 1)) // rows
    ch = row_total_h - row_hdr_h - 8

    with tempfile.TemporaryDirectory(prefix="infected-sheet-") as tmp_dir:
        tmp = Path(tmp_dir)
        for r_idx, (rig, display_name, desc, accent_rgb, panels) in enumerate(SHEET_ROWS):
            ry0 = top_y + r_idx * (row_total_h + row_gap)

            # Row accent pill + description header
            pill_w = 156
            d.rounded_rectangle([pad_x, ry0, pad_x + pill_w, ry0 + row_hdr_h], radius=6, fill=(*accent_rgb, 255))
            d.text((pad_x + 16, ry0 + 6), display_name, fill=(250, 246, 238), font=f_row)
            d.text((pad_x + pill_w + 18, ry0 + 9), desc, fill=(76, 88, 86), font=f_row_sub)

            cy0 = ry0 + row_hdr_h + 8
            cy1 = cy0 + ch

            for c_idx, (card_title, cam, act, light) in enumerate(panels):
                cx0 = pad_x + c_idx * (cw + col_gap)
                cx1 = cx0 + cw

                is_dark = light in ("horror-dark-rim", "flashlight-spot")
                bg_c = (34, 44, 56, 255) if is_dark else (250, 246, 238, 255)
                d.rectangle([cx0, cy0, cx1, cy1], fill=bg_c, outline=(198, 190, 174), width=2)

                panel_png = tmp / f"{rig}-{c_idx}-{cam}-{act}.png"
                img3d = render_panel(
                    blender_bin=blender_bin,
                    rig=rig,
                    camera=cam,
                    action=act,
                    lighting=light,
                    out_png=panel_png,
                    width=render_w,
                    height=render_h,
                    samples=samples,
                )
                img_box = (cx0 + 10, cy0 + 10, cx1 - 10, cy1 - 72)
                fit_paste(sheet, img3d, img_box)

                # Bottom label bar matching angles-sheet.png
                d.rectangle([cx0, cy1 - 66, cx1, cy1], fill=(247, 242, 231, 255))
                d.line([(cx0, cy1 - 66), (cx1, cy1 - 66)], fill=(210, 202, 186), width=2)
                d.text((cx0 + 14, cy1 - 58), f"{display_name.title()} — {card_title}", fill=(32, 48, 50), font=f_lbl)
                d.text((cx0 + 14, cy1 - 30), f"cam: {cam}  ·  action: {act}  ·  {light}", fill=(96, 106, 104), font=f_cap)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, "PNG")
    print(f"Saved {out_path} ({W}x{H})")


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate 5x3 cel-shaded 3D infected reference sheet")
    ap.add_argument("--samples", type=int, default=6, help="EEVEE TAA render samples per panel (default: 6)")
    ap.add_argument("--width", type=int, default=540, help="Per-panel Blender render width (default: 540)")
    ap.add_argument("--height", type=int, default=760, help="Per-panel Blender render height (default: 760)")
    ap.add_argument("--out", default=str(DEFAULT_OUT), help="Output PNG path")
    args = ap.parse_args()
    build_infected_sheet(Path(args.out), samples=args.samples, render_w=args.width, render_h=args.height)


if __name__ == "__main__":
    main()
