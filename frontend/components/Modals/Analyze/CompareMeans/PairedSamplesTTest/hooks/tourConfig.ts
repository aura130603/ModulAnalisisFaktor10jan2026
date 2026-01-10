import { TABS, TourStep } from '../types';

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content: "Select variables from the available list to analyze with Paired Samples T Test. Only numeric variables are shown.",
        targetId: "paired-samples-t-test-available-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📊",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Paired Variables",
        content: "Variables in this list will be Analyzed in pairs.",
        targetId: "paired-samples-t-test-test-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📋",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Button to Coordinate Variables and Pairs",
        content: "Use this button to coordinate variables and pair them for analysis.",
        targetId: "paired-samples-t-test-move-button",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "🔀",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Move Up",
        content: "Use this button to move the selected pair up in the paired list.",
        targetId: "paired-samples-t-test-move-up-button",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "�",
    },
    {
        title: "Move Down",
        content: "Use this button to move the selected pair down in the paired list.",
        targetId: "paired-samples-t-test-move-down-button",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "�",
    },
    {
        title: "Change between Variables and Pairs",
        content: "Use this button to change between variables and pairs.",
        targetId: "paired-samples-t-test-change-button",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "🔀",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Estimate Effect Size",
        content: "This option is currently disabled as the effect size calculation feature is not yet available in this version. When implemented, it will allow you to include effect size calculations in your results.",
        targetId: "estimate-effect-size-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📏",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Calculate Standardizer",
        content: "This option is used to calculate the standardizer for effect size analysis. However, this feature is currently unavailable and will be enabled in a future version.",
        targetId: "calculate-standardizer-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📏",
        requiredTab: TABS.OPTIONS
    }
];
