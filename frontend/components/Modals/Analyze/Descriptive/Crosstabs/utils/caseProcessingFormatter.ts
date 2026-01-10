import { CrosstabsAnalysisParams, CrosstabsWorkerResult } from '../types';
import { ColumnHeader, FormattedTable, TableRowData } from './helpers';

/**
 * Formats the Case Processing Summary table for Crosstabs.
 */
export const formatCaseProcessingSummary = (
  result: CrosstabsWorkerResult,
  params: CrosstabsAnalysisParams,
): FormattedTable | null => {
  if (!result || !result.summary) return null;

  const { valid, missing } = result.summary;
  const total = valid + missing;

  const rowVarNames = params.rowVariables.map(v => v.label || v.name).join(' * ');
  const colVarNames = params.columnVariables.map(v => v.label || v.name).join(' * ');

  const rows: TableRowData[] = [
    {
      rowHeader: [`${rowVarNames} * ${colVarNames}`],
      valid_n: valid,
      valid_percent: total > 0 ? `${((valid / total) * 100).toFixed(1)}%` : '0.0%',
      missing_n: missing,
      missing_percent: total > 0 ? `${((missing / total) * 100).toFixed(1)}%` : '0.0%',
      total_n: total,
      total_percent: '100.0%',
    },
  ];

  const columnHeaders: ColumnHeader[] = [
    { header: '', key: 'rowHeader' },
    {
      header: 'Cases',
      children: [
        {
          header: 'Valid',
          children: [
            { header: 'N', key: 'valid_n' },
            { header: 'Percent', key: 'valid_percent' },
          ],
        },
        {
          header: 'Missing',
          children: [
            { header: 'N', key: 'missing_n' },
            { header: 'Percent', key: 'missing_percent' },
          ],
        },
      ],
    },
    {
      header: 'Total',
      children: [
        { header: 'N', key: 'total_n' },
        { header: 'Percent', key: 'total_percent' },
      ],
    },
  ];

  return { title: 'Case Processing Summary', columnHeaders, rows };
}; 