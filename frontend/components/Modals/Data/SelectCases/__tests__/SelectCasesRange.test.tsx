import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SelectCasesRange from '../dialogs/SelectCasesRange';
import { Dialog } from '@/components/ui/dialog';

describe('SelectCasesRange Dialog', () => {
    const onContinue = jest.fn();
    const onClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <Dialog open onOpenChange={() => {}}>
                <SelectCasesRange onClose={onClose} onContinue={onContinue} />
            </Dialog>
        );
        expect(screen.getByText('Select Cases: Range')).toBeInTheDocument();
        expect(screen.getByLabelText('First Case:')).toBeInTheDocument();
        expect(screen.getByLabelText('Last Case:')).toBeInTheDocument();
    });

    it('allows typing in the input fields', async () => {
        const user = userEvent.setup();
        render(
            <Dialog open onOpenChange={() => {}}>
                <SelectCasesRange onClose={onClose} onContinue={onContinue} />
            </Dialog>
        );
        
        const firstCaseInput = screen.getByLabelText('First Case:');
        const lastCaseInput = screen.getByLabelText('Last Case:');

        await user.type(firstCaseInput, '10');
        await user.type(lastCaseInput, '100');

        expect(firstCaseInput).toHaveValue(10);
        expect(lastCaseInput).toHaveValue(100);
    });

    it('calls onContinue with the correct range data', async () => {
        const user = userEvent.setup();
        render(
            <Dialog open onOpenChange={() => {}}>
                <SelectCasesRange onClose={onClose} onContinue={onContinue} />
            </Dialog>
        );
        
        const firstCaseInput = screen.getByLabelText('First Case:');
        const lastCaseInput = screen.getByLabelText('Last Case:');

        await user.type(firstCaseInput, '10');
        await user.type(lastCaseInput, '100');

        await user.click(screen.getByRole('button', { name: 'Continue' }));

        expect(onContinue).toHaveBeenCalledWith({
            firstCase: '10',
            lastCase: '100'
        });
    });

    it('calls onContinue with only first case if last case is empty', async () => {
        const user = userEvent.setup();
        render(
            <Dialog open onOpenChange={() => {}}>
                <SelectCasesRange onClose={onClose} onContinue={onContinue} />
            </Dialog>
        );
        
        const firstCaseInput = screen.getByLabelText('First Case:');
        await user.type(firstCaseInput, '10');
        
        await user.click(screen.getByRole('button', { name: 'Continue' }));

        expect(onContinue).toHaveBeenCalledWith({ firstCase: '10' });
    });

    it('shows validation error if first case is greater than last case', async () => {
        const user = userEvent.setup();
        render(
            <Dialog open onOpenChange={() => {}}>
                <SelectCasesRange onClose={onClose} onContinue={onContinue} />
            </Dialog>
        );
        
        const firstCaseInput = screen.getByLabelText('First Case:');
        const lastCaseInput = screen.getByLabelText('Last Case:');

        await user.type(firstCaseInput, '100');
        await user.type(lastCaseInput, '10');

        await user.click(screen.getByRole('button', { name: 'Continue' }));

        expect(screen.getByText('First case must be less than or equal to last case')).toBeInTheDocument();
        expect(onContinue).not.toHaveBeenCalled();
    });

    it('shows validation error for non-positive case numbers', async () => {
        const user = userEvent.setup();
        render(
            <Dialog open onOpenChange={() => {}}>
                <SelectCasesRange onClose={onClose} onContinue={onContinue} />
            </Dialog>
        );
        
        const firstCaseInput = screen.getByLabelText('First Case:');
        const lastCaseInput = screen.getByLabelText('Last Case:');
        
        await user.type(firstCaseInput, '0');
        await user.type(lastCaseInput, '10');
        
        await user.click(screen.getByRole('button', { name: 'Continue' }));
        
        expect(screen.getByText('Case numbers must be positive')).toBeInTheDocument();
        expect(onContinue).not.toHaveBeenCalled();
    });

    it('calls onClose when Cancel is clicked', async () => {
        const user = userEvent.setup();
        render(
            <Dialog open onOpenChange={() => {}}>
                <SelectCasesRange onClose={onClose} onContinue={onContinue} />
            </Dialog>
        );
        const cancelButton = screen.getByRole('button', { name: 'Cancel' });
        await user.click(cancelButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
}); 