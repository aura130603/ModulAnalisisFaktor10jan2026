import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { TourStep as BaseTourStep, HorizontalPosition } from '@/types/tourTypes';

// Tab definitions
type TabType = 'variables' | 'options';
const TABS = {
  VARIABLES: 'variables' as const,
  OPTIONS: 'options' as const,
};

const TIMEOUT_DELAY = 200;

// TourStep with required tab property
export type TourStep = BaseTourStep & {
  requiredTab?: TabType;
  forceChangeTab?: boolean;
};

// Tab control interface
export interface TabControlProps {
  setActiveTab: (tab: TabType) => void;
  currentActiveTab: TabType;
}

// Tour steps definition
const baseTourSteps: TourStep[] = [
  // Variables Tab
  {
    title: "Define Matching Variables",
    content: "Select the variables that will be used to identify duplicate cases. Cases with identical values in these variables will be considered duplicates.",
    targetId: "duplicate-cases-matching-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: null,
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Sort Within Matching Groups",
    content: "Optionally, select variables to sort cases within each group of duplicates. This helps determine which case is kept as the 'primary' one.",
    targetId: "duplicate-cases-sorting-variables",
    defaultPosition: 'top',
    defaultHorizontalPosition: 'left',
    icon: null,
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Configure Options",
    content: "Click this tab to access more options for handling duplicates.",
    targetId: "options-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: null,
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true
  },
  // Options Tab
  {
    title: "New Indicator Variables",
    content: "These options create new variables in your dataset. You can flag primary cases or create a sequential count for duplicates within each group.",
    targetId: "duplicate-cases-indicator-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: null,
    requiredTab: TABS.OPTIONS
  },
  {
    title: "Move Duplicates",
    content: "Enable this option to automatically move all identified duplicate cases to the top of your dataset for easier review.",
    targetId: "duplicate-cases-move-duplicates",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: null,
    requiredTab: TABS.OPTIONS
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
    return document.getElementById(stepId);
  }, []);

  const clearTimeoutCallback = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const refreshTargetElements = useCallback(() => {
    if (!tourActive) return;
    const elements: Record<string, HTMLElement | null> = {};
    tourSteps.forEach(step => {
      elements[step.targetId] = findTargetElement(step.targetId);
    });
    setTargetElements(elements);
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
    clearTimeoutCallback();
    timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
  }, [tabControl, refreshTargetElements, clearTimeoutCallback]);

  useEffect(() => {
    if (tourActive) {
      refreshTargetElements();
      const requiredTab = getRequiredTabForStep(currentStep);
      switchTabIfNeeded(requiredTab);
    }
  }, [currentStep, tourActive, getRequiredTabForStep, switchTabIfNeeded, refreshTargetElements]);

  const handleResize = useCallback(() => {
    if (tourActive) {
      refreshTargetElements();
    }
  }, [tourActive, refreshTargetElements]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeoutCallback();
    };
  }, [handleResize, clearTimeoutCallback]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setTourActive(true);
    const requiredTab = getRequiredTabForStep(0);
    if (tabControl && tabControl.currentActiveTab !== requiredTab) {
        switchTabIfNeeded(requiredTab);
    }
  }, [getRequiredTabForStep, tabControl, switchTabIfNeeded]);

  const endTour = useCallback(() => {
    setTourActive(false);
    setCurrentStep(0);
    clearTimeoutCallback();
  }, [clearTimeoutCallback]);

  const nextStep = useCallback(() => {
    const nextStepIndex = currentStep + 1;
    if (nextStepIndex < tourSteps.length) {
      const step = tourSteps[currentStep];
      if (step.forceChangeTab) {
        const nextStep = tourSteps[nextStepIndex];
        switchTabIfNeeded(nextStep.requiredTab);
      }
      setCurrentStep(nextStepIndex);
    } else {
      endTour();
    }
  }, [currentStep, tourSteps, switchTabIfNeeded, endTour]);

  const prevStep = useCallback(() => {
    const prevStepIndex = currentStep - 1;
    if (prevStepIndex >= 0) {
      const requiredTab = getRequiredTabForStep(prevStepIndex);
      switchTabIfNeeded(requiredTab);
      setCurrentStep(prevStepIndex);
    }
  }, [currentStep, getRequiredTabForStep, switchTabIfNeeded]);

  const currentTargetElement = useMemo(() => {
    if (!tourActive) return null;
    const currentStepData = tourSteps[currentStep];
    return targetElements[currentStepData.targetId] ?? null;
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