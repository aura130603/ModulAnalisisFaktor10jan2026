import { renderHook, act } from '@testing-library/react';
import { useTestSettings } from '../hooks/useTestSettings';
import { CorrelationCoefficient, TestOfSignificance, StatisticsOptions, MissingValuesOptions } from '../types';

describe('useTestSettings hook', () => {
  const initialCorrelationCoefficient: CorrelationCoefficient = {
    pearson: true,
    kendallsTauB: false,
    spearman: false
  };

  const initialTestOfSignificance: TestOfSignificance = {
    oneTailed: false,
    twoTailed: true
  };

  const initialStatisticsOptions: StatisticsOptions = {
    meansAndStandardDeviations: true,
    crossProductDeviationsAndCovariances: false
  };

  const initialMissingValuesOptions: MissingValuesOptions = {
    excludeCasesPairwise: true,
    excludeCasesListwise: false
  };

  it('should initialize with default values when no params provided', () => {
    const { result } = renderHook(() => useTestSettings());
    
    expect(result.current.correlationCoefficient).toEqual({
      pearson: true,
      kendallsTauB: false,
      spearman: false
    });
    expect(result.current.testOfSignificance).toEqual({
      oneTailed: false,
      twoTailed: true
    });
    expect(result.current.flagSignificantCorrelations).toBe(false);
    expect(result.current.showOnlyTheLowerTriangle).toBe(false);
    expect(result.current.showDiagonal).toBe(true);
    expect(result.current.partialCorrelationKendallsTauB).toBe(false);
    expect(result.current.statisticsOptions).toEqual({
      meansAndStandardDeviations: false,
      crossProductDeviationsAndCovariances: false
    });
    expect(result.current.missingValuesOptions).toEqual({
      excludeCasesPairwise: true,
      excludeCasesListwise: false
    });
  });

  it('should initialize with provided values', () => {
    const { result } = renderHook(() => useTestSettings({
      initialCorrelationCoefficient,
      initialTestOfSignificance,
      initialStatisticsOptions,
      initialMissingValuesOptions
    }));
    
    expect(result.current.correlationCoefficient).toEqual(initialCorrelationCoefficient);
    expect(result.current.testOfSignificance).toEqual(initialTestOfSignificance);
    expect(result.current.statisticsOptions).toEqual(initialStatisticsOptions);
    expect(result.current.missingValuesOptions).toEqual(initialMissingValuesOptions);
  });

  it('should update correlationCoefficient when setCorrelationCoefficient is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    const newCorrelationCoefficient: CorrelationCoefficient = {
      pearson: true,
      kendallsTauB: true,
      spearman: false
    };
    
    act(() => {
      result.current.setCorrelationCoefficient(newCorrelationCoefficient);
    });
    
    expect(result.current.correlationCoefficient).toEqual(newCorrelationCoefficient);
  });

  it('should update testOfSignificance when setTestOfSignificance is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    const newTestOfSignificance: TestOfSignificance = {
      oneTailed: true,
      twoTailed: false
    };
    
    act(() => {
      result.current.setTestOfSignificance(newTestOfSignificance);
    });
    
    expect(result.current.testOfSignificance).toEqual(newTestOfSignificance);
  });

  it('should update flagSignificantCorrelations when setFlagSignificantCorrelations is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    act(() => {
      result.current.setFlagSignificantCorrelations(true);
    });
    
    expect(result.current.flagSignificantCorrelations).toBe(true);
  });

  it('should update showOnlyTheLowerTriangle when setShowOnlyTheLowerTriangle is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    act(() => {
      result.current.setShowOnlyTheLowerTriangle(true);
    });
    
    expect(result.current.showOnlyTheLowerTriangle).toBe(true);
  });

  it('should update showDiagonal when setShowDiagonal is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    act(() => {
      result.current.setShowDiagonal(false);
    });
    
    expect(result.current.showDiagonal).toBe(false);
  });

  it('should update partialCorrelationKendallsTauB when setPartialCorrelationKendallsTauB is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    act(() => {
      result.current.setPartialCorrelationKendallsTauB(true);
    });
    
    expect(result.current.partialCorrelationKendallsTauB).toBe(true);
  });

  it('should update statisticsOptions when setStatisticsOptions is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    const newStatisticsOptions: StatisticsOptions = {
      meansAndStandardDeviations: true,
      crossProductDeviationsAndCovariances: true
    };
    
    act(() => {
      result.current.setStatisticsOptions(newStatisticsOptions);
    });
    
    expect(result.current.statisticsOptions).toEqual(newStatisticsOptions);
  });

  it('should update missingValuesOptions when setMissingValuesOptions is called', () => {
    const { result } = renderHook(() => useTestSettings());
    
    const newMissingValuesOptions: MissingValuesOptions = {
      excludeCasesPairwise: false,
      excludeCasesListwise: true
    };
    
    act(() => {
      result.current.setMissingValuesOptions(newMissingValuesOptions);
    });
    
    expect(result.current.missingValuesOptions).toEqual(newMissingValuesOptions);
  });

  it('should reset all values when resetTestSettings is called', () => {
    const { result } = renderHook(() => useTestSettings({
      initialCorrelationCoefficient,
      initialTestOfSignificance,
      initialStatisticsOptions,
      initialMissingValuesOptions
    }));
    
    // Change values
    act(() => {
      result.current.setCorrelationCoefficient({
        pearson: false,
        kendallsTauB: true,
        spearman: true
      });
      result.current.setTestOfSignificance({
        oneTailed: true,
        twoTailed: false
      });
      result.current.setFlagSignificantCorrelations(true);
      result.current.setShowOnlyTheLowerTriangle(true);
      result.current.setShowDiagonal(false);
      result.current.setPartialCorrelationKendallsTauB(true);
      result.current.setStatisticsOptions({
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: true
      });
      result.current.setMissingValuesOptions({
        excludeCasesPairwise: false,
        excludeCasesListwise: true
      });
    });
    
    // Reset values
    act(() => {
      result.current.resetTestSettings();
    });
    
    // Verify reset to initial values
    expect(result.current.correlationCoefficient).toEqual(initialCorrelationCoefficient);
    expect(result.current.testOfSignificance).toEqual(initialTestOfSignificance);
    expect(result.current.statisticsOptions).toEqual(initialStatisticsOptions);
    expect(result.current.missingValuesOptions).toEqual(initialMissingValuesOptions);
  });

  it('should handle partial updates to correlationCoefficient', () => {
    const { result } = renderHook(() => useTestSettings({
      initialCorrelationCoefficient
    }));
    
    act(() => {
      result.current.setCorrelationCoefficient(prev => ({
        ...prev,
        spearman: true
      }));
    });
    
    expect(result.current.correlationCoefficient).toEqual({
      pearson: true,
      kendallsTauB: false,
      spearman: true
    });
  });

  it('should handle partial updates to statisticsOptions', () => {
    const { result } = renderHook(() => useTestSettings({
      initialStatisticsOptions
    }));
    
    act(() => {
      result.current.setStatisticsOptions(prev => ({
        ...prev,
        crossProductDeviationsAndCovariances: true
      }));
    });
    
    expect(result.current.statisticsOptions).toEqual({
      meansAndStandardDeviations: true,
      crossProductDeviationsAndCovariances: true
    });
  });
}); 