import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariablesToScan from '../VariablesToScan';
import { useVariablesToScan } from '../hooks/useVariablesToScan';
import { TargetListConfig } from '@/components/Common/VariableListManager';

jest.mock('../hooks/useVariablesToScan');
jest.mock('@/components/Common/VariableListManager', () => ({
    __esModule: true,
    default: jest.fn(() => <div>Mocked VariableListManager</div>)
}));

const mockedUseVariablesToScan = useVariablesToScan as jest.Mock;

describe('VariablesToScan', () => {
    const onClose = jest.fn();
    let mockState: any;
    const user = userEvent.setup();

    beforeEach(() => {
        onClose.mockClear();
        const state = {
            availableVariables: [],
            targetListsConfig: [{ id: 'toScan', title: 'Variables to Scan:', variables: [], height: '300px', draggableItems: true, droppable: true }],
            managerHighlightedVariable: null,
            errorMessage: null,
            errorDialogOpen: false,
            limitCases: true,
            caseLimit: '50',
            limitValues: true,
            valueLimit: '200',
            handleContinue: jest.fn(),
            handleMoveVariable: jest.fn(),
            handleReorderVariable: jest.fn(),
            setManagerHighlightedVariable: jest.fn(),
            setErrorDialogOpen: jest.fn(),
            setLimitCases: jest.fn((value) => {
                state.limitCases = value;
            }),
            setCaseLimit: jest.fn((value) => {
                state.caseLimit = value;
            }),
            setLimitValues: jest.fn((value) => {
                state.limitValues = value;
            }),
            setValueLimit: jest.fn((value) => {
                state.valueLimit = value;
            }),
        };
        mockState = state;
        mockedUseVariablesToScan.mockImplementation(() => state);
    });

    it('renders the component', () => {
        render(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        expect(screen.getByText('Define Variable Properties')).toBeInTheDocument();
        expect(screen.getByText('Mocked VariableListManager')).toBeInTheDocument();
        expect(screen.getByLabelText(/limit number of cases/i)).toBeChecked();
    });

    it('calls handleContinue when the "Continue" button is clicked', async () => {
        const handleContinue = jest.fn();
        mockState.handleContinue = handleContinue;
        
        render(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        
        const continueButton = screen.getByRole('button', { name: /continue/i });
        await user.click(continueButton);

        expect(handleContinue).toHaveBeenCalled();
    });

    it('calls onClose when the "Cancel" button is clicked', async () => {
        render(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(onClose).toHaveBeenCalled();
    });

    it('calls setLimitCases when the case limit checkbox is toggled', async () => {
        render(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        const checkbox = screen.getByLabelText(/limit number of cases/i);

        await user.click(checkbox);
        expect(mockState.setLimitCases).toHaveBeenCalledWith(false);
    });

    it('disables the case limit input when the checkbox is toggled off', () => {
        mockState.limitCases = false;
        render(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        const input = screen.getByDisplayValue('50');
        expect(input).toBeDisabled();
    });

    it('calls setCaseLimit when typing in the case limit input', async () => {
        const { rerender } = render(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        const input = screen.getByDisplayValue('50');

        await user.clear(input);
        await user.type(input, '100');

        rerender(<VariablesToScan onContinue={jest.fn()} onClose={onClose} />);
        
        expect(mockState.setCaseLimit).toHaveBeenLastCalledWith('100');
        expect(input).toHaveValue('100');
    });
}); 