import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportExcelSelectionStep } from '../components/ImportExcelSelectionStep';

describe('ImportExcelSelectionStep Component', () => {
  const mockOnClose = jest.fn();
  const mockOnFileSelect = jest.fn();
  const mockOnContinue = jest.fn();
  
  const defaultProps = {
    onClose: mockOnClose,
    onFileSelect: mockOnFileSelect,
    onContinue: mockOnContinue,
    isLoading: false,
    error: null,
    selectedFile: null,
    isMobile: false,
    isPortrait: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<ImportExcelSelectionStep {...defaultProps} />);
    expect(screen.getByText('Import Excel File')).toBeInTheDocument();
    expect(screen.getByText('Click to select an Excel file')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('calls onFileSelect when a file is chosen', async () => {
    render(<ImportExcelSelectionStep {...defaultProps} />);
    const file = new File(['hello'], 'hello.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const input = screen.getByLabelText(/click to select an excel file/i);

    await userEvent.upload(input, file);
    
    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('displays the selected file name and enables continue button', () => {
    const file = new File(['hello'], 'my-data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    render(<ImportExcelSelectionStep {...defaultProps} selectedFile={file} />);
    
    expect(screen.getByText('my-data.xlsx')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
  });

  it('calls onContinue when continue button is clicked', async () => {
    const user = userEvent.setup();
    const file = new File(['hello'], 'my-data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    render(<ImportExcelSelectionStep {...defaultProps} selectedFile={file} />);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);

    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });
  
  it('displays an error message when error prop is provided', () => {
    const errorMessage = 'This is an error';
    render(<ImportExcelSelectionStep {...defaultProps} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows loading state on continue button when isLoading is true', () => {
    const file = new File(['hello'], 'my-data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    render(<ImportExcelSelectionStep {...defaultProps} selectedFile={file} isLoading={true} />);
    
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('clears the file when the "X" button is clicked', async () => {
    const user = userEvent.setup();
    const file = new File(['hello'], 'my-data.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    render(<ImportExcelSelectionStep {...defaultProps} selectedFile={file} />);

    expect(screen.getByText('my-data.xlsx')).toBeInTheDocument();
    
    const clearButton = screen.getByRole('button', { name: /remove file/i });
    await user.click(clearButton);

    expect(mockOnFileSelect).toHaveBeenCalledWith(null);
  });

}); 