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

# Chapter 2B v3: Night Weapon Run & The Pouncer (82 seconds)
# Unified grounded, naturally talkative close-mic baritone horror storyteller
# (Lights Out Roulette cadence, zero slapback echo, zero cheesy exclamations).
# Deliberate silent gaps preserved:
#   - 11.15-12.05s: tin claw scrape (11.4-12.0s) + dead silence
#   - 32.55-33.55s: crisp metallic blade snap (32.8-33.5s)
#   - 52.10-53.55s: steel door slam + Hunter impact BOOM (52.2-53.5s)
#   - 65.70-67.15s: pitch-black workshop silence (65.8-67.1s)
LINES = [
    (0.15, 5.55, ["Midnight hits, and you need a real weapon.", "The corner hardware store is picked clean."], "MIDNIGHT REAL WEAPON PICKED CLEAN"),
    (5.70, 11.15, ["That patrol car trunk is rusted solid,", "so you slip deeper into a dark service alley."], "PATROL CAR RUSTED SOLID SERVICE ALLEY"),
    (12.00, 16.20, ["Claws scrape the tin overhead.", "A hooded Hunter, locked onto you."], "CLAWS TIN HOODED HUNTER LOCKED"),
    (16.30, 21.10, ["Before you blink, it drops off the roof", "and tackles you onto concrete."], "DROPS ROOF TACKLES CONCRETE"),
    (21.20, 26.75, ["You jam your wrapped arm into its jaws,", "and somehow that cardboard stops the bite."], "WRAPPED ARM JAWS CARDBOARD STOPS BITE"),
    (26.85, 32.55, ["Teeth shred the tape, so you yank the bent knife", "and drive it straight upward."], "SHRED TAPE BENT KNIFE DRIVE UPWARD"),
    (33.55, 38.35, ["The weak steel snaps on bone,", "giving you two seconds to kick free."], "WEAK STEEL SNAPS KICK FREE"),
    (38.45, 42.80, ["Unarmed, you sprint flat out,", "boots slamming through black puddles."], "UNARMED SPRINT BLACK PUDDLES"),
    (42.90, 47.95, ["You glance back and your stomach drops.", "It bounds off brick, way faster than you."], "GLANCE BACK BOUNDS BRICK WAY FASTER"),
    (48.05, 52.10, ["A cracked steel door ahead.", "You dive in and slam it shut."], "STEEL DOOR DIVE SLAM SHUT"),
    (53.55, 56.35, ["You ram the deadbolt as the frame shakes."], "DEADBOLT FRAME SHAKES"),
    (56.45, 61.75, ["Then you heave a steel workbench across the floor,", "wedging the iron legs against the door."], "STEEL WORKBENCH HEAVE IRON LEGS"),
    (61.85, 65.70, ["Two brutal slams shake dust down,", "then the claws scrape away."], "TWO BRUTAL SLAMS CLAWS SCRAPE AWAY"),
    (67.15, 72.10, ["Staring at a useless handle, you realize", "that cardboard wrap just saved your life."], "USELESS HANDLE CARDBOARD SAVED LIFE"),
    (72.20, 76.35, ["Trapped unarmed in the dark,", "then you smell gun oil."], "TRAPPED UNARMED SMELL GUN OIL"),
    (76.45, 81.85, ["Moonlight creeps across heavy metal lathes and brass.", "And in back, a locked glass counter."], "METAL LATHES BRASS GLASS COUNTER"),
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
    torch.manual_seed(64)
    mix = np.zeros(82 * RATE, dtype=np.float32)
    cues = record_horror(model, LINES, mix, minimum_speed=0.91, semitones=-1.35)
    assert all(a["end"] <= b["start"] for a, b in zip(cues, cues[1:]))
    soundfile.write(ASSETS / "chapter-voice.wav", mix, RATE, subtype="PCM_16")
    (ASSETS / "chapter-voice.json").write_text(json.dumps(cues, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ASSETS / 'chapter-voice.wav'} ({len(cues)} caption cues)", flush=True)
