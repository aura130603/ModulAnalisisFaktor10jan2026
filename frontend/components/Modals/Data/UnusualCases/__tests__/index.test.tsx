import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import IdentifyUnusualCases from '..';
import { useUnusualCases } from '../hooks/useUnusualCases';

// Mock child components to keep tests focused on the main component's logic
jest.mock('../VariablesTab', () => {
    const MockVariablesTab = () => <div>VariablesTabContent</div>;
    MockVariablesTab.displayName = 'MockVariablesTab';
    return MockVariablesTab;
});
jest.mock('../OptionsTab', () => {
    const MockOptionsTab = () => <div>OptionsTabContent</div>;
    MockOptionsTab.displayName = 'MockOptionsTab';
    return MockOptionsTab;
});

// Mock hooks
jest.mock('../hooks/useUnusualCases');
jest.mock('../hooks/useTourGuide', () => ({
    useTourGuide: () => ({ tourActive: false, startTour: jest.fn() }),
}));

const mockedUseUnusualCases = useUnusualCases as jest.Mock;

describe('IdentifyUnusualCases Dialog', () => {
    const mockOnClose = jest.fn();
    const mockHandleReset = jest.fn();

    const setupDefaultHookMock = () => {
        const mockHandleConfirm = jest.fn(() => mockOnClose());

        mockedUseUnusualCases.mockReturnValue({
            handleReset: mockHandleReset,
            handleConfirm: mockHandleConfirm,
            // Other properties used by IdentifyUnusualCases (only what's needed for these tests)
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        setupDefaultHookMock();
    });

    const renderComponent = () => {
        return render(<IdentifyUnusualCases onClose={mockOnClose} />);
    };

    it('should render the dialog with the correct title and tabs', () => {
        renderComponent();
        expect(screen.getByText('Identify Unusual Cases')).toBeInTheDocument();
        expect(screen.getByText('Variables')).toBeInTheDocument();
        expect(screen.getByText('Options')).toBeInTheDocument();
    });

    it('should show Variables tab content by default and switch to other tabs', async () => {
        const user = userEvent.setup();
        renderComponent();

        expect(screen.getByText('VariablesTabContent')).toBeVisible();

        await user.click(screen.getByRole('tab', { name: 'Options' }));
        expect(screen.getByText('OptionsTabContent')).toBeVisible();
        expect(screen.queryByText('VariablesTabContent')).not.toBeInTheDocument();
    });

    it('should call onClose when the Cancel button is clicked', async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
    
    it('should call handleReset when the Reset button is clicked', async () => {
        const user = userEvent.setup();
        renderComponent();

        await user.click(screen.getByRole('button', { name: 'Reset' }));
        expect(mockHandleReset).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when the OK button is clicked', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        // The internal handleConfirm calls onClose, which is the observable behavior we can test.
        await user.click(screen.getByRole('button', { name: 'OK' }));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
