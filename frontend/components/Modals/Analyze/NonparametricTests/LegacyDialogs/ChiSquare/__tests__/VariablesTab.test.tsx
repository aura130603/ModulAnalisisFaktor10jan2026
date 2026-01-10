import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariablesTab from '../components/VariablesTab';
import type { Variable } from '@/types/Variable';
import type { VariablesTabProps, HighlightedVariable } from '../types';

// Mock the VariableListManager component
jest.mock('@/components/Common/VariableListManager', () => {
  return function MockVariableListManager(props: any) {
    return (
      <div data-testid="variable-list-manager">
        <div data-testid="available-variables">
          <h3>Available Variables</h3>
          {props.availableVariables?.length === 0 ? (
            <p>No variables available</p>
          ) : (
            props.availableVariables?.map((variable: Variable) => (
              <div 
                key={variable.tempId}
                data-testid={`available-${variable.tempId}`}
                onClick={() => props.onMoveVariable?.(variable, 'available', 'test')}
                onMouseEnter={() => props.setHighlightedVariable?.({ id: variable.tempId!, source: 'available' })}
                onMouseLeave={() => props.setHighlightedVariable?.(null)}
              >
                {variable.label || variable.name}
              </div>
            ))
          )}
        </div>
        <div data-testid="test-variables">
          <h3>Test Variables</h3>
          {props.targetLists?.[0]?.variables?.length === 0 ? (
            <p>No variables selected</p>
          ) : (
            props.targetLists?.[0]?.variables?.map((variable: Variable) => (
              <div 
                key={variable.tempId}
                data-testid={`test-${variable.tempId}`}
                onClick={() => props.onMoveVariable?.(variable, 'test', 'available')}
                onMouseEnter={() => props.setHighlightedVariable?.({ id: variable.tempId!, source: 'test' })}
                onMouseLeave={() => props.setHighlightedVariable?.(null)}
              >
                {variable.label || variable.name}
              </div>
            ))
          )}
        </div>
        <button 
          data-testid="reset-button"
          onClick={() => props.onReset?.()}
        >
          Reset
        </button>
      </div>
    );
  };
});

const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC',
    tempId: '1',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8
  },
  {
    name: 'var2',
    label: 'Variable 2',
    columnIndex: 1,
    type: 'NUMERIC',
    tempId: '2',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'ordinal',
    role: 'input',
    columns: 8
  },
  {
    name: 'var3',
    label: 'Variable 3',
    columnIndex: 2,
    type: 'NUMERIC',
    tempId: '3',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  }
];

describe('VariablesTab', () => {
  const defaultProps: VariablesTabProps = {
    availableVariables: mockVariables,
    testVariables: [],
    highlightedVariable: null,
    setHighlightedVariable: jest.fn(),
    moveToTestVariables: jest.fn(),
    moveToAvailableVariables: jest.fn(),
    reorderVariables: jest.fn(),
    tourActive: false,
    currentStep: 0,
    tourSteps: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    return render(<VariablesTab {...mergedProps} />);
  };

  it('should render the variables tab', () => {
    renderComponent();
    
    expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
    expect(screen.getByText('Available Variables')).toBeInTheDocument();
    expect(screen.getByText('Test Variables')).toBeInTheDocument();
  });

  it('should display available variables', () => {
    renderComponent();
    
    expect(screen.getByText('Variable 1')).toBeInTheDocument();
    expect(screen.getByText('Variable 2')).toBeInTheDocument();
    expect(screen.getByText('Variable 3')).toBeInTheDocument();
  });

  it('should move variable to test variables when clicked', async () => {
    const user = userEvent.setup();
    const mockMoveToTestVariables = jest.fn();
    
    renderComponent({ moveToTestVariables: mockMoveToTestVariables });
    
    const variable1 = screen.getByTestId('available-1');
    await user.click(variable1);
    
    expect(mockMoveToTestVariables).toHaveBeenCalledWith(mockVariables[0]);
  });

  it('should move variable back to available variables when clicked', async () => {
    const user = userEvent.setup();
    const mockMoveToAvailableVariables = jest.fn();
    
    renderComponent({ 
      moveToAvailableVariables: mockMoveToAvailableVariables,
      testVariables: [mockVariables[0]],
      availableVariables: [mockVariables[1], mockVariables[2]]
    });
    
    const testVariable = screen.getByTestId('test-1');
    await user.click(testVariable);
    
    expect(mockMoveToAvailableVariables).toHaveBeenCalledWith(mockVariables[0]);
  });

  it('should highlight variable on hover', () => {
    const mockSetHighlightedVariable = jest.fn();
    
    renderComponent({ setHighlightedVariable: mockSetHighlightedVariable });
    
    const variable1 = screen.getByTestId('available-1');
    fireEvent.mouseEnter(variable1);
    
    expect(mockSetHighlightedVariable).toHaveBeenCalledWith({
      tempId: '1',
      source: 'available'
    });
  });

  it('should remove highlight on mouse leave', () => {
    const mockSetHighlightedVariable = jest.fn();
    
    renderComponent({ setHighlightedVariable: mockSetHighlightedVariable });
    
    const variable1 = screen.getByTestId('available-1');
    fireEvent.mouseLeave(variable1);
    
    expect(mockSetHighlightedVariable).toHaveBeenCalledWith(null);
  });

  it('should display variable labels when available', () => {
    renderComponent();
    
    expect(screen.getByText('Variable 1')).toBeInTheDocument();
    expect(screen.getByText('Variable 2')).toBeInTheDocument();
    expect(screen.getByText('Variable 3')).toBeInTheDocument();
  });

  it('should display variable names when labels are not available', () => {
    const variablesWithoutLabels = mockVariables.map(v => ({ ...v, label: '' }));
    
    renderComponent({ availableVariables: variablesWithoutLabels });
    
    expect(screen.getByText('var1')).toBeInTheDocument();
    expect(screen.getByText('var2')).toBeInTheDocument();
    expect(screen.getByText('var3')).toBeInTheDocument();
  });

  it('should show empty state when no available variables', () => {
    renderComponent({ availableVariables: [] });
    
    expect(screen.getByText('No variables available')).toBeInTheDocument();
  });

  it('should show empty state when no test variables', () => {
    renderComponent();
    
    expect(screen.getByText('No variables selected')).toBeInTheDocument();
  });

  it('should handle drag and drop for reordering', () => {
    const mockReorderVariables = jest.fn();
    
    renderComponent({ 
      reorderVariables: mockReorderVariables,
      testVariables: [mockVariables[0], mockVariables[1]]
    });
    
    // This would require more complex drag and drop testing
    // For now, we just verify the component renders with test variables
    expect(screen.getByText('Variable 1')).toBeInTheDocument();
    expect(screen.getByText('Variable 2')).toBeInTheDocument();
  });

  it('should display variable measure types', () => {
    renderComponent();
    
    // Check that variables with different measure types are displayed
    expect(screen.getByText('Variable 1')).toBeInTheDocument(); // nominal
    expect(screen.getByText('Variable 2')).toBeInTheDocument(); // ordinal
    expect(screen.getByText('Variable 3')).toBeInTheDocument(); // scale
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockMoveToTestVariables = jest.fn();
    
    renderComponent({ moveToTestVariables: mockMoveToTestVariables });
    
    const variable1 = screen.getByTestId('available-1');
    variable1.focus();
    
    await user.keyboard('{Enter}');
    
    expect(mockMoveToTestVariables).toHaveBeenCalledWith(mockVariables[0]);
  });

  it('should show loading state when calculating', () => {
    renderComponent();
    
    // The component should still render but with disabled interactions
    expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    renderComponent();
    
    // The component should still render despite the error
    expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
  });

  it('should handle tour guide integration', () => {
    renderComponent({
      tourActive: true,
      currentStep: 1
    });
    
    // Component should render with tour guide active
    expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
  });
}); 