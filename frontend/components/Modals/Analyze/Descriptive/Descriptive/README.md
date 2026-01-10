# Fitur Descriptive Statistics

> **Catatan:** Untuk pemahaman arsitektur umum, silakan merujuk ke [Panduan Arsitektur Modal Analisis](../../README.md).

## Ringkasan Fitur

Fitur ini menghitung statistik deskriptif univariat, seperti ukuran tendensi sentral (mean, median), dispersi (standar deviasi), dan distribusi (skewness, kurtosis) untuk variabel yang dipilih.

## Detail Implementasi Penting

-   **Penyimpanan Z-Score**: Opsi "Save standardized values as variables" akan membuat variabel baru dalam dataset aktif. Ini adalah perubahan **permanen** pada data sesi, yang ditangani oleh `useZScoreProcessing` untuk menambahkan variabel baru ke `useVariableStore` dan mengisi data baru ke `useDataStore`.
-   **Komputasi Worker**: Semua perhitungan statistik yang berat didelegasikan ke *Web Worker* (`DescriptiveStatistics/manager.js`) untuk menjaga responsivitas UI.
-   **Tipe Variabel yang Didukung**: Fitur ini dirancang untuk bekerja secara optimal dengan variabel numerik atau tanggal yang memiliki level pengukuran *Scale* atau *Ordinal*.

## Opsi Spesifik

-   **Statistics Tab**:
    -   **Central Tendency**: `Mean`, `Median`, `Sum`.
    -   **Dispersion**: `Std. deviation`, `Variance`, `Range`, `Minimum`, `Maximum`, `S.E. mean`.
    -   **Distribution**: `Kurtosis`, `Skewness`.
-   **Display Order**: Mengontrol urutan variabel dalam tabel output berdasarkan urutan daftar, abjad, atau nilai mean (naik/turun).
