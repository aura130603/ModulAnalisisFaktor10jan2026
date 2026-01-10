import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ImportClipboardConfigurationStep } from '../components/ImportClipboardConfigurationStep';
import * as processorHook from '../hooks/useImportClipboardProcessor';

// Mock the processor hook
jest.mock('../hooks/useImportClipboardProcessor');
const mockedUseImportClipboardProcessor = processorHook.useImportClipboardProcessor as jest.Mock;

// Mock Handsontable
jest.mock('@handsontable/react-wrapper', () => ({
    HotTable: (props: any) => (
        <div data-testid="mock-hot-table">
            <div data-testid="hot-data">{JSON.stringify(props.data)}</div>
            <div data-testid="hot-headers">{JSON.stringify(props.colHeaders)}</div>
        </div>
    ),
}));

describe('ImportClipboardConfigurationStep Component', () => {
    const mockOnClose = jest.fn();
    const mockOnBack = jest.fn();
    const mockExcelStyleTextToColumns = jest.fn();
    const mockProcessClipboardData = jest.fn();
    const user = userEvent.setup();

    const defaultProps = {
        onClose: mockOnClose,
        onBack: mockOnBack,
        pastedText: 'col1\tcol2\nval1\tval2',
        parsedData: [['col1', 'col2'], ['val1', 'val2']],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseImportClipboardProcessor.mockReturnValue({
            excelStyleTextToColumns: mockExcelStyleTextToColumns,
            processClipboardData: mockProcessClipboardData,
        });
        mockExcelStyleTextToColumns.mockReturnValue(defaultProps.parsedData);
    });

    it('renders correctly with initial data', () => {
        render(<ImportClipboardConfigurationStep {...defaultProps} />);
        expect(screen.getByText('Configure Clipboard Import')).toBeInTheDocument();
        expect(screen.getByTestId('mock-hot-table')).toBeInTheDocument();
        expect(screen.getByTestId('hot-data')).toHaveTextContent(JSON.stringify(defaultProps.parsedData));
    });

    it('updates preview when delimiter option is changed', async () => {
        render(<ImportClipboardConfigurationStep {...defaultProps} />);
        
        const delimiterSelect = screen.getAllByRole('combobox')[0];
        await user.click(delimiterSelect);
        const commaOption = await screen.findByText('Comma (,)');
        await user.click(commaOption);
        
        await waitFor(() => {
            expect(mockExcelStyleTextToColumns).toHaveBeenCalledWith(
                defaultProps.pastedText,
                expect.objectContaining({ delimiter: ',' })
            );
        });
    });

    it('updates preview when "First row as headers" is toggled', async () => {
        render(<ImportClipboardConfigurationStep {...defaultProps} />);
        const headerCheckbox = screen.getByLabelText(/first row as headers/i);
        
        await user.click(headerCheckbox);

        await waitFor(() => {
            expect(mockExcelStyleTextToColumns).toHaveBeenCalledWith(
                defaultProps.pastedText,
                expect.objectContaining({ hasHeaderRow: true })
            );
        });
    });

    it('calls onBack when Back button is clicked', async () => {
        render(<ImportClipboardConfigurationStep {...defaultProps} />);
        const backButton = screen.getByRole('button', { name: /back/i });
        await user.click(backButton);
        expect(mockOnBack).toHaveBeenCalled();
    });

    it('calls processClipboardData and onClose on successful import', async () => {
        render(<ImportClipboardConfigurationStep {...defaultProps} />);
        const importButton = screen.getByRole('button', { name: /import/i });
        await user.click(importButton);
        
        expect(mockProcessClipboardData).toHaveBeenCalled();
        await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('displays an error message if import fails', async () => {
        const error = new Error('Import failed');
        mockProcessClipboardData.mockRejectedValue(error);
        render(<ImportClipboardConfigurationStep {...defaultProps} />);
        const importButton = screen.getByRole('button', { name: /import/i });
        
        await user.click(importButton);
        
        expect(await screen.findByText(error.message)).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('disables import button when there is no preview data', () => {
        mockExcelStyleTextToColumns.mockReturnValue([]);
        render(<ImportClipboardConfigurationStep {...defaultProps} pastedText="" parsedData={[]} />);
        expect(screen.getByRole('button', { name: /import/i })).toBeDisabled();
    });
}); 