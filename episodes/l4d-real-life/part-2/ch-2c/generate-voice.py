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

# Chapter 2C: The Gunsmith Jackpot (82 seconds, 29 interactive shots)
# Unified grounded, naturally talkative close-mic baritone horror storyteller
# (Lights Out Roulette cadence, zero slapback echo, zero hyphens, zero exclamations).
# Deliberate silent gaps preserved for hero SFX:
#   - 05.25-06.15s: crisp flashlight click ON (05.8s)
#   - 32.68-33.52s: brass lock pry SNAP (33.0s) + glass slide
#   - 34.30-35.25s: outer steel shutter claw scrape (34.6s) + dead freeze
#   - 37.58-39.30s: frosted glass shadow passing in dead silence
#   - 76.45-77.65s: iconic pump-shotgun rack CHK-CHK (77.0s)
LINES = [
    (0.15, 5.25, ["Pitch dark, smelling gun oil.", "Four percent left on your phone."], "PITCH DARK GUN OIL FOUR PERCENT"),
    (6.15, 10.20, ["Your beam sweeps the concrete,", "kicking spent brass casings."], "BEAM CONCRETE BRASS CASINGS"),
    (10.30, 15.35, ["Heavy lathes, a shuttered gunsmith shop.", "Maybe luck is finally turning."], "GUNSMITH SHOP LUCK TURNING"),
    (15.45, 20.35, ["The main rifle wall is stripped clean,", "until something glints behind the counter."], "STRIPPED CLEAN GLINTS COUNTER"),
    (20.45, 25.75, ["One locked glass case everyone missed,", "holding a matte black pump shotgun."], "LOCKED GLASS CASE PUMP SHOTGUN"),
    (25.85, 28.55, ["A pistol, spare mag, and red shells."], "PISTOL SPARE MAG RED SHELLS"),
    (28.65, 32.68, ["You grab a steel pry bar", "and wrench the brass lock open."], "PRY BAR BRASS LOCK OPEN"),
    (35.25, 37.58, ["Hold still, something heard that snap."], "HOLD STILL HEARD SNAP"),
    (39.30, 42.35, ["The shadow moves on,", "and you lift the shotgun out."], "SHADOW MOVES LIFT SHOTGUN"),
    (42.45, 46.15, ["Six red shells left", "in the entire box."], "SIX RED SHELLS ENTIRE BOX"),
    (46.25, 48.95, ["Twelve pistol rounds", "locked at your belt."], "TWELVE PISTOL ROUNDS BELT"),
    (49.05, 54.95, ["Your right forearm wrap is shredded.", "You strap thick leather gloves", "tight over the torn tape."], "SHREDDED LEATHER GLOVES TORN TAPE"),
    (55.05, 61.35, ["Armed and ready, remember the rule.", "One shotgun blast draws everything", "for six blocks."], "RULE SHOTGUN BLAST SIX BLOCKS"),
    (61.45, 66.75, ["Save your last three percent.", "You ease the rear door open."], "THREE PERCENT REAR DOOR OPEN"),
    (66.85, 72.55, ["Empty alley, four dark blocks to rescue.", "You step out knowing every shell counts."], "FOUR BLOCKS RESCUE EVERY SHELL COUNTS"),
    (72.65, 76.45, ["Apex Tower blinks red.", "Five hours until dawn."], "APEX TOWER RED FIVE HOURS DAWN"),
    (77.65, 81.85, ["One shell chambered.", "The real run starts right now."], "ONE SHELL CHAMBERED REAL RUN NOW"),
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
        assert speed <= 1.12, (
            f"Line would rush ({speed:.2f}x)! Widen window for: {text} "
            f"(natural {natural_dur:.2f}s, window {limit - start:.2f}s)"
        )
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
    torch.manual_seed(67)
    mix = np.zeros(82 * RATE, dtype=np.float32)
    cues = record_horror(model, LINES, mix, minimum_speed=0.91, semitones=-1.35)
    assert all(a["end"] <= b["start"] for a, b in zip(cues, cues[1:]))
    soundfile.write(ASSETS / "chapter-voice.wav", mix, RATE, subtype="PCM_16")
    (ASSETS / "chapter-voice.json").write_text(json.dumps(cues, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ASSETS / 'chapter-voice.wav'} ({len(cues)} caption cues)", flush=True)
