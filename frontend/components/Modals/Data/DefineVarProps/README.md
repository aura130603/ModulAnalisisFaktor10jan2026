# Define Variable Properties Feature

This document describes the functionality and architecture of the "Define Variable Properties" feature, a two-step modal designed for detailed variable configuration based on scanned data.

## 1. Overview

The "Define Variable Properties" feature is a powerful tool that allows users to inspect their data and define or correct metadata for multiple variables in a single, streamlined workflow. It operates in two distinct steps:

1.  **Scanning**: The user selects a set of variables from their dataset and specifies limits for the scanning process. This step is crucial for gathering the necessary information from the raw data.
2.  **Editing**: Based on the scanned data, the feature presents a rich editor where the user can modify properties for each selected variable, including its name, label, type, measurement level, value labels, and missing value specifications.

The primary goal is to provide an efficient way to enhance data quality and ensure metadata accuracy, which is fundamental for reliable analysis.

## 2. Workflow

The feature's workflow is sequential and designed to guide the user through the process logically.

### Step 1: Variable Selection & Scanning (`VariablesToScan.tsx`)

-   The user is presented with a standard two-list variable manager.
-   They move the desired variables from the "Available Variables" list into a "Variables to Scan" list.
-   They can set limits on:
    -   How many cases (rows) to scan.
    -   How many unique values to display per variable in the next step.
-   These limits are critical for maintaining performance, especially with large datasets.
-   Clicking "Continue" validates that at least one variable has been selected and then transitions to the editor step, passing along the selected variables and scan limits.

### Step 2: Property Editing (`PropertiesEditor.tsx`)

-   The editor view is displayed, showing a list of the scanned variables on the left and the properties for the currently selected variable on the right.
-   **Data Loading**: The `usePropertiesEditor` hook calls the `getUniqueValuesWithCounts` service function to populate the "Value Labels" grid for the first selected variable. This process is repeated whenever the user selects a different variable from the list.
-   **Editing Properties**: The user can modify standard properties:
    -   **Name & Label**: Basic identifiers for the variable.
    -   **Measurement Level**: Can be set to Nominal, Ordinal, or Scale.
    -   **Role**: Defines the variable's role in analyses (e.g., Input, Target).
    -   **Type**: Sets the data type (e.g., Numeric, String, Date) and allows for specific formatting options.
-   **Measurement Suggestion**: A "Suggest Measurement Level" button is available. When clicked, it calls the `suggestMeasurementLevel` service function, which analyzes the variable's data (e.g., checks for non-numeric values, counts unique values) and returns a suggested level with an explanation.
-   **Value Labels Grid**: A `Handsontable` grid displays the unique values found during the scan, their frequencies (Count), and allows the user to:
    -   Assign a text `Label` to each raw `Value`.
    -   Mark specific values as `Missing`.
-   **Saving**: When the user clicks "OK", the `handleSave` function is triggered. It calls the `saveVariableProperties` service, which efficiently detects only the variables that have been changed and applies the updates to the global `variableStore`.

This two-step process ensures that the editor is populated with relevant, data-driven information, making the task of defining properties both faster and more accurate.

## 3. Architecture & State Management

The feature is architecturally divided to handle the complexity of its two-step nature, following the project's standard `feature-sliced` principles.

-   **`index.tsx`**: The main entry point that acts as a simple state machine, rendering either the `VariablesToScan` or `PropertiesEditor` component based on the current step.
-   **`VariablesToScan.tsx`**: The UI component for the first step (variable selection and scan limits).
-   **`PropertiesEditor.tsx`**: The UI component for the second step, containing the detailed variable editor with a Handsontable grid for value labels.
-   **`hooks/useDefineVarProps.ts`**: A simple hook that manages the state for the main component (`index.tsx`), including the current step and the data passed between steps.
-   **`hooks/useVariablesToScan.ts`**: Manages the state and logic for the `VariablesToScan` component, including variable lists and limit settings.
-   **`hooks/usePropertiesEditor.ts`**: The central orchestrator for the `PropertiesEditor`. It manages the state of the currently selected variable, UI interactions (like dropdowns), and coordinates calls to the service layer.
-   **`services/variablePropertiesService.ts`**: Contains the core, non-UI business logic.
    -   It exposes functions to scan the data (`getUniqueValuesWithCounts`), analyze it (`suggestMeasurementLevel`), and save changes (`saveVariableProperties`).
    -   These functions interact with the global data stores (`useDataStore`, `useVariableStore`) but are decoupled from the React component lifecycle, making them pure and testable.
-   **`utils/typeFormatters.ts`**: Contains pure helper functions for formatting text for the UI.
-   **`constants/dateSpecs.ts`**: Holds constant definitions, specifically the detailed specifications for various date formats (`DATE_FORMAT_SPECS`).
-   **`types.ts`**: Defines all TypeScript interfaces specific to this feature.

## 4. Testing Strategy

The testing strategy is categorized into component tests, hook tests, and service tests to ensure comprehensive coverage.

### Component Tests

-   **`index.test.tsx`**: Tests the main `DefineVariableProps` component to ensure it correctly renders `VariablesToScan` initially and switches to `PropertiesEditor` after the first step is completed.
-   **`VariablesToScan.test.tsx`**: Mocks the `useVariablesToScan` hook to test the `VariablesToScan` component's UI and interactions in isolation. Verifies that UI controls trigger the corresponding mocked functions.
-   **`PropertiesEditor.test.tsx`**: Mocks the `usePropertiesEditor` hook to test the `PropertiesEditor` component. It simulates user actions like selecting variables, editing fields, and clicking buttons to confirm that the correct hook functions are called.

### Hook Tests

-   **`useVariablesToScan.test.ts`**: Tests the business logic within the `useVariablesToScan` hook. It mocks the `useVariableStore` and tests moving variables between lists, reordering, and validating the `onContinue` action.
-   **`usePropertiesEditor.test.ts`**: Tests the complex state management inside the `usePropertiesEditor` hook. It mocks the service layer to test state initialization, variable selection logic, property updates, and the `handleSave` function logic.

### Service Tests

-   **`variablePropertiesService.test.ts`**: Performs unit tests on the core business logic functions, which are decoupled from the UI. It mocks the data stores to provide a controlled environment.
    -   **`getUniqueValuesWithCounts`**: Tests that the function correctly scans data, respects limits, and returns accurate unique value counts.
    -   **`suggestMeasurementLevel`**: Tests the suggestion algorithm against various data scenarios (numeric, string, binary, etc.) to ensure it returns the appropriate measurement level.
    -   **`saveVariableProperties`**: Tests that the function correctly identifies modified variables and calls the store's update function with the correct payload.
