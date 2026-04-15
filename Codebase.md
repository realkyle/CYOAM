# Codebase Notes

## Purpose

This workspace extracts text from the scanned PDF of The Cave of Time, builds a story graph from the extracted pages, writes all possible bounded story paths, and renders the graph as SVG.

## Canonical Source Of Truth

The canonical extracted page set is:
- output/cot-pages-ocr-v2

Do not use the older cot-pages extraction workflow. It had bad OCR and was removed.

## Important PDF Mapping

The scan is a two-page spread layout.

Story start mapping:
- PDF page 8 contains story page 2 on the left and story page 3 on the right
- PDF page 9 contains story page 4 on the left and story page 5 on the right

The story begins on story page 2 with:
- "You've hiked through Snake Canyon once before ..."

Do not confuse story page numbers with PDF page numbers.

## Current Scripts

Canonical scripts in scripts/:
- reextract_cot_ocr_split.py
- build_story_graph.py
- write_all_stories.py
- render_story_graph_svg.py

Superseded scripts were deleted:
- extract_cot.py
- reextract_cot_spreads.py

## What Each Script Does

### reextract_cot_ocr_split.py

Re-extracts story pages from the PDF using OCR on left/right halves of each PDF spread page.

Typical command:

```bash
python3 scripts/reextract_cot_ocr_split.py \
  --pdf samples/the-cave-of-time.pdf \
  --pdf-start-page 8 \
  --pdf-end-page 66 \
  --story-start-page 2 \
  --output-dir output/cot-pages-ocr-v2
```

### build_story_graph.py

Builds Mermaid graph output from the corrected OCR page files.

Typical command:

```bash
python3 scripts/build_story_graph.py \
  --pages-dir output/cot-pages-ocr-v2 \
  --output output/cot-story-graph.mmd
```

Notes:
- Reads explicit "turn to page X" choices from page text.
- Adds sequential continuation edges for pages that continue onto the next numbered page before any explicit choice appears.

### write_all_stories.py

Writes all possible bounded stories from the graph.

Typical command:

```bash
python3 scripts/write_all_stories.py \
  --graph output/cot-story-graph.mmd \
  --pages-dir output/cot-pages-ocr-v2 \
  --start-page 2 \
  --max-decisions 20 \
  --output-dir output/cot-stories
```

Important behavior:
- Starts from story page 2
- Stops on cycles
- Stops if decision points exceed 20
- Clears old story-*.txt files in the target output directory before writing new ones

### render_story_graph_svg.py

Renders the Mermaid graph to SVG without external layout tools.

Typical command:

```bash
python3 scripts/render_story_graph_svg.py \
  --graph output/cot-story-graph.mmd \
  --output output/cot-story-graph.svg
```

Current visual behavior:
- Uses a layered Sugiyama-style layout with iterative barycenter ordering
- Colors terminal pages differently
- Highlights the main trunk from page 2

## Current Canonical Outputs

Keep these:
- output/cot-pages-ocr-v2
- output/cot-story-graph.mmd
- output/cot-story-graph.svg
- output/cot-stories

These older directories were deleted because they were exploratory or obsolete:
- output/cot-pages
- output/cot-pages-reextract
- output/cot-stories-from-page-02
- output/cot-stories-start10
- output/tmp

## Current Known State

At the end of this session:
- The corrected OCR v2 extraction produced story pages in output/cot-pages-ocr-v2
- The graph was rebuilt from OCR v2 pages and saved to output/cot-story-graph.mmd
- The bounded story writer generated 45 stories into output/cot-stories
- The graph SVG was rendered to output/cot-story-graph.svg

## Caveats

OCR is improved but not perfect.
- Some pages still have minor OCR noise
- Page continuations across spreads are important; graph construction relies on sequential edges when no explicit choice appears
- Story page numbers, not PDF page numbers, control graph edges and story traversal

## Next-Time Guidance

When resuming work:
1. Read this file first.
2. Treat output/cot-pages-ocr-v2 as the current source text.
3. If extraction quality needs improvement, update reextract_cot_ocr_split.py rather than rebuilding older workflows.
4. If graph or story outputs need regeneration, rerun build_story_graph.py, write_all_stories.py, and render_story_graph_svg.py in that order.

---

## Web App Architecture

A static web application was added on top of the existing pipeline outputs. It requires no build step and deploys directly to GitHub Pages. There is no server — all data is fetched at runtime as static files.

### Deployment

- **Live site:** https://realkyle.github.io/CYOAM/index.html
- **Repository:** https://github.com/realkyle/CYOAM
- Serve locally with `python3 -m http.server 8000` from the project root.

### File Layout

```
index.html          Landing page — links to Reader and Author modes
reader.html         Interactive story reader
author.html         Story graph author/explorer view
js/
  graph.js          Shared data layer (parses .mmd + fetches page texts)
  reader.js         Reader page logic
  author.js         Author graph rendering via d3.js
css/
  style.css         Shared base styles and CSS variables
  reader.css        Reader-specific styles
  author.css        Author view styles
output/             Existing pipeline outputs, served as static assets
  cot-pages-ocr-v2/
  cot-story-graph.mmd
  cot-story-graph.svg
  cot-stories/
```

### Runtime Data Flow

`graph.js` is the single shared data layer used by both `reader.js` and `author.js`. On load it:

1. Fetches `output/cot-story-graph.mmd` and parses it into a node/edge list.
2. Fetches all page text files from `output/cot-pages-ocr-v2/` in parallel (filenames like `02-CoT.txt`, `10-CoT.txt`).
3. Builds adjacency and reverse-adjacency maps.
4. Classifies every node: terminal, ending ("The End" in text), unreachable from page 2, or stub (reachable but missing text).
5. Computes the main trunk (longest unbranched prefix from page 2).
6. Extracts per-page choices via regex matching `turn to page N` patterns, including the OCR artefact `tum to page N`.

The result is cached in module scope; subsequent calls to `loadGraph()` return the cached object immediately.

The runtime `GraphData` object has this shape:

```js
{
  pages:       { [num]: { num, text, choices, isTerminal, isEnding, isUnreachable, isStub } },
  adjacency:   { [num]: number[] },   // outgoing edges
  reverseAdj:  { [num]: number[] },   // incoming edges
  startPage:   2,
  terminals:   number[],
  endings:     number[],
  unreachable: number[],
  stubs:       number[],
  mainTrunk:   number[],
  allNodes:    number[],
}
```

### Reader (`reader.html` + `reader.js`)

- Starts at story page 2.
- Displays page text with choice buttons extracted from both the graph adjacency map (authoritative for targets) and the page text (used for human-readable labels).
- Maintains a history stack; a Back button pops the stack and re-renders.
- Detects terminal/ending pages and shows a summary screen with path taken, decision count, and options to restart or go to the Author view.
- A sticky breadcrumb bar shows the last 6 pages of the current path.
- Page transitions use a CSS fade-in animation.

### Author View (`author.html` + `author.js`)

- Renders the full story graph interactively using **d3 v7** (loaded from CDN).
- Uses a d3 force-directed layout with link distance, charge, collision, and weak centering forces.
- Node colour coding (defined as CSS variables in `style.css`):
  - `--trunk` (blue) — pages on the main trunk from page 2
  - `--terminal` (green) — pages containing "The End"
  - `--stub` (amber) — reachable pages with missing text
  - `--unreachable` (gray) — not reachable from page 2
  - Steel blue — all other story pages
- Clicking a node: highlights all descendants, fades everything else, and loads that page's text + metadata (incoming/outgoing edges, badges) in a right-hand detail panel.
- Clicking the background clears the selection.
- Nodes are draggable; the simulation cools and then auto-fits to the viewport.
- Zoom in/out/fit buttons are provided; the graph also supports mouse-wheel zoom and pan.
- A top stats bar shows live counts of total pages, endings, incomplete stubs, and unreachable nodes.
- Trunk links are drawn with a distinct blue stroke and a separate arrowhead marker; selected links use orange.

### CSS Design Tokens (`style.css`)

All colours and typography are defined as CSS custom properties on `:root` so they are consistently shared across all three pages:

```css
--bg, --surface, --border   /* parchment/cream palette */
--text, --muted, --accent   /* deep rust accent */
--trunk, --terminal, --stub, --unreachable  /* graph node colours */
--radius, --shadow          /* shared geometry */
--font-serif, --font-sans
```

### Known Limitations / Next Steps

- The force-directed layout is non-deterministic; the Sugiyama-style SVG produced by `render_story_graph_svg.py` gives a more stable, hierarchical view but is not interactive.
- OCR noise in some page texts may cause `extractChoices()` to miss choices; if a page appears as an unexpected stub in the author view, check its `.txt` file in `output/cot-pages-ocr-v2/`.
- There is no in-browser page editing yet (identified in Brainstorm.md as a nice-to-have). Editing the story requires updating `.txt` files in `output/cot-pages-ocr-v2/` and re-running `build_story_graph.py`.
- LocalStorage achievements/progress tracking is not yet implemented.