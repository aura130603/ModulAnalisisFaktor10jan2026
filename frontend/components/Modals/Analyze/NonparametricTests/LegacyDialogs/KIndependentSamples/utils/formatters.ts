import {
    KIndependentSamplesTestResults,
    KIndependentSamplesTestResult,
    KIndependentSamplesTestTable,
    TableColumnHeader,
    TableRow,
    Ranks,
    KruskalWallisHTestStatistics,
    Frequencies,
    MedianTestStatistics,
    JonckheereTerpstraTest,
    DescriptiveStatistics,
    DisplayStatisticsOptions,
} from '../types';

/**
 * Formats ranks table for K Independent Samples
 * @param results Array of test results and descriptive statistics
 * @param groupingVariable Name of the grouping variable
 * @returns Formatted table
 */
export function formatRanksTable(
    results: any[],
    groupingVariable: string,
): KIndependentSamplesTestTable {
    if (!results || results.length === 0) {
        return {
            title: "Ranks",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Filter only test results (those with ranks)
    const testResults = results.filter(result => result.ranks);
    
    if (testResults.length === 0) {
        return {
            title: "Ranks",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    let columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: groupingVariable, key: "groupingVariable" },
        { header: "N", key: "N" },
        { header: "Mean Rank", key: "MeanRank" }
    ];

    const rows: TableRow[] = [];
    testResults.forEach((result) => {
        const { variable1, ranks, metadata } = result;
        if (!variable1 || !ranks || metadata?.insufficientType?.includes("empty")) return;

        const { groups } = ranks;
        if (!groups) return;
        
        groups.forEach((group: any) => {
            // Skip the "Total" row as it's not needed in the display
            // if (group.value === "Total") return;
            
            rows.push({
                rowHeader: [variable1.label || variable1.name, group.label],
                groupingVariable: group.label,
                N: group.N,
                MeanRank: group.meanRank !== undefined ? +group.meanRank?.toFixed(2) : undefined
            });
        });
    });

    return {
        title: "Ranks",
        columnHeaders,
        rows
    };
}

/**
 * Formats Kruskal-Wallis H test statistics table
 * @param results Array of test results and descriptive statistics
 * @returns Formatted table
 */
export function formatKruskalWallisHTestStatisticsTable(
    results: any[]
): KIndependentSamplesTestTable {
    if (!results || results.length === 0) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Filter only test results (those with testStatisticsKruskalWallisH)
    const testResults = results.filter(result => result.testStatisticsKruskalWallisH);
    
    if (testResults.length === 0) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Multiple variables case
    const table: KIndependentSamplesTestTable = {
        title: "Test Statistics",
        columnHeaders: [{ header: "", key: "rowHeader" }],
        rows: []
    };

    // Add column headers for each variable (only once for the rowHeader)
    if (testResults && testResults.length > 0) {
        // Add a column for each variable
        testResults.forEach((result, index) => {
            if (result && result.variable1) {
                table.columnHeaders.push({
                    header: result.variable1.label || result.variable1.name || `Variable ${index + 1}`,
                    key: `var_${index}`
                });
            }
        });

        const HRow: TableRow = { rowHeader: ["Kruskal-Wallis H"] };
        const dfRow: TableRow = { rowHeader: ["df"] };
        const pValueRow: TableRow = { rowHeader: ["Asymp. Sig."] };
        testResults.forEach((result, index) => {
            const stats = result.testStatisticsKruskalWallisH;
            const key = `var_${index}`;
            HRow[key] = formatNumber(stats.H, 3);
            dfRow[key] = formatNumber(stats.df, 3);
            pValueRow[key] = formatPValue(stats.pValue);
        });

        // Add rows to table
        table.rows.push(HRow, dfRow, pValueRow);
    }

    return table;
}

/**
 * Formats test statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
// export function formatFrequenciesTable (
//     results: KIndependentSamplesTestResults
// ): KIndependentSamplesTestTable {
//     if (!results || !results.frequencies || results.frequencies.length === 0) {
//         return {
//             title: "Frequencies",
//             columnHeaders: [{ header: "No Data", key: "noData" }],
//             rows: []
//         };
//     }
//     // Multiple variables case
//     const table: KIndependentSamplesTestTable = {
//         title: "Frequencies",
//         columnHeaders: [
//             { header: "", key: "rowHeader" },
//             { header: "", key: "MedianGroup" }
//         ],
//         rows: []
//     };

//     // Add column headers for each variable (only once for the rowHeader)
//     if (results.frequencies && results.frequencies.length > 0) {
//         // Add a column for each variable
//         results.frequencies.forEach((result, index) => {
//             if (result && result.variable) {
//                 table.columnHeaders.push(
//                     {
//                         header: result.groups[index].label,
//                         key: `group_${index}`
//                     }
//                 );
//             }
//         });

//         const UpMedianRow: TableRow = {};
//         const DownMedianRow: TableRow = {};

//         results.variable.forEach((result, varIndex) => {
//             UpMedianRow[`var_${varIndex}`] = { rowHeader: result.variable.label || result.variable.name || `Variable ${varIndex + 1}`, MedianGroup: "> Median" };
//             DownMedianRow[`var_${varIndex}`] = { rowHeader: result.variable.label || result.variable.name || `Variable ${varIndex + 1}`, MedianGroup: "<= Median" };
//         }

//         results.frequencies.forEach((result, varIndex) => {
//             const stats = result.frequencies as Frequencies;
//             const key = `var_${varIndex}`;
//             UpMedianRow[key] = formatNumber(stats.UpMedian, 3);
//             DownMedianRow[key] = formatNumber(stats.DownMedian, 3);
//         });

//         // Tambahkan baris ke tabel
//         table.rows.push(UpMedianRow, DownMedianRow);
//     }

//     return table;
// }

// /**
//  * Formats test statistics table
//  * @param results Chi Square results
//  * @returns Formatted table
//  */
// export function formatMedianTestStatisticsTable (
//     results: KIndependentSamplesTestResults
// ): KIndependentSamplesTestTable {
//     if (!results || !results.testStatisticsMedian || results.testStatisticsMedian.length === 0) {
//         return {
//             title: "Test Statistics",
//             columnHeaders: [{ header: "No Data", key: "noData" }],
//             rows: []
//         };
//     }
//     // Multiple variables case
//     const table: KIndependentSamplesTestTable = {
//         title: "Test Statistics",
//         columnHeaders: [
//             { header: "", key: "rowHeader" },
//             { header: "", key: "Difference" }
//         ],
//         rows: []
//     };
    
//     // Benahi: Format the Mann-Whitney U test statistics table properly

//     // Add column headers for each variable (only once for the rowHeader)
//     if (results.testStatisticsMedian && results.testStatisticsMedian.length > 0) {
//         // Add a column for each variable
//         results.testStatisticsMedian.forEach((result, index) => {
//             if (result && result.variable) {
//                 table.columnHeaders.push({
//                     header: result.variable.label || result.variable.name || `Variable ${index + 1}`,
//                     key: `var_${index}`
//                 });
//             }
//         });

//         const NRow: TableRow = { rowHeader: ["N"] };
//         const MedianRow: TableRow = { rowHeader: ["Median"] };
//         const ChiSquareRow: TableRow = { rowHeader: ["Chi-Square"] };
//         const dfRow: TableRow = { rowHeader: ["df"] };
//         const pValueRow: TableRow = { rowHeader: ["Asymp. Sig."] };
        
//         results.testStatisticsMedian.forEach((result, varIndex) => {
//             const stats = result.testStatisticsMedian as MedianTestStatistics;
//             const key = `var_${varIndex}`;
//             NRow[key] = formatNumber(stats.N, 3);
//             MedianRow[key] = formatNumber(stats.Median, 3);
//             ChiSquareRow[key] = formatNumber(stats.ChiSquare, 3);
//             dfRow[key] = formatNumber(stats.df, 3);
//             pValueRow[key] = formatPValue(stats.pValue);
//         });

//         // Tambahkan baris ke tabel
//         table.rows.push(NRow, MedianRow, ChiSquareRow, dfRow, pValueRow);
//     }

//     return table;
// }

// /**
//  * Formats test statistics table
//  * @param results Chi Square results
//  * @returns Formatted table
//  */
// export function formatJonckheereTerpstraTestTable (
//     results: KIndependentSamplesTestResults,
//     groupingVariable: string
// ): KIndependentSamplesTestTable {
//     if (!results || !results.jonckheereTerpstraTest || results.jonckheereTerpstraTest.length === 0) {
//         return {
//             title: "Jonckheere Terpstra Test",
//             columnHeaders: [{ header: "No Data", key: "noData" }],
//             rows: []
//         };
//     }
//     // Multiple variables case
//     const table: KIndependentSamplesTestTable = {
//         title: "Jonckheere Terpstra Test",
//         columnHeaders: [{ header: "", key: "rowHeader" }],
//         rows: []
//     };

//     // Add column headers for each variable (only once for the rowHeader)
//     if (results.jonckheereTerpstraTest && results.jonckheereTerpstraTest.length > 0) {
//         // Add a column for each variable
//         results.jonckheereTerpstraTest.forEach((result, index) => {
//             if (result && result.variable) {
//                 table.columnHeaders.push({
//                     header: result.variable.label || result.variable.name || `Variable ${index + 1}`,
//                     key: `var_${index}`
//                 });
//             }
//         });

//         const GroupRow: TableRow = { rowHeader: [`Number of Levels in ${groupingVariable}`] };
//         const NRow: TableRow = { rowHeader: ["N"] };
//         const ObservedJTRow: TableRow = { rowHeader: ["Observed J-T Statistic"] };
//         const MeanJTRow: TableRow = { rowHeader: ["Mean J-T Statistic"] };
//         const StdDeviationJTRow: TableRow = { rowHeader: ["Std. Deviation of J-T Statistic"] };
//         const StdJTRow: TableRow = { rowHeader: ["Std. J-T Statistic"] };
//         const pValueRow: TableRow = { rowHeader: ["Asymp. Sig. (2-tailed)"] };
        
//         results.jonckheereTerpstraTest.forEach((result, varIndex) => {
//             const stats = result.jonckheereTerpstraTest as JonckheereTerpstraTest;
//             const key = `var_${varIndex}`;
//             GroupRow[key] = formatNumber(stats.N, 3);
//             NRow[key] = formatNumber(stats.N, 3);
//             ObservedJTRow[key] = formatNumber(stats.ObservedJTStatistic, 3);
//             MeanJTRow[key] = formatNumber(stats.MeanJTStatistic, 3);
//             StdDeviationJTRow[key] = formatNumber(stats.StdDeviationJTStatistic, 3);
//             StdJTRow[key] = formatNumber(stats.StdJTStatistic, 3);
//             pValueRow[key] = formatPValue(stats.pValue);
//         });

//         // Tambahkan baris ke tabel
//         table.rows.push(GroupRow, NRow, ObservedJTRow, MeanJTRow, StdDeviationJTRow, StdJTRow, pValueRow);
//     }

//     return table;
// }

/**
 * Formats descriptive statistics table
 * @param results Array of test results and descriptive statistics
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable (
    results: any[],
    displayStatistics?: DisplayStatisticsOptions
): KIndependentSamplesTestTable {
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
    
    const table: KIndependentSamplesTestTable = {
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
            rowHeader: [variable.name],
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