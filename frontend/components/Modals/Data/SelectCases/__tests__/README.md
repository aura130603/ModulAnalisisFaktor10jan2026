# Testing for Select Cases Feature

This document provides an overview of the testing strategy for the "Select Cases" feature. The tests cover components, hooks, and services to ensure the feature is robust and functions correctly.

## Test Files Overview

### Component Tests

-   **`SelectCases.test.tsx`**:
    -   Tests the main `SelectCases` component's rendering and top-level interactions.
    -   Mocks the `useSelectCases` hook to isolate the main component's UI logic.
    -   Verifies that the component renders correctly in both "dialog" and "sidebar" modes.
    -   Ensures that main buttons (OK, Cancel, Reset) trigger the corresponding functions from the mocked hook.
    -   Checks that changing the main selection radio buttons (e.g., "All cases", "If condition is satisfied") works as expected.
    -   Confirms that the correct sub-dialogs are rendered when their corresponding state flags are true.
    -   Tests the `isProcessing` state to ensure buttons are disabled correctly.
    -   Verifies that the error dialog is displayed when an error message is present.

-   **`SelectCasesIfCondition.test.tsx`**:
    -   Tests the `SelectCasesIfCondition` sub-dialog.
    -   Simulates user input in the expression textarea.
    -   Tests UI interactions like double-clicking a variable to insert it and clicking operator buttons.
    -   Verifies that the `onContinue` prop is called with the correct expression.
    -   Checks all validation logic: for empty expressions, unbalanced parentheses, and expressions without a variable.

-   **`SelectCasesRandomSample.test.tsx`**:
    -   Tests the `SelectCasesRandomSample` sub-dialog.
    -   Verifies that radio buttons for "Approximately" and "Exactly" work correctly and that inputs are enabled/disabled accordingly.
    -   Simulates user input for percentage and exact counts.
    -   Checks that `onContinue` is called with the correctly structured data based on the user's selection.
    -   Tests input validation for out-of-range percentages and non-positive case counts.

-   **`SelectCasesRange.test.tsx`**:
    -   Tests the `SelectCasesRange` sub-dialog.
    -   Simulates user input for the "First Case" and "Last Case" fields.
    -   Verifies that `onContinue` is called with the correct range data.
    -   Tests the validation logic, ensuring an error is shown if the first case is greater than the last case or if case numbers are not positive.

### Hook Tests

-   **`useSelectCases.test.ts`**:
    -   Tests the business logic contained within the `useSelectCases` hook.
    -   Mocks all external dependencies, including Zustand stores (`useDataStore`, `useVariableStore`, etc.) and the selector services.
    -   Tests initial state and the opening of sub-dialogs.
    -   Verifies that state (like `conditionExpression` or `filterVariable`) is updated correctly based on user actions.
    -   Tests the `handleConfirm` logic, ensuring that the correct selector service is called and that a new `filter_$` variable is created successfully.
    -   Tests error handling paths, such as when a selection results in zero cases.
    -   Verifies that the `handleReset` function correctly resets the state and clears the global filter.

### Service Tests

-   **`evaluator.test.ts`**:
    -   Performs unit tests on the `evaluateCondition` function.
    -   Tests a wide range of expression types:
        -   Simple numeric and string comparisons.
        -   Logical operators (`&`, `|`, `~`).
        -   Correct handling of parentheses.
        -   Mathematical and string manipulation functions (e.g., `SQRT`, `LOWER`).
    -   Ensures that invalid expressions gracefully fail and return `false`.

-   **`selectors.test.ts`**:
    -   Performs unit tests for each of the data selection functions.
    -   **`selectByCondition`**: Mocks the `evaluateCondition` function to test that it iterates through data and collects the correct indices.
    -   **`selectRandomSample`**: Tests both "approximate" and "exact" sampling logic to ensure they return a sample of the correct size and from the correct pool of cases.
    -   **`selectByRange`**: Tests that the function correctly translates a 1-based case range into 0-based array indices.
    -   **`selectByFilterVariable`**: Verifies that the function correctly selects rows based on a non-zero value in the specified filter variable column. 