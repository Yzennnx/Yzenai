import json
import runpy
import subprocess
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

# Chapter 1C v2: The Tongue & The Car Alarm (90 seconds)
# Engaging, conversational Dark Horror Series Narrator explaining your exact survival situation!
LINES = [
    (0.25, 6.65, ["You're finally out on the empty street,", "walking steadily toward a flickering corner market ahead."], "WALKING MARKET FLICKERING"),
    (6.85, 11.95, ["Everything feels way too quiet,", "until a wet cough echoes right overhead."], "QUIET WET COUGH OVERHEAD"),
    (14.70, 20.35, ["Before you can run, a barbed tongue", "snares your neck and drags you forward."], "BARBED TONGUE DRAGS FORWARD"),
    (20.45, 25.55, ["Gasping for air, you hook your taped cuff", "under it and yank your knife."], "GASPING CUFF YANK KNIFE"),
    (25.70, 30.30, ["You swing as hard as you can", "and slice straight through."], "SWING SLICE STRAIGHT"),
    (30.50, 34.95, ["You're free, barely,", "and the thin steel blade is already bent."], "BARELY BLADE BENT"),
    (35.20, 41.30, ["No time to breathe now.", "You sprint flat out down the dark empty road."], "SPRINT DARK ROAD"),
    (42.55, 48.45, ["You reach the market and spot shelves of food,", "but infected pack the aisles."], "MARKET FOOD INFECTED PACK"),
    (48.75, 54.65, ["A tiny pebble barely gets one to turn.", "Clearing this crowd takes something louder."], "PEBBLE CROWD LOUDER"),
    (54.90, 59.65, ["So you heave a heavy rock", "straight through a parked windshield."], "ROCK PARKED WINDSHIELD"),
    (59.90, 64.70, ["The alarm erupts, so you vault", "over a dumpster into cover."], "ALARM VAULT DUMPSTER COVER"),
    (64.95, 70.85, ["Just as you hoped, every infected pours out", "toward the screaming flashing car."], "INFECTED POURS SCREAMING CAR"),
    (72.35, 79.10, ["That buys sixty seconds.", "You sweep cans, water, bandages, and tape", "until your pack bulges."], "SIXTY SECONDS CANS BULGES"),
    (79.35, 84.10, ["You slip out the back alley just as", "the car alarm sputters and dies."], "ALLEY ALARM DIES"),
    (84.30, 89.75, ["For hours, you wander dead backstreets,", "testing locked doors and dodging strays."], "HOURS WANDER LOCKED DOORS"),
    (89.95, 95.15, ["Nothing safe is open, your legs ache,", "and you're running out of night."], "NOTHING SAFE RUNNING NIGHT"),
    (95.35, 101.20, ["Eastward, the night sky is already turning gray.", "Find real shelter before sunrise."], "GRAY SHELTER SUNRISE"),
]


def record_horror(model, rows, mix, minimum_speed=0.91, semitones=-1.35):
    """Warm, intimate close-mic baritone horror storyteller (Lights Out Roulette cadence, zero slapback echo)."""
    cues = []
    pitch = 2 ** (semitones / 12)
    for start, limit, pages, emphasis in rows:
        text = " ".join(pages)
        wav = model.generate(text, temperature=0.68, top_p=0.90).squeeze().cpu().numpy()
        wav, _ = librosa.effects.trim(wav, top_db=42, frame_length=512, hop_length=120)
        natural_dur = len(wav) / model.sr
        speed = max(minimum_speed, natural_dur / (limit - start - 0.06))
        assert speed <= 1.12, f"Line would rush ({speed:.2f}x)! Widen window for: {text} (natural {natural_dur:.2f}s, window {limit - start:.2f}s)"
        af = (
            f"asetrate={round(model.sr * pitch)},aresample={RATE},atempo={speed / pitch:.6f},"
            f"highpass=f=65,equalizer=f=130:t=q:w=1.0:g=3.5,equalizer=f=3200:t=q:w=1.4:g=1.8,"
            f"equalizer=f=6800:t=q:w=1.2:g=-2.5,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2"
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
        mix[offset : offset + len(audio)] = audio * min(0.118 / rms, 0.86 / peak)
        weights = [sum(c.isalpha() for c in page) for page in pages]
        cursor = start
        for index, (page, weight) in enumerate(zip(pages, weights)):
            boundary = end if index == len(pages) - 1 else cursor + (end - start) * weight / sum(weights)
            cues.append(dict(start=cursor, end=boundary, text=page.upper(), emphasis=emphasis.split()))
            cursor = boundary
        print(f"{start:.2f}-{end:.2f} ({speed:.2f}x) {text}", flush=True)
    return cues


if __name__ == "__main__":
    torch.set_num_threads(6)
    model = ChatterboxTurboTTS.from_local(TOOLS / "nano", device="cpu", nano=True)
    model.prepare_conditionals(str(TOOLS / "voice-reference.wav"), exaggeration=0.45)
    torch.manual_seed(63)
    mix = np.zeros(102 * RATE, dtype=np.float32)
    cues = record_horror(model, LINES, mix, minimum_speed=0.91, semitones=-1.35)
    assert all(a["end"] <= b["start"] for a, b in zip(cues, cues[1:]))
    soundfile.write(ASSETS / "chapter-voice.wav", mix, RATE, subtype="PCM_16")
    (ASSETS / "chapter-voice.json").write_text(json.dumps(cues, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ASSETS / 'chapter-voice.wav'} ({len(cues)} caption cues)", flush=True)
