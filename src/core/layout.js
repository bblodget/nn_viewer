/**
 * Layout module
 * Calculates component positions based on clock cycles and signal flow
 */

/**
 * Layout engine for calculating component positions
 */
export class Layout {
    constructor() {
        // Default layout configuration
        this.config = {
            moduleSpacing: 10,  // Additional spacing between modules
            defaultHeight: 60,  // Default height for modules
            minPortSpacing: 20, // Minimum spacing between ports
            compressFactor: 0.6 // Compression factor for compressed mode
        };
    }
    
    /**
     * Calculate layout for a module and all its components
     * @param {Module} module - The module to lay out
     * @param {object} gridConfig - Grid configuration
     * @param {boolean} compressed - Whether to use compressed mode
     */
    calculateModuleLayout(module, gridConfig, compressed = false) {
        const components = module.getComponents();
        
        // Calculate clock cycles (horizontal positions)
        const cycles = this.determineCycles(components);
        
        // Calculate rows (vertical positions)
        const rows = this.determineRows(components, cycles);
        
        // Add calculated positions to components
        components.forEach(component => {
            component.cycle = cycles.get(component.id) || 0;
            
            // Horizontal position based on clock cycle
            let x = component.cycle * gridConfig.spacing.x + gridConfig.spacing.x / 2;
            
            // For compressed mode, apply compression to non-critical components
            if (compressed && this.canCompress(component)) {
                x *= this.config.compressFactor;
            }
            
            // Vertical position based on row
            const y = (rows.get(component.id) || 1) * gridConfig.spacing.y;
            
            // Set final position
            component.position = { x, y };
        });
        
        // Calculate module width and height
        const maxCycle = Math.max(...cycles.values(), 0);
        
        module.width = (maxCycle + 1) * gridConfig.spacing.x;
        module.height = Math.max(...rows.values(), 1) * gridConfig.spacing.y * 1.5;
        
        // Arrange ports based on port groups
        this.arrangeModulePorts(module, gridConfig);
    }
    
    /**
     * Determine if a component can be compressed in compressed mode
     * @param {object} component - The component to check
     * @returns {boolean} Whether the component can be compressed
     */
    canCompress(component) {
        // Components on the critical path should not be compressed
        return !component.isCriticalPath;
    }
    
    /**
     * Calculate the clock cycle (horizontal position) for each component
     * @param {Array} components - The components to calculate cycles for
     * @returns {Map} Map of component IDs to cycle numbers
     */
    determineCycles(components) {
        // Create a map to store the cycle for each component
        const cycles = new Map();
        
        // Create a map to store components by their IDs for quick lookup
        const componentsById = new Map();
        
        // Build the components lookup map
        components.forEach(component => {
            componentsById.set(component.id, component);
        });
        
        // Function to calculate the cycle for a component
        const calculateCycle = (component) => {
            // If we've already calculated this component's cycle, return it
            if (cycles.has(component.id)) {
                return cycles.get(component.id);
            }
            
            // Input components are always at cycle 0
            if (component.type === 'input') {
                cycles.set(component.id, 0);
                return 0;
            }
            
            // For all other components, find the maximum cycle of their inputs and add component latency
            let maxInputCycle = -1;
            let latency = component.latency || 1; // Default latency is 1
            
            // If this is a register, latency is always 1
            if (component.type === 'reg') {
                latency = 1;
            }
            
            // Process all inputs to find the maximum cycle
            if (component.inputs) {
                for (const [_, connection] of Object.entries(component.inputs)) {
                    // Extract the source component ID, accounting for indexed ports
                    const sourceRef = this.parseConnectionReference(connection);
                    
                    if (sourceRef && sourceRef.componentId) {
                        const sourceComponent = componentsById.get(sourceRef.componentId);
                        
                        if (sourceComponent) {
                            const inputCycle = calculateCycle(sourceComponent);
                            maxInputCycle = Math.max(maxInputCycle, inputCycle);
                        }
                    }
                }
            }
            
            // The component's cycle is max input cycle plus its latency
            const cycle = maxInputCycle + latency;
            cycles.set(component.id, cycle);
            return cycle;
        };
        
        // Calculate cycles for all components
        components.forEach(component => {
            calculateCycle(component);
        });
        
        return cycles;
    }
    
    /**
     * Calculate the row (vertical position) for each component
     * @param {Array} components - The components to calculate rows for
     * @param {Map} cycles - Map of component IDs to cycle numbers
     * @returns {Map} Map of component IDs to row numbers
     */
    determineRows(components, cycles) {
        // Create a map to store the row for each component
        const rows = new Map();
        
        // Create a map to store components by their IDs for quick lookup
        const componentsById = new Map();
        
        // Build the components lookup map
        components.forEach(component => {
            componentsById.set(component.id, component);
        });
        
        // 1. Position input components first
        const inputComponents = components.filter(c => c.type === 'input');
        
        // Group inputs by cycle
        const inputsByCycle = new Map();
        inputComponents.forEach(component => {
            const cycle = cycles.get(component.id) || 0;
            if (!inputsByCycle.has(cycle)) {
                inputsByCycle.set(cycle, []);
            }
            inputsByCycle.get(cycle).push(component);
        });
        
        // Position inputs sequentially within each cycle
        inputsByCycle.forEach((cycleInputs, cycle) => {
            cycleInputs.forEach((component, index) => {
                rows.set(component.id, index + 1);
            });
        });
        
        // 2. Position output components
        const outputComponents = components.filter(c => c.type === 'output');
        
        // Group outputs by cycle
        const outputsByCycle = new Map();
        outputComponents.forEach(component => {
            const cycle = cycles.get(component.id) || 0;
            if (!outputsByCycle.has(cycle)) {
                outputsByCycle.set(cycle, []);
            }
            outputsByCycle.get(cycle).push(component);
        });
        
        // Position outputs sequentially within each cycle
        outputsByCycle.forEach((cycleOutputs, cycle) => {
            cycleOutputs.forEach((component, index) => {
                rows.set(component.id, index + 1);
            });
        });
        
        // Function to calculate the row for a non-input component
        const calculateRow = (component) => {
            // If we've already calculated this component's row, return it
            if (rows.has(component.id)) {
                return rows.get(component.id);
            }
            
            // For primitive processing components, position based on input average
            let totalY = 0;
            let inputCount = 0;
            
            // Process all inputs to find the average row
            if (component.inputs) {
                for (const [_, connection] of Object.entries(component.inputs)) {
                    // Extract the source component ID, accounting for indexed ports
                    const sourceRef = this.parseConnectionReference(connection);
                    
                    if (sourceRef && sourceRef.componentId) {
                        const sourceComponent = componentsById.get(sourceRef.componentId);
                        
                        if (sourceComponent) {
                            // Get row for source component
                            let sourceRow = rows.has(sourceComponent.id)
                                ? rows.get(sourceComponent.id)
                                : calculateRow(sourceComponent);
                            
                            totalY += sourceRow;
                            inputCount++;
                        }
                    }
                }
            }
            
            // Calculate average row
            let row = 1; // Default row
            
            if (inputCount > 0) {
                row = Math.round(totalY / inputCount);
            }
            
            // Store the row
            rows.set(component.id, row);
            return row;
        };
        
        // 3. Position all remaining components
        const processingComponents = components.filter(c => c.type !== 'input' && c.type !== 'output');
        
        // Group by cycle for cycle-based positioning
        const processingByCycle = new Map();
        
        processingComponents.forEach(component => {
            const cycle = cycles.get(component.id) || 0;
            if (!processingByCycle.has(cycle)) {
                processingByCycle.set(cycle, []);
            }
            processingByCycle.get(cycle).push(component);
        });
        
        // Calculate rows for processing components by cycle
        processingByCycle.forEach((cycleComponents, cycle) => {
            cycleComponents.forEach(component => {
                if (!rows.has(component.id)) {
                    calculateRow(component);
                }
            });
            
            // Check for overlaps within the same cycle
            this.resolveRowOverlaps(cycleComponents, rows);
        });
        
        return rows;
    }
    
    /**
     * Resolve overlaps between components in the same row and cycle
     * @param {Array} components - The components to check for overlaps
     * @param {Map} rows - Map of component IDs to row numbers
     */
    resolveRowOverlaps(components, rows) {
        // Group components by row
        const componentsByRow = new Map();
        
        components.forEach(component => {
            const row = rows.get(component.id) || 1;
            if (!componentsByRow.has(row)) {
                componentsByRow.set(row, []);
            }
            componentsByRow.get(row).push(component);
        });
        
        // Resolve overlaps for each row
        componentsByRow.forEach((rowComponents, row) => {
            if (rowComponents.length > 1) {
                // Shift components to avoid overlaps
                rowComponents.forEach((component, index) => {
                    if (index > 0) {
                        rows.set(component.id, row + index);
                    }
                });
            }
        });
    }
    
    /**
     * Arrange module ports based on port groups
     * @param {Module} module - The module to arrange ports for
     * @param {object} gridConfig - Grid configuration
     */
    arrangeModulePorts(module, gridConfig) {
        // Get inputs, outputs, and port groups
        const inputs = module.getInputs();
        const outputs = module.getOutputs();
        const portGroups = module.getPortGroups();
        
        // Calculate port positions based on module height and port groups
        const moduleHeight = module.height;
        
        // First, handle input ports
        if (inputs.length > 0) {
            this.arrangePortsByGroups(inputs, portGroups, moduleHeight, 'input');
        }
        
        // Then, handle output ports
        if (outputs.length > 0) {
            this.arrangePortsByGroups(outputs, portGroups, moduleHeight, 'output');
        }
    }
    
    /**
     * Arrange ports based on their groups
     * @param {Array} ports - The ports to arrange
     * @param {object} portGroups - The port groups
     * @param {number} moduleHeight - The module height
     * @param {string} portType - The port type ('input' or 'output')
     */
    arrangePortsByGroups(ports, portGroups, moduleHeight, portType) {
        if (!ports || ports.length === 0) {
            return;
        }
        
        // Group ports by their group ID
        const portsByGroup = new Map();
        const ungroupedPorts = [];
        
        // Initialize portsByGroup with existing groups
        if (portGroups) {
            Object.keys(portGroups).forEach(groupId => {
                portsByGroup.set(groupId, []);
            });
        }
        
        // Assign ports to their groups
        ports.forEach(port => {
            if (port.group && portsByGroup.has(port.group)) {
                portsByGroup.get(port.group).push(port);
            } else {
                ungroupedPorts.push(port);
            }
        });
        
        // Calculate the total number of groups and spacing
        const totalGroups = portsByGroup.size + (ungroupedPorts.length > 0 ? 1 : 0);
        const groupSpacing = moduleHeight / (totalGroups + 1);
        
        // Track current Y position
        let currentY = groupSpacing;
        
        // Arrange each group
        portsByGroup.forEach((groupPorts, groupId) => {
            if (groupPorts.length > 0) {
                const group = portGroups[groupId];
                this.arrangePortGroup(groupPorts, group, currentY, moduleHeight, portType);
                currentY += groupSpacing;
            }
        });
        
        // Arrange ungrouped ports
        if (ungroupedPorts.length > 0) {
            this.arrangeUngroupedPorts(ungroupedPorts, currentY, moduleHeight, portType);
        }
    }
    
    /**
     * Arrange ports within a group
     * @param {Array} ports - The ports to arrange
     * @param {object} group - The port group configuration
     * @param {number} startY - The starting Y position
     * @param {number} moduleHeight - The module height
     * @param {string} portType - The port type ('input' or 'output')
     */
    arrangePortGroup(ports, group, startY, moduleHeight, portType) {
        if (!ports || ports.length === 0) {
            return;
        }
        
        // Get arrangement style
        const arrangement = group?.arrangement || 'sequential';
        const spacing = group?.spacing || this.config.minPortSpacing;
        
        // Calculate port positions based on arrangement
        switch (arrangement) {
            case 'interleaved':
                this.arrangePortsInterleaved(ports, startY, spacing, portType);
                break;
            case 'alternating':
                this.arrangePortsAlternating(ports, startY, spacing, portType);
                break;
            case 'sequential':
            default:
                this.arrangePortsSequential(ports, startY, spacing, portType);
                break;
        }
    }
    
    /**
     * Arrange ungrouped ports
     * @param {Array} ports - The ports to arrange
     * @param {number} startY - The starting Y position
     * @param {number} moduleHeight - The module height
     * @param {string} portType - The port type ('input' or 'output')
     */
    arrangeUngroupedPorts(ports, startY, moduleHeight, portType) {
        if (!ports || ports.length === 0) {
            return;
        }
        
        // Arrange ungrouped ports sequentially
        this.arrangePortsSequential(ports, startY, this.config.minPortSpacing, portType);
    }
    
    /**
     * Arrange ports sequentially (one after another)
     * @param {Array} ports - The ports to arrange
     * @param {number} startY - The starting Y position
     * @param {number} spacing - The spacing between ports
     * @param {string} portType - The port type ('input' or 'output')
     */
    arrangePortsSequential(ports, startY, spacing, portType) {
        if (!ports || ports.length === 0) {
            return;
        }
        
        // Calculate the total height needed
        const totalHeight = (ports.length - 1) * spacing;
        const offsetY = startY - totalHeight / 2;
        
        // Position each port
        ports.forEach((port, index) => {
            port.position = {
                y: offsetY + index * spacing
            };
            
            // Set X position based on port type
            if (portType === 'input') {
                port.position.x = 0; // Left side for inputs
            } else {
                port.position.x = 1; // Right side for outputs
            }
        });
    }
    
    /**
     * Arrange ports interleaved (alternating from center)
     * @param {Array} ports - The ports to arrange
     * @param {number} startY - The starting Y position
     * @param {number} spacing - The spacing between ports
     * @param {string} portType - The port type ('input' or 'output')
     */
    arrangePortsInterleaved(ports, startY, spacing, portType) {
        if (!ports || ports.length === 0) {
            return;
        }
        
        // Calculate the total height needed
        const totalHeight = (Math.ceil(ports.length / 2) - 1) * spacing * 2;
        const offsetY = startY - totalHeight / 2;
        
        // Position each port
        ports.forEach((port, index) => {
            let yOffset;
            
            if (index % 2 === 0) {
                // Even indices go above the centerline
                yOffset = offsetY + Math.floor(index / 2) * spacing * 2;
            } else {
                // Odd indices go below the centerline
                yOffset = offsetY + Math.ceil(index / 2) * spacing * 2 - spacing;
            }
            
            port.position = {
                y: yOffset
            };
            
            // Set X position based on port type
            if (portType === 'input') {
                port.position.x = 0; // Left side for inputs
            } else {
                port.position.x = 1; // Right side for outputs
            }
        });
    }
    
    /**
     * Arrange ports alternating (pairs alternating up and down)
     * @param {Array} ports - The ports to arrange
     * @param {number} startY - The starting Y position
     * @param {number} spacing - The spacing between ports
     * @param {string} portType - The port type ('input' or 'output')
     */
    arrangePortsAlternating(ports, startY, spacing, portType) {
        if (!ports || ports.length === 0) {
            return;
        }
        
        // Calculate the total height needed
        const pairCount = Math.ceil(ports.length / 2);
        const totalHeight = (pairCount - 1) * spacing;
        const offsetY = startY - totalHeight / 2;
        
        // Position each port
        for (let i = 0; i < ports.length; i += 2) {
            const pair = i / 2;
            const baseY = offsetY + pair * spacing;
            
            // First port in pair
            ports[i].position = {
                y: baseY - spacing / 4
            };
            
            // Set X position based on port type
            if (portType === 'input') {
                ports[i].position.x = 0; // Left side for inputs
            } else {
                ports[i].position.x = 1; // Right side for outputs
            }
            
            // Second port in pair (if exists)
            if (i + 1 < ports.length) {
                ports[i + 1].position = {
                    y: baseY + spacing / 4
                };
                
                // Set X position based on port type
                if (portType === 'input') {
                    ports[i + 1].position.x = 0; // Left side for inputs
                } else {
                    ports[i + 1].position.x = 1; // Right side for outputs
                }
            }
        }
    }
    
    /**
     * Parse a connection reference to extract component ID and port
     * @param {string} connection - The connection reference (e.g., "componentId.portName[0]")
     * @returns {object|null} Object with componentId, portName, and index (if present), or null
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