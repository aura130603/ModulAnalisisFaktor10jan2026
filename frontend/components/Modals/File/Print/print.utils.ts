export type HAlignType = 'left' | 'center' | 'right' | 'justify';
export type VAlignType = 'top' | 'middle' | 'bottom';

export interface TableStyles {
    halign: HAlignType;
    valign: VAlignType;
    fillColor?: [number, number, number];
}

export interface ColumnHeader {
    header: string;
    key?: string;
    children?: ColumnHeader[];
}

export interface TableRowData {
    rowHeader: (string | null)[];
    [key: string]: unknown;
    children?: TableRowData[];
}

export interface TableData {
    title: string;
    columnHeaders: ColumnHeader[];
    rows: TableRowData[];
}

export interface CellDef {
    content: string;
    styles?: TableStyles;
    rowSpan?: number;
    colSpan?: number;
}

export interface HeaderCell {
    content: string;
    colSpan: number;
    rowSpan: number;
    styles: TableStyles;
}

export interface MergedCell {
    content: string;
    rowSpan: number;
    colSpan: number;
    styles: TableStyles;
}

export interface AutoTableResult {
    tables: {
        title: string;
        head: CellDef[][];
        body: CellDef[][];
    }[];
}

export type MergedRowHeaders = (MergedCell | null)[][];

export const getLeafColumnCount = (col: ColumnHeader): number => {
    if (!col.children?.length) return 1;
    return col.children.reduce((sum, child) => sum + getLeafColumnCount(child), 0);
};

export const getMaxDepth = (columns: ColumnHeader[]): number => {
    return columns.reduce((max, col) => {
        if (col.children?.length) {
            const depth = 1 + getMaxDepth(col.children);
            return Math.max(max, depth);
        }
        return max;
    }, 1);
};

export const getLeafColumnKeys = (cols: ColumnHeader[]): string[] => {
    const keys: string[] = [];
    const traverse = (col: ColumnHeader): void => {
        if (!col.children?.length) {
            keys.push(col.key ?? col.header);
        } else {
            col.children.forEach(traverse);
        }
    };
    cols.forEach(traverse);
    return keys;
};

export const buildColumnLevels = (columns: ColumnHeader[]): ColumnHeader[][] => {
    const maxLevel = getMaxDepth(columns);
    const levels: ColumnHeader[][] = Array.from({ length: maxLevel }, () => []);
    const traverse = (cols: ColumnHeader[], level: number): void => {
        cols.forEach(col => {
            levels[level].push(col);
            if (col.children?.length) {
                traverse(col.children, level + 1);
            }
        });
    };
    traverse(columns, 0);
    return levels;
};

export const mergeHeaderRowCells = (headerRow: HeaderCell[]): HeaderCell[] => {
    const merged: HeaderCell[] = [];
    let i = 0;
    while (i < headerRow.length) {
        const cell = headerRow[i];
        let totalColSpan = cell.colSpan;
        let j = i + 1;
        while (j < headerRow.length && headerRow[j].content === cell.content) {
            totalColSpan += headerRow[j].colSpan;
            j++;
        }
        merged.push({
            content: cell.content,
            colSpan: totalColSpan,
            rowSpan: cell.rowSpan,
            styles: { ...cell.styles }
        });
        i = j;
    }
    return merged;
};

export const propagateHeaders = (row: TableRowData, accumulated: (string | null)[]): TableRowData[] => {
    const combined: (string | null)[] = [];
    const length = Math.max(accumulated.length, row.rowHeader.length);
    for (let i = 0; i < length; i++) {
        combined[i] = row.rowHeader[i] ?? accumulated[i] ?? null;
    }
    if (row.children?.length) {
        return row.children.flatMap(child => propagateHeaders(child, combined));
    } else {
        return [{ ...row, rowHeader: combined }];
    }
};

export const flattenRows = (rows: TableRowData[]): TableRowData[] => {
    return rows.flatMap(row => propagateHeaders(row, []));
};

export const computeMaxRowHeaderDepth = (rows: TableRowData[]): number => {
    return rows.reduce((max, row) => Math.max(max, row.rowHeader.length), 0);
};

export const generateMergedRowHeaders = (flatRows: TableRowData[], rowHeaderCount: number): MergedRowHeaders => {
    const merged: MergedRowHeaders = [];
    for (let rowIndex = 0; rowIndex < flatRows.length; rowIndex++) {
        const row = flatRows[rowIndex];
        const mergedRow: (MergedCell | null)[] = [];
        if (rowHeaderCount === 2 && row.rowHeader.filter(h => h !== "").length === 1) {
            const colIdx = 0;
            const current = row.rowHeader[colIdx] ?? "";
            const prev = rowIndex > 0 ? (flatRows[rowIndex - 1].rowHeader[colIdx] ?? "") : null;
            if (rowIndex === 0 || current !== prev) {
                let rowSpan = 1;
                for (let next = rowIndex + 1; next < flatRows.length; next++) {
                    if (flatRows[next].rowHeader[colIdx] === current) rowSpan++; else break;
                }
                mergedRow.push({ content: current, rowSpan, colSpan: 2, styles: { halign: "left", valign: "middle" } });
            } else {
                mergedRow.push(null);
            }
        } else {
            for (let colIdx = 0; colIdx < rowHeaderCount; colIdx++) {
                const current = row.rowHeader[colIdx] ?? "";
                const prev = rowIndex > 0 ? (flatRows[rowIndex - 1].rowHeader[colIdx] ?? "") : null;
                if (rowIndex === 0 || current !== prev) {
                    let rowSpan = 1;
                    for (let next = rowIndex + 1; next < flatRows.length; next++) {
                        if (flatRows[next].rowHeader[colIdx] === current) rowSpan++; else break;
                    }
                    mergedRow.push({ content: current, rowSpan, colSpan: 1, styles: { halign: "center", valign: "middle" } });
                } else {
                    mergedRow.push(null);
                }
            }
        }
        merged.push(mergedRow);
    }
    return merged;
};

export const generateAutoTableDataFromString = (jsonData: string): AutoTableResult => {
    let parsedData: { tables: TableData[] };
    try {
        parsedData = JSON.parse(jsonData);
    } catch { return { tables: [] }; }
    if (!parsedData.tables || !Array.isArray(parsedData.tables)) return { tables: [] };

    const resultTables: AutoTableResult['tables'] = [];
    parsedData.tables.forEach((table) => {
        const { title, columnHeaders, rows } = table;
        const levels = buildColumnLevels(columnHeaders);
        const maxLevel = levels.length;
        let headerRows = levels.map((cols, level) =>
            cols.map((col) => ({
                content: col.header ?? "",
                colSpan: getLeafColumnCount(col),
                rowSpan: col.children?.length ? 1 : maxLevel - level,
                styles: { halign: "center", valign: "middle" }
            } as HeaderCell))
        );
        headerRows = headerRows.map((row) => mergeHeaderRowCells(row));
        const flatRows_internal = flattenRows(rows);
        if (flatRows_internal.length === 0) return;
        const rowHeaderCount = computeMaxRowHeaderDepth(flatRows_internal);
        const allLeafCols = getLeafColumnKeys(columnHeaders);
        const dataColKeys = allLeafCols.slice(rowHeaderCount > 0 ? rowHeaderCount : 0);

        const mergedRowHeaders_internal = generateMergedRowHeaders(flatRows_internal, rowHeaderCount);
        const body: CellDef[][] = [];
        for (let i = 0; i < flatRows_internal.length; i++) {
            const row = flatRows_internal[i];
            const allDataNull = dataColKeys.every(k => row[k] === null || row[k] === undefined || String(row[k]).trim() === "");
            if (allDataNull && row.rowHeader.every(h => h === null || h.trim() === "")) continue;

            const rowCells: CellDef[] = [];
            mergedRowHeaders_internal[i].forEach(cell => { if (cell) rowCells.push(cell); });
            dataColKeys.forEach(key => {
                rowCells.push({ content: String(row[key] ?? ""), styles: { halign: "center", valign: "middle" } });
            });
            body.push(rowCells);
        }
        if(body.length > 0 || headerRows.some(hr => hr.length > 0)){
            resultTables.push({ title, head: headerRows as CellDef[][], body });
        }
    });
    return { tables: resultTables };
};

export const getLeafPaths = (columns: ColumnHeader[], currentPath: string[] = []): string[][] => {
    let paths: string[][] = [];
    for (const col of columns) {
        const newPath = [...currentPath, col.header];
        if (col.children?.length) {
            paths = paths.concat(getLeafPaths(col.children, newPath));
        } else {
            paths.push(newPath);
        }
    }
    return paths;
};

export type PDFTableCell = CellDef | 'skip' | null | Record<string, never>;
export type PDFTableRow = PDFTableCell[];
export type PDFTableContent = PDFTableRow[];

export const buildHeaderRows = (leafPaths: string[][], maxDepth: number): PDFTableContent => {
    const headerRows: PDFTableContent = [];
    for (let r = 0; r < maxDepth; r++) {
        const row: PDFTableRow = [];
        let i = 0;
        while (i < leafPaths.length) {
            if (leafPaths[i].length <= r) {
                i++;
                continue;
            }
            const text = leafPaths[i][r];
            let count = 1;
            while (
                i + count < leafPaths.length &&
                leafPaths[i + count].length > r &&
                leafPaths[i + count][r] === text
                ) {
                count++;
            }
            const rowSpanValue = leafPaths[i].length === r + 1 ? maxDepth - r : 1;
            const cell: CellDef = { 
                content: text,
                styles: { halign: 'center' as HAlignType, valign: 'middle' as VAlignType },
            };
            if (count > 1) cell.colSpan = count;
            if (rowSpanValue > 1) cell.rowSpan = rowSpanValue;
            row.push(cell);
            row.push(...Array(count - 1).fill({})); 
            i += count;
        }
        headerRows.push(row);
    }
    return headerRows;
}; 