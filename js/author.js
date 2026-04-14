/**
 * author.js — Interactive story graph viewer
 *
 * Uses d3 to render a force-directed graph of the CYOA story structure.
 * Clicking a node loads that page's text in the detail panel and highlights
 * all descendants.
 *
 * Node colour key:
 *   Blue (trunk)       — pages on the main trunk from page 2
 *   Green (ending)     — terminal pages with "The End"
 *   Amber (stub)       — reachable pages with missing/empty text
 *   Gray (unreachable) — pages not reachable from page 2
 *   Steel blue         — all other story pages
 */

import { loadGraph } from './graph.js';

// ── DOM refs ───────────────────────────────────────────────────────────────

const svg        = document.getElementById('graph-svg');
const graphRoot  = document.getElementById('graph-root');
const detailTitle = document.getElementById('detail-title');
const detailMeta  = document.getElementById('detail-meta');
const detailBody  = document.getElementById('detail-body');

const statTotal      = document.getElementById('stat-total');
const statEndings    = document.getElementById('stat-endings');
const statStubs      = document.getElementById('stat-stubs');
const statUnreachable = document.getElementById('stat-unreachable');

// ── State ──────────────────────────────────────────────────────────────────

let graph = null;
let selectedNode = null;

// d3 zoom transform
let transform = d3.zoomIdentity;

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  detailBody.innerHTML = '<p class="detail-empty loading">Loading story graph…</p>';
  try {
    graph = await loadGraph();
  } catch (err) {
    detailBody.innerHTML = `<p class="error-msg">Failed to load: ${err.message}</p>`;
    return;
  }

  fillStats();
  renderGraph();
  setupZoomButtons();
}

// ── Stats bar ──────────────────────────────────────────────────────────────

function fillStats() {
  statTotal.textContent      = graph.allNodes.length;
  statEndings.textContent    = graph.endings.length;
  statStubs.textContent      = graph.stubs.length;
  statUnreachable.textContent = graph.unreachable.length;
}

// ── Node classification ────────────────────────────────────────────────────

const trunkSet = new Set();

function nodeClass(num) {
  if (trunkSet.has(num))                 return 'trunk';
  if (graph.pages[num]?.isEnding)        return 'ending';
  if (graph.pages[num]?.isStub)          return 'stub';
  if (graph.pages[num]?.isUnreachable)   return 'unreachable';
  return 'normal';
}

// ── Graph render ───────────────────────────────────────────────────────────

function renderGraph() {
  // Build trunk set
  for (const n of graph.mainTrunk) trunkSet.add(n);

  // Prepare d3 nodes and links
  const nodes = graph.allNodes.map(num => ({ id: num, cls: nodeClass(num) }));
  const links = [];
  for (const [from, tos] of Object.entries(graph.adjacency)) {
    for (const to of tos) {
      links.push({ source: +from, target: to });
    }
  }

  const svgEl = d3.select(svg);
  const root  = d3.select(graphRoot);
  const W = svg.clientWidth  || 900;
  const H = svg.clientHeight || 700;

  // ── Zoom behaviour ──────────────────────────────────────────────────────
  const zoom = d3.zoom()
    .scaleExtent([.05, 4])
    .on('zoom', (event) => {
      transform = event.transform;
      root.attr('transform', transform);
    });

  svgEl.call(zoom);
  svg._zoom = zoom; // expose for buttons

  // ── Force simulation ────────────────────────────────────────────────────
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(60).strength(.8))
    .force('charge', d3.forceManyBody().strength(-220))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(18))
    .force('x', d3.forceX(W / 2).strength(.04))
    .force('y', d3.forceY(H / 2).strength(.04));

  // ── Links ───────────────────────────────────────────────────────────────
  const isTrunkLink = (d) =>
    trunkSet.has(typeof d.source === 'object' ? d.source.id : d.source) &&
    trunkSet.has(typeof d.target === 'object' ? d.target.id : d.target);

  const link = root.append('g').attr('class', 'links')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('class', d => `link${isTrunkLink(d) ? ' link--trunk' : ''}`)
    .attr('marker-end', d => isTrunkLink(d) ? 'url(#arrowhead-trunk)' : 'url(#arrowhead)');

  // ── Nodes ───────────────────────────────────────────────────────────────
  const node = root.append('g').attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', d => `node node--${d.cls}`)
    .call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      })
    )
    .on('click', (event, d) => {
      event.stopPropagation();
      selectNode(d.id, node, link);
    });

  node.append('circle').attr('r', 13);
  node.append('text').text(d => d.id);

  // Click on background → deselect
  svgEl.on('click', () => clearSelection(node, link));

  // ── Tick ────────────────────────────────────────────────────────────────
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // After simulation cools, fit everything in view
  simulation.on('end', fitView);
}

// ── Selection ──────────────────────────────────────────────────────────────

function descendants(startNum) {
  const visited = new Set();
  const queue = [startNum];
  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const next of (graph.adjacency[cur] || [])) queue.push(next);
  }
  return visited;
}

function selectNode(num, nodeSel, linkSel) {
  selectedNode = num;
  const desc = descendants(num);

  // Node classes
  nodeSel.each(function(d) {
    const g = d3.select(this);
    const inDesc = desc.has(d.id);
    g.classed('node--faded',    !inDesc)
     .classed('node--selected', d.id === num);
  });

  // Link classes
  linkSel.each(function(d) {
    const src = typeof d.source === 'object' ? d.source.id : d.source;
    const tgt = typeof d.target === 'object' ? d.target.id : d.target;
    const inPath = desc.has(src) && desc.has(tgt);
    d3.select(this)
      .classed('link--faded',    !inPath)
      .classed('link--selected', src === num);
  });

  showDetail(num);
}

function clearSelection(nodeSel, linkSel) {
  selectedNode = null;
  nodeSel.classed('node--faded', false).classed('node--selected', false);
  linkSel.classed('link--faded', false).classed('link--selected', false);
  resetDetail();
}

// ── Detail panel ──────────────────────────────────────────────────────────

function showDetail(num) {
  const page = graph.pages[num];
  if (!page) return;

  detailTitle.textContent = `Page ${num}`;

  const incoming = (graph.reverseAdj[num] || []).join(', ') || 'none';
  const outgoing = (graph.adjacency[num] || []).join(', ') || 'none';

  const badges = [];
  if (trunkSet.has(num)) badges.push('<span style="color:var(--trunk)">Main trunk</span>');
  if (page.isEnding)     badges.push('<span style="color:var(--terminal)">Ending</span>');
  if (page.isStub)       badges.push('<span style="color:var(--stub)">Incomplete</span>');
  if (page.isUnreachable) badges.push('<span style="color:var(--unreachable)">Unreachable</span>');

  detailMeta.innerHTML = `
    <span><strong>From:</strong> ${escapeHtml(incoming)}</span>
    <span><strong>To:</strong> ${escapeHtml(outgoing)}</span>
    ${badges.join(' ')}
  `;

  const displayText = page.text
    .replace(/^Page\s+\d+\s*/i, '')
    .trim();

  detailBody.textContent = displayText || '(no text extracted for this page)';
}

function resetDetail() {
  detailTitle.textContent = 'Story Graph';
  detailMeta.innerHTML = '';
  detailBody.innerHTML = '<p class="detail-empty">Click any node to read that page.</p>';
}

// ── Zoom controls ──────────────────────────────────────────────────────────

function setupZoomButtons() {
  const svgEl = d3.select(svg);

  document.getElementById('zoom-in').addEventListener('click', () => {
    svgEl.transition().duration(250).call(svg._zoom.scaleBy, 1.4);
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    svgEl.transition().duration(250).call(svg._zoom.scaleBy, 1 / 1.4);
  });
  document.getElementById('zoom-fit').addEventListener('click', fitView);
}

function fitView() {
  const svgEl = d3.select(svg);
  const W = svg.clientWidth  || 900;
  const H = svg.clientHeight || 700;

  const root = d3.select(graphRoot);
  const bounds = graphRoot.getBBox();
  if (!bounds.width || !bounds.height) return;

  const scale = Math.min(.9, Math.min(W / bounds.width, H / bounds.height));
  const tx = (W - scale * bounds.width)  / 2 - scale * bounds.x;
  const ty = (H - scale * bounds.height) / 2 - scale * bounds.y;

  svgEl.transition().duration(500)
    .call(svg._zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
}

// ── Utility ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Boot ───────────────────────────────────────────────────────────────────

init();
