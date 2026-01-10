import React from 'react';
import { render, screen } from '@testing-library/react';
import Index from '../index';
import '@testing-library/jest-dom';

// Mocking custom hooks and stores
jest.mock('../hooks/useDataTableLogic', () => ({
  useDataTableLogic: () => ({
    colHeaders: ['A', 'B'],
    columns: [{}, {}],
    displayData: [[1, 2], [3, 4]],
    contextMenuConfig: {},
    handleBeforeChange: jest.fn(),
    handleAfterChange: jest.fn(),
    handleAfterColumnResize: jest.fn(),
    handleAfterValidate: jest.fn(),
    actualNumRows: 2,
    actualNumCols: 2,
    displayNumRows: 5,
    displayNumCols: 5,
  }),
}));

jest.mock('@/stores/useTableRefStore', () => ({
  useTableRefStore: () => ({
      viewMode: 'data',
      setDataTableRef: jest.fn(),
  }),
}));

jest.mock('@/stores/useMetaStore', () => ({
  useMetaStore: (selector: (state: any) => any) =>
    selector({
      meta: { filter: '' },
    }),
}));

jest.mock('@/stores/useVariableStore', () => ({
  useVariableStore: (selector: (state: any) => any) =>
    selector({
      variables: [],
    }),
}));

// Mock HandsontableWrapper to prevent it from rendering the actual table
jest.mock('../HandsontableWrapper', () => {
    const MockedHandsontableWrapper = React.forwardRef((_props: any, _ref: any) => {
        return <div data-testid="handsontable-wrapper"></div>;
    });
    MockedHandsontableWrapper.displayName = 'HandsontableWrapper';
    return MockedHandsontableWrapper;
});


describe('DataTable Component', () => {
  it('should render without crashing', () => {
    render(<Index />);
    // Check if the HandsontableWrapper mock is rendered
    expect(screen.getByTestId('handsontable-wrapper')).toBeInTheDocument();
  });
}); 