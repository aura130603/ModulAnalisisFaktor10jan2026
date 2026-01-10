import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { TourStep as BaseTourStep, HorizontalPosition } from '@/types/tourTypes';

// Constants
const TABS = {
  VARIABLES: 'variables' as const,
  CELLS: 'cells' as const,
};

const TIMEOUT_DELAY = 200;

export type TabType = typeof TABS.VARIABLES | typeof TABS.CELLS;

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

// Define tour steps for Crosstabs component
const baseTourSteps: TourStep[] = [
  // Variables Tab
  {
    title: "Available Variables",
    content: "Select variables from this list for your analysis. You can drag them or use the arrow buttons.",
    targetId: "crosstabs-available-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'right',
    icon: "📊",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Row Variables",
    content: "Place one or more variables here to define the rows of your crosstabulation table.",
    targetId: "crosstabs-row-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: "↔️",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Column Variables",
    content: "Place one or more variables here to define the columns of your crosstabulation table.",
    targetId: "crosstabs-column-variables",
    defaultPosition: 'top',
    defaultHorizontalPosition: 'left',
    icon: "↕️",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Cells Tab",
    content: "Now, let's customize what is displayed in each cell of the table.",
    targetId: "crosstabs-cells-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🔢",
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true
  },
  // Cells Tab
  {
    title: "Counts",
    content: "Choose to display observed and/or expected counts in each cell. You can also hide cells with small counts.",
    targetId: "crosstabs-counts-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🔢",
    requiredTab: TABS.CELLS
  },
  {
    title: "Percentages",
    content: "Include row, column, or total percentages to better understand the distribution.",
    targetId: "crosstabs-percentages-section",
    defaultPosition: 'top',
    defaultHorizontalPosition: null,
    icon: "%",
    requiredTab: TABS.CELLS
  },
  {
    title: "Residuals",
    content: "Display residuals (unstandardized, standardized, or adjusted) to see the difference between observed and expected counts.",
    targetId: "crosstabs-residuals-section",
    defaultPosition: 'top',
    defaultHorizontalPosition: null,
    icon: "🔍",
    requiredTab: TABS.CELLS
  },
  {
    title: "Run Analysis",
    content: "Once you have configured your analysis, click OK to see the results.",
    targetId: "crosstabs-ok-button",
    defaultPosition: 'top',
    defaultHorizontalPosition: 'left',
    icon: "🚀",
    requiredTab: TABS.CELLS
  },
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

export const useTourGuide = (
  containerType: "dialog" | "sidebar" = "dialog",
  tabControl?: TabControlProps
): UseTourGuideResult => {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});

  const lastTabRef = useRef<TabType | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  // Adjust tour steps based on container type
  const tourSteps = useMemo(() => baseTourSteps.map(step => ({
    ...step,
    horizontalPosition: containerType === "sidebar"
      ? "left" as HorizontalPosition
      : step.defaultHorizontalPosition as HorizontalPosition | null,
    position: containerType === "sidebar" ? undefined : step.defaultPosition,
  })), [containerType]);


  const findTargetElement = useCallback((stepId: string): HTMLElement | null => {
    try {
      return document.getElementById(stepId);
    } catch (error) {
      console.error(`Error finding element with ID ${stepId}:`, error);
      return null;
    }
  }, []);

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);
  
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

  const getRequiredTabForStep = useCallback((stepIndex: number): TabType | undefined => {
    const step = tourSteps[stepIndex];
    return step?.requiredTab;
  }, [tourSteps]);

  const switchTabIfNeeded = useCallback((requiredTab?: TabType) => {
    if (!tabControl || !requiredTab || tabControl.currentActiveTab === requiredTab) {
      return;
    }
    tabControl.setActiveTab(requiredTab);
    lastTabRef.current = requiredTab;
    clearTimeout();
    timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
  }, [tabControl, refreshTargetElements, clearTimeout]);

  useEffect(() => {
    return () => {
        clearTimeout();
    }
  }, [clearTimeout]);

  useEffect(() => {
    if (tourActive) {
      clearTimeout();
      timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
    }
  }, [tourActive, refreshTargetElements, clearTimeout]);

  useEffect(() => {
    if (!tourActive || !tabControl) return;

    const step = tourSteps[currentStep];
    const requiredTab = getRequiredTabForStep(currentStep);

    if (requiredTab && step?.forceChangeTab) {
        const nextStepIndex = currentStep + 1;
        if (nextStepIndex < tourSteps.length) {
            const nextStepRequiredTab = getRequiredTabForStep(nextStepIndex);
            if (nextStepRequiredTab && nextStepRequiredTab !== requiredTab) {
                switchTabIfNeeded(nextStepRequiredTab);
            }
        }
    } else if (requiredTab) {
        switchTabIfNeeded(requiredTab);
    }
  }, [currentStep, tourActive, tabControl, tourSteps, getRequiredTabForStep, switchTabIfNeeded]);


  const startTour = useCallback(() => {
    setCurrentStep(0);
    setTourActive(true);
    if (tabControl) {
      const firstStepTab = getRequiredTabForStep(0);
      if (firstStepTab) {
        tabControl.setActiveTab(firstStepTab);
        lastTabRef.current = firstStepTab;
      }
    }
  }, [tabControl, getRequiredTabForStep]);

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