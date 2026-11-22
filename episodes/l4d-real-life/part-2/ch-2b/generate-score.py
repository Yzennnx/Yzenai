"""Procedural intense horror score & Foley SFX generator for Chapter 2B (Night Weapon Run & The Pouncer).

100% local $0 synthesis using NumPy + SoundFile at 48 kHz stereo (82.0 s).
Synced to all 30 shots of Chapter 2B with hard silence cutouts before scares and reveals.
"""
from pathlib import Path

import numpy as np
import soundfile

RATE = 48000
ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"


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
    if i0 >= len(buf) or i0 < 0:
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


def drone(t, f0=46.0, detune=0.55):
    sig = (
        0.55 * np.sin(2 * np.pi * f0 * t)
        + 0.35 * np.sin(2 * np.pi * (f0 + detune) * t + 0.7)
        + 0.22 * np.sin(2 * np.pi * (f0 * 1.5) * t)
        + 0.14 * np.sin(2 * np.pi * (f0 * 0.5) * t)
    )
    return sig.astype(np.float32)


def horror_strings(t, base_hz=138.6):
    vib = 0.014 * np.sin(2 * np.pi * 0.42 * t)
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


def mystery_synth_chord(t):
    """Dark eerie gun-oil mystery pad (D minor add9)."""
    freqs = [73.42, 110.0, 146.83, 174.61, 220.0, 329.63]
    weights = [0.35, 0.28, 0.25, 0.22, 0.18, 0.12]
    sig = np.zeros_like(t)
    for i, (f, w) in enumerate(zip(freqs, weights)):
        shimmer = 1.0 + 0.004 * np.sin(2 * np.pi * (0.18 + 0.07 * i) * t + i)
        ph = 2 * np.pi * np.cumsum(f * shimmer) / RATE
        sig += w * (0.75 * np.sin(ph) + 0.25 * np.sin(2 * ph))
    return sig.astype(np.float32)


def boom(dur=1.5, f_start=96.0, f_end=28.0, seed=11):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    freq = f_start * ((f_end / f_start) ** (t / dur))
    ph = 2 * np.pi * np.cumsum(freq) / RATE
    n = lowpass_smooth(rng(seed).standard_normal(len(t)).astype(np.float32), 6)
    return (np.sin(ph) * np.exp(-2.8 * t) + 0.40 * n * np.exp(-5.0 * t)).astype(np.float32)


def impact_thud(dur=0.25, hz=85.0, noise_amt=0.5, seed=7):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    return (np.sin(2 * np.pi * hz * t) * np.exp(-18 * t) + noise_amt * n * np.exp(-32 * t)).astype(np.float32)


def heartbeat_hit():
    t = np.arange(int(0.32 * RATE), dtype=np.float32) / RATE
    lub = np.sin(2 * np.pi * 58 * t) * np.exp(-22 * t)
    dub = np.where(t > 0.13, np.sin(2 * np.pi * 48 * np.maximum(0, t - 0.13)) * np.exp(-24 * np.maximum(0, t - 0.13)), 0.0)
    return (0.9 * lub + 0.65 * dub).astype(np.float32)


def metallic_click(hz=680.0, dur=0.14, seed=19):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    return (
        0.65 * np.sin(2 * np.pi * hz * t) * np.exp(-38 * t)
        + 0.45 * np.sin(2 * np.pi * hz * 2.13 * t) * np.exp(-52 * t)
        + 0.30 * n * np.exp(-85 * t)
    ).astype(np.float32)


def iron_clang(hz=320.0, dur=0.55, seed=27):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    sig = (
        0.55 * np.sin(2 * np.pi * hz * t) * np.exp(-7.0 * t)
        + 0.42 * np.sin(2 * np.pi * (hz * 1.61) * t) * np.exp(-10.0 * t)
        + 0.30 * np.sin(2 * np.pi * (hz * 2.47) * t) * np.exp(-14.0 * t)
        + 0.22 * np.sin(2 * np.pi * (hz * 3.82) * t) * np.exp(-20.0 * t)
        + 0.40 * (n - lowpass_smooth(n, 4)) * np.exp(-42.0 * t)
    )
    return sig.astype(np.float32)


def scrape(dur=1.2, f_center=210.0, seed=31):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = lowpass_smooth(rng(seed).standard_normal(len(t)).astype(np.float32), 3)
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 8.5 * t)
    body = np.sin(2 * np.pi * f_center * t) * 0.25 + n * 0.75
    env = np.sin(np.pi * t / dur)
    return (body * mod * env).astype(np.float32)


def tin_claw_screech(dur=0.45, seed=37):
    """Sharp metallic claw scrape across corrugated tin awning."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    hi = n - lowpass_smooth(n, 3)
    f1 = 2150.0 + 780.0 * (t / dur) + 140.0 * np.sin(2 * np.pi * 42 * t)
    f2 = 3420.0 - 420.0 * (t / dur)
    ph1 = 2 * np.pi * np.cumsum(f1) / RATE
    ph2 = 2 * np.pi * np.cumsum(f2) / RATE
    sig = 0.50 * np.tanh(2.4 * np.sin(ph1)) + 0.32 * np.sin(ph2) + 0.40 * hi
    env = np.clip(t / 0.03, 0, 1) * np.clip((dur - t) / 0.06, 0, 1)
    return (sig * env).astype(np.float32)


def hunter_growl(dur=1.6, seed=41):
    """Low guttural Hunter crouch growl rising into predatory tension."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    freq = 125.0 + 95.0 * (t / dur) ** 1.5 + 22.0 * np.sin(2 * np.pi * 24 * t)
    ph = 2 * np.pi * np.cumsum(freq) / RATE
    body = np.tanh(2.8 * (0.65 * np.sin(ph) + 0.35 * np.sin(2.03 * ph)))
    rasp = lowpass_smooth(n, 2) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * t))
    env = np.clip(t / 0.25, 0, 1) * np.clip((dur - t) / 0.18, 0, 1)
    return ((0.65 * body + 0.35 * rasp) * env).astype(np.float32)


def hunter_shriek(dur=0.95, f_peak=1320.0, seed=43):
    """Piercing Hunter pounce/chase shriek."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    hi = n - lowpass_smooth(n, 4)
    freq = f_peak * (0.55 + 0.65 * np.exp(-2.6 * t) + 0.08 * np.sin(2 * np.pi * 36 * t))
    ph = 2 * np.pi * np.cumsum(freq) / RATE
    screech = np.tanh(3.2 * (0.6 * np.sin(ph) + 0.35 * np.sin(1.52 * ph) + 0.25 * np.sin(2.41 * ph)))
    env = np.clip(t / 0.04, 0, 1) * np.exp(-2.1 * t)
    return ((0.72 * screech + 0.28 * hi) * env).astype(np.float32)


def cardboard_rip(dur=0.55, seed=47):
    """Wet fibrous cardboard & duct-tape tear."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    band = lowpass_smooth(n, 1) - lowpass_smooth(n, 7)
    flutter = 0.55 + 0.45 * np.sin(2 * np.pi * (48 + 30 * t / dur) * t)
    env = np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.08, 0, 1)
    return (band * flutter * env * 1.6).astype(np.float32)


def blade_snap_ping(dur=0.85, seed=51):
    """Crisp metallic knife blade SNAP-PING!"""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    snap = (n - lowpass_smooth(n, 2)) * np.exp(-95.0 * t)
    ping = (
        0.55 * np.sin(2 * np.pi * 2480 * t) * np.exp(-5.5 * t)
        + 0.42 * np.sin(2 * np.pi * 3910 * t) * np.exp(-7.5 * t)
        + 0.28 * np.sin(2 * np.pi * 5860 * t) * np.exp(-11.0 * t)
    )
    return (0.85 * snap + 0.70 * ping).astype(np.float32)


def puddle_splash(dur=0.38, seed=59):
    """Wet boot slamming through black alley puddle."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    spray = (n - lowpass_smooth(n, 3)) * np.exp(-8.5 * t)
    thump = np.sin(2 * np.pi * 115 * t) * np.exp(-26.0 * t)
    return (0.65 * spray + 0.45 * thump).astype(np.float32)


def glass_crunch(dur=0.22, seed=63):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    hi = n - lowpass_smooth(n, 2)
    crackle = (np.abs(hi) > 1.1).astype(np.float32) * hi
    env = np.clip(t / 0.02, 0, 1) * np.exp(-12.0 * t)
    return ((0.45 * hi + 0.85 * crackle) * env).astype(np.float32)


def steel_door_slam(dur=0.90, seed=67):
    """Massive hollow heavy gray steel service door slam."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    low = np.sin(2 * np.pi * 64 * t) * np.exp(-6.5 * t)
    metal = (
        0.48 * np.sin(2 * np.pi * 210 * t) * np.exp(-9.0 * t)
        + 0.35 * np.sin(2 * np.pi * 347 * t) * np.exp(-12.5 * t)
        + 0.24 * np.sin(2 * np.pi * 588 * t) * np.exp(-16.0 * t)
    )
    burst = lowpass_smooth(n, 2) * np.exp(-22.0 * t)
    return (0.75 * low + 0.55 * metal + 0.50 * burst).astype(np.float32)


def exhale_breath(dur=1.45, seed=71):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    air = lowpass_smooth(n, 3) - lowpass_smooth(n, 14)
    env = np.clip(t / 0.18, 0, 1) * np.exp(-2.0 * t)
    tremor = 0.85 + 0.15 * np.sin(2 * np.pi * 6.5 * t)
    return (air * env * tremor).astype(np.float32)


def wind_bed(t, seed=53):
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    base = lowpass_smooth(n, 10)
    gust = 0.65 + 0.35 * np.sin(2 * np.pi * 0.18 * t + 0.4) * np.sin(2 * np.pi * 0.07 * t)
    return (base * gust).astype(np.float32)


def build_ch2b():
    dur = 82
    t = np.arange(dur * RATE, dtype=np.float32) / RATE
    buf = np.zeros((len(t), 2), dtype=np.float32)

    # 1. Cold stalking sub-bass drone:
    # Alley stalk (0.0..9.6s) -> EERIE SILENCE CUTOUT before tin claw scrape (9.6..13.2s)
    # -> Hunter reveal & combat/chase (13.4..52.2s) -> Barricade tension (53.2..64.2s)
    # -> PITCH-BLACK SILENCE (64.4..67.2s) -> Gun-oil mystery bass (74.8..81.92s)
    d = drone(t, 46.0, 0.55)
    d_env = (
        env_range(t, 0.0, 9.6, 0.4, 0.6) * 0.14
        + env_range(t, 13.4, 16.3, 0.3, 0.1) * 0.16
        + env_range(t, 16.4, 52.2, 0.15, 0.08) * 0.19
        + env_range(t, 53.2, 64.2, 0.2, 0.4) * 0.16
        + env_range(t, 74.8, 81.92, 1.4, 0.06) * 0.19
    )
    buf[:, 0] += d * d_env
    buf[:, 1] += d * d_env * 0.96

    # 2. Hollow alley wind (0.0..9.6s) & faint hollow workshop room tone (67.3..74.8s)
    wind = wind_bed(t, 53)
    w_env = env_range(t, 0.0, 9.6, 0.4, 0.8) * 0.08
    buf[:, 0] += wind * w_env * 0.9
    buf[:, 1] += wind * w_env * 1.1

    room = lowpass_smooth(rng(57).standard_normal(len(t)).astype(np.float32), 14)
    r_env = env_range(t, 67.3, 74.8, 0.5, 0.8) * 0.032
    buf[:, 0] += room * r_env
    buf[:, 1] += room * r_env

    # 3. 148 BPM frantic combat/chase drums & driving synth pulse (18.8..52.15s)
    # Brief tension drop at blade snap (32.7..33.6s) so SNAP-PING cuts cleanly!
    bpm = 148.0
    beat_dur = 60.0 / bpm
    bt = 18.8
    step = 0
    while bt < 52.15:
        if not (32.70 <= bt <= 33.55):
            # Heavy kick on 1 & 3, sharp metallic snare/tom on 2 & 4, driving 8th-note sub
            if step % 2 == 0:
                add_stereo(buf, bt, impact_thud(0.16, 62.0, 0.35, 100 + (step % 17)), 0.0, 0.24)
            else:
                add_stereo(buf, bt, impact_thud(0.11, 145.0, 0.72, 200 + (step % 17)), 0.12 if step % 4 == 1 else -0.12, 0.17)
            if bt >= 38.4:
                # Extra frantic 8th-note hi-hat/percussion during 5-angle escape sprint
                add_stereo(buf, bt + beat_dur * 0.5, metallic_click(1420, 0.04, 300 + (step % 13)), -0.18 if step % 2 == 0 else 0.18, 0.08)
        bt += beat_dur
        step += 1

    # Frantic dissonant horror strings during grapple & chase (18.8..52.1s, ducked on blade snap)
    st_l = horror_strings(t, 138.6)
    st_r = horror_strings(t, 139.5)
    s_env = (
        env_range(t, 18.8, 32.7, 0.6, 0.12) * 0.11
        + env_range(t, 36.2, 52.1, 0.4, 0.10) * 0.13
    )
    buf[:, 0] += st_l * s_env
    buf[:, 1] += st_r * s_env

    # 4. Quiet low cello hum on shredded cardboard realization (70.4..74.8s)
    cello = (
        0.55 * np.sin(2 * np.pi * 65.41 * t)
        + 0.35 * np.sin(2 * np.pi * 130.81 * t)
        + 0.20 * np.sin(2 * np.pi * 155.56 * t)
    ).astype(np.float32)
    c_env = env_range(t, 70.4, 74.8, 0.6, 0.8) * 0.10
    buf[:, 0] += cello * c_env
    buf[:, 1] += cello * c_env * 0.94

    # 5. Rising gun-oil mystery synth chord (74.8..81.92s) -> hard cut to black at 82.0s
    mys = mystery_synth_chord(t)
    m_env = env_range(t, 74.8, 81.92, 1.8, 0.06) * 0.16
    buf[:, 0] += mys * m_env
    buf[:, 1] += mys * m_env * 1.04

    # --- TIMED FOLEY & STORY SFX (Synced to all 30 shots of Ch 2B) ---

    # Shot 1 (0.0–3.0): Quiet iron ladder creak + soft rubber sole touch on wet asphalt
    add_stereo(buf, 0.45, scrape(0.75, 420, 10), -0.15, 0.14)
    add_stereo(buf, 1.45, impact_thud(0.09, 105, 0.30, 11), -0.05, 0.13)
    add_stereo(buf, 2.25, impact_thud(0.09, 112, 0.30, 12), 0.05, 0.13)

    # Shot 2 (3.0–5.6): Crunching broken glass under boot
    add_stereo(buf, 3.60, glass_crunch(0.24, 13), -0.10, 0.19)
    add_stereo(buf, 4.75, glass_crunch(0.20, 14), 0.12, 0.16)

    # Shot 3 (5.6–8.4): Cruiser trunk latch rattle & stubborn rusted groan
    add_stereo(buf, 6.10, metallic_click(620, 0.14, 15), 0.05, 0.22)
    add_stereo(buf, 6.45, scrape(0.90, 260, 16), 0.05, 0.21)
    add_stereo(buf, 7.55, metallic_click(580, 0.12, 17), 0.05, 0.20)

    # Shot 4 (8.4–11.2): Barely audible cautious alley footsteps
    for i, ft in enumerate([8.80, 9.55, 10.30]):
        add_stereo(buf, ft, impact_thud(0.08, 118, 0.25, 18 + i), -0.08 if i % 2 == 0 else 0.08, 0.10)

    # Shot 5 (11.2–13.4): SHARP METALLIC TIN CLAW SKRREECH (11.6s) -> 0.5s DEAD SILENCE!
    add_stereo(buf, 11.55, tin_claw_screech(0.45, 22), 0.18, 0.36)

    # Shot 6 (13.4–16.2): Low guttural Hunter growl (14.2s) building tension
    add_stereo(buf, 14.20, hunter_growl(1.85, 23), 0.22, 0.30)

    # Shot 7 (16.2–18.4): EXPLOSIVE HUNTER SHRIEK + HORROR STINGER (16.4s)
    add_stereo(buf, 16.40, hunter_shriek(1.05, 1420, 24), 0.15, 0.42)
    add_stereo(buf, 16.40, boom(1.10, 110, 32, 25), 0.0, 0.34)

    # Shot 8 (18.4–21.2): Heavy body slam on wet concrete (18.65s)
    add_stereo(buf, 18.65, boom(0.85, 92, 34, 26), 0.0, 0.38)
    add_stereo(buf, 18.75, puddle_splash(0.30, 27), -0.15, 0.18)

    # Shot 9 (21.2–23.6): Ferocious snapping bite + frantic snarling
    add_stereo(buf, 21.65, metallic_click(420, 0.09, 28), 0.10, 0.24)
    add_stereo(buf, 21.80, hunter_growl(0.95, 29), 0.12, 0.26)
    add_stereo(buf, 22.85, hunter_shriek(0.55, 1120, 30), -0.10, 0.24)

    # Shot 10 (23.6–26.8): Loud wet cardboard rip (24.2s) & duct-tape tear (25.4s)
    add_stereo(buf, 24.20, cardboard_rip(0.58, 31), 0.08, 0.34)
    add_stereo(buf, 25.40, cardboard_rip(0.52, 32), -0.06, 0.32)

    # Shot 11 (26.8–29.4): Sharp steel sheath draw (28.0s) + pounding heartbeat
    add_stereo(buf, 28.00, scrape(0.32, 1380, 33), -0.12, 0.26)
    add_stereo(buf, 28.25, metallic_click(1860, 0.16, 34), -0.10, 0.20)
    for hb in [27.0, 27.62, 28.24, 28.86]:
        add_stereo(buf, hb, heartbeat_hit(), 0.0, 0.22)

    # Shot 12 (29.4–32.4): Violent upward thrust impact + startled Hunter howl (30.6s)
    add_stereo(buf, 30.45, impact_thud(0.22, 95, 0.65, 35), 0.0, 0.32)
    add_stereo(buf, 30.60, hunter_shriek(1.10, 1520, 36), 0.10, 0.36)

    # Shot 13 (32.4–35.4): CRISP METALLIC BLADE SNAP-PING! (33.0s) + spinning steel clatter
    add_stereo(buf, 33.00, blade_snap_ping(0.88, 37), 0.05, 0.44)
    add_stereo(buf, 33.65, metallic_click(2640, 0.14, 38), 0.22, 0.20)
    add_stereo(buf, 33.92, metallic_click(3120, 0.11, 39), 0.28, 0.16)
    add_stereo(buf, 34.18, metallic_click(2850, 0.09, 40), 0.32, 0.12)

    # Shot 14 (35.4–38.4): Heavy shove kick + clattering aluminum trash cans (36.4s)
    add_stereo(buf, 35.80, impact_thud(0.22, 82, 0.60, 41), 0.0, 0.30)
    add_stereo(buf, 36.40, iron_clang(460, 0.62, 42), 0.30, 0.36)
    add_stereo(buf, 36.68, iron_clang(590, 0.45, 43), 0.35, 0.28)
    add_stereo(buf, 37.02, iron_clang(520, 0.35, 44), 0.32, 0.20)

    # Shot 15 (38.4–41.0): Frantic asphalt sprint steps
    for i, ft in enumerate([38.65, 39.02, 39.38, 39.75, 40.12, 40.50]):
        add_stereo(buf, ft, impact_thud(0.08, 132, 0.50, 45 + i), -0.10 if i % 2 == 0 else 0.10, 0.16)

    # Shot 16 (41.0–42.8): Loud wet puddle splashes (41.2–42.6s)
    for i, pt in enumerate([41.20, 41.58, 41.96, 42.38]):
        add_stereo(buf, pt, puddle_splash(0.34, 52 + i), -0.16 if i % 2 == 0 else 0.16, 0.32)

    # Shot 17 (42.8–45.4): Piercing Hunter leap-shriek closing fast from rear left
    add_stereo(buf, 43.55, hunter_shriek(0.95, 1380, 56), -0.45, 0.34)

    # Shot 18 (45.4–48.0): Heavy thudding brick wall-kick (46.0s) + howling snarl (46.5s)
    add_stereo(buf, 46.00, impact_thud(0.22, 74, 0.65, 57), -0.30, 0.34)
    add_stereo(buf, 46.50, hunter_growl(1.05, 58), -0.22, 0.30)

    # Shot 19 (48.0–50.6): Racing footsteps approaching steel door
    for i, ft in enumerate([48.20, 48.55, 48.90, 49.25, 49.60, 49.95, 50.30]):
        add_stereo(buf, ft, impact_thud(0.08, 138, 0.55, 60 + i), -0.08 if i % 2 == 0 else 0.08, 0.17)

    # Shot 20 (50.6–53.6): MASSIVE STEEL DOOR SLAM (52.4s) + HUNTER IMPACT BOOM! (53.0s)
    add_stereo(buf, 51.10, iron_clang(280, 0.35, 68), 0.10, 0.24)
    add_stereo(buf, 52.40, steel_door_slam(0.85, 69), 0.0, 0.48)
    add_stereo(buf, 53.00, boom(1.10, 88, 28, 70), -0.12, 0.46)
    add_stereo(buf, 53.02, iron_clang(240, 0.55, 71), -0.12, 0.32)

    # Shot 21 (53.6–56.4): Heavy iron deadbolt CLANK! (54.4s) + violent pounding on steel (55.2s)
    add_stereo(buf, 54.40, iron_clang(560, 0.38, 72), 0.05, 0.40)
    add_stereo(buf, 54.48, metallic_click(1120, 0.14, 73), 0.05, 0.28)
    add_stereo(buf, 55.25, boom(0.75, 84, 30, 74), -0.18, 0.36)
    add_stereo(buf, 55.27, iron_clang(250, 0.42, 75), -0.18, 0.24)

    # Shot 22 & 23 (56.4–61.8): Iron bench scrape on concrete (56.4–60.6s) & lock THUNK! (60.8s)
    add_stereo(buf, 56.45, scrape(1.45, 290, 76), 0.10, 0.28)
    add_stereo(buf, 57.85, boom(0.65, 80, 32, 77), -0.25, 0.28)
    add_stereo(buf, 58.15, scrape(1.30, 320, 78), 0.05, 0.26)
    add_stereo(buf, 59.45, scrape(1.20, 260, 79), -0.05, 0.28)
    add_stereo(buf, 60.80, steel_door_slam(0.55, 80), -0.10, 0.40)

    # Shot 24 (61.8–64.4): Two final massive muffled steel slams (62.2s, 63.2s) -> abrupt stop!
    add_stereo(buf, 62.20, boom(0.85, 82, 28, 81), -0.15, 0.42)
    add_stereo(buf, 62.22, iron_clang(235, 0.48, 82), -0.15, 0.26)
    add_stereo(buf, 63.20, boom(0.85, 78, 26, 83), -0.15, 0.44)
    add_stereo(buf, 63.22, iron_clang(220, 0.48, 84), -0.15, 0.28)

    # Shot 25 (64.4–67.2): Fading distant Hunter scrape/shriek (64.6s) -> PITCH-BLACK SILENCE (66.0s)!
    add_stereo(buf, 64.55, lowpass_smooth(scrape(0.55, 580, 85), 5), -0.35, 0.14)
    add_stereo(buf, 64.85, lowpass_smooth(hunter_shriek(0.75, 1180, 86), 7), -0.45, 0.12)

    # Shot 26 (67.2–70.0): Quiet trembling exhale (67.5s)
    add_stereo(buf, 67.50, exhale_breath(1.45, 87), 0.0, 0.22)

    # Shot 27 (70.0–73.0): Dry cardboard crinkle (70.8s)
    add_stereo(buf, 70.80, cardboard_rip(0.32, 88), 0.08, 0.16)

    # Shot 29 (75.8–78.8): Faint metallic brass casing ping (77.0s)
    add_stereo(buf, 77.00, metallic_click(2680, 0.28, 89), 0.20, 0.16)

    # Shot 30 (78.8–82.0): Deep mystery bass swell (80.6s) cutting cleanly to black at 82.0s
    add_stereo(buf, 80.60, boom(1.32, 74, 26, 90), 0.0, 0.38)
    # Clean hard cut to black over last 40ms
    fade_samples = int(0.04 * RATE)
    buf[-fade_samples:, :] *= np.linspace(1.0, 0.0, fade_samples, dtype=np.float32)[:, None]

    return np.clip(buf, -0.92, 0.92)


if __name__ == "__main__":
    ASSETS.mkdir(parents=True, exist_ok=True)
    audio = build_ch2b()
    out_path = ASSETS / "score.wav"
    soundfile.write(out_path, audio, RATE, subtype="PCM_16")
    print(f"Wrote {out_path} ({len(audio) / RATE:.1f}s)", flush=True)
