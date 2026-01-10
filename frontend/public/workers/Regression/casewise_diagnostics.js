// casewise_diagnostics.js

self.onmessage = function(e) {
  const { dependent, independent, dependentVariableInfo, threshold } = e.data;

  /* -------------------------------------------------------------------------
     1. Validation & normalization
  -------------------------------------------------------------------------*/
  if (!Array.isArray(dependent) || !Array.isArray(independent) || !dependentVariableInfo) {
    self.postMessage({ error: "Data dependent, independent, dan dependentVariableInfo harus disediakan dengan format array." });
    return;
  }

  // Pastikan independent berupa array of arrays [p][n]
  const independents = Array.isArray(independent[0]) ? independent : [independent];
  const n = dependent.length;
  const p = independents.length; // jumlah prediktor

  if (independents.some(arr => !Array.isArray(arr) || arr.length !== n)) {
    self.postMessage({ error: "Setiap variabel independent harus memiliki panjang yang sama dengan dependent." });
    return;
  }

  try {
    /* -----------------------------------------------------------------------
       2. Hitung koefisien regresi OLS
    -----------------------------------------------------------------------*/
    // Bangun matriks X (dengan kolom intercept)
    const X = [];
    for (let i = 0; i < n; i++) {
      const row = [1];
      for (let j = 0; j < p; j++) {
        row.push(independents[j][i]);
      }
      X.push(row);
    }

    // Helper matrix functions (mini implementation)
    const transpose = m => m[0].map((_, col) => m.map(row => row[col]));

    const multiplyMatrices = (A, B) => {
      const rowsA = A.length, colsA = A[0].length, colsB = B[0].length;
      const result = Array.from({ length: rowsA }, () => Array(colsB).fill(0));
      for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
          for (let k = 0; k < colsA; k++) {
            result[i][j] += A[i][k] * B[k][j];
          }
        }
      }
      return result;
    };

    const multiplyMatrixVector = (M, v) => M.map(row => row.reduce((sum, val, idx) => sum + val * v[idx], 0));

    const invertMatrix = (matrix) => {
      const n = matrix.length;
      const augmented = matrix.map((row, i) => row.concat(row.map((_, j) => (i === j ? 1 : 0))));
      for (let i = 0; i < n; i++) {
        // pivot
        let maxRow = i;
        for (let k = i + 1; k < n; k++) if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) maxRow = k;
        if (maxRow !== i) [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        const pivot = augmented[i][i];
        if (Math.abs(pivot) < 1e-12) throw new Error("Matrix singular");
        for (let j = 0; j < 2 * n; j++) augmented[i][j] /= pivot;
        for (let r = 0; r < n; r++) {
          if (r !== i) {
            const factor = augmented[r][i];
            for (let c = 0; c < 2 * n; c++) augmented[r][c] -= factor * augmented[i][c];
          }
        }
      }
      return augmented.map(row => row.slice(n));
    };

    const Xt = transpose(X);
    const XtX = multiplyMatrices(Xt, X);
    const XtX_inv = invertMatrix(XtX);
    const Xty = multiplyMatrixVector(Xt, dependent);
    const beta = multiplyMatrixVector(XtX_inv, Xty);

    /* -----------------------------------------------------------------------
       3. Predicted values & residuals
    -----------------------------------------------------------------------*/
    const predicted = X.map(row => row.reduce((sum, val, idx) => sum + val * beta[idx], 0));
    const residuals = dependent.map((y, i) => y - predicted[i]);

    const SSE = residuals.reduce((sum, e) => sum + e * e, 0);
    const df = n - p - 1;
    const s = Math.sqrt(SSE / df);

    const stdResiduals = residuals.map(e => e / s);

    const round = (val, dec) => Number(val.toFixed(dec));

    /* -----------------------------------------------------------------------
       4. Build table rows (SPSS style)
    -----------------------------------------------------------------------*/
    const depVarName = dependentVariableInfo.name;
    const depVarHeader = (dependentVariableInfo.label && dependentVariableInfo.label.trim() !== '') ? dependentVariableInfo.label : dependentVariableInfo.name;

    const cases = [];
    for (let i = 0; i < n; i++) {
      cases.push({
        caseNumber: (i + 1).toString(),
        stdResidual: round(stdResiduals[i], 3),
        [depVarName]: round(dependent[i], 2),
        predictedValue: round(predicted[i], 4),
        residual: round(residuals[i], 4)
      });
    }

    const result = {
      tables: [
        {
          title: "Casewise Diagnostics",
          columnHeaders: [
            { header: "Case Number" },
            { header: "Std. Residual", key: "stdResidual" },
            { header: depVarHeader, key: depVarName },
            { header: "Predicted Value", key: "predictedValue" },
            { header: "Residual", key: "residual" }
          ],
          rows: cases.map(c => ({
            rowHeader: [c.caseNumber],
            stdResidual: c.stdResidual,
            [depVarName]: c[depVarName],
            predictedValue: c.predictedValue,
            residual: c.residual
          }))
        }
      ]
    };

    self.postMessage(result);
  } catch (err) {
    console.error("Casewise Diagnostics Worker error:", err);
    self.postMessage({ error: err.message || "Unknown error in casewise_diagnostics.js" });
  }
};
  