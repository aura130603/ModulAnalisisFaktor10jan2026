// @ts-nocheck
import React from 'react';
import { render } from '@testing-library/react';
import VariablesTab from '../VariablesTab';
import type { Variable } from '@/types/Variable';

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

describe('VariablesTab available list filtering by type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const numVar: Variable = {
    name: 'num', label: 'Num', columnIndex: 0, type: 'NUMERIC', measure: 'scale', tempId: 'n0'
  } as unknown as Variable;

  const strVar: Variable = {
    name: 'str', label: 'Str', columnIndex: 1, type: 'STRING', measure: 'nominal', tempId: 's1'
  } as unknown as Variable;

  const dateVar: Variable = {
    name: 'date', label: 'Date', columnIndex: 2, type: 'DATE', measure: 'unknown', tempId: 'd2'
  } as unknown as Variable;

  it('only forwards NUMERIC variables to VariableListManager.availableVariables', () => {
    render(
      <VariablesTab
        availableVariables={[numVar, strVar, dateVar]}
        dependentVariables={[]}
        factorVariables={[]}
        labelVariable={null}
        highlightedVariable={null}
        setHighlightedVariable={jest.fn()}
        moveToAvailableVariables={jest.fn()}
        moveToDependentVariables={jest.fn()}
        moveToFactorVariables={jest.fn()}
        moveToLabelVariable={jest.fn()}
        reorderVariables={jest.fn()}
        errorMsg={''}
      />
    );

    const receivedProps = variableListManagerMock.mock.calls[0][0] as any;
    const names = receivedProps.availableVariables.map((v: Variable) => v.name);
    expect(names).toEqual(['num']);
  });
});


