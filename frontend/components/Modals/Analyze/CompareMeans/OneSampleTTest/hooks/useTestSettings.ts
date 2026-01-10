import { useState, useCallback } from 'react';
import {
  TestSettingsProps
} from '../types';

export const useTestSettings = ({
  initialTestValue = 0,
  initialEstimateEffectSize = false
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
  const [testValue, setTestValue] = useState<number>(initialTestValue);
  const [estimateEffectSize, setEstimateEffectSize] = useState<boolean>(initialEstimateEffectSize);

  const resetTestSettings = useCallback(() => {
    setTestValue(initialTestValue);
    setEstimateEffectSize(initialEstimateEffectSize);
  }, [initialTestValue, initialEstimateEffectSize]);

  return {
    testValue,
    setTestValue,
    estimateEffectSize,
    setEstimateEffectSize,
    resetTestSettings
  };
};

export default useTestSettings; 