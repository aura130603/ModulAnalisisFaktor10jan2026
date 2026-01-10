import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Descriptives from '../index';
import {
  useVariableSelection,
  useStatisticsSettings,
  useDescriptivesAnalysis,
  useTourGuide,
} from '../hooks';
import { BaseModalProps } from '@/types/modalTypes';

// Mock the custom hooks module
jest.mock('../hooks');

// Mock child components
jest.mock('../components/VariablesTab', () => ({
  __esModule: true,
  default: () => <div data-testid="variables-tab">VariablesTab</div>,
}));

jest.mock('../components/StatisticsTab', () => ({
  __esModule: true,
  default: () => <div data-testid="statistics-tab">StatisticsTab</div>,
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
const mockedUseStatisticsSettings = useStatisticsSettings as jest.Mock;
const mockedUseDescriptivesAnalysis = useDescriptivesAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;

describe('Descriptives Modal', () => {
  const mockRunAnalysis = jest.fn();
  const mockCancelCalculation = jest.fn();
  const mockResetVariableSelection = jest.fn();
  const mockResetStatisticsSettings = jest.fn();
  const mockStartTour = jest.fn();
  const mockOnClose = jest.fn();

  // Helper to set up mock implementations
  const setupMocks = (selectedVariables: any[] = [], isCalculating = false) => {
    mockedUseVariableSelection.mockReturnValue({
      selectedVariables,
      resetVariableSelection: mockResetVariableSelection,
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToSelectedVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseStatisticsSettings.mockReturnValue({
      displayStatistics: {},
      updateStatistic: jest.fn(),
      displayOrder: 'variableList',
      setDisplayOrder: jest.fn(),
      saveStandardized: false,
      setSaveStandardized: jest.fn(),
      resetStatisticsSettings: mockResetStatisticsSettings,
    });
    mockedUseDescriptivesAnalysis.mockReturnValue({
      isCalculating,
      errorMsg: null,
      runAnalysis: mockRunAnalysis,
      cancelCalculation: mockCancelCalculation,
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: false,
      currentStep: 0,
      tourSteps: [],
      currentTargetElement: null,
      startTour: mockStartTour,
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
  };
  
  const DescriptivesTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
        <Descriptives onClose={mockOnClose} containerType="sidebar" {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with title and tabs, with Variables tab active by default', () => {
    setupMocks();
    render(<DescriptivesTestComponent />);
    
    // Title header is not rendered in sidebar container type
    expect(screen.getByRole('tab', { name: /Variables/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Statistics/i })).toBeInTheDocument();

    expect(screen.getByTestId('variables-tab')).toBeVisible();
    expect(screen.queryByTestId('statistics-tab')).toBeNull();
  });

  it('should disable the OK button when no variables are selected', () => {
    setupMocks([]);
    render(<DescriptivesTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('should enable the OK button when at least one variable is selected', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }]);
    render(<DescriptivesTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeEnabled();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }]);
    render(<DescriptivesTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    await userEvent.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    setupMocks();
    render(<DescriptivesTestComponent />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call reset functions when Reset button is clicked', async () => {
    setupMocks();
    render(<DescriptivesTestComponent />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    expect(mockResetVariableSelection).toHaveBeenCalledTimes(1);
    expect(mockResetStatisticsSettings).toHaveBeenCalledTimes(1);
    expect(mockCancelCalculation).toHaveBeenCalledTimes(1);
  });

  it('should switch to Statistics tab correctly when tab trigger is clicked', async () => {
    setupMocks();
    render(<DescriptivesTestComponent />);
    const user = userEvent.setup();
    
    await user.click(screen.getByRole('tab', { name: /statistics/i }));
    expect(screen.getByTestId('statistics-tab')).toBeVisible();
    expect(screen.queryByTestId('variables-tab')).toBeNull();
  });

  it('should call startTour when the help button is clicked', async () => {
    setupMocks();
    render(<DescriptivesTestComponent />);
    
    const helpButton = screen.getByRole('button', { name: /start feature tour/i });
    await userEvent.click(helpButton);
    
    expect(mockStartTour).toHaveBeenCalledTimes(1);
  });

  it('should display loading text and disable buttons when analysis is in progress', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], true);
    render(<DescriptivesTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /processing.../i });
    expect(okButton).toBeInTheDocument();
    expect(okButton).toBeDisabled();
    
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
