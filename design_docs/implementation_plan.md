# SchematicViewer Implementation Plan

## Phase 1: Foundation (Week 1)

### Setup & Structure
- [x] Create basic project structure
- [x] Initialize HTML, CSS, and JavaScript files
- [x] Set up D3.js integration
- [x] Create sample JSON netlist format
- [x] Create diagram format documentation

### Core Rendering
- [x] Implement basic SVG canvas
- [x] Create node rendering logic for different component types
- [x] Implement connection rendering with directional arrows
- [x] Create basic styling for schematic elements
- [x] Add file loading functionality for diagram.json

### Phase 1 Enhancements
- [x] Add input/output ports to nodes
- [x] Implement drag and drop for JSON file loading
- [x] Make the file load controls collapsible/minimizable
- [x] Improve text label rendering and positioning
- [x] Fix connection endpoints to connect to node ports

## Phase 2: Interactivity (Week 2)

### User Interaction
- [x] Implement zoom and pan functionality using d3.zoom()
- [x] Add hover states for nodes and connections
- [x] Create basic node selection capability
- [x] Implement grid system with clock cycle alignment

### JSON Format & Parser
- [x] Create simplified JSON format with automatic positioning
- [x] Design module-based hierarchical structure in JSON format
- [x] Implement parser to convert JSON into renderable objects
- [x] Add validation to ensure netlist integrity
- [x] Handle error cases gracefully

### Hierarchical Design
- [x] Update the node model to primitives with clock cycle properties
- [x] Implement clock cycle-based columnar alignment
- [x] Add support for relative positioning between primitives
- [x] Implement simplified diagram format with automatic positioning
- [x] Implement input row-based and output dependency-based positioning

## Phase 3: Advanced Features (Week 3)

### Primitive Types & Styling
- [ ] Complete implementation of all required primitive types
- [ ] Add distinct visual styling for each primitive type
- [ ] Implement proper text labeling for components
- [ ] Optimize rendering for performance

### Hierarchical Structure - Modules
- [ ] Implement module rendering
- [ ] Create expand/collapse functionality for modules
- [ ] Define standard module types
- [ ] Add visual indicators for expandable modules

### Enhancements
- [ ] Implement primitive inspection on click
- [ ] Enhance tooltips with component details
- [ ] Create basic export functionality (SVG/PNG)
- [ ] Optimize automatic layout algorithm for complex diagrams

## Phase 4: Refinement (Week 4)

### Hierarchical Structure - Layers
- [ ] Implement layer-level visualization
- [ ] Add navigation between hierarchy levels
- [ ] Create minimap for context in large diagrams
- [ ] Implement breadcrumb navigation

### Testing & Optimization
- [ ] Test with various netlist complexity levels
- [ ] Optimize rendering for larger diagrams
- [ ] Ensure browser compatibility
- [ ] Performance profiling and optimization

### Documentation & Examples
- [x] Create documentation for simplified diagram format
- [x] Document hierarchical JSON schema with modules
- [ ] Provide example netlists at various hierarchy levels
- [ ] Add usage instructions for navigation and interaction
- [ ] Prepare README and contributing guidelines

## Phase 5: Advanced Hierarchy (Future)

### Network-Level Features
- [ ] Implement network-level visualization
- [ ] Add support for collapsible network sections
- [ ] Create summary views of complex sections
- [ ] Implement search across hierarchy levels

### Layout Algorithms
- [ ] Automatic layout of complex hierarchies
- [ ] Intelligent positioning of components
- [ ] Optimize spacing and connections
- [ ] Add manual override capabilities

## Implementation Details

### Simplified JSON Structure
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
    "id": "mul1",
    "type": "mul",
    "inputs": {
      "in1": "x0.out",
      "in2": "w0.out"
    }
  },
  {
    "id": "bias",
    "type": "input",
    "label": "bias"
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
    "id": "output1",
    "type": "output",
    "label": "y",
    "inputs": { "in": "add1.out" }
  }
]
```

### Core Rendering Functions
1. `parseNetlist(json)` - Process JSON into internal representation
2. `renderPrimitives(primitives)` - Create SVG elements for primitives
3. `renderConnections(connections)` - Draw paths between primitives
4. `calculateClockCyclePosition(primitive)` - Position primitives based on clock cycles
5. `setupInteractions()` - Configure zoom, pan, grid, and selection handlers

### Browser Compatibility
- Target modern browsers: Chrome, Firefox, Safari, Edge
- Use ES6+ features with appropriate polyfills if needed
- Ensure responsive design for different screen sizes