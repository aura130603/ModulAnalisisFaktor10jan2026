import { TourStep } from "@/types/tourTypes";

export const univariateTourSteps: TourStep[] = [
    {
        title: "Available Variables",
        content:
            "This list contains all the variables available for the analysis.",
        targetId: "univariate-available-variables",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "right",
        icon: "📊",
    },
    {
        title: "Dependent Variable",
        content:
            "Select the dependent variable for the analysis here. Only one variable can be selected.",
        targetId: "univariate-dependent-variable",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "left",
        icon: "🎯",
    },
    {
        title: "Fixed Factor(s)",
        content: "Select one or more fixed factors for the analysis.",
        targetId: "univariate-fixed-factors",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "left",
        icon: "🧱",
    },
    {
        title: "Random Factor(s)",
        content: "Select one or more random factors for the analysis.",
        targetId: "univariate-random-factors",
        defaultPosition: "top",
        defaultHorizontalPosition: "left",
        icon: "🎲",
    },
    {
        title: "Covariate(s)",
        content: "Select one or more covariates for the analysis.",
        targetId: "univariate-covariates",
        defaultPosition: "top",
        defaultHorizontalPosition: "left",
        icon: "📈",
    },
    {
        title: "WLS Weight",
        content:
            "Select a variable to use for Weighted Least Squares (WLS) analysis.",
        targetId: "univariate-wls-weight",
        defaultPosition: "top",
        defaultHorizontalPosition: "left",
        icon: "⚖️",
    },
    {
        title: "Run Analysis",
        content:
            "Click OK to run the analysis with your selected variables and settings.",
        targetId: "univariate-ok-button",
        defaultPosition: "top",
        defaultHorizontalPosition: "right",
        icon: "▶️",
    },
];

export const bootstrapTourSteps: TourStep[] = [
    {
        title: "Perform Bootstrapping",
        content:
            "Enable this to perform bootstrapping. This will resample the dataset to estimate the sampling distribution of a statistic.",
        targetId: "univariate-bootstrap-perform",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "🔄",
    },
    {
        title: "Confidence Intervals",
        content:
            "Set the confidence level and choose the method for calculating confidence intervals.",
        targetId: "univariate-bootstrap-confidence-intervals",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "🎯",
    },
    {
        title: "Sampling",
        content:
            "Choose between simple and stratified sampling methods. If using stratified sampling, you must select at least one strata variable.",
        targetId: "univariate-bootstrap-sampling",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "⚖️",
    },
    {
        title: "Continue",
        content: "Click to save these settings and return to the main dialog.",
        targetId: "univariate-bootstrap-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const contrastTourSteps: TourStep[] = [
    {
        title: "Factors",
        content:
            "This list shows the factors available for contrast analysis. The formatting indicates the current contrast settings for each factor.",
        targetId: "univariate-contrast-factors",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "📊",
    },
    {
        title: "Change Contrast",
        content:
            "Select a factor from the list, choose a contrast method, and click 'Change' to apply the new contrast setting.",
        targetId: "univariate-contrast-change-contrast",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "🔧",
    },
    {
        title: "Continue",
        content: "Click to save these settings and return to the main dialog.",
        targetId: "univariate-contrast-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const emmeansTourSteps: TourStep[] = [
    {
        title: "Factors and Interactions",
        content:
            "This list contains all the factors and interactions available for estimating marginal means.",
        targetId: "univariate-emmeans-factors-interactions",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "right",
        icon: "📊",
    },
    {
        title: "Display Means For",
        content:
            "Select the factors and interactions for which you want to display the estimated marginal means.",
        targetId: "univariate-emmeans-display-means-for",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "left",
        icon: "📋",
    },
    {
        title: "Compare Main Effects",
        content:
            "Enable this to compare the main effects of the factors. You can then choose a confidence interval adjustment method.",
        targetId: "univariate-emmeans-compare-main-effects",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "⚖️",
    },
    {
        title: "Continue",
        content: "Click to save these settings and return to the main dialog.",
        targetId: "univariate-emmeans-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const plotsTourSteps: TourStep[] = [
    {
        title: "Factors",
        content:
            "This list contains the factors that can be used to create plots.",
        targetId: "univariate-plots-factors",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "right",
        icon: "📊",
    },
    {
        title: "Plot Specification",
        content:
            "Select variables for the horizontal axis, separate lines, and separate plots to define a plot.",
        targetId: "univariate-plots-specification",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "left",
        icon: "🎨",
    },
    {
        title: "Plots",
        content:
            "Add, change, or remove plots from this list. The plots will be generated based on your specifications.",
        targetId: "univariate-plots-plots-list",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "📈",
    },
    {
        title: "Chart Type and Options",
        content: "Select the chart type and other options for the plots.",
        targetId: "univariate-plots-chart-options",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "🔧",
    },
    {
        title: "Continue",
        content: "Click to save these settings and return to the main dialog.",
        targetId: "univariate-plots-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const optionsTourSteps: TourStep[] = [
    {
        title: "Display Options",
        content:
            "Select various statistics to display in the output, such as descriptive statistics, estimates of effect size, and more.",
        targetId: "univariate-options-display",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "📊",
    },
    {
        title: "Heteroscedasticity Tests",
        content:
            "Select one or more tests to check for heteroscedasticity in your model.",
        targetId: "univariate-options-heteroscedasticity",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "🔬",
    },
    {
        title: "Robust Standard Errors",
        content:
            "Choose a method for calculating robust standard errors if you have issues with heteroscedasticity.",
        targetId: "univariate-options-robust-std-err",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "🛡️",
    },
    {
        title: "Significance Level",
        content:
            "Set the significance level for confidence intervals and significance tests.",
        targetId: "univariate-options-sig-level",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "🎯",
    },
    {
        title: "Continue",
        content: "Click to save these settings and return to the main dialog.",
        targetId: "univariate-options-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const saveTourSteps: TourStep[] = [
    {
        title: "Save Variables",
        content:
            "Select predicted values, residuals, or diagnostics to save as new variables in your dataset.",
        targetId: "univariate-save-variables",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "💾",
    },
    {
        title: "Coefficient Statistics",
        content:
            "Choose to save coefficient statistics. You can also specify the type and destination for the new data.",
        targetId: "univariate-save-coeff-stats",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "📈",
    },
    {
        title: "Continue",
        content: "Click to save your selections and return to the main dialog.",
        targetId: "univariate-save-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const posthocTourSteps: TourStep[] = [
    {
        title: "Factors for Post Hoc Tests",
        content:
            "Select the factors for which you want to perform post hoc tests. These tests are used to compare specific pairs of means.",
        targetId: "univariate-posthoc-factors",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "📊",
    },
    {
        title: "Equal Variances Assumed",
        content:
            "Choose one or more post hoc tests that assume equal variances across groups. These tests help identify which specific group means are different.",
        targetId: "univariate-posthoc-equal-variances-assumed",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "⚖️",
    },
    {
        title: "Equal Variances Not Assumed",
        content:
            "If the assumption of equal variances is violated, select one of these tests. They are designed to handle unequal variances.",
        targetId: "univariate-posthoc-equal-variances-not-assumed",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "🛡️",
    },
    {
        title: "Continue",
        content: "Click to save your selections and return to the main dialog.",
        targetId: "univariate-posthoc-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];

export const modelTourSteps: TourStep[] = [
    {
        title: "Specify Model",
        content:
            "Choose how to specify the model. 'Full Factorial' includes all factor main effects and interactions. 'Build Terms' lets you add specific terms. 'Build Custom Terms' provides a tool to create complex terms.",
        targetId: "univariate-model-specify-model",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "🔧",
    },
    {
        title: "Factors & Covariates",
        content:
            "This list contains all the factors and covariates available for building the model.",
        targetId: "univariate-model-factors-covariates",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "right",
        icon: "📊",
    },
    {
        title: "Build Term(s)",
        content:
            "When in 'Build Terms' mode, you can select a type of term (e.g., Interaction, Main Effects) and add selected factors/covariates to the model.",
        targetId: "univariate-model-build-terms",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "left",
        icon: "🧱",
    },
    {
        title: "Model Terms",
        content:
            "The terms included in your custom model are displayed here. You can add or remove terms using the controls.",
        targetId: "univariate-model-terms",
        defaultPosition: "bottom",
        defaultHorizontalPosition: "left",
        icon: "📈",
    },
    {
        title: "Build Custom Term",
        content:
            "When in 'Build Custom Terms' mode, you can use these buttons to construct complex terms step-by-step.",
        targetId: "univariate-model-build-custom-term",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "🔨",
    },
    {
        title: "Insert Variable Button",
        content:
            "Click this button to insert the selected variable into your custom term. This is the primary way to add variables to your term construction.",
        targetId: "univariate-model-insert-variable-btn",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "➡️",
    },
    {
        title: "By * Button",
        content:
            "Click this button to add a multiplication operator (*) to your term, which creates interactions between variables.",
        targetId: "univariate-model-by-btn",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "✖️",
    },
    {
        title: "Within Button",
        content:
            "Click this button to create nested terms with parentheses. This is useful for specifying nested or hierarchical structures in your model.",
        targetId: "univariate-model-within-btn",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "📦",
    },
    {
        title: "Clear Term Button",
        content:
            "Click this button to clear the current term being built and start over.",
        targetId: "univariate-model-clear-term-btn",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "🗑️",
    },
    {
        title: "Add Button",
        content:
            "Click this button to add the completed term to your model. Make sure the term is complete before adding it.",
        targetId: "univariate-model-add-btn",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "➕",
    },
    {
        title: "Remove Button",
        content:
            "Click this button to remove the selected term from your model.",
        targetId: "univariate-model-remove-btn",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "➖",
    },
    {
        title: "Add (Build Terms) Button",
        content:
            "When in 'Build Terms' mode, click this button to add the selected variables to your model based on the chosen term type.",
        targetId: "univariate-model-add-build-terms-btn",
        defaultPosition: "bottom",
        defaultHorizontalPosition: null,
        icon: "➕",
    },
    {
        title: "Sum of Squares",
        content:
            "Select the method for calculating the sum of squares. This affects how the variance is partitioned among the model terms.",
        targetId: "univariate-model-sum-of-squares",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "⚖️",
    },
    {
        title: "Continue",
        content:
            "Click to save the model specification and return to the main dialog.",
        targetId: "univariate-model-continue-button",
        defaultPosition: "top",
        defaultHorizontalPosition: null,
        icon: "▶️",
    },
];
