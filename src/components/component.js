/**
 * Component.js
 * Unified component model for NNCircuit v2
 * 
 * This file implements the unified Component class which is the core building block
 * for all circuit elements, treating both primitives and modules with a common interface.
 */

import { ExpressionEvaluator } from '../core/expressions';

/**
 * Component Class
 * Represents both primitive components and modules with a unified interface
 */
class Component {
  /**
   * Create a new component
   * @param {string} id - Unique identifier for this component instance
   * @param {Object} definition - Component type definition from registry
   * @param {Object} parameters - Parameter values for this instance (override defaults)
   * @param {Registry} registry - Registry of available component types
   * @param {Object} parent - Optional parent module (for parameter inheritance)
   */
  constructor(id, definition, parameters = {}, registry, parent = null) {
    this.id = id;
    this.definition = definition;
    this.registry = registry;
    this.parent = parent;
    
    // Core properties
    this.isPrimitive = definition.is_primitive === true;
    this.type = definition.id || null;
    this.label = definition.display?.label || id;
    
    // Merge parameters (instance overrides definition defaults)
    this.parameters = { 
      ...(definition.parameters || {}), 
      ...parameters 
    };
    
    // Process ports (inputs and outputs)
    this.inputs = this.processPortDefinitions(definition.inputs || []);
    this.outputs = this.processPortDefinitions(definition.outputs || []);
    
    // For modules: instantiate internal components
    this.components = [];
    this.connections = [];
    this.cachedLatency = undefined;
    
    // Only process internal components for non-primitives
    if (!this.isPrimitive && registry) {
      this.instantiateComponents(definition);
      this.processConnections(definition);
    }
    
    // Process display properties
    this.display = { ...definition.display };
  }
  
  /**
   * Process port definitions and apply parameter substitutions
   * @param {Array} portDefinitions - Array of port definitions from component definition
   * @returns {Array} - Processed port array with resolved sizes
   */
  processPortDefinitions(portDefinitions) {
    const evaluator = new ExpressionEvaluator();
    return portDefinitions.map(port => {
      // Create a new port object to avoid mutating the original
      const processedPort = { ...port };
      
      // If size contains a parameter reference, resolve it
      if (typeof port.size === 'string' && port.size.includes('${')) {
        processedPort.size = evaluator.evaluate(port.size, this.parameters, {});
      } else {
        processedPort.size = port.size || 1; // Default to 1 if not specified
      }
      
      return processedPort;
    });
  }
  
  /**
   * Instantiate internal components for module components
   * @param {Object} definition - Module definition from registry
   */
  instantiateComponents(definition) {
    // Process regular components if any
    if (Array.isArray(definition.components)) {
      for (const component of definition.components) {
        this.createComponentInstance(component);
      }
    }
    
    // Process component loops if any
    if (Array.isArray(definition.component_loops)) {
      this.processComponentLoops(definition.component_loops);
    }
  }
  
  /**
   * Create a component instance from a component definition
   * @param {Object} component - Component definition
   * @returns {Component} - The created component instance
   */
  createComponentInstance(component) {
    // Get component definition from registry
    const componentType = component.type;
    const componentDefinition = this.registry.getComponent(componentType);
    
    if (!componentDefinition) {
      throw new Error(`Component type "${componentType}" not found in registry`);
    }
    
    // Create component instance
    const componentInstance = new Component(
      component.id,
      componentDefinition,
      component.parameters || {},
      this.registry,
      this // Pass this module as parent
    );
    
    // Store the instance
    this.components.push(componentInstance);
    return componentInstance;
  }
  
  /**
   * Process component loops to generate repetitive components
   * @param {Array} loops - Component loop definitions
   */
  processComponentLoops(loops) {
    const evaluator = new ExpressionEvaluator();
    
    for (const loop of loops) {
      const iterator = loop.iterator;
      
      // Calculate range (can use parameters)
      let start = loop.range[0];
      let end = loop.range[1];
      
      if (typeof start === 'string') {
        start = evaluator.evaluate(start, this.parameters);
      }
      
      if (typeof end === 'string') {
        end = evaluator.evaluate(end, this.parameters);
      }
      
      // Iterate through range and create components
      for (let i = start; i <= end; i++) {
        // Create a context with the iterator value
        const context = {
          ...this.parameters,
          [iterator]: i
        };
        
        // Process each component template in the loop
        for (const template of loop.components) {
          // Process the component ID with iterator substitution
          const id = evaluator.evaluate(template.id, context);
          
          // Clone the template and update its ID
          const componentDef = { ...template, id };
          
          // Process other fields like inputs that might use the iterator
          if (componentDef.inputs) {
            componentDef.inputs = this.processLoopInputs(componentDef.inputs, context);
          }
          
          // Create the component instance
          this.createComponentInstance(componentDef);
        }
      }
    }
  }
  
  /**
   * Process inputs in a loop component to resolve iterator expressions
   * @param {Object} inputs - Component input definitions
   * @param {Object} context - Evaluation context with iterator value
   * @returns {Object} - Processed input definitions
   */
  processLoopInputs(inputs, context) {
    const evaluator = new ExpressionEvaluator();
    const processedInputs = {};
    
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string' && (value.includes('${') || value.includes(context.iterator))) {
        processedInputs[key] = evaluator.evaluate(value, this.parameters, context);
      } else {
        processedInputs[key] = value;
      }
    }
    
    return processedInputs;
  }
  
  /**
   * Process connections between components
   * @param {Object} definition - Module definition
   */
  processConnections(definition) {
    // Extract connections from component inputs
    this.components.forEach(component => {
      // Process each input of the component
      for (const input of component.inputs) {
        const inputName = input.name;
        const sourceRef = component.getInputSource(inputName);
        
        if (sourceRef) {
          // Format: "componentId.portName" or "$.inputName"
          this.addConnection(sourceRef, `${component.id}.${inputName}`);
        }
      }
    });
    
    // Process output mappings
    if (definition.outputMappings) {
      for (const [outputName, sourceRef] of Object.entries(definition.outputMappings)) {
        this.addConnection(sourceRef, `$.${outputName}`);
      }
    }
  }
  
  /**
   * Add a connection between components
   * @param {string} source - Source reference (componentId.portName or $.inputName)
   * @param {string} target - Target reference (componentId.portName or $.outputName)
   */
  addConnection(source, target) {
    this.connections.push({
      source,
      target
    });
  }
  
  /**
   * Get input source for the specified port
   * @param {string} portName - Name of the input port
   * @returns {string|null} - Source reference or null if not connected
   */
  getInputSource(portName) {
    // Check if this component has explicit input mapping
    if (this.definition.inputs && this.definition.inputs[portName]) {
      return this.definition.inputs[portName];
    }
    
    return null;
  }
  
  /**
   * Get the component's latency (fixed for primitives, calculated for modules)
   * @returns {number} - Component latency in clock cycles
   */
  getLatency() {
    // For primitives, return the predefined latency (default: 1)
    if (this.isPrimitive) {
      return this.definition.latency || 1;
    }
    
    // For modules: calculate if not cached
    if (this.cachedLatency === undefined) {
      this.cachedLatency = this.calculateCriticalPathLatency();
    }
    
    return this.cachedLatency;
  }
  
  /**
   * Calculate critical path latency through the module
   * @returns {number} - Latency in clock cycles
   */
  calculateCriticalPathLatency() {
    // If no components, latency is 0
    if (!this.components || this.components.length === 0) {
      return 0;
    }
    
    // Build a dependency graph of components
    const graph = this.buildDependencyGraph();
    
    // Find the maximum path length in the graph (critical path)
    let maxLatency = 0;
    
    // For each component
    for (const component of this.components) {
      const componentLatency = component.getLatency();
      const pathLatency = this.findLongestPath(graph, component.id) + componentLatency;
      
      if (pathLatency > maxLatency) {
        maxLatency = pathLatency;
      }
    }
    
    return maxLatency;
  }
  
  /**
   * Build a dependency graph from connections
   * @returns {Object} - Graph representation of dependencies
   */
  buildDependencyGraph() {
    const graph = {};
    
    // Initialize empty adjacency lists for all components
    for (const component of this.components) {
      graph[component.id] = [];
    }
    
    // Add module input nodes to graph
    for (const input of this.inputs) {
      graph[`$.${input.name}`] = [];
    }
    
    // Add edges for each connection
    for (const connection of this.connections) {
      // Parse source and target
      const sourceMatch = connection.source.match(/^(\$|\w+)\.(\w+)(?:\[\d+\])?$/);
      const targetMatch = connection.target.match(/^(\$|\w+)\.(\w+)(?:\[\d+\])?$/);
      
      if (sourceMatch && targetMatch) {
        const sourceId = sourceMatch[1];
        const targetId = targetMatch[1];
        
        // Skip module output connections for latency calculation
        if (targetId === '$') continue;
        
        // Add edge from source to target
        if (graph[sourceId] && graph[targetId]) {
          graph[sourceId].push(targetId);
        }
      }
    }
    
    return graph;
  }
  
  /**
   * Find the longest path from any input to a specific component
   * @param {Object} graph - Dependency graph
   * @param {string} targetId - Target component ID
   * @returns {number} - Length of longest path
   */
  findLongestPath(graph, targetId) {
    // TODO: Implement topological sort and longest path algorithm
    // This is a placeholder - actual implementation would use a proper graph algorithm
    // to find the longest path from any input to the target component
    
    return 0; // Placeholder
  }
  
  /**
   * Check if a component type is a primitive
   * @param {string} type - Component type
   * @returns {boolean} - True if primitive, false otherwise
   */
  isPrimitive(type) {
    return this.registry.isPrimitive(type);
  }
  
  /**
   * Get the list of internal components
   * @returns {Array} - List of component instances
   */
  getComponents() {
    return this.components;
  }
  
  /**
   * Get the list of connections
   * @returns {Array} - List of connections
   */
  getConnections() {
    return this.connections;
  }
  
  /**
   * Get input port by name
   * @param {string} name - Port name
   * @returns {Object|null} - Port object or null if not found
   */
  getInputPort(name) {
    return this.inputs.find(port => port.name === name) || null;
  }
  
  /**
   * Get output port by name
   * @param {string} name - Port name
   * @returns {Object|null} - Port object or null if not found
   */
  getOutputPort(name) {
    return this.outputs.find(port => port.name === name) || null;
  }
  
  /**
   * Resolve a parameter value accounting for parent module inheritance
   * @param {string} name - Parameter name
   * @param {*} defaultValue - Default value if parameter not found
   * @returns {*} - Resolved parameter value
   */
  getParameter(name, defaultValue = null) {
    // Check if parameter exists in this component
    if (this.parameters && this.parameters[name] !== undefined) {
      return this.parameters[name];
    }
    
    // Check parent if available
    if (this.parent) {
      return this.parent.getParameter(name, defaultValue);
    }
    
    // Return default value if not found
    return defaultValue;
  }
  
  /**
   * Get the display properties for rendering
   * @returns {Object} - Display properties
   */
  getDisplayProperties() {
    const evaluator = new ExpressionEvaluator();
    const display = { ...this.display };
    
    // Process label with parameter substitution
    if (display.label && typeof display.label === 'string' && display.label.includes('${')) {
      display.label = evaluator.evaluate(display.label, this.parameters);
    }
    
    return display;
  }
  
  /**
   * Invalidate the latency cache
   * Called when internal components change
   */
  invalidateLatencyCache() {
    this.cachedLatency = undefined;
    
    // Propagate to parent if exists
    if (this.parent) {
      this.parent.invalidateLatencyCache();
    }
  }
}

export default Component;