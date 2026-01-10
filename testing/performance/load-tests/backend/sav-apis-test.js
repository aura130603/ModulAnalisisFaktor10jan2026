import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

/**
 * Load Test untuk SAV API Backend - Skenario Terpisah
 * 
 * Test ini mensimulasikan operasi upload dan pembuatan file SAV dengan 4 skenario terpisah:
 * 
 * SKENARIO UPLOAD (berdasarkan ukuran file):
 * 1. sav_upload_small_files: Hanya file kecil (<5KB) - 10 VUs, durasi 80s
 * 2. sav_upload_medium_files: Hanya file sedang (5-100KB) - 8 VUs, durasi 80s
 * 3. sav_upload_large_files: Hanya file besar (>100KB) - 5 VUs, durasi 80s
 * 
 * SKENARIO CREATE:
 * 4. sav_create_operations: Pembuatan file SAV dari data - 8 VUs, durasi 120s
 * 
 * Keunggulan skenario terpisah:
 * - Analisis performa per kategori ukuran file
 * - Threshold yang disesuaikan untuk setiap kategori
 * - Metrik yang lebih detail dan spesifik
 * - Kemudahan debugging dan optimasi
 * 
 * Endpoint yang diuji:
 * - POST /api/sav/upload (upload file SAV)
 * - POST /api/sav/create (buat file SAV dari data)
 */

// === METRIK UTAMA SAV OPERATIONS ===
// Waktu operasi SAV (dalam milliseconds)
const savFileUploadTime = new Trend('sav_file_upload_duration_ms');
const savFileCreateTime = new Trend('sav_file_create_duration_ms');
const savReadTime = new Trend('sav_read_time_ms');
const savWriteTime = new Trend('sav_write_time_ms');
const savOperationErrors = new Counter('sav_operation_errors_total');

// === METRIK BERDASARKAN UKURAN FILE ===
// Waktu operasi berdasarkan kategori ukuran file
const savSmallFileTime = new Trend('sav_small_file_duration_ms'); // < 5KB
const savMediumFileTime = new Trend('sav_medium_file_duration_ms'); // 5KB - 100KB
const savLargeFileTime = new Trend('sav_large_file_duration_ms'); // > 100KB

// === METRIK API ENDPOINT SPESIFIK ===
// Metrik untuk endpoint /api/sav/upload
const savUploadSuccessRate = new Rate('sav_upload_success_rate');
const savUploadFileSize = new Trend('sav_upload_file_size_kb');

// Metrik untuk endpoint /api/sav/create
const savCreateSuccessRate = new Rate('sav_create_success_rate');
const savCreateVariableCount = new Trend('sav_create_variable_count');
const savCreateRecordCount = new Trend('sav_create_record_count');

// === METRIK SKENARIO SPESIFIK ===
// Metrik untuk skenario upload file kecil
const savUploadSmallSuccessRate = new Rate('sav_upload_small_success_rate');
const savUploadSmallDuration = new Trend('sav_upload_small_duration_ms');

// Metrik untuk skenario upload file sedang
const savUploadMediumSuccessRate = new Rate('sav_upload_medium_success_rate');
const savUploadMediumDuration = new Trend('sav_upload_medium_duration_ms');

// Metrik untuk skenario upload file besar
const savUploadLargeSuccessRate = new Rate('sav_upload_large_success_rate');
const savUploadLargeDuration = new Trend('sav_upload_large_duration_ms');

// === METRIK SKENARIO WRITE SAV (CREATE) ===
// Metrik untuk skenario create file SAV kecil (sedikit data)
const savWriteSmallSuccessRate = new Rate('sav_write_small_success_rate');
const savWriteSmallDuration = new Trend('sav_write_small_duration_ms');

// Metrik untuk skenario create file SAV sedang
const savWriteMediumSuccessRate = new Rate('sav_write_medium_success_rate');
const savWriteMediumDuration = new Trend('sav_write_medium_duration_ms');

// Metrik untuk skenario create file SAV besar (banyak data)
const savWriteLargeSuccessRate = new Rate('sav_write_large_success_rate');
const savWriteLargeDuration = new Trend('sav_write_large_duration_ms');

// === METRIK PERFORMA API ===
// Throughput dan beban sistem
const apiRequestsPerSecond = new Counter('api_requests_per_second');
const serverMemoryUsage = new Gauge('server_memory_usage_mb');
const serverCpuUsage = new Gauge('server_cpu_usage_percent');
const activeConnections = new Gauge('active_connections_count');

// === METRIK JARINGAN ===
// Waktu koneksi dan transfer (dalam milliseconds)
const tcpConnectionTime = new Trend('tcp_connection_time_ms');
const timeToFirstByte = new Trend('time_to_first_byte_ms');
const dataDownloadTime = new Trend('data_download_time_ms');
const dataUploadTime = new Trend('data_upload_time_ms');
const dnsResolutionTime = new Trend('dns_resolution_time_ms');
const tlsHandshakeTime = new Trend('tls_handshake_time_ms');
const totalNetworkLatency = new Trend('total_network_latency_ms');

// === METRIK KEBERHASILAN ===
// Rate keberhasilan dan kegagalan
const apiErrorRate = new Rate('api_error_rate_percent');
const apiSuccessRate = new Rate('api_success_rate_percent');
const timeoutErrors = new Counter('timeout_errors_total');
const serverErrors = new Counter('server_errors_5xx_total');
const clientErrors = new Counter('client_errors_4xx_total');

// === METRIK DATA TRANSFER ===
// Ukuran data yang ditransfer (dalam bytes dan KB)
const requestPayloadSize = new Trend('request_payload_size_bytes');
const responsePayloadSize = new Trend('response_payload_size_bytes');
const totalDataTransfer = new Trend('total_data_transfer_kb');

// === METRIK PEMROSESAN ===
// Waktu pemrosesan server (dalam milliseconds)
const serverProcessingTime = new Trend('server_processing_time_ms');
const requestQueueTime = new Trend('request_queue_time_ms');

// Test options
export const options = {
  scenarios: {
    // === SKENARIO 1: SAV UPLOAD - FILE KECIL (<5KB) ===
    sav_upload_small_files: {
      executor: 'ramping-vus',
      startVUs: 3,
      stages: [
        { duration: '20s', target: 10 }, // Ramp up to 10 VUs
        { duration: '40s', target: 10 }, // Stay at 10 VUs
        { duration: '20s', target: 0 },  // Ramp down to 0 VUs
      ],
      env: { FILE_SIZE_CATEGORY: 'small' },
      gracefulRampDown: '10s',
    },
    
    // === SKENARIO 2: SAV UPLOAD - FILE SEDANG (5KB-100KB) ===
    sav_upload_medium_files: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '20s', target: 8 },  // Ramp up to 8 VUs
        { duration: '40s', target: 8 },  // Stay at 8 VUs
        { duration: '20s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '10s', // Start after 10s
      env: { FILE_SIZE_CATEGORY: 'medium' },
      gracefulRampDown: '10s',
    },
    
    // === SKENARIO 3: SAV UPLOAD - FILE BESAR (>100KB) ===
    sav_upload_large_files: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 5 },  // Ramp up to 5 VUs
        { duration: '40s', target: 5 },  // Stay at 5 VUs
        { duration: '20s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '20s', // Start after 20s
      env: { FILE_SIZE_CATEGORY: 'large' },
      gracefulRampDown: '10s',
    },
    
    // === SKENARIO 4: SAV CREATE OPERATIONS (Create File) ===
    sav_create_operations: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '30s', target: 8 },  // Ramp up to 8 VUs
        { duration: '1m', target: 8 },   // Stay at 8 VUs
        { duration: '30s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '30s', // Start after 30s
      gracefulRampDown: '10s',
    },
    
    // === SKENARIO 5: SAV WRITE SMALL DATA (Create dengan data kecil) ===
    sav_write_small_data: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '20s', target: 6 },  // Ramp up to 6 VUs
        { duration: '40s', target: 6 },  // Stay at 6 VUs
        { duration: '20s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '2m40s', // Start after other scenarios
      env: { DATA_SIZE_CATEGORY: 'small' },
      gracefulRampDown: '10s',
    },
    
    // === SKENARIO 6: SAV WRITE MEDIUM DATA (Create dengan data sedang) ===
    sav_write_medium_data: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '20s', target: 5 },  // Ramp up to 5 VUs
        { duration: '40s', target: 5 },  // Stay at 5 VUs
        { duration: '20s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '3m20s', // Start after small data scenario
      env: { DATA_SIZE_CATEGORY: 'medium' },
      gracefulRampDown: '10s',
    },
    
    // === SKENARIO 7: SAV WRITE LARGE DATA (Create dengan data besar) ===
    sav_write_large_data: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 3 },  // Ramp up to 3 VUs
        { duration: '40s', target: 3 },  // Stay at 3 VUs
        { duration: '20s', target: 0 },  // Ramp down to 0 VUs
      ],
      startTime: '4m00s', // Start after medium data scenario
      env: { DATA_SIZE_CATEGORY: 'large' },
      gracefulRampDown: '10s',
    },
  },
  
  // Define thresholds untuk semua metrik
  thresholds: {
    // === THRESHOLD HTTP DASAR ===
    http_req_duration: ['p(95)<2000', 'p(99)<3000', 'avg<1000'], // Response time harus < 2s (95%), < 3s (99%), rata-rata < 1s
    http_req_failed: ['rate<0.05'], // Maksimal 5% request gagal
    
    // === THRESHOLD SAV OPERATIONS ===
    sav_file_upload_duration_ms: ['p(95)<3000', 'p(99)<5000', 'avg<2000'], // Upload SAV: 95% < 3s, 99% < 5s, rata-rata < 2s
    sav_file_create_duration_ms: ['p(95)<5000', 'p(99)<8000', 'avg<3000'], // Create SAV: 95% < 5s, 99% < 8s, rata-rata < 3s
    sav_read_time_ms: ['p(95)<3000', 'p(99)<5000', 'avg<2000'], // Read SAV: 95% < 3s, 99% < 5s, rata-rata < 2s
    sav_write_time_ms: ['p(95)<5000', 'p(99)<8000', 'avg<3000'], // Write SAV: 95% < 5s, 99% < 8s, rata-rata < 3s
    sav_operation_errors_total: ['count<10'], // Maksimal 10 error SAV operation selama test
    
    // === THRESHOLD BERDASARKAN UKURAN FILE ===
    sav_small_file_duration_ms: ['p(95)<1000', 'p(99)<1500', 'avg<500'], // File kecil: 95% < 1s, 99% < 1.5s, rata-rata < 500ms
    sav_medium_file_duration_ms: ['p(95)<2000', 'p(99)<3000', 'avg<1000'], // File sedang: 95% < 2s, 99% < 3s, rata-rata < 1s
    sav_large_file_duration_ms: ['p(95)<5000', 'p(99)<8000', 'avg<3000'], // File besar: 95% < 5s, 99% < 8s, rata-rata < 3s
    
    // === THRESHOLD ENDPOINT SPESIFIK ===
    sav_upload_success_rate: ['rate>0.95'], // Upload success rate > 95%
    sav_upload_file_size_kb: ['avg<200'], // Rata-rata ukuran file upload < 200KB
    sav_create_success_rate: ['rate>0.95'], // Create success rate > 95%
    sav_create_variable_count: ['avg<20'], // Rata-rata jumlah variabel < 20
    sav_create_record_count: ['avg<100'], // Rata-rata jumlah record < 100
    
    // === THRESHOLD SKENARIO SPESIFIK ===
    // Skenario upload file kecil
    sav_upload_small_success_rate: ['rate>0.98'], // File kecil success rate > 98%
    sav_upload_small_duration_ms: ['p(95)<800', 'p(99)<1200', 'avg<400'], // File kecil: sangat cepat
    
    // Skenario upload file sedang
    sav_upload_medium_success_rate: ['rate>0.95'], // File sedang success rate > 95%
    sav_upload_medium_duration_ms: ['p(95)<1500', 'p(99)<2500', 'avg<800'], // File sedang: cepat
    
    // Skenario upload file besar
    sav_upload_large_success_rate: ['rate>0.90'], // File besar success rate > 90%
    sav_upload_large_duration_ms: ['p(95)<4000', 'p(99)<6000', 'avg<2500'], // File besar: lebih lambat tapi masih acceptable
    
    // === THRESHOLD SKENARIO WRITE SAV ===
    // Metrik untuk skenario write SAV data kecil
    sav_write_small_success_rate: ['rate>0.95'], // Write data kecil success rate > 95%
    sav_write_small_duration_ms: ['p(95)<2000', 'p(99)<3000', 'avg<1000'], // Write data kecil: cepat
    
    // Metrik untuk skenario write SAV data sedang
    sav_write_medium_success_rate: ['rate>0.90'], // Write data sedang success rate > 90%
    sav_write_medium_duration_ms: ['p(95)<4000', 'p(99)<6000', 'avg<2000'], // Write data sedang: normal
    
    // Metrik untuk skenario write SAV data besar
    sav_write_large_success_rate: ['rate>0.85'], // Write data besar success rate > 85%
    sav_write_large_duration_ms: ['p(95)<8000', 'p(99)<12000', 'avg<4000'], // Write data besar: lebih lambat
    
    // === THRESHOLD PERFORMA API ===
    api_requests_per_second: ['rate>5'], // Minimal 5 requests per detik
    server_memory_usage_mb: ['value<1000'], // Memory usage < 1GB
    server_cpu_usage_percent: ['value<80'], // CPU usage < 80%
    active_connections_count: ['value<100'], // Maksimal 100 koneksi aktif
    
    // === THRESHOLD JARINGAN ===
    tcp_connection_time_ms: ['p(95)<500', 'avg<200'], // Koneksi TCP: 95% < 500ms, rata-rata < 200ms
    time_to_first_byte_ms: ['p(95)<1000', 'avg<500'], // TTFB: 95% < 1s, rata-rata < 500ms
    data_download_time_ms: ['p(95)<1500', 'avg<800'], // Download: 95% < 1.5s, rata-rata < 800ms
    data_upload_time_ms: ['p(95)<2000', 'avg<1000'], // Upload: 95% < 2s, rata-rata < 1s
    dns_resolution_time_ms: ['p(95)<100', 'avg<50'], // DNS: 95% < 100ms, rata-rata < 50ms
    tls_handshake_time_ms: ['p(95)<200', 'avg<100'], // TLS: 95% < 200ms, rata-rata < 100ms
    total_network_latency_ms: ['p(95)<300', 'avg<150'], // Total latency: 95% < 300ms, rata-rata < 150ms
    
    // === THRESHOLD KEBERHASILAN ===
    api_error_rate_percent: ['rate<0.05'], // Error rate < 5%
    api_success_rate_percent: ['rate>0.95'], // Success rate > 95%
    timeout_errors_total: ['count<5'], // Maksimal 5 timeout error
    server_errors_5xx_total: ['count<3'], // Maksimal 3 server error (5xx)
    client_errors_4xx_total: ['count<5'], // Maksimal 5 client error (4xx)
    
    // === THRESHOLD DATA TRANSFER ===
    request_payload_size_bytes: ['avg<10000'], // Request size rata-rata < 10KB
    response_payload_size_bytes: ['avg<50000'], // Response size rata-rata < 50KB
    total_data_transfer_kb: ['avg<1000'], // Total transfer rata-rata < 1MB
    
    // === THRESHOLD PEMROSESAN ===
    server_processing_time_ms: ['p(95)<2500', 'avg<1500'], // Processing: 95% < 2.5s, rata-rata < 1.5s
    request_queue_time_ms: ['p(95)<100', 'avg<50'], // Queue time: 95% < 100ms, rata-rata < 50ms
  },
};

// Setup function
export function setup() {
  console.log('Starting SAV API load test for Statify');
  
  // Base URL untuk API backend (sesuaikan dengan environment)
  const baseUrl = __ENV.BASE_URL || 'https://statify-dev.student.stis.ac.id';
  
  // Common headers for requests
  const headers = {
    'User-Agent': 'k6-load-tester',
    'Accept': 'application/json'
  };
  
  console.log(`Target API: ${baseUrl}`);
  
  return { 
    baseUrl: baseUrl,
    headers: headers, 
    startTime: Date.now() 
  };
}

// Test SAV read operation (upload endpoint)
/**
 * Test SAV File Upload Operation
 * Menguji endpoint POST /api/sav/upload untuk upload file SAV
 *.export function testSavRead(data) {
  // Daftar file contoh SAV yang tersedia di frontend berdasarkan ukuran
  // File kecil (< 5KB) - untuk testing performa optimal
  const smallFiles = [
    { name: 'accidents.sav', size: 0.96 },
    { name: 'advert.sav', size: 0.98 },
    { name: 'salesperformance.sav', size: 1.1 },
    { name: 'contacts.sav', size: 1.85 },
    { name: 'dietstudy.sav', size: 2.21 },
    { name: 'adl.sav', size: 3.71 },
    { name: 'behavior.sav', size: 3.73 }
  ];
  
  // File sedang (5KB - 100KB) - untuk testing performa normal
  const mediumFiles = [
    { name: 'ozone.sav', size: 10.44 },
    { name: 'satisf.sav', size: 13.83 },
    { name: 'workprog.sav', size: 17.02 },
    { name: 'Employee data.sav', size: 25.04 },
    { name: 'german_credit.sav', size: 30.58 },
    { name: 'tcm_kpi.sav', size: 33.2 },
    { name: 'car_sales.sav', size: 34.63 },
    { name: 'worldsales.sav', size: 41.49 },
    { name: 'bankloan.sav', size: 51.78 },
    { name: 'test_scores.sav', size: 74.97 }
  ];
  
  // File besar (> 100KB) - untuk testing performa dengan beban tinggi
  const largeFiles = [
    { name: 'telco.sav', size: 118.1 },
    { name: 'telco_extra.sav', size: 171.43 },
    { name: 'dmdata3.sav', size: 197.96 },
    { name: 'demo.sav', size: 284.08 },
    { name: 'patient_los.sav', size: 456.34 },
    { name: 'insurance_claims.sav', size: 503.38 },
    { name: 'poll_cs_sample.sav', size: 552.6 },
    { name: 'customer_dbase.sav', size: 1555.48 }
  ];
  
  // === PEMILIHAN FILE BERDASARKAN SKENARIO ===
  // Ambil kategori file dari environment variable skenario
  const fileSizeCategory = __ENV.FILE_SIZE_CATEGORY || 'mixed';
  let selectedFile;
  
  switch (fileSizeCategory) {
    case 'small':
      // Hanya file kecil (<5KB)
      selectedFile = smallFiles[Math.floor(Math.random() * smallFiles.length)];
      break;
    case 'medium':
      // Hanya file sedang (5KB-100KB)
      selectedFile = mediumFiles[Math.floor(Math.random() * mediumFiles.length)];
      break;
    case 'large':
      // Hanya file besar (>100KB)
      selectedFile = largeFiles[Math.floor(Math.random() * largeFiles.length)];
      break;
    default:
      // Mixed distribution: 40% kecil, 40% sedang, 20% besar
      const random = Math.random();
      if (random < 0.4) {
        selectedFile = smallFiles[Math.floor(Math.random() * smallFiles.length)];
      } else if (random < 0.8) {
        selectedFile = mediumFiles[Math.floor(Math.random() * mediumFiles.length)];
      } else {
        selectedFile = largeFiles[Math.floor(Math.random() * largeFiles.length)];
      }
  }
  
  // === SIMULASI RESOURCE MONITORING ===
  // Simulasi penggunaan memory server (100-600 MB)
  const simulatedMemory = Math.random() * 500 + 100;
  serverMemoryUsage.add(simulatedMemory);
  
  // Simulasi penggunaan CPU server (10-90%)
  const simulatedCpu = Math.random() * 80 + 10;
  serverCpuUsage.add(simulatedCpu);
  
  // Track jumlah koneksi aktif (berdasarkan VU)
  activeConnections.add(__VU);
  
  // === PERSIAPAN REQUEST ===
  // Simulasi multipart form data untuk upload file SAV
  // Karena k6 tidak bisa upload file asli, kita simulasi dengan data binary
  const fileContent = 'a'.repeat(Math.floor(selectedFile.size * 1024)); // Simulasi konten file
  
  const formData = {
    file: http.file(fileContent, selectedFile.name, 'application/octet-stream')
  };
  
  // Hitung ukuran request payload (estimasi)
  const requestSizeBytes = fileContent.length + selectedFile.name.length + 200; // +200 untuk headers multipart
  requestPayloadSize.add(requestSizeBytes);
  
  // Increment counter throughput API
  apiRequestsPerSecond.add(1);
  
  // === EKSEKUSI REQUEST ===
  const startTime = Date.now();
  const res = http.post(
    `${data.baseUrl}/api/sav/upload`, // Menggunakan endpoint yang benar
    formData,
    { 
      headers: {
        ...data.headers,
        // Content-Type akan di-set otomatis oleh k6 untuk multipart/form-data
      },
      timeout: '30s' // Timeout 30 detik untuk upload
    }
  );
  const endTime = Date.now();
  
  // === PENGUMPULAN METRIK TIMING ===
  // Catat waktu total operasi upload SAV
  const uploadDuration = endTime - startTime;
  savFileUploadTime.add(uploadDuration);
  
  // Collect detailed network timing metrics
  if (res.timings) {
    tcpConnectionTime.add(res.timings.connecting || 0);
    timeToFirstByte.add(res.timings.waiting || 0);
    dataDownloadTime.add(res.timings.receiving || 0);
    dataUploadTime.add(res.timings.sending || 0);
    dnsResolutionTime.add(res.timings.dns_lookup || 0);
    tlsHandshakeTime.add(res.timings.tls_handshaking || 0);
    
    // Hitung estimasi waktu pemrosesan server dan network latency
    const totalTime = res.timings.duration;
    const estimatedProcessingTime = totalTime * 0.6; // Estimasi 60% untuk processing
    const estimatedNetworkLatency = totalTime - estimatedProcessingTime;
    
    totalNetworkLatency.add(estimatedNetworkLatency);
    serverProcessingTime.add(estimatedProcessingTime);
    
    // Estimasi queue time berdasarkan connection time
    const estimatedQueueTime = res.timings.connecting * 0.3;
    requestQueueTime.add(estimatedQueueTime);
  }
  
  // === PENGUMPULAN METRIK RESPONSE ===
  // Ukuran response payload
  const responseSizeBytes = res.body ? res.body.length : 0;
  responsePayloadSize.add(responseSizeBytes);
  
  // Total data transfer dalam KB
  const totalTransferKb = (requestSizeBytes + responseSizeBytes) / 1024;
  totalDataTransfer.add(totalTransferKb);
  
  // === VALIDASI RESPONSE ===
  const checkRes = check(res, {
    'SAV upload berhasil (status 200/201)': (r) => r.status === 200 || r.status === 201,
    'SAV upload selesai dalam 3 detik': (r) => r.timings.duration < 3000,
    'Response size wajar (< 100KB)': (r) => responseSizeBytes < 100000,
    'Tidak ada timeout': (r) => r.status !== 0,
    'Response memiliki content': (r) => r.body && r.body.length > 0,
  });
  
  // === KATEGORISASI ERROR DAN SUCCESS RATE ===
  const isSuccess = res.status >= 200 && res.status < 300;
  const isClientError = res.status >= 400 && res.status < 500;
  const isServerError = res.status >= 500;
  const isTimeout = res.status === 0;
  
  // Update success dan error rates
  apiSuccessRate.add(isSuccess);
  apiErrorRate.add(!isSuccess);
  
  // Kategorisasi error berdasarkan jenis
  if (isTimeout) {
    timeoutErrors.add(1);
  }
  if (isServerError) {
    serverErrors.add(1);
  }
  if (isClientError) {
    clientErrors.add(1);
  }
  
  // Hitung total SAV operation errors
  if (!checkRes || !isSuccess) {
    savOperationErrors.add(1);
  }
  
  // === PENCATATAN METRIK ===
  // Record read operation time
  savReadTime.add(res.timings.duration);
  savFileUploadTime.add(res.timings.duration);
  
  // Metrik berdasarkan ukuran file
  if (selectedFile.size < 5) {
    savSmallFileTime.add(res.timings.duration);
  } else if (selectedFile.size <= 100) {
    savMediumFileTime.add(res.timings.duration);
  } else {
    savLargeFileTime.add(res.timings.duration);
  }
  
  // Metrik endpoint spesifik
  savUploadSuccessRate.add(isSuccess);
  savUploadFileSize.add(selectedFile.size);
  
  // Metrik skenario spesifik berdasarkan kategori file
  const fileSizeCategory = __ENV.FILE_SIZE_CATEGORY || 'mixed';
  switch (fileSizeCategory) {
    case 'small':
      savUploadSmallSuccessRate.add(isSuccess);
      savUploadSmallDuration.add(res.timings.duration);
      break;
    case 'medium':
      savUploadMediumSuccessRate.add(isSuccess);
      savUploadMediumDuration.add(res.timings.duration);
      break;
    case 'large':
      savUploadLargeSuccessRate.add(isSuccess);
      savUploadLargeDuration.add(res.timings.duration);
      break;
  }
  
  // === LOGGING UNTUK DEBUGGING ===
  const fileCategory = selectedFile.size < 5 ? 'small' : selectedFile.size < 100 ? 'medium' : 'large';
  const scenarioInfo = fileSizeCategory !== 'mixed' ? `[${fileSizeCategory.toUpperCase()}]` : '[MIXED]';
  
  if (!isSuccess) {
    console.log(`${scenarioInfo} SAV Upload Error - File: ${selectedFile.name} (${fileCategory}, ${selectedFile.size}KB), Status: ${res.status}, Duration: ${res.timings.duration}ms, Response Size: ${responseSizeBytes}B`);
  } else {
    console.log(`${scenarioInfo} SAV Upload Success - File: ${selectedFile.name} (${fileCategory}, ${selectedFile.size}KB), Duration: ${res.timings.duration}ms`);
  }
  
  return res;
}

/**
 * Test SAV File Create Operation
 * Menguji endpoint POST /api/sav/create untuk membuat file SAV baru
 */
export function testSavWrite(data) {
  // === SIMULASI RESOURCE MONITORING ===
  // Write operations menggunakan lebih banyak memory (150-750 MB)
  const simulatedMemory = Math.random() * 600 + 150;
  serverMemoryUsage.add(simulatedMemory);
  
  // Write operations menggunakan lebih banyak CPU (15-95%)
  const simulatedCpu = Math.random() * 80 + 15;
  serverCpuUsage.add(simulatedCpu);
  
  // Track jumlah koneksi aktif
  activeConnections.add(__VU);
  
  // === PERSIAPAN DATA SAV ===
  // Tentukan ukuran data berdasarkan kategori
  const dataSizeCategory = __ENV.DATA_SIZE_CATEGORY || 'mixed';
  
  // Template data berdasarkan jenis dataset yang umum digunakan
  const dataTemplates = [
    {
      type: 'customer_survey',
      variables: [
        { name: 'customer_id', label: 'ID Pelanggan', type: 'NUMERIC', width: 8, decimal: 0, measure: 'NOMINAL' },
        { name: 'age', label: 'Usia', type: 'NUMERIC', width: 3, decimal: 0, measure: 'SCALE' },
        { name: 'gender', label: 'Jenis Kelamin', type: 'STRING', width: 10, decimal: 0, measure: 'NOMINAL' },
        { name: 'satisfaction', label: 'Tingkat Kepuasan', type: 'NUMERIC', width: 2, decimal: 0, measure: 'ORDINAL' },
        { name: 'income', label: 'Pendapatan', type: 'NUMERIC', width: 12, decimal: 2, measure: 'SCALE' }
      ],
      sampleData: [
        { customer_id: 1, age: 25, gender: 'Male', satisfaction: 4, income: 5000000.50 },
        { customer_id: 2, age: 30, gender: 'Female', satisfaction: 5, income: 6500000.75 },
        { customer_id: 3, age: 35, gender: 'Male', satisfaction: 3, income: 7200000.00 }
      ]
    },
    {
      type: 'employee_data',
      variables: [
        { name: 'emp_id', label: 'Employee ID', type: 'NUMERIC', width: 6, decimal: 0, measure: 'NOMINAL' },
        { name: 'department', label: 'Department', type: 'STRING', width: 15, decimal: 0, measure: 'NOMINAL' },
        { name: 'salary', label: 'Salary', type: 'NUMERIC', width: 10, decimal: 2, measure: 'SCALE' },
        { name: 'performance', label: 'Performance Rating', type: 'NUMERIC', width: 3, decimal: 1, measure: 'SCALE' },
        { name: 'years_service', label: 'Years of Service', type: 'NUMERIC', width: 2, decimal: 0, measure: 'SCALE' }
      ],
      sampleData: [
        { emp_id: 101, department: 'IT', salary: 8500000.00, performance: 4.2, years_service: 3 },
        { emp_id: 102, department: 'HR', salary: 7200000.00, performance: 3.8, years_service: 5 },
        { emp_id: 103, department: 'Finance', salary: 9100000.00, performance: 4.5, years_service: 7 }
      ]
    },
    {
      type: 'sales_data',
      variables: [
        { name: 'transaction_id', label: 'Transaction ID', type: 'NUMERIC', width: 8, decimal: 0, measure: 'NOMINAL' },
        { name: 'product_category', label: 'Product Category', type: 'STRING', width: 20, decimal: 0, measure: 'NOMINAL' },
        { name: 'sales_amount', label: 'Sales Amount', type: 'NUMERIC', width: 12, decimal: 2, measure: 'SCALE' },
        { name: 'region', label: 'Sales Region', type: 'STRING', width: 15, decimal: 0, measure: 'NOMINAL' },
        { name: 'quarter', label: 'Quarter', type: 'NUMERIC', width: 1, decimal: 0, measure: 'ORDINAL' }
      ],
      sampleData: [
        { transaction_id: 1001, product_category: 'Electronics', sales_amount: 2500000.00, region: 'Jakarta', quarter: 1 },
        { transaction_id: 1002, product_category: 'Clothing', sales_amount: 1200000.00, region: 'Surabaya', quarter: 1 },
        { transaction_id: 1003, product_category: 'Books', sales_amount: 350000.00, region: 'Bandung', quarter: 2 }
      ]
    }
  ];
  
  // Pilih template secara acak
  const selectedTemplate = dataTemplates[Math.floor(Math.random() * dataTemplates.length)];
  
  // === GENERATE DATA BERDASARKAN KATEGORI UKURAN ===
  let generatedData = [...selectedTemplate.sampleData];
  
  // Tentukan jumlah record berdasarkan kategori
  let targetRecords;
  switch (dataSizeCategory) {
    case 'small':
      targetRecords = Math.floor(Math.random() * 10) + 5; // 5-15 records
      break;
    case 'medium':
      targetRecords = Math.floor(Math.random() * 50) + 25; // 25-75 records
      break;
    case 'large':
      targetRecords = Math.floor(Math.random() * 200) + 100; // 100-300 records
      break;
    default:
      targetRecords = Math.floor(Math.random() * 50) + 10; // 10-60 records (mixed)
  }
  
  // Generate data tambahan jika diperlukan
  while (generatedData.length < targetRecords) {
    const baseRecord = selectedTemplate.sampleData[Math.floor(Math.random() * selectedTemplate.sampleData.length)];
    const newRecord = { ...baseRecord };
    
    // Modifikasi beberapa field untuk variasi data
    Object.keys(newRecord).forEach(key => {
      const variable = selectedTemplate.variables.find(v => v.name === key);
      if (variable && variable.type === 'NUMERIC') {
        if (variable.measure === 'SCALE') {
          // Untuk data skala, tambahkan variasi
          newRecord[key] = newRecord[key] * (0.8 + Math.random() * 0.4); // ±20% variasi
        } else if (variable.measure === 'NOMINAL' || variable.measure === 'ORDINAL') {
          // Untuk data nominal/ordinal, gunakan nilai yang ada atau increment
          newRecord[key] = newRecord[key] + Math.floor(Math.random() * 1000);
        }
      }
    });
    
    generatedData.push(newRecord);
  }
  
  // === PERSIAPAN REQUEST ===
  // Struktur JSON yang benar untuk API createSavFile
  const createPayload = {
    variables: selectedTemplate.variables,
    data: generatedData
  };
  
  // Hitung ukuran request payload
  const requestSizeBytes = JSON.stringify(createPayload).length;
  requestPayloadSize.add(requestSizeBytes);
  
  // Increment counter throughput API
  apiRequestsPerSecond.add(1);
  
  // === EKSEKUSI REQUEST ===
  const startTime = Date.now();
  const res = http.post(
    `${data.baseUrl}/api/sav/create`, // Menggunakan endpoint yang benar
    JSON.stringify(createPayload),
    { 
      headers: {
        ...data.headers,
        'Content-Type': 'application/json'
      },
      timeout: '60s' // Timeout 60 detik untuk create operation
    }
  );
  const endTime = Date.now();
  
  // === PENGUMPULAN METRIK TIMING ===
  // Catat waktu total operasi create SAV
  const createDuration = endTime - startTime;
  savFileCreateTime.add(createDuration);
  
  // Collect detailed network timing metrics
  if (res.timings) {
    tcpConnectionTime.add(res.timings.connecting || 0);
    timeToFirstByte.add(res.timings.waiting || 0);
    dataUploadTime.add(res.timings.sending || 0); // Upload time untuk write operations
    dataDownloadTime.add(res.timings.receiving || 0);
    dnsResolutionTime.add(res.timings.dns_lookup || 0);
    tlsHandshakeTime.add(res.timings.tls_handshaking || 0);
    
    // Hitung estimasi waktu pemrosesan server dan network latency
    // Write operations membutuhkan lebih banyak processing time
    const totalTime = res.timings.duration;
    const estimatedProcessingTime = totalTime * 0.7; // 70% untuk processing
    const estimatedNetworkLatency = totalTime - estimatedProcessingTime;
    
    totalNetworkLatency.add(estimatedNetworkLatency);
    serverProcessingTime.add(estimatedProcessingTime);
    
    // Estimasi queue time untuk write operations (biasanya lebih lama)
    const estimatedQueueTime = res.timings.connecting * 0.4;
    requestQueueTime.add(estimatedQueueTime);
  }
  
  // === PENGUMPULAN METRIK RESPONSE ===
  // Ukuran response payload
  const responseSizeBytes = res.body ? res.body.length : 0;
  responsePayloadSize.add(responseSizeBytes);
  
  // Total data transfer dalam KB
  const totalTransferKb = (requestSizeBytes + responseSizeBytes) / 1024;
  totalDataTransfer.add(totalTransferKb);
  
  // === VALIDASI RESPONSE ===
  const checkRes = check(res, {
    'SAV create berhasil (status 200/201)': (r) => r.status === 200 || r.status === 201,
    'SAV create selesai dalam 5 detik': (r) => r.timings.duration < 5000,
    'Response size wajar (< 200KB)': (r) => responseSizeBytes < 200000,
    'Tidak ada timeout': (r) => r.status !== 0,
    'Upload payload berhasil (< 3s)': (r) => r.timings.sending < 3000,
    'Response memiliki content': (r) => r.body && r.body.length > 0,
  });
  
  // === KATEGORISASI ERROR DAN SUCCESS RATE ===
  const isSuccess = res.status >= 200 && res.status < 300;
  const isClientError = res.status >= 400 && res.status < 500;
  const isServerError = res.status >= 500;
  const isTimeout = res.status === 0;
  
  // Update success dan error rates
  apiSuccessRate.add(isSuccess);
  apiErrorRate.add(!isSuccess);
  
  // Kategorisasi error berdasarkan jenis
  if (isTimeout) {
    timeoutErrors.add(1);
  }
  if (isServerError) {
    serverErrors.add(1);
  }
  if (isClientError) {
    clientErrors.add(1);
  }
  
  // === PENCATATAN METRIK ===
  savWriteTime.add(res.timings.duration);
  savFileCreateTime.add(res.timings.duration);
  
  // Metrik endpoint spesifik
  savCreateSuccessRate.add(isSuccess);
  savCreateVariableCount.add(createPayload.variables.length);
  savCreateRecordCount.add(createPayload.data.length);
  
  if (!isSuccess) {
    savOperationErrors.add(1);
  }
  
  // === METRIK SKENARIO WRITE BERDASARKAN KATEGORI ===
  // Metrik berdasarkan kategori ukuran data
  switch (dataSizeCategory) {
    case 'small':
      savWriteSmallSuccessRate.add(isSuccess);
      savWriteSmallDuration.add(res.timings.duration);
      break;
    case 'medium':
      savWriteMediumSuccessRate.add(isSuccess);
      savWriteMediumDuration.add(res.timings.duration);
      break;
    case 'large':
      savWriteLargeSuccessRate.add(isSuccess);
      savWriteLargeDuration.add(res.timings.duration);
      break;
  }

  // === LOGGING UNTUK DEBUGGING ===
  const categoryInfo = dataSizeCategory !== 'mixed' ? `[${dataSizeCategory.toUpperCase()}]` : '[MIXED]';
  
  if (!isSuccess) {
    console.log(`${categoryInfo} SAV Write Error - Template: ${selectedTemplate.type}, Status: ${res.status}, Duration: ${res.timings.duration}ms, Response Size: ${responseSizeBytes}B, Records: ${createPayload.data.length}`);
  } else {
    console.log(`${categoryInfo} SAV Write Success - Template: ${selectedTemplate.type}, Variables: ${createPayload.variables.length}, Records: ${createPayload.data.length}, Duration: ${res.timings.duration}ms`);
  }
   
   return res;
}

// Main test function
export default function(data) {
  // Increment request counter
  apiRequestsPerSecond.add(1);
  
  // Tentukan operasi berdasarkan nama skenario yang sedang berjalan
  const scenarioName = __ENV.K6_SCENARIO || 'default';
  
  if (scenarioName.includes('upload')) {
    // Skenario upload (small, medium, large files)
    testSavRead(data);
  } else if (scenarioName.includes('create')) {
    // Skenario create SAV file
    testSavWrite(data);
  } else {
    // Default: campuran operasi (60% read, 40% write)
    const operation = Math.random() < 0.6 ? 'read' : 'write';
    if (operation === 'read') {
      testSavRead(data);
    } else {
      testSavWrite(data);
    }
  }
  
  // Simulate user think time
  sleep(Math.random() * 2 + 1); // Sleep between 1-3 seconds
}

// Teardown function
export function teardown(data) {
  console.log('SAV API load test completed');
  console.log(`Total test duration: ${(Date.now() - data.startTime) / 1000} seconds`);
}
