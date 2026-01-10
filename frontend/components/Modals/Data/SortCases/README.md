# Fitur: Urutkan Kasus (Sort Cases)

Dokumen ini menjelaskan fungsionalitas fitur "Urutkan Kasus", yang memungkinkan pengguna untuk menyusun ulang baris (kasus) dalam dataset berdasarkan nilai dari satu atau lebih variabel. Ini adalah langkah fundamental dalam persiapan data yang membantu dalam inspeksi data, analisis, dan pelaporan.

## 1. Komponen Antarmuka & Fungsionalitas

-   **Daftar Variabel (Available Variables)**: Menampilkan semua variabel yang tersedia untuk dijadikan kunci pengurutan.
-   **Daftar Urutkan Berdasarkan (Sort By)**: Daftar ini menampung variabel yang telah dipilih sebagai kunci pengurutan. **Urutan variabel di dalam daftar ini sangat penting**, karena menentukan prioritas pengurutan (variabel teratas adalah kunci primer, yang kedua adalah kunci sekunder, dst.).
-   **Kontrol Pengurutan**: Ketika sebuah variabel di dalam daftar "Sort By" disorot:
    -   **Arah Urutan**: Pilihan untuk mengurutkan secara menaik (`Ascending`) atau menurun (`Descending`).
    -   **Prioritas Urutan**: Tombol "Pindah ke Atas" (`Move Up`) dan "Pindah ke Bawah" (`Move Down`) untuk mengubah prioritas pengurutan variabel.

## 2. Alur Kerja & Contoh Penggunaan

### Contoh 1: Pengurutan Satu Level
- **Tujuan**: Mengurutkan seluruh dataset berdasarkan `Pendapatan` (`Income`) dari yang tertinggi ke terendah.
1.  Buka dialog "Sort Cases".
2.  Pilih variabel `Income` dari daftar kiri.
3.  Pindahkan ke daftar "Sort By".
4.  Klik pada variabel `Income` di daftar "Sort By".
5.  Pilih `Descending` pada opsi "Sort Order".
6.  Klik **OK**.
> **Hasil**: Seluruh dataset akan diurutkan ulang, dengan kasus yang memiliki `Income` tertinggi muncul di baris paling atas.

### Contoh 2: Pengurutan Multi-Level
- **Tujuan**: Mengelompokkan kasus berdasarkan `Departemen` (`Department`), lalu di dalam setiap departemen, urutkan berdasarkan `Pendapatan` (`Income`) dari tertinggi ke terendah.
1.  Pindahkan variabel `Department` ke daftar "Sort By". Biarkan arahnya `Ascending` (A-Z).
2.  Pindahkan variabel `Income` ke daftar "Sort By", pastikan posisinya di bawah `Department`.
3.  Klik pada variabel `Income` di daftar "Sort By" dan ubah arahnya menjadi `Descending`.
4.  Klik **OK**.
> **Hasil**: Dataset akan dikelompokkan berdasarkan departemen secara alfabetis. Di dalam setiap grup departemen, kasus akan diurutkan berdasarkan pendapatan dari yang tertinggi.

## 3. Rencana Pengembangan (Belum Diimplementasikan)
-   **Simpan Konfigurasi Urutan**: Kemampuan untuk menyimpan skema pengurutan yang sering digunakan untuk dapat diterapkan kembali dengan cepat.
-   **Urutkan Berdasarkan Label Nilai**: Opsi untuk mengurutkan berdasarkan label nilai (misalnya, "Sangat Puas", "Puas") daripada nilai numerik mentahnya (misalnya, 5, 4).
-   **Indikator Stabilitas**: Menambahkan informasi apakah algoritma pengurutan yang digunakan bersifat *stable* (mempertahankan urutan asli dari elemen yang sama).
-   **Penerapan pada Subset**: Opsi untuk menerapkan pengurutan hanya pada kasus yang saat ini dipilih (terfilter).

## 4. Detail Implementasi
Fitur ini dirancang sesuai dengan panduan arsitektur utama untuk komponen modal, dengan pemisahan tanggung jawab yang jelas.
-   **`index.tsx`**: Bertanggung jawab untuk merakit fitur, memanggil *hook*, dan merender UI.
-   **`hooks/useSortCases.ts`**: Mengelola semua *state* (daftar variabel, konfigurasi urutan) dan logika (memindahkan, mengubah arah, menyimpan). Ia memanggil `sortData` dari `useDataStore` dengan serangkaian konfigurasi untuk menerapkan pengurutan.
-   **`SortCasesUI.tsx`**: Komponen presentasi murni yang menerima semua data dan *handler* sebagai *props*. Ia menggunakan `VariableListManager` untuk menampilkan daftar dan kontrol interaktif.

```
/SortCases
├── 📂 hooks/
│   └── 📄 useSortCases.ts    // Mengelola semua state & logika
├── 📄 index.tsx              // Titik masuk & perakit (Orchestrator)
├── 📄 README.md              // Dokumen ini
├── 📄 SortCasesUI.tsx        // Komponen UI (Presentational)
└── 📄 types.ts              // Definisi tipe TypeScript
```

-   **`index.tsx` (Orchestrator)**:
    -   Bertanggung jawab untuk merakit fitur.
    -   Memanggil *hook* `useSortCases` untuk mendapatkan state dan *handler*.
    -   Merender `SortCasesUI` dan meneruskan *props* yang diperlukan.

-   **`useSortCases.ts` (Hook Logika)**:
    -   Mengelola state untuk daftar variabel yang tersedia dan variabel yang dipilih untuk pengurutan (`sortByConfigs`).
    -   Menyimpan konfigurasi pengurutan untuk setiap variabel (termasuk arah pengurutan).
    -   Menyediakan *handler* untuk memindahkan variabel, mengubah urutan, dan mengubah arah pengurutan.
    -   Memanggil `sortData` dari `useDataStore` saat pengguna mengonfirmasi tindakan.

-   **`SortCasesUI.tsx` (Komponen UI)**:
    -   Komponen presentasi murni yang menerima semua data dan *handler* dari `index.tsx`.
    -   Menggunakan `VariableListManager` untuk menampilkan daftar variabel.
    -   Merender kontrol tambahan (misalnya, tombol radio untuk arah pengurutan) saat sebuah variabel dalam daftar "Sort By" dipilih.
    -   Tidak mengandung logika bisnis apa pun.

-   **`types.ts` (Definisi Tipe)**:
    -   Mendefinisikan *interface* seperti `SortVariableConfig` (untuk menyimpan variabel dan arah pengurutannya).
    -   Mendefinisikan *props* untuk `SortCasesModal` dan `SortCasesUI`, memastikan keamanan tipe.

## Alur Kerja

1.  **Inisialisasi**:
    -   Pengguna membuka modal "Sort Cases".
    -   `useSortCases` mengambil semua variabel dari `useVariableStore` dan menampilkannya di daftar "Available".

2.  **Interaksi Pengguna**:
    -   Pengguna memindahkan satu atau lebih variabel dari daftar "Available" ke daftar "Sort By".
    -   Untuk setiap variabel yang dipindahkan, konfigurasi default (misalnya, `ascending`) diterapkan.
    -   Pengguna dapat memilih variabel di daftar "Sort By" untuk mengubah arah pengurutannya (naik/turun) atau mengubah posisinya dalam antrian prioritas.

3.  **Penyimpanan**:
    -   Pengguna mengklik "OK".
    -   *Handler* `handleOk` di dalam *hook* dipanggil.
    -   Fungsi ini melakukan iterasi melalui `sortByConfigs` sesuai urutannya.
    -   Untuk setiap konfigurasi, ia memanggil `sortData` dari `useDataStore` dengan `columnIndex` dan `direction` yang sesuai.
    -   `useDataStore` memperbarui state datanya, dan perubahan ini secara otomatis tercermin di seluruh aplikasi.
    -   Modal ditutup. 