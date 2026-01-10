import {
    TwoIndependentSamplesTestResults,
    TwoIndependentSamplesTestTable,
    TableColumnHeader,
    TableRow,
    FrequenciesRanks,
    MannWhitneyUTestStatistics,
    KolmogorovSmirnovZTestStatistics,
    DescriptiveStatistics,
    DisplayStatisticsOptions,
    TwoIndependentSamplesTestResult,
} from '../types';

/**
 * Formats frequencies table for data without specified range
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatFrequenciesRanksTable(
    results: TwoIndependentSamplesTestResult[],
    groupingVariable: string,
    testType: string
): TwoIndependentSamplesTestTable {
    let title = "Frequencies";
    
    if (!results || results.length === 0) {
        return {
            title: title,
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    let columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: groupingVariable, key: "groupingVariable" },
        { header: "N", key: "N" }
    ];

    if (testType === "M-W") {
        title = "Ranks";
        columnHeaders.push(
            { header: "Mean Rank", key: "MeanRank" },
            { header: "Sum of Ranks", key: "SumRanks" }
        );
    }

    const rows: TableRow[] = [];
    results.forEach((result) => {
        const { variable1, variable2, frequenciesRanks, metadata } = result;
        if (!variable1 || !variable2 || !frequenciesRanks || metadata?.insufficentType.includes("empty")) return;

        const { group1, group2 } = frequenciesRanks as FrequenciesRanks;
        if (!group1 || !group2) return;

        // For M-W, show Mean Rank and Sum of Ranks; for K-S, just N
        if (testType === "M-W") {
            rows.push({
                rowHeader: [variable1.label || variable1.name, group1.label],
                groupingVariable: group1.label,
                N: group1.N,
                MeanRank: group1.MeanRank !== undefined ? +group1.MeanRank?.toFixed(2) : undefined,
                SumRanks: group1.SumRanks !== undefined ? +group1.SumRanks?.toFixed(2) : undefined
            });
            rows.push({
                rowHeader: [variable1.label || variable1.name, group2.label],
                groupingVariable: group2.label,
                N: group2.N,
                MeanRank: group2.MeanRank !== undefined ? +group2.MeanRank?.toFixed(2) : undefined,
                SumRanks: group2.SumRanks !== undefined ? +group2.SumRanks?.toFixed(2) : undefined
            });
        } else {
            // For K-S, just show N per group
            rows.push({
                rowHeader: [variable1.label || variable1.name, group1.label],
                groupingVariable: group1.label,
                N: group1.N
            });
            rows.push({
                rowHeader: [variable1.label || variable1.name, group2.label],
                groupingVariable: group2.label,
                N: group2.N
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
 * Formats frequencies table for data with specified range
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatMannWhitneyUTestStatisticsTable(
    results: TwoIndependentSamplesTestResult[]
): TwoIndependentSamplesTestTable {
    if (!results || results.length === 0) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    // Multiple variables case
    const table: TwoIndependentSamplesTestTable = {
        title: "Test Statistics",
        columnHeaders: [{ header: "", key: "rowHeader" }],
        rows: []
    };

    // Add column headers for each variable (only once for the rowHeader)
    if (results.length > 0) {
        // Add a column for each variable
        results.forEach((result, index) => {
            if (result && result.variable1) {
                table.columnHeaders.push({
                    header: result.variable1.label || result.variable1.name || `Variable ${index + 1}`,
                    key: `var_${index}`
                });
            }
        });

        const URow: TableRow = { rowHeader: ["Mann-Whitney U"] };
        const WRow: TableRow = { rowHeader: ["Wilcoxon W"] };
        const ZRow: TableRow = { rowHeader: ["Z"] };
        const pValueRow: TableRow = { rowHeader: ["Asymp. Sig. (2-tailed)"] };
        let hasExact = false;
        results.forEach((result) => {
            const stats = result.testStatisticsMannWhitneyU as MannWhitneyUTestStatistics;
            if (stats && stats.showExact) {
                hasExact = true;
            }
        });

        // Jika ada, siapkan baris pExactRow
        let pExactRow: TableRow | undefined = undefined;
        if (hasExact) {
            pExactRow = { rowHeader: ["Exact Sig. [2*(1-tailed Sig.)]"] };
        }

        results.forEach((result, varIndex) => {
            const stats = result.testStatisticsMannWhitneyU as MannWhitneyUTestStatistics;
            const key = `var_${varIndex}`;
            URow[key] = formatNumber(stats.U, 3);
            WRow[key] = formatNumber(stats.W, 3);
            ZRow[key] = formatNumber(stats.Z, 3);
            pValueRow[key] = formatPValue(stats.pValue);
            if (hasExact && pExactRow) {
                pExactRow[key] = formatPValue(stats.pExact);
            }
        });

        // Tambahkan baris ke tabel
        table.rows.push(URow, WRow, ZRow, pValueRow);
        if (hasExact && pExactRow) {
            table.rows.push(pExactRow);
        }
    }

    return table;
}

/**
 * Formats test statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatKolmogorovSmirnovZTestStatisticsTable (
    results: TwoIndependentSamplesTestResult[]
): TwoIndependentSamplesTestTable {
    if (!results || results.length === 0) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    // Multiple variables case
    const table: TwoIndependentSamplesTestTable = {
        title: "Test Statistics",
        columnHeaders: [
            { header: "", key: "rowHeader" },
            { header: "", key: "Difference" }
        ],
        rows: []
    };
    
    // Benahi: Format the Mann-Whitney U test statistics table properly

    // Add column headers for each variable (only once for the rowHeader)
    if (results.length > 0) {
        // Add a column for each variable
        results.forEach((result, index) => {
            if (result && result.variable1) {
                table.columnHeaders.push({
                    header: result.variable1.label || result.variable1.name || `Variable ${index + 1}`,
                    key: `var_${index}`
                });
            }
        });

        const D_absoluteRow: TableRow = { rowHeader: ["Most Extreme Differences"], Difference: "Absolute" };
        const D_positiveRow: TableRow = { rowHeader: ["Most Extreme Differences"], Difference: "Positive" };
        const D_negativeRow: TableRow = { rowHeader: ["Most Extreme Differences"], Difference: "Negative" };
        const d_statRow: TableRow = { rowHeader: ["Kolmogorov-Smirnov Z"], Difference: "" };
        const pValueRow: TableRow = { rowHeader: ["Asymp. Sig. (2-tailed)"], Difference: "" };
        
        results.forEach((result, varIndex) => {
            const stats = result.testStatisticsKolmogorovSmirnovZ as KolmogorovSmirnovZTestStatistics;
            const key = `var_${varIndex}`;
            D_absoluteRow[key] = formatNumber(stats.D_absolute, 3);
            D_positiveRow[key] = formatNumber(stats.D_positive, 3);
            D_negativeRow[key] = formatNumber(stats.D_negative, 3);
            d_statRow[key] = formatNumber(stats.d_stat, 3);
            pValueRow[key] = formatPValue(stats.pValue);
        });

        // Tambahkan baris ke tabel
        table.rows.push(D_absoluteRow, D_positiveRow, D_negativeRow, d_statRow, pValueRow);
    }

    return table;
}

/**
 * Formats descriptive statistics table
 * @param results Descriptive statistics results
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable (
    results: any[],
    displayStatistics?: DisplayStatisticsOptions
): TwoIndependentSamplesTestTable {
    if (!results || results.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: TwoIndependentSamplesTestTable = {
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
        table.columnHeaders.push({
            header: "Percentiles",
            key: "percentiles",
            children: [
                { header: "25th", key: "Percentile25" },
                { header: "50th (Median)", key: "Percentile50" },
                { header: "75th", key: "Percentile75" }
            ]
        });
    }

    // Process each result
    results.forEach((result) => {
        const decimals = result.variable1.decimals;
        
        // Handle both old format (N, Mean, StdDev) and new format (N1, Mean1, StdDev1)
        const N = result.N || result.N1;
        const Mean = result.Mean || result.Mean1;
        const StdDev = result.StdDev || result.StdDev1;
        const Min = result.Min || result.Min1;
        const Max = result.Max || result.Max1;
        const Percentile25 = result.Percentile25 || result.Percentile25_1;
        const Percentile50 = result.Percentile50 || result.Percentile50_1;
        const Percentile75 = result.Percentile75 || result.Percentile75_1;
        
        table.rows.push({
            rowHeader: [result.variable1.name],
            N: N,
            Mean: formatNumber(Mean, decimals + 2),
            StdDev: formatNumber(StdDev, decimals + 3),
            Min: Min,
            Max: Max,
            Percentile25: formatNumber(Percentile25, decimals + 2),
            Percentile50: formatNumber(Percentile50, decimals + 2),
            Percentile75: formatNumber(Percentile75, decimals + 2)
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