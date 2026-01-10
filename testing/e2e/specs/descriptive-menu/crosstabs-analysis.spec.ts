import { test, expect } from '@playwright/test';
import { DescriptiveTestSetup } from './test-setup';

/**
 * Comprehensive Crosstabs Analysis Tests
 * Tests the full functionality of the Crosstabs analysis modal
 */

test.describe('Crosstabs Analysis Tests', () => {
  test.beforeEach(async ({ page }) => {
    const setup = new DescriptiveTestSetup(page);
    await setup.setupForDescriptiveTests('crosstabs');
  });

  test('should display crosstabs modal with correct structure', async ({ page }) => {
    await expect(page.locator('[data-testid="crosstabs-dialog-container"]')).toBeVisible();
    await expect(page.locator('text=Crosstabs')).toBeVisible();
    
    // Check both tabs are present
    await expect(page.locator('text=Variables')).toBeVisible();
    await expect(page.locator('text=Cells')).toBeVisible();
  });

  test('should handle variable selection workflow', async ({ page }) => {
    // Variables tab should be active by default
    await expect(page.locator('text=Available Variables')).toBeVisible();
    await expect(page.locator('text=Row Variables')).toBeVisible();
    await expect(page.locator('text=Column Variables')).toBeVisible();
    
    // Test variable selection mechanism
    const availableVariables = page.locator('[data-testid="available-variables"]');
    await expect(availableVariables).toBeVisible();
    
    // Test move buttons for row variables
    const moveToRowButton = page.locator('[data-testid="move-to-row"]');
    await expect(moveToRowButton).toBeVisible();
    
    // Test move buttons for column variables
    const moveToColumnButton = page.locator('[data-testid="move-to-column"]');
    await expect(moveToColumnButton).toBeVisible();
  });

  test('should handle cells configuration', async ({ page }) => {
    // Switch to Cells tab
    await page.locator('text=Cells').click();
    
    // Check cells options
    await expect(page.locator('text=Cell Display')).toBeVisible();
    await expect(page.locator('text=Observed')).toBeVisible();
    await expect(page.locator('text=Expected')).toBeVisible();
    await expect(page.locator('text=Row Percentages')).toBeVisible();
    await expect(page.locator('text=Column Percentages')).toBeVisible();
    await expect(page.locator('text=Total Percentages')).toBeVisible();
    
    // Test cell checkboxes
    const observedCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(observedCheckbox).toBeVisible();
    await expect(observedCheckbox).toBeChecked();
  });

  test('should handle residuals configuration', async ({ page }) => {
    await page.locator('text=Cells').click();
    
    // Check residuals options
    await expect(page.locator('text=Residuals')).toBeVisible();
    await expect(page.locator('text=Unstandardized')).toBeVisible();
    await expect(page.locator('text=Standardized')).toBeVisible();
    await expect(page.locator('text=Adjusted Standardized')).toBeVisible();
    
    // Test residuals checkboxes
    const residualsCheckboxes = page.locator('text=Residuals').locator('..').locator('input[type="checkbox"]');
    await expect(residualsCheckboxes.first()).toBeVisible();
  });

  test('should handle hide small counts configuration', async ({ page }) => {
    await page.locator('text=Cells').click();
    
    // Check hide small counts option
    await expect(page.locator('text=Hide small counts')).toBeVisible();
    
    // Test hide small counts checkbox
    const hideSmallCountsCheckbox = page.locator('text=Hide small counts').locator('..').locator('input[type="checkbox"]');
    await expect(hideSmallCountsCheckbox).toBeVisible();
    
    // Test threshold input
    const thresholdInput = page.locator('input[type="number"]').first();
    await expect(thresholdInput).toBeVisible();
    await thresholdInput.fill('5');
    await expect(thresholdInput).toHaveValue('5');
  });

  test('should validate required fields before analysis', async ({ page }) => {
    // OK button should be disabled without variables
    const okButton = page.locator('[data-testid="crosstabs-ok-button"]');
    await expect(okButton).toBeDisabled();
    
    // Select row variable
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-row"]').click();
    
    // Still disabled - need both row and column
    await expect(okButton).toBeDisabled();
    
    // Select column variable
    await page.locator('[data-testid="available-variables"] button').nth(1).click();
    await page.locator('[data-testid="move-to-column"]').click();
    
    // Now OK button should be enabled
    await expect(okButton).toBeEnabled();
  });

  test('should handle tab switching workflow', async ({ page }) => {
    // Variables tab active initially
    await expect(page.locator('text=Available Variables')).toBeVisible();
    
    // Switch to Cells tab
    await page.locator('text=Cells').click();
    await expect(page.locator('text=Cell Display')).toBeVisible();
    
    // Switch back to Variables tab
    await page.locator('text=Variables').click();
    await expect(page.locator('text=Available Variables')).toBeVisible();
  });

  test('should handle analysis workflow', async ({ page }) => {
    // Select row variable
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-row"]').click();
    
    // Select column variable
    await page.locator('[data-testid="available-variables"] button').nth(1).click();
    await page.locator('[data-testid="move-to-column"]').click();
    
    // Configure cells
    await page.locator('text=Cells').click();
    await page.locator('input[type="checkbox"]').nth(1).check(); // Expected
    
    // Run analysis
    const okButton = page.locator('[data-testid="crosstabs-ok-button"]');
    await okButton.click();
    
    // Check processing state
    await expect(page.locator('[data-testid="crosstabs-ok-button"]')).toContainText('Calculating...');
  });

  test('should handle reset functionality', async ({ page }) => {
    // Make selections
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-row"]').click();
    
    await page.locator('text=Cells').click();
    await page.locator('input[type="checkbox"]').nth(1).check();
    
    // Reset selections
    await page.locator('[data-testid="crosstabs-reset-button"]').click();
    
    // Verify reset worked
    const okButton = page.locator('[data-testid="crosstabs-ok-button"]');
    await expect(okButton).toBeDisabled();
  });

  test('should handle cancel functionality', async ({ page }) => {
    await page.locator('[data-testid="crosstabs-cancel-button"]').click();
    
    // Modal should close
    await expect(page.locator('[data-testid="crosstabs-dialog-container"]')).not.toBeVisible();
  });

  test('should display help tour functionality', async ({ page }) => {
    const helpButton = page.locator('[data-testid="crosstabs-help-button"]');
    await expect(helpButton).toBeVisible();
    
    // Start tour
    await helpButton.click();
    
    // Tour should be active
    await expect(page.locator('[data-testid="tour-popup"]')).toBeVisible();
  });

  test('should handle variable reordering', async ({ page }) => {
    // Select multiple variables for row
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-row"]').click();
    
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-row"]').click();
    
    // Test reordering functionality
    const rowVariables = page.locator('[data-testid="row-variables"]');
    await expect(rowVariables).toBeVisible();
    
    // Test variable removal
    await page.locator('[data-testid="row-variables"] button').first().click();
    await page.locator('[data-testid="move-to-available"]').click();
  });

  test('should handle non-integer weights configuration', async ({ page }) => {
    await page.locator('text=Cells').click();
    
    // Check non-integer weights options
    await expect(page.locator('text=Noninteger Weights')).toBeVisible();
    
    // Test radio button options
    const noAdjustmentRadio = page.locator('input[type="radio"][value="noAdjustment"]');
    await expect(noAdjustmentRadio).toBeVisible();
    
    const roundRadio = page.locator('input[type="radio"][value="round"]');
    await expect(roundRadio).toBeVisible();
    
    const truncateRadio = page.locator('input[type="radio"][value="truncate"]');
    await expect(truncateRadio).toBeVisible();
  });

  test('should maintain state persistence', async ({ page }) => {
    // Make selections
    await page.locator('[data-testid="available-variables"] button').first().click();
    await page.locator('[data-testid="move-to-row"]').click();
    
    await page.locator('[data-testid="available-variables"] button').nth(1).click();
    await page.locator('[data-testid="move-to-column"]').click();
    
    // Configure cells
    await page.locator('text=Cells').click();
    await page.locator('input[type="checkbox"]').nth(2).check(); // Row percentages
    
    // Close modal
    await page.locator('[data-testid="crosstabs-cancel-button"]').click();
    
    // Reopen modal
    await page.locator('[data-testid="analysis-menu"]').click();
    await page.locator('[data-testid="crosstabs"]').click();
    
    // State should be restored
    const okButton = page.locator('[data-testid="crosstabs-ok-button"]');
    await expect(okButton).toBeEnabled();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Check for error messages
    const errorMessage = page.locator('[data-testid="crosstabs-error-message"]');
    
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
    await expect(page.locator('[data-testid="crosstabs-dialog-container"]')).toBeVisible();
  });

  test('should display appropriate tooltips', async ({ page }) => {
    const helpButton = page.locator('[data-testid="crosstabs-help-button"]');
    
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

  test('should validate cell display combinations', async ({ page }) => {
    await page.locator('text=Cells').click();
    
    // Test enabling/disabling cell display options
    const observedCheckbox = page.locator('text=Observed').locator('..').locator('input[type="checkbox"]');
    const expectedCheckbox = page.locator('text=Expected').locator('..').locator('input[type="checkbox"]');
    
    // Initially observed should be checked
    await expect(observedCheckbox).toBeChecked();
    
    // Test toggling options
    await expectedCheckbox.check();
    await expect(expectedCheckbox).toBeChecked();
    
    // Test row percentages
    const rowPercentCheckbox = page.locator('text=Row Percentages').locator('..').locator('input[type="checkbox"]');
    await rowPercentCheckbox.check();
    await expect(rowPercentCheckbox).toBeChecked();
  });
});
