const fs = require('fs');
const path = require('path');

// --- Paste the isValidDiagramData function from src/viewer.js below ---
function isValidDiagramData(data) {
    // Check if we have the new format with moduleDefinitions and elements
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        // New hierarchical format with module definitions
        if (data.moduleDefinitions) {
            // Validate moduleDefinitions section
            if (typeof data.moduleDefinitions !== 'object') {
                console.error('moduleDefinitions must be an object');
                return false;
            }
            // Validate each module definition
            for (const [moduleType, definition] of Object.entries(data.moduleDefinitions)) {
                // Each definition must have inputs, outputs, and components
                if (!definition.inputs || !definition.outputs || !definition.components) {
                    console.error(`Module definition for ${moduleType} is missing required properties`);
                    return false;
                }
                // Validate inputs - must be an array of string or objects with name/size properties
                if (!Array.isArray(definition.inputs)) {
                    console.error(`Inputs for module definition ${moduleType} must be an array`);
                    return false;
                }
                // Validate outputs - must be an array of strings
                if (!Array.isArray(definition.outputs)) {
                    console.error(`Outputs for module definition ${moduleType} must be an array`);
                    return false;
                }
                // Validate components - must be an array of component objects
                if (!Array.isArray(definition.components)) {
                    console.error(`Components for module definition ${moduleType} must be an array`);
                    return false;
                }
                // Validate each component in the definition
                for (const component of definition.components) {
                    if (!component.id || !component.type) {
                        console.error(`Component in module definition ${moduleType} is missing id or type`);
                        return false;
                    }
                    // Validate component inputs (if not an input type)
                    if (component.type !== 'input' && component.inputs) {
                        for (const [inputPort, connection] of Object.entries(component.inputs)) {
                            // Connection can be either a component reference (id.port) or a module input reference ($.input[n])
                            if (typeof connection === 'string') {
                                if (!connection.includes('.') && !connection.startsWith('$.')) {
                                    console.error(`Invalid connection format in module definition ${moduleType}, component ${component.id}: ${connection}`);
                                    return false;
                                }
                            } else {
                                console.error(`Connection must be a string in module definition ${moduleType}, component ${component.id}`);
                                return false;
                            }
                        }
                    }
                }
                // Validate outputMappings - must map output port names to internal component outputs
                if (!definition.outputMappings || typeof definition.outputMappings !== 'object') {
                    console.error(`Module definition ${moduleType} is missing outputMappings object`);
                    return false;
                }
                for (const [outputPort, connection] of Object.entries(definition.outputMappings)) {
                    if (typeof connection !== 'string' || !connection.includes('.')) {
                        console.error(`Invalid output mapping in module definition ${moduleType}: ${connection}`);
                        return false;
                    }
                }
            }
        }
        // Validate elements array
        if (!Array.isArray(data.elements)) {
            console.error('Diagram elements must be an array');
            return false;
        }
        // Proceed with validating the elements array
        const elements = data.elements;
        // Check that primitives and modules have required properties
        for (const element of elements) {
            // Every element must have id and type properties
            if (!element.id || !element.type) {
                console.error(`Element missing required id or type: ${JSON.stringify(element)}`);
                return false;
            }
            // If element is a module, validate its module-specific properties
            if (element.type === 'module') {
                // Modules must have a moduleType that references a definition
                if (!element.moduleType) {
                    console.error(`Module ${element.id} is missing required moduleType property`);
                    return false;
                }
                // If moduleDefinitions exist, check that moduleType references a valid definition
                if (data.moduleDefinitions && !data.moduleDefinitions[element.moduleType]) {
                    console.error(`Module ${element.id} references undefined module type: ${element.moduleType}`);
                    return false;
                }
                // Validate module inputs
                if (!element.inputs || typeof element.inputs !== 'object') {
                    console.error(`Module ${element.id} is missing required inputs object`);
                    return false;
                }
                // Check that inputs match the expected format for the module type
                if (data.moduleDefinitions && data.moduleDefinitions[element.moduleType]) {
                    const moduleDefinition = data.moduleDefinitions[element.moduleType];
                    // Check that all required inputs from the definition are provided
                    for (const inputDef of moduleDefinition.inputs) {
                        let inputName;
                        let inputSize = 1;
                        if (typeof inputDef === 'string') {
                            inputName = inputDef;
                        } else if (typeof inputDef === 'object' && inputDef.name) {
                            inputName = inputDef.name;
                            inputSize = inputDef.size || 1;
                        } else {
                            console.error(`Invalid input definition in module type ${element.moduleType}`);
                            return false; // Fail validation immediately on invalid input definition
                        }
                        // Check if this input is provided in the module instance
                        if (!element.inputs.hasOwnProperty(inputName)) {
                            console.error(`Module ${element.id} is missing required input: ${inputName}`);
                            return false;
                        }
                        // For vector inputs, check that an array of the correct size is provided
                        if (inputSize > 1) {
                            const input = element.inputs[inputName];
                            if (!Array.isArray(input)) {
                                console.error(`Module ${element.id} input ${inputName} should be an array of size ${inputSize}, got:`, input);
                                return false;
                            }
                            if (typeof input.length !== 'number') {
                                console.error(`Module ${element.id} input ${inputName} is not an array (missing length property):`, input);
                                return false;
                            }
                            if (input.length !== inputSize) {
                                console.error(`Module ${element.id} input ${inputName} has incorrect size: expected ${inputSize}, got ${input.length}`);
                                return false;
                            }
                            // Validate each connection in the array
                            for (const connection of input) {
                                if (typeof connection !== 'string' || !connection.includes('.')) {
                                    console.error(`Invalid connection format in module ${element.id} input ${inputName}: ${connection}`);
                                    return false;
                                }
                            }
                        } else {
                            // For scalar inputs, validate the connection string
                            const connection = element.inputs[inputName];
                            if (typeof connection !== 'string' || !connection.includes('.')) {
                                console.error(`Invalid connection format in module ${element.id} input ${inputName}: ${connection}`);
                                return false;
                            }
                        }
                    }
                }
            }
            // For primitives and regular elements
            else {
                // All non-input primitives must have inputs defined
                if (element.type !== 'input' && (!element.inputs || typeof element.inputs !== 'object')) {
                    console.error(`Non-input primitive missing inputs: ${element.id}`);
                    return false;
                }
                // Validate that each input references a valid format (elementId.portName)
                if (element.inputs) {
                    for (const [portName, connection] of Object.entries(element.inputs)) {
                        // Each connection string should be in format "elementId.portName"
                        if (typeof connection !== 'string' || !connection.includes('.')) {
                            console.error(`Invalid connection format in element ${element.id}: ${connection}`);
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }
    // Fall back to the original format validation (array of elements)
    if (!data || !Array.isArray(data)) {
        console.error('Diagram data must be an array');
        return false;
    }
    // Check that primitives and modules have required properties (legacy format)
    for (const element of data) {
        // Every element must have id and type properties
        if (!element.id || !element.type) {
            console.error(`Element missing required id or type: ${JSON.stringify(element)}`);
            return false;
        }
        // If element is a module, validate its module-specific properties
        if (element.type === 'module') {
            // Modules must have a moduleType
            if (!element.moduleType) {
                console.error(`Module ${element.id} is missing required moduleType property`);
                return false;
            }
            // Modules must have components array
            if (!element.components || !Array.isArray(element.components)) {
                console.error(`Module ${element.id} is missing required components array`);
                return false;
            }
            // Validate module components
            for (const component of element.components) {
                if (!component.id || !component.type) {
                    console.error(`Module component missing required id or type: ${JSON.stringify(component)}`);
                    return false;
                }
                // All non-input components must have inputs defined
                if (component.type !== 'input' && (!component.inputs || typeof component.inputs !== 'object')) {
                    console.error(`Non-input component missing inputs: ${component.id}`);
                    return false;
                }
                // Validate component inputs
                if (component.inputs) {
                    for (const [portName, connection] of Object.entries(component.inputs)) {
                        // Each connection string should be in format "primitiveId.portName" or "moduleId.portName"
                        if (typeof connection !== 'string' || !connection.includes('.')) {
                            console.error(`Invalid connection format in component ${component.id}: ${connection}`);
                            return false;
                        }
                    }
                }
            }
            // Modules must have outputs defined
            if (!element.outputs || typeof element.outputs !== 'object') {
                console.error(`Module ${element.id} is missing required outputs object`);
                return false;
            }
            // Validate output connections
            for (const [portName, connection] of Object.entries(element.outputs)) {
                if (typeof connection !== 'string' || !connection.includes('.')) {
                    console.error(`Invalid output connection format in module ${element.id}: ${connection}`);
                    return false;
                }
            }
        }
        // For primitives and regular elements
        else {
            // All non-input primitives must have inputs defined
            if (element.type !== 'input' && (!element.inputs || typeof element.inputs !== 'object')) {
                console.error(`Non-input primitive missing inputs: ${element.id}`);
                return false;
            }
            // Validate that each input references a valid format (elementId.portName)
            if (element.inputs) {
                for (const [portName, connection] of Object.entries(element.inputs)) {
                    // Each connection string should be in format "elementId.portName"
                    if (typeof connection !== 'string' || !connection.includes('.')) {
                        console.error(`Invalid connection format in element ${element.id}: ${connection}`);
                        return false;
                    }
                }
            }
        }
    }
    return true;
}
// --- End of isValidDiagramData ---

// Read the JSON file specified as a command-line argument
const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node validate-diagram.js <path-to-json>');
    process.exit(1);
}

let json;
try {
    json = fs.readFileSync(filePath, 'utf8');
} catch (e) {
    console.error('Could not read file:', e.message);
    process.exit(1);
}

let data;
try {
    data = JSON.parse(json);
} catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(1);
}

console.log('Validating:', filePath);
const valid = isValidDiagramData(data);
console.log('Validation result:', valid ? 'VALID' : 'INVALID'); 