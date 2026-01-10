import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Crosstabs from '../index';
import { useCrosstabsAnalysis } from '../hooks/useCrosstabsAnalysis';
import { useTourGuide } from '../hooks/useTourGuide';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import type { Variable } from '@/types/Variable';
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog";

// Mock hooks and stores
jest.mock('../hooks/useCrosstabsAnalysis');
jest.mock('../hooks/useTourGuide');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');
jest.mock('@/stores/useDataStore');


const mockedUseCrosstabsAnalysis = useCrosstabsAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;
const mockedUseMetaStore = useMetaStore as unknown as jest.Mock;

const mockOnClose = jest.fn();
const mockStartTour = jest.fn();
const mockRunAnalysis = jest.fn();

const mockVariables: Variable[] = [
    { name: 'var1', label: 'Variable 1', type: 'STRING', tempId: '1', columnIndex: 0, width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'nominal', role: 'input', columns: 8 },
    { name: 'var2', label: 'Variable 2', type: 'STRING', tempId: '2', columnIndex: 1, width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'nominal', role: 'input', columns: 8 },
    { name: 'var3', label: 'Variable 3', type: 'STRING', tempId: '3', columnIndex: 2, width: 8, decimals: 0, values: [], missing: {}, align: 'left', measure: 'nominal', role: 'input', columns: 8 },
];

describe('Crosstabs Modal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockedUseCrosstabsAnalysis.mockReturnValue({
            runAnalysis: mockRunAnalysis,
            isCalculating: false,
            error: null,
        });

        mockedUseTourGuide.mockReturnValue({
            tourActive: false,
            startTour: mockStartTour,
        });

        (useVariableStore as unknown as jest.Mock).mockReturnValue({
            variables: mockVariables,
        });
        
        mockedUseMetaStore.mockReturnValue({ meta: { weight: null }});
    });

    const renderComponent = () => {
        return render(
            <Dialog open={true}>
                <DialogTrigger asChild>
                    <button>Open Dialog</button>
                </DialogTrigger>
                <Crosstabs onClose={mockOnClose} containerType="dialog" />
            </Dialog>
        );
    };

    it('should render the modal with title and tabs', () => {
        renderComponent();
        expect(screen.getByText('Crosstabs')).toBeInTheDocument();
        expect(screen.getByText('Variables')).toBeInTheDocument();
        expect(screen.getByText('Cells')).toBeInTheDocument();
    });

    it('should call runAnalysis when OK button is clicked', async () => {
        renderComponent();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'OK' }));
        expect(mockRunAnalysis).toHaveBeenCalled();
    });

    it('should call onClose when Cancel button is clicked', async () => {
        renderComponent();
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should switch to Cells tab and show new controls', async () => {
        renderComponent();
        const user = userEvent.setup();
        const cellsTab = screen.getByText('Cells');
        
        // Check initial state (Controls should not be visible)
        expect(screen.queryByLabelText('Observed')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Unstandardized')).not.toBeInTheDocument();
        
        await user.click(cellsTab);
        
        // After clicking, the Cells tab content should be visible
        expect(screen.getByLabelText('Observed')).toBeInTheDocument();
        expect(screen.getByLabelText('Unstandardized')).toBeInTheDocument();
    });

    it('should display available variables', () => {
        renderComponent();
        mockVariables.forEach(v => {
            if (v.label) {
                expect(screen.getByText(`${v.label} [${v.name}]`)).toBeInTheDocument();
            }
        });
    });

    it('should move a variable to Row(s) on double click and Reset should move it back', async () => {
        renderComponent();
        const user = userEvent.setup();
        
        const variable = mockVariables[0];
        const variableDisplayName = `${variable.label} [${variable.name}]`;
        if (!variable.label) throw new Error("Variable label is not defined");

        const variableItem = screen.getByText(variableDisplayName);
    
        const availableList = screen.getByRole('group', { name: /Available Variables/i });
        const rowList = screen.getByRole('group', { name: /Row\(s\)/i });
    
        expect(within(availableList).getByText(variableDisplayName)).toBeInTheDocument();
        expect(within(rowList).queryByText(variableDisplayName)).not.toBeInTheDocument();
    
        await user.dblClick(variableItem);
    
        expect(within(availableList).queryByText(variableDisplayName)).not.toBeInTheDocument();
        expect(within(rowList).getByText(variableDisplayName)).toBeInTheDocument();
    
        const resetButton = screen.getByRole('button', { name: 'Reset' });
        await user.click(resetButton);
        
        expect(within(availableList).getByText(variableDisplayName)).toBeInTheDocument();
        expect(within(rowList).queryByText(variableDisplayName)).not.toBeInTheDocument();
    });
    

    it('should start the tour when help button is clicked', async () => {
        renderComponent();
        const user = userEvent.setup();
        const helpButton = screen.getByRole('button', { name: /help/i });
        await user.click(helpButton);
        expect(mockStartTour).toHaveBeenCalled();
    });
});
