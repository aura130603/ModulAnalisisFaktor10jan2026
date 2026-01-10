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
      
      {/* Render footer for test list to expose test value and effect size checkbox */}
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
// Use a unique testid for each tour target to avoid conflicts
jest.mock('@/components/Common/TourComponents', () => ({
  __esModule: true,
  ActiveElementHighlight: ({ active }: { active: boolean }) => {
    if (active) {
      // Create a unique data-testid based on the parent element's ID
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
    name: 'category',
    label: 'Category',
    tempId: 'temp_789',
    columnIndex: 2,
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

// Mock tour steps - using the actual tour steps from tourConfig.ts
const mockTourSteps: TourStep[] = [
  {
    targetId: 'one-sample-t-test-available-variables',
    content: 'Select numeric variables from this list to analyze with One-Sample T Test.',
    title: 'Variable Selection',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: '📊',
    requiredTab: 'variables'
  },
  {
    targetId: 'one-sample-t-test-test-variables',
    content: 'Variables moved to this list will be analyzed. You can reorder them by dragging.',
    title: 'Test Variables',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'right',
    icon: '📋',
    requiredTab: 'variables'
  },
  {
    targetId: 'allow-unknown-section',
    content: 'Check this option to treat variables with unknown measurement level as Scale variables.',
    title: 'Allow Unknown Variables',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '🔍',
    requiredTab: 'variables'
  },
  {
    targetId: 'test-value-section',
    content: 'Specify the value to test your variables against.',
    title: 'Test Value',
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

describe('OneSampleTTest VariablesTab component', () => {
  // ------------------------------
  // Initial Rendering Tests
  // ------------------------------
  describe('Initial Rendering', () => {
    it('should render available and test variable lists correctly', () => {
      render(
        <VariablesTab
          availableVariables={[mockVariables[0], mockVariables[2]]}
          testVariables={[mockVariables[1]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          testValue={0}
          setTestValue={jest.fn()}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
        />
      );
      
      // Check sections are rendered
      expect(screen.getByTestId('available-variables-section')).toBeInTheDocument();
      expect(screen.getByTestId('test-variables-section')).toBeInTheDocument();
      
      // Check variables are in correct lists
      expect(screen.getByTestId(`available-${mockVariables[0].tempId}`)).toBeInTheDocument();
      expect(screen.getByTestId(`available-${mockVariables[2].tempId}`)).toBeInTheDocument();
      expect(screen.getByTestId(`test-${mockVariables[1].tempId}`)).toBeInTheDocument();
    });
    
    it('should display variable names with correct format', () => {
      render(
        <VariablesTab
          availableVariables={[mockVariables[0], mockVariables[4]]} // One with label, one without
          testVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          testValue={0}
          setTestValue={jest.fn()}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
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
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          testValue={0}
          setTestValue={jest.fn()}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
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
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={moveToTestVariables}
          moveToAvailableVariables={moveToAvailableVariables}
          reorderVariables={jest.fn()}
          testValue={0}
          setTestValue={jest.fn()}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
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
          availableVariables={[mockVariables[0], mockVariables[2]]} // Scale and nominal variables
          testVariables={[]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={moveToTestVariables}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          testValue={0}
          setTestValue={jest.fn()}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
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
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={moveToTestVariables}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          testValue={0}
          setTestValue={jest.fn()}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
        />
      );
  
      // Unknown variable should be disabled by default
      const unknownVar = screen.getByTestId(`available-${mockVariables[3].tempId}`);
      expect(unknownVar).toHaveAttribute('data-disabled', 'true');
      
      // Double-click should not work when disabled
      await user.dblClick(unknownVar);
      expect(moveToTestVariables).not.toHaveBeenCalled();
  
      // Toggle allow unknown checkbox
      const allowUnknownCheckbox = screen.getByTestId('allowUnknown');
      await user.click(allowUnknownCheckbox);
      
      // After toggling, variable should be enabled and double-click should work
      // We need to re-query because the component might re-render
      const unknownVarAfterToggle = screen.getByTestId(`available-${mockVariables[3].tempId}`);
      expect(unknownVarAfterToggle).toHaveAttribute('data-disabled', 'false');
      
      await user.dblClick(unknownVarAfterToggle);
      expect(moveToTestVariables).toHaveBeenCalledWith(mockVariables[3]);
    });
  
    it('should allow changing test value', async () => {
      const setTestValue = jest.fn();
      
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          testValue={0}
          setTestValue={setTestValue}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
        />
      );
  
      const user = userEvent.setup();
  
      // Change test value - directly type without clearing first
      const testValueInput = screen.getByTestId('test-value');
      await user.type(testValueInput, '10');
      
      // The input onChange will be called with a synthetic event
      expect(setTestValue).toHaveBeenCalled();
    });
  
    it('should prevent effect size checkbox from being toggled', async () => {
      const setEstimateEffectSize = jest.fn();
      
      render(
        <VariablesTab
          availableVariables={[]}
          testVariables={[mockVariables[0]]}
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          testValue={0}
          setTestValue={jest.fn()}
          estimateEffectSize={false}
          setEstimateEffectSize={setEstimateEffectSize}
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
          highlightedVariable={null}
          setHighlightedVariable={jest.fn()}
          moveToTestVariables={jest.fn()}
          moveToAvailableVariables={jest.fn()}
          reorderVariables={jest.fn()}
          testValue={0}
          setTestValue={jest.fn()}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
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
          testValue={0}
          setTestValue={jest.fn()}
          estimateEffectSize={false}
          setEstimateEffectSize={jest.fn()}
          tourActive={false}
          currentStep={0}
          tourSteps={mockTourSteps}
        />
      );
      
      // Check that all tour target elements exist in the DOM
      expect(document.getElementById('one-sample-t-test-available-variables')).toBeInTheDocument();
      expect(document.getElementById('one-sample-t-test-test-variables')).toBeInTheDocument();
      expect(document.getElementById('allow-unknown-section')).toBeInTheDocument();
      expect(document.getElementById('test-value-section')).toBeInTheDocument();
      expect(document.getElementById('estimate-effect-size-section')).toBeInTheDocument();
    });
  });
}); 