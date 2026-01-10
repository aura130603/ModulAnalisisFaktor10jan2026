/**
 * Metrics Reporter for Browser Resource Monitoring
 * Collects and reports browser resource usage during tests
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MetricsReport {
  testName: string;
  timestamp: number;
  browserMetrics: any;
  performanceMetrics: {
    loadTime: number;
    renderTime: number;
    calculationTime: number;
  };
  memoryMetrics: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    memoryDelta: number;
  };
  resourceUsage: {
    domNodes: number;
    eventListeners: number;
    storageSize: number;
  };
}

export class MetricsReporter {
  private reports: MetricsReport[] = [];
  private reportDir: string;

  constructor(reportDir = '../reports/metrics') {
    this.reportDir = path.join(__dirname, reportDir);
    this.ensureReportDir();
  }

  private ensureReportDir() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  addReport(report: MetricsReport) {
    this.reports.push(report);
  }

  generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(this.reportDir, `metrics-report-${timestamp}.json`);
    
    const summary = this.generateSummary();
    
    const report = {
      summary,
      detailedReports: this.reports,
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Also generate CSV for easy analysis
    this.generateCSVReport();
    
    return reportPath;
  }

  private generateSummary() {
    if (this.reports.length === 0) return null;

    const memoryUsage = this.reports.map(r => r.memoryMetrics.usedJSHeapSize / 1024 / 1024);
    const loadTimes = this.reports.map(r => r.performanceMetrics.loadTime);
    const calculationTimes = this.reports.map(r => r.performanceMetrics.calculationTime);

    return {
      totalTests: this.reports.length,
      memory: {
        average: this.average(memoryUsage),
        max: Math.max(...memoryUsage),
        min: Math.min(...memoryUsage),
        median: this.median(memoryUsage)
      },
      performance: {
        averageLoadTime: this.average(loadTimes),
        averageCalculationTime: this.average(calculationTimes),
        maxLoadTime: Math.max(...loadTimes),
        maxCalculationTime: Math.max(...calculationTimes)
      },
      resourceThresholds: {
        memoryLimitExceeded: memoryUsage.filter(m => m > 500).length,
        loadTimeExceeded: loadTimes.filter(t => t > 10000).length
      }
    };
  }

  private generateCSVReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvPath = path.join(this.reportDir, `metrics-summary-${timestamp}.csv`);
    
    const headers = [
      'Test Name',
      'Load Time (ms)',
      'Calculation Time (ms)',
      'Memory Usage (MB)',
      'DOM Nodes',
      'Storage Size (KB)',
      'Timestamp'
    ];

    const rows = this.reports.map(report => [
      report.testName,
      report.performanceMetrics.loadTime,
      report.performanceMetrics.calculationTime,
      report.memoryMetrics.usedJSHeapSize / 1024 / 1024,
      report.resourceUsage.domNodes,
      report.resourceUsage.storageSize / 1024,
      new Date(report.timestamp).toISOString()
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    fs.writeFileSync(csvPath, csvContent);
  }

  private average(arr: number[]) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  private median(arr: number[]) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  printSummary() {
    if (this.reports.length === 0) {
      console.log('No metrics collected');
      return;
    }

    const summary = this.generateSummary();
    
    console.log('\n=== Browser Resource Monitoring Summary ===');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log('\nMemory Usage (MB):');
    console.log(`  Average: ${summary.memory.average.toFixed(2)}`);
    console.log(`  Maximum: ${summary.memory.max.toFixed(2)}`);
    console.log(`  Minimum: ${summary.memory.min.toFixed(2)}`);
    
    console.log('\nPerformance (ms):');
    console.log(`  Average Load Time: ${summary.performance.averageLoadTime.toFixed(0)}`);
    console.log(`  Average Calculation Time: ${summary.performance.averageCalculationTime.toFixed(0)}`);
    console.log(`  Max Load Time: ${summary.performance.maxLoadTime}`);
    console.log(`  Max Calculation Time: ${summary.performance.maxCalculationTime}`);
    
    if (summary.resourceThresholds.memoryLimitExceeded > 0) {
      console.log(`\n⚠️  Memory limit exceeded in ${summary.resourceThresholds.memoryLimitExceeded} tests`);
    }
    
    if (summary.resourceThresholds.loadTimeExceeded > 0) {
      console.log(`\n⚠️  Load time exceeded in ${summary.resourceThresholds.loadTimeExceeded} tests`);
    }
  }
}

// Global reporter instance
export const metricsReporter = new MetricsReporter();
