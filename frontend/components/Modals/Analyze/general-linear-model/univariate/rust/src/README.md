# Rust General Linear Model Univariate Library dengan WASM Support

Proyek ini adalah implementasi analisis General Linear Model (GLM) Univariate menggunakan Rust dengan dukungan WebAssembly melalui wasm-bindgen, yang memungkinkan analisis statistik multivariat digunakan di browser atau aplikasi JavaScript.

## Struktur Proyek

```
src/
|   lib.rs                  # Root module, mengekspor semua komponen publik
|   
+---models/                 # Definisi struktur data
|       config.rs           # Konfigurasi untuk analisis GLM Univariate
|       data.rs             # Struktur data input dan definisi variabel
|       mod.rs              # Ekspor model
|       result.rs           # Struktur hasil analisis GLM
|       
+---stats/                  # Implementasi algoritma statistik dan GLM
|       core.rs             # Re-export semua fungsi statistik
|       mod.rs              # Ekspor fungsi statistik
|       basic_math.rs       # Fungsi matematika dasar
|       between_subjects_effects.rs # Analisis efek antar-subjek
|       common.rs           # Fungsi-fungsi umum
|       contrast_coefficient.rs # Koefisien kontras
|       contrast_factors.rs # Faktor kontras
|       descriptive_statistics.rs # Statistik deskriptif
|       design_matrix.rs    # Matriks desain
|       distribution_utils.rs # Utilitas distribusi
|       emmeans.rs         # Estimated Marginal Means
|       estimable_function.rs # Fungsi estimable
|       factor_utils.rs     # Utilitas faktor
|       heteroscedasticity.rs # Uji heteroskedastisitas
|       hypothesis_matrix.rs # Matriks hipotesis
|       lack_of_fit.rs     # Uji lack of fit
|       levene_test.rs     # Uji Levene
|       parameter_estimates.rs # Estimasi parameter
|       save.rs            # Penyimpanan variabel
|       sum_of_squares.rs  # Jumlah kuadrat
|       summary_processing.rs # Pemrosesan ringkasan
|       
+---utils/                  # Utilitas pendukung
|       converter.rs        # Konversi antara format (JSON, struct)
|       error.rs            # Penanganan error terstandarisasi
|       log.rs              # Sistem logging untuk debugging
|       mod.rs              # Ekspor utilitas
|       
+---wasm/                   # Binding WebAssembly
|       constructor.rs      # Constructor-based API untuk JavaScript
|       function.rs         # Function-based API untuk JavaScript
|       mod.rs              # Ekspor binding WASM
|       
\---test/                   # Modul pengujian
        mod.rs              # Ekspor modul test
```

### Tabel File dan Fungsi Utama

| File                | Fungsi Utama                                              | Input                       | Output                      |
|---------------------|-----------------------------------------------------------|-----------------------------|-----------------------------|
| `lib.rs`            | Mengekspor semua modul publik untuk library               | -                           | Modul publik                |
| `models/mod.rs`     | Re-export semua struktur model                            | -                           | Tipe data publik            |
| `models/config.rs`  | Mendefinisikan struktur konfigurasi GLM Univariate       | -                           | Struktur `UnivariateConfig` |
| `models/data.rs`    | Mendefinisikan struktur data input dan variabel           | -                           | Struktur `AnalysisData`     |
| `models/result.rs`  | Mendefinisikan struktur output hasil analisis GLM         | -                           | Struktur `UnivariateResult` |
| `stats/mod.rs`      | Re-export fungsi statistik                                | -                           | Fungsi GLM                  |
| `stats/core.rs`     | Re-export semua fungsi GLM                                | `AnalysisData`, `UnivariateConfig` | `UnivariateResult`          |
| `utils/mod.rs`      | Re-export utilitas                                        | -                           | Fungsi utilitas publik      |
| `utils/converter.rs`| Konversi antara JSON dan struktur Rust                    | `&str`, `UnivariateResult` | `AnalysisData`, `String`    |
| `utils/error.rs`    | Definisi dan penanganan error                             | -                           | `ErrorCollector`            |
| `utils/log.rs`      | Sistem logging untuk debugging                            | -                           | `FunctionLogger`            |
| `wasm/mod.rs`       | Re-export binding WASM                                    | -                           | API WASM                    |
| `wasm/constructor.rs`| API berorientasi objek untuk JavaScript                   | `JsValue`                   | `UnivariateAnalysis`        |
| `wasm/function.rs`  | API fungsional untuk JavaScript                           | `AnalysisData`, `UnivariateConfig` | `UnivariateResult`          |

## Keunggulan Arsitektur

1. **Modularitas Tinggi**: Setiap komponen memiliki tanggung jawab spesifik dan terpisah
2. **Dukungan API Ganda**: Menawarkan pendekatan OO dan fungsional untuk fleksibilitas
3. **Error Handling Konsisten**: Pendekatan terstandarisasi untuk error di seluruh library
4. **Sistem Logging**: Tracking proses untuk debugging dan monitoring
5. **Testability**: Struktur yang mudah diuji secara terpisah
6. **Maintainability**: Mudah dipelihara dan diperluas
7. **Komprehensif**: Implementasi lengkap GLM Univariate dengan berbagai uji statistik

## Keterkaitan Antar File

```
                          ┌────────────────────────┐
                          │        lib.rs          │
                          │  (Root module export)  │
                          └───────────┬────────────┘
                                      │
                 ┌───────────────┬────┴────┬────────────┬────────────┐
                 │               │         │            │            │
         ┌───────▼──────┐ ┌─────▼─────┐   ▼      ┌─────▼─────┐ ┌────▼─────┐
         │  models/     │ │  stats/   │   │      │  utils/   │ │  wasm/   │
         │  mod.rs      │ │  mod.rs   │   │      │  mod.rs   │ │  mod.rs  │
         └───────┬──────┘ └─────┬─────┘   │      └─────┬─────┘ └────┬─────┘
                 │              │         │            │            │
     ┌───────────┼──────────┐   │         │      ┌─────┴─────┐     │
     │           │          │   │         │      │           │     │
┌────▼───┐ ┌─────▼────┐ ┌──▼───┐ ┌────────▼─┐ ┌─▼────────┐ ┌─▼────────┐  ┌─────────────┐
│config.rs│ │data.rs   │ │result.rs│ │core.rs  │ │converter.rs│ │error.rs  │  │constructor.rs│
└────┬───┘ └─────┬────┘ └──┬───┘ └────────┬─┘ └─┬────────┘ └──────────┘  └──────┬──────┘
     │           │         │              │     │                               │
     │           │         │              │     │                               │
     └───────────┼─────────┼──────────────▼─────┼───────────────────────────┐  │
                 │         │      ┌──────────────────────────────────┐      │  │
                 │         │      │    Implementasi stats/*.rs       │      │  │
                 │         │      │    - Menerima AnalysisData &     │◄─────┘  │
                 │         │      │      UnivariateConfig            │         │
                 │         │      │    - Menggunakan ErrorCollector  │         │
                 │         │      │    - Menghasilkan UnivariateResult│         │
                 │         │      └──────────────────────────────────┘         │
                 │         │                                                   │
                 │         │      ┌──────────────────────────────────┐         │
                 │         └─────►│    Implementasi wasm/*.rs        │◄────────┘
                 │                │    - Menerima JsValue            │
                 │                │    - Memanggil converter.rs      │
                 │                │    - Memanggil stats/core.rs     │
                 │                │    - Mengembalikan JsValue       │
                 │                └──────────────────────────────────┘
                 │
                 │                ┌──────────────────────────────────┐
                 └───────────────►│    Implementasi utils/converter  │
                                  │    - Mengkonversi JsValue<->Struct│
                                  │    - Menggunakan model structs   │
                                  └──────────────────────────────────┘
```

### Aliran Data

1. **Entrypoint (wasm layer)**:
   - `wasm/constructor.rs` atau `wasm/function.rs` menerima input JsValue dari JavaScript
   - Memanggil `utils/converter.rs` untuk mengkonversi JsValue menjadi struct Rust

2. **Proses Utama**:
   - `stats/core.rs` menerima struktur `AnalysisData` dan `UnivariateConfig` dari wasm layer
   - Melakukan validasi dan proses analisis GLM Univariate
   - Menghasilkan `UnivariateResult` yang berisi hasil analisis atau pesan error

3. **Output (wasm layer)**:
   - `utils/converter.rs` mengkonversi `UnivariateResult` kembali ke JsValue
   - `wasm/constructor.rs` atau `wasm/function.rs` mengembalikan JsValue ke JavaScript

### Dependensi Antar Modul

| Modul       | Bergantung Pada                                |
|-------------|------------------------------------------------|
| `models/`   | Tidak bergantung pada modul lain               |
| `utils/`    | Bergantung pada `models/`                      |
| `stats/`    | Bergantung pada `models/` dan `utils/error.rs` |
| `wasm/`     | Bergantung pada semua modul lainnya            |
| `test/`     | Bergantung pada semua modul lainnya            |

## Penjelasan Komponen

### 1. Models

Modul ini berisi definisi struktur data yang digunakan dalam library.

#### `config.rs`

Mendefinisikan struktur konfigurasi untuk operasi GLM Univariate:

```rust
pub struct UnivariateConfig {
    pub main: MainConfig,           // Konfigurasi utama
    pub model: ModelConfig,         // Konfigurasi model
    pub contrast: ContrastConfig,   // Konfigurasi kontras
    pub plots: PlotsConfig,         // Konfigurasi plot
    pub posthoc: PosthocConfig,     // Konfigurasi post-hoc
    pub emmeans: EmmmeansConfig,    // Konfigurasi EMMeans
    pub save: SaveConfig,           // Konfigurasi penyimpanan
    pub options: OptionsConfig,     // Opsi tambahan
    pub bootstrap: BootstrapConfig,  // Konfigurasi bootstrap
}

pub struct MainConfig {
    pub dep_var: Option<String>,        // Variabel dependen
    pub fix_factor: Option<Vec<String>>, // Faktor tetap
    pub rand_factor: Option<Vec<String>>, // Faktor acak
    pub covar: Option<Vec<String>>,     // Kovariat
    pub wls_weight: Option<String>,     // Bobot WLS
}

pub struct ModelConfig {
    pub non_cust: bool,                 // Model non-kustom
    pub custom: bool,                   // Model kustom
    pub build_term_method: BuildTermMethod, // Metode pembuatan term
    pub sum_of_square_method: SumOfSquaresMethod, // Metode sum of squares
    pub intercept: bool,                // Termasuk intercept
}
```

#### `data.rs`

Mendefinisikan struktur data input:

```rust
pub struct DataRecord {
    pub values: HashMap<String, DataValue>,
}

pub enum DataValue {
    Number(i64),
    NumberFloat(f64),
    Text(String),
    Boolean(bool),
    Date(String),
    DateTime(String),
    Time(String),
    Currency(f64),
    Scientific(f64),
    Percentage(f64),
    Null,
}

pub struct AnalysisData {
    pub dependent_data: Vec<Vec<DataRecord>>,           // Data dependen
    pub fix_factor_data: Vec<Vec<DataRecord>>,          // Data faktor tetap
    pub random_factor_data: Option<Vec<Vec<DataRecord>>>, // Data faktor acak
    pub covariate_data: Option<Vec<Vec<DataRecord>>>,   // Data kovariat
    pub wls_data: Option<Vec<Vec<DataRecord>>>,         // Data bobot WLS
    pub dependent_data_defs: Vec<Vec<VariableDefinition>>, // Definisi variabel dependen
    pub fix_factor_data_defs: Vec<Vec<VariableDefinition>>, // Definisi variabel faktor tetap
    pub random_factor_data_defs: Option<Vec<Vec<VariableDefinition>>>, // Definisi variabel faktor acak
    pub covariate_data_defs: Option<Vec<Vec<VariableDefinition>>>, // Definisi variabel kovariat
    pub wls_data_defs: Option<Vec<Vec<VariableDefinition>>>, // Definisi variabel bobot WLS
}
```

#### `result.rs`

Mendefinisikan struktur untuk hasil analisis GLM:

```rust
pub struct UnivariateResult {
    pub between_subjects_factors: Option<HashMap<String, BetweenSubjectFactors>>, // Faktor antar-subjek
    pub descriptive_statistics: Option<HashMap<String, DescriptiveStatistics>>,    // Statistik deskriptif
    pub levene_test: Option<Vec<LeveneTest>>,                                    // Uji Levene
    pub heteroscedasticity_tests: Option<HeteroscedasticityTests>,               // Uji heteroskedastisitas
    pub tests_of_between_subjects_effects: Option<TestsBetweenSubjectsEffects>,  // Uji efek antar-subjek
    pub parameter_estimates: Option<ParameterEstimates>,                         // Estimasi parameter
    pub general_estimable_function: Option<GeneralEstimableFunction>,           // Fungsi estimable umum
    pub hypothesis_l_matrices: Option<HypothesisLMatrices>,                     // Matriks L hipotesis
    pub contrast_coefficients: Option<ContrastCoefficients>,                    // Koefisien kontras
    pub lack_of_fit_tests: Option<LackOfFitTests>,                             // Uji lack of fit
    pub emmeans: Option<EMMeansResult>,                                        // Estimated Marginal Means
    pub saved_variables: Option<SavedVariables>,                               // Variabel tersimpan
}
```

### 2. Stats

Modul ini berisi implementasi algoritma GLM Univariate dan analisis statistik.

#### `core.rs`

Re-export semua fungsi GLM:

```rust
pub use crate::stats::basic_math::*;
pub use crate::stats::between_subjects_effects::*;
pub use crate::stats::common::*;
pub use crate::stats::contrast_coefficient::*;
pub use crate::stats::contrast_factors::*;
pub use crate::stats::descriptive_statistics::*;
pub use crate::stats::distribution_utils::*;
pub use crate::stats::design_matrix::*;
pub use crate::stats::emmeans::*;
pub use crate::stats::estimable_function::*;
pub use crate::stats::factor_utils::*;
pub use crate::stats::heteroscedasticity::*;
pub use crate::stats::hypothesis_matrix::*;
pub use crate::stats::lack_of_fit::*;
pub use crate::stats::levene_test::*;
pub use crate::stats::parameter_estimates::*;
pub use crate::stats::save::*;
pub use crate::stats::sum_of_squares::*;
pub use crate::stats::summary_processing::*;
```

#### Fungsi-fungsi Utama:

- `basic_processing_summary`: Ringkasan pemrosesan dasar
- `calculate_descriptive_statistics`: Statistik deskriptif
- `calculate_levene_test`: Uji Levene untuk homogenitas varians
- `calculate_heteroscedasticity_tests`: Uji heteroskedastisitas
- `calculate_tests_between_subjects_effects`: Uji efek antar-subjek (ANOVA)
- `calculate_parameter_estimates`: Estimasi parameter
- `calculate_emmeans`: Estimated Marginal Means
- `calculate_contrast_coefficients`: Koefisien kontras
- `calculate_hypothesis_matrices`: Matriks hipotesis
- `calculate_lack_of_fit_tests`: Uji lack of fit
- `save_variables`: Penyimpanan variabel hasil

### 3. Utils

Modul ini berisi fungsi-fungsi utilitas.

#### `converter.rs`

Fungsi-fungsi untuk konversi format:

- `format_result`: Memformat hasil untuk output
- `string_to_js_error`: Mengkonversi string error ke JsValue

#### `error.rs`

Implementasi error handling:

```rust
pub struct ErrorCollector {
    pub errors: Vec<(String, String)>,  // (context, message)
}

impl ErrorCollector {
    pub fn add_error(&mut self, context: &str, message: &str) { ... }
    pub fn has_errors(&self) -> bool { ... }
    pub fn get_errors(&self) -> Vec<(String, String)> { ... }
}
```

#### `log.rs`

Sistem logging untuk debugging:

```rust
pub struct FunctionLogger {
    pub logs: Vec<String>,
}

impl FunctionLogger {
    pub fn add_log(&mut self, function_name: &str) { ... }
    pub fn get_logs(&self) -> Vec<String> { ... }
}
```

### 4. WASM

Modul ini berisi binding ke WebAssembly untuk digunakan dengan JavaScript.

#### `constructor.rs`

Implementasi pendekatan berorientasi objek:

```rust
#[wasm_bindgen]
pub struct UnivariateAnalysis {
    config: UnivariateConfig,
    data: AnalysisData,
    result: Option<UnivariateResult>,
    error_collector: ErrorCollector,
    logger: FunctionLogger,
}

#[wasm_bindgen]
impl UnivariateAnalysis {
    #[wasm_bindgen(constructor)]
    pub fn new(dep_data: JsValue, fix_factor_data: JsValue, 
               rand_factor_data: JsValue, covar_data: JsValue, 
               wls_data: JsValue, dep_data_defs: JsValue, 
               fix_factor_data_defs: JsValue, rand_factor_data_defs: JsValue, 
               covar_data_defs: JsValue, wls_data_defs: JsValue, 
               config_data: JsValue) -> Result<UnivariateAnalysis, JsValue> { ... }
    
    pub fn run_analysis(&mut self) -> Result<JsValue, JsValue> { ... }
    pub fn get_results(&self) -> Result<JsValue, JsValue> { ... }
    pub fn get_formatted_results(&self) -> Result<JsValue, JsValue> { ... }
    pub fn get_all_log(&self) -> Result<JsValue, JsValue> { ... }
    pub fn get_all_errors(&self) -> JsValue { ... }
    pub fn clear_errors(&mut self) -> JsValue { ... }
}
```

#### `function.rs`

Implementasi pendekatan fungsional:

```rust
pub fn run_analysis(data: &AnalysisData, config: &UnivariateConfig, 
                   error_collector: &mut ErrorCollector, 
                   logger: &mut FunctionLogger) -> Result<Option<UnivariateResult>, JsValue> { ... }

pub fn get_results(result: &Option<UnivariateResult>) -> Result<JsValue, JsValue> { ... }
pub fn get_formatted_results(result: &Option<UnivariateResult>) -> Result<JsValue, JsValue> { ... }
pub fn get_all_log(logger: &FunctionLogger) -> Result<JsValue, JsValue> { ... }
pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue { ... }
pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue { ... }
```

## Alur Pemrosesan Data

Berikut adalah alur pemrosesan data dalam library:

1. **Input Data**
   - Menerima input dalam format JsValue dari JavaScript
   - Mengkonversi JsValue menjadi struct Rust (`AnalysisData` dan `UnivariateConfig`)

2. **Validasi Input**
   - Memeriksa kevalidan data dan konfigurasi
   - Mengumpulkan error jika ada menggunakan `ErrorCollector`

3. **Pemrosesan Dasar**
   - Ringkasan pemrosesan dasar untuk informasi awal data
   - Validasi jumlah kasus valid dan hilang

4. **Statistik Deskriptif (Opsional)**
   - Menghitung statistik dasar seperti rata-rata, standar deviasi
   - Memberikan gambaran umum tentang distribusi data

5. **Uji Asumsi**
   - Uji Levene untuk homogenitas varians
   - Uji heteroskedastisitas (Breusch-Pagan, White, F-test)

6. **Analisis GLM Utama**
   - Uji efek antar-subjek (ANOVA)
   - Estimasi parameter model
   - Perhitungan sum of squares

7. **Analisis Lanjutan (Opsional)**
   - Estimated Marginal Means (EMMeans)
   - Koefisien kontras
   - Matriks hipotesis
   - Uji lack of fit

8. **Penyimpanan Variabel (Opsional)**
   - Predicted values
   - Residuals
   - Diagnostic statistics

9. **Pengembalian Hasil**
   - Mengemas hasil analisis dalam struktur `UnivariateResult`
   - Mengkonversi hasil kembali ke format JsValue
   - Mengembalikan hasil ke JavaScript

## Penggunaan di JavaScript

### Pendekatan Berorientasi Objek

```javascript
import { UnivariateAnalysis } from 'glm-univariate-wasm';

// Input data dan konfigurasi
const depData = [/* array of dependent data records */];
const fixFactorData = [/* array of fixed factor data records */];
const randFactorData = [/* array of random factor data records */];
const covarData = [/* array of covariate data records */];
const wlsData = [/* array of WLS weight data records */];
const depDataDefs = [/* array of dependent variable definitions */];
const fixFactorDataDefs = [/* array of fixed factor variable definitions */];
const randFactorDataDefs = [/* array of random factor variable definitions */];
const covarDataDefs = [/* array of covariate variable definitions */];
const wlsDataDefs = [/* array of WLS weight variable definitions */];
const configData = {
    main: {
        dep_var: "dependent_variable",
        fix_factor: ["factor1", "factor2"],
        rand_factor: ["random_factor"],
        covar: ["covariate1"],
        wls_weight: null
    },
    model: {
        non_cust: true,
        custom: false,
        build_term_method: "interaction",
        sum_of_square_method: "typeIII",
        intercept: true
    },
    options: {
        desc_stats: true,
        homogen_test: true,
        est_effect_size: true,
        param_est: true,
        lack_of_fit: false
    }
    // ... other config options
};

// Membuat instance analyzer
const analyzer = new UnivariateAnalysis(
    depData, fixFactorData, randFactorData, covarData, wlsData,
    depDataDefs, fixFactorDataDefs, randFactorDataDefs, covarDataDefs, wlsDataDefs,
    configData
);

// Menjalankan analisis
const result = analyzer.run_analysis();

// Mendapatkan hasil
const results = analyzer.get_results();
const formattedResults = analyzer.get_formatted_results();

// Mendapatkan log dan error
const logs = analyzer.get_all_log();
const errors = analyzer.get_all_errors();

console.log("Hasil analisis GLM:", results);
```

### Pendekatan Fungsional

```javascript
import { run_analysis, get_results, get_formatted_results } from 'glm-univariate-wasm';

// Input data dan konfigurasi (dalam format yang sama)
const depData = [/* ... */];
const fixFactorData = [/* ... */];
const randFactorData = [/* ... */];
const covarData = [/* ... */];
const wlsData = [/* ... */];
const depDataDefs = [/* ... */];
const fixFactorDataDefs = [/* ... */];
const randFactorDataDefs = [/* ... */];
const covarDataDefs = [/* ... */];
const wlsDataDefs = [/* ... */];
const configData = {/* ... */};

// Memanggil fungsi analisis
const result = run_analysis(depData, fixFactorData, randFactorData, covarData, wlsData,
                          depDataDefs, fixFactorDataDefs, randFactorDataDefs, covarDataDefs, wlsDataDefs,
                          configData);

// Mendapatkan hasil
const results = get_results(result);
const formattedResults = get_formatted_results(result);

console.log("Hasil analisis GLM:", results);
```

## Pengembangan

### Menambahkan Metode Analisis Baru

1. Tambahkan implementasi metode di `stats/`:

```rust
// Di stats/new_analysis.rs
pub fn perform_new_analysis(data: &AnalysisData, config: &UnivariateConfig) -> Result<NewAnalysisResult, String> {
    // Implementasi algoritma
    // ...
    
    Ok(NewAnalysisResult {
        // hasil analisis
    })
}
```

2. Tambahkan struktur hasil di `models/result.rs`:

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NewAnalysisResult {
    pub metric1: f64,
    pub metric2: f64,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}
```

3. Perbarui `UnivariateResult` untuk menyertakan hasil baru:

```rust
pub struct UnivariateResult {
    // ... existing fields
    pub new_analysis: Option<NewAnalysisResult>,
}
```

4. Integrasikan ke dalam alur pemrosesan di `wasm/function.rs`:

```rust
// Di dalam run_analysis function
if config.options.new_analysis {
    match core::perform_new_analysis(&data, config) {
        Ok(analysis) => {
            new_analysis = Some(analysis);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : New Analysis", &e);
        }
    }
}
```

### Mengembangkan Struktur Hasil

Jika perlu menambahkan informasi tambahan ke hasil analisis:

1. Perbarui struktur di `models/result.rs`
2. Pastikan implementasi serialisasi/deserialisasi sesuai (menggunakan serde)
3. Perbarui implementasi metode untuk mengisi data tambahan

## Build dan Deploy

### Build untuk WASM

```bash
wasm-pack build --target web
```

### Penggunaan di Web

```html
<script type="module">
  import init, { UnivariateAnalysis, run_analysis } from './pkg/glm_univariate_wasm.js';

  async function run() {
    await init();
    
    // Gunakan fungsi GLM
    // ...
  }

  run();
</script>
```

## Fitur Utama

1. **General Linear Model Univariate**: Implementasi lengkap GLM untuk analisis univariat
2. **ANOVA**: Analysis of Variance untuk menguji perbedaan antar kelompok
3. **Statistik Deskriptif**: Rata-rata, standar deviasi, dan statistik lainnya
4. **Uji Asumsi**: Levene test, heteroskedastisitas tests
5. **Estimasi Parameter**: Koefisien model dan signifikansi
6. **Estimated Marginal Means**: EMMeans untuk perbandingan kelompok
7. **Kontras**: Berbagai jenis kontras (deviation, simple, difference, dll.)
8. **Diagnostic Statistics**: Residuals, predicted values, Cook's distance
9. **Error Handling**: Sistem error handling yang komprehensif
10. **Logging**: Tracking proses untuk debugging
11. **Konfigurasi Fleksibel**: Berbagai opsi untuk menyesuaikan analisis
12. **WASM Support**: Performa tinggi di browser
13. **API Ganda**: OO dan fungsional untuk fleksibilitas
