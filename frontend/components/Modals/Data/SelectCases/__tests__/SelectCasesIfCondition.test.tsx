import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SelectCasesIfCondition from '../dialogs/SelectCasesIfCondition';
import type { Variable } from '@/types/Variable';
import { Dialog } from '@/components/ui/dialog';

const mockVariables: Variable[] = [
    { name: 'age', columnIndex: 0, type: 'NUMERIC', label: 'Age', measure: 'scale', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' },
    { name: 'gender', columnIndex: 1, type: 'STRING', label: 'Gender', measure: 'nominal', role: 'input', values: [], missing: null, decimals: 0, width: 8, columns: 12, align: 'left' }
];

describe('SelectCasesIfCondition Dialog', () => {
    const onContinue = jest.fn();
    const onClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<Dialog open={true}><SelectCasesIfCondition variables={mockVariables} onClose={onClose} onContinue={onContinue} /></Dialog>);
        expect(screen.getByText('Select Cases: If Condition')).toBeInTheDocument();
        expect(screen.getByText('Variables:')).toBeInTheDocument();
        expect(screen.getByText('age')).toBeInTheDocument();
    });

    it('allows typing in the expression textarea', async () => {
        const user = userEvent.setup();
        render(<Dialog open={true}><SelectCasesIfCondition variables={mockVariables} onClose={onClose} onContinue={onContinue} /></Dialog>);
        const textarea = screen.getByPlaceholderText('Enter condition expression...');
        
        await user.type(textarea, 'age > 25');
        
        expect(textarea).toHaveValue('age > 25');
    });

    it('inserts variable name on double click', async () => {
        const user = userEvent.setup();
        render(<Dialog open={true}><SelectCasesIfCondition variables={mockVariables} onClose={onClose} onContinue={onContinue} /></Dialog>);
        const variableItem = screen.getByText('age');
        const textarea = screen.getByPlaceholderText('Enter condition expression...');

        await user.dblClick(variableItem);

        expect(textarea).toHaveValue('age ');
    });

    it('inserts operator on button click', async () => {
        const user = userEvent.setup();
        render(<Dialog open={true}><SelectCasesIfCondition variables={mockVariables} onClose={onClose} onContinue={onContinue} /></Dialog>);
        const greaterThanButton = screen.getByRole('button', { name: '>' });
        const textarea = screen.getByPlaceholderText('Enter condition expression...');

        await user.click(greaterThanButton);
        
        expect(textarea).toHaveValue(' > ');
    });

    it('calls onContinue with the expression when Continue is clicked', async () => {
        const user = userEvent.setup();
        render(<Dialog open={true}><SelectCasesIfCondition variables={mockVariables} onClose={onClose} onContinue={onContinue} /></Dialog>);
        const textarea = screen.getByPlaceholderText('Enter condition expression...');
        
        await user.type(textarea, 'age > 30');
        
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await user.click(continueButton);

        expect(onContinue).toHaveBeenCalledWith('age > 30');
    });

    it('shows validation error for empty expression', async () => {
        const user = userEvent.setup();
        render(<Dialog open={true}><SelectCasesIfCondition variables={mockVariables} onClose={onClose} onContinue={onContinue} /></Dialog>);
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await user.click(continueButton);
        
        expect(screen.getByText('Condition cannot be empty')).toBeInTheDocument();
        expect(onContinue).not.toHaveBeenCalled();
    });

    it('shows validation error for unbalanced parentheses', async () => {
        const user = userEvent.setup();
        render(<Dialog open={true}><SelectCasesIfCondition variables={mockVariables} onClose={onClose} onContinue={onContinue} /></Dialog>);
        const textarea = screen.getByPlaceholderText('Enter condition expression...');

        await user.type(textarea, 'age > 30 & (gender == "M"');
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await user.click(continueButton);
        
        expect(screen.getByText('Unbalanced parentheses in condition')).toBeInTheDocument();
    });

    it('shows validation error if no variable is used', async () => {
        const user = userEvent.setup();
        render(<Dialog open={true}><SelectCasesIfCondition variables={mockVariables} onClose={onClose} onContinue={onContinue} /></Dialog>);
        const textarea = screen.getByPlaceholderText('Enter condition expression...');

        await user.type(textarea, '30 > 25');
        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await user.click(continueButton);

        expect(screen.getByText('Condition must contain at least one variable')).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', async () => {
        const user = userEvent.setup();
        render(<Dialog open={true}><SelectCasesIfCondition variables={mockVariables} onClose={onClose} onContinue={onContinue} /></Dialog>);
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        
        await user.click(cancelButton);
        
        expect(onClose).toHaveBeenCalledTimes(1);
    });
}); 