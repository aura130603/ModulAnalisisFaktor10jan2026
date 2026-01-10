import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariablesTab from '../components/VariablesTab';
import type { Variable } from '@/types/Variable';
import { TourStep } from '../types';

// ---------------------------------------------
// Mock Checkbox, Input, RadioGroup & VariableListManager to simple HTML elements
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
  Input: ({ id, value, onChange, disabled }: any) => (
    <input
      type="number"
      data-testid={id}
      value={value}
      onChange={(e) => onChange(e)}
      disabled={disabled}
      readOnly={false}
    />
  ),
}));

jest.mock('@/components/ui/radio-group', () => {
  return {
    __esModule: true,
    RadioGroup: ({ value, onValueChange, children }: any) => (
      <div data-testid="radio-group" data-value={value}>
        {children}
      </div>
    ),
    RadioGroupItem: ({ value, id }: any) => (
      <input
        type="radio"
        data-testid={id}
        value={value}
        readOnly
      />
    ),
  };
});

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
      
      {/* Factor variable section */}
      <div data-testid="factor-variable-section">
        <h3>Factor Variable:</h3>
        {targetLists[1].variables.map((v: any) => (
          <div 
            key={v.tempId} 
            data-testid={`factor-${v.tempId}`} 
            data-display-name={getDisplayName(v)}
            onDoubleClick={() => onVariableDoubleClick(v, 'factor')}
          >
            {getDisplayName(v)}
          </div>
        ))}
      </div>
      
      {/* Render footer for factor list to expose effect size checkbox */}
      <div data-testid="factor-footer">
        {renderListFooter && renderListFooter('factor')}
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
    name: 'group',
    label: 'Group',
    tempId: 'temp_789',
    columnIndex: 2,
    type: 'NUMERIC',
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
    tempId: 'temp_101',
    columnIndex: 3,
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
    tempId: 'temp_102',
    columnIndex: 4,
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

// Mock tour steps
const mockTourSteps: TourStep[] = [
  {
    targetId: 'one-way-anova-available-variables',
    content: 'Select numeric variables from this list to analyze with One-Way ANOVA.',
    title: 'Variable Selection',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: '📊',
    requiredTab: 'variables'
  },
  {
    targetId: 'one-way-anova-test-variables',
    content: 'Variables moved to this list will be analyzed. You can reorder them by dragging.',
    title: 'Test Variables',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'right',
    icon: '📋',
    requiredTab: 'variables'
  },
  {
    targetId: 'one-way-anova-factor-variable',
    content: 'Select a factor variable to group your data for comparison.',
    title: 'Factor Variable',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '🔢',
    requiredTab: 'variables'
  },
  {
    targetId: 'estimate-effect-size-section',
    content: 'This option is currently disabled as the effect size calculation feature is not yet available.',
    title: 'Estimate Effect Size',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📏',
    requiredTab: 'variables'
  }
];

describe('OneWayAnova VariablesTab component', () => {
  // ------------------------------
  // Initial Rendering Tests
  // ------------------------------
  describe('Initial Rendering', () => {
    it('should render available and test variable lists correctly', () => {
      render(
        <VariablesTab
          availableVariables={[mockVariables[0]]}
          testVariables={[mockVariables[1]]}
          factorVariable={null}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
        />
      );
      
      // Check available and test sections are rendered
      expect(screen.getByTestId('available-variables-section')).toBeInTheDocument();
      expect(screen.getByTestId('test-variables-section')).toBeInTheDocument();
      
      // Check variables are in correct lists
      expect(screen.getByTestId(`available-${mockVariables[0].tempId}`)).toBeInTheDocument();
      expect(screen.getByTestId(`test-${mockVariables[1].tempId}`)).toBeInTheDocument();
    });

    it('should render factor variable list correctly', () => {
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[]}
          factorVariable={mockVariables[2]}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
        />
      );
      
      // Check factor section is rendered
      expect(screen.getByTestId('factor-variable-section')).toBeInTheDocument();
      
      // Check factor variable is in correct list
      expect(screen.getByTestId(`factor-${mockVariables[2].tempId}`)).toBeInTheDocument();
    });
    
    it('should display variable names with correct format', () => {
      render(
        <VariablesTab
          availableVariables={[mockVariables[0], mockVariables[4]]} // One with label, one without
          testVariables={[]}
          factorVariable={null}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
        />
      );
      
      // Variable with label should show "Label [name]"
      const varWithLabel = screen.getByTestId(`available-${mockVariables[0].tempId}`);
      expect(varWithLabel).toHaveAttribute('data-display-name', 'Age [age]');
      
      // Variable without label should show just "name"
      const varWithoutLabel = screen.getByTestId(`available-${mockVariables[4].tempId}`);
      expect(varWithoutLabel).toHaveAttribute('data-display-name', 'no_label_var');
    });
    
    it('should render effect size checkbox as disabled', () => {
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          factorVariable={mockVariables[2]}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
        />
      );
      
      const effectSizeCheckbox = screen.getByTestId('estimate-effect-size');
      expect(effectSizeCheckbox).toBeInTheDocument();
      expect(effectSizeCheckbox).toHaveAttribute('disabled');
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
          factorVariable={mockVariables[2]}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={moveToTestVariables}
          moveToAvailableVariables={moveToAvailableVariables}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
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
      render(
        <VariablesTab
          availableVariables={[mockVariables[0], mockVariables[2]]} // Scale and nominal variables
          testVariables={[]}
          factorVariable={null}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
        />
      );
  
      // Scale variable should be enabled
      const scaleVar = screen.getByTestId(`available-${mockVariables[0].tempId}`);
      expect(scaleVar).toHaveAttribute('data-disabled', 'false');
      
      // Nominal variable should be disabled
      const nominalVar = screen.getByTestId(`available-${mockVariables[2].tempId}`);
      expect(nominalVar).toHaveAttribute('data-disabled', 'true');
    });
    
    it('should disable unknown variables by default but enable them after checkbox is checked', async () => {
      const moveToTestVariables = jest.fn();
      const user = userEvent.setup();
      
      render(
        <VariablesTab
          availableVariables={[mockVariables[3]]} // Unknown measure variable
          testVariables={[]}
          factorVariable={null}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={moveToTestVariables}
          moveToAvailableVariables={jest.fn()}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
        />
      );
  
      // Unknown variable should be disabled by default
      const unknownVar = screen.getByTestId(`available-${mockVariables[3].tempId}`);
      expect(unknownVar).toHaveAttribute('data-disabled', 'true');
      
      // Toggle allow unknown checkbox
      const allowUnknownCheckbox = screen.getByTestId('allowUnknown');
      await user.click(allowUnknownCheckbox);
      
      // After toggling, variable should be enabled
      const unknownVarAfterToggle = screen.getByTestId(`available-${mockVariables[3].tempId}`);
      expect(unknownVarAfterToggle).toHaveAttribute('data-disabled', 'false');
    });
  
    it('should prevent effect size checkbox from being toggled', async () => {
      const setEstimateEffectSize = jest.fn();
      
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          factorVariable={mockVariables[2]}
          estimateEffectSize={false}
          setEstimateEffectSize={setEstimateEffectSize}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
        />
      );
  
      const user = userEvent.setup();
  
      // Try to toggle effect size checkbox
      const effectSizeCheckbox = screen.getByTestId('estimate-effect-size');
      await user.click(effectSizeCheckbox);
      
      // Since the checkbox is disabled in the component, the click should not trigger the function
      expect(setEstimateEffectSize).not.toHaveBeenCalled();
    });
  });
  
  // ------------------------------
  // Interactive Tour Tests
  // ------------------------------
  describe('Interactive Tour Functionality', () => {
    it('should render the component with tour active', () => {
      // Render with tour active
      render(
        <VariablesTab
          availableVariables={[mockVariables[0]]}
          testVariables={[mockVariables[1]]}
          factorVariable={mockVariables[2]}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={true}
          currentStep={0}
          tourSteps={mockTourSteps}
        />
      );
      
      // Verify that the component renders without errors when tour is active
      expect(screen.getByTestId('available-variables-section')).toBeInTheDocument();
      expect(screen.getByTestId('test-variables-section')).toBeInTheDocument();
      expect(screen.getByTestId('factor-variable-section')).toBeInTheDocument();
    });
    
    // Test each tour step's target element exists
    it('should have all required tour target elements', () => {
      render(
        <VariablesTab
          availableVariables={[mockVariables[0]]}
          testVariables={[mockVariables[1]]}
          factorVariable={mockVariables[2]}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          moveToFactorVariable={jest.fn()}
          reorderVariables={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={mockTourSteps}
        />
      );
      
      // Check that all tour target elements exist in the DOM
      expect(document.getElementById('one-way-anova-available-variables')).toBeInTheDocument();
      expect(document.getElementById('one-way-anova-test-variables')).toBeInTheDocument();
      expect(document.getElementById('estimate-effect-size-section')).toBeInTheDocument();
    });
  });
}); 