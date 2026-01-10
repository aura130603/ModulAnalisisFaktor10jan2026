/**
 * Browser Resource Monitoring Tests for Statify
 * Tests memory, performance, and resource usage
 */

import { test, expect } from '@playwright/test';
import { collectBrowserMetrics, monitorOperation, detectMemoryLeak, PerformanceThresholds } from '../../utils/browserMetrics';

// Test data paths
const testData = {
  small: '../../fixtures/data/small-dataset.csv',
  medium: '../../fixtures/data/medium-dataset.csv',
  large: '../../fixtures/data/large-dataset.csv'
};

test.describe('Browser Resource Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should track memory usage during data loading', async ({ page }) => {
    const metrics = await collectBrowserMetrics(page);
    
    expect(metrics.memory.usedJSHeapSize).toBeGreaterThan(0);
    expect(metrics.memory.totalJSHeapSize).toBeGreaterThan(0);
    expect(metrics.dom.nodeCount).toBeGreaterThan(0);
    
    console.log('Initial memory usage:', {
      used: `${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(metrics.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      domNodes: metrics.dom.nodeCount
    });
  });

  test('should monitor data import performance', async ({ page }) => {
    // Test small dataset import
    const { metrics } = await monitorOperation(
      page,
      async () => {
        // Simulate CSV import
        await page.click('[data-testid="import-csv"]');
        await page.setInputFiles('input[type="file"]', testData.small);
        await page.waitForSelector('[data-testid="data-table"]');
      },
      'small-dataset-import'
    );
    
    expect(metrics.performance.calculationTime).toBeLessThan(PerformanceThresholds.dataLoad.small);
    
    console.log('Data import performance:', {
      loadTime: `${metrics.performance.calculationTime}ms`,
      memoryUsed: `${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
    });
  });

  test('should detect memory leaks during repeated operations', async ({ page }) => {
    // Load initial data
    await page.click('[data-testid="import-csv"]');
    await page.setInputFiles('input[type="file"]', testData.small);
    await page.waitForSelector('[data-testid="data-table"]');
    
    const leakResult = await detectMemoryLeak(
      page,
      async () => {
        // Perform descriptive analysis repeatedly
        await page.click('[data-testid="descriptive-analysis"]');
        await page.waitForSelector('[data-testid="analysis-results"]');
        await page.click('[data-testid="close-analysis"]');
      },
      5
    );
    
    expect(leakResult.leakDetected).toBe(false);
    expect(Math.abs(leakResult.averageGrowth)).toBeLessThan(PerformanceThresholds.memory.leakThreshold);
    
    console.log('Memory leak test result:', leakResult);
  });

  test('should track performance for descriptive statistics', async ({ page }) => {
    // Import test data
    await page.click('[data-testid="import-csv"]');
    await page.setInputFiles('input[type="file"]', testData.medium);
    await page.waitForSelector('[data-testid="data-table"]');
    
    const { metrics } = await monitorOperation(
      page,
      async () => {
        await page.click('[data-testid="descriptive-analysis"]');
        await page.waitForSelector('[data-testid="analysis-results"]');
      },
      'descriptive-statistics'
    );
    
    expect(metrics.performance.calculationTime).toBeLessThan(PerformanceThresholds.analysis.descriptive);
    
    console.log('Descriptive analysis performance:', {
      calculationTime: `${metrics.performance.calculationTime}ms`,
      memoryDelta: `${(metrics.performance.memoryDelta / 1024 / 1024).toFixed(2)} MB`
    });
  });

  test('should monitor DOM complexity', async ({ page }) => {
    const metrics = await collectBrowserMetrics(page);
    
    // Check DOM complexity thresholds
    expect(metrics.dom.nodeCount).toBeLessThan(10000); // Reasonable for SPSS-like app
    expect(metrics.memory.usedJSHeapSize).toBeLessThan(PerformanceThresholds.memory.maxHeapSize);
    
    console.log('DOM complexity:', {
      nodes: metrics.dom.nodeCount,
      eventListeners: metrics.dom.eventListeners,
      memoryUsage: `${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
    });
  });

  test('should track storage usage', async ({ page }) => {
    // Perform operations that use storage
    await page.click('[data-testid="import-csv"]');
    await page.setInputFiles('input[type="file"]', testData.small);
    await page.waitForSelector('[data-testid="data-table"]');
    
    // Save analysis
    await page.click('[data-testid="save-analysis"]');
    await page.fill('[data-testid="analysis-name"]', 'test-analysis');
    await page.click('[data-testid="confirm-save"]');
    
    const metrics = await collectBrowserMetrics(page);
    
    expect(metrics.storage.localStorageSize).toBeGreaterThan(0);
    
    console.log('Storage usage:', {
      localStorage: `${(metrics.storage.localStorageSize / 1024).toFixed(2)} KB`,
      sessionStorage: `${(metrics.storage.sessionStorageSize / 1024).toFixed(2)} KB`
    });
  });

  test('should benchmark different dataset sizes', async ({ page }) => {
    const sizes = ['small', 'medium', 'large'];
    const results = [];
    
    for (const size of sizes) {
      const { metrics } = await monitorOperation(
        page,
        async () => {
          await page.click('[data-testid="import-csv"]');
          await page.setInputFiles('input[type="file"]', testData[size as keyof typeof testData]);
          await page.waitForSelector('[data-testid="data-table"]');
        },
        `dataset-${size}`
      );
      
      results.push({
        size,
        loadTime: metrics.performance.calculationTime,
        memoryUsage: metrics.memory.usedJSHeapSize
      });
    }
    
    console.table(results);
    
    // Verify performance degrades reasonably
    expect(results[1].loadTime).toBeLessThan(results[2].loadTime * 0.5);
  });
});
