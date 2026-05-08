const sampleNetwork = `node1\tnode2\tweight
A\tB\t0.92
B\tC\t0.88
C\tD\t0.84
D\tE\t0.80
E\tF\t0.77
A\tC\t0.50
B\tD\t0.45
C\tE\t0.42
B\tF\t0.18
A\tF\t0.12
G\tH\t0.90
H\tI\t0.86
I\tJ\t0.82
G\tI\t0.48
F\tG\t0.62
D\tH\t0.38`;

const state = {
  data: null,
  metric: "wiper2",
  edgeMeasure: "weight",
  edgeScale: "normal",
  nodeScale: "log",
  nodeSizeMode: "relative",
  layoutMode: "force",
  generatorModel: "scale-free",
  resultTab: "edges",
  activeNavPanel: "input",
  sidebarCollapsed: true,
  theme: "light",
  explorerFullscreen: false,
  plannedRoute: null,
  routeMode: "wiper2",
  zoom: 1,
  panX: 0,
  panY: 0,
  edgeFilter: "all",
  nodeFilter: "all",
  selected: null,
  selectedKind: "edge",
  nodePulse: null,
  positions: new Map(),
  layoutSignature: "",
};

const els = {
  edgeText: document.getElementById("edgeText"),
  fileInput: document.getElementById("fileInput"),
  iterations: document.getElementById("iterationsInput"),
  device: document.getElementById("deviceInput"),
  includeNovel: document.getElementById("includeNovelInput"),
  themeToggle: document.getElementById("themeToggleBtn"),
  account: document.getElementById("accountBtn"),
  summary: document.getElementById("summary"),
  viewSummary: document.getElementById("viewSummary"),
  svg: document.getElementById("networkSvg"),
  rows: document.getElementById("edgeRows"),
  nodeRows: document.getElementById("nodeRows"),
  filter: document.getElementById("filterInput"),
  selected: document.getElementById("selectedDetails"),
  tooltip: document.getElementById("graphTooltip"),
  sizeLegend: document.getElementById("sizeLegend"),
  edgeLegend: document.getElementById("edgeLegend"),
  explorerSearch: document.getElementById("explorerSearchInput"),
  explorerSearchResults: document.getElementById("explorerSearchResults"),
  explorerDetails: document.getElementById("explorerDetails"),
  explorerDetailsBody: document.getElementById("explorerDetailsBody"),
  explorerDetailsClose: document.getElementById("explorerDetailsCloseBtn"),
  explorerDetailsShow: document.getElementById("explorerDetailsShowBtn"),
  edgeTopN: document.getElementById("edgeTopNInput"),
  edgeTopPercent: document.getElementById("edgeTopPercentInput"),
  edgeThreshold: document.getElementById("edgeThresholdInput"),
  nodeTopN: document.getElementById("nodeTopNInput"),
  nodeTopPercent: document.getElementById("nodeTopPercentInput"),
  nodeThreshold: document.getElementById("nodeThresholdInput"),
  nodeMinRadius: document.getElementById("nodeMinRadiusInput"),
  nodeMaxRadius: document.getElementById("nodeMaxRadiusInput"),
  nodeRadiusFold: document.getElementById("nodeRadiusFoldInput"),
  layoutModeSegments: document.getElementById("layoutModeSegments"),
  generatorNodeCount: document.getElementById("generatorNodeCountInput"),
  generatorEdgeCount: document.getElementById("generatorEdgeCountInput"),
  generatorMinWeight: document.getElementById("generatorMinWeightInput"),
  generatorMaxWeight: document.getElementById("generatorMaxWeightInput"),
  navItems: Array.from(document.querySelectorAll(".navItem")),
  navPanels: Array.from(document.querySelectorAll(".navPanel")),
  generateNetwork: document.getElementById("generateNetworkBtn"),
  generateGeneterrain: document.getElementById("generateGeneterrainBtn"),
  resultEdges: document.getElementById("resultEdgesBtn"),
  resultNodes: document.getElementById("resultNodesBtn"),
  outputGeneterrain: document.getElementById("outputGeneterrainBtn"),
  chatLog: document.getElementById("chatLog"),
  chatInput: document.getElementById("chatInput"),
  chatApply: document.getElementById("chatApplyBtn"),
  routeSource: document.getElementById("routeSourceInput"),
  routeTarget: document.getElementById("routeTargetInput"),
  nodeOptions: document.getElementById("nodeOptions"),
  planTrip: document.getElementById("planTripBtn"),
  exportEdges: document.getElementById("exportEdgesBtn"),
  exportNodes: document.getElementById("exportNodesBtn"),
  exportShown: document.getElementById("exportShownBtn"),
  exportExcel: document.getElementById("exportExcelBtn"),
  exportMarkdown: document.getElementById("exportMarkdownBtn"),
  exportWord: document.getElementById("exportWordBtn"),
  exportFigure: document.getElementById("exportFigureBtn"),
  networkSettings: document.getElementById("networkSettingsPanel"),
  networkSettingsBtn: document.getElementById("networkSettingsBtn"),
  networkSettingsClose: document.getElementById("networkSettingsCloseBtn"),
  zoomIn: document.getElementById("zoomInBtn"),
  zoomOut: document.getElementById("zoomOutBtn"),
  explorerFullscreenBtn: document.getElementById("explorerFullscreenBtn"),
  leftPane: document.getElementById("leftPane"),
  sidebarToggle: document.getElementById("sidebarToggleBtn"),
  leftResize: document.getElementById("leftResizeHandle"),
  agentResize: document.getElementById("agentResizeHandle"),
  resultsResize: document.getElementById("resultsResizeHandle"),
  agentPanel: document.querySelector(".agentPanel"),
  resultsPanel: document.querySelector(".resultsPanel"),
};

const narrowViewportQuery = window.matchMedia("(max-width: 760px)");

function apiUrl(path) {
  if (window.location.protocol === "file:") {
    return `http://127.0.0.1:8765${path}`;
  }
  return path;
}

function fmt(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toFixed(digits);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function metricLabel(metric = state.metric) {
  if (metric === "raw") return "Raw";
  return metric === "wiper1" ? "WIPER1" : "WIPER2";
}

function tooltipMove(event) {
  if (!els.tooltip || els.tooltip.hidden) return;
  const pad = 14;
  const rect = els.tooltip.getBoundingClientRect();
  let x = event.clientX + pad;
  let y = event.clientY + pad;
  if (x + rect.width > window.innerWidth - 8) x = event.clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight - 8) y = event.clientY - rect.height - pad;
  els.tooltip.style.left = `${Math.max(8, x)}px`;
  els.tooltip.style.top = `${Math.max(8, y)}px`;
}

function showTooltip(event, html) {
  if (!els.tooltip) return;
  els.tooltip.innerHTML = html;
  els.tooltip.hidden = false;
  tooltipMove(event);
}

function hideTooltip() {
  if (!els.tooltip) return;
  els.tooltip.hidden = true;
}

function setTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = state.theme;
  if (els.themeToggle) {
    const dark = state.theme === "dark";
    els.themeToggle.innerHTML = `<span aria-hidden="true">${dark ? "☼" : "☾"}</span>`;
    els.themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    els.themeToggle.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
  }
  try {
    window.localStorage.setItem("spinnerTheme", state.theme);
  } catch (_err) {
    return;
  }
}

function toggleTheme() {
  setTheme(state.theme === "dark" ? "light" : "dark");
}

function setSidePanel(panel) {
  state.activeNavPanel = panel;
  els.navItems.forEach((item) => {
    const active = item.getAttribute("data-nav-panel") === panel;
    item.classList.toggle("active", active);
    item.setAttribute("aria-current", active ? "page" : "false");
  });
  els.navPanels.forEach((section) => {
    section.classList.toggle("active", section.getAttribute("data-nav-panel") === panel);
  });
}

function setResultTab(tab, options = {}) {
  state.resultTab = tab === "nodes" ? "nodes" : "edges";
  document.querySelectorAll("#resultTabs button").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-tab") === state.resultTab);
  });
  document.querySelectorAll(".tabPanel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${state.resultTab}Tab`);
  });
  if (options.focus && els.resultsPanel) {
    els.resultsPanel.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function setExplorerFullscreen(expanded) {
  state.explorerFullscreen = Boolean(expanded);
  document.body.classList.toggle("explorerFullscreen", state.explorerFullscreen);
  if (els.explorerFullscreenBtn) {
    els.explorerFullscreenBtn.classList.toggle("active", state.explorerFullscreen);
    els.explorerFullscreenBtn.textContent = state.explorerFullscreen ? "⤢" : "⛶";
    els.explorerFullscreenBtn.setAttribute(
      "aria-label",
      state.explorerFullscreen ? "Exit full screen network explorer" : "Expand network explorer",
    );
    els.explorerFullscreenBtn.setAttribute(
      "title",
      state.explorerFullscreen ? "Exit full screen network explorer" : "Expand network explorer",
    );
  }
  requestAnimationFrame(() => render());
}

function isNarrowViewport() {
  return narrowViewportQuery.matches;
}

function setSidebarCollapsed(collapsed) {
  state.sidebarCollapsed = Boolean(collapsed);
  document.body.classList.toggle("sidebarCollapsed", state.sidebarCollapsed);
  els.sidebarToggle.setAttribute("aria-expanded", state.sidebarCollapsed ? "false" : "true");
  els.sidebarToggle.setAttribute(
    "aria-label",
    state.sidebarCollapsed ? "Expand navigation panel" : "Collapse navigation panel",
  );
  if (state.sidebarCollapsed) {
    setCssPxVar("--sidebar-width", 56);
  } else if (!isNarrowViewport()) {
    setCssPxVar(
      "--sidebar-width",
      Math.max(240, Number.parseFloat(getComputedStyle(els.leftPane).width) || 304),
    );
  }
}

function wiperWeightLine(label, scores) {
  if (!scores) return `<div class="tipLine"><span>${label}</span><strong>-</strong></div>`;
  return `<div class="tipLine"><span>${label} W</span><strong>${fmt(scores.w0)} -> ${fmt(scores.weight)}</strong></div>`;
}

function edgeTooltip(edge) {
  return `
    <div class="tipTitle">${escapeHtml(edgeLabel(edge))}</div>
    <div class="tipGrid">
      <div class="tipLine"><span>Raw weight</span><strong>${fmt(edge.rawWeight)}</strong></div>
      ${wiperWeightLine("WIPER1", edge.wiper1)}
      <div class="tipLine"><span>WIPER1 UFC</span><strong>${fmt(edge.wiper1 && edge.wiper1.ufc0)} -> ${fmt(edge.wiper1 && edge.wiper1.score)}</strong></div>
      ${wiperWeightLine("WIPER2", edge.wiper2)}
      <div class="tipLine"><span>WIPER2 UFC</span><strong>${fmt(edge.wiper2 && edge.wiper2.ufc0)} -> ${fmt(edge.wiper2 && edge.wiper2.score)}</strong></div>
      <div class="tipLine"><span>Path load</span><strong>${fmt(edge.wiper2 && edge.wiper2.pathLoad)}</strong></div>
    </div>`;
}

function nodeTooltip(node) {
  const incident = state.data.edges
    .filter((edge) => edge.source === node.id || edge.target === node.id)
    .sort((a, b) => (edgeValue(b) || 0) - (edgeValue(a) || 0))
    .slice(0, 6);
  const rows = incident.map((edge) => {
    const w1 = edge.wiper1 ? `${fmt(edge.wiper1.w0)} -> ${fmt(edge.wiper1.weight)}` : "-";
    const w2 = edge.wiper2 ? `${fmt(edge.wiper2.w0)} -> ${fmt(edge.wiper2.weight)}` : "-";
    return `<tr><td>${escapeHtml(edgeLabel(edge))}</td><td>${w1}</td><td>${w2}</td></tr>`;
  }).join("");
  return `
    <div class="tipTitle">${escapeHtml(node.id)}</div>
    <div class="tipGrid">
      <div class="tipLine"><span>WINNER UFC</span><strong>${fmt(node.winner0)} -> ${fmt(node.winner)}</strong></div>
      <div class="tipLine"><span>WINNER W</span><strong>${fmt(node.winnerInitialWeight)} -> ${fmt(node.winnerWeight)}</strong></div>
      <div class="tipLine"><span>Rank</span><strong>#${node.rank}</strong></div>
      <div class="tipLine"><span>Degree</span><strong>${node.degree}</strong></div>
    </div>
    <div class="tipSubhead">Incident edge W[0] -> W[n]</div>
    <table class="tipTable"><thead><tr><th>Edge</th><th>WIPER1</th><th>WIPER2</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function edgeScoreObject(edge, metric = state.metric) {
  if (metric === "wiper1") return edge.wiper1;
  if (metric === "wiper2") return edge.wiper2;
  return null;
}

function edgeValue(edge, metric = state.metric) {
  if (metric === "raw") return edge.rawWeight;
  const scores = edgeScoreObject(edge, metric);
  if (!scores) return null;
  return state.edgeMeasure === "weight" ? scores.weight : scores.score;
}

function edgeRank(edge, metric) {
  if (metric === "raw") return edge.rawRank;
  if (metric === "wiper1") return edge.wiper1 && edge.wiper1.rank;
  return edge.wiper2 && edge.wiper2.rank;
}

function nodeValue(node) {
  return state.nodeScale === "log" ? node.logWinner : node.winner;
}

function nodeSizeValue(node) {
  if (state.nodeScale !== "log") return node.winner;
  return Math.log2(Math.max(Number(node.winner) || 0, Number.EPSILON));
}

function scaledEdgeValue(edge) {
  const value = edgeValue(edge);
  if (value === null || value === undefined) return null;
  return state.edgeScale === "log" ? Math.log2(Math.max(Number(value), Number.EPSILON)) : Number(value);
}

function finiteValues(items, reader) {
  return items.map(reader).filter((v) => v !== null && v !== undefined && Number.isFinite(Number(v))).map(Number);
}

function range(items, reader) {
  const vals = finiteValues(items, reader);
  if (!vals.length) return [0, 1];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return min === max ? [Math.min(0, min), max || 1] : [min, max];
}

function normalize(value, min, max) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 0;
  return Math.max(0, Math.min(1, (Number(value) - min) / (max - min || 1)));
}

function nodeRadiusBounds() {
  const minRadius = Math.max(1, Number(els.nodeMinRadius.value) || 7);
  if (state.nodeSizeMode === "absolute") {
    return [
      minRadius,
      Math.max(minRadius + 1, Number(els.nodeMaxRadius.value) || 28),
    ];
  }
  const fold = Math.max(1, Number(els.nodeRadiusFold.value) || 4);
  return [minRadius, minRadius * fold];
}

function nodeRadius(node, minScore, maxScore) {
  const [minRadius, maxRadius] = nodeRadiusBounds();
  const t = normalize(nodeSizeValue(node), minScore, maxScore);
  return minRadius + (maxRadius - minRadius) * t;
}

function rawNodeRadius(node, nodes) {
  const [minScore, maxScore] = range(nodes, (item) => item.winner);
  const [minRadius, maxRadius] = nodeRadiusBounds();
  const t = normalize(node.winner, minScore, maxScore);
  return minRadius + (maxRadius - minRadius) * t;
}

function renderSizeLegend(nodes, minScore, maxScore) {
  if (!els.sizeLegend) return;
  if (!nodes.length) {
    els.sizeLegend.textContent = "";
    return;
  }
  const [minRadius, maxRadius] = nodeRadiusBounds();
  const legendScale = Math.min(1, 24 / Math.max(1, maxRadius));
  const minLegendRadius = Math.max(2, minRadius * legendScale);
  const maxLegendRadius = Math.max(minLegendRadius + 1, maxRadius * legendScale);
  const mode = state.nodeSizeMode === "absolute"
    ? `${fmt(minRadius, 0)}-${fmt(maxRadius, 0)} px`
    : `${fmt(maxRadius / Math.max(1, minRadius), 1)}x radius`;
  const scale = state.nodeScale === "log" ? "log2 scale" : "linear scale";
  els.sizeLegend.innerHTML = `
    <div class="legendTitle">Node size = final WINNER</div>
    <svg viewBox="0 0 180 58" aria-hidden="true">
      <circle cx="35" cy="31" r="${minLegendRadius}" class="legendNode"></circle>
      <circle cx="118" cy="31" r="${maxLegendRadius}" class="legendNode"></circle>
    </svg>
    <div class="legendLabels">
      <span>${fmt(minScore)}</span>
      <span>${fmt(maxScore)}</span>
    </div>
    <div class="legendMode">${scale}; ${mode}</div>`;
}

function colorFor(t) {
  const stops = [
    [37, 99, 235],
    [15, 118, 110],
    [180, 83, 9],
    [190, 18, 60],
  ];
  const scaled = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const rgb = stops[i].map((c, j) => Math.round(c + (stops[i + 1][j] - c) * f));
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

function edgeStrokeWidth(t) {
  // 0..1 normalized score → ~10x range with non-linear emphasis on stronger edges.
  // Min ~0.8px, max ~8.8px; t^1.5 keeps weak ties thin so heavy ties stand out clearly.
  const c = Math.max(0, Math.min(1, t));
  return 0.8 + 8 * Math.pow(c, 1.5);
}

function edgeLegendLabel() {
  if (state.metric === "raw") return "Edge width = raw weight";
  const measure = state.edgeMeasure === "weight" ? "final W" : "final UFC";
  return `Edge width = ${metricLabel()} ${measure}`;
}

function renderEdgeLegend(edges, minScore, maxScore) {
  if (!els.edgeLegend) return;
  if (!edges.length) {
    els.edgeLegend.textContent = "";
    return;
  }
  const values = [0, 0.5, 1].map((t) => minScore + (maxScore - minScore) * t);
  const scaleText = state.edgeScale === "log" ? "log2 scale" : "linear scale";
  els.edgeLegend.innerHTML = `
    <div class="legendTitle">${edgeLegendLabel()}</div>
    <svg viewBox="0 0 214 48" aria-hidden="true">
      ${[0, 0.5, 1].map((t, i) => `
        <line x1="${18 + i * 76}" y1="25" x2="${58 + i * 76}" y2="25"
          stroke="${colorFor(t)}" stroke-width="${edgeStrokeWidth(t)}" stroke-linecap="round"></line>
      `).join("")}
    </svg>
    <div class="legendLabels">
      <span>${fmt(values[0])}</span>
      <span>${fmt(values[1])}</span>
      <span>${fmt(values[2])}</span>
    </div>
    <div class="legendMode">${scaleText}</div>`;
}

function filterBy(items, mode, reader, topN, topPercent, threshold) {
  const scored = items
    .filter((item) => reader(item) !== null && reader(item) !== undefined && Number.isFinite(Number(reader(item))))
    .sort((a, b) => Number(reader(b)) - Number(reader(a)));
  if (mode === "all") return new Set(scored.map((item) => item.id));
  if (mode === "topn") return new Set(scored.slice(0, Math.max(1, Number(topN) || 1)).map((item) => item.id));
  if (mode === "percent") {
    const count = Math.max(1, Math.ceil(scored.length * (Math.max(1, Number(topPercent) || 1) / 100)));
    return new Set(scored.slice(0, count).map((item) => item.id));
  }
  const minScore = Number(threshold) || 0;
  return new Set(scored.filter((item) => Number(reader(item)) >= minScore).map((item) => item.id));
}

function activeNodeIds() {
  if (!state.data) return new Set();
  return filterBy(
    state.data.nodes,
    state.nodeFilter,
    (node) => nodeValue(node),
    els.nodeTopN.value,
    els.nodeTopPercent.value,
    els.nodeThreshold.value,
  );
}

function activeEdgeIds(nodeIds = activeNodeIds()) {
  if (!state.data) return new Set();
  const edgeIds = filterBy(
    state.data.edges,
    state.edgeFilter,
    (edge) => scaledEdgeValue(edge),
    els.edgeTopN.value,
    els.edgeTopPercent.value,
    els.edgeThreshold.value,
  );
  return new Set(
    state.data.edges
      .filter((edge) => edgeIds.has(edge.id) && nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge) => edge.id),
  );
}

function selectedEdge() {
  return state.data && state.selectedKind === "edge" && state.data.edges.find((edge) => edge.id === state.selected);
}

function selectedNode() {
  return state.data && state.selectedKind === "node" && state.data.nodes.find((node) => node.id === state.selected);
}

function edgeLabel(edge) {
  return edge.id.replace("\t", "-");
}

function selectGraphItem(kind, id, options = {}) {
  state.selectedKind = kind;
  state.selected = id;
  state.detailsHidden = true;
  if (els.explorerSearch && options.updateSearch !== false) {
    els.explorerSearch.value = kind === "edge" ? edgeLabel({ id }) : id;
    els.explorerSearchResults.hidden = true;
  }
  if (options.center) centerSelection();
  render();
}

function centerSelection() {
  if (!state.data || !state.selected) return;
  let x = null;
  let y = null;
  if (state.selectedKind === "node") {
    const p = state.positions.get(state.selected);
    if (p) {
      x = p.x;
      y = p.y;
    }
  } else {
    const edge = state.data.edges.find((item) => item.id === state.selected);
    const a = edge && state.positions.get(edge.source);
    const b = edge && state.positions.get(edge.target);
    if (a && b) {
      x = (a.x + b.x) / 2;
      y = (a.y + b.y) / 2;
    }
  }
  if (x === null || y === null) return;
  state.panX = 450 - x * state.zoom;
  state.panY = 310 - y * state.zoom;
}

function connectedComponents(nodes, edges) {
  const ids = nodes.map((node) => node.id);
  const adjacent = new Map(ids.map((id) => [id, []]));
  edges.forEach((edge) => {
    if (adjacent.has(edge.source) && adjacent.has(edge.target)) {
      adjacent.get(edge.source).push(edge.target);
      adjacent.get(edge.target).push(edge.source);
    }
  });
  const seen = new Set();
  const components = [];
  ids.forEach((id) => {
    if (seen.has(id)) return;
    const stack = [id];
    const component = [];
    seen.add(id);
    while (stack.length) {
      const current = stack.pop();
      component.push(current);
      adjacent.get(current).forEach((next) => {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      });
    }
    components.push(component);
  });
  return components.sort((a, b) => b.length - a.length);
}

function seededJitter(seed) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 4294967295) - 0.5;
}

function layoutNodeRadii(nodes) {
  const [nodeSizeMin, nodeSizeMax] = range(nodes, nodeSizeValue);
  return new Map(nodes.map((node) => [node.id, nodeRadius(node, nodeSizeMin, nodeSizeMax)]));
}

function initializeComponentRings(nodes, edges, width, height) {
  const components = connectedComponents(nodes, edges);
  const componentCenters = new Map();
  const componentRing = Math.min(width, height) * 0.23;
  components.forEach((component, componentIndex) => {
    const angle = (2 * Math.PI * componentIndex) / Math.max(1, components.length);
    const cx = width / 2 + (components.length > 1 ? Math.cos(angle) * componentRing : 0);
    const cy = height / 2 + (components.length > 1 ? Math.sin(angle) * componentRing : 0);
    component.forEach((id) => componentCenters.set(id, { x: cx, y: cy }));
    component.forEach((id, idx) => {
      const nodeAngle = (2 * Math.PI * idx) / Math.max(1, component.length);
      const radius = 42 + 18 * Math.sqrt(component.length);
      state.positions.set(id, {
        x: cx + Math.cos(nodeAngle) * radius + seededJitter(`${id}:x`) * 24,
        y: cy + Math.sin(nodeAngle) * radius + seededJitter(`${id}:y`) * 24,
        dx: 0,
        dy: 0,
      });
    });
  });
  return componentCenters;
}

function relaxLayout(nodes, edges, componentCenters, radii, options) {
  const width = 900;
  const height = 620;
  const visibleNodeIds = nodes.map((node) => node.id);
  const area = width * height;
  const ideal = Math.sqrt(area / Math.max(1, visibleNodeIds.length)) * options.idealScale;
  let temperature = Math.min(width, height) * options.temperature;
  const iterInput = (typeof els !== "undefined" && els.iterations && Number(els.iterations.value)) || 0;
  const maxTicks = iterInput > 0 ? Math.max(40, iterInput * 8) : options.ticks;
  for (let tick = 0; tick < maxTicks; tick += 1) {
    visibleNodeIds.forEach((id) => {
      const p = state.positions.get(id);
      p.dx = 0;
      p.dy = 0;
    });
    for (let i = 0; i < visibleNodeIds.length; i += 1) {
      const a = state.positions.get(visibleNodeIds[i]);
      for (let j = i + 1; j < visibleNodeIds.length; j += 1) {
        const b = state.positions.get(visibleNodeIds[j]);
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.01) {
          dx = seededJitter(`${visibleNodeIds[i]}:${visibleNodeIds[j]}:x`) || 0.01;
          dy = seededJitter(`${visibleNodeIds[i]}:${visibleNodeIds[j]}:y`) || 0.01;
          dist = Math.sqrt(dx * dx + dy * dy) || 1;
        }
        const ra = radii.get(visibleNodeIds[i]) || 8;
        const rb = radii.get(visibleNodeIds[j]) || 8;
        const clearance = ra + rb + options.gap;
        // Hard collision push: prevents overlap, scales with how much the balls intersect.
        const overlapBoost = dist < clearance ? (clearance - dist) * options.collisionRepel * 4 : 0;
        // Soft long-range repel — falls off faster than classic FR (1/r^2 not k^2/r),
        // so springs can shrink edges instead of being out-pushed by every node pair.
        // Scales with sum of radii so big balls push harder than small ones.
        const sizeFactor = (ra + rb) / 16;
        const longRange = (clearance * clearance) / (dist * dist) * options.repel * sizeFactor * 18;
        const force = longRange + overlapBoost;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.dx += fx;
        a.dy += fy;
        b.dx -= fx;
        b.dy -= fy;
      }
    }
    edges.forEach((edge) => {
      const a = state.positions.get(edge.source);
      const b = state.positions.get(edge.target);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const raw = Math.max(0.05, edge.rawWeight || 0.3);
      const ra = radii.get(edge.source) || 8;
      const rb = radii.get(edge.target) || 8;
      // Desired length = just clear of the two node boundaries plus a small label gap.
      // This minimizes edge length while preventing overlap.
      const minSep = ra + rb + 14;
      const slack = options.inverseWeights ? (40 - raw * 22) : (24 - raw * 18);
      const desired = minSep + Math.max(0, slack);
      // Spring stiffness scales with edge weight — strong ties pull tight.
      const weightFactor = options.inverseWeights ? (1.4 - raw * 0.6) : (0.6 + raw * 1.6);
      const force = (dist - desired) * options.attract * weightFactor * 1.6;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.dx += fx;
      a.dy += fy;
      b.dx -= fx;
      b.dy -= fy;
    });
    visibleNodeIds.forEach((id) => {
      const p = state.positions.get(id);
      const center = componentCenters.get(id) || { x: width / 2, y: height / 2 };
      p.dx += (center.x - p.x) * options.gravity;
      p.dy += (center.y - p.y) * options.gravity;
      const disp = Math.max(0.01, Math.sqrt(p.dx * p.dx + p.dy * p.dy));
      p.x += (p.dx / disp) * Math.min(disp, temperature);
      p.y += (p.dy / disp) * Math.min(disp, temperature);
    });
    temperature *= options.cooling;
  }
}

function resolveNodeCollisions(nodes, radii, width, height) {
  const ids = nodes.map((node) => node.id);
  const gap = 5;
  for (let tick = 0; tick < 180; tick += 1) {
    let moved = false;
    for (let i = 0; i < ids.length; i += 1) {
      const a = state.positions.get(ids[i]);
      for (let j = i + 1; j < ids.length; j += 1) {
        const b = state.positions.get(ids[j]);
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.01) {
          dx = seededJitter(`${ids[i]}:${ids[j]}:collision:x`) || 0.01;
          dy = seededJitter(`${ids[i]}:${ids[j]}:collision:y`) || 0.01;
          dist = Math.sqrt(dx * dx + dy * dy) || 1;
        }
        const minDist = (radii.get(ids[i]) || 8) + (radii.get(ids[j]) || 8) + gap;
        if (dist >= minDist) continue;
        const shift = (minDist - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        a.x -= ux * shift;
        a.y -= uy * shift;
        b.x += ux * shift;
        b.y += uy * shift;
        moved = true;
      }
    }
    ids.forEach((id) => {
      const p = state.positions.get(id);
      const radius = radii.get(id) || 8;
      p.x = clamp(p.x, radius + gap, width - radius - gap);
      p.y = clamp(p.y, radius + gap, height - radius - gap);
    });
    if (!moved) break;
  }
}

function fitLayoutToView(nodes, radii, width, height) {
  const positions = nodes.map((node) => state.positions.get(node.id)).filter(Boolean);
  if (!positions.length) return;
  const pad = 62;
  const minX = Math.min(...nodes.map((node) => state.positions.get(node.id).x - (radii.get(node.id) || 8)));
  const maxX = Math.max(...nodes.map((node) => state.positions.get(node.id).x + (radii.get(node.id) || 8)));
  const minY = Math.min(...nodes.map((node) => state.positions.get(node.id).y - (radii.get(node.id) || 8)));
  const maxY = Math.max(...nodes.map((node) => state.positions.get(node.id).y + (radii.get(node.id) || 8)));
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY, 1.25);
  const offsetX = (width - spanX * scale) / 2 - minX * scale;
  const offsetY = (height - spanY * scale) / 2 - minY * scale;
  nodes.forEach((node) => {
    const p = state.positions.get(node.id);
    p.x = p.x * scale + offsetX;
    p.y = p.y * scale + offsetY;
  });
}

function ensureLayout(nodeIds, edgeIds) {
  if (!state.data) return;
  const width = 900;
  const height = 620;
  const nodes = state.data.nodes.filter((node) => nodeIds.has(node.id));
  const edges = state.data.edges.filter((edge) => edgeIds.has(edge.id));
  const radiusSignature = `${state.nodeScale}:${state.nodeSizeMode}:${els.nodeMinRadius.value}:${els.nodeMaxRadius.value}:${els.nodeRadiusFold.value}`;
  const signature = `${state.layoutMode}|${radiusSignature}|${nodes.map((n) => n.id).join(",")}|${edges.map((e) => e.id).join(",")}`;
  if (signature === state.layoutSignature) return;
  state.layoutSignature = signature;
  state.positions = new Map();

  if (!nodes.length) return;
  const radii = layoutNodeRadii(nodes);
  const componentCenters = initializeComponentRings(nodes, edges, width, height);
  const modes = {
    force: { ticks: 620, idealScale: 1.0, temperature: 0.24, cooling: 0.985, repel: 1.0, attract: 0.19, gravity: 0.045, gap: 7, collisionRepel: 1.35, inverseWeights: false },
    organic: { ticks: 760, idealScale: 1.18, temperature: 0.28, cooling: 0.982, repel: 1.25, attract: 0.12, gravity: 0.025, gap: 10, collisionRepel: 1.7, inverseWeights: false },
    dema: { ticks: 820, idealScale: 1.08, temperature: 0.20, cooling: 0.986, repel: 1.45, attract: 0.16, gravity: 0.035, gap: 9, collisionRepel: 2.1, inverseWeights: true },
  };
  relaxLayout(nodes, edges, componentCenters, radii, modes[state.layoutMode] || modes.dema);
  resolveNodeCollisions(nodes, radii, width, height);
  fitLayoutToView(nodes, radii, width, height);
  resolveNodeCollisions(nodes, radii, width, height);
}

function edgeReason(edge) {
  if (state.metric === "raw") return `direct rank ${edgeRank(edge, "raw") || "-"}`;
  if (state.metric === "wiper1") {
    if (!edge.wiper1) return "no WIPER1 score";
    const ext = edge.wiper1.extended ? "novel candidate" : "input edge";
    return `edge-neighborhood degree ${edge.wiper1.degree}; ${ext}`;
  }
  if (!edge.wiper2) return "no WIPER2 score";
  return `path load ${fmt(edge.wiper2.pathLoad)}; co-path degree ${edge.wiper2.coPathDegree || 0}`;
}

function drawNetwork() {
  if (!state.data) return;
  const nodeIds = activeNodeIds();
  const edgeIds = activeEdgeIds(nodeIds);
  const routeNodeIds = new Set(state.plannedRoute ? state.plannedRoute.nodes : []);
  const routeEdgeIds = state.plannedRoute ? state.plannedRoute.edgeIds : new Set();
  routeNodeIds.forEach((nodeId) => nodeIds.add(nodeId));
  routeEdgeIds.forEach((edgeId) => edgeIds.add(edgeId));
  ensureLayout(nodeIds, edgeIds);
  els.svg.replaceChildren();

  // Grid background — Google Maps / Figma-style canvas grid
  const gridDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  gridDefs.innerHTML = `
    <pattern id="canvasGridSm" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--canvas-grid-fine, rgba(15, 23, 42, 0.06))" stroke-width="0.6"/>
    </pattern>
    <pattern id="canvasGrid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
      <rect width="100" height="100" fill="url(#canvasGridSm)"/>
      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="var(--canvas-grid-major, rgba(15, 23, 42, 0.10))" stroke-width="0.9"/>
    </pattern>
  `;
  els.svg.appendChild(gridDefs);
  const gridRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  gridRect.setAttribute("x", "-2000");
  gridRect.setAttribute("y", "-2000");
  gridRect.setAttribute("width", "4900");
  gridRect.setAttribute("height", "4620");
  gridRect.setAttribute("fill", "url(#canvasGrid)");
  gridRect.setAttribute("pointer-events", "none");
  els.svg.appendChild(gridRect);

  const nodes = state.data.nodes.filter((node) => nodeIds.has(node.id));
  const edges = state.data.edges.filter((edge) => edgeIds.has(edge.id));
  const [edgeMin, edgeMax] = range(edges, scaledEdgeValue);
  const [nodeMin, nodeMax] = range(nodes, nodeValue);
  const [nodeSizeMin, nodeSizeMax] = range(nodes, nodeSizeValue);
  renderEdgeLegend(edges, edgeMin, edgeMax);
  renderSizeLegend(nodes, nodeSizeMin, nodeSizeMax);

  const edgeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const nodeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const pulseLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const viewport = document.createElementNS("http://www.w3.org/2000/svg", "g");
  viewport.setAttribute("transform", `translate(${state.panX} ${state.panY}) scale(${state.zoom})`);
  viewport.append(edgeLayer, pulseLayer, nodeLayer);
  els.svg.append(viewport);

  edges.forEach((edge) => {
    const a = state.positions.get(edge.source);
    const b = state.positions.get(edge.target);
    if (!a || !b) return;
    const t = normalize(scaledEdgeValue(edge), edgeMin, edgeMax);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", a.x);
    line.setAttribute("y1", a.y);
    line.setAttribute("x2", b.x);
    line.setAttribute("y2", b.y);
    line.setAttribute("stroke", colorFor(t));
    line.setAttribute("stroke-width", String(edgeStrokeWidth(t)));
    line.setAttribute(
      "class",
      `edge ${routeEdgeIds.has(edge.id) ? "route" : (state.plannedRoute ? "dim" : "")} ${state.selectedKind === "edge" && edge.id === state.selected ? "selected" : ""} ${state.searchMatches && state.searchMatches.edges.has(edge.id) ? "match" : ""} ${state.searchMatches && !state.searchMatches.edges.has(edge.id) ? "searchDim" : ""}`,
    );
    line.addEventListener("mouseenter", (event) => showTooltip(event, edgeTooltip(edge)));
    line.addEventListener("mousemove", tooltipMove);
    line.addEventListener("mouseleave", hideTooltip);
    line.addEventListener("click", () => {
      selectGraphItem("edge", edge.id, { updateSearch: true });
    });
    edgeLayer.appendChild(line);
  });

  const selected = selectedEdge();
  const selectedNodeItem = selectedNode();
  nodes.forEach((node) => {
    const p = state.positions.get(node.id);
    if (!p) return;
    const t = normalize(nodeValue(node), nodeMin, nodeMax);
    const radius = nodeRadius(node, nodeSizeMin, nodeSizeMax);
    const originalRadius = rawNodeRadius(node, nodes);
    const activeNode = (selected && (selected.source === node.id || selected.target === node.id))
      || (selectedNodeItem && selectedNodeItem.id === node.id);
    const routeNode = routeNodeIds.has(node.id);
    const routeEndpoint = state.plannedRoute && (node.id === state.plannedRoute.sourceId || node.id === state.plannedRoute.targetId);
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    if (state.nodePulse && state.nodePulse.id === node.id) {
      const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pulse.setAttribute("cx", p.x);
      pulse.setAttribute("cy", p.y);
      pulse.setAttribute("r", Math.max(radius + 1, originalRadius));
      pulse.setAttribute("class", "nodePulse");
      pulseLayer.appendChild(pulse);
    }
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    circle.setAttribute("r", activeNode || routeEndpoint ? radius + 3 : radius);
    circle.setAttribute("fill", colorFor(t));
    circle.setAttribute("class", `node ${activeNode ? "active" : ""} ${routeNode ? "route" : ""} ${routeEndpoint ? "routeEndpoint" : ""} ${state.plannedRoute && !routeNode ? "dim" : ""} ${state.searchMatches && state.searchMatches.nodes.has(node.id) ? "match" : ""} ${state.searchMatches && !state.searchMatches.nodes.has(node.id) ? "searchDim" : ""}`);
    circle.addEventListener("mouseenter", (event) => showTooltip(event, nodeTooltip(node)));
    circle.addEventListener("mousemove", tooltipMove);
    circle.addEventListener("mouseleave", hideTooltip);
    circle.addEventListener("pointerdown", (event) => beginNodeDrag(event, node.id));
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", p.x + radius + 5);
    label.setAttribute("y", p.y + 4);
    label.setAttribute("class", `nodeLabel${state.plannedRoute && !routeNode ? " dim" : ""}${state.searchMatches && !state.searchMatches.nodes.has(node.id) ? " searchDim" : ""}${state.searchMatches && state.searchMatches.nodes.has(node.id) ? " match" : ""}`);
    label.textContent = node.id;
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${node.id}: WINNER ${fmt(node.winner)} rank ${node.rank}`;
    circle.appendChild(title);
    group.append(circle, label);
    nodeLayer.appendChild(group);
  });
}

function svgPointFromEvent(event) {
  const rect = els.svg.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 900,
    y: ((event.clientY - rect.top) / rect.height) * 620,
  };
}

function resetZoom() {
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  drawNetwork();
}

function zoomBy(factor) {
  const previous = state.zoom;
  const next = clamp(previous * factor, 0.35, 5);
  const point = { x: 450, y: 310 };
  const worldX = (point.x - state.panX) / previous;
  const worldY = (point.y - state.panY) / previous;
  state.zoom = next;
  state.panX = point.x - worldX * next;
  state.panY = point.y - worldY * next;
  drawNetwork();
}

function beginNodeDrag(event, nodeId) {
  if (event.button !== undefined && event.button !== 0) return;
  const pos = state.positions.get(nodeId);
  if (!pos) return;
  event.preventDefault();
  event.stopPropagation();
  hideTooltip();
  const start = svgPointFromEvent(event);
  const drag = {
    pointerId: event.pointerId,
    startVB: start,
    startWorld: { x: pos.x, y: pos.y },
    moved: false,
    nodeId,
  };
  els.svg.classList.add("nodeDragging");
  document.body.classList.add("nodeDragging");

  const onMove = (e) => {
    if (e.pointerId !== drag.pointerId) return;
    const cur = svgPointFromEvent(e);
    const dxVB = cur.x - drag.startVB.x;
    const dyVB = cur.y - drag.startVB.y;
    if (!drag.moved && Math.hypot(dxVB, dyVB) > 2) drag.moved = true;
    const zoom = state.zoom || 1;
    state.positions.set(drag.nodeId, {
      x: drag.startWorld.x + dxVB / zoom,
      y: drag.startWorld.y + dyVB / zoom,
    });
    if (drag.moved) drawNetwork();
  };
  const onUp = (e) => {
    if (e.pointerId !== drag.pointerId) return;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    els.svg.classList.remove("nodeDragging");
    document.body.classList.remove("nodeDragging");
    if (!drag.moved) {
      selectGraphItem("node", drag.nodeId, { updateSearch: true });
      state.nodePulse = { id: drag.nodeId };
      drawNetwork();
      window.setTimeout(() => {
        if (state.nodePulse && state.nodePulse.id === drag.nodeId) {
          state.nodePulse = null;
          drawNetwork();
        }
      }, 720);
    }
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
}

function setupNetworkZoom() {
  els.svg.addEventListener("wheel", (event) => {
    event.preventDefault();
    const point = svgPointFromEvent(event);
    const previous = state.zoom;
    const next = clamp(previous * (event.deltaY < 0 ? 1.12 : 0.88), 0.35, 5);
    const worldX = (point.x - state.panX) / previous;
    const worldY = (point.y - state.panY) / previous;
    state.zoom = next;
    state.panX = point.x - worldX * next;
    state.panY = point.y - worldY * next;
    drawNetwork();
  }, { passive: false });

  let panStart = null;
  els.svg.addEventListener("pointerdown", (event) => {
    if (event.target !== els.svg) return;
    const point = svgPointFromEvent(event);
    panStart = { x: point.x, y: point.y, panX: state.panX, panY: state.panY };
    els.svg.setPointerCapture(event.pointerId);
    els.svg.classList.add("panning");
  });
  els.svg.addEventListener("pointermove", (event) => {
    if (!panStart) return;
    const point = svgPointFromEvent(event);
    state.panX = panStart.panX + point.x - panStart.x;
    state.panY = panStart.panY + point.y - panStart.y;
    drawNetwork();
  });
  const endPan = () => {
    panStart = null;
    els.svg.classList.remove("panning");
  };
  els.svg.addEventListener("pointerup", endPan);
  els.svg.addEventListener("pointercancel", endPan);
}

function renderTable() {
  if (!state.data) return;
  const nodeIds = activeNodeIds();
  const edgeIds = activeEdgeIds(nodeIds);
  const needle = els.filter.value.trim().toLowerCase();
  const edges = [...state.data.edges]
    .filter((edge) => !needle || edge.id.toLowerCase().replace("\t", "-").includes(needle))
    .sort((a, b) => {
      const av = scaledEdgeValue(a);
      const bv = scaledEdgeValue(b);
      if (av === null || av === undefined || !Number.isFinite(av)) return 1;
      if (bv === null || bv === undefined || !Number.isFinite(bv)) return -1;
      return bv - av;
    });
  els.rows.replaceChildren();
  edges.forEach((edge) => {
    const row = document.createElement("tr");
    row.className = state.selectedKind === "edge" && edge.id === state.selected ? "selected" : "";
    row.addEventListener("click", () => {
      selectGraphItem("edge", edge.id, { updateSearch: true });
    });
    const edgeName = edgeLabel(edge);
    row.innerHTML = `
      <td><strong>${edgeName}</strong><br>${edgeIds.has(edge.id) ? '<span class="badge">shown</span>' : '<span class="rank">hidden</span>'}</td>
      <td>${fmt(edge.rawWeight)}<br><span class="rank">#${edge.rawRank || "-"}</span></td>
      <td>${fmt(edge.wiper1 && edge.wiper1.score)}<br><span class="rank">#${(edge.wiper1 && edge.wiper1.rank) || "-"}</span></td>
      <td>${fmt(edge.wiper2 && edge.wiper2.score)}<br><span class="rank">#${(edge.wiper2 && edge.wiper2.rank) || "-"}</span></td>
      <td>${fmt(edge.wiper2 && edge.wiper2.pathLoad)}</td>
      <td class="reason">${edgeReason(edge)}</td>`;
    els.rows.appendChild(row);
  });
}

function renderNodesTable() {
  if (!state.data || !els.nodeRows) return;
  const nodeIds = activeNodeIds();
  const needle = els.filter.value.trim().toLowerCase();
  const nodes = [...state.data.nodes]
    .filter((node) => !needle || node.id.toLowerCase().includes(needle))
    .sort((a, b) => Number(nodeValue(b)) - Number(nodeValue(a)));
  els.nodeRows.replaceChildren();
  nodes.forEach((node) => {
    const row = document.createElement("tr");
    row.className = `${nodeIds.has(node.id) ? "" : "mutedRow"} ${state.selectedKind === "node" && state.selected === node.id ? "selected" : ""}`;
    row.addEventListener("click", () => {
      selectGraphItem("node", node.id, { updateSearch: true });
    });
    row.innerHTML = `
      <td><strong>${escapeHtml(node.id)}</strong><br>${nodeIds.has(node.id) ? '<span class="badge">shown</span>' : '<span class="rank">hidden</span>'}</td>
      <td>${fmt(node.winner0)} -> ${fmt(node.winner)}</td>
      <td>${fmt(node.winnerInitialWeight)} -> ${fmt(node.winnerWeight)}</td>
      <td>${node.degree}</td>
      <td>#${node.rank}</td>`;
    els.nodeRows.appendChild(row);
  });
}

function renderSelected() {
  const edge = selectedEdge();
  const node = selectedNode();
  if (!edge && !node) {
    els.selected.textContent = "None";
    return;
  }
  if (node) {
    const incident = state.data.edges.filter((item) => item.source === node.id || item.target === node.id);
    const lines = [
      ["Node", node.id],
      ["WINNER UFC", `${fmt(node.winner0)} -> ${fmt(node.winner)}`],
      ["WINNER W", `${fmt(node.winnerInitialWeight)} -> ${fmt(node.winnerWeight)}`],
      ["Degree", node.degree],
      ["Rank", `#${node.rank}`],
      ["Incident edges", incident.length],
    ];
    els.selected.replaceChildren();
    lines.forEach(([label, value]) => {
      const div = document.createElement("div");
      div.className = "detailLine";
      div.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      els.selected.appendChild(div);
    });
    return;
  }
  const nodeMap = new Map(state.data.nodes.map((node) => [node.id, node]));
  const nodeIds = activeNodeIds();
  const shown = activeEdgeIds(nodeIds).has(edge.id) ? "Yes" : "No";
  const source = nodeMap.get(edge.source);
  const target = nodeMap.get(edge.target);
  const lines = [
    ["Edge", edgeLabel(edge)],
    ["Raw weight", fmt(edge.rawWeight)],
    ["WIPER1 UFC", fmt(edge.wiper1 && edge.wiper1.score)],
    ["WIPER1 W", fmt(edge.wiper1 && edge.wiper1.weight)],
    ["WIPER2 UFC", fmt(edge.wiper2 && edge.wiper2.score)],
    ["WIPER2 W", fmt(edge.wiper2 && edge.wiper2.weight)],
    ["Path load", fmt(edge.wiper2 && edge.wiper2.pathLoad)],
    [`${edge.source} WINNER`, source ? `${fmt(source.winner)} (#${source.rank})` : "-"],
    [`${edge.target} WINNER`, target ? `${fmt(target.winner)} (#${target.rank})` : "-"],
    ["Shown", shown],
  ];
  els.selected.replaceChildren();
  lines.forEach(([label, value]) => {
    const div = document.createElement("div");
    div.className = "detailLine";
    div.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    els.selected.appendChild(div);
  });
}

function detailLinesHtml(lines) {
  return `<div class="detailGrid">${lines.map(([label, value]) => `
    <div class="detailLine"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
  `).join("")}</div>`;
}

function renderExplorerDetails() {
  if (!els.explorerDetails) return;
  const body = els.explorerDetailsBody || els.explorerDetails;
  const edge = selectedEdge();
  const node = selectedNode();
  const hasSelection = Boolean(edge || node);
  if (els.explorerDetailsShow) {
    els.explorerDetailsShow.hidden = !(hasSelection && state.detailsHidden);
  }
  if (!hasSelection || state.detailsHidden) {
    els.explorerDetails.hidden = true;
    body.textContent = "";
    return;
  }
  els.explorerDetails.hidden = false;
  if (edge) {
    const nodeMap = new Map(state.data.nodes.map((item) => [item.id, item]));
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    const m = state.metric;
    const measureLabel = state.edgeMeasure === "weight" ? "W" : "UFC";
    let topRows;
    if (m === "raw") {
      topRows = [
        ["Raw weight", fmt(edge.rawWeight)],
        ["Raw rank", `#${edge.rawRank || "-"}`],
        ["Reason", edgeReason(edge)],
      ];
    } else {
      const bucket = m === "wiper1" ? edge.wiper1 : edge.wiper2;
      topRows = [
        [`${metricLabel()} ${measureLabel}`, fmt(edgeValue(edge))],
        [`${metricLabel()} rank`, `#${edgeRank(edge, m) || "-"}`],
        ["Reason", edgeReason(edge)],
      ];
      if (bucket) {
        if (state.edgeMeasure === "weight") {
          topRows.push([`${metricLabel()} initial W`, fmt(bucket.w0)]);
        } else {
          topRows.push([`${metricLabel()} initial UFC`, fmt(bucket.ufc0)]);
        }
        if (m === "wiper2" && bucket.pathLoad !== undefined) {
          topRows.push(["Path load", fmt(bucket.pathLoad)]);
        }
      }
    }
    body.innerHTML = `
      <details open>
        <summary>${escapeHtml(edgeLabel(edge))}<span class="searchScore">${metricLabel()} ${m === "raw" ? "raw" : measureLabel}</span></summary>
        ${detailLinesHtml(topRows)}
      </details>
      <details>
        <summary>Endpoint WINNER scores<span class="searchScore">nodes</span></summary>
        ${detailLinesHtml([
          [edge.source, source ? `${fmt(source.winner0)} -> ${fmt(source.winner)} (#${source.rank})` : "-"],
          [edge.target, target ? `${fmt(target.winner0)} -> ${fmt(target.winner)} (#${target.rank})` : "-"],
        ])}
      </details>`;
    return;
  }
  const incident = state.data.edges
    .filter((item) => item.source === node.id || item.target === node.id)
    .sort((a, b) => Number(edgeValue(b) || 0) - Number(edgeValue(a) || 0))
    .slice(0, 8);
  body.innerHTML = `
    <details open>
      <summary>${escapeHtml(node.id)}<span class="searchScore">node</span></summary>
      ${detailLinesHtml([
        ["WINNER UFC", `${fmt(node.winner0)} -> ${fmt(node.winner)}`],
        ["WINNER W", `${fmt(node.winnerInitialWeight)} -> ${fmt(node.winnerWeight)}`],
        ["Degree", String(node.degree)],
        ["Rank", `#${node.rank}`],
      ])}
    </details>
    <details>
      <summary>Incident edge scores<span class="searchScore">${incident.length}</span></summary>
      ${detailLinesHtml(incident.map((item) => [
        edgeLabel(item),
        `${metricLabel()} ${fmt(edgeValue(item))}`,
      ]))}
    </details>`;
}

function searchItems(query) {
  if (!state.data) return [];
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const nodes = state.data.nodes
    .filter((node) => node.id.toLowerCase().includes(needle))
    .map((node) => ({
      kind: "node",
      id: node.id,
      name: node.id,
      score: `WINNER ${fmt(node.winner)}`,
      rank: node.rank || 999999,
    }));
  const edges = state.data.edges
    .filter((edge) => edgeLabel(edge).toLowerCase().includes(needle))
    .map((edge) => ({
      kind: "edge",
      id: edge.id,
      name: edgeLabel(edge),
      score: `${metricLabel()} ${fmt(edgeValue(edge))}`,
      rank: edgeRank(edge, state.metric) || 999999,
    }));
  return [...nodes, ...edges].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)).slice(0, 50);
}

function renderSearchResults() {
  if (!els.explorerSearchResults || !els.explorerSearch) return;
  const query = els.explorerSearch.value;
  const trimmed = query ? query.trim() : "";
  const focused = document.activeElement === els.explorerSearch;
  const results = searchItems(query);
  // Maintain a global highlight set the SVG can read to mark matched items.
  const prev = state.searchMatches;
  if (trimmed.length && focused) {
    state.searchMatches = {
      nodes: new Set(results.filter((r) => r.kind === "node").map((r) => r.id)),
      edges: new Set(results.filter((r) => r.kind === "edge").map((r) => r.id)),
    };
  } else {
    state.searchMatches = null;
  }
  const sig = (m) => m ? `${[...m.nodes].sort().join("|")}::${[...m.edges].sort().join("|")}` : "";
  if (sig(prev) !== sig(state.searchMatches)) drawNetwork();
  if (!focused) { els.explorerSearchResults.hidden = true; return; }
  els.explorerSearchResults.replaceChildren();
  if (!results.length) {
    els.explorerSearchResults.hidden = true;
    return;
  }
  els.explorerSearchResults.hidden = false;
  results.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `searchResult ${state.selectedKind === item.kind && state.selected === item.id ? "active" : ""}`;
    button.innerHTML = `
      <span class="searchKind">${item.kind}</span>
      <span class="searchName">${escapeHtml(item.name)}</span>
      <span class="searchScore">${escapeHtml(item.score)}</span>`;
    button.addEventListener("click", () => {
      selectGraphItem(item.kind, item.id, { updateSearch: true, center: true });
    });
    els.explorerSearchResults.appendChild(button);
  });
}

function updateNodeOptions() {
  if (!els.nodeOptions || !state.data) return;
  const signature = state.data.nodes.map((node) => node.id).join("\t");
  if (els.nodeOptions.dataset.signature === signature) return;
  els.nodeOptions.dataset.signature = signature;
  els.nodeOptions.replaceChildren();
  state.data.nodes.forEach((node) => {
    const option = document.createElement("option");
    option.value = node.id;
    els.nodeOptions.appendChild(option);
  });
}

function normalizeNodeToken(value) {
  return String(value || "").trim().replace(/^[("'[{]+|[)"'\]}.,;:]+$/g, "");
}

function findNodeId(value) {
  if (!state.data) return null;
  const token = normalizeNodeToken(value);
  if (!token) return null;
  const exact = state.data.nodes.find((node) => node.id === token);
  if (exact) return exact.id;
  const lower = token.toLowerCase();
  const insensitive = state.data.nodes.find((node) => node.id.toLowerCase() === lower);
  return insensitive ? insensitive.id : null;
}

function routeProbability(edge, mode) {
  // Use the WIPER weight (normalized [0,1] probability) rather than the
  // UFC `score`, which is an unbounded counts-like quantity. Top edges have
  // score ≈ 1 and produce p=1.000, −log p=0.000 — not a probability.
  let p;
  if (mode === "raw") p = Number(edge.rawWeight);
  else if (mode === "wiper1") p = edge.wiper1 && Number(edge.wiper1.weight);
  else if (mode === "wiper2") p = edge.wiper2 && Number(edge.wiper2.weight);
  else p = Number(edge.rawWeight);
  if (!Number.isFinite(p) || p <= 0) return 1e-6;
  return Math.min(0.999999, p);
}

function routeEdgeCost(edge, mode) {
  if (mode === "hops") return 1;
  return -Math.log(routeProbability(edge, mode));
}

function routeStrength(edge) {
  return routeProbability(edge, state.routeMode || "wiper2");
}

function bestRoute(sourceId, targetId, mode) {
  if (!state.data || sourceId === targetId) return null;
  mode = mode || state.routeMode || "wiper2";
  const graph = new Map(state.data.nodes.map((node) => [node.id, []]));
  state.data.edges.forEach((edge) => {
    if (!graph.has(edge.source) || !graph.has(edge.target)) return;
    const cost = routeEdgeCost(edge, mode);
    graph.get(edge.source).push({ node: edge.target, edge, cost });
    graph.get(edge.target).push({ node: edge.source, edge, cost });
  });
  const distances = new Map(state.data.nodes.map((node) => [node.id, Infinity]));
  const previous = new Map();
  const unvisited = new Set(state.data.nodes.map((node) => node.id));
  distances.set(sourceId, 0);

  while (unvisited.size) {
    let current = null;
    let currentDistance = Infinity;
    unvisited.forEach((nodeId) => {
      const distance = distances.get(nodeId);
      if (distance < currentDistance) {
        current = nodeId;
        currentDistance = distance;
      }
    });
    if (current === null || currentDistance === Infinity) break;
    unvisited.delete(current);
    if (current === targetId) break;
    graph.get(current).forEach((step) => {
      if (!unvisited.has(step.node)) return;
      const distance = currentDistance + step.cost;
      if (distance < distances.get(step.node)) {
        distances.set(step.node, distance);
        previous.set(step.node, { node: current, edge: step.edge });
      }
    });
  }

  if (!previous.has(targetId)) return null;
  const nodes = [targetId];
  const edges = [];
  let current = targetId;
  while (current !== sourceId) {
    const step = previous.get(current);
    if (!step) return null;
    edges.unshift(step.edge);
    current = step.node;
    nodes.unshift(current);
  }
  const totalCost = edges.reduce((sum, edge) => sum + routeEdgeCost(edge, mode), 0);
  const totalProbability = edges.reduce((prod, edge) => prod * routeProbability(edge, mode), 1);
  const averageStrength = edges.reduce((sum, edge) => sum + routeProbability(edge, mode), 0) / Math.max(1, edges.length);
  return { sourceId, targetId, nodes, edges, totalCost, totalProbability, averageStrength, mode };
}

function routeModeLabel(mode) {
  if (mode === "hops") return "fewest hops";
  if (mode === "raw") return "raw weight";
  if (mode === "wiper1") return "WIPER1";
  return "WIPER2";
}

function renderRouteDirections(route) {
  const panel = document.getElementById("routeDirections");
  if (!panel) return;
  if (!route) { panel.hidden = true; panel.innerHTML = ""; return; }
  const mode = route.mode || "wiper2";
  const totalCost = Number(route.totalCost) || 0;
  const totalProb = Number(route.totalProbability) || 0;
  const summaryRight = mode === "hops"
    ? `${route.edges.length} hop${route.edges.length === 1 ? "" : "s"}`
    : `\u03A3 \u2212log p ${fmt(totalCost)} \u00B7 \u220F p ${fmt(totalProb)}`;
  const legs = route.edges.map((edge, i) => {
    const from = route.nodes[i];
    const to = route.nodes[i + 1];
    const p = routeProbability(edge, mode);
    const cost = routeEdgeCost(edge, mode);
    return `<li class="routeLeg">
      <span class="legIndex">${i + 1}</span>
      <div class="legBody">
        <div class="legPath"><strong>${escapeHtml(from)}</strong><span class="legArrow">\u2192</span><strong>${escapeHtml(to)}</strong></div>
        <div class="legMeta">${mode === "hops" ? "1 hop" : `p ${fmt(p)} \u00B7 \u2212log p ${fmt(cost)}`}</div>
      </div>
    </li>`;
  }).join("");
  panel.innerHTML = `
    <header class="routeDirectionsHead">
      <div>
        <div class="routeBadge">${escapeHtml(routeModeLabel(mode))}</div>
        <div class="routeWaypoints"><strong>${escapeHtml(route.sourceId)}</strong><span class="legArrow">\u2192</span><strong>${escapeHtml(route.targetId)}</strong></div>
      </div>
      <div class="routeStat">${escapeHtml(summaryRight)}</div>
    </header>
    <ol class="routeLegs">${legs}</ol>`;
  panel.hidden = false;
}

function routeSummary(route) {
  const mode = route.mode || "wiper2";
  const legs = route.edges.map((edge, index) => {
    const from = route.nodes[index];
    const to = route.nodes[index + 1];
    return `${from}-${to} p ${fmt(routeProbability(edge, mode))}`;
  });
  return `Trip ${route.sourceId} to ${route.targetId}: ${route.nodes.join(" -> ")}. ${route.edges.length} leg${route.edges.length === 1 ? "" : "s"}; average ${metricLabel()} strength ${fmt(route.averageStrength)}. Legs: ${legs.join("; ")}.`;
}

function centerRoute(route) {
  if (!route || !route.nodes.length) return;
  const points = route.nodes.map((nodeId) => state.positions.get(nodeId)).filter(Boolean);
  if (!points.length) return;
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const spanX = Math.max(140, maxX - minX);
  const spanY = Math.max(120, maxY - minY);
  const padLeft = 380, padRight = 80, padTop = 90, padBottom = 90;
  const availW = 900 - padLeft - padRight;
  const availH = 620 - padTop - padBottom;
  state.zoom = clamp(Math.min(availW / spanX, availH / spanY), 0.55, 2.6);
  const targetX = padLeft + availW / 2;
  const targetY = padTop + availH / 2;
  state.panX = targetX - ((minX + maxX) / 2) * state.zoom;
  state.panY = targetY - ((minY + maxY) / 2) * state.zoom;
}

function planTrip(sourceValue, targetValue) {
  if (!state.data) {
    addChatMessage("agent", "Analyze or generate a network before planning a trip.");
    return false;
  }
  const sourceId = findNodeId(sourceValue);
  const targetId = findNodeId(targetValue);
  if (!sourceId || !targetId) {
    addChatMessage("agent", "I could not find both nodes in the current network. Try exact node names from the graph.");
    return false;
  }
  if (sourceId === targetId) {
    addChatMessage("agent", "Pick two different nodes for trip planning.");
    return false;
  }
  const route = bestRoute(sourceId, targetId);
  if (!route) {
    state.plannedRoute = null;
    render();
    addChatMessage("agent", `No connected route found between ${sourceId} and ${targetId}.`);
    return false;
  }
  state.plannedRoute = {
    sourceId,
    targetId,
    nodes: route.nodes,
    edgeIds: new Set(route.edges.map((edge) => edge.id)),
  };
  if (els.routeSource) els.routeSource.value = sourceId;
  if (els.routeTarget) els.routeTarget.value = targetId;
  state.selectedKind = "edge";
  state.selected = route.edges[0].id;
  state.detailsHidden = true;
  render();
  centerRoute(route);
  drawNetwork();
  renderRouteDirections(route);
  addChatMessage("agent", routeSummary(route));
  return true;
}

function parseRouteInstruction(text) {
  const token = "([A-Za-z0-9_.:-]+)";
  const patterns = [
    new RegExp(`\\b(?:route|navigate|trip|path|plan(?:\\s+trip)?)\\b.*?\\bfrom\\s+${token}\\s+(?:to|toward|->)\\s+${token}`, "i"),
    new RegExp(`\\bfrom\\s+${token}\\s+(?:to|toward|->)\\s+${token}`, "i"),
    new RegExp(`\\b(?:route|navigate|trip|path|plan(?:\\s+trip)?)\\b\\s+${token}\\s+(?:to|toward|and|->)\\s+${token}`, "i"),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return [normalizeNodeToken(match[1]), normalizeNodeToken(match[2])];
  }
  return null;
}

function render() {
  if (!state.data) return;
  const s = state.data.summary;
  const nodeIds = activeNodeIds();
  const edgeIds = activeEdgeIds(nodeIds);
  els.summary.textContent = `${nodeIds.size}/${s.nodeCount} nodes, ${edgeIds.size}/${s.inputEdgeCount} edges shown`;
  if (els.viewSummary) {
    const routeText = state.plannedRoute ? `, trip ${state.plannedRoute.sourceId} to ${state.plannedRoute.targetId}` : "";
    els.viewSummary.textContent = `${state.layoutMode.toUpperCase()} layout, ${metricLabel()} ${state.metric === "raw" ? "raw" : state.edgeMeasure.toUpperCase()} view, ${state.edgeScale} edge scale${routeText}`;
  }
  updateNodeOptions();
  drawNetwork();
  renderTable();
  renderNodesTable();
  renderSelected();
  renderExplorerDetails();
  renderSearchResults();
}

async function analyze() {
  els.summary.textContent = "Scoring...";
  els.summary.className = "";
  const payload = {
    text: els.edgeText.value,
    iterations: Number(els.iterations.value) || 80,
    device: els.device.value,
    includeNovel: els.includeNovel.checked,
  };
  const response = await fetch(apiUrl("/api/analyze"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) {
    els.summary.textContent = result.error || "Analysis failed";
    els.summary.className = "error";
    return;
  }
  state.data = result;
  state.positions = new Map();
  state.layoutSignature = "";
  state.plannedRoute = null;
  // Start with no selection — selection details / show-details bar stay hidden
  // until the user actively clicks a node, edge, or search result.
  state.selected = null;
  state.selectedKind = null;
  state.detailsHidden = true;
  render();
}

function generatorSettings() {
  const nodeCount = Math.max(3, Math.min(80, Math.round(Number(els.generatorNodeCount.value) || 12)));
  const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
  const edgeCount = Math.max(nodeCount - 1, Math.min(maxEdges, Math.round(Number(els.generatorEdgeCount.value) || 18)));
  let minWeight = Math.max(0, Math.min(1, Number(els.generatorMinWeight.value) || 0));
  let maxWeight = Math.max(0, Math.min(1, Number(els.generatorMaxWeight.value) || 1));
  if (minWeight > maxWeight) [minWeight, maxWeight] = [maxWeight, minWeight];
  els.generatorNodeCount.value = nodeCount;
  els.generatorEdgeCount.value = edgeCount;
  els.generatorMinWeight.value = minWeight.toFixed(2);
  els.generatorMaxWeight.value = maxWeight.toFixed(2);
  return { nodeCount, edgeCount, minWeight, maxWeight };
}

function randomWeight(minWeight, maxWeight) {
  return minWeight + Math.random() * (maxWeight - minWeight);
}

function makeGeneratedEdges(settings) {
  const nodes = Array.from({ length: settings.nodeCount }, (_, i) => `N${i + 1}`);
  const edges = [];
  const keys = new Set();
  const degrees = new Map(nodes.map((node) => [node, 0]));
  const add = (a, b, weight) => {
    if (a === b) return false;
    const key = [a, b].sort().join("\t");
    if (keys.has(key)) return false;
    keys.add(key);
    degrees.set(a, (degrees.get(a) || 0) + 1);
    degrees.set(b, (degrees.get(b) || 0) + 1);
    edges.push([a, b, Math.max(0, Math.min(1, weight))]);
    return true;
  };
  const randomPair = () => {
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    let b = nodes[Math.floor(Math.random() * nodes.length)];
    while (b === a) b = nodes[Math.floor(Math.random() * nodes.length)];
    return [a, b];
  };
  const weightedPick = (candidates, avoid = new Set()) => {
    const pool = candidates.filter((node) => !avoid.has(node));
    const total = pool.reduce((sum, node) => sum + (degrees.get(node) || 0) + 1, 0);
    let draw = Math.random() * total;
    for (const node of pool) {
      draw -= (degrees.get(node) || 0) + 1;
      if (draw <= 0) return node;
    }
    return pool[pool.length - 1];
  };

  if (state.generatorModel === "scale-free") {
    add(nodes[0], nodes[1], randomWeight(settings.minWeight, settings.maxWeight));
    for (let i = 2; i < nodes.length && edges.length < settings.edgeCount; i += 1) {
      const existing = nodes.slice(0, i);
      const first = weightedPick(existing);
      add(nodes[i], first, randomWeight(settings.minWeight, settings.maxWeight));
      if (edges.length < settings.edgeCount && Math.random() < 0.35) {
        const second = weightedPick(existing, new Set([first]));
        if (second) add(nodes[i], second, randomWeight(settings.minWeight, settings.maxWeight));
      }
    }
    let attempts = 0;
    while (edges.length < settings.edgeCount && attempts < settings.edgeCount * 80) {
      const a = weightedPick(nodes);
      const b = weightedPick(nodes, new Set([a]));
      add(a, b, randomWeight(settings.minWeight, settings.maxWeight));
      attempts += 1;
    }
  } else {
    for (let i = 0; i < nodes.length - 1; i += 1) {
      const high = 0.65 + Math.random() * 0.35;
      add(nodes[i], nodes[i + 1], settings.minWeight + (settings.maxWeight - settings.minWeight) * high);
    }
    let attempts = 0;
    while (edges.length < settings.edgeCount && attempts < settings.edgeCount * 80) {
      const [a, b] = randomPair();
      add(a, b, randomWeight(settings.minWeight, settings.maxWeight));
      attempts += 1;
    }
  }
  return edges;
}

function makeRandom() {
  const edges = makeGeneratedEdges(generatorSettings());
  els.edgeText.value = ["node1\tnode2\tweight", ...edges.map((e) => `${e[0]}\t${e[1]}\t${e[2].toFixed(3)}`)].join("\n");
  analyze();
}

function makeGeneterrain() {
  setSegment("generatorModelSegments", "generatorModel", "scale-free", "data-generator");
  els.generatorNodeCount.value = 24;
  els.generatorEdgeCount.value = 44;
  els.generatorMinWeight.value = "0.08";
  els.generatorMaxWeight.value = "0.98";
  const edges = makeGeneratedEdges(generatorSettings());
  const boosted = edges.map(([a, b, w]) => {
    const ai = Number(a.slice(1));
    const bi = Number(b.slice(1));
    const sameNeighborhood = Math.floor((ai - 1) / 6) === Math.floor((bi - 1) / 6);
    return [a, b, Math.min(0.99, sameNeighborhood ? w + 0.18 : w)];
  });
  els.edgeText.value = ["node1\tnode2\tweight", ...boosted.map((e) => `${e[0]}\t${e[1]}\t${e[2].toFixed(3)}`)].join("\n");
  analyze();
}

function rowsToTsv(rows) {
  return rows.map((row) => row.map((value) => value === null || value === undefined ? "" : String(value)).join("\t")).join("\n");
}

function downloadText(filename, text, type = "text/tab-separated-values;charset=utf-8") {
  const blob = new Blob([text], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function edgeExportRows() {
  if (!state.data) return;
  const rows = [[
    "nodeA", "nodeB", "rawWeight", "rawRank", "wiper1UFC", "wiper1W", "wiper1Rank",
    "wiper2UFC", "wiper2W", "wiper2Rank", "pathLoad", "shown",
  ]];
  const shown = activeEdgeIds();
  state.data.edges.forEach((edge) => rows.push([
    edge.source,
    edge.target,
    edge.rawWeight,
    edge.rawRank,
    edge.wiper1 && edge.wiper1.score,
    edge.wiper1 && edge.wiper1.weight,
    edge.wiper1 && edge.wiper1.rank,
    edge.wiper2 && edge.wiper2.score,
    edge.wiper2 && edge.wiper2.weight,
    edge.wiper2 && edge.wiper2.rank,
    edge.wiper2 && edge.wiper2.pathLoad,
    shown.has(edge.id) ? "Yes" : "No",
  ]));
  return rows;
}

function nodeExportRows() {
  if (!state.data) return;
  const shown = activeNodeIds();
  const rows = [["node", "winner0UFC", "winnerUFC", "winner0W", "winnerW", "degree", "rank", "shown"]];
  state.data.nodes.forEach((node) => rows.push([
    node.id,
    node.winner0,
    node.winner,
    node.winnerInitialWeight,
    node.winnerWeight,
    node.degree,
    node.rank,
    shown.has(node.id) ? "Yes" : "No",
  ]));
  return rows;
}

function shownNetworkRows() {
  if (!state.data) return;
  const shown = activeEdgeIds();
  const rows = [["node1", "node2", "weight", "score"]];
  state.data.edges
    .filter((edge) => shown.has(edge.id))
    .forEach((edge) => rows.push([edge.source, edge.target, edge.rawWeight, edgeValue(edge)]));
  return rows;
}

function exportEdges() {
  downloadText("spinner_edge_scores.tsv", rowsToTsv(edgeExportRows()));
}

function exportNodes() {
  downloadText("spinner_node_scores.tsv", rowsToTsv(nodeExportRows()));
}

function exportShownNetwork() {
  downloadText("spinner_backbone_network.tsv", rowsToTsv(shownNetworkRows()));
}

function outputGeneterrainNetwork() {
  downloadText("spinner_geneterrain_network.tsv", rowsToTsv(shownNetworkRows()));
  addChatMessage("agent", "Exported the visible network as a Geneterrain-ready TSV.");
}

function outputNotionReport() {
  exportMarkdown();
  addChatMessage("agent", "Exported a Notion-ready Markdown report.");
}

function htmlTable(rows) {
  return `<table>${rows.map((row, i) => `<tr>${row.map((cell) => `<${i === 0 ? "th" : "td"}>${escapeHtml(cell === null || cell === undefined ? "" : cell)}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</table>`;
}

function methodSummary() {
  const s = state.data && state.data.summary;
  const edgeIds = activeEdgeIds();
  const nodeIds = activeNodeIds();
  return [
    "network SPINNER ranks protein interaction network edges using WIPER1 and WIPER2 edge scoring with WINNER-style node scoring.",
    `Current view: ${metricLabel()} edge score, ${state.edgeMeasure.toUpperCase()} measure, ${state.edgeScale} scale.`,
    s ? `The analyzed network contains ${s.nodeCount} nodes and ${s.inputEdgeCount} input edges; ${nodeIds.size} nodes and ${edgeIds.size} edges are visible after filtering.` : "",
  ].filter(Boolean).join(" ");
}

function exportExcel() {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>SPINNER results</title></head><body>
    <h1>SPINNER results</h1>
    <h2>Edges</h2>${htmlTable(edgeExportRows())}
    <h2>Nodes</h2>${htmlTable(nodeExportRows())}
    <h2>Shown network</h2>${htmlTable(shownNetworkRows())}
  </body></html>`;
  downloadText("spinner_results.xls", html, "application/vnd.ms-excel;charset=utf-8");
}

function exportMarkdown() {
  const topEdges = edgeExportRows().slice(0, 11);
  const table = topEdges.map((row) => `| ${row.map((cell) => String(cell ?? "").replaceAll("|", "\\|")).join(" | ")} |`);
  table.splice(1, 0, `| ${topEdges[0].map(() => "---").join(" | ")} |`);
  const text = `# SPINNER Results\n\n## Method\n\n${methodSummary()}\n\n## Top Edges\n\n${table.join("\n")}\n`;
  downloadText("spinner_report.md", text, "text/markdown;charset=utf-8");
}

function exportWord() {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>SPINNER method and results</title></head><body>
    <h1>SPINNER Method and Results</h1>
    <h2>Method</h2><p>${escapeHtml(methodSummary())}</p>
    <h2>Edge Results</h2>${htmlTable(edgeExportRows().slice(0, 26))}
    <h2>Node Results</h2>${htmlTable(nodeExportRows().slice(0, 26))}
  </body></html>`;
  downloadText("spinner_method_results.doc", html, "application/msword;charset=utf-8");
}

function exportFigure() {
  const clone = els.svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.insertAdjacentHTML("afterbegin", `<style>
    .edge{stroke-linecap:round}.node{stroke:#334155;stroke-width:2}.node.active{stroke:#b45309;stroke-width:3}
    .nodeLabel{font:700 12px sans-serif;fill:#1f2937;paint-order:stroke;stroke:#fff;stroke-width:4px}
  </style>`);
  downloadText("spinner_network_figure.svg", new XMLSerializer().serializeToString(clone), "image/svg+xml;charset=utf-8");
}

function addChatMessage(role, text) {
  if (!els.chatLog) return;
  const div = document.createElement("div");
  div.className = `chatMessage ${role}`;
  div.textContent = text;
  els.chatLog.appendChild(div);
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

function setSegment(id, stateKey, value, dataKey) {
  const buttons = document.querySelectorAll(`#${id} button`);
  buttons.forEach((button) => {
    const active = button.getAttribute(dataKey) === value;
    button.classList.toggle("active", active);
    if (active) state[stateKey] = value;
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setCssPxVar(name, value) {
  document.documentElement.style.setProperty(name, `${Math.round(value)}px`);
}

function setupDrag(handle, onMove) {
  if (!handle) return;
  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    handle.classList.add("dragging");
    document.body.classList.add("isResizing");
    handle.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      onMove(moveEvent.clientX - startX, moveEvent.clientY - startY);
    };
    const end = () => {
      handle.classList.remove("dragging");
      document.body.classList.remove("isResizing");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  });
}

function setupResizablePanels() {
  let sidebarStart = 318;
  let agentStart = 292;
  let resultsStart = 260;
  setupDrag(els.leftResize, (dx) => {
    if (state.sidebarCollapsed) {
      setSidebarCollapsed(false);
      sidebarStart = 260;
    }
    setCssPxVar("--sidebar-width", clamp(sidebarStart + dx, 180, 520));
  });
  els.leftResize && els.leftResize.addEventListener("pointerdown", () => {
    sidebarStart = state.sidebarCollapsed ? 56 : els.leftPane.getBoundingClientRect().width;
  });

  setupDrag(els.agentResize, (dx) => {
    setCssPxVar("--agent-width", clamp(agentStart - dx, 220, 560));
  });

  setupDrag(els.resultsResize, (_dx, dy) => {
    const maxHeight = Math.max(180, window.innerHeight - 240);
    setCssPxVar("--results-height", clamp(resultsStart - dy, 170, maxHeight));
  });
  els.resultsResize && els.resultsResize.addEventListener("pointerdown", () => {
    resultsStart = els.resultsPanel.getBoundingClientRect().height;
  });

  els.sidebarToggle.addEventListener("click", () => {
    setSidebarCollapsed(!state.sidebarCollapsed);
  });
}

function applyChatInstruction() {
  const text = (els.chatInput.value || "").trim();
  if (!text) return;
  addChatMessage("user", text);
  const lower = text.toLowerCase();
  const notes = [];

  const topMatch = lower.match(/top\s+(\d+)/);
  const percentMatch = lower.match(/(\d+)\s*%/);
  const thresholdMatch = lower.match(/(?:threshold|min|score)\s+([0-9.]+)/);
  const nodesMatch = lower.match(/(\d+)\s+nodes?/);
  const edgesMatch = lower.match(/(\d+)\s+edges?/);
  const iterationsMatch = lower.match(/(\d+)\s+iterations?/);
  const routeRequest = parseRouteInstruction(text);

  if (lower.includes("wiper2")) {
    setSegment("metricSegments", "metric", "wiper2", "data-metric");
    notes.push("using WIPER2");
  } else if (lower.includes("wiper1")) {
    setSegment("metricSegments", "metric", "wiper1", "data-metric");
    notes.push("using WIPER1");
  } else if (lower.includes("raw")) {
    setSegment("metricSegments", "metric", "raw", "data-metric");
    notes.push("using raw weights");
  }
  if (lower.includes(" log")) {
    setSegment("edgeScaleSegments", "edgeScale", "log", "data-scale");
    notes.push("edge scale set to log");
  } else if (lower.includes("normal") || lower.includes("linear")) {
    setSegment("edgeScaleSegments", "edgeScale", "normal", "data-scale");
    notes.push("edge scale set to normal");
  }
  if (lower.includes(" ufc")) {
    setSegment("edgeMeasureSegments", "edgeMeasure", "ufc", "data-measure");
    notes.push("edge measure set to UFC");
  } else if (lower.includes(" final w") || lower.includes(" weight")) {
    setSegment("edgeMeasureSegments", "edgeMeasure", "weight", "data-measure");
    notes.push("edge measure set to W");
  }
  if (lower.includes("dema")) {
    setSegment("layoutModeSegments", "layoutMode", "dema", "data-layout");
    notes.push("layout set to DEMA");
  } else if (lower.includes("force")) {
    setSegment("layoutModeSegments", "layoutMode", "force", "data-layout");
    notes.push("layout set to force-directed");
  } else if (lower.includes("organic")) {
    setSegment("layoutModeSegments", "layoutMode", "organic", "data-layout");
    notes.push("layout set to organic");
  }
  if (topMatch) {
    setSegment("edgeFilterSegments", "edgeFilter", "topn", "data-mode");
    els.edgeTopN.value = topMatch[1];
    notes.push(`showing top ${topMatch[1]} edges`);
  } else if (percentMatch) {
    setSegment("edgeFilterSegments", "edgeFilter", "percent", "data-mode");
    els.edgeTopPercent.value = percentMatch[1];
    notes.push(`showing top ${percentMatch[1]}% edges`);
  } else if (thresholdMatch) {
    setSegment("edgeFilterSegments", "edgeFilter", "threshold", "data-mode");
    els.edgeThreshold.value = thresholdMatch[1];
    notes.push(`edge threshold set to ${thresholdMatch[1]}`);
  }
  if (lower.includes("include novel")) {
    els.includeNovel.checked = true;
    notes.push("WIPER1 novel edges enabled");
  }
  if (lower.includes("scale-free") || lower.includes("scale free")) {
    setSegment("generatorModelSegments", "generatorModel", "scale-free", "data-generator");
    notes.push("generator set to scale-free");
  } else if (lower.includes("random")) {
    setSegment("generatorModelSegments", "generatorModel", "random", "data-generator");
    notes.push("generator set to random");
  }
  if (nodesMatch) {
    els.generatorNodeCount.value = nodesMatch[1];
    notes.push(`${nodesMatch[1]} generator nodes`);
  }
  if (edgesMatch) {
    els.generatorEdgeCount.value = edgesMatch[1];
    notes.push(`${edgesMatch[1]} generator edges`);
  }
  if (iterationsMatch) {
    els.iterations.value = iterationsMatch[1];
    notes.push(`${iterationsMatch[1]} iterations`);
  }
  if (routeRequest) {
    state.layoutSignature = "";
    if (notes.length) addChatMessage("agent", `Applied: ${notes.join("; ")}.`);
    planTrip(routeRequest[0], routeRequest[1]);
  } else if (lower.includes("geneterrain")) {
    makeGeneterrain();
    addChatMessage("agent", "Generated a Geneterrain-style seeded neighborhood and rescored it.");
  } else if (lower.includes("generate")) {
    makeRandom();
    addChatMessage("agent", `Generated and rescored a ${state.generatorModel} network.`);
  } else if (lower.includes("analyze") || lower.includes("rescore") || lower.includes("novel")) {
    analyze();
    addChatMessage("agent", notes.length ? `Applied: ${notes.join("; ")}. Rescored network.` : "Rescored the current network.");
  } else {
    state.layoutSignature = "";
    render();
    addChatMessage("agent", notes.length ? `Applied: ${notes.join("; ")}.` : "I can adjust scoring, filters, generator size, scale, and analysis settings from short commands.");
  }
  els.chatInput.value = "";
}

function bindSegments(id, stateKey, dataKey) {
  document.getElementById(id).addEventListener("click", (event) => {
    const button = event.target.closest(`button[${dataKey}]`);
    if (!button) return;
    setSegment(id, stateKey, button.getAttribute(dataKey), dataKey);
    state.layoutSignature = "";
    render();
  });
}

bindSegments("metricSegments", "metric", "data-metric");
bindSegments("edgeMeasureSegments", "edgeMeasure", "data-measure");
bindSegments("edgeScaleSegments", "edgeScale", "data-scale");
bindSegments("nodeScaleSegments", "nodeScale", "data-scale");
bindSegments("nodeSizeModeSegments", "nodeSizeMode", "data-size-mode");
bindSegments("layoutModeSegments", "layoutMode", "data-layout");
bindSegments("generatorModelSegments", "generatorModel", "data-generator");
bindSegments("edgeFilterSegments", "edgeFilter", "data-mode");
bindSegments("nodeFilterSegments", "nodeFilter", "data-mode");
function syncFilterRows() {
  document.querySelectorAll('[data-filter-row]').forEach((row) => {
    const which = row.getAttribute('data-filter-row');
    const mode = which === 'edge' ? state.edgeFilter : state.nodeFilter;
    row.querySelectorAll('[data-filter-input]').forEach((label) => {
      label.hidden = label.getAttribute('data-filter-input') !== mode;
    });
    row.hidden = mode === 'all';
  });
}
syncFilterRows();
document.getElementById('edgeFilterSegments').addEventListener('click', syncFilterRows);
document.getElementById('nodeFilterSegments').addEventListener('click', syncFilterRows);
setupResizablePanels();
setupNetworkZoom();

document.getElementById("resultTabs").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-tab]");
  if (!button) return;
  setResultTab(button.getAttribute("data-tab"));
});

els.themeToggle.addEventListener("click", toggleTheme);
els.account.addEventListener("click", () => {
  addChatMessage("agent", "Account settings are reserved for future workspace customization.");
});
els.navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const target = item.getAttribute("data-nav-panel");
    if (!target) return; // navAction items handle their own click below
    if (target === "assistant") {
      openAssistant();
      return;
    }
    setSidePanel(target);
    if (state.sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  });
});
els.generateNetwork.addEventListener("click", makeRandom);
els.generateGeneterrain.addEventListener("click", makeGeneterrain);
els.resultEdges.addEventListener("click", () => setResultTab("edges", { focus: true }));
els.resultNodes.addEventListener("click", () => setResultTab("nodes", { focus: true }));
els.outputGeneterrain.addEventListener("click", outputGeneterrainNetwork);
const tidyLayoutBtn = document.getElementById("tidyLayoutBtn");
if (tidyLayoutBtn) {
  tidyLayoutBtn.addEventListener("click", () => {
    state.positions = new Map();
    state.layoutSignature = "";
    tidyLayoutBtn.classList.add("isWorking");
    requestAnimationFrame(() => {
      render();
      resetZoom();
      setTimeout(() => tidyLayoutBtn.classList.remove("isWorking"), 200);
    });
  });
}
els.zoomIn.addEventListener("click", () => zoomBy(1.22));
els.zoomOut.addEventListener("click", () => zoomBy(0.82));
els.explorerFullscreenBtn.addEventListener("click", () => {
  setExplorerFullscreen(!state.explorerFullscreen);
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.explorerFullscreen) {
    setExplorerFullscreen(false);
  }
});
els.networkSettingsBtn.addEventListener("click", () => {
  els.networkSettings.hidden = !els.networkSettings.hidden;
});
els.networkSettingsClose.addEventListener("click", () => {
  els.networkSettings.hidden = true;
});
if (els.explorerDetailsClose) {
  els.explorerDetailsClose.addEventListener("click", () => {
    state.detailsHidden = true;
    render();
  });
}
if (els.explorerDetailsShow) {
  els.explorerDetailsShow.addEventListener("click", () => {
    state.detailsHidden = false;
    render();
  });
}
els.filter.addEventListener("input", () => {
  renderTable();
  renderNodesTable();
});
els.explorerSearch.addEventListener("input", renderSearchResults);
els.explorerSearch.addEventListener("focus", renderSearchResults);
els.explorerSearch.addEventListener("blur", () => {
  // Delay so a click on a result item still registers
  setTimeout(() => {
    if (els.explorerSearchResults) els.explorerSearchResults.hidden = true;
    if (state.searchMatches) { state.searchMatches = null; drawNetwork(); }
  }, 120);
});
els.explorerSearch.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const first = searchItems(els.explorerSearch.value)[0];
  if (first) {
    selectGraphItem(first.kind, first.id, { updateSearch: true, center: true });
  }
});
els.chatApply.addEventListener("click", applyChatInstruction);
els.chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    applyChatInstruction();
  }
});
[els.routeSource, els.routeTarget].forEach((input) => {
  let _t = 0;
  const sched = () => {
    clearTimeout(_t);
    _t = setTimeout(() => {
      const a = (els.routeSource.value || "").trim();
      const b = (els.routeTarget.value || "").trim();
      if (a && b && a !== b) planTrip(a, b);
    }, 180);
  };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") planTrip(els.routeSource.value, els.routeTarget.value);
  });
  input.addEventListener("change", sched);
  input.addEventListener("input", sched);
});
els.exportEdges.addEventListener("click", exportEdges);
els.exportNodes.addEventListener("click", exportNodes);
els.exportShown.addEventListener("click", exportShownNetwork);
els.exportExcel.addEventListener("click", exportExcel);
els.exportMarkdown.addEventListener("click", outputNotionReport);
els.exportWord.addEventListener("click", exportWord);
els.exportFigure.addEventListener("click", exportFigure);
[
  els.edgeTopN,
  els.edgeTopPercent,
  els.edgeThreshold,
  els.nodeTopN,
  els.nodeTopPercent,
  els.nodeThreshold,
  els.nodeMinRadius,
  els.nodeMaxRadius,
  els.nodeRadiusFold,
].forEach((input) => input.addEventListener("input", () => {
  state.layoutSignature = "";
  render();
}));
els.includeNovel.addEventListener("change", analyze);
els.fileInput.addEventListener("change", async () => {
  const file = els.fileInput.files && els.fileInput.files[0];
  if (!file) return;
  els.edgeText.value = await file.text();
  analyze();
});

try {
  setTheme(window.localStorage.getItem("spinnerTheme") || "light");
} catch (_err) {
  setTheme("light");
}
setSidePanel("input");
setSidebarCollapsed(true);
window.addEventListener("resize", () => {
  if (isNarrowViewport() && !state.sidebarCollapsed) {
    setSidebarCollapsed(true);
  }
});
makeRandom();
addChatMessage("agent", "Tell me how to shape the network: choose WIPER1 or WIPER2, show top N edges, plan a trip from A to F, generate a scale-free graph, run Geneterrain, or analyze the current input.");

// ===================== ASSISTANT DRAWER =====================
function openAssistant() {
  document.body.classList.add('assistantOpen');
  const drawer = document.getElementById('assistantDrawer');
  const scrim = document.getElementById('assistantScrim');
  const fab = document.getElementById('assistantFab');
  if (drawer) drawer.setAttribute('aria-hidden', 'false');
  if (scrim) scrim.hidden = false;
  if (fab) fab.setAttribute('aria-expanded', 'true');
  setTimeout(() => { const i = document.getElementById('chatInput'); if (i) i.focus(); }, 220);
}
function closeAssistant() {
  document.body.classList.remove('assistantOpen');
  const drawer = document.getElementById('assistantDrawer');
  const scrim = document.getElementById('assistantScrim');
  const fab = document.getElementById('assistantFab');
  if (drawer) drawer.setAttribute('aria-hidden', 'true');
  if (scrim) setTimeout(() => { scrim.hidden = true; }, 200);
  if (fab) fab.setAttribute('aria-expanded', 'false');
}
(function wireAssistantDrawer() {
  const fab = document.getElementById('assistantFab');
  const closeBtn = document.getElementById('assistantCloseBtn');
  const scrim = document.getElementById('assistantScrim');
  if (fab) fab.addEventListener('click', openAssistant);
  if (closeBtn) closeBtn.addEventListener('click', closeAssistant);
  if (scrim) scrim.addEventListener('click', closeAssistant);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('assistantOpen')) closeAssistant();
  });
})();

// ===================== DIRECTIONS CARD =====================
(function wireDirectionsCard() {
  const card = document.getElementById('directionsCard');
  const openBtn = document.getElementById('directionsCardOpenBtn');
  const body = document.getElementById('directionsCardBody');
  if (!card || !openBtn || !body) return;
  function setOpen(open) {
    card.setAttribute('data-state', open ? 'open' : 'closed');
    openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    body.hidden = !open;
    if (open) setTimeout(() => { const i = document.getElementById('routeSourceInput'); if (i) i.focus(); }, 50);
  }
  openBtn.addEventListener('click', () => setOpen(true));
  // Delegated close handler — robust against stacking / late mounts
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('#directionsCardCloseBtn');
    if (t) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
  });
})();

// Mode tabs + swap wiring
(function wireRouteControls(){
  const seg = document.getElementById('routeModeSegments');
  if (seg) {
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-route-mode]');
      if (!btn) return;
      const mode = btn.getAttribute('data-route-mode');
      state.routeMode = mode;
      seg.querySelectorAll('button[data-route-mode]').forEach(b => b.classList.toggle('active', b === btn));
      const a = (els.routeSource.value || '').trim();
      const b = (els.routeTarget.value || '').trim();
      if (a && b && a !== b) planTrip(a, b);
    });
  }
  const swap = document.getElementById('routeSwapBtn');
  if (swap) {
    swap.addEventListener('click', () => {
      const a = els.routeSource.value;
      els.routeSource.value = els.routeTarget.value;
      els.routeTarget.value = a;
      const s = (els.routeSource.value || '').trim();
      const t = (els.routeTarget.value || '').trim();
      if (s && t && s !== t) planTrip(s, t);
    });
  }
})();
