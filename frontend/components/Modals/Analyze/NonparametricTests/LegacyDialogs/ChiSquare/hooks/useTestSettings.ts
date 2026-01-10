import { useState, useCallback } from 'react';
import {
  TestSettingsProps,
  ExpectedRangeOptions,
  RangeValueOptions,
  ExpectedValueOptions,
  DisplayStatisticsOptions,
} from '../types';

export const useTestSettings = ({
    initialExpectedRange = {
        getFromData: true,
        useSpecifiedRange: false
    },
    initialRangeValue = {
        lowerValue: null,
        upperValue: null
    },
    initialExpectedValue = {
        allCategoriesEqual: true,
        values: false,
        inputValue: null
    },
    initialExpectedValueList = [],
    initialDisplayStatistics = {
        descriptive: false,
        quartiles: false
    }
}: Omit<TestSettingsProps, 'resetTestSettings'> = {}) => {
    const [expectedRange, setExpectedRange] = useState<ExpectedRangeOptions>(initialExpectedRange);
    const [rangeValue, setRangeValue] = useState<RangeValueOptions>(initialRangeValue);
    const [expectedValue, setExpectedValue] = useState<ExpectedValueOptions>(initialExpectedValue);
    const [expectedValueList, setExpectedValueList] = useState<number[]>(initialExpectedValueList);
    const [displayStatistics, setDisplayStatistics] = useState<DisplayStatisticsOptions>(initialDisplayStatistics);
    const [highlightedExpectedValueIndex, setHighlightedExpectedValueIndex] = useState<number | null>(null);

    const addExpectedValue = useCallback(() => {
        if (expectedValue.inputValue !== null && expectedValue.inputValue !== 0) {
            setExpectedValueList(prev => [...prev, expectedValue.inputValue as number]);
            setExpectedValue(prev => ({ ...prev, inputValue: null }));
        }
        setHighlightedExpectedValueIndex(null);
    }, [expectedValue.inputValue]);

    const removeExpectedValue = useCallback((value: number) => {
        setExpectedValueList(prev => {
            const index = prev.indexOf(value);
            if (index !== -1) {
                return [...prev.slice(0, index), ...prev.slice(index + 1)];
            }
            return prev;
        });
        setHighlightedExpectedValueIndex(null);
    }, []);

    const changeExpectedValue = useCallback((oldValue: number) => {
        if (expectedValue.inputValue !== null) {
            setExpectedValueList(prev => {
                const index = prev.indexOf(oldValue);
                if (index !== -1) {
                    const newList = [...prev];
                    newList[index] = expectedValue.inputValue as number;
                    return newList;
                }
                return prev;
            });
            setExpectedValue(prev => ({ ...prev, inputValue: null }));
        }
        setHighlightedExpectedValueIndex(null);
    }, [expectedValue.inputValue]);

    const resetTestSettings = useCallback(() => {
        setExpectedRange(initialExpectedRange);
        setRangeValue(initialRangeValue);
        setExpectedValue(initialExpectedValue);
        setExpectedValueList(initialExpectedValueList);
        setDisplayStatistics(initialDisplayStatistics);
        setHighlightedExpectedValueIndex(null);
    }, [initialExpectedRange, initialRangeValue, initialExpectedValue, initialExpectedValueList, initialDisplayStatistics]);

    return {
        expectedRange,
        setExpectedRange,
        rangeValue,
        setRangeValue,
        expectedValue,
        setExpectedValue,
        expectedValueList,
        setExpectedValueList,
        displayStatistics,
        setDisplayStatistics,
        highlightedExpectedValueIndex,
        setHighlightedExpectedValueIndex,
        addExpectedValue,
        removeExpectedValue,
        changeExpectedValue,
        resetTestSettings
    };
};

export default useTestSettings; 