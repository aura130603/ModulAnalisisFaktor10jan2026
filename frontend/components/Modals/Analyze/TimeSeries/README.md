# Statify

Aplikasi Analisis Statistik Open Source dengan frontend Next.js dan backend Express.

## Statify Modul Analisis Time Series
...existing code...

## 1. Ringkasan Modul TimeSeries

Folder: `frontend/components/Modals/Analyze/TimeSeries`

Modul ini menyediakan antarmuka analisis deret waktu (time series) meliputi:
- Autocorrelation (ACF/PACF)
- Decomposition (Additive/Multiplicative)
- Smoothing (MA, Exponential, dsb.)
- Unit Root Test (ADF, dll.)
- Box Jenkins Model (ARIMA)
- (WASM) Perhitungan numerik & statistik intensif (Rust → WebAssembly)

Struktur umum submodul konsisten sehingga mudah menambah analisis baru.

## 2. Struktur Direktori Inti

```
TimeSeries/
  index.ts                // Re-exports / util integrasi
  TimeSeriesModal.tsx     // Modal utama
  TimeSeriesMenu.tsx      // Navigasi antar analisis
  TimeSeriesInput.tsx     // Input dataset / parameter umum
  TimeSeriesGenerateDate.ts // Generator rentang tanggal
  TimeSeriesTimeHook.tsx  // Hook manajemen state waktu
  TimeSeriesTimeTab.tsx   // Tab kontrol waktu

  Autocorrelation/
  BoxJenkinsModel/
  Decomposition/
  Smoothing/
  UnitRootTest/
    index.tsx
    OptionTab.tsx
    VariablesTab.tsx
    analyze/analyze.ts
    hooks/
      analyzeHook.tsx
      optionHook.tsx
    test/*.test.ts

  wasm/                   // Rust + WebAssembly sumber perhitungan
```

## 3. Pola Submodul Analisis

Setiap submodul (contoh: `Autocorrelation/`):

| File | Fungsi |
|------|--------|
| `index.tsx` | Komponen wrapper utama analisis (komposisi tab + eksekusi) |
| `VariablesTab.tsx` | Pilih variabel target, opsi frekuensi, transformasi pra-analisis |
| `OptionTab.tsx` | Parameter metode (lag max, model order, smoothing factor, dll.) |
| `hooks/optionHook.tsx` | State & validasi parameter (schema / default) |
| `hooks/analyzeHook.tsx` | Orkestrasi eksekusi: kumpulkan variabel + opsi → panggil `analyze.ts` |
| `analyze/analyze.ts` | Fungsi pemanggil backend / wasm; normalisasi input & mapping output |
| `test/*.test.ts` | Unit test perilaku hook/analyze (mock data) |

Keuntungan: Memisahkan concerns (UI vs logika vs eksekusi).

## 4. Alur Data & Eksekusi

1. User memilih tab analisis di `TimeSeriesMenu`.
2. `VariablesTab` & `OptionTab` mengisi state melalui hook.
3. `analyzeHook`:
   - Validasi (sinkron / asynchronous).
   - Serialisasi input: `{ series, frequency, params }`.
   - Panggil `analyze.ts`.
4. `analyze.ts`:
   - Tentukan jalur eksekusi:
     - WebAssembly (import dari `wasm/pkg/wasm.js`) untuk komputasi berat.
     - Atau REST API (jika ada backend).
   - Tangani error → bentuk objek hasil standar: `{ status, meta, result, diagnostics }`.
5. Hasil diproyeksikan ke komponen visual (grafik / tabel).

## 5. Integrasi WebAssembly (Rust)

Lokasi: `TimeSeries/wasm/`

Struktur ringkas Rust:
```
src/
  lib.rs                  // Entry poin
  regression/...          // (Regresi pendukung)
  time_series/
    mod.rs
    arima/
    autocorrelation/
    decomposition/
    difference/
    evaluation/
    smoothing/
    unit_root_test/
```

### 5.1 Prasyarat
- Rust toolchain stabil
- Target wasm:
  `rustup target add wasm32-unknown-unknown`
- (Opsional) wasm-bindgen / wasm-pack (bila ingin re-build paket npm)

### 5.2 Build Manual
Contoh:
```
cd frontend/components/Modals/Analyze/TimeSeries/wasm
cargo build --release --target wasm32-unknown-unknown
```
Gunakan `wasm-pack` (jika digunakan):
```
wasm-pack build --target web
```

Output tersedia di `wasm/pkg/` yang diimport oleh kode TypeScript:
```
import init, { some_fn } from './wasm/pkg/wasm.js';
await init();
```

### 5.3 Pedoman Ekspor Rust
- Gunakan `#[wasm_bindgen]` untuk fungsi publik.
- Jaga struktur output sederhana (primitive + Vec<f64>) → mapping ke JS object.
- Lakukan perhitungan numerik intensif di Rust (misal ARIMA estimation).

## 6. Penambahan Analisis Baru

Langkah:
1. Duplikasi folder salah satu submodul (misal `Autocorrelation` → `SeasonalDecomposition`).
2. Ganti nama internal (komponen, hook, test).
3. Tambahkan route/menu di `TimeSeriesMenu.tsx`.
4. Implementasi logika:
   - Definisikan parameter di `optionHook.tsx`.
   - Definisikan mapping input → Rust/REST di `analyze.ts`.
5. Tambah unit test minimal:
   - Validasi parameter default.
   - Mock hasil analyze.
6. (Opsional) Tambahkan fungsi Rust di `wasm/src/time_series/...` + ekspor.

Checklist Validasi:
- [ ] Nama tab muncul
- [ ] Tombol Run disabled saat parameter tidak valid
- [ ] Error ditampilkan ramah pengguna
- [ ] Hasil memiliki meta (timestamp, durasi, versi)

## 7. Testing

Lokasi test: `*/test/*.test.ts`.

Konvensi:
- Suffix `.test.ts`.
- Gunakan mocking untuk modul wasm (hindari overhead runtime):
  ```
  jest.mock('../analyze/analyze', () => ({
    analyze: jest.fn().mockResolvedValue(mockResult)
  }));
  ```

Jalankan:
```
npm test
```
Atau filter:
```
npx jest autocorrelation
```

## 8. Pedoman Kode

Frontend (TypeScript / React):
- Gunakan tipe eksplisit untuk hasil analisis: buat interface `TimeSeriesResult`.
- Hindari logika berat di komponen; gunakan hook.
- Pisahkan formatting angka / tanggal (helper util).

Rust:
- Hindari alloc berulang (preallocate Vec).
- Validasi input (panjang seri, nilai NaN).
- Beri test Rust (opsional) sebelum kompilasi ke wasm.

## 9. Penanganan Error

Kategori:
- Validasi input: tampilkan inline di tab opsi.
- Eksekusi wasm: tangkap exception → map ke `{ status: 'error', message }`.
- Timeout (jika di-wrap Promise.race) → sarankan reduksi ukuran data.

## 10. Kinerja

Tips:
- Debounce perubahan parameter sebelum trigger re-run.
- Lazy load wasm: inisialisasi saat modal pertama dibuka.
- Gunakan Web Worker (opsional) jika blocking UI (dapat ditambah nanti).

## 11. Versi & Metadata

Sertakan metadata pada hasil:
```
{
  analysis: 'autocorrelation',
  version: '1.0.0',
  executedAt: ISOString,
  durationMs: number
}
```

## 12. Contoh Pola Pemanggilan (Simplifikasi)

```
const { state, run, loading, result } = useAnalyzeAutocorrelation();

<button disabled={!state.valid || loading} onClick={run}>Run</button>
```

Di `analyzeHook.tsx`:
```
const run = async () => {
  setLoading(true);
  try {
    const r = await analyze(buildPayload(state));
    setResult(r);
  } finally {
    setLoading(false);
  }
};
```

## 13. Troubleshooting

| Masalah | Solusi Singkat |
|---------|----------------|
| WASM tidak load | Pastikan path `wasm/pkg` benar & bundler mendukung `.wasm` |
| Hasil NaN | Periksa data kosong / outlier ekstrem |
| Test gagal import wasm | Mock modul di Jest |
| Performa lambat | Kurangi panjang seri atau offload ke Worker |

## 14. Lisensi

Ikuti lisensi utama repositori (tambahkan detail jika berbeda untuk kode Rust bila diperlukan).

--- 

Ringkas: Modul TimeSeries menggunakan pola konsisten (VariablesTab + OptionTab + hooks + analyze + wasm) guna memudahkan ekspansi dan pemeliharaan.
...existing code...