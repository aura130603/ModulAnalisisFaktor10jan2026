import { test, expect } from '@playwright/test';
import { DescriptiveTestSetup } from './test-setup';

/**
 * Descriptive Analysis Performance Test
 * Tests complete workflow with performance measurement
 */

test.describe('Descriptive Analysis Performance Test', () => {
  test.beforeEach(async ({ page }) => {
    const setup = new DescriptiveTestSetup(page);
    await setup.setupForDescriptiveTests('descriptive');
  });

  test('should complete full descriptive analysis workflow with performance measurement', async ({ page }) => {
    // Helper function to get memory usage
    const getMemoryUsage = async () => {
      const memInfo = await page.evaluate(() => {
        if ('memory' in performance) {
          return {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      return memInfo;
    };

    // Start performance measurement
    const startTime = Date.now();
    const initialMemory = await getMemoryUsage();
    
    console.log('\n=== STARTING DESCRIPTIVE ANALYSIS TEST ===');
    if (initialMemory) {
      console.log(`Initial Memory Usage: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Verify the descriptive modal is visible
    await expect(page.locator('[data-testid="modal-title"]:has-text("Descriptives")')).toBeVisible();
    
    // Wait for available variables container to load
    await expect(page.locator('[data-testid="available-variables-container"]')).toBeVisible();
    
    // Wait for data to load - check for any variable in the available list
    await page.waitForTimeout(2000); // Give time for data to load
    
    // Verify that variables are loaded in available list
    const availableVariables = page.locator('[data-testid^="variable-item-available-"]');
    await expect(availableVariables.first()).toBeVisible({ timeout: 5000 });
    
    // === STEP 1: VARIABLE SELECTION ===
    console.log('\n--- Step 1: Variable Selection ---');
    const variableSelectionStart = Date.now();
    
    // Sub-step 1a: Wait for UI components to load
    console.log('1a. Loading variable containers...');
    const uiLoadStart = Date.now();
    await expect(page.locator('[data-testid="available-variables-container"]')).toBeVisible();
    await expect(page.locator('[data-testid^="variable-item-available-"]').first()).toBeVisible();
    const uiLoadTime = Date.now() - uiLoadStart;
    console.log(`    UI Load Time: ${uiLoadTime}ms`);
    
    // Sub-step 1b: Select first variable (age)
    console.log('1b. Selecting age variable...');
    const ageSelectionStart = Date.now();
    const ageVariable = page.locator('[data-testid^="variable-item-available-"]').filter({ hasText: 'age' }).first();
    await expect(ageVariable).toBeVisible();
    await ageVariable.dblclick();
    
    // Wait and verify age variable moved to selected list
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="selected-variables-container"]')).toBeVisible();
    await expect(page.locator('[data-testid^="variable-item-selected-"]').filter({ hasText: 'age' })).toBeVisible();
    const ageSelectionTime = Date.now() - ageSelectionStart;
    console.log(`    Age Selection Time: ${ageSelectionTime}ms`);
    
    // Sub-step 1c: Select second variable (income)
    console.log('1c. Selecting income variable...');
    const incomeSelectionStart = Date.now();
    const incomeVariable = page.locator('[data-testid^="variable-item-available-"]').filter({ hasText: 'income' }).first();
    await expect(incomeVariable).toBeVisible();
    await incomeVariable.dblclick();
    
    // Verify income variable moved to selected list
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid^="variable-item-selected-"]').filter({ hasText: 'income' })).toBeVisible();
    const incomeSelectionTime = Date.now() - incomeSelectionStart;
    console.log(`    Income Selection Time: ${incomeSelectionTime}ms`);
    
    const variableSelectionTime = Date.now() - variableSelectionStart;
    const memoryAfterVariables = await getMemoryUsage();
    
    console.log(`--- Variable Selection Summary ---`);
    console.log(`Total Time: ${variableSelectionTime}ms`);
    if (memoryAfterVariables && initialMemory) {
      const memoryIncrease = (memoryAfterVariables.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
      console.log(`Memory Usage: ${(memoryAfterVariables.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB (+${memoryIncrease.toFixed(2)} MB increase)`);
    }
    
    // === STEP 2: STATISTICS CONFIGURATION ===
    console.log('\n--- Step 2: Statistics Configuration ---');
    const statisticsConfigStart = Date.now();
    
    // Sub-step 2a: Navigate to Statistics tab
    console.log('2a. Switching to Statistics tab...');
    const tabSwitchStart = Date.now();
    const statisticsTab = page.locator('[data-testid="descriptive-statistics-tab"]');
    await expect(statisticsTab).toBeVisible();
    await statisticsTab.click();
    
    // Wait for statistics tab content to load
    await expect(page.locator('#descriptive-central-tendency')).toBeVisible();
    const tabSwitchTime = Date.now() - tabSwitchStart;
    console.log(`    Statistics Tab Switch Time: ${tabSwitchTime}ms`);
    
    // Sub-step 2b: Configure Central Tendency statistics
    console.log('2b. Configuring Central Tendency...');
    const centralTendencyStart = Date.now();
    
    // Enable Mean
    const meanCheckbox = page.locator('[data-testid="statistics-mean"]');
    await expect(meanCheckbox).toBeVisible();
    if (!(await meanCheckbox.isChecked())) {
      await meanCheckbox.click();
    }
    
    // Enable Median
    const medianCheckbox = page.locator('[data-testid="statistics-median"]');
    await expect(medianCheckbox).toBeVisible();
    if (!(await medianCheckbox.isChecked())) {
      await medianCheckbox.click();
    }
    
    const centralTendencyTime = Date.now() - centralTendencyStart;
    console.log(`    Central Tendency Time: ${centralTendencyTime}ms`);
    
    // Sub-step 2c: Configure Dispersion statistics
    console.log('2c. Configuring Dispersion...');
    const dispersionStart = Date.now();
    
    // Enable Standard Deviation
    const stdDevCheckbox = page.locator('[data-testid="statistics-stddev"]');
    await expect(stdDevCheckbox).toBeVisible();
    if (!(await stdDevCheckbox.isChecked())) {
      await stdDevCheckbox.click();
    }
    
    // Enable Minimum
    const minimumCheckbox = page.locator('[data-testid="statistics-minimum"]');
    await expect(minimumCheckbox).toBeVisible();
    if (!(await minimumCheckbox.isChecked())) {
      await minimumCheckbox.click();
    }
    
    // Enable Maximum
    const maximumCheckbox = page.locator('[data-testid="statistics-maximum"]');
    await expect(maximumCheckbox).toBeVisible();
    if (!(await maximumCheckbox.isChecked())) {
      await maximumCheckbox.click();
    }
    
    const dispersionTime = Date.now() - dispersionStart;
    console.log(`    Dispersion Time: ${dispersionTime}ms`);
    
    // Sub-step 2d: Configure Distribution statistics
    console.log('2d. Configuring Distribution...');
    const distributionStart = Date.now();
    
    // Enable Skewness
    const skewnessCheckbox = page.locator('[data-testid="statistics-skewness"]');
    await expect(skewnessCheckbox).toBeVisible();
    if (!(await skewnessCheckbox.isChecked())) {
      await skewnessCheckbox.click();
    }
    
    // Enable Kurtosis
    const kurtosisCheckbox = page.locator('[data-testid="statistics-kurtosis"]');
    await expect(kurtosisCheckbox).toBeVisible();
    if (!(await kurtosisCheckbox.isChecked())) {
      await kurtosisCheckbox.click();
    }
    
    const distributionTime = Date.now() - distributionStart;
    console.log(`    Distribution Time: ${distributionTime}ms`);
    
    const statisticsConfigTime = Date.now() - statisticsConfigStart;
    const memoryAfterStatistics = await getMemoryUsage();
    
    console.log(`--- Statistics Configuration Summary ---`);
    console.log(`Total Time: ${statisticsConfigTime}ms`);
    if (memoryAfterStatistics && initialMemory) {
      const memoryIncrease = (memoryAfterStatistics.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
      console.log(`Memory Usage: ${(memoryAfterStatistics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB (+${memoryIncrease.toFixed(2)} MB increase)`);
    }
    
    // === STEP 3: ANALYSIS EXECUTION ===
    console.log('\n--- Step 3: Analysis Execution ---');
    const analysisExecutionStart = Date.now();
    
    // Sub-step 3a: Initiate analysis
    console.log('3a. Initiating analysis...');
    const analysisInitiationStart = Date.now();
    const okButton = page.locator('[data-testid="descriptive-ok-button"]');
    await expect(okButton).toBeVisible();
    await expect(okButton).toBeEnabled();
    await okButton.click();
    const analysisInitiationTime = Date.now() - analysisInitiationStart;
    console.log(`    Analysis Initiation Time: ${analysisInitiationTime}ms`);
    
    // Sub-step 3b: Wait for processing state
    console.log('3b. Waiting for processing state...');
    const processingStateStart = Date.now();
    await expect(okButton).toContainText('Processing...');
    const processingStateTime = Date.now() - processingStateStart;
    console.log(`    Processing State Time: ${processingStateTime}ms`);
    
    // Sub-step 3c: Wait for computation and navigation
    console.log('3c. Waiting for computation and navigation...');
    const computationStart = Date.now();
    await page.waitForLoadState('networkidle');
    
    // Wait for navigation to results page
    await expect(page).toHaveURL(/.*\/dashboard\/result.*/);
    const computationTime = Date.now() - computationStart;
    console.log(`    Computation & Navigation Time: ${computationTime}ms`);
    
    // Sub-step 3d: Verify result page
    console.log('3d. Verifying result page...');
    const resultVerificationStart = Date.now();
    await expect(page.locator('[data-testid="results-content"]')).toBeVisible();
    const resultVerificationTime = Date.now() - resultVerificationStart;
    console.log(`    Result Verification Time: ${resultVerificationTime}ms`);
    
    const analysisExecutionTime = Date.now() - analysisExecutionStart;
    const memoryAfterAnalysis = await getMemoryUsage();
    
    console.log(`--- Analysis Execution Summary ---`);
    console.log(`Total Time: ${analysisExecutionTime}ms`);
    if (memoryAfterAnalysis && initialMemory) {
      const memoryIncrease = (memoryAfterAnalysis.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
      console.log(`Memory Usage: ${(memoryAfterAnalysis.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB (+${memoryIncrease.toFixed(2)} MB increase)`);
    }
    
    // === FINAL PERFORMANCE SUMMARY ===
    const totalTime = Date.now() - startTime;
    const finalMemory = await getMemoryUsage();
    
    console.log('\n=== DESCRIPTIVE ANALYSIS PERFORMANCE SUMMARY ===');
    
    // Detailed timing breakdown
    const stepTimes = {
      'Variable Selection': variableSelectionTime,
      'Statistics Configuration': statisticsConfigTime,
      'Analysis Execution': analysisExecutionTime
    };
    
    console.log('\n--- Detailed Timing Breakdown ---');
    Object.entries(stepTimes).forEach(([step, time]) => {
      const percentage = ((time / totalTime) * 100).toFixed(1);
      console.log(`${step}: ${(time / 1000).toFixed(3)}s (${percentage}%)`);
    });
    
    console.log('\n--- Sub-step Timing Details ---');
    console.log(`Variable Selection:`);
    console.log(`  - UI Load: ${uiLoadTime}ms`);
    console.log(`  - Age Selection: ${ageSelectionTime}ms`);
    console.log(`  - Income Selection: ${incomeSelectionTime}ms`);
    
    console.log(`Statistics Configuration:`);
    console.log(`  - Tab Switch: ${tabSwitchTime}ms`);
    console.log(`  - Central Tendency: ${centralTendencyTime}ms`);
    console.log(`  - Dispersion: ${dispersionTime}ms`);
    console.log(`  - Distribution: ${distributionTime}ms`);
    
    console.log(`Analysis Execution:`);
    console.log(`  - Analysis Initiation: ${analysisInitiationTime}ms`);
    console.log(`  - Processing State: ${processingStateTime}ms`);
    console.log(`  - Computation & Navigation: ${computationTime}ms`);
    console.log(`  - Result Verification: ${resultVerificationTime}ms`);
    
    // Memory usage summary
    if (initialMemory && finalMemory) {
      const totalMemoryIncrease = (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
      console.log('\n--- Memory Usage Summary ---');
      console.log(`Initial Memory: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Final Memory: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Total Memory Increase: +${totalMemoryIncrease.toFixed(2)} MB`);
    }
    
    // Performance metrics
    const stepTimesArray = Object.values(stepTimes);
    const averageStepTime = stepTimesArray.reduce((a, b) => a + b, 0) / stepTimesArray.length;
    const fastestStep = Math.min(...stepTimesArray);
    const slowestStep = Math.max(...stepTimesArray);
    
    console.log('\n--- Performance Metrics ---');
    console.log(`Total Workflow Time: ${(totalTime / 1000).toFixed(3)}s`);
    console.log(`Average Step Time: ${(averageStepTime / 1000).toFixed(3)}s`);
    console.log(`Fastest Step: ${(fastestStep / 1000).toFixed(3)}s`);
    console.log(`Slowest Step: ${(slowestStep / 1000).toFixed(3)}s`);
    console.log(`Workflow Efficiency: ${((averageStepTime / slowestStep) * 100).toFixed(0)}%`);
    
    console.log('\n=== DESCRIPTIVE ANALYSIS TEST COMPLETED ===\n');
    
    // Performance assertions
    expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
    expect(variableSelectionTime).toBeLessThan(10000); // Variable selection should be under 10s
    expect(statisticsConfigTime).toBeLessThan(8000); // Statistics config should be under 8s
    expect(analysisExecutionTime).toBeLessThan(15000); // Analysis execution should be under 15s
    
    // Memory assertions
    if (finalMemory && initialMemory) {
      const memoryIncrease = (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(250); // Memory increase should be less than 250MB
      expect(finalMemory.usedJSHeapSize / 1024 / 1024).toBeLessThan(1000); // Total memory should be less than 1GB
    }
  });
});
