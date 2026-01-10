import { TABS, TourStep } from '../types';

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content: "Select variables from the available list to analyze with K Related Samples Test. Only numeric variables are shown.",
        targetId: "k-related-samples-available-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📊",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test Variables",
        content: "Variables in this list will be analyzed. You can reorder them by dragging.",
        targetId: "k-related-samples-test-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📋",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Options Tab",
        content: "Click here to configure test options and settings.",
        targetId: "k-related-samples-options-tab-trigger",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES,
        forceChangeTab: true
    },
    {
        title: "Test Type",
        content: "Choose the type of test to perform.",
        targetId: "test-type-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📏",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Statistics",
        content: "Select additional statistics to include in the results.",
        targetId: "statistics-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📈",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Run Analysis",
        content: "Click OK to run the analysis with your selected variables and settings.",
        targetId: "k-related-samples-ok-button",
        defaultPosition: 'top',
        defaultHorizontalPosition: null,
        icon: "▶️",
        requiredTab: TABS.OPTIONS
    }
];
