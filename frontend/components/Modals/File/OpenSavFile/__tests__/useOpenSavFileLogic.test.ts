import { renderHook, act } from '@testing-library/react';
import { useOpenSavFileLogic } from '../hooks/useOpenSavFileLogic';
import * as services from '../services/services';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';

// Mock dependencies
jest.mock('../services/services');
jest.mock('@/hooks/useMobile', () => ({ useMobile: () => ({ isMobile: false, isPortrait: false }) }));
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');

const mockedProcessSavFile = services.processSavFile as jest.Mock;
const mockOverwriteAll = jest.fn();
const mockSetProjectMeta = jest.fn();

(useDataStore as unknown as jest.Mock).mockReturnValue({ });
(useVariableStore as unknown as jest.Mock).mockReturnValue({ overwriteAll: mockOverwriteAll });
(useMetaStore as unknown as jest.Mock).mockReturnValue({ setMeta: mockSetProjectMeta });

// A realistic mock response from the backend
const mockApiResponse = {
  meta: {
    header: { n_cases: 2, n_vars: 2, created: new Date().toISOString() },
    sysvars: [
      { name: 'VAR1', printFormat: { typestr: 'F', width: 8, nbdec: 2 }, label: 'Variable 1', measurementLevel: 'SCALE', missing: { min: -99 } },
      { name: 'VAR2', printFormat: { typestr: 'A', width: 10 }, label: 'Variable 2', measurementLevel: 'NOMINAL', missing: ['NA'] }
    ],
    valueLabels: [
      { appliesToNames: ['VAR2'], entries: [{ val: 'M', label: 'Male' }, { val: 'F', label: 'Female' }] }
    ]
  },
  rows: [
    { VAR1: 10.5, VAR2: 'M' },
    { VAR1: -99, VAR2: 'F' },
  ]
};

describe('useOpenSavFileLogic hook', () => {
  const mockOnClose = jest.fn();
  const mockFile = new File(['mock content'], 'test.sav', { type: 'application/octet-stream' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle file selection and validation', () => {
    const { result } = renderHook(() => useOpenSavFileLogic({ onClose: mockOnClose }));
    
    act(() => {
      result.current.handleFileChange(mockFile);
    });
    expect(result.current.file).toBe(mockFile);
    expect(result.current.error).toBeNull();
    
    const invalidFile = new File([''], 'test.txt');
    act(() => {
      result.current.handleFileChange(invalidFile);
    });
    expect(result.current.file).toBeNull();
    expect(result.current.error).toBe('Invalid file type. Only .sav files are supported.');
  });
  
  it('should successfully process a valid file and update stores', async () => {
    mockedProcessSavFile.mockResolvedValue(mockApiResponse);
    const { result } = renderHook(() => useOpenSavFileLogic({ onClose: mockOnClose }));

    act(() => {
      result.current.handleFileChange(mockFile);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockedProcessSavFile).toHaveBeenCalledTimes(1);
    
    // Check that overwriteAll was called with the correct data
    expect(mockOverwriteAll).toHaveBeenCalledTimes(1);
    const [variables, dataMatrix] = mockOverwriteAll.mock.calls[0];
    
    // Check variable creation
    expect(variables.length).toBe(2);
    expect(variables[0].name).toBe('VAR1');
    expect(variables[0].type).toBe('NUMERIC');
    expect(variables[1].name).toBe('VAR2');
    expect(variables[1].type).toBe('STRING');
    expect(variables[1].values.length).toBe(2);
    
    // Check data transformation
    expect(dataMatrix.length).toBe(2);
    expect(dataMatrix[0]).toEqual([10.5, 'M']);
    expect(dataMatrix[1]).toEqual([-99, 'F']);

    // Check meta update
    expect(mockSetProjectMeta).toHaveBeenCalledTimes(1);
    expect(mockSetProjectMeta).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test.sav'
    }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('should handle API failure and set an error', async () => {
    const errorMessage = 'Backend processing failed';
    mockedProcessSavFile.mockRejectedValue(new Error(errorMessage));
    const { result } = renderHook(() => useOpenSavFileLogic({ onClose: mockOnClose }));

    act(() => {
      result.current.handleFileChange(mockFile);
    });
    
    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(mockOverwriteAll).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
}); 