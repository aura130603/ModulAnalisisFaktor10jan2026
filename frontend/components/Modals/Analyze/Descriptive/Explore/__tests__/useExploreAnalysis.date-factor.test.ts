import { renderHook, act } from '@testing-library/react';
import { useExploreAnalysis } from '../hooks/useExploreAnalysis';
import type { Variable } from '@/types/Variable';
import { ExploreAnalysisParams } from '../types';

jest.mock('@/stores/useResultStore', () => ({
  __esModule: true,
  useResultStore: () => ({
    addLog: jest.fn(async () => 1),
    addAnalytic: jest.fn(async () => 2),
    addStatistic: jest.fn(async () => 3),
  }),
}));

jest.mock('@/hooks/useAnalysisData', () => ({
  __esModule: true,
  useAnalysisData: () => ({
    // Data layout by columnIndex: [num_scale, date, str]
    data: [
      [10, '01-01-2024', 'A'],
      [20, '02-01-2024', 'B'],
      [15, '01-01-2024', 'A'],
      [25, '02-01-2024', 'B'],
    ],
    weights: null,
  }),
}));

// Mock worker client wrapper to spy on post calls
jest.mock('@/utils/workerClient', () => {
  const handlers: { onMessage?: (d: any) => void; onError?: (e: any) => void }[] = [];
  return {
    __esModule: true,
    createWorkerClient: () => {
      const ref = { onMessage: undefined as any, onError: undefined as any, post: jest.fn(), terminate: jest.fn() };
      handlers.push(ref);
      return {
        onMessage: (fn: any) => { ref.onMessage = fn; },
        onError: (fn: any) => { ref.onError = fn; },
        post: ref.post,
        terminate: ref.terminate,
      } as any;
    },
    // Expose for assertions
    __handlers: handlers,
  };
});

describe('useExploreAnalysis with DATE factor (dd-mm-yyyy)', () => {
  it('groups by DATE values and invokes worker per group', async () => {
    const dep: Variable = { name: 'num_scale', label: 'Num', columnIndex: 0, type: 'NUMERIC', measure: 'scale' } as Variable;
    const dateFactor: Variable = { name: 'date', label: 'Date', columnIndex: 1, type: 'DATE', measure: 'unknown' } as Variable;

    const defaultParams: ExploreAnalysisParams = {
      dependentVariables: [dep],
      factorVariables: [dateFactor],
      labelVariable: null,
      confidenceInterval: '95',
      showDescriptives: true,
      showMEstimators: false,
      showOutliers: false,
      showPercentiles: false,
      boxplotType: 'none',
      showStemAndLeaf: false,
      showHistogram: false,
      showNormalityPlots: false,
    };

    const onClose = jest.fn();
    const { result } = renderHook(() => useExploreAnalysis(defaultParams, onClose));

    let runPromise: Promise<void> | undefined;
    await act(async () => {
      runPromise = result.current.runAnalysis();
      await Promise.resolve();
    });

    // Access handler refs created by our mock
    const handlers = (jest.requireMock('@/utils/workerClient') as any).__handlers as any[];
    // Expect two groups: '01-01-2024' and '02-01-2024'
    expect(handlers.length).toBe(2);

    // First group posts data [10, 15]; second group posts [20, 25]
    const postedDatas = handlers.map(h => (h.post as jest.Mock).mock.calls[0][0].data).sort((a: number[], b: number[]) => a[0] - b[0]);
    expect(postedDatas).toEqual([[10, 15], [20, 25]]);

    // Simulate worker success for both
    await act(async () => {
      handlers.forEach(h => h.onMessage && h.onMessage({ status: 'success', results: { summary: { n: 2 } } }));
      if (runPromise) await runPromise;
    });

    expect(result.current.error).toBeNull();
    expect(onClose).toHaveBeenCalled();
  });
});


