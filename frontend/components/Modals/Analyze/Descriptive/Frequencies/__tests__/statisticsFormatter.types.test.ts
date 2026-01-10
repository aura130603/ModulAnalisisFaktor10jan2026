import { formatStatisticsTable } from '../utils/formatters';
import type { FrequenciesResult } from '../types';
import type { Variable } from '@/types/Variable';

describe('formatStatisticsTable across variable types', () => {
  const numVar: Variable = {
    id: 1,
    tempId: 'num',
    columnIndex: 0,
    name: 'numVar',
    label: 'Numeric Variable',
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: null,
    columns: 8,
    align: 'right',
    measure: 'scale',
    role: 'input',
  } as Variable;

  const strVar: Variable = {
    id: 2,
    tempId: 'str',
    columnIndex: 1,
    name: 'strVar',
    label: 'String Variable',
    type: 'STRING',
    width: 8,
    decimals: 0,
    values: [],
    missing: null,
    columns: 8,
    align: 'left',
    measure: 'nominal',
    role: 'input',
  } as Variable;

  const dateVar: Variable = {
    id: 3,
    tempId: 'date',
    columnIndex: 2,
    name: 'dateVar',
    label: 'Date Variable',
    type: 'DATE',
    width: 10,
    decimals: 0,
    values: [],
    missing: null,
    columns: 10,
    align: 'right',
    measure: 'scale',
    role: 'input',
  } as Variable;

  it('formats stats showing numeric values for NUMERIC and hiding for DATE (except Mode)', () => {
    const results: FrequenciesResult[] = [
      {
        variable: numVar,
        stats: {
          N: 5,
          Missing: 0,
          Mean: 10,
          Median: 9,
          Mode: [8],
          StdDev: 1.23,
          Variance: 1.51,
          Minimum: 7,
          Maximum: 12,
          Range: 5,
          SEMean: 0.5,
          Percentiles: { '25': 8, '50': 9, '75': 11 },
        },
      },
      {
        variable: strVar,
        stats: {
          N: 5,
          Missing: 0,
          Mode: ['A'],
        },
      },
      {
        variable: dateVar,
        stats: {
          N: 5,
          Missing: 0,
          Mean: 18628,
          Median: 18628,
          Mode: [18628],
          StdDev: 365,
          Percentiles: { '25': 18500, '50': 18628, '75': 18750 },
        },
      },
    ];

    const formatted = formatStatisticsTable(results);
    expect(formatted).not.toBeNull();
    const table = formatted.tables[0];

    // Mean row: numeric shows value, date shows empty, string blank
    const meanRow = table.rows.find((r: any) => r.rowHeader[0] === 'Mean');
    expect(meanRow.numVar).toBe('10.00');
    expect(meanRow.dateVar).toBe('');
    expect(meanRow.strVar ?? '').toBe('');

    // Mode row: numeric formatted, string raw label, date unformatted numeric
    const modeRow = table.rows.find((r: any) => r.rowHeader[0] === 'Mode');
    expect(modeRow.numVar).toBe('8.00');
    expect(modeRow.strVar).toBe('A');
    expect(modeRow.dateVar).toBe('18628');

    // Percentiles should hide for date (.) and format for numeric
    const percentilesGroup = table.rows.find((r: any) => r.rowHeader[0] === 'Percentiles');
    const p25 = percentilesGroup.children.find((r: any) => r.rowHeader[1] === '25');
    expect(p25.numVar).toBe('8.00');
    expect(p25.dateVar).toBe('.');
  });
});


