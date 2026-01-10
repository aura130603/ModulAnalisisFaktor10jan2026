import { renderHook, act } from '@testing-library/react';
import { useTourGuide, TabControlProps, TabType } from '../hooks/useTourGuide';

// Mock timer functions
jest.useFakeTimers();

describe('Frequencies useTourGuide', () => {
    let tabControl: TabControlProps;

    beforeEach(() => {
        // Set up a mock DOM for the tour to target
        document.body.innerHTML = `
            <div>
                <div id="frequencies-available-variables"></div>
                <div id="frequencies-selected-variables"></div>
                <div id="display-frequency-tables"></div>
                <div id="statistics-tab-trigger"></div>
                <div id="percentile-values-section"></div>
                <div id="central-tendency-section"></div>
                <div id="dispersion-section"></div>
                <div id="distribution-section"></div>
                <div id="charts-tab-trigger"></div>
                <div id="chart-type-section"></div>
                <div id="chart-values-section"></div>
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

    it('should initialize correctly', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        expect(result.current.tourActive).toBe(false);
        expect(result.current.currentStep).toBe(0);
    });

    it('should start and end the tour', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        
        act(() => result.current.startTour());
        expect(result.current.tourActive).toBe(true);
        expect(tabControl.setActiveTab).toHaveBeenCalledWith('variables');

        act(() => result.current.endTour());
        expect(result.current.tourActive).toBe(false);
    });

    it('should navigate through steps', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        
        act(() => result.current.startTour());
        
        act(() => result.current.nextStep());
        expect(result.current.currentStep).toBe(1);

        act(() => result.current.prevStep());
        expect(result.current.currentStep).toBe(0);
    });

    it('should switch to the statistics tab at the correct step', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        act(() => result.current.startTour());

        // Navigate to step index 3
        act(() => { result.current.nextStep(); }); // index 1
        act(() => { result.current.nextStep(); }); // index 2
        act(() => { result.current.nextStep(); }); // index 3

        // When currentStep becomes 3, the hook should trigger a tab switch to 'statistics'
        // for the *next* step (index 4).
        expect(tabControl.setActiveTab).toHaveBeenCalledWith('statistics');
    });

    it('should switch to the charts tab at the correct step', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        act(() => result.current.startTour());

        // Navigate to step index 8
        for(let i = 0; i < 8; i++) {
            act(() => { result.current.nextStep(); });
        }

        // When currentStep becomes 8, the hook should trigger a tab switch to 'charts'
        // for the *next* step (index 9).
        expect(tabControl.setActiveTab).toHaveBeenCalledWith('charts');
    });

    it('should identify the correct target element', () => {
        const { result } = renderHook(() => useTourGuide('dialog', tabControl));
        
        act(() => result.current.startTour());
        act(() => jest.advanceTimersByTime(201)); // Advance past the timeout

        expect(result.current.currentTargetElement?.id).toBe('frequencies-available-variables');

        act(() => result.current.nextStep());
        act(() => jest.advanceTimersByTime(201));
        
        expect(result.current.currentTargetElement?.id).toBe('frequencies-selected-variables');
    });
}); 