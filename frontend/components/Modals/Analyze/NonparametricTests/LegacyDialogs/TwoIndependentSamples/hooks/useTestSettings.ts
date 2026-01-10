import { useState, useCallback } from 'react';
import {
    TestSettingsProps,
    TestType,
    DisplayStatisticsOptions
} from '../types';

export const useTestSettings = ({
    initialGroup1 = null,
    initialGroup2 = null,
    initialTestType = {
        mannWhitneyU: true,
        mosesExtremeReactions: false,
        kolmogorovSmirnovZ: false,
        waldWolfowitzRuns: false
    },
    initialDisplayStatistics = {
        descriptive: false,
        quartiles: false
    }
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [group1, setGroup1] = useState<number | null>(initialGroup1);
    const [group2, setGroup2] = useState<number | null>(initialGroup2);
    const [testType, setTestType] = useState<TestType>(initialTestType);
    const [displayStatistics, setDisplayStatistics] = useState<DisplayStatisticsOptions>(initialDisplayStatistics);
    
    const resetTestSettings = useCallback(() => {
        setTestType(initialTestType);
        setDisplayStatistics(initialDisplayStatistics);
    }, [initialTestType, initialDisplayStatistics]);
    
    return {
        group1,
        setGroup1,
        group2,
        setGroup2,
        testType,
        setTestType,
        displayStatistics,
        setDisplayStatistics,
        resetTestSettings
    };
};

export default useTestSettings;