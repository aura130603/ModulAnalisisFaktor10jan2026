import { useState, useCallback } from 'react';
import type { StatisticsOptions } from '../types';

export interface StatisticsSettingsProps {
  initialShowStatistics?: boolean;
  initialQuartiles?: boolean;
  initialCutPoints?: boolean;
  initialCutPointsValue?: string;
  initialEnablePercentiles?: boolean;
  initialPercentileValues?: string[];
  initialMean?: boolean;
  initialMedian?: boolean;
  initialMode?: boolean;
  initialSum?: boolean;
  initialStdDev?: boolean;
  initialVariance?: boolean;
  initialRange?: boolean;
  initialMin?: boolean;
  initialMax?: boolean;
  initialSeMean?: boolean;
  initialSkewness?: boolean;
  initialKurtosis?: boolean;
}

export interface StatisticsSettingsResult {
  showStatistics: boolean;
  setShowStatistics: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Percentiles
  quartilesChecked: boolean;
  setQuartilesChecked: React.Dispatch<React.SetStateAction<boolean>>;
  cutPointsChecked: boolean;
  setCutPointsChecked: React.Dispatch<React.SetStateAction<boolean>>;
  cutPointsValue: string;
  setCutPointsValue: React.Dispatch<React.SetStateAction<string>>;
  enablePercentiles: boolean;
  setEnablePercentiles: React.Dispatch<React.SetStateAction<boolean>>;
  percentileValues: string[];
  setPercentileValues: React.Dispatch<React.SetStateAction<string[]>>;
  currentPercentileInput: string;
  setCurrentPercentileInput: React.Dispatch<React.SetStateAction<string>>;
  selectedPercentileItem: string | null;
  setSelectedPercentileItem: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Central Tendency
  meanChecked: boolean;
  setMeanChecked: React.Dispatch<React.SetStateAction<boolean>>;
  medianChecked: boolean;
  setMedianChecked: React.Dispatch<React.SetStateAction<boolean>>;
  modeChecked: boolean;
  setModeChecked: React.Dispatch<React.SetStateAction<boolean>>;
  sumChecked: boolean;
  setSumChecked: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Dispersion
  stdDevChecked: boolean;
  setStdDevChecked: React.Dispatch<React.SetStateAction<boolean>>;
  varianceChecked: boolean;
  setVarianceChecked: React.Dispatch<React.SetStateAction<boolean>>;
  rangeChecked: boolean;
  setRangeChecked: React.Dispatch<React.SetStateAction<boolean>>;
  minChecked: boolean;
  setMinChecked: React.Dispatch<React.SetStateAction<boolean>>;
  maxChecked: boolean;
  setMaxChecked: React.Dispatch<React.SetStateAction<boolean>>;
  seMeanChecked: boolean;
  setSeMeanChecked: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Distribution
  skewnessChecked: boolean;
  setSkewnessChecked: React.Dispatch<React.SetStateAction<boolean>>;
  kurtosisChecked: boolean;
  setKurtosisChecked: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Functions
  getCurrentStatisticsOptions: () => StatisticsOptions | null;
  resetStatisticsSettings: () => void;
}

export const useStatisticsSettings = ({
  initialShowStatistics = true,
  initialQuartiles = false,
  initialCutPoints = false,
  initialCutPointsValue = "10",
  initialEnablePercentiles = false,
  initialPercentileValues = [],
  initialMean = false,
  initialMedian = false,
  initialMode = false,
  initialSum = false,
  initialStdDev = false,
  initialVariance = false,
  initialRange = false,
  initialMin = false,
  initialMax = false,
  initialSeMean = false,
  initialSkewness = false,
  initialKurtosis = false
}: StatisticsSettingsProps = {}): StatisticsSettingsResult => {
  // Main settings
  const [showStatistics, setShowStatistics] = useState<boolean>(initialShowStatistics);
  
  // Percentiles
  const [quartilesChecked, setQuartilesChecked] = useState<boolean>(initialQuartiles);
  const [cutPointsChecked, setCutPointsChecked] = useState<boolean>(initialCutPoints);
  const [cutPointsValue, setCutPointsValue] = useState<string>(initialCutPointsValue);
  const [enablePercentiles, setEnablePercentiles] = useState<boolean>(initialEnablePercentiles);
  const [percentileValues, setPercentileValues] = useState<string[]>(initialPercentileValues);
  const [currentPercentileInput, setCurrentPercentileInput] = useState<string>("");
  const [selectedPercentileItem, setSelectedPercentileItem] = useState<string | null>(null);
  
  // Central Tendency
  const [meanChecked, setMeanChecked] = useState<boolean>(initialMean);
  const [medianChecked, setMedianChecked] = useState<boolean>(initialMedian);
  const [modeChecked, setModeChecked] = useState<boolean>(initialMode);
  const [sumChecked, setSumChecked] = useState<boolean>(initialSum);
  
  // Dispersion
  const [stdDevChecked, setStdDevChecked] = useState<boolean>(initialStdDev);
  const [varianceChecked, setVarianceChecked] = useState<boolean>(initialVariance);
  const [rangeChecked, setRangeChecked] = useState<boolean>(initialRange);
  const [minChecked, setMinChecked] = useState<boolean>(initialMin);
  const [maxChecked, setMaxChecked] = useState<boolean>(initialMax);
  const [seMeanChecked, setSeMeanChecked] = useState<boolean>(initialSeMean);
  
  // Distribution
  const [skewnessChecked, setSkewnessChecked] = useState<boolean>(initialSkewness);
  const [kurtosisChecked, setKurtosisChecked] = useState<boolean>(initialKurtosis);

  // Get current statistics options for analysis
  const getCurrentStatisticsOptions = useCallback((): StatisticsOptions | null => {
    if (!showStatistics) return null;
    
    return {
      percentileValues: {
        quartiles: quartilesChecked,
        cutPoints: cutPointsChecked,
        cutPointsN: parseInt(cutPointsValue, 10) || 10,
        enablePercentiles: enablePercentiles,
        percentilesList: percentileValues,
      },
      centralTendency: {
        mean: meanChecked,
        median: medianChecked,
        mode: modeChecked,
        sum: sumChecked,
      },
      dispersion: {
        stddev: stdDevChecked,
        variance: varianceChecked,
        range: rangeChecked,
        minimum: minChecked,
        maximum: maxChecked,
        stdErrorMean: seMeanChecked,
      },
      distribution: {
        skewness: skewnessChecked,
        stdErrorSkewness: skewnessChecked,
        kurtosis: kurtosisChecked,
        stdErrorKurtosis: kurtosisChecked,
      },
    };
  }, [
    showStatistics,
    quartilesChecked, cutPointsChecked, cutPointsValue, enablePercentiles, percentileValues,
    meanChecked, medianChecked, modeChecked, sumChecked,
    stdDevChecked, varianceChecked, rangeChecked, minChecked, maxChecked, seMeanChecked,
    kurtosisChecked, skewnessChecked,
  ]);

  // Reset all settings to default values
  const resetStatisticsSettings = useCallback(() => {
    setShowStatistics(true);
    
    setQuartilesChecked(false);
    setCutPointsChecked(false);
    setCutPointsValue("10");
    setEnablePercentiles(false);
    setPercentileValues([]);
    setCurrentPercentileInput("");
    setSelectedPercentileItem(null);
    
    setMeanChecked(false);
    setMedianChecked(false);
    setModeChecked(false);
    setSumChecked(false);
    
    setStdDevChecked(false);
    setVarianceChecked(false);
    setRangeChecked(false);
    setMinChecked(false);
    setMaxChecked(false);
    setSeMeanChecked(false);
    
    setSkewnessChecked(false);
    setKurtosisChecked(false);
  }, []);

  return {
    showStatistics,
    setShowStatistics,
    
    quartilesChecked,
    setQuartilesChecked,
    cutPointsChecked,
    setCutPointsChecked,
    cutPointsValue,
    setCutPointsValue,
    enablePercentiles,
    setEnablePercentiles,
    percentileValues,
    setPercentileValues,
    currentPercentileInput,
    setCurrentPercentileInput,
    selectedPercentileItem,
    setSelectedPercentileItem,
    
    meanChecked,
    setMeanChecked,
    medianChecked,
    setMedianChecked,
    modeChecked,
    setModeChecked,
    sumChecked,
    setSumChecked,
    
    stdDevChecked,
    setStdDevChecked,
    varianceChecked,
    setVarianceChecked,
    rangeChecked,
    setRangeChecked,
    minChecked,
    setMinChecked,
    maxChecked,
    setMaxChecked,
    seMeanChecked,
    setSeMeanChecked,
    
    skewnessChecked,
    setSkewnessChecked,
    kurtosisChecked,
    setKurtosisChecked,
    
    getCurrentStatisticsOptions,
    resetStatisticsSettings
  };
}; 