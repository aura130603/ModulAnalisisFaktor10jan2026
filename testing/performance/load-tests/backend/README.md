# Backend Load Tests

This directory contains load tests for the Statify backend APIs.

## Test Scripts

### Core SAV Tests
1. **sav-small-files-test.js** - 📖 **Test untuk file SAV berukuran kecil**
   - 3 skenario: Read Small, Download Small, Mixed Small Operations
   - Fokus pada file kecil (0.96KB - 5.76KB) untuk testing cepat
   - Interval tidur pendek untuk throughput tinggi
   - **Tujuan**: Testing performa operasi pada file kecil

2. **sav-large-files-only-test.js** - 🎯 **Test untuk file SAV berukuran besar**
   - 3 skenario: Read Large, Download Large, Mixed Large Operations
   - Fokus pada file besar (156KB - 1.55MB) dengan anti rate limit
   - Sleep interval panjang (12-25 detik) antar request
   - VU count konservatif (maksimal 5 VUs)
   - **Tujuan**: Testing performa file besar tanpa rate limiting



## Running Tests

From the project root directory (`d:\Data\statify`):

```bash
# Test file SAV kecil - operasi read
k6 run --env OPERATION_TYPE=read --env FILE_SIZE=small testing/performance/load-tests/backend/sav-small-files-test.js

# Test file SAV kecil - operasi download
k6 run --env OPERATION_TYPE=download --env FILE_SIZE=small testing/performance/load-tests/backend/sav-small-files-test.js

# Test file SAV besar - operasi read
k6 run --env OPERATION_TYPE=read --env FILE_SIZE=large testing/performance/load-tests/backend/sav-large-files-only-test.js

# Test file SAV besar - operasi download
k6 run --env OPERATION_TYPE=download --env FILE_SIZE=large testing/performance/load-tests/backend/sav-large-files-only-test.js

# Jalankan semua skenario (read, download, mixed):
k6 run testing/performance/load-tests/backend/sav-small-files-test.js
k6 run testing/performance/load-tests/backend/sav-large-files-only-test.js
```

## Troubleshooting

### Error: "moduleSpecifier couldn't be found on local disk"

**Penyebab umum:**
1. **Path file salah atau terpotong** - Pastikan ekstensi `.js` lengkap
2. **Working directory salah** - Pastikan Anda berada di direktori root project (`d:\Data\statify`)
3. **File tidak ada** - Periksa keberadaan file dengan `ls testing/performance/load-tests/backend/`

**Solusi:**
```bash
# Pastikan Anda di direktori yang benar
cd d:\Data\statify

# Periksa file yang ada
ls testing/performance/load-tests/backend/

# Jalankan dengan path lengkap dan benar
k6 run testing/performance/load-tests/backend/sav-small-files-test.js
```

## Rekomendasi Penggunaan

### Untuk Testing File Kecil (Cepat & Efisien):
```bash
# Test read file kecil (0.96KB - 5.76KB)
k6 run --env OPERATION_TYPE=read --env FILE_SIZE=small testing/performance/load-tests/backend/sav-small-files-test.js

# Test download file kecil
k6 run --env OPERATION_TYPE=download --env FILE_SIZE=small testing/performance/load-tests/backend/sav-small-files-test.js

# Test semua skenario (read, download, mixed)
k6 run testing/performance/load-tests/backend/sav-small-files-test.js
```

### Untuk Testing File Besar (Anti Rate Limit):
```bash
# Test read file besar (156KB - 1.55MB)
k6 run --env OPERATION_TYPE=read --env FILE_SIZE=large testing/performance/load-tests/backend/sav-large-files-only-test.js

# Test download file besar
k6 run --env OPERATION_TYPE=download --env FILE_SIZE=large testing/performance/load-tests/backend/sav-large-files-only-test.js

# Test semua skenario (read, download, mixed)
k6 run testing/performance/load-tests/backend/sav-large-files-only-test.js
```

### Strategi Testing:
1. **Development**: Mulai dengan file kecil untuk feedback cepat
2. **Pre-Production**: Test file besar untuk memastikan performa
3. **Load Testing**: Kombinasi keduanya sesuai kebutuhan
4. **Rate Limit Avoidance**: Gunakan file besar dengan interval panjang
