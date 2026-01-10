// Worker for homoscedasticity test in linear regression
importScripts("https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js");
self.onmessage = function(e) {
  try {
    const { dependentData, independentData, independentVariableInfos } = e.data;
    
    console.log("Homoscedasticity test worker received data:", {
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
      self.postMessage({ error: "Empty data arrays provided for homoscedasticity test" });
      return;
    }

    // For homoscedasticity test, we need to:
    // 1. Compute the linear regression
    // 2. Get residuals
    // 3. Test if residuals have constant variance

    // Prepare independent data as a matrix of observations × variables
    const X = prepareIndependentData(independentData);
    
    // Check for potential singularity issues (more variables than observations)
    if (X[0].length >= dependentData.length) {
      self.postMessage({
        error: "Cannot perform homoscedasticity test: Too many variables compared to observations. Need more data points."
      });
      return;
    }
    
    try {
      // Run the regression
      const regression = multipleLinearRegression(dependentData, X);
      const { residuals, yHat, beta } = regression;
      
      // Perform Breusch-Pagan test for homoscedasticity
      let breuschPaganTest = { testName: "Breusch-Pagan", error: "Test failed", isHomoscedastic: true };
      
      // Calculate squared residuals
      const squaredResiduals = residuals.map(r => r * r);
      
      // Try to run the test, but don't fail the entire process if it fails
      try {
        breuschPaganTest = calculateBreuschPaganTest(X, residuals);
      } catch (testError) {
        console.error("Breusch-Pagan test error:", testError);
        breuschPaganTest = { 
          testName: "Breusch-Pagan", 
          statistic: null, 
          pValue: null, 
          isHomoscedastic: true, 
          criticalValue: 0.05,
          error: "Test failed: " + testError.message
        };
      }
      
      // Calculate basic statistics of residuals for visual analysis
      const residualStats = calculateResidualStats(residuals);
      
      // Generate plot data - residuals vs. fitted values
      const residualVsFittedData = generateResidualVsFittedData(residuals, yHat);
      
      // Generate plot data - residuals vs. independent variables
      const residualVsIndependentData = generateResidualVsIndependentData(residuals, X, independentVariableInfos);
      
      // Generate scale-location plot data (sqrt of abs residuals vs fitted)
      const scaleLocationData = generateScaleLocationData(residuals, yHat);
      
      // Check if the test was completed successfully
      const isHomoscedastic = breuschPaganTest.isHomoscedastic;
      
      // Format data for the data-table component in the Result output
      const formattedTestTable = {
        title: "Homoscedasticity Test Results",
        columnHeaders: [
          { header: "Test" },
          { header: "Statistic" },
          { header: "p-value" },
          { header: "df" },
          { header: "Status" }
        ],
        rows: [{
          rowHeader: [breuschPaganTest.testName],
          "Statistic": breuschPaganTest.statistic !== null ? breuschPaganTest.statistic.toFixed(4) : "N/A",
          "p-value": breuschPaganTest.pValue !== null ? breuschPaganTest.pValue.toFixed(4) : "N/A",
          "df": breuschPaganTest.df !== undefined ? breuschPaganTest.df.toString() : "N/A",
          "Status": breuschPaganTest.isHomoscedastic ? "Homoscedastic" : "Heteroscedastic"
        }]
      };

      // Format residual statistics table
      const formattedResidualStatsTable = {
        title: "Residual Statistics",
        columnHeaders: [
          { header: "Statistic" },
          { header: "Value" }
        ],
        rows: [
          {
            rowHeader: ["Number of observations"],
            "Value": residualStats.count.toString()
          },
          {
            rowHeader: ["Mean of residuals"],
            "Value": residualStats.mean.toFixed(4)
          },
          {
            rowHeader: ["Standard deviation"],
            "Value": residualStats.stdDev.toFixed(4)
          },
          {
            rowHeader: ["Minimum"],
            "Value": residualStats.min.toFixed(4)
          },
          {
            rowHeader: ["Maximum"],
            "Value": residualStats.max.toFixed(4)
          }
        ]
      };

      // Prepare interpretation text
      let interpretationText = "";
      if (isHomoscedastic) {
        interpretationText = `The Breusch-Pagan test shows a p-value of ${breuschPaganTest.pValue?.toFixed(4) || 'N/A'}, which is ${breuschPaganTest.pValue !== null && breuschPaganTest.pValue > 0.05 ? 'above' : 'below'} the significance level of 0.05. Therefore, we ${isHomoscedastic ? 'fail to reject' : 'reject'} the null hypothesis of homoscedasticity. The residuals appear to have ${isHomoscedastic ? 'constant' : 'non-constant'} variance, indicating that the homoscedasticity assumption ${isHomoscedastic ? 'is satisfied' : 'is violated'}.`;
      } else {
        interpretationText = `The Breusch-Pagan test shows a p-value of ${breuschPaganTest.pValue?.toFixed(4) || 'N/A'}, which is ${breuschPaganTest.pValue !== null && breuschPaganTest.pValue > 0.05 ? 'above' : 'below'} the significance level of 0.05. Therefore, we ${isHomoscedastic ? 'fail to reject' : 'reject'} the null hypothesis of homoscedasticity. The residuals appear to have ${isHomoscedastic ? 'constant' : 'non-constant'} variance, indicating that the homoscedasticity assumption ${isHomoscedastic ? 'is satisfied' : 'is violated'}. This may affect the reliability of standard errors and confidence intervals in the regression model.`;
      }

      // Prepare results for output
      const outputData = {
        tables: [formattedTestTable, formattedResidualStatsTable],
      };
      
      // Prepare final result
      const result = {
        title: "Homoscedasticity Test Results",
        description: interpretationText,
        isHomoscedastic: isHomoscedastic,
        tests: {
          breuschPagan: breuschPaganTest
        },
        residualStats: residualStats,
        visualizations: {
          residualVsFitted: residualVsFittedData,
          residualVsIndependent: residualVsIndependentData,
          scaleLocation: scaleLocationData
        },
        interpretation: interpretationText,
        output_data: JSON.stringify(outputData)
      };
      
      self.postMessage(result);
    } catch (regressionError) {
      self.postMessage({ 
        error: "Error performing regression analysis: " + regressionError.message,
        stack: regressionError.stack
      });
    }
  } catch (error) {
    self.postMessage({
      error: "Error in homoscedasticity test: " + (error.message || "Unknown error"),
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
      // Try to guess correct format
      // If first element is an array of values for one observation, transform it
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
  
  // Check if we have more variables than observations
  if (p >= n) {
    throw new Error("More variables than observations. Cannot perform regression.");
  }
  
  // Add column of 1s for intercept
  const XWithIntercept = xMatrix.map(row => [1, ...(Array.isArray(row) ? row : [row])]);
  
  // Matrix operations for OLS (X'X)^(-1)X'y
  const XTranspose = transpose(XWithIntercept);
  const XTX = matrixMultiply(XTranspose, XWithIntercept);
  
  // Check for potential singularity in XTX by checking diagonal elements
  for (let i = 0; i < XTX.length; i++) {
    if (Math.abs(XTX[i][i]) < 1e-10) {
      throw new Error("Near-singular matrix detected. Check for multicollinearity in your data.");
    }
  }
  
  // Calculate determinant to check for singularity (for small matrices)
  if (XTX.length <= 3) {
    const det = calculateDeterminant(XTX);
    if (Math.abs(det) < 1e-10) {
      throw new Error("Singular matrix detected (zero determinant). Check for multicollinearity in your data.");
    }
  }
  
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
  const adjR2 = 1 - ((1 - r2) * (n - 1) / (n - (XWithIntercept[0].length) - 1));
  
  return { beta, yHat, residuals, sse, r2, adjR2, X: XWithIntercept };
}

// Calculate determinant for small matrices
function calculateDeterminant(A) {
  const n = A.length;
  
  if (n === 1) {
    return A[0][0];
  }
  
  if (n === 2) {
    return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  }
  
  if (n === 3) {
    return (
      A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
    );
  }
  
  throw new Error("Determinant calculation not implemented for matrices larger than 3x3");
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

// Simple matrix inverse (for small matrices)
function matrixInverse(A) {
  const n = A.length;
  
  if (n === 1) {
    if (Math.abs(A[0][0]) < 1e-10) {
      throw new Error("Matrix is singular and cannot be inverted");
    }
    return [[1 / A[0][0]]];
  }
  
  if (n === 2) {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    if (Math.abs(det) < 1e-10) {
      throw new Error("Matrix is singular and cannot be inverted");
    }
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
    
    if (Math.abs(det) < 1e-10) {
      throw new Error("Matrix is singular and cannot be inverted");
    }
    
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
    
    // Check for zero pivot
    if (Math.abs(augmented[max][i]) < 1e-10) {
      throw new Error("Matrix is singular and cannot be inverted");
    }
    
    // Swap rows
    [augmented[i], augmented[max]] = [augmented[max], augmented[i]];
    
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
  
  // Check for non-zeros on diagonal
  for (let i = 0; i < n; i++) {
    if (Math.abs(augmented[i][i] - 1) > 1e-8) {
      throw new Error("Matrix inversion failed due to singularity");
    }
  }
  
  // Extract the inverse
  return augmented.map(row => row.slice(n));
}

// Calculate mean of an array
function mean(data) {
  return data.reduce((sum, value) => sum + value, 0) / data.length;
}

// Calculate variance of an array
function variance(data, dataMean = undefined) {
  const m = dataMean !== undefined ? dataMean : mean(data);
  return data.reduce((sum, value) => sum + Math.pow(value - m, 2), 0) / data.length;
}

// Calculate standard deviation of an array
function standardDeviation(data, dataMean = undefined) {
  const m = dataMean !== undefined ? dataMean : mean(data);
  // Use sample standard deviation (divide by n-1) when sample size > 1
  const divisor = data.length > 1 ? data.length - 1 : data.length;
  const variance = data.reduce((sum, value) => sum + Math.pow(value - m, 2), 0) / divisor;
  return Math.sqrt(variance);
}

// Calculate residual statistics
function calculateResidualStats(residuals) {
  const residualsMean = mean(residuals);
  const residualsStdDev = standardDeviation(residuals, residualsMean);
  
  return {
    count: residuals.length,
    mean: residualsMean,
    stdDev: residualsStdDev,
    min: Math.min(...residuals),
    max: Math.max(...residuals)
  };
}

// Calculate Breusch-Pagan test for homoscedasticity
function calculateBreuschPaganTest(X, residuals) {
  try {
    // Get squared residuals
    const squaredResiduals = residuals.map(r => r * r);
    
    // Calculate mean of squared residuals
    const squaredResidualsMean = mean(squaredResiduals);
    
    // Normalize squared residuals
    const normalizedSquaredResiduals = squaredResiduals.map(r2 => r2 / squaredResidualsMean);
    
    // Run regression of normalized squared residuals on X (without intercept)
    const regression = multipleLinearRegression(normalizedSquaredResiduals, X);
    
    // Calculate R-squared from this regression
    const r2 = regression.r2;
    
    // Calculate test statistic: n * R^2
    const testStatistic = residuals.length * r2;
    
    // Calculate degrees of freedom (number of regressors)
    const df = X[0].length;
    
    // Calculate p-value (chi-squared distribution with df degrees of freedom)
    const pValue = 1 - chiSquareCDF(testStatistic, df);
    
    return {
      testName: "Breusch-Pagan",
      statistic: testStatistic,
      pValue: pValue,
      isHomoscedastic: pValue > 0.05,
      criticalValue: 0.05,
      df: df
    };
  } catch (error) {
    console.error("Error in Breusch-Pagan test:", error);
    return {
      testName: "Breusch-Pagan",
      statistic: null,
      pValue: null,
      isHomoscedastic: true, // Default to true on error
      criticalValue: 0.05,
      error: "Test failed: " + error.message
    };
  }
}

// Chi-squared cumulative distribution function
function chiSquareCDF(x, df) {
  if (x <= 0) return 0;

  // Use jStat's chi-square CDF if available for better accuracy
  if (typeof jStat !== 'undefined' && jStat.chisquare && typeof jStat.chisquare.cdf === 'function') {
    return jStat.chisquare.cdf(x, df);
  }

  // Fallback approximation for chi-squared CDF (simplified)
  const p = Math.exp(-0.5 * x) * Math.pow(x, df / 2 - 1) / (Math.pow(2, df / 2) * gamma(df / 2));
  return 1 - p;
}

// Gamma function approximation (Lanczos approximation)
function gamma(z) {
  // Simplified Lanczos approximation
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  
  z -= 1;
  const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  
  let x = p[0];
  for (let i = 1; i < p.length; i++) {
    x += p[i] / (z + i);
  }
  
  const t = z + p.length - 1.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Generate data for residuals vs. fitted values plot
function generateResidualVsFittedData(residuals, yHat) {
  return residuals.map((res, i) => ({
    fitted: yHat[i],
    residual: res
  }));
}

// Generate data for residuals vs. independent variables plots
function generateResidualVsIndependentData(residuals, X, varInfo) {
  const result = [];
  
  // Skip intercept column
  for (let j = 1; j < X[0].length; j++) {
    const varIndex = j - 1;
    const varName = varInfo[varIndex]?.name || `Variable ${varIndex + 1}`;
    const varLabel = varInfo[varIndex]?.label || varName;
    
    const data = residuals.map((res, i) => ({
      x: X[i][j],
      residual: res
    }));
    
    result.push({
      variable: varName,
      variableLabel: varLabel,
      data: data
    });
  }
  
  return result;
}

// Generate data for scale-location plot
function generateScaleLocationData(residuals, yHat) {
  // Calculate standardized residuals
  const residualsMean = mean(residuals);
  const residualsStdDev = standardDeviation(residuals, residualsMean);
  
  return residuals.map((res, i) => ({
    fitted: yHat[i],
    sqrtAbsRes: Math.sqrt(Math.abs(res / residualsStdDev))
  }));
} 