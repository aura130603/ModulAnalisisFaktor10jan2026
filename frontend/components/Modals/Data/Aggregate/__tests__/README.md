# Pengujian Fitur Agregat Data

Dokumen ini menjelaskan cakupan pengujian untuk fitur Agregat Data. Pengujian ini dibagi menjadi tiga bagian utama, masing-masing menargetkan lapisan fungsionalitas yang berbeda: komponen UI, logika state (hook), dan fungsi utilitas.

## `Aggregate.test.tsx`

File ini berisi pengujian untuk komponen utama `Aggregate`. Tujuannya adalah untuk memastikan antarmuka pengguna (UI) dirender dengan benar dan merespons interaksi pengguna seperti yang diharapkan.

- **Render Awal**: Memverifikasi bahwa komponen modal, judul, tab, dan daftar variabel (Available, Break, Aggregated) ditampilkan saat komponen dirender.
- **Interaksi Pengguna**:
    - Mensimulasikan klik pada tombol `OK`, `Cancel`, dan `Reset` untuk memastikan fungsi yang sesuai dipanggil.
    - Mensimulasikan klik dua kali pada item variabel untuk memicu pemindahan antar daftar.
- **Logika UI**:
    - Menguji bahwa tombol `Function...` dan `Name & Label...` dinonaktifkan ketika tidak ada variabel agregat yang dipilih dan diaktifkan ketika ada yang dipilih.
    - Memastikan perpindahan antar tab (`Variables` dan `Options`) berfungsi dengan benar.
- **Isolasi**: Hook `useAggregateData` di-mock untuk mengisolasi pengujian pada logika komponen UI saja.

## `useAggregateData.test.ts`

Pengujian ini fokus pada hook kustom `useAggregateData`, yang menampung sebagian besar logika bisnis dan manajemen state untuk fitur ini.

- **Manajemen State**:
    - Memastikan state diinisialisasi dengan benar dari store (Zustand).
    - Menguji pemindahan variabel antara daftar `available`, `break`, dan `aggregated`.
- **Logika Agregasi**:
    - Memverifikasi bahwa fungsi default (misalnya, `MEAN` untuk numerik) diterapkan saat variabel dipindahkan ke daftar agregat.
    - Menguji pembaruan fungsi, nama, dan label untuk variabel agregat.
    - Menangani kasus error seperti nama variabel duplikat.
    - Menguji fungsionalitas `Reset`.
- **Proses Konfirmasi**:
    - Mensimulasikan proses agregasi utama (`handleConfirm`).
    - Memastikan bahwa data dikelompokkan dan dihitung dengan benar.
    - Memverifikasi bahwa variabel baru ditambahkan ke `variableStore` dan data sel diperbarui di `dataStore`.
    - Menguji opsi tambahan seperti "Number of cases".

## `Utils.test.ts`

File ini berisi unit test untuk fungsi-fungsi pembantu yang digunakan di seluruh fitur Agregat. Tujuannya adalah untuk memastikan setiap fungsi bekerja secara terisolasi dan menangani berbagai kasus.

- **`getFunctionSuffix`**: Menguji pembuatan akhiran nama fungsi (misalnya, `MEAN` -> `_mean`).
- **`createVariableName`**: Menguji logika pembuatan nama variabel unik, termasuk penanganan nama yang sudah ada.
- **`mapUIFunctionToCalculationFunction`**: Memverifikasi pemetaan dari pilihan UI (misalnya, `PERCENTAGE` + `above`) ke fungsi kalkulasi internal (`PGT`).
- **`getFunctionDisplay`**: Menguji pembuatan string formula untuk ditampilkan di UI (misalnya, `MEAN(Salary)`).
- **`calculateAggregateValue`**: Pengujian komprehensif untuk setiap fungsi kalkulasi agregat (`MEAN`, `SUM`, `MEDIAN`, `STDDEV`, `MIN`, `MAX`, `FIRST`, `LAST`, `N`, `PGT`, `PIN`, dll.). Pengujian ini mencakup berbagai jenis data (numerik, string, campuran, null) dan kasus tepi untuk memastikan akurasi perhitungan. 