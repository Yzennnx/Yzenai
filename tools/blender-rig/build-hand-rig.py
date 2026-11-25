#!/usr/bin/env python3
"""Procedural Blender 5.2.4 LTS builder for the dedicated 5-finger cel-shaded Close-Up & POV Hand Rig.

Usage:
    blender --background --python tools/blender-rig/build-hand-rig.py

Outputs:
    assets/series-lead/rig-3d/hand-closeup-rig.blend
"""

import math
import os
from pathlib import Path

import bpy
import bmesh
from mathutils import Euler, Matrix, Vector

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
BLEND_OUT = REPO_ROOT / "assets" / "series-lead" / "rig-3d" / "hand-closeup-rig.blend"


def srgb_to_lin(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_to_lin(hex_color: str, alpha: float = 1.0):
    h = hex_color.lstrip("#")
    return (
        srgb_to_lin(int(h[0:2], 16) / 255.0),
        srgb_to_lin(int(h[2:4], 16) / 255.0),
        srgb_to_lin(int(h[4:6], 16) / 255.0),
        alpha,
    )


PALETTE = {
    "ink": "#253a3b",
    "skin_base": "#e7ae87",
    "skin_shadow": "#d1936e",
    "glove_base": "#553622",
    "glove_shadow": "#392315",
    "glove_cuff_base": "#412819",
    "glove_cuff_shadow": "#2b1a10",
    "shirt_base": "#e8e1cc",
    "shirt_shadow": "#bab49f",
    "cuff_base": "#ede5d0",
    "cuff_shadow": "#c8c1ac",
    "button_base": "#c6bda8",
    "button_shadow": "#8a8575",
}


def apply_hand_state(arm_obj, gloves=False):
    """Toggle bare skin vs leather glove cleanly on hand-closeup-rig.blend."""
    g_val = 1 if (gloves in (True, 1, "1", "on", "true", "True")) else 0
    arm_obj["gloves"] = g_val
    hand_obj = bpy.data.objects.get("HandMesh")
    cuff_obj = bpy.data.objects.get("HandGloveCuff")
    mat_skin = bpy.data.materials.get("Mat_Hand_Skin")
    mat_glove = bpy.data.materials.get("Mat_Hand_Glove")
    if hand_obj and mat_skin and mat_glove:
        hand_obj.data.materials[0] = mat_glove if g_val else mat_skin
    if cuff_obj:
        cuff_obj.hide_viewport = (g_val == 0)
        cuff_obj.hide_render = (g_val == 0)
    gp = bpy.data.objects.get("HandOutline")
    if gp:
        gp.update_tag()


def create_cel2tone_group():
    ng = bpy.data.node_groups.new("Cel2Tone", "ShaderNodeTree")
    ng.interface.new_socket("BaseColor", in_out="INPUT", socket_type="NodeSocketColor")
    ng.interface.new_socket("ShadowColor", in_out="INPUT", socket_type="NodeSocketColor")
    s_th = ng.interface.new_socket("Threshold", in_out="INPUT", socket_type="NodeSocketFloat")
    s_th.default_value = 0.36
    ng.interface.new_socket("Color", in_out="OUTPUT", socket_type="NodeSocketColor")

    inp = ng.nodes.new("NodeGroupInput")
    out = ng.nodes.new("NodeGroupOutput")
    diff = ng.nodes.new("ShaderNodeBsdfDiffuse")
    diff.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    s2r = ng.nodes.new("ShaderNodeShaderToRGB")
    rgb2bw = ng.nodes.new("ShaderNodeRGBToBW")
    gt = ng.nodes.new("ShaderNodeMath")
    gt.operation = "GREATER_THAN"
    mix = ng.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"

    ng.links.new(diff.outputs["BSDF"], s2r.inputs["Shader"])
    ng.links.new(s2r.outputs["Color"], rgb2bw.inputs["Color"])
    ng.links.new(rgb2bw.outputs["Val"], gt.inputs[0])
    ng.links.new(inp.outputs["Threshold"], gt.inputs[1])
    ng.links.new(gt.outputs["Value"], mix.inputs["Factor"])
    ng.links.new(inp.outputs["ShadowColor"], mix.inputs["A"])
    ng.links.new(inp.outputs["BaseColor"], mix.inputs["B"])
    ng.links.new(mix.outputs["Result"], out.inputs["Color"])
    return ng


def make_cel_material(name, base_hex, shad_hex, cel_ng):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    cel = nt.nodes.new("ShaderNodeGroup")
    cel.node_tree = cel_ng
    cel.inputs["BaseColor"].default_value = hex_to_lin(base_hex)
    cel.inputs["ShadowColor"].default_value = hex_to_lin(shad_hex)
    cel.inputs["Threshold"].default_value = 0.36
    nt.links.new(cel.outputs["Color"], out.inputs["Surface"])
    mat.use_fake_user = True
    return mat


def add_loft(bm, rings, closed_ends=True, mat_idx=0):
    v_rings = [[bm.verts.new(Vector(p)) for p in r] for r in rings]
    n = len(v_rings[0])
    for r0, r1 in zip(v_rings, v_rings[1:]):
        for i in range(n):
            ni = (i + 1) % n
            f = bm.faces.new((r0[i], r0[ni], r1[ni], r1[i]))
            f.material_index = mat_idx
    if closed_ends:
        bm.faces.new(list(reversed(v_rings[0]))).material_index = mat_idx
        bm.faces.new(v_rings[-1]).material_index = mat_idx
    return v_rings


def make_ring_along_frame(center, axis_u, axis_v, ru, rv, n=10):
    pts = []
    for i in range(n):
        a = (2.0 * math.pi * i) / n
        pts.append(center + axis_u * (math.cos(a) * ru) + axis_v * (math.sin(a) * rv))
    return pts


FINGER_SPECS = {
    "index": {
        "base": Vector((-0.031, 0.088, 0.002)),
        "dir": Vector((-0.06, 1.0, -0.02)).normalized(),
        "lens": (0.037, 0.024, 0.019),
        "rads": (0.0096, 0.0085, 0.0074, 0.0054),
    },
    "middle": {
        "base": Vector((-0.009, 0.092, 0.004)),
        "dir": Vector((0.0, 1.0, -0.01)).normalized(),
        "lens": (0.042, 0.026, 0.020),
        "rads": (0.0100, 0.0088, 0.0076, 0.0056),
    },
    "ring": {
        "base": Vector((0.013, 0.088, 0.002)),
        "dir": Vector((0.04, 1.0, -0.02)).normalized(),
        "lens": (0.038, 0.024, 0.019),
        "rads": (0.0093, 0.0082, 0.0070, 0.0052),
    },
    "pinky": {
        "base": Vector((0.033, 0.080, -0.002)),
        "dir": Vector((0.10, 1.0, -0.04)).normalized(),
        "lens": (0.029, 0.019, 0.016),
        "rads": (0.0080, 0.0070, 0.0060, 0.0045),
    },
    "thumb": {
        "base": Vector((-0.036, 0.024, -0.010)),
        "dir": Vector((-0.66, 0.72, -0.22)).normalized(),
        "lens": (0.034, 0.028, 0.022),
        "rads": (0.0132, 0.0110, 0.0094, 0.0070),
    },
}


def build_armature(col_rig):
    arm_data = bpy.data.armatures.new("HandArmature")
    arm_obj = bpy.data.objects.new("HandArmature", arm_data)
    col_rig.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_data.edit_bones

    def add_b(name, head, tail, parent=None, connected=False, roll=0.0):
        b = eb.new(name)
        b.head = Vector(head)
        b.tail = Vector(tail)
        b.roll = roll
        if parent:
            b.parent = eb[parent]
            b.use_connect = connected
        return b

    add_b("forearm", (0.0, -0.34, 0.0), (0.0, 0.0, 0.0))
    add_b("wrist", (0.0, 0.0, 0.0), (0.0, 0.025, 0.0), "forearm", True)
    add_b("palm", (0.0, 0.025, 0.0), (0.0, 0.092, 0.0), "wrist", True)

    for fname, spec in FINGER_SPECS.items():
        p0 = spec["base"].copy()
        d = spec["dir"]
        l1, l2, l3 = spec["lens"]
        p1 = p0 + d * l1
        p2 = p1 + d * l2
        p3 = p2 + d * l3
        # Align local +X so positive X rotation curls fingers cleanly downward (-Z / into palm)
        roll = math.radians(-38.0) if fname == "thumb" else 0.0
        add_b(f"{fname}_01", p0, p1, "palm", False, roll)
        add_b(f"{fname}_02", p1, p2, f"{fname}_01", True, roll)
        add_b(f"{fname}_03", p2, p3, f"{fname}_02", True, roll)

    bpy.ops.object.mode_set(mode="OBJECT")

    # Ensure XYZ Euler on all pose bones
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = "XYZ"

    # Bone-parented prop socket seated inside palm center
    sock = bpy.data.objects.new("prop_socket", None)
    sock.empty_display_type = "ARROWS"
    sock.empty_display_size = 0.03
    col_rig.objects.link(sock)
    sock.parent = arm_obj
    sock.parent_type = "BONE"
    sock.parent_bone = "palm"
    sock.location = Vector((0.0, 0.032, -0.028))

    arm_obj["gloves"] = 0
    return arm_obj


def build_hand_mesh(col_meshes, mats, arm_obj):
    """Build smooth subdivided 5-finger anatomical hand mesh with crisp per-phalanx vertex weights."""
    bm = bmesh.new()
    vert_weights = {}

    # 1. Sculpted anatomical palm (wrist y=-0.012 -> mid palm -> curved MCP knuckle arch y=0.092)
    palm_stations = [
        # (y, z_c, x_min, x_max, tz, weights)
        (-0.014, -0.002, -0.029, 0.029, 0.019, {"wrist": 0.7, "forearm": 0.3}),
        ( 0.006, -0.002, -0.034, 0.033, 0.020, {"wrist": 0.45, "palm": 0.55}),
        ( 0.034, -0.003, -0.043, 0.038, 0.020, {"palm": 1.0}),
        ( 0.064, -0.001, -0.044, 0.041, 0.017, {"palm": 1.0}),
        ( 0.088,  0.001, -0.041, 0.040, 0.013, {"palm": 1.0}),
        ( 0.095,  0.001, -0.034, 0.033, 0.008, {"palm": 1.0}),
    ]
    n_p = 14
    palm_rings = []
    for y, zc, xmin, xmax, tz, wmap in palm_stations:
        xc = 0.5 * (xmin + xmax)
        rx = 0.5 * (xmax - xmin)
        ring = []
        for i in range(n_p):
            a = (2.0 * math.pi * i) / n_p
            px = xc + math.cos(a) * rx
            # Slight dorsal arch & flatter palm underside
            sz = math.sin(a)
            pz = zc + sz * tz * (0.95 if sz > 0 else 0.88)
            # Subtle thenar pad fullness on thumb side (-X, -Z)
            if y > 0.005 and y < 0.055 and px < -0.010 and sz < 0:
                pz -= 0.005
            ring.append((px, y, pz))
        palm_rings.append((ring, wmap))

    v_palm = add_loft(bm, [r for r, _ in palm_rings], closed_ends=True, mat_idx=0)
    for ring_verts, (_, wmap) in zip(v_palm, palm_rings):
        for v in ring_verts:
            vert_weights[v] = dict(wmap)

    # 2. Five smooth tapered articulated fingers (each with clean joint rings at 01/02/03)
    for fname, spec in FINGER_SPECS.items():
        p0 = spec["base"]
        d = spec["dir"]
        l1, l2, l3 = spec["lens"]
        r0, r1, r2, r3 = spec["rads"]
        up_ref = Vector((0, 0, 1))
        u = d.cross(up_ref).normalized()
        v_ax = u.cross(d).normalized()

        # Station list along finger axis: (dist, radius, weight_map)
        b1, b2, b3 = f"{fname}_01", f"{fname}_02", f"{fname}_03"
        stations = [
            (-0.008, r0 * 1.12, {"palm": 0.75, b1: 0.25}),
            ( 0.002, r0 * 1.02, {"palm": 0.15, b1: 0.85}),
            ( l1 * 0.50, r0 * 0.94, {b1: 1.0}),
            ( l1 - 0.004, r1 * 1.02, {b1: 0.85, b2: 0.15}),
            ( l1 + 0.004, r1 * 0.98, {b1: 0.15, b2: 0.85}),
            ( l1 + l2 * 0.55, r1 * 0.91, {b2: 1.0}),
            ( l1 + l2 - 0.003, r2 * 1.00, {b2: 0.85, b3: 0.15}),
            ( l1 + l2 + 0.003, r2 * 0.96, {b2: 0.15, b3: 0.85}),
            ( l1 + l2 + l3 * 0.65, r3 * 1.05, {b3: 1.0}),
            ( l1 + l2 + l3 * 0.95, r3 * 0.72, {b3: 1.0}),
            ( l1 + l2 + l3 * 1.04, r3 * 0.30, {b3: 1.0}),
        ]
        rings = []
        wmaps = []
        for dist, rad, wm in stations:
            c = p0 + d * dist
            rings.append(make_ring_along_frame(c, u, v_ax, rad, rad * 0.92, n=10))
            wmaps.append(wm)
        v_f = add_loft(bm, rings, closed_ends=True, mat_idx=0)
        for rv, wm in zip(v_f, wmaps):
            for v in rv:
                vert_weights[v] = dict(wm)

    bm.verts.index_update()
    v_idx_w = {v.index: w for v, w in vert_weights.items()}

    mesh = bpy.data.meshes.new("HandMesh")
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new("HandMesh", mesh)
    col_meshes.objects.link(obj)
    obj.data.materials.append(mats["skin"])

    mod_arm = obj.modifiers.new("Armature", "ARMATURE")
    mod_arm.object = arm_obj
    mod_arm.use_deform_preserve_volume = True

    mod_sub = obj.modifiers.new("Subsurf", "SUBSURF")
    mod_sub.levels = 1
    mod_sub.render_levels = 1

    for b in arm_obj.data.bones:
        obj.vertex_groups.new(name=b.name)
    for idx, wm in v_idx_w.items():
        tot = sum(wm.values()) or 1.0
        for bn, w in wm.items():
            obj.vertex_groups[bn].add([idx], w / tot, "REPLACE")
    return obj


def build_sleeve_and_cuff(col_meshes, mats, arm_obj):
    """Full connected forearm cream shirt sleeve + pleated cuff extending far off-frame (zero severed wrists!)."""
    bm = bmesh.new()
    # Sleeve (mat_idx=0) from y=-0.42 (deep off-frame) to y=-0.045, then pleated cuff (mat_idx=1) to y=-0.006
    sleeve_rings = [
        make_ring_along_frame(Vector((0, -0.42, 0)), Vector((1, 0, 0)), Vector((0, 0, 1)), 0.056, 0.050, 14),
        make_ring_along_frame(Vector((0, -0.24, 0)), Vector((1, 0, 0)), Vector((0, 0, 1)), 0.047, 0.042, 14),
        make_ring_along_frame(Vector((0, -0.052, 0)), Vector((1, 0, 0)), Vector((0, 0, 1)), 0.036, 0.031, 14),
    ]
    add_loft(bm, sleeve_rings, closed_ends=True, mat_idx=0)

    cuff_rings = [
        make_ring_along_frame(Vector((0, -0.056, 0)), Vector((1, 0, 0)), Vector((0, 0, 1)), 0.040, 0.034, 14),
        make_ring_along_frame(Vector((0, -0.030, 0)), Vector((1, 0, 0)), Vector((0, 0, 1)), 0.038, 0.032, 14),
        make_ring_along_frame(Vector((0, -0.008, 0)), Vector((1, 0, 0)), Vector((0, 0, 1)), 0.035, 0.029, 14),
    ]
    add_loft(bm, cuff_rings, closed_ends=True, mat_idx=1)

    mesh = bpy.data.meshes.new("HandSleeve")
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new("HandSleeve", mesh)
    col_meshes.objects.link(obj)
    obj.data.materials.append(mats["shirt"])
    obj.data.materials.append(mats["cuff"])

    mod_arm = obj.modifiers.new("Armature", "ARMATURE")
    mod_arm.object = arm_obj
    mod_arm.use_deform_preserve_volume = True
    vg = obj.vertex_groups.new(name="forearm")
    vg.add([v.index for v in obj.data.vertices], 1.0, "REPLACE")

    # Toggleable leather glove cuff (hidden by default)
    bm_g = bmesh.new()
    gc_rings = [
        make_ring_along_frame(Vector((0, -0.042, 0)), Vector((1, 0, 0)), Vector((0, 0, 1)), 0.042, 0.036, 14),
        make_ring_along_frame(Vector((0, -0.004, 0)), Vector((1, 0, 0)), Vector((0, 0, 1)), 0.037, 0.031, 14),
    ]
    add_loft(bm_g, gc_rings, closed_ends=True, mat_idx=0)
    mg = bpy.data.meshes.new("HandGloveCuff")
    bm_g.to_mesh(mg)
    bm_g.free()
    for p in mg.polygons:
        p.use_smooth = True
    g_obj = bpy.data.objects.new("HandGloveCuff", mg)
    col_meshes.objects.link(g_obj)
    g_obj.data.materials.append(mats["glove_cuff"])
    mod_g = g_obj.modifiers.new("Armature", "ARMATURE")
    mod_g.object = arm_obj
    vg_g = g_obj.vertex_groups.new(name="forearm")
    vg_g.add([v.index for v in g_obj.data.vertices], 1.0, "REPLACE")
    g_obj.hide_viewport = True
    g_obj.hide_render = True
    return obj, g_obj


def setup_gp_lineart(col_lines, col_meshes):
    gp = bpy.data.grease_pencils.new("HandOutline")
    gp_obj = bpy.data.objects.new("HandOutline", gp)
    col_lines.objects.link(gp_obj)
    layer = gp.layers.new("Lines", set_active=True)
    layer.frames.new(1)

    ink_mat = bpy.data.materials.new("Mat_Hand_Ink")
    bpy.data.materials.create_gpencil_data(ink_mat)
    ink_mat.grease_pencil.show_stroke = True
    ink_mat.grease_pencil.show_fill = False
    ink_mat.grease_pencil.color = hex_to_lin(PALETTE["ink"], 1.0)
    gp.materials.append(ink_mat)

    m = gp_obj.modifiers.new("LineArt", "LINEART")
    m.source_type = "COLLECTION"
    m.source_collection = col_meshes
    m.target_layer = "Lines"
    m.target_material = ink_mat
    m.radius = 0.0022
    m.use_contour = True
    m.use_crease = True
    m.crease_threshold = math.radians(152.0)
    m.use_material = True
    m.use_intersection = False
    return gp_obj


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 8
    scene.render.film_transparent = True
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.fps = 24
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    try:
        scene.view_settings.view_transform = "Standard"
    except TypeError:
        pass

    world = bpy.data.worlds.new("HandWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.04, 0.04, 0.04, 1.0)
        bg.inputs[1].default_value = 1.0

    col_meshes = bpy.data.collections.new("HandMeshes")
    col_rig = bpy.data.collections.new("HandRig")
    col_lines = bpy.data.collections.new("HandLines")
    scene.collection.children.link(col_meshes)
    scene.collection.children.link(col_rig)
    scene.collection.children.link(col_lines)

    cel_ng = create_cel2tone_group()
    mats = {
        "skin": make_cel_material("Mat_Hand_Skin", PALETTE["skin_base"], PALETTE["skin_shadow"], cel_ng),
        "glove": make_cel_material("Mat_Hand_Glove", PALETTE["glove_base"], PALETTE["glove_shadow"], cel_ng),
        "glove_cuff": make_cel_material("Mat_Hand_GloveCuff", PALETTE["glove_cuff_base"], PALETTE["glove_cuff_shadow"], cel_ng),
        "shirt": make_cel_material("Mat_Hand_Shirt", PALETTE["shirt_base"], PALETTE["shirt_shadow"], cel_ng),
        "cuff": make_cel_material("Mat_Hand_Cuff", PALETTE["cuff_base"], PALETTE["cuff_shadow"], cel_ng),
    }

    arm_obj = build_armature(col_rig)
    build_hand_mesh(col_meshes, mats, arm_obj)
    build_sleeve_and_cuff(col_meshes, mats, arm_obj)
    setup_gp_lineart(col_lines, col_meshes)

    # Default camera & key light
    cam_data = bpy.data.cameras.new("HandCam")
    cam_data.lens = 50.0
    cam_data.clip_start = 0.02
    cam_obj = bpy.data.objects.new("HandCam", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = Vector((-0.02, 0.06, 0.42))
    cam_obj.rotation_euler = (Vector((0.0, 0.05, 0.0)) - cam_obj.location).normalized().to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam_obj

    key_data = bpy.data.lights.new("HandKeyLight", type="SUN")
    key_data.energy = 2.5
    key_obj = bpy.data.objects.new("HandKeyLight", key_data)
    scene.collection.objects.link(key_obj)
    key_obj.rotation_euler = Vector((-0.4, 0.35, -0.85)).normalized().to_track_quat("-Z", "Y").to_euler()

    BLEND_OUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"Successfully built {BLEND_OUT}")


if __name__ == "__main__":
    main()
