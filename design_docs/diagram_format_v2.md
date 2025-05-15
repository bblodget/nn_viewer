# SchematicViewer Diagram Format v2

This document describes the updated JSON format for the Neural Network SchematicViewer, focusing on hierarchical module representation and navigation.

## Core Philosophy

The v2 format treats all diagram content as modules, including the top level, enabling a consistent approach to:

- Hierarchical organization of network components
- Consistent navigation between different levels of abstraction
- Uniform rendering and positioning logic at all levels
- Simplified module expansion and inspection

## Root Structure

Each diagram JSON file has the following structure:

```json
{
  "entryPointModule": "moduleName",
  "moduleDefinitions": {
    "module1": { /* module definition */ },
    "module2": { /* module definition */ },
    /* Additional module definitions... */
  }
}
```

- `entryPointModule`: String identifying which module to display initially
- `moduleDefinitions`: Object containing all module definitions used in the diagram

## Module Definition

Each module is defined with this structure:

```json
{
  "inputs": ["inputName1", "inputName2", /* ... */],
  "outputs": ["outputName1", /* ... */],
  "components": [
    { /* component definition */ },
    { /* component definition */ }
    /* Additional components... */
  ],
  "outputMappings": {
    "outputName1": "componentId.portName",
    /* Additional output mappings... */
  }
}
```

- `inputs`: Array of input port names for the module
- `outputs`: Array of output port names for the module
- `components`: Array of component definitions within the module
- `outputMappings`: Maps module output ports to internal component outputs

## Component Types

The system supports two main types of components:

### 1. Primitive Components

Basic building blocks with predefined functionality:

```json
{
  "id": "componentId",
  "type": "primitiveType",
  "inputs": {
    "portName1": "sourceId.portName",
    "portName2": "$.inputName"
  }
}
```

- `id`: Unique identifier for the component within its module
- `type`: Component type (e.g., "add", "mul", "reg", "relu2", "clamp")
- `inputs`: Maps component input ports to sources (other components or module inputs)

Supported primitive types include:
- `add`: Addition operation
- `mul`: Multiplication operation
- `relu2`: Squared ReLU activation function
- `clamp`: Range limiter
- `reg`: Register (for delay/pipeline stages)

### 2. Module Components

References to other module definitions, creating a hierarchy:

```json
{
  "id": "moduleInstanceId",
  "type": "module",
  "moduleType": "moduleName",
  "label": "Optional Display Label",
  "inputs": {
    "subModuleInput1": "$.parentModuleInput1",
    "subModuleInput2": "componentId.portName"
  }
}
```

- `id`: Unique identifier for the module instance
- `type`: Always "module" for module instances
- `moduleType`: Name of the module definition being instantiated
- `label`: Optional display label for the module (if omitted, moduleType is used)
- `inputs`: Maps the submodule's inputs to either parent module inputs or component outputs

## Connection References

The format uses two types of connection references:

1. **Internal Component References**: `"componentId.portName"`
   - References an output port of another component within the same module

2. **Module Input References**: `"$.inputName"`
   - References an input port of the current module using the "$." prefix

## Automatic Layout

The position of components is automatically determined by these rules:

1. **Clock Cycle (Horizontal Position)**:
   - Input primitives are always placed in cycle 0
   - For other primitives, the cycle is calculated as (maximum input cycle + 1)
   - Module components follow the same cycle calculation rule

2. **Row (Vertical Position)**:
   - Input primitives are positioned sequentially
   - Processing primitives and modules are positioned near the average Y-position of their inputs
   - Modules are given more vertical space for readability

## Module Navigation

Users navigate the module hierarchy through:

1. **Drill Down**: Double-click on a module to expand it and see its internal components
2. **Move Up**: Use the back/close button to return to the parent module
3. **Module Context**: The currently displayed module is tracked in the viewer state

The top-level module (specified by `entryPointModule`) is treated identically to any other module.

## Example: MAC Block with Module Reuse

```json
{
  "entryPointModule": "mainDiagram",
  "moduleDefinitions": {
    "macBlock": {
      "inputs": ["x0", "w0", "x1", "w1"],
      "outputs": ["out"],
      "components": [
        {
          "id": "mul0",
          "type": "mul",
          "inputs": {
            "in1": "$.x0",
            "in2": "$.w0"
          }
        },
        {
          "id": "mul1",
          "type": "mul",
          "inputs": {
            "in1": "$.x1",
            "in2": "$.w1"
          }
        },
        {
          "id": "add1",
          "type": "add",
          "inputs": {
            "in1": "mul0.out",
            "in2": "mul1.out"
          }
        }
      ],
      "outputMappings": {
        "out": "add1.out"
      }
    },
    "mainDiagram": {
      "inputs": ["x0", "w0", "x1", "w1", "bias", "scale"],
      "outputs": ["out"],
      "components": [
        {
          "id": "macBlock1",
          "type": "module",
          "moduleType": "macBlock",
          "label": "MAC Block",
          "inputs": {
            "x0": "$.x0",
            "w0": "$.w0",
            "x1": "$.x1",
            "w1": "$.w1"
          }
        },
        {
          "id": "reg_bias1",
          "type": "reg",
          "inputs": {
            "in": "$.bias"
          }
        },
        {
          "id": "reg_bias2",
          "type": "reg",
          "inputs": {
            "in": "reg_bias1.out"
          }
        },
        {
          "id": "add2",
          "type": "add",
          "inputs": {
            "in1": "macBlock1.out",
            "in2": "reg_bias2.out"
          }
        },
        {
          "id": "relu1",
          "type": "relu2",
          "inputs": {
            "in": "add2.out"
          }
        },
        {
          "id": "reg_scale1",
          "type": "reg",
          "inputs": {
            "in": "$.scale"
          }
        },
        {
          "id": "reg_scale2",
          "type": "reg",
          "inputs": {
            "in": "reg_scale1.out"
          }
        },
        {
          "id": "reg_scale3",
          "type": "reg",
          "inputs": {
            "in": "reg_scale2.out"
          }
        },
        {
          "id": "reg_scale4",
          "type": "reg",
          "inputs": {
            "in": "reg_scale3.out"
          }
        },
        {
          "id": "mul2",
          "type": "mul",
          "inputs": {
            "in1": "relu1.out",
            "in2": "reg_scale4.out"
          }
        },
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
  }
}
```

## Key Improvements in v2

1. **Unified Module Treatment**: The top-level diagram is a module, simplifying the rendering logic
2. **Direct Input References**: The `$.inputName` syntax provides clearer references to module inputs
3. **Consistent Navigation**: Module navigation is uniform at all levels of the hierarchy
4. **Automatic Layout**: Components are automatically positioned based on data flow
5. **Self-Contained Definitions**: Module definitions include all necessary information for rendering
6. **Flat Reference Structure**: All references use a simple two-level approach (component.port or $.input)

## Implementation Notes

When implementing the v2 format:

1. **Module Registry**: All module definitions should be stored in a central registry
2. **Expanded Views**: When expanding a module, render its components in a new view
3. **Navigation State**: Maintain a breadcrumb or history stack for module navigation
4. **Scope Isolation**: Each module's component IDs are scoped to that module
5. **Dynamic Layout**: Update layout when navigating between modules
6. **Connection Resolution**: Translate `$.inputName` references to actual connections when rendering