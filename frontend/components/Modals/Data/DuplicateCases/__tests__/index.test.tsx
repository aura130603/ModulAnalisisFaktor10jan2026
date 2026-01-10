import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import DuplicateCases from '..';
import { useDuplicateCases } from '../hooks/useDuplicateCases';
import { useTourGuide } from '../hooks/useTourGuide';

// Mock custom hooks
jest.mock('../hooks/useDuplicateCases');
jest.mock('../hooks/useTourGuide');

const mockedUseDuplicateCases = useDuplicateCases as jest.Mock;
const mockedUseTourGuide = useTourGuide as jest.Mock;

// Mock child components
function MockVariableTab() {
  return <div data-testid="variable-tab">VariableTab</div>;
}
MockVariableTab.displayName = 'VariableTab';
jest.mock('../VariableTab', () => MockVariableTab);

function MockOptionsTab() {
  return <div data-testid="options-tab">OptionsTab</div>;
}
MockOptionsTab.displayName = 'OptionsTab';
jest.mock('../OptionsTab', () => MockOptionsTab);

function MockTourPopup() {
  return <div data-testid="tour-popup">TourPopup</div>;
}
MockTourPopup.displayName = 'TourPopup';
jest.mock('@/components/Common/TourComponents', () => ({
  TourPopup: MockTourPopup,
  ActiveElementHighlight: () => null
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    ...jest.requireActual('lucide-react'),
    HelpCircle: (props: any) => <div data-testid="help-icon" {...props} />,
    AlertCircle: (props: any) => <div data-testid="alert-icon" {...props} />,
    Shapes: (props: any) => <div {...props} />,
    Ruler: (props: any) => <div {...props} />,
    BarChartHorizontal: (props: any) => <div {...props} />,
}));

describe('DuplicateCases Component', () => {
  const mockOnClose = jest.fn();

  const defaultDuplicateCasesProps = {
    sourceVariables: [],
    matchingVariables: [],
    sortingVariables: [],
    highlightedVariable: null,
    setHighlightedVariable: jest.fn(),
    sortOrder: 'ascending' as 'ascending' | 'descending',
    setSortOrder: jest.fn(),
    primaryCaseIndicator: 'first' as 'first' | 'last',
    setPrimaryCaseIndicator: jest.fn(),
    primaryName: '',
    setPrimaryName: jest.fn(),
    sequentialCount: false,
    setSequentialCount: jest.fn(),
    sequentialName: '',
    setSequentialName: jest.fn(),
    moveMatchingToTop: true,
    setMoveMatchingToTop: jest.fn(),
    errorMessage: '',
    errorDialogOpen: false,
    setErrorDialogOpen: jest.fn(),
    isProcessing: false,
    handleMoveVariable: jest.fn(),
    handleReorderVariable: jest.fn(),
    handleReset: jest.fn(),
    handleConfirm: jest.fn(),
    displayFrequencies: true,
    setDisplayFrequencies: jest.fn(),
    filterByIndicator: false,
    setFilterByIndicator: jest.fn(),
  };

  const defaultTourGuideProps = {
    tourActive: false,
    currentStep: 0,
    tourSteps: [],
    currentTargetElement: null,
    startTour: jest.fn(),
    nextStep: jest.fn(),
    prevStep: jest.fn(),
    endTour: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDuplicateCases.mockReturnValue(defaultDuplicateCasesProps);
    mockedUseTourGuide.mockReturnValue(defaultTourGuideProps);
  });

  it('renders correctly in dialog mode by default', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    expect(screen.getByText('Identify Duplicate Cases')).toBeInTheDocument();
    expect(screen.getByTestId('variable-tab')).toBeInTheDocument();
  });

  it('renders correctly in sidebar mode', () => {
    render(<DuplicateCases onClose={mockOnClose} containerType="sidebar" />);
    expect(screen.queryByText('Identify Duplicate Cases')).not.toBeInTheDocument();
    expect(screen.getByTestId('variable-tab')).toBeInTheDocument();
  });

  it('switches tabs when a tab is clicked', async () => {
    const user = userEvent.setup();
    render(<DuplicateCases onClose={mockOnClose} />);
    
    // Initial render should show the variables tab
    expect(screen.getByTestId('variable-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('options-tab')).not.toBeInTheDocument();

    const optionsTabTrigger = screen.getByRole('tab', { name: 'Options' });
    await user.click(optionsTabTrigger);
    
    // After clicking, the options tab content should be visible
    expect(await screen.findByTestId('options-tab')).toBeVisible();
    expect(screen.queryByTestId('variable-tab')).not.toBeInTheDocument();
  });

  it('calls handleConfirm when OK button is clicked', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    const okButton = screen.getByTestId('duplicatecases-main-ok');
    fireEvent.click(okButton);
    expect(defaultDuplicateCasesProps.handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls handleReset when Reset button is clicked and resets tab', async () => {
    const user = userEvent.setup();
    render(<DuplicateCases onClose={mockOnClose} />);

    // Switch to options tab first
    const optionsTabTrigger = screen.getByRole('tab', { name: 'Options' });
    await user.click(optionsTabTrigger);
    expect(await screen.findByTestId('options-tab')).toBeVisible();

    // Click reset
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    await user.click(resetButton);

    // Check that reset was called and tab was switched back to variables
    expect(defaultDuplicateCasesProps.handleReset).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId('variable-tab')).toBeVisible();
    expect(screen.queryByTestId('options-tab')).not.toBeInTheDocument();
  });

  it('disables buttons and shows "Processing..." when isProcessing is true', () => {
    mockedUseDuplicateCases.mockReturnValue({ ...defaultDuplicateCasesProps, isProcessing: true });
    render(<DuplicateCases onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: 'Processing...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled();
  });

  it('displays error dialog when errorDialogOpen is true', () => {
    const errorMessage = 'This is an error.';
    mockedUseDuplicateCases.mockReturnValue({ ...defaultDuplicateCasesProps, errorDialogOpen: true, errorMessage });
    render(<DuplicateCases onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog', { name: /IBM SPSS Statistics/i });

    expect(within(dialog).getByText(errorMessage)).toBeInTheDocument();
    expect(within(dialog).getByTestId('alert-icon')).toBeInTheDocument();

    // Test closing the dialog
    const okButton = within(dialog).getByRole('button', { name: 'OK' });
    fireEvent.click(okButton);
    expect(defaultDuplicateCasesProps.setErrorDialogOpen).toHaveBeenCalledWith(false);
  });

  it('calls startTour when help button is clicked', () => {
    render(<DuplicateCases onClose={mockOnClose} />);
    const helpButton = screen.getByTestId('help-icon').closest('button');
    if (helpButton) {
        fireEvent.click(helpButton);
    }
    expect(defaultTourGuideProps.startTour).toHaveBeenCalledTimes(1);
  });

  it('displays TourPopup when tour is active', () => {
    mockedUseTourGuide.mockReturnValue({ ...defaultTourGuideProps, tourActive: true, currentTargetElement: document.body });
    render(<DuplicateCases onClose={mockOnClose} />);
    expect(screen.getByTestId('tour-popup')).toBeInTheDocument();
  });
});
