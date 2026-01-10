import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';
import { baseTourSteps } from '../hooks/tourConfig';
import { TabControlProps, TourStep } from '../types';

// Mock the tour steps
const mockTourSteps: TourStep[] = [
  {
    title: 'Step 1',
    content: 'Welcome to Two Independent Samples Test',
    targetId: 'test-variables-section',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: 'info',
    requiredTab: 'variables',
  },
  {
    title: 'Step 2',
    content: 'Select your test variables',
    targetId: 'available-variables-list',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'right',
    icon: 'info',
    requiredTab: 'variables',
  },
  {
    title: 'Step 3',
    content: 'Choose your grouping variable',
    targetId: 'grouping-variable-section',
    defaultPosition: 'top',
    defaultHorizontalPosition: null,
    icon: 'info',
    requiredTab: 'variables',
  },
];

describe('useTourGuide', () => {
  const mockTabControl: TabControlProps = {
    setActiveTab: jest.fn(),
    currentActiveTab: 'variables'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourSteps).toEqual(baseTourSteps);
    expect(result.current.currentTargetElement).toBeNull();
    expect(typeof result.current.startTour).toBe('function');
    expect(typeof result.current.nextStep).toBe('function');
    expect(typeof result.current.prevStep).toBe('function');
    expect(typeof result.current.endTour).toBe('function');
  });

  it('should start tour when startTour is called', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('should move to next step when nextStep is called', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    // Start tour
    act(() => {
      result.current.startTour();
    });

    // Move to next step
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('should move to previous step when prevStep is called', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    // Start tour and move to step 2
    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.nextStep();
    });

    // Move back to previous step
    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('should end tour when endTour is called', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    // Start tour
    act(() => {
      result.current.startTour();
    });

    // End tour
    act(() => {
      result.current.endTour();
    });

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
  });

  it('should not go beyond the last step', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    // Start tour and move to last step
    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.nextStep();
      result.current.nextStep();
      result.current.nextStep();
      result.current.nextStep();
    });

    // Should not exceed the number of steps
    expect(result.current.currentStep).toBeLessThan(baseTourSteps.length);
  });

  it('should not go below the first step', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    // Start tour and move to step 2
    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    // Try to go back multiple times
    act(() => {
      result.current.prevStep();
      result.current.prevStep();
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(0);
  });

  it('should handle tab switching during tour', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    // Start tour
    act(() => {
      result.current.startTour();
    });

    // Simulate tab switching
    act(() => {
      mockTabControl.setActiveTab('options');
    });

    expect(mockTabControl.setActiveTab).toHaveBeenCalledWith('options');
  });

  it('should handle tour with custom steps', () => {
    const { result } = renderHook(() => useTourGuide(mockTourSteps, 'dialog', mockTabControl));

    expect(result.current.tourSteps).toEqual(mockTourSteps);
  });

  it('should handle tour in dialog mode', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'dialog', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
  });

  it('should handle tour in sidebar mode', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
  });

  it('should reset to first step when restarting tour', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    // Start tour and move to step 2
    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.nextStep();
    });

    // End tour
    act(() => {
      result.current.endTour();
    });

    // Start tour again
    act(() => {
      result.current.startTour();
    });

    expect(result.current.currentStep).toBe(0);
  });

  it('should handle rapid step navigation', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

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

  it('should handle empty tour steps', () => {
    const { result } = renderHook(() => useTourGuide([], 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('should handle single step tour', () => {
    const singleStepTour = [mockTourSteps[0]];
    const { result } = renderHook(() => useTourGuide(singleStepTour, 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(0); // Should not exceed single step
  });

  it('should handle tour with target elements', () => {
    const tourWithTargets = [
      {
        title: 'Step 1',
        content: 'Click here',
        targetId: 'test-button',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: 'info',
        requiredTab: 'variables',
      }
    ] as TourStep[];

    const { result } = renderHook(() => useTourGuide(tourWithTargets, 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourSteps[0].targetId).toBe('test-button');
  });

  it('should handle tour step navigation with bounds checking', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    // Navigate through all steps
    for (let i = 0; i < baseTourSteps.length + 5; i++) {
      act(() => {
        result.current.nextStep();
      });
    }

    // Should not exceed the number of steps
    expect(result.current.currentStep).toBeLessThan(baseTourSteps.length);
  });

  it('should handle tour step navigation with negative bounds checking', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    // Try to go back multiple times
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.prevStep();
      });
    }

    // Should not go below 0
    expect(result.current.currentStep).toBe(0);
  });

  it('should maintain tour state across multiple start/end cycles', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    // First tour cycle
    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.endTour();
    });

    // Second tour cycle
    act(() => {
      result.current.startTour();
      result.current.nextStep();
      result.current.nextStep();
      result.current.endTour();
    });

    // Third tour cycle
    act(() => {
      result.current.startTour();
    });

    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourActive).toBe(true);
  });

  it('should handle tour with different container types', () => {
    const containerTypes = ['sidebar', 'dialog'] as const;

    containerTypes.forEach(containerType => {
      const { result } = renderHook(() => useTourGuide(baseTourSteps, containerType, mockTabControl));

      act(() => {
        result.current.startTour();
      });

      expect(result.current.tourActive).toBe(true);
    });
  });

  it('should handle tour with different tab control states', () => {
    const differentTabControls: TabControlProps[] = [
      {
        setActiveTab: jest.fn(),
        currentActiveTab: 'variables'
      },
      {
        setActiveTab: jest.fn(),
        currentActiveTab: 'options'
      }
    ];

    differentTabControls.forEach(tabControl => {
      const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', tabControl));

      act(() => {
        result.current.startTour();
      });

      expect(result.current.tourActive).toBe(true);
    });
  });

  it('should handle tour step content with special characters', () => {
    const tourWithSpecialChars = [
      {
        title: 'Step 1',
        content: 'Welcome to the Two Independent Samples Test! 🎉',
        targetId: 'test-section',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: 'info',
        requiredTab: 'variables',
      }
    ] as TourStep[];

    const { result } = renderHook(() => useTourGuide(tourWithSpecialChars, 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourSteps[0].content).toBe('Welcome to the Two Independent Samples Test! 🎉');
  });

  it('should handle tour with different step positions', () => {
    const tourWithPositions = [
      {
        title: 'Step 1',
        content: 'Top position',
        targetId: 'element1',
        defaultPosition: 'top',
        defaultHorizontalPosition: 'left',
        icon: 'info',
        requiredTab: 'variables',
      },
      {
        title: 'Step 2',
        content: 'Bottom position',
        targetId: 'element2',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'right',
        icon: 'info',
        requiredTab: 'variables',
      },
      {
        title: 'Step 3',
        content: 'Left position',
        targetId: 'element3',
        defaultPosition: 'top',
        defaultHorizontalPosition: null,
        icon: 'info',
        requiredTab: 'variables',
      },
      {
        title: 'Step 4',
        content: 'Right position',
        targetId: 'element4',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: 'info',
        requiredTab: 'variables',
      }
    ] as TourStep[];

    const { result } = renderHook(() => useTourGuide(tourWithPositions, 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourSteps[0].defaultPosition).toBe('top');
    expect(result.current.tourSteps[1].defaultPosition).toBe('bottom');
    expect(result.current.tourSteps[2].defaultPosition).toBe('top');
    expect(result.current.tourSteps[3].defaultPosition).toBe('bottom');
  });

  it('should handle tour navigation with step validation', () => {
    const { result } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    act(() => {
      result.current.startTour();
    });

    // Navigate through steps and validate each step
    for (let i = 0; i < baseTourSteps.length; i++) {
      expect(result.current.currentStep).toBe(i);
      expect(result.current.tourSteps[i]).toBeDefined();
      
      if (i < baseTourSteps.length - 1) {
        act(() => {
          result.current.nextStep();
        });
      }
    }
  });

  it('should handle tour state persistence during re-renders', () => {
    const { result, rerender } = renderHook(() => useTourGuide(baseTourSteps, 'sidebar', mockTabControl));

    // Start tour and move to step 2
    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    // Re-render the hook
    rerender();

    // State should be preserved
    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(1);
  });
}); 