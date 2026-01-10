import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropertiesEditor from '../PropertiesEditor';
import { usePropertiesEditor } from '../hooks/usePropertiesEditor';
import type { Variable } from '@/types/Variable';

jest.mock('../hooks/usePropertiesEditor');
jest.mock('@handsontable/react-wrapper', () => {
    const MockHotTable = React.forwardRef<HTMLDivElement>((props, ref) => (
        <div ref={ref}>Mocked HotTable</div>
    ));
    MockHotTable.displayName = 'MockHotTable';
    return {
        __esModule: true,
        HotTable: MockHotTable,
    };
});

const mockedUsePropertiesEditor = usePropertiesEditor as jest.Mock;

const mockVariables: Variable[] = [
    { tempId: '1', name: 'var1', columnIndex: 0, type: 'NUMERIC', measure: 'scale', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left', label: 'Variable 1' },
    { tempId: '2', name: 'var2', columnIndex: 1, type: 'STRING', measure: 'nominal', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left', label: 'Variable 2' }
];

describe('PropertiesEditor', () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const user = userEvent.setup();
    let mockState: any;

    const setupMockHook = (
        currentVar: Variable | null = mockVariables[0],
        activeTab = 'properties'
    ) => {
        const state: any = {
            modifiedVariables: [...mockVariables.map(v => ({...v}))], // Deep copy to prevent mutation across tests
            selectedVariableIndex: currentVar ? mockVariables.findIndex(v => v.tempId === currentVar.tempId) : null,
            currentVariable: currentVar ? { ...currentVar } : null,
            gridData: [],
            setGridData: jest.fn(),
            showTypeDropdown: false,
            setShowTypeDropdown: jest.fn(),
            showRoleDropdown: false,
            setShowRoleDropdown: jest.fn(),
            showMeasureDropdown: false,
            setShowMeasureDropdown: jest.fn(),
            showDateFormatDropdown: false,
            setShowDateFormatDropdown: jest.fn(),
            errorMessage: null,
            errorDialogOpen: false,
            setErrorDialogOpen: jest.fn(),
            suggestDialogOpen: false,
            setSuggestDialogOpen: jest.fn(),
            suggestedMeasure: '',
            measurementExplanation: '',
            unlabeledValuesCount: 0,
            activeTab,
            setActiveTab: jest.fn(tab => state.activeTab = tab),
            handleVariableChange: jest.fn(index => {
                state.currentVariable = state.modifiedVariables[index];
                state.selectedVariableIndex = index;
            }),
            handleVariableFieldChange: jest.fn((field, value) => {
                if (state.currentVariable) {
                    (state.currentVariable as any)[field] = value;
                }
            }),
            handleGridDataChange: jest.fn(),
            handleAutoLabel: jest.fn(),
            handleSuggestMeasurement: jest.fn(),
            handleAcceptSuggestion: jest.fn(),
            handleSave: jest.fn(),
        };
        mockState = state; // Keep a reference
        mockedUsePropertiesEditor.mockImplementation(() => state);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        setupMockHook(); // Setup default mock for each test
    });

    it('renders the editor with the first variable selected', () => {
        render(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);
        
        expect(screen.getByText('Define Variable Properties')).toBeInTheDocument();
        expect(screen.getByDisplayValue('var1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Variable 1')).toBeInTheDocument();
        expect(screen.getByText('var2')).toBeInTheDocument();
    });

    it('calls handleVariableChange when another variable is clicked', async () => {
        const { rerender } = render(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);
        
        const secondVariableItem = screen.getByText('var2');
        await user.click(secondVariableItem);

        rerender(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);
        
        expect(mockState.handleVariableChange).toHaveBeenCalledWith(1);
        expect(screen.getByDisplayValue('var2')).toBeInTheDocument();
    });

    it('calls handleVariableFieldChange when label is edited', async () => {
        // Setup a special mock for this test that will update the input value
        const originalHandleVariableFieldChange = mockState.handleVariableFieldChange;
        mockState.handleVariableFieldChange = jest.fn((field, value) => {
            // Call the original implementation
            originalHandleVariableFieldChange(field, value);
            
            // Update the current variable's label in the mock state
            if (field === 'label' && mockState.currentVariable) {
                mockState.currentVariable.label = value;
            }
        });
        
        const { rerender } = render(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);
        
        const labelInput = screen.getByDisplayValue('Variable 1');
        await user.clear(labelInput);
        await user.type(labelInput, 'New Label');
        
        // Re-render to reflect the state changes
        rerender(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);
        
        // Check that handleVariableFieldChange was called with 'label' parameter
        expect(mockState.handleVariableFieldChange).toHaveBeenCalled();
        expect(mockState.handleVariableFieldChange.mock.calls.some(
            (call: any[]) => call[0] === 'label' && call[1] === 'New Label'
        )).toBe(true);
        
        // Now the label should be updated in the UI
        expect(screen.getByDisplayValue('New Label')).toBeInTheDocument();
    });

    it('calls handleSuggestMeasurement when suggest button is clicked', async () => {
        render(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);
        
        const suggestButton = screen.getByRole('button', { name: /suggest/i });
        await user.click(suggestButton);
        
        expect(mockState.handleSuggestMeasurement).toHaveBeenCalledTimes(1);
    });

    it('calls handleAutoLabel when Auto Label button is clicked', async () => {
        setupMockHook(mockVariables[0], 'labels'); // Switch to labels tab
        const { rerender } = render(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);
        
        const labelsTab = screen.getByRole('tab', { name: /value labels/i });
        await user.click(labelsTab);

        rerender(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);
        
        const autoLabelButton = screen.getByRole('button', { name: /auto label/i });
        await user.click(autoLabelButton);

        expect(mockState.handleAutoLabel).toHaveBeenCalledTimes(1);
    });

    it('shows a message when no variable is selected', () => {
        setupMockHook(null);
        render(<PropertiesEditor onClose={onClose} variables={[]} caseLimit="50" valueLimit="200" />);

        expect(screen.getByText(/Select a variable from the list/i)).toBeInTheDocument();
    });

    it('shows HotTable when Value Labels tab is active', () => {
        setupMockHook(mockVariables[0], 'labels');
        render(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);

        expect(screen.getByText('Mocked HotTable')).toBeInTheDocument();
    });

    it('calls handleSave when OK button is clicked', async () => {
        render(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);
        
        const okButton = screen.getByRole('button', { name: /ok/i });
        await user.click(okButton);

        expect(mockState.handleSave).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', async () => {
        render(<PropertiesEditor onClose={onClose} variables={mockVariables} caseLimit="50" valueLimit="200" />);

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });
}); 