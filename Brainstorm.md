# Brainstorm

## Project Goal

Build a web-based tool for "The Cave of Time" CYOA story that serves two audiences:
1. **Authors** — people who create or extend the branching story
2. **Readers** — people who want to read/play through the story interactively

---

## Reader Interface Ideas

### Core Reader (must-have)
- Display current page text, then show clickable choice buttons at the bottom
- Extract "If you do X turn to page N" lines from page text to use as choice labels
- Track visit history, allow a "Go Back" button
- Show a breadcrumb trail of pages visited so far (e.g., 2 → 3 → 5 → 16)
- Clean, book-like typography — centered column, readable font
- "You've reached an ending" screen with summary of path taken

### Reader Enhancements (nice-to-have)
- Progress indicator ("8 choices made")
- Replay: start over from page 2 with one click
- Show how many total endings exist and which ones the reader has reached (localStorage achievement tracker)
- Animate page transitions (fade in/out)
- Show a mini-graph of the path taken

---

## Author Interface Ideas

### Core Authoring Tool (must-have)
- Interactive story graph visualization (clickable nodes)
- Click any node → see that page's full text in a side panel
- Color coding:
  - Blue: main trunk from page 2
  - Green: terminal endings
  - Yellow: stub nodes (no outgoing edges, not an ending — incomplete)
  - Gray: unreachable nodes
- Show count of endings, total pages, incomplete branches

### Author Enhancements (nice-to-have)
- Edit a page's text in-browser; download as updated `.txt` file
- Add a new page: fill in text + choices, download generated file
- Filter/zoom the graph by subtree — click a node to highlight all descendants
- Export graph as updated `.mmd` file
- Side-by-side comparison of two story paths that share a start

---

## Tech Stack Decision

**Chosen: Pure static site — HTML + Vanilla JS + CSS**

Reasoning:
- No build step; deploys directly to GitHub Pages
- Parse `cot-story-graph.mmd` at runtime via `fetch()`
- Load `.txt` page files via `fetch()` as static assets
- Draw graph using `d3.js` (force-directed or hierarchical) for interactivity
- No server needed; author "saves" by downloading files

Rejected alternatives:
- React/Vite: adds build complexity without meaningful gain at this scale
- Flask/Node backend: overkill; makes deployment harder

---

## Runtime Data Model

Parse `cot-story-graph.mmd` + fetch each page `.txt` to build:

```json
{
  "2": {
    "text": "You've hiked through Snake Canyon...",
    "rawChoices": ["If you decide to start back home turn to page 4", "If you decide to wait turn to page 5"],
    "edges": [4, 5],
    "isTerminal": false
  },
  ...
}
```

Choice labels come from lines matching `/turn to page (\d+)/i` in the page text.

---

## Proposed File/Folder Layout

```
index.html           ← landing page with Reader / Author mode buttons
reader.html          ← reader UI
author.html          ← author/graph UI
js/
  graph.js           ← parse .mmd → adjacency map; fetch page texts
  reader.js          ← reader page logic
  author.js          ← author graph draw + node-click panel
css/
  style.css          ← shared base styles
  reader.css
  author.css
output/              ← existing data (unchanged)
  cot-pages-ocr-v2/
  cot-story-graph.mmd
  cot-story-graph.svg
  cot-stories/
```

---

## Deployment Plan

- Enable GitHub Pages on the `main` branch (root or `/docs` folder)
- All `output/` files served as static assets — no server needed
- `README.md` updated with live URL once deployed

---

## Open Questions

1. Should choice buttons show the full "If you do X..." label or just "Turn to page N"? (Full label is more immersive)
2. Use the pre-rendered `cot-story-graph.svg` in the author view (fast) or re-render interactively with d3 (better UX)?
3. LocalStorage for reader progress/achievements — yes or no?
4. Single HTML file or separate reader.html / author.html?
