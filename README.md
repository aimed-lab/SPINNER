# network SPINNER

**Seeded Protein Interaction Network Neighborhood Expansion and Ranking**

SPINNER is an interactive local web application for constructing, refining, ranking, and exporting protein interaction networks. It provides a visual workbench around WIPER1/WIPER2 edge-ranking algorithms and real WINNER node scoring.

The algorithm implementation lives in [`aimed-lab/WIPER`](https://github.com/aimed-lab/WIPER). This repository is the separate application layer.
Node scoring is provided by [`aimed-lab/WINNER`](https://github.com/aimed-lab/WINNER).

## Features

- Paste or upload weighted edge lists.
- Generate random, scale-free, or Geneterrain-style test networks.
- Score edges with WIPER1 or WIPER2 and nodes with the real WINNER Python package.
- Zoom and pan the network explorer.
- Filter by top N, top percent, or score threshold.
- Use the agentic chat panel for quick refinements.
- Export TSV, Excel-readable workbooks, Markdown reports, Word-ready method/results, and SVG figures.

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
