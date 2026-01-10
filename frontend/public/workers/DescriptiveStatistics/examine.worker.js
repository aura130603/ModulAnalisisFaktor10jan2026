importScripts('/workers/DescriptiveStatistics/libs/utils/utils.js');
importScripts('/workers/DescriptiveStatistics/libs/descriptive/descriptive.js');
importScripts('/workers/DescriptiveStatistics/libs/frequency/frequency.js');
importScripts('/workers/DescriptiveStatistics/libs/examine/examine.js');

onmessage = function (event) {
  console.log('[ExamineWorker] Message received', event.data);
  const { variable, data, caseNumbers, weights, options } = event.data || {};

  try {
    const calculator = new self.ExamineCalculator({ variable, data, caseNumbers, weights, options });
    const results = calculator.getStatistics();

    

    console.log('[ExamineWorker] Calculation success – posting results');
    postMessage({
      status: 'success',
      variableName: variable?.name,
      results,
    });
  } catch (err) {
    console.error('[ExamineWorker] Error:', err);
    postMessage({
      status: 'error',
      variableName: variable?.name,
      error: err?.message || String(err),
    });
  }
};