import { useState, useEffect, useCallback } from 'react';
import { GoToMode } from '../types';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { useTableRefStore } from '@/stores/useTableRefStore';

interface UseGoToFormProps {
  defaultMode?: GoToMode;
  onClose: () => void;
}

const selectRow = (hotInstance: any, rowIndex: number): boolean => {
    try {
        if (typeof hotInstance.selectRows === 'function') {
            hotInstance.selectRows(rowIndex);
        } else {
            const colCount = hotInstance.countCols();
            hotInstance.selectCell(rowIndex, 0, rowIndex, colCount - 1);
        }
        return true;
    } catch (err) {
        try {
            hotInstance.selectCell(rowIndex, 0);
            return true;
        } catch (finalErr) {
            console.error("Failed to select cell:", finalErr);
            return false;
        }
    }
};

const selectColumn = (hotInstance: any, colIndex: number): boolean => {
    try {
        if (typeof hotInstance.selectColumns === 'function') {
            hotInstance.selectColumns(colIndex);
        } else {
            const rowCount = hotInstance.countRows();
            hotInstance.selectCell(0, colIndex, rowCount - 1, colIndex);
        }
        return true;
    } catch (err) {
        try {
            hotInstance.selectCell(0, colIndex);
            return true;
        } catch (finalErr) {
            console.error("Failed to select cell:", finalErr);
            return false;
        }
    }
};

export const useGoToForm = ({ defaultMode = GoToMode.CASE, onClose }: UseGoToFormProps) => {
  const allVariables = useVariableStore((state) => state.variables);
  const data = useDataStore((state) => state.data);
  const dataTableRef = useTableRefStore((state) => state.dataTableRef);
  
  const [activeTab, setActiveTab] = useState<string>(defaultMode);
  const [caseNumberInput, setCaseNumberInput] = useState<string>('1');
  const [caseError, setCaseError] = useState<string>('');
  const [variableNames, setVariableNames] = useState<string[]>([]);
  const [selectedVariableName, setSelectedVariableName] = useState<string>('');
  const [variableError, setVariableError] = useState<string>('');
  const [totalCases, setTotalCases] = useState<number>(0);
  const [lastNavigationSuccess, setLastNavigationSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    const names = [...allVariables].sort((a,b) => a.columnIndex - b.columnIndex).map(v => v.name);
    setVariableNames(names);
    if (names.length > 0 && !selectedVariableName) {
      setSelectedVariableName(names[0]);
    }
  }, [allVariables, selectedVariableName]);

  useEffect(() => {
    setTotalCases(data?.length || 0);
  }, [data]);

  useEffect(() => {
    setCaseError('');
    setVariableError('');
    if (activeTab === GoToMode.CASE) {
      setCaseNumberInput('1');
    } else if (activeTab === GoToMode.VARIABLE && variableNames.length > 0 && !selectedVariableName) {
      setSelectedVariableName(variableNames[0]);
    }
  }, [activeTab, variableNames, selectedVariableName]);

  const handleCaseNumberChange = useCallback((value: string) => {
    setCaseNumberInput(value);
    if (value === '' || !/^[1-9][0-9]*$/.test(value)) {
      setCaseError('Case number must be a positive integer.');
    } else if (parseInt(value, 10) > totalCases) {
      setCaseError(`Case number must not exceed ${totalCases}.`);
    } else {
      setCaseError('');
    }
  }, [totalCases]);

  const handleSelectedVariableChange = useCallback((value: string) => {
    setSelectedVariableName(value);
    setVariableError('');
  }, []);

  const navigateToTarget = useCallback((type: 'case' | 'variable') => {
    setLastNavigationSuccess(null);
    const hot = dataTableRef?.current?.hotInstance;

    if (!hot) {
        console.error("Handsontable instance not found");
        setLastNavigationSuccess(false);
        return;
    }

    try {
        if (type === 'case') {
            if (caseNumberInput === '' || !/^[1-9][0-9]*$/.test(caseNumberInput)) {
                setCaseError('Please enter a valid case number.');
                setLastNavigationSuccess(false);
                return;
            }
            const rowIndex = parseInt(caseNumberInput, 10) - 1;
            if (rowIndex >= data.length || rowIndex < 0) {
                setCaseError(`Case number must be between 1 and ${data.length}.`);
                setLastNavigationSuccess(false);
                return;
            }

            const selectionHook = () => {
                const success = selectRow(hot, rowIndex);
                setLastNavigationSuccess(success);
                hot.updateSettings({ afterRender: undefined });
            };
            
            hot.updateSettings({ afterRender: selectionHook });
            hot.scrollViewportTo(rowIndex, 0, true);

        } else if (type === 'variable') {
            if (!selectedVariableName) {
                setVariableError('Please select a variable.');
                setLastNavigationSuccess(false);
                return;
            }
            const variable = allVariables.find(v => v.name === selectedVariableName);
            if (!variable) {
                setVariableError('Selected variable not found.');
                setLastNavigationSuccess(false);
                return;
            }
            
            const colIndex = variable.columnIndex;
            
            const selectionHook = () => {
                const success = selectColumn(hot, colIndex);
                setLastNavigationSuccess(success);
                hot.updateSettings({ afterRender: undefined });
            };
            
            hot.updateSettings({ afterRender: selectionHook });
            hot.scrollViewportTo(0, colIndex, true);
        }
    } catch (error) {
        console.error(`Error navigating to ${type}:`, error);
        setLastNavigationSuccess(false);
    }
  }, [allVariables, caseNumberInput, data.length, dataTableRef, selectedVariableName]);

  // This function is called when the user clicks the Go button
  const handleGo = useCallback(() => {
    if (activeTab === GoToMode.CASE) {
      navigateToTarget('case');
    } else if (activeTab === GoToMode.VARIABLE) {
      navigateToTarget('variable');
    }
  }, [activeTab, navigateToTarget]);

  // This function is called when the user clicks the Close button
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
    activeTab,
    setActiveTab,
    caseNumberInput,
    handleCaseNumberChange,
    caseError,
    variableNames,
    selectedVariableName,
    handleSelectedVariableChange,
    variableError,
    totalCases,
    handleGo,
    handleClose,
    lastNavigationSuccess
  };
}; 