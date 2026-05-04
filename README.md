# network SPINNER

**Seeded Protein Interaction Network Neighborhood Expansion and Ranking**

SPINNER is an interactive local web application for constructing, refining, ranking, and exporting protein interaction networks. It provides a visual workbench around the WIPER1/WIPER2 edge-ranking algorithms and WINNER-style node scoring.

The algorithm implementation lives in [`aimed-lab/WIPER`](https://github.com/aimed-lab/WIPER). This repository is the separate application layer.

## Features

- Paste or upload weighted edge lists.
- Generate random, scale-free, or Geneterrain-style test networks.
- Score edges with WIPER1 or WIPER2 and nodes with WINNER-style scores.
- Zoom and pan the network explorer.
- Filter by top N, top percent, or score threshold.
- Use the agentic chat panel for quick refinements.
- Export TSV, Excel-readable workbooks, Markdown reports, Word-ready method/results, and SVG figures.

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
