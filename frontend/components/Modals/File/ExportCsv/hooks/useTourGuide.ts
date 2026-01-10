import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { TourStep, HorizontalPosition} from '@/types/tourTypes';
import { PopupPosition } from '@/types/tourTypes';

// Define tour steps for ExportCsv component according to the guide
const baseTourSteps: TourStep[] = [
  {
    title: "Nama File",
    content: "Tentukan nama file untuk hasil ekspor CSV Anda di sini. Ekstensi .csv akan ditambahkan secara otomatis.",
    targetId: "csv-filename-wrapper",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "📝",
  },
  {
    title: "Pemisah Data",
    content: "Pilih karakter yang akan digunakan untuk memisahkan nilai dalam file CSV Anda.",
    targetId: "csv-delimiter-wrapper",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🔣",
  },
  {
    title: "Header Variabel",
    content: "Pilih apakah akan menyertakan nama variabel sebagai baris header dalam file CSV.",
    targetId: "csv-headers-wrapper",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🏷️",
  },
  {
    title: "Properti Variabel",
    content: "Anda dapat menyertakan properti variabel seperti tipe data dan label sebagai baris pertama.",
    targetId: "csv-properties-wrapper",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🧩",
  },
  {
    title: "Kutip String",
    content: "Aktifkan opsi ini untuk mengapit semua nilai string dengan tanda kutip.",
    targetId: "csv-quotes-wrapper",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🔠",
  },
  {
    title: "Pengkodean",
    content: "Pilih pengkodean karakter untuk file CSV Anda. UTF-8 adalah standar yang paling umum digunakan.",
    targetId: "csv-encoding-wrapper",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: "🌐",
  },
  {
    title: "Tombol Ekspor",
    content: "Setelah mengatur semua opsi, klik tombol 'Export' untuk mengunduh file CSV Anda.",
    targetId: "csv-buttons-wrapper",
    defaultPosition: 'top',
    defaultHorizontalPosition: null,
    icon: "💾",
  },
];

// Constants following the guide pattern
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
 * Custom hook untuk implementasi tour guide interaktif sesuai panduan
 * @param containerType Tipe container ("dialog", "sidebar", atau "panel")
 * @returns Fungsi kontrol dan status tour guide
 */
export const useTourGuide = (
  containerType: "dialog" | "sidebar" | "panel" = "dialog"
): UseTourGuideResult => {const [tourActive, setTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElements, setTargetElements] = useState<Record<string, HTMLElement | null>>({});
  
  // Menggunakan useRef untuk timeout management
  const timeoutRef = useRef<number | undefined>(undefined);
    // Proses langkah tour berdasarkan tipe container
  const tourSteps = useMemo(() => baseTourSteps.map(step => ({
    ...step,
    position: containerType === "sidebar" ? undefined : step.defaultPosition,
    horizontalPosition: containerType === "sidebar" ? "left" as HorizontalPosition : null,
  })), [containerType]);

  // Temukan elemen target dengan strategi selector yang dioptimalkan
  const findTargetElement = useCallback((stepId: string): HTMLElement | null => {
    try {
      // Primary selector - langsung dengan ID
      let element = document.getElementById(stepId);
      if (element) return element;
      
      // Fallback selectors untuk kompatibilitas
      const fallbackSelectors = [
        `[data-tour-id="${stepId}"]`,
        `[data-testid="${stepId}"]`,
        `.${stepId}`,
      ];
      
      for (const selector of fallbackSelectors) {
        element = document.querySelector(selector) as HTMLElement;
        if (element) return element;
      }
      
      return null;
    } catch (error) {
      console.error(`Error finding target element for ${stepId}:`, error);
      return null;
    }
  }, []);

  // Helper untuk membersihkan timeout dengan aman
  const clearTimeout = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  // Refresh target elements dengan timeout untuk stabilitas
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
  // Inisialisasi dan refresh elemen saat tour aktif
  useEffect(() => {
    if (!tourActive) return;
    
    // Initial refresh
    refreshTargetElements();
    
    // Delayed refresh untuk memastikan DOM sudah stabil
    timeoutRef.current = window.setTimeout(refreshTargetElements, TIMEOUT_DELAY);
    
    return clearTimeout;
  }, [tourActive, refreshTargetElements, clearTimeout]);

  // Bersihkan saat unmount
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

  // Kalkulasi elemen target saat ini dengan useMemo
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