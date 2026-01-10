// residuals_statistics.js

self.onmessage = function(e) {
  const { dependent, independent } = e.data;

  /* -------------------------------------------------------------------------
     1. Input validation & normalization
     ----------------------------------------------------------------------*/
  if (!Array.isArray(dependent) || !Array.isArray(independent)) {
    self.postMessage({ error: "Data dependent dan independent harus berupa array." });
    return;
  }

  // Ensure independent is an array of arrays => shape: [p][n]
  const independents = Array.isArray(independent[0]) ? independent : [independent];

  const n = dependent.length;
  const p = independents.length; // jumlah prediktor

  // Pastikan semua independent memiliki panjang yang sama dengan dependent
  if (independents.some(arr => !Array.isArray(arr) || arr.length !== n)) {
    self.postMessage({ error: "Setiap variabel independent harus memiliki panjang yang sama dengan dependent." });
    return;
  }

  /* -------------------------------------------------------------------------
     2. Hitung koefisien regresi dengan Ordinary Least Squares
     ----------------------------------------------------------------------*/
  try {
    // Bangun matriks X (dengan kolom intercept)
    const X = [];
    for (let i = 0; i < n; i++) {
      const row = [1]; // intercept
      for (let j = 0; j < p; j++) {
        row.push(independents[j][i]);
      }
      X.push(row);
    }

    // Helper functions ----------------------------------------------------
    const transpose = (m) => m[0].map((_, colIdx) => m.map(row => row[colIdx]));

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
      // Augment with identity matrix
      const augmented = matrix.map((row, i) => row.concat(row.map((_, j) => (i === j ? 1 : 0))));

      for (let i = 0; i < n; i++) {
        // Pivot selection (max abs value in column i)
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
          if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) maxRow = k;
        }
        // Swap if needed
        if (maxRow !== i) {
          const tmp = augmented[i];
          augmented[i] = augmented[maxRow];
          augmented[maxRow] = tmp;
        }
        // Check singularity
        const pivot = augmented[i][i];
        if (Math.abs(pivot) < 1e-12) throw new Error("Matrix is singular");

        // Normalize pivot row
        for (let j = 0; j < 2 * n; j++) augmented[i][j] /= pivot;

        // Eliminate other rows
        for (let r = 0; r < n; r++) {
          if (r !== i) {
            const factor = augmented[r][i];
            for (let c = 0; c < 2 * n; c++) {
              augmented[r][c] -= factor * augmented[i][c];
            }
          }
        }
      }
      // Extract inverse (right half)
      return augmented.map(row => row.slice(n));
    };

    // Perhitungan β = (X'X)^-1 X'y ---------------------------------------
    const Xt = transpose(X);
    const XtX = multiplyMatrices(Xt, X);
    const XtX_inv = invertMatrix(XtX);
    const Xty = multiplyMatrixVector(Xt, dependent);
    const beta = multiplyMatrixVector(XtX_inv, Xty); // [β0, β1, ..., βp]

    // Hitung nilai prediksi ----------------------------------------------
    const yPred = X.map(row => row.reduce((sum, val, idx) => sum + val * beta[idx], 0));

    // Residu -------------------------------------------------------------
    const residuals = dependent.map((y, idx) => y - yPred[idx]);

    /* ---------------------------------------------------------------------
       3. Statistik dasar
       ------------------------------------------------------------------*/
    const mean = (arr) => arr.reduce((sum, v) => sum + v, 0) / arr.length;

    const getStats = (arr) => {
      const m = mean(arr);
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1);
      const stdDev = Math.sqrt(variance);
      return { min, max, mean: m, stdDev, n: arr.length };
    };

    const statsPred = getStats(yPred);
    const statsRes = getStats(residuals);

    // Standar deviasi dari Predicted (z-score)
    const stdPredVals = yPred.map(v => (v - statsPred.mean) / statsPred.stdDev);
    const statsStdPred = getStats(stdPredVals);

    // Standard error of estimate: s = sqrt(SSE / (n - p - 1))
    const SSE = residuals.reduce((sum, r) => sum + r * r, 0);
    const s = Math.sqrt(SSE / (n - p - 1));

    const stdResVals = residuals.map(r => r / s);
    const statsStdRes = getStats(stdResVals);

    const round = (val, dec) => Number(val.toFixed(dec));

    const result = {
      tables: [
        {
          title: "Residuals Statistics",
          columnHeaders: [
            { header: "" },
            { header: "Minimum", key: "minimum" },
            { header: "Maximum", key: "maximum" },
            { header: "Mean", key: "mean" },
            { header: "Std. Deviation", key: "stdDeviation" },
            { header: "N", key: "n" }
          ],
          rows: [
            {
              rowHeader: ["Predicted Value"],
              minimum: round(statsPred.min, 4),
              maximum: round(statsPred.max, 4),
              mean: round(statsPred.mean, 4),
              stdDeviation: round(statsPred.stdDev, 5),
              n: statsPred.n
            },
            {
              rowHeader: ["Residual"],
              minimum: round(statsRes.min, 4),
              maximum: round(statsRes.max, 4),
              mean: round(statsRes.mean, 4),
              stdDeviation: round(statsRes.stdDev, 5),
              n: statsRes.n
            },
            {
              rowHeader: ["Std. Predicted Value"],
              minimum: round(statsStdPred.min, 3),
              maximum: round(statsStdPred.max, 3),
              mean: round(statsStdPred.mean, 3),
              stdDeviation: round(statsStdPred.stdDev, 3),
              n: statsStdPred.n
            },
            {
              rowHeader: ["Std. Residual"],
              minimum: round(statsStdRes.min, 3),
              maximum: round(statsStdRes.max, 3),
              mean: round(statsStdRes.mean, 3),
              stdDeviation: round(statsStdRes.stdDev, 3),
              n: statsStdRes.n
            }
          ]
        }
      ]
    };

    self.postMessage(result);
  } catch (err) {
    console.error("Residuals Statistics Worker error:", err);
    self.postMessage({ error: err.message || "Unknown error in residuals_statistics.js" });
  }
};
  