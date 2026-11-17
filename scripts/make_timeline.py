"""Leitet alle Szenenwechsel und Effekt-Zeitpunkte aus public/transcript.json ab.
Ergebnis: src/timeline.json (wird von Remotion UND vom Sounddesign gelesen)."""
import json, re, subprocess

FPS = 30
tr = json.load(open("public/transcript.json", encoding="utf-8"))
words = [w for s in tr["segments"] for w in s["words"]]
norm = lambda s: re.sub(r"[^\wäöüß]", "", s.lower())

def W(word, occ=1, key="start"):
    hits = [w for w in words if norm(w["word"]) == word]
    if len(hits) < occ:
        raise SystemExit(f"Wort '{word}' ({occ}.) nicht im Transkript")
    return round(hits[occ - 1][key], 3)

dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                     "-of", "csv=p=0", "public/voice.mp3"]).decode())
frames = round(dur * FPS)
voice_end = round(words[-1]["end"], 3)

scenes = {
    "s1": [0, W("dein")],
    "s2": [W("dein"), W("wäre", 1)],
    "s3": [W("wäre", 1), W("presst")],
    "s4": [W("presst"), W("nur")],
    "s5": [W("nur"), W("und", 2)],
    "s6": [W("und", 2), round(frames / FPS, 3)],
}
ev = {
    "suckStart": W("passt"), "cubeHit": W("zuckerwürfel", 1), "keinWitz": W("kein"), "witz": W("witz"),
    "handIn": W("dein"), "handZoom": W("besteht"), "atomArrive": W("atomen"),
    "atomePunch": W("atome"), "fast": W("fast"), "leer": W("leer"),
    "atomkern": W("atomkern"), "erbse": W("erbse"), "pullStart": W("wäre", 2), "stadion": W("fußballstadion"),
    "counterStart": W("presst"), "eight": W("8"), "counterEnd": W("menschen"),
    "riserStart": W("menschen"), "implode": W("bleibt"), "wuerfel": W("würfel"), "kaum": W("kaum"),
    "zucker2": W("zuckerwürfel", 2),
    "nur": W("nur"), "fallStart": W("wiegt"), "impact": W("500"), "millionen": W("millionen"), "tonnen": W("tonnen"),
    "handCalm": W("und", 2), "hand": W("hand"),
    "loopStart": round(frames / FPS - 0.75, 3),  # Übergang zurück zu Szene 1
    "voiceEnd": voice_end,
}
# Globale Eye-Catcher (ca. alle 2 s): punch = Zoom-Punch, flash = Lichtblitz, glitch = Glitch
fx = []
for k in ["cubeHit", "atomePunch", "erbse", "eight", "wuerfel", "zucker2", "millionen", "atomArrive", "kaum", "pullStart", "fallStart"]:
    fx.append({"t": ev[k], "type": "punch", "src": k})
for k in ["stadion", "implode", "impact", "tonnen", "handCalm"]:
    fx.append({"t": ev[k], "type": "flash", "src": k})
for k in ["keinWitz", "handIn", "leer", "counterStart", "nur"]:
    fx.append({"t": ev[k], "type": "glitch", "src": k})
fx.append({"t": scenes["s3"][0], "type": "glitch", "src": "s3"})
fx.sort(key=lambda e: e["t"])

out = {"fps": FPS, "duration": dur, "durationInFrames": frames, "scenes": scenes, "ev": ev, "fx": fx}
json.dump(out, open("src/timeline.json", "w"), indent=1)
ts = sorted(e["t"] for e in fx)
print("Dauer", dur, "frames", frames)
print("größte Lücke zwischen Effekten:", max(b - a for a, b in zip([0] + ts, ts + [dur])))
