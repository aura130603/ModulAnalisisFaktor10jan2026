import { useState, useCallback } from 'react';
import type { ChartOptions } from '../types';

export interface ChartsSettingsProps {
  initialShowCharts?: boolean;
  initialChartType?: "none" | "barCharts" | "pieCharts" | "histograms";
  initialChartValues?: "frequencies" | "percentages";
  initialShowNormalCurve?: boolean;
}

export interface ChartsSettingsResult {
  showCharts: boolean;
  setShowCharts: React.Dispatch<React.SetStateAction<boolean>>;
  chartType: "none" | "barCharts" | "pieCharts" | "histograms";
  setChartType: React.Dispatch<React.SetStateAction<"none" | "barCharts" | "pieCharts" | "histograms">>;
  chartValues: "frequencies" | "percentages";
  setChartValues: React.Dispatch<React.SetStateAction<"frequencies" | "percentages">>;
  showNormalCurve: boolean;
  setShowNormalCurve: React.Dispatch<React.SetStateAction<boolean>>;
  getCurrentChartOptions: () => ChartOptions | null;
  resetChartsSettings: () => void;
}

export const useChartsSettings = ({
  initialShowCharts = false,
  initialChartType = "none", 
  initialChartValues = "frequencies",
  initialShowNormalCurve = false
}: ChartsSettingsProps = {}): ChartsSettingsResult => {
  const [showCharts, setShowCharts] = useState<boolean>(initialShowCharts);
  const [chartType, setChartType] = useState<"none" | "barCharts" | "pieCharts" | "histograms">(initialChartType);
  const [chartValues, setChartValues] = useState<"frequencies" | "percentages">(initialChartValues);
  const [showNormalCurve, setShowNormalCurve] = useState<boolean>(initialShowNormalCurve);

  /**
   * Get the current chart options for analysis
   */
  const getCurrentChartOptions = useCallback((): ChartOptions | null => {
    if (!showCharts) return null;
    return {
      type: chartType === "none" ? null : chartType,
      values: chartValues,
      showNormalCurveOnHistogram: chartType === "histograms" ? showNormalCurve : false,
    };
  }, [showCharts, chartType, chartValues, showNormalCurve]);

  /**
   * Reset all chart settings to default values
   */
  const resetChartsSettings = useCallback(() => {
    setShowCharts(false);
    setChartType("none");
    setChartValues("frequencies");
    setShowNormalCurve(false);
  }, []);

  return {
    showCharts,
    setShowCharts,
    chartType,
    setChartType,
    chartValues,
    setChartValues,
    showNormalCurve,
    setShowNormalCurve,
    getCurrentChartOptions,
    resetChartsSettings
  };
}; 