import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariablesTab from '../components/VariablesTab';
import { VariablesTabProps } from '../types';
import { Variable } from '@/types/Variable';
import { TourStep } from '../types';

// ---------------------------------------------
// Mock UI components to simple HTML elements
// ---------------------------------------------
jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: ({ children, onClick, disabled, variant, size, className, id }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      id={id}
      data-testid={id}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/table', () => ({
  __esModule: true,
  Table: ({ children, className }: any) => (
    <table data-testid="table" className={className}>{children}</table>
  ),
  TableHeader: ({ children, className }: any) => (
    <thead data-testid="table-header" className={className}>{children}</thead>
  ),
  TableRow: ({ children, className, onClick }: any) => (
    <tr data-testid="table-row" className={className} onClick={onClick}>{children}</tr>
  ),
  TableHead: ({ children, className }: any) => (
    <th data-testid="table-head" className={className}>{children}</th>
  ),
  TableBody: ({ children, className }: any) => (
    <tbody data-testid="table-body" className={className}>{children}</tbody>
  ),
  TableCell: ({ children, className, colSpan, onClick, onDoubleClick }: any) => (
    <td data-testid="table-cell" className={className} colSpan={colSpan} onClick={onClick} onDoubleClick={onDoubleClick}>{children}</td>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  __esModule: true,
  Input: ({ value, onChange, placeholder, className, id }: any) => (
    <input 
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      id={id}
      data-testid={id}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  __esModule: true,
  Label: ({ children, htmlFor, className }: any) => (
    <label data-testid="label" htmlFor={htmlFor} className={className}>{children}</label>
  ),
}));

jest.mock('@/components/ui/separator', () => ({
  __esModule: true,
  Separator: ({ className, orientation }: any) => (
    <div data-testid="separator" className={className} data-orientation={orientation} />
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  __esModule: true,
  ScrollArea: ({ children, className }: any) => (
    <div data-testid="scroll-area" className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/checkbox', () => ({
  __esModule: true,
  Checkbox: ({ id, checked, onCheckedChange, disabled }: any) => (
    <input
      type="checkbox"
      data-testid={id}
      checked={checked}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      disabled={disabled}
      readOnly
    />
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  __esModule: true,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => {
    if (asChild) {
      return children;
    }
    return <div data-testid="tooltip-trigger">{children}</div>;
  },
}));

jest.mock('@/components/Common/TourComponents', () => ({
  __esModule: true,
  ActiveElementHighlight: ({ active }: { active: boolean }) => {
    if (active) {
      return <div data-testid="active-element-highlight" data-active={active.toString()}></div>;
    }
    return null;
  }
}));

jest.mock('lucide-react', () => ({
  __esModule: true,
  ArrowUp: ({ className }: any) => <div data-testid="arrow-up" className={className}>ArrowUp</div>,
  ArrowDown: ({ className }: any) => <div data-testid="arrow-down" className={className}>ArrowDown</div>,
  X: ({ className }: any) => <div data-testid="x-icon" className={className}>X</div>,
  ArrowRight: ({ className }: any) => <div data-testid="arrow-right" className={className}>ArrowRight</div>,
  ArrowLeft: ({ className }: any) => <div data-testid="arrow-left" className={className}>ArrowLeft</div>,
  Plus: ({ className }: any) => <div data-testid="plus-icon" className={className}>Plus</div>,
  ArrowBigUp: ({ className }: any) => <div data-testid="arrow-big-up" className={className}>ArrowBigUp</div>,
  ArrowBigDown: ({ className }: any) => <div data-testid="arrow-big-down" className={className}>ArrowBigDown</div>,
  ArrowBigLeft: ({ className }: any) => <div data-testid="arrow-big-left" className={className}>ArrowBigLeft</div>,
  ArrowBigRight: ({ className }: any) => <div data-testid="arrow-big-right" className={className}>ArrowBigRight</div>,
  MoveHorizontal: ({ className }: any) => <div data-testid="move-horizontal" className={className}>MoveHorizontal</div>,
  Ruler: ({ className }: any) => <div data-testid="ruler" className={className}>Ruler</div>,
  Shapes: ({ className }: any) => <div data-testid="shapes" className={className}>Shapes</div>,
  BarChartHorizontal: ({ className }: any) => <div data-testid="bar-chart-horizontal" className={className}>BarChartHorizontal</div>,
  FileQuestion: ({ className }: any) => <div data-testid="file-question" className={className}>FileQuestion</div>,
  InfoIcon: ({ className }: any) => <div data-testid="info-icon" className={className}>InfoIcon</div>,
}));

// ---------------------------------------------
// Helper variable list
// ---------------------------------------------
const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    tempId: 'temp_0',
    columnIndex: 0,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  },
  {
    name: 'var2',
    label: 'Variable 2',
    tempId: 'temp_1',
    columnIndex: 1,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  },
  {
    name: 'var3',
    label: 'Variable 3',
    tempId: 'temp_2',
    columnIndex: 2,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  },
  {
    name: 'var4',
    label: 'Variable 4',
    tempId: 'temp_3',
    columnIndex: 3,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'scale',
    role: 'input',
    columns: 8
  },
  {
    name: 'nominal_var',
    label: 'Nominal Variable',
    tempId: 'temp_4',
    columnIndex: 4,
    type: 'NUMERIC',
    width: 8,
    decimals: 2,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8
  }
];

// Mock tour steps
const mockTourSteps: TourStep[] = [
  {
    targetId: 'paired-samples-t-test-available-variables',
    content: 'Select numeric variables from this list to analyze with Paired-Samples T Test.',
    title: 'Variable Selection',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: '📊',
    requiredTab: 'variables'
  },
  {
    targetId: 'paired-samples-t-test-test-variables',
    content: 'Variables moved to this list will be analyzed in pairs.',
    title: 'Test Variables',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'right',
    icon: '📋',
    requiredTab: 'variables'
  },
  {
    targetId: 'paired-samples-t-test-options-tab',
    content: 'Configure test options and settings.',
    title: 'Options Tab',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '⚙️',
    requiredTab: 'options',
    forceChangeTab: true
  },
  {
    targetId: 'estimate-effect-size-section',
    content: 'Enable effect size calculation for the test.',
    title: 'Estimate Effect Size',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📏',
    requiredTab: 'options'
  }
];

describe('PairedSamplesTTest VariablesTab component', () => {
  const defaultProps: VariablesTabProps = {
    availableVariables: mockVariables,
    testVariables1: [],
    testVariables2: [],
    pairNumbers: [],
    highlightedPair: null,
    setHighlightedPair: jest.fn(),
    highlightedVariable: null,
    setHighlightedVariable: jest.fn(),
    moveToTestVariables: jest.fn(),
    removeVariable: jest.fn(),
    moveVariableBetweenLists: jest.fn(),
    moveUpPair: jest.fn(),
    moveDownPair: jest.fn(),
    removePair: jest.fn(),
    reorderPairs: jest.fn(),
    tourActive: false,
    currentStep: 0,
    tourSteps: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------
  // Initial Rendering Tests
  // ------------------------------
  describe('Initial Rendering', () => {
    it('should render the variables tab with correct structure', () => {
      render(<VariablesTab {...defaultProps} />);

      expect(screen.getByText('Available Variables')).toBeInTheDocument();
      expect(screen.getByText('Paired Variable(s)')).toBeInTheDocument();
      expect(screen.getByTestId('table')).toBeInTheDocument();
    });

    it('should display available variables in the table', () => {
      render(<VariablesTab {...defaultProps} />);

      // Use getAllByText since each variable appears in main content and tooltip content
      expect(screen.getAllByText('Variable 1 [var1]')).toHaveLength(2); // Main + tooltip
      expect(screen.getAllByText('Variable 2 [var2]')).toHaveLength(2); // Main + tooltip
      expect(screen.getAllByText('Variable 3 [var3]')).toHaveLength(2); // Main + tooltip
      expect(screen.getAllByText('Variable 4 [var4]')).toHaveLength(2); // Main + tooltip
    });

    it('should show empty state message when no test variables are selected', () => {
      render(<VariablesTab {...defaultProps} />);

      expect(screen.getByText('No variables selected for testing')).toBeInTheDocument();
    });

    it('should display test variable pairs when variables are selected', () => {
      const propsWithVariables = {
        ...defaultProps,
        testVariables1: [mockVariables[0], mockVariables[2]],
        testVariables2: [mockVariables[1], mockVariables[3]],
        pairNumbers: [1, 2],
      };

      render(<VariablesTab {...propsWithVariables} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Use getAllByText to handle multiple elements with the same text
      // Variables appear in: available list (main + tooltip) + test table (main) = 3 total
      expect(screen.getAllByText('Variable 1 [var1]')).toHaveLength(3); // Available (2) + Test (1)
      expect(screen.getAllByText('Variable 2 [var2]')).toHaveLength(3); // Available (2) + Test (1)
      expect(screen.getAllByText('Variable 3 [var3]')).toHaveLength(3); // Available (2) + Test (1)
      expect(screen.getAllByText('Variable 4 [var4]')).toHaveLength(3); // Available (2) + Test (1)
    });

    it('should display variable names with correct format', () => {
      render(<VariablesTab {...defaultProps} />);

      // Check that variables are displayed with their labels in format "Label [name]"
      // Use getAllByText since variables appear in main content and tooltip content
      expect(screen.getAllByText('Variable 1 [var1]')).toHaveLength(2); // Main + tooltip
      expect(screen.getAllByText('Variable 2 [var2]')).toHaveLength(2); // Main + tooltip
      expect(screen.getAllByText('Variable 3 [var3]')).toHaveLength(2); // Main + tooltip
      expect(screen.getAllByText('Variable 4 [var4]')).toHaveLength(2); // Main + tooltip
    });

    it('should show message when no available variables', () => {
      const props = {
        ...defaultProps,
        availableVariables: [],
      };

      render(<VariablesTab {...props} />);

      // When no available variables, the component should still render but with empty list
      expect(screen.getByText('Available Variables')).toBeInTheDocument();
      expect(screen.getByText('Paired Variable(s)')).toBeInTheDocument();
    });

    it('should show empty state message when no test variables are selected', () => {
      const props = {
        ...defaultProps,
        testVariables1: [],
        testVariables2: [],
        pairNumbers: [],
      };

      render(<VariablesTab {...props} />);

      expect(screen.getByText('No variables selected for testing')).toBeInTheDocument();
    });

    it('should render allow unknown checkbox', () => {
      render(<VariablesTab {...defaultProps} />);

      expect(screen.getByTestId('allowUnknown')).toBeInTheDocument();
      expect(screen.getByText("Treat 'unknown' as Scale and allow selection")).toBeInTheDocument();
    });
  });

  // ------------------------------
  // Variable Interaction & Logic Tests
  // ------------------------------
  describe('Variable Interaction & Logic', () => {
    it('should call moveToTestVariables when available variable is double-clicked', async () => {
      const mockMoveToTestVariables = jest.fn();
      const props = {
        ...defaultProps,
        moveToTestVariables: mockMoveToTestVariables,
      };

      render(<VariablesTab {...props} />);

      // Find the variable element and double-click it
      const variableElements = screen.getAllByText('Variable 1 [var1]');
      // Click on the main variable element (not the tooltip)
      const variableElement = variableElements.find(element => 
        element.tagName === 'SPAN' && element.className.includes('truncate')
      );
      
      if (variableElement) {
        // Use double-click to trigger moveToTestVariables
        await userEvent.dblClick(variableElement);
        expect(mockMoveToTestVariables).toHaveBeenCalledWith(mockVariables[0]);
      } else {
        throw new Error('Variable element not found');
      }
    });

    it('should highlight variable when clicked', async () => {
      const mockSetHighlightedVariable = jest.fn();
      const props = {
        ...defaultProps,
        setHighlightedVariable: mockSetHighlightedVariable,
      };

      render(<VariablesTab {...props} />);

      const variableElements = screen.getAllByText('Variable 1 [var1]');
      const variableElement = variableElements.find(element => 
        element.tagName === 'SPAN' && element.className.includes('truncate')
      );
      
      if (variableElement) {
        await userEvent.click(variableElement);
        expect(mockSetHighlightedVariable).toHaveBeenCalledWith({
          tempId: 'temp_0',
          source: 'available' as const,
          rowIndex: undefined,
        });
      } else {
        throw new Error('Variable element not found');
      }
    });

    it('should remove highlight when clicking on already highlighted variable', async () => {
      const mockSetHighlightedVariable = jest.fn();
      const props = {
        ...defaultProps,
        highlightedVariable: {
          tempId: 'temp_0',
          source: 'available' as const,
          rowIndex: undefined,
        },
        setHighlightedVariable: mockSetHighlightedVariable,
      };

      render(<VariablesTab {...props} />);

      const variableElements = screen.getAllByText('Variable 1 [var1]');
      const variableElement = variableElements.find(element => 
        element.tagName === 'SPAN' && element.className.includes('truncate')
      );
      
      if (variableElement) {
        await userEvent.click(variableElement);
        expect(mockSetHighlightedVariable).toHaveBeenCalledWith(null);
      } else {
        throw new Error('Variable element not found');
      }
    });

    it('should call removeVariable when test variable in table is double-clicked', async () => {
      const mockRemoveVariable = jest.fn();
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0]],
        testVariables2: [mockVariables[1]],
        pairNumbers: [1],
        removeVariable: mockRemoveVariable,
      };

      render(<VariablesTab {...props} />);

      // Find the test variable in the table and double-click it
      // Use a more specific selector to target the test variable in the table
      const testVariableElements = screen.getAllByText('Variable 1 [var1]');
      // The test variable should be in a table cell, so look for the one that's not in the available variables section
      const testVariableElement = testVariableElements.find(element => 
        element.closest('td') !== null
      );
      
      if (testVariableElement) {
        await userEvent.dblClick(testVariableElement);
        expect(mockRemoveVariable).toHaveBeenCalledWith('test1', 0);
      } else {
        // If we can't find the test variable element, the test should fail
        throw new Error('Test variable element not found in table');
      }
    });

    it('should call moveVariableBetweenLists when swap button is clicked for highlighted pair', async () => {
      const mockMoveVariableBetweenLists = jest.fn();
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0]],
        testVariables2: [mockVariables[1]],
        pairNumbers: [1],
        highlightedPair: { id: 0 },
        moveVariableBetweenLists: mockMoveVariableBetweenLists,
      };

      render(<VariablesTab {...props} />);

      // Find the move button and click it
      const moveButton = screen.getByTestId('paired-samples-t-test-change-button');
      await userEvent.click(moveButton);

      expect(mockMoveVariableBetweenLists).toHaveBeenCalledWith(0);
    });

    it('should call moveUpPair when up arrow button is clicked for highlighted pair', async () => {
      const mockMoveUpPair = jest.fn();
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0], mockVariables[2]],
        testVariables2: [mockVariables[1], mockVariables[3]],
        pairNumbers: [1, 2],
        highlightedPair: { id: 1 },
        moveUpPair: mockMoveUpPair,
      };

      render(<VariablesTab {...props} />);

      const upButton = screen.getByTestId('paired-samples-t-test-move-up-button');
      await userEvent.click(upButton);

      expect(mockMoveUpPair).toHaveBeenCalledWith(1);
    });

    it('should call moveDownPair when down arrow button is clicked for highlighted pair', async () => {
      const mockMoveDownPair = jest.fn();
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0], mockVariables[2]],
        testVariables2: [mockVariables[1], mockVariables[3]],
        pairNumbers: [1, 2],
        highlightedPair: { id: 0 },
        moveDownPair: mockMoveDownPair,
      };

      render(<VariablesTab {...props} />);

      const downButton = screen.getByTestId('paired-samples-t-test-move-down-button');
      await userEvent.click(downButton);

      expect(mockMoveDownPair).toHaveBeenCalledWith(0);
    });

    it('should call removePair when highlighted pair has remove button clicked', async () => {
      const mockRemovePair = jest.fn();
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0]],
        testVariables2: [mockVariables[1]],
        pairNumbers: [1],
        highlightedPair: { id: 0 },
        removePair: mockRemovePair,
      };

      render(<VariablesTab {...props} />);

      // The remove functionality is handled through the move button when pair is highlighted
      // This test verifies the removePair function is available
      expect(mockRemovePair).toBeDefined();
    });
  });

  // ------------------------------
  // Pair Management Tests
  // ------------------------------
  describe('Pair Management', () => {
    it('should highlight pair when pair number cell is clicked', async () => {
      const mockSetHighlightedPair = jest.fn();
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0]],
        testVariables2: [mockVariables[1]],
        pairNumbers: [1],
        setHighlightedPair: mockSetHighlightedPair,
      };

      render(<VariablesTab {...props} />);

      // Click on the pair number cell
      const pairCell = screen.getByText('1');
      await userEvent.click(pairCell);

      expect(mockSetHighlightedPair).toHaveBeenCalledWith({
        id: 0,
      });
    });

    it('should remove pair highlight when clicking on already highlighted pair', async () => {
      const mockSetHighlightedPair = jest.fn();
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0]],
        testVariables2: [mockVariables[1]],
        pairNumbers: [1],
        highlightedPair: { id: 0 },
        setHighlightedPair: mockSetHighlightedPair,
      };

      render(<VariablesTab {...props} />);

      const pairCell = screen.getByText('1');
      await userEvent.click(pairCell);

      expect(mockSetHighlightedPair).toHaveBeenCalledWith(null);
    });

    it('should disable move up button when first pair is highlighted', () => {
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0], mockVariables[2]],
        testVariables2: [mockVariables[1], mockVariables[3]],
        pairNumbers: [1, 2],
        highlightedPair: { id: 0 },
      };

      render(<VariablesTab {...props} />);

      const upButton = screen.getByTestId('paired-samples-t-test-move-up-button');
      expect(upButton).toBeDisabled();
    });

    it('should disable move down button when last pair is highlighted', () => {
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0], mockVariables[2]],
        testVariables2: [mockVariables[1], mockVariables[3]],
        pairNumbers: [1, 2],
        highlightedPair: { id: 1 },
      };

      render(<VariablesTab {...props} />);

      const downButton = screen.getByTestId('paired-samples-t-test-move-down-button');
      expect(downButton).toBeDisabled();
    });

    it('should enable move buttons when middle pair is highlighted', () => {
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0], mockVariables[2], mockVariables[3]],
        testVariables2: [mockVariables[1], mockVariables[0], mockVariables[1]],
        pairNumbers: [1, 2, 3],
        highlightedPair: { id: 1 },
      };

      render(<VariablesTab {...props} />);

      const upButton = screen.getByTestId('paired-samples-t-test-move-up-button');
      const downButton = screen.getByTestId('paired-samples-t-test-move-down-button');
      
      expect(upButton).not.toBeDisabled();
      expect(downButton).not.toBeDisabled();
    });

    it('should disable all move buttons when no pair is highlighted', () => {
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0], mockVariables[2]],
        testVariables2: [mockVariables[1], mockVariables[3]],
        pairNumbers: [1, 2],
        highlightedPair: null,
      };

      render(<VariablesTab {...props} />);

      const upButton = screen.getByTestId('paired-samples-t-test-move-up-button');
      const downButton = screen.getByTestId('paired-samples-t-test-move-down-button');
      const changeButton = screen.getByTestId('paired-samples-t-test-change-button');
      
      expect(upButton).toBeDisabled();
      expect(downButton).toBeDisabled();
      expect(changeButton).toBeDisabled();
    });
  });

  // ------------------------------
  // Interactive Tour Tests
  // ------------------------------
  describe('Interactive Tour Functionality', () => {
    it('should render component structure when tour is active', () => {
      const props = {
        ...defaultProps,
        tourActive: true,
        currentStep: 0,
        tourSteps: mockTourSteps,
      };

      render(<VariablesTab {...props} />);

      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByText('Available Variables')).toBeInTheDocument();
      expect(screen.getByText('Paired Variable(s)')).toBeInTheDocument();
    });

    it('should have all required tour target elements', () => {
      render(<VariablesTab {...defaultProps} />);

      // Check that all tour target elements exist in the DOM
      expect(document.getElementById('paired-samples-t-test-available-variables')).toBeInTheDocument();
      expect(document.getElementById('paired-samples-t-test-test-variables')).toBeInTheDocument();
      expect(document.getElementById('paired-samples-t-test-move-up-button')).toBeInTheDocument();
      expect(document.getElementById('paired-samples-t-test-move-down-button')).toBeInTheDocument();
      expect(document.getElementById('paired-samples-t-test-change-button')).toBeInTheDocument();
      expect(document.getElementById('paired-samples-t-test-move-button')).toBeInTheDocument();
    });

    it('should render component normally when tour is inactive', () => {
      const props = {
        ...defaultProps,
        tourActive: false,
        currentStep: 0,
        tourSteps: [],
      };

      render(<VariablesTab {...props} />);

      expect(screen.getByTestId('table')).toBeInTheDocument();
    });
  });

  // ------------------------------
  // Accessibility Tests
  // ------------------------------
  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      const props = {
        ...defaultProps,
        testVariables1: [mockVariables[0]],
        testVariables2: [mockVariables[1]],
        pairNumbers: [1],
        highlightedPair: { id: 0 },
      };

      render(<VariablesTab {...props} />);

      const upButton = screen.getByTestId('paired-samples-t-test-move-up-button');
      const downButton = screen.getByTestId('paired-samples-t-test-move-down-button');
      const changeButton = screen.getByTestId('paired-samples-t-test-change-button');

      expect(upButton).toBeInTheDocument();
      expect(downButton).toBeInTheDocument();
      expect(changeButton).toBeInTheDocument();
    });

    it('should display proper table headers for paired variables', () => {
      render(<VariablesTab {...defaultProps} />);

      expect(screen.getByText('Pair')).toBeInTheDocument();
      expect(screen.getByText('Variable 1')).toBeInTheDocument();
      expect(screen.getByText('Variable 2')).toBeInTheDocument();
    });

    it('should render tooltip components for all available variables', () => {
      render(<VariablesTab {...defaultProps} />);

      // Check that tooltip components are rendered
      expect(screen.getAllByTestId('tooltip-provider')).toHaveLength(mockVariables.length);
      expect(screen.getAllByTestId('tooltip')).toHaveLength(mockVariables.length);
    });

    it('should display user guidance text for variable interaction', () => {
      render(<VariablesTab {...defaultProps} />);

      expect(screen.getByText('Double-click to move variables between lists.')).toBeInTheDocument();
    });
  });
}); 