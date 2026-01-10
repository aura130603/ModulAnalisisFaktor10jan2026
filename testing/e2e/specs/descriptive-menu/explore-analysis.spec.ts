import { test, expect } from '@playwright/test';
import { DescriptiveTestSetup } from './test-setup';

/**
 * Comprehensive Explore Analysis Tests
 * Tests the full functionality of the Explore analysis modal
 */

test.describe('Explore Analysis Tests', () => {
  test.beforeEach(async ({ page }) => {
    const setup = new DescriptiveTestSetup(page);
    await setup.setupForDescriptiveTests('explore');
  });

  test('should display explore modal with correct structure', async ({ page }) => {
    await expect(page.locator('[data-testid="explore-dialog"]')).toBeVisible();
    await expect(page.locator('text=Explore')).toBeVisible();
    
    // Check all three tabs are present
    await expect(page.locator('text=Variables')).toBeVisible();
    await expect(page.locator('text=Statistics')).toBeVisible();
    await expect(page.locator('text=Plots')).toBeVisible();
  });

  test('should handle variable selection workflow', async ({ page }) => {
    // Variables tab should be active by default
    await expect(page.locator('text=Available Variables')).toBeVisible();
    await expect(page.locator('text=Dependent Variables')).toBeVisible();
    await expect(page.locator('text=Factor Variables')).toBeVisible();
    await expect(page.locator('text=Label Variable')).toBeVisible();
    
    // Test variable selection mechanism
    const availableVariables = page.locator('[data-testid="available-variables"]');
    await expect(availableVariables).toBeVisible();
    
    // Test move buttons
    const moveToDependentButton = page.locator('[data-testid="move-to-dependent"]');
    await expect(moveToDependentButton).toBeVisible();
    
    const moveToFactorButton = page.locator('[data-testid="move-to-factor"]');
    await expect(moveToFactorButton).toBeVisible();
    
    const moveToLabelButton = page.locator('[data-testid="move-to-label"]');
    await expect(moveToLabelButton).toBeVisible();
  });

  test('should handle statistics configuration', async ({ page }) => {
    // Switch to Statistics tab
    await page.locator('text=Statistics').click();
    
    // Check statistics options
    await expect(page.locator('text=Descriptives')).toBeVisible();
    await expect(page.locator('text=M-estimators')).toBeVisible();
    await expect(page.locator('text=Outliers')).toBeVisible();
    await expect(page.locator('text=Percentiles')).toBeVisible();
    
    // Test statistics checkboxes
    const descriptivesCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(descriptivesCheckbox).toBeVisible();
    await expect(descriptivesCheckbox).toBeChecked();
    
    // Test confidence interval input
    const confidenceIntervalInput = page.locator('input[type="number"]').first();
    await expect(confidenceIntervalInput).toBeVisible();
    await confidenceIntervalInput.fill('95');
    await expect(confidenceIntervalInput).toHaveValue('95');
  });

  test('should handle plots configuration', async ({ page }) => {
    // Switch to Plots tab
    await page.locator('text=Plots').click();
    
    // Check plots options
    await expect(page.locator('text=Boxplots')).toBeVisible();
    await expect(page.locator('text=Stem-and-leaf')).toBeVisible();
    await expect(page.locator('text=Histogram')).toBeVisible();
    await expect(page.locator('text=Normality plots')).toBeVisible();
    
    // Test boxplot type selection
    const boxplotOptions = page.locator('input[type="radio"]');
    await expect(boxplotOptions.first()).toBeVisible();
    
    // Test plots checkboxes
    const stemLeafCheckbox = page.locator('text=Stem-and-leaf').locator('..').locator('input[type="checkbox"]');
    await expect(stemLeafCheckbox).toBeVisible();
    
    const histogramCheckbox = page.locator('text=Histogram').locator('..').locator('input[type="checkbox"]');
    await expect(histogramCheckbox).toBeVisible();
  });

  test('should validate required fields before analysis', async ({ page }) => {
    // OK button should be disabled without dependent variables
    const okButton = page.locator('[data-testid="explore-ok-button"]');
    await expect(okButton).toBeDisabled();
    
    // Select dependent variable
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-dependent"]').click();
    
    // Now OK button should be enabled
    await expect(okButton).toBeEnabled();
  });

  test('should handle tab switching workflow', async ({ page }) => {
    // Variables tab active initially
    await expect(page.locator('text=Available Variables')).toBeVisible();
    
    // Switch to Statistics tab
    await page.locator('text=Statistics').click();
    await expect(page.locator('text=Descriptives')).toBeVisible();
    
    // Switch to Plots tab
    await page.locator('text=Plots').click();
    await expect(page.locator('text=Boxplots')).toBeVisible();
    
    // Switch back to Variables tab
    await page.locator('text=Variables').click();
    await expect(page.locator('text=Available Variables')).toBeVisible();
  });

  test('should handle analysis workflow', async ({ page }) => {
    // Select dependent variable
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-dependent"]').click();
    
    // Configure statistics
    await page.locator('text=Statistics').click();
    await page.locator('input[type="number"]').first().fill('99');
    
    // Configure plots
    await page.locator('text=Plots').click();
    await page.locator('input[type="checkbox"]').nth(1).check(); // Stem-and-leaf
    
    // Run analysis
    const okButton = page.locator('[data-testid="explore-ok-button"]');
    await okButton.click();
    
    // Check processing state
    await expect(page.locator('[data-testid="explore-ok-button"]')).toContainText('Processing...');
  });

  test('should handle reset functionality', async ({ page }) => {
    // Make selections
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-dependent"]').click();
    
    await page.locator('text=Statistics').click();
    await page.locator('input[type="number"]').first().fill('90');
    
    await page.locator('text=Plots').click();
    await page.locator('input[type="checkbox"]').nth(2).check(); // Histogram
    
    // Reset selections
    await page.locator('[data-testid="explore-reset-button"]').click();
    
    // Verify reset worked
    const okButton = page.locator('[data-testid="explore-ok-button"]');
    await expect(okButton).toBeDisabled();
  });

  test('should handle cancel functionality', async ({ page }) => {
    await page.locator('[data-testid="explore-cancel-button"]').click();
    
    // Modal should close
    await expect(page.locator('[data-testid="explore-dialog"]')).not.toBeVisible();
  });

  test('should display help tour functionality', async ({ page }) => {
    const helpButton = page.locator('[data-testid="explore-help-button"]');
    await expect(helpButton).toBeVisible();
    
    // Start tour
    await helpButton.click();
    
    // Tour should be active
    await expect(page.locator('[data-testid="tour-popup"]')).toBeVisible();
  });

  test('should handle boxplot type selection', async ({ page }) => {
    await page.locator('text=Plots').click();
    
    // Test boxplot type options
    const noneRadio = page.locator('input[type="radio"][value="none"]');
    await expect(noneRadio).toBeVisible();
    
    const factorsRadio = page.locator('input[type="radio"][value="factors"]');
    await expect(factorsRadio).toBeVisible();
    
    const dependentsRadio = page.locator('input[type="radio"][value="dependents"]');
    await expect(dependentsRadio).toBeVisible();
    
    // Test selection
    await factorsRadio.check();
    await expect(factorsRadio).toBeChecked();
  });

  test('should handle factor variable selection', async ({ page }) => {
    // Select dependent variable first
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-dependent"]').click();
    
    // Select factor variable
    await page.locator('[data-testid="available-variables"] button').nth(1).click();
    await page.locator('[data-testid="move-to-factor"]').click();
    
    // Factor variable should be selected
    const factorVariables = page.locator('[data-testid="factor-variables"]');
    await expect(factorVariables).toBeVisible();
  });

  test('should handle label variable selection', async ({ page }) => {
    // Select dependent variable
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-dependent"]').click();
    
    // Select label variable
    await page.locator('[data-testid="available-variables"] button').nth(1).click();
    await page.locator('[data-testid="move-to-label"]').click();
    
    // Label variable should be selected
    const labelVariable = page.locator('[data-testid="label-variable"]');
    await expect(labelVariable).toBeVisible();
  });

  test('should maintain state persistence', async ({ page }) => {
    // Make selections
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-dependent"]').click();
    
    await page.locator('text=Statistics').click();
    await page.locator('input[type="number"]').first().fill('95');
    
    await page.locator('text=Plots').click();
    await page.locator('input[type="checkbox"]').nth(1).check(); // Stem-and-leaf
    
    // Close modal
    await page.locator('[data-testid="explore-cancel-button"]').click();
    
    // Reopen modal
    await page.locator('[data-testid="analysis-menu"]').click();
    await page.locator('[data-testid="explore"]').click();
    
    // State should be restored
    const okButton = page.locator('[data-testid="explore-ok-button"]');
    await expect(okButton).toBeEnabled();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Check for error messages
    const errorMessage = page.locator('[data-testid="explore-error-message"]');
    
    // If no variables available, should show appropriate message
    const availableVariables = page.locator('[data-testid="available-variables"]');
    const hasVariables = await availableVariables.locator('button').count() > 0;
    
    if (!hasVariables) {
      await expect(page.locator('text=No variables available')).toBeVisible();
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Test keyboard shortcuts
    await page.keyboard.press('Escape');
    
    // Modal should handle keyboard events appropriately
    await expect(page.locator('[data-testid="explore-dialog"]')).toBeVisible();
  });

  test('should display appropriate tooltips', async ({ page }) => {
    const helpButton = page.locator('[data-testid="explore-help-button"]');
    
    // Hover over help button
    await helpButton.hover();
    
    // Tooltip should appear
    await expect(page.locator('text=Start feature tour')).toBeVisible();
  });

  test('should handle loading states appropriately', async ({ page }) => {
    // Check for loading indicators
    const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    
    // Variables should load
    await expect(page.locator('[data-testid="available-variables"]')).not.toContainText('Loading...');
  });

  test('should validate statistics options combinations', async ({ page }) => {
    await page.locator('text=Statistics').click();
    
    // Test enabling/disabling statistics options
    const descriptivesCheckbox = page.locator('text=Descriptives').locator('..').locator('input[type="checkbox"]');
    const mEstimatorsCheckbox = page.locator('text=M-estimators').locator('..').locator('input[type="checkbox"]');
    
    // Test toggling options
    await mEstimatorsCheckbox.check();
    await expect(mEstimatorsCheckbox).toBeChecked();
    
    await descriptivesCheckbox.uncheck();
    await expect(descriptivesCheckbox).not.toBeChecked();
    
    // Test confidence interval validation
    const confidenceIntervalInput = page.locator('input[type="number"]').first();
    await confidenceIntervalInput.fill('50');
    await expect(confidenceIntervalInput).toHaveValue('50');
    
    await confidenceIntervalInput.fill('99');
    await expect(confidenceIntervalInput).toHaveValue('99');
  });

  test('should handle plots options combinations', async ({ page }) => {
    await page.locator('text=Plots').click();
    
    // Test enabling/disabling plots options
    const stemLeafCheckbox = page.locator('text=Stem-and-leaf').locator('..').locator('input[type="checkbox"]');
    const histogramCheckbox = page.locator('text=Histogram').locator('..').locator('input[type="checkbox"]');
    const normalityCheckbox = page.locator('text=Normality plots').locator('..').locator('input[type="checkbox"]');
    
    // Test toggling plots options
    await stemLeafCheckbox.check();
    await expect(stemLeafCheckbox).toBeChecked();
    
    await histogramCheckbox.check();
    await expect(histogramCheckbox).toBeChecked();
    
    await normalityCheckbox.check();
    await expect(normalityCheckbox).toBeChecked();
  });
});
