import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RestructureDataWizard from '../index';
import type { UseRestructureReturn} from '../hooks/useRestructure';
import { useRestructure, RestructureMethod } from '../hooks/useRestructure';
import type { Variable } from '@/types/Variable';

jest.mock('../hooks/useRestructure');

const mockedUseRestructure = useRestructure as jest.Mock;

const getMockHookValues = (overrides: Partial<UseRestructureReturn> = {}): UseRestructureReturn => ({
    currentStep: 1,
    activeTab: 'type',
    method: RestructureMethod.VariablesToCases,
    availableVariables: [{ id: 1, name: 'var1', tempId: '1', columnIndex: 0 } as Variable],
    selectedVariables: [],
    indexVariables: [],
    identifierVariables: [],
    highlightedVariable: null,
    createCount: false,
    createIndex: true,
    dropEmptyVariables: false,
    validationErrors: [],
    setCurrentStep: jest.fn(),
    setActiveTab: jest.fn(),
    setMethod: jest.fn(),
    setHighlightedVariable: jest.fn(),
    setCreateCount: jest.fn(),
    setCreateIndex: jest.fn(),
    setDropEmptyVariables: jest.fn(),
    handleNext: jest.fn(),
    handleBack: jest.fn(),
    handleFinish: jest.fn(),
    handleMoveVariable: jest.fn(),
    handleReorderVariable: jest.fn(),
    validateCurrentStep: jest.fn().mockReturnValue([]),
    prepareVariablesWithTempId: jest.fn(vars => vars.map(v => ({...v, tempId: v.columnIndex.toString()}))),
    ...overrides,
});

describe('RestructureDataWizard UI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render step 1 with disabled tabs and correct default selection', () => {
        mockedUseRestructure.mockReturnValue(getMockHookValues());
        render(<RestructureDataWizard onClose={jest.fn()} />);

        expect(screen.getAllByText(/Select Restructure Method/i)[0]).toBeInTheDocument();
        
        // Check tabs state
        expect(screen.getByRole('tab', { name: 'Method' })).not.toBeDisabled();
        expect(screen.getByRole('tab', { name: 'Variables' })).toBeDisabled();
        expect(screen.getByRole('tab', { name: 'Options' })).toBeDisabled();
        
        // Check default radio button
        const variablesToCasesRadio = screen.getByText('Variables to Cases').parentElement?.parentElement?.querySelector('input[type="radio"]');
        expect(variablesToCasesRadio).toBeChecked();
    });

    it('should show correct variable lists on step 2 for "Variables to Cases"', async () => {
        const mockHandleNext = jest.fn().mockImplementation(() => {
            const currentMock = mockedUseRestructure.mock.results[0].value;
            mockedUseRestructure.mockReturnValue({
                ...currentMock,
                currentStep: 2,
                activeTab: 'variables',
            });
            rerender(<RestructureDataWizard onClose={jest.fn()} />);
        });
        mockedUseRestructure.mockReturnValue(getMockHookValues({ handleNext: mockHandleNext }));

        const { rerender } = render(<RestructureDataWizard onClose={jest.fn()} />);
        
        const nextButton = screen.getByRole('button', { name: /next/i });
        await userEvent.click(nextButton);

        expect(mockHandleNext).toHaveBeenCalled();
        expect(screen.getByText('Variables to Restructure')).toBeInTheDocument();
        expect(screen.getByText(/Index Variables/)).toBeInTheDocument();
        expect(screen.queryByText(/Identifier Variables/)).not.toBeInTheDocument();
    });

    it('should show correct variable lists on step 2 for "Cases to Variables"', async () => {
        const mockHandleNext = jest.fn().mockImplementation(() => {
            const currentMock = mockedUseRestructure.mock.results[0].value;
            mockedUseRestructure.mockReturnValue({
                ...currentMock,
                method: RestructureMethod.CasesToVariables,
                currentStep: 2,
                activeTab: 'variables',
            });
            rerender(<RestructureDataWizard onClose={jest.fn()} />);
        });
        mockedUseRestructure.mockReturnValue(getMockHookValues({ 
            method: RestructureMethod.CasesToVariables,
            handleNext: mockHandleNext 
        }));

        const { rerender } = render(<RestructureDataWizard onClose={jest.fn()} />);
        await userEvent.click(screen.getByRole('button', { name: /next/i }));

        expect(mockHandleNext).toHaveBeenCalled();
        expect(screen.getByText('Variables to Restructure')).toBeInTheDocument();
        expect(screen.getByText(/Identifier Variables/)).toBeInTheDocument();
        expect(screen.getByText(/Index Variables \(e\.g\., Subject ID\)/)).toBeInTheDocument();
    });

    it('should show correct options on step 3 for "Variables to Cases"', async () => {
         mockedUseRestructure.mockReturnValue(getMockHookValues({
            currentStep: 3,
            activeTab: 'options',
            method: RestructureMethod.VariablesToCases,
        }));
        render(<RestructureDataWizard onClose={jest.fn()} />);

        expect(screen.getByLabelText(/Create count variable/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Create index variable/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Drop empty variables/i)).not.toBeInTheDocument();
    });

    it('should display validation errors when they exist', () => {
        mockedUseRestructure.mockReturnValue(getMockHookValues({
            validationErrors: ['This is a test error.'],
        }));

        render(<RestructureDataWizard onClose={jest.fn()} />);
        
        expect(screen.getByText('This is a test error.')).toBeInTheDocument();
    });
});