import {
    OneSampleTTestTable,
    TableColumnHeader,
    TableRow,
    OneSampleTest,
    OneSampleTTestResult,
    OneSampleStatistics,
} from '../types';
import { Variable } from '@/types/Variable';

/**
 * Formats frequencies table based on the specified range option
 * @param results Chi Square results
 * @param specifiedRange Whether a specific range is used
 * @returns Formatted table
 */
export function formatOneSampleStatisticsTable(
    results: OneSampleTTestResult[],
): OneSampleTTestTable {
    if (!results || results.length === 0) {
        return {
            title: "One-Sample Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }

    const table: OneSampleTTestTable = {
        title: 'One-Sample Statistics',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            { header: 'N', key: 'N' },
            { header: 'Mean', key: 'Mean' },
            { header: 'Std. Deviation', key: 'StdDev' },
            { header: 'Std. Error Mean', key: 'SEMean' }
        ],
        rows: []
    };

    // Process each result
    results.forEach((result) => {
        const stats = result.oneSampleStatistics as OneSampleStatistics;
        const decimals = result.variable1?.decimals;

        table.rows.push(
            {
                rowHeader: [result.variable1?.label || result.variable1?.name],
                N: stats.N,
                Mean: formatNumber(stats.Mean, decimals! + 2),
                StdDev: formatNumber(stats.StdDev, decimals! + 3),
                SEMean: formatNumber(stats.SEMean, decimals! + 3)
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
export function formatOneSampleTestTable (
    results: OneSampleTTestResult[],
    testValue: number,
): OneSampleTTestTable {
    if (!results || results.length === 0) {
        return {
            title: "One-Sample Test",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const testValueLabel = 'Test Value = ' + testValue;

    const table: OneSampleTTestTable = {
        title: 'One-Sample Test',
        columnHeaders: [
            { header: '', key: 'rowHeader' },
            {
                header: testValueLabel,
                key: 'testValue',
                children: [
                    { header: 'T', key: 'T' },
                    { header: 'df', key: 'DF' },
                    { header: 'Sig. (2-tailed)', key: 'PValue' },
                    { header: 'Mean Difference', key: 'MeanDifference' },
                    { 
                        header: '95% Confidence Interval of the Difference',
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
        if (result.metadata && result.metadata.hasInsufficientData) {
            return;
        }

        const stats = result.oneSampleTest as OneSampleTest;
        const decimals = result.variable1?.decimals;

        table.rows.push(
            {
                rowHeader: [result.variable1?.label || result.variable1?.name],
                T: formatNumber(stats.T, decimals! + 3),
                DF: formatDF(stats.DF),
                PValue: formatPValue(stats.PValue),
                MeanDifference: formatNumber(stats.MeanDifference, decimals! + 3),
                Lower: formatNumber(stats.Lower, decimals! + 2),
                Upper: formatNumber(stats.Upper, decimals! + 2)
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