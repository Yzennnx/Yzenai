import runpy
from pathlib import Path

import numpy as np
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS

ROOT = Path(__file__).resolve().parent
helpers = runpy.run_path(str(ROOT.parent / "mud-cookies" / "generate-voice.py"), run_name="voice_helpers")
assets = ROOT / "assets"
assets.mkdir(exist_ok=True)
rate = helpers["RATE"]
tools = helpers["PILOT"]["VOICE_TOOLS"]

opening = [
    (.12, 4.65, ["What if you touched uranium", "and then swallowed it?"], "TOUCHED URANIUM SWALLOWED"),
    (4.82, 9.37, ["You touch the crumb.", "Your skin blocks", "its alpha particles."], "SKIN ALPHA"),
    (10.47, 15.58, ["Okay. Now it's inside you.", "Being inside your gut", "and getting into", "your blood are two", "different things."], "INSIDE GUT BLOOD"),
]
rest = [
    (15.70, 21.80, ["Most of the uranium", "you swallowed keeps going", "through your gut", "and passes out", "in your stool."], "MOST STOOL"),
    (22.07, 27.13, ["Then you see", "the label. Uranium.", "Here's the part", "that matters now."], "LABEL URANIUM"),
    (27.26, 33.86, ["Some can dissolve", "and enter your blood.", "How much gets through", "depends on what form", "the uranium is in."], "DISSOLVE BLOOD"),
    (34.10, 40.72, ["And where does", "that blood go?", "Among other places,", "your kidneys.", "They're constantly", "processing your blood."], "KIDNEYS"),
    (40.87, 47.78, ["If enough uranium", "gets absorbed,", "it can damage", "the tiny tubes", "inside your kidneys.", "That's the metal's", "chemical toxicity."], "TUBES CHEMICAL TOXICITY"),
    (48.18, 53.83, ["Later, a urine test", "can help check", "for exposure", "and signs of injury."], "TEST EXPOSURE INJURY"),
    (54.04, 58.95, ["Your hand still looks", "exactly the same.", "The question is what", "happened inside."], "SAME INSIDE"),
]

torch.set_num_threads(6)
model = ChatterboxTurboTTS.from_local(tools / "nano", device="cpu", nano=True)
model.prepare_conditionals(str(tools / "voice-reference.wav"))
for name, seed, speed in [("measured", 24, 1), ("quick", 19, 1.1)]:
    torch.manual_seed(seed)
    mix = np.zeros(rate * 16, dtype=np.float32)
    cues = helpers["record"](model, opening, mix, speed)
    helpers["save"](f"opening-{name}", mix, cues, assets)
    if name == "measured":
        chosen_audio, chosen_cues = mix, cues

torch.manual_seed(29)
mix = np.zeros(rate * 60, dtype=np.float32)
mix[:len(chosen_audio)] = chosen_audio
helpers["save"]("episode-voice", mix, chosen_cues + helpers["record"](model, rest, mix), assets)
