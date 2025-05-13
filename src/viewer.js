/**
 * SchematicViewer - Neural Network Node Diagram Tool
 * Main visualization logic using D3.js
 */

// Global variables
let svg;
let diagram;
let zoom;
let lineGenerator;
let gridGroup;

// Grid configuration
const gridConfig = {
    visible: true,
    spacing: {
        x: 100, // Width of a clock cycle column
        y: 80   // Base row height (increased from 50 to 80)
    },
    color: '#e0e0e0',
    thickness: 1
};

// This file has been removed - we now require users to upload JSON files

// Initialize the viewer
document.addEventListener('DOMContentLoaded', () => {
    initializeSVG();
    setupEventListeners();

    // Display a message to prompt file upload
    showUploadPrompt();
});

// Display a message prompting for file upload
function showUploadPrompt() {
    // Clear any existing content
    diagram.selectAll('*').remove();

    // Add a text message in the center of the diagram
    diagram.append('text')
        .attr('x', 400)
        .attr('y', 180)
        .attr('text-anchor', 'middle')
        .style('font-size', '20px')
        .style('fill', '#666')
        .text('Please upload a diagram JSON file to begin');

    // Add additional instructions
    diagram.append('text')
        .attr('x', 400)
        .attr('y', 210)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#888')
        .text('Use the file input or drag & drop a JSON file anywhere');

    // Add example file suggestions
    diagram.append('text')
        .attr('x', 400)
        .attr('y', 240)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#888')
        .text('Example files in the /json directory:');

    diagram.append('text')
        .attr('x', 400)
        .attr('y', 260)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#3498db')
        .text('primitives_only.json - Simple primitives diagram');

    diagram.append('text')
        .attr('x', 400)
        .attr('y', 280)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#3498db')
        .text('module_definition.json - Advanced module-based diagram');
}

// Set up event listeners for controls
function setupEventListeners() {
    // File input change event
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', handleFileSelect);

    // Set up toggle controls button
    const toggleButton = document.getElementById('toggle-controls');
    const controlsPanel = document.getElementById('controls');

    // Set initial state (collapsed by default)
    toggleButton.classList.add('collapsed');
    controlsPanel.classList.add('collapsed');

    // Toggle controls visibility when button is clicked
    toggleButton.addEventListener('click', () => {
        toggleButton.classList.toggle('collapsed');
        controlsPanel.classList.toggle('collapsed');
    });

    // Set up drag and drop for diagram container
    setupDragAndDrop();

    // Set up zoom control buttons
    setupZoomControls();

    // Set up grid control event listeners
    setupGridControls();
}

// Set up grid control event listeners
function setupGridControls() {
    const gridToggle = document.getElementById('grid-toggle');
    const gridSpacing = document.getElementById('grid-spacing');

    // Grid visibility toggle
    if (gridToggle) {
        gridToggle.addEventListener('change', () => {
            gridConfig.visible = gridToggle.checked;
            renderGrid();
        });
    }

    // Grid spacing adjustment
    if (gridSpacing) {
        gridSpacing.addEventListener('change', () => {
            // Update spacing configuration
            const spacing = parseInt(gridSpacing.value, 10);
            if (!isNaN(spacing)) {
                gridConfig.spacing.x = spacing;
                
                // Re-render the grid with new spacing
                renderGrid();
                
                // If a diagram is currently displayed, re-render it with new positions
                if (diagram.selectAll('.primitive').size() > 0) {
                    // Get the current data
                    const primitives = diagram.selectAll('.primitive').data();
                    const connections = diagram.selectAll('.connection').data();
                    
                    // Clear existing content
                    diagram.selectAll('*').remove();
                    
                    // Re-render with new grid spacing
                    renderPrimitives(primitives);
                    renderConnections(connections);
                }
            }
        });
    }
}

// Set up zoom control buttons
function setupZoomControls() {
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomReset = document.getElementById('zoom-reset');

    if (zoomIn && zoomOut && zoomReset) {
        // Zoom in button
        zoomIn.addEventListener('click', () => {
            svg.transition()
               .duration(300)
               .call(zoom.scaleBy, 1.3); // 30% zoom in
        });

        // Zoom out button
        zoomOut.addEventListener('click', () => {
            svg.transition()
               .duration(300)
               .call(zoom.scaleBy, 0.7); // 30% zoom out
        });

        // Reset zoom button
        zoomReset.addEventListener('click', () => {
            svg.transition()
               .duration(500)
               .call(zoom.transform, d3.zoomIdentity.translate(50, 50).scale(1));
        });
    }
}

// Set up drag and drop functionality
function setupDragAndDrop() {
    const diagramContainer = document.getElementById('diagram-container');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        diagramContainer.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over
    ['dragenter', 'dragover'].forEach(eventName => {
        diagramContainer.addEventListener(eventName, highlight, false);
    });

    // Remove highlight when item is dragged out or dropped
    ['dragleave', 'drop'].forEach(eventName => {
        diagramContainer.addEventListener(eventName, unhighlight, false);
    });

    // Handle file drop
    diagramContainer.addEventListener('drop', handleDrop, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        diagramContainer.classList.add('drag-over');
    }

    function unhighlight() {
        diagramContainer.classList.remove('drag-over');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];

        if (file && file.name.endsWith('.json')) {
            // Process the file
            const reader = new FileReader();

            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (isValidDiagramData(data)) {
                        renderDiagram(data);
                    } else {
                        alert('Invalid diagram format. Please check the JSON structure.');
                    }
                } catch (error) {
                    alert('Error parsing JSON file: ' + error.message);
                    console.error('Error parsing JSON:', error);
                }
            };

            reader.onerror = function() {
                alert('Error reading file');
            };

            reader.readAsText(file);
        } else {
            alert('Please drop a JSON file');
        }
    }
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's a JSON file
    if (!file.name.endsWith('.json')) {
        alert('Please select a JSON file');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (isValidDiagramData(data)) {
                renderDiagram(data);
            } else {
                alert('Invalid diagram format. Please check the JSON structure.');
            }
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
            console.error('Error parsing JSON:', error);
        }
    };

    reader.onerror = function() {
        alert('Error reading file');
    };

    reader.readAsText(file);
}

// Validate diagram data for the simplified format with module support
function isValidDiagramData(data) {
    // Basic validation - ensure data is an array
    if (!data || !Array.isArray(data)) {
        console.error('Diagram data must be an array');
        return false;
    }

    // Check that primitives and modules have required properties
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

// Set up the SVG canvas with zoom and pan capabilities
function initializeSVG() {
    const container = document.getElementById('diagram-container');

    // Create the SVG element
    svg = d3.select('#diagram-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%');

    // Add a group for the grid - placed first to be in the background
    gridGroup = svg.append('g')
        .attr('class', 'grid')
        .attr('transform', 'translate(50, 50)'); // Same initial offset as diagram

    // Add a group for primitive/connection transformation
    diagram = svg.append('g')
        .attr('class', 'diagram')
        .attr('transform', 'translate(50, 50)'); // Add initial offset for better visibility

    // Set up enhanced zoom behavior with limits and transitions
    zoom = d3.zoom()
        .scaleExtent([0.2, 4]) // Set min and max zoom levels (0.2x to 4x)
        .extent([[0, 0], [container.clientWidth, container.clientHeight]])
        .on('zoom', (event) => {
            // Apply the zoom transform to both diagram and grid
            diagram.attr('transform', event.transform);
            gridGroup.attr('transform', event.transform);
        });

    // Apply zoom behavior to SVG
    svg.call(zoom)
       // Add double-click to reset
       .on('dblclick.zoom', () => {
           svg.transition()
              .duration(500)
              .call(zoom.transform, d3.zoomIdentity.translate(50, 50).scale(1));
       });

    // Initialize with a slight offset for better initial view
    svg.call(zoom.transform, d3.zoomIdentity.translate(50, 50).scale(1));

    // Add click handler on SVG background to deselect primitives
    svg.on('click', () => {
        diagram.selectAll('.primitive').classed('selected', false);
        clearHighlights();
    });

    // Initialize the line generator for connections
    lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y);
    
    // Render the grid
    renderGrid();
}

// Load and parse a diagram from JSON (for server-based usage)
function loadDiagram(url) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            renderDiagram(data);
        })
        .catch(error => {
            console.error('Error loading diagram:', error);
        });
}

// Calculate the clock cycle (horizontal position) for each element (primitive or module)
function determinePrimitiveCycles(elements) {
    // Create a map to store the cycle for each element
    const cycles = new Map();
    // Create a map to store elements by their IDs for quick lookup
    const elementsById = new Map();

    // First, build the elements lookup map (including both primitives and modules)
    elements.forEach(element => {
        elementsById.set(element.id, element);
    });

    // Function to calculate the cycle for an element
    function calculateCycle(element) {
        // If we've already calculated this element's cycle, return it
        if (cycles.has(element.id)) {
            return cycles.get(element.id);
        }

        // Input elements are always at cycle 0
        if (element.type === 'input') {
            cycles.set(element.id, 0);
            return 0;
        }

        // For modules, we need to handle their special structure
        if (element.type === 'module') {
            let maxInputCycle = -1;

            // Process all module inputs to find the maximum cycle
            if (element.inputs) {
                for (const [_, connection] of Object.entries(element.inputs)) {
                    // Connection format is "elementId.portName"
                    const sourceElementId = connection.split('.')[0];
                    const sourceElement = elementsById.get(sourceElementId);

                    if (sourceElement) {
                        const inputCycle = calculateCycle(sourceElement);
                        maxInputCycle = Math.max(maxInputCycle, inputCycle);
                    }
                }
            }

            // The module's cycle is one more than the maximum input cycle
            const cycle = maxInputCycle + 1;
            cycles.set(element.id, cycle);

            // For collapsed view, we don't need to calculate cycles for internal components
            // When expanded, we would need to handle internal component positioning differently

            return cycle;
        }

        // For regular primitives, find the maximum cycle of their inputs and add 1
        let maxInputCycle = -1;

        // Process all inputs to find the maximum cycle
        if (element.inputs) {
            for (const [_, connection] of Object.entries(element.inputs)) {
                // Connection format is "elementId.portName"
                const sourceElementId = connection.split('.')[0];
                const sourceElement = elementsById.get(sourceElementId);

                if (sourceElement) {
                    const inputCycle = calculateCycle(sourceElement);
                    maxInputCycle = Math.max(maxInputCycle, inputCycle);
                }
            }
        }

        // The element's cycle is one more than the maximum input cycle
        const cycle = maxInputCycle + 1;
        cycles.set(element.id, cycle);
        return cycle;
    }

    // Calculate cycles for all elements
    elements.forEach(element => {
        calculateCycle(element);
    });

    return cycles;
}

// Determine the vertical position for each element (primitive or module)
function determinePrimitiveRows(elements, cycles) {
    // Mixed approach: inputs in sequential rows, others based on average of inputs
    const yPositions = new Map();
    const elementsById = new Map();

    // Build the elements lookup map (including both primitives and modules)
    elements.forEach(element => {
        elementsById.set(element.id, element);
    });

    // First, position all inputs sequentially
    const inputElements = elements.filter(e => e.type === 'input');
    inputElements.forEach((element, index) => {
        yPositions.set(element.id, (index + 1) * gridConfig.spacing.y);
    });

    // Function to recursively calculate Y position for non-input elements
    function calculateNonInputYPosition(element) {
        // If already calculated, return it
        if (yPositions.has(element.id)) {
            return yPositions.get(element.id);
        }

        // For modules, special handling for vertical positioning
        if (element.type === 'module') {
            // If no inputs (should not happen for modules), use default position
            if (!element.inputs) {
                const yPos = gridConfig.spacing.y;
                yPositions.set(element.id, yPos);
                return yPos;
            }

            // Calculate average Y position of inputs
            let totalY = 0;
            let inputCount = 0;

            for (const [_, connection] of Object.entries(element.inputs)) {
                const sourceElementId = connection.split('.')[0];
                const sourceElement = elementsById.get(sourceElementId);

                if (sourceElement) {
                    // Recursively get Y position of input
                    const inputY = yPositions.has(sourceElement.id)
                        ? yPositions.get(sourceElement.id)
                        : calculateNonInputYPosition(sourceElement);

                    totalY += inputY;
                    inputCount++;
                }
            }

            // Modules should be given more vertical space
            const yPos = inputCount > 0 ? totalY / inputCount : gridConfig.spacing.y;
            yPositions.set(element.id, yPos);
            return yPos;
        }

        // Regular primitives (non-module, non-input)
        // If no inputs (should not happen for non-inputs), use default position
        if (!element.inputs) {
            const yPos = gridConfig.spacing.y;
            yPositions.set(element.id, yPos);
            return yPos;
        }

        // Calculate average Y position of inputs
        let totalY = 0;
        let inputCount = 0;

        for (const [_, connection] of Object.entries(element.inputs)) {
            const sourceElementId = connection.split('.')[0];
            const sourceElement = elementsById.get(sourceElementId);

            if (sourceElement) {
                // Recursively get Y position of input
                const inputY = yPositions.has(sourceElement.id)
                    ? yPositions.get(sourceElement.id)
                    : calculateNonInputYPosition(sourceElement);

                totalY += inputY;
                inputCount++;
            }
        }

        // Calculate average Y
        const yPos = inputCount > 0 ? totalY / inputCount : gridConfig.spacing.y;
        yPositions.set(element.id, yPos);
        return yPos;
    }

    // Calculate positions for all non-input elements
    elements.filter(e => e.type !== 'input').forEach(element => {
        calculateNonInputYPosition(element);
    });

    // Convert Y positions to row values
    const rows = new Map();
    elements.forEach(element => {
        rows.set(element.id, yPositions.get(element.id) / gridConfig.spacing.y);
    });

    return rows;
}

// Render the diagram from parsed JSON
function renderDiagram(data) {
    // Clear existing content
    diagram.selectAll('*').remove();

    // In the simplified format, the data is an array of primitives
    const primitives = data;
    
    // Determine clock cycles (x-positions) for each primitive
    const cycles = determinePrimitiveCycles(primitives);
    
    // Determine row positions (y-positions) for each primitive
    const rows = determinePrimitiveRows(primitives, cycles);
    
    // Add calculated positions to primitives
    primitives.forEach(primitive => {
        primitive.clock_cycle = cycles.get(primitive.id);
        primitive.position = {
            x: primitive.clock_cycle * gridConfig.spacing.x + gridConfig.spacing.x / 2,
            y: rows.get(primitive.id) * gridConfig.spacing.y
        };
    });
    
    // Extract connections from primitives
    const connections = extractConnections(primitives);
    
    // Render the diagram
    renderPrimitives(primitives);
    renderConnections(connections);
}

// Render primitives and modules as SVG elements
function renderPrimitives(elements) {
    // No need to reprocess elements as the clock_cycle and position
    // are already set in the renderDiagram function

    const elementElements = diagram.selectAll('.primitive')
        .data(elements)
        .enter()
        .append('g')
        .attr('class', d => `primitive primitive-${d.type}`)
        .attr('id', d => `primitive-${d.id}`)
        .attr('data-clock-cycle', d => d.clock_cycle) // Store clock cycle as data attribute
        .attr('data-is-module', d => d.type === 'module') // Mark modules for special handling
        .each(function(d) {
            // Calculate position based on clock cycle
            const pos = calculateClockCyclePosition(d);
            d3.select(this).attr('transform', `translate(${pos.x}, ${pos.y})`);
        });

    // Add rectangles for primitives and modules with different styling
    elementElements.append('rect')
        .attr('class', d => d.type === 'module' ? 'module-body' : 'primitive-body')
        .attr('width', d => {
            if (d.type === 'module') {
                return 120; // Modules are larger
            } else if (d.type === 'input' || d.type === 'output') {
                return 80;
            } else {
                return 60;
            }
        })
        .attr('height', d => {
            if (d.type === 'module') {
                return 80; // Modules are taller
            } else if (d.type === 'input' || d.type === 'output') {
                return 40;
            } else {
                return 60;
            }
        })
        .attr('x', d => {
            if (d.type === 'module') {
                return -60; // Center the module
            } else if (d.type === 'input' || d.type === 'output') {
                return -40;
            } else {
                return -30;
            }
        })
        .attr('y', d => {
            if (d.type === 'module') {
                return -40; // Center the module
            } else if (d.type === 'input' || d.type === 'output') {
                return -20;
            } else {
                return -30;
            }
        })
        .attr('rx', d => d.type === 'module' ? 8 : 5) // More rounded corners for modules
        .attr('ry', d => d.type === 'module' ? 8 : 5);

    // Add title bar for modules
    elementElements.filter(d => d.type === 'module')
        .append('rect')
        .attr('class', 'module-title-bar')
        .attr('width', 120)
        .attr('height', 20)
        .attr('x', -60)
        .attr('y', -40)
        .attr('rx', 8)
        .attr('ry', 8);

    // Add expand/collapse button for modules
    elementElements.filter(d => d.type === 'module')
        .append('circle')
        .attr('class', 'module-expand-button')
        .attr('cx', 50)
        .attr('cy', -30)
        .attr('r', 6)
        .on('click', (event, d) => {
            event.stopPropagation(); // Prevent propagation to module
            toggleModuleExpansion(d.id);
        });

    // Add plus symbol to the expand button
    elementElements.filter(d => d.type === 'module')
        .append('text')
        .attr('class', 'module-expand-icon')
        .attr('x', 50)
        .attr('y', -27)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text('+');

    // Add labels to elements - positioned precisely for crisp rendering
    elementElements.append('text')
        .attr('class', d => {
            if (d.type === 'module') {
                return 'module-label';
            } else {
                return `primitive-label primitive-label-${d.type}`;
            }
        })
        .text(d => {
            // For modules, use the label or module type
            if (d.type === 'module') {
                return d.label || d.moduleType || d.id;
            }
            // Format labels based on primitive type
            else if (d.type === 'add') {
                return '+';
            } else if (d.type === 'mul') {
                return '×';
            } else if (d.type === 'relu2') {
                return 'ReLU²';
            } else if (d.type === 'clamp') {
                return 'clamp';
            } else if (d.type === 'reg') {
                return 'REG';
            } else if (d.type === 'input' || d.type === 'output') {
                // For input/output, use label or ID (typically x0, w0, y)
                return d.label || d.id;
            } else {
                return d.label || d.type || d.id;
            }
        })
        // Set vertical position based on element type for perfect alignment
        .attr('x', 0) // Center horizontally (text-anchor: middle handles this)
        .attr('y', d => {
            if (d.type === 'module') {
                return -25; // Position in the title bar for modules
            } else if (d.type === 'add' || d.type === 'mul') {
                return -3; // More adjustment for operation symbols
            } else if (d.type === 'input' || d.type === 'output') {
                return -2; // More adjustment for IO nodes
            } else {
                return -2; // Default adjustment
            }
        })
        // Additional fine-tuning with dy
        .attr('dy', '0em');

    // Add module type label for modules
    elementElements.filter(d => d.type === 'module')
        .append('text')
        .attr('class', 'module-type-label')
        .attr('x', 0)
        .attr('y', 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .text(d => d.moduleType || '');

    // Add input and output ports to elements (primitives and modules)
    addPrimitivePorts(elementElements);

    // Add interaction capabilities to elements
    elementElements.on('click', (event, d) => {
        event.stopPropagation(); // Prevent propagation to SVG background

        // Toggle selected class on the clicked element
        const isSelected = d3.select(event.currentTarget).classed('selected');

        // Remove selection from all elements first
        diagram.selectAll('.primitive').classed('selected', false);

        // If the element wasn't already selected, select it
        if (!isSelected) {
            d3.select(event.currentTarget).classed('selected', true);

            // Highlight connected paths
            highlightConnections(d.id);
        } else {
            // If it was already selected, deselect everything
            clearHighlights();
        }
    });

    // Add tooltip with element details on hover, including clock cycle and module-specific info
    elementElements.append('title')
        .text(d => {
            let tooltip = `Type: ${d.type}\nID: ${d.id}\nClock Cycle: ${d.clock_cycle}`;
            if (d.type === 'module') {
                tooltip += `\nModule Type: ${d.moduleType}`;
                tooltip += `\nComponents: ${d.components.length}`;
                tooltip += `\nDouble-click: Expand/collapse`;
            }
            return tooltip;
        });

    return elementElements;
}

// Toggle module expansion/collapse
function toggleModuleExpansion(moduleId) {
    console.log(`Toggle expansion for module: ${moduleId}`);

    // Get the module element
    const moduleElement = d3.select(`#primitive-${moduleId}`);

    // If the module is not found, return
    if (moduleElement.empty()) {
        console.error(`Module with ID ${moduleId} not found`);
        return;
    }

    // Check if the module is currently expanded
    const isExpanded = moduleElement.classed('expanded');

    // Toggle the expanded class
    moduleElement.classed('expanded', !isExpanded);

    // Update the expand/collapse button icon
    moduleElement.select('.module-expand-icon')
        .text(isExpanded ? '+' : '−'); // Unicode minus sign for collapse

    // Get the module data
    const moduleData = moduleElement.datum();

    if (isExpanded) {
        // Module is currently expanded, so collapse it

        // Remove the expanded module visualization (if any)
        d3.select(`#module-expanded-${moduleId}`).remove();

        // Display notification about implementation status
        console.log(`Module ${moduleId} collapsed`);
    } else {
        // Module is currently collapsed, so expand it

        // Display notification about future implementation
        const message = `
Expanded view for module "${moduleId}" will be fully implemented in the next phase.

This would show the internal structure:
- Module Type: ${moduleData.moduleType}
- Components: ${moduleData.components ? moduleData.components.length : 0}
- Inputs: ${moduleData.inputs ? Object.keys(moduleData.inputs).join(', ') : 'none'}
- Outputs: ${moduleData.outputs ? Object.keys(moduleData.outputs).join(', ') : 'none'}
`;

        alert(message);

        // Log to console for debugging
        console.log(`Module ${moduleId} expanded`);
        console.log('Module data:', moduleData);
    }
}

// Highlight connections related to a primitive
function highlightConnections(primitiveId) {
    // First, remove all highlights
    clearHighlights();

    // Get the primitive data
    const primitiveData = diagram.select(`#primitive-${primitiveId}`).datum();
    
    // Highlight connections where this primitive is source or target
    diagram.selectAll('.connection')
        .classed('highlighted', d => d.source === primitiveId || d.target === primitiveId);
    
    // If the primitive has a clock cycle, highlight that cycle column
    if (primitiveData && primitiveData.clock_cycle !== undefined) {
        highlightClockCycle(primitiveData.clock_cycle);
    }
}

// Clear all highlights
function clearHighlights() {
    diagram.selectAll('.connection').classed('highlighted', false);
    gridGroup.selectAll('.grid-line-vertical').classed('highlighted', false);
}

// Highlight a specific clock cycle column
function highlightClockCycle(cycleIndex) {
    // Highlight the vertical grid line for this clock cycle
    gridGroup.selectAll('.grid-line-vertical')
        .classed('highlighted', (d, i) => i === cycleIndex);
}

// Add input and output ports to primitives and modules
function addPrimitivePorts(elementElements) {
    const portRadius = 5;

    // Add ports based on element type
    elementElements.each(function(d) {
        const element = d3.select(this);
        const elementType = d.type;

        // Determine the element dimensions based on its type
        let width, height, xOffset, yOffset;

        if (elementType === 'module') {
            width = 120;
            height = 80;
            xOffset = -60;
            yOffset = -40;
        } else if (elementType === 'input' || elementType === 'output') {
            width = 80;
            height = 40;
            xOffset = -40;
            yOffset = -20;
        } else {
            width = 60;
            height = 60;
            xOffset = -30;
            yOffset = -30;
        }

        // Add ports based on element type
        if (elementType === 'input') {
            // Input elements only have output ports
            addOutputPort(element, width + xOffset, 0, d.id, 'out');
        }
        else if (elementType === 'output') {
            // Output elements only have input ports
            addInputPort(element, xOffset, 0, d.id, 'in');
        }
        else if (elementType === 'add' || elementType === 'mul') {
            // Add elements have two inputs and one output
            addInputPort(element, xOffset, -10, d.id, 'in1');
            addInputPort(element, xOffset, 10, d.id, 'in2');
            addOutputPort(element, width + xOffset, 0, d.id, 'out');
        }
        else if (elementType === 'relu2' || elementType === 'clamp' || elementType === 'reg') {
            // ReLU, clamp, and reg have one input and one output
            addInputPort(element, xOffset, 0, d.id, 'in');
            addOutputPort(element, width + xOffset, 0, d.id, 'out');
        }
        else if (elementType === 'module') {
            // For modules, add ports based on their inputs and outputs definitions

            // Determine the number of inputs and their positions
            const inputPorts = d.inputs ? Object.keys(d.inputs) : [];
            const inputSpacing = inputPorts.length > 1 ? height / (inputPorts.length + 1) : height / 2;

            // Add input ports
            inputPorts.forEach((portId, index) => {
                const y = -height/2 + (index + 1) * inputSpacing;
                addInputPort(element, xOffset, y, d.id, portId);

                // Add port label
                element.append('text')
                    .attr('class', 'port-label')
                    .attr('x', xOffset + 12)
                    .attr('y', y)
                    .attr('text-anchor', 'start')
                    .attr('font-size', '8px')
                    .attr('dominant-baseline', 'middle')
                    .text(portId);
            });

            // Determine the number of outputs and their positions
            const outputPorts = d.outputs ? Object.keys(d.outputs) : [];
            const outputSpacing = outputPorts.length > 1 ? height / (outputPorts.length + 1) : height / 2;

            // Add output ports
            outputPorts.forEach((portId, index) => {
                const y = -height/2 + (index + 1) * outputSpacing;
                addOutputPort(element, width + xOffset, y, d.id, portId);

                // Add port label
                element.append('text')
                    .attr('class', 'port-label')
                    .attr('x', width + xOffset - 12)
                    .attr('y', y)
                    .attr('text-anchor', 'end')
                    .attr('font-size', '8px')
                    .attr('dominant-baseline', 'middle')
                    .text(portId);
            });
        }
    });

    // Function to add an input port to an element
    function addInputPort(element, x, y, elementId, portId) {
        // Create a port group to hold the port circle and label
        const portGroup = element.append('g')
            .attr('class', 'port-group');

        // Add the port circle
        portGroup.append('circle')
            .attr('class', 'port port-input')
            .attr('id', `port-${elementId}-${portId}`)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', portRadius)
            .append('title')
            .text(`Input: ${portId}`);
    }

    // Function to add an output port to an element
    function addOutputPort(element, x, y, elementId, portId) {
        // Create a port group to hold the port circle and label
        const portGroup = element.append('g')
            .attr('class', 'port-group');

        // Add the port circle
        portGroup.append('circle')
            .attr('class', 'port port-output')
            .attr('id', `port-${elementId}-${portId}`)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', portRadius)
            .append('title')
            .text(`Output: ${portId}`);
    }
}

// Extract connections from element (primitive or module) inputs
function extractConnections(elements) {
    const connections = [];

    // Process regular element connections
    elements.forEach(element => {
        if (element.inputs) {
            for (const [targetPort, sourceConnection] of Object.entries(element.inputs)) {
                // Parse the source connection (format: "elementId.portName")
                const [sourceElementId, sourcePort] = sourceConnection.split('.');

                // Create a connection object
                connections.push({
                    source: sourceElementId,
                    target: element.id,
                    sourcePort: sourcePort,
                    targetPort: targetPort
                });
            }
        }

        // If this is a module, we don't extract internal connections for collapsed view
        // Internal connections will be handled when expanded
    });

    return connections;
}

// Render connections between primitives
function renderConnections(connections) {
    // Create connections
    const connectionElements = diagram.selectAll('.connection')
        .data(connections)
        .enter()
        .append('path')
        .attr('class', 'connection')
        .attr('id', (d, i) => `connection-${i}`);

    // Update connection paths
    updateConnectionPaths(connectionElements);

    return connectionElements;
}

// Update connection paths based on primitive positions
function updateConnectionPaths(connectionElements) {
    connectionElements.each(function(d) {
        const connection = d3.select(this);

        // Get source and target primitives
        const sourcePrimitive = d3.select(`#primitive-${d.source}`);
        const targetPrimitive = d3.select(`#primitive-${d.target}`);

        if (sourcePrimitive.empty() || targetPrimitive.empty()) {
            console.warn(`Connection ${d.source} -> ${d.target} references non-existent primitive(s)`);
            return;
        }

        // Determine source and target ports
        const sourcePort = d3.select(`#port-${d.source}-${d.sourcePort || 'out'}`);
        const targetPort = d3.select(`#port-${d.target}-${d.targetPort || 'in'}`);

        if (sourcePort.empty() || targetPort.empty()) {
            console.warn(`Connection ports not found for ${d.source}:${d.sourcePort} -> ${d.target}:${d.targetPort}`);

            // Fall back to using primitive positions if ports are not found
            const sourceData = d3.select(sourcePrimitive.node()).datum();
            const targetData = d3.select(targetPrimitive.node()).datum();

            if (!sourceData || !targetData) {
                console.warn(`Connection data not found for ${d.source} -> ${d.target}`);
                return;
            }

            // Create the path data using the primitive positions as fallback
            const pathData = lineGenerator([
                { x: sourceData.position.x, y: sourceData.position.y },
                { x: targetData.position.x, y: targetData.position.y }
            ]);

            connection.attr('d', pathData);
            return;
        }

        // Get port positions in global coordinates
        const sourcePortPos = getPortPosition(sourcePort, sourcePrimitive);
        const targetPortPos = getPortPosition(targetPort, targetPrimitive);

        // Create a path with a slight curve
        const dx = targetPortPos.x - sourcePortPos.x;
        const dy = targetPortPos.y - sourcePortPos.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // Curve factor

        // Determine if we should use a curved or straight line
        let pathData;
        if (Math.abs(dx) > 80 || Math.abs(dy) > 60) {
            // Use a straight line for connections that are far apart
            pathData = lineGenerator([
                { x: sourcePortPos.x, y: sourcePortPos.y },
                { x: targetPortPos.x, y: targetPortPos.y }
            ]);
        } else {
            // Use a curved line for connections that are close
            pathData = `M${sourcePortPos.x},${sourcePortPos.y} A${dr},${dr} 0 0,1 ${targetPortPos.x},${targetPortPos.y}`;
        }

        // Set the path
        connection.attr('d', pathData);

        // Add arrow marker
        addArrows(connection);
    });

    // Helper function to calculate port position in global coordinates
    function getPortPosition(port, primitive) {
        if (port.empty() || primitive.empty()) {
            return { x: 0, y: 0 };
        }

        // Get the port's local coordinates
        const cx = +port.attr('cx');
        const cy = +port.attr('cy');

        // Get the primitive's transform
        const transform = getTransform(primitive);

        // Return the port's global coordinates
        return {
            x: cx + transform.x,
            y: cy + transform.y
        };
    }

    // Helper function to extract the transform values
    function getTransform(element) {
        const transformStr = element.attr('transform');
        const match = transformStr.match(/translate\(([^,]+),\s*([^)]+)\)/);

        if (match) {
            return {
                x: parseFloat(match[1]),
                y: parseFloat(match[2])
            };
        }

        return { x: 0, y: 0 };
    }
}

// Parse the transform attribute to get x,y coordinates
function parseTransform(transform) {
    const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
    if (match) {
        return {
            x: parseFloat(match[1]),
            y: parseFloat(match[2])
        };
    }
    return { x: 0, y: 0 };
}

// Add arrow markers to connections
function addArrows(connection) {
    // Arrow implementation will be refined in future phases
    const markerId = 'arrow';

    // Add marker definition if it doesn't exist
    if (svg.select(`#${markerId}`).empty()) {
        svg.append('defs')
            .append('marker')
            .attr('id', markerId)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 13) // Position further from the end to account for port radius
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('class', 'connection-arrow');
    }

    // Apply marker to connection
    connection.attr('marker-end', `url(#${markerId})`);
}

// Render the grid system based on clock cycles
function renderGrid() {
    // Clear any existing grid
    gridGroup.selectAll('*').remove();
    
    if (!gridConfig.visible) return;
    
    const container = document.getElementById('diagram-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Calculate grid size - add extra to ensure it extends beyond viewport
    const cols = Math.ceil(width / gridConfig.spacing.x) + 5;
    const rows = Math.ceil(height / gridConfig.spacing.y) + 5;
    
    // Create vertical lines for clock cycles
    const verticalLines = gridGroup.selectAll('.grid-line-vertical')
        .data(d3.range(cols))
        .enter()
        .append('line')
        .attr('class', 'grid-line grid-line-vertical')
        .attr('x1', d => d * gridConfig.spacing.x)
        .attr('y1', -gridConfig.spacing.y) // Start above the visible area
        .attr('x2', d => d * gridConfig.spacing.x)
        .attr('y2', rows * gridConfig.spacing.y)
        .attr('stroke', gridConfig.color)
        .attr('stroke-width', gridConfig.thickness);
    
    // Create horizontal lines for rows
    const horizontalLines = gridGroup.selectAll('.grid-line-horizontal')
        .data(d3.range(rows))
        .enter()
        .append('line')
        .attr('class', 'grid-line grid-line-horizontal')
        .attr('x1', -gridConfig.spacing.x) // Start to the left of visible area
        .attr('y1', d => d * gridConfig.spacing.y)
        .attr('x2', cols * gridConfig.spacing.x)
        .attr('y2', d => d * gridConfig.spacing.y)
        .attr('stroke', gridConfig.color)
        .attr('stroke-width', gridConfig.thickness);
    
    // Add clock cycle labels
    const clockLabels = gridGroup.selectAll('.clock-cycle-label')
        .data(d3.range(cols))
        .enter()
        .append('text')
        .attr('class', 'clock-cycle-label')
        .attr('x', d => d * gridConfig.spacing.x + gridConfig.spacing.x / 2)
        .attr('y', -5) // Position above the grid
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text(d => `c${d}`);
}

// Get primitive position (now all primitives have calculated positions)
function calculateClockCyclePosition(primitive) {
    // All primitives now have position calculated in renderDiagram
    return primitive.position;
}