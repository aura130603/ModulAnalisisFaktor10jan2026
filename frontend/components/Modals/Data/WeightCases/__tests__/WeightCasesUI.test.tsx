import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeightCasesUI } from '../WeightCasesUI';
import type { Variable } from '@/types/Variable';
import type { WeightCasesUIProps } from '../types';
import VariableListManager from '@/components/Common/VariableListManager';

// Mock the child component
jest.mock('@/components/Common/VariableListManager', () => ({
    __esModule: true,
    default: jest.fn(({ availableVariables, targetLists }) => (
        <div data-testid="variable-list-manager">
            {availableVariables.map((v: Variable) => <div key={v.tempId}>{v.name}</div>)}
            {targetLists[0].variables.map((v: Variable) => <div key={v.tempId}>{v.name}</div>)}
        </div>
    )),
}));


describe('WeightCasesUI Component', () => {
    const mockHandleSave = jest.fn();
    const mockHandleReset = jest.fn();
    const mockOnClose = jest.fn();
    const mockSetErrorDialogOpen = jest.fn();

    const mockAvailableVariables: Variable[] = [
        { name: 'var1', type: 'NUMERIC', columnIndex: 0, tempId: '1' } as Variable,
        { name: 'var3', type: 'NUMERIC', columnIndex: 2, tempId: '3' } as Variable,
    ];
    
    const defaultProps: WeightCasesUIProps = {
        availableVariables: mockAvailableVariables,
        frequencyVariables: [],
        highlightedVariable: null,
        setHighlightedVariable: jest.fn(),
        errorMessage: null,
        errorDialogOpen: false,
        setErrorDialogOpen: mockSetErrorDialogOpen,
        weightMethod: 'none',
        handleMoveVariable: jest.fn(),
        handleReorderVariable: jest.fn(),
        handleSave: mockHandleSave,
        handleReset: mockHandleReset,
        onClose: mockOnClose,
        containerType: 'dialog'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    const renderComponent = (props: Partial<WeightCasesUIProps> = {}) => {
        return render(<WeightCasesUI {...defaultProps} {...props} />);
    };

    it('should render the component with initial state', () => {
        renderComponent();
        expect(screen.getByText('var1')).toBeInTheDocument();
        expect(screen.getByText('var3')).toBeInTheDocument();
        expect(screen.getByText('Current Status:')).toBeInTheDocument();
        expect(screen.getByText('Do not weight cases')).toBeInTheDocument();
    });

    it('should call handleSave when OK button is clicked', async () => {
        renderComponent();
        const user = userEvent.setup();
        
        const okButtons = screen.getAllByRole('button', { name: /^ok$/i });
        await user.click(okButtons[0]);

        expect(mockHandleSave).toHaveBeenCalledTimes(1);
    });

    it('should call handleReset when Reset button is clicked', async () => {
        renderComponent();
        const user = userEvent.setup();

        const resetButton = screen.getByRole('button', { name: /reset/i });
        await user.click(resetButton);

        expect(mockHandleReset).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel button is clicked', async () => {
        renderComponent();
        const user = userEvent.setup();

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });


    it('should display the current weight status when a variable is selected', () => {
        renderComponent({
            frequencyVariables: [{ name: 'var1', type: 'NUMERIC', columnIndex: 0, tempId: '1' } as Variable],
            weightMethod: 'byVariable',
        });
        expect(screen.getByText(/Weight cases by: var1/)).toBeInTheDocument();
    });

    it('should render an error dialog when errorDialogOpen is true', () => {
        renderComponent({ errorDialogOpen: true, errorMessage: 'Test Error' });
        expect(screen.getByText('IBM SPSS Statistics')).toBeInTheDocument();
        expect(screen.getByText('Test Error')).toBeInTheDocument();
    });
}); 