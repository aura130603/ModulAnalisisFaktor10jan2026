self.onmessage = function(e) {
  const { dependent, independent, dependentVariableInfo, independentVariableInfos } = e.data;

  if (!dependent || !independent || !dependentVariableInfo || !independentVariableInfos) {
    self.postMessage({ error: "Data dependent, independent, dependentVariableInfo, dan independentVariableInfos harus disediakan." });
    return;
  }
  if (!Array.isArray(dependent) || !Array.isArray(independent)) {
    self.postMessage({ error: "Data dependent dan independent harus berupa array." });
    return;
  }

  function mean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  function sampleStdDev(arr) {
    const m = mean(arr);
    const sumSq = arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0);
    return Math.sqrt(sumSq / (arr.length - 1));
  }

  const rows = [];

  const depDisplayName = (dependentVariableInfo.label && dependentVariableInfo.label.trim() !== '') 
    ? dependentVariableInfo.label 
    : dependentVariableInfo.name;

  const statsDependent = {
    variable: depDisplayName,
    mean: parseFloat(mean(dependent).toFixed(2)),
    stdDeviation: parseFloat(sampleStdDev(dependent).toFixed(5)),
    n: dependent.length
  };

  rows.push(Object.assign({ rowHeader: [depDisplayName] }, statsDependent));

  for (let i = 0; i < independent.length; i++) {
    const varInfo = independentVariableInfos[i];
    const indepDisplayName = (varInfo.label && varInfo.label.trim() !== '') 
      ? varInfo.label 
      : varInfo.name;
    const statsIndependent = {
      variable: indepDisplayName,
      mean: parseFloat(mean(independent[i]).toFixed(2)),
      stdDeviation: parseFloat(sampleStdDev(independent[i]).toFixed(5)),
      n: independent[i].length
    };

    rows.push(Object.assign({ rowHeader: [indepDisplayName] }, statsIndependent));
  }

  const result = {
    tables: [
      {
        title: "Descriptive Statistics",
        columnHeaders: [
          { header: "Variable", key: "variable" },
          { header: "Mean", key: "mean" },
          { header: "Std. Deviation", key: "stdDeviation" },
          { header: "N", key: "n" }
        ],
        rows: rows
      }
    ]
  };

  self.postMessage(result);
};