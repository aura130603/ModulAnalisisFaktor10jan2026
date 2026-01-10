import { useState, useEffect, useCallback } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';
import { prepareNewUnusualCasesVariables } from '../services/unusualCasesService';

export const useUnusualCases = ({ onClose }: { onClose: () => void; }) => {
    const { variables, addVariables } = useVariableStore();

    // Variables Tab State
    const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
    const [analysisVariables, setAnalysisVariables] = useState<Variable[]>([]);
    const [caseIdentifierVariable, setCaseIdentifierVariable] = useState<Variable | null>(null);
    const [highlightedVariable, setHighlightedVariable] = useState<{ tempId: string; source: 'available' | 'analysis' | 'identifier' } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Options Tab State
    const [identificationCriteria, setIdentificationCriteria] = useState("percentage");
    const [percentageValue, setPercentageValue] = useState("5");
    const [fixedNumber, setFixedNumber] = useState("5");
    const [useMinimumValue, setUseMinimumValue] = useState(true);
    const [cutoffValue, setCutoffValue] = useState("2");
    const [minPeerGroups, setMinPeerGroups] = useState("2");
    const [maxPeerGroups, setMaxPeerGroups] = useState("5");
    const [maxReasons, setMaxReasons] = useState("3");

    // Output Tab State
    const [showUnusualCasesList, setShowUnusualCasesList] = useState(true);
    const [peerGroupNorms, setPeerGroupNorms] = useState(true);
    const [anomalyIndices, setAnomalyIndices] = useState(true);
    const [reasonOccurrence, setReasonOccurrence] = useState(true);
    const [caseProcessed, setCaseProcessed] = useState(true);

    // Save Tab State
    const [saveAnomalyIndex, setSaveAnomalyIndex] = useState(false);
    const [anomalyIndexName, setAnomalyIndexName] = useState("AnomalyIndex");
    const [savePeerGroups, setSavePeerGroups] = useState(false);
    const [saveReasons, setSaveReasons] = useState(false);
    const [replaceExisting, setReplaceExisting] = useState(false);

    // Missing Values Tab State
    const [missingValuesOption, setMissingValuesOption] = useState("exclude");
    const [useProportionMissing, setUseProportionMissing] = useState(false);

    // Effect to initialize and update available variables
    useEffect(() => {
        const validVars = variables.filter(v => v.name !== "").map((v, i) => ({
            ...v,
            tempId: v.tempId || `temp_${v.columnIndex}_${Date.now()}_${Math.random()}`
        }));
        const analysisTempIds = new Set(analysisVariables.map(v => v.tempId));
        const identifierTempId = caseIdentifierVariable?.tempId;

        const finalAvailable = validVars.filter(v =>
            v.tempId &&
            !analysisTempIds.has(v.tempId) &&
            (!identifierTempId || v.tempId !== identifierTempId)
        ).sort((a, b) => a.columnIndex - b.columnIndex);
        setAvailableVariables(finalAvailable);
    }, [variables, analysisVariables, caseIdentifierVariable]);

    // Variable Movement Logic
    const moveToAnalysisVariables = useCallback((variable: Variable, targetIndex?: number) => {
        if (!variable.tempId) return;
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setAnalysisVariables(prev => {
            const newList = [...prev];
            if (typeof targetIndex === 'number') newList.splice(targetIndex, 0, variable);
            else newList.push(variable);
            return newList;
        });
        setHighlightedVariable(null);
    }, []);

    const moveToCaseIdentifierVariable = useCallback((variable: Variable) => {
        if (!variable.tempId) return;
        if (caseIdentifierVariable?.tempId) {
            setAvailableVariables(prev => [...prev, caseIdentifierVariable].sort((a, b) => a.columnIndex - b.columnIndex));
        }
        setCaseIdentifierVariable(variable);
        setAvailableVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        setHighlightedVariable(null);
    }, [caseIdentifierVariable]);

    const moveToAvailableVariables = useCallback((variable: Variable, source: 'analysis' | 'identifier', targetIndex?: number) => {
        if (!variable.tempId) return;
        if (source === 'analysis') {
            setAnalysisVariables(prev => prev.filter(v => v.tempId !== variable.tempId));
        } else if (source === 'identifier') {
            setCaseIdentifierVariable(null);
        }
        setAvailableVariables(prev => {
            const newList = [...prev];
            if (typeof targetIndex === 'number') newList.splice(targetIndex, 0, variable);
            else newList.push(variable);
            return newList.sort((a, b) => a.columnIndex - b.columnIndex);
        });
        setHighlightedVariable(null);
    }, []);

    const reorderVariables = useCallback((source: 'analysis', reorderedList: Variable[]) => {
        if (source === 'analysis') setAnalysisVariables(reorderedList);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (analysisVariables.length === 0) {
            setErrorMsg("Please select at least one analysis variable.");
            return; 
        }
        setErrorMsg(null);

        const saveOptions = {
            saveAnomalyIndex,
            anomalyIndexName,
            savePeerGroups,
            saveReasons,
        };

        const { variablesToCreate } = prepareNewUnusualCasesVariables(saveOptions);
        
        if (variablesToCreate.length > 0) {
            // In a full implementation, a worker would perform the analysis 
            // and return cellUpdates to populate the new variables.
            await addVariables(variablesToCreate, []);
        }

        // Placeholder for displaying results in the output pane.
        console.log("Unusual cases analysis would be run here, and results displayed.");

        onClose();
    }, [
        analysisVariables.length,
        saveAnomalyIndex, anomalyIndexName, savePeerGroups, saveReasons,
        addVariables, onClose
    ]);

    // Other handlers
    const handleReset = () => {
        setAnalysisVariables([]);
        setCaseIdentifierVariable(null);
        setErrorMsg(null);
        setIdentificationCriteria("percentage");
        setPercentageValue("5");
        setFixedNumber("5");
        setUseMinimumValue(true);
        setCutoffValue("2");
        setMinPeerGroups("2");
        setMaxPeerGroups("5");
        setMaxReasons("3");
        setShowUnusualCasesList(true);
        setPeerGroupNorms(true);
        setAnomalyIndices(true);
        setReasonOccurrence(true);
        setCaseProcessed(true);
        setSaveAnomalyIndex(false);
        setAnomalyIndexName("AnomalyIndex");
        setSavePeerGroups(false);
        setSaveReasons(false);
        setReplaceExisting(false);
        setMissingValuesOption("exclude");
        setUseProportionMissing(false);
    };

    return {
        // Variables Tab
        availableVariables, analysisVariables, caseIdentifierVariable, highlightedVariable, errorMsg,
        setHighlightedVariable, moveToAnalysisVariables, moveToCaseIdentifierVariable, moveToAvailableVariables, reorderVariables,
        // Options Tab
        identificationCriteria, setIdentificationCriteria, percentageValue, setPercentageValue, fixedNumber, setFixedNumber,
        useMinimumValue, setUseMinimumValue, cutoffValue, setCutoffValue, minPeerGroups, setMinPeerGroups,
        maxPeerGroups, setMaxPeerGroups, maxReasons, setMaxReasons,
        // Output Tab
        showUnusualCasesList, setShowUnusualCasesList, peerGroupNorms, setPeerGroupNorms, anomalyIndices, setAnomalyIndices,
        reasonOccurrence, setReasonOccurrence, caseProcessed, setCaseProcessed,
        // Save Tab
        saveAnomalyIndex, setSaveAnomalyIndex, anomalyIndexName, setAnomalyIndexName, savePeerGroups, setSavePeerGroups,
        saveReasons, setSaveReasons, replaceExisting, setReplaceExisting,
        // Missing Values Tab
        missingValuesOption, setMissingValuesOption, useProportionMissing, setUseProportionMissing,
        // General Actions
        handleReset,
        handleConfirm,
    };
};