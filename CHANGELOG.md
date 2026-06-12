# Changelog

## 1.136 — 2026-06-11

Two explorer readability features (Network Display settings).

### Node size ratio + zoom-steady sizing
- New **ratio** slider (1–100) under *Node radius* sets the largest-to-smallest
  display ratio directly: the smallest node holds the `min` radius and the
  largest is `min × ratio`. (Replaces the old `×fold` field; relative mode.)
- Node glyph sizes now stay **visually steady as you zoom** — radii, edge
  stroke widths, and labels are counter-scaled by `1/zoom`, so zooming changes
  only spacing, not marker/label sizes. At fit (zoom = 1) rendering is
  unchanged. The `min`/`max` px inputs apply in Absolute mode; the ratio slider
  in Relative mode (controls auto-show per mode).

### Off-screen culling (declutter)
- New **Declutter** toggle (on by default): when zoomed in, any node whose
  **center** falls outside the viewport is hidden, along with every edge that
  touches it — cutting edge clutter. At fit / zoomed-out the viewport covers the
  whole graph, so nothing is culled. Recomputed on every pan/zoom.

## 1.135 — 2026-06-09

Assistant copilot: offline fallback so queries still work when the shared
agent service is down.

- A free-form **network-analysis** request ("analyze the network", "rank the
  top hubs", "top 5 important nodes") used to just error if the agent service
  (`:8088`) was unreachable. It now falls back to SPINNER's **own** WIPER /
  WINNER engines: it summarizes the on-screen results, or re-runs
  `POST /api/analyze` on the current edge list, and returns the top nodes by
  WINNER leverage plus the top WIPER2 edges. A `↺ agent service offline` note
  marks the local run, and `top N` is honored.
- **Stays network-only** — the fallback uses no expression data, no API key,
  and no LLM. Drug-target ranking (importance × cross-cell selectivity) still
  requires the agent service + GeneTerrain; the reply says so.
- Non-analysis requests still show the "start `run.sh`" notice.

## 1.134 — 2026-06-08

Assistant copilot: fix the panel flickering on open and on each reply.

- **No more message churn.** A reply (or an error) used to be drawn by adding a
  `…` placeholder bubble and then *removing* it to add the real message — a
  visible add/remove flash, especially fast when the agent service is
  unreachable. The placeholder is now a single persistent bubble that is
  rewritten **in place** into the first text, tool note, or error, so the
  message count never dips. The indicator animates via a new
  `.chatMessage.thinking` style.
- **Smoother drawer slide-in.** The Assistant drawer is promoted to its own
  compositor layer (`will-change: transform`), removing the repaint flicker
  during the open animation.
- Unrelated to the UI, the failed-query message already points at the cause:
  the shared agent service (`run.sh`, default `:8088`) must be running for
  free-form requests — terse UI commands still work offline.

## 1.133 — 2026-06-07

Fix: collapsing the results table left no way to restore it (the collapsed row
shrank to ~2px and the header was clipped/off-screen). The collapsed state is
now a fixed bar pinned to the viewport bottom — always visible, labeled
`N / N edges · click to expand`, and restored by clicking anywhere on it (or
the chevron). The workbench reserves bottom padding so the canvas isn't hidden
behind the bar.

## 1.132 — 2026-06-07

Results table redesign for usability.

- The Edges/Nodes table now scrolls **internally** within a fixed-height
  region (default ~7 rows, sticky headers) instead of growing the page — which
  had made it look like a 2-row table.
- New header controls: a row-count chip (`78 / 78 edges`, `(filtered)` when a
  filter is active), a **maximize / restore** toggle (table fills the
  workspace, canvas shrinks to a strip), and a **collapse / expand** toggle
  (header only). The drag-resize handle still works.

## 1.131 — 2026-06-07

Copilot fix: the Assistant now operates on the **currently-loaded network**.

- The Assistant sends the UI's current edge list to the agent service, so
  "analyze the network / this network / the current network" runs
  `spinner_analyze` on what's on screen (previously the stateless service had
  no knowledge of the loaded graph and replied "no network analyzed yet").
- The local-vs-copilot router no longer treats `analyze` / `geneterrain` /
  `rescore` as local UI commands — those reach the copilot; pure UI toggles
  and routing stay local.

## 1.130 — 2026-06-07

Assistant copilot. The Assistant drawer can now drive the full
SPINNER → GeneTerrain drug-target workflow via a shared LLM agent service.

### Assistant copilot (`app.js`, `index.html`, `styles.css`)
- Free-form requests ("analyze this network and rank monocyte drug targets,
  then give me a GeneTerrain link") stream to a shared agent service
  (Grok-backed; default `http://127.0.0.1:8088`, override via `?agent=` or
  `localStorage.agentBase`). Tool activity renders as compact notes; a
  GeneTerrain target-map link renders as a clickable result.
- Direct, terse UI commands (WIPER1/2, top N, layout, plan trip, generate,
  geneterrain, analyze) still run **locally and instantly** — the router only
  sends sentence-like requests to the copilot.
- Graceful in-panel notice if the service is unreachable.
- **SPINNER stays network-only**: the LLM and the API key live entirely in the
  shared agent service, never in SPINNER. See the
  [spinner-agent-console](https://github.com/aimed-lab/spinner-agent-console)
  repo for that service.

## 1.120 — 2026-06-07

GeneTerrain interoperability. SPINNER remains network-only; this release adds
a one-click bridge to the standalone GeneTerrain (GTKM) drug-target map.

### Open in GeneTerrain (`app.js`, `index.html`)
- New **Export → "Open in GeneTerrain"** button: serializes the current WINNER
  node scores (the network-leverage / potency layer) as a `gene\tscore` TSV,
  base64-encodes it, and opens GeneTerrain's Targets view with the data in the
  URL fragment — `…/?view=targets#net=<base64 TSV>` — so no hosting is needed.
- GeneTerrain fuses that leverage layer with a SIGnature gene-importance matrix
  to rank drug targets by potency × importance × cross-cell selectivity.
- The GeneTerrain base URL is asked once and remembered in `localStorage`.
- The same `#net=` / `?net=` contract is agent-operable directly from
  `/api/analyze` output — one workflow, two front doors (human button / agent URL).
- No expression or attribution data enters SPINNER's scoring. Documented in
  `docs/INTEGRATION.md` §3.

## 1.110 — 2026-06-03

Deep-link data loading and dense-graph robustness. Builds on the 1.100
redesign; the `POST /api/analyze` contract is unchanged (additive summary
fields only).

### Deep-link loader (`app.js`)
- Launch SPINNER with an external dataset at boot, in precedence order:
  - embedded hash payload — `#data=<base64 JSON>`, `#edges=<base64 TSV>`,
    or `#text=<URI-encoded TSV>` (self-contained link, no hosting needed);
  - `?edges=<url>` — fetches a tab-separated edge list cross-origin (good
    for large datasets);
  - `postMessage({type:'spinner:load', ...})` from a parent frame, with a
    `spinner:loaded` acknowledgement.
- Query options honored alongside all paths: `?title=`, `?iterations=`,
  `?novel=1`. A failed fetch falls back to the demo network with a chat
  notice.

### Dense-graph robustness (`webapp.py`)
- WIPER1, WIPER2, and WINNER are scored independently and each guarded
  against `(RuntimeError, MemoryError, OverflowError)`, so raw edges plus
  whichever engines succeed always return instead of failing the whole
  request. The response carries `summary.warnings` and per-engine
  `wiper1Available` / `wiper2Available` / `winnerAvailable` flags, plus an
  optional `maxPathsPerPair` request parameter.
- Recursion limit and request-thread C-stack raised so deep-but-bounded
  WIPER path enumeration completes on mid-size graphs.

### Edge rendering (`app.js`)
- Edges fall back to raw weight for width, filtering, and ranking when the
  selected WIPER metric is unavailable, so a degraded graph still renders
  its edges instead of showing none.

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
