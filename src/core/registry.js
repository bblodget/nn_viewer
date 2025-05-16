/**
 * Registry module
 * Manages unified component definitions (primitives and modules)
 */

/**
 * Unified Registry class for managing all component definitions
 */
export class Registry {
    constructor() {
        this.components = new Map();
        this.loadBuiltInDefinitions();
    }
    
    /**
     * Register a component (primitive or module)
     * @param {string} type - The component type name
     * @param {object} definition - The component definition
     */
    registerComponent(type, definition) {
        if (this.components.has(type)) {
            console.warn(`Component type '${type}' already registered, overwriting`);
        }
        this.components.set(type, definition);
        return this;
    }
    
    /**
     * Get a component definition by type
     * @param {string} type - The component type name
     * @returns {object|null} The component definition or null if not found
     */
    getComponent(type) {
        return this.components.get(type) || null;
    }
    
    /**
     * Check if a component type is registered
     * @param {string} type - The component type name
     * @returns {boolean} True if the component type is registered
     */
    hasComponent(type) {
        return this.components.has(type);
    }
    
    /**
     * Check if a component is a primitive
     * @param {string} type - The component type name
     * @returns {boolean} True if the component is a primitive
     */
    isPrimitive(type) {
        const definition = this.getComponent(type);
        return definition !== null && definition.is_primitive === true;
    }
    
    /**
     * Check if a component is a module (non-primitive)
     * @param {string} type - The component type name
     * @returns {boolean} True if the component is a module
     */
    isModule(type) {
        const definition = this.getComponent(type);
        return definition !== null && !definition.is_primitive;
    }
    
    /**
     * Load component definitions from a JSON object
     * @param {object} data - The JSON data object
     */
    loadFromJson(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid JSON data for loading components');
        }
        
        // Check for componentDefinitions section
        if (data.componentDefinitions && typeof data.componentDefinitions === 'object') {
            for (const [type, definition] of Object.entries(data.componentDefinitions)) {
                this.registerComponent(type, definition);
            }
        }
        
        // For backward compatibility with v2 format, also check for moduleDefinitions/primitiveDefinitions
        if (data.moduleDefinitions && typeof data.moduleDefinitions === 'object') {
            for (const [type, definition] of Object.entries(data.moduleDefinitions)) {
                // Ensure is_primitive is set to false explicitly if not already defined
                const def = { ...definition };
                if (def.is_primitive === undefined) {
                    def.is_primitive = false;
                }
                this.registerComponent(type, def);
            }
        }
        
        if (data.primitiveDefinitions && typeof data.primitiveDefinitions === 'object') {
            for (const [type, definition] of Object.entries(data.primitiveDefinitions)) {
                // Ensure is_primitive is set to true explicitly
                const def = { ...definition, is_primitive: true };
                this.registerComponent(type, def);
            }
        }
        
        return this;
    }
    
    /**
     * Clear all component registrations
     */
    clear() {
        this.components.clear();
    }
    
    /**
     * Load built-in component definitions
     * @private
     */
    loadBuiltInDefinitions() {
        // Register built-in primitive types
        this.registerComponent('add', {
            is_primitive: true,
            inputs: [
                { name: 'in1', size: 1 },
                { name: 'in2', size: 1 }
            ],
            outputs: [
                { name: 'out', size: 1 }
            ],
            latency: 1,
            display: {
                symbol: '+',
                color: '#4CAF50',
                shape: 'circle'
            }
        });
        
        this.registerComponent('mul', {
            is_primitive: true,
            inputs: [
                { name: 'in1', size: 1 },
                { name: 'in2', size: 1 }
            ],
            outputs: [
                { name: 'out', size: 1 }
            ],
            latency: 1,
            display: {
                symbol: '×',
                color: '#2196F3',
                shape: 'circle'
            }
        });
        
        this.registerComponent('relu2', {
            is_primitive: true,
            inputs: [
                { name: 'in', size: 1 }
            ],
            outputs: [
                { name: 'out', size: 1 }
            ],
            latency: 1,
            display: {
                symbol: 'ReLU²',
                color: '#FF9800',
                shape: 'rect'
            }
        });
        
        this.registerComponent('clamp', {
            is_primitive: true,
            inputs: [
                { name: 'in', size: 1 }
            ],
            outputs: [
                { name: 'out', size: 1 }
            ],
            latency: 1,
            display: {
                symbol: '◊',
                color: '#F44336',
                shape: 'diamond'
            }
        });
        
        this.registerComponent('reg', {
            is_primitive: true,
            inputs: [
                { name: 'in', size: 1 }
            ],
            outputs: [
                { name: 'out', size: 1 }
            ],
            latency: 1, // Registers always have a latency of 1
            display: {
                symbol: 'D',
                color: '#9C27B0',
                shape: 'rect'
            }
        });
        
        // Register built-in module: delay_chain
        this.registerComponent('delay_chain', {
            is_primitive: false,
            parameters: {
                DELAY: 1,
                DATA_WIDTH: 1
            },
            inputs: [
                { name: 'in', size: '${DATA_WIDTH}' }
            ],
            outputs: [
                { name: 'out', size: '${DATA_WIDTH}' }
            ],
            component_loops: [
                {
                    iterator: 'i',
                    range: [0, '${DELAY-1}'],
                    components: [
                        {
                            id: 'reg_${i}',
                            type: 'reg',
                            inputs: {
                                in: "${i == 0 ? '$.in' : 'reg_' + (i-1) + '.out'}"
                            }
                        }
                    ]
                }
            ],
            outputMappings: {
                out: "${DELAY > 0 ? 'reg_' + (DELAY-1) + '.out' : '$.in'}"
            },
            display: {
                height: 1,
                color: '#9C27B0',
                label: 'Delay ${DELAY}'
            }
        });
    }
}