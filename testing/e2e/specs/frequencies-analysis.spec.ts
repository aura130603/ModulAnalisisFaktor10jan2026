import { test, expect } from '@playwright/test';
import { collectBrowserMetrics, monitorOperation, BrowserMetrics } from '../utils/browserMetrics';

// Page Object Model for Frequencies Analysis
class FrequenciesAnalysisPage {
  constructor(private page: any) {}

  // Navigation methods
  async navigateToFrequencies() {
    await this.page.click('button:has-text("Analyze")');
    await this.page.waitForTimeout(1000);
    await this.page.click('text=Descriptive Statistics');
    await this.page.waitForTimeout(1000);
    await this.page.click('text=Frequencies...');
    await this.page.waitForTimeout(2000);
  }

  async loadExampleDataset() {
    await this.page.click('button:has-text("File")');
    await this.page.waitForTimeout(1000);
    await this.page.click('text=Example Data');
    await this.page.waitForTimeout(2000);
    await this.page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await this.page.click('button:has-text("accidents.sav")');
    await this.page.waitForTimeout(5000);
  }

  // Dialog interaction methods
  async selectVariablesTab() {
    await this.page.getByTestId('variables-tab-trigger').click();
    await this.page.waitForTimeout(500);
  }

  async selectStatisticsTab() {
    await this.page.getByTestId('statistics-tab-trigger').click();
    await this.page.waitForTimeout(500);
  }

  async selectChartsTab() {
    await this.page.getByTestId('charts-tab-trigger').click();
    await this.page.waitForTimeout(500);
  }

  async selectVariable(variableName: string) {
    // Select variable from available list and move to selected
    await this.page.getByTestId(`available-variable-${variableName}`).click();
    await this.page.getByTestId('move-variable-right').click();
    await this.page.waitForTimeout(500);
  }

  async enableFrequencyTables() {
    await this.page.getByTestId('display-frequency-tables').check();
    await this.page.waitForTimeout(500);
  }

  async enableStatistics() {
    await this.selectStatisticsTab();
    await this.page.getByTestId('show-statistics').check();
    await this.page.waitForTimeout(500);
  }

  async enableQuartiles() {
    await this.page.getByTestId('quartiles-checkbox').check();
    await this.page.waitForTimeout(500);
  }

  async enableMean() {
    await this.page.getByTestId('mean-checkbox').check();
    await this.page.waitForTimeout(500);
  }

  async enableCharts() {
    await this.selectChartsTab();
    await this.page.getByTestId('show-charts').check();
    await this.page.waitForTimeout(500);
  }

  async enableBarChart() {
    await this.page.getByTestId('bar-chart-checkbox').check();
    await this.page.waitForTimeout(500);
  }

  async runAnalysis() {
    await this.page.getByTestId('frequencies-ok-button').click();
  }

  async cancelAnalysis() {
    await this.page.getByTestId('frequencies-cancel-button').click();
  }

  async resetForm() {
    await this.page.getByTestId('frequencies-reset-button').click();
  }

  // Verification methods
  async verifyDialogVisible() {
    await expect(this.page.getByTestId('frequencies-dialog')).toBeVisible();
  }

  async verifyDialogClosed() {
    await expect(this.page.getByTestId('frequencies-dialog')).not.toBeVisible();
  }

  async verifyOkButtonEnabled() {
    await expect(this.page.getByTestId('frequencies-ok-button')).toBeEnabled();
  }

  async verifyOkButtonDisabled() {
    await expect(this.page.getByTestId('frequencies-ok-button')).toBeDisabled();
  }

  async verifyLoadingState() {
    await expect(this.page.getByText('Calculating...')).toBeVisible();
  }

  async verifyResultsGenerated() {
    // Wait for results to appear in the output area
    await this.page.waitForSelector('[data-testid="analysis-results"]', { timeout: 15000 });
    await expect(this.page.getByTestId('analysis-results')).toBeVisible();
  }

  async verifyFrequencyTableExists() {
    await expect(this.page.locator('text=Frequency Table')).toBeVisible();
  }

  async verifyStatisticsTableExists() {
    await expect(this.page.locator('text=Statistics')).toBeVisible();
  }

  async verifyChartExists() {
    await expect(this.page.locator('[data-testid="chart-container"]')).toBeVisible();
  }
}

test.describe('Frequencies Analysis E2E Tests', () => {
  let jsErrors: string[] = [];
  let networkErrors: string[] = [];
  let frequenciesPage: FrequenciesAnalysisPage;
  let startMetrics: BrowserMetrics;

  test.beforeEach(async ({ page }) => {
    jsErrors = [];
    networkErrors = [];
    frequenciesPage = new FrequenciesAnalysisPage(page);

    // Monitor JavaScript errors
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
      console.error('JavaScript error:', error.message);
    });

    // Monitor network errors
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      console.error('Network error:', request.url(), request.failure()?.errorText);
    });

    // Navigate to application
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Collect initial metrics
    startMetrics = await collectBrowserMetrics(page);
  });

  test.afterEach(async ({ page }) => {
    const endMetrics = await collectBrowserMetrics(page);
    console.log('=== Performance Metrics ===');
    console.log(`Memory Usage: ${(endMetrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`DOM Nodes: ${endMetrics.dom.nodeCount}`);
    console.log(`Load Time: ${endMetrics.performance.loadTime}ms`);
    console.log('============================');
  });

  test('should open frequencies dialog and display all tabs', async ({ page }) => {
    // Load dataset first
    await frequenciesPage.loadExampleDataset();
    
    // Navigate to frequencies
    await frequenciesPage.navigateToFrequencies();
    
    // Verify dialog is visible
    await frequenciesPage.verifyDialogVisible();
    
    // Verify all tabs are present
    await expect(page.getByRole('tab', { name: /Variables/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Statistics/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Charts/i })).toBeVisible();
    
    // Verify Variables tab is active by default
    await expect(page.getByTestId('variables-tab-trigger')).toHaveAttribute('data-state', 'active');
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should require variable selection before enabling OK button', async ({ page }) => {
    await frequenciesPage.loadExampleDataset();
    await frequenciesPage.navigateToFrequencies();
    
    // Initially OK button should be disabled
    await frequenciesPage.verifyOkButtonDisabled();
    
    // Select a variable
    await frequenciesPage.selectVariable('age');
    
    // Now OK button should be enabled
    await frequenciesPage.verifyOkButtonEnabled();
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should perform basic frequencies analysis with default settings', async ({ page }) => {
    const testStartTime = Date.now();
    
    await frequenciesPage.loadExampleDataset();
    await frequenciesPage.navigateToFrequencies();
    
    // Select variable and enable frequency tables
    await frequenciesPage.selectVariable('age');
    await frequenciesPage.enableFrequencyTables();
    
    // Run analysis
    await frequenciesPage.runAnalysis();
    
    // Verify loading state appears
    await frequenciesPage.verifyLoadingState();
    
    // Wait for results
    await frequenciesPage.verifyResultsGenerated();
    
    // Verify frequency table is generated
    await frequenciesPage.verifyFrequencyTableExists();
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Basic frequencies analysis test time: ${totalTestTime}ms`);
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should perform comprehensive frequencies analysis with all options', async ({ page }) => {
    const testStartTime = Date.now();
    
    await frequenciesPage.loadExampleDataset();
    await frequenciesPage.navigateToFrequencies();
    
    // Configure comprehensive analysis
    await frequenciesPage.selectVariable('age');
    await frequenciesPage.enableFrequencyTables();
    
    // Enable statistics
    await frequenciesPage.enableStatistics();
    await frequenciesPage.enableQuartiles();
    await frequenciesPage.enableMean();
    
    // Enable charts
    await frequenciesPage.enableCharts();
    await frequenciesPage.enableBarChart();
    
    // Return to variables tab and run analysis
    await frequenciesPage.selectVariablesTab();
    await frequenciesPage.runAnalysis();
    
    // Wait for comprehensive results
    await frequenciesPage.verifyResultsGenerated();
    
    // Verify all components are generated
    await frequenciesPage.verifyFrequencyTableExists();
    await frequenciesPage.verifyStatisticsTableExists();
    await frequenciesPage.verifyChartExists();
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Comprehensive frequencies analysis test time: ${totalTestTime}ms`);
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should validate performance thresholds for frequencies analysis', async ({ page }) => {
    const testStartTime = Date.now();
    
    await frequenciesPage.loadExampleDataset();
    await frequenciesPage.navigateToFrequencies();
    
    // Quick analysis for performance test
    const analysisStartTime = Date.now();
    await frequenciesPage.selectVariable('age');
    await frequenciesPage.enableFrequencyTables();
    await frequenciesPage.runAnalysis();
    await frequenciesPage.verifyResultsGenerated();
    
    const analysisExecutionTime = Date.now() - analysisStartTime;
    console.log(`Frequencies analysis execution time: ${analysisExecutionTime}ms`);
    
    // Validate performance metrics
    const endMetrics = await collectBrowserMetrics(page);
    const memoryUsage = endMetrics.memory.usedJSHeapSize / 1024 / 1024;
    
    console.log(`Analysis Memory Usage: ${memoryUsage.toFixed(2)}MB`);
    console.log(`DOM Nodes: ${endMetrics.dom.nodeCount}`);
    
    // Performance assertions
    expect(analysisExecutionTime).toBeLessThan(10000); // Should complete within 10 seconds
    expect(memoryUsage).toBeLessThan(500); // Memory should be under 500MB
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should handle error conditions gracefully', async ({ page }) => {
    await frequenciesPage.loadExampleDataset();
    await frequenciesPage.navigateToFrequencies();
    
    // Try to run analysis without selecting variables
    await frequenciesPage.runAnalysis();
    await page.waitForTimeout(1000);
    
    // Dialog should remain open (OK button should be disabled)
    await frequenciesPage.verifyDialogVisible();
    await frequenciesPage.verifyOkButtonDisabled();
    
    // Test recovery - select variable and retry
    await frequenciesPage.selectVariable('age');
    await frequenciesPage.runAnalysis();
    await frequenciesPage.verifyResultsGenerated();
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should support tab navigation and maintain state', async ({ page }) => {
    await frequenciesPage.loadExampleDataset();
    await frequenciesPage.navigateToFrequencies();
    
    // Select variable in Variables tab
    await frequenciesPage.selectVariable('age');
    
    // Switch to Statistics tab and configure
    await frequenciesPage.selectStatisticsTab();
    await frequenciesPage.enableStatistics();
    await frequenciesPage.enableMean();
    
    // Switch to Charts tab and configure
    await frequenciesPage.selectChartsTab();
    await frequenciesPage.enableCharts();
    await frequenciesPage.enableBarChart();
    
    // Return to Variables tab - selection should be maintained
    await frequenciesPage.selectVariablesTab();
    await expect(page.getByTestId('selected-variables')).toContainText('age');
    
    // OK button should still be enabled
    await frequenciesPage.verifyOkButtonEnabled();
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should support cancel and reset functionality', async ({ page }) => {
    await frequenciesPage.loadExampleDataset();
    await frequenciesPage.navigateToFrequencies();
    
    // Configure analysis
    await frequenciesPage.selectVariable('age');
    await frequenciesPage.enableFrequencyTables();
    
    // Test cancel functionality
    await frequenciesPage.cancelAnalysis();
    await frequenciesPage.verifyDialogClosed();
    
    // Reopen and test reset functionality
    await frequenciesPage.navigateToFrequencies();
    await frequenciesPage.selectVariable('age');
    await frequenciesPage.resetForm();
    
    // After reset, OK button should be disabled
    await frequenciesPage.verifyOkButtonDisabled();
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should handle multiple variable selection', async ({ page }) => {
    await frequenciesPage.loadExampleDataset();
    await frequenciesPage.navigateToFrequencies();
    
    // Select multiple variables
    await frequenciesPage.selectVariable('age');
    await frequenciesPage.selectVariable('gender');
    
    // Verify both variables are selected
    await expect(page.getByTestId('selected-variables')).toContainText('age');
    await expect(page.getByTestId('selected-variables')).toContainText('gender');
    
    // Run analysis
    await frequenciesPage.runAnalysis();
    await frequenciesPage.verifyResultsGenerated();
    
    // Should generate frequency tables for both variables
    await expect(page.locator('text=age')).toBeVisible();
    await expect(page.locator('text=gender')).toBeVisible();
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });
});