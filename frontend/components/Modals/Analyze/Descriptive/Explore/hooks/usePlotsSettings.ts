import { useState, useCallback } from 'react';

export interface PlotsSettings {
    boxplotType: 'none' | 'dependents-together' | 'factor-levels-together' | 'dependents-separately';
    showStemAndLeaf: boolean;
    showHistogram: boolean;
    showNormalityPlots: boolean;
}

export interface PlotsSettingsHandlers {
    setBoxplotType: (value: 'none' | 'dependents-together' | 'factor-levels-together' | 'dependents-separately') => void;
    setShowStemAndLeaf: (value: boolean) => void;
    setShowHistogram: (value: boolean) => void;
    setShowNormalityPlots: (value: boolean) => void;
    resetPlotsSettings: () => void;
}

export type UsePlotsSettingsResult = PlotsSettings & PlotsSettingsHandlers;

const initialSettings: PlotsSettings = {
    boxplotType: 'none',
    showStemAndLeaf: false,
    showHistogram: false,
    showNormalityPlots: false,
};

export const usePlotsSettings = (): UsePlotsSettingsResult => {
    const [boxplotType, setBoxplotType] = useState<PlotsSettings['boxplotType']>(initialSettings.boxplotType);
    const [showStemAndLeaf, setShowStemAndLeaf] = useState<boolean>(initialSettings.showStemAndLeaf);
    const [showHistogram, setShowHistogram] = useState<boolean>(initialSettings.showHistogram);
    const [showNormalityPlots, setShowNormalityPlots] = useState<boolean>(initialSettings.showNormalityPlots);

    const resetPlotsSettings = useCallback(() => {
        setBoxplotType(initialSettings.boxplotType);
        setShowStemAndLeaf(initialSettings.showStemAndLeaf);
        setShowHistogram(initialSettings.showHistogram);
        setShowNormalityPlots(initialSettings.showNormalityPlots);
    }, []);

    return {
        boxplotType,
        setBoxplotType,
        showStemAndLeaf,
        setShowStemAndLeaf,
        showHistogram,
        setShowHistogram,
        showNormalityPlots,
        setShowNormalityPlots,
        resetPlotsSettings
    };
};