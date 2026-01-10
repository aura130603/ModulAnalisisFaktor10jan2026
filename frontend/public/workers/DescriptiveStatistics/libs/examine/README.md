# Examine Library — Dokumentasi Rumus & Perilaku

Library ini menyediakan statistik Explore/Examine dengan memadukan ringkasan frekuensi dan deskriptif, serta menambahkan trimmed mean, persentil terpilih, confidence interval mean, dan M-estimators sederhana.

## Dependensi & Sumber Perhitungan
- Utils internal: `../utils/utils.js`.
- Menggunakan `FrequencyCalculator` untuk distribusi, mode, persentil, dan ringkasan berbobot.
- Menggunakan `DescriptiveCalculator` untuk statistik numerik (Mean, StdDev, SEMean, dsb.).
- Tambahan rumus (trimmed mean, CI mean, M-estimators) dihitung di sini (internal).

## Penanganan Tipe Data
- `isNumeric` di sini didefinisikan lebih ketat: `measure in {scale, ordinal}` DAN `coreType !== 'date'` (tanggal dikecualikan dari hitung numerik untuk menghindari tampilan "detik").
- string: diperlakukan kategorikal melalui `FrequencyCalculator`.

## Statistik yang Dikembalikan
- `summary`: dari Frequency (valid, missing, total berbobot, dll.).
- `descriptives`: gabungan statistik dari Frequency/Descriptive untuk data numerik.
- `frequencyTable`: dari Frequency.
- `percentiles`: titik tetap {5, 10, 25, 50, 75, 90, 95}. Default metode: `HAVERAGE` (Definisi 1 SPSS/AFREQUENCIES) dengan target `(W+1)p`. Dapat dikonfigurasi via `options.percentileMethod` menjadi `waverage`.
- `hinges`: Tukey's Hinges (`Q1`, `Q3`, `IQR`) untuk konstruksi boxplot dan IQR.
- `trimmedMean` (default 5%): mean setelah memangkas masing-masing 5% bobot di ekor bawah dan atas.
- `extremeValues`: bila `options.showOutliers` aktif, didelegasikan ke Frequency.
- `confidenceInterval` sekitar mean: \([\bar{x} - t_{\alpha/2,\,df} \cdot \mathrm{SE}_\bar{x},\; \bar{x} + t_{\alpha/2,\,df} \cdot \mathrm{SE}_\bar{x}]\) dengan `df = W - 1` dan `level = options.confidenceInterval || 95`.
- `mEstimators`: mengembalikan nilai yang sama (placeholder) untuk `huber`, `tukey`, `hampel`, `andrews` = trimmed mean 5% bila ada, jika tidak fallback ke mean biasa.

## Rumus Trimmed Mean (berbobot)
1. Susun pasangan `(x_i, w_i)` valid secara naik.
2. Total bobot \( W = \sum w_i \). Tentukan \( W_\text{trim} = (p/100) \cdot W \) untuk setiap sisi (default \(p = 5\)).
3. Pangkas bobot dari ujung bawah lalu atas hingga masing-masing \( W_\text{trim} \) terpenuhi, mengurangi bobot item jika perlu (pemangkasan fraksional bila batas jatuh di tengah bobot suatu nilai).
4. Hitung mean sisa: \( \bar{x}_{\text{trim}} = \frac{\sum w_i' x_i}{\sum w_i'} \).

## Tukey's Hinges (Q1, Q3) dan IQR
- Definisi (pendekatan untuk bobot integer/sederhana):
  1. Hitung kedalaman median: \( \text{depth}_{\text{median}} = \frac{W+1}{2} \).
  2. \( \text{depth}_{\text{hinge}} = \frac{\lfloor \text{depth}_{\text{median}} \rfloor + 1}{2} \).
  3. Q1 = nilai pada urutan ke-\( \text{depth}_{\text{hinge}} \) dari bawah; Q3 = urutan simetris dari atas.
  4. IQR = Q3 - Q1.
- Catatan: Untuk bobot real non-integer, implementasi memakai pembulatan bobot ke bilangan bulat terdekat sebagai pendekatan.

## Tambahan: Definisi Persentil
- Metode `waverage` (Definisi 5/SPSS, Excel PERCENTILE.INC):
  - Target bobot: \( t_p = W \cdot p \)
  - Cari \( k \) sehingga \( \mathrm{cc}[k] \ge t_p \)
  - Interpolasi: \( g = (t_p - \mathrm{cc}[k-1]) / c[k] \), \( P_p = (1-g)\,y_{k-1} + g\,y_k \)

- Metode `haverage` (Definisi 1/SPSS EXAMINE, default):
  - Target bobot: \( tc_2 = (W+1) \cdot p \)
  - Cari \( k_2 \) sehingga \( \mathrm{cc}[k_2-1] < tc_2 \le \mathrm{cc}[k_2] \)
  - Interpolasi: \( g_2 = (tc_2 - \mathrm{cc}[k_2-1]) / c[k_2] \), \( P_p = (1-g_2)\,y_{k_2-1} + g_2\,y_{k_2} \)

## Rumus Confidence Interval Mean
- \( \bar{x} \) dan \( \mathrm{SE}_\bar{x} \) diambil dari `DescriptiveCalculator`.
- \( df = W - 1 \), \( \alpha = (100 - \text{level})/100 \).
- \( t_{\alpha/2, df} \) diperoleh dari tabel pendek + pendekatan asimtotik (mendekati z) serta interpolasi linear bila perlu.

## Ringkasan Sumber Perhitungan
- Distribusi, mode, percentiles: dari `FrequencyCalculator`.
- Mean/StdDev/SEMean, dll.: dari `DescriptiveCalculator` untuk data numerik.
- Trimmed mean, CI mean, M-estimators: dihitung di file ini (internal).

## Batasan & Catatan
- Data bertipe tanggal tidak diperlakukan numerik di sini untuk mencegah misinterpretasi; gunakan modul Descriptive bila perlu.
- `mEstimators` saat ini bukan implementasi estimator robust klasik penuh; nilainya disamakan (placeholder) ke trimmed mean/mean sesuai ketersediaan.
