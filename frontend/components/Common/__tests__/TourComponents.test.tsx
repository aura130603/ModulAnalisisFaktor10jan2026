import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TourPopup } from '../TourComponents';
import type { TourStep } from '@/types/tourTypes';

// Mock data for a single tour step
const mockStep: TourStep = {
    targetId: 'welcome-element',
    title: 'Welcome to the Tour',
    content: 'This is the first step of our tour.',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '👋',
};

// Mock functions
const mockOnNext = jest.fn();
const mockOnPrev = jest.fn();
const mockOnClose = jest.fn();

// Create a mock target element in the document body
const setupTargetElement = () => {
    const targetElement = document.createElement('div');
    targetElement.id = 'welcome-element';
    // Mock getBoundingClientRect as jsdom doesn't handle layout
    targetElement.getBoundingClientRect = jest.fn(() => ({
        x: 200,
        y: 200,
        width: 100,
        height: 50,
        top: 200,
        left: 200,
        right: 300,
        bottom: 250,
        toJSON: () => {},
    }));
    document.body.appendChild(targetElement);
    return targetElement;
};

const teardownTargetElement = (element: HTMLElement) => {
    document.body.removeChild(element);
};

describe('TourPopup', () => {
    let targetElement: HTMLElement;

    beforeEach(() => {
        targetElement = setupTargetElement();
        jest.clearAllMocks();
    });

    afterEach(() => {
        teardownTargetElement(targetElement);
    });

    it('should render the tour step content correctly', () => {
        render(
            <TourPopup
                step={mockStep}
                currentStep={0}
                totalSteps={3}
                onNext={mockOnNext}
                onPrev={mockOnPrev}
                onClose={mockOnClose}
                targetElement={targetElement}
            />
        );

        expect(screen.getByText('Welcome to the Tour')).toBeInTheDocument();
        expect(screen.getByText('This is the first step of our tour.')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });

    it('should show "Next" button on the first step and call onNext when clicked', async () => {
        const user = userEvent.setup();
        render(
            <TourPopup
                step={mockStep}
                currentStep={0}
                totalSteps={3}
                onNext={mockOnNext}
                onPrev={mockOnPrev}
                onClose={mockOnClose}
                targetElement={targetElement}
            />
        );

        const nextButton = screen.getByRole('button', { name: /Next/i });
        expect(nextButton).toBeInTheDocument();
        
        await user.click(nextButton);
        expect(mockOnNext).toHaveBeenCalledTimes(1);

        // "Previous" button should not be visible
        expect(screen.queryByRole('button', { name: /Previous/i })).not.toBeInTheDocument();
    });

    it('should show "Previous" and "Next" buttons on a middle step', async () => {
        const user = userEvent.setup();
        render(
            <TourPopup
                step={mockStep}
                currentStep={1} // Middle step
                totalSteps={3}
                onNext={mockOnNext}
                onPrev={mockOnPrev}
                onClose={mockOnClose}
                targetElement={targetElement}
            />
        );

        const nextButton = screen.getByRole('button', { name: /Next/i });
        const prevButton = screen.getByRole('button', { name: /Previous/i });

        expect(nextButton).toBeInTheDocument();
        expect(prevButton).toBeInTheDocument();

        await user.click(nextButton);
        expect(mockOnNext).toHaveBeenCalledTimes(1);

        await user.click(prevButton);
        expect(mockOnPrev).toHaveBeenCalledTimes(1);
    });

    it('should show "Finish" button on the last step and call onClose when clicked', async () => {
        const user = userEvent.setup();
        render(
            <TourPopup
                step={mockStep}
                currentStep={2} // Last step
                totalSteps={3}
                onNext={mockOnNext}
                onPrev={mockOnPrev}
                onClose={mockOnClose}
                targetElement={targetElement}
            />
        );

        const finishButton = screen.getByRole('button', { name: /Finish/i });
        expect(finishButton).toBeInTheDocument();

        await user.click(finishButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        
        // "Next" button should not be visible
        expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument();
    });

    it('should call onClose when the close icon is clicked', async () => {
        const user = userEvent.setup();
        render(
            <TourPopup
                step={mockStep}
                currentStep={0}
                totalSteps={3}
                onNext={mockOnNext}
                onPrev={mockOnPrev}
                onClose={mockOnClose}
                targetElement={targetElement}
            />
        );

        // The close button is the one without a name, usually just an "X" icon
        const closeButton = screen.getAllByRole('button').find(btn => !btn.textContent);
        expect(closeButton).toBeInTheDocument();

        if (closeButton) {
            await user.click(closeButton);
        }
        
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
}); 