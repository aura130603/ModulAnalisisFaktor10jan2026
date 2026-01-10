import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortVarsUI } from '../SortVarsUI';
import type { SortVarsUIProps } from '../types';

const mockHandleOk = jest.fn();
const mockHandleReset = jest.fn();
const mockHandleSelectColumn = jest.fn();
const mockSetSortOrder = jest.fn();
const mockOnClose = jest.fn();

const defaultProps: SortVarsUIProps = {
  columns: ['Name', 'Type', 'Label'],
  selectedColumn: null,
  sortOrder: 'asc',
  handleOk: mockHandleOk,
  handleReset: mockHandleReset,
  handleSelectColumn: mockHandleSelectColumn,
  setSortOrder: mockSetSortOrder,
  onClose: mockOnClose,
  containerType: 'dialog',
};

const renderComponent = (props: Partial<SortVarsUIProps> = {}) => {
  render(<SortVarsUI {...defaultProps} {...props} />);
};

describe('SortVarsUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with initial state', () => {
    renderComponent();
    expect(screen.getByText('Sort Variables')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /ascending/i })).toBeChecked();
  });

  it('calls handleSelectColumn when a column item is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nameColumn = screen.getByText('Name');
    await user.click(nameColumn);

    expect(mockHandleSelectColumn).toHaveBeenCalledWith('Name');
  });

  it('calls setSortOrder when a radio button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const descendingRadio = screen.getByRole('radio', { name: /descending/i });
    await user.click(descendingRadio);
    
    expect(mockSetSortOrder).toHaveBeenCalledWith('desc');
  });

  it('calls handleOk when the OK button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const okButton = screen.getByRole('button', { name: /ok/i });
    await user.click(okButton);

    expect(mockHandleOk).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls handleReset when the Reset button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    expect(mockHandleReset).toHaveBeenCalledTimes(1);
  });

  it('highlights the selected column', () => {
    renderComponent({ selectedColumn: 'Type' });
    const typeColumn = screen.getByText('Type');
    expect(typeColumn).toHaveClass('bg-primary/10');
  });
}); 