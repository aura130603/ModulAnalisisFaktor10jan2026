import {
    TwoRelatedSamplesResults,
    TwoRelatedSamplesResult,
    TwoRelatedSamplesTable,
    TableColumnHeader,
    TableRow,
    RanksFrequencies,
    TestStatistics,
    DescriptiveStatistics,
    DisplayStatistics,
} from '../types';

/**
 * Formats frequencies table for data without specified range
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatRanksFrequenciesTable(
    results: any[],
    testType: string
): TwoRelatedSamplesTable {
    let title = "Frequencies";
    
    if (!results || results.length === 0) {
        return {
            title: title,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Filter only test results (not descriptive statistics)
    const testResults = results.filter(result => result.ranksFrequencies && !result.descriptiveStatistics);
    
    if (testResults.length === 0) {
        return {
            title: title,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    let columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "", key: "type" },
        { header: "N", key: "N" }
    ];

    if (testType === "WILCOXON") {
        title = "Ranks";
        columnHeaders.push(
            { header: "Mean Rank", key: "MeanRank" },
            { header: "Sum of Ranks", key: "SumRanks" }
        );
    }

    const rows: TableRow[] = [];
    testResults.forEach((result) => {
        const { variable1, variable2, ranksFrequencies, metadata } = result;
        if (!variable1 || !variable2 || !ranksFrequencies || metadata?.hasInsufficientData && metadata.insufficientType.includes('empty')) return;

        const { negative, positive, ties, total } = ranksFrequencies as RanksFrequencies;

        const label= `${variable1.label || variable1.name} - ${variable2.label || variable2.name}`;
        const decimals = Math.max(variable1.decimals || 0, variable2.decimals || 0);
        // For M-W, show Mean Rank and Sum of Ranks; for K-S, just N
        if (testType === "WILCOXON") {
            rows.push({
                rowHeader: [label],
                type: "Negative Ranks",
                N: negative.N,
                MeanRank: negative.MeanRank !== undefined ? formatNumber(negative.MeanRank, decimals + 2) : undefined,
                SumRanks: negative.SumOfRanks !== undefined ? formatNumber(negative.SumOfRanks, decimals + 2) : undefined
            });
            rows.push({
                rowHeader: [label],
                type: "Positive Ranks",
                N: positive.N,
                MeanRank: positive.MeanRank !== undefined ? formatNumber(positive.MeanRank, decimals + 2) : undefined,
                SumRanks: positive.SumOfRanks !== undefined ? formatNumber(positive.SumOfRanks, decimals + 2) : undefined
            });
            rows.push({
                rowHeader: [label],
                type: "Ties",
                N: ties.N
            });
            rows.push({
                rowHeader: [label],
                type: "Total",
                N: total.N
            });
        } else {
            // For SIGN, just show N per group
            rows.push({
                rowHeader: [label],
                type: "Negative Differences",
                N: negative.N
            });
            rows.push({
                rowHeader: [label],
                type: "Positive Differences",
                N: positive.N
            });
            rows.push({
                rowHeader: [label],
                type: "Ties",
                N: ties.N
            });
            rows.push({
                rowHeader: [label],
                type: "Total",
                N: total.N
            });
        }
    });

    return {
        title,
        columnHeaders,
        rows
    };
}

/**
 * Formats test statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatTestStatisticsTable (
    results: any[],
    testType: string
): TwoRelatedSamplesTable {
    if (!results || results.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Filter only test results (not descriptive statistics)
    const testResults = results.filter(result => 
        (result.testStatisticsWilcoxon || result.testStatisticsSign) && 
        !result.descriptiveStatistics
    );
    
    if (testResults.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: TwoRelatedSamplesTable = {
        title: 'Test Statistics',
        columnHeaders: [{ header: '', key: 'rowHeader' }],
        rows: []
    };

    // Add column headers for each variable
    if (testType === "WILCOXON" || testType === "SIGN") {
        const zRow: TableRow = { rowHeader: ["Z"] };
        const pValueRow: TableRow = { rowHeader: ["P Value"] };

        if (testType === "WILCOXON") {
            testResults.forEach((result, index) => {
                if (result && result.variable1 && result.variable2 && result.testStatisticsWilcoxon && !result.metadata?.insufficientType.includes('empty')) {
                    const stats = result.testStatisticsWilcoxon as TestStatistics;

                    table.columnHeaders.push({
                        header: `${result.variable1.label || result.variable1.name} - ${result.variable2.label || result.variable2.name}`,
                        key: `var_${index}`
                    });
                    zRow[`var_${index}`] = formatNumber(stats.zValue, 3);
                    pValueRow[`var_${index}`] = formatPValue(stats.pValue);
                }
            });
        }

        if (testType === "SIGN") {
            testResults.forEach((result, index) => {
                if (result && result.variable1 && result.variable2 && result.testStatisticsSign && !result.metadata?.insufficientType.includes('empty')) {
                    const stats = result.testStatisticsSign as TestStatistics;
                    table.columnHeaders.push({
                        header: `${result.variable1.label || result.variable1.name} - ${result.variable2.label || result.variable2.name}`,
                        key: `var_${index}`
                    });
                    zRow[`var_${index}`] = formatNumber(stats.zValue, 3);
                    pValueRow[`var_${index}`] = formatPValue(stats.pValue);
                }
            });
        }

        table.rows.push(zRow, pValueRow);
    }
    return table;
}

/**
 * Formats descriptive statistics table
 * @param results Array of test results and descriptive statistics
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable (
    results: any[],
    displayStatistics?: DisplayStatistics
): TwoRelatedSamplesTable {
    if (!results || results.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Filter only descriptive statistics results
    const descriptiveResults = results.filter(result => result.descriptiveStatistics);
    
    if (descriptiveResults.length === 0) {
        return {
            title: "No Descriptive Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: TwoRelatedSamplesTable = {
        title: 'Descriptive Statistics',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: 'N', key: 'N' }
        ],
        rows: []
    };

    if (displayStatistics?.descriptive) {
        table.columnHeaders.push(
            { header: 'Mean', key: 'Mean' },
            { header: 'Std. Deviation', key: 'StdDev' },
            { header: 'Minimum', key: 'Min' },
            { header: 'Maximum', key: 'Max' }
        );
    }

    if (displayStatistics?.quartiles) {
        table.columnHeaders.push(
            { header: "25th", key: "Percentile25" },
            { header: "50th (Median)", key: "Percentile50" },
            { header: "75th", key: "Percentile75" }
        );
    }

    // Process each descriptive statistics result
    descriptiveResults.forEach((result) => {
        const stats = result.descriptiveStatistics;
        const variable = stats.variable1;
        const decimals = variable.decimals || 0;
        
        const row: any = {
            rowHeader: [variable.label || variable.name],
            N: stats.N1,
        };
        
        if (displayStatistics?.descriptive) {
            row.Mean = formatNumber(stats.Mean1, decimals + 2);
            row.StdDev = formatNumber(stats.StdDev1, decimals + 3);
            row.Min = formatNumber(stats.Min1, decimals);
            row.Max = formatNumber(stats.Max1, decimals);
        }
        
        if (displayStatistics?.quartiles) {
            row.Percentile25 = formatNumber(stats.Percentile25_1, decimals);
            row.Percentile50 = formatNumber(stats.Percentile50_1, decimals);
            row.Percentile75 = formatNumber(stats.Percentile75_1, decimals);
        }
        
        table.rows.push(row);
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