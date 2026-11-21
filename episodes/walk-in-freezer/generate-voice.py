import json
import runpy
import sys
from pathlib import Path

import numpy as np
import soundfile
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS

ROOT = Path(__file__).resolve().parent
helpers = runpy.run_path(str(ROOT.parent / "mud-cookies" / "generate-voice.py"), run_name="voice_helpers")
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)
RATE = helpers["RATE"]
TOOLS = helpers["PILOT"]["VOICE_TOOLS"]

OPENING = [
    (0.15, 3.35, ["What if you got locked", "in a minus twenty freezer?"], "LOCKED MINUS TWENTY FREEZER"),
    (3.55, 5.35, ["You hit the metal bar."], "METAL BAR"),
    (6.05, 7.95, ["Your palm freezes", "right to it."], "PALM FREEZES"),
    (8.15, 13.85, ["Subzero aluminum pulls heat out", "faster than blood can replace it.", "One yank tears raw skin."], "ALUMINUM HEAT TEARS SKIN"),
]

REST = [
    (14.15, 21.85, ["Minutes in, your body", "narrows blood vessels", "in your fingers and toes.", "It sacrifices your hands", "to protect your core."], "NARROWS FINGERS SACRIFICES CORE"),
    (22.20, 31.80, ["Next comes violent shivering", "to burn fuel for heat.", "Your stiff fingers lose grip,", "and your thoughts start to slow."], "VIOLENT SHIVERING STIFF SLOW"),
    (32.15, 40.85, ["Below thirty-two degrees,", "shivering can actually stop.", "That is not relief.", "Your exhausted blood vessels", "suddenly fly wide open."], "THIRTYTWO STOP NOT WIDE OPEN"),
    (41.15, 49.70, ["Warm blood floods your cold skin", "in a fake wave of heat.", "Confused, you even reach", "to loosen your tie...", "until the light flickers."], "FAKE HEAT LOOSEN TIE FLICKERS"),
    (50.10, 56.90, ["You slam the glowing safety plunger.", "Nothing moves.", "Moisture froze the rod solid.", "There is no way out."], "NOTHING MOVES FROZE SOLID NO OUT"),
    (57.15, 63.55, ["Below twenty-eight degrees,", "your cold heart stops beating.", "At minus twenty, the freezer", "never warms up.", "And neither do you."], "TWENTYEIGHT STOPS BEATING NEVER NEITHER"),
]

if __name__ == "__main__":
    torch.set_num_threads(6)
    model = ChatterboxTurboTTS.from_local(TOOLS / "nano", device="cpu", nano=True)
    model.prepare_conditionals(str(TOOLS / "voice-reference.wav"))

    if len(sys.argv) == 1:
        for name, seed, speed, delay in [
            ("measured", 24, 1.0, 0.0),
            ("quick", 19, 1.11, -0.08),
        ]:
            torch.manual_seed(seed)
            mix = np.zeros(RATE * 14, dtype=np.float32)
            timed = [
                (start + (delay if i in (1, 2) else 0.0), limit, pages, stress)
                for i, (start, limit, pages, stress) in enumerate(OPENING)
            ]
            cues = helpers["record"](model, timed, mix, speed)
            helpers["save"](f"opening-{name}", mix, cues, ASSETS)
    elif sys.argv[1] == "ending":
        # Reuse verified 0..49.8s audio & cues verbatim; regenerate only 50..64s ending lines!
        prev_wav, rate = soundfile.read(ASSETS / "episode-voice.wav", dtype="float32")
        assert rate == RATE and len(prev_wav) == 64 * RATE
        prev_cues = json.loads((ASSETS / "episode-voice.json").read_text(encoding="utf-8"))
        kept_cues = [c for c in prev_cues if c["start"] < 50.0]
        mix = prev_wav.copy()
        mix[int(50.0 * RATE):] = 0.0
        torch.manual_seed(33)
        new_cues = helpers["record"](model, REST[-2:], mix, 1.0)
        helpers["save"]("episode-voice", mix, kept_cues + new_cues, ASSETS)
    else:
        take = sys.argv[1]
        assert take in ("measured", "quick"), "Choose measured, quick, or ending"
        opening_wav, rate = soundfile.read(ASSETS / f"opening-{take}.wav", dtype="float32")
        assert rate == RATE and len(opening_wav) == 14 * RATE
        opening_cues = json.loads((ASSETS / f"opening-{take}.json").read_text(encoding="utf-8"))
        torch.manual_seed(29)
        mix = np.zeros(RATE * 64, dtype=np.float32)
        mix[:len(opening_wav)] = opening_wav
        cues = opening_cues + helpers["record"](model, REST, mix, 1.0)
        helpers["save"]("episode-voice", mix, cues, ASSETS)
