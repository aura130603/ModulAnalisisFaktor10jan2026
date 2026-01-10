import { renderHook, act } from '@testing-library/react';
import { useTourGuide, TabControlProps, TabType } from '../hooks/useTourGuide';

// Mock timer functions
jest.useFakeTimers();

describe('useTourGuide', () => {
    let tabControl: TabControlProps;

    beforeEach(() => {
        // Reset DOM before each test
        document.body.innerHTML = `
            <div>
                <div id="crosstabs-available-variables"></div>
                <div id="crosstabs-row-variables"></div>
                <div id="crosstabs-column-variables"></div>
                <div id="crosstabs-cells-tab-trigger"></div>
                <div id="crosstabs-counts-section"></div>
                <div id="crosstabs-percentages-section"></div>
                <div id="crosstabs-residuals-section"></div>
                <div id="crosstabs-noninteger-weights-section"></div>
                <div id="crosstabs-ok-button"></div>
            </div>
        `;

        tabControl = {
            setActiveTab: jest.fn(),
            currentActiveTab: 'variables' as TabType,
        };
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    it('should initialize with tour being inactive', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        expect(result.current.tourActive).toBe(false);
        expect(result.current.currentStep).toBe(0);
    });

    it('should start the tour when startTour is called', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        
        act(() => {
            result.current.startTour();
        });

        expect(result.current.tourActive).toBe(true);
        expect(result.current.currentStep).toBe(0);
        expect(tabControl.setActiveTab).toHaveBeenCalledWith('variables');
    });

    it('should end the tour when endTour is called', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        
        act(() => {
            result.current.startTour();
        });

        expect(result.current.tourActive).toBe(true);

        act(() => {
            result.current.endTour();
        });

        expect(result.current.tourActive).toBe(false);
    });

    it('should proceed to the next step', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        
        act(() => {
            result.current.startTour();
        });

        act(() => {
            result.current.nextStep();
        });

        expect(result.current.currentStep).toBe(1);
    });

    it('should go to the previous step', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        
        act(() => {
            result.current.startTour();
        });

        act(() => {
            result.current.nextStep();
            result.current.nextStep();
        });

        expect(result.current.currentStep).toBe(2);

        act(() => {
            result.current.prevStep();
        });

        expect(result.current.currentStep).toBe(1);
    });

    it('should not go to a step below zero', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        
        act(() => {
            result.current.startTour();
        });

        act(() => {
            result.current.prevStep();
        });

        expect(result.current.currentStep).toBe(0);
    });

    it('should not go beyond the last step', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        const totalSteps = result.current.tourSteps.length;

        act(() => {
            result.current.startTour();
        });

        for (let i = 0; i < totalSteps; i++) {
            act(() => {
                result.current.nextStep();
            });
        }

        expect(result.current.currentStep).toBe(totalSteps - 1);
    });

    it('should switch tabs when a step requires it', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        
        act(() => {
            result.current.startTour();
        });

        // After starting, it should set the tab for the first step
        expect(tabControl.setActiveTab).toHaveBeenCalledWith('variables');

        // Go to step 3, which has forceChangeTab = true
        act(() => { result.current.nextStep(); }); // currentStep = 1
        act(() => { result.current.nextStep(); }); // currentStep = 2
        act(() => { result.current.nextStep(); }); // currentStep = 3

        // When currentStep becomes 3, the useEffect for `forceChangeTab` will fire,
        // see that the *next* step (4) requires 'cells', and call setActiveTab.
        expect(tabControl.setActiveTab).toHaveBeenCalledWith('cells');
    });
    
    it('should find the target element for the current step', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));

        act(() => {
            result.current.startTour();
        });

        act(() => {
            jest.advanceTimersByTime(201);
        });

        expect(result.current.currentTargetElement).not.toBeNull();
        expect(result.current.currentTargetElement?.id).toBe('crosstabs-available-variables');
    });
}); 