# NNCircuit V2 Testing Methodology

## Overview

This document outlines the testing approach for NNCircuit V2, focusing on how to ensure code quality, functionality, and visual correctness of the circuit visualization tool. The testing strategy will rely on Node.js-based tools to enable server-less development while maintaining high standards for code quality.

## Goals

- Ensure functional correctness of all components
- Validate visual rendering of circuit diagrams
- Support test-driven development workflow
- Enable continuous integration for automatic testing
- Maintain high test coverage for core functionality

## Testing Tools

### Unit Testing

**Jest** will be used for unit testing:
- Fast execution for rapid development cycles
- Built-in mocking capabilities for isolating components
- Support for snapshot testing of rendered output
- Excellent integration with JavaScript modules

### Integration Testing

**Cypress** will be used for integration testing:
- Headless browser testing for full rendering validation
- Realistic user interaction simulation (clicks, panning, zooming)
- Visual regression testing capabilities
- Detailed reporting and debugging tools

### Schema Validation

**Ajv** will be used for JSON schema validation:
- Validate diagram format against specified schema
- Provide clear error messages for format violations
- Enable runtime validation of user-provided diagrams

## Test Categories

### 1. Core Logic Tests

Tests for the internal processing engines:

- **Parameter Substitution Engine**
  - Test parameter resolution with various syntaxes
  - Verify handling of nested parameters
  - Validate error handling for undefined parameters

- **Expression Evaluation**
  - Test arithmetic operations (+, -, *, /, %)
  - Verify comparison operations (==, !=, <, >, <=, >=)
  - Validate conditional expressions (ternary operator)
  - Test string operations for dynamic ID generation

- **Component Registry**
  - Verify registration of primitives and modules
  - Test lookup by type name
  - Validate handling of duplicate definitions

### 2. Component Generation Tests

Tests for component instantiation and processing:

- **Primitive Component Creation**
  - Verify creation with different parameters
  - Test input/output mapping
  - Validate display properties

- **Module Instantiation**
  - Test module creation with parameter overrides
  - Verify internal component creation
  - Validate output mappings

- **Component Loop Expansion**
  - Test iterator-based component generation
  - Verify dynamic ID generation
  - Validate connection expressions with iterators

### 3. Layout and Rendering Tests

Tests for the visual representation:

- **Layout Calculation**
  - Test grid positioning algorithm
  - Verify component placement by clock cycle
  - Validate vertical positioning logic

- **Connection Routing**
  - Test path generation between components
  - Verify handling of complex connection patterns
  - Validate signal direction indicators

- **Visual Elements**
  - Test primitive shapes and symbols
  - Verify module boundaries and labels
  - Validate port grouping visualization

### 4. User Interface Tests

Tests for user interaction:

- **Module Navigation**
  - Test drill-down into module functionality
  - Verify return to parent module
  - Validate breadcrumb navigation

- **Zoom and Pan**
  - Test zoom controls and behavior
  - Verify panning functionality
  - Validate viewport constraints

- **Compression Mode**
  - Test toggle between full and compressed views
  - Verify layout adjustments in compressed mode
  - Validate preservation of timing relationships

## Test Implementation

### Unit Test Structure

Unit tests will follow this pattern:

```javascript
describe('Component Registry', () => {
  beforeEach(() => {
    // Setup test environment
  });

  test('should register a primitive component', () => {
    // Test implementation
    const registry = new ComponentRegistry();
    registry.registerPrimitive('add', addDefinition);
    
    // Assertion
    expect(registry.getPrimitive('add')).toEqual(addDefinition);
  });

  // More tests...
});
```

### Integration Test Structure

Integration tests will validate end-to-end functionality:

```javascript
describe('Diagram Rendering', () => {
  beforeEach(() => {
    cy.visit('/index.html');
  });

  it('should render the main diagram correctly', () => {
    cy.get('#diagram-container svg').should('exist');
    cy.get('.module').should('have.length.above', 0);
    cy.get('.primitive').should('have.length.above', 0);
  });

  // More tests...
});
```

### Visual Regression Testing

For visual correctness, we'll implement snapshot testing:

```javascript
test('should render MAC block correctly', () => {
  // Render the component
  const { container } = render(<DiagramRenderer diagram={macBlockDiagram} />);
  
  // Take a snapshot of the rendered output
  expect(container).toMatchSnapshot();
});
```

## Test Fixtures

### Sample Diagrams

Create a set of test diagrams with known properties:

- **Minimal Diagram**: Basic diagram with minimal components
- **Comprehensive Diagram**: Complex diagram using all features
- **Edge Cases**: Diagrams testing boundary conditions
- **Error Cases**: Diagrams with deliberate errors for validation

### Mock Components

Create mock implementations for isolated testing:

- **Mock Renderer**: For testing layout without D3.js dependency
- **Mock Parameter Context**: For testing expression evaluation
- **Mock Navigation Stack**: For testing module navigation

## Test Environment Setup

### Development Environment

```
npm init
npm install --save-dev jest cypress webpack webpack-cli babel-jest @babel/core @babel/preset-env
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/mocks/styleMock.js',
    '\\.svg$': '<rootDir>/test/mocks/svgMock.js'
  },
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/vendor/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
};
```

### Cypress Configuration

```javascript
// cypress.json
{
  "baseUrl": "http://localhost:3000",
  "viewportWidth": 1200,
  "viewportHeight": 800,
  "video": false,
  "screenshotOnRunFailure": true,
  "integrationFolder": "test/e2e"
}
```

## Development Workflow

### Test-Driven Development Cycle

1. Write a failing test for a new feature
2. Implement the feature to make the test pass
3. Refactor the code while maintaining test passing status
4. Repeat for each feature component

### Continuous Integration

Setup GitHub Actions to run tests automatically:

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v1
      with:
        node-version: '16.x'
    - run: npm ci
    - run: npm test
    - run: npm run test:e2e
```

## Test Documentation

### Test Coverage Reports

Generate coverage reports to identify untested code:

```
npm test -- --coverage
```

### Visual Regression Reports

Generate visual difference reports for failed visual tests:

```
npm run test:visual
```

## Example Test Cases

### Parameter Substitution Test

```javascript
test('should substitute parameters in expressions', () => {
  const params = { WIDTH: 8, DEPTH: 4 };
  const expression = 'Signal[${WIDTH}:${DEPTH}]';
  
  const result = substituteParameters(expression, params);
  
  expect(result).toBe('Signal[8:4]');
});
```

### Component Loop Test

```javascript
test('should expand component loop correctly', () => {
  const loop = {
    iterator: 'i',
    range: [0, 2],
    components: [{
      id: 'reg_${i}',
      type: 'reg',
      inputs: {
        in: '${i == 0 ? "$.input" : "reg_" + (i-1) + ".out"}'
      }
    }]
  };
  
  const result = expandComponentLoop(loop, {});
  
  expect(result).toHaveLength(3);
  expect(result[0].id).toBe('reg_0');
  expect(result[0].inputs.in).toBe('$.input');
  expect(result[1].id).toBe('reg_1');
  expect(result[1].inputs.in).toBe('reg_0.out');
});
```

### Layout Test

```javascript
test('should calculate correct clock cycle for components', () => {
  const components = [
    { id: 'input', type: 'input', cyclePosition: 0 },
    { id: 'reg1', type: 'reg', inputs: { in: 'input.out' } },
    { id: 'add', type: 'add', inputs: { in1: 'reg1.out', in2: 'input.out' } }
  ];
  
  calculateLayout(components);
  
  expect(components[1].cyclePosition).toBe(1);
  expect(components[2].cyclePosition).toBe(2);
});
```

## Conclusion

This testing methodology provides a comprehensive approach to ensuring the quality and correctness of the NNCircuit V2 implementation. By combining unit tests, integration tests, and visual testing, we can have confidence in both the functionality and appearance of the circuit diagrams.