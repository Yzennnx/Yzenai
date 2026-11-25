"""
Build script for the stylized 2-tone cel-shaded Series Lead 3D character rig.

Usage:
    blender --background --python tools/blender-rig/build-lead-rig.py

Outputs:
    assets/series-lead/rig-3d/lead-rig.blend
"""

import math
import os
import bpy
import bmesh
from mathutils import Vector, Matrix, Euler
from mathutils.bvhtree import BVHTree


# ---------------------------------------------------------------------------
# Paths & Constants
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
FACE_TEX_DIR = os.path.join(REPO_ROOT, "assets", "series-lead", "rig-3d", "face-textures")
BLEND_OUT = os.path.join(REPO_ROOT, "assets", "series-lead", "rig-3d", "lead-rig.blend")

EXPRESSION_FILES = {
    "head": "head.png",
    "head-notice": "head-notice.png",
    "head-alarm": "head-alarm.png",
    "head-dread": "head-dread.png",
    "head-panic": "head-panic.png",
    "head-strain": "head-strain.png",
    "head-determined": "head-determined.png",
    "head-angry": "head-angry.png",
    "head-exhausted": "head-exhausted.png",
    "head-pain": "head-pain.png",
    "head-sneak": "head-sneak.png",
    "head-relief": "head-relief.png",
}

CONDITION_IDS = {
    "clean": 0,
    "sweat": 1,
    "frost": 2,
    "scorch": 3,
    "dusty": 4,
}


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


# Exact art.js / reference-sheet.png palette
PALETTE = {
    "ink": "#253a3b",
    "hair_base": "#644638",
    "hair_shadow": "#4b3328",
    "hair_highlight": "#89624c",
    "shirt_base": "#e8e1cc",
    "shirt_shadow": "#bab49f",
    "cuff_base": "#ede5d0",
    "cuff_shadow": "#c8c1ac",
    "collar_base": "#f6efdf",
    "collar_shadow": "#d5cebc",
    "tie_base": "#813b43",
    "tie_shadow": "#5e282f",
    "trousers_base": "#465366",
    "trousers_shadow": "#374456",
    "shoe_base": "#60453d",
    "shoe_shadow": "#493937",
    "sole_base": "#ead8b5",
    "sole_shadow": "#c7b490",
    "laces_base": "#f2c98e",
    "laces_shadow": "#c79e65",
    "skin_base": "#e7ae87",
    "skin_shadow": "#d69975",
    "skin_pale_base": "#d9b39f",
    "skin_pale_shadow": "#bd9683",
    "neck_base": "#cf956f",
    "neck_shadow": "#b57c59",
    "neck_pale_base": "#c29b87",
    "neck_pale_shadow": "#a47d6a",
    "ear_base": "#dda07d",
    "ear_shadow": "#a46b51",
    "ear_pale_base": "#cc9f88",
    "ear_pale_shadow": "#976d5b",
    "glove_base": "#553622",
    "glove_shadow": "#392315",
    "glove_hi_base": "#784f34",
    "glove_hi_shadow": "#553622",
    "glove_cuff_base": "#412819",
    "glove_cuff_shadow": "#2b1a10",
    "brass_base": "#c69f59",
    "brass_shadow": "#8f6e33",
    "backpack_base": "#253330",
    "backpack_shadow": "#182220",
    "backpack_pocket_base": "#1d2926",
    "backpack_pocket_shadow": "#121a18",
    "backpack_strap_base": "#283834",
    "backpack_strap_shadow": "#1a2421",
}


# ---------------------------------------------------------------------------
# Public Runtime State Helper (Also imported/called by render-shot.py)
# ---------------------------------------------------------------------------
def apply_rig_state(arm_obj, expression=None, gloves=None, backpack=None, condition=None, hand_pose=None):
    """Apply expression, gloves, backpack, condition, and hand_pose state cleanly for render & GPv3."""
    if arm_obj is None:
        return

    state_group = bpy.data.node_groups.get("LeadStateValues")

    if expression is not None:
        if expression not in EXPRESSION_FILES:
            raise ValueError(f"Unknown expression '{expression}'. Valid: {sorted(EXPRESSION_FILES)}")
        arm_obj["expression"] = expression
        img_name = EXPRESSION_FILES[expression]
        img = bpy.data.images.get(img_name)
        if img is None:
            img_path = os.path.join(FACE_TEX_DIR, img_name)
            if os.path.exists(img_path):
                img = bpy.data.images.load(img_path, check_existing=True)
        face_mat = bpy.data.materials.get("Mat_Skin_Face")
        if face_mat and face_mat.use_nodes and img is not None:
            tex_node = face_mat.node_tree.nodes.get("FaceOverlay")
            if tex_node is not None:
                tex_node.image = img
        pale = 1.0 if expression in ("head-dread", "head-exhausted") else 0.0
        if state_group:
            pale_node = state_group.nodes.get("PaleFactor")
            if pale_node:
                pale_node.outputs[0].default_value = pale

    if gloves is not None or hand_pose is not None:
        if gloves is not None:
            g_val = 1 if bool(int(gloves) if isinstance(gloves, (int, float, str)) and str(gloves).isdigit() else gloves in (True, "on", "true", "True")) else 0
            arm_obj["gloves"] = g_val
        else:
            g_val = int(arm_obj.get("gloves", 0))
        hp = hand_pose if hand_pose is not None else str(arm_obj.get("hand_pose", "relaxed"))
        if hp not in ("relaxed", "grip", "open-flat"):
            raise ValueError(f"Unknown hand_pose '{hp}'. Valid: relaxed, grip, open-flat")
        arm_obj["hand_pose"] = hp
        pose_suffix = {"relaxed": "", "grip": "_Grip", "open-flat": "_Open"}
        for p_key, suf in pose_suffix.items():
            b_obj = bpy.data.objects.get(f"LeadHands_Bare{suf}")
            g_obj = bpy.data.objects.get(f"LeadHands_Gloves{suf}")
            if b_obj:
                hide_b = (g_val != 0) or (hp != p_key)
                b_obj.hide_viewport = hide_b
                b_obj.hide_render = hide_b
            if g_obj:
                hide_g = (g_val == 0) or (hp != p_key)
                g_obj.hide_viewport = hide_g
                g_obj.hide_render = hide_g

    if backpack is not None:
        b_val = 1 if bool(int(backpack) if isinstance(backpack, (int, float, str)) and str(backpack).isdigit() else backpack in (True, "on", "true", "True")) else 0
        arm_obj["backpack"] = b_val
        bp_obj = bpy.data.objects.get("LeadBackpack")
        if bp_obj:
            bp_obj.hide_viewport = (b_val == 0)
            bp_obj.hide_render = (b_val == 0)

    if condition is not None:
        if condition not in CONDITION_IDS:
            raise ValueError(f"Unknown condition '{condition}'. Valid: {sorted(CONDITION_IDS)}")
        arm_obj["condition"] = condition
        cid = float(CONDITION_IDS[condition])
        if state_group:
            cond_node = state_group.nodes.get("ConditionId")
            if cond_node:
                cond_node.outputs[0].default_value = cid

    arm_obj.update_tag()
    gp_obj = bpy.data.objects.get("LeadOutline")
    if gp_obj:
        gp_obj.update_tag()
    if bpy.context.view_layer:
        bpy.context.view_layer.update()


# ---------------------------------------------------------------------------
# Scene Reset & Setup
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

    world = bpy.data.worlds.new("LeadWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.04, 0.04, 0.04, 1.0)
        bg.inputs[1].default_value = 1.0

    # Collections
    col_meshes = bpy.data.collections.new("LeadMeshes")
    col_rig = bpy.data.collections.new("LeadRig")
    col_lines = bpy.data.collections.new("LeadLines")
    scene.collection.children.link(col_meshes)
    scene.collection.children.link(col_rig)
    scene.collection.children.link(col_lines)
    return scene, col_meshes, col_rig, col_lines


def setup_default_camera_and_lights(scene):
    # Default 3q-front camera (45mm, sensor_fit='AUTO', framing full 1.70m lead in 1080x1920)
    cam_data = bpy.data.cameras.new("LeadCam")
    cam_data.lens = 45.0
    cam_data.sensor_width = 36.0
    cam_data.sensor_fit = "AUTO"
    cam_data.clip_start = 0.05
    cam_data.clip_end = 100.0
    cam_obj = bpy.data.objects.new("LeadCam", cam_data)
    scene.collection.objects.link(cam_obj)

    cam_pos = Vector((1.35, -2.95, 1.02))
    aim_target = Vector((0.0, 0.0, 0.88))
    cam_obj.location = cam_pos
    direction = (aim_target - cam_pos).normalized()
    cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam_obj

    # Neutral Key Sun (casts crisp 2-tone cel shadow across chin/brow/side)
    key_data = bpy.data.lights.new("LeadKeyLight", type="SUN")
    key_data.energy = 2.4
    key_data.color = (1.0, 0.99, 0.97)
    key_data.angle = math.radians(1.5)
    key_obj = bpy.data.objects.new("LeadKeyLight", key_data)
    scene.collection.objects.link(key_obj)
    key_dir = Vector((-0.45, 0.72, -0.52)).normalized()
    key_obj.rotation_euler = key_dir.to_track_quat("-Z", "Y").to_euler()

    # Soft Fill Sun (kept well below 0.35 cel threshold so shadow side keeps ShadowColor)
    fill_data = bpy.data.lights.new("LeadFillLight", type="SUN")
    fill_data.energy = 0.20
    fill_data.color = (0.88, 0.93, 1.0)
    fill_data.use_shadow = False
    fill_obj = bpy.data.objects.new("LeadFillLight", fill_data)
    scene.collection.objects.link(fill_obj)
    fill_dir = Vector((0.65, -0.45, 0.35)).normalized()
    fill_obj.rotation_euler = fill_dir.to_track_quat("-Z", "Y").to_euler()


# ---------------------------------------------------------------------------
# Shader Node Groups & Materials
# ---------------------------------------------------------------------------
def create_state_values_group():
    ng = bpy.data.node_groups.new("LeadStateValues", "ShaderNodeTree")
    ng.interface.new_socket("PaleFactor", in_out="OUTPUT", socket_type="NodeSocketFloat")
    ng.interface.new_socket("ConditionId", in_out="OUTPUT", socket_type="NodeSocketFloat")

    out = ng.nodes.new("NodeGroupOutput")
    out.location = (300, 0)

    pale_n = ng.nodes.new("ShaderNodeValue")
    pale_n.name = "PaleFactor"
    pale_n.label = "PaleFactor"
    pale_n.outputs[0].default_value = 0.0
    pale_n.location = (0, 80)

    cond_n = ng.nodes.new("ShaderNodeValue")
    cond_n.name = "ConditionId"
    cond_n.label = "ConditionId"
    cond_n.outputs[0].default_value = 0.0
    cond_n.location = (0, -80)

    ng.links.new(pale_n.outputs[0], out.inputs[0])
    ng.links.new(cond_n.outputs[0], out.inputs[1])
    return ng


def create_cel2tone_group():
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

    # Shift luminance by (0.35 - Threshold) so Threshold input dynamically shifts the 0.35 ramp stop
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


def create_condition_overlay_group():
    """Flat 2-tone graphic condition shader (0:clean, 1:sweat, 2:frost, 3:scorch, 4:dusty)."""
    ng = bpy.data.node_groups.new("ConditionOverlay", "ShaderNodeTree")
    ng.interface.new_socket("InColor", in_out="INPUT", socket_type="NodeSocketColor")
    ng.interface.new_socket("ConditionId", in_out="INPUT", socket_type="NodeSocketFloat")
    s_skin = ng.interface.new_socket("IsSkin", in_out="INPUT", socket_type="NodeSocketFloat")
    s_skin.default_value = 0.0
    s_hair = ng.interface.new_socket("IsHair", in_out="INPUT", socket_type="NodeSocketFloat")
    s_hair.default_value = 0.0
    ng.interface.new_socket("Color", in_out="OUTPUT", socket_type="NodeSocketColor")

    inp = ng.nodes.new("NodeGroupInput")
    inp.location = (-950, 0)
    out = ng.nodes.new("NodeGroupOutput")
    out.location = (950, 0)

    tex_coord = ng.nodes.new("ShaderNodeTexCoord")
    tex_coord.location = (-950, 320)

    layer_w = ng.nodes.new("ShaderNodeLayerWeight")
    layer_w.inputs["Blend"].default_value = 0.35
    layer_w.location = (-950, 520)

    geom = ng.nodes.new("ShaderNodeNewGeometry")
    geom.location = (-950, 680)

    # Helper to detect exact ConditionId == k via abs(id - k) < 0.25
    def make_cond_mask(k: float, y_loc: int):
        sub = ng.nodes.new("ShaderNodeMath")
        sub.operation = "SUBTRACT"
        sub.inputs[1].default_value = k
        sub.location = (-680, y_loc)
        ng.links.new(inp.outputs["ConditionId"], sub.inputs[0])

        ab = ng.nodes.new("ShaderNodeMath")
        ab.operation = "ABSOLUTE"
        ab.location = (-520, y_loc)
        ng.links.new(sub.outputs["Value"], ab.inputs[0])

        lt = ng.nodes.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        lt.inputs[1].default_value = 0.25
        lt.location = (-360, y_loc)
        ng.links.new(ab.outputs["Value"], lt.inputs[0])
        return lt.outputs["Value"]

    def make_rgba_mix(blend="MIX", fac_val=0.0, loc=(0, 0)):
        m = ng.nodes.new("ShaderNodeMix")
        m.data_type = "RGBA"
        m.blend_type = blend
        m.clamp_result = True
        m.inputs[0].default_value = fac_val
        m.location = loc
        return m

    sep_obj = ng.nodes.new("ShaderNodeSeparateXYZ")
    sep_obj.location = (-840, 320)
    ng.links.new(tex_coord.outputs["Object"], sep_obj.inputs["Vector"])

    # --- 1: SWEAT ---
    # Skin: crisp cel sheen highlight (#eaf7ff); Cloth: localized upper torso/collar/underarm damp patches (#cfc6af)
    mask_sweat = make_cond_mask(1.0, 480)
    sep_norm = ng.nodes.new("ShaderNodeSeparateXYZ")
    sep_norm.location = (-740, 680)
    ng.links.new(geom.outputs["Normal"], sep_norm.inputs["Vector"])

    sheen_mul = ng.nodes.new("ShaderNodeMath")
    sheen_mul.operation = "MULTIPLY"
    sheen_mul.location = (-540, 580)
    ng.links.new(layer_w.outputs["Facing"], sheen_mul.inputs[0])
    ng.links.new(sep_norm.outputs["Z"], sheen_mul.inputs[1])

    sweat_ramp = ng.nodes.new("ShaderNodeValToRGB")
    sweat_ramp.color_ramp.interpolation = "CONSTANT"
    sweat_ramp.color_ramp.elements[0].position = 0.0
    sweat_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    sweat_ramp.color_ramp.elements[1].position = 0.10
    sweat_ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    sweat_ramp.location = (-360, 580)
    ng.links.new(sheen_mul.outputs["Value"], sweat_ramp.inputs["Fac"])

    sweat_skin_fac = ng.nodes.new("ShaderNodeMath")
    sweat_skin_fac.operation = "MULTIPLY"
    sweat_skin_fac.inputs[1].default_value = 0.54
    sweat_skin_fac.location = (-140, 580)
    ng.links.new(sweat_ramp.outputs["Color"], sweat_skin_fac.inputs[0])

    sweat_skin_mix = make_rgba_mix("MIX", loc=(60, 580))
    sweat_skin_mix.inputs[7].default_value = hex_to_lin("#eaf7ff")
    ng.links.new(sweat_skin_fac.outputs["Value"], sweat_skin_mix.inputs[0])
    ng.links.new(inp.outputs["InColor"], sweat_skin_mix.inputs[6])

    # Cloth sweat: localized to upper torso/collar/underarms (Object Z in 1.06..1.38, |X| < 0.16)
    sweat_z_lo = ng.nodes.new("ShaderNodeMapRange")
    sweat_z_lo.interpolation_type = "SMOOTHSTEP"
    sweat_z_lo.clamp = True
    sweat_z_lo.inputs["From Min"].default_value = 1.05
    sweat_z_lo.inputs["From Max"].default_value = 1.24
    sweat_z_lo.inputs["To Min"].default_value = 0.0
    sweat_z_lo.inputs["To Max"].default_value = 1.0
    sweat_z_lo.location = (-740, 340)
    ng.links.new(sep_obj.outputs["Z"], sweat_z_lo.inputs["Value"])

    sweat_abs_x = ng.nodes.new("ShaderNodeMath")
    sweat_abs_x.operation = "ABSOLUTE"
    sweat_abs_x.location = (-740, 260)
    ng.links.new(sep_obj.outputs["X"], sweat_abs_x.inputs[0])

    sweat_x_mask = ng.nodes.new("ShaderNodeMapRange")
    sweat_x_mask.interpolation_type = "SMOOTHSTEP"
    sweat_x_mask.clamp = True
    sweat_x_mask.inputs["From Min"].default_value = 0.06
    sweat_x_mask.inputs["From Max"].default_value = 0.18
    sweat_x_mask.inputs["To Min"].default_value = 1.0
    sweat_x_mask.inputs["To Max"].default_value = 0.12
    sweat_x_mask.location = (-600, 260)
    ng.links.new(sweat_abs_x.outputs["Value"], sweat_x_mask.inputs["Value"])

    sweat_zone = ng.nodes.new("ShaderNodeMath")
    sweat_zone.operation = "MULTIPLY"
    sweat_zone.location = (-500, 320)
    ng.links.new(sweat_z_lo.outputs["Result"], sweat_zone.inputs[0])
    ng.links.new(sweat_x_mask.outputs["Result"], sweat_zone.inputs[1])

    sweat_noise = ng.nodes.new("ShaderNodeTexNoise")
    sweat_noise.inputs["Scale"].default_value = 11.0
    sweat_noise.inputs["Detail"].default_value = 2.0
    sweat_noise.inputs["Roughness"].default_value = 0.55
    sweat_noise.location = (-740, 420)
    ng.links.new(tex_coord.outputs["Object"], sweat_noise.inputs["Vector"])

    sweat_cloth_prod = ng.nodes.new("ShaderNodeMath")
    sweat_cloth_prod.operation = "MULTIPLY"
    sweat_cloth_prod.location = (-460, 420)
    ng.links.new(sweat_noise.outputs["Fac"], sweat_cloth_prod.inputs[0])
    ng.links.new(sweat_zone.outputs["Value"], sweat_cloth_prod.inputs[1])

    sweat_cloth_ramp = ng.nodes.new("ShaderNodeValToRGB")
    sweat_cloth_ramp.color_ramp.interpolation = "CONSTANT"
    sweat_cloth_ramp.color_ramp.elements[0].position = 0.0
    sweat_cloth_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    sweat_cloth_ramp.color_ramp.elements[1].position = 0.42
    sweat_cloth_ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    sweat_cloth_ramp.location = (-300, 420)
    ng.links.new(sweat_cloth_prod.outputs["Value"], sweat_cloth_ramp.inputs["Fac"])

    sweat_cloth_fac = ng.nodes.new("ShaderNodeMath")
    sweat_cloth_fac.operation = "MULTIPLY"
    sweat_cloth_fac.inputs[1].default_value = 0.44
    sweat_cloth_fac.location = (-140, 420)
    ng.links.new(sweat_cloth_ramp.outputs["Color"], sweat_cloth_fac.inputs[0])

    sweat_cloth_mix = make_rgba_mix("MULTIPLY", loc=(60, 440))
    sweat_cloth_mix.inputs[7].default_value = hex_to_lin("#cfc6af")
    ng.links.new(sweat_cloth_fac.outputs["Value"], sweat_cloth_mix.inputs[0])
    ng.links.new(inp.outputs["InColor"], sweat_cloth_mix.inputs[6])

    sweat_cloth_nonhair = make_rgba_mix("MIX", loc=(150, 440))
    ng.links.new(inp.outputs["IsHair"], sweat_cloth_nonhair.inputs[0])
    ng.links.new(sweat_cloth_mix.outputs[2], sweat_cloth_nonhair.inputs[6])
    ng.links.new(inp.outputs["InColor"], sweat_cloth_nonhair.inputs[7])

    sweat_branch = make_rgba_mix("MIX", loc=(240, 500))
    ng.links.new(inp.outputs["IsSkin"], sweat_branch.inputs[0])
    ng.links.new(sweat_cloth_nonhair.outputs[2], sweat_branch.inputs[6])
    ng.links.new(sweat_skin_mix.outputs[2], sweat_branch.inputs[7])

    # --- 2: FROST ---
    # Uniform LayerWeight(Facing) rim + fine Object-space crystal flecks (no per-object Generated.Z bias),
    # dialed down on hair so chestnut hair remains readable.
    mask_frost = make_cond_mask(2.0, 200)

    frost_tint_amt = ng.nodes.new("ShaderNodeMapRange")
    frost_tint_amt.clamp = True
    frost_tint_amt.inputs["From Min"].default_value = 0.0
    frost_tint_amt.inputs["From Max"].default_value = 1.0
    frost_tint_amt.inputs["To Min"].default_value = 0.11
    frost_tint_amt.inputs["To Max"].default_value = 0.03
    frost_tint_amt.location = (-340, 260)
    ng.links.new(inp.outputs["IsHair"], frost_tint_amt.inputs["Value"])

    frost_tint = make_rgba_mix("MIX", 0.11, loc=(-180, 260))
    frost_tint.inputs[7].default_value = hex_to_lin("#c2e4f5")
    ng.links.new(frost_tint_amt.outputs["Result"], frost_tint.inputs[0])
    ng.links.new(inp.outputs["InColor"], frost_tint.inputs[6])

    frost_rim_ramp = ng.nodes.new("ShaderNodeValToRGB")
    frost_rim_ramp.color_ramp.interpolation = "CONSTANT"
    frost_rim_ramp.color_ramp.elements[0].position = 0.0
    frost_rim_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    frost_rim_ramp.color_ramp.elements[1].position = 0.67
    frost_rim_ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    frost_rim_ramp.location = (-360, 140)
    ng.links.new(layer_w.outputs["Facing"], frost_rim_ramp.inputs["Fac"])

    frost_noise = ng.nodes.new("ShaderNodeTexNoise")
    frost_noise.inputs["Scale"].default_value = 26.0
    frost_noise.inputs["Detail"].default_value = 3.0
    frost_noise.inputs["Roughness"].default_value = 0.60
    frost_noise.location = (-740, 40)
    ng.links.new(tex_coord.outputs["Object"], frost_noise.inputs["Vector"])

    frost_fleck_ramp = ng.nodes.new("ShaderNodeValToRGB")
    frost_fleck_ramp.color_ramp.interpolation = "CONSTANT"
    frost_fleck_ramp.color_ramp.elements[0].position = 0.0
    frost_fleck_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    frost_fleck_ramp.color_ramp.elements[1].position = 0.65
    frost_fleck_ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    frost_fleck_ramp.location = (-360, 20)
    ng.links.new(frost_noise.outputs["Fac"], frost_fleck_ramp.inputs["Fac"])

    # Suppress patchy flecks on skin (face/hands) so frost reads cleanly via icy rim + subtle tint
    frost_non_skin = ng.nodes.new("ShaderNodeMath")
    frost_non_skin.operation = "SUBTRACT"
    frost_non_skin.inputs[0].default_value = 1.0
    frost_non_skin.location = (-360, -80)
    ng.links.new(inp.outputs["IsSkin"], frost_non_skin.inputs[1])

    frost_fleck_masked = ng.nodes.new("ShaderNodeMath")
    frost_fleck_masked.operation = "MULTIPLY"
    frost_fleck_masked.location = (-240, 20)
    ng.links.new(frost_fleck_ramp.outputs["Color"], frost_fleck_masked.inputs[0])
    ng.links.new(frost_non_skin.outputs["Value"], frost_fleck_masked.inputs[1])

    frost_comb = ng.nodes.new("ShaderNodeMath")
    frost_comb.operation = "MAXIMUM"
    frost_comb.location = (-160, 100)
    ng.links.new(frost_rim_ramp.outputs["Color"], frost_comb.inputs[0])
    ng.links.new(frost_fleck_masked.outputs["Value"], frost_comb.inputs[1])

    frost_hair_scale = ng.nodes.new("ShaderNodeMapRange")
    frost_hair_scale.clamp = True
    frost_hair_scale.inputs["From Min"].default_value = 0.0
    frost_hair_scale.inputs["From Max"].default_value = 1.0
    frost_hair_scale.inputs["To Min"].default_value = 0.74
    frost_hair_scale.inputs["To Max"].default_value = 0.30
    frost_hair_scale.location = (-160, 0)
    ng.links.new(inp.outputs["IsHair"], frost_hair_scale.inputs["Value"])

    frost_fac = ng.nodes.new("ShaderNodeMath")
    frost_fac.operation = "MULTIPLY"
    frost_fac.location = (20, 140)
    ng.links.new(frost_comb.outputs["Value"], frost_fac.inputs[0])
    ng.links.new(frost_hair_scale.outputs["Result"], frost_fac.inputs[1])

    frost_branch = make_rgba_mix("MIX", loc=(240, 200))
    frost_branch.inputs[7].default_value = hex_to_lin("#d4f1ff")
    ng.links.new(frost_fac.outputs["Value"], frost_branch.inputs[0])
    ng.links.new(frost_tint.outputs[2], frost_branch.inputs[6])

    # --- 3: SCORCH ---
    mask_scorch = make_cond_mask(3.0, -180)
    scorch_tint = make_rgba_mix("MULTIPLY", 0.18, loc=(-180, -140))
    scorch_tint.inputs[7].default_value = hex_to_lin("#7a685f")
    ng.links.new(inp.outputs["InColor"], scorch_tint.inputs[6])

    scorch_noise = ng.nodes.new("ShaderNodeTexNoise")
    scorch_noise.inputs["Scale"].default_value = 4.5
    scorch_noise.inputs["Detail"].default_value = 1.0
    scorch_noise.location = (-740, -240)
    ng.links.new(tex_coord.outputs["Object"], scorch_noise.inputs["Vector"])

    scorch_ramp = ng.nodes.new("ShaderNodeValToRGB")
    scorch_ramp.color_ramp.interpolation = "CONSTANT"
    scorch_ramp.color_ramp.elements[0].position = 0.0
    scorch_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    scorch_ramp.color_ramp.elements[1].position = 0.56
    scorch_ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    scorch_ramp.location = (-360, -240)
    ng.links.new(scorch_noise.outputs["Fac"], scorch_ramp.inputs["Fac"])

    scorch_fac = ng.nodes.new("ShaderNodeMath")
    scorch_fac.operation = "MULTIPLY"
    scorch_fac.inputs[1].default_value = 0.62
    scorch_fac.location = (20, -240)
    ng.links.new(scorch_ramp.outputs["Color"], scorch_fac.inputs[0])

    scorch_branch = make_rgba_mix("MIX", loc=(240, -180))
    scorch_branch.inputs[7].default_value = hex_to_lin("#261f1d")
    ng.links.new(scorch_fac.outputs["Value"], scorch_branch.inputs[0])
    ng.links.new(scorch_tint.outputs[2], scorch_branch.inputs[6])

    # --- 4: DUSTY ---
    # Smooth vertical Z gradient combined with Object-space noise BEFORE the CONSTANT step ramp
    # so the dust boundary breaks up organically with zero straight horizontal cut line.
    mask_dusty = make_cond_mask(4.0, -440)

    dust_z_grad = ng.nodes.new("ShaderNodeMapRange")
    dust_z_grad.interpolation_type = "SMOOTHSTEP"
    dust_z_grad.clamp = True
    dust_z_grad.inputs["From Min"].default_value = 0.15
    dust_z_grad.inputs["From Max"].default_value = 1.38
    dust_z_grad.inputs["To Min"].default_value = 0.92
    dust_z_grad.inputs["To Max"].default_value = 0.10
    dust_z_grad.location = (-740, -640)
    ng.links.new(sep_obj.outputs["Z"], dust_z_grad.inputs["Value"])

    dust_tint_fac = ng.nodes.new("ShaderNodeMath")
    dust_tint_fac.operation = "MULTIPLY"
    dust_tint_fac.inputs[1].default_value = 0.24
    dust_tint_fac.location = (-360, -400)
    ng.links.new(dust_z_grad.outputs["Result"], dust_tint_fac.inputs[0])

    dust_tint = make_rgba_mix("MIX", 0.18, loc=(-180, -400))
    dust_tint.inputs[7].default_value = hex_to_lin("#9c927d")
    ng.links.new(dust_tint_fac.outputs["Value"], dust_tint.inputs[0])
    ng.links.new(inp.outputs["InColor"], dust_tint.inputs[6])

    dust_noise = ng.nodes.new("ShaderNodeTexNoise")
    dust_noise.inputs["Scale"].default_value = 6.5
    dust_noise.inputs["Detail"].default_value = 2.0
    dust_noise.inputs["Roughness"].default_value = 0.55
    dust_noise.location = (-740, -520)
    ng.links.new(tex_coord.outputs["Object"], dust_noise.inputs["Vector"])

    dust_noise_w = ng.nodes.new("ShaderNodeMath")
    dust_noise_w.operation = "MULTIPLY"
    dust_noise_w.inputs[1].default_value = 0.68
    dust_noise_w.location = (-560, -520)
    ng.links.new(dust_noise.outputs["Fac"], dust_noise_w.inputs[0])

    dust_grad_w = ng.nodes.new("ShaderNodeMath")
    dust_grad_w.operation = "MULTIPLY"
    dust_grad_w.inputs[1].default_value = 0.46
    dust_grad_w.location = (-560, -640)
    ng.links.new(dust_z_grad.outputs["Result"], dust_grad_w.inputs[0])

    dust_comb = ng.nodes.new("ShaderNodeMath")
    dust_comb.operation = "ADD"
    dust_comb.location = (-400, -560)
    ng.links.new(dust_noise_w.outputs["Value"], dust_comb.inputs[0])
    ng.links.new(dust_grad_w.outputs["Value"], dust_comb.inputs[1])

    dust_ramp = ng.nodes.new("ShaderNodeValToRGB")
    dust_ramp.color_ramp.interpolation = "CONSTANT"
    dust_ramp.color_ramp.elements[0].position = 0.0
    dust_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    dust_ramp.color_ramp.elements[1].position = 0.62
    dust_ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    dust_ramp.location = (-220, -560)
    ng.links.new(dust_comb.outputs["Value"], dust_ramp.inputs["Fac"])

    dust_fac = ng.nodes.new("ShaderNodeMath")
    dust_fac.operation = "MULTIPLY"
    dust_fac.inputs[1].default_value = 0.52
    dust_fac.location = (20, -520)
    ng.links.new(dust_ramp.outputs["Color"], dust_fac.inputs[0])

    dust_branch = make_rgba_mix("MIX", loc=(240, -440))
    dust_branch.inputs[7].default_value = hex_to_lin("#9e937f")
    ng.links.new(dust_fac.outputs["Value"], dust_branch.inputs[0])
    ng.links.new(dust_tint.outputs[2], dust_branch.inputs[6])

    # Cascade selection: start from InColor (clean), override if mask_sweat/frost/scorch/dusty
    c1 = make_rgba_mix("MIX", loc=(460, 260))
    ng.links.new(mask_sweat, c1.inputs[0])
    ng.links.new(inp.outputs["InColor"], c1.inputs[6])
    ng.links.new(sweat_branch.outputs[2], c1.inputs[7])

    c2 = make_rgba_mix("MIX", loc=(580, 120))
    ng.links.new(mask_frost, c2.inputs[0])
    ng.links.new(c1.outputs[2], c2.inputs[6])
    ng.links.new(frost_branch.outputs[2], c2.inputs[7])

    c3 = make_rgba_mix("MIX", loc=(700, -40))
    ng.links.new(mask_scorch, c3.inputs[0])
    ng.links.new(c2.outputs[2], c3.inputs[6])
    ng.links.new(scorch_branch.outputs[2], c3.inputs[7])

    c4 = make_rgba_mix("MIX", loc=(820, -180))
    ng.links.new(mask_dusty, c4.inputs[0])
    ng.links.new(c3.outputs[2], c4.inputs[6])
    ng.links.new(dust_branch.outputs[2], c4.inputs[7])

    ng.links.new(c4.outputs[2], out.inputs["Color"])
    return ng


def build_cel_material(name: str, base_hex: str, shadow_hex: str, is_skin: bool = False,
                       pale_base_hex: str = None, pale_shadow_hex: str = None,
                       threshold: float = 0.35):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (600, 0)

    state_node = nt.nodes.new("ShaderNodeGroup")
    state_node.node_tree = bpy.data.node_groups["LeadStateValues"]
    state_node.location = (-500, -180)

    cel = nt.nodes.new("ShaderNodeGroup")
    cel.name = "Cel2Tone"
    cel.node_tree = bpy.data.node_groups["Cel2Tone"]
    cel.inputs["Threshold"].default_value = threshold
    cel.inputs["LightTintMix"].default_value = 0.0
    cel.location = (-60, 40)

    if pale_base_hex and pale_shadow_hex:
        mix_b = nt.nodes.new("ShaderNodeMix")
        mix_b.data_type = "RGBA"
        mix_b.inputs[6].default_value = hex_to_lin(base_hex)
        mix_b.inputs[7].default_value = hex_to_lin(pale_base_hex)
        mix_b.location = (-280, 140)
        nt.links.new(state_node.outputs["PaleFactor"], mix_b.inputs[0])
        nt.links.new(mix_b.outputs[2], cel.inputs["BaseColor"])

        mix_s = nt.nodes.new("ShaderNodeMix")
        mix_s.data_type = "RGBA"
        mix_s.inputs[6].default_value = hex_to_lin(shadow_hex)
        mix_s.inputs[7].default_value = hex_to_lin(pale_shadow_hex)
        mix_s.location = (-280, -20)
        nt.links.new(state_node.outputs["PaleFactor"], mix_s.inputs[0])
        nt.links.new(mix_s.outputs[2], cel.inputs["ShadowColor"])
    else:
        cel.inputs["BaseColor"].default_value = hex_to_lin(base_hex)
        cel.inputs["ShadowColor"].default_value = hex_to_lin(shadow_hex)

    cond = nt.nodes.new("ShaderNodeGroup")
    cond.name = "ConditionOverlay"
    cond.node_tree = bpy.data.node_groups["ConditionOverlay"]
    cond.inputs["IsSkin"].default_value = 1.0 if is_skin else 0.0
    cond.location = (180, 0)
    nt.links.new(cel.outputs["Color"], cond.inputs["InColor"])
    nt.links.new(state_node.outputs["ConditionId"], cond.inputs["ConditionId"])

    nt.links.new(cond.outputs["Color"], out.inputs["Surface"])
    return mat


def build_face_material():
    mat = build_cel_material(
        "Mat_Skin_Face",
        PALETTE["skin_base"],
        PALETTE["skin_shadow"],
        is_skin=True,
        pale_base_hex=PALETTE["skin_pale_base"],
        pale_shadow_hex=PALETTE["skin_pale_shadow"],
    )
    nt = mat.node_tree
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    cond = nt.nodes.get("ConditionOverlay")

    uv_node = nt.nodes.new("ShaderNodeUVMap")
    uv_node.uv_map = "UVMap"
    uv_node.location = (-80, -260)

    tex_node = nt.nodes.new("ShaderNodeTexImage")
    tex_node.name = "FaceOverlay"
    tex_node.label = "FaceOverlay"
    tex_node.extension = "CLIP"
    tex_node.interpolation = "Linear"
    tex_node.location = (140, -260)
    nt.links.new(uv_node.outputs["UV"], tex_node.inputs["Vector"])

    default_img = bpy.data.images.load(os.path.join(FACE_TEX_DIR, "head.png"), check_existing=True)
    tex_node.image = default_img

    mix_decal = nt.nodes.new("ShaderNodeMix")
    mix_decal.name = "FaceDecalMix"
    mix_decal.data_type = "RGBA"
    mix_decal.clamp_result = True
    mix_decal.location = (410, -40)
    nt.links.new(tex_node.outputs["Alpha"], mix_decal.inputs[0])
    nt.links.new(cond.outputs["Color"], mix_decal.inputs[6])
    nt.links.new(tex_node.outputs["Color"], mix_decal.inputs[7])

    nt.links.new(mix_decal.outputs[2], out.inputs["Surface"])
    return mat


def build_hair_material():
    """Mat_Hair with UV-locked arched front/crown #89624c highlight crescent."""
    mat = bpy.data.materials.new("Mat_Hair")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (700, 0)

    state_node = nt.nodes.new("ShaderNodeGroup")
    state_node.node_tree = bpy.data.node_groups["LeadStateValues"]
    state_node.location = (-520, -200)

    uv_node = nt.nodes.new("ShaderNodeUVMap")
    uv_node.uv_map = "HairHighlightUV"
    uv_node.location = (-740, 120)

    sep_uv = nt.nodes.new("ShaderNodeSeparateXYZ")
    sep_uv.location = (-540, 120)
    nt.links.new(uv_node.outputs["UV"], sep_uv.inputs["Vector"])

    # Vertical band active where V in [0.24, 0.76]
    band_ramp = nt.nodes.new("ShaderNodeValToRGB")
    band_ramp.color_ramp.interpolation = "CONSTANT"
    e0 = band_ramp.color_ramp.elements[0]
    e0.position = 0.0
    e0.color = (0.0, 0.0, 0.0, 1.0)
    e1 = band_ramp.color_ramp.elements[1]
    e1.position = 0.24
    e1.color = (1.0, 1.0, 1.0, 1.0)
    e2 = band_ramp.color_ramp.elements.new(0.76)
    e2.color = (0.0, 0.0, 0.0, 1.0)
    band_ramp.location = (-340, 180)
    nt.links.new(sep_uv.outputs["Y"], band_ramp.inputs["Fac"])

    # Front/crown oval mask active where U >= 0.50 (excludes temples, sides, and back of head)
    mask_ramp = nt.nodes.new("ShaderNodeValToRGB")
    mask_ramp.color_ramp.interpolation = "CONSTANT"
    mask_ramp.color_ramp.elements[0].position = 0.0
    mask_ramp.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1.0)
    mask_ramp.color_ramp.elements[1].position = 0.50
    mask_ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1.0)
    mask_ramp.location = (-340, -10)
    nt.links.new(sep_uv.outputs["X"], mask_ramp.inputs["Fac"])

    hl_mul = nt.nodes.new("ShaderNodeMath")
    hl_mul.operation = "MULTIPLY"
    hl_mul.location = (-170, 90)
    nt.links.new(band_ramp.outputs["Color"], hl_mul.inputs[0])
    nt.links.new(mask_ramp.outputs["Color"], hl_mul.inputs[1])

    mix_base = nt.nodes.new("ShaderNodeMix")
    mix_base.data_type = "RGBA"
    mix_base.inputs[6].default_value = hex_to_lin(PALETTE["hair_base"])
    mix_base.inputs[7].default_value = hex_to_lin(PALETTE["hair_highlight"])
    mix_base.location = (-30, 160)
    nt.links.new(hl_mul.outputs["Value"], mix_base.inputs[0])

    mix_shad = nt.nodes.new("ShaderNodeMix")
    mix_shad.data_type = "RGBA"
    mix_shad.inputs[6].default_value = hex_to_lin(PALETTE["hair_shadow"])
    mix_shad.inputs[7].default_value = hex_to_lin(PALETTE["hair_base"])
    mix_shad.location = (-30, -20)
    nt.links.new(hl_mul.outputs["Value"], mix_shad.inputs[0])

    cel = nt.nodes.new("ShaderNodeGroup")
    cel.name = "Cel2Tone"
    cel.node_tree = bpy.data.node_groups["Cel2Tone"]
    cel.inputs["Threshold"].default_value = 0.35
    cel.inputs["LightTintMix"].default_value = 0.0
    cel.location = (160, 40)
    nt.links.new(mix_base.outputs[2], cel.inputs["BaseColor"])
    nt.links.new(mix_shad.outputs[2], cel.inputs["ShadowColor"])

    cond = nt.nodes.new("ShaderNodeGroup")
    cond.name = "ConditionOverlay"
    cond.node_tree = bpy.data.node_groups["ConditionOverlay"]
    cond.inputs["IsSkin"].default_value = 0.0
    cond.inputs["IsHair"].default_value = 1.0
    cond.location = (380, 0)
    nt.links.new(cel.outputs["Color"], cond.inputs["InColor"])
    nt.links.new(state_node.outputs["ConditionId"], cond.inputs["ConditionId"])

    nt.links.new(cond.outputs["Color"], out.inputs["Surface"])
    return mat


def create_all_materials():
    create_state_values_group()
    create_cel2tone_group()
    create_condition_overlay_group()

    mats = {
        "face": build_face_material(),
        "skin_body": build_cel_material(
            "Mat_Skin_Body", PALETTE["skin_base"], PALETTE["skin_shadow"],
            is_skin=True, pale_base_hex=PALETTE["skin_pale_base"], pale_shadow_hex=PALETTE["skin_pale_shadow"],
        ),
        "neck": build_cel_material(
            "Mat_Skin_Neck", PALETTE["neck_base"], PALETTE["neck_shadow"],
            is_skin=True, pale_base_hex=PALETTE["neck_pale_base"], pale_shadow_hex=PALETTE["neck_pale_shadow"],
        ),
        "ear": build_cel_material(
            "Mat_Skin_Ear", PALETTE["ear_base"], PALETTE["ear_shadow"],
            is_skin=True, pale_base_hex=PALETTE["ear_pale_base"], pale_shadow_hex=PALETTE["ear_pale_shadow"],
        ),
        "hair": build_hair_material(),
        "shirt": build_cel_material("Mat_Shirt", PALETTE["shirt_base"], PALETTE["shirt_shadow"]),
        "cuff": build_cel_material("Mat_Cuff", PALETTE["cuff_base"], PALETTE["cuff_shadow"]),
        "collar": build_cel_material("Mat_Collar", PALETTE["collar_base"], PALETTE["collar_shadow"]),
        "tie": build_cel_material("Mat_Tie", PALETTE["tie_base"], PALETTE["tie_shadow"]),
        "trousers": build_cel_material("Mat_Trousers", PALETTE["trousers_base"], PALETTE["trousers_shadow"]),
        "shoe": build_cel_material("Mat_Shoe", PALETTE["shoe_base"], PALETTE["shoe_shadow"]),
        "sole": build_cel_material("Mat_Shoe_Sole", PALETTE["sole_base"], PALETTE["sole_shadow"]),
        "laces": build_cel_material("Mat_Laces", PALETTE["laces_base"], PALETTE["laces_shadow"]),
        "glove_base": build_cel_material("Mat_Glove_Base", PALETTE["glove_base"], PALETTE["glove_shadow"]),
        "glove_hi": build_cel_material("Mat_Glove_Highlight", PALETTE["glove_hi_base"], PALETTE["glove_hi_shadow"]),
        "glove_cuff": build_cel_material("Mat_Glove_Cuff", PALETTE["glove_cuff_base"], PALETTE["glove_cuff_shadow"]),
        "brass": build_cel_material("Mat_Brass", PALETTE["brass_base"], PALETTE["brass_shadow"]),
        "bp_base": build_cel_material("Mat_Backpack_Base", PALETTE["backpack_base"], PALETTE["backpack_shadow"]),
        "bp_pocket": build_cel_material("Mat_Backpack_Pocket", PALETTE["backpack_pocket_base"], PALETTE["backpack_pocket_shadow"]),
        "bp_strap": build_cel_material("Mat_Backpack_Strap", PALETTE["backpack_strap_base"], PALETTE["backpack_strap_shadow"]),
    }
    return mats


# ---------------------------------------------------------------------------
# Mesh Building Helpers
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


def add_loft_rings(bm, rings, closed_ends=True, mat_idx=0):
    """Create a lofted tube from a list of rings [(x,y,z), ...] with identical vertex counts."""
    v_rings = []
    for ring in rings:
        v_rings.append([bm.verts.new(Vector(p)) for p in ring])
    n = len(v_rings[0])
    faces = []
    for r_idx in range(len(v_rings) - 1):
        r0 = v_rings[r_idx]
        r1 = v_rings[r_idx + 1]
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


def ellipse_ring(cx, cy, cz, rx, ry, n=12, tilt_x=0.0):
    pts = []
    for i in range(n):
        ang = 2.0 * math.pi * i / n
        dx = math.cos(ang) * rx
        dy = math.sin(ang) * ry
        dz = dy * math.sin(tilt_x)
        pts.append((cx + dx, cy + dy * math.cos(tilt_x), cz + dz))
    return pts


def mark_freestyle_edges(mesh, predicate):
    attr = mesh.attributes.get("freestyle_edge") or mesh.attributes.new("freestyle_edge", "BOOLEAN", "EDGE")
    for idx, e in enumerate(mesh.edges):
        v0 = mesh.vertices[e.vertices[0]].co
        v1 = mesh.vertices[e.vertices[1]].co
        if predicate(v0, v1):
            attr.data[idx].value = True


def add_armature_modifier(obj, arm_obj):
    mod = obj.modifiers.new("Armature", "ARMATURE")
    mod.object = arm_obj
    mod.use_vertex_groups = True
    mod.use_deform_preserve_volume = True
    return mod


def assign_weight_by_z(obj, bone_name: str, z_min: float, z_max: float, side_filter=None):
    vg = obj.vertex_groups.get(bone_name) or obj.vertex_groups.new(name=bone_name)
    for v in obj.data.vertices:
        if side_filter == "L" and v.co.x < 0.0:
            continue
        if side_filter == "R" and v.co.x > 0.0:
            continue
        if z_min <= v.co.z <= z_max:
            vg.add([v.index], 1.0, "REPLACE")


def assign_smooth_chain_weights(obj, segments, side_filter=None, x_blend_center=False):
    """
    Assign smooth normalized skin weights along a chain of (bone_name, z0, z1) segments.
    segments ordered from top/root toward tip, or sorted by z.
    """
    for b_name, _, _ in segments:
        if b_name not in obj.vertex_groups:
            obj.vertex_groups.new(name=b_name)

    for v in obj.data.vertices:
        if side_filter == "L" and v.co.x < -0.001:
            continue
        if side_filter == "R" and v.co.x > 0.001:
            continue
        z = v.co.z
        # Find nearest segment(s) with soft 0.03m overlap at joint boundaries
        weights = {}
        for idx, (b_name, z_hi, z_lo) in enumerate(segments):
            if z_lo <= z <= z_hi:
                weights[b_name] = weights.get(b_name, 0.0) + 1.0
        if not weights:
            # Clamp to nearest end
            best = min(segments, key=lambda s: min(abs(z - s[1]), abs(z - s[2])))
            weights[best[0]] = 1.0
        # Soft joint blending across adjacent segments within 0.035m
        blended = {}
        for idx in range(len(segments) - 1):
            b_a, hi_a, lo_a = segments[idx]
            b_b, hi_b, lo_b = segments[idx + 1]
            joint_z = lo_a
            half = 0.035
            if abs(z - joint_z) < half:
                t = (z - (joint_z - half)) / (2.0 * half)  # 0 at lower, 1 at upper
                blended[b_a] = t
                blended[b_b] = 1.0 - t
                break
        final_w = blended if blended else weights
        tot = sum(final_w.values()) or 1.0
        for b_name, w in final_w.items():
            if w > 0.001:
                obj.vertex_groups[b_name].add([v.index], w / tot, "ADD")


# ---------------------------------------------------------------------------
# Build Lead Meshes
# ---------------------------------------------------------------------------
def build_torso_and_sleeves(col_meshes, mats, arm_obj):
    """Continuous skinned shirt torso + smooth deltoid shoulders + sleeves + flared cuffs."""
    bm = bmesh.new()

    torso_specs = [
        (0.920, 0.114, 0.076, {"pelvis": 1.0}),                         # 0: tucked shirt bottom inside trousers
        (0.960, 0.118, 0.080, {"pelvis": 0.9, "spine": 0.1}),           # 1: waist seam
        (1.050, 0.122, 0.084, {"pelvis": 0.25, "spine": 0.75}),         # 2: mid-abdomen
        (1.140, 0.128, 0.088, {"spine": 0.5, "chest": 0.5}),            # 3: ribcage base
        (1.240, 0.128, 0.088, {"chest": 1.0}),                          # 4: armpit lower
        (1.298, 0.124, 0.084, {"chest": 1.0}),                          # 5: mid-armhole
        (1.340, 0.098, 0.066, {"chest": 1.0}),                          # 6: naturally sloped upper shoulder
        (1.380, 0.048, 0.046, {"chest": 1.0}),                          # 7: collar base
    ]
    n_tor = 16
    tor_rings = []
    vert_weights = {}  # bm.vert -> dict(bone -> weight)

    for z, rx, ry, w_map in torso_specs:
        ring = []
        for i in range(n_tor):
            ang = 2.0 * math.pi * i / n_tor
            v = bm.verts.new(Vector((math.cos(ang) * rx, math.sin(ang) * ry, z)))
            ring.append(v)
            w_copy = dict(w_map)
            # Blend outer shoulder vertices slightly toward shoulder_L/R
            if z >= 1.30 and abs(math.cos(ang)) > 0.75:
                s_bone = "shoulder_L" if math.cos(ang) > 0 else "shoulder_R"
                w_copy = {"chest": 0.6, s_bone: 0.4}
            vert_weights[v] = w_copy
        tor_rings.append(ring)

    armhole_L = {(4, 15), (4, 0), (5, 15), (5, 0)}
    armhole_R = {(4, 7), (4, 8), (5, 7), (5, 8)}

    for r in range(len(tor_rings) - 1):
        r0 = tor_rings[r]
        r1 = tor_rings[r + 1]
        for i in range(n_tor):
            if (r, i) in armhole_L or (r, i) in armhole_R:
                continue
            ni = (i + 1) % n_tor
            f = bm.faces.new((r0[i], r0[ni], r1[ni], r1[i]))
            f.material_index = 0

    bm.faces.new(list(reversed(tor_rings[0]))).material_index = 0
    bm.faces.new(tor_rings[-1]).material_index = 0

    loop_L = [
        tor_rings[4][15], tor_rings[4][0], tor_rings[4][1],
        tor_rings[5][1], tor_rings[6][1], tor_rings[6][0],
        tor_rings[6][15], tor_rings[5][15],
    ]
    loop_R = [
        tor_rings[4][7], tor_rings[4][8], tor_rings[4][9],
        tor_rings[5][9], tor_rings[6][9], tor_rings[6][8],
        tor_rings[6][7], tor_rings[5][7],
    ]

    def build_arm_chain(base_loop, sign, side):
        base_dirs = [math.radians(a) for a in (-135, 180, 135, 90, 45, 0, -45, -90)]

        # Crisp anatomical shoulder cap -> rigid upper arm -> tight elbow hinge -> rigid forearm -> cuff
        arm_stations = [
            (sign * 0.148, 0.000, 1.300, 0.041, 0.047, 46.0, 0, {"chest": 0.25, f"shoulder_{side}": 0.55, f"upper_arm_{side}": 0.20}),
            (sign * 0.175, 0.002, 1.274, 0.042, 0.046, 22.0, 0, {f"shoulder_{side}": 0.18, f"upper_arm_{side}": 0.82}),
            (sign * 0.188, 0.004, 1.235, 0.044, 0.045,  5.0, 0, {f"upper_arm_{side}": 1.0}),
            (sign * 0.190, 0.008, 1.120, 0.044, 0.045,  0.0, 0, {f"upper_arm_{side}": 1.0}),
            (sign * 0.190, 0.014, 1.008, 0.043, 0.044,  0.0, 0, {f"upper_arm_{side}": 0.96, f"forearm_{side}": 0.04}),
            (sign * 0.190, 0.015, 0.980, 0.043, 0.044,  0.0, 0, {f"upper_arm_{side}": 0.50, f"forearm_{side}": 0.50}),
            (sign * 0.190, 0.014, 0.952, 0.042, 0.043,  0.0, 0, {f"upper_arm_{side}": 0.04, f"forearm_{side}": 0.96}),
            (sign * 0.190, 0.007, 0.840, 0.039, 0.040,  0.0, 0, {f"forearm_{side}": 1.0}),
            (sign * 0.190, 0.002, 0.725, 0.036, 0.037,  0.0, 0, {f"forearm_{side}": 1.0}),
            (sign * 0.190, 0.002, 0.725, 0.039, 0.040,  0.0, 1, {f"forearm_{side}": 1.0}),
            (sign * 0.190, 0.000, 0.678, 0.0355, 0.0365, 0.0, 1, {f"forearm_{side}": 1.0}),
            (sign * 0.190, 0.000, 0.678, 0.025, 0.026,  0.0, 1, {f"forearm_{side}": 1.0}),
        ]

        prev_loop = base_loop
        prev_mat = 0
        for cx, cy, cz, rx, ry, tilt_deg, mat_idx, w_map in arm_stations:
            tilt = math.radians(tilt_deg)
            ring = []
            for ang in base_dirs:
                lx = sign * math.cos(ang) * rx
                ly = sign * math.sin(ang) * ry
                dx = lx * math.cos(tilt)
                dz = lx * math.sin(tilt) * sign
                v = bm.verts.new(Vector((cx + dx, cy + ly, cz + dz)))
                vert_weights[v] = dict(w_map)
                ring.append(v)
            for i in range(8):
                ni = (i + 1) % 8
                f = bm.faces.new((prev_loop[i], prev_loop[ni], ring[ni], ring[i]))
                f.material_index = mat_idx
            prev_loop = ring
            prev_mat = mat_idx
        bm.faces.new(prev_loop).material_index = prev_mat

    build_arm_chain(loop_L, +1.0, "L")
    build_arm_chain(loop_R, -1.0, "R")

    bm.verts.index_update()
    vert_idx_weights = {v.index: w for v, w in vert_weights.items()}

    obj = new_mesh_object("LeadTorso", bm, col_meshes, [mats["shirt"], mats["cuff"]], smooth=True)
    add_armature_modifier(obj, arm_obj)

    mesh = obj.data
    def _torso_edge_pred(v0, v1):
        if v0.y > 0.055 and v1.y > 0.055 and abs(v0.z - 1.298) < 0.015 and abs(v1.z - 1.298) < 0.015:
            return True
        return False
    mark_freestyle_edges(mesh, _torso_edge_pred)

    for b_name in ("pelvis", "spine", "chest", "shoulder_L", "upper_arm_L", "forearm_L", "shoulder_R", "upper_arm_R", "forearm_R"):
        obj.vertex_groups.new(name=b_name)

    for v_idx, w_map in vert_idx_weights.items():
        tot = sum(w_map.values()) or 1.0
        for b_name, w in w_map.items():
            obj.vertex_groups[b_name].add([v_idx], w / tot, "REPLACE")

    return obj


def build_collar_and_tie(col_meshes, mats, arm_obj):
    """Separate folded crisp collar (#f6efdf) and burgundy tie (#813b43) seated cleanly outside shirt."""
    bm = bmesh.new()

    # Folded collar sitting cleanly ON TOP OF shirt neck opening (z=1.375..1.416)
    collar_pts_inner = [
        (0.000, -0.056, 1.374),  # front tie knot center
        (0.024, -0.048, 1.394),
        (0.044, -0.020, 1.408),
        (0.046,  0.014, 1.412),
        (0.032,  0.042, 1.414),
        (0.000,  0.046, 1.415),  # back center hugging LeadNeck
        (-0.032, 0.042, 1.414),
        (-0.046, 0.014, 1.412),
        (-0.044,-0.020, 1.408),
        (-0.024,-0.048, 1.394),
    ]
    collar_pts_outer = [
        (0.000, -0.072, 1.366),
        (0.042, -0.088, 1.338),  # left pointed collar flap (proud of shirt front)
        (0.068, -0.032, 1.378),
        (0.066,  0.020, 1.384),
        (0.046,  0.058, 1.388),
        (0.000,  0.064, 1.390),
        (-0.046, 0.058, 1.388),
        (-0.066, 0.020, 1.384),
        (-0.068,-0.032, 1.378),
        (-0.042,-0.088, 1.338),  # right pointed collar flap
    ]
    n_c = len(collar_pts_inner)
    v_in = [bm.verts.new(Vector(p)) for p in collar_pts_inner]
    v_out = [bm.verts.new(Vector(p)) for p in collar_pts_outer]
    v_in2 = [bm.verts.new(Vector((p[0]*0.90, p[1]*0.90, p[2]-0.010))) for p in collar_pts_inner]
    v_out2 = [bm.verts.new(Vector((p[0]*0.97, p[1]*0.97, p[2]-0.008))) for p in collar_pts_outer]
    for i in range(n_c):
        ni = (i + 1) % n_c
        bm.faces.new((v_in[i], v_in[ni], v_out[ni], v_out[i])).material_index = 0
        bm.faces.new((v_out[i], v_out[ni], v_out2[ni], v_out2[i])).material_index = 0
        bm.faces.new((v_in2[i], v_in2[ni], v_in[ni], v_in[i])).material_index = 0
        bm.faces.new((v_out2[i], v_out2[ni], v_in2[ni], v_in2[i])).material_index = 0

    # Burgundy tie knot + straight tapered blade proud of shirt chest front (y=-0.098..-0.104)
    knot_rings = [
        [(-0.017, -0.086, 1.378), (0.017, -0.086, 1.378), (0.015, -0.070, 1.378), (-0.015, -0.070, 1.378)],
        [(-0.011, -0.094, 1.352), (0.011, -0.094, 1.352), (0.010, -0.080, 1.352), (-0.010, -0.080, 1.352)],
    ]
    add_loft_rings(bm, knot_rings, closed_ends=True, mat_idx=1)

    tie_rings = [
        [(-0.012, -0.095, 1.356), (0.012, -0.095, 1.356), (0.011, -0.085, 1.356), (-0.011, -0.085, 1.356)],
        [(-0.016, -0.100, 1.290), (0.016, -0.100, 1.290), (0.015, -0.091, 1.290), (-0.015, -0.091, 1.290)],
        [(-0.019, -0.101, 1.230), (0.019, -0.101, 1.230), (0.018, -0.092, 1.230), (-0.018, -0.092, 1.230)],
        [(-0.023, -0.098, 1.125), (0.023, -0.098, 1.125), (0.022, -0.089, 1.125), (-0.022, -0.089, 1.125)],
        [(-0.002, -0.094, 1.072), (0.002, -0.094, 1.072), (0.002, -0.086, 1.072), (-0.002, -0.086, 1.072)],
    ]
    add_loft_rings(bm, tie_rings, closed_ends=True, mat_idx=1)

    obj = new_mesh_object("LeadCollarTie", bm, col_meshes, [mats["collar"], mats["tie"]], smooth=False)
    add_armature_modifier(obj, arm_obj)
    assign_smooth_chain_weights(obj, [("chest", 1.45, 1.14), ("spine", 1.14, 1.05)])
    return obj


def build_trousers(col_meshes, mats, arm_obj):
    """Continuous Y-branching pelvis-to-legs straight dress trousers (#465366)."""
    bm = bmesh.new()

    # 16-vert pelvis rings transitioning cleanly via Y-split crotch into two 10-vert straight legs
    # Indices: 0=+X, 4=+Y(back), 8=-X, 12=-Y(front)
    r_waist = [bm.verts.new(Vector(p)) for p in ellipse_ring(0.0, 0.0, 0.968, 0.124, 0.084, 16)]
    r_hip = [bm.verts.new(Vector(p)) for p in ellipse_ring(0.0, 0.0, 0.915, 0.132, 0.088, 16)]
    # Pinched crotch-level outer ring (z=0.865)
    crotch_pts = ellipse_ring(0.0, 0.0, 0.868, 0.130, 0.082, 16)
    # Pull front/back center (i=4, 12) slightly inward for natural trouser crease
    crotch_pts[4] = (0.0, 0.056, 0.858)
    crotch_pts[12] = (0.0, -0.056, 0.858)
    r_crotch = [bm.verts.new(Vector(p)) for p in crotch_pts]

    for r0, r1 in ((r_waist, r_hip), (r_hip, r_crotch)):
        for i in range(16):
            ni = (i + 1) % 16
            bm.faces.new((r0[i], r0[ni], r1[ni], r1[i])).material_index = 0
    bm.faces.new(r_waist).material_index = 0

    # Crotch saddle center vertex bridging front(12) and back(4)
    c_mid = bm.verts.new(Vector((0.0, 0.0, 0.850)))

    # 10-vert loop for Left (+X) leg: 12,13,14,15,0,1,2,3,4, c_mid
    loop_L = [r_crotch[12], r_crotch[13], r_crotch[14], r_crotch[15], r_crotch[0],
              r_crotch[1], r_crotch[2], r_crotch[3], r_crotch[4], c_mid]
    # 10-vert loop for Right (-X) leg: 4,5,6,7,8,9,10,11,12, c_mid
    loop_R = [r_crotch[4], r_crotch[5], r_crotch[6], r_crotch[7], r_crotch[8],
              r_crotch[9], r_crotch[10], r_crotch[11], r_crotch[12], c_mid]

    vert_weights = {}
    for v in r_waist + r_hip:
        vert_weights[v] = {"pelvis": 1.0}
    for i, v in enumerate(r_crotch):
        if i in (4, 12):
            vert_weights[v] = {"pelvis": 1.0}
        elif i in (13, 14, 15, 0, 1, 2, 3):
            vert_weights[v] = {"pelvis": 0.65, "thigh_L": 0.35}
        else:
            vert_weights[v] = {"pelvis": 0.65, "thigh_R": 0.35}
    vert_weights[c_mid] = {"pelvis": 1.0}

    def build_leg_chain(base_loop, sign, side):
        # Match angular order of base_loop around leg center:
        # for +X: 12(-90° front) -> -45 -> 0(+X) -> +45 -> +90(back) -> +180(c_mid inner)
        # Specifically 10 angles starting at -90° (-Y) going CCW to +90° (+Y) then inner 180° (-X):
        if sign > 0:
            angs = [-90, -68, -45, -22, 0, 22, 45, 68, 90, 180]
        else:
            angs = [90, 112, 135, 158, 180, -158, -135, -112, -90, 0]

        stations = [
            (sign * 0.084,  0.000, 0.805, 0.066, 0.070, {"pelvis": 0.20, f"thigh_{side}": 0.80}),
            (sign * 0.095, -0.005, 0.690, 0.061, 0.064, {f"thigh_{side}": 1.0}),
            (sign * 0.100, -0.012, 0.545, 0.056, 0.058, {f"thigh_{side}": 0.85, f"shin_{side}": 0.15}),
            (sign * 0.100, -0.015, 0.500, 0.054, 0.056, {f"thigh_{side}": 0.50, f"shin_{side}": 0.50}),
            (sign * 0.100, -0.012, 0.455, 0.053, 0.055, {f"thigh_{side}": 0.15, f"shin_{side}": 0.85}),
            (sign * 0.100, -0.007, 0.280, 0.050, 0.052, {f"shin_{side}": 1.0}),
            (sign * 0.100, -0.002, 0.155, 0.047, 0.048, {f"shin_{side}": 1.0}),
            (sign * 0.100, -0.001, 0.112, 0.046, 0.046, {f"shin_{side}": 1.0}),
            (sign * 0.100,  0.000, 0.078, 0.045, 0.045, {f"shin_{side}": 1.0}),
            # Inward folded cuff lining so shoe ankle collar nests inside with zero intersection
            (sign * 0.100,  0.000, 0.078, 0.037, 0.037, {f"shin_{side}": 1.0}),
            (sign * 0.100,  0.000, 0.104, 0.034, 0.034, {f"shin_{side}": 1.0}),
        ]
        prev = base_loop
        for cx, cy, cz, rx, ry, w_map in stations:
            ring = []
            for a_deg in angs:
                a = math.radians(a_deg)
                v = bm.verts.new(Vector((cx + math.cos(a) * rx, cy + math.sin(a) * ry, cz)))
                vert_weights[v] = dict(w_map)
                ring.append(v)
            for i in range(10):
                ni = (i + 1) % 10
                bm.faces.new((prev[i], prev[ni], ring[ni], ring[i])).material_index = 0
            prev = ring
        bm.faces.new(list(reversed(prev))).material_index = 0

    build_leg_chain(loop_L, +1.0, "L")
    build_leg_chain(loop_R, -1.0, "R")

    bm.verts.index_update()
    vert_idx_weights = {v.index: w for v, w in vert_weights.items()}

    obj = new_mesh_object("LeadTrousers", bm, col_meshes, [mats["trousers"]], smooth=True)
    add_armature_modifier(obj, arm_obj)

    for b in ("pelvis", "thigh_L", "shin_L", "thigh_R", "shin_R"):
        obj.vertex_groups.new(name=b)
    for v_idx, w_map in vert_idx_weights.items():
        tot = sum(w_map.values()) or 1.0
        for b_name, w in w_map.items():
            obj.vertex_groups[b_name].add([v_idx], w / tot, "REPLACE")

    return obj


def build_shoes(col_meshes, mats, arm_obj):
    """Lace-up brown shoes (#60453d) with cream soles (#ead8b5) at z=0.0 and tan laces (#f2c98e)."""
    bm = bmesh.new()

    for side in (1.0, -1.0):
        cx = side * 0.100

        # Flat cream sole (z = 0.000 to 0.018), mat_idx=1
        # 14-point asymmetric rounded shoe planform facing -Y (midfoot & arch stations prevent diagonal chord cuts)
        def foot_profile_ring(z, scale_w=1.0, y_heel=0.062, y_toe=-0.220, x_bias=0.0):
            pts = [
                (cx + x_bias,               y_toe,               z),  # 0: toe tip
                (cx + side*0.026*scale_w,   y_toe + 0.018,       z),  # 1: outer toe
                (cx + side*0.044*scale_w,  -0.145,               z),  # 2: outer ball
                (cx + side*0.039*scale_w,  -0.098,               z),  # 3: outer midfoot
                (cx + side*0.038*scale_w,  -0.048,               z),  # 4: outer arch
                (cx + side*0.039*scale_w,   0.012,               z),  # 5: outer heel
                (cx + side*0.024*scale_w,   y_heel - 0.006,      z),  # 6: heel back outer
                (cx,                        y_heel,              z),  # 7: heel back center
                (cx - side*0.024*scale_w,   y_heel - 0.006,      z),  # 8: heel back inner
                (cx - side*0.037*scale_w,   0.012,               z),  # 9: inner heel
                (cx - side*0.033*scale_w,  -0.048,               z),  # 10: inner arch
                (cx - side*0.036*scale_w,  -0.098,               z),  # 11: inner midfoot
                (cx - side*0.042*scale_w,  -0.145,               z),  # 12: inner ball
                (cx - side*0.024*scale_w,   y_toe + 0.018,       z),  # 13: inner toe
            ]
            return pts

        sole_rings = [
            foot_profile_ring(0.000, 0.96, 0.060, -0.218),
            foot_profile_ring(0.018, 1.00, 0.062, -0.220),
        ]
        add_loft_rings(bm, sole_rings, closed_ends=True, mat_idx=1)

        # Brown leather shoe upper (mat_idx=0): sloped vamp + slim collar nesting inside z=0.078 trouser cuff
        upper_base = foot_profile_ring(0.018, 0.97, 0.060, -0.218)
        upper_vamp = [
            (cx,                    -0.206, 0.038),
            (cx + side*0.023,       -0.190, 0.042),
            (cx + side*0.038,       -0.142, 0.046),
            (cx + side*0.034,       -0.098, 0.048),
            (cx + side*0.031,       -0.048, 0.048),
            (cx + side*0.032,        0.010, 0.048),
            (cx + side*0.020,        0.038, 0.048),
            (cx,                     0.042, 0.048),
            (cx - side*0.020,        0.038, 0.048),
            (cx - side*0.030,        0.010, 0.048),
            (cx - side*0.027,       -0.048, 0.048),
            (cx - side*0.031,       -0.098, 0.048),
            (cx - side*0.036,       -0.142, 0.046),
            (cx - side*0.021,       -0.190, 0.042),
        ]
        upper_mid = [
            (cx,                    -0.064, 0.056),
            (cx + side*0.016,       -0.060, 0.056),
            (cx + side*0.025,       -0.046, 0.056),
            (cx + side*0.028,       -0.030, 0.056),
            (cx + side*0.028,       -0.012, 0.056),
            (cx + side*0.027,        0.010, 0.056),
            (cx + side*0.018,        0.028, 0.056),
            (cx,                     0.032, 0.056),
            (cx - side*0.018,        0.028, 0.056),
            (cx - side*0.025,        0.010, 0.056),
            (cx - side*0.025,       -0.012, 0.056),
            (cx - side*0.025,       -0.030, 0.056),
            (cx - side*0.022,       -0.046, 0.056),
            (cx - side*0.014,       -0.056, 0.056),
        ]
        upper_instep = [
            (cx,                    -0.038, 0.066),
            (cx + side*0.012,       -0.034, 0.066),
            (cx + side*0.020,       -0.024, 0.066),
            (cx + side*0.023,       -0.012, 0.066),
            (cx + side*0.024,        0.000, 0.066),
            (cx + side*0.022,        0.012, 0.066),
            (cx + side*0.014,        0.022, 0.066),
            (cx,                     0.025, 0.066),
            (cx - side*0.014,        0.021, 0.066),
            (cx - side*0.021,        0.010, 0.066),
            (cx - side*0.021,        0.000, 0.066),
            (cx - side*0.020,       -0.012, 0.066),
            (cx - side*0.016,       -0.022, 0.066),
            (cx - side*0.009,       -0.030, 0.066),
        ]
        upper_top = [
            (cx,                    -0.024, 0.098),
            (cx + side*0.010,       -0.021, 0.098),
            (cx + side*0.016,       -0.015, 0.098),
            (cx + side*0.019,       -0.007, 0.098),
            (cx + side*0.020,        0.002, 0.098),
            (cx + side*0.018,        0.010, 0.098),
            (cx + side*0.011,        0.018, 0.098),
            (cx,                     0.020, 0.098),
            (cx - side*0.010,        0.017, 0.098),
            (cx - side*0.016,        0.009, 0.098),
            (cx - side*0.017,        0.000, 0.098),
            (cx - side*0.016,       -0.008, 0.098),
            (cx - side*0.012,       -0.015, 0.098),
            (cx - side*0.008,       -0.020, 0.098),
        ]
        upper_tongue = [
            (0.5 * (a[0] + b[0]), 0.5 * (a[1] + b[1]), 0.5 * (a[2] + b[2]))
            for a, b in zip(upper_vamp, upper_mid)
        ]
        add_loft_rings(bm, [upper_base, upper_vamp, upper_tongue, upper_mid, upper_instep, upper_top], closed_ends=True, mat_idx=0)

        # Tan laces across sloped vamp cleanly in front of trouser hem (mat_idx=2)
        for ly, lz in ((-0.088, 0.052), (-0.108, 0.049), (-0.128, 0.046)):
            lace_rings = [
                [(cx - 0.017, ly - 0.0025, lz), (cx - 0.017, ly + 0.0025, lz),
                 (cx - 0.017, ly + 0.0025, lz + 0.004), (cx - 0.017, ly - 0.0025, lz + 0.004)],
                [(cx + 0.017, ly - 0.0025, lz), (cx + 0.017, ly + 0.0025, lz),
                 (cx + 0.017, ly + 0.0025, lz + 0.004), (cx + 0.017, ly - 0.0025, lz + 0.004)],
            ]
            add_loft_rings(bm, lace_rings, closed_ends=True, mat_idx=2)

    obj = new_mesh_object("LeadShoes", bm, col_meshes, [mats["shoe"], mats["sole"], mats["laces"]], smooth=True)
    # Keep sole bottom flat-shaded for crisp Line Art sole seam
    for p in obj.data.polygons:
        if p.material_index == 1:
            p.use_smooth = False
    add_armature_modifier(obj, arm_obj)

    for b in ("shin_L", "foot_L", "toe_L", "shin_R", "foot_R", "toe_R"):
        obj.vertex_groups.new(name=b)

    for v in obj.data.vertices:
        side = "L" if v.co.x >= 0.0 else "R"
        y, z = v.co.y, v.co.z
        if y < -0.145:
            t = min(1.0, (-0.145 - y) / 0.025)
            obj.vertex_groups[f"toe_{side}"].add([v.index], t, "REPLACE")
            obj.vertex_groups[f"foot_{side}"].add([v.index], 1.0 - t, "REPLACE")
        else:
            tz = max(0.0, min(1.0, (z - 0.036) / (0.060 - 0.036)))
            tz = tz * tz * (3.0 - 2.0 * tz)
            if y >= -0.068:
                my = 1.0
            elif y <= -0.128:
                my = 0.0
            else:
                ty = (y - (-0.128)) / (-0.068 - (-0.128))
                my = ty * ty * (3.0 - 2.0 * ty)
            w_shin = tz * my
            if w_shin > 0.001:
                obj.vertex_groups[f"shin_{side}"].add([v.index], w_shin, "REPLACE")
            if 1.0 - w_shin > 0.001:
                obj.vertex_groups[f"foot_{side}"].add([v.index], 1.0 - w_shin, "REPLACE")

    return obj


def build_head_neck_ears(col_meshes, mats, arm_obj):
    """
    Sculpted stylized head (brow ridge, wedge nose, tapered chin + diagonal mandible jawline,
    tucked ears, neck) with isolated planar -Y UV face decal patch.
    """
    # 1. Neck (tucked inside collar at z=1.35 and up behind chin/jaw at z=1.505)
    bm_neck = bmesh.new()
    neck_rings = [
        ellipse_ring(0.0, 0.005, 1.355, 0.050, 0.048, 16),
        ellipse_ring(0.0, 0.006, 1.395, 0.045, 0.045, 16),
        ellipse_ring(0.0, 0.009, 1.445, 0.043, 0.044, 16),
        ellipse_ring(0.0, 0.012, 1.485, 0.042, 0.043, 16),
        ellipse_ring(0.0, 0.014, 1.515, 0.040, 0.041, 16),
    ]
    add_loft_rings(bm_neck, neck_rings, closed_ends=True, mat_idx=0)
    neck_obj = new_mesh_object("LeadNeck", bm_neck, col_meshes, [mats["neck"]], smooth=True)
    add_armature_modifier(neck_obj, arm_obj)
    assign_smooth_chain_weights(neck_obj, [("head", 1.54, 1.48), ("neck", 1.48, 1.39), ("chest", 1.39, 1.35)])

    # 2. Sculpted Stylized Head (z_chin = 1.472 .. z_crown = 1.696, n_ang = 36 for silky cel shading)
    bm = bmesh.new()
    z_chin = 1.472
    n_ang = 36
    # (z, x_rad, y_front_rad, y_back_rad, y_center, chin_sharp, brow_push, nose_push)
    head_slices = [
        (1.472, 0.018, 0.022, 0.012, -0.070, 0.0,   0.0,   0.0),    # 0: chin tip base
        (1.484, 0.048, 0.058, 0.032, -0.040, 0.004, 0.0,   0.0),    # 1: chin / lower lip
        (1.502, 0.070, 0.080, 0.058, -0.016, 0.003, 0.0,   0.0),    # 2: jaw / mouth level (gonial angle!)
        (1.522, 0.080, 0.088, 0.080, -0.006, 0.001, 0.0,   0.002),  # 3: philtrum / upper lip / under-nose
        (1.534, 0.083, 0.091, 0.090, -0.002, 0.0,   0.0,   0.022),  # 4: nose tip!
        (1.552, 0.085, 0.091, 0.094,  0.000, 0.0,   0.0,   0.012),  # 5: nose bridge / cheeks
        (1.568, 0.084, 0.091, 0.096,  0.000, 0.0,   0.0,   0.002),  # 6: eye level
        (1.586, 0.083, 0.092, 0.097,  0.000, 0.0,   0.004, 0.0),    # 7: brow ridge overhang
        (1.608, 0.082, 0.091, 0.097,  0.000, 0.0,   0.002, 0.0),    # 8: lower forehead
        (1.635, 0.080, 0.087, 0.095,  0.002, 0.0,   0.0,   0.0),    # 9: upper forehead
        (1.662, 0.072, 0.077, 0.086,  0.004, 0.0,   0.0,   0.0),    # 10: cranium taper
        (1.684, 0.052, 0.056, 0.066,  0.004, 0.0,   0.0,   0.0),    # 11: crown dome
        (1.696, 0.026, 0.028, 0.034,  0.004, 0.0,   0.0,   0.0),    # 12: top cap ring
    ]

    rings = []
    nose_tip_v = None
    nose_bridge_v = None
    nose_side_v = None

    for s_idx, (z, rx, yf, yb, yc, chin_s, brow_p, nose_p) in enumerate(head_slices):
        ring = []
        for i in range(n_ang):
            theta = 2.0 * math.pi * i / n_ang
            sin_t = math.sin(theta)
            cos_t = math.cos(theta)
            x = sin_t * rx
            ry = yf if cos_t >= 0 else yb
            y = yc - cos_t * ry

            if 2 <= s_idx <= 8 and cos_t > 0.70:
                flatten = (cos_t - 0.70) * 0.015
                y += flatten

            if brow_p > 0.0 and cos_t > 0.5:
                y -= brow_p * ((cos_t - 0.5) / 0.5)

            if nose_p > 0.0:
                if i == 0:
                    y -= nose_p
                elif i in (1, n_ang - 1):
                    y -= nose_p * 0.22

            if chin_s > 0.0 and i == 0:
                y -= chin_s

            v = bm.verts.new(Vector((x, y, z)))
            if s_idx == 5 and i == 0:
                nose_bridge_v = v
            elif s_idx == 4 and i == 0:
                nose_tip_v = v
            elif s_idx == 3 and i == 1:
                nose_side_v = v
            ring.append(v)
        rings.append(ring)

    for r_idx in range(len(rings) - 1):
        r0 = rings[r_idx]
        r1 = rings[r_idx + 1]
        for i in range(n_ang):
            ni = (i + 1) % n_ang
            f = bm.faces.new((r0[i], r0[ni], r1[ni], r1[i]))
            f.material_index = 0

    bm.faces.new(list(reversed(rings[0]))).material_index = 0
    bm.faces.new(rings[-1]).material_index = 0

    # Tucked stylized ears (Mat_Skin_Ear, mat_idx=1)
    for side in (1.0, -1.0):
        ear_base = ellipse_ring(side * 0.079, 0.008, 1.552, 0.008, 0.012, 10)
        ear_r0 = [bm.verts.new(Vector((side * 0.078, 0.008 + (p[0] - side*0.079)*0.6, 1.552 + (p[1] - 0.008)*1.75))) for p in ear_base]
        ear_r1 = [bm.verts.new(Vector((side * 0.091, 0.013 + (p[0] - side*0.079)*0.55, 1.552 + (p[1] - 0.008)*1.65))) for p in ear_base]
        ear_r2 = [bm.verts.new(Vector((side * 0.087, 0.014 + (p[0] - side*0.079)*0.30, 1.552 + (p[1] - 0.008)*0.95))) for p in ear_base]
        for i in range(10):
            ni = (i + 1) % 10
            bm.faces.new((ear_r0[i], ear_r0[ni], ear_r1[ni], ear_r1[i])).material_index = 1
            bm.faces.new((ear_r1[i], ear_r1[ni], ear_r2[ni], ear_r2[i])).material_index = 1
        bm.faces.new(ear_r2).material_index = 1

    uv_layer = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        centroid = f.calc_center_median()
        is_front_patch = (
            f.material_index == 0
            and centroid.y < -0.025
            and (z_chin - 0.005) <= centroid.z <= 1.655
        )
        for loop in f.loops:
            if is_front_patch:
                co = loop.vert.co
                u = (co.x + 0.100) / 0.200
                v = (co.z - (z_chin - 0.0175)) / 0.200
                loop[uv_layer].uv = (u, v)
            else:
                loop[uv_layer].uv = (-1.0, -1.0)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.verts.index_update()
    nose_pair_set = {
        tuple(sorted((nose_bridge_v.index, nose_tip_v.index))),
        tuple(sorted((nose_tip_v.index, nose_side_v.index))),
    }

    head_mesh = bpy.data.meshes.new("LeadHead")
    bm.to_mesh(head_mesh)
    bm.free()

    for p in head_mesh.polygons:
        p.use_smooth = True

    attr = head_mesh.attributes.new("freestyle_edge", "BOOLEAN", "EDGE")
    for idx, e in enumerate(head_mesh.edges):
        pair = tuple(sorted((e.vertices[0], e.vertices[1])))
        if pair in nose_pair_set:
            attr.data[idx].value = True

    head_obj = bpy.data.objects.new("LeadHead", head_mesh)
    col_meshes.objects.link(head_obj)
    head_mesh.materials.append(mats["face"])
    head_mesh.materials.append(mats["ear"])

    add_armature_modifier(head_obj, arm_obj)
    assign_weight_by_z(head_obj, "head", 1.40, 1.80)

    return neck_obj, head_obj


def build_hair(col_meshes, mats, arm_obj):
    """
    Single continuous non-intersecting chestnut hair shell (#644638) with sculpted jagged fringe bangs,
    pointed sideburns, 5 jagged nape spikes, inner thickness rim, and curved #89624c highlight band.
    """
    bm = bmesh.new()
    n_ang = 36

    # Define ring 0 (outer hairline edge) smoothly around theta = 0 (-Y front) -> +pi/2 (+X left) -> pi (+Y back)
    def hairline_z_and_push(theta):
        # Wrap theta to [-pi, +pi], where 0 is front (-Y)
        a = ((theta + math.pi) % (2.0 * math.pi)) - math.pi
        adeg = math.degrees(a)
        abs_deg = abs(adeg)

        if abs_deg <= 68.0:
            # Front forehead jagged asymmetric bangs (5 tips dipping to ~1.610, valleys ~1.638)
            # Use specific angular tip locations for asymmetric swept style
            bang_tips = [(-56.0, 1.615), (-28.0, 1.610), (0.0, 1.606), (26.0, 1.612), (52.0, 1.618)]
            bang_valleys = [(-68.0, 1.630), (-42.0, 1.636), (-14.0, 1.634), (13.0, 1.636), (39.0, 1.638), (68.0, 1.628)]
            pts = sorted(bang_tips + bang_valleys, key=lambda t: t[0])
            z = pts[0][1]
            for j in range(len(pts) - 1):
                if pts[j][0] <= adeg <= pts[j + 1][0]:
                    t = (adeg - pts[j][0]) / (pts[j + 1][0] - pts[j][0])
                    z = pts[j][1] * (1.0 - t) + pts[j + 1][1] * t
                    break
            return z, 0.008  # slightly proud of forehead
        elif abs_deg <= 104.0:
            # Temple -> sideburn spike (at ~82 deg) -> behind ear
            if abs_deg <= 82.0:
                t = (abs_deg - 68.0) / 14.0
                return 1.628 * (1.0 - t) + 1.535 * t, 0.004
            else:
                t = (abs_deg - 82.0) / 22.0
                return 1.535 * (1.0 - t) + 1.565 * t, 0.003
        else:
            # Back nape with 5 jagged downward spikes across [105..180] deg mirrored
            # Phase across [-75..+75] around 180 deg
            back_deg = abs_deg - 104.0  # 0..76
            spike = 0.015 * abs(math.sin(back_deg / 76.0 * math.pi * 2.5))
            base_z = 1.522 - 0.018 * (back_deg / 76.0)
            return base_z - spike, 0.006

    # Build 7 vertical rings from hairline (r0) up to crown apex (r6), plus inner thickness ring (r_in)
    # Taper back-of-head yb smoothly inward below the occiput toward the nape for a natural rounded profile
    ring_specs = [
        # (blend_to_smooth_z, rx, yf, yb, yc)
        (0.00, 0.090, 0.095, 0.086, 0.001),  # 0: exact sculpted hairline (tapered nape in back)
        (0.45, 0.095, 0.099, 0.103, 0.002),  # 1: lower occiput volume
        (0.80, 0.096, 0.100, 0.107, 0.003),  # 2: fullest rounded occiput / temple
        (1.00, 0.091, 0.097, 0.103, 0.003),  # 3: upper temple / parietal curve
        (1.00, 0.080, 0.086, 0.091, 0.003),  # 4: upper dome
        (1.00, 0.056, 0.062, 0.068, 0.003),  # 5: crown
        (1.00, 0.024, 0.028, 0.032, 0.003),  # 6: top cap
    ]
    smooth_heights = [1.580, 1.632, 1.662, 1.682, 1.700, 1.714, 1.724]

    cap_rings = []
    inner_rim = []
    for s_idx, (blend, rx, yf, yb, yc) in enumerate(ring_specs):
        ring = []
        for i in range(n_ang):
            theta = 2.0 * math.pi * i / n_ang
            sin_t = math.sin(theta)
            cos_t = math.cos(theta)
            z0, push0 = hairline_z_and_push(theta)
            z = z0 * (1.0 - blend) + smooth_heights[s_idx] * blend
            # Ensure strictly monotonic upward progression per column
            if s_idx > 0:
                z = max(z, cap_rings[s_idx - 1][i].co.z + 0.012)
            rad_push = push0 * (1.0 - blend)
            ry = (yf if cos_t >= 0 else yb) + rad_push
            x = sin_t * (rx + rad_push * 0.4)
            y = yc - cos_t * ry
            v = bm.verts.new(Vector((x, y, z)))
            ring.append(v)

            if s_idx == 0:
                # Inner tucked thickness vertex slightly inside skull surface so bangs & nape have 3D thickness
                x_in = sin_t * (rx - 0.009)
                back_in = 0.015 if cos_t < 0 else 0.010
                y_in = yc - cos_t * (ry - back_in)
                inner_rim.append(bm.verts.new(Vector((x_in, y_in, z + 0.004))))
        cap_rings.append(ring)

    # Outer shell faces
    for r_idx in range(len(cap_rings) - 1):
        r0 = cap_rings[r_idx]
        r1 = cap_rings[r_idx + 1]
        for i in range(n_ang):
            ni = (i + 1) % n_ang
            bm.faces.new((r0[i], r0[ni], r1[ni], r1[i])).material_index = 0
    bm.faces.new(cap_rings[-1]).material_index = 0

    # Inner thickness bevel from r0 -> inner_rim + close underside inside head
    for i in range(n_ang):
        ni = (i + 1) % n_ang
        bm.faces.new((inner_rim[i], inner_rim[ni], cap_rings[0][ni], cap_rings[0][i])).material_index = 0
    bm.faces.new(list(reversed(inner_rim))).material_index = 0

    uv_hl = bm.loops.layers.uv.new("HairHighlightUV")
    for f in bm.faces:
        for loop in f.loops:
            co = loop.vert.co
            # U encodes front-crown oval mask (U >= 0.50 on front/upper crown, < 0.50 on temples/sides/back)
            r_xy = math.sqrt((co.x / 0.070) ** 2 + (max(0.0, co.y + 0.018) / 0.042) ** 2)
            u_band = 1.0 - 0.5 * r_xy
            # V encodes upward-arched tapered crown crescent (tapers narrower toward temples)
            z_c = 1.682 - 0.015 * ((co.x / 0.072) ** 2)
            half_thick = 0.042 * max(0.35, 1.0 - 0.55 * ((co.x / 0.070) ** 2))
            v_band = 0.5 + (co.z - z_c) / half_thick
            loop[uv_hl].uv = (u_band, v_band)

    obj = new_mesh_object("LeadHair", bm, col_meshes, [mats["hair"]], smooth=True)
    add_armature_modifier(obj, arm_obj)
    assign_weight_by_z(obj, "head", 1.40, 1.85)
    return obj


def _build_sculpted_hand_bmesh(side: float, expand: float = 0.0, hand_pose: str = "relaxed"):
    """Build sculpted bevelled palm + thumb + finger wedge in 3 poses: relaxed, grip (fist), open-flat."""
    bm = bmesh.new()
    cx = side * 0.190
    s = 1.0 + expand * 12.0

    def palm_ring(z, w_y, t_x, y_off=0.0):
        return [
            (cx - t_x, y_off - w_y, z),
            (cx + t_x, y_off - w_y, z),
            (cx + t_x * 0.9, y_off + w_y, z),
            (cx - t_x * 0.9, y_off + w_y, z),
        ]

    if hand_pose == "grip":
        # Clean, smooth rounded fist/grip silhouette (zero harsh internal GPv3 crease scribbles at POV close-up!)
        grip_rings = [
            ellipse_ring(cx, 0.000, 0.680, 0.014 * s, 0.020 * s, 10),
            ellipse_ring(cx, -0.004, 0.658, 0.018 * s, 0.026 * s, 10),
            ellipse_ring(cx - side * 0.004, -0.006, 0.630, 0.022 * s, 0.030 * s, 10),
            ellipse_ring(cx - side * 0.006, -0.005, 0.606, 0.021 * s, 0.027 * s, 10),
            ellipse_ring(cx - side * 0.005, -0.003, 0.590, 0.014 * s, 0.019 * s, 10),
        ]
        add_loft_rings(bm, grip_rings, closed_ends=True, mat_idx=0)
        return bm

    if hand_pose == "open-flat":
        # Straight flat extended palm + wide abducted thumb (for wall-push / floor-crawl / defense)
        palm_rings = [
            palm_ring(0.682, 0.020 * s, 0.010 * s, 0.000),
            palm_ring(0.660, 0.028 * s, 0.012 * s, 0.000),
            palm_ring(0.624, 0.033 * s, 0.011 * s, 0.000),
            palm_ring(0.590, 0.032 * s, 0.009 * s, 0.000),
            palm_ring(0.556, 0.026 * s, 0.007 * s, 0.000),
        ]
        add_loft_rings(bm, palm_rings, closed_ends=True, mat_idx=0)
        thumb_rings = [
            ellipse_ring(cx - side * 0.002, -0.026 * s, 0.652, 0.009 * s, 0.011 * s, 6),
            ellipse_ring(cx - side * 0.002, -0.048 * s, 0.630, 0.008 * s, 0.009 * s, 6),
            ellipse_ring(cx - side * 0.002, -0.060 * s, 0.608, 0.006 * s, 0.007 * s, 6),
        ]
        add_loft_rings(bm, thumb_rings, closed_ends=True, mat_idx=0)
        return bm

    palm_rings = [
        palm_ring(0.682, 0.020 * s, 0.011 * s, 0.000),
        palm_ring(0.662, 0.026 * s, 0.013 * s, -0.002),
        palm_ring(0.628, 0.029 * s, 0.013 * s, -0.003),
        palm_ring(0.604, 0.028 * s, 0.011 * s, -0.002),
        [
            (cx - side * 0.014 * s, -0.025 * s, 0.580),
            (cx + side * 0.006 * s, -0.025 * s, 0.580),
            (cx + side * 0.005 * s,  0.022 * s, 0.582),
            (cx - side * 0.013 * s,  0.022 * s, 0.582),
        ],
        [
            (cx - side * 0.015 * s, -0.016 * s, 0.562),
            (cx - side * 0.001 * s, -0.016 * s, 0.562),
            (cx - side * 0.002 * s,  0.014 * s, 0.564),
            (cx - side * 0.014 * s,  0.014 * s, 0.564),
        ],
    ]
    add_loft_rings(bm, palm_rings, closed_ends=True, mat_idx=0)

    thumb_rings = [
        ellipse_ring(cx - side * 0.004, -0.022 * s, 0.654, 0.009 * s, 0.011 * s, 6),
        ellipse_ring(cx - side * 0.009, -0.038 * s, 0.632, 0.008 * s, 0.009 * s, 6),
        ellipse_ring(cx - side * 0.012, -0.044 * s, 0.610, 0.006 * s, 0.007 * s, 6),
    ]
    add_loft_rings(bm, thumb_rings, closed_ends=True, mat_idx=0)
    return bm


def build_hands_bare(col_meshes, mats, arm_obj, hand_pose: str = "relaxed", suffix: str = ""):
    bm = bmesh.new()
    for side in (1.0, -1.0):
        sub = _build_sculpted_hand_bmesh(side, expand=0.0, hand_pose=hand_pose)
        m_tmp = bpy.data.meshes.new("_tmp_hand")
        sub.to_mesh(m_tmp)
        sub.free()
        bm.from_mesh(m_tmp)
        bpy.data.meshes.remove(m_tmp)

    obj = new_mesh_object(f"LeadHands_Bare{suffix}", bm, col_meshes, [mats["skin_body"]], smooth=True)
    add_armature_modifier(obj, arm_obj)
    obj.vertex_groups.new(name="hand_L")
    obj.vertex_groups.new(name="hand_R")
    for v in obj.data.vertices:
        b = "hand_L" if v.co.x > 0 else "hand_R"
        obj.vertex_groups[b].add([v.index], 1.0, "REPLACE")
    if suffix:
        obj.hide_viewport = True
        obj.hide_render = True
    return obj


def build_hands_gloves(col_meshes, mats, arm_obj, hand_pose: str = "relaxed", suffix: str = ""):
    """Toggleable sculpted leather work gloves (#553622) + knuckle guard (#784f34) + cuff (#412819) + brass buckle (#c69f59)."""
    bm = bmesh.new()
    for side in (1.0, -1.0):
        cx = side * 0.190
        # Main glove shell (mat_idx=0)
        sub = _build_sculpted_hand_bmesh(side, expand=0.0045, hand_pose=hand_pose)
        m_tmp = bpy.data.meshes.new("_tmp_glove")
        sub.to_mesh(m_tmp)
        sub.free()
        bm.from_mesh(m_tmp)
        bpy.data.meshes.remove(m_tmp)

        # Knuckle reinforcement pad (mat_idx=1: #784f34) on outer knuckle ridge
        k_rings = [
            ellipse_ring(cx + side * 0.014, -0.002, 0.620, 0.005, 0.025, 8),
            ellipse_ring(cx + side * 0.016, -0.002, 0.606, 0.005, 0.024, 8),
        ]
        add_loft_rings(bm, k_rings, closed_ends=True, mat_idx=1)

        # Slim sculpted leather wrist cuff wrapping cleanly outside tapered shirt cuff (mat_idx=2: #412819)
        cuff_rings = [
            ellipse_ring(cx, 0.000, 0.658, 0.041, 0.042, 12),
            ellipse_ring(cx, 0.000, 0.680, 0.043, 0.044, 12),
            ellipse_ring(cx, 0.000, 0.704, 0.044, 0.045, 12),
            ellipse_ring(cx, 0.000, 0.725, 0.0445, 0.0455, 12),
        ]
        add_loft_rings(bm, cuff_rings, closed_ends=True, mat_idx=2)

        # Flush leather/brass wrist strap band wrapping the outer cuff (mat_idx=3: #c69f59)
        strap_lo = []
        strap_hi = []
        for ang_deg in (-55, -20, 0, 20, 55):
            a = math.radians(ang_deg) if side > 0 else math.radians(180 - ang_deg)
            dx = math.cos(a) * 0.0452
            dy = math.sin(a) * 0.0462
            strap_lo.append((cx + dx, dy, 0.689))
            strap_hi.append((cx + dx, dy, 0.701))
        for ang_deg in (55, 20, 0, -20, -55):
            a = math.radians(ang_deg) if side > 0 else math.radians(180 - ang_deg)
            dx = math.cos(a) * 0.0428
            dy = math.sin(a) * 0.0438
            strap_lo.append((cx + dx, dy, 0.689))
            strap_hi.append((cx + dx, dy, 0.701))
        add_loft_rings(bm, [strap_lo, strap_hi], closed_ends=True, mat_idx=3)

    obj = new_mesh_object(
        f"LeadHands_Gloves{suffix}", bm, col_meshes,
        [mats["glove_base"], mats["glove_hi"], mats["glove_cuff"], mats["brass"]],
        smooth=True,
    )
    add_armature_modifier(obj, arm_obj)
    for b in ("hand_L", "hand_R", "forearm_L", "forearm_R"):
        obj.vertex_groups.new(name=b)
    # Upper glove cuff (z >= 0.678) follows forearm_{side} 100% (matching shirt cuff)
    # with a smooth wrist-crease blend across z = 0.654..0.678 so wrist flexion never clips.
    for v in obj.data.vertices:
        s = "L" if v.co.x > 0 else "R"
        if v.co.z <= 0.654:
            obj.vertex_groups[f"hand_{s}"].add([v.index], 1.0, "REPLACE")
        elif v.co.z >= 0.678:
            obj.vertex_groups[f"forearm_{s}"].add([v.index], 1.0, "REPLACE")
        else:
            t = (v.co.z - 0.654) / (0.678 - 0.654)
            obj.vertex_groups[f"hand_{s}"].add([v.index], 1.0 - t, "REPLACE")
            obj.vertex_groups[f"forearm_{s}"].add([v.index], t, "REPLACE")
    if suffix:
        obj.hide_viewport = True
        obj.hide_render = True
    return obj


def build_backpack(col_meshes, mats, arm_obj, torso_obj):
    """Toggleable bulging dark canvas backpack (#253330) + pocket (#1d2926) + surface-projected straps (#283834)."""
    bm = bmesh.new()
    vert_weights = {}

    # Bulging pack body (mat_idx=0): z=1.04..1.38, y=+0.088..+0.235, x=-0.140..+0.140
    bp_rings = [
        ellipse_ring(0.0, 0.145, 1.045, 0.115, 0.056, 12),
        ellipse_ring(0.0, 0.160, 1.090, 0.138, 0.072, 12),
        ellipse_ring(0.0, 0.165, 1.210, 0.142, 0.075, 12),
        ellipse_ring(0.0, 0.156, 1.330, 0.130, 0.068, 12),
        ellipse_ring(0.0, 0.140, 1.382, 0.105, 0.050, 12),
    ]
    bp_v_rings, _ = add_loft_rings(bm, bp_rings, closed_ends=True, mat_idx=0)
    for ring in bp_v_rings:
        for v in ring:
            vert_weights[v] = {"chest": 1.0}

    # Rear zippered pocket (mat_idx=1)
    pocket_rings = [
        ellipse_ring(0.0, 0.230, 1.070, 0.095, 0.028, 10),
        ellipse_ring(0.0, 0.235, 1.150, 0.100, 0.030, 10),
        ellipse_ring(0.0, 0.228, 1.225, 0.092, 0.025, 10),
    ]
    pocket_v_rings, _ = add_loft_rings(bm, pocket_rings, closed_ends=True, mat_idx=1)
    for ring in pocket_v_rings:
        for v in ring:
            vert_weights[v] = {"chest": 1.0}

    # Rest BVHTree + vertex weight lookup on triangulated LeadTorso for exact surface projection & skinning
    torso_vg_names = [vg.name for vg in torso_obj.vertex_groups]
    rest_vert_weights = {}
    for v in torso_obj.data.vertices:
        w_map = {}
        for g in v.groups:
            if g.weight > 1e-6:
                w_map[torso_vg_names[g.group]] = g.weight
        rest_vert_weights[v.index] = w_map

    bm_t = bmesh.new()
    bm_t.from_mesh(torso_obj.data)
    bm_t.verts.ensure_lookup_table()
    bm_t.normal_update()
    rest_vert_normals = {v.index: v.normal.copy() for v in bm_t.verts}
    bmesh.ops.triangulate(bm_t, faces=bm_t.faces)
    bm_t.faces.ensure_lookup_table()
    bvh_t = BVHTree.FromBMesh(bm_t)

    def barycentric_weights_and_normal_at(pt: Vector, tri_idx: int):
        face = bm_t.faces[tri_idx]
        a, b, c = (v.co for v in face.verts)
        v0 = b - a
        v1 = c - a
        v2 = pt - a
        d00 = v0.dot(v0)
        d01 = v0.dot(v1)
        d11 = v1.dot(v1)
        d20 = v2.dot(v0)
        d21 = v2.dot(v1)
        denom = d00 * d11 - d01 * d01
        if abs(denom) < 1e-12:
            u_b, v_b, w_b = 1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0
        else:
            v_b = (d11 * d20 - d01 * d21) / denom
            w_b = (d00 * d21 - d01 * d20) / denom
            u_b = 1.0 - v_b - w_b
        u_b = max(0.0, min(1.0, u_b))
        v_b = max(0.0, min(1.0, v_b))
        w_b = max(0.0, min(1.0, w_b))
        s_b = u_b + v_b + w_b
        if s_b < 1e-12:
            u_b, v_b, w_b = 1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0
        else:
            u_b, v_b, w_b = u_b / s_b, v_b / s_b, w_b / s_b
        out_w = {}
        smooth_n = Vector((0.0, 0.0, 0.0))
        for vert, bw in zip(face.verts, (u_b, v_b, w_b)):
            if bw <= 1e-6:
                continue
            smooth_n += rest_vert_normals.get(vert.index, face.normal) * bw
            for b_name, w in rest_vert_weights.get(vert.index, {}).items():
                out_w[b_name] = out_w.get(b_name, 0.0) + bw * w
        tot = sum(out_w.values()) or 1.0
        if smooth_n.length > 1e-6:
            smooth_n.normalize()
        else:
            smooth_n = face.normal.normalized()
        return {k: val / tot for k, val in out_w.items() if val / tot > 1e-6}, smooth_n

    def sample_catmull_rom(pts, samples_per_seg=4):
        out = []
        n = len(pts)
        for i in range(n - 1):
            p0 = pts[max(0, i - 1)]
            p1 = pts[i]
            p2 = pts[i + 1]
            p3 = pts[min(n - 1, i + 2)]
            for s in range(samples_per_seg):
                t = s / float(samples_per_seg)
                t2 = t * t
                t3 = t2 * t
                pt = 0.5 * (
                    (2.0 * p1)
                    + (-p0 + p2) * t
                    + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
                    + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
                )
                out.append(pt)
        out.append(pts[-1].copy())
        return out

    CLEARANCE = 0.0075
    THICKNESS = 0.0075
    HALF_W = 0.019

    # Dense 37-station Catmull-Rom 6-vert-ring surface-projected straps
    for side in (1.0, -1.0):
        ctrl_pts = [
            Vector((side * 0.070,  0.110, 1.350)),  # inside top pack
            Vector((side * 0.072,  0.055, 1.365)),  # upper trapezius back-to-top
            Vector((side * 0.075,  0.005, 1.362)),  # shoulder apex
            Vector((side * 0.074, -0.048, 1.335)),  # clavicle front
            Vector((side * 0.080, -0.068, 1.280)),  # upper chest
            Vector((side * 0.088, -0.064, 1.215)),  # mid chest
            Vector((side * 0.112, -0.042, 1.150)),  # lower ribcage front-side
            Vector((side * 0.122,  0.020, 1.105)),  # underarm lateral wrap
            Vector((side * 0.112,  0.068, 1.090)),  # lower back wrap
            Vector((side * 0.108,  0.112, 1.085)),  # inside bottom pack
        ]
        guides = sample_catmull_rom(ctrl_pts, samples_per_seg=4)
        centers = []
        c_norms = []
        for gp in guides:
            loc, norm, tri_idx, _ = bvh_t.find_nearest(gp)
            _, sn_gp = barycentric_weights_and_normal_at(loc, tri_idx)
            proj = loc + sn_gp * CLEARANCE
            if gp.y > 0.075 and (gp - loc).dot(sn_gp) >= CLEARANCE:
                blend_p = min(1.0, (gp.y - 0.075) / 0.020)
                center = proj.lerp(gp, blend_p)
            else:
                center = proj
            centers.append(center)
            c_norms.append(sn_gp)

        strap_rings = []
        ring_w_specs = []
        n_st = len(centers)
        for idx in range(n_st):
            center = centers[idx]
            n_vec = c_norms[idx]
            tan = (centers[min(n_st - 1, idx + 1)] - centers[max(0, idx - 1)]).normalized()
            side_dir = n_vec.cross(tan)
            if side_dir.length < 1e-5:
                side_dir = Vector((1.0, 0.0, 0.0))
            else:
                side_dir.normalize()

            seeds = [center - side_dir * HALF_W, center, center + side_dir * HALF_W]
            inner_pts = []
            inner_norms = []
            inner_weights = []
            for sp in seeds:
                loc, norm, tri_idx, _ = bvh_t.find_nearest(sp)
                w_map, sn = barycentric_weights_and_normal_at(loc, tri_idx)
                proj_in = loc + sn * CLEARANCE
                sd = (sp - loc).dot(sn)
                if sp.y > 0.075 and sd >= CLEARANCE:
                    blend_p = min(1.0, (sp.y - 0.075) / 0.020)
                    p_in = proj_in.lerp(sp, blend_p)
                else:
                    p_in = proj_in
                if p_in.y > 0.095:
                    pack_t = min(1.0, (p_in.y - 0.095) / 0.015)
                    blended = {k: val * (1.0 - pack_t) for k, val in w_map.items()}
                    blended["chest"] = blended.get("chest", 0.0) + pack_t
                    w_map = {k: val for k, val in blended.items() if val > 1e-6}
                inner_pts.append(p_in)
                inner_norms.append(sn)
                inner_weights.append(w_map)

            outer_pts = [p + n * THICKNESS for p, n in zip(inner_pts, inner_norms)]
            # 6-vertex ring: [in_L, in_C, in_R, out_R, out_C, out_L]
            strap_rings.append([
                tuple(inner_pts[0]),
                tuple(inner_pts[1]),
                tuple(inner_pts[2]),
                tuple(outer_pts[2]),
                tuple(outer_pts[1]),
                tuple(outer_pts[0]),
            ])
            ring_w_specs.append([
                inner_weights[0],
                inner_weights[1],
                inner_weights[2],
                inner_weights[2],
                inner_weights[1],
                inner_weights[0],
            ])

        s_v_rings, _ = add_loft_rings(bm, strap_rings, closed_ends=True, mat_idx=2)
        for v_ring, w_ring in zip(s_v_rings, ring_w_specs):
            for v, w_map in zip(v_ring, w_ring):
                vert_weights[v] = w_map

    bm_t.free()
    bm.verts.index_update()
    vert_idx_weights = {v.index: w for v, w in vert_weights.items()}

    obj = new_mesh_object(
        "LeadBackpack", bm, col_meshes,
        [mats["bp_base"], mats["bp_pocket"], mats["bp_strap"]],
        smooth=True,
    )
    add_armature_modifier(obj, arm_obj)
    for b in sorted(set(torso_vg_names) | {"pelvis", "spine", "chest"}):
        obj.vertex_groups.new(name=b)
    for v_idx, w_map in vert_idx_weights.items():
        tot = sum(w_map.values()) or 1.0
        for b_name, w in w_map.items():
            obj.vertex_groups[b_name].add([v_idx], w / tot, "REPLACE")
    return obj


# ---------------------------------------------------------------------------
# Armature, IK/FK, Joint Limits & 5 Sockets
# ---------------------------------------------------------------------------
def build_armature(col_rig):
    arm_data = bpy.data.armatures.new("LeadArmature")
    arm_data.display_type = "OCTAHEDRAL"
    arm_obj = bpy.data.objects.new("LeadArmature", arm_data)
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

    add_bone("root", (0.0, 0.0, 0.0), (0.0, -0.20, 0.0), deform=False)
    add_bone("pelvis", (0.0, 0.0, 0.94), (0.0, 0.0, 1.04), "root", False, True)
    add_bone("spine", (0.0, 0.0, 0.94), (0.0, 0.0, 1.14), "pelvis", False, True)
    add_bone("chest", (0.0, 0.0, 1.14), (0.0, 0.0, 1.38), "spine", True, True)
    add_bone("neck", (0.0, 0.0, 1.38), (0.0, 0.0, 1.48), "chest", True, True)
    add_bone("head", (0.0, 0.0, 1.48), (0.0, 0.0, 1.70), "neck", True, True)

    for side, s in (("L", 1.0), ("R", -1.0)):
        add_bone(f"shoulder_{side}", (s * 0.04, 0.0, 1.315), (s * 0.168, 0.0, 1.305), "chest", False, True)
        add_bone(f"upper_arm_{side}", (s * 0.168, 0.0, 1.305), (s * 0.190, 0.015, 0.98), f"shoulder_{side}", True, True)
        add_bone(f"forearm_{side}", (s * 0.19, 0.015, 0.98), (s * 0.19, 0.0, 0.67), f"upper_arm_{side}", True, True)
        add_bone(f"hand_{side}", (s * 0.19, 0.0, 0.67), (s * 0.19, 0.0, 0.57), f"forearm_{side}", True, True)
        add_bone(f"hand_IK_{side}", (s * 0.19, 0.0, 0.67), (s * 0.19, 0.0, 0.57), "root", False, False)
        add_bone(f"arm_pole_{side}", (s * 0.19, 0.50, 0.98), (s * 0.19, 0.60, 0.98), "root", False, False)

        add_bone(f"thigh_{side}", (s * 0.10, 0.0, 0.94), (s * 0.10, -0.015, 0.50), "pelvis", False, True)
        add_bone(f"shin_{side}", (s * 0.10, -0.015, 0.50), (s * 0.10, 0.0, 0.06), f"thigh_{side}", True, True)
        add_bone(f"foot_{side}", (s * 0.10, 0.0, 0.06), (s * 0.10, -0.14, 0.02), f"shin_{side}", True, True)
        add_bone(f"toe_{side}", (s * 0.10, -0.14, 0.02), (s * 0.10, -0.22, 0.02), f"foot_{side}", True, True)
        add_bone(f"foot_IK_{side}", (s * 0.10, 0.0, 0.06), (s * 0.10, -0.14, 0.02), "root", False, False)
        add_bone(f"leg_pole_{side}", (s * 0.10, -0.50, 0.50), (s * 0.10, -0.60, 0.50), "root", False, False)

    bpy.ops.object.mode_set(mode="POSE")

    # Custom properties on LeadArmature
    for prop, default_val in (("ik_arm_L", 0.0), ("ik_arm_R", 0.0), ("ik_leg_L", 1.0), ("ik_leg_R", 1.0)):
        arm_obj[prop] = default_val
        ui = arm_obj.id_properties_ui(prop)
        ui.update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0)

    arm_obj["gloves"] = 0
    arm_obj.id_properties_ui("gloves").update(min=0, max=1)
    arm_obj["backpack"] = 0
    arm_obj.id_properties_ui("backpack").update(min=0, max=1)
    arm_obj["condition"] = "clean"
    arm_obj["expression"] = "head"

    # Rotation modes
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = "XYZ"

    # Helper to bind SINGLE_PROP / AVERAGE driver to LeadArmature custom prop
    def add_prop_driver(target_struct, data_path: str, prop_name: str, expr: str = "var"):
        fc = target_struct.driver_add(data_path)
        drv = fc.driver
        drv.type = "SCRIPTED" if expr != "var" else "AVERAGE"
        if expr != "var":
            drv.expression = expr
        var = drv.variables.new()
        var.name = "var"
        var.type = "SINGLE_PROP"
        targ = var.targets[0]
        targ.id = arm_obj
        targ.data_path = f'["{prop_name}"]'
        return fc

    # IK + COPY_ROTATION constraints
    for side in ("L", "R"):
        # Leg IK
        pb_shin = arm_obj.pose.bones[f"shin_{side}"]
        ik_leg = pb_shin.constraints.new("IK")
        ik_leg.name = "IK"
        ik_leg.target = arm_obj
        ik_leg.subtarget = f"foot_IK_{side}"
        ik_leg.pole_target = arm_obj
        ik_leg.pole_subtarget = f"leg_pole_{side}"
        ik_leg.pole_angle = math.radians(-90.0)
        ik_leg.chain_count = 2
        ik_leg.use_rotation = False
        add_prop_driver(ik_leg, "influence", f"ik_leg_{side}")

        pb_foot = arm_obj.pose.bones[f"foot_{side}"]
        cr_foot = pb_foot.constraints.new("COPY_ROTATION")
        cr_foot.name = "CopyIKRot"
        cr_foot.target = arm_obj
        cr_foot.subtarget = f"foot_IK_{side}"
        cr_foot.target_space = "WORLD"
        cr_foot.owner_space = "WORLD"
        add_prop_driver(cr_foot, "influence", f"ik_leg_{side}")

        # Arm IK
        pb_fore = arm_obj.pose.bones[f"forearm_{side}"]
        ik_arm = pb_fore.constraints.new("IK")
        ik_arm.name = "IK"
        ik_arm.target = arm_obj
        ik_arm.subtarget = f"hand_IK_{side}"
        ik_arm.pole_target = arm_obj
        ik_arm.pole_subtarget = f"arm_pole_{side}"
        ik_arm.pole_angle = math.radians(90.0)
        ik_arm.chain_count = 2
        ik_arm.use_rotation = False
        add_prop_driver(ik_arm, "influence", f"ik_arm_{side}")

        pb_hand = arm_obj.pose.bones[f"hand_{side}"]
        cr_hand = pb_hand.constraints.new("COPY_ROTATION")
        cr_hand.name = "CopyIKRot"
        cr_hand.target = arm_obj
        cr_hand.subtarget = f"hand_IK_{side}"
        cr_hand.target_space = "WORLD"
        cr_hand.owner_space = "WORLD"
        add_prop_driver(cr_hand, "influence", f"ik_arm_{side}")

    # Anatomical LIMIT_ROTATION (owner_space='LOCAL') + IK Solver Limits
    # Mapped to verified Blender local bone axes
    joint_limits_deg = {
        "spine":       ((-20, 40),   (-20, 20), (-20, 20)),
        "chest":       ((-15, 35),   (-20, 20), (-15, 15)),
        "neck":        ((-35, 45),   (-55, 55), (-35, 35)),
        "head":        ((-30, 40),   (-45, 45), (-30, 30)),
        "shoulder_L":  ((-15, 15),   (-10, 10), (-15, 15)),
        "shoulder_R":  ((-15, 15),   (-10, 10), (-15, 15)),
        "thigh_L":     ((-125, 45),  (-40, 40), (-45, 35)),
        "thigh_R":     ((-125, 45),  (-40, 40), (-35, 45)),
        "shin_L":      ((0, 145),    (-10, 10), (-5, 5)),
        "shin_R":      ((0, 145),    (-10, 10), (-5, 5)),
        "foot_L":      ((-55, 45),   (-20, 20), (-25, 25)),
        "foot_R":      ((-55, 45),   (-20, 20), (-25, 25)),
        "toe_L":       ((-45, 65),   (-5, 5),   (-10, 10)),
        "toe_R":       ((-45, 65),   (-5, 5),   (-10, 10)),
        "upper_arm_L": ((-165, 65),  (-90, 90), (-90, 95)),
        "upper_arm_R": ((-165, 65),  (-90, 90), (-95, 90)),
        "forearm_L":   ((-145, 0),   (-15, 15), (-10, 10)),
        "forearm_R":   ((-145, 0),   (-15, 15), (-10, 10)),
        "hand_L":      ((-75, 75),   (-60, 60), (-30, 30)),
        "hand_R":      ((-75, 75),   (-60, 60), (-30, 30)),
    }

    for b_name, (rx, ry, rz) in joint_limits_deg.items():
        pb = arm_obj.pose.bones[b_name]
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

        if b_name.startswith(("thigh_", "upper_arm_")):
            pb.use_ik_limit_x = True
            pb.use_ik_limit_y = True
            pb.use_ik_limit_z = True
            pb.ik_min_x, pb.ik_max_x = math.radians(rx[0]), math.radians(rx[1])
            pb.ik_min_y, pb.ik_max_y = math.radians(ry[0]), math.radians(ry[1])
            pb.ik_min_z, pb.ik_max_z = math.radians(rz[0]), math.radians(rz[1])
        elif b_name.startswith(("shin_", "forearm_")):
            pb.use_ik_limit_x = True
            pb.ik_min_x, pb.ik_max_x = math.radians(rx[0]), math.radians(rx[1])
            pb.lock_ik_y = True
            pb.lock_ik_z = True

    bpy.ops.object.mode_set(mode="OBJECT")
    return arm_obj


def build_sockets(col_rig, arm_obj):
    """Create 5 bone-parented Empty sockets in LeadRig."""
    # Note: parent_type='BONE' origins at bone TAIL in bone local frame:
    # For vertical-down limbs (hand, forearm): bone_Y = (0,0,-1), bone_Z = (0,+1,0)
    #   tail of hand_L/R is at z=0.57 -> palm center (z=0.625) is local Y = -0.055?
    #   Wait: let's verify in bone local space! tail -> head is -Y_bone = +Z_world!
    #   Let's compute exact local offsets using bone's world matrix^-1 * desired_world_pos!
    bpy.context.view_layer.update()

    socket_specs = [
        ("hand_R_socket",    "hand_R",    Vector((-0.19, -0.005, 0.625))),
        ("hand_L_socket",    "hand_L",    Vector(( 0.19, -0.005, 0.625))),
        ("back_socket",      "chest",     Vector(( 0.00,  0.115, 1.240))),
        ("forearm_R_socket", "forearm_R", Vector((-0.19,  0.000, 0.750))),
        ("forearm_L_socket", "forearm_L", Vector(( 0.19,  0.000, 0.750))),
    ]

    sockets = {}
    for sock_name, bone_name, target_world in socket_specs:
        emp = bpy.data.objects.new(sock_name, None)
        emp.empty_display_type = "ARROWS"
        emp.empty_display_size = 0.07
        col_rig.objects.link(emp)

        emp.parent = arm_obj
        emp.parent_type = "BONE"
        emp.parent_bone = bone_name
        emp.matrix_parent_inverse.identity()

        # In Blender, BONE parenting sets parent transform origin at bone TAIL with bone's local orientation
        pbone = arm_obj.pose.bones[bone_name]
        bone_tail_mat = arm_obj.matrix_world @ Matrix.Translation(pbone.tail) @ pbone.matrix.to_3x3().to_4x4()
        local_pos = bone_tail_mat.inverted() @ target_world
        emp.location = local_pos
        sockets[sock_name] = emp

    return sockets


def setup_visibility_drivers(arm_obj, bare_obj, glove_obj, bp_obj):
    """Drive BOTH hide_viewport and hide_render so GPv3 Line Art never leaves ghost strokes."""
    def bind_hide_driver(obj, prop_name: str, expr: str):
        for attr in ("hide_viewport", "hide_render"):
            fc = obj.driver_add(attr)
            drv = fc.driver
            drv.type = "SCRIPTED"
            drv.expression = expr
            var = drv.variables.new()
            var.name = "val"
            var.type = "SINGLE_PROP"
            var.targets[0].id = arm_obj
            var.targets[0].data_path = f'["{prop_name}"]'

    bind_hide_driver(bare_obj, "gloves", "val != 0")
    bind_hide_driver(glove_obj, "gloves", "val == 0")
    bind_hide_driver(bp_obj, "backpack", "val == 0")


# ---------------------------------------------------------------------------
# Grease Pencil v3 Line Art Outline
# ---------------------------------------------------------------------------
def setup_gp_lineart(col_lines, col_meshes):
    gp_data = bpy.data.grease_pencils.new("LeadOutline")
    gp_obj = bpy.data.objects.new("LeadOutline", gp_data)
    col_lines.objects.link(gp_obj)

    layer = gp_data.layers.new("Lines", set_active=True)
    layer.frames.new(1)

    ink_mat = bpy.data.materials.new("InkMat")
    bpy.data.materials.create_gpencil_data(ink_mat)
    ink_mat.grease_pencil.show_stroke = True
    ink_mat.grease_pencil.show_fill = False
    ink_mat.grease_pencil.color = hex_to_lin(PALETTE["ink"])
    gp_data.materials.append(ink_mat)

    m = gp_obj.modifiers.new("LineArt", "LINEART")
    m.source_type = "COLLECTION"
    m.source_collection = col_meshes
    m.target_layer = "Lines"
    m.target_material = ink_mat
    m.radius = 0.0048
    m.use_contour = True
    m.use_material = True
    m.use_edge_mark = True
    m.use_intersection = True
    m.use_crease = True
    m.crease_threshold = math.radians(145.0)
    m.use_crease_on_smooth = False
    m.use_crease_on_sharp = True
    m.use_clip_plane_boundaries = True
    m.use_overlap_edge_type_support = False
    return gp_obj


# ---------------------------------------------------------------------------
# Main Build
# ---------------------------------------------------------------------------
def build():
    clear_scene()
    scene, col_meshes, col_rig, col_lines = setup_scene()
    setup_default_camera_and_lights(scene)
    mats = create_all_materials()

    arm_obj = build_armature(col_rig)
    build_sockets(col_rig, arm_obj)

    torso_obj = build_torso_and_sleeves(col_meshes, mats, arm_obj)
    build_collar_and_tie(col_meshes, mats, arm_obj)
    build_trousers(col_meshes, mats, arm_obj)
    build_shoes(col_meshes, mats, arm_obj)
    build_head_neck_ears(col_meshes, mats, arm_obj)
    build_hair(col_meshes, mats, arm_obj)
    bare_obj = build_hands_bare(col_meshes, mats, arm_obj, "relaxed", "")
    build_hands_bare(col_meshes, mats, arm_obj, "grip", "_Grip")
    build_hands_bare(col_meshes, mats, arm_obj, "open-flat", "_Open")
    glove_obj = build_hands_gloves(col_meshes, mats, arm_obj, "relaxed", "")
    build_hands_gloves(col_meshes, mats, arm_obj, "grip", "_Grip")
    build_hands_gloves(col_meshes, mats, arm_obj, "open-flat", "_Open")
    bp_obj = build_backpack(col_meshes, mats, arm_obj, torso_obj)
    arm_obj["hand_pose"] = "relaxed"

    setup_visibility_drivers(arm_obj, bare_obj, glove_obj, bp_obj)
    setup_gp_lineart(col_lines, col_meshes)

    apply_rig_state(arm_obj, expression="head", gloves=0, backpack=0, condition="clean")

    os.makedirs(os.path.dirname(BLEND_OUT), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
    print(f"Successfully built {BLEND_OUT}")


if __name__ == "__main__":
    build()
