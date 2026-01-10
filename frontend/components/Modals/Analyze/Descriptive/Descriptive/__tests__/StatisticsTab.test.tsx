import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StatisticsTab from '../components/StatisticsTab';
import { DescriptiveStatisticsOptions } from '../types';

// Mock Checkbox, RadioGroup, etc to simple HTML inputs
jest.mock('@/components/ui/checkbox', () => ({
  __esModule: true,
  Checkbox: (props: any) => (
    <input
      type="checkbox"
      data-testid={props['data-testid'] ?? props.id}
      checked={props.checked}
      onClick={() => props.onCheckedChange?.(!props.checked)}
      readOnly
    />
  ),
}));

jest.mock('@/components/ui/radio-group', () => {
  /* eslint-disable react/prop-types */
  let handler: ((val: string) => void) | undefined;
  return {
    __esModule: true,
    RadioGroup: ({ children, onValueChange }: any) => {
      handler = onValueChange;
      return <div>{children}</div>;
    },
    RadioGroupItem: (props: any) => (
      <input
        type="radio"
        data-testid={props['data-testid'] ?? props.id}
        value={props.value}
        onClick={() => handler?.(props.value)}
      />
    ),
  };
});

const defaultStats: DescriptiveStatisticsOptions = {
  mean: false,
  sum: false,
  stdDev: false,
  variance: false,
  range: false,
  minimum: false,
  maximum: false,
  standardError: false,
  median: false,
  skewness: false,
  kurtosis: false,
};

describe('StatisticsTab component', () => {
  it('calls updateStatistic when checkbox toggled and display order changed', async () => {
    const updateStatistic = jest.fn();
    const setDisplayOrder = jest.fn();

    render(
      <StatisticsTab
        displayStatistics={{ ...defaultStats, mean: false }}
        updateStatistic={updateStatistic}
        displayOrder="variableList"
        setDisplayOrder={setDisplayOrder}
      />
    );

    // Toggle mean checkbox
    const meanCheckbox = screen.getByTestId('statistics-mean');
    fireEvent.click(meanCheckbox);
    expect(updateStatistic).toHaveBeenCalledWith('mean', true);

    // Change display order through radio item
    const alphabeticRadio = screen.getByTestId('display-order-alphabetic');
    fireEvent.click(alphabeticRadio);
    expect(setDisplayOrder).toHaveBeenCalledWith('alphabetic');
  });
});