import {
    BivariateResults,
    BivariateTable,
    TableColumnHeader,
    TableRow,
    Correlation,
    DescriptiveStatistics,
} from '../types';

/**
 * Formats correlation table for bivariate analysis
 * @param results Bivariate analysis results
 * @param options Configuration options for the correlation table
 * @param testVariables Array of test variables
 * @param correlationType Array of correlation types to include
 * @returns Formatted table
 */
export function formatCorrelationTable(
    results: BivariateResults,
    options: {
        testOfSignificance: {
            oneTailed: boolean,
            twoTailed: boolean
        },
        flagSignificantCorrelations: boolean,
        showOnlyTheLowerTriangle: boolean,
        showDiagonal: boolean,
        statisticsOptions: {
            meansAndStandardDeviations: boolean,
            crossProductDeviationsAndCovariances: boolean,
        },
    },
    testVariables: any[],
    correlationType: string[]
): BivariateTable {
    if (!results || !results.correlation || results.correlation.length === 0) {
        return {
            title: "Correlation",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Multiple variables case
    const table: BivariateTable = {
        title: "Correlation",
        columnHeaders: [
            { header: "", key: "rowHeader" },
        ],
        rows: []
    };

    if (correlationType.includes("Kendall's tau_b") || correlationType.includes("Spearman's rho")) {
        table.columnHeaders.push({ header: "", key: "var1" });
    }
    table.columnHeaders.push({ header: "", key: "type" });

    let nColumn = 0;
    if (options.showOnlyTheLowerTriangle && !options.showDiagonal) {
        nColumn = testVariables.length - 1;
    } else {
        nColumn = testVariables.length;
    }

    for (let i = 0; i < nColumn; i++) {
        table.columnHeaders.push({
            header: testVariables[i].label || testVariables[i].name || `Variable ${i + 1}`,
            key: `var_${i}`
        });
    }

    // Create a mapping of variable names to their correlation data
    const correlationMap = new Map();
    
    // Process the correlation data
    for (const result of results.correlation) {
        if (!result.variable1 || !result.variable2) continue;
        
        const key = `${result.variable1}-${result.variable2}`;
        correlationMap.set(key, result);
    }

    // For each correlation type
    for (const corType of correlationType) {
        if (corType === "Pearson") {
            // Determine row start index
            let rowStart = 0;
            let rowEnd = nColumn;
            if (options.showOnlyTheLowerTriangle && !options.showDiagonal) {
                rowStart = 1; // Start from the second variable
                rowEnd = nColumn + 1;
            }
            // For each variable (row)
            for (let i = rowStart; i < rowEnd; i++) {
                const rowVar = testVariables[i];

                // Correlation coefficient row
                const corrRow: any = { rowHeader: [rowVar.name], type: "Pearson Correlation" };

                // Significance row
                let sigRow: any = null;
                if (options.testOfSignificance.twoTailed) {
                    sigRow = { rowHeader: [rowVar.name], type: "Sig. (2-tailed)" };
                } else if (options.testOfSignificance.oneTailed) {
                    sigRow = { rowHeader: [rowVar.name], type: "Sig. (1-tailed)" };
                }

                // Sum of squares and covariance rows (if enabled)
                let sumOfSquaresRow: any = null;
                let covarianceRow: any = null;
                if (options.statisticsOptions.crossProductDeviationsAndCovariances) {
                    sumOfSquaresRow = { rowHeader: [rowVar.name], type: "Sum of Squares and Cross-products" };
                    covarianceRow = { rowHeader: [rowVar.name], type: "Covariance" };
                }

                // N row
                const nRow: any = { rowHeader: [rowVar.name], type: "N" };

                // For each variable (column)
                for (let j = 0; j < nColumn; j++) {
                    // If options.showOnlyTheLowerTriangle && !options.showDiagonal, only fill for j < i
                    if (options.showOnlyTheLowerTriangle && !options.showDiagonal) {
                        if (j >= i) {
                            continue;
                        }
                    } else {
                        // Skip if we're only showing lower triangle and this is an upper triangle element
                        if (options.showOnlyTheLowerTriangle && j > i) {
                            continue;
                        }
                    }

                    const colVar = testVariables[j];

                    // Find the correlation between these variables
                    const key1 = `${rowVar.name}-${colVar.name}`;
                    const key2 = `${colVar.name}-${rowVar.name}`;
                    const result = correlationMap.get(key1) || correlationMap.get(key2);

                    if (result && result.pearsonCorrelation) {
                        const pearson = result.pearsonCorrelation;

                        // Diagonal case (same variable)
                        // if (i === j) {
                        //     corrRow[`var_${j}`] = 1;
                        //     if (sigRow) sigRow[`var_${j}`] = "";
                        // } else {
                            // Check if either variable has insufficient data
                            const var1Metadata = results.metadata?.find(m => m.variableName === rowVar.name);
                            const var2Metadata = results.metadata?.find(m => m.variableName === colVar.name);
                            const hasInsufficientData = var1Metadata?.hasInsufficientData || var2Metadata?.hasInsufficientData;

                            if (hasInsufficientData) {
                                corrRow[`var_${j}`] = "";
                                if (sigRow) sigRow[`var_${j}`] = "";
                            } else {
                                corrRow[`var_${j}`] = formatCorrelationValue(pearson.Pearson, pearson.PValue, options);
                                if (sigRow) sigRow[`var_${j}`] = formatPValue(pearson.PValue);
                            }
                        // }

                        if (options.statisticsOptions.crossProductDeviationsAndCovariances) {
                            sumOfSquaresRow[`var_${j}`] = formatNumber(pearson.SumOfSquares, rowVar.decimals + 3);
                            covarianceRow[`var_${j}`] = formatNumber(pearson.Covariance, rowVar.decimals + 3);
                        }

                        nRow[`var_${j}`] = pearson.N;
                    } else {
                        corrRow[`var_${j}`] = "";
                        if (sigRow) sigRow[`var_${j}`] = "";
                        if (options.statisticsOptions.crossProductDeviationsAndCovariances) {
                            sumOfSquaresRow[`var_${j}`] = "";
                            covarianceRow[`var_${j}`] = "";
                        }
                        nRow[`var_${j}`] = "";
                    }
                }

                // Add the rows to the table in the specified order
                table.rows.push(corrRow);
                if (sigRow) table.rows.push(sigRow);
                if (options.statisticsOptions.crossProductDeviationsAndCovariances) {
                    table.rows.push(sumOfSquaresRow);
                    table.rows.push(covarianceRow);
                }
                table.rows.push(nRow);
            }
        } else if (corType === "Kendall's tau_b") {
            // Determine row start index
            let rowStart = 0;
            let rowEnd = nColumn;
            if (options.showOnlyTheLowerTriangle && !options.showDiagonal) {
                rowStart = 1; // Start from the second variable
                rowEnd = nColumn + 1;
            }
            // For each variable (row)
            for (let i = rowStart; i < rowEnd; i++) {
                // If showOnlyTheLowerTriangle && !showDiagonal, skip all rows above the diagonal and the diagonal itself
                // (No need to skip here, as rowStart already handles it)

                const rowVar = testVariables[i];

                // Create rows for this variable
                const corrRow: any = { 
                    rowHeader: ["Kendall's tau_b"], 
                    var1: rowVar.name,
                    type: "Correlation Coefficient" 
                };

                let sigRow: any = null;
                if (options.testOfSignificance.twoTailed) {
                    sigRow = { 
                        rowHeader: ["Kendall's tau_b"], 
                        var1: rowVar.name,
                        type: "Sig. (2-tailed)" 
                    };
                } else if (options.testOfSignificance.oneTailed) {
                    sigRow = { 
                        rowHeader: ["Kendall's tau_b"], 
                        var1: rowVar.name,
                        type: "Sig. (1-tailed)" 
                    };
                }

                const nRow: any = { 
                    rowHeader: ["Kendall's tau_b"], 
                    var1: rowVar.name,
                    type: "N" 
                };

                // For each variable (column)
                for (let j = 0; j < nColumn; j++) {
                    // If showOnlyTheLowerTriangle && !showDiagonal, skip all cells above and on the diagonal
                    if (options.showOnlyTheLowerTriangle && !options.showDiagonal && j >= i) {
                        continue;
                    }
                    // If showOnlyTheLowerTriangle and showDiagonal, skip only above diagonal
                    if (options.showOnlyTheLowerTriangle && options.showDiagonal && j > i) {
                        continue;
                    }

                    const colVar = testVariables[j];

                    // Find the correlation between these variables
                    const key1 = `${rowVar.name}-${colVar.name}`;
                    const key2 = `${colVar.name}-${rowVar.name}`;
                    const result = correlationMap.get(key1) || correlationMap.get(key2);

                    if (result && result.kendallsTauBCorrelation) {
                        const kendall = result.kendallsTauBCorrelation;

                        // Diagonal case (same variable)
                        // if (i === j) {
                        //     corrRow[`var_${j}`] = 1;
                        //     if (sigRow) sigRow[`var_${j}`] = "";
                        // } else {
                            // Check if either variable has insufficient data
                            const var1Metadata = results.metadata?.find(m => m.variableName === rowVar.name);
                            const var2Metadata = results.metadata?.find(m => m.variableName === colVar.name);
                            const hasInsufficientData = var1Metadata?.hasInsufficientData || var2Metadata?.hasInsufficientData;

                            if (hasInsufficientData) {
                                corrRow[`var_${j}`] = "";
                                if (sigRow) sigRow[`var_${j}`] = "";
                            } else {
                                corrRow[`var_${j}`] = formatCorrelationValue(kendall.KendallsTauB, kendall.PValue, options);
                                if (sigRow) sigRow[`var_${j}`] = formatPValue(kendall.PValue);
                            }
                        // }

                        nRow[`var_${j}`] = kendall.N;
                    } else {
                        corrRow[`var_${j}`] = "";
                        if (sigRow) sigRow[`var_${j}`] = "";
                        nRow[`var_${j}`] = "";
                    }
                }

                // Only add the row if at least one cell is filled (for lower triangle + no diagonal, some rows may be empty)
                // Or, always add for consistency
                table.rows.push(corrRow);
                if (sigRow) table.rows.push(sigRow);
                table.rows.push(nRow);
            }
        } else if (corType === "Spearman's rho") {
            // Determine row start index
            let rowStart = 0;
            let rowEnd = nColumn;
            if (options.showOnlyTheLowerTriangle && !options.showDiagonal) {
                rowStart = 1; // Start from the second variable
                rowEnd = nColumn + 1;
            }
            // For each variable (row)
            for (let i = rowStart; i < rowEnd; i++) {
                const rowVar = testVariables[i];

                // Create rows for this variable
                const corrRow: any = { 
                    rowHeader: ["Spearman's rho"], 
                    var1: rowVar.name,
                    type: "Correlation Coefficient" 
                };

                let sigRow: any = null;
                if (options.testOfSignificance.twoTailed) {
                    sigRow = { 
                        rowHeader: ["Spearman's rho"], 
                        var1: rowVar.name,
                        type: "Sig. (2-tailed)" 
                    };
                } else if (options.testOfSignificance.oneTailed) {
                    sigRow = { 
                        rowHeader: ["Spearman's rho"], 
                        var1: rowVar.name,
                        type: "Sig. (1-tailed)" 
                    };
                }

                const nRow: any = { 
                    rowHeader: ["Spearman's rho"], 
                    var1: rowVar.name,
                    type: "N" 
                };

                // For each variable (column)
                for (let j = 0; j < nColumn; j++) {
                    const colVar = testVariables[j];

                    // Pengaruh: jika showOnlyTheLowerTriangle && !showDiagonal, skip semua sel di atas dan pada diagonal
                    if (options.showOnlyTheLowerTriangle && !options.showDiagonal && j >= i) {
                        continue;
                    }
                    // Jika showOnlyTheLowerTriangle dan showDiagonal, skip hanya di atas diagonal
                    if (options.showOnlyTheLowerTriangle && options.showDiagonal && j > i) {
                        continue;
                    }

                    // Find the correlation between these variables
                    const key1 = `${rowVar.name}-${colVar.name}`;
                    const key2 = `${colVar.name}-${rowVar.name}`;
                    const result = correlationMap.get(key1) || correlationMap.get(key2);

                    if (result && result.spearmanCorrelation) {
                        const spearman = result.spearmanCorrelation;

                        // Diagonal case (same variable)
                        // if (i === j) {
                        //     corrRow[`var_${j}`] = 1;
                        //     if (sigRow) sigRow[`var_${j}`] = "";
                        // } else {
                            // Check if either variable has insufficient data
                            const var1Metadata = results.metadata?.find(m => m.variableName === rowVar.name);
                            const var2Metadata = results.metadata?.find(m => m.variableName === colVar.name);
                            const hasInsufficientData = var1Metadata?.hasInsufficientData || var2Metadata?.hasInsufficientData;

                            if (hasInsufficientData) {
                                corrRow[`var_${j}`] = "";
                                if (sigRow) sigRow[`var_${j}`] = "";
                            } else {
                                corrRow[`var_${j}`] = formatCorrelationValue(spearman.Spearman, spearman.PValue, options);
                                if (sigRow) sigRow[`var_${j}`] = formatPValue(spearman.PValue);
                            }
                        // }

                        nRow[`var_${j}`] = spearman.N;
                    } else {
                        corrRow[`var_${j}`] = "";
                        if (sigRow) sigRow[`var_${j}`] = "";
                        nRow[`var_${j}`] = "";
                    }
                }

                // Hanya tambahkan baris jika setidaknya satu sel terisi (untuk lower triangle + no diagonal, beberapa baris bisa kosong)
                // Atau, selalu tambahkan untuk konsistensi
                table.rows.push(corrRow);
                if (sigRow) table.rows.push(sigRow);
                table.rows.push(nRow);
            }
        }
    }

    return table;
}

export function formatPartialCorrelationTable(
    results: BivariateResults,
    options: {
        testOfSignificance: {
            oneTailed: boolean,
            twoTailed: boolean
        },
        flagSignificantCorrelations: boolean,
        showOnlyTheLowerTriangle: boolean,
        showDiagonal: boolean,
        statisticsOptions: {
            meansAndStandardDeviations: boolean,
            crossProductDeviationsAndCovariances: boolean,
        },
    },
    testVariables: any[],
): BivariateTable {
    if (!results || !results.partialCorrelation || results.partialCorrelation.length === 0) {
        return {
            title: "Partial Correlation",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Multiple variables case
    const table: BivariateTable = {
        title: "Partial Correlation",
        columnHeaders: [
            { header: "Control Variables", key: "rowHeader" },
            { header: "", key: "var1" },
            { header: "", key: "type" }
        ],
        rows: []
    };

    // Add column headers for all test variables
    for (let i = 0; i < testVariables.length; i++) {
        table.columnHeaders.push({
            header: testVariables[i].label || testVariables[i].name,
            key: `var_${i}`
        });
    }

    // Find all unique control variables
    const controlVariables = new Set<string>();
    results.partialCorrelation.forEach(item => {
        if (item.controlVariable) {
            controlVariables.add(item.controlVariable);
        }
    });

    // For each control variable
    const controlVarArray = Array.from(controlVariables);
    for (const controlVar of controlVarArray) {
        // Filter results for this control variable
        const controlResults = results.partialCorrelation.filter(
            item => item.controlVariable === controlVar
        );

        // Get the variables that are NOT the control variable (these will be our rows)
        const nonControlVariables = testVariables.filter(v => v.name !== controlVar);

        // Create a mapping for easy access to results
        const resultMap = new Map();
        controlResults.forEach(item => {
            if (item.variable1 && item.variable2) {
                const key = `${item.variable1}-${item.variable2}`;
                resultMap.set(key, item);
            }
        });

        // For each non-control variable (row)
        for (let i = 0; i < nonControlVariables.length; i++) {
            const rowVar = nonControlVariables[i];
            
            // Create rows for this variable
            const corrRow: any = { 
                rowHeader: [controlVar], 
                var1: rowVar.name,
                type: "Correlation" 
            };
            
            let sigRow: any = null;
            if (options.testOfSignificance.twoTailed) {
                sigRow = { 
                    rowHeader: [controlVar], 
                    var1: rowVar.name,
                    type: "Sig. (2-tailed)" 
                };
            } else if (options.testOfSignificance.oneTailed) {
                sigRow = { 
                    rowHeader: [controlVar], 
                    var1: rowVar.name,
                    type: "Sig. (1-tailed)" 
                };
            }
            
            const dfRow: any = { 
                rowHeader: [controlVar], 
                var1: rowVar.name,
                type: "df" 
            };
            
            // For each test variable (column)
            for (let j = 0; j < testVariables.length; j++) {
                const colVar = testVariables[j];

                // Pengaruh: jika showOnlyTheLowerTriangle && !showDiagonal, skip semua sel di atas dan pada diagonal
                if (options.showOnlyTheLowerTriangle && !options.showDiagonal && j >= i) {
                    continue;
                }
                // Jika showOnlyTheLowerTriangle dan showDiagonal, skip hanya di atas diagonal
                if (options.showOnlyTheLowerTriangle && options.showDiagonal && j > i) {
                    continue;
                }
                
                // Check if control variable matches the test variable (diagonal case)
                const isControlVariable = controlVar === colVar.name;
                
                if (isControlVariable) {
                    // Control variable matches test variable - make cell empty
                    corrRow[`var_${j}`] = "";
                    if (sigRow) sigRow[`var_${j}`] = "";
                    dfRow[`var_${j}`] = "";
                } else if (rowVar.name === colVar.name) {
                    // Same variable (diagonal) - correlation = 1, df = 0
                    corrRow[`var_${j}`] = 1;
                    if (sigRow) sigRow[`var_${j}`] = "";
                    dfRow[`var_${j}`] = 0;
                } else {
                    // Find the correlation between these variables
                    const key1 = `${rowVar.name}-${colVar.name}`;
                    const key2 = `${colVar.name}-${rowVar.name}`;
                    const result = resultMap.get(key1) || resultMap.get(key2);
                    
                    if (result && result.partialCorrelation) {
                        const partialCorr = result.partialCorrelation;
                        
                        corrRow[`var_${j}`] = formatCorrelationValue(partialCorr.Correlation, partialCorr.PValue, options);
                        if (sigRow) sigRow[`var_${j}`] = formatPValue(partialCorr.PValue);
                        dfRow[`var_${j}`] = partialCorr.df;
                    } else {
                        corrRow[`var_${j}`] = "";
                        if (sigRow) sigRow[`var_${j}`] = "";
                        dfRow[`var_${j}`] = "";
                    }
                }
            }
            
            // Add the rows to the table
            table.rows.push(corrRow);
            if (sigRow) table.rows.push(sigRow);
            table.rows.push(dfRow);
        }
    }

    return table;
}

/**
 * Formats descriptive statistics table
 * @param results Bivariate analysis results
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable(
    results: BivariateResults, 
): BivariateTable {
    if (!results || !results.descriptiveStatistics || results.descriptiveStatistics.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: BivariateTable = {
        title: 'Descriptive Statistics',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: 'Mean', key: 'Mean' },
            { header: 'Std. Deviation', key: 'StdDev' },
            { header: 'N', key: 'N' }
        ],
        rows: []
    };

    // Process each result
    results.descriptiveStatistics.forEach((result) => {
        if (!result.variable) return;
        
        table.rows.push({
            rowHeader: [result.variable],
            Mean: formatNumber(result.Mean, 3),
            StdDev: formatNumber(result.StdDev, 3),
            N: result.N
        });
    });

    return table;
}

/**
 * Formats number with specified precision
 * @param value Number to format
 * @param precision Decimal precision
 * @returns Formatted number
 */
export const formatNumber = (value: number | null | undefined, precision: number) => {
    if (value === null || value === undefined) return null;
    return value.toFixed(precision);
};

export const formatCorrelationValue = (value: number | null | undefined, pValue: number | null | undefined, options: { flagSignificantCorrelations: boolean }) => {
    if (value === null || value === undefined) return null;
    if (value === 1) return 1;
    if (options.flagSignificantCorrelations) {
        if (!pValue || pValue < 0.01) {
            return `${value.toFixed(3)} **`;
        } else if (pValue && pValue < 0.05) {
            return `${value.toFixed(3)} *`;
        } else {
            return `${value.toFixed(3)}`;
        }
    } else {
        return `${value.toFixed(3)}`;
    }
};

/**
 * Formats p-value with appropriate notation
 * @param pValue P-value to format
 * @returns Formatted p-value
 */
export const formatPValue = (pValue: number | null | undefined) => {
    if (pValue === null || pValue === undefined) return null;
    
    if (pValue < 0.001) {
        return '<.001';
    } else {
        return `${pValue.toFixed(3)}`;
    }
};

/**
 * Formats degrees of freedom
 * @param df Degrees of freedom
 * @returns Formatted degrees of freedom
 */
export const formatDF = (df: number | null | undefined) => {
    if (df === null || df === undefined) return null;
    if (Number.isInteger(df)) {
        return df;
    } else {
        return df.toFixed(3);
    }
};