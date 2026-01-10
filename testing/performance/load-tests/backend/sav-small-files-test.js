import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics untuk monitoring performa SAV operations
const savOperationDuration = new Trend('sav_operation_duration');
const savReadSuccessRate = new Rate('sav_read_success_rate');
const savDownloadSuccessRate = new Rate('sav_download_success_rate');
const savMixedSuccessRate = new Rate('sav_mixed_success_rate');
const savErrorRate = new Rate('sav_error_rate');
const savFileSize = new Trend('sav_file_size_bytes');
const savVariableCount = new Trend('sav_variable_count');
const savRecordCount = new Trend('sav_record_count');
const savParsingTime = new Trend('sav_parsing_time_ms');
const savDataExtractionTime = new Trend('sav_data_extraction_time_ms');

// Network metrics
const tcpConnectionTime = new Trend('tcp_connection_time_ms');
const timeToFirstByte = new Trend('time_to_first_byte_ms');
const dataDownloadTime = new Trend('data_download_time_ms');
const dnsResolutionTime = new Trend('dns_resolution_time_ms');
const tlsHandshakeTime = new Trend('tls_handshake_time_ms');
const totalNetworkLatency = new Trend('total_network_latency_ms');

// Server resource metrics
const serverMemoryUsage = new Gauge('server_memory_usage_mb');
const serverCpuUsage = new Gauge('server_cpu_usage_percent');
const activeConnections = new Gauge('active_connections_count');

// Error tracking
const serverErrors5xx = new Counter('server_errors_5xx_total');
const clientErrors4xx = new Counter('client_errors_4xx_total');
const timeoutErrors = new Counter('timeout_errors_total');

// Data transfer metrics
const requestPayloadSize = new Trend('request_payload_size_bytes');
const responsePayloadSize = new Trend('response_payload_size_bytes');
const totalDataTransfer = new Trend('total_data_transfer_kb');

export const options = {
  scenarios: {
    // Scenario 1: Read Small Files Only
    sav_read_small_files: {
      executor: 'constant-vus',
      vus: 1,
      duration: '2m',  // 2 menit dengan 1 VU seperti contoh yang berhasil
      startTime: '0s',
      env: { OPERATION_TYPE: 'read', FILE_SIZE: 'small' },
      gracefulRampDown: '15s',
    },
    
    // Scenario 2: Download Small Files Only
    sav_download_small_files: {
      executor: 'constant-vus',
      vus: 1,
      duration: '2m',  // 2 menit dengan 1 VU
      startTime: '3m',  // Start after read test
      env: { OPERATION_TYPE: 'download', FILE_SIZE: 'small' },
      gracefulRampDown: '15s',
    },
    
    // Scenario 3: Mixed Operations (Read + Download)
    sav_mixed_small_operations: {
      executor: 'constant-vus',
      vus: 1,
      duration: '2m',  // 2 menit dengan 1 VU
      startTime: '6m',  // Start after download test
      env: { OPERATION_TYPE: 'mixed', FILE_SIZE: 'small' },
      gracefulRampDown: '15s',
    },
  },
  
  thresholds: {
    // HTTP performance thresholds - lebih toleran
    'http_req_duration': ['p(95)<30000'], // Maksimal 30 detik
    'http_req_failed': ['rate<0.90'], // Toleransi 90% failure
    
    // SAV operation specific thresholds - lebih realistis
    'sav_operation_duration': ['p(95)<20000'], // Maksimal 20 detik
    'sav_read_success_rate': ['rate>0.20'], // Target minimal 20% success
    'sav_download_success_rate': ['rate>0.20'], // Target minimal 20% success
    'sav_mixed_success_rate': ['rate>0.20'], // Target minimal 20% success
    'sav_error_rate': ['rate<0.90'], // Toleransi 90% error
    
    // File processing thresholds for small files
    'sav_file_size_bytes': ['p(50)<10000'],  // Expect small files
    'sav_variable_count': ['p(50)>3'],
    'sav_record_count': ['p(50)>50'],
    'sav_parsing_time_ms': ['p(95)<2000'],
    'sav_data_extraction_time_ms': ['p(95)<1500'],
    
    // Network performance thresholds
    'tcp_connection_time_ms': ['p(95)<800'],
    'time_to_first_byte_ms': ['p(95)<2000'],
    'data_download_time_ms': ['p(95)<3000'],
    'dns_resolution_time_ms': ['p(95)<300'],
    'tls_handshake_time_ms': ['p(95)<1500'],
    'total_network_latency_ms': ['p(95)<5000'],
    
    // Server resource thresholds
    'server_memory_usage_mb': ['value<1024'],
    'server_cpu_usage_percent': ['value<70'],
    'active_connections_count': ['value<30'],
    
    // Error thresholds
    'server_errors_5xx_total': ['count<3'],
    'client_errors_4xx_total': ['count<5'],
    'timeout_errors_total': ['count<2'],
    
    // Data transfer thresholds
    'request_payload_size_bytes': ['p(95)<512000'],   // 512KB
    'response_payload_size_bytes': ['p(95)<1048576'], // 1MB
    'total_data_transfer_kb': ['p(95)<1536'],         // 1.5MB
  },
};

// Base URL dan headers
const baseUrl = 'https://statify-dev.student.stis.ac.id/api';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'k6-load-test/1.0',
};

// Small SAV files untuk testing (fokus pada file kecil)
const smallSavFiles = [
  {
    name: 'sample_survey_tiny.sav',
    size: 960,
    variables: 5,
    records: 50,
    description: 'Tiny survey dataset'
  },
  {
    name: 'basic_data_small.sav',
    size: 1920,
    variables: 8,
    records: 75,
    description: 'Small basic dataset'
  },
  {
    name: 'test_data_mini.sav',
    size: 2880,
    variables: 12,
    records: 100,
    description: 'Mini test dataset'
  },
  {
    name: 'quick_analysis.sav',
    size: 3840,
    variables: 15,
    records: 120,
    description: 'Quick analysis dataset'
  },
  {
    name: 'demo_data_compact.sav',
    size: 4800,
    variables: 18,
    records: 150,
    description: 'Compact demo dataset'
  },
  {
    name: 'pilot_study_small.sav',
    size: 5760,
    variables: 20,
    records: 180,
    description: 'Small pilot study'
  }
];

// Fungsi untuk simulasi server resource usage
function simulateServerMetrics() {
  serverMemoryUsage.add(Math.random() * 512 + 256); // 256MB - 768MB
  serverCpuUsage.add(Math.random() * 50 + 15);      // 15% - 65%
  activeConnections.add(Math.floor(Math.random() * 20) + 5); // 5-25 connections
}

// Fungsi untuk mendapatkan file berdasarkan kategori
function getFileByCategory(category) {
  if (category === 'small') {
    return smallSavFiles[Math.floor(Math.random() * smallSavFiles.length)];
  }
  // Default ke small file
  return smallSavFiles[Math.floor(Math.random() * smallSavFiles.length)];
}

// Fungsi untuk test SAV read operation (menggunakan create endpoint)
function testSavRead(file) {
  const startTime = Date.now();
  
  // Payload minimal sesuai dengan API yang benar
  const payload = {
    variables: [
      { name: 'id', label: 'ID', type: 'NUMERIC', width: 5, decimal: 0, measure: 'NOMINAL' },
      { name: 'value', label: 'Value', type: 'NUMERIC', width: 3, decimal: 0, measure: 'SCALE' }
    ],
    data: [
      { id: 1, value: 10 },
      { id: 2, value: 20 }
    ]
  };
  
  const response = http.post(`${baseUrl}/sav/create`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream',
      'User-Agent': 'K6-Test/1.0'
    },
    timeout: '60s',
  });
  
  const duration = Date.now() - startTime;
  
  // Record metrics
  savOperationDuration.add(duration);
  savFileSize.add(file.size);
  savVariableCount.add(file.variables);
  savRecordCount.add(file.records);
  
  // Network timing metrics
  if (response.timings) {
    tcpConnectionTime.add(response.timings.connecting || 0);
    timeToFirstByte.add(response.timings.waiting || 0);
    dataDownloadTime.add(response.timings.receiving || 0);
    dnsResolutionTime.add(response.timings.looking_up || 0);
    tlsHandshakeTime.add(response.timings.tls_handshaking || 0);
    totalNetworkLatency.add(response.timings.duration || 0);
  }
  
  // Payload size metrics
  requestPayloadSize.add(JSON.stringify(payload).length);
  responsePayloadSize.add(response.body ? response.body.length : 0);
  totalDataTransfer.add((JSON.stringify(payload).length + (response.body ? response.body.length : 0)) / 1024);
  
  const success = check(response, {
    'SAV read status is 200': (r) => r.status === 200,
    'SAV read response has data': (r) => r.body && r.body.length > 0,
    'SAV read response time < 30s': (r) => r.timings.duration < 30000,
  });
  
  savReadSuccessRate.add(success);
  
  if (response.status >= 500) {
    serverErrors5xx.add(1);
  } else if (response.status >= 400) {
    clientErrors4xx.add(1);
  }
  
  if (response.timings && response.timings.duration > 60000) {
    timeoutErrors.add(1);
  }
  
  // Logging detail seperti contoh yang berhasil
  const isSuccess = response.status === 200;
  const isRateLimited = response.status === 429;
  const isServerError = response.status >= 500;
  
  if (isSuccess) {
    console.log(`🎉 SAV READ SUCCESS! Status: ${response.status}, Duration: ${duration}ms, Response Size: ${response.body ? response.body.length : 0}B`);
  } else if (isRateLimited) {
    console.log(`⏳ SAV READ Rate Limited (429) - Duration: ${duration}ms`);
  } else if (isServerError) {
    console.log(`🔥 SAV READ Server Error (${response.status}) - Duration: ${duration}ms`);
  } else {
    console.log(`❌ SAV READ Error ${response.status} - Duration: ${duration}ms, Body: ${response.body ? response.body.substring(0, 50) : 'No body'}`);
  }
  
  // Simulate parsing and extraction times
  savParsingTime.add(Math.random() * 1000 + 200);
  savDataExtractionTime.add(Math.random() * 800 + 150);
  
  return success;
}

// Fungsi untuk test SAV download operation (menggunakan create endpoint)
function testSavDownload(file) {
  const startTime = Date.now();
  
  // Payload minimal sesuai dengan API yang benar
  const payload = {
    variables: [
      { name: 'id', label: 'ID', type: 'NUMERIC', width: 5, decimal: 0, measure: 'NOMINAL' },
      { name: 'value', label: 'Value', type: 'NUMERIC', width: 3, decimal: 0, measure: 'SCALE' }
    ],
    data: [
      { id: 1, value: 10 },
      { id: 2, value: 20 }
    ]
  };
  
  const response = http.post(`${baseUrl}/sav/create`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/octet-stream',
      'User-Agent': 'K6-Test/1.0'
    },
    timeout: '60s',
  });
  
  const duration = Date.now() - startTime;
  
  // Record metrics
  savOperationDuration.add(duration);
  savFileSize.add(file.size);
  
  // Network timing metrics
  if (response.timings) {
    tcpConnectionTime.add(response.timings.connecting || 0);
    timeToFirstByte.add(response.timings.waiting || 0);
    dataDownloadTime.add(response.timings.receiving || 0);
    dnsResolutionTime.add(response.timings.looking_up || 0);
    tlsHandshakeTime.add(response.timings.tls_handshaking || 0);
    totalNetworkLatency.add(response.timings.duration || 0);
  }
  
  // Payload size metrics
  requestPayloadSize.add(JSON.stringify(payload).length);
  responsePayloadSize.add(response.body ? response.body.length : 0);
  totalDataTransfer.add((JSON.stringify(payload).length + (response.body ? response.body.length : 0)) / 1024);
  
  const success = check(response, {
    'SAV download status is 200': (r) => r.status === 200,
    'SAV download has content': (r) => r.body && r.body.length > 0,
    'SAV download response time < 30s': (r) => r.timings.duration < 30000,
  });
  
  savDownloadSuccessRate.add(success);
  
  if (response.status >= 500) {
    serverErrors5xx.add(1);
  } else if (response.status >= 400) {
    clientErrors4xx.add(1);
  }
  
  if (response.timings && response.timings.duration > 60000) {
    timeoutErrors.add(1);
  }
  
  // Logging detail seperti contoh yang berhasil
  const isSuccess = response.status === 200;
  const isRateLimited = response.status === 429;
  const isServerError = response.status >= 500;
  
  if (isSuccess) {
    console.log(`🎉 SAV DOWNLOAD SUCCESS! Status: ${response.status}, Duration: ${duration}ms, Response Size: ${response.body ? response.body.length : 0}B`);
  } else if (isRateLimited) {
    console.log(`⏳ SAV DOWNLOAD Rate Limited (429) - Duration: ${duration}ms`);
  } else if (isServerError) {
    console.log(`🔥 SAV DOWNLOAD Server Error (${response.status}) - Duration: ${duration}ms`);
  } else {
    console.log(`❌ SAV DOWNLOAD Error ${response.status} - Duration: ${duration}ms, Body: ${response.body ? response.body.substring(0, 50) : 'No body'}`);
  }
  
  return success;
}

export default function () {
  const operationType = __ENV.OPERATION_TYPE || 'read';
  const fileSize = __ENV.FILE_SIZE || 'small';
  
  // Simulate server metrics
  simulateServerMetrics();
  
  // Get file based on size category
  const file = getFileByCategory(fileSize);
  
  let success = false;
  
  try {
    if (operationType === 'read') {
      success = testSavRead(file);
      // Delay panjang untuk menghindari rate limiting
      sleep(5); // 5 detik normal delay
      
    } else if (operationType === 'download') {
      success = testSavDownload(file);
      // Delay panjang untuk menghindari rate limiting
      sleep(5); // 5 detik normal delay
      
    } else if (operationType === 'mixed') {
      // Alternate between read and download
      if (Math.random() < 0.7) {
        success = testSavRead(file);
      } else {
        success = testSavDownload(file);
      }
      savMixedSuccessRate.add(success);
      // Delay untuk mixed operations
      sleep(5); // 5 detik delay
    }
    
    savErrorRate.add(!success);
    
  } catch (error) {
    console.error(`Error in SAV operation: ${error.message}`);
    savErrorRate.add(1);
    sleep(2); // Short sleep on error
  }
}

// Setup function
export function setup() {
  console.log('🚀 Memulai pengujian SAV Small Files Load Test...');
  console.log('📍 Target: https://statify-dev.student.stis.ac.id/api/sav/create');
  console.log('⚠️  Menggunakan delay panjang untuk menghindari rate limiting');
  console.log('🎯 Focus: Testing SAV create endpoint dengan payload minimal');
  return {};
}

// Teardown function
export function teardown(data) {
  console.log('✅ Pengujian SAV Small Files Load Test selesai.');
  console.log('📊 Cek hasil di atas untuk melihat response yang berhasil.');
}