# Identify Unusual Cases Testing

This document provides an overview of the automated tests for the "Identify Unusual Cases" feature.

## 1. Main Component Testing (`index.test.tsx`)

This suite tests the main `IdentifyUnusualCases` dialog component. It focuses on the overall structure, tab navigation, and connections to its underlying hooks, while mocking the content of each tab to keep the tests focused.

-   **Rendering**: Verifies that the dialog renders with the correct title and that all tab triggers ("Variables", "Options", etc.) are present.
-   **Tab Navigation**: Ensures that the "Variables" tab is visible by default and that clicking another tab trigger (e.g., "Options") correctly switches the visible content.
-   **Action Buttons**:
    -   Confirms that clicking the "Cancel" button calls the `onClose` prop.
    -   Confirms that clicking the "Reset" button calls the `handleReset` function from the mocked `useUnusualCases` hook.
    -   Confirms that the "OK" button successfully triggers the `onClose` function (as the confirmation logic is placeholder for now).

## 2. Options Tab UI Testing (`OptionsTab.test.tsx`)

This suite tests the `OptionsTab` component in isolation, verifying its controls and state interactions.

-   **Rendering**: Checks that all form controls (radio groups, inputs, checkboxes) are rendered with their correct default values.
-   **State Changes**:
    -   Verifies that `setIdentificationCriteria` is called when the user selects a different identification method.
    -   Verifies that state-setting functions (e.g., `setPercentageValue`) are called when the corresponding input values change.
-   **Conditional Disabling**:
    -   Ensures that the "Percentage" and "Number" input fields are correctly enabled or disabled based on which identification criterion is selected.
    -   Ensures the "Cutoff" input is disabled when its controlling checkbox is unchecked.

## 3. Core Logic Hook Testing (`useUnusualCases.test.ts`)

This suite tests the primary business logic contained within the `useUnusualCases` custom hook. The `useVariableStore` is mocked to provide a consistent set of variables for testing.

-   **Initialization**: Verifies that the hook correctly initializes its state, loading variables from the store into the `availableVariables` list.
-   **Variable Movement**:
    -   Tests moving a variable from the "available" list to the "analysis" list.
    -   Tests assigning a variable to the "case identifier" role.
    -   Tests the replacement of an existing case identifier with a new one.
    -   Tests moving variables from "analysis" and "identifier" roles back to the "available" list.
-   **Reset Functionality**:
    -   Confirms that the `handleReset` function correctly reverts all state slices (variable lists, options, etc.) back to their initial default values. 