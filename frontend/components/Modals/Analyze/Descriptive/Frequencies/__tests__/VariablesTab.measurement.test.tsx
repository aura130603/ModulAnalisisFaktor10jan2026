import React from 'react';
import { render, screen } from '@testing-library/react';
import VariablesTab from '../VariablesTab';
import type { Variable } from '@/types/Variable';

// Mock heavy child component to avoid complex drag/drop logic
jest.mock('@/components/Common/VariableListManager', () => ({
  __esModule: true,
  default: () => <div data-testid="variable-list-manager" />,
}));

describe('VariablesTab measurement-level notice', () => {
  const baseVariable: Partial<Variable> = {
    id: 1,
    tempId: 't1',
    columnIndex: 0,
    width: 8,
    decimals: 0,
    values: [],
    missing: null,
    columns: 8,
    align: 'left',
    role: 'input',
  };

  const makeVar = (overrides: Partial<Variable>): Variable => ({
    name: 'var',
    label: 'Var',
    type: 'STRING',
    measure: 'unknown',
    ...(baseVariable as Variable),
    ...(overrides as Variable),
  });

  const variableSelectionFactory = (selected: Variable[] = [], available: Variable[] = []) => ({
    availableVariables: available,
    selectedVariables: selected,
    highlightedVariable: null,
    setHighlightedVariable: jest.fn(),
    moveToSelectedVariables: jest.fn(),
    moveToAvailableVariables: jest.fn(),
    reorderVariables: jest.fn(),
  });

  const displaySettingsFactory = (showFrequencyTables = true) => ({
    showFrequencyTables,
    setShowFrequencyTables: jest.fn(),
  });

  it('shows a warning when there are selected variables with unknown measurement', () => {
    const unknownVar = makeVar({ id: 11, name: 'u1', label: 'Unknown1', measure: 'unknown' });
    const unknownVar2 = makeVar({ id: 12, name: 'u2', label: 'Unknown2', measure: 'unknown' });

    render(
      <VariablesTab
        variableSelection={variableSelectionFactory([unknownVar, unknownVar2])}
        displaySettings={displaySettingsFactory()}
      />
    );

    expect(
      screen.getByText(/2 variables? with unknown measurement level\./i)
    ).toBeInTheDocument();
  });

  it('does not show a warning when measurements are nominal/ordinal/scale', () => {
    const nominalVar = makeVar({ id: 21, name: 'n1', measure: 'nominal' });
    const ordinalVar = makeVar({ id: 22, name: 'o1', measure: 'ordinal' });
    const scaleVar = makeVar({ id: 23, name: 's1', measure: 'scale' });

    render(
      <VariablesTab
        variableSelection={variableSelectionFactory([nominalVar, ordinalVar, scaleVar])}
        displaySettings={displaySettingsFactory()}
      />
    );

    expect(
      screen.queryByText(/unknown measurement level/i)
    ).not.toBeInTheDocument();
  });
});


