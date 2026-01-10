import { useState, useEffect, useCallback } from 'react';
import type { Variable, ValueLabel, MissingValuesSpec } from '@/types/Variable';
import type Handsontable from 'handsontable';
import { isDateType, DATE_FORMAT_SPECS } from '../constants/dateSpecs';
import { 
    getUniqueValuesWithCounts, 
    suggestMeasurementLevel,
    saveVariableProperties 
} from '../services/variablePropertiesService';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';

interface UsePropertiesEditorProps {
    initialVariables: Variable[];
    caseLimit: string;
    valueLimit: string;
    onSave?: (variables: Variable[]) => void;
    onClose: () => void;
}

export const usePropertiesEditor = ({
    initialVariables,
    caseLimit,
    valueLimit,
    onSave,
    onClose,
}: UsePropertiesEditorProps) => {
    // Ensure initialVariables always have tempId and values/missing are arrays
    const { data: storeData } = useDataStore();
    const { updateMultipleFields } = useVariableStore();

    const prepareInitialVariables = (vars: Variable[]): Variable[] => {
        return vars.map(v => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${Date.now()}`,
            values: Array.isArray(v.values) ? v.values : [],
            missing: v.missing // Keep as is, might be null or an object
        }));
    };

    const [originalVariables] = useState<Variable[]>(prepareInitialVariables(initialVariables));
    const [modifiedVariables, setModifiedVariables] = useState<Variable[]>(prepareInitialVariables(initialVariables));
    
    const [selectedVariableIndex, setSelectedVariableIndex] = useState<number | null>(
        originalVariables.length > 0 ? 0 : null
    );
    
    const [currentVariable, setCurrentVariable] = useState<Variable | null>(null);
    const [variableGridData, setVariableGridData] = useState<Record<string, any[]>>({}); // Use tempId as key
    const [gridData, setGridData] = useState<any[]>([]); // For the current Handsontable instance
    
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showMeasureDropdown, setShowMeasureDropdown] = useState(false);
    const [showDateFormatDropdown, setShowDateFormatDropdown] = useState(false);
    
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
    const [suggestDialogOpen, setSuggestDialogOpen] = useState<boolean>(false);
    const [suggestedMeasure, setSuggestedMeasure] = useState<string>("");
    const [measurementExplanation, setMeasurementExplanation] = useState<string>("");
    const [unlabeledValuesCount, setUnlabeledValuesCount] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<string>("properties");

    // Function to calculate unlabeled values
    const calculateUnlabeledValues = useCallback((uniqueValuesData: {value: string, count: number}[], valueLabels: ValueLabel[]) => {
        const valueLabelsMap = new Map(valueLabels.map(vl => [String(vl.value), vl.label]));
        return uniqueValuesData.filter(item => !valueLabelsMap.has(String(item.value))).length;
    }, []);

    // Effect to update gridData when currentVariable changes
    useEffect(() => {
        if (!currentVariable?.tempId || !currentVariable.type) {
            setGridData([]);
            setUnlabeledValuesCount(0);
            return;
        }

        const currentVarTempId = currentVariable.tempId;

        if (variableGridData[currentVarTempId]) {
            setGridData(variableGridData[currentVarTempId]);
            const valueLabels = (variableGridData[currentVarTempId]
                .filter((row: any[]) => row[4] !== '' && row[5] !== '') || [] )
                .map((row: any[]) => ({
                    variableId: currentVariable.columnIndex,
                    value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                    label: row[5]
                }));
            const uniqueValues = getUniqueValuesWithCounts(storeData, currentVariable.columnIndex, currentVariable.type, caseLimit, valueLimit);
            setUnlabeledValuesCount(calculateUnlabeledValues(uniqueValues, valueLabels));
        } else {
            const uniqueValuesData = getUniqueValuesWithCounts(storeData, currentVariable.columnIndex, currentVariable.type, caseLimit, valueLimit);
            const valueLabelsMap = new Map(
                (currentVariable.values || []).map(vl => [String(vl.value), vl.label])
            );
            const missingValuesSet = new Set<string>();
            if (currentVariable.missing?.discrete) {
                currentVariable.missing.discrete.forEach(mv => missingValuesSet.add(String(mv)));
            }
            const newGridData = uniqueValuesData.map((item: { value: string; count: number }, index: number) => {
                const strValue = String(item.value);
                const label = valueLabelsMap.get(strValue) || '';
                const isMissing = missingValuesSet.has(strValue);
                return [ String(index + 1), false, isMissing, item.count, strValue, label ];
            });
            setGridData(newGridData);
            setVariableGridData(prev => ({ ...prev, [currentVarTempId]: newGridData }));
            setUnlabeledValuesCount(calculateUnlabeledValues(uniqueValuesData, currentVariable.values || []));
        }
    }, [currentVariable, calculateUnlabeledValues, variableGridData, caseLimit, valueLimit, storeData]);

    // Function to save the current variable's state to modifiedVariables list
    const saveCurrentVariableToModifiedList = useCallback(() => {
        if (!currentVariable || selectedVariableIndex === null || !currentVariable.tempId) return modifiedVariables;
        
        const valueLabels: ValueLabel[] = gridData
            .filter(row => row[4] !== '' && row[5] !== '')
            .map(row => ({
                variableId: currentVariable.columnIndex,
                value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                label: row[5]
            }));
        
        const missingDiscreteValues = gridData
            .filter(row => row[2] && row[4] !== '')
            .map(row => isNaN(Number(row[4])) ? String(row[4]) : Number(row[4]));

        const newMissingSpec: MissingValuesSpec | null = 
            (currentVariable.missing?.range !== undefined) ? 
            { ...currentVariable.missing, discrete: missingDiscreteValues.length > 0 ? missingDiscreteValues : undefined } :
            (missingDiscreteValues.length > 0 ? { discrete: missingDiscreteValues } : null);

        const updatedVarInList = {
            ...currentVariable,
            values: valueLabels,
            missing: newMissingSpec,
        };

        const newModifiedVariables = [...modifiedVariables];
        newModifiedVariables[selectedVariableIndex] = updatedVarInList;
        setModifiedVariables(newModifiedVariables);
        setVariableGridData(prev => ({ ...prev, [currentVariable.tempId!]: [...gridData] }));
        return newModifiedVariables;
    }, [currentVariable, selectedVariableIndex, gridData, modifiedVariables]);

    const handleVariableChange = useCallback((index: number) => {
        saveCurrentVariableToModifiedList();
        setSelectedVariableIndex(index);
    }, [saveCurrentVariableToModifiedList]);

    const handleVariableFieldChange = useCallback((field: keyof Variable, value: any) => {
        if (!currentVariable) return;

        const updatedVar = { ...currentVariable, [field]: value };

        if (field === 'type') {
            if (isDateType(value as string)) {
                const defaultFormat = DATE_FORMAT_SPECS.find(spec => spec.type === value);
                if (defaultFormat) updatedVar.width = defaultFormat.width;
            }
            if (value !== currentVariable.type && currentVariable.tempId) {
                setVariableGridData(prev => {
                    const newData = { ...prev };
                    delete newData[currentVariable.tempId!];
                    return newData;
                });
            }
        }
        setCurrentVariable(updatedVar);
    }, [currentVariable]);

    const handleGridDataChange = useCallback((changes: Handsontable.CellChange[] | null, source: Handsontable.ChangeSource) => {
        if (source === 'loadData' || !changes || !currentVariable?.tempId || !currentVariable.type) {
            return;
        }

        const updatedGridData = gridData.map(row => [...row]);

        changes.forEach((changeItem) => {
            const [row, prop, oldValue, newValue] = changeItem;
            const colIndex: number | undefined = typeof prop === 'number' ? prop : parseInt(String(prop), 10);
            
            if (colIndex !== undefined && !isNaN(colIndex) && updatedGridData[row]) {
                updatedGridData[row][colIndex] = newValue;
                if ((colIndex === 4 || colIndex === 5) && newValue !== oldValue) {
                    updatedGridData[row][1] = true; // Mark as changed
                }
            }
        });
        
        setGridData(updatedGridData);

        const currentLabels = updatedGridData
            .filter(row => row[4] !== '' && row[5] !== '')
            .map(row => ({
                variableId: currentVariable.columnIndex,
                value: isNaN(Number(row[4])) ? row[4] : Number(row[4]),
                label: row[5]
            }));
        const uniqueValues = getUniqueValuesWithCounts(storeData, currentVariable.columnIndex, currentVariable.type, caseLimit, valueLimit);
        setUnlabeledValuesCount(calculateUnlabeledValues(uniqueValues, currentLabels));
        
    }, [currentVariable, gridData, caseLimit, valueLimit, calculateUnlabeledValues, storeData]);
    
    const handleAutoLabel = useCallback(() => {
        if (!currentVariable?.tempId || !currentVariable.type) return;
        const newGridData = gridData.map(row => {
            if (row[4] && !row[5]) { 
                return [ row[0], true, row[2], row[3], row[4], row[4] ];
            }
            return [...row]; 
        });
        setGridData(newGridData);
        setVariableGridData(prev => ({ ...prev, [currentVariable.tempId!]: newGridData }));

        const currentLabels = newGridData
            .filter(row => row[4] !== '' && row[5] !== '')
            .map(row => ({ variableId: currentVariable.columnIndex, value: row[4], label: row[5] as string }));
        const uniqueValues = getUniqueValuesWithCounts(storeData, currentVariable.columnIndex, currentVariable.type, caseLimit, valueLimit);
        setUnlabeledValuesCount(calculateUnlabeledValues(uniqueValues, currentLabels));
    }, [gridData, currentVariable, caseLimit, valueLimit, calculateUnlabeledValues, storeData]);

    const handleSuggestMeasurement = useCallback(() => {
        if (!currentVariable) return;
        const suggestion = suggestMeasurementLevel(storeData, currentVariable, caseLimit);
        setSuggestedMeasure(suggestion.level);
        setMeasurementExplanation(suggestion.explanation);
        setSuggestDialogOpen(true);
    }, [currentVariable, caseLimit, storeData]);

    const handleAcceptSuggestion = useCallback(() => {
        if (currentVariable && suggestedMeasure) {
            handleVariableFieldChange('measure', suggestedMeasure as any);
            setSuggestDialogOpen(false);
        }
    }, [currentVariable, suggestedMeasure, handleVariableFieldChange]);

    const handleSave = useCallback(async () => {
        const finalModifiedVariables = saveCurrentVariableToModifiedList();
        try {
            await saveVariableProperties(finalModifiedVariables, originalVariables, updateMultipleFields);
            if (onSave) onSave(finalModifiedVariables);
            onClose();
        } catch (error) {
            console.error("Error saving variables:", error);
            setErrorMessage("Failed to save variable changes.");
            setErrorDialogOpen(true);
        }
    }, [saveCurrentVariableToModifiedList, originalVariables, onSave, onClose, updateMultipleFields]);

    useEffect(() => {
        if (selectedVariableIndex !== null && modifiedVariables[selectedVariableIndex]) {
            setCurrentVariable({ ...modifiedVariables[selectedVariableIndex] });
        } else if (modifiedVariables.length > 0 && selectedVariableIndex === null) {
            setSelectedVariableIndex(0);
        } else if (modifiedVariables.length === 0) {
            setCurrentVariable(null);
            setSelectedVariableIndex(null);
        }
    }, [selectedVariableIndex, modifiedVariables]);

    return {
        modifiedVariables,
        selectedVariableIndex,
        currentVariable,
        gridData,
        setGridData,
        showTypeDropdown, setShowTypeDropdown,
        showRoleDropdown, setShowRoleDropdown,
        showMeasureDropdown, setShowMeasureDropdown,
        showDateFormatDropdown, setShowDateFormatDropdown,
        errorMessage, errorDialogOpen, setErrorDialogOpen,
        suggestDialogOpen, setSuggestDialogOpen, suggestedMeasure, measurementExplanation,
        unlabeledValuesCount,
        activeTab, setActiveTab,
        handleVariableChange,
        handleVariableFieldChange,
        handleGridDataChange,
        handleAutoLabel,
        handleSuggestMeasurement,
        handleAcceptSuggestion,
        handleSave,
    };
};