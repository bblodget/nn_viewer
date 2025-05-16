# NNCircuit V2 Unified Component Model

## Overview

This document describes the unified component model for NNCircuit V2, which treats primitives and modules as the same type of entity with different visualization behaviors. This approach simplifies the architecture, promotes code reuse, and aligns with the hierarchical nature of circuit design.

## Unified Component Principles

1. **Common Base Structure**
   - All components (primitives and modules) share the same base structure
   - Components are distinguished by the `is_primitive` flag
   - Unified interface for instantiation, parameters, inputs, and outputs

2. **Component Registry**
   - Single registry for all component types (`componentDefinitions`)
   - Built-in system components loaded automatically at startup
   - Support for loading multiple JSON files to extend the component library

3. **View Modes**
   - **Symbol View**: All components have a symbol representation
   - **Internal View**: Only non-primitive components (modules) can be expanded to show internal structure
   - Components with `is_primitive = true` cannot be selected as the active module

4. **Parameter System**
   - Unified parameter system for all components
   - Parameter substitution using `${PARAM_NAME}` syntax
   - Parameter inheritance from parent to child modules with clear precedence rules

## Component Structure

```javascript
{
  "id": "componentTypeId",
  "is_primitive": true/false, // Determines if component can be expanded
  "parameters": {
    "PARAM1": defaultValue1,
    "PARAM2": defaultValue2
    // ...
  },
  "inputs": [
    {"name": "inputName1", "size": 1},
    {"name": "inputName2", "size": "${DATA_WIDTH}"}
    // ...
  ],
  "outputs": [
    {"name": "outputName1", "size": 1},
    {"name": "outputName2", "size": "${OUTPUT_WIDTH}"}
    // ...
  ],
  "latency": 1, // Fixed for primitives, calculated for modules
  "display": {
    "symbol": "+", // For primitives
    "shape": "circle", // For primitives
    "color": "#4CAF50",
    "label": "CustomLabel"
  },
  
  // For non-primitives only:
  "components": [
    // Internal component instances
  ],
  "component_loops": [
    // Dynamic component generation
  ],
  "outputMappings": {
    // Maps internal component outputs to module outputs
  },
  "port_groups": {
    // Port grouping information
  }
}
```

## Latency System

A key aspect of the unified model is the latency calculation system:

1. **Universal Method**
   - All components have a `get_latency()` method
   - Used for layout calculation and clock cycle allocation

2. **Primitive Components**
   - Return their fixed `latency` property (default: 1)
   - Special cases:
     - Input/output primitives: latency = 0
     - Register primitives: latency = 1

3. **Module Components**
   - Calculate critical path through internal components
   - Formula: max(longest path from any input to any output)
   - Calculation takes into account:
     - Individual component latencies
     - Connection dependencies
     - Parallel paths

4. **Caching Strategy**
   - Module latency is calculated once and cached
   - Cache invalidation when internal components change
   - Performance optimization for complex hierarchies

## Implementation Details

### Component Class

The unified Component class will implement:

```javascript
class Component {
  constructor(id, definition, parameters = {}) {
    this.id = id;
    this.definition = definition;
    this.isPrimitive = definition.is_primitive === true;
    this.parameters = { ...definition.parameters, ...parameters };
    // ...
  }
  
  // Get component latency (fixed for primitives, calculated for modules)
  getLatency() {
    if (this.isPrimitive) {
      return this.definition.latency || 1;
    }
    
    // For modules: calculate if not cached
    if (this.cachedLatency === undefined) {
      this.cachedLatency = this.calculateCriticalPathLatency();
    }
    
    return this.cachedLatency;
  }
  
  // Calculate critical path latency through the module
  calculateCriticalPathLatency() {
    // Implementation details
    // Finds the longest path from any input to any output
    // ...
  }
  
  // Other methods...
}
```

### Component Registry

The unified ComponentRegistry will manage all component types:

```javascript
class ComponentRegistry {
  constructor() {
    this.definitions = new Map();
    this.loadBuiltInDefinitions();
  }
  
  // Register a component (primitive or module)
  register(type, definition) {
    this.definitions.set(type, definition);
    return this;
  }
  
  // Check if a component exists
  has(type) {
    return this.definitions.has(type);
  }
  
  // Get a component definition
  get(type) {
    return this.definitions.get(type);
  }
  
  // Check if a component is a primitive
  isPrimitive(type) {
    const def = this.get(type);
    return def && def.is_primitive === true;
  }
  
  // Load built-in system components
  loadBuiltInDefinitions() {
    // Load primitives and basic modules
    // ...
  }
  
  // Load component definitions from a JSON file
  loadFromJson(json) {
    // Process and register components from JSON
    // ...
  }
}
```

## JSON Format

The JSON format for diagram files includes:

```json
{
  "entryPointModule": "moduleName",
  "settings": {
    // Optional diagram-wide settings 
    // (see diagram_settings.md for details)
  },
  "componentDefinitions": {
    "add": {
      "is_primitive": true,
      "inputs": [
        {"name": "in1", "size": 1},
        {"name": "in2", "size": 1}
      ],
      "outputs": [
        {"name": "out", "size": 1}
      ],
      "latency": 1,
      "display": {
        "symbol": "+",
        "color": "#4CAF50",
        "shape": "circle"
      }
    },
    "macBlock": {
      "is_primitive": false,
      "parameters": {
        "PAIRS": 2
      },
      "inputs": [
        {"name": "x0", "size": 1},
        {"name": "w0", "size": 1}
      ],
      "outputs": [
        {"name": "out", "size": 1}
      ],
      "components": [
        // ...
      ],
      "outputMappings": {
        // ...
      }
    }
    // ...
  }
}
```

## Component Sizing and Positioning

Components are sized and positioned according to the grid system:

1. **Grid Units**: All component dimensions are specified in grid units
2. **Clock Cycle Positioning**: Components are positioned horizontally based on clock cycle
3. **Row Positioning**: Components are positioned vertically based on signal flow
4. **Padding**: Components have configurable padding within their grid cells

### Size Calculations

Component sizes are calculated based on grid settings:

```javascript
// Width in pixels = width * settings.grid.horizontalSpacing * (1 - 2 * settings.components.padding)
// Height in pixels = height * settings.grid.verticalSpacing * (1 - 2 * settings.components.padding)
```

### Position Calculations

Component positions are calculated based on their grid coordinates:

```javascript
// X position = (clock_cycle * settings.grid.horizontalSpacing) + (settings.grid.horizontalSpacing * settings.components.padding)
// Y position = (row * settings.grid.verticalSpacing) + (settings.grid.verticalSpacing * settings.components.padding)
```

## Benefits of Unified Approach

1. **Simplified Architecture**
   - Reduces codebase complexity with unified processing
   - Eliminates duplicate code paths for primitives vs. modules

2. **Consistent Interface**
   - Common mechanism for instantiation and parameters
   - Uniform port definition and connection handling

3. **Extensibility**
   - Easy to add new component types
   - Supports creation of library components

4. **Hierarchical Flexibility**
   - Natural representation of nested circuit structure
   - Clear boundary between visualization levels

## Implementation Strategy

1. **Build Core Component Class**
   - Implement unified Component class supporting both primitives and modules
   - Add latency calculation with caching for performance

2. **Enhance Registry System**
   - Create unified registry for all component types
   - Support loading from multiple sources (system defaults, user files)

3. **Develop Rendering System**
   - Symbol view for all components
   - Expandable view for modules
   - Clear visual distinction between primitives and modules

4. **Create Module Navigation**
   - Drill-down capability for modules
   - Navigation breadcrumbs for hierarchy traversal
   - Context awareness for current active module