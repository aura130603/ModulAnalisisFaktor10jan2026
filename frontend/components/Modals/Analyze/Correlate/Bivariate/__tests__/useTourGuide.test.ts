import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';
import { TourStep } from '../types';

// Mock DOM elements for tour targets
const mockAvailableVarsElement = document.createElement('div');
mockAvailableVarsElement.setAttribute('id', 'bivariate-available-variables');
document.body.appendChild(mockAvailableVarsElement);

const mockTestVarsElement = document.createElement('div');
mockTestVarsElement.setAttribute('id', 'bivariate-test-variables');
document.body.appendChild(mockTestVarsElement);

const mockCorrelationCoefficientElement = document.createElement('div');
mockCorrelationCoefficientElement.setAttribute('id', 'correlation-coefficient-section');
document.body.appendChild(mockCorrelationCoefficientElement);

const mockTestOfSignificanceElement = document.createElement('div');
mockTestOfSignificanceElement.setAttribute('id', 'test-of-significance-section');
document.body.appendChild(mockTestOfSignificanceElement);

const mockPartialCorrelationElement = document.createElement('div');
mockPartialCorrelationElement.setAttribute('id', 'partial-correlation-section');
document.body.appendChild(mockPartialCorrelationElement);

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('useTourGuide hook', () => {
  const mockTourSteps: TourStep[] = [
    {
      targetId: 'bivariate-available-variables',
      content: 'This is step 1',
      title: 'Variable Selection',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: 'left',
      icon: 'info',
    },
    {
      targetId: 'bivariate-test-variables',
      content: 'This is step 2',
      title: 'Test Variables',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: 'right',
      icon: 'info',
    },
    {
      targetId: 'correlation-coefficient-section',
      content: 'This is step 3',
      title: 'Correlation Coefficient',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: null,
      icon: 'info',
    },
    {
      targetId: 'test-of-significance-section',
      content: 'This is step 4',
      title: 'Test of Significance',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: null,
      icon: 'info',
      requiredTab: 'variables',
      forceChangeTab: true,
    },
    {
      targetId: 'partial-correlation-section',
      content: 'This is step 5',
      title: 'Partial Correlation',
      defaultPosition: 'bottom',
      defaultHorizontalPosition: null,
      icon: 'info',
      requiredTab: 'options',
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
      expect.objectContaining({ targetId: 'bivariate-available-variables' })
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
    expect(document.getElementById('bivariate-test-variables')).not.toBeNull();
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
    
    // Step 3 - Correlation Coefficient
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(2);
    
    // Step 4 - Test of Significance
    act(() => { result.current.nextStep(); });
    expect(result.current.currentStep).toBe(3);
    
    // Step 5 - Partial Correlation
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

  it('should handle tab switching', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const tourStepsWithTabSwitch: TourStep[] = [
      ...mockTourSteps,
      {
        targetId: 'statistics-options-section',
        content: 'This requires options tab',
        title: 'Statistics Options',
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: 'info',
        requiredTab: 'options',
        forceChangeTab: true,
      },
    ];

    // Add the statistics options element to DOM
    document.body.innerHTML += '<div id="statistics-options-section"></div>';

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

    // Now we should be at the tab switching step (step 5)
    expect(result.current.currentStep).toBe(5);
    expect(setActiveTab).toHaveBeenCalledWith('options');

    // Verify tab switching call
    expect(setActiveTab).toHaveBeenCalledTimes(1);
    expect(setActiveTab).toHaveBeenCalledWith('options');
  });
}); 