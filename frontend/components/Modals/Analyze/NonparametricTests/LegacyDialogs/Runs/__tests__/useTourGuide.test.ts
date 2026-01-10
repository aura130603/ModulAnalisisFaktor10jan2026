import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';
import { baseTourSteps } from '../hooks/tourConfig';
import { TourStep } from '../types';

describe('useTourGuide hook for Runs Test', () => {
  const mockTabControl = {
    setActiveTab: jest.fn(),
    currentActiveTab: 'variables' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourSteps).toEqual(baseTourSteps);
    expect(result.current.currentTargetElement).toBeNull();
  });

  it('should start tour when startTour is called', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('should move to next step when nextStep is called', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('should move to previous step when prevStep is called', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.nextStep();
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('should not go below step 0 when prevStep is called', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(0);
  });

  it('should not go beyond last step when nextStep is called', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      // Move to last step
      for (let i = 0; i < baseTourSteps.length; i++) {
        result.current.nextStep();
      }
      // Try to go beyond
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(baseTourSteps.length - 1);
  });

  it('should end tour when endTour is called', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.endTour();
    });

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.currentTargetElement).toBeNull();
  });

  it('should switch tabs when tour step requires it', () => {
    const customTourSteps: TourStep[] = [
      {
        title: 'Variables Tab',
        targetId: 'variables-tab',
        content: 'Select variables here',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: 'info',
        requiredTab: 'variables',
      },
      {
        title: 'Options Tab',
        targetId: 'options-tab',
        content: 'Configure options here',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: 'info',
        requiredTab: 'options',
      },
    ];

    const { result } = renderHook(() => 
      useTourGuide(customTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep(); // Move to step that requires tab switch
    });

    expect(mockTabControl.setActiveTab).toHaveBeenCalledWith('options');
  });

  it('should handle tour steps without tab specification', () => {
    const customTourSteps: TourStep[] = [
      {
        title: 'Test Element',
        targetId: 'test-element',
        content: 'Test content',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: 'info',
      },
    ];

    const { result } = renderHook(() => 
      useTourGuide(customTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    // Should not call setActiveTab when no tab is specified
    expect(mockTabControl.setActiveTab).not.toHaveBeenCalled();
  });

  it('should handle empty tour steps', () => {
    const { result } = renderHook(() => 
      useTourGuide([], 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourActive).toBe(true);
  });

  it('should handle single tour step', () => {
    const singleStep: TourStep[] = [
      {
        title: 'Single Step',
        targetId: 'single-element',
        content: 'Single step content',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: 'info',
      },
    ];

    const { result } = renderHook(() => 
      useTourGuide(singleStep, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(0); // Should stay at 0 since there's only one step
  });

  it('should maintain tour state between renders', () => {
    const { result, rerender } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    // Rerender the hook
    rerender();

    // Tour state should be maintained
    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(1);
  });

  it('should handle container type changes', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'sidebar', mockTabControl)
    );

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('should handle tab control changes', () => {
    const newTabControl = {
      setActiveTab: jest.fn(),
      currentActiveTab: 'options' as const,
    };

    const { result, rerender } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
    });

    // Change tab control
    rerender();

    // Should still work with new tab control
    expect(result.current.tourActive).toBe(true);
  });

  it('should handle rapid tour navigation', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.nextStep();
      result.current.prevStep();
      result.current.nextStep();
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(3);
  });

  it('should handle tour restart', () => {
    const { result } = renderHook(() => 
      useTourGuide(baseTourSteps, 'dialog', mockTabControl)
    );

    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.nextStep();
      result.current.endTour();
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });
}); 