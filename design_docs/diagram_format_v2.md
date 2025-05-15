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
  },
  "primitiveDefinitions": {
    "primitiveType1": { /* primitive definition */ },
    "primitiveType2": { /* primitive definition */ },
    /* Additional primitive definitions... */
  }
}
```

- `entryPointModule`: String identifying which module to display initially
- `moduleDefinitions`: Object containing all module definitions used in the diagram
- `primitiveDefinitions`: Object containing all primitive type definitions (optional, can also be loaded from a system file)

## Module Definition

Each module is defined with this structure:

```json
{
  "is_primitive": false,
  "parameters": {
    "DATA_WIDTH": 8,
    "PAIRS": 2
  },
  "inputs": [
    {"name": "inputName1", "size": "${DATA_WIDTH}", "group": "group1"},
    {"name": "inputName2", "size": "${DATA_WIDTH}", "group": "group1"}
  ],
  "outputs": [
    {"name": "outputName1", "size": 1}
  ],
  "port_groups": {
    "group1": {
      "ports": ["inputName1", "inputName2"],
      "arrangement": "interleaved",
      "color": "#3F51B5"
    }
  },
  "components": [
    { /* component definition */ },
    { /* component definition */ }
    /* Additional components... */
  ],
  "outputMappings": {
    "outputName1": "componentId.portName",
    /* Additional output mappings... */
  },
  "display": {
    "height": 2,
    "color": "#2196F3",
    "label": "Custom Module (${PAIRS}x)"
  }
}
```

- `is_primitive`: Flag indicating this is not a primitive (false or omitted for modules)
- `parameters`: Object containing configurable values that can be referenced elsewhere
  - Parameter values can be substituted in port sizes, labels, etc. using `${PARAM_NAME}` syntax
  - Parameters can be overridden when instantiating a module
- `inputs`: Array of input port definitions, each with a name, size, and optional group
  - `name`: The port identifier
  - `size`: The port width (number of bits/elements, default 1 if omitted)
  - `group`: Optional reference to a port group for layout coordination
- `outputs`: Array of output port definitions, each with a name and size
- `port_groups`: Defines grouping and arrangement of related ports
  - Each group has a unique identifier and contains:
    - `ports`: Array of port names in the group
    - `arrangement`: Layout style ("interleaved", "sequential", "alternating", etc.)
    - `color`: Optional color for visual identification
    - `spacing`: Optional value for spacing between grouped ports
- `components`: Array of component definitions within the module
- `component_loops`: Array of loop definitions for generating repetitive components
  - `iterator`: Name of the iterator variable to use in expressions
  - `range`: Array with [start, end] values (inclusive), can use parameter expressions
  - `components`: Array of component templates to instantiate for each iteration
  - Component templates can use `${iterator}` in IDs and `${expression}` for dynamic values
- `outputMappings`: Maps module output ports to internal component outputs
  - Can use parameter expressions like `${PARAM_NAME}` and conditional expressions
- `display`: Optional visual customization properties
  - `height`: Height of the module in grid units (default value determined by renderer)
  - `color`: Background/border color for the module (in HTML color format)
  - `label`: Custom display label that can include parameter values with `${PARAM_NAME}`
  - Note: Width is not configurable as it's determined by module latency (clock cycles)

The `outputMappings` field is a critical part of how modules expose their internal behavior to the outside world. Each key in this object corresponds to an output port name defined in the module's `outputs` array, and each value is a connection reference (typically to an internal component's output port). This creates the final signal path from internal components to the module's outputs.

## Component Types

All components follow a unified structure, where both primitives and modules are instantiated similarly. The distinction between them is determined by their definition.

### Component Instantiation

Components (both primitives and modules) are instantiated with this structure:

```json
{
  "id": "componentId",
  "type": "typeName",
  "label": "Optional Display Label",
  "parameters": {
    "DATA_WIDTH": 16,
    "CUSTOM_PARAM": "value"
  },
  "inputs": {
    "portName1": "sourceId.portName",
    "portName2": "$.inputName",
    "portName3[0]": "sourceId.portName[2]",
    "portName3[1]": "$.inputName[3]"
  }
}
```

- `id`: Unique identifier for the component within its module
- `type`: Component type, referencing either a primitive or module definition
- `parameters`: Optional object containing parameter values that override the defaults in the module/primitive definition
- `label`: Optional display label that overrides the default from the type definition
- `inputs`: Maps component input ports to sources (other components or module inputs)

### 1. Primitive Definitions

Primitives are defined in a central registry and have this structure:

```json
{
  "is_primitive": true,
  "inputs": [
    {"name": "in1", "size": 1},
    {"name": "in2", "size": 8}
  ],
  "outputs": [
    {"name": "out", "size": 1}
  ],
  "display": {
    "symbol": "+",
    "color": "#4CAF50",
    "shape": "circle"
  }
}
```

- `is_primitive`: Flag identifying this as a primitive (true for primitives)
- `inputs`: Array of input port definitions, each with a name and size
  - `name`: The port identifier
  - `size`: The port width (number of bits/elements, default 1 if omitted)
- `outputs`: Array of output port definitions, each with a name and size
- `display`: Visual representation properties

Supported primitive types include:
- `add`: Addition operation
- `mul`: Multiplication operation
- `relu2`: Squared ReLU activation function
- `clamp`: Range limiter
- `reg`: Register (for delay/pipeline stages)

### 2. Module Definitions

Modules are defined as shown in the Module Definition section and have these characteristics:

- Not marked with `is_primitive` (or explicitly set to false)
- Contain a `components` array with internal components
- Define `outputMappings` to connect internal components to module outputs

## Connection References

Connections in the schematic are created by assigning output port signals to input ports of components or by mapping internal component outputs to module outputs through the `outputMappings` field.

The format uses three types of connection references:

1. **Internal Component References**: `"componentId.portName"`
   - References an output port of another component within the same module
   - For example: `"adder1.out"`
   - Used when connecting one component's output to another component's input

2. **Module Input References**: `"$.inputName"`
   - References an input port of the current module using the "$." prefix
   - For example: `"$.bias"`
   - Used when connecting a module input to a component input

3. **Indexed Port References**: `"componentId.portName[index]"` or `"$.inputName[index]"`
   - References a specific element of a multi-bit port
   - For example: `"register1.out[3]"` or `"$.weights[2]"`
   - Valid indices range from 0 to (size-1)
   - Used when connecting individual bits from multi-bit signals

All connections flow from outputs to inputs. Module outputs are defined by mapping internal component outputs through the `outputMappings` field.

## Automatic Layout

The position of components is automatically determined by these rules:

1. **Clock Cycle (Horizontal Position)**:
   - Input primitives are always placed in cycle 0
   - For other primitives, the cycle is calculated as (maximum input cycle + 1)
   - Module components follow the same cycle calculation rule
   - Module width is always determined by its latency (number of clock cycles from input to output)

2. **Row (Vertical Position)**:
   - Input primitives are positioned sequentially
   - Processing primitives and modules are positioned near the average Y-position of their inputs
   - Modules are given more vertical space for readability

3. **Component Dimensions**:
   - Primitive components use standard sizes based on their type
   - Module width is determined by the pipeline latency (not user-configurable)
   - Module height can be specified via `display.height` for better port spacing
   - When height is not specified, it's automatically calculated based on:
     - Number of input and output ports
     - Readability requirements for the label

4. **Module Compression Mode**:
   - The viewer supports a global toggle for "Full" or "Compressed" module display
   - In "Full" mode, modules occupy their full clock cycle width (default)
   - In "Compressed" mode, modules are displayed with minimal width while preserving proper cycle alignment
   - Modules are only compressed when doing so won't disrupt timing relationships or cycle alignment
   - Parallel modules with matching latency can be compressed together
   - The compression mode only affects the current active module's view

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
  "primitiveDefinitions": {
    "add": {
      "is_primitive": true,
      "inputs": [
        {"name": "in1", "size": 1},
        {"name": "in2", "size": 1}
      ],
      "outputs": [
        {"name": "out", "size": 1}
      ],
      "display": {
        "symbol": "+",
        "color": "#4CAF50",
        "shape": "circle"
      }
    },
    "mul": {
      "is_primitive": true,
      "inputs": [
        {"name": "in1", "size": 1},
        {"name": "in2", "size": 1}
      ],
      "outputs": [
        {"name": "out", "size": 1}
      ],
      "display": {
        "symbol": "×",
        "color": "#2196F3",
        "shape": "circle"
      }
    },
    "reg": {
      "is_primitive": true,
      "inputs": [
        {"name": "in", "size": 1}
      ],
      "outputs": [
        {"name": "out", "size": 1}
      ],
      "display": {
        "symbol": "D",
        "color": "#9C27B0",
        "shape": "rect"
      }
    },
    "bus_reg": {
      "is_primitive": true,
      "inputs": [
        {"name": "in", "size": 8}
      ],
      "outputs": [
        {"name": "out", "size": 8}
      ],
      "display": {
        "symbol": "D[8]",
        "color": "#9C27B0",
        "shape": "rect"
      }
    },
    "relu2": {
      "is_primitive": true,
      "inputs": [
        {"name": "in", "size": 1}
      ],
      "outputs": [
        {"name": "out", "size": 1}
      ],
      "display": {
        "symbol": "ReLU²",
        "color": "#FF9800",
        "shape": "rect"
      }
    },
    "clamp": {
      "is_primitive": true,
      "inputs": [
        {"name": "in", "size": 1}
      ],
      "outputs": [
        {"name": "out", "size": 1}
      ],
      "display": {
        "symbol": "◊",
        "color": "#F44336",
        "shape": "diamond"
      }
    }
  },
  "moduleDefinitions": {
    "macBlock": {
      "is_primitive": false,
      "inputs": [
        {"name": "x0", "size": 1},
        {"name": "w0", "size": 1},
        {"name": "x1", "size": 1},
        {"name": "w1", "size": 1}
      ],
      "outputs": [
        {"name": "out", "size": 1}
      ],
      "display": {
        "height": 2,
        "color": "#7986CB",
        "label": "MAC"
      },
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
      "is_primitive": false,
      "inputs": [
        {"name": "x0", "size": 1},
        {"name": "w0", "size": 1},
        {"name": "x1", "size": 1},
        {"name": "w1", "size": 1},
        {"name": "bias", "size": 1},
        {"name": "scale", "size": 1}
      ],
      "outputs": [
        {"name": "out", "size": 1}
      ],
      "components": [
        {
          "id": "macBlock1",
          "type": "macBlock",
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
7. **Unified Component Model**: Primitives and modules share a common instantiation interface
8. **Extensible Primitive System**: Primitives are defined in the same format as modules
9. **Multi-bit Port Support**: Ports can have sizes greater than 1 and be indexed into with array notation
10. **Structured Port Definitions**: Port definitions include metadata like size for enhanced visualization
11. **Visual Customization**: Both primitives and modules support display properties for visual styling
12. **Automatic Width Calculation**: Module width is determined by its latency for accurate timing visualization
13. **Height Control**: Modules can specify height in grid units for better port spacing
14. **Compression Mode**: A global view option to display modules with minimal width while preserving cycle alignment
15. **Parameterized Definitions**: Modules and primitives support parameters that can be referenced in sizes and labels
16. **Parameter Substitution**: Use `${PARAM_NAME}` syntax to access parameter values in various fields
17. **Port Grouping**: Related ports can be grouped for layout coordination
18. **Custom Port Arrangements**: Specify how grouped ports should be arranged (interleaved, sequential, etc.)
19. **Component Loops**: Generate repetitive components using loop constructs with iterators
20. **Dynamic Expressions**: Use JavaScript-like expressions for conditional component generation and connections
21. **Parameterized Structure**: Module structure can adapt based on parameter values

## Implementation Notes

When implementing the v2 format:

1. **Component Registry**: All module and primitive definitions should be stored in central registries
2. **Primitive Loading**: Load primitive definitions at startup from a system file or embed them in the code
3. **Expanded Views**: When expanding a module, render its components in a new view
4. **Navigation State**: Maintain a breadcrumb or history stack for module navigation
5. **Scope Isolation**: Each module's component IDs are scoped to that module
6. **Dynamic Layout**: Update layout when navigating between modules
7. **Connection Resolution**: Translate `$.inputName` references to actual connections when rendering
8. **Unified Rendering**: Handle both primitives and modules with shared rendering logic
9. **Multi-bit Port Rendering**: For ports with size > 1, consider:
   - Visual indication of width (thicker lines, bus notation)
   - Special handling for indexed connections
   - Connection bundling for related signals
10. **Parameter Resolution**: Implement parameter substitution with these rules:
   - Replace `${PARAM_NAME}` patterns with actual values from parameters object
   - Component instance parameters override module definition parameters
   - Parent module parameters can be referenced in child module instantiations
   - Provide clear errors for undefined parameter references
11. **Port Group Arrangement**: Implement different arrangement algorithms:
   - Interleaved: Alternate ports from the group (A, B, A, B, ...)
   - Sequential: Group similar ports together (A, A, A, B, B, B, ...)
   - Alternating: Other patterns like (A, B, B, A, A, B, ...)
12. **Expression Evaluation**: Implement a safe expression evaluator for `${...}` expressions:
   - Support basic arithmetic operations (+, -, *, /, %)
   - Support comparison operators (==, !=, <, >, <=, >=)
   - Support conditional expressions (condition ? trueValue : falseValue)
   - Support string concatenation for building IDs and references
   - Provide access to loop iterator variables
   - Implement proper error handling for malformed expressions
13. **Component Loop Processing**: When processing component loops:
   - Generate actual component definitions for each iteration
   - Apply parameter and iterator substitutions
   - Validate that generated component IDs are unique
   - Ensure all references are resolvable

### Example of Port Indexing

For a multi-bit register primitive with bus inputs/outputs:

```json
{
  "id": "weights_reg",
  "type": "bus_reg",
  "inputs": {
    "in": "$.weights"
  }
}
```

And individual bit access:

```json
{
  "id": "mul0",
  "type": "mul",
  "inputs": {
    "in1": "weights_reg.out[0]",
    "in2": "$.x[0]"
  }
}
```

### Example of Component Loops

For repetitive structures like delay chains, you can use component loops:

```json
{
  "is_primitive": false,
  "parameters": {
    "DELAY": 5,
    "WIDTH": 1
  },
  "inputs": [
    {"name": "in", "size": "${WIDTH}"}
  ],
  "outputs": [
    {"name": "out", "size": "${WIDTH}"}
  ],
  "component_loops": [
    {
      "iterator": "i",
      "range": [0, "${DELAY-1}"],
      "components": [
        {
          "id": "reg_${i}",
          "type": "reg",
          "inputs": {
            "in": "${i == 0 ? '$.in' : 'reg_' + (i-1) + '.out'}"
          }
        }
      ]
    }
  ],
  "outputMappings": {
    "out": "${DELAY > 0 ? 'reg_' + (DELAY-1) + '.out' : '$.in'}"
  }
}
```

This example creates a configurable delay chain with:
- Parameter-controlled number of registers (`DELAY`)
- Dynamic connection between stages
- Conditional output mapping depending on delay value