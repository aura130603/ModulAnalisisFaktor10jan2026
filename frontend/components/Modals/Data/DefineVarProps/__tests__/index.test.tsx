import React from 'react';
import { render, screen } from '@testing-library/react';
import DefineVariableProps from '../index';
import { useDefineVarProps } from '../hooks/useDefineVarProps';

jest.mock('../hooks/useDefineVarProps');
jest.mock('../VariablesToScan', () => ({
    __esModule: true,
    default: jest.fn(() => <div>Mocked VariablesToScan</div>)
}));
jest.mock('../PropertiesEditor', () => ({
    __esModule: true,
    default: jest.fn(() => <div>Mocked PropertiesEditor</div>)
}));

const mockedUseDefineVarProps = useDefineVarProps as jest.Mock;

describe('DefineVariableProps', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render VariablesToScan when currentStep is "scan"', () => {
        mockedUseDefineVarProps.mockReturnValue({
            currentStep: 'scan',
            selectedVariables: [],
            limits: { caseLimit: '50', valueLimit: '200' },
            handleContinueToEditor: jest.fn(),
        });

        render(<DefineVariableProps onClose={jest.fn()} />);

        expect(screen.getByText('Mocked VariablesToScan')).toBeInTheDocument();
        expect(screen.queryByText('Mocked PropertiesEditor')).not.toBeInTheDocument();
    });

    it('should render PropertiesEditor when currentStep is "editor"', () => {
        mockedUseDefineVarProps.mockReturnValue({
            currentStep: 'editor',
            selectedVariables: [],
            limits: { caseLimit: '50', valueLimit: '200' },
            handleContinueToEditor: jest.fn(),
        });

        render(<DefineVariableProps onClose={jest.fn()} />);

        expect(screen.getByText('Mocked PropertiesEditor')).toBeInTheDocument();
        expect(screen.queryByText('Mocked VariablesToScan')).not.toBeInTheDocument();
    });
}); 