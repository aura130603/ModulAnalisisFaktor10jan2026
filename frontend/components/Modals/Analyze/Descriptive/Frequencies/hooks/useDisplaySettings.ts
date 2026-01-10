import { useState, useCallback } from 'react';

export interface DisplaySettings {
    showFrequencyTables: boolean;
}

export interface DisplaySettingsResult extends DisplaySettings {
    setShowFrequencyTables: React.Dispatch<React.SetStateAction<boolean>>;
    resetDisplaySettings: () => void;
}

export const useDisplaySettings = (
    initialSettings: Partial<DisplaySettings> = {}
): DisplaySettingsResult => {
    const [showFrequencyTables, setShowFrequencyTables] = useState(
        initialSettings.showFrequencyTables ?? true
    );

    const resetDisplaySettings = useCallback(() => {
        setShowFrequencyTables(true);
    }, []);

    return {
        showFrequencyTables,
        setShowFrequencyTables,
        resetDisplaySettings,
    };
}; 