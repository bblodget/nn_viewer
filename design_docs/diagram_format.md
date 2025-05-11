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
  "position": {"x": 100, "y": 200}
}
```

### Properties

| Property | Description | Required |
|----------|-------------|----------|
| `id` | Unique identifier for the node | Yes |
| `type` | The component type (see supported types below) | Yes |
| `label` | Text to display on the node (defaults to type if not provided) | No |
| `position` | X/Y coordinates for positioning the node on the canvas | Yes |

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
| `sourcePort` | Name of the output port on the source node | No |
| `targetPort` | Name of the input port on the target node | No |

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

## Future Enhancements

In future versions, the diagram format will be extended to support:
- Node grouping into macros/subcircuits
- Additional node metadata
- Custom visual styling options
- Multiple diagram layers