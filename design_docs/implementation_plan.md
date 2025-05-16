# NNCircuit V2 Implementation Plan

## Overview

This document outlines the implementation strategy for NNCircuit V2, a complete rewrite of the visualization engine to support the enhanced diagram format specification. The implementation will be structured in phases, with each phase building on the previous one to create a robust, feature-complete neural network circuit visualization tool.

## Technology Stack

- **Frontend**: Pure JavaScript, HTML5, CSS
- **Visualization**: D3.js for SVG rendering
- **Testing**: Jest for unit tests, Cypress for integration tests
- **Development**: Node.js for test running and build tools
- **Hosting**: GitHub Pages (completely client-side)

## Project Structure

```
/
├── index.html           # Main application entry point
├── css/
│   └── styles.css       # Application styling
├── src/
│   ├── core/            # Core functionality
│   │   ├── registry.js  # Unified component registry
│   │   ├── parser.js    # JSON parser and validator
│   │   ├── expressions.js # Parameter and expression evaluation
│   │   ├── component.js # Unified component class
│   │   └── layout.js    # Layout calculation engine
│   ├── renderer/        # Rendering functionality
│   │   ├── svg.js       # SVG rendering utilities
│   │   ├── grid.js      # Grid layout renderer
│   │   └── connections.js # Connection path generation
│   ├── ui/              # User interface components
│   │   ├── navigation.js # Module navigation controls
│   │   ├── controls.js  # UI controls (zoom, compression toggle)
│   │   └── inspector.js # Component inspection interface
│   └── viewer.js        # Main application entry point
├── test/
│   ├── unit/            # Unit tests
│   │   ├── core/        # Tests for core functionality
│   │   ├── components/  # Tests for component implementation
│   │   └── renderer/    # Tests for rendering functionality
│   ├── integration/     # Integration tests
│   │   └── viewer.test.js # End-to-end test of viewer functionality
│   └── validate-diagram.js # JSON schema validator
└── json/               # Example diagram definitions
    ├── primitives.json # Built-in primitive definitions
    ├── mac_block.json  # MAC block example
    └── ...             # Other examples
```

## Implementation Phases

### Phase 1: Core Architecture

1. **Unified Component System**
   - [x] Implement unified component registry for both primitives and modules
   - [x] Create registration and lookup mechanisms
   - [ ] Support component loading from multiple JSON sources

2. **Parameter and Expression Engine**
   - [x] Create expression parser and evaluator
   - [x] Implement parameter substitution (`${PARAM_NAME}` syntax)
   - [x] Support conditional expressions and arithmetic operations
   - [ ] Implement parameter inheritance from parent to child modules

3. **JSON Parser and Validator**
   - [x] Develop schema validation for unified component format
   - [x] Implement error reporting for invalid diagrams
   - [x] Create parsing utilities for component relationships

4. **Component Base Class**
   - [x] Design unified component class for primitives and modules
   - [x] Implement component instantiation with parameter resolution
   - [x] Create universal latency calculation system with caching
   - [x] Implement connection and port management

5. **Fundamental Rendering**
   - [x] Basic SVG setup with D3.js
   - [ ] Implement symbol view for all components
   - [ ] Create module internal view rendering
   - [x] Setup initial rendering context and viewbox

### Phase 2: Advanced Features

1. **Port Groups and Arrangement**
   - [x] Implement port grouping system
   - [x] Create arrangement algorithms (interleaved, sequential, alternating)
   - [ ] Add visual distinction for port groups

2. **Component Loop Processing**
   - [ ] Develop iterator-based component generation
   - [ ] Support dynamic ID generation with iterator substitution
   - [ ] Implement range evaluation with parameter references

3. **Multi-bit Signal Support**
   - [ ] Implement port sizing with parameter expressions
   - [ ] Create indexed port reference resolution
   - [ ] Add visual representation for multi-bit signals

4. **Module Navigation System**
   - [x] Design navigation stack for module hierarchy
   - [ ] Implement drill-down on component click for non-primitives
   - [x] Add breadcrumb navigation to return to parent modules

### Phase 3: Layout and Visualization

1. **Automatic Layout Engine**
   - [x] Implement grid-based positioning system
   - [x] Calculate component positions based on clock cycle
   - [x] Determine vertical positioning for signal flow

2. **Clock Cycle Visualization**
   - [x] Add clock cycle grid display
   - [ ] Implement component positioning based on latency
   - [ ] Create latency calculation for complex modules

3. **Connection Path Generation**
   - [ ] Generate path coordinates for connections
   - [ ] Implement routing algorithm for clean signal paths
   - [ ] Add signal direction indicators and labels

4. **Module Compression Mode**
   - [x] Implement compression toggle functionality
   - [x] Create compressed layout algorithm
   - [ ] Preserve timing relationships in compressed view

5. **Visual Customization**
   - [ ] Apply color themes from component definitions
   - [ ] Implement custom shapes and symbols
   - [ ] Support custom labels with parameter substitution

### Phase 4: User Interface

1. **Zoom and Pan Controls**
   - [x] Implement D3.js zoom behavior
   - [x] Create zoom controls UI
   - [x] Add pan gesture support

2. **Module Navigation Interface**
   - [x] Add breadcrumb navigation UI
   - [x] Implement module history stack
   - [ ] Create transition animations between module views

3. **Compression Toggle Controls**
   - [x] Add compression mode toggle UI
   - [x] Implement view state management
   - [ ] Support persistance of view preferences

4. **Component Inspection**
   - [ ] Add hover information for components
   - [x] Implement click-to-inspect behavior
   - [ ] Display component parameters and metadata

## Testing Strategy

### Unit Testing

Unit tests will target individual functions and components to ensure they work correctly in isolation:

1. **Core Functionality Tests**
   - [ ] Test unified component system
   - [ ] Validate expression evaluation
   - [ ] Verify component registration and lookup
   - [ ] Test latency calculation for both primitives and modules

2. **Component Creation Tests**
   - [ ] Test component instantiation with parameters
   - [ ] Verify parameter inheritance
   - [ ] Validate component loop expansion

3. **Layout Calculation Tests**
   - [ ] Test grid positioning algorithm
   - [ ] Verify clock cycle calculation
   - [ ] Validate connection path generation

### Integration Testing

Integration tests will verify that components work together correctly:

1. **Rendering Pipeline Tests**
   - [ ] Test end-to-end diagram loading and rendering
   - [ ] Validate module navigation
   - [ ] Verify compression mode toggling

2. **User Interaction Tests**
   - [ ] Test zoom and pan functionality
   - [ ] Verify module drill-down and navigation
   - [ ] Validate component inspection

### Visual Testing

Visual regression tests will ensure that rendering is consistent:

1. **Snapshot Testing**
   - [ ] Capture rendered SVG snapshots
   - [ ] Compare against reference images
   - [ ] Detect unexpected visual changes

2. **Example Diagram Tests**
   - [ ] Verify rendering of example diagrams
   - [ ] Ensure correct visual representation
   - [ ] Validate clock cycle grid rendering

## Development Workflow

The development workflow will follow a test-driven approach:

1. Write tests for a specific feature
2. Implement the feature to pass the tests
3. Refactor the code as needed while maintaining test coverage
4. Document the feature and update examples

## Performance Considerations

To ensure good performance, even with complex diagrams:

1. **Lazy Rendering**
   - [x] Only render the current module view
   - [ ] Load child modules on demand when expanding

2. **Efficient DOM Management**
   - [ ] Reuse SVG elements where possible
   - [ ] Use D3.js update pattern for efficient DOM updates

3. **Caching**
   - [x] Cache compiled expressions and parameter substitutions
   - [x] Cache module latency calculations
   - [ ] Store calculated layouts to avoid redundant calculations

## Progress Tracking

- [x] Set up the project structure and initialize dependencies
- [x] Create the testing environment
- [x] Set up basic application framework
- [x] Implement HTML and CSS skeleton
- [x] Define unified component model architecture
- [x] Complete Phase 1 core architecture components
- [ ] Develop simple diagram rendering to validate the approach

## Open Questions

1. Should we evaluate expressions at load time or runtime?
   - Load time evaluation is more efficient but less flexible
   - Runtime evaluation allows for dynamic parameter updates
   - **Decision**: We are implementing evaluation at load time with caching for efficiency, with provision for runtime updates if needed later.

2. How should we handle errors in expression evaluation?
   - Provide clear error messages with context
   - Consider fallback values for non-critical expressions
   - **Decision**: We've implemented error logging with fallbacks to original expressions.

3. Should we implement parameter scope inheritance?
   - Allow child modules to access parent module parameters
   - Define clear precedence rules for parameter resolution
   - **Decision**: Yes, we will support parameter inheritance with clear scoping rules.

4. What is the best approach for testing the visual output?
   - Consider screenshot-based comparison testing
   - Implement structural testing of the generated SVG
   - **Decision**: We'll use Cypress with image snapshot plugin for visual regression testing.