import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OneWayAnova from '../index';
import {
  useVariableSelection,
  useTestSettings,
  useOneWayAnovaAnalysis,
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
    factorVariable,
    estimateEffectSize,
    setEstimateEffectSize,
    highlightedVariable,
    setHighlightedVariable,
    moveToAvailableVariables,
    moveToTestVariables,
    moveToFactorVariable,
    reorderVariables,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    availableVariables: Variable[], 
    testVariables: Variable[],
    factorVariable: Variable | null,
    estimateEffectSize: boolean,
    setEstimateEffectSize: any,
    highlightedVariable: any,
    setHighlightedVariable: any,
    moveToAvailableVariables: any,
    moveToTestVariables: any,
    moveToFactorVariable: any,
    reorderVariables: any,
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="variables-tab">
      <div>Variables: {availableVariables.length}</div>
      <div>Test Variables: {testVariables.length}</div>
      <div>Factor Variable: {factorVariable ? 'Yes' : 'No'}</div>
      <div>Estimate Effect Size: {String(estimateEffectSize)}</div>
      <div>Tour Active: {String(tourActive)}</div>
      <div>Current Step: {currentStep}</div>
      <div>Tour Steps: {tourSteps?.length || 0}</div>
    </div>
  ),
}));

jest.mock('../components/PostHocTab', () => ({
  __esModule: true,
  default: ({ 
    equalVariancesAssumed,
    setEqualVariancesAssumed,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    equalVariancesAssumed: any,
    setEqualVariancesAssumed: any,
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="post-hoc-tab">
      <div>Tukey: {String(equalVariancesAssumed.tukey)}</div>
      <div>Duncan: {String(equalVariancesAssumed.duncan)}</div>
      <div>Tour Active: {String(tourActive)}</div>
      <div>Current Step: {currentStep}</div>
      <div>Tour Steps: {tourSteps?.length || 0}</div>
    </div>
  ),
}));

jest.mock('../components/OptionsTab', () => ({
  __esModule: true,
  default: ({ 
    statisticsOptions,
    setStatisticsOptions,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    statisticsOptions: any,
    setStatisticsOptions: any,
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="options-tab">
      <div>Descriptive: {String(statisticsOptions.descriptive)}</div>
      <div>Homogeneity of Variance: {String(statisticsOptions.homogeneityOfVariance)}</div>
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
const mockedUseOneWayAnovaAnalysis = useOneWayAnovaAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;

describe('OneWayAnova Modal', () => {
  const mockRunAnalysis = jest.fn();
  const mockCancelAnalysis = jest.fn();
  const mockResetVariableSelection = jest.fn();
  const mockResetTestSettings = jest.fn();
  const mockStartTour = jest.fn();
  const mockOnClose = jest.fn();

  // Helper to set up mock implementations
  const setupMocks = (testVariables: any[] = [], factorVariable: any = null, isCalculating = false) => {
    mockedUseVariableSelection.mockReturnValue({
      testVariables,
      factorVariable,
      resetVariableSelection: mockResetVariableSelection,
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToFactorVariable: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseTestSettings.mockReturnValue({
      estimateEffectSize: true,
      setEstimateEffectSize: jest.fn(),
      equalVariancesAssumed: { tukey: true, duncan: false },
      setEqualVariancesAssumed: jest.fn(),
      statisticsOptions: { descriptive: true, homogeneityOfVariance: true },
      setStatisticsOptions: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    mockedUseOneWayAnovaAnalysis.mockReturnValue({
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
  
  const OneWayAnovaTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
    <OneWayAnova onClose={mockOnClose} containerType="sidebar" {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with Variables tab', () => {
    setupMocks();
    render(<OneWayAnovaTestComponent />);
    
    // Check that the Variables tab is rendered
    expect(screen.getByTestId('variables-tab')).toBeVisible();
  });

  it('should disable the OK button when no test variables are selected', () => {
    setupMocks([]);
    render(<OneWayAnovaTestComponent />);
    
    const okButton = screen.getByTestId('one-way-anova-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when no factor variable is selected', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], null);
    render(<OneWayAnovaTestComponent />);
    
    const okButton = screen.getByTestId('one-way-anova-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should enable the OK button when at least one test variable and factor variable are selected', () => {
    setupMocks(
      [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      { name: 'Factor', tempId: '2', columnIndex: 1 }
    );
    render(<OneWayAnovaTestComponent />);
    
    const okButton = screen.getByTestId('one-way-anova-ok-button');
    expect(okButton).toBeEnabled();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    setupMocks(
      [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      { name: 'Factor', tempId: '2', columnIndex: 1 }
    );
    render(<OneWayAnovaTestComponent />);
    
    const okButton = screen.getByTestId('one-way-anova-ok-button');
    await userEvent.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    setupMocks();
    render(<OneWayAnovaTestComponent />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call reset functions when Reset button is clicked', async () => {
    setupMocks();
    render(<OneWayAnovaTestComponent />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    expect(mockResetVariableSelection).toHaveBeenCalledTimes(1);
    expect(mockResetTestSettings).toHaveBeenCalledTimes(1);
    expect(mockCancelAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call startTour when the help button is clicked', async () => {
    setupMocks();
    render(<OneWayAnovaTestComponent />);
    
    const helpButton = screen.getByTestId('help-circle-icon').closest('button');
    if (helpButton) {
      await userEvent.click(helpButton);
      expect(mockStartTour).toHaveBeenCalledTimes(1);
    }
  });

  it('should display loading text and disable buttons when analysis is in progress', () => {
    setupMocks(
      [{ name: 'Var1', tempId: '1', columnIndex: 0 }],
      { name: 'Factor', tempId: '2', columnIndex: 1 },
      true
    );
    render(<OneWayAnovaTestComponent />);
    
    const okButton = screen.getByTestId('one-way-anova-ok-button');
    expect(okButton).toHaveTextContent('Processing...');
    expect(okButton).toBeDisabled();
    
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('passes tour props to VariablesTab', () => {
    // Setup mock with tourActive = true
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [],
      factorVariable: null,
      resetVariableSelection: jest.fn(),
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToFactorVariable: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseTestSettings.mockReturnValue({
      estimateEffectSize: true,
      setEstimateEffectSize: jest.fn(),
      equalVariancesAssumed: { tukey: true, duncan: false },
      setEqualVariancesAssumed: jest.fn(),
      statisticsOptions: { descriptive: true, homogeneityOfVariance: true },
      setStatisticsOptions: jest.fn(),
      resetTestSettings: jest.fn(),
    });
    mockedUseOneWayAnovaAnalysis.mockReturnValue({
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
    
    render(<OneWayAnovaTestComponent />);
    
    // Verify tour props are passed to VariablesTab
    const variablesTab = screen.getByTestId('variables-tab');
    expect(variablesTab).toHaveTextContent('Tour Active: true');
    expect(variablesTab).toHaveTextContent('Current Step: 2');
    expect(variablesTab).toHaveTextContent(`Tour Steps: ${baseTourSteps.length}`);
  });
}); 