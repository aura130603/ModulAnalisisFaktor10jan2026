import React from 'react';
import { render, screen } from '@testing-library/react';
import SetMeasurementLevel from '../index';
import { useSetMeasurementLevel } from '../hooks/useSetMeasurementLevel';
import { SetMeasurementLevelUI } from '../SetMeasurementLevelUI';

jest.mock('../hooks/useSetMeasurementLevel');
jest.mock('../SetMeasurementLevelUI', () => ({
    __esModule: true,
    SetMeasurementLevelUI: jest.fn(() => <div>Mocked UI</div>),
}));

const mockUseSetMeasurementLevel = useSetMeasurementLevel as jest.Mock;
const mockSetMeasurementLevelUI = SetMeasurementLevelUI as jest.Mock;

describe('SetMeasurementLevel Integration', () => {
    const mockOnClose = jest.fn();
    const mockHookValues = {
        unknownVariables: [],
        nominalVariables: [],
        ordinalVariables: [],
        scaleVariables: [],
        handleSave: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSetMeasurementLevel.mockReturnValue(mockHookValues);
    });

    it('should connect the hook with the UI component', () => {
        render(<SetMeasurementLevel onClose={mockOnClose} />);

        // Periksa apakah hook dipanggil dengan benar
        expect(mockUseSetMeasurementLevel).toHaveBeenCalledWith({ onClose: mockOnClose });

        // Periksa apakah komponen UI dirender dengan props dari hook
        expect(mockSetMeasurementLevelUI).toHaveBeenCalledWith(
            expect.objectContaining({
                ...mockHookValues,
                onClose: mockOnClose,
            }),
            {}
        );

        // Periksa apakah UI yang di-mock dirender
        expect(screen.getByText('Mocked UI')).toBeInTheDocument();
    });
}); 