# Chart Creation Workflow Guide

## Overview

Workflow pembuatan chart menggunakan 2 service utama:

1. **DataProcessingService** - Memproses raw data menjadi format yang sesuai untuk chart
2. **ChartService** - Membuat chart JSON configuration dari processed data

## Complete Workflow

```
Raw Data (CSV/SPSS) → DataProcessingService → ChartService → Chart JSON
```

---

## Step 1: Data Processing (DataProcessingService)

### Method: `processDataForChart(input: DataProcessingInput)`

**Purpose**: Mengkonversi raw data menjadi format yang dibutuhkan oleh chart tertentu.

### Input Parameters

```typescript
interface DataProcessingInput {
  // REQUIRED
  chartType: string; // Jenis chart yang akan dibuat
  rawData: any[][]; // Data mentah dalam format array 2D
  variables: Array<{
    // Definisi variabel/kolom dalam dataset
    name: string;
    type?: string;
  }>;

  // REQUIRED - Mapping variabel ke posisi chart
  chartVariables: {
    x?: string[]; // Variabel untuk X-axis
    y?: string[]; // Variabel untuk Y-axis
    z?: string[]; // Variabel untuk Z-axis (3D charts)
    groupBy?: string[]; // Variabel untuk grouping/clustering
    low?: string[]; // Variabel untuk nilai minimum (range charts)
    high?: string[]; // Variabel untuk nilai maksimum (range charts)
    close?: string[]; // Variabel untuk nilai penutupan (financial charts)
    y2?: string[]; // Variabel untuk Y-axis kedua (dual axis charts)
  };

  // OPTIONAL - Opsi pemrosesan data
  processingOptions?: {
    aggregation?: "sum" | "count" | "average" | "none";
    filterEmpty?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    errorBar?: ErrorBarOptions; // Untuk Error Bar Charts
  };
}
```

### Parameter Details

#### **chartType** (Required)

- **Type**: `string`
- **Description**: Menentukan jenis chart dan format data output yang dihasilkan
- **Supported Values**: "Vertical Bar Chart", "Scatter Plot", "Line Chart", dll.
- **Impact**: Menentukan struktur data output dan aggregation yang didukung

#### **rawData** (Required)

- **Type**: `any[][]` (Array 2D)
- **Description**: Data mentah dari CSV/SPSS
- **Format**: `[[row1_col1, row1_col2, ...], [row2_col1, row2_col2, ...]]`
- **Example**:
  ```typescript
  [
    ["Category A", 30, "Group 1"],
    ["Category B", 45, "Group 1"],
    ["Category A", 25, "Group 2"],
  ];
  ```

#### **variables** (Required)

- **Type**: `Array<{name: string, type?: string}>`
- **Description**: Definisi nama dan tipe setiap kolom dalam rawData
- **Rules**:
  - Jumlah harus sama dengan jumlah kolom di rawData
  - Nama harus unique
- **Example**:
  ```typescript
  [
    { name: "category", type: "string" },
    { name: "value", type: "number" },
    { name: "group", type: "string" },
  ];
  ```

#### **chartVariables** (Required)

- **Type**: Object dengan mapping variabel ke posisi chart
- **Description**: Menentukan variabel mana yang digunakan untuk axis/posisi tertentu
- **Rules**: Harus sesuai dengan requirement chart type
- **Example**:
  ```typescript
  {
    x: ["category"],     // X-axis menggunakan kolom "category"
    y: ["value"],        // Y-axis menggunakan kolom "value"
    groupBy: ["group"]   // Grouping menggunakan kolom "group"
  }
  ```

#### **processingOptions** (Optional)

- **aggregation**: Cara menggabungkan data yang sama
  - `"sum"`: Menjumlahkan nilai
  - `"count"`: Menghitung jumlah record
  - `"average"`: Menghitung rata-rata
  - `"none"`: Tidak ada aggregation (data mentah)
- **filterEmpty**: Remove empty/null values (default: `true`)
- **sortBy**: Field untuk sorting data (optional)
- **sortOrder**: `"asc"` atau `"desc"` (default: `"asc"`)
- **limit**: Batasi jumlah data output (optional)
- **errorBar**: Konfigurasi error bar (untuk Error Bar Charts)

### Output

```typescript
interface DataProcessingOutput {
  data: any[]; // Processed data array
  axisInfo: Record<string, string>; // Mapping axis ke nama variabel
}
```

### Example Usage

```typescript
import { DataProcessingService } from "./DataProcessingService";

// Raw data dari CSV/SPSS
const rawData = [
  ["A", 30, "Red"],
  ["B", 45, "Red"],
  ["A", 25, "Blue"],
  ["B", 35, "Blue"],
];

// Definisi variabel
const variables = [
  { name: "category", type: "string" },
  { name: "value", type: "number" },
  { name: "color", type: "string" },
];

// Process data
const result = DataProcessingService.processDataForChart({
  chartType: "Vertical Stacked Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: {
    x: ["category"],
    y: ["value"],
    groupBy: ["color"],
  },
  processingOptions: {
    aggregation: "sum",
    filterEmpty: true,
    sortBy: "category",
    sortOrder: "asc",
  },
});

console.log(result);
// Output:
// {
//   data: [
//     { category: "A", subcategory: "Red", value: 30 },
//     { category: "A", subcategory: "Blue", value: 25 },
//     { category: "B", subcategory: "Red", value: 45 },
//     { category: "B", subcategory: "Blue", value: 35 }
//   ],
//   axisInfo: {
//     category: "category",
//     subcategory: "color",
//     value: "value"
//   }
// }
```

---

## Step 2: Chart JSON Creation (ChartService)

### Method: `createChartJSON(input: ChartInput)`

**Purpose**: Membuat chart JSON configuration dari processed data.

### Input Parameters

```typescript
interface ChartInput {
  // REQUIRED
  chartType: string; // Jenis chart (sama dengan Step 1)
  chartData: any[]; // Data dari DataProcessingService.data

  // OPTIONAL - Informasi variabel (untuk smart color generation)
  chartVariables?: {
    x?: string[];
    y?: string[];
    z?: string[];
    groupBy?: string[];
    low?: string[];
    high?: string[];
    close?: string[];
    y2?: string[];
  };

  // OPTIONAL - Metadata chart
  chartMetadata?: {
    title?: string;
    subtitle?: string;
    description?: string;
    notes?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
    axisInfo?: any; // Override axisInfo dari Step 1
  };

  // OPTIONAL - Konfigurasi chart
  chartConfig?: {
    width?: number;
    height?: number;
    chartColor?: string[];
    useAxis?: boolean;
    useLegend?: boolean;
    statistic?: "mean" | "median" | "mode" | "min" | "max";
    axisLabels?: {
      x?: string;
      y?: string;
      y1?: string; // Untuk dual axis charts
      y2?: string; // Untuk dual axis charts
    };
    axisScaleOptions?: {
      x?: {
        min?: string;
        max?: string;
        majorIncrement?: string;
        origin?: string;
      };
      y?: {
        min?: string;
        max?: string;
        majorIncrement?: string;
        origin?: string;
      };
      y1?: {
        min?: string;
        max?: string;
        majorIncrement?: string;
        origin?: string;
      };
      y2?: {
        min?: string;
        max?: string;
        majorIncrement?: string;
        origin?: string;
      };
    };
  };
}
```

### Parameter Details

#### **chartType** (Required)

- **Type**: `string`
- **Description**: Harus sama dengan chartType di Step 1
- **Purpose**: Menentukan struktur chart JSON yang akan dibuat

#### **chartData** (Required)

- **Type**: `any[]`
- **Description**: Data yang sudah diproses dari `DataProcessingService.data`
- **Format**: Tergantung chartType, bisa berupa:
  - Simple: `[{category: "A", value: 30}]`
  - Stacked: `[{category: "A", subcategory: "Red", value: 30}]`
  - Scatter: `[{x: 10, y: 20}]`

#### **chartVariables** (Optional)

- **Type**: Object (sama dengan Step 1)
- **Description**: Digunakan untuk smart color generation dan axis labeling
- **Note**: Sebaiknya gunakan yang sama dengan Step 1

#### **chartMetadata** (Optional)

- **title**: Judul chart (default: auto-generated)
- **subtitle**: Subjudul chart
- **description**: Deskripsi chart
- **notes**: Catatan tambahan
- **titleFontSize**: Ukuran font judul (default: 16)
- **subtitleFontSize**: Ukuran font subjudul (default: 12)
- **axisInfo**: Override axisInfo dari Step 1

#### **chartConfig** (Optional)

- **width/height**: Dimensi chart (default: 800x600)
- **chartColor**: Array warna custom (default: auto-generated)
- **useAxis**: Tampilkan axis (default: `true`)
- **useLegend**: Tampilkan legend (default: `true`)
- **statistic**: Statistik untuk Summary Point Plot
- **axisLabels**: Label custom untuk axis
- **axisScaleOptions**: Konfigurasi skala axis

### Output

```typescript
interface ChartJSON {
  charts: Array<{
    chartType: string;
    chartMetadata: {
      axisInfo: any;
      description: string;
      notes?: string;
      title?: string;
      subtitle?: string;
      titleFontSize?: number;
      subtitleFontSize?: number;
    };
    chartData: any[];
    chartConfig: {
      width: number;
      height: number;
      chartColor?: string[];
      useAxis?: boolean;
      useLegend?: boolean;
      statistic?: "mean" | "median" | "mode" | "min" | "max";
      axisLabels: {
        x: string;
        y?: string;
        y1?: string;
        y2?: string;
      };
      axisScaleOptions?: any;
    };
  }>;
}
```

### Example Usage

```typescript
import { ChartService } from "./ChartService";

// Data dari Step 1
const { data, axisInfo } = result;

// Create chart JSON
const chartJSON = ChartService.createChartJSON({
  chartType: "Vertical Stacked Bar Chart",
  chartData: data,
  chartVariables: {
    x: ["category"],
    y: ["value"],
    groupBy: ["color"],
  },
  chartMetadata: {
    title: "Sales by Category and Color",
    description: "Stacked bar chart showing sales distribution",
    axisInfo: axisInfo, // Gunakan axisInfo dari Step 1
  },
  chartConfig: {
    width: 900,
    height: 500,
    chartColor: ["#ff6b6b", "#4ecdc4", "#45b7d1"],
    axisLabels: {
      x: "Product Category",
      y: "Sales Amount",
    },
  },
});

console.log(chartJSON);
```

---

## Complete Workflow Example

### Scenario: Membuat Stacked Bar Chart dari Data Penjualan

```typescript
import { DataProcessingService } from "./DataProcessingService";
import { ChartService } from "./ChartService";

// Step 0: Raw data dari CSV/database
const salesData = [
  ["Electronics", 1500, "Q1"],
  ["Electronics", 1800, "Q2"],
  ["Clothing", 1200, "Q1"],
  ["Clothing", 1400, "Q2"],
  ["Food", 800, "Q1"],
  ["Food", 950, "Q2"],
];

const variables = [
  { name: "category", type: "string" },
  { name: "sales", type: "number" },
  { name: "quarter", type: "string" },
];

// Step 1: Process data
const processed = DataProcessingService.processDataForChart({
  chartType: "Vertical Stacked Bar Chart",
  rawData: salesData,
  variables: variables,
  chartVariables: {
    x: ["category"],
    y: ["sales"],
    groupBy: ["quarter"],
  },
  processingOptions: {
    aggregation: "sum",
    filterEmpty: true,
    sortBy: "category",
    sortOrder: "asc",
  },
});

// Step 2: Create chart JSON
const chartJSON = ChartService.createChartJSON({
  chartType: "Vertical Stacked Bar Chart",
  chartData: processed.data,
  chartVariables: {
    x: ["category"],
    y: ["sales"],
    groupBy: ["quarter"],
  },
  chartMetadata: {
    title: "Quarterly Sales by Category",
    subtitle: "Q1 vs Q2 Performance",
    description: "Sales performance comparison across product categories",
    axisInfo: processed.axisInfo,
  },
  chartConfig: {
    width: 800,
    height: 600,
    chartColor: ["#3498db", "#e74c3c"],
    axisLabels: {
      x: "Product Category",
      y: "Sales Amount ($)",
    },
  },
});

// Step 3: Use chartJSON untuk rendering
console.log("Final Chart JSON:", chartJSON);
```

---

## Chart Type Specific Examples

### Simple Bar Chart

```typescript
// Step 1: Process
const processed = DataProcessingService.processDataForChart({
  chartType: "Vertical Bar Chart",
  rawData: [
    ["A", 30],
    ["B", 45],
    ["C", 25],
  ],
  variables: [
    { name: "category", type: "string" },
    { name: "value", type: "number" },
  ],
  chartVariables: {
    x: ["category"],
    y: ["value"],
  },
});

// Step 2: Create chart
const chartJSON = ChartService.createChartJSON({
  chartType: "Vertical Bar Chart",
  chartData: processed.data,
  chartMetadata: {
    title: "Simple Bar Chart",
    axisInfo: processed.axisInfo,
  },
});
```

### Scatter Plot

```typescript
// Step 1: Process
const processed = DataProcessingService.processDataForChart({
  chartType: "Scatter Plot",
  rawData: [
    [10, 20],
    [15, 25],
    [20, 30],
  ],
  variables: [
    { name: "x_val", type: "number" },
    { name: "y_val", type: "number" },
  ],
  chartVariables: {
    x: ["x_val"],
    y: ["y_val"],
  },
});

// Step 2: Create chart
const chartJSON = ChartService.createChartJSON({
  chartType: "Scatter Plot",
  chartData: processed.data,
  chartMetadata: {
    title: "Correlation Analysis",
    axisInfo: processed.axisInfo,
  },
});
```

### Error Bar Chart

```typescript
// Step 1: Process with error bar options
const processed = DataProcessingService.processDataForChart({
  chartType: "Error Bar Chart",
  rawData: [
    ["Group A", 25],
    ["Group A", 30],
    ["Group A", 28],
    ["Group B", 35],
    ["Group B", 40],
    ["Group B", 38],
  ],
  variables: [
    { name: "group", type: "string" },
    { name: "value", type: "number" },
  ],
  chartVariables: {
    x: ["group"],
    y: ["value"],
  },
  processingOptions: {
    aggregation: "average",
    errorBar: {
      type: "ci",
      confidenceLevel: 95,
    },
  },
});

// Step 2: Create chart
const chartJSON = ChartService.createChartJSON({
  chartType: "Error Bar Chart",
  chartData: processed.data,
  chartMetadata: {
    title: "Mean Values with 95% CI",
    axisInfo: processed.axisInfo,
  },
});
```

---

## Best Practices

### 1. **Validation**

```typescript
// Validate raw data before processing
if (!rawData || rawData.length === 0) {
  throw new Error("Raw data is empty");
}

// Validate variables match data columns
if (variables.length !== rawData[0].length) {
  throw new Error("Variables count doesn't match data columns");
}
```

### 2. **Error Handling**

```typescript
try {
  const processed = DataProcessingService.processDataForChart(input);
  const chartJSON = ChartService.createChartJSON({
    chartType: input.chartType,
    chartData: processed.data,
    chartMetadata: { axisInfo: processed.axisInfo },
  });
} catch (error) {
  console.error("Chart creation failed:", error.message);
}
```

### 3. **Reuse axisInfo**

```typescript
// GOOD: Gunakan axisInfo dari DataProcessingService
chartMetadata: {
  axisInfo: processed.axisInfo  // Smart variable mapping
}

// AVOID: Manual axisInfo (generic labels)
chartMetadata: {
  axisInfo: { category: "Category", value: "Value" }
}
```

### 4. **Chart Variables Consistency**

```typescript
// Gunakan chartVariables yang sama di kedua step
const chartVariables = {
  x: ["category"],
  y: ["value"],
  groupBy: ["group"],
};

// Step 1
const processed = DataProcessingService.processDataForChart({
  chartVariables,
  // ...
});

// Step 2
const chartJSON = ChartService.createChartJSON({
  chartVariables, // Same variables
  // ...
});
```

---

## Troubleshooting

### Common Issues

1. **Empty processed data**

   - Check if chartVariables mapping is correct
   - Verify variable names exist in variables array
   - Check if filterEmpty is removing all data

2. **Wrong chart structure**

   - Ensure chartType matches data format requirements
   - Verify aggregation support for the chart type

3. **Missing axis labels**

   - Use axisInfo from DataProcessingService
   - Or provide custom axisLabels in chartConfig

4. **Color issues**
   - For grouped charts, ensure chartVariables include groupBy
   - Provide custom chartColor if needed

### Debug Tips

```typescript
// Debug processed data
console.log("Processed data:", processed.data);
console.log("Axis info:", processed.axisInfo);
console.log("Sample data:", processed.data.slice(0, 3));

// Debug chart variables
console.log("Chart variables mapping:", chartVariables);
console.log("Available fields in data:", Object.keys(processed.data[0]));
```
