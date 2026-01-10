import { TourStep as BaseTourStep } from '@/types/tourTypes';

// Tabs constants
export const TABS = {
  VARIABLES: 'variables' as const,
  STATISTICS: 'statistics' as const,
};

export type TabType = typeof TABS.VARIABLES | typeof TABS.STATISTICS;

export type TourStep = BaseTourStep & {
  requiredTab?: TabType;
  forceChangeTab?: boolean;
};

export const baseTourSteps: TourStep[] = [
  {
    title: 'Variables Tab',
    content: 'Select dependent and independent variables here.',
    targetId: 'linear-variables-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📊',
    requiredTab: TABS.VARIABLES,
  },
  {
    title: 'Statistics Tab',
    content: 'Configure which statistics and diagnostics to generate.',
    targetId: 'linear-statistics-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📈',
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true,
  },
  {
    title: 'Plots Tab',
    content: 'Create scatter plots and histograms for selected variables.',
    targetId: 'linear-plots-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📊',
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true,
  },
  {
    title: 'Save Tab',
    content: 'Choose which predicted values and residuals to save to your dataset.',
    targetId: 'linear-save-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '💾',
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true,
  },
  {
    title: 'Assumption Tab',
    content: 'Run assumption tests: linearity, normality, homoscedasticity, etc.',
    targetId: 'linear-assumption-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '✅',
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true,
  },
];