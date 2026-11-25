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

# Chapter 3A: The Weeping Plaza (76 seconds, 25 interactive shots)
# Unified grounded, naturally talkative close-mic baritone horror storyteller
# (Lights Out Roulette cadence, zero slapback echo, zero hyphens, zero exclamations).
# Deliberate silent gaps preserved for hero horror SFX:
#   - 09.00-10.20s: score drops out -> eerie Witch sobbing (09.4s) triggers eye-dart
#   - 38.60-40.90s: hidden glass shard CRK-CRUNCH (39.2s) -> sobbing cuts dead (39.5s)
#   - 42.40-43.50s: total horror silence frozen mid-stride
#   - 54.80-56.40s: Witch growl hovers -> red glow dims & sinks back into sobbing (55.8s)
#   - 74.40-76.00s: deep ominous brass swell -> clean cut to black
LINES = [
    (0.15, 5.90, ["Six shotgun shells, twenty four pistol rounds,", "and four dark blocks left."], "SIX SHELLS TWENTY FOUR BLOCKS"),
    (6.00, 9.00, ["Your shortcut cuts across a glass plaza."], "SHORTCUT GLASS PLAZA"),
    (10.20, 14.30, ["Wait. Stop moving.", "Do you hear that crying ahead."], "WAIT STOP CRYING"),
    (14.40, 17.75, ["A Witch, sobbing beneath the flickering lamp."], "WITCH SOBBING LAMP"),
    (17.85, 23.10, ["Rule number one.", "Kill your light before she ever sees it."], "RULE ONE KILL LIGHT"),
    (23.20, 26.15, ["Lower the shotgun. Stay completely quiet."], "LOWER SHOTGUN QUIET"),
    (26.25, 32.30, ["Thirty yards of broken glass.", "Crouch low and edge along the wall."], "BROKEN GLASS CROUCH LOW"),
    (32.40, 38.60, ["Every step takes three seconds.", "Halfway across, and she is still rocking."], "THREE SECONDS STILL ROCKING"),
    (40.60, 42.70, ["The sobbing stops."], "SOBBING STOPS"),
    (43.50, 46.95, ["Her hands drop, and red eyes lift."], "HANDS DROP RED EYES"),
    (47.05, 52.85, ["Every instinct begs you to shoot.", "Hold your finger off the trigger."], "SHOOT OFF TRIGGER"),
    (52.95, 55.15, ["Become a stone statue."], "STONE STATUE"),
    (56.40, 59.55, ["She sinks back down into her hands."], "SINKS BACK DOWN"),
    (59.65, 65.50, ["Inch by inch, you clear the square,", "leaving her undisturbed behind you."], "CLEAR SQUARE UNDISTURBED"),
    (65.60, 70.20, ["All six shells still loaded.", "Not a single infected alerted."], "SIX SHELLS LOADED"),
    (70.30, 74.40, ["Apex Tower blinks closer.", "Silence will not last forever."], "APEX TOWER SILENCE"),
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
        assert speed <= 1.15, (
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
    torch.manual_seed(73)
    mix = np.zeros(76 * RATE, dtype=np.float32)
    cues = record_horror(model, LINES, mix, minimum_speed=0.91, semitones=-1.35)
    assert all(a["end"] <= b["start"] for a, b in zip(cues, cues[1:]))
    soundfile.write(ASSETS / "chapter-voice.wav", mix, RATE, subtype="PCM_16")
    (ASSETS / "chapter-voice.json").write_text(json.dumps(cues, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {ASSETS / 'chapter-voice.wav'} ({len(cues)} caption cues)", flush=True)
