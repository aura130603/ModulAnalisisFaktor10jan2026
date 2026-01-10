import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TargetListConfig } from '../VariableListManager';
import VariableListManager from '../VariableListManager';
import type { Variable } from '@/types/Variable';

// Helper to create a mock variable
const createMockVariable = (id: number, name: string, label: string): Variable => ({
    name,
    label,
    type: 'NUMERIC',
    role: 'input',
    measure: 'scale',
    width: 8,
    decimals: 2,
    missing: {},
    values: [],
    columns: 1,
    align: 'left',
    tempId: `temp-${id}`,
    columnIndex: id,
});

// Mock data
const mockAvailableVariables: Variable[] = [
    createMockVariable(1, 'VAR001', 'Age'),
    createMockVariable(2, 'VAR002', 'Income'),
    createMockVariable(3, 'VAR003', 'Education'),
];

const mockTargetLists: TargetListConfig[] = [
    {
        id: 'factors',
        title: 'Factors',
        variables: [],
        height: '150px',
    },
    {
        id: 'covariates',
        title: 'Covariates',
        variables: [],
        height: '150px',
    },
];

// Mock props
const mockProps = {
    availableVariables: mockAvailableVariables,
    targetLists: mockTargetLists,
    variableIdKey: 'columnIndex' as keyof Variable,
    highlightedVariable: null,
    setHighlightedVariable: jest.fn(),
    onMoveVariable: jest.fn(),
    onReorderVariable: jest.fn(),
    onVariableDoubleClick: jest.fn(),
};

describe('VariableListManager', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should render all lists and variables correctly', () => {
        render(<VariableListManager {...mockProps} />);

        // Check for the "Available Variables" list and its items
        expect(screen.getByText('Available Variables')).toBeInTheDocument();
        expect(screen.getByText('Age [VAR001]')).toBeInTheDocument();
        expect(screen.getByText('Income [VAR002]')).toBeInTheDocument();
        expect(screen.getByText('Education [VAR003]')).toBeInTheDocument();

        // Check for the target lists
        expect(screen.getByText('Factors')).toBeInTheDocument();
        expect(screen.getByText('Covariates')).toBeInTheDocument();

        // Ensure target lists are empty initially
        const factorsList = screen.getByText('Factors').closest('div');
        const covariatesList = screen.getByText('Covariates').closest('div');
        
        // This is a simple check; a more robust one might use data-testid
        expect(factorsList?.textContent).not.toContain('Age');
        expect(covariatesList?.textContent).not.toContain('Age');
    });

    it('should call setHighlightedVariable on variable click', async () => {
        const user = userEvent.setup();
        render(<VariableListManager {...mockProps} />);

        const ageVariable = screen.getByText('Age [VAR001]');
        await user.click(ageVariable);

        expect(mockProps.setHighlightedVariable).toHaveBeenCalledTimes(1);
        expect(mockProps.setHighlightedVariable).toHaveBeenCalledWith({
            id: String(mockAvailableVariables[0].columnIndex),
            source: 'available',
        });
    });

    it('should call onVariableDoubleClick on variable double click', async () => {
        const user = userEvent.setup();
        render(<VariableListManager {...mockProps} />);

        const incomeVariable = screen.getByText('Income [VAR002]');
        await user.dblClick(incomeVariable);

        expect(mockProps.onVariableDoubleClick).toHaveBeenCalledTimes(1);
        expect(mockProps.onVariableDoubleClick).toHaveBeenCalledWith(
            mockAvailableVariables[1],
            'available'
        );
    });

    it('should call onMoveVariable when arrow button is clicked', async () => {
        const user = userEvent.setup();
        // Start with a variable already highlighted
        const propsWithHighlight = {
            ...mockProps,
            // Convert number to string to match the prop type
            highlightedVariable: { id: String(mockAvailableVariables[0].columnIndex), source: 'available' },
        };
        
        render(<VariableListManager {...propsWithHighlight} />);

        // Find the centrally located button
        const moveButton = await screen.findByTestId('central-move-button');

        expect(moveButton).toBeInTheDocument();
        expect(moveButton).toHaveAttribute('aria-label', 'Move variable to Factors');

        await user.click(moveButton);

        expect(mockProps.onMoveVariable).toHaveBeenCalledTimes(1);
        expect(mockProps.onMoveVariable).toHaveBeenCalledWith(
            mockAvailableVariables[0], // The variable being moved
            'available',              // The source list ID
            'factors'                // The first target list ID
        );
    });

    // More tests will be added here for drag-and-drop, etc.

}); 