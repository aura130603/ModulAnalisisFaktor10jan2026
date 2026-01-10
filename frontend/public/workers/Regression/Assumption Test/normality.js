// Worker for normality test in linear regression
self.onmessage = function(e) {
  try {
    const { dependentData, independentData, independentVariableInfos } = e.data;
    
    console.log("Normality test worker received data:", {
      hasDependent: !!dependentData,
      hasIndependent: !!independentData,
      hasVariableInfo: !!independentVariableInfos,
      dependentLength: dependentData?.length || 0,
      independentLength: independentData?.length || 0,
      infoLength: independentVariableInfos?.length || 0
    });
    
    // Make sure we have data to analyze
    if (!dependentData || !independentData) {
      self.postMessage({ error: "Missing data: dependent or independent variable data not provided" });
      return;
    }
    
    if (dependentData.length === 0 || independentData.length === 0) {
      self.postMessage({ error: "Empty data arrays provided for normality test" });
      return;
    }
    
    // Prepare independent data as a matrix of observations × variables
    const X = prepareIndependentData(independentData);
    
    // Run the regression
    const regression = multipleLinearRegression(dependentData, X);
    const { residuals } = regression;
    
    // Perform normality tests (Shapiro-Wilk removed)
    const kolmogorovSmirnov = calculateKolmogorovSmirnov(residuals);
    const jarqueBera = calculateJarqueBera(residuals);
    
    // Calculate mean and standard deviation of residuals
    const residualsMean = mean(residuals);
    const residualsStdDev = standardDeviation(residuals, residualsMean);
    
    // Generate histogram data
    const histogramData = generateHistogramData(residuals, 10);
    
    // Generate QQ plot data
    const qqPlotData = generateQQPlotData(residuals);
    
    // Determine overall normality based on tests (using KS only)
    const isNormal = kolmogorovSmirnov.isNormal;
    
    // Create more focused interpretation that focuses on the assumption status and recommendations
    let detailedInterpretation = isNormal
      ? "The tests indicate that the residuals follow a normal distribution, which is a key assumption for linear regression."
      : "Some tests suggest the residuals may not follow a normal distribution. This could affect the validity of statistical inferences from the model.";
      
    // Format results for the data-table component
    const tableData = {
      tables: [
        {
          title: "Normality Test Results",
          columnHeaders: [
            { header: "Test" },
            { header: "Statistic" },
            { header: "P-Value" },
            { header: "Status" }
          ],
                      rows: [
            {
              rowHeader: ["Kolmogorov-Smirnov"],
              "Statistic": kolmogorovSmirnov.statistic.toFixed(4),
              "P-Value": kolmogorovSmirnov.pValue.toFixed(4),
              "Status": kolmogorovSmirnov.isNormal ? "Normal" : "Not normally distributed"
            },
            {
              rowHeader: ["Jarque-Bera"],
              "Statistic": jarqueBera.statistic.toFixed(4),
              "P-Value": jarqueBera.pValue.toFixed(4),
              "Status": jarqueBera.isNormal ? "Normal" : "Not normally distributed"
            }
          ]
        },
        {
          title: "Residual Statistics",
          columnHeaders: [
            { header: "Metric" },
            { header: "Value" }
          ],
          rows: [
            {
              rowHeader: ["Sample Size"],
              "Value": residuals.length.toString()
            },
            {
              rowHeader: ["Mean"],
              "Value": residualsMean.toFixed(4)
            },
            {
              rowHeader: ["Standard Deviation"],
              "Value": residualsStdDev.toFixed(4)
            },
            {
              rowHeader: ["Skewness"],
              "Value": jarqueBera.skewness.toFixed(4)
            },
            {
              rowHeader: ["Kurtosis"],
              "Value": jarqueBera.kurtosis.toFixed(4)
            },
            {
              rowHeader: ["Minimum"],
              "Value": Math.min(...residuals).toFixed(4)
            },
            {
              rowHeader: ["Maximum"],
              "Value": Math.max(...residuals).toFixed(4)
            }
          ]
        }
      ]
    };
    
    // Prepare final results
    const result = {
      title: "Normality Test Results",
      description: "Tests if the residuals from the regression model are normally distributed",
      isNormal: isNormal,
      interpretation: detailedInterpretation,
      output_data: JSON.stringify(tableData),
      tests: {
        kolmogorovSmirnov,
        jarqueBera
      },
      residualStats: {
        count: residuals.length,
        mean: residualsMean,
        stdDev: residualsStdDev,
        min: Math.min(...residuals),
        max: Math.max(...residuals)
      },
      visualizations: {
        histogram: histogramData,
        qqPlot: qqPlotData
      }
    };
    
    self.postMessage(result);
  } catch (error) {
    self.postMessage({
      error: "Error in normality test: " + (error.message || "Unknown error"),
      stack: error.stack
    });
  }
};

// Function to prepare independent data matrix
function prepareIndependentData(independentData) {
  // Check if data is already in the right format
  if (Array.isArray(independentData) && independentData.length > 0) {
    if (!Array.isArray(independentData[0])) {
      // Single variable case
      return independentData.map(value => [value]);
    } else {
      if (independentData.length === 1 && independentData[0].length > 1) {
        return independentData[0].map(val => [val]);
      }
      
      // If independentData is an array of arrays where each inner array represents one variable
      if (independentData.length > 1 && independentData[0].length > 1) {
        // Transpose the data to get observations as rows
        return independentData[0].map((_, colIndex) => 
          independentData.map(row => row[colIndex])
        );
      }
    }
  }
  
  return independentData;
}

// Multiple linear regression function
function multipleLinearRegression(y, X) {
  const n = y.length;
  let p;
  
  // Ensure X is properly formatted
  let xMatrix;
  if (Array.isArray(X[0])) {
    // X is already a matrix
    xMatrix = X;
    p = X[0].length;
  } else {
    // X is a vector, convert to matrix
    xMatrix = X.map(val => [val]);
    p = 1;
  }
  
  // Add column of 1s for intercept
  const XWithIntercept = xMatrix.map(row => [1, ...(Array.isArray(row) ? row : [row])]);
  
  // Matrix operations for OLS (X'X)^(-1)X'y
  const XTranspose = transpose(XWithIntercept);
  const XTX = matrixMultiply(XTranspose, XWithIntercept);
  const XTXInv = matrixInverse(XTX);
  const XTY = matrixMultiplyVector(XTranspose, y);
  const beta = matrixMultiplyVector(XTXInv, XTY);
  
  // Calculate fitted values
  const yHat = XWithIntercept.map(row => 
    row.reduce((sum, val, idx) => sum + val * beta[idx], 0)
  );
  
  // Calculate residuals
  const residuals = y.map((val, i) => val - yHat[i]);
  
  // Calculate SSE
  const sse = residuals.reduce((sum, val) => sum + val * val, 0);
  
  // Calculate SST and R^2
  const yMean = mean(y);
  const sst = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const r2 = 1 - (sse / sst);
  
  // Calculate adjusted R^2
  const adjR2 = 1 - ((1 - r2) * (n - 1) / (n - p - 1));
  
  return { beta, yHat, residuals, sse, r2, adjR2 };
}

// Matrix transpose
function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

// Matrix multiplication
function matrixMultiply(A, B) {
  const result = Array(A.length).fill().map(() => Array(B[0].length).fill(0));
  
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B[0].length; j++) {
      for (let k = 0; k < A[0].length; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  
  return result;
}

// Matrix-vector multiplication
function matrixMultiplyVector(A, v) {
  const result = Array(A.length).fill(0);
  
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < v.length; j++) {
      result[i] += A[i][j] * v[j];
    }
  }
  
  return result;
}

function matrixInverse(A) {
  const n = A.length;
  
  if (n === 1) {
    return [[1 / A[0][0]]];
  }
  
  if (n === 2) {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    return [
      [A[1][1] / det, -A[0][1] / det],
      [-A[1][0] / det, A[0][0] / det]
    ];
  }
  
  if (n === 3) {
    // For 3x3, use adjugate matrix method
    const det = 
      A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
    
    const adjugate = [
      [
        (A[1][1] * A[2][2] - A[1][2] * A[2][1]),
        -(A[0][1] * A[2][2] - A[0][2] * A[2][1]),
        (A[0][1] * A[1][2] - A[0][2] * A[1][1])
      ],
      [
        -(A[1][0] * A[2][2] - A[1][2] * A[2][0]),
        (A[0][0] * A[2][2] - A[0][2] * A[2][0]),
        -(A[0][0] * A[1][2] - A[0][2] * A[1][0])
      ],
      [
        (A[1][0] * A[2][1] - A[1][1] * A[2][0]),
        -(A[0][0] * A[2][1] - A[0][1] * A[2][0]),
        (A[0][0] * A[1][1] - A[0][1] * A[1][0])
      ]
    ];
    
    return adjugate.map(row => row.map(val => val / det));
  }
  
  // For larger matrices, use a numerical method like Gaussian elimination
  return gaussianElimination(A);
}

// Gaussian elimination for matrix inversion
function gaussianElimination(A) {
  const n = A.length;
  const result = Array(n).fill().map((_, i) => {
    const row = Array(n).fill(0);
    row[i] = 1;
    return row;
  });
  
  // Create a copy of A to avoid modifying the original
  const augmented = A.map((row, i) => [...row, ...result[i]]);
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let max = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > Math.abs(augmented[max][i])) {
        max = j;
      }
    }
    
    // Swap rows
    [augmented[i], augmented[max]] = [augmented[max], augmented[i]];
    
    // Singular matrix check
    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error("Matrix is singular and cannot be inverted");
    }
    
    // Divide row by pivot
    const pivot = augmented[i][i];
    for (let j = i; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate other rows
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const factor = augmented[j][i];
        for (let k = i; k < 2 * n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }
  }
  
  // Extract the inverse
  return augmented.map(row => row.slice(n));
}

// Calculate mean of an array
function mean(data) {
  return data.reduce((sum, value) => sum + value, 0) / data.length;
}

// Calculate standard deviation of an array
function standardDeviation(data, dataMean = undefined) {
  const m = dataMean !== undefined ? dataMean : mean(data);
  // Use sample standard deviation (divide by n-1) when sample size > 1
  const divisor = data.length > 1 ? data.length - 1 : data.length;
  const variance = data.reduce((sum, value) => sum + Math.pow(value - m, 2), 0) / divisor;
  return Math.sqrt(variance);
}

// -----------------------------------------------------------------------------
// Shapiro-Wilk normality test (Royston algorithm, approximates SciPy/R output)
// -----------------------------------------------------------------------------
function calculateShapiroWilk(data) {
  const n = data.length;
  if (n < 3 || n > 5000) {
    throw new Error("Shapiro-Wilk test is defined for sample sizes 3 … 5000");
  }

  // Sort data
  const x = [...data].sort((a, b) => a - b);

  // --- helper: inverse CDF of standard normal (we already have normalQuantile) ---
  const m = new Array(n).fill(0).map((_, i) => normalQuantile((i + 1 - 0.375) / (n + 0.25)));
  const mSumSq = m.reduce((s, v) => s + v * v, 0);

    // pre-compute ‘c’ vector (normalized expected order stats)
  const normFactor = Math.sqrt(mSumSq);
  const cVec = m.map(v => v / normFactor);

  // initialise weights “a”
  const a = new Array(n).fill(0);
  const u = 1 / Math.sqrt(n);

  if (n === 3) {
    a[0] = Math.SQRT1_2; // √0.5
    a[2] = -a[0];
  } else {
    // Polynomial coefficients from Royston (1995)
    const p1 = [-2.706056, 4.434685, -2.071190, -0.147981, 0.221157];
    const p2 = [-3.582633, 5.682633, -1.752461, -0.293762, 0.042981];

    const polyVal = (coeffs, z) => coeffs.reduce((acc, c) => acc * z + c, 0);

    // Extreme weights (a_n & a_1)
    const a_n = polyVal(p1, u);
    a[n - 1] = a_n;
    a[0] = -a_n;

    if (n >= 6) {
      const a_n1 = polyVal(p2, u);
      a[n - 2] = a_n1;
      a[1] = -a_n1;
    }

    // compute phi per Royston (menggunakan m mentah)
    let phi;
    if (n >= 6) {
      phi = (mSumSq - 2 * m[n - 1] ** 2 - 2 * m[n - 2] ** 2) /
            (1 - 2 * a[n - 1] ** 2 - 2 * a[n - 2] ** 2);
    } else {
      phi = (mSumSq - 2 * m[n - 1] ** 2) /
            (1 - 2 * a[n - 1] ** 2);
    }

    const constDen = Math.sqrt(phi);

    if (n >= 6) {
      for (let i = 2; i <= n - 3; i++) {
        a[i] = m[i] / constDen;
      }
    } else if (n === 5) {
      a[2] = m[2] / constDen; // middle element
      a[3] = -a[2];
    } else if (n === 4) {
      a[1] = m[1] / constDen;
      a[2] = -a[1];
    }
  }

  // --- compute W statistic (as correlation squared) ---
  const W = Math.pow(pearsonCorrelation(x, m), 2);

  // --- p-value approximation (Royston 1993) ---
  const pValue = shapiroWilkPValue(W, n);

  return {
    testName: "Shapiro-Wilk",
    statistic: W,
    pValue,
    isNormal: pValue > 0.05,
    criticalValue: 0.05,
  };
}

// Approximate p-value for Shapiro-Wilk using Royston’s fitted polynomials
function shapiroWilkPValue(W, n) {
  const y = Math.log(1 - W);
  let mu, sigma;
  if (n === 3) {
    return 1 - Math.exp(-6.0 / Math.PI * Math.asin(Math.sqrt(W))); // exact small-n formula
  }

  if (n <= 11) {
    const g = -0.0006714 * n ** 3 + 0.025054 * n ** 2 - 0.39978 * n + 0.5440; // gamma from Royston
    if (y > g) return 1e-19;
    const y2 = -Math.log(g - y);
    mu = -0.0020322 * n ** 3 + 0.062767 * n ** 2 - 0.77857 * n + 1.3822;
    sigma = Math.exp(-0.00020322 * n ** 3 + 0.0062767 * n ** 2 - 0.067861 * n + 0.459);
    return 1 - normalCDF((y2 - mu) / sigma);
  } else {
    const lnN = Math.log(n);
    mu = -1.5861 - 0.31082 * lnN - 0.083751 * lnN ** 2 + 0.0038915 * lnN ** 3;
    sigma = Math.exp(-0.4803 - 0.082676 * lnN + 0.0030302 * lnN ** 2);
    return 1 - normalCDF((y - mu) / sigma);
  }
}

// -------- helper: sample kurtosis (needed for future extensions) --------
function sampleKurtosis(arr) {
  const n = arr.length;
  const m = mean(arr);
  const sd = standardDeviation(arr, m);
  const s4 = arr.reduce((s, v) => s + Math.pow((v - m) / sd, 4), 0) / n;
  return s4 - 3;
}

// ----------------------
// Standard normal quantile (inverse CDF) approximation (A&S formula)
// ----------------------
function normalQuantile(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  if (p < 0.5) return -approxNormalQuantile(1 - p);

  const y = Math.sqrt(-2 * Math.log(1 - p));
  return y - (2.515517 + 0.802853 * y + 0.010328 * y * y) /
         (1 + 1.432788 * y + 0.189269 * y * y + 0.001308 * y * y * y);
}

function approxNormalQuantile(p) {
  const y = Math.sqrt(-2 * Math.log(p));
  return y - (2.515517 + 0.802853 * y + 0.010328 * y * y) /
         (1 + 1.432788 * y + 0.189269 * y * y + 0.001308 * y * y * y);
}

// Pearson correlation coefficient
function pearsonCorrelation(x, y) {
  const n = x.length;
  const xMean = mean(x);
  const yMean = mean(y);
  
  let numerator = 0;
  let xDenom = 0;
  let yDenom = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    
    numerator += xDiff * yDiff;
    xDenom += xDiff * xDiff;
    yDenom += yDiff * yDiff;
  }
  
  return numerator / Math.sqrt(xDenom * yDenom);
}

// Simple approximation of Shapiro-Wilk p-value
function approximateShapiroWilkPValue(w, n) {
  // This is a very simplified approximation
  // In practice, calculating the exact p-value is more complex
  const z = (1 - w) * Math.sqrt(n);
  return 1 - normalCDF(z);
}

// Normal cumulative distribution function
function normalCDF(x) {
  if (x < -10) return 0;
  if (x > 10) return 1;
  
  // Approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  if (x > 0) {
    p = 1 - p;
  }
  
  return p;
}

// Calculate Kolmogorov-Smirnov test for normality
function calculateKolmogorovSmirnov(data) {
  const n = data.length;
  
  // Sort the data
  const sortedData = [...data].sort((a, b) => a - b);
  
  // Calculate mean and standard deviation
  const dataMean = mean(sortedData);
  const dataStdDev = standardDeviation(sortedData, dataMean);
  
  // Calculate empirical CDF and theoretical normal CDF
  let maxDifference = 0;
  
  for (let i = 0; i < n; i++) {
    const value = sortedData[i];
    const empiricalCDF = (i + 1) / n;
    const theoreticalCDF = normalCDF((value - dataMean) / dataStdDev);
    
    // Find maximum difference
    const difference = Math.abs(empiricalCDF - theoreticalCDF);
    if (difference > maxDifference) {
      maxDifference = difference;
    }
  }
  
  // Calculate p-value (simplified approximation)
  // Lilliefors correction for normality test
  const pValue = approximateKSPValue(maxDifference, n);
  
  return {
    testName: "Kolmogorov-Smirnov",
    statistic: maxDifference,
    pValue: pValue,
    isNormal: pValue > 0.05,
    criticalValue: 0.05
  };
}

// More accurate (two–sided) Kolmogorov–Smirnov p-value approximation
function approximateKSPValue(d, n) {
  if (n <= 0) return 1;
  const sqrtN = Math.sqrt(n);
  const lambda = (sqrtN + 0.12 + 0.11 / sqrtN) * d;
  // Use the asymptotic Kolmogorov distribution
  // P(D_n <= d) = 1 - 2 * Σ (-1)^{k-1} exp(-2 k^2 λ^2)
  let sum = 0;
  for (let k = 1; k < 100; k++) {
    const term = Math.exp(-2 * k * k * lambda * lambda);
    sum += (k % 2 === 1 ? 1 : -1) * term;
    if (term < 1e-10) break;
  }
  const cdf = 1 - 2 * sum;
  const p = 1 - cdf;
  return Math.max(Math.min(p, 1), 0);
}

// Calculate Jarque-Bera test for normality
// Uses biased (population) estimators **internally** for JB statistic
// but returns bias-corrected (Fisher) skewness & excess kurtosis
function calculateJarqueBera(data) {
  const n = data.length;
  if (n < 4) {
    // Need at least 4 points for unbiased kurtosis
    throw new Error("Jarque-Bera test requires at least 4 observations");
  }

  const meanVal = mean(data);

  // ----- 1. Bias-corrected skewness & excess kurtosis (displayed) -----
  const sdSample = standardDeviation(data, meanVal); // divide by (n-1)

  let m3 = 0, m4 = 0; // sample moments
  for (let i = 0; i < n; i++) {
    const z = (data[i] - meanVal) / sdSample;
    m3 += Math.pow(z, 3);
    m4 += Math.pow(z, 4);
  }
  const skewSample = (n / ((n - 1) * (n - 2))) * m3;
  const kurtExcessSample = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * m4 -
                           (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));

  // ----- 2. Biased (population) estimators for Jarque–Bera statistic -----
  const sdPop = Math.sqrt(data.reduce((sum, v) => sum + Math.pow(v - meanVal, 2), 0) / n);

  let sumCubedPop = 0, sumFourthPop = 0;
  for (let i = 0; i < n; i++) {
    const zPop = (data[i] - meanVal) / sdPop;
    sumCubedPop += Math.pow(zPop, 3);
    sumFourthPop += Math.pow(zPop, 4);
  }
  const skewPop = sumCubedPop / n;
  const kurtPop = sumFourthPop / n;

  const jbStatistic = n / 6 * (Math.pow(skewPop, 2) + Math.pow(kurtPop - 3, 2) / 4);
  const pValue = 1 - chiSquareCDF(jbStatistic, 2);

  return {
    testName: "Jarque-Bera",
    statistic: jbStatistic,
    skewness: skewSample,
    kurtosis: kurtExcessSample,
    pValue: pValue,
    isNormal: pValue > 0.05,
    criticalValue: 0.05
  };
}

// Chi-squared cumulative distribution function
function chiSquareCDF(x, df) {
  if (x <= 0) return 0;
  
  // Approximation for chi-squared CDF
  // This is simplified - more accurate implementations exist
  const p = Math.exp(-0.5 * x) * Math.pow(x, df / 2 - 1) / (Math.pow(2, df / 2) * gamma(df / 2));
  return 1 - p;
}

// Simple gamma function approximation for integer and half-integer values
function gamma(z) {
  // For integer values
  if (Math.floor(z) === z) {
    if (z <= 0) return Infinity;
    let result = 1;
    for (let i = 2; i < z; i++) {
      result *= i;
    }
    return result;
  }
  
  // For half-integer values
  if (Math.floor(2 * z) === 2 * z) {
    const n = Math.floor(z);
    if (z === 0.5) return Math.sqrt(Math.PI);
    return Math.sqrt(Math.PI) * factorialProduct(1, n - 0.5) / Math.pow(2, n - 0.5);
  }
  
  // For other values (more complex approximation would be needed)
  return Math.sqrt(2 * Math.PI / z) * Math.pow(z / Math.E, z);
}

// Helper for factorial product
function factorialProduct(start, end) {
  let product = 1;
  for (let i = start; i <= end; i += 0.5) {
    product *= i;
  }
  return product;
}

// Generate histogram data from residuals
function generateHistogramData(data, bins = 10) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const binWidth = range / bins;
  
  // Initialize bins
  const histogram = Array(bins).fill(0);
  const binLabels = Array(bins).fill(0).map((_, i) => min + i * binWidth);
  
  // Count values in each bin
  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[binIndex]++;
  }
  
  // Calculate density for normal curve
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const stdDev = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
  
  const normalCurve = binLabels.map(x => ({
    x: x + binWidth / 2, // Center of bin
    y: (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2))
  }));
  
  // Normalize histogram to have same area as normal curve
  const histTotal = histogram.reduce((sum, val) => sum + val, 0) * binWidth;
  const normalizedHistogram = histogram.map(count => count / histTotal);
  
  return {
    bins: binLabels.map((binStart, i) => ({
      x: binStart + binWidth / 2, // Center of bin
      y: normalizedHistogram[i],
      count: histogram[i],
      start: binStart,
      end: binStart + binWidth
    })),
    normalCurve,
    binWidth,
    mean,
    stdDev
  };
}

// Generate QQ plot data from residuals
function generateQQPlotData(data) {
  const n = data.length;
  
  // Sort the data
  const sortedData = [...data].sort((a, b) => a - b);
  
  // Calculate theoretical quantiles
  const qqPoints = sortedData.map((value, i) => {
    const p = (i + 0.5) / n; // Midpoint plotting position
    const z = normalQuantile(p);
    return { observed: value, theoretical: z };
  });
  
  return qqPoints;
} 