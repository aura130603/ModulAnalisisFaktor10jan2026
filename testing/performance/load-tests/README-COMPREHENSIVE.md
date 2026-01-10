# 📊 Statify Comprehensive Load Testing & Dashboard

Sistem load testing yang komprehensif untuk aplikasi Statify dengan dashboard visualisasi real-time.

## 🚀 Fitur Utama

### ✅ Metrik Komprehensif
- **HTTP Performance**: Response time, throughput, error rates
- **Backend SAV Operations**: Read/write performance, processing time
- **Frontend Performance**: Page load time, Web Vitals, user experience
- **Network Metrics**: DNS lookup, connection time, TLS handshake
- **Resource Usage**: Memory, CPU, data transfer
- **Error Analysis**: Categorized error tracking (client, server, timeout)
- **Advanced Metrics**: Queue time, processing time, cache efficiency

### 📈 Dashboard Interaktif
- **Real-time Visualization**: Chart.js powered interactive charts
- **Multiple Data Sources**: Demo data, real-time monitoring, file import
- **Responsive Design**: Modern UI yang bekerja di semua device
- **Export Capabilities**: JSON, CSV, HTML reports
- **Summary Cards**: Key metrics overview
- **Detailed Analytics**: Comprehensive performance breakdown

### 🧪 Test Scenarios
- **Basic Load Testing**: Standard user load simulation
- **Route Testing**: Comprehensive frontend route coverage
- **SAV API Testing**: Backend SPSS file operations
- **Spike Testing**: Sudden traffic surge simulation
- **Stress Testing**: System endurance under high load

## 📁 Struktur File

```
load-tests/
├── 📊 dashboard/
│   ├── index.html          # Dashboard utama
│   ├── dashboard.js        # Logic dashboard
│   ├── dashboard.css       # Styling dashboard
│   └── [generated files]   # Output dari test
├── 🔧 backend/
│   └── sav-apis-test.js    # Test SAV API (enhanced)
├── 🌐 frontend/
│   ├── basic-load-test.js  # Basic frontend test (enhanced)
│   └── frontend-routes-test.js # Routes test (enhanced)
├── 🚀 run-comprehensive-tests.js # Main test runner
├── 📜 run-dashboard.ps1    # PowerShell runner
├── 📜 run-dashboard.bat    # Batch runner
├── ⚙️ k6.config.json      # K6 configuration
└── 📖 README-COMPREHENSIVE.md # Dokumentasi ini
```

## 🛠️ Installation & Setup

### Prerequisites
1. **K6 Load Testing Tool**
   ```bash
   # Windows (Chocolatey)
   choco install k6
   
   # Windows (Scoop)
   scoop install k6
   
   # Manual download
   # https://k6.io/docs/getting-started/installation/
   ```

2. **Node.js & NPM** (untuk script runner)
   ```bash
   node --version  # v16+ recommended
   npm --version
   ```

### Verifikasi Installation
```bash
k6 version
# Expected output: k6 v0.x.x
```

## 🚀 Quick Start

### Method 1: NPM Scripts (Recommended)
```bash
# Run comprehensive testing dengan dashboard
npm run test:load:dashboard

# Atau gunakan batch file
npm run test:load:dashboard:bat

# Run hanya comprehensive test
npm run test:load:comprehensive

# Buka dashboard yang sudah ada
npm run dashboard:open
```

### Method 2: Direct Execution
```bash
# PowerShell (Windows)
cd load-tests
powershell -ExecutionPolicy Bypass -File run-dashboard.ps1

# Command Prompt (Windows)
cd load-tests
run-dashboard.bat

# Manual K6 execution
k6 run --out json=dashboard/raw-metrics.json run-comprehensive-tests.js
```

### Method 3: Individual Tests
```bash
# Backend SAV API testing
npm run test:load:sav

# Frontend basic testing
npm run test:load:basic

# Frontend routes testing
npm run test:load:routes

# Quick smoke test
npm run test:load:smoke
```

## 📊 Dashboard Usage

### 🎛️ Controls
- **Data Source**: 
  - `Demo`: Simulated realistic data
  - `Real-time`: Live monitoring (WebSocket)
  - `File`: Import dari test results
- **Refresh Rate**: 1-10 seconds interval
- **Start/Stop**: Control monitoring
- **Export**: Download data sebagai JSON

### 📈 Charts Available
1. **Response Time**: Average & P95 response times
2. **Throughput**: Requests/sec & Virtual Users
3. **Error Rates**: Success vs Error percentages
4. **Network Performance**: DNS, Connection, TLS times
5. **SAV Operations**: Read/Write operation times
6. **Resource Usage**: Memory & CPU utilization
7. **Data Transfer**: Transfer sizes over time
8. **Processing Time**: Queue & Processing times

### 📋 Summary Cards
- Total Requests
- Success Rate
- Average Response Time
- Current Virtual Users
- Total Errors
- Throughput

## 🔧 Configuration

### Test Scenarios Configuration
Edit `run-comprehensive-tests.js` untuk mengubah:
```javascript
export const options = {
  scenarios: {
    sav_operations: {
      executor: 'ramping-vus',
      startVUs: 5,        // Starting virtual users
      stages: [
        { duration: '2m', target: 20 },  // Ramp up
        { duration: '5m', target: 20 },  // Sustain
        { duration: '2m', target: 0 },   // Ramp down
      ],
    },
    // ... other scenarios
  }
};
```

### Thresholds Configuration
```javascript
thresholds: {
  http_req_duration: ['p(95)<1000'],     // 95% under 1s
  http_req_failed: ['rate<0.05'],        // <5% failure rate
  sav_read_time: ['p(95)<800'],          // SAV read under 800ms
  // ... other thresholds
}
```

### Dashboard Configuration
Edit `dashboard/dashboard.js`:
```javascript
// Chart update interval
const refreshRate = 2000; // 2 seconds

// Maximum data points
const maxDataPoints = 50;

// Chart colors and styling
const chartConfig = {
  // ... configuration
};
```

## 📈 Metrik yang Dikumpulkan

### 🌐 HTTP & Network Metrics
- `http_req_duration`: Response time (avg, p95, p99)
- `http_req_failed`: Request failure rate
- `http_reqs`: Total requests & requests/sec
- `connection_time`: TCP connection establishment
- `dns_lookup_time`: DNS resolution time
- `tls_handshake_time`: TLS/SSL handshake time
- `ttfb`: Time to First Byte
- `network_latency`: Total network latency

### 🔧 Backend SAV Metrics
- `sav_read_time`: SAV file read operation time
- `sav_write_time`: SAV file write operation time
- `sav_errors`: SAV operation errors
- `processing_time`: Server processing time
- `queue_time`: Request queue waiting time

### 🌐 Frontend Metrics
- `page_load_time`: Complete page load time
- `frontend_errors`: Frontend-specific errors
- `dom_content_loaded`: DOM ready time
- `first_contentful_paint`: FCP Web Vital
- `largest_contentful_paint`: LCP Web Vital
- `cumulative_layout_shift`: CLS Web Vital
- `first_input_delay`: FID Web Vital
- `cache_hit_rate`: Browser cache efficiency

### 💾 Resource Metrics
- `memory_usage_mb`: Memory consumption
- `cpu_usage_percent`: CPU utilization
- `data_transfer_size_kb`: Data transfer volume
- `response_size_bytes`: Response payload size
- `request_size_bytes`: Request payload size

### ❌ Error Metrics
- `error_rate`: Overall error rate
- `success_rate`: Success rate
- `timeout_errors`: Request timeout count
- `server_errors`: 5xx HTTP errors
- `client_errors`: 4xx HTTP errors

## 📊 Output Files

Setelah menjalankan test, file berikut akan dibuat di `dashboard/`:

- `test-results.html`: HTML report dengan visualisasi
- `metrics-summary.json`: Summary data untuk dashboard
- `detailed-metrics.json`: Detailed metrics data
- `raw-metrics.json`: Raw K6 output
- `metrics-export.csv`: CSV export untuk analisis
- `metrics-timeseries.csv`: Time series data
- `test-status.json`: Test execution status

## 🎯 Best Practices

### 🧪 Testing Strategy
1. **Start Small**: Mulai dengan smoke test
2. **Gradual Increase**: Tingkatkan load secara bertahap
3. **Monitor Resources**: Pantau server resources
4. **Baseline Establishment**: Buat baseline performance
5. **Regular Testing**: Jalankan test secara berkala

### 📊 Dashboard Usage
1. **Real-time Monitoring**: Gunakan untuk live monitoring
2. **Historical Analysis**: Import test results untuk analisis
3. **Export Data**: Simpan data untuk reporting
4. **Threshold Monitoring**: Pantau threshold violations

### 🔧 Performance Tuning
1. **Identify Bottlenecks**: Gunakan metrik untuk identifikasi
2. **Optimize Critical Paths**: Focus pada operasi penting
3. **Monitor Trends**: Pantau performa dari waktu ke waktu
4. **Set Realistic Thresholds**: Sesuaikan dengan requirements

## 🐛 Troubleshooting

### Common Issues

#### K6 Not Found
```bash
# Error: 'k6' is not recognized
# Solution: Install K6 dan pastikan ada di PATH
k6 version
```

#### Dashboard Not Opening
```bash
# Check if files exist
ls dashboard/

# Manual open
start dashboard/index.html
```

#### Test Failures
```bash
# Check thresholds
# Edit thresholds di run-comprehensive-tests.js
# Atau individual test files
```

#### No Data in Dashboard
```bash
# Check if test generated output files
ls dashboard/*.json

# Run test with verbose output
k6 run --verbose run-comprehensive-tests.js
```

### Performance Issues

#### High Memory Usage
- Reduce `maxDataPoints` di dashboard.js
- Decrease refresh rate
- Close other applications

#### Slow Test Execution
- Reduce VU count in scenarios
- Decrease test duration
- Check network connectivity

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Load Testing
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install K6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Run Load Tests
        run: npm run test:load:comprehensive
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: load-tests/dashboard/
```

## 📚 Additional Resources

- [K6 Documentation](https://k6.io/docs/)
- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Load Testing Best Practices](https://k6.io/docs/testing-guides/)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Add/modify tests atau dashboard features
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**🎉 Happy Load Testing!** 

Untuk pertanyaan atau issues, silakan buat GitHub issue atau hubungi tim development.