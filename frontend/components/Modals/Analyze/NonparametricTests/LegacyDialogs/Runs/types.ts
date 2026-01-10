import { Variable } from '@/types/Variable';
import { Dispatch, SetStateAction } from 'react';
import { TourStep as BaseTourStep } from '@/types/tourTypes';
import { BaseModalProps } from '@/types/modalTypes';

// ---------------------------------
// Constants
// ---------------------------------

// Tab Constants
export const TABS = {
  VARIABLES: 'variables' as const,
  OPTIONS: 'options' as const,
};

// ---------------------------------
// Type
// ---------------------------------

// Tab Type
export type TabType = typeof TABS.VARIABLES | typeof TABS.OPTIONS;

// TourStep Type
export type TourStep = BaseTourStep & {
  requiredTab?: TabType | string;
  forceChangeTab?: boolean;
};

// Highlighted Variable
export type HighlightedVariable = {
  tempId: string;
  source: 'available' | 'test';
};

// Cut Point Options
export interface CutPointOptions {
  median: boolean;
  mode: boolean;
  mean: boolean;
  custom: boolean;
}

// Display Statistics Options
export interface DisplayStatisticsOptions {
  descriptive: boolean;
  quartiles: boolean;
}

// ---------------------------------
// Props
// ---------------------------------

// TabControl Props
export interface TabControlProps {
  setActiveTab: (tab: 'variables' | 'options') => void;
  currentActiveTab: string;
}

// VariablesTab Props
export interface VariablesTabProps {
  availableVariables: Variable[];
  testVariables: Variable[];
  highlightedVariable: HighlightedVariable | null;
  setHighlightedVariable: Dispatch<SetStateAction<HighlightedVariable | null>>;
  moveToTestVariables: (variable: Variable, targetIndex?: number) => void;
  moveToAvailableVariables: (variable: Variable, targetIndex?: number) => void;
  reorderVariables: (source: 'available' | 'test', variables: Variable[]) => void;
  tourActive?: boolean;
  currentStep?: number;
  tourSteps?: TourStep[];
}

// OptionsTab Props
export interface OptionsTabProps {
  cutPoint: CutPointOptions;
  setCutPoint: Dispatch<SetStateAction<CutPointOptions>>;
  customValue: number;
  setCustomValue: Dispatch<SetStateAction<number>>;
  displayStatistics: DisplayStatisticsOptions;
  setDisplayStatistics: Dispatch<SetStateAction<DisplayStatisticsOptions>>;
  tourActive?: boolean;
  currentStep?: number;
  tourSteps?: TourStep[];
}

// TestSettings Props
export interface TestSettingsProps {
  initialCutPoint?: CutPointOptions;
  initialCustomValue?: number;
  initialDisplayStatistics?: DisplayStatisticsOptions;
}

// VariableSelection Props
export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

// RunsAnalysis Props
export interface RunsAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  testVariables: Variable[];
  cutPoint: CutPointOptions;
  customValue: number | null;
  displayStatistics: DisplayStatisticsOptions;
}

// ---------------------------------
// Result
// ---------------------------------

// UseTourGuide Result
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

// RunsTest
export interface RunsTest {
  TestValue: number;
  CasesBelow?: number;
  CasesAbove?: number;
  Total: number;
  Runs: number;
  Z?: number;
  PValue?: number;
}

// Descriptive Statistics
export interface DescriptiveStatistics {
  variable1: Variable;
  N1: number;
  Mean1?: number;
  StdDev1?: number;
  Min1?: number;
  Max1?: number;
  Percentile25_1?: number;
  Percentile50_1?: number;
  Percentile75_1?: number;
}

// Runs Test Result
export interface RunsTestResult {
  variable1: Variable;
  descriptiveStatistics?: DescriptiveStatistics;
  runsTest?: {
    median?: RunsTest;
    mean?: RunsTest;
    mode?: RunsTest;
    custom?: RunsTest;
  };
  metadata?: {
    hasInsufficientData: boolean;
    insufficientType: string[];
    variableName: string;
    variableLabel: string;
  };
} 

// Runs Test Results Collection
export interface RunsTestResults {
  runsTest?: RunsTest[];
  cutPoint?: 'Median' | 'Mean' | 'Mode' | 'Custom';
  descriptiveStatistics?: DescriptiveStatistics[];
}

// ---------------------------------
// Table Types
// ---------------------------------
export interface TableColumnHeader {
  header: string;
  key: string;
  children?: TableColumnHeader[];
}

export interface TableRow {
  [key: string]: any;
  rowHeader?: any[];
}

export interface RunsTestTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
}