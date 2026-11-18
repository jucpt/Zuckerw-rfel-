"""Erzeugt einen einfachen, lizenzfreien Synth-Beat als Platzhalter-Musik.

Aufruf:  python3 scripts/make_music.py [sekunden] [bpm] [ausgabe]
Beispiel: python3 scripts/make_music.py 16 120 public/musik-beispiel.mp3
"""
import subprocess, sys, wave, tempfile, os
import numpy as np

dur = float(sys.argv[1]) if len(sys.argv) > 1 else 16
bpm = float(sys.argv[2]) if len(sys.argv) > 2 else 120
out = sys.argv[3] if len(sys.argv) > 3 else "public/musik-beispiel.mp3"
SR = 44100
t = np.arange(int(dur * SR)) / SR
beat = 60 / bpm
y = np.zeros_like(t)

# Pad: Am - F - C - G, je 2 Takte
chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [130.81, 196.0, 261.63], [196.0, 246.94, 293.66]]
bar = 4 * beat
for i, ch in enumerate(chords * 8):
    a = i * 2 * bar
    if a >= dur:
        break
    m = (t >= a) & (t < a + 2 * bar)
    tt = t[m] - a
    env = np.minimum(1, tt / 0.4) * np.minimum(1, (2 * bar - tt) / 0.4)
    for f in ch:
        y[m] += 0.05 * env * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.003 * tt))
    # Bass auf jeder Zählzeit
    for k in range(8):
        b = a + k * beat
        mb = (t >= b) & (t < b + beat * 0.9)
        tb = t[mb] - b
        y[mb] += 0.18 * np.exp(-tb * 5) * np.sin(2 * np.pi * ch[0] / 2 * tb)

n = int(dur / beat) + 1
for k in range(n):
    b = k * beat
    # Kick
    mk = (t >= b) & (t < b + 0.3)
    tk = t[mk] - b
    y[mk] += 0.55 * np.exp(-tk * 18) * np.sin(2 * np.pi * (50 + 120 * np.exp(-tk * 40)) * tk)
    # Hi-Hat auf der Achtel
    h = b + beat / 2
    mh = (t >= h) & (t < h + 0.05)
    y[mh] += 0.06 * np.exp(-(t[mh] - h) * 90) * np.random.default_rng(k).uniform(-1, 1, mh.sum())
    # Clap auf 2 und 4
    if k % 2 == 1:
        mc = (t >= b) & (t < b + 0.15)
        y[mc] += 0.15 * np.exp(-(t[mc] - b) * 30) * np.random.default_rng(k + 99).uniform(-1, 1, mc.sum())

y = np.tanh(y * 1.2) * 0.8
pcm = (y * 32767).astype(np.int16)
tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
with wave.open(tmp, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-b:a", "128k", out], check=True)
os.remove(tmp)
print("geschrieben:", out)
