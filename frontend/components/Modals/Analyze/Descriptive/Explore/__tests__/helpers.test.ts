// @ts-nocheck
import { getFactorLabel, formatNumber, regroupByDepVar } from '../utils/helpers';

describe('Explore helpers utility functions', () => {
  describe('getFactorLabel', () => {
    const factorVar = {
      name: 'group',
      label: 'Group',
      columnIndex: 1,
      tempId: 'group',
      decimals: 0,
      measure: 'nominal',
      type: 'string',
      width: 0,
      values: [
        { value: 1, label: 'Control' },
        { value: 2, label: 'Treatment' },
      ],
    } as any;

    it('returns matching value label when found', () => {
      expect(getFactorLabel(factorVar, 1)).toBe('Control');
      expect(getFactorLabel(factorVar, '2')).toBe('Treatment');
    });

    it('falls back to raw value when label not found', () => {
      expect(getFactorLabel(factorVar, 3)).toBe('3');
    });
  });

  describe('formatNumber', () => {
    it('formats number according to decimals', () => {
      expect(formatNumber(1.2345, 2)).toBe('1.23');
      expect(formatNumber(1, 0)).toBe('1');
    });

    it('returns fallback for null, undefined, or NaN', () => {
      expect(formatNumber(undefined, 2, 'N/A')).toBe('N/A');
      expect(formatNumber(null, 2, 'N/A')).toBe('N/A');
      expect(formatNumber(NaN, 2, 'N/A')).toBe('N/A');
    });
  });

  describe('regroupByDepVar', () => {
    const results = {
      all_data: {
        factorLevels: {},
        results: [
          { variable: { name: 'height' }, someStat: 1 },
          { variable: { name: 'weight' }, someStat: 2 },
        ],
      },
      males: {
        factorLevels: { gender: 'male' },
        results: [
          { variable: { name: 'height' }, someStat: 3 },
        ],
      },
    } as any;

    it('regroups correctly by dependent variable name', () => {
      const regrouped = regroupByDepVar(results);
      expect(Object.keys(regrouped)).toEqual(['height', 'weight']);
      expect(regrouped.height.length).toBe(2);
      expect(regrouped.weight.length).toBe(1);
    });
  });
}); 