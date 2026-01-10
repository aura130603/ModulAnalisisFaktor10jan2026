// confidence_interval.js - SPSS compatible implementation

importScripts("https://cdn.jsdelivr.net/npm/jstat@latest/dist/jstat.min.js");

// Transpose matrix
function transposeMatrix(matrix) {
    if (!matrix || matrix.length === 0) return [];
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

// Multiply two matrices
function multiplyMatrices(A, B) {
    const result = [];
    if (!A || !B || A.length === 0 || B.length === 0 || A[0].length !== B.length) {
        throw new Error("Invalid matrix dimensions for multiplication");
    }
    for (let i = 0; i < A.length; i++) {
        result[i] = [];
        for (let j = 0; j < B[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < A[0].length; k++) {
                sum += A[i][k] * B[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

// Multiply matrix and vector
function multiplyMatrixVector(matrix, vector) {
    const result = [];
    if (!matrix || !vector || matrix.length === 0 || matrix[0].length !== vector.length) {
         throw new Error("Invalid dimensions for matrix-vector multiplication");
    }
    for (let i = 0; i < matrix.length; i++) {
        let sum = 0;
        for (let j = 0; j < vector.length; j++) {
            sum += matrix[i][j] * vector[j];
        }
        result[i] = sum;
    }
    return result;
}

// Scalar multiply matrix
function scalarMultiplyMatrix(matrix, scalar) {
    if (!matrix) return [];
    return matrix.map(row => row.map(value => value * scalar));
}

// Invert matrix using Gauss-Jordan elimination
function invertMatrix(matrix) {
    if (!matrix || matrix.length === 0 || matrix.length !== matrix[0].length) {
        throw new Error("Matrix must be square to be inverted.");
    }
    const n = matrix.length;
    const identity = Array.from({ length: n }, (_, i) => 
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    );
    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);

    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

        const pivot = augmented[i][i];
        if (pivot === 0) {
            throw new Error('Matrix is singular and cannot be inverted.');
        }
        for (let j = i; j < 2 * n; j++) {
            augmented[i][j] /= pivot;
        }

        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = augmented[k][i];
                for (let j = i; j < 2 * n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }
    }
    return augmented.map(row => row.slice(n));
}


self.onmessage = function(e) {
    try {
        const { independent, dependent, dependentVariableInfo, independentVariableInfos, confidenceLevel } = e.data;
        const alpha = 1 - (confidenceLevel / 100);

        // --- Input Validation ---
        if (!independent || !dependent || !Array.isArray(independent) || !Array.isArray(dependent)) {
            self.postMessage({ error: "Independent and dependent data must be provided as arrays." });
            return;
        }

        // Standardize independent data to be an array of arrays
        const independentData = Array.isArray(independent[0]) ? independent : [independent];
        
        const n = dependent.length;
        const p = independentData.length; // Number of independent variables

        if (n === 0 || p === 0) {
            self.postMessage({ error: "Data arrays cannot be empty." });
            return;
        }
        console.log(`[CI Worker] Processing ${p} independent variables with ${n} observations`);


        // --- Multiple Linear Regression Calculation ---

        // 1. Prepare X matrix (add intercept) and transpose it
        const X_transposed = transposeMatrix(independentData);
        const X_with_intercept = X_transposed.map(row => [1, ...row]);

        // 2. Transpose X matrix back
        const Xt = transposeMatrix(X_with_intercept);
        
        // 3. Calculate (X'X)
        const XtX = multiplyMatrices(Xt, X_with_intercept);

        // 4. Calculate inverse of (X'X)
        const XtX_inv = invertMatrix(XtX);

        // 5. Calculate X'y
        const Xty = multiplyMatrixVector(Xt, dependent);
        
        // 6. Calculate coefficients (beta)
        const beta = multiplyMatrixVector(XtX_inv, Xty);
        
        // 7. Calculate predictions and residuals
        const y_pred = multiplyMatrixVector(X_with_intercept, beta);
        const residuals = dependent.map((val, i) => val - y_pred[i]);
        
        // 8. Calculate Sum of Squares Error (SSE)
        const SSE = residuals.reduce((sum, e) => sum + e * e, 0);

        // 9. Degrees of Freedom
        const dfResidual = n - p - 1;
        if (dfResidual <= 0) {
            self.postMessage({ error: "Not enough data points to compute confidence intervals (degrees of freedom is non-positive)." });
            return;
        }

        // 10. Mean Square Error (MSE)
        const MSE = SSE / dfResidual;
        
        // 11. Calculate standard errors for each coefficient
        const C = scalarMultiplyMatrix(XtX_inv, MSE); // This is the covariance matrix of beta
        const stdErrors = C.map((row, i) => Math.sqrt(row[i])); // Diagonal elements are variances
        
        // 12. Get t-critical value
        const tCrit = getTCriticalValue(dfResidual, alpha);
        
        // 13. Calculate confidence intervals for each coefficient
        const confidenceIntervals = beta.map((b, i) => {
            const marginOfError = tCrit * stdErrors[i];
            return {
                lower: spssRound(b - marginOfError, 3),
                upper: spssRound(b + marginOfError, 3)
            };
        });
        
        // Log raw values for debugging
        console.log("Calculated values:", {
            beta, stdErrors, tCrit, MSE, confidenceIntervals
        });

        // --- Prepare Results for Output ---
        
        const rows = [];
        const children = [];
        
        // Intercept (Constant) row
        children.push({
            rowHeader: [null, "(Constant)"],
            lowerBound: formatSPSSValue(confidenceIntervals[0].lower),
            upperBound: formatSPSSValue(confidenceIntervals[0].upper)
        });

        // Independent variable rows
        independentVariableInfos.forEach((varInfo, index) => {
            const displayName = (varInfo.label && varInfo.label.trim() !== '') ? varInfo.label : varInfo.name;
            const ci = confidenceIntervals[index + 1]; // +1 to skip intercept
            children.push({
                rowHeader: [null, displayName],
                lowerBound: formatSPSSValue(ci.lower),
                upperBound: formatSPSSValue(ci.upper)
            });
        });

        rows.push({
            rowHeader: ["1"],
            children: children
        });

        const result = {
            tables: [
                {
                    title: "Coefficients",
                    columnHeaders: [
                        { header: "Model" },
                        { header: "" },
                        {
                            header: `${confidenceLevel}% Confidence Interval for B`,
                            children: [
                                { header: "Lower Bound", key: "lowerBound" },
                                { header: "Upper Bound", key: "upperBound" }
                            ]
                        }
                    ],
                    rows: rows,
                    footnote: {
                        a: `Dependent Variable: ${(dependentVariableInfo.label && dependentVariableInfo.label.trim() !== '') ? dependentVariableInfo.label : dependentVariableInfo.name}`
                    }
                }
            ]
        };

        console.log("[CI Worker] Sending final result:", result);
        self.postMessage(result);
    
    } catch (error) {
        console.error("[CI Worker] Critical error:", error);
        self.postMessage({ 
            error: `Error in confidence interval calculation: ${error.message || "Unknown error"}`,
            stack: error.stack
        });
    }
};

// --- Helper Functions (t-critical, rounding, formatting) ---

// Fungsi untuk mendapatkan nilai t-kritis yang tepat
function getTCriticalValue(df, alpha) {
    if (df <= 0) return NaN;
    // Calculate the p-value for the two-tailed test
    const p = 1 - alpha / 2;
    // Use jStat's inverse student-t function
    return jStat.studentt.inv(p, df);
}

// Fungsi pembulatan SPSS
function spssRound(value, decimals) {
    if (isNaN(value)) return value;
    const factor = Math.pow(10, decimals);
    const adjustedValue = Math.abs(value) * factor + 0.0000000001;
    const rounded = Math.floor(adjustedValue + 0.5) / factor;
    return value < 0 ? -rounded : rounded;
}

// Fungsi untuk format angka seperti SPSS
function formatSPSSValue(value) {
    if (isNaN(value)) return " "; // Return empty for non-computable values
    if (value >= 0 && value < 1 && value !== 0) {
        return '.' + value.toFixed(3).split('.')[1];
    } else if (value < 0 && value > -1) {
        return '-.' + Math.abs(value).toFixed(3).split('.')[1];
    } else {
        return value.toFixed(3);
    }
}