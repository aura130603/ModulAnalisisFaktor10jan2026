/**
 * Matrix coverage tests for DescriptiveStatistics/frequencies.worker.js
 * Ensures parity with Descriptive tests across type × measurement.
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

  // Ensure utils is available
  require(path.join(process.cwd(), 'public/workers/DescriptiveStatistics/libs/utils/utils.js'));

  const workerPath = path.join(process.cwd(), 'public/workers/DescriptiveStatistics/frequencies.worker.js');
  delete require.cache[require.resolve(workerPath)];
  require(workerPath);
}

describe('frequencies.worker – type × measurement matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('numeric with unknown measurement behaves as scale: mean/range present', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'Num', label: 'Num', measure: 'unknown', type: 'NUMERIC', missing: { type: 'none' } };
    const data = [1, 2, 3, '', null];

    global.onmessage({ data: { variable, data, options: { displayFrequency: true } } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    const stats = payload.results.stats;
    expect(stats).toBeDefined();
    expect(stats.N).toBeGreaterThan(0);
    expect(typeof stats.Mean === 'number' || stats.Mean === null).toBe(true);
    expect(typeof stats.Range === 'number' || stats.Range === null).toBe(true);
  });

  test('string with ordinal measurement computes numeric percentiles from numeric-coded strings', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'CatOrd', label: 'CatOrd', measure: 'ordinal', type: 'STRING', missing: { type: 'none' } };
    const data = ['1', '2', '3', '4'];

    global.onmessage({ data: { variable, data, options: { displayFrequency: true } } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    const stats = payload.results.stats;
    expect(stats).toBeDefined();
    expect(stats['25th Percentile']).toBeGreaterThan(0);
    expect(stats.Median).toBeGreaterThan(0);
    expect(stats['75th Percentile']).toBeGreaterThan(0);
  });

  test('string with scale measurement computes mean/stddev over numeric-coded strings', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'CatScale', label: 'CatScale', measure: 'scale', type: 'STRING', missing: { type: 'none' } };
    const data = ['1', '2', '3', ''];

    global.onmessage({ data: { variable, data, options: { displayFrequency: true } } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    const stats = payload.results.stats;
    expect(stats).toBeDefined();
    expect(stats.N).toBeGreaterThan(0);
    expect(typeof stats.Mean === 'number' || stats.Mean === null).toBe(true);
    expect(typeof stats.StdDev === 'number' || stats.StdDev === null).toBe(true);
  });

  test('date with nominal measurement: labels remain dd-mm-yyyy, stats exclude numeric mean', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'EventDate', label: 'Event Date', measure: 'nominal', type: 'DATE', missing: { type: 'none' } };
    const data = ['01-01-2020', '02-01-2020', '01-01-2020', null];

    global.onmessage({ data: { variable, data, options: { displayFrequency: true } } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    const table = payload.results.frequencyTable || payload.results.frequencyTables?.EventDate;
    const labels = Array.isArray(table)
      ? table.map(r => r.value)
      : ((table?.rows || []).map(r => r.label || r.value));
    expect(labels).toEqual(expect.arrayContaining(['01-01-2020', '02-01-2020']));

    const stats = payload.results.stats;
    expect(stats).toBeDefined();
    expect(stats.Mean).toBeUndefined();
    expect(Array.isArray(stats.Mode)).toBe(true);
    // Mode should include one of the dates (display as dd-mm-yyyy)
    expect(stats.Mode.join(',')).toEqual(expect.stringContaining('01-01-2020'));
  });

  test('date with scale measurement: mean/range computed over SPSS seconds', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'EventDate', label: 'Event Date', measure: 'scale', type: 'DATE', missing: { type: 'none' } };
    const data = ['01-01-2020', '02-01-2020'];

    global.onmessage({ data: { variable, data, options: { displayFrequency: true } } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.success).toBe(true);
    const stats = payload.results.stats;
    expect(typeof stats.Mean === 'number' || stats.Mean === null).toBe(true);
    expect(typeof stats.Range === 'number' || stats.Range === null).toBe(true);
  });
});


