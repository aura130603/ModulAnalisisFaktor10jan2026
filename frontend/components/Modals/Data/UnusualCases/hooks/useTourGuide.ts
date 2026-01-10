import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { TourStep as BaseTourStep, HorizontalPosition } from '@/types/tourTypes';

// Constants
const TIMEOUT_DELAY = 200;

// This TourStep type is now generic, using 'string' for tab identifiers.
export type TourStep = BaseTourStep & {
  requiredTab?: string;
  forceChangeTab?: boolean;
};

// This interface is now generic for any tab-based component.
export interface TabControlProps {
  setActiveTab: (tab: string) => void;
  currentActiveTab: string;
}

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
  initialSteps: TourStep[], // The hook now accepts the steps as a parameter.
  containerType: "dialog" | "sidebar" = "dialog",
  tabControl?: TabControlProps
): UseTourGuideResult => {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});
  
  const lastTabRef = useRef<string | null>(null); // Changed to generic string
  const timeoutRef = useRef<number | undefined>(undefined);
  
  const tourSteps = useMemo(() => initialSteps.map(step => ({
    ...step,
    horizontalPosition: containerType === "sidebar" 
      ? "left" as HorizontalPosition 
      : step.defaultHorizontalPosition as HorizontalPosition | null,
    position: containerType === "sidebar" ? undefined : step.defaultPosition,
  })), [initialSteps, containerType]);

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

  const getRequiredTabForStep = useCallback((stepIndex: number): string | undefined => {
    const step = tourSteps[stepIndex];
    return step?.requiredTab;
  }, [tourSteps]);

  const switchTabIfNeeded = useCallback((requiredTab?: string) => {
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