# Statify Backend (Express)

Backend Express untuk membaca file SPSS `.sav` dan membuat `.sav` dari JSON.

- Endpoint berada di router `/api/sav`
- Validasi payload menggunakan Zod
- Upload multipart menggunakan Formidable
- Rate limiting global pada prefix `/api`; CORS dibatasi

Dokumentasi API lengkap: lihat `docs/API.md`.

## Prasyarat
- Node.js 18+
- npm 9+

## Instalasi
```bash
npm install
```

## Skrip
- Dev: `npm run dev` (hot-reload TS via tsx)
- Build: `npm run build` (TypeScript -> dist)
- Start: `npm start` (jalan dari dist)
- Test: `npm test` (Jest)
- Lint: `npm run lint`
- Lint fix: `npm run lint:fix`

## ENV
- `PORT`: default 5000
- `MAX_UPLOAD_SIZE_MB`: default 10
- `TEMP_DIR`:
  - Dev (tsx): `server/temp`
  - Prod/Docker: `dist/temp`
- `DEBUG_SAV` (opsional): aktifkan log debug saat proses `/api/sav/create` di `server/controllers/savController.ts`. Nilai truthy yang diterima: `1`, `true`, `yes`, `on` (tidak peka huruf besar/kecil). Default non-aktif.
- `RATE_LIMIT_ENABLED` (opsional): toggle rate limiting global pada prefix `/api`.
  - Nilai truthy yang diterima: `1`, `true`, `yes`, `on` (tidak peka huruf besar/kecil)
  - Default: aktif. Untuk mematikan saat load testing, set ke `0` atau `false`.

## Quickstart
- Dev: `npm run dev`
- Health: `curl http://localhost:5000/` ⇒ `Backend is running!`
- Router: `curl http://localhost:5000/api/sav/` ⇒ `OK`

## Docker
- Build:
  ```bash
  docker build -f Dockerfile.backend -t statify-backend:latest \
    --build-arg NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000 .
  ```
- Run:
  ```bash
  docker run -p 5000:5000 \
    -e PORT=5000 -e MAX_UPLOAD_SIZE_MB=10 -e TEMP_DIR=/app/backend/temp \
    --name statify-backend statify-backend:latest
  ```
- Catatan: `NEXT_PUBLIC_FRONTEND_URL` ditulis ke `.env` oleh Dockerfile, tetapi backend saat ini hanya memakai `PORT`, `MAX_UPLOAD_SIZE_MB`, `TEMP_DIR`.

## CORS & Rate Limiting
- Origins di `server/config/constants.ts` (hard-coded)
- Rate limit: 100/15 menit; kunci dari header `X-User-Id` (jika ada) atau IP

## Troubleshooting
- 429 Too Many Requests: gunakan `X-User-Id` yang konsisten; lihat header `RateLimit-*`
- 400 Payload tidak valid: cek `issues` dari Zod pada respons

---

# Legacy: SAV writer library docs

Tentu, berikut adalah dokumentasi lengkap untuk library ini, dengan fokus pada tipe data yang dapat disimpan dan parameter-parameternya, berdasarkan file kode yang Anda berikan.

### **Ringkasan Umum**

Library ini adalah utilitas Node.js yang dirancang untuk menulis file data statistik dalam format SPSS (`.sav`). Library ini memungkinkan Anda untuk mendefinisikan variabel (kolom) dengan tipe data, label, dan format tertentu, lalu menulis data baris-demi-baris atau sekaligus ke dalam file `.sav`.

Ada dua cara utama untuk menggunakan library ini:

1.  `saveToFile()`: Fungsi sederhana untuk menyimpan array data JavaScript langsung ke file `.sav`.
2.  `createStream()`: Pendekatan yang lebih canggih untuk membuat `WriteStream` yang dapat Anda gunakan untuk menulis data dalam potongan-potongan (chunks), ideal untuk dataset yang sangat besar.

-----

### **Konsep Inti**

Penggunaan library ini bergantung pada dua konsep utama:

1.  **Variabel (`SavVariable[]`)**: Ini adalah array objek yang mendefinisikan "skema" atau struktur data Anda. Setiap objek dalam array ini mewakili sebuah kolom di file SPSS Anda, lengkap dengan nama, tipe data, label, lebar, dan atribut lainnya.
2.  **Rekaman (`recs: Array<{ [key: string]: any }>`)**: Ini adalah data Anda, yang direpresentasikan sebagai array objek JavaScript. Setiap objek dalam array adalah sebuah baris (rekaman), di mana *key* adalah nama variabel dan *value* adalah data untuk sel tersebut.

-----

## **Dokumentasi API**

### `saveToFile(path, recs, vars)`

Menyimpan satu set data lengkap ke file `.sav` yang ditentukan.

  * **`path`**: `string` - Path file output tempat file `.sav` akan disimpan.
  * **`recs`**: `Array<object>` - Array yang berisi baris data Anda.
  * **`vars`**: `SavVariable[]` - Array konfigurasi variabel yang mendefinisikan setiap kolom.

**Contoh Penggunaan:**

```javascript
const { saveToFile, VariableType, VariableMeasure } = require('./index'); // Sesuaikan path

const variables = [
  { name: 'ID', label: 'ID Responden', type: VariableType.Numeric, decimal: 0 },
  { name: 'Nama', label: 'Nama Lengkap', type: VariableType.String, width: 50 },
  { name: 'TglLahir', label: 'Tanggal Lahir', type: VariableType.Date },
  { 
    name: 'Gender', 
    label: 'Jenis Kelamin', 
    type: VariableType.Numeric,
    measure: VariableMeasure.Nominal,
    valueLabels: [
      { value: 1, label: 'Laki-laki' },
      { value: 2, label: 'Perempuan' }
    ]
  }
];

const records = [
  { ID: 1, Nama: 'Budi Santoso', TglLahir: '25-08-1990', Gender: 1 },
  { ID: 2, Nama: 'Citra Lestari', TglLahir: '12-05-1992', Gender: 2 },
  { ID: 3, Nama: 'Agus Wijaya', TglLahir: '01-01-2000', Gender: 1 }
];

saveToFile('output_data.sav', records, variables);

console.log('File berhasil disimpan!');
```

\<br/\>

### `createStream(options)`

Membuat stream yang dapat ditulis untuk menangani dataset besar.

  * **`options`**: `WriteStreamOptions` - Objek konfigurasi dengan properti berikut:
      * **`path`**: `string` - Path file output.
      * **`variables`**: `SavVariable[]` - Array konfigurasi variabel.
      * **`length`**: `number` - Jumlah total rekaman/baris yang akan ditulis.

Fungsi ini mengembalikan instance `WriteStream` yang memiliki dua metode utama:

  * **`write(records: any[])`**: Menulis sebagian data ke stream.
  * **`end()`**: Menyelesaikan penulisan dan menutup file.

**Contoh Penggunaan:**

```javascript
const { createStream, VariableType } = require('./index'); // Sesuaikan path

const variables = [
    { name: 'LogData', type: VariableType.String, width: 200 }
];

// Asumsikan kita akan menulis 1000 log
const totalRecords = 1000;
const stream = createStream({ path: 'large_log.sav', variables, length: totalRecords });

for (let i = 0; i < totalRecords; i++) {
    stream.write([{ LogData: `Ini adalah log ke-${i + 1}` }]);
}

stream.end().then(() => {
    console.log('Stream selesai, file berhasil disimpan.');
});
```

-----

## **Tipe Data (`VariableType`) dan Parameternya**

Ini adalah bagian terpenting dari konfigurasi Anda. Tipe data didefinisikan dalam enum `VariableType`.

### **`VariableType.Numeric`**

Tipe data untuk angka, baik integer maupun desimal.

  * **Deskripsi**: Digunakan untuk menyimpan nilai numerik.
  * **Input JavaScript yang Diharapkan**: `number`.
  * **Parameter `SavVariable` yang Relevan**:
      * **`width`**: `number` (opsional, default: 8). Lebar total kolom (termasuk titik desimal dan tanda). Harus lebih besar dari `decimal`.
      * **`decimal`**: `number` (opsional, default: 2). Jumlah digit di belakang koma. Harus antara 0 dan 16.
      * **`valueLabels`**: `Array<{value: number, label: string}>` (opsional). Digunakan untuk memberi label pada nilai numerik tertentu (misalnya, `1` = 'Sangat Setuju').

### **`VariableType.String`**

Tipe data untuk teks.

  * **Deskripsi**: Digunakan untuk menyimpan data teks (string).
  * **Input JavaScript yang Diharapkan**: `string`.
  * **Parameter `SavVariable` yang Relevan**:
      * **`width`**: `number` (opsional, default: 8). Jumlah **byte** maksimum yang dapat disimpan. Teks yang lebih panjang akan dipotong secara otomatis. Lebar maksimum adalah 32767.
      * **`valueLabels`**: `Array<{value: string, label: string}>` (opsional). Digunakan untuk memberi label pada nilai string tertentu.

### **`VariableType.Date`**

Tipe data khusus untuk tanggal.

  * **Deskripsi**: Menyimpan nilai tanggal saja.
  * **Input JavaScript yang Diharapkan**: `string` dengan format **`'DD-MM-YYYY'`**. Contoh: `'25-12-2023'`. Nilai yang tidak valid akan disimpan sebagai nilai kosong (system-missing) di SPSS.
  * **Parameter `SavVariable` yang Relevan**:
      * Parameter `width` dan `decimal` diatur secara otomatis (`width: 10`, `decimal: 0`). Anda tidak perlu menentukannya.

### **`VariableType.DateTime`**

Tipe data khusus untuk tanggal dan waktu.

  * **Deskripsi**: Menyimpan nilai tanggal dan waktu.
  * **Input JavaScript yang Diharapkan**: `string` dengan format **`'DD-MM-YYYY HH:mm:SS'`**. Contoh: `'25-12-2023 14:30:00'`. Nilai yang tidak valid akan disimpan sebagai nilai kosong.
  * **Parameter `SavVariable` yang Relevan**:
      * Parameter `width` dan `decimal` diatur secara otomatis (`width: 19`, `decimal: 0`). Anda tidak perlu menentukannya.

-----

## **Antarmuka `SavVariable` (Parameter Lengkap)**

Berikut adalah daftar lengkap semua properti yang dapat Anda tentukan untuk setiap objek variabel.

| Properti | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :--- | :--- |
| **`name`** | `string` | **Ya** | Nama unik variabel. Maksimal 64 karakter dan harus mengikuti aturan penamaan variabel SPSS. |
| **`label`** | `string` | Opsional | Label deskriptif untuk variabel. Jika tidak disediakan, akan menggunakan nilai dari `name`. |
| **`type`** | `VariableType` | **Ya** | Tipe data variabel. Lihat bagian di atas. |
| **`width`** | `number` | Opsional | Lebar kolom. Perilakunya bergantung pada `type`. Defaultnya diatur berdasarkan tipe jika tidak ditentukan. |
| **`decimal`** | `number` | Opsional | Jumlah angka desimal untuk `VariableType.Numeric`. Defaultnya 2. |
| **`alignment`**| `VariableAlignment`| Opsional | Perataan teks/nilai dalam kolom (`Left`, `Right`, `Centre`). Defaultnya `Right`. |
| **`measure`** | `VariableMeasure`| Opsional | Tingkat pengukuran variabel (`Nominal`, `Ordinal`, `Continuous`). Defaultnya `Continuous`. |
| **`columns`** | `number` | Opsional | Lebar kolom seperti yang ditampilkan di SPSS Data View. Biasanya dihitung otomatis. |
| **`valueLabels`**| `Array` | Opsional | Array objek `{ value, label }` untuk memberikan deskripsi pada nilai tertentu. |

-----

## **Enum Tambahan**

Selain `VariableType`, ada juga enum lain yang dapat Anda impor dan gunakan:

### **`VariableAlignment`**

Untuk mengatur perataan kolom.

  * `Left` (0)
  * `Right` (1)
  * `Centre` (2)

### **`VariableMeasure`**

Untuk mengatur skala pengukuran data.

  * `Nominal` (1): Kategori tanpa urutan (contoh: Jenis Kelamin, Agama).
  * `Ordinal` (2): Kategori dengan urutan (contoh: Tingkat Pendidikan, Skala Kepuasan).
  * `Continuous` (3): Data numerik berkelanjutan (contoh: Usia, Tinggi Badan).