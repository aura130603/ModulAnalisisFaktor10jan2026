import { useState, useCallback } from 'react';
import {
    TestSettingsProps,
    CorrelationCoefficient,
    TestOfSignificance,
    StatisticsOptions,
    MissingValuesOptions,
} from '../types';

export const useTestSettings = ({
    initialCorrelationCoefficient = {
        pearson: true,
        kendallsTauB: false,
        spearman: false
    },
    initialTestOfSignificance = {
        oneTailed: false,
        twoTailed: true
    },
    initialFlagSignificantCorrelations = false,
    initialShowOnlyTheLowerTriangle = false,
    initialShowDiagonal = true,
    initialPartialCorrelationKendallsTauB = false,
    initialStatisticsOptions = {
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: false
    },
    initialMissingValuesOptions = {
        excludeCasesPairwise: true,
        excludeCasesListwise: false
    }
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [correlationCoefficient, setCorrelationCoefficient] = useState<CorrelationCoefficient>(initialCorrelationCoefficient);
    const [testOfSignificance, setTestOfSignificance] = useState<TestOfSignificance>(initialTestOfSignificance);
    const [flagSignificantCorrelations, setFlagSignificantCorrelations] = useState<boolean>(initialFlagSignificantCorrelations);
    const [showOnlyTheLowerTriangle, setShowOnlyTheLowerTriangle] = useState<boolean>(initialShowOnlyTheLowerTriangle);
    const [showDiagonal, setShowDiagonal] = useState<boolean>(initialShowDiagonal);
    const [statisticsOptions, setStatisticsOptions] = useState<StatisticsOptions>(initialStatisticsOptions);
    const [partialCorrelationKendallsTauB, setPartialCorrelationKendallsTauB] = useState<boolean>(initialPartialCorrelationKendallsTauB);
    const [missingValuesOptions, setMissingValuesOptions] = useState<MissingValuesOptions>(initialMissingValuesOptions);

    const resetTestSettings = useCallback(() => {
        setCorrelationCoefficient(initialCorrelationCoefficient);
        setTestOfSignificance(initialTestOfSignificance);
        setFlagSignificantCorrelations(initialFlagSignificantCorrelations);
        setShowOnlyTheLowerTriangle(initialShowOnlyTheLowerTriangle);
        setShowDiagonal(initialShowDiagonal);
        setPartialCorrelationKendallsTauB(initialPartialCorrelationKendallsTauB);
        setStatisticsOptions(initialStatisticsOptions);
        setMissingValuesOptions(initialMissingValuesOptions);
    }, [initialCorrelationCoefficient, initialTestOfSignificance, initialFlagSignificantCorrelations, initialShowOnlyTheLowerTriangle, initialShowDiagonal, initialStatisticsOptions, initialPartialCorrelationKendallsTauB, initialMissingValuesOptions]);
    
    return {
        correlationCoefficient,
        setCorrelationCoefficient,
        testOfSignificance,
        setTestOfSignificance,
        flagSignificantCorrelations,
        setFlagSignificantCorrelations,
        showOnlyTheLowerTriangle,
        setShowOnlyTheLowerTriangle,
        showDiagonal,
        setShowDiagonal,
        partialCorrelationKendallsTauB,
        setPartialCorrelationKendallsTauB,
        statisticsOptions,
        setStatisticsOptions,
        missingValuesOptions,
        setMissingValuesOptions,
        resetTestSettings
    };
};

export default useTestSettings;