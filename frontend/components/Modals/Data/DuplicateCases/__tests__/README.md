# Pengujian Fitur Identifikasi Kasus Duplikat

Dokumen ini memberikan ringkasan tentang strategi pengujian untuk fitur "Identify Duplicate Cases". Pengujian ini dibagi menjadi beberapa file, masing-masing bertanggung jawab untuk memvalidasi bagian tertentu dari fungsionalitas.

## `index.test.tsx`

File ini berisi pengujian untuk komponen UI utama, `DuplicateCases`. Tujuannya adalah untuk memastikan bahwa antarmuka pengguna (UI) dirender dengan benar dan merespons interaksi pengguna dasar.

- **Render Komponen**: Memverifikasi bahwa komponen modal, judul, dan tab dirender dengan benar dalam mode "dialog" dan "sidebar".
- **Interaksi Pengguna**:
    - Mensimulasikan klik pada tombol `OK`, `Cancel`, dan `Reset` untuk memastikan fungsi yang benar dipanggil.
    - Menguji perpindahan antar tab ("Variables" dan "Options").
    - Memastikan tombol dinonaktifkan dengan benar saat proses sedang berjalan (`isProcessing`).
- **Logika UI**:
    - Memverifikasi bahwa dialog kesalahan muncul saat `errorDialogOpen` bernilai `true`.
    - Menguji aktivasi tur panduan saat tombol bantuan diklik.
- **Isolasi**: Semua hook kustom (`useDuplicateCases`, `useTourGuide`) dan komponen anak di-mock untuk mengisolasi pengujian pada logika komponen `DuplicateCases` itu sendiri.

## `useDuplicateCases.test.ts`

Pengujian ini fokus pada hook kustom `useDuplicateCases`, yang berisi logika bisnis inti dan manajemen state untuk fitur ini.

- **Manajemen State**:
    - Memastikan state diinisialisasi dengan benar, mengambil variabel dari store Zustand.
    - Menguji pemindahan variabel antara daftar "source", "matching", dan "sorting".
    - Menguji fungsionalitas `handleReset` untuk mengembalikan state ke kondisi awal.
- **Logika Konfirmasi**:
    - Memvalidasi bahwa error ditampilkan jika tidak ada variabel pencocokan yang dipilih.
    - Mensimulasikan alur konfirmasi utama (`handleConfirm`), memastikan layanan `processDuplicates` dipanggil.
    - Menguji berbagai opsi seperti:
        - `moveMatchingToTop`: Memastikan data diurutkan ulang.
        - `filterByIndicator`: Memastikan data yang terduplikasi difilter.
        - `displayFrequencies`: Memastikan log statistik dibuat.
- **Isolasi**: Store (Zustand) dan modul layanan (`duplicateCasesService`) di-mock untuk mengisolasi pengujian pada logika hook.

## `duplicateCasesService.test.ts`

File ini berisi unit test untuk fungsi-fungsi murni (`pure functions`) yang melakukan pemrosesan data.

- **`processDuplicates`**:
    - Menguji identifikasi duplikat berdasarkan pencocokan variabel yang tepat.
    - Menguji identifikasi duplikat parsial.
    - Memverifikasi bahwa pengurutan dalam grup duplikat berfungsi dengan benar.
    - Memastikan penandaan kasus "utama" (pertama atau terakhir) sudah benar.
    - Memvalidasi pembuatan nomor urut duplikat (`sequenceValues`).
    - Menguji logika pengurutan ulang data (`reorderedData`).
- **`generateStatistics`**:
    - Memverifikasi pembuatan tabel frekuensi yang benar untuk variabel indikator utama.
    - Memastikan tabel frekuensi untuk variabel sekuensial dibuat hanya jika opsi diaktifkan.
    - Menangani kasus di mana tidak ada data untuk diproses. 