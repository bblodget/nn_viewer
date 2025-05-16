/**
 * Component module
 * Unified component class for both primitives and modules
 */

import { ExpressionEvaluator } from './expressions.js';

/**
 * Unified Component class
 * Base class for both primitives and modules
 */
export class Component {
    /**
     * Create a new component
     * @param {string} id - The component identifier
     * @param {object} definition - The component definition
     * @param {object} parameters - Override parameters for this instance
     * @param {Registry} registry - Component registry for resolving references
     */
    constructor(id, definition, parameters = {}, registry = null) {
        this.id = id;
        this.definition = definition;
        this.isPrimitive = definition.is_primitive === true;
        
        // Combine default parameters with instance parameters
        this.parameters = { 
            ...(definition.parameters || {}), 
            ...parameters 
        };
        
        this.registry = registry;
        this.expressionEvaluator = new ExpressionEvaluator();
        
        // Process ports with parameter substitution
        this.inputs = this.processPortDefinitions(definition.inputs || []);
        this.outputs = this.processPortDefinitions(definition.outputs || []);
        
        // Initialize connections
        this.inputConnections = {};
        
        // Initialize position and layout properties
        this.position = { x: 0, y: 0 };
        this.width = 0;
        this.height = 0;
        
        // Cache for computed properties
        this.cachedLatency = undefined;
        this.components = null; // For modules, will be populated later
        
        // Process display properties
        this.display = this.processDisplayProperties(definition.display);
    }
    
    /**
     * Process port definitions with parameter substitution
     * @param {Array} portDefs - The port definitions
     * @returns {Array} Processed port definitions
     */
    processPortDefinitions(portDefs) {
        if (!portDefs || !Array.isArray(portDefs)) {
            return [];
        }
        
        return portDefs.map(portDef => {
            const processedPort = { ...portDef };
            
            // Process size with parameter substitution
            if (typeof processedPort.size === 'string') {
                processedPort.size = this.expressionEvaluator.evaluate(
                    processedPort.size,
                    this.parameters
                );
                
                // Convert to number if possible
                if (!isNaN(processedPort.size)) {
                    processedPort.size = Number(processedPort.size);
                }
            }
            
            // Default size to 1 if not specified or invalid
            if (!processedPort.size || isNaN(processedPort.size)) {
                processedPort.size = 1;
            }
            
            // Initialize position for layout
            processedPort.position = { x: 0, y: 0 };
            
            return processedPort;
        });
    }
    
    /**
     * Process display properties with parameter substitution
     * @param {object} displayProps - The display properties
     * @returns {object} Processed display properties
     */
    processDisplayProperties(displayProps) {
        if (!displayProps) {
            return {};
        }
        
        const processed = { ...displayProps };
        
        // Process label with parameter substitution
        if (typeof processed.label === 'string') {
            processed.label = this.expressionEvaluator.evaluate(
                processed.label,
                this.parameters
            );
        }
        
        // Process height with parameter substitution
        if (typeof processed.height === 'string') {
            processed.height = this.expressionEvaluator.evaluate(
                processed.height,
                this.parameters
            );
            
            // Convert to number if possible
            if (!isNaN(processed.height)) {
                processed.height = Number(processed.height);
            }
        }
        
        return processed;
    }
    
    /**
     * Get the component identifier
     * @returns {string} The component ID
     */
    getId() {
        return this.id;
    }
    
    /**
     * Get the component type
     * @returns {string} The component type
     */
    getType() {
        return this.definition.type;
    }
    
    /**
     * Check if this component is a primitive
     * @returns {boolean} True if this is a primitive component
     */
    isPrimitiveComponent() {
        return this.isPrimitive;
    }
    
    /**
     * Get the component's input ports
     * @returns {Array} The input port definitions
     */
    getInputs() {
        return this.inputs;
    }
    
    /**
     * Get the component's output ports
     * @returns {Array} The output port definitions
     */
    getOutputs() {
        return this.outputs;
    }
    
    /**
     * Get an input port by name
     * @param {string} name - The port name
     * @returns {object|null} The input port definition or null
     */
    getInputPort(name) {
        return this.inputs.find(input => input.name === name) || null;
    }
    
    /**
     * Get an output port by name
     * @param {string} name - The port name
     * @returns {object|null} The output port definition or null
     */
    getOutputPort(name) {
        return this.outputs.find(output => output.name === name) || null;
    }
    
    /**
     * Connect an input port to a source
     * @param {string} portName - The input port name
     * @param {string} source - The source connection reference
     */
    connectInput(portName, source) {
        // Validate the input port exists
        const port = this.getInputPort(portName);
        if (!port) {
            throw new Error(`Input port "${portName}" not found on component "${this.id}"`);
        }
        
        // Store the connection
        this.inputConnections[portName] = source;
    }
    
    /**
     * Connect input ports from a connections object
     * @param {object} connections - Object mapping port names to sources
     */
    connectInputs(connections) {
        if (!connections) {
            return;
        }
        
        Object.entries(connections).forEach(([portName, source]) => {
            this.connectInput(portName, source);
        });
    }
    
    /**
     * Get the latency of this component
     * @returns {number} The component latency
     */
    getLatency() {
        // For primitives, return the fixed latency
        if (this.isPrimitive) {
            return this.definition.latency || 1;
        }
        
        // For modules, calculate critical path latency if not cached
        if (this.cachedLatency === undefined) {
            this.cachedLatency = this.calculateCriticalPathLatency();
        }
        
        return this.cachedLatency;
    }
    
    /**
     * Calculate the critical path latency for a module
     * @returns {number} The latency of the critical path
     */
    calculateCriticalPathLatency() {
        // This should be implemented by Module subclass
        return 1;
    }
    
    /**
     * Get the input connections for this component
     * @returns {object} Input connections mapping
     */
    getInputConnections() {
        return this.inputConnections;
    }
    
    /**
     * Get the display properties for this component
     * @returns {object} Display properties
     */
    getDisplay() {
        return this.display || {};
    }
    
    /**
     * Get the parameters for this component
     * @returns {object} Component parameters
     */
    getParameters() {
        return this.parameters;
    }
    
    /**
     * Get a parameter value with expression evaluation
     * @param {string} name - The parameter name
     * @param {*} defaultValue - Default value if parameter not found
     * @returns {*} The parameter value
     */
    getParameter(name, defaultValue = null) {
        if (this.parameters.hasOwnProperty(name)) {
            const value = this.parameters[name];
            
            if (typeof value === 'string' && value.includes('${')) {
                return this.expressionEvaluator.evaluate(value, this.parameters);
            }
            
            return value;
        }
        
        return defaultValue;
    }
    
    /**
     * Get the position of this component
     * @returns {object} Component position (x, y)
     */
    getPosition() {
        return this.position;
    }
    
    /**
     * Set the position of this component
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    setPosition(x, y) {
        this.position = { x, y };
    }
    
    /**
     * Get the dimensions of this component
     * @returns {object} Component dimensions (width, height)
     */
    getDimensions() {
        return {
            width: this.width || 1,
            height: this.height || 1
        };
    }
    
    /**
     * Set the dimensions of this component
     * @param {number} width - Component width
     * @param {number} height - Component height
     */
    setDimensions(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * Get the component's port groups (for modules)
     * @returns {object} Port groups configuration or empty object
     */
    getPortGroups() {
        return {};
    }
    
    /**
     * Process a connection reference for use in rendering
     * @param {string} connection - The connection reference (e.g., "componentId.portName[0]")
     * @returns {object|null} Parsed connection reference or null
     */
    parseConnectionReference(connection) {
        if (typeof connection !== 'string') {
            return null;
        }
        
        // Check if this is a module input reference ($.inputName)
        if (connection.startsWith('$.')) {
            const inputMatch = connection.match(/\$\.([a-zA-Z0-9_]+)(?:\[(\d+)\])?/);
            if (inputMatch) {
                return {
                    componentId: null, // No component ID for module inputs
                    portName: inputMatch[1],
                    index: inputMatch[2] ? parseInt(inputMatch[2]) : null,
                    isModuleInput: true
                };
            }
            return null;
        }
        
        // Check for indexed port reference (componentId.portName[index])
        const indexedMatch = connection.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)(?:\[(\d+)\])?/);
        if (indexedMatch) {
            return {
                componentId: indexedMatch[1],
                portName: indexedMatch[2],
                index: indexedMatch[3] ? parseInt(indexedMatch[3]) : null
            };
        }
        
        // Check for simple component.port reference
        const parts = connection.split('.');
        if (parts.length === 2) {
            return {
                componentId: parts[0],
                portName: parts[1],
                index: null
            };
        }
        
        return null;
    }
}

/**
 * Module component class, extends Component
 * For non-primitive components with internal structure
 */
export class Module extends Component {
    /**
     * Create a new module component
     * @param {string} id - The module identifier
     * @param {object} definition - The module definition
     * @param {object} parameters - Override parameters for this instance
     * @param {Registry} registry - Component registry for resolving references
     */
    constructor(id, definition, parameters = {}, registry = null) {
        super(id, definition, parameters, registry);
        
        // Initialize module-specific properties
        this.componentInstances = new Map();
        this.outputMappings = {};
        this.processOutputMappings(definition.outputMappings);
        
        // Initialize port groups
        this.portGroups = this.processPortGroups(definition.port_groups);
        
        // Instantiate internal components if registry is provided
        if (registry) {
            this.instantiateComponents(definition);
        }
    }
    
    /**
     * Process port groups with parameter substitution
     * @param {object} portGroups - The port groups definition
     * @returns {object} Processed port groups
     */
    processPortGroups(portGroups) {
        if (!portGroups) {
            return {};
        }
        
        const processed = {};
        
        for (const [groupId, group] of Object.entries(portGroups)) {
            processed[groupId] = { ...group };
            
            // Process port list if it's parameterized
            if (Array.isArray(processed[groupId].ports)) {
                processed[groupId].ports = processed[groupId].ports.map(port => {
                    return typeof port === 'string' ? 
                        this.expressionEvaluator.evaluate(port, this.parameters) : 
                        port;
                });
            }
        }
        
        return processed;
    }
    
    /**
     * Process output mappings with parameter substitution
     * @param {object} mappings - The output mappings definition
     */
    processOutputMappings(mappings) {
        if (!mappings) {
            return;
        }
        
        for (const [outputPort, sourceRef] of Object.entries(mappings)) {
            this.outputMappings[outputPort] = this.expressionEvaluator.evaluate(
                sourceRef,
                this.parameters
            );
        }
    }
    
    /**
     * Instantiate internal components from the definition
     * @param {object} definition - The module definition
     */
    instantiateComponents(definition) {
        // Process regular components
        if (Array.isArray(definition.components)) {
            definition.components.forEach(compDef => {
                this.instantiateComponent(compDef);
            });
        }
        
        // Process component loops if present
        if (Array.isArray(definition.component_loops)) {
            this.processComponentLoops(definition.component_loops);
        }
        
        // Connect component inputs
        this.connectComponentInputs();
    }
    
    /**
     * Instantiate a single component
     * @param {object} compDef - The component definition
     * @returns {Component} The instantiated component
     */
    instantiateComponent(compDef) {
        const id = this.expressionEvaluator.evaluate(compDef.id, this.parameters);
        const type = this.expressionEvaluator.evaluate(compDef.type, this.parameters);
        
        // Get the component definition from the registry
        const definition = this.registry.getComponent(type);
        if (!definition) {
            throw new Error(`Component type "${type}" not found in registry`);
        }
        
        // Process parameters with substitution
        const params = { ...this.parameters };
        if (compDef.parameters) {
            for (const [key, value] of Object.entries(compDef.parameters)) {
                params[key] = this.expressionEvaluator.evaluate(value, this.parameters);
            }
        }
        
        // Create the appropriate component type
        let component;
        if (definition.is_primitive) {
            component = new Component(id, definition, params, this.registry);
        } else {
            component = new Module(id, definition, params, this.registry);
        }
        
        // Add to component instances
        this.componentInstances.set(id, component);
        
        // Store input connections for later processing
        if (compDef.inputs) {
            component.connectInputs(compDef.inputs);
        }
        
        return component;
    }
    
    /**
     * Process component loops to generate repetitive components
     * @param {Array} loops - The component loop definitions
     */
    processComponentLoops(loops) {
        loops.forEach(loop => {
            const iterator = loop.iterator;
            const range = loop.range.map(val => 
                this.expressionEvaluator.evaluate(val, this.parameters)
            );
            
            // Generate components for each iteration
            for (let i = range[0]; i <= range[1]; i++) {
                const context = { [iterator]: i };
                
                loop.components.forEach(compTemplate => {
                    // Clone the template and evaluate expressions
                    const compDef = this.expressionEvaluator.processObject(
                        compTemplate,
                        this.parameters,
                        context
                    );
                    
                    // Instantiate the component
                    this.instantiateComponent(compDef);
                });
            }
        });
    }
    
    /**
     * Connect component inputs after all components are instantiated
     */
    connectComponentInputs() {
        // No implementations needed here - connections are stored during instantiation
    }
    
    /**
     * Get all instantiated components in this module
     * @returns {Array} Array of component instances
     */
    getComponents() {
        if (this.components === null) {
            this.components = Array.from(this.componentInstances.values());
        }
        return this.components;
    }
    
    /**
     * Get a component by ID
     * @param {string} id - The component ID
     * @returns {Component|null} The component or null if not found
     */
    getComponent(id) {
        return this.componentInstances.get(id) || null;
    }
    
    /**
     * Calculate the critical path latency for this module
     * @returns {number} The latency of the critical path
     */
    calculateCriticalPathLatency() {
        const components = this.getComponents();
        if (!components || components.length === 0) {
            return 1; // Default latency for empty modules
        }
        
        // For each output mapping, calculate the latency to that output
        const latencies = [];
        
        for (const [outputPort, sourceRef] of Object.entries(this.outputMappings)) {
            const sourceLatency = this.calculateSourceLatency(sourceRef);
            latencies.push(sourceLatency);
        }
        
        // Return the maximum latency among all output paths
        return Math.max(...latencies, 1);
    }
    
    /**
     * Calculate the latency to a given source connection
     * @param {string} sourceRef - The source connection reference
     * @returns {number} The latency to this source
     */
    calculateSourceLatency(sourceRef) {
        // If source is a module input, latency is 0
        if (sourceRef.startsWith('$.')) {
            return 0;
        }
        
        // Parse the connection reference
        const parsedRef = this.parseConnectionReference(sourceRef);
        if (!parsedRef) {
            return 1; // Default latency if reference can't be parsed
        }
        
        // Get the source component
        const sourceComponent = this.getComponent(parsedRef.componentId);
        if (!sourceComponent) {
            return 1; // Default latency if component not found
        }
        
        // Get the component's latency
        const componentLatency = sourceComponent.getLatency();
        
        // Calculate input latency recursively
        let maxInputLatency = 0;
        
        const inputConnections = sourceComponent.getInputConnections();
        for (const connection of Object.values(inputConnections)) {
            const inputLatency = this.calculateSourceLatency(connection);
            maxInputLatency = Math.max(maxInputLatency, inputLatency);
        }
        
        // Total latency is max input latency plus this component's latency
        return maxInputLatency + componentLatency;
    }
    
    /**
     * Get the port groups for this module
     * @returns {object} Port groups configuration
     */
    getPortGroups() {
        return this.portGroups;
    }
    
    /**
     * Get the output mappings for this module
     * @returns {object} Output mappings
     */
    getOutputMappings() {
        return this.outputMappings;
    }
}