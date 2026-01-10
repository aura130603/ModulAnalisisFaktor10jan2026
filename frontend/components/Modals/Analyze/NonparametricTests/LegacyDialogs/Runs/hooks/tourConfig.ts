import { TABS, TourStep } from '../types';

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content: "Select variables from the available list to analyze with Runs Test. Only numeric variables are shown.",
        targetId: "runs-test-available-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📊",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test Variables",
        content: "Variables in this list will be analyzed. You can reorder them by dragging.",
        targetId: "runs-test-test-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📋",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Options Tab",
        content: "Click here to configure test options and settings.",
        targetId: "runs-test-options-tab-trigger",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES,
        forceChangeTab: true
    },
    {
        title: "Cut Point",
        content: "Choose whether to get the cut point from data or specify a custom cut point.",
        targetId: "cut-point-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📏",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Custom Value",
        content: "Define a custom cut point value for the test.",
        targetId: "custom-value-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "🔢",
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
        targetId: "runs-test-ok-button",
        defaultPosition: 'top',
        defaultHorizontalPosition: null,
        icon: "▶️",
        requiredTab: TABS.OPTIONS
    }
];
