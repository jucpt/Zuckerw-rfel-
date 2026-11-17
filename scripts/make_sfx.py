"""Sounddesign komplett per Code (numpy): Drone mit Sidechain-Ducking auf die Stimme,
Whooshes, Ticks, Riser, Implosion, Boom, Glitches. Ausgabe: public/sfx.wav (48 kHz Stereo)."""
import json, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt, sosfiltfilt

SR = 48000
tl = json.load(open("src/timeline.json"))
ev, sc = tl["ev"], tl["scenes"]
DUR = tl["durationInFrames"] / tl["fps"]
N = int(DUR * SR)
rng = np.random.default_rng(42)
L = np.zeros(N); R = np.zeros(N)

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)
def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)
def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - max(i, 0)]
    if i < 0: sig, i = sig[-i:], 0
    l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    L[i:i + len(sig)] += sig * gain * l * 1.414
    R[i:i + len(sig)] += sig * gain * r * 1.414
def env(n, a, d):  # Attack/Decay in Samples, exponentiell
    t = np.arange(n)
    return np.minimum(1, t / max(a, 1)) * np.exp(-np.maximum(0, t - a) / max(d, 1))

# ---------- Stimme laden -> Hüllkurve für Ducking ----------
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", "public/voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"])
voice = np.frombuffer(raw, np.float32).astype(np.float64)
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
hop = 480
rms = np.sqrt(np.convolve(voice[: len(voice) // hop * hop].reshape(-1, hop).__pow__(2).mean(1), np.ones(3) / 3, "same"))
rms = rms / (rms.max() + 1e-9)
act = np.clip((rms - 0.04) / 0.18, 0, 1)
# Attack 30 ms, Release 350 ms
sm = np.zeros_like(act); a_c, r_c = np.exp(-hop / (0.03 * SR)), np.exp(-hop / (0.35 * SR))
for i in range(1, len(act)):
    c = a_c if act[i] > sm[i - 1] else r_c
    sm[i] = c * sm[i - 1] + (1 - c) * act[i]
speech = np.interp(np.arange(N), np.arange(len(sm)) * hop, sm)

# ---------- Drone (loopt nahtlos: Frequenzen/LFOs ganzzahlig über die Videolänge) ----------
t = np.arange(N) / SR
def cyc(k): return k / DUR  # k ganze Zyklen über die Gesamtlänge -> sauberer Loop
drone = np.zeros(N)
for f, a in [(41.2, 0.5), (55.0, 0.35), (82.4, 0.18), (110.3, 0.08), (164.8, 0.04)]:
    fq = round(f * DUR) / DUR
    drone += a * np.sin(2 * np.pi * fq * t + np.sin(2 * np.pi * cyc(3) * t) * 0.6)
lfo = 0.75 + 0.25 * np.sin(2 * np.pi * cyc(5) * t)
air = bp(rng.standard_normal(N), 180, 900) * 0.25 * (0.6 + 0.4 * np.sin(2 * np.pi * cyc(7) * t + 1))
drone = (drone * lfo + air)
drone /= np.abs(drone).max()
duck = 1.0 - 0.82 * speech          # ~ -15 dB, sobald gesprochen wird
drone_gain = 0.22 * duck
# Fade-in/out minimal, damit der Loop nicht knackt (Drone ist ohnehin periodisch)
L += drone * drone_gain * (1 + 0.15 * np.sin(2 * np.pi * cyc(2) * t))
R += drone * drone_gain * (1 - 0.15 * np.sin(2 * np.pi * cyc(2) * t))

# ---------- Bausteine ----------
def whoosh(d=0.7, lo=300, hi=4000, rev=False):
    n = int(d * SR); x = rng.standard_normal(n)
    out = np.zeros(n); seg = 512
    for s in range(0, n, seg):
        p = s / n; p = 1 - p if rev else p
        fc = lo * (hi / lo) ** p
        out[s:s + seg] = bp(x[max(0, s - 2048):s + seg], fc * 0.7, min(fc * 1.4, SR / 2 - 100))[-len(out[s:s + seg]):]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** (1.5 if not rev else 1.2)
    if rev: e = e * np.linspace(0.3, 1, n)
    return out * e / (np.abs(out).max() + 1e-9)
def tick(f=3200):
    n = int(0.03 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.004) + 0.3 * hp(rng.standard_normal(n), 5000) * np.exp(-tt / 0.002)
def thump(f0=90, f1=40, d=0.5):
    n = int(d * SR); tt = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-tt / 0.06)) / SR
    return np.sin(ph) * np.exp(-tt / (d / 4)) * np.minimum(1, tt / 0.002)
def boom(d=2.6):
    n = int(d * SR); tt = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(28 + 110 * np.exp(-tt / 0.12)) / SR
    body = np.sin(ph) * np.exp(-tt / 0.7)
    crack = lp(rng.standard_normal(n), 2500) * np.exp(-tt / 0.08) * 0.8
    rumble = lp(rng.standard_normal(n), 140, 4) * np.exp(-tt / 0.9) * 2.5
    x = body + crack + rumble
    return np.tanh(1.6 * x) / np.tanh(1.6)
def glitch(d=0.22):
    n = int(d * SR); x = np.zeros(n); s = 0
    while s < n:
        l = int(rng.uniform(0.008, 0.03) * SR)
        kind = rng.integers(3); tt = np.arange(l) / SR
        if kind == 0: seg = np.sign(np.sin(2 * np.pi * rng.uniform(200, 1800) * tt))
        elif kind == 1: seg = rng.standard_normal(l)
        else: seg = np.zeros(l)
        x[s:s + l] = seg[: n - s] * 0.5; s += l
    x = np.round(x * 6) / 6  # Bitcrush
    return hp(x, 400) * np.linspace(1, 0.4, n)
def riser(d):
    n = int(d * SR); tt = np.arange(n) / SR; p = tt / d
    f = 180 * (2600 / 180) ** (p ** 1.6)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    noise = rng.standard_normal(n); nz = np.zeros(n)
    for s in range(0, n, 1024):
        fc = 400 * (8000 / 400) ** p[s]
        nz[s:s + 1024] = bp(noise[max(0, s - 4096):s + 1024], fc * 0.6, min(fc * 1.5, 20000))[-len(nz[s:s + 1024]):]
    x = (0.35 * tone + nz / (np.abs(nz).max() + 1e-9)) * p ** 2.2
    return x
def ping(f=1320, d=1.2):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-tt / 0.35) * np.minimum(1, tt / 0.003)
def suck(d=0.45):
    return whoosh(d, 6000, 200) * np.linspace(0.2, 1, int(d * SR)) ** 2

# ---------- Ereignisse (alle Zeiten aus dem Transkript) ----------
add(whoosh(0.9, 200, 3500), ev["suckStart"] - 0.35, 0.30, -0.3)                 # Menschen in Würfel
add(thump(110, 45, 0.6), ev["cubeHit"], 0.55)
add(ping(880, 1.4), ev["cubeHit"], 0.07, 0.2)
add(thump(80, 35, 0.5), ev["keinWitz"], 0.6); add(glitch(0.25), ev["keinWitz"], 0.16)  # Shake
add(glitch(0.2), ev["handIn"] - 0.05, 0.14); add(whoosh(0.5, 2000, 300, True), ev["handIn"] - 0.25, 0.22)
add(whoosh(0.85, 150, 6000), ev["handZoom"] - 0.15, 0.32, 0.25)                  # Zoom durch die Hand
add(ping(1760, 1.6), ev["atomArrive"], 0.06, -0.3)
add(thump(100, 50, 0.4), ev["atomePunch"], 0.4)
add(whoosh(1.0, 5000, 200, True), ev["fast"] - 0.1, 0.26, -0.25)                  # Zoom raus -> Leere
add(glitch(0.3), ev["leer"], 0.16); add(thump(70, 30, 0.8), ev["leer"], 0.4)
add(glitch(0.22), sc["s3"][0] - 0.03, 0.15); add(whoosh(0.4, 4000, 800), sc["s3"][0] - 0.2, 0.18)
add(ping(1320, 1.4), ev["erbse"], 0.08); add(thump(120, 60, 0.3), ev["erbse"], 0.3)
add(whoosh(2.4, 120, 2500, True), ev["pullStart"] - 0.1, 0.34, 0.2)              # Kamera fährt raus
add(thump(90, 40, 0.8), ev["stadion"], 0.5); add(hp(rng.standard_normal(int(0.6*SR)), 3000) * np.exp(-np.arange(int(0.6*SR))/SR/0.12), ev["stadion"], 0.05)
add(glitch(0.25), sc["s4"][0] - 0.03, 0.15); add(whoosh(0.5, 3000, 300, True), sc["s4"][0] - 0.3, 0.2)
# Zähler-Ticks: gleiche Kurve wie im Video (p^2.2 -> beschleunigend)
c0, c1 = ev["counterStart"], ev["counterEnd"]
for k in range(1, 70):
    p = k / 70
    tt_ = c0 + (c1 - c0) * p ** (1 / 1.9)
    add(tick(2600 + 1200 * p), tt_, 0.10 + 0.08 * p, (rng.random() - 0.5) * 0.6)
add(thump(130, 60, 0.35), ev["eight"], 0.35)
add(riser(ev["implode"] - ev["riserStart"]), ev["riserStart"], 0.22)               # Riser vor Implosion
add(suck(0.32), ev["implode"] - 0.32, 0.35)
add(boom(1.6) * 0.7, ev["implode"], 0.45)
add(thump(140, 60, 0.3), ev["wuerfel"], 0.35)
add(whoosh(0.8, 300, 2000), ev["kaum"] - 0.2, 0.15)
add(thump(110, 45, 0.5), ev["zucker2"], 0.45); add(ping(880, 1.2), ev["zucker2"], 0.05)
add(glitch(0.3), ev["nur"], 0.16)
fall = ev["impact"] - ev["fallStart"]
add(whoosh(fall + 0.05, 300, 5000), ev["fallStart"], 0.32)                         # Fall
add(boom(2.8), ev["impact"], 0.7)                                                 # Aufprall
add(thump(100, 40, 0.6), ev["millionen"], 0.45)
add(thump(80, 32, 0.9), ev["tonnen"], 0.55); add(glitch(0.18), ev["tonnen"], 0.1)
add(whoosh(0.9, 3000, 400, True), ev["handCalm"] - 0.3, 0.16)
add(ping(660, 2.0), ev["hand"], 0.05)
add(suck(0.7), DUR - 0.7, 0.22)                                                    # Loop-Übergang

# ---------- SFX-Bus: leicht unter die Stimme ducken, Präsenzbereich freiräumen ----------
sfx_duck = 1.0 - 0.45 * speech
for ch in (L, R):
    # Sprachband (300 Hz – 4 kHz) der Effekte während der Stimme zusätzlich stark absenken
    mid = sosfiltfilt(butter(2, [300, 4000], "band", fs=SR, output="sos"), ch)
    ch -= mid * 0.8 * speech
    ch *= sfx_duck
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.2) / 1.2
peak = np.abs(mix).max()
mix = mix / peak * 0.5   # Headroom: Stimme bleibt dominant (≈ -6 dBFS Peak für SFX)
# Kurzer Fade an den Rändern gegen Knackser
f = int(0.01 * SR); mix[:f] *= np.linspace(0, 1, f)[:, None]; mix[-f:] *= np.linspace(1, 0, f)[:, None]
pcm = (mix * 32767).astype(np.int16)
with wave.open("public/sfx.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("sfx.wav", len(pcm) / SR, "s")
