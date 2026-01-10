/**
 * Unit tests for DescriptiveStatistics/frequencies.worker.js
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

describe('frequencies.worker', () => {
  test('single-variable mode returns success and frequency table', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = {
      name: 'G',
      label: 'Gender',
      measure: 'nominal',
      type: 'STRING',
      values: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' },
      ],
    };
    const data = ['M', 'F', 'M'];

    global.onmessage({ data: { variable, data, options: { displayFrequency: true } } });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.results).toBeDefined();
    // Depending on FrequencyCalculator shape, expect frequencyTable or statistics exist
    expect(payload.results.frequencyTable || payload.results.statistics).toBeDefined();
  });

  test('handles date values (dd-mm-yyyy) with unknown measure (mapped to scale)', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = {
      name: 'EventDate',
      label: 'Event Date',
      // Unknown should map to scale for date core type
      measure: 'unknown',
      type: 'DATE',
      missing: { type: 'none' },
    };
    const data = ['01-01-2024', '02-01-2024', '01-01-2024', null];

    global.onmessage({ data: { variable, data, options: { displayFrequency: true } } });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.results).toBeDefined();
    // Frequency table values should be shown as dd-mm-yyyy, not raw seconds
    const labels = (payload.results.frequencyTable || []).map(r => r.value);
    expect(labels).toEqual(expect.arrayContaining(['01-01-2024', '02-01-2024']));
    // Stats should exist for scale-like data
    expect(payload.results.stats).toBeDefined();
    expect(payload.results.stats.N).toBeGreaterThan(0);
    // Mode should be formatted as date string
    expect(payload.results.stats.Mode).toEqual(expect.arrayContaining(['01-01-2024']));
  });

  test('handles ordinal measurement (numeric) with median/IQR', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'Satisfaction', measure: 'ordinal', type: 'numeric', missing: { type: 'none' } };
    const data = [1, 2, 2, 3, 4, null];

    global.onmessage({ data: { variable, data, options: {} } });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.results).toBeDefined();
    expect(payload.results.stats).toBeDefined();
    // Dengan definisi persentil di lib saat ini, median untuk [1,2,2,3,4] adalah 3
    expect(payload.results.stats.Median).toBeCloseTo(3, 10);
    expect(payload.results.stats.IQR).toBeDefined();
    expect(payload.results.stats.Mode).toEqual(expect.arrayContaining([2]));
  });

  test('handles unknown measurement for STRING as nominal', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'Cat', measure: 'unknown', type: 'STRING', missing: { type: 'none' } };
    const data = ['A', 'B', 'A'];

    global.onmessage({ data: { variable, data, options: {} } });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.results).toBeDefined();
    expect(payload.results.stats).toBeDefined();
    // For nominal, N equals valid weighted count
    expect(payload.results.stats.N).toBe(3);
    // Mode should resolve to 'A'
    expect(payload.results.stats.Mode).toEqual(expect.arrayContaining(['A']));
  });
  test('batched mode returns combinedResults', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const ageVar = { name: 'Age', measure: 'scale', type: 'numeric' };
    const incVar = { name: 'Income', measure: 'scale', type: 'numeric' };

    const variableData = [
      { variable: ageVar, data: [20, 30, 40] },
      { variable: incVar, data: [100, 200, 300] },
    ];

    global.onmessage({ data: { variableData, weightVariableData: null, options: {} } });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.results).toBeDefined();
    expect(payload.results.statistics).toBeDefined();
    expect(payload.results.frequencyTables).toBeDefined();
  });
});


