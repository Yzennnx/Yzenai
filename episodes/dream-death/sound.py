import sys
from pathlib import Path

import numpy as np
import soundfile as sf

RATE = 48000
DURATION = 60
assets = Path(__file__).resolve().parent / "assets"
assets.mkdir(exist_ok=True)
t = np.arange(DURATION * RATE) / RATE
random = np.random.default_rng(76)
noise = random.normal(0, 1, len(t))
slow = np.interp(t, np.arange(0, 60.02, 0.004), random.uniform(-1, 1, 15005))
left = np.zeros_like(t)
right = np.zeros_like(t)


def fade(start, end):
    x = np.clip((t - start) / (end - start), 0, 1)
    return x * x * (3 - 2 * x)


def region(start, end, edge=.12):
    return fade(start, start + edge) - fade(end - edge, end)


def add(signal, pan=0):
    left[:] += signal * (1 - max(0, pan) * .74)
    right[:] += signal * (1 + min(0, pan) * .74)


def knock(at, power, frequency, pan=0, decay=13):
    elapsed = np.maximum(0, t - at)
    env = np.exp(-elapsed * decay) * (t >= at)
    tone = np.sin(2 * np.pi * frequency * elapsed) + .31 * np.sin(2 * np.pi * frequency * 2.31 * elapsed)
    add(power * env * (tone + .12 * noise), pan)


def alarm(at, end, power):
    phase = (t - at) % .91
    for offset, frequency, pan in [(0, 805, -.12), (.19, 790, .19), (.43, 625, -.06)]:
        local = phase - offset
        beat = np.clip(local / .012, 0, 1) * np.clip((.125 - local) / .026, 0, 1)
        carrier = np.sin(2 * np.pi * frequency * t) + .22 * np.sin(2 * np.pi * frequency * 2.01 * t)
        add(power * beat * region(at, end, .025) * carrier, pan)
        add(power * .22 * np.roll(beat, int(.059 * RATE)) * region(at + .04, end, .025) * carrier, -pan)


cardiac = "--cardiac" in sys.argv
if cardiac:
    wind = region(0, 5.94, .35) * (.31 + .69 * fade(2.91, 5.27))
    add(wind * (.066 * slow + .014 * noise), -.22)
    add(region(1.45, 3.52, .5) * (.035 * slow + .012 * noise), .34)
    knock(3.50, .16, 89, -.21, 15)
    knock(5.92, .21, 69, 0, 19)
    floor = region(6.10, 47, .28)
    tension = region(6.4, 14.6, .42) + region(17.4, 41.9, .82)
    add(floor * .008 * np.sin(2 * np.pi * 53 * t), -.22)
    add(tension * (.018 * np.sin(2 * np.pi * 83 * t) + .010 * np.sin(2 * np.pi * 116.7 * t)), .31)
    for at, power in [(7.79,.095),(8.53,.064),(9.43,.038)]:
        gasp = np.exp(-((t-at)/.094)**2)
        add(gasp * power * (.76 * slow + .19 * noise + .21 * np.sin(2*np.pi*149.3*t)), .09)
    for at, power in [(9.82,.026),(10.39,.035),(10.78,.037),(11.12,.031),(13.0,.042),(27.63,.072),(36.18,.10)]:
        add(power * np.exp(-((t-at)/.13)**2) * (.35 * slow + .55 * noise), -.31)
    for at, hz, power in [(14.97,91,.096),(15.84,88,.061),(16.24,110,.050),
                          (16.54,99,.043),(16.77,113,.038),(23.87,680,.035),
                          (24.68,545,.027),(41.60,765,.072),(42.48,222,.154)]:
        knock(at,power,hz,.15,18)
    for start,end in [(28.75,36.25),(37.12,41.27),(42.81,46.96)]:
        for at in np.arange(start,end,60/110):
            knock(at,.037,87,-.12,24)
    light = region(47.0,60,.78)
    add(light * (.009 * np.sin(2*np.pi*164.81*t) + .006 * np.sin(2*np.pi*220*t)), .18)
    for at in [48.36,49.56,50.76,51.96,53.16,54.36,55.56,56.76,57.96,59.16]:
        knock(at,.028,612,.24,38)
    if "--opening" not in sys.argv:
        from scipy.signal import butter, sosfilt

        voice, rate = sf.read(assets / "cardiac-dispatch.wav", dtype="float32")
        assert rate == RATE and voice.ndim == 1
        phone = sosfilt(butter(3, (490, 2900), btype="bandpass", fs=RATE, output="sos"), voice)
        start = round(28.62 * RATE)
        dialogue = np.zeros_like(t)
        dialogue[start:start+len(phone)] = phone * .68
        add(dialogue, .45)
else:
    opening_wind = region(0, 3.98, .3) * (.28 + .72 * fade(2.0, 3.7))
    ending_wind = region(45.18, 59.12, .22) * (.32 + .68 * fade(54.9, 58.5))
    add((opening_wind + ending_wind) * (.063 * slow + .010 * noise), -.22)
    knock(3.96, .34, 68, .05, 14)
    knock(3.98, .12, 123, -.13, 23)
    alarm(4.36, 10.35, .069)
    alarm(58.61, 60.0, .105)

    bed = region(5.9, 19.6, .8) + region(20.1, 42.48, 1.4) + region(45.04, 56.2, .57)
    pressure = bed * (.35 + .65 * (.5 + .5 * np.sin(2 * np.pi * .19 * t)))
    add(pressure * (.030 * np.sin(2 * np.pi * 49 * t) + .012 * np.sin(2 * np.pi * 102.7 * t)), -.37)
    add(pressure * (.023 * np.sin(2 * np.pi * 51.4 * t) + .010 * np.sin(2 * np.pi * 148.7 * t)), .36)

    for at, pan in [(6.75, -.25), (7.49, -.23), (13.65, .29), (14.21, .18), (15.00, .41),
                    (16.19, -.40), (16.83, -.30), (17.40, -.17), (18.12, -.08), (18.62, .05),
                    (19.10, .09), (19.61, .23), (20.25, .35), (21.01, .43), (34.47, -.25), (35.35, -.13)]:
        knock(at, .061, 113, pan, 20)
    for at in [23.65, 25.21, 28.35, 31.29]:
        knock(at, .061, 629, .28, 35)
    add(region(23.25, 33.7, 1.25) * .014 * np.sin(2 * np.pi * (267 * t + .5 * np.sin(t * 2.4))), .37)
    add(region(36.79, 37.76, .22) * (.054 * slow + .014 * noise), -.09)
    knock(37.11, .12, 96, 0, 10)
    knock(45.0, .17, 79, -.18, 10)
    knock(51.25, .082, 164, -.30, 23)
    knock(54.1, .078, 155, .26, 23)
    knock(59.14, .23, 62, .02, 12)
tail = np.clip(1 - (t - 59.84) / .16, 0, 1)
sound = np.column_stack((left, right)) * tail[:, None]
length = RATE * ((14 if cardiac else 13) if "--opening" in sys.argv else DURATION)
name = "opening-effects.wav" if length != len(t) else "episode-effects.wav"
sf.write(assets / (("cardiac-" if cardiac else "") + name), sound[:length].astype("float32"), RATE, subtype="PCM_16")
