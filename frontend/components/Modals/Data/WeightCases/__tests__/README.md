# Testing for Weight Cases Feature

This document provides an overview of the testing strategy for the "Weight Cases" feature, ensuring its functionality is robust and reliable.

## Test Files Overview

### Component Tests

-   **`index.test.tsx`**:
    -   Tests the main orchestrator component, `WeightCasesModal`.
    -   It mocks both the `useWeightCases` hook and the `WeightCasesUI` component.
    -   **Integration Check**: Verifies that the `WeightCasesModal` correctly calls the `useWeightCases` hook upon rendering.
    -   **Props Forwarding**: Ensures that the values returned from the mocked hook, along with the `onClose` and `containerType` props, are correctly passed down to the `WeightCasesUI` component.

-   **`WeightCasesUI.test.tsx`**:
    -   Tests the presentational component `WeightCasesUI` in isolation by mocking its props.
    -   **Rendering**: Verifies that the component renders the initial state correctly, including the "Current Status" text and the list of available variables (mocked via the `VariableListManager`).
    -   **User Interactions**: Simulates user clicks on the `OK`, `Reset`, and `Cancel` buttons and asserts that the corresponding mocked handler functions (`handleSave`, `handleReset`, `onClose`) are called.
    -   **State Display**: Checks that the UI correctly displays the weighting status when a variable is passed into the `frequencyVariables` prop.
    -   **Error Handling**: Confirms that the error dialog is rendered when `errorDialogOpen` is true and that it displays the correct `errorMessage`.

### Hook Test

-   **`useWeightCases.test.ts`**:
    -   Tests the core business logic and state management within the `useWeightCases` hook.
    -   **Dependencies Mocking**: Mocks the `useVariableStore` and `useMetaStore` to provide a controlled state for variables and metadata.
    -   **Initialization**:
        -   Verifies that the hook initializes correctly, filtering for only numeric variables.
        -   Tests that if a `weight` variable is already set in the meta store, the hook initializes with that variable correctly placed in the "frequency" list.
    -   **State Manipulation**:
        -   Tests moving a variable from the "available" list to the "frequency" list.
        -   Tests the "swap" logic, where moving a new variable to the frequency list correctly moves the old one back.
    -   **Saving and Resetting**:
        -   Ensures `handleSave` calls `setMeta` with the correct variable name (or an empty string if no variable is selected).
        -   Verifies that `handleReset` clears the frequency list and correctly resets the global weight state in the meta store.
    -   **Error Handling**: Confirms that trying to move a non-numeric (string) variable to the frequency list correctly sets an error message and opens the error dialog. 