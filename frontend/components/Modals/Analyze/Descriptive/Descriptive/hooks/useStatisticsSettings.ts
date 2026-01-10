import { useState } from 'react';
import { 
  DescriptiveStatisticsOptions, 
  DisplayOrderType, 
  StatisticsSettingsProps, 
  StatisticsSettingsResult 
} from '../types';

export const useStatisticsSettings = ({
  initialDisplayStatistics = {},
  initialDisplayOrder = 'variableList',
  initialSaveStandardized = false
}: Omit<StatisticsSettingsProps, 'resetStatisticsSettings'> = {}) => {
  const defaultStatistics: DescriptiveStatisticsOptions = {
    mean: true,
    stdDev: true,
    minimum: true,
    maximum: true,
    variance: false,
    range: false,
    sum: false,
    median: false,
    skewness: false,
    kurtosis: false,
    standardError: false,
    ...initialDisplayStatistics
  };

  const [displayStatistics, setDisplayStatistics] = useState<DescriptiveStatisticsOptions>(defaultStatistics);
  const [displayOrder, setDisplayOrder] = useState<DisplayOrderType>(initialDisplayOrder);
  const [saveStandardized, setSaveStandardized] = useState(initialSaveStandardized);

  const resetStatisticsSettings = () => {
    setDisplayStatistics(defaultStatistics);
    setDisplayOrder('variableList');
    setSaveStandardized(false);
  };

  const updateStatistic = (key: keyof DescriptiveStatisticsOptions, value: boolean) => {
    setDisplayStatistics(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    displayStatistics,
    setDisplayStatistics,
    updateStatistic,
    displayOrder,
    setDisplayOrder,
    saveStandardized,
    setSaveStandardized,
    resetStatisticsSettings
  };
}; 