# Daftar Rumus Statistik

Dokumen ini merangkum semua rumus statistik yang digunakan dalam worker `DescriptiveStatistics`, disesuaikan dengan notasi dan metodologi SPSS untuk data berbobot.

## 1. Descriptive (`descriptive.js`)

Kalkulator ini menyediakan statistik deskriptif dasar untuk variabel skala. Simbol `W` atau `W_N` merujuk pada jumlah total bobot (sum of weights).

- **Mean (Rata-rata)**: `sum / W`. Secara komputasi, digunakan algoritma rekursif (provisional means) untuk efisiensi.
- **Variance (Varians)**: `M2 / (W - 1)` (di mana M2 adalah momen kedua dari rata-rata)
- **Standard Deviation (Simpangan Baku)**: `sqrt(variance)`
- **Standard Error of Mean (Kesalahan Baku Rata-rata)**: `stdDev / sqrt(W)`
- **Range (Rentang)**: `maximum - minimum`
- **Z-Score (Skor Z)**: `(value - mean) / stdDev`
- **Skewness (Kemiringan)**: $$g_1 = \frac{W \cdot M_3}{(W-1)(W-2)S^3}$$
- **Standard Error of Skewness**: $$se(g_1) = \sqrt{\frac{6W(W-1)}{(W-2)(W+1)(W+3)}}$$
- **Kurtosis**: $$g_2 = \frac{W(W+1)M_4 - 3M_2^2(W-1)}{(W-1)(W-2)(W-3)S^4}$$
- **Standard Error of Kurtosis**: $$se(g_2) = \sqrt{\frac{4(W^2-1)(se(g_1))^2}{(W-3)(W+5)}}$$

## 2. Frequency (`frequency.js`)

Kalkulator ini menghitung frekuensi, persentase, dan statistik terkait.

- **Percent**: `percent = (frequency / T) * 100` dengan `T` = total bobot semua kasus berbobot valid (termasuk missing) sebagai penyebut; fallback ke `W` bila `T` tidak valid.
- **Valid Percent**: `validPercent = (frequency / W) * 100` dengan `W` = total bobot kasus valid.
- **Cumulative Percent**: `cumulativePercent = (cc[i] / W) * 100`.
- **Mode**: multimodal; semua nilai dengan frekuensi maksimum dikembalikan.
- **Interquartile Range (IQR)**: `Q3 - Q1` (secara default memakai persentil dari metode yang dipilih saat pemanggilan fungsi persentil).
- **Outlier Fences (Batas Outlier)**:
  - **Inner Fences**: `Q1 - 1.5 * IQR` dan `Q3 + 1.5 * IQR`
  - **Outer Fences**: `Q1 - 3 * IQR` dan `Q3 + 3 * IQR`
- **Percentiles**: Mendukung dua metode:
  - `waverage` (SPSS Definition 5 / Excel PERCENTILE.INC): target bobot `t_p = W * p` dan interpolasi dalam sel berbobot.
  - `haverage` (SPSS Definition 1 / AFREQUENCIES): target orde `r = (W + 1) * p` dan interpolasi antar posisi orde bawah/atas.
  Default untuk modul Frequency adalah `waverage` kecuali ditentukan lain saat pemanggilan `getPercentile(p, method)`.

## 3. Crosstabs (`crosstabs.js`)

Kalkulator ini digunakan untuk membuat tabel kontingensi dan statistik terkait.

- **Expected Count (Frekuensi Harapan)**: $$E_{ij} = \frac{r_i \cdot c_j}{W}$$
- **Residual**: `observed - expected`
- **Standardized Residual**: `(observed - expected) / sqrt(expected)`
- **Adjusted Residual**: $$ \frac{O_{ij} - E_{ij}}{\sqrt{E_{ij}(1-r_i/W)(1-c_j/W)}} $$
- **Row Percent**: `100 * (cellCount / rowTotal)`
- **Column Percent**: `100 * (cellCount / columnTotal)`
- **Total Percent**: `100 * (cellCount / W)`

## 4. Examine (`examine.js`)

Kalkulator ini menggabungkan fungsionalitas dari kalkulator lain dan menambahkan statistik inferensial.

- **Percentiles**: default `HAVERAGE` (SPSS Definition 1, target `(W+1)p`), dapat dikonfigurasi via `options.percentileMethod` menjadi `waverage`.
- **Tukey's Hinges (Q1, Q3) dan IQR**: digunakan untuk konstruksi boxplot dan (secara default di sini) untuk pelaporan IQR serta deteksi outlier bila `useHingesForOutliers` tidak diset `false`.
- **5% Trimmed Mean**: memangkas masing-masing 5% bobot dari bawah dan atas (mendukung pemangkasan fraksional) lalu menghitung mean pada data tersisa.
- **Confidence Interval for Mean**: $$ \bar{y} \pm t_{\alpha/2, W-1} \cdot SE_{mean} $$ dengan `df = W - 1`.
- **M-Estimators**: opsional; saat aktif dikembalikan sebagai placeholder yang menyamai trimmed mean (atau mean bila tidak tersedia).


