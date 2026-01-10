// Test Cases untuk Percentile Implementation
// File: test_percentile_fixes.js

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

console.log('=== Test Percentile Fixes ===\n');

// Test Case 1: Simple data for Weighted Average Definition 1
console.log('Test 1: Weighted Average Definition 1');
const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const calc1 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data1 
});

console.log('Data:', data1);
console.log('W =', calc1.getSortedData().W);
console.log('25th percentile (waverage):', calc1.getPercentile(25, 'waverage'));
console.log('50th percentile (waverage):', calc1.getPercentile(50, 'waverage'));
console.log('75th percentile (waverage):', calc1.getPercentile(75, 'waverage'));
console.log('Expected results should follow tc₁ = W * p formula');
console.log('');

// Test Case 2: Tukey's Hinges
console.log('Test 2: Tukey\'s Hinges');
const data2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const calc2 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data2 
});

console.log('Data:', data2);
console.log('W =', calc2.getSortedData().W);
console.log('Q1 (25th percentile, haverage):', calc2.getPercentile(25, 'haverage'));
console.log('Q2 (50th percentile, haverage):', calc2.getPercentile(50, 'haverage'));
console.log('Q3 (75th percentile, haverage):', calc2.getPercentile(75, 'haverage'));
console.log('Should use depth calculation: d = floor((10+3)/2) = 6');
console.log('Q1 depth = 6, Q3 depth = 10+1-6 = 5');
console.log('');

// Test Case 3: Weighted data
console.log('Test 3: Weighted Data');
const data3 = [1, 2, 3, 4, 5];
const weights3 = [2, 1, 3, 1, 1]; // Total weight = 8
const calc3 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data3,
    weights: weights3
});

console.log('Data:', data3);
console.log('Weights:', weights3);
console.log('Total Weight W =', calc3.getSortedData().W);
console.log('Sorted data structure:', calc3.getSortedData());
console.log('50th percentile (waverage):', calc3.getPercentile(50, 'waverage'));
console.log('50th percentile (haverage):', calc3.getPercentile(50, 'haverage'));
console.log('');

// Test Case 4: Edge cases
console.log('Test 4: Edge Cases');
const data4 = [5]; // Single value
const calc4 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data4 
});

console.log('Single value data:', data4);
console.log('50th percentile (waverage):', calc4.getPercentile(50, 'waverage'));
console.log('50th percentile (haverage):', calc4.getPercentile(50, 'haverage'));
console.log('');

// Test Case 5: Comparison with old vs new implementation
console.log('Test 5: Comparison - Small Dataset');
const data5 = [1, 1, 2, 3, 4, 5];
const calc5 = new FrequencyCalculator({ 
    variable: { name: 'test', measure: 'scale' }, 
    data: data5 
});

console.log('Data:', data5);
console.log('Sorted structure:', calc5.getSortedData());
console.log('25th percentile (waverage):', calc5.getPercentile(25, 'waverage'));
console.log('50th percentile (waverage):', calc5.getPercentile(50, 'waverage'));
console.log('75th percentile (waverage):', calc5.getPercentile(75, 'waverage'));
console.log('Compare with manual calculation:');
console.log('W = 6, tc₁ for 25th percentile = 6 * 0.25 = 1.5');
console.log('tc₁ for 50th percentile = 6 * 0.5 = 3');
console.log('tc₁ for 75th percentile = 6 * 0.75 = 4.5');

console.log('\n=== Test Complete ===');
