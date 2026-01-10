import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

// Custom metrics - Specific pages monitoring
const pageLoadTime = new Trend('specific_pages_load_time');
const errorCounter = new Counter('specific_pages_errors');
const throughputCounter = new Counter('specific_pages_throughput');
const connectionTime = new Trend('specific_pages_connection_time');
const ttfb = new Trend('specific_pages_ttfb');
const downloadTime = new Trend('specific_pages_download_time');
const errorRate = new Rate('specific_pages_error_rate');
const successRate = new Rate('specific_pages_success_rate');
const responseSize = new Trend('specific_pages_response_size_bytes');
const networkLatency = new Trend('specific_pages_network_latency');
const dnsLookupTime = new Trend('specific_pages_dns_lookup_time');
const tlsHandshakeTime = new Trend('specific_pages_tls_handshake_time');
const processingTime = new Trend('specific_pages_processing_time');
const renderingTime = new Trend('specific_pages_rendering_time');
const interactivityTime = new Trend('specific_pages_interactivity_time');
const cacheEfficiency = new Rate('specific_pages_cache_efficiency');
const resourceLoadTime = new Trend('specific_pages_resource_load_time');
const userJourneyTime = new Trend('specific_pages_user_journey_time');
const pageSpecificMetrics = new Trend('specific_pages_custom_metrics');
const navigationSpeed = new Trend('specific_pages_navigation_speed');

// Test options
export const options = {
  scenarios: {
    // Test dashboard/data page
    dashboard_data_load: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 VUs
        { duration: '2m', target: 20 },  // Stay at 20 VUs for 2 minutes
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      gracefulRampDown: '15s',
      exec: 'testDashboardDataPage',
    },
    
    // Test help page
    help_page_load: {
      executor: 'ramping-vus',
      startVUs: 3,
      stages: [
        { duration: '30s', target: 15 }, // Ramp up to 15 VUs
        { duration: '2m', target: 15 },  // Stay at 15 VUs for 2 minutes
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '30s', // Start after 30s
      gracefulRampDown: '15s',
      exec: 'testHelpPage',
    },
    
    // Test landing page
    landing_page_load: {
      executor: 'ramping-vus',
      startVUs: 8,
      stages: [
        { duration: '30s', target: 25 }, // Ramp up to 25 VUs
        { duration: '2m', target: 25 },  // Stay at 25 VUs for 2 minutes
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '1m', // Start after 1 minute
      gracefulRampDown: '15s',
      exec: 'testLandingPage',
    },
    
    // Mixed scenario - simulate real user behavior
    mixed_navigation: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '45s', target: 15 }, // Ramp up to 15 VUs
        { duration: '3m', target: 15 },  // Stay at 15 VUs for 3 minutes
        { duration: '45s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '1m30s', // Start after 1.5 minutes
      gracefulRampDown: '20s',
      exec: 'testMixedNavigation',
    },
  },
  
  // Define thresholds
  thresholds: {
    // HTTP Basic Metrics
    http_req_duration: ['p(95)<1500', 'p(99)<3000', 'avg<800'],
    http_req_failed: ['rate<0.03'], // Less than 3% failure rate
    
    // Specific Pages Metrics
    specific_pages_load_time: ['p(95)<2500', 'avg<1200'],
    specific_pages_errors: ['count<8'],
    specific_pages_throughput: ['count>80'],
    
    // Performance Metrics
    specific_pages_connection_time: ['p(95)<250'],
    specific_pages_ttfb: ['p(95)<500'],
    specific_pages_download_time: ['p(95)<800'],
    
    // Error Rates
    specific_pages_error_rate: ['rate<0.03'],
    specific_pages_success_rate: ['rate>0.97'],
    
    // Network Metrics
    specific_pages_response_size_bytes: ['avg<150000'], // 150KB average
    specific_pages_network_latency: ['p(95)<150'],
    specific_pages_dns_lookup_time: ['p(95)<80'],
    specific_pages_tls_handshake_time: ['p(95)<150'],
    
    // Processing & Rendering
    specific_pages_processing_time: ['p(95)<300'],
    specific_pages_rendering_time: ['p(95)<400'],
    specific_pages_interactivity_time: ['p(95)<500'],
    
    // User Experience
    specific_pages_cache_efficiency: ['rate>0.70'],
    specific_pages_resource_load_time: ['p(95)<1500'],
    specific_pages_user_journey_time: ['p(95)<6000'],
    specific_pages_navigation_speed: ['p(95)<1000'],
  },
};

// Setup function
export function setup() {
  console.log('Starting specific pages load test for Statify');
  console.log('Testing: dashboard/data, help, and landing pages');
  return { startTime: Date.now() };
}

// Test dashboard/data page
export function testDashboardDataPage() {
  const startTime = Date.now();
  
  const res = http.get('https://statify-dev.student.stis.ac.id/dashboard/data', {
    headers: {
      'User-Agent': 'k6-load-test/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    timeout: '30s',
  });
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Record metrics
  pageLoadTime.add(res.timings.duration);
  connectionTime.add(res.timings.connecting);
  ttfb.add(res.timings.waiting);
  downloadTime.add(res.timings.receiving);
  responseSize.add(res.body ? res.body.length : 0);
  processingTime.add(totalTime);
  throughputCounter.add(1);
  
  // Advanced timing metrics
  if (res.timings.dns_lookup) dnsLookupTime.add(res.timings.dns_lookup);
  if (res.timings.tls_handshaking) tlsHandshakeTime.add(res.timings.tls_handshaking);
  
  const checkRes = check(res, {
    'dashboard/data status is 200': (r) => r.status === 200,
    'dashboard/data load time < 3s': (r) => r.timings.duration < 3000,
    'dashboard/data response size reasonable': (r) => r.body && r.body.length > 1000,
    'dashboard/data contains expected content': (r) => r.body && r.body.includes('data'),
  });
  
  if (checkRes) {
    successRate.add(1);
  } else {
    errorCounter.add(1);
    errorRate.add(1);
  }
  
  // Simulate user interaction time on data page
  sleep(Math.random() * 3 + 2); // Sleep between 2-5 seconds
  
  return res;
}

// Test help page
export function testHelpPage() {
  const startTime = Date.now();
  
  const res = http.get('https://statify-dev.student.stis.ac.id/help', {
    headers: {
      'User-Agent': 'k6-load-test/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    timeout: '30s',
  });
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Record metrics
  pageLoadTime.add(res.timings.duration);
  connectionTime.add(res.timings.connecting);
  ttfb.add(res.timings.waiting);
  downloadTime.add(res.timings.receiving);
  responseSize.add(res.body ? res.body.length : 0);
  processingTime.add(totalTime);
  throughputCounter.add(1);
  
  // Advanced timing metrics
  if (res.timings.dns_lookup) dnsLookupTime.add(res.timings.dns_lookup);
  if (res.timings.tls_handshaking) tlsHandshakeTime.add(res.timings.tls_handshaking);
  
  const checkRes = check(res, {
    'help page status is 200': (r) => r.status === 200,
    'help page load time < 2s': (r) => r.timings.duration < 2000,
    'help page response size reasonable': (r) => r.body && r.body.length > 500,
    'help page contains expected content': (r) => r.body && (r.body.includes('help') || r.body.includes('documentation')),
  });
  
  if (checkRes) {
    successRate.add(1);
  } else {
    errorCounter.add(1);
    errorRate.add(1);
  }
  
  // Simulate user reading time on help page
  sleep(Math.random() * 4 + 3); // Sleep between 3-7 seconds
  
  return res;
}

// Test landing page
export function testLandingPage() {
  const startTime = Date.now();
  
  const res = http.get('https://statify-dev.student.stis.ac.id/landing', {
    headers: {
      'User-Agent': 'k6-load-test/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    timeout: '30s',
  });
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Record metrics
  pageLoadTime.add(res.timings.duration);
  connectionTime.add(res.timings.connecting);
  ttfb.add(res.timings.waiting);
  downloadTime.add(res.timings.receiving);
  responseSize.add(res.body ? res.body.length : 0);
  processingTime.add(totalTime);
  throughputCounter.add(1);
  
  // Advanced timing metrics
  if (res.timings.dns_lookup) dnsLookupTime.add(res.timings.dns_lookup);
  if (res.timings.tls_handshaking) tlsHandshakeTime.add(res.timings.tls_handshaking);
  
  const checkRes = check(res, {
    'landing page status is 200': (r) => r.status === 200,
    'landing page load time < 2s': (r) => r.timings.duration < 2000,
    'landing page response size reasonable': (r) => r.body && r.body.length > 1000,
    'landing page contains expected content': (r) => r.body && (r.body.includes('Statify') || r.body.includes('landing')),
  });
  
  if (checkRes) {
    successRate.add(1);
  } else {
    errorCounter.add(1);
    errorRate.add(1);
  }
  
  // Simulate user browsing time on landing page
  sleep(Math.random() * 2 + 1); // Sleep between 1-3 seconds
  
  return res;
}

// Test mixed navigation - simulates real user behavior
export function testMixedNavigation() {
  const userJourneyStart = Date.now();
  
  // Start with landing page
  const landingRes = http.get('https://statify-dev.student.stis.ac.id/landing');
  check(landingRes, {
    'mixed: landing page loads': (r) => r.status === 200,
  });
  
  sleep(Math.random() * 2 + 1); // User reads landing page
  
  // Navigate to help page
  const helpRes = http.get('https://statify-dev.student.stis.ac.id/help');
  check(helpRes, {
    'mixed: help page loads': (r) => r.status === 200,
  });
  
  sleep(Math.random() * 3 + 2); // User reads help
  
  // Navigate to dashboard/data
  const dataRes = http.get('https://statify-dev.student.stis.ac.id/dashboard/data');
  check(dataRes, {
    'mixed: dashboard/data loads': (r) => r.status === 200,
  });
  
  const userJourneyEnd = Date.now();
  const totalJourneyTime = userJourneyEnd - userJourneyStart;
  
  // Record user journey metrics
  userJourneyTime.add(totalJourneyTime);
  navigationSpeed.add(totalJourneyTime / 3); // Average time per page
  
  // Record overall metrics
  const avgLoadTime = (landingRes.timings.duration + helpRes.timings.duration + dataRes.timings.duration) / 3;
  pageLoadTime.add(avgLoadTime);
  throughputCounter.add(3); // 3 pages loaded
  
  sleep(Math.random() * 2 + 1); // Final user interaction time
}

// Teardown function
export function teardown(data) {
  const testDuration = (Date.now() - data.startTime) / 1000;
  console.log('Specific pages load test completed');
  console.log(`Total test duration: ${testDuration} seconds`);
  console.log('Pages tested: dashboard/data, help, landing');
  console.log('Test scenarios: individual page loads + mixed navigation');
}