# Sort Cases Testing

This document outlines the automated tests for the "Sort Cases" feature, covering the UI component and its underlying logic hook.

## 1. UI Component Testing (`SortCases.test.tsx`)

This suite focuses on the `SortCasesUI` component, ensuring it renders correctly and that user interactions trigger the appropriate callback functions. The `useSortCases` hook is mocked to isolate the UI layer and verify the props-to-handlers connections.

-   **Rendering**:
    -   Verifies that the main dialog title ("Sort Cases") and action buttons (OK, Cancel, Reset) are rendered.
    -   Confirms that the `VariableListManager` child component is present.
-   **Error Display**: Checks that an error message is correctly displayed within an `Alert` component when an `error` string is passed via props.
-   **User Actions**:
    -   Ensures `handleOk`, `handleReset`, and `onClose` functions are called when their respective buttons are clicked.
    -   Simulates a variable move action and verifies that `handleMoveVariable` is called with the correct parameters.
-   **Conditional Rendering**:
    -   Tests that the "Sort Order" controls (Ascending/Descending checkboxes, Move Up/Down buttons) are visible only when a variable in the "Sort By" list is highlighted.
-   **Control Interactions**:
    -   Confirms that clicking a sort direction checkbox (e.g., "Descending") calls the `changeSortDirection` handler.
    -   Confirms that clicking the "Move Up" button calls the `moveVariableUp` handler.

## 2. Hook Logic Testing (`useSortCases.test.ts`)

This suite tests the core business logic within the `useSortCases` custom hook. The Zustand stores (`useDataStore`, `useVariableStore`) are mocked to isolate the hook's logic.

-   **State Initialization**: Verifies that the hook initializes with the correct default state: variables loaded, sort list empty, and no errors.
-   **Variable Movement**:
    -   Tests moving a variable from the "available" list to the "sort by" list and back, ensuring the state of both lists is updated correctly.
-   **Sort Configuration**:
    -   Checks that the sort direction for a specific variable can be changed (e.g., to 'desc').
    -   Verifies that the `moveVariableUp` and `moveVariableDown` functions correctly reorder the items in the `sortByConfigs` array.
-   **Reset Logic**: Ensures the `handleReset` function correctly clears the `sortByConfigs` list and resets the default sort order.
-   **Sorting Logic (`handleOk`)**:
    -   **Correct Order**: Critically, it verifies that the `sortData` function is called in the **reverse order** of the `sortByConfigs` array. This is essential for achieving a correct multi-level stable sort.
    -   **Error Handling**: Confirms that an error is set in the state (instead of an `alert`) if the user tries to sort with an empty "Sort By" list, and that `sortData` is not called.
-   **Error State Management**: Checks that the error state is cleared when the user performs a new action after an error has occurred. 