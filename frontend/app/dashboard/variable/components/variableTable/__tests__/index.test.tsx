/* eslint-disable react/display-name */
import React from 'react';
import { render, screen } from '@testing-library/react';
import VariableTable from '../index';
import '@testing-library/jest-dom';

// Mock the custom hook useVariableTableLogic
jest.mock('../hooks/useVariableTableLogic', () => ({
  useVariableTableLogic: () => ({
    variables: [],
    handleBeforeChange: jest.fn(),
    handleAfterSelectionEnd: jest.fn(),
    handleContextMenu: jest.fn(),
    showTypeDialog: false,
    setShowTypeDialog: jest.fn(),
    showValuesDialog: false,
    setShowValuesDialog: jest.fn(),
    showMissingDialog: false,
    setShowMissingDialog: jest.fn(),
    selectedVariable: null,
    selectedVariableType: null,
    handleTypeChange: jest.fn(),
    handleValuesChange: jest.fn(),
    handleMissingChange: jest.fn(),
  }),
}));

// Mock the dialog components
jest.mock('../dialog/VariableTypeDialog', () => ({
    VariableTypeDialog: () => <div data-testid="variable-type-dialog"></div>
}));
jest.mock('../dialog/ValueLabelsDialog', () => ({
    ValueLabelsDialog: () => <div data-testid="value-labels-dialog"></div>
}));
jest.mock('../dialog/MissingValuesDialog', () => ({
    MissingValuesDialog: () => <div data-testid="missing-values-dialog"></div>
}));


// Mock HotTable from @handsontable/react-wrapper
jest.mock('@handsontable/react-wrapper', () => ({
    HotTable: React.forwardRef((_props, _ref) => <div data-testid="hot-table" />),
}));


describe('VariableTable Component', () => {
  it('should render without crashing', () => {
    render(<VariableTable />);
    // Check if the HotTable mock is rendered
    expect(screen.getByTestId('hot-table')).toBeInTheDocument();
  });
});