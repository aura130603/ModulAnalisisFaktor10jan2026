// /hooks/useOptimizedSubscription.ts
import { useEffect, useRef, useMemo, useState } from 'react';
import { shallow } from 'zustand/shallow';

type Selector<T, U> = (state: T) => U;
type EqualityFn<T> = (a: T, b: T) => boolean;

/**
 * Optimized subscription hook that minimizes re-renders
 * Uses shallow comparison by default and allows custom equality functions
 */
export const useOptimizedSubscription = <T, U>(
  useStore: (selector: Selector<T, U>, equalityFn?: EqualityFn<U>) => U,
  selector: Selector<T, U>,
  equalityFn: EqualityFn<U> = shallow
): U => {
  return useStore(selector, equalityFn);
};

/**
 * Debounced subscription hook for high-frequency updates
 */
export const useDebouncedSubscription = <T, U>(
  useStore: (selector: Selector<T, U>, equalityFn?: EqualityFn<U>) => U,
  selector: Selector<T, U>,
  delay: number = 100,
  equalityFn: EqualityFn<U> = shallow
): U => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const valueRef = useRef<U>();
  const [debouncedValue, setDebouncedValue] = useState<U>();
  
  const currentValue = useStore(selector, equalityFn);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (!equalityFn(currentValue, valueRef.current!)) {
        valueRef.current = currentValue;
        setDebouncedValue(currentValue);
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentValue, delay, equalityFn]);
  
  return debouncedValue ?? currentValue;
};

/**
 * Memoized selector hook that prevents unnecessary selector recreations
 */
export const useMemoizedSelector = <T, U>(
  selectorFactory: () => Selector<T, U>,
  deps: React.DependencyList
): Selector<T, U> => {
  return useMemo(selectorFactory, deps);
};

/**
 * Conditional subscription hook - only subscribes when condition is met
 */
export const useConditionalSubscription = <T, U>(
  useStore: (selector: Selector<T, U>, equalityFn?: EqualityFn<U>) => U,
  selector: Selector<T, U>,
  condition: boolean,
  fallbackValue: U,
  equalityFn: EqualityFn<U> = shallow
): U => {
  const conditionalSelector = useMemo(() => {
    if (!condition) {
      return () => fallbackValue;
    }
    return selector;
  }, [condition, selector, fallbackValue]);
  
  return useStore(conditionalSelector, equalityFn);
};

/**
 * Batch subscription hook for related data that should update together
 */
export const useBatchedSubscription = <T>(
  useStore: any,
  selectors: Record<string, (state: any) => any>,
  equalityFn: EqualityFn<T> = shallow
) => {
  const batchSelector = useMemo(() => {
    return (state: any) => {
      const result = {} as Record<string, any>;
      for (const [key, selector] of Object.entries(selectors)) {
        result[key] = selector(state);
      }
      return result;
    };
  }, [selectors]);
  
  return useStore(batchSelector, equalityFn);
};

// Specific optimized selectors for data table
export const useDataTableSelectors = () => {
  const dataSelector = useMemoizedSelector(
    () => (state: any) => ({
      data: state.data,
      isLoading: state.isLoading,
      hasUnsavedChanges: state.hasUnsavedChanges
    }),
    []
  );
  
  const variableSelector = useMemoizedSelector(
    () => (state: any) => ({
      variables: state.variables,
      isLoading: state.isLoading
    }),
    []
  );
  
  const dimensionSelector = useMemoizedSelector(
    () => (state: any) => ({
      numRows: state.data?.length || 0,
      numCols: state.variables?.length || 0
    }),
    []
  );
  
  return {
    dataSelector,
    variableSelector,
    dimensionSelector
  };
};