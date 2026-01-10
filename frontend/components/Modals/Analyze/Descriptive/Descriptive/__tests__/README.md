# Descriptive Statistics Testing

This document provides an overview of the automated tests for the **Descriptives** feature. The tests are separated by concern, targeting the main component UI, and each of the primary logic hooks.

## 1. Main Component Testing (`Descriptive.test.tsx`)

This suite tests the main `Descriptives` dialog component, focusing on its structure, user interactions, and integration of the various hooks. All hooks (`useVariableSelection`, `useStatisticsSettings`, etc.) are mocked to isolate the component's behavior.

-   **Rendering**: Verifies that the dialog renders with the correct title and that the "Variables" and "Statistics" tabs are present.
-   **Tab Navigation**: Ensures the "Variables" tab is active by default and that clicking the "Statistics" tab correctly switches the view.
-   **Button States**:
    -   Confirms the "OK" button is disabled when no variables are selected and enabled when at least one is.
    -   Checks that buttons are disabled and the "OK" button shows "Processing..." when the analysis is calculating.
-   **User Actions**:
    -   Validates that `runAnalysis` is called on "OK" button click.
    -   Validates that `onClose` is called on "Cancel" button click.
    -   Validates that `resetVariableSelection` and `resetStatisticsSettings` are called on "Reset" button click.
    -   Validates that `startTour` is called when the help/tour button is clicked.

## 2. Analysis Hook Testing (`useDescriptivesAnalysis.test.ts`)

This suite tests the `useDescriptivesAnalysis` hook, which manages the web worker communication and result processing.

-   **Worker Communication**:
    -   Verifies that `postMessage` is called on the worker with the correct payload for each selected variable.
    -   Tests that results are correctly aggregated when multiple variables are processed.
-   **Result Handling**:
    -   Ensures successful worker messages trigger calls to `useResultStore` to add the formatted statistics table.
    -   Tests that `processZScoreData` is called correctly when `saveStandardized` is true.
-   **Error Handling**:
    -   Simulates an error message from the worker and confirms that the error state is set correctly.
    -   Simulates a critical worker instantiation error and confirms it's handled gracefully.
-   **Lifecycle & Cleanup**: Confirms that the worker is terminated when the analysis is complete or the component unmounts.

## 3. Variable Selection Hook Testing (`useVariableSelection.test.ts`)

This suite tests the `useVariableSelection` hook, responsible for managing the state of available and selected variable lists.

-   **Initialization**: Verifies that the hook correctly initializes with variables from the `useVariableStore`, filtering out any with empty names.
-   **Variable Movement**:
    -   Tests moving a variable from the "available" list to the "selected" list.
    -   Tests moving a variable from "selected" back to "available".
-   **Reordering**: Checks that `reorderVariables` correctly updates the state of the selected variables list.
-   **Reset**: Confirms that `resetVariableSelection` correctly clears the selected list and repopulates the available list with all valid variables.

## 4. Statistics Settings Hook Testing (`useStatisticsSettings.test.ts`)

This suite tests the `useStatisticsSettings` hook, which manages the state for the statistics options.

-   **Initialization**:
    -   Verifies that the hook initializes with correct default options (e.g., `mean` is true, `variance` is false).
    -   Tests that it can be initialized with custom initial values.
-   **State Updates**:
    -   Ensures that `updateStatistic` correctly toggles a single statistic's boolean value.
    -   Confirms that `setDisplayOrder` and `setSaveStandardized` update their respective state values.
-   **Reset**: Checks that `resetStatisticsSettings` correctly reverts all options back to their initial default state. 