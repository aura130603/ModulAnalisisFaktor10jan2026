# Fitur Analisis: Crosstabs (Tabel Silang)

Dokumen ini memberikan panduan lengkap mengenai fungsionalitas, komponen, dan detail teknis dari fitur "Crosstabs".

## 1. Gambaran Umum

Fitur "Crosstabs" digunakan untuk membuat tabel kontingensi (tabel silang) yang menampilkan distribusi frekuensi gabungan dari dua atau lebih variabel kategorikal. Analisis ini sangat penting untuk menguji hipotesis tentang hubungan antar variabel.

Fitur ini menyediakan antarmuka berbasis tab yang intuitif:
-   **Tab Variabel**: Untuk memilih variabel yang akan dijadikan baris dan kolom.
-   **Tab Sel**: Untuk mengustomisasi informasi yang ditampilkan di setiap sel tabel (misalnya, hitungan, persentase, residual).

## 2. Komponen Antarmuka & Fungsionalitas

### a. Tab Variabel (Variables)

Halaman utama untuk mendefinisikan struktur tabel.
-   **Daftar Variabel (Available Variables)**: Menampilkan semua variabel yang tersedia.
-   **Baris (Row(s))**: Tempat untuk meletakkan satu atau lebih variabel yang akan membentuk baris tabel.
-   **Kolom (Column(s))**: Tempat untuk meletakkan satu atau lebih variabel yang akan membentuk kolom tabel.
-   **Interaksi**: Pengguna dapat memindahkan variabel menggunakan *drag-and-drop* atau dengan tombol panah (jika ada).

### b. Tab Sel (Cells)

Tab ini memungkinkan kustomisasi detail pada setiap sel tabel.
-   **Hitungan (Counts)**:
    -   `Observed`: Menampilkan jumlah kasus aktual di setiap sel.
    -   `Expected`: Menampilkan jumlah kasus yang diharapkan jika tidak ada hubungan antara variabel baris dan kolom.
-   **Persentase (Percentages)**:
    -   `Row`: Menampilkan persentase sel berdasarkan total baris.
    -   `Column`: Menampilkan persentase sel berdasarkan total kolom.
    -   `Total`: Menampilkan persentase sel berdasarkan total keseluruhan kasus.
-   **Residual**: Menunjukkan perbedaan antara nilai yang diamati dan yang diharapkan.
    -   `Unstandardized`
    -   `Standardized`
    -   `Adjusted standardized`
-   **Bobot Non-Integer (Noninteger Weights)**: Opsi ini hanya muncul jika pembobotan kasus (weight case) aktif, memungkinkan pengguna menentukan cara menangani bobot non-integer.

### c. Tombol Aksi

-   **OK**: Menjalankan analisis dan menampilkan hasilnya di jendela output.
-   **Cancel**: Menutup dialog tanpa menyimpan perubahan atau menjalankan analisis.
-   **Reset**: Mengembalikan semua pilihan ke kondisi awal.
-   **Help**: Memulai tur interaktif yang memandu pengguna melalui setiap fungsi.

## 3. Alur Kerja Analisis

1.  Pengguna memilih variabel dari daftar "Available" dan memindahkannya ke "Row(s)" dan "Column(s)".
2.  (Opsional) Pengguna berpindah ke tab "Cells" untuk memilih statistik tambahan yang akan ditampilkan.
3.  Pengguna menekan tombol "OK".
4.  `useCrosstabsAnalysis` hook dipicu, mengirimkan konfigurasi dan data ke Web Worker untuk diproses di latar belakang.
5.  Worker menghitung frekuensi, total, dan statistik lainnya.
6.  Setelah selesai, `formatters` mengubah hasil mentah menjadi tabel yang terstruktur (Case Processing Summary dan Crosstabulation Table).
7.  Hasil akhir ditambahkan ke `ResultStore` dan ditampilkan kepada pengguna.

## 4. Detail Teknis

-   **Arsitektur**: Menggunakan arsitektur modal terpusat, membuatnya dapat dirender di dalam `dialog` atau `sidebar`.
-   **State Management**: Menggunakan `useState` untuk state lokal dan `useVariableStore` / `useResultStore` (Zustand) untuk state global.
-   **Analisis Latar Belakang**: Operasi analisis yang intensif dijalankan pada Web Worker (`/workers/DescriptiveStatistics/manager.js`) untuk menjaga responsivitas antarmuka.

## 5. Rencana Pengembangan (Future Enhancements)

-   **Dukungan Variabel Layer**: Menambahkan kemampuan untuk memasukkan variabel kontrol (layer) untuk membuat tabel silang tiga arah atau lebih.
-   **Statistik Tambahan**: Mengintegrasikan lebih banyak statistik uji seperti Chi-Square, Phi, Cramer's V, Lambda, dll.
-   **Visualisasi Grafis**: Menambahkan opsi untuk secara otomatis menghasilkan grafik batang (bar chart) dari hasil tabel silang.

## Architecture

The component is built using the centralized modal architecture:

- **Container-agnostic**: Can be rendered in different containers (dialog or sidebar)
- **Direct registration pattern**: Registered directly in the modal registry
- **BaseModalProps**: Uses standardized props interface for consistency

## Components

1. **Main component (`index.tsx`)**: 
   - Entry point that adapts to container type
   - Manages overall modal state and variable selections
   - Handles analysis execution and results

2. **Variables Tab**:
   - Manages variable selection for row and column variables
   - Supports drag-and-drop and double-click interactions

3. **Cells Tab**:
   - Controls cell display options: counts, percentages, residuals
   - Manages Z-test options and noninteger weight handling

## Usage

The Crosstabs component is designed to work with the central modal registry:

```tsx
// Register in ModalRegistry
import Crosstabs from '@/components/Modals/Analyze/Descriptive/Crosstabs';

ModalRegistry.register('crosstabs', Crosstabs);

// Use in application
openModal('crosstabs', { 
  onClose: () => console.log('Modal closed'), 
  containerType: 'dialog' 
});
```

## Types

All component props are properly typed through interfaces in `types.ts`:

- `BaseModalProps`: Base props for modal components
- `VariableHighlight`: Type for tracking highlighted variables
- `NonintegerWeightsType`: Type for noninteger weights options
- Component-specific props interfaces:
  - `VariablesTabProps`
  - `CellsTabProps`
- `CrosstabsAnalysisParams`: Parameters passed to analysis functions 