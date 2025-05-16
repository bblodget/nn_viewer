/**
 * Parser module
 * Validates and processes diagram JSON data
 */

/**
 * Parser class for validating and processing diagram JSON
 */
export class Parser {
    constructor() {
        // Configuration options
        this.options = {
            allowModuleInputReferences: true,
            allowComponentLoops: true
        };
    }
    
    /**
     * Validate diagram data
     * @param {object} data - The diagram data object
     * @returns {boolean} True if valid, false otherwise
     */
    isValidDiagramData(data) {
        try {
            // 1. Root Object and Core Properties Check
            if (!data || typeof data !== 'object' || Array.isArray(data)) {
                console.error('Diagram data must be an object.');
                return false;
            }
            
            if (typeof data.entryPointModule !== 'string' || !data.entryPointModule) {
                console.error('Diagram data must have a non-empty "entryPointModule" string property.');
                return false;
            }
            
            if (!data.moduleDefinitions || typeof data.moduleDefinitions !== 'object' || Array.isArray(data.moduleDefinitions)) {
                console.error('Diagram data must have a "moduleDefinitions" object property.');
                return false;
            }
            
            if (!data.moduleDefinitions[data.entryPointModule]) {
                console.error(`The entryPointModule "${data.entryPointModule}" is not defined in moduleDefinitions.`);
                return false;
            }
            
            // 2. Optional Primitive Definitions Check
            if (data.primitiveDefinitions && (typeof data.primitiveDefinitions !== 'object' || Array.isArray(data.primitiveDefinitions))) {
                console.error('If provided, "primitiveDefinitions" must be an object.');
                return false;
            }
            
            // 3. Validate primitive definitions if they exist
            if (data.primitiveDefinitions) {
                for (const [primitiveType, definition] of Object.entries(data.primitiveDefinitions)) {
                    if (!this.isValidPrimitiveDefinition(primitiveType, definition)) {
                        return false;
                    }
                }
            }
            
            // 4. Validate each module definition
            for (const [moduleName, definition] of Object.entries(data.moduleDefinitions)) {
                if (!this.isValidModuleDefinition(moduleName, definition, data.moduleDefinitions)) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error validating diagram data:', error);
            return false;
        }
    }
    
    /**
     * Validate a primitive definition
     * @param {string} primitiveType - The primitive type name
     * @param {object} definition - The primitive definition
     * @returns {boolean} True if valid, false otherwise
     */
    isValidPrimitiveDefinition(primitiveType, definition) {
        if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
            console.error(`Primitive definition for "${primitiveType}" must be an object.`);
            return false;
        }
        
        // Check is_primitive flag
        if (definition.is_primitive !== true) {
            console.error(`Primitive definition for "${primitiveType}" must have is_primitive set to true.`);
            return false;
        }
        
        // Check inputs
        if (!Array.isArray(definition.inputs)) {
            console.error(`Primitive definition "${primitiveType}" must have an "inputs" array.`);
            return false;
        }
        
        // Validate inputs
        for (const inputDef of definition.inputs) {
            if (typeof inputDef === 'object' && inputDef !== null) {
                if (typeof inputDef.name !== 'string' || !inputDef.name) {
                    console.error(`Invalid input definition in primitive "${primitiveType}": Input must have a name.`);
                    return false;
                }
                
                if (inputDef.hasOwnProperty('size') && (typeof inputDef.size !== 'number' || inputDef.size < 1 || !Number.isInteger(inputDef.size))) {
                    console.error(`Invalid size for input "${inputDef.name}" in primitive "${primitiveType}". Must be a positive integer.`);
                    return false;
                }
            } else {
                console.error(`Invalid input definition in primitive "${primitiveType}": Must be an object with a name property.`);
                return false;
            }
        }
        
        // Check outputs
        if (!Array.isArray(definition.outputs)) {
            console.error(`Primitive definition "${primitiveType}" must have an "outputs" array.`);
            return false;
        }
        
        // Validate outputs
        for (const outputDef of definition.outputs) {
            if (typeof outputDef === 'object' && outputDef !== null) {
                if (typeof outputDef.name !== 'string' || !outputDef.name) {
                    console.error(`Invalid output definition in primitive "${primitiveType}": Output must have a name.`);
                    return false;
                }
                
                if (outputDef.hasOwnProperty('size') && (typeof outputDef.size !== 'number' || outputDef.size < 1 || !Number.isInteger(outputDef.size))) {
                    console.error(`Invalid size for output "${outputDef.name}" in primitive "${primitiveType}". Must be a positive integer.`);
                    return false;
                }
            } else {
                console.error(`Invalid output definition in primitive "${primitiveType}": Must be an object with a name property.`);
                return false;
            }
        }
        
        // Check latency (optional)
        if (definition.hasOwnProperty('latency') && (typeof definition.latency !== 'number' || definition.latency < 0 || !Number.isInteger(definition.latency))) {
            console.error(`Invalid latency in primitive "${primitiveType}". Must be a non-negative integer.`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate a module definition
     * @param {string} moduleName - The module name
     * @param {object} definition - The module definition
     * @param {object} moduleDefinitions - All module definitions for cross-reference
     * @returns {boolean} True if valid, false otherwise
     */
    isValidModuleDefinition(moduleName, definition, moduleDefinitions) {
        if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
            console.error(`Module definition for "${moduleName}" must be an object.`);
            return false;
        }
        
        // V2 allows is_primitive flag (should be false or undefined)
        if (definition.hasOwnProperty('is_primitive') && definition.is_primitive === true) {
            console.error(`Module definition "${moduleName}" has is_primitive set to true, but should be false or undefined.`);
            return false;
        }
        
        // Check inputs
        if (!Array.isArray(definition.inputs)) {
            console.error(`Module definition "${moduleName}" must have an "inputs" array.`);
            return false;
        }
        
        // Validate inputs
        for (const inputDef of definition.inputs) {
            if (typeof inputDef === 'string') {
                // Simple string input name (backward compatibility)
                if (!inputDef) {
                    console.error(`Invalid input name in module "${moduleName}": Empty string not allowed.`);
                    return false;
                }
            } else if (typeof inputDef === 'object' && inputDef !== null) {
                if (typeof inputDef.name !== 'string' || !inputDef.name) {
                    console.error(`Invalid input definition in module "${moduleName}": Input must have a name.`);
                    return false;
                }
                
                if (inputDef.hasOwnProperty('size')) {
                    if (typeof inputDef.size === 'string') {
                        // Parameter reference, will be validated at runtime
                        if (!inputDef.size.includes('${')) {
                            console.error(`Invalid size for input "${inputDef.name}" in module "${moduleName}". String size must be a parameter reference.`);
                            return false;
                        }
                    } else if (typeof inputDef.size !== 'number' || inputDef.size < 1 || !Number.isInteger(inputDef.size)) {
                        console.error(`Invalid size for input "${inputDef.name}" in module "${moduleName}". Must be a positive integer or parameter reference.`);
                        return false;
                    }
                }
            } else {
                console.error(`Invalid input definition in module "${moduleName}": ${JSON.stringify(inputDef)}. Must be a non-empty string or an object {name: string, size?: number}.`);
                return false;
            }
        }
        
        // Check outputs
        if (!Array.isArray(definition.outputs)) {
            console.error(`Module definition "${moduleName}" must have an "outputs" array.`);
            return false;
        }
        
        // Validate outputs
        for (const outputDef of definition.outputs) {
            if (typeof outputDef === 'string') {
                // Simple string output name (backward compatibility)
                if (!outputDef) {
                    console.error(`Invalid output name in module "${moduleName}": Empty string not allowed.`);
                    return false;
                }
            } else if (typeof outputDef === 'object' && outputDef !== null) {
                if (typeof outputDef.name !== 'string' || !outputDef.name) {
                    console.error(`Invalid output definition in module "${moduleName}": Output must have a name.`);
                    return false;
                }
                
                if (outputDef.hasOwnProperty('size')) {
                    if (typeof outputDef.size === 'string') {
                        // Parameter reference, will be validated at runtime
                        if (!outputDef.size.includes('${')) {
                            console.error(`Invalid size for output "${outputDef.name}" in module "${moduleName}". String size must be a parameter reference.`);
                            return false;
                        }
                    } else if (typeof outputDef.size !== 'number' || outputDef.size < 1 || !Number.isInteger(outputDef.size)) {
                        console.error(`Invalid size for output "${outputDef.name}" in module "${moduleName}". Must be a positive integer or parameter reference.`);
                        return false;
                    }
                }
            } else {
                console.error(`Invalid output definition in module "${moduleName}": Must be a non-empty string or an object {name: string, size?: number}.`);
                return false;
            }
        }
        
        // Check components (required unless component_loops is provided)
        if (!definition.components && !definition.component_loops) {
            console.error(`Module definition "${moduleName}" must have either "components" array or "component_loops".`);
            return false;
        }
        
        if (definition.components && !Array.isArray(definition.components)) {
            console.error(`"components" in module "${moduleName}" must be an array.`);
            return false;
        }
        
        // Validate components if present
        if (definition.components) {
            for (const component of definition.components) {
                if (!this.isValidComponentDefinition(component, definition, moduleDefinitions, moduleName)) {
                    return false;
                }
            }
        }
        
        // Validate component_loops if present
        if (definition.component_loops) {
            if (!Array.isArray(definition.component_loops)) {
                console.error(`"component_loops" in module "${moduleName}" must be an array.`);
                return false;
            }
            
            for (const loop of definition.component_loops) {
                if (!this.isValidComponentLoop(loop, definition, moduleDefinitions, moduleName)) {
                    return false;
                }
            }
        }
        
        // Check outputMappings
        if (!definition.outputMappings || typeof definition.outputMappings !== 'object' || Array.isArray(definition.outputMappings)) {
            console.error(`Module definition "${moduleName}" must have an "outputMappings" object.`);
            return false;
        }
        
        // Get output names (accounting for both string and object formats)
        const outputNames = definition.outputs.map(output => 
            typeof output === 'string' ? output : output.name
        );
        
        // Validate output mappings
        for (const [portName, connection] of Object.entries(definition.outputMappings)) {
            if (!outputNames.includes(portName)) {
                console.error(`Output mapping for "${portName}" in module "${moduleName}" does not correspond to a defined output port.`);
                return false;
            }
            
            // Allow parameter expressions in output mappings
            if (typeof connection === 'string') {
                if (connection.includes('${')) {
                    // This is a parameterized expression, will be evaluated at runtime
                    continue;
                }
                
                if (!connection.includes('.') || connection.startsWith('$.')) {
                    console.error(`Invalid output mapping connection "${connection}" for port "${portName}" in module "${moduleName}". Must be "componentId.portName" referring to an internal component.`);
                    return false;
                }
                
                const [componentId] = connection.split('.');
                const componentExists = definition.components && definition.components.some(c => c.id === componentId);
                const componentFromLoop = this.mightBeGeneratedByComponentLoop(componentId, definition.component_loops);
                
                if (!componentExists && !componentFromLoop) {
                    console.error(`Output mapping connection "${connection}" for port "${portName}" in module "${moduleName}" refers to a non-existent internal component "${componentId}".`);
                    return false;
                }
            } else {
                console.error(`Output mapping for "${portName}" in module "${moduleName}" must be a string connection reference or parameter expression.`);
                return false;
            }
        }
        
        // Check port_groups if present
        if (definition.port_groups) {
            if (typeof definition.port_groups !== 'object' || Array.isArray(definition.port_groups)) {
                console.error(`"port_groups" in module "${moduleName}" must be an object.`);
                return false;
            }
            
            // Validate each port group
            for (const [groupName, group] of Object.entries(definition.port_groups)) {
                if (!this.isValidPortGroup(groupName, group, definition, moduleName)) {
                    return false;
                }
            }
        }
        
        // Check parameters if present
        if (definition.parameters) {
            if (typeof definition.parameters !== 'object' || Array.isArray(definition.parameters)) {
                console.error(`"parameters" in module "${moduleName}" must be an object.`);
                return false;
            }
            
            // Parameter values can be of any type, no specific validation needed
        }
        
        // Check display properties if present
        if (definition.display) {
            if (typeof definition.display !== 'object' || Array.isArray(definition.display)) {
                console.error(`"display" in module "${moduleName}" must be an object.`);
                return false;
            }
            
            // Validate display properties
            if (definition.display.hasOwnProperty('height') && 
                (typeof definition.display.height !== 'number' || definition.display.height <= 0)) {
                console.error(`"height" in module "${moduleName}" display must be a positive number.`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if a component might be generated by a component loop
     * @param {string} componentId - The component ID to check
     * @param {Array} componentLoops - The component loops to search in
     * @returns {boolean} True if the component ID might be generated by a loop
     */
    mightBeGeneratedByComponentLoop(componentId, componentLoops) {
        if (!componentLoops || !Array.isArray(componentLoops)) {
            return false;
        }
        
        for (const loop of componentLoops) {
            if (loop.components && Array.isArray(loop.components)) {
                for (const component of loop.components) {
                    if (component.id && component.id.includes('${')) {
                        // This is a templated ID with parameter substitution
                        // We can't fully validate it statically, so we assume it might match
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Validate a component definition
     * @param {object} component - The component definition
     * @param {object} moduleDefinition - The parent module definition
     * @param {object} moduleDefinitions - All module definitions
     * @param {string} parentModuleName - The parent module name
     * @returns {boolean} True if valid, false otherwise
     */
    isValidComponentDefinition(component, moduleDefinition, moduleDefinitions, parentModuleName) {
        if (!component || typeof component !== 'object' || Array.isArray(component)) {
            console.error(`Component in module "${parentModuleName}" must be an object.`);
            return false;
        }
        
        if (typeof component.id !== 'string' || !component.id) {
            console.error(`Component in module "${parentModuleName}" is missing a valid "id".`);
            return false;
        }
        
        if (typeof component.type !== 'string' || !component.type) {
            console.error(`Component "${component.id}" in module "${parentModuleName}" is missing a valid "type".`);
            return false;
        }
        
        // Component inputs (required unless it's an input component)
        if (component.type !== 'input' && (!component.inputs || typeof component.inputs !== 'object' || Array.isArray(component.inputs))) {
            console.error(`Component "${component.id}" (type: ${component.type}) in module "${parentModuleName}" must have an "inputs" object.`);
            return false;
        }
        
        // Validate inputs if they exist
        if (component.inputs) {
            for (const [portName, connection] of Object.entries(component.inputs)) {
                if (typeof connection === 'string') {
                    if (connection.includes('${')) {
                        // This is a parameterized expression, will be evaluated at runtime
                        continue;
                    }
                    
                    if (connection.startsWith('$.')) {
                        // Reference to module input
                        const inputMatch = connection.match(/\$\.([a-zA-Z0-9_]+)(?:\[(\d+)\])?/);
                        if (!inputMatch) {
                            console.error(`Invalid module input reference "${connection}" for component "${component.id}" in module "${parentModuleName}".`);
                            return false;
                        }
                        
                        const inputName = inputMatch[1];
                        const inputIndex = inputMatch[2] ? parseInt(inputMatch[2]) : null;
                        
                        // Check if the referenced input exists in the module definition
                        const moduleInput = this.findModuleInput(moduleDefinition, inputName);
                        if (!moduleInput) {
                            console.error(`Component "${component.id}" in module "${parentModuleName}" references non-existent module input "${inputName}" via "${connection}".`);
                            return false;
                        }
                        
                        // If index is provided, check if the input is a vector with sufficient size
                        if (inputIndex !== null) {
                            const inputSize = this.getInputSize(moduleInput);
                            if (inputSize === 1 || inputIndex >= inputSize) {
                                console.error(`Index out of bounds or non-vector access for module input reference "${connection}" in component "${component.id}", module "${parentModuleName}". Max index: ${inputSize > 1 ? inputSize - 1 : 'N/A'}.`);
                                return false;
                            }
                        }
                    } else if (connection.includes('.')) {
                        // Reference to another component output
                        const [sourceId, portName] = connection.split('.');
                        if (!sourceId || !portName) {
                            console.error(`Invalid connection format "${connection}" for component "${component.id}" in module "${parentModuleName}". Should be "componentId.portName".`);
                            return false;
                        }
                        
                        // Check if the source component exists (or might be generated by a loop)
                        const sourceComponent = moduleDefinition.components && moduleDefinition.components.find(c => c.id === sourceId);
                        const mightBeGenerated = this.mightBeGeneratedByComponentLoop(sourceId, moduleDefinition.component_loops);
                        
                        if (!sourceComponent && !mightBeGenerated) {
                            console.error(`Component "${component.id}" in module "${parentModuleName}" references non-existent component "${sourceId}" via "${connection}".`);
                            return false;
                        }
                        
                        // For non-loop components, we can validate port names statically
                        if (sourceComponent && connection.includes('[')) {
                            // This is an indexed port access, check if the referenced port is indeed a vector
                            const portMatch = connection.match(/([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\[(\d+)\]/);
                            if (portMatch) {
                                const compId = portMatch[1];
                                const portName = portMatch[2];
                                const portIndex = parseInt(portMatch[3]);
                                
                                // We can only validate this for components that reference predefined types
                                // Module or primitive references will need validation at runtime
                                // This is a limited static validation
                            }
                        }
                    } else {
                        console.error(`Invalid connection format "${connection}" for component "${component.id}" in module "${parentModuleName}". Must be either "componentId.portName" or "$.inputName".`);
                        return false;
                    }
                } else {
                    console.error(`Connection for port "${portName}" in component "${component.id}" (module "${parentModuleName}") must be a string reference.`);
                    return false;
                }
            }
        }
        
        // Check parameters if present
        if (component.parameters) {
            if (typeof component.parameters !== 'object' || Array.isArray(component.parameters)) {
                console.error(`"parameters" in component "${component.id}" (module "${parentModuleName}") must be an object.`);
                return false;
            }
            
            // Parameter values can be of any type, no specific validation needed
        }
        
        return true;
    }
    
    /**
     * Validate a component loop
     * @param {object} loop - The component loop definition
     * @param {object} moduleDefinition - The parent module definition
     * @param {object} moduleDefinitions - All module definitions
     * @param {string} parentModuleName - The parent module name
     * @returns {boolean} True if valid, false otherwise
     */
    isValidComponentLoop(loop, moduleDefinition, moduleDefinitions, parentModuleName) {
        if (!loop || typeof loop !== 'object' || Array.isArray(loop)) {
            console.error(`Component loop in module "${parentModuleName}" must be an object.`);
            return false;
        }
        
        // Check required properties
        if (typeof loop.iterator !== 'string' || !loop.iterator) {
            console.error(`Component loop in module "${parentModuleName}" is missing a valid "iterator" name.`);
            return false;
        }
        
        if (!Array.isArray(loop.range) || loop.range.length !== 2) {
            console.error(`Component loop in module "${parentModuleName}" must have a "range" array with exactly 2 elements.`);
            return false;
        }
        
        // Range values can be numbers or parameter expressions
        for (const value of loop.range) {
            if (typeof value !== 'number' && typeof value !== 'string') {
                console.error(`Range values in component loop (module "${parentModuleName}") must be numbers or parameter expressions.`);
                return false;
            }
            
            if (typeof value === 'string' && !value.includes('${')) {
                console.error(`String range value "${value}" in component loop (module "${parentModuleName}") must be a parameter expression.`);
                return false;
            }
        }
        
        // Check components
        if (!Array.isArray(loop.components) || loop.components.length === 0) {
            console.error(`Component loop in module "${parentModuleName}" must have a non-empty "components" array.`);
            return false;
        }
        
        // Validate loop component templates
        for (const component of loop.components) {
            if (!component || typeof component !== 'object' || Array.isArray(component)) {
                console.error(`Component template in loop (module "${parentModuleName}") must be an object.`);
                return false;
            }
            
            // ID can be a template with parameter substitution
            if (component.id !== undefined && (typeof component.id !== 'string' || !component.id)) {
                console.error(`Component template in loop (module "${parentModuleName}") has an invalid "id".`);
                return false;
            }
            
            // Type must be a valid string
            if (typeof component.type !== 'string' || !component.type) {
                console.error(`Component template in loop (module "${parentModuleName}") is missing a valid "type".`);
                return false;
            }
            
            // Inputs are optional for input components
            if (component.type !== 'input' && component.inputs !== undefined && (typeof component.inputs !== 'object' || Array.isArray(component.inputs))) {
                console.error(`Component template in loop (module "${parentModuleName}") has invalid "inputs".`);
                return false;
            }
            
            // For inputs, we allow parameter expressions which will be evaluated at runtime
            // Full static validation is not possible, but we can do a basic check
            if (component.inputs) {
                for (const [portName, connection] of Object.entries(component.inputs)) {
                    if (typeof connection !== 'string') {
                        console.error(`Connection for port "${portName}" in component template (module "${parentModuleName}") must be a string reference or expression.`);
                        return false;
                    }
                }
            }
            
            // Parameters are optional
            if (component.parameters !== undefined && (typeof component.parameters !== 'object' || Array.isArray(component.parameters))) {
                console.error(`Component template in loop (module "${parentModuleName}") has invalid "parameters".`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Validate a port group
     * @param {string} groupName - The port group name
     * @param {object} group - The port group definition
     * @param {object} moduleDefinition - The parent module definition
     * @param {string} moduleName - The parent module name
     * @returns {boolean} True if valid, false otherwise
     */
    isValidPortGroup(groupName, group, moduleDefinition, moduleName) {
        if (!group || typeof group !== 'object' || Array.isArray(group)) {
            console.error(`Port group "${groupName}" in module "${moduleName}" must be an object.`);
            return false;
        }
        
        // Check ports array
        if (!Array.isArray(group.ports) || group.ports.length === 0) {
            console.error(`Port group "${groupName}" in module "${moduleName}" must have a non-empty "ports" array.`);
            return false;
        }
        
        // Get input names (accounting for both string and object formats)
        const inputNames = moduleDefinition.inputs.map(input => 
            typeof input === 'string' ? input : input.name
        );
        
        // Check if all referenced ports exist in the module's inputs
        for (const portName of group.ports) {
            if (!inputNames.includes(portName)) {
                console.error(`Port group "${groupName}" in module "${moduleName}" references non-existent input port "${portName}".`);
                return false;
            }
        }
        
        // Check arrangement if present
        if (group.arrangement && typeof group.arrangement !== 'string') {
            console.error(`"arrangement" in port group "${groupName}" (module "${moduleName}") must be a string.`);
            return false;
        }
        
        // Check color if present
        if (group.color && typeof group.color !== 'string') {
            console.error(`"color" in port group "${groupName}" (module "${moduleName}") must be a string.`);
            return false;
        }
        
        // Check spacing if present
        if (group.spacing !== undefined && typeof group.spacing !== 'number') {
            console.error(`"spacing" in port group "${groupName}" (module "${moduleName}") must be a number.`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Find an input in a module definition
     * @param {object} moduleDefinition - The module definition
     * @param {string} inputName - The input name to find
     * @returns {object|string|null} The input definition or null if not found
     */
    findModuleInput(moduleDefinition, inputName) {
        if (!moduleDefinition.inputs || !Array.isArray(moduleDefinition.inputs)) {
            return null;
        }
        
        return moduleDefinition.inputs.find(input => {
            if (typeof input === 'string') {
                return input === inputName;
            } else if (typeof input === 'object' && input !== null) {
                return input.name === inputName;
            }
            return false;
        }) || null;
    }
    
    /**
     * Get the size of an input definition
     * @param {object|string} input - The input definition
     * @returns {number} The input size (default 1)
     */
    getInputSize(input) {
        if (typeof input === 'string') {
            return 1; // Default size for string inputs
        } else if (typeof input === 'object' && input !== null) {
            return input.size || 1;
        }
        return 1;
    }
}