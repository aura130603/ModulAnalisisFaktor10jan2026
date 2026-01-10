import {
    IndependentSamplesTTestTable,
    TableColumnHeader,
    TableRow,
    GroupStatistics,
    IndependentSamplesTest,
    IndependentSamplesTTestResult,
} from '../types';

/**
 * Formats frequencies table based on the specified range option
 * @param results Chi Square results
 * @param specifiedRange Whether a specific range is used
 * @returns Formatted table
 */
export function formatGroupStatisticsTable(
    results: IndependentSamplesTTestResult[],
    groupingVariableLabel: string
): IndependentSamplesTTestTable {
    if (!results || results.length === 0) {
        return {
            title: "Group Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const label = groupingVariableLabel || '';

    const table: IndependentSamplesTTestTable = {
        title: 'Group Statistics',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: label, key: 'label' },
            { header: 'N', key: 'N' },
            { header: 'Mean', key: 'Mean' },
            { header: 'Std. Deviation', key: 'StdDev' },
            { header: 'Std. Error Mean', key: 'SEMean' }
        ],
        rows: []
    };

    // Process each result
    results.forEach((result) => {
        const stats = result.groupStatistics as GroupStatistics;
        const decimals = result.variable1?.decimals;

        table.rows.push(
            {   
                rowHeader: [result.variable1?.name],
                label: stats.group1.label,
                N: stats.group1.N,
                Mean: formatNumber(stats.group1.Mean, decimals! + 2),
                StdDev: formatNumber(stats.group1.StdDev, decimals! + 3),
                SEMean: formatNumber(stats.group1.SEMean, decimals! + 3)
            },
            {
                rowHeader: [result.variable1?.name],
                label: stats.group2.label,
                N: stats.group2.N,
                Mean: formatNumber(stats.group2.Mean, decimals! + 2),
                StdDev: formatNumber(stats.group2.StdDev, decimals! + 3),
                SEMean: formatNumber(stats.group2.SEMean, decimals! + 3)
            }
        );
    });

    return table;
}

/**
 * Formats descriptive statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatIndependentSamplesTestTable (
    results: IndependentSamplesTTestResult[]
): IndependentSamplesTTestTable {
    if (!results || results.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: IndependentSamplesTTestTable = {
        title: 'Independent Samples Test',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: '', key: 'type' },
            {
                header: 'Levene\'s Test for Equality of Variances',
                key: 'levene',
                children: [
                    { header: 'F', key: 'FL' },
                    { header: 'Sig', key: 'SigL' }
                ]
            },
            {
                header: 't-test for Equality of Means',
                key: 'tTest',
                children: [
                    { header: 't', key: 'T' },
                    { header: 'df', key: 'DF' },
                    { header: 'Sig. (2-tailed)', key: 'Sig2tailed' },
                    { header: 'Mean Difference', key: 'MeanDifference' },
                    { header: 'Std. Error Difference', key: 'StdErrorDifference' },
                    {
                        header: '95% Confidence Interval',
                        key: 'CI',
                        children: [
                            { header: 'Lower', key: 'Lower' },
                            { header: 'Upper', key: 'Upper' }
                        ]
                    }
                ]
            }
        ],
        rows: []
    };

    // Process each result
    results.forEach((result) => {
        if (result.metadata && result.metadata.hasInsufficientData && (result.metadata.insufficientType.includes('empty') || result.metadata.insufficientType.includes('stdDev'))) {
            return;
        }

        const stats = result.independentSamplesTest as IndependentSamplesTest;
        const decimals = result.variable1?.decimals;
        
        table.rows.push(
            {
                rowHeader: [result.variable1?.name],
                type: 'Equal variances assumed',
                FL: formatNumber(stats.levene.F, decimals! + 3),
                SigL: formatPValue(stats.levene.Sig),
                T: formatNumber(stats.equalVariances.t, decimals! + 3),
                DF: formatDF(stats.equalVariances.df),
                Sig2tailed: formatPValue(stats.equalVariances.sig),
                MeanDifference: formatNumber(stats.equalVariances.meanDifference, decimals! + 3),
                StdErrorDifference: formatNumber(stats.equalVariances.stdErrorDifference, decimals! + 3),
                Lower: formatNumber(stats.equalVariances.confidenceInterval.lower, decimals! + 3),
                Upper: formatNumber(stats.equalVariances.confidenceInterval.upper, decimals! + 3)
            },
            {
                rowHeader: [result.variable1?.name],
                type: 'Equal variances not assumed',
                FL: '',
                SigL: '',
                T: formatNumber(stats.unequalVariances.t, decimals! + 3),
                DF: formatDF(stats.unequalVariances.df),
                Sig2tailed: formatPValue(stats.unequalVariances.sig),
                MeanDifference: formatNumber(stats.unequalVariances.meanDifference, decimals! + 3),
                StdErrorDifference: stats.unequalVariances.stdErrorDifference === 0
                    ? ''
                    : formatNumber(stats.unequalVariances.stdErrorDifference, decimals! + 3),
                Lower: formatNumber(stats.unequalVariances.confidenceInterval.lower, decimals! + 3),
                Upper: formatNumber(stats.unequalVariances.confidenceInterval.upper, decimals! + 3)
            }
        );
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
    if (value === null || value === undefined || isNaN(value) || !isFinite(value)) return '';
    return value.toFixed(precision);
};

/**
 * Formats p-value with appropriate notation
 * @param pValue P-value to format
 * @returns Formatted p-value
 */
export const formatPValue = (pValue: number | null | undefined) => {
    if (pValue === null || pValue === undefined || isNaN(pValue) || !isFinite(pValue)) return '';
    
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
    if (df === null || df === undefined || isNaN(df) || !isFinite(df)) return '';
    if (Number.isInteger(df)) {
        return df;
    } else {
        return df.toFixed(3);
    }
};