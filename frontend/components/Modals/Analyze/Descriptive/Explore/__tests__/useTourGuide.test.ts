import { renderHook, act } from '@testing-library/react';
import { useTourGuide, TabControlProps, TabType } from '../hooks/useTourGuide';

jest.useFakeTimers();

describe('Explore useTourGuide hook', () => {
  let tabControl: TabControlProps;

  beforeEach(() => {
    document.body.innerHTML = `
      <div>
        <div id="explore-variable-lists"></div>
        <div id="explore-statistics-tab-trigger"></div>
        <div id="explore-descriptives-section"></div>
        <div id="explore-additional-stats-section"></div>
      </div>
    `;

    tabControl = {
      setActiveTab: jest.fn(),
      currentActiveTab: 'variables' as TabType,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('starts and ends tour correctly', () => {
    const { result } = renderHook(() => useTourGuide('dialog', tabControl));

    act(() => result.current.startTour());
    expect(result.current.tourActive).toBe(true);
    expect(tabControl.setActiveTab).toHaveBeenCalledWith('variables');

    act(() => result.current.endTour());
    expect(result.current.tourActive).toBe(false);
  });

  it('advances steps and targets correct element', () => {
    const { result } = renderHook(() => useTourGuide('dialog', tabControl));

    act(() => result.current.startTour());
    act(() => jest.advanceTimersByTime(201));

    expect(result.current.currentTargetElement?.id).toBe('explore-variable-lists');

    act(() => result.current.nextStep());
    // After step 1, no tab switch yet, still variables
    expect(tabControl.setActiveTab).toHaveBeenCalledWith('variables');

    act(() => result.current.nextStep()); // force change to statistics
    expect(tabControl.setActiveTab).toHaveBeenCalledWith('statistics');
  });
}); 