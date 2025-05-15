# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NNCircuit is a web-based tool for creating and visualizing low-level schematic diagrams of neural network components. It renders interactive diagrams defined in a hierarchical JSON format using D3.js, supporting features like panning, zooming, module navigation, and node-level inspection.

For detailed information, see the design documents:
- [Requirements Document](design_docs/requirements.md)
- [Diagram Format V2](design_docs/diagram_format_v2.md)
- [Status Updates](design_docs/status/)

## Architecture

- **Input Format**: Hierarchical JSON with modules, primitives, and parameters
- **Rendering**: D3.js for SVG-based visualization
- **Core Components**:
  - `index.html`: Main viewer interface
  - `viewer.js`: Core rendering logic
  - `json/*.json`: Sample neural network schematic definitions

## Module System

- **Hierarchical Organization**: Modules can contain other modules and primitives
- **Parameter Support**: Modules and components can be parameterized
- **Clock Cycle Grid**: Components are positioned based on clock cycle timing
- **Component Loops**: Generate repetitive structures efficiently
- **Port Groups**: Organize related ports with custom arrangements

## Primitive Types

- `add`: Addition operation with two inputs
- `mul`: Multiplication operation with two inputs
- `relu2`: Square of ReLU activation
- `clamp`: Range limiter
- `reg`: Register (for delay/pipeline stages)

## Development Workflow

As this is a frontend web application, development primarily involves:

1. Editing the D3.js visualization code
2. Implementing the v2 format specification
3. Testing in a web browser

To test changes:
- Open `index.html` in a browser
- Use browser developer tools to debug
- Load sample JSON files from the `/json` directory

## Layout System

- Components are positioned on a grid-based layout
- Horizontal position (x-axis) is determined by clock cycle
- Vertical position (y-axis) is determined by signal flow and organization
- Module width is determined by its overall latency (clock cycle count)
- Components within a module are aligned to appropriate clock cycle columns

## Project Goals

- Create clean, schematic-style visualizations of neural network internals
- Support zooming, panning, and module navigation for exploring complex diagrams
- Allow parameterization of components and modules for flexibility
- Support component loops for generating repetitive structures
- Enable port grouping and arrangement for better organization
- Visualize clock cycle timing with a grid-based layout system