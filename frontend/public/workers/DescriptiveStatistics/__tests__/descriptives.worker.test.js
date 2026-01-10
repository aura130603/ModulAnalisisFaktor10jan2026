/**
 * Unit tests for DescriptiveStatistics/descriptives.worker.js
 * Simulates a WebWorker environment: self/onmessage/postMessage/importScripts
 */

const path = require('path');

function withIsolatedWorker(testFn) {
  jest.isolateModules(() => {
    // Simulate worker global
    global.self = global;

    // Map importScripts URLs like 
    // "/workers/DescriptiveStatistics/libs/descriptive/descriptive.js"
    // to the actual file under public/
    global.importScripts = (...urls) => {
      urls.forEach((u) => {
        const localPath = path.join(process.cwd(), 'public', u.replace(/^\/+/, ''));
        // Clear module cache to allow re-load in isolatedModules
        delete require.cache[require.resolve(localPath)];
        // Load the script which attaches constructors to self
        require(localPath);
      });
    };

    // Ensure utils is available even if the worker conditionally loads it
    require(path.join(process.cwd(), 'public/workers/DescriptiveStatistics/libs/utils/utils.js'));

    // Freshly require the worker file (sets global.onmessage)
    const workerPath = path.join(process.cwd(), 'public/workers/DescriptiveStatistics/descriptives.worker.js');
    delete require.cache[require.resolve(workerPath)];
    require(workerPath);

    testFn();
  });
}

describe('descriptives.worker', () => {
  test('posts success with basic statistics for scale data', () => {
    withIsolatedWorker(() => {
      const postSpy = jest.fn();
      global.postMessage = postSpy;

      const variable = {
        name: 'X',
        label: 'X',
        measure: 'scale',
        type: 'numeric',
        missing: { type: 'none' },
      };
      const data = [1, 2, 3, null];
      const weights = [1, 1, 1, 1];

      expect(typeof global.onmessage).toBe('function');

      global.onmessage({ data: { variable, data, weights, options: {} } });

      expect(postSpy).toHaveBeenCalledTimes(1);
      const payload = postSpy.mock.calls[0][0];
      expect(payload.status).toBe('success');
      expect(payload.variableName).toBe('X');
      expect(payload.results).toBeDefined();
      // Expect mean to be near 2 for values [1,2,3]
      expect(payload.results.stats.Mean).toBeCloseTo(2, 10);
    });
  });

  test('supports date strings (dd-mm-yyyy) mapped to scale via unknown measure', () => {
    withIsolatedWorker(() => {
      const postSpy = jest.fn();
      global.postMessage = postSpy;

      const variable = {
        name: 'EventDate',
        label: 'EventDate',
        measure: 'unknown', // should become 'scale' for date core type
        type: 'DATE',
        missing: { type: 'none' },
      };
      const data = ['01-01-2024', '02-01-2024', null];

      global.onmessage({ data: { variable, data, options: {} } });

      expect(postSpy).toHaveBeenCalledTimes(1);
      const payload = postSpy.mock.calls[0][0];
      expect(payload.status).toBe('success');
      expect(payload.results).toBeDefined();
      // Mean should be a number (SPSS seconds), not null
      expect(typeof payload.results.stats.Mean).toBe('number');
      expect(payload.results.stats.Valid).toBeGreaterThan(0);
    });
  });

  test('computes ordinal stats (median, IQR) for ordinal measure', () => {
    withIsolatedWorker(() => {
      const postSpy = jest.fn();
      global.postMessage = postSpy;

      const variable = {
        name: 'Likert',
        label: 'Likert',
        measure: 'ordinal',
        type: 'numeric',
        missing: { type: 'none' },
      };
      const data = [1, 2, 2, 3, 4, null];

      global.onmessage({ data: { variable, data } });

      const payload = postSpy.mock.calls[0][0];
      expect(payload.status).toBe('success');
      expect(payload.results.stats.Median).toBeDefined();
      expect(payload.results.stats['25th Percentile']).toBeDefined();
      expect(payload.results.stats['75th Percentile']).toBeDefined();
    });
  });

  test('maps unknown measure for numeric to scale and returns scale stats', () => {
    withIsolatedWorker(() => {
      const postSpy = jest.fn();
      global.postMessage = postSpy;

      const variable = { name: 'Val', label: 'Val', measure: 'unknown', type: 'numeric', missing: { type: 'none' } };
      const data = [10, 20, 30];

      global.onmessage({ data: { variable, data } });

      const payload = postSpy.mock.calls[0][0];
      expect(payload.status).toBe('success');
      expect(payload.results.stats.Mean).toBeCloseTo(20, 10);
      expect(payload.results.stats.StdDev).toBeDefined();
    });
  });
  test('posts error when measurement level is invalid', () => {
    withIsolatedWorker(() => {
      const postSpy = jest.fn();
      global.postMessage = postSpy;

      const variable = {
        name: 'Y',
        label: 'Y',
        measure: 'invalid-measure', // forces default branch error in calculator
        type: 'numeric',
        missing: { type: 'none' },
      };
      const data = [1, 2, 3];

      global.onmessage({ data: { variable, data } });

      expect(postSpy).toHaveBeenCalledTimes(1);
      const payload = postSpy.mock.calls[0][0];
      expect(payload.status).toBe('error');
      expect(payload.variableName).toBe('Y');
      expect(typeof payload.error).toBe('string');
    });
  });
});


