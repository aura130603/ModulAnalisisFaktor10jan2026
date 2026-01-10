# Fitur Analisis: Explore

Dokumen ini memberikan panduan lengkap mengenai fungsionalitas, komponen, dan detail teknis dari fitur "Explore".

## 1. Gambaran Umum

Fitur "Explore" dirancang untuk analisis data eksplorasi (EDA) yang mendalam. Tujuannya adalah untuk merangkum karakteristik utama dari variabel, sering kali secara terpisah untuk kelompok-kelompok kasus yang berbeda. Ini sangat berguna untuk memeriksa asumsi statistik (seperti normalitas) dan mengidentifikasi nilai-nilai ekstrem (outlier).

Fitur ini menggunakan antarmuka berbasis tab yang memungkinkan konfigurasi analisis secara modular:
-   **Tab Variabel**: Untuk mendefinisikan variabel dependen, variabel faktor (pengelompokan), dan variabel label.
-   **Tab Statistik**: Untuk memilih statistik deskriptif dan robust yang akan dihitung.
-   **Tab Plot**: Untuk memilih visualisasi grafis guna memeriksa distribusi data.

## 2. Komponen Antarmuka & Fungsionalitas

### a. Tab Variabel (Variables)

-   **Dependent List**: Variabel-variabel numerik yang akan dianalisis.
-   **Factor List**: Variabel-variabel kategorikal yang digunakan untuk membagi data menjadi beberapa kelompok. Analisis akan dilakukan secara terpisah untuk setiap kelompok.
-   **Label Cases by**: Variabel yang nilainya akan digunakan untuk memberi label pada outlier di dalam plot.

### b. Tab Statistik (Statistics)

-   **Descriptives**: Jika dicentang, akan menampilkan tabel statistik deskriptif yang komprehensif.
    -   `Confidence Interval for Mean`: Memungkinkan pengguna mengatur tingkat kepercayaan untuk rata-rata (default 95%).
-   **M-estimators**: Menghitung estimasi lokasi yang robust, yang kurang sensitif terhadap outlier.
-   **Outliers**: Mengidentifikasi lima nilai tertinggi dan terendah sebagai kandidat outlier.
-   **Percentiles**: Menghitung persentil data, termasuk kuartil.

### c. Tab Plot (Plots)

-   **Boxplots**:
    -   `Factor levels together`: Menampilkan boxplot untuk setiap kelompok faktor secara berdampingan.
    -   `Dependents together`: Menampilkan boxplot untuk setiap variabel dependen secara berdampingan.
-   **Descriptive Plots**:
    -   `Stem-and-leaf`: Plot teks yang menunjukkan bentuk distribusi.
    -   `Histogram`: Representasi grafis dari distribusi frekuensi.
-   **Normality plots with tests**: Menghasilkan plot (seperti Q-Q plot) dan uji statistik (seperti Shapiro-Wilk) untuk memeriksa asumsi normalitas.

## 3. Alur Kerja Analisis

1.  Pengguna memilih satu atau lebih variabel dependen.
2.  (Opsional) Pengguna memilih variabel faktor untuk analisis per kelompok.
3.  Pengguna berpindah ke tab "Statistics" dan "Plots" untuk mengonfigurasi output yang diinginkan.
4.  Setelah menekan "OK", `useExploreAnalysis` hook akan mengambil alih.
5.  Hook mengelompokkan data berdasarkan variabel faktor.
6.  Untuk setiap kelompok data (dan setiap variabel dependen), sebuah `examine` job dikirim ke Web Worker.
7.  Worker melakukan perhitungan statistik di latar belakang.
8.  Setelah semua hasil diterima, `formatters` menyusunnya menjadi tabel-tabel yang siap ditampilkan (Case Processing Summary, Descriptives, M-Estimators, Percentiles, Extreme Values).
9.  Hasil akhir disimpan di `ResultStore` dan ditampilkan kepada pengguna.

## 4. Detail Teknis

-   **Arsitektur Hook**: Fungsionalitas dipisahkan ke dalam beberapa custom hook untuk keterbacaan dan pemeliharaan yang lebih baik:
    -   `useVariableManagement`: Mengelola semua logika pemindahan dan pemilihan variabel.
    -   `useStatisticsSettings` & `usePlotsSettings`: Mengelola state untuk opsi di tab masing-masing.
    -   `useExploreAnalysis`: Orkestrator utama yang menangani proses analisis.
-   **Analisis Latar Belakang**: Perhitungan statistik dilakukan di Web Worker untuk mencegah pemblokiran UI, terutama pada dataset besar atau analisis yang kompleks.

## 5. Rencana Pengembangan (Future Enhancements)

-   **Implementasi Plot**: Saat ini, opsi di tab "Plots" sudah dapat dipilih, namun hasil grafisnya belum dirender. Langkah selanjutnya adalah membuat komponen renderer untuk Boxplot, Stem-and-leaf, dan Histogram.
-   **Opsi "Display"**: Menambahkan opsi untuk hanya menampilkan statistik, hanya plot, atau keduanya (perilaku standar SPSS).
-   **Uji Normalitas**: Mengimplementasikan dan menampilkan hasil dari uji Shapiro-Wilk atau Kolmogorov-Smirnov pada output.
-   **Uji Levene**: Menambahkan uji homogenitas varians (Levene's test) ketika variabel faktor digunakan.

# Explore Modal Component

The Explore modal provides a sophisticated interface for conducting exploratory data analysis on variables. It uses a structured tab-based approach to configure analysis options.

## Architecture

The component is built using the centralized modal architecture:

- **Container-agnostic**: Can be rendered in different containers (dialog or sidebar)
- **Direct registration pattern**: Registered directly in the modal registry
- **BaseModalProps**: Uses standardized props interface for consistency

## Components

1. **Main component (`index.tsx`)**: 
   - Entry point that adapts to container type
   - Manages overall modal state
   - Handles analysis execution and results

2. **Variables Tab**:
   - Manages variable selection using `VariableListManager`
   - Supports dependent variables, factor variables, and label variable selection

3. **Statistics Tab**:
   - Configures statistical calculation options
   - Controls descriptives, M-estimators, outliers, and percentile settings

4. **Plots Tab**:
   - Configures plot generation options
   - Manages boxplot type, stem-and-leaf plots, histograms, and normality plots

## Usage

The Explore component is designed to work with the central modal registry:

```tsx
// Register in ModalRegistry
import Explore from '@/components/Modals/Analyze/Descriptive/Explore';

ModalRegistry.register('explore', Explore);

// Use in application
openModal('explore', { 
  onClose: () => console.log('Modal closed'), 
  containerType: 'dialog' 
});
```

## Types

All component props are properly typed through interfaces in `types.ts`:

- `BaseModalProps`: Base props for modal components
- `HighlightedVariable`: Type for tracking highlighted variables
- `VariablesTabProps`: Props for the Variables tab
- `StatisticsTabProps`: Props for the Statistics tab
- `PlotsTabProps`: Props for the Plots tab
- `ExploreAnalysisParams`: Parameters passed to analysis functions
- `ExploreResults`: Structure for analysis results 