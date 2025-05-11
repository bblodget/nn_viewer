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

### 2. Compound Nodes

- Collections of primitives that form a functional unit
- Examples: `quantized_linear`, `attention_head`, `norm_layer`
- Characteristics:
  - Composed of multiple primitives
  - Has a simplified external representation
  - Can be expanded to view internal structure
  - Internal connections between primitives
  - Standard input/output interface

### 3. Layers

- Collections of compound nodes and/or primitives
- Examples: `linear_layer`, `conv_layer`, `transformer_layer`
- Characteristics:
  - Implements a common neural network layer
  - May contain multiple compound nodes
  - Defines connections between compounds
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

The JSON format will evolve to support hierarchy:

```json
{
  "primitives": [
    {
      "id": "mul1",
      "type": "mul",
      "clock_cycle": 1,
      "position": {"x": 100, "y": 100}
    }
  ],
  
  "compounds": [
    {
      "id": "linear1",
      "type": "quantized_linear",
      "clock_cycle": 1,
      "position": {"x": 200, "y": 100},
      "components": ["mul1", "add1", "clamp1"],
      "connections": [
        {"source": "mul1", "target": "add1"}
      ]
    }
  ],
  
  "layers": [
    {
      "id": "layer1",
      "type": "linear_block",
      "components": ["linear1", "linear2"],
      "connections": [
        {"source": "linear1", "target": "linear2"}
      ]
    }
  ],
  
  "networks": [
    {
      "id": "network1",
      "type": "mlp",
      "components": ["layer1", "layer2"],
      "connections": [
        {"source": "layer1", "target": "layer2"}
      ]
    }
  ]
}
```

## Implementation Phasing

The hierarchical structure will be implemented in phases:

1. **Phase 1**: Basic viewing of primitives (current implementation)
2. **Phase 2**: Grid system with clock cycle alignment
3. **Phase 3**: Compound nodes with expand/collapse functionality
4. **Phase 4**: Layers and networks
5. **Phase 5**: Advanced navigation and interaction

This phased approach allows for incremental development while maintaining a clear vision of the final system.