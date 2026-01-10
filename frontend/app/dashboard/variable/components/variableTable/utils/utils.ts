import type { Variable, ValueLabel } from "@/types/Variable";
import { DEFAULT_MIN_ROWS, COLUMN_INDEX_TO_FIELD_MAP } from '../tableConfig';
import type Handsontable from 'handsontable';
import { textRenderer } from 'handsontable/renderers';

/**
 * Enhanced text renderer that prevents word breaking and ensures proper text overflow handling
 * @param instance - Handsontable instance
 * @param td - Table cell element
 * @param row - Row index
 * @param col - Column index
 * @param prop - Property name
 * @param value - Cell value
 * @param cellProperties - Cell properties
 */
export function enhancedTextRenderer(
    instance: Handsontable,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: string | number | null | undefined,
    cellProperties: Handsontable.CellProperties
): HTMLTableCellElement {
    // Use the default text renderer first
    textRenderer(instance, td, row, col, prop, value, cellProperties);
    
    // Apply enhanced CSS properties programmatically
    td.style.whiteSpace = 'nowrap';
    td.style.overflow = 'hidden';
    td.style.textOverflow = 'ellipsis';
    td.style.wordBreak = 'keep-all';
    td.style.wordWrap = 'normal';
    td.style.hyphens = 'none';
    td.style.overflowWrap = 'normal';
    td.style.lineHeight = '1.2';
    td.style.maxWidth = '100%';
    
    // Add title attribute for tooltip on hover
    if (value !== null && value !== '') {
        td.title = String(value);
    } else {
        td.removeAttribute('title');
    }
    
    return td;
}

/**
 * Null-safe wrapper for the enhanced text renderer
 */
export function nullSafeEnhancedRenderer(
    instance: Handsontable,
    td: HTMLTableCellElement,
    row: number,
    col: number,
    prop: string | number,
    value: string | number | null | undefined,
    cellProperties: Handsontable.CellProperties
): HTMLTableCellElement {
    if (value === null || value === undefined) {
        textRenderer(instance, td, row, col, prop, '', cellProperties);
        return td;
    }
    return enhancedTextRenderer(instance, td, row, col, prop, value, cellProperties);
}

export function formatMissingValuesDisplay(variable: Variable): string {
    if (!variable.missing) {
        return "";
    }

    const displayParts: string[] = [];

    // Format range
    if (variable.missing.range) {
        const { min, max } = variable.missing.range;
        if (min !== undefined && max !== undefined && typeof min === 'number' && typeof max === 'number' && min <= max) {
            displayParts.push(`${min} thru ${max}`);
        } else if (min !== undefined && max === undefined) {
            displayParts.push(`${min} thru HIGHEST`); // Consider localization or better term
        } else if (min === undefined && max !== undefined) {
            displayParts.push(`LOWEST thru ${max}`); // Consider localization or better term
        }
        // Note: Consider if range should be mutually exclusive with discrete, or how they combine.
        // Current logic allows both range and discrete values to be displayed if present.
    }

    // Format discrete values
    if (variable.missing.discrete && variable.missing.discrete.length > 0) {
        const discreteDisplay = variable.missing.discrete
            .map(m => (m === " " ? "'[Space]'" : m))
            .join(", ");
        displayParts.push(discreteDisplay);
    }


    return displayParts.join(", ");
}

export function formatValueLabelsDisplay(variable: Variable): string {
    if (!Array.isArray(variable.values) || variable.values.length === 0) {
        return "";
    }

    return variable.values
        .map((valueLabel: ValueLabel) =>
            `${valueLabel.value === " " ? "[Space]" : valueLabel.value}: ${valueLabel.label}`
        )
        .join(", ");
}

export function transformVariablesToTableData(variables: Variable[]): (string | number)[][] {
    const maxColumnIndex = variables.length > 0
        ? Math.max(...variables.map(v => v.columnIndex))
        : -1;

    const rowCount = Math.max(DEFAULT_MIN_ROWS, maxColumnIndex + 1);

    return Array.from({ length: rowCount }, (_, index) => {
        const variable = variables.find(v => v.columnIndex === index);

        if (!variable) {
            return Array(COLUMN_INDEX_TO_FIELD_MAP.length).fill("");
        }

        const displayValues = formatValueLabelsDisplay(variable);
        const displayMissing = formatMissingValuesDisplay(variable);

        return COLUMN_INDEX_TO_FIELD_MAP.map(field => {
            if (field === 'values') return displayValues;
            if (field === 'missing') return displayMissing;
            return variable[field as keyof Variable] ?? "";
        });
    });
}