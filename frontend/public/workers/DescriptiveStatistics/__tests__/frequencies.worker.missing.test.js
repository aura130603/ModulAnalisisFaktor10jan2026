/**
 * Missing-handling tests for DescriptiveStatistics/frequencies.worker.js
 */
const path = require('path');

function loadWorker() {
  // Simulate worker environment
  global.self = global;
  global.importScripts = (...urls) => {
    urls.forEach((u) => {
      const localPath = path.join(process.cwd(), 'public', u.replace(/^\/+/, ''));
      delete require.cache[require.resolve(localPath)];
      require(localPath);
    });
  };

  // Ensure utils is available for applyValueLabels etc.
  require(path.join(process.cwd(), 'public/workers/DescriptiveStatistics/libs/utils/utils.js'));

  const workerPath = path.join(process.cwd(), 'public/workers/DescriptiveStatistics/frequencies.worker.js');
  delete require.cache[require.resolve(workerPath)];
  require(workerPath);
}

describe('frequencies.worker – missing handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('numeric with null/NaN and range-missing is counted in summary.missing', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = {
      name: 'Score',
      label: 'Score',
      measure: 'scale',
      type: 'NUMERIC',
      missing: { type: 'range', low: 90, high: 100 }, // treat 90..100 as missing
    };
    const data = [50, 95, null, 50, NaN]; // valid: 50, 50; missing: 95, null, NaN => 3

    global.onmessage({ data: { variable, data, options: { displayFrequency: true } } });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.results).toBeDefined();
    expect(payload.results.summary).toBeDefined();
    expect(payload.results.summary.valid).toBe(2);
    expect(payload.results.summary.missing).toBe(3);
    expect(payload.results.summary.total).toBe(5);
  });

  test('string with empty and discrete-missing is counted in summary.missing', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = {
      name: 'Cat',
      label: 'Category',
      measure: 'nominal',
      type: 'STRING',
      missing: { type: 'discrete', values: ['MISSING'] }, // treat specific token as missing
    };
    const data = ['A', '', 'MISSING', 'B', null]; // valid: A, B; missing: '', 'MISSING', null => 3

    global.onmessage({ data: { variable, data, options: { displayFrequency: true } } });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.results).toBeDefined();
    expect(payload.results.summary).toBeDefined();
    expect(payload.results.summary.valid).toBe(2);
    expect(payload.results.summary.missing).toBe(3);
    expect(payload.results.summary.total).toBe(5);
  });
});


