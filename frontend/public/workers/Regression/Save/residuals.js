self.onmessage = function(event) {
  console.log("[Residuals Worker] Received message:", event.data);
  const { independentData, coefficients, dependentData } = event.data;

  if (!independentData || !coefficients || !dependentData) {
    console.error("[Residuals Worker] Missing data:", { independentData, coefficients, dependentData });
    self.postMessage({ success: false, error: "Missing required data." });
    return;
  }

  try {
    console.log("[Residuals Worker] Input data:", {
      independentDataLength: independentData.length,
      independentVarsCount: independentData[0].length,
      firstRow: independentData[0],
      coefficients: coefficients,
      dependentDataLength: dependentData.length
    });

    // Convert coefficients to numbers
    const numericCoefficients = coefficients.map((coef, index) => {
      const num = Number(coef);
      console.log(`[Residuals Worker] Converting coefficient ${index}:`, {
        original: coef,
        numeric: num,
        isNaN: isNaN(num)
      });
      return isNaN(num) ? 0 : num;
    });

    // Number of cases
    const C = dependentData.length;
    
    // Number of predictors (excluding intercept)
    const p = independentData[0].length;
    
    // Number of coefficients (including intercept)
    const p_star = numericCoefficients.length;

    // Degrees of freedom
    const df = C - p_star;

    // Case weights (assuming equal weights = 1)
    const caseWeights = Array(C).fill(1);
    
    // Matrix inversion function
    const matrixInverse = (matrix) => {
      const n = matrix.length;
      
      // Create identity matrix of the same dimension
      const identity = Array(n).fill().map((_, i) => 
        Array(n).fill().map((_, j) => i === j ? 1 : 0)
      );
      
      // Create a copy of the original matrix
      const augmentedMatrix = matrix.map(row => [...row]);
      
      // Perform Gaussian elimination
      for (let i = 0; i < n; i++) {
        // Find pivot
        let maxRow = i;
        for (let j = i + 1; j < n; j++) {
          if (Math.abs(augmentedMatrix[j][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
            maxRow = j;
          }
        }
        
        // Swap rows if needed
        if (maxRow !== i) {
          [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]];
          [identity[i], identity[maxRow]] = [identity[maxRow], identity[i]];
        }
        
        // Check for singular matrix
        if (Math.abs(augmentedMatrix[i][i]) < 1e-10) {
          throw new Error("Matrix is singular, cannot compute inverse");
        }
        
        // Scale row i
        const pivot = augmentedMatrix[i][i];
        for (let j = 0; j < n; j++) {
          augmentedMatrix[i][j] /= pivot;
          identity[i][j] /= pivot;
        }
        
        // Eliminate other rows
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
    
    // 1. Calculate Predicted Values
    // Formula: Ŷᵢ = b₀ + Σⱼ₌₁ᵖ bⱼXⱼᵢ
    const predictedValues = independentData.map((row, rowIndex) => {
      const numericRow = row.map(val => Number(val));
      let prediction = numericCoefficients[0]; // Intercept
      for (let i = 0; i < numericRow.length; i++) {
        prediction += numericCoefficients[i + 1] * numericRow[i];
      }
      return prediction;
    });

    // Calculate leverage values (hat matrix diagonal)
    // Formula: hᵢ = (X(X'X)⁻¹X')ᵢᵢ
    const calculateLeverage = (X) => {
      try {
        // Add intercept column to X
        const Xwith1 = X.map(row => [1, ...row.map(v => Number(v))]);
        
        // Calculate X'X
        const XtX = [];
        const p_plus_1 = p + 1; // Accounting for intercept
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
        
        // Calculate (X'X)^-1 using matrix inversion
        const XtXinv = matrixInverse(XtX);
        
        // Calculate hat matrix diagonal: hᵢ = Xᵢ(X'X)⁻¹Xᵢ'
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
        
        console.log("[Residuals Worker] Calculated leverage values:", {
          first3: leverage.slice(0, 3),
          min: Math.min(...leverage),
          max: Math.max(...leverage)
        });
        
        return leverage;
      } catch (error) {
        console.error("[Residuals Worker] Error calculating leverage:", error);
        // Fallback using simplified formula 
        return Array(C).fill(1/C);
      }
    };

    // Calculate residuals
    // Formula: eᵢ = Yᵢ - Ŷᵢ (Unstandardized residuals)
    const unstandardizedResiduals = dependentData.map((actual, i) => 
      Number(actual) - predictedValues[i]
    );

    // Calculate sum of squares error
    // Formula: SSₑ = Σᵢ₌₁ᶜ wᵢeᵢ²
    const SSe = unstandardizedResiduals.reduce((sum, e, i) => 
      sum + caseWeights[i] * e * e, 0);
    
    // Calculate mean square error
    // Formula: MSE = SSₑ/(C-p*)
    const MSE = SSe / df;
    
    // Calculate standard error of estimate
    // Formula: s = √MSE
    const s = Math.sqrt(MSE);

    // Calculate leverage values
    const leverage = calculateLeverage(independentData);

    // Calculate all five types of residuals
    const results = independentData.map((row, rowIndex) => {
      const numericDep = Number(dependentData[rowIndex]);
      const weight = caseWeights[rowIndex];
      const h_i = leverage[rowIndex];
      
      // 1. Unstandardized Residuals (RES)
      // Formula: eᵢ = Yᵢ - Ŷᵢ
      const unstandardized = unstandardizedResiduals[rowIndex];

      // 2. Standardized Residuals (ZRESID)
      // Formula: ZRESIDᵢ = eᵢ/s
      const standardized = unstandardized / s;
      
      // 3. Studentized Residuals (SRESID)
      // Formula: SRESIDᵢ = eᵢ/(s*sqrt(1-hᵢ))
      const studentized = unstandardized / (s * Math.sqrt(1 - h_i));

      // 4. Deleted Residuals (DRESID)
      // Formula: DRESIDᵢ = eᵢ/(1-hᵢ)
      const deleted = unstandardized / (1 - h_i);

      // 5. Studentized Deleted Residuals (SDRESID)
      // Formula: SDRESIDᵢ = SRESIDᵢ * sqrt((df-1)/(df-SRESIDᵢ²))
      const studentizedDeleted = studentized * 
        Math.sqrt((df - 1) / (df - studentized * studentized));

      return {
        unstandardized: Number(unstandardized.toFixed(5)),
        standardized: Number(standardized.toFixed(5)),
        studentized: Number(studentized.toFixed(5)),
        deleted: Number(deleted.toFixed(5)),
        studentizedDeleted: Number(studentizedDeleted.toFixed(5))
      };
    });

    console.log("[Residuals Worker] Calculation results:", {
      firstRow: results[0],
      unstandardized_first5: results.map(r => r.unstandardized).slice(0, 5),
      standardized_first5: results.map(r => r.standardized).slice(0, 5),
      studentized_first5: results.map(r => r.studentized).slice(0, 5),
      deleted_first5: results.map(r => r.deleted).slice(0, 5),
      studentizedDeleted_first5: results.map(r => r.studentizedDeleted).slice(0, 5),
      totalRows: results.length,
      MSE: MSE,
      s: s,
      df: df
    });

    // Validate results
    if (!Array.isArray(results)) {
      throw new Error("Results are not an array");
    }
    
    if (results.some(val => 
      isNaN(val.unstandardized) || 
      isNaN(val.standardized) || 
      isNaN(val.studentized) || 
      isNaN(val.deleted) || 
      isNaN(val.studentizedDeleted)
    )) {
      console.error("[Residuals Worker] NaN values found in results:", 
        results.filter(val => 
          isNaN(val.unstandardized) || 
          isNaN(val.standardized) || 
          isNaN(val.studentized) || 
          isNaN(val.deleted) || 
          isNaN(val.studentizedDeleted)
        )
      );
      throw new Error("NaN values found in calculation results");
    }

    console.log("[Residuals Worker] Sending results back to main thread");
    self.postMessage(results);
  } catch (e) {
    console.error("[Residuals Worker] Error occurred:", e);
    self.postMessage({ error: e.message });
  }
}; 