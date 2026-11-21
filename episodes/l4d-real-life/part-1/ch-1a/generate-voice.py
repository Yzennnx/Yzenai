import json
import runpy
import subprocess
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS

ROOT = Path(__file__).resolve().parent
PILOT = runpy.run_path(str(ROOT.parents[2] / "lava-pool" / "generate-reference-voice.py"))
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)
RATE = PILOT["RATE"]
TOOLS = PILOT["VOICE_TOOLS"]
FFMPEG = str(PILOT["FFMPEG"])

# Talkative, vivid Dark Horror Series Narrator script for Ch 1A (71 seconds)
# Unhurried horror cadence: every line speaks cleanly at ~0.94..0.98x (NEVER rushed >1.02x!)
OPENING = [
    (0.20, 5.10, ["What if Left 4 Dead suddenly became real,", "the exact second you died", "in the game?"], "LEFT DEAD REAL DIED"),
    (5.40, 11.55, ["You drop the controller and grab your phone.", "A federal lab breach just triggered", "a citywide lockdown."], "PHONE FEDERAL LOCKDOWN"),
    (11.85, 15.40, ["Zombies aren't on your screen anymore.", "They're right outside."], "ZOMBIES SCREEN OUTSIDE"),
    (15.65, 19.15, ["You're alone on the seventh floor.", "Pure panic locks your chest."], "SEVENTH PANIC CHEST"),
    (19.35, 21.85, ["Then you force your hands steady", "and think."], "STEADY THINK"),
]

REST = [
    (22.25, 26.95, ["They can't reach you up here yet,", "but stay trapped long enough and they will."], "REACH TRAPPED WILL"),
    (27.20, 33.65, ["First, you snap the deadbolt shut", "and shove your heavy bookshelf", "straight across the door."], "LOCKED DEADBOLT HEAVY DOOR"),
    (34.15, 38.80, ["Next, you pull the fridge open", "to count how long you can last."], "FRIDGE COUNT LAST"),
    (39.05, 43.35, ["You never went grocery shopping.", "Five days of food. Barely."], "NEVER FIVE BARELY"),
    (43.80, 48.05, ["Then you look down from the seventh floor window,", "and your stomach drops."], "WINDOW SEVENTH DROPS"),
    (48.30, 54.25, ["The street below is a swarming frenzy.", "Not just runners, the special infected too."], "FRENZY SPECIAL INFECTED"),
    (54.45, 61.10, ["Green smoke curling around a hunched Smoker,", "a bloated Boomer,", "and a hooded Hunter vaulting over cars."], "SMOKER BOOMER HUNTER"),
    (61.35, 66.50, ["Heart pounding, you tear through every drawer for a weapon.", "No bat. No pipe."], "DRAWER WEAPON PIPE"),
    (66.70, 71.10, ["All you find in the entire apartment", "is one thin kitchen knife."], "ENTIRE KITCHEN KNIFE"),
    (71.30, 74.75, ["Staying means starving.", "You have five days."], "STARVING FIVE DAYS"),
]


def record_horror(model, rows, mix, minimum_speed=0.93, semitones=-0.35):
    """Dark Horror Series Narrator treatment: unhurried pace (never rushed >1.04x), low-end warmth & dark room tail."""
    cues = []
    pitch = 2 ** (semitones / 12)
    for start, limit, pages, emphasis in rows:
        text = " ".join(pages)
        wav = model.generate(text, temperature=0.62, top_p=0.90).squeeze().cpu().numpy()
        wav, _ = librosa.effects.trim(wav, top_db=42, frame_length=512, hop_length=120)
        natural_dur = len(wav) / model.sr
        speed = max(minimum_speed, natural_dur / (limit - start - 0.08))
        assert speed <= 1.05, f"Line would rush ({speed:.2f}x)! Widen window for: {text} (natural {natural_dur:.2f}s, window {limit - start:.2f}s)"
        # Dark horror EQ: warm low shelf (+3dB @ 135Hz), subtle dark room echo
        af = (
            f"asetrate={round(model.sr * pitch)},aresample={RATE},atempo={speed / pitch:.6f},"
            f"highpass=f=65,bass=g=3:f=135:w=0.7,aecho=0.8:0.88:28:0.12"
        )
        pcm = subprocess.run(
            [FFMPEG, "-v", "error", "-f", "f32le", "-ar", str(model.sr), "-ac", "1", "-i", "pipe:0", "-af", af, "-f", "f32le", "pipe:1"],
            input=wav.astype("<f4").tobytes(),
            capture_output=True,
            check=True,
        )
        audio = np.frombuffer(pcm.stdout, dtype="<f4")
        offset = round(start * RATE)
        end = (offset + len(audio)) / RATE
        rms = float(np.sqrt(np.mean(audio ** 2)))
        peak = float(np.max(np.abs(audio)))
        assert start < end <= limit and rms > 0.001 and np.isfinite(peak), (text, start, end, limit)
        mix[offset : offset + len(audio)] = audio * min(0.115 / rms, 0.85 / peak)
        weights = [sum(c.isalpha() for c in page) for page in pages]
        cursor = start
        for index, (page, weight) in enumerate(zip(pages, weights)):
            boundary = end if index == len(pages) - 1 else cursor + (end - start) * weight / sum(weights)
            cues.append(dict(start=cursor, end=boundary, text=page.upper(), emphasis=emphasis.split()))
            cursor = boundary
        print(f"{start:.2f}-{end:.2f} ({speed:.2f}x) {text}", flush=True)
    return cues


def save(name, mix, cues):
    assert all(a["end"] <= b["start"] for a, b in zip(cues, cues[1:]))
    soundfile.write(ASSETS / f"{name}.wav", mix, RATE, subtype="PCM_16")
    (ASSETS / f"{name}.json").write_text(json.dumps(cues, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    torch.set_num_threads(6)
    model = ChatterboxTurboTTS.from_local(TOOLS / "nano", device="cpu", nano=True)
    model.prepare_conditionals(str(TOOLS / "voice-reference.wav"))

    if len(sys.argv) == 1:
        # Regenerate unhurried dark-horror opening take (0..22.0s)
        torch.manual_seed(19)
        mix = np.zeros(int(22.0 * RATE), dtype=np.float32)
        cues = record_horror(model, OPENING, mix, minimum_speed=0.93, semitones=-0.35)
        save("opening-intense", mix, cues)
    else:
        take = sys.argv[1]
        assert take in ("measured", "intense"), "Choose measured or intense"
        semi = 0.1 if take == "measured" else -0.35
        opening_wav, rate = soundfile.read(ASSETS / f"opening-{take}.wav", dtype="float32")
        assert rate == RATE
        opening_cues = json.loads((ASSETS / f"opening-{take}.json").read_text(encoding="utf-8"))
        torch.manual_seed(29)
        mix = np.zeros(75 * RATE, dtype=np.float32)
        mix[: len(opening_wav)] = opening_wav
        cues = opening_cues + record_horror(model, REST, mix, minimum_speed=0.93, semitones=semi)
        save("chapter-voice", mix, cues)
