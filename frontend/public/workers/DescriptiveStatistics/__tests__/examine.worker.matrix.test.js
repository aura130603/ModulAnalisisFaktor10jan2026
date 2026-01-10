/**
 * Matrix coverage tests for DescriptiveStatistics/examine.worker.js
 * Validates behavior across type × measurement and key outputs (CI, percentiles, hinges, extremes).
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

  // Load prerequisites
  require(path.join(process.cwd(), 'public/workers/DescriptiveStatistics/libs/utils/utils.js'));
  require(path.join(process.cwd(), 'public/workers/DescriptiveStatistics/libs/descriptive/descriptive.js'));
  require(path.join(process.cwd(), 'public/workers/DescriptiveStatistics/libs/frequency/frequency.js'));

  // Load worker
  const workerPath = path.join(process.cwd(), 'public/workers/DescriptiveStatistics/examine.worker.js');
  delete require.cache[require.resolve(workerPath)];
  require(workerPath);
}

describe('examine.worker – type × measurement matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('numeric with unknown measurement behaves as scale and produces CI/percentiles/trimmed mean', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'Num', label: 'Num', measure: 'unknown', type: 'NUMERIC', missing: { type: 'none' } };
    const data = [1, 2, 3, null];

    global.onmessage({ data: { variable, data, options: { confidenceInterval: 95, showOutliers: true } } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.status).toBe('success');
    const r = payload.results;
    expect(r).toBeDefined();
    expect(r.descriptives).toBeDefined();
    // CI present
    expect(r.descriptives.confidenceInterval).toBeDefined();
    // Percentiles (haverage default)
    expect(r.percentiles).toBeDefined();
    // Trimmed mean
    expect(typeof r.trimmedMean === 'number' || r.trimmedMean === null).toBe(true);
    // Tukey hinges add IQR to descriptives
    expect(typeof r.descriptives.IQR === 'number' || r.descriptives.IQR === null).toBe(true);
  });

  test('numeric ordinal also treated as numeric for examine outputs', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'NumOrd', label: 'NumOrd', measure: 'ordinal', type: 'NUMERIC' };
    const data = [1, 2, 2, 3];

    global.onmessage({ data: { variable, data, options: {} } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.status).toBe('success');
    expect(payload.results.descriptives).toBeDefined();
    expect(payload.results.percentiles).toBeDefined();
  });

  test('date dependent: returns frequency-based stats; mean provided as SPSS seconds while mode uses dd-mm-yyyy', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'EventDate', label: 'Event Date', measure: 'unknown', type: 'DATE' };
    const data = ['01-01-2020', '02-01-2020', '01-01-2020'];

    global.onmessage({ data: { variable, data, options: {} } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.status).toBe('success');
    const d = payload.results.descriptives;
    expect(d).toBeDefined();
    expect(typeof d.Mean === 'number' || d.Mean === null).toBe(true);
    // Mode formatted as dd-mm-yyyy
    expect(Array.isArray(d.Mode)).toBe(true);
    expect(d.Mode.join(',')).toEqual(expect.stringContaining('01-01-2020'));
  });

  test('showOutliers uses hinges/extremes when requested', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = { name: 'Num', label: 'Num', measure: 'scale', type: 'NUMERIC' };
    const data = [1, 2, 100, 3, 4];

    global.onmessage({ data: { variable, data, options: { showOutliers: true } } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.status).toBe('success');
    const r = payload.results;
    // Hinges provided (and used for IQR in descriptives)
    expect(r.hinges).toBeDefined();
    expect(r.descriptives.IQR === null || typeof r.descriptives.IQR === 'number').toBe(true);
    // Extreme values present
    expect(r.extremeValues === null || typeof r.extremeValues === 'object').toBe(true);
  });
});


