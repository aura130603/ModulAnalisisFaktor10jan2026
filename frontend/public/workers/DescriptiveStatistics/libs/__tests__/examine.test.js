const fs = require('fs');
const path = require('path');

// Helper to load worker scripts into the Node test environment.
const loadScript = (scriptPath) => {
  const normalized = scriptPath.startsWith('/') ? scriptPath.slice(1) : scriptPath;
  const absolutePath = path.resolve(__dirname, '../', normalized);
  const scriptContent = fs.readFileSync(absolutePath, 'utf8');
  new Function(scriptContent)();
};

// -------------------------------------------------------------
//  Faux Web-Worker environment bootstrap
// -------------------------------------------------------------

global.self = global;
global.importScripts = (url) => {
  // Ignore external CDN import attempts
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    return;
  }
  loadScript(url);
};

// Mock jStat for testing
global.jStat = {
  studentt: {
    inv: (p, df) => {
      // Simple approximation for t-distribution inverse
      if (df >= 30) return 1.96; // Normal approximation
      return 2.0; // Simple fallback
    }
  }
};

// Load dependencies
loadScript('utils/utils.js');
loadScript('descriptive/descriptive.js');
loadScript('frequency/frequency.js');
loadScript('examine/examine.js');

const ExamineCalculator = global.self.ExamineCalculator;

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('ExamineCalculator', () => {
    const variable = { name: 'salary', measure: 'scale' };
    const data = [1, 2, 3, 4, 5];

    const calc = new ExamineCalculator({ variable, data });

    it('should compute a trimmed mean equal to the arithmetic mean for symmetric data', () => {
        expect(calc.getTrimmedMean()).toBe(3);
    });

    it('should compute M-Estimators close to the mean for symmetric data', () => {
        const results = calc.getStatistics();
        expect(results.mEstimators.huber).toBeCloseTo(3, 1);
        expect(results.mEstimators.hampel).toBeCloseTo(3, 1);
        expect(results.mEstimators.andrews).toBeCloseTo(3, 1);
        expect(results.mEstimators.tukey).toBeCloseTo(3, 1);
    });

    it('should handle outliers robustly with M-Estimators', () => {
        const dataWithOutliers = [1, 2, 3, 4, 5, 100]; // 100 is an outlier
        const calcOutliers = new ExamineCalculator({ variable, data: dataWithOutliers });
        const results = calcOutliers.getStatistics();
        
        // M-estimators should be less affected by the outlier than the mean
        const mean = results.descriptives.Mean;
        expect(results.mEstimators.huber).toBeLessThan(mean);
        expect(results.mEstimators.hampel).toBeLessThan(mean);
        expect(results.mEstimators.andrews).toBeLessThan(mean);
        expect(results.mEstimators.tukey).toBeLessThan(mean);
    });

    it('should handle edge cases in M-Estimators', () => {
        // Test with constant data (no variation)
        const constantData = [5, 5, 5, 5, 5];
        const calcConstant = new ExamineCalculator({ variable, data: constantData });
        const resultsConstant = calcConstant.getStatistics();
        
        expect(resultsConstant.mEstimators.huber).toBe(5);
        expect(resultsConstant.mEstimators.hampel).toBe(5);
        expect(resultsConstant.mEstimators.andrews).toBe(5);
        expect(resultsConstant.mEstimators.tukey).toBe(5);
        
        // Test with single value
        const singleData = [42];
        const calcSingle = new ExamineCalculator({ variable, data: singleData });
        const resultsSingle = calcSingle.getStatistics();
        
        expect(resultsSingle.mEstimators.huber).toBe(42);
        expect(resultsSingle.mEstimators.hampel).toBe(42);
        expect(resultsSingle.mEstimators.andrews).toBe(42);
        expect(resultsSingle.mEstimators.tukey).toBe(42);
    });

    it('should provide a proper summary object', () => {
        const stats = calc.getStatistics();
        expect(stats.summary.valid).toBe(5);
        expect(stats.summary.missing).toBe(0);
        expect(stats.summary.total).toBe(5);
    });
});