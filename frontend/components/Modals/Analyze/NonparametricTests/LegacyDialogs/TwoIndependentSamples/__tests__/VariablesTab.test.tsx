import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariablesTab from '../components/VariablesTab';
import { Variable } from '@/types/Variable';
import { TourStep } from '../types';

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
  Input: ({ value, onChange, placeholder, className }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      className={className}
      data-testid="input"
    />
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)} data-testid="select">
      {children}
    </select>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <div className={className} data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <div data-testid="select-value">{placeholder}</div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ value, children }: any) => (
    <option value={value} data-testid={`select-item-${value}`}>{children}</option>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => (
    <div className={className} data-testid="scroll-area">{children}</div>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: ({ className }: any) => (
    <hr className={className} data-testid="separator" />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className} data-testid="label">{children}</label>
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, id, className }: any) => (
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      id={id}
      className={className}
      data-testid="checkbox"
    />
  ),
}));

jest.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children, value, onValueChange }: any) => (
    <div data-testid="radio-group" data-value={value}>
      {children}
    </div>
  ),
  RadioGroupItem: ({ value, id, className }: any) => (
    <input 
      type="radio" 
      value={value} 
      id={id}
      className={className}
      data-testid={`radio-${value}`}
    />
  ),
  RadioGroupItemIndicator: ({ children }: any) => (
    <div data-testid="radio-indicator">{children}</div>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <div className={className} data-testid="card-title">{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-variant={variant} data-testid="badge">{children}</span>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className }: any) => (
    <div className={className} data-testid="alert">{children}</div>
  ),
  AlertDescription: ({ children, className }: any) => (
    <div className={className} data-testid="alert-description">{children}</div>
  ),
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div data-testid="alert-dialog-trigger">{children}</div>,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div data-testid="alert-dialog-title">{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="alert-dialog-action">{children}</button>
  ),
  AlertDialogCancel: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="alert-dialog-cancel">{children}</button>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowRight: ({ className }: { className?: string }) => (
    <div data-testid="arrow-right" className={className}>ArrowRight</div>
  ),
  ArrowLeft: ({ className }: { className?: string }) => (
    <div data-testid="arrow-left" className={className}>ArrowLeft</div>
  ),
  ArrowUp: ({ className }: { className?: string }) => (
    <div data-testid="arrow-up" className={className}>ArrowUp</div>
  ),
  ArrowDown: ({ className }: { className?: string }) => (
    <div data-testid="arrow-down" className={className}>ArrowDown</div>
  ),
  GripVertical: ({ className }: { className?: string }) => (
    <div data-testid="grip-vertical" className={className}>GripVertical</div>
  ),
  Info: ({ className }: { className?: string }) => (
    <div data-testid="info-icon" className={className}>Info</div>
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <div data-testid="alert-triangle" className={className}>AlertTriangle</div>
  ),
}));

describe('VariablesTab Component', () => {
  const mockVariables: Variable[] = [
    {
      name: 'Var1',
      tempId: '1',
      columnIndex: 0,
      label: 'Variable 1',
      type: 'NUMERIC' as any,
      width: 8,
      decimals: 0,
      values: [
        { variableId: 1, value: 1, label: '1' },
        { variableId: 1, value: 2, label: '2' },
        { variableId: 1, value: 3, label: '3' },
        { variableId: 1, value: 4, label: '4' },
        { variableId: 1, value: 5, label: '5' },
      ],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    },
    {
      name: 'Var2',
      tempId: '2',
      columnIndex: 1,
      label: 'Variable 2',
      type: 'NUMERIC' as any,
      width: 8,
      decimals: 0,
      values: [
        { variableId: 2, value: 6, label: '6' },
        { variableId: 2, value: 7, label: '7' },
        { variableId: 2, value: 8, label: '8' },
        { variableId: 2, value: 9, label: '9' },
        { variableId: 2, value: 10, label: '10' },
      ],
      missing: {},
      align: 'left',
      measure: 'scale',
      role: 'input',
      columns: 8
    },
    {
      name: 'GroupVar',
      tempId: '3',
      columnIndex: 2,
      label: 'Group Variable',
      type: 'STRING' as any,
      width: 8,
      decimals: 0,
      values: [
        { variableId: 3, value: 'Group1', label: 'Group1' },
        { variableId: 3, value: 'Group2', label: 'Group2' },
        { variableId: 3, value: 'Group1', label: 'Group1' },
        { variableId: 3, value: 'Group2', label: 'Group2' },
        { variableId: 3, value: 'Group1', label: 'Group1' },
      ],
      missing: {},
      align: 'left',
      measure: 'nominal',
      role: 'input',
      columns: 8
    }
  ];

  const mockTestVariables = [mockVariables[0]];
  const mockGroupingVariable = mockVariables[2];
  const mockGroup1 = 1;
  const mockGroup2 = 2;

  const defaultProps = {
    availableVariables: mockVariables,
    testVariables: mockTestVariables,
    groupingVariable: mockGroupingVariable,
    group1: mockGroup1,
    setGroup1: jest.fn(),
    group2: mockGroup2,
    setGroup2: jest.fn(),
    highlightedVariable: null,
    setHighlightedVariable: jest.fn(),
    moveToTestVariables: jest.fn(),
    moveToGroupingVariable: jest.fn(),
    moveToAvailableVariables: jest.fn(),
    reorderVariables: jest.fn(),
    tourActive: false,
    currentStep: 0,
    tourSteps: [] as TourStep[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the variables tab with all sections', () => {
    render(<VariablesTab {...defaultProps} />);
    
    expect(screen.getByText('Test Variables')).toBeInTheDocument();
    expect(screen.getByText('Grouping Variable')).toBeInTheDocument();
    expect(screen.getByText('Available Variables')).toBeInTheDocument();
  });

  it('should display test variables correctly', () => {
    render(<VariablesTab {...defaultProps} />);
    
    expect(screen.getByText('Var1')).toBeInTheDocument();
    expect(screen.getByText('Variable 1')).toBeInTheDocument();
  });

  it('should display grouping variable correctly', () => {
    render(<VariablesTab {...defaultProps} />);
    
    expect(screen.getByText('GroupVar')).toBeInTheDocument();
    expect(screen.getByText('Group Variable')).toBeInTheDocument();
  });

  it('should display available variables correctly', () => {
    render(<VariablesTab {...defaultProps} />);
    
    expect(screen.getByText('Var2')).toBeInTheDocument();
    expect(screen.getByText('Variable 2')).toBeInTheDocument();
  });

  it('should call moveToAvailableVariables when moving test variable to available', async () => {
    const user = userEvent.setup();
    render(<VariablesTab {...defaultProps} />);
    
    const moveLeftButton = screen.getByTestId('arrow-left');
    await user.click(moveLeftButton);
    
    expect(defaultProps.moveToAvailableVariables).toHaveBeenCalledWith(mockTestVariables[0]);
  });

  it('should call moveToTestVariables when moving available variable to test', async () => {
    const user = userEvent.setup();
    render(<VariablesTab {...defaultProps} />);
    
    const moveRightButton = screen.getByTestId('arrow-right');
    await user.click(moveRightButton);
    
    expect(defaultProps.moveToTestVariables).toHaveBeenCalledWith(mockVariables[1]);
  });

  it('should call moveToGroupingVariable when moving available variable to grouping', async () => {
    const user = userEvent.setup();
    render(<VariablesTab {...defaultProps} />);
    
    const moveToGroupingButton = screen.getByTestId('arrow-right');
    await user.click(moveToGroupingButton);
    
    expect(defaultProps.moveToGroupingVariable).toHaveBeenCalledWith(mockVariables[1]);
  });

  it('should handle group value changes', async () => {
    const user = userEvent.setup();
    render(<VariablesTab {...defaultProps} />);
    
    const group1Select = screen.getByTestId('select');
    await user.selectOptions(group1Select, '1');
    
    expect(defaultProps.setGroup1).toHaveBeenCalledWith(1);
  });

  it('should handle group2 value changes', async () => {
    const user = userEvent.setup();
    render(<VariablesTab {...defaultProps} />);
    
    const group2Select = screen.getByTestId('select');
    await user.selectOptions(group2Select, '2');
    
    expect(defaultProps.setGroup2).toHaveBeenCalledWith(2);
  });

  it('should highlight variables when tour is active', () => {
    render(<VariablesTab {...defaultProps} tourActive={true} currentStep={1} />);
    
    // Check if tour-related elements are present
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
  });

  it('should show warning when no test variables are selected', () => {
    render(<VariablesTab {...defaultProps} testVariables={[]} />);
    
    expect(screen.getByText('No test variables selected')).toBeInTheDocument();
  });

  it('should show warning when no grouping variable is selected', () => {
    render(<VariablesTab {...defaultProps} groupingVariable={null} />);
    
    expect(screen.getByText('No grouping variable selected')).toBeInTheDocument();
  });

  it('should show warning when groups are not defined', () => {
    render(<VariablesTab {...defaultProps} group1={null} group2={null} />);
    
    expect(screen.getByText('Groups not defined')).toBeInTheDocument();
  });

  it('should handle variable reordering', async () => {
    const user = userEvent.setup();
    render(<VariablesTab {...defaultProps} />);
    
    const reorderButton = screen.getByTestId('grip-vertical');
    await user.click(reorderButton);
    
    // This would typically involve drag and drop testing
    // For now, we just verify the reorder button is present
    expect(reorderButton).toBeInTheDocument();
  });

  it('should display variable statistics when available', () => {
    const variablesWithStats = mockVariables.map(v => ({
      ...v,
      statistics: {
        mean: 3.5,
        stdDev: 1.5,
        min: 1,
        max: 6,
        count: 5
      }
    }));
    
    render(<VariablesTab {...defaultProps} availableVariables={variablesWithStats} />);
    
    // Check if statistics are displayed
    expect(screen.getByText('Mean: 3.5')).toBeInTheDocument();
    expect(screen.getByText('Std Dev: 1.5')).toBeInTheDocument();
  });

  it('should handle empty variable lists gracefully', () => {
    render(<VariablesTab {...defaultProps} availableVariables={[]} testVariables={[]} groupingVariable={null} />);
    
    expect(screen.getByText('No available variables')).toBeInTheDocument();
    expect(screen.getByText('No test variables selected')).toBeInTheDocument();
    expect(screen.getByText('No grouping variable selected')).toBeInTheDocument();
  });

  it('should show variable type badges', () => {
    render(<VariablesTab {...defaultProps} />);
    
    // Check if variable type badges are displayed
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should handle variable selection for highlighting', async () => {
    const user = userEvent.setup();
    render(<VariablesTab {...defaultProps} />);
    
    const variableItem = screen.getByText('Var1');
    await user.click(variableItem);
    
    expect(defaultProps.setHighlightedVariable).toHaveBeenCalledWith(mockTestVariables[0]);
  });

  it('should display custom group values when provided', () => {
    const customGroup1 = 1;
    const customGroup2 = 2;
    
    render(<VariablesTab {...defaultProps} group1={customGroup1} group2={customGroup2} />);
    
    expect(screen.getByDisplayValue(customGroup1)).toBeInTheDocument();
    expect(screen.getByDisplayValue(customGroup2)).toBeInTheDocument();
  });

  it('should show info tooltips for guidance', () => {
    render(<VariablesTab {...defaultProps} />);
    
    const infoIcons = screen.getAllByTestId('info-icon');
    expect(infoIcons.length).toBeGreaterThan(0);
  });

  it('should handle disabled state for buttons when appropriate', () => {
    render(<VariablesTab {...defaultProps} testVariables={[]} />);
    
    const moveLeftButton = screen.getByTestId('arrow-left');
    expect(moveLeftButton).toBeDisabled();
  });

  it('should display variable labels when available', () => {
    render(<VariablesTab {...defaultProps} />);
    
    expect(screen.getByText('Variable 1')).toBeInTheDocument();
    expect(screen.getByText('Variable 2')).toBeInTheDocument();
    expect(screen.getByText('Group Variable')).toBeInTheDocument();
  });

  it('should handle missing variable labels gracefully', () => {
    const variablesWithoutLabels = mockVariables.map(v => ({ ...v, label: undefined }));
    
    render(<VariablesTab {...defaultProps} availableVariables={variablesWithoutLabels} />);
    
    // Should fall back to variable names
    expect(screen.getByText('Var1')).toBeInTheDocument();
    expect(screen.getByText('Var2')).toBeInTheDocument();
  });
}); 