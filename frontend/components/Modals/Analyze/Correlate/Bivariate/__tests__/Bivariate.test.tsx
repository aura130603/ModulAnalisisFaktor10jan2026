import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Bivariate from '../index';
import {
  useVariableSelection,
  useTestSettings,
  useBivariateAnalysis,
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

// Mock child components
jest.mock('../components/VariablesTab', () => ({
  __esModule: true,
  default: ({ 
    availableVariables, 
    testVariables,
    tourActive,
    currentStep,
    tourSteps
  }: { 
    availableVariables: Variable[], 
    testVariables: Variable[],
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="variables-tab">
      <div>Variables: {availableVariables.length}</div>
      <div>Test Variables: {testVariables.length}</div>
      <div>Tour Active: {String(tourActive)}</div>
      <div>Current Step: {currentStep}</div>
      <div>Tour Steps: {tourSteps?.length || 0}</div>
    </div>
  ),
}));

jest.mock('../components/OptionsTab', () => ({
  __esModule: true,
  default: ({ 
    tourActive,
    currentStep,
    tourSteps
  }: { 
    tourActive?: boolean,
    currentStep?: number,
    tourSteps?: TourStep[]
  }) => (
    <div data-testid="options-tab">
      <div>Options Tab</div>
      <div>Tour Active: {String(tourActive)}</div>
      <div>Current Step: {currentStep}</div>
      <div>Tour Steps: {tourSteps?.length || 0}</div>
    </div>
  ),
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
const mockedUseBivariateAnalysis = useBivariateAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;

describe('Bivariate Correlation Modal', () => {
  const mockRunAnalysis = jest.fn();
  const mockCancelAnalysis = jest.fn();
  const mockResetVariableSelection = jest.fn();
  const mockResetTestSettings = jest.fn();
  const mockStartTour = jest.fn();
  const mockOnClose = jest.fn();

  // Helper to set up mock implementations
  const setupMocks = (testVariables: any[] = [], isCalculating = false) => {
    mockedUseVariableSelection.mockReturnValue({
      testVariables,
      controlVariables: [],
      resetVariableSelection: mockResetVariableSelection,
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToKendallsTauBControlVariables: jest.fn(),
      moveToKendallsTauBAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseTestSettings.mockReturnValue({
      correlationCoefficient: {
        pearson: true,
        kendallsTauB: false,
        spearman: false
      },
      setCorrelationCoefficient: jest.fn(),
      testOfSignificance: {
        oneTailed: false,
        twoTailed: true
      },
      setTestOfSignificance: jest.fn(),
      flagSignificantCorrelations: false,
      setFlagSignificantCorrelations: jest.fn(),
      showOnlyTheLowerTriangle: false,
      setShowOnlyTheLowerTriangle: jest.fn(),
      showDiagonal: true,
      setShowDiagonal: jest.fn(),
      partialCorrelationKendallsTauB: false,
      setPartialCorrelationKendallsTauB: jest.fn(),
      statisticsOptions: {
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: false
      },
      setStatisticsOptions: jest.fn(),
      missingValuesOptions: {
        excludeCasesPairwise: true,
        excludeCasesListwise: false
      },
      setMissingValuesOptions: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    mockedUseBivariateAnalysis.mockReturnValue({
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
  
  const BivariateTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
        <Bivariate onClose={mockOnClose} containerType="sidebar" {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with Variables tab', () => {
    setupMocks();
    render(<BivariateTestComponent />);
    
    // Check that the Variables tab is rendered
    expect(screen.getByTestId('variables-tab')).toBeVisible();
  });



  it('should disable the OK button when no variables are selected', () => {
    setupMocks([]);
    render(<BivariateTestComponent />);
    
    const okButton = screen.getByTestId('bivariate-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when only one variable is selected', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }]);
    render(<BivariateTestComponent />);
    
    const okButton = screen.getByTestId('bivariate-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when no correlation coefficients are selected', () => {
    // Set up mocks with no correlation coefficients selected
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [
        { name: 'Var1', tempId: '1', columnIndex: 0 },
        { name: 'Var2', tempId: '2', columnIndex: 1 }
      ],
      controlVariables: [],
      resetVariableSelection: mockResetVariableSelection,
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToKendallsTauBControlVariables: jest.fn(),
      moveToKendallsTauBAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
    });
    
    mockedUseTestSettings.mockReturnValue({
      correlationCoefficient: {
        pearson: false,
        kendallsTauB: false,
        spearman: false
      },
      setCorrelationCoefficient: jest.fn(),
      testOfSignificance: {
        oneTailed: false,
        twoTailed: true
      },
      setTestOfSignificance: jest.fn(),
      flagSignificantCorrelations: false,
      setFlagSignificantCorrelations: jest.fn(),
      showOnlyTheLowerTriangle: false,
      setShowOnlyTheLowerTriangle: jest.fn(),
      showDiagonal: true,
      setShowDiagonal: jest.fn(),
      partialCorrelationKendallsTauB: false,
      setPartialCorrelationKendallsTauB: jest.fn(),
      statisticsOptions: {
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: false
      },
      setStatisticsOptions: jest.fn(),
      missingValuesOptions: {
        excludeCasesPairwise: true,
        excludeCasesListwise: false
      },
      setMissingValuesOptions: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    
    mockedUseBivariateAnalysis.mockReturnValue({
      isCalculating: false,
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
    
    render(<BivariateTestComponent />);
    
    const okButton = screen.getByTestId('bivariate-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should disable the OK button when partial correlation is enabled with listwise missing values but no control variables', () => {
    // Set up mocks with partial correlation enabled, listwise missing values, but no control variables
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [
        { name: 'Var1', tempId: '1', columnIndex: 0 },
        { name: 'Var2', tempId: '2', columnIndex: 1 }
      ],
      controlVariables: [], // No control variables
      resetVariableSelection: mockResetVariableSelection,
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToKendallsTauBControlVariables: jest.fn(),
      moveToKendallsTauBAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
    });
    
    mockedUseTestSettings.mockReturnValue({
      correlationCoefficient: {
        pearson: true,
        kendallsTauB: false,
        spearman: false
      },
      setCorrelationCoefficient: jest.fn(),
      testOfSignificance: {
        oneTailed: false,
        twoTailed: true
      },
      setTestOfSignificance: jest.fn(),
      flagSignificantCorrelations: false,
      setFlagSignificantCorrelations: jest.fn(),
      showOnlyTheLowerTriangle: false,
      setShowOnlyTheLowerTriangle: jest.fn(),
      showDiagonal: true,
      setShowDiagonal: jest.fn(),
      partialCorrelationKendallsTauB: true, // Partial correlation enabled
      setPartialCorrelationKendallsTauB: jest.fn(),
      statisticsOptions: {
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: false
      },
      setStatisticsOptions: jest.fn(),
      missingValuesOptions: {
        excludeCasesPairwise: false,
        excludeCasesListwise: true // Listwise missing values
      },
      setMissingValuesOptions: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    
    mockedUseBivariateAnalysis.mockReturnValue({
      isCalculating: false,
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
    
    render(<BivariateTestComponent />);
    
    const okButton = screen.getByTestId('bivariate-ok-button');
    expect(okButton).toBeDisabled();
  });

  it('should enable the OK button when at least two variables are selected', () => {
    setupMocks([
      { name: 'Var1', tempId: '1', columnIndex: 0 },
      { name: 'Var2', tempId: '2', columnIndex: 1 }
    ]);
    render(<BivariateTestComponent />);
    
    const okButton = screen.getByTestId('bivariate-ok-button');
    expect(okButton).toBeEnabled();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    setupMocks([
      { name: 'Var1', tempId: '1', columnIndex: 0 },
      { name: 'Var2', tempId: '2', columnIndex: 1 }
    ]);
    render(<BivariateTestComponent />);
    
    const okButton = screen.getByTestId('bivariate-ok-button');
    await userEvent.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    setupMocks();
    render(<BivariateTestComponent />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call reset functions when Reset button is clicked', async () => {
    setupMocks();
    render(<BivariateTestComponent />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    expect(mockResetVariableSelection).toHaveBeenCalledTimes(1);
    expect(mockResetTestSettings).toHaveBeenCalledTimes(1);
    expect(mockCancelAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call startTour when the help button is clicked', async () => {
    setupMocks();
    render(<BivariateTestComponent />);
    
    const helpButton = screen.getByTestId('help-circle-icon').closest('button');
    if (helpButton) {
      await userEvent.click(helpButton);
      expect(mockStartTour).toHaveBeenCalledTimes(1);
    }
  });

  it('should display loading text and disable buttons when analysis is in progress', () => {
    setupMocks([
      { name: 'Var1', tempId: '1', columnIndex: 0 },
      { name: 'Var2', tempId: '2', columnIndex: 1 }
    ], true);
    render(<BivariateTestComponent />);
    
    const okButton = screen.getByTestId('bivariate-ok-button');
    expect(okButton).toHaveTextContent('Processing...');
    expect(okButton).toBeDisabled();
    
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('passes tour props to VariablesTab', () => {
    // Setup mock with tourActive = true
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [],
      controlVariables: [],
      resetVariableSelection: jest.fn(),
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      moveToKendallsTauBControlVariables: jest.fn(),
      moveToKendallsTauBAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseTestSettings.mockReturnValue({
      correlationCoefficient: {
        pearson: false,
        kendallsTauB: false,
        spearman: false
      },
      setCorrelationCoefficient: jest.fn(),
      testOfSignificance: {
        oneTailed: false,
        twoTailed: false
      },
      setTestOfSignificance: jest.fn(),
      flagSignificantCorrelations: false,
      setFlagSignificantCorrelations: jest.fn(),
      showOnlyTheLowerTriangle: false,
      setShowOnlyTheLowerTriangle: jest.fn(),
      showDiagonal: true,
      setShowDiagonal: jest.fn(),
      partialCorrelationKendallsTauB: false,
      setPartialCorrelationKendallsTauB: jest.fn(),
      statisticsOptions: {
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: false
      },
      setStatisticsOptions: jest.fn(),
      missingValuesOptions: {
        excludeCasesPairwise: false,
        excludeCasesListwise: false
      },
      setMissingValuesOptions: jest.fn(),
      resetTestSettings: jest.fn(),
    });
    mockedUseBivariateAnalysis.mockReturnValue({
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
    
    render(<BivariateTestComponent />);
    
    // Verify tour props are passed to VariablesTab
    const variablesTab = screen.getByTestId('variables-tab');
    expect(variablesTab).toHaveTextContent('Tour Active: true');
    expect(variablesTab).toHaveTextContent('Current Step: 2');
    expect(variablesTab).toHaveTextContent(`Tour Steps: ${baseTourSteps.length}`);
  });
}); 