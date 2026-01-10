import { renderHook, act } from '@testing-library/react';
import { useTourGuide } from '../hooks/useTourGuide';

describe('useTourGuide', () => {
  const steps = [
    { targetId: 'step1', tooltip: 'Step 1', requiredTab: 'variables' },
    { targetId: 'step2', tooltip: 'Step 2', requiredTab: 'stats' },
  ] as any;

  beforeEach(() => {
    // Inject mock DOM elements for targetId lookup
    document.body.innerHTML = '<div id="step1"></div><div id="step2"></div>';
  });

  it('handles tour lifecycle and tab switching', () => {
    const tabControl: any = { currentActiveTab: 'variables' };
    const setActiveTab = jest.fn((tab: string) => { tabControl.currentActiveTab = tab; });
    tabControl.setActiveTab = setActiveTab;

    const { result } = renderHook(() => useTourGuide(steps, 'dialog', tabControl as any));

    // Start tour
    act(() => {
      result.current.startTour();
    });
    expect(result.current.tourActive).toBe(true);
    expect(result.current.currentStep).toBe(0);

    // Move to next step (should switch tab because requiredTab differs)
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(1);
    expect(setActiveTab).toHaveBeenCalledWith('stats');

    // Prev step should go back and switch tab again
    act(() => {
      result.current.prevStep();
    });
    expect(result.current.currentStep).toBe(0);
    expect(setActiveTab).toHaveBeenCalledWith('variables');

    // Move past last step to end
    act(() => {
      result.current.nextStep();
      result.current.nextStep();
    });

    // Ensure state updates flushed
    expect(result.current.tourActive).toBe(false);
    expect(result.current.currentStep).toBe(0);
  });
}); 