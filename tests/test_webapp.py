from __future__ import annotations

from spinner.webapp import analyze_edges_text, read_interactions_text


def test_read_interactions_text_accepts_headered_tsv():
    frame = read_interactions_text("node1\tnode2\tweight\nA\tB\t0.7\nB\tC\t0.8\n")
    assert list(frame.columns) == ["node_a", "node_b", "weight"]
    assert frame["weight"].tolist() == [0.7, 0.8]


def test_analyze_edges_text_returns_spinner_payload():
    payload = analyze_edges_text(
        "node1\tnode2\tweight\nA\tB\t0.9\nB\tC\t0.9\nA\tC\t0.5\n",
        iterations=3,
        include_novel=False,
        device="cpu",
    )
    assert payload["summary"]["nodeCount"] == 3
    assert len(payload["edges"]) == 3
    assert {"rawWeight", "wiper1", "wiper2"}.issubset(payload["edges"][0])
