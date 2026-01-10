import { renderHook, act } from '@testing-library/react';
import { useExportCsv } from '../hooks/useExportCsv';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useToast } from '@/hooks/use-toast';
import { useModal } from '@/hooks/useModal';
import * as exportUtils from '../utils/exportCsvUtils';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/hooks/use-toast');
jest.mock('@/hooks/useModal');
jest.mock('../utils/exportCsvUtils');

const mockGenerateCsvContent = exportUtils.generateCsvContent as jest.Mock;

const mockToast = jest.fn();
const mockCloseModal = jest.fn();

// Mock global URL and anchor element for download simulation
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
if (typeof global.URL.createObjectURL === 'undefined') {
    Object.defineProperty(global.URL, 'createObjectURL', { value: mockCreateObjectURL, writable: true });
}
if (typeof global.URL.revokeObjectURL === 'undefined') {
    Object.defineProperty(global.URL, 'revokeObjectURL', { value: mockRevokeObjectURL, writable: true });
}

describe('useExportCsv Hook', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mock implementations
        (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
        (useModal as jest.Mock).mockReturnValue({ closeModal: mockCloseModal });
        
        const mockDataState = { data: [[1, 'test']], loadData: jest.fn().mockResolvedValue(undefined) };
        (useDataStore as unknown as jest.Mock).mockImplementation(cb => cb(mockDataState));
        (useDataStore as any).getState = () => mockDataState;

        const mockVarState = { variables: [{ name: 'Var1' }], loadVariables: jest.fn().mockResolvedValue(undefined) };
        (useVariableStore as unknown as jest.Mock).mockImplementation(cb => cb(mockVarState));
        (useVariableStore as any).getState = () => mockVarState;

        mockGenerateCsvContent.mockReturnValue('csv,content');
    });

    it('initializes with default options', () => {
        const { result } = renderHook(() => useExportCsv());
        expect(result.current.exportOptions.filename).toBe('statify-export');
        expect(result.current.exportOptions.delimiter).toBe(',');
    });

    it('initializes with provided options', () => {
        const { result } = renderHook(() => useExportCsv({ initialFilename: 'custom', initialDelimiter: ';' }));
        expect(result.current.exportOptions.filename).toBe('custom');
        expect(result.current.exportOptions.delimiter).toBe(';');
    });

    it('handles option changes correctly', () => {
        const { result } = renderHook(() => useExportCsv());
        act(() => {
            result.current.handleChange('quoteStrings', false);
        });
        expect(result.current.exportOptions.quoteStrings).toBe(false);
    });


    it('sanitizes filename on change', () => {
        const { result } = renderHook(() => useExportCsv());
        act(() => {
            result.current.handleFilenameChange('file/with?invalid*chars');
        });
        expect(result.current.exportOptions.filename).toBe('filewithinvalidchars');
    });

    it('shows toast and returns if no data is available', async () => {
        const mockEmptyDataState = { data: [], loadData: jest.fn().mockResolvedValue(undefined) };
        (useDataStore as unknown as jest.Mock).mockImplementation(cb => cb(mockEmptyDataState));
        (useDataStore as any).getState = () => mockEmptyDataState;

        const { result } = renderHook(() => useExportCsv());
        await act(async () => {
            await result.current.handleExport();
        });
        
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', description: 'No data available to export.' }));
        expect(mockGenerateCsvContent).not.toHaveBeenCalled();
    });

    it('shows toast if filename is empty', async () => {
        const { result } = renderHook(() => useExportCsv({ initialFilename: ' ' }));
        await act(async () => {
            await result.current.handleExport();
        });

        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: 'Please enter a valid file name.' }));
    });

    it('successfully generates and downloads a CSV file', async () => {
        const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        const { result } = renderHook(() => useExportCsv());
        
        await act(async () => {
            await result.current.handleExport();
        });

        // Verify that latest data was fetched
        expect((useVariableStore as any).getState().loadVariables).toHaveBeenCalled();
        expect((useDataStore as any).getState().loadData).toHaveBeenCalled();

        // Verify CSV generation was called
        expect(mockGenerateCsvContent).toHaveBeenCalledWith(
            [[1, 'test']], // freshData
            [{ name: 'Var1' }], // freshVariables
            expect.any(Object)
        );

        // Verify download was triggered
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();

        // Verify success feedback
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Export Successful' }));
        expect(mockCloseModal).toHaveBeenCalled();
        
        clickSpy.mockRestore();
    });
    
    it('handles export errors gracefully', async () => {
        const error = new Error('Test export error');
        mockGenerateCsvContent.mockImplementation(() => { throw error; });

        const { result } = renderHook(() => useExportCsv());

        await act(async () => {
            await result.current.handleExport();
        });

        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Export Failed',
            variant: 'destructive'
        }));
    });
}); 