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
    (0.18, 3.11, ["What if that water", "was concentrated bleach?"], "WATER BLEACH"),
    (3.80, 5.16, ["You take one sip."], "SIP"),
    (5.55, 7.64, ["Then your throat", "starts to burn."], "THROAT BURN"),
    (7.90, 10.78, ["The active ingredient", "is sodium hypochlorite."], "SODIUM HYPOCHLORITE"),
    (10.91, 14.82, ["In a concentrated solution,", "it can injure", "the tissue it touches."], "TISSUE TOUCHES"),
]
REST = [
    (15.25, 19.08, ["In a severe case,", "the tissue in your throat", "can swell."], "SWELL"),
    (19.28, 23.00, ["That leaves less room", "for air to get through."], "AIR"),
    (24.35, 26.32, ["Your shoulders lift."], "SHOULDERS"),
    (26.78, 29.50, ["You open your mouth wider."], "WIDER"),
    (31.37, 35.65, ["And it’s still hard", "to pull in a breath."], "BREATH"),
    (36.37, 39.73, ["The glass still", "looks ordinary."], "ORDINARY"),
    (40.05, 45.40, ["If someone swallows bleach,", "get medical help", "immediately."], "MEDICAL HELP IMMEDIATELY"),
]
REVISION_OPENING = [
    (0.18, 3.20, ["What if that water", "was concentrated bleach?"], "WATER BLEACH"),
    (3.62, 4.96, ["You take one sip."], "SIP"),
    (5.28, 9.86, ["By the time you", "set the glass down,", "your throat feels", "like it's on fire."], "THROAT FIRE"),
    (10.06, 13.54, ["That's sodium hypochlorite,", "the active ingredient", "in bleach."], "SODIUM HYPOCHLORITE"),
    (13.62, 17.92, ["In a concentrated solution,", "it can injure tissue", "as soon as it touches it."], "INJURE TISSUE"),
]
REVISION_REST = [
    (18.04, 21.52, ["You lean over the counter,", "waiting for the burning to ease."], "LEAN BURNING"),
    (21.61, 23.90, ["Then it gets harder", "to breathe."], "BREATHE"),
    (24.05, 27.02, ["In a severe case,", "your throat can swell."], "SWELL"),
    (27.12, 29.96, ["That leaves less room", "for air to pass."], "ROOM AIR"),
    (30.08, 34.00, ["Back at the counter,", "your shoulders lift", "with every breath."], "SHOULDERS BREATH"),
    (34.42, 38.92, ["You open your mouth wider,", "and it still feels like", "you can't get enough air."], "WIDER AIR"),
    (39.11, 41.12, ["The pain doubles you over."], "PAIN"),
    (41.48, 43.58, ["Your hand slips", "off the counter."], "SLIPS"),
    (44.48, 47.59, ["One knee hits the tile,", "then the other."], "KNEE TILE"),
    (48.14, 50.24, ["You can just reach the phone."], "PHONE"),
    (50.38, 54.77, ["You drag it over the edge", "and hit the emergency", "call button."], "EMERGENCY CALL"),
    (55.00, 59.84, ["If someone swallows bleach", "and has trouble breathing,", "get emergency help now."], "EMERGENCY HELP NOW"),
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
args = sys.argv[1:]
revision = "--revision" in args
if revision:
    args.remove("--revision")
prefix = "revision-" if revision else ""
opening_duration = 18 if revision else 15
episode_duration = 60 if revision else 46
if args:
    assert len(args) == 1 and args[0] in {"measured", "quick"}, "Expected measured or quick"
    source = f"{prefix}opening-{args[0]}"
    opening, sample_rate = soundfile.read(ASSETS / f"{source}.wav", dtype="float32")
    assert sample_rate == RATE and len(opening) == RATE * opening_duration
    cues = json.loads((ASSETS / f"{source}.json").read_text(encoding="utf-8"))
    mix = np.zeros(RATE * episode_duration, dtype=np.float32)
    mix[:len(opening)] = opening
    save(f"{prefix}episode-voice", mix, cues + read(model, REVISION_REST if revision else REST, mix))
else:
    for name, wait, speed in [("measured", 0, 1), ("quick", -.20, 1.13)]:
        torch.manual_seed(19)
        mix = np.zeros(RATE * opening_duration, dtype=np.float32)
        rows = [(start + (wait if index else 0), limit, pages, emphasis)
                for index, (start, limit, pages, emphasis) in enumerate(REVISION_OPENING if revision else OPENING)]
        save(f"{prefix}opening-{name}", mix, read(model, rows, mix, speed))

