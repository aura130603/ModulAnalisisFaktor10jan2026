# 📊 Hasil Test - Lokasi File

## 🎯 Lokasi Hasil Test Terkonsolidasi

### 🎭 **Playwright (E2E Tests)**
**Lokasi hasil:** `testing/reports/e2e/`
- **HTML reports:** `testing/reports/e2e/index.html`
- **Screenshots:** `testing/reports/e2e/test-failure-screenshots/`
- **Videos:** `testing/reports/e2e/videos/`
- **Trace files:** `testing/reports/e2e/trace/`

### ⚡ **k6 (Performance Tests)**
**Lokasi hasil:** `testing/reports/performance/`
- **Summary reports:** `testing/reports/performance/summary.json`
- **Detailed logs:** `testing/reports/performance/detailed-report.html`
- **CSV exports:** `testing/reports/performance/metrics.csv`

### 📁 **Struktur Lengkap:**
```
testing/
├── reports/
│   ├── e2e/
│   │   ├── index.html           # Playwright HTML report
│   │   ├── trace/              # Detailed traces
│   │   ├── screenshots/        # Failure screenshots
│   │   └── videos/            # Test recordings
│   └── performance/
│       ├── summary.json        # k6 summary
│       ├── detailed.html       # Detailed performance report
│       └── metrics.csv         # Raw metrics data
```

### 🚀 **Cara Akses Hasil:**

**Playwright:**
```bash
cd testing
npx playwright show-report reports/e2e
# Atau buka: testing/reports/e2e/index.html
```

**k6:**
```bash
cd testing
k6 run performance/scenarios/load-test.js --out json=reports/performance/results.json
```

### 📊 **Command untuk melihat hasil:**
```bash
# Playwright results
npm run test:e2e:report

# k6 results  
k6 show testing/reports/performance/summary.json
```

**Semua hasil test sekarang terpusat di `testing/reports/` untuk kemudahan akses!**
