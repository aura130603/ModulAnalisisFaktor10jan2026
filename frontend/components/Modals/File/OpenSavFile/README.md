# Fitur: Buka File SAV (.sav)

Dokumen ini memberikan ringkasan teknis dan fungsional untuk fitur "Buka File SAV", yang memungkinkan pengguna untuk memuat file data SPSS.

## 1. Gambaran Umum

Fitur ini menyediakan antarmuka modal bagi pengguna untuk membuka file data statistik SPSS (`.sav`). Berbeda dengan proses impor dari file teks (seperti CSV) yang di-parsing di sisi klien, pemrosesan file `.sav` dilakukan sepenuhnya di **sisi server (backend)** untuk menangani format biner yang kompleks.

Modal ini dirancang untuk kesederhanaan, hanya terdiri dari satu langkah:

-   **Pemilihan File**: Pengguna memilih file `.sav` dari komputer mereka melalui dialog file atau dengan mekanisme *drag-and-drop*.
-   **Tur Interaktif**: Fitur ini juga dilengkapi dengan tur opsional yang memandu pengguna baru melalui setiap langkah.

## 2. Komponen Antarmuka & Fungsionalitas

-   **Area Pemuatan File**: Sebuah zona interaktif tempat pengguna dapat mengklik untuk memilih file atau menarik dan melepaskannya.
-   **Pratinjau File Terpilih**: Setelah file dipilih, namanya akan ditampilkan bersama dengan ukurannya. Pengguna juga dapat menghapus pilihan file.
-   **Pesan Status dan Error**: Antarmuka memberikan umpan balik yang jelas, baik saat terjadi error (misalnya, tipe file salah) maupun saat proses pemuatan sedang berlangsung.
-   **Tombol Aksi**:
    -   `Buka (Open)`: Memulai proses pengiriman file ke backend. Tombol ini hanya aktif jika file yang valid telah dipilih.
    -   `Batal (Cancel)`: Menutup modal tanpa melakukan tindakan.
    -   `Bantuan (Help)`: Memulai tur interaktif.

## 3. Alur Kerja Teknis

1.  **Inisialisasi**: Pengguna membuka modal. Komponen `OpenSavFileModal` dirender.
2.  **Pemilihan File**: Pengguna memilih file `.sav`. `useOpenSavFileLogic` menangani state file dan melakukan validasi ekstensi.
3.  **Pengiriman ke Backend**: Pengguna menekan tombol "Buka".
    -   `handleSubmit` di dalam `useOpenSavFileLogic` dipanggil.
    -   Sebuah objek `FormData` dibuat yang berisi file.
    -   `services.ts` dipanggil untuk mengirim `FormData` ke API endpoint di backend.
4.  **Pemrosesan Backend**: Server menerima file `.sav`, mem-parsing format binernya (metadata, variabel, dan data), dan mengembalikan data terstruktur dalam format JSON.
5.  **Pemetaan Frontend**:
    -   `useOpenSavFileLogic` menerima respons JSON.
    -   Hook ini memanggil utilitas terpusat (`processSavApiResponse` dari `@/utils/savFileUtils.ts`) untuk memetakan `sysvars` menjadi `Variable[]`, `valueLabels` menjadi `ValueLabel[]`, dan `rows` menjadi matriks data 2D.
6.  **Pembaruan State Global**: Data dan variabel yang telah ditransformasi dimuat ke dalam *store* Zustand (`useDataStore`, `useVariableStore`, `useMetaStore`).
7.  **Selesai**: Modal ditutup secara otomatis setelah data berhasil dimuat.

## 4. Contoh Penggunaan

```tsx
import OpenSavFileModal from "@/components/Modals/File/OpenSavFile"; // Sesuaikan path jika perlu

const MyPage = () => {
    const [isModalOpen, setModalOpen] = React.useState(false);

    const handleClose = () => {
        setModalOpen(false);
        // Lakukan sesuatu setelah modal ditutup atau file dibuka
    };

    return (
        <>
            <Button onClick={() => setModalOpen(true)}>Buka File .sav</Button>
            {isModalOpen && (
                <OpenSavFileModal
                    onClose={handleClose}
                    containerType="dialog"
                />
            )}
        </>
    );
};
```

## 5. Rencana Pengembangan (Future Enhancements)

-   **Pratinjau Data**: Menampilkan beberapa baris pertama dari data `.sav` di dalam modal sebelum memuatnya secara penuh.
-   **Dukungan untuk File Terenkripsi**: Menambahkan opsi untuk memasukkan kata sandi untuk file `.sav` yang terproteksi.
-   **Peningkatan Performa**: Untuk file yang sangat besar, mengimplementasikan mekanisme streaming atau chunking saat mengunggah ke backend.
