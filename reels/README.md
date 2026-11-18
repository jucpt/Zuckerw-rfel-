# Reel-Vorlage

Ein neues Hochformat-Reel (1080×1920, 30 fps) entsteht nur durch eine JSON-Datei in `reels/`.
Texte, Farben, Schriften, Timing, Effekte, Musik und Untertitel stehen alle dort. Der Code in
`src/template/` muss dafür nicht angefasst werden.

## Neues Reel in 4 Schritten

1. `reels/beispiel.json` kopieren, z. B. nach `reels/mein-reel.json`.
2. Bilder, Videos, Musik, Sprachaufnahme und Transkript nach `public/` legen.
3. Texte, Farben und Zeiten in der Kopie anpassen.
4. Vorschau oder Rendern:

```bash
# Vorschau im Browser (Props lassen sich dort auch live ändern)
npx remotion studio src/template/index.ts --props=reels/mein-reel.json

# Video rendern
npx remotion render src/template/index.ts Reel out/mein-reel.mp4 --props=reels/mein-reel.json
```

Ohne `--props` wird `reels/beispiel.json` benutzt.

## Aufbau der Konfiguration

| Feld | Bedeutung |
|---|---|
| `duration` | Länge in Sekunden, oder `"auto"` = Ende des Transkripts + 0,6 s |
| `format` | `width`, `height`, `fps` (Standard 1080 × 1920, 30) |
| `colors` | `background`, `primary`, `accent`, `secondary`, `text` als Hex-Farben |
| `fonts` | `headline` und `body`, jeweils `family`, `file` (in `public/`), `weight` |
| `audio.music` | Musik: `file`, `volume` (0–1), `fadeIn`, `fadeOut`, `startFrom`, `loop` |
| `audio.voice` | Sprachaufnahme, gleiche Felder wie Musik |
| `audio.sounds` | Einzelne Sounds: `[{ "file": "whoosh.wav", "at": 2.4, "volume": 0.8 }]` |
| `subtitles` | `null` (aus) oder `{ "transcript": "transcript.json", "maxWords": 3, "keywords": ["zuckerwürfel", "8 milliarden"], "uppercase": true }` |
| `background` | `stars` (Anzahl), `nebula`, `scanlines`, `vignette` (true/false) |
| `effects` | Eye-Catcher: `[{ "at": 3.2, "type": "punch" }]`, Typen `punch`, `flash`, `glitch`, `shake`, optional `strength` |
| `scenes` | Liste der Szenen, zeitlich sortiert (siehe unten) |

### Zeitangaben

Überall wo eine Zeit steht (`start`, `end`, `at`, `countUntil`) geht entweder:

- eine Zahl in Sekunden: `4.5`
- ein Wort aus dem Transkript: `"zuckerwürfel"` (Wortanfang, 1. Vorkommen)
- ein bestimmtes Vorkommen: `"zuckerwürfel#2"`
- das Wortende: `"zuckerwürfel$"`
- mit Versatz: `"witz+0.1"` oder `"zuckerwürfel#2-0.2"`

Wortanker brauchen ein Transkript unter `subtitles.transcript` (Whisper-JSON mit Wort-Zeitstempeln,
wie `public/transcript.json`). Wenn sich die Sprachaufnahme ändert, wandern damit alle Schnitte und
Effekte automatisch mit.

### Szenen

Jede Szene hat `type`, `start`, optional `end` (Standard: Start der nächsten Szene) und
`transition` (`fade`, `cut`, `glitch`, `flash`, `punch`).

| Typ | Felder |
|---|---|
| `title` | `title`, optional `kicker` (Dachzeile), `subtitle` |
| `counter` | `to`, optional `from`, `prefix`, `suffix`, `label`, `countUntil`, `curve` (`ease`, `linear`, `log`), `decimals` |
| `keyword` | `text`, optional `subtext`, `color` |
| `list` | `items` (Texte oder `{ "text": "...", "at": 11.2 }`), optional `title` |
| `image` | `file` (Bild oder Video in `public/`), optional `caption`, `zoomFrom`, `zoomTo`, `panX`, `panY`, `darken` |
| `cta` | `title`, optional `handle`, `button` |

Fehler in der Konfiguration (unbekanntes Wort, falsche Reihenfolge, unbekannter Szenentyp) werden
beim Start mit einer deutschen Meldung angezeigt, z. B.
`Reel-Konfiguration: Szene 3 (keyword) start: Wort "banane" (1. Vorkommen) nicht im Transkript`.

## Beispiele

- `reels/beispiel.json`: 16 s, feste Sekunden, Musik, alle Szenentypen außer Bild.
- `reels/zuckerwuerfel-kurz.json`: 10,7 s, Sprachaufnahme mit Untertiteln, alle Zeiten als Wortanker, Bildszene.

## Platzhalter-Musik

`python3 scripts/make_music.py 16 120 public/musik-beispiel.mp3` erzeugt einen einfachen,
lizenzfreien Beat (Länge in Sekunden, BPM, Ausgabedatei). Für echte Reels eigene Musik nach
`public/` legen und in `audio.music.file` eintragen.

## Neue Szenentypen

Neue Komponente in `src/template/scenes/` anlegen, Typ in `src/template/types.ts` ergänzen und in
`SCENES` (`src/template/Reel.tsx`) sowie `SCENE_TYPES` (`src/template/resolve.ts`) eintragen.
