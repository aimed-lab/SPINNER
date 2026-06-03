# network SPINNER

**Seeded Protein Interaction Network Neighborhood Expansion and Ranking**

SPINNER is an interactive local web application for constructing, refining, ranking, and exporting protein interaction networks. It provides a visual workbench around WIPER1/WIPER2 edge-ranking algorithms and real WINNER node scoring.

The algorithm implementation lives in [`aimed-lab/WIPER`](https://github.com/aimed-lab/WIPER). This repository is the separate application layer.
Node scoring is provided by [`aimed-lab/WINNER`](https://github.com/aimed-lab/WINNER).
The default network layout follows the DEMA distance-bounded energy-field
style from [`aimed-lab/DEMA`](https://github.com/aimed-lab/DEMA), with local
force-directed and organic alternatives in the browser.

## Features

### Build & score
- Paste or upload tab/comma/whitespace-delimited weighted edge lists.
- Generate Random or scale-free synthetic networks one click; default scale-free graph (34 nodes, 78 edges, w ∈ [0.10, 0.95]) loads on first paint.
- Score edges with WIPER1 or WIPER2 (with optional WIPER1 novel-edge expansion) and nodes with the real WINNER Python package.
- Honor the **Iterations** input as a hard cap on the force layout — no ticks skipped.

### Map-first network explorer
- Google-Maps-style canvas: floating search box top-left, gear + fullscreen top-right, `+ / −` zoom stack bottom-right.
- Gridded SVG canvas (20 px fine, 100 px major) that pans and zooms with the graph in both light and dark themes.
- Status badge reports `nodes shown / total · edges shown / total`.
- Force-directed layout reworked for short, balanced edges — weight-scaled springs, soft 1/r² repulsion scaled by node radii, hard collision boost; **Tidy** (left nav) wipes positions and re-runs the simulation.
- DEMA, force-directed, and organic layouts selectable from the settings popover.
- Edges connected to off-canvas nodes stay visible during pan/zoom (`overflow: visible`).

### Search & selection
- Map-style search highlights matched nodes/edges with a glow + soft pulse and dims the rest of the network to ~15 %.
- Selection details panel and "Show selection details" pill stay collapsed until the user clicks a node, edge, or search result; details render only the active edge-score metric (Raw / WIPER1 / WIPER2 × UFC / W).

### Directions & route planning
- Maps-style directions card slides down from beneath the search bar with **Hops · Raw · W1 · W2** mode tabs (blue underline on active mode).
- From / to inputs flank a vertical rail (origin dot → dotted line → destination square) with a circular swap button; routes auto-compute as inputs change.
- Probabilistic edge weights are −log-converted for path-cost summation; selected route highlights in red, with non-route edges, nodes, and labels dimmed.
- The viewport auto-fits the highlighted path within the unobstructed right side of the canvas.

### Network display settings
- Settings popover with: layout (DEMA / Force / Organic); edge score (Raw / WIPER1 / WIPER2 × UFC / W × Linear / Log₂); edges shown (All / Top N / Top % / ≥ score); nodes shown (same); node radius (Linear / Log₂ × Relative / Absolute, plus min / max / × fold).
- Edge widths span an ≈ 11 × ratio with a `t^1.5` curve so weak ties stay as hairlines and strong ties read clearly.
- Log-scaled WINNER node sizing keeps visible node circles separated; click any node to preview its original-scale circle.

### Assistant
- Right-side slide-over drawer opened from the **Assistant** nav item; scrim, Esc, and the × button all close it.
- Composer (`⌘ ⏎ to send`) for natural-language network construction, ranking, and routing prompts.

### Results & export
- Sticky-header results tables with **Edges** / **Nodes** tabs, monospace numerals, row filter, and a left indigo bar on the selected row.
- Export to TSV (shown network, edge table, node table), SVG visualization, Geneterrain, Notion (.md), Word-ready (.doc), and Excel-readable (.xls).

### Reliability
- Client-side `/api/analyze` fallback synthesizes plausible WIPER1 / WIPER2 / path-load values when the Python backend is unreachable, so static previews still render a network.

See [`CHANGELOG.md`](CHANGELOG.md) for the full 1.100 release notes.

## How SPINNER Uses WINNER and WIPER

SPINNER is the integration layer. It does not replace WINNER or WIPER; it
coordinates them in one exploratory network workbench.

### WINNER Node Scoring

WINNER ranks genes or proteins in a weighted protein-protein-interaction graph.
Given a node list and weighted interactions, WINNER builds a weighted
undirected adjacency matrix, computes an initial node score based on weighted
degree, and then runs a restart-style network propagation process. Nodes with
large final WINNER scores are strongly supported by their local network
neighborhood and by paths through high-confidence interactions.

SPINNER imports the real WINNER Python package for node scoring. The network
plot uses the final WINNER score to size nodes, while the node table exposes
initial and final WINNER values so users can see how much propagation changed
each node's rank.

### WIPER1 Edge Scoring

WIPER1 implements the published Weighted In-Path Edge Ranking idea. It first
computes optimal weighted paths between nodes, converts those node-to-node
relationships into an edge-to-edge traversal graph, initializes edge weights
from local edge-network support, and diffuses scores over that edge graph.
SPINNER uses WIPER1 when users want behavior close to the original WIPER
formulation, including optional novel edge expansion.

### WIPER2 Edge Scoring

WIPER2 is SPINNER's path-aware edge-ranking option. Instead of only asking
whether two edges are near each other in an optimal-path matrix, WIPER2 asks
which edges are actually traversed by shortest weighted paths. It builds an
edge-by-path credit matrix, converts that into an edge co-path graph, and runs
WINNER-like restart propagation over edges rather than nodes.

WIPER2 is the default SPINNER edge view because it is usually easier to
interpret for backbone discovery: high-ranking edges are those that carry
more optimal-path flow, bridge high-confidence neighborhoods, or repeatedly
appear in path-supported explanations.

## Run Locally

```bash
python -m pip install -e .
spinner-web --host 127.0.0.1 --port 8765
```

Then open `http://127.0.0.1:8765`.

For development against a local WIPER checkout, install WIPER first from its `python/` directory:

```bash
python -m pip install -e ../WIPER/python
python -m pip install -e .
```

## Input Format

SPINNER expects a tab, comma, or whitespace-delimited edge list. The first two columns are node identifiers and the third column is an edge weight in `[0, 1]`.

```tsv
node1 node2 weight
A     B     0.92
B     C     0.88
```

## License

SPINNER is free for non-commercial research, education, evaluation, and
academic use. Commercial use requires a separate written license from Dr. Jake
Chen or another authorized copyright holder. See
[`LICENSE`](LICENSE). SPINNER imports the WINNER Python package and the WIPER
package; the WINNER Python port and WIPER2 path-aware edge-ranking variant use
matching non-commercial terms.
