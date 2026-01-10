# Testing for Sort Variables Feature

This document outlines the testing strategy for the "Sort Variables" feature, ensuring that its components, hooks, and services function as expected.

## Test Files Overview

### UI Component Test

-   **`SortVarsUI.test.tsx`**:
    -   Tests the `SortVarsUI` presentational component in isolation.
    -   It receives all its state and handler functions as props, which are mocked for the test.
    -   **Rendering**: Verifies that the component renders the list of columns and sort order options correctly based on the initial props.
    -   **Interactions**: Simulates user actions, such as clicking on a column name, changing the sort order radio button, and clicking the `OK`, `Cancel`, and `Reset` buttons.
    -   **Assertions**: Confirms that the corresponding handler functions (`handleSelectColumn`, `setSortOrder`, `handleOk`, etc.) are called with the correct arguments upon user interaction.
    -   **State Reflection**: Checks that the UI visually reflects the props, such as highlighting the `selectedColumn`.

### Hook Test

-   **`useSortVariables.test.ts`**:
    -   Tests the core business logic and state management within the `useSortVariables` hook.
    -   **Dependencies Mocking**: Mocks external dependencies, including the Zustand stores (`useVariableStore`, `useDataStore`) and the `sortVarsService`.
    -   **Sorting Logic**: Verifies that the `handleOk` function correctly sorts the array of variables based on a selected attribute (e.g., "Name") and sort order ("asc" or "desc"). It also checks that the `columnIndex` of the sorted variables is correctly updated.
    -   **Data Resoorting**: Ensures that the `sortDataColumns` service is called with the correct arguments (original data, original variable order, and the new sorted variable order) and that the `setData` function from the data store is called with the result.
    -   **State Updates**: Confirms that the `overwriteVariables` function from the variable store is called with the newly sorted variable list.
    -   **Edge Cases**: Tests the sorting logic's ability to handle `null` or `undefined` values correctly (placing them first in an ascending sort). It also checks that an alert is shown if the user tries to sort without selecting a column.
    -   **Reset Functionality**: Verifies that `handleReset` correctly resets the `selectedColumn` and `sortOrder` to their initial states.

### Service Test

-   **`sortVarsService.test.ts`**:
    -   Performs unit tests on the pure `sortDataColumns` function, which contains the complex logic for reordering the dataset.
    -   **Core Functionality**: Provides a sample dataset, an original variable order, and a new sorted variable order. It then asserts that the columns in the output data are reordered to match the new variable order.
    -   **Edge Cases**:
        -   Tests with an empty dataset to ensure it returns an empty array without errors.
        -   Tests the scenario where the mapping between old and new variables is incomplete, which should correctly throw an error.
        -   Tests how the function handles rows that might be shorter than the number of variables, ensuring it doesn't crash and reorders the available data correctly. 