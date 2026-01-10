import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FindAndReplaceModal } from '..';
import { FindReplaceMode } from '../types';
import '@testing-library/jest-dom';

jest.mock('../components/FindReplaceContent', () => ({
  FindReplaceContent: jest.fn(({ onClose }) => (
    <div>
      <span>Mocked Content</span>
      <button onClick={onClose}>Close Content</button>
    </div>
  )),
}));

const mockOnClose = jest.fn();
// Import after jest.mock so the mocked module is used
import { FindReplaceContent } from '../components/FindReplaceContent';

describe('FindAndReplaceModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render as a dialog by default', () => {
    render(<FindAndReplaceModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Find and Replace')).toBeInTheDocument();
    expect(screen.getByText('Mocked Content')).toBeInTheDocument();
  });

  it('should call onClose when the close button in the header is clicked', async () => {
    render(<FindAndReplaceModal isOpen={true} onClose={mockOnClose} />);
    const user = userEvent.setup();

    const dialog = screen.getByRole('dialog', { name: /find and replace/i });
    const heading = within(dialog).getByRole('heading', { name: /find and replace/i });
    const closeButton = within(heading).getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render as a sidebar when containerType is "sidebar"', () => {
    render(
      <FindAndReplaceModal
        isOpen={true}
        onClose={mockOnClose}
        containerType="sidebar"
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Mocked Content')).toBeInTheDocument();
  });

  it('should pass correct props to FindReplaceContent', () => {
    render(
      <FindAndReplaceModal
        isOpen={true}
        onClose={mockOnClose}
        defaultTab={FindReplaceMode.REPLACE}
      />
    );

    expect(FindReplaceContent).toHaveBeenCalledWith(
      expect.objectContaining({
        onClose: mockOnClose,
        defaultTab: FindReplaceMode.REPLACE,
      }),
      {}
    );
  });
}); 