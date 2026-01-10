// Worker untuk menghitung Model Summary (sesuai output SPSS)

self.onmessage = function (e) {
  const { dependent, independent } = e.data;

  // ===== Validasi Input =====
  if (!Array.isArray(dependent)) {
    self.postMessage({ error: "'dependent' harus berupa array." });
    return;
  }

  // `independent` boleh berupa satu array (single predictor) atau array of arrays
  const isArrayOfArrays = Array.isArray(independent) && (independent.length === 0 || Array.isArray(independent[0]));

  let independentData;
  if (isArrayOfArrays) {
    independentData = independent;
  } else if (Array.isArray(independent)) {
    independentData = [independent]; // jadikan array of arrays
  } else {
    self.postMessage({ error: "'independent' harus berupa array atau array of arrays." });
    return;
  }

  const n = dependent.length;
  const k = independentData.length; // jumlah variabel independen

  if (k === 0) {
    self.postMessage({ error: "Minimal harus ada satu variabel independen." });
    return;
  }

  // Pastikan tiap array independen memiliki panjang sama dengan dependent
  if (independentData.some(arr => arr.length !== n)) {
    self.postMessage({ error: "Semua variabel independen harus memiliki panjang yang sama dengan dependent." });
    return;
  }

  // ===== Helper Functions =====
  const round = (val, decimals = 3) => Number(val.toFixed(decimals));

  function transpose(matrix) {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  function multiplyMatrices(a, b) {
    const aRows = a.length,
      aCols = a[0].length,
      bCols = b[0].length;
    const result = Array.from({ length: aRows }, () => Array(bCols).fill(0));

    for (let i = 0; i < aRows; i++) {
      for (let j = 0; j < bCols; j++) {
        for (let m = 0; m < aCols; m++) {
          result[i][j] += a[i][m] * b[m][j];
        }
      }
    }
    return result;
  }

  // Invers matriks menggunakan Gauss-Jordan elimination (cukup untuk matriks kecil)
  function inverse(matrix) {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => [
      ...row,
      ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    ]);

    for (let i = 0; i < n; i++) {
      // Pivot maksimum untuk stabilitas numerik
      let maxRow = i;
      for (let r = i + 1; r < n; r++) {
        if (Math.abs(augmented[r][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = r;
        }
      }
      if (Math.abs(augmented[maxRow][i]) < 1e-12) {
        throw new Error("Matriks singular, tidak dapat dihitung inversnya.");
      }
      // Tukar baris jika perlu
      if (maxRow !== i) {
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      }

      // Normalisasi baris pivot
      const pivot = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }

      // Eliminasi baris lain
      for (let r = 0; r < n; r++) {
        if (r !== i) {
          const factor = augmented[r][i];
          for (let c = 0; c < 2 * n; c++) {
            augmented[r][c] -= factor * augmented[i][c];
          }
        }
      }
    }

    // Ekstrak kolom kanan -> invers
    return augmented.map(row => row.slice(n));
  }

  // ===== Persiapan Matriks Desain =====
  // Tambahkan kolom intercept (1)
  const X = Array.from({ length: n }, (_, rowIdx) => {
    const row = [1];
    for (let j = 0; j < k; j++) {
      row.push(independentData[j][rowIdx]);
    }
    return row;
  });

  // Hitung koefisien regresi β = (X'X)^{-1} X'y
  const Xt = transpose(X);
  const XtX = multiplyMatrices(Xt, X);
  let XtXInv;
  try {
    XtXInv = inverse(XtX);
  } catch (err) {
    self.postMessage({ error: err.message });
    return;
  }

  const yCol = dependent.map(val => [val]);
  const XtY = multiplyMatrices(Xt, yCol);
  const beta = multiplyMatrices(XtXInv, XtY).map(row => row[0]);

  // Prediksi nilai Y
  const yPred = X.map(row => row.reduce((sum, val, idx) => sum + val * beta[idx], 0));

  // ===== Hitungan Statistik =====
  const meanY = dependent.reduce((acc, v) => acc + v, 0) / n;

  let ssTotal = 0,
    ssReg = 0,
    ssError = 0;

  for (let i = 0; i < n; i++) {
    ssTotal += Math.pow(dependent[i] - meanY, 2);
    ssReg += Math.pow(yPred[i] - meanY, 2);
    ssError += Math.pow(dependent[i] - yPred[i], 2);
  }

  const rSquare = ssReg / ssTotal;
  const r = Math.sqrt(rSquare); // Multiple R selalu positif
  const adjustedRSquare = 1 - ((n - 1) / (n - k - 1)) * (1 - rSquare);
  const stdErrorEstimate = Math.sqrt(ssError / (n - k - 1));

  // ===== Susun Output =====
  const result = {
    tables: [
      {
        title: "Model Summary",
        columnHeaders: [
          { header: "Model" },
          { header: "R", key: "r" },
          { header: "R Square", key: "rSquare" },
          { header: "Adjusted R Square", key: "adjustedRSquare" },
          { header: "Std. Error of the Estimate", key: "stdErrorEstimate" }
        ],
        rows: [
          {
            rowHeader: ["1"],
            r: round(r, 3),
            rSquare: round(rSquare, 3),
            adjustedRSquare: round(adjustedRSquare, 3),
            stdErrorEstimate: Number(stdErrorEstimate.toFixed(5))
          }
        ]
      }
    ]
  };

  self.postMessage(result);
};