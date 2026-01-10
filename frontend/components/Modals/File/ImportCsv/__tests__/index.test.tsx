import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImportCsv } from '..';
import { useImportCsvFileReader } from '../hooks/useImportCsvFileReader';
import { ImportCsvSelection } from '../components/ImportCsvSelection';
import { ImportCsvConfiguration } from '../components/ImportCsvConfiguration';
import { useToast } from '@/hooks/use-toast';

// Mock child components
jest.mock('../components/ImportCsvSelection', () => ({
  ImportCsvSelection: jest.fn(({ onFileSelect, onContinue, selectedFile, isLoading, error }) => (
    <div>
      <h1>Selection Stage</h1>
      {error && <div data-testid="error-message">{error}</div>}
      <input 
        type="file" 
        data-testid="file-input" 
        onChange={(e) => onFileSelect(e.target.files ? e.target.files[0] : null)} 
      />
      <button onClick={onContinue} disabled={!selectedFile || isLoading}>
        {isLoading ? 'Loading...' : 'Continue'}
      </button>
    </div>
  )),
}));

jest.mock('../components/ImportCsvConfiguration', () => ({
  ImportCsvConfiguration: jest.fn(({ onBack, fileName }) => (
    <div>
      <h1>Configuration Stage</h1>
      <p>File: {fileName}</p>
      <button onClick={onBack}>Back</button>
    </div>
  )),
}));

// Mock the custom hooks
jest.mock('../hooks/useImportCsvFileReader');
jest.mock('@/hooks/use-toast');

const mockUseImportCsvFileReader = useImportCsvFileReader as jest.Mock;
const mockUseToast = useToast as jest.Mock;

describe('ImportCsv Component', () => {
  const mockOnClose = jest.fn();
  const mockToast = jest.fn();
  let mockReadFile: jest.Mock;
  let mockResetFileState: jest.Mock;

  // Use a mutable object to allow tests to dynamically change hook values
  let hookState: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReadFile = jest.fn();
    mockResetFileState = jest.fn(() => {
      // When reset is called, simulate the hook state resetting
      hookState.fileName = '';
      hookState.fileContent = null;
      hookState.error = null;
      hookState.isLoading = false;
    });

    hookState = {
      fileName: '',
      fileContent: null,
      error: null,
      isLoading: false,
      readFile: mockReadFile,
      resetFileState: mockResetFileState,
    };

    mockUseImportCsvFileReader.mockImplementation(() => hookState);

    // Mock useToast hook
    mockUseToast.mockReturnValue({
      toast: mockToast
    });
  });

  const TestWrapper = () => <ImportCsv onClose={mockOnClose} containerType="dialog" />;

  it('should render the selection stage initially', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Selection Stage')).toBeInTheDocument();
    expect(ImportCsvSelection).toHaveBeenCalledWith(expect.objectContaining({ isLoading: false, error: null }), {});
  });

  it('should call readFile when continuing from selection', () => {
    render(<TestWrapper />);
    
    const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-input');
    const continueButton = screen.getByRole('button', { name: /Continue/i });

    // Select a file
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Click continue
    fireEvent.click(continueButton);

    expect(mockReadFile).toHaveBeenCalledWith(file);
  });

  it('should transition to configure stage after file is read successfully', async () => {
    const { rerender } = render(<TestWrapper />);

    // 1. Simulate file selection and continue click
    const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(mockReadFile).toHaveBeenCalledWith(file);

    // 2. Simulate the hook finishing reading the file
    act(() => {
      hookState.isLoading = false;
      hookState.fileContent = 'a,b,c';
      hookState.fileName = 'test.csv';
    });

    rerender(<TestWrapper />);

    // The component's useEffect will trigger the stage change
    await waitFor(() => {
        expect(screen.getByText('Configuration Stage')).toBeInTheDocument();
    });
    expect(ImportCsvConfiguration).toHaveBeenCalledWith(expect.objectContaining({ fileName: 'test.csv' }), {});
  });
  
  it('should transition back to select stage from configure stage', async () => {
    // 1. Get to configure stage
    const { rerender } = render(<TestWrapper />);
    const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
    act(() => {
      hookState.fileContent = 'a,b,c';
      hookState.fileName = 'test.csv';
    });
    rerender(<TestWrapper />);
    await waitFor(() => {
        expect(screen.getByText('Configuration Stage')).toBeInTheDocument();
    });

    // 2. Click the back button
    const backButton = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backButton);
    
    // The reset mock will update the hook state
    rerender(<TestWrapper />);

    // 3. Assert we are back to the selection stage
    await waitFor(() => {
        expect(screen.getByText('Selection Stage')).toBeInTheDocument();
    });
    expect(mockResetFileState).toHaveBeenCalledTimes(1);
  });

  it('should show loading state on continue button while file is being read', () => {
    const { rerender } = render(<TestWrapper />);
    
    act(() => {
      hookState.isLoading = true;
    });
    rerender(<TestWrapper />);

    expect(screen.getByRole('button', { name: /Loading.../i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Loading.../i })).toBeDisabled();
  });

  it('should display an error message if file reading fails', async () => {
    const { rerender } = render(<TestWrapper />);
    const errorMessage = 'File read failed';

    act(() => {
        hookState.error = errorMessage;
    });
    rerender(<TestWrapper />);
    
    await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });
  });
});
