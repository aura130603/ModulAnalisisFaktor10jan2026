import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { TransposeUI } from '../TransposeUI';
import type { Variable } from '@/types/Variable';
import type { TransposeUIProps } from '../types';
import VariableListManager from '@/components/Common/VariableListManager';

// Mock the VariableListManager to control its behavior
jest.mock('@/components/Common/VariableListManager', () => ({
    __esModule: true,
    default: jest.fn(({ onMoveVariable }) => (
        <div data-testid="variable-list-manager">
            <button onClick={() => onMoveVariable({ tempId: '1', name: 'Var1' }, 'available', 'selected')}>
                Move Var1 to Selected
            </button>
            <button onClick={() => onMoveVariable({ tempId: '2', name: 'Var2' }, 'available', 'name')}>
                Move Var2 to Name
            </button>
        </div>
    )),
}));

const mockVariables: Variable[] = [
    { tempId: '1', name: 'Var1', type: 'NUMERIC', measure: 'scale', columnIndex: 0, width: 8, decimals: 0, values: [], missing: {}, align: 'left', role: 'input', columns: 8 },
    { tempId: '2', name: 'Var2', type: 'STRING', measure: 'nominal', columnIndex: 1, width: 8, decimals: 0, values: [], missing: {}, align: 'left', role: 'input', columns: 8  },
];

describe('TransposeUI Component', () => {
    const mockOnClose = jest.fn();
    const mockHandleOk = jest.fn();
    const mockHandleReset = jest.fn();
    const mockHandleMoveVariable = jest.fn();

    const defaultProps: TransposeUIProps = {
        onClose: mockOnClose,
        containerType: 'dialog',
        availableVariables: mockVariables,
        selectedVariables: [],
        nameVariables: [],
        highlightedVariable: null,
        setHighlightedVariable: jest.fn(),
        getDisplayName: (v: Variable) => v.name,
        handleMoveVariable: mockHandleMoveVariable,
        handleReorderVariable: jest.fn(),
        handleOk: mockHandleOk,
        handleReset: mockHandleReset,
    };
    
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    const renderComponent = (props: Partial<TransposeUIProps> = {}) => {
        return render(<TransposeUI {...defaultProps} {...props} />);
    };

    it('should render the component correctly', () => {
        renderComponent();
        expect(screen.getByText('Transpose')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
        expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
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

    it('calls handleMoveVariable when a variable is moved to the selected list', async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.click(screen.getByRole('button', { name: /Move Var1 to Selected/i }));
        expect(mockHandleMoveVariable).toHaveBeenCalledWith({ tempId: '1', name: 'Var1' }, 'available', 'selected');
    });

    it('calls handleMoveVariable when a variable is moved to the name list', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        await user.click(screen.getByRole('button', { name: /Move Var2 to Name/i }));
        expect(mockHandleMoveVariable).toHaveBeenCalledWith({ tempId: '2', name: 'Var2' }, 'available', 'name');
    });
});
