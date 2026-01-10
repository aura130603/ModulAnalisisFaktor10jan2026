const fs = require('fs');
const path = require('path');

// Helper to load worker scripts into the Node test environment, mimicking `importScripts`.
const loadScript = (scriptPath) => {
  const normalized = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;
  const absolutePath = path.resolve(__dirname, '../', normalized);
  const scriptContent = fs.readFileSync(absolutePath, 'utf8');
  new Function(scriptContent)();
};

// -------------------------------------------------------------
//  Bootstrap a faux Web-Worker global environment
// -------------------------------------------------------------
global.self = global;
global.importScripts = loadScript;

// Load dependencies in the same order they are expected inside the workers
loadScript('utils/utils.js');
loadScript('descriptive/descriptive.js');

const DescriptiveCalculator = global.self.DescriptiveCalculator;

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('DescriptiveCalculator', () => {
    const variable = { name: 'score', measure: 'scale' };

    describe('Basic numeric statistics', () => {
        const data = [1, 2, 3, 4, 5];
        const calc = new DescriptiveCalculator({ variable, data });

        it('should compute the correct mean', () => {
            expect(calc.getMean()).toBe(3);
        });

        it('should compute the correct variance (sample)', () => {
            expect(calc.getVariance()).toBeCloseTo(2.5);
        });

        it('should compute the correct standard deviation', () => {
            expect(calc.getStdDev()).toBeCloseTo(Math.sqrt(2.5));
        });

        it('should provide a complete statistics summary', () => {
            const stats = calc.getStatistics().stats;
            expect(stats.N).toBe(5);
            expect(stats.Valid).toBe(5);
            expect(stats.Missing).toBe(0);
            expect(stats.Mean).toBe(3);
            expect(stats.Minimum).toBe(1);
            expect(stats.Maximum).toBe(5);
            expect(stats.Median).toBe(3);
        });
    });

    describe('Weighted statistics', () => {
        const data = [1, 2, 3, 4, 5];
        const weights = [2, 1, 1, 1, 1]; // Sum = 6
        const calc = new DescriptiveCalculator({ variable, data, weights });

        it('should compute the weighted mean correctly', () => {
            // (1*2 + 2*1 + 3*1 + 4*1 + 5*1) / 6 = 16/6
            expect(calc.getMean()).toBeCloseTo(16 / 6);
        });

        it('should report valid N as the sum of weights', () => {
            expect(calc.getValidN()).toBeCloseTo(6);
        });
    });
});