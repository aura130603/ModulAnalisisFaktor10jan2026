import { ExploreAnalysisParams } from '../types';
import { ColumnHeader, FormattedTable, ExploreAggregatedResults, getFactorLabel, regroupByDepVar, formatNumber } from './helpers';

// Konstanta untuk precision yang konsisten
const STATS_DECIMAL_PLACES = 2;

/**
 * Build the "Percentiles" table for Explore analysis.
 */
export const formatPercentilesTable = (
  results: ExploreAggregatedResults,
  params: ExploreAnalysisParams,
): FormattedTable | null => {

  console.log('Received results:', JSON.parse(JSON.stringify(results)));
  console.log('Received params:', JSON.parse(JSON.stringify(params)));

  const rows: any[] = [];
  const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
  const resultsByDepVar = regroupByDepVar(results);

  const methods = [
    { name: 'Weighted Average (Definition 1)', key: 'wa' },
    { name: "Tukey's Hinges", key: 'tukey' },
  ];

  for (const method of methods) {
    const depVarChildren: any[] = [];

    for (const depVarName in resultsByDepVar) {
      const depVarResults = resultsByDepVar[depVarName];
      const depVarLabel = depVarResults[0]?.variable?.label || depVarName;

      const createPercentileRowData = (result: any) => {
        const dec = STATS_DECIMAL_PLACES; // Use consistent decimal places
        if (method.key === 'wa') {
          const wa = result.percentiles?.waverage;
          if (!wa) return null;
          return {
            p5: formatNumber(wa[5], dec) || '.',
            p10: formatNumber(wa[10], dec) || '.',
            p25: formatNumber(wa[25], dec) || '.',
            p50: formatNumber(wa[50], dec) || '.',
            p75: formatNumber(wa[75], dec) || '.',
            p90: formatNumber(wa[90], dec) || '.',
            p95: formatNumber(wa[95], dec) || '.',
          };
        }
        // Tukey
        const d = result.descriptives;
        if (!d) return null;
        return {
          p25: formatNumber(d.Percentiles?.['25'], dec) || '.',
          p50: formatNumber(d.Median, dec) || '.',
          p75: formatNumber(d.Percentiles?.['75'], dec) || '.',
        };
      };

      if (hasFactors) {
        const factorChildren = depVarResults
          .map(result => {
            const rowData = createPercentileRowData(result);
            if (!rowData) return null;
            const factorVar = params.factorVariables[0];
            const factorValue = result.factorLevels[factorVar.name];
            const factorLabel = getFactorLabel(factorVar, factorValue);
            return { rowHeader: [null, null, factorLabel], ...rowData };
          })
          .filter(Boolean);

        if (factorChildren.length > 0) {
          depVarChildren.push({ rowHeader: [null, depVarLabel, null], children: factorChildren });
        }
      } else {
        const result = depVarResults[0];
        const rowData = createPercentileRowData(result);
        if (rowData) depVarChildren.push({ rowHeader: [null, depVarLabel], ...rowData });
      }
    }

    if (depVarChildren.length > 0) {
      rows.push({ rowHeader: hasFactors ? [method.name, null, null] : [method.name, null], children: depVarChildren });
    }
  }

  if (rows.length === 0) return null;

  const percentileHeaders: ColumnHeader = {
    header: 'Percentiles',
    children: [
      { header: '5', key: 'p5' },
      { header: '10', key: 'p10' },
      { header: '25', key: 'p25' },
      { header: '50', key: 'p50' },
      { header: '75', key: 'p75' },
      { header: '90', key: 'p90' },
      { header: '95', key: 'p95' },
    ],
  };

  let columnHeaders: ColumnHeader[];
  if (hasFactors) {
    const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
    columnHeaders = [
      { header: '', key: 'rowHeader1' },
      { header: '', key: 'rowHeader2' },
      { header: factorVarName, key: 'rowHeader3' },
      percentileHeaders,
    ];
  } else {
    columnHeaders = [
      { header: '', key: 'rowHeader1' },
      { header: '', key: 'rowHeader2' },
      percentileHeaders,
    ];
  }

  return { title: 'Percentiles', columnHeaders, rows };
};