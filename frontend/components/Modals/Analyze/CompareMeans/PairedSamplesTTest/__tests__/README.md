# Paired Samples T Test - Test Suite

This directory contains comprehensive tests for the Paired Samples T Test component and its associated hooks.

## Test Files Overview

### 1. `PairedSamplesTTest.test.tsx`
**Main component test file**

Tests the main PairedSamplesTTest component including:
- Component rendering and structure
- Tab navigation (Variables and Options tabs)
- Analysis button functionality and states
- Tour functionality integration
- Error handling and display
- Component props and container types
- Hook integration and prop passing

**Key test areas:**
- Dialog title and structure rendering
- Tab switching between Variables and Options
- Analysis button states (enabled/disabled/loading)
- Tour popup rendering and interaction
- Error message display
- Close button functionality

### 2. `usePairedSamplesTTestAnalysis.test.ts`
**Analysis hook test file**

Tests the `usePairedSamplesTTestAnalysis` hook including:
- Initial state validation
- Analysis execution workflow
- Worker communication
- Success and error handling
- Calculation cancellation
- Cleanup and resource management

**Key test areas:**
- Hook initialization with correct default values
- Analysis execution with valid parameters
- Validation checks (pair validity, duplicate detection)
- Worker message handling (success/error responses)
- Calculation state management
- Worker cleanup on unmount
- Edge cases with empty or mismatched data

### 3. `useVariableSelection.test.ts`
**Variable selection hook test file**

Tests the `useVariableSelection` hook including:
- Variable management and state
- Pair creation and manipulation
- Variable movement between lists
- Pair reordering and removal
- Validation functions
- Highlighting functionality

**Key test areas:**
- Initial state with available variables
- Moving variables to test lists
- Removing variables from test lists
- Swapping variables between lists
- Moving pairs up/down in order
- Removing entire pairs
- Pair validation and duplicate detection
- Variable highlighting
- State reset functionality

### 4. `VariablesTab.test.tsx`
**Variables tab component test file**

Tests the VariablesTab component including:
- Component rendering and structure
- Variable selection and interaction
- Pair management UI
- Button states and functionality
- Tour integration
- Accessibility features

**Key test areas:**
- Available variables table rendering
- Test variable pairs display
- Variable selection and highlighting
- Remove, swap, and reorder buttons
- Pair highlighting and interaction
- Button state management (enabled/disabled)
- Tour highlighting application
- Empty state handling
- Accessibility attributes

### 5. `useTourGuide.test.ts`
**Tour guide hook test file**

Tests the `useTourGuide` hook including:
- Tour state management
- Step navigation
- Tab switching integration
- Tour completion and restart

**Key test areas:**
- Hook initialization with tour steps
- Tour start, next, previous, and end functionality
- Step navigation boundaries
- Tab switching for required tabs
- Tour step properties handling
- Edge cases with empty or incomplete steps
- Tour restart functionality

### 6. `useTestSettings.test.ts`
**Test settings hook test file**

Tests the `useTestSettings` hook including:
- Settings state management
- Effect size estimation toggle
- Standardizer configuration
- Settings reset functionality

**Key test areas:**
- Initial state with default values
- Effect size estimation toggle
- Calculate standardizer configuration
- Settings reset to initial values
- State independence between instances
- Edge cases with invalid props

## Test Coverage

### Component Coverage
- ✅ Main component rendering
- ✅ Tab navigation
- ✅ Button interactions
- ✅ Error states
- ✅ Loading states
- ✅ Tour integration
- ✅ Props handling

### Hook Coverage
- ✅ State initialization
- ✅ State updates
- ✅ Side effects
- ✅ Cleanup
- ✅ Error handling
- ✅ Edge cases
- ✅ Integration with external dependencies

### UI Coverage
- ✅ Table rendering
- ✅ Button states
- ✅ Form interactions
- ✅ Accessibility
- ✅ Responsive behavior
- ✅ Empty states

## Running Tests

```bash
# Run all Paired Samples T Test tests
npm test -- PairedSamplesTTest

# Run specific test file
npm test -- PairedSamplesTTest.test.tsx

# Run tests with coverage
npm test -- --coverage --collectCoverageFrom="**/PairedSamplesTTest/**"
```

## Test Patterns

### Mocking Strategy
- **External dependencies**: All external hooks and stores are mocked
- **UI components**: Shadcn/ui components are mocked with simple implementations
- **Workers**: Web Workers are mocked with fake implementations
- **Icons**: Lucide React icons are mocked with div elements

### Test Structure
- **Setup**: Clear mock setup in beforeEach
- **Arrange**: Prepare test data and state
- **Act**: Perform the action being tested
- **Assert**: Verify expected outcomes

### Common Patterns
- Hook testing with `renderHook` and `act`
- Component testing with `render` and `screen`
- User interaction testing with `userEvent`
- Async operation testing with proper await handling

## Dependencies

The tests depend on:
- `@testing-library/react` for component and hook testing
- `@testing-library/user-event` for user interaction simulation
- `jest` for test framework and mocking
- TypeScript for type safety

## Notes

- All tests follow the same patterns as the Independent Samples T Test tests
- Tests are designed to be isolated and independent
- Mock implementations are kept simple and focused
- Error cases and edge conditions are thoroughly covered
- Tour functionality is tested for both active and inactive states 