"""Procedural intense horror score & Foley SFX generator for Part 1 (Ch 1A, 1B, 1C).

100% local $0 synthesis using NumPy + SoundFile at 48 kHz stereo.
Designed to sit tightly under the Dark Horror Series Narrator with hard silence cutouts before scares.
"""
import sys
from pathlib import Path

import numpy as np
import soundfile

RATE = 48000
ROOT = Path(__file__).resolve().parent


def rng(seed):
    return np.random.default_rng(seed)


def env_range(t, start, end, fade_in=0.5, fade_out=0.5):
    e = np.zeros_like(t)
    mask = (t >= start) & (t <= end)
    if not np.any(mask):
        return e
    tm = t[mask]
    v = np.ones_like(tm)
    if fade_in > 0:
        v *= np.clip((tm - start) / fade_in, 0.0, 1.0)
    if fade_out > 0:
        v *= np.clip((end - tm) / fade_out, 0.0, 1.0)
    e[mask] = v
    return e


def add_stereo(buf, start, mono_sig, pan=0.0, gain=1.0):
    i0 = int(round(start * RATE))
    if i0 >= len(buf):
        return
    i1 = min(len(buf), i0 + len(mono_sig))
    sig = mono_sig[: i1 - i0] * gain
    l_g = np.cos((pan + 1.0) * np.pi / 4.0)
    r_g = np.sin((pan + 1.0) * np.pi / 4.0)
    buf[i0:i1, 0] += sig * l_g
    buf[i0:i1, 1] += sig * r_g


def lowpass_smooth(x, passes=4):
    y = x.copy()
    kernel = np.array([0.25, 0.5, 0.25], dtype=np.float32)
    for _ in range(passes):
        y = np.convolve(y, kernel, mode="same")
    return y


def drone(t, f0=52.0, detune=0.6):
    # Deep beating horror sub-bass + hollow fifth
    sig = (
        0.55 * np.sin(2 * np.pi * f0 * t)
        + 0.35 * np.sin(2 * np.pi * (f0 + detune) * t + 0.7)
        + 0.22 * np.sin(2 * np.pi * (f0 * 1.5) * t)
        + 0.14 * np.sin(2 * np.pi * (f0 * 0.5) * t)
    )
    return sig.astype(np.float32)


def horror_strings(t, base_hz=110.0):
    # Minor-second eerie bowed metallic cluster (very tense!)
    vib = 0.012 * np.sin(2 * np.pi * 0.35 * t)
    f1 = base_hz * (1.0 + vib)
    f2 = base_hz * 1.0595 * (1.0 - vib)  # minor 2nd clash!
    f3 = base_hz * 1.498 * (1.0 + 0.5 * vib)
    ph1 = 2 * np.pi * np.cumsum(f1) / RATE
    ph2 = 2 * np.pi * np.cumsum(f2) / RATE
    ph3 = 2 * np.pi * np.cumsum(f3) / RATE
    sig = (
        0.40 * np.sin(ph1) + 0.18 * np.sin(2 * ph1) + 0.08 * np.sin(3 * ph1)
        + 0.38 * np.sin(ph2) + 0.15 * np.sin(2 * ph2)
        + 0.28 * np.sin(ph3)
    )
    return sig.astype(np.float32)


def boom(dur=1.6, f_start=92.0, f_end=32.0):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    freq = f_start * ((f_end / f_start) ** (t / dur))
    ph = 2 * np.pi * np.cumsum(freq) / RATE
    n = lowpass_smooth(rng(11).standard_normal(len(t)).astype(np.float32), 6)
    return (np.sin(ph) * np.exp(-2.8 * t) + 0.35 * n * np.exp(-5.0 * t)).astype(np.float32)


def heartbeat_hit():
    t = np.arange(int(0.32 * RATE), dtype=np.float32) / RATE
    lub = np.sin(2 * np.pi * 58 * t) * np.exp(-22 * t)
    dub = np.where(t > 0.13, np.sin(2 * np.pi * 48 * np.maximum(0, t - 0.13)) * np.exp(-24 * np.maximum(0, t - 0.13)), 0.0)
    return (0.9 * lub + 0.65 * dub).astype(np.float32)


def impact_thud(dur=0.28, hz=85.0, noise_amt=0.5, seed=7):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    return (np.sin(2 * np.pi * hz * t) * np.exp(-18 * t) + noise_amt * n * np.exp(-32 * t)).astype(np.float32)


def metallic_click(hz=680.0, dur=0.12):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(19).standard_normal(len(t)).astype(np.float32)
    return (0.65 * np.sin(2 * np.pi * hz * t) * np.exp(-42 * t) + 0.45 * np.sin(2 * np.pi * hz * 2.13 * t) * np.exp(-55 * t) + 0.3 * n * np.exp(-90 * t)).astype(np.float32)


def scrape(dur=1.4, f_center=190.0, seed=31):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = lowpass_smooth(rng(seed).standard_normal(len(t)).astype(np.float32), 3)
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 7.5 * t)
    body = np.sin(2 * np.pi * f_center * t) * 0.25 + n * 0.75
    env = np.sin(np.pi * t / dur)
    return (body * mod * env).astype(np.float32)


def eas_alert(dur=1.4):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    # Classic tense dual-tone attention signal (853 Hz + 960 Hz)
    sig = 0.5 * np.sin(2 * np.pi * 853 * t) + 0.5 * np.sin(2 * np.pi * 960 * t)
    gate = ((t < 0.48) | ((t >= 0.62) & (t < 1.28))).astype(np.float32)
    return (sig * gate * 0.45).astype(np.float32)


def siren_bed(t):
    # Distant echoing wail
    freq = 640.0 + 210.0 * np.sin(2 * np.pi * 0.24 * t)
    ph = 2 * np.pi * np.cumsum(freq) / RATE
    s = 0.6 * np.sin(ph) + 0.2 * np.sin(2 * ph)
    return lowpass_smooth(s.astype(np.float32), 3)


def zombie_snarl(dur=0.85, base=155.0, seed=41):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    freq = base * (1.0 + 0.35 * np.sin(2 * np.pi * 19 * t) - 0.25 * (t / dur))
    ph = 2 * np.pi * np.cumsum(freq) / RATE
    growl = np.tanh(2.2 * np.sin(ph)) * 0.55 + lowpass_smooth(n, 2) * 0.45
    env = np.clip(t / 0.08, 0, 1) * np.exp(-2.4 * t)
    return (growl * env).astype(np.float32)


def build_ch1a():
    dur = 75
    t = np.arange(dur * RATE, dtype=np.float32) / RATE
    buf = np.zeros((len(t), 2), dtype=np.float32)

    # 1. Sub-bass dark room drone (drops cleanly at 19.1s exhale for 0.6s!)
    d = drone(t, 52.0, 0.55)
    d_env = env_range(t, 0.0, 19.05, 0.2, 0.15) * 0.16 + env_range(t, 19.55, 75.0, 0.5, 1.0) * 0.18
    buf[:, 0] += d * d_env
    buf[:, 1] += d * d_env * 0.96

    # 2. Eerie horror strings riser during lockdown reveal (6.6..19.0s) & window infected reveal (43.5..62.0s)
    st1 = horror_strings(t, 146.8)
    s_env = env_range(t, 6.6, 18.95, 2.2, 0.15) * 0.11 + env_range(t, 43.5, 62.0, 2.5, 2.5) * 0.13
    buf[:, 0] += st1 * s_env
    buf[:, 1] += horror_strings(t, 147.6) * s_env

    # 3. Cold tactical pulsing synth bass (19.6..43.2s) + tense dark pulse (62.5..75s)
    pulse = np.sin(2 * np.pi * 65.4 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (88 / 60) * t)) ** 4
    p_env = env_range(t, 19.6, 43.2, 1.0, 1.2) * 0.13 + env_range(t, 62.5, 75.0, 1.2, 0.8) * 0.12
    buf[:, 0] += pulse * p_env
    buf[:, 1] += pulse * p_env

    # 4. Distant city sirens (7.5..75s, louder at window 43.5..61.0s!)
    sir = siren_bed(t)
    sir_env = env_range(t, 7.5, 43.5, 2.0, 1.0) * 0.028 + env_range(t, 43.5, 61.0, 0.8, 1.5) * 0.068 + env_range(t, 61.0, 75.0, 0.5, 1.2) * 0.030
    buf[:, 0] += sir * sir_env * 0.7
    buf[:, 1] += sir * sir_env * 1.15

    # 5. Panic heartbeat (12.2..19.0s accelerating 92 -> 132 BPM) + subtle tinnitus
    hb_times = [12.2, 12.88, 13.54, 14.18, 14.80, 15.38, 15.92, 16.42, 16.90, 17.36, 17.82, 18.28, 18.72]
    for i, bt in enumerate(hb_times):
        add_stereo(buf, bt, heartbeat_hit(), 0.0, 0.22 + i * 0.014)
    tinnitus = np.sin(2 * np.pi * 3650 * t) * env_range(t, 15.6, 18.95, 0.6, 0.12) * 0.020
    buf[:, 0] += tinnitus
    buf[:, 1] += tinnitus

    # 6. Key Foley SFX (exact sync with 75s Ch 1A shot timeline!)
    # Game-over chime + controller drop thud (2.6s)
    t_ch = np.arange(int(0.9 * RATE), dtype=np.float32) / RATE
    add_stereo(buf, 0.15, (np.sin(2 * np.pi * 220 * t_ch) * np.exp(-3.5 * t_ch) + 0.5 * np.sin(2 * np.pi * 164.8 * t_ch) * np.exp(-2.8 * t_ch)), -0.1, 0.14)
    add_stereo(buf, 2.60, impact_thud(0.14, 190, 0.6, 3), 0.1, 0.22)
    # Phone vibrate on wood (4.00s) + EAS double-tone + sub-boom on POV cut (6.60s)
    t_vib = np.arange(int(0.85 * RATE), dtype=np.float32) / RATE
    vib = np.sin(2 * np.pi * 158 * t_vib) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t_vib)) * ((t_vib < 0.35) | (t_vib > 0.48))
    add_stereo(buf, 4.00, vib, 0.25, 0.18)
    add_stereo(buf, 4.35, eas_alert(1.35), 0.15, 0.16)
    add_stereo(buf, 6.60, boom(1.7, 90, 30), 0.0, 0.34)
    # Distant glass crash outside during front close-up head-turn (13.4s)
    add_stereo(buf, 13.40, impact_thud(0.45, 72, 0.8, 13), 0.5, 0.22)
    # Chair roll scrape (15.55s) + desk slam brace (16.45s)
    add_stereo(buf, 15.55, scrape(0.55, 220, 17), -0.15, 0.16)
    add_stereo(buf, 16.45, impact_thud(0.20, 110, 0.4, 21), 0.0, 0.20)
    # Deadbolt snap (26.2s = f629) + heavy bookshelf drag (28.8..32.6s) + thud flush against door (32.7s)
    add_stereo(buf, 26.20, metallic_click(740, 0.14), -0.3, 0.28)
    add_stereo(buf, 28.80, scrape(3.7, 145, 23), -0.25, 0.23)
    add_stereo(buf, 32.65, impact_thud(0.30, 72, 0.55, 29), -0.3, 0.30)
    # Fridge pop open (36.1s = f866)
    add_stereo(buf, 36.10, impact_thud(0.18, 130, 0.35, 31), 0.2, 0.20)
    # Window reveal sub-boom (49.0s) + special infected cues (Smoker cough 55.2s, Boomer gurgle 57.3s, Hunter shriek 59.1s)
    add_stereo(buf, 49.00, boom(1.5, 84, 30), 0.0, 0.28)
    add_stereo(buf, 55.20, zombie_snarl(0.9, 135, 41), 0.35, 0.19)
    add_stereo(buf, 57.30, zombie_snarl(0.75, 92, 43), -0.2, 0.18)
    add_stereo(buf, 59.10, zombie_snarl(0.85, 390, 47), 0.45, 0.17)
    # Drawer yank rattle (62.4s) + stainless kitchen knife steel ring (66.4s) + ending cliffhanger sub-boom (73.4s)
    add_stereo(buf, 62.40, scrape(0.65, 260, 51), 0.1, 0.20)
    add_stereo(buf, 66.40, metallic_click(1480, 0.38), 0.1, 0.26)
    add_stereo(buf, 73.40, boom(1.6, 78, 30), 0.0, 0.28)

    return np.clip(buf, -0.92, 0.92)


def build_ch1b():
    dur = 70
    t = np.arange(dur * RATE, dtype=np.float32) / RATE
    buf = np.zeros((len(t), 2), dtype=np.float32)

    # Sub-bass dark pulse during prep (0..27s), bare stealth dread (27..46s), TOTAL CUTOUT on phone drop (46.0..50.5s!), blackout & descent (50.5..70s)
    d = drone(t, 49.0, 0.5)
    d_env = (
        env_range(t, 0.0, 27.0, 0.4, 0.6) * 0.16
        + env_range(t, 27.0, 45.95, 0.6, 0.05) * 0.12
        + env_range(t, 50.5, 70.0, 0.3, 0.8) * 0.18
    )
    buf[:, 0] += d * d_env
    buf[:, 1] += d * d_env

    # Prep rhythmic pulse (0..26s)
    prep_p = np.sin(2 * np.pi * 62 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.55 * t)) ** 4
    pe = env_range(t, 1.0, 26.5, 1.0, 1.2) * 0.12
    buf[:, 0] += prep_p * pe
    buf[:, 1] += prep_p * pe

    # Tension strings during hallway stealth & lobby exit
    st = horror_strings(t, 138.6)
    se = env_range(t, 33.0, 45.95, 2.0, 0.05) * 0.10 + env_range(t, 58.0, 69.5, 1.5, 1.2) * 0.11
    buf[:, 0] += st * se
    buf[:, 1] += horror_strings(t, 139.5) * se

    # SFX: chalk tally, zipper, duct tape tears
    add_stereo(buf, 1.2, scrape(0.35, 620, 61), 0.1, 0.16)
    add_stereo(buf, 13.5, scrape(0.5, 920, 62), 0.0, 0.16)
    add_stereo(buf, 17.0, scrape(0.45, 780, 63), -0.1, 0.24)
    add_stereo(buf, 21.0, scrape(0.45, 810, 64), 0.1, 0.24)

    # Barricade slide + hinge creak + Apt 708 door banging!
    add_stereo(buf, 28.0, scrape(2.4, 140, 65), -0.2, 0.18)
    add_stereo(buf, 32.0, scrape(0.65, 520, 66), -0.1, 0.14)
    for bt in [34.5, 36.1, 37.7, 39.3, 40.9, 42.5, 44.1]:
        add_stereo(buf, bt, impact_thud(0.28, 72, 0.45, 67), 0.42, 0.28)

    # 46.0s (1:51 episode time): PHONE CLATTER IN SILENCE -> ZOMBIE HISS -> 50.5s BLACKOUT BOOM!
    add_stereo(buf, 46.0, metallic_click(520, 0.18), 0.0, 0.30)
    add_stereo(buf, 46.16, metallic_click(410, 0.12), 0.05, 0.18)
    add_stereo(buf, 48.0, zombie_snarl(0.85, 180, 69), 0.35, 0.24)
    add_stereo(buf, 50.5, boom(2.1, 120, 28), 0.0, 0.40)

    # Dead elevator click, hollow stair footsteps, lobby stone bounce, glass exit door
    add_stereo(buf, 56.5, metallic_click(890, 0.09), 0.2, 0.22)
    for ft in [58.4, 58.9, 59.4, 59.9, 60.4, 60.9]:
        add_stereo(buf, ft, impact_thud(0.11, 130, 0.35, 71), -0.1, 0.14)
    add_stereo(buf, 65.3, metallic_click(960, 0.12), -0.65, 0.26)
    add_stereo(buf, 65.52, metallic_click(840, 0.10), -0.7, 0.16)
    add_stereo(buf, 66.2, zombie_snarl(0.8, 150, 73), -0.45, 0.18)
    add_stereo(buf, 68.8, scrape(0.45, 340, 74), 0.3, 0.14)

    return np.clip(buf, -0.92, 0.92)


def build_ch1c():
    dur = 65
    t = np.arange(dur * RATE, dtype=np.float32) / RATE
    buf = np.zeros((len(t), 2), dtype=np.float32)

    # Silent eerie road (0..7.4s) -> MASSIVE SMOKER STINGER (7.4s) -> 142 BPM industrial chase (7.5..24.5s)
    # -> grocery stalking bass (24.5..38.8s) -> car alarm chaos surge (38.8..52s) -> cold dawn chord (52..65s)
    d = drone(t, 50.0, 0.7)
    d_env = env_range(t, 0.0, 7.2, 0.4, 0.1) * 0.11 + env_range(t, 24.5, 65.0, 0.8, 1.0) * 0.16
    buf[:, 0] += d * d_env
    buf[:, 1] += d * d_env

    # 142 BPM industrial chase drums (7.6..24.2s) & car alarm horde surge (39.0..52.0s)
    beat_len = 60.0 / 142.0
    for seg_start, seg_end, g in [(7.6, 24.2, 0.28), (39.0, 52.0, 0.24)]:
        bt = seg_start
        step = 0
        while bt < seg_end:
            add_stereo(buf, bt, impact_thud(0.18, 62 if step % 2 == 0 else 115, 0.45, 80 + (step % 5)), 0.0, g)
            if step % 2 == 1:
                add_stereo(buf, bt, metallic_click(420, 0.08), 0.25 if step % 4 == 1 else -0.25, g * 0.55)
            bt += beat_len
            step += 1

    # Dissonant chase strings + eerie dawn chord
    st = horror_strings(t, 155.5)
    se = env_range(t, 7.5, 24.5, 0.2, 1.0) * 0.14 + env_range(t, 38.8, 52.5, 0.3, 1.5) * 0.13
    buf[:, 0] += st * se
    buf[:, 1] += horror_strings(t, 156.8) * se

    # Haunting cold dawn minor chord (53..65s)
    dawn_c = (
        0.4 * np.sin(2 * np.pi * 110.0 * t)
        + 0.35 * np.sin(2 * np.pi * 130.81 * t)
        + 0.3 * np.sin(2 * np.pi * 164.81 * t)
        + 0.2 * np.sin(2 * np.pi * 246.94 * t)
    ).astype(np.float32)
    de = env_range(t, 52.5, 65.0, 2.2, 1.2) * 0.11
    buf[:, 0] += dawn_c * de
    buf[:, 1] += dawn_c * de

    # SFX: quiet road footsteps -> Smoker whip & stinger -> blade slash -> sprint
    for ft in [0.8, 1.5, 2.2, 2.9, 3.6, 4.3, 5.0, 5.7, 6.4]:
        add_stereo(buf, ft, impact_thud(0.09, 120, 0.35, 81), 0.0, 0.12)
    add_stereo(buf, 7.4, boom(1.4, 150, 32), 0.0, 0.42)
    add_stereo(buf, 7.45, scrape(0.32, 680, 82), 0.3, 0.28)
    add_stereo(buf, 14.5, scrape(0.28, 1180, 83), 0.0, 0.30)
    add_stereo(buf, 14.8, zombie_snarl(1.1, 240, 84), -0.35, 0.26)
    for ft in np.arange(16.5, 24.0, 0.34):
        add_stereo(buf, float(ft), impact_thud(0.09, 130, 0.45, 85), 0.0, 0.16)

    # Grocery glass groans, pebble tink, brick-on-car smash, piercing CAR ALARM!
    add_stereo(buf, 27.0, zombie_snarl(1.2, 125, 86), 0.4, 0.15)
    add_stereo(buf, 31.5, metallic_click(1120, 0.10), 0.3, 0.20)
    add_stereo(buf, 38.8, impact_thud(0.35, 95, 0.9, 87), -0.1, 0.38)
    add_stereo(buf, 38.85, metallic_click(1320, 0.25), -0.1, 0.28)
    # Rhythmic car alarm horn (39.1..58s, fading far left during loot & dawn exit!)
    t_horn = np.arange(int(0.26 * RATE), dtype=np.float32) / RATE
    horn = (0.55 * np.sin(2 * np.pi * 440 * t_horn) + 0.45 * np.sin(2 * np.pi * 554.37 * t_horn) + 0.25 * np.sin(2 * np.pi * 880 * t_horn)).astype(np.float32)
    horn *= np.clip(t_horn / 0.015, 0, 1) * np.clip((0.26 - t_horn) / 0.02, 0, 1)
    for ht in np.arange(39.1, 61.0, 0.62):
        gain = 0.22 if ht < 51.0 else max(0.03, 0.18 * (1.0 - (ht - 51.0) / 11.0))
        add_stereo(buf, float(ht), horn, -0.35 if ht < 51.0 else -0.7, gain)
    # Horde rush + cans + backpack zip
    add_stereo(buf, 45.2, impact_thud(0.32, 85, 0.75, 88), 0.4, 0.28)
    add_stereo(buf, 46.0, zombie_snarl(1.3, 140, 89), 0.2, 0.20)
    add_stereo(buf, 53.5, metallic_click(840, 0.14), 0.2, 0.18)
    add_stereo(buf, 57.0, scrape(0.55, 920, 90), 0.0, 0.18)

    return np.clip(buf, -0.92, 0.92)


if __name__ == "__main__":
    targets = sys.argv[1:] or ["ch-1a", "ch-1b", "ch-1c"]
    builders = {"ch-1a": build_ch1a, "ch-1b": build_ch1b, "ch-1c": build_ch1c}
    for name in targets:
        out_dir = ROOT / name / "assets"
        out_dir.mkdir(parents=True, exist_ok=True)
        audio = builders[name]()
        out_path = out_dir / "score.wav"
        soundfile.write(out_path, audio, RATE, subtype="PCM_16")
        print(f"Wrote {out_path} ({len(audio) / RATE:.1f}s)", flush=True)
