# K-Means Cluster Analysis

## Deskripsi

Komponen K-Means Cluster Analysis adalah implementasi algoritma k-means clustering untuk analisis pengelompokan data dalam aplikasi Statify. Modul ini menyediakan antarmuka lengkap untuk melakukan analisis clustering dengan berbagai opsi konfigurasi dan visualisasi hasil.

## Fitur Utama

### 🎯 Analisis Clustering
- **Algoritma K-Means**: Implementasi algoritma k-means clustering yang efisien
- **Jumlah Cluster Dinamis**: Dapat menentukan jumlah cluster (k) sesuai kebutuhan
- **Iterasi Terkontrol**: Mengatur maksimum iterasi dan kriteria konvergensi
- **Multiple Variables**: Mendukung analisis dengan beberapa variabel target

### 📊 Konfigurasi Analisis
- **Target Variables**: Pemilihan variabel yang akan digunakan untuk clustering
- **Case Target**: Variabel untuk identifikasi kasus/observasi
- **Iterate vs Classify**: Mode iterasi untuk pelatihan atau mode klasifikasi saja
- **Running Means**: Opsi penggunaan running means dalam iterasi

### 💾 Manajemen Data
- **Input Data**: Mendukung berbagai format data input
- **Output Options**: Menyimpan hasil clustering ke dataset baru
- **Data Integration**: Integrasi dengan sistem manajemen data Statify

### 🔧 Opsi Lanjutan
- **Convergence Criterion**: Pengaturan kriteria konvergensi untuk algoritma
- **Maximum Iterations**: Pembatasan jumlah iterasi maksimum
- **Initial Centers**: Opsi untuk membaca pusat cluster awal dari file

## Struktur Komponen

```
k-means-cluster/
├── constants/                  # Konstanta dan konfigurasi default
│   └── k-means-cluster-default.ts
├── dialogs/                   # Komponen dialog UI
│   ├── dialog.tsx            # Dialog utama
│   ├── iterate.tsx           # Dialog iterasi
│   ├── k-means-cluster-main.tsx  # Dialog konfigurasi utama
│   ├── options.tsx           # Dialog opsi lanjutan
│   └── save.tsx              # Dialog penyimpanan
├── hooks/                     # Custom hooks
│   ├── tourConfig.ts         # Konfigurasi tur aplikasi
│   └── useTourGuide.ts       # Hook untuk panduan tur
├── rust/                      # Implementasi Rust/WASM
│   └── pkg/                  # Package WebAssembly
├── services/                  # Layanan analisis
│   ├── k-means-cluster-analysis.ts          # Logika analisis utama
│   ├── k-means-cluster-analysis-formatter.ts # Formatter hasil
│   └── k-means-cluster-analysis-output.ts    # Output handler
├── types/                     # Definisi TypeScript
│   ├── k-means-cluster.ts    # Tipe data utama
│   └── k-means-cluster-worker.ts # Tipe untuk worker
└── __test__/                  # Unit tests
    ├── kmeans.test.ts        # Test utama
    └── kmeans.performance.test.ts # Test performa
```

## Penggunaan

### 1. Konfigurasi Dasar

```typescript
import { KMeansClusterMainDefault } from './constants/k-means-cluster-default';

const config = {
    ...KMeansClusterMainDefault,
    TargetVar: ['variable1', 'variable2'],
    Cluster: 3,
    IterateClassify: true
};
```

### 2. Menjalankan Analisis

```typescript
import { analyzeKMeansCluster } from './services/k-means-cluster-analysis';

const results = await analyzeKMeansCluster({
    configData: {
        main: mainConfig,
        iterate: iterateConfig,
        options: optionsConfig,
        save: saveConfig
    },
    dataVariables: yourDataVariables,
    variables: yourVariables
});
```

### 3. Konfigurasi Iterasi

```typescript
const iterateConfig = {
    MaximumIterations: 50,
    ConvergenceCriterion: 0.001,
    UseRunningMeans: true
};
```

## Konfigurasi

### Main Configuration

| Parameter | Tipe | Default | Deskripsi |
|-----------|------|---------|-----------|
| `TargetVar` | `string[]` | `null` | Variabel target untuk clustering |
| `CaseTarget` | `string` | `null` | Variabel identifier kasus |
| `Cluster` | `number` | `2` | Jumlah cluster yang diinginkan |
| `IterateClassify` | `boolean` | `true` | Mode iterasi untuk pelatihan |
| `ClassifyOnly` | `boolean` | `false` | Mode klasifikasi saja |

### Iterate Configuration

| Parameter | Tipe | Default | Deskripsi |
|-----------|------|---------|-----------|
| `MaximumIterations` | `number` | `10` | Maksimum iterasi algoritma |
| `ConvergenceCriterion` | `number` | `0` | Kriteria konvergensi |
| `UseRunningMeans` | `boolean` | `false` | Gunakan running means |

### Options Configuration

| Parameter | Tipe | Default | Deskripsi |
|-----------|------|---------|-----------|
| `Statistics` | `boolean` | `false` | Tampilkan statistik cluster |
| `ANOVATable` | `boolean` | `false` | Tampilkan tabel ANOVA |
| `ClusterMembership` | `boolean` | `false` | Tampilkan keanggotaan cluster |

## API Reference

### KMeansClusterAnalysis Class

```typescript
class KMeansClusterAnalysis {
    constructor(
        targetData: any[][],
        caseData: any[][],
        targetVarDefs: any[],
        caseVarDefs: any[],
        config: KMeansClusterConfigType
    );
    
    get_formatted_results(): string;
}
```

### analyzeKMeansCluster Function

```typescript
async function analyzeKMeansCluster({
    configData,
    dataVariables,
    variables,
}: KMeansClusterAnalysisType): Promise<any>
```

## Hasil Output

Analisis k-means menghasilkan:

1. **Cluster Centers**: Koordinat pusat setiap cluster
2. **Cluster Membership**: Assignments setiap observasi ke cluster
3. **Cluster Statistics**: Statistik deskriptif untuk setiap cluster
4. **ANOVA Table**: Analisis varians antar cluster
5. **Convergence Information**: Informasi konvergensi algoritma

## Testing

### Unit Tests

```bash
# Menjalankan semua test
npm test k-means-cluster

# Test khusus k-means
npm test kmeans.test.ts

# Test performa
npm test kmeans.performance.test.ts
```

### Test Coverage

- ✅ Algoritma k-means dasar
- ✅ Validasi input data
- ✅ Handling data kosong/null
- ✅ Konfigurasi parameter
- ✅ Output formatting
- ✅ Performance benchmarks

## Performance

### Optimisasi

- **WebAssembly**: Implementasi core algoritma dalam Rust untuk performa tinggi
- **Web Workers**: Pemrosesan background untuk UI yang responsif
- **Memory Management**: Optimisasi penggunaan memori untuk dataset besar
- **Lazy Loading**: Loading komponen sesuai kebutuhan

## Troubleshooting

### Common Issues

1. **"Invalid target data"**
   - Pastikan variabel target berisi data numerik
   - Periksa tidak ada nilai null/missing yang berlebihan

2. **"Convergence failed"**
   - Tingkatkan maksimum iterasi
   - Kurangi kriteria konvergensi
   - Periksa distribusi data

3. **"Performance issues"**
   - Kurangi jumlah variabel target
   - Gunakan sampling untuk dataset besar
   - Periksa memory usage

### Error Handling

```typescript
try {
    const results = await analyzeKMeansCluster(config);
} catch (error) {
    if (error.message.includes('Invalid target data')) {
        // Handle invalid data
    } else if (error.message.includes('Convergence')) {
        // Handle convergence issues
    }
}
```

## Kontribusi

### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build Rust/WASM:
   ```bash
   cd rust
   wasm-pack build --target web
   ```

3. Run tests:
   ```bash
   npm test
   ```

### Code Style

- Ikuti TypeScript strict mode
- Gunakan ESLint dan Prettier
- Tulis unit tests untuk fitur baru
- Dokumentasi JSDoc untuk functions