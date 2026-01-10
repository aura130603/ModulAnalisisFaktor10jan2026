import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariablesTab from '../components/VariablesTab';
import type { Variable } from '@/types/Variable';
import { TourStep } from '../types';

// ---------------------------------------------
// Mock Checkbox, Input & VariableListManager to simple HTML elements
// ---------------------------------------------
jest.mock('@/components/ui/checkbox', () => ({
  __esModule: true,
  Checkbox: ({ id, checked, onCheckedChange, disabled }: any) => (
    <input
      type="checkbox"
      data-testid={id}
      checked={checked}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      disabled={disabled}
      readOnly
    />
  ),
}));

jest.mock('@/components/ui/input', () => ({
  __esModule: true,
  Input: ({ id, value, onChange }: any) => (
    <input
      type="number"
      data-testid={id}
      value={value}
      onChange={(e) => onChange(e)}
      readOnly={false}
    />
  ),
}));

// Mock VariableListManager with more detailed rendering to test display format
jest.mock('@/components/Common/VariableListManager', () => ({
  __esModule: true,
  default: ({ 
    availableVariables, 
    targetLists, 
    onVariableDoubleClick, 
    renderListFooter, 
    renderExtraInfoContent,
    getDisplayName,
    isVariableDisabled 
  }: any) => (
    <div>
      {/* Available variables section */}
      <div data-testid="available-variables-section">
        <h3>Available Variables:</h3>
        {availableVariables.map((v: any) => (
          <div 
            key={v.tempId} 
            data-testid={`available-${v.tempId}`} 
            data-disabled={isVariableDisabled(v)}
            data-display-name={getDisplayName(v)}
            onDoubleClick={() => onVariableDoubleClick(v, 'available')}
          >
            {getDisplayName(v)}
          </div>
        ))}
      </div>
      
      {/* Test variables section */}
      <div data-testid="test-variables-section">
        <h3>Test Variables:</h3>
        {targetLists[0].variables.map((v: any) => (
          <div 
            key={v.tempId} 
            data-testid={`test-${v.tempId}`} 
            data-display-name={getDisplayName(v)}
            onDoubleClick={() => onVariableDoubleClick(v, 'test')}
          >
            {getDisplayName(v)}
          </div>
        ))}
      </div>
      
      {/* Render footer for test list to expose correlation options */}
      <div data-testid="test-footer">
        {renderListFooter && renderListFooter('test')}
      </div>
      
      {/* Render extra info content */}
      <div data-testid="extra-info">
        {renderExtraInfoContent && renderExtraInfoContent()}
      </div>
    </div>
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
  {
    name: 'category',
    label: 'Category',
    tempId: 'temp_101',
    columnIndex: 3,
    type: 'STRING',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'left',
    measure: 'nominal',
    role: 'input',
    columns: 8,
  },
  {
    name: 'unknown_var',
    label: 'Unknown Variable',
    tempId: 'temp_102',
    columnIndex: 4,
    type: 'NUMERIC',
    width: 8,
    decimals: 0,
    values: [],
    missing: {},
    align: 'right',
    measure: 'unknown',
    role: 'input',
    columns: 8,
  },
  {
    name: 'no_label_var',
    tempId: 'temp_103',
    columnIndex: 5,
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

// Mock tour steps for Bivariate correlation
const mockTourSteps: TourStep[] = [
  {
    targetId: 'bivariate-available-variables',
    content: 'Select variables from this list for correlation analysis.',
    title: 'Available Variables',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: '📊',
    requiredTab: 'variables'
  },
  {
    targetId: 'bivariate-test-variables',
    content: 'Variables moved to this list will be analyzed for correlations.',
    title: 'Test Variables',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'right',
    icon: '📋',
    requiredTab: 'variables'
  },
  {
    targetId: 'correlation-coefficient-section',
    content: 'Choose the type of correlation coefficient to calculate.',
    title: 'Correlation Coefficient',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '🔗',
    requiredTab: 'variables'
  },
  {
    targetId: 'test-of-significance-section',
    content: 'Select the type of significance test to perform.',
    title: 'Test of Significance',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📈',
    requiredTab: 'variables'
  },
  {
    targetId: 'flag-significant-correlations-section',
    content: 'Flag significant correlations in the output.',
    title: 'Flag Significant Correlations',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '🚩',
    requiredTab: 'variables'
  },
  {
    targetId: 'show-only-lower-triangle-section',
    content: 'Show only the lower triangle of the correlation matrix.',
    title: 'Show Only Lower Triangle',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📐',
    requiredTab: 'variables'
  },
  {
    targetId: 'show-diagonal-section',
    content: 'Include diagonal elements in the output.',
    title: 'Show Diagonal',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '🔲',
    requiredTab: 'variables'
  }
];

describe('Bivariate Correlation VariablesTab component', () => {
  // ------------------------------
  // Initial Rendering Tests
  // ------------------------------
  describe('Initial Rendering', () => {
    it('should render available and test variable lists correctly', () => {
      render(
        <VariablesTab
          availableVariables={[mockVariables[0], mockVariables[3]]}
          testVariables={[mockVariables[1]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
      
      // Check sections are rendered
      expect(screen.getByTestId('available-variables-section')).toBeInTheDocument();
      expect(screen.getByTestId('test-variables-section')).toBeInTheDocument();
      
      // Check variables are in correct lists
      expect(screen.getByTestId(`available-${mockVariables[0].tempId}`)).toBeInTheDocument();
      expect(screen.getByTestId(`available-${mockVariables[3].tempId}`)).toBeInTheDocument();
      expect(screen.getByTestId(`test-${mockVariables[1].tempId}`)).toBeInTheDocument();
    });
    
    it('should display variable names with correct format', () => {
      render(
        <VariablesTab
          availableVariables={[mockVariables[0], mockVariables[5]]} // One with label, one without
          testVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
      
      // Variable with label should show "Label [name]"
      const varWithLabel = screen.getByTestId(`available-${mockVariables[0].tempId}`);
      expect(varWithLabel).toHaveAttribute('data-display-name', 'Age [age]');
      
      // Variable without label should show just "name"
      const varWithoutLabel = screen.getByTestId(`available-${mockVariables[5].tempId}`);
      expect(varWithoutLabel).toHaveAttribute('data-display-name', 'no_label_var');
    });
    
    it('should render correlation coefficient options', () => {
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: true,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
      
      // Check that correlation coefficient options are rendered
      expect(screen.getByTestId('pearson')).toBeInTheDocument();
      expect(screen.getByTestId('kendalls-tau-b')).toBeInTheDocument();
      expect(screen.getByTestId('spearman')).toBeInTheDocument();
    });
  });
  
  // ------------------------------
  // Variable Interaction & Logic Tests
  // ------------------------------
  describe('Variable Interaction & Logic', () => {
    it('should move variables between available and test lists on double-click', async () => {
      const moveToTestVariables = jest.fn();
      const moveToAvailableVariables = jest.fn();
      
      render(
        <VariablesTab
          availableVariables={[mockVariables[0]]}
          testVariables={[mockVariables[1]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={moveToTestVariables}
          moveToAvailableVariables={moveToAvailableVariables}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
  
      const user = userEvent.setup();
  
      // Double-click available variable to move to test
      const availableVar = screen.getByTestId(`available-${mockVariables[0].tempId}`);
      await user.dblClick(availableVar);
      expect(moveToTestVariables).toHaveBeenCalledWith(mockVariables[0]);
  
      // Double-click test variable to move back to available
      const testVar = screen.getByTestId(`test-${mockVariables[1].tempId}`);
      await user.dblClick(testVar);
      expect(moveToAvailableVariables).toHaveBeenCalledWith(mockVariables[1]);
    });
  
    it('should disable nominal and string variables', () => {
      const moveToTestVariables = jest.fn();
      
      render(
        <VariablesTab
          availableVariables={[mockVariables[0], mockVariables[3]]} // Scale and nominal variables
          testVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={moveToTestVariables}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
  
      // Scale variable should be enabled
      const scaleVar = screen.getByTestId(`available-${mockVariables[0].tempId}`);
      expect(scaleVar).toHaveAttribute('data-disabled', 'false');
      
      // Nominal variable should be disabled
      const nominalVar = screen.getByTestId(`available-${mockVariables[3].tempId}`);
      expect(nominalVar).toHaveAttribute('data-disabled', 'true');
    });
    
    it('should disable unknown variables by default but enable them after checkbox is checked', async () => {
      const moveToTestVariables = jest.fn();
      const user = userEvent.setup();
      
      render(
        <VariablesTab
          availableVariables={[mockVariables[4]]} // Unknown measure variable
          testVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={moveToTestVariables}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
  
      // Unknown variable should be disabled by default
      const unknownVar = screen.getByTestId(`available-${mockVariables[4].tempId}`);
      expect(unknownVar).toHaveAttribute('data-disabled', 'true');
      
      // Double-click should not work when disabled
      await user.dblClick(unknownVar);
      expect(moveToTestVariables).not.toHaveBeenCalled();
  
      // Toggle allow unknown checkbox
      const allowUnknownCheckbox = screen.getByTestId('allowUnknown');
      await user.click(allowUnknownCheckbox);
      
      // After toggling, variable should be enabled and double-click should work
      const unknownVarAfterToggle = screen.getByTestId(`available-${mockVariables[4].tempId}`);
      expect(unknownVarAfterToggle).toHaveAttribute('data-disabled', 'false');
      
      await user.dblClick(unknownVarAfterToggle);
      expect(moveToTestVariables).toHaveBeenCalledWith(mockVariables[4]);
    });
  
    it('should allow changing correlation coefficient options', async () => {
      const setCorrelationCoefficient = jest.fn();
      
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={setCorrelationCoefficient}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
  
      const user = userEvent.setup();
  
      // Toggle Pearson correlation
      const pearsonCheckbox = screen.getByTestId('pearson');
      await user.click(pearsonCheckbox);
      expect(setCorrelationCoefficient).toHaveBeenCalled();
    });
  
    it('should allow changing test of significance options', async () => {
      const setTestOfSignificance = jest.fn();
      
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={setTestOfSignificance}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
  
      const user = userEvent.setup();
  
      // Toggle two-tailed test
      const twoTailedRadio = screen.getByLabelText('Two-tailed');
      await user.click(twoTailedRadio);
      expect(setTestOfSignificance).toHaveBeenCalled();
    });
  
    it('should render flag significant correlations checkbox as disabled', () => {
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
  
      // Check that flag significant correlations checkbox is disabled
      const flagCheckbox = screen.getByTestId('flag-significant-correlations');
      expect(flagCheckbox).toBeDisabled();
    });
  
    it('should allow changing show only lower triangle option', async () => {
      const setShowOnlyTheLowerTriangle = jest.fn();
      
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={setShowOnlyTheLowerTriangle}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
        />
      );
  
      const user = userEvent.setup();
  
      // Toggle show only lower triangle
      const lowerTriangleCheckbox = screen.getByTestId('show-only-the-lower-triangle');
      await user.click(lowerTriangleCheckbox);
      expect(setShowOnlyTheLowerTriangle).toHaveBeenCalled();
    });
  
    it('should allow changing show diagonal option when lower triangle is enabled', async () => {
      const setShowDiagonal = jest.fn();
      
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={true}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={false}
          setShowDiagonal={setShowDiagonal}
        />
      );
  
      const user = userEvent.setup();
  
      // Toggle show diagonal
      const showDiagonalCheckbox = screen.getByTestId('show-diagonal');
      await user.click(showDiagonalCheckbox);
      expect(setShowDiagonal).toHaveBeenCalled();
    });
  });
  
  // ------------------------------
  // Interactive Tour Tests
  // ------------------------------
  describe('Interactive Tour Functionality', () => {
    it('should render the component with tour active', () => {
      render(
        <VariablesTab
          availableVariables={[mockVariables[0]]}
          testVariables={[mockVariables[1]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
          tourActive={true}
          currentStep={0}
          tourSteps={mockTourSteps}
        />
      );
      
      // Just verify that the component renders without errors when tour is active
      expect(screen.getByTestId('available-variables-section')).toBeInTheDocument();
      expect(screen.getByTestId('test-variables-section')).toBeInTheDocument();
    });
    
    it('should have all required tour target elements', () => {
      render(
        <VariablesTab
          availableVariables={[mockVariables[0]]}
          testVariables={[mockVariables[1]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          correlationCoefficient={{
            pearson: false,
            kendallsTauB: false,
            spearman: false
          }}
          setCorrelationCoefficient={jest.fn()}
          testOfSignificance={{
            oneTailed: false,
            twoTailed: false
          }}
          setTestOfSignificance={jest.fn()}
          flagSignificantCorrelations={false}
          setFlagSignificantCorrelations={jest.fn()}
          showOnlyTheLowerTriangle={false}
          setShowOnlyTheLowerTriangle={jest.fn()}
          showDiagonal={true}
          setShowDiagonal={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={mockTourSteps}
        />
      );
      
      // Check that all tour target elements exist in the DOM
      expect(document.getElementById('bivariate-available-variables')).toBeInTheDocument();
      expect(document.getElementById('bivariate-test-variables')).toBeInTheDocument();
      expect(document.getElementById('correlation-coefficient-section')).toBeInTheDocument();
      expect(document.getElementById('test-of-significance-section')).toBeInTheDocument();
      expect(document.getElementById('flag-significant-correlations-section')).toBeInTheDocument();
      expect(document.getElementById('show-only-the-lower-triangle-section')).toBeInTheDocument();
      expect(document.getElementById('show-diagonal-section')).toBeInTheDocument();
    });
  });
}); 