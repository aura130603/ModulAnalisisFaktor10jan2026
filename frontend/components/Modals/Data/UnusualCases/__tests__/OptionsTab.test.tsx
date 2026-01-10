import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import OptionsTab from '../OptionsTab';
import type { OptionsTabProps } from '../types';

describe('OptionsTab Component', () => {
    const mockSetIdentificationCriteria = jest.fn();
    const mockSetPercentageValue = jest.fn();
    const mockSetFixedNumber = jest.fn();
    const mockSetUseMinimumValue = jest.fn();
    const mockSetCutoffValue = jest.fn();
    const mockSetMinPeerGroups = jest.fn();
    const mockSetMaxPeerGroups = jest.fn();
    const mockSetMaxReasons = jest.fn();

    const defaultProps: OptionsTabProps = {
        identificationCriteria: 'percentage',
        setIdentificationCriteria: mockSetIdentificationCriteria,
        percentageValue: '5',
        setPercentageValue: mockSetPercentageValue,
        fixedNumber: '5',
        setFixedNumber: mockSetFixedNumber,
        useMinimumValue: true,
        setUseMinimumValue: mockSetUseMinimumValue,
        cutoffValue: '2',
        setCutoffValue: mockSetCutoffValue,
        minPeerGroups: '2',
        setMinPeerGroups: mockSetMinPeerGroups,
        maxPeerGroups: '5',
        setMaxPeerGroups: mockSetMaxPeerGroups,
        maxReasons: '3',
        setMaxReasons: mockSetMaxReasons,
    };

    const renderComponent = (props: Partial<OptionsTabProps> = {}) => {
        return render(<OptionsTab {...defaultProps} {...props} />);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all controls with default values', () => {
        renderComponent();
        expect(screen.getByLabelText('Percentage of cases with highest anomaly index values')).toBeChecked();
        expect(screen.getByLabelText('Percentage:')).toHaveValue('5');
        expect(screen.getByLabelText('Fixed number of cases with highest anomaly index values')).not.toBeChecked();
        expect(screen.getByLabelText('Number:')).toHaveValue('5');
        expect(screen.getByLabelText(/Identify only cases whose anomaly index/i)).toBeChecked();
        expect(screen.getByLabelText('Cutoff:')).toHaveValue('2');
    });

    it('calls setIdentificationCriteria when radio button is changed', async () => {
        const user = userEvent.setup();
        renderComponent();
        await user.click(screen.getByLabelText('Fixed number of cases with highest anomaly index values'));
        expect(mockSetIdentificationCriteria).toHaveBeenCalledWith('fixed');
    });
    
    it('calls setPercentageValue on input change', async () => {
        const user = userEvent.setup();
        renderComponent();
        const input = screen.getByLabelText('Percentage:');
        await user.clear(input);
        await user.type(input, '10');
        expect(mockSetPercentageValue).toHaveBeenCalledWith('10');
    });
    
    it('disables inputs based on criteria selection', () => {
        const { rerender } = renderComponent({ identificationCriteria: 'percentage' });

        // First state: percentage selected
        expect(screen.getByLabelText('Percentage:')).toBeEnabled();
        expect(screen.getByLabelText('Number:')).toBeDisabled();

        // Second state: switch to fixed
        rerender(
            <OptionsTab
                {...defaultProps}
                identificationCriteria="fixed"
            />
        );

        expect(screen.getByLabelText('Percentage:')).toBeDisabled();
        expect(screen.getByLabelText('Number:')).toBeEnabled();
    });

    it('disables cutoff input when minimum value checkbox is unchecked', () => {
        renderComponent({ useMinimumValue: false });
        expect(screen.getByLabelText('Cutoff:')).toBeDisabled();
    });

    it('calls setUseMinimumValue when checkbox is toggled', async () => {
        const user = userEvent.setup();
        renderComponent({ useMinimumValue: true });
        const checkbox = screen.getByLabelText(/Identify only cases whose anomaly index/i);
        await user.click(checkbox);
        expect(mockSetUseMinimumValue).toHaveBeenCalledWith(false);
    });

}); 