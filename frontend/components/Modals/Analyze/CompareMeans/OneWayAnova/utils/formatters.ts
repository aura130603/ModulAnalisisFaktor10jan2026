import { 
    OneWayAnovaResult, 
    OneWayAnovaTable, 
    TableColumnHeader, 
    TableRow, 
    MultipleComparisons,
    HomogeneousSubsets,
    OneWayAnova
} from '../types';
import { Variable } from '@/types/Variable';

/**
 * Formats the ANOVA table
 * @param results Array of OneWayAnova results for each variable
 * @returns Formatted table
 */
export function formatOneWayAnovaTable(
    results: OneWayAnovaResult[]
): OneWayAnovaTable {
    if (!results || results.length === 0) {
        return {
            title: "ANOVA",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneWayAnovaTable = {
        title: 'ANOVA',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: '', key: 'type' },
            { header: 'Sum of Squares', key: 'SumOfSquares' },
            { header: 'df', key: 'df' },
            { header: 'Mean Square', key: 'MeanSquare' },
            { header: 'F', key: 'F' },
            { header: 'Sig.', key: 'Sig' }
        ],
        rows: []
    };

    // Process each result
    results.forEach((result) => {
        const { variable1, oneWayAnova, metadata } = result;
        const { SumOfSquares, df, MeanSquare, F, Sig, withinGroupsSumOfSquares, withinGroupsDf, withinGroupsMeanSquare, totalSumOfSquares, totalDf } = oneWayAnova as OneWayAnova;
        const decimals = variable1.decimals;

        // Between Groups row
        if (metadata?.insufficientType?.includes('allDeviationsConstant')) {
            table.rows.push({
                rowHeader: [variable1.label || variable1.name],
                type: 'Between Groups',
                SumOfSquares: formatNumber(SumOfSquares, decimals + 3),
                df: df,
                MeanSquare: formatNumber(MeanSquare, decimals + 3),
            });
        } else {
            table.rows.push({
                rowHeader: [variable1.label || variable1.name],
                type: 'Between Groups',
                SumOfSquares: formatNumber(SumOfSquares, decimals + 3),
                df: df,
                MeanSquare: formatNumber(MeanSquare, decimals + 3),
                F: formatNumber(F, decimals + 3),
                Sig: formatPValue(Sig)
            });
        }

        // Within Groups row (assuming these values are available)
        table.rows.push({
            rowHeader: [variable1.label || variable1.name],
            type: 'Within Groups',
            SumOfSquares: formatNumber(withinGroupsSumOfSquares, decimals + 3),
            df: withinGroupsDf,
            MeanSquare: formatNumber(withinGroupsMeanSquare, decimals + 3)
        });

        // Total row
        table.rows.push({
            rowHeader: [variable1.label || variable1.name],
            type: 'Total',
            SumOfSquares: formatNumber(totalSumOfSquares, decimals + 3),
            df: totalDf
        });
    });

    return table;
}

/**
 * Formats the descriptive statistics table
 * @param results Array of OneWayAnova results for each variable
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable(
    results: OneWayAnovaResult[]
): OneWayAnovaTable {
    if (!results || results.length === 0) {
        return {
            title: "Descriptives",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneWayAnovaTable = {
        title: 'Descriptives',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: '', key: 'factor' },
            { header: 'N', key: 'N' },
            { header: 'Mean', key: 'Mean' },
            { header: 'Std. Deviation', key: 'StdDeviation' },
            { header: 'Std. Error', key: 'StdError' },
            { 
                header: '95% Confidence Interval for Mean', 
                key: 'CI',
                children: [
                    { header: 'Lower Bound', key: 'LowerBound' },
                    { header: 'Upper Bound', key: 'UpperBound' }
                ]
            },
            { header: 'Minimum', key: 'Minimum' },
            { header: 'Maximum', key: 'Maximum' }
        ],
        rows: []
    };

    // Process each variable's descriptive statistics
    results.forEach((result) => {

        const { variable1, descriptives, metadata } = result;
        if (metadata?.hasInsufficientData && metadata.insufficientType.includes('fewerThanTwoGroups')) {
            return;
        }

        const variableName = variable1.label || variable1.name;
        const decimals = variable1.decimals;

        // Check if descriptives is an array (new format)
        if (Array.isArray(descriptives)) {
            // New format - array of descriptives
            descriptives.forEach((stat) => {
                table.rows.push({
                    rowHeader: [variableName],
                    factor: stat.factor,
                    N: stat.N,
                    Mean: formatNumber(stat.Mean, decimals + 2),
                    StdDeviation: formatNumber(stat.StdDeviation, decimals + 3),
                    StdError: formatNumber(stat.StdError, decimals + 3),
                    LowerBound: formatNumber(stat.LowerBound, decimals + 2),
                    UpperBound: formatNumber(stat.UpperBound, decimals + 2),
                    Minimum: formatNumber(stat.Minimum, decimals),
                    Maximum: formatNumber(stat.Maximum, decimals)
                });
            });
        }
    });

    return table;
}

/**
 * Formats the homogeneity of variance table
 * @param results Array of OneWayAnova results for each variable
 * @returns Formatted table
 */
export function formatHomogeneityOfVarianceTable(
    results: OneWayAnovaResult[]
): OneWayAnovaTable {
    if (!results || results.length === 0) {
        return {
            title: "Test of Homogeneity of Variances",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneWayAnovaTable = {
        title: 'Test of Homogeneity of Variances',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: '', key: 'type' },
            { header: 'Levene Statistic', key: 'LeveneStatistic' },
            { header: 'df1', key: 'df1' },
            { header: 'df2', key: 'df2' },
            { header: 'Sig.', key: 'Sig' },
        ],
        rows: []
    };

    // Process each variable's homogeneity of variance statistics
    results.forEach((result) => {
        const { variable1, homogeneityOfVariances } = result;
        const variableName = variable1.label || variable1.name;
        const decimals = variable1.decimals;

        // Check if homogeneityOfVariances is an array (new format)
        if (Array.isArray(homogeneityOfVariances)) {
            // New format - array of homogeneity of variances
            homogeneityOfVariances.forEach((stat) => {
                table.rows.push({
                    rowHeader: [variableName],
                    type: stat.type,
                    LeveneStatistic: formatNumber(stat.LeveneStatistic, decimals + 3),
                    df1: formatDF(stat.df1),
                    df2: formatDF(stat.df2),
                    Sig: formatPValue(stat.Sig)
                });
            });
        } else if (homogeneityOfVariances) {
            // Handle single object case if needed
            const { type, LeveneStatistic, df1, df2, Sig } = homogeneityOfVariances;
            
            table.rows.push({
                rowHeader: [variableName],
                type: type,
                LeveneStatistic: formatNumber(LeveneStatistic, decimals + 3),
                df1: formatDF(df1),
                df2: formatDF(df2),
                Sig: formatPValue(Sig)
            });
        }
    });

    return table;
}

/**
 * Formats the multiple comparisons table
 * @param results Array of OneWayAnova results for each variable
 * @returns Formatted table
 */
export function formatMultipleComparisonsTable(
    results: OneWayAnovaResult[],
    factorLabel: string
): OneWayAnovaTable {
    if (!results || results.length === 0) {
        return {
            title: "Multiple Comparisons",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneWayAnovaTable = {
        title: 'Multiple Comparisons',
        columnHeaders: [
            { header: 'Dependent Variable', key: 'rowHeader' },
            { header: `(I) ${factorLabel}`, key: 'factor1' },
            { header: `(J) ${factorLabel}`, key: 'factor2' },
            { header: 'Mean Difference (I-J)', key: 'meanDifference' },
            { header: 'Std. Error', key: 'stdError' },
            { header: 'Sig.', key: 'Sig' },
            { header: '95% Confidence Interval', key: 'confidenceInterval', children: [
                { header: 'Lower Bound', key: 'lowerBound' },
                { header: 'Upper Bound', key: 'upperBound' }
            ] }
        ],
        rows: []
    };

    // Process each variable's multiple comparisons
    results.forEach((result) => {
        const { variable1, multipleComparisons, metadata } = result;
        if (metadata?.hasInsufficientData) {
            return;
        }
        const variableName = variable1.label || variable1.name;
        const decimals = variable1.decimals || 3;

        // Check if multipleComparisons is an array (new format)
        if (Array.isArray(multipleComparisons)) {
            // New format - array of multiple comparisons
            multipleComparisons.forEach((comparison) => {
                const { factor1, factor2, meanDifference, stdError, Sig, lowerBound, upperBound } = comparison;
                
                table.rows.push({
                    rowHeader: [variableName],
                    factor1: factor1,
                    factor2: factor2,
                    meanDifference: formatNumber(meanDifference, decimals),
                    stdError: formatNumber(stdError, decimals),
                    Sig: formatPValue(Sig),
                    lowerBound: formatNumber(lowerBound, decimals),
                    upperBound: formatNumber(upperBound, decimals)
                });
            });
        }
    });

    return table;
}

/**
 * Formats the homogeneous subsets table
 * @param results Array of OneWayAnova results for each variable
 * @param index Index of the variable in the results
 * @param variable Variable to format
 * @returns Formatted table
 */
export function formatHomogeneousSubsetsTable(
    results: OneWayAnovaResult,
    factorLabel: string,
    variable: Variable
): OneWayAnovaTable {
    if (!results) {
        return {
            title: variable.label || variable.name,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    // Find the result for this specific variable
    const variableResult = results;

    if (!variableResult || !variableResult.homogeneousSubsets) {
        return {
            title: variable.label || variable.name,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    // Handle both single object and array cases
    const homogeneousSubsetsArray = Array.isArray(variableResult.homogeneousSubsets) 
        ? variableResult.homogeneousSubsets 
        : [variableResult.homogeneousSubsets];

    if (homogeneousSubsetsArray.length === 0) {
        return {
            title: variable.label || variable.name,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    // mencari subsetCount terbesar
    const maxSubset = Math.max(...homogeneousSubsetsArray.map(v => v.subsetCount || 1));

    // Determine the number of subsets
    const numSubsets = maxSubset || 1;

    // Create column headers based on the number of subsets
    const subsetHeaders: TableColumnHeader[] = [];
    for (let i = 1; i <= numSubsets; i++) {
        subsetHeaders.push({ header: i.toString(), key: `subset${i}` });
    }

    const table: OneWayAnovaTable = {
        title: variable.label || variable.name,
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: factorLabel, key: 'factor' },
            { header: 'N', key: 'N' },
            { 
                header: 'Subset for alpha = 0.05',
                key: 'subsets',
                children: subsetHeaders
            }
        ],
        rows: []
    };

    // Process homogeneous subsets for this variable
    if (homogeneousSubsetsArray.length > 0) {
        // Process each homogeneous subset item directly
        for (const subsetItem of homogeneousSubsetsArray as any[]) {
            const method = subsetItem.method;
            const output = subsetItem.output;
            
            if (!method || !output || !Array.isArray(output)) continue;

            // Pisahkan factor rows dan sig rows
            const factorItems = output.filter(item => item.factor !== 'Sig.');
            const sigItems = output.filter(item => item.factor === 'Sig.');

            for (const item of factorItems) {
                const row: TableRow = {
                    rowHeader: [method],
                    factor: item.factor,
                    N: item.N !== undefined && item.N !== null ? item.N.toString() : undefined
                };

                // Untuk setiap subset, jika ada value, masukkan
                for (let i = 1; i <= numSubsets; i++) {
                    const subsetKey = `subset${i}`;
                    if (item[subsetKey] !== undefined) {
                        row[subsetKey] = formatNumber(item[subsetKey], variable.decimals + 2);
                    }
                }

                table.rows.push(row);
            }

            // Tambahkan row untuk Sig. jika ada
            if (sigItems.length > 0) {
                const sigRow: TableRow = {
                    rowHeader: [method],
                    factor: 'Sig.'
                };
                
                // --- PERBAIKAN DIMULAI ---
                // Logika disederhanakan, karena hanya ada satu item 'Sig.' per metode.
                const sigItem = sigItems[0];
                for (let i = 1; i <= numSubsets; i++) {
                    const subsetKey = `subset${i}`;
                    if (sigItem[subsetKey] !== undefined) {
                        sigRow[subsetKey] = formatPValue(sigItem[subsetKey]);
                    }
                }
                // --- PERBAIKAN SELESAI ---

                table.rows.push(sigRow);
            }
        }
    }

    // console.log("formattedHomogeneousSubsetsTable", JSON.stringify(table));
    return table;
}

export function formatErrorTable() {
    return {
        title: "",
        columnHeaders: [{ header: "No Data", key: "noData" }],
        rows: []
    };
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
        return pValue.toFixed(3);
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

/**
 * Formats error message
 * @param error Error message
 * @returns Formatted error message
 */
export const formatErrorMessage = (error: string): string => {
    return `Error: ${error}`;
};