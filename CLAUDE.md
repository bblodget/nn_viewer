# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SchematicViewer is a web-based tool for creating and visualizing low-level schematic diagrams of neural network components. It renders interactive diagrams defined in JSON netlist format using D3.js, supporting features like panning, zooming, and node-level inspection.

## Architecture

- **Input Format**: JSON netlist containing nodes (components) and connections (edges)
- **Rendering**: D3.js for SVG-based visualization
- **Core Components**:
  - `index.html`: Main viewer interface
  - `viewer.js`: Core rendering logic
  - `diagram.json`: Sample neural network schematic definition

## Node Types

- `input`: Input signals (x0, w0, bias)
- `output`: Final output values (y)
- `add`: Addition blocks
- `mul`: Multiplication blocks
- `relu2`: Square of ReLU activation
- `clamp`: Range limiters
- `quantized_linear`: Grouped macro for common neural net patterns (future)

## Development Workflow

As this is a frontend web application, development primarily involves:

1. Editing the D3.js visualization code
2. Modifying the JSON schema for netlists
3. Testing in a web browser

To test changes:
- Open `index.html` in a browser
- Use browser developer tools to debug

## Project Goals

- Create clean, schematic-style visualizations of neural network internals
- Support zooming, panning, and interactive exploration
- Allow future expansion to group nodes into subcircuits