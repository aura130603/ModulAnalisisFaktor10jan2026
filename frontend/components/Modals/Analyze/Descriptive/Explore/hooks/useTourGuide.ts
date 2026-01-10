import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { TourStep as BaseTourStep, HorizontalPosition } from '@/types/tourTypes';

// Constants
const TABS = {
  VARIABLES: 'variables' as const,
  STATISTICS: 'statistics' as const,
  PLOTS: 'plots' as const,
};

const TIMEOUT_DELAY = 200;

export type TabType = typeof TABS.VARIABLES | typeof TABS.STATISTICS | typeof TABS.PLOTS;

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

// Define tour steps for Explore component
const baseTourSteps: TourStep[] = [
  // Variables Tab
  {
    title: "Dependent & Factor Lists",
    content: "Move variables into the 'Dependent List' for analysis and into the 'Factor List' to group the data. The 'Label Cases by' field is optional.",
    targetId: "explore-variable-lists",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: "📋",
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Statistics Tab",
    content: "Click this tab to select the specific statistics to be calculated.",
    targetId: "explore-statistics-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📈",
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true
  },
  // Statistics Tab
  {
    title: "Descriptives",
    content: "Enable this to see descriptive statistics. You can also set a custom confidence interval for the mean.",
    targetId: "explore-descriptives-section",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📊",
    requiredTab: TABS.STATISTICS
  },
  {
    title: "Additional Statistics",
    content: "You can also request robust M-estimators, identify outliers, and calculate percentiles.",
    targetId: "explore-additional-stats-section",
    defaultPosition: 'top',
    defaultHorizontalPosition: null,
    icon: "➕",
    requiredTab: TABS.STATISTICS
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