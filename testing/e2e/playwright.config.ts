import { defineConfig, devices } from '@playwright/test';

/**
 * Unified Playwright configuration for Statify
 * Consolidates all E2E testing into one location
 */
export default defineConfig({
  // Unified test directory
  testDir: './specs',
  
  // Run tests sequentially for client-side SPSS-like application
  fullyParallel: false,
  workers: 1,
  retries: 0,  // No retries for development testing
  
  // Clear reporting
  reporter: [
    ['html', { outputFolder: '../reports/e2e' }],
    ['list'],
  ],
  
  // Reasonable timeouts
  timeout: 120 * 1000,
  expect: { timeout: 30 * 1000 },
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Browser resource monitoring
    extraHTTPHeaders: {
      'X-Metrics-Collection': 'enabled'
    }
  },

  // Use Chromium only
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Auto-start dev server
  webServer: {
    command: 'npm run dev',
    port: 3000,
    cwd: '../../',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
