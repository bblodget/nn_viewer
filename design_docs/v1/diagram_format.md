# SchematicViewer Diagram Format (Simplified)

This document describes a simplified and more intuitive JSON format for SchematicViewer diagrams, focusing on a declarative approach that automatically derives component positions from connections.

## Overview

The diagram is defined as a JSON array of primitives, where:
- The order of primitives in the array determines their vertical placement
- The connections between primitives determine their horizontal placement (clock cycles)
- No explicit positioning is required in most cases

## Primitive Format

Each primitive represents a basic component in the neural network and has the following properties:

```json
{
  "id": "unique_identifier",
  "type": "component_type",
  "label": "display_text",
  "inputs": {
    "input_port_name": "source_primitive_id.output_port_name"
  }
}
```

### Properties

| Property | Description | Required |
|----------|-------------|----------|
| `id` | Unique identifier for the primitive | Yes |
| `type` | The component type (see supported types below) | Yes |
| `label` | Text to display on the primitive (defaults to type if not provided) | No |
| `inputs` | Connections to this primitive's input ports | No (for input types) |

### Automatic Positioning

The position of each primitive is automatically determined by these rules:

1. **Clock Cycle (Horizontal Position)**:
   - Input primitives are always placed in cycle 0
   - For other primitives, the cycle is calculated as (maximum input cycle + 1)
   - Output primitives follow the same rule as other primitives

2. **Row (Vertical Position)**:
   - Input primitives are positioned sequentially in the order they appear in the array
   - Processing primitives are positioned at the average Y-position of their inputs
   - This creates a natural flow where operations appear between their inputs

### Supported Primitive Types

The SchematicViewer supports these basic component types:

| Type | Description | Input Ports | Output Ports |
|------|-------------|-------------|--------------|
| `input` | Input signal | None | `out` |
| `output` | Output value | `in` | None |
| `add` | Addition operation | `in1`, `in2` | `out` |
| `mul` | Multiplication operation | `in1`, `in2` | `out` |
| `relu2` | Square of ReLU activation | `in` | `out` |
| `clamp` | Range limiter | `in` | `out` |
| `reg` | Register for clock cycle delay | `in` | `out` |

## Connection Specification

Connections are defined directly within each primitive through the `inputs` property:

```json
{
  "id": "add1",
  "type": "add",
  "inputs": {
    "in1": "mul1.out",
    "in2": "bias.out"
  }
}
```

This defines connections from:
- `mul1`'s output port to `add1`'s `in1` port
- `bias`'s output port to `add1`'s `in2` port

For primitives with a single input, you can use a shorthand:

```json
{
  "id": "relu1",
  "type": "relu2",
  "inputs": { "in": "add1.out" }
}
```

## Complete Example

Here's a simple neural network component with implicit positioning:

```json
[
  {
    "id": "x0",
    "type": "input",
    "label": "x₀"
  },
  {
    "id": "w0",
    "type": "input",
    "label": "w₀"
  },
  {
    "id": "bias",
    "type": "input",
    "label": "bias"
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
    "id": "reg_bias",
    "type": "reg",
    "inputs": { "in": "bias.out" }
  },
  {
    "id": "add1",
    "type": "add",
    "inputs": {
      "in1": "mul1.out",
      "in2": "reg_bias.out"
    }
  },
  {
    "id": "relu1",
    "type": "relu2",
    "inputs": { "in": "add1.out" }
  },
  {
    "id": "output",
    "type": "output",
    "label": "y",
    "inputs": { "in": "relu1.out" }
  }
]
```

This will be rendered with:
- `x0`, `w0`, and `bias` in cycle 0
- `mul1` and `reg_bias` in cycle 1
- `add1` in cycle 2
- `relu1` in cycle 3
- `output` in cycle 4

Vertically, the primitives will appear in the order they're listed, with primitives in the same cycle stacked.

## Implementation Details

To implement this simplified format:

1. First pass: Determine the cycle (column) of each primitive
   - Start with input primitives at cycle 0
   - For each non-input primitive, find the maximum cycle of its inputs and add 1

2. Second pass: Determine the row of each primitive
   - Position input primitives sequentially based on their array order
   - For other primitives, calculate the average Y-position of their inputs
   - This positioning creates cleaner diagrams with minimal crossing connections

3. Apply grid sizing and spacing for optimal readability
   - Default grid spacing: 100px horizontally, 100px vertically
   - Adjust spacing as needed for different diagram densities

4. Render the diagram with these calculated positions

## Future Enhancements

If needed, the following features could be added while maintaining the simplicity of the core format:

### Position Adjustments

For cases where the automatic layout needs fine-tuning:

```json
{
  "adjustments": [
    {
      "id": "add1",
      "rowOffset": 0.5
    },
    {
      "id": "reg_bias",
      "cycleOffset": 1
    }
  ]
}
```

### Hierarchical Structures

For modules that encapsulate multiple primitives:

```json
{
  "modules": [
    {
      "id": "linear1",
      "type": "linear",
      "interface": {
        "inputs": ["x", "w", "bias"],
        "outputs": ["out"]
      },
      "implementation": [
        // Array of primitives using the same format
      ]
    }
  ]
}
```

## Advantages of This Approach

1. **Simplicity**: The format is concise and intuitive
2. **Maintainability**: Changes to the network structure automatically update the layout
3. **Correctness**: The visualization correctly reflects data dependencies
4. **Focus on Logic**: Developers can focus on the network structure rather than presentation details
5. **Self-Documenting**: The JSON itself clearly communicates the network structure
6. **Predictability**: The layout is fully determined by the dependency structure