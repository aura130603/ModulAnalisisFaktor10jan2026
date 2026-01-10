import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Aggregate from '..';
import { useAggregateData } from '../hooks/useAggregateData';

// Mock the hook
jest.mock('../hooks/useAggregateData');
const mockedUseAggregateData = useAggregateData as jest.Mock;

// Mock the useModal hook from the library
jest.mock('@/hooks/useModal', () => ({
    useModal: () => ({
        closeModal: jest.fn(),
    }),
}));

// Mock child dialogs
jest.mock('../dialogs/ErrorDialog', () => ({ ErrorDialog: () => <div data-testid="error-dialog" /> }));
jest.mock('../dialogs/FunctionDialog', () => ({ FunctionDialog: () => <div data-testid="function-dialog" /> }));
jest.mock('../dialogs/NameLabelDialog', () => ({ NameLabelDialog: () => <div data-testid="name-label-dialog" /> }));


const mockHandleConfirm = jest.fn();
const mockHandleReset = jest.fn();
const mockOnClose = jest.fn();

// Simplified Variable type for tests
interface Variable {
    columnIndex: number;
    name: string;
    type: 'STRING' | 'NUMERIC';
    label?: string;
    measure: 'scale' | 'nominal' | 'ordinal';
}

// More detailed mock data
const sampleAvailableVars: Variable[] = [
    { columnIndex: 0, name: 'Var1', type: 'NUMERIC', label: 'Variable 1', measure: 'scale' },
    { columnIndex: 1, name: 'Var2', type: 'STRING', label: 'Variable 2', measure: 'nominal' },
];

const sampleBreakVars: Variable[] = [
    { columnIndex: 2, name: 'GroupVar', type: 'STRING', label: 'Group Variable', measure: 'nominal' },
];

const sampleAggregatedVars = [
    { aggregateId: 'agg1', name: 'Var1_mean', displayName: 'Var1_mean = MEAN(Var1)', baseVarName: 'Var1' }
];

describe('Aggregate Component', () => {
    // Default mock state
    let mockState: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockState = {
            availableVariables: sampleAvailableVars,
            breakVariables: [],
            aggregatedVariables: [],
            activeTab: 'variables',
            highlightedVariable: null,
            errorMessage: null,
            errorDialogOpen: false,
            functionDialogOpen: false,
            nameDialogOpen: false,
            addNumberOfCases: false,
            breakName: 'N_BREAK',
            getDisplayName: (v: any) => v.label || v.name,
            handleConfirm: mockHandleConfirm,
            handleReset: mockHandleReset,
            setActiveTab: jest.fn(),
            handleVariableSelect: jest.fn(),
            handleAggregatedVariableSelect: jest.fn(),
            handleVariableDoubleClick: jest.fn(),
            handleAggregatedDoubleClick: jest.fn(),
            moveFromBreak: jest.fn(),
            moveToBreak: jest.fn(),
            moveFromAggregated: jest.fn(),
            moveToAggregated: jest.fn(),
            handleFunctionClick: jest.fn(),
            handleNameLabelClick: jest.fn(),
            setAddNumberOfCases: jest.fn(),
        };
        mockedUseAggregateData.mockReturnValue(mockState);
    });

    it('renders the Aggregate modal with title and tabs', () => {
        render(<Aggregate onClose={mockOnClose} />);

        expect(screen.getByText('Aggregate Data')).toBeInTheDocument();
        expect(screen.getByText('Variables')).toBeInTheDocument();
        expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('renders variables in their correct lists', () => {
        mockedUseAggregateData.mockReturnValue({
            ...mockState,
            breakVariables: sampleBreakVars,
            aggregatedVariables: sampleAggregatedVars,
        });
        render(<Aggregate onClose={mockOnClose} />);

        const availableList = screen.getByTestId('available-variable-list');
        const breakList = screen.getByTestId('break-variable-list');
        const aggregatedList = screen.getByTestId('aggregated-variable-list');

        // Check available variables
        expect(within(availableList).getByText('Variable 1')).toBeInTheDocument();
        expect(within(availableList).getByText('Variable 2')).toBeInTheDocument();
        
        // Check break variables
        expect(within(breakList).getByText('Group Variable')).toBeInTheDocument();
        
        // Check aggregated variables
        expect(within(aggregatedList).getByText('Var1_mean = MEAN(Var1)')).toBeInTheDocument();
    });

    it('calls handleConfirm when OK button is clicked', async () => {
        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();

        const okButton = screen.getByRole('button', { name: /ok/i });
        await user.click(okButton);

        expect(mockHandleConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', async () => {
        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();
        
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls handleReset when Reset button is clicked', async () => {
        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();

        const resetButton = screen.getByRole('button', { name: /reset/i });
        await user.click(resetButton);

        expect(mockHandleReset).toHaveBeenCalledTimes(1);
    });

    it('disables Function and Name & Label buttons when no aggregated var is selected', () => {
        render(<Aggregate onClose={mockOnClose} />);
        
        const functionButton = screen.getByRole('button', { name: /function/i });
        const nameLabelButton = screen.getByRole('button', { name: /name & label/i });

        expect(functionButton).toBeDisabled();
        expect(nameLabelButton).toBeDisabled();
    });

    it('enables Function and Name & Label buttons when an aggregated var is selected', () => {
        mockedUseAggregateData.mockReturnValue({
            ...mockState,
            highlightedVariable: { id: 'agg1', source: 'aggregated' },
        });

        render(<Aggregate onClose={mockOnClose} />);

        const functionButton = screen.getByRole('button', { name: /function/i });
        const nameLabelButton = screen.getByRole('button', { name: /name & label/i });

        expect(functionButton).toBeEnabled();
        expect(nameLabelButton).toBeEnabled();
    });

    it('switches tabs when a tab is clicked', async () => {
        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();

        const optionsTab = screen.getByText('Options');
        await user.click(optionsTab);

        expect(mockState.setActiveTab).toHaveBeenCalledWith('options');
    });

    it('renders available variables and handles double click', async () => {
        render(<Aggregate onClose={mockOnClose} />);
        const user = userEvent.setup();
    
        // Find variable by its display name (label or name)
        const variableItem = screen.getByText('Variable 2'); // This is the label for Var2
        expect(variableItem).toBeInTheDocument();
    
        await user.dblClick(variableItem);
    
        expect(mockState.handleVariableDoubleClick).toHaveBeenCalledTimes(1);
        // The second argument is the source list, which is 'available'
        expect(mockState.handleVariableDoubleClick).toHaveBeenCalledWith(1, 'available');
      });
}); 