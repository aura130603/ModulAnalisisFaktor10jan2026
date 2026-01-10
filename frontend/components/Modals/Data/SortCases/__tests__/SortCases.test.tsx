import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SortCasesUI } from '../SortCasesUI';
import type { Variable } from '@/types/Variable';
import type { SortCasesUIProps, SortVariableConfig } from '../types';
import VariableListManager from '@/components/Common/VariableListManager';

// Mock the child component to control its behavior
jest.mock('@/components/Common/VariableListManager', () => ({
    __esModule: true,
    // We pass the component props we need to interact with into our mock
    default: jest.fn(({ onMoveVariable, renderListFooter }) => (
        <div data-testid="variable-list-manager">
            <button onClick={() => onMoveVariable({ tempId: '1', name: 'VAR1' }, 'available', 'sortBy')}>
                Move VAR1
            </button>
            {/* Render the footer so we can interact with its controls */}
            {renderListFooter?.()}
        </div>
    )),
}));

const mockVariables: Variable[] = [
    { tempId: '1', name: 'VAR1', label: 'Variable 1', type: 'NUMERIC', measure: 'scale', columnIndex: 0, width: 8, decimals: 0, values: [], missing: null, align: 'left', role: 'input', columns: 8 },
    { tempId: '2', name: 'VAR2', label: 'Variable 2', type: 'STRING', measure: 'nominal', columnIndex: 1, width: 8, decimals: 0, values: [], missing: null, align: 'left', role: 'input', columns: 8  },
];

const mockSortByConfigs: SortVariableConfig[] = [
    { variable: mockVariables[0], direction: 'asc' },
];

describe('SortCasesUI', () => {
    const mockOnClose = jest.fn();
    const mockHandleOk = jest.fn();
    const mockHandleReset = jest.fn();
    const mockHandleMoveVariable = jest.fn();
    const mockChangeSortDirection = jest.fn();
    const mockMoveVariableUp = jest.fn();

    const defaultProps: SortCasesUIProps = {
        onClose: mockOnClose,
        containerType: 'dialog',
        availableVariables: mockVariables,
        sortByConfigs: [],
        setSortByConfigs: jest.fn(),
        defaultSortOrder: 'asc',
        setDefaultSortOrder: jest.fn(),
        highlightedVariable: null,
        setHighlightedVariable: jest.fn(),
        error: null,
        getSortByVariables: () => [],
        handleMoveVariable: mockHandleMoveVariable,
        handleReorderVariable: jest.fn(),
        changeSortDirection: mockChangeSortDirection,
        moveVariableUp: mockMoveVariableUp,
        moveVariableDown: jest.fn(),
        handleOk: mockHandleOk,
        handleReset: mockHandleReset,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = (props: Partial<SortCasesUIProps> = {}) => {
        return render(<SortCasesUI {...defaultProps} {...props} />);
    };

    it('renders the dialog, buttons, and variables', () => {
        renderComponent();
        expect(screen.getByText('Sort Cases')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /OK/i })).toBeInTheDocument();
        expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
    });

    it('displays an error message when provided', () => {
        renderComponent({ error: 'This is a test error' });
        expect(screen.getByText('This is a test error')).toBeInTheDocument();
    });

    it('calls handleOk, handleReset, and onClose when buttons are clicked', async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.click(screen.getByRole('button', { name: /ok/i }));
        expect(mockHandleOk).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: /reset/i }));
        expect(mockHandleReset).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: /cancel/i }));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls handleMoveVariable when a variable is moved', async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.click(screen.getByRole('button', { name: /Move VAR1/i }));
        expect(mockHandleMoveVariable).toHaveBeenCalledWith({ tempId: '1', name: 'VAR1' }, 'available', 'sortBy');
    });

    it('shows sort controls when a variable in the "Sort By" list is highlighted', () => {
        renderComponent({
            sortByConfigs: mockSortByConfigs,
            getSortByVariables: () => [mockVariables[0]],
            highlightedVariable: { id: '1', source: 'sortBy' },
        });

        expect(screen.getByText('Direction for selected variable:')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /move up/i })).toBeInTheDocument();
        const ascendingRadio = screen.getByRole('radio', { name: /ascending/i });
        expect(ascendingRadio).toBeChecked();
    });
    
    it('calls changeSortDirection when a sort direction checkbox is clicked', async () => {
        const user = userEvent.setup();
        renderComponent({
            sortByConfigs: mockSortByConfigs,
            getSortByVariables: () => [mockVariables[0]],
            highlightedVariable: { id: '1', source: 'sortBy' },
        });

        const descendingRadio = screen.getByRole('radio', { name: /descending/i });
        await user.click(descendingRadio);
        
        expect(mockChangeSortDirection).toHaveBeenCalledWith('1', 'desc');
    });

    it('calls moveVariableUp when the "Move Up" button is clicked', async () => {
        const user = userEvent.setup();
        renderComponent({
            sortByConfigs: [
                { variable: mockVariables[1], direction: 'asc' },
                { variable: mockVariables[0], direction: 'asc' },
            ],
            getSortByVariables: () => [mockVariables[1], mockVariables[0]],
            highlightedVariable: { id: '1', source: 'sortBy' },
        });
        
        const moveUpButton = screen.getByRole('button', { name: /move up/i });
        await user.click(moveUpButton);

        expect(mockMoveVariableUp).toHaveBeenCalledWith('1');
    });
});
