/**
 * Frontend GET Load Test - Statify UI Performance
 * Tests GET endpoints for frontend UI loading and data retrieval
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const pageLoadSuccessRate = new Rate('page_load_success_rate');

// Load test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '2m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% requests under 1s
    http_req_failed: ['rate<0.05'],     // Error rate under 5%
    page_load_success_rate: ['rate>0.98'], // Page load success >98%
  },
};

export default function () {
  const baseURL = __ENV.BASE_URL || 'http://localhost:3000';
  
  // Test 1: Homepage GET
  const homepageGet = () => {
    const response = http.get(`${baseURL}/`);

    check(response, {
      'Homepage status is 200': (r) => r.status === 200,
      'Homepage response time < 1s': (r) => r.timings.duration < 1000,
      'Homepage has HTML content': (r) => r.body.includes('<html'),
      'Homepage has React app': (r) => r.body.includes('root') || r.body.includes('__next'),
    });

    pageLoadSuccessRate.add(response.status === 200);
  };

  // Test 2: Static Assets GET
  const staticAssetsGet = () => {
    const assets = [
      '/static/js/main.js',
      '/static/css/main.css',
      '/static/media/logo.png',
      '/favicon.ico'
    ];

    assets.forEach(asset => {
      const response = http.get(`${baseURL}${asset}`);
      
      check(response, {
        'Static asset status is 200/304': (r) => [200, 304].includes(r.status),
        'Static asset response time < 500ms': (r) => r.timings.duration < 500,
        'Static asset has content': (r) => parseInt(r.headers['Content-Length']) > 0,
      });

      pageLoadSuccessRate.add([200, 304].includes(response.status));
    });
  };

  // Test 3: API Data GET
  const apiDataGet = () => {
    const endpoints = [
      '/api/variables',
      '/api/datasets',
      '/api/analysis/descriptive',
      '/api/config'
    ];

    endpoints.forEach(endpoint => {
      const response = http.get(`${baseURL}${endpoint}`);

      check(response, {
        'API GET status is 200': (r) => r.status === 200,
        'API GET response time < 500ms': (r) => r.timings.duration < 500,
        'API GET returns JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
      });

      pageLoadSuccessRate.add(response.status === 200);
    });
  };

  // Test 4: Dashboard GET
  const dashboardGet = () => {
    const dashboardRoutes = [
      '/dashboard',
      '/analysis',
      '/data/upload',
      '/reports'
    ];

    dashboardRoutes.forEach(route => {
      const response = http.get(`${baseURL}${route}`);

      check(response, {
        'Dashboard route status is 200': (r) => r.status === 200,
        'Dashboard route response time < 1s': (r) => r.timings.duration < 1000,
        'Dashboard route loads successfully': (r) => r.body.length > 1000,
      });

      pageLoadSuccessRate.add(response.status === 200);
    });
  };

  // Execute tests
  homepageGet();
  sleep(0.5);
  
  staticAssetsGet();
  sleep(0.5);
  
  apiDataGet();
  sleep(0.5);
  
  dashboardGet();
  sleep(0.5);
}
