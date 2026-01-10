import { ExploreAnalysisParams } from '../types';
import { ColumnHeader, FormattedTable, ExploreAggregatedResults, getFactorLabel, regroupByDepVar, formatNumber } from './helpers';

/**
 * Build the "Extreme Values" table for Explore analysis.
 */
export const formatExtremeValuesTable = (
  results: ExploreAggregatedResults,
  params: ExploreAnalysisParams,
): FormattedTable | null => {

  console.log('Received results:', JSON.parse(JSON.stringify(results)));
  console.log('Received params:', JSON.parse(JSON.stringify(params)));

  if (!params.showOutliers) return null;
  const hasData = Object.values(results).some(g => g.results.some(r => r.extremeValues));
  if (!hasData) return null;

  const rows: any[] = [];
  let isPartialA = false,
    isPartialB = false,
    isTruncated = false;
  const hasFactors = params.factorVariables.length > 0 && params.factorVariables.every(v => v !== null);
  const resultsByDepVar = regroupByDepVar(results);

  const createExtremeValueRows = (result: any) => {
    if (!result.extremeValues) return [];
    const ex = result.extremeValues;
    if (ex.isTruncated) isTruncated = true;

    const dec = result.variable?.decimals ?? 2;
    const extremeRows: any[] = [];

    const buildRowHeader = (
      level3: string | null,
      level4: string | null = null,
    ): (string | null)[] => {
      if (hasFactors) return [null, null, level3, level4];
      return [null, level3, level4];
    };

    if (ex.highest && ex.highest.length > 0) {
      const highestChildren = ex.highest.map((val: any, i: number) => {
        if (val.isPartial) isPartialA = true;
        return {
          rowHeader: buildRowHeader(null, (i + 1).toString()),
          case_number: val.caseNumber,
          value: formatNumber(val.value, dec),
        };
      });
      extremeRows.push({ rowHeader: buildRowHeader('Highest', null), children: highestChildren });
    }

    if (ex.lowest && ex.lowest.length > 0) {
      // Sort lowest values by case number in descending order (highest case numbers first)
      const sortedLowest = [...ex.lowest].sort((a, b) => b.caseNumber - a.caseNumber);
      const lowestChildren = sortedLowest.map((val: any, i: number) => {
        if (val.isPartial) isPartialB = true;
        return {
          rowHeader: buildRowHeader(null, (i + 1).toString()),
          case_number: val.caseNumber,
          value: formatNumber(val.value, dec),
        };
      });
      extremeRows.push({ rowHeader: buildRowHeader('Lowest', null), children: lowestChildren });
    }
    return extremeRows;
  };

  for (const depVarName in resultsByDepVar) {
    const depVarResults = resultsByDepVar[depVarName];
    const depVarLabel = depVarResults[0]?.variable?.label || depVarName;

    if (hasFactors) {
      const factorChildren = depVarResults
        .map(result => {
          const extremeValueContent = createExtremeValueRows(result);
          if (extremeValueContent.length === 0) return null;
          const factorVar = params.factorVariables[0];
          const factorValue = result.factorLevels[factorVar.name];
          const factorLabel = getFactorLabel(factorVar, factorValue);
          return { rowHeader: [null, factorLabel, null, null], children: extremeValueContent };
        })
        .filter(Boolean);
      if (factorChildren.length > 0) rows.push({ rowHeader: [depVarLabel, null, null, null], children: factorChildren });
    } else {
      const result = depVarResults[0];
      const extremeValueContent = createExtremeValueRows(result);
      if (extremeValueContent.length > 0) rows.push({ rowHeader: [depVarLabel, null, null], children: extremeValueContent });
    }
  }

  if (rows.length === 0) return null;

  const footnotes: string[] = [];
  if (isTruncated)
    footnotes.push(
      'The requested number of extreme values exceeds the number of data points. A smaller number of extremes is displayed.',
    );
  if (isPartialA)
    footnotes.push(
      'a. Only a partial list of cases with the value ... are shown in the table of upper extremes.',
    );
  if (isPartialB)
    footnotes.push(
      'b. Only a partial list of cases with the value ... are shown in the table of lower extremes.',
    );

  let columnHeaders: ColumnHeader[];
  if (hasFactors) {
    const factorVarName = params.factorVariables[0]?.label || params.factorVariables[0]?.name || '';
    columnHeaders = [
      { header: '', key: 'rh1' },
      { header: factorVarName, key: 'rh2' },
      { header: '', key: 'rh3' },
      { header: '', key: 'rh4' },
      { header: 'Case Number', key: 'case_number' },
      { header: 'Value', key: 'value' },
    ];
  } else {
    columnHeaders = [
      { header: '', key: 'rh1' },
      { header: '', key: 'rh2' },
      { header: '', key: 'rh3' },
      { header: 'Case Number', key: 'case_number' },
      { header: 'Value', key: 'value' },
    ];
  }

  return {
    title: 'Extreme Values',
    columnHeaders,
    rows,
    footer: footnotes.length > 0 ? footnotes : undefined,
  };
};