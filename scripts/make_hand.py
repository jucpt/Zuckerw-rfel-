"""Erzeugt eine anatomisch stilisierte Hand (eigene Vektorgrafik) als SVG-Pfad + Punktwolke.
Handfläche zum Betrachter, Finger leicht gespreizt, Daumen rechts."""
import json, math, random
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union

def taper(points, widths):
    """Spitz zulaufende Kapsel entlang eines Polygonzugs (Breite je Stützpunkt)."""
    circles = [Point(p).buffer(w / 2, 48) for p, w in zip(points, widths)]
    return unary_union([unary_union([a, b]).convex_hull for a, b in zip(circles, circles[1:])])

def finger(base, length, angle, wb, wt, bend=0.0):
    """Finger mit 3 Gliedern, minimal gekrümmt."""
    pts, ws = [], []
    a = math.radians(angle)
    x, y = base
    seg = [0.0, 0.45, 0.75, 1.0]
    for i, f in enumerate(seg):
        aa = a + math.radians(bend) * f
        px = base[0] + math.sin(aa) * length * f
        py = base[1] - math.cos(aa) * length * f
        pts.append((px, py)); ws.append(wb + (wt - wb) * f)
    return taper(pts, ws), pts, ws

# Fingerdaten: (Basis, Länge, Winkel, Breite Basis, Breite Spitze, Krümmung)
FINGERS = [
    ((340, 640), 270, -16, 78, 60, -3),   # kleiner Finger
    ((433, 600), 350, -6.5, 86, 68, -2),  # Ringfinger
    ((532, 590), 385, 1, 88, 70, 0),      # Mittelfinger
    ((628, 604), 345, 9.5, 86, 68, 2),    # Zeigefinger
]
parts, joints = [], []
for base, L, ang, wb, wt, bend in FINGERS:
    g, pts, ws = finger(base, L, ang, wb, wt, bend)
    parts.append(g)
    # Gelenkfalten bei 45 % und 75 %
    for i in (1, 2):
        (x0, y0), (x1, y1) = pts[i - 1], pts[i + 1]
        dx, dy = x1 - x0, y1 - y0
        n = math.hypot(dx, dy); nx, ny = -dy / n, dx / n
        hw = ws[i] * 0.26
        joints.append(f"M{pts[i][0] - nx * hw:.1f},{pts[i][1] - ny * hw:.1f} Q{pts[i][0]:.1f},{pts[i][1] + 5:.1f} {pts[i][0] + nx * hw:.1f},{pts[i][1] + ny * hw:.1f}")

# Handfläche: oben breit (Knöchellinie leicht gebogen), zum Handgelenk schmaler
palm = Polygon([
    (312, 700), (335, 645), (365, 615), (530, 595), (650, 610), (668, 645),
    (712, 800), (690, 930), (640, 1010), (600, 1060),
    (398, 1060), (345, 995), (308, 890), (306, 780),
]).buffer(40, join_style=1).buffer(-22, join_style=1)
# Daumen: zwei Glieder, schräg nach außen, mit Daumenballen
thumb = taper([(610, 980), (735, 860), (815, 745), (862, 640)], [150, 108, 88, 74])
thenar = Polygon([(560, 1050), (650, 960), (750, 850), (705, 765), (660, 800), (560, 900)]).buffer(40, join_style=1)
# Handgelenk-Ansatz
wrist = Polygon([(392, 1000), (606, 1000), (592, 1200), (406, 1200)])
hand = unary_union(parts + [palm, thumb, thenar, wrist])
hand = hand.buffer(16, join_style=1).buffer(-16, join_style=1)  # U-förmige Fingerzwischenräume
hand = hand.buffer(-6, join_style=1).buffer(6, join_style=1)    # Ecken abrunden
hand = hand.simplify(1.0)

def chaikin(pts, it=3):
    for _ in range(it):
        out = []
        for i in range(len(pts)):
            (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
            out += [(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1), (0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1)]
        pts = out
    return pts
ring = chaikin(list(hand.exterior.coords)[:-1])
hand = Polygon(ring)
# Handgelenk offen lassen: untere Kante (y > 1170) nicht zeichnen, Pfad beginnt/endet am Handgelenk
i0 = max(range(len(ring)), key=lambda i: ring[i][1])
ring = ring[i0:] + ring[:i0]
open_ring = [p for p in ring if p[1] < 1170]
ext = open_ring
d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in ext)

details = [
    "M322,800 Q470,758 664,786",          # Herzlinie
    "M676,858 Q560,840 455,888 Q405,912 380,958",  # Kopflinie
    "M650,895 Q590,965 596,1060",        # Lebenslinie
] + joints

random.seed(7)
outline = LineString(ext)
pts = []
n_out = 760
for i in range(n_out):
    p = outline.interpolate(i / n_out, normalized=True)
    pts.append([round(p.x, 1), round(p.y, 1), 1])
minx, miny, maxx, maxy = hand.bounds
while len(pts) < n_out + 650:
    x, y = random.uniform(minx, maxx), random.uniform(miny, maxy)
    if hand.contains(Point(x, y)) and hand.exterior.distance(Point(x, y)) > 14:
        pts.append([round(x, 1), round(y, 1), 0])
center = [round((minx + maxx) / 2, 1), round((miny + maxy) / 2, 1)]
json.dump({"viewBox": [0, 0, 1000, 1200], "outline": d, "details": details, "points": pts,
           "center": center, "palm": [520, 870]}, open("src/hand.json", "w"))
print(len(ext), "Umrisspunkte,", len(pts), "Partikel, Mitte", center, "bounds", [round(v) for v in hand.bounds])
