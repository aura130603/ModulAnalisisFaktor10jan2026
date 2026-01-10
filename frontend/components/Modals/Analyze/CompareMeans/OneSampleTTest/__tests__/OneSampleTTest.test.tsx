import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OneSampleTTest from '../index';
import {
  useVariableSelection,
  useTestSettings,
  useOneSampleTTestAnalysis,
  useTourGuide,
} from '../hooks';
import { BaseModalProps } from '@/types/modalTypes';
import { baseTourSteps } from '../hooks/tourConfig';
import { Variable } from '@/types/Variable';
import { TourStep } from '../types';

// Mock the custom hooks module
jest.mock('../hooks');

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

// Mock help button to make it easier to find in tests
jest.mock('@/components/ui/button', () => {
  const actual = jest.requireActual('@/components/ui/button');
  return {
    ...actual,
    IconButton: ({ onClick, icon }: { onClick: () => void; icon: string }) => (
      <button onClick={onClick} data-testid={`icon-button-${icon}`}>
        {icon === 'HelpCircle' ? 'Start Feature Tour' : icon}
      </button>
    ),
  };
});

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
const mockedUseOneSampleTTestAnalysis = useOneSampleTTestAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;

describe('OneSampleTTest Modal', () => {
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
      resetVariableSelection: mockResetVariableSelection,
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseTestSettings.mockReturnValue({
      testValue: 0,
      setTestValue: jest.fn(),
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      resetTestSettings: mockResetTestSettings,
    });
    mockedUseOneSampleTTestAnalysis.mockReturnValue({
      isCalculating,
      errorMsg: null,
      runAnalysis: mockRunAnalysis,
      cancelAnalysis: mockCancelAnalysis,
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
  
  const OneSampleTTestTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
        <OneSampleTTest onClose={mockOnClose} containerType="sidebar" {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with Variables tab', () => {
    setupMocks();
    render(<OneSampleTTestTestComponent />);
    
    // Check that the Variables tab is rendered
    expect(screen.getByTestId('variables-tab')).toBeVisible();
  });

  it('should disable the OK button when no variables are selected', () => {
    setupMocks([]);
    render(<OneSampleTTestTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('should enable the OK button when at least one variable is selected', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }]);
    render(<OneSampleTTestTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeEnabled();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }]);
    render(<OneSampleTTestTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    await userEvent.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    setupMocks();
    render(<OneSampleTTestTestComponent />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call reset functions when Reset button is clicked', async () => {
    setupMocks();
    render(<OneSampleTTestTestComponent />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    expect(mockResetVariableSelection).toHaveBeenCalledTimes(1);
    expect(mockResetTestSettings).toHaveBeenCalledTimes(1);
    expect(mockCancelAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call startTour when the help button is clicked', async () => {
    setupMocks();
    render(<OneSampleTTestTestComponent />);
    
    const helpButton = screen.getByRole('button', { name: /start feature tour/i });
    await userEvent.click(helpButton);
    
    expect(mockStartTour).toHaveBeenCalledTimes(1);
  });

  it('should display loading text and disable buttons when analysis is in progress', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], true);
    render(<OneSampleTTestTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /processing.../i });
    expect(okButton).toBeInTheDocument();
    expect(okButton).toBeDisabled();
    
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('passes tour props to VariablesTab', () => {
    // Setup mock with tourActive = true
    mockedUseVariableSelection.mockReturnValue({
      testVariables: [],
      resetVariableSelection: jest.fn(),
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseTestSettings.mockReturnValue({
      testValue: 0,
      setTestValue: jest.fn(),
      estimateEffectSize: false,
      setEstimateEffectSize: jest.fn(),
      resetTestSettings: jest.fn(),
    });
    mockedUseOneSampleTTestAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelAnalysis: jest.fn(),
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
    
    render(<OneSampleTTestTestComponent />);
    
    // Verify tour props are passed to VariablesTab
    const variablesTab = screen.getByTestId('variables-tab');
    expect(variablesTab).toHaveTextContent('Tour Active: true');
    expect(variablesTab).toHaveTextContent('Current Step: 2');
    expect(variablesTab).toHaveTextContent(`Tour Steps: ${baseTourSteps.length}`);
  });
}); 