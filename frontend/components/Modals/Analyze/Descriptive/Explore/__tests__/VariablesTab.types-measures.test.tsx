// @ts-nocheck
import React from 'react';
import { render } from '@testing-library/react';
import VariablesTab from '../VariablesTab';

// Capture props passed to VariableListManager
const variableListManagerMock = jest.fn(() => null);
jest.mock('@/components/Common/VariableListManager', () => {
  return {
    __esModule: true,
    default: (props: any) => {
      variableListManagerMock(props);
      return <div data-testid="variable-list-manager" />;
    },
  };
});

jest.mock('@/components/Common/TourComponents', () => ({
  ActiveElementHighlight: () => null,
}));

describe('VariablesTab filtering by type and inclusion by measurement', () => {
  const baseProps = {
    dependentVariables: [],
    factorVariables: [],
    labelVariable: null,
    highlightedVariable: null,
    setHighlightedVariable: jest.fn(),
    moveToAvailableVariables: jest.fn(),
    moveToDependentVariables: jest.fn(),
    moveToFactorVariables: jest.fn(),
    moveToLabelVariable: jest.fn(),
    reorderVariables: jest.fn(),
    errorMsg: '',
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows only NUMERIC types in available list (filters out STRING and DATE dd-mm-yyyy)', () => {
    const availableVariables = [
      { name: 'x', label: 'X', id: 'v1', columnIndex: 0, type: 'NUMERIC', decimals: 0, width: 8, values: [], missing: null, align: 'right', measure: 'scale', role: 'input', columns: 8 },
      { name: 'group', label: 'Group', id: 'v2', columnIndex: 1, type: 'STRING', decimals: 0, width: 8, values: [], missing: null, align: 'left', measure: 'nominal', role: 'input', columns: 8 },
      { name: 'birth', label: 'Birth Date', id: 'v3', columnIndex: 2, type: 'DATE', decimals: 0, width: 8, values: [], missing: null, align: 'right', measure: 'ordinal', role: 'input', columns: 8 },
    ];

    render(<VariablesTab {...baseProps} availableVariables={availableVariables} />);

    const received = variableListManagerMock.mock.calls[0][0];
    expect(received.availableVariables.map((v: any) => v.name)).toEqual(['x']);
  });

  it('does not filter by measurement; includes unknown, nominal, ordinal, scale when type is NUMERIC', () => {
    const availableVariables = [
      { name: 'n_unknown', label: 'N Unknown', id: 'n1', columnIndex: 0, type: 'NUMERIC', decimals: 0, width: 8, values: [], missing: null, align: 'right', measure: 'unknown', role: 'input', columns: 8 },
      { name: 'n_nominal', label: 'N Nominal', id: 'n2', columnIndex: 1, type: 'NUMERIC', decimals: 0, width: 8, values: [], missing: null, align: 'right', measure: 'nominal', role: 'input', columns: 8 },
      { name: 'n_ordinal', label: 'N Ordinal', id: 'n3', columnIndex: 2, type: 'NUMERIC', decimals: 0, width: 8, values: [], missing: null, align: 'right', measure: 'ordinal', role: 'input', columns: 8 },
      { name: 'n_scale', label: 'N Scale', id: 'n4', columnIndex: 3, type: 'NUMERIC', decimals: 0, width: 8, values: [], missing: null, align: 'right', measure: 'scale', role: 'input', columns: 8 },
    ];

    render(<VariablesTab {...baseProps} availableVariables={availableVariables} />);

    const received = variableListManagerMock.mock.calls[0][0];
    expect(received.availableVariables.map((v: any) => v.name)).toEqual([
      'n_unknown', 'n_nominal', 'n_ordinal', 'n_scale',
    ]);
  });
});


