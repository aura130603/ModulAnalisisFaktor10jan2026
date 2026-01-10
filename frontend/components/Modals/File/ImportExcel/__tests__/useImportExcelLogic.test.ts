import { renderHook, act } from '@testing-library/react';
import { useImportExcelLogic } from '../hooks/useImportExcelLogic';
import { useExcelWorker } from '../hooks/useExcelWorker';

// Mock dependencies
jest.mock('@/hooks/useMobile', () => ({
  useMobile: () => ({ isMobile: false, isPortrait: false }),
}));
jest.mock('../hooks/useExcelWorker');

const mockedUseExcelWorker = useExcelWorker as jest.Mock;
const mockParse = jest.fn();

describe('useImportExcelLogic hook', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseExcelWorker.mockReturnValue({
      parse: mockParse,
    });
  });

  it('should initialize with default "select" stage', () => {
    const { result } = renderHook(() => useImportExcelLogic({ onClose: mockOnClose }));
    expect(result.current.stage).toBe('select');
    expect(result.current.file).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should update file and fileName on handleFileSelect', () => {
    const { result } = renderHook(() => useImportExcelLogic({ onClose: mockOnClose }));
    const mockFile = new File([''], 'test.xlsx', { type: 'application/vnd.ms-excel' });

    act(() => {
      result.current.handleFileSelect(mockFile);
    });

    expect(result.current.file).toBe(mockFile);
    expect(result.current.fileName).toBe('test.xlsx');
  });

  it('should not proceed to configure if no file is selected', async () => {
    const { result } = renderHook(() => useImportExcelLogic({ onClose: mockOnClose }));

    await act(async () => {
      await result.current.handleContinueToConfigure();
    });

    expect(result.current.stage).toBe('select');
    expect(result.current.error).toBe('Please select an Excel file (.xls, .xlsx).');
    expect(mockParse).not.toHaveBeenCalled();
  });

  it('should proceed to configure stage on successful parse', async () => {
    const mockFile = new File([''], 'test.xlsx');
    const parsedResult = [{ sheetName: 'Sheet1', data: [] }];
    mockParse.mockResolvedValue(parsedResult);
    
    const { result } = renderHook(() => useImportExcelLogic({ onClose: mockOnClose }));
    
    act(() => {
      result.current.handleFileSelect(mockFile);
    });
    
    await act(async () => {
      await result.current.handleContinueToConfigure();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.stage).toBe('configure');
    expect(result.current.parsedSheets).toEqual(parsedResult);
    expect(result.current.error).toBeNull();
  });

  it('should handle parsing failure and set an error', async () => {
    const mockFile = new File([''], 'test.xlsx');
    const errorMessage = 'File is corrupted';
    mockParse.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useImportExcelLogic({ onClose: mockOnClose }));

    act(() => {
        result.current.handleFileSelect(mockFile);
    });
    
    await act(async () => {
      await result.current.handleContinueToConfigure();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.stage).toBe('select');
    expect(result.current.error).toBe(errorMessage);
  });
  
  it('should transition back to select stage', () => {
    const { result } = renderHook(() => useImportExcelLogic({ onClose: mockOnClose }));

    // First go to configure
    act(() => {
      result.current.setStage('configure');
      result.current.setParsedSheets([ { sheetName: 's1', data: [] } ]);
    });
    expect(result.current.stage).toBe('configure');

    // Then go back
    act(() => {
      result.current.handleBackToSelect();
    });

    expect(result.current.stage).toBe('select');
    expect(result.current.parsedSheets).toBeNull();
  });
}); 