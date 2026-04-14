# The Cave of Time — Choose Your Own Adventure

A web-based reader and author tool for the classic CYOA story *The Cave of Time* by Edward Packard.

## Links

- **Deployed site:** https://realkyle.github.io/CYOAM/index.html
- **GitHub repository:** https://github.com/realkyle/CYOAM

## Features

### Reader
Navigate the story interactively — make choices, track your path, and discover one of 42 possible endings.

### Author View
Explore the full branching story graph powered by d3.js. Click any node to read that page and see how all 111 pages connect.

## Project Structure

```
index.html                  Landing page
reader.html                 Interactive story reader
author.html                 Story graph author view
js/
  graph.js                  Parses story graph and page text at runtime
  reader.js                 Reader UI logic
  author.js                 Author graph rendering (d3.js)
css/
  style.css                 Shared base styles
  reader.css                Reader styles
  author.css                Author view styles
output/
  cot-pages-ocr-v2/         Extracted story page text files (111 pages)
  cot-story-graph.mmd       Mermaid graph of all story branches
  cot-story-graph.svg       Pre-rendered SVG of the story graph
  cot-stories/              All 45 possible bounded story paths
scripts/
  reextract_cot_ocr_split.py   OCR extraction from PDF
  build_story_graph.py         Builds the Mermaid story graph
  write_all_stories.py         Generates all bounded story paths
  render_story_graph_svg.py    Renders the graph to SVG
samples/
  the-cave-of-time.pdf      Source PDF (two-page spread scan)
```

## Running Locally

Serve the project root with any static HTTP server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.
