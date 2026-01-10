"use client";

import { useOnborda } from "onborda";
import { useCallback } from "react";
import { getTourByName } from "@/components/Modals/File/ExportCsv/tours";

/**
 * Custom hook for managing Onborda product tours
 * 
 * This hook provides:
 * - Functions for starting specific tours by name
 * - Function to close any active tour
 * - Common tour helper functions
 */
export const useTour = () => {
  const { startOnborda, closeOnborda } = useOnborda();
  
  // Start export CSV tour
  const startExportCsvTour = useCallback(() => {
    startOnborda("exportcsv");
  }, [startOnborda]);
  
  // Function to start any tour by name
  const startTour = useCallback((tourName: string) => {
    const tour = getTourByName(tourName);
    if (tour) {
      startOnborda(tourName);
    } else {
      console.warn(`Tour "${tourName}" not found`);
    }
  }, [startOnborda]);
  
  // Close any active tour
  const closeTour = useCallback(() => {
    closeOnborda();
  }, [closeOnborda]);
  
  return {
    startTour,
    closeTour,
    startExportCsvTour
  };
};

export default useTour; 