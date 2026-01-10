import {
    KRelatedSamplesResults,
    KRelatedSamplesTable,
    TableColumnHeader,
    TableRow,
    TestStatistics,
    DescriptiveStatistics,
    DisplayStatisticsOptions,
} from '../types';

/**
 * Formats ranks table for Friedman and Kendall's W tests
 * @param results Test results
 * @returns Formatted table
 */
export function formatRanksTable(
    results: any[],
): KRelatedSamplesTable {
    if (!results || results.length === 0) {
        return {
            title: "Ranks",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Find the result with ranks
    const ranksResult = results.find(result => result.ranks && result.ranks.groups);
    
    if (!ranksResult || !ranksResult.ranks || !ranksResult.ranks.groups) {
        return {
            title: "Ranks",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "Mean Rank", key: "meanRank" }
    ];
    
    const rows: TableRow[] = ranksResult.ranks.groups.map((condition: { label: string; meanRank: number }) => ({
        rowHeader: [condition.label],
        meanRank: typeof condition.meanRank === "number" && !isNaN(condition.meanRank)
            ? condition.meanRank.toFixed(2)
            : ""
    }));
    
    return {
        title: "Ranks",
        columnHeaders,
        rows
    };
}

/**
 * Formats frequencies table for Cochran's Q test
 * @param results Test results
 * @returns Formatted table
 */
export function formatFrequenciesTable(
    results: any[],
): KRelatedSamplesTable {
    if (!results || results.length === 0) {
        return {
            title: "Frequencies",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Find the result with frequencies
    const frequenciesResult = results.find(result => result.frequencies && result.frequencies.groups);
    
    if (!frequenciesResult || !frequenciesResult.frequencies || !frequenciesResult.frequencies.groups) {
        return {
            title: "Frequencies",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "Count", key: "count" }
    ];
    
    const rows: TableRow[] = frequenciesResult.frequencies.groups.map((condition: { label: string; count: number }) => ({
        rowHeader: [condition.label],
        count: typeof condition.count === "number" && !isNaN(condition.count)
            ? condition.count.toFixed(2)
            : ""
    }));
    
    return {
        title: "Frequencies",
        columnHeaders,
        rows
    };
}

/**
 * Formats test statistics table for all tests
 * @param results Test results
 * @param testName Name of the test
 * @returns Formatted table
 */
export function formatTestStatisticsTable(
    results: any[],
    testName: string
): KRelatedSamplesTable {
    if (!results || results.length === 0) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    // Filter results by test type
    const filteredResults = results.filter(result => 
        result.testStatistics?.TestType === testName.replace(" Test", "") || 
        result.testStatistics?.TestType === testName
    );
    
    if (filteredResults.length === 0) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const testStatistics = filteredResults[0].testStatistics;
    
    if (!testStatistics) {
        return {
            title: "Test Statistics",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const columnHeaders: TableColumnHeader[] = [
        { header: "", key: "rowHeader" },
        { header: "Value", key: "value" }
    ];
    
    const rows: TableRow[] = [
        {
            rowHeader: ["N"],
            value: formatNumber(testStatistics.N, 0)
        },
        {
            rowHeader: ["Chi-Square"],
            value: formatNumber(testStatistics.TestValue, 3)
        },
        {
            rowHeader: ["df"],
            value: formatNumber(testStatistics.df, 0)
        },
        {
            rowHeader: ["Asymp. Sig."],
            value: formatPValue(testStatistics.PValue)
        }
    ];
    
    // Add Kendall's W value if available
    if (testName === "Kendall's W Test" && testStatistics.W !== undefined) {
        rows.splice(1, 0, {
            rowHeader: ["Kendall's W"],
            value: testStatistics.W.toFixed(3)
        });
    }
    
    return {
        title: "Test Statistics",
        columnHeaders,
        rows
    };
}

/**
 * Formats descriptive statistics table
 * @param results Chi Square results
 * @returns Formatted table
 */
export function formatDescriptiveStatisticsTable (
    results: any[] | any,
    displayStatistics?: DisplayStatisticsOptions
): KRelatedSamplesTable {
    // Ensure results is an array
    const resultsArray = Array.isArray(results) ? results : [results];
    
    if (!resultsArray || resultsArray.length === 0) {
        return {
            title: "No Data",
            columnHeaders: [{ header: "No Data", key: "noData" }],
            rows: []
        };
    }
    
    const table: KRelatedSamplesTable = {
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
    resultsArray.forEach((result) => {
        if (result.descriptiveStatistics) {
            const stats = result.descriptiveStatistics;
            const variable = stats.variable1 || stats.variable;
            const decimals = variable && typeof variable !== "string" && variable.decimals ? variable.decimals : 2;
            const variableName = variable && typeof variable !== "string" ? variable.name : (typeof variable === "string" ? variable : "Variable");
            
            table.rows.push({
                rowHeader: [variableName],
                N: stats.N1 || stats.N,
                Mean: formatNumber(stats.Mean1 || stats.Mean, decimals + 2),
                StdDev: formatNumber(stats.StdDev1 || stats.StdDev, decimals + 3),
                Min: formatNumber(stats.Min1 || stats.Min, decimals),
                Max: formatNumber(stats.Max1 || stats.Max, decimals),
                Percentile25: formatNumber(stats.Percentile25_1 || stats.Percentile25, decimals),
                Percentile50: formatNumber(stats.Percentile50_1 || stats.Percentile50, decimals),
                Percentile75: formatNumber(stats.Percentile75_1 || stats.Percentile75, decimals)
            });
        }
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
    if (value === null || value === undefined || isNaN(value)) return "";
    return value.toFixed(precision);
};

/**
 * Formats p-value with appropriate notation
 * @param pValue P-value to format
 * @returns Formatted p-value
 */
export const formatPValue = (pValue: number | null | undefined) => {
    if (pValue === null || pValue === undefined || isNaN(pValue)) return "";
    
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
    if (df === null || df === undefined || isNaN(df)) return "";
    if (Number.isInteger(df)) {
        return df;
    } else {
        return df.toFixed(3);
    }
};