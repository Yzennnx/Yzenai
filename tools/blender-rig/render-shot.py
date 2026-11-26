#!/usr/bin/env python3
"""Headless Blender 5.2.4 LTS Shot & Reference Renderer for the Stylized Series Lead Rig.

Usage (still):
  blender --background assets/series-lead/rig-3d/lead-rig.blend --python tools/blender-rig/render-shot.py -- \
    --camera 3q-front --action idle-alert --expression head-notice --lighting neutral-day \
    --frame 1 --out /tmp/still.png [--export-guide /tmp/guide.png]

Usage (animation sequence):
  blender --background assets/series-lead/rig-3d/lead-rig.blend --python tools/blender-rig/render-shot.py -- \
    --camera 3q-front --action walk-cycle --expression head --lighting horror-dark-rim \
    --fps 12 --start 1 --end 24 --width 1080 --height 1920 --out /tmp/seq_dir
"""

import argparse
import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view
from PIL import Image, ImageDraw

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(SCRIPT_DIR))


def _import_apply_rig_state():
    import importlib.util
    spec = importlib.util.spec_from_file_location("build_lead_rig", SCRIPT_DIR / "build-lead-rig.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.apply_rig_state, mod.hex_to_lin


def load_json(name):
    return json.loads((SCRIPT_DIR / name).read_text(encoding="utf-8"))


def set_ik_influences(arm_obj, ik_cfg):
    defaults = {"leg_L": 0.0, "leg_R": 0.0, "arm_L": 0.0, "arm_R": 0.0}
    if ik_cfg:
        defaults.update(ik_cfg)
    arm_obj["ik_leg_L"] = float(defaults["leg_L"])
    arm_obj["ik_leg_R"] = float(defaults["leg_R"])
    arm_obj["ik_arm_L"] = float(defaults["arm_L"])
    arm_obj["ik_arm_R"] = float(defaults["arm_R"])
    for bname, prop in (("shin_L", "leg_L"), ("shin_R", "leg_R"), ("forearm_L", "arm_L"), ("forearm_R", "arm_R")):
        pb = arm_obj.pose.bones.get(bname)
        if pb:
            for c in pb.constraints:
                if c.type == "IK":
                    c.influence = float(defaults[prop])


def clear_pose(arm_obj):
    for pb in arm_obj.pose.bones:
        pb.location = (0.0, 0.0, 0.0)
        pb.rotation_mode = "XYZ"
        pb.rotation_euler = (0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)


def apply_keyframe_pose(arm_obj, kf):
    clear_pose(arm_obj)
    if "pelvis_loc" in kf:
        pb = arm_obj.pose.bones.get("pelvis")
        if pb:
            pb.location = Vector(kf["pelvis_loc"])
    for bname, rot_deg in kf.get("bones", {}).items():
        pb = arm_obj.pose.bones.get(bname)
        if pb:
            pb.rotation_mode = "XYZ"
            pb.rotation_euler = Euler([math.radians(a) for a in rot_deg], "XYZ")


def lowest_mesh_z(depsgraph):
    min_z = 999.0
    col = bpy.data.collections.get("LeadMeshes") or bpy.data.collections.get("RigMeshes")
    if col is None:
        return 0.0
    for obj in col.objects:
        if obj.hide_render or obj.type != "MESH":
            continue
        eval_obj = obj.evaluated_get(depsgraph)
        me = eval_obj.to_mesh()
        if me and len(me.vertices) > 0:
            mat = eval_obj.matrix_world
            for v in me.vertices:
                wz = (mat @ v.co).z
                if wz < min_z:
                    min_z = wz
        eval_obj.to_mesh_clear()
    return min_z if min_z < 900.0 else 0.0


def setup_action(scene, arm_obj, action_cfg, start_frame, end_frame):
    set_ik_influences(arm_obj, action_cfg.get("ik"))
    if arm_obj.animation_data:
        arm_obj.animation_data_clear()

    kfs = action_cfg.get("keyframes", [])
    cycle = bool(action_cfg.get("cycle", False))
    length = int(action_cfg.get("length", 24))
    auto_ground = bool(action_cfg.get("auto_ground", True))

    if not kfs:
        clear_pose(arm_obj)
        return

    # Keyframe all authored poses (repeating cycle cleanly if start..end > length)
    repeats = 1
    if cycle and length > 1 and end_frame > length:
        repeats = math.ceil(end_frame / (length - 1)) + 1

    keyed_frames = set()
    for rep in range(repeats):
        offset = rep * (length - 1)
        for kf in kfs:
            f = int(kf["frame"]) + offset
            if f in keyed_frames:
                continue
            keyed_frames.add(f)
            scene.frame_set(f)
            apply_keyframe_pose(arm_obj, kf)
            if auto_ground:
                bpy.context.view_layer.update()
                dg = bpy.context.evaluated_depsgraph_get()
                min_z = lowest_mesh_z(dg)
                if abs(min_z) > 0.002:
                    root_pb = arm_obj.pose.bones.get("root")
                    if root_pb:
                        root_pb.location.z -= min_z
            for pb in arm_obj.pose.bones:
                if pb.name in ("root", "pelvis"):
                    pb.keyframe_insert("location", frame=f)
                pb.keyframe_insert("rotation_euler", frame=f)

    # Smooth interpolation via Blender 5.x slotted Action channelbag
    if arm_obj.animation_data and arm_obj.animation_data.action:
        act = arm_obj.animation_data.action
        slot = arm_obj.animation_data.action_slot
        if act.layers and act.layers[0].strips:
            bag = act.layers[0].strips[0].channelbag(slot, ensure=True)
            for fc in bag.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"


RIG_CAMERA_FRAMING = {
    "tank": (1.48, 0.30),
    "smoker": (1.12, 0.10),
}


def setup_camera(scene, cam_cfg, width, height, frame=1, push_in=0.0, rig="lead"):
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100

    cam_obj = bpy.data.objects.get("LeadCam")
    if cam_obj is None:
        cam_data = bpy.data.cameras.new("LeadCam")
        cam_obj = bpy.data.objects.new("LeadCam", cam_data)
        scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    cam_data = cam_obj.data
    cam_data.lens = float(cam_cfg.get("lens", 45.0))
    sensor_mm = float(cam_cfg.get("sensor_width", 36.0))
    if width > height:
        # Preserve exact 9:16 vertical FOV in widescreen (16:9) so heads/boots are never sliced off
        cam_data.sensor_fit = "VERTICAL"
        cam_data.sensor_height = sensor_mm
    else:
        cam_data.sensor_fit = "AUTO"
        cam_data.sensor_width = sensor_mm
    cam_data.clip_start = 0.04
    cam_data.clip_end = 100.0

    orig_pos = Vector(cam_cfg["pos"])
    orig_target = Vector(cam_cfg["target"])
    track_bone = cam_cfg.get("track_bone")
    if track_bone:
        arm_ref = bpy.data.objects.get("LeadArmature") or bpy.data.objects.get("InfectedArmature")
        pb_t = arm_ref.pose.bones.get(track_bone) if arm_ref else None
        if pb_t is not None:
            head_center = arm_ref.matrix_world @ ((pb_t.head + pb_t.tail) * 0.5)
            off = Vector(cam_cfg.get("offset", [0.24, -0.76, 0.02]))
            if rig == "tank":
                off = off * 1.28
            elif rig == "charger":
                off = off * 1.12
            target = head_center + Vector((0.0, 0.0, -0.01))
            base_pos = head_center + off
        else:
            target = orig_target
            base_pos = orig_pos
    else:
        dist_scale, target_dz = RIG_CAMERA_FRAMING.get(rig, (1.0, 0.0))
        target = orig_target + Vector((0.0, 0.0, target_dz))
        base_pos = target + (orig_pos - orig_target) * dist_scale
    if push_in != 0.0:
        base_pos = base_pos.lerp(target, push_in)

    # Subtle organic handheld sway when rendering multi-frame animation
    sway = cam_cfg.get("sway", {})
    amp_p = float(sway.get("amp_pos", 0.0))
    amp_r = float(sway.get("amp_rot_deg", 0.0))
    freq = float(sway.get("freq", 0.0))
    t = (frame - 1) / max(1.0, float(scene.render.fps))
    if amp_p > 0.0 and freq > 0.0:
        base_pos = base_pos + Vector((
            math.sin(t * freq * 2.0 * math.pi) * amp_p,
            math.cos(t * freq * 1.3 * math.pi) * amp_p * 0.5,
            math.sin(t * freq * 2.7 * math.pi) * amp_p * 0.8,
        ))

    cam_obj.location = base_pos
    direction = (target - base_pos).normalized()
    quat = direction.to_track_quat("-Z", "Y")
    roll_deg = float(cam_cfg.get("roll_deg", 0.0))
    if amp_r > 0.0 and freq > 0.0:
        roll_deg += math.sin(t * freq * 1.7 * math.pi) * amp_r
    if abs(roll_deg) > 1e-4:
        quat = quat @ Euler((0.0, 0.0, math.radians(roll_deg)), "XYZ").to_quaternion()
    cam_obj.rotation_euler = quat.to_euler()

    # Optional head/hair hide for grounded POV cameras
    hide_head = bool(cam_cfg.get("hide_head", False))
    for oname in ("LeadHead", "LeadHair", "LeadNeck"):
        o = bpy.data.objects.get(oname)
        if o:
            o.hide_render = hide_head
            o.hide_viewport = hide_head

    # Scale GPv3 Line Art radius cleanly per camera preset (LeadOutline or RigOutline)
    lineart_r = float(cam_cfg.get("lineart_radius", 0.0075))
    for obj in bpy.data.objects:
        if obj.type in ("GREASEPENCIL", "GPENCIL"):
            for m in obj.modifiers:
                if m.type == "LINEART":
                    m.radius = lineart_r
                    obj.update_tag()

    return cam_obj


def _aim_light(light_obj, pos, target):
    light_obj.location = Vector(pos)
    d = (Vector(target) - Vector(pos)).normalized()
    light_obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def setup_lighting(scene, light_cfg):
    # Remove existing scene lights and rebuild cleanly from preset
    for obj in list(bpy.data.objects):
        if obj.type == "LIGHT":
            bpy.data.objects.remove(obj, do_unlink=True)

    # World background
    if scene.world and scene.world.use_nodes:
        bg = scene.world.node_tree.nodes.get("Background")
        if bg:
            wc = light_cfg.get("world_color", [0.04, 0.04, 0.04])
            bg.inputs[0].default_value = (wc[0], wc[1], wc[2], 1.0)
            bg.inputs[1].default_value = float(light_cfg.get("world_strength", 1.0))

    # Update Cel2Tone shader threshold and tint mix across all materials
    thresh = float(light_cfg.get("cel_threshold", 0.35))
    tint_mix = float(light_cfg.get("light_tint_mix", 0.05))
    for mat in bpy.data.materials:
        if not mat.use_nodes or not mat.node_tree:
            continue
        for node in mat.node_tree.nodes:
            if node.type == "GROUP" and node.node_tree and node.node_tree.name == "Cel2Tone":
                if "Threshold" in node.inputs:
                    node.inputs["Threshold"].default_value = thresh
                if "LightTintMix" in node.inputs:
                    node.inputs["LightTintMix"].default_value = tint_mix

    for role in ("key", "fill", "rim"):
        spec = light_cfg.get(role)
        if not spec:
            continue
        ltype = spec.get("type", "SUN")
        ldata = bpy.data.lights.new(f"LeadLight_{role}", type=ltype)
        ldata.energy = float(spec.get("energy", 1.0))
        c = spec.get("color", [1.0, 1.0, 1.0])
        ldata.color = (c[0], c[1], c[2])
        ldata.use_shadow = bool(spec.get("use_shadow", role == "key"))
        if ltype == "SUN":
            ldata.angle = math.radians(float(spec.get("angle_deg", 1.5)))
        elif ltype == "SPOT":
            ldata.spot_size = math.radians(float(spec.get("spot_size_deg", 45.0)))
            ldata.spot_blend = float(spec.get("spot_blend", 0.25))
        lobj = bpy.data.objects.new(f"LeadLight_{role}", ldata)
        scene.collection.objects.link(lobj)
        if ltype == "SUN":
            d = Vector(spec.get("dir", [-0.45, 0.72, -0.52])).normalized()
            lobj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        else:
            _aim_light(lobj, spec.get("pos", [1.0, -2.0, 1.5]), spec.get("target", [0.0, 0.0, 1.0]))


def attach_simple_prop(scene, prop_name, hex_to_lin):
    """Attach a stylized cel-shaded prop to hand_R_socket for POV / action shots."""
    if not prop_name or prop_name == "none":
        return
    sock = bpy.data.objects.get("hand_R_socket")
    if sock is None:
        return

    col_meshes = bpy.data.collections.get("LeadMeshes") or scene.collection

    def make_cel_mat(name, base_hex, shad_hex):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        cel = nt.nodes.new("ShaderNodeGroup")
        cel.node_tree = bpy.data.node_groups["Cel2Tone"]
        cel.inputs["BaseColor"].default_value = hex_to_lin(base_hex)
        cel.inputs["ShadowColor"].default_value = hex_to_lin(shad_hex)
        nt.links.new(cel.outputs[0], out.inputs[0])
        return mat

    if prop_name == "flashlight":
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.019, depth=0.22, location=(0, 0, 0))
        obj = bpy.context.active_object
        obj.name = "LeadProp_Flashlight"
        obj.data.materials.append(make_cel_mat("Mat_Prop_Flashlight", "#434f5a", "#252d34"))
        obj.rotation_euler = Euler((math.radians(16), 0, 0), "XYZ")
        obj.location = Vector((0.005, -0.015, -0.04))
    elif prop_name == "pipe":
        bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=0.017, depth=0.68, location=(0, 0, 0))
        obj = bpy.context.active_object
        obj.name = "LeadProp_Pipe"
        obj.data.materials.append(make_cel_mat("Mat_Prop_Pipe", "#6e7b86", "#454f57"))
        obj.rotation_euler = Euler((math.radians(78), 0, 0), "XYZ")
        obj.location = Vector((0.0, -0.18, 0.0))
    elif prop_name == "mug":
        bpy.ops.mesh.primitive_cylinder_add(vertices=18, radius=0.042, depth=0.10, location=(0, 0, 0))
        obj = bpy.context.active_object
        obj.name = "LeadProp_Mug"
        obj.data.materials.append(make_cel_mat("Mat_Prop_Mug", "#d9d2c5", "#a89f90"))
        obj.location = Vector((0.0, -0.03, 0.02))
    elif prop_name == "phone":
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
        obj = bpy.context.active_object
        obj.name = "LeadProp_Phone"
        obj.scale = (0.072, 0.010, 0.148)
        obj.data.materials.append(make_cel_mat("Mat_Prop_Phone", "#263645", "#141d26"))
        obj.rotation_euler = Euler((math.radians(15), 0, 0), "XYZ")
        obj.location = Vector((0.0, -0.02, 0.03))
    else:
        return

    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col_meshes.objects.link(obj)
    obj.parent = sock


def export_horizon_guide(scene, cam_obj, guide_path, width, height):
    """Export a transparent RGBA PNG with exact camera horizon, vanishing points, and 1m z=0 floor grid."""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def proj(vec):
        co = world_to_camera_view(scene, cam_obj, Vector(vec))
        if co.z <= 0.02:
            return None
        return (co.x * width, (1.0 - co.y) * height)

    # 1-meter floor grid on z = 0 (-6m..+6m)
    grid_col = (56, 214, 198, 165)
    axis_x_col = (240, 96, 86, 215)
    axis_y_col = (84, 178, 255, 215)

    for i in range(-6, 7):
        col = axis_y_col if i == 0 else grid_col
        lw = 3 if i == 0 else 2
        pts = [proj((i, y * 0.5, 0.0)) for y in range(-12, 13)]
        for a, b in zip(pts, pts[1:]):
            if a and b:
                draw.line([a, b], fill=col, width=lw)

        col2 = axis_x_col if i == 0 else grid_col
        pts2 = [proj((x * 0.5, i, 0.0)) for x in range(-12, 13)]
        for a, b in zip(pts2, pts2[1:]):
            if a and b:
                draw.line([a, b], fill=col2, width=lw)

    # Analytical horizon line (distant points on z = cam_obj.location.z)
    cam_pos = cam_obj.location
    cam_fwd = (cam_obj.matrix_world.to_3x3() @ Vector((0, 0, -1))).normalized()
    horiz_fwd = Vector((cam_fwd.x, cam_fwd.y, 0.0))
    if horiz_fwd.length > 0.05:
        horiz_fwd.normalize()
        horiz_right = Vector((-horiz_fwd.y, horiz_fwd.x, 0.0))
        h_pts = []
        for s in (-1.5, -0.8, 0.0, 0.8, 1.5):
            p = proj(cam_pos + (horiz_fwd + horiz_right * s) * 80.0)
            if p:
                h_pts.append(p)
        if len(h_pts) >= 2:
            draw.line([h_pts[0], h_pts[-1]], fill=(255, 204, 51, 235), width=3)

    # Vanishing point markers along ±X and ±Y
    for label, dvec in (("VP-Y", (0, -90, 0)), ("VP+Y", (0, 90, 0)), ("VP+X", (90, 0, 0)), ("VP-X", (-90, 0, 0))):
        p = proj(cam_pos + Vector(dvec))
        if p and -50 <= p[0] <= width + 50 and -50 <= p[1] <= height + 50:
            r = 8
            draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], outline=(255, 204, 51, 255), width=3)

    # Origin (0,0,0) foot-ground crosshair
    orig = proj((0.0, 0.0, 0.0))
    if orig:
        r = 10
        draw.line([(orig[0] - r, orig[1]), (orig[0] + r, orig[1])], fill=(255, 255, 255, 235), width=3)
        draw.line([(orig[0], orig[1] - r), (orig[0], orig[1] + r)], fill=(255, 255, 255, 235), width=3)

    out = Path(guide_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(out), "PNG")


VALID_RIGS = ("lead", "hunter", "smoker", "witch", "charger", "tank")


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(description="Headless Blender Multi-Rig Shot Renderer (Lead & Infected)")
    ap.add_argument("--rig", default="lead", choices=list(VALID_RIGS), help="Rig to render (default: lead)")
    ap.add_argument("--camera", default="3q-front")
    ap.add_argument("--action", default=None, help="Action preset (defaults to idle-alert for lead, infected-idle for infected)")
    ap.add_argument("--expression", default=None)
    ap.add_argument("--lighting", default="neutral-day")
    ap.add_argument("--gloves", default="off", choices=["on", "off", "0", "1", "true", "false"])
    ap.add_argument("--backpack", default="off", choices=["on", "off", "0", "1", "true", "false"])
    ap.add_argument("--condition", default="clean", choices=["clean", "sweat", "frost", "scorch", "dusty"])
    ap.add_argument("--hand-pose", default="auto", choices=["auto", "relaxed", "grip", "open-flat"])
    ap.add_argument("--prop", default="none", choices=["none", "flashlight", "pipe", "mug", "phone"])
    ap.add_argument("--env", default="none", choices=["none", "civic-plaza"], help="3D cel-shaded ground & architecture set")
    ap.add_argument("--travel", type=float, default=0.0, help="Forward world-space -Y travel distance (meters) over sequence")
    ap.add_argument("--floor-prop", default="none", choices=["none", "glass-shard"], help="3D z=0 contact prop placed under stepping boot")
    ap.add_argument("--impact-frame", type=int, default=18, help="Frame index when boot crushes --floor-prop")
    ap.add_argument("--fps", type=int, default=24, choices=[12, 24, 30])
    ap.add_argument("--frame", type=int, default=None, help="Render single still frame")
    ap.add_argument("--start", type=int, default=1)
    ap.add_argument("--end", type=int, default=1)
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1920)
    ap.add_argument("--samples", type=int, default=8)
    ap.add_argument("--push-in", type=float, default=0.0, help="Camera push-in fraction (0..0.35) over sequence")
    ap.add_argument("--export-guide", default=None, help="Path for transparent horizon/floor-grid PNG")
    ap.add_argument("--export-tracks", default=None, help="Path for per-frame 2D bone screen-space coordinates JSON")
    ap.add_argument("--out", required=True, help="Output PNG path (still) or directory (sequence)")
    return ap.parse_args(argv)


def _make_glass_cel_mat():
    mat = bpy.data.materials.get("Mat_FloorGlassShard")
    if mat:
        return mat
    mat = bpy.data.materials.new("Mat_FloorGlassShard")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (0.58, 0.88, 0.96, 1.0)
    em.inputs["Strength"].default_value = 0.92
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


def setup_floor_prop(scene, arm_obj, prop_kind, impact_frame):
    """Create a 3D cel-shaded inked z=0 floor prop directly under the stepping boot."""
    if not prop_kind or prop_kind == "none":
        return None
    if prop_kind != "glass-shard":
        return None

    import bmesh

    # Find exact world (x, y) under the lowest foot at impact_frame
    scene.frame_set(impact_frame)
    bpy.context.view_layer.update()
    best_pt = Vector((0.0, 0.0, 0.0))
    best_z = 999.0
    for bname in ("foot_R", "foot_L"):
        pb = arm_obj.pose.bones.get(bname)
        if pb:
            mid = arm_obj.matrix_world @ ((pb.head + pb.tail) * 0.5)
            if mid.z < best_z:
                best_z = mid.z
                best_pt = Vector((mid.x, mid.y, 0.0))

    col = bpy.data.collections.get("LeadMeshes") or bpy.data.collections.get("RigMeshes") or scene.collection
    mat = _make_glass_cel_mat()

    # Build 6 faceted 3D glass wedge shards (2 hero wedges under sole + 4 outer splinters)
    shard_specs = [
        # (name, dx, dy, sx, sy, sz, rot_z, vx, vy, vz, spin_z)
        ("FloorGlass_HeroA", -0.012, -0.015, 0.085, 0.048, 0.011, 0.25, -0.14, -0.11, 0.06, 2.6),
        ("FloorGlass_HeroB", 0.024, 0.018, 0.072, 0.042, 0.010, -0.65, 0.16, 0.09, 0.05, -3.1),
        ("FloorGlass_Chip1", -0.055, 0.032, 0.045, 0.026, 0.008, 1.10, -0.22, 0.14, 0.09, 4.2),
        ("FloorGlass_Chip2", 0.062, -0.028, 0.040, 0.024, 0.008, -1.45, 0.24, -0.15, 0.11, -4.8),
        ("FloorGlass_Chip3", 0.005, -0.068, 0.036, 0.022, 0.007, 0.85, 0.06, -0.26, 0.08, 3.8),
        ("FloorGlass_Chip4", -0.022, 0.064, 0.034, 0.020, 0.007, -0.35, -0.09, 0.22, 0.07, -3.5),
    ]
    created = []
    for sname, dx, dy, sx, sy, sz, rz, vx, vy, vz, spin in shard_specs:
        me = bpy.data.meshes.new(sname + "_Mesh")
        bm = bmesh.new()
        # Sharp asymmetric triangular glass prism
        v0 = bm.verts.new((-sx * 0.55, -sy * 0.45, 0.0))
        v1 = bm.verts.new((sx * 0.65, -sy * 0.10, 0.0))
        v2 = bm.verts.new((-sx * 0.15, sy * 0.60, 0.0))
        v3 = bm.verts.new((-sx * 0.45, -sy * 0.35, sz))
        v4 = bm.verts.new((sx * 0.50, -sy * 0.08, sz * 0.85))
        v5 = bm.verts.new((-sx * 0.10, sy * 0.48, sz * 0.90))
        bm.faces.new((v0, v2, v1))
        bm.faces.new((v3, v4, v5))
        bm.faces.new((v0, v1, v4, v3))
        bm.faces.new((v1, v2, v5, v4))
        bm.faces.new((v2, v0, v3, v5))
        bm.normal_update()
        bm.to_mesh(me)
        bm.free()

        obj = bpy.data.objects.new(sname, me)
        obj.data.materials.append(mat)
        col.objects.link(obj)
        base_loc = Vector((best_pt.x + dx, best_pt.y + dy, 0.004))
        obj.location = base_loc
        obj.rotation_euler = (0.0, 0.0, rz)
        created.append((obj, base_loc, rz, vx, vy, vz, spin))

    def update_for_frame(f):
        dt = max(0.0, (f - impact_frame) / 24.0)
        for obj, base_loc, rz, vx, vy, vz, spin in created:
            if dt <= 0.0:
                obj.location = base_loc
                obj.rotation_euler = (0.0, 0.0, rz)
            else:
                # Quick damped scatter burst along z=0 floor plane
                t_eff = min(dt, 0.42)
                drag = 1.0 - math.exp(-t_eff * 6.5)
                hop = max(0.0, vz * t_eff * 3.2 - 0.5 * 1.8 * (t_eff ** 2))
                obj.location = Vector((
                    base_loc.x + vx * drag,
                    base_loc.y + vy * drag,
                    0.004 + hop,
                ))
                obj.rotation_euler = (hop * 4.5, -hop * 3.0, rz + spin * drag)

    return {"update": update_for_frame, "impact_world": [best_pt.x, best_pt.y, 0.0]}


def sample_bone_tracks(scene, cam_obj, arm_obj, width, height):
    """Project key bone landmarks into 2D pixel space for pixel-locked 2D FX & contact shadows."""
    pts = {}
    for bname, use_tail in (
        ("foot_L", True),
        ("foot_R", True),
        ("hand_L", True),
        ("hand_R", True),
        ("head", False),
        ("pelvis", False),
    ):
        pb = arm_obj.pose.bones.get(bname)
        if not pb:
            continue
        wpt = arm_obj.matrix_world @ (pb.tail if use_tail else pb.head)
        co = world_to_camera_view(scene, cam_obj, wpt)
        px = round(co.x * width, 1)
        py = round((1.0 - co.y) * height, 1)
        pts[bname] = {"x": px, "y": py, "z_cam": round(co.z, 3), "world_z": round(wpt.z, 4)}
    return pts


def main():
    args = parse_args()
    is_lead = args.rig == "lead"
    action_name = args.action or ("idle-alert" if is_lead else "infected-idle")
    actions_file = "actions.json" if is_lead else "infected-actions.json"

    cameras = load_json("cameras.json")
    actions = load_json(actions_file)
    lightings = load_json("lighting.json")

    if args.camera not in cameras:
        raise SystemExit(f"Unknown camera '{args.camera}'. Valid: {[k for k in cameras if not k.startswith('_')]}")
    if action_name not in actions:
        raise SystemExit(f"Unknown action '{action_name}' in {actions_file}. Valid: {[k for k in actions if not k.startswith('_')]}")
    if args.lighting not in lightings:
        raise SystemExit(f"Unknown lighting '{args.lighting}'. Valid: {[k for k in lightings if not k.startswith('_')]}")

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = args.samples
    scene.render.film_transparent = True
    scene.render.fps = args.fps if args.fps in (24, 30) else 24
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"

    arm_obj = bpy.data.objects.get("LeadArmature") or bpy.data.objects.get("InfectedArmature")
    if arm_obj is None:
        raise SystemExit("No armature found (expected 'LeadArmature' or 'InfectedArmature')")

    action_cfg = actions[action_name]

    if is_lead:
        apply_rig_state, hex_to_lin = _import_apply_rig_state()
        expr = args.expression or action_cfg.get("expression", "head")

        hp = args.hand_pose
        if hp == "auto":
            if args.prop != "none" or action_name in ("sprint-cycle", "inspect-object-hand", "sip-eat-prop"):
                hp = "grip"
            elif action_name in ("brace-push-wall", "crawl-scramble", "bed-wake-situp"):
                hp = "open-flat"
            else:
                hp = "relaxed"

        apply_rig_state(
            arm_obj,
            expression=expr,
            gloves=args.gloves,
            backpack=args.backpack,
            condition=args.condition,
            hand_pose=hp,
        )
        attach_simple_prop(scene, args.prop, hex_to_lin)

    if args.env and args.env != "none":
        import env_sets
        env_sets.setup_environment(scene, args.env)

    setup_lighting(scene, lightings[args.lighting])

    is_still = args.frame is not None
    start_f = args.frame if is_still else args.start
    end_f = args.frame if is_still else args.end
    step = 2 if (not is_still and args.fps == 12) else 1

    setup_action(scene, arm_obj, action_cfg, start_f, end_f)
    floor_prop = setup_floor_prop(scene, arm_obj, args.floor_prop, args.impact_frame)

    FULL_BODY_CAMERAS = {"3q-front", "side", "low-24mm", "high-cornered", "cctv-wide"}

    def _warn_if_top_clipped(png_path):
        if args.camera not in FULL_BODY_CAMERAS or (args.env and args.env != "none"):
            return
        try:
            im = Image.open(png_path).convert("RGBA")
            top_row = im.crop((0, 0, im.width, 2)).getchannel("A")
            if top_row.getextrema()[1] > 32:
                print(f"[WARN] Character pixels touch top edge (y=0) in {png_path} (cam={args.camera}, {args.width}x{args.height}) — check headroom!")
        except Exception:
            pass

    if not is_still and bool(action_cfg.get("cycle", False)):
        cycle_len = int(action_cfg.get("length", 24))
        span = end_f - start_f + 1
        if span < cycle_len:
            print(f"[WARN] Cycling action '{action_name}' has length={cycle_len}, but requested span is {span} frames ({start_f}..{end_f}) — looping will snap mid-stride!")

    out_path = Path(args.out)
    tracks_data = {"width": args.width, "height": args.height, "camera": args.camera, "rig": args.rig, "action": action_name, "frames": []}
    if is_still:
        scene.frame_set(start_f)
        if floor_prop:
            floor_prop["update"](start_f)
        cam_obj = setup_camera(scene, cameras[args.camera], args.width, args.height, frame=start_f, push_in=args.push_in, rig=args.rig)
        bpy.context.view_layer.update()
        target_file = out_path if out_path.suffix.lower() == ".png" else (out_path / f"frame-{start_f:05d}.png")
        target_file.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(target_file)
        bpy.ops.render.render(write_still=True)
        _warn_if_top_clipped(target_file)
        if args.export_tracks:
            tracks_data["frames"].append({"frame": start_f, "bones": sample_bone_tracks(scene, cam_obj, arm_obj, args.width, args.height)})
            Path(args.export_tracks).parent.mkdir(parents=True, exist_ok=True)
            Path(args.export_tracks).write_text(json.dumps(tracks_data, indent=2), encoding="utf-8")
        if args.export_guide:
            export_horizon_guide(scene, cam_obj, args.export_guide, args.width, args.height)
        print(f"Rendered still ({args.rig}) -> {target_file}")
    else:
        out_path.mkdir(parents=True, exist_ok=True)
        frame_list = list(range(start_f, end_f + 1, step))
        total = max(1, len(frame_list) - 1)
        first_cam = None
        first_file = None
        env_col = bpy.data.collections.get("EnvMeshes")
        env_base_y = [(o, o.location.y) for o in env_col.objects] if (env_col and args.travel) else []
        for idx, f in enumerate(frame_list):
            scene.frame_set(f)
            frac_all = (idx / total) if total > 0 else 0.0
            if env_base_y:
                # Shift 3D environment backward (+Y) while keeping rig at origin (0,0,0) — zero double-transform tearing!
                shift_y = args.travel * frac_all
                for o, by in env_base_y:
                    o.location.y = by + shift_y
            if floor_prop:
                floor_prop["update"](f)
            frac = frac_all * args.push_in if args.push_in else 0.0
            cam_obj = setup_camera(scene, cameras[args.camera], args.width, args.height, frame=f, push_in=frac, rig=args.rig)
            if first_cam is None:
                first_cam = cam_obj
            bpy.context.view_layer.update()
            if args.export_tracks:
                tracks_data["frames"].append({"frame": f, "bones": sample_bone_tracks(scene, cam_obj, arm_obj, args.width, args.height)})
            out_file = out_path / f"frame-{idx + 1:05d}.png"
            if first_file is None:
                first_file = out_file
            scene.render.filepath = str(out_file)
            bpy.ops.render.render(write_still=True)
        if first_file is not None:
            _warn_if_top_clipped(first_file)
        if args.export_tracks:
            Path(args.export_tracks).parent.mkdir(parents=True, exist_ok=True)
            Path(args.export_tracks).write_text(json.dumps(tracks_data, indent=2), encoding="utf-8")
        if args.export_guide and first_cam is not None:
            scene.frame_set(start_f)
            setup_camera(scene, cameras[args.camera], args.width, args.height, frame=start_f, push_in=0.0, rig=args.rig)
            bpy.context.view_layer.update()
            export_horizon_guide(scene, first_cam, args.export_guide, args.width, args.height)
        print(f"Rendered {len(frame_list)} frames ({args.rig}, {args.fps}fps) -> {out_path}")


if __name__ == "__main__":
    main()
