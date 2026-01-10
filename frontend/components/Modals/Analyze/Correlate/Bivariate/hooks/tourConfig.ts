import { TABS, TourStep } from '../types';

export const baseTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content: "Select variables from the available list to analyze with Bivariate Test. Only numeric variables are shown.",
        targetId: "bivariate-available-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "📊",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Allow Unknown Variables",
        content: "Check this option to treat variables with 'unknown' measurement level as Scale variables, allowing them to be selected for analysis.",
        targetId: "allow-unknown-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "🔍",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test Variables",
        content: "Variables in this list will be analyzed. You can reorder them by dragging.",
        targetId: "bivariate-test-variables",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: 'left',
        icon: "📋",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Correlation Coefficient",
        content: "Select the correlation coefficient to use for the analysis.",
        targetId: "correlation-coefficient-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "🔢",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Test of Significance",
        content: "Select the test of significance to use for the analysis.",
        targetId: "test-of-significance-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Flag Significant Correlations",
        content: "Check this option to flag significant correlations.",
        targetId: "flag-significant-correlations-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Show Only The Lower Triangle",
        content: "Check this option to show only the lower triangle of the correlation matrix.",
        targetId: "show-only-the-lower-triangle-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Show Diagonal",
        content: "Check this option to show the diagonal of the correlation matrix.",
        targetId: "show-diagonal-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.VARIABLES
    },
    {
        title: "Statistics Options",
        content: "Select the statistics to display in the analysis.",
        targetId: "statistics-options-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Missing Values Options",
        content: "Select the missing values to display in the analysis.",
        targetId: "missing-values-options-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Partial Correlation",
        content: "Check this option to show the partial correlation.",
        targetId: "partial-correlation-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.OPTIONS
    },
    {
        title: "Control Variables",
        content: "Select the control variables to display in the analysis.",
        targetId: "control-variables-section",
        defaultPosition: 'bottom',
        defaultHorizontalPosition: null,
        icon: "⚙️",
        requiredTab: TABS.OPTIONS
    }
];
