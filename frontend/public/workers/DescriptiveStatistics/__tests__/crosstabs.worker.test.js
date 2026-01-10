/**
 * Unit tests for DescriptiveStatistics/crosstabs.worker.js
 */
const path = require('path');

function loadWorker() {
  global.self = global;
  global.importScripts = (...urls) => {
    urls.forEach((u) => {
      const localPath = path.join(process.cwd(), 'public', u.replace(/^\/+/, ''));
      delete require.cache[require.resolve(localPath)];
      require(localPath);
    });
  };

  require(path.join(process.cwd(), 'public/workers/DescriptiveStatistics/libs/utils/utils.js'));

  const workerPath = path.join(process.cwd(), 'public/workers/DescriptiveStatistics/crosstabs.worker.js');
  delete require.cache[require.resolve(workerPath)];
  require(workerPath);
}

describe('crosstabs.worker', () => {
  test('posts success for simple 2x2 table', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = {
      row: { name: 'Gender', measure: 'nominal', type: 'STRING' },
      col: { name: 'Vote', measure: 'nominal', type: 'STRING' },
    };
    const data = [
      { Gender: 'Male', Vote: 'Yes' },
      { Gender: 'Male', Vote: 'No' },
      { Gender: 'Female', Vote: 'Yes' },
      { Gender: 'Female', Vote: 'No' },
    ];

    global.onmessage({ data: { variable, data, options: {} } });

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = postSpy.mock.calls[0][0];
    expect(payload.status).toBe('success');
    expect(payload.variableName).toBe('Gender * Vote');
    expect(payload.results).toBeDefined();
  });

  test('supports date strings (dd-mm-yyyy) in row/col and preserves labels in summary', () => {
    const postSpy = jest.fn();
    global.postMessage = postSpy;
    loadWorker();

    const variable = {
      row: { name: 'Start', measure: 'unknown', type: 'DATE' },
      col: { name: 'End', measure: 'unknown', type: 'DATE' },
    };
    const data = [
      { Start: '01-01-2024', End: '02-01-2024' },
      { Start: '01-01-2024', End: '02-01-2024' },
      { Start: '02-01-2024', End: '03-01-2024' },
    ];

    global.onmessage({ data: { variable, data, options: {} } });

    const payload = postSpy.mock.calls[0][0];
    expect(payload.status).toBe('success');
    const summary = payload.results.summary;
    // Expect categories to be returned as dd-mm-yyyy strings
    expect(summary.rowCategories).toEqual(expect.arrayContaining(['01-01-2024', '02-01-2024']));
    expect(summary.colCategories).toEqual(expect.arrayContaining(['02-01-2024', '03-01-2024']));
  });
});


