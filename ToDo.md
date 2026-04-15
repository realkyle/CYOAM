# ToDo

Items for AI to complete, in priority order.

---

## Phase 1 — Data Layer

- [ ] **1.1** Write `js/graph.js`
  - Fetch and parse `output/cot-story-graph.mmd` into a JS adjacency map: `{ pageNum: [targetNums] }`
  - Fetch each `output/cot-pages-ocr-v2/NN-CoT.txt` and store page text
  - Extract choice labels from page text using regex on "turn to page N" / "If you ... turn to page N" patterns
  - Expose: `loadGraph()` → returns the full graph data object
  - Identify terminal nodes (no outgoing edges), unreachable nodes, stub nodes

## Phase 2 — Reader UI

- [ ] **2.1** Create `reader.html` + `css/reader.css`
  - Book-style layout: centered column, serif font, max-width ~650px
  - Sections: page-number header, story-text body, choices footer, breadcrumb bar, back button

- [ ] **2.2** Write `js/reader.js`
  - On load: call `loadGraph()`, navigate to page 2
  - `renderPage(pageNum)`: display text, render choice buttons from extracted labels
  - History stack: push each visited page; "Go Back" pops the stack
  - Detect terminal page: show "THE END" screen with full path summary
  - "Start Over" button resets to page 2

## Phase 3 — Author / Graph UI

- [ ] **3.1** Create `author.html` + `css/author.css`
  - Two-panel layout: graph canvas (left ~60%), page detail panel (right ~40%)
  - Header with stats: total pages, total endings, incomplete branches

- [ ] **3.2** Write `js/author.js`
  - Render story graph using d3.js (hierarchical top-down layout)
  - Color nodes: blue (main trunk), green (terminal endings), yellow (stubs/incomplete), gray (unreachable)
  - Click a node → load and display that page's text in the right panel
  - Highlight clicked node and all its descendants
  - Show incoming/outgoing page numbers in the detail panel

## Phase 4 — Landing Page

- [ ] **4.1** Create `index.html` + `css/style.css`
  - Brief description of the project
  - Two large buttons: "Read the Story" → `reader.html`, "Author View" → `author.html`
  - Link to GitHub repo

## Phase 5 — Deployment

- [ ] **5.1** Verify all asset paths work when served from GitHub Pages root
  - All `fetch()` calls use relative paths
  - Test with a local HTTP server (`python3 -m http.server`) before pushing

- [ ] **5.2** Enable GitHub Pages on the repo (Settings → Pages → main branch, root)

- [ ] **5.3** Update `README.md` with:
  - Live site URL
  - GitHub repo URL

## Phase 6 — Polish (after core is working)

- [ ] **6.1** Add localStorage-based ending tracker in reader (show which endings found)
- [ ] **6.2** Add page-transition fade animation in reader
- [ ] **6.3** Add graph zoom/pan in author view
- [ ] **6.4** Update `Codebase.md` to document the new web app architecture

---

## Notes for AI

- Read `Codebase.md` before starting work — it explains the data files and scripts
- Read `Brainstorm.md` for the design rationale behind decisions
- The canonical story page files are in `output/cot-pages-ocr-v2/` — do not modify them
- The canonical graph is `output/cot-story-graph.mmd` — do not modify it
- All new web files go in the project root or `js/` / `css/` subdirectories
- Use relative paths for all asset fetches (GitHub Pages compatibility)
- Do not add a backend; keep everything static
