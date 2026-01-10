import { test, expect } from '@playwright/test';

// Performance and Resource Monitoring Interface
interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  errorRate: number;
  cpuUsage?: number;
  networkRequests: number;
  networkLatency: number;
  domNodes: number;
  jsHeapSize: number;
  loadTime: number;
  interactionTime: number;
  // Cross-browser specific metrics
  browserName: string;
  browserVersion: string;
  userAgent: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
}

// Resource monitoring helper functions
class ResourceMonitor {
  private startTime: number = 0;
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    updateTime: 0,
    memoryUsage: 0,
    errorRate: 0,
    networkRequests: 0,
    networkLatency: 0,
    domNodes: 0,
    jsHeapSize: 0,
    loadTime: 0,
    interactionTime: 0,
    browserName: 'unknown',
    browserVersion: 'unknown',
    userAgent: 'unknown',
    viewport: { width: 0, height: 0 },
    devicePixelRatio: 1,
  };

  startMonitoring() {
    this.startTime = Date.now();
  }

  async collectMetrics(page: any): Promise<PerformanceMetrics> {
    try {
      // Collect browser performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const memory = (performance as any).memory;
        
        return {
          loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          jsHeapSize: memory ? memory.usedJSHeapSize : 0,
          jsHeapSizeLimit: memory ? memory.totalJSHeapSize : 0,
          domNodes: document.querySelectorAll('*').length,
          resourceCount: performance.getEntriesByType('resource').length,
          // Browser-specific information
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          devicePixelRatio: window.devicePixelRatio || 1
        };
      });
      
      // Get browser context information
      const browserContext = page.context();
      const browser = browserContext.browser();
      const browserName = browser?.browserType()?.name() || 'unknown';
      const browserVersion = browser?.version() || 'unknown';

      // Collect network metrics
      const networkMetrics = await this.collectNetworkMetrics(page);
      
      // Update metrics
      this.metrics = {
        ...this.metrics,
        loadTime: performanceMetrics.loadTime,
        jsHeapSize: performanceMetrics.jsHeapSize,
        domNodes: performanceMetrics.domNodes,
        networkRequests: performanceMetrics.resourceCount,
        networkLatency: networkMetrics.averageLatency,
        renderTime: performanceMetrics.firstContentfulPaint,
        interactionTime: Date.now() - this.startTime,
        // Browser-specific metrics
        browserName: browserName,
        browserVersion: browserVersion,
        userAgent: performanceMetrics.userAgent,
        viewport: performanceMetrics.viewport,
        devicePixelRatio: performanceMetrics.devicePixelRatio
      };

      return this.metrics;
    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
      return this.metrics;
    }
  }

  private async collectNetworkMetrics(page: any) {
    try {
      const resourceTimings = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map((entry: any) => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize || 0,
          responseStart: entry.responseStart,
          requestStart: entry.requestStart
        }));
      });

      const totalLatency = resourceTimings.reduce((sum: number, resource: any) => 
        sum + (resource.responseStart - resource.requestStart), 0);
      
      return {
        averageLatency: resourceTimings.length > 0 ? totalLatency / resourceTimings.length : 0,
        totalTransferSize: resourceTimings.reduce((sum: number, resource: any) => sum + resource.transferSize, 0)
      };
    } catch (error) {
      return { averageLatency: 0, totalTransferSize: 0 };
    }
  }

  logMetrics(testName: string) {
    console.log(`\n=== Performance Metrics for: ${testName} ===`);
    console.log(`Browser: ${this.metrics.browserName} v${this.metrics.browserVersion}`);
    console.log(`Viewport: ${this.metrics.viewport.width}x${this.metrics.viewport.height}`);
    console.log(`Device Pixel Ratio: ${this.metrics.devicePixelRatio}`);
    console.log(`User Agent: ${this.metrics.userAgent.substring(0, 80)}...`);
    console.log(`--- Performance Metrics ---`);
    console.log(`Load Time: ${this.metrics.loadTime.toFixed(2)}ms`);
    console.log(`Render Time (FCP): ${this.metrics.renderTime.toFixed(2)}ms`);
    console.log(`Interaction Time: ${this.metrics.interactionTime}ms`);
    console.log(`JS Heap Size: ${(this.metrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`DOM Nodes: ${this.metrics.domNodes}`);
    console.log(`Network Requests: ${this.metrics.networkRequests}`);
    console.log(`Average Network Latency: ${this.metrics.networkLatency.toFixed(2)}ms`);
    console.log(`Memory Usage: ${this.metrics.memoryUsage.toFixed(2)}MB`);
    console.log(`Error Rate: ${this.metrics.errorRate}%`);
    console.log('================================================\n');
  }

  validatePerformance(): { passed: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Browser-specific performance thresholds
    const thresholds = this.getBrowserSpecificThresholds();
    
    if (this.metrics.loadTime > thresholds.loadTime) {
      issues.push(`Load time too high for ${this.metrics.browserName}: ${this.metrics.loadTime}ms (threshold: ${thresholds.loadTime}ms)`);
    }
    
    if (this.metrics.renderTime > thresholds.renderTime) {
      issues.push(`Render time too high for ${this.metrics.browserName}: ${this.metrics.renderTime}ms (threshold: ${thresholds.renderTime}ms)`);
    }
    
    if (this.metrics.jsHeapSize > thresholds.jsHeapSize) {
      issues.push(`JS Heap size too high for ${this.metrics.browserName}: ${(this.metrics.jsHeapSize / 1024 / 1024).toFixed(2)}MB (threshold: ${(thresholds.jsHeapSize / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    if (this.metrics.domNodes > thresholds.domNodes) {
      issues.push(`DOM nodes too many for ${this.metrics.browserName}: ${this.metrics.domNodes} (threshold: ${thresholds.domNodes})`);
    }
    
    if (this.metrics.networkLatency > thresholds.networkLatency) {
      issues.push(`Network latency too high for ${this.metrics.browserName}: ${this.metrics.networkLatency}ms (threshold: ${thresholds.networkLatency}ms)`);
    }
    
    if (this.metrics.errorRate > thresholds.errorRate) {
      issues.push(`Error rate too high for ${this.metrics.browserName}: ${this.metrics.errorRate}% (threshold: ${thresholds.errorRate}%)`);
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  private getBrowserSpecificThresholds() {
    // Different browsers have different performance characteristics
    const baseThresholds = {
      loadTime: 3000,
      renderTime: 2000,
      jsHeapSize: 50 * 1024 * 1024, // 50MB
      domNodes: 1500,
      networkLatency: 1000,
      errorRate: 5
    };
    
    switch (this.metrics.browserName) {
      case 'firefox':
        // Firefox typically uses more memory but has good rendering performance
        return {
          ...baseThresholds,
          jsHeapSize: 60 * 1024 * 1024, // 60MB for Firefox
          renderTime: 2500 // Firefox can be slower on first paint
        };
      case 'webkit':
        // WebKit (Safari) is generally more memory efficient but can be slower on complex operations
        return {
          ...baseThresholds,
          loadTime: 3500, // WebKit can be slower on initial load
          jsHeapSize: 40 * 1024 * 1024 // 40MB for WebKit
        };
      case 'chromium':
      default:
        return baseThresholds;
    }
  }
}

test.describe('[Feature Name] - [Dataset] Workflow', () => {
  let resourceMonitor: ResourceMonitor;
  let jsErrors: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Initialize resource monitoring
    resourceMonitor = new ResourceMonitor();
    
    // Setup error monitoring
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    page.on('requestfailed', (request) => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });
    
    // Start monitoring
    resourceMonitor.startMonitoring();
    
    // Navigate to Data Dashboard
    await page.goto('/data-dashboard');
    await page.waitForLoadState('networkidle');
    
    // Collect initial metrics
    await resourceMonitor.collectMetrics(page);
  });
  
  test.afterEach(async ({ page }) => {
    // Collect final metrics
    await resourceMonitor.collectMetrics(page);
    
    // Log performance metrics
    resourceMonitor.logMetrics(test.info().title);
    
    // Validate performance
    const validation = resourceMonitor.validatePerformance();
    if (!validation.passed) {
      console.warn('Performance issues detected:', validation.issues);
    }
    
    // Check for JavaScript errors
    if (jsErrors.length > 0) {
      console.warn('JavaScript errors detected:', jsErrors);
    }
    
    // Check for network errors
    if (networkErrors.length > 0) {
      console.warn('Network errors detected:', networkErrors);
    }
    
    // Reset error arrays for next test
    jsErrors = [];
    networkErrors = [];
  });

  test('should successfully load accidents.sav dataset', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Collect baseline metrics
    const baselineMetrics = await resourceMonitor.collectMetrics(page);
    console.log('Baseline metrics collected');
    
    // Step 1: Load dataset - Menggunakan implementasi aktual
    const fileClickStart = Date.now();
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    const fileClickTime = Date.now() - fileClickStart;
    console.log(`File menu click time: ${fileClickTime}ms`);
    
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    
    const dataLoadStart = Date.now();
    await page.waitForTimeout(5000);
    const dataLoadTime = Date.now() - dataLoadStart;
    console.log(`Data load wait time: ${dataLoadTime}ms`);
    
    // Verify dataset loaded
    // Add specific verification for your feature
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${totalTestTime}ms`);
    
    // Assert no errors
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should perform basic {feature name} analysis', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Load dataset first (same pattern as above)
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    await page.waitForTimeout(5000);
    
    // Navigate to feature
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    
    await page.click('text={Feature Name}...');
    await page.waitForTimeout(2000);
    
    // Configure feature options
    // Tab Variables
    await page.getByTestId('variables-tab-trigger').click();
    // Add variable selection logic here
    
    // Tab Statistics (if applicable)
    await page.getByTestId('statistics-tab-trigger').click();
    // Add statistics options here
    // Example: await page.getByTestId('{feature-name}-mean').check();
    
    // Tab Charts (if applicable)
    await page.getByTestId('charts-tab-trigger').click();
    // Add chart options here
    // Example: await page.getByTestId('display-charts-checkbox').check();
    
    // Execute analysis
    await page.getByTestId('{feature-name}-ok-button').click();
    await page.waitForTimeout(3000);
    
    // Verify results
    // Add specific verification for your feature results
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Total test time: ${totalTestTime}ms`);
    
    // Assert no errors
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should handle comprehensive feature options', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Load dataset first
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    await page.waitForTimeout(5000);
    
    // Navigate to feature
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text={Feature Name}...');
    await page.waitForTimeout(2000);
    
    // Test all available options
    // Variables tab - select multiple variables
    await page.getByTestId('variables-tab-trigger').click();
    // Add comprehensive variable selection
    
    // Statistics tab - enable all statistics
    await page.getByTestId('statistics-tab-trigger').click();
    // Add all statistics options
    
    // Charts tab - enable all chart options
    await page.getByTestId('charts-tab-trigger').click();
    // Add all chart options
    
    // Execute with comprehensive options
    await page.getByTestId('{feature-name}-ok-button').click();
    await page.waitForTimeout(5000);
    
    // Verify comprehensive results
    // Add verification for all enabled options
    
    const totalTestTime = Date.now() - testStartTime;
    console.log(`Comprehensive test time: ${totalTestTime}ms`);
    
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should validate performance thresholds', async ({ page }) => {
    const testStartTime = Date.now();
    
    // Load dataset
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    await page.waitForTimeout(5000);
    
    // Execute feature with performance monitoring
    const featureStartTime = Date.now();
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text={Feature Name}...');
    await page.waitForTimeout(2000);
    
    // Quick execution for performance test
    await page.getByTestId('variables-tab-trigger').click();
    await page.getByTestId('{feature-name}-ok-button').click();
    await page.waitForTimeout(3000);
    
    const featureExecutionTime = Date.now() - featureStartTime;
    console.log(`Feature execution time: ${featureExecutionTime}ms`);
    
    // Validate performance metrics
    const validation = resourceMonitor.validatePerformance();
    if (!validation.passed) {
      console.warn('Performance validation failed:', validation.issues);
    }
    
    // Performance assertions
    expect(featureExecutionTime).toBeLessThan(10000); // Should complete within 10 seconds
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  });

  test('should handle error conditions gracefully', async ({ page }) => {
    // Load dataset first
    await page.click('button:has-text("File")');
    await page.waitForTimeout(1000);
    await page.click('text=Example Data');
    await page.waitForTimeout(2000);
    await page.waitForSelector('button:has-text("accidents.sav")', { timeout: 10000 });
    await page.click('button:has-text("accidents.sav")');
    await page.waitForTimeout(5000);
    
    // Navigate to feature
    await page.click('text=Analyze');
    await page.waitForTimeout(1000);
    await page.click('text=Descriptive Statistics');
    await page.waitForTimeout(1000);
    await page.click('text={Feature Name}...');
    await page.waitForTimeout(2000);
    
    // Test error handling - try to execute without selecting variables
    await page.getByTestId('{feature-name}-ok-button').click();
    await page.waitForTimeout(1000);
    
    // Should show error message or validation
    // Add specific error handling verification
    
    // Verify dialog remains open for correction
    await expect(page.getByTestId('{feature-name}-dialog')).toBeVisible();
    
    // Test recovery - add proper configuration and retry
    await page.getByTestId('variables-tab-trigger').click();
    // Add variable selection
    await page.getByTestId('{feature-name}-ok-button').click();
    await page.waitForTimeout(3000);
    
    // Should succeed after correction
    expect(jsErrors.length).toBe(0);
    expect(networkErrors.length).toBe(0);
  })
});