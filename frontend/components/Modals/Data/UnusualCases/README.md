# Identify Unusual Cases Feature

This document provides a comprehensive overview of the "Identify Unusual Cases" feature, detailing its functionality, architecture, and testing strategy. The feature is designed to detect anomalous records within a dataset by comparing each case against its peers.

## 1. Overview

The "Identify Unusual Cases" feature helps users find records that differ significantly from others in the dataset. It employs a peer group analysis algorithm to identify outliers by grouping similar cases and calculating how much each case deviates from its group's norms. This is particularly useful for data cleaning, outlier detection, and identifying genuinely unique cases that may warrant further investigation.

The entire analysis is performed on the client-side, using a multi-tabbed dialog to guide the user through the configuration process.

## 2. Feature Walkthrough & UI Components

The user interacts with a modal dialog organized into five tabs. A guided tour is also available to walk users through the key functionalities.

### 2.1. Variables Tab (`VariablesTab.tsx`)

This is the initial tab where users define the scope of the analysis.

-   **Analysis Variables**: Users select the primary variables (typically scale or numeric) to be evaluated for unusualness. The algorithm analyzes patterns across these variables.
-   **Case Identifier Variable**: An optional, single variable (e.g., an ID or name) can be selected to label cases in the output, making it easier to identify specific records.

The tab is implemented using the shared `VariableListManager` component to provide a consistent drag-and-drop experience.

### 2.2. Options Tab (`OptionsTab.tsx`)

This tab allows users to fine-tune the detection algorithm.

-   **Identification Criteria**: Users can choose to identify a specific percentage of cases with the highest anomaly scores or a fixed number of cases.
-   **Anomaly Cutoff**: An optional minimum anomaly index value can be set. Only cases meeting or exceeding this cutoff will be flagged.
-   **Peer Groups**: Users can specify the minimum and maximum number of peer groups to be formed during the clustering phase.
-   **Reasons**: Defines the maximum number of reasons to report for why a case is considered unusual.

### 2.3. Output Tab (`OutputTab.tsx`)

This tab controls which summary tables and lists are generated in the output viewer.

-   **List of Unusual Cases**: The primary output, showing each flagged case and the reasons for its identification.
-   **Peer Group Norms**: A table showing the distribution of variable values within each peer group.
-   **Anomaly Indices**: A summary of the distribution of anomaly index values.
-   **Reason Occurrence**: A table reporting how often each analysis variable contributed to a case being flagged.
-   **Case Processed Summary**: A summary of how many cases were included and excluded from the analysis.

### 2.4. Save Tab (`SaveTab.tsx`)

This tab allows users to save the results of the analysis back into the active dataset as new variables.

-   **Save Anomaly Index**: Creates a new variable containing the anomaly index for each case.
-   **Save Peer Group Membership**: Creates new variables for each case's peer group ID, the size of that group, and its percentage of the total.
-   **Save Reasons**: Creates a set of new variables detailing the reasons for unusualness (e.g., the specific variable, its value, and its deviation from the norm).
-   **Replace Existing**: An option to overwrite variables with the same name if they already exist.

### 2.5. Missing Values Tab (`MissingValuesTab.tsx`)

This tab defines how to handle missing data in the analysis variables.

-   **Exclude Missing Values**: The default option, which performs listwise deletion.
-   **Include Missing Values**: Imputes missing values (mean for scale, a separate category for nominal/ordinal).
-   **Use Proportion Missing**: An option to create a new feature based on the proportion of missing values per case and include it in the analysis.

## 3. Architecture and Data Flow

The feature's logic is primarily encapsulated in the `useUnusualCases` hook, promoting a clear separation of concerns between UI and business logic.

### 3.1. Core Components

-   **`IdentifyUnusualCases/index.tsx`**: The main dialog component. It manages the tabbed layout, state via the `useUnusualCases` hook, and renders the appropriate tab component (`VariablesTab`, `OptionsTab`, etc.). It also integrates the `useTourGuide` hook for the guided tour.
-   **`hooks/useUnusualCases.ts`**: The central hook managing the feature's entire state, including variable lists, all configuration options across the tabs, and the `handleConfirm` and `handleReset` actions. It interacts with `useVariableStore` to read initial variables and `addVariables` to save new ones.
-   **`services/unusualCasesService.ts`**: A pure function responsible for preparing the definitions of new variables based on the user's selections in the "Save" tab. It does not contain state or side effects.

### 3.2. Data Flow

The process from user interaction to result is as follows:

```mermaid
graph TD
    subgraph User Interaction
        A[User opens dialog] --> B{Configure Tabs};
        B -- Variables --> C[Select Analysis/Identifier Vars];
        B -- Options --> D[Set Identification Criteria];
        B -- Save --> E[Choose Variables to Save];
        G[User clicks OK]
        C & D & E --> G;
    end

    subgraph Frontend Logic
        H(IdentifyUnusualCases.tsx) -- manages --> I(Tabs UI);
        H -- uses --> J(useUnusualCases.ts);
        J -- "gets initial vars" --> K(Zustand: useVariableStore);
        G --> L{handleConfirm in useUnusualCases};
        L -- "validates input" --> L;
        L --> M[prepareNewUnusualCasesVariables service];
        M --> N[Get new var definitions];
        N --> L;
        L -- "(placeholder for worker)" --> O[Run Analysis];
        L -- "add new vars" --> K;
        L --> P[Display output (placeholder)];
        P --> Q[Close Dialog];
    end

    A --> H;
```

1.  **Initialization**: The `IdentifyUnusualCases` component mounts, and the `useUnusualCases` hook initializes its state, populating the "Available Variables" list from the global `useVariableStore`.
2.  **Configuration**: The user navigates through the tabs and configures the analysis by moving variables and setting options. All state changes are managed within the `useUnusualCases` hook.
3.  **Execution**: The user clicks "OK", triggering `handleConfirm` in the hook.
4.  **Validation**: `handleConfirm` first validates that at least one analysis variable has been selected.
5.  **Preparation**: The hook calls `prepareNewUnusualCasesVariables` from the service to get the definitions of any new variables to be created.
6.  **Analysis (Placeholder)**: The current implementation is a placeholder. In a complete implementation, the hook would delegate the core analysis (peer grouping, anomaly index calculation) to a web worker to avoid blocking the UI.
7.  **State Update**: The hook calls `addVariables` from `useVariableStore` to add the new variables to the dataset.
8.  **Output (Placeholder)**: The results would be sent to the main output viewer.
9.  **Cleanup**: The dialog closes.

## 4. Testing Strategy

The feature is tested at multiple levels to ensure correctness and stability.

#### 4.1. Main Component Testing (`__tests__/index.test.tsx`)

This suite tests the main `IdentifyUnusualCases` dialog component. It focuses on the overall structure, tab navigation, and connections to its underlying hooks, while mocking the content of each tab.

-   **Rendering**: Verifies that the dialog renders with the correct title and that all tab triggers are present.
-   **Tab Navigation**: Ensures that the "Variables" tab is visible by default and that clicking another tab trigger correctly switches the visible content.
-   **Action Buttons**: Confirms that clicking "Cancel" calls `onClose`, "Reset" calls `handleReset`, and "OK" triggers the confirmation logic.

#### 4.2. UI Component Testing (`__tests__/OptionsTab.test.tsx`)

This suite tests the `OptionsTab` component in isolation, verifying its controls and state interactions.

-   **Rendering**: Checks that all form controls are rendered with their correct default values.
-   **State Changes**: Verifies that state-setting functions are called when the corresponding input values change.
-   **Conditional Disabling**: Ensures that input fields are correctly enabled or disabled based on user selections (e.g., the "Cutoff" input is disabled when its checkbox is unchecked).

#### 4.3. Core Logic Hook Testing (`__tests__/useUnusualCases.test.ts`)

This suite tests the primary business logic contained within the `useUnusualCases` custom hook, mocking `useVariableStore` to provide a consistent test environment.

-   **Initialization**: Verifies that the hook correctly initializes its state, loading variables from the store.
-   **Variable Movement**: Tests moving variables between the "available", "analysis", and "identifier" lists.
-   **Reset Functionality**: Confirms that the `handleReset` function correctly reverts all state slices back to their initial default values.
-   **Confirmation Logic**: Checks that `handleConfirm` validates input correctly and calls `addVariables` from the store when new variables are meant to be saved.
-
-## Sample Test Data
-
-To test the Identify Unusual Cases feature, you can use the following sample dataset:
-
-```
-ID,Age,Income,Education,Expenses,Savings
-1,35,65000,16,45000,15000
-2,42,72000,18,48000,20000
-3,28,58000,16,40000,12000
-4,39,68000,14,47000,18000
-5,45,75000,16,52000,22000
-6,31,62000,12,43000,15000
-7,36,67000,16,46000,18000
-8,29,59000,14,42000,13000
-9,33,64000,16,44000,16000
-10,27,30000,12,45000,5000
-```
-
-### Test Scenarios
-
-1. **Basic Anomaly Detection**:
-   - Analysis Variables: Age, Income, Education, Expenses, Savings
-   - Expected Result: Case #10 should be flagged as unusual due to its anomalous combination of low income, high expenses, and low savings
-
-2. **Financial Patterns Analysis**:
-   - Analysis Variables: Income, Expenses, Savings
-   - Expected Result: Cases with unusual ratios of income to expenses or savings should be highlighted
-
-3. **Specific Peer Group Analysis**:
-   - Analysis Variables: Age, Education, Income
-   - Set fixed number of peer groups: 2
-   - Expected Result: Cases should be divided into roughly two education/age/income groups, with unusual cases in each group identified
-
-These examples demonstrate how to use the Identify Unusual Cases feature for different analytical needs and validate the expected outcomes.

</rewritten_file>