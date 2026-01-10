import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IndependentSamplesTTest from '../index';
import {
  useVariableSelection,
  useGroupSettings,
  useIndependentSamplesTTestAnalysis,
  useTourGuide,
} from '../hooks';
import { BaseModalProps } from '@/types/modalTypes';
import { baseTourSteps } from '../hooks/tourConfig';
import { Variable } from '@/types/Variable';
import { TourStep } from '../types';

// Mock the custom hooks module
jest.mock('../hooks');

// Mock useVariableStore
jest.mock('@/stores/useVariableStore', () => ({
  useVariableStore: jest.fn((selector) => selector({
    isLoading: false,
    error: null,
  })),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  HelpCircle: ({ className }: { className?: string }) => (
    <div data-testid="help-circle-icon" className={className}>HelpCircle</div>
  ),
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className}>Loader2</div>
  ),
}));

// Mock TourComponents
jest.mock('@/components/Common/TourComponents', () => ({
  TourPopup: ({ step, currentStep, totalSteps, onNext, onPrev, onClose }: any) => (
    <div data-testid="tour-popup">
      <div>Step: {currentStep + 1}/{totalSteps}</div>
      <div>Content: {step?.content}</div>
      <button onClick={onNext}>Next</button>
      <button onClick={onPrev}>Prev</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock child components
jest.mock('../components/VariablesTab', () => ({
  __esModule: true,
  default: ({ 
    availableVariables, 
    testVariables,
    groupingVariable,
    defineGroups,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    availableVariables: Variable[], 
    testVariables: Variable[],
    groupingVariable: Variable | null,
    defineGroups: any,
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="variables-tab">
      <div>Variables: {availableVariables.length}</div>
      <div>Test Variables: {testVariables.length}</div>
      <div>Grouping Variable: {groupingVariable ? 'Yes' : 'No'}</div>
      <div>Define Groups: {defineGroups.useSpecifiedValues ? 'Specified Values' : 'Cut Point'}</div>
      <div>Tour Active: {String(tourActive)}</div>
      <div>Current Step: {currentStep}</div>
      <div>Tour Steps: {tourSteps?.length || 0}</div>
    </div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className, id }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-testid={id}
      className={className}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  DialogContent: ({ children, className }: any) => (
    <div className={className} data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children, className }: any) => (
    <div className={className} data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children, className }: any) => (
    <h2 className={className} data-testid="dialog-title">{children}</h2>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, className }: any) => (
    <div className={className} data-testid="tabs">
      {children}
    </div>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div className={className} data-testid={`tabs-content-${value}`}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div className={className} data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, id, className }: any) => (
    <button data-testid={id} className={className}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock Radix compose-refs to no-op to avoid nested state update loops during tests
jest.mock('@radix-ui/react-compose-refs', () => {
  const compose = (...refs: any[]) => (node: any) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        // eslint-disable-next-line no-param-reassign
        (ref as { current: any }).current = node;
      }
    });
  };
  return {
    __esModule: true,
    default: compose,
    useComposedRefs: compose,
    composeRefs: compose,
  };
});

// Type-safe casting for mocked hooks
const mockedUseVariableSelection = useVariableSelection as jest.Mock;
const mockedUseGroupSettings = useGroupSettings as jest.Mock;
const mockedUseIndependentSamplesTTestAnalysis = useIndependentSamplesTTestAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;

describe('IndependentSamplesTTest Modal', () => {
  const mockRunAnalysis = jest.fn();
  const mockCancelAnalysis = jest.fn();
  const mockResetVariableSelection = jest.fn();
  const mockResetGroupSettings = jest.fn();
  const mockStartTour = jest.fn();
  const mockOnClose = jest.fn();

  // Helper to set up mock implementations
  const setupMocks = (testVariables: any[] = [], groupingVariable: any = null, isCalculating = false) => {
    mockedUseVariableSelection.mockReturnValue({
      testVariables,
      groupingVariable,
      resetVariableSelection: mockResetVariableSelection,
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToGroupingVariable: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseGroupSettings.mockReturnValue({
      defineGroups: {
        useSpecifiedValues: true,
        cutPoint: false,
      },
      setDefineGroups: jest.fn(),
      group1: 1,
      setGroup1: jest.fn(),
      group2: 2,
      setGroup2: jest.fn(),
      cutPointValue: null,
      setCutPointValue: jest.fn(),
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      resetGroupSettings: mockResetGroupSettings,
    });
    mockedUseIndependentSamplesTTestAnalysis.mockReturnValue({
      isCalculating,
      errorMsg: null,
      runAnalysis: mockRunAnalysis,
      cancelCalculation: mockCancelAnalysis,
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: false,
      currentStep: 0,
      tourSteps: baseTourSteps,
      currentTargetElement: null,
      startTour: mockStartTour,
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
  };
  
  const IndependentSamplesTTestTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
    <IndependentSamplesTTest onClose={mockOnClose} containerType="sidebar" {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with Variables tab', () => {
    setupMocks();
    render(<IndependentSamplesTTestTestComponent />);
    
    // Check that the Variables tab is rendered
    expect(screen.getByTestId('variables-tab')).toBeVisible();
  });

  it('should disable the OK button when no test variables are selected', () => {
    setupMocks([]);
    render(<IndependentSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when no grouping variable is selected', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], null);
    render(<IndependentSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable OK button when using specified values and group1 is null', () => {
    // Setup with group1 null
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      groupingVariable: { name: 'Group', tempId: '2', columnIndex: 1 },
      resetVariableSelection: jest.fn(),
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToGroupingVariable: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseGroupSettings.mockReturnValue({
      defineGroups: {
        useSpecifiedValues: true,
        cutPoint: false,
      },
      setDefineGroups: jest.fn(),
      group1: null, // group1 is null
      setGroup1: jest.fn(),
      group2: 2,
      setGroup2: jest.fn(),
      cutPointValue: null,
      setCutPointValue: jest.fn(),
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      resetGroupSettings: jest.fn(),
    });
    mockedUseIndependentSamplesTTestAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn(),
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: false,
      currentStep: 0,
      tourSteps: baseTourSteps,
      currentTargetElement: null,
      startTour: jest.fn(),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
    
    render(<IndependentSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable OK button when using specified values and group2 is null', () => {
    // Setup with group2 null
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      groupingVariable: { name: 'Group', tempId: '2', columnIndex: 1 },
      resetVariableSelection: jest.fn(),
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToGroupingVariable: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseGroupSettings.mockReturnValue({
      defineGroups: {
        useSpecifiedValues: true,
        cutPoint: false,
      },
      setDefineGroups: jest.fn(),
      group1: 1,
      setGroup1: jest.fn(),
      group2: null, // group2 is null
      setGroup2: jest.fn(),
      cutPointValue: null,
      setCutPointValue: jest.fn(),
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      resetGroupSettings: jest.fn(),
    });
    mockedUseIndependentSamplesTTestAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn(),
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: false,
      currentStep: 0,
      tourSteps: baseTourSteps,
      currentTargetElement: null,
      startTour: jest.fn(),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
    
    render(<IndependentSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable OK button when using cut point and cut point value is null', () => {
    // Setup with cut point but cutPointValue is null
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      groupingVariable: { name: 'Group', tempId: '2', columnIndex: 1 },
      resetVariableSelection: jest.fn(),
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToGroupingVariable: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseGroupSettings.mockReturnValue({
      defineGroups: {
        useSpecifiedValues: false,
        cutPoint: true,
      },
      setDefineGroups: jest.fn(),
      group1: null,
      setGroup1: jest.fn(),
      group2: null,
      setGroup2: jest.fn(),
      cutPointValue: null, // cutPointValue is null
      setCutPointValue: jest.fn(),
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      resetGroupSettings: jest.fn(),
    });
    mockedUseIndependentSamplesTTestAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn(),
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: false,
      currentStep: 0,
      tourSteps: baseTourSteps,
      currentTargetElement: null,
      startTour: jest.fn(),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
    
    render(<IndependentSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should enable the OK button when at least one test variable and grouping variable are selected and ((when using specified values and (group1 is not null and group2 is not null)) or (when using cut point and cut point value is not null))', () => {
    // Test with specified values mode
    setupMocks(
      [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      { name: 'Group', tempId: '2', columnIndex: 1 }
    );
    render(<IndependentSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeEnabled();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    setupMocks(
      [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      { name: 'Group', tempId: '2', columnIndex: 1 }
    );
    render(<IndependentSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    await userEvent.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    setupMocks();
    render(<IndependentSamplesTTestTestComponent />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call reset functions when Reset button is clicked', async () => {
    setupMocks();
    render(<IndependentSamplesTTestTestComponent />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    expect(mockResetVariableSelection).toHaveBeenCalledTimes(1);
    expect(mockResetGroupSettings).toHaveBeenCalledTimes(1);
    expect(mockCancelAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call startTour when the help button is clicked', async () => {
    setupMocks();
    render(<IndependentSamplesTTestTestComponent />);
    
    const helpButton = screen.getByTestId('help-circle-icon').closest('button');
    if (helpButton) {
      await userEvent.click(helpButton);
      expect(mockStartTour).toHaveBeenCalledTimes(1);
    }
  });

  it('should display loading text and disable buttons when analysis is in progress', () => {
    setupMocks(
      [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      { name: 'Group', tempId: '2', columnIndex: 1 },
      true
    );
    render(<IndependentSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toHaveTextContent('Processing...');
    expect(okButton).toBeDisabled();
    
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('passes tour props to VariablesTab', () => {
    // Setup mock with tourActive = true
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [],
      groupingVariable: null,
      resetVariableSelection: jest.fn(),
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToGroupingVariable: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseGroupSettings.mockReturnValue({
      defineGroups: {
        useSpecifiedValues: true,
        cutPoint: false,
      },
      setDefineGroups: jest.fn(),
      group1: 1,
      setGroup1: jest.fn(),
      group2: 2,
      setGroup2: jest.fn(),
      cutPointValue: null,
      setCutPointValue: jest.fn(),
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      resetGroupSettings: jest.fn(),
    });
    mockedUseIndependentSamplesTTestAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn(),
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: true,
      currentStep: 2,
      tourSteps: baseTourSteps,
      currentTargetElement: null,
      startTour: jest.fn(),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
    
    render(<IndependentSamplesTTestTestComponent />);
    
    // Verify tour props are passed to VariablesTab
    const variablesTab = screen.getByTestId('variables-tab');
    expect(variablesTab).toHaveTextContent('Tour Active: true');
    expect(variablesTab).toHaveTextContent('Current Step: 2');
    expect(variablesTab).toHaveTextContent(`Tour Steps: ${baseTourSteps.length}`);
  });
  
  it('should call toast when OK button is click when using specified values and groups are the same', async () => {
    const { toast } = require('sonner');
    
    // Setup with same group values
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      groupingVariable: { name: 'Group', tempId: '2', columnIndex: 1 },
      resetVariableSelection: jest.fn(),
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToGroupingVariable: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseGroupSettings.mockReturnValue({
      defineGroups: {
        useSpecifiedValues: true,
        cutPoint: false,
      },
      setDefineGroups: jest.fn(),
      group1: 1,
      setGroup1: jest.fn(),
      group2: 1, // Same as group1
      setGroup2: jest.fn(),
      cutPointValue: null,
      setCutPointValue: jest.fn(),
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      resetGroupSettings: jest.fn(),
    });
    mockedUseIndependentSamplesTTestAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn(),
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: false,
      currentStep: 0,
      tourSteps: baseTourSteps,
      currentTargetElement: null,
      startTour: jest.fn(),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
    
    render(<IndependentSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeEnabled(); // Button should be enabled initially
    
    // Click OK button
    await userEvent.click(okButton);
    
    // Verify toast error is called
    expect(toast.error).toHaveBeenCalledWith("Group 1 and Group 2 must be different.");
    
    // Verify runAnalysis is not called
    expect(mockRunAnalysis).not.toHaveBeenCalled();
  });
}); 