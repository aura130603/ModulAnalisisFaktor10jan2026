/**
 * Browser Resource Monitoring Utilities for Statify
 * Tracks memory, CPU, and performance metrics during testing
 */

export interface BrowserMetrics {
  // Memory metrics
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  
  // Performance metrics
  performance: {
    loadTime: number;
    renderTime: number;
    calculationTime: number;
    domContentLoaded: number;
    loadEventEnd: number;
  };
  
  // DOM metrics
  dom: {
    nodeCount: number;
    eventListeners: number;
    mutationObserverCount: number;
  };
  
  // Storage metrics
  storage: {
    localStorageSize: number;
    sessionStorageSize: number;
    indexedDBSize: number;
  };
  
  timestamp: number;
}

/**
 * Collect comprehensive browser metrics
 */
export async function collectBrowserMetrics(page: any): Promise<BrowserMetrics> {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    // Memory info (Chrome specific)
    const memoryInfo = (performance as any).memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };
    
    // DOM metrics
    const nodeCount = document.querySelectorAll('*').length;
    const eventListeners = (document as any)._events ? Object.keys((document as any)._events).length : 0;
    
    // Storage metrics
    const localStorageSize = localStorage ? JSON.stringify(localStorage).length : 0;
    const sessionStorageSize = sessionStorage ? JSON.stringify(sessionStorage).length : 0;
    
    return {
      memory: {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit
      },
      performance: {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        calculationTime: 0, // Will be updated during specific operations
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadEventEnd: navigation.loadEventEnd - navigation.navigationStart
      },
      dom: {
        nodeCount,
        eventListeners,
        mutationObserverCount: 0 // Will be tracked separately
      },
      storage: {
        localStorageSize,
        sessionStorageSize,
        indexedDBSize: 0 // Will be updated for IndexedDB usage
      },
      timestamp: Date.now()
    };
  });
}

/**
 * Monitor specific operation performance
 */
export async function monitorOperation<T>(
  page: any,
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; metrics: BrowserMetrics }> {
  const beforeMetrics = await collectBrowserMetrics(page);
  const startTime = Date.now();
  
  const result = await operation();
  
  const afterMetrics = await collectBrowserMetrics(page);
  const endTime = Date.now();
  
  // Calculate operation-specific metrics
  const operationMetrics = {
    ...afterMetrics,
    performance: {
      ...afterMetrics.performance,
      calculationTime: endTime - startTime,
      memoryDelta: afterMetrics.memory.usedJSHeapSize - beforeMetrics.memory.usedJSHeapSize
    }
  };
  
  return {
    result,
    metrics: operationMetrics
  };
}

/**
 * Memory leak detection
 */
export async function detectMemoryLeak(
  page: any,
  operation: () => Promise<void>,
  iterations: number = 10
): Promise<{
  leakDetected: boolean;
  memoryGrowth: number[];
  averageGrowth: number;
}> {
  const memoryReadings: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    await operation();
    const metrics = await collectBrowserMetrics(page);
    memoryReadings.push(metrics.memory.usedJSHeapSize);
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
  }
  
  const growth = memoryReadings.map((reading, index) => 
    index > 0 ? reading - memoryReadings[index - 1] : 0
  ).slice(1);
  
  const averageGrowth = growth.reduce((sum, val) => sum + val, 0) / growth.length;
  
  return {
    leakDetected: averageGrowth > 1024 * 1024, // More than 1MB average growth
    memoryGrowth: growth,
    averageGrowth
  };
}

/**
 * Performance thresholds for SPSS-like operations
 */
export const PerformanceThresholds = {
  dataLoad: {
    small: 1000,    // 1K rows - under 2 seconds
    medium: 100000, // 100K rows - under 5 seconds
    large: 1000000  // 1M rows - under 15 seconds
  },
  analysis: {
    descriptive: 3000,  // Under 3 seconds
    frequencies: 2000,  // Under 2 seconds
    crosstabs: 5000     // Under 5 seconds
  },
  memory: {
    maxHeapSize: 500 * 1024 * 1024, // 500MB max
    leakThreshold: 10 * 1024 * 1024  // 10MB leak threshold
  }
};
