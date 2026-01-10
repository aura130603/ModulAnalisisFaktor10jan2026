import { TABS, TourStep } from '../types';

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content: "Select numeric variables from this list to analyze with One-Sample T Test.",
        targetId: "one-sample-t-test-available-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📊",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test Variables",
        content: "Variables moved to this list will be analyzed. You can reorder them by dragging.",
        targetId: "one-sample-t-test-test-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'right',
        icon: "📋",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test Value",
        content: "Specify the value to test your variables against. This is the hypothesized mean value.",
        targetId: "test-value-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "🔢",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Estimate Effect Size",
        content: "This option is currently disabled as the effect size calculation feature is not yet available in this version. When implemented, it will allow you to include effect size calculations in your results.",
        targetId: "estimate-effect-size-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📏",
        requiredTab: TABS.VARIABLES
    }
];
