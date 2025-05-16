/**
 * Module.js
 * Module component implementation for NNCircuit v2
 * 
 * This file implements the Module class, which is a specialized Component 
 * that represents a hierarchical collection of other components.
 */

import Component from './component';
import { ExpressionEvaluator } from '../core/expressions';

/**
 * Module Class
 * Represents hierarchical components that contain other components
 */
class Module extends Component {
  /**
   * Create a new module
   * @param {string} id - Unique identifier for this module instance
   * @param {Object} definition - Module definition from registry
   * @param {Registry} registry - Registry of available component types
   * @param {ExpressionEvaluator} expressionEvaluator - Expression evaluator instance
   * @param {Object} parameters - Parameter values for this instance (override defaults)
   * @param {Object} parent - Optional parent module (for parameter inheritance)
   */
  constructor(id, definition, registry, expressionEvaluator, parameters = {}, parent = null) {
    super(id, definition, parameters, registry, parent);
    
    this.expressionEvaluator = expressionEvaluator;
    
    // Additional module-specific properties
    this.portGroups = this.processPortGroups(definition.port_groups || {});
    
    // Layout properties (calculated during rendering)
    this.layoutProperties = {
      width: 0,       // Calculated based on latency
      height: 0,      // From display.height or auto-calculated
      position: {
        x: 0,
        y: 0
      },
      compressed: false // Compression state
    };
  }
  
  /**
   * Process port group definitions
   * @param {Object} portGroupDefs - Port group definitions from module definition
   * @returns {Object} - Processed port groups
   */
  processPortGroups(portGroupDefs) {
    const portGroups = {};
    
    for (const [groupId, groupDef] of Object.entries(portGroupDefs)) {
      portGroups[groupId] = {
        ports: [...groupDef.ports],
        arrangement: groupDef.arrangement || 'sequential',
        color: groupDef.color || '#808080',
        spacing: groupDef.spacing || 1
      };
    }
    
    return portGroups;
  }
  
  /**
   * Set layout properties for this module
   * @param {Object} layoutProps - Layout properties object
   */
  setLayoutProperties(layoutProps) {
    this.layoutProperties = {
      ...this.layoutProperties,
      ...layoutProps
    };
  }
  
  /**
   * Get ports arranged by groups
   * @returns {Object} - Ports organized by groups
   */
  getPortsByGroups() {
    const inputGroups = {};
    const ungroupedInputs = [];
    
    // Organize inputs by groups
    for (const input of this.inputs) {
      let grouped = false;
      
      // Find which group this port belongs to
      for (const [groupId, group] of Object.entries(this.portGroups)) {
        if (group.ports.includes(input.name)) {
          if (!inputGroups[groupId]) {
            inputGroups[groupId] = {
              ...this.portGroups[groupId],
              ports: []
            };
          }
          inputGroups[groupId].ports.push(input);
          grouped = true;
          break;
        }
      }
      
      // If not in any group, add to ungrouped
      if (!grouped) {
        ungroupedInputs.push(input);
      }
    }
    
    return {
      groups: inputGroups,
      ungrouped: ungroupedInputs
    };
  }
  
  /**
   * Calculate port positions based on arrangement and module dimensions
   * @returns {Object} - Map of port positions by port name
   */
  calculatePortPositions() {
    const portPositions = {};
    const { height } = this.layoutProperties;
    
    // Calculate input port positions
    const { groups, ungrouped } = this.getPortsByGroups();
    
    // Position grouped inputs
    let currentY = 10; // Start with some padding
    
    for (const [groupId, group] of Object.entries(groups)) {
      const ports = group.ports;
      const spacing = group.spacing || 1;
      
      // Calculate positions based on arrangement
      switch (group.arrangement) {
        case 'interleaved':
          // Position ports with interleaved pattern
          for (let i = 0; i < ports.length; i++) {
            portPositions[ports[i].name] = {
              x: 0, // Left edge
              y: currentY + (i * spacing * 20)
            };
          }
          currentY += (ports.length * spacing * 20) + 10; // Additional padding between groups
          break;
          
        case 'sequential':
        default:
          // Position ports sequentially
          for (let i = 0; i < ports.length; i++) {
            portPositions[ports[i].name] = {
              x: 0, // Left edge
              y: currentY + (i * 20)
            };
          }
          currentY += (ports.length * 20) + 10; // Additional padding between groups
          break;
      }
    }
    
    // Position ungrouped inputs
    for (let i = 0; i < ungrouped.length; i++) {
      portPositions[ungrouped[i].name] = {
        x: 0, // Left edge
        y: currentY + (i * 20)
      };
    }
    
    // Calculate output port positions
    // Evenly distribute outputs on right side
    const outputCount = this.outputs.length;
    const outputSpacing = height / (outputCount + 1);
    
    for (let i = 0; i < outputCount; i++) {
      portPositions[this.outputs[i].name] = {
        x: this.layoutProperties.width, // Right edge
        y: (i + 1) * outputSpacing
      };
    }
    
    return portPositions;
  }
  
  /**
   * Get output mapping for a specific output port
   * @param {string} outputName - Name of the output port
   * @returns {string|null} - Source reference or null if not mapped
   */
  getOutputMapping(outputName) {
    if (this.definition.outputMappings && this.definition.outputMappings[outputName]) {
      // Resolve any parameter expressions in the mapping
      const mapping = this.definition.outputMappings[outputName];
      
      if (typeof mapping === 'string' && mapping.includes('${')) {
        return this.expressionEvaluator.evaluate(mapping, this.parameters, {});
      }
      
      return mapping;
    }
    
    return null;
  }
  
  /**
   * Check if module can be compressed in the view
   * @returns {boolean} - True if compressible, false otherwise
   */
  isCompressible() {
    // Modules can be compressed if they have a consistent width/latency
    return true; // Simplified - in real implementation would check conditions
  }
  
  /**
   * Calculate the width based on latency and grid settings
   * @param {Object} gridConfig - Grid configuration
   * @returns {number} - Width in grid units
   */
  calculateWidth(gridConfig) {
    const latency = this.getLatency();
    return latency * gridConfig.spacing.x;
  }
  
  /**
   * Calculate the height based on ports and display settings
   * @param {Object} gridConfig - Grid configuration
   * @returns {number} - Height in grid units
   */
  calculateHeight(gridConfig) {
    // If display.height is specified, use it
    if (this.display.height) {
      return this.display.height * gridConfig.spacing.y;
    }
    
    // Calculate based on number of ports
    const portCount = Math.max(this.inputs.length, this.outputs.length);
    const minHeight = 2; // Minimum height in grid units
    const calculatedHeight = Math.max(minHeight, Math.ceil(portCount / 2));
    
    return calculatedHeight * gridConfig.spacing.y;
  }
}

export default Module;