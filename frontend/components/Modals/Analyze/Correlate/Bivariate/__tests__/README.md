# Bivariate Correlation Tests

This directory contains tests for the Bivariate Correlation component and its associated hooks.

## Test Files

- `Bivariate.test.tsx`: Tests for the main component
- `VariablesTab.test.tsx`: Tests for the variables tab component
- `OptionsTab.test.tsx`: Tests for the options tab component
- `useBivariateAnalysis.test.ts`: Tests for the analysis hook that handles the worker communication and result processing
- `useVariableSelection.test.ts`: Tests for the variable selection hook that manages available, test, and control variables
- `useTestSettings.test.ts`: Tests for the test settings hook that manages correlation coefficients, test of significance, and other options
- `useTourGuide.test.ts`: Tests for the tour guide functionality
- `formatters.test.ts`: Tests for the formatter utility functions

## Running Tests

To run these tests, use:

```bash
npm test -- --testPathPattern=Bivariate
```

## Test Coverage

These tests cover:

1. **Component Rendering**
   - Main component rendering and tab switching
   - Variables tab rendering and interactions
   - Options tab rendering and interactions
   - Button states based on variable selection

2. **Analysis Logic**
   - Worker communication
   - Result processing
   - Error handling
   - Multiple variable handling
   - Partial correlation handling

3. **Variable Selection**
   - Moving variables between available and test lists
   - Moving variables to/from control variables (for partial correlation)
   - Reordering variables
   - Resetting selection
   - Handling disabled variables

4. **Test Settings**
   - Setting correlation coefficients (Pearson, Kendall's tau-b, Spearman's rho)
   - Setting test of significance options
   - Setting flag significant correlations
   - Setting show only lower triangle and show diagonal options
   - Setting partial correlation options
   - Setting statistics options
   - Setting missing values options

5. **Data Formatting**
   - Formatting correlation tables
   - Formatting partial correlation tables
   - Formatting descriptive statistics tables
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
4. Test both positive and negative scenarios
5. Include edge cases for variable selection and correlation options 