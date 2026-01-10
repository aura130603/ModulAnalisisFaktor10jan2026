# Specific Pages Load Test

Load test khusus untuk menguji performa halaman-halaman spesifik dalam aplikasi Statify.

## Halaman yang Diuji

1. **Dashboard Data Page** (`/dashboard/data`) - Halaman manajemen data utama
2. **Help Page** (`/help`) - Halaman bantuan dan dokumentasi
3. **Landing Page** (`/landing`) - Halaman utama aplikasi

## Skenario Test

### 1. Dashboard Data Load Test
- **Virtual Users**: 5 → 20 → 0
- **Durasi**: 3 menit total (30s ramp-up, 2m steady, 30s ramp-down)
- **Target**: Menguji performa halaman data management dengan beban tinggi
- **Simulasi**: User yang mengakses dan berinteraksi dengan data

### 2. Help Page Load Test
- **Virtual Users**: 3 → 15 → 0
- **Durasi**: 3 menit total (30s ramp-up, 2m steady, 30s ramp-down)
- **Target**: Menguji performa halaman bantuan
- **Simulasi**: User yang membaca dokumentasi (waktu baca lebih lama)

### 3. Landing Page Load Test
- **Virtual Users**: 8 → 25 → 0
- **Durasi**: 3 menit total (30s ramp-up, 2m steady, 30s ramp-down)
- **Target**: Menguji performa halaman utama dengan beban tertinggi
- **Simulasi**: User baru yang mengakses aplikasi

### 4. Mixed Navigation Test
- **Virtual Users**: 5 → 15 → 0
- **Durasi**: 4.5 menit total (45s ramp-up, 3m steady, 45s ramp-down)
- **Target**: Simulasi navigasi user yang realistis
- **Flow**: Landing → Help → Dashboard/Data

## Metrics yang Dimonitor

### Performance Metrics
- **Page Load Time**: Waktu loading halaman (target: p95 < 2.5s)
- **Connection Time**: Waktu koneksi (target: p95 < 250ms)
- **TTFB**: Time to First Byte (target: p95 < 500ms)
- **Download Time**: Waktu download (target: p95 < 800ms)

### Error Metrics
- **Error Rate**: Tingkat error (target: < 3%)
- **Success Rate**: Tingkat sukses (target: > 97%)
- **HTTP Failures**: Kegagalan HTTP (target: < 3%)

### Network Metrics
- **Response Size**: Ukuran response (target: avg < 150KB)
- **Network Latency**: Latensi jaringan (target: p95 < 150ms)
- **DNS Lookup**: Waktu DNS lookup (target: p95 < 80ms)
- **TLS Handshake**: Waktu TLS handshake (target: p95 < 150ms)

### User Experience Metrics
- **Processing Time**: Waktu pemrosesan (target: p95 < 300ms)
- **Rendering Time**: Waktu rendering (target: p95 < 400ms)
- **Interactivity Time**: Waktu interaktivitas (target: p95 < 500ms)
- **User Journey Time**: Waktu total user journey (target: p95 < 6s)
- **Navigation Speed**: Kecepatan navigasi (target: p95 < 1s)

## Cara Menjalankan Test

### Dari Root Directory
```bash
# Jalankan specific pages load test
k6 run testing/performance/load-tests/frontend/specific-pages-load-test.js

# Dengan output ke file
k6 run --out json=specific-pages-results.json testing/performance/load-tests/frontend/specific-pages-load-test.js

# Dengan custom thresholds
k6 run --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" testing/performance/load-tests/frontend/specific-pages-load-test.js
```

### Dari Performance Directory
```bash
cd testing/performance
k6 run load-tests/frontend/specific-pages-load-test.js
```

## Interpretasi Hasil

### ✅ Test Berhasil Jika:
- Semua threshold terpenuhi
- Error rate < 3%
- Page load time p95 < 2.5 detik
- Success rate > 97%

### ⚠️ Perlu Perhatian Jika:
- Error rate 3-5%
- Page load time p95 2.5-4 detik
- Response time meningkat signifikan

### ❌ Test Gagal Jika:
- Error rate > 5%
- Page load time p95 > 4 detik
- Banyak timeout atau connection errors

## Optimisasi Berdasarkan Hasil

### Jika Dashboard/Data Lambat:
- Periksa query database
- Optimisasi loading data
- Implementasi lazy loading
- Cache data yang sering diakses

### Jika Help Page Lambat:
- Optimisasi asset statis
- Implementasi CDN
- Compress images dan content

### Jika Landing Page Lambat:
- Optimisasi critical rendering path
- Minimize JavaScript bundle
- Optimize images dan fonts
- Implementasi service worker

### Jika Mixed Navigation Lambat:
- Implementasi prefetching
- Optimisasi routing
- Cache navigation state
- Reduce JavaScript execution time

## Konfigurasi Environment

### Development
```bash
# Test dengan beban ringan
k6 run --vus 5 --duration 1m testing/performance/load-tests/frontend/specific-pages-load-test.js
```

### Staging
```bash
# Test dengan beban sedang (default)
k6 run testing/performance/load-tests/frontend/specific-pages-load-test.js
```

### Production Simulation
```bash
# Test dengan beban tinggi
k6 run --vus 50 --duration 5m testing/performance/load-tests/frontend/specific-pages-load-test.js
```

## Monitoring dan Alerting

### Real-time Monitoring
- Gunakan k6 dashboard untuk monitoring real-time
- Monitor system resources (CPU, Memory, Network)
- Watch for error spikes

### Post-test Analysis
- Analisis trend metrics
- Bandingkan dengan baseline performance
- Identifikasi bottlenecks
- Generate performance report

## Troubleshooting

### Common Issues
1. **High Error Rate**: Periksa server capacity dan database connections
2. **Slow Response**: Analisis network latency dan server processing time
3. **Memory Issues**: Monitor memory usage dan garbage collection
4. **Timeout Errors**: Increase timeout values atau optimize server response

### Debug Commands
```bash
# Run dengan verbose output
k6 run --verbose testing/performance/load-tests/frontend/specific-pages-load-test.js

# Run dengan custom log level
k6 run --log-output=stdout --logformat=json testing/performance/load-tests/frontend/specific-pages-load-test.js
```