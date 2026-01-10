# Chi-Square Test Component Tests

This directory contains comprehensive tests for the Chi-Square Test component and its related hooks and utilities.

## Test Files Overview

### 1. `ChiSquare.test.tsx`
**Component-level tests for the main Chi-Square dialog**

Tests the main Chi-Square component including:
- Rendering and UI structure
- Form validation (OK button disable conditions)
- Loading states and error handling
- Tour guide integration
- Variable selection functionality

**Key Test Cases:**
- Form validation based on the formula: `isCalculating || testVariables.length < 1 || (!expectedRange.getFromData && (rangeValue.lowerValue || !rangeValue.upperValue)) || (!expectedValue.allCategoriesEqual && expectedValueList.length < 2)`
- Loading state when `isCalculating` is true
- Error state handling
- Variable selection and deselection

### 2. `useChiSquareAnalysis.test.ts`
**Hook tests for the Chi-Square analysis logic**

Tests the `useChiSquareAnalysis` hook including:
- Worker communication and message handling
- Analysis state management
- Error handling and insufficient data scenarios
- Multiple variable processing
- Cleanup and resource management

**Key Test Cases:**
- Successful worker response processing
- Worker error handling
- Insufficient data scenarios (`empty`, `singleCategory`)
- Multiple variable analysis
- Critical worker errors
- Analysis timeout and cancellation

### 3. `formatters.test.ts`
**Utility function tests for result formatting**

Tests the formatting utilities including:
- Frequency table formatting
- Test statistics table formatting
- Descriptive statistics table formatting
- Error table formatting
- Number formatting and precision

**Key Test Cases:**
- Correct table structure and headers
- Number formatting with proper decimals
- Edge cases (empty data, null values)
- Large numbers and scientific notation
- P-value formatting

### 4. `VariablesTab.test.tsx`
**Component tests for the Variables tab**

Tests the VariablesTab component including:
- Variable display and selection
- Drag and drop functionality
- Keyboard navigation
- Empty state handling
- Tour guide integration

**Key Test Cases:**
- Variable movement between available and test lists
- Highlighting and hover states
- Empty state displays
- Loading and error state handling
- Tour guide integration

### 5. `useVariableSelection.test.ts`
**Hook tests for variable selection logic**

Tests the `useVariableSelection` hook including:
- Variable state management
- Movement between available and test variables
- Reordering functionality
- Highlighting and selection states

**Key Test Cases:**
- Variable movement operations
- State consistency
- Edge cases (empty lists, invalid operations)
- Performance with large variable sets

### 6. `useTourGuide.test.ts`
**Hook tests for tour guide functionality**

Tests the `useTourGuide` hook including:
- Tour navigation (next/previous)
- Step management
- Tour state persistence
- Boundary conditions

**Key Test Cases:**
- Tour navigation logic
- Step boundary handling
- State persistence across renders
- Multiple tour cycles

### 7. `useTestSettings.test.ts`
**Hook tests for test configuration settings**

Tests the `useTestSettings` hook including:
- Expected range configuration
- Range value management
- Expected value settings
- Display statistics options

**Key Test Cases:**
- Setting updates and state management
- Range value validation
- Expected value list management
- Display statistics configuration

## Test Coverage

### Chi-Square Analysis Logic
- ✅ Worker communication
- ✅ Data validation and insufficient data detection
- ✅ Error handling and recovery
- ✅ Multiple variable processing
- ✅ Resource cleanup

### UI Components
- ✅ Form validation and button states
- ✅ Variable selection interface
- ✅ Loading and error states
- ✅ Tour guide integration
- ✅ Accessibility features

### Data Processing
- ✅ Frequency table generation
- ✅ Test statistics calculation
- ✅ Descriptive statistics formatting
- ✅ Number formatting and precision
- ✅ Edge case handling

### State Management
- ✅ Variable selection state
- ✅ Test configuration settings
- ✅ Tour guide state
- ✅ Analysis progress tracking

## Running Tests

### Run all Chi-Square tests:
```bash
npm test -- components/Modals/Analyze/NonparametricTests/LegacyDialogs/ChiSquare/__tests__
```

### Run specific test file:
```bash
npm test -- components/Modals/Analyze/NonparametricTests/LegacyDialogs/ChiSquare/__tests__/ChiSquare.test.tsx
```

### Run with coverage:
```bash
npm test -- --coverage components/Modals/Analyze/NonparametricTests/LegacyDialogs/ChiSquare/__tests__
```

## Test Patterns

### Mocking Strategy
- **Hooks**: Mocked using `jest.mock()` with controlled return values
- **Web Workers**: Mocked with `postMessage`, `terminate`, and event handlers
- **Stores**: Mocked using `jest.mock()` for Zustand stores
- **Dependencies**: External dependencies are mocked to isolate unit tests

### Test Structure
- **Setup**: Clear `beforeEach` blocks with mock initialization
- **Assertions**: Specific expectations for state changes and function calls
- **Cleanup**: Proper cleanup in `afterEach` blocks where needed
- **Edge Cases**: Comprehensive coverage of error conditions and boundary cases

### Async Testing
- **Worker Communication**: Uses `act()` and `async/await` for worker message handling
- **State Updates**: Proper handling of asynchronous state changes
- **Error Scenarios**: Testing of timeout and error conditions

## Key Testing Principles

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Completeness**: Tests cover both success and failure scenarios
3. **Realism**: Mock data and scenarios reflect real-world usage
4. **Maintainability**: Tests are well-structured and documented
5. **Performance**: Tests run efficiently and don't have unnecessary complexity

## Common Test Patterns

### Hook Testing
```typescript
const { result } = renderHook(() => useHook());
act(() => {
  result.current.someAction();
});
expect(result.current.someState).toBe(expectedValue);
```

### Component Testing
```typescript
render(<Component />);
const element = screen.getByText('Expected Text');
expect(element).toBeInTheDocument();
```

### Async Testing
```typescript
await act(async () => {
  await result.current.asyncAction();
});
expect(mockFunction).toHaveBeenCalled();
```

### Error Testing
```typescript
act(() => {
  result.current.actionThatThrows();
});
expect(result.current.errorState).toContain('Error message');
```

## Maintenance Notes

- Keep mock data consistent across test files
- Update tests when component interfaces change
- Ensure new features have corresponding test coverage
- Monitor test performance and optimize slow tests
- Maintain test documentation as features evolve 