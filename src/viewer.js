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
        y: 50   // Base row height
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
        .attr('y', 200)
        .attr('text-anchor', 'middle')
        .style('font-size', '20px')
        .style('fill', '#666')
        .text('Please upload a diagram.json file to begin');

    // Add additional instructions
    diagram.append('text')
        .attr('x', 400)
        .attr('y', 230)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('fill', '#888')
        .text('Use the file input or drag & drop a JSON file anywhere');
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

// Validate diagram data
function isValidDiagramData(data) {
    // Basic validation - ensure there are primitives and connections
    if (!data || !Array.isArray(data.primitives) || !Array.isArray(data.connections)) {
        return false;
    }

    // Check that primitives have required properties
    for (const primitive of data.primitives) {
        if (!primitive.id || !primitive.type || !primitive.position ||
            typeof primitive.position.x !== 'number' ||
            typeof primitive.position.y !== 'number') {
            return false;
        }

        // If clock_cycle is provided, ensure it's a number
        if (primitive.clock_cycle !== undefined && typeof primitive.clock_cycle !== 'number') {
            return false;
        }
    }

    // Check that connections have required properties
    for (const connection of data.connections) {
        if (!connection.source || !connection.target) {
            return false;
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

// Render the diagram from parsed JSON
function renderDiagram(data) {
    // Clear existing content
    diagram.selectAll('*').remove();

    // Basic rendering implementation
    renderPrimitives(data.primitives);
    renderConnections(data.connections);
}

// Render primitives as SVG elements
function renderPrimitives(primitives) {
    // Process the primitives to determine clock cycles if not specified
    const processedPrimitives = primitives.map(primitive => {
        // Clone the primitive to avoid modifying the original
        const processedPrimitive = {...primitive};
        
        // If the primitive doesn't have a clock_cycle, infer it based on position
        if (processedPrimitive.clock_cycle === undefined) {
            // Simple heuristic: assign clock cycle based on x position
            // Approximately map x position to clock cycle
            processedPrimitive.clock_cycle = Math.floor(processedPrimitive.position.x / gridConfig.spacing.x);
        }
        
        return processedPrimitive;
    });
    
    const primitiveElements = diagram.selectAll('.primitive')
        .data(processedPrimitives)
        .enter()
        .append('g')
        .attr('class', d => `primitive primitive-${d.type}`)
        .attr('id', d => `primitive-${d.id}`)
        .attr('data-clock-cycle', d => d.clock_cycle) // Store clock cycle as data attribute
        .each(function(d) {
            // Calculate position based on clock cycle
            const pos = calculateClockCyclePosition(d);
            d3.select(this).attr('transform', `translate(${pos.x}, ${pos.y})`);
        });

    // Add rectangles for primitives (different shapes can be implemented in Phase 3)
    primitiveElements.append('rect')
        .attr('class', 'primitive-body')
        .attr('width', d => d.type === 'input' || d.type === 'output' ? 80 : 60)
        .attr('height', d => d.type === 'input' || d.type === 'output' ? 40 : 60)
        .attr('x', d => d.type === 'input' || d.type === 'output' ? -40 : -30)
        .attr('y', d => d.type === 'input' || d.type === 'output' ? -20 : -30)
        .attr('rx', 5)
        .attr('ry', 5);

    // Add labels to primitives - positioned precisely for crisp rendering
    primitiveElements.append('text')
        .attr('class', d => `primitive-label primitive-label-${d.type}`)
        .text(d => {
            // Format labels based on primitive type
            if (d.type === 'add') {
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
        // Set vertical position based on primitive type for perfect alignment
        .attr('x', 0) // Center horizontally (text-anchor: middle handles this)
        .attr('y', d => {
            // Fine-tune vertical alignment based on primitive type
            if (d.type === 'add' || d.type === 'mul') {
                return -3; // More adjustment for operation symbols
            } else if (d.type === 'input' || d.type === 'output') {
                return -2; // More adjustment for IO nodes
            } else {
                return -2; // Default adjustment
            }
        })
        // Additional fine-tuning with dy
        .attr('dy', '0em');

    // Add input ports based on primitive type
    addPrimitivePorts(primitiveElements);

    // Add interaction capabilities to primitives
    primitiveElements.on('click', (event, d) => {
        event.stopPropagation(); // Prevent propagation to SVG background

        // Toggle selected class on the clicked primitive
        const isSelected = d3.select(event.currentTarget).classed('selected');

        // Remove selection from all primitives first
        diagram.selectAll('.primitive').classed('selected', false);

        // If the primitive wasn't already selected, select it
        if (!isSelected) {
            d3.select(event.currentTarget).classed('selected', true);

            // Highlight connected paths
            highlightConnections(d.id);
        } else {
            // If it was already selected, deselect everything
            clearHighlights();
        }
    });

    // Add tooltip with primitive details on hover, now including clock cycle
    primitiveElements.append('title')
        .text(d => `Type: ${d.type}\nID: ${d.id}\nClock Cycle: ${d.clock_cycle}`);

    return primitiveElements;
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

// Add input and output ports to primitives
function addPrimitivePorts(primitiveElements) {
    const portRadius = 5;

    // Add ports based on primitive type
    primitiveElements.each(function(d) {
        const primitive = d3.select(this);
        const primitiveType = d.type;

        // Determine the primitive dimensions
        const width = primitiveType === 'input' || primitiveType === 'output' ? 80 : 60;
        const height = primitiveType === 'input' || primitiveType === 'output' ? 40 : 60;
        const xOffset = primitiveType === 'input' || primitiveType === 'output' ? -40 : -30;
        const yOffset = primitiveType === 'input' || primitiveType === 'output' ? -20 : -30;

        // Add ports based on primitive type
        if (primitiveType === 'input') {
            // Input primitives only have output ports
            addOutputPort(primitive, width + xOffset, 0, d.id, 'out');
        }
        else if (primitiveType === 'output') {
            // Output primitives only have input ports
            addInputPort(primitive, xOffset, 0, d.id, 'in');
        }
        else if (primitiveType === 'add' || primitiveType === 'mul') {
            // Add primitives have two inputs and one output
            addInputPort(primitive, xOffset, -10, d.id, 'in1');
            addInputPort(primitive, xOffset, 10, d.id, 'in2');
            addOutputPort(primitive, width + xOffset, 0, d.id, 'out');
        }
        else if (primitiveType === 'relu2' || primitiveType === 'clamp' || primitiveType === 'reg') {
            // ReLU, clamp, and reg have one input and one output
            addInputPort(primitive, xOffset, 0, d.id, 'in');
            addOutputPort(primitive, width + xOffset, 0, d.id, 'out');
        }
    });

    // Function to add an input port to a primitive
    function addInputPort(primitive, x, y, primitiveId, portId) {
        // Create a port group to hold the port circle and label
        const portGroup = primitive.append('g')
            .attr('class', 'port-group');

        // Add the port circle
        portGroup.append('circle')
            .attr('class', 'port port-input')
            .attr('id', `port-${primitiveId}-${portId}`)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', portRadius)
            .append('title')
            .text(`Input: ${portId}`);
    }

    // Function to add an output port to a primitive
    function addOutputPort(primitive, x, y, primitiveId, portId) {
        // Create a port group to hold the port circle and label
        const portGroup = primitive.append('g')
            .attr('class', 'port-group');

        // Add the port circle
        portGroup.append('circle')
            .attr('class', 'port port-output')
            .attr('id', `port-${primitiveId}-${portId}`)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', portRadius)
            .append('title')
            .text(`Output: ${portId}`);
    }
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

// Calculate primitive position based on clock cycle
function calculateClockCyclePosition(primitive) {
    // If the primitive has a clock_cycle property, use it for x positioning
    if (primitive.clock_cycle !== undefined) {
        // Keep the original y position, but adjust x based on clock cycle
        return {
            x: primitive.clock_cycle * gridConfig.spacing.x + gridConfig.spacing.x / 2,
            y: primitive.position.y
        };
    }
    
    // If no clock_cycle is defined, use the original position
    return primitive.position;
}