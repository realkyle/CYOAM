/**
 * graph.js — Data layer for the CYOA web app
 *
 * Loads and parses output/cot-story-graph.mmd and all page text files,
 * then builds a complete graph data object used by both the reader and
 * the author view.
 *
 * Exported API:
 *   loadGraph() → Promise<GraphData>
 *
 * GraphData shape:
 * {
 *   pages: { [num]: PageData },
 *   adjacency: { [num]: number[] },   // outgoing edges
 *   reverseAdj: { [num]: number[] },  // incoming edges
 *   startPage: 2,
 *   terminals: number[],   // nodes with no outgoing edges
 *   endings: number[],     // nodes whose text contains "The End"
 *   unreachable: number[], // not reachable from startPage
 *   stubs: number[],       // outgoing edge targets with no page text
 *   mainTrunk: number[],   // pages from start to first branch point
 * }
 *
 * PageData shape:
 * {
 *   num: number,
 *   text: string,          // raw page text (may be empty if file missing)
 *   choices: Choice[],     // extracted from page text
 *   isTerminal: boolean,
 *   isEnding: boolean,
 *   isUnreachable: boolean,
 *   isStub: boolean,
 * }
 *
 * Choice shape:
 * {
 *   label: string,   // full "If you … turn to page N" sentence
 *   target: number,
 * }
 */

const GRAPH_PATH = './output/cot-story-graph.mmd';
const PAGES_DIR  = './output/cot-pages-ocr-v2/';
const START_PAGE = 2;

// ---------------------------------------------------------------------------
// Mermaid parser
// ---------------------------------------------------------------------------

function parseMmd(text) {
  const nodes = new Set();
  const edges = []; // { from, to }

  for (const raw of text.split('\n')) {
    const line = raw.trim();

    // Node declaration: P2["2"]
    const nodeMatch = line.match(/^(P\d+)\["\d+"\]$/);
    if (nodeMatch) {
      const num = parseInt(nodeMatch[1].slice(1), 10);
      nodes.add(num);
      continue;
    }

    // Edge: P2 --> P3
    const edgeMatch = line.match(/^P(\d+)\s*-->\s*P(\d+)$/);
    if (edgeMatch) {
      const from = parseInt(edgeMatch[1], 10);
      const to   = parseInt(edgeMatch[2], 10);
      nodes.add(from);
      nodes.add(to);
      edges.push({ from, to });
    }
  }

  return { nodes: [...nodes].sort((a, b) => a - b), edges };
}

// ---------------------------------------------------------------------------
// Page text filename helper
// ---------------------------------------------------------------------------

function pageFilename(num) {
  // Files are named "02-CoT.txt", "10-CoT.txt", "100-CoT.txt"
  // Zero-pad to at least 2 digits.
  const padded = String(num).padStart(2, '0');
  return `${padded}-CoT.txt`;
}

// ---------------------------------------------------------------------------
// Choice extractor
// ---------------------------------------------------------------------------

// Matches patterns like:
//   "If you decide to start back home, turn to page 4."
//   "If you seek shelter, turn to page 6."
//   "tum to page 5"   (OCR typo where "rn" → "m")
//   "Turn to page 32" (bare, no "If you" prefix)
// Handles both "turn" and OCR artifact "tum" via tu(?:rn|m).
const CHOICE_RE = /([^.!?]*?tu(?:rn|m)\s+to\s+page\s+(\d+)[^.!?\n]*[.!?]?)/gi;

function extractChoices(text) {
  const choices = [];
  const seen = new Set();

  // Normalise OCR line-breaks: join hyphenated line splits
  const normalised = text
    .replace(/-\n(\w)/g, '$1')  // join hyphenated words
    .replace(/\n/g, ' ');       // flatten to single line for regex

  let m;
  CHOICE_RE.lastIndex = 0;
  while ((m = CHOICE_RE.exec(normalised)) !== null) {
    const label  = m[1].trim().replace(/\s+/g, ' ');
    const target = parseInt(m[2], 10);
    if (!seen.has(target)) {
      seen.add(target);
      choices.push({ label, target });
    }
  }

  return choices;
}

// ---------------------------------------------------------------------------
// Reachability BFS
// ---------------------------------------------------------------------------

function reachableFrom(start, adjacency) {
  const visited = new Set();
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const next of (adjacency[cur] || [])) {
      if (!visited.has(next)) queue.push(next);
    }
  }
  return visited;
}

// ---------------------------------------------------------------------------
// Main trunk: longest prefix of the path from start before the first branch
// ---------------------------------------------------------------------------

function computeMainTrunk(start, adjacency) {
  const trunk = [start];
  let cur = start;
  while (true) {
    const nexts = adjacency[cur] || [];
    if (nexts.length !== 1) break; // branch or dead-end
    cur = nexts[0];
    if (trunk.includes(cur)) break; // cycle guard
    trunk.push(cur);
  }
  return trunk;
}

// ---------------------------------------------------------------------------
// Page text fetcher
// ---------------------------------------------------------------------------

async function fetchPageTexts(pageNums) {
  const results = {};
  await Promise.all(
    pageNums.map(async (num) => {
      const url = PAGES_DIR + pageFilename(num);
      try {
        const resp = await fetch(url);
        results[num] = resp.ok ? await resp.text() : '';
      } catch {
        results[num] = '';
      }
    })
  );
  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let _cache = null;

export async function loadGraph() {
  if (_cache) return _cache;

  // 1. Parse graph structure
  const mmdText = await fetch(GRAPH_PATH).then(r => r.text());
  const { nodes, edges } = parseMmd(mmdText);

  // 2. Build adjacency maps
  const adjacency   = {}; // num → [num, ...]
  const reverseAdj  = {}; // num → [num, ...]
  for (const n of nodes) { adjacency[n] = []; reverseAdj[n] = []; }
  for (const { from, to } of edges) {
    adjacency[from].push(to);
    if (!reverseAdj[to]) reverseAdj[to] = [];
    reverseAdj[to].push(from);
  }

  // 3. Fetch all page texts
  const texts = await fetchPageTexts(nodes);

  // 4. Classify nodes
  const reachable  = reachableFrom(START_PAGE, adjacency);
  const mainTrunk  = computeMainTrunk(START_PAGE, adjacency);
  const terminals  = nodes.filter(n => adjacency[n].length === 0);
  const endings    = nodes.filter(n => /the\s+end/i.test(texts[n] || ''));
  const unreachable = nodes.filter(n => !reachable.has(n));
  // Stubs: pages referenced in edges but whose text file is empty/missing
  const stubs = nodes.filter(n => (texts[n] || '').trim() === '' && reachable.has(n));

  // 5. Build page objects
  const pages = {};
  for (const num of nodes) {
    const text    = texts[num] || '';
    const choices = extractChoices(text);
    pages[num] = {
      num,
      text,
      choices,
      isTerminal:   adjacency[num].length === 0,
      isEnding:     /the\s+end/i.test(text),
      isUnreachable: !reachable.has(num),
      isStub:       text.trim() === '' && reachable.has(num),
    };
  }

  _cache = {
    pages,
    adjacency,
    reverseAdj,
    startPage: START_PAGE,
    terminals,
    endings,
    unreachable,
    stubs,
    mainTrunk,
    allNodes: nodes,
  };

  return _cache;
}
