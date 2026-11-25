"""Procedural stereo horror score + hero SFX for Chapter 3A (The Weeping Plaza, 76.0 s)."""
from pathlib import Path
import numpy as np
import soundfile

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)

RATE = 48000
DUR = 76.0
N = int(RATE * DUR)
t = np.arange(N, dtype=np.float64) / RATE
rng = np.random.default_rng(301)

L = np.zeros(N, dtype=np.float64)
R = np.zeros(N, dtype=np.float64)


def add(sig, start, gain=1.0, pan=0.0):
    i0 = int(round(start * RATE))
    if i0 >= N:
        return
    seg = sig[: max(0, N - i0)]
    lg = gain * np.cos((pan + 1.0) * np.pi / 4.0)
    rg = gain * np.sin((pan + 1.0) * np.pi / 4.0)
    L[i0 : i0 + len(seg)] += seg * lg
    R[i0 : i0 + len(seg)] += seg * rg


def lp_noise(dur_s, cutoff_hz=800.0):
    n = int(dur_s * RATE)
    x = rng.standard_normal(n)
    alpha = np.exp(-2.0 * np.pi * cutoff_hz / RATE)
    y = np.zeros(n)
    acc = 0.0
    for i in range(n):
        acc = alpha * acc + (1.0 - alpha) * x[i]
        y[i] = acc
    return y / (np.max(np.abs(y)) + 1e-9)


def bp_noise(dur_s, f0, bw=120.0):
    n = int(dur_s * RATE)
    tt = np.arange(n) / RATE
    env = lp_noise(dur_s, bw)
    return env * np.sin(2.0 * np.pi * f0 * tt + rng.uniform(0, 6.28))


# 1. Cold midnight wind bed (ducks completely during the 39.4-43.5s dead-freeze silence!)
wind_l = lp_noise(DUR, 240.0) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.11 * t))
wind_r = lp_noise(DUR, 270.0) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.09 * t + 1.3))
wind_gate = np.ones(N)
# Hard dropout for total horror silence on glass crunch freeze (39.4 - 43.5s)
wind_gate[int(39.4 * RATE) : int(43.5 * RATE)] = 0.04
L += wind_l * 0.055 * wind_gate
R += wind_r * 0.055 * wind_gate

# 2. Low stalking horror bass drone (0-8.9s, 26.5-39.0s, 65.5-76.0s)
def add_drone(s0, s1, freq=49.0, gain=0.14):
    n = int((s1 - s0) * RATE)
    tt = np.arange(n) / RATE
    env = np.minimum(1.0, tt / 0.8) * np.minimum(1.0, (s1 - s0 - tt) / 0.6)
    sig = (0.7 * np.sin(2 * np.pi * freq * tt) + 0.3 * np.sin(2 * np.pi * freq * 1.5 * tt)) * env
    add(sig, s0, gain, 0.0)

add_drone(0.0, 8.9, 55.0, 0.12)
add_drone(26.5, 38.8, 49.0, 0.11)
add_drone(65.5, 76.0, 52.0, 0.15)

# 3. Buzzing flickering cyan streetlamp (6.0-39.2s, 56.0-65.0s)
def add_lamp_buzz(s0, s1, gain=0.028):
    n = int((s1 - s0) * RATE)
    tt = np.arange(n) / RATE
    flick = 0.65 + 0.35 * (np.sin(2 * np.pi * 17.0 * tt) > -0.2)
    sig = (np.sin(2 * np.pi * 120.0 * tt) + 0.5 * np.sin(2 * np.pi * 240.0 * tt)) * flick
    add(sig, s0, gain, 0.25)

add_lamp_buzz(6.0, 39.1, 0.025)
add_lamp_buzz(56.0, 65.0, 0.020)

# 4. Eerie hollow Witch sobbing motif (09.4-39.2s, stops DEAD at 39.5s; resumes softly at 55.8-65.5s)
def make_sob(dur_s=1.45, base_f=420.0):
    n = int(dur_s * RATE)
    tt = np.arange(n) / RATE
    pitch = base_f * (1.0 - 0.18 * (tt / dur_s)) + 14.0 * np.sin(2 * np.pi * 5.2 * tt)
    phase = 2 * np.pi * np.cumsum(pitch) / RATE
    env = np.sin(np.pi * tt / dur_s) ** 1.6 * (0.75 + 0.25 * np.sin(2 * np.pi * 3.8 * tt))
    tone = (0.55 * np.sin(phase) + 0.25 * np.sin(2 * phase) + 0.20 * bp_noise(dur_s, base_f * 1.4, 90.0)) * env
    # Subtle plaza stone reverb tail (240ms + 430ms)
    out = np.zeros(n + int(0.5 * RATE))
    out[:n] += tone
    out[int(0.22 * RATE) : int(0.22 * RATE) + n] += tone * 0.32
    out[int(0.41 * RATE) : int(0.41 * RATE) + n] += tone * 0.16
    return out / (np.max(np.abs(out)) + 1e-9)

for st, g, pan in [
    (9.4, 0.17, 0.30), (12.1, 0.19, 0.25), (14.9, 0.22, 0.18), (18.2, 0.16, 0.20),
    (21.4, 0.15, 0.20), (24.5, 0.15, 0.22), (27.8, 0.17, 0.22), (31.0, 0.18, 0.18),
    (34.2, 0.19, 0.15), (37.0, 0.18, 0.15),
    (55.8, 0.17, 0.12), (58.6, 0.14, -0.10), (61.5, 0.10, -0.25), (64.2, 0.06, -0.35),
]:
    sob = make_sob(1.5, 430.0 if st < 39.0 else 400.0)
    if st == 37.0:
        # Cut dead at 39.45s!
        cut = int((39.45 - st) * RATE)
        sob = sob[:max(0, cut)]
        sob[-600:] *= np.linspace(1.0, 0.0, min(600, len(sob)))
    add(sob, st, g, pan)

# 5. Shivering dissonant high violin harmonic (14.4-20.4s and 43.8-56.0s)
def add_violin_tension(s0, s1, f1=987.7, f2=1046.5, gain=0.065):
    n = int((s1 - s0) * RATE)
    tt = np.arange(n) / RATE
    env = np.minimum(1.0, tt / 1.2) * np.minimum(1.0, (s1 - s0 - tt) / 0.8)
    vib = 4.0 * np.sin(2 * np.pi * 6.0 * tt)
    sig = (0.5 * np.sin(2 * np.pi * (f1 + vib) * tt) + 0.5 * np.sin(2 * np.pi * (f2 - vib) * tt)) * env
    add(sig, s0, gain, 0.0)

add_violin_tension(14.4, 20.4, 987.7, 1046.5, 0.045)
add_violin_tension(43.8, 56.0, 1108.7, 1174.7, 0.075)

# 6. Cautious footsteps (0.4-8.4s, 29.5-38.4s, 60.0-68.6s)
def make_step(soft=False):
    n = int(0.11 * RATE)
    tt = np.arange(n) / RATE
    env = np.exp(-tt * (48.0 if soft else 36.0))
    sig = (0.6 * lp_noise(0.11, 500.0) + 0.4 * np.sin(2 * np.pi * 92.0 * tt)) * env
    return sig / (np.max(np.abs(sig)) + 1e-9)

for st in np.arange(0.5, 8.3, 0.68):
    add(make_step(False), st, 0.14, -0.05)
for st in [29.8, 31.2, 33.0, 34.6, 36.4, 37.8]:
    add(make_step(True), st, 0.09, 0.0)
for st in [60.2, 61.5, 62.7, 66.0, 66.7, 67.4, 68.1]:
    add(make_step(st < 64.0), st, 0.12 if st >= 65.0 else 0.08, 0.0)

# 7. Phone screen click OFF (21.6s) + leather creak (24.0s)
click_n = int(0.03 * RATE)
click = np.sin(2 * np.pi * 2100.0 * np.arange(click_n) / RATE) * np.exp(-np.arange(click_n) / (0.004 * RATE))
add(click, 21.6, 0.18, 0.1)

# 8. HERO SFX: SHARP GLASS SHARD CRK-CRUNCH! at 39.20s!
def make_glass_crunch():
    n = int(0.42 * RATE)
    tt = np.arange(n) / RATE
    burst1 = rng.standard_normal(n) * np.exp(-tt * 28.0)
    burst2 = rng.standard_normal(n) * np.exp(-np.maximum(0, tt - 0.045) * 22.0) * (tt >= 0.045)
    tinkle = (
        0.5 * np.sin(2 * np.pi * 4280.0 * tt) * np.exp(-tt * 16.0)
        + 0.4 * np.sin(2 * np.pi * 6120.0 * tt) * np.exp(-np.maximum(0, tt - 0.03) * 14.0) * (tt >= 0.03)
        + 0.3 * np.sin(2 * np.pi * 7950.0 * tt) * np.exp(-np.maximum(0, tt - 0.08) * 12.0) * (tt >= 0.08)
    )
    sig = 0.65 * (burst1 + 0.7 * burst2) + 0.65 * tinkle
    return sig / (np.max(np.abs(sig)) + 1e-9)

add(make_glass_crunch(), 39.20, 0.58, 0.0)

# 9. HERO SFX: Deep wet guttural Witch warning growl (44.3-55.6s)
def make_witch_growl(dur_s=11.2):
    n = int(dur_s * RATE)
    tt = np.arange(n) / RATE
    f = 92.0 + 18.0 * np.sin(2 * np.pi * 0.45 * tt) + 8.0 * np.sin(2 * np.pi * 1.9 * tt)
    ph = 2 * np.pi * np.cumsum(f) / RATE
    rasp = np.tanh(2.4 * np.sin(ph) + 1.1 * np.sin(2.0 * ph) + 0.6 * lp_noise(dur_s, 650.0))
    env = np.minimum(1.0, tt / 0.9) * np.minimum(1.0, (dur_s - tt) / 1.4)
    swell = 0.65 + 0.35 * np.sin(np.pi * np.clip((tt - 1.5) / 8.0, 0, 1))
    return (rasp * env * swell) / (np.max(np.abs(rasp)) + 1e-9)

add(make_witch_growl(11.2), 44.3, 0.24, 0.15)

# 10. Close-mic heartbeat (17.8-26.0s @ 72 BPM; 35.0-39.1s @ 84 BPM; 47.0-55.5s @ 104 BPM)
def make_beat():
    n = int(0.32 * RATE)
    tt = np.arange(n) / RATE
    lub = np.sin(2 * np.pi * 54.0 * tt) * np.exp(-tt * 22.0)
    dub = np.sin(2 * np.pi * 46.0 * np.maximum(0, tt - 0.13)) * np.exp(-np.maximum(0, tt - 0.13) * 26.0) * (tt >= 0.13)
    return (lub + 0.72 * dub)

beat = make_beat()
for st in np.arange(17.9, 25.8, 60.0 / 72.0):
    add(beat, st, 0.20, 0.0)
for st in np.arange(35.2, 38.9, 60.0 / 84.0):
    add(beat, st, 0.22, 0.0)
for st in np.arange(47.1, 55.3, 60.0 / 104.0):
    add(beat, st, 0.30, 0.0)

# 11. Relief exhale at 57.4s
exh = lp_noise(1.1, 480.0) * np.sin(np.pi * np.arange(int(1.1 * RATE)) / (1.1 * RATE))
add(exh, 57.3, 0.11, 0.0)

# 12. Apex Tower distant beacon pulse (70.4s, 72.0s, 73.6s) + ominous brass cliffhanger swell (74.2-75.95s)
for st in [70.4, 72.0, 73.6]:
    bn = int(0.28 * RATE)
    bt = np.arange(bn) / RATE
    add(np.sin(2 * np.pi * 880.0 * bt) * np.exp(-bt * 11.0), st, 0.06, 0.2)

sw_n = int(1.75 * RATE)
sw_t = np.arange(sw_n) / RATE
sw_env = (sw_t / 1.75) ** 1.6 * np.minimum(1.0, (1.75 - sw_t) / 0.08)
brass = np.tanh(1.6 * (np.sin(2 * np.pi * 55.0 * sw_t) + 0.65 * np.sin(2 * np.pi * 110.0 * sw_t) + 0.35 * np.sin(2 * np.pi * 164.8 * sw_t))) * sw_env
add(brass, 74.2, 0.42, 0.0)

# Master soft limiter
stereo = np.stack([L, R], axis=1)
peak = np.max(np.abs(stereo))
if peak > 0.92:
    stereo *= 0.92 / peak

out = ASSETS / "score.wav"
soundfile.write(out, stereo.astype(np.float32), RATE, subtype="PCM_16")
print(f"Wrote {out} ({DUR:.1f}s stereo, peak={np.max(np.abs(stereo)):.3f})")
