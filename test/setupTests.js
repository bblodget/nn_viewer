// Import any test setup libraries
import '@testing-library/jest-dom';

// Mock D3 if needed
// jest.mock('d3', () => ({
//   // Add mocked D3 functions here as needed
// }));

// Global setup
global.SVGElement = window.SVGElement;