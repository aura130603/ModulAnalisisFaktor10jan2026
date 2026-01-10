# Testing for Define Variable Properties Feature

This document outlines the testing strategy for the "Define Variable Properties" feature. The tests are categorized into component tests, hook tests, and service tests to ensure comprehensive coverage of the feature's functionality.

## Test Files Overview

### Component Tests

-   **`index.test.tsx`**:
    -   Tests the main `DefineVariableProps` component.
    -   Ensures that it correctly renders the `VariablesToScan` component initially (when `currentStep` is "scan").
    -   Ensures that it switches to rendering the `PropertiesEditor` component when the step changes to "editor".

-   **`VariablesToScan.test.tsx`**:
    -   Tests the `VariablesToScan` component's UI and interactions.
    -   Mocks the `useVariablesToScan` hook to isolate the component.
    -   Verifies that UI controls like "Continue", "Cancel", and limit configuration checkboxes/inputs are rendered and trigger the corresponding mocked functions when interacted with.

-   **`PropertiesEditor.test.tsx`**:
    -   Tests the `PropertiesEditor` component's UI and interactions.
    -   Mocks the `usePropertiesEditor` hook.
    -   Simulates user actions such as selecting a variable from the list, editing input fields (e.g., variable label), and clicking buttons (`Suggest Measurement Level`, `Auto Label`, `OK`, `Cancel`).
    -   Confirms that the correct hook functions are called upon user interaction.
    -   Checks that the UI correctly switches to the "Value Labels" tab and renders the `HotTable` mock.

### Hook Tests

-   **`useVariablesToScan.test.ts`**:
    -   Tests the business logic within the `useVariablesToScan` hook.
    -   Mocks the `useVariableStore` to provide initial data.
    -   Tests moving variables between the "available" and "to scan" lists.
    -   Tests reordering of variables in the "to scan" list.
    -   Verifies that the `onContinue` callback is called with the correct data (selected variables and limits) or that an error is shown if no variables are selected.

-   **`usePropertiesEditor.test.ts`**:
    -   Tests the complex state management and logic inside the `usePropertiesEditor` hook.
    -   Mocks the `variablePropertiesService` to isolate the hook's logic.
    -   Tests state initialization, variable selection logic, and updates to variable properties.
    -   Verifies logic for measurement suggestion, auto-labeling, and grid data management.
    -   Ensures the `handleSave` function calls the service with the correctly modified variable data.

### Service Tests

-   **`variablePropertiesService.test.ts`**:
    -   Performs unit tests on the core business logic functions, which are decoupled from the UI.
    -   Mocks `useDataStore` and `useVariableStore` to provide a controlled data environment.
    -   **`getUniqueValuesWithCounts`**: Tests that the function correctly scans data, respects limits, and returns accurate unique value counts.
    -   **`suggestMeasurementLevel`**: Tests the suggestion algorithm against various data scenarios (numeric, string, binary, few unique integers) to ensure it returns the appropriate measurement level and explanation.
    -   **`saveVariableProperties`**: Tests that the function correctly identifies which variables have been modified and calls the store's update function with the correct payload. 