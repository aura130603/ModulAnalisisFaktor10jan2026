# Fitur: Dataset Contoh

# Example Dataset Modal

Komponen ini menyediakan modal yang memungkinkan pengguna memuat dataset contoh berformat `.sav`. Tujuannya adalah memfasilitasi pengguna baru agar dapat langsung mencoba fitur analisis tanpa perlu menyiapkan file data sendiri.

## Logika & Alur Kerja

Logika utama komponen ini diatur dalam *custom hook* `useExampleDatasetLogic.ts` untuk memisahkan logika bisnis dari antarmuka pengguna (UI) yang didefinisikan di `index.tsx`. Alur kerja dimulai saat pengguna memilih sebuah dataset, yang kemudian memicu serangkaian proses untuk memuat, memproses, dan mengintegrasikan data ke dalam state global aplikasi menggunakan Zustand.

Berikut adalah diagram alur kerja yang menggambarkan proses tersebut:

```mermaid
flowchart TD
    A([Start: User selects dataset]) --> B[Call loadDataset function]
    B --> C[Set isLoading to true]
    C --> D[Reset data in Zustand store]
    D --> E[Call processSavFileFromUrl]
    E --> F{Success?}
    F -- Yes --> G[Process response with processSavApiResponse]
    G --> H[Save variables and data to Zustand store]
    H --> I[Close modal]
    I --> Z([End])

    F -- No --> J[Capture and display error message]
    J --> Z

    classDef ui fill:#cde4ff,stroke:#5a96e6,color:#000
    classDef logic fill:#d5e8d4,stroke:#82b366,color:#000
    classDef data fill:#fff2cc,stroke:#d6b656,color:#000
    classDef end fill:#ffcccc,stroke:#ff6666,color:#000

    A:::ui
    B:::logic
    C:::ui
    D:::data
    E:::logic
    F:::logic
    G:::logic
    H:::data
    I:::ui
    J:::ui
    Z:::end

    subgraph Legend
        direction TB
        subgraph Types
            direction LR
            ui_node([UI/Interaction]):::ui
            logic_node{Logic/Hook}:::logic
            data_node[Data/Store]:::data
        end
    end
```

### Penjelasan Alur

1.  **Inisiasi (UI)**: Pengguna memilih salah satu dataset dari daftar yang ditampilkan oleh komponen `ExampleDatasetModal` (`index.tsx`).
2.  **Panggilan Logika (Hook)**: Aksi ini memanggil fungsi `loadDataset` dari *hook* `useExampleDatasetLogic.ts`.
3.  **Manajemen State (Zustand)**: *Hook* segera mengatur state `isLoading` menjadi `true` dan membersihkan data sebelumnya dari *store* Zustand (`useDataStore`, `useVariableStore`) untuk mencegah inkonsistensi.
4.  **Service Layer**: Fungsi `processSavFileFromUrl` dari `services/services.ts` dipanggil untuk mengambil file `.sav` dari lokasinya di direktori `public` dan memprosesnya.
5.  **Parsing & Integrasi (Zustand)**: Jika berhasil, respons dari *service* akan di-parse oleh `processSavApiResponse` untuk mengekstrak variabel, matriks data, dan metadata. Data yang bersih ini kemudian disimpan ke dalam *store* Zustand.
6.  **Feedback (UI)**: Setelah data berhasil terintegrasi, modal akan ditutup. Jika terjadi kegagalan, pesan *error* akan disimpan dalam *state* dan ditampilkan kepada pengguna.
7.  **Finalisasi**: State `isLoading` diatur kembali ke `false` setelah proses selesai, baik berhasil maupun gagal.

### Komponen Pendukung

-   **`index.tsx`**: Bertanggung jawab untuk me-render UI, termasuk daftar file dan filter tag.
-   **`example-datasets.ts`**: Menyediakan daftar statis dataset contoh, termasuk metadata seperti nama dan tag.
-   **`types.ts`**: Mendefinisikan struktur data untuk memastikan *type safety*.

## 4. Rencana Pengembangan di Masa Depan

-   **Dukungan Tipe File Lain**: Menambahkan dataset contoh dalam format lain seperti `.csv` atau `.xlsx`. Struktur file `example-datasets.ts` sudah siap untuk ini.
-   **Deskripsi Dataset**: Menambahkan deskripsi singkat atau tooltip untuk setiap dataset yang menjelaskan konteks data dan analisis apa yang cocok untuk dilakukan.
-   **Fungsi Pencarian/Filter**: Mengimplementasikan bar pencarian untuk memudahkan pengguna menemukan dataset tertentu, terutama jika daftarnya bertambah banyak.
-   **Pratinjau Data**: Memberikan kemampuan untuk melihat pratinjau beberapa baris dan kolom dari dataset sebelum memutuskan untuk memuatnya secara penuh.

## 5. Strategi Pengujian (Unit Testing)

> Semua pengujian berada di `components/Modals/File/ExampleDataset/__tests__/` dan mengikuti pola umum proyek (React-Testing-Library + Jest).

| Berkas | Fokus |
|--------|-------|
| `ExampleDatasetModal.test.tsx` | Pengujian UI untuk modal: render daftar file, interaksi klik (memanggil `loadDataset`), overlay loading, pesan error, dan tombol Cancel. |
| `useExampleDatasetLogic.test.ts` | Pengujian hook: alur pemuatan dataset (loading state ➜ fetch ➜ overwrite store ➜ close), pemanggilan store (`overwriteAll`, `resetData`, `setMeta`), serta penanganan error. |
| `services.test.ts` *(opsional)* | Pengujian utilitas/service: mock `fetch` dan `uploadSavFile` untuk memastikan alur jaringan berjalan benar. |

### Cara Menambah Pengujian Baru
1. Tambahkan berkas tes di folder `__tests__`.
2. Perbarui tabel di atas **dan** indeks pengujian sentral pada `components/Modals/File/README.md`.

---

_Last updated: <!-- KEEP THIS COMMENT: the CI tool replaces it with commit SHA & date -->_ 