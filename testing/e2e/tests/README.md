# Statify Testing Directory

Direktori ini berisi semua file pengujian untuk aplikasi Statify yang telah diorganisir dengan struktur yang rapi.

## Struktur Direktori

```
tests/
├── docs/                    # Dokumentasi pengujian
│   ├── CROSS_BROWSER_TESTING.md
│   ├── QUICK_START_GUIDE.md
│   ├── README.md
│   └── TESTING_STANDARDS.md
├── fixtures/                # Data dan helper untuk pengujian
│   └── helpers/
├── scripts/                 # Script untuk menjalankan pengujian
│   └── run-cross-browser-tests.ps1
├── specs/                   # File pengujian aktual
│   ├── descriptive-analysis.spec.ts
│   └── frequencies-analysis.spec.ts
└── templates/               # Template untuk membuat pengujian baru
    └── TEMPLATE.spec.ts
```

## Deskripsi Folder

### `/docs`
Berisi semua dokumentasi terkait pengujian:
- **TESTING_STANDARDS.md**: Standar dan aturan pengujian
- **QUICK_START_GUIDE.md**: Panduan cepat membuat pengujian baru
- **CROSS_BROWSER_TESTING.md**: Panduan pengujian lintas-browser
- **README.md**: Dokumentasi umum pengujian

### `/specs`
Berisi file-file pengujian aktual (.spec.ts):
- **descriptive-analysis.spec.ts**: Pengujian untuk analisis deskriptif
- **frequencies-analysis.spec.ts**: Pengujian untuk analisis frekuensi

### `/templates`
Berisi template untuk membuat pengujian baru:
- **TEMPLATE.spec.ts**: Template dasar untuk pengujian Playwright

### `/scripts`
Berisi script untuk menjalankan pengujian:
- **run-cross-browser-tests.ps1**: Script untuk menjalankan pengujian lintas-browser

### `/fixtures`
Berisi data dan helper untuk pengujian:
- **helpers/**: Fungsi helper untuk pengujian

## Cara Menggunakan

1. **Membuat pengujian baru**: Salin template dari `/templates/TEMPLATE.spec.ts` ke `/specs/`
2. **Menjalankan pengujian**: Gunakan script di `/scripts/` atau perintah npm
3. **Dokumentasi**: Lihat file di `/docs/` untuk panduan lengkap

## Perintah Pengujian

```bash
# Menjalankan semua pengujian
npm test

# Menjalankan pengujian lintas-browser
.\scripts\run-cross-browser-tests.ps1

# Menjalankan pengujian spesifik
npx playwright test specs/descriptive-analysis.spec.ts
```

Untuk informasi lebih detail, lihat dokumentasi di folder `/docs/`.