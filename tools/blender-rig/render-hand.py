#!/usr/bin/env python3
"""Headless Blender 5.2.4 LTS renderer for the dedicated 5-finger cel-shaded Hand Close-Up & POV Rig.

Usage (single pose still):
  blender --background assets/series-lead/rig-3d/hand-closeup-rig.blend \
    --python tools/blender-rig/render-hand.py -- --pose pov-flashlight --gloves off --out /tmp/hand.png

Usage (render full universal-hands-3d-sheet.png):
  blender --background assets/series-lead/rig-3d/hand-closeup-rig.blend \
    --python tools/blender-rig/render-hand.py -- --sheet
"""

import argparse
import importlib.util
import json
import math
import sys
import tempfile
from pathlib import Path

import bpy
from mathutils import Euler, Vector
from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
ASSETS_HANDS = REPO_ROOT / "assets" / "series-lead" / "hands"

HAND_POSES = json.loads((SCRIPT_DIR / "hand-poses.json").read_text(encoding="utf-8"))
LIGHTINGS = json.loads((SCRIPT_DIR / "lighting.json").read_text(encoding="utf-8"))


def _load_mod(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


BHR = _load_mod("build_hand_rig", SCRIPT_DIR / "build-hand-rig.py")
RS = _load_mod("render_shot", SCRIPT_DIR / "render-shot.py")


def clear_hand_props():
    for o in list(bpy.data.objects):
        if o.name.startswith("HandProp_"):
            bpy.data.objects.remove(o, do_unlink=True)


def make_prop_mat(name, base_hex, shad_hex):
    cel_ng = bpy.data.node_groups["Cel2Tone"]
    return BHR.make_cel_material(name, base_hex, shad_hex, cel_ng)


def attach_hand_prop(scene, prop_name):
    clear_hand_props()
    if not prop_name or prop_name == "none":
        return
    sock = bpy.data.objects.get("prop_socket")
    col = bpy.data.collections.get("HandMeshes") or scene.collection

    def link_to_sock(obj):
        for c in list(obj.users_collection):
            c.objects.unlink(obj)
        col.objects.link(obj)
        obj.parent = sock

    if prop_name == "flashlight":
        mat_body = make_prop_mat("Mat_HProp_Flash", "#3f4b56", "#232b32")
        mat_bezel = make_prop_mat("Mat_HProp_Bezel", "#566470", "#2f3840")
        # Seated at exact mathematical center of closed fist ring in prop_socket local space (y=-0.042, z=+0.001)
        bpy.ops.mesh.primitive_cylinder_add(vertices=18, radius=0.0145, depth=0.17)
        body = bpy.context.active_object
        body.name = "HandProp_Flashlight"
        body.data.materials.append(mat_body)
        body.rotation_euler = Euler((0, math.radians(90), 0), "XYZ")
        body.location = Vector((-0.015, -0.042, 0.001))
        link_to_sock(body)
        # Flared front bezel head extending forward out of index/thumb side (-X)
        bpy.ops.mesh.primitive_cone_add(vertices=18, radius1=0.0145, radius2=0.027, depth=0.055)
        head = bpy.context.active_object
        head.name = "HandProp_FlashBezel"
        head.data.materials.append(mat_bezel)
        head.rotation_euler = Euler((0, math.radians(-90), 0), "XYZ")
        head.location = Vector((-0.115, -0.042, 0.001))
        link_to_sock(head)
    elif prop_name == "mug":
        # Seated at exact mathematical center of C-grip arc (y=-0.034, z=-0.014, r=0.0235 -> zero finger clipping!)
        bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.0235, depth=0.145)
        obj = bpy.context.active_object
        obj.name = "HandProp_Mug"
        obj.data.materials.append(make_prop_mat("Mat_HProp_Mug", "#d9d2c5", "#aba293"))
        obj.rotation_euler = Euler((0, math.radians(90), 0), "XYZ")
        obj.location = Vector((-0.005, -0.034, -0.014))
        link_to_sock(obj)
    elif prop_name == "pellet":
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.012)
        obj = bpy.context.active_object
        obj.name = "HandProp_Pellet"
        obj.data.materials.append(make_prop_mat("Mat_HProp_Pellet", "#7be06c", "#459e39"))
        obj.location = Vector((-0.030, 0.088, -0.018))
        link_to_sock(obj)
    elif prop_name == "doorknob":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=0.032)
        obj = bpy.context.active_object
        obj.name = "HandProp_Knob"
        obj.data.materials.append(make_prop_mat("Mat_HProp_Knob", "#c9a258", "#8f6e33"))
        obj.location = Vector((0.0, 0.026, -0.026))
        link_to_sock(obj)
        # Backplate behind knob
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.058, depth=0.010)
        plate = bpy.context.active_object
        plate.name = "HandProp_Plate"
        plate.data.materials.append(make_prop_mat("Mat_HProp_Plate", "#7f8c96", "#58636b"))
        plate.location = Vector((0.0, 0.026, -0.066))
        link_to_sock(plate)
    elif prop_name == "button":
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        plate = bpy.context.active_object
        plate.name = "HandProp_SwitchPlate"
        plate.scale = (0.075, 0.014, 0.125)
        plate.data.materials.append(make_prop_mat("Mat_HProp_SPlate", "#d8d1bf", "#afa897"))
        plate.location = Vector((-0.036, 0.064, 0.010))
        link_to_sock(plate)
        bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.014, depth=0.018)
        btn = bpy.context.active_object
        btn.name = "HandProp_Button"
        btn.rotation_euler = Euler((math.radians(90), 0, 0), "XYZ")
        btn.data.materials.append(make_prop_mat("Mat_HProp_Btn", "#c94a42", "#8e2d27"))
        btn.location = Vector((-0.036, 0.050, 0.010))
        link_to_sock(btn)


def pose_hand_and_render(pose_key, gloves=False, lighting="neutral-day", width=540, height=540, samples=8, out_png=None):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = samples
    scene.render.film_transparent = True
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"

    arm_obj = bpy.data.objects["HandArmature"]
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (0.0, 0.0, 0.0)

    cfg = HAND_POSES[pose_key]
    for bname, rot_deg in cfg.get("bones", {}).items():
        pb = arm_obj.pose.bones.get(bname)
        if pb:
            pb.rotation_euler = Euler([math.radians(a) for a in rot_deg], "XYZ")

    BHR.apply_hand_state(arm_obj, gloves=gloves)
    attach_hand_prop(scene, cfg.get("prop", "none"))
    RS.setup_lighting(scene, LIGHTINGS[lighting])

    cam_cfg = cfg["camera"]
    cam_obj = bpy.data.objects["HandCam"]
    cam_obj.data.lens = float(cam_cfg.get("lens", 50.0))
    cam_obj.location = Vector(cam_cfg["pos"])
    direction = (Vector(cam_cfg["target"]) - cam_obj.location).normalized()
    quat = direction.to_track_quat("-Z", "Y")
    roll = float(cam_cfg.get("roll_deg", 0.0))
    if abs(roll) > 1e-4:
        quat = quat @ Euler((0.0, 0.0, math.radians(roll)), "XYZ").to_quaternion()
    cam_obj.rotation_euler = quat.to_euler()
    scene.camera = cam_obj

    gp_obj = bpy.data.objects.get("HandOutline")
    if gp_obj:
        for m in gp_obj.modifiers:
            if m.type == "LINEART":
                m.radius = float(cam_cfg.get("lineart_radius", 0.0020))
        gp_obj.update_tag()

    bpy.context.view_layer.update()
    scene.render.filepath = str(out_png)
    bpy.ops.render.render(write_still=True)
    return Image.open(out_png).convert("RGBA")


def get_font(size, bold=False):
    for p in (
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf",
        "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/liberation-sans-fonts/LiberationSans-Regular.ttf",
    ):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def build_sheet():
    W, H = 2560, 1080
    sheet = Image.new("RGBA", (W, H), (242, 234, 220, 255))
    d = ImageDraw.Draw(sheet)
    f_kicker = get_font(19, bold=True)
    f_title = get_font(40, bold=True)
    f_lbl = get_font(19, bold=True)
    f_sub = get_font(15)

    d.text((48, 28), "WHAT HAPPENS NEXT? — DEDICATED 5-FINGER CEL-SHADED 3D HAND RIG (ZERO SEVERED WRISTS)", fill=(139, 46, 46), font=f_kicker)
    d.text((48, 58), "Series Lead — Universal Close-Up & POV Hands (Bare + Gloved)", fill=(29, 45, 53), font=f_title)

    poses = [
        ("pov-flashlight", "pov-flashlight", "Grounded POV flashlight"),
        ("cup-bottle-grip", "cup-bottle-grip", "Mug / bottle 5-finger wrap"),
        ("pinch-pick", "pinch-pick", "Pellet / key / pill pinch"),
        ("knob-handle-turn", "knob-handle-turn", "Round doorknob / lock grasp"),
        ("button-switch-press", "button-switch-press", "Button / light switch press"),
        ("open-reach-tremble", "open-reach-tremble", "Open shock / reach palm"),
    ]

    cw, ch = 394, 434
    gap_x, gap_y = 20, 24
    with tempfile.TemporaryDirectory(prefix="hand-sheet-") as tmp:
        tmp_png = Path(tmp) / "h.png"
        for row in range(2):
            gloved = (row == 1)
            for col, (pkey, title, sub) in enumerate(poses):
                x0 = 48 + col * (cw + gap_x)
                y0 = 132 + row * (ch + gap_y)
                bg_c = (24, 31, 40, 255) if pkey == "pov-flashlight" else (251, 247, 239, 255)
                d.rectangle([x0, y0, x0 + cw, y0 + ch], fill=bg_c, outline=(211, 201, 180), width=2)
                light = "flashlight-spot" if pkey == "pov-flashlight" else "neutral-day"
                img = pose_hand_and_render(pkey, gloves=gloved, lighting=light, width=cw, height=ch - 56, samples=6, out_png=tmp_png)
                sheet.alpha_composite(img, (x0, y0))
                d.rectangle([x0, y0 + ch - 56, x0 + cw, y0 + ch], fill=(251, 247, 239, 255))
                d.line([(x0, y0 + ch - 56), (x0 + cw, y0 + ch - 56)], fill=(211, 201, 180), width=2)
                d.text((x0 + 14, y0 + ch - 48), f"{title} ({'gloved' if gloved else 'bare'})", fill=(29, 45, 53), font=f_lbl)
                d.text((x0 + 14, y0 + ch - 23), sub, fill=(92, 107, 115), font=f_sub)

    out = ASSETS_HANDS / "universal-hands-sheet.png"
    sheet.save(out, "PNG")
    print(f"Saved {out}")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet", action="store_true")
    ap.add_argument("--pose", default="pov-flashlight")
    ap.add_argument("--gloves", default="off")
    ap.add_argument("--lighting", default="neutral-day")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1920)
    ap.add_argument("--samples", type=int, default=8)
    ap.add_argument("--out", default="/tmp/hand.png")
    args = ap.parse_args(argv)

    if args.sheet:
        build_sheet()
    else:
        pose_hand_and_render(
            args.pose,
            gloves=(args.gloves in ("on", "1", "true", "True")),
            lighting=args.lighting,
            width=args.width,
            height=args.height,
            samples=args.samples,
            out_png=args.out,
        )
        print(f"Saved {args.out}")


if __name__ == "__main__":
    main()
