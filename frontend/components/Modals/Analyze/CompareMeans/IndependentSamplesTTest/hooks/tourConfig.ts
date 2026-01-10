import { TABS, TourStep } from '../types';

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content: "Select variables from the available list to analyze with Independent Samples T-Test. Only numeric variables are shown.",
        targetId: "independent-samples-t-test-available-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📊",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test Variables",
        content: "Variables in this list will be analyzed. You can reorder them by dragging.",
        targetId: "independent-samples-t-test-test-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📋",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Grouping Variable",
        content: "Select a variable that defines the groups to compare.",
        targetId: "independent-samples-t-test-grouping-variable",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "🔢",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Define Groups",
        content: "Define how the groups are formed based on the grouping variable.",
        targetId: "define-groups-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Use Specified Values",
        content: "This option is used to split groups based on specified values in the grouping variable. Group 1 and Group 2 represent the two groups that will be compared; you can specify which values correspond to each group.",
        targetId: "use-specified-values-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Cut Point",
        content: "Cut point is used to split the data into two groups based on the value of the grouping variable. Values less than or equal to the cut point will be assigned to the first group, while values above the cut point will be assigned to the second group.",
        targetId: "cut-point-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
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
