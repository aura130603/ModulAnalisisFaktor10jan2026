# Daftar Skenario Blackbox Testing untuk Alpha Testing dan Uji Usabilitas

## Skenario untuk Alpha Testing

### 1. Impor Dataset dan Eksplorasi Dasar
**Tujuan:** Memastikan pengguna dapat mengimpor data dan menavigasi antarmuka dengan baik
**Langkah-langkah:**
1. Buka aplikasi Statify
2. Impor dataset menggunakan salah satu metode (CSV, Excel, SAV, atau dataset contoh)
3. Jelajahi tampilan data dan variabel
4. Gunakan menu konteks pada tabel data (sisipkan/hapus baris/kolom)
5. Gunakan menu konteks pada tabel variabel (sisipkan/hapus variabel)

**Metrik Keberhasilan:**
- Dataset berhasil diimpor tanpa error
- Pengguna dapat dengan mudah menavigasi antara tampilan data dan variabel
- Fungsi menu konteks bekerja dengan benar

### 2. Manipulasi Data Dasar
**Tujuan:** Mengidentifikasi masalah dalam fungsi penyuntingan data
**Langkah-langkah:**
1. Buka dataset yang telah diimpor
2. Gunakan fungsi Find dan Replace untuk mencari dan mengganti nilai
3. Gunakan fungsi Go To untuk navigasi ke baris/variabel tertentu
4. Lakukan operasi Cut, Copy, Paste, dan Clear menggunakan menu Edit
5. Urutkan data menggunakan Sort Cases

**Metrik Keberhasilan:**
- Semua fungsi penyuntingan bekerja sesuai harapan
- Navigasi data berjalan lancar
- Tidak ada kebocoran memori atau error saat manipulasi data

### 3. Definisi Variabel dan Pengukuran
**Tujuan:** Memastikan pengguna dapat mendefinisikan properti variabel dengan benar
**Langkah-langkah:**
1. Buka tampilan variabel
2. Gunakan modal Define Variable Properties untuk mengatur properti variabel
3. Atur tingkat pengukuran menggunakan Set Measurement Level
4. Definisikan format tanggal/waktu jika ada variabel tanggal

**Metrik Keberhasilan:**
- Properti variabel dapat diatur dengan benar
- Tingkat pengukuran tersimpan dan diterapkan dengan tepat
- Format tanggal/waktu ditampilkan sesuai konfigurasi

## Skenario untuk Uji Usabilitas Pengguna

### 1. Alur Kerja Analisis Deskriptif
**Tujuan:** Menilai kemudahan penggunaan untuk analisis statistik dasar
**Langkah-langkah:**
1. Buka dataset
2. Lakukan analisis Descriptives pada beberapa variabel
3. Buat analisis Frequencies dengan grafik
4. Eksplorasi data menggunakan Explore
5. Buat tabel silang dengan Crosstabs

**Metrik Keberhasilan:**
- Pengguna dapat menyelesaikan alur analisis tanpa bantuan
- Antarmuka intuitif dan mudah dipahami
- Hasil analisis ditampilkan dengan jelas

### 2. Manajemen Data Lanjutan
**Tujuan:** Mengidentifikasi kompleksitas dalam fitur manajemen data
**Langkah-langkah:**
1. Identifikasi dan tangani kasus duplikat
2. Terapkan pembobotan kasus (Weight Cases)
3. Seleksi kasus berdasarkan kondisi tertentu
4. Agregasi data berdasarkan variabel tertentu
5. Transposisi dataset

**Metrik Keberhasilan:**
- Pengguna dapat memahami dan menggunakan fitur manajemen data
- Proses berjalan tanpa error
- Hasil sesuai dengan ekspektasi pengguna

### 3. Ekspor dan Berbagi Hasil
**Tujuan:** Memastikan pengguna dapat menyimpan dan berbagi hasil analisis
**Langkah-langkah:**
1. Lakukan beberapa analisis statistik
2. Eksport hasil ke format CSV
3. Eksport hasil ke format Excel
4. Cetak hasil analisis ke PDF
5. Simpan proyek untuk digunakan nanti

**Metrik Keberhasilan:**
- Semua format ekspor berfungsi dengan benar
- File hasil sesuai dengan data asli
- Proses ekspor cepat dan andal

## Catatan untuk Pengujian

1. **Prioritas Tinggi:** Fokus pada skenario alpha testing terlebih dahulu untuk mengidentifikasi bug kritis
2. **Pengamatan Pengguna:** Catat kesulitan yang dialami pengguna selama uji usabilitas
3. **Umpan Balik Kualitatif:** Kumpulkan komentar pengguna tentang desain antarmuka dan alur kerja
4. **Metrik Kuantitatif:** Ukur waktu penyelesaian tugas dan tingkat keberhasilan

Skenario ini mencakup fitur inti aplikasi dan memberikan cakupan yang baik untuk pengujian awal sebelum rilis beta.