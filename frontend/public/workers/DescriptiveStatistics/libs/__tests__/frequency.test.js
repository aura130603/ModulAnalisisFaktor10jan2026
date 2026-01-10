const fs = require('fs');
const path = require('path');

// Helper to load worker scripts into the test environment.
// This mimics the 'importScripts' behavior in a Web Worker.
const loadScript = (scriptPath) => {
  const normalized = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;
  const absolutePath = path.resolve(__dirname, '..', normalized);
  const scriptContent = fs.readFileSync(absolutePath, 'utf8');
  new Function(scriptContent)();
};

// Set up the environment to mimic a Web Worker's global scope ('self')
global.self = global;
global.importScripts = loadScript;

// Load dependencies first. These will attach their classes to `self`.
loadScript('utils/utils.js');
loadScript('descriptive/descriptive.js');

// Now, load the script we want to test.
loadScript('frequency/frequency.js');

// The class is now available on the global scope.
const FrequencyCalculator = global.self.FrequencyCalculator;


describe('FrequencyCalculator', () => {

    const variable = { name: 'age', measure: 'scale' };

    describe('getStatistics distribution (formerly getSortedData)', () => {
        it('should handle empty data returning empty table and zero summary', () => {
            const calc = new FrequencyCalculator({ variable, data: [] });
            const { frequencyTable, summary, stats } = calc.getStatistics();
            expect(Array.isArray(frequencyTable)).toBe(true);
            expect(frequencyTable.length).toBe(0);
            expect(summary).toEqual({ valid: 0, missing: 0, total: 0 });
            expect(stats.N).toBe(0);
            expect(stats.Missing).toBe(0);
        });

        it('should correctly sort, group, and aggregate unweighted data', () => {
            const data = [20, 30, 20, 40, 30, 20];
            const calc = new FrequencyCalculator({ variable, data });
            const { frequencyTable, summary } = calc.getStatistics();
            
            // unique sorted values
            expect(frequencyTable.map(r => r.value)).toEqual([20, 30, 40]);
            // frequencies for each value
            expect(frequencyTable.map(r => r.frequency)).toEqual([3, 2, 1]);
            // weighted valid total
            expect(summary.valid).toBe(6);
            expect(summary.total).toBe(6);
            expect(summary.missing).toBe(0);
        });

        it('should correctly sort, group, and aggregate weighted data', () => {
            const data = [10, 20, 10, 30];
            const weights = [1.5, 2, 0.5, 1];
            const calc = new FrequencyCalculator({ variable, data, weights });
            const { frequencyTable, summary } = calc.getStatistics();
            
            expect(frequencyTable.map(r => r.value)).toEqual([10, 20, 30]);
            expect(frequencyTable.map(r => r.frequency)).toEqual([2, 2, 1]); // 1.5 + 0.5 = 2
            expect(summary.valid).toBe(5); // 1.5 + 2 + 0.5 + 1 = 5
            expect(summary.total).toBe(5);
            expect(summary.missing).toBe(0);
        });
    });

    describe('getMode', () => {
        it('should find a single mode', () => {
            const data = [1, 2, 2, 3, 3, 3, 4];
            const calc = new FrequencyCalculator({ variable, data });
            expect(calc.getMode()).toEqual([3]);
        });

        it('should find multiple modes', () => {
            const data = [1, 1, 2, 2, 3];
            const calc = new FrequencyCalculator({ variable, data });
            expect(calc.getMode()).toEqual([1, 2]);
        });
    });

    describe('getPercentile (waverage)', () => {
        it('should calculate percentiles with waverage method', () => {
            const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // W = 10
            const calc = new FrequencyCalculator({ variable, data });
            expect(calc.getPercentile(25, 'waverage')).toBeCloseTo(2.5);
            expect(calc.getPercentile(75, 'waverage')).toBeCloseTo(7.5);
        });
    });

    describe('getStatistics frequency table', () => {
        it('should generate a correct frequency table with summary and percents', () => {
            const data = [10, 20, 10, 30, 20, 10, 40, 50, null, 10]; // total=10, valid=9, missing=1
            const calc = new FrequencyCalculator({ variable, data });
            const { frequencyTable: rows, summary } = calc.getStatistics();

            expect(summary).toEqual({ valid: 9, missing: 1, total: 10 });
            expect(rows.length).toBe(5); // 5 unique valid values
            
            const row10 = rows.find(r => r.value === 10);
            expect(row10.frequency).toBe(4);
            expect(row10.percent).toBeCloseTo(40.0); // 4/10
            expect(row10.validPercent).toBeCloseTo(44.444, 2); // 4/9
            expect(row10.cumulativePercent).toBeCloseTo(44.444, 2);

            const row30 = rows.find(r => r.value === 30);
            expect(row30.frequency).toBe(1);
            expect(row30.percent).toBeCloseTo(10.0); // 1/10
            expect(row30.validPercent).toBeCloseTo(11.111, 2); // 1/9
            expect(row30.cumulativePercent).toBeCloseTo(77.777, 2); // cum up to 30
        });

        it('should format date values as dd-mm-yyyy in table rows', () => {
            const varDate = { name: 'd', type: 'DATE', measure: 'scale' };
            const data = ['01-01-2020', '02-01-2020', '01-01-2020'];
            const calc = new FrequencyCalculator({ variable: varDate, data });
            const { frequencyTable: rows } = calc.getStatistics();
            expect(rows.map(r => r.value)).toEqual(['01-01-2020', '02-01-2020']);
            expect(rows.map(r => r.frequency)).toEqual([2, 1]);
        });
    });

    describe('getStatistics', () => {
        it('should return stats, frequencyTable and weighted summary', () => {
            const data = [1, 2, 3, 4, 5];
            const weights = [1, 1, 1, 1, 2]; // total weighted = 6
            const calc = new FrequencyCalculator({ variable, data, weights });
            const result = calc.getStatistics();

            expect(result.stats).not.toBeNull();
            expect(Array.isArray(result.frequencyTable)).toBe(true);
            expect(result.summary).toEqual({ valid: 6, missing: 0, total: 6 });
            expect(result.stats.N).toBe(6);
            expect(result.stats.Missing).toBe(0);
        });
    });

});
