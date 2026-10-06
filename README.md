# Design Buddy

A lightweight, zero-dependency visual diagramming and whiteboarding canvas built with vanilla modern JavaScript and HTML5 Canvas. Design Buddy pairs an expressive, hand-drawn design aesthetic with intelligent graph layout algorithms and magnetic arrow docking.

---

## 1. Product Overview

Design Buddy is engineered for friction-free thinking, architecture modeling, and visual brainstorming:
- **Expressive Canvas Primitives:** Sticky notes, text nodes, shapes (rectangles, rounded cards, ellipses, databases/cylinders), and freehand pen paths.
- **Magnetic Smart Arrows:** Connectors that magnetically snap to shape borders, dynamically rotate around facing ports as boxes move, and support orthogonal elbow routing.
- **One-Click Beautify:** A layered graph layout engine (Sugiyama-style) that organizes tangled boxes and arrows into clean hierarchical diagrams, unifies node dimensions, and eliminates overlaps.
- **Infinite Canvas & Local Persistence:** Camera with smooth panning and zooming, snapshot-driven undo/redo transactions, and auto-saving to local storage.

---

## 2. System Architecture

The codebase is organized into modular subsystems with unidirectional data flow and clean abstraction boundaries:

```
┌────────────────────────────────────────────────────────┐
│                   Input & UI Layer                     │
│  (ui/toolbar, ui/text-editor, ui/input, context-menu)  │
└───────────────────────────┬────────────────────────────┘
                            │ Dispatches pointer events
┌───────────────────────────▼────────────────────────────┐
│                    Tool & Gesture Engine               │
│  (tools/select, tools/arrow, tools/place, tools/pen)   │
└───────────────────────────┬────────────────────────────┘
                            │ Mutates shapes via transactions
┌───────────────────────────▼────────────────────────────┐
│                     State & History                    │
│   (state.js, history.js, storage.js, scene.js)         │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
┌─────────────▼───────────────┐ ┌──────────▼─────────────┐
│     Shape Trait System      │ │  Connector & Layout    │
│  (shapes/registry, box,     │ │  (bindings, layout,    │
│   arrow, pen, text, sticky) │ │   beautify)            │
└─────────────┬───────────────┘ └──────────┬─────────────┘
              │                            │
┌─────────────▼────────────────────────────▼─────────────┐
│                   Rendering Pipeline                   │
│        (renderer.js, render/paint, overlays.js)        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Core Abstractions & Logic

### Central State & History (`state.js`, `history.js`)
- **Single Source of Truth:** `state` maintains the list of `shapes`, current `selectedIds` set, the active `tool`, viewport `camera` `{ x, y, zoom }`, and the active `gesture`.
- **Atomic Transactions:** Any user operation that mutates state is wrapped in `history.transaction(() => { ... })`. Snapshot-based state diffing provides unlimited undo and redo without requiring manual invert-command logic.

### Shape Trait Registry (`shapes/registry.js`)
Instead of rigid class hierarchies, shapes are plain objects registered with functional traits:
- **Traits:** `box`, `resizable`, `editable`, `fillable`, `layout`.
- **Polymorphic Hooks:** Each shape definition exports pure geometric functions:
  - `draw(c, shape)`: Canvas 2D path rendering.
  - `bounds(shape)`: Axis-aligned bounding box.
  - `edgePoint(shape, toward)`: Exact perimeter intersection point facing a target vector.
  - `requiredHeight(shape, width)`: Text reflow and content measurement.

### Magnetic Snapping & Dynamic Docking (`bindings.js`, `shapes/arrow.js`)
Connectors adhere to intuitive design-tool mechanics:
- **Cardinal Port Midpoints:** Every box exposes 4 canonical border ports (`top`, `bottom`, `left`, `right`). Arrows meet borders with zero gap.
- **Dynamic Facing Sides (`bestFacingSides`):** Rather than locking an arrow to a static axis, connectors evaluate the normalized aspect-ratio vector between Box A and Box B:
  - Primary horizontal displacement docks to `right ↔ left`.
  - Primary vertical displacement docks to `bottom ↔ top`.
  - Moving Box A around Box B dynamically transitions docking ports in real-time without twisting or crossing shapes.
- **Hysteresis Magnet Engine:** As endpoints approach a box perimeter, `magnetTarget` captures the shape within a configurable radius (`MAGNET_RADIUS_PX * MAGNET_STRENGTH`). A multiplier (`MAGNET_HOLD = 1.5`) prevents flickering when dragging near threshold boundaries.
- **Single-End Anchoring:** Free arrows with one bound end dynamically orient their root port toward the floating tip, while dragging a box moves its associated dangling arrows synchronously.

### Beautify & Layered Graph Layout (`features/beautify.js`, `features/layout.js`)
When "Beautify" is invoked, the canvas runs a multi-phase structural optimization:
1. **Dangling Edge Resolution:** Connectors positioned near unattached nodes are attached within tolerance bounds.
2. **Cycle Elimination:** The graph extracts directed edges and breaks circular dependencies using depth-first search (`acyclicEdges`).
3. **Rank Assignment:** Longest-path topological ordering assigns nodes into discrete hierarchical layers.
4. **Crossing Minimization:** Adjacent layers undergo iterative median sweep heuristic passes to minimize intersecting connector lines.
5. **Coordinate Placement & Centering:** Layers are arranged along the primary flow axis (`LR` or `TB`), nodes are spaced with uniform gaps, and isolated shapes are clustered below the primary layout.
6. **In-Place Tidy Fallback:** If shapes share no directed edges, `tidyInPlace` applies row clustering, column alignment, dimension unification, and overlap resolution.

### Coordinate Space & Rendering Pipeline (`renderer.js`, `overlays.js`)
- **Dual-Space Matrix:** World coordinates represent absolute scene geometry; screen coordinates map to canvas pixels through `screenToWorld(p)` and `worldToScreen(p)` using camera zoom and translation offsets.
- **Layered Draw Pass:**
  1. Background grid with dynamic step scaling according to zoom level.
  2. Canvas shapes rendered in z-order (pen paths, boxes, text, arrows).
  3. Interactive overlays: selection bounds, resize handles, marquee bounding box, and magnetic docking badges.

---

## 4. Getting Started

No build step, bundler, or dependencies required.

```bash
# Clone the repository
git clone https://github.com/moulaali/design-buddy.git

# Navigate to directory
cd design-buddy

# Run with any static HTTP server (e.g., Python or Node)
python3 -m http.server 8000
# or: npx serve .
```

Open `http://localhost:8000` in any modern web browser.
