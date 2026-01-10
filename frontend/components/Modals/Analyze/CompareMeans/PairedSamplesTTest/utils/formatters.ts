import {
    PairedSamplesTTestResult,
    PairedSamplesTTestTable,
    TableColumnHeader,
    TableRow,
    PairedSamplesStatistics,
    PairedSamplesCorrelation,
    PairedSamplesTest,
} from '../types';

/**
 * Formats frequencies table for data without specified range
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatPairedSamplesStatisticsTable(
    results: PairedSamplesTTestResult[]
): PairedSamplesTTestTable {
    if (!results || results.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "", key: "group" },
        { header: "Mean", key: "Mean" },
        { header: "N", key: "N" },
        { header: "Std. Deviation", key: "StdDev" },
        { header: "Std. Error Mean", key: "SEMean" }
    ];

    const rows: TableRow[] = [];
    results.forEach((result) => {
        const { variable1, variable2, metadata, pairedSamplesStatistics } = result;
        if (!variable1 || !variable2 || !pairedSamplesStatistics) return;

        const { group1, group2 } = pairedSamplesStatistics as PairedSamplesStatistics;
        if (!group1 || !group2) return;

        if (group1.N === 0 || group2.N === 0) {
            rows.push(
                {
                    rowHeader: [`Pair ${metadata.pair}`],
                    group: group1.label,
                    Mean: null,
                    N: group1.N,
                    StdDev: null,
                    SEMean: null
                },
                {
                    rowHeader: [`Pair ${metadata.pair}`],
                    group: group2.label,
                    Mean: null,
                    N: group2.N,
                    StdDev: null,
                    SEMean: null
                }
            );
            return;
        } else if (group1.N === 1 || group2.N === 1) {
            rows.push({
                rowHeader: [`Pair ${metadata.pair}`],
                group: group1.label,
                Mean: formatNumber(group1.Mean, result.variable1.decimals+2),
                N: group1.N,
                StdDev: null,
                SEMean: null
            });
            rows.push({
                rowHeader: [`Pair ${metadata.pair}`],
                group: group2.label,
                Mean: formatNumber(group2.Mean, result.variable2.decimals+2),
                N: group2.N,
                StdDev: null,
                SEMean: null
            });
            return;
        }

        rows.push({
            rowHeader: [`Pair ${metadata.pair}`],
            group: group1.label,
            Mean: formatNumber(group1.Mean, result.variable1.decimals+2),
            N: group1.N,
            StdDev: formatNumber(group1.StdDev, result.variable1.decimals+3),
            SEMean: formatNumber(group1.SEMean, result.variable1.decimals+3)
        });
        rows.push({
            rowHeader: [`Pair ${metadata.pair}`],
            group: group2.label,
            Mean: formatNumber(group2.Mean, result.variable2.decimals+2),
            N: group2.N,
            StdDev: formatNumber(group2.StdDev, result.variable2.decimals+3),
            SEMean: formatNumber(group2.SEMean, result.variable2.decimals+3)
        });
    });

    return {
        title: "Paired Samples Statistics",
        columnHeaders: columnHeaders,
        rows: rows
    };
}

/**
 * Formats frequencies table for data with specified range
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatPairedSamplesCorrelationTable(
    results: PairedSamplesTTestResult[]
): PairedSamplesTTestTable {
    if (!results || results.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "", key: "correlationLabel" },
        { header: "N", key: "N" },
        { header: "Correlation", key: "Correlation" },
        { header: "Sig.", key: "PValue" }
    ];

    const rows: TableRow[] = [];
    results.forEach((result) => {
        const { variable1, variable2, metadata, pairedSamplesCorrelation } = result;
        if (!variable1 || !variable2 || !pairedSamplesCorrelation || metadata.hasInsufficientData) return;

        const { correlationLabel, N, Correlation, correlationPValue } = pairedSamplesCorrelation as PairedSamplesCorrelation;

        rows.push({
            rowHeader: [`Pair ${metadata.pair}`],
            correlationLabel: correlationLabel,
            N: N,
            Correlation: formatNumber(Correlation, Math.max(result.variable1.decimals, result.variable2.decimals)+3),
            PValue: formatPValue(correlationPValue)
        });
    });

    return {
        title: "Paired Samples Correlation",
        columnHeaders: columnHeaders,
        rows: rows
    };
}

/**
 * Formats test statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatPairedSamplesTestTable (
    results: PairedSamplesTTestResult[]
): PairedSamplesTTestTable {
    if (!results || results.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "", key: "Label" },
        {
            header: "Paired Differences",
            key: "PairedDifferences",
            children: [
                { header: "Mean", key: "Mean" },
                { header: "Std. Deviation", key: "StdDev" },
                { header: "Std. Error Mean", key: "SEMean" },
                {
                    header: "95% Confidence Interval of the Difference",
                    key: "CI",
                    children: [
                        { header: "Lower", key: "LowerCI" },
                        { header: "Upper", key: "UpperCI" }
                    ]
                }
            ]
        },
        { header: "t", key: "t" },
        { header: "df", key: "df" },
        { header: "Sig. (2-tailed)", key: "pValue" }
    ];

    const rows: TableRow[] = [];
    results.forEach((result) => {
        const { variable1, variable2, metadata, pairedSamplesTest } = result;
        if (!variable1 || !variable2 || !pairedSamplesTest || metadata.hasInsufficientData) return;

        const { label, Mean, StdDev, SEMean, LowerCI, UpperCI, t, df, pValue } = pairedSamplesTest as PairedSamplesTest;
    
        const decimals = Math.max(variable1.decimals, variable2.decimals);
        rows.push({
            rowHeader: [`Pair ${metadata.pair}`],
            Label: label,
            Mean: formatNumber(Mean, decimals+3),
            StdDev: formatNumber(StdDev, decimals+3),
            SEMean: formatNumber(SEMean, decimals+3),
            LowerCI: formatNumber(LowerCI, decimals+3),
            UpperCI: formatNumber(UpperCI, decimals+3),
            t: formatNumber(t, decimals+3),
            df: formatDF(df),
            pValue: formatPValue(pValue)
        });
    });

    return {
        title: "Paired Samples Test",
        columnHeaders: columnHeaders,
        rows: rows
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