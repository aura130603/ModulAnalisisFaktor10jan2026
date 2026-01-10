import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';
import { TabControlProps, TourStep } from '../types';
import { HorizontalPosition, PopupPosition } from '@/types/tourTypes';

describe('useTourGuide hook for OneWayAnova', () => {
  const mockTourSteps: TourStep[] = [
    {
      targetId: 'one-way-anova-available-variables',
      content: 'This is step 1',
      title: 'Variable Selection',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: 'left' as HorizontalPosition,
      icon: 'info',
      requiredTab: 'variables',
    },
    {
      targetId: 'one-way-anova-test-variables',
      content: 'This is step 2',
      title: 'Test Variables',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: 'right' as HorizontalPosition,
      icon: 'info',
      requiredTab: 'variables',
    },
    {
      targetId: 'one-way-anova-factor-variable',
      content: 'This is step 3',
      title: 'Factor Variable',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: null,
      icon: 'info',
      requiredTab: 'variables',
    },
    {
      targetId: 'estimate-effect-size-section',
      content: 'This is step 4',
      title: 'Effect Size',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: null,
      icon: 'info',
      requiredTab: 'variables',
    },
  ];

  beforeEach(() => {
    // Inject mock DOM elements for targetId lookup
    document.body.innerHTML = `
      <div id="one-way-anova-available-variables"></div>
      <div id="one-way-anova-test-variables"></div>
      <div id="one-way-anova-factor-variable"></div>
      <div id="estimate-effect-size-section"></div>
    `;
  });

  it('should initialize with tour inactive', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      tabControl
    ));

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourSteps).toEqual(expect.arrayContaining([
      expect.objectContaining({ targetId: 'one-way-anova-available-variables' })
    ]));
    expect(result.current.currentTargetElement).toBeNull();
  });

  it('should start the tour and find the first target element', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      tabControl
    ));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('should navigate to the next step and find the test variables element', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      tabControl
    ));

    act(() => {
      result.current.startTour();
    });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);
    expect(document.getElementById('one-way-anova-test-variables')).not.toBeNull();
  });

  it('should navigate through all steps', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      tabControl
    ));

    act(() => {
      result.current.startTour();
    });

    // Step 1 - Variable Selection
    expect(result.current.currentStep).toBe(0);
    
    // Step 2 - Test Variables
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(1);
    
    // Step 3 - Factor Variable
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(2);
    
    // Step 4 - Effect Size
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(3);
    
    // End tour after last step
    act(() => { result.current.nextStep(); });
    expect(result.current.tourActive).toBe(false);
  });

  it('should navigate to the previous step', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      tabControl
    ));

    act(() => {
      result.current.startTour();
      result.current.nextStep();
    });

    act(() => {
      result.current.prevStep();
    });

    expect(result.current.currentStep).toBe(0);
  });

  it('should end the tour', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      tabControl
    ));

    act(() => {
      result.current.startTour();
    });

    act(() => {
      result.current.endTour();
    });

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
  });

  it('should adjust position based on container type', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'sidebar',
      tabControl
    ));
    
    expect(result.current.tourSteps[0].horizontalPosition).toBe('left');
    expect(result.current.tourSteps[0].position).toBeUndefined();
  });

  it('should handle tab switching', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const tourStepsWithTabSwitch: TourStep[] = [
      ...mockTourSteps,
      {
        targetId: 'post-hoc-tab',
        content: 'This requires post hoc tab',
        title: 'Post Hoc Tests',
        defaultPosition: 'bottom' as PopupPosition,
        defaultHorizontalPosition: null,
        icon: 'info',
        requiredTab: 'postHoc',
        forceChangeTab: true,
      },
    ];

    // Add the post-hoc tab element to DOM
    document.body.innerHTML += '<div id="post-hoc-tab"></div>';

    const { result } = renderHook(() => useTourGuide(
      tourStepsWithTabSwitch,
      'dialog',
      tabControl
    ));

    // Start tour
    act(() => {
      result.current.startTour();
    });

    // Navigate through all steps to reach the tab switching step
    for (let i = 0; i < mockTourSteps.length; i++) {
      act(() => {
        result.current.nextStep();
      });
    }

    // Now we should be at the tab switching step (step 4)
    expect(result.current.currentStep).toBe(4);
    expect(setActiveTab).toHaveBeenCalledWith('postHoc');

    // Prev step should go back and switch tab again
    act(() => {
      result.current.prevStep(); // Step 4 -> Step 3 (back to variables tab)
    });
    expect(result.current.currentStep).toBe(3);
    expect(setActiveTab).toHaveBeenCalledWith('variables');

    // Verify tab switching calls
    expect(setActiveTab).toHaveBeenCalledTimes(2);
    expect(setActiveTab).toHaveBeenNthCalledWith(1, 'postHoc');
    expect(setActiveTab).toHaveBeenNthCalledWith(2, 'variables');
  });
}); 