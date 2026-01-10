import { ExploreAnalysisParams } from '../types';
import { ColumnHeader, FormattedTable, ExploreAggregatedResults, getFactorLabel, regroupByDepVar } from './helpers';

/**
 * Build the "Case Processing Summary" table for Explore analysis.
 */
export const formatCaseProcessingSummary = (
  results: ExploreAggregatedResults,
  params: ExploreAnalysisParams,
): FormattedTable | null => {

  console.log('Received results:', JSON.parse(JSON.stringify(results)));
  console.log('Received params:', JSON.parse(JSON.stringify(params)));

  const rows: any[] = [];
  const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
  const resultsByDepVar = regroupByDepVar(results);

  for (const depVarName in resultsByDepVar) {
    const depVarResults = resultsByDepVar[depVarName];

    if (hasFactors) {
      const parentRow: any = {
        rowHeader: [depVarResults[0].variable.label || depVarName, null],
        children: [],
      };

      depVarResults.forEach(result => {
        const totalN = result.summary.valid + result.summary.missing;
        const factorVar = params.factorVariables[0];
        const factorValue = result.factorLevels[factorVar.name];
        const factorLabel = getFactorLabel(factorVar, factorValue);

        parentRow.children.push({
          rowHeader: [null, factorLabel],
          Valid_N: result.summary.valid,
          Valid_Percent: totalN > 0 ? `${((result.summary.valid / totalN) * 100).toFixed(1)}%` : '0.0%',
          Missing_N: result.summary.missing,
          Missing_Percent: totalN > 0 ? `${((result.summary.missing / totalN) * 100).toFixed(1)}%` : '0.0%',
          Total_N: totalN,
          Total_Percent: '100.0%',
        });
      });

      rows.push(parentRow);
    } else {
      depVarResults.forEach(result => {
        const totalN = result.summary.valid + result.summary.missing;
        rows.push({
          rowHeader: [result.variable.label || result.variable.name],
          Valid_N: result.summary.valid,
          Valid_Percent: totalN > 0 ? `${((result.summary.valid / totalN) * 100).toFixed(1)}%` : '0.0%',
          Missing_N: result.summary.missing,
          Missing_Percent: totalN > 0 ? `${((result.summary.missing / totalN) * 100).toFixed(1)}%` : '0.0%',
          Total_N: totalN,
          Total_Percent: '100.0%',
        });
      });
    }
  }

  if (rows.length === 0) return null;

  // Column headers
  const casesHeader: ColumnHeader = {
    header: 'Cases',
    children: [
      { header: 'Valid', children: [{ header: 'N', key: 'Valid_N' }, { header: 'Percent', key: 'Valid_Percent' }] },
      { header: 'Missing', children: [{ header: 'N', key: 'Missing_N' }, { header: 'Percent', key: 'Missing_Percent' }] },
      { header: 'Total', children: [{ header: 'N', key: 'Total_N' }, { header: 'Percent', key: 'Total_Percent' }] },
    ],
  };

  let columnHeaders: ColumnHeader[];
  if (hasFactors) {
    const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
    columnHeaders = [
      { header: '', key: 'row_header_col_1' },
      { header: factorVarName, key: 'row_header_col_2' },
      casesHeader,
    ];
  } else {
    columnHeaders = [{ header: '', key: 'row_header_col_1' }, casesHeader];
  }

  return { title: 'Case Processing Summary', columnHeaders, rows };
};