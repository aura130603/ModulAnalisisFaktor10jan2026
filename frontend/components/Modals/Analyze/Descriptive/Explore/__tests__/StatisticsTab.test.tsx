// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatisticsTab from '../StatisticsTab';

// Mock ActiveElementHighlight for simpler assertions
jest.mock('@/components/Common/TourComponents', () => ({
  ActiveElementHighlight: ({ active }: { active: boolean }) =>
    active ? <div data-testid="highlight" /> : null,
}));

describe('StatisticsTab Component', () => {
  const defaultProps = {
    showDescriptives: false,
    setShowDescriptives: jest.fn(),
    confidenceInterval: '95',
    setConfidenceInterval: jest.fn(),
    showMEstimators: false,
    setShowMEstimators: jest.fn(),
    showOutliers: false,
    setShowOutliers: jest.fn(),
    showPercentiles: false,
    setShowPercentiles: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables confidence interval input when showDescriptives is false', () => {
    render(<StatisticsTab {...defaultProps} />);
    const input = screen.getByLabelText(/confidence interval/i);
    expect(input).toBeDisabled();
  });

  it('enables confidence interval input when showDescriptives is true', () => {
    render(<StatisticsTab {...defaultProps} showDescriptives={true} />);
    const input = screen.getByLabelText(/confidence interval/i);
    expect(input).not.toBeDisabled();
  });

  it('calls checkbox setter callbacks when checkboxes are toggled', async () => {
    render(<StatisticsTab {...defaultProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText(/descriptives/i));
    expect(defaultProps.setShowDescriptives).toHaveBeenCalledWith(true);

    await user.click(screen.getByLabelText(/m-estimators/i));
    expect(defaultProps.setShowMEstimators).toHaveBeenCalledWith(true);

    await user.click(screen.getByLabelText(/outliers/i));
    expect(defaultProps.setShowOutliers).toHaveBeenCalledWith(true);

    await user.click(screen.getByLabelText(/percentiles/i));
    expect(defaultProps.setShowPercentiles).toHaveBeenCalledWith(true);
  });

  it('calls setConfidenceInterval on input change', async () => {
    render(<StatisticsTab {...defaultProps} showDescriptives={true} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText(/confidence interval/i);

    await user.clear(input);
    await user.type(input, '90');
    expect(defaultProps.setConfidenceInterval).toHaveBeenCalled();
  });

  it('shows highlight when tourActive and step match', () => {
    const tourSteps = [
      { targetId: 'explore-descriptives-section', content: 'step1' },
      { targetId: 'explore-additional-stats-section', content: 'step2' },
    ];

    const { queryAllByTestId } = render(
      <StatisticsTab
        {...defaultProps}
        tourActive={true}
        currentStep={0}
        tourSteps={tourSteps}
      />
    );

    expect(queryAllByTestId('highlight').length).toBe(1);
  });
}); 