# Chart Utils - Smart Tick Management

Dokumentasi untuk fungsi-fungsi tick management yang cerdas untuk menghindari kepadatan label pada chart.

## Masalah yang Dipecahkan

Ketika chart memiliki banyak kategori (seperti di gambar), label axis X bisa menjadi sangat padat dan sulit dibaca. Fungsi-fungsi ini memberikan solusi yang cerdas untuk mengatasi masalah tersebut.

## Fungsi Utama

### 1. `getSmartTickValues()`

Fungsi dasar untuk mendapatkan tick values yang optimal berdasarkan lebar chart.

```typescript
const tickValues = getSmartTickValues(xScale, width, {
  minLabelWidth: 80, // Minimal lebar label dalam pixel
  maxTicks: 15, // Maksimal jumlah tick
  preserveEnds: true, // Selalu tampilkan elemen pertama dan terakhir
  adaptiveSpacing: true, // Gunakan spacing adaptif
});
```

### 2. `getIntelligentTickValues()`

Fungsi canggih untuk data dengan distribusi tidak merata (seperti di gambar).

```typescript
const tickValues = getIntelligentTickValues(xScale, width, data, {
  minLabelWidth: 80,
  maxTicks: 12,
  preserveOutliers: true, // Pertahankan nilai-nilai outlier
  adaptiveDensity: true, // Sesuaikan dengan density data
});
```

### 3. `getOptimalAxisStyling()`

Fungsi untuk mendapatkan styling optimal berdasarkan jumlah kategori.

```typescript
const styling = getOptimalAxisStyling(categoryCount, width, {
  minLabelWidth: 80,
  maxRotation: -45, // Rotasi maksimal
  minRotation: -15, // Rotasi minimal
});
```

### 4. `addStandardAxes()`

Fungsi lengkap untuk menambahkan axis dengan tick management otomatis.

```typescript
addStandardAxes(svg, xScale, yScale, width, height, {
  data: chartData, // Data untuk intelligent calculation
  xAxisOptions: {
    useIntelligentTicks: true, // Gunakan intelligent ticks
    minLabelWidth: 80,
    maxTicks: 12,
    preserveOutliers: true,
    adaptiveDensity: true,
  },
});
```

## Contoh Penggunaan

### Untuk Data dengan Distribusi Tidak Merata (Seperti di Gambar)

```typescript
import { addStandardAxes, getIntelligentTickValues } from "./chartUtils";

// Data dengan beberapa nilai tinggi dan banyak nilai rendah
const data = [
  { name: "Los", value: 700000 },
  { name: "Mech", value: 250000 },
  { name: "Sag", value: 120000 },
  // ... banyak data dengan nilai rendah
];

// Gunakan intelligent ticks
const tickValues = getIntelligentTickValues(xScale, width, data, {
  maxTicks: 10,
  preserveOutliers: true,
  adaptiveDensity: true,
});

// Atau gunakan addStandardAxes dengan opsi intelligent
addStandardAxes(svg, xScale, yScale, width, height, {
  data: data,
  xAxisOptions: {
    useIntelligentTicks: true,
    maxTicks: 10,
    preserveOutliers: true,
  },
});
```

### Untuk Data Normal

```typescript
// Gunakan smart ticks untuk data normal
const tickValues = getSmartTickValues(xScale, width, {
  minLabelWidth: 80,
  maxTicks: 15,
  preserveEnds: true,
});
```

## Fitur Utama

1. **Adaptive Spacing**: Menyesuaikan spacing berdasarkan jumlah kategori
2. **Preserve Outliers**: Selalu menampilkan nilai-nilai penting (outliers)
3. **Dynamic Rotation**: Rotasi label yang menyesuaikan dengan kepadatan
4. **Smart Truncation**: Truncate label panjang dengan tooltip
5. **Intelligent Distribution**: Distribusi tick yang cerdas untuk data tidak merata

## Parameter Konfigurasi

### `minLabelWidth`

- **Default**: 80px
- **Deskripsi**: Minimal lebar yang dibutuhkan untuk setiap label
- **Pengaruh**: Semakin besar, semakin sedikit tick yang ditampilkan

### `maxTicks`

- **Default**: 15 (smart), 12 (intelligent)
- **Deskripsi**: Maksimal jumlah tick yang ditampilkan
- **Pengaruh**: Membatasi kepadatan label

### `preserveOutliers`

- **Default**: true
- **Deskripsi**: Pertahankan nilai-nilai outlier dalam tick
- **Pengaruh**: Berguna untuk data dengan distribusi tidak merata

### `adaptiveDensity`

- **Default**: true
- **Deskripsi**: Sesuaikan tick dengan density data
- **Pengaruh**: Memberikan distribusi yang lebih baik untuk data tidak merata

## Tips Penggunaan

1. **Untuk data dengan banyak kategori**: Gunakan `getIntelligentTickValues()` dengan `preserveOutliers: true`
2. **Untuk data normal**: Gunakan `getSmartTickValues()` dengan `preserveEnds: true`
3. **Untuk chart yang responsif**: Gunakan `minLabelWidth` yang sesuai dengan ukuran chart
4. **Untuk data dengan outlier**: Pastikan `preserveOutliers: true` untuk menampilkan nilai-nilai penting
