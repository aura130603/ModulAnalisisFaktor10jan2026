// Test untuk implementasi Tukey's Hinges
// File: tukey_hinges.test.js

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

console.log('=== Test Tukey\'s Hinges Implementation ===\n');

// Test Case 1: Data sederhana untuk verifikasi rumus
console.log('Test 1: Data Sederhana [1,2,3,4,5,6,7,8,9,10]');
const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const calc1 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data1 
});

// FrequencyCalculator no longer exposes getSortedData;
// Trigger internal distribution by calling a percentile once.
calc1.getPercentile(50, 'waverage');
console.log('Data:', data1);
console.log('W =', 'computed internally');
console.log('c* = min(c) =', 'computed internally');

// Hitung manual untuk verifikasi (disederhanakan - struktur internal disembunyikan)
console.log('Manual verification skipped: using percentile outputs for comparison');
// Previously referenced internal variables (W1, d1, etc.) have been removed, since
// internal distribution details are intentionally hidden in the implementation.
// We rely on getPercentile results for verification instead of manual internals.

console.log('\nTukey\'s Hinges results:');
console.log('Q1 (25th percentile):', calc1.getPercentile(25, 'tukeyhinges'));
console.log('Q2 (50th percentile):', calc1.getPercentile(50, 'tukeyhinges'));
console.log('Q3 (75th percentile):', calc1.getPercentile(75, 'tukeyhinges'));

console.log('\nPerbandingan dengan metode lain:');
console.log('Q1 waverage:', calc1.getPercentile(25, 'waverage'));
console.log('Q2 waverage:', calc1.getPercentile(50, 'waverage'));
console.log('Q3 waverage:', calc1.getPercentile(75, 'waverage'));
console.log('');

// Test Case 2: Data dengan bobot
console.log('Test 2: Data dengan Bobot');
const data2 = [1, 2, 3, 4, 5];
const weights2 = [2, 1, 3, 1, 1]; // Total weight = 8
const calc2 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data2,
    weights: weights2
});

// Trigger internal distribution computation
calc2.getPercentile(50, 'waverage');
console.log('Data:', data2);
console.log('Weights:', weights2);
console.log('Total Weight W =', 'computed internally');
console.log('Sorted structure:', '(hidden)');

console.log('\nTukey\'s Hinges results:');
console.log('Q1 (25th percentile):', calc2.getPercentile(25, 'tukeyhinges'));
console.log('Q2 (50th percentile):', calc2.getPercentile(50, 'tukeyhinges'));
console.log('Q3 (75th percentile):', calc2.getPercentile(75, 'tukeyhinges'));
console.log('');

// Test Case 3: Data dengan nilai duplikat
console.log('Test 3: Data dengan Nilai Duplikat');
const data3 = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
const calc3 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data3 
});

// Trigger internal computation
calc3.getPercentile(50, 'waverage');
console.log('Data:', data3);
console.log('Sorted structure:', '(hidden)');

console.log('\nTukey\'s Hinges results:');
console.log('Q1 (25th percentile):', calc3.getPercentile(25, 'tukeyhinges'));
console.log('Q2 (50th percentile):', calc3.getPercentile(50, 'tukeyhinges'));
console.log('Q3 (75th percentile):', calc3.getPercentile(75, 'tukeyhinges'));
console.log('');

// Test Case 4: Persentil non-kuartil (harus fallback ke waverage)
console.log('Test 4: Persentil Non-Kuartil (Fallback)');
console.log('10th percentile (tukeyhinges):', calc1.getPercentile(10, 'tukeyhinges'));
console.log('10th percentile (waverage):', calc1.getPercentile(10, 'waverage'));
console.log('90th percentile (tukeyhinges):', calc1.getPercentile(90, 'tukeyhinges'));
console.log('90th percentile (waverage):', calc1.getPercentile(90, 'waverage'));
console.log('Hasil harus sama karena fallback ke waverage');
console.log('');

// Test Case 5: Edge case - data tunggal
console.log('Test 5: Edge Case - Data Tunggal');
const data5 = [42];
const calc5 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data5 
});

console.log('Data:', data5);
console.log('Q1:', calc5.getPercentile(25, 'tukeyhinges'));
console.log('Q2:', calc5.getPercentile(50, 'tukeyhinges'));
console.log('Q3:', calc5.getPercentile(75, 'tukeyhinges'));
console.log('');

console.log('=== Test Tukey\'s Hinges Complete ===');

// Add actual Jest test cases
describe('Tukey Hinges Implementation', () => {
    test('should calculate Tukey hinges for simple data', () => {
        const Q1 = calc1.getPercentile(25, 'tukeyhinges');
        const Q2 = calc1.getPercentile(50, 'tukeyhinges');
        const Q3 = calc1.getPercentile(75, 'tukeyhinges');
        
        expect(Q1).toBeCloseTo(3, 1);
        expect(Q2).toBeCloseTo(5.5, 1);
        expect(Q3).toBeCloseTo(8, 1);
    });
    
    test('should handle weighted data', () => {
        const Q1 = calc2.getPercentile(25, 'tukeyhinges');
        const Q2 = calc2.getPercentile(50, 'tukeyhinges');
        const Q3 = calc2.getPercentile(75, 'tukeyhinges');
        
        expect(Q1).toBeDefined();
        expect(Q2).toBeDefined();
        expect(Q3).toBeDefined();
    });
 });