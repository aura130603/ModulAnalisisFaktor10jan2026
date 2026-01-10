import type { DescriptiveStatistics, FrequenciesResult } from '../types';
import { spssDateTypes } from '@/types/Variable';

// Konstanta untuk precision yang konsisten
const STATS_DECIMAL_PLACES = 2;

// Helper function to check if a variable is a date type
const isDateVariable = (variable: any): boolean => {
    return variable?.type && spssDateTypes.has(variable.type);
};

/**
 * Formats the raw statistics data into a table structure for display.
 * @param results - Array of analysis results from the worker.
 * @returns A formatted table object for descriptive statistics.
 */
export const formatStatisticsTable = (results: FrequenciesResult[]): any => {
    const statsResults = results.filter(r => r.stats);
    if (statsResults.length === 0) return null;

    const statsMap = new Map<string, DescriptiveStatistics>();
    statsResults.forEach(r => {
        if (r.stats) {
            statsMap.set(r.variable.name, r.stats);
        }
    });

    const variableNames = statsResults.map(r => r.variable.name);

    const columnHeaders = [
        { header: '', key: 'stat' },
        { header: '', key: 'subStat' },
        ...statsResults.map(r => ({
            header: r.variable.label || r.variable.name,
            key: r.variable.name,
        })),
    ];

    const rows: any[] = [];

    // N Row
    rows.push({
        rowHeader: ['N', null],
        children: [
            {
                rowHeader: [null, 'Valid'],
                ...Object.fromEntries(variableNames.map(name => [name, statsMap.get(name)?.N?.toString() ?? ''])),
            },
            {
                rowHeader: [null, 'Missing'],
                ...Object.fromEntries(variableNames.map(name => [name, statsMap.get(name)?.Missing?.toString() ?? ''])),
            },
        ],
    });

    const statRowsConfig = [
        { name: 'Mean', key: 'Mean', precision: STATS_DECIMAL_PLACES },
        // Align key with worker output (SEMean)
        { name: 'Std. Error of Mean', key: 'SEMean', precision: STATS_DECIMAL_PLACES },
        { name: 'Median', key: 'Median', precision: STATS_DECIMAL_PLACES },
    ];

    statRowsConfig.forEach(config => {
        const row: any = { rowHeader: [config.name] };
        variableNames.forEach(name => {
            const variable = statsResults.find(r => r.variable.name === name)?.variable;
            if (isDateVariable(variable)) {
                // For date variables, don't show numerical statistics like Mean, Median, SE Mean
                row[name] = '';
            } else {
                const value = (statsMap.get(name) as any)?.[config.key];
                row[name] = typeof value === 'number' ? value.toFixed(config.precision) : value ?? '';
            }
        });
        rows.push(row);
    });

    // Mode Row
    const modeRow: any = { rowHeader: ['Mode'] };
    variableNames.forEach(name => {
        const variable = statsResults.find(r => r.variable.name === name)?.variable;
        const modes = statsMap.get(name)?.Mode;
        if (modes && Array.isArray(modes) && modes.length > 0) {
            if (isDateVariable(variable)) {
                // For date variables, show mode without decimal formatting
                modeRow[name] = modes[0] + (modes.length > 1 ? '<sup>a</sup>' : '');
            } else {
                // For numeric variables, format with decimals; otherwise, show as-is (string/value-label)
                const first = modes[0] as unknown;
                modeRow[name] = (typeof first === 'number'
                    ? first.toFixed(STATS_DECIMAL_PLACES)
                    : String(first)) + (modes.length > 1 ? '<sup>a</sup>' : '');
            }
        } else {
            modeRow[name] = '';
        }
    });
    rows.push(modeRow);

    const remainingStatRowsConfig = [
        { name: 'Std. Deviation', key: 'StdDev', precision: STATS_DECIMAL_PLACES },
        { name: 'Variance', key: 'Variance', precision: STATS_DECIMAL_PLACES },
        { name: 'Skewness', key: 'Skewness', precision: STATS_DECIMAL_PLACES },
        // Align keys with worker output (SESkewness, SEKurtosis)
        { name: 'Std. Error of Skewness', key: 'SESkewness', precision: STATS_DECIMAL_PLACES },
        { name: 'Kurtosis', key: 'Kurtosis', precision: STATS_DECIMAL_PLACES },
        { name: 'Std. Error of Kurtosis', key: 'SEKurtosis', precision: STATS_DECIMAL_PLACES },
        { name: 'Range', key: 'Range', precision: STATS_DECIMAL_PLACES },
        { name: 'Minimum', key: 'Minimum', precision: STATS_DECIMAL_PLACES },
        { name: 'Maximum', key: 'Maximum', precision: STATS_DECIMAL_PLACES },
        { name: 'Sum', key: 'Sum', precision: STATS_DECIMAL_PLACES },
    ];

    remainingStatRowsConfig.forEach(config => {
        const row: any = { rowHeader: [config.name] };
        variableNames.forEach(name => {
            const variable = statsResults.find(r => r.variable.name === name)?.variable;
            if (isDateVariable(variable)) {
                // For date variables, don't show numerical statistics
                row[name] = '';
            } else {
                const value = (statsMap.get(name) as any)?.[config.key];
                row[name] = typeof value === 'number' ? value.toFixed(config.precision) : value ?? '';
            }
        });
        rows.push(row);
    });

    // Percentiles
    const percentileLevels = new Set<number>();
    statsResults.forEach(r => {
        if (r.stats?.Percentiles) {
            Object.keys(r.stats.Percentiles).forEach(p => percentileLevels.add(Number(p)));
        }
    });

    if (percentileLevels.size > 0) {
        const sortedLevels = Array.from(percentileLevels).sort((a, b) => a - b);
        const percentileChildren = sortedLevels.map(level => {
            const childRow: any = { rowHeader: [null, level.toString()] };
            variableNames.forEach(name => {
                const variable = statsResults.find(r => r.variable.name === name)?.variable;
                if (isDateVariable(variable)) {
                    // For date variables, don't show percentiles as they are not meaningful
                    childRow[name] = '.';
                } else {
                    const value = statsMap.get(name)?.Percentiles?.[level];
                    childRow[name] = typeof value === 'number' ? value.toFixed(STATS_DECIMAL_PLACES) : '.';
                }
            });
            return childRow;
        });
        rows.push({
            rowHeader: ['Percentiles', null],
            children: percentileChildren,
        });
    }

    const hasMultipleModes = statsResults.some(r => r.stats && Array.isArray(r.stats.Mode) && r.stats.Mode.length > 1);

    return {
        tables: [
            {
                title: 'Statistics',
                columnHeaders: columnHeaders.map(h => ({ header: h.header, key: h.key })), // Match desired output
                rows,
                ...(hasMultipleModes && { footer: '<sup>a</sup>. Multiple modes exist. The smallest value is shown.' }),
            },
        ],
    };
};