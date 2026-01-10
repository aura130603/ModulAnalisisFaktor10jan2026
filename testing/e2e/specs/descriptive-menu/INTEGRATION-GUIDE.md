# Descriptive Analysis Tests Integration Guide

## Overview
This guide explains how to integrate example dataset loading with descriptive analysis tests to ensure comprehensive test coverage with real data.

## Architecture

### Test Structure
```
descriptive-menu/
├── test-setup.ts          # Core setup utility for data loading
├── test-config.ts         # Configuration and validation rules
├── descriptive-analysis.spec.ts
├── frequencies-analysis.spec.ts
├── crosstabs-analysis.spec.ts
├── explore-analysis.spec.ts
└── INTEGRATION-GUIDE.md   # This file
```

### Data Flow
1. **Load Example Dataset** → Customer Database (customer_dbase)
2. **Verify Data Integrity** → Check variables, rows, data types
3. **Navigate to Analysis** → Specific descriptive analysis
4. **Run Tests** → With real data
5. **Cleanup** → Reset state

## Usage Patterns

### Basic Setup
```typescript
import { test, expect } from '@playwright/test';
import { DescriptiveTestSetup } from './test-setup';

test.describe('Descriptive Analysis', () => {
  test.beforeEach(async ({ page }) => {
    const setup = new DescriptiveTestSetup(page);
    await setup.setupForDescriptiveTests('descriptive');
  });

  test('should test with real data', async ({ page }) => {
    // Tests now have access to real customer database variables
    const variables = await page.locator('[data-testid="available-variables"] button').allTextContents();
    expect(variables).toContain('AGE');
    expect(variables).toContain('INCOME');
  });
});
```

### Advanced Configuration
```typescript
import { baseTest as test, expect } from './test-config';

test.describe('Advanced Testing', () => {
  test('should validate dataset integrity', async ({ page, setup, config, helpers }) => {
    const setupUtil = new DescriptiveTestSetup(page);
    await setupUtil.setupForDescriptiveTests('frequencies');
    
    // Validate test data
    const isValid = await helpers.validateTestData(page, config);
    expect(isValid).toBe(true);
    
    // Use specific test variables
    const testVars = helpers.getTestVariables(config, 'frequencies');
    expect(testVars.primary).toContain('SEX');
  });
});
```

## Test Data Details

### Customer Database (customer_dbase)
- **Rows**: 2,000 customer records
- **Variables**: 10 key variables
- **Types**: Numeric, categorical, and string variables
- **Use Cases**: Perfect for all descriptive analyses

### Available Variables
```typescript
const variables = [
  'AGE',        // Numeric - Age in years
  'INCOME',     // Numeric - Annual income
  'MARRIED',    // Categorical - Marital status
  'CHILDREN',   // Numeric - Number of children
  'CAR',        // Categorical - Car ownership
  'SAVE_ACT',   // Categorical - Savings account
  'CURRENT_ACT', // Categorical - Current account
  'MORTGAGE',   // Categorical - Mortgage status
  'PEP',        // Categorical - Personal equity plan
  'SEX'         // Categorical - Gender
];
```

## Integration Strategies

### 1. Sequential Testing
```typescript
// Run all descriptive analyses in sequence
test.describe('Sequential Descriptive Tests', () => {
  const analyses = ['descriptive', 'frequencies', 'crosstabs', 'explore'];
  
  analyses.forEach(analysisType => {
    test(`should test ${analysisType}`, async ({ page }) => {
      const setup = new DescriptiveTestSetup(page);
      await setup.setupForDescriptiveTests(analysisType as any);
      
      // Run specific tests for this analysis type
      // ... test implementation
    });
  });
});
```

### 2. Shared Setup with Cleanup
```typescript
test.describe('Shared Setup Tests', () => {
  let setup: DescriptiveTestSetup;

  test.beforeEach(async ({ page }) => {
    setup = new DescriptiveTestSetup(page);
    await setup.setupForDescriptiveTests('descriptive');
  });

  test.afterEach(async () => {
    await setup.cleanup();
  });

  test('should test descriptive', async ({ page }) => {
    // Test implementation
  });
});
```

### 3. Cross-Analysis Validation
```typescript
test.describe('Cross-Analysis Validation', () => {
  test('should maintain consistent data across analyses', async ({ page }) => {
    const setup = new DescriptiveTestSetup(page);
    
    // Test descriptive
    await setup.setupForDescriptiveTests('descriptive');
    const descVars = await setup.getAvailableVariables();
    
    // Test frequencies
    await setup.setupForDescriptiveTests('frequencies');
    const freqVars = await setup.getAvailableVariables();
    
    // Variables should be consistent
    expect(descVars).toEqual(freqVars);
  });
});
```

## Running the Tests

### Command Line
```bash
# Run all descriptive tests
npx playwright test testing/e2e/specs/descriptive-menu/

# Run specific analysis tests
npx playwright test testing/e2e/specs/descriptive-menu/descriptive-analysis.spec.ts
npx playwright test testing/e2e/specs/descriptive-menu/frequencies-analysis.spec.ts
npx playwright test testing/e2e/specs/descriptive-menu/crosstabs-analysis.spec.ts
npx playwright test testing/e2e/specs/descriptive-menu/explore-analysis.spec.ts

# Run with debug output
npx playwright test testing/e2e/specs/descriptive-menu/ --debug
```

### Configuration Options
```typescript
// playwright.config.ts
export default {
  testDir: './testing/e2e/specs/descriptive-menu',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure'
  }
};
```

## Troubleshooting

### Common Issues

1. **Dataset Not Loading**
   - Ensure Customer Database is available in example datasets
   - Check network connectivity
   - Verify server is running

2. **Variables Not Found**
   - Check if dataset loaded successfully
   - Verify variable names match expected values
   - Check for case sensitivity issues

3. **Tests Failing Due to Missing Data**
   - Ensure `test-setup.ts` is properly imported
   - Check if `setupForDescriptiveTests()` is called in `beforeEach`
   - Verify dataset loading timeout is sufficient

### Debug Commands
```typescript
// Add debug logging
const setup = new DescriptiveTestSetup(page);
const datasetInfo = await setup.verifyDatasetLoaded();
console.log('Dataset loaded:', datasetInfo);

const variables = await setup.getAvailableVariables();
console.log('Available variables:', variables);
```

## Best Practices

1. **Always use the setup utility** for consistent data loading
2. **Validate dataset integrity** before running tests
3. **Use specific variable names** instead of hard-coded values
4. **Clean up after tests** to prevent state pollution
5. **Test with real data** rather than mock data for better coverage

## Performance Considerations

- Dataset loading adds ~3-5 seconds per test suite
- Use shared setup for multiple tests to minimize overhead
- Consider using `test.describe.serial()` for sequential testing
- Monitor memory usage during large test runs

## Extension Points

The architecture supports:
- Additional example datasets
- Custom variable configurations
- Performance benchmarking
- Cross-browser testing
- Integration with CI/CD pipelines
