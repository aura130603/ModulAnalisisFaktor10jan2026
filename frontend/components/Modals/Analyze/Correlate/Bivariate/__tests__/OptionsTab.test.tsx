import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import OptionsTab from '../components/OptionsTab';
import { OptionsTabProps, TourStep } from '../types';
import type { Variable } from '@/types/Variable';

// ---------------------------------------------
// Mock UI components to simple HTML elements
// ---------------------------------------------
jest.mock('@/components/ui/checkbox', () => ({
  __esModule: true,
  Checkbox: ({ id, checked, onCheckedChange, disabled }: any) => (
    <input
      type="checkbox"
      data-testid={id}
      id={id}
      checked={checked}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      disabled={disabled}
      readOnly
    />
  ),
}));

jest.mock('@/components/ui/radio-group', () => ({
  __esModule: true,
  RadioGroup: ({ children, value, onValueChange }: any) => {
    // Store the callback globally so RadioGroupItem can access it
    (global as any).__radioGroupCallback = onValueChange;
    return (
      <div role="radiogroup" data-testid="radio-group" data-value={value}>
        {children}
      </div>
    );
  },
  RadioGroupItem: ({ value, id }: any) => (
    <input
      type="radio"
      data-testid={id}
      id={id}
      value={value}
      onClick={() => {
        // Directly call the onValueChange from the parent RadioGroup
        // We'll use a global variable to store the callback
        if ((global as any).__radioGroupCallback) {
          (global as any).__radioGroupCallback(value);
        }
      }}
    />
  ),
}));

jest.mock('@/components/ui/label', () => ({
  __esModule: true,
  Label: ({ htmlFor, children, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

// Mock TourComponents to properly simulate the ActiveElementHighlight behavior
jest.mock('@/components/Common/TourComponents', () => ({
  __esModule: true,
  ActiveElementHighlight: ({ active }: { active: boolean }) => {
    if (active) {
      const parentId = (active as any).parentId || 'tour-highlight';
      return <div data-testid={`tour-highlight-${parentId}`} data-active={active.toString()}></div>;
    }
    return null;
  }
}));

// ---------------------------------------------
// Helper variable list
// ---------------------------------------------
const mockVariables: Variable[] = [
  {
    name: 'age',
    label: 'Age',
    tempId: 'temp_123',
    columnIndex: 0,
    type: 'NUMERIC',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'right',
    measure: 'scale',
    role: 'input',
    columns: 8,
  },
  {
    name: 'height',
    label: 'Height',
    tempId: 'temp_456',
    columnIndex: 1,
    type: 'NUMERIC',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'right',
    measure: 'scale',
    role: 'input',
    columns: 8,
  },
  {
    name: 'weight',
    label: 'Weight',
    tempId: 'temp_789',
    columnIndex: 2,
    type: 'NUMERIC',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'right',
    measure: 'scale',
    role: 'input',
    columns: 8,
  },
];

// Mock tour steps for Bivariate correlation Options tab
const mockTourSteps: TourStep[] = [
  {
    targetId: 'partial-correlation-section',
    content: 'Enable partial correlation analysis with Kendall\'s tau-b.',
    title: 'Partial Correlation',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '🔗',
    requiredTab: 'options'
  },
  {
    targetId: 'control-variables-section',
    content: 'Select control variables for partial correlation analysis.',
    title: 'Control Variables',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '🎛️',
    requiredTab: 'options'
  },
  {
    targetId: 'statistics-options-section',
    content: 'Choose additional statistics to display in the output.',
    title: 'Statistics Options',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📊',
    requiredTab: 'options'
  },
  {
    targetId: 'missing-values-options-section',
    content: 'Configure how missing values are handled in the analysis.',
    title: 'Missing Values',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '❓',
    requiredTab: 'options'
  }
];

describe('Bivariate Correlation OptionsTab component', () => {
  afterEach(() => {
    // Clean up global callback
    delete (global as any).__radioGroupCallback;
  });

  // ------------------------------
  // Initial Rendering Tests
  // ------------------------------
  describe('Initial Rendering', () => {
    it('should render partial correlation checkbox with default unchecked state', () => {
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const checkbox = screen.getByLabelText(/Partial Correlation \(Kendalls Tau-b\)/i);
      expect(checkbox).not.toBeChecked();
    });

    it('should render statistics options checkboxes with default unchecked state', () => {
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const meansCheckbox = screen.getByLabelText(/Means and standard deviations/i);
      const crossProductCheckbox = screen.getByLabelText(/Cross Product Deviations and Covariances/i);
      
      expect(meansCheckbox).not.toBeChecked();
      expect(crossProductCheckbox).not.toBeChecked();
    });

    it('should render missing values radio buttons with default unchecked state', () => {
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const pairwiseRadio = screen.getByLabelText(/Exclude cases pairwise/i);
      const listwiseRadio = screen.getByLabelText(/Exclude cases listwise/i);
      
      expect(pairwiseRadio).not.toBeChecked();
      expect(listwiseRadio).not.toBeChecked();
    });
  });

  // ------------------------------
  // Partial Correlation Section Tests
  // ------------------------------
  describe('Partial Correlation Section', () => {
    it('should allow changing partial correlation checkbox', async () => {
      const setPartialCorrelationKendallsTauB = jest.fn();
      const user = userEvent.setup();
      
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={setPartialCorrelationKendallsTauB}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: true,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: true
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const checkbox = screen.getByTestId('partial-correlation-kendalls-tau-b');
      expect(checkbox).not.toBeDisabled();
      await user.click(checkbox);
      
      expect(setPartialCorrelationKendallsTauB).toHaveBeenCalledWith(true);
    });

    it('should show control variables section when partial correlation is enabled', () => {
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={true}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      expect(screen.getByText('Available Variables')).toBeInTheDocument();
      expect(screen.getByText('Control Variable(s)')).toBeInTheDocument();
    });

    it('should disable control variables when partial correlation is disabled', () => {
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const controlSection = document.getElementById('control-variables-section');
      expect(controlSection).toHaveClass('opacity-50');
      expect(controlSection).toHaveClass('pointer-events-none');
    });
  });

  // ------------------------------
  // Statistics Options Section Tests
  // ------------------------------
  describe('Statistics Options Section', () => {
    it('should allow changing means checkbox', async () => {
      const setStatisticsOptions = jest.fn();
      const user = userEvent.setup();
      
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: true,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={setStatisticsOptions}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const meansCheckbox = screen.getByTestId('means-and-standard-deviations');
      expect(meansCheckbox).not.toBeDisabled();
      await user.click(meansCheckbox);
      
      expect(setStatisticsOptions).toHaveBeenCalledWith({
        meansAndStandardDeviations: true,
        crossProductDeviationsAndCovariances: false
      });
    });

    it('should allow changing cross-product checkbox', async () => {
      const setStatisticsOptions = jest.fn();
      const user = userEvent.setup();
      
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: true,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={setStatisticsOptions}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const crossProductCheckbox = screen.getByTestId('cross-product-deviations-and-covariances');
      expect(crossProductCheckbox).not.toBeDisabled();
      await user.click(crossProductCheckbox);
      
      expect(setStatisticsOptions).toHaveBeenCalledWith({
        meansAndStandardDeviations: false,
        crossProductDeviationsAndCovariances: true
      });
    });
  });

  // ------------------------------
  // Missing Values Section Tests
  // ------------------------------
  describe('Missing Values Section', () => {
    it('should allow changing missing values to pairwise', async () => {
      const setMissingValuesOptions = jest.fn();
      const user = userEvent.setup();
      
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: true,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={setMissingValuesOptions}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const pairwiseRadio = screen.getByTestId('exclude-cases-pairwise');
      await user.click(pairwiseRadio);
      
      expect(setMissingValuesOptions).toHaveBeenCalledWith({
        excludeCasesPairwise: true,
        excludeCasesListwise: false
      });
    });

    it('should allow changing missing values to listwise', async () => {
      const setMissingValuesOptions = jest.fn();
      const user = userEvent.setup();
      
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: true,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={setMissingValuesOptions}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const listwiseRadio = screen.getByTestId('exclude-cases-listwise');
      await user.click(listwiseRadio);
      
      expect(setMissingValuesOptions).toHaveBeenCalledWith({
        excludeCasesPairwise: false,
        excludeCasesListwise: true
      });
    });

    it('should disable control variables when pairwise is selected', () => {
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={true}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: true,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={[]}
        />
      );
      
      const controlSection = document.getElementById('control-variables-section');
      expect(controlSection).toHaveClass('opacity-50');
      expect(controlSection).toHaveClass('pointer-events-none');
    });
  });

  // ------------------------------
  // Interactive Tour Tests
  // ------------------------------
  describe('Interactive Tour Functionality', () => {
    it('should render the component with tour active', () => {
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={true}
          currentStep={0}
          tourSteps={mockTourSteps}
        />
      );
      
      // Just verify that the component renders without errors when tour is active
      expect(screen.getByLabelText(/Partial Correlation \(Kendalls Tau-b\)/i)).toBeInTheDocument();
    });
    
    it('should have all required tour target elements', () => {
      render(
        <OptionsTab
          partialCorrelationKendallsTauB={false}
          setPartialCorrelationKendallsTauB={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          statisticsOptions={{
            meansAndStandardDeviations: false,
            crossProductDeviationsAndCovariances: false
          }}
          setStatisticsOptions={jest.fn()}
          missingValuesOptions={{
            excludeCasesPairwise: false,
            excludeCasesListwise: false
          }}
          setMissingValuesOptions={jest.fn()}
          testVariables={mockVariables}
          controlVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToKendallsTauBControlVariables={jest.fn()}
          moveToKendallsTauBAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={mockTourSteps}
        />
      );
      
      // Check that all tour target elements exist in the DOM
      expect(document.getElementById('partial-correlation-section')).toBeInTheDocument();
      expect(document.getElementById('control-variables-section')).toBeInTheDocument();
      expect(document.getElementById('statistics-options-section')).toBeInTheDocument();
      expect(document.getElementById('missing-values-options-section')).toBeInTheDocument();
    });
  });
}); 