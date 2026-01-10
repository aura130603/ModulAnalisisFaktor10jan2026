import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { TourStep, HorizontalPosition } from '@/types/tourTypes';

// Define tour steps for ExportExcel component
const baseTourSteps: TourStep[] = [
    {
        title: "Nama File",
        content: "Tentukan nama file untuk hasil ekspor Excel Anda di sini.",
        targetId: "excel-filename-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: null,
    },
    {
        title: "Format File",
        content: "Pilih format file Excel. XLSX adalah format modern, sedangkan XLS untuk kompatibilitas lama.",
        targetId: "excel-format-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: null,
    },
    {
        title: "Sertakan Header",
        content: "Aktifkan untuk menyertakan nama variabel sebagai baris header di sheet data.",
        targetId: "excel-includeHeaders-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: null,
    },
    {
        title: "Sheet Properti Variabel",
        content: "Membuat sheet terpisah yang berisi detail properti untuk setiap variabel.",
        targetId: "excel-includeVariableProperties-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: null,
    },
    {
        title: "Sheet Metadata",
        content: "Menambahkan sheet terpisah yang berisi metadata file atau dataset jika tersedia.",
        targetId: "excel-includeMetadataSheet-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: null,
    },
    {
        title: "Gaya Header",
        content: "Terapkan styling dasar (seperti tebal) pada baris header untuk keterbacaan yang lebih baik.",
        targetId: "excel-applyHeaderStyling-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: null,
    },
    {
        title: "Tampilkan Data Hilang",
        content: "Ganti sel kosong dari data yang hilang dengan teks 'SYSMIS' untuk identifikasi.",
        targetId: "excel-includeDataLabels-wrapper",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: null,
    }
];

const TIMEOUT_DELAY = 200;

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
 * Custom hook for interactive tour guide for ExportExcel modal
 * @param containerType The type of container ("dialog", "sidebar", etc.)
 * @returns Tour guide state and control functions
 */
export const useTourGuide = (
  containerType: "dialog" | "sidebar" | "panel" = "dialog"
): UseTourGuideResult => {
  const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});
  
  const timeoutRef = useRef<number | undefined>(undefined);

  const tourSteps = useMemo(() => baseTourSteps.map(step => ({
    ...step,
    position: containerType === "sidebar" ? undefined : step.defaultPosition,
    horizontalPosition: containerType === "sidebar" ? "left" as HorizontalPosition : null,
  })), [containerType]);

  const findTargetElement = useCallback((stepId: string): HTMLElement | null => {
    try {
      return document.getElementById(stepId) ?? document.querySelector(`[data-tour-id="${stepId}"]`);
    } catch (error) {
      console.error(`Error finding target element for ${stepId}:`, error);
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
    try {
      const elements: Record<string, HTMLElement | null> = {};
      tourSteps.forEach(step => {
        elements[step.targetId] = findTargetElement(step.targetId);
      });
      setTargetElements(elements);
    } catch (error) {
      console.error("Error refreshing target elements:", error);
    }
  }, [tourSteps, findTargetElement]);

  useEffect(() => {
    if (!tourActive) return;
    
    refreshTargetElements();
    timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
    
    return clearTimeout;
  }, [tourActive, refreshTargetElements, clearTimeout]);

  useEffect(() => {
    return clearTimeout;
  }, [clearTimeout]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setTourActive(true);
  }, []);

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
    setCurrentStep(0);
  }, []);

  const currentTargetElement = useMemo(() => {
    if (!tourActive || tourSteps.length === 0 || currentStep >= tourSteps.length) {
      return null;
    }
    const currentStepData = tourSteps[currentStep];
    return currentStepData ? (targetElements[currentStepData.targetId] ?? null) : null;
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