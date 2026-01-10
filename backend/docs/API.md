# Statify Backend API Documentation

Dokumentasi ini menjelaskan seluruh endpoint backend, format request/response, error handling, contoh penggunaan, serta konfigurasi yang relevan.

- Base URL (default): `http://localhost:5000`
- Prefix API: sebagian endpoint berada di bawah `/api`
- File terkait di kode:
  - `server/app.ts` (registrasi middleware & routing)
  - `server/routes/savRoutes.ts` (route SAV)
  - `server/controllers/savController.ts` (handler endpoint SAV)
  - `server/services/savService.ts` (proses baca file .sav)
  - `server/config/constants.ts` (konfigurasi)
  - `server/types/sav.types.ts` (tipe data response & payload)

## Daftar Isi

- Pendahuluan
- Keamanan & Batasan
- Konfigurasi Runtime (ENV)
- Daftar Endpoint
  - Health Check
  - SAV Router Health
  - Upload file .sav dan baca isinya
  - Generate file .sav dari JSON
- Header Penting
- Rate Limiting (Detail)
- Skema Data (Ringkas)
- Error & Contoh Respons
- Contoh Penggunaan
- Troubleshooting
- Testing & Linting
- Deployment (Docker)
- Catatan Kompatibilitas

## Keamanan & Batasan

- CORS diizinkan untuk origin berikut (`server/config/constants.ts`):
  - `https://statify-dev.student.stis.ac.id`
  - `http://statify-dev.student.stis.ac.id`
  - `http://localhost:3001`
  - `http://localhost:3000`
- Rate limiting (global untuk prefix `/api`):
  - Maksimal 100 request per 15 menit per user/IP
  - Kunci pembeda: header `X-User-Id` (jika ada), jika tidak ada maka IP request
  - Header standar yang dikirim (dari `express-rate-limit`): `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Helmet diaktifkan untuk header keamanan dasar.

## Konfigurasi Runtime (ENV)

- `PORT` (number): default `5000`
- `MAX_UPLOAD_SIZE_MB` (number): batas ukuran upload `.sav`, default `10`
- `TEMP_DIR` (string): direktori sementara untuk file `.sav` hasil generate/download; jika tidak di-set, default:
  - Dev (npm run dev/tsx): `server/temp`
  - Production build (npm run build/start atau Docker): `dist/temp`
 - `DEBUG_SAV` (opsional): jika diset ke nilai truthy (`1`, `true`, `yes`, `on`, tidak peka huruf besar/kecil), backend akan menampilkan log debug selama proses `/api/sav/create` (lihat `server/controllers/savController.ts`). Default non-aktif.
 - `RATE_LIMIT_ENABLED` (opsional): toggle rate limiting global pada prefix `/api`. Truthy: `1`, `true`, `yes`, `on` (case-insensitive). Default aktif. Untuk menonaktifkan saat load testing, set ke `0` atau `false`.

## Daftar Endpoint

### 1) Health Check

- Method: GET
- Path: `/`
- Response: `200` teks biasa: `"Backend is running!"`

Contoh:
```bash
curl -i http://localhost:5000/
```

### 2) SAV Router Health

- Method: GET
- Path: `/api/sav/`
- Response: `200` teks biasa: `"OK"`

Contoh:
```bash
curl -i http://localhost:5000/api/sav/
```

### 3) Upload file .sav dan baca isinya

- Method: POST
- Path: `/api/sav/upload`
- Konsumsi: `multipart/form-data`
- Field form:
  - `file`: file `.sav` (wajib)
- Validasi dasar file:
  - Ekstensi harus `.sav`
  - MIME diizinkan: `application/octet-stream`, `application/x-spss-sav`
  - Ukuran maksimum: `MAX_UPLOAD_SIZE_MB` (default 10 MB)
- Response sukses: JSON `{ meta, rows }`
  - `meta`: metadata dari `sav-reader` (lihat tipe `SavMeta`)
  - `rows`: array baris data, `Record<string, unknown>[]`
- Error:
  - `400` jika `file` absen/invalid
  - `500` jika gagal parsing form atau gagal memproses file

Contoh cURL:
```bash
curl -X POST \
  'http://localhost:5000/api/sav/upload' \
  -H 'X-User-Id: demo-user' \
  -F 'file=@/path/to/data.sav;type=application/octet-stream'
```

Contoh respons (dipersingkat):
```json
{
  "meta": {
    "header": { "n_cases": 123, "n_vars": 5 },
    "sysvars": [
      { "name": "AGE", "type": 0, "label": "Usia", "measurementLevel": "scale" }
    ],
    "valueLabels": [
      { "appliesToNames": ["GENDER"], "entries": [{ "val": 1, "label": "Laki-laki" }] }
    ]
  },
  "rows": [
    { "AGE": 25, "GENDER": 1 },
    { "AGE": 31, "GENDER": 2 }
  ]
}
```

Referensi tipe (lihat `server/types/sav.types.ts`):
- `SavMeta` berisi `header`, `sysvars`, `valueLabels`.
- `SavResponse` adalah `{ meta: SavMeta; rows: Record<string, unknown>[] }`.

### 4) Generate file .sav dari JSON

- Method: POST
- Path: `/api/sav/create`
- Konsumsi: `application/json`
- Body (divalidasi Zod):
  - `variables`: `VariableInput[]` (wajib, minimal 1)
  - `data`: `Array<Record<string, unknown>>` (opsional, default `[]`)

Skema `VariableInput` (ringkas, lihat `server/controllers/savController.ts`):
- `name`: `string` (wajib)
- `label`: `string` (opsional, default `""`)
- `type`: salah satu string:
  - `NUMERIC`, `STRING`,
  - `DATE`, `ADATE`, `EDATE`, `SDATE`, `JDATE`, `QYR`, `MOYR`, `WKYR`, `WKDAY`, `MONTH`,
  - `DATETIME`, `TIME`, `DTIME`,
  - `DOLLAR`, `DOT`, `COMMA`, `SCIENTIFIC`, `CUSTOM_CURRENCY`, `CCA`, `CCB`, `CCC`, `CCD`, `CCE`
- `width`: `number` (wajib)
- `decimal`: `number` (opsional, default `0`)
- `alignment`: `"left" | "centre" | "center" | "right"` (opsional)
- `measure`: `"nominal" | "ordinal" | "continuous"` (opsional)
- `columns`: `number` (opsional)
- `valueLabels`: `Array<{ value: string | number | null | undefined; label: string | null | undefined }>` (opsional)

Catatan penting (filter & dukungan format):
- Variabel bertipe tanggal/waktu difilter sebelum diproses:
  - `DATE` hanya diterima bila `width === 10` (format data: `DD-MM-YYYY`)
  - `DATETIME` hanya diterima bila `width === 20`
  - Tipe waktu/tanggal lainnya saat ini dianggap tidak didukung dan akan diabaikan: `ADATE`, `EDATE`, `SDATE`, `JDATE`, `QYR`, `MOYR`, `WKYR`, `WKDAY`, `MONTH`, `TIME`, `DTIME`
- Jika seluruh variabel terfilter (tidak ada yang valid), respons `400` dengan pesan: "Tidak ada variabel yang valid untuk diproses setelah filtering."

Transformasi nilai data (`transformRecord()`):
- Untuk variabel `STRING`: string kosong menjadi `null`, selain itu disimpan apa adanya (string)
- Untuk variabel `DATE`: ekspektasi string `DD-MM-YYYY`; akan diubah menjadi `Date` (UTC) bila valid, selain itu `null`
- Untuk tipe selain itu (termasuk `NUMERIC` dan `DATETIME`): akan dicoba `Number(value)`; `NaN` menjadi `null`
  - Implikasi: saat ini untuk `DATETIME` nilai data sebaiknya berupa angka (detik SPSS). Parsing string `"DD-MM-YYYY HH:mm:ss"` belum didukung.

Response sukses:
- Mengirim file unduhan `.sav` dengan header `Content-Disposition: attachment; filename="data.sav"`
- File sementara akan dihapus otomatis setelah diunduh

Error:
- `400` jika payload tidak valid (Zod) → body `{ error: string, issues: ZodIssue[] }`
- `400` jika nama variabel SPSS tidak valid (mengandung error `invalid variable name`)
- `500` untuk kesalahan lain → body `{ error: string, details?: string, message?: string }`

Contoh payload minimal:
```json
{
  "variables": [
    { "name": "num", "type": "NUMERIC", "width": 8, "decimal": 0 }
  ],
  "data": [
    { "num": "1" },
    { "num": 2 }
  ]
}
```

Contoh payload dengan label nilai & tanggal:
```json
{
  "variables": [
    { "name": "val", "label": "Kategori", "type": "NUMERIC", "width": 8, "measure": "nominal", "valueLabels": [ { "value": 1, "label": "A" }, { "value": 2, "label": "B" } ] },
    { "name": "name", "type": "STRING", "width": 50 },
    { "name": "birth", "type": "DATE", "width": 10 }
  ],
  "data": [
    { "val": 1, "name": "Budi", "birth": "25-12-1990" },
    { "val": 2, "name": "Citra", "birth": "01-01-2000" }
  ]
}
```

Contoh cURL:
```bash
curl -X POST \
  'http://localhost:5000/api/sav/create' \
  -H 'Content-Type: application/json' \
  -H 'X-User-Id: demo-user' \
  -d '{
        "variables": [
          { "name": "num", "type": "NUMERIC", "width": 8, "decimal": 0 }
        ],
        "data": [ { "num": "1" }, { "num": 2 } ]
      }' \
  -o data.sav
```

Contoh fetch (Node/Browser):
```js
// Upload .sav untuk dibaca
const form = new FormData();
form.append('file', new File([blobSav], 'input.sav', { type: 'application/octet-stream' }));
const readRes = await fetch('http://localhost:5000/api/sav/upload', {
  method: 'POST',
  headers: { 'X-User-Id': 'demo-user' },
  body: form
});
const { meta, rows } = await readRes.json();

// Generate .sav dari JSON
const createRes = await fetch('http://localhost:5000/api/sav/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-User-Id': 'demo-user' },
  body: JSON.stringify({
    variables: [ { name: 'num', type: 'NUMERIC', width: 8, decimal: 0 } ],
    data: [ { num: '1' }, { num: 2 } ]
  })
});
if (!createRes.ok) throw new Error('create failed');
const blob = await createRes.blob();
// Simpan blob sebagai data.sav di browser atau tulis ke file di Node
```

## Header Penting

 - **X-User-Id**: opsional. Jika dikirim, rate limiting akan mengelompokkan per user ID ini. Gunakan nilai yang stabil per pengguna.
 - **Content-Type**:
   - `/api/sav/upload`: `multipart/form-data`
   - `/api/sav/create`: `application/json`
 - **Accept**: default `application/json` untuk respons JSON; unduhan file `.sav` menggunakan `application/octet-stream`.
 - **Content-Disposition**: respons dari `/api/sav/create` berisi `attachment; filename="data.sav"`.
 - **CORS**: metode diizinkan `GET, POST`; origin dibatasi sesuai daftar konfigurasi.

 ## Rate Limiting (Detail)
 
  - **Cakupan**: semua endpoint di bawah prefix `/api` (mis. `/api/sav/*`). Endpoint root `/` tidak dibatasi.
  - **Window**: 15 menit (`RATE_LIMIT_WINDOW_MS`).
  - **Maksimum**: 100 request per window (`RATE_LIMIT_MAX`).
  - **Kunci**: header `X-User-Id` (jika ada), jika tidak IP request (lihat `keyGenerator` di `server/app.ts`).
  - **Header respons**: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
  - **Saat terlampaui**: status `429 Too Many Requests` dengan header di atas.
  - **Nonaktifkan sementara (load testing)**: set env `RATE_LIMIT_ENABLED=0` atau `false` sebelum menjalankan server.

 ## Skema Data (Ringkas)

 Tipe-tipe ringkas sesuai `server/types/sav.types.ts`:

 ```ts
 // Respons baca SAV
 type SavResponse = { meta: SavMeta; rows: Record<string, unknown>[] };

 interface SavMeta {
   header?: { n_cases?: number; n_vars?: number; [k: string]: unknown };
   sysvars?: Array<{
     name: string;
     type?: 0 | 1;
     label?: string;
     printFormat?: Record<string, unknown>;
     writeFormat?: Record<string, unknown>;
     measurementLevel?: string;
     missing?: unknown;
     [k: string]: unknown;
   }>;
   valueLabels?: Array<{
     appliesToNames?: string[];
     entries: Array<{ val: string | number; label: string }>;
   }>;
   [k: string]: unknown;
 }

 // Payload pembuatan SAV
 type VariableInput = {
   name: string;
   label?: string;
   type:
     | 'NUMERIC' | 'STRING'
     | 'DATE' | 'ADATE' | 'EDATE' | 'SDATE' | 'JDATE'
     | 'QYR' | 'MOYR' | 'WKYR' | 'WKDAY' | 'MONTH'
     | 'DATETIME' | 'TIME' | 'DTIME'
     | 'DOLLAR' | 'DOT' | 'COMMA' | 'SCIENTIFIC'
     | 'CUSTOM_CURRENCY' | 'CCA' | 'CCB' | 'CCC' | 'CCD' | 'CCE';
   width: number;
   decimal?: number;
   alignment?: 'left' | 'centre' | 'center' | 'right';
   measure?: 'nominal' | 'ordinal' | 'continuous';
   columns?: number;
   valueLabels?: Array<{ value: string | number | null | undefined; label: string | null | undefined }>;
 };

 // Bentuk variabel setelah transform, disesuaikan dengan sav-writer
 interface TransformedVariable {
   name: string;
   short?: string;
   label: string;
   type: number; // Numeric enums dari sav-writer (Numeric/String/Date/DateTime)
   width: number;
   decimal: number;
   alignment?: number;
   measure?: number;
   columns: number;
   valueLabels?: Array<{ label: string; value: string | number }>;
 }
 ```

 Catatan penting skema:
 - `DATE` diterima hanya bila `width === 10` (format data `DD-MM-YYYY`).
 - `DATETIME` diterima hanya bila `width === 20`; nilai data saat ini harus numerik (detik/angka sesuai konvensi SPSS).
 - Format tanggal/waktu lain (`ADATE`, `EDATE`, `SDATE`, `JDATE`, `QYR`, `MOYR`, `WKYR`, `WKDAY`, `MONTH`, `TIME`, `DTIME`) saat ini diabaikan (difilter).
 - `alignment` string dipetakan ke enum sav-writer: `left` → Left, `centre/center` → Centre, selain itu → Right.
 - `measure` string dipetakan ke enum sav-writer: `nominal`, `ordinal`, default `continuous`.

 ## Error & Contoh Respons

 - **/api/sav/upload**
   - 400 (tanpa file):
     ```
     No file uploaded
     ```
   - 400 (path invalid):
     ```
     Invalid file path
     ```
   - 500 (gagal parsing form / proses file):
     ```
     Error parsing form
     ```
     atau
     ```
     Error processing SAV file
     ```

 - **/api/sav/create**
   - 400 (payload tidak valid):
     ```json
     { "error": "Payload tidak valid", "issues": [/* ZodIssue[] */] }
     ```
   - 400 (nama variabel tidak valid):
     ```json
     { "error": "Nama variabel tidak valid. Nama variabel harus dimulai dengan huruf dan hanya berisi huruf, angka, atau garis bawah." }
     ```
   - 500 (gagal membuat SAV):
     ```json
     { "error": "Gagal membuat file .sav", "details": "...", "message": "..." }
     ```

 - **Rate limit** (prefix /api): `429 Too Many Requests` dengan header `RateLimit-*`.

 ## Contoh Penggunaan (Axios)

 ```js
 import axios from 'axios';

 // Upload .sav untuk dibaca
 const form = new FormData();
 form.append('file', new Blob([savBuffer]), 'input.sav');
 const readRes = await axios.post('http://localhost:5000/api/sav/upload', form, {
   headers: { 'X-User-Id': 'demo-user' }
 });
 const { meta, rows } = readRes.data;

 // Generate .sav dari JSON
 const payload = {
   variables: [ { name: 'num', type: 'NUMERIC', width: 8, decimal: 0 } ],
   data: [ { num: '1' }, { num: 2 } ]
 };
 const createRes = await axios.post('http://localhost:5000/api/sav/create', payload, {
   headers: { 'Content-Type': 'application/json', 'X-User-Id': 'demo-user' },
   responseType: 'blob'
 });
 // createRes.data adalah Blob (file .sav)
 ```

 ## Catatan Implementasi
  
  - Nama variabel harus valid menurut aturan SPSS; pelanggaran akan menghasilkan `400` dengan pesan terarah.
  - Value labels di-normalisasi saat transformasi:
  - Untuk variabel `STRING`, nilai `value` dipaksa menjadi string (null/undefined → "")
  - Untuk variabel numerik, nilai `value` dipaksa menjadi number (`NaN` → `0`)
- Kolom `columns` bila tidak diberikan akan diturunkan dari lebar (heuristik di controller) sehingga minimal `1`.

## Troubleshooting
 - `429 Too Many Requests` → Anda melewati kuota rate-limit. Sertakan header `X-User-Id` yang konsisten per pengguna untuk pembeda; coba lagi setelah `RateLimit-Reset`.
- `400 Payload tidak valid` → Periksa array `issues` dari Zod untuk field mana yang gagal.
- `400 Tidak ada variabel yang valid` → Periksa filter dukungan tipe tanggal/waktu. Pastikan `DATE.width === 10` atau `DATETIME.width === 20`.
- `500 Gagal memproses SAV` → Cek log server. Pastikan file `.sav` valid saat upload, atau payload `create` sesuai aturan di atas.

## Testing & Linting
 
 - Jalankan unit test: `npm test`
 - Coverage (opsional): `npm test -- --coverage` atau `npx jest --coverage`
 - Lint: `npm run lint`
 - Perbaiki otomatis: `npm run lint:fix`
 - Catatan: `TEMP_DIR` dapat diatur saat testing untuk direktori sementara khusus.

## Deployment (Docker)
 
 - Build image (dari direktori `backend/`):
   ```bash
   docker build -f Dockerfile.backend -t statify-backend:latest \
     --build-arg NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000 .
   ```
 - Jalankan container:
   ```bash
   docker run -p 5000:5000 \
     -e PORT=5000 -e MAX_UPLOAD_SIZE_MB=10 -e TEMP_DIR=/app/backend/temp \
     --name statify-backend statify-backend:latest
   ```
 - Healthcheck: `curl http://localhost:5000/` → `Backend is running!`
 - CORS: origin diatur di `server/config/constants.ts` (hard-coded). Untuk kustomisasi, ubah file tersebut dan rebuild image.
 - Catatan: `Dockerfile.backend` menerima `NEXT_PUBLIC_FRONTEND_URL` (ditulis ke `.env`), namun backend saat ini hanya membaca `PORT`, `MAX_UPLOAD_SIZE_MB`, `TEMP_DIR` dari environment.
 
 ---
  
  Dokumentasi ini merefleksikan implementasi per file-controller saat ini. Bila ada perubahan kode, pastikan untuk memperbarui bagian terkait di dokumen ini.
