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
PILOT = runpy.run_path(str(ROOT.parent / "lava-pool" / "generate-reference-voice.py"))
ASSETS = ROOT / "assets"
RATE = PILOT["RATE"]
OPENING = [
    (.18, 2.36, ["What if you only ate", "mud cookies?"], "MUD COOKIES"),
    (3.12, 5.06, ["It crunches like gravel."], "GRAVEL"),
    (5.12, 6.80, ["You force down a swallow."], "SWALLOW"),
    (6.90, 11.15, ["Inside your stomach,", "that mouthful churns", "into a gritty slurry."], "STOMACH SLURRY"),
]
REST = [
    (13.10, 16.60, ["Day three.", "A cramp stops you mid-bite."], "CRAMP"),
    (18.62, 23.10, ["When stool moves too slowly,", "it can dry out and harden."], "DRY HARDEN"),
    (23.42, 26.20, ["You strain until your face burns."], "STRAIN"),
    (27.06, 29.65, ["All that effort", "for one hard pellet."], "ONE PELLET"),
    (30.13, 33.18, ["Day five.", "You finish another cookie."], "FIVE"),
    (34.72, 38.66, ["Your small intestine", "can absorb nutrients from food."], "ABSORB NUTRIENTS"),
    (38.69, 42.42, ["This meal gives it", "barely anything to work with."], "BARELY"),
    (43.15, 45.44, ["Day seven.", "Same plate."], "SEVEN"),
    (46.11, 50.88, ["Your body is drawing", "on its own stored fat."], "STORED FAT"),
    (51.06, 55.69, ["You push yourself up,", "and halfway there", "your legs give."], "GIVE"),
    (56.15, 57.42, ["Another cramp."], "CRAMP"),
    (59.00, 61.63, ["You reach past the cookies", "to call for help."], "HELP"),
    (62.05, 65.60, ["Your stomach can feel full", "while your body is starving."], "FULL STARVING"),
]


def record(model, rows, mix, minimum_speed=1):
    cues = []
    pitch = 2 ** (0.5 / 12)
    for start, limit, pages, emphasis in rows:
        text = " ".join(pages)
        wav = model.generate(text, temperature=.65, top_p=.92).squeeze().cpu().numpy()
        wav, _ = librosa.effects.trim(wav, top_db=43, frame_length=512, hop_length=120)
        speed = max(minimum_speed, len(wav) / model.sr / (limit - start - .09))
        pcm = subprocess.run([
            str(PILOT["FFMPEG"]), "-v", "error", "-f", "f32le", "-ar", str(model.sr), "-ac", "1",
            "-i", "pipe:0", "-af",
            f"asetrate={round(model.sr*pitch)},aresample={RATE},atempo={speed/pitch:.6f},highpass=f=75",
            "-f", "f32le", "pipe:1",
        ], input=wav.astype("<f4").tobytes(), capture_output=True, check=True)
        audio = np.frombuffer(pcm.stdout, dtype="<f4")
        offset = round(start * RATE)
        end = (offset + len(audio)) / RATE
        rms = float(np.sqrt(np.mean(audio ** 2)))
        peak = float(np.max(np.abs(audio)))
        assert start < end <= limit and rms > .001 and np.isfinite(peak), (text, start, end, limit)
        mix[offset:offset + len(audio)] = audio * min(.105 / rms, .84 / peak)
        weights = [sum(c.isalpha() for c in page) for page in pages]
        cursor = start
        for index, (page, weight) in enumerate(zip(pages, weights)):
            boundary = end if index == len(pages) - 1 else cursor + (end - start) * weight / sum(weights)
            cues.append(dict(start=cursor, end=boundary, text=page.upper(), emphasis=emphasis.split()))
            cursor = boundary
        print(f"{start:.2f}-{end:.2f} {text}", flush=True)
    return cues


def save(name, mix, cues, assets=ASSETS):
    assert all(a["end"] <= b["start"] for a, b in zip(cues, cues[1:]))
    soundfile.write(assets / f"{name}.wav", mix, RATE, subtype="PCM_16")
    (assets / f"{name}.json").write_text(json.dumps(cues, indent=2) + "\n", encoding="utf-8")


if __name__ == '__main__':
    torch.set_num_threads(6)
    torch.manual_seed(19)
    model = ChatterboxTurboTTS.from_local(PILOT["VOICE_TOOLS"] / "nano", device="cpu", nano=True)
    model.prepare_conditionals(str(PILOT["VOICE_TOOLS"] / "voice-reference.wav"))
    ASSETS.mkdir(exist_ok=True)
    if len(sys.argv) == 1:
        for name, delay, speed in [("measured", 0, 1), ("quick", -.13, 1.12)]:
            torch.manual_seed(19)
            mix = np.zeros(RATE * 13, dtype=np.float32)
            rows = [(start + (delay if index else 0), limit, pages, emphasis)
                    for index, (start, limit, pages, emphasis) in enumerate(OPENING)]
            save(f"opening-{name}", mix, record(model, rows, mix, speed))
    else:
        take = sys.argv[1]
        assert take in ("measured", "quick")
        opening, rate = soundfile.read(ASSETS / f"opening-{take}.wav", dtype="float32")
        assert rate == RATE and len(opening) == 13 * RATE
        mix = np.zeros(RATE * 66, dtype=np.float32)
        mix[:len(opening)] = opening
        cues = json.loads((ASSETS / f"opening-{take}.json").read_text(encoding="utf-8"))
        save("episode-voice", mix, cues + record(model, REST, mix))
