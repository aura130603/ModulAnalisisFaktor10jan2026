import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportExcel } from '../index';
import { useExportExcelLogic } from '../hooks/useExportExcelLogic';
import { useTourGuide } from '../hooks/useTourGuide';
import type { ExportExcelLogicState } from '../types';

// Mock the logic hook
jest.mock('../hooks/useExportExcelLogic');
jest.mock('../hooks/useTourGuide');
const mockedUseExportExcelLogic = useExportExcelLogic as unknown as jest.Mock;
const mockedUseTourGuide = useTourGuide as unknown as jest.Mock;

describe('ExportExcel Component', () => {
  const mockOnClose = jest.fn();
  const mockHandleChange = jest.fn();
  const mockHandleFilenameChange = jest.fn();
  const mockHandleExport = jest.fn();
  const mockStartTour = jest.fn();
  const user = userEvent.setup();

  const defaultState: ExportExcelLogicState = {
    filename: 'test-file',
    format: 'xlsx',
    includeHeaders: true,
    includeVariableProperties: true,
    includeMetadataSheet: true,
    includeDataLabels: false,
    applyHeaderStyling: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseExportExcelLogic.mockReturnValue({
      exportOptions: defaultState,
      isExporting: false,
      handleChange: mockHandleChange,
      handleFilenameChange: mockHandleFilenameChange,
      handleExport: mockHandleExport,
    });

    mockedUseTourGuide.mockReturnValue({
      tourActive: false,
      startTour: mockStartTour,
    });
  });

  it('should render form elements with initial values from hook', () => {
    render(<ExportExcel onClose={mockOnClose} />);

    expect(screen.getByLabelText(/file name/i)).toHaveValue('test-file');
    expect(screen.getByText('Excel Workbook (*.xlsx)')).toBeInTheDocument(); // For Select component
    expect(screen.getByLabelText(/include variable names as header row/i)).toBeChecked();
    expect(screen.getByLabelText(/apply basic header styling/i)).toBeChecked();
    expect(screen.getByLabelText(/represent missing data with sysmis text/i)).not.toBeChecked();
  });

  it('should call handleFilenameChange on filename input', () => {
    render(<ExportExcel onClose={mockOnClose} />);
    const filenameInput = screen.getByLabelText(/file name/i);
    fireEvent.change(filenameInput, { target: { value: 'new-name' } });
    expect(mockHandleFilenameChange).toHaveBeenCalledWith('new-name');
  });

  it('should call handleChange when a checkbox is clicked', async () => {
    render(<ExportExcel onClose={mockOnClose} />);
    const headerCheckbox = screen.getByLabelText(/include variable names as header row/i);
    await user.click(headerCheckbox);
    expect(mockHandleChange).toHaveBeenCalledWith('includeHeaders', false);
  });

  it('should call handleExport when Export button is clicked', async () => {
    render(<ExportExcel onClose={mockOnClose} />);
    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);
    expect(mockHandleExport).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Cancel button is clicked', async () => {
    render(<ExportExcel onClose={mockOnClose} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should disable export button when filename is empty', () => {
    mockedUseExportExcelLogic.mockReturnValue({
      exportOptions: { ...defaultState, filename: '   ' }, // a filename with only spaces
      isExporting: false,
      handleChange: mockHandleChange,
      handleFilenameChange: mockHandleFilenameChange,
      handleExport: mockHandleExport,
    });
    render(<ExportExcel onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
  });

  it('should disable all inputs when isExporting is true', () => {
    mockedUseExportExcelLogic.mockReturnValue({
      exportOptions: defaultState,
      isExporting: true,
      handleChange: mockHandleChange,
      handleFilenameChange: mockHandleFilenameChange,
      handleExport: mockHandleExport,
    });
    render(<ExportExcel onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: /exporting/i })).toBeDisabled();
    expect(screen.getByLabelText(/file name/i)).toBeDisabled();
    expect(screen.getByLabelText(/include variable names as header row/i)).toBeDisabled();
  });

  it('should call startTour when help button is clicked', async () => {
    render(<ExportExcel onClose={mockOnClose} />);
    // The button might not have a text label, so find by tooltip or aria-label
    // Looking at the component, it has a tooltip with "Mulai tour fitur"
    // Let's find by role and a contained element
    const helpButton = screen.getByTestId('start-tour-button');
    await user.click(helpButton);
    expect(mockStartTour).toHaveBeenCalledTimes(1);
  });
}); 