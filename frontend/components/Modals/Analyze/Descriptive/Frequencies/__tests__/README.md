# Frequencies Modal Tests

This directory houses the complete test suite for the Frequencies modal, its components, hooks, and utility functions.

## Test Files

### 1. `Frequencies.test.tsx`

- **Purpose**: Tests the main `Frequencies` component, ensuring its UI and core user interactions function correctly.
- **Coverage**:
    - Verifies that the modal renders with the correct title and tabs.
    - Checks that the "OK" button is enabled/disabled based on whether variables are selected.
    - Confirms that the "OK", "Cancel", and "Reset" buttons trigger the appropriate actions.
    - Tests tab switching between the "Variables", "Statistics", and "Charts" sections.
    - Ensures the tour guide is initiated via the help button.
    - Checks for the loading state when an analysis is in progress.

### 2. `useFrequenciesAnalysis.test.ts`

- **Purpose**: Tests the `useFrequenciesAnalysis` hook, which manages the core logic of running the analysis via a web worker.
- **Coverage**:
    - Mocks the web worker and data stores to isolate the hook's logic.
    - Verifies that the worker is called with the correct parameters.
    - Tests the successful processing of results from the worker, ensuring statistics and frequency tables are formatted and added to the results.
    - Asserts that worker errors and critical instantiation errors are handled gracefully.

### 3. `useVariableSelection.test.ts`

- **Purpose**: Tests the `useVariableSelection` hook responsible for managing the state of available and selected variables.
- **Coverage**:
    - Mocks the `useVariableStore` to provide a consistent set of variables.
    - Tests moving variables from the available list to the selected list and back.
    - Verifies that reordering of selected variables works correctly.
    - Ensures the `resetVariableSelection` function correctly returns all variables to the available list.

### 4. `useStatisticsSettings.test.ts`

- **Purpose**: Tests the `useStatisticsSettings` hook, which manages the state of all user-selectable statistical options.
- **Coverage**:
    - Checks for correct initialization with both default and provided initial values.
    - Verifies that individual statistic options can be updated.
    - Ensures the `resetStatisticsSettings` function reverts all options to their defaults.
    - Tests that the `getCurrentStatisticsOptions` function returns a `null` or a correctly structured options object based on the state.

### 5. `useTourGuide.test.ts`

- **Purpose**: Tests the `useTourGuide` hook for the Frequencies modal.
- **Coverage**:
    - Mocks a DOM environment with the necessary element IDs for the tour.
    - Tests the full lifecycle: starting, navigating (next/previous), and ending the tour.
    - Verifies that the hook correctly triggers tab switches when the tour moves to steps on different tabs.
    - Ensures the correct DOM element is targeted for each step of the tour.

### 6. `formatters.test.ts`

- **Purpose**: Tests the utility functions that format raw analysis data into display-ready table structures.
- **Coverage**:
    - **`formatStatisticsTable`**: Ensures statistics data is correctly transformed into a table with the right headers, rows, and precision.
    - **`formatFrequencyTable`**: Verifies that frequency table data is correctly structured with valid, missing, and total sections. 