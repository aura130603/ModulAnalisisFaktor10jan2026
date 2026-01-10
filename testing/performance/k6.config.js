/**
 * Unified k6 configuration for performance testing
 * Consolidates all load testing into one location
 */

export const config = {
  // Base configuration
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
  
  // Environment settings
  env: {
    BASE_URL: 'http://localhost:3000',
    API_BASE_URL: 'http://localhost:3000/api',
  },
  
  // Output configuration
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
  summaryTimeUnit: 'ms',
};

// Test scenarios
export const scenarios = {
  smoke: {
    executor: 'shared-iterations',
    vus: 1,
    iterations: 10,
    maxDuration: '30s',
  },
  
  load: {
    executor: 'ramping-vus',
    stages: [
      { duration: '1m', target: 50 },
      { duration: '3m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
  
  stress: {
    executor: 'ramping-vus',
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 0 },
    ],
  },
};
