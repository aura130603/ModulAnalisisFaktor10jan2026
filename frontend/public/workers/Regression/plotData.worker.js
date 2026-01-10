self.onmessage = function(event) {
  console.log("[Plotting Data Worker] Received message:", event.data);
  const { independentData, coefficients, dependentData } = event.data;

  if (!independentData || !coefficients || !dependentData) {
    console.error("[Plotting Data Worker] Missing data:", { independentData, coefficients, dependentData });
    self.postMessage({ success: false, error: "Missing required data." });
    return;
  }

  try {
    const numericCoefficients = coefficients.map(Number);
    const C = dependentData.length;
    const p = independentData[0].length;
    const p_star = numericCoefficients.length;
    const df = C - p_star;
    const caseWeights = Array(C).fill(1);

    const matrixInverse = (matrix) => {
      const n = matrix.length;
      const identity = Array(n).fill().map((_, i) => 
        Array(n).fill().map((_, j) => i === j ? 1 : 0)
      );
      const augmentedMatrix = matrix.map(row => [...row]);
      for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let j = i + 1; j < n; j++) {
          if (Math.abs(augmentedMatrix[j][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
            maxRow = j;
          }
        }
        if (maxRow !== i) {
          [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]];
          [identity[i], identity[maxRow]] = [identity[maxRow], identity[i]];
        }
        if (Math.abs(augmentedMatrix[i][i]) < 1e-10) {
          throw new Error("Matrix is singular, cannot compute inverse");
        }
        const pivot = augmentedMatrix[i][i];
        for (let j = 0; j < n; j++) {
          augmentedMatrix[i][j] /= pivot;
          identity[i][j] /= pivot;
        }
        for (let j = 0; j < n; j++) {
          if (j !== i) {
            const factor = augmentedMatrix[j][i];
            for (let k = 0; k < n; k++) {
              augmentedMatrix[j][k] -= factor * augmentedMatrix[i][k];
              identity[j][k] -= factor * identity[i][k];
            }
          }
        }
      }
      return identity;
    };

    const predictedValues = independentData.map((row) => {
      let prediction = numericCoefficients[0]; // Intercept
      for (let i = 0; i < row.length; i++) {
        prediction += numericCoefficients[i + 1] * Number(row[i]);
      }
      return prediction;
    });

    const mean = (arr) => arr.reduce((acc, val) => acc + val, 0) / arr.length;
    const stdDev = (arr, arrMean) => {
      const variance = arr.reduce((acc, val) => acc + (val - arrMean) ** 2, 0) / (arr.length - 1);
      return Math.sqrt(variance);
    };

    const predMean = mean(predictedValues);
    const predStdDev = stdDev(predictedValues, predMean);
    const standardizedPredictedValues = predictedValues.map(val => (val - predMean) / predStdDev);

    const calculateLeverage = (X) => {
      try {
        const Xwith1 = X.map(row => [1, ...row.map(v => Number(v))]);
        const XtX = [];
        const p_plus_1 = p + 1;
        for (let i = 0; i < p_plus_1; i++) {
          XtX[i] = [];
          for (let j = 0; j < p_plus_1; j++) {
            let sum = 0;
            for (let k = 0; k < C; k++) {
              sum += Xwith1[k][i] * Xwith1[k][j] * caseWeights[k];
            }
            XtX[i][j] = sum;
          }
        }
        const XtXinv = matrixInverse(XtX);
        const leverage = [];
        for (let i = 0; i < C; i++) {
          let h_ii = 0;
          for (let j = 0; j < p_plus_1; j++) {
            for (let k = 0; k < p_plus_1; k++) {
              h_ii += Xwith1[i][j] * XtXinv[j][k] * Xwith1[i][k];
            }
          }
          leverage.push(h_ii);
        }
        return leverage;
      } catch (error) {
        console.error("[Plotting Data Worker] Error calculating leverage, falling back.", error);
        return Array(C).fill(1/C);
      }
    };

    const unstandardizedResiduals = dependentData.map((actual, i) => Number(actual) - predictedValues[i]);
    const SSe = unstandardizedResiduals.reduce((sum, e, i) => sum + caseWeights[i] * e * e, 0);
    const MSE = SSe / df;
    const s = Math.sqrt(MSE);
    const leverage = calculateLeverage(independentData);

    const standardizedResiduals = unstandardizedResiduals.map(e => e / s);
    const studentizedResiduals = unstandardizedResiduals.map((e, i) => e / (s * Math.sqrt(1 - leverage[i])));
    const deletedResiduals = unstandardizedResiduals.map((e, i) => e / (1 - leverage[i]));
    const studentizedDeletedResiduals = studentizedResiduals.map((sr, i) => sr * Math.sqrt((df - 1) / (df - sr * sr)));

    const results = {
      success: true,
      predicted: predictedValues,
      zpred: standardizedPredictedValues,
      unstandardized_residuals: unstandardizedResiduals,
      zresid: standardizedResiduals,
      sresid: studentizedResiduals,
      dresid: deletedResiduals,
      sdresid: studentizedDeletedResiduals,
      dependent: dependentData,
    };
    
    // Replace NaN values with null for JSON serialization
    Object.keys(results).forEach(key => {
        if (Array.isArray(results[key])) {
            results[key] = results[key].map(val => isNaN(val) ? null : Number(val.toFixed(5)));
        }
    });

    self.postMessage(results);

  } catch (error) {
    console.error('[Plotting Data Worker] Error:', error.message, error.stack);
    self.postMessage({ success: false, error: error.message });
  }
}; 