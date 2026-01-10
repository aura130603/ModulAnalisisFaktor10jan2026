# Pengujian Fitur Transpose

Dokumen ini memberikan ringkasan tentang strategi pengujian untuk fitur "Transpose Data". Pengujian dibagi menjadi tiga file, masing-masing bertanggung jawab untuk memvalidasi lapisan fungsionalitas yang berbeda.

## `Transpose.test.tsx`

File ini berisi pengujian untuk komponen `TransposeUI`. Tujuannya adalah untuk memastikan bahwa antarmuka pengguna (UI) dirender dengan benar dan merespons interaksi pengguna. Karena `Transpose.test.tsx` secara spesifik menguji `TransposeUI`, pengujian ini fokus pada presentasi.

-   **Render Komponen**: Memverifikasi bahwa dialog, judul, dan komponen anak (`VariableListManager`) dirender dengan benar.
-   **Interaksi Pengguna**:
    -   Mensimulasikan klik pada tombol `OK`, `Cancel`, dan `Reset` untuk memastikan *handler* yang sesuai dari *props* (`handleOk`, `onClose`, `handleReset`) dipanggil.
    -   Menguji bahwa *callback* `handleMoveVariable` dipanggil ketika ada interaksi di dalam `VariableListManager` yang di-*mock*.
-   **Isolasi**: Komponen `VariableListManager` di-*mock* untuk mengisolasi pengujian pada `TransposeUI` dan untuk secara terkontrol memicu *callback props*.

## `useTranspose.test.ts`

Pengujian ini fokus pada *hook* kustom `useTranspose`, yang menampung logika bisnis dan manajemen *state* untuk fitur ini.

-   **Manajemen State**:
    -   **Inisialisasi**: Memverifikasi bahwa *hook* dengan benar menginisialisasi daftar `availableVariables` dari `useVariableStore`.
    -   **Perpindahan Variabel**: Menguji logika `handleMoveVariable` untuk memastikan variabel berhasil dipindahkan dari daftar "available" ke daftar "selected" atau "name". Juga memvalidasi bahwa hanya satu variabel yang bisa ada di daftar "name".
    -   **Reset**: Menguji `handleReset` untuk memastikan semua daftar dikembalikan ke keadaan awal.
-   **Interaksi Store dan Service**:
    -   **Penyimpanan**: Memvalidasi bahwa `handleOk` memanggil `transposeDataService` dengan argumen yang benar, kemudian memanggil `setData` dan `overwriteVariables` dari *store* dengan hasil dari *service*.
    -   **Kasus Tepi**: Memastikan `transposeDataService` tidak dipanggil jika tidak ada variabel yang dipilih untuk ditransposisi.
-   **Isolasi**: *Store* (Zustand) dan `transposeDataService` di-*mock* untuk mengisolasi pengujian pada logika *hook*.

## `transposeService.test.ts`

File ini berisi *unit test* untuk fungsi murni `transposeDataService` yang melakukan pemrosesan data inti.

-   **Logika Transposisi**:
    -   Menguji kasus dasar di mana data ditransposisi dengan benar.
    -   Memverifikasi bahwa variabel baru (`case_lbl`, `Var1`, `Var2`, dll.) dibuat dengan nama *default* ketika tidak ada "Name Variable" yang disediakan.
    -   Memvalidasi bahwa nilai dari "Name Variable" digunakan dengan benar sebagai nama kolom baru.
-   **Penanganan Nama**: Menguji logika pembersihan dan pembuatan nama variabel yang unik, termasuk menangani nama duplikat, nama yang dimulai dengan angka, atau berisi karakter tidak valid.
-   **Kasus Tepi**:
    -   Memastikan fungsi mengembalikan hasil kosong jika tidak ada variabel yang dipilih untuk ditransposisi.
    -   Memastikan data yang hilang atau kosong ditangani dengan baik selama proses transposisi. 