# Integrating SPINNER into another application

This guide is for developers of a **third-party tool** who want to pass a
network into SPINNER as part of a larger workflow — either to let users explore
it visually, or to score it programmatically.

There are two integration surfaces:

1. **Deep-link the explorer** — open the SPINNER UI with data attached; it
   loads and analyzes on boot. Best for "Open in SPINNER" buttons and embedded
   iframes.
2. **Call the scoring API** — `POST /api/analyze` returns WIPER1 / WIPER2 /
   WINNER results as JSON, no UI. Best for headless pipelines.

Both treat the edge list as the unit of data. SPINNER never persists it; each
deep-link or API call is stateless.

---

## Edge-list format

A tab-, comma-, or whitespace-delimited list. Columns: `node1`, `node2`,
`weight`, where weight is a probability-like score in `[0, 1]`. A header row is
optional and auto-detected. Lines starting with `#` are ignored.

```tsv
node1	node2	weight
A	B	0.92
B	C	0.88
A	C	0.41
```

---

## 1. Deep-link the explorer

Open SPINNER's URL with the data attached. On boot SPINNER picks the data
source in this precedence order:

1. **Embedded hash payload** (`#data=`, `#edges=`, or `#text=`) — the link is
   self-contained; nothing is fetched.
2. **`?edges=<url>`** — SPINNER fetches the URL and reads it as an edge list.
3. **Demo network** — if neither is present (or a fetch fails), SPINNER boots
   the random scale-free demo and, on fetch failure, posts a chat notice.

After loading, SPINNER populates the Build panel and immediately runs
`analyze()`, so the network renders without further interaction.

### 1a. `?edges=<url>` — fetch a hosted edge list

Use when the data already lives somewhere SPINNER can reach over HTTP. The host
must send permissive CORS headers (`Access-Control-Allow-Origin`) because the
fetch is cross-origin from SPINNER's page.

```
http://127.0.0.1:8765/?edges=https://example.org/networks/study42.tsv&title=Study%2042
```

Pros: short URLs, data stays server-side, good for large graphs.
Cons: needs a reachable, CORS-enabled endpoint.

### 1b. `#edges=` / `#text=` / `#data=` — embed the data in the link

The data rides in the URL fragment (`#…`), which is never sent to the server —
it stays client-side. Use when you don't want to host a file.

| Param | Encoding | Carries |
| --- | --- | --- |
| `#text=` | URI-encoded TSV (`encodeURIComponent`) | edge list only |
| `#edges=` | base64 of the TSV | edge list only |
| `#data=` | base64 of a JSON object | edge list **+ parameters** |

The `#data=` JSON object fields:

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `text` | string | — | **Required.** The edge list. |
| `iterations` | number | 80 | WIPER/WINNER iteration cap. |
| `includeNovel` | boolean | false | Include WIPER1 novel candidate edges. |
| `device` | string | `"cpu"` | `cpu` / `auto` / `cuda` / `mps`. |
| `projectName` | string | — | Prefills the project-name field. |
| `projectFolder` | string | — | Prefills the folder/study field. |

Base64 must be UTF-8 safe. In the browser:

```js
function spinnerHashLink(base, tsv, opts = {}) {
  const b64 = btoa(unescape(encodeURIComponent(tsv)));     // UTF-8 → base64
  const qs = new URLSearchParams(opts).toString();          // title/iterations/novel
  return `${base}/#edges=${b64}${qs ? "&" + qs : ""}`;
}

// With parameters embedded instead of query string:
function spinnerDataLink(base, payload) {
  const json = JSON.stringify(payload);                     // {text, iterations, ...}
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `${base}/#data=${b64}`;
}

window.open(spinnerHashLink("http://127.0.0.1:8765", "A\tB\t0.92\nB\tC\t0.88",
  { title: "My study", iterations: "80" }), "_blank");
```

In Python (e.g. to render a link from a server-side tool):

```python
import base64, json, urllib.parse

def spinner_data_link(base: str, text: str, **params) -> str:
    payload = {"text": text, **params}
    b64 = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("ascii")
    return f"{base}/#data={b64}"

print(spinner_data_link("http://127.0.0.1:8765",
                        "A\tB\t0.92\nB\tC\t0.88", iterations=80, includeNovel=False))
```

### 1c. Query options (work with any transport)

| Query param | Effect |
| --- | --- |
| `?title=<label>` | Sets the browser tab title to `<label> · SPINNER`. |
| `?iterations=<n>` | Iteration cap (overridden by `#data`'s own value if both set). |
| `?novel=1` | Enable WIPER1 novel candidate edges. |

### 1d. Embed in an iframe and push data with `postMessage`

For a tighter embed, host SPINNER in an iframe and send data after it loads.
SPINNER listens for a `spinner:load` message and replies with `spinner:loaded`.

```html
<iframe id="spinner" src="http://127.0.0.1:8765" style="width:100%;height:80vh;border:0"></iframe>
<script>
  const frame = document.getElementById("spinner");
  frame.addEventListener("load", () => {
    frame.contentWindow.postMessage({
      type: "spinner:load",
      text: "A\tB\t0.92\nB\tC\t0.88",
      iterations: 80,
      includeNovel: false,
      // projectName, projectFolder, device also accepted
    }, "*");
  });
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "spinner:loaded") {
      console.log("SPINNER loaded the network:", e.data.ok);  // false if payload was empty/invalid
    }
  });
</script>
```

The message payload accepts the same fields as the `#data=` JSON object.
`spinner:loaded`'s `ok` is `false` when the payload had no usable `text`.

---

## 2. Call the scoring API (`POST /api/analyze`)

Run the engines without the UI. Useful for batch scoring, pipelines, or
precomputing results before a deep-link.

### Request

`POST /api/analyze` with a JSON body:

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `text` | string | — | **Required.** Edge list (TSV/CSV/whitespace). |
| `iterations` | number | 80 | WIPER/WINNER iteration cap. |
| `includeNovel` | boolean | false | Include WIPER1 novel candidate edges. |
| `device` | string | `"cpu"` | `cpu` / `auto` / `cuda` / `mps`. |
| `maxPathsPerPair` | number | 1024 | Cap on tied shortest paths enumerated per node pair (bounds WIPER2 cost on dense graphs). |

All responses include `Access-Control-Allow-Origin: *` and the server answers
`OPTIONS` preflight, so browser clients can call it cross-origin.

```bash
curl -s http://127.0.0.1:8765/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"text":"A\tB\t0.92\nB\tC\t0.88\nA\tC\t0.41","iterations":80}'
```

```python
import requests
r = requests.post("http://127.0.0.1:8765/api/analyze",
                  json={"text": "A\tB\t0.92\nB\tC\t0.88", "iterations": 80})
r.raise_for_status()
result = r.json()
print(result["summary"])
```

### Response (`200`)

```jsonc
{
  "nodes": [
    {
      "id": "A",
      "degree": 2,
      "weightedDegree": 1.33,
      "winner0": 1.0,          // initial WINNER score
      "winnerInitialWeight": 1.33,
      "winner": 1.07,          // final WINNER score (used for node size)
      "winnerWeight": 1.42,
      "logWinner": 0.097,
      "rank": 1
    }
  ],
  "edges": [
    {
      "id": "A\tB",
      "source": "A",
      "target": "B",
      "rawWeight": 0.92,
      "rawRank": 1,
      "isInput": true,
      "extended": false,        // true = WIPER1 novel candidate edge
      "wiper1": { "score": 1.77, "weight": 0.93, "ufc0": 1.6, "w0": 0.9, "rank": 4, /* … */ },
      "wiper2": { "score": 7.9,  "weight": 0.81, "pathLoad": 32.3, "coPathDegree": 28, "rank": 1, /* … */ }
    }
  ],
  "summary": {
    "nodeCount": 3,
    "inputEdgeCount": 3,
    "edgeCount": 3,
    "iterations": 80,
    "includeNovel": false,
    "wiper1Available": true,
    "wiper2Available": true,
    "winnerAvailable": true
  }
}
```

Notes:

- An edge's `wiper1` / `wiper2` object is `null` if that engine was skipped
  (see graceful degradation below). `rawWeight` / `rawRank` are always present.
- `score` is the final UFC; `weight` is the final probabilistic W. `ufc0` /
  `w0` are the initial values; `rank` is the competition rank.
- `wiper2` adds path-flow fields: `pathLoad`, `coPathDegree`, `pairCount`.

### Graceful degradation on dense graphs

Dense or heavily tied-weight graphs can overwhelm WIPER's shortest-path
enumeration (surfacing as a `RuntimeError`, or a numpy `MemoryError` /
`OverflowError` from an exploded intermediate array). Rather than failing the
whole request, SPINNER scores WIPER1, WIPER2, and WINNER **independently** and
guards each. When an engine is skipped:

- the request still returns `200` with raw edges plus whatever scored;
- the skipped engine's per-edge object is `null`;
- `summary.wiper1Available` / `wiper2Available` / `winnerAvailable` flag what
  ran;
- `summary.warnings` (array of strings) explains what was skipped and why.

```jsonc
{
  "summary": {
    "wiper1Available": false,
    "wiper2Available": false,
    "winnerAvailable": true,
    "warnings": [
      "WIPER1 skipped — ran out of memory enumerating tied shortest paths. …",
      "WIPER2 skipped — ran out of memory enumerating tied shortest paths. …"
    ]
  }
}
```

To reduce the chance of skipping, send a sparser subnetwork, break tied edge
weights, or lower `maxPathsPerPair`. When consuming results, treat `wiper1` /
`wiper2` as optional and fall back to `rawWeight` (the explorer UI does this
automatically).

### Errors (`400`)

Invalid input (empty edge list, unparseable body) returns `400` with
`{ "error": "<message>" }`. A skipped engine on a valid graph is **not** an
error — that path returns `200` with warnings as above.

---

## 3. Hand off to GeneTerrain (drug-target map)

SPINNER stays **network-only**; gene-expression / attribution scoring lives in
the separate **GeneTerrain** app (GTKM). The **Export → "Open in GeneTerrain"**
button bridges them: it serializes the current **WINNER node scores** (the
network-leverage / potency layer) and opens GeneTerrain's Targets view with the
data embedded in the URL fragment — no hosting required:

```
<geneterrain-base>/?view=targets#net=<base64 of "gene\tscore" TSV>
```

GeneTerrain then fuses that leverage layer with a **SIGnature** gene-importance
matrix (loaded there) to rank drug targets by potency × importance × cross-cell
selectivity. The GeneTerrain base URL is asked once and remembered in
`localStorage` (`geneterrainBase`). The same `#net=` / `?net=` contract is
agent-operable — a tool can assemble the URL directly from `/api/analyze`
output. This keeps expression data out of SPINNER while making the two tools
compose for either a human (button) or an agent (URL).

---

## Endpoint summary

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` , `/index.html`, `/app.js`, `/styles.css` | Serve the explorer UI. |
| `POST` | `/api/analyze` | Score an edge list; returns JSON. |
| `OPTIONS` | `/api/analyze` | CORS preflight. |

Default bind is `127.0.0.1:8765` (`spinner-web --host … --port …`). Replace the
host/port in the examples with wherever you run it.
