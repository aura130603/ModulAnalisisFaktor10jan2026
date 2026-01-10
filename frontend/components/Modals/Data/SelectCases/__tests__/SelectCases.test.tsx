import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SelectCases from '../index';
import { useSelectCases } from '../hooks/useSelectCases';

// Mock the custom hook used by the component
jest.mock('../hooks/useSelectCases');
const mockedUseSelectCases = useSelectCases as jest.Mock;

// Mock child components to simplify testing
jest.mock('../dialogs/SelectCasesIfCondition', () => {
    const MockSelectCasesIfCondition = () => <div>SelectCasesIfCondition</div>;
    MockSelectCasesIfCondition.displayName = 'MockSelectCasesIfCondition';
    return MockSelectCasesIfCondition;
});
jest.mock('../dialogs/SelectCasesRandomSample', () => {
    const MockSelectCasesRandomSample = () => <div>SelectCasesRandomSample</div>;
    MockSelectCasesRandomSample.displayName = 'MockSelectCasesRandomSample';
    return MockSelectCasesRandomSample;
});
jest.mock('../dialogs/SelectCasesRange', () => {
    const MockSelectCasesRange = () => <div>SelectCasesRange</div>;
    MockSelectCasesRange.displayName = 'MockSelectCasesRange';
    return MockSelectCasesRange;
});

describe('SelectCases Component', () => {
    const mockOnClose = jest.fn();
    const mockHandleConfirm = jest.fn();
    const mockHandleReset = jest.fn();
    const mockSetSelectOption = jest.fn();
    const mockSetIfConditionDialogOpen = jest.fn();
    const mockSetRandomSampleDialogOpen = jest.fn();
    const mockSetRangeDialogOpen = jest.fn();
    const mockSetErrorDialogOpen = jest.fn();

    const baseMockValues = {
        storeVariables: [
            { columnIndex: 1, name: 'Var1', label: 'Variable 1', type: 'Numeric' },
            { columnIndex: 2, name: 'Var2', label: 'Variable 2', type: 'String' },
        ],
        highlightedVariable: null,
        selectOption: 'all',
        filterVariable: null,
        outputOption: 'filter',
        currentStatus: 'Unfiltered. All cases are currently included.',
        errorMessage: '',
        errorDialogOpen: false,
        ifConditionDialogOpen: false,
        randomSampleDialogOpen: false,
        rangeDialogOpen: false,
        conditionExpression: '',
        randomSampleConfig: null,
        rangeConfig: null,
        isProcessing: false,
        setErrorDialogOpen: mockSetErrorDialogOpen,
        setIfConditionDialogOpen: mockSetIfConditionDialogOpen,
        setRandomSampleDialogOpen: mockSetRandomSampleDialogOpen,
        setRangeDialogOpen: mockSetRangeDialogOpen,
        handleVariableSelect: jest.fn(),
        handleVariableDoubleClick: jest.fn(),
        handleTransferClick: jest.fn(),
        handleIfButtonClick: jest.fn(),
        handleSampleButtonClick: jest.fn(),
        handleRangeButtonClick: jest.fn(),
        handleIfConditionContinue: jest.fn(),
        handleRandomSampleContinue: jest.fn(),
        handleRangeContinue: jest.fn(),
        handleConfirm: mockHandleConfirm,
        handleReset: mockHandleReset,
        setOutputOption: jest.fn(),
        setSelectOption: mockSetSelectOption,
    };

    const renderComponent = (props: Partial<typeof baseMockValues> = {}, containerType: "dialog" | "sidebar" = "dialog") => {
        mockedUseSelectCases.mockReturnValue({ ...baseMockValues, ...props });
        return render(<SelectCases onClose={mockOnClose} containerType={containerType} />);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the component in dialog mode correctly', () => {
        renderComponent();
        expect(screen.getByText('Variables:')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'OK' })[0]).toBeInTheDocument();
        expect(screen.getByText(/Variable 1/)).toBeInTheDocument();
    });

    it('renders the component in sidebar mode correctly', () => {
        renderComponent({}, "sidebar");
        expect(screen.getByText('Variables:')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'OK' })[0]).toBeInTheDocument();
    });

    it('calls handleConfirm, handleReset, and onClose for dialog buttons', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        await user.click(screen.getAllByRole('button', { name: /ok/i })[0]);
        expect(mockHandleConfirm).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: /reset/i }));
        expect(mockHandleReset).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: /cancel/i }));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('handles radio button changes for select options', async () => {
        renderComponent();
        fireEvent.click(screen.getByText('If condition is satisfied'));
        expect(mockSetSelectOption).toHaveBeenCalledWith('condition');
    });

    it('shows the correct dialog when its button is clicked', async () => {
        const user = userEvent.setup();

        // Test "If" dialog
        renderComponent({ selectOption: 'condition', ifConditionDialogOpen: true });
        expect(screen.getByText('SelectCasesIfCondition')).toBeInTheDocument();
        
        // Test "Sample" dialog
        renderComponent({ selectOption: 'random', randomSampleDialogOpen: true });
        expect(screen.getByText('SelectCasesRandomSample')).toBeInTheDocument();

        // Test "Range" dialog
        renderComponent({ selectOption: 'time', rangeDialogOpen: true });
        expect(screen.getByText('SelectCasesRange')).toBeInTheDocument();
    });

    it('disables buttons and shows processing state when isProcessing is true', () => {
        renderComponent({ isProcessing: true });
        
        const okButton = screen.getAllByRole('button', { name: 'Processing...' })[0];
        expect(okButton).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    });

    it('displays error dialog when errorDialogOpen is true', () => {
        const errorMessage = 'This is a test error';
        renderComponent({ errorDialogOpen: true, errorMessage });

        expect(screen.getByText('Action Cannot Be Completed')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();

        // Check if close button works
        const okButtons = screen.getAllByRole('button', { name: /ok/i });
        const okButton = okButtons[okButtons.length - 1];
        fireEvent.click(okButton);
        expect(mockSetErrorDialogOpen).toHaveBeenCalledWith(false);
    });
});
