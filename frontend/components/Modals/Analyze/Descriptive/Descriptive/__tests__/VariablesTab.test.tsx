import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VariablesTab from '../components/VariablesTab';
import type { Variable } from '@/types/Variable';

// ---------------------------------------------
// Mock Checkbox & VariableListManager to simple HTML elements
// ---------------------------------------------
jest.mock('@/components/ui/checkbox', () => ({
  __esModule: true,
  Checkbox: ({ id, checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      data-testid={id}
      checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      readOnly
    />
  ),
}));

jest.mock('@/components/Common/VariableListManager', () => ({
  __esModule: true,
  default: ({ availableVariables, renderListFooter, onVariableDoubleClick }: any) => (
    <div>
      {/* Available variables list */}
      {availableVariables.map((v: any) => (
        <div key={v.tempId} data-testid={`available-${v.tempId}`} onDoubleClick={() => onVariableDoubleClick(v, 'available')}>
          {v.name}
        </div>
      ))}
      {/* Render footer for selected list to expose saveStandardized checkbox */}
      {renderListFooter && renderListFooter('selected')}
    </div>
  ),
}));

// ---------------------------------------------
// Helper variable list
// ---------------------------------------------
const mockVariable: Variable = {
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
};

describe('VariablesTab component', () => {
  it('toggles saveStandardized checkbox and double-click moves variable', async () => {
    const moveToSelectedVariables = jest.fn();
    const setSaveStandardized = jest.fn();

    render(
      <VariablesTab
        availableVariables={[mockVariable]}
        selectedVariables={[]}
        highlightedVariable={null}
        setHighlightedVariable={jest.fn()}
        moveToSelectedVariables={moveToSelectedVariables}
        moveToAvailableVariables={jest.fn()}
        reorderVariables={jest.fn()}
        saveStandardized={false}
        setSaveStandardized={setSaveStandardized}
      />
    );

    const user = userEvent.setup();

    // Toggle checkbox
    const checkbox = screen.getByTestId('saveStandardized');
    await user.click(checkbox);
    expect(setSaveStandardized).toHaveBeenCalledWith(true);

    // Double-click available variable
    const varDiv = screen.getByTestId(`available-${mockVariable.tempId}`);
    await user.dblClick(varDiv);
    expect(moveToSelectedVariables).toHaveBeenCalledWith(mockVariable);
  });
}); 