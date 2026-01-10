import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SetMeasurementLevelUI } from '../SetMeasurementLevelUI';
import type { SetMeasurementLevelUIProps } from '../types';
import VariableListManager from '@/components/Common/VariableListManager';

// Mock the child component to control its behavior and props
jest.mock('@/components/Common/VariableListManager', () => ({
    __esModule: true,
    default: jest.fn((props) => (
        <div data-testid="variable-list-manager">
            <button onClick={() => props.onMoveVariable({ name: 'Var1' }, 'unknown', 'nominal')}>
                Move Var1
            </button>
        </div>
    )),
}));

const mockVariableListManager = VariableListManager as jest.Mock;

const mockProps: SetMeasurementLevelUIProps = {
    onClose: jest.fn(),
    handleSave: jest.fn(),
    handleReset: jest.fn(), // This prop doesn't seem to be used by the component, but we keep it for type consistency
    handleMoveVariable: jest.fn(),
    handleReorderVariable: jest.fn(),
    setHighlightedVariable: jest.fn(),
    unknownVariables: [{ tempId: '1', name: 'Var1' } as any],
    nominalVariables: [{ tempId: '2', name: 'Var2' } as any],
    ordinalVariables: [],
    scaleVariables: [],
    highlightedVariable: null,
    containerType: 'dialog',
};

describe('SetMeasurementLevelUI Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly and passes props to VariableListManager', () => {
        render(<SetMeasurementLevelUI {...mockProps} />);

        expect(screen.getByText('Set Measurement Level')).toBeInTheDocument();
        expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
        
        // Check that VariableListManager received the correct props
        expect(mockVariableListManager).toHaveBeenCalledWith(
            expect.objectContaining({
                availableVariables: mockProps.unknownVariables,
                targetLists: expect.arrayContaining([
                    expect.objectContaining({ id: 'nominal', variables: mockProps.nominalVariables }),
                    expect.objectContaining({ id: 'ordinal', variables: mockProps.ordinalVariables }),
                    expect.objectContaining({ id: 'scale', variables: mockProps.scaleVariables }),
                ]),
            }),
            {}
        );
    });

    it('calls onClose when Cancel button is clicked', async () => {
        render(<SetMeasurementLevelUI {...mockProps} />);
        const user = userEvent.setup();

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls handleSave when OK button is clicked', async () => {
        render(<SetMeasurementLevelUI {...mockProps} />);
        const user = userEvent.setup();

        const okButton = screen.getByRole('button', { name: /ok/i });
        await user.click(okButton);

        expect(mockProps.handleSave).toHaveBeenCalledTimes(1);
    });

    it('calls handleMoveVariable when a variable is moved in the manager', async () => {
        render(<SetMeasurementLevelUI {...mockProps} />);
        const user = userEvent.setup();

        // The mock VariableListManager has a button to simulate the onMoveVariable callback
        const moveButton = screen.getByRole('button', { name: 'Move Var1' });
        await user.click(moveButton);

        expect(mockProps.handleMoveVariable).toHaveBeenCalledWith({ name: 'Var1' }, 'unknown', 'nominal');
    });
}); 