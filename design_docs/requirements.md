# SchematicViewer: Interactive Neural Network Node Diagram Tool

## Reference Diagram

Here is a hand-drawn example that this project aims to replicate:

![Hand-drawn schematic](images/hand_drawn_nn.png)

## Overview

**SchematicViewer** is a web-based tool for creating and visualizing **low-level schematic diagrams** of neural network components (e.g., quantized linear layers, ReLU² activations, clamps, etc.). It allows users to define diagrams using a **JSON netlist format** and view them interactively in the browser with support for **panning, zooming, and node-level inspection**.

The tool is inspired by hand-drawn schematics and is intended to show what's happening **inside a neural network node**, including individual operations like multiplication, addition, and nonlinear activations.

---

## Goals

- ✅ Create clean, schematic-style visualizations of neural network internals
- ✅ Define circuits using a **JSON netlist**
- ✅ View the schematic in any modern **web browser**
- ✅ Support **zooming and panning** for exploring complex diagrams
- ✅ Allow future expansion to group nodes into subcircuits or macros

---

## Requirements

### Input Format

- Input will be provided as a **JSON file** containing:
  - A list of `nodes` (components like `mul`, `add`, `ReLU²`, etc.)
  - A list of `connections` (edges between nodes)

### Node Types

Supported component types include:
- `input`: an input signal (e.g., `x0`, `w0`, `bias`)
- `output`: a final output value (e.g., `y`)
- `add`: addition block with two inputs
- `mul`: multiplication block with two inputs
- `relu2`: square of ReLU activation
- `clamp`: range limiter
- `quantized_linear`: a grouped macro for a common neural net pattern (optional future)

### Web-Based Viewer

- Implemented using **D3.js**
- Render nodes as SVG blocks
- Draw connections as lines with arrows
- Enable **zoom and pan** using `d3.zoom()`
- Optional: Highlight active path or evaluate data flow

---

## Non-Goals

- Not focused on simulating computation or executing models
- Not intended to replace full circuit editors like KiCAD or Verilog IDEs

---

## Future Enhancements

- Group nodes into collapsible macros (e.g., `quantized_linear`)
- Tooltip or click-to-inspect node metadata
- Color-code node types for readability
- Export diagrams as SVG or PNG
- Optional animation for signal flow

---

## Deliverables

- `index.html` — the D3-based viewer
- `diagram.json` — sample schematic of a simple neural node
- `viewer.js` — renderer script
- Optional: CSS styling for clean schematic look

---

## License

This tool will be open-source under the MIT License unless otherwise decided.

## JSON Syntax Requirements (2025-05-13 Update)

- All vector inputs must be arrays of the correct length (e.g., "input": ["x0.out", "x1.out"] for a size-2 input)
- All scalar inputs must be strings (e.g., "bias": "bias.out")
- All connections must be in the format "elementId.portName"
- Module definitions must specify input sizes and types clearly
- Module instances must match the expected input types (array for vectors, string for scalars)


