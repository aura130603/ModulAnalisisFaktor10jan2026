# Sort Variables Feature

This document describes the functionality and architecture of the "Sort Variables" feature, which allows users to reorder the variables in the "Variable View" based on the properties of one of its columns.

## 1. Overview

The Sort Variables feature provides a simple yet effective way to organize the variable list. Users can select any variable attribute (like "Name", "Type", "Label", etc.) and a sort direction (ascending or descending). The feature not only reorders the variable list in the UI but also rearranges the columns in the underlying dataset to match the new order, ensuring data integrity.

## 2. Functionality Explained

-   **Attribute-Based Sorting**: Users can select any column from the variable view grid (e.g., "Name", "Type", "Measure") to use as the sorting key.
-   **Sort Direction**: Both `Ascending` and `Descending` sort orders are supported.
-   **Full Dataset Update**: The core of this feature is that it performs a comprehensive update.
    -   It reorders the `variables` array in the `useVariableStore`.
    -   It physically rearranges the data columns in the `useDataStore` to reflect the new variable order.
-   **Direct Application**: The sorting is applied directly to the current dataset, and the changes are persisted in the application's state.

## 3. Architecture & Design Pattern

The feature is structured to separate UI, state management, and complex business logic.

```
/SortVars
├── 📂 hooks/
│   └── 📄 useSortVariables.ts  // Manages state & UI logic
├── 📂 services/
│   └── 📄 sortVarsService.ts   // Contains data sorting business logic
├── 📄 index.tsx                // Entry point and orchestrator
├── 📄 README.md                // This document
├── 📄 SortVarsUI.tsx           // Presentational UI component
└── 📄 types.ts                 // TypeScript type definitions
```

-   **`index.tsx` (Orchestrator)**: Assembles the feature by invoking the `useSortVariables` hook and passing its state and handlers as props to the `SortVarsUI` component.
-   **`hooks/useSortVariables.ts` (Logic Hook)**: Manages the UI state (which column is selected, sort direction) and orchestrates the sorting process when the user confirms the action. It calls the `sortVarsService` for the complex data manipulation.
-   **`services/sortVarsService.ts` (Service)**: Contains the pure and potentially complex logic for reordering the data columns (`sortDataColumns`). This isolates heavy data manipulation from the component's lifecycle and state management.
-   **`SortVarsUI.tsx` (UI Component)**: A "dumb" presentational component that simply displays the list of sortable attributes and the sort direction options. It receives all its data and callbacks as props.
-   **`types.ts` (Type Definitions)**: Defines the props interfaces for the components, ensuring type safety.

## 4. Workflow

1.  **Initialization**: The user opens the "Sort Variables" modal. `SortVarsUI` renders the list of available variable attributes to sort by.
2.  **User Interaction**: The user selects an attribute (e.g., "Name") and a sort direction (e.g., "Ascending"). The UI state is updated via the `useSortVariables` hook.
3.  **Execution**:
    -   The user clicks the "OK" button.
    -   The `handleOk` function inside the `useSortVariables` hook is triggered.
    -   A copy of the original variable list is created to track the original column indices.
    -   The hook sorts the `variables` array based on the selected attribute and direction. The `columnIndex` of each variable is updated to reflect its new position.
    -   The hook then calls `sortDataColumns` from the `sortVarsService`, providing the original data, the original variable order, and the newly sorted variable order.
    -   The service calculates the new position for each data column based on the mapping between the old and new variable orders and returns a new, reordered dataset.
    -   The `overwriteAll` function from `useVariableStore` is called with both the new variable list and the new data array, atomically updating the application's state.
    -   The modal is closed, and the user sees the newly sorted variable view and data view.

## 5. Testing Strategy

The feature is tested across three layers to ensure correctness and robustness.

-   **UI Component Test (`__tests__/SortVarsUI.test.tsx`)**:
    -   Tests the `SortVarsUI` component in isolation by mocking its props.
    -   Verifies that the component renders the list of columns and sort options correctly.
    -   Simulates user clicks to ensure that the correct handler functions (`handleSelectColumn`, `setSortOrder`, `handleOk`, etc.) are called.
    -   Checks that the UI correctly reflects the state passed in via props (e.g., highlighting the selected column).

-   **Hook Test (`__tests__/useSortVariables.test.tsx`)**:
    -   Tests the business logic in the `useSortVariables` hook.
    -   Mocks dependencies like the Zustand stores and the `sortVarsService`.
    -   Verifies that the variable sorting logic is correct for different attributes and directions, including handling of null/undefined values.
    -   Ensures `sortDataColumns` is called with the correct arguments and that the stores are updated with the results.
    -   Tests the reset functionality.

-   **Service Test (`__tests__/sortVarsService.test.ts`)**:
    -   Unit tests the pure `sortDataColumns` function.
    -   Asserts that data columns are reordered correctly based on a provided mapping of old-to-new variable order.
    -   Tests edge cases like empty datasets and incomplete variable mappings to ensure the function is robust.
