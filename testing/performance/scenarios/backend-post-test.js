/**
 * Backend POST Load Test - Statify Data Upload
 * Tests POST endpoints for data upload operations
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const uploadSuccessRate = new Rate('upload_success_rate');

// Load test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '2m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    upload_success_rate: ['rate>0.95'], // Upload success rate >95%
  },
};

// Test data
const testData = {
  csvData: `Name,Age,Score\nJohn,25,85\nJane,30,92\nBob,28,78`,
  jsonData: {
    variables: [
      { name: 'age', type: 'numeric' },
      { name: 'score', type: 'numeric' }
    ],
    data: [
      { age: 25, score: 85 },
      { age: 30, score: 92 },
      { age: 28, score: 78 }
    ]
  }
};

export default function () {
  const baseURL = __ENV.BASE_URL || 'http://localhost:3000';
  
  // Test 1: CSV Upload POST
  const csvUpload = () => {
    const formData = {
      file: http.file(testData.csvData, 'test.csv', 'text/csv'),
      type: 'csv'
    };
    
    const response = http.post(`${baseURL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    check(response, {
      'CSV upload status is 200': (r) => r.status === 200,
      'CSV upload response time < 2s': (r) => r.timings.duration < 2000,
      'CSV upload has valid response': (r) => r.json('success') === true,
    });

    uploadSuccessRate.add(response.status === 200);
  };

  // Test 2: JSON Data POST
  const jsonUpload = () => {
    const payload = JSON.stringify(testData.jsonData);
    
    const response = http.post(`${baseURL}/api/data/upload`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    check(response, {
      'JSON upload status is 200': (r) => r.status === 200,
      'JSON upload response time < 2s': (r) => r.timings.duration < 2000,
      'JSON upload has valid response': (r) => r.json('dataId') !== undefined,
    });

    uploadSuccessRate.add(response.status === 200);
  };

  // Test 3: Analysis POST
  const analysisPost = () => {
    const analysisPayload = {
      dataId: 'test-data-123',
      analysisType: 'descriptive',
      variables: ['age', 'score'],
      options: {
        mean: true,
        median: true,
        stdDev: true
      }
    };

    const response = http.post(`${baseURL}/api/analysis/descriptive`, JSON.stringify(analysisPayload), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    check(response, {
      'Analysis POST status is 200': (r) => r.status === 200,
      'Analysis POST response time < 3s': (r) => r.timings.duration < 3000,
      'Analysis POST returns results': (r) => r.json('results') !== undefined,
    });

    uploadSuccessRate.add(response.status === 200);
  };

  // Execute tests
  csvUpload();
  sleep(1);
  
  jsonUpload();
  sleep(1);
  
  analysisPost();
  sleep(1);
}
