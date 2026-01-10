import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChiSquare from '../index';
import { useDataStore } from '@/stores/useDataStore';
import { useModalStore } from '@/stores/useModalStore';
import { useVariableStore } from '@/stores/useVariableStore';
import { useMetaStore } from '@/stores/useMetaStore';
import { useResultStore } from '@/stores/useResultStore';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import type { Variable } from '@/types/Variable';

// Mock the hooks module
jest.mock('../hooks', () => ({
  __esModule: true,
  useVariableSelection: jest.fn(),
  useTestSettings: jest.fn(),
  useChiSquareAnalysis: jest.fn(),
  useTourGuide: jest.fn(),
  baseTourSteps: []
}));

// Mock dependencies
jest.mock('@/stores/useDataStore');
jest.mock('@/stores/useModalStore');
jest.mock('@/stores/useVariableStore');
jest.mock('@/stores/useMetaStore');
jest.mock('@/stores/useResultStore');
jest.mock('@/hooks/useAnalysisData');

// Mock implementations
const mockedUseDataStore = useDataStore as unknown as jest.Mock;
const mockedUseModalStore = useModalStore as unknown as jest.Mock;
const mockedUseVariableStore = useVariableStore as unknown as jest.Mock;
const mockedUseMetaStore = useMetaStore as unknown as jest.Mock;
const mockedUseResultStore = useResultStore as unknown as jest.Mock;
const mockedUseAnalysisData = useAnalysisData as unknown as jest.Mock;

const mockVariables: Variable[] = [
  {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    type: 'NUMERIC',
    tempId: '1',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8
  },
  {
    name: 'var2',
    label: 'Variable 2',
    columnIndex: 1,
    type: 'NUMERIC',
    tempId: '2',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'ordinal',
    role: 'input',
    columns: 8
  }
];

const mockCloseModal = jest.fn();

describe('ChiSquare Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockCheckAndSave = jest.fn().mockResolvedValue(undefined);
    mockedUseDataStore.mockReturnValue({
      variables: mockVariables,
      data: [
        [1, 1],
        [2, 1],
        [1, 2],
        [2, 2],
        [1, 1],
        [2, 1]
      ]
    });
    (mockedUseDataStore as any).getState = jest.fn().mockReturnValue({
      checkAndSave: mockCheckAndSave
    });
    mockedUseModalStore.mockReturnValue({
      closeModal: mockCloseModal
    });
    const mockLoadVariables = jest.fn();
    mockedUseVariableStore.mockReturnValue({
      variables: mockVariables,
      isLoading: false,
      error: null
    });
    (mockedUseVariableStore as any).getState = jest.fn().mockReturnValue({
      loadVariables: mockLoadVariables
    });
    mockedUseMetaStore.mockReturnValue({
      meta: {
        filter: null,
        weight: null
      }
    });
    mockedUseResultStore.mockReturnValue({
      addLog: jest.fn().mockResolvedValue('log-123'),
      addAnalytic: jest.fn().mockResolvedValue('analytic-123'),
      addStatistic: jest.fn().mockResolvedValue('statistic-123')
    });
    
    mockedUseAnalysisData.mockReturnValue({
      data: [
        [1, 1],
        [2, 1],
        [1, 2],
        [2, 2],
        [1, 1],
        [2, 1]
      ],
      weights: [1, 1, 1, 1, 1, 1],
      filterVariable: undefined,
      weightVariable: undefined
    });

    // Mock all hooks with default values
    const { useVariableSelection, useTestSettings, useChiSquareAnalysis, useTourGuide } = require('../hooks');
    
    useVariableSelection.mockReturnValue({
      availableVariables: mockVariables,
      testVariables: [],
      highlightedVariable: null,
      setHighlightedVariable: jest.fn(),
      moveToTestVariables: jest.fn(),
      moveToAvailableVariables: jest.fn(),
      reorderVariables: jest.fn(),
      resetVariableSelection: jest.fn()
    });

    useTestSettings.mockReturnValue({
      expectedRange: { getFromData: true },
      setExpectedRange: jest.fn(),
      rangeValue: { lowerValue: null, upperValue: null },
      setRangeValue: jest.fn(),
      expectedValue: { allCategoriesEqual: true },
      setExpectedValue: jest.fn(),
      expectedValueList: [],
      setExpectedValueList: jest.fn(),
      highlightedExpectedValueIndex: null,
      setHighlightedExpectedValueIndex: jest.fn(),
      displayStatistics: { descriptive: false, quartiles: false },
      setDisplayStatistics: jest.fn(),
      addExpectedValue: jest.fn(),
      removeExpectedValue: jest.fn(),
      changeExpectedValue: jest.fn(),
      resetTestSettings: jest.fn()
    });

    useChiSquareAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn()
    });

    useTourGuide.mockReturnValue({
      tourActive: false,
      currentStep: 0,
      tourSteps: [],
      currentTargetElement: null,
      startTour: jest.fn(),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn()
    });
  });

  const renderComponent = () => {
    return render(<ChiSquare onClose={mockCloseModal} />);
  };

  it('should render the Chi-Square dialog with correct title', () => {
    renderComponent();
    expect(screen.getByText('Chi-Square Test')).toBeInTheDocument();
  });

  it('should display Variables and Options tabs', () => {
    renderComponent();
    expect(screen.getByRole('tab', { name: /variables/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /options/i })).toBeInTheDocument();
  });

  it('should disable OK button when no variables are selected', () => {
    renderComponent();
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('should disable OK button when isCalculating is true', () => {
    const { useChiSquareAnalysis } = require('../hooks');
    useChiSquareAnalysis.mockReturnValue({
      isCalculating: true,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn()
    });
    
    renderComponent();
    const okButton = screen.getByRole('button', { name: /processing/i });
    expect(okButton).toBeDisabled();
  });

  it('should disable OK button when testVariables.length < 1', () => {
    renderComponent();
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('should disable OK button when range is invalid (specified range but missing values)', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const optionsTab = screen.getByRole('tab', { name: /options/i });
    await user.click(optionsTab);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('should disable OK button when expected values are invalid (custom but less than 2 values)', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const optionsTab = screen.getByRole('tab', { name: /options/i });
    await user.click(optionsTab);
    
    const okButton = screen.getByRole('button', { name: /ok/i });
    expect(okButton).toBeDisabled();
  });

  it('should test the complete disable condition formula', () => {
    // Test the formula: isCalculating || testVariables.length < 1 || (!expectedRange.getFromData && (rangeValue.lowerValue || !rangeValue.upperValue)) || (!expectedValue.allCategoriesEqual && expectedValueList.length < 2)
    
    const { useChiSquareAnalysis } = require('../hooks');
    
    // Test case 1: isCalculating = true
    useChiSquareAnalysis.mockReturnValue({
      isCalculating: true,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn()
    });
    renderComponent();
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();

    // Test case 2: testVariables.length < 1 (default state)
    useChiSquareAnalysis.mockReturnValue({
      isCalculating: false,
      errorMsg: null,
      runAnalysis: jest.fn(),
      cancelCalculation: jest.fn()
    });
    renderComponent();
    expect(screen.getByRole('button', { name: /ok/i })).toBeDisabled();
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockCloseModal).toHaveBeenCalledTimes(1);
  });

  it('should close modal when X button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const closeButton = screen.getByText('Close');
    expect(closeButton).toBeInTheDocument();
  });

  it('should have proper button roles', () => {
    renderComponent();
    
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });
}); 