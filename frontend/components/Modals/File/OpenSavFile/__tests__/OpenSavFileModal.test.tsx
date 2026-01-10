import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpenSavFileModal } from '../index';
import { useOpenSavFileLogic } from '../hooks/useOpenSavFileLogic';

// Mock the logic hook
jest.mock('../hooks/useOpenSavFileLogic');
const mockedUseOpenSavFileLogic = useOpenSavFileLogic as unknown as jest.Mock;

describe('OpenSavFileModal Component', () => {
  const mockHandleFileChange = jest.fn();
  const mockHandleSubmit = jest.fn();
  const mockClearError = jest.fn();
  const mockHandleModalClose = jest.fn();

  const mockFile = new File(['content'], 'test.sav', { type: 'application/octet-stream' });

  // Helper to set up the mock return value
  const setupMockHook = (props: Partial<ReturnType<typeof useOpenSavFileLogic>> = {}) => {
    mockedUseOpenSavFileLogic.mockReturnValue({
      file: null,
      isLoading: false,
      error: null,
      isMobile: false,
      isPortrait: false,
      handleFileChange: mockHandleFileChange,
      clearError: mockClearError,
      handleSubmit: mockHandleSubmit,
      handleModalClose: mockHandleModalClose,
      ...props,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMockHook(); // Setup with default mock values
  });

  it('renders initial state correctly', () => {
    render(<OpenSavFileModal onClose={mockHandleModalClose} containerType="dialog" />);
    expect(screen.getByText(/click to select a .sav file/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open/i })).toBeDisabled();
  });

  it('calls handleFileChange when a file is selected via input', async () => {
    render(<OpenSavFileModal onClose={mockHandleModalClose} containerType="dialog" />);
    const input = screen.getByLabelText(/click to select a .sav file/i); // Assuming label text points to the dropzone which has an input
    await userEvent.upload(input, mockFile);
    expect(mockHandleFileChange).toHaveBeenCalledWith(mockFile);
  });
  
  it('displays the selected file name and enables the Open button', () => {
    setupMockHook({ file: mockFile });
    const { getByTestId } = render(<OpenSavFileModal onClose={mockHandleModalClose} containerType="dialog" />);
    const selectedFileDisplay = getByTestId('selected-file-info');
    expect(within(selectedFileDisplay).getByText(mockFile.name)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open/i })).not.toBeDisabled();
  });

  it('calls handleSubmit when the Open button is clicked', async () => {
    setupMockHook({ file: mockFile });
    render(<OpenSavFileModal onClose={mockHandleModalClose} containerType="dialog" />);
    const openButton = screen.getByRole('button', { name: /open/i });
    await userEvent.click(openButton);
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it('displays an error message', () => {
    const errorMessage = 'Invalid file.';
    setupMockHook({ error: errorMessage });
    render(<OpenSavFileModal onClose={mockHandleModalClose} containerType="dialog" />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    setupMockHook({ isLoading: true, file: mockFile });
    render(<OpenSavFileModal onClose={mockHandleModalClose} containerType="dialog" />);
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
}); 