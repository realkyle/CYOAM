/**
 * reader.js — Interactive story reader
 *
 * Loads the graph data, then lets the user navigate through the story
 * by clicking choice buttons. Maintains a history stack so they can
 * go back. Detects terminal pages and shows an ending screen.
 */

import { loadGraph } from './graph.js';

// ── DOM references ─────────────────────────────────────────────────────────

const readerMain  = document.getElementById('reader-main');
const breadcrumb  = document.getElementById('breadcrumb');
const btnBack     = document.getElementById('btn-back');
const btnRestart  = document.getElementById('btn-restart');

// ── State ──────────────────────────────────────────────────────────────────

let graph   = null;
let history = []; // stack of page numbers visited

// ── Initialise ─────────────────────────────────────────────────────────────

async function init() {
  try {
    graph = await loadGraph();
  } catch (err) {
    readerMain.innerHTML = `<p class="error-msg">Failed to load story data: ${err.message}</p>`;
    return;
  }

  btnBack.addEventListener('click', goBack);
  btnRestart.addEventListener('click', restart);

  navigateTo(graph.startPage);
}

// ── Navigation ─────────────────────────────────────────────────────────────

function navigateTo(pageNum) {
  history.push(pageNum);
  renderPage(pageNum);
  updateBreadcrumb();
  btnBack.disabled = history.length <= 1;
  // Scroll to top of reading area
  readerMain.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goBack() {
  if (history.length <= 1) return;
  history.pop();
  const prev = history[history.length - 1];
  history.pop(); // will be re-pushed by navigateTo
  navigateTo(prev);
}

function restart() {
  history = [];
  navigateTo(graph.startPage);
}

// ── Render ─────────────────────────────────────────────────────────────────

function renderPage(pageNum) {
  const page = graph.pages[pageNum];
  if (!page) {
    readerMain.innerHTML = `<p class="error-msg">Page ${pageNum} not found in the story graph.</p>`;
    return;
  }

  // Strip the "Page N" header line from the display text
  const displayText = page.text
    .replace(/^Page\s+\d+\s*/i, '')
    .trim();

  // Determine outgoing choices from graph (authoritative) overlaid with
  // extracted labels from text.
  const outgoing = graph.adjacency[pageNum] || [];
  const labelMap = {};
  for (const c of page.choices) labelMap[c.target] = c.label;

  const isEnding = page.isTerminal || page.isEnding;

  // Build HTML
  let html = `
    <div class="page-enter">
      <p class="page-badge">Page ${pageNum}</p>
      <div class="story-text">${escapeHtml(displayText)}</div>
  `;

  if (isEnding) {
    html += buildEndingHtml(pageNum);
  } else if (outgoing.length > 0) {
    html += `<div class="choices"><p class="choices__heading">Your choices</p>`;
    for (const target of outgoing) {
      const label = labelMap[target] || `Turn to page ${target}`;
      html += `
        <button class="choice-btn" data-target="${target}">
          ${escapeHtml(label)}
        </button>`;
    }
    html += `</div>`;
  } else {
    // Outgoing edges exist in text but page is a dead end in graph
    html += `<div class="choices"><p class="choices__heading" style="color:var(--stub)">
      This branch is not yet complete.
    </p></div>`;
  }

  html += `</div>`;
  readerMain.innerHTML = html;

  // Attach choice button listeners
  for (const btn of readerMain.querySelectorAll('.choice-btn')) {
    btn.addEventListener('click', () => navigateTo(parseInt(btn.dataset.target, 10)));
  }

  // Ending screen buttons
  const btnEndRestart = readerMain.querySelector('#btn-end-restart');
  const btnEndAuthor  = readerMain.querySelector('#btn-end-author');
  if (btnEndRestart) btnEndRestart.addEventListener('click', restart);
  if (btnEndAuthor)  btnEndAuthor.addEventListener('click', () => { window.location.href = 'author.html'; });
}

function buildEndingHtml(pageNum) {
  const pathStr = history.map(n => `Page ${n}`).join(' → ');
  const decisionCount = history.length - 1;
  return `
    <div class="ending">
      <h2 class="ending__title">The End</h2>
      <p class="ending__path">
        You ended on <strong>page ${pageNum}</strong> after
        <strong>${decisionCount}</strong> choice${decisionCount !== 1 ? 's' : ''}.<br>
        <em>${pathStr}</em>
      </p>
      <div class="ending__actions">
        <button class="btn" id="btn-end-restart">Start Over</button>
        <a class="btn btn--outline" id="btn-end-author" href="author.html">Explore the Graph</a>
      </div>
    </div>`;
}

// ── Breadcrumb ─────────────────────────────────────────────────────────────

function updateBreadcrumb() {
  if (history.length === 0) { breadcrumb.innerHTML = ''; return; }

  // Show last 6 pages max to avoid overflow
  const visible = history.length > 6 ? ['…', ...history.slice(-5)] : [...history];
  breadcrumb.innerHTML = visible
    .map((n, i) => {
      if (n === '…') return `<span>…</span>`;
      const isCurrent = i === visible.length - 1;
      return `<span class="${isCurrent ? 'current' : ''}">${n}</span>`;
    })
    .join(' <span aria-hidden="true">→</span> ');
}

// ── Utility ────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ───────────────────────────────────────────────────────────────────

init();
