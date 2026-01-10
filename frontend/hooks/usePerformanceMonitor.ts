// /hooks/usePerformanceMonitor.ts
import { useEffect, useRef, useCallback } from 'react';
import { useStoreMediator } from '@/stores/useStoreMediator';

interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  errorRate: number;
}

interface PerformanceThresholds {
  maxRenderTime: number;
  maxUpdateTime: number;
  maxMemoryUsage: number;
  maxErrorRate: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxRenderTime: 16, // 60fps target
  maxUpdateTime: 100, // 100ms for data updates
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  maxErrorRate: 0.05 // 5% error rate
};

/**
 * Minimal performance monitoring hook for data table operations
 * Focuses on critical metrics that impact user experience
 */
export const usePerformanceMonitor = (componentName: string, thresholds = DEFAULT_THRESHOLDS) => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    updateTime: 0,
    memoryUsage: 0,
    errorRate: 0
  });
  
  const errorCountRef = useRef(0);
  const totalOperationsRef = useRef(0);
  const mediator = useStoreMediator();
  
  // Measure render performance
  const measureRender = useCallback((fn: () => void) => {
    const start = performance.now();
    fn();
    const renderTime = performance.now() - start;
    
    metricsRef.current.renderTime = renderTime;
    
    if (renderTime > thresholds.maxRenderTime) {
      console.warn(`[${componentName}] Slow render detected: ${renderTime.toFixed(2)}ms`);
      
      // Emit performance warning
      mediator.emit({
        type: 'SYNC_STATUS_CHANGED',
        payload: { status: 'error' }
      });
    }
    
    return renderTime;
  }, [componentName, thresholds.maxRenderTime, mediator]);
  
  // Measure update performance
  const measureUpdate = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    totalOperationsRef.current++;
    
    try {
      const result = await fn();
      const updateTime = performance.now() - start;
      
      metricsRef.current.updateTime = updateTime;
      
      if (updateTime > thresholds.maxUpdateTime) {
        console.warn(`[${componentName}] Slow update detected: ${updateTime.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      errorCountRef.current++;
      metricsRef.current.errorRate = errorCountRef.current / totalOperationsRef.current;
      
      if (metricsRef.current.errorRate > thresholds.maxErrorRate) {
        console.error(`[${componentName}] High error rate detected: ${(metricsRef.current.errorRate * 100).toFixed(1)}%`);
      }
      
      throw error;
    }
  }, [componentName, thresholds.maxUpdateTime, thresholds.maxErrorRate]);
  
  // Monitor memory usage
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize;
      
      metricsRef.current.memoryUsage = usedJSHeapSize;
      
      if (usedJSHeapSize > thresholds.maxMemoryUsage) {
        console.warn(`[${componentName}] High memory usage: ${(usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`);
        
        // Suggest garbage collection
        if ('gc' in window) {
          (window as any).gc();
        }
      }
    }
  }, [componentName, thresholds.maxMemoryUsage]);
  
  // Periodic memory monitoring
  useEffect(() => {
    const interval = setInterval(checkMemoryUsage, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [checkMemoryUsage]);
  
  // Get current metrics
  const getMetrics = useCallback(() => ({ ...metricsRef.current }), []);
  
  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
      errorRate: 0
    };
    errorCountRef.current = 0;
    totalOperationsRef.current = 0;
  }, []);
  
  return {
    measureRender,
    measureUpdate,
    getMetrics,
    resetMetrics,
    checkMemoryUsage
  };
};

// Hook for monitoring specific data table operations
export const useDataTablePerformance = () => {
  const monitor = usePerformanceMonitor('DataTable', {
    maxRenderTime: 16,
    maxUpdateTime: 200, // More lenient for data operations
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB for large datasets
    maxErrorRate: 0.02 // 2% error rate
  });
  
  return monitor;
};