const fs = require('fs');
const path = require('path');

// --- Paste the isValidDiagramData function from src/viewer.js below ---
function isValidDiagramData(data) {
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

    // 2. Validate Each Module Definition in moduleDefinitions
    for (const [moduleName, definition] of Object.entries(data.moduleDefinitions)) {
        if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
            console.error(`Module definition for "${moduleName}" must be an object.`);
            return false;
        }

        // 2a. Validate module interface properties (inputs, outputs, components, outputMappings)
        if (!Array.isArray(definition.inputs)) {
            console.error(`Module definition "${moduleName}" must have an "inputs" array (can be empty).`);
            return false;
        }
        for (const inputDef of definition.inputs) {
            if (typeof inputDef === 'string' && inputDef) {
                // valid simple name
            } else if (typeof inputDef === 'object' && inputDef !== null && typeof inputDef.name === 'string' && inputDef.name) {
                if (inputDef.hasOwnProperty('size') && (typeof inputDef.size !== 'number' || inputDef.size < 1 || !Number.isInteger(inputDef.size))) {
                    console.error(`Invalid size for input "${inputDef.name}" in module "${moduleName}". Must be a positive integer.`);
                    return false;
                }
            } else {
                console.error(`Invalid input definition in module "${moduleName}": ${JSON.stringify(inputDef)}. Must be a non-empty string or an object {name: string, size?: positive_integer}.`);
                return false;
            }
        }

        if (!Array.isArray(definition.outputs)) {
            console.error(`Module definition "${moduleName}" must have an "outputs" array (can be empty).`);
            return false;
        }
        for (const outputName of definition.outputs) {
            if (typeof outputName !== 'string' || !outputName) {
                console.error(`Invalid output name in module "${moduleName}": "${outputName}". Must be a non-empty string.`);
                return false;
            }
        }

        if (!Array.isArray(definition.components)) {
            console.error(`Module definition "${moduleName}" must have a "components" array (can be empty).`);
            return false;
        }

        if (!definition.outputMappings || typeof definition.outputMappings !== 'object' || Array.isArray(definition.outputMappings)) {
            console.error(`Module definition "${moduleName}" must have an "outputMappings" object (can be empty).`);
            return false;
        }
        for (const [portName, connection] of Object.entries(definition.outputMappings)) {
            if (!definition.outputs.includes(portName)) {
                console.error(`Output mapping for "${portName}" in module "${moduleName}" does not correspond to a defined output port in its "outputs" array.`);
                return false;
            }
            if (typeof connection !== 'string' || !connection.includes('.') || connection.startsWith('$.')) {
                console.error(`Invalid output mapping connection "${connection}" for port "${portName}" in module "${moduleName}". Must be "componentId.portName" referring to an internal component.`);
                return false;
            }
            const [componentId] = connection.split('.');
            if (!definition.components.some(c => c.id === componentId)) {
                 console.error(`Output mapping connection "${connection}" for port "${portName}" in module "${moduleName}" refers to a non-existent internal component "${componentId}".`);
                 return false;
            }
        }

        // 2b. Validate components within the current module definition
        const moduleComponents = definition.components;
        for (const component of moduleComponents) {
            if (!component || typeof component !== 'object' || Array.isArray(component)) {
                console.error(`Component in module "${moduleName}" must be an object. Found: ${JSON.stringify(component)}`);
                return false;
            }
            if (typeof component.id !== 'string' || !component.id) {
                console.error(`Component in module "${moduleName}" is missing a valid "id".`);
                return false;
            }
            if (typeof component.type !== 'string' || !component.type) {
                console.error(`Component "${component.id}" in module "${moduleName}" is missing a valid "type".`);
                return false;
            }

            // 2b.i. If component is a module instance (submodule)
            if (component.type === 'module') {
                if (typeof component.moduleType !== 'string' || !component.moduleType) {
                    console.error(`Submodule instance "${component.id}" in module "${moduleName}" is missing "moduleType".`);
                    return false;
                }
                if (!data.moduleDefinitions[component.moduleType]) {
                    console.error(`Submodule instance "${component.id}" in module "${moduleName}" references undefined moduleType "${component.moduleType}".`);
                    return false;
                }
                if (!component.inputs || typeof component.inputs !== 'object' || Array.isArray(component.inputs)) {
                    console.error(`Submodule instance "${component.id}" in module "${moduleName}" must have an "inputs" object.`);
                    return false;
                }

                const subModuleDef = data.moduleDefinitions[component.moduleType];
                for (const subInputDef of subModuleDef.inputs) {
                    let subInputName, subInputSize = 1;
                    if (typeof subInputDef === 'string') {
                        subInputName = subInputDef;
                    } else {
                        subInputName = subInputDef.name;
                        subInputSize = subInputDef.size || 1;
                    }

                    if (!component.inputs.hasOwnProperty(subInputName)) {
                        console.error(`Submodule instance "${component.id}" (type "${component.moduleType}") in module "${moduleName}" is missing required input "${subInputName}".`);
                        return false;
                    }

                    const providedInput = component.inputs[subInputName];
                    if (subInputSize > 1) {
                        if (!Array.isArray(providedInput) || providedInput.length !== subInputSize) {
                            console.error(`Input "${subInputName}" for submodule "${component.id}" (type "${component.moduleType}") in module "${moduleName}" expects an array of size ${subInputSize}, but got: ${JSON.stringify(providedInput)}`);
                            return false;
                        }
                        for (const conn of providedInput) {
                            if (typeof conn !== 'string' || !conn.includes('.') || conn.startsWith('$.')) {
                                console.error(`Invalid connection string "${conn}" for vector input "${subInputName}" of submodule "${component.id}" in module "${moduleName}". Must be "parentId.portName".`);
                                return false;
                            }
                        }
                    } else {
                        if (typeof providedInput !== 'string' || !providedInput.includes('.') || providedInput.startsWith('$.')) {
                            console.error(`Invalid connection string "${providedInput}" for scalar input "${subInputName}" of submodule "${component.id}" in module "${moduleName}". Must be "parentId.portName".`);
                            return false;
                        }
                    }
                }
            }
            // 2b.ii. Else (primitive component inside a module definition)
            else {
                if (component.type !== 'input') {
                    if (component.inputs === undefined) {
                        // No inputs property, this is fine for some primitives or if they are implicitly defined.
                    } else if (component.inputs === null || typeof component.inputs !== 'object' || Array.isArray(component.inputs)) {
                        console.error(`Primitive "${component.id}" (type "${component.type}") in module "${moduleName}" has invalid "inputs" property. Expected an object or undefined. Got: ${JSON.stringify(component.inputs)}`);
                        return false;
                    } else { // component.inputs is an object
                        for (const [port, conn] of Object.entries(component.inputs)) {
                            if (typeof conn !== 'string' || (!conn.includes('.') && !conn.startsWith('$.'))) {
                                console.error(`Invalid connection string "${conn}" for input port "${port}" of primitive "${component.id}" in module "${moduleName}".`);
                                return false;
                            }
                            if (conn.startsWith('$.')) {
                                const refMatch = conn.match(/\$\.([a-zA-Z0-9_]+)(?:\[(\d+)\])?/);
                                if (!refMatch) {
                                    console.error(`Malformed module input reference "${conn}" for primitive "${component.id}" in module "${moduleName}".`);
                                    return false;
                                }
                                const inputName = refMatch[1];
                                const inputIndexStr = refMatch[2];
                                const parentModuleInputDef = definition.inputs.find(inp => (typeof inp === 'string' && inp === inputName) || (typeof inp === 'object' && inp.name === inputName));
                                if (!parentModuleInputDef) {
                                    console.error(`Primitive "${component.id}" in module "${moduleName}" references non-existent module input "${inputName}" via "${conn}".`);
                                    return false;
                                }
                                if (inputIndexStr) {
                                    const inputIndex = parseInt(inputIndexStr, 10);
                                    if (typeof parentModuleInputDef !== 'object' || !parentModuleInputDef.size || parentModuleInputDef.size <= inputIndex) {
                                        console.error(`Index out of bounds or non-vector access for module input reference "${conn}" in primitive "${component.id}", module "${moduleName}". Max index: ${parentModuleInputDef.size ? parentModuleInputDef.size -1 : 'N/A'}.`);
                                        return false;
                                    }
                                } else {
                                     if (typeof parentModuleInputDef === 'object' && parentModuleInputDef.size && parentModuleInputDef.size > 1) {
                                        console.error(`Attempt to use vector module input "${inputName}" as scalar in primitive "${component.id}", module "${moduleName}" via "${conn}". Use indexed access like ${inputName}[0].`);
                                        return false;
                                     }
                                }
                            } else if (conn.includes('.')) {
                                const [sourceCompId] = conn.split('.');
                                if (!moduleComponents.some(c => c.id === sourceCompId)) {
                                    console.error(`Primitive "${component.id}" in module "${moduleName}" references non-existent component "${sourceCompId}" via "${conn}".`);
                                    return false;
                                }
                            }
                        }
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