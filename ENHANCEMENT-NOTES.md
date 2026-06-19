# Q.ANT — 50k Enhancement, Durchgang 1

> `qant-integration-brief.md` lag **nicht** im Repo. Referenz war daher der
> getestete Prototyp `qant-site.html` (Beam-Shader + Scroll-Runtime). Alle harten
> Regeln daraus wurden eingehalten: additiv, Feature-Flag, isolierte Dateien,
> 60fps-Ziel, reduced-motion, Mobile-Fallback, Bilder lazy.

## Bestandsaufnahme — was bleibt / was wird gehoben

| Bestandteil | Entscheidung | Grund |
|---|---|---|
| Beam-Shader + Postprocessing (`#gl`) | **bleibt unangetastet** | getestet, sieht stark aus. Nur read-only via `window.__QANT_BEAM__` angebunden. |
| Scroll-Runtime (Lenis + Spine-ScrollTrigger) | **bleibt** | nur `baseEnergy/baseNodeY` zusätzlich gespiegelt (3 Zeilen). |
| Hero-Headline-Build & Intro | **bleibt** | sauber, nur ein weicher Hero-Scrim ergänzt (Lesbarkeit, ohne den Beam zu dämpfen). |
| Kinetische Zahlen (count-up) | **gehoben** | bestehende Logik bleibt; Größe hoch (clamp 9.5rem), Beam pulst synchron. |
| Problem/Principle/Proof/CTA (leere Backgrounds) | **gehoben** | echte Bilder + Reveals + Lesbarkeits-Scrim. |

## Neue, isolierte Dateien (Feature-Flag `window.QANT_ENHANCE`, default **an**)

- `public/qant-enhance.css` — Bildsprache, Scrims, Bento, Oversized-Type, Signature, Mobile-Fallback.
- `public/qant-enhance.js` — Lesbarkeits-Damping, Reveals/Parallax/Ken-Burns, Statement-Split, Signature-Orchestrierung. Spricht den Beam nur über `__QANT_BEAM__` an.

## Lesbarkeit (PRIO 1)
- **Beam weicht Text aus:** jeder Textblock (`[data-readable]`) zieht beim Eintritt in das Leseband den globalen `uEnergy` multiplikativ auf 0.42 herunter (smoothed) — der Beam *tritt zurück*, statt Text zuzukleistern.
- **Adaptiver Scrim:** weicher radialer Gradient hinter dem Block (gefedert, nie ein harter Kasten), nur so stark wie nötig, blendet ein/aus.
- **Bild-Grading:** alle gestageten Bilder bekommen einen dunklen Verlaufs-Overlay → heller Text (#eef4f8/#aeb9c6) liegt immer auf nahezu schwarzem Grund (≫ 4.5:1, WCAG AA). Im Zweifel Beam runter, nie Text ins Grelle.

## Bild-Inventar — 17 Inhaltsbilder, jedes GENAU einmal
Renders (PNG→WebP optimiert, 50–116 KB) + 10 „targeted" WebPs.

| Bild | Platz (genau einmal) |
|---|---|
| `renders/nps-core-beam` | ★ Signature „The light starts here" (screen-blend über Live-Beam) |
| `renders/chip-stack` | Architecture — exploded reveal |
| `renders/circuit-macro` | Architecture — Background-Parallax |
| `renders/waveguides` | Principle — Media-Panel |
| `targeted/04_optics_bench_blue` | Principle — Media-Panel (Beam splitter) |
| `renders/accelerator-card` | Product — PCIe-Karte |
| `targeted/09_nps_rack_closeup` | Product — NPS Rack |
| `targeted/10_photonic_chip_macro` | Applications — LLM |
| `targeted/05_eye_perception_metaphor` | Applications — Real-Time Video Analytics |
| `targeted/08_photonic_simulation_screen` | Applications — Molecular Dynamics |
| `targeted/07_satellite_earth_data` | Applications — Earth-scale / HPC |
| `renders/circuit-canyon` | Oversized Statement — Background |
| `renders/datacenter-corridor` | Deployment — Background |
| `renders/wafer-laser` | Fabrication — Triptychon |
| `targeted/06_green_laser_photonics` | Fabrication — Triptychon |
| `targeted/03_precision_wafer_fabrication` | Fabrication — Triptychon |
| `targeted/02_electronics_macro` | Problem — Background |
| `targeted/01_human_lab_teamwork` | CTA — Background |

`assets/qant/hero-poster.webp` = generierter, gebackener Beam (Mobile-Fallback, **kein** Inhaltsbild → keine Doppelnutzung).

## Signature-Moment (PRIO 4)
Das Produkt-Render liegt in einer **fixed** Ebene `#sigLayer` zwischen Beam (`z0`) und `<main>` (`z2`) mit `mix-blend-mode: screen`. Das Schwarz des Renders fällt weg, der **Live-Beam scheint physisch aus dem echten Chip zu treten**; beim Eintritt: Energy-Boost ×1.7, Bloom hoch, Cyan-Flash-Puls.

## Mobile / Reduced-Motion
- Mobile / coarse-pointer → `html.qant-static`: kein Live-WebGL, gebackenes Hero-Poster, alle Effekte degradieren weich.
- `prefers-reduced-motion`: alle Reveals/Drifts eingefroren im Endzustand, Beam-Modulation aus.
