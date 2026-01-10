# Restructure Data Wizard

## 1. Overview

This component provides a user-friendly, multi-step wizard for restructuring datasets, analogous to the **Restructure Data Wizard** found in statistical software like SPSS. It allows users to transform data between "wide" and "long" formats, or transpose the entire dataset.

The entire restructuring process is handled on the **frontend**. The wizard guides the user through specifying the transformation, and upon completion, the logic is executed by a client-side service which then updates the application's state with the newly structured data and variables.

## 2. Restructure Methods Explained

### Variables to Cases

This method transforms multiple variables (columns) into a smaller number of new variables by creating new cases (rows). It's commonly used to convert data from a "wide" format to a "long" format, which is often required for repeated measures analysis.

-   **Example**: Converting `Score1`, `Score2`, `Score3` columns for each subject into a single `Score` column, with a new `Index` column to identify which original score each row represents.

    *Before:*
    | SubjectID | Score1 | Score2 |
    | :--- | :--- | :--- |
    | 1 | 85 | 90 |
    | 2 | 92 | 88 |

    *After:*
    | SubjectID | Index  | Score |
    | :--- | :--- | :--- |
    | 1 | Score1 | 85 |
    | 1 | Score2 | 90 |
    | 2 | Index1 | 92 |
    | 2 | Index2 | 88 |

### Cases to Variables

This is the inverse of the previous method, transforming multiple cases (rows) into variables (columns). It's used to convert data from a "long" format to a "wide" format.

-   **Example**: Converting rows identified by a `TimePoint` variable into separate columns like `Score_Time1`, `Score_Time2`.

    *Before:*
    | SubjectID | TimePoint | Score |
    | :--- | :--- | :--- |
    | 1 | 1 | 85 |
    | 1 | 2 | 90 |
    | 2 | 1 | 92 |
    | 2 | 2 | 88 |

    *After:*
    | SubjectID | Score_Time1 | Score_Time2 |
    | :--- | :--- | :--- |
    | 1 | 85 | 90 |
    | 2 | 92 | 88 |

### Transpose All Data

This method performs a simple but complete transposition of the entire dataset, swapping all rows and columns.

-   **Example**: A dataset with 10 rows and 5 columns becomes a dataset with 5 rows and 10 columns.

## 3. Component Architecture

The feature is architecturally divided into several key files to separate concerns:

-   **`index.tsx`**: The main entry point that integrates the UI (`RestructureUI`) with the state management and logic from the `useRestructure` hook.
-   **`RestructureUI.tsx`**: A presentational component responsible for rendering the wizard's tab-based user interface. It is driven entirely by the state and handlers provided by the `useRestructure` hook.
-   **`hooks/useRestructure.ts`**: The logical core of the component. This custom hook manages the wizard's state, including the current step, selected method, variable lists, user-selected options, and input validation. It orchestrates the entire process.
-   **`services/restructureService.ts`**: This is the service layer that contains the pure data transformation logic. It receives the current data, variables, and a configuration object from the hook, performs the restructuring, and returns the new data and variable definitions.
-   **`types.ts`**: Contains all relevant TypeScript interfaces and enums for the feature (`RestructureMethod`, `RestructureConfig`, etc.).

## 4. Wizard Logic and Flow

The wizard guides the user through a three-step process, enforced by tab navigation that is enabled or disabled based on step completion.

### Step 1: Select Restructure Method

The user chooses one of the three restructuring methods detailed above.

### Step 2: Configure Variables

Based on the chosen method, the user configures the variables for the operation using a drag-and-drop interface:

-   **For "Variables to Cases"**:
    -   **Variables to Restructure**: The set of variables (columns) to be converted into rows.
    -   **Index Variables**: Variables that identify the groups of new cases (e.g., a subject ID) and will be repeated for each new row.
-   **For "Cases to Variables"**:
    -   **Variables to Restructure**: The variable whose values will be restructured into the new columns (e.g., `Score`).
    -   **Identifier Variables**: The variable whose unique values will form the new column names (e.g., a `Time` variable with values 1, 2, 3).
-   **For "Transpose All Data"**: This step is skipped as no variable selection is needed.

The `useRestructure` hook includes validation to ensure that the appropriate variables are selected for the chosen method before allowing the user to proceed.

### Step 3: Set Options and Finish

The user configures final, method-specific options before execution:

-   **For "Variables to Cases"**:
    -   `Create count variable`: Adds a column counting non-missing values from the original restructured variables.
    -   `Create index variable`: Adds a column identifying the original variable name for each new case.
-   **For "Cases to Variables"**:
    -   `Drop empty variables`: Removes new columns that contain only missing values after restructuring.

Upon clicking "Finish", the `useRestructure` hook assembles a `RestructureConfig` object and passes it, along with the current data and variable definitions, to the `restructureData` function in `restructureService.ts`. The service returns the transformed data, which is then used to update the global `useDataStore` and `useVariableStore`, effectively replacing the old dataset with the new, restructured one.

## 5. Testing Strategy

The feature's automated tests are organized into three distinct suites to ensure comprehensive coverage.

-   **UI Testing (`__tests__/Restructure.test.tsx`)**: This suite focuses on the `RestructureUI` component, mocking the `useRestructure` hook to test the UI in isolation. It verifies correct rendering, tab state, conditional display of variable lists and options, and the display of validation errors.

-   **Hook Logic Testing (`__tests__/useRestructure.test.ts`)**: This suite tests the core business logic within the `useRestructure` hook. It mocks the service layer and Zustand stores to test state initialization, step navigation (including validation blocking and special flows), and the `handleFinish` logic, ensuring the service is called correctly and the stores are updated.

-   **Service-Level Testing (`__tests__/restructureService.test.ts`)**: This suite performs unit tests on the pure data transformation functions in `restructureService.ts` using mock data. It verifies the correctness of the `wideToLong`, `longToWide`, and `transposeAll` algorithms, including the handling of all associated options.
