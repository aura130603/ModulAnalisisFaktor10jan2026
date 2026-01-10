# 🖥️ Browser Resource Monitoring Documentation

Comprehensive guide for monitoring browser resources in your client-side SPSS application testing.

## 📊 Overview

This system monitors critical browser resources for your client-side SPSS application, ensuring optimal performance and user experience across different dataset sizes and analysis operations.

## 🎯 What We Monitor

### Memory Usage
- **JS Heap Size**: Current memory consumption
- **Memory Leaks**: Detect gradual memory accumulation
- **Garbage Collection**: Track GC frequency and impact
- **Memory Limits**: Ensure we stay within browser limits

### Performance Metrics
- **Load Times**: Data import and rendering performance
- **Calculation Times**: Statistical analysis computation
- **DOM Complexity**: Node count and event listener tracking
- **Cross-browser Consistency**: Performance across different browsers

### Storage Monitoring
- **LocalStorage Usage**: Saved analyses and user preferences
- **IndexedDB**: Cached datasets and computed results
- **Session Storage**: Temporary state management

## 📁 File Structure

```
testing/e2e/
├── utils/
│   ├── browserMetrics.ts      # Core monitoring utilities
│   └── metricsReporter.ts     # Professional reporting system
├── specs/
│   └── metrics/
│       └── browser-resource-monitoring.spec.ts  # Test examples
├── fixtures/
│   └── data/
│       ├── small-dataset.csv    # 1K rows
│       ├── medium-dataset.csv   # 100K rows
│       ├── large-dataset.csv    # 1M rows
│       └── generate-test-data.js # Data generator
└── reports/
    └── metrics/                # Generated reports
```

## 🚀 Quick Start

### 1. Run Resource Monitoring Tests
```bash
# Navigate to e2e directory
cd testing/e2e

# Run all browser resource monitoring tests
npx playwright test specs/metrics/

# Run specific resource monitoring test
npx playwright test specs/metrics/browser-resource-monitoring.spec.ts

# Run with detailed output
npx playwright test specs/metrics/ --reporter=list
```

### 2. Generate Test Data
```bash
# Create test datasets (if not exists)
node fixtures/data/generate-test-data.js
```

### 3. View Reports
```bash
# Reports are automatically generated in:
# testing/e2e/reports/metrics/

# Latest JSON report: metrics-report-{timestamp}.json
# CSV summary: metrics-summary-{timestamp}.csv
```

## 📈 Performance Thresholds

### Dataset Size Benchmarks
| Dataset Size | Expected Load Time | Memory Limit |
|--------------|-------------------|--------------|
| Small (1K rows) | < 2 seconds | < 50MB |
| Medium (100K rows) | < 5 seconds | < 200MB |
| Large (1M rows) | < 15 seconds | < 500MB |

### Analysis Performance
| Analysis Type | Expected Time | Memory Delta |
|---------------|---------------|--------------|
| Descriptive Statistics | < 3 seconds | < 10MB |
| Frequency Analysis | < 2 seconds | < 5MB |
| Cross-tabulation | < 5 seconds | < 15MB |

### Memory Leak Detection
- **Threshold**: < 10MB average growth per operation
- **Iterations**: 5-10 repeated operations
- **GC**: Automatic garbage collection between operations

## 🔧 Usage Examples

### Basic Resource Monitoring
```typescript
import { collectBrowserMetrics } from '../utils/browserMetrics';

test('should track memory usage', async ({ page }) => {
  const metrics = await collectBrowserMetrics(page);
  
  console.log('Memory Usage:', {
    used: `${(metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    total: `${(metrics.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
  });
});
```

### Operation Performance Monitoring
```typescript
import { monitorOperation } from '../utils/browserMetrics';

test('should monitor CSV import performance', async ({ page }) => {
  const { metrics } = await monitorOperation(
    page,
    async () => {
      await page.click('[data-testid="import-csv"]');
      await page.setInputFiles('input[type="file"]', 'small-dataset.csv');
      await page.waitForSelector('[data-testid="data-table"]');
    },
    'csv-import'
  );
  
  expect(metrics.performance.calculationTime).toBeLessThan(2000);
});
```

### Memory Leak Detection
```typescript
import { detectMemoryLeak } from '../utils/browserMetrics';

test('should detect memory leaks in analysis operations', async ({ page }) => {
  const leakResult = await detectMemoryLeak(
    page,
    async () => {
      await page.click('[data-testid="descriptive-analysis"]');
      await page.waitForSelector('[data-testid="analysis-results"]');
    },
    5 // iterations
  );
  
  expect(leakResult.leakDetected).toBe(false);
  expect(leakResult.averageGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## 📊 Report Analysis

### JSON Report Structure
```json
{
  "summary": {
    "totalTests": 10,
    "memory": {
      "average": 45.2,
      "max": 89.5,
      "min": 12.3
    },
    "performance": {
      "averageLoadTime": 1250,
      "averageCalculationTime": 890
    }
  },
  "detailedReports": [...]
}
```

### CSV Summary Format
```csv
"Test Name","Load Time (ms)","Calculation Time (ms)","Memory Usage (MB)","DOM Nodes","Storage Size (KB)","Timestamp"
"csv-import-small","1250","890","45.2","1250","2.3","2024-01-15T10:30:00.000Z"
"descriptive-analysis","2100","1450","89.5","2100","5.7","2024-01-15T10:30:05.000Z"
```

## 🔍 Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check for DOM node accumulation
   - Verify event listener cleanup
   - Monitor large dataset handling

2. **Slow Performance**
   - Profile specific operations
   - Check browser memory pressure
   - Verify IndexedDB optimization

3. **Cross-browser Differences**
   - Memory limits vary by browser
   - Performance characteristics differ
   - Storage capacity limitations

### Debug Commands
```bash
# Run with debug output
DEBUG=metrics npx playwright test specs/metrics/

# Run specific browser
npx playwright test specs/metrics/ --project=chromium

# Run with headed browser for visual debugging
npx playwright test specs/metrics/ --headed
```

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run Browser Resource Tests
  run: |
    cd testing/e2e
    npx playwright test specs/metrics/
    
- name: Upload Metrics Reports
  uses: actions/upload-artifact@v3
  with:
    name: browser-metrics
    path: testing/e2e/reports/metrics/
```

### Performance Regression Detection
- Set thresholds based on historical data
- Alert on significant performance degradation
- Track trends over time

## 📚 Additional Resources

- **Playwright Documentation**: [playwright.dev](https://playwright.dev)
- **Performance Monitoring**: [web.dev/performance](https://web.dev/performance)
- **Memory Management**: [Chrome DevTools](https://developer.chrome.com/docs/devtools/memory)

## 🤝 Contributing

When adding new resource monitoring tests:
1. Follow the established patterns in `browserMetrics.ts`
2. Include appropriate thresholds for your use case
3. Add test data to fixtures when needed
4. Update documentation when adding new metrics

## 📞 Support

For questions about browser resource monitoring:
- Check existing test examples
- Review generated reports for patterns
- Monitor console output for warnings
- Use debugging tools for detailed analysis
