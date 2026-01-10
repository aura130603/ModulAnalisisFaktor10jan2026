# Define Dates Feature

This document outlines the functionality and architecture of the "Define Dates" feature, which allows users to create a time-based structure for their dataset.

## 1. Overview

The "Define Dates" feature provides a user-friendly interface to establish a chronological framework for time-series data. When a user selects a predefined date and time format (e.g., "Years, quarters, months"), this module automatically:

1.  **Creates New Variables**: Generates a separate variable for each time component specified in the format (e.g., `YEAR_`, `QUARTER_`, `MONTH_`).
2.  **Generates a Formatted Date Variable**: Creates a single string variable named `DATE_` that displays the complete, formatted date entry for each case.
3.  **Populates with Sample Data**: Fills the newly created variables with sequential date and time values for the first 20 rows (or the total number of existing rows if less than 20) to provide an immediate visual representation of the structure.
4.  **Stores Metadata**: Saves the chosen date format configuration in the application's metadata, allowing other time-series features to recognize and utilize this structure.

## 2. Feature Architecture

The feature follows the standard modal architecture, separating concerns into hooks, services, and utils.

-   **`index.tsx`**: The main entry point for the modal. It assembles the UI and is responsible for rendering the content.
-   **`hooks/useDefineDateTime.ts`**: The central orchestrator for the feature's logic. It manages the UI state (like the currently selected date format), handles user interactions (button clicks), and coordinates calls between the service and the global stores.
-   **`services/dateTimeService.ts`**: Contains the core business logic. Its primary responsibility is to prepare the definitions for the new variables and generate the corresponding cell data. It is a pure module that does not directly interact with global stores, making it highly testable.
-   **`utils/dateTimeFormatters.ts`**: A collection of pure, reusable utility functions for parsing user selections and formatting date/time strings for display.
-   **`types.ts`**: Defines the TypeScript types and interfaces specific to this feature, such as `TimeComponent`.

## 3. Data Flow

The data processing flow is designed to be clear and maintainable:

1.  **User Interaction**: The user selects a desired date format from the "Cases Are" list (e.g., "Days, hours").
2.  **State Update**: The `useDefineDateTime` hook updates its internal state to reflect this selection. The UI re-renders to show the relevant input fields for the "First Case Is" section.
3.  **Confirmation**: The user clicks the "OK" button.
4.  **Hook Orchestration**: The `handleOk` function within the hook is triggered.
5.  **Service Call**: The hook calls the `prepareDateVariables` function from `dateTimeService.ts`, passing the current time components, the list of existing variables, and the number of rows in the dataset.
6.  **Logic Execution**: The service function:
    -   Calculates the required new variables (`YEAR_`, `DAY_`, `HOUR_`, `DATE_`, etc.).
    -   Generates the sequential sample data for each new variable.
    -   Returns a single object containing two arrays: `variablesToCreate` and `cellUpdates`.
7.  **Store Interaction**: The `handleOk` function in the hook receives this object and performs the following actions in sequence:
    -   It iterates through the `variablesToCreate` array, calling the `addVariable` action from the `useVariableStore` for each new variable.
    -   It calls the `updateCells` action from the `useDataStore`, passing the entire `cellUpdates` array to populate the grid in a single, efficient operation.
    -   It updates the `useMetaStore` with the selected date format string.
8.  **Modal Close**: The modal closes, and the user sees the newly created and populated variables in the main data grid.

## 4. Feature Specifications & Examples

This section details the behavior of the "Define Dates" feature for various configurations. The system generates new variables based on user selections and populates them with sequential data.

### Example 1: Years and Months

This example demonstrates the carry-over logic from `MONTH_` to `YEAR_`.

-   **User Selection**: `Years, months`
-   **First Case Input**: `Year: 2022`, `Month: 11`
-   **Resulting New Variables**:
    -   `YEAR_` (Numeric, Label: 'YEAR, not periodic')
    -   `MONTH_` (Numeric, Label: 'MONTH, period 12')
    -   `DATE_` (String, Label: 'Date. Format: YYYY-MM')
-   **Generated Data**:

| Case | YEAR_ | MONTH_ | DATE_ |
| :--- | :---- | :----- | :------ |
| 1 | 2022 | 11 | `2022-11` |
| 2 | 2022 | 12 | `2022-12` |
| 3 | 2023 | 1 | `2023-01` |
| 4 | 2023 | 2 | `2023-02` |

### Example 2: Weeks and Work Days

This example demonstrates periodicity with a 5-day work week.

-   **User Selection**: `Weeks, work days(5)`
-   **First Case Input**: `Week: 51`, `Work day: 4`
-   **Resulting New Variables**:
    -   `WEEK_` (Numeric, Label: 'WEEK, not periodic')
    -   `WORK DAY_` (Numeric, Label: 'WORK DAY, period 5')
    -   `DATE_` (String, Label: 'Date. Format: WW-D')
-   **Generated Data**:

| Case | WEEK_ | WORK DAY_ | DATE_ |
| :--- | :---- | :-------- | :------ |
| 1 | 51 | 4 | `W51 4` |
| 2 | 51 | 5 | `W51 5` |
| 3 | 52 | 1 | `W52 1` |
| 4 | 52 | 2 | `W52 2` |

### Example 3: Days and Time

This example demonstrates carry-over across multiple time units (minute → hour → day).

-   **User Selection**: `Days, hours, minutes`
-   **First Case Input**: `Day: 364`, `Hour: 23`, `Minute: 58`
-   **Resulting New Variables**:
    -   `DAY_` (Numeric, Label: 'DAY, not periodic')
    -   `HOUR_` (Numeric, Label: 'HOUR, period 24')
    -   `MINUTE_` (Numeric, Label: 'MINUTE, period 60')
    -   `DATE_` (String, Label: 'Date. Format: DD HH:MM')
-   **Generated Data**:

| Case | DAY_ | HOUR_ | MINUTE_ | DATE_ |
| :--- | :--- | :---- | :------ | :------------ |
| 1 | 364 | 23 | 58 | `364 23:58` |
| 2 | 364 | 23 | 59 | `364 23:59` |
| 3 | 365 | 0 | 0 | `365 00:00` |
| 4 | 365 | 0 | 1 | `365 00:01` |

## 5. Implemented Features

The following list contains all currently supported formats that can be selected in the "Cases Are" list. Each option generates the corresponding time component variables and a formatted `DATE_` variable.

-   `Years`
-   `Years, quarters`
-   `Years, months`
-   `Years, quarters, months`
-   `Days`
-   `Weeks, days`
-   `Weeks, work days(5)`
-   `Weeks, work days(6)`
-   `Hours`
-   `Days, hours`
-   `Days, work hour(8)`
-   `Weeks, days, hours`
-   `Weeks, work days, hours`
-   `Minutes`
-   `Hours, minutes`
-   `Days, hours, minutes`
-   `Seconds`
-   `Minutes, seconds`
-   `Hours, minutes, seconds`
-   `Not dated` (Clears any existing date definition)

## 6. Future Enhancements (Not Implemented)

The following features are planned for future releases to enhance time-series capabilities:

-   **Date Parsing**: Ability to parse date/time information from existing string variables to create the component numeric variables.
-   **Custom Cycles**: Allow users to define custom periodicities for components (e.g., a 4-day work week or a custom fiscal year).
-   **Irregular Time Series**: Support for datasets where the time interval between cases is not constant.
-   **Date-based Functions**: Integration with other features to allow for date-based calculations (e.g., `DATE_DIFF`, `DATE_ADD`). 