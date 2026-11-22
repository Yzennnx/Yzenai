"""Procedural intense horror score & Foley SFX generator for Part 2 (Ch 2A+).

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
    sig = (
        0.55 * np.sin(2 * np.pi * f0 * t)
        + 0.35 * np.sin(2 * np.pi * (f0 + detune) * t + 0.7)
        + 0.22 * np.sin(2 * np.pi * (f0 * 1.5) * t)
        + 0.14 * np.sin(2 * np.pi * (f0 * 0.5) * t)
    )
    return sig.astype(np.float32)


def horror_strings(t, base_hz=110.0):
    vib = 0.012 * np.sin(2 * np.pi * 0.35 * t)
    f1 = base_hz * (1.0 + vib)
    f2 = base_hz * 1.0595 * (1.0 - vib)
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


def metallic_click(hz=680.0, dur=0.12, seed=19):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    return (
        0.65 * np.sin(2 * np.pi * hz * t) * np.exp(-42 * t)
        + 0.45 * np.sin(2 * np.pi * hz * 2.13 * t) * np.exp(-55 * t)
        + 0.30 * n * np.exp(-90 * t)
    ).astype(np.float32)


def iron_clang(hz=340.0, dur=0.55, seed=27):
    """Heavy hollow iron fire-escape ladder clang with inharmonic overtones."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    sig = (
        0.55 * np.sin(2 * np.pi * hz * t) * np.exp(-7.5 * t)
        + 0.42 * np.sin(2 * np.pi * (hz * 1.61) * t) * np.exp(-10.5 * t)
        + 0.30 * np.sin(2 * np.pi * (hz * 2.47) * t) * np.exp(-14.0 * t)
        + 0.22 * np.sin(2 * np.pi * (hz * 3.82) * t) * np.exp(-20.0 * t)
        + 0.40 * (n - lowpass_smooth(n, 4)) * np.exp(-45.0 * t)
    )
    return sig.astype(np.float32)


def scrape(dur=1.4, f_center=190.0, seed=31):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = lowpass_smooth(rng(seed).standard_normal(len(t)).astype(np.float32), 3)
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 7.5 * t)
    body = np.sin(2 * np.pi * f_center * t) * 0.25 + n * 0.75
    env = np.sin(np.pi * t / dur)
    return (body * mod * env).astype(np.float32)


def wind_bed(t, seed=53):
    """Cold howling dawn/night alley wind."""
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    base = lowpass_smooth(n, 10)
    gust = 0.65 + 0.35 * np.sin(2 * np.pi * 0.18 * t + 0.4) * np.sin(2 * np.pi * 0.07 * t)
    return (base * gust).astype(np.float32)


def eas_alert(dur=0.95):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    sig = 0.5 * np.sin(2 * np.pi * 853 * t) + 0.5 * np.sin(2 * np.pi * 960 * t)
    gate = ((t < 0.36) | ((t >= 0.46) & (t < 0.88))).astype(np.float32)
    return (sig * gate * 0.42).astype(np.float32)


def phone_buzz_wood(dur=0.78, seed=61):
    """Loud double vibration of smartphone rattling against wooden floorboards."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = lowpass_smooth(rng(seed).standard_normal(len(t)).astype(np.float32), 2)
    motor = (
        0.55 * np.sin(2 * np.pi * 148 * t)
        + 0.35 * np.sin(2 * np.pi * 296 * t)
        + 0.25 * np.sin(2 * np.pi * 74 * t)
        + 0.30 * n
    )
    rattle = 0.65 + 0.35 * np.sin(2 * np.pi * 34 * t)
    gate = ((t < 0.30) | ((t >= 0.40) & (t < 0.74))).astype(np.float32)
    return (motor * rattle * gate).astype(np.float32)


def zombie_snarl(dur=0.85, base=155.0, seed=41):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    freq = base * (1.0 + 0.35 * np.sin(2 * np.pi * 19 * t) - 0.25 * (t / dur))
    ph = 2 * np.pi * np.cumsum(freq) / RATE
    growl = np.tanh(2.2 * np.sin(ph)) * 0.55 + lowpass_smooth(n, 2) * 0.45
    env = np.clip(t / 0.08, 0, 1) * np.exp(-2.4 * t)
    return (growl * env).astype(np.float32)


def exhale_breath(dur=1.45, seed=71):
    """Soft shaky relief exhale inside a quiet loft."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    air = lowpass_smooth(n, 3) - lowpass_smooth(n, 14)
    env = np.clip(t / 0.18, 0, 1) * np.exp(-2.0 * t)
    tremor = 0.85 + 0.15 * np.sin(2 * np.pi * 6.5 * t)
    return (air * env * tremor).astype(np.float32)


def sonar_ping(hz=1180.0, dur=0.55):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    sig = (0.7 * np.sin(2 * np.pi * hz * t) + 0.3 * np.sin(2 * np.pi * (hz * 2.0) * t)) * np.exp(-6.5 * t)
    return sig.astype(np.float32)


def build_ch2a():
    dur = 78
    t = np.arange(dur * RATE, dtype=np.float32) / RATE
    buf = np.zeros((len(t), 2), dtype=np.float32)

    # 1. Sub-bass horror drone:
    # Dawn urgency (0..26.65s) -> HARD TENSION DROP at loft relief (26.65..34.4s)
    # -> eerie dread on neck burn & bent knife (34.4..41.2s) -> quiet afternoon/dusk gap (41.2..51.0s)
    # -> HARD SILENCE before phone buzz (51.0..54.4s) -> broadcast tension & Apex Tower finale (54.4..77.95s)
    d = drone(t, 50.0, 0.55)
    d_env = (
        env_range(t, 0.0, 8.8, 0.3, 0.4) * 0.13
        + env_range(t, 8.8, 26.65, 0.25, 0.08) * 0.18
        + env_range(t, 34.4, 41.2, 1.0, 0.8) * 0.12
        + env_range(t, 54.4, 65.0, 0.4, 0.5) * 0.15
        + env_range(t, 65.0, 77.95, 0.8, 0.08) * 0.20
    )
    buf[:, 0] += d * d_env
    buf[:, 1] += d * d_env * 0.96

    # 2. Anxious pulse (0..8.8s) -> frantic climb pulse (11.6..26.5s) -> broadcast synth pulse (54.5..73.5s)
    pulse = np.sin(2 * np.pi * 64.0 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (94 / 60) * t)) ** 4
    fast_pulse = np.sin(2 * np.pi * 72.0 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (138 / 60) * t)) ** 4
    p_env = env_range(t, 0.2, 8.8, 0.6, 0.4) * 0.10 + env_range(t, 54.5, 73.5, 0.6, 1.0) * 0.11
    fp_env = env_range(t, 11.6, 26.5, 0.2, 0.10) * 0.16
    buf[:, 0] += pulse * p_env + fast_pulse * fp_env
    buf[:, 1] += pulse * p_env + fast_pulse * fp_env

    # 3. Cold dawn wind (0..11.5s), time-lapse wind sweep (44.8..50.6s), and night wind at shutter (62.8..71.5s)
    wind = wind_bed(t, 53)
    w_env = (
        env_range(t, 0.0, 11.5, 0.3, 1.0) * 0.09
        + env_range(t, 44.8, 50.6, 0.8, 0.6) * 0.07
        + env_range(t, 62.8, 71.5, 0.6, 1.2) * 0.08
    )
    buf[:, 0] += wind * w_env * 0.9
    buf[:, 1] += wind * w_env * 1.1

    # 4. Soft hollow dusty loft room tone after tension drop (26.8..34.2s)
    room = lowpass_smooth(rng(57).standard_normal(len(t)).astype(np.float32), 14)
    r_env = env_range(t, 26.8, 34.2, 0.4, 0.8) * 0.035
    buf[:, 0] += room * r_env
    buf[:, 1] += room * r_env

    # 5. Eerie cello note on Smoker neck burn (34.6..37.4s) + ominous low sub-note on bent blade (38.2..41.2s)
    cello = (
        0.55 * np.sin(2 * np.pi * 65.41 * t)
        + 0.35 * np.sin(2 * np.pi * 130.81 * t)
        + 0.20 * np.sin(2 * np.pi * 155.56 * t)
    ).astype(np.float32)
    c_env = env_range(t, 34.6, 37.5, 0.45, 0.8) * 0.12
    buf[:, 0] += cello * c_env
    buf[:, 1] += cello * c_env * 0.94

    sub_blade = np.sin(2 * np.pi * 41.2 * t).astype(np.float32)
    sb_env = env_range(t, 38.2, 41.2, 0.4, 0.6) * 0.13
    buf[:, 0] += sub_blade * sb_env
    buf[:, 1] += sub_blade * sb_env

    # 6. Swelling horror strings during ladder escape (15.5..26.4s) & Apex Tower beacon reveal (65.2..70.2s)
    st_l = horror_strings(t, 146.8)
    st_r = horror_strings(t, 147.7)
    s_env = (
        env_range(t, 15.5, 26.4, 1.5, 0.12) * 0.12
        + env_range(t, 65.2, 70.2, 1.2, 1.0) * 0.14
    )
    buf[:, 0] += st_l * s_env
    buf[:, 1] += st_r * s_env

    # 7. Deep rising brass cliffhanger swell (73.5..76.8s) into massive boom (76.8..77.95s)
    brass_f = 55.0 + 18.0 * np.clip((t - 73.5) / 3.3, 0.0, 1.0)
    brass_ph = 2 * np.pi * np.cumsum(brass_f) / RATE
    brass = np.tanh(1.8 * (0.55 * np.sin(brass_ph) + 0.35 * np.sin(2 * brass_ph) + 0.22 * np.sin(3 * brass_ph))).astype(np.float32)
    br_env = env_range(t, 73.5, 76.85, 2.4, 0.08) * 0.17
    buf[:, 0] += brass * br_env
    buf[:, 1] += brass * br_env

    # --- TIMED FOLEY & STORY SFX (Synced to all 24 shots of Ch 2A) ---

    # Shot 1 (0:00.0–0:03.6): Weary sneaker steps on dawn asphalt
    for i, ft in enumerate([0.55, 1.25, 1.95, 2.65, 3.30]):
        add_stereo(buf, ft, impact_thud(0.10, 124, 0.35, 10 + i), -0.05 if i % 2 == 0 else 0.05, 0.14)

    # Shot 2 (0:03.6–0:05.8): Hopeful metallic glint cue (0:04.2)
    add_stereo(buf, 4.20, metallic_click(2240, 0.30, 19), 0.20, 0.18)
    add_stereo(buf, 4.24, metallic_click(3360, 0.22, 20), 0.22, 0.10)

    # Shot 3 (0:05.8–0:08.8): Faint iron chain creak in dawn breeze (0:06.5)
    add_stereo(buf, 6.50, scrape(0.95, 520, 21), 0.15, 0.15)
    add_stereo(buf, 7.15, metallic_click(890, 0.14, 22), 0.18, 0.11)

    # Shot 4 (0:08.8–0:11.6): Wet dawn zombie shriek (0:09.5) + waking footsteps behind
    add_stereo(buf, 9.50, zombie_snarl(0.95, 260, 23), -0.45, 0.24)
    add_stereo(buf, 10.10, zombie_snarl(0.75, 190, 24), -0.35, 0.18)
    for i, ft in enumerate([10.35, 10.65, 10.95, 11.25]):
        add_stereo(buf, ft, impact_thud(0.09, 138, 0.50, 25 + i), -0.40, 0.15)

    # Shot 5 (0:11.6–0:13.8): Leap & loud metallic ladder drop CLANG-RATTLE (0:12.4)
    add_stereo(buf, 11.95, impact_thud(0.14, 110, 0.45, 30), 0.0, 0.18)
    add_stereo(buf, 12.40, iron_clang(320, 0.65, 31), 0.10, 0.38)
    add_stereo(buf, 12.56, iron_clang(480, 0.32, 32), 0.14, 0.22)
    add_stereo(buf, 12.74, metallic_click(760, 0.16, 33), 0.08, 0.18)

    # Shot 6 & 7 (0:13.8–0:18.2): Gritty iron grips (14.0–15.5) & fast boot-on-iron clangs (15.8–18.0)
    add_stereo(buf, 14.05, scrape(0.42, 420, 34), 0.0, 0.20)
    add_stereo(buf, 14.95, scrape(0.38, 460, 35), 0.05, 0.18)
    for i, ct in enumerate([15.85, 16.25, 16.65, 17.05, 17.45, 17.85]):
        add_stereo(buf, ct, iron_clang(390 + (i % 3) * 45, 0.22, 36 + i), -0.10 if i % 2 == 0 else 0.10, 0.26)

    # Shot 8 (0:18.2–0:20.6): Savage snarls & brick/iron claw scrapes below (18.5–20.4)
    add_stereo(buf, 18.45, impact_thud(0.28, 78, 0.65, 42), 0.0, 0.30)
    add_stereo(buf, 18.55, zombie_snarl(0.95, 225, 43), -0.25, 0.26)
    add_stereo(buf, 18.85, scrape(0.65, 620, 44), 0.15, 0.20)
    add_stereo(buf, 19.45, zombie_snarl(0.90, 175, 45), 0.30, 0.25)
    add_stereo(buf, 19.80, scrape(0.55, 580, 46), -0.15, 0.18)

    # Shot 9 (0:20.6–0:24.2): Heavy groaning iron hoist (21.0–23.2) + FINAL METALLIC LATCH CLANK (23.4)
    add_stereo(buf, 21.00, scrape(1.15, 240, 47), 0.0, 0.24)
    add_stereo(buf, 22.15, scrape(1.05, 280, 48), 0.05, 0.26)
    add_stereo(buf, 23.40, iron_clang(510, 0.45, 49), 0.0, 0.40)
    add_stereo(buf, 23.48, metallic_click(980, 0.14, 50), 0.0, 0.28)

    # Shot 10 (0:24.2–0:26.8): Wood window slam (24.85) + crisp brass latch CLICK (25.4)
    add_stereo(buf, 24.85, impact_thud(0.24, 96, 0.60, 51), 0.0, 0.34)
    add_stereo(buf, 25.40, metallic_click(860, 0.14, 52), 0.05, 0.30)

    # Shot 11 (0:26.8–0:30.6): Hard tension drop -> soft shaky relief exhale (26.85)
    add_stereo(buf, 26.85, exhale_breath(1.50, 54), 0.0, 0.24)

    # Shot 12 (0:30.6–0:34.0): Canvas backpack zip (31.2) & quiet can clinks on floorboards (32.2–33.5)
    add_stereo(buf, 31.20, scrape(0.55, 920, 55), -0.05, 0.18)
    add_stereo(buf, 32.20, metallic_click(940, 0.11, 56), -0.15, 0.16)
    add_stereo(buf, 32.85, metallic_click(820, 0.11, 57), 0.12, 0.15)
    add_stereo(buf, 33.40, metallic_click(1020, 0.10, 58), 0.05, 0.14)

    # Shot 14 (0:37.2–0:41.2): Hollow metallic blade ring (38.5)
    add_stereo(buf, 38.50, metallic_click(1680, 0.48, 59), 0.08, 0.24)

    # Shot 15 (0:41.2–0:44.4): Muffled daytime street screams & frantic distant runners (41.5–44.2)
    s1 = lowpass_smooth(zombie_snarl(0.95, 290, 60), 7)
    s2 = lowpass_smooth(zombie_snarl(0.85, 220, 61), 7)
    add_stereo(buf, 41.50, s1, 0.45, 0.18)
    add_stereo(buf, 42.90, s2, -0.35, 0.16)
    for i, ft in enumerate([41.9, 42.25, 42.6, 43.3, 43.65, 44.0]):
        add_stereo(buf, ft, lowpass_smooth(impact_thud(0.10, 120, 0.45, 62 + i), 6), 0.25, 0.12)

    # Shot 16 & 17 (0:44.4–0:51.0): Soft time-lapse clock ticks (45.0–50.2), stopping before phone buzz!
    for i, tt in enumerate([45.0, 45.8, 46.6, 47.4, 48.2, 49.0, 49.8]):
        add_stereo(buf, tt, metallic_click(1450 if i % 2 == 0 else 1180, 0.04, 68 + i), -0.10, 0.10)

    # Shot 18 (0:51.0–0:54.2): HARD SILENCE BREAKER — Loud wood phone vibration BZZZ-BZZZ (51.4) + EAS chime (52.0)!
    add_stereo(buf, 51.40, phone_buzz_wood(0.76, 75), 0.18, 0.36)
    add_stereo(buf, 52.00, eas_alert(0.92), 0.15, 0.24)

    # Shot 19 & 20 (0:54.2–1:01.8): Floorboard creak (54.5) + urgent sonar pings + 96 BPM heartbeat (55.0–61.6)
    add_stereo(buf, 54.50, scrape(0.35, 310, 76), -0.10, 0.18)
    for st_p in [57.20, 58.65, 60.10, 61.55]:
        add_stereo(buf, st_p, sonar_ping(1180, 0.52), 0.10, 0.16)
    hb = 55.0
    while hb <= 61.6:
        add_stereo(buf, hb, heartbeat_hit(), 0.0, 0.22)
        hb += 60.0 / 96.0

    # Shot 21 (1:01.8–1:05.2): Crisp wooden shutter louver creak (62.6)
    add_stereo(buf, 62.60, scrape(0.45, 480, 77), 0.20, 0.20)

    # Shot 22 (1:05.2–1:09.6): Apex Tower blinking red aviation beacon pulse (65.5, 67.0, 68.5)
    for bp in [65.50, 67.00, 68.50]:
        add_stereo(buf, bp, sonar_ping(660, 0.42), 0.25, 0.15)
    add_stereo(buf, 65.40, boom(1.8, 76, 30), 0.0, 0.26)

    # Shot 23 (1:09.6–1:13.4): Knife sheath slide (70.5) + heavy canvas strap cinch (72.1)
    add_stereo(buf, 70.50, scrape(0.32, 1240, 78), -0.08, 0.20)
    add_stereo(buf, 70.72, metallic_click(1520, 0.12, 79), -0.08, 0.15)
    add_stereo(buf, 72.10, scrape(0.48, 640, 80), 0.05, 0.22)
    add_stereo(buf, 72.65, metallic_click(740, 0.10, 81), 0.05, 0.18)

    # Shot 24 (1:13.4–1:18.0): Deep cliffhanger boom (76.8–77.95) cutting cleanly to black at 78.0
    add_stereo(buf, 76.80, boom(1.15, 86, 26), 0.0, 0.42)

    return np.clip(buf, -0.92, 0.92)


if __name__ == "__main__":
    targets = sys.argv[1:] or ["ch-2a"]
    builders = {"ch-2a": build_ch2a}
    for name in targets:
        out_dir = ROOT / name / "assets"
        out_dir.mkdir(parents=True, exist_ok=True)
        audio = builders[name]()
        out_path = out_dir / "score.wav"
        soundfile.write(out_path, audio, RATE, subtype="PCM_16")
        print(f"Wrote {out_path} ({len(audio) / RATE:.1f}s)", flush=True)
