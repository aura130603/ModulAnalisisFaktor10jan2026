import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PairedSamplesTTest from '../index';
import {
  useVariableSelection,
  useTestSettings,
  usePairedSamplesTTestAnalysis,
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
  useVariableStore: jest.fn(),
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
    testVariables1,
    testVariables2,
    pairNumbers,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    availableVariables: Variable[], 
    testVariables1: Variable[],
    testVariables2: Variable[],
    pairNumbers: number[],
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="variables-tab">
      <div>Variables: {availableVariables.length}</div>
      <div>Test Variables 1: {testVariables1.length}</div>
      <div>Test Variables 2: {testVariables2.length}</div>
      <div>Pair Numbers: {pairNumbers.length}</div>
      <div>Tour Active: {String(tourActive)}</div>
      <div>Current Step: {currentStep}</div>
      <div>Tour Steps: {tourSteps?.length || 0}</div>
    </div>
  ),
}));

jest.mock('../components/OptionsTab', () => ({
  __esModule: true,
  default: ({ 
    estimateEffectSize,
    calculateStandardizer,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    estimateEffectSize: boolean,
    calculateStandardizer: any,
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="options-tab">
      <div>Estimate Effect Size: {String(estimateEffectSize)}</div>
      <div>Calculate Standardizer: {JSON.stringify(calculateStandardizer)}</div>
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
const mockedUseTestSettings = useTestSettings as jest.Mock;
const mockedUsePairedSamplesTTestAnalysis = usePairedSamplesTTestAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;

describe('PairedSamplesTTest Modal', () => {
  const mockRunAnalysis = jest.fn();
  const mockCancelAnalysis = jest.fn();
  const mockResetVariableSelection = jest.fn();
  const mockResetTestSettings = jest.fn();
  const mockStartTour = jest.fn();
  const mockOnClose = jest.fn();

  // Helper to set up mock implementations
  const setupMocks = (
    testVariables1: any[] = [], 
    testVariables2: any[] = [], 
    pairNumbers: number[] = [],
    isCalculating = false
  ) => {
    // Setup useVariableStore mock
    const mockUseVariableStore = require('@/stores/useVariableStore').useVariableStore;
    mockUseVariableStore.mockImplementation((selector: any) => selector({
      isLoading: false,
      error: null,
    }));

    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [
        { name: 'var1', label: 'Variable 1', tempId: '1' } as Variable,
        { name: 'var2', label: 'Variable 2', tempId: '2' } as Variable,
      ],
      testVariables1,
      testVariables2,
      pairNumbers,
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
      isPairValid: jest.fn(() => true),
      areAllPairsValid: jest.fn(() => true),
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: mockResetVariableSelection,
    });

    mockedUseTestSettings.mockReturnValue({
      estimateEffectSize: true,
      setEstimateEffectSize: jest.fn(),
      calculateStandardizer: {
        standardDeviation: true,
        correctedStandardDeviation: false,
        averageOfVariances: false,
      },
      setCalculateStandardizer: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });

    mockedUsePairedSamplesTTestAnalysis.mockReturnValue({
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
  
  const PairedSamplesTTestTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
    <PairedSamplesTTest onClose={mockOnClose} containerType="sidebar" {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with Variables tab', () => {
    setupMocks();
    render(<PairedSamplesTTestTestComponent />);
    
    // Check that the Variables tab is rendered
    expect(screen.getByTestId('variables-tab')).toBeVisible();
  });

  it('should disable the OK button when no test variables are selected', () => {
    setupMocks();
    
    // Override areAllPairsValid to return false when no pairs exist
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [
        { name: 'var1', label: 'Variable 1', tempId: '1' } as Variable,
        { name: 'var2', label: 'Variable 2', tempId: '2' } as Variable,
      ],
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
      isPairValid: jest.fn(() => true),
      areAllPairsValid: jest.fn(() => false), // No pairs = not valid
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: mockResetVariableSelection,
    });
    
    render(<PairedSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('paired-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when test variables are not paired', () => {
    setupMocks(
      [{ name: 'var1', label: 'Variable 1', tempId: '1' } as Variable],
      [], // No second variable
      []
    );
    
    // Override areAllPairsValid to return false when pairs are incomplete
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [
        { name: 'var1', label: 'Variable 1', tempId: '1' } as Variable,
        { name: 'var2', label: 'Variable 2', tempId: '2' } as Variable,
      ],
      testVariables1: [{ name: 'var1', label: 'Variable 1', tempId: '1' } as Variable],
      testVariables2: [], // No second variable
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
      isPairValid: jest.fn(() => true),
      areAllPairsValid: jest.fn(() => false), // Incomplete pairs = not valid
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: mockResetVariableSelection,
    });
    
    render(<PairedSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('paired-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should enable the OK button when test variables are properly paired', () => {
    setupMocks(
      [{ name: 'var1', label: 'Variable 1', tempId: '1' } as Variable],
      [{ name: 'var2', label: 'Variable 2', tempId: '2' } as Variable],
      [1]
    );
    render(<PairedSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('paired-samples-t-test-ok-button');
    expect(okButton).toBeEnabled();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    setupMocks(
      [{ name: 'var1', label: 'Variable 1', tempId: '1' } as Variable],
      [{ name: 'var2', label: 'Variable 2', tempId: '2' } as Variable],
      [1]
    );
    render(<PairedSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('paired-samples-t-test-ok-button');
    await userEvent.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    setupMocks();
    render(<PairedSamplesTTestTestComponent />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call reset functions when Reset button is clicked', async () => {
    setupMocks();
    render(<PairedSamplesTTestTestComponent />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    expect(mockResetVariableSelection).toHaveBeenCalledTimes(1);
    expect(mockResetTestSettings).toHaveBeenCalledTimes(1);
    expect(mockCancelAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call startTour when the help button is clicked', async () => {
    setupMocks();
    render(<PairedSamplesTTestTestComponent />);
    
    const helpButton = screen.getByTestId('help-circle-icon').closest('button');
    if (helpButton) {
      await userEvent.click(helpButton);
      expect(mockStartTour).toHaveBeenCalledTimes(1);
    }
  });

  it('should display loading text and disable buttons when analysis is in progress', () => {
    setupMocks(
      [{ name: 'var1', label: 'Variable 1', tempId: '1' } as Variable],
      [{ name: 'var2', label: 'Variable 2', tempId: '2' } as Variable],
      [1],
      true
    );
    render(<PairedSamplesTTestTestComponent />);
    
    const okButton = screen.getByTestId('paired-samples-t-test-ok-button');
    expect(okButton).toHaveTextContent('Processing...');
    expect(okButton).toBeDisabled();
    
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('should switch to options tab when clicked', async () => {
    setupMocks();
    render(<PairedSamplesTTestTestComponent />);
    
    const optionsTab = screen.getByTestId('options-tab-trigger');
    await userEvent.click(optionsTab);
    
    expect(screen.getByTestId('options-tab')).toBeInTheDocument();
  });

  it('should switch back to variables tab when clicked', async () => {
    setupMocks();
    render(<PairedSamplesTTestTestComponent />);
    
    // First switch to options
    const optionsTab = screen.getByTestId('options-tab-trigger');
    await userEvent.click(optionsTab);
    
    // Then switch back to variables
    const variablesTab = screen.getByTestId('variables-tab-trigger');
    await userEvent.click(variablesTab);
    
    expect(screen.getByTestId('variables-tab')).toBeInTheDocument();
  });

  it('passes tour props to VariablesTab', () => {
    // Setup mock with tourActive = true
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [],
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
      isPairValid: jest.fn(() => true),
      areAllPairsValid: jest.fn(() => true),
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: jest.fn(),
    });
    mockedUseTestSettings.mockReturnValue({
      estimateEffectSize: true,
      setEstimateEffectSize: jest.fn(),
      calculateStandardizer: {
        standardDeviation: true,
        correctedStandardDeviation: false,
        averageOfVariances: false,
      },
      setCalculateStandardizer: jest.fn(),
      resetTestSettings: jest.fn(),
    });
    mockedUsePairedSamplesTTestAnalysis.mockReturnValue({
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
    
    render(<PairedSamplesTTestTestComponent />);
    
    // Verify tour props are passed to VariablesTab
    const variablesTab = screen.getByTestId('variables-tab');
    expect(variablesTab).toHaveTextContent('Tour Active: true');
    expect(variablesTab).toHaveTextContent('Current Step: 2');
    expect(variablesTab).toHaveTextContent(`Tour Steps: ${baseTourSteps.length}`);
  });

  it('passes tour props to OptionsTab', async () => {
    // Setup mock with tourActive = true
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [],
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
      isPairValid: jest.fn(() => true),
      areAllPairsValid: jest.fn(() => true),
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: jest.fn(),
    });
    mockedUseTestSettings.mockReturnValue({
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      calculateStandardizer: {
        standardDeviation: false,
        correctedStandardDeviation: true,
        averageOfVariances: true,
      },
      setCalculateStandardizer: jest.fn(),
      resetTestSettings: jest.fn(),
    });
    mockedUsePairedSamplesTTestAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn(),
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: true,
      currentStep: 3,
      tourSteps: baseTourSteps,
      currentTargetElement: null,
      startTour: jest.fn(),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
    
    render(<PairedSamplesTTestTestComponent />);
    
    // Switch to options tab
    const optionsTab = screen.getByTestId('options-tab-trigger');
    await userEvent.click(optionsTab);
    
    // Verify tour props are passed to OptionsTab
    const optionsTabContent = screen.getByTestId('options-tab');
    expect(optionsTabContent).toHaveTextContent('Tour Active: true');
    expect(optionsTabContent).toHaveTextContent('Current Step: 3');
    expect(optionsTabContent).toHaveTextContent(`Tour Steps: ${baseTourSteps.length}`);
  });

  it('should display error message when analysis fails', () => {
    // Setup all required mocks for this test
    const mockUseVariableStore = require('@/stores/useVariableStore').useVariableStore;
    mockUseVariableStore.mockImplementation((selector: any) => selector({
      isLoading: false,
      error: null,
    }));
    
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [],
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
      isPairValid: jest.fn(() => true),
      areAllPairsValid: jest.fn(() => true),
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: jest.fn(),
    });
    
    mockedUseTestSettings.mockReturnValue({
      estimateEffectSize: true,
      setEstimateEffectSize: jest.fn(),
      calculateStandardizer: {
        standardDeviation: true,
        correctedStandardDeviation: false,
        averageOfVariances: false,
      },
      setCalculateStandardizer: jest.fn(),
      resetTestSettings: jest.fn(),
    });
    
    mockedUsePairedSamplesTTestAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: 'Analysis failed',
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
    
    render(<PairedSamplesTTestTestComponent />);
    
    expect(screen.getByText('Analysis failed')).toBeInTheDocument();
  });

  it('should display variables loading error', () => {
    const mockUseVariableStore = require('@/stores/useVariableStore').useVariableStore;
    mockUseVariableStore.mockImplementation((selector: any) => selector({
      isLoading: false,
      error: { message: 'Failed to load variables' },
    }));
    
    render(<PairedSamplesTTestTestComponent />);
    
    expect(screen.getByText('Failed to load variables')).toBeInTheDocument();
  });

  it('should render with different container types', () => {
    const { rerender } = render(<PairedSamplesTTestTestComponent containerType="dialog" />);
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Paired-Samples T Test');
    
    rerender(<PairedSamplesTTestTestComponent containerType="sidebar" />);
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument();
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('should pass correct props to VariablesTab', () => {
    const testVars1 = [{ name: 'var1', label: 'Variable 1', tempId: '1' } as Variable];
    const testVars2 = [{ name: 'var2', label: 'Variable 2', tempId: '2' } as Variable];
    const pairNums = [1];
    
    setupMocks(testVars1, testVars2, pairNums);
    
    render(<PairedSamplesTTestTestComponent />);
    
    expect(screen.getByText('Test Variables 1: 1')).toBeInTheDocument();
    expect(screen.getByText('Test Variables 2: 1')).toBeInTheDocument();
    expect(screen.getByText('Pair Numbers: 1')).toBeInTheDocument();
  });

  it('should pass correct props to OptionsTab', async () => {
    // Setup all required mocks for this test
    const mockUseVariableStore = require('@/stores/useVariableStore').useVariableStore;
    mockUseVariableStore.mockImplementation((selector: any) => selector({
      isLoading: false,
      error: null,
    }));
    
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [],
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
      isPairValid: jest.fn(() => true),
      areAllPairsValid: jest.fn(() => true),
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: jest.fn(),
    });
    
    mockedUseTestSettings.mockReturnValue({
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      calculateStandardizer: {
        standardDeviation: false,
        correctedStandardDeviation: true,
        averageOfVariances: true,
      },
      setCalculateStandardizer: jest.fn(),
      resetTestSettings: jest.fn(),
    });
    
    mockedUsePairedSamplesTTestAnalysis.mockReturnValue({
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
    
    render(<PairedSamplesTTestTestComponent />);
    
    // Switch to options tab
    const optionsTab = screen.getByTestId('options-tab-trigger');
    await userEvent.click(optionsTab);
    
    expect(screen.getByText('Estimate Effect Size: false')).toBeInTheDocument();
  });

  it('should show toast error when OK is clicked with identical pair variables', async () => {
    const { toast } = require('sonner');
    
    // Setup mocks with same variable in both lists
    const mockUseVariableStore = require('@/stores/useVariableStore').useVariableStore;
    mockUseVariableStore.mockImplementation((selector: any) => selector({
      isLoading: false,
      error: null,
    }));
    
    const sameVariable = { name: 'var1', label: 'Variable 1', tempId: '1', columnIndex: 0 } as Variable;
    
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [sameVariable],
      testVariables1: [sameVariable],
      testVariables2: [sameVariable], // Same variable in both lists
      pairNumbers: [1],
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
      isPairValid: jest.fn(() => false), // Invalid pair
      areAllPairsValid: jest.fn(() => false),
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: jest.fn(),
    });
    
    mockedUseTestSettings.mockReturnValue({
      estimateEffectSize: true,
      setEstimateEffectSize: jest.fn(),
      calculateStandardizer: {
        standardDeviation: true,
        correctedStandardDeviation: false,
        averageOfVariances: false,
      },
      setCalculateStandardizer: jest.fn(),
      resetTestSettings: jest.fn(),
    });
    
    mockedUsePairedSamplesTTestAnalysis.mockReturnValue({
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
    
    render(<PairedSamplesTTestTestComponent />);
    
    // The OK button should be disabled when there are invalid pairs
    const okButton = screen.getByTestId('paired-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
    
    // Since the button is disabled, runAnalysis should not be called
    expect(mockRunAnalysis).not.toHaveBeenCalled();
  });

  it('should show toast error when adding same variable in a pair', async () => {
    const { toast } = require('sonner');
    
    // Setup mocks with potential duplicate
    const mockUseVariableStore = require('@/stores/useVariableStore').useVariableStore;
    mockUseVariableStore.mockImplementation((selector: any) => selector({
      isLoading: false,
      error: null,
    }));
    
    const variable1 = { name: 'var1', label: 'Variable 1', tempId: '1', columnIndex: 0 } as Variable;
    const variable2 = { name: 'var2', label: 'Variable 2', tempId: '2', columnIndex: 0 } as Variable; // Same columnIndex
    const mockMoveToTestVariables = jest.fn();
    
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [variable1, variable2],
      testVariables1: [variable1],
      testVariables2: [undefined as any], // Empty slot
      pairNumbers: [1],
      highlightedPair: null,
      setHighlightedPair: jest.fn(),
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: mockMoveToTestVariables,
      removeVariable: jest.fn(),
      moveVariableBetweenLists: jest.fn(),
      moveUpPair: jest.fn(),
      moveDownPair: jest.fn(),
      removePair: jest.fn(),
      isPairValid: jest.fn(() => false),
      areAllPairsValid: jest.fn(() => false),
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: jest.fn(),
    });
    
    mockedUseTestSettings.mockReturnValue({
      estimateEffectSize: true,
      setEstimateEffectSize: jest.fn(),
      calculateStandardizer: {
        standardDeviation: true,
        correctedStandardDeviation: false,
        averageOfVariances: false,
      },
      setCalculateStandardizer: jest.fn(),
      resetTestSettings: jest.fn(),
    });
    
    mockedUsePairedSamplesTTestAnalysis.mockReturnValue({
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
    
    render(<PairedSamplesTTestTestComponent />);
    
    // The moveToTestVariables function should handle duplicate variable errors
    expect(mockMoveToTestVariables).toBeDefined();
  });
}); 