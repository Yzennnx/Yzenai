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
    (0.24, 2.93, ["What if your shadow", "suddenly had weight?"], "SHADOW WEIGHT"),
    (3.87, 7.17, ["One step, and it pulls", "your feet right out", "from under you."], "FEET"),
    (7.64, 10.28, ["The longer it gets,", "the harder it pulls."], "LONGER HARDER"),
    (10.55, 13.15, ["And it's attached", "to your heels."], "HEELS"),
]
REST = [
    (13.7, 17.1, ["You plant a toe", "and shove toward the light."], "TOE LIGHT"),
    (18.1, 21.8, ["Even half a step", "makes the shadow shorter."], "SHORTER"),
    (22.35, 24.7, ["So you take another step."], "STEP"),
    (25.65, 26.9, ["And another."], "ANOTHER"),
    (28.0, 32.4, ["Right under the lamp,", "there's barely any shadow", "left to pull you."], "BARELY"),
    (33.0, 35.4, ["For a second,", "you can stand up straight."], "STRAIGHT"),
    (36.9, 38.65, ["Then you hear a car."], "CAR"),
    (39.65, 40.8, ["Two headlights."], "TWO"),
    (41.03, 42.25, ["Two long shadows."], "TWO"),
    (43.13, 45.68, ["Both pulling on", "the same pair of shoes."], "SAME"),
]


def read(model, rows, mix, speed=1.0):
    cues = []
    pitch = 2 ** (0.5 / 12)
    for start, limit, pages, emphasis in rows:
        sentence = " ".join(pages)
        wav = model.generate(sentence, temperature=0.65, top_p=0.92).squeeze().cpu().numpy()
        wav, _ = librosa.effects.trim(wav, top_db=43, frame_length=512, hop_length=120)
        tempo = max(speed, (len(wav) / model.sr) / (limit - start - .10))
        filters = f"asetrate={round(model.sr * pitch)},aresample={RATE},atempo={tempo / pitch:.6f},highpass=f=75"
        pcm = subprocess.run(
            [str(PILOT["FFMPEG"]), "-v", "error", "-f", "f32le", "-ar", str(model.sr), "-ac", "1",
             "-i", "pipe:0", "-af", filters, "-f", "f32le", "pipe:1"],
            input=wav.astype("<f4").tobytes(), capture_output=True, check=True,
        )
        speech = np.frombuffer(pcm.stdout, dtype="<f4")
        rms = float(np.sqrt(np.mean(speech ** 2)))
        peak = float(np.max(np.abs(speech)))
        end = start + len(speech) / RATE
        assert rms > .001 and np.isfinite(peak) and end <= limit, (sentence, start, end, limit)
        offset = round(start * RATE)
        mix[offset:offset + len(speech)] = speech * min(.105 / rms, .84 / peak)
        print(f"{start:.2f} - {end:.2f} {sentence}", flush=True)
        weights = [sum(c.isalpha() for c in page) for page in pages]
        cursor = start
        for index, (page, weight) in enumerate(zip(pages, weights)):
            boundary = end if index == len(pages) - 1 else cursor + (end - start) * weight / sum(weights)
            cues.append(dict(start=cursor, end=boundary, text=page.upper(), emphasis=emphasis.split()))
            cursor = boundary
    return cues


def save(name, mix, cues):
    assert all(cue["start"] >= prior["end"] for prior, cue in zip(cues, cues[1:]))
    soundfile.write(ASSETS / f"{name}.wav", mix, RATE, subtype="PCM_16")
    (ASSETS / f"{name}.json").write_text(json.dumps(cues, indent=2) + "\n", encoding="utf-8")


torch.set_num_threads(6)
torch.manual_seed(19)
model = ChatterboxTurboTTS.from_local(PILOT["VOICE_TOOLS"] / "nano", device="cpu", nano=True)
model.prepare_conditionals(str(PILOT["VOICE_TOOLS"] / "voice-reference.wav"))
ASSETS.mkdir(exist_ok=True)
if len(sys.argv) > 1:
    source = f"opening-{sys.argv[1]}"
    opening, sample_rate = soundfile.read(ASSETS / f"{source}.wav", dtype="float32")
    assert sample_rate == RATE and len(opening) == RATE * 14
    cues = json.loads((ASSETS / f"{source}.json").read_text(encoding="utf-8"))
    mix = np.zeros(RATE * 46, dtype=np.float32)
    mix[:len(opening)] = opening
    # Start the continuation after the preserved opening audio.
    REST[0] = (14.03, *REST[0][1:])
    save("episode-voice", mix, cues + read(model, REST, mix))
else:
    for name, wait, speed in [("measured", 0, 1), ("quick", -.20, 1.13)]:
        torch.manual_seed(19)
        mix = np.zeros(RATE * 14, dtype=np.float32)
        rows = [(start + (wait if index else 0), limit, pages, emphasis)
                for index, (start, limit, pages, emphasis) in enumerate(OPENING)]
        save(f"opening-{name}", mix, read(model, rows, mix, speed))
