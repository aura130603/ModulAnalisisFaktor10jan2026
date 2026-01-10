# Fitur: Atur Tingkat Pengukuran (Set Measurement Level)

Dokumen ini memberikan gambaran tentang fitur "Atur Tingkat Pengukuran", yang memungkinkan pengguna untuk secara efisien mendefinisikan tingkat pengukuran (Nominal, Ordinal, atau Scale) untuk variabel yang tingkat pengukurannya saat ini "Unknown".

## 1. Gambaran Umum

Fitur ini dirancang untuk mempercepat proses penentuan tipe data. Saat dibuka, modal secara otomatis mendeteksi dan menampilkan semua variabel dalam dataset yang tingkat pengukurannya belum ditentukan (`unknown`). Pengguna dapat dengan mudah memindahkan variabel-variabel ini ke kategori yang sesuai menggunakan antarmuka yang intuitif.

## 2. Antarmuka dan Komponen

-   **Daftar Variabel yang Belum Diketahui (Available)**: Menampilkan semua variabel dengan tingkat pengukuran `unknown`. Ini adalah sumber variabel yang akan dikategorikan.
-   **Daftar Target**: Tiga kotak terpisah untuk menampung variabel berdasarkan tingkat pengukuran yang diinginkan:
    -   `Nominal`: Untuk data kualitatif tanpa urutan (misalnya, 'Jenis Kelamin', 'Kota').
    -   `Ordinal`: Untuk data kualitatif dengan urutan (misalnya, 'Tingkat Pendidikan', 'Kepuasan Pelanggan').
    -   `Scale`: Untuk data kuantitatif/numerik (misalnya, 'Usia', 'Pendapatan').
-   **Tombol Panah**: Memungkinkan pemindahan variabel yang disorot dari daftar "Available" ke daftar target yang sesuai.

## 3. Alur Kerja dan Contoh Penggunaan

1.  **Inisialisasi**:
    -   Pengguna membuka modal "Set Measurement Level".
    -   Fitur secara otomatis memuat semua variabel yang tingkat pengukurannya `unknown` ke dalam daftar "Available".
2.  **Interaksi Pengguna**:
    -   Pengguna memilih satu atau lebih variabel di daftar "Available".
    -   Pengguna mengklik tombol panah yang menunjuk ke daftar `Nominal`, `Ordinal`, atau `Scale`.
    -   Variabel yang dipilih akan pindah dari daftar "Available" ke daftar target yang sesuai.
    -   **Contoh**: Variabel `gender` dan `city` dipindahkan ke `Nominal`. Variabel `education_level` dipindahkan ke `Ordinal`. Variabel `age` dan `income` dipindahkan ke `Scale`.
3.  **Penyimpanan**:
    -   Setelah semua variabel yang relevan telah dikategorikan, pengguna mengklik tombol **OK**.
    -   Tingkat pengukuran (`measure`) untuk setiap variabel yang dipindahkan akan diperbarui secara permanen di dalam data.
    -   Modal ditutup, dan perubahan akan langsung terlihat di seluruh aplikasi.

## 4. Tombol dan Fungsinya

-   **OK**: Menyimpan semua perubahan yang dibuat. Tingkat pengukuran untuk setiap variabel yang dipindahkan akan diperbarui.
-   **Cancel**: Menutup dialog tanpa menyimpan perubahan apa pun.
-   **Reset**: Mengembalikan semua variabel yang telah dipindahkan kembali ke daftar "Available", membatalkan semua perubahan yang dibuat dalam sesi dialog saat ini. (Tombol ini tidak ada di UI saat ini tetapi logikanya ada di hook).

## 5. Rencana Pengembangan (Belum Diimplementasikan)

-   **Saran Otomatis**: Fitur cerdas yang menganalisis nilai-nilai dalam variabel `unknown` untuk menyarankan tingkat pengukuran yang paling mungkin (misalnya, jika variabel string memiliki lebih dari 20 nilai unik, sarankan sebagai `Nominal`; jika numerik, sarankan sebagai `Scale`).
-   **Pengeditan Langsung**: Kemampuan untuk mengubah tingkat pengukuran variabel yang sudah dikategorikan langsung dari dalam dialog, tanpa harus me-resetnya terlebih dahulu.
-   **Informasi Variabel Tambahan**: Menampilkan informasi ringkas saat mouse diarahkan ke variabel, seperti jumlah nilai unik atau rentang data, untuk membantu pengambilan keputusan.
-   **Implementasi Tombol Reset**: Menambahkan tombol "Reset" pada UI untuk memanfaatkan fungsi `handleReset` yang sudah ada.

## 6. Detail Implementasi

Fitur ini mengikuti arsitektur modal standar aplikasi.
-   **`index.tsx`**: Titik masuk yang merakit *hook* dan komponen UI.
-   **`hooks/useSetMeasurementLevel.ts`**: Mengelola semua *state* (daftar variabel) dan logika (memindahkan, menyimpan, me-reset). Berkomunikasi dengan `useVariableStore` untuk mengambil dan memperbarui data variabel.
-   **`SetMeasurementLevelUI.tsx`**: Komponen presentasi yang murni menampilkan UI. Menggunakan komponen `VariableListManager` untuk menangani logika perpindahan variabel.
