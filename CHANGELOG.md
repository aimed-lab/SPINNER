# Changelog

## 1.100 — 2026-05-08

Full GUI redesign of the SPINNER explorer, delivered as a Claude Design
handoff bundle. The Python backend (`POST /api/analyze`) and served
filenames are unchanged; the JavaScript contract is preserved.

### New explorer chrome
- Map-first canvas in the spirit of Google Maps: floating search box top-left,
  gear + fullscreen stack top-right, `+ / −` zoom stack bottom-right.
- Gridded SVG canvas (20 px fine, 100 px major) that pans and zooms with the
  graph; light- and dark-mode aware.
- Status badge in the header reports `nodes shown / total · edges shown / total`.
- Polished scientific palette — IBM Plex Sans/Mono, warm-paper surfaces,
  tabular numerals, fine 1 px borders, dark mode preserved.

### Sidebar workflow
- Collapsible left nav with icon glyphs for **Build**, **Results**, **Export**,
  **Tidy**, **Assistant**. Sidebar starts collapsed; the SPINNER icon doubles
  as the home / expand control.
- **Build** panel merges the former Input and Generate steps. Synthetic graph
  controls (Random / Scale-free, node count, edge count, w<sub>min</sub> / w<sub>max</sub>) sit
  above file upload, paste-edge-list, project name, iterations, device, and
  the WIPER1 novel-edge toggle.
- **Tidy** wipes node positions, re-seeds, and re-runs the force-directed
  simulation, then resets zoom to fit.

### Network generation & layout
- One-click synthetic network generation (Random or scale-free); page boots
  with a default scale-free graph (34 nodes, 78 edges, w ∈ [0.10, 0.95]).
- Force-directed layout reworked for short, balanced edges:
  - Springs target a short rest length scaled by edge weight; spring stiffness
    scales with weight so strong ties cinch tight.
  - Repulsion is a soft, short-range 1/r² push scaled by node radii.
  - Hard collision boost prevents overlap.
  - The **Iterations** input now caps the simulation; no ticks are skipped.
- DEMA, Force, and Organic layout modes are all selectable from the settings
  popover.
- `overflow: visible` on the SVG so edges connected to off-canvas nodes no
  longer vanish during pan / zoom.

### Search
- Map-style search box with shadowed pill input; results dropdown only renders
  while the field is focused.
- Matched nodes and edges glow with the accent color and pulse softly; the
  rest of the network dims to ~15 % so matches stand out.

### Directions / route planning
- Google Maps-style directions card slides down from beneath the search bar.
  Travel-mode tab strip across the top — **Hops · Raw · W1 · W2** — with a
  blue underline on the active mode and a borderless circular close X.
- From / to inputs flank a vertical rail (origin dot → dotted line →
  destination square) with a circular swap button that rotates 180 ° on hover.
- Routes auto-compute as inputs change. Path costs use −log p summation over
  edge probabilities (raw weight, WIPER1 weight, WIPER2 weight) so shortest
  paths reflect real probabilistic cost.
- Selected route highlights in red (#e23b2b, dashed) with the selected leg in
  deeper red; non-route edges, nodes, and labels all dim out.
- `centerRoute` reserves a left-side gutter for the directions card and fits
  the entire highlighted path inside the remaining viewport, without
  obstructing the route.
- Per-leg detail rows show `p`, `−log p`, the running `Σ −log p` and `Π p`.

### Network display settings
- Settings popover with dedicated controls for:
  - **Layout** — DEMA / Force / Organic.
  - **Edge score** — Raw / WIPER1 / WIPER2, with **UFC / W** sub-toggle and
    Linear / Log₂ scaling. Default edge score is **W**.
  - **Edges shown** — All / Top N / Top % / ≥ score. The number row collapses
    to just the input relevant to the active filter mode.
  - **Nodes shown** — same All / Top N / Top % / ≥ score pattern.
  - **Node radius** — Linear / Log₂ × Relative / Absolute, plus min, max, and
    relative-fold inputs.
- Selection details follow the active metric: edge cards show only the
  selected score, rank, initial value, and reason; node cards show their
  incident edges using the active metric.
- Edge widths now span roughly an 11 × ratio (≈ 0.8 px → 8.8 px) with a
  `t^1.5` curve so weak ties stay as hairlines and strong ties read clearly.
- Selection details and the "Show selection details" pill stay hidden until
  the user clicks a node, edge, or search result.

### Assistant
- Right-side slide-over drawer with a scrim, opened from the **Assistant**
  nav item. Esc, scrim click, and the × button all close it.
- Composer with `⌘ ⏎ to send` hint; the assistant copilot can be wired to
  network generation, ranking, and route planning prompts.

### Results & export
- Results table with **Edges** / **Nodes** tabs, sticky headers, monospace
  numerals, row filter input, and a left indigo bar on the selected row.
- Export panel covers Geneterrain, SVG visualization, shown-network TSV,
  edge / node tables, Notion (.md), Word (.doc), and Excel (.xls).

### Reliability
- Client-side fallback for `POST /api/analyze` synthesizes plausible
  WIPER1 / WIPER2 / path-load values when the Python backend is unreachable
  (e.g. opening `index.html` directly), so the explorer always renders a
  network in static previews.

## 0.1.0 — initial release

- Core SPINNER pipeline: WIPER1, WIPER2, WINNER scoring with path-flow
  pathload, served by a small local `http.server` web app at
  `POST /api/analyze`.
- Plain HTML/CSS/JS frontend with a network explorer, ranking tables, and
  TSV / SVG export.
