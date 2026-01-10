import { processAndAddCharts } from '../utils/chartProcessor';

// Mock useResultStore to capture addStatistic calls
jest.mock('@/stores/useResultStore', () => {
  let addStatistic = jest.fn();
  return {
    __esModule: true,
    useResultStore: Object.assign(jest.fn(), {
      getState: () => ({ addStatistic }),
    }),
  };
});

// Mock ChartService and DataProcessingService used by chartProcessor
jest.mock('@/services/chart/ChartService', () => ({
  __esModule: true,
  ChartService: {
    createChartJSON: jest.fn().mockImplementation(({ chartType, chartData, chartMetadata }) => ({
      type: chartType,
      data: chartData,
      meta: chartMetadata,
    })),
  },
}));

jest.mock('@/services/chart/DataProcessingService', () => ({
  __esModule: true,
  DataProcessingService: {
    processDataForChart: jest.fn().mockImplementation(({ rawData }) => ({
      data: rawData,
      axisInfo: { x: {}, y: {} },
    })),
  },
}));

describe('chartProcessor histogram with dd-mm-yyyy labels', () => {
  it('converts dd-mm-yyyy labels to SPSS seconds and produces a Histogram chart', async () => {
    const frequencyTables = {
      dateVar: {
        title: 'DateVar Frequencies',
        rows: [
          { label: '01-01-2020', frequency: 2 },
          { label: '15-06-2020', frequency: 1 },
        ],
        summary: { valid: 3, missing: 0, total: 3 },
      },
    } as any;

    const options = { type: 'histograms', values: 'frequencies', showNormalCurveOnHistogram: false } as const;

    await processAndAddCharts(123, frequencyTables, options);

    const { useResultStore } = await import('@/stores/useResultStore');
    const { getState } = useResultStore as any;
    const { addStatistic } = getState();

    expect(addStatistic).toHaveBeenCalled();
    const call = addStatistic.mock.calls.find((c: any[]) => c[1].components === 'Histogram');
    expect(call).toBeDefined();
    // Title should be prefixed with chart type label
    expect(call[1].title).toContain('Histogram');
    expect(call[1].title).toContain('DateVar Frequencies');
  });
});


