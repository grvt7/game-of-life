# Conway's Game of Life

A modern, interactive implementation of Conway's Game of Life with a sleek dark UI, pattern library, and RLE import/export support.

## Quick Start

Open `index.html` in any modern browser. No build step required.

## Project Structure

### HTML & CSS

- **index.html** — Single-page layout with canvas, sidebars for controls/patterns, modals for help/settings, and the population graph overlay
- **style.css** — Dark theme using CSS custom properties (`--bg`, `--accent`, etc.) with sections for layout, controls, modals, and theme variants

### JavaScript (script.js)

The code is organized into logical sections for easy navigation:

| Section                        | What It Does                                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#canvas and contexts**       | DOM references for the main canvas and population graph                                                                                                               |
| **#patterns data**             | Built-in pattern library (still lifes, oscillators, spaceships, guns, methuselahs) stored as RLE strings                                                              |
| **#state**                     | All application state: cells (Set), running flag, zoom/pan coords, draw mode, toggles                                                                                 |
| **#RLE parser and encoder**    | `parseRLE()` converts RLE strings to cell Sets; `encodeRLE()` exports current grid to RLE format                                                                      |
| **#utility functions**         | Helper functions: `key()`/`unkey()` for cell coordinates, `screenToCell()`/`cellToScreen()` for coordinate conversion, `resizeCanvas()`                               |
| **#view control**              | `centerView()` and `fitToContent()` for camera positioning and zoom-to-fit                                                                                            |
| **#rendering**                 | `render()` draws grid lines and cells; `drawGraph()` renders population history                                                                                       |
| **#game logic**                | `step()` computes next generation (Conway's rules), `play()`/`pause()`/`togglePlay()` for simulation control                                                          |
| **#event handlers — canvas**   | Mouse drawing/panning, wheel zoom, touch pinch-to-zoom                                                                                                                |
| **#pattern loading**           | `loadPattern()` centers and places patterns; `loadRLEPattern()` wrapper with error handling; `randomize()` for random fill; `clearGrid()` for reset                   |
| **#event handlers — buttons**  | All UI button handlers: play/pause/step/clear, sliders (FPS, zoom, density), draw mode toggle, theme switching, modal open/close, settings toggles, RLE import/export |
| **#UI builders**               | `buildPatternUI()` dynamically generates the pattern list with search/filter support                                                                                  |
| **#event handlers — keyboard** | Keyboard shortcuts: Space (play/pause), S (step), R (clear), F (fit), D/E/P (draw/erase/pan modes), G (grid toggle), +/- (zoom), Esc (close modals)                   |
| **#notification**              | `showToast()` for temporary on-screen messages                                                                                                                        |
| **#initialization**            | Sets up canvas, loads initial glider pattern, attaches window resize listener                                                                                         |

## Key Features

- **Sparse cell storage** — Uses a Set of `"row,col"` strings instead of a full grid array for infinite-like behavior
- **RLE support** — Import and export patterns in Run Length Encoded format (compatible with LifeWiki and other tools)
- **Pan & Zoom** — Drag to pan, scroll or pinch to zoom, fit-to-content button
- **Visual effects** — Optional grid lines, cell trails, born-cell highlighting, population graph
- **Themes** — Classic, Neon, Lava, Ice, Mono, Matrix
- **Pattern library** — 20+ built-in patterns organized by category

## Keyboard Shortcuts

| Key       | Action                  |
| --------- | ----------------------- |
| Space     | Play / Pause            |
| S         | Step one generation     |
| R         | Clear grid              |
| F         | Fit to screen           |
| D / E / P | Draw / Erase / Pan mode |
| G         | Toggle grid lines       |
| +/-       | Zoom in / out           |
| Esc       | Close modals            |

## RLE Format

The app supports standard RLE format used by LifeWiki:

```
x=3,y=3
bob$2ob$3o!
```

- `b` = dead cell, `o` = alive cell
- Numbers = run length (e.g., `2o` = two alive cells)
- `$` = new row
- `!` = end of pattern
