# Frequency Library — Dokumentasi Rumus & Perilaku

Library ini membangun tabel frekuensi satu variabel dengan dukungan bobot, missing, percentiles, mode, serta deteksi outlier/ekstrem. Untuk variabel numerik, ringkasan statistik dapat memanfaatkan `DescriptiveCalculator`.

## Dependensi & Sumber Perhitungan
- Utils internal: `checkIsMissing`, `isNumeric`, `isDateString`, `dateStringToSpssSeconds`, `spssSecondsToDateString` (di `../utils/utils.js`).
- Menggunakan `DescriptiveCalculator` (dari `../descriptive/descriptive.js`) untuk statistik ringkas saat measure adalah `scale` atau `ordinal`.
- Perhitungan distribusi, percent, percentiles, mode, extreme values dilakukan di sini (internal).

## Penanganan Tipe Data
- numeric: diproses numerik. String tanggal `dd-mm-yyyy` dikonversi ke SPSS seconds.
- string: diproses sebagai kategori (label teks).
- date: diproses sebagai numerik (SPSS seconds) untuk hitungan; dikembalikan ke `dd-mm-yyyy` untuk tampilan.

## Penentuan Measurement Level Efektif
- `unknown` → dipetakan otomatis (numeric/date → `scale`, string → `nominal`).
- `isNumeric` didefinisikan sebagai `measure in {scale, ordinal}`.

## Distribusi & Kolom Tabel
Dari nilai unik tersortir `y` dan bobotnya `c` dengan kumulatif `cc`:
- `frequency` = `c[i]` (jumlah bobot kasus valid pada nilai ke-i)
- `percent` = `frequency / T * 100` dengan `T` = total bobot semua kasus ber-bobot valid (termasuk yang missing untuk denominator). Fallback ke `W` bila `T` tidak valid.
- `validPercent` = `frequency / W * 100` dengan `W` = total bobot kasus valid.
- `cumulativePercent` = `cc[i] / W * 100`.
- Nilai tanggal ditampilkan sebagai `dd-mm-yyyy` bila `coreType === 'date'`.

## Statistik Ringkas yang Dikembalikan
- Untuk `nominal`: `N = W`, `Missing = T - W`, `Mode`.
- Untuk `ordinal/scale`: menyalin statistik dari `DescriptiveCalculator` (Mean, StdDev, dsb.) ditambah `Mode` dari modul ini.

## Mode
- Mode = semua nilai dengan frekuensi maksimum (bisa lebih dari satu). Dihitung internal dari distribusi.

## Persentil

### Metode "waverage" / SPSS Definition 5 / Excel PERCENTILE.INC
- Target bobot: \( t_p = W \cdot p/100 \)
- Temukan indeks \( k \) minimum sehingga \( \mathrm{cc}[k] \ge t_p \)
- Interpolasi: \( g = (t_p - \mathrm{cc}[k-1]) / c[k] \), lalu \( P_p = (1-g)\,y_{k-1} + g\,y_k \)

### Metode alternatif: "haverage" / SPSS Definition 1 / AFREQUENCIES
- Posisi orde target pada data bereplikasi bobot: \( r = (W + 1) \cdot p/100 \)
- Batasan tepi: jika \( r \le 1 \) kembalikan nilai minimum; jika \( r \ge W \) kembalikan nilai maksimum.
- Tentukan \( \text{lowerPos} = \lfloor r \rfloor \) dan \( \text{upperPos} = \lceil r \rceil \).
- Temukan \( y_{\text{lower}} \) sebagai nilai pada posisi orde `lowerPos` dan \( y_{\text{upper}} \) pada `upperPos` menggunakan kumulatif bobot `cc` tanpa mengekspansi data.
- Fraksi: \( f = r - \lfloor r \rfloor \).
- Interpolasi: \( P_p = (1-f)\,y_{\text{lower}} + f\,y_{\text{upper}} \). Jika kedua posisi memetakan ke nilai yang sama, hasilnya nilai tersebut.

Penggunaan di API: `getPercentile(p, 'waverage')` (default) atau `getPercentile(p, 'haverage')`.

## Extreme Values (Outlier/Ekstrem)
- Hitung IQR = `P75 - P25` (dengan metode persentil di atas).
- Inner fences: `[Q1 - 1.5·IQR, Q3 + 1.5·IQR]`
- Outer fences: `[Q1 - 3·IQR, Q3 + 3·IQR]` (di kode: 2× step di mana `step = 1.5·IQR`).
- Nilai bertanda:
  - `extreme`: di luar outer fences
  - `outlier`: di luar inner namun di dalam outer fences
- Pengambilan `highest`/`lowest` mempertimbangkan bobot dan jumlah maksimum entri diminta.

## Ringkasan Sumber Perhitungan
- Distribusi, percent, mode, percentiles, extreme values: dihitung di file ini (internal).
- Statistik deskriptif (Mean, StdDev, dsb.) untuk `ordinal/scale`: diambil dari `DescriptiveCalculator`.
- Utilitas tanggal/missing/pembulatan: dari `../utils/utils.js`.

## Batasan & Catatan
- Denominator `percent` memakai `T` (total bobot kasus berbobot valid) agar sejajar dengan tabel frekuensi per baris; `validPercent` memakai `W`.
- Tanggal diolah sebagai numerik (SPSS seconds) pada saat perhitungan, lalu dikonversi kembali untuk tampilan.

---

### Perbandingan Rumus & Perilaku dengan Algoritma Referensi

Library ini mengimplementasikan metode statistik yang modern dan umum. Namun, terdapat beberapa perbedaan kunci dalam formula dan perilaku jika dibandingkan dengan algoritma "FREQUENCIES" klasik yang dirujuk dalam dokumen PDF (umumnya dari manual SPSS). Berikut adalah rinciannya untuk transparansi dan tujuan replikasi.

#### 1. Metode Perhitungan Persentil

Ini adalah perbedaan matematis yang paling signifikan. Library ini menggunakan metode interpolasi linier yang umum (`WAVERAGE`), sementara algoritma referensi menggunakan metode yang berbeda (`HAVERAGE`/`AFREQUENCIES`).

| Aspek | Metode Library Ini (`WAVERAGE`) | Metode Algoritma Referensi (`HAVERAGE`) |
| :--- | :--- | :--- |
| **Definisi** | Umumnya dikenal sebagai Definisi 5 SPSS atau `PERCENTILE.INC` di Excel. | Umumnya dikenal sebagai Definisi 1 SPSS atau `AFREQUENCIES`. |
| **Target Bobot** | \( t_p = W \cdot \frac{p}{100} \) | \( tp = (W+1) \cdot \frac{p}{100} \) |
| **Rumus Interpolasi** | \( P_p = (1-g)\,y_{k-1} + g\,y_k \) dengan \( g = \frac{t_p - \mathrm{cc}[k-1]}{c[k]} \) | \( P_p = (1-g')\,x_1 + g'\,x_2 \) dengan \( g' = tp - \mathrm{cc}_1 \). (Berdasarkan notasi di PDF yang sedikit lebih kompleks). |
| **Catatan** | Metode ini sangat umum dan intuitif untuk data diskrit maupun kontinu. | Faktor `(W+1)` membuat metode ini memberikan hasil yang sedikit berbeda, terutama pada dataset kecil, dan dirancang untuk memperkirakan persentil dari populasi yang lebih besar. |

#### 2. Penanganan Mode (Nilai dengan Frekuensi Tertinggi)

Terdapat perbedaan perilaku ketika ada lebih dari satu nilai yang memiliki frekuensi tertinggi yang sama.

- **Perilaku Library Ini (Multimodal)**: Mengembalikan semua nilai yang memiliki frekuensi tertinggi. Jika 'Merah', 'Biru', dan 'Hijau' semuanya muncul 10 kali (dan 10 adalah frekuensi maksimum), ketiganya akan dikembalikan sebagai mode.

- **Perilaku Algoritma Referensi (Unimodal Paksa)**: Mengembalikan nilai terkecil di antara nilai-nilai yang memiliki frekuensi tertinggi. Dalam contoh di atas, jika urutannya adalah 'Biru', 'Hijau', 'Merah', maka hanya 'Biru' yang akan dilaporkan sebagai mode.

#### 3. Rumus Statistik Ringkas (Mean, Variance, dll.)

Meskipun hasil akhirnya identik, formula yang digunakan untuk perhitungan berbeda karena pendekatan arsitektur.

- **Pendekatan Library Ini (via `DescriptiveCalculator`)**: Rumus dihitung dari data individual `(x_i, w_i)`. Contoh Mean: \( \bar{X} = \frac{\sum_{i=1}^{N} w_i x_i}{\sum_{i=1}^{N} w_i} \)

- **Pendekatan Algoritma Referensi**: Rumus dihitung dari data yang sudah dikelompokkan dalam tabel frekuensi `(X_j, f_j)`. Contoh Mean: \( \bar{X} = \frac{\sum_{j=1}^{NV} f_j X_j}{W} \)

**Penting:** Walaupun notasi formula berbeda (satu berbasis data mentah, satu berbasis tabel frekuensi), hasil numerik yang dihasilkan untuk Mean, Variance, Skewness, dan Kurtosis adalah identik secara matematis.
