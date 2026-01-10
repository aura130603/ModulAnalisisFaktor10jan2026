# Restructure Data Wizard Testing

This document provides a summary of the automated tests for the **Restructure Data Wizard** feature. The tests are organized by their area of concern: UI, hook logic, and service-level data transformation.

## 1. UI Component Testing (`Restructure.test.tsx`)

This test suite focuses on the `RestructureUI` component, ensuring it renders correctly and responds to user interactions as expected. The `useRestructure` hook is mocked to isolate the UI layer.

-   **Initial State**: Verifies that the wizard renders Step 1 correctly on initial load.
-   **Tab Navigation**: Ensures that the "Variables" and "Options" tabs are disabled initially, and that the correct tab becomes active as the user progresses.
-   **Conditional Rendering**:
    -   Checks that the correct variable selection lists are displayed in Step 2 based on the chosen restructure method (`Variables to Cases` vs. `Cases to Variables`).
    -   Checks that the correct options (e.g., "Create count variable", "Drop empty variables") are shown in Step 3 for each method.
-   **Validation Display**: Confirms that validation error messages are rendered when provided by the hook.

## 2. Hook Logic Testing (`useRestructure.test.ts`)

This suite tests the core logic within the `useRestructure` custom hook, which orchestrates the wizard's functionality. The data service and Zustand stores are mocked.

-   **State Initialization**: Verifies that the hook initializes with the correct default values (e.g., `currentStep: 1`, `method: VariablesToCases`).
-   **Step Navigation**:
    -   Tests the `handleNext` and `handleBack` functions to ensure they correctly update the wizard's step and active tab.
    -   Validates that navigation is blocked if validation requirements for the current step are not met.
    -   Confirms the special flow for the "Transpose All Data" method, which skips Step 2.
-   **Finish Handler**: Ensures that the `handleFinish` function:
    -   Calls the `restructureData` service with the correct configuration.
    -   Updates the `useDataStore` and `useVariableStore` with the new data and variables returned by the service.
    -   Calls the `onClose` callback upon successful completion.

## 3. Service-Level Testing (`restructureService.test.ts`)

This suite tests the pure data transformation functions in `restructureService.ts` using mock data that mirrors the examples in the main `README.md`.

-   **`wideToLong` (Variables to Cases)**:
    -   Verifies the correct transformation of a wide dataset into a long format.
    -   Tests the creation of the optional `variable` (index) and `count` columns.
    -   Checks that the new variables and data rows are structured as expected.
-   **`longToWide` (Cases to Variables)**:
    -   Verifies the correct transformation of a long dataset into a wide format.
    -   Tests that the new variable names are generated correctly based on the identifier variable.
    -   Includes a test case for the `dropEmptyVariables` option to ensure empty columns are removed.
-   **`transposeAll`**:
    -   Tests the complete transposition of a dataset, ensuring rows become columns and columns become rows. 