import { DataProcessingService } from "./DataProcessingService";
import { d3ColorScales } from "@/utils/chartBuilder/defaultStyles/defaultColors";

/**
 * ChartService - Service untuk membuat chart JSON
 *
 * ============================================================================
 * DOKUMENTASI PENGGUNAAN SPESIFIK
 * ============================================================================
 *
 * 1. Q-Q PLOT
 * =================
 *
 * // Cara 1: Menggunakan DataProcessingService + ChartService (Recommended)
 * const rawData = [
 *   [1, 2.1, 3.5, 4.2, 5.1, 6.3, 7.0, 8.1, 9.5, 10.2],
 *   [2, 3.8, 4.1, 5.3, 6.2, 7.1, 8.5, 9.2, 10.1, 11.3],
 *   [3, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1, 10.5, 11.2, 12.1]
 * ];
 *
 * const variables = [
 *   { name: "NN", type: "NUMERIC" },
 *   { name: "N", type: "NUMERIC" },
 *   { name: "GM", type: "NUMERIC" }
 * ];
 *
 * // Step 1: Process data menggunakan DataProcessingService
 * const processedData = DataProcessingService.processDataForChart({
 *   chartType: "Q-Q Plot",
 *   rawData: rawData,
 *   variables: variables,
 *   chartVariables: {
 *     y: ["NN"] // Hanya butuh 1 variabel di Y-axis
 *   }
 * });
 *
 * // Step 2: Buat chart JSON menggunakan ChartService
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "Q-Q Plot",
 *   chartData: processedData.data,
 *   chartVariables: {
 *     y: ["NN"]
 *   },
 *   chartMetadata: {
 *     title: "Normal Q-Q Plot of NN",
 *     subtitle: "Testing normality assumption",
 *     description: "Normal Q-Q plot showing the relationship between theoretical and sample quantiles"
 *   },
 *   chartConfig: {
 *     width: 800,
 *     height: 600,
 *     axisLabels: {
 *       x: "Theoretical Quantiles",
 *       y: "Sample Quantiles"
 *     }
 *   }
 * });
 *
 * // Cara 2: Quick method (jika data sudah dalam format yang benar)
 * const chartJSON = ChartService.quickChart(
 *   [
 *     { x: -1.96, y: -2.1 },
 *     { x: -1.28, y: -1.3 },
 *     { x: 0, y: 0.1 },
 *     { x: 1.28, y: 1.2 },
 *     { x: 1.96, y: 2.0 }
 *   ],
 *   "Q-Q Plot"
 * );
 *
 * ============================================================================
 *
 * 1.5. HISTOGRAM WITH NORMAL CURVE
 * ================================
 *
 * Histogram dengan normal curve overlay adalah fitur khusus untuk analisis distribusi data.
 * Ketika showNormalCurve: true, chart akan menampilkan:
 * - Histogram bars seperti biasa
 * - Kurva normal yang dihitung berdasarkan mean dan standar deviasi data
 * - Statistics box di pojok kanan atas yang menampilkan:
 *   * Mean (rata-rata)
 *   * Std. Dev. (standar deviasi)
 *   * N (jumlah sampel)
 *
 * PARAMETER KHUSUS:
 * - showNormalCurve: boolean - Mengontrol tampilan kurva normal dan statistik
 * - Margin kanan otomatis diperbesar untuk mengakomodasi statistics box
 * - Posisi statistics box dihitung otomatis menggunakan calculateLegendPosition
 *
 * // Cara 1: Menggunakan DataProcessingService + ChartService (Recommended)
 * const rawData = [
 *   [1, 2.1, 3.5, 4.2, 5.1, 6.3, 7.0, 8.1, 9.5, 10.2],
 *   [2, 3.8, 4.1, 5.3, 6.2, 7.1, 8.5, 9.2, 10.1, 11.3],
 *   [3, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1, 10.5, 11.2, 12.1]
 * ];
 *
 * const variables = [
 *   { name: "NN", type: "NUMERIC" },
 *   { name: "N", type: "NUMERIC" },
 *   { name: "GM", type: "NUMERIC" }
 * ];
 *
 * // Step 1: Process data menggunakan DataProcessingService
 * const processedData = DataProcessingService.processDataForChart({
 *   chartType: "Histogram",
 *   rawData: rawData,
 *   variables: variables,
 *   chartVariables: {
 *     y: ["NN"] // Hanya butuh 1 variabel di Y-axis
 *   }
 * });
 *
 * // Step 2: Buat chart JSON menggunakan ChartService
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "Histogram",
 *   chartData: processedData.data,
 *   chartVariables: {
 *     y: ["NN"]
 *   },
 *   chartMetadata: {
 *     title: "Histogram of NN",
 *     subtitle: "With Normal Curve Overlay",
 *     description: "Histogram showing distribution with normal curve and statistics"
 *   },
 *   chartConfig: {
 *     width: 800,
 *     height: 600,
 *     showNormalCurve: true, // ✅ Tampilkan kurva normal dengan statistik
 *     axisLabels: {
 *       x: "NN Values",
 *       y: "Frequency"
 *     }
 *   }
 * });
 *
 * // Cara 2: Quick method dengan normal curve
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "Histogram",
 *   chartData: [
 *     { category: "0-2", value: 6 },
 *     { category: "2-4", value: 4 },
 *     { category: "4-6", value: 3 },
 *     { category: "6-8", value: 3 },
 *     { category: "8-10", value: 2 },
 *     { category: "10-12", value: 2 }
 *   ],
 *   chartConfig: {
 *     showNormalCurve: true // ✅ Tampilkan kurva normal
 *   }
 * });
 *
 * // Cara 3: Histogram tanpa normal curve (default)
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "Histogram",
 *   chartData: processedData.data,
 *   chartConfig: {
 *     showNormalCurve: false, // ❌ Tidak tampilkan kurva normal (default)
 *     // atau tidak perlu menulis showNormalCurve sama sekali
 *   }
 * });
 *
 * // Cara 4: Histogram dengan kustomisasi lengkap
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "Histogram",
 *   chartData: processedData.data,
 *   chartMetadata: {
 *     title: "Distribution Analysis",
 *     subtitle: "Data Distribution with Normal Curve",
 *     titleFontSize: 18,
 *     subtitleFontSize: 14
 *   },
 *   chartConfig: {
 *     width: 900,
 *     height: 700,
 *     showNormalCurve: true, // ✅ Normal curve + statistics box
 *     chartColor: ["#3b82f6"], // Warna histogram bars
 *     axisLabels: {
 *       x: "Data Values",
 *       y: "Frequency Count"
 *     },
 *     axisScaleOptions: {
 *       x: {
 *         min: "0",
 *         max: "15",
 *         majorIncrement: "2"
 *       },
 *       y: {
 *         min: "0",
 *         max: "10",
 *         majorIncrement: "1"
 *       }
 *     }
 *   }
 * });
 *
 * CATATAN KHUSUS HISTOGRAM:
 * =========================
 * 1. showNormalCurve hanya berlaku untuk chartType: "Histogram"
 * 2. Ketika showNormalCurve: true, margin kanan otomatis diperbesar minimal 140px
 * 3. Statistics box berukuran 120px x 70px dengan posisi otomatis
 * 4. Kurva normal dihitung menggunakan mean dan standar deviasi dari data asli
 * 5. Normal curve menggunakan stroke hitam dengan ketebalan 2px
 * 6. Statistics box memiliki background putih dengan border hitam
 * 7. Text statistik menggunakan font-size 12px dengan font-weight bold
 *
 * PERBANDINGAN HISTOGRAM BIASA vs HISTOGRAM DENGAN NORMAL CURVE:
 * =============================================================
 *
 * HISTOGRAM BIASA (showNormalCurve: false atau tidak ada):
 * - ✅ Hanya menampilkan histogram bars
 * - ✅ Margin kanan standar (10-40px)
 * - ✅ Tidak ada statistics box
 * - ✅ Lebih sederhana dan cepat
 * - ✅ Cocok untuk visualisasi distribusi dasar
 *
 * HISTOGRAM DENGAN NORMAL CURVE (showNormalCurve: true):
 * - ✅ Histogram bars + kurva normal overlay
 * - ✅ Statistics box di pojok kanan atas
 * - ✅ Margin kanan diperbesar (minimal 140px)
 * - ✅ Informasi statistik: Mean, Std Dev, N
 * - ✅ Cocok untuk analisis normality dan distribusi
 * - ✅ Posisi statistics box dihitung otomatis
 *
 * CONTOH PENGGUNAAN PRAKTIS:
 * ==========================
 *
 * // Analisis distribusi data
 * const distributionAnalysis = ChartService.createChartJSON({
 *   chartType: "Histogram",
 *   chartData: studentScores,
 *   chartConfig: {
 *     showNormalCurve: true, // ✅ Analisis normality
 *     axisLabels: {
 *       x: "Test Scores",
 *       y: "Number of Students"
 *     }
 *   }
 * });
 *
 * // Visualisasi sederhana
 * const simpleHistogram = ChartService.createChartJSON({
 *   chartType: "Histogram",
 *   chartData: studentScores,
 *   chartConfig: {
 *     showNormalCurve: false, // ❌ Visualisasi dasar
 *     axisLabels: {
 *       x: "Test Scores",
 *       y: "Frequency"
 *     }
 *   }
 * });
 *
 * ============================================================================
 *
 * 2. P-P PLOT
 * ===========
 *
 * // Cara 1: Menggunakan DataProcessingService + ChartService (Recommended)
 * const rawData = [
 *   [1, 2.1, 3.5, 4.2, 5.1, 6.3, 7.0, 8.1, 9.5, 10.2],
 *   [2, 3.8, 4.1, 5.3, 6.2, 7.1, 8.5, 9.2, 10.1, 11.3],
 *   [3, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1, 10.5, 11.2, 12.1]
 * ];
 *
 * const variables = [
 *   { name: "NN", type: "NUMERIC" },
 *   { name: "N", type: "NUMERIC" },
 *   { name: "GM", type: "NUMERIC" }
 * ];
 *
 * // Step 1: Process data menggunakan DataProcessingService
 * const processedData = DataProcessingService.processDataForChart({
 *   chartType: "P-P Plot",
 *   rawData: rawData,
 *   variables: variables,
 *   chartVariables: {
 *     y: ["NN"] // Hanya butuh 1 variabel di Y-axis
 *   }
 * });
 *
 * // Step 2: Buat chart JSON menggunakan ChartService
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "P-P Plot",
 *   chartData: processedData.data,
 *   chartVariables: {
 *     y: ["NN"]
 *   },
 *   chartMetadata: {
 *     title: "P-P Plot of NN",
 *     subtitle: "Probability-Probability Plot",
 *     description: "P-P plot showing observed vs expected cumulative probabilities"
 *   },
 *   chartConfig: {
 *     width: 800,
 *     height: 600,
 *     axisLabels: {
 *       x: "Observed Cum Prop",
 *       y: "Expected Cum Prop"
 *     }
 *   }
 * });
 *
 * // Cara 2: Quick method (jika data sudah dalam format yang benar)
 * const chartJSON = ChartService.quickChart(
 *   [
 *     { x: 0.1, y: 0.12 },
 *     { x: 0.3, y: 0.28 },
 *     { x: 0.5, y: 0.52 },
 *     { x: 0.7, y: 0.68 },
 *     { x: 0.9, y: 0.91 }
 *   ],
 *   "P-P Plot"
 * );
 *
 * ============================================================================
 *
 * 3. SCATTER PLOT WITH MULTIPLE FIT LINE
 * =======================================
 *
 * // Cara 1: Menggunakan DataProcessingService + ChartService (Recommended)
 * const rawData = [
 *   [1, 2.1, 3.5, 4.2, 5.1, 6.3, 7.0, 8.1, 9.5, 10.2],
 *   [2, 3.8, 4.1, 5.3, 6.2, 7.1, 8.5, 9.2, 10.1, 11.3],
 *   [3, 4.5, 5.2, 6.1, 7.3, 8.2, 9.1, 10.5, 11.2, 12.1]
 * ];
 *
 * const variables = [
 *   { name: "NN", type: "NUMERIC" },
 *   { name: "N", type: "NUMERIC" },
 *   { name: "GM", type: "NUMERIC" }
 * ];
 *
 * // Step 1: Process data menggunakan DataProcessingService
 * const processedData = DataProcessingService.processDataForChart({
 *   chartType: "Scatter Plot With Multiple Fit Line",
 *   rawData: rawData,
 *   variables: variables,
 *   chartVariables: {
 *     x: ["NN"], // X-axis variable
 *     y: ["N"]   // Y-axis variable
 *   }
 * });
 *
 * // Step 2: Buat fit functions manual
 * const fitFunctions = [
 *   {
 *     fn: "x => parameters.a + parameters.b * x",
 *     equation: "Linear",
 *     color: "#ff6b6b",
 *     parameters: { a: 1.5, b: 2.3 }
 *   },
 *   {
 *     fn: "x => parameters.a + parameters.b * Math.log(x)",
 *     equation: "Logarithmic",
 *     color: "#6a4c93",
 *     parameters: { a: 0.8, b: 1.2 }
 *   },
 *   {
 *     fn: "x => parameters.a * Math.exp(parameters.b * x)",
 *     equation: "Exponential",
 *     color: "#4ecdc4",
 *     parameters: { a: 1.2, b: 0.5 }
 *   }
 * ];
 *
 * // Step 3: Buat chart JSON menggunakan ChartService
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "Scatter Plot With Multiple Fit Line",
 *   chartData: processedData.data,
 *   chartVariables: {
 *     x: ["NN"],
 *     y: ["N"]
 *   },
 *   chartMetadata: {
 *     title: "Scatter Plot: NN vs N",
 *     subtitle: "With Multiple Fit Lines",
 *     description: "Scatter plot showing relationship between NN and N with various fit lines"
 *   },
 *   chartConfig: {
 *     width: 800,
 *     height: 600,
 *     fitFunctions: fitFunctions, // Fit functions manual
 *     axisLabels: {
 *       x: "NN Values",
 *       y: "N Values"
 *     }
 *   }
 * });
 *
 * // Cara 2: Dengan fit functions kustom
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "Scatter Plot With Multiple Fit Line",
 *   chartData: processedData.data,
 *   chartVariables: {
 *     x: ["NN"],
 *     y: ["N"]
 *   },
 *   chartConfig: {
 *     fitFunctions: [
 *       {
 *         fn: "x => parameters.a + parameters.b * x",
 *         equation: "Linear",
 *         color: "#ff6b6b",
 *         parameters: { a: 1.5, b: 2.3 }
 *       },
 *       {
 *         fn: "x => parameters.a * Math.exp(parameters.b * x)",
 *         equation: "Exponential",
 *         color: "#4ecdc4",
 *         parameters: { a: 1.2, b: 0.5 }
 *       }
 *     ]
 *   }
 * });
 *
 * // Cara 3: Quick method dengan fit functions manual
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "Scatter Plot With Multiple Fit Line",
 *   chartData: [
 *     { x: 1, y: 2.1 },
 *     { x: 2, y: 3.8 },
 *     { x: 3, y: 7.2 },
 *     { x: 4, y: 13.5 },
 *     { x: 5, y: 26.0 }
 *   ],
 *   chartMetadata: {
 *     title: "My Scatter Plot",
 *     subtitle: "With Multiple Fit Lines"
 *   },
 *   chartConfig: {
 *     fitFunctions: [
 *       {
 *         fn: "x => parameters.a + parameters.b * x",
 *         equation: "Linear",
 *         color: "#ff6b6b",
 *         parameters: { a: 1.5, b: 2.3 }
 *       },
 *       {
 *         fn: "x => parameters.a * Math.exp(parameters.b * x)",
 *         equation: "Exponential",
 *         color: "#4ecdc4",
 *         parameters: { a: 1.2, b: 0.5 }
 *       }
 *     ]
 *   }
 * });
 *
 * ============================================================================
 *
 * PARAMETER WAJIB vs OPTIONAL:
 * ============================
 *
 * ChartService.createChartJSON() hanya memerlukan 2 parameter wajib:
 *
 * ✅ WAJIB (Required):
 * - chartType: string - Jenis chart yang akan dibuat
 * - chartData: any[] - Data yang sudah diproses
 *
 * 📝 OPTIONAL (Semua parameter lainnya):
 * - chartVariables: Object - Mapping variabel ke axis
 * - chartMetadata: Object - Title, subtitle, description, dll
 * - chartConfig: Object - Width, height, colors, axis labels, dll
 *
 * Contoh Minimal:
 * ```typescript
 * const chartJSON = ChartService.createChartJSON({
 *   chartType: "Q-Q Plot",     // ✅ WAJIB
 *   chartData: processedData.data    // ✅ WAJIB
 * });
 * ```
 *
 * Default Values (jika tidak diberikan):
 * - width: 800
 * - height: 600
 * - useAxis: true
 * - useLegend: true
 * - titleFontSize: 16
 * - subtitleFontSize: 12
 * - showNormalCurve: false (untuk Histogram) - Tidak menampilkan kurva normal
 *
 * ============================================================================
 *
 * CATATAN PENTING:
 * ================
 *
 * 1. DataProcessingService.processDataForChart() mengubah raw data menjadi format yang sesuai
 * 2. ChartService.createChartJSON() membuat JSON yang siap untuk rendering
 * 3. Untuk Q-Q Plot dan P-P Plot, hanya butuh 1 variabel di Y-axis (side)
 * 4. Untuk Scatter Plot With Multiple Fit Line, butuh 2 variabel (X dan Y)
 * 5. Fit functions harus dideklarasikan manual dengan format string dan parameters
 * 6. Fit functions disimpan sebagai string untuk kompatibilitas JSON
 * 7. showNormalCurve hanya berlaku untuk chart type "Histogram"
 * 8. Ketika showNormalCurve: true, margin kanan otomatis diperbesar untuk statistics box
 *
 * FORMAT DATA YANG DIHARAPKAN:
 * ============================
 *
 * Q-Q Plot & P-P Plot:
 * - Input: rawData[][] + variables[] + chartVariables.y[]
 * - Output: [{ x: number, y: number }]
 *
 * Scatter Plot With Multiple Fit Line:
 * - Input: rawData[][] + variables[] + chartVariables.x[] + chartVariables.y[]
 * - Output: [{ x: number, y: number }]
 * - Fit Functions: [{ fn: string, equation: string, color: string, parameters: object }] (manual declaration)
 *
 * Histogram:
 * - Input: rawData[][] + variables[] + chartVariables.y[]
 * - Output: [{ category: string, value: number }]
 * - showNormalCurve: boolean - Menampilkan kurva normal overlay dengan statistik
 *   * true: Tampilkan kurva normal + statistics box (Mean, Std Dev, N)
 *   * false: Histogram biasa tanpa kurva normal (default)
 *
 * ============================================================================
 */

// Default chart configurations
const DEFAULT_CONFIG = {
  width: 800,
  height: 600,
  useaxis: true,
  //   chartColors: [
  //     "#1f77b4",
  //     "#ff7f0e",
  //     "#2ca02c",
  //     "#d62728",
  //     "#9467bd",
  //     "#8c564b",
  //     "#e377c2",
  //     "#7f7f7f",
  //     "#bcbd22",
  //     "#17becf",
  //   ],
  titleOptions: {
    titleColor: "hsl(var(--foreground))",
    subtitleColor: "hsl(var(--muted-foreground))",
    titleFontSize: 16,
    subtitleFontSize: 12,
  },
  axisOptions: {
    x: {
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    },
    y: {
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    },
    y1: {
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    },
    y2: {
      min: "",
      max: "",
      majorIncrement: "",
      origin: "",
    },
  },
};

// Helper function to detect dual axis charts
function isDualAxisChart(chartType: string): boolean {
  const dualAxisCharts = [
    "Vertical Bar & Line Chart",
    "Dual Axes Scatter Plot",
  ];
  return dualAxisCharts.includes(chartType);
}

/**
 * Generate axisInfo using DataProcessingService logic
 * Now uses smart variable name mapping instead of generic fallbacks
 * @param chartType - Type of chart to determine axis structure
 * @param chartVariables - Variables mapping from user selection
 * @param customAxisInfo - Custom axis info override (optional)
 * @returns Generated axis info with actual variable names
 */
function generateAxisInfo(
  chartType: string,
  chartVariables: any,
  customAxisInfo?: any
): Record<string, string> {
  // If custom axisInfo provided, use it directly
  if (customAxisInfo) return customAxisInfo;

  // Use DataProcessingService for smart variable name mapping
  // This gives us actual variable names instead of generic "Category", "Value"
  return DataProcessingService.generateAxisInfo(chartType, chartVariables);
}

// Function untuk generate chart colors berdasarkan chartType
/**
 * Generate final axis labels based on chart type (single vs dual axis)
 * @param chartType - Type of chart to determine axis structure
 * @param axisLabels - Raw axis labels input from user
 * @returns Formatted axis labels with appropriate structure for chart type
 */
function generateFinalAxisLabels(
  chartType: string,
  axisLabels: {
    x?: string;
    y?: string;
    y1?: string;
    y2?: string;
    z?: string;
  } = {}
): { x: string; y?: string; y1?: string; y2?: string; z?: string } {
  const isDualAxis = isDualAxisChart(chartType);
  const is3DChart = chartType.includes("3D");

  if (chartType === "Q-Q Plot") {
    return {
      x: axisLabels.x || "Theoretical Quantiles",
      y: axisLabels.y || "Sample Quantiles",
    };
  }

  if (chartType === "P-P Plot") {
    return {
      x: axisLabels.x || "Observed Cum Prop",
      y: axisLabels.y || "Expected Cum Prop",
    };
  }

  if (isDualAxis) {
    // For dual axis charts, use y1 and y2
    return {
      x: axisLabels.x || "X-axis",
      y1: axisLabels.y1 || axisLabels.y || "Y1-axis",
      y2: axisLabels.y2 || "Y2-axis",
    };
  } else if (is3DChart) {
    // For 3D charts, use x, y, z
    return {
      x: axisLabels.x || "X-axis",
      y: axisLabels.y || "Y-axis",
      z: axisLabels.z || "Z-axis",
    };
  } else {
    // For single axis charts, use y
    return {
      x: axisLabels.x || "X-axis",
      y: axisLabels.y || "Y-axis",
    };
  }
}

function generateChartColors(
  chartType: string,
  chartVariables: any,
  chartData?: any[],
  customColors?: string[]
): string[] {
  if (customColors) return customColors;

  // Combine multiple categorical schemes for more color options
  const getExtendedColors = () => {
    const colors = [];
    // Add Category10
    colors.push(...d3ColorScales.categorical[0].colors);
    // Add Observable10
    colors.push(...d3ColorScales.categorical[1].colors);
    // Add Accent
    colors.push(...d3ColorScales.categorical[2].colors);
    // Add Dark2
    colors.push(...d3ColorScales.categorical[3].colors);
    // Add Paired
    colors.push(...d3ColorScales.categorical[4].colors);
    // Add Pastel1
    colors.push(...d3ColorScales.categorical[5].colors);
    // Add Pastel2
    colors.push(...d3ColorScales.categorical[6].colors);
    // Add Set1
    colors.push(...d3ColorScales.categorical[7].colors);
    // Add Set2
    colors.push(...d3ColorScales.categorical[8].colors);
    // Add Set3
    colors.push(...d3ColorScales.categorical[9].colors);
    // Add Tableau10
    colors.push(...d3ColorScales.categorical[10].colors);

    return colors;
  };

  const defaultColors = getExtendedColors();

  switch (chartType) {
    // Single color charts
    case "Vertical Bar Chart":
    case "Horizontal Bar Chart":
    case "Line Chart":
    case "Area Chart":
    case "Scatter Plot":
    case "Scatter Plot With Fit Line":
    case "Scatter Plot With Multiple Fit Line":
    case "Histogram":
    case "Boxplot":
    case "Error Bar Chart":
    case "Dot Plot":
    case "Frequency Polygon":
    case "Summary Point Plot":
    case "Violin Plot":
    case "Density Chart":
    case "Stem And Leaf Plot":
    case "Q-Q Plot":
    case "P-P Plot":
      return [defaultColors[0]]; // Single color

    // Multi-color charts (berdasarkan jumlah subcategory)
    case "Vertical Stacked Bar Chart":
    case "Horizontal Stacked Bar Chart":
    case "Clustered Bar Chart":
    case "Multiple Line Chart":
    case "Stacked Area Chart":
      const subcategoryCount = chartVariables.y?.length || 1;
      return defaultColors.slice(0, subcategoryCount);

    // Special cases
    case "Population Pyramid":
      return ["#4682B4", "#e74c3c"];

    case "3D Bar Chart":
    case "3D Bar Chart2":
    case "3D Scatter Plot":
    case "Clustered 3D Bar Chart":
    case "Stacked 3D Bar Chart":
      return [defaultColors[0]]; // Single color untuk 3D

    case "Grouped Scatter Plot":
    case "Drop Line Chart":
    case "Pie Chart":
      if (Array.isArray(chartData)) {
        // Ambil semua nilai unik dari field 'category'
        const uniqueCategories = Array.from(
          new Set(chartData.map((d: any) => d.category))
        );
        const filteredCategories = uniqueCategories.filter(
          (v) => v !== undefined && v !== null && v !== ""
        );
        return defaultColors.slice(0, filteredCategories.length);
      }
      return defaultColors.slice(0, 1);

    case "Grouped 3D Scatter Plot":
      const groupCount3D = chartVariables.groupBy?.length || 1;
      return defaultColors.slice(0, groupCount3D);

    case "Grouped 3D Scatter Plot (ECharts)":
      if (Array.isArray(chartData)) {
        // Count unique groups in the data
        const uniqueGroups = Array.from(
          new Set(chartData.map((d: any) => d.group))
        );
        const filteredGroups = uniqueGroups.filter(
          (v) => v !== undefined && v !== null && v !== ""
        );
        return defaultColors.slice(0, filteredGroups.length);
      }
      const echartGroupCount = chartVariables.groupBy?.length || 1;
      return defaultColors.slice(0, echartGroupCount);

    // Range charts - single color
    case "Simple Range Bar":
    case "Clustered Range Bar":
    case "High-Low-Close Chart":
    case "Difference Area":
      return [defaultColors[0]];

    // Dual axes - bisa 2 colors
    case "Vertical Bar & Line Chart":
    case "Dual Axes Scatter Plot":
      return [defaultColors[0], defaultColors[1]];

    // Matrix - multiple colors
    case "Scatter Plot Matrix":
      const variableCount = chartVariables.x?.length || 1;
      return defaultColors.slice(0, variableCount);

    // Clustered charts - berdasarkan jumlah subcategory
    case "Clustered Error Bar Chart":
    case "Clustered Boxplot":
      const clusteredCount = chartVariables.groupBy?.length || 1;
      return defaultColors.slice(0, clusteredCount);

    // Stacked histogram - berdasarkan jumlah group
    case "Stacked Histogram":
      const stackedHistCount = chartVariables.groupBy?.length || 1;
      return defaultColors.slice(0, stackedHistCount);

    // 1D Boxplot - single color
    case "1-D Boxplot":
      return [defaultColors[0]];

    default:
      return [defaultColors[0]];
  }
}

// Interface untuk input data - CLEAN GROUPED STRUCTURE
interface ChartInput {
  // Required
  chartType: string;
  chartData: any[];

  // Optional - grouped like output JSON
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

  chartMetadata?: {
    title?: string;
    subtitle?: string;
    description?: string;
    notes?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
    axisInfo?: any; // Flexible axisInfo
  };

  chartConfig?: {
    width?: number;
    height?: number;
    chartColor?: string[];
    useAxis?: boolean;
    useLegend?: boolean;
    statistic?: "mean" | "median" | "mode" | "min" | "max"; // For Summary Point Plot
    showNormalCurve?: boolean; // For Histogram - show normal curve overlay
    fitFunctions?: Array<{
      fn: string; // String representation of function: "x => a + b * x"
      equation?: string;
      color?: string;
      parameters?: Record<string, number>; // Store coefficients: {a: 2, b: 3}
    }>; // For Scatter Plot With Multiple Fit Line
    axisLabels?: {
      x?: string;
      y?: string;
      y1?: string; // For dual axis charts
      y2?: string; // For dual axis charts
      z?: string; // For 3D charts
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
      z?: {
        min?: string;
        max?: string;
        majorIncrement?: string;
        origin?: string;
      };
    };
  };
}

// Interface untuk chart JSON output (sesuai format sistem yang ada)
export interface ChartJSON {
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
      statistic?: "mean" | "median" | "mode" | "min" | "max"; // For Summary Point Plot
      showNormalCurve?: boolean; // For Histogram - show normal curve overlay
      fitFunctions?: Array<{
        fn: string; // String representation of function: "x => a + b * x"
        equation?: string;
        color?: string;
        parameters?: Record<string, number>; // Store coefficients: {a: 2, b: 3}
      }>; // For Scatter Plot With Multiple Fit Line
      axisLabels: {
        x: string;
        y?: string;
        y1?: string;
        y2?: string;
        z?: string;
      };
      axisScaleOptions?: any;
    };
  }>;
}

export class ChartService {
  /**
   * Helper function untuk membuat fit functions yang umum digunakan
   */
  static createFitFunctions(data: { x: number; y: number }[]) {
    // Linear fit: y = mx + b
    const getLinearFit = (data: { x: number; y: number }[]) => {
      const n = data.length;
      const sumX = data.reduce((sum, d) => sum + d.x, 0);
      const sumY = data.reduce((sum, d) => sum + d.y, 0);
      const sumXY = data.reduce((sum, d) => sum + d.x * d.y, 0);
      const sumX2 = data.reduce((sum, d) => sum + d.x * d.x, 0);

      const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const b = (sumY - m * sumX) / n;

      return { a: b, b: m }; // y = b * x + a
    };

    // Exponential fit: y = ae^(bx)
    const getExponentialFit = (data: { x: number; y: number }[]) => {
      const filtered = data.filter((d) => d.y > 0);
      const n = filtered.length;
      const sumX = filtered.reduce((sum, d) => sum + d.x, 0);
      const sumLogY = filtered.reduce((sum, d) => sum + Math.log(d.y), 0);
      const sumXLogY = filtered.reduce(
        (sum, d) => sum + d.x * Math.log(d.y),
        0
      );
      const sumX2 = filtered.reduce((sum, d) => sum + d.x * d.x, 0);

      const b = (n * sumXLogY - sumX * sumLogY) / (n * sumX2 - sumX * sumX);
      const logA = (sumLogY - b * sumX) / n;
      const a = Math.exp(logA);

      return { a, b }; // y = a * e^(b * x)
    };

    // Logarithmic fit: y = a + b * ln(x)
    const getLogarithmicFit = (data: { x: number; y: number }[]) => {
      const filtered = data.filter((d) => d.x > 0);
      const n = filtered.length;
      const sumLogX = filtered.reduce((sum, d) => sum + Math.log(d.x), 0);
      const sumY = filtered.reduce((sum, d) => sum + d.y, 0);
      const sumLogX2 = filtered.reduce((sum, d) => sum + Math.log(d.x) ** 2, 0);
      const sumLogXY = filtered.reduce(
        (sum, d) => sum + Math.log(d.x) * d.y,
        0
      );

      const b =
        (n * sumLogXY - sumLogX * sumY) / (n * sumLogX2 - sumLogX * sumLogX);
      const a = (sumY - b * sumLogX) / n;

      return { a, b }; // y = a + b * ln(x)
    };

    // Power fit: y = ax^b
    const getPowerFit = (data: { x: number; y: number }[]) => {
      const filtered = data.filter((d) => d.x > 0 && d.y > 0);
      const n = filtered.length;

      const sumLogX = filtered.reduce((sum, d) => sum + Math.log(d.x), 0);
      const sumLogY = filtered.reduce((sum, d) => sum + Math.log(d.y), 0);
      const sumLogX2 = filtered.reduce((sum, d) => sum + Math.log(d.x) ** 2, 0);
      const sumLogXLogY = filtered.reduce(
        (sum, d) => sum + Math.log(d.x) * Math.log(d.y),
        0
      );

      const b =
        (n * sumLogXLogY - sumLogX * sumLogY) /
        (n * sumLogX2 - sumLogX * sumLogX);
      const logA = (sumLogY - b * sumLogX) / n;
      const a = Math.exp(logA);

      return { a, b }; // y = a * x^b
    };

    // Compound fit: y = ab^x
    const getCompoundFit = (data: { x: number; y: number }[]) => {
      const filtered = data.filter((d) => d.y > 0);
      const n = filtered.length;
      const sumX = filtered.reduce((sum, d) => sum + d.x, 0);
      const sumLogY = filtered.reduce((sum, d) => sum + Math.log(d.y), 0);
      const sumXLogY = filtered.reduce(
        (sum, d) => sum + d.x * Math.log(d.y),
        0
      );
      const sumX2 = filtered.reduce((sum, d) => sum + d.x * d.x, 0);

      const B = (n * sumXLogY - sumX * sumLogY) / (n * sumX2 - sumX * sumX);
      const logA = (sumLogY - B * sumX) / n;
      const A = Math.exp(logA);

      return { a: A, b: Math.exp(B) }; // y = a * b^x
    };

    const linear = getLinearFit(data);
    const exponential = getExponentialFit(data);
    const logarithmic = getLogarithmicFit(data);
    const power = getPowerFit(data);
    const compound = getCompoundFit(data);

    return [
      {
        fn: "x => parameters.a + parameters.b * x",
        equation: "Linear",
        color: "#ff6b6b",
        parameters: { a: linear.a, b: linear.b },
      },
      {
        fn: "x => parameters.a + parameters.b * Math.log(x)",
        equation: "Log",
        color: "#6a4c93",
        parameters: { a: logarithmic.a, b: logarithmic.b },
      },
      {
        fn: "x => parameters.a * Math.pow(parameters.b, x)",
        equation: "Compound",
        color: "#f94144",
        parameters: { a: compound.a, b: compound.b },
      },
      {
        fn: "x => parameters.a * Math.pow(x, parameters.b)",
        equation: "Power",
        color: "#577590",
        parameters: { a: power.a, b: power.b },
      },
      {
        fn: "x => parameters.a * Math.exp(parameters.b * x)",
        equation: "Exp",
        color: "#90be6d",
        parameters: { a: exponential.a, b: exponential.b },
      },
    ];
  }

  /**
   * Membuat chart JSON dengan struktur parameter yang clean dan grouped
   * Parameter mengikuti struktur output: chartType, chartData, chartMetadata, chartConfig
   */
  static createChartJSON(input: ChartInput): ChartJSON {
    const {
      chartType,
      chartData,
      chartVariables = {},
      chartMetadata = {},
      chartConfig = {},
    } = input;

    // ⚠️ Validate data - no fallback, throw error if invalid
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
      throw new Error(
        "chartData is required and must be a non-empty array. Check the document for the correct format."
      );
    }

    // Destructure with defaults - Metadata
    const {
      title,
      subtitle,
      description,
      notes,
      titleFontSize = DEFAULT_CONFIG.titleOptions.titleFontSize,
      subtitleFontSize = DEFAULT_CONFIG.titleOptions.subtitleFontSize,
      axisInfo,
    } = chartMetadata;

    // Destructure with defaults - Config
    const {
      width = DEFAULT_CONFIG.width,
      height = DEFAULT_CONFIG.height,
      chartColor,
      useAxis = DEFAULT_CONFIG.useaxis,
      useLegend = true,
      statistic,
      showNormalCurve,
      fitFunctions,
      axisLabels = {},
      axisScaleOptions = DEFAULT_CONFIG.axisOptions,
    } = chartConfig;

    // Generate labels otomatis dengan fallback
    const autoTitle = title || `${chartType}`;
    const autoSubtitle = subtitle;
    const autoDescription = description || ``;

    // Generate axis labels based on chart type
    const finalAxisLabels = generateFinalAxisLabels(chartType, axisLabels);

    // Generate dynamic axisInfo berdasarkan chartType
    const finalAxisInfo = generateAxisInfo(chartType, chartVariables, axisInfo);

    // Generate dynamic chart colors berdasarkan chartType
    const finalChartColors = generateChartColors(
      chartType,
      chartVariables,
      chartData,
      chartColor
    );

    // Hanya masukkan fitFunctions jika chart type adalah "Scatter Plot With Multiple Fit Line"
    const baseChartConfig: any = {
      width,
      height,
      chartColor: finalChartColors,
      useAxis: useAxis,
      useLegend: useLegend,
      statistic: statistic,
      axisLabels: finalAxisLabels,
      axisScaleOptions: axisScaleOptions,
    };

    // Hanya tambahkan fitFunctions untuk chart yang membutuhkannya
    if (chartType === "Scatter Plot With Multiple Fit Line" && fitFunctions) {
      baseChartConfig.fitFunctions = fitFunctions;
    }

    // Hanya tambahkan showNormalCurve untuk chart type Histogram
    if (chartType === "Histogram" && showNormalCurve !== undefined) {
      baseChartConfig.showNormalCurve = showNormalCurve;
    }

    const chartJSON: ChartJSON = {
      charts: [
        {
          chartType: chartType,
          chartMetadata: {
            axisInfo: finalAxisInfo,
            description: autoDescription,
            notes: notes,
            title: autoTitle,
            subtitle: autoSubtitle,
            titleFontSize: titleFontSize,
            subtitleFontSize: subtitleFontSize,
          },
          chartData: chartData,
          chartConfig: baseChartConfig,
        },
      ],
    };

    return chartJSON;
  }

  /**
   * Utility: Membuat chart simple dengan data yang sudah benar format
   * ASSUME: data sudah format [{category: "", value: number}]
   */
  static quickChart(
    chartData: any[],
    chartType: string = "Vertical Bar Chart"
  ): ChartJSON {
    return this.createChartJSON({
      chartType,
      chartData,
    });
  }

  /**
   * Utility: Membuat multiple charts sekaligus dari data yang sama
   */
  static createMultipleCharts(
    input: ChartInput,
    chartTypes: string[]
  ): ChartJSON[] {
    return chartTypes.map((chartType) =>
      this.createChartJSON({
        ...input,
        chartType,
      })
    );
  }

  /**
   * Utility: Membuat Scatter Plot With Multiple Fit Line dengan fit functions otomatis
   * @param data - Array of {x: number, y: number} objects
   * @param metadata - Optional metadata for the chart
   * @returns ChartJSON ready for rendering
   */
  static createScatterPlotWithMultipleFitLine(
    data: { x: number; y: number }[],
    metadata?: {
      title?: string;
      subtitle?: string;
      description?: string;
      axisLabels?: {
        x?: string;
        y?: string;
      };
    }
  ): ChartJSON {
    // Generate fit functions automatically
    const fitFunctions = this.createFitFunctions(data);

    return this.createChartJSON({
      chartType: "Scatter Plot With Multiple Fit Line",
      chartData: data,
      chartMetadata: {
        title: metadata?.title || "Scatter Plot With Multiple Fit Lines",
        subtitle: metadata?.subtitle,
        description:
          metadata?.description ||
          "Scatter plot with automatically calculated fit lines",
      },
      chartConfig: {
        fitFunctions: fitFunctions,
        axisLabels: {
          x: metadata?.axisLabels?.x || "X-axis",
          y: metadata?.axisLabels?.y || "Y-axis",
        },
      },
    });
  }
}

// Export default instance
const chartService = new ChartService();
export default chartService;
