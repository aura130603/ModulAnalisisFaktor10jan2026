import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ExportCsv } from '..'; // Adjust the import path as necessary

// Mock the custom hooks
jest.mock('../hooks/useExportCsv', () => ({
  useExportCsv: jest.fn(),
}));
jest.mock('../hooks/useTourGuide', () => ({
  useTourGuide: jest.fn(),
}));

// Import the mocked hooks
import { useExportCsv } from '../hooks/useExportCsv';
import { useTourGuide } from '../hooks/useTourGuide';

describe('ExportCsv Component', () => {
  const mockOnClose = jest.fn();
  const mockHandleChange = jest.fn();
  const mockHandleFilenameChange = jest.fn();
  const mockHandleExport = jest.fn();
  const mockStartTour = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementation for useExportCsv
    (useExportCsv as jest.Mock).mockReturnValue({
      exportOptions: {
        filename: '',
        delimiter: ',',
        includeHeaders: true,
        includeVariableProperties: false,
        quoteStrings: true,
        encoding: 'utf-8',
      },
      isExporting: false,
      handleChange: mockHandleChange,
      handleFilenameChange: mockHandleFilenameChange,
      handleExport: mockHandleExport,
    });

    // Setup default mock implementation for useTourGuide
    (useTourGuide as jest.Mock).mockReturnValue({
      tourActive: false,
      currentStep: 0,
      tourSteps: [],
      currentTargetElement: null,
      startTour: mockStartTour,
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      endTour: jest.fn(),
    });
  });

  it('renders all form elements correctly', () => {
    render(<ExportCsv onClose={mockOnClose} />);

    expect(screen.getByLabelText(/File Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Delimiter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Include variable names as header row/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Include variable properties as first row/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quote all string values/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Encoding/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start feature tour/i })).toBeInTheDocument();
  });

  it('disables the export button when filename is empty', () => {
    render(<ExportCsv onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: /Export/i })).toBeDisabled();
  });

  it('enables the export button when filename is not empty', () => {
    (useExportCsv as jest.Mock).mockReturnValueOnce({
      exportOptions: { filename: 'test-file', delimiter: ',', includeHeaders: true, includeVariableProperties: false, quoteStrings: true, encoding: 'utf-8' },
      isExporting: false,
      handleChange: mockHandleChange,
      handleFilenameChange: mockHandleFilenameChange,
      handleExport: mockHandleExport,
    });

    render(<ExportCsv onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: /Export/i })).toBeEnabled();
  });

  it('calls handleFilenameChange on filename input change', () => {
    render(<ExportCsv onClose={mockOnClose} />);
    const filenameInput = screen.getByLabelText(/File Name/i);
    fireEvent.change(filenameInput, { target: { value: 'new-file' } });
    expect(mockHandleFilenameChange).toHaveBeenCalledWith('new-file');
  });

  it('calls handleChange when a checkbox is clicked', async () => {
    render(<ExportCsv onClose={mockOnClose} />);
    const includeHeadersCheckbox = screen.getByLabelText(/Include variable names as header row/i);
    await user.click(includeHeadersCheckbox);
    expect(mockHandleChange).toHaveBeenCalledWith('includeHeaders', expect.any(Boolean));
  });

  it('calls handleExport when export button is clicked', async () => {
    (useExportCsv as jest.Mock).mockReturnValueOnce({
        exportOptions: { filename: 'test-file', delimiter: ',', includeHeaders: true, includeVariableProperties: false, quoteStrings: true, encoding: 'utf-8' },
        isExporting: false,
        handleChange: mockHandleChange,
        handleFilenameChange: mockHandleFilenameChange,
        handleExport: mockHandleExport,
      });
  
      render(<ExportCsv onClose={mockOnClose} />);
      const exportButton = screen.getByRole('button', { name: /Export/i });
      await user.click(exportButton);
      expect(mockHandleExport).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    render(<ExportCsv onClose={mockOnClose} />);
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loader when isExporting is true', () => {
    (useExportCsv as jest.Mock).mockReturnValueOnce({
        exportOptions: { filename: 'test-file', delimiter: ',', includeHeaders: true, includeVariableProperties: false, quoteStrings: true, encoding: 'utf-8' },
        isExporting: true,
        handleChange: mockHandleChange,
        handleFilenameChange: mockHandleFilenameChange,
        handleExport: mockHandleExport,
      });

    render(<ExportCsv onClose={mockOnClose} />);
    expect(screen.getByText(/Exporting.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exporting.../i })).toBeDisabled();
  });

  it('calls startTour when help button is clicked', async () => {
    render(<ExportCsv onClose={mockOnClose} />);
    const helpButton = screen.getByRole('button', { name: /Start feature tour/i });
    await user.click(helpButton);
    expect(mockStartTour).toHaveBeenCalledTimes(1);
  });
});
