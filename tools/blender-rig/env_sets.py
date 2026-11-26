"""Modular 3D Cel-Shaded Environment Sets for Blender 5.2 Hybrid 3D-to-2D Pipeline.

Builds lightweight, inked (#253a3b GPv3 Line Art), flat 2-tone cel-shaded 3D ground
and architectural sets at z = 0 so characters physically walk on real 3D surfaces
and real 3D camera push-ins (--push-in) produce true perspective parallax.
Sky remains transparent (film_transparent=True) for 2D atmospheric sky/fog/beacon compositing.
"""
import math
import random
import bpy
import bmesh
from mathutils import Vector


def _srgb_to_lin(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _hex_lin(hex_col: str) -> tuple:
    h = hex_col.lstrip("#")
    return (_srgb_to_lin(int(h[0:2], 16) / 255.0), _srgb_to_lin(int(h[2:4], 16) / 255.0), _srgb_to_lin(int(h[4:6], 16) / 255.0), 1.0)


def _make_env_mat(name: str, base_hex: str, shad_hex: str = None, emissive: bool = False):
    mat = bpy.data.materials.get(name)
    if mat:
        return mat
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")

    if emissive:
        em = nt.nodes.new("ShaderNodeEmission")
        em.inputs["Color"].default_value = _hex_lin(base_hex)
        em.inputs["Strength"].default_value = 1.05
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
        return mat

    # Reuse Cel2Tone group if present in the rig .blend so lighting.json moods affect the set!
    cel_grp = bpy.data.node_groups.get("Cel2Tone")
    if cel_grp:
        grp = nt.nodes.new("ShaderNodeGroup")
        grp.node_tree = cel_grp
        grp.inputs["BaseColor"].default_value = _hex_lin(base_hex)
        grp.inputs["ShadowColor"].default_value = _hex_lin(shad_hex or base_hex)
        em = nt.nodes.new("ShaderNodeEmission")
        nt.links.new(grp.outputs["Color"], em.inputs["Color"])
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    else:
        em = nt.nodes.new("ShaderNodeEmission")
        em.inputs["Color"].default_value = _hex_lin(base_hex)
        nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return mat


def _add_box(col, name, center, size, mat, rot_z=0.0):
    me = bpy.data.meshes.new(name + "_Mesh")
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.location = center
    obj.rotation_euler = (0.0, 0.0, rot_z)
    obj.data.materials.append(mat)
    col.objects.link(obj)
    return obj


def _add_cyl(col, name, center, radius, depth, segs, mat):
    me = bpy.data.meshes.new(name + "_Mesh")
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=radius, radius2=radius, depth=depth)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.location = center
    obj.data.materials.append(mat)
    col.objects.link(obj)
    return obj


def _ensure_env_lineart(scene, env_col):
    """Add a subtle dark-ink GPv3 Line Art pass specifically for architectural edges."""
    if bpy.data.objects.get("Env_LineArt"):
        return
    gp_data = bpy.data.grease_pencils.new("Env_LineArt_Data")
    gp_obj = bpy.data.objects.new("Env_LineArt", gp_data)
    scene.collection.objects.link(gp_obj)
    layer = gp_data.layers.new("Lines", set_active=True)
    layer.frames.new(1)

    ink_mat = bpy.data.materials.get("Mat_Env_Ink")
    if not ink_mat:
        ink_mat = bpy.data.materials.new("Mat_Env_Ink")
        bpy.data.materials.create_gpencil_data(ink_mat)
        ink_mat.grease_pencil.color = _hex_lin("#1a292d")
        ink_mat.grease_pencil.show_stroke = True
        ink_mat.grease_pencil.show_fill = False
    gp_data.materials.append(ink_mat)

    mod = gp_obj.modifiers.new("EnvLineArt", "LINEART")
    mod.source_type = "COLLECTION"
    mod.source_collection = env_col
    mod.target_layer = "Lines"
    mod.target_material = ink_mat
    mod.radius = 0.0038
    mod.use_crease = True
    mod.crease_threshold = math.radians(125.0)
    mod.use_contour = True
    mod.use_material = False


def build_civic_plaza(scene):
    """
    Build a 3D cel-shaded shattered civic plaza at z = 0:
      - Recessed dark mortar sub-slab + 3D raised concrete flagstone pavers (with subtle tonal variation)
      - Wet reflective cyan rain puddles flush on z = 0.002
      - Left & right civic stone colonnade walls with recessed arched/framed window bays & curbs
      - Tiered dry stone fountain at (0.35, -3.2, 0) + wrought-iron streetlamp with glowing lantern
      - Overturned park bench + scattered 3D inked glass shards across the pavers
    """
    env_col = bpy.data.collections.get("EnvMeshes")
    if env_col is None:
        env_col = bpy.data.collections.new("EnvMeshes")
        scene.collection.objects
        scene.collection.children.link(env_col)

    m_mortar = _make_env_mat("Mat_Env_Mortar", "#18232c", "#111920")
    m_stone_a = _make_env_mat("Mat_Env_StoneA", "#2f404f", "#22303c")
    m_stone_b = _make_env_mat("Mat_Env_StoneB", "#374a5a", "#283744")
    m_stone_c = _make_env_mat("Mat_Env_StoneC", "#293845", "#1e2a35")
    m_curb = _make_env_mat("Mat_Env_Curb", "#45596a", "#31414f")
    m_wall = _make_env_mat("Mat_Env_Wall", "#2c3c4a", "#1e2a35")
    m_win = _make_env_mat("Mat_Env_Window", "#101820", "#0a1016")
    m_puddle = _make_env_mat("Mat_Env_Puddle", "#234a58", "#18333e")
    m_wood = _make_env_mat("Mat_Env_Wood", "#4d3c30", "#362920")
    m_iron = _make_env_mat("Mat_Env_Iron", "#1c262e", "#12191f")
    m_lantern = _make_env_mat("Mat_Env_Lantern", "#bdf4ff", emissive=True)
    m_glass = _make_env_mat("Mat_Env_Glass", "#9ce4f4", emissive=True)

    # 1. Sub-slab dark mortar base (z = -0.02 .. -0.002)
    _add_box(env_col, "Plaza_MortarBase", (0.0, -4.0, -0.015), (24.0, 26.0, 0.026), m_mortar)

    # 2. 3D Flagstone Concrete Pavers (1.15m x 1.15m tiles with crisp 0.04m mortar gaps)
    rng = random.Random(404)
    stone_mats = [m_stone_a, m_stone_b, m_stone_c]
    tile = 1.20
    for ix in range(-6, 7):
        for iy in range(-10, 5):
            cx = ix * tile
            cy = iy * tile
            # Slight alternating brick-bond offset
            if iy % 2 == 1:
                cx += tile * 0.5
            mat = stone_mats[(ix * 3 + iy * 7 + rng.randint(0, 1)) % 3]
            _add_box(env_col, f"Paver_{ix}_{iy}", (cx, cy, -0.003), (tile - 0.045, tile - 0.045, 0.006), mat)

    # 3. Wet Rain Puddles flush on pavers
    for idx, (px, py, rad) in enumerate([(-1.4, -1.6, 0.65), (1.3, -2.5, 0.72), (-0.8, -4.4, 0.80)]):
        _add_cyl(env_col, f"Puddle_{idx}", (px, py, 0.0015), rad, 0.002, 18, m_puddle)

    # 4. Left & Right Civic Colonnade Facades (receding along -Y for strong 3D architecture!)
    for side_idx, sx in enumerate((-5.8, 5.8)):
        sname = "L" if sx < 0 else "R"
        # Raised stone sidewalk curb
        curb_x = sx + (0.85 if sx < 0 else -0.85)
        _add_box(env_col, f"Curb_{sname}", (curb_x, -4.5, 0.09), (1.7, 22.0, 0.18), m_curb)
        # Main stone building wall
        _add_box(env_col, f"Wall_{sname}", (sx, -4.5, 2.35), (0.65, 22.0, 4.7), m_wall)
        # Top cornice parapet
        _add_box(env_col, f"Cornice_{sname}", (sx + (0.25 if sx < 0 else -0.25), -4.5, 4.65), (0.95, 22.2, 0.28), m_curb)
        # Stone pilasters & recessed dark storefront windows every 2.8m
        for b in range(-5, 3):
            by = b * 2.8
            pil_x = sx + (0.38 if sx < 0 else -0.38)
            _add_box(env_col, f"Pilaster_{sname}_{b}", (pil_x, by, 2.3), (0.38, 0.42, 4.5), m_curb)
            win_x = sx + (0.30 if sx < 0 else -0.30)
            _add_box(env_col, f"Window_{sname}_{b}", (win_x, by + 1.4, 1.9), (0.14, 1.95, 2.6), m_win)

    # 5. Midground Landmarks: Tiered Dry Stone Fountains & Streetlamps on both -Y (for OTS) and +Y (for 3q-front)
    for tag, fx, fy, lx, ly in (
        ("South", 0.45, -4.2, 1.95, -4.0),
        ("North", 2.1, 3.6, 3.2, 3.2),
    ):
        _add_cyl(env_col, f"Fountain_{tag}_Step", (fx, fy, 0.06), 1.45, 0.12, 12, m_curb)
        _add_cyl(env_col, f"Fountain_{tag}_Basin", (fx, fy, 0.34), 1.22, 0.48, 12, m_stone_b)
        _add_cyl(env_col, f"Fountain_{tag}_Inside", (fx, fy, 0.56), 1.04, 0.08, 12, m_mortar)
        _add_cyl(env_col, f"Fountain_{tag}_Pillar", (fx, fy, 0.92), 0.24, 0.96, 10, m_curb)
        _add_cyl(env_col, f"Fountain_{tag}_TopBowl", (fx, fy, 1.46), 0.64, 0.18, 12, m_stone_b)

        _add_cyl(env_col, f"Lamp_{tag}_Plinth", (lx, ly, 0.16), 0.20, 0.32, 8, m_curb)
        _add_cyl(env_col, f"Lamp_{tag}_Post", (lx, ly, 2.15), 0.065, 3.85, 8, m_iron)
        _add_box(env_col, f"Lamp_{tag}_Arm", (lx - 0.48, ly, 3.96), (0.98, 0.08, 0.08), m_iron)
        _add_cyl(env_col, f"Lamp_{tag}_Lantern", (lx - 0.92, ly, 3.80), 0.16, 0.28, 6, m_lantern)

    # 7. Overturned Park Bench (left-mid plaza at x=-2.4, y=-2.8)
    _add_box(env_col, "Bench_Seat", (-2.4, -2.8, 0.18), (1.45, 0.48, 0.07), m_wood, rot_z=0.35)
    _add_box(env_col, "Bench_LegL", (-2.9, -2.6, 0.22), (0.08, 0.08, 0.44), m_iron, rot_z=0.35)
    _add_box(env_col, "Bench_LegR", (-1.9, -3.0, 0.22), (0.08, 0.08, 0.44), m_iron, rot_z=0.35)

    # 8. Scattered 3D Jagged Glass Shards across the plaza pavers
    grng = random.Random(909)
    for g in range(36):
        gx = grng.uniform(-3.6, 3.6)
        gy = grng.uniform(-6.2, 1.4)
        # Keep immediate origin clear if --floor-prop glass-shard places hero shards there
        if math.hypot(gx, gy) < 0.35:
            continue
        gs = grng.uniform(0.045, 0.11)
        _add_box(env_col, f"PlazaGlass_{g}", (gx, gy, 0.006), (gs, gs * 0.55, 0.008), m_glass, rot_z=grng.uniform(0, math.tau))

    _ensure_env_lineart(scene, env_col)
    return env_col


ENV_BUILDERS = {
    "civic-plaza": build_civic_plaza,
}


def setup_environment(scene, env_name: str):
    if not env_name or env_name == "none":
        return None
    builder = ENV_BUILDERS.get(env_name)
    if builder is None:
        raise SystemExit(f"Unknown --env '{env_name}'. Valid: ['none', {', '.join(ENV_BUILDERS.keys())}]")
    return builder(scene)
