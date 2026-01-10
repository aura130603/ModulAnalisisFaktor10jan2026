/**
 * Comprehensive K6 Load Testing Runner
 * Menjalankan semua test dengan metrik lengkap dan output untuk dashboard
 */

import { exec } from 'k6/execution';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Konfigurasi untuk comprehensive testing
export const options = {
  scenarios: {
    // Backend SAV API Testing
    sav_operations: {
      executor: 'ramping-vus',
      exec: 'testSavOperations',
      startVUs: 5,
      stages: [
        { duration: '2m', target: 20 },   // Ramp up
        { duration: '5m', target: 20 },   // Stay at peak
        { duration: '2m', target: 10 },   // Ramp down
        { duration: '1m', target: 0 },    // Cool down
      ],
      gracefulRampDown: '30s',
    },
    
    // Frontend Basic Load Testing
    frontend_basic: {
      executor: 'ramping-vus',
      exec: 'testFrontendBasic',
      startVUs: 3,
      stages: [
        { duration: '1m', target: 15 },   // Ramp up
        { duration: '3m', target: 15 },   // Stay at peak
        { duration: '1m', target: 5 },    // Ramp down
        { duration: '30s', target: 0 },   // Cool down
      ],
      startTime: '30s',
      gracefulRampDown: '20s',
    },
    
    // Frontend Routes Testing
    frontend_routes: {
      executor: 'ramping-vus',
      exec: 'testFrontendRoutes',
      startVUs: 2,
      stages: [
        { duration: '1m', target: 12 },   // Ramp up
        { duration: '3m', target: 12 },   // Stay at peak
        { duration: '1m', target: 4 },    // Ramp down
        { duration: '30s', target: 0 },   // Cool down
      ],
      startTime: '1m',
      gracefulRampDown: '20s',
    },
    
    // Spike Testing
    spike_test: {
      executor: 'ramping-vus',
      exec: 'testSpike',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 1 },   // Normal load
        { duration: '1m', target: 50 },   // Spike!
        { duration: '30s', target: 1 },   // Back to normal
      ],
      startTime: '3m',
      gracefulRampDown: '10s',
    },
    
    // Stress Testing
    stress_test: {
      executor: 'ramping-vus',
      exec: 'testStress',
      startVUs: 5,
      stages: [
        { duration: '2m', target: 30 },   // Ramp up to stress level
        { duration: '5m', target: 30 },   // Maintain stress
        { duration: '2m', target: 0 },    // Ramp down
      ],
      startTime: '5m',
      gracefulRampDown: '30s',
    }
  },
  
  // Global thresholds untuk semua test
  thresholds: {
    // HTTP Performance
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    
    // SAV Operations
    sav_read_time_ms: ['p(95)<800'],
    sav_write_time_ms: ['p(95)<1200'],
    sav_operation_errors_total: ['count<10'],
    
    // Frontend Performance
    page_load_time: ['p(95)<2000'],
    frontend_errors: ['count<15'],
    routes_frontend_errors: ['count<10'],
    
    // Network Performance
    tcp_connection_time_ms: ['p(95)<200'],
    time_to_first_byte_ms: ['p(95)<400'],
    
    // Error Rates
    api_error_rate_percent: ['rate<0.05'],
    api_success_rate_percent: ['rate>0.95'],
    
    // Resource Usage
    server_memory_usage_mb: ['value<500'],
    server_cpu_usage_percent: ['value<70'],
    
    // Data Transfer
    total_data_transfer_kb: ['avg<1000'],
    
    // Processing
    server_processing_time_ms: ['p(95)<300'],
    request_queue_time_ms: ['p(95)<100']
  },
  
  // Output konfigurasi untuk dashboard
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  
  // External metrics untuk monitoring
  ext: {
    loadimpact: {
      projectID: 'statify-load-test',
      name: 'Comprehensive Load Test'
    }
  }
};

// Import test functions dari file terpisah
import { testSavRead, testSavWrite } from './backend/sav-apis-test.js';
import { default as frontendBasicTest } from './frontend/basic-load-test.js';

// Test functions untuk setiap scenario
export function testSavOperations() {
  // Alternating between read and write operations
  if (Math.random() < 0.6) {
    testSavRead();
  } else {
    testSavWrite();
  }
}

export function testFrontendBasic() {
  frontendBasicTest();
}

export function testFrontendRoutes() {
  // Simulate different route access patterns
  const routes = ['/', '/data', '/variables', '/analysis', '/visualization', '/help'];
  const randomRoute = routes[Math.floor(Math.random() * routes.length)];
  
  const res = http.get(`https://statify-dev.student.stis.ac.id${randomRoute}`);
  
  // Collect route-specific metrics
  routeSpecificTime.add(res.timings.duration);
  navigationSpeed.add(res.timings.duration);
  
  check(res, {
    'route accessible': (r) => r.status === 200,
    'route loads quickly': (r) => r.timings.duration < 1500,
  });
}

export function testSpike() {
  // High-intensity requests to test system limits
  const res = http.get('https://statify-dev.student.stis.ac.id/');
  
  check(res, {
    'survives spike': (r) => r.status === 200,
    'response time acceptable during spike': (r) => r.timings.duration < 3000,
  });
}

export function testStress() {
  // Sustained high load to test system endurance
  const endpoints = [
    'https://statify-dev.student.stis.ac.id/',
    'https://statify-dev.student.stis.ac.id/data',
    'https://statify-dev.student.stis.ac.id/api/sav/read'
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(endpoint);
  
  check(res, {
    'system stable under stress': (r) => r.status === 200,
    'no timeouts under stress': (r) => r.timings.duration < 5000,
  });
}

// Setup function
export function setup() {
  console.log('🚀 Starting Comprehensive Load Testing for Statify');
  console.log('📊 Testing Backend SAV APIs + Frontend Routes + Stress/Spike scenarios');
  console.log('⏱️  Total test duration: ~12 minutes');
  
  return {
    startTime: Date.now(),
    testConfig: {
      backend: true,
      frontend: true,
      stress: true,
      spike: true
    }
  };
}

// Custom summary dengan output untuk dashboard
export function handleSummary(data) {
  const timestamp = new Date().toISOString();
  
  // Generate comprehensive summary
  const summary = {
    timestamp: timestamp,
    test_duration: data.state.testRunDurationMs,
    scenarios: Object.keys(data.metrics).filter(key => key.includes('scenario')),
    
    // HTTP Metrics
    http_metrics: {
      req_duration_avg: data.metrics.http_req_duration?.values?.avg || 0,
      req_duration_p95: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
      req_duration_p99: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
      req_failed_rate: data.metrics.http_req_failed?.values?.rate || 0,
      requests_total: data.metrics.http_reqs?.values?.count || 0,
      requests_per_second: data.metrics.http_reqs?.values?.rate || 0
    },
    
    // Backend SAV Metrics
    sav_metrics: {
      read_time_avg: data.metrics.sav_read_time?.values?.avg || 0,
      read_time_p95: data.metrics.sav_read_time?.values?.['p(95)'] || 0,
      write_time_avg: data.metrics.sav_write_time?.values?.avg || 0,
      write_time_p95: data.metrics.sav_write_time?.values?.['p(95)'] || 0,
      errors_total: data.metrics.sav_errors?.values?.count || 0
    },
    
    // Frontend Metrics
    frontend_metrics: {
      page_load_avg: data.metrics.page_load_time?.values?.avg || 0,
      page_load_p95: data.metrics.page_load_time?.values?.['p(95)'] || 0,
      errors_total: (data.metrics.frontend_errors?.values?.count || 0) + 
                   (data.metrics.routes_frontend_errors?.values?.count || 0)
    },
    
    // Performance Metrics
    performance_metrics: {
      connection_time_avg: data.metrics.connection_time?.values?.avg || 0,
      ttfb_avg: data.metrics.ttfb?.values?.avg || 0,
      processing_time_avg: data.metrics.processing_time?.values?.avg || 0,
      memory_usage_avg: data.metrics.memory_usage_mb?.values?.avg || 0,
      cpu_usage_avg: data.metrics.cpu_usage_percent?.values?.avg || 0
    },
    
    // Error Analysis
    error_analysis: {
      total_errors: (data.metrics.errors?.values?.count || 0) +
                   (data.metrics.frontend_errors?.values?.count || 0) +
                   (data.metrics.sav_errors?.values?.count || 0),
      error_rate: data.metrics.error_rate?.values?.rate || 0,
      success_rate: data.metrics.success_rate?.values?.rate || 1,
      timeout_errors: data.metrics.timeout_errors?.values?.count || 0,
      server_errors: data.metrics.server_errors?.values?.count || 0,
      client_errors: data.metrics.client_errors?.values?.count || 0
    },
    
    // Network Metrics
    network_metrics: {
      dns_lookup_avg: data.metrics.dns_lookup_time?.values?.avg || 0,
      tls_handshake_avg: data.metrics.tls_handshake_time?.values?.avg || 0,
      network_latency_avg: data.metrics.network_latency?.values?.avg || 0,
      data_transfer_avg: data.metrics.data_transfer_size_kb?.values?.avg || 0
    }
  };
  
  return {
    // Standard text summary
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    
    // HTML report
    'dashboard/test-results.html': htmlReport(data),
    
    // JSON summary untuk dashboard
    'dashboard/metrics-summary.json': JSON.stringify(summary, null, 2),
    
    // Detailed metrics untuk dashboard
    'dashboard/detailed-metrics.json': JSON.stringify({
      timestamp: timestamp,
      raw_metrics: data.metrics,
      test_info: {
        duration_ms: data.state.testRunDurationMs,
        vus_max: data.state.vusMax,
        iterations: data.state.iterations
      }
    }, null, 2),
    
    // CSV export untuk analisis lebih lanjut
    'dashboard/metrics-export.csv': generateCSVExport(data)
  };
}

// Helper function untuk generate CSV export
function generateCSVExport(data) {
  const headers = [
    'metric_name',
    'avg',
    'min',
    'max',
    'p50',
    'p90',
    'p95',
    'p99',
    'count',
    'rate'
  ];
  
  let csv = headers.join(',') + '\n';
  
  Object.entries(data.metrics).forEach(([metricName, metricData]) => {
    if (metricData.values) {
      const values = metricData.values;
      const row = [
        metricName,
        values.avg || '',
        values.min || '',
        values.max || '',
        values.med || '',
        values['p(90)'] || '',
        values['p(95)'] || '',
        values['p(99)'] || '',
        values.count || '',
        values.rate || ''
      ];
      csv += row.join(',') + '\n';
    }
  });
  
  return csv;
}

// Teardown function
export function teardown(data) {
  console.log('✅ Comprehensive Load Testing Completed!');
  console.log(`📊 Test duration: ${(Date.now() - data.startTime) / 1000} seconds`);
  console.log('📁 Results saved to dashboard/ directory');
  console.log('🌐 Open dashboard/index.html to view interactive results');
}