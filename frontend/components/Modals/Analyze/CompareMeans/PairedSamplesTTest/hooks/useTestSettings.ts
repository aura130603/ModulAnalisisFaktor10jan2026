import { useState, useCallback } from 'react';
import {
    TestSettingsProps,
    CalculateStandardizer,
} from '../types';

export const useTestSettings = ({
    initialEstimateEffectSize = false,
    initialCalculateStandardizer = {
        standardDeviation: true,
        correctedStandardDeviation: false,
        averageOfVariances: false
    },
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(initialEstimateEffectSize);
    const [calculateStandardizer, setCalculateStandardizer] = useState<CalculateStandardizer>(initialCalculateStandardizer);
    
    const resetTestSettings = useCallback(() => {
        setEstimateEffectSize(initialEstimateEffectSize);
        setCalculateStandardizer(initialCalculateStandardizer);
    }, [initialEstimateEffectSize, initialCalculateStandardizer]);
    
    return {
        estimateEffectSize,
        setEstimateEffectSize,
        calculateStandardizer,
        setCalculateStandardizer,
        resetTestSettings
    };
};

export default useTestSettings;