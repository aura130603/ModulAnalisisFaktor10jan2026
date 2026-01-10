import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DefineDateTime from '..';
import { useDefineDateTime } from '../hooks/useDefineDateTime';

// Mock the custom hook
jest.mock('../hooks/useDefineDateTime');
const mockedUseDefineDateTime = useDefineDateTime as jest.Mock;

describe('DefineDateTime Component', () => {
    const mockOnClose = jest.fn();
    const mockHandleOk = jest.fn();
    const mockHandleReset = jest.fn();
    const mockSetSelectedCase = jest.fn();
    const mockHandleInputChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Provide a default mock implementation for the hook
        mockedUseDefineDateTime.mockReturnValue({
            casesAreOptions: ['Years, quarters, months', 'Years, months', 'Days'],
            selectedCase: 'Years, quarters, months',
            setSelectedCase: mockSetSelectedCase,
            timeComponents: [
                { name: 'Year', value: 1990, periodicity: null },
                { name: 'Quarter', value: 1, periodicity: 4 },
                { name: 'Month', value: 1, periodicity: 12 },
            ],
            handleInputChange: mockHandleInputChange,
            handleOk: mockHandleOk,
            handleReset: mockHandleReset,
            currentDatesFormatted: '1990-Q1-M1',
        });
    });

    const renderComponent = () => {
        return render(<DefineDateTime onClose={mockOnClose} />);
    };

    it('should render the component with title and initial state', () => {
        renderComponent();
        expect(screen.getByText('Define Dates')).toBeInTheDocument();
        expect(screen.getByText('Years, quarters, months')).toBeInTheDocument();
        expect(screen.getByLabelText('Year:')).toHaveValue(1990);
        expect(screen.getByLabelText('Quarter:')).toHaveValue(1);
    });

    it('should call handleOk when the OK button is clicked', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const okButton = screen.getByRole('button', { name: /ok/i });
        await user.click(okButton);

        expect(mockHandleOk).toHaveBeenCalledTimes(1);
    });

    it('should call handleReset when the Reset button is clicked', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const resetButton = screen.getByRole('button', { name: /reset/i });
        await user.click(resetButton);

        expect(mockHandleReset).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when the Cancel button is clicked', async () => {
        const user = userEvent.setup();
        renderComponent();
        
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call setSelectedCase when a "Cases Are" option is clicked', async () => {
        const user = userEvent.setup();
        renderComponent();

        const yearsMonthsOption = screen.getByText('Years, months');
        await user.click(yearsMonthsOption);

        expect(mockSetSelectedCase).toHaveBeenCalledWith('Years, months');
    });

    it('should call handleInputChange when a time component value is changed', () => {
        renderComponent();
        
        const yearInput = screen.getByLabelText('Year:');
        fireEvent.change(yearInput, { target: { value: '2023' } });

        // The first argument is the index of the component (0 for Year)
        // The second argument is the new value, parsed as a number
        expect(mockHandleInputChange).toHaveBeenCalledWith(0, 2023);
    });

    it('should render an info message if no time components are available', () => {
        // Override the mock for this specific test
        mockedUseDefineDateTime.mockReturnValue({
            ...mockedUseDefineDateTime(),
            timeComponents: [],
        });

        renderComponent();

        expect(screen.getByText('No date components to configure')).toBeInTheDocument();
    });
});
