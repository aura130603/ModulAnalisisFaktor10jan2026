# Fitur: Lompat ke (Go To)

Dokumen ini menjelaskan fungsionalitas dari fitur "Lompat ke", sebuah alat navigasi cepat yang dirancang untuk membantu pengguna berpindah ke lokasi tertentu dalam dataset dengan efisien.

## 1. Gambaran Umum

Fitur "Lompat ke" menyediakan cara mudah bagi pengguna untuk menavigasi langsung ke **kasus (baris)** atau **variabel (kolom)** tertentu tanpa perlu menggulir secara manual. Fungsionalitas ini sangat berguna pada dataset yang besar. Fitur ini dapat diakses sebagai dialog modal dan dilengkapi dengan tur interaktif untuk memandu pengguna baru.

## 2. Komponen Antarmuka & Fungsionalitas

### a. Tab Utama
Antarmuka utama dibagi menjadi dua mode yang dapat dipilih melalui tab:
-   **Case**: Memungkinkan navigasi berdasarkan nomor baris (kasus).
-   **Variable**: Memungkinkan navigasi berdasarkan nama kolom (variabel).

### b. Mode "Lompat ke Kasus" (Go to Case)
-   **Input Nomor Kasus**: Pengguna memasukkan nomor baris yang ingin dituju.
-   **Validasi Input**: Sistem secara otomatis memvalidasi input untuk memastikan nomor yang dimasukkan adalah bilangan bulat positif dan tidak melebihi jumlah total kasus dalam dataset. Pesan kesalahan akan ditampilkan jika input tidak valid.
-   **Informasi Total Kasus**: Menampilkan jumlah total kasus untuk referensi.
-   **Umpan Balik Navigasi**: Setelah menekan "Go", sebuah pesan akan muncul untuk mengonfirmasi apakah navigasi berhasil atau gagal.

### c. Mode "Lompat ke Variabel" (Go to Variable)
-   **Dropdown Pilihan Variabel**: Pengguna memilih variabel (kolom) yang ingin dituju dari daftar dropdown yang berisi semua variabel dalam dataset.
-   **Informasi Total Variabel**: Menampilkan jumlah total variabel yang tersedia.
-   **Umpan Balik Navigasi**: Sama seperti mode kasus, pesan konfirmasi akan ditampilkan setelah navigasi dicoba.

### d. Aksi & Bantuan
-   **Tombol Go**: Tombol utama untuk menjalankan aksi navigasi. Tombol ini akan nonaktif jika input yang diberikan tidak valid.
-   **Tombol Close**: Untuk menutup dialog.
-   **Tur Fitur**: Ikon `HelpCircle` akan memulai tur interaktif yang menjelaskan setiap elemen UI.

## 3. Alur Kerja & Logika

1.  **Pemilihan Mode**: Pengguna memilih apakah akan melompat ke "Case" atau "Variable".
2.  **Input Pengguna**: Pengguna memasukkan nomor kasus atau memilih nama variabel.
3.  **Eksekusi**: Pengguna menekan tombol "Go" atau menekan `Enter` pada keyboard.
4.  **Aksi Sistem**: Hook `useGoToForm` akan berkomunikasi dengan instance `Handsontable` dari tabel data.
5.  **Navigasi & Seleksi**: Tabel akan secara otomatis menggulir (scroll) ke baris atau kolom yang dituju dan menyorotnya.
6.  **Umpan Balik**: Pengguna akan melihat pesan status yang menginformasikan hasil dari operasi navigasi.

## 4. Rencana Pengembangan di Masa Depan

-   **Navigasi ke Sel Tertentu**: Menambahkan kemampuan untuk melompat ke sel spesifik dengan memasukkan kombinasi nama variabel dan nomor kasus (misalnya, seperti koordinat di Excel).
-   **Riwayat Navigasi**: Menyimpan beberapa tujuan navigasi terakhir untuk akses cepat.
-   **Integrasi dengan Tampilan Variabel**: Mengaktifkan fungsionalitas "Lompat ke" untuk tabel metadata variabel (Variable View). 