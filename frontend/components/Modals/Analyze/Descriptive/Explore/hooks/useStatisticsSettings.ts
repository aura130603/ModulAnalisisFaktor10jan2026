import { useState, useCallback } from 'react';

export interface StatisticsSettings {
    showDescriptives: boolean;
    confidenceInterval: string;
    showMEstimators: boolean;
    showOutliers: boolean;
    showPercentiles: boolean;
}

export interface StatisticsSettingsHandlers {
    setShowDescriptives: (value: boolean) => void;
    setConfidenceInterval: (value: string) => void;
    setShowMEstimators: (value: boolean) => void;
    setShowOutliers: (value: boolean) => void;
    setShowPercentiles: (value: boolean) => void;
    resetStatisticsSettings: () => void;
}

export type UseStatisticsSettingsResult = StatisticsSettings & StatisticsSettingsHandlers;

const initialSettings: StatisticsSettings = {
    showDescriptives: true,
    confidenceInterval: '95',
    showMEstimators: false,
    showOutliers: false,
    showPercentiles: false,
};

export const useStatisticsSettings = (): UseStatisticsSettingsResult => {
    const [showDescriptives, setShowDescriptives] = useState<boolean>(initialSettings.showDescriptives);
    const [confidenceInterval, setConfidenceInterval] = useState<string>(initialSettings.confidenceInterval);
    const [showMEstimators, setShowMEstimators] = useState<boolean>(initialSettings.showMEstimators);
    const [showOutliers, setShowOutliers] = useState<boolean>(initialSettings.showOutliers);
    const [showPercentiles, setShowPercentiles] = useState<boolean>(initialSettings.showPercentiles);

    const resetStatisticsSettings = useCallback(() => {
        setShowDescriptives(initialSettings.showDescriptives);
        setConfidenceInterval(initialSettings.confidenceInterval);
        setShowMEstimators(initialSettings.showMEstimators);
        setShowOutliers(initialSettings.showOutliers);
        setShowPercentiles(initialSettings.showPercentiles);
    }, []);

    return {
        showDescriptives,
        setShowDescriptives,
        confidenceInterval,
        setConfidenceInterval,
        showMEstimators,
        setShowMEstimators,
        showOutliers,
        setShowOutliers,
        showPercentiles,
        setShowPercentiles,
        resetStatisticsSettings
    };
}; 