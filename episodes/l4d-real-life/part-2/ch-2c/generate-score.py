"""Procedural horror score & tactile Foley SFX generator for Chapter 2C (The Gunsmith Jackpot).

100% local $0 synthesis using NumPy + SoundFile at 48 kHz stereo (82.0 s).
Synced to all 29 interactive shots of Chapter 2C with clean score ducks for hero prop SFX
(flashlight click, brass casing tink-roll, brass lock SNAP, total dropout on shutter scrape,
6-shell loading cadence, 9mm mag clack, leather glove cinch, and iconic pump-shotgun CHK-CHK).
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


def drone(t, f0=44.0, detune=0.45):
    sig = (
        0.55 * np.sin(2 * np.pi * f0 * t)
        + 0.35 * np.sin(2 * np.pi * (f0 + detune) * t + 0.7)
        + 0.22 * np.sin(2 * np.pi * (f0 * 1.5) * t)
        + 0.14 * np.sin(2 * np.pi * (f0 * 0.5) * t)
    )
    return sig.astype(np.float32)


def mystery_strings(t):
    """Warm gun-oil intrigue strings (D minor add9 pad with slow bowing vibrato)."""
    freqs = [73.42, 110.0, 146.83, 174.61, 220.0, 329.63]
    weights = [0.34, 0.28, 0.26, 0.22, 0.18, 0.12]
    sig = np.zeros_like(t)
    for i, (f, w) in enumerate(zip(freqs, weights)):
        vib = 1.0 + 0.005 * np.sin(2 * np.pi * (0.22 + 0.06 * i) * t + i * 0.8)
        ph = 2 * np.pi * np.cumsum(f * vib) / RATE
        sig += w * (0.72 * np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph))
    return sig.astype(np.float32)


def tactical_brass(t, base_hz=73.42):
    """Stepped dark tactical horn/brass swell (D minor fifth + octave)."""
    ph1 = 2 * np.pi * base_hz * t
    ph2 = 2 * np.pi * (base_hz * 1.498) * t
    ph3 = 2 * np.pi * (base_hz * 2.0) * t
    raw = (
        0.52 * np.sin(ph1) + 0.28 * np.sin(2 * ph1) + 0.14 * np.sin(3 * ph1)
        + 0.34 * np.sin(ph2) + 0.16 * np.sin(2 * ph2)
        + 0.22 * np.sin(ph3)
    )
    return np.tanh(1.35 * raw).astype(np.float32)


def orchestral_horror_strings(t, base_hz=146.83):
    """Swelling ominous-heroic minor strings for the midnight skyline finale."""
    vib = 0.011 * np.sin(2 * np.pi * 0.38 * t)
    f1 = base_hz * (1.0 + vib)
    f2 = base_hz * 1.1892 * (1.0 - vib)  # minor third
    f3 = base_hz * 1.4983 * (1.0 + 0.5 * vib)  # fifth
    f4 = base_hz * 2.0 * (1.0 - 0.5 * vib)
    ph1 = 2 * np.pi * np.cumsum(f1) / RATE
    ph2 = 2 * np.pi * np.cumsum(f2) / RATE
    ph3 = 2 * np.pi * np.cumsum(f3) / RATE
    ph4 = 2 * np.pi * np.cumsum(f4) / RATE
    sig = (
        0.38 * np.sin(ph1) + 0.16 * np.sin(2 * ph1)
        + 0.34 * np.sin(ph2) + 0.14 * np.sin(2 * ph2)
        + 0.30 * np.sin(ph3) + 0.12 * np.sin(2 * ph3)
        + 0.20 * np.sin(ph4)
    )
    return sig.astype(np.float32)


def boom(dur=1.4, f_start=92.0, f_end=26.0, seed=11):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    freq = f_start * ((f_end / f_start) ** (t / dur))
    ph = 2 * np.pi * np.cumsum(freq) / RATE
    n = lowpass_smooth(rng(seed).standard_normal(len(t)).astype(np.float32), 6)
    return (np.sin(ph) * np.exp(-2.6 * t) + 0.38 * n * np.exp(-4.8 * t)).astype(np.float32)


def impact_thud(dur=0.22, hz=82.0, noise_amt=0.45, seed=7):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    return (np.sin(2 * np.pi * hz * t) * np.exp(-18 * t) + noise_amt * n * np.exp(-32 * t)).astype(np.float32)


def breath_cycle(dur=1.15, seed=13):
    """Close-mic heavy cautious breathing pulse in dark workshop."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    air = lowpass_smooth(n, 3) - lowpass_smooth(n, 13)
    env = np.sin(np.pi * t / dur) ** 1.6
    return (air * env * 1.4).astype(np.float32)


def flashlight_click(dur=0.07, hz=2450.0, seed=17):
    """Crisp tactile phone/flashlight switch click."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    snap = (n - lowpass_smooth(n, 2)) * np.exp(-140.0 * t)
    body = (
        0.65 * np.sin(2 * np.pi * hz * t) * np.exp(-85.0 * t)
        + 0.45 * np.sin(2 * np.pi * (hz * 1.62) * t) * np.exp(-110.0 * t)
    )
    return (0.75 * snap + 0.65 * body).astype(np.float32)


def brass_casing_tink(dur=0.28, hz=4180.0, seed=21):
    """Crystalline spent brass shell casing ping on concrete."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    hit = (n - lowpass_smooth(n, 2)) * np.exp(-160.0 * t)
    ring = (
        0.58 * np.sin(2 * np.pi * hz * t) * np.exp(-14.0 * t)
        + 0.44 * np.sin(2 * np.pi * (hz * 1.54) * t) * np.exp(-19.0 * t)
        + 0.28 * np.sin(2 * np.pi * (hz * 2.18) * t) * np.exp(-26.0 * t)
    )
    return (0.45 * hit + 0.78 * ring).astype(np.float32)


def star_glint_chime(dur=0.95, hz=2637.0):
    """Sharp crystalline metallic star glint chime."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    env = np.clip(t / 0.012, 0, 1) * np.exp(-4.2 * t)
    sig = (
        0.55 * np.sin(2 * np.pi * hz * t)
        + 0.35 * np.sin(2 * np.pi * (hz * 1.5) * t)
        + 0.22 * np.sin(2 * np.pi * (hz * 2.0) * t) * np.exp(-2.5 * t)
    )
    return (sig * env).astype(np.float32)


def metallic_click(hz=880.0, dur=0.14, seed=23):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    return (
        0.65 * np.sin(2 * np.pi * hz * t) * np.exp(-38 * t)
        + 0.45 * np.sin(2 * np.pi * (hz * 2.13) * t) * np.exp(-52 * t)
        + 0.32 * (n - lowpass_smooth(n, 2)) * np.exp(-90 * t)
    ).astype(np.float32)


def metal_creak(dur=0.85, seed=29):
    """Strained pry-bar metal creak building into lock break."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    f = 420.0 + 380.0 * (t / dur) ** 1.4 + 45.0 * np.sin(2 * np.pi * 28 * t)
    ph = 2 * np.pi * np.cumsum(f) / RATE
    groan = np.tanh(2.5 * (0.65 * np.sin(ph) + 0.35 * np.sin(1.73 * ph)))
    grit = (n - lowpass_smooth(n, 3)) * 0.28
    env = np.clip(t / 0.12, 0, 1) * np.clip((dur - t) / 0.05, 0, 1)
    return ((0.72 * groan + grit) * env).astype(np.float32)


def brass_lock_snap(dur=0.55, seed=31):
    """LOUD crisp brass padlock clasp SNAP!"""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    crack = (n - lowpass_smooth(n, 2)) * np.exp(-75.0 * t)
    thump = np.sin(2 * np.pi * 140 * t) * np.exp(-28.0 * t)
    ring = (
        0.55 * np.sin(2 * np.pi * 1720 * t) * np.exp(-9.0 * t)
        + 0.42 * np.sin(2 * np.pi * 2890 * t) * np.exp(-13.0 * t)
        + 0.28 * np.sin(2 * np.pi * 4350 * t) * np.exp(-18.0 * t)
    )
    return (0.85 * crack + 0.45 * thump + 0.70 * ring).astype(np.float32)


def glass_slide(dur=0.65, seed=33):
    """Smooth glass display door sliding open in aluminum track."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    band = lowpass_smooth(n, 1) - lowpass_smooth(n, 6)
    ring = 0.18 * np.sin(2 * np.pi * 1480 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    env = np.clip(t / 0.06, 0, 1) * np.clip((dur - t) / 0.10, 0, 1)
    return ((0.75 * band + ring) * env).astype(np.float32)


def shutter_claw_scrape(dur=0.82, seed=37):
    """Eerie metallic claw scrape across outer corrugated steel shutter."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    hi = n - lowpass_smooth(n, 3)
    f1 = 1650.0 + 520.0 * np.sin(2 * np.pi * 1.8 * t) + 110.0 * np.sin(2 * np.pi * 34 * t)
    f2 = 2780.0 - 460.0 * (t / dur)
    ph1 = 2 * np.pi * np.cumsum(f1) / RATE
    ph2 = 2 * np.pi * np.cumsum(f2) / RATE
    rattle = 0.25 * np.sin(2 * np.pi * 185 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 16 * t))
    sig = 0.46 * np.tanh(2.2 * np.sin(ph1)) + 0.28 * np.sin(ph2) + 0.36 * hi + rattle
    env = np.clip(t / 0.04, 0, 1) * np.clip((dur - t) / 0.12, 0, 1)
    return (sig * env).astype(np.float32)


def muffled_infected_groan(dur=1.25, base_hz=108.0, seed=41):
    """Raspy muffled infected groan heard through outer steel shutter or down the block."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    freq = base_hz * (1.08 - 0.26 * (t / dur) + 0.06 * np.sin(2 * np.pi * 17 * t))
    ph = 2 * np.pi * np.cumsum(freq) / RATE
    voice = np.tanh(2.4 * (0.65 * np.sin(ph) + 0.35 * np.sin(2.02 * ph)))
    rasp = lowpass_smooth(n, 4) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t))
    env = np.clip(t / 0.20, 0, 1) * np.clip((dur - t) / 0.30, 0, 1)
    return lowpass_smooth(((0.62 * voice + 0.38 * rasp) * env).astype(np.float32), 4)


def shell_load_click(dur=0.20, seed=47):
    """Tactile 12-gauge red shell sliding past spring loading gate into magazine tube."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    slide = (lowpass_smooth(n, 2) - lowpass_smooth(n, 8)) * np.clip(t / 0.02, 0, 1) * np.exp(-26 * t)
    # Spring latch snap ~0.065s after slide begins
    ts = np.maximum(0.0, t - 0.065)
    mask = (t >= 0.065).astype(np.float32)
    snap = mask * (
        0.70 * np.sin(2 * np.pi * 1640 * ts) * np.exp(-55 * ts)
        + 0.48 * np.sin(2 * np.pi * 3180 * ts) * np.exp(-75 * ts)
        + 0.40 * (n - lowpass_smooth(n, 2)) * np.exp(-115 * ts)
    )
    return (0.45 * slide + 0.90 * snap).astype(np.float32)


def mag_slap_clack(dur=0.26, seed=51):
    """Crisp 9mm steel magazine seating firmly into grip (CLACK!)."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    thump = np.sin(2 * np.pi * 165 * t) * np.exp(-34 * t)
    clack = (
        0.65 * np.sin(2 * np.pi * 1180 * t) * np.exp(-42 * t)
        + 0.45 * np.sin(2 * np.pi * 2420 * t) * np.exp(-58 * t)
        + 0.42 * (n - lowpass_smooth(n, 2)) * np.exp(-95 * t)
    )
    return (0.50 * thump + 0.85 * clack).astype(np.float32)


def leather_stretch_cinch(dur=0.95, seed=53):
    """Thick dark leather glove stretch and wrist-strap cinch."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    rub = (lowpass_smooth(n, 3) - lowpass_smooth(n, 11)) * (0.65 + 0.35 * np.sin(2 * np.pi * 11 * t))
    creak = 0.24 * np.sin(2 * np.pi * (280 + 140 * np.sin(2 * np.pi * 4.5 * t)) * t)
    env = np.clip(t / 0.10, 0, 1) * np.clip((dur - t) / 0.14, 0, 1)
    return ((0.75 * rub + creak) * env).astype(np.float32)


def pump_shotgun_rack(dur=0.68, seed=61):
    """ICONIC two-stage crisp 12-gauge pump-action shotgun rack (CHK-CHK!)."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    hi = n - lowpass_smooth(n, 2)
    mid = lowpass_smooth(n, 1) - lowpass_smooth(n, 5)

    def stage(t0, f_a, f_b, weight=1.0):
        ts = np.maximum(0.0, t - t0)
        m = (t >= t0).astype(np.float32)
        slide_scrape = m * mid * np.exp(-26 * ts) * 0.55
        # Sharp metallic lock-stop impact ~0.055s into stroke
        tl = np.maximum(0.0, t - (t0 + 0.055))
        ml = (t >= (t0 + 0.055)).astype(np.float32)
        bolt_stop = ml * (
            0.78 * np.sin(2 * np.pi * f_a * tl) * np.exp(-36 * tl)
            + 0.56 * np.sin(2 * np.pi * f_b * tl) * np.exp(-48 * tl)
            + 0.34 * np.sin(2 * np.pi * (f_b * 1.58) * tl) * np.exp(-62 * tl)
            + 0.52 * hi * np.exp(-95 * tl)
            + 0.36 * np.sin(2 * np.pi * 155 * tl) * np.exp(-28 * tl)
        )
        return weight * (slide_scrape + bolt_stop)

    # Back-stroke CHK at 0.00s, forward chambering CHK! at 0.24s
    sig = stage(0.00, 1120.0, 2340.0, 0.92) + stage(0.24, 1340.0, 2760.0, 1.08)
    return np.clip(sig, -1.0, 1.0).astype(np.float32)


def beacon_pulse(dur=0.45, hz=523.25):
    """Distant rhythmic red rooftop beacon sonar-like pulse."""
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    env = np.clip(t / 0.03, 0, 1) * np.exp(-6.5 * t)
    sig = 0.65 * np.sin(2 * np.pi * hz * t) + 0.25 * np.sin(2 * np.pi * (hz * 2.0) * t)
    return (sig * env).astype(np.float32)


def exhale_breath(dur=1.15, seed=71):
    t = np.arange(int(dur * RATE), dtype=np.float32) / RATE
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    air = lowpass_smooth(n, 3) - lowpass_smooth(n, 14)
    env = np.clip(t / 0.16, 0, 1) * np.exp(-2.4 * t)
    return (air * env).astype(np.float32)


def wind_bed(t, seed=59):
    n = rng(seed).standard_normal(len(t)).astype(np.float32)
    base = lowpass_smooth(n, 10)
    gust = 0.65 + 0.35 * np.sin(2 * np.pi * 0.20 * t + 0.3) * np.sin(2 * np.pi * 0.08 * t)
    return (base * gust).astype(np.float32)


def build_ch2c():
    dur = 82
    t = np.arange(dur * RATE, dtype=np.float32) / RATE
    buf = np.zeros((len(t), 2), dtype=np.float32)

    # 1. Dark workshop room tone (0.0..34.1s, 39.4..64.8s)
    #    ZERO room tone / ZERO music during total score dropout (34.2..39.2s)!
    room = lowpass_smooth(rng(101).standard_normal(len(t)).astype(np.float32), 14)
    r_env = (
        env_range(t, 0.0, 5.75, 0.3, 0.15) * 0.045
        + env_range(t, 5.85, 32.6, 0.2, 0.25) * 0.030
        + env_range(t, 39.4, 64.8, 0.5, 0.6) * 0.028
    )
    buf[:, 0] += room * r_env
    buf[:, 1] += room * r_env

    # 2. Sub-bass & tactical drone
    #    Ducked cleanly at 32.7..33.4 (lock SNAP), TOTAL DROPOUT 34.2..39.2 (shutter scare),
    #    ducked at 62.3..63.1 (flashlight OFF), and ducked at 76.4..77.6 (shotgun CHK-CHK!)
    d = drone(t, 44.0, 0.45)
    d_env = (
        env_range(t, 10.2, 15.4, 1.0, 0.5) * 0.12
        + env_range(t, 15.5, 18.0, 0.3, 0.3) * 0.06   # tension dip on empty wall racks
        + env_range(t, 20.4, 32.6, 0.8, 0.20) * 0.15
        + env_range(t, 39.4, 58.4, 0.5, 0.5) * 0.15
        + env_range(t, 58.4, 61.8, 0.4, 0.5) * 0.18   # low warning sub-tone on silence rule
        + env_range(t, 66.8, 76.4, 1.2, 0.15) * 0.16
        + env_range(t, 77.7, 81.94, 0.35, 0.04) * 0.21
    )
    buf[:, 0] += d * d_env
    buf[:, 1] += d * d_env * 0.96

    # 3. Warm mystery intrigue strings swell (10.2..15.4s, dips 15.4..18.0s, builds 20.4..31.8s)
    mys = mystery_strings(t)
    m_env = (
        env_range(t, 10.2, 15.4, 1.4, 0.6) * 0.15
        + env_range(t, 20.4, 31.8, 1.2, 0.4) * 0.13
    )
    buf[:, 0] += mys * m_env
    buf[:, 1] += mys * m_env * 1.04

    # 4. Stepped tactical brass across shotgun/pistol/shells reveal (22.8..28.8s)
    #    + ominous-triumphant Part 2 cliffhanger brass chord (79.4..81.94s)
    tb = tactical_brass(t, 73.42)
    tb_env = (
        env_range(t, 22.8, 28.8, 1.0, 0.8) * 0.13
        + env_range(t, 79.4, 81.94, 0.9, 0.04) * 0.20
    )
    buf[:, 0] += tb * tb_env
    buf[:, 1] += tb * tb_env * 0.96

    # 5. Focused 84 BPM tactical bass pulse (39.4..58.4s)
    #    Gently ducked around hero shell-loading clicks (43.0..45.9s) and mag CLACK (47.2s)
    bpm = 84.0
    beat_dur = 60.0 / bpm
    bt = 39.50
    step = 0
    while bt < 58.30:
        in_shell_load = 42.85 <= bt <= 46.05
        in_mag_clack = 46.95 <= bt <= 47.45
        gain_scale = 0.55 if (in_shell_load or in_mag_clack) else 1.0
        if step % 2 == 0:
            add_stereo(buf, bt, impact_thud(0.18, 56.0, 0.22, 120 + (step % 15)), 0.0, 0.20 * gain_scale)
        else:
            add_stereo(buf, bt, impact_thud(0.10, 118.0, 0.35, 140 + (step % 15)), 0.10 if step % 4 == 1 else -0.10, 0.11 * gain_scale)
        bt += beat_dur
        step += 1

    # 6. Icy midnight wind (15.4..18.0s hollow groan; 65.0..76.4s rear exit into midnight fog)
    wind = wind_bed(t, 59)
    w_env = (
        env_range(t, 15.4, 18.0, 0.4, 0.5) * 0.065
        + env_range(t, 65.0, 76.4, 0.7, 0.25) * 0.10
        + env_range(t, 77.7, 81.94, 0.3, 0.05) * 0.07
    )
    buf[:, 0] += wind * w_env * 0.92
    buf[:, 1] += wind * w_env * 1.08

    # 7. Swelling orchestral horror strings for midnight skyline finale (69.8..76.35s & 77.8..81.94s)
    #    Cleanly ducked across 76.4..77.65s so pump-shotgun CHK-CHK cuts through!
    orch_l = orchestral_horror_strings(t, 146.83)
    orch_r = orchestral_horror_strings(t, 147.35)
    o_env = (
        env_range(t, 69.8, 76.35, 2.2, 0.12) * 0.16
        + env_range(t, 77.8, 81.94, 0.8, 0.04) * 0.18
    )
    buf[:, 0] += orch_l * o_env
    buf[:, 1] += orch_r * o_env

    # --- TIMED HERO FOLEY & STORY SFX (Synced to all 29 shots of Ch 2C) ---

    # Shot 1 (0.0–2.6): Dark workshop heavy breathing pulse
    add_stereo(buf, 0.40, breath_cycle(1.15, 11), 0.0, 0.16)
    add_stereo(buf, 1.85, breath_cycle(1.05, 12), 0.0, 0.14)

    # Shot 2 (2.6–5.0): Soft cloth pocket rustle + faint phone screen wake chime
    add_stereo(buf, 2.95, leather_stretch_cinch(0.45, 13), -0.10, 0.12)
    add_stereo(buf, 3.65, star_glint_chime(0.38, 1760.0), 0.05, 0.10)

    # Shot 3 (5.0–7.6): CRISP PHONE FLASHLIGHT CLICK ON (05.8s)
    add_stereo(buf, 5.80, flashlight_click(0.08, 2480.0, 14), 0.0, 0.42)

    # Shot 4 (7.6–10.2): Boot step + crystalline brass casing TINK-ROLL on concrete (08.8s)
    add_stereo(buf, 8.65, impact_thud(0.09, 108.0, 0.28, 15), -0.06, 0.14)
    add_stereo(buf, 8.80, brass_casing_tink(0.30, 4180.0, 16), 0.08, 0.38)
    add_stereo(buf, 9.02, brass_casing_tink(0.22, 4340.0, 17), 0.16, 0.26)
    add_stereo(buf, 9.20, brass_casing_tink(0.18, 4260.0, 18), 0.24, 0.18)
    add_stereo(buf, 9.35, brass_casing_tink(0.14, 4410.0, 19), 0.30, 0.12)

    # Shot 6 (13.0–15.4): Quick stunned relief exhale
    add_stereo(buf, 13.45, exhale_breath(0.95, 20), 0.0, 0.16)

    # Shot 8 (18.0–20.4): Sharp metallic star glint chime (19.0s)
    add_stereo(buf, 19.00, star_glint_chime(0.95, 2637.0), 0.18, 0.34)

    # Shot 9 (20.4–23.0): Steady cautious footsteps approaching counter
    for i, ft in enumerate([20.80, 21.55, 22.30]):
        add_stereo(buf, ft, impact_thud(0.09, 112.0, 0.28, 21 + i), -0.08 if i % 2 == 0 else 0.08, 0.14)

    # Shot 10 (23.0–25.8): Cold steel barrel glint shimmer (24.1s)
    add_stereo(buf, 24.10, star_glint_chime(0.85, 2217.5), 0.05, 0.24)

    # Shot 12 (28.6–31.2): Metallic pegboard pry-bar clink (29.4s)
    add_stereo(buf, 29.40, metallic_click(1380.0, 0.22, 25), -0.14, 0.34)
    add_stereo(buf, 29.58, metallic_click(1920.0, 0.16, 26), -0.10, 0.22)

    # Shot 13 (31.2–34.2): Strained metal creak (32.2s) -> LOUD BRASS LOCK SNAP! (33.0s) + glass slide (33.35s)
    add_stereo(buf, 32.15, metal_creak(0.82, 27), 0.04, 0.32)
    add_stereo(buf, 33.00, brass_lock_snap(0.55, 28), 0.0, 0.48)
    add_stereo(buf, 33.35, glass_slide(0.65, 29), 0.12, 0.28)

    # Shot 14–15 (34.2–39.2): TOTAL SCORE DROPOUT!
    # Eerie outer steel shutter claw scrape (34.6s) + raspy muffled groan (35.1s)
    # -> shuffling footsteps fading right (36.9, 37.5, 38.1s) -> quiet relief exhale (38.8s)
    add_stereo(buf, 34.60, shutter_claw_scrape(0.82, 30), -0.22, 0.42)
    add_stereo(buf, 35.10, muffled_infected_groan(1.25, 112.0, 31), -0.18, 0.30)
    add_stereo(buf, 36.90, impact_thud(0.11, 96.0, 0.38, 32), 0.05, 0.14)
    add_stereo(buf, 37.50, impact_thud(0.10, 92.0, 0.34, 33), 0.38, 0.10)
    add_stereo(buf, 38.10, impact_thud(0.09, 88.0, 0.30, 34), 0.68, 0.07)
    add_stereo(buf, 38.80, exhale_breath(0.90, 35), 0.0, 0.22)

    # Shot 16 (39.4–42.4): Solid steel shotgun lift off padded rack hooks
    add_stereo(buf, 40.15, metallic_click(620.0, 0.18, 36), 0.0, 0.24)

    # Shot 17 (42.4–46.2): Crisp rhythmic shell-loading clicks (43.0, 43.8, 44.6, 45.4, 45.8s)
    for i, st_t in enumerate([43.00, 43.80, 44.60, 45.40, 45.80]):
        add_stereo(buf, st_t, shell_load_click(0.20, 40 + i), -0.05 + 0.03 * i, 0.42)

    # Shot 18 (46.2–49.0): Crisp 9mm mag CLACK! (47.2s) + firm belt tuck (48.0s)
    add_stereo(buf, 47.20, mag_slap_clack(0.26, 46), 0.08, 0.46)
    add_stereo(buf, 48.05, leather_stretch_cinch(0.42, 47), 0.12, 0.20)

    # Shot 19 (49.0–51.8): Quiet dry cardboard crinkle
    add_stereo(buf, 49.80, leather_stretch_cinch(0.38, 48), 0.06, 0.15)

    # Shot 20 (51.8–55.0): Thick leather glove stretch (52.2s) + strap cinch (53.8s) + fist clench
    add_stereo(buf, 52.20, leather_stretch_cinch(1.10, 49), -0.06, 0.32)
    add_stereo(buf, 53.80, leather_stretch_cinch(0.65, 50), 0.06, 0.36)
    add_stereo(buf, 54.05, metallic_click(940.0, 0.10, 51), 0.06, 0.20)

    # Shot 21 (55.0–58.4): Cloth/sling shift
    add_stereo(buf, 56.10, leather_stretch_cinch(0.55, 52), 0.0, 0.18)

    # Shot 22 (58.4–61.4): Distant muffled city groans (59.0s)
    add_stereo(buf, 59.00, muffled_infected_groan(1.45, 98.0, 53), -0.35, 0.22)
    add_stereo(buf, 59.85, muffled_infected_groan(1.30, 124.0, 54), 0.40, 0.18)

    # Shot 23 (61.4–64.0): CRISP FLASHLIGHT CLICK OFF (62.6s)
    add_stereo(buf, 62.60, flashlight_click(0.08, 2240.0, 55), 0.0, 0.42)

    # Shot 24 (64.0–66.8): Soft oiled rear deadbolt click (65.0s)
    add_stereo(buf, 65.00, metallic_click(760.0, 0.16, 56), 0.08, 0.34)
    add_stereo(buf, 65.12, metallic_click(1180.0, 0.11, 57), 0.08, 0.24)

    # Shot 26 (69.6–72.6): Cautious boots on wet asphalt
    for i, ft in enumerate([70.00, 70.85, 71.70]):
        add_stereo(buf, ft, impact_thud(0.09, 108.0, 0.32, 58 + i), -0.08 if i % 2 == 0 else 0.08, 0.15)

    # Shot 27 (72.6–76.2): Apex Tower rhythmic red beacon pulse
    for bt_p in [72.80, 73.80, 74.80, 75.80]:
        add_stereo(buf, bt_p, beacon_pulse(0.45, 523.25), 0.0, 0.18)

    # Shot 28 (76.2–78.6): ICONIC CRISP PUMP-SHOTGUN CHK-CHK! (77.0s)
    add_stereo(buf, 77.00, pump_shotgun_rack(0.68, 61), 0.0, 0.56)

    # Shot 29 (78.6–82.0): Deep ominous-triumphant Part 2 cliffhanger brass boom (80.6s) -> clean cut at 82.0s
    add_stereo(buf, 80.60, boom(1.36, 82.0, 26.0, 62), 0.0, 0.46)

    # Clean hard cut to silence over last 40ms
    fade_samples = int(0.04 * RATE)
    buf[-fade_samples:, :] *= np.linspace(1.0, 0.0, fade_samples, dtype=np.float32)[:, None]

    return np.clip(buf, -0.92, 0.92)


if __name__ == "__main__":
    ASSETS.mkdir(parents=True, exist_ok=True)
    audio = build_ch2c()
    out_path = ASSETS / "score.wav"
    soundfile.write(out_path, audio, RATE, subtype="PCM_16")
    print(f"Wrote {out_path} ({len(audio) / RATE:.1f}s)", flush=True)
