# DataProcessingWorker Documentation

## Overview

`DataProcessingWorker.js` adalah Web Worker yang mengimplementasikan fungsionalitas `DataProcessingService` untuk memproses raw data (dari CSV/SPSS) menjadi struktur data yang dibutuhkan oleh chart. Worker ini berjalan di background thread untuk menghindari blocking UI thread.

## Architecture

```
Main Thread → DataProcessingWorker → Processed Data → ChartService → Chart JSON
```

## Input Format

Worker menerima data melalui `postMessage()` dengan format:

```javascript
{
  chartType: string,
  rawData: any[][],  // Raw data dari CSV/SPSS
  variables: Array<{ name: string; type?: string }>,  // Variable definitions
  chartVariables: {
    x?: string[],        // X-axis variables
    y?: string[],        // Y-axis variables
    z?: string[],        // Z-axis variables (3D)
    groupBy?: string[],  // Grouping variables
    low?: string[],      // Low values (range charts)
    high?: string[],     // High values (range charts)
    close?: string[],    // Close values (financial charts)
    y2?: string[],       // Secondary Y-axis
  },
  processingOptions?: {
    aggregation?: 'sum' | 'count' | 'average' | 'none',
    filterEmpty?: boolean,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    limit?: number
  }
}
```

## Output Format

Worker mengirim hasil melalui `postMessage()` dengan format:

```javascript
// Success case
{
  success: true,
  processedData: any[],  // Processed data array
  chartType: string
}

// Error case
{
  success: false,
  error: string
}
```

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
- Frequency Polygon
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

## Usage Examples

### Basic Usage

```javascript
// Buat worker
const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

// Setup event listener
worker.onmessage = function (event) {
  if (event.data.success) {
    console.log("Processed data:", event.data.processedData);
    // Lanjutkan ke ChartService
  } else {
    console.error("Error:", event.data.error);
  }
  worker.terminate();
};

// Kirim data ke worker
worker.postMessage({
  chartType: "Vertical Bar Chart",
  rawData: [
    ["A", 30],
    ["B", 80],
  ],
  variables: [
    { name: "category", type: "string" },
    { name: "value", type: "number" },
  ],
  chartVariables: {
    x: ["category"],
    y: ["value"],
  },
  processingOptions: {
    aggregation: "sum",
    filterEmpty: true,
  },
});
```

### Promise-based Usage

```javascript
function useDataProcessingWorker(input) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

    worker.onmessage = function (event) {
      if (event.data.success) {
        resolve(event.data.processedData);
      } else {
        reject(new Error(event.data.error));
      }
      worker.terminate();
    };

    worker.onerror = function (error) {
      reject(error);
      worker.terminate();
    };

    worker.postMessage(input);
  });
}

// Usage
async function processData() {
  try {
    const processedData = await useDataProcessingWorker({
      chartType: "Vertical Bar Chart",
      rawData: rawData,
      variables: variables,
      chartVariables: chartVariables,
    });

    console.log("Processed data:", processedData);
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### Integration with ChartService

```javascript
// Step 1: Process data dengan worker
const worker = new Worker("/workers/ChartBuilder/DataProcessingWorker.js");

worker.onmessage = function (event) {
  if (event.data.success) {
    // Step 2: Generate chart JSON dengan ChartService
    const chartJSON = ChartService.createChartJSON({
      chartType: "Vertical Bar Chart",
      chartData: event.data.processedData,
      chartVariables: {
        x: ["category"],
        y: ["value"],
      },
      chartMetadata: {
        title: "My Chart",
      },
    });

    console.log("Chart JSON:", chartJSON);
  }
  worker.terminate();
};

worker.postMessage({
  chartType: "Vertical Bar Chart",
  rawData: rawData,
  variables: variables,
  chartVariables: chartVariables,
});
```

## Processing Options

### aggregation

- `'sum'`: Menjumlahkan nilai untuk kategori yang sama
- `'count'`: Menghitung jumlah data untuk kategori yang sama
- `'average'`: Menghitung rata-rata untuk kategori yang sama
- `'none'`: Tidak melakukan aggregation

### filterEmpty

- `true`: Filter data yang kosong/null/undefined
- `false`: Include semua data termasuk yang kosong

### sortBy

- Nama variable untuk sorting

### sortOrder

- `'asc'`: Ascending order
- `'desc'`: Descending order

### limit

- Jumlah maksimum data yang akan diproses

## Error Handling

Worker akan mengirim error message jika:

1. `rawData` kosong atau bukan array
2. `variables` kosong atau bukan array
3. Variable yang direferensikan di `chartVariables` tidak ditemukan dalam `variables`
4. Error processing data lainnya

```javascript
worker.onmessage = function (event) {
  if (event.data.success) {
    // Handle success
  } else {
    console.error("Worker error:", event.data.error);
  }
};

worker.onerror = function (error) {
  console.error("Worker error:", error);
};
```

## Performance Benefits

1. **Non-blocking**: Data processing berjalan di background thread
2. **UI Responsive**: Main thread tidak terblokir untuk operasi berat
3. **Scalable**: Bisa handle dataset besar tanpa impact ke UI
4. **Isolated**: Error di worker tidak crash main thread

## File Location

```
frontend/public/workers/ChartBuilder/DataProcessingWorker.js
```

## Dependencies

Worker ini tidak memiliki dependencies eksternal dan berjalan standalone. Semua logic data processing sudah diimplementasikan di dalam worker.

## Migration from DataProcessingService

Worker ini adalah migrasi langsung dari `DataProcessingService` dengan:

- Interface yang sama
- Logic processing yang sama
- Output format yang sama
- Error handling yang sama

Perbedaan hanya pada cara komunikasi (postMessage vs direct function call).
