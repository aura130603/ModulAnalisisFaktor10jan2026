import type { TourStep as BaseTourStep } from '@/types/tourTypes';
import type { TabType } from './types';

// Extended TourStep with required tab property
export type TourStep = BaseTourStep & {
  requiredTab?: TabType;
  forceChangeTab?: boolean;
};

// Constants
export const TABS = {
  VARIABLES: 'variables' as const,
  OPTIONS: 'options' as const,
};

// Base tour step definitions (reduced)
export const baseTourSteps: TourStep[] = [
  // Variables Tab
  {
    title: "Analysis Variables",
    content: "Select the variables you want to evaluate for unusual cases. These should typically be scale variables.",
    targetId: "unusual-cases-analysis-variables",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: 'left',
    icon: null,
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Case Identifier",
    content: "Select a variable that labels the cases (e.g., an ID or name). This helps in identifying the unusual cases in the output.",
    targetId: "unusual-cases-identifier-variable",
    defaultPosition: 'top',
    defaultHorizontalPosition: 'left',
    icon: null,
    requiredTab: TABS.VARIABLES
  },
  {
    title: "Options Tab",
    content: "Click this tab to configure how unusual cases are identified.",
    targetId: "options-tab-trigger",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: null,
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true
  },
  // Options Tab
  {
    title: "Identification Criteria",
    content: "Choose whether to identify a fixed number of unusual cases or a percentage of the total cases.",
    targetId: "unusual-cases-identification-criteria",
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: null,
    requiredTab: TABS.OPTIONS
  },
]; 