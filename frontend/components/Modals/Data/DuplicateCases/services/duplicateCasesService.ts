import type { Variable } from "@/types/Variable";
import { formatFrequencyTable } from "@/components/Modals/Analyze/Descriptive/Frequencies/utils/formatters";
import type { FrequencyTable } from "@/components/Modals/Analyze/Descriptive/Frequencies/types";

interface ProcessDuplicatesArgs {
    data: any[][];
    matchingVariables: Partial<Variable>[];
    sortingVariables: Partial<Variable>[];
    sortOrder: "ascending" | "descending";
    primaryCaseIndicator: "first" | "last";
}

interface ProcessedResult {
    primaryValues: number[];
    sequenceValues: number[];
    reorderedData: any[][] | null;
}

/**
 * Identifies duplicate cases based on a set of matching variables, with options for sorting.
 */
export function processDuplicates({
    data,
    matchingVariables,
    sortingVariables,
    sortOrder,
    primaryCaseIndicator,
}: ProcessDuplicatesArgs): ProcessedResult {
    if (data.length < 2) {
        return { primaryValues: [], sequenceValues: [], reorderedData: data };
    }

    const headers = data[0];
    const dataRows = data.slice(1);

    const matchingIndices = matchingVariables.map(v => v.columnIndex!);
    const sortingIndices = sortingVariables.map(v => v.columnIndex!);

    const duplicateGroups = new Map<string, { rowIndex: number; row: any[] }[]>();

    dataRows.forEach((row, rowIndex) => {
        const key = matchingIndices.map(idx => row[idx]).join('|');
        if (!duplicateGroups.has(key)) {
            duplicateGroups.set(key, []);
        }
        duplicateGroups.get(key)!.push({ rowIndex, row });
        const group = duplicateGroups.get(key);
        if (group) {
            group.push({ rowIndex, row });
        }
    });

    if (sortingIndices.length > 0) {
        duplicateGroups.forEach(group => {
            group.sort((a, b) => {
                for (const idx of sortingIndices) {
                    const aVal = a.row[idx];
                    const bVal = b.row[idx];
                    const aNum = !isNaN(parseFloat(aVal)) ? parseFloat(aVal) : aVal;
                    const bNum = !isNaN(parseFloat(bVal)) ? parseFloat(bVal) : bVal;
                    if (aNum !== bNum) {
                        return sortOrder === "ascending"
                            ? (aNum < bNum ? -1 : 1)
                            : (aNum > bNum ? -1 : 1);
                    }
                }
                return 0;
            });
        });
    }

    const primaryValues = new Array(dataRows.length).fill(0);
    const sequenceValues = new Array(dataRows.length).fill(0);
    const matchingRowIndices = new Set<number>();

    duplicateGroups.forEach(group => {
        if (group.length > 1) {
            const primaryIndexInGroup = primaryCaseIndicator === "first" ? 0 : group.length - 1;
            const primaryRowIndex = group[primaryIndexInGroup].rowIndex;
            primaryValues[primaryRowIndex] = 1;

            group.forEach((item, i) => {
                sequenceValues[item.rowIndex] = i + 1;
                matchingRowIndices.add(item.rowIndex);
            });
        } else {
            const uniqueRowIndex = group[0].rowIndex;
            primaryValues[uniqueRowIndex] = 1; // Also mark unique as primary
            sequenceValues[uniqueRowIndex] = 0; // 0 for non-matching
        }
    });

    const duplicateRows = dataRows.filter((_, rowIndex) => matchingRowIndices.has(rowIndex));
    const uniqueRows = dataRows.filter((_, rowIndex) => !matchingRowIndices.has(rowIndex));
    const reorderedData = [headers, ...duplicateRows, ...uniqueRows];
    
    return {
        primaryValues,
        sequenceValues,
        reorderedData,
    };
}

export interface Statistic {
    title: string;
    description: string;
    component: string;
    output_data: any;
}

interface GenerateStatisticsArgs {
    primaryValues: number[];
    sequenceValues: number[];
    primaryName: string;
    sequentialCount: boolean;
    sequentialName: string;
}

export function generateStatistics({
    primaryValues,
    sequenceValues,
    primaryName,
    sequentialCount,
    sequentialName,
}: GenerateStatisticsArgs): Statistic[] {
    const statistics: Statistic[] = [];

    if (primaryValues.length === 0) return [];

    const primaryCount = primaryValues.filter(v => v === 1).length;
    const duplicateCount = primaryValues.length - primaryCount;

    const primaryFreqTable: FrequencyTable = {
        title: primaryName,
        rows: [
            { label: "Duplicate case", frequency: duplicateCount, percent: duplicateCount / primaryValues.length * 100, validPercent: duplicateCount / primaryValues.length * 100, cumulativePercent: duplicateCount / primaryValues.length * 100 },
            { label: "Primary case", frequency: primaryCount, percent: primaryCount / primaryValues.length * 100, validPercent: primaryCount / primaryValues.length * 100, cumulativePercent: 100 },
        ],
        summary: {
            valid: primaryValues.length,
            missing: 0,
            total: primaryValues.length
        }
    };

    statistics.push({
        title: `Frequency Table: ${primaryName}`,
        description: "Frequency distribution of primary and duplicate cases",
        component: "table",
        output_data: formatFrequencyTable(primaryFreqTable)
    });

    if (sequentialCount) {
        const sequenceCounts: { [key: number]: number } = {};
        sequenceValues.forEach(val => {
            sequenceCounts[val] = (sequenceCounts[val] || 0) + 1;
        });

        const sequenceRows: { label: string; frequency: number; percent: number; cumulativePercent: number; validPercent: number }[] = [];
        let cumulative = 0;
        Object.keys(sequenceCounts)
            .map(Number)
            .sort((a, b) => a - b)
            .forEach(key => {
                const count = sequenceCounts[key];
                const percent = count / sequenceValues.length * 100;
                cumulative += percent;
                sequenceRows.push({
                    label: key === 0 ? "Non-matching case" : `Sequence ${key}`,
                    frequency: count,
                    percent,
                    validPercent: percent,
                    cumulativePercent: cumulative
                });
            });

        const sequenceFreqTable: FrequencyTable = {
            title: sequentialName,
            rows: sequenceRows,
            summary: {
                valid: sequenceValues.length,
                missing: 0,
                total: sequenceValues.length
            }
        };

        statistics.push({
            title: `Frequency Table: ${sequentialName}`,
            description: "Frequency distribution of case sequence numbers",
            component: "table",
            output_data: formatFrequencyTable(sequenceFreqTable)
        });
    }

    return statistics;
}