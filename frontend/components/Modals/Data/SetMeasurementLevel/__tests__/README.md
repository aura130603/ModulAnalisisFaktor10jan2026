# Pengujian Fitur Set Measurement Level

Dokumen ini menjelaskan strategi pengujian untuk fitur "Set Measurement Level". Pengujian dibagi menjadi tiga file, masing-masing memvalidasi aspek yang berbeda dari fitur tersebut.

## `index.test.tsx`

Pengujian ini berfungsi sebagai tes integrasi tingkat atas untuk komponen `SetMeasurementLevel`. Tujuannya adalah untuk memverifikasi bahwa *hook* logika dan komponen UI terhubung dengan benar.

-   **Integrasi Hook dan UI**: Memastikan bahwa `SetMeasurementLevel` memanggil *hook* `useSetMeasurementLevel` dan merender komponen `SetMeasurementLevelUI` dengan *props* yang benar yang dikembalikan dari *hook*.

## `SetMeasurementLevelUI.test.tsx`

File ini berisi pengujian untuk komponen `SetMeasurementLevelUI`. Pengujian ini berfokus pada aspek visual dan interaksi pengguna dari UI, dengan mengisolasi dari logika bisnis.

-   **Render Komponen**: Memverifikasi bahwa dialog, judul, dan komponen anak (`VariableListManager`) dirender dengan benar.
-   **Penerusan Props**: Memastikan bahwa *props* seperti `unknownVariables`, `nominalVariables`, dll., diteruskan dengan benar ke `VariableListManager`.
-   **Interaksi Pengguna**:
    -   Mensimulasikan klik pada tombol `OK` dan `Cancel` untuk memastikan *handler* `handleSave` dan `onClose` dipanggil.
    -   Menguji bahwa *callback* seperti `handleMoveVariable` dipanggil ketika ada interaksi di dalam `VariableListManager`.

## `useSetMeasurementLevel.test.tsx`

Pengujian ini fokus pada *hook* kustom `useSetMeasurementLevel`, yang berisi semua logika bisnis dan manajemen *state* untuk fitur ini.

-   **Manajemen State**:
    -   **Inisialisasi**: Memverifikasi bahwa *hook* dengan benar menginisialisasi daftar `unknownVariables` hanya dengan variabel yang memiliki `measure: 'unknown'` dari `useVariableStore`.
    -   **Perpindahan Variabel**: Menguji logika `handleMoveVariable` untuk memastikan variabel berhasil dipindahkan dari daftar "unknown" ke daftar target (`nominal`, `ordinal`, `scale`).
    -   **Reset**: Menguji `handleReset` untuk memastikan semua daftar dikembalikan ke keadaan awal, memindahkan semua variabel yang telah dikategorikan kembali ke daftar "unknown".
-   **Interaksi Store**:
    -   **Penyimpanan**: Memvalidasi bahwa `handleSave` memanggil fungsi `updateVariable` dari `useVariableStore` untuk setiap variabel yang telah dipindahkan ke daftar kategori baru.
    -   **Penutupan**: Memastikan `onClose` dipanggil setelah penyimpanan berhasil.
-   **Isolasi**: *Store* `useVariableStore` di-*mock* untuk mengisolasi pengujian pada logika *hook*. 