import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ImportClipboardPasteStep } from '../components/ImportClipboardPasteStep';
import * as services from '../services/services';

jest.mock('../services/services');
const mockedReadTextFromClipboard = services.readTextFromClipboard as jest.Mock;

describe('ImportClipboardPasteStep Component', () => {
    const mockOnClose = jest.fn();
    const mockOnTextPaste = jest.fn();
    const mockOnContinue = jest.fn();
    const user = userEvent.setup();

    const defaultProps = {
        onClose: mockOnClose,
        onTextPaste: mockOnTextPaste,
        onContinue: mockOnContinue,
        isLoading: false,
        error: null,
        pastedText: '',
        isMobile: false,
        isPortrait: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all essential UI elements', () => {
        render(<ImportClipboardPasteStep {...defaultProps} />);
        expect(screen.getByText('Import from Clipboard')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Paste from Clipboard/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Paste your tabular data here...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('disables the Continue button when there is no pasted text', () => {
        render(<ImportClipboardPasteStep {...defaultProps} />);
        expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('enables the Continue button when there is pasted text', () => {
        render(<ImportClipboardPasteStep {...defaultProps} pastedText="some data" />);
        expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    });

    it('calls onContinue when the Continue button is clicked', async () => {
        render(<ImportClipboardPasteStep {...defaultProps} pastedText="some data" />);
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await user.click(continueButton);
        expect(mockOnContinue).toHaveBeenCalled();
    });

    it('calls onClose when the Cancel button is clicked', async () => {
        render(<ImportClipboardPasteStep {...defaultProps} />);
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        await user.click(cancelButton);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onTextPaste when text is entered in the textarea', async () => {
        render(<ImportClipboardPasteStep {...defaultProps} />);
        const textarea = screen.getByPlaceholderText('Paste your tabular data here...');
        fireEvent.paste(textarea, { clipboardData: { getData: () => 'hello' } });
        expect(mockOnTextPaste).toHaveBeenLastCalledWith('hello');
    });

    it('calls readTextFromClipboard and onTextPaste when Paste button is clicked', async () => {
        const clipboardText = 'pasted from button';
        mockedReadTextFromClipboard.mockResolvedValue(clipboardText);
        render(<ImportClipboardPasteStep {...defaultProps} />);
        
        const pasteButton = screen.getByRole('button', { name: /Paste from Clipboard/i });
        await user.click(pasteButton);

        expect(mockedReadTextFromClipboard).toHaveBeenCalled();
        expect(mockOnTextPaste).toHaveBeenCalledWith(clipboardText);
    });

    it('shows an error if readTextFromClipboard fails', async () => {
        const errorMessage = 'Clipboard access denied.';
        mockedReadTextFromClipboard.mockRejectedValue(new Error(errorMessage));
        render(<ImportClipboardPasteStep {...defaultProps} />);

        const pasteButton = screen.getByRole('button', { name: /Paste from Clipboard/i });
        await user.click(pasteButton);

        expect(screen.getByText(/Clipboard access denied/i)).toBeInTheDocument();
    });
    
    it('displays an error message when the error prop is provided', () => {
        const error = 'Failed to process data.';
        render(<ImportClipboardPasteStep {...defaultProps} error={error} />);
        expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('disables controls when isLoading is true', () => {
        render(<ImportClipboardPasteStep {...defaultProps} isLoading={true} />);
        expect(screen.getByRole('button', { name: /Paste from Clipboard/i })).toBeDisabled();
        expect(screen.getByPlaceholderText('Paste your tabular data here...')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });
}); 