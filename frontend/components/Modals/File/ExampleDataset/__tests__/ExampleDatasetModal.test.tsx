import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExampleDatasetModal } from '../index';
import * as hook from '../hooks/useExampleDatasetLogic';

jest.mock('../hooks/useExampleDatasetLogic');

const mockedUseExampleDatasetLogic = hook.useExampleDatasetLogic as jest.Mock;

describe('ExampleDatasetModal Component', () => {
  const mockOnClose = jest.fn();
  const mockLoadDataset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseExampleDatasetLogic.mockReturnValue({
      isLoading: false,
      error: null,
      loadDataset: mockLoadDataset,
    });
  });

  it('renders modal header and at least one dataset button', () => {
    render(<ExampleDatasetModal onClose={mockOnClose} />);

    expect(screen.getByText('Example Data')).toBeInTheDocument();
    // Accidents dataset is guaranteed to exist in the constant list
    expect(screen.getByRole('button', { name: /accidents\.sav/i })).toBeInTheDocument();
  });

  it('invokes loadDataset when a dataset button is clicked', async () => {
    const user = userEvent.setup();
    render(<ExampleDatasetModal onClose={mockOnClose} />);

    const btn = screen.getByRole('button', { name: /accidents\.sav/i });
    await user.click(btn);

    expect(mockLoadDataset).toHaveBeenCalledWith('/exampleData/accidents.sav');
  });

  it('shows loading overlay when isLoading is true', () => {
    mockedUseExampleDatasetLogic.mockReturnValue({
      isLoading: true,
      error: null,
      loadDataset: mockLoadDataset,
    });

    render(<ExampleDatasetModal onClose={mockOnClose} />);
    // Check that the loading spinner is present using its test id
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is pressed', async () => {
    const user = userEvent.setup();
    render(<ExampleDatasetModal onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays an error message when error is present', () => {
    const errorMessage = 'Failed to load dataset';
    mockedUseExampleDatasetLogic.mockReturnValue({
      isLoading: false,
      error: errorMessage,
      loadDataset: mockLoadDataset,
    });

    render(<ExampleDatasetModal onClose={mockOnClose} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
}); 