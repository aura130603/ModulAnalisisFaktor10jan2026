// Worker for overall linearity (Ramsey RESET) test in multiple linear regression
importScripts("https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js");
self.onmessage = function (e) {
  try {
    const { dependentData, independentData } = e.data;

    if (!Array.isArray(dependentData) || dependentData.length === 0) {
      self.postMessage({ error: "Missing or empty dependent variable data" });
      return;
    }

    if (!independentData || independentData.length === 0) {
      self.postMessage({ error: "Missing independent variable data" });
      return;
    }

    // Ensure we always work with an array of arrays for independent variables
    let independentVars = independentData;
    if (!Array.isArray(independentData[0])) {
      independentVars = [independentData];
    }

    const n = dependentData.length;

    // Check length consistency
    for (let i = 0; i < independentVars.length; i++) {
      if (independentVars[i].length !== n) {
        self.postMessage({
          error: `Length mismatch: dependentData has ${n} observations but independent variable ${i + 1} has ${independentVars[i].length}`,
        });
        return;
      }
    }

    // X matrix with rows = observations, cols = variables
    const X = transpose(independentVars);
    
    // Validate data before regression
    if (X.length < X[0].length + 1) {
      self.postMessage({
        error: "Cannot perform linearity test: Insufficient observations. Need at least " + 
               (X[0].length + 2) + " observations for " + X[0].length + " independent variables."
      });
      return;
    }
    
    // Check for constant variables
    for (let j = 0; j < X[0].length; j++) {
      const column = X.map(row => row[j]);
      const min = Math.min(...column);
      const max = Math.max(...column);
      if (Math.abs(max - min) < 1e-10) {
        self.postMessage({
          error: "Cannot perform linearity test: Variable " + (j + 1) + " appears to be constant or nearly constant."
        });
        return;
      }
    }
    
    const restricted = multipleLinearRegression(dependentData, X);
    const restrictedSSE = restricted.sse;
    const yHat = restricted.yHat;

    // Define maxPower for Ramsey RESET test (typically 2 or 3)
    const maxPower = 3;

    const augmentedX = X.map((row, i) => {
      const extras = [];
      for (let pw = 2; pw <= maxPower; pw++) {
        extras.push(Math.pow(yHat[i], pw));
      }
      return [...row, ...extras];
    });

    const unrestricted = multipleLinearRegression(dependentData, augmentedX);
    const unrestrictedSSE = unrestricted.sse;


    const q = maxPower - 1; // number of added terms
    const p = independentVars.length; // original regressors
    const k = p + 1 + q; // intercept + originals + added terms

    const fStatistic = ((restrictedSSE - unrestrictedSSE) / q) / (unrestrictedSSE / (n - k));
    let pValue;
    if (typeof jStat !== 'undefined' && jStat.centralF && typeof jStat.centralF.cdf === 'function') {
      pValue = 1 - jStat.centralF.cdf(fStatistic, q, n - k);
    } else if (typeof jStat !== 'undefined' && jStat.ftest && typeof jStat.ftest === 'function') {
      // Older jStat versions expose ftest
      pValue = 1 - jStat.ftest(fStatistic, q, n - k);
    } else {
      throw new Error("jStat library not available for exact F CDF calculation.");
    }


    const isLinear = pValue > 0.05;

    const summary = {
      title: "Linearity Test Results",
      description: "Ramsey RESET test for overall model linearity (powers 2..3 of fitted values added); H0: model is linear.",
      fStatistic: parseFloat(fStatistic.toFixed(6)),
      pValue: parseFloat(pValue.toFixed(6)),
      isLinear,
      interpretation: isLinear
        ? "The relationship between dependent and independent variables appears to be linear (p-value > 0.05)."
        : "The relationship between dependent and independent variables appears to be non-linear (p-value ≤ 0.05).",
    };

    self.postMessage(summary);
  } catch (error) {
    self.postMessage({
      error: "Error in linearity test: " + (error.message || "Unknown error"),
      stack: error.stack,
    });
  }
};


// Multiple linear regression using ordinary least squares (simple implementation)
function multipleLinearRegression(y, X) {
  const n = y.length;
  const p = X[0].length;

  // Add column of 1s for intercept
  const XWithIntercept = X.map((row) => [1, ...row]);

  // Matrix operations for OLS (X'X)^(-1)X'y
  const XTranspose = transpose(XWithIntercept);
  const XTX = matrixMultiply(XTranspose, XWithIntercept);
  
  let XTXInv;
  try {
    XTXInv = matrixInverse(XTX);
  } catch (error) {
    if (error.message.includes("singular")) {
      throw new Error("Cannot perform linearity test: The data matrix is singular or nearly singular. This may be due to:\n" +
        "1. Perfect multicollinearity between variables\n" +
        "2. Insufficient data variation\n" +
        "3. More variables than observations\n" +
        "4. Constant or nearly constant variables\n" +
        "Please check your data and variable selection.");
    }
    throw error;
  }
  
  const XTY = matrixMultiplyVector(XTranspose, y);
  const beta = matrixMultiplyVector(XTXInv, XTY);

  // Fitted values
  const yHat = XWithIntercept.map((row) => row.reduce((sum, val, idx) => sum + val * beta[idx], 0));

  // Residuals
  const residuals = y.map((val, i) => val - yHat[i]);

  // Sum of squared errors
  const sse = residuals.reduce((sum, val) => sum + val * val, 0);

  // Total sum of squares
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;
  const sst = y.map((val) => val - yMean).reduce((sum, val) => sum + val * val, 0);

  // R² and adjusted R² (may not be used but returned for completeness)
  const r2 = 1 - sse / sst;
  const adjR2 = 1 - ((1 - r2) * (n - 1)) / (n - p - 1);

  return { beta, yHat, residuals, sse, r2, adjR2 };
}

// Transpose a matrix given as array of arrays
function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}

// Matrix multiplication A (m×k) * B (k×n) => (m×n)
function matrixMultiply(A, B) {
  const result = Array(A.length)
    .fill()
    .map(() => Array(B[0].length).fill(0));
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B[0].length; j++) {
      for (let k = 0; k < A[0].length; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

// Matrix-vector multiplication (A is m×n, v is n×1)
function matrixMultiplyVector(A, v) {
  const result = Array(A.length).fill(0);
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < v.length; j++) {
      result[i] += A[i][j] * v[j];
    }
  }
  return result;
}

// General matrix inverse using Gauss-Jordan elimination (works for any n ≥ 1)
function matrixInverse(A) {
  const n = A.length;
  if (n === 0) throw new Error("Empty matrix");

  // Create copies of A and an identity matrix I
  const M = A.map((row) => row.slice());
  const I = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  for (let i = 0; i < n; i++) {
    // Find pivot row (largest absolute value in column i below/current i)
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }

    // Matrix is singular if pivot is 0
    if (Math.abs(M[maxRow][i]) < 1e-12) {
      throw new Error("Matrix is singular or nearly singular");
    }

    // Swap rows in M and I if needed
    if (maxRow !== i) {
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
      [I[i], I[maxRow]] = [I[maxRow], I[i]];
    }

    // Normalize pivot row
    const pivot = M[i][i];
    for (let j = 0; j < n; j++) {
      M[i][j] /= pivot;
      I[i][j] /= pivot;
    }

    // Eliminate other rows
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = M[k][i];
      for (let j = 0; j < n; j++) {
        M[k][j] -= factor * M[i][j];
        I[k][j] -= factor * I[i][j];
      }
    }
  }

  return I;
}

function pf(x, df1, df2) {
  if (x <= 0) return 0;
  const v1 = df1;
  const v2 = df2;
  const betaVal = (v1 * x) / (v1 * x + v2);
  return incompleteBeta(betaVal, v1 / 2, v2 / 2);
}

function incompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Use continued fraction for better accuracy (Abramowitz & Stegun 26.5.8)
  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta);
  let cf;
  if (x < (a + 1) / (a + b + 2)) {
    cf = betacf(a, b, x);
    return front * cf / a;
  } else {
    cf = betacf(b, a, 1 - x);
    return 1 - (front * cf / b);
  }
}

function betacf(a, b, x) {
  const MAX_ITER = 200;
  const EPS = 1e-12;
  let am = 1;
  let bm = 1;
  let az = 1;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let bz = 1 - (qab * x) / qap;
  if (Math.abs(bz) < EPS) bz = EPS;
  bz = 1 / bz;
  az *= bz;
  for (let m = 1; m <= MAX_ITER; m++) {
    const m2 = 2 * m;
    // Even step
    let d = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    let ap = az + d * am;
    let bp = 1 + d * bm;
    if (Math.abs(bp) < EPS) bp = EPS;
    bp = 1 / bp;
    az = ap * bp;
    bm = bp;

    // Odd step
    d = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    ap = az + d * am;
    bp = 1 + d * bm;
    if (Math.abs(bp) < EPS) bp = EPS;
    bp = 1 / bp;
    az = ap * bp;
    bm = bp;

    am = az;
    if (Math.abs(d) < EPS && Math.abs(ap - az) < EPS) break;
  }
  return az;
}

function logGamma(z) {
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  let x = p[0];
  for (let i = 1; i < p.length; i++) {
    x += p[i] / (z + i);
  }
  const t = z + p.length - 1.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function beta(a, b) {
  return (gamma(a) * gamma(b)) / gamma(a + b);
}

// Lanczos approximation for the Gamma function
function gamma(z) {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  let x = p[0];
  for (let i = 1; i < p.length; i++) {
    x += p[i] / (z + i);
  }
  const t = z + p.length - 1.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
