/**
 * Comprehensive Test Configuration for Descriptive Analysis Tests
 * This file provides the complete testing strategy that integrates example dataset loading with descriptive analysis tests
 */

import { test, expect } from '@playwright/test';
import { DescriptiveTestSetup } from './test-setup';

/**
 * Test Configuration Interface
 */
export interface TestConfig {
  datasetName: string;
  expectedVariables: string[];
  expectedRows: number;
  analysisTypes: AnalysisType[];
}

export type AnalysisType = 'descriptive' | 'frequencies' | 'crosstabs' | 'explore';

/**
 * Customer Database Test Configuration
 * Based on the Customer_db example dataset
 */
export const customerDbConfig: TestConfig = {
  datasetName: 'customer_dbase',
  expectedVariables: [
    'AGE',
    'INCOME',
    'MARRIED',
    'CHILDREN',
    'CAR',
    'SAVE_ACT',
    'CURRENT_ACT',
    'MORTGAGE',
    'PEP',
    'SEX'
  ],
  expectedRows: 2000,
  analysisTypes: ['descriptive', 'frequencies', 'crosstabs', 'explore']
};

/**
 * Test Suite Configuration
 * Provides reusable test configurations for different scenarios
 */
export const testSuiteConfig = {
  
  /**
   * Standard setup for all descriptive analysis tests
   */
  standardSetup: {
    timeout: 30000,
    retries: 2,
    dataset: customerDbConfig
  },

  /**
   * Performance testing configuration
   */
  performanceSetup: {
    timeout: 60000,
    retries: 1,
    dataset: customerDbConfig,
    metrics: ['loadTime', 'analysisTime', 'memoryUsage']
  },

  /**
   * Cross-browser testing configuration
   */
  crossBrowserSetup: {
    browsers: ['chromium', 'firefox', 'webkit'],
    viewport: { width: 1920, height: 1080 },
    dataset: customerDbConfig
  }
};

/**
 * Test Data Validation Rules
 */
export const validationRules = {
  
  /**
   * Validate that required variables are available
   */
  variables: {
    required: ['AGE', 'INCOME', 'SEX'],
    numeric: ['AGE', 'INCOME', 'CHILDREN'],
    categorical: ['SEX', 'MARRIED', 'PEP'],
    minimumCount: 5
  },

  /**
   * Validate dataset loading
   */
  dataset: {
    minRows: 100,
    maxRows: 10000,
    requiredColumns: 3,
    dataTypes: ['numeric', 'categorical', 'string']
  }
};

/**
 * Test Helper Functions
 */
export class TestHelpers {
  
  /**
   * Validate test data integrity
   */
  static async validateTestData(page: any, config: TestConfig): Promise<boolean> {
    try {
      // Check dataset name
      const datasetName = await page.locator('[data-testid="dataset-name"]').textContent();
      if (!datasetName?.includes(config.datasetName)) {
        console.warn(`Dataset name mismatch: expected ${config.datasetName}, got ${datasetName}`);
        return false;
      }

      // Check variable count
      const availableVariables = await page.locator('[data-testid="available-variables"] button').allTextContents();
      if (availableVariables.length < config.expectedVariables.length) {
        console.warn(`Variable count insufficient: expected ${config.expectedVariables.length}, got ${availableVariables.length}`);
        return false;
      }

      // Check specific variables exist
      for (const variable of config.expectedVariables.slice(0, 3)) {
        if (!availableVariables.some(v => v.includes(variable))) {
          console.warn(`Required variable ${variable} not found`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating test data:', error);
      return false;
    }
  }

  /**
   * Get test variables for specific analysis type
   */
  static getTestVariables(config: TestConfig, analysisType: AnalysisType) {
    switch (analysisType) {
      case 'descriptive':
        return {
          numeric: config.expectedVariables.filter(v => ['AGE', 'INCOME', 'CHILDREN'].includes(v)),
          categorical: config.expectedVariables.filter(v => ['SEX', 'MARRIED', 'PEP'].includes(v))
        };
      
      case 'frequencies':
        return {
          primary: ['SEX', 'MARRIED', 'PEP'],
          numeric: ['AGE', 'INCOME', 'CHILDREN']
        };
      
      case 'crosstabs':
        return {
          rows: ['SEX', 'MARRIED'],
          columns: ['PEP', 'CAR'],
          layers: ['CHILDREN']
        };
      
      case 'explore':
        return {
          dependent: ['AGE', 'INCOME'],
          factor: ['SEX', 'MARRIED'],
          label: ['PEP']
        };
      
      default:
        return { all: config.expectedVariables };
    }
  }

  /**
   * Create test data assertions
   */
  static createAssertions(config: TestConfig) {
    return {
      datasetLoaded: (page: any) => {
        return expect(page.locator('text=' + config.datasetName)).toBeVisible();
      },
      
      variablesAvailable: (page: any, count: number) => {
        return expect(page.locator('[data-testid="available-variables"] button')).toHaveCount(count);
      },
      
      dataTableVisible: (page: any) => {
        return expect(page.locator('[data-testid="data-table"]')).toBeVisible();
      }
    };
  }
}

/**
 * Base Test Configuration for all descriptive analysis tests
 */
export const baseTest = test.extend<{
  setup: DescriptiveTestSetup;
  config: TestConfig;
  helpers: typeof TestHelpers;
}>({
  setup: async ({ page }, use) => {
    await use(new DescriptiveTestSetup(page));
  },
  
  config: async ({}, use) => {
    await use(customerDbConfig);
  },
  
  helpers: async ({}, use) => {
    await use(TestHelpers);
  }
});

/**
 * Example usage in tests:
 * 
 * import { baseTest as test, expect } from './test-config';
 * 
 * test.describe('Descriptive Analysis', () => {
 *   test('should work with example data', async ({ page, setup, config }) => {
 *     await setup.setupForDescriptiveTests('descriptive');
 *     
 *     // Use config for assertions
 *     const variables = await setup.getAvailableVariables();
 *     expect(variables.length).toBeGreaterThan(config.expectedVariables.length);
 *   });
 * });
 */
