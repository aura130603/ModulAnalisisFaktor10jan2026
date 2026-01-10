import { TABS, TourStep } from '../types';

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content: "Select variables from the available list to analyze with Chi-Square Test. Only numeric variables are shown.",
        targetId: "chi-square-available-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📊",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test Variables",
        content: "Variables in this list will be analyzed. You can reorder them by dragging.",
        targetId: "chi-square-test-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📋",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Options Tab",
        content: "Click here to configure test options and settings.",
        targetId: "options-tab-trigger",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES,
        forceChangeTab: true
    },
    {
        title: "Expected Range",
        content: "Choose whether to get the range from data or specify a custom range.",
        targetId: "expected-range-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📏",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Expected Value",
        content: "Define how expected values should be calculated for the test.",
        targetId: "expected-value-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "🔢",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Statistics Options",
        content: "Select additional statistics to include in the results.",
        targetId: "display-statistics-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📈",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Run Analysis",
        content: "Click OK to run the analysis with your selected variables and settings.",
        targetId: "chi-square-ok-button",
        defaultPosition: 'top',
        defaultHorizontalPosition: null,
        icon: "▶️",
        requiredTab: TABS.OPTIONS
    }
];
