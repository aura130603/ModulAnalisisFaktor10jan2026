import { TourStep } from "@/types/tourTypes";

export const dialogTourSteps: TourStep[] = [
    {
        title: "Variable Selection",
        content:
            "Select variables from the available list to include in the K-Means cluster analysis. Only numeric variables are valid to be used for this analysis.",
        targetId: "kmeans-available-variables",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "right",
        icon: "📊",
    },
    {
        title: "Analysis Variables",
        content:
            "The variables in this list will be used in the analysis. You can reorder them by dragging.",
        targetId: "kmeans-analysis-variables",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "left",
        icon: "📋",
    },
    {
        title: "Label Cases By",
        content:
            "You can select one variable to use as a label for the cases in the output.",
        targetId: "kmeans-label-cases-by",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "left",
        icon: "🏷️",
    },
    {
        title: "Number of Clusters",
        content:
            "Specify the number of clusters to be created. This must be a number of 2 or greater.",
        targetId: "kmeans-number-of-clusters",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "🔢",
    },
    {
        title: "Run Analysis",
        content:
            "Click OK to run the K-Means cluster analysis with your selected variables and settings.",
        targetId: "kmeans-ok-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const iterateTourSteps: TourStep[] = [
    {
        title: "Maximum Iterations",
        content:
            "Set the maximum number of iterations for the K-Means algorithm. Must be between 1 and 999.",
        targetId: "kmeans-iterate-max-iterations",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "🔄",
    },
    {
        title: "Convergence Criterion",
        content:
            "Specify the convergence criterion. The algorithm stops when the change in cluster centers between iterations is less than this value. Must be between 0 and 1.",
        targetId: "kmeans-iterate-convergence-criterion",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "🎯",
    },
    {
        title: "Use Running Means",
        content:
            "Enable this to update cluster centers after each case is assigned, rather than after a full iteration. This can speed up convergence.",
        targetId: "kmeans-iterate-use-running-means",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "🏃‍♂️",
    },
    {
        title: "Continue",
        content: "Click to save these settings and return to the main dialog.",
        targetId: "kmeans-iterate-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const optionsTourSteps: TourStep[] = [
    {
        title: "Statistics",
        content: "Select which statistics to include in the output.",
        targetId: "kmeans-options-statistics-section",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "📊",
    },
    {
        title: "Missing Values",
        content: "Choose how to handle cases with missing values.",
        targetId: "kmeans-options-missing-values-section",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "❓",
    },
    {
        title: "Continue",
        content: "Click to save these settings and return to the main dialog.",
        targetId: "kmeans-options-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const saveTourSteps: TourStep[] = [
    {
        title: "Save New Variables",
        content: "Choose which new variables to save to the active dataset.",
        targetId: "kmeans-save-variables-section",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "💾",
    },
    {
        title: "Continue",
        content: "Click to save these settings and return to the main dialog.",
        targetId: "kmeans-save-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];
