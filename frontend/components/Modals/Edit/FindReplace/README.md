# Fitur: Cari dan Ganti (Find and Replace)

Dokumen ini memberikan gambaran mendalam tentang fungsionalitas fitur "Cari dan Ganti", sebuah alat serbaguna yang terintegrasi untuk menemukan dan memodifikasi data dalam dataset.

## 1. Gambaran Umum

Fitur "Cari dan Ganti" memungkinkan pengguna untuk melakukan operasi pencarian teks yang kompleks di dalam kolom data tertentu. Pengguna dapat memilih untuk hanya menemukan data atau menggantinya dengan teks baru. Fungsionalitas ini dapat diakses sebagai dialog modal atau sebagai panel samping (sidebar) untuk fleksibilitas maksimum.

Fitur ini juga dilengkapi dengan tur interaktif untuk memandu pengguna baru melalui setiap elemen antarmuka dan fungsinya.

## 2. Komponen Antarmuka & Fungsionalitas

### a. Tab Utama
-   **Find**: Mode ini hanya digunakan untuk mencari teks. Input untuk teks pengganti dan tombol aksi terkait disembunyikan.
-   **Replace**: Mode ini menampilkan semua opsi, termasuk input untuk teks pengganti dan tombol "Replace" serta "Replace All".

### b. Kontrol Pencarian
-   **Column**: Dropdown untuk memilih kolom target di mana operasi pencarian dan penggantian akan dilakukan.
-   **Find**: Input teks untuk memasukkan kata atau frasa yang ingin dicari.
-   **Replace with**: (Hanya di tab Replace) Input teks untuk memasukkan kata atau frasa pengganti.

### c. Opsi Pencarian
-   **Match case**: Kotak centang untuk mengaktifkan pencarian yang peka terhadap huruf besar-kecil (case-sensitive).
-   **Match in**: Grup opsi untuk menentukan logika pencocokan:
    -   `Any part of cell`: Menemukan kecocokan di mana saja di dalam sel.
    -   `Entire cell`: Menemukan kecocokan hanya jika seluruh isi sel sama persis.
    -   `Beginning of cell`: Menemukan kecocokan di awal sel.
    -   `End of cell`: Menemukan kecocokan di akhir sel.
-   **Direction**: Menentukan arah pencarian untuk tombol navigasi:
    -   `Down`: Mencari ke bawah dari posisi sel aktif.
    -   `Up`: Mencari ke atas dari posisi sel aktif.

### d. Aksi & Navigasi
-   **Tombol Navigasi (Find Next/Previous)**: Tombol dengan ikon panah untuk melompat ke kecocokan berikutnya atau sebelumnya berdasarkan arah yang dipilih.
-   **Tombol Replace**: (Hanya di tab Replace) Mengganti teks pada kecocokan yang sedang disorot dan secara otomatis pindah ke kecocokan berikutnya.
-   **Tombol Replace All**: (Hanya di tab Replace) Mengganti semua kecocokan yang ditemukan di kolom yang dipilih secara serentak.
-   **Tombol Close**: Menutup dialog atau panel.

### e. Umpan Balik Pengguna
-   **Jumlah Hasil**: Menampilkan jumlah total kecocokan yang ditemukan (misalnya, "2 of 5").
-   **Pesan Status**: Menampilkan pesan seperti "No results" jika tidak ada kecocokan.
-   **Pesan Error**: Menampilkan pesan jika input tidak valid (misalnya, teks pencarian kosong).

## 3. Alur Kerja & Logika

1.  **Pencarian Otomatis**: Pencarian dijalankan secara otomatis dengan jeda singkat (debounce) setelah pengguna selesai mengetik di input "Find".
2.  **Navigasi**: Mengklik tombol "Find Next" atau "Find Previous" akan memilih sel yang cocok di dalam tabel data dan menggulir ke sel tersebut.
3.  **Penggantian Tunggal (Replace)**: Jika sebuah sel sedang disorot, mengklik "Replace" akan memperbarui nilainya dan memindahkan sorotan ke hasil berikutnya.
4.  **Penggantian Massal (Replace All)**: Mengklik "Replace All" akan memperbarui semua sel yang cocok sekaligus tanpa memerlukan navigasi manual.

## 4. Rencana Pengembangan di Masa Depan

-   **Pencarian di Seluruh Kolom**: Menambahkan opsi untuk melakukan pencarian di semua kolom secara bersamaan.
-   **Dukungan Regular Expression (Regex)**: Memungkinkan pengguna untuk menggunakan pola regex untuk pencarian yang lebih canggih.
-   **Riwayat Pencarian**: Menyimpan daftar pencarian terakhir untuk akses cepat.
-   **Integrasi dengan Tampilan Variabel**: Memungkinkan fungsionalitas "Cari dan Ganti" pada tampilan metadata variabel (Variable View). 