importScripts('/workers/DescriptiveStatistics/libs/utils/utils.js');
importScripts('/workers/DescriptiveStatistics/libs/descriptive/descriptive.js');
importScripts('/workers/DescriptiveStatistics/libs/frequency/frequency.js');


onmessage = function (event) {
  const {
    variable,
    data,
    weights,
    options,
    variableData,          // Batched mode array [{ variable, data }]
    weightVariableData,    // Optional weights array for batched mode
  } = event.data || {};

  // -------------------------------------------------------------
  
  // -------------------------------------------------------------
  if (Array.isArray(variableData)) {
    try {
      const combinedResults = {
        statistics: {},
        frequencyTables: {},
      };

      const freqOptions = options || {};

      for (const item of variableData) {
        const { variable: varDef, data: varData } = item;
        const calculator = new self.FrequencyCalculator({
          variable: varDef,
          data: varData,
          weights: weightVariableData || null,
          options: freqOptions,
        });

        const { stats, frequencyTable, summary } = calculator.getStatistics();

        let processedStats = stats;

        // Build full frequency table object with title, rows, and summary
        let processedFreqTbl = frequencyTable
          ? applyValueLabels({
              title: varDef.label || varDef.name,
              rows: frequencyTable,
              summary: summary,
            }, varDef)
          : null;

        if (processedStats) combinedResults.statistics[varDef.name] = processedStats;
        if (processedFreqTbl) combinedResults.frequencyTables[varDef.name] = processedFreqTbl;
      }

      postMessage({ success: true, results: combinedResults });
    } catch (err) {
      console.error('[FrequenciesWorker] Error (batched mode):', err);
      postMessage({ success: false, error: err?.message || String(err) });
    }
    return; // Early exit – batched mode handled
  }

  // -------------------------------------------------------------
  // 2. Single-Variable Mode
  // -------------------------------------------------------------
  try {
    const calculator = new self.FrequencyCalculator({ variable, data, weights, options });
    const results = calculator.getStatistics();
    
    if (results && results.frequencyTable) {
       results.frequencyTable = applyValueLabels(results.frequencyTable, variable);
    }
    postMessage({ success: true, results });
  } catch (err) {
    console.error('[FrequenciesWorker] Error:', err);
    postMessage({ success: false, error: err?.message || String(err) });
  }
};