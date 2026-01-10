import { renderHook, act } from '@testing-library/react';
import { usePrintLogic } from '../hooks/usePrintLogic';
import { useDataStore } from '@/stores/useDataStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useResultStore } from '@/stores/useResultStore';
import * as pdfPrintService from '../services/pdfPrintService';
import { jsPDF } from 'jspdf';
import type { Variable } from '@/types/Variable';

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useResultStore');
jest.mock('../services/pdfPrintService');
jest.mock('jspdf');

const mockPdfPrintService = pdfPrintService as jest.Mocked<typeof pdfPrintService>;
const mockJsPDF = jsPDF as unknown as jest.Mock;

const mockSave = jest.fn();
const mockDoc = { save: mockSave };

// Helper to create a complete Variable mock
const createMockVariable = (overrides: Partial<Variable> & { columnIndex: number; name: string; type: 'NUMERIC' | 'STRING' }): Variable => ({
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    columns: 1,
    align: 'left',
    measure: 'unknown',
    role: 'input',
    label: '',
    ...overrides,
});


describe('usePrintLogic', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        const mockLoadData = jest.fn().mockResolvedValue(undefined);
        const mockLoadVariables = jest.fn().mockResolvedValue(undefined);
        const mockLoadResults = jest.fn().mockResolvedValue(undefined);

        (useDataStore as any).getState = jest.fn().mockReturnValue({
            data: [{ '0': 'a', '1': 'b' }],
            loadData: mockLoadData,
        });

        (useVariableStore as any).getState = jest.fn().mockReturnValue({
            variables: [createMockVariable({ columnIndex: 0, name: 'Var1', type: 'STRING' })],
            loadVariables: mockLoadVariables,
        });

        (useResultStore as any).getState = jest.fn().mockReturnValue({
            logs: [{ id: '1', log: 'test log' }],
            loadResults: mockLoadResults,
        });

        // Mock the return value of the jsPDF constructor
        mockJsPDF.mockImplementation(() => mockDoc);

        // Provide mock implementations for service functions
        mockPdfPrintService.addDataGridView.mockReturnValue(50);
        mockPdfPrintService.addVariableView.mockReturnValue(100);
        mockPdfPrintService.addResultsView.mockReturnValue(150);
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => usePrintLogic({ onClose: mockOnClose }));
        expect(result.current.fileName).toBe('');
        expect(result.current.selectedOptions).toEqual({ data: true, variable: true, result: true });
        expect(result.current.paperSize).toBe('a4');
        expect(result.current.isGenerating).toBe(false);
    });

    it('should update state via setters', () => {
        const { result } = renderHook(() => usePrintLogic({ onClose: mockOnClose }));

        act(() => {
            result.current.setFileName('test-file');
            result.current.setPaperSize('letter');
            result.current.setSelectedOptions(prev => ({ ...prev, data: false }));
        });

        expect(result.current.fileName).toBe('test-file');
        expect(result.current.paperSize).toBe('letter');
        expect(result.current.selectedOptions.data).toBe(false);
    });

    it('should reset options to default', () => {
        const { result } = renderHook(() => usePrintLogic({ onClose: mockOnClose }));

        act(() => {
            result.current.setFileName('test-file');
            result.current.setPaperSize('a3');
        });

        act(() => {
            result.current.resetOptions();
        });

        expect(result.current.fileName).toBe('');
        expect(result.current.paperSize).toBe('a4');
    });

    describe('handlePrint', () => {
        it('should set generating state and call pdf services based on selections', async () => {
            const { result } = renderHook(() => usePrintLogic({ onClose: mockOnClose }));
            
            act(() => {
                result.current.setFileName('my-document');
            });

            await act(async () => {
                await result.current.handlePrint();
            });

            expect(result.current.isGenerating).toBe(false); // Should be reset
            expect(mockPdfPrintService.addDataGridView).toHaveBeenCalledTimes(1);
            expect(mockPdfPrintService.addVariableView).toHaveBeenCalledTimes(1);
            expect(mockPdfPrintService.addResultsView).toHaveBeenCalledTimes(1);
            expect(mockSave).toHaveBeenCalledWith('my-document.pdf');
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should only call selected pdf services', async () => {
            const { result } = renderHook(() => usePrintLogic({ onClose: mockOnClose }));
            
            act(() => {
                result.current.setSelectedOptions({ data: true, variable: false, result: false });
            });

            await act(async () => {
                await result.current.handlePrint();
            });

            expect(mockPdfPrintService.addDataGridView).toHaveBeenCalledTimes(1);
            expect(mockPdfPrintService.addVariableView).not.toHaveBeenCalled();
            expect(mockPdfPrintService.addResultsView).not.toHaveBeenCalled();
        });

        it('should use a default filename if none is provided', async () => {
            const { result } = renderHook(() => usePrintLogic({ onClose: mockOnClose }));

            await act(async () => {
                await result.current.handlePrint();
            });

            expect(mockSave).toHaveBeenCalledWith('statify_print_output.pdf');
        });

         it('should handle errors during PDF generation gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const error = new Error('PDF generation failed');
            mockPdfPrintService.addDataGridView.mockImplementation(() => { throw error; });

            const { result, rerender } = renderHook(() => usePrintLogic({ onClose: mockOnClose }));

            await act(async () => {
                await result.current.handlePrint();
            });

            expect(result.current.isGenerating).toBe(false);
            expect(console.error).toHaveBeenCalledWith("Error generating PDF:", error);
            expect(mockOnClose).not.toHaveBeenCalled(); // Should not close on error
            consoleErrorSpy.mockRestore();
        });
    });
}); 