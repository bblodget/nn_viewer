# Module Reuse in SchematicViewer

This document explains the approach to module reuse in the SchematicViewer tool, allowing for more efficient and maintainable diagram definitions.

## Module Reuse Problem

In neural network diagrams, common patterns appear frequently. For example, multiple linear units with identical internal structure but different connections. 

### Before: Repetitive Component Definitions

Without module reuse, we need to duplicate component definitions for each instance:

```json
{
  "id": "linear1",
  "type": "module",
  "moduleType": "quantized_linear",
  "components": [
    { "id": "linear1_mul", "type": "mul", "inputs": {...} },
    { "id": "linear1_add", "type": "add", "inputs": {...} },
    { "id": "linear1_clamp", "type": "clamp", "inputs": {...} }
  ]
},
{
  "id": "linear2",
  "type": "module",
  "moduleType": "quantized_linear",
  "components": [
    { "id": "linear2_mul", "type": "mul", "inputs": {...} }, 
    { "id": "linear2_add", "type": "add", "inputs": {...} },
    { "id": "linear2_clamp", "type": "clamp", "inputs": {...} }
  ]
}
```

This approach:
- Increases file size and complexity
- Makes maintenance harder when module structure changes
- Creates risk of inconsistency between module instances

## Module Definition Approach

The improved approach separates module definitions from their instances:

1. Define a module once in the `moduleDefinitions` section
2. Reference the definition when creating module instances
3. Define only the instance-specific properties (ID, inputs, etc.)

### Module Definition

```json
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
        "id": "add",
        "type": "add",
        "inputs": {
          "in1": "mul0.out",
          "in2": "mul1.out"
        }
      },
      // Additional components...
      {
        "id": "clamp",
        "type": "clamp",
        "inputs": {
          "in": "mul2.out"
        }
      }
    ],
    "outputMappings": {
      "out": "clamp.out"
    }
  }
}
```

### Module Instance

```json
{
  "id": "linear1",
  "type": "module",
  "moduleType": "quantized_linear",
  "label": "Linear Unit 1",
  "inputs": {
    "input": ["x0.out", "x1.out"],
    "weight": ["w0.out", "w1.out"],
    "bias": "bias.out",
    "scale": "scale.out"
  }
}
```

## How It Works

1. The viewer parses the module definition for the specified `moduleType`
2. At runtime, internal components are created with instance-specific prefixes:
   - `linear1_mul`, `linear1_add`, `linear1_clamp`
3. Input connections are mapped from instance inputs to internal components
4. Output connections are mapped from internal components to module outputs

## Benefits

1. **Reduced Redundancy**: Define module structure once, use it many times
2. **Improved Consistency**: All instances of a module share the same structure
3. **Better Maintainability**: Changes to module structure affect all instances
4. **Cleaner Diagrams**: Focus on the high-level relationships between modules
5. **Easier Creation**: Create new instances with minimal configuration

## Implementation Details

- When expanding a module, the components are dynamically created based on the definition
- Component IDs are prefixed with the module instance ID to avoid conflicts
- Special syntax (`$.portName`) references module inputs in component connections
- `outputMappings` connects internal component outputs to module output ports

## Vector Input Support

Neural networks commonly use vectors of inputs and weights. Our module system supports this with structured input definitions:

### Vector Input Definition

```json
"inputs": [
  {"name": "input", "size": 2},  // Vector input with 2 elements
  {"name": "weight", "size": 2}, // Vector weight with 2 elements
  "bias",                        // Scalar input (shorthand for {"name": "bias", "size": 1})
  "scale"                        // Scalar input
]
```

### Accessing Vector Elements

Individual elements of vector inputs are accessed using array indexing syntax:

```json
"inputs": {
  "in1": "$.input[0]",  // First element of input vector
  "in2": "$.weight[1]"  // Second element of weight vector
}
```

### Providing Vector Inputs in Module Instances

When instantiating a module, provide arrays for vector inputs:

```json
"inputs": {
  "input": ["x0.out", "x1.out"],     // Vector of two inputs
  "weight": ["w0.out", "w1.out"],    // Vector of two weights
  "bias": "bias.out",                // Scalar input
  "scale": "scale.out"               // Scalar input
}
```

This approach offers several advantages:

1. **JSON-Native**: Uses native JSON structures without requiring string parsing
2. **Self-Documenting**: The size parameter clearly indicates expected vector length
3. **Type Safety**: The system can validate that provided inputs match expected sizes
4. **Extensible**: Additional metadata can be added to input definitions as needed
5. **Mixed Usage**: Supports both vector and scalar inputs in a clean, consistent way