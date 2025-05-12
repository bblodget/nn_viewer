# SchematicViewer Diagram Format (Draft)

This document explains the JSON netlist format used in the SchematicViewer tool to define neural network diagrams, with proposed enhancements for improved usability.

## Overview

The diagram is defined in a JSON file with these main sections:
- `primitives`: The basic components in the neural network (inputs, operations, outputs)
- `connections`: The edges that connect these components
- `compounds`: Reusable compound nodes composed of primitives (hierarchical)
- `layers`: Collections of compounds forming neural network layers (hierarchical)
- `networks`: Complete neural network architectures (hierarchical)

## Primitive Format

Each primitive represents a basic component in the neural network and has the following properties:

```json
{
  "id": "unique_identifier",
  "type": "component_type",
  "label": "display_text",
  "position": {
    "cycle": 1,
    "row": 2
  }
}
```

### Properties

| Property | Description | Required |
|----------|-------------|----------|
| `id` | Unique identifier for the primitive | Yes |
| `type` | The component type (see supported types below) | Yes |
| `label` | Text to display on the primitive (defaults to type if not provided) | No |
| `position` | Positioning information (see positioning options below) | Yes |
| `inputs` | Input connection definitions (alternative to connections array) | No |
| `outputs` | Output connection definitions (alternative to connections array) | No |

### Primitive Ports

Each primitive type has specific input and output ports that serve as connection points:

| Primitive Type | Input Ports | Output Ports |
|-----------|-------------|--------------|
| `input` | None | `out` (right side) |
| `output` | `in` (left side) | None |
| `add` | `in1` (upper left), `in2` (lower left) | `out` (right side) |
| `mul` | `in1` (upper left), `in2` (lower left) | `out` (right side) |
| `relu2` | `in` (left side) | `out` (right side) |
| `clamp` | `in` (left side) | `out` (right side) |
| `reg` | `in` (left side) | `out` (right side) |

### Supported Primitive Types

The SchematicViewer supports these basic component types:

| Type | Description | Visual |
|------|-------------|--------|
| `input` | Input signal (e.g., x0, w0, bias) | Light blue rectangle |
| `output` | Final output value (e.g., y) | Light green rectangle |
| `add` | Addition block with two inputs | White square |
| `mul` | Multiplication block with two inputs | White square |
| `relu2` | Square of ReLU activation | Yellow square |
| `clamp` | Range limiter | Light red square |
| `reg` | Register that passes signal through while consuming a clock cycle | Light purple square |

## Positioning Options

The SchematicViewer offers multiple ways to position primitives in the diagram:

### 1. Grid-Based Positioning (Recommended)

Grid-based positioning uses clock cycles and row indices for precise alignment:

```json
{
  "id": "mul1",
  "type": "mul",
  "position": {
    "cycle": 2,    // Clock cycle (column)
    "row": 3,      // Row within that cycle (optional)
    "rowOffset": 0.5  // Fine adjustment within the row (optional)
  }
}
```

This approach ensures primitives are properly aligned to the grid system, with optional fine-tuning.

### 2. Relative Positioning

Primitives can be positioned relative to other primitives:

```json
{
  "id": "add1",
  "type": "add",
  "position": {
    "relativeTo": "mul1",    // ID of reference primitive
    "direction": "right",    // right, below, above, left
    "cycleOffset": 1,        // Cycles to offset (default: appropriate for direction)
    "rowOffset": 0           // Rows to offset (default: 0)
  }
}
```

Common patterns are simplified with direction keywords:
- `"right"`: Place in the next logical clock cycle (output → input flow)
- `"below"`: Place in the same clock cycle but in the row below
- `"rightBelow"`: Combination of right and below

### 3. Absolute Positioning (Legacy)

For backward compatibility, absolute X/Y coordinates are still supported:

```json
{
  "id": "input1",
  "type": "input",
  "position": {"x": 100, "y": 200}
}
```

When absolute positioning is used with `clock_cycle`, the X coordinate is derived from the clock cycle.

## Connection Specification

Connections in SchematicViewer can be specified in multiple ways for clarity and convenience:

### 1. Standard Connection Format

The standard format specifies source and target primitives with their ports:

```json
{
  "source": "mul1",
  "sourcePort": "out",
  "target": "add1",
  "targetPort": "in1"
}
```

### 2. Shorthand Connection Format

For single-input/output primitives, a simplified format is available:

```json
{
  "from": "relu1",  // Source primitive
  "to": "clamp1"    // Target primitive
}
```

This automatically connects the default output port to the default input port.

### 3. Primitive-Centric Connections

Connections can be defined within the primitive definition:

```json
{
  "id": "add1",
  "type": "add",
  "inputs": {
    "in1": "mul1.out",  // Connect mul1's output to this primitive's in1
    "in2": "bias.out"   // Connect bias's output to this primitive's in2
  }
}
```

Or as an output array:

```json
{
  "id": "mul1",
  "type": "mul",
  "outputs": ["add1.in1"]  // Connect this primitive's output to add1's in1
}
```

### 4. Chain Connections

For linear sequences of operations, a chain format can be used:

```json
{
  "chain": ["input1", "mul1", "add1", "relu1", "output1"]
}
```

This automatically connects each primitive's output to the next primitive's default input.

### 5. Connection Styles (Optional)

Visual style of connections can be customized:

```json
{
  "source": "relu1",
  "target": "clamp1",
  "style": {
    "stroke": "#ff0000",
    "strokeWidth": 2,
    "strokeDasharray": "5,5",  // Dashed line
    "curve": 0.7               // Curvature factor (0 = straight)
  }
}
```

## Hierarchical Structure

SchematicViewer supports a hierarchical representation of neural networks with four levels:

### 1. Primitives

Primitives are the basic building blocks (detailed above).

### 2. Modules

Modules encapsulate multiple primitives into a reusable functional unit:

```json
{
  "modules": [
    {
      "id": "linear1",
      "type": "linear",
      "position": {
        "cycle": 2,
        "row": 1
      },
      "interface": {
        "inputs": ["in_x", "in_w", "in_bias"],
        "outputs": ["out"]
      },
      "implementation": {
        "primitives": [
          {
            "id": "mul",
            "type": "mul",
            "position": { "cycle": 0, "row": 0 }
          },
          {
            "id": "add",
            "type": "add",
            "position": { "cycle": 1, "row": 0 }
          }
        ],
        "connections": [
          { "from": "EXTERNAL.in_x", "to": "mul.in1" },
          { "from": "EXTERNAL.in_w", "to": "mul.in2" },
          { "from": "EXTERNAL.in_bias", "to": "add.in2" },
          { "from": "mul.out", "to": "add.in1" },
          { "from": "add.out", "to": "EXTERNAL.out" }
        ]
      },
      "appearance": {
        "label": "Linear Unit",
        "color": "#e6f7ff",
        "collapsed": true // Start in collapsed view
      }
    }
  ]
}
```

Key features:
- `interface`: Defines external connection points (inputs/outputs)
- `implementation`: Internal structure (primitives and connections)
- `appearance`: Visual styling when collapsed or expanded
- Special `EXTERNAL` keyword connects internal implementation to interface ports

### 3. Layers

Layers group related modules into a functional layer:

```json
{
  "layers": [
    {
      "id": "dense_layer1",
      "type": "dense",
      "position": {
        "cycle": 2,
        "span": 5 // Clock cycles this layer spans
      },
      "components": [
        {
          "ref": "linear1", // Reference to defined module
          "position": { "row": 1 }
        },
        {
          "ref": "linear1", // Reuse the same module definition
          "id": "linear2", // But with a new instance ID
          "position": { "row": 2 }
        }
      ],
      "connections": [
        { "from": "EXTERNAL.input", "to": "linear1.in_x" },
        { "from": "EXTERNAL.input", "to": "linear2.in_x" },
        { "from": "linear1.out", "to": "EXTERNAL.output1" },
        { "from": "linear2.out", "to": "EXTERNAL.output2" }
      ],
      "interface": {
        "inputs": ["input"],
        "outputs": ["output1", "output2"]
      }
    }
  ]
}
```

### 4. Networks

Networks combine multiple layers into a complete neural network:

```json
{
  "networks": [
    {
      "id": "mlp",
      "type": "feedforward",
      "layers": [
        {
          "ref": "dense_layer1",
          "position": { "cycle": 0 }
        },
        {
          "id": "activation",
          "type": "activation",
          "position": { "cycle": 6 },
          // ...layer definition
        }
      ],
      "connections": [
        { "from": "dense_layer1.output1", "to": "activation.input1" },
        { "from": "dense_layer1.output2", "to": "activation.input2" }
      ]
    }
  ]
}
```

## Complete Example

Here's a simplified example showing a diagram with primitives and connections:

```json
{
  "primitives": [
    {
      "id": "x0",
      "type": "input",
      "label": "x₀",
      "position": { "cycle": 0, "row": 1 }
    },
    {
      "id": "w0",
      "type": "input",
      "label": "w₀",
      "position": { "cycle": 0, "row": 2 }
    },
    {
      "id": "mul0",
      "type": "mul",
      "position": { "cycle": 1, "row": 1 },
      "inputs": {
        "in1": "x0.out",
        "in2": "w0.out"
      }
    },
    {
      "id": "bias",
      "type": "input",
      "label": "bias",
      "position": { "cycle": 0, "row": 3 }
    },
    {
      "id": "reg_bias",
      "type": "reg",
      "position": { "cycle": 1, "row": 3 },
      "inputs": { "in": "bias.out" }
    },
    {
      "id": "add",
      "type": "add",
      "position": { "cycle": 2, "row": 2 },
      "inputs": {
        "in1": "mul0.out",
        "in2": "reg_bias.out"
      }
    },
    {
      "id": "output",
      "type": "output",
      "label": "y",
      "position": { "cycle": 3, "row": 2 },
      "inputs": { "in": "add.out" }
    }
  ]
}
```

This approach eliminates the need for a separate connections array by embedding connection information directly in the primitives.

## Visualization Controls

SchematicViewer provides interactive controls for diagram exploration:

### Zoom and Pan
- **Zoom Buttons**: Use the + and - buttons in the bottom right corner
- **Mouse Wheel**: Scroll to zoom in and out
- **Double-Click**: Reset the view to default zoom level
- **Drag**: Click and drag on the background to pan the diagram

### Primitive Selection and Highlighting
- **Hover Effects**: Hover over primitives and connections to highlight them
- **Click Selection**: Click on a primitive to select it and highlight all its connections
- **Background Click**: Click on the background to deselect everything
- **Tooltips**: Hover over components to see additional information

### Grid System
- **Clock Cycle Alignment**: Primitives are aligned in columns based on their clock cycle
- **Toggle Grid**: Use the grid controls to show/hide the grid
- **Adjust Spacing**: Configure the grid spacing using the dropdown menu
- **Column Highlighting**: When a primitive is selected, its clock cycle column is highlighted

### Hierarchy Navigation
- **Expand/Collapse**: Double-click a compound node to toggle expansion
- **Zoom to Level**: Control which hierarchy level is displayed
- **Navigate Up/Down**: Move between parent/child hierarchies
- **Breadcrumbs**: Navigate back up the hierarchy

## Implementation Notes

The enhanced format maintains backward compatibility while adding powerful new features:

1. The original format still works unchanged
2. New features can be incrementally adopted
3. Different connection specification styles can be mixed as needed
4. The cycle/row positioning system simplifies alignment
5. Hierarchical structures allow for more complex diagrams with better organization

Future enhancements may include:
- Library of predefined compound nodes for common neural network components
- Support for conditional rendering of diagram elements
- Interactive parameter adjustment
- Simulation capabilities