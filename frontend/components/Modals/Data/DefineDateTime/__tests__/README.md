# Define Dates Testing

This document provides an overview of the automated tests for the "Define Dates" feature.

## 1. Component Testing (`DefineDateTime.test.tsx`)

This suite focuses on the `DefineDateTime` component's user interface and interactions.

-   **Rendering**: Verifies that the component renders correctly with its title ("Define Dates"), the list of date formats, and the initial values for the selected format.
-   **User Actions**:
    -   Ensures the `handleOk` function is called when the "OK" button is clicked.
    -   Ensures the `handleReset` function is called when the "Reset" button is clicked.
    -   Ensures the `onClose` function is triggered when the "Cancel" button is clicked.
-   **State Changes**:
    -   Confirms that selecting a new date format from the "Cases Are" list correctly calls the `setSelectedCase` function.
    -   Checks that changing a value in an input field (e.g., Year) correctly triggers the `handleInputChange` function with the appropriate component index and new value.
-   **Edge Cases**:
    -   Tests that a specific message ("No date components to configure") is displayed when there are no time components to show for a selected case (like "Not dated").

## 2. Service Logic Testing (`dateTimeService.test.ts`)

This suite tests the core business logic contained within the `dateTimeService`.

-   **`prepareDateVariables` Function**:
    -   **Variable Creation**: Verifies that the function correctly generates the required new variables (`YEAR_`, `MONTH_`, `DATE_`, etc.) with the correct properties (name, label, type, column index).
    -   **Data Generation**: Checks that the sample data for the new variables is generated accurately for a given number of rows.
    -   **Carry-Over Logic**: Includes specific tests to ensure that time values increment correctly across rows, especially in scenarios where one unit "wraps around" and should increment the next higher unit.
        -   *Example 1*: When the month value goes from 12 to 13, it should become 1, and the year should increment.
        -   *Example 2*: A complex case involving weeks, work days, and hours is tested to ensure all units carry over correctly.

## 3. Utility Function Testing (`dateTimeFormatters.test.ts`)

This suite validates the pure utility functions used for parsing and formatting.

-   **`getTimeComponentsFromCase`**:
    -   Tests that for a given string input (e.g., "Years, quarters, months"), the function returns the correct array of `TimeComponent` objects with the right names, default values, and periodicities.
    -   Covers various combinations, including work days and different time units.
    -   Ensures it returns an empty array for the "Not dated" case.
-   **`getDateFormatString`**:
    -   Verifies that the function produces the correct display format string (e.g., "YYYY-QQ-MM", "WW-D") based on an array of time components.
-   **`formatDateString`**:
    -   Checks that the function correctly assembles a final, human-readable date/time string (e.g., "2023-04 5 14:30:10") from a given set of values and components.
-   **`formatDateForMetaStore`**:
    -   (Implicitly tested through service tests) Ensures the metadata string is formatted correctly. 