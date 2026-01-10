import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';
import { TabControlProps, TourStep } from '../types';
import { HorizontalPosition, PopupPosition } from '@/types/tourTypes';

describe('useTourGuide hook for PairedSamplesTTest', () => {
  const mockTourSteps: TourStep[] = [
    {
      targetId: 'paired-samples-t-test-available-variables',
      content: 'This is step 1',
      title: 'Variable Selection',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: 'left' as HorizontalPosition,
      icon: 'info',
      requiredTab: 'variables',
    },
    {
      targetId: 'paired-samples-t-test-test-variables',
      content: 'This is step 2',
      title: 'Test Variables',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: 'right' as HorizontalPosition,
      icon: 'info',
      requiredTab: 'variables',
    },
    {
      targetId: 'paired-samples-t-test-options-tab',
      content: 'This is step 3',
      title: 'Options Tab',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: null,
      icon: 'info',
      requiredTab: 'options',
      forceChangeTab: true,
    },
    {
      targetId: 'estimate-effect-size-section',
      content: 'This is step 4',
      title: 'Effect Size',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: null,
      icon: 'info',
      requiredTab: 'options',
    },
  ];

  beforeEach(() => {
    // Inject mock DOM elements for targetId lookup
    document.body.innerHTML = `
      <div id="paired-samples-t-test-available-variables"></div>
      <div id="paired-samples-t-test-test-variables"></div>
      <div id="paired-samples-t-test-options-tab"></div>
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
      expect.objectContaining({ targetId: 'paired-samples-t-test-available-variables' })
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
    expect(document.getElementById('paired-samples-t-test-test-variables')).not.toBeNull();
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
    
    // Step 3 - Options Tab (should switch to options tab)
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(2);
    expect(setActiveTab).toHaveBeenCalledWith('options');
    
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

    const { result } = renderHook(() => useTourGuide(mockTourSteps, 'dialog', tabControl));

    // Start tour
    act(() => {
      result.current.startTour();
    });

    // Move to step with forceChangeTab (should switch to options tab)
    act(() => {
      result.current.nextStep(); // Step 0 -> Step 1 (variables)
      result.current.nextStep(); // Step 1 -> Step 2 (variables)
    });

    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(2);
    
    expect(setActiveTab).toHaveBeenCalledWith('options');

    // Prev step should go back and switch tab again
    act(() => {
      result.current.prevStep(); // Step 3 -> Step 2 (back to variables tab)
    });
    expect(result.current.currentStep).toBe(1);
    expect(setActiveTab).toHaveBeenCalledWith('variables');

    // Verify tab switching calls
    expect(setActiveTab).toHaveBeenCalledTimes(2);
    // Perbaiki: seharusnya 'options' dipanggil pertama kali, lalu 'variables' kedua kali
    expect(setActiveTab).toHaveBeenNthCalledWith(1, 'options');
    expect(setActiveTab).toHaveBeenNthCalledWith(2, 'variables');
  });
}); 