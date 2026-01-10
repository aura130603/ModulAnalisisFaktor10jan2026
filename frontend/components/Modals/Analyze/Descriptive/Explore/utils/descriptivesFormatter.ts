import { ExploreAnalysisParams } from '../types';
import { ColumnHeader, FormattedTable, ExploreAggregatedResults, getFactorLabel, regroupByDepVar, formatNumber } from './helpers';

// Konstanta untuk precision yang konsisten
const STATS_DECIMAL_PLACES = 2;

/**
 * Build the "Descriptives" table for Explore analysis.
 */
export const formatDescriptivesTable = (
  results: ExploreAggregatedResults,
  params: ExploreAnalysisParams,
): FormattedTable | null => {

  console.log('Received results:', JSON.parse(JSON.stringify(results)));
  console.log('Received params:', JSON.parse(JSON.stringify(params)));

  const rows: any[] = [];
  const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
  const ciLabel = `${params.confidenceInterval || '95'}% Confidence Interval for Mean`;
  const resultsByDepVar = regroupByDepVar(results);

  const hasData = Object.values(results).some(g => g.results.some(r => r.descriptives));
  if (!hasData) return null;

  // Build rows flat (no deep nesting except factor groups)
  for (const depVarName in resultsByDepVar) {
    const depVarResults = resultsByDepVar[depVarName];
    const depVarLabel = depVarResults[0]?.variable?.label || depVarName;

    depVarResults.forEach(result => {
      if (!result.descriptives) return;
      const d = result.descriptives;

      // Build factor label only when factor(s) exist
      const factorLabel = hasFactors
        ? (() => {
            const factorVar = params.factorVariables[0];
            const factorValue = result.factorLevels[factorVar.name];
            return getFactorLabel(factorVar, factorValue);
          })()
        : '';

      const dec = STATS_DECIMAL_PLACES; // Use consistent decimal places

      // Helper to construct rowHeader based on presence of factors
      const buildRowHeader = (
        statName: string,
        suffix: string | null = null,
      ): (string | null)[] => {
        if (hasFactors) {
          return [depVarLabel, factorLabel, statName, suffix];
        }
        // No factor: collapse into two-level row header to avoid blank column
        if (suffix) return [depVarLabel, `${statName} - ${suffix}`];
        return [depVarLabel, statName];
      };

      const pushRow = (
        statName: string,
        value: number | undefined,
        se?: number,
      ) => {
        rows.push({
          rowHeader: buildRowHeader(statName, null),
          statistic: formatNumber(value, dec),
          std_error: se !== undefined ? formatNumber(se, dec) : '',
        });
      };

      // Mean and SEMean
      pushRow('Mean', d.Mean, d.SEMean);

      // Confidence Interval
      if (d.confidenceInterval?.lower !== undefined) {
        rows.push({
          rowHeader: buildRowHeader(ciLabel, 'Lower Bound'),
          statistic: formatNumber(d.confidenceInterval.lower, dec),
          std_error: '',
        });
      }
      if (d.confidenceInterval?.upper !== undefined) {
        rows.push({
          rowHeader: buildRowHeader(ciLabel, 'Upper Bound'),
          statistic: formatNumber(d.confidenceInterval.upper, dec),
          std_error: '',
        });
      }

      // Trimmed mean
      rows.push({
        rowHeader: buildRowHeader('5% Trimmed Mean'),
        statistic: formatNumber(result.trimmedMean, dec),
        std_error: '',
      });

      // Median
      pushRow('Median', d.Median);

      // Variance
      pushRow('Variance', d.Variance);

      // Std. Deviation
      pushRow('Std. Deviation', d.StdDev);

      // Minimum, Maximum, Range, IQR
      pushRow('Minimum', d.Minimum);
      pushRow('Maximum', d.Maximum);
      pushRow('Range', d.Range);
      pushRow('Interquartile Range', d.IQR);

      // Skewness & Kurtosis
      rows.push({
        rowHeader: buildRowHeader('Skewness'),
        statistic: formatNumber(d.Skewness, dec),
        std_error: formatNumber(d.SESkewness, dec),
      });
      rows.push({
        rowHeader: buildRowHeader('Kurtosis'),
        statistic: formatNumber(d.Kurtosis, dec),
        std_error: formatNumber(d.SEKurtosis, dec),
      });
    });
  }

  if (rows.length === 0) return null;

  let columnHeaders: ColumnHeader[];
  if (hasFactors) {
    const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
    columnHeaders = [
      { header: '', key: 'rowHeader1' },
      { header: factorVarName, key: 'rowHeader2' },
      { header: '', key: 'rowHeader3' },
      { header: '', key: 'rowHeader4' },
      { header: 'Statistic', key: 'statistic' },
      { header: 'Std. Error', key: 'std_error' },
    ];
  } else {
    // No factor – only two row-header columns
    columnHeaders = [
      { header: '', key: 'rowHeader1' },
      { header: '', key: 'rowHeader2' },
      { header: 'Statistic', key: 'statistic' },
      { header: 'Std. Error', key: 'std_error' },
    ];
  }

  return { title: 'Descriptives', columnHeaders, rows };
};