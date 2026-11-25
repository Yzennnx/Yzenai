#!/usr/bin/env python3
"""
Procedural builder for the 5 stylized 2-tone cel-shaded 3D Special Infected rigs
in Blender 5.2.4 LTS, matching the Series Lead (lead-rig.blend) pipeline.

Usage:
    blender --background --python tools/blender-rig/build-infected-rigs.py
    blender --background --python tools/blender-rig/build-infected-rigs.py -- --only hunter,tank

Outputs (under assets/series-lead/rig-3d/infected/):
    hunter-rig.blend
    smoker-rig.blend
    witch-rig.blend
    charger-rig.blend
    tank-rig.blend
"""

import argparse
import math
import os
import sys

import bpy
import bmesh
from mathutils import Vector, Matrix, Euler


# ---------------------------------------------------------------------------
# Paths & Constants
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
OUT_DIR = os.path.join(REPO_ROOT, "assets", "series-lead", "rig-3d", "infected")

INK_HEX = "#253a3b"
ALL_SPECIES = ("hunter", "smoker", "witch", "charger", "tank")


# ---------------------------------------------------------------------------
# Color & Shader Utilities (Exact Parity with build-lead-rig.py)
# ---------------------------------------------------------------------------
def srgb_to_lin_channel(c: float) -> float:
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def hex_to_lin(hex_color: str, alpha: float = 1.0) -> tuple:
    h = hex_color.lstrip("#")
    r = srgb_to_lin_channel(int(h[0:2], 16) / 255.0)
    g = srgb_to_lin_channel(int(h[2:4], 16) / 255.0)
    b = srgb_to_lin_channel(int(h[4:6], 16) / 255.0)
    return (r, g, b, alpha)


def create_cel2tone_group():
    """Exact Cel2Tone shader node group matching lead-rig.blend & render-shot.py lighting presets."""
    existing = bpy.data.node_groups.get("Cel2Tone")
    if existing is not None:
        return existing

    ng = bpy.data.node_groups.new("Cel2Tone", "ShaderNodeTree")
    s_base = ng.interface.new_socket("BaseColor", in_out="INPUT", socket_type="NodeSocketColor")
    s_base.default_value = (0.8, 0.8, 0.8, 1.0)
    s_shad = ng.interface.new_socket("ShadowColor", in_out="INPUT", socket_type="NodeSocketColor")
    s_shad.default_value = (0.4, 0.4, 0.4, 1.0)
    s_thresh = ng.interface.new_socket("Threshold", in_out="INPUT", socket_type="NodeSocketFloat")
    s_thresh.default_value = 0.35
    s_thresh.min_value = 0.0
    s_thresh.max_value = 1.0
    s_tint = ng.interface.new_socket("LightTintMix", in_out="INPUT", socket_type="NodeSocketFloat")
    s_tint.default_value = 0.0
    s_tint.min_value = 0.0
    s_tint.max_value = 1.0
    ng.interface.new_socket("Color", in_out="OUTPUT", socket_type="NodeSocketColor")

    inp = ng.nodes.new("NodeGroupInput")
    inp.location = (-700, 0)
    out = ng.nodes.new("NodeGroupOutput")
    out.location = (600, 0)

    diff = ng.nodes.new("ShaderNodeBsdfDiffuse")
    diff.inputs["Color"].default_value = (1.0, 1.0, 1.0, 1.0)
    diff.inputs["Roughness"].default_value = 1.0
    diff.location = (-700, 220)

    s2r = ng.nodes.new("ShaderNodeShaderToRGB")
    s2r.location = (-500, 220)
    ng.links.new(diff.outputs["BSDF"], s2r.inputs["Shader"])

    bw = ng.nodes.new("ShaderNodeRGBToBW")
    bw.location = (-320, 220)
    ng.links.new(s2r.outputs["Color"], bw.inputs["Color"])

    sub = ng.nodes.new("ShaderNodeMath")
    sub.operation = "SUBTRACT"
    sub.location = (-160, 220)
    ng.links.new(bw.outputs["Val"], sub.inputs[0])
    ng.links.new(inp.outputs["Threshold"], sub.inputs[1])

    add = ng.nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    add.inputs[1].default_value = 0.35
    add.location = (0, 220)
    ng.links.new(sub.outputs["Value"], add.inputs[0])

    ramp = ng.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    ramp.color_ramp.elements[1].position = 0.35
    ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    ramp.location = (160, 220)
    ng.links.new(add.outputs["Value"], ramp.inputs["Fac"])

    mix_step = ng.nodes.new("ShaderNodeMix")
    mix_step.data_type = "RGBA"
    mix_step.location = (220, 0)
    ng.links.new(ramp.outputs["Color"], mix_step.inputs[0])
    ng.links.new(inp.outputs["ShadowColor"], mix_step.inputs[6])
    ng.links.new(inp.outputs["BaseColor"], mix_step.inputs[7])

    mix_tint = ng.nodes.new("ShaderNodeMix")
    mix_tint.data_type = "RGBA"
    mix_tint.blend_type = "MULTIPLY"
    mix_tint.clamp_result = True
    mix_tint.location = (410, 0)
    ng.links.new(inp.outputs["LightTintMix"], mix_tint.inputs[0])
    ng.links.new(mix_step.outputs[2], mix_tint.inputs[6])
    ng.links.new(s2r.outputs["Color"], mix_tint.inputs[7])

    ng.links.new(mix_tint.outputs[2], out.inputs["Color"])
    return ng


def build_cel_material(name: str, base_hex: str, shadow_hex: str, threshold: float = 0.35):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (360, 0)

    cel = nt.nodes.new("ShaderNodeGroup")
    cel.name = "Cel2Tone"
    cel.node_tree = bpy.data.node_groups["Cel2Tone"]
    cel.inputs["BaseColor"].default_value = hex_to_lin(base_hex)
    cel.inputs["ShadowColor"].default_value = hex_to_lin(shadow_hex)
    cel.inputs["Threshold"].default_value = threshold
    cel.inputs["LightTintMix"].default_value = 0.0
    cel.location = (0, 0)

    nt.links.new(cel.outputs["Color"], out.inputs["Surface"])
    return mat


def build_emissive_material(name: str, hex_color: str, strength: float = 1.8):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)

    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = hex_to_lin(hex_color)
    em.inputs["Strength"].default_value = strength
    em.location = (0, 0)

    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


# ---------------------------------------------------------------------------
# Scene, Lighting, Camera & GPv3 Line Art (Shared Contract)
# ---------------------------------------------------------------------------
def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def setup_scene():
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0

    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 8
    scene.render.film_transparent = True
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"

    try:
        scene.view_settings.view_transform = "Standard"
    except TypeError:
        pass
    try:
        scene.view_settings.look = "None"
    except TypeError:
        pass

    world = bpy.data.worlds.new("InfectedWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.04, 0.04, 0.04, 1.0)
        bg.inputs[1].default_value = 1.0

    col_meshes = bpy.data.collections.new("RigMeshes")
    col_rig = bpy.data.collections.new("RigArmature")
    col_lines = bpy.data.collections.new("RigLines")
    scene.collection.children.link(col_meshes)
    scene.collection.children.link(col_rig)
    scene.collection.children.link(col_lines)
    return scene, col_meshes, col_rig, col_lines


def setup_camera_and_lights(scene, height_m: float = 1.70):
    scale = max(1.0, height_m / 1.70)
    cam_data = bpy.data.cameras.new("LeadCam")
    cam_data.lens = 45.0
    cam_data.sensor_width = 36.0
    cam_data.sensor_fit = "AUTO"
    cam_data.clip_start = 0.05
    cam_data.clip_end = 100.0
    cam_obj = bpy.data.objects.new("LeadCam", cam_data)
    scene.collection.objects.link(cam_obj)

    cam_pos = Vector((1.35 * scale, -2.95 * scale, 0.56 * height_m))
    aim_target = Vector((0.0, 0.0, 0.50 * height_m))
    cam_obj.location = cam_pos
    cam_obj.rotation_euler = (aim_target - cam_pos).normalized().to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam_obj

    # Primary ToonSun (exact same setup as lead-rig.blend)
    sun_data = bpy.data.lights.new("ToonSun", type="SUN")
    sun_data.energy = 2.4
    sun_data.color = (1.0, 0.99, 0.97)
    sun_data.angle = math.radians(1.5)
    sun_obj = bpy.data.objects.new("ToonSun", sun_data)
    scene.collection.objects.link(sun_obj)
    sun_dir = Vector((-0.45, 0.72, -0.52)).normalized()
    sun_obj.rotation_euler = sun_dir.to_track_quat("-Z", "Y").to_euler()

    # Soft Fill Sun (well below 0.35 cel threshold)
    fill_data = bpy.data.lights.new("ToonFill", type="SUN")
    fill_data.energy = 0.20
    fill_data.color = (0.88, 0.93, 1.0)
    fill_data.use_shadow = False
    fill_obj = bpy.data.objects.new("ToonFill", fill_data)
    scene.collection.objects.link(fill_obj)
    fill_dir = Vector((0.65, -0.45, 0.35)).normalized()
    fill_obj.rotation_euler = fill_dir.to_track_quat("-Z", "Y").to_euler()


def setup_gp_lineart(col_lines, col_meshes):
    """GPv3 Line Art matching lead-rig.blend & strict shared contract."""
    gp_data = bpy.data.grease_pencils.new("GP_LineArt")
    gp_obj = bpy.data.objects.new("GP_LineArt", gp_data)
    col_lines.objects.link(gp_obj)

    layer = gp_data.layers.new("Lines", set_active=True)
    layer.frames.new(1)

    ink_mat = bpy.data.materials.new("InkMat")
    bpy.data.materials.create_gpencil_data(ink_mat)
    ink_mat.grease_pencil.show_stroke = True
    ink_mat.grease_pencil.show_fill = False
    ink_mat.grease_pencil.color = hex_to_lin(INK_HEX)
    gp_data.materials.append(ink_mat)

    m = gp_obj.modifiers.new("LineArt", "LINEART")
    m.source_type = "COLLECTION"
    m.source_collection = col_meshes
    m.target_layer = "Lines"
    m.target_material = ink_mat
    m.radius = 0.0022
    m.use_contour = True
    m.use_material = True
    m.use_edge_mark = True
    m.use_intersection = True
    m.use_crease = True
    m.crease_threshold = math.radians(135.0)
    m.use_crease_on_smooth = False
    m.use_crease_on_sharp = True
    m.use_clip_plane_boundaries = True
    m.use_overlap_edge_type_support = False
    return gp_obj


# ---------------------------------------------------------------------------
# BMesh & Skinning Helpers
# ---------------------------------------------------------------------------
def new_mesh_object(name: str, bm: bmesh.types.BMesh, collection, materials=None, smooth=True):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    if smooth:
        for p in mesh.polygons:
            p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    if materials:
        for m in materials:
            mesh.materials.append(m)
    return obj


def add_armature_modifier(obj, arm_obj):
    mod = obj.modifiers.new("Armature", "ARMATURE")
    mod.object = arm_obj
    mod.use_vertex_groups = True
    mod.use_deform_preserve_volume = True
    return mod


def apply_vert_weights(obj, vert_idx_weights: dict, bone_names=None):
    all_bones = set(bone_names or ())
    for w_map in vert_idx_weights.values():
        all_bones.update(w_map.keys())
    for b_name in sorted(all_bones):
        if b_name not in obj.vertex_groups:
            obj.vertex_groups.new(name=b_name)
    for v_idx, w_map in vert_idx_weights.items():
        tot = sum(w_map.values()) or 1.0
        for b_name, w in w_map.items():
            if w > 1e-5:
                obj.vertex_groups[b_name].add([v_idx], w / tot, "REPLACE")


def ellipse_ring(cx, cy, cz, rx, ry, n=12, y_front_scale=1.0, y_back_scale=1.0, z_wave=0.0, z_freq=4):
    pts = []
    for i in range(n):
        ang = 2.0 * math.pi * i / n
        c = math.cos(ang)
        s = math.sin(ang)
        ry_eff = ry * (y_front_scale if s < 0.0 else y_back_scale)
        dz = z_wave * math.sin(ang * z_freq) if z_wave else 0.0
        pts.append((cx + c * rx, cy + s * ry_eff, cz + dz))
    return pts


def add_loft_rings(bm, rings, closed_ends=True, mat_idx=0, vert_weights=None, ring_weights=None):
    """Loft a list of equal-length point rings into a closed or open tube, optionally recording weights."""
    v_rings = []
    for r_i, ring in enumerate(rings):
        vr = []
        w_map = ring_weights[r_i] if ring_weights is not None else None
        for p in ring:
            v = bm.verts.new(Vector(p))
            vr.append(v)
            if vert_weights is not None and w_map is not None:
                vert_weights[v] = dict(w_map)
        v_rings.append(vr)

    n = len(v_rings[0])
    faces = []
    for r_i in range(len(v_rings) - 1):
        r0 = v_rings[r_i]
        r1 = v_rings[r_i + 1]
        for i in range(n):
            ni = (i + 1) % n
            f = bm.faces.new((r0[i], r0[ni], r1[ni], r1[i]))
            f.material_index = mat_idx
            faces.append(f)

    if closed_ends:
        f_start = bm.faces.new(list(reversed(v_rings[0])))
        f_start.material_index = mat_idx
        f_end = bm.faces.new(v_rings[-1])
        f_end.material_index = mat_idx
        faces.extend([f_start, f_end])
    return v_rings, faces


def add_uv_sphere(bm, center, rx, ry, rz, u_seg=10, v_seg=7, mat_idx=0, vert_weights=None, w_map=None):
    """Add an ellipsoid/bulb directly into a bmesh (for boils, knuckles, deltoid caps)."""
    cx, cy, cz = center
    rings = []
    for iv in range(1, v_seg):
        phi = math.pi * iv / v_seg - math.pi * 0.5
        cp = math.cos(phi)
        sp = math.sin(phi)
        ring = []
        for iu in range(u_seg):
            th = 2.0 * math.pi * iu / u_seg
            v = bm.verts.new(Vector((
                cx + math.cos(th) * cp * rx,
                cy + math.sin(th) * cp * ry,
                cz + sp * rz,
            )))
            if vert_weights is not None and w_map is not None:
                vert_weights[v] = dict(w_map)
            ring.append(v)
        rings.append(ring)

    v_bot = bm.verts.new(Vector((cx, cy, cz - rz)))
    v_top = bm.verts.new(Vector((cx, cy, cz + rz)))
    if vert_weights is not None and w_map is not None:
        vert_weights[v_bot] = dict(w_map)
        vert_weights[v_top] = dict(w_map)

    for r_i in range(len(rings) - 1):
        r0, r1 = rings[r_i], rings[r_i + 1]
        for i in range(u_seg):
            ni = (i + 1) % u_seg
            bm.faces.new((r0[i], r0[ni], r1[ni], r1[i])).material_index = mat_idx

    for i in range(u_seg):
        ni = (i + 1) % u_seg
        bm.faces.new((v_bot, rings[0][ni], rings[0][i])).material_index = mat_idx
        bm.faces.new((rings[-1][i], rings[-1][ni], v_top)).material_index = mat_idx


def add_tapered_claw_or_finger(bm, base_pt, mid_pt, tip_pt, r0, r1, r2, mat_idx=0,
                               vert_weights=None, w_map=None, n_seg=6):
    """Build a 3-station curved/tapered finger or claw along base -> mid -> tip."""
    pts = [Vector(base_pt), Vector(mid_pt), Vector(tip_pt)]
    rads = [r0, r1, r2]
    rings = []
    for idx, (pt, rad) in enumerate(zip(pts, rads)):
        if idx == 0:
            tan = (pts[1] - pts[0]).normalized()
        elif idx == len(pts) - 1:
            tan = (pts[-1] - pts[-2]).normalized()
        else:
            tan = (pts[idx + 1] - pts[idx - 1]).normalized()
        ref = Vector((0.0, 1.0, 0.0)) if abs(tan.y) < 0.85 else Vector((1.0, 0.0, 0.0))
        u = tan.cross(ref).normalized()
        v_dir = tan.cross(u).normalized()
        ring = []
        for i in range(n_seg):
            a = 2.0 * math.pi * i / n_seg
            p = pt + (u * math.cos(a) + v_dir * math.sin(a)) * rad
            ring.append(tuple(p))
        rings.append(ring)
    r_w = [w_map] * len(rings) if (vert_weights is not None and w_map is not None) else None
    add_loft_rings(bm, rings, closed_ends=True, mat_idx=mat_idx, vert_weights=vert_weights, ring_weights=r_w)


# ---------------------------------------------------------------------------
# Species Profiles (Calibrated to project-pose.py RIG_PROFILES, z=0 grounded)
# ---------------------------------------------------------------------------
SPECIES_SPECS = {
    "hunter": {
        "pelvis_z": 0.88,
        "ankle_z": 0.06,
        "thigh": 0.42,
        "shin": 0.40,
        "foot": 0.15,
        "spine_len": 0.20,
        "chest_len": 0.24,
        "neck_len": 0.09,
        "head_len": 0.21,
        "shoulder_half_w": 0.20,
        "hip_half_w": 0.10,
        "upper_arm_L": 0.37,
        "forearm_L": 0.34,
        "hand_L": 0.11,
        "upper_arm_R": 0.37,
        "forearm_R": 0.34,
        "hand_R": 0.11,
        "torso_r": 0.13,
        "limb_r": 0.056,
        "head_r": 0.105,
        "arm_r_L": 0.048,
        "arm_r_R": 0.048,
        "hunch_y": -0.02,
    },
    "smoker": {
        "pelvis_z": 1.06,
        "ankle_z": 0.06,
        "thigh": 0.51,
        "shin": 0.49,
        "foot": 0.15,
        "spine_len": 0.24,
        "chest_len": 0.30,
        "neck_len": 0.13,
        "head_len": 0.22,
        "shoulder_half_w": 0.19,
        "hip_half_w": 0.10,
        "upper_arm_L": 0.44,
        "forearm_L": 0.40,
        "hand_L": 0.12,
        "upper_arm_R": 0.44,
        "forearm_R": 0.40,
        "hand_R": 0.12,
        "torso_r": 0.12,
        "limb_r": 0.048,
        "head_r": 0.10,
        "arm_r_L": 0.040,
        "arm_r_R": 0.040,
        "hunch_y": -0.04,
    },
    "witch": {
        "pelvis_z": 0.86,
        "ankle_z": 0.05,
        "thigh": 0.41,
        "shin": 0.40,
        "foot": 0.13,
        "spine_len": 0.19,
        "chest_len": 0.23,
        "neck_len": 0.11,
        "head_len": 0.21,
        "shoulder_half_w": 0.15,
        "hip_half_w": 0.09,
        "upper_arm_L": 0.38,
        "forearm_L": 0.38,
        "hand_L": 0.14,
        "upper_arm_R": 0.38,
        "forearm_R": 0.38,
        "hand_R": 0.14,
        "torso_r": 0.095,
        "limb_r": 0.038,
        "head_r": 0.095,
        "arm_r_L": 0.030,
        "arm_r_R": 0.030,
        "hunch_y": -0.02,
    },
    "charger": {
        "pelvis_z": 1.02,
        "ankle_z": 0.07,
        "thigh": 0.49,
        "shin": 0.46,
        "foot": 0.16,
        "spine_len": 0.22,
        "chest_len": 0.30,
        "neck_len": 0.08,
        "head_len": 0.22,
        "shoulder_half_w": 0.30,
        "hip_half_w": 0.14,
        # Shriveled tiny left arm (+X, arm_scale_l=0.58) vs massive overgrown right arm (-X, arm_scale_r=1.45)
        "upper_arm_L": 0.31,
        "forearm_L": 0.28,
        "hand_L": 0.08,
        "upper_arm_R": 0.50,
        "forearm_R": 0.52,
        "hand_R": 0.18,
        "torso_r": 0.21,
        "limb_r": 0.085,
        "head_r": 0.11,
        "arm_r_L": 0.034,
        "arm_r_R": 0.125,
        "hunch_y": -0.04,
    },
    "tank": {
        "pelvis_z": 1.24,
        "ankle_z": 0.09,
        "thigh": 0.59,
        "shin": 0.56,
        "foot": 0.20,
        "spine_len": 0.28,
        "chest_len": 0.40,
        "neck_len": 0.07,
        "head_len": 0.24,
        "shoulder_half_w": 0.46,
        "hip_half_w": 0.20,
        "upper_arm_L": 0.56,
        "forearm_L": 0.54,
        "hand_L": 0.20,
        "upper_arm_R": 0.56,
        "forearm_R": 0.54,
        "hand_R": 0.20,
        "torso_r": 0.31,
        "limb_r": 0.13,
        "head_r": 0.12,
        "arm_r_L": 0.130,
        "arm_r_R": 0.130,
        "hunch_y": -0.06,
    },
}


# ---------------------------------------------------------------------------
# Shared Armature Builder (100% Bone Name & Orientation Parity with lead-rig)
# ---------------------------------------------------------------------------
def compute_skeleton_joints(spec: dict) -> dict:
    """Compute exact world-space rest joint coordinates for a species."""
    pz = spec["pelvis_z"]
    az = spec["ankle_z"]
    knee_z = az + spec["shin"]
    spine_top_z = pz + spec["spine_len"]
    chest_top_z = spine_top_z + spec["chest_len"]
    neck_top_z = chest_top_z + spec["neck_len"]
    head_top_z = neck_top_z + spec["head_len"]
    sh_z = chest_top_z - spec["chest_len"] * 0.20
    sh_w = spec["shoulder_half_w"]
    hip_w = spec["hip_half_w"]
    hy = spec.get("hunch_y", 0.0)

    joints = {
        "pelvis_z": pz,
        "spine_top_z": spine_top_z,
        "chest_top_z": chest_top_z,
        "neck_top_z": neck_top_z,
        "head_top_z": head_top_z,
        "sh_z": sh_z,
        "knee_z": knee_z,
        "ankle_z": az,
        "hip_w": hip_w,
        "sh_w": sh_w,
        "hunch_y": hy,
        "neck_y": hy * 0.6,
        "head_y": hy,
    }

    # Note: Facing -Y, +Z up => Left (_L) is +X (s=+1.0), Right (_R) is -X (s=-1.0)
    # Matches lead-rig.blend & actions.json (-rz abducts Left outward, +rz abducts Right outward).
    for side, s in (("L", 1.0), ("R", -1.0)):
        u_len = spec[f"upper_arm_{side}"]
        f_len = spec[f"forearm_{side}"]
        h_len = spec[f"hand_{side}"]
        sh_x = s * sh_w
        arm_x = s * (sh_w + spec[f"arm_r_{side}"] * 0.25)
        elbow_z = sh_z - u_len
        wrist_z = elbow_z - f_len
        hand_tip_z = wrist_z - h_len
        joints[f"sh_{side}"] = Vector((sh_x, hy * 0.2, sh_z))
        joints[f"elbow_{side}"] = Vector((arm_x, 0.015, elbow_z))
        joints[f"wrist_{side}"] = Vector((arm_x, 0.0, wrist_z))
        joints[f"hand_tip_{side}"] = Vector((arm_x, 0.0, hand_tip_z))

        joints[f"hip_{side}"] = Vector((s * hip_w, 0.0, pz))
        joints[f"knee_{side}"] = Vector((s * hip_w, -0.015, knee_z))
        joints[f"ankle_{side}"] = Vector((s * hip_w, 0.0, az))
        joints[f"toe_{side}"] = Vector((s * hip_w, -spec["foot"], 0.02))

    return joints


def build_armature(col_rig, spec: dict, joints: dict):
    arm_data = bpy.data.armatures.new("InfectedArmature")
    arm_data.display_type = "OCTAHEDRAL"
    arm_obj = bpy.data.objects.new("InfectedArmature", arm_data)
    col_rig.objects.link(arm_obj)

    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_data.edit_bones

    def add_bone(name, head, tail, parent=None, connect=False, deform=True):
        b = eb.new(name)
        b.head = Vector(head)
        b.tail = Vector(tail)
        b.roll = 0.0
        b.use_deform = deform
        if parent:
            b.parent = eb[parent]
            b.use_connect = connect
        return b

    pz = joints["pelvis_z"]
    stz = joints["spine_top_z"]
    ctz = joints["chest_top_z"]
    ntz = joints["neck_top_z"]
    htz = joints["head_top_z"]
    ny = joints["neck_y"]
    hy = joints["head_y"]

    add_bone("root", (0.0, 0.0, 0.0), (0.0, -0.22, 0.0), deform=False)
    add_bone("pelvis", (0.0, 0.0, pz), (0.0, 0.0, pz + 0.10), "root", False, True)
    add_bone("spine", (0.0, 0.0, pz), (0.0, ny * 0.4, stz), "pelvis", False, True)
    add_bone("chest", (0.0, ny * 0.4, stz), (0.0, ny, ctz), "spine", True, True)
    add_bone("neck", (0.0, ny, ctz), (0.0, hy, ntz), "chest", True, True)
    add_bone("head", (0.0, hy, ntz), (0.0, hy, htz), "neck", True, True)

    for side, s in (("L", 1.0), ("R", -1.0)):
        sh_root = Vector((s * spec["torso_r"] * 0.35, ny * 0.5, joints["sh_z"] + 0.01))
        sh_p = joints[f"sh_{side}"]
        el_p = joints[f"elbow_{side}"]
        wr_p = joints[f"wrist_{side}"]
        ht_p = joints[f"hand_tip_{side}"]

        add_bone(f"shoulder_{side}", sh_root, sh_p, "chest", False, True)
        add_bone(f"upper_arm_{side}", sh_p, el_p, f"shoulder_{side}", True, True)
        add_bone(f"forearm_{side}", el_p, wr_p, f"upper_arm_{side}", True, True)
        add_bone(f"hand_{side}", wr_p, ht_p, f"forearm_{side}", True, True)

        hp = joints[f"hip_{side}"]
        kn = joints[f"knee_{side}"]
        an = joints[f"ankle_{side}"]
        to = joints[f"toe_{side}"]

        add_bone(f"thigh_{side}", hp, kn, "pelvis", False, True)
        add_bone(f"shin_{side}", kn, an, f"thigh_{side}", True, True)
        add_bone(f"foot_{side}", an, to, f"shin_{side}", True, True)

    bpy.ops.object.mode_set(mode="POSE")

    for prop in ("ik_arm_L", "ik_arm_R", "ik_leg_L", "ik_leg_R"):
        arm_obj[prop] = 0.0
        arm_obj.id_properties_ui(prop).update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0)

    for pb in arm_obj.pose.bones:
        pb.rotation_mode = "XYZ"

    # Generous anatomical joint limits (accommodating extreme infected poses like Witch sobbing & Tank heave)
    joint_limits_deg = {
        "spine":       ((-40, 75),  (-35, 35), (-40, 40)),
        "chest":       ((-35, 55),  (-35, 35), (-35, 35)),
        "neck":        ((-45, 55),  (-60, 60), (-45, 45)),
        "head":        ((-45, 55),  (-55, 55), (-45, 45)),
        "thigh_L":     ((-135, 65), (-45, 45), (-50, 45)),
        "thigh_R":     ((-135, 65), (-45, 45), (-45, 50)),
        "shin_L":      ((0, 150),   (-12, 12), (-10, 10)),
        "shin_R":      ((0, 150),   (-12, 12), (-10, 10)),
        "foot_L":      ((-65, 55),  (-25, 25), (-30, 30)),
        "foot_R":      ((-65, 55),  (-25, 25), (-30, 30)),
        "upper_arm_L": ((-175, 85), (-95, 95), (-110, 100)),
        "upper_arm_R": ((-175, 85), (-95, 95), (-100, 110)),
        "forearm_L":   ((-150, 0),  (-20, 20), (-15, 15)),
        "forearm_R":   ((-150, 0),  (-20, 20), (-15, 15)),
        "hand_L":      ((-85, 85),  (-65, 65), (-40, 40)),
        "hand_R":      ((-85, 85),  (-65, 65), (-40, 40)),
    }

    for b_name, (rx, ry, rz) in joint_limits_deg.items():
        pb = arm_obj.pose.bones.get(b_name)
        if not pb:
            continue
        lim = pb.constraints.new("LIMIT_ROTATION")
        lim.name = "LimitRot"
        lim.owner_space = "LOCAL"
        lim.use_transform_limit = True
        lim.use_limit_x = True
        lim.use_limit_y = True
        lim.use_limit_z = True
        lim.min_x, lim.max_x = math.radians(rx[0]), math.radians(rx[1])
        lim.min_y, lim.max_y = math.radians(ry[0]), math.radians(ry[1])
        lim.min_z, lim.max_z = math.radians(rz[0]), math.radians(rz[1])

    bpy.ops.object.mode_set(mode="OBJECT")
    return arm_obj


def add_bone_socket(col_rig, arm_obj, sock_name: str, bone_name: str, target_world: Vector, size: float = 0.08):
    bpy.context.view_layer.update()
    emp = bpy.data.objects.new(sock_name, None)
    emp.empty_display_type = "ARROWS"
    emp.empty_display_size = size
    col_rig.objects.link(emp)

    emp.parent = arm_obj
    emp.parent_type = "BONE"
    emp.parent_bone = bone_name
    emp.matrix_parent_inverse.identity()

    pbone = arm_obj.pose.bones[bone_name]
    bone_tail_mat = arm_obj.matrix_world @ Matrix.Translation(pbone.tail) @ pbone.matrix.to_3x3().to_4x4()
    emp.location = bone_tail_mat.inverted() @ target_world
    return emp


# ---------------------------------------------------------------------------
# Reusable Sculpted Anatomy Builders (Rigid-Segment Weighting, Zero Noodles)
# ---------------------------------------------------------------------------
def build_sculpted_head_and_neck(
    col_meshes, arm_obj, spec, joints, skin_mat,
    jaw_width=0.78, jaw_jut=0.012, brow_heavy=0.010, cheek_hollow=0.0,
    cranium_tall=1.0, neck_thick=1.0, eye_glow_mat=None, name_prefix="Infected"
):
    """Build articulated neck + sculpted head with brow ridge, nose bridge, cheekbones & jaw."""
    hr = spec["head_r"]
    ctz = joints["chest_top_z"]
    ntz = joints["neck_top_z"]
    htz = joints["head_top_z"]
    hlen = htz - ntz
    ny = joints["neck_y"]
    hy = joints["head_y"]

    # 1. Neck
    bm_n = bmesh.new()
    vw_n = {}
    nr = hr * 0.44 * neck_thick
    neck_stations = [
        (ctz - 0.03, ny * 0.85, nr * 1.18, nr * 1.10, {"chest": 0.75, "neck": 0.25}),
        (ctz + 0.01, ny * 0.95, nr * 1.04, nr * 1.00, {"chest": 0.20, "neck": 0.80}),
        ((ctz + ntz) * 0.5, (ny + hy) * 0.5, nr * 0.94, nr * 0.94, {"neck": 1.0}),
        (ntz + 0.01, hy + 0.006, nr * 0.92, nr * 0.92, {"neck": 0.45, "head": 0.55}),
        (ntz + 0.04, hy + 0.010, nr * 0.86, nr * 0.86, {"head": 1.0}),
    ]
    n_rings = [ellipse_ring(0.0, cy, cz, rx, ry, 14) for cz, cy, rx, ry, _ in neck_stations]
    n_w = [w for *_, w in neck_stations]
    add_loft_rings(bm_n, n_rings, closed_ends=True, mat_idx=0, vert_weights=vw_n, ring_weights=n_w)
    bm_n.verts.index_update()
    idx_w = {v.index: w for v, w in vw_n.items()}
    neck_obj = new_mesh_object(f"{name_prefix}_Neck", bm_n, col_meshes, [skin_mat], smooth=True)
    add_armature_modifier(neck_obj, arm_obj)
    apply_vert_weights(neck_obj, idx_w, ("chest", "neck", "head"))

    # 2. Sculpted Head (z from ntz - 0.01 to htz)
    bm = bmesh.new()
    vw = {}
    n_ang = 24
    z0 = ntz - 0.010
    # (frac_z, rx_mul, yf_mul, yb_mul, yc_off, brow_p, nose_p, jaw_p, hollow)
    slices = [
        (0.00, 0.24 * jaw_width, 0.30, 0.16, -hr * 0.55 - jaw_jut, 0.0, 0.0, 0.008, 0.0),
        (0.10, 0.56 * jaw_width, 0.68, 0.36, -hr * 0.34 - jaw_jut, 0.0, 0.0, 0.010, 0.0),
        (0.22, 0.78 * jaw_width, 0.88, 0.62, -hr * 0.14 - jaw_jut * 0.6, 0.0, 0.0, 0.006, cheek_hollow),
        (0.35, 0.86, 0.94, 0.84, -hr * 0.04, 0.0, 0.004, 0.0, cheek_hollow * 0.7),
        (0.46, 0.92, 0.96, 0.94, 0.0, 0.0, 0.018, 0.0, 0.0),
        (0.58, 0.90, 0.94, 0.98, 0.0, 0.0, 0.008, 0.0, 0.0),
        (0.68, 0.92, 0.98, 1.00, 0.0, brow_heavy, 0.0, 0.0, 0.0),
        (0.80, 0.86, 0.92, 0.98, 0.004, brow_heavy * 0.4, 0.0, 0.0, 0.0),
        (0.92, 0.68, 0.74, 0.82, 0.006, 0.0, 0.0, 0.0, 0.0),
        (1.00, 0.32, 0.34, 0.40, 0.006, 0.0, 0.0, 0.0, 0.0),
    ]

    rings = []
    for fz, rxm, yfm, ybm, yco, bp, np_, jp, hol in slices:
        z = z0 + fz * hlen * cranium_tall
        ring = []
        for i in range(n_ang):
            th = 2.0 * math.pi * i / n_ang
            st = math.sin(th)
            ct = math.cos(th)
            x = st * (hr * rxm)
            # Optional gaunt cheek hollowing on sides of lower face
            if hol > 0.0 and abs(st) > 0.55 and ct > 0.1:
                x *= (1.0 - hol * (abs(st) - 0.55))
            ry = hr * (yfm if ct >= 0.0 else ybm)
            y = hy + yco - ct * ry
            if bp > 0.0 and ct > 0.45:
                y -= bp * ((ct - 0.45) / 0.55)
            if np_ > 0.0 and (i == 0 or i in (1, n_ang - 1)):
                y -= np_ * (1.0 if i == 0 else 0.25)
            if jp > 0.0 and ct > 0.6:
                y -= jp * ((ct - 0.6) / 0.4)
            ring.append((x, y, z))
        rings.append(ring)

    add_loft_rings(bm, rings, closed_ends=True, mat_idx=0, vert_weights=vw, ring_weights=[{"head": 1.0}] * len(rings))

    mats = [skin_mat]
    if eye_glow_mat is not None:
        mats.append(eye_glow_mat)
        eye_z = z0 + 0.57 * hlen * cranium_tall
        eye_y = hy - hr * 0.93
        eye_x = hr * 0.34
        ew = hr * 0.14
        eh = hr * 0.065
        for side in (1.0, -1.0):
            ex = side * eye_x
            v0 = bm.verts.new(Vector((ex - ew, eye_y - 0.004, eye_z - eh)))
            v1 = bm.verts.new(Vector((ex + ew, eye_y - 0.004, eye_z - eh)))
            v2 = bm.verts.new(Vector((ex + ew * 0.85, eye_y - 0.003, eye_z + eh)))
            v3 = bm.verts.new(Vector((ex - ew * 0.85, eye_y - 0.003, eye_z + eh)))
            for v in (v0, v1, v2, v3):
                vw[v] = {"head": 1.0}
            f = bm.faces.new((v0, v1, v2, v3))
            f.material_index = 1

    bm.verts.index_update()
    idx_w = {v.index: w for v, w in vw.items()}
    head_obj = new_mesh_object(f"{name_prefix}_Head", bm, col_meshes, mats, smooth=True)
    add_armature_modifier(head_obj, arm_obj)
    apply_vert_weights(head_obj, idx_w, ("head",))
    return neck_obj, head_obj


def build_sculpted_torso(
    col_meshes, arm_obj, spec, joints, torso_mat,
    waist_scale=0.86, chest_scale=1.12, depth_ratio=0.72,
    trap_bulge=0.0, hem_tatter=0.0, name="Infected_Torso"
):
    """Build sculpted anatomical torso (pelvis -> waist -> ribcage -> broad chest -> traps)."""
    bm = bmesh.new()
    vw = {}
    pz = joints["pelvis_z"]
    stz = joints["spine_top_z"]
    ctz = joints["chest_top_z"]
    ny = joints["neck_y"]
    tr = spec["torso_r"]
    sh_w = spec["shoulder_half_w"]

    stations = [
        (pz - 0.03, 0.0,      tr * 0.92, tr * depth_ratio * 0.92, hem_tatter, {"pelvis": 1.0}),
        (pz + 0.03, 0.0,      tr * waist_scale, tr * depth_ratio * 0.90, 0.0, {"pelvis": 0.70, "spine": 0.30}),
        ((pz + stz) * 0.55, ny * 0.25, tr * (waist_scale + 0.08), tr * depth_ratio * 0.95, 0.0, {"pelvis": 0.15, "spine": 0.85}),
        (stz,       ny * 0.45, tr * 1.04, tr * depth_ratio * 1.02, 0.0, {"spine": 0.45, "chest": 0.55}),
        (stz + (ctz - stz) * 0.42, ny * 0.70, max(tr * chest_scale, sh_w * 0.86), tr * depth_ratio * 1.10, 0.0, {"chest": 1.0}),
        (stz + (ctz - stz) * 0.78, ny * 0.88, max(tr * (chest_scale * 0.96), sh_w * 0.90), tr * depth_ratio * 1.04, 0.0, {"chest": 1.0}),
        (ctz - 0.01, ny * 0.96, tr * 0.78, tr * depth_ratio * 0.82, 0.0, {"chest": 0.88, "neck": 0.12}),
        (ctz + 0.02 + trap_bulge, ny * 1.00, tr * 0.44, tr * depth_ratio * 0.50, 0.0, {"chest": 0.40, "neck": 0.60}),
    ]

    rings = []
    r_w = []
    for cz, cy, rx, ry, zw, w_map in stations:
        # Subtle back-hunch volume on upper chest
        yb_s = 1.0 + (0.28 if (trap_bulge > 0 and cz > stz) else 0.08)
        rings.append(ellipse_ring(0.0, cy, cz, rx, ry, 16, y_front_scale=1.0, y_back_scale=yb_s, z_wave=zw, z_freq=6))
        r_w.append(w_map)

    add_loft_rings(bm, rings, closed_ends=True, mat_idx=0, vert_weights=vw, ring_weights=r_w)

    # Optional massive trapezius / upper-back hump (Tank & Charger)
    if trap_bulge > 0.015:
        add_uv_sphere(
            bm,
            center=(0.0, ny + tr * 0.30, ctz - 0.02 + trap_bulge * 0.5),
            rx=sh_w * 0.72, ry=tr * 0.58, rz=trap_bulge * 2.4 + 0.06,
            u_seg=14, v_seg=8, mat_idx=0, vert_weights=vw, w_map={"chest": 0.85, "neck": 0.15},
        )

    bm.verts.index_update()
    idx_w = {v.index: w for v, w in vw.items()}
    obj = new_mesh_object(name, bm, col_meshes, [torso_mat], smooth=True)
    add_armature_modifier(obj, arm_obj)
    apply_vert_weights(obj, idx_w, ("pelvis", "spine", "chest", "neck"))
    return obj


def build_sculpted_arms_and_hands(
    col_meshes, arm_obj, spec, joints,
    upper_mat, forearm_mat, hand_mat, claw_mat=None,
    sleeve_frac=0.0, hand_style="clawed", claw_len=0.055,
    tape_mat=None, name="Infected_Arms"
):
    """
    Build articulated left & right arms with sculpted deltoids, tapered biceps/forearms,
    rigid-segment elbow hinges (zero noodle arms), and clawed or boulder-fist hands.
    """
    bm = bmesh.new()
    vw = {}
    mats = [upper_mat, forearm_mat, hand_mat]
    claw_idx = 2
    if claw_mat is not None:
        claw_idx = len(mats)
        mats.append(claw_mat)
    tape_idx = None
    if tape_mat is not None:
        tape_idx = len(mats)
        mats.append(tape_mat)

    for side, s in (("L", 1.0), ("R", -1.0)):
        sh = joints[f"sh_{side}"]
        el = joints[f"elbow_{side}"]
        wr = joints[f"wrist_{side}"]
        ht = joints[f"hand_tip_{side}"]
        ar = spec[f"arm_r_{side}"]
        u_len = (sh - el).length
        f_len = (el - wr).length
        h_len = (wr - ht).length

        # Sculpted deltoid shoulder cap bridging torso -> upper arm
        add_uv_sphere(
            bm,
            center=(sh.x - s * ar * 0.12, sh.y, sh.z + ar * 0.12),
            rx=ar * 1.25, ry=ar * 1.18, rz=ar * 1.22,
            u_seg=12, v_seg=7, mat_idx=0, vert_weights=vw,
            w_map={"chest": 0.25, f"shoulder_{side}": 0.45, f"upper_arm_{side}": 0.30},
        )

        # Upper arm -> crisp 3-ring rigid elbow hinge -> tapered forearm
        u_b = f"upper_arm_{side}"
        f_b = f"forearm_{side}"
        h_b = f"hand_{side}"

        # Compute sleeve material transition along arm (mat 0 = upper/sleeve, mat 1 = forearm/skin)
        def p_u(t):
            return sh.lerp(el, t)

        def p_f(t):
            return el.lerp(wr, t)

        hinge_d = min(0.028, u_len * 0.08)
        arm_stations = [
            # (pos, rx, ry, mat_idx, weights)
            (p_u(0.00), ar * 1.08, ar * 1.06, 0, {f"shoulder_{side}": 0.25, u_b: 0.75}),
            (p_u(0.22), ar * 1.12, ar * 1.14, 0, {u_b: 1.0}),   # bicep/tricep swell
            (p_u(0.55), ar * 1.02, ar * 1.04, 0, {u_b: 1.0}),
            (el + Vector((0, 0, hinge_d)),  ar * 0.90, ar * 0.92, 0, {u_b: 0.96, f_b: 0.04}),
            (el,                            ar * 0.88, ar * 0.90, 1 if sleeve_frac < 0.5 else 0, {u_b: 0.50, f_b: 0.50}),
            (el - Vector((0, 0, hinge_d)),  ar * 0.94, ar * 0.96, 1, {u_b: 0.04, f_b: 0.96}),
            (p_f(0.28), ar * 1.04, ar * 1.06, 1, {f_b: 1.0}),   # brachioradialis forearm swell
            (p_f(0.68), ar * 0.82, ar * 0.84, 1, {f_b: 1.0}),
            (p_f(0.95), ar * 0.68, ar * 0.70, 1, {f_b: 0.90, h_b: 0.10}),
            (wr,        ar * 0.62, ar * 0.64, 1, {f_b: 0.50, h_b: 0.50}),
        ]

        v_rings = []
        for pos, rx, ry, m_i, w_m in arm_stations:
            pts = ellipse_ring(pos.x, pos.y, pos.z, rx, ry, 10)
            vr = []
            for p in pts:
                v = bm.verts.new(Vector(p))
                vw[v] = dict(w_m)
                vr.append(v)
            v_rings.append((vr, m_i))

        for idx in range(len(v_rings) - 1):
            r0, _ = v_rings[idx]
            r1, m_i = v_rings[idx + 1]
            for i in range(10):
                ni = (i + 1) % 10
                bm.faces.new((r0[i], r0[ni], r1[ni], r1[i])).material_index = m_i
        bm.faces.new(list(reversed(v_rings[0][0]))).material_index = v_rings[0][1]
        bm.faces.new(v_rings[-1][0]).material_index = v_rings[-1][1]

        # Optional Hunter forearm tape wrap bands (raised sculpted wraps around forearm)
        if tape_idx is not None:
            for frac in (0.36, 0.52, 0.68, 0.82):
                tp = p_f(frac)
                tr_rad = ar * (0.98 - 0.24 * frac) + 0.0055
                band = [
                    ellipse_ring(tp.x, tp.y, tp.z + 0.016, tr_rad, tr_rad * 1.02, 10),
                    ellipse_ring(tp.x, tp.y, tp.z - 0.016, tr_rad * 0.98, tr_rad, 10),
                ]
                add_loft_rings(bm, band, closed_ends=True, mat_idx=tape_idx, vert_weights=vw, ring_weights=[{f_b: 1.0}, {f_b: 1.0}])

        # Hands: either boulder fist (Tank / Charger right) or sculpted clawed hand
        is_fist = (hand_style == "fist") or (hand_style == "charger" and side == "R")
        if is_fist:
            # Massive sculpted boulder fist + protruding thumb & knuckle ridge
            fist_r = ar * 0.96
            fist_rings = [
                ellipse_ring(wr.x, wr.y, wr.z + 0.005, fist_r * 0.72, fist_r * 0.75, 10),
                ellipse_ring(wr.x, wr.y - fist_r * 0.12, wr.z - h_len * 0.30, fist_r * 1.08, fist_r * 1.15, 10),
                ellipse_ring(wr.x - s * fist_r * 0.10, wr.y - fist_r * 0.16, wr.z - h_len * 0.68, fist_r * 1.12, fist_r * 1.18, 10),
                ellipse_ring(wr.x - s * fist_r * 0.16, wr.y - fist_r * 0.08, wr.z - h_len * 0.96, fist_r * 0.82, fist_r * 0.86, 10),
            ]
            add_loft_rings(bm, fist_rings, closed_ends=True, mat_idx=2, vert_weights=vw, ring_weights=[{h_b: 1.0}] * len(fist_rings))
            # Thumb wrapped across front-inner side of fist
            add_tapered_claw_or_finger(
                bm,
                (wr.x - s * fist_r * 0.35, wr.y - fist_r * 0.65, wr.z - h_len * 0.25),
                (wr.x - s * fist_r * 0.55, wr.y - fist_r * 0.95, wr.z - h_len * 0.52),
                (wr.x - s * fist_r * 0.25, wr.y - fist_r * 0.85, wr.z - h_len * 0.72),
                fist_r * 0.34, fist_r * 0.28, fist_r * 0.20,
                mat_idx=2, vert_weights=vw, w_map={h_b: 1.0},
            )
        else:
            # Sculpted flat-beveled palm + 4 spread/curled clawed fingers + thumb
            pw_y = max(0.024, ar * 0.78)
            pt_x = max(0.012, ar * 0.36)
            palm_len = h_len * 0.58
            palm_rings = [
                ellipse_ring(wr.x, wr.y, wr.z + 0.004, pt_x * 1.10, pw_y * 0.78, 8),
                ellipse_ring(wr.x, wr.y - 0.003, wr.z - palm_len * 0.45, pt_x * 1.15, pw_y * 1.05, 8),
                ellipse_ring(wr.x - s * 0.004, wr.y - 0.004, wr.z - palm_len, pt_x * 0.95, pw_y * 1.10, 8),
            ]
            add_loft_rings(bm, palm_rings, closed_ends=True, mat_idx=2, vert_weights=vw, ring_weights=[{h_b: 1.0}] * len(palm_rings))

            # 4 clawed fingers
            cl = claw_len * (0.55 if (hand_style == "charger" and side == "L") else 1.0)
            f_rad = max(0.0045, ar * 0.16)
            for idx_f, y_frac in enumerate((-0.78, -0.26, 0.26, 0.76)):
                fy = wr.y + y_frac * pw_y * 0.92
                len_mul = 1.0 if idx_f in (1, 2) else 0.84
                base = (wr.x - s * 0.004, fy, wr.z - palm_len * 0.92)
                mid = (wr.x - s * (0.012 + cl * 0.18), fy - 0.006, wr.z - palm_len - cl * 0.52 * len_mul)
                tip = (wr.x - s * (0.024 + cl * 0.42), fy - 0.012, wr.z - palm_len - cl * 1.05 * len_mul)
                add_tapered_claw_or_finger(
                    bm, base, mid, tip, f_rad, f_rad * 0.72, f_rad * 0.22,
                    mat_idx=claw_idx, vert_weights=vw, w_map={h_b: 1.0},
                )
            # Opposable clawed thumb
            add_tapered_claw_or_finger(
                bm,
                (wr.x - s * 0.006, wr.y - pw_y * 0.85, wr.z - palm_len * 0.35),
                (wr.x - s * (0.018 + cl * 0.12), wr.y - pw_y * 1.25, wr.z - palm_len * 0.75 - cl * 0.20),
                (wr.x - s * (0.026 + cl * 0.22), wr.y - pw_y * 1.15, wr.z - palm_len - cl * 0.48),
                f_rad * 1.15, f_rad * 0.82, f_rad * 0.24,
                mat_idx=claw_idx, vert_weights=vw, w_map={h_b: 1.0},
            )

    bm.verts.index_update()
    idx_w = {v.index: w for v, w in vw.items()}
    obj = new_mesh_object(name, bm, col_meshes, mats, smooth=True)
    add_armature_modifier(obj, arm_obj)
    apply_vert_weights(obj, idx_w)
    return obj


def build_sculpted_legs_and_feet(
    col_meshes, arm_obj, spec, joints,
    trouser_mat, shin_mat, foot_mat,
    shorts_mode=False, torn_calf_mode=False, bare_feet=False,
    cargo_pockets=False, name="Infected_Legs"
):
    """
    Build articulated pelvis + Y-branching sculpted legs with rigid knee hinges
    (zero noodle legs) and grounded boots or bare feet resting flat at z = 0.0.
    """
    bm = bmesh.new()
    vw = {}
    mats = [trouser_mat, shin_mat, foot_mat]

    pz = joints["pelvis_z"]
    kz = joints["knee_z"]
    az = joints["ankle_z"]
    hw = joints["hip_w"]
    lr = spec["limb_r"]
    tr = spec["torso_r"]

    # Pelvis block (continuous waist -> hip -> crotch)
    pelvis_rings = [
        ellipse_ring(0.0, 0.0, pz + 0.04, tr * 0.98, tr * 0.70, 14),
        ellipse_ring(0.0, 0.0, pz - 0.01, max(tr * 1.02, hw + lr * 0.88), tr * 0.72, 14),
        ellipse_ring(0.0, 0.0, pz - 0.08, max(tr * 0.94, hw + lr * 0.76), tr * 0.64, 14),
    ]
    add_loft_rings(
        bm, pelvis_rings, closed_ends=True, mat_idx=0, vert_weights=vw,
        ring_weights=[{"pelvis": 1.0}, {"pelvis": 1.0}, {"pelvis": 0.90, "thigh_L": 0.05, "thigh_R": 0.05}],
    )

    for side, s in (("L", 1.0), ("R", -1.0)):
        cx = s * hw
        t_b = f"thigh_{side}"
        s_b = f"shin_{side}"
        f_b = f"foot_{side}"
        hinge_d = min(0.032, (pz - kz) * 0.08)

        # Material index per station: 0 = trousers/shorts, 1 = exposed lower leg/skin
        m_mid_thigh = 0
        m_knee = 1 if shorts_mode else 0
        m_calf = 1 if (shorts_mode or torn_calf_mode) else 0
        m_ankle = 1 if (shorts_mode or torn_calf_mode) else 0

        leg_stations = [
            (cx,  0.000, pz - 0.02, lr * 1.26, lr * 1.30, 0,          {"pelvis": 0.35, t_b: 0.65}),
            (cx, -0.004, pz - (pz - kz) * 0.32, lr * 1.18, lr * 1.24, m_mid_thigh, {t_b: 1.0}),
            (cx, -0.010, pz - (pz - kz) * 0.68, lr * 1.02, lr * 1.08, m_knee,      {t_b: 1.0}),
            (cx, -0.014, kz + hinge_d, lr * 0.94, lr * 0.98, m_knee,  {t_b: 0.90, s_b: 0.10}),
            (cx, -0.016, kz,           lr * 0.92, lr * 0.96, m_knee,  {t_b: 0.50, s_b: 0.50}),
            (cx, -0.013, kz - hinge_d, lr * 0.96, lr * 1.02, m_knee,  {t_b: 0.10, s_b: 0.90}),
            (cx,  0.004, kz - (kz - az) * 0.32, lr * 1.02, lr * 1.08, m_calf,  {s_b: 1.0}),  # sculpted calf muscle
            (cx,  0.002, kz - (kz - az) * 0.72, lr * 0.80, lr * 0.84, m_ankle, {s_b: 1.0}),
            (cx,  0.000, az + 0.015,            lr * 0.72, lr * 0.74, m_ankle, {s_b: 0.85, f_b: 0.15}),
            (cx,  0.000, az - 0.010,            lr * 0.68, lr * 0.70, m_ankle, {s_b: 0.35, f_b: 0.65}),
        ]

        v_rings = []
        for lx, ly, lz, rx, ry, m_i, w_m in leg_stations:
            pts = ellipse_ring(lx, ly, lz, rx, ry, 10)
            vr = []
            for p in pts:
                v = bm.verts.new(Vector(p))
                vw[v] = dict(w_m)
                vr.append(v)
            v_rings.append((vr, m_i))

        for idx in range(len(v_rings) - 1):
            r0, _ = v_rings[idx]
            r1, m_i = v_rings[idx + 1]
            for i in range(10):
                ni = (i + 1) % 10
                bm.faces.new((r0[i], r0[ni], r1[ni], r1[i])).material_index = m_i
        bm.faces.new(list(reversed(v_rings[0][0]))).material_index = v_rings[0][1]
        bm.faces.new(v_rings[-1][0]).material_index = v_rings[-1][1]

        # Optional side cargo pockets (Hunter)
        if cargo_pockets:
            pk_z = pz - (pz - kz) * 0.44
            pk_x = cx + s * (lr * 1.08)
            pk_rings = [
                ellipse_ring(pk_x, 0.0, pk_z + 0.055, lr * 0.28, lr * 0.72, 8),
                ellipse_ring(pk_x + s * 0.006, 0.0, pk_z - 0.055, lr * 0.26, lr * 0.70, 8),
            ]
            add_loft_rings(bm, pk_rings, closed_ends=True, mat_idx=0, vert_weights=vw, ring_weights=[{t_b: 1.0}, {t_b: 1.0}])

        # Grounded Foot / Boot (bottom flat at z = 0.000!)
        fl = spec["foot"]
        fw = max(0.036, lr * 0.84)
        fh = az * (0.70 if bare_feet else 1.05)
        heel_y = lr * 0.85
        toe_y = -(fl + lr * 0.55)

        def foot_ring(z_val, scale_w=1.0, y_t=toe_y, y_h=heel_y):
            return [
                (cx,                    y_t,          z_val),
                (cx + s * fw * 0.85 * scale_w, y_t * 0.72, z_val),
                (cx + s * fw * 1.00 * scale_w, y_t * 0.25, z_val),
                (cx + s * fw * 0.82 * scale_w, y_h * 0.65, z_val),
                (cx,                    y_h,          z_val),
                (cx - s * fw * 0.78 * scale_w, y_h * 0.65, z_val),
                (cx - s * fw * 0.92 * scale_w, y_t * 0.25, z_val),
                (cx - s * fw * 0.78 * scale_w, y_t * 0.72, z_val),
            ]

        f_rings = [
            foot_ring(0.000, 0.98, toe_y, heel_y),
            foot_ring(0.022, 1.02, toe_y * 0.98, heel_y * 0.98),
            foot_ring(fh * 0.68, 0.82, toe_y * 0.62, heel_y * 0.86),
            foot_ring(fh + 0.02, 0.66, toe_y * 0.22, heel_y * 0.70),
        ]
        f_weights = [{f_b: 1.0}, {f_b: 1.0}, {f_b: 0.90, s_b: 0.10}, {f_b: 0.35, s_b: 0.65}]
        add_loft_rings(bm, f_rings, closed_ends=True, mat_idx=2, vert_weights=vw, ring_weights=f_weights)

    bm.verts.index_update()
    idx_w = {v.index: w for v, w in vw.items()}
    obj = new_mesh_object(name, bm, col_meshes, mats, smooth=True)
    add_armature_modifier(obj, arm_obj)
    apply_vert_weights(obj, idx_w)
    return obj


# ---------------------------------------------------------------------------
# Species-Specific Signature Details
# ---------------------------------------------------------------------------
def build_hunter_hood_cowl(col_meshes, arm_obj, spec, joints, hoodie_mat, inner_mat):
    """Sculpted pointed hoodie cowl overhanging Hunter's brow and draping onto shoulders."""
    bm = bmesh.new()
    vw = {}
    hr = spec["head_r"]
    ctz = joints["chest_top_z"]
    ntz = joints["neck_top_z"]
    htz = joints["head_top_z"]
    hy = joints["head_y"]
    ny = joints["neck_y"]

    # Pointed hood shell from collar base up over cranium with overhanging front visor peak
    n_ang = 20
    # (z, yc, rx, y_front, y_back, peak_push, weight_map)
    hood_slices = [
        (ctz - 0.02, ny,        hr * 1.45, hr * 1.18, hr * 1.25, 0.000, {"chest": 0.85, "neck": 0.15}),
        (ntz - 0.01, (ny+hy)/2, hr * 1.32, hr * 1.14, hr * 1.32, 0.005, {"neck": 0.55, "head": 0.45}),
        (ntz + 0.06, hy,        hr * 1.24, hr * 1.12, hr * 1.40, 0.012, {"head": 1.0}),
        (ntz + 0.14, hy,        hr * 1.20, hr * 1.24, hr * 1.46, 0.036, {"head": 1.0}),  # overhanging brow cowl
        (htz + 0.01, hy + 0.02, hr * 1.02, hr * 1.16, hr * 1.50, 0.044, {"head": 1.0}),  # pointed hood ridge
        (htz + 0.045, hy + 0.05, hr * 0.46, hr * 0.50, hr * 1.10, 0.020, {"head": 1.0}), # peaked apex
    ]

    outer_rings = []
    inner_rings = []
    for z, yc, rx, yf, yb, peak, w_m in hood_slices:
        o_r = []
        i_r = []
        for i in range(n_ang):
            # Leave front face opening between -38 deg and +38 deg on lower/mid slices, closing at brow/crown
            th = 2.0 * math.pi * i / n_ang
            st = math.sin(th)
            ct = math.cos(th)
            ry = yf if ct >= 0.0 else yb
            y = yc - ct * ry
            x = st * rx
            z_mod = z
            if ct > 0.65:
                # Overhanging front brow hood peak dips slightly downward at center
                y -= peak * ((ct - 0.65) / 0.35)
                if z > ntz + 0.10:
                    z_mod -= 0.014 * ((ct - 0.65) / 0.35)
            # Open front face cutout on lower slices by pulling front center down to collarbone
            if ct > 0.72 and z < ntz + 0.12:
                z_mod = min(z_mod, ctz + 0.02)
            v_o = bm.verts.new(Vector((x, y, z_mod)))
            v_i = bm.verts.new(Vector((x * 0.90, y + (0.012 if ct >= 0 else -0.012), z_mod - 0.004)))
            vw[v_o] = dict(w_m)
            vw[v_i] = dict(w_m)
            o_r.append(v_o)
            i_r.append(v_i)
        outer_rings.append(o_r)
        inner_rings.append(i_r)

    for r_i in range(len(outer_rings) - 1):
        r0, r1 = outer_rings[r_i], outer_rings[r_i + 1]
        for i in range(n_ang):
            ni = (i + 1) % n_ang
            bm.faces.new((r0[i], r0[ni], r1[ni], r1[i])).material_index = 0
    bm.faces.new(outer_rings[-1]).material_index = 0

    for r_i in range(len(inner_rings) - 1):
        r0, r1 = inner_rings[r_i], inner_rings[r_i + 1]
        for i in range(n_ang):
            ni = (i + 1) % n_ang
            bm.faces.new((r1[i], r1[ni], r0[ni], r0[i])).material_index = 1
    bm.faces.new(list(reversed(inner_rings[-1]))).material_index = 1

    # Stitch bottom collar edge
    for i in range(n_ang):
        ni = (i + 1) % n_ang
        bm.faces.new((inner_rings[0][i], inner_rings[0][ni], outer_rings[0][ni], outer_rings[0][i])).material_index = 0

    bm.verts.index_update()
    idx_w = {v.index: w for v, w in vw.items()}
    obj = new_mesh_object("Hunter_HoodCowl", bm, col_meshes, [hoodie_mat, inner_mat], smooth=True)
    add_armature_modifier(obj, arm_obj)
    apply_vert_weights(obj, idx_w, ("chest", "neck", "head"))
    return obj


def build_smoker_boils(col_meshes, arm_obj, spec, joints, boil_mat):
    """4-5 bulbous spore-boil clusters along Smoker's left shoulder (+X), upper chest, and neck."""
    bm = bmesh.new()
    vw = {}
    ctz = joints["chest_top_z"]
    ntz = joints["neck_top_z"]
    sh_l = joints["sh_L"]
    ny = joints["neck_y"]

    boil_specs = [
        # (center, rx, ry, rz, weights)
        ((sh_l.x * 0.72, ny + 0.02, ctz - 0.03), 0.052, 0.048, 0.054, {"chest": 0.7, "shoulder_L": 0.3}),
        ((sh_l.x * 0.96, ny - 0.01, ctz - 0.07), 0.044, 0.042, 0.046, {"chest": 0.4, "shoulder_L": 0.6}),
        ((sh_l.x * 0.48, ny - 0.05, ctz - 0.08), 0.038, 0.036, 0.040, {"chest": 1.0}),
        ((0.058,         ny + 0.01, (ctz + ntz) * 0.50), 0.034, 0.032, 0.036, {"neck": 0.8, "chest": 0.2}),
        ((0.046,         ny - 0.03, ntz - 0.02), 0.026, 0.024, 0.028, {"neck": 0.6, "head": 0.4}),
    ]
    for center, rx, ry, rz, w_m in boil_specs:
        add_uv_sphere(bm, center, rx, ry, rz, u_seg=10, v_seg=7, mat_idx=0, vert_weights=vw, w_map=w_m)

    bm.verts.index_update()
    idx_w = {v.index: w for v, w in vw.items()}
    obj = new_mesh_object("Smoker_Boils", bm, col_meshes, [boil_mat], smooth=True)
    add_armature_modifier(obj, arm_obj)
    apply_vert_weights(obj, idx_w, ("chest", "shoulder_L", "neck", "head"))
    return obj


def build_witch_hair_drape(col_meshes, arm_obj, spec, joints, hair_mat):
    """Long tattered pale-gray hair dome + hanging face-framing & back locks."""
    bm = bmesh.new()
    vw = {}
    hr = spec["head_r"]
    ctz = joints["chest_top_z"]
    ntz = joints["neck_top_z"]
    htz = joints["head_top_z"]
    hy = joints["head_y"]

    # 1. Crown hair cap hugging skull
    n_ang = 18
    cap_slices = [
        (ntz + 0.05, hy + 0.01, hr * 1.04, hr * 0.94, hr * 1.12),
        (ntz + 0.12, hy + 0.01, hr * 1.06, hr * 1.04, hr * 1.14),
        (htz - 0.03, hy + 0.01, hr * 0.92, hr * 0.94, hr * 1.02),
        (htz + 0.015, hy + 0.01, hr * 0.48, hr * 0.50, hr * 0.56),
    ]
    cap_rings = []
    for z, yc, rx, yf, yb in cap_slices:
        ring = []
        for i in range(n_ang):
            th = 2.0 * math.pi * i / n_ang
            st = math.sin(th)
            ct = math.cos(th)
            ry = yf if ct >= 0 else yb
            z_m = z + (0.045 if (ct > 0.55 and z < ntz + 0.09) else 0.0)
            ring.append((st * rx, yc - ct * ry, z_m))
        cap_rings.append(ring)
    add_loft_rings(bm, cap_rings, closed_ends=True, mat_idx=0, vert_weights=vw, ring_weights=[{"head": 1.0}] * len(cap_rings))

    # 2. Hanging tattered hair locks framing face & draping down past shoulders
    lock_angles_deg = [
        # Side & face-framing locks (weight mostly head -> neck)
        (-62, 0.34), (-84, 0.40), (-108, 0.42), (-132, 0.44), (-156, 0.46), (180, 0.48),
        (156, 0.46), (132, 0.44), (108, 0.42), (84, 0.40), (62, 0.34),
    ]
    for deg, drop_len in lock_angles_deg:
        th = math.radians(deg)
        st = math.sin(th)
        ct = math.cos(th)
        z_top = ntz + 0.13
        y_top = hy - ct * (hr * 1.02)
        x_top = st * (hr * 1.06)

        w_top = {"head": 1.0}
        w_mid = {"head": 0.65, "neck": 0.35} if abs(deg) < 120 else {"head": 0.35, "neck": 0.35, "chest": 0.30}
        w_tip = {"head": 0.30, "chest": 0.70} if abs(deg) >= 110 else {"head": 0.70, "neck": 0.30}

        # Splay slightly outward around shoulders so locks drape cleanly outside the torso
        x_out = x_top * 1.28
        y_out = y_top + (0.045 if ct < 0 else -0.010)
        lock_rings = [
            ellipse_ring(x_top, y_top, z_top, 0.022, 0.016, 6),
            ellipse_ring(x_top * 1.15, (y_top + y_out) * 0.5, z_top - drop_len * 0.35, 0.026, 0.015, 6),
            ellipse_ring(x_out, y_out, z_top - drop_len * 0.72, 0.020, 0.012, 6),
            ellipse_ring(x_out * 1.04, y_out + 0.008, z_top - drop_len, 0.006, 0.005, 6),
        ]
        add_loft_rings(
            bm, lock_rings, closed_ends=True, mat_idx=0, vert_weights=vw,
            ring_weights=[w_top, w_mid, w_tip, w_tip],
        )

    bm.verts.index_update()
    idx_w = {v.index: w for v, w in vw.items()}
    obj = new_mesh_object("Witch_Hair", bm, col_meshes, [hair_mat], smooth=True)
    add_armature_modifier(obj, arm_obj)
    apply_vert_weights(obj, idx_w, ("head", "neck", "chest"))
    return obj


def build_charger_overalls_bib(col_meshes, arm_obj, spec, joints, denim_mat, buckle_mat):
    """Torn denim overalls front bib + single strap over Charger's left shoulder (+X)."""
    bm = bmesh.new()
    vw = {}
    pz = joints["pelvis_z"]
    stz = joints["spine_top_z"]
    ctz = joints["chest_top_z"]
    tr = spec["torso_r"]
    ny = joints["neck_y"]
    front_y = -tr * 0.76

    # Front denim bib sitting proud of torso chest
    bib_rings = [
        [(-tr * 0.58, front_y, pz + 0.01), (tr * 0.58, front_y, pz + 0.01),
         (tr * 0.55, front_y + 0.022, pz + 0.01), (-tr * 0.55, front_y + 0.022, pz + 0.01)],
        [(-tr * 0.50, front_y - 0.012 + ny * 0.4, stz), (tr * 0.52, front_y - 0.012 + ny * 0.4, stz),
         (tr * 0.49, front_y + 0.012 + ny * 0.4, stz), (-tr * 0.47, front_y + 0.012 + ny * 0.4, stz)],
        [(-tr * 0.34, front_y - 0.018 + ny * 0.75, ctz - 0.11), (tr * 0.46, front_y - 0.018 + ny * 0.75, ctz - 0.11),
         (tr * 0.43, front_y + 0.008 + ny * 0.75, ctz - 0.11), (-tr * 0.31, front_y + 0.008 + ny * 0.75, ctz - 0.11)],
    ]
    add_loft_rings(
        bm, bib_rings, closed_ends=True, mat_idx=0, vert_weights=vw,
        ring_weights=[{"pelvis": 0.7, "spine": 0.3}, {"spine": 0.5, "chest": 0.5}, {"chest": 1.0}],
    )

    # Single denim strap over left shoulder (+X) -> down upper back
    sx = tr * 0.44
    sw = 0.024
    strap_pts = [
        (sx, front_y - 0.014 + ny * 0.75, ctz - 0.12),
        (sx, front_y * 0.60 + ny * 0.90,  ctz - 0.02),
        (sx, ny + 0.01,                   ctz + 0.03),
        (sx, tr * 0.65 + ny * 0.85,       ctz - 0.04),
        (sx, tr * 0.78 + ny * 0.50,       stz - 0.02),
    ]
    strap_rings = []
    for px, py, pz_s in strap_pts:
        strap_rings.append([
            (px - sw, py - 0.009, pz_s),
            (px + sw, py - 0.009, pz_s),
            (px + sw, py + 0.009, pz_s),
            (px - sw, py + 0.009, pz_s),
        ])
    add_loft_rings(
        bm, strap_rings, closed_ends=True, mat_idx=0, vert_weights=vw,
        ring_weights=[{"chest": 1.0}] * (len(strap_rings) - 1) + [{"spine": 0.5, "chest": 0.5}],
    )

    # Brass buckle on front-left bib top
    bx, by, bz = sx, front_y - 0.024 + ny * 0.75, ctz - 0.11
    b_rings = [
        [(bx - 0.026, by, bz - 0.018), (bx + 0.026, by, bz - 0.018),
         (bx + 0.026, by + 0.012, bz - 0.018), (bx - 0.026, by + 0.012, bz - 0.018)],
        [(bx - 0.026, by, bz + 0.018), (bx + 0.026, by, bz + 0.018),
         (bx + 0.026, by + 0.012, bz + 0.018), (bx - 0.026, by + 0.012, bz + 0.018)],
    ]
    add_loft_rings(bm, b_rings, closed_ends=True, mat_idx=1, vert_weights=vw, ring_weights=[{"chest": 1.0}, {"chest": 1.0}])

    bm.verts.index_update()
    idx_w = {v.index: w for v, w in vw.items()}
    obj = new_mesh_object("Charger_OverallsBib", bm, col_meshes, [denim_mat, buckle_mat], smooth=False)
    add_armature_modifier(obj, arm_obj)
    apply_vert_weights(obj, idx_w, ("pelvis", "spine", "chest"))
    return obj


# ---------------------------------------------------------------------------
# Individual Species Assembly Functions
# ---------------------------------------------------------------------------
def build_hunter(col_meshes, col_rig, spec, joints):
    mats = {
        "hoodie": build_cel_material("Mat_Hunter_Hoodie", "#445a6e", "#2c3d4c"),
        "hood_in": build_cel_material("Mat_Hunter_HoodInner", "#1c2630", "#121820"),
        "skin": build_cel_material("Mat_Hunter_Skin", "#b8b5ab", "#8f8c82"),
        "tape": build_cel_material("Mat_Hunter_Tape", "#d8d0be", "#ada594"),
        "trousers": build_cel_material("Mat_Hunter_Trousers", "#3e464e", "#292f36"),
        "boots": build_cel_material("Mat_Hunter_Boots", "#222629", "#14171a"),
        "claws": build_cel_material("Mat_Hunter_Claws", "#7d7970", "#54514a"),
    }
    arm_obj = build_armature(col_rig, spec, joints)
    build_sculpted_torso(col_meshes, arm_obj, spec, joints, mats["hoodie"], waist_scale=0.90, chest_scale=1.10, hem_tatter=0.018, name="Hunter_Torso")
    build_sculpted_arms_and_hands(
        col_meshes, arm_obj, spec, joints,
        upper_mat=mats["hoodie"], forearm_mat=mats["hoodie"], hand_mat=mats["skin"],
        claw_mat=mats["claws"], sleeve_frac=0.95, hand_style="clawed", claw_len=0.055,
        tape_mat=mats["tape"], name="Hunter_Arms",
    )
    build_sculpted_legs_and_feet(
        col_meshes, arm_obj, spec, joints,
        trouser_mat=mats["trousers"], shin_mat=mats["trousers"], foot_mat=mats["boots"],
        cargo_pockets=True, name="Hunter_Legs",
    )
    build_sculpted_head_and_neck(
        col_meshes, arm_obj, spec, joints, mats["skin"],
        jaw_width=0.74, jaw_jut=0.008, brow_heavy=0.012, cheek_hollow=0.14, name_prefix="Hunter",
    )
    build_hunter_hood_cowl(col_meshes, arm_obj, spec, joints, mats["hoodie"], mats["hood_in"])
    return arm_obj


def build_smoker(col_meshes, col_rig, spec, joints):
    mats = {
        "skin": build_cel_material("Mat_Smoker_Skin", "#9da38f", "#767c6a"),
        "shirt": build_cel_material("Mat_Smoker_Shirt", "#575c48", "#3e4233"),
        "boils": build_cel_material("Mat_Smoker_Boils", "#6e7a52", "#4d5739"),
        "trousers": build_cel_material("Mat_Smoker_Trousers", "#2e312b", "#1e201c"),
        "boots": build_cel_material("Mat_Smoker_Boots", "#262420", "#171614"),
        "claws": build_cel_material("Mat_Smoker_Claws", "#6d7360", "#4b4f41"),
    }
    arm_obj = build_armature(col_rig, spec, joints)
    build_sculpted_torso(col_meshes, arm_obj, spec, joints, mats["shirt"], waist_scale=0.76, chest_scale=1.06, depth_ratio=0.68, hem_tatter=0.022, name="Smoker_Torso")
    build_sculpted_arms_and_hands(
        col_meshes, arm_obj, spec, joints,
        upper_mat=mats["shirt"], forearm_mat=mats["skin"], hand_mat=mats["skin"],
        claw_mat=mats["claws"], sleeve_frac=0.45, hand_style="clawed", claw_len=0.058, name="Smoker_Arms",
    )
    build_sculpted_legs_and_feet(
        col_meshes, arm_obj, spec, joints,
        trouser_mat=mats["trousers"], shin_mat=mats["trousers"], foot_mat=mats["boots"], name="Smoker_Legs",
    )
    build_sculpted_head_and_neck(
        col_meshes, arm_obj, spec, joints, mats["skin"],
        jaw_width=0.68, jaw_jut=0.016, brow_heavy=0.010, cheek_hollow=0.22, neck_thick=0.88, name_prefix="Smoker",
    )
    build_smoker_boils(col_meshes, arm_obj, spec, joints, mats["boils"])

    # Tongue socket bone-parented to head at mouth position
    mouth_world = Vector((0.0, joints["head_y"] - spec["head_r"] * 1.02, joints["neck_top_z"] + spec["head_len"] * 0.24))
    add_bone_socket(col_rig, arm_obj, "tongue_socket", "head", mouth_world, size=0.07)
    return arm_obj


def build_witch(col_meshes, col_rig, spec, joints):
    mats = {
        "skin": build_cel_material("Mat_Witch_Skin", "#cfc9c2", "#a39d96"),
        "hair": build_cel_material("Mat_Witch_Hair", "#a8a49c", "#7d7a73"),
        "claws": build_cel_material("Mat_Witch_Claws", "#6e2329", "#4a151a"),
        "cloth": build_cel_material("Mat_Witch_Cloth", "#3b3d42", "#26282c"),
        "eyes": build_emissive_material("Mat_Witch_Eyes", "#d92626", strength=1.8),
    }
    arm_obj = build_armature(col_rig, spec, joints)
    build_sculpted_torso(col_meshes, arm_obj, spec, joints, mats["cloth"], waist_scale=0.74, chest_scale=0.98, depth_ratio=0.66, hem_tatter=0.016, name="Witch_Torso")
    build_sculpted_arms_and_hands(
        col_meshes, arm_obj, spec, joints,
        upper_mat=mats["skin"], forearm_mat=mats["skin"], hand_mat=mats["skin"],
        claw_mat=mats["claws"], sleeve_frac=0.0, hand_style="clawed", claw_len=0.115, name="Witch_Arms",
    )
    build_sculpted_legs_and_feet(
        col_meshes, arm_obj, spec, joints,
        trouser_mat=mats["cloth"], shin_mat=mats["skin"], foot_mat=mats["skin"],
        shorts_mode=True, bare_feet=True, name="Witch_Legs",
    )
    build_sculpted_head_and_neck(
        col_meshes, arm_obj, spec, joints, mats["skin"],
        jaw_width=0.64, jaw_jut=0.004, brow_heavy=0.008, cheek_hollow=0.20,
        neck_thick=0.78, eye_glow_mat=mats["eyes"], name_prefix="Witch",
    )
    build_witch_hair_drape(col_meshes, arm_obj, spec, joints, mats["hair"])
    return arm_obj


def build_charger(col_meshes, col_rig, spec, joints):
    mats = {
        "skin": build_cel_material("Mat_Charger_Skin", "#b89b88", "#8c7262"),
        "denim": build_cel_material("Mat_Charger_Denim", "#3c4e63", "#293747"),
        "buckle": build_cel_material("Mat_Charger_Buckle", "#b5924c", "#7d6332"),
        "boots": build_cel_material("Mat_Charger_Boots", "#382c26", "#241c18"),
    }
    arm_obj = build_armature(col_rig, spec, joints)
    build_sculpted_torso(
        col_meshes, arm_obj, spec, joints, mats["skin"],
        waist_scale=0.84, chest_scale=1.22, depth_ratio=0.78, trap_bulge=0.032, name="Charger_Torso",
    )
    build_sculpted_arms_and_hands(
        col_meshes, arm_obj, spec, joints,
        upper_mat=mats["skin"], forearm_mat=mats["skin"], hand_mat=mats["skin"],
        claw_mat=mats["skin"], sleeve_frac=0.0, hand_style="charger", claw_len=0.036, name="Charger_Arms",
    )
    build_sculpted_legs_and_feet(
        col_meshes, arm_obj, spec, joints,
        trouser_mat=mats["denim"], shin_mat=mats["denim"], foot_mat=mats["boots"], name="Charger_Legs",
    )
    build_sculpted_head_and_neck(
        col_meshes, arm_obj, spec, joints, mats["skin"],
        jaw_width=0.92, jaw_jut=0.022, brow_heavy=0.018, neck_thick=1.35, name_prefix="Charger",
    )
    build_charger_overalls_bib(col_meshes, arm_obj, spec, joints, mats["denim"], mats["buckle"])
    return arm_obj


def build_tank(col_meshes, col_rig, spec, joints):
    mats = {
        "skin": build_cel_material("Mat_Tank_Skin", "#a88a82", "#7d635c"),
        "trousers": build_cel_material("Mat_Tank_Trousers", "#333840", "#202429"),
    }
    arm_obj = build_armature(col_rig, spec, joints)
    build_sculpted_torso(
        col_meshes, arm_obj, spec, joints, mats["skin"],
        waist_scale=0.72, chest_scale=1.36, depth_ratio=0.84, trap_bulge=0.065, name="Tank_Torso",
    )
    build_sculpted_arms_and_hands(
        col_meshes, arm_obj, spec, joints,
        upper_mat=mats["skin"], forearm_mat=mats["skin"], hand_mat=mats["skin"],
        claw_mat=mats["skin"], sleeve_frac=0.0, hand_style="fist", name="Tank_Arms",
    )
    build_sculpted_legs_and_feet(
        col_meshes, arm_obj, spec, joints,
        trouser_mat=mats["trousers"], shin_mat=mats["skin"], foot_mat=mats["skin"],
        torn_calf_mode=True, bare_feet=True, name="Tank_Legs",
    )
    build_sculpted_head_and_neck(
        col_meshes, arm_obj, spec, joints, mats["skin"],
        jaw_width=1.06, jaw_jut=0.028, brow_heavy=0.026, cranium_tall=0.94, neck_thick=1.65, name_prefix="Tank",
    )

    # Concrete slab socket bone-parented to hand_R at palm center
    wr_r = joints["wrist_R"]
    ht_r = joints["hand_tip_R"]
    slab_world = wr_r.lerp(ht_r, 0.55) + Vector((0.0, -0.06, 0.0))
    add_bone_socket(col_rig, arm_obj, "slab_socket", "hand_R", slab_world, size=0.10)
    return arm_obj


SPECIES_BUILDERS = {
    "hunter": build_hunter,
    "smoker": build_smoker,
    "witch": build_witch,
    "charger": build_charger,
    "tank": build_tank,
}


# ---------------------------------------------------------------------------
# Build Entrypoint & CLI
# ---------------------------------------------------------------------------
def build_species_rig(species: str) -> str:
    if species not in SPECIES_BUILDERS:
        raise ValueError(f"Unknown species '{species}'. Valid: {', '.join(ALL_SPECIES)}")

    clear_scene()
    scene, col_meshes, col_rig, col_lines = setup_scene()
    create_cel2tone_group()

    spec = SPECIES_SPECS[species]
    joints = compute_skeleton_joints(spec)
    setup_camera_and_lights(scene, height_m=joints["head_top_z"])

    SPECIES_BUILDERS[species](col_meshes, col_rig, spec, joints)
    setup_gp_lineart(col_lines, col_meshes)

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, f"{species}-rig.blend")
    bpy.ops.wm.save_as_mainfile(filepath=out_path)
    print(f"[build-infected-rigs] Saved {out_path}")
    return out_path


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(description="Build stylized 2-tone cel-shaded 3D infected rigs")
    ap.add_argument(
        "--only",
        type=str,
        default="",
        help="Comma-separated subset of species to build (e.g. hunter,tank). Default builds all 5.",
    )
    return ap.parse_args(argv)


def main():
    args = parse_args()
    if args.only.strip():
        targets = [s.strip().lower() for s in args.only.split(",") if s.strip()]
    else:
        targets = list(ALL_SPECIES)

    for sp in targets:
        build_species_rig(sp)


if __name__ == "__main__":
    main()
