/* @jest-environment node */
/*
  Jest unit tests for DescriptiveCalculator worker logic
  These tests run in Node and manually load the worker libs.
*/

// Load utils first to expose globals (checkIsMissing, date converters, etc.)
const utils = require('../../../../../../public/workers/DescriptiveStatistics/libs/utils/utils.js');

// Provide a self object for the worker to attach the class, then restore
let originalSelf;
beforeAll(() => {
  originalSelf = global.self;
  global.self = globalThis;
  // Load the descriptive calculator implementation (attaches to self)
  require('../../../../../../public/workers/DescriptiveStatistics/libs/descriptive/descriptive.js');
});

afterAll(() => {
  if (typeof originalSelf === 'undefined') {
    try { delete global.self; } catch {}
  } else {
    global.self = originalSelf;
  }
});

const getCalculator = (variable, data, options = {}) => {
  const DescriptiveCalculator = global.self.DescriptiveCalculator;
  if (!DescriptiveCalculator) throw new Error('DescriptiveCalculator not found on self');
  return new DescriptiveCalculator({ variable, data, options });
};

const numVar = (overrides = {}) => ({
  name: 'numVar',
  type: 'NUMERIC',
  measure: 'scale',
  missing: null,
  values: [],
  ...overrides,
});

const strVar = (overrides = {}) => ({
  name: 'strVar',
  type: 'STRING',
  measure: 'nominal',
  missing: null,
  values: [],
  ...overrides,
});

const dateVar = (overrides = {}) => ({
  name: 'dateVar',
  type: 'DATE',
  measure: 'scale',
  missing: null,
  values: [],
  ...overrides,
});

// Helper to compare numbers with tolerance
const closeTo = (received, expected, precision = 5) => {
  expect(received).not.toBeNull();
  expect(received).not.toBeUndefined();
  expect(received).toBeCloseTo(expected, precision);
};

describe('DescriptiveCalculator - branching by type and measurement', () => {
  test('numeric with unknown measurement is treated as scale (mean, sum, range, etc.)', () => {
    const variable = numVar({ measure: 'unknown' });
    const data = [1, 2, 3, 4, '', null];
    const calc = getCalculator(variable, data, { saveStandardized: false });
    const { stats, zScores } = calc.getStatistics();

    expect(stats.N).toBe(6);
    expect(stats.Valid).toBe(4);
    expect(stats.Missing).toBe(2);

    closeTo(stats.Mean, 2.5);
    closeTo(stats.Sum, 10);
    closeTo(stats.Minimum, 1);
    closeTo(stats.Maximum, 4);
    closeTo(stats.Range, 3);
    closeTo(stats.Variance, 5 / 3); // sample variance with denominator (n-1)
    closeTo(stats.StdDev, Math.sqrt(5 / 3));

    expect(zScores).toBeNull();
  });

  test('string with unknown measurement is treated as nominal (mode, valid/missing only)', () => {
    const variable = strVar({ measure: 'unknown' });
    const data = ['a', 'b', 'a', '', null, 'b', 'b'];
    const calc = getCalculator(variable, data, { saveStandardized: true });
    const { stats, zScores } = calc.getStatistics();

    expect(stats.N).toBe(7);
    expect(stats.Valid).toBe(5);
    expect(stats.Missing).toBe(2);

    // Mode returned as array (most frequent value(s))
    expect(Array.isArray(stats.Mode)).toBe(true);
    expect(stats.Mode).toEqual(['b']);

    // No numeric stats expected
    expect(stats.Mean).toBeUndefined();
    expect(zScores).toBeNull();
  });

  test('date with unknown measurement is treated as scale (date strings parsed to SPSS seconds)', () => {
    const variable = dateVar({ measure: 'unknown' });
    const d1 = '01-01-2020';
    const d2 = '02-01-2020';
    const data = [d1, d2, '', null];
    const calc = getCalculator(variable, data, { saveStandardized: false });
    const { stats } = calc.getStatistics();

    const s1 = utils.dateStringToSpssSeconds(d1);
    const s2 = utils.dateStringToSpssSeconds(d2);

    expect(stats.N).toBe(4);
    expect(stats.Valid).toBe(2);
    expect(stats.Missing).toBe(2);

    closeTo(stats.Minimum, Math.min(s1, s2));
    closeTo(stats.Maximum, Math.max(s1, s2));
    closeTo(stats.Mean, (s1 + s2) / 2);
    closeTo(stats.Range, Math.abs(s2 - s1)); // should be ~86400 seconds
  });

  test('ordinal computes mode and percentiles over numeric-coded values', () => {
    const variable = numVar({ measure: 'ordinal' });
    const data = [1, 2, 3, 4, 5, 6];
    const calc = getCalculator(variable, data, { saveStandardized: false });
    const { stats, zScores } = calc.getStatistics();

    // Mode: all are equally frequent (1 each) -> all are modes
    expect(Array.isArray(stats.Mode)).toBe(true);
    expect(stats.Mode.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);

    // Percentiles using the worker's interpolation logic
    closeTo(stats['25th Percentile'], 1.75);
    closeTo(stats.Median, 3.5);
    closeTo(stats['75th Percentile'], 5.25);

    expect(zScores).toBeNull();
  });

  test('z-scores are only saved for scale and skip missing values', () => {
    const variable = numVar({ measure: 'scale' });
    const data = [1, 2, 3, 4, ''];
    const calc = getCalculator(variable, data, { saveStandardized: true });
    const { stats, zScores } = calc.getStatistics();

    expect(Array.isArray(zScores)).toBe(true);
    expect(zScores).toHaveLength(5);
    // Missing string -> "" in zScores
    expect(zScores[4]).toBe('');

    const mean = stats.Mean; // 2.5
    const sd = stats.StdDev; // sqrt(5/3)
    const expectedZ = (x) => (x - mean) / sd;

    closeTo(zScores[0], expectedZ(1));
    closeTo(zScores[1], expectedZ(2));
    closeTo(zScores[2], expectedZ(3));
    closeTo(zScores[3], expectedZ(4));
  });
});

describe('DescriptiveCalculator - type × measurement matrix coverage', () => {
  test('numeric with nominal measurement returns mode only (no numeric stats)', () => {
    const variable = numVar({ measure: 'nominal' });
    const data = [1, 1, 2, '', null];
    const calc = getCalculator(variable, data, {});
    const { stats, zScores } = calc.getStatistics();

    expect(stats.N).toBe(5);
    expect(stats.Valid).toBe(3);
    expect(stats.Missing).toBe(2);

    expect(Array.isArray(stats.Mode)).toBe(true);
    expect(stats.Mode).toEqual(['1']);

    expect(stats.Mean).toBeUndefined();
    expect(stats.Range).toBeUndefined();
    expect(zScores).toBeNull();
  });

  test('string with nominal measurement returns mode and counts only', () => {
    const variable = strVar({ measure: 'nominal' });
    const data = ['a', 'b', 'a', '', null];
    const calc = getCalculator(variable, data, {});
    const { stats } = calc.getStatistics();

    expect(stats.N).toBe(5);
    expect(stats.Valid).toBe(3);
    expect(stats.Missing).toBe(2);
    expect(stats.Mode).toEqual(['a']);
    expect(stats.Mean).toBeUndefined();
  });

  test('string with ordinal measurement computes percentiles over numeric-coded strings', () => {
    const variable = strVar({ measure: 'ordinal' });
    const data = ['1', '2', '3', '4'];
    const calc = getCalculator(variable, data, {});
    const { stats } = calc.getStatistics();

    closeTo(stats['25th Percentile'], 1.25);
    closeTo(stats.Median, 2.5);
    closeTo(stats['75th Percentile'], 3.75);
    expect(Array.isArray(stats.Mode)).toBe(true);
  });

  test('string with scale measurement computes numeric stats over numeric-coded strings', () => {
    const variable = strVar({ measure: 'scale' });
    const data = ['1', '2', '3', ''];
    const calc = getCalculator(variable, data, { saveStandardized: false });
    const { stats } = calc.getStatistics();

    expect(stats.N).toBe(4);
    expect(stats.Valid).toBe(3);
    expect(stats.Missing).toBe(1);
    closeTo(stats.Mean, 2);
    closeTo(stats.Sum, 6);
    closeTo(stats.Range, 2);
    closeTo(stats.Variance, 1);
    closeTo(stats.StdDev, 1);
  });

  test('date with nominal measurement treats values as categories and returns string mode', () => {
    const variable = dateVar({ measure: 'nominal' });
    const d1 = '01-01-2020';
    const d2 = '02-01-2020';
    const data = [d1, d1, d2, '', null];
    const calc = getCalculator(variable, data, {});
    const { stats } = calc.getStatistics();

    expect(stats.N).toBe(5);
    expect(stats.Valid).toBe(3);
    expect(stats.Missing).toBe(2);
    expect(stats.Mode).toEqual([d1]);
    expect(stats.Mean).toBeUndefined();
  });

  test('date with ordinal measurement computes percentiles on SPSS seconds', () => {
    const variable = dateVar({ measure: 'ordinal' });
    const d1 = '01-01-2020';
    const d2 = '03-01-2020';
    const d3 = '05-01-2020';
    const data = [d1, d2, d3];
    const calc = getCalculator(variable, data, {});
    const { stats } = calc.getStatistics();

    const s1 = utils.dateStringToSpssSeconds(d1);
    const s2 = utils.dateStringToSpssSeconds(d2);
    const s3 = utils.dateStringToSpssSeconds(d3);

    closeTo(stats['25th Percentile'], s1);
    closeTo(stats.Median, s2);
    closeTo(stats['75th Percentile'], s3);
  });

  test('date with scale measurement computes mean and range on SPSS seconds', () => {
    const variable = dateVar({ measure: 'scale' });
    const d1 = '01-01-2020';
    const d2 = '02-01-2020';
    const data = [d1, d2];
    const calc = getCalculator(variable, data, { saveStandardized: false });
    const { stats } = calc.getStatistics();

    const s1 = utils.dateStringToSpssSeconds(d1);
    const s2 = utils.dateStringToSpssSeconds(d2);
    closeTo(stats.Mean, (s1 + s2) / 2);
    closeTo(stats.Range, Math.abs(s2 - s1));
  });
});
