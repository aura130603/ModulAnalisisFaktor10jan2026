// Worker for multicollinearity test in linear regression
self.onmessage = function(e) {
  try {
    const { independentData, independentVariableInfos } = e.data;
    
    console.log("Multicollinearity test worker received data:", {
      hasIndependent: !!independentData,
      hasVariableInfo: !!independentVariableInfos,
      independentLength: independentData?.length || 0,
      infoLength: independentVariableInfos?.length || 0
    });
    
    // Make sure we have data to analyze
    if (!independentData) {
      self.postMessage({ error: "Missing data: independent variable data not provided" });
      return;
    }
    
    if (independentData.length === 0) {
      self.postMessage({ error: "Empty data array provided for multicollinearity test" });
      return;
    }

    if (independentData.length < 2) {
      self.postMessage({ error: "Multicollinearity test requires at least two independent variables" });
      return;
    }
    
    // For multicollinearity test, we need to:
    // 1. Compute correlation matrix between independent variables
    // 2. Compute Variance Inflation Factors (VIF)
    // 3. Check for high correlations or high VIF values

    // Prepare independent data as a matrix of observations × variables
    const X = prepareIndependentData(independentData);
    
    // Calculate correlation matrix
    const correlationMatrix = calculateCorrelationMatrix(X);
    
    // Calculate VIF for each variable
    const vifValues = calculateVIF(X);
    
    // Format the results
    const formattedResults = formatResults(correlationMatrix, vifValues, independentVariableInfos);
    
    // Determine if multicollinearity exists
    const hasMulticollinearity = detectMulticollinearity(correlationMatrix, vifValues);
    
    // Generate interpretation of results
    const interpretationLines = generateInterpretation(correlationMatrix, vifValues, independentVariableInfos);
    
    // Create a combined interpretation text
    const interpretationText = interpretationLines.join(' ');
    
    // Format data for the data-table component in the Result output
    const correlationTable = {
      title: "Correlation Matrix",
      columnHeaders: [
        { header: "Variable" },
        ...independentVariableInfos.map(v => ({ header: v.name }))
      ],
      rows: formattedResults.correlationMatrix.values.map((row, i) => {
        const varName = independentVariableInfos[i].name;
        const varLabel = independentVariableInfos[i].label;
        const displayName = varLabel ? `${varName} (${varLabel})` : varName;
        
        return {
          rowHeader: [displayName],
          ...row.reduce((obj, val, j) => {
            obj[independentVariableInfos[j].name] = val.toFixed(4);
            return obj;
          }, {})
        };
      })
    };
    
    const vifTable = {
      title: "Variance Inflation Factors (VIF)",
      columnHeaders: [
        { header: "Variable" },
        { header: "VIF" },
        { header: "Concern Level" }
      ],
      rows: formattedResults.vif.map(item => ({
        rowHeader: [item.variableLabel ? `${item.variable} (${item.variableLabel})` : item.variable],
        "VIF": isFinite(item.vif) ? item.vif.toFixed(4) : "∞",
        "Concern Level": item.concern
      }))
    };
    
    // Add a concern level explanation table
    const concernTable = {
      title: "VIF Concern Levels",
      columnHeaders: [
        { header: "Level" },
        { header: "VIF Range" },
        { header: "Interpretation" }
      ],
      rows: [
        {
          rowHeader: ["Low"],
          "VIF Range": "< 2",
          "Interpretation": "No significant multicollinearity"
        },
        {
          rowHeader: ["Moderate"],
          "VIF Range": "2 - 5",
          "Interpretation": "Moderate multicollinearity, may not require action"
        },
        {
          rowHeader: ["High"],
          "VIF Range": "5 - 10",
          "Interpretation": "High multicollinearity, consider remedial measures"
        },
        {
          rowHeader: ["Very High"],
          "VIF Range": "> 10",
          "Interpretation": "Severe multicollinearity, remedial action recommended"
        }
      ]
    };
    
    // Prepare results for output
    const outputData = {
      tables: [correlationTable, vifTable, concernTable]
    };
    
    // Prepare final result
    const result = {
      title: "Multicollinearity Test Results",
      description: interpretationText,
      hasMulticollinearity: hasMulticollinearity,
      correlationMatrix: formattedResults.correlationMatrix,
      vif: formattedResults.vif,
      interpretation: interpretationText,
      output_data: JSON.stringify(outputData)
    };
    
    console.log("Multicollinearity test completed:", {
      hasMulticollinearity,
      correlationMatrix: formattedResults.correlationMatrix,
      vif: formattedResults.vif
    });
    
    self.postMessage(result);
  } catch (error) {
    console.error("Error in multicollinearity test:", error);
    self.postMessage({
      error: "Error in multicollinearity test: " + (error.message || "Unknown error"),
      stack: error.stack
    });
  }
};

// Function to prepare independent data matrix
function prepareIndependentData(independentData) {
  console.log("Preparing independent data:", independentData);
  
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
        // Transpose the data to get observations as rows and variables as columns
        const observations = independentData[0].length;
        const variables = independentData.length;
        
        console.log(`Transposing data: ${variables} variables, ${observations} observations`);
        
        const transposed = [];
        for (let i = 0; i < observations; i++) {
          const row = [];
          for (let j = 0; j < variables; j++) {
            row.push(independentData[j][i]);
          }
          transposed.push(row);
        }
        return transposed;
      }
    }
  }
  
  return independentData;
}

// Calculate mean of an array
function mean(data) {
  return data.reduce((sum, value) => sum + value, 0) / data.length;
}

// Calculate standard deviation of an array
function standardDeviation(data, dataMean = undefined) {
  const m = dataMean !== undefined ? dataMean : mean(data);
  const variance = data.reduce((sum, value) => sum + Math.pow(value - m, 2), 0) / data.length;
  return Math.sqrt(variance);
}

// Calculate correlation coefficient between two arrays
function correlation(x, y) {
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
  
  if (xDenom === 0 || yDenom === 0) {
    return 0; // Avoid division by zero
  }
  
  return numerator / Math.sqrt(xDenom * yDenom);
}

// Calculate correlation matrix
function calculateCorrelationMatrix(X) {
  const numVariables = X[0].length;
  const matrix = Array(numVariables).fill().map(() => Array(numVariables).fill(0));
  
  // Extract variables as arrays
  const variables = [];
  for (let j = 0; j < numVariables; j++) {
    variables.push(X.map(row => row[j]));
  }
  
  // Calculate correlation for each pair
  for (let i = 0; i < numVariables; i++) {
    for (let j = 0; j < numVariables; j++) {
      if (i === j) {
        matrix[i][j] = 1; // Correlation of a variable with itself is 1
      } else {
        matrix[i][j] = correlation(variables[i], variables[j]);
      }
    }
  }
  
  return matrix;
}

// Calculate R-squared for a multiple regression model
function calculateRSquared(y, X) {
  // Add intercept column
  const XWithIntercept = X.map(row => [1, ...row]);
  
  // Fit the regression model using OLS
  const beta = multipleRegression(y, XWithIntercept);
  
  // Calculate fitted values
  const yHat = XWithIntercept.map(row => {
    return row.reduce((sum, val, idx) => sum + val * beta[idx], 0);
  });
  
  // Calculate R-squared
  const yMean = mean(y);
  const totalSS = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const residualSS = y.reduce((sum, val, i) => sum + Math.pow(val - yHat[i], 2), 0);
  
  return 1 - (residualSS / totalSS);
}

// Simple implementation of multiple regression using OLS
function multipleRegression(y, X) {
  // Using normal equations: beta = (X'X)^-1 X'y
  const XT = transpose(X);
  const XTX = matrixMultiply(XT, X);
  const XTXInv = matrixInverse(XTX);
  const XTy = matrixMultiplyVector(XT, y);
  
  return matrixMultiplyVector(XTXInv, XTy);
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

// Simple matrix inverse
function matrixInverse(A) {
  const n = A.length;
  
  if (n === 1) {
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
  
  // Extract the inverse
  return augmented.map(row => row.slice(n));
}

// Calculate VIF for each variable
function calculateVIF(X) {
  const numVariables = X[0].length;
  const vifs = [];
  
  for (let i = 0; i < numVariables; i++) {
    // Create arrays excluding variable i
    const y = X.map(row => row[i]);
    const Xrest = X.map(row => row.filter((_, j) => j !== i));
    
    try {
      // Calculate R-squared for regressing variable i on all other variables
      const r2 = calculateRSquared(y, Xrest);
      
      // Calculate VIF as 1 / (1 - R^2)
      const vif = 1 / (1 - r2);
      vifs.push(vif);
    } catch (error) {
      // If there's a singularity issue, the VIF is infinite
      console.error(`Error calculating VIF for variable ${i}:`, error);
      vifs.push(Infinity);
    }
  }
  
  return vifs;
}

// Format results to include variable names
function formatResults(correlationMatrix, vifValues, independentVariableInfos) {
  // Format correlation matrix with variable names
  const formattedCorrelationMatrix = {
    variables: independentVariableInfos.map(v => v.name),
    variableLabels: independentVariableInfos.map(v => v.label || v.name),
    values: correlationMatrix
  };
  
  // Format VIF values with variable names
  const formattedVIF = independentVariableInfos.map((v, i) => ({
    variable: v.name,
    variableLabel: v.label || v.name,
    vif: vifValues[i],
    concern: categorizeConcernLevel(vifValues[i])
  }));
  
  return {
    correlationMatrix: formattedCorrelationMatrix,
    vif: formattedVIF
  };
}

// Determine concern level based on VIF value
function categorizeConcernLevel(vif) {
  if (vif < 2) return "Low";
  if (vif < 5) return "Moderate";
  if (vif < 10) return "High";
  return "Very High";
}

// Detect if multicollinearity exists
function detectMulticollinearity(correlationMatrix, vifValues) {
  // Check high correlations
  let highCorrelationExists = false;
  const numVars = correlationMatrix.length;
  
  for (let i = 0; i < numVars; i++) {
    for (let j = i + 1; j < numVars; j++) {
      if (Math.abs(correlationMatrix[i][j]) > 0.7) {
        highCorrelationExists = true;
        break;
      }
    }
    if (highCorrelationExists) break;
  }
  
  // Check high VIF values
  const highVIFExists = vifValues.some(vif => vif > 5);
  
  return highCorrelationExists || highVIFExists;
}

// Generate interpretation of results
function generateInterpretation(correlationMatrix, vifValues, independentVariableInfos) {
  const interpretations = [];
  const numVars = correlationMatrix.length;
  
  // Check for high correlations
  for (let i = 0; i < numVars; i++) {
    for (let j = i + 1; j < numVars; j++) {
      const correlation = correlationMatrix[i][j];
      const absCorrelation = Math.abs(correlation);
      
      if (absCorrelation > 0.9) {
        interpretations.push(`Very strong ${correlation > 0 ? 'positive' : 'negative'} correlation (${correlation.toFixed(3)}) found between ${independentVariableInfos[i].name} and ${independentVariableInfos[j].name}.`);
      } else if (absCorrelation > 0.7) {
        interpretations.push(`Strong ${correlation > 0 ? 'positive' : 'negative'} correlation (${correlation.toFixed(3)}) found between ${independentVariableInfos[i].name} and ${independentVariableInfos[j].name}.`);
      }
    }
  }
  
  // Check for high VIF values
  vifValues.forEach((vif, i) => {
    if (vif > 10) {
      interpretations.push(`${independentVariableInfos[i].name} shows very high multicollinearity (VIF = ${vif.toFixed(2)}).`);
    } else if (vif > 5) {
      interpretations.push(`${independentVariableInfos[i].name} shows concerning multicollinearity (VIF = ${vif.toFixed(2)}).`);
    }
  });
  
  // Overall assessment
  if (interpretations.length === 0) {
    interpretations.push("No significant multicollinearity detected among the independent variables.");
  } else {
    interpretations.push("Consider removing or combining highly correlated variables to reduce multicollinearity.");
  }
  
  return interpretations;
}
