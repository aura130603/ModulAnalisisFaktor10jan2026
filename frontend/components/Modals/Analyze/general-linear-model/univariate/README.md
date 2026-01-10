# Univariate General Linear Model (GLM) Analysis

## Deskripsi

Komponen Univariate General Linear Model Analysis adalah implementasi lengkap untuk analisis model linear umum univariat dalam aplikasi Statify. Modul ini menyediakan antarmuka komprehensif untuk melakukan analisis ANOVA, ANCOVA, dan regresi linear dengan berbagai faktor dan kovariat, dilengkapi dengan opsi analisis lanjutan seperti post-hoc tests, contrasts, dan visualisasi.

## Fitur Utama

### 🧮 Analisis Model Linear
- **ANOVA**: Analisis varians satu arah dan multifaktorial
- **ANCOVA**: Analisis kovarians dengan kovariat kontinu
- **Mixed Models**: Model dengan faktor tetap dan acak
- **Custom Models**: Pembuatan model kustom dengan term-term tertentu
- **WLS (Weighted Least Squares)**: Analisis dengan bobot

### 📊 Konfigurasi Model
- **Dependent Variable**: Variabel dependen (outcome) yang akan dianalisis
- **Fixed Factors**: Faktor-faktor tetap (kategorikal)
- **Random Factors**: Faktor-faktor acak untuk mixed models
- **Covariates**: Kovariat kontinu
- **Weight Variable**: Variabel bobot untuk WLS

### 🔍 Analisis Lanjutan
- **Contrasts**: Kontras yang direncanakan (planned contrasts)
- **Estimated Marginal Means**: Rata-rata terestimasi marginal

### 📈 Output dan Visualisasi
- **ANOVA Tables**: Tabel analisis varians
- **Parameter Estimates**: Estimasi parameter dan signifikansi
- **Descriptive Statistics**: Statistik deskriptif per grup
- **Effect Size**: Ukuran efek (eta-squared, partial eta-squared)

## Struktur Komponen

```
univariate/
├── constants/                     # Konstanta dan konfigurasi default
│   └── univariate-default.ts
├── dialogs/                      # Komponen dialog UI
│   ├── dialog.tsx               # Dialog controller utama
│   ├── univariate-main.tsx      # Dialog konfigurasi utama
│   ├── model.tsx               # Dialog pengaturan model
│   ├── contrast.tsx            # Dialog kontras
│   ├── plots.tsx               # Dialog plotting
│   ├── posthoc.tsx             # Dialog post-hoc tests
│   ├── emmeans.tsx             # Dialog estimated marginal means
│   ├── save.tsx                # Dialog penyimpanan
│   ├── options.tsx             # Dialog opsi lanjutan
│   └── bootstrap.tsx           # Dialog bootstrap
├── hooks/                        # Custom hooks
│   ├── tourConfig.ts           # Konfigurasi tur aplikasi
│   └── useTourGuide.ts         # Hook untuk panduan tur
├── rust/                         # Implementasi Rust/WASM
│   └── pkg/                    # Package WebAssembly
├── services/                     # Layanan analisis
│   ├── univariate-analysis.ts          # Logika analisis utama
│   ├── univariate-analysis-formatter.ts # Formatter hasil
│   ├── univariate-analysis-output.ts    # Output handler
│   ├── formatter_part1.ts              # Formatter bagian 1
│   ├── formatter_part2.ts              # Formatter bagian 2
│   └── formatter_part3.ts              # Formatter bagian 3
├── types/                        # Definisi TypeScript
│   ├── univariate.ts           # Tipe data utama
│   └── univariate-worker.ts    # Tipe untuk worker
└── __test__/                     # Unit tests
    ├── univariate.test.ts      # Test utama
    └── univariate.performance.test.ts # Test performa
```

## Penggunaan

### 1. Konfigurasi Dasar

```typescript
import { UnivariateMainDefault } from './constants/univariate-default';

const config = {
    ...UnivariateMainDefault,
    DepVar: 'score',
    FixFactor: ['group', 'condition'],
    Covar: ['age', 'pretest']
};
```

### 2. Menjalankan Analisis

```typescript
import { analyzeUnivariate } from './services/univariate-analysis';

const results = await analyzeUnivariate({
    configData: {
        main: mainConfig,
        model: modelConfig,
        contrast: contrastConfig,
        plots: plotsConfig,
        posthoc: posthocConfig,
        emmeans: emmeansConfig,
        save: saveConfig,
        options: optionsConfig,
        bootstrap: bootstrapConfig
    },
    dataVariables: yourDataVariables,
    variables: yourVariables
});
```

### 3. Konfigurasi Model Kustom

```typescript
const modelConfig = {
    NonCust: false,
    Custom: true,
    FactorsVar: ['group', 'condition'],
    SumOfSquareMethod: 'typeIII',
    Intercept: true,
    BuildTermMethod: 'interaction'
};
```

## API Reference

### UnivariateAnalysis Class

```typescript
class UnivariateAnalysis {
    constructor(
        dependentData: any[][],
        fixedFactorData: any[][],
        randomFactorData: any[][],
        covariateData: any[][],
        weightData: any[][],
        dependentVarDefs: any[],
        fixedFactorVarDefs: any[],
        randomFactorVarDefs: any[],
        covariateVarDefs: any[],
        weightVarDefs: any[],
        config: UnivariateConfigType
    );
    
    get_formatted_results(): string;
}
```

### analyzeUnivariate Function

```typescript
async function analyzeUnivariate({
    configData,
    dataVariables,
    variables,
}: UnivariateAnalysisType): Promise<any>
```

## Hasil Output

Analisis univariate menghasilkan:

### 1. **ANOVA Table**
- Sum of squares (Type I, II, atau III)
- Degrees of freedom
- Mean squares
- F-statistics dan p-values
- Partial eta-squared (effect size)

### 2. **Parameter Estimates**
- Estimasi koefisien
- Standard errors
- t-statistics dan p-values
- Confidence intervals

### 3. **Descriptive Statistics**
- Means dan standard deviations per grup
- Cell counts
- Marginal means

### 4. **Post-Hoc Tests**
- Pairwise comparisons
- Adjusted p-values
- Mean differences
- Confidence intervals

### 5. **Diagnostic Information**
- Levene's test untuk homogenitas varians
- Residual analysis
- Model fit statistics

## Testing

### Unit Tests

```bash
# Menjalankan semua test
npm test univariate

# Test khusus univariate
npm test univariate.test.ts

# Test performa
npm test univariate.performance.test.ts
```

### Test Coverage

- ✅ Model fitting dengan berbagai konfigurasi
- ✅ Validasi input data dan parameter
- ✅ Handling missing data dan outliers
- ✅ ANOVA calculations
- ✅ Post-hoc tests
- ✅ Contrast analysis
- ✅ Output formatting
- ✅ Performance benchmarks

### Test Cases

```typescript
describe('Univariate Analysis', () => {
    test('One-way ANOVA', () => {
        // Test basic ANOVA
    });
    
    test('Two-way ANOVA with interaction', () => {
        // Test factorial ANOVA
    });
    
    test('ANCOVA with covariates', () => {
        // Test analysis of covariance
    });
    
    test('Mixed model analysis', () => {
        // Test random factors
    });
});
```

## Performance

### Optimisasi

- **WebAssembly**: Implementasi core algoritma dalam Rust untuk performa tinggi
- **Parallel Processing**: Perhitungan paralel untuk dataset besar
- **Memory Management**: Optimisasi penggunaan memori
- **Caching**: Cache hasil perhitungan untuk analisis berulang


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
- Tulis comprehensive unit tests
- Dokumentasi JSDoc untuk public functions
- Follow statistical computing best practices
