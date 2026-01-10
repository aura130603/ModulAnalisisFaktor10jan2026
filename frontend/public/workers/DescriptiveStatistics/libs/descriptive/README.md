# Descriptive Library — Dokumentasi Rumus & Perilaku

Library ini menghitung statistik deskriptif untuk satu variabel dengan dukungan bobot kasus, missing values, serta penanganan tipe data numeric/string/date dan 4 level pengukuran: unknown, nominal, ordinal, scale.

## Dependensi & Sumber Perhitungan
- Utils internal: `checkIsMissing`, `isNumeric`, `isDateString`, `dateStringToSpssSeconds`, `spssSecondsToDateString` (di `../utils/utils.js`).
- Semua rumus inti dihitung di sini (internal), tidak memakai library statistik eksternal.

## Penanganan Tipe Data
- numeric: diperlakukan sebagai nilai numerik apa adanya.
- string: diperlakukan sebagai kategori (nominal) — tidak dihitung metrik numerik.
- date: string tanggal berformat `dd-mm-yyyy` akan dikonversi ke “SPSS seconds” agar dapat diperlakukan sebagai numerik saat diperlukan (mis. percentiles). Untuk tampilan, dapat dikonversi kembali ke string tanggal.

## Penentuan Measurement Level Efektif
Jika `measure === 'unknown'` maka dipetakan otomatis:
- numeric/date → `scale`
- string → `nominal`

Perilaku per level:
- nominal: hanya menghitung ukuran berbasis kategori (mode, N/Valid/Missing).
- ordinal: menggunakan urutan nilai untuk median/percentiles/IQR, tanpa mean/variance.
- scale: menghitung seluruh statistik numerik (mean, variance, dsb.).

## Daftar Statistik & Rumus
Notation (berbobot): untuk kasus valid, terdefinisi pasangan `(x_i, w_i)`.
- Total bobot: \( W = \sum_i w_i \)
- Penjumlahan berbobot: \( S = \sum_i w_i x_i \)
- Momen terpusat: \( M_k = \sum_i w_i (x_i - M_1)^k \) untuk \(k = 2,3,4\)

### Nominal (string atau numeric/date yang dipetakan ke nominal)
- N: jumlah baris data.
- Valid: total bobot kasus valid.
- Missing: `N - Valid` (berbasis bobot bila relevant).
- Mode: nilai dengan frekuensi terbesar (bisa multimodal). Dihitung internal dari distribusi.

### Ordinal
- Semua di nominal, plus:
- Median: persentil ke-50 (lihat definisi persentil di bawah).
- 25th/75th Percentile: persentil ke-25/75.
- IQR: `P75 - P25`.
Semua dihitung internal dari distribusi berbobot.

### Scale
- N, Valid, Missing: seperti di atas.
- Mean: \( M_1 = S / W \).
- Sum: \( S = \sum_i w_i x_i \).
- Variance (sampel berbobot, pendekatan menggunakan \(W-1\)): \( \mathrm{Var} = M_2 / (W - 1) \) bila \( W > 1 \).
- StdDev: \( s = \sqrt{\mathrm{Var}} \).
- StdErr of Mean: \( \mathrm{SE}_\bar{x} = s / \sqrt{W} \).
- Minimum/Maximum/Range: dari nilai numerik valid.
- Skewness (ekses miring; memakai \(W\) sebagai "n" efektif):
  \[
  g_1 = \frac{W \cdot M_3}{(W-1)(W-2) s^3}
  \]
- SE of Skewness: \( \sqrt{\tfrac{6 W (W-1)}{(W-2)(W+1)(W+3)}} \).
 - Kurtosis (excess kurtosis) dengan momen berbobot (selaras SPSS):
   \[
   g_2 = \frac{W(W+1) M_4 - 3 M_2^2 (W-1)}{(W-1)(W-2)(W-3) s^4}
   \]
- SE of Kurtosis: \( \sqrt{\tfrac{4 (W^2 - 1) (\mathrm{SE\ of\ Skewness})^2}{(W-3)(W+5)}} \).
- Median, 25th/75th Percentile, IQR: sama seperti ordinal.
- Z-Scores (opsional, jika `options.saveStandardized`): \( z_i = (x_i - \text{Mean})/s \) untuk kasus valid.

### Definisi Persentil yang Dipakai
Library ini memakai dua skema internal, namun untuk Descriptive dipakai skema berikut:
- Target bobot: \( t_p = (W + 1) \cdot p/100 \)
- Temukan indeks \( i \) minimum sehingga kumulatif bobot \( \mathrm{cc}[i] \ge t_p \)
- Interpolasi linier pada \( x_{i-1}, x_i \) dengan bobot \( (t_p - \mathrm{cc}[i-1]) \).

Catatan: Semua perhitungan numerik mengabaikan missing sesuai `checkIsMissing` dan hanya menggunakan bobot positif.

## Ringkasan Sumber Perhitungan
- Mode, distribusi, percentiles, dan semua momen/ukuran skala dihitung di file ini (internal).
- Fungsi utilitas (cek missing, konversi tanggal, pembulatan) diimpor dari `../utils/utils.js`.

## Batasan & Catatan
- Formula-varian berbobot untuk skewness/kurtosis memakai \(W\) sebagai pendekatan ukuran sampel efektif.
- Level `unknown` dipetakan otomatis (numeric/date → `scale`, string → `nominal`).

