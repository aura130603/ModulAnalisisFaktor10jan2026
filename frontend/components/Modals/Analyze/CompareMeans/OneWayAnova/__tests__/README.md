# One-Way ANOVA Tests

This directory contains tests for the One-Way ANOVA component and its associated hooks.

## Test Files

- `OneWayAnova.test.tsx`: Tests for the main component
- `VariablesTab.test.tsx`: Tests for the variables tab component
- `useOneWayAnovaAnalysis.test.ts`: Tests for the analysis hook that handles the worker communication and result processing
- `useVariableSelection.test.ts`: Tests for the variable selection hook that manages available, test, and factor variables
- `useTestSettings.test.ts`: Tests for the test settings hook that manages post hoc tests and statistics options
- `useTourGuide.test.ts`: Tests for the tour guide functionality
- `formatters.test.ts`: Tests for the formatter utility functions

## Running Tests

To run these tests, use:

```bash
npm test -- --testPathPattern=OneWayAnova
```

## Test Coverage

These tests cover:

1. **Component Rendering**
   - Main component rendering and tab switching
   - Variables tab rendering and interactions
   - Post Hoc tab rendering and interactions
   - Options tab rendering and interactions
   - Button states based on variable selection

2. **Analysis Logic**
   - Worker communication for multiple variables
   - Result processing and aggregation
   - Error handling
   - Multiple variable handling with factor variable

3. **Variable Selection**
   - Moving variables between available, test, and factor lists
   - Reordering test variables
   - Resetting selection
   - Handling disabled variables
   - Managing factor variable selection

4. **Test Settings**
   - Setting post hoc test options (Tukey, Duncan)
   - Toggling statistics options (descriptive, homogeneity of variance)
   - Toggling effect size estimation
   - Resetting settings

5. **Data Formatting**
   - Formatting One-Way ANOVA table
   - Formatting descriptive statistics table
   - Formatting homogeneity of variance table
   - Formatting multiple comparisons table
   - Formatting homogeneous subsets table
   - Handling edge cases and empty data

6. **Tour Guide**
   - Tour step navigation
   - Tab switching during tour
   - Element highlighting
   - Page navigation between tabs

## Mock Strategy

The tests use Jest mocks to isolate the components from external dependencies:

- Web Workers are mocked to simulate worker communication
- Zustand stores are mocked to provide controlled test data
- Result store operations are mocked to verify correct data saving
- UI components are mocked to simplify testing
- DOM elements are mocked for tour functionality

## Key Differences from Independent-Samples T-Test

1. **Variable Structure**: Uses test variables and factor variable instead of test variables and grouping variable
2. **Analysis Type**: Handles One-Way ANOVA analysis with multiple test variables against one factor variable
3. **Post Hoc Tests**: Includes Tukey HSD and Duncan's multiple range tests
4. **Statistics Options**: Includes descriptive statistics and homogeneity of variance tests
5. **Result Formatting**: Handles ANOVA table, descriptive statistics, homogeneity of variance, multiple comparisons, and homogeneous subsets

## Adding New Tests

When adding new tests:

1. Follow the existing patterns for mocking dependencies
2. Ensure each test focuses on a single behavior
3. Use descriptive test names that explain what is being tested
4. Consider the specific requirements of One-Way ANOVA analysis
5. Test both single and multiple variable scenarios
6. Verify proper handling of factor variable constraints 