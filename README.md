# SchematicViewer

A web-based tool for creating and visualizing low-level schematic diagrams of neural network components. Co-developed with [Claude](https://claude.ai), an AI assistant by Anthropic.

## Overview

SchematicViewer renders interactive diagrams defined in JSON netlist format using D3.js, providing a clean, schematic-style visualization of neural network internals.

**Note:** This project is a work in progress. See the [Implementation Plan](design_docs/implementation_plan.md) for upcoming features and development status.

![SchematicViewer Screenshot](screenshots/shot017.png)

## Try it Online

You can try SchematicViewer online at: https://bblodget.github.io/nn_viewer/

For a quick demo:
1. Download one of the sample JSON files from the [/json](json/) directory:
   - [primitives_only.json](json/primitives_only.json) - Simple primitives diagram
   - [module_definition.json](json/module_definition.json) - Advanced module-based diagram
2. Drag and drop the file into the online viewer
3. Explore the neural network component visualization

## Features

- **Interactive Visualization**: Pan, zoom, and inspect individual components
- **Automatic Layout**: Positions are determined based on connections and dependencies
- **Clock Cycle Alignment**: Components are automatically arranged in temporal order
- **Multiple Component Types**: Support for common neural network primitives
- **Connection Highlighting**: Click on components to highlight data paths
- **Drag & Drop Interface**: Easily load diagram files via drag and drop
- **Hierarchical Modules**: Support for reusable module definitions with vector inputs
- **Expandable/Collapsible**: Modules can be expanded to view internal structure

## Usage

1. **Open the Application**: Open `index.html` in a web browser (or use the [online version](https://bblodget.github.io/nn_viewer/))
2. **Load a Diagram**: Either:
   - Click the "File Options" button and select a JSON file
   - Drag and drop a JSON file anywhere onto the diagram area
   - Use the included sample files in the [/json](json/) directory to get started
3. **Interact with the Diagram**:
   - Zoom: Mouse wheel or zoom buttons (+/-)
   - Pan: Click and drag on the background
   - Select: Click on components to highlight their connections
   - Reset View: Double-click or click the reset button (⟲)

## Diagram Format

SchematicViewer supports two primary JSON formats:

### Basic Format (Primitives Only)

A simplified JSON format that automatically positions components based on their connections:

```json
[
  {
    "id": "x0",
    "type": "input",
    "label": "x₀"
  },
  {
    "id": "mul1",
    "type": "mul",
    "inputs": {
      "in1": "x0.out",
      "in2": "w0.out"
    }
  },
  {
    "id": "output1",
    "type": "output",
    "label": "y",
    "inputs": {
      "in": "mul1.out"
    }
  }
]
```

The diagram is defined as an array of primitives, where:
- Components are positioned automatically based on their connections
- Input primitives are always in cycle 0
- Other primitives are positioned at (max input cycle + 1)
- Vertical ordering is determined intelligently based on connection patterns

### Advanced Format (With Module Definitions)

An extended format supporting hierarchical modules with reusable definitions:

```json
{
  "moduleDefinitions": {
    "quantized_linear": {
      "inputs": [
        {"name": "input", "size": 2},
        {"name": "weight", "size": 2},
        "bias"
      ],
      "outputs": ["out"],
      "components": [
        /* Internal components */
      ],
      "outputMappings": {
        "out": "clamp.out"
      }
    }
  },
  "elements": [
    /* Primitives and module instances */
    {
      "id": "linear1",
      "type": "module",
      "moduleType": "quantized_linear",
      "inputs": {
        "input": ["x0.out", "x1.out"],
        "weight": ["w0.out", "w1.out"],
        "bias": "bias.out"
      }
    }
  ]
}
```

For detailed format documentation, see:
- [Diagram Format](design_docs/diagram_format.md)
- [Hierarchical Structure](design_docs/hierarchical_structure.md)
- [Module Reuse](design_docs/module_reuse.md)

## Supported Component Types

### Primitives

| Type | Description | Input Ports | Output Ports |
|------|-------------|-------------|--------------|
| `input` | Input signal | None | `out` |
| `output` | Output value | `in` | None |
| `add` | Addition operation | `in1`, `in2` | `out` |
| `mul` | Multiplication operation | `in1`, `in2` | `out` |
| `relu2` | Square of ReLU activation | `in` | `out` |
| `clamp` | Range limiter | `in` | `out` |
| `reg` | Register for clock cycle delay | `in` | `out` |

### Modules

The SchematicViewer supports hierarchical modules - reusable components that encapsulate multiple primitives:

| Type | Description | Example |
|------|-------------|---------|
| `module` | Compound component with multiple internal primitives | `quantized_linear` |

Modules support:
- Vector inputs/outputs (arrays of connections)
- Expandable/collapsible views
- Reusable module definitions

For details on creating and using modules, see:
- [Hierarchical Structure](design_docs/hierarchical_structure.md)
- [Module Reuse](design_docs/module_reuse.md)


## Installation

No installation required! This is a pure HTML/JavaScript application that runs directly in the browser.

1. Clone the repository
2. Open `index.html` in a web browser
3. Start visualizing neural network diagrams!

## Implementation Details

- **Frontend**: HTML, CSS, JavaScript
- **Visualization**: D3.js for SVG-based rendering
- **Interaction**: Zoom, pan, selection capabilities
- **Layout**: Automatic positioning based on dataflow dependencies

## Development

SchematicViewer was co-developed with [Claude](https://claude.ai), utilizing Claude Code for AI pair programming. The development process involved collaborative coding, design discussions, and iterative refinement with Claude providing implementation suggestions and helping solve technical challenges.

To modify or extend the SchematicViewer:

1. Edit the HTML/CSS for layout and styling
2. Modify `viewer.js` for visualization logic
3. Test by opening `index.html` in a web browser
4. Use browser dev tools for debugging

See [Implementation Plan](design_docs/implementation_plan.md) for the planned development roadmap.

## Project Status

SchematicViewer is currently under active development. While the core functionality is working, there are several planned enhancements:

See the [Implementation Plan](design_docs/implementation_plan.md) for a detailed roadmap and development status.

## License

Copyright (C) 2025 Brandon Blodget

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details. The full text of the license is available in the [gpl-3.0.md](gpl-3.0.md) file.