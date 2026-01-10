import type { FrequencyTable, TableColumnHeader } from '../types';

/**
 * Formats a single frequency table result into a displayable structure.
 * @param table - The frequency table result from the worker.
 * @returns A formatted table object for the frequency table.
 */
export const formatFrequencyTable = (table: FrequencyTable): any => {
    const headers: TableColumnHeader[] = [
        { header: '', key: 'rowHeader' },
        { header: '', key: 'rowHeader' },
        { header: 'Frequency', key: 'frequency' },
        { header: 'Percent', key: 'percent' },
        { header: 'Valid Percent', key: 'validPercent' },
        { header: 'Cumulative Percent', key: 'cumulativePercent' },
    ];

    const rows: any[] = [];

    // Defensive checks and fallbacks
    const rowArray = Array.isArray(table?.rows) ? table.rows : [];
    const computedValid = rowArray.reduce((acc, r: any) => acc + (typeof r.frequency === 'number' ? r.frequency : 0), 0);
    const summary = table && table.summary ? table.summary : {
        valid: computedValid,
        missing: 0,
        total: computedValid,
    };

    // Valid rows processing
    const validChildren = rowArray.map(row => ({
        rowHeader: [null, row.label],
        frequency: row.frequency,
        percent: typeof row.percent === 'number' ? row.percent.toFixed(1) : (row.percent !== undefined ? String(row.percent) : undefined),
        validPercent: typeof row.validPercent === 'number' ? row.validPercent.toFixed(1) : (row.validPercent !== undefined ? String(row.validPercent) : undefined),
        cumulativePercent: typeof row.cumulativePercent === 'number' ? row.cumulativePercent.toFixed(1) : (row.cumulativePercent !== undefined ? String(row.cumulativePercent) : undefined),
    }));

    const validTotalPercent = summary.total > 0 ? (summary.valid / summary.total * 100) : 0;

    validChildren.push({
        rowHeader: [null, 'Total'],
        frequency: summary.valid,
        percent: validTotalPercent.toFixed(1),
        validPercent: summary.valid > 0 ? '100.0' : undefined,
        cumulativePercent: undefined,
    });

    rows.push({
        rowHeader: ['Valid', null],
        children: validChildren,
    });

    // Missing rows
    if (summary.missing > 0) {
        const missingPercent = summary.total > 0 ? (summary.missing / summary.total * 100) : 0;
        rows.push({
            rowHeader: ['Missing', null],
            children: [
                {
                    rowHeader: [null, 'System'],
                    frequency: summary.missing,
                    percent: missingPercent.toFixed(1),
                    validPercent: null,
                    cumulativePercent: null,
                },
            ],
        });
    }

    // Grand total row
    rows.push({
        rowHeader: ['Total', null],
        frequency: summary.total,
        percent: summary.total > 0 ? '100.0' : undefined,
        validPercent: undefined,
        cumulativePercent: undefined,
    });

    return {
        tables: [
            {
                title: table?.title || 'Frequency Table',
                columnHeaders: headers,
                rows,
            },
        ],
    };
};