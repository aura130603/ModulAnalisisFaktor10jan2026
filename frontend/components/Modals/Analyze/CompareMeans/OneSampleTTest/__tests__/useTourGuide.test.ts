import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';
import { TourStep } from '../types';

// Mock DOM elements for tour targets
const mockAvailableVarsElement = document.createElement('div');
mockAvailableVarsElement.setAttribute('id', 'one-sample-t-test-available-variables');
document.body.appendChild(mockAvailableVarsElement);

const mockTestVarsElement = document.createElement('div');
mockTestVarsElement.setAttribute('id', 'one-sample-t-test-test-variables');
document.body.appendChild(mockTestVarsElement);

const mockAllowUnknownElement = document.createElement('div');
mockAllowUnknownElement.setAttribute('id', 'allow-unknown-section');
document.body.appendChild(mockAllowUnknownElement);

const mockTestValueElement = document.createElement('div');
mockTestValueElement.setAttribute('id', 'test-value-section');
document.body.appendChild(mockTestValueElement);

const mockEffectSizeElement = document.createElement('div');
mockEffectSizeElement.setAttribute('id', 'estimate-effect-size-section');
document.body.appendChild(mockEffectSizeElement);

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('useTourGuide hook', () => {
  const mockTourSteps: TourStep[] = [
    {
      targetId: 'one-sample-t-test-available-variables',
      content: 'This is step 1',
      title: 'Variable Selection',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: 'left',
      icon: 'info',
    },
    {
      targetId: 'one-sample-t-test-test-variables',
      content: 'This is step 2',
      title: 'Test Variables',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: 'right',
      icon: 'info',
    },
    {
      targetId: 'allow-unknown-section',
      content: 'This is step 3',
      title: 'Allow Unknown Variables',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: null,
      icon: 'info',
    },
    {
      targetId: 'test-value-section',
      content: 'This is step 4',
      title: 'Test Value',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: null,
      icon: 'info',
      requiredTab: 'variables',
      forceChangeTab: true,
    },
    {
      targetId: 'estimate-effect-size-section',
      content: 'This is step 5',
      title: 'Effect Size',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: null,
      icon: 'info',
      requiredTab: 'variables',
    },
  ];

  const mockTabControl = {
    currentActiveTab: 'variables',
    setActiveTab: jest.fn()
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
      expect.objectContaining({ targetId: 'one-sample-t-test-available-variables' })
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
    expect(document.getElementById('one-sample-t-test-test-variables')).not.toBeNull();
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
    
    // Step 3 - Allow Unknown
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(2);
    
    // Step 4 - Test Value
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(3);
    
    // Step 5 - Effect Size
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(4);
    
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