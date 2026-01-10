# Fitur Analisis: Frequencies

Dokumen ini memberikan panduan lengkap mengenai fungsionalitas, komponen, dan detail teknis dari fitur "Frequencies".

## 1. Gambaran Umum

Fitur "Frequencies" digunakan untuk menghasilkan tabel frekuensi dan statistik deskriptif dasar untuk variabel. Ini adalah salah satu metode analisis paling fundamental untuk memahami distribusi nilai dalam data Anda.

Antarmuka fitur ini dibagi menjadi tiga tab utama untuk konfigurasi yang terperinci:
-   **Tab Variabel**: Memilih variabel yang akan dianalisis dan opsi untuk menampilkan tabel frekuensi.
-   **Tab Statistik**: Memilih berbagai statistik deskriptif, dari tendensi sentral hingga dispersi dan distribusi.
-   **Tab Grafik**: Mengonfigurasi pembuatan grafik visual seperti bar chart, pie chart, atau histogram.

## 2. Komponen Antarmuka & Fungsionalitas

### a. Tab Variabel (Variables)

-   **Variable(s)**: Daftar utama tempat pengguna menempatkan variabel yang ingin dianalisis.
-   **Display frequency tables**: Opsi ini (aktif secara default) mengontrol apakah tabel frekuensi yang merinci setiap nilai, hitungannya, dan persentasenya akan ditampilkan di output.

### b. Tab Statistik (Statistics)

Tab ini menyediakan kontrol granular atas statistik yang akan dihitung.
-   **Percentile Values**:
    -   `Quartiles`: Menghitung persentil ke-25, ke-50, dan ke-75.
    -   `Cut points`: Membagi data menjadi N kelompok yang sama besar.
    -   `Percentiles`: Memungkinkan pengguna untuk menentukan persentil kustom (misalnya, 10, 90).
-   **Central Tendency**:
    -   `Mean`: Rata-rata aritmatika.
    -   `Median`: Nilai tengah.
    -   `Mode`: Nilai yang paling sering muncul.
    -   `Sum`: Jumlah total semua nilai.
-   **Dispersion**:
    -   `Std. deviation`: Simpangan baku.
    -   `Variance`: Varians.
    -   `Range`: Rentang antara nilai maksimum dan minimum.
    -   `Minimum` dan `Maximum`: Nilai terendah dan tertinggi.
    -   `S. E. mean`: Standard Error dari Mean.
-   **Distribution**:
    -   `Skewness`: Ukuran kemiringan distribusi.
    -   `Kurtosis`: Ukuran keruncingan distribusi.

### c. Tab Grafik (Charts)

-   **Chart Type**: Memungkinkan pengguna memilih jenis visualisasi:
    -   `Bar charts`
    -   `Pie charts`
    -   `Histograms` (biasanya untuk variabel kontinu)
-   **Chart Values**: Menentukan apakah grafik akan didasarkan pada `Frequencies` (jumlah absolut) atau `Percentages`.
-   **Show normal curve on histogram**: Opsi khusus untuk menempatkan kurva normal di atas histogram guna membandingkan distribusi data dengan distribusi normal.

## 3. Alur Kerja Analisis

1.  Pengguna memilih satu atau lebih variabel di tab "Variables".
2.  Pengguna dapat menonaktifkan "Display frequency tables" jika hanya menginginkan statistik atau grafik.
3.  Di tab "Statistics" dan "Charts", pengguna memilih output tambahan yang diinginkan.
4.  Setelah menekan "OK", `useFrequenciesAnalysis` hook dipicu.
5.  Hook mengirimkan data variabel yang relevan dan semua opsi yang dipilih ke Web Worker.
6.  Web Worker menghitung semua statistik yang diminta dan membuat data tabel frekuensi.
7.  Setelah selesai, hasil mentah dikembalikan ke main thread.
8.  Fungsi `formatters` mengubah data menjadi tabel statistik dan tabel frekuensi yang terstruktur.
9.  `chartProcessor` membuat data yang diperlukan untuk rendering grafik.
10. Semua output yang telah diformat disimpan ke `ResultStore` dan ditampilkan kepada pengguna.

## 4. Detail Teknis

-   **Arsitektur Hook**: Fungsionalitas sangat modular, dipisahkan menjadi beberapa custom hook (`useVariableSelection`, `useStatisticsSettings`, `useChartsSettings`, `useDisplaySettings`, `useFrequenciesAnalysis`) untuk kejelasan dan kemudahan pengelolaan.
-   **Analisis Latar Belakang**: Semua perhitungan intensif dilakukan di Web Worker untuk memastikan UI tetap responsif.

## 5. Rencana Pengembangan (Future Enhancements)

-   **Penyempurnaan Grafik**: Mengimplementasikan rendering aktual untuk grafik yang dipilih (Bar, Pie, Histogram) menggunakan komponen `Chart.js`.
-   **Validasi Input**: Memberikan validasi input yang lebih baik di tab Statistik, misalnya, untuk nilai persentil.
-   **Pengurutan Tabel Frekuensi**: Menambahkan opsi untuk mengurutkan tabel frekuensi berdasarkan nilai (naik/turun) atau frekuensi (naik/turun). 