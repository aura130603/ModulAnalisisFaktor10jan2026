// variables.js

self.onmessage = function(e) {
  const { dependent, independent, dependentVariableInfo, independentVariableInfos } = e.data;
  
  // Validasi input
  if (!dependent || !independent) {
    self.postMessage({ error: "Data dependent dan independent harus disediakan." });
    return;
  }
  if (!Array.isArray(dependent) || !Array.isArray(independent[0])) {
    self.postMessage({ error: "Data dependent dan independent harus berupa array." });
    return;
  }
  
  // Dapatkan nama variabel dependent (prioritaskan label)
  const depVarName = (dependentVariableInfo.label && dependentVariableInfo.label.trim() !== '') 
    ? dependentVariableInfo.label 
    : dependentVariableInfo.name;
  
  const indepVarsDisplay = [];
  
  // Buat nama variabel untuk setiap independent (prioritaskan label)
  if (independentVariableInfos) {
    for (let i = 0; i < independentVariableInfos.length; i++) {
      const varInfo = independentVariableInfos[i];
      const displayName = (varInfo.label && varInfo.label.trim() !== '') 
        ? varInfo.label 
        : varInfo.name;
      indepVarsDisplay.push(displayName);
    }
  }
  
  // Bangun objek JSON hasil sesuai struktur yang diinginkan
  const result = {
    tables: [
      {
        title: "Variables Entered/Removed",
        columnHeaders: [
          { header: "Model" },
          { header: "Variables Entered", key: "variablesEntered" },
          { header: "Variables Removed", key: "variablesRemoved" },
          { header: "Method", key: "method" }
        ],
        rows: [
          {
            rowHeader: ["1"],
            variablesEntered: indepVarsDisplay.join(", "),
            variablesRemoved: ".",
            method: "Enter"
          }
        ],
        footnote: {
          "a": `Dependent Variable: ${depVarName}`,
          "b": "All requested variables entered."
        }
      }
    ]
  };
  
  // Kirim hasil ke thread utama
  self.postMessage(result);
};