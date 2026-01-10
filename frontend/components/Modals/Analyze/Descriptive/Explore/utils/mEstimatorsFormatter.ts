import { ExploreAnalysisParams } from '../types';
import { ColumnHeader, FormattedTable, ExploreAggregatedResults, getFactorLabel, regroupByDepVar, formatNumber } from './helpers';

/**
 * Build the "M-Estimators" table for Explore analysis.
 */
export const formatMEstimatorsTable = (
  results: ExploreAggregatedResults,
  params: ExploreAnalysisParams,
): FormattedTable | null => {

  console.log('Received results:', JSON.parse(JSON.stringify(results)));
  console.log('Received params:', JSON.parse(JSON.stringify(params)));

  if (!params.showMEstimators) return null;
  const hasData = Object.values(results).some(g => g.results.some(r => r.mEstimators));
  if (!hasData) return null;

  const rows: any[] = [];
  const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
  const resultsByDepVar = regroupByDepVar(results);

  // Konstanta untuk precision yang konsisten
  const STATS_DECIMAL_PLACES = 2;

  for (const depVarName in resultsByDepVar) {
    const depVarResults = resultsByDepVar[depVarName];
    const depVarLabel = depVarResults[0]?.variable?.label || depVarName;

    if (hasFactors) {
      const factorChildren = depVarResults
        .map(result => {
          if (!result.mEstimators) return null;
          const m = result.mEstimators;
          const factorVar = params.factorVariables[0];
          const factorValue = result.factorLevels[factorVar.name];
          const factorLabel = getFactorLabel(factorVar, factorValue);

          return {
            rowHeader: [null, factorLabel],
            huber: formatNumber(m.huber, STATS_DECIMAL_PLACES),
            tukey: formatNumber(m.tukey, STATS_DECIMAL_PLACES),
            hampel: formatNumber(m.hampel, STATS_DECIMAL_PLACES),
            andrews: formatNumber(m.andrews, STATS_DECIMAL_PLACES),
          };
        })
        .filter(Boolean);

      if (factorChildren.length > 0) {
        rows.push({ rowHeader: [depVarLabel, null], children: factorChildren });
      }
    } else {
      const result = depVarResults[0];
      if (result.mEstimators) {
        const m = result.mEstimators;
        rows.push({
          rowHeader: [depVarLabel, null],
          huber: formatNumber(m.huber, STATS_DECIMAL_PLACES),
          tukey: formatNumber(m.tukey, STATS_DECIMAL_PLACES),
          hampel: formatNumber(m.hampel, STATS_DECIMAL_PLACES),
          andrews: formatNumber(m.andrews, STATS_DECIMAL_PLACES),
        });
      }
    }
  }

  if (rows.length === 0) return null;

  // Superscript letters correspond to footnotes a–d
  const huberHeader = "Huber's M-Estimator<sup>a</sup>";
  const tukeyHeader = "Tukey's Biweight<sup>b</sup>";
  const hampelHeader = "Hampel's M-Estimator<sup>c</sup>";
  const andrewsHeader = "Andrews' Wave<sup>d</sup>";

  let columnHeaders: ColumnHeader[];
  if (hasFactors) {
    const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
    columnHeaders = [
      { header: '', key: 'rowHeader1' },
      { header: factorVarName, key: 'rowHeader2' },
      { header: huberHeader, key: 'huber' },
      { header: tukeyHeader, key: 'tukey' },
      { header: hampelHeader, key: 'hampel' },
      { header: andrewsHeader, key: 'andrews' },
    ];
  } else {
    // No factor – include two row-header placeholders so data rows can use colSpan merge logic
    columnHeaders = [
      { header: '', key: 'rowHeader1' },
      { header: '', key: 'rowHeader2' },
      { header: huberHeader, key: 'huber' },
      { header: tukeyHeader, key: 'tukey' },
      { header: hampelHeader, key: 'hampel' },
      { header: andrewsHeader, key: 'andrews' },
    ];
  }

  const footnotes = [
    'a. The weighting constant is 1.339.',
    'b. The weighting constant is 4.685.',
    'c. The weighting constants are 1.700, 3.400, and 8.500.',
    'd. The weighting constant is 1.340*pi.',
  ];

  return {
    title: 'M-Estimators',
    columnHeaders,
    rows,
    // Keep only `footer` so descriptions are not duplicated (footnotes already rendered via footer).
    footer: footnotes,
  };
};