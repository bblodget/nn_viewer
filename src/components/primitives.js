/**
 * Primitives.js
 * Primitive component definitions for NNCircuit v2
 * 
 * This file defines the built-in primitive component types and provides
 * a registry to load them into the application.
 */

/**
 * PrimitiveRegistry
 * Registry for built-in primitive component types
 */
class PrimitiveRegistry {
  /**
   * Register default primitives in the provided registry
   * @param {Registry} registry - Component registry to add primitives to
   */
  static registerDefaultPrimitives(registry) {
    // Register all built-in primitives
    for (const [type, definition] of Object.entries(PrimitiveRegistry.DEFAULT_PRIMITIVES)) {
      registry.registerPrimitive(type, definition);
    }
  }
  
  /**
   * Default primitive component definitions
   */
  static DEFAULT_PRIMITIVES = {
    // Addition primitive
    add: {
      is_primitive: true,
      inputs: [
        {name: "in1", size: 1},
        {name: "in2", size: 1}
      ],
      outputs: [
        {name: "out", size: 1}
      ],
      latency: 1,
      display: {
        symbol: "+",
        color: "#4CAF50",
        shape: "circle"
      }
    },
    
    // Multiplication primitive
    mul: {
      is_primitive: true,
      inputs: [
        {name: "in1", size: 1},
        {name: "in2", size: 1}
      ],
      outputs: [
        {name: "out", size: 1}
      ],
      latency: 1,
      display: {
        symbol: "×",
        color: "#2196F3",
        shape: "circle"
      }
    },
    
    // Register primitive (delay element)
    reg: {
      is_primitive: true,
      inputs: [
        {name: "in", size: 1}
      ],
      outputs: [
        {name: "out", size: 1}
      ],
      latency: 1,
      display: {
        symbol: "D",
        color: "#9C27B0",
        shape: "rect"
      }
    },
    
    // Multi-bit register primitive
    bus_reg: {
      is_primitive: true,
      inputs: [
        {name: "in", size: 8}
      ],
      outputs: [
        {name: "out", size: 8}
      ],
      latency: 1,
      display: {
        symbol: "D[8]",
        color: "#9C27B0",
        shape: "rect"
      }
    },
    
    // Squared ReLU activation function
    relu2: {
      is_primitive: true,
      inputs: [
        {name: "in", size: 1}
      ],
      outputs: [
        {name: "out", size: 1}
      ],
      latency: 1,
      display: {
        symbol: "ReLU²",
        color: "#FF9800",
        shape: "rect"
      }
    },
    
    // Range clamp function
    clamp: {
      is_primitive: true,
      inputs: [
        {name: "in", size: 1}
      ],
      outputs: [
        {name: "out", size: 1}
      ],
      latency: 1,
      display: {
        symbol: "◊",
        color: "#F44336",
        shape: "diamond"
      }
    },
    
    // Input port
    input: {
      is_primitive: true,
      inputs: [],
      outputs: [
        {name: "out", size: 1}
      ],
      latency: 0, // Input primitives have no latency
      display: {
        symbol: "▶",
        color: "#3F51B5",
        shape: "triangle"
      }
    },
    
    // Output port
    output: {
      is_primitive: true,
      inputs: [
        {name: "in", size: 1}
      ],
      outputs: [],
      latency: 0, // Output primitives have no latency
      display: {
        symbol: "◀",
        color: "#3F51B5",
        shape: "triangle"
      }
    }
  };
}

export { PrimitiveRegistry };