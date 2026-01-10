import { test, expect } from '@playwright/test';
import { DescriptiveTestSetup } from './test-setup';

/**
 * Frequencies Analysis Performance Test
 * Tests complete workflow with performance measurement
 */

test.describe('Frequencies Analysis Performance Test', () => {
  test.beforeEach(async ({ page }) => {
    const setup = new DescriptiveTestSetup(page);
    await setup.setupForDescriptiveTests('frequencies');
  });

  test('should complete full frequencies analysis workflow with performance measurement', async ({ page }) => {
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
    
    console.log('\n=== STARTING FREQUENCIES ANALYSIS TEST ===');
    if (initialMemory) {
      console.log(`Initial Memory Usage: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Verify the frequencies modal is visible
    await expect(page.locator('[data-testid="modal-title"]:has-text("Frequencies")')).toBeVisible();
    
    // Wait for available variables container to load
    await expect(page.locator('[data-testid="available-variables-container"]')).toBeVisible();
    
    // Wait for data to load and verify treegrid is present
    await page.locator('treegrid').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(3000); // Give time for data to load
    
    // Verify that variables are loaded in available list
    const availableVariables = page.locator('[data-testid^="variable-name-available-"]');      
    await expect(availableVariables.first()).toBeVisible({ timeout: 10000 });
    

    
    // === STEP 1: VARIABLE SELECTION ===
    console.log('\n--- Step 1: Variable Selection ---');
    const variableSelectionStart = Date.now();
    
    // Sub-step 1a: Wait for UI components to load
    console.log('1a. Loading variable containers...');
    const uiLoadStart = Date.now();
    await expect(page.locator('[data-testid="available-variables-container"]')).toBeVisible();
    await expect(page.locator('[data-testid^="variable-name-available-"]').first()).toBeVisible();
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
    await expect(page.locator('[data-testid^="variable-name-selected-"]').filter({ hasText: 'age' })).toBeVisible();
    const ageSelectionTime = Date.now() - ageSelectionStart;
    console.log(`    Age Selection Time: ${ageSelectionTime}ms`);
    
    // Sub-step 1c: Select second variable (gender)
    console.log('1c. Selecting gender variable...');
    const genderSelectionStart = Date.now();
    const genderVariable = page.locator('[data-testid^="variable-item-available-"]').filter({ hasText: 'gender' }).first();
    await expect(genderVariable).toBeVisible();
    await genderVariable.dblclick();
    
    // Verify gender variable moved to selected list
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid^="variable-name-selected-"]').filter({ hasText: 'gender' })).toBeVisible();
    const genderSelectionTime = Date.now() - genderSelectionStart;
    console.log(`    Gender Selection Time: ${genderSelectionTime}ms`);
    
    const variableSelectionTime = Date.now() - variableSelectionStart;
    const memoryAfterVariables = await getMemoryUsage();
    
    console.log(`--- Variable Selection Summary ---`);
    console.log(`Total Time: ${variableSelectionTime}ms`);
    if (memoryAfterVariables) {
      console.log(`Memory Usage: ${(memoryAfterVariables.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      if (initialMemory) {
        const memoryIncrease = (memoryAfterVariables.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
        console.log(`Memory Increase: ${memoryIncrease >= 0 ? '+' : ''}${memoryIncrease.toFixed(2)} MB`);
      }
    }
    
    // === STEP 2: STATISTICS CONFIGURATION ===
    console.log('\n--- Step 2: Statistics Configuration ---');
    const statisticsConfigStart = Date.now();
    
    // Sub-step 2a: Navigate to Statistics tab
    console.log('2a. Opening Statistics tab...');
    const tabSwitchStart = Date.now();
    await page.locator('text=Statistics').click();
    await page.waitForTimeout(1000);
    const tabSwitchTime = Date.now() - tabSwitchStart;
    console.log(`    Tab Switch Time: ${tabSwitchTime}ms`);
    
    // Sub-step 2b: Configure Central Tendency statistics
    console.log('2b. Configuring Central Tendency statistics...');
    const centralTendencyStart = Date.now();
    await page.locator('[data-testid="frequencies-mean"]').check();
    await page.locator('[data-testid="frequencies-median"]').check();
    await page.locator('[data-testid="frequencies-mode"]').check();
    await page.locator('[data-testid="frequencies-sum"]').check();
    const centralTendencyTime = Date.now() - centralTendencyStart;
    console.log(`    Central Tendency Time: ${centralTendencyTime}ms`);
    
    // Sub-step 2c: Configure Dispersion statistics
    console.log('2c. Configuring Dispersion statistics...');
    const dispersionStart = Date.now();
    await page.locator('[data-testid="frequencies-stddev"]').check();
    await page.locator('[data-testid="frequencies-variance"]').check();
    await page.locator('[data-testid="frequencies-range"]').check();
    await page.locator('[data-testid="frequencies-minimum"]').check();
    await page.locator('[data-testid="frequencies-maximum"]').check();
    await page.locator('[data-testid="frequencies-semean"]').check();
    const dispersionTime = Date.now() - dispersionStart;
    console.log(`    Dispersion Time: ${dispersionTime}ms`);
    
    // Sub-step 2d: Configure Distribution statistics
    console.log('2d. Configuring Distribution statistics...');
    const distributionStart = Date.now();
    await page.locator('[data-testid="frequencies-skewness"]').check();
    await page.locator('[data-testid="frequencies-kurtosis"]').check();
    const distributionTime = Date.now() - distributionStart;
    console.log(`    Distribution Time: ${distributionTime}ms`);
    
    // Sub-step 2e: Configure additional options
    console.log('2e. Configuring additional options...');
    const additionalStart = Date.now();
    const quartilesCheckbox = page.locator('#quartiles');
    if (await quartilesCheckbox.isVisible()) {
      await quartilesCheckbox.check();
    }
    const additionalTime = Date.now() - additionalStart;
    console.log(`    Additional Options Time: ${additionalTime}ms`);
    
    const statisticsConfigTime = Date.now() - statisticsConfigStart;
    const memoryAfterStats = await getMemoryUsage();
    
    console.log(`--- Statistics Configuration Summary ---`);
    console.log(`Total Time: ${statisticsConfigTime}ms`);
    if (memoryAfterStats) {
      console.log(`Memory Usage: ${(memoryAfterStats.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      if (initialMemory) {
        const memoryIncrease = (memoryAfterStats.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
        console.log(`Memory Increase: ${memoryIncrease >= 0 ? '+' : ''}${memoryIncrease.toFixed(2)} MB`);
      }
    }
    
    // === STEP 3: CHARTS CONFIGURATION ===
    console.log('\n--- Step 3: Charts Configuration ---');
    const chartsConfigStart = Date.now();
    
    // Sub-step 3a: Navigate to Charts tab
    console.log('3a. Opening Charts tab...');
    const chartsTabSwitchStart = Date.now();
    await page.locator('text=Charts').click();
    await page.waitForTimeout(1000);
    const chartsTabSwitchTime = Date.now() - chartsTabSwitchStart;
    console.log(`    Charts Tab Switch Time: ${chartsTabSwitchTime}ms`);
    
    // Sub-step 3b: Configure Histogram
    console.log('3b. Configuring Histogram...');
    const histogramStart = Date.now();
    const histogramCheckbox = page.locator('[data-testid="frequencies-histogram"]');
    if (await histogramCheckbox.isVisible()) {
      await histogramCheckbox.check();
    }
    const histogramTime = Date.now() - histogramStart;
    console.log(`    Histogram Config Time: ${histogramTime}ms`);
    
    // Sub-step 3c: Configure Pie Chart
    console.log('3c. Configuring Pie Chart...');
    const pieChartStart = Date.now();
    const pieChartCheckbox = page.locator('[data-testid="frequencies-pie-chart"]');
    if (await pieChartCheckbox.isVisible()) {
      await pieChartCheckbox.check();
    }
    const pieChartTime = Date.now() - pieChartStart;
    console.log(`    Pie Chart Config Time: ${pieChartTime}ms`);
    
    // Sub-step 3d: Configure Bar Chart
    console.log('3d. Configuring Bar Chart...');
    const barChartStart = Date.now();
    const barChartCheckbox = page.locator('[data-testid="frequencies-bar-chart"]');
    if (await barChartCheckbox.isVisible()) {
      await barChartCheckbox.check();
    }
    const barChartTime = Date.now() - barChartStart;
    console.log(`    Bar Chart Config Time: ${barChartTime}ms`);
    
    const chartsConfigTime = Date.now() - chartsConfigStart;
    const memoryAfterCharts = await getMemoryUsage();
    
    console.log(`--- Charts Configuration Summary ---`);
    console.log(`Total Time: ${chartsConfigTime}ms`);
    if (memoryAfterCharts) {
      console.log(`Memory Usage: ${(memoryAfterCharts.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      if (initialMemory) {
        const memoryIncrease = (memoryAfterCharts.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
        console.log(`Memory Increase: ${memoryIncrease >= 0 ? '+' : ''}${memoryIncrease.toFixed(2)} MB`);
      }
    }
    
    // === STEP 4: ANALYSIS EXECUTION ===
    console.log('\n--- Step 4: Analysis Execution ---');
    const analysisStart = Date.now();
    
    // Sub-step 4a: Initiate analysis
    console.log('4a. Initiating analysis...');
    const initiationStart = Date.now();
    const okButton = page.locator('[data-testid="frequencies-ok-button"]');
    await expect(okButton).toBeEnabled();
    await okButton.click();
    const initiationTime = Date.now() - initiationStart;
    console.log(`    Analysis Initiation Time: ${initiationTime}ms`);
    
    // Sub-step 4b: Wait for processing state
    console.log('4b. Waiting for processing state...');
    const processingStart = Date.now();
    await expect(page.locator('[data-testid="frequencies-ok-button"]')).toContainText('Calculating...');
    const processingTime = Date.now() - processingStart;
    console.log(`    Processing State Time: ${processingTime}ms`);
    
    // Sub-step 4c: Wait for computation and navigation
    console.log('4c. Waiting for computation and navigation...');
    const computationStart = Date.now();
    await page.waitForURL('**/dashboard/result**', { timeout: 15000 });
    const computationTime = Date.now() - computationStart;
    console.log(`    Computation & Navigation Time: ${computationTime}ms`);
    
    // Sub-step 4d: Verify result page
    console.log('4d. Verifying result page...');
    const verificationStart = Date.now();
    await expect(page).toHaveURL(/\/dashboard\/result/);
    await expect(page.locator('[data-testid="result-content"]')).toBeVisible({ timeout: 10000 });
    const verificationTime = Date.now() - verificationStart;
    console.log(`    Result Verification Time: ${verificationTime}ms`);
    
    const analysisTime = Date.now() - analysisStart;
    const memoryAfterAnalysis = await getMemoryUsage();
    
    console.log(`--- Analysis Execution Summary ---`);
    console.log(`Total Time: ${analysisTime}ms`);
    if (memoryAfterAnalysis) {
      console.log(`Memory Usage: ${(memoryAfterAnalysis.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      if (initialMemory) {
        const memoryIncrease = (memoryAfterAnalysis.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
        console.log(`Memory Increase: ${memoryIncrease >= 0 ? '+' : ''}${memoryIncrease.toFixed(2)} MB`);
      }
    }
    
    // === FINAL PERFORMANCE SUMMARY ===
    const totalTime = Date.now() - startTime;
    const finalMemory = await getMemoryUsage();
    
    console.log(`\n\n=== COMPREHENSIVE PERFORMANCE SUMMARY ===`);
    console.log(`\n📊 TIMING BREAKDOWN:`);
    console.log(`├─ Variable Selection: ${variableSelectionTime}ms`);
    console.log(`├─ Statistics Config: ${statisticsConfigTime}ms`);
    console.log(`├─ Charts Config: ${chartsConfigTime}ms`);
    console.log(`├─ Analysis Execution: ${analysisTime}ms`);
    console.log(`└─ Total Workflow Time: ${totalTime}ms`);
    
    console.log(`\n💾 MEMORY USAGE:`);
    if (initialMemory && finalMemory) {
      console.log(`├─ Initial Memory: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`├─ Final Memory: ${(finalMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      const totalMemoryIncrease = (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
      console.log(`├─ Total Memory Increase: ${totalMemoryIncrease >= 0 ? '+' : ''}${totalMemoryIncrease.toFixed(2)} MB`);
      const memoryEfficiency = ((totalMemoryIncrease / (finalMemory.usedJSHeapSize / 1024 / 1024)) * 100);
      console.log(`└─ Memory Efficiency: ${memoryEfficiency.toFixed(1)}% increase`);
    } else {
      console.log(`└─ Memory monitoring not available in this browser`);
    }
    
    console.log(`\n⚡ PERFORMANCE METRICS:`);
    console.log(`├─ Average Step Time: ${(totalTime / 4).toFixed(0)}ms`);
    console.log(`├─ Fastest Step: ${Math.min(variableSelectionTime, statisticsConfigTime, chartsConfigTime, analysisTime)}ms`);
    console.log(`├─ Slowest Step: ${Math.max(variableSelectionTime, statisticsConfigTime, chartsConfigTime, analysisTime)}ms`);
    console.log(`└─ Workflow Efficiency: ${((totalTime / 30000) * 100).toFixed(1)}% of max allowed time`);
    
    console.log(`\n===============================================\n`);
    
    // Enhanced performance assertions
    expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
    expect(variableSelectionTime).toBeLessThan(5000); // Variable selection should be fast
    expect(statisticsConfigTime).toBeLessThan(8000); // Statistics config should be reasonable
    expect(chartsConfigTime).toBeLessThan(5000); // Charts config should be fast
    expect(analysisTime).toBeLessThan(20000); // Analysis should complete within 20 seconds
    
    // Memory assertions (if available)
    if (initialMemory && finalMemory) {
      const memoryIncrease = (finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(250); // Memory increase should be reasonable (< 250MB)
      expect(finalMemory.usedJSHeapSize / 1024 / 1024).toBeLessThan(1000); // Total memory should be < 1GB
    }
  });
});
