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


def glass_shard_hit(freq_scale=1.0, dur=0.28, seed=91):
    """Crisp crystalline broken glass/ceramic vase impact on polished tile floor."""
    rng = np.random.default_rng(seed)
    n = int(dur * RATE)
    t = np.arange(n, dtype=np.float32) / RATE
    # High-Q inharmonic glass & ceramic modal partials
    modes = [
        (1620, 14.0, 0.36),
        (2390, 19.0, 0.34),
        (3480, 24.0, 0.28),
        (4820, 31.0, 0.22),
        (6340, 38.0, 0.16),
    ]
    sig = np.zeros(n, dtype=np.float32)
    for f, dec, amp in modes:
        sig += amp * np.sin(2 * np.pi * (f * freq_scale) * t) * np.exp(-dec * t)
    # Sharp ceramic crack transient (first 14ms)
    crack = rng.normal(0, 1, n).astype(np.float32)
    crack = crack - lowpass_smooth(crack, 6)
    sig += crack * np.exp(-140.0 * t) * 0.55
    return sig.astype(np.float32)


def glass_floor_slide(dur=1.70, seed=92):
    """Emphasized spinning/skittering glass shard sliding across hard lobby tiles."""
    rng = np.random.default_rng(seed)
    n = int(dur * RATE)
    t = np.arange(n, dtype=np.float32) / RATE
    # High-frequency crystalline glass-on-tile friction grit decelerating cleanly
    noise = rng.normal(0, 1, n).astype(np.float32)
    grit = lowpass_smooth(noise, 1) - lowpass_smooth(noise, 10)
    # Wobbling spinning contact envelope (fast rattle slowing to rest)
    wobble = 0.55 + 0.45 * np.sin(2 * np.pi * (16.0 - 7.5 * (t / dur)) * t)
    fade = np.minimum(t / 0.04, 1.0) * np.exp(-1.55 * t)
    sig = grit * wobble * fade * 0.32
    # Rapid-fire crystalline micro-tinks as jagged edges skip along the tile!
    tinks = [0.06, 0.16, 0.28, 0.42, 0.58, 0.77, 0.99, 1.24, 1.48]
    for idx, dt in enumerate(tinks):
        start = int(dt * RATE)
        chunk = glass_shard_hit(1.15 + (idx % 3) * 0.14, 0.11, seed + 10 + idx)
        end = min(n, start + len(chunk))
        sig[start:end] += chunk[: end - start] * (0.48 * (0.86 ** idx))
    return sig.astype(np.float32)


def build_ch1b():
    dur = 85
    t = np.arange(dur * RATE, dtype=np.float32) / RATE
    buf = np.zeros((len(t), 2), dtype=np.float32)

    # 1. Sub-bass dark drone: prep (0..22.8s) -> bare stealth dread (22.8..43.15s) -> TOTAL SILENCE DROPOUT (43.15..45.2s!)
    # -> crash-zoom dread (45.2..51.8s) -> stairwell, lobby glass lure & midnight exit (51.8..85s)
    d = drone(t, 49.0, 0.5)
    d_env = (
        env_range(t, 0.0, 22.8, 0.4, 0.5) * 0.16
        + env_range(t, 22.8, 43.15, 0.5, 0.04) * 0.11
        + env_range(t, 45.2, 51.75, 0.15, 0.05) * 0.17
        + env_range(t, 51.8, 76.7, 0.25, 0.12) * 0.16
        + env_range(t, 79.8, 85.0, 0.35, 0.9) * 0.17
    )
    buf[:, 0] += d * d_env
    buf[:, 1] += d * d_env

    # 2. Prep industrial pulse (0.8..22.0s)
    prep_p = np.sin(2 * np.pi * 62 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (86 / 60) * t)) ** 4
    pe = env_range(t, 0.8, 22.0, 1.0, 1.0) * 0.13
    buf[:, 0] += prep_p * pe
    buf[:, 1] += prep_p * pe

    # 3. Fluorescent hallway buzz (28.5..43.15s & 45.2..51.7s, dies abruptly on blackout!)
    hum = (0.65 * np.sin(2 * np.pi * 120 * t) + 0.35 * np.sin(2 * np.pi * 240 * t)).astype(np.float32)
    hum_env = env_range(t, 28.5, 43.15, 0.2, 0.03) * 0.018 + env_range(t, 45.2, 51.70, 0.05, 0.03) * 0.022
    buf[:, 0] += hum * hum_env
    buf[:, 1] += hum * hum_env

    # 4. Eerie horror strings during stealth, crash-zoom scare, stairwell, and lobby escape (ducked cleanly during glass throw!)
    st = horror_strings(t, 138.6)
    se = (
        env_range(t, 33.5, 43.15, 2.0, 0.04) * 0.10
        + env_range(t, 47.8, 51.75, 0.25, 0.05) * 0.16
        + env_range(t, 60.5, 76.5, 1.2, 0.25) * 0.10
        + env_range(t, 80.4, 84.6, 0.8, 1.0) * 0.12
    )
    buf[:, 0] += st * se
    buf[:, 1] += horror_strings(t, 139.5) * se

    # 5. Prep Foley: chalk scratch (1.6s), can clinks (11.0s), knife slide (13.4s), zipper (14.4s), duct tape rips (17.0s, 19.2s), pack cinch (21.2s)
    add_stereo(buf, 1.6, scrape(0.38, 620, 61), 0.1, 0.18)
    add_stereo(buf, 11.0, metallic_click(960, 0.10), -0.1, 0.15)
    add_stereo(buf, 12.0, metallic_click(880, 0.10), 0.1, 0.14)
    add_stereo(buf, 13.4, metallic_click(1420, 0.24), 0.05, 0.20)
    add_stereo(buf, 14.4, scrape(0.48, 940, 62), 0.0, 0.18)
    add_stereo(buf, 17.0, scrape(0.45, 780, 63), -0.1, 0.25)
    add_stereo(buf, 19.2, scrape(0.45, 810, 64), 0.1, 0.25)
    add_stereo(buf, 21.2, impact_thud(0.22, 95, 0.45, 65), 0.0, 0.18)

    # 6. Midnight barricade ease (23.2s), soft deadbolt click (27.0s), hinge creak (27.8s)
    add_stereo(buf, 23.2, scrape(2.4, 135, 66), -0.2, 0.16)
    add_stereo(buf, 27.0, metallic_click(740, 0.12), -0.2, 0.22)
    add_stereo(buf, 27.8, scrape(0.60, 520, 67), -0.1, 0.15)

    # 7. Apt 708 neighbor-door echoing THUD-THUD-THUD (30.8..42.0s) — STOPS DEAD when phone drops!
    for bt in [30.8, 32.4, 34.0, 35.6, 37.2, 38.8, 40.4, 42.0]:
        add_stereo(buf, bt, impact_thud(0.28, 72, 0.45, 68), 0.45, 0.30)

    # 8. PHONE CLATTER ON TILE (43.2s) -> TOTAL SILENCE -> ZOMBIE HISS (45.2s) -> CRASH-ZOOM THUMP (48.2s) -> POWER BLACKOUT BOOM (51.8s)!
    add_stereo(buf, 43.20, metallic_click(540, 0.18), 0.0, 0.32)
    add_stereo(buf, 43.36, metallic_click(420, 0.12), 0.06, 0.20)
    add_stereo(buf, 45.20, zombie_snarl(0.95, 185, 69), 0.35, 0.26)
    add_stereo(buf, 48.20, boom(1.2, 110, 34), 0.0, 0.34)
    for bt in [48.4, 48.88, 49.36, 49.84, 50.32, 50.80, 51.28]:
        add_stereo(buf, bt, heartbeat_hit(), 0.0, 0.24)
    # Fluorescent stutter + MASSIVE POWER-GRID TRANSFORMER SHUTDOWN BOOM (51.8s)!
    add_stereo(buf, 51.25, metallic_click(1200, 0.08), 0.0, 0.18)
    add_stereo(buf, 51.55, metallic_click(1200, 0.08), 0.0, 0.20)
    add_stereo(buf, 51.80, boom(2.2, 125, 26), 0.0, 0.42)
    add_stereo(buf, 53.10, zombie_snarl(0.85, 155, 70), -0.4, 0.20)

    # 9. Dead elevator clicks (58.4s, 59.3s) + echoing concrete walking steps descending stairs (60.8..66.0s)
    add_stereo(buf, 58.40, metallic_click(890, 0.09), 0.2, 0.22)
    add_stereo(buf, 59.30, metallic_click(890, 0.09), 0.2, 0.22)
    for i, ft in enumerate([60.85, 61.40, 61.95, 62.50, 63.05, 63.65, 64.20, 64.75, 65.30, 65.85]):
        add_stereo(buf, ft, impact_thud(0.11, 138, 0.35, 71 + i), -0.15 if i < 5 else 0.15, 0.17)

    # 10. 1F lobby reveal: zombie groans right (67.4s), brief panic heartbeat (70.1..71.1s), broken glass vase shard pickup clink (74.45s)!
    add_stereo(buf, 67.40, zombie_snarl(0.95, 142, 82), 0.55, 0.18)
    for bt in [70.15, 70.60, 71.05]:
        add_stereo(buf, bt, heartbeat_hit(), 0.0, 0.23)
    add_stereo(buf, 74.45, glass_shard_hit(1.18, 0.16, 83), 0.15, 0.22)

    # 11. EMPHASIZED GLASS VASE SHARD THROW: HARD IMPACT & BOUNCE #1 (76.96s) -> BOUNCE #2 (77.83s) -> LONG SPINNING FLOOR SLIDE (77.88..79.60s)!
    add_stereo(buf, 76.96, glass_shard_hit(0.96, 0.36, 91), -0.26, 0.44)
    add_stereo(buf, 77.05, glass_shard_hit(1.42, 0.18, 92), -0.34, 0.24)
    add_stereo(buf, 77.83, glass_shard_hit(1.10, 0.26, 93), -0.54, 0.36)
    slide = glass_floor_slide(1.72, 94)
    # Stereo pan the spinning glass slide progressively leftward (-0.54 -> -0.86)!
    s0 = int(77.88 * RATE)
    s1 = min(len(buf), s0 + len(slide))
    k = s1 - s0
    pan_curve = np.linspace(-0.54, -0.86, k, dtype=np.float32)
    buf[s0:s1, 0] += slide[:k] * (0.5 * (1.0 - pan_curve)) * 0.92
    buf[s0:s1, 1] += slide[:k] * (0.5 * (1.0 + pan_curve)) * 0.92
    # Startled infected snapping & shuffling left toward the loud skidding glass!
    add_stereo(buf, 78.20, zombie_snarl(0.90, 165, 95), 0.25, 0.22)
    add_stereo(buf, 79.35, zombie_snarl(0.85, 138, 96), -0.42, 0.18)

    # 12. Quiet glass exit door hush (81.8s) + foggy midnight street cliffhanger boom (83.5s)
    add_stereo(buf, 81.80, scrape(0.55, 320, 97), 0.3, 0.15)
    add_stereo(buf, 83.50, boom(1.4, 72, 28), 0.0, 0.24)

    return np.clip(buf, -0.92, 0.92)


def build_ch1c():
    dur = 102
    t = np.arange(dur * RATE, dtype=np.float32) / RATE
    buf = np.zeros((len(t), 2), dtype=np.float32)

    # 1. Sub-bass dark drone: steady street walk (0..9.6s) -> cough silence dropout (9.6..14.0s)
    # -> Smoker drag & sprint (14.2..42.2s) -> grocery stalking (42.4..57.0s) -> alarm (57.2..81.4s)
    # -> hours-long exhausted midnight wandering & cold dawn finale (81.4..102.0s)
    d = drone(t, 48.0, 0.65)
    d_env = (
        env_range(t, 0.0, 9.6, 0.4, 0.12) * 0.11
        + env_range(t, 14.2, 42.2, 0.15, 0.6) * 0.15
        + env_range(t, 42.4, 57.0, 0.6, 0.10) * 0.14
        + env_range(t, 57.2, 81.2, 0.15, 0.9) * 0.16
        + env_range(t, 81.4, 102.0, 0.6, 1.0) * 0.14
    )
    buf[:, 0] += d * d_env
    buf[:, 1] += d * d_env

    # 2. Corner 24H MARKET neon buzz (0..9.4s & 42.4..56.8s)
    buzz = (0.6 * np.sin(2 * np.pi * 120 * t) + 0.4 * np.sin(2 * np.pi * 240 * t)).astype(np.float32)
    be = env_range(t, 0.0, 9.4, 0.5, 0.2) * 0.014 + env_range(t, 42.4, 56.8, 0.4, 0.2) * 0.016
    buf[:, 0] += buzz * be
    buf[:, 1] += buzz * be

    # 3. 142 BPM Industrial Chase Drums: Smoker drag, slash & sprint (14.6..42.0s) + Car alarm horde chaos (57.4..72.2s)!
    beat_len = 60.0 / 142.0
    for seg_start, seg_end, g in [(14.6, 42.0, 0.27), (57.4, 72.2, 0.22)]:
        bt = seg_start
        step = 0
        while bt < seg_end:
            add_stereo(buf, bt, impact_thud(0.18, 60 if step % 2 == 0 else 112, 0.45, 80 + (step % 5)), 0.0, g)
            if step % 2 == 1:
                add_stereo(buf, bt, metallic_click(430, 0.08), 0.25 if step % 4 == 1 else -0.25, g * 0.52)
            bt += beat_len
            step += 1

    # 4. Dissonant chase horror strings during Smoker ambush & horde stampede
    st = horror_strings(t, 155.5)
    se = (
        env_range(t, 14.2, 42.0, 0.2, 0.9) * 0.13
        + env_range(t, 57.4, 72.2, 0.3, 1.2) * 0.12
    )
    buf[:, 0] += st * se
    buf[:, 1] += horror_strings(t, 156.8) * se

    # 5. Cold haunting pale-gray dawn minor9 chord swelling gradually across late-night search -> dawn cliffhanger (86..102s)
    dawn_c = (
        0.40 * np.sin(2 * np.pi * 110.0 * t)
        + 0.34 * np.sin(2 * np.pi * 130.81 * t)
        + 0.28 * np.sin(2 * np.pi * 164.81 * t)
        + 0.20 * np.sin(2 * np.pi * 246.94 * t)
    ).astype(np.float32)
    de = env_range(t, 85.0, 94.5, 2.5, 1.0) * 0.06 + env_range(t, 94.0, 102.0, 1.8, 0.9) * 0.12
    buf[:, 0] += dawn_c * de
    buf[:, 1] += dawn_c * de

    # 6. Steady upright street walk footsteps (0.6..6.5s) -> Wet Smoker rooftop cough (9.1s) -> Whip-crack tongue lash (14.2s)!
    for ft in [0.65, 1.25, 1.85, 2.45, 3.05, 3.65, 4.25, 4.85, 5.45, 6.05]:
        add_stereo(buf, ft, impact_thud(0.09, 128, 0.35, 81), 0.0, 0.14)
    add_stereo(buf, 9.10, zombie_snarl(0.65, 195, 82), 0.25, 0.24)
    add_stereo(buf, 9.75, zombie_snarl(0.45, 210, 83), 0.25, 0.18)
    # Explosive Smoker whip-crack + massive horror stinger (14.2s) + relentless asphalt heel-skid drag (15.2..19.5s)!
    add_stereo(buf, 14.20, boom(1.4, 150, 30), 0.0, 0.42)
    add_stereo(buf, 14.22, scrape(0.32, 760, 84), 0.25, 0.30)
    add_stereo(buf, 15.20, scrape(1.4, 410, 85), -0.1, 0.22)
    add_stereo(buf, 17.20, scrape(1.2, 430, 85), 0.1, 0.20)
    # Crash-zoom sub-thump on knife grip (23.2s)
    add_stereo(buf, 23.20, boom(0.95, 112, 34), 0.0, 0.32)

    # 7. HERO STRAIGHT-ARM SLASH (27.3..28.0s): blade whoosh + fibrous slice + METALLIC BLADE BEND PING + green spore hiss!
    add_stereo(buf, 27.25, scrape(0.24, 1080, 86), 0.1, 0.26)
    add_stereo(buf, 27.62, scrape(0.28, 1480, 87), 0.0, 0.34)
    add_stereo(buf, 27.68, metallic_click(2180, 0.44), 0.05, 0.30)
    add_stereo(buf, 27.85, zombie_snarl(1.15, 235, 88), -0.35, 0.26)

    # 8. Desperate full-speed sprint footsteps (35.2..42.1s)
    for ft in np.arange(35.3, 42.1, 0.31):
        add_stereo(buf, float(ft), impact_thud(0.09, 134, 0.45, 89), 0.0, 0.16)

    # 9. Grocery horde groans (44.5s), weak useless pebble tap (49.8s), glint chime on sedan eye-dart (52.4s)
    add_stereo(buf, 44.50, zombie_snarl(1.3, 122, 90), 0.35, 0.17)
    add_stereo(buf, 49.80, glass_shard_hit(1.35, 0.12, 91), 0.25, 0.18)
    add_stereo(buf, 52.40, metallic_click(1960, 0.18), -0.25, 0.15)

    # 10. HEAVY ROCK WINDSHIELD CRASH (57.2s) -> BLARING CAR ALARM (57.5..81.4s)!
    add_stereo(buf, 57.20, impact_thud(0.36, 88, 0.90, 92), -0.15, 0.42)
    add_stereo(buf, 57.24, glass_shard_hit(0.92, 0.42, 93), -0.15, 0.38)
    add_stereo(buf, 57.34, glass_shard_hit(1.35, 0.24, 94), -0.20, 0.26)
    t_horn = np.arange(int(0.25 * RATE), dtype=np.float32) / RATE
    horn = (0.55 * np.sin(2 * np.pi * 440 * t_horn) + 0.45 * np.sin(2 * np.pi * 554.37 * t_horn) + 0.24 * np.sin(2 * np.pi * 880 * t_horn)).astype(np.float32)
    horn *= np.clip(t_horn / 0.014, 0, 1) * np.clip((0.25 - t_horn) / 0.02, 0, 1)
    for ht in np.arange(57.5, 81.4, 0.60):
        if ht < 72.2:
            gain, pan = 0.22, -0.35
        elif ht < 79.2:
            gain, pan = 0.09, -0.68
        else:
            gain, pan = max(0.03, 0.09 * (1.0 - (ht - 79.2) / 2.2)), -0.78
        add_stereo(buf, float(ht), horn, pan, gain)

    # 11. Athletic dumpster vault palm slap (60.65s) & landing drop (62.05s) + Horde stampede (65.2..71.8s)!
    add_stereo(buf, 60.65, impact_thud(0.16, 155, 0.55, 95), 0.1, 0.26)
    add_stereo(buf, 62.05, impact_thud(0.18, 96, 0.45, 96), 0.1, 0.22)
    for idx, st_t in enumerate(np.arange(65.2, 71.8, 0.24)):
        pan_r = 0.72 - 1.44 * ((st_t - 65.2) / 6.6)
        add_stereo(buf, float(st_t), impact_thud(0.11, 118 + (idx % 3) * 14, 0.55, 97 + (idx % 4)), float(pan_r), 0.20)
    add_stereo(buf, 66.00, zombie_snarl(1.3, 145, 101), 0.40, 0.20)
    add_stereo(buf, 69.00, zombie_snarl(1.2, 165, 102), -0.35, 0.20)

    # 12. Supermarket raid foley: cans (73.4s, 74.2s), tape grab (75.8s), heavy pack zip (78.0s)
    add_stereo(buf, 73.40, metallic_click(920, 0.12), 0.15, 0.18)
    add_stereo(buf, 74.20, metallic_click(840, 0.12), -0.10, 0.17)
    add_stereo(buf, 75.80, scrape(0.32, 760, 103), 0.10, 0.18)
    add_stereo(buf, 78.00, scrape(0.55, 940, 104), 0.0, 0.20)

    # 13. Post-raid shelter-search montage foley (84.2..95.0s): locked door rattle (85.6s), distant stray moan (88.2s), slow tired footsteps -> final dawn boom (100.3s)!
    for ft in [84.6, 85.3, 86.0, 87.4, 88.1, 88.8, 90.4, 91.2, 92.0, 92.8, 93.6, 94.4]:
        add_stereo(buf, ft, impact_thud(0.09, 120, 0.35, 105), 0.0, 0.12)
    add_stereo(buf, 85.55, metallic_click(520, 0.12), 0.25, 0.16)
    add_stereo(buf, 85.72, metallic_click(490, 0.10), 0.25, 0.14)
    add_stereo(buf, 88.15, zombie_snarl(1.1, 130, 106), 0.55, 0.13)
    add_stereo(buf, 100.30, boom(1.6, 74, 28), 0.0, 0.28)

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
