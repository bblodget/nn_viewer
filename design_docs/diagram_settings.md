# NNCircuit Settings Configuration

## Overview

This document describes the settings configuration system for NNCircuit V2, which allows customization of visual rendering parameters through an optional `settings` section in the diagram JSON.

## Purpose

The settings configuration system provides several benefits:

1. **Diagram-Specific Customization**: Each diagram can specify its own visual settings
2. **Consistent Grid-Based Layout**: All measurements use grid units for consistent scaling
3. **Runtime Configurability**: Some settings can be toggled during visualization
4. **Sensible Defaults**: System provides reasonable defaults if settings are not specified

## Settings Structure

The `settings` section is an optional top-level property in the diagram JSON:

```json
{
  "entryPointModule": "moduleName",
  "settings": {
    // Settings configuration...
  },
  "componentDefinitions": {
    // Component definitions...
  }
}
```

## Available Settings

The settings object supports the following configuration groups:

### Grid Settings

Controls the underlying grid system:

```json
"grid": {
  "horizontalSpacing": 100,   // Width of a clock cycle column in pixels
  "verticalSpacing": 80,      // Height of a grid row in pixels
  "showGrid": true,           // Whether to display the grid
  "gridColor": "#e0e0e0"      // Color of grid lines
}
```

### Component Settings

Controls how components are sized and displayed:

```json
"components": {
  "padding": 0.2,             // Space around components in grid units (0.0-0.5)
  "portRadius": 5,            // Size of connection ports in pixels
  "connectionSpacing": 0.15   // Minimum spacing between connections in grid units
}
```

### Color Settings

Defines the color scheme:

```json
"colors": {
  "background": "#ffffff",    // Background color for the diagram
  "modules": "#f0f8ff",       // Default module background color
  "primitives": "#f9f9f9"     // Default primitive background color
}
```

### Compression Settings

Controls the module compression feature:

```json
"compression": {
  "enabled": false,           // Default compression mode setting
  "factor": 0.6               // How much to compress modules by
}
```

## Grid Units System

NNCircuit V2 uses a grid units system for component sizing and positioning:

1. **Grid Cell**: The fundamental unit of the grid, defined by `horizontalSpacing` and `verticalSpacing`
2. **Component Size**: Components are positioned within grid cells with configurable padding
3. **Grid Coordinates**: Components are positioned using grid coordinates (row, column)

### Component Sizing Calculation

Components are sized relative to grid cells, with padding:

```javascript
// Component width in pixels = gridCell.width * (1 - 2 * settings.components.padding)
// Component height in pixels = gridCell.height * (1 - 2 * settings.components.padding)
```

Where:
- A padding of 0 means components take up the entire grid cell
- A padding of 0.2 (20%) means components have a 20% margin on each side
- Maximum value is 0.5 (50%) which would make components half the grid cell size

## Default Settings

If settings are not specified in the diagram JSON, these defaults are used:

```json
{
  "grid": {
    "horizontalSpacing": 100,
    "verticalSpacing": 80,
    "showGrid": true,
    "gridColor": "#e0e0e0"
  },
  "components": {
    "padding": 0.2,
    "portRadius": 5,
    "connectionSpacing": 0.15
  },
  "colors": {
    "background": "#ffffff",
    "modules": "#f0f8ff",
    "primitives": "#f9f9f9"
  },
  "compression": {
    "enabled": false,
    "factor": 0.6
  }
}
```

## Settings Inheritance

Settings specified in the diagram JSON are merged with the defaults:

1. Only specified settings override defaults
2. Nested settings objects are merged recursively
3. Array settings are replaced completely if specified

## Runtime Configuration

Some settings can be toggled during visualization:

1. **Grid Visibility**: The grid can be shown or hidden
2. **Compression Mode**: Module compression can be toggled on/off
3. **Zoom Level**: Not a stored setting, but affects the visual scale

## Implementation Details

The settings system will be implemented as follows:

1. **Settings Class**: A dedicated class to manage settings, defaults, and merging
2. **Loading**: When loading a diagram, settings are parsed and merged with defaults
3. **Applying**: The renderer uses settings for all visual calculations
4. **UI Controls**: User interface elements allow toggling configurable settings

## Example Usage

Example diagram with custom settings:

```json
{
  "entryPointModule": "mainModule",
  "settings": {
    "grid": {
      "horizontalSpacing": 120,
      "verticalSpacing": 100
    },
    "components": {
      "padding": 0.25
    },
    "compression": {
      "enabled": true
    }
  },
  "componentDefinitions": {
    // Component definitions...
  }
}
```

This example increases grid spacing, adds more padding around components, and enables compression mode by default.