import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Explore from '../index';
import {
  useVariableManagement,
  useStatisticsSettings,
  useExploreAnalysis,
  useTourGuide,
} from '../hooks';
import { BaseModalProps } from '@/types/modalTypes';

// Mock the custom hooks module
jest.mock('../hooks');

// Mock child components (use factory functions to avoid hoisting issues)
jest.mock('../VariablesTab', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => <div data-testid="variables-tab">VariablesTab</div>,
  };
});

jest.mock('../StatisticsTab', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => <div data-testid="statistics-tab">StatisticsTab</div>,
  };
});

// Type-safe casting for mocked hooks
const mockedUseVariableManagement = useVariableManagement as jest.Mock;
const mockedUseStatisticsSettings = useStatisticsSettings as jest.Mock;
const mockedUseExploreAnalysis = useExploreAnalysis as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;

describe('Explore Modal', () => {
  const mockRunAnalysis = jest.fn();
  const mockResetVariableSelections = jest.fn();
  const mockResetStatisticsSettings = jest.fn();
  const mockStartTour = jest.fn();
  const mockOnClose = jest.fn();

  // Helper to set up mock implementations
  const setupMocks = (dependentVariables: any[] = [], isCalculating = false) => {
    mockedUseVariableManagement.mockReturnValue({
      dependentVariables,
      resetVariableSelections: mockResetVariableSelections,
      availableVariables: [],
      factorVariables: [],
      labelVariable: null,
      highlightedVariable: null,
      moveToDependentVariables: jest.fn(),
      moveToFactorVariables: jest.fn(),
      moveToLabelVariable: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
      setHighlightedVariable: jest.fn(),
    });
    mockedUseStatisticsSettings.mockReturnValue({
      resetStatisticsSettings: mockResetStatisticsSettings,
    });
    mockedUseExploreAnalysis.mockReturnValue({
      isCalculating,
      error: null,
      runAnalysis: mockRunAnalysis,
    });
    mockedUseTourGuide.mockReturnValue({
      tourActive: false,
      startTour: mockStartTour,
    });
  };
  
  const ExploreTestComponent: React.FC<Partial<BaseModalProps>> = (props) => (
      <Explore onClose={mockOnClose} {...props} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with title and tabs', () => {
    setupMocks();
    render(<ExploreTestComponent />);
    
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Variables/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Statistics/i })).toBeInTheDocument();
  });

  it('should disable the OK button if no dependent variables are selected', () => {
    setupMocks([]); // No dependent variables
    render(<ExploreTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('should call runAnalysis when OK button is clicked', async () => {
    setupMocks([{ name: 'Dep1' }]); // Mock one dependent variable to enable the button logic
    render(<ExploreTestComponent />);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    await userEvent.click(okButton);
    
    expect(mockRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    setupMocks();
    render(<ExploreTestComponent />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call reset functions when Reset button is clicked', async () => {
    setupMocks();
    render(<ExploreTestComponent />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await userEvent.click(resetButton);
    
    expect(mockResetVariableSelections).toHaveBeenCalledTimes(1);
    expect(mockResetStatisticsSettings).toHaveBeenCalledTimes(1);
  });

  it('should switch to Statistics tab correctly', async () => {
    setupMocks();
    render(<ExploreTestComponent />);
    const user = userEvent.setup();
    
    expect(screen.getByTestId('variables-tab')).toBeVisible();
    expect(screen.queryByTestId('statistics-tab')).toBeNull();

    await user.click(screen.getByRole('tab', { name: /statistics/i }));
    
    expect(screen.queryByTestId('variables-tab')).toBeNull();
    expect(screen.getByTestId('statistics-tab')).toBeVisible();
  });

  it('should call startTour when help button is clicked', async () => {
    setupMocks();
    render(<ExploreTestComponent />);
    
    const helpButton = screen.getByRole('button', { name: /help/i });
    await userEvent.click(helpButton);
    
    expect(mockStartTour).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when isCalculating is true', () => {
    setupMocks([{ name: 'Dep1' }], true);
    render(<ExploreTestComponent />);
    
    expect(screen.getByRole('button', { name: /processing.../i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
}); 