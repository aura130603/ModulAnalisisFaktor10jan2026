# One-Sample T-Test Tests

This directory contains tests for the One-Sample T-Test component and its associated hooks.

## Test Files

- `OneSampleTTest.test.tsx`: Tests for the main component
- `VariablesTab.test.tsx`: Tests for the variables tab component
- `useOneSampleTTestAnalysis.test.ts`: Tests for the analysis hook that handles the worker communication and result processing
- `useVariableSelection.test.ts`: Tests for the variable selection hook that manages available and selected variables
- `useTestSettings.test.ts`: Tests for the test settings hook that manages test value and effect size settings
- `useTourGuide.test.ts`: Tests for the tour guide functionality
- `formatters.test.ts`: Tests for the formatter utility functions

## Running Tests

To run these tests, use:

```bash
npm test -- --testPathPattern=OneSampleTTest
```

## Test Coverage

These tests cover:

1. **Component Rendering**
   - Main component rendering and tab switching
   - Variables tab rendering and interactions
   - Button states based on variable selection

2. **Analysis Logic**
   - Worker communication
   - Result processing
   - Error handling
   - Multiple variable handling

3. **Variable Selection**
   - Moving variables between available and test lists
   - Reordering variables
   - Resetting selection
   - Handling disabled variables

4. **Test Settings**
   - Setting test values
   - Toggling effect size estimation
   - Resetting settings

5. **Data Formatting**
   - Formatting statistical results for display
   - Handling edge cases and empty data

6. **Tour Guide**
   - Tour step navigation
   - Tab switching during tour
   - Element highlighting

## Mock Strategy

The tests use Jest mocks to isolate the components from external dependencies:

- Web Workers are mocked to simulate worker communication
- Zustand stores are mocked to provide controlled test data
- Result store operations are mocked to verify correct data saving
- UI components are mocked to simplify testing

## Adding New Tests

When adding new tests:

1. Follow the existing patterns for mocking dependencies
2. Ensure each test focuses on a single behavior
3. Use descriptive test names that explain what is being tested 