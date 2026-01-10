// Debug test untuk Tukey's Hinges
// File: debug_tukey.test.js

const fs = require('fs');
const path = require('path');

/* global importScripts, FrequencyCalculator */

// Fungsi helper untuk load scripts (untuk testing di Node.js)
const loadScript = (scriptPath) => {
  const normalized = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;
  const absolutePath = path.resolve(__dirname, '../', normalized);
  const scriptContent = fs.readFileSync(absolutePath, 'utf8');
  new Function(scriptContent)();
};

// Setup environment
global.self = global;
global.importScripts = loadScript;

// Load dependencies
loadScript('utils/utils.js');
loadScript('descriptive/descriptive.js');
loadScript('frequency/frequency.js');

const FrequencyCalculator = global.self.FrequencyCalculator;

console.log('=== Debug Tukey\'s Hinges Implementation ===\n');

// Test dengan data sederhana untuk memahami rumus
const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const calc = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data 
});

// Debug ringkas: cukup tampilkan expected vs actual menggunakan method tukeyhinges
console.log('Data:', data);
console.log('\n=== Expected vs Actual (Tukey Hinges) ===');
console.log('Expected Q1: 3,  Actual:', calc.getPercentile(25, 'tukeyhinges'));
console.log('Expected Q2: 5.5,Actual:', calc.getPercentile(50, 'tukeyhinges'));
console.log('Expected Q3: 8,  Actual:', calc.getPercentile(75, 'tukeyhinges'));

// Add actual test case
describe('Tukey Hinges Debug', () => {
    test('should calculate Tukey hinges correctly', () => {
        const Q1 = calc.getPercentile(25, 'tukeyhinges');
        const Q2 = calc.getPercentile(50, 'tukeyhinges');
        const Q3 = calc.getPercentile(75, 'tukeyhinges');
        
        expect(Q1).toBeCloseTo(3, 1);
        expect(Q2).toBeCloseTo(5.5, 1);
        expect(Q3).toBeCloseTo(8, 1);
    });
});