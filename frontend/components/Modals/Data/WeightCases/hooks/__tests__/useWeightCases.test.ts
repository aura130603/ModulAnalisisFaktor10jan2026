import { renderHook, act } from '@testing-library/react';
import { useWeightCases } from '../useWeightCases';
import type { Variable } from '@/types/Variable';

const mockVariables: Variable[] = [
  { name: 'var1', type: 'NUMERIC', columnIndex: 0, tempId: '1' } as Variable,
  { name: 'var2', type: 'STRING', columnIndex: 1, tempId: '2' } as Variable,
  { name: 'var3', type: 'NUMERIC', columnIndex: 2, tempId: '3' } as Variable,
];

describe('useWeightCases', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();
  
  const setupHook = (initialWeight = "") => {
    return renderHook(() => useWeightCases({
      onClose: mockOnClose,
      initialVariables: mockVariables,
      initialWeight,
      onSave: mockOnSave
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with only numeric variables in the available list', () => {
    const { result } = setupHook();
    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var1', 'var3']);
    expect(result.current.frequencyVariables).toEqual([]);
  });

  it('should initialize with a pre-selected weight variable if present', () => {
    const { result } = setupHook('var3');
    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var1']);
    expect(result.current.frequencyVariables.map(v => v.name)).toEqual(['var3']);
  });

  it('should move a variable from available to frequency', () => {
    const { result } = setupHook();
    const varToMove = result.current.availableVariables.find(v => v.name === 'var1');
    
    act(() => {
      result.current.handleMoveVariable(varToMove!, 'available', 'frequency');
    });

    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var3']);
    expect(result.current.frequencyVariables.map(v => v.name)).toEqual(['var1']);
  });

  it('should swap variables if frequency list is full', () => {
    const { result } = setupHook('var3'); // var3 is in frequency
    expect(result.current.frequencyVariables.map(v => v.name)).toEqual(['var3']);
    
    const varToMove = result.current.availableVariables.find(v => v.name === 'var1');

    act(() => {
        result.current.handleMoveVariable(varToMove!, 'available', 'frequency');
    });

    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var3']);
    expect(result.current.frequencyVariables.map(v => v.name)).toEqual(['var1']);
  });

  it('should show an error when trying to move a string variable to frequency', () => {
    const stringVar: Variable = { name: 'var2', type: 'STRING', columnIndex: 1, tempId: '2' } as Variable;
    const { result } = setupHook();
    
    act(() => {
      result.current.handleMoveVariable(stringVar, 'available', 'frequency');
    });

    expect(result.current.errorMessage).toBe('Weight variable must be numeric');
    expect(result.current.errorDialogOpen).toBe(true);
  });

  it('should call onSave with the correct variable name on handleSave', () => {
    const { result } = setupHook();
    const varToMove = result.current.availableVariables.find(v => v.name === 'var1');

    act(() => {
      result.current.handleMoveVariable(varToMove!, 'available', 'frequency');
    });

    act(() => {
      result.current.handleSave();
    });

    expect(mockOnSave).toHaveBeenCalledWith('var1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onSave with an empty string when saving with no frequency variable', () => {
    const { result } = setupHook();

    act(() => {
      result.current.handleSave();
    });

    expect(mockOnSave).toHaveBeenCalledWith('');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset state on handleReset', () => {
    const { result } = setupHook('var1');

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.availableVariables.map(v => v.name)).toEqual(['var1', 'var3']);
    expect(result.current.frequencyVariables).toEqual([]);
    expect(mockOnSave).not.toHaveBeenCalled(); // Reset should not save
  });
}); 