import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Frequencies from '../index';
import {
  useVariableSelection,
  useStatisticsSettings,
  useChartsSettings,
  useDisplaySettings,
  useFrequenciesAnalysis,
  useTourGuide,
} from '../hooks';
import { BaseModalProps } from '@/types/modalTypes';

// Mock the custom hooks module
jest.mock('../hooks');

jest.mock('../VariablesTab', () => ({
  __esModule: true,
  default: () => <div data-testid="variables-tab">VariablesTab</div>,
}));

jest.mock('../StatisticsTab', () => ({
  __esModule: true,
  default: () => <div data-testid="statistics-tab">StatisticsTab</div>,
}));

jest.mock('../ChartsTab', () => ({
  __esModule: true,
  default: () => <div data-testid="charts-tab">ChartsTab</div>,
}));

// Type-safe casting for mocked hooks
const mockedUseVariableSelection = useVariableSelection as jest.Mock;
const mockedUseStatisticsSettings = useStatisticsSettings as jest.Mock;
const mockedUseChartsSettings = useChartsSettings as jest.Mock;
const mockedUseDisplaySettings = useDisplaySettings as jest.Mock;
const mockedUseFrequenciesAnalysis = useFrequenciesAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;

describe('Frequencies Modal', () => {
  const mockRunAnalysis = jest.fn();
  const mockCancelAnalysis = jest.fn();
  const mockResetVariableSelection = jest.fn();
  const mockResetStatisticsSettings = jest.fn();
  const mockResetChartsSettings = jest.fn();
  const mockResetDisplaySettings = jest.fn();
  const mockStartTour = jest.fn();
  const mockOnClose = jest.fn();

  // Helper to set up mock implementations
  const setupMocks = (selectedVariables: any[] = [], isCalculating = false) => {
    mockedUseVariableSelection.mockReturnValue({
      selectedVariables,
      resetVariableSelection: mockResetVariableSelection,
      // Provide other functions/state if needed by the component
      availableVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToSelectedVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
    });
    mockedUseStatisticsSettings.mockReturnValue({
      showStatistics: true,
      getCurrentStatisticsOptions: jest.fn().mockReturnValue({}),
      resetStatisticsSettings: mockResetStatisticsSettings,
    });
    mockedUseChartsSettings.mockReturnValue({
      showCharts: false,
      getCurrentChartOptions: jest.fn().mockReturnValue(null),
      resetChartsSettings: mockResetChartsSettings,
    });
    mockedUseDisplaySettings.mockReturnValue({
      showFrequencyTables: true,
      resetDisplaySettings: mockResetDisplaySettings,
    });
    mockedUseFrequenciesAnalysis.mockReturnValue({
      isLoading: isCalculating,
      errorMsg: null,
      runAnalysis: mockRunAnalysis,
      cancelAnalysis: mockCancelAnalysis,
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
  
  const FrequenciesTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
      <Frequencies onClose={mockOnClose} {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with title and tabs, with Variables tab active by default', () => {
    setupMocks();
    render(<FrequenciesTestComponent />);
    
    expect(screen.getByText('Frequencies')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Variables/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Statistics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Charts/i })).toBeInTheDocument();

    expect(screen.getByTestId('variables-tab')).toBeVisible();
    expect(screen.queryByTestId('statistics-tab')).toBeNull();
  });

  it('should disable the OK button when no variables are selected', () => {
    setupMocks([]);
    render(<FrequenciesTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('should enable the OK button when at least one variable is selected', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }]);
    render(<FrequenciesTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeEnabled();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }]);
    render(<FrequenciesTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    await userEvent.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    setupMocks();
    render(<FrequenciesTestComponent />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call all reset functions when Reset button is clicked', async () => {
    setupMocks();
    render(<FrequenciesTestComponent />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    expect(mockResetVariableSelection).toHaveBeenCalledTimes(1);
    expect(mockResetStatisticsSettings).toHaveBeenCalledTimes(1);
    expect(mockResetChartsSettings).toHaveBeenCalledTimes(1);
    expect(mockResetDisplaySettings).toHaveBeenCalledTimes(1);
    expect(mockCancelAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should switch tabs correctly when tab triggers are clicked', async () => {
    setupMocks();
    render(<FrequenciesTestComponent />);
    const user = userEvent.setup();
    
    // Switch to Statistics
    await user.click(screen.getByRole('tab', { name: /statistics/i }));
    expect(screen.getByTestId('statistics-tab')).toBeVisible();
    expect(screen.queryByTestId('variables-tab')).toBeNull();
    
    // Switch to Charts
    await user.click(screen.getByRole('tab', { name: /charts/i }));
    expect(screen.getByTestId('charts-tab')).toBeVisible();
    expect(screen.queryByTestId('statistics-tab')).toBeNull();

    // Switch back to Variables
    await user.click(screen.getByRole('tab', { name: /variables/i }));
    expect(screen.getByTestId('variables-tab')).toBeVisible();
    expect(screen.queryByTestId('charts-tab')).toBeNull();
  });

  it('should call startTour when the help button is clicked', async () => {
    setupMocks();
    render(<FrequenciesTestComponent />);
    
    const helpButton = screen.getByRole('button', { name: /start feature tour/i });
    await userEvent.click(helpButton);
    
    expect(mockStartTour).toHaveBeenCalledTimes(1);
  });

  it('should display loading text and disable OK button when analysis is in progress', () => {
    setupMocks([{ name: 'Var1', tempId: '1', columnIndex: 0 }], true);
    render(<FrequenciesTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /calculating.../i });
    expect(okButton).toBeInTheDocument();
    expect(okButton).toBeDisabled();
  });
}); 