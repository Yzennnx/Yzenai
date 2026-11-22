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

# Chapter 2A v3: Shelter Before Sunrise (78 seconds)
# Cool, intimate close-mic horror storyteller style (Lights Out Roulette cadence: zero cheesy exclamations,
# stacking concrete details, punchy survival rule callout, deliberate pauses, warm baritone studio EQ, zero echo).
LINES = [
    (0.15, 3.80, ["The sky is turning gray.", "Sunrise kills you."], "SKY GRAY SUNRISE KILLS"),
    (3.95, 8.70, ["Then you spot it.", "A shuttered loft.", "An iron ladder."], "SHUTTERED LOFT IRON LADDER"),
    (8.85, 11.95, ["Behind you, sunlight hits.", "Two wake up."], "SUNLIGHT TWO WAKE UP"),
    (12.10, 15.90, ["No hesitation.", "You jump, catch the rung, climb."], "JUMP CATCH RUNG CLIMB"),
    (16.05, 20.70, ["Arms burning.", "Below your shoes, runners slam the brick."], "ARMS BURNING RUNNERS SLAM BRICK"),
    (20.85, 26.70, ["You haul the ladder up.", "Lock the catch.", "Bolt the window."], "HAUL LADDER LOCK BOLT WINDOW"),
    (27.25, 33.90, ["First time all night, you breathe.", "Food. Water.", "A locked room."], "BREATHE FOOD WATER LOCKED ROOM"),
    (34.05, 37.35, ["Your neck still burns", "from that Smoker."], "NECK BURNS SMOKER"),
    (37.50, 41.30, ["Your knife is bent.", "One fight, it snaps."], "KNIFE BENT SNAPS"),
    (41.45, 44.70, ["Daylight turns the street", "into a hunt."], "DAYLIGHT STREET HUNT"),
    (44.85, 50.65, ["Rule number one.", "When the sun is up, stay invisible.", "Wait for night."], "RULE NUMBER ONE STAY INVISIBLE NIGHT"),
    (52.20, 56.80, ["Your phone buzzes.", "Seven percent.", "You snatch it fast."], "BUZZES SEVEN PERCENT SNATCH"),
    (56.95, 61.90, ["Military broadcast.", "Final rescue chopper.", "Apex Tower at dawn."], "MILITARY BROADCAST APEX TOWER DAWN"),
    (62.05, 65.35, ["You peel the shutter", "and look east."], "SHUTTER EAST"),
    (65.50, 69.70, ["The tallest skyscraper.", "Blinking red above the fog."], "TALLEST SKYSCRAPER BLINKING RED FOG"),
    (69.85, 77.45, ["One night to cross infected streets.", "A bent knife won't survive.", "You need a real weapon."], "ONE NIGHT BENT KNIFE REAL WEAPON"),
]


def record_horror(model, rows, mix, minimum_speed=0.91, semitones=-1.35):
    """Warm, intimate close-mic baritone horror storyteller (no slapback echo)."""
    cues = []
    pitch = 2 ** (semitones / 12)
    for start, limit, pages, emphasis in rows:
        text = " ".join(pages)
        wav = model.generate(text, temperature=0.68, top_p=0.90).squeeze().cpu().numpy()
        wav, _ = librosa.effects.trim(wav, top_db=42, frame_length=512, hop_length=120)
        natural_dur = len(wav) / model.sr
        speed = max(minimum_speed, natural_dur / (limit - start - 0.06))
        assert speed <= 1.10, f"Line would rush ({speed:.2f}x)! Widen window for: {text} (natural {natural_dur:.2f}s, window {limit - start:.2f}s)"
        # Clean close-mic studio voice shaping: warm low-mid baritone body, subtle clarity, gentle de-ess & compression, ZERO echo!
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
    torch.manual_seed(58)
    mix = np.zeros(78 * RATE, dtype=np.float32)
    cues = record_horror(model, LINES, mix, minimum_speed=0.91, semitones=-1.35)
    assert all(a["end"] <= b["start"] for a, b in zip(cues, cues[1:]))
    soundfile.write(ASSETS / "chapter-voice.wav", mix, RATE, subtype="PCM_16")
    (ASSETS / "chapter-voice.json").write_text(json.dumps(cues, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ASSETS / 'chapter-voice.wav'} ({len(cues)} caption cues)", flush=True)
