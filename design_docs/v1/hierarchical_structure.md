# SchematicViewer Hierarchical Structure Design

## Overview

This document outlines the hierarchical design approach for the SchematicViewer, allowing for multi-level visualization of neural networks from individual operations to entire network architectures.

## Hierarchical Levels

The SchematicViewer will support a four-level hierarchy that allows representing neural networks at multiple levels of abstraction:

### 1. Primitives (Atoms)

- The smallest indivisible units of computation
- Examples: `add`, `mul`, `relu²`, `clamp`
- Characteristics:
  - Single operation
  - Fixed number of inputs/outputs
  - Visual representation as a basic schematic symbol

### 2. Modules

- Collections of primitives that form a functional unit
- Examples: `quantized_linear`, `attention_head`, `norm_layer`
- Characteristics:
  - Composed of multiple primitives
  - Has a simplified external representation
  - Can be expanded to view internal structure
  - Internal connections between primitives
  - Standard input/output interface

### 3. Layers

- Collections of modules and/or primitives
- Examples: `linear_layer`, `conv_layer`, `transformer_layer`
- Characteristics:
  - Implements a common neural network layer
  - May contain multiple modules
  - Defines connections between modules
  - May have repeated structures

### 4. Networks

- Complete neural network architectures
- Examples: `mlp`, `cnn`, `transformer`
- Characteristics:
  - Composed of multiple layers
  - Top-level view of the entire model
  - Navigable through drill-down

## Temporal Alignment

A key concept in the hierarchical design is maintaining temporal alignment through the use of clock cycles:

- **Clock Cycle**: Represents a discrete time step in neural network computation
- **Visualization**: Elements with the same clock cycle are vertically aligned in the same column
- **Parallelism**: Operations in the same column occur in parallel
- **Propagation**: Data flows from left to right through increasing clock cycles

## Positioning System

The positioning system will support both absolute and relative positioning:

### Absolute Positioning

```json
{
  "id": "input1",
  "type": "input",
  "clock_cycle": 0,
  "position": {"x": 100, "y": 100}
}
```

### Relative Positioning

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

## Grid System

The grid system will support the hierarchical structure by:

1. **Temporal Grid**: Columns aligned with clock cycles
2. **Spatial Grid**: Rows for parallel operations
3. **Multi-scale**: Different grid densities for different hierarchy levels
4. **Snapping**: Elements aligned to grid intersections
5. **Visual Aids**: Optional grid lines or points for reference

## Compound Navigation

Users will navigate through the hierarchy by:

1. Double-clicking on a compound node to expand/view its internal structure
2. Using breadcrumb navigation to move up the hierarchy
3. Using a minimap for context within larger structures

## JSON Schema Evolution

The JSON format will evolve to support hierarchy with reusable module definitions:

```json
{
  "moduleDefinitions": {
    "quantized_linear": {
      "inputs": [
        {"name": "input", "size": 2},
        {"name": "weight", "size": 2},
        "bias",
        "scale"
      ],
      "outputs": ["out"],
      "components": [
        {
          "id": "mul0",
          "type": "mul",
          "inputs": {
            "in1": "$.input[0]",
            "in2": "$.weight[0]"
          }
        },
        {
          "id": "mul1",
          "type": "mul",
          "inputs": {
            "in1": "$.input[1]",
            "in2": "$.weight[1]"
          }
        },
        {
          "id": "add1",
          "type": "add",
          "inputs": {
            "in1": "mul0.out",
            "in2": "mul1.out"
          }
        },
        // Additional internal components...
        {
          "id": "clamp1",
          "type": "clamp",
          "inputs": {
            "in": "mul2.out"
          }
        }
      ],
      "outputMappings": {
        "out": "clamp1.out"
      }
    }
  },

  "primitives": [
    {
      "id": "input1",
      "type": "input",
      "label": "x₀"
    }
  ],

  "modules": [
    {
      "id": "linear1",
      "type": "quantized_linear",
      "label": "Linear Unit 1",
      "inputs": {
        "input": ["x0.out", "x1.out"],
        "weight": ["w0.out", "w1.out"],
        "bias": "bias.out",
        "scale": "scale.out"
      }
    },
    {
      "id": "linear2",
      "type": "quantized_linear",
      "label": "Linear Unit 2",
      "inputs": {
        "input": ["x2.out", "x3.out"],
        "weight": ["w2.out", "w3.out"],
        "bias": "bias.out",
        "scale": "scale.out"
      }
    }
  ],

  "layers": [
    {
      "id": "layer1",
      "type": "linear_block",
      "components": ["linear1", "linear2"],
      "connections": [
        {"source": "linear1.out", "target": "linear2.input"}
      ]
    }
  ],

  "networks": [
    {
      "id": "network1",
      "type": "mlp",
      "components": ["layer1", "layer2"],
      "connections": [
        {"source": "layer1.out", "target": "layer2.input"}
      ]
    }
  ]
}
```

### Module Definition Format

The `moduleDefinitions` section defines reusable module templates that can be instantiated multiple times:

1. **Module Type Name**: Each module definition is keyed by its type name (e.g., "quantized_linear")
2. **Inputs/Outputs**: Lists the expected input and output ports for the module
3. **Components**: Internal components that make up the module
4. **Input References**: Use `$.portName` syntax to reference module inputs
5. **Output Mappings**: Maps internal component outputs to module output ports

### Vector Input Support

For modules that require vector inputs (such as multiple input values or weights):

1. **Input Definition**: Use the object format to specify vector inputs with a size:
   ```json
   {"name": "input", "size": 2}
   ```

2. **Vector Access**: Access vector elements using array indexing syntax:
   ```json
   "$.input[0]"  // First element
   "$.input[1]"  // Second element
   ```

3. **Scalar Inputs**: For simplicity, scalar inputs can use the string shorthand:
   ```json
   "bias"  // Equivalent to {"name": "bias", "size": 1}
   ```

4. **Module Instantiation**: Provide arrays for vector inputs:
   ```json
   "input": ["x0.out", "x1.out"]
   ```

### Module Instance Format

When creating a module instance, you only need to specify:

1. **ID**: Unique identifier for this instance
2. **Type**: References a module definition
3. **Label**: Optional display name
4. **Inputs**: Maps module input ports to connections in the diagram

The system will automatically create the internal components and connections based on the module definition template, with proper scoping of component IDs to avoid conflicts.

## Implementation Phasing

The hierarchical structure will be implemented in phases:

1. **Phase 1**: Basic viewing of primitives (current implementation)
2. **Phase 2**: Grid system with clock cycle alignment
3. **Phase 3**: Modules with expand/collapse functionality
4. **Phase 4**: Layers and networks
5. **Phase 5**: Advanced navigation and interaction

This phased approach allows for incremental development while maintaining a clear vision of the final system.