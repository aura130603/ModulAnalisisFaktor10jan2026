import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionsTab from '../components/OptionsTab';
import { TestType, DisplayStatisticsOptions, TourStep } from '../types';

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

// Mock the Checkbox component
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="checkbox"
      {...props}
    />
  ),
}));

// Mock the Label component
jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => (
    <label {...props}>{children}</label>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <div className={className} data-testid="card-title">{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
}));

// Mock the Separator component
jest.mock('@/components/ui/separator', () => ({
  Separator: ({ ...props }: any) => <hr {...props} />,
}));

// Mock the Tooltip components
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TooltipContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TooltipProvider: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TooltipTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Info: ({ className }: { className?: string }) => (
    <div data-testid="info-icon" className={className}>Info</div>
  ),
  BarChart3: ({ className }: { className?: string }) => (
    <div data-testid="bar-chart-icon" className={className}>BarChart3</div>
  ),
  TrendingUp: ({ className }: { className?: string }) => (
    <div data-testid="trending-up-icon" className={className}>TrendingUp</div>
  ),
}));

describe('OptionsTab', () => {
  const mockSetTestType = jest.fn();
  const mockSetDisplayStatistics = jest.fn();

  const defaultProps = {
    testType: {
      mannWhitneyU: true,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    } as TestType,
    setTestType: mockSetTestType,
    displayStatistics: {
      descriptive: true,
      quartiles: false
    } as DisplayStatisticsOptions,
    setDisplayStatistics: mockSetDisplayStatistics,
    tourActive: false,
    currentStep: 0,
    tourSteps: [] as TourStep[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the options tab with test type section', () => {
    render(<OptionsTab {...defaultProps} />);
    
    expect(screen.getByText('Test Type')).toBeInTheDocument();
    expect(screen.getByText('Mann-Whitney U')).toBeInTheDocument();
    expect(screen.getByText('Kolmogorov-Smirnov Z')).toBeInTheDocument();
  });

  it('should render the display statistics section', () => {
    render(<OptionsTab {...defaultProps} />);
    
    expect(screen.getByText('Display Statistics')).toBeInTheDocument();
    expect(screen.getByText('Descriptive Statistics')).toBeInTheDocument();
  });

  it('should handle Mann-Whitney U test type toggle', async () => {
    const user = userEvent.setup();
    render(<OptionsTab {...defaultProps} />);
    
    const mannWhitneyCheckbox = screen.getByTestId('checkbox');
    await user.click(mannWhitneyCheckbox);

    expect(mockSetTestType).toHaveBeenCalledWith({
      mannWhitneyU: false,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
  });

  it('should handle Kolmogorov-Smirnov Z test type toggle', async () => {
    const user = userEvent.setup();
    render(<OptionsTab {...defaultProps} testType={{ mannWhitneyU: false, kolmogorovSmirnovZ: true, mosesExtremeReactions: false, waldWolfowitzRuns: false }} />);
    
    const kolmogorovCheckbox = screen.getByTestId('checkbox');
    await user.click(kolmogorovCheckbox);

    expect(mockSetTestType).toHaveBeenCalledWith({
      mannWhitneyU: false,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
  });

  it('should handle display statistics toggle', async () => {
    const user = userEvent.setup();
    render(<OptionsTab {...defaultProps} />);
    
    const displayStatsCheckbox = screen.getByTestId('checkbox');
    await user.click(displayStatsCheckbox);

    expect(mockSetDisplayStatistics).toHaveBeenCalledWith({
      descriptive: false,
      quartiles: false
    });
  });

  it('should show correct initial state for Mann-Whitney U', () => {
    render(<OptionsTab {...defaultProps} testType={{ mannWhitneyU: true, kolmogorovSmirnovZ: false, mosesExtremeReactions: false, waldWolfowitzRuns: false }} />);
    
    const mannWhitneyCheckbox = screen.getByTestId('checkbox');
    expect(mannWhitneyCheckbox).toBeChecked();
  });

  it('should show correct initial state for Kolmogorov-Smirnov Z', () => {
    render(<OptionsTab {...defaultProps} testType={{ mannWhitneyU: false, kolmogorovSmirnovZ: true, mosesExtremeReactions: false, waldWolfowitzRuns: false }} />);
    
    const kolmogorovCheckbox = screen.getByTestId('checkbox');
    expect(kolmogorovCheckbox).toBeChecked();
  });

  it('should show correct initial state for display statistics', () => {
    render(<OptionsTab {...defaultProps} displayStatistics={{ descriptive: true, quartiles: false }} />);
    
    const displayStatsCheckbox = screen.getByTestId('checkbox');
    expect(displayStatsCheckbox).toBeChecked();
  });

  it('should show unchecked state for display statistics when false', () => {
    render(<OptionsTab {...defaultProps} displayStatistics={{ descriptive: false, quartiles: false }} />);
    
    const displayStatsCheckbox = screen.getByTestId('checkbox');
    expect(displayStatsCheckbox).not.toBeChecked();
  });

  it('should show unchecked state for test types when false', () => {
    render(<OptionsTab {...defaultProps} testType={{ mannWhitneyU: false, kolmogorovSmirnovZ: false, mosesExtremeReactions: false, waldWolfowitzRuns: false }} />);
    
    const testTypeCheckboxes = screen.getAllByTestId('checkbox');
    testTypeCheckboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('should display test type descriptions', () => {
    render(<OptionsTab {...defaultProps} />);
    
    expect(screen.getByText(/Mann-Whitney U test/)).toBeInTheDocument();
    expect(screen.getByText(/Kolmogorov-Smirnov Z test/)).toBeInTheDocument();
  });

  it('should display display statistics description', () => {
    render(<OptionsTab {...defaultProps} />);
    
    expect(screen.getByText(/Show descriptive statistics/)).toBeInTheDocument();
  });

  it('should show info tooltips for guidance', () => {
    render(<OptionsTab {...defaultProps} />);
    
    const infoIcons = screen.getAllByTestId('info-icon');
    expect(infoIcons.length).toBeGreaterThan(0);
  });

  it('should handle tour highlighting when tour is active', () => {
    render(<OptionsTab {...defaultProps} tourActive={true} currentStep={1} />);
    
    // Check if tour-related elements are present
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
  });

  it('should allow both test types to be selected simultaneously', async () => {
    const user = userEvent.setup();
    render(<OptionsTab {...defaultProps} testType={{ mannWhitneyU: true, kolmogorovSmirnovZ: false, mosesExtremeReactions: false, waldWolfowitzRuns: false }} />);
    
    // Click on Kolmogorov-Smirnov Z to enable it
    const kolmogorovCheckbox = screen.getAllByTestId('checkbox')[1]; // Second checkbox
    await user.click(kolmogorovCheckbox);
    
    expect(mockSetTestType).toHaveBeenCalledWith({
      mannWhitneyU: true,
      kolmogorovSmirnovZ: true,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
  });

  it('should handle multiple checkbox interactions correctly', async () => {
    const user = userEvent.setup();
    render(<OptionsTab {...defaultProps} testType={{ mannWhitneyU: false, kolmogorovSmirnovZ: false, mosesExtremeReactions: false, waldWolfowitzRuns: false }} />);
    
    const checkboxes = screen.getAllByTestId('checkbox');
    
    // Click first checkbox (Mann-Whitney U)
    await user.click(checkboxes[0]);
    expect(mockSetTestType).toHaveBeenCalledWith({
      mannWhitneyU: true,
      kolmogorovSmirnovZ: false,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
    
    // Click second checkbox (Kolmogorov-Smirnov Z)
    await user.click(checkboxes[1]);
    expect(mockSetTestType).toHaveBeenCalledWith({
      mannWhitneyU: false,
      kolmogorovSmirnovZ: true,
      mosesExtremeReactions: false,
      waldWolfowitzRuns: false
    });
    
    // Click third checkbox (Display Statistics)
    await user.click(checkboxes[2]);
    expect(mockSetDisplayStatistics).toHaveBeenCalledWith({
      descriptive: false,
      quartiles: false
    });
  });

  it('should display proper labels for all checkboxes', () => {
    render(<OptionsTab {...defaultProps} />);
    
    expect(screen.getByText('Mann-Whitney U')).toBeInTheDocument();
    expect(screen.getByText('Kolmogorov-Smirnov Z')).toBeInTheDocument();
    expect(screen.getByText('Descriptive Statistics')).toBeInTheDocument();
  });

  it('should handle edge case when no test types are selected', () => {
    render(<OptionsTab {...defaultProps} testType={{ mannWhitneyU: false, kolmogorovSmirnovZ: false, mosesExtremeReactions: false, waldWolfowitzRuns: false }} />);
    
    const checkboxes = screen.getAllByTestId('checkbox');
    expect(checkboxes.length).toBe(3); // Two test types + display statistics
    
    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('should maintain state consistency when toggling options', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<OptionsTab {...defaultProps} />);
    
    // Initially Mann-Whitney U should be checked
    let mannWhitneyCheckbox = screen.getAllByTestId('checkbox')[0];
    expect(mannWhitneyCheckbox).toBeChecked();
    
    // Toggle it off
    await user.click(mannWhitneyCheckbox);
    expect(defaultProps.setTestType).toHaveBeenCalledWith({
      mannWhitneyU: false,
      kolmogorovSmirnovZ: false
    });
    
    // Rerender with updated state
    rerender(<OptionsTab {...defaultProps} testType={{ mannWhitneyU: false, kolmogorovSmirnovZ: false, mosesExtremeReactions: false, waldWolfowitzRuns: false }} />);
    
    // Now it should be unchecked
    mannWhitneyCheckbox = screen.getAllByTestId('checkbox')[0];
    expect(mannWhitneyCheckbox).not.toBeChecked();
  });

  it('should show proper section headers', () => {
    render(<OptionsTab {...defaultProps} />);
    
    expect(screen.getByText('Test Type')).toBeInTheDocument();
    expect(screen.getByText('Display Statistics')).toBeInTheDocument();
  });

  it('should handle accessibility attributes correctly', () => {
    render(<OptionsTab {...defaultProps} />);
    
    const labels = screen.getAllByTestId('label');
    expect(labels.length).toBeGreaterThan(0);
    
    // Check that labels are properly associated with checkboxes
    labels.forEach(label => {
      expect(label).toHaveAttribute('for');
    });
  });

  it('should display icons for visual guidance', () => {
    render(<OptionsTab {...defaultProps} />);
    
    const infoIcons = screen.getAllByTestId('info-icon');
    expect(infoIcons.length).toBeGreaterThan(0);
  });

  it('should handle rapid checkbox toggling', async () => {
    const user = userEvent.setup();
    render(<OptionsTab {...defaultProps} />);
    
    const mannWhitneyCheckbox = screen.getAllByTestId('checkbox')[0];
    
    // Rapidly click the checkbox multiple times
    await user.click(mannWhitneyCheckbox);
    await user.click(mannWhitneyCheckbox);
    await user.click(mannWhitneyCheckbox);
    
    // Should have been called multiple times
    expect(defaultProps.setTestType).toHaveBeenCalledTimes(3);
  });
}); 