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

# Chapter 1B: Five Days & Midnight Escape (75 seconds)
# Locked Dark Horror Series Narrator: every line <= 16 words, zero hyphens, unhurried <= 1.05x!
LINES = [
    (0.25, 3.55, ["Five days pass inside", "your seventh floor apartment."], "FIVE DAYS SEVENTH APARTMENT"),
    (3.65, 10.10, ["Watching from above, you spot one pattern.", "Past midnight, the infected go sluggish in the dark."], "PATTERN MIDNIGHT SLUGGISH DARK"),
    (10.15, 15.65, ["You pack whatever is left.", "Canned food, water, first aid,", "and a kitchen knife."], "PACK WATER KITCHEN KNIFE"),
    (15.75, 22.55, ["Then you wrap cardboard and duct tape", "over your arms and shins.", "Cheap armor, anything to stop a bite."], "CARDBOARD TAPE ARMOR BITE"),
    (22.85, 28.35, ["Midnight.", "You ease the bookshelf aside", "and crack the door."], "MIDNIGHT BOOKSHELF CRACK DOOR"),
    (28.65, 33.40, ["One infected down the hall,", "hammering on your neighbor's door."], "ONE INFECTED HAMMERING DOOR"),
    (35.15, 42.10, ["Step by silent step,", "you crouch low and edge", "right past its back."], "SILENT CROUCH PAST BACK"),
    (42.50, 45.55, ["Until your phone slips", "onto the tile."], "PHONE SLIPS TILE"),
    (46.25, 50.85, ["The pounding stops.", "Its head snaps straight at you."], "STOPS HEAD SNAPS STRAIGHT"),
    (51.10, 57.30, ["Then the city power grid dies.", "Blind in the pitch dark,", "it misses you completely."], "POWER DIES BLIND DARK"),
    (57.60, 60.45, ["You jab the elevator button.", "Completely dead."], "ELEVATOR DEAD"),
    (60.60, 66.05, ["Seven concrete flights down in the red dark.", "Luckily, no infected in sight."], "SEVEN STAIRS LUCKILY INFECTED"),
    (66.15, 70.45, ["Until you reach the first floor.", "Three infected block the glass."], "FIRST FLOOR THREE GLASS"),
    (70.55, 73.65, ["Your heart spikes, then you spot", "one way out."], "HEART SPIKES WAY OUT"),
    (73.75, 76.25, ["A broken glass vase on the ground."], "BROKEN GLASS VASE"),
    (76.35, 81.15, ["You toss a shard away.", "Glass bounces, skids across the tile."], "SHARD BOUNCES SKIDS TILE"),
    (81.25, 84.75, ["They chase the noise,", "and you hit the street."], "CHASE NOISE STREET"),
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
    torch.manual_seed(62)
    mix = np.zeros(85 * RATE, dtype=np.float32)
    cues = record_horror(model, LINES, mix, minimum_speed=0.91, semitones=-1.35)
    assert all(a["end"] <= b["start"] for a, b in zip(cues, cues[1:]))
    soundfile.write(ASSETS / "chapter-voice.wav", mix, RATE, subtype="PCM_16")
    (ASSETS / "chapter-voice.json").write_text(json.dumps(cues, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ASSETS / 'chapter-voice.wav'} ({len(cues)} caption cues)", flush=True)
