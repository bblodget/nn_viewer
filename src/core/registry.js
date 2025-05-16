/**
 * Registry module
 * Manages unified component definitions (primitives and modules)
 */

import builtins from '../lib/builtins.json' assert { type: 'json' };

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
        
        // Load component definitions
        if (data.componentDefinitions && typeof data.componentDefinitions === 'object') {
            for (const [type, definition] of Object.entries(data.componentDefinitions)) {
                // Set is_primitive to false by default if not specified
                const def = { ...definition };
                if (def.is_primitive === undefined) {
                    def.is_primitive = false;
                }
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
        this.loadFromJson(builtins);
    }
}