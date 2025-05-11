# SchematicViewer Diagram Format

This document explains the JSON netlist format used in the SchematicViewer tool to define neural network diagrams.

## Overview

The diagram is defined in a JSON file with two main sections:
- `nodes`: The components in the neural network (inputs, operations, outputs)
- `connections`: The edges that connect these components

## Node Format

Each node represents a component in the neural network and has the following properties:

```json
{
  "id": "unique_identifier",
  "type": "component_type",
  "label": "display_text",
  "clock_cycle": 1,
  "position": {"x": 100, "y": 200}
}
```

### Properties

| Property | Description | Required |
|----------|-------------|----------|
| `id` | Unique identifier for the node | Yes |
| `type` | The component type (see supported types below) | Yes |
| `label` | Text to display on the node (defaults to type if not provided) | No |
| `clock_cycle` | Temporal position (column) in the grid system | No |
| `position` | X/Y coordinates for positioning the node on the canvas | Yes |

### Node Ports

Each node type has specific input and output ports that serve as connection points:

| Node Type | Input Ports | Output Ports |
|-----------|-------------|--------------|
| `input` | None | `out` (right side) |
| `output` | `in` (left side) | None |
| `add` | `in1` (upper left), `in2` (lower left) | `out` (right side) |
| `mul` | `in1` (upper left), `in2` (lower left) | `out` (right side) |
| `relu2` | `in` (left side) | `out` (right side) |
| `clamp` | `in` (left side) | `out` (right side) |

### Supported Node Types

The SchematicViewer supports these component types:

| Type | Description | Visual |
|------|-------------|--------|
| `input` | Input signal (e.g., x0, w0, bias) | Light blue rectangle |
| `output` | Final output value (e.g., y) | Light green rectangle |
| `add` | Addition block with two inputs | White square |
| `mul` | Multiplication block with two inputs | White square |
| `relu2` | Square of ReLU activation | Yellow square |
| `clamp` | Range limiter | Light red square |

## Connection Format

Connections represent the edges between nodes and define how data flows through the network:

```json
{
  "source": "source_node_id",
  "target": "target_node_id",
  "sourcePort": "output_port_name",
  "targetPort": "input_port_name"
}
```

### Properties

| Property | Description | Required |
|----------|-------------|----------|
| `source` | ID of the source node | Yes |
| `target` | ID of the target node | Yes |
| `sourcePort` | Name of the output port on the source node (defaults to "out") | No |
| `targetPort` | Name of the input port on the target node (defaults to "in") | No |

### Port Connections

The `sourcePort` and `targetPort` properties specify which ports to connect between nodes. If these are omitted, the default output port ("out") of the source node will connect to the default input port ("in") of the target node.

For nodes with multiple input ports (like `add` and `mul`), it's recommended to explicitly specify the `targetPort` as either "in1" or "in2" to ensure the connection attaches to the correct input.

## Example Diagram

The sample `diagram.json` represents a simple neural network component that performs:
1. Multiplication of an input value (`x0`) with a weight (`w0`)
2. Addition of a bias term
3. Application of ReLU² activation
4. Clamping to limit the range
5. Final output (`y`)

This reflects a common pattern in neural networks: weighted input + bias, followed by activation and normalization.

### Visual Representation

```
   x0        w0
    |        |
    v        v
    +--------+
    |   mul1  |
    +--------+
         |     bias
         v      |
    +--------+  |
    |  add1  |<-+
    +--------+
         |
         v
    +--------+
    | relu2  |
    +--------+
         |
         v
    +--------+
    | clamp1 |
    +--------+
         |
         v
         y
```

## Creating Custom Diagrams

To create your own custom neural network diagrams:

1. Follow the node and connection format described above
2. Position nodes in a visually clear arrangement
3. Ensure each node has a unique ID
4. Make sure connections reference valid node IDs
5. Save the file with a `.json` extension
6. Load it in the SchematicViewer

## Loading Diagrams

There are two ways to load diagram JSON files into the viewer:

1. **File Input**: Click the "File Options" button in the header and use the file input to select a JSON file
2. **Drag and Drop**: Simply drag a diagram JSON file from your file explorer and drop it anywhere on the diagram area

## Interactivity

The SchematicViewer supports interactive features to explore diagrams:

### Zoom and Pan
- **Zoom Buttons**: Use the + and - buttons in the bottom right corner
- **Mouse Wheel**: Scroll to zoom in and out
- **Double-Click**: Reset the view to default zoom level
- **Drag**: Click and drag on the background to pan the diagram

### Node Selection and Highlighting
- **Hover Effects**: Hover over nodes and connections to highlight them
- **Click Selection**: Click on a node to select it and highlight all its connections
- **Background Click**: Click on the background to deselect everything
- **Tooltips**: Hover over components to see additional information

### Grid System
- **Clock Cycle Alignment**: Nodes are aligned in columns based on their clock cycle
- **Toggle Grid**: Use the grid controls to show/hide the grid
- **Adjust Spacing**: Configure the grid spacing using the dropdown menu
- **Column Highlighting**: When a node is selected, its clock cycle column is highlighted

## Hierarchical Structure

The diagram format has been extended to support a hierarchical structure. The current implementation includes clock cycle alignment, with further enhancements planned.

### Clock Cycle Alignment

Nodes are aligned based on their temporal relationship in the neural network:

```json
{
  "id": "input1",
  "type": "input",
  "clock_cycle": 0,  // Temporal position
  "position": {"x": 100, "y": 100}
}
```

Elements with the same clock cycle will be vertically aligned, representing operations that occur in parallel.

### Relative Positioning

Nodes can be positioned relative to other nodes:

```json
{
  "id": "input2",
  "type": "input",
  "clock_cycle": 0,
  "position": {
    "relativeTo": "input1",
    "relation": "below",
    "offset": {"y": 20}
  }
}
```

### Multi-Level Hierarchy

The diagram format will evolve to support four levels of hierarchy:

1. **Primitives** (currently called "nodes") - Basic operations like add, mul, relu²
2. **Compound Nodes** - Collections of primitives forming functional units
3. **Layers** - Collections of compound nodes forming neural network layers
4. **Networks** - Complete neural network architectures

### Compound Node Structure

Compound nodes will encapsulate multiple primitives:

```json
{
  "id": "linear1",
  "type": "quantized_linear",
  "clock_cycle": 1,
  "position": {"x": 200, "y": 100},
  "components": ["mul1", "add1", "clamp1"],
  "connections": [
    {"source": "mul1", "target": "add1"},
    {"source": "add1", "target": "clamp1"}
  ]
}
```

### Grid System

A grid system will provide:
- Visual alignment guides
- Clock cycle-based columnar organization
- Consistent spacing between components
- Multi-scale viewing for different hierarchy levels