#!/usr/bin/env python3
"""Headless Blender 3D-to-2D Mannequin Pose Projector.

Usage:
  blender --background --python tools/pose-grounding/project-pose.py -- \
    --preset lead-crouch-stealth --camera side --out assets/series-lead/pose-library/lead-crouch-stealth

  blender --background --python tools/pose-grounding/project-pose.py -- \
    --spec path/to/custom-pose.json --out assets/series-lead/pose-library/my-pose

Outputs:
  <out>.json  — Exact 2D projected joint coordinates (in 960x540 & poses.mjs space),
                bone lengths, foreshortening ratios, and joint angles.
  <out>.svg   — Clean mannequin silhouette + bone-landmark reference sheet (readable in browser/Edge/Chromium).
"""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view

# ---------------------------------------------------------------------------
# Anatomical rig profiles (meters; calibrated to series-lead poses.mjs ratios)
# Series lead poses.mjs: thigh=105, shin=101, upperArm=83, forearm=72 (scale ~206 px/m)
# ---------------------------------------------------------------------------
RIG_PROFILES = {
    "lead": {
        "pelvis_z": 0.94,
        "spine_len": 0.44,
        "neck_len": 0.10,
        "head_len": 0.22,
        "shoulder_half_w": 0.19,
        "hip_half_w": 0.10,
        "thigh": 0.46,
        "shin": 0.44,
        "foot": 0.14,
        "upper_arm": 0.36,
        "forearm": 0.31,
        "torso_r": 0.13,
        "limb_r": 0.055,
        "head_r": 0.105,
    },
    "witch": {
        "pelvis_z": 0.86,
        "spine_len": 0.42,
        "neck_len": 0.11,
        "head_len": 0.21,
        "shoulder_half_w": 0.15,
        "hip_half_w": 0.09,
        "thigh": 0.44,
        "shin": 0.43,
        "foot": 0.13,
        "upper_arm": 0.38,
        "forearm": 0.38,  # Gaunt elongated forearms & claws
        "torso_r": 0.095,
        "limb_r": 0.038,
        "head_r": 0.095,
    },
    "charger": {
        "pelvis_z": 1.02,
        "spine_len": 0.52,
        "neck_len": 0.08,
        "head_len": 0.22,
        "shoulder_half_w": 0.30,
        "hip_half_w": 0.14,
        "thigh": 0.49,
        "shin": 0.46,
        "foot": 0.16,
        "upper_arm": 0.46,
        "forearm": 0.48,  # Massive right arm handled via arm_scale_r / arm_scale_l
        "arm_scale_l": 0.58,
        "arm_scale_r": 1.45,
        "torso_r": 0.21,
        "limb_r": 0.085,
        "head_r": 0.11,
    },
    "tank": {
        "pelvis_z": 1.24,
        "spine_len": 0.68,
        "neck_len": 0.07,
        "head_len": 0.24,
        "shoulder_half_w": 0.46,
        "hip_half_w": 0.20,
        "thigh": 0.56,
        "shin": 0.52,
        "foot": 0.20,
        "upper_arm": 0.56,
        "forearm": 0.54,
        "torso_r": 0.31,
        "limb_r": 0.13,
        "head_r": 0.12,
    },
    "hunter": {
        "pelvis_z": 0.88,
        "spine_len": 0.44,
        "neck_len": 0.09,
        "head_len": 0.21,
        "shoulder_half_w": 0.20,
        "hip_half_w": 0.10,
        "thigh": 0.46,
        "shin": 0.45,
        "foot": 0.15,
        "upper_arm": 0.37,
        "forearm": 0.34,
        "torso_r": 0.13,
        "limb_r": 0.056,
        "head_r": 0.105,
    },
    "smoker": {
        "pelvis_z": 1.06,
        "spine_len": 0.54,
        "neck_len": 0.13,
        "head_len": 0.22,
        "shoulder_half_w": 0.19,
        "hip_half_w": 0.10,
        "thigh": 0.54,
        "shin": 0.52,
        "foot": 0.15,
        "upper_arm": 0.44,
        "forearm": 0.40,
        "torso_r": 0.12,
        "limb_r": 0.048,
        "head_r": 0.10,
    },
}

# Anatomical joint-angle limits in degrees (XYZ Euler local to parent)
# Prevents impossible backward knees/elbows or neck snaps.
JOINT_LIMITS = {
    "spine": ((-35, 75), (-35, 35), (-40, 40)),
    "neck": ((-35, 45), (-35, 35), (-55, 55)),
    "head": ((-30, 40), (-30, 30), (-45, 45)),
    "thigh_L": ((-125, 45), (-45, 35), (-40, 40)),
    "thigh_R": ((-125, 45), (-35, 45), (-40, 40)),
    "shin_L": ((0, 145), (-5, 5), (-10, 10)),       # Knees only bend backward!
    "shin_R": ((0, 145), (-5, 5), (-10, 10)),
    "upper_arm_L": ((-165, 65), (-90, 95), (-90, 90)),
    "upper_arm_R": ((-165, 65), (-95, 90), (-90, 90)),
    "forearm_L": ((-145, 0), (-10, 10), (-15, 15)), # Elbows only bend forward!
    "forearm_R": ((-145, 0), (-10, 10), (-15, 15)),
}

# Built-in verified survival & infected pose presets (degrees, +X=pitch forward/back, +Y=roll, +Z=yaw)
PRESETS = {
    "lead-low-ready-walk": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.02],
        "pelvis_rot": [4, 0, 0],
        "bones": {
            "spine": [8, 0, 0],
            "neck": [2, 0, 0],
            "head": [-5, 0, 0],
            "thigh_L": [-24, 0, 0],
            "shin_L": [18, 0, 0],
            "thigh_R": [16, 0, 0],
            "shin_R": [28, 0, 0],
            "upper_arm_L": [-42, 8, 14],
            "forearm_L": [-58, 0, 0],
            "upper_arm_R": [-22, -10, -10],
            "forearm_R": [-82, 0, 0],
        },
    },
    "lead-crouch-stealth": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.22],
        "pelvis_rot": [18, 0, 0],
        "bones": {
            "spine": [22, 0, 0],
            "neck": [-14, 0, 0],
            "head": [-16, 0, 0],
            "thigh_L": [-58, 0, 0],
            "shin_L": [64, 0, 0],
            "thigh_R": [-18, 0, 0],
            "shin_R": [72, 0, 0],
            "upper_arm_L": [-48, 12, 18],
            "forearm_L": [-72, 0, 0],
            "upper_arm_R": [-28, -12, -14],
            "forearm_R": [-96, 0, 0],
        },
    },
    "lead-glass-freeze": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.20],
        "pelvis_rot": [15, 0, 0],
        "bones": {
            "spine": [18, 0, 0],
            "neck": [-12, 0, 0],
            "head": [-12, 0, 12],
            "thigh_L": [-48, 0, 0],
            "shin_L": [52, 0, 0],
            "thigh_R": [-10, 0, 0],
            "shin_R": [66, 0, 0],
            "upper_arm_L": [-36, 10, 16],
            "forearm_L": [-88, 0, 0],
            "upper_arm_R": [-24, -10, -14],
            "forearm_R": [-98, 0, 0],
        },
    },
    "lead-kneel-shotgun-aim": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.44],
        "pelvis_rot": [8, 0, 0],
        "bones": {
            "spine": [10, 0, -10],
            "neck": [-4, 0, 8],
            "head": [-6, 0, 4],
            "thigh_L": [-86, 0, 0],
            "shin_L": [92, 0, 0],
            "thigh_R": [12, 0, 0],
            "shin_R": [104, 0, 0],
            "upper_arm_L": [-72, 16, 22],
            "forearm_L": [-56, 0, 0],
            "upper_arm_R": [-46, -18, -16],
            "forearm_R": [-108, 0, 0],
        },
    },
    "witch-sobbing": {
        "rig": "witch",
        "pelvis_offset": [0.0, 0.0, -0.52],
        "pelvis_rot": [26, 0, 0],
        "bones": {
            "spine": [42, 0, 0],
            "neck": [22, 0, 0],
            "head": [24, 0, 0],
            "thigh_L": [-112, 8, 0],
            "shin_L": [132, 0, 0],
            "thigh_R": [-108, -8, 0],
            "shin_R": [130, 0, 0],
            "upper_arm_L": [-88, 18, 22],
            "forearm_L": [-118, 0, 0],
            "upper_arm_R": [-88, -18, -22],
            "forearm_R": [-118, 0, 0],
        },
    },
    "witch-alert-lift": {
        "rig": "witch",
        "pelvis_offset": [0.0, 0.0, -0.46],
        "pelvis_rot": [22, 0, 0],
        "bones": {
            "spine": [30, 0, 0],
            "neck": [-16, 0, 0],
            "head": [-18, 0, 14],
            "thigh_L": [-104, 10, 0],
            "shin_L": [122, 0, 0],
            "thigh_R": [-100, -10, 0],
            "shin_R": [120, 0, 0],
            "upper_arm_L": [-52, 28, 12],
            "forearm_L": [-74, 0, 0],
            "upper_arm_R": [-52, -28, -12],
            "forearm_R": [-74, 0, 0],
        },
    },
    "lead-barricade-shove": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.10],
        "pelvis_rot": [24, 0, 0],
        "bones": {
            "spine": [26, 0, 0],
            "neck": [-16, 0, 0],
            "head": [-12, 0, 0],
            "thigh_L": [-52, 0, 0],
            "shin_L": [46, 0, 0],
            "thigh_R": [28, 0, 0],
            "shin_R": [18, 0, 0],
            "upper_arm_L": [-96, 8, 8],
            "forearm_L": [-16, 0, 0],
            "upper_arm_R": [-96, -8, -8],
            "forearm_R": [-16, 0, 0],
        },
    },
    "lead-knife-slash": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.06],
        "pelvis_rot": [12, 0, -18],
        "bones": {
            "spine": [16, 0, 26],
            "neck": [-6, 0, -14],
            "head": [-6, 0, -8],
            "thigh_L": [-44, 0, 0],
            "shin_L": [42, 0, 0],
            "thigh_R": [26, 0, 0],
            "shin_R": [24, 0, 0],
            "upper_arm_L": [-32, 18, 12],
            "forearm_L": [-76, 0, 0],
            "upper_arm_R": [-108, -12, -10],
            "forearm_R": [-8, 0, 0],
        },
    },
    "lead-barrier-vault": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, 0.24],
        "pelvis_rot": [28, -24, 0],
        "bones": {
            "spine": [20, 14, 0],
            "neck": [-10, 0, 0],
            "head": [-12, 0, 0],
            "thigh_L": [-84, 20, 0],
            "shin_L": [86, 0, 0],
            "thigh_R": [-36, -18, 0],
            "shin_R": [72, 0, 0],
            "upper_arm_L": [-72, 22, 10],
            "forearm_L": [-12, 0, 0],
            "upper_arm_R": [-22, -26, -14],
            "forearm_R": [-68, 0, 0],
        },
    },
    "lead-pistol-brace": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.26],
        "pelvis_rot": [16, 0, 0],
        "bones": {
            "spine": [18, 0, 0],
            "neck": [-14, 0, 0],
            "head": [-12, 0, 0],
            "thigh_L": [-62, 0, 0],
            "shin_L": [68, 0, 0],
            "thigh_R": [18, 0, 0],
            "shin_R": [44, 0, 0],
            "upper_arm_L": [-86, 18, 22],
            "forearm_L": [-34, 0, 0],
            "upper_arm_R": [-86, -18, -22],
            "forearm_R": [-34, 0, 0],
        },
    },
    "lead-stair-climb": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.04],
        "pelvis_rot": [18, 0, 0],
        "bones": {
            "spine": [20, 0, 0],
            "neck": [-14, 0, 0],
            "head": [-12, 0, 0],
            "thigh_L": [-78, 0, 0],
            "shin_L": [76, 0, 0],
            "thigh_R": [24, 0, 0],
            "shin_R": [22, 0, 0],
            "upper_arm_L": [-64, 10, 12],
            "forearm_L": [-66, 0, 0],
            "upper_arm_R": [28, -10, -10],
            "forearm_R": [-78, 0, 0],
        },
    },
    "charger-bull-charge": {
        "rig": "charger",
        "pelvis_offset": [0.0, 0.0, -0.14],
        "pelvis_rot": [26, 0, 0],
        "bones": {
            "spine": [40, 0, -14],
            "neck": [-12, 0, 10],
            "head": [-16, 0, 12],
            "thigh_L": [-56, 0, 0],
            "shin_L": [44, 0, 0],
            "thigh_R": [34, 0, 0],
            "shin_R": [32, 0, 0],
            "upper_arm_L": [24, 24, 10],
            "forearm_L": [-58, 0, 0],
            "upper_arm_R": [-72, -16, -12],
            "forearm_R": [-46, 0, 0],
        },
    },
    "tank-slab-heave": {
        "rig": "tank",
        "pelvis_offset": [0.0, 0.0, -0.18],
        "pelvis_rot": [-10, 0, 0],
        "bones": {
            "spine": [-18, 0, 0],
            "neck": [10, 0, 0],
            "head": [8, 0, 0],
            "thigh_L": [-44, 14, 0],
            "shin_L": [48, 0, 0],
            "thigh_R": [20, -14, 0],
            "shin_R": [36, 0, 0],
            "upper_arm_L": [-152, 22, 14],
            "forearm_L": [-32, 0, 0],
            "upper_arm_R": [-152, -22, -14],
            "forearm_R": [-32, 0, 0],
        },
    },
    "lead-stair-descend": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.08],
        "pelvis_rot": [-4, 0, 0],
        "bones": {
            "spine": [6, 0, 0],
            "neck": [10, 0, 0],
            "head": [12, 0, 0],
            "thigh_L": [-28, 0, 0],
            "shin_L": [14, 0, 0],
            "thigh_R": [-12, 0, 0],
            "shin_R": [56, 0, 0],
            "upper_arm_L": [-18, 8, 8],
            "forearm_L": [-48, 0, 0],
            "upper_arm_R": [14, -8, -8],
            "forearm_R": [-36, 0, 0],
        },
    },
    "lead-hunter-knockdown": {
        "rig": "lead",
        "pelvis_offset": [0.0, 0.0, -0.76],
        "pelvis_rot": [-78, 0, 0],
        "bones": {
            "spine": [18, 0, 0],
            "neck": [24, 0, 0],
            "head": [18, 0, 0],
            "thigh_L": [-48, 10, 0],
            "shin_L": [64, 0, 0],
            "thigh_R": [-22, -10, 0],
            "shin_R": [42, 0, 0],
            "upper_arm_L": [-44, 18, 12],
            "forearm_L": [-72, 0, 0],
            "upper_arm_R": [-106, -12, -16],
            "forearm_R": [-84, 0, 0],
        },
    },
    "hunter-crouch-perch": {
        "rig": "hunter",
        "pelvis_offset": [0.0, 0.0, -0.46],
        "pelvis_rot": [34, 0, 0],
        "bones": {
            "spine": [36, 0, 0],
            "neck": [-26, 0, 0],
            "head": [-24, 0, 0],
            "thigh_L": [-108, 14, 0],
            "shin_L": [124, 0, 0],
            "thigh_R": [-98, -14, 0],
            "shin_R": [118, 0, 0],
            "upper_arm_L": [-68, 20, 12],
            "forearm_L": [-42, 0, 0],
            "upper_arm_R": [-68, -20, -12],
            "forearm_R": [-42, 0, 0],
        },
    },
    "hunter-pounce-launch": {
        "rig": "hunter",
        "pelvis_offset": [0.0, 0.0, 0.34],
        "pelvis_rot": [64, 0, 0],
        "bones": {
            "spine": [20, 0, 0],
            "neck": [-30, 0, 0],
            "head": [-26, 0, 0],
            "thigh_L": [32, 10, 0],
            "shin_L": [42, 0, 0],
            "thigh_R": [20, -10, 0],
            "shin_R": [54, 0, 0],
            "upper_arm_L": [-134, 18, 10],
            "forearm_L": [-26, 0, 0],
            "upper_arm_R": [-134, -18, -10],
            "forearm_R": [-26, 0, 0],
        },
    },
    "hunter-ground-pin": {
        "rig": "hunter",
        "pelvis_offset": [0.0, 0.0, -0.40],
        "pelvis_rot": [42, 0, 0],
        "bones": {
            "spine": [40, 0, 0],
            "neck": [-10, 0, 0],
            "head": [8, 0, 0],
            "thigh_L": [-96, 16, 0],
            "shin_L": [118, 0, 0],
            "thigh_R": [-84, -16, 0],
            "shin_R": [110, 0, 0],
            "upper_arm_L": [-92, 18, 14],
            "forearm_L": [-56, 0, 0],
            "upper_arm_R": [-92, -18, -14],
            "forearm_R": [-56, 0, 0],
        },
    },
    "smoker-rooftop-snare": {
        "rig": "smoker",
        "pelvis_offset": [0.0, 0.0, -0.06],
        "pelvis_rot": [10, 0, 0],
        "bones": {
            "spine": [34, 0, 0],
            "neck": [18, 0, 0],
            "head": [-16, 0, 0],
            "thigh_L": [-28, 0, 0],
            "shin_L": [32, 0, 0],
            "thigh_R": [16, 0, 0],
            "shin_R": [24, 0, 0],
            "upper_arm_L": [-52, 14, 10],
            "forearm_L": [-48, 0, 0],
            "upper_arm_R": [-38, -14, -10],
            "forearm_R": [-62, 0, 0],
        },
    },
}

# Standard camera rigs matching our series cinematography rules (zero 3/4 turnarounds!)
CAMERAS = {
    "side": {"pos": (4.2, 0.0, 1.0), "target": (0.0, 0.0, 0.92), "lens": 55},
    "front": {"pos": (0.0, -4.0, 1.05), "target": (0.0, 0.0, 0.95), "lens": 55},
    "back": {"pos": (0.0, 4.0, 1.05), "target": (0.0, 0.0, 0.95), "lens": 55},
    "ots": {"pos": (-1.1, 2.3, 1.48), "target": (0.2, -1.5, 1.05), "lens": 42},
    "low-angle": {"pos": (0.0, -3.2, 0.38), "target": (0.0, 0.0, 1.15), "lens": 38},
    "high-angle": {"pos": (0.0, -3.1, 2.75), "target": (0.0, 0.0, 0.72), "lens": 42},
}


def clamp_angles(bone_name, rot_deg):
    limits = JOINT_LIMITS.get(bone_name)
    if not limits:
        return list(rot_deg), []
    clamped = []
    warnings = []
    for axis, val, (lo, hi) in zip(("X", "Y", "Z"), rot_deg, limits):
        if val < lo or val > hi:
            warnings.append(f"{bone_name}.{axis}={val} clamped to [{lo}, {hi}]")
            clamped.append(max(lo, min(hi, val)))
        else:
            clamped.append(val)
    return clamped, warnings


def build_skeleton(profile, pose_data):
    """Build exact 3D joint positions via forward kinematics with anatomical limits."""
    p = RIG_PROFILES[profile]
    off = Vector(pose_data.get("pelvis_offset", [0, 0, 0]))
    pelvis_pos = Vector((0.0, 0.0, p["pelvis_z"])) + off
    pelvis_rot = Euler([math.radians(a) for a in pose_data.get("pelvis_rot", [0, 0, 0])], "XYZ").to_matrix()

    bones_spec = pose_data.get("bones", {})
    warnings = []

    def child_rot(parent_mat, name):
        raw = bones_spec.get(name, [0, 0, 0])
        clamped, w = clamp_angles(name, raw)
        warnings.extend(w)
        return parent_mat @ Euler([math.radians(a) for a in clamped], "XYZ").to_matrix()

    joints = {"pelvis": pelvis_pos}

    # Spine -> Chest -> Neck -> Head (+Z up, character faces -Y)
    spine_mat = child_rot(pelvis_rot, "spine")
    chest_pos = pelvis_pos + spine_mat @ Vector((0, 0, p["spine_len"]))
    neck_mat = child_rot(spine_mat, "neck")
    neck_pos = chest_pos + neck_mat @ Vector((0, 0, p["neck_len"]))
    head_mat = child_rot(neck_mat, "head")
    head_top = neck_pos + head_mat @ Vector((0, 0, p["head_len"]))
    joints.update({"chest": chest_pos, "neck": neck_pos, "head": (neck_pos + head_top) * 0.5, "head_top": head_top})

    # Legs (character faces -Y; Left is +X, Right is -X from character's view)
    for side, sx in (("L", 1.0), ("R", -1.0)):
        hip = pelvis_pos + pelvis_rot @ Vector((sx * p["hip_half_w"], 0, -0.04))
        thigh_mat = child_rot(pelvis_rot, f"thigh_{side}")
        knee = hip + thigh_mat @ Vector((0, 0, -p["thigh"]))
        shin_mat = child_rot(thigh_mat, f"shin_{side}")
        ankle = knee + shin_mat @ Vector((0, 0, -p["shin"]))
        toe = ankle + shin_mat @ Vector((0, -p["foot"], -0.03))
        joints[f"hip_{side}"] = hip
        joints[f"knee_{side}"] = knee
        joints[f"ankle_{side}"] = ankle
        joints[f"toe_{side}"] = toe

    # Arms
    for side, sx in (("L", 1.0), ("R", -1.0)):
        arm_scale = p.get(f"arm_scale_{side.lower()}", 1.0)
        shoulder = chest_pos + spine_mat @ Vector((sx * p["shoulder_half_w"], 0, -0.04))
        ua_mat = child_rot(spine_mat, f"upper_arm_{side}")
        elbow = shoulder + ua_mat @ Vector((0, 0, -p["upper_arm"] * arm_scale))
        fa_mat = child_rot(ua_mat, f"forearm_{side}")
        wrist = elbow + fa_mat @ Vector((0, 0, -p["forearm"] * arm_scale))
        joints[f"shoulder_{side}"] = shoulder
        joints[f"elbow_{side}"] = elbow
        joints[f"wrist_{side}"] = wrist

    # Ground shift so NO joint (feet, pelvis, back, or head when supine!) ever sinks below z = 0
    lowest_z = min(v.z for v in joints.values())
    if lowest_z < 0.0:
        lift = Vector((0, 0, -lowest_z))
        for k in joints:
            joints[k] = joints[k] + lift

    return joints, warnings


def setup_camera(cam_name):
    cfg = CAMERAS[cam_name]
    scene = bpy.context.scene
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    cam_data = bpy.data.cameras.new("PoseCam")
    cam_data.lens = cfg["lens"]
    cam_obj = bpy.data.objects.new("PoseCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    pos = Vector(cfg["pos"])
    target = Vector(cfg["target"])
    cam_obj.location = pos
    direction = (target - pos).normalized()
    cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.view_layer.update()
    return scene, cam_obj


def project_joints(scene, cam_obj, joints):
    W, H = 960, 540
    out = {}
    for name, vec in joints.items():
        co = world_to_camera_view(scene, cam_obj, vec)
        out[name] = {
            "x": round(co.x * W, 2),
            "y": round((1.0 - co.y) * H, 2),
            "depth": round(co.z, 3),
            "world": [round(vec.x, 3), round(vec.y, 3), round(vec.z, 3)],
        }
    return out


def segment_angle_deg(a, b):
    return round(math.degrees(math.atan2(b["y"] - a["y"], b["x"] - a["x"])) - 90.0, 2)


def write_svg(svg_path, projected, profile, cam_name, preset_name):
    p = RIG_PROFILES[profile]
    segments = [
        ("pelvis", "chest", p["torso_r"] * 220, "#23323b"),
        ("chest", "neck", p["limb_r"] * 170, "#23323b"),
        ("neck", "head", p["limb_r"] * 155, "#23323b"),
        ("hip_L", "knee_L", p["limb_r"] * 185, "#334752"),
        ("knee_L", "ankle_L", p["limb_r"] * 155, "#334752"),
        ("ankle_L", "toe_L", p["limb_r"] * 125, "#334752"),
        ("shoulder_L", "elbow_L", p["limb_r"] * 145 * p.get("arm_scale_l", 1.0), "#3c5461"),
        ("elbow_L", "wrist_L", p["limb_r"] * 125 * p.get("arm_scale_l", 1.0), "#3c5461"),
        ("hip_R", "knee_R", p["limb_r"] * 195, "#19262e"),
        ("knee_R", "ankle_R", p["limb_r"] * 165, "#19262e"),
        ("ankle_R", "toe_R", p["limb_r"] * 135, "#19262e"),
        ("shoulder_R", "elbow_R", p["limb_r"] * 155 * p.get("arm_scale_r", 1.0), "#101b21"),
        ("elbow_R", "wrist_R", p["limb_r"] * 135 * p.get("arm_scale_r", 1.0), "#101b21"),
    ]
    lines = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">',
        '<rect width="960" height="540" fill="#e9e4d9"/>',
        '<line x1="0" y1="480" x2="960" y2="480" stroke="#999184" stroke-width="2" stroke-dasharray="6 4"/>',
    ]
    # Draw segments sorted back-to-front by average depth
    ordered = sorted(segments, key=lambda s: -(projected[s[0]]["depth"] + projected[s[1]]["depth"]) * 0.5)
    for a, b, w, col in ordered:
        pa, pb = projected[a], projected[b]
        lines.append(
            f'<line x1="{pa["x"]}" y1="{pa["y"]}" x2="{pb["x"]}" y2="{pb["y"]}" '
            f'stroke="{col}" stroke-width="{round(w, 1)}" stroke-linecap="round"/>'
        )
    # Head circle
    hd = projected["head"]
    lines.append(f'<circle cx="{hd["x"]}" cy="{hd["y"]}" r="{round(p["head_r"] * 225, 1)}" fill="#19262e"/>')
    # Joint landmarks
    for name, pt in projected.items():
        if name in ("head_top",):
            continue
        lines.append(f'<circle cx="{pt["x"]}" cy="{pt["y"]}" r="4" fill="#ffb830" stroke="#101b21" stroke-width="1.2"/>')
    lines.append(
        f'<text x="20" y="30" font-family="monospace" font-size="16" fill="#101b21">'
        f'{preset_name} | rig={profile} | cam={cam_name} (Blender 3D->2D)</text>'
    )
    lines.append("</svg>\n")
    Path(svg_path).write_text("\n".join(lines), encoding="utf-8")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--preset", choices=sorted(PRESETS.keys()))
    ap.add_argument("--spec", help="Path to custom JSON pose spec")
    ap.add_argument("--camera", default="side", choices=sorted(CAMERAS.keys()))
    ap.add_argument("--out", required=True, help="Output path prefix (without extension)")
    args = ap.parse_args(argv)

    if args.spec:
        pose_data = json.loads(Path(args.spec).read_text(encoding="utf-8"))
        preset_name = Path(args.spec).stem
    else:
        assert args.preset, "Provide --preset or --spec"
        pose_data = PRESETS[args.preset]
        preset_name = args.preset

    profile = pose_data.get("rig", "lead")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    joints, warnings = build_skeleton(profile, pose_data)
    scene, cam_obj = setup_camera(args.camera)
    projected = project_joints(scene, cam_obj, joints)

    angles = {
        "torso": segment_angle_deg(projected["pelvis"], projected["chest"]),
        "thigh_L": segment_angle_deg(projected["hip_L"], projected["knee_L"]),
        "shin_L": segment_angle_deg(projected["knee_L"], projected["ankle_L"]),
        "thigh_R": segment_angle_deg(projected["hip_R"], projected["knee_R"]),
        "shin_R": segment_angle_deg(projected["knee_R"], projected["ankle_R"]),
        "upper_arm_L": segment_angle_deg(projected["shoulder_L"], projected["elbow_L"]),
        "forearm_L": segment_angle_deg(projected["elbow_L"], projected["wrist_L"]),
        "upper_arm_R": segment_angle_deg(projected["shoulder_R"], projected["elbow_R"]),
        "forearm_R": segment_angle_deg(projected["elbow_R"], projected["wrist_R"]),
    }

    out_prefix = Path(args.out)
    out_prefix.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "name": preset_name,
        "rig": profile,
        "camera": args.camera,
        "canvas": [960, 540],
        "warnings": warnings,
        "joints": projected,
        "angles_deg": angles,
    }
    json_path = out_prefix.with_suffix(".json")
    svg_path = out_prefix.with_suffix(".svg")
    json_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    write_svg(svg_path, projected, profile, args.camera, preset_name)
    print(f"Projected {preset_name} ({profile}, {args.camera}) -> {json_path} & {svg_path}")
    if warnings:
        print("Anatomical limit clamps:", "; ".join(warnings))


if __name__ == "__main__":
    main()
