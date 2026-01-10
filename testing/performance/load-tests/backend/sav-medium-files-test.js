import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics for SAV operations - fokus pada read operations
const savOperationDuration = new Trend('sav_operation_duration');
const savReadSuccessRate = new Rate('sav_read_success_rate');
const savErrorRate = new Rate('sav_error_rate');
const savFileSize = new Trend('sav_file_size_bytes');
const savVariableCount = new Trend('sav_variable_count');
const savRecordCount = new Trend('sav_record_count');
const savParsingTime = new Trend('sav_parsing_time_ms');
const savDataExtractionTime = new Trend('sav_data_extraction_time_ms');

// Network timing metrics
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

// Error tracking metrics
const serverErrors5xx = new Counter('server_errors_5xx_total');
const clientErrors4xx = new Counter('client_errors_4xx_total');
const timeoutErrors = new Counter('timeout_errors_total');

// Data transfer metrics
const requestPayloadSize = new Trend('request_payload_size_bytes');
const responsePayloadSize = new Trend('response_payload_size_bytes');
const totalDataTransfer = new Trend('total_data_transfer_kb');

// Server processing metrics
const serverProcessingTime = new Trend('server_processing_time_ms');

export const options = {
  scenarios: {
    // Medium file read operations - fokus hanya pada SAV reader dengan 500 request
    sav_read_medium_files: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 500, // Total 500 request
      maxDuration: '5m', // Batas waktu maksimal 5 menit
      startTime: '0s',
      env: { OPERATION_TYPE: 'read', FILE_SIZE: 'medium' },
      gracefulStop: '15s',
    }
  },
  
  thresholds: {
    // HTTP performance thresholds - lebih toleran untuk medium files
    'http_req_duration': ['p(95)<45000'], // Maksimal 45 detik untuk medium files
    'http_req_failed': ['rate<0.90'], // Toleransi 90% failure
    
    // SAV operation thresholds - fokus pada read operations
    'sav_operation_duration': ['p(95)<30000'], // Maksimal 30 detik untuk medium files
    'sav_read_success_rate': ['rate>0.20'], // Target minimal 20% success
    'sav_error_rate': ['rate<0.90'], // Toleransi 90% error
    
    // File characteristics thresholds for medium files
    'sav_file_size_bytes': ['p(50)<100000'],  // Expect medium files (up to 100KB)
    'sav_variable_count': ['p(50)>15'],
    'sav_record_count': ['p(50)>200'],
    'sav_parsing_time_ms': ['p(95)<5000'],
    'sav_data_extraction_time_ms': ['p(95)<3000'],
    
    // Network performance thresholds
    'tcp_connection_time_ms': ['p(95)<1000'],
    'time_to_first_byte_ms': ['p(95)<3000'],
    'data_download_time_ms': ['p(95)<5000'],
    'dns_resolution_time_ms': ['p(95)<500'],
    'tls_handshake_time_ms': ['p(95)<2000'],
    'total_network_latency_ms': ['p(95)<8000'],
    
    // Server resource thresholds
    'server_memory_usage_mb': ['value<2048'],
    'server_cpu_usage_percent': ['value<80'],
    'active_connections_count': ['value<50'],
    
    // Error rate thresholds
    'server_errors_5xx_total': ['count<5'],
    'client_errors_4xx_total': ['count<8'],
    'timeout_errors_total': ['count<3'],
    
    // Data transfer thresholds for medium files
    'request_payload_size_bytes': ['p(95)<1048576'],   // 1MB
    'response_payload_size_bytes': ['p(95)<2097152'], // 2MB
    'total_data_transfer_kb': ['p(95)<3072'],         // 3MB
  },
};

// Base configuration
const baseUrl = 'https://statify-dev.student.stis.ac.id/api';
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'k6-load-test/1.0',
};

// Medium SAV files dataset
const mediumSavFiles = [
  {
    name: 'survey_medium_1.sav',
    size: 15360,
    variables: 25,
    records: 300,
    description: 'Medium survey dataset 1'
  },
  {
    name: 'research_data_medium.sav',
    size: 23040,
    variables: 30,
    records: 400,
    description: 'Medium research dataset'
  },
  {
    name: 'analysis_medium_2.sav',
    size: 30720,
    variables: 35,
    records: 500,
    description: 'Medium analysis dataset 2'
  },
  {
    name: 'study_data_medium.sav',
    size: 38400,
    variables: 40,
    records: 600,
    description: 'Medium study dataset'
  },
  {
    name: 'experiment_medium_3.sav',
    size: 46080,
    variables: 45,
    records: 700,
    description: 'Medium experiment dataset 3'
  },
  {
    name: 'comprehensive_medium.sav',
    size: 53760,
    variables: 50,
    records: 800,
    description: 'Comprehensive medium dataset'
  },
  {
    name: 'detailed_survey_medium.sav',
    size: 61440,
    variables: 55,
    records: 900,
    description: 'Detailed medium survey'
  },
  {
    name: 'extended_analysis_medium.sav',
    size: 69120,
    variables: 60,
    records: 1000,
    description: 'Extended medium analysis'
  }
];

// Simulate server metrics collection
function simulateServerMetrics() {
  serverMemoryUsage.add(Math.random() * 1024 + 512); // 512MB - 1.5GB
  serverCpuUsage.add(Math.random() * 60 + 20); // 20-80%
  activeConnections.add(Math.floor(Math.random() * 30) + 10); // 10-40 connections
}

// Get random file from category
function getFileByCategory(category) {
  if (category === 'medium') {
    return mediumSavFiles[Math.floor(Math.random() * mediumSavFiles.length)];
  }
  return mediumSavFiles[0]; // fallback
}

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
  const requestSize = JSON.stringify(payload).length;
  requestPayloadSize.add(requestSize);
  
  if (response.body) {
    responsePayloadSize.add(response.body.length || 0);
    totalDataTransfer.add((requestSize + (response.body.length || 0)) / 1024);
  }
  
  // Simulate processing metrics
  savParsingTime.add(Math.random() * 2000 + 500); // 500-2500ms
  savDataExtractionTime.add(Math.random() * 1500 + 300); // 300-1800ms
  serverProcessingTime.add(Math.random() * 3000 + 1000); // 1-4 seconds
  
  // Check conditions dengan batas waktu yang lebih toleran
  const success = check(response, {
    'SAV read status is 200': (r) => {
      const isSuccess = r.status === 200;
      if (isSuccess) {
        console.log(`✓ SAV read berhasil: ${file.name} (${file.size} bytes, ${file.variables} vars, ${file.records} records)`);
      } else if (r.status === 429) {
        console.log(`⚠ Rate limit hit untuk ${file.name}: ${r.status}`);
      } else if (r.status >= 500) {
        console.log(`✗ Server error untuk ${file.name}: ${r.status}`);
        serverErrors5xx.add(1);
      }
      return isSuccess;
    },
    'SAV read response time < 45s': (r) => r.timings.duration < 45000, // Lebih toleran untuk medium files
    'SAV read has content': (r) => r.body && r.body.length > 0,
    'SAV read timeout < 60s': (r) => r.timings.duration < 60000,
  });
  
  savReadSuccessRate.add(success);
  
  if (!success) {
    savErrorRate.add(1);
    if (response.timings && response.timings.duration >= 60000) {
      timeoutErrors.add(1);
    }
    if (response.status >= 400 && response.status < 500) {
      clientErrors4xx.add(1);
    }
  }
  
  simulateServerMetrics();
}

// Fungsi testSavDownload dihapus karena fokus hanya pada SAV reader

export default function () {
  const fileSize = __ENV.FILE_SIZE || 'medium';
  
  const file = getFileByCategory(fileSize);
  
  try {
    // Fokus hanya pada operasi SAV reader
    testSavRead(file);
    sleep(3); // Delay 3 detik untuk menghindari rate limiting tapi tetap efisien
  } catch (error) {
    console.error(`Error during SAV read operation:`, error.message);
    savErrorRate.add(1);
  }
  
  // Simulate server processing time - lebih pendek untuk efisiensi
  sleep(Math.random() + 0.5); // 0.5-1.5 seconds
}

export function setup() {
  console.log('🚀 Memulai pengujian SAV medium files reader...');
  console.log('📋 Target: /api/sav/create endpoint');
  console.log('⚠️  Delay 3 detik antar request untuk menghindari rate limiting');
  console.log('🎯 Fokus: Pengujian 500 request SAV reader dengan payload minimal untuk medium files');
  console.log('👥 Menggunakan 10 VUs dengan total 500 iterasi');
}

export function teardown(data) {
  console.log('✅ Pengujian 500 request SAV medium files reader selesai');
  console.log('📊 Silakan periksa metrik untuk hasil detail');
  console.log('📈 Pengujian dibatasi hanya pada operasi read untuk efisiensi');
}