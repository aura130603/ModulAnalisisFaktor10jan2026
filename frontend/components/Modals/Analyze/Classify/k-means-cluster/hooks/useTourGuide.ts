import { useState, useCallback, useEffect, useMemo } from "react";
import { TourStep } from "@/types/tourTypes";
import { HorizontalPosition } from "@/types/tourTypes";

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

export const useTourGuide = (initialSteps: TourStep[]): UseTourGuideResult => {
    const [tourActive, setTourActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetElements, setTargetElements] = useState<
        Record<string, HTMLElement | null>
    >({});

    const tourSteps = useMemo(
        () =>
            initialSteps.map((step) => ({
                ...step,
                horizontalPosition:
                    step.defaultHorizontalPosition as HorizontalPosition | null,
                position: step.defaultPosition,
            })),
        [initialSteps]
    );

    const findTargetElement = useCallback(
        (stepId: string): HTMLElement | null => {
            return document.getElementById(stepId);
        },
        []
    );

    const refreshTargetElements = useCallback(() => {
        if (!tourActive) return;
        const elements: Record<string, HTMLElement | null> = {};
        tourSteps.forEach((step) => {
            elements[step.targetId] = findTargetElement(step.targetId);
        });
        setTargetElements(elements);
    }, [tourActive, tourSteps, findTargetElement]);

    const handleResize = useCallback(() => {
        if (tourActive) {
            refreshTargetElements();
        }
    }, [tourActive, refreshTargetElements]);

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setTourActive(true);
    }, []);

    const endTour = useCallback(() => {
        setTourActive(false);
        setCurrentStep(0);
    }, []);

    const nextStep = useCallback(() => {
        const nextStepIndex = currentStep + 1;
        if (nextStepIndex < tourSteps.length) {
            setCurrentStep(nextStepIndex);
        } else {
            endTour();
        }
    }, [currentStep, tourSteps, endTour]);

    const prevStep = useCallback(() => {
        const prevStepIndex = currentStep - 1;
        if (prevStepIndex >= 0) {
            setCurrentStep(prevStepIndex);
        }
    }, [currentStep]);

    const currentTargetElement = useMemo(() => {
        if (!tourActive) return null;
        const currentStepData = tourSteps[currentStep];
        return targetElements[currentStepData.targetId] ?? null;
    }, [tourActive, tourSteps, currentStep, targetElements]);

    useEffect(() => {
        if (tourActive) {
            refreshTargetElements();
        }
    }, [currentStep, tourActive, refreshTargetElements]);

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [handleResize]);

    return {
        tourActive,
        currentStep,
        tourSteps,
        currentTargetElement,
        startTour,
        nextStep,
        prevStep,
        endTour,
    };
};
