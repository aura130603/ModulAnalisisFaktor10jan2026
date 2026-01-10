import { getUniqueValuesWithCounts, suggestMeasurementLevel, saveVariableProperties } from '../services/variablePropertiesService';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import type { Variable } from '@/types/Variable';

// Mock the stores
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');

const mockedUseDataStore = useDataStore as jest.Mocked<typeof useDataStore>;
const mockedUseVariableStore = useVariableStore as jest.Mocked<typeof useVariableStore>;

describe('variablePropertiesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUniqueValuesWithCounts', () => {
    it('should return unique values and counts from data store', () => {
      mockedUseDataStore.getState.mockReturnValue({
        data: [['A'], ['B'], ['A'], ['C'], ['B'], ['A']]
      } as any);

      const sampleData = [['A'], ['B'], ['A'], ['C'], ['B'], ['A']];
      const result = getUniqueValuesWithCounts(sampleData, 0, 'STRING', '10', '10');
      
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ value: 'A', count: 3 });
      expect(result).toContainEqual({ value: 'B', count: 2 });
      expect(result).toContainEqual({ value: 'C', count: 1 });
    });

    it('should respect caseLimit', () => {
        mockedUseDataStore.getState.mockReturnValue({
            data: [['A'], ['B'], ['A'], ['C'], ['B'], ['A']]
        } as any);
  
        const sampleData = [['A'], ['B'], ['A'], ['C'], ['B'], ['A']];
        const result = getUniqueValuesWithCounts(sampleData, 0, 'STRING', '3', '10');
        
        expect(result).toHaveLength(2);
        expect(result).toContainEqual({ value: 'A', count: 2 });
        expect(result).toContainEqual({ value: 'B', count: 1 });
    });

    it('should respect valueLimit', () => {
        mockedUseDataStore.getState.mockReturnValue({
            data: [['A'], ['B'], ['A'], ['C'], ['B'], ['A']]
        } as any);
  
        const sampleData = [['A'], ['B'], ['A'], ['C'], ['B'], ['A']];
        const result = getUniqueValuesWithCounts(sampleData, 0, 'STRING', '10', '2');
        
        expect(result).toHaveLength(2);
    });
  });

  describe('suggestMeasurementLevel', () => {
    const baseVariable: Variable = {
      name: 'testVar',
      label: '',
      type: 'NUMERIC',
      role: 'input',
      measure: 'unknown',
      values: [],
      missing: null,
      columnIndex: 0,
      width: 8,
      decimals: 0,
      columns: 12,
      align: 'left'
    };

    it('should suggest nominal for non-numeric data', () => {
      mockedUseDataStore.getState.mockReturnValue({ data: [['A'], ['B'], ['C']] } as any);
      const sampleData = [['A'], ['B'], ['C']];
      const result = suggestMeasurementLevel(sampleData, baseVariable as any, '10');
      expect(result.level).toBe('nominal');
      expect(result.explanation).toContain('non-numeric');
    });

    it('should suggest ordinal for few unique integers', () => {
      mockedUseDataStore.getState.mockReturnValue({ data: [[1], [2], [1], [3], [2]] } as any);
      const sampleDataInts = [[1], [2], [1], [3], [2]];
      const result = suggestMeasurementLevel(sampleDataInts, baseVariable as any, '10');
      expect(result.level).toBe('ordinal');
      expect(result.explanation).toContain('Few unique integers');
    });

    it('should suggest scale for numeric data with diverse values', () => {
        mockedUseDataStore.getState.mockReturnValue({ data: [[1.1], [2.2], [3.3], [4.4], [5.5], [6.6], [7.7], [8.8], [9.9], [10.1], [11.2]] } as any);
        const diverseData = [[1.1], [2.2], [3.3], [4.4], [5.5], [6.6], [7.7], [8.8], [9.9], [10.1], [11.2]];
        const result = suggestMeasurementLevel(diverseData, baseVariable as any, '20');
        expect(result.level).toBe('scale');
        expect(result.explanation).toContain('diverse values');
    });

    it('should suggest nominal for binary data', () => {
        mockedUseDataStore.getState.mockReturnValue({ data: [[0], [1], [0], [1], [0]] } as any);
        const binaryData = [[0], [1], [0], [1], [0]];
        const result = suggestMeasurementLevel(binaryData, baseVariable as any, '10');
        expect(result.level).toBe('nominal');
        expect(result.explanation).toContain('Only 2 unique values');
    });
  });

  describe('saveVariableProperties', () => {
    it('should call updateMultipleFields for changed variables', async () => {
      const mockUpdate = jest.fn();
      mockedUseVariableStore.getState.mockReturnValue({
        updateMultipleFields: mockUpdate,
      } as any);

      const originalVariables: Variable[] = [
        { tempId: '1', name: 'var1', label: 'label1', columnIndex: 0, type: 'NUMERIC', measure: 'scale', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
        { tempId: '2', name: 'var2', label: 'label2', columnIndex: 1, type: 'STRING', measure: 'nominal', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
      ];

      const modifiedVariables: Variable[] = [
        { ...originalVariables[0], label: 'new label' }, // changed
        { ...originalVariables[1] }, // unchanged
      ];
      
      await saveVariableProperties(modifiedVariables as any, originalVariables as any, mockUpdate);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(0, expect.objectContaining({
        label: 'new label',
      }));
    });
  });
}); 