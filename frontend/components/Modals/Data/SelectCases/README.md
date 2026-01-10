# Fitur Pilih Kasus (Select Cases)

Dokumen ini menjelaskan fungsionalitas fitur "Pilih Kasus", yang memungkinkan pengguna untuk memfilter atau menghapus baris (kasus) berdasarkan berbagai kriteria.

## 1. Gambaran Umum

Fitur "Pilih Kasus" memungkinkan pengguna untuk menyaring dataset mereka dengan memilih kasus-kasus tertentu yang memenuhi kriteria, atau untuk menghapus secara permanen kasus yang tidak dipilih. Ini berguna untuk memfokuskan analisis pada subset data, membuat sampel, atau membuang observasi yang tidak diinginkan.

## 2. Metode Seleksi

#### a. Semua Kasus
Pilih opsi ini untuk memilih semua kasus dalam dataset. Opsi ini secara efektif akan menghapus filter yang sebelumnya diterapkan.

#### b. Berdasarkan Kondisi (If condition is satisfied)
Opsi ini memungkinkan Anda membuat ekspresi logika untuk memfilter kasus.
- Hanya kasus yang memenuhi kondisi yang akan dipilih.
- Gunakan operator perbandingan (`>`, `<`, `==`, `!=`) dan operator logika (`&` untuk AND, `|` untuk OR, `~` untuk NOT).
- Mendukung berbagai fungsi matematis dan teks untuk membangun kondisi yang kompleks.

#### c. Sampel Acak (Random sample of cases)
Pilih subset acak dari kasus:
- **Perkiraan (Approximately)**: Memilih sekitar persentase tertentu dari total kasus.
- **Tepat (Exactly)**: Memilih jumlah kasus yang tepat dari N kasus pertama.

#### d. Berdasarkan Rentang (Based on time or case range)
Memilih kasus berdasarkan posisinya dalam dataset:
- **Kasus Pertama**: Nomor kasus awal (indeks berbasis 1).
- **Kasus Terakhir**: Nomor kasus akhir (indeks berbasis 1).
- Jika kasus pertama dikosongkan, seleksi dimulai dari awal.
- Jika kasus terakhir dikosongkan, seleksi berlanjut hingga akhir.

#### e. Gunakan Variabel Filter
Menggunakan variabel yang sudah ada sebagai filter:
- Nilai **bukan nol** / **bukan kosong** pada variabel yang dipilih menandakan kasus yang akan dipilih.
- Nilai **nol** / **kosong** menandakan kasus yang akan disaring.

## 3. Opsi Output

#### a. Filter Kasus yang Tidak Dipilih
- Filter diterapkan untuk menyembunyikan sementara kasus yang tidak dipilih.
- Variabel filter (`filter_$`) akan dibuat atau diperbarui.
- Dataset asli tetap utuh, tetapi hanya kasus yang dipilih yang akan ditampilkan. Filter dapat dihapus nanti.

#### b. Hapus Kasus yang Tidak Dipilih
- Kasus yang tidak dipilih akan dihapus **secara permanen** dari dataset.
- Operasi ini tidak dapat dibatalkan.

## 4. Contoh Penggunaan

- **Filter berdasarkan Kondisi**: Untuk memilih kasus dengan `usia > 30` DAN `pendapatan >= 50000`, gunakan ekspresi: `age > 30 & income >= 50000`.
- **Membuat Sampel Acak**: Untuk membuat sampel acak 10%, pilih "Random sample", lalu "Approximately", dan masukkan "10".
- **Memilih Rentang**: Untuk memilih kasus 100 hingga 500, pilih "Based on... range", lalu masukkan "100" di "First Case" dan "500" di "Last Case".

## 5. Rencana Pengembangan (Belum Diimplementasikan)
- **Seleksi Berdasarkan Waktu**: Kemampuan untuk memilih rentang berdasarkan variabel tanggal/waktu yang sebenarnya, bukan hanya nomor kasus.
- **Simpan & Muat Ekspresi**: Opsi untuk menyimpan ekspresi filter yang kompleks untuk digunakan kembali nanti.
- **Umpan Balik Visual**: Memberikan highlight visual secara *real-time* pada baris data yang akan dipilih saat ekspresi sedang dibuat.
- **Grup Fungsi Kustom**: Memungkinkan pengguna untuk menyimpan dan menggunakan kembali gabungan fungsi logika yang sering digunakan.

## 6. Detail Implementasi & Sintaksis

### Arsitektur
Fitur ini diimplementasikan dengan beberapa komponen:
- **`index.tsx`**: Antarmuka utama yang mengelola state melalui hook `useSelectCases`.
- **`dialogs/`**: Berisi sub-dialog untuk setiap metode seleksi (`IfCondition`, `RandomSample`, `Range`).
- **`hooks/useSelectCases.ts`**: Mengandung logika bisnis utama, mengelola state, dan berinteraksi dengan store (Zustand).
- **`services/`**:
    - **`evaluator.ts`**: Mesin inti yang mem-parsing dan mengevaluasi ekspresi kondisional.
    - **`selectors.ts`**: Berisi fungsi-fungsi murni untuk melakukan berbagai jenis seleksi data (berdasarkan kondisi, rentang, dll).

### Sintaksis Ekspresi Kondisi

#### Operator Perbandingan
- `==` Sama dengan (untuk angka dan teks)
- `!=` Tidak sama dengan
- `>` Lebih besar dari
- `<` Kurang dari
- `>=` Lebih besar dari atau sama dengan
- `<=` Kurang dari atau sama dengan

#### Operator Logika
- `&` AND (kedua kondisi harus benar)
- `|` OR (salah satu kondisi harus benar)
- `~` NOT (membalikkan kondisi)

#### Contoh Fungsi yang Didukung
- **Matematika**: `ABS()`, `SQRT()`, `ROUND()`, `MAX()`, `MIN()`, `SUM()`
- **Teks**: `CONCAT()`, `LENGTH()`, `LOWER()`, `UPPER()`, `TRIM()`
- **Statistik**: `MEAN()`, `MEDIAN()`, `SD()`, `COUNT()`
- **Lainnya**: `MISSING()` (untuk memeriksa nilai yang hilang)

#### Contoh Ekspresi
```
# Perbandingan dasar
age > 30
region == "North"

# Menggabungkan kondisi
age > 30 & income >= 50000
gender == "F" | age < 25
~(region == "North")

# Menggunakan fungsi
SQRT(income) > 250
LOWER(gender) == "f"
~MISSING(income)
```

</rewritten_file>