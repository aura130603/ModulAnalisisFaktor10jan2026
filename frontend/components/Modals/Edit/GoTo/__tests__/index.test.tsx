import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GoToModal, { GoToMode } from '..';
import { GoToContent } from '../components/GoToContent';

// Mock the content component
jest.mock('../components/GoToContent', () => ({
    GoToContent: jest.fn(() => (
        <div>
            <span>Mocked GoToContent</span>
        </div>
    )),
}));

const mockGoToContent = GoToContent as jest.Mock;

describe('GoToModal', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders as a dialog by default and shows the title', () => {
        render(<GoToModal onClose={mockOnClose} />);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Go To')).toBeInTheDocument();
        expect(screen.getByText('Mocked GoToContent')).toBeInTheDocument();
    });

    it('renders as a sidebar when containerType is "sidebar"', () => {
        render(<GoToModal onClose={mockOnClose} containerType="sidebar" />);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByText('Mocked GoToContent')).toBeInTheDocument();
    });

    it('calls onClose when the "X" button in the header is clicked', async () => {
        const user = userEvent.setup();
        render(<GoToModal onClose={mockOnClose} />);

        // Find the DialogHeader first, then query for the button inside it.
        const dialogHeader = screen.getByRole('dialog').querySelector('.p-6.pb-0');
        const closeButton = within(dialogHeader as HTMLElement).getByRole('button', { name: /close/i });
        
        await user.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('passes the correct props to GoToContent', () => {
        render(<GoToModal onClose={mockOnClose} defaultMode={GoToMode.VARIABLE} />);

        expect(mockGoToContent).toHaveBeenCalledWith(
            expect.objectContaining({
                onClose: mockOnClose,
                defaultMode: GoToMode.VARIABLE,
            }),
            {}
        );
    });
}); 