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

// Test Type Options
export interface TestTypeOptions {
  friedman: boolean;
  kendallsW: boolean;
  cochransQ: boolean;
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
  testType: TestTypeOptions;
  setTestType: Dispatch<SetStateAction<TestTypeOptions>>;
  displayStatistics: DisplayStatisticsOptions;
  setDisplayStatistics: Dispatch<SetStateAction<DisplayStatisticsOptions>>;
  tourActive?: boolean;
  currentStep?: number;
  tourSteps?: TourStep[];
}

// TestSettings Props
export interface TestSettingsProps {
  initialTestType?: TestTypeOptions;
  initialDisplayStatistics?: DisplayStatisticsOptions;
}

// VariableSelection Props
export interface VariableSelectionProps {
  initialVariables?: Variable[];
}

// KRelatedSamplesAnalysis Props
export interface KRelatedSamplesAnalysisProps extends Pick<BaseModalProps, 'onClose' | 'containerType'> {
  testVariables: Variable[];
  testType: TestTypeOptions;
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

// Ranks Result
export interface RanksResult {
  groups: {
    label: string;
    meanRank: number;
  }[];
}

// Test Statistics
export interface TestStatistics {
  TestType: String;
  N: number;
  W?: number;
  TestValue: number;
  PValue: number;
  df: number;
}

// Descriptive Statistics
export interface DescriptiveStatistics {
  N: number;
  Mean?: number;
  StdDev?: number;
  Min?: number;
  Max?: number;
  Percentile25?: number;
  Percentile50?: number;
  Percentile75?: number;
}

// KRelatedSamples Test Result
export interface KRelatedSamplesResult {
    variable: Variable | string;
    ranks?: RanksResult;
    frequencies?: {
        groups: Array<{
            label: string;
            count: number;
        }>;
    };
  testStatistics?: TestStatistics;
  descriptiveStatistics?: DescriptiveStatistics;
  metadata?: {
    hasInsufficientDataEmpty: boolean;
    hasInsufficientDataSingle: boolean;
  };
}

// KRelatedSamples Test Results Collection
export interface KRelatedSamplesResults {
  ranks?: KRelatedSamplesResult[];
  frequencies?: KRelatedSamplesResult[];
  testStatistics?: KRelatedSamplesResult[];
  descriptiveStatistics?: KRelatedSamplesResult[];
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

export interface KRelatedSamplesTable {
  title: string;
  columnHeaders: TableColumnHeader[];
  rows: TableRow[];
}