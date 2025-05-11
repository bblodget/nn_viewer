/**
 * SchematicViewer - Neural Network Node Diagram Tool
 * Main visualization logic using D3.js
 */

// Global variables
let svg;
let diagram;
let zoom;
let lineGenerator;

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
        .text('Use the file input above to select a JSON netlist file');
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
    // Basic validation - ensure there are nodes and connections
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.connections)) {
        return false;
    }

    // Check that nodes have required properties
    for (const node of data.nodes) {
        if (!node.id || !node.type || !node.position ||
            typeof node.position.x !== 'number' ||
            typeof node.position.y !== 'number') {
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

    // Add a group for transformation
    diagram = svg.append('g')
        .attr('class', 'diagram')
        .attr('transform', 'translate(50, 50)'); // Add initial offset for better visibility

    // Set up zoom behavior (will be implemented in Phase 2)
    // This is a placeholder for now
    zoom = d3.zoom()
        .on('zoom', (event) => {
            diagram.attr('transform', event.transform);
        });

    // Apply zoom behavior to SVG
    svg.call(zoom);

    // Initialize the line generator for connections
    lineGenerator = d3.line()
        .x(d => d.x)
        .y(d => d.y);
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
    
    // Phase 1: Basic rendering implementation
    renderNodes(data.nodes || []);
    renderConnections(data.connections || []);
}

// Render nodes as SVG elements
function renderNodes(nodes) {
    const nodeElements = diagram.selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', d => `node node-${d.type}`)
        .attr('id', d => `node-${d.id}`)
        .attr('transform', d => `translate(${d.position.x}, ${d.position.y})`);

    // Add rectangles for nodes (different shapes can be implemented in Phase 3)
    nodeElements.append('rect')
        .attr('class', 'node-body')
        .attr('width', d => d.type === 'input' || d.type === 'output' ? 80 : 60)
        .attr('height', d => d.type === 'input' || d.type === 'output' ? 40 : 60)
        .attr('x', d => d.type === 'input' || d.type === 'output' ? -40 : -30)
        .attr('y', d => d.type === 'input' || d.type === 'output' ? -20 : -30)
        .attr('rx', 5)
        .attr('ry', 5);

    // Add labels to nodes
    nodeElements.append('text')
        .attr('class', 'node-label')
        .text(d => d.label || d.type || d.id)
        .attr('dy', 0);

    // Add input ports based on node type
    addNodePorts(nodeElements);

    return nodeElements;
}

// Add input and output ports to nodes
function addNodePorts(nodeElements) {
    const portRadius = 5;

    // Add ports based on node type
    nodeElements.each(function(d) {
        const node = d3.select(this);
        const nodeType = d.type;

        // Determine the node dimensions
        const width = nodeType === 'input' || nodeType === 'output' ? 80 : 60;
        const height = nodeType === 'input' || nodeType === 'output' ? 40 : 60;
        const xOffset = nodeType === 'input' || nodeType === 'output' ? -40 : -30;
        const yOffset = nodeType === 'input' || nodeType === 'output' ? -20 : -30;

        // Add ports based on node type
        if (nodeType === 'input') {
            // Input nodes only have output ports
            addOutputPort(node, width + xOffset, 0, d.id, 'out');
        }
        else if (nodeType === 'output') {
            // Output nodes only have input ports
            addInputPort(node, xOffset, 0, d.id, 'in');
        }
        else if (nodeType === 'add' || nodeType === 'mul') {
            // Add nodes have two inputs and one output
            addInputPort(node, xOffset, -10, d.id, 'in1');
            addInputPort(node, xOffset, 10, d.id, 'in2');
            addOutputPort(node, width + xOffset, 0, d.id, 'out');
        }
        else if (nodeType === 'relu2' || nodeType === 'clamp') {
            // ReLU and clamp have one input and one output
            addInputPort(node, xOffset, 0, d.id, 'in');
            addOutputPort(node, width + xOffset, 0, d.id, 'out');
        }
    });

    // Function to add an input port to a node
    function addInputPort(node, x, y, nodeId, portId) {
        node.append('circle')
            .attr('class', 'port port-input')
            .attr('id', `port-${nodeId}-${portId}`)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', portRadius)
            .append('title')
            .text(`Input: ${portId}`);
    }

    // Function to add an output port to a node
    function addOutputPort(node, x, y, nodeId, portId) {
        node.append('circle')
            .attr('class', 'port port-output')
            .attr('id', `port-${nodeId}-${portId}`)
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', portRadius)
            .append('title')
            .text(`Output: ${portId}`);
    }
}

// Render connections between nodes
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

// Update connection paths based on node positions
function updateConnectionPaths(connectionElements) {
    connectionElements.each(function(d) {
        const connection = d3.select(this);

        // Get source and target nodes
        const sourceNode = d3.select(`#node-${d.source}`);
        const targetNode = d3.select(`#node-${d.target}`);

        if (sourceNode.empty() || targetNode.empty()) {
            console.warn(`Connection ${d.source} -> ${d.target} references non-existent node(s)`);
            return;
        }

        // Determine source and target ports
        const sourcePort = d3.select(`#port-${d.source}-${d.sourcePort || 'out'}`);
        const targetPort = d3.select(`#port-${d.target}-${d.targetPort || 'in'}`);

        if (sourcePort.empty() || targetPort.empty()) {
            console.warn(`Connection ports not found for ${d.source}:${d.sourcePort} -> ${d.target}:${d.targetPort}`);

            // Fall back to using node positions if ports are not found
            const sourceData = d3.select(sourceNode.node()).datum();
            const targetData = d3.select(targetNode.node()).datum();

            if (!sourceData || !targetData) {
                console.warn(`Connection data not found for ${d.source} -> ${d.target}`);
                return;
            }

            // Create the path data using the node positions as fallback
            const pathData = lineGenerator([
                { x: sourceData.position.x, y: sourceData.position.y },
                { x: targetData.position.x, y: targetData.position.y }
            ]);

            connection.attr('d', pathData);
            return;
        }

        // Get port positions in global coordinates
        const sourcePortPos = getPortPosition(sourcePort, sourceNode);
        const targetPortPos = getPortPosition(targetPort, targetNode);

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
    function getPortPosition(port, node) {
        if (port.empty() || node.empty()) {
            return { x: 0, y: 0 };
        }

        // Get the port's local coordinates
        const cx = +port.attr('cx');
        const cy = +port.attr('cy');

        // Get the node's transform
        const transform = getTransform(node);

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

// Helper functions will be added as needed