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
    (0.20, 3.10, ["What happens when", "you die in your dream?"], "DIE DREAM"),
    (4.35, 6.33, ["You open your eyes", "on the pavement."], "PAVEMENT"),
    (6.39, 7.98, ["Then you hear", "your alarm."], "ALARM"),
    (8.25, 9.70, ["Same room. Same bed."], "SAME"),
    (10.03, 12.65, ["So who just", "turned it off?"], "WHO OFF"),
]
REST = [
    (13.12, 15.53, ["You follow yourself", "into the hall."], "YOURSELF"),
    (15.65, 17.75, ["Someone comes", "toward you."], "TOWARD"),
    (17.89, 20.90, ["You call out,", "and they walk", "right through you."], "THROUGH"),
    (21.04, 22.92, ["Then they say", "good morning."], "MORNING"),
    (23.10, 26.65, ["In the bathroom,", "you put both hands", "on the sink."], "HANDS"),
    (26.78, 29.53, ["In the mirror", "there's only one face."], "ONE FACE"),
    (30.10, 31.89, ["Then its eyes move."], "EYES MOVE"),
    (32.00, 33.88, ["It's looking", "right at you."], "YOU"),
    (34.16, 36.55, ["You get between it", "and the front door."], "BETWEEN"),
    (36.70, 38.25, ["It grabs your wrist."], "WRIST"),
    (38.55, 40.35, ["You can feel", "every finger."], "EVERY FINGER"),
    (40.66, 43.17, ["Then it leans in", "and whispers."], "WHISPERS"),
    (43.50, 44.67, ["Let go."], "LET GO"),
    (45.21, 47.81, ["Now you're hanging", "from the same ledge."], "SAME LEDGE"),
    (47.91, 49.00, ["You look up."], "UP"),
    (49.15, 50.30, ["It's there."], "THERE"),
    (50.76, 54.36, ["It lifts one finger,", "then another."], "ONE ANOTHER"),
    (55.25, 58.85, ["And just before you hit,", "you hear your alarm again."], "ALARM AGAIN"),
]
CARDIAC_OPENING = [
    (0.20, 3.12, ["What if your heart stopped", "while you were dreaming?"], "HEART STOPPED"),
    (3.42, 5.68, ["In the dream,", "you're falling."], "FALLING"),
    (6.18, 8.77, ["In the bedroom,", "your partner hears a gasp."], "GASP"),
    (8.92, 12.07, ["They say your name", "and shake your shoulder."], "SHAKE"),
    (12.19, 13.91, ["You don't respond."], "RESPOND"),
]
CARDIAC_REST = [
    (14.16, 17.21, ["Your heart's electrical rhythm", "has gone haywire."], "RHYTHM HAYWIRE"),
    (17.39, 20.35, ["It's stopped pumping", "blood effectively."], "PUMPING BLOOD"),
    (20.60, 22.87, ["Those gasps aren't", "normal breathing."], "NORMAL BREATHING"),
    (23.10, 30.43, ["Your partner calls", "emergency services,", "puts the phone on speaker,", "and starts CPR."], "EMERGENCY CPR"),
    (30.64, 35.92, ["They're trying to keep", "blood moving", "until help arrives."], "BLOOD MOVING"),
    (36.15, 39.75, ["The paramedics find", "a rhythm they can shock."], "SHOCK"),
    (39.97, 43.03, ["For a moment,", "everyone backs away."], "BACKS AWAY"),
    (43.65, 46.72, ["Then they go", "right back to work."], "BACK WORK"),
    (47.25, 48.75, ["You survive."], "SURVIVE"),
    (48.97, 53.06, ["Later, doctors find", "a rare condition", "called Brugada syndrome."], "BRUGADA SYNDROME"),
    (53.18, 56.76, ["It can trigger", "a dangerous heart rhythm", "during sleep."], "DANGEROUS SLEEP"),
    (56.90, 59.74, ["That night, your partner", "heard you gasp."], "HEARD GASP"),
]


def read(model, rows, mix, speed=1.0):
    cues = []
    pitch = 2 ** (0.5 / 12)
    for start, limit, pages, emphasis in rows:
        sentence = " ".join(pages)
        spoken = sentence.replace("Brugada", "Broo-gah-duh")
        wav = model.generate(spoken, temperature=0.65, top_p=0.92).squeeze().cpu().numpy()
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
model = ChatterboxTurboTTS.from_local(PILOT["VOICE_TOOLS"] / "nano", device="cpu", nano=True)
model.prepare_conditionals(str(PILOT["VOICE_TOOLS"] / "voice-reference.wav"))
ASSETS.mkdir(exist_ok=True)
args = sys.argv[1:]
cardiac = "--cardiac" in args
if cardiac:
    args.remove("--cardiac")
prefix = "cardiac-" if cardiac else ""
opening_duration = 14 if cardiac else 13
opening_rows = CARDIAC_OPENING if cardiac else OPENING
if args:
    assert len(args) == 1
    take = args[0]
    assert take in {"measured", "quick"}
    opening, sample_rate = soundfile.read(ASSETS / f"{prefix}opening-{take}.wav", dtype="float32")
    assert sample_rate == RATE and len(opening) == opening_duration * RATE
    cues = json.loads((ASSETS / f"{prefix}opening-{take}.json").read_text(encoding="utf-8"))
    mix = np.zeros(RATE * 60, dtype=np.float32)
    mix[:len(opening)] = opening
    torch.manual_seed(19)
    cues += read(model, CARDIAC_REST if cardiac else REST, mix)
    if not cardiac:
        whisper = mix[round(43.5 * RATE):round(44.67 * RATE)]
        whisper *= .69
        reflection = whisper[:round(.78 * RATE)].copy()
        delay = round(43.67 * RATE)
        mix[delay:delay + len(reflection)] += .11 * reflection
    save(f"{prefix}episode-voice", mix, cues)
    if cardiac:
        dispatch = np.zeros(RATE * 2, dtype=np.float32)
        read(model, [(0.10, 1.72, ["Help is on the way."], "")], dispatch, speed=1.06)
        soundfile.write(ASSETS / "cardiac-dispatch.wav", dispatch, RATE, subtype="PCM_16")
else:
    for name, advance, speed in [("measured", 0, 1), ("quick", .11, 1.13)]:
        torch.manual_seed(19)
        mix = np.zeros(RATE * opening_duration, dtype=np.float32)
        rows = [(start - (advance if index else 0), limit, pages, emphasis)
                for index, (start, limit, pages, emphasis) in enumerate(opening_rows)]
        save(f"{prefix}opening-{name}", mix, read(model, rows, mix, speed))
