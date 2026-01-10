// @ts-nocheck
// /* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { render, screen } from '@testing-library/react';
import VariablesTab from '../VariablesTab';
import { Variable } from '@/types/Variable';

// Mock VariableListManager so we can inspect the props passed to it
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

// Mock ActiveElementHighlight to simplify DOM
jest.mock('@/components/Common/TourComponents', () => ({
  ActiveElementHighlight: ({ active }: { active: boolean }) =>
    active ? <div data-testid="highlight" /> : null,
}));

describe('VariablesTab Component', () => {
  const baseVariable: Variable = {
    name: 'var1',
    label: 'Variable 1',
    columnIndex: 0,
    tempId: 'temp-1',
    decimals: 2,
    measure: 'scale',
    type: 'numeric',
    width: 0,
  } as unknown as Variable; // relax for partial

  const defaultProps = {
    availableVariables: [baseVariable],
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

  it('passes the correct highlightedVariable shape to VariableListManager', () => {
    const props = {
      ...defaultProps,
      highlightedVariable: { id: 'temp-123', source: 'available' },
    };

    render(<VariablesTab {...props} />);

    expect(variableListManagerMock).toHaveBeenCalledTimes(1);
    const receivedProps = variableListManagerMock.mock.calls[0][0] as any;
    expect(receivedProps.highlightedVariable).toEqual({ id: 'temp-123', source: 'available' });
  });

  it('calls move functions correctly via onMoveVariable callback', () => {
    const moveToAvailableVariables = jest.fn();
    const moveToDependentVariables = jest.fn();
    const moveToFactorVariables = jest.fn();

    render(
      <VariablesTab
        {...defaultProps}
        moveToAvailableVariables={moveToAvailableVariables}
        moveToDependentVariables={moveToDependentVariables}
        moveToFactorVariables={moveToFactorVariables}
      />
    );

    const { onMoveVariable } = variableListManagerMock.mock.calls[0][0] as any;

    // Move from dependent -> available
    onMoveVariable(baseVariable, 'dependent', 'available');
    expect(moveToAvailableVariables).toHaveBeenCalledWith(baseVariable, 'dependent', undefined);

    // Move from available -> dependent
    onMoveVariable(baseVariable, 'available', 'dependent');
    expect(moveToDependentVariables).toHaveBeenCalledWith(baseVariable, undefined);

    // Move from available -> factor
    onMoveVariable(baseVariable, 'available', 'factor');
    expect(moveToFactorVariables).toHaveBeenCalledWith(baseVariable, undefined);
  });

  it('renders error message when errorMsg prop is provided', () => {
    const { getByText } = render(
      <VariablesTab
        {...defaultProps}
        errorMsg="An error occurred"
      />
    );

    expect(getByText('An error occurred')).toBeInTheDocument();
  });

  it('shows highlight element when tourActive and step matches', () => {
    const tourSteps = [{ targetId: 'explore-variable-lists', content: 'step' }];
    render(
      <VariablesTab
        {...defaultProps}
        tourActive={true}
        currentStep={0}
        tourSteps={tourSteps}
      />
    );

    expect(screen.getByTestId('highlight')).toBeInTheDocument();
  });
}); 