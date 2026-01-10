import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';
import { baseTourSteps } from '../hooks/tourConfig';
import { TabControlProps } from '../types';

describe('useTourGuide', () => {
  const mockTabControl: TabControlProps = {
    setActiveTab: jest.fn(),
    currentActiveTab: 'variables'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourSteps).toEqual(baseTourSteps);
  });

  it('should start tour', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('should go to next step', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.tourActive).toBe(true);
  });

  it('should go to previous step', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

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

  it('should not go below step 0', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(0);
  });

  it('should not go beyond last step', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    // Go to the last step
    const lastStepIndex = baseTourSteps.length - 1;
    for (let i = 0; i <= lastStepIndex + 1; i++) {
      act(() => {
        result.current.nextStep();
      });
    }

    expect(result.current.currentStep).toBe(lastStepIndex);
  });

  it('should end tour', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);

    act(() => {
      result.current.endTour();
    });

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
  });

  it('should get current step data', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    const currentStepData = result.current.tourSteps[result.current.currentStep];
    expect(currentStepData).toEqual(baseTourSteps[0]);
  });

  it('should get step data by index', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    const stepData = result.current.tourSteps[1];
    expect(stepData).toEqual(baseTourSteps[1]);
  });

  it('should check if step exists', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    expect(result.current.tourSteps[0]).toBeDefined();
    expect(result.current.tourSteps[1]).toBeDefined();
    expect(result.current.tourSteps[baseTourSteps.length - 1]).toBeDefined();
    expect(result.current.tourSteps[baseTourSteps.length]).toBeUndefined();
  });

  it('should get total steps count', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    expect(result.current.tourSteps.length).toBe(baseTourSteps.length);
  });

  it('should check if it is the first step', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.currentStep).toBe(0);

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('should check if it is the last step', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    // Go to the last step
    const lastStepIndex = baseTourSteps.length - 1;
    for (let i = 0; i < lastStepIndex; i++) {
      act(() => {
        result.current.nextStep();
      });
    }

    expect(result.current.currentStep).toBe(lastStepIndex);
  });

  it('should handle rapid step changes', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.nextStep();
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.tourActive).toBe(true);
  });

  it('should maintain state between renders', () => {
    const { result, rerender } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    // Re-render the hook
    rerender();

    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(1);
  });

  it('should handle tour steps with different content', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    // Check that we can access different step content
    for (let i = 0; i < Math.min(3, baseTourSteps.length); i++) {
      const stepData = result.current.tourSteps[i];
      expect(stepData).toBeDefined();
      expect(stepData).toHaveProperty('targetId');
      expect(stepData).toHaveProperty('content');
      
      act(() => {
        result.current.nextStep();
      });
    }
  });

  it('should handle edge case when tour is not active', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    // Try to navigate without starting tour
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourActive).toBe(false);
  });

  it('should handle multiple start/end cycles', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    // First cycle
    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.endTour();
    });

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);

    // Second cycle
    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.nextStep();
      result.current.endTour();
    });

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
  });

  it('should handle step navigation at boundaries', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    // Try to go to previous step at the beginning
    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(0);

    // Go to the last step
    const lastStepIndex = baseTourSteps.length - 1;
    for (let i = 0; i < lastStepIndex; i++) {
      act(() => {
        result.current.nextStep();
      });
    }

    // Try to go to next step at the end
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(lastStepIndex);
  });
}); 