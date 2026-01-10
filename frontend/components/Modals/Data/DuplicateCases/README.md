# Fitur Identifikasi Kasus Duplikat

Dokumen ini menjelaskan fungsionalitas fitur "Identifikasi Kasus Duplikat", yang berfungsi untuk mengenali dan menandai kasus-kasus duplikat dalam sebuah dataset berdasarkan variabel-variabel pencocokan yang telah ditentukan.

## 1. Gambaran Umum

Fitur ini memungkinkan pengguna untuk:
- Mengidentifikasi kasus duplikat berdasarkan nilai-nilai yang identik pada satu atau lebih variabel.
- Membuat variabel indikator baru untuk menandai mana kasus yang "primer" dan mana yang "duplikat".
- Mengurutkan kasus di dalam grup duplikat untuk menentukan kasus primer.
- Mengelola hasil dengan menyusun ulang data atau memfilter kasus duplikat.

## 2. Spesifikasi Fitur & Opsi

### Variabel Indikator Baru

Fitur ini dapat membuat dua variabel baru untuk membantu analisis duplikasi:

#### 1. Indikator Kasus Primer
- **Fungsi**: Membuat variabel (default: `PrimaryLast`) yang menandai setiap kasus sebagai primer (nilai 1) atau duplikat (nilai 0).
- **Pilihan Kasus Primer**: Pengguna dapat menentukan apakah kasus **pertama** atau **terakhir** dalam setiap grup duplikat yang akan dianggap sebagai primer.
- **Nama Variabel**: Nama untuk variabel indikator ini dapat disesuaikan.

#### 2. Penghitung Berurutan
- **Fungsi**: Membuat variabel (default: `MatchSequence`) yang memberikan nomor urut untuk setiap kasus di dalam grup duplikat (1, 2, 3, ...). Kasus yang unik (tidak memiliki duplikat) akan diberi nilai 0.
- **Manfaat**: Berguna untuk melihat berapa banyak duplikat yang ada dalam setiap grup.
- **Nama Variabel**: Nama untuk variabel penghitung ini dapat disesuaikan.

### Opsi Manajemen & Tampilan

#### 1. Pindahkan Kasus Duplikat ke Atas
- **Fungsi**: Jika diaktifkan, semua kasus yang memiliki duplikat akan dipindahkan ke bagian atas file data, memudahkan untuk inspeksi.

#### 2. Filter Kasus Duplikat
- **Fungsi**: Jika diaktifkan, setelah proses selesai, dataset akan secara otomatis difilter untuk hanya menampilkan kasus-kasus primer (di mana nilai indikator adalah 1). Ini adalah cara cepat untuk "menghapus" duplikat dari tampilan.

#### 3. Tampilkan Frekuensi
- **Fungsi**: Jika diaktifkan, tabel frekuensi untuk variabel-variabel baru yang dibuat akan ditampilkan di jendela Output. Ini memberikan ringkasan cepat tentang jumlah kasus primer dan duplikat yang ditemukan.

## 3. Contoh Penggunaan

### Skenario 1: Menemukan Duplikat yang Sama Persis
1.  Pindahkan **semua** variabel ke dalam daftar "Define matching cases by".
2.  Pilih apakah kasus pertama atau terakhir yang akan menjadi primer.
3.  Klik OK.
> Hasil: Variabel `PrimaryLast` akan bernilai 0 untuk setiap baris yang merupakan duplikat persis dari baris lain.

### Skenario 2: Membuat Dataset Tanpa Duplikat
1.  Pindahkan variabel kunci (misal: ID Pelanggan, Email) ke daftar "Define matching cases by".
2.  Pada tab **Options**, centang opsi "Filter out duplicate cases after processing".
3.  Klik OK.
> Hasil: Tampilan data akan langsung diperbarui dan hanya menunjukkan baris-baris yang unik/primer.

## 4. Rencana Pengembangan (Belum Diimplementasikan)

Fitur-fitur berikut direncanakan untuk rilis mendatang:
- **Pencocokan Fuzzy (Fuzzy Matching)**: Kemampuan untuk mengidentifikasi duplikat yang "mirip" tetapi tidak identik (misalnya, "Jhon Smith" vs "John Smith").
- **Aturan Pemilihan Primer Kustom**: Memungkinkan pengguna mendefinisikan aturan yang lebih kompleks untuk memilih kasus primer (misalnya, berdasarkan baris dengan data paling lengkap).
- **Antarmuka Review Duplikat**: Sebuah UI khusus untuk meninjau grup duplikat secara berdampingan dan secara manual memilih kasus primer atau menggabungkan data.
- **Laporan Kontribusi Variabel**: Ringkasan yang menunjukkan variabel mana yang paling sering menyebabkan sebuah kasus dianggap duplikat.

## 5. Detail Implementasi

Fitur ini menggunakan Web Worker (`duplicateCases.worker.js`) untuk melakukan pemrosesan data di latar belakang, mencegah UI menjadi tidak responsif. Alur prosesnya adalah sebagai berikut: UI mengumpulkan konfigurasi dari pengguna, mengirimkannya ke worker, worker mengidentifikasi grup duplikat, mengurutkannya jika perlu, menandai kasus primer, dan mengembalikan hasilnya. Thread utama kemudian memperbarui state aplikasi dengan membuat variabel baru dan mengisi nilainya.
Untuk data uji, lihat file `dummy_duplicate_cases.csv`.