# Rust K-Means Clustering Library dengan WASM Support

Proyek ini adalah implementasi algoritma K-Means clustering menggunakan Rust dengan dukungan WebAssembly melalui wasm-bindgen, yang memungkinkan analisis clustering digunakan di browser atau aplikasi JavaScript.

## Struktur Proyek

```
src/
|   lib.rs                  # Root module, mengekspor semua komponen publik
|   
+---models/                 # Definisi struktur data
|       config.rs           # Konfigurasi untuk analisis K-Means clustering
|       data.rs             # Struktur data input dan definisi variabel
|       mod.rs              # Ekspor model
|       result.rs           # Struktur hasil analisis clustering
|       
+---stats/                  # Implementasi algoritma statistik dan clustering
|       core.rs             # Re-export semua fungsi statistik
|       mod.rs              # Ekspor fungsi statistik
|       anova.rs            # Implementasi analisis ANOVA
|       case_count.rs       # Perhitungan jumlah kasus per cluster
|       cluster_centers.rs  # Perhitungan pusat cluster
|       cluster_membership.rs # Penentuan keanggotaan cluster
|       cluster_plot.rs     # Data untuk visualisasi cluster
|       common.rs           # Fungsi-fungsi umum
|       initialize_clusters.rs # Inisialisasi pusat cluster awal
|       iteration_history.rs # Riwayat iterasi algoritma
|       preprocess_data.rs  # Pra-pemrosesan data
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
| `models/config.rs`  | Mendefinisikan struktur konfigurasi K-Means clustering   | -                           | Struktur `KMeansConfig`     |
| `models/data.rs`    | Mendefinisikan struktur data input dan variabel           | -                           | Struktur `AnalysisData`     |
| `models/result.rs`  | Mendefinisikan struktur output hasil clustering           | -                           | Struktur `KMeansResult`     |
| `stats/mod.rs`      | Re-export fungsi statistik                                | -                           | Fungsi clustering           |
| `stats/core.rs`     | Re-export semua fungsi clustering                         | `AnalysisData`, `KMeansConfig` | `KMeansResult`              |
| `utils/mod.rs`      | Re-export utilitas                                        | -                           | Fungsi utilitas publik      |
| `utils/converter.rs`| Konversi antara JSON dan struktur Rust                    | `&str`, `KMeansResult`      | `AnalysisData`, `String`    |
| `utils/error.rs`    | Definisi dan penanganan error                             | -                           | `ErrorCollector`            |
| `utils/log.rs`      | Sistem logging untuk debugging                            | -                           | `FunctionLogger`            |
| `wasm/mod.rs`       | Re-export binding WASM                                    | -                           | API WASM                    |
| `wasm/constructor.rs`| API berorientasi objek untuk JavaScript                   | `JsValue`                   | `KMeansClusterAnalysis`     |
| `wasm/function.rs`  | API fungsional untuk JavaScript                           | `AnalysisData`, `KMeansConfig` | `KMeansResult`              |

## Keunggulan Arsitektur

1. **Modularitas Tinggi**: Setiap komponen memiliki tanggung jawab spesifik dan terpisah
2. **Dukungan API Ganda**: Menawarkan pendekatan OO dan fungsional untuk fleksibilitas
3. **Error Handling Konsisten**: Pendekatan terstandarisasi untuk error di seluruh library
4. **Sistem Logging**: Tracking proses untuk debugging dan monitoring
5. **Testability**: Struktur yang mudah diuji secara terpisah
6. **Maintainability**: Mudah dipelihara dan diperluas

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
                 │         │      │      KMeansConfig                │         │
                 │         │      │    - Menggunakan ErrorCollector  │         │
                 │         │      │    - Menghasilkan KMeansResult   │         │
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
   - `stats/core.rs` menerima struktur `AnalysisData` dan `KMeansConfig` dari wasm layer
   - Melakukan validasi dan proses clustering K-Means
   - Menghasilkan `KMeansResult` yang berisi hasil clustering atau pesan error

3. **Output (wasm layer)**:
   - `utils/converter.rs` mengkonversi `KMeansResult` kembali ke JsValue
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

Mendefinisikan struktur konfigurasi untuk operasi K-Means clustering:

```rust
pub struct KMeansConfig {
    pub main: MainConfig,           // Konfigurasi utama
    pub iterate: IterateConfig,     // Konfigurasi iterasi
    pub save: SaveConfig,           // Konfigurasi penyimpanan
    pub options: OptionsConfig,     // Opsi tambahan
}

pub struct MainConfig {
    pub target_var: Option<Vec<String>>,    // Variabel target
    pub case_target: Option<String>,        // Target kasus
    pub iterate_classify: bool,             // Iterasi klasifikasi
    pub classify_only: bool,                // Hanya klasifikasi
    pub cluster: i32,                       // Jumlah cluster
    // ... dan lainnya
}

pub struct IterateConfig {
    pub maximum_iterations: i32,            // Maksimum iterasi
    pub convergence_criterion: f64,         // Kriteria konvergensi
    pub use_running_means: bool,           // Gunakan running means
}
```

#### `data.rs`

Mendefinisikan struktur data input:

```rust
pub struct DataRecord {
    pub values: HashMap<String, DataValue>,
}

pub enum DataValue {
    NumberFloat(f64),
    Number(i64),
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
    pub target_data: Vec<Vec<DataRecord>>,           // Data target
    pub case_data: Vec<Vec<DataRecord>>,             // Data kasus
    pub target_data_defs: Vec<Vec<VariableDefinition>>, // Definisi variabel target
    pub case_data_defs: Vec<Vec<VariableDefinition>>,   // Definisi variabel kasus
}
```

#### `result.rs`

Mendefinisikan struktur untuk hasil analisis clustering:

```rust
pub struct KMeansResult {
    pub initial_centers: Option<InitialClusterCenters>,      // Pusat cluster awal
    pub iteration_history: Option<IterationHistory>,         // Riwayat iterasi
    pub cluster_membership: Option<ClusterMembership>,       // Keanggotaan cluster
    pub final_cluster_centers: Option<FinalClusterCenters>,  // Pusat cluster akhir
    pub distances_between_centers: Option<DistancesBetweenCenters>, // Jarak antar pusat
    pub anova: Option<ANOVATable>,                          // Hasil ANOVA
    pub cases_count: Option<CaseCountTable>,                // Jumlah kasus
    pub cluster_plot: Option<ClusterPlot>,                  // Data plot cluster
}
```

### 2. Stats

Modul ini berisi implementasi algoritma K-Means clustering dan analisis statistik.

#### `core.rs`

Re-export semua fungsi clustering:

```rust
pub use crate::stats::anova::*;
pub use crate::stats::case_count::*;
pub use crate::stats::cluster_centers::*;
pub use crate::stats::cluster_membership::*;
pub use crate::stats::common::*;
pub use crate::stats::initialize_clusters::*;
pub use crate::stats::iteration_history::*;
pub use crate::stats::preprocess_data::*;
pub use crate::stats::cluster_plot::*;
```

#### Fungsi-fungsi Utama:

- `preprocess_data`: Pra-pemrosesan data untuk clustering
- `initialize_clusters`: Inisialisasi pusat cluster awal
- `generate_iteration_history`: Menghasilkan riwayat iterasi
- `generate_cluster_membership`: Menentukan keanggotaan cluster
- `generate_final_cluster_centers`: Menghitung pusat cluster akhir
- `calculate_distances_between_centers`: Menghitung jarak antar pusat
- `perform_anova`: Melakukan analisis ANOVA
- `calculate_case_count`: Menghitung jumlah kasus per cluster
- `generate_cluster_plot`: Menghasilkan data untuk visualisasi

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
pub struct KMeansClusterAnalysis {
    config: KMeansConfig,
    data: AnalysisData,
    result: Option<KMeansResult>,
    error_collector: ErrorCollector,
    logger: FunctionLogger,
}

#[wasm_bindgen]
impl KMeansClusterAnalysis {
    #[wasm_bindgen(constructor)]
    pub fn new(target_data: JsValue, case_data: JsValue, 
               target_data_defs: JsValue, case_data_defs: JsValue, 
               config_data: JsValue) -> Result<KMeansClusterAnalysis, JsValue> { ... }
    
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
pub fn run_analysis(data: &AnalysisData, config: &KMeansConfig, 
                   error_collector: &mut ErrorCollector, 
                   logger: &mut FunctionLogger) -> Result<Option<KMeansResult>, JsValue> { ... }

pub fn get_results(result: &Option<KMeansResult>) -> Result<JsValue, JsValue> { ... }
pub fn get_formatted_results(result: &Option<KMeansResult>) -> Result<JsValue, JsValue> { ... }
pub fn get_all_log(logger: &FunctionLogger) -> Result<JsValue, JsValue> { ... }
pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue { ... }
pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue { ... }
```

## Alur Pemrosesan Data

Berikut adalah alur pemrosesan data dalam library:

1. **Input Data**
   - Menerima input dalam format JsValue dari JavaScript
   - Mengkonversi JsValue menjadi struct Rust (`AnalysisData` dan `KMeansConfig`)

2. **Validasi Input**
   - Memeriksa kevalidan data dan konfigurasi
   - Mengumpulkan error jika ada menggunakan `ErrorCollector`

3. **Pra-pemrosesan Data**
   - Menangani data hilang dan normalisasi
   - Menyiapkan data untuk algoritma clustering

4. **Inisialisasi Cluster**
   - Menentukan pusat cluster awal (jika diaktifkan)
   - Menggunakan metode yang ditentukan dalam konfigurasi

5. **Iterasi K-Means**
   - Menjalankan algoritma K-Means
   - Melacak perubahan pusat cluster dan keanggotaan
   - Menentukan konvergensi berdasarkan kriteria

6. **Analisis Hasil**
   - Menghitung pusat cluster akhir
   - Menentukan keanggotaan cluster untuk setiap data point
   - Menghitung jarak antar pusat cluster
   - Melakukan analisis ANOVA (jika diaktifkan)
   - Menghitung statistik kasus per cluster

7. **Pengembalian Hasil**
   - Mengemas hasil analisis dalam struktur `KMeansResult`
   - Mengkonversi hasil kembali ke format JsValue
   - Mengembalikan hasil ke JavaScript

## Penggunaan di JavaScript

### Pendekatan Berorientasi Objek

```javascript
import { KMeansClusterAnalysis } from 'k-means-cluster-wasm';

// Input data dan konfigurasi
const targetData = [/* array of data records */];
const caseData = [/* array of data records */];
const targetDataDefs = [/* array of variable definitions */];
const caseDataDefs = [/* array of variable definitions */];
const configData = {
    main: {
        cluster: 3,
        iterate_classify: true,
        classify_only: false,
        // ... other config
    },
    iterate: {
        maximum_iterations: 100,
        convergence_criterion: 0.0001,
        use_running_means: false
    },
    save: {
        cluster_membership: true,
        distance_cluster_center: true
    },
    options: {
        initial_cluster: true,
        anova: true,
        cluster_info: true,
        cluster_plot: true
    }
};

// Membuat instance analyzer
const analyzer = new KMeansClusterAnalysis(
    targetData, caseData, targetDataDefs, caseDataDefs, configData
);

// Menjalankan analisis
const result = analyzer.run_analysis();

// Mendapatkan hasil
const results = analyzer.get_results();
const formattedResults = analyzer.get_formatted_results();

// Mendapatkan log dan error
const logs = analyzer.get_all_log();
const errors = analyzer.get_all_errors();

console.log("Hasil clustering:", results);
```

### Pendekatan Fungsional

```javascript
import { run_analysis, get_results, get_formatted_results } from 'k-means-cluster-wasm';

// Input data dan konfigurasi (dalam format yang sama)
const targetData = [/* ... */];
const caseData = [/* ... */];
const targetDataDefs = [/* ... */];
const caseDataDefs = [/* ... */];
const configData = {/* ... */};

// Memanggil fungsi analisis
const result = run_analysis(targetData, caseData, targetDataDefs, caseDataDefs, configData);

// Mendapatkan hasil
const results = get_results(result);
const formattedResults = get_formatted_results(result);

console.log("Hasil clustering:", results);
```

## Pengembangan

### Menambahkan Metode Analisis Baru

1. Tambahkan implementasi metode di `stats/`:

```rust
// Di stats/new_analysis.rs
pub fn perform_new_analysis(data: &ProcessedData, config: &KMeansConfig) -> Result<NewAnalysisResult, String> {
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

3. Perbarui `KMeansResult` untuk menyertakan hasil baru:

```rust
pub struct KMeansResult {
    // ... existing fields
    pub new_analysis: Option<NewAnalysisResult>,
}
```

4. Integrasikan ke dalam alur pemrosesan di `wasm/function.rs`:

```rust
// Di dalam run_analysis function
if config.options.new_analysis {
    match core::perform_new_analysis(&preprocessed_data, config) {
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
  import init, { KMeansClusterAnalysis, run_analysis } from './pkg/k_means_cluster_wasm.js';

  async function run() {
    await init();
    
    // Gunakan fungsi clustering
    // ...
  }

  run();
</script>
```

## Fitur Utama

1. **K-Means Clustering**: Implementasi algoritma K-Means yang robust
2. **Analisis ANOVA**: Uji signifikansi perbedaan antar cluster
3. **Visualisasi Data**: Data untuk plotting cluster
4. **Error Handling**: Sistem error handling yang komprehensif
5. **Logging**: Tracking proses untuk debugging
6. **Konfigurasi Fleksibel**: Berbagai opsi untuk menyesuaikan analisis
7. **WASM Support**: Performa tinggi di browser
8. **API Ganda**: OO dan fungsional untuk fleksibilitas
