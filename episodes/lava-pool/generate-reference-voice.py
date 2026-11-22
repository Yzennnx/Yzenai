import json
import os
import subprocess
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS


RATE = 48000
DURATION = 15
TOOLS = (
    Path(os.environ["LOCALAPPDATA"]) / "AIShortVideos"
    if os.name == "nt" and "LOCALAPPDATA" in os.environ
    else Path.home() / ".local" / "share" / "AIShortVideos"
)
VOICE_TOOLS = TOOLS / "chatterbox"
ASSETS = Path(__file__).resolve().parent / "assets"
FFMPEG = (
    next(TOOLS.glob("ffmpeg-*_build/bin/ffmpeg.exe"))
    if os.name == "nt"
    else Path("/usr/bin/ffmpeg")
)

# Keep each full sentence in one model call so the voice carries its intonation across caption breaks.
OPENING = [
    (0.24, 3.02, ["What happens to your body", "if you jump into lava?"], ["BODY", "JUMP", "LAVA"]),
    (4.55, 6.88, ["Your feet hit", "molten rock."], ["MOLTEN", "ROCK"]),
    (7.30, 11.76, ["Fresh lava at Kīlauea", "can be hotter than", "eleven hundred", "degrees Celsius."],
     ["KĪLAUEA", "ELEVEN", "HUNDRED"]),
    (11.92, 14.83, ["On contact,", "your skin starts", "taking damage."], ["CONTACT", "SKIN", "DAMAGE"]),
]
CONTINUATION = [
    (15.12, 22.95, ["A deep burn can destroy", "the entire thickness", "of your skin", "and reach the tissue underneath."],
     ["DEEP", "ENTIRE", "UNDERNEATH"]),
    (22.20, 29.75, ["If you breathe in", "very hot air", "or smoke from burning material,", "your throat can be injured too."],
     ["HOT", "SMOKE", "THROAT"]),
    (29.23, 33.60, ["As it swells,", "it gets harder to breathe."], ["SWELLS", "HARDER", "BREATHE"]),
    (33.67, 40.26, ["Even if you were pulled out,", "extensive burns could make fluid", "leak from your blood vessels."],
     ["PULLED", "FLUID", "LEAK"]),
    (40.32, 44.63, ["Your blood pressure can fall,", "leaving your organs with", "too little oxygen."],
     ["PRESSURE", "FALL", "OXYGEN"]),
    (45.49, 47.05, ["That's burn shock."], ["BURN", "SHOCK"]),
    (47.65, 50.28, ["The lava would do its damage", "on contact."], ["CONTACT"]),
    (51.03, 54.72, ["What makes the jump so deadly", "is how far that damage", "can spread."], ["DEADLY", "SPREAD"]),
]


def main():
    full = "--full" in sys.argv
    duration = 55 if full else DURATION
    output = "episode-voice" if full else "opening-voice-reference"
    torch.set_num_threads(6)
    torch.manual_seed(19)
    model = ChatterboxTurboTTS.from_local(VOICE_TOOLS / "nano", device="cpu", nano=True)
    model.prepare_conditionals(str(VOICE_TOOLS / "voice-reference.wav"))
    mix = np.zeros(duration * RATE, dtype=np.float32)
    captions = []
    if full:
        approved, rate = soundfile.read(ASSETS / "opening-voice-reference.wav", dtype="float32")
        assert rate == RATE and approved.shape == (DURATION * RATE,), "Invalid approved opening"
        mix[:len(approved)] = approved
        captions = json.loads((ASSETS / "opening-voice-reference.json").read_text(encoding="utf-8"))
    pitch = 2 ** (0.5 / 12)
    for start, limit, phrases, emphasis in CONTINUATION if full else OPENING:
        text = " ".join(phrases).replace("Kīlauea", "Kilauea")
        print(f"Generating {text}", flush=True)
        wav = model.generate(text, temperature=0.65, top_p=0.92).squeeze().cpu().numpy()
        wav, _ = librosa.effects.trim(wav, top_db=43, frame_length=512, hop_length=120)
        assert wav.size > model.sr / 4, f"Missing speech for {text}"
        src_rate = round(model.sr * pitch)
        speed = max(1, (len(wav) / model.sr) / (limit - start - 0.06))
        filters = f"asetrate={src_rate},aresample={RATE},atempo={speed / pitch:.6f},highpass=f=75"
        result = subprocess.run(
            [str(FFMPEG), "-v", "error", "-f", "f32le", "-ar", str(model.sr), "-ac", "1", "-i", "pipe:0",
             "-af", filters, "-f", "f32le", "pipe:1"],
            input=wav.astype("<f4").tobytes(), capture_output=True, check=True,
        )
        speech = np.frombuffer(result.stdout, dtype="<f4")
        end = start + len(speech) / RATE
        assert start < end <= limit, f"Speech ran past its slot for {text}"
        assert start >= (captions[-1]["end"] if captions else 0), f"Overlapping voice slot for {text}"
        rms = float(np.sqrt(np.mean(speech ** 2)))
        peak = float(np.max(np.abs(speech)))
        assert rms > 0.001 and np.isfinite(peak), f"Invalid voice audio for {text}"
        offset = round(start * RATE)
        mix[offset:offset + len(speech)] = speech * min(0.105 / rms, 0.84 / peak)
        print(f"  {start:.2f}–{end:.2f}s, speed {speed:.2f}x", flush=True)

        # ponytail: Relative phrase lengths estimate caption boundaries. Use a
        # word-timed alignment pass if a boundary lands noticeably early or late.
        weights = [sum(c.isalpha() for c in phrase) for phrase in phrases]
        cursor = start
        for index, (phrase, weight) in enumerate(zip(phrases, weights)):
            boundary = end if index == len(phrases) - 1 else cursor + (end - start) * weight / sum(weights)
            captions.append(dict(start=cursor, end=boundary, text=phrase.upper(), emphasis=emphasis))
            cursor = boundary

    ASSETS.mkdir(exist_ok=True)
    soundfile.write(ASSETS / f"{output}.wav", mix, RATE, subtype="PCM_16")
    (ASSETS / f"{output}.json").write_text(json.dumps(captions, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
