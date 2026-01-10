import { useState, useCallback } from 'react';
import {
    GroupSettingsProps,
    DefineGroupsOptions
} from '../types';

export const useGroupSettings = ({
    initialDefineGroups = {
        useSpecifiedValues: false,
        cutPoint: true,
    },
    initialGroup1 = null,
    initialGroup2 = null,
    initialCutPointValue = null,
    initialEstimateEffectSize = false
}: Omit<GroupSettingsProps, 'resetGroupSettings'> = {}) => {
    const [defineGroups, setDefineGroups] = useState<DefineGroupsOptions>(initialDefineGroups);
    const [group1, setGroup1] = useState<number | null>(initialGroup1);
    const [group2, setGroup2] = useState<number | null>(initialGroup2);
    const [cutPointValue, setCutPointValue] = useState<number | null>(initialCutPointValue);
    const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(initialEstimateEffectSize);
    
    const resetGroupSettings = useCallback(() => {
        setDefineGroups(initialDefineGroups);
        setGroup1(initialGroup1);
        setGroup2(initialGroup2);
        setCutPointValue(initialCutPointValue);
        setEstimateEffectSize(initialEstimateEffectSize);
    }, [initialDefineGroups, initialGroup1, initialGroup2, initialCutPointValue, initialEstimateEffectSize]);
    
    return {
        defineGroups,
        setDefineGroups,
        group1,
        setGroup1,
        group2,
        setGroup2,
        cutPointValue,
        setCutPointValue,
        estimateEffectSize,
        setEstimateEffectSize,
        resetGroupSettings
    };
};