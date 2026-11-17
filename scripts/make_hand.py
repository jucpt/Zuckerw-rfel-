"""Erzeugt eine stilisierte Hand-Silhouette (eigene Vektorgrafik) als SVG-Pfad + Punktwolke."""
import json, math
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union
from shapely import affinity

# Koordinatensystem 1000 x 1200, Handfläche zum Betrachter, Finger nach oben
palm = Polygon([(290, 640), (700, 640), (720, 900), (640, 1080), (360, 1080), (280, 900)]).buffer(60, join_style=1)
fingers = [
    # (Basis x, Basis y, Länge, Breite, Winkel in Grad, 0 = senkrecht)
    (345, 660, 360, 92, -9),   # kleiner Finger ist Index 0 (links)
    (448, 620, 470, 100, -3),
    (555, 610, 500, 102, 2),
    (660, 640, 430, 98, 8),
]
parts = [palm]
for bx, by, L, w, ang in fingers:
    a = math.radians(ang)
    tip = (bx + math.sin(a) * L, by - math.cos(a) * L)
    parts.append(LineString([(bx, by + 40), tip]).buffer(w / 2, cap_style=1))
# Daumen schräg nach rechts außen
parts.append(LineString([(640, 960), (790, 820), (880, 640)]).buffer(54, cap_style=1, join_style=1))
hand = unary_union(parts).buffer(18, join_style=1).buffer(-18, join_style=1)
hand = hand.simplify(1.2)
ext = list(hand.exterior.coords)
d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in ext) + " Z"

# Linien der Handfläche + Fingergelenke (Details)
details = [
    "M330,830 Q480,790 640,800",
    "M350,900 Q470,880 560,960",
    "M520,1040 Q540,900 600,800",
]
for bx, by, L, w, ang in fingers:
    a = math.radians(ang)
    for f in (0.38, 0.68):
        cx, cy = bx + math.sin(a) * L * f, by - math.cos(a) * L * f
        dx, dy = math.cos(a) * w * 0.28, math.sin(a) * w * 0.28
        details.append(f"M{cx-dx:.1f},{cy-dy:.1f} L{cx+dx:.1f},{cy+dy:.1f}")

# Punktwolke: Umriss + Füllung (für die "Partikel-Hand")
import random
random.seed(7)
outline = LineString(ext)
pts = []
n_out = 700
for i in range(n_out):
    p = outline.interpolate(i / n_out, normalized=True)
    pts.append([round(p.x, 1), round(p.y, 1), 1])
minx, miny, maxx, maxy = hand.bounds
while len(pts) < n_out + 650:
    x, y = random.uniform(minx, maxx), random.uniform(miny, maxy)
    if hand.contains(Point(x, y)) and hand.exterior.distance(Point(x, y)) > 14:
        pts.append([round(x, 1), round(y, 1), 0])
json.dump({"viewBox": [0, 0, 1000, 1200], "outline": d, "details": details, "points": pts},
          open("src/hand.json", "w"))
print(len(ext), "Umrisspunkte,", len(pts), "Partikel")
