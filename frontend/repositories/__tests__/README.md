# Pengujian Repositori

Direktori ini berisi unit test untuk kelas-kelas repositori data yang berada di `@/repositories`.

## Tujuan

Tujuan utama dari pengujian ini adalah untuk memastikan bahwa setiap metode repositori berinteraksi dengan benar dengan lapisan abstraksi basis data (`@/lib/db`) dan menangani data seperti yang diharapkan. Pengujian ini memverifikasi logika di dalam kelas repositori, seperti transformasi data, manajemen transaksi, dan *querying* yang benar.

## Mocking (Simulasi)

Aspek penting dari pengujian ini adalah *mocking* modul `@/lib/db`, yang merupakan abstraksi dari `Dexie.js` (IndexedDB). Dengan melakukan *mocking* pada basis data, kita dapat:

-   Mengisolasi logika repositori dari implementasi basis data yang sebenarnya.
-   Menjalankan pengujian dengan cepat dan andal tanpa *overhead* dari basis data nyata.
-   Mensimulasikan berbagai respons basis data, termasuk skenario keberhasilan dan kegagalan.

Pengujian ini menggunakan `jest.mock('@/lib/db', ...)` untuk menyediakan implementasi basis data yang disimulasikan, memungkinkan kita untuk memata-matai pemanggilan metode, mengontrol nilai kembalian, dan memverifikasi interaksi.

## Rincian Pengujian per File

Berikut adalah rincian dari apa yang diuji dalam setiap file:

### `DataRepository.test.ts`
File ini menguji logika untuk mengelola data utama aplikasi (baris dan sel).
-   **`clearAllData`**: Memastikan semua data baris terhapus.
-   **`getAllRows`**: Menguji pengambilan semua baris data, termasuk pengurutan ID dan pengisian data kosong jika ada celah dalam indeks.
-   **`updateRow`**: Memverifikasi bahwa baris yang ada diperbarui dan baris baru ditambahkan jika belum ada.
-   **`replaceAllData`**: Menguji penggantian seluruh data dengan data baru dalam satu transaksi.
-   **`ensureRowExists`**: Memastikan baris kosong dibuat jika belum ada pada indeks tertentu.
-   **`updateBulkCells`**: Menguji pembaruan dan penghapusan beberapa sel secara massal dalam satu transaksi, termasuk pembuatan baris baru jika diperlukan.
-   **`deleteRow` & `insertRow`**: Memverifikasi logika kompleks untuk menghapus atau menyisipkan baris dan menggeser ID baris berikutnya secara efisien dalam satu transaksi.
-   **`deleteColumn` & `insertColumn`**: Memverifikasi bahwa semua baris diperbarui dengan benar saat kolom dihapus atau ditambahkan.

### `MetaRepository.test.ts`
File ini menguji pengelolaan metadata file, seperti nama, lokasi, dan tanggal pembuatan.
-   **`getMeta`**: Menguji pengambilan metadata aplikasi.
-   **`saveMeta`**: Memverifikasi penyimpanan (pembuatan atau pembaruan) metadata.
-   **`deleteMeta`**: Menguji penghapusan metadata.
-   **`clearMeta`**: Memastikan bahwa metode ini memanggil `deleteMeta` dengan benar.

### `ResultRepository.test.ts`
File ini menguji repositori yang bertanggung jawab atas hasil analisis statistik.
-   **`deleteStatistic`**: Menguji penghapusan satu data statistik.
-   **`deleteAnalytic`**: Memverifikasi bahwa analitik dan semua statistik terkaitnya dihapus.
-   **`deleteLog`**: Memastikan bahwa log, analitik terkait, dan statistik terkait semuanya dihapus dengan urutan yang benar.
-   **`saveLog` & `saveAnalytic`**: Memastikan penyimpanan data log dan analitik, tidak termasuk relasi yang seharusnya tidak disimpan.
-   **`saveStatistic`**: Menguji penyimpanan statistik baru atau memperbarui yang sudah ada.
-   **`clearResults`**: Memverifikasi bahwa semua tabel yang berhubungan dengan hasil (`logs`, `analytics`, `statistics`) dibersihkan dalam satu transaksi.

### `VariableRepository.test.ts`
File ini menguji repositori untuk mengelola metadata variabel (kolom).
-   **Pengujian Variabel**: Mencakup pengujian untuk mendapatkan, menyimpan, dan menghapus variabel. Verifikasi penting termasuk:
    - Penghapusan variabel juga menghapus `ValueLabels` terkait dalam satu transaksi.
    - Pengurutan ulang variabel (`reorderVariable`) memperbarui indeks kolom dari semua variabel yang terpengaruh dengan benar.
-   **Pengujian Label Nilai (`ValueLabel`)**: Mencakup pengujian untuk mendapatkan, menyimpan, dan menghapus `ValueLabels` yang ditautkan ke variabel melalui `variableId`. Verifikasi penting termasuk:
    - Penyimpanan variabel dengan labelnya (`saveVariableWithLabels`) membuat semua data dalam satu transaksi.
    - Penghapusan semua label untuk variabel tertentu.

## Menjalankan Pengujian

Pengujian ini dijalankan sebagai bagian dari rangkaian pengujian Jest standar. Untuk menjalankannya secara spesifik, Anda dapat menggunakan perintah berikut:

```bash
npm test -- frontend/repositories/__tests__/
```
atau jika Anda menggunakan yarn atau pnpm, gunakan perintah yang setara.