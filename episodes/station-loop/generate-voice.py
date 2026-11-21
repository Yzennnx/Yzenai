import runpy
from pathlib import Path

import numpy as np
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS


ROOT = Path(__file__).resolve().parent
previous = ROOT.parent / "mud-cookies" / "generate-voice.py"
helpers = runpy.run_path(str(previous), run_name="voice_helpers")
assets = ROOT / "assets"
assets.mkdir(exist_ok=True)
rate = helpers["RATE"]
tools = helpers["PILOT"]["VOICE_TOOLS"]

rows = [
    (.16, 3.12, ["What if every exit", "led back to this bench?"], "EXIT BENCH"),
    (3.46, 4.65, ["You push through."], "PUSH"),
    (5.72, 7.82, ["And step right back in."], "BACK"),
    (8.25, 9.97, ["Same bench. Same ticket."], "SAME TICKET"),
    (10.03, 11.95, ["The door sent you", "across the room."], "ACROSS"),
]

torch.set_num_threads(6)
model = ChatterboxTurboTTS.from_local(tools / "nano", device="cpu", nano=True)
model.prepare_conditionals(str(tools / "voice-reference.wav"))
for take, speed, offset in [("measured", 1, 0), ("quick", 1.13, -.12)]:
    torch.manual_seed(24 if take == "measured" else 19)
    mix = np.zeros(12 * rate, dtype=np.float32)
    timed = [(start + (offset if i in (1, 2) else 0), limit, pages, stress)
             for i, (start, limit, pages, stress) in enumerate(rows)]
    helpers["save"](f"opening-{take}", mix, helpers["record"](model, timed, mix, speed), assets)
