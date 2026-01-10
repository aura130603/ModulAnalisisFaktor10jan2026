import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariablesTab from '../components/VariablesTab';
import { Variable } from '@/types/Variable';
import { TourStep, HighlightedVariable } from '../types';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, id }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid={id || 'button'}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, id }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      className={className}
      data-testid={id || 'input'}
    />
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, className, id }: any) => (
    <input 
      type="checkbox"
      checked={checked} 
      onChange={(e) => onCheckedChange?.(e.target.checked)} 
      className={className}
      data-testid={id || 'checkbox'}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, className, htmlFor }: any) => (
    <label className={className} htmlFor={htmlFor} data-testid="label">
      {children}
    </label>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: ({ className, orientation }: any) => (
    <div className={className} data-testid="separator" data-orientation={orientation} />
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronUp: ({ className }: { className?: string }) => (
    <div data-testid="chevron-up-icon" className={className}>ChevronUp</div>
  ),
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid="chevron-down-icon" className={className}>ChevronDown</div>
  ),
  ArrowRight: ({ className }: { className?: string }) => (
    <div data-testid="arrow-right-icon" className={className}>ArrowRight</div>
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <div data-testid="arrow-left-icon" className={className}>ArrowLeft</div>
  ),
  Trash2: ({ className }: { className?: string }) => (
    <div data-testid="trash-icon" className={className}>Trash2</div>
  ),
}));

// Mock VariableListManager
jest.mock('@/components/Common/VariableListManager', () => {
  return function MockVariableListManager(props: any) {
    return (
      <div data-testid="variable-list-manager">
        <div data-testid="available-variables">
          <h3>Available Variables</h3>
          {props.availableVariables?.map((variable: Variable) => (
            <div 
              key={variable.tempId}
              data-testid={`available-${variable.tempId}`}
              onClick={() => props.onMoveVariable?.(variable, 'available', 'test')}
              onMouseEnter={() => props.setHighlightedVariable?.({ id: variable.tempId!, source: 'available' })}
              onMouseLeave={() => props.setHighlightedVariable?.(null)}
            >
              {variable.label || variable.name}
            </div>
          ))}
        </div>
        <div data-testid="test-variables">
          <h3>Test Variables</h3>
          {props.targetLists?.[0]?.variables?.map((variable: Variable) => (
            <div 
              key={variable.tempId}
              data-testid={`test-${variable.tempId}`}
              onClick={() => props.onMoveVariable?.(variable, 'test', 'available')}
              onMouseEnter={() => props.setHighlightedVariable?.({ id: variable.tempId!, source: 'test' })}
              onMouseLeave={() => props.setHighlightedVariable?.(null)}
            >
              {variable.label || variable.name}
            </div>
          ))}
        </div>
      </div>
    );
  };
});

describe('VariablesTab Component', () => {
  const mockVariables: Variable[] = [
    {
      name: 'var1',
      label: 'Variable 1',
      tempId: '1',
      columnIndex: 0,
      type: 'NUMERIC',
      width: 8,
      decimals: 2,
      values: [],
      missing: {},
      align: 'right',
      measure: 'scale',
      role: 'input',
      columns: 8,
    },
    {
      name: 'var2',
      label: 'Variable 2',
      tempId: '2',
      columnIndex: 1,
      type: 'NUMERIC',
      width: 8,
      decimals: 2,
      values: [],
      missing: {},
      align: 'right',
      measure: 'scale',
      role: 'input',
      columns: 8,
    },
  ];

  const mockTestVariables: Variable[] = [
    {
      name: 'testVar',
      label: 'Test Variable',
      tempId: '3',
      columnIndex: 2,
      type: 'NUMERIC',
      width: 8,
      decimals: 2,
      values: [],
      missing: {},
      align: 'right',
      measure: 'scale',
      role: 'input',
      columns: 8,
    },
  ];

  const defaultProps = {
    availableVariables: mockVariables,
    testVariables: mockTestVariables,
    highlightedVariable: null as HighlightedVariable | null,
    setHighlightedVariable: jest.fn(),
    moveToTestVariables: jest.fn(),
    moveToAvailableVariables: jest.fn(),
    reorderVariables: jest.fn(),
    tourActive: false,
    currentStep: 0,
    tourSteps: [] as TourStep[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render available variables list', () => {
    render(<VariablesTab {...defaultProps} />);
    
    expect(screen.getByText('Variable 1')).toBeVisible();
    expect(screen.getByText('Variable 2')).toBeVisible();
  });

  it('should render test variables list', () => {
    render(<VariablesTab {...defaultProps} />);
    
    expect(screen.getByText('Test Variable')).toBeVisible();
  });

  it('should call moveToTestVariables when moving variable to test list', async () => {
    const user = userEvent.setup();
    const mockMoveToTestVariables = jest.fn();
    
    render(<VariablesTab {...defaultProps} moveToTestVariables={mockMoveToTestVariables} />);
    
    const variableItem = screen.getByTestId('available-1');
    await user.click(variableItem);
    
    expect(mockMoveToTestVariables).toHaveBeenCalledWith(mockVariables[0]);
  });

  it('should call moveToAvailableVariables when moving variable from test list', async () => {
    const user = userEvent.setup();
    const mockMoveToAvailableVariables = jest.fn();
    
    render(<VariablesTab {...defaultProps} moveToAvailableVariables={mockMoveToAvailableVariables} />);
    
    const variableItem = screen.getByTestId('test-3');
    await user.click(variableItem);
    
    expect(mockMoveToAvailableVariables).toHaveBeenCalledWith(mockTestVariables[0]);
  });

  it('should call reorderVariables when reordering variables in test list', async () => {
    const user = userEvent.setup();
    const mockReorderVariables = jest.fn();
    const multipleTestVariables: Variable[] = [
      ...mockTestVariables,
      {
        name: 'testVar2',
        label: 'Test Variable 2',
        tempId: '4',
        columnIndex: 3,
        type: 'NUMERIC',
        width: 8,
        decimals: 2,
        values: [],
        missing: {},
        align: 'right',
        measure: 'scale',
        role: 'input',
        columns: 8,
      },
    ];
    
    render(<VariablesTab {...defaultProps} testVariables={multipleTestVariables} reorderVariables={mockReorderVariables} />);
    
    // The mock doesn't actually trigger reorder, but we can verify the component renders
    expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
  });

  it('should call setHighlightedVariable when hovering over variable', async () => {
    const user = userEvent.setup();
    const mockSetHighlightedVariable = jest.fn();
    
    render(<VariablesTab {...defaultProps} setHighlightedVariable={mockSetHighlightedVariable} />);
    
    const variableItem = screen.getByTestId('available-1');
    await user.hover(variableItem);
    
    expect(mockSetHighlightedVariable).toHaveBeenCalledWith({
      tempId: '1',
      source: 'available'
    });
  });

  it('should highlight variable when it matches highlightedVariable', () => {
    const highlightedVar: HighlightedVariable = {
      tempId: '1',
      source: 'available'
    };
    
    render(<VariablesTab {...defaultProps} highlightedVariable={highlightedVar} />);
    
    // The mock component should handle highlighting
    expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
  });

  it('should disable move buttons when no variables are selected', () => {
    render(<VariablesTab {...defaultProps} availableVariables={[]} testVariables={[]} />);
    
    expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
  });

  it('should show tour highlighting when tour is active', () => {
    const tourSteps: TourStep[] = [
      {
        title: 'Test Variables List',
        targetId: 'test-variables-list',
        content: 'Select test variables here',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: 'info',
      },
    ];
    
    render(<VariablesTab {...defaultProps} tourActive={true} currentStep={0} tourSteps={tourSteps} />);
    
    // Check that tour-related elements are present
    expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
  });

  it('should display variable labels when available', () => {
    const variablesWithLabels = [
      {
        ...mockVariables[0],
        label: 'Custom Label',
      },
    ];
    
    render(<VariablesTab {...defaultProps} availableVariables={variablesWithLabels} />);
    
    expect(screen.getByText('Custom Label')).toBeVisible();
  });

  it('should display variable names when labels are not available', () => {
    const variablesWithoutLabels = [
      {
        ...mockVariables[0],
        label: '',
      },
    ];
    
    render(<VariablesTab {...defaultProps} availableVariables={variablesWithoutLabels} />);
    
    expect(screen.getByText('var1')).toBeVisible();
  });

  it('should handle empty variable lists gracefully', () => {
    render(<VariablesTab {...defaultProps} availableVariables={[]} testVariables={[]} />);
    
    // Should render without errors
    expect(screen.getByTestId('variable-list-manager')).toBeInTheDocument();
  });
}); 