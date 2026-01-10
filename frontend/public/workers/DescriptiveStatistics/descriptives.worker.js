importScripts('/workers/DescriptiveStatistics/libs/utils/utils.js');
importScripts('/workers/DescriptiveStatistics/libs/descriptive/descriptive.js');

onmessage = function (event) {
  const { variable, data, weights, options } = event.data || {};

  try {
        const calculator = new self.DescriptiveCalculator({ variable, data, weights, options });
    const results = calculator.getStatistics();

    postMessage({
      status: 'success',
      variableName: variable?.name,
      results,
    });
  } catch (err) {
    console.error('[DescriptivesWorker] Calculation error:', err);
    postMessage({
      status: 'error',
      variableName: variable?.name,
      error: err?.message || String(err),
    });
  }
};