# Panduan Arsitektur Utama untuk Fitur Modal

Dokumen ini adalah **sumber kebenaran tunggal (`single source of truth`)** untuk merancang, membangun, dan merefaktor semua komponen modal di dalam direktori `/Modals`. Semua pengembang **wajib** membaca dan mengikuti panduan ini.

## Filosofi

Direktori `Modals/` diatur berdasarkan **kategori fungsional** (misalnya, `Analyze`, `File`, `Data`). Setiap subdirektori di dalam kategori tersebut dianggap sebagai "fitur" mandiri yang mengikuti pendekatan *feature-sliced design*. Tujuannya adalah untuk menjaga semua aset yang relevan untuk sebuah fitur—logika, komponen UI, tipe, utilitas—berada di satu lokasi (`co-location`).

## Struktur Direktori Standar

Semua fitur modal, terlepas dari kategorinya, **harus** mengikuti struktur direktori ini.

```
/Modals/[NamaKategori]/
└──📂 [NamaFitur]/
    ├── 📂 __tests__/               // (Sangat Direkomendasikan) Unit tests untuk hook, service, dan utilitas.
    │   ├── use[NamaFitur]Logic.test.ts
    │   └── [namaFitur]Service.test.ts
    ├── 📂 components/              // (Wajib jika UI kompleks) Komponen UI, dipecah per-tab atau per-bagian.
    │   ├── SpecificTab.tsx
    │   └── AnotherSection.tsx
    ├── 📂 hooks/                   // (Wajib) Semua logika & state management.
    │   └── use[NamaFitur]Logic.ts  // Hook utama (orkestrator).
    │   └── use[OpsiSpesifik].ts    // Hook untuk mengelola bagian state tertentu.
    ├── 📂 services/                // (Sangat Direkomendasikan) Abstraksi untuk interaksi eksternal (Worker, API).
    │   └── [namaFitur]Service.ts
    ├── 📂 utils/                   // (Opsional) Fungsi murni (pure functions) untuk formatting, kalkulasi, dll.
    │   └── formatters.ts
    ├── 📂 types/                   // (Opsional, jika `types.ts` tidak cukup) Definisi tipe yang kompleks.
    ├── 📄 index.tsx                // (Wajib) Titik masuk (entry point) modal. Bertindak sebagai perakit.
    ├── 📄 README.md                // (Wajib) Dokumentasi spesifik fitur (ringkas, lihat templat di bawah).
    └── 📄 types.ts                 // (Wajib) Semua definisi tipe & interface untuk fitur ini.
```

### Tanggung Jawab File & Folder

-   **`index.tsx` (Orchestrator)**: Tidak berisi logika bisnis. Tugasnya hanya merakit UI dari `components/` dan menyambungkannya dengan logika dari `hooks/`.
-   **`__tests__/`**: Berisi semua file *unit test* (menggunakan Jest) untuk fitur tersebut. Sangat penting untuk menguji logika di `hooks/` dan `services/`.
-   **`components/`**: Berisi "dumb components" yang menerima *props* dan menampilkan UI.
-   **`hooks/`**: Jantung dari fitur. Mengelola state, alur kerja, dan interaksi dengan store.
-   **`services/`**: Bertindak sebagai perantara antara *hook* dan dunia luar (Web Worker, API). Fungsi di sini biasanya mengembalikan `Promise`.
-   **`utils/`**: Fungsi pembantu yang murni dan dapat diuji secara terpisah.
-   **`types.ts`**: Mendefinisikan semua "bentuk" data untuk fitur tersebut.

### Aturan Folder: Konsistensi vs. Pragmatisme

**Secara umum, sangat disarankan untuk selalu membuat folder (`hooks/`, `services/`, dll.) meskipun pada awalnya hanya berisi satu file.** Ini memastikan konsistensi dan skalabilitas di masa depan.

Namun, ada beberapa pengecualian yang diizinkan:

-   **`utils/`**: Jika sebuah fitur hanya membutuhkan satu file utilitas yang sangat sederhana, Anda *diperbolehkan* untuk tidak membuat folder dan menempatkannya di root fitur sebagai `[namaFitur]Utils.ts`.
-   **`types/`**: Selalu mulai dengan satu file `types.ts` di root fitur. Anda **hanya** perlu membuat folder `types/` jika file definisi tipe menjadi sangat besar dan perlu dipecah menjadi beberapa file.

Untuk **`hooks/`** dan **`services/`**, aturan untuk **selalu menggunakan folder** harus diikuti dengan ketat karena sifatnya yang sentral dan kemungkinan besar akan berkembang.

---

## Pola Umum & Praktik Terbaik

Pola-pola ini berlaku secara universal di semua kategori modal.

### 1. Bekerja dengan Web Workers (Pola Umum)

Perhitungan berat (parsing file, kalkulasi statistik) yang dapat memblokir UI harus dipindahkan ke Web Worker.

-   **Lokasi Worker**: Skrip worker berada di `public/workers/`.
-   **Interaksi**: Logika untuk berkomunikasi dengan worker (membuat instance, `postMessage`, `onmessage`) harus **dibungkus dalam sebuah fungsi di dalam direktori `services/`**. Hook analisis kemudian hanya perlu memanggil fungsi layanan ini secara asinkron.
-   **Contoh**:
    -   `services/csvParsingService.ts` mengekspor fungsi `parseCsv(file)` yang mengembalikan `Promise`.
    -   `hooks/useImportCsvLogic.ts` memanggil `await csvParsingService.parseCsv(file)` dan menangani *state* `isLoading` dan `error`.

### 2. Menggunakan Store Global (Zustand)

-   **Interaksi**: Panggilan ke *store* (`useResultStore`, `useDataStore`) harus dilakukan dari dalam **direktori `hooks/`**, biasanya setelah mendapatkan hasil dari *service*.
-   **Efek Samping Kritis**: Jika sebuah fitur memodifikasi data pengguna secara permanen (misalnya, menyimpan variabel baru), ini **harus** didokumentasikan dengan jelas di `README.md` spesifik fitur tersebut.

### 3. Pengujian Fitur

Pengujian adalah bagian fundamental dari pengembangan fitur yang solid. Strategi dan contoh kode untuk melakukan *unit testing* pada `hooks` dan `services` dapat ditemukan dalam dokumen terpisah.

-   **➡️ [Lihat Panduan Pengujian Modal](./TESTING.md)**

---

## Panduan untuk `README.md`