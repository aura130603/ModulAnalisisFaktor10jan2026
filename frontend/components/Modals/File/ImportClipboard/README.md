# Fitur: Impor dari Clipboard

Dokumen ini menjelaskan fungsionalitas fitur "Impor dari Clipboard", yang memungkinkan pengguna untuk memasukkan data ke dalam aplikasi dengan menyalin dan menempelkan teks tabular.

## 1. Gambaran Umum

Fitur ini dirancang untuk memfasilitasi impor data yang cepat tanpa memerlukan file fisik. Prosesnya dibagi menjadi dua tahap utama yang intuitif, mirip dengan fungsi "Text to Columns" di Excel, untuk memastikan data diurai dengan benar.

1.  **Tahap Tempel (Paste Step)**: Pengguna menempelkan data mentah ke dalam sebuah area teks.
2.  **Tahap Konfigurasi (Configuration Step)**: Pengguna mendefinisikan bagaimana data tersebut harus diinterpretasikan, dengan pratinjau langsung dari hasil parsing.

## 2. Komponen Antarmuka & Fungsionalitas

### a. Tahap 1: Tempel Data
-   **Tombol "Paste from Clipboard"**: Menggunakan Clipboard API peramban untuk secara otomatis menempelkan teks, yang mungkin memerlukan izin dari pengguna.
-   **Area Teks Manual**: Area utama di mana pengguna dapat secara manual menempelkan data (misalnya, dengan `Ctrl+V`).
-   **Tombol Continue**: Membawa pengguna ke tahap konfigurasi setelah data ditempelkan. Tombol ini hanya aktif jika ada teks di area tersebut.
-   **Tur Fitur**: Tombol bantuan untuk memandu pengguna melalui langkah-langkah di tahap ini.

### b. Tahap 2: Konfigurasi Impor
-   **Opsi Delimiter**: Pilihan untuk menentukan karakter pemisah data (Tab, Koma, Titik Koma, Spasi, atau karakter kustom).
-   **Opsi Text Qualifier**: Memungkinkan pengguna memilih karakter (kutip ganda atau tunggal) yang digunakan untuk membungkus nilai teks, terutama yang mengandung delimiter.
-   **Opsi Tambahan**:
    -   `First row as headers`: Menginterpretasikan baris pertama sebagai nama variabel.
    -   `Trim whitespace`: Menghapus spasi di awal dan akhir dari setiap nilai.
    -   `Skip empty rows`: Mengabaikan baris yang tidak berisi data.
-   **Pratinjau Data**: Sebuah tabel interaktif (menggunakan `Handsontable`) yang menampilkan bagaimana data akan terlihat setelah diimpor dengan pengaturan yang sedang aktif. Pratinjau ini diperbarui secara *real-time* saat opsi diubah.
-   **Tombol Import**: Tombol final untuk memproses dan memuat data ke dalam aplikasi.

## 3. Alur Kerja & Logika

1.  **Tempel Teks**: Pengguna menempelkan teks ke dalam `ImportClipboardPasteStep`. State `pastedText` di dalam `useImportClipboardLogic` diperbarui.
2.  **Lanjut ke Konfigurasi**: Pengguna menekan "Continue". `useImportClipboardLogic` mengubah state `stage` menjadi `configure`.
3.  **Tampilkan Pratinjau**: `ImportClipboardConfigurationStep` dirender. Komponen ini segera memanggil utilitas `excelStyleTextToColumns` untuk menghasilkan pratinjau data berdasarkan teks yang ada dan opsi default.
4.  **Penyesuaian Interaktif**: Saat pengguna mengubah opsi (misalnya, mengubah delimiter dari Tab ke Koma), pratinjau data akan diperbarui secara otomatis dengan memanggil kembali `excelStyleTextToColumns`.
5.  **Finalisasi Impor**: Pengguna menekan "Import". Fungsi `processClipboardData` dari `useImportClipboardProcessor` dipanggil.
6.  **Pembaruan State Aplikasi**: Hook prosesor ini membuat struktur variabel dan data yang benar, lalu memanggil `overwriteAll` untuk memperbarui `useVariableStore` dan `useDataStore` dengan data baru.
7.  **Selesai**: Modal ditutup secara otomatis setelah impor berhasil.

## 4. Rencana Pengembangan di Masa Depan

-   **Dukungan Data Lebar Tetap (Fixed-Width)**: Menambahkan mode di mana pengguna dapat menentukan pemisahan kolom berdasarkan posisi karakter, bukan delimiter.
-   **Deteksi Tipe Data Lanjutan**: Kemampuan untuk mengubah tipe data (Numerik, String, Tanggal) untuk setiap kolom langsung dari pratinjau.
-   **Deteksi Otomatis Format Tanggal**: Mengidentifikasi format tanggal yang umum (misalnya, `dd/mm/yyyy` vs. `mm/dd/yyyy`) secara otomatis.
-   **Simpan Preset Konfigurasi**: Memungkinkan pengguna untuk menyimpan dan memuat kembali pengaturan impor yang sering digunakan.

## 5. Struktur Direktori & Tanggung Jawab

-   **`/` (Root)**
    -   **`index.tsx`**: **Orchestrator**. Merakit dan menampilkan langkah yang sesuai (`PasteStep` atau `ConfigurationStep`) berdasarkan state yang dikelola oleh `useImportClipboardLogic`.
    -   **`types.ts`**: Mendefinisikan semua tipe dan *interface* TypeScript yang relevan untuk fitur ini.
    -   **`README.md`**: (File ini) Dokumentasi fitur.

-   **`components/`**
    -   **`ImportClipboardPasteStep.tsx`**: Komponen UI untuk tahap pertama. Bertanggung jawab untuk menangani input teks dari pengguna, baik melalui *paste* manual maupun tombol.
    -   **`ImportClipboardConfigurationStep.tsx`**: Komponen UI untuk tahap kedua. Menampilkan opsi konfigurasi *parsing* dan pratinjau data menggunakan `Handsontable`.

-   **`hooks/`**
    -   **`useImportClipboardLogic.ts`**: Mengelola *state* utama modal, seperti tahap saat ini (`paste` atau `configure`), teks yang ditempel, dan navigasi antar-langkah.
    -   **`useImportClipboardProcessor.ts`**: Berisi logika untuk memproses, mengubah, dan mengimpor data. Hook ini dipanggil oleh `ConfigurationStep` untuk finalisasi.

-   **`services/`**
    -   **`services.ts`**: Abstraksi untuk interaksi dengan Browser API, khususnya `navigator.clipboard.readText()` untuk mengakses clipboard secara aman.

-   **`utils/`**
    -   **`utils.ts`**: Berisi fungsi utilitas inti, termasuk fungsi `excelStyleTextToColumns` yang merupakan jantung dari logika *parsing* teks menjadi struktur kolom dan baris.

## 6. Properti Komponen (`ImportClipboardProps`)

-   `onClose: () => void`: **(Wajib)** Fungsi *callback* yang dipanggil untuk menutup modal.
-   `containerType?: "dialog" | "sidebar"`: **(Opsional)** Menentukan konteks render untuk penyesuaian tata letak.

## 7. Ketergantungan Utama (Dependencies)

-   **Internal**:
    -   Zustand Stores (`useDataStore`, `useVariableStore`).
    -   Komponen UI dari `@/components/ui/*`.
-   **Eksternal**:
    -   `handsontable/react-wrapper`: Untuk menampilkan pratinjau data interaktif.
    -   `framer-motion`: Untuk animasi transisi dan *highlighting* pada fitur *tour*.
