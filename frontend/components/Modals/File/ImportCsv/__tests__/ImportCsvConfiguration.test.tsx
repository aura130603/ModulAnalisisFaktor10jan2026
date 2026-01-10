import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ImportCsvConfiguration } from '../components/ImportCsvConfiguration';
import { useImportCsvProcessor } from '../hooks/useImportCsvProcessor';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('../hooks/useImportCsvProcessor');
jest.mock('@/hooks/use-toast');

// Mock framer-motion untuk menghindari masalah dengan animasi dalam testing
jest.mock('framer-motion', () => ({
    ...jest.requireActual('framer-motion'),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: jest.fn(({ children, ...props }) => <div {...props}>{children}</div>)
    }
}));

// Mock createPortal untuk menghindari masalah dengan portal dalam testing
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    createPortal: (children: React.ReactNode) => children
}));

const mockUseImportCsvProcessor = useImportCsvProcessor as jest.Mock;
const mockUseToast = useToast as jest.Mock;

describe('ImportCsvConfiguration Component', () => {
    const mockOnClose = jest.fn();
    const mockOnBack = jest.fn();
    const mockProcessCSV = jest.fn();
    const mockToast = jest.fn();
    const user = userEvent.setup();

    const defaultProps = {
        onClose: mockOnClose,
        onBack: mockOnBack,
        fileName: 'test.csv',
        fileContent: 'name,age,city\nJohn,25,Jakarta\nJane,30,Bandung'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock useImportCsvProcessor hook
        mockUseImportCsvProcessor.mockReturnValue({
            processCSV: mockProcessCSV,
            isProcessing: false
        });
        
        // Mock useToast hook
        mockUseToast.mockReturnValue({
            toast: mockToast
        });
    });

    it('renders all UI elements correctly', () => {
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        expect(screen.getByText('Configure Import: test.csv')).toBeInTheDocument();
        expect(screen.getByText('Preview (first 10 lines)')).toBeInTheDocument();
        expect(screen.getByText('First line contains variable names')).toBeInTheDocument();
        expect(screen.getByText('Delimiter:')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Import/i })).toBeInTheDocument();
    });

    it('displays file preview correctly', () => {
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        // Cek apakah preview menampilkan baris pertama dari file
        expect(screen.getByText('name,age,city')).toBeInTheDocument();
        expect(screen.getByText('John,25,Jakarta')).toBeInTheDocument();
    });

    it('calls onBack when Back button is clicked', async () => {
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        const backButton = screen.getByRole('button', { name: /Back/i });
        await user.click(backButton);
        
        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('resets configuration when Reset button is clicked', async () => {
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        // Ubah beberapa setting terlebih dahulu
        const delimiterSelect = screen.getByRole('combobox', { name: /delimiter/i });
        await user.selectOptions(delimiterSelect, 'semicolon');
        
        // Klik Reset
        const resetButton = screen.getByRole('button', { name: /Reset/i });
        await user.click(resetButton);
        
        // Verifikasi bahwa setting kembali ke default
        expect(delimiterSelect).toHaveValue('comma');
    });

    it('successfully imports CSV and shows success toast', async () => {
        mockProcessCSV.mockResolvedValueOnce(undefined);
        
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        const importButton = screen.getByRole('button', { name: /Import/i });
        await user.click(importButton);
        
        await waitFor(() => {
            expect(mockProcessCSV).toHaveBeenCalledWith({
                fileContent: defaultProps.fileContent,
                options: {
                    firstLineContains: true,
                    removeLeading: false,
                    removeTrailing: false,
                    delimiter: 'comma',
                    decimal: 'period',
                    textQualifier: 'doubleQuote'
                }
            });
        });
        
        // Verifikasi toast sukses dipanggil
        expect(mockToast).toHaveBeenCalledWith({
            title: 'Import Berhasil',
            description: 'File test.csv berhasil diimpor ke dalam sistem.',
            variant: 'default'
        });
        
        // Verifikasi modal ditutup
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('handles import failure and shows error toast', async () => {
        const errorMessage = 'Invalid CSV format';
        mockProcessCSV.mockRejectedValueOnce(new Error(errorMessage));
        
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        const importButton = screen.getByRole('button', { name: /Import/i });
        await user.click(importButton);
        
        await waitFor(() => {
            expect(mockProcessCSV).toHaveBeenCalled();
        });
        
        // Verifikasi error message ditampilkan
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        
        // Verifikasi toast error dipanggil
        expect(mockToast).toHaveBeenCalledWith({
            title: 'Import Gagal',
            description: errorMessage,
            variant: 'destructive'
        });
        
        // Verifikasi modal tidak ditutup
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('handles import failure with generic error message', async () => {
        mockProcessCSV.mockRejectedValueOnce(new Error());
        
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        const importButton = screen.getByRole('button', { name: /Import/i });
        await user.click(importButton);
        
        await waitFor(() => {
            expect(mockProcessCSV).toHaveBeenCalled();
        });
        
        // Verifikasi generic error message ditampilkan
        expect(screen.getByText('Failed to process CSV.')).toBeInTheDocument();
        
        // Verifikasi toast error dipanggil dengan generic message
        expect(mockToast).toHaveBeenCalledWith({
            title: 'Import Gagal',
            description: 'Failed to process CSV.',
            variant: 'destructive'
        });
    });

    it('disables import button when processing', () => {
        mockUseImportCsvProcessor.mockReturnValue({
            processCSV: mockProcessCSV,
            isProcessing: true
        });
        
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        const importButton = screen.getByRole('button', { name: /Import/i });
        expect(importButton).toBeDisabled();
    });

    it('shows loading state when processing', () => {
        mockUseImportCsvProcessor.mockReturnValue({
            processCSV: mockProcessCSV,
            isProcessing: true
        });
        
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        // Verifikasi loading spinner ditampilkan
        expect(screen.getByRole('button', { name: /Import/i })).toBeInTheDocument();
    });

    it('allows changing delimiter option', async () => {
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        // Cari select berdasarkan label yang lebih spesifik
        const delimiterSelect = screen.getByRole('combobox', { name: /delimiter/i });
        await user.selectOptions(delimiterSelect, 'semicolon');
        
        expect(delimiterSelect).toHaveValue('semicolon');
    });

    it('allows changing decimal symbol option', async () => {
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        // Cari select berdasarkan label yang lebih spesifik
        const decimalSelect = screen.getByRole('combobox', { name: /decimal/i });
        await user.selectOptions(decimalSelect, 'comma');
        
        expect(decimalSelect).toHaveValue('comma');
    });

    it('allows toggling variable names checkbox', async () => {
        render(<ImportCsvConfiguration {...defaultProps} />);
        
        const checkbox = screen.getByRole('checkbox', { name: /First line contains variable names/i });
        expect(checkbox).toBeChecked();
        
        await user.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });
});