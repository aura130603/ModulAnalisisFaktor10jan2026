import { TourStep as BaseTourStep } from '@/types/tourTypes';

export const TABS = {
  VARIABLES: 'variables' as const,
  MODELS: 'models' as const,
};

export type TabType = typeof TABS.VARIABLES | typeof TABS.MODELS;

export type TourStep = BaseTourStep & {
  requiredTab?: TabType;
  forceChangeTab?: boolean;
};

export const baseTourSteps: TourStep[] = [
  {
    title: 'Variables Tab',
    content: 'Select dependent and independent variables here.',
    targetId: 'curve-variables-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '📊',
    requiredTab: TABS.VARIABLES,
  },
  {
    title: 'Models Tab',
    content: 'Choose regression models, include constant, plot lines, etc.',
    targetId: 'curve-models-tab-trigger',
    defaultPosition: 'bottom',
    defaultHorizontalPosition: null,
    icon: '⚙️',
    requiredTab: TABS.VARIABLES,
    forceChangeTab: true,
  },
];