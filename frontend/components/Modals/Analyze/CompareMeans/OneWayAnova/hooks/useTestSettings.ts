import { useState, useCallback } from 'react';
import {
    TestSettingsProps,
    StatisticsOptions,
    EqualVariancesAssumedOptions
} from '../types';

export const useTestSettings = ({
    initialEstimateEffectSize = false,
    initialEqualVariancesAssumed = {
        tukey: false,
        duncan: false
    },
    initialStatisticsOptions = {
        descriptive: false,
        homogeneityOfVariance: false
    }
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(initialEstimateEffectSize);
    const [equalVariancesAssumed, setEqualVariancesAssumed] = useState<EqualVariancesAssumedOptions>(initialEqualVariancesAssumed);
    const [statisticsOptions, setStatisticsOptions] = useState<StatisticsOptions>(initialStatisticsOptions);
    
    const resetTestSettings = useCallback(() => {
        setEstimateEffectSize(initialEstimateEffectSize);
        setEqualVariancesAssumed(initialEqualVariancesAssumed);
        setStatisticsOptions(initialStatisticsOptions);
    }, [initialEstimateEffectSize, initialEqualVariancesAssumed, initialStatisticsOptions]);
    
    return {
        estimateEffectSize,
        setEstimateEffectSize,
        equalVariancesAssumed,
        setEqualVariancesAssumed,
        statisticsOptions,
        setStatisticsOptions,
        resetTestSettings
    };
};

export default useTestSettings;