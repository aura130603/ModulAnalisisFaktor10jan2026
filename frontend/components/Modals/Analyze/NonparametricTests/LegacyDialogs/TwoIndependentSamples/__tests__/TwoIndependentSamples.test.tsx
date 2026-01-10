import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TwoIndependentSamples from '../index';
import {
  useVariableSelection,
  useTestSettings,
  useTwoIndependentSamplesAnalysis,
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
    group1,
    group2,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    availableVariables: Variable[], 
    testVariables: Variable[],
    groupingVariable: Variable | null,
    group1: any,
    group2: any,
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="variables-tab">
      <div>Variables: {availableVariables.length}</div>
      <div>Test Variables: {testVariables.length}</div>
      <div>Grouping Variable: {groupingVariable ? 'Yes' : 'No'}</div>
      <div>Group 1: {group1}</div>
      <div>Group 2: {group2}</div>
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
const mockedUseTwoIndependentSamplesAnalysis = useTwoIndependentSamplesAnalysis as jest.MockedFunction<typeof useTwoIndependentSamplesAnalysis>;
const mockedUseTourGuide = useTourGuide as jest.MockedFunction<typeof useTourGuide>;

describe('Two Independent Samples Component', () => {
  const mockOnClose = jest.fn();
  const mockRunAnalysis = jest.fn();
  const mockCancelAnalysis = jest.fn();
  const mockStartTour = jest.fn();
  const mockResetVariableSelection = jest.fn();
  const mockResetTestSettings = jest.fn();

  const setupMocks = (testVariables: any[] = [], groupingVariable: any = null, isCalculating = false) => {
    mockedUseVariableSelection.mockReturnValue({
      availableVariables: [],
      testVariables,
      groupingVariable,
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToGroupingVariable: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
      resetVariableSelection: mockResetVariableSelection,
    });
    mockedUseTestSettings.mockReturnValue({
      group1: 1,
      setGroup1: jest.fn(),
      group2: 2,
      setGroup2: jest.fn(),
      testType: { 
        mannWhitneyU: true, 
        kolmogorovSmirnovZ: false,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      },
      setTestType: jest.fn(),
      displayStatistics: {
        descriptive: true,
        quartiles: false
      },
      setDisplayStatistics: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    mockedUseTwoIndependentSamplesAnalysis.mockReturnValue({
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
  
  const TwoIndependentSamplesTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
    <TwoIndependentSamples onClose={mockOnClose} containerType="sidebar" {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with Variables tab', () => {
    setupMocks();
    render(<TwoIndependentSamplesTestComponent />);
    
    // Check that the Variables tab is rendered
    expect(screen.getByTestId('variables-tab')).toBeVisible();
  });

  it('should disable the OK button when no test variables are selected', () => {
    setupMocks([]);
    render(<TwoIndependentSamplesTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when no grouping variable is selected', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], null);
    render(<TwoIndependentSamplesTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when groups are not defined', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], { name: 'GroupVar', tempId: '2', columnIndex: 1 });
    mockedUseTestSettings.mockReturnValue({
      group1: null,
      setGroup1: jest.fn(),
      group2: null,
      setGroup2: jest.fn(),
      testType: { 
        mannWhitneyU: true, 
        kolmogorovSmirnovZ: false,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      },
      setTestType: jest.fn(),
      displayStatistics: {
        descriptive: true,
        quartiles: false
      },
      setDisplayStatistics: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    render(<TwoIndependentSamplesTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when no test type is selected', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], { name: 'GroupVar', tempId: '2', columnIndex: 1 });
    mockedUseTestSettings.mockReturnValue({
      group1: 1,
      setGroup1: jest.fn(),
      group2: 2,
      setGroup2: jest.fn(),
      testType: { 
        mannWhitneyU: false, 
        kolmogorovSmirnovZ: false,
        mosesExtremeReactions: false,
        waldWolfowitzRuns: false
      },
      setTestType: jest.fn(),
      displayStatistics: {
        descriptive: true,
        quartiles: false
      },
      setDisplayStatistics: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    render(<TwoIndependentSamplesTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should enable the OK button when all requirements are met', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], { name: 'GroupVar', tempId: '2', columnIndex: 1 });
    render(<TwoIndependentSamplesTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    expect(okButton).not.toBeDisabled();
  });

  it('should show loading state when calculating', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], { name: 'GroupVar', tempId: '2', columnIndex: 1 }, true);
    render(<TwoIndependentSamplesTestComponent />);
    
    expect(screen.getByText('Processing...')).toBeVisible();
    expect(screen.getByText('Cancel')).toBeVisible();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    const user = userEvent.setup();
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], { name: 'GroupVar', tempId: '2', columnIndex: 1 });
    render(<TwoIndependentSamplesTestComponent />);
    
    const okButton = screen.getByTestId('independent-samples-t-test-ok-button');
    await user.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalled();
  });

  it('should call handleReset when Reset button is clicked', async () => {
    const user = userEvent.setup();
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], { name: 'GroupVar', tempId: '2', columnIndex: 1 });
    render(<TwoIndependentSamplesTestComponent />);
    
    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);
    
    expect(mockResetVariableSelection).toHaveBeenCalled();
    expect(mockResetTestSettings).toHaveBeenCalled();
    expect(mockCancelAnalysis).toHaveBeenCalled();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TwoIndependentSamplesTestComponent />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should start tour when Help button is clicked', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TwoIndependentSamplesTestComponent />);
    
    const helpButton = screen.getByTestId('help-circle-icon').closest('button');
    if (helpButton) {
      await user.click(helpButton);
      expect(mockStartTour).toHaveBeenCalled();
    }
  });

  it('should switch between Variables and Options tabs', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TwoIndependentSamplesTestComponent />);
    
    // Initially Variables tab should be active
    expect(screen.getByTestId('variables-tab')).toBeVisible();
    
    // Click on Options tab
    const optionsTab = screen.getByTestId('tab-trigger-options');
    await user.click(optionsTab);
    
    // Options tab should now be visible
    expect(screen.getByTestId('options-tab')).toBeVisible();
  });

  it('should display error message when analysis fails', () => {
    mockedUseTwoIndependentSamplesAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: 'Analysis failed',
      runAnalysis: mockRunAnalysis,
      cancelCalculation: mockCancelAnalysis,
    });
    
    render(<TwoIndependentSamplesTestComponent />);
    
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
    
    render(<TwoIndependentSamplesTestComponent />);
    
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
    render(<TwoIndependentSamplesTestComponent />);
    
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
    render(<TwoIndependentSamplesTestComponent />);
    
    expect(screen.getByText('Error loading variables:')).toBeVisible();
    expect(screen.getByText('Failed to load variables')).toBeVisible();
  });
}); 