import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ImportCsvSelection } from '../components/ImportCsvSelection';
import { useMobile } from '@/hooks/useMobile';

// Mock the useMobile hook
jest.mock('@/hooks/useMobile', () => ({
  useMobile: jest.fn(() => ({ isMobile: false, isPortrait: false })),
}));

// Mock the Tour components as they are not the focus of this test
jest.mock('framer-motion', () => ({
    ...jest.requireActual('framer-motion'),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: jest.fn(({ children, ...props }) => <div {...props}>{children}</div>)
    }
}));

describe('ImportCsvSelection Component', () => {
    const mockOnClose = jest.fn();
    const mockOnFileSelect = jest.fn();
    const mockOnContinue = jest.fn();
    const user = userEvent.setup();

    const defaultProps = {
        onClose: mockOnClose,
        onFileSelect: mockOnFileSelect,
        onContinue: mockOnContinue,
        isLoading: false,
        selectedFile: null,
        error: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all UI elements correctly', () => {
        render(<ImportCsvSelection {...defaultProps} />);
        expect(screen.getByText('Import CSV File')).toBeInTheDocument();
        expect(screen.getByText(/Click to select a CSV file/i)).toBeInTheDocument();
        expect(screen.getByText(/or drag and drop here/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('disables the Continue button when no file is selected', () => {
        render(<ImportCsvSelection {...defaultProps} />);
        expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
    });

    it('enables the Continue button when a file is selected', () => {
        const file = new File(['a,b'], 'test.csv', { type: 'text/csv' });
        render(<ImportCsvSelection {...defaultProps} selectedFile={file} />);
        expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();
    });

    it('calls onFileSelect when a file is selected via the input', async () => {
        render(<ImportCsvSelection {...defaultProps} />);
        
        const file = new File(['a,b\nc,d'], 'test.csv', { type: 'text/csv' });
        const fileInput = screen.getByTestId('dropzone-input');
        
        await user.upload(fileInput, file);

        expect(mockOnFileSelect).toHaveBeenCalledTimes(1);
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it('calls onContinue when Continue button is clicked', async () => {
        const file = new File(['a,b'], 'test.csv', { type: 'text/csv' });
        render(<ImportCsvSelection {...defaultProps} selectedFile={file} />);
        const continueButton = screen.getByRole('button', { name: /Continue/i });
        await user.click(continueButton);
        expect(mockOnContinue).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', async () => {
        render(<ImportCsvSelection {...defaultProps} />);
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('displays an error message when error prop is provided', () => {
        const errorMessage = 'Invalid file type.';
        render(<ImportCsvSelection {...defaultProps} error={errorMessage} />);
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        // Check for destructive alert variant by a more stable class
        const alert = screen.getByRole('alert');
        expect(alert).toHaveClass('text-destructive');
    });

    it('shows loading state on Continue button', () => {
        render(<ImportCsvSelection {...defaultProps} isLoading={true} selectedFile={new File(['a'], 'f.csv')} />);
        const continueButton = screen.getByRole('button', { name: /Continue/i });
        expect(continueButton).toBeDisabled();
        expect(continueButton.querySelector('svg.animate-spin')).toBeInTheDocument();
    });

    it('simulates a file drop', async () => {
        render(<ImportCsvSelection {...defaultProps} />);
        const dropzone = screen.getByText(/Click to select a CSV file/i).parentElement as HTMLElement;
        const file = new File(['a,b'], 'test.csv', { type: 'text/csv' });

        fireEvent.drop(dropzone, {
            dataTransfer: {
                files: [file],
                types: ['Files'],
            },
        });

        // Wait until the file selection callback has been invoked once
        await waitFor(() => expect(mockOnFileSelect).toHaveBeenCalledTimes(1));
        // Verify it was called with the correct file outside of waitFor (single assertion rule)
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });
}); 