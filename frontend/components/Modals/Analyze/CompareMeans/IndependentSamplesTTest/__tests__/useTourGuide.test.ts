import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';
import { TabControlProps, TourStep } from '../types';
import { HorizontalPosition, PopupPosition } from '@/types/tourTypes';

// Mock DOM elements for tour targets
const mockAvailableVarsElement = document.createElement('div');
mockAvailableVarsElement.setAttribute('id', 'independent-samples-t-test-available-variables');
document.body.appendChild(mockAvailableVarsElement);

const mockTestVarsElement = document.createElement('div');
mockTestVarsElement.setAttribute('id', 'independent-samples-t-test-test-variables');
document.body.appendChild(mockTestVarsElement);

const mockDefineGroupsElement = document.createElement('div');
mockDefineGroupsElement.setAttribute('id', 'define-groups-section');
document.body.appendChild(mockDefineGroupsElement);

const mockEffectSizeElement = document.createElement('div');
mockEffectSizeElement.setAttribute('id', 'estimate-effect-size-section');
document.body.appendChild(mockEffectSizeElement);

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('useTourGuide hook for IndependentSamplesTTest', () => {
  const mockTourSteps: TourStep[] = [
    {
      targetId: 'independent-samples-t-test-available-variables',
      content: 'This is step 1',
      title: 'Variable Selection',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: 'left' as HorizontalPosition,
      icon: 'info',
      requiredTab: 'variables',
    },
    {
      targetId: 'independent-samples-t-test-test-variables',
      content: 'This is step 2',
      title: 'Test Variables',
      defaultPosition: 'bottom' as PopupPosition,
      defaultHorizontalPosition: 'right' as HorizontalPosition,
      icon: 'info',
      requiredTab: 'variables',
    },
    {
      targetId: 'define-groups-section',
      content: 'This is step 3',
      title: 'Define Groups',
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
      requiredTab: 'variables',
    },
  ];

  const mockTabControl: TabControlProps = {
    setActiveTab: jest.fn(),
    currentActiveTab: 'variables',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with tour inactive', () => {
    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      mockTabControl
    ));

    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.tourSteps).toEqual(expect.arrayContaining([
      expect.objectContaining({ targetId: 'independent-samples-t-test-available-variables' })
    ]));
    expect(result.current.currentTargetElement).toBeNull();
  });

  it('should start the tour and find the first target element', () => {
    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      mockTabControl
    ));

    act(() => {
      result.current.startTour();
    });

    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('should navigate to the next step and find the test variables element', () => {
    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      mockTabControl
    ));

    act(() => {
      result.current.startTour();
    });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);
    // The element should be found in the DOM
    expect(document.getElementById('independent-samples-t-test-test-variables')).not.toBeNull();
  });

  it('should navigate through all steps', () => {
    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      mockTabControl
    ));

    act(() => {
      result.current.startTour();
    });

    // Step 1 - Variable Selection
    expect(result.current.currentStep).toBe(0);
    
    // Step 2 - Test Variables
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(1);
    
    // Step 3 - Define Groups
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(2);
    expect(mockTabControl.setActiveTab).toHaveBeenCalledWith('options');
    
    // Step 4 - Effect Size
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(3);
    
    // End tour after last step
    act(() => { result.current.nextStep(); });
    expect(result.current.tourActive).toBe(false);
  });

  it('should navigate to the previous step', () => {
    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      mockTabControl
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
    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'dialog',
      mockTabControl
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
    const { result } = renderHook(() => useTourGuide(
      mockTourSteps,
      'sidebar',
      mockTabControl
    ));
    
    expect(result.current.tourSteps[0].horizontalPosition).toBe('left');
    expect(result.current.tourSteps[0].position).toBeUndefined();
  });
}); 