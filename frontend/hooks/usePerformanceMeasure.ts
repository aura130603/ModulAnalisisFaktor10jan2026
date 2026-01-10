import { useCallback, useRef } from "react";

/**
 * Interface for performance measurement entry.
 */
interface PerformanceMeasurement {
    name: string;
    duration: number;
    startTime: number;
    entryType: string;
}

/**
 * Custom hook for measuring performance of specific code blocks.
 *
 * @returns An object containing functions to start, end, get, and clear performance measurements.
 */
export function usePerformanceMeasure() {
    // Use useRef to store measurements without causing re-renders on update.
    const measurementsRef = useRef<PerformanceMeasurement[]>([]);

    /**
     * Marks the starting point for a performance measurement.
     * @param name - A unique identifier for the measurement.
     */
    const startMeasure = useCallback((name: string) => {
        try {
            performance.mark(`start-${name}`);
        } catch (error) {
            console.error(
                `Failed to start performance mark for "${name}":`,
                error
            );
        }
    }, []);

    /**
     * Marks the ending point for a performance measurement and calculates the duration.
     * Stores the measurement result.
     * @param name - The unique identifier used in startMeasure.
     */
    const endMeasure = useCallback((name: string) => {
        try {
            const startMark = `start-${name}`;
            const endMark = `end-${name}`;
            performance.mark(endMark);
            performance.measure(name, startMark, endMark);

            // Retrieve the measurement entry
            const entry = performance.getEntriesByName(name, "measure")[0];
            if (entry) {
                measurementsRef.current.push({
                    name: entry.name,
                    duration: entry.duration,
                    startTime: entry.startTime,
                    entryType: entry.entryType,
                });
                // Optional: Clear marks and measures immediately after recording
                // to avoid cluttering the performance timeline.
                performance.clearMarks(startMark);
                performance.clearMarks(endMark);
                performance.clearMeasures(name);
            } else {
                console.warn(
                    `Could not find performance measure entry for "${name}".`
                );
            }
        } catch (error) {
            console.error(
                `Failed to end performance measure for "${name}":`,
                error
            );
            // Attempt to clean up the start mark if ending failed
            try {
                performance.clearMarks(`start-${name}`);
            } catch (cleanupError) {
                console.error(
                    `Failed to clean up start mark for "${name}":`,
                    cleanupError
                );
            }
        }
    }, []);

    /**
     * Retrieves all recorded performance measurements.
     * @returns An array of performance measurement objects.
     */
    const getMeasurements = useCallback((): PerformanceMeasurement[] => {
        // Return a copy to prevent external modification of the ref's current value.
        return [...measurementsRef.current];
    }, []);

    /**
     * Clears all recorded performance measurements.
     */
    const clearMeasurements = useCallback(() => {
        measurementsRef.current = [];
        // Also clear any remaining marks/measures from the performance timeline
        // Note: This clears ALL marks and measures, not just those from this hook instance.
        // Be cautious if other parts of the application use the Performance API directly.
        // performance.clearMarks();
        // performance.clearMeasures();
        console.log("Performance measurements cleared.");
    }, []);

    return { startMeasure, endMeasure, getMeasurements, clearMeasurements };
}

export default usePerformanceMeasure;
