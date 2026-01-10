# Fitur: Transpose Data

Dokumen ini menjelaskan fungsionalitas fitur "Transpose", sebuah alat yang kuat untuk merestrukturisasi dataset dengan menukar baris dan kolom.

## 1. Gambaran Umum

Fungsi utama dari fitur "Transpose" adalah mengubah orientasi dataset: variabel (kolom) menjadi kasus (baris), dan sebaliknya. Ini sangat berguna untuk mengubah data dari format "lebar" (banyak kolom, sedikit baris) ke format "panjang" (sedikit kolom, banyak baris).

## 2. Komponen Antarmuka & Fungsionalitas

-   **Daftar Variabel (Available Variables)**: Menampilkan semua variabel yang tersedia dalam dataset saat ini.
-   **Variabel yang Akan Ditransposisi (Variable(s))**: Daftar ini menampung variabel-variabel yang telah Anda pilih untuk diubah menjadi baris dalam dataset yang baru.
-   **Variabel Penamaan (Name Variable)**: Kolom ini bersifat opsional. Anda dapat memindahkan **satu** variabel ke sini. Nilai dari setiap baris pada variabel ini akan digunakan sebagai nama untuk variabel (kolom) baru yang akan dibuat.

## 3. Variabel Baru yang Dihasilkan

-   **`case_lbl`**: Variabel ini dibuat secara otomatis. Kolom ini akan berisi nama-nama dari variabel asli yang Anda pilih untuk ditransposisi. Ini berfungsi sebagai pengidentifikasi untuk setiap baris baru.
-   **Variabel Kasus Baru**: Variabel-variabel baru (kolom) akan dibuat, satu untuk setiap kasus (baris) dalam data asli.
    -   Jika **Variabel Penamaan** tidak disediakan, nama-nama kolom baru akan menjadi `Var1`, `Var2`, `Var3`, dan seterusnya.
    -   Jika **Variabel Penamaan** disediakan, nama-nama kolom baru akan diambil dari nilai-nilai pada variabel tersebut. Nama yang tidak valid (misalnya, dimulai dengan angka atau berisi spasi) akan secara otomatis diperbaiki.

## 4. Contoh Penggunaan

### Skenario 1: Transposisi Sederhana (Wide to Long)
- **Kondisi**: Anda memiliki data penjualan per kuartal dengan kolom `Q1`, `Q2`, `Q3`, `Q4`. Anda ingin setiap kuartal menjadi baris.
1.  Pindahkan variabel `Q1`, `Q2`, `Q3`, dan `Q4` ke dalam daftar "Variable(s)".
2.  Biarkan "Name Variable" kosong.
3.  Klik **OK**.
> **Hasil**: Dataset baru akan memiliki 4 baris (satu untuk setiap kuartal). Kolom `case_lbl` akan berisi 'Q1', 'Q2', 'Q3', 'Q4'. Kolom-kolom lainnya akan menjadi `Var1`, `Var2`, ..., mewakili setiap responden/kasus asli.

### Skenario 2: Menggunakan Nilai sebagai Nama Kolom
- **Kondisi**: Anda memiliki data tahunan dengan kolom `ID_Produk`, `Tahun_2020`, `Tahun_2021`, `Tahun_2022`. Anda ingin setiap tahun menjadi baris dan menggunakan `ID_Produk` sebagai nama kolom baru.
1.  Pindahkan `Tahun_2020`, `Tahun_2021`, `Tahun_2022` ke daftar "Variable(s)".
2.  Pindahkan `ID_Produk` ke daftar "Name Variable".
3.  Klik **OK**.
> **Hasil**: Dataset baru akan memiliki 3 baris. Kolom-kolomnya akan dinamai berdasarkan nilai-nilai unik dari `ID_Produk`.

## 5. Rencana Pengembangan (Belum Diimplementasikan)
-   **Pratinjau Hasil**: Menampilkan pratinjau mini dari data yang akan ditransposisi sebelum pengguna mengklik OK.
-   **Opsi Baris Pertama sebagai Header**: Menambahkan opsi untuk menggunakan nilai dari baris pertama data sebagai nama untuk variabel baru.
-   **Agregasi Otomatis**: Jika ada duplikasi dalam variabel penamaan, berikan opsi untuk mengagregasi data (misalnya, rata-rata, jumlah) daripada hanya membuat nama unik.
-   **Peringatan Kinerja**: Memberikan peringatan kepada pengguna jika transposisi dataset yang sangat besar mungkin memakan waktu lama.

## 6. Detail Implementasi
Fitur ini memisahkan logika dari antarmuka pengguna.
-   **`hooks/useTranspose.ts`**: Mengelola state UI (variabel yang dipilih, dll.) dan memicu proses transposisi.
-   **`services/transposeService.ts`**: Berisi fungsi murni `transposeDataService` yang melakukan logika inti transposisi data. Fungsi ini mengambil data dan konfigurasi, lalu mengembalikan data dan variabel baru yang sudah ditransposisi.
-   **`TransposeUI.tsx`**: Komponen presentasi yang menampilkan daftar dan tombol, menerima semua data dan fungsi dari *hook*.

```
/Transpose
├── 📂 hooks/
│   └── 📄 useTranspose.ts       // Mengelola state & logika UI.
├── 📂 services/
│   └── 📄 transposeService.ts  // Logika bisnis inti untuk transposisi data.
├── 📄 index.tsx                 // Titik masuk & perakit (Orchestrator).
├── 📄 README.md                 // Dokumen ini.
├── 📄 TransposeUI.tsx           // Komponen UI (Presentational).
└── 📄 types.ts                 // Definisi tipe TypeScript.
```

-   **`index.tsx` (Orchestrator)**: Hanya bertindak sebagai perakit. Ia memanggil *hook* `useTranspose` dan menyambungkan propertinya ke komponen `TransposeUI`.
-   **`TransposeUI.tsx` (Komponen UI)**: Komponen "bodoh" yang bertanggung jawab untuk menampilkan semua elemen antarmuka pengguna, termasuk daftar variabel dan tombol.
-   **`hooks/useTranspose.ts` (Hook Logika)**: Mengelola state UI (seperti variabel mana yang tersedia, dipilih, dan untuk penamaan) dan menangani interaksi pengguna, mendelegasikan pemrosesan data ke *service*.
-   **`services/transposeService.ts` (Service)**: Berisi fungsi murni `transposeDataService` yang melakukan semua pekerjaan berat: mengambil data, variabel yang dipilih, dan variabel penamaan, lalu mengembalikan dataset dan daftar variabel baru yang sudah ditransposisi.
-   **`types.ts` (Definisi Tipe)**: Mengekspor semua tipe dan *props* yang diperlukan untuk memastikan keamanan tipe di seluruh fitur.

## Alur Kerja

1.  **Inisialisasi**: `useTranspose` mengambil daftar variabel saat ini dari `useVariableStore`.
2.  **Interaksi Pengguna**: Pengguna menyeret variabel ke dalam daftar "Variable(s)" dan (opsional) ke daftar "Name Variable".
3.  **Eksekusi**:
    -   Pengguna mengklik "OK".
    -   `handleOk` di dalam `useTranspose` dipanggil.
    -   Ia memanggil `transposeDataService`, memberikan data saat ini dan variabel yang dipilih pengguna.
    -   *Service* melakukan transposisi, membuat variabel `case_lbl`, dan membuat nama variabel baru.
    -   Hasilnya (data baru dan variabel baru) dikembalikan ke *hook*.
4.  **Pembaruan State**: *Hook* `useTranspose` memperbarui `useDataStore` dan `useVariableStore` dengan data dan variabel baru.
5.  **Selesai**: Modal ditutup.

## Usage Examples

### Simple Transposition

To convert a wide format dataset to long format:
1. Select all variables to transpose
2. Do not specify a name variable
3. Disable "Create Variable Names from First Row"
4. Click OK to process
5. The resulting dataset will have rows and columns switched

### Using Variable Values as Names

To transpose data with meaningful variable names:
1. Select the variables to transpose
2. Select an identifier variable as the "Name Variable"
3. Enable "Keep Original Variable as ID Variable" if needed
4. Click OK to process
5. The resulting dataset will use values from the name variable as the names of the new variables

### Headers from First Row

To use first row values as variable names:
1. Select the variables to transpose
2. Enable "Create Variable Names from First Row of Data"
3. Click OK to process
4. The resulting dataset will use the first row values as column names, and that row will be excluded from the data

## Notes

- Transposing a dataset can dramatically change its structure and may require additional data preparation before or after the operation.
- Variable types are preserved when possible, but some type conversions may occur if the transposed values are not compatible with the original type.
- Large datasets may take longer to transpose, as the operation requires reorganizing all data.
- If the resulting column names would contain invalid characters, they will be automatically modified to comply with variable naming rules.

## Implementation Details

The Transpose feature is implemented with a focus on flexibility and data integrity:

1. **User Interface**:
   - The UI provides clear selection of variables to transpose
   - Options for naming control help users get the desired output structure
   - Preview capability helps visualize the transformation

2. **Data Processing Flow**:
   - When the user clicks "OK", the selected variables are identified
   - Name sources are determined based on user selections
   - The data matrix is rotated in memory
   - New variables are created with appropriate names and types
   - The transposed data is written to the dataset

3. **Data Type Handling**:
   - Variable types are preserved when possible
   - Mixed types in a column are handled by conversion to the most appropriate common type
   - Missing values are preserved through the transposition process

## Sample Test Data

To test the Transpose feature, you can use the following sample dataset:

```
ID,Year,Q1,Q2,Q3,Q4
1,2020,10,15,20,25
2,2021,12,18,22,28
3,2022,14,21,24,30
```

### Test Scenarios

1. **Basic Transposition**:
   - Variables to Transpose: Q1, Q2, Q3, Q4
   - Expected Result: A dataset with rows for each quarter and columns for each year

2. **Using Year as Names**:
   - Variables to Transpose: Q1, Q2, Q3, Q4
   - Name Variable: Year
   - Expected Result: A dataset with rows for each quarter and columns named by year values

3. **Keeping ID Variable**:
   - Variables to Transpose: Year, Q1, Q2, Q3, Q4
   - Name Variable: ID
   - Keep Original Variable as ID: Checked
   - Expected Result: A dataset with ID as the first column, and transposed data with row names from the ID values

4. **First Row as Variable Names**:
   - Variables to Transpose: All
   - Create Variable Names from First Row: Checked
   - Expected Result: A dataset using the values from the first row as column names

These examples demonstrate how to use the Transpose Data feature for different data restructuring needs and validate the expected outcomes. 