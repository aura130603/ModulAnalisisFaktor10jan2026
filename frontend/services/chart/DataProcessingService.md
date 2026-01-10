# DataProcessingService Documentation

## Overview

`DataProcessingService` adalah service terpisah yang bertanggung jawab untuk memproses raw data (dari CSV/SPSS) menjadi struktur data yang dibutuhkan oleh `ChartService`. Service ini memisahkan concerns antara data processing dan chart configuration.

## Architecture

```
Raw Data (CSV/SPSS) → DataProcessingService → Processed Data → ChartService → Chart JSON
```

## Interface

### DataProcessingInput

```typescript
interface DataProcessingInput {
  // Required
  chartType: string;
  rawData: any[][]; // Raw data dari CSV/SPSS
  variables: Array<{ name: string; type?: string }>; // Variable definitions

  // Chart variables mapping
  chartVariables: {
    x?: string[]; // X-axis variables
    y?: string[]; // Y-axis variables
    z?: string[]; // Z-axis variables (3D)
    groupBy?: string[]; // Grouping variables
    low?: string[]; // Low values (range charts)
    high?: string[]; // High values (range charts)
    close?: string[]; // Close values (financial charts)
    y2?: string[]; // Secondary Y-axis
  };

  // Data processing options
  processingOptions?: {
    aggregation?: "sum" | "count" | "average" | "none";
    filterEmpty?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    errorBar?: ErrorBarOptions;
  };
}
```

### DataProcessingOutput

```typescript
interface DataProcessingOutput {
  data: any[];
  axisInfo: Record<string, string>;
}
```

### ErrorBarOptions

```typescript
// Confidence Interval Error Bar
type CIErrorBarOptions = {
  type: "ci";
  confidenceLevel: number; // Default: 95
};

// Standard Error Error Bar
type SEErrorBarOptions = {
  type: "se";
  multiplier: number; // Default: 2
};

// Standard Deviation Error Bar
type SDErrorBarOptions = {
  type: "sd";
  multiplier: number; // Default: 1
};

type ErrorBarOptions =
  | CIErrorBarOptions
  | SEErrorBarOptions
  | SDErrorBarOptions;
```

## Chart Variables Requirements

Setiap chart type membutuhkan chart variables yang berbeda. Berikut adalah panduan lengkap:

### Required vs Optional Inputs

#### **Input Wajib (Required)**

- `chartType`: Jenis chart yang akan dibuat
- `rawData`: Data mentah dalam format array 2D
- `variables`: Definisi variabel/kolom dalam dataset
- `chartVariables`: Mapping variabel ke posisi chart (minimal sesuai requirement chart type)

#### **Input Opsional (Optional)**

- `processingOptions`: Opsi pemrosesan data
- `chartVariables` tambahan: Variabel yang tidak wajib untuk chart type tertentu

### Required Chart Variables by Chart Type

#### **Simple Charts (1D)**

| Chart Type               | Required Variables | Optional Variables | Description                                                              |
| ------------------------ | ------------------ | ------------------ | ------------------------------------------------------------------------ |
| **Vertical Bar Chart**   | `x`, `y`           | -                  | X-axis: kategori, Y-axis: nilai                                          |
| **Horizontal Bar Chart** | `x`, `y`           | -                  | X-axis: nilai, Y-axis: kategori                                          |
| **Line Chart**           | `x`, `y`           | -                  | X-axis: domain, Y-axis: range                                            |
| **Area Chart**           | `x`, `y`           | -                  | X-axis: domain, Y-axis: range (filled)                                   |
| **Pie Chart**            | `x`, `y`           | -                  | X-axis: kategori, Y-axis: nilai                                          |
| **Boxplot**              | `x`, `y`           | -                  | X-axis: kategori, Y-axis: nilai (distribution)                           |
| **Error Bar Chart**      | `x`, `y`           | -                  | X-axis: kategori, Y-axis: nilai dengan error (supports errorBar options) |
| **Dot Plot**             | `x`, `y`           | -                  | X-axis: kategori, Y-axis: nilai (individual points)                      |
| **Summary Point Plot**   | `x`, `y`           | -                  | X-axis: kategori, Y-axis: summary statistic                              |
| **Violin Plot**          | `x`, `y`           | -                  | X-axis: kategori, Y-axis: nilai (distribution shape)                     |

**Input Wajib:**

- `chartType`: Salah satu dari chart type di atas
- `rawData`: Array 2D dengan minimal 2 kolom (x dan y)
- `variables`: Array dengan minimal 2 variabel (sesuai x dan y)
- `chartVariables.x`: Array dengan 1 variabel untuk X-axis
- `chartVariables.y`: Array dengan 1 variabel untuk Y-axis

#### **Scatter Charts (2D)**

| Chart Type                     | Required Variables | Optional Variables | Description                            |
| ------------------------------ | ------------------ | ------------------ | -------------------------------------- |
| **Scatter Plot**               | `x`, `y`           | -                  | X-axis: variabel 1, Y-axis: variabel 2 |
| **Scatter Plot With Fit Line** | `x`, `y`           | -                  | Scatter plot dengan trend line         |

**Input Wajib:**

- `chartType`: "Scatter Plot" atau "Scatter Plot With Fit Line"
- `rawData`: Array 2D dengan minimal 2 kolom (x dan y)
- `variables`: Array dengan minimal 2 variabel (sesuai x dan y)
- `chartVariables.x`: Array dengan 1 variabel untuk X-axis
- `chartVariables.y`: Array dengan 1 variabel untuk Y-axis

#### **Stacked/Grouped Charts**

| Chart Type                       | Required Variables | Optional Variables | Description                                           |
| -------------------------------- | ------------------ | ------------------ | ----------------------------------------------------- |
| **Vertical Stacked Bar Chart**   | `x`, `y`           | `groupBy`          | X-axis: kategori, Y-axis: nilai, Group: subkategori   |
| **Horizontal Stacked Bar Chart** | `x`, `y`           | `groupBy`          | X-axis: nilai, Y-axis: kategori, Group: subkategori   |
| **Clustered Bar Chart**          | `x`, `y`           | `groupBy`          | X-axis: kategori, Y-axis: nilai, Group: cluster       |
| **Multiple Line Chart**          | `x`, `y`           | `groupBy`          | X-axis: domain, Y-axis: range, Group: series          |
| **Stacked Area Chart**           | `x`, `y`           | `groupBy`          | X-axis: domain, Y-axis: range, Group: series (filled) |
| **Population Pyramid**           | `x`, `y`           | `groupBy`          | X-axis: kategori, Y-axis: nilai, Group: gender/group  |

**Input Wajib:**

- `chartType`: Salah satu dari chart type di atas
- `rawData`: Array 2D dengan minimal 3 kolom (x, y, dan groupBy jika digunakan)
- `variables`: Array dengan minimal 2-3 variabel (sesuai x, y, dan groupBy)
- `chartVariables.x`: Array dengan 1 variabel untuk X-axis
- `chartVariables.y`: Array dengan 1 variabel untuk Y-axis
- `chartVariables.groupBy`: Array dengan 1 variabel untuk grouping (opsional tapi direkomendasikan)

#### **3D Charts**

| Chart Type                 | Required Variables | Optional Variables | Description                                                |
| -------------------------- | ------------------ | ------------------ | ---------------------------------------------------------- |
| **3D Bar Chart**           | `x`, `y`, `z`      | -                  | X-axis: kategori 1, Y-axis: nilai, Z-axis: kategori 2      |
| **3D Bar Chart2**          | `x`, `y`, `z`      | -                  | Variasi 3D Bar Chart                                       |
| **3D Scatter Plot**        | `x`, `y`, `z`      | -                  | X-axis: variabel 1, Y-axis: variabel 2, Z-axis: variabel 3 |
| **Clustered 3D Bar Chart** | `x`, `y`, `z`      | `groupBy`          | 3D Bar dengan clustering                                   |
| **Stacked 3D Bar Chart**   | `x`, `y`, `z`      | `groupBy`          | 3D Bar dengan stacking                                     |

**Input Wajib:**

- `chartType`: Salah satu dari chart type di atas
- `rawData`: Array 2D dengan minimal 3 kolom (x, y, z)
- `variables`: Array dengan minimal 3 variabel (sesuai x, y, z)
- `chartVariables.x`: Array dengan 1 variabel untuk X-axis
- `chartVariables.y`: Array dengan 1 variabel untuk Y-axis
- `chartVariables.z`: Array dengan 1 variabel untuk Z-axis

#### **Grouped Charts**

| Chart Type               | Required Variables  | Optional Variables | Description                  |
| ------------------------ | ------------------- | ------------------ | ---------------------------- |
| **Grouped Scatter Plot** | `x`, `y`, `groupBy` | -                  | Scatter plot dengan grouping |
| **Drop Line Chart**      | `x`, `y`, `groupBy` | -                  | Line chart dengan drop lines |

**Input Wajib:**

- `chartType`: "Grouped Scatter Plot" atau "Drop Line Chart"
- `rawData`: Array 2D dengan minimal 3 kolom (x, y, groupBy)
- `variables`: Array dengan minimal 3 variabel (sesuai x, y, groupBy)
- `chartVariables.x`: Array dengan 1 variabel untuk X-axis
- `chartVariables.y`: Array dengan 1 variabel untuk Y-axis
- `chartVariables.groupBy`: Array dengan 1 variabel untuk grouping

#### **Range Charts**

| Chart Type               | Required Variables            | Optional Variables | Description                                                |
| ------------------------ | ----------------------------- | ------------------ | ---------------------------------------------------------- |
| **Simple Range Bar**     | `x`, `low`, `high`            | `close`            | X-axis: kategori, Low: nilai minimum, High: nilai maksimum |
| **High-Low-Close Chart** | `x`, `low`, `high`, `close`   | -                  | Financial chart dengan OHLC                                |
| **Clustered Range Bar**  | `x`, `low`, `high`, `groupBy` | `close`            | Range bar dengan clustering                                |

**Input Wajib:**

- `chartType`: Salah satu dari chart type di atas
- `rawData`: Array 2D dengan minimal 3-4 kolom (x, low, high, close jika diperlukan)
- `variables`: Array dengan minimal 3-4 variabel (sesuai x, low, high, close)
- `chartVariables.x`: Array dengan 1 variabel untuk X-axis
- `chartVariables.low`: Array dengan 1 variabel untuk nilai minimum
- `chartVariables.high`: Array dengan 1 variabel untuk nilai maksimum
- `chartVariables.close`: Array dengan 1 variabel untuk nilai penutupan (wajib untuk High-Low-Close)

#### **Special Charts**

| Chart Type                    | Required Variables       | Optional Variables | Description                                    |
| ----------------------------- | ------------------------ | ------------------ | ---------------------------------------------- |
| **Difference Area**           | `x`, `low`, `high`       | -                  | X-axis: kategori, Low: nilai 1, High: nilai 2  |
| **Vertical Bar & Line Chart** | `x`, `y`, `y2`           | -                  | X-axis: kategori, Y: bar value, Y2: line value |
| **Dual Axes Scatter Plot**    | `x`, `y`, `y2`           | -                  | X-axis: variabel, Y: axis 1, Y2: axis 2        |
| **Grouped 3D Scatter Plot**   | `x`, `y`, `z`, `groupBy` | -                  | 3D scatter dengan grouping                     |
| **Histogram**                 | `y`                      | -                  | Y-axis: nilai (binning di visualisasi)         |
| **Density Chart**             | `y`                      | -                  | Y-axis: nilai (density estimation)             |
| **Stacked Histogram**         | `x`, `groupBy`           | -                  | X-axis: nilai, Group: kategori                 |
| **Clustered Error Bar Chart** | `x`, `y`, `groupBy`      | -                  | X-axis: kategori, Y: nilai, Group: subkategori |
| **Scatter Plot Matrix**       | `x` (multiple)           | -                  | Multiple variables untuk matrix                |
| **Clustered Boxplot**         | `x`, `y`, `groupBy`      | -                  | X-axis: kategori, Y: nilai, Group: subkategori |
| **1-D Boxplot**               | `y`                      | -                  | Y-axis: nilai (distribution)                   |
| **Stem And Leaf Plot**        | `y`                      | -                  | Y-axis: nilai (stem-leaf display)              |

**Input Wajib untuk Special Charts:**

**Histogram & Density Chart:**

- `chartType`: "Histogram" atau "Density Chart"
- `rawData`: Array 2D dengan minimal 1 kolom (y)
- `variables`: Array dengan minimal 1 variabel (sesuai y)
- `chartVariables.y`: Array dengan 1 variabel untuk Y-axis

**Dual Axes Charts:**

- `chartType`: "Vertical Bar & Line Chart" atau "Dual Axes Scatter Plot"
- `rawData`: Array 2D dengan minimal 3 kolom (x, y, y2)
- `variables`: Array dengan minimal 3 variabel (sesuai x, y, y2)
- `chartVariables.x`: Array dengan 1 variabel untuk X-axis
- `chartVariables.y`: Array dengan 1 variabel untuk Y-axis pertama
- `chartVariables.y2`: Array dengan 1 variabel untuk Y-axis kedua

**Range Charts:**

- `chartType`: "Difference Area"
- `rawData`: Array 2D dengan minimal 3 kolom (x, low, high)
- `variables`: Array dengan minimal 3 variabel (sesuai x, low, high)
- `chartVariables.x`: Array dengan 1 variabel untuk X-axis
- `chartVariables.low`: Array dengan 1 variabel untuk nilai 1
- `chartVariables.high`: Array dengan 1 variabel untuk nilai 2

**Scatter Plot Matrix:**

- `chartType`: "Scatter Plot Matrix"
- `rawData`: Array 2D dengan minimal 2 kolom (multiple variables)
- `variables`: Array dengan minimal 2 variabel
- `chartVariables.x`: Array dengan multiple variabel untuk matrix

### Minimum Data Requirements

#### **Data Structure Requirements**

```typescript
// Minimum untuk Simple Charts
const minData = [
  ["Category A", 10], // Minimal 1 baris
  ["Category B", 20], // Minimal 2 baris untuk perbandingan
];

// Minimum untuk Stacked Charts
const minStackedData = [
  ["Category A", "Group 1", 10],
  ["Category A", "Group 2", 15],
  ["Category B", "Group 1", 20],
  ["Category B", "Group 2", 25],
];

// Minimum untuk 3D Charts
const min3DData = [
  ["Category A", 10, "Dimension 1"],
  ["Category B", 20, "Dimension 2"],
];

// Minimum untuk Range Charts
const minRangeData = [
  ["Date 1", 5, 15], // low, high
  ["Date 2", 8, 18], // low, high
];
```

#### **Variable Definition Requirements**

```typescript
// Minimum untuk Simple Charts
const minVariables = [
  { name: "category", type: "string" },
  { name: "value", type: "number" },
];

// Minimum untuk Stacked Charts
const minStackedVariables = [
  { name: "category", type: "string" },
  { name: "group", type: "string" },
  { name: "value", type: "number" },
];

// Minimum untuk 3D Charts
const min3DVariables = [
  { name: "category", type: "string" },
  { name: "value", type: "number" },
  { name: "dimension", type: "string" },
];
```

### Validation Checklist

Sebelum menggunakan DataProcessingService, pastikan:

#### **✅ Data Validation**

- [ ] `rawData` tidak kosong dan berbentuk array 2D
- [ ] `rawData` memiliki minimal 1 baris data
- [ ] Semua baris memiliki jumlah kolom yang sama
- [ ] Data sesuai dengan tipe variabel yang didefinisikan

#### **✅ Variables Validation**

- [ ] `variables` array tidak kosong
- [ ] Nama variabel unik dan tidak duplikat
- [ ] Tipe data sesuai (string untuk kategori, number untuk nilai)
- [ ] Jumlah variabel sesuai dengan jumlah kolom di `rawData`

#### **✅ Chart Variables Validation**

- [ ] `chartVariables` sesuai dengan requirement chart type
- [ ] Variabel yang direferensikan ada dalam `variables` array
- [ ] Required variables terisi (tidak undefined/null)
- [ ] Array length konsisten (semua array sama panjang)

#### **✅ Chart Type Validation**

- [ ] `chartType` adalah string yang valid
- [ ] Chart type didukung oleh service
- [ ] Chart type sesuai dengan chart variables yang diberikan

### Error Prevention Tips

#### **❌ Common Mistakes**

```typescript
// ❌ Salah: rawData kosong
const rawData = [];

// ❌ Salah: variables tidak sesuai dengan rawData
const rawData = [
  ["A", 10],
  ["B", 20],
];
const variables = [{ name: "category" }]; // Kurang 1 variabel

// ❌ Salah: chartVariables tidak sesuai chart type
const chartVariables = {
  x: ["category"],
  // y missing untuk Vertical Bar Chart
};

// ❌ Salah: variabel tidak ditemukan
const chartVariables = {
  x: ["nonexistent"],
  y: ["value"],
};
```

#### **✅ Correct Usage**

```typescript
// ✅ Benar: Data lengkap dan sesuai
const rawData = [
  ["A", 10],
  ["B", 20],
];
const variables = [
  { name: "category", type: "string" },
  { name: "value", type: "number" },
];
const chartVariables = {
  x: ["category"],
  y: ["value"],
};
```

## Aggregation Configuration System

`DataProcessingService` menggunakan sistem konfigurasi untuk memastikan aggregation yang digunakan sesuai dengan kebutuhan chart type:

### Konfigurasi Aggregation per Chart Type

- **Full Aggregation Support**: `sum`, `count`, `average`, `none`

  - Vertical Bar Chart, Horizontal Bar Chart, Line Chart, Area Chart, Pie Chart
  - Error Bar Chart, Summary Point Plot

- **Data Mentah Only**: `none`

  - Boxplot, Dot Plot, Violin Plot

- **Limited Aggregation**: `sum`, `none`

  - Stacked/Clustered charts, 3D Bar charts, Difference Area, Bar & Line

- **Count Only**: `count`, `none`

  - Histogram, Stacked Histogram, Frequency Polygon

- **Data Individual Only**: `none`
  - Scatter plots, Range charts, Boxplots, dll

### Validasi Aggregation

Service akan:

1. **Validasi** aggregation yang diminta sesuai konfigurasi chart type
2. **Auto-correct** jika aggregation tidak didukung (gunakan opsi pertama yang didukung)
3. **Force "none"** untuk chart yang hanya mendukung data mentah
4. **Throw error** dengan pesan yang jelas jika aggregation tidak valid

### Contoh Error Handling

```typescript
// ❌ Error: Aggregation "sum" tidak didukung untuk Dot Plot
const result = DataProcessingService.processDataForChart({
  chartType: "Dot Plot",
  aggregation: "sum", // Error!
  // ...
});

// ✅ Auto-correct: Gunakan "none" untuk Dot Plot
const result = DataProcessingService.processDataForChart({
  chartType: "Dot Plot",
  aggregation: "sum", // Akan diubah ke "none" otomatis
  // ...
});
```

## Methods

### processDataForChart(input: DataProcessingInput): any[]

Method utama yang memproses raw data berdasarkan chart type dan mengembalikan processed data array.

## Supported Chart Types

### Simple Charts

- Vertical Bar Chart
- Horizontal Bar Chart
- Line Chart
- Area Chart
- Pie Chart
- Boxplot
- Error Bar Chart
- Dot Plot
- Summary Point Plot
- Violin Plot

### Scatter Charts

- Scatter Plot
- Scatter Plot With Fit Line

### Stacked/Grouped Charts

- Vertical Stacked Bar Chart
- Horizontal Stacked Bar Chart
- Clustered Bar Chart
- Multiple Line Chart
- Stacked Area Chart
- Population Pyramid

### 3D Charts

- 3D Bar Chart
- 3D Bar Chart2
- 3D Scatter Plot
- Clustered 3D Bar Chart
- Stacked 3D Bar Chart

### Grouped Charts

- Grouped Scatter Plot
- Drop Line Chart

### Range Charts

- Simple Range Bar
- High-Low-Close Chart
- Clustered Range Bar

### Special Charts

- Difference Area
- Vertical Bar & Line Chart
- Dual Axes Scatter Plot
- Grouped 3D Scatter Plot
- Histogram
- Density Chart
- Stem And Leaf Plot
- Stacked Histogram
- Clustered Error Bar Chart
- Scatter Plot Matrix
- Clustered Boxplot
- 1-D Boxplot

## Supported Chart Types & Aggregation Usage

| Chart Type                   | Aggregation Supported? | Supported Aggregation                        |
| ---------------------------- | :--------------------: | -------------------------------------------- |
| Vertical Bar Chart           |           ✅           | `sum`, `count`, `average`, `none`            |
| Horizontal Bar Chart         |           ✅           | `sum`, `count`, `average`, `none`            |
| Line Chart                   |           ✅           | `sum`, `count`, `average`, `none`            |
| Area Chart                   |           ✅           | `sum`, `count`, `average`, `none`            |
| Pie Chart                    |           ✅           | `sum`, `count`, `average`, `none`            |
| Boxplot                      |           ✅           | `none` (data mentah)                         |
| Error Bar Chart              |           ✅           | `sum`, `count`, `average`, `none`            |
| Dot Plot                     |           ✅           | `none` (data individual)                     |
| Summary Point Plot           |           ✅           | `sum`, `count`, `average`, `none`            |
| Violin Plot                  |           ✅           | `none` (data mentah)                         |
| Scatter Plot                 |           ✅           | `none` (data individual)                     |
| Scatter Plot With Fit Line   |           ✅           | `none` (data individual)                     |
| Vertical Stacked Bar Chart   |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Horizontal Stacked Bar Chart |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Clustered Bar Chart          |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Multiple Line Chart          |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Stacked Area Chart           |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| Population Pyramid           |           ✅           | `sum` (untuk setiap subkategori), `none`     |
| 3D Bar Chart                 |           ✅           | `sum` (untuk kombinasi x-z), `none`          |
| 3D Bar Chart2                |           ✅           | `sum` (untuk kombinasi x-z), `none`          |
| 3D Scatter Plot              |           ✅           | `none` (data individual)                     |
| Clustered 3D Bar Chart       |           ✅           | `sum` (untuk kombinasi kategori), `none`     |
| Stacked 3D Bar Chart         |           ✅           | `sum` (untuk kombinasi kategori), `none`     |
| Grouped Scatter Plot         |           ✅           | `none` (data individual)                     |
| Drop Line Chart              |           ✅           | `none` (data individual)                     |
| Simple Range Bar             |           ✅           | `none` (data individual)                     |
| High-Low-Close Chart         |           ✅           | `none` (data individual)                     |
| Clustered Range Bar          |           ✅           | `none` (data individual)                     |
| Difference Area              |           ✅           | `sum` (untuk value0 dan value1), `none`      |
| Vertical Bar & Line Chart    |           ✅           | `sum` (untuk barValue dan lineValue), `none` |
| Dual Axes Scatter Plot       |           ✅           | `none` (data individual)                     |
| Grouped 3D Scatter Plot      |           ✅           | `none` (data individual)                     |
| Histogram                    |          ✅\*          | `count` (binning di visualisasi), `none`     |
| Density Chart                |           ✅           | `none` (data individual)                     |
| Stacked Histogram            |          ✅\*          | `count` (binning di visualisasi), `none`     |
| Frequency Polygon            |          ✅\*          | `count` (binning di visualisasi), `none`     |
| Clustered Error Bar Chart    |           ✅           | `sum` (untuk value, error tetap 2), `none`   |
| Scatter Plot Matrix          |           ✅           | `none` (data individual)                     |
| Clustered Boxplot            |           ✅           | `none` (data individual)                     |
| 1-D Boxplot                  |           ✅           | `none` (data individual)                     |
| Stem And Leaf Plot           |           ✅           | `none` (data individual)                     |

> **Catatan:**  
> ✅ = Aggregation parameter digunakan dan berpengaruh pada hasil.  
> ✅\* = Histogram/Stacked Histogram: hanya `count` yang digunakan, binning dilakukan di visualisasi.
>
> **`none` tersedia untuk semua chart type** sebagai opsi dasar untuk data mentah/individual tanpa aggregation.

### Cara Membaca Tabel

- **Aggregation Supported?** = ✅: Chart type ini mendukung aggregation, parameter `processingOptions.aggregation` akan digunakan.
- **Supported Aggregation**: Menunjukkan jenis aggregation yang benar-benar didukung oleh implementasi:
  - `sum`, `count`, `average`, `none`: Semua jenis aggregation didukung
  - `sum`, `none`: Hanya penjumlahan dan data mentah yang didukung
  - `count`, `none`: Hanya perhitungan jumlah dan data mentah yang didukung (untuk histogram)
  - `none`: Hanya data mentah/individual yang didukung (untuk chart yang tidak memerlukan aggregation)
  - Keterangan dalam kurung: Penjelasan tambahan tentang bagaimana aggregation diterapkan

**Contoh Penggunaan:**

- Untuk **Vertical Bar Chart**: Bisa menggunakan `sum`, `count`, `average`, atau `none`
- Untuk **Difference Area**: Bisa menggunakan `sum` atau `none` (data mentah)
- Untuk **Scatter Plot**: Hanya `none` yang efektif (data individual)
- Untuk **Histogram**: Bisa menggunakan `count` atau `none` (data mentah)

**Catatan Penting:**

- **`none` tersedia untuk semua chart type** sebagai opsi dasar
- Chart yang sebelumnya tidak mendukung aggregation sekarang mendukung `none`
- Ini memberikan konsistensi API di seluruh service

### Grouping Chart Berdasarkan Processing Function

**Charts dengan Full Aggregation Support** (`processSimpleChartData`):

- Vertical Bar Chart, Horizontal Bar Chart, Line Chart, Area Chart, Pie Chart
- Error Bar Chart, Summary Point Plot
- **Mendukung**: `sum`, `count`, `average`, `none`

**Charts dengan Data Mentah Only** (`processSimpleChartData` dengan override):

- Boxplot, Dot Plot, Violin Plot
- **Mendukung**: `none` (data mentah/individual)

**Charts dengan Limited Aggregation** (fungsi khusus):

- Stacked/Clustered charts: `sum`, `none`
- 3D Bar charts: `sum`, `none`
- Difference Area, Bar & Line: `sum`, `none`
- Histogram, Frequency Polygon: `count`, `none`
- Clustered Error Bar: `sum`, `none`

**Charts dengan Data Individual** (fungsi khusus):

- Scatter plots, Range charts, Boxplots, dll
- **Mendukung**: `none` (data mentah/individual)

## Usage Examples

### Example 1: Simple Bar Chart

```typescript
import { DataProcessingService } from "./DataProcessingService";

const rawData = [
  ["A", 30],
  ["B", 80],
  ["C", 45],
  ["D", 60],
];

const variables = [
  { name: "category", type: "string" },
  { name: "value", type: "number" },
];

const processedData = DataProcessingService.processDataForChart({
  chartType: "Vertical Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["category"],
    y: ["value"],
  },
  processingOptions: {
    aggregation: "sum",
    filterEmpty: true,
  },
});

// Result: [{ category: "A", value: 30 }, { category: "B", value: 80 }, ...]
```

### Example 2: Scatter Plot

```typescript
const rawData = [
  [10, 20],
  [15, 25],
  [20, 30],
  [25, 35],
];

const variables = [
  { name: "x", type: "number" },
  { name: "y", type: "number" },
];

const processedData = DataProcessingService.processDataForChart({
  chartType: "Scatter Plot",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["x"],
    y: ["y"],
  },
});

// Result: [{ x: 10, y: 20 }, { x: 15, y: 25 }, ...]
```

### Example 2.1: Scatter Plot with "none" aggregation (explicit)

```typescript
const processedData = DataProcessingService.processDataForChart({
  chartType: "Scatter Plot",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["x"],
    y: ["y"],
  },
  processingOptions: {
    aggregation: "none", // Explicitly specify no aggregation
    filterEmpty: true,
  },
});

// Result: [{ x: 10, y: 20 }, { x: 15, y: 25 }, ...]
```

### Example 3: Bar Chart with "none" aggregation (data mentah)

```typescript
const rawData = [
  ["A", 30],
  ["B", 80],
  ["C", 45],
  ["D", 60],
];

const variables = [
  { name: "category", type: "string" },
  { name: "value", type: "number" },
];

const processedData = DataProcessingService.processDataForChart({
  chartType: "Vertical Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["category"],
    y: ["value"],
  },
  processingOptions: {
    aggregation: "none",
    filterEmpty: true,
  },
});

// Result: [{ category: "A", value: 30 }, { category: "B", value: 80 }, ...]
```

### Example 4: Stacked Bar Chart

```typescript
const rawData = [
  ["A", "Group1", 30],
  ["A", "Group2", 20],
  ["B", "Group1", 25],
  ["B", "Group2", 15],
];

const variables = [
  { name: "category", type: "string" },
  { name: "group", type: "string" },
  { name: "value", type: "number" },
];

const processedData = DataProcessingService.processDataForChart({
  chartType: "Vertical Stacked Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["category"],
    y: ["group"],
  },
});

// Result: [
//   { category: "A", subcategory: "Group1", value: 30 },
//   { category: "A", subcategory: "Group2", value: 20 },
//   ...
// ]
```

## Processing Options

### **🔧 Available Options**

```typescript
interface ProcessingOptions {
  aggregation?: "sum" | "count" | "average" | "none";
  filterEmpty?: boolean;
  sortBy?: string | undefined; // Set to undefined to disable sorting
  sortOrder?: "asc" | "desc";
  limit?: number;
  errorBar?: ErrorBarOptions;
}
```

### **📊 Sorting Options**

#### **Enable Sorting**

```typescript
const processingOptions = {
  sortBy: "category", // Sort by category field
  sortOrder: "asc", // Ascending order
};
```

#### **Disable Sorting**

```typescript
const processingOptions = {
  sortBy: undefined, // No sorting applied
  sortOrder: "asc", // Ignored when sortBy is undefined
};
```

#### **Sort by Different Fields**

```typescript
const processingOptions = {
  sortBy: "value", // Sort by value field
  sortOrder: "desc", // Descending order
};
```

#### **✅ Sorting Support**

**Fully Implemented** di semua chart types:

- **Bar Charts**: Sort by `category`, `value`
- **Line Charts**: Sort by `category`, `value`
- **Scatter Plots**: Sort by `x`, `y`
- **Pie Charts**: Sort by `category`, `value`
- **Stacked Charts**: Sort by `category`, `subcategory`, `value`
- **3D Charts**: Sort by `x`, `y`, `z`
- **Range Charts**: Sort by `category`, `low`, `high`, `close`
- **All Other Charts**: Sort by any available field

#### **🔧 Sorting Implementation**

```typescript
// Helper method untuk apply sorting
private static applySorting<T extends Record<string, any>>(
  data: T[],
  sortBy?: string,
  sortOrder: "asc" | "desc" = "asc"
): T[] {
  if (!sortBy || data.length === 0) {
    return data; // Return original data if no sorting
  }

  return [...data].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    // Handle numbers
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    // Handle strings
    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === "asc" ? comparison : -comparison;
    }

    // Handle mixed types
    const aStr = String(aValue || "");
    const bStr = String(bValue || "");
    const comparison = aStr.localeCompare(bStr);
    return sortOrder === "asc" ? comparison : -comparison;
  });
}
```

### **🎯 Chart-Specific Aggregation Support**

| Chart Type        | Supported Aggregations            | Notes         |
| ----------------- | --------------------------------- | ------------- |
| **Bar Charts**    | `sum`, `count`, `average`, `none` | Full support  |
| **Line Charts**   | `sum`, `count`, `average`, `none` | Full support  |
| **Scatter Plots** | `none`                            | Raw data only |
| **Pie Charts**    | `sum`, `count`, `average`, `none` | Full support  |
| **Candlestick**   | `none`                            | Raw data only |
| **Range Charts**  | `none`                            | Raw data only |

### **💡 Usage Examples**

```typescript
// Example 1: No sorting, no aggregation (raw data)
const processingOptions = {
  aggregation: "none",
  filterEmpty: true,
  sortBy: undefined, // Disable sorting
  sortOrder: "asc",
};

// Example 2: Sort by category, sum aggregation
const processingOptions = {
  aggregation: "sum",
  filterEmpty: true,
  sortBy: "category", // Sort by category
  sortOrder: "asc",
};

// Example 3: Sort by value, count aggregation
const processingOptions = {
  aggregation: "count",
  filterEmpty: true,
  sortBy: "value", // Sort by value
  sortOrder: "desc", // Descending order
};
```

## Error Handling

Service akan throw error jika:

1. `rawData` kosong atau bukan array
2. `variables` kosong atau bukan array
3. Variable yang direferensikan di `chartVariables` tidak ditemukan dalam `variables`

## Integration with ChartService

```typescript
import { DataProcessingService } from "./DataProcessingService";
import { ChartService } from "./ChartService";

// Step 1: Process raw data
const processedData = DataProcessingService.processDataForChart({
  chartType: "Vertical Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: chartVariables,
});

// Step 2: Generate chart JSON
const chartJSON = ChartService.createChartJSON({
  chartType: "Vertical Bar Chart",
  chartData: processedData,
  chartVariables: chartVariables,
  chartMetadata: {
    title: "My Chart",
  },
});
```

## Benefits

1. **Separation of Concerns**: Data processing terpisah dari chart configuration
2. **Reusability**: DataProcessingService bisa digunakan untuk berbagai chart types
3. **Testability**: Mudah untuk unit test data processing logic
4. **Maintainability**: Logic data processing terpusat di satu tempat
5. **Flexibility**: Mendukung berbagai chart types dan processing options
