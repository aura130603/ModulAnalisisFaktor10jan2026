// components/VariableTable.tsx (sesuaikan path jika perlu)
"use client";

import React, { useRef, useMemo, useCallback } from 'react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable, type HotTableRef } from '@handsontable/react-wrapper';

import type Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

import './VariableTable.css';
import { colHeaders, columns, DEFAULT_MIN_ROWS, DEFAULT_VARIABLE_TYPE, DEFAULT_VARIABLE_WIDTH, DEFAULT_VARIABLE_DECIMALS, COLUMN_INDEX, DATE_VARIABLE_TYPES } from './tableConfig';
import { useVariableTableLogic } from './hooks/useVariableTableLogic';
import { transformVariablesToTableData } from './utils';

import { VariableTypeDialog } from './dialog/VariableTypeDialog';
import { ValueLabelsDialog } from './dialog/ValueLabelsDialog';
import { MissingValuesDialog } from './dialog/MissingValuesDialog';
import type { VariableType } from '@/types/Variable';
import { withDataTableErrorBoundary } from '@/components/Common/DataTableErrorBoundary';

registerAllModules();

function VariableTableComponent() {
    const hotTableRef = useRef<HotTableRef>(null);

    const {
        variables,
        handleBeforeChange,
        handleAfterSelectionEnd,
        handleContextMenu,
        showTypeDialog,
        setShowTypeDialog,
        showValuesDialog,
        setShowValuesDialog,
        showMissingDialog,
        setShowMissingDialog,
        selectedVariable,
        selectedVariableType,
        handleTypeChange,
        handleValuesChange,
        handleMissingChange,
    } = useVariableTableLogic(hotTableRef);

    const tableData = useMemo(() => transformVariablesToTableData(variables), [variables]);

    const dynamicCellsConfig = useCallback((row: number, col: number) => {
        if (col === COLUMN_INDEX.MEASURE) {
            const currentVar = variables.find(v => v.columnIndex === row);
            const currentType = currentVar?.type;
            const currentMeasure = currentVar?.measure;

            let allowedMeasures: string[] = [];
            if (currentType && DATE_VARIABLE_TYPES.includes(currentType as VariableType)) {
                allowedMeasures = ['scale'];
            } else if (currentType === 'STRING') {
                allowedMeasures = ['nominal', 'ordinal'];
            } else {
                allowedMeasures = ['nominal', 'ordinal', 'scale'];
            }
            if (currentMeasure === 'unknown' && !allowedMeasures.includes('unknown')) {
                allowedMeasures.unshift('unknown');
            }

            return {
                type: 'dropdown',
                source: allowedMeasures,
                strict: true,
                allowInvalid: false,
                className: currentMeasure === 'unknown' ? 'htUnknown' : ''
            } as Handsontable.CellProperties;
        }

        return {};
    }, [variables]);
    
    return (
        <div className="relative w-full h-full border-t border-border" data-testid="variable-table-container">
            <div className="hot-container w-full h-full overflow-hidden relative z-0" data-testid="handsontable-container">
                <HotTable
                    ref={hotTableRef}
                    data={tableData}
                    colHeaders={colHeaders}
                    columns={columns}
                    cells={dynamicCellsConfig}
                    rowHeaders={true}
                    height="100%"
                    width="100%"
                    minRows={DEFAULT_MIN_ROWS}
                    manualColumnResize={true}
                    manualRowResize={true}
                    licenseKey="non-commercial-and-evaluation"
                    contextMenu={{
                        items: {
                            'insert_variable': { name: 'Insert Variable' },
                            'delete_variable': { name: 'Delete Variable' },
                            'copy_variable': { name: 'Copy Variable Definition (JSON)' }
                        },
                        callback: (_key, _selection) => handleContextMenu(_key),
                    }}
                    beforeChange={handleBeforeChange}
                    afterSelectionEnd={handleAfterSelectionEnd}
                    selectionMode="single"
                />
            </div>

            {showTypeDialog && (
                <VariableTypeDialog
                    open={showTypeDialog}
                    onOpenChange={setShowTypeDialog}
                    onSave={handleTypeChange}
                    initialType={selectedVariable?.type ?? DEFAULT_VARIABLE_TYPE}
                    initialWidth={selectedVariable?.width ?? DEFAULT_VARIABLE_WIDTH}
                    initialDecimals={selectedVariable?.decimals ?? DEFAULT_VARIABLE_DECIMALS}
                />
            )}
            {showValuesDialog && (
                <ValueLabelsDialog
                    open={showValuesDialog}
                    onOpenChange={setShowValuesDialog}
                    onSave={handleValuesChange}
                    initialValues={selectedVariable?.values ?? []}
                    variableId={selectedVariable?.id}
                    variableType={selectedVariableType}
                />
            )}
            {showMissingDialog && (
                <MissingValuesDialog
                    open={showMissingDialog}
                    onOpenChange={setShowMissingDialog}
                    onSave={handleMissingChange}
                    initialMissingValues={selectedVariable?.missing ?? null}
                    variableType={selectedVariableType}
                />
            )}
        </div>
    );
}

export default withDataTableErrorBoundary(VariableTableComponent);