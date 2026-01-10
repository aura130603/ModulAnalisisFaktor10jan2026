import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TwoRelatedSamples from '../index';
import {
  useVariableSelection,
  useTestSettings,
  useTwoRelatedSamplesAnalysis,
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
    testVariables1,
    testVariables2,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    availableVariables: Variable[], 
    testVariables1: Variable[],
    testVariables2: Variable[],
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="variables-tab">
      <div>Variables: {availableVariables.length}</div>
      <div>Test Variables 1: {testVariables1.length}</div>
      <div>Test Variables 2: {testVariables2.length}</div>
      <div>Tour Active: {String(tourActive)}</div>
      <div>Current Step: {currentStep}</div>
      <div>Tour Steps: {tourSteps?.length || 0}</div>
    </div>
  ),
}));

jest.mock('../components/OptionsTab', () => ({
  __esModule: true,
  default: ({ 
    displayStatistics,
    testType,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    displayStatistics: any,
    testType: any,
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="options-tab">
      <div>Display Statistics: {String(displayStatistics)}</div>
      <div>Test Type: {JSON.stringify(testType)}</div>
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
      className={className}
      data-testid={id || 'button'}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/dialog', () => ({
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>{children}</div>
  ),
  DialogHeader: ({ children, className }: any) => (
    <div data-testid="dialog-header" className={className}>{children}</div>
  ),
  DialogTitle: ({ children, className }: any) => (
    <div data-testid="dialog-title" className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div data-testid="tabs-list" className={className}>{children}</div>
  ),
  TabsTrigger: ({ children, value, onClick, className }: any) => (
    <button 
      data-testid={`tab-trigger-${value}`} 
      onClick={onClick} 
      className={className}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div data-testid={`tab-content-${value}`} className={className}>{children}</div>
  ),
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock result store
jest.mock('@/stores/useResultStore', () => ({
  useResultStore: jest.fn(() => ({
    addResult: jest.fn(),
    updateResult: jest.fn(),
  })),
}));

// Mock worker client
jest.mock('@/utils/workerClient', () => ({
  createWorker: jest.fn(() => ({
    postMessage: jest.fn(),
    terminate: jest.fn(),
  })),
}));

// Get mocked hooks
const mockedUseVariableSelection = useVariableSelection as jest.MockedFunction<typeof useVariableSelection>;
const mockedUseTestSettings = useTestSettings as jest.MockedFunction<typeof useTestSettings>;
const mockedUseTwoRelatedSamplesAnalysis = useTwoRelatedSamplesAnalysis as jest.MockedFunction<typeof useTwoRelatedSamplesAnalysis>;
const mockedUseTourGuide = useTourGuide as jest.MockedFunction<typeof useTourGuide>;

describe('Two Related Samples Component', () => {
  const mockOnClose = jest.fn();
  const mockRunAnalysis = jest.fn();
  const mockCancelAnalysis = jest.fn();
  const mockStartTour = jest.fn();
  const mockResetVariableSelection = jest.fn();
  const mockResetTestSettings = jest.fn();

  const setupMocks = (testVariables1: any[] = [], testVariables2: any[] = [], isCalculating = false) => {
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [],
      testVariables1,
      testVariables2,
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
      areAllPairsValid: jest.fn(() => testVariables1.length > 0 && testVariables2.length > 0 && testVariables1.length === testVariables2.length),
      hasDuplicatePairs: jest.fn(() => false),
      reorderPairs: jest.fn(),
      resetVariableSelection: mockResetVariableSelection,
    });
    mockedUseTestSettings.mockReturnValue({
      testType: { 
        wilcoxon: true, 
        sign: false,
        mcNemar: false,
        marginalHomogeneity: false
      },
      setTestType: jest.fn(),
      displayStatistics: {
        descriptive: true,
        quartiles: false
      },
      setDisplayStatistics: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    mockedUseTwoRelatedSamplesAnalysis.mockReturnValue({
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
  
  const TwoRelatedSamplesTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
    <TwoRelatedSamples onClose={mockOnClose} containerType="sidebar" {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with Variables tab', () => {
    setupMocks();
    render(<TwoRelatedSamplesTestComponent />);
    
    // Check that the Variables tab is rendered
    expect(screen.getByTestId('variables-tab')).toBeVisible();
  });

  it('should disable the OK button when no test variables are selected', () => {
    setupMocks([], []);
    render(<TwoRelatedSamplesTestComponent />);
    
    const okButton = screen.getByTestId('two-related-samples-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when test variables are not paired', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], []);
    render(<TwoRelatedSamplesTestComponent />);
    
    const okButton = screen.getByTestId('two-related-samples-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when no test type is selected', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], [{ name: 'Var2', tempId: '2', columnIndex: 1 }]);
    mockedUseTestSettings.mockReturnValue({
      testType: { 
        wilcoxon: false, 
        sign: false,
        mcNemar: false,
        marginalHomogeneity: false
      },
      setTestType: jest.fn(),
      displayStatistics: {
        descriptive: true,
        quartiles: false
      },
      setDisplayStatistics: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    render(<TwoRelatedSamplesTestComponent />);
    
    const okButton = screen.getByTestId('two-related-samples-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should enable the OK button when all requirements are met', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], [{ name: 'Var2', tempId: '2', columnIndex: 1 }]);
    render(<TwoRelatedSamplesTestComponent />);
    
    const okButton = screen.getByTestId('two-related-samples-ok-button');
    expect(okButton).not.toBeDisabled();
  });

  it('should show loading state when calculating', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], [{ name: 'Var2', tempId: '2', columnIndex: 1 }], true);
    render(<TwoRelatedSamplesTestComponent />);
    
    expect(screen.getByText('Processing...')).toBeVisible();
    expect(screen.getByText('Cancel')).toBeVisible();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    const user = userEvent.setup();
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], [{ name: 'Var2', tempId: '2', columnIndex: 1 }]);
    render(<TwoRelatedSamplesTestComponent />);
    
    const okButton = screen.getByTestId('two-related-samples-ok-button');
    await user.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalled();
  });

  it('should call handleReset when Reset button is clicked', async () => {
    const user = userEvent.setup();
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], [{ name: 'Var2', tempId: '2', columnIndex: 1 }]);
    render(<TwoRelatedSamplesTestComponent />);
    
    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);
    
    expect(mockResetVariableSelection).toHaveBeenCalled();
    expect(mockResetTestSettings).toHaveBeenCalled();
    expect(mockCancelAnalysis).toHaveBeenCalled();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TwoRelatedSamplesTestComponent />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should start tour when Help button is clicked', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TwoRelatedSamplesTestComponent />);
    
    const helpButton = screen.getByTestId('help-circle-icon').closest('button');
    if (helpButton) {
      await user.click(helpButton);
      expect(mockStartTour).toHaveBeenCalled();
    }
  });

  it('should switch between Variables and Options tabs', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TwoRelatedSamplesTestComponent />);
    
    // Initially Variables tab should be active
    expect(screen.getByTestId('variables-tab')).toBeVisible();
    
    // Click on Options tab
    const optionsTab = screen.getByTestId('tab-trigger-options');
    await user.click(optionsTab);
    
    // Options tab should now be visible
    expect(screen.getByTestId('options-tab')).toBeVisible();
  });

  it('should display error message when analysis fails', () => {
    mockedUseTwoRelatedSamplesAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: 'Analysis failed',
      runAnalysis: mockRunAnalysis,
      cancelCalculation: mockCancelAnalysis,
    });
    
    render(<TwoRelatedSamplesTestComponent />);
    
    expect(screen.getByText('Analysis failed')).toBeVisible();
  });

  it('should show tour popup when tour is active', () => {
    mockedUseTourGuide.mockReturnValue({
      tourActive: true,
      currentStep: 0,
      tourSteps: baseTourSteps,
      currentTargetElement: null,
      startTour: mockStartTour,
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
    
    render(<TwoRelatedSamplesTestComponent />);
    
    expect(screen.getByTestId('tour-popup')).toBeVisible();
  });

  it('should show loading state when variables are loading', () => {
    // Mock useVariableStore to return loading state
    const mockUseVariableStore = require('@/stores/useVariableStore').useVariableStore;
    mockUseVariableStore.mockImplementation((selector: any) => selector({
      isLoading: true,
      error: null,
    }));
    
    setupMocks();
    render(<TwoRelatedSamplesTestComponent />);
    
    expect(screen.getByText('Loading variables...')).toBeVisible();
  });

  it('should show error state when variables fail to load', () => {
    // Mock useVariableStore to return error state
    const mockUseVariableStore = require('@/stores/useVariableStore').useVariableStore;
    mockUseVariableStore.mockImplementation((selector: any) => selector({
      isLoading: false,
      error: { message: 'Failed to load variables' },
    }));
    
    setupMocks();
    render(<TwoRelatedSamplesTestComponent />);
    
    expect(screen.getByText('Error loading variables:')).toBeVisible();
    expect(screen.getByText('Failed to load variables')).toBeVisible();
  });

  it('should handle different test types', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], [{ name: 'Var2', tempId: '2', columnIndex: 1 }]);
    mockedUseTestSettings.mockReturnValue({
      testType: { 
        wilcoxon: false, 
        sign: true,
        mcNemar: false,
        marginalHomogeneity: false
      },
      setTestType: jest.fn(),
      displayStatistics: {
        descriptive: true,
        quartiles: false
      },
      setDisplayStatistics: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    render(<TwoRelatedSamplesTestComponent />);
    
    const okButton = screen.getByTestId('two-related-samples-ok-button');
    expect(okButton).not.toBeDisabled();
  });
});
