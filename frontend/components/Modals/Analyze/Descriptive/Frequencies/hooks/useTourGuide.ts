import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { TourStep as BaseTourStep, HorizontalPosition } from '@/types/tourTypes';

// Constants
const TABS = {
  VARIABLES: 'variables' as const,
  STATISTICS: 'statistics' as const,
  CHARTS: 'charts' as const,
};

const TIMEOUT_DELAY = 200;
const STEP_INDICES = {
  VARIABLES_TAB_STEPS: [0, 1, 2, 3],
  STATISTICS_TAB_STEPS: [4, 5, 6, 7, 8],
  CHARTS_TAB_STEPS: [9, 10, 11],
  SWITCH_TO_STATS_STEP: 3, 
  SWITCH_TO_CHARTS_STEP: 8,
};

export type TabType = typeof TABS.VARIABLES | typeof TABS.STATISTICS | typeof TABS.CHARTS;

// Extended TourStep with required tab property
export type TourStep = BaseTourStep & {
  requiredTab?: TabType;
  forceChangeTab?: boolean;
};

// Tab control interface
export interface TabControlProps {
  setActiveTab: (tab: TabType) => void;
  currentActiveTab: TabType;
}

// Element selectors for reliable targeting
const ELEMENT_SELECTORS: Record<string, string> = {
  'selected-variables-list': '[data-list-id="selected"]',
};

// Statistics section IDs for direct access
const STATISTICS_SECTIONS = [
  'percentile-values-section',
  'central-tendency-section', 
  'dispersion-section', 
  'distribution-section'
];

// Base tour step definitions
const baseTourSteps: TourStep[] = [
  {
    title: "Variables Selection",
    content: "Drag variables from the available list to analyze their frequencies, or use the arrow button to move them.",
    targetId: "frequencies-available-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📊",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Selected Variables",
    content: "Variables in this list will be analyzed. You can reorder them by dragging.",
    targetId: "frequencies-selected-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: "📋",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Frequency Tables",
    content: "Enable this option to display frequency tables in the output.",
    targetId: "display-frequency-tables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📑",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Statistics Tab",
    content: "Click on this tab to configure descriptive statistics for your analysis.",
    targetId: "statistics-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📈",
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true
  },
  {
    title: "Percentile Values",
    content: "Calculate quartiles, cut points, and custom percentiles for your data.",
    targetId: "percentile-values-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📏",
    requiredTab: TABS.STATISTICS
  },
  {
    title: "Central Tendency",
    content: "Calculate measures like mean, median, mode, and sum to understand the central values of your data.",
    targetId: "central-tendency-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🎯",
    requiredTab: TABS.STATISTICS
  },
  {
    title: "Dispersion",
    content: "Analyze data spread with standard deviation, variance, range, minimum and maximum values.",
    targetId: "dispersion-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📊",
    requiredTab: TABS.STATISTICS
  },
  {
    title: "Distribution",
    content: "Examine distribution characteristics with skewness and kurtosis measures.",
    targetId: "distribution-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📉",
    requiredTab: TABS.STATISTICS
  },
  {
    title: "Charts Tab",
    content: "Click here to set up chart generation for the analysis.",
    targetId: "charts-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📊",
    requiredTab: TABS.STATISTICS,
    forceChangeTab: true
  },
  {
    title: "Enable & Select Charts",
    content: "First, enable charts, then choose the type of chart to display (bar, pie, or histogram).",
    targetId: "chart-type-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📈",
    requiredTab: TABS.CHARTS
  },
  {
    title: "Chart Values",
    content: "Choose whether the chart should represent frequencies or percentages.",
    targetId: "chart-values-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🔢",
    requiredTab: TABS.CHARTS
  }
];

export interface UseTourGuideResult {
  tourActive: boolean;
  currentStep: number;
  tourSteps: TourStep[];
  currentTargetElement: HTMLElement | null;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

/**
 * Custom hook for creating an interactive tour guide with tab switching support
 * @param containerType Type of container ("dialog" or "sidebar")
 * @param tabControl Optional tab control interface for tab switching
 * @returns Tour guide control functions and state
 */
export const useTourGuide = (
  containerType: "dialog" | "sidebar" = "dialog",
  tabControl?: TabControlProps
): UseTourGuideResult => {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});
  
  const lastTabRef = useRef<TabType | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  
  // Process tour steps once based on container type
  const tourSteps = useMemo(() => baseTourSteps.map(step => ({
    ...step,
    horizontalPosition: containerType === "sidebar" 
      ? "left" as HorizontalPosition 
      : step.defaultHorizontalPosition as HorizontalPosition | null,
    position: containerType === "sidebar" ? undefined : step.defaultPosition,
  })), [containerType]);

  // Find target element with optimized selector strategy
  const findTargetElement = useCallback((stepId: string): HTMLElement | null => {
    try {
      let element = document.getElementById(stepId);
      
      if (!element && ELEMENT_SELECTORS[stepId]) {
        element = document.querySelector(ELEMENT_SELECTORS[stepId]) as HTMLElement;
      }
      
      if (!element && STATISTICS_SECTIONS.includes(stepId)) {
        element = document.getElementById(stepId);
      }
      
      if (!element && stepId === 'selected-variables-list') {
        element = document.getElementById('selected-variables-wrapper');
      }

      return element;
    } catch (error) {
      console.error(`Error finding element with ID ${stepId}:`, error);
      return null;
    }
  }, []);

  // Helper to clear timeout safely
  const clearTimeout = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  // Update target elements
  const refreshTargetElements = useCallback(() => {
    if (!tourActive) return;
    
    try {
      const elements: Record<string, HTMLElement | null> = {};
      tourSteps.forEach(step => {
        elements[step.targetId] = findTargetElement(step.targetId);
      });
      
      setTargetElements(elements);
    } catch (error) {
      console.error("Error refreshing target elements:", error);
    }
  }, [tourActive, tourSteps, findTargetElement]);

  // Determine required tab for current step
  const getRequiredTabForStep = useCallback((stepIndex: number): TabType | undefined => {
    // When the tour reaches the "switch" trigger steps, we need to PRE-emptively
    // change to the tab that will be required by the *next* step so the UI is
    // ready when the user clicks "Next". Therefore:
    if (stepIndex === STEP_INDICES.SWITCH_TO_STATS_STEP) {
      return TABS.STATISTICS; // Step 3 triggers move to Statistics tab
    }
    if (stepIndex === STEP_INDICES.SWITCH_TO_CHARTS_STEP) {
      return TABS.CHARTS;     // Step 8 triggers move to Charts tab
    }

    // In all other cases, rely on the step's own requiredTab value
    const step = tourSteps[stepIndex];
    return step?.requiredTab;
  }, [tourSteps]);

  // Switch tab only if needed
  const switchTabIfNeeded = useCallback((requiredTab?: TabType) => {
    if (!tabControl || !requiredTab || tabControl.currentActiveTab === requiredTab) {
      return;
    }
    
    tabControl.setActiveTab(requiredTab);
    lastTabRef.current = requiredTab;
    
    clearTimeout();
    timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
  }, [tabControl, refreshTargetElements, clearTimeout]);

  // Clean up on unmount
  useEffect(() => {
    return clearTimeout;
  }, [clearTimeout]);

  // Handle tab switching based on step changes
  useEffect(() => {
    if (!tourActive || !tabControl || currentStep < 0 || currentStep >= tourSteps.length) return;

    const requiredTab = getRequiredTabForStep(currentStep);
    if (requiredTab) {
      switchTabIfNeeded(requiredTab);
    }
  }, [currentStep, tabControl, tourActive, tourSteps.length, switchTabIfNeeded, getRequiredTabForStep]);

  // Initialize and refresh elements when tour starts
  useEffect(() => {
    if (tourActive) {
      clearTimeout();
      timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
    }
  }, [tourActive, refreshTargetElements, clearTimeout]);

  // Tour control functions
  const startTour = useCallback(() => {
    setCurrentStep(0);
    setTourActive(true);
    
    if (tabControl) {
      tabControl.setActiveTab(TABS.VARIABLES);
      lastTabRef.current = TABS.VARIABLES;
    }
  }, [tabControl]);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, tourSteps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const endTour = useCallback(() => {
    setTourActive(false);
  }, []);

  // Calculate current target element
  const currentTargetElement = useMemo(() => {
    if (!tourActive || tourSteps.length === 0 || currentStep >= tourSteps.length) {
      return null;
    }
    
    const currentStepData = tourSteps[currentStep];
    return currentStepData ? targetElements[currentStepData.targetId] || null : null;
  }, [tourActive, tourSteps, currentStep, targetElements]);

  return {
    tourActive,
    currentStep,
    tourSteps,
    currentTargetElement,
    startTour,
    nextStep,
    prevStep,
    endTour
  };
}; 