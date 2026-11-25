#!/usr/bin/env python3
"""Phase 2 Serial Reference Pack & Silent Proof Reel Generator.

Runs inside a single headless Blender 5.2.4 LTS session (strictly serial renders!)
to produce all 5 Phase 2 deliverables:
  1. assets/series-lead/angles-sheet-v2.png
  2. assets/series-lead/universal-actions-sheet.png
  3. assets/series-lead/framing-cheatsheet.png
  4. assets/series-lead/hybrid-seam-check.png
  5. assets/series-lead/rig-3d/camera-proof-reel.mp4 (7.0s silent H.264 1080x1920)

Usage:
  blender --background assets/series-lead/rig-3d/lead-rig.blend \
    --python tools/blender-rig/generate-references.py -- [--only angles|actions|framing|seam|reel|all]
"""

import argparse
import importlib.util
import json
import math
import subprocess
import sys
import tempfile
from pathlib import Path

import bpy
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
ASSETS_LEAD = REPO_ROOT / "assets" / "series-lead"
RIG_3D = ASSETS_LEAD / "rig-3d"


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


RS = load_module("render_shot", SCRIPT_DIR / "render-shot.py")
BLR = load_module("build_lead_rig", SCRIPT_DIR / "build-lead-rig.py")
CAMERAS = json.loads((SCRIPT_DIR / "cameras.json").read_text(encoding="utf-8"))
ACTIONS = json.loads((SCRIPT_DIR / "actions.json").read_text(encoding="utf-8"))
LIGHTINGS = json.loads((SCRIPT_DIR / "lighting.json").read_text(encoding="utf-8"))


def get_font(size, bold=False):
    candidates = [
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf",
        "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Regular.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def clear_temp_props():
    for o in list(bpy.data.objects):
        if o.name.startswith("LeadProp_"):
            bpy.data.objects.remove(o, do_unlink=True)


def render_still_img(
    camera="3q-front",
    action="idle-alert",
    expression=None,
    lighting="neutral-day",
    gloves="off",
    backpack="off",
    condition="clean",
    prop="none",
    frame=1,
    width=540,
    height=960,
    samples=6,
    push_in=0.0,
    tmp_dir=None,
):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = samples
    scene.render.film_transparent = True
    scene.render.fps = 24
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"

    clear_temp_props()
    arm_obj = bpy.data.objects["LeadArmature"]
    act_cfg = ACTIONS[action]
    expr = expression or act_cfg.get("expression", "head")
    if prop != "none" or action in ("sprint-cycle", "inspect-object-hand", "sip-eat-prop"):
        hp = "grip"
    elif action in ("brace-push-wall", "crawl-scramble", "bed-wake-situp"):
        hp = "open-flat"
    else:
        hp = "relaxed"
    BLR.apply_rig_state(arm_obj, expression=expr, gloves=gloves, backpack=backpack, condition=condition, hand_pose=hp)
    RS.attach_simple_prop(scene, prop, BLR.hex_to_lin)
    RS.setup_lighting(scene, LIGHTINGS[lighting])
    RS.setup_action(scene, arm_obj, act_cfg, frame, frame)
    scene.frame_set(frame)
    cam_obj = RS.setup_camera(scene, CAMERAS[camera], width, height, frame=frame, push_in=push_in)
    bpy.context.view_layer.update()

    out_png = Path(tmp_dir) / "still.png"
    scene.render.filepath = str(out_png)
    bpy.ops.render.render(write_still=True)
    return Image.open(out_png).convert("RGBA"), cam_obj


def add_paper_grain(img_rgba, seed=42, strength=14):
    """Apply shared cutout paper grain + subtle radial vignette."""
    arr = np.array(img_rgba, dtype=np.int16)
    rng = np.random.default_rng(seed)
    noise = rng.integers(-strength, strength + 1, size=(arr.shape[0], arr.shape[1], 1), dtype=np.int16)
    arr[:, :, :3] = np.clip(arr[:, :, :3] + noise, 0, 255)
    # Subtle vignette
    h, w = arr.shape[:2]
    yy, xx = np.ogrid[:h, :w]
    dist = ((xx - w * 0.5) / (w * 0.62)) ** 2 + ((yy - h * 0.5) / (h * 0.62)) ** 2
    vig = np.clip(1.0 - 0.28 * dist, 0.68, 1.0)[:, :, None]
    arr[:, :, :3] = np.clip((arr[:, :, :3] * vig).astype(np.int16), 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGBA")


def draw_corridor_bg(w, h, horizon_y_frac=0.52, vp_x_frac=0.50, tint="horror", exit_sign=True):
    """Draw a clean perspective-matched 2D cutout corridor background."""
    bg = Image.new("RGBA", (w, h), (16, 22, 30, 255))
    d = ImageDraw.Draw(bg)
    vx, vy = int(w * vp_x_frac), int(h * horizon_y_frac)

    if tint == "horror":
        ceil_c, wall_l, wall_r, floor_c, line_c = (14, 19, 27), (22, 30, 40), (18, 25, 34), (26, 32, 38), (44, 58, 72)
    elif tint == "cctv":
        ceil_c, wall_l, wall_r, floor_c, line_c = (28, 34, 34), (42, 50, 48), (36, 44, 42), (48, 54, 52), (72, 82, 78)
    else:
        ceil_c, wall_l, wall_r, floor_c, line_c = (218, 212, 198), (232, 225, 210), (224, 216, 200), (195, 188, 174), (140, 134, 122)

    # Ceiling, floor, left/right walls converging cleanly to (vx, vy)
    d.polygon([(0, 0), (w, 0), (vx + int(w * 0.12), vy - int(h * 0.08)), (vx - int(w * 0.12), vy - int(h * 0.08))], fill=ceil_c)
    d.polygon([(0, h), (w, h), (vx + int(w * 0.12), vy + int(h * 0.08)), (vx - int(w * 0.12), vy + int(h * 0.08))], fill=floor_c)
    d.polygon([(0, 0), (vx - int(w * 0.12), vy - int(h * 0.08)), (vx - int(w * 0.12), vy + int(h * 0.08)), (0, h)], fill=wall_l)
    d.polygon([(w, 0), (vx + int(w * 0.12), vy - int(h * 0.08)), (vx + int(w * 0.12), vy + int(h * 0.08)), (w, h)], fill=wall_r)
    # Far back wall
    bw = int(w * 0.12)
    bh = int(h * 0.08)
    d.rectangle([vx - bw, vy - bh, vx + bw, vy + bh], fill=(10, 14, 20), outline=line_c, width=2)

    # Perspective floor tiles & wall ribs
    for t in (0.18, 0.34, 0.54, 0.78, 1.0):
        lx = int(vx - bw - (vx - bw) * t)
        rx = int(vx + bw + (w - (vx + bw)) * t)
        fy = int(vy + bh + (h - (vy + bh)) * t)
        cy = int(vy - bh - (vy - bh) * t)
        d.line([(lx, fy), (rx, fy)], fill=line_c, width=2)
        d.line([(lx, cy), (lx, fy)], fill=line_c, width=2)
        d.line([(rx, cy), (rx, fy)], fill=line_c, width=2)
    for sx in (-0.8, -0.4, 0.0, 0.4, 0.8):
        d.line([(vx + int(bw * sx), vy + bh), (int(w * (0.5 + sx * 0.65)), h)], fill=line_c, width=2)

    if exit_sign and tint == "horror":
        d.rectangle([vx - 26, vy - bh + 6, vx + 26, vy - bh + 24], fill=(42, 180, 112), outline=(20, 90, 56), width=2)
    return bg


def fit_paste(canvas, img, box):
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    scale = min(bw / img.width, bh / img.height)
    nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = x0 + (bw - nw) // 2
    oy = y0 + (bh - nh) // 2
    canvas.alpha_composite(resized, (ox, oy))


def build_angles_sheet(tmp_dir):
    print("\n=== Generating assets/series-lead/angles-sheet-v2.png ===")
    W, H = 2400, 1480
    sheet = Image.new("RGBA", (W, H), (242, 236, 222, 255))
    d = ImageDraw.Draw(sheet)
    f_title = get_font(44, bold=True)
    f_sub = get_font(22)
    f_lbl = get_font(22, bold=True)
    f_cap = get_font(17)

    d.text((54, 34), "SERIES LEAD — 8-ANGLE TRUE-PERSPECTIVE SHEET (HYBRID 3D CEL RIG)", fill=(37, 58, 59), font=f_title)
    d.text((54, 92), "Blender 5.2 flat 2-tone cel shader + GPv3 #253a3b ink outlines | Side-by-side parity vs. legacy 2D reference-sheet.png", fill=(90, 102, 100), font=f_sub)

    # 2 rows x 4 columns (first cell is 2D vs 3D side parity!)
    specs = [
        ("2D vs 3D Side Parity", "Legacy 2D (L) vs 3D Cel Rig (R)", "side", "idle-alert", "head", "neutral-day", "none", True),
        ("3/4 Front Hero", "Diagonal walk (45mm)", "3q-front", "walk-cycle", "head-notice", "neutral-day", "none", False),
        ("3/4 Back OTS", "Cheek/jaw + shoulder (38mm)", "3q-back-ots", "idle-alert", "head-dread", "horror-dark-rim", "none", False),
        ("True Low-Angle", "24mm worm's-eye confrontation", "low-24mm", "idle-alert", "head-determined", "neutral-day", "none", False),
        ("High-Angle Cornered", "32mm downward vulnerability", "high-cornered", "hunch-nausea-pain", "head-alarm", "horror-dark-rim", "none", False),
        ("Overhead / Top-Down", "35mm geography reset", "overhead", "walk-cycle", "head", "neutral-day", "none", False),
        ("Grounded POV Arms", "28mm anchored sleeves + flashlight", "pov-arms", "inspect-object-hand", "head-notice", "flashlight-spot", "flashlight", False),
        ("Floor-Level / Boots", "28mm under-bed / low hallway", "floor-level", "walk-cycle", "head", "horror-dark-rim", "none", False),
    ]

    ref2d = Image.open(ASSETS_LEAD / "reference-sheet.png").convert("RGBA")
    # Crop Side Lead panel from reference-sheet.png (middle top card)
    rw, rh = ref2d.size
    side_2d_crop = ref2d.crop((int(rw * 0.36), int(rh * 0.13), int(rw * 0.64), int(rh * 0.43)))

    pad_x, pad_y = 54, 146
    gap = 24
    cols, rows = 4, 2
    cw = (W - pad_x * 2 - gap * (cols - 1)) // cols
    ch = (H - pad_y - 44 - gap * (rows - 1)) // rows

    for idx, (title, sub, cam, act, expr, light, prop, is_parity) in enumerate(specs):
        r, c = divmod(idx, cols)
        x0 = pad_x + c * (cw + gap)
        y0 = pad_y + r * (ch + gap)
        x1, y1 = x0 + cw, y0 + ch
        bg_c = (24, 31, 40, 255) if light in ("horror-dark-rim", "flashlight-spot") else (250, 246, 238, 255)
        d.rectangle([x0, y0, x1, y1], fill=bg_c, outline=(198, 190, 174), width=2)

        img_box = (x0 + 10, y0 + 10, x1 - 10, y1 - 76)
        if is_parity:
            mid = (img_box[0] + img_box[2]) // 2
            fit_paste(sheet, side_2d_crop, (img_box[0], img_box[1], mid - 4, img_box[3]))
            img3d, _ = render_still_img(camera=cam, action=act, expression=expr, lighting=light, prop=prop, width=480, height=720, tmp_dir=tmp_dir)
            fit_paste(sheet, img3d, (mid + 4, img_box[1], img_box[2], img_box[3]))
            d.line([(mid, img_box[1] + 10), (mid, img_box[3] - 10)], fill=(190, 182, 168), width=2)
        else:
            img3d, _ = render_still_img(camera=cam, action=act, expression=expr, lighting=light, prop=prop, width=540, height=840, tmp_dir=tmp_dir)
            fit_paste(sheet, img3d, img_box)

        # Label bar
        d.rectangle([x0, y1 - 70, x1, y1], fill=(247, 242, 231, 255))
        d.line([(x0, y1 - 70), (x1, y1 - 70)], fill=(210, 202, 186), width=2)
        d.text((x0 + 14, y1 - 60), title, fill=(32, 48, 50), font=f_lbl)
        d.text((x0 + 14, y1 - 32), sub, fill=(96, 106, 104), font=f_cap)

    out = ASSETS_LEAD / "angles-sheet-v2.png"
    sheet.save(out, "PNG")
    print(f"Saved {out}")


def build_actions_sheet(tmp_dir):
    print("\n=== Generating assets/series-lead/universal-actions-sheet.png ===")
    W, H = 2640, 1760
    sheet = Image.new("RGBA", (W, H), (242, 236, 222, 255))
    d = ImageDraw.Draw(sheet)
    f_title = get_font(44, bold=True)
    f_sub = get_font(22)
    f_lbl = get_font(19, bold=True)
    f_cat = get_font(15)

    d.text((54, 30), "UNIVERSAL ACTION LIBRARY — 18 REUSABLE 3D POSES & CYCLES", fill=(37, 58, 59), font=f_title)
    d.text((54, 86), "Rendered from tools/blender-rig/actions.json (usable from any camera preset in cameras.json)", fill=(90, 102, 100), font=f_sub)

    action_keys = [k for k in ACTIONS if not k.startswith("_")]
    cols, rows = 6, 3
    pad_x, pad_y, gap = 48, 138, 18
    cw = (W - pad_x * 2 - gap * (cols - 1)) // cols
    ch = (H - pad_y - 38 - gap * (rows - 1)) // rows

    cat_colors = {
        "locomotion": (56, 106, 128),
        "domestic": (118, 88, 62),
        "extremes": (146, 72, 54),
        "horror": (88, 52, 74),
    }

    for idx, key in enumerate(action_keys):
        r, c = divmod(idx, cols)
        x0 = pad_x + c * (cw + gap)
        y0 = pad_y + r * (ch + gap)
        x1, y1 = x0 + cw, y0 + ch
        d.rectangle([x0, y0, x1, y1], fill=(250, 246, 238, 255), outline=(198, 190, 174), width=2)

        prop = "mug" if key == "sip-eat-prop" else ("phone" if key == "inspect-object-hand" else "none")
        cam = "low-24mm" if key in ("knockdown-ground-back", "crawl-scramble") else "3q-front"
        img, _ = render_still_img(camera=cam, action=key, lighting="neutral-day", prop=prop, width=420, height=640, samples=6, tmp_dir=tmp_dir)
        fit_paste(sheet, img, (x0 + 8, y0 + 8, x1 - 8, y1 - 62))

        cat = ACTIONS[key].get("category", "action")
        d.rectangle([x0, y1 - 56, x1, y1], fill=(246, 240, 228, 255))
        d.line([(x0, y1 - 56), (x1, y1 - 56)], fill=(210, 202, 186), width=2)
        d.text((x0 + 12, y1 - 48), key, fill=(30, 44, 46), font=f_lbl)
        d.text((x0 + 12, y1 - 24), f"{cat.upper()} · {'CYCLE' if ACTIONS[key].get('cycle') else 'POSE'}", fill=cat_colors.get(cat, (80, 90, 90)), font=f_cat)

    out = ASSETS_LEAD / "universal-actions-sheet.png"
    sheet.save(out, "PNG")
    print(f"Saved {out}")


def build_framing_cheatsheet(tmp_dir):
    print("\n=== Generating assets/series-lead/framing-cheatsheet.png ===")
    W, H = 2500, 1120
    sheet = Image.new("RGBA", (W, H), (242, 236, 222, 255))
    d = ImageDraw.Draw(sheet)
    f_title = get_font(42, bold=True)
    f_sub = get_font(21)
    f_lbl = get_font(20, bold=True)
    f_cap = get_font(16)

    d.text((48, 28), "FRAMING & 3-DEPTH-PLANE CHEAT SHEET (FOREGROUND + MIDGROUND + BACKGROUND)", fill=(37, 58, 59), font=f_title)
    d.text((48, 82), "Standard horror & 'What If' staging templates pairing Blender cel-shaded rig layers with perspective-matched 2D environments", fill=(90, 102, 100), font=f_sub)

    pw, ph = 452, 804  # exact 9:16 portrait panels
    gap = 36
    start_x = (W - (pw * 5 + gap * 4)) // 2
    y0 = 140

    templates = [
        ("1. Corridor OTS", "3q-back-ots + dark foreground edge", "3q-back-ots", "idle-alert", "horror-dark-rim", "none", "ots"),
        ("2. Doorframe Peek POV", "pov-peek + left jamb + flashlight", "pov-peek", "inspect-object-hand", "flashlight-spot", "flashlight", "peek"),
        ("3. Locker Vents", "3q-front stealth behind dark slats", "3q-front", "stealth-crouch-walk", "horror-dark-rim", "none", "locker"),
        ("4. Under-Bed Boots", "floor-level walk under bed skirt", "floor-level", "walk-cycle", "horror-dark-rim", "none", "underbed"),
        ("5. CCTV Corner Cam", "cctv-wide + scanlines + REC HUD", "cctv-wide", "glance-back-startle", "overhead-fluorescent", "none", "cctv"),
    ]

    for idx, (title, sub, cam, act, light, prop, fg_mode) in enumerate(templates):
        x0 = start_x + idx * (pw + gap)
        bg = draw_corridor_bg(pw, ph, horizon_y_frac=0.48 if fg_mode != "cctv" else 0.34, vp_x_frac=0.52, tint="cctv" if fg_mode == "cctv" else "horror")
        char_img, _ = render_still_img(camera=cam, action=act, lighting=light, prop=prop, width=pw, height=ph, samples=6, tmp_dir=tmp_dir)
        bg.alpha_composite(char_img)

        fg = ImageDraw.Draw(bg)
        if fg_mode == "ots":
            # Subtle dark doorway pillar on far left edge for depth framing
            fg.rectangle([0, 0, 38, ph], fill=(7, 10, 15, 245))
        elif fg_mode == "peek":
            # Left 22% dark doorframe occluder + soft flashlight cone (keeps POV hand & flashlight fully visible)
            cone = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
            cd = ImageDraw.Draw(cone)
            cd.polygon([(int(pw * 0.44), int(ph * 0.62)), (pw, int(ph * 0.25)), (pw, int(ph * 0.65))], fill=(255, 244, 196, 62))
            cone = cone.filter(ImageFilter.GaussianBlur(14))
            bg.alpha_composite(cone)
            fg = ImageDraw.Draw(bg)
            fg.rectangle([0, 0, int(pw * 0.22), ph], fill=(8, 11, 16, 250))
            fg.line([(int(pw * 0.22), 0), (int(pw * 0.22), ph)], fill=(40, 50, 62, 255), width=4)
        elif fg_mode == "locker":
            # Dark locker frame + horizontal louver vents
            fg.rectangle([0, 0, pw, 150], fill=(8, 12, 16, 248))
            fg.rectangle([0, ph - 165, pw, ph], fill=(8, 12, 16, 248))
            fg.rectangle([0, 0, 34, ph], fill=(8, 12, 16, 248))
            fg.rectangle([pw - 34, 0, pw, ph], fill=(8, 12, 16, 248))
            for sy in range(180, ph - 170, 96):
                fg.rectangle([0, sy, pw, sy + 28], fill=(10, 14, 20, 238))
        elif fg_mode == "underbed":
            # Heavy bed frame across top 38%
            fg.rectangle([0, 0, pw, int(ph * 0.36)], fill=(9, 11, 16, 250))
            fg.line([(0, int(ph * 0.36)), (pw, int(ph * 0.36))], fill=(46, 54, 66, 255), width=5)
        elif fg_mode == "cctv":
            # Subtle scanlines + REC overlay
            for sy in range(0, ph, 6):
                fg.line([(0, sy), (pw, sy)], fill=(0, 0, 0, 42), width=1)
            fg.ellipse([22, 24, 38, 40], fill=(220, 48, 48, 255))
            fg.text((46, 22), "REC  CAM-04  02:14:09", fill=(225, 240, 230, 235), font=f_cap)

        panel = add_paper_grain(bg, seed=100 + idx, strength=10)
        sheet.alpha_composite(panel, (x0, y0))
        d.rectangle([x0, y0, x0 + pw, y0 + ph], outline=(48, 60, 62), width=3)
        d.text((x0 + 4, y0 + ph + 14), title, fill=(32, 48, 50), font=f_lbl)
        d.text((x0 + 4, y0 + ph + 44), sub, fill=(96, 106, 104), font=f_cap)

    out = ASSETS_LEAD / "framing-cheatsheet.png"
    sheet.save(out, "PNG")
    print(f"Saved {out}")


def crop_2d_face_panel(panel_name):
    """Crop a clean 2D face panel from assets/series-lead/face-angles.png with cream card bg keyed to transparent."""
    src = Image.open(ASSETS_LEAD / "face-angles.png").convert("RGBA")
    w, h = src.size
    if panel_name == "eye-dart":
        crop = src.crop((int(w * 0.045), int(h * 0.165), int(w * 0.315), int(h * 0.445)))
        # Flood-fill / key out cream card backdrop (#faf5ea) cleanly while preserving eye sclera
        arr = np.array(crop)
        r, g, b = arr[:, :, 0].astype(int), arr[:, :, 1].astype(int), arr[:, :, 2].astype(int)
        cream_mask = (r > 238) & (g > 230) & (b > 214) & (np.abs(r - g) < 16)
        # Only knock out border-connected cream pixels so white eye sclera stays 100% intact
        from collections import deque
        H, W = cream_mask.shape
        visited = np.zeros((H, W), dtype=bool)
        q = deque()
        for x in range(W):
            if cream_mask[0, x]:
                visited[0, x] = True; q.append((0, x))
            if cream_mask[H - 1, x]:
                visited[H - 1, x] = True; q.append((H - 1, x))
        for y in range(H):
            if cream_mask[y, 0]:
                visited[y, 0] = True; q.append((y, 0))
            if cream_mask[y, W - 1]:
                visited[y, W - 1] = True; q.append((y, W - 1))
        while q:
            cy, cx = q.popleft()
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx] and cream_mask[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))
        arr[visited, 3] = 0
        return Image.fromarray(arr, "RGBA")
    # Bottom-right ECU crash-zoom card (tight crop inside border)
    return src.crop((int(w * 0.675), int(h * 0.575), int(w * 0.955), int(h * 0.865)))


def build_seam_check(tmp_dir):
    print("\n=== Generating assets/series-lead/hybrid-seam-check.png ===")
    W, H = 2240, 1140
    sheet = Image.new("RGBA", (W, H), (242, 236, 222, 255))
    d = ImageDraw.Draw(sheet)
    f_title = get_font(40, bold=True)
    f_sub = get_font(20)
    f_lbl = get_font(20, bold=True)
    f_cap = get_font(16)

    d.text((48, 28), "HYBRID 3D-TO-2D CUT CONTINUITY CHECK (SHARED PALETTE + PAPER GRAIN)", fill=(37, 58, 59), font=f_title)
    d.text((48, 80), "Verifying seamless transitions between Blender cel-shaded body shots and 2D illustrated face close-ups", fill=(90, 102, 100), font=f_sub)

    pw, ph = 500, 820
    gap = 40
    start_x = (W - (pw * 4 + gap * 3)) // 2
    y0 = 140

    # Shot 1: 3D 3q-front walk
    s1 = draw_corridor_bg(pw, ph, horizon_y_frac=0.50, tint="horror")
    c1, _ = render_still_img(camera="3q-front", action="walk-cycle", expression="head-notice", lighting="horror-dark-rim", width=pw, height=ph, samples=6, tmp_dir=tmp_dir)
    s1.alpha_composite(c1)
    s1 = add_paper_grain(s1, seed=11, strength=12)

    # Shot 2: 2D Eye-Dart from face-angles.png composited seamlessly onto dark corridor bg
    s2 = draw_corridor_bg(pw, ph, horizon_y_frac=0.50, tint="horror", exit_sign=False)
    s2 = s2.filter(ImageFilter.GaussianBlur(4))
    f2 = crop_2d_face_panel("eye-dart")
    fit_paste(s2, f2, (-30, int(ph * 0.22), pw + 30, int(ph * 0.82)))
    s2 = Image.blend(s2, Image.new("RGBA", (pw, ph), (16, 26, 40, 255)), 0.14)
    s2 = add_paper_grain(s2, seed=12, strength=12)

    # Shot 3: 3D 3q-back-ots
    s3 = draw_corridor_bg(pw, ph, horizon_y_frac=0.47, vp_x_frac=0.54, tint="horror")
    c3, _ = render_still_img(camera="3q-back-ots", action="idle-alert", expression="head-dread", lighting="horror-dark-rim", width=pw, height=ph, samples=6, tmp_dir=tmp_dir)
    s3.alpha_composite(c3)
    s3 = add_paper_grain(s3, seed=13, strength=12)

    # Shot 4: 2D ECU Crash-Zoom from face-angles.png
    s4 = Image.new("RGBA", (pw, ph), (20, 26, 34, 255))
    f4 = crop_2d_face_panel("ecu-dread")
    fit_paste(s4, f4, (0, int(ph * 0.18), pw, int(ph * 0.82)))
    s4 = Image.blend(s4, Image.new("RGBA", (pw, ph), (14, 22, 36, 255)), 0.12)
    s4 = add_paper_grain(s4, seed=14, strength=12)

    panels = [
        (s1, "Shot 1 — 3D Cel Rig", "3q-front walk · horror-dark-rim"),
        (s2, "Shot 2 — 2D Close-Up", "face-angles.png · Eye-Dart"),
        (s3, "Shot 3 — 3D Cel Rig", "3q-back-ots · corridor depth"),
        (s4, "Shot 4 — 2D ECU Cut", "face-angles.png · ECU Dread"),
    ]
    for idx, (img, title, sub) in enumerate(panels):
        x0 = start_x + idx * (pw + gap)
        sheet.alpha_composite(img, (x0, y0))
        d.rectangle([x0, y0, x0 + pw, y0 + ph], outline=(48, 60, 62), width=3)
        d.text((x0 + 4, y0 + ph + 14), title, fill=(32, 48, 50), font=f_lbl)
        d.text((x0 + 4, y0 + ph + 44), sub, fill=(96, 106, 104), font=f_cap)

    out = ASSETS_LEAD / "hybrid-seam-check.png"
    sheet.save(out, "PNG")
    print(f"Saved {out}")


def build_proof_reel(tmp_dir):
    print("\n=== Generating assets/series-lead/rig-3d/camera-proof-reel.mp4 (7.0s, 1080x1920) ===")
    W, H = 1080, 1920
    frames_dir = Path(tmp_dir) / "reel_frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    frame_idx = 0

    def save_frame_held(img, repeat=2):
        nonlocal frame_idx
        rgb = img.convert("RGB")
        for _ in range(repeat):
            frame_idx += 1
            rgb.save(frames_dir / f"f-{frame_idx:05d}.png", "PNG")

    # Shot 1 (0.0 - 2.0s = 24 unique frames on twos -> 48 output frames @ 24fps):
    # 3q-front walk-cycle + horror-dark-rim + foreground dark pillar parallax wipe
    bg1 = draw_corridor_bg(W, H, horizon_y_frac=0.50, tint="horror")
    for i in range(24):
        frac = i / 23.0
        char_img, _ = render_still_img(
            camera="3q-front", action="walk-cycle", expression="head-notice",
            lighting="horror-dark-rim", frame=1 + (i * 2) % 28,
            width=W, height=H, samples=6, push_in=frac * 0.10, tmp_dir=tmp_dir,
        )
        comp = bg1.copy()
        comp.alpha_composite(char_img)
        # Foreground pillar parallax wipe crossing frames 8..16
        if 7 <= i <= 16:
            p_frac = (i - 7) / 9.0
            px = int(W + 140 - p_frac * (W + 340))
            pd = ImageDraw.Draw(comp)
            pd.rectangle([px, 0, px + 165, H], fill=(8, 11, 16, 248))
        comp = add_paper_grain(comp, seed=200 + i, strength=10)
        save_frame_held(comp, repeat=2)

    # Shot 2 (2.0 - 3.2s = 29 frames @ 24fps): 2D Eye-Dart close-up on dark corridor bg with creeping push-in
    bg2 = draw_corridor_bg(W, H, horizon_y_frac=0.50, tint="horror", exit_sign=False).filter(ImageFilter.GaussianBlur(8))
    f2_src = crop_2d_face_panel("eye-dart")
    for i in range(29):
        frac = i / 28.0
        zoom = 1.08 + 0.14 * frac
        comp = bg2.copy()
        zw = int(W * zoom)
        zh = int(zw * (f2_src.height / f2_src.width))
        resized = f2_src.resize((zw, zh), Image.Resampling.LANCZOS)
        ox = (W - zw) // 2 + int(math.sin(i * 1.4) * 3)
        oy = (H - zh) // 2 + 40
        comp.alpha_composite(resized, (ox, oy))
        comp = Image.blend(comp, Image.new("RGBA", (W, H), (14, 22, 36, 255)), 0.14)
        comp = add_paper_grain(comp, seed=300 + i, strength=11)
        save_frame_held(comp, repeat=1)

    # Shot 3 (3.2 - 5.2s = 24 unique frames on twos -> 48 frames @ 24fps):
    # Grounded pov-peek + flashlight + sweeping cone + left doorframe occluder
    bg3 = draw_corridor_bg(W, H, horizon_y_frac=0.49, vp_x_frac=0.58, tint="horror")
    for i in range(24):
        frac = i / 23.0
        char_img, _ = render_still_img(
            camera="pov-peek", action="inspect-object-hand", expression="head-notice",
            lighting="flashlight-spot", prop="flashlight", frame=1 + i * 2,
            width=W, height=H, samples=6, push_in=frac * 0.06, tmp_dir=tmp_dir,
        )
        comp = bg3.copy()
        # Sweeping flashlight beam
        cone = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        cd = ImageDraw.Draw(cone)
        sweep_y = int(H * (0.34 + 0.12 * math.sin(frac * math.pi * 1.5)))
        cd.polygon([(int(W * 0.56), int(H * 0.62)), (W, sweep_y - 220), (W, sweep_y + 240)], fill=(255, 244, 196, 62))
        cone = cone.filter(ImageFilter.GaussianBlur(28))
        comp.alpha_composite(cone)
        comp.alpha_composite(char_img)
        # Left doorframe foreground occluder (narrowed so grounded POV flashlight arm reads clearly)
        fd = ImageDraw.Draw(comp)
        jamb_x = int(W * (0.24 - 0.04 * frac))
        fd.rectangle([0, 0, jamb_x, H], fill=(8, 11, 16, 250))
        fd.line([(jamb_x, 0), (jamb_x, H)], fill=(42, 52, 64, 255), width=8)
        comp = add_paper_grain(comp, seed=400 + i, strength=10)
        save_frame_held(comp, repeat=2)

    # Shot 4 (5.2 - 7.0s = 22 unique frames on twos -> 44 frames @ 24fps, total 169f = 7.04s):
    # 3q-back-ots slow dread push-in looking down dark corridor
    bg4 = draw_corridor_bg(W, H, horizon_y_frac=0.47, vp_x_frac=0.54, tint="horror")
    for i in range(22):
        frac = i / 21.0
        char_img, _ = render_still_img(
            camera="3q-back-ots", action="idle-alert", expression="head-dread",
            lighting="horror-dark-rim", frame=1 + i * 2,
            width=W, height=H, samples=6, push_in=frac * 0.14, tmp_dir=tmp_dir,
        )
        comp = bg4.copy()
        comp.alpha_composite(char_img)
        comp = add_paper_grain(comp, seed=500 + i, strength=10)
        save_frame_held(comp, repeat=2)

    out_mp4 = RIG_3D / "camera-proof-reel.mp4"
    cmd = [
        "ffmpeg", "-y", "-framerate", "24",
        "-i", str(frames_dir / "f-%05d.png"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart",
        str(out_mp4),
    ]
    subprocess.run(cmd, check=True)
    print(f"Saved {out_mp4} ({frame_idx} frames @ 24fps = {frame_idx / 24:.2f}s)")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="all", choices=["all", "angles", "actions", "framing", "seam", "reel"])
    args = ap.parse_args(argv)

    with tempfile.TemporaryDirectory(prefix="lead-phase2-") as tmp_dir:
        if args.only in ("all", "angles"):
            build_angles_sheet(tmp_dir)
        if args.only in ("all", "actions"):
            build_actions_sheet(tmp_dir)
        if args.only in ("all", "framing"):
            build_framing_cheatsheet(tmp_dir)
        if args.only in ("all", "seam"):
            build_seam_check(tmp_dir)
        if args.only in ("all", "reel"):
            build_proof_reel(tmp_dir)


if __name__ == "__main__":
    main()
