# Fitur: Impor dari Excel

Dokumen ini menjelaskan fungsionalitas fitur "Impor dari Excel", yang memungkinkan pengguna untuk memuat data dari file spreadsheet `.xls` atau `.xlsx`.

## 1. Gambaran Umum

Fitur ini menyediakan antarmuka dua tahap yang memandu pengguna melalui proses impor data dari file Excel. Proses ini dirancang untuk memberikan fleksibilitas dan kontrol, memastikan data diinterpretasikan dengan benar sebelum dimuat ke dalam aplikasi.

Untuk menjaga antarmuka tetap responsif bahkan saat memproses file besar, operasi parsing file yang intensif dilakukan di latar belakang menggunakan **Web Worker**.

## 2. Komponen Antarmuka & Fungsionalitas

### a. Tahap 1: Pemilihan File
-   **Area Drag-and-Drop**: Area utama di mana pengguna dapat menarik dan melepaskan file Excel.
-   **Tombol Pilih File**: Alternatif untuk membuka dialog file sistem dan memilih file secara manual.
-   **Tombol Continue**: Menjadi aktif setelah file dipilih. Menekan tombol ini akan memulai proses parsing di Web Worker dan melanjutkan ke tahap konfigurasi.

### b. Tahap 2: Konfigurasi Impor
-   **Pemilihan Worksheet**: Dropdown untuk memilih sheet mana dari dalam workbook yang akan diimpor.
-   **Input Rentang (Range)**: Kolom opsional untuk menentukan rentang sel tertentu yang ingin dibaca (misalnya, `A1:G50`). Jika kosong, seluruh area yang digunakan akan dibaca.
-   **Opsi Impor**:
    -   `First row as variable names`: Menggunakan baris pertama dari data yang dipilih sebagai nama variabel.
    -   `Read hidden rows & columns`: Menyertakan baris dan kolom yang disembunyikan di Excel dalam proses impor.
    -   `Read empty cells as`: Menentukan bagaimana sel kosong harus diperlakukan, apakah sebagai string kosong atau sebagai nilai sistem yang hilang (`SYSMIS`).
-   **Pratinjau Data**: Sebuah tabel HTML dasar yang menampilkan pratinjau data berdasarkan sheet dan opsi yang dipilih. Pratinjau ini diperbarui setiap kali opsi diubah dan menampilkan maksimal 100 baris pertama untuk performa yang optimal.
-   **Tombol Import Data**: Tombol final yang akan memproses data dengan konfigurasi yang ada dan memuatnya ke dalam aplikasi.

## 3. Alur Kerja & Logika

1.  **Pemilihan File**: Pengguna memilih file Excel pada `ImportExcelSelectionStep`.
2.  **Parsing Latar Belakang**: Saat pengguna menekan "Continue", file dikirim ke **Web Worker**. Worker ini menggunakan pustaka `xlsx` (SheetJS) untuk mengekstrak data dari semua sheet tanpa memblokir antarmuka utama.
3.  **Transisi ke Konfigurasi**: Setelah worker selesai dan mengembalikan data yang telah diparsing, `useImportExcelLogic` mengubah *stage* ke `configure`. `ImportExcelConfigurationStep` kemudian dirender dengan data tersebut.
4.  **Penyesuaian & Pratinjau**: Pengguna memilih worksheet dan menyesuaikan opsi. Setiap perubahan memicu pembaruan pada pratinjau data.
5.  **Finalisasi Impor**: Pengguna menekan "Import Data". Utilitas `importExcel.utils.ts` dipanggil untuk memproses data dari sheet yang dipilih dengan konfigurasi final, menghasilkan variabel, dan data matriks.
6.  **Pembaruan State Aplikasi**: Data dan variabel baru dimuat ke dalam `useDataStore` dan `useVariableStore` menggunakan `overwriteAll`.
7.  **Selesai**: Modal ditutup dan pengguna melihat dataset yang baru diimpor.

## 4. Rencana Pengembangan di Masa Depan

-   **Deteksi Tipe Data per Kolom**: Memungkinkan pengguna untuk menimpa tipe data (misalnya, dari Numerik ke String) untuk setiap kolom langsung dari antarmuka pratinjau.
-   **Dukungan File Terproteksi**: Menambahkan kemampuan untuk mengimpor file Excel yang dilindungi kata sandi.
-   **Impor Multi-Sheet**: Menyediakan opsi untuk menggabungkan beberapa sheet menjadi satu dataset.
-   **Simpan Preset**: Memungkinkan pengguna menyimpan konfigurasi impor untuk jenis file yang sering mereka gunakan.

## 5. Struktur Direktori & Tanggung Jawab

-   **`/` (Root)**
    -   **`index.tsx`**: **Orchestrator**. Mengelola tahap proses (`select` atau `configure`) dan merender komponen yang sesuai.
    -   **`types.ts`**: Mendefinisikan semua tipe dan *interface* TypeScript yang relevan.
    -   **`README.md`**: (File ini) Dokumentasi fitur.

-   **`components/`**
    -   **`ImportExcelSelectionStep.tsx`**: Komponen UI untuk tahap pemilihan file.
    -   **`ImportExcelConfigurationStep.tsx`**: Komponen UI untuk tahap konfigurasi, termasuk pemilihan *sheet*, penentuan rentang, dan opsi lainnya. Juga menampilkan pratinjau data menggunakan tabel HTML dasar yang responsif.

-   **`hooks/`**
    -   **`useImportExcelLogic.ts`**: Hook utama yang mengelola logika dan *state* keseluruhan, seperti file yang dipilih, *stage* saat ini, dan data hasil *parsing* dari *worker*.
    -   **`useExcelWorker.ts`**: Hook yang membungkus interaksi dengan Web Worker, menyediakan antarmuka yang bersih untuk memulai proses *parsing*.

-   **`services/`**
    -   **`services.ts`**: Mengelola pembuatan dan komunikasi dengan `excelWorker.js`. Ini adalah lapisan abstraksi antara *hook* dan Web Worker API.

-   **`utils/`**
    -   **`utils.ts`**: Berisi fungsi utilitas untuk memproses data yang telah diparsing oleh *worker*. Fungsi-fungsi ini digunakan oleh `ConfigurationStep` untuk membuat pratinjau dan mempersiapkan data final untuk diimpor ke *store*.

-   **`public/workers/DataManagement/`**
    -   **`excelWorker.js`**: Skrip **Web Worker** yang bertanggung jawab untuk melakukan *parsing* file Excel menggunakan pustaka `xlsx` (SheetJS), mencegah pemblokiran *thread* utama.

## 6. Properti Komponen (`ImportExcelProps`)

-   `onClose: () => void`: **(Wajib)** Fungsi *callback* untuk menutup modal.
-   `containerType: ContainerType`: **(Wajib)** Menentukan konteks render (`dialog` atau `sidebar`).

## 7. Ketergantungan Utama (Dependencies)

-   **Internal**:
    -   Zustand Stores (`useDataStore`, `useVariableStore`).
    -   Komponen UI dari `@/components/ui/*`.
-   **Eksternal**:
    -   `xlsx` (SheetJS): Pustaka inti untuk *parsing* file Excel, digunakan di dalam Web Worker.
    -   Tabel HTML dasar dengan CSS kustom: Untuk menampilkan pratinjau data yang ringan dan responsif.
    -   `framer-motion`: Untuk animasi pada fitur *tour*.
-   **Arsitektural**:
    -   **Web Worker API**: Ketergantungan fundamental untuk *offloading* proses *parsing* dari *thread* utama.