/**
 * NNCircuit - Neural Network Schematic Diagram Tool
 * Main application entry point
 */

// Import core modules
import { Registry } from './core/registry';
import { Parser } from './core/parser';
import { ExpressionEvaluator } from './core/expressions';
import { Layout } from './core/layout';

// Import components
import { PrimitiveRegistry } from './components/primitives';
import Module from './components/module';
import Component from './components/component';

// Import rendering modules
import { SVGRenderer } from './renderer/svg';
import { GridRenderer } from './renderer/grid';
import { ConnectionRenderer } from './renderer/connections';

// Import UI modules
import { Navigation } from './ui/navigation';
import { Controls } from './ui/controls';
import { Inspector } from './ui/inspector';

/**
 * NNCircuit application class
 * The main class that coordinates all viewer functionality
 */
class NNCircuit {
    constructor() {
        this.svg = null;
        this.diagram = null;
        this.zoom = null;
        this.gridGroup = null;
        
        // Core components
        this.registry = new Registry();
        this.parser = new Parser();
        this.expressionEvaluator = new ExpressionEvaluator();
        this.layout = new Layout();
        
        // Rendering components
        this.svgRenderer = null;
        this.gridRenderer = null;
        this.connectionRenderer = null;
        
        // UI components
        this.navigation = null;
        this.controls = null;
        this.inspector = null;
        
        // Application state
        this.currentDiagramData = null;
        this.currentModule = null;
        this.moduleHistory = [];
        this.compressionMode = false;
        
        // Grid configuration
        this.gridConfig = {
            visible: true,
            spacing: {
                x: 100, // Width of a clock cycle column
                y: 80   // Base row height
            },
            color: '#e0e0e0',
            thickness: 1
        };
        
        // Register event handlers when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => this.initialize());
    }
    
    /**
     * Initialize the application
     */
    initialize() {
        console.log('Initializing NNCircuit v2.0.0');
        
        // Initialize SVG canvas
        this.initializeSVG();
        
        // Initialize core components
        this.initializeCore();
        
        // Initialize UI components
        this.initializeUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Show initial upload prompt
        this.showUploadPrompt();
        
        console.log('NNCircuit initialized');
    }
    
    /**
     * Initialize SVG canvas with zoom and pan capabilities
     */
    initializeSVG() {
        const container = document.getElementById('diagram-container');
        
        // Create the SVG element
        this.svg = d3.select('#diagram-container')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%');
        
        // Add a group for the grid - placed first to be in the background
        this.gridGroup = this.svg.append('g')
            .attr('class', 'grid')
            .attr('transform', 'translate(50, 50)');
        
        // Add a group for diagram elements
        this.diagram = this.svg.append('g')
            .attr('class', 'diagram')
            .attr('transform', 'translate(50, 50)');
        
        // Set up enhanced zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.2, 4]) // Set min and max zoom levels
            .extent([[0, 0], [container.clientWidth, container.clientHeight]])
            .on('zoom', (event) => {
                // Apply zoom transform to both diagram and grid
                this.diagram.attr('transform', event.transform);
                this.gridGroup.attr('transform', event.transform);
            });
        
        // Apply zoom behavior to SVG
        this.svg.call(this.zoom)
            // Add double-click to reset
            .on('dblclick.zoom', () => {
                this.svg.transition()
                    .duration(500)
                    .call(this.zoom.transform, d3.zoomIdentity.translate(50, 50).scale(1));
            });
        
        // Initialize with a slight offset for better initial view
        this.svg.call(this.zoom.transform, d3.zoomIdentity.translate(50, 50).scale(1));
        
        // Initialize renderers
        this.svgRenderer = new SVGRenderer(this.svg, this.diagram);
        this.gridRenderer = new GridRenderer(this.svg, this.gridGroup, this.gridConfig);
        this.connectionRenderer = new ConnectionRenderer(this.diagram);
        
        // Render initial grid
        this.gridRenderer.render();
    }
    
    /**
     * Initialize core components
     */
    initializeCore() {
        // Register built-in primitive types
        PrimitiveRegistry.registerDefaultPrimitives(this.registry);
    }
    
    /**
     * Initialize UI components
     */
    initializeUI() {
        this.navigation = new Navigation(
            document.getElementById('module-navigation'),
            (moduleId) => this.navigateToModule(moduleId)
        );
        
        this.controls = new Controls(
            document.getElementById('controls'),
            {
                onGridToggle: (visible) => {
                    this.gridConfig.visible = visible;
                    this.gridRenderer.update(this.gridConfig);
                },
                onGridSpacingChange: (spacing) => {
                    this.gridConfig.spacing.x = parseInt(spacing, 10);
                    this.gridRenderer.update(this.gridConfig);
                    this.renderCurrentDiagram();
                },
                onCompressionToggle: (compressed) => {
                    this.compressionMode = compressed;
                    this.renderCurrentDiagram();
                }
            }
        );
        
        this.inspector = new Inspector(document.getElementById('diagram-container'));
    }
    
    /**
     * Set up event listeners for user interaction
     */
    setupEventListeners() {
        // File input change event
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (event) => this.handleFileSelect(event));
        
        // Toggle controls button
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
        this.setupDragAndDrop();
        
        // Set up zoom control buttons
        this.setupZoomControls();
        
        // Handle clicking on SVG background (deselection)
        this.svg.on('click', () => {
            this.diagram.selectAll('.primitive').classed('selected', false);
            // Clear any highlights
            this.diagram.selectAll('.connection').classed('highlighted', false);
            this.gridGroup.selectAll('.grid-line-vertical').classed('highlighted', false);
        });
    }
    
    /**
     * Set up drag and drop functionality
     */
    setupDragAndDrop() {
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
        diagramContainer.addEventListener('drop', (e) => this.handleDrop(e), false);
        
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
    }
    
    /**
     * Handle file drop
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        if (file && file.name.endsWith('.json')) {
            // Process the file
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.loadDiagram(data);
                } catch (error) {
                    alert('Error parsing JSON file: ' + error.message);
                    console.error('Error parsing JSON:', error);
                }
            };
            
            reader.onerror = () => {
                alert('Error reading file');
            };
            
            reader.readAsText(file);
        } else {
            alert('Please drop a JSON file');
        }
    }
    
    /**
     * Handle file selection from input element
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check if it's a JSON file
        if (!file.name.endsWith('.json')) {
            alert('Please select a JSON file');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.loadDiagram(data);
            } catch (error) {
                alert('Error parsing JSON file: ' + error.message);
                console.error('Error parsing JSON:', error);
            }
        };
        
        reader.onerror = () => {
            alert('Error reading file');
        };
        
        reader.readAsText(file);
    }
    
    /**
     * Load and process a diagram from JSON data
     */
    loadDiagram(data) {
        console.log('Loading diagram:', data);
        
        try {
            // Validate diagram format
            if (!this.parser.isValidDiagramData(data)) {
                throw new Error('Invalid diagram format');
            }
            
            // Store the diagram data
            this.currentDiagramData = data;
            
            // Register module definitions
            if (data.moduleDefinitions) {
                for (const [moduleType, definition] of Object.entries(data.moduleDefinitions)) {
                    this.registry.registerModule(moduleType, definition);
                }
            }
            
            // Register custom primitive definitions if any
            if (data.primitiveDefinitions) {
                for (const [primitiveType, definition] of Object.entries(data.primitiveDefinitions)) {
                    this.registry.registerPrimitive(primitiveType, definition);
                }
            }
            
            // Set the entry point module
            this.currentModule = data.entryPointModule;
            
            // Reset navigation history
            this.moduleHistory = [];
            
            // Update navigation
            this.navigation.update(this.moduleHistory, this.currentModule);
            
            // Render the diagram
            this.renderCurrentDiagram();
            
        } catch (error) {
            alert('Error loading diagram: ' + error.message);
            console.error('Error loading diagram:', error);
            this.showUploadPrompt('Error: ' + error.message);
        }
    }
    
    /**
     * Render the current diagram
     */
    renderCurrentDiagram() {
        if (!this.currentDiagramData || !this.currentModule) {
            return;
        }
        
        // Get the module definition
        const moduleDefinition = this.registry.getModule(this.currentModule);
        if (!moduleDefinition) {
            throw new Error(`Module "${this.currentModule}" not found in registry`);
        }
        
        // Clear existing content
        this.diagram.selectAll('*').remove();
        
        // Create module instance
        const moduleInstance = new Module(
            this.currentModule,
            moduleDefinition,
            this.registry,
            this.expressionEvaluator,
            {}
        );
        
        // Process module parameters and layout
        this.layout.calculateModuleLayout(moduleInstance, this.gridConfig, this.compressionMode);
        
        // Render components
        const components = moduleInstance.getComponents();
        this.svgRenderer.renderPrimitives(components, {
            onClick: (componentId) => this.handleComponentClick(componentId),
            onDoubleClick: (componentId) => this.handleModuleDoubleClick(componentId)
        });
        
        // Render connections
        const connections = moduleInstance.getConnections();
        this.connectionRenderer.renderConnections(connections);
    }
    
    /**
     * Handle component click
     */
    handleComponentClick(componentId) {
        console.log('Component clicked:', componentId);
        // Show component information in the inspector
        const component = this.findComponentById(componentId);
        if (component) {
            this.inspector.showComponent(component);
        }
    }
    
    /**
     * Handle module double-click for navigation/expansion
     */
    handleModuleDoubleClick(componentId) {
        console.log('Module double-clicked:', componentId);
        const component = this.findComponentById(componentId);
        
        if (component && component.type && this.registry.hasModule(component.type)) {
            // Navigate to this module
            this.moduleHistory.push(this.currentModule);
            this.currentModule = component.type;
            
            // Update navigation
            this.navigation.update(this.moduleHistory, this.currentModule);
            
            // Render the new current module
            this.renderCurrentDiagram();
        }
    }
    
    /**
     * Navigate to a module by ID
     */
    navigateToModule(moduleId) {
        if (moduleId === this.currentModule) {
            return; // Already at this module
        }
        
        if (moduleId === 'back' && this.moduleHistory.length > 0) {
            // Navigate back
            this.currentModule = this.moduleHistory.pop();
        } else if (this.registry.hasModule(moduleId)) {
            // Navigate to specific module
            this.moduleHistory.push(this.currentModule);
            this.currentModule = moduleId;
        } else {
            console.error(`Module "${moduleId}" not found`);
            return;
        }
        
        // Update navigation
        this.navigation.update(this.moduleHistory, this.currentModule);
        
        // Render the new current module
        this.renderCurrentDiagram();
    }
    
    /**
     * Find a component by ID in the current rendered diagram
     */
    findComponentById(componentId) {
        let component = null;
        this.diagram.selectAll('.primitive').each(function(d) {
            if (d.id === componentId) {
                component = d;
            }
        });
        return component;
    }
    
    /**
     * Set up zoom control buttons
     */
    setupZoomControls() {
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        const zoomReset = document.getElementById('zoom-reset');
        
        if (zoomIn && zoomOut && zoomReset) {
            // Zoom in button
            zoomIn.addEventListener('click', () => {
                this.svg.transition()
                    .duration(300)
                    .call(this.zoom.scaleBy, 1.3); // 30% zoom in
            });
            
            // Zoom out button
            zoomOut.addEventListener('click', () => {
                this.svg.transition()
                    .duration(300)
                    .call(this.zoom.scaleBy, 0.7); // 30% zoom out
            });
            
            // Reset zoom button
            zoomReset.addEventListener('click', () => {
                this.svg.transition()
                    .duration(500)
                    .call(this.zoom.transform, d3.zoomIdentity.translate(50, 50).scale(1));
            });
        }
    }
    
    /**
     * Show upload prompt
     * @param {string} errorMessage - Optional error message to display
     */
    showUploadPrompt(errorMessage = null) {
        // Clear any existing content
        this.diagram.selectAll('*').remove();
        
        // Add a text message in the center of the diagram
        this.diagram.append('text')
            .attr('x', 400)
            .attr('y', 180)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('fill', errorMessage ? '#c0392b' : '#666')
            .text(errorMessage || 'Please upload a diagram JSON file to begin');
        
        // Add additional instructions
        this.diagram.append('text')
            .attr('x', 400)
            .attr('y', 210)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('fill', '#888')
            .text('Use the file input or drag & drop a JSON file anywhere');
        
        // Add example file suggestions
        this.diagram.append('text')
            .attr('x', 400)
            .attr('y', 240)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#888')
            .text('Example files in the /json directory:');
        
        this.diagram.append('text')
            .attr('x', 400)
            .attr('y', 260)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#3498db')
            .text('mac_block.json - MAC block with delay chains');
        
        this.diagram.append('text')
            .attr('x', 400)
            .attr('y', 280)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#3498db')
            .text('primitives_only.json - Simple primitives diagram');
    }
}

// Create and export the NNCircuit instance
const viewer = new NNCircuit();
export default viewer;