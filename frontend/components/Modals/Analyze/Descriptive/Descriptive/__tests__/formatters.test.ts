import { formatDescriptiveTableOld } from '../utils/formatters';
import { DescriptiveStatisticsOptions, DisplayOrderType, DescriptiveResult } from '../types';

const mockResult: DescriptiveResult = {
  variable: {
    name: 'var1',
    label: 'Variable 1',
    type: 'NUMERIC',
    decimals: 2,
    columnIndex: 0,
  } as any,
  stats: {
    N: 10,
    Missing: 0,
    Range: 5,
    Minimum: 1,
    Maximum: 6,
    Sum: 30,
    Mean: 3,
    SEMean: 0.2,
    Median: 3,
    StdDev: 1.2,
    Variance: 1.44,
    Skewness: 0.1,
    SESkewness: 0.05,
    Kurtosis: -0.2,
    SEKurtosis: 0.1,
  },
};

describe('formatDescriptiveTableOld', () => {
  it('produces correct table structure with selected statistics', () => {
    const displayStatistics: DescriptiveStatisticsOptions = {
      mean: true,
      sum: true,
      stdDev: false,
      variance: false,
      range: true,
      minimum: true,
      maximum: true,
      standardError: true,
      median: false,
      skewness: false,
      kurtosis: false,
    };

    const table = formatDescriptiveTableOld([mockResult], displayStatistics, 'variableList' as DisplayOrderType);

    // Basic expectations about structure
    expect(table.title).toBe('Descriptive Statistics');
    // Expect headers to include Mean because mean true
    const headers = table.columnHeaders.map(h => h.header);
    expect(headers).toContain('Mean');
    expect(headers).toContain('Sum');
    // Should include exactly one data row
    expect(table.rows).toHaveLength(1);
    const row = table.rows[0] as any;
    expect(row.Mean).toBe(3);
    expect(row.Sum).toBe(30);
    expect(row.Range).toBe(5);
  });
}); 