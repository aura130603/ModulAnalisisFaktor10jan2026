import { useState, useCallback } from 'react';
import {
  TestSettingsProps,
  CutPointOptions,
  DisplayStatisticsOptions,
} from '../types';

export const useTestSettings = ({
  initialCutPoint = {
    median: true,
    mode: false,
    mean: false,
    custom: false
  },
  initialCustomValue = 0,
  initialDisplayStatistics = {
    descriptive: false,
    quartiles: false
  }
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
  const [cutPoint, setCutPoint] = useState<CutPointOptions>(initialCutPoint);
  const [customValue, setCustomValue] = useState<number>(initialCustomValue);
  const [displayStatistics, setDisplayStatistics] = useState<DisplayStatisticsOptions>(initialDisplayStatistics);

  const resetTestSettings = useCallback(() => {
    setCutPoint(initialCutPoint);
    setCustomValue(initialCustomValue);
    setDisplayStatistics(initialDisplayStatistics);
  }, [initialCutPoint, initialCustomValue, initialDisplayStatistics]);

  return {
    cutPoint,
    setCutPoint,
    customValue,
    setCustomValue,
    displayStatistics,
    setDisplayStatistics,
    resetTestSettings
  };
};

export default useTestSettings; 