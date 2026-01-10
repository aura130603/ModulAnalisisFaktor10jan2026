import { test, expect } from '@playwright/test';

/**
 * Example Dataset E2E Tests - Customer Database
 * Tests the successful loading workflow of Customer_db example dataset
 */

test.describe('Customer Database Example Dataset Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard data page
    await page.goto('/dashboard/data');
    
    // Ensure page is loaded
    await expect(page.locator('[data-testid="main-navbar"]')).toBeVisible();
  });

  test('should successfully load Customer_db dataset', async ({ page }) => {
    // Click on File menu
    const fileMenuTrigger = page.locator('[data-testid="file-menu-trigger"]');
    await expect(fileMenuTrigger).toBeVisible();
    await fileMenuTrigger.click();

    // Wait for File menu content to be visible
    const fileMenuContent = page.locator('[data-testid="file-menu-content"]');
    await expect(fileMenuContent).toBeVisible();

    // Click on Example Data option
    const exampleDataOption = page.locator('[data-testid="file-menu-example-data"]');
    await expect(exampleDataOption).toBeVisible();
    await exampleDataOption.click();

    // Wait for Example Dataset modal to open
    const exampleDatasetModal = page.locator('[data-testid="example-dataset-modal"]');
    await expect(exampleDatasetModal).toBeVisible();

    // Find and click on Customer_db dataset (this will automatically load it)
    const customerDbOption = page.locator('[data-testid="example-dataset-customer_dbase"]');
    await expect(customerDbOption).toBeVisible();
    await customerDbOption.click();

    // Verify successful data loading
    await page.waitForTimeout(3000);
    
    // Verify data is loaded by checking for data page presence
    const dataPage = page.locator('[data-testid="data-page"]');
    await expect(dataPage).toBeVisible();
    
    // Verify the dataset name appears in the interface
    await expect(page.locator('text=customer_dbase')).toBeVisible();
  });

  test('should complete customer database workflow', async ({ page }) => {
    // Navigate to data page
    await page.goto('/dashboard/data');

    // Complete workflow from file menu to loaded data
    await page.locator('[data-testid="file-menu-trigger"]').click();
    await page.locator('[data-testid="file-menu-example-data"]').click();
    await page.locator('[data-testid="example-dataset-customer_dbase"]').click();

    // Wait for data loading
    await page.waitForTimeout(3000);

    // Verify data page is visible
    await expect(page.locator('[data-testid="data-page"]')).toBeVisible();
  });

  test('should handle Customer_db dataset loading cancellation', async ({ page }) => {
    // Open Example Dataset modal
    await page.goto('/dashboard/data');
    await page.locator('[data-testid="file-menu-trigger"]').click();
    await page.locator('[data-testid="file-menu-example-data"]').click();

    // Wait for modal to be visible
    await expect(page.locator('[data-testid="example-dataset-modal"]')).toBeVisible();

    // Click Cancel button to close modal
    const cancelButton = page.locator('[data-testid="cancel-button"]');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Verify modal is closed
    await expect(page.locator('[data-testid="example-dataset-modal"]')).not.toBeVisible();
  });
});
