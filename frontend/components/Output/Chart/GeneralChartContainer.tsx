import React, { useEffect, useRef, useState, useMemo } from "react";
import { chartUtils } from "@/utils/chartBuilder/chartTypes/chartUtils";
import { Button } from "@/components/ui/button";
import {
  Download,
  Copy,
  Check,
  Image as LucideImage,
  FileType,
  View,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Define type untuk data chart
interface ChartData {
  chartType: string;
  chartData: any[];
  chartConfig: {
    width: number;
    height: number;
    useAxis?: boolean;
    useLegend?: boolean;
    statistic?: "mean" | "median" | "mode" | "min" | "max"; // Add statistic option
    fitFunctions?: Array<{
      fn: string; // String representation of function: "x => parameters.a + parameters.b * x"
      equation?: string;
      color?: string;
      parameters?: Record<string, number>; // Store coefficients: {a: 2, b: 3}
    }>; // For Scatter Plot With Multiple Fit Line
    showNormalCurve?: boolean; // For Histogram - show normal curve overlay
    axisLabels: {
      x: string;
      y: string;
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
    };
    chartColor?: string[];
  };
  chartMetadata: {
    axisInfo: {
      category: string;
      value: string;
    };
    description: string;
    title?: string;
    subtitle?: string;
    titleFontSize?: number;
    subtitleFontSize?: number;
  };
}

interface GeneralChartContainerProps {
  data: string | { charts: ChartData[] }; // Bisa menerima string JSON atau object
}

const GeneralChartContainer: React.FC<GeneralChartContainerProps> = ({
  data,
}) => {
  const [copied, setCopied] = useState<Record<string, Record<string, boolean>>>(
    {}
  );
  const [chartNodes, setChartNodes] = useState<
    {
      id: string;
      chartNode: HTMLElement | SVGElement | null;
      chartType: string;
      width: number;
      height: number;
    }[]
  >([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewChart, setPreviewChart] = useState<
    HTMLElement | SVGElement | null
  >(null);

  const [chartDimensions, setChartDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 800, // Default width
    height: 600, // Default height
  });

  const [actionsHidden, setActionsHidden] = useState<Record<string, boolean>>(
    {}
  );
  const [loadingStates, setLoadingStates] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const actionTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Parse data jika berbentuk string
  const parsedData = useMemo(
    () => {
      try {
        return typeof data === "string" ? JSON.parse(data) : data;
      } catch (error) {
        console.error("Failed to parse chart data:", error);
        return { charts: [] };
      }
    },
    [data]
  );
  console.log("parsedData", parsedData);
  // Helper function to convert string axisScaleOptions to number
  const convertAxisScaleOptions = (options?: {
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
  }) => {
    if (!options) return undefined;

    return {
      x: options.x
        ? {
            min: options.x.min ? parseFloat(options.x.min) : undefined,
            max: options.x.max ? parseFloat(options.x.max) : undefined,
            majorIncrement: options.x.majorIncrement
              ? parseFloat(options.x.majorIncrement)
              : undefined,
          }
        : undefined,
      y: options.y
        ? {
            min: options.y.min ? parseFloat(options.y.min) : undefined,
            max: options.y.max ? parseFloat(options.y.max) : undefined,
            majorIncrement: options.y.majorIncrement
              ? parseFloat(options.y.majorIncrement)
              : undefined,
          }
        : undefined,
    };
  };

  // Fallback function for when canvas is not available
  const fallbackToSvgExport = (
    svgElement: SVGElement,
    format: "svg" | "png"
  ) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);

    if (format === "svg") {
      return new Blob([svgData], { type: "image/svg+xml" });
    } else {
      // For PNG fallback, we'll create a simple data URL
      // This is not ideal but works as fallback
      const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
      return svgBlob;
    }
  };
  const convertSvgToPng = async (svgElement: SVGElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(fallbackToSvgExport(svgElement, "png"));
          return;
        }

        // ✅ Fix: use getBBox() instead of getBoundingClientRect()
        const bbox = (svgElement as SVGGraphicsElement).getBBox();
        const width = bbox.width + bbox.x + 20;
        const height = bbox.height + bbox.y + 20;

        canvas.width = width * 2;
        canvas.height = height * 2;
        ctx.scale(2, 2);

        // ✅ Clone with correct dimension
        const clonedSvg = svgElement.cloneNode(true) as SVGElement;
        clonedSvg.setAttribute("width", `${width}`);
        clonedSvg.setAttribute("height", `${height}`);
        clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

        // Convert to data URL
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(url);
                if (blob) {
                  resolve(blob);
                } else {
                  resolve(fallbackToSvgExport(svgElement, "png"));
                }
              },
              "image/png",
              1.0
            );
          } catch (error) {
            URL.revokeObjectURL(url);
            resolve(fallbackToSvgExport(svgElement, "png"));
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(fallbackToSvgExport(svgElement, "png"));
        };

        img.src = url;
      } catch (error) {
        resolve(fallbackToSvgExport(svgElement, "png"));
      }
    });
  };

  // Alternative PNG export using data URL (no canvas required)
  const exportPngViaDataUrl = (svgElement: SVGElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Create SVG data URL
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(
          unescape(encodeURIComponent(svgData))
        )}`;

        // Create image element
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            // Create canvas (this is minimal canvas usage)
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Canvas not available"));
              return;
            }

            // Set canvas size
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image
            ctx.drawImage(img, 0, 0);

            // Convert to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("PNG conversion failed"));
                }
              },
              "image/png",
              1.0
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error("Image loading failed"));
        img.src = svgDataUrl;
      } catch (error) {
        reject(error);
      }
    });
  };

  // Pure SVG export without canvas - always works
  const exportSvgOnly = (svgElement: SVGElement): Blob => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    return new Blob([svgData], { type: "image/svg+xml" });
  };

  // Special handling for 3D charts (WebGL/Canvas)
  const is3DChart = (chartType: string): boolean => {
    return chartType.includes("3D") || chartType.includes("3d");
  };

  // Enhanced copy function with 3D chart support
  const handleCopyChart = async (
    chartId: string,
    format: "svg" | "png" = "svg"
  ) => {
    // Set loading state
    setLoadingStates((prev) => ({
      ...prev,
      [chartId]: { ...prev[chartId], [format]: true },
    }));

    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
      setLoadingStates((prev) => ({
        ...prev,
        [chartId]: { ...prev[chartId], [format]: false },
      }));
      return;
    }

    // Check if this is a 3D chart
    const chartType =
      chartNodes.find((node) => node.id === chartId)?.chartType || "";

    if (is3DChart(chartType)) {
      // Special handling for 3D charts
      await handle3DChartCopy(chartElement, chartId, format);
    } else {
      // Regular 2D chart handling
      const svgElement = chartElement.querySelector("svg");
      if (!svgElement) {
        setLoadingStates((prev) => ({
          ...prev,
          [chartId]: { ...prev[chartId], [format]: false },
        }));
        return;
      }

      try {
        if (format === "svg") {
          // SVG copy - always works
          const svgData = new XMLSerializer().serializeToString(svgElement);
          await navigator.clipboard.writeText(svgData);
        } else {
          // PNG copy - try multiple methods
          let success = false;

          // Method 1: Try original canvas method
          try {
            const pngBlob = await convertSvgToPng(svgElement);
            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": pngBlob,
              }),
            ]);
            success = true;
          } catch (err1) {
            console.warn("Method 1 failed, trying method 2:", err1);
          }

          // Method 2: Try data URL method
          if (!success) {
            try {
              const pngBlob = await exportPngViaDataUrl(svgElement);
              await navigator.clipboard.write([
                new ClipboardItem({
                  "image/png": pngBlob,
                }),
              ]);
              success = true;
            } catch (err2) {
              console.warn("Method 2 failed, falling back to SVG:", err2);
            }
          }

          // Method 3: Fallback to SVG
          if (!success) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            await navigator.clipboard.writeText(svgData);
          }
        }

        setCopied((prev) => ({
          ...prev,
          [chartId]: {
            ...prev[chartId],
            [format]: true,
          },
        }));

        setTimeout(() => {
          setCopied((prev) => ({
            ...prev,
            [chartId]: {
              ...prev[chartId],
              [format]: false,
            },
          }));
        }, 2000); // Show success for 2 seconds
      } catch (err) {
        console.warn("Copy failed:", err);
      }
    }

    // Clear loading state
    setLoadingStates((prev) => ({
      ...prev,
      [chartId]: { ...prev[chartId], [format]: false },
    }));
  };

  // Special handling for 3D chart copy
  const handle3DChartCopy = async (
    chartElement: HTMLElement,
    chartId: string,
    format: "svg" | "png"
  ) => {
    try {
      // Find canvas element in 3D chart
      const canvas = chartElement.querySelector("canvas");
      if (!canvas) {
        throw new Error("No canvas found in 3D chart");
      }

      if (format === "png") {
        // PNG: Copy canvas with white background
        const tmpCanvas = document.createElement("canvas");
        const paddingTop = 60;
        const paddingRight = 80;
        const paddingLeft = 40;
        const paddingBottom = 40;
        tmpCanvas.width = canvas.width + paddingLeft + paddingRight;
        tmpCanvas.height = canvas.height + paddingTop + paddingBottom;
        const ctx = tmpCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context not available");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        // Geser chart ke bawah dan ke kanan agar margin seimbang
        ctx.drawImage(canvas, paddingLeft, paddingTop);
        // --- Tambahkan Title, Subtitle, Legend, dan Color Scale (3D Chart Export) ---
        const chartDataObj = parsedData.charts?.find(
          (c: any, idx: any) => chartNodes[idx]?.id === chartId
        ) as any;
        if (chartDataObj) {
          const { chartMetadata, chartConfig, chartData, chartType } =
            chartDataObj;
          // Title & Subtitle: hanya render manual jika chartType TIDAK mengandung 'ECharts'
          if (!chartType?.includes("ECharts")) {
            ctx.save();
            ctx.font = "bold 20px Arial";
            ctx.fillStyle = "#222";
            ctx.textAlign = "center";
            ctx.fillText(chartMetadata?.title || "", tmpCanvas.width / 2, 32);
            ctx.font = "16px Arial";
            ctx.fillStyle = "#555";
            ctx.fillText(
              chartMetadata?.subtitle || "",
              tmpCanvas.width / 2,
              56
            );
            ctx.restore();
          }

          // Color Scale (color bar) jika ada
          const canvases = chartElement.querySelectorAll("canvas");
          let colorBarCanvas = null;
          if (canvases.length > 1) {
            colorBarCanvas = Array.from(canvases).find(
              (c: any) => c !== canvas
            );
          }
          if (colorBarCanvas) {
            ctx.drawImage(
              colorBarCanvas,
              24,
              tmpCanvas.height - colorBarCanvas.height - 24 - paddingBottom
            );
          }
        }
        tmpCanvas.toBlob(async (blob) => {
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({
                "image/png": blob,
              }),
            ]);
            setCopied((prev) => ({
              ...prev,
              [chartId]: {
                ...prev[chartId],
                png: true,
              },
            }));
            setTimeout(() => {
              setCopied((prev) => ({
                ...prev,
                [chartId]: {
                  ...prev[chartId],
                  png: false,
                },
              }));
            }, 2000);
          }
        }, "image/png");
      } else {
        // SVG: Bungkus PNG hasil tmpCanvas ke dalam SVG
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = canvas.width;
        tmpCanvas.height = canvas.height;
        const ctx = tmpCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context not available");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        ctx.drawImage(canvas, 0, 0);
        const dataUrl = tmpCanvas.toDataURL("image/png");
        const svgData = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
            <rect width="100%" height="100%" fill="#fff"/>
            <image href="${dataUrl}" width="100%" height="100%"/>
          </svg>
        `;
        await navigator.clipboard.writeText(svgData);
        setCopied((prev) => ({
          ...prev,
          [chartId]: {
            ...prev[chartId],
            svg: true,
          },
        }));
        setTimeout(() => {
          setCopied((prev) => ({
            ...prev,
            [chartId]: {
              ...prev[chartId],
              svg: false,
            },
          }));
        }, 2000);
      }
    } catch (err) {
      console.warn("3D chart copy failed:", err);
      alert(
        "3D chart export is not supported in this format. Try PNG format instead."
      );
    }
  };

  // Enhanced download function with 3D chart support
  const handleDownloadChart = async (
    chartId: string,
    format: "svg" | "png"
  ) => {
    // Set loading state
    setLoadingStates((prev) => ({
      ...prev,
      [chartId]: { ...prev[chartId], [format]: true },
    }));

    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
      setLoadingStates((prev) => ({
        ...prev,
        [chartId]: { ...prev[chartId], [format]: false },
      }));
      return;
    }

    // Check if this is a 3D chart
    const chartType =
      chartNodes.find((node) => node.id === chartId)?.chartType || "";

    if (is3DChart(chartType)) {
      // Special handling for 3D charts
      await handle3DChartDownload(chartElement, chartId, format);
    } else {
      // Regular 2D chart handling
      const svgElement = chartElement.querySelector("svg");
      if (!svgElement) {
        setLoadingStates((prev) => ({
          ...prev,
          [chartId]: { ...prev[chartId], [format]: false },
        }));
        return;
      }

      try {
        if (format === "svg") {
          // SVG download - always works
          const svgBlob = exportSvgOnly(svgElement);
          const url = URL.createObjectURL(svgBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${chartId}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          // PNG download - try multiple methods
          let success = false;

          // Method 1: Try original canvas method
          try {
            const pngBlob = await convertSvgToPng(svgElement);
            const url = URL.createObjectURL(pngBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${chartId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            success = true;
          } catch (err1) {
            console.warn("Method 1 failed, trying method 2:", err1);
          }

          // Method 2: Try data URL method
          if (!success) {
            try {
              const pngBlob = await exportPngViaDataUrl(svgElement);
              const url = URL.createObjectURL(pngBlob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${chartId}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              success = true;
            } catch (err2) {
              console.warn("Method 2 failed, falling back to SVG:", err2);
            }
          }

          // Method 3: Fallback to SVG download
          if (!success) {
            const svgBlob = exportSvgOnly(svgElement);
            const url = URL.createObjectURL(svgBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${chartId}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        }
      } catch (err) {
        console.warn("Download failed:", err);
      }
    }

    // Clear loading state
    setLoadingStates((prev) => ({
      ...prev,
      [chartId]: { ...prev[chartId], [format]: false },
    }));
  };

  // Special handling for 3D chart download
  const handle3DChartDownload = async (
    chartElement: HTMLElement,
    chartId: string,
    format: "svg" | "png"
  ) => {
    try {
      // Find canvas element in 3D chart
      const canvas = chartElement.querySelector("canvas");
      if (!canvas) {
        throw new Error("No canvas found in 3D chart");
      }

      if (format === "png") {
        // PNG: Download canvas with white background
        const tmpCanvas = document.createElement("canvas");
        const paddingTop = 60;
        const paddingRight = 80;
        const paddingLeft = 40;
        const paddingBottom = 40;
        tmpCanvas.width = canvas.width + paddingLeft + paddingRight;
        tmpCanvas.height = canvas.height + paddingTop + paddingBottom;
        const ctx = tmpCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context not available");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        // Geser chart ke bawah dan ke kanan agar margin seimbang
        ctx.drawImage(canvas, paddingLeft, paddingTop);
        // --- Tambahkan Title, Subtitle, Legend, dan Color Scale (3D Chart Export) ---
        const chartDataObj = parsedData.charts?.find(
          (c: any, idx: number) => chartNodes[idx]?.id === chartId
        ) as any;
        if (chartDataObj) {
          const { chartMetadata, chartConfig, chartData, chartType } =
            chartDataObj;
          // Title & Subtitle: hanya render manual jika chartType TIDAK mengandung 'ECharts'
          if (!chartType?.includes("ECharts")) {
            ctx.save();
            ctx.font = "bold 20px Arial";
            ctx.fillStyle = "#222";
            ctx.textAlign = "center";
            ctx.fillText(chartMetadata?.title || "", tmpCanvas.width / 2, 32);
            ctx.font = "16px Arial";
            ctx.fillStyle = "#555";
            ctx.fillText(
              chartMetadata?.subtitle || "",
              tmpCanvas.width / 2,
              56
            );
            ctx.restore();
          }

          // Color Scale (color bar) jika ada
          const canvases = chartElement.querySelectorAll("canvas");
          let colorBarCanvas = null;
          if (canvases.length > 1) {
            colorBarCanvas = Array.from(canvases).find(
              (c: any) => c !== canvas
            );
          }
          if (colorBarCanvas) {
            ctx.drawImage(
              colorBarCanvas,
              24,
              tmpCanvas.height - colorBarCanvas.height - 24 - paddingBottom
            );
          }
        }
        tmpCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${chartId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        }, "image/png");
      } else {
        // SVG: Bungkus PNG hasil tmpCanvas ke dalam SVG
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = canvas.width;
        tmpCanvas.height = canvas.height;
        const ctx = tmpCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context not available");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        ctx.drawImage(canvas, 0, 0);
        const dataUrl = tmpCanvas.toDataURL("image/png");
        const svgData = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
            <rect width="100%" height="100%" fill="#fff"/>
            <image href="${dataUrl}" width="100%" height="100%"/>
          </svg>
        `;
        const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${chartId}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.warn("3D chart download failed:", err);
      alert("3D chart download failed. Try PNG format instead.");
    }
  };

  useEffect(() => {
    if (parsedData && parsedData.charts && Array.isArray(parsedData.charts)) {
      const nodes = parsedData.charts.map(
        (chartData: ChartData, index: number) => {
          const {
            chartType,
            chartData: chartDataPoints,
            chartConfig,
            chartMetadata,
          } = chartData;
          const width = chartConfig?.width || chartDimensions.width;
          const height = chartConfig?.height || chartDimensions.height;
          const useAxis = chartConfig?.useAxis ?? true;
          let chartNode: HTMLElement | SVGElement | null = null;
          switch (chartType) {
            case "Vertical Bar Chart":
              chartNode = chartUtils.createVerticalBarChart2(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Vertical Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Horizontal Bar Chart":
              chartNode = chartUtils.createHorizontalBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                chartConfig?.chartColor?.[0] || "hsl(var(--primary))",
                0.007,
                {
                  title: chartMetadata?.title || "Horizontal Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions
              );
              break;
            case "Pie Chart":
              chartNode = chartUtils.createPieChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Pie Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.chartColor
              );
              break;
            case "Scatter Plot":
              chartNode = chartUtils.createScatterPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Scatter Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Scatter Plot With Fit Line":
              chartNode = chartUtils.createScatterPlotWithFitLine(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Scatter Plot With Fit Line",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Scatter Plot With Multiple Fit Line":
              chartNode = chartUtils.createScatterPlotWithMultipleFitLine(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title:
                    chartMetadata?.title ||
                    "Scatter Plot With Multiple Fit Line",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor,
                chartConfig?.fitFunctions
              );
              break;
            case "Line Chart":
              chartNode = chartUtils.createLineChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Line Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Area Chart":
              chartNode = chartUtils.createAreaChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Area Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Vertical Stacked Bar Chart":
              chartNode = chartUtils.createVerticalStackedBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Vertical Stacked Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Horizontal Stacked Bar Chart":
              chartNode = chartUtils.createHorizontalStackedBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Horizontal Stacked Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Clustered Bar Chart":
              chartNode = chartUtils.createClusteredBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Clustered Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Multiple Line Chart":
              chartNode = chartUtils.createMultipleLineChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Multiple Line Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Boxplot":
              chartNode = chartUtils.createBoxplot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Boxplot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Histogram":
              chartNode = chartUtils.createHistogram(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Histogram",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor,
                chartConfig?.showNormalCurve
              );
              break;
            case "Error Bar Chart":
              chartNode = chartUtils.createErrorBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Error Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Stacked Area Chart":
              chartNode = chartUtils.createStackedAreaChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Stacked Area Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Grouped Scatter Plot":
              chartNode = chartUtils.createGroupedScatterPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Grouped Scatter Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Dot Plot":
              chartNode = chartUtils.createDotPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Dot Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Frequency Polygon":
              chartNode = chartUtils.createFrequencyPolygon(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Frequency Polygon",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Population Pyramid":
              chartNode = chartUtils.createPopulationPyramid(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Population Pyramid",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Clustered Error Bar Chart":
              chartNode = chartUtils.createClusteredErrorBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Clustered Error Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Stacked Histogram":
              chartNode = chartUtils.createStackedHistogram(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Clustered Error Bar Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.chartColor
              );
              break;
            case "Scatter Plot Matrix":
              chartNode = chartUtils.createScatterPlotMatrix(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Scatter Plot Matrix",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.chartColor
              );
              break;
            case "Clustered Boxplot":
              chartNode = chartUtils.createClusteredBoxplot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Clustered Boxplot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "1-D Boxplot":
              chartNode = chartUtils.create1DBoxplot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "1-D Boxplot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Simple Range Bar":
              chartNode = chartUtils.createSimpleRangeBar(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Simple Range Bar",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Clustered Range Bar":
              chartNode = chartUtils.createClusteredRangeBar(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "ClusteredRange Bar",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "High-Low-Close Chart":
              chartNode = chartUtils.createHighLowCloseChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "High-Low-Close Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Difference Area":
              chartNode = chartUtils.createDifferenceArea(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Difference Area",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Drop Line Chart":
              chartNode = chartUtils.createDropLineChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Drop Line Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Summary Point Plot":
              chartNode = chartUtils.createSummaryPointPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                (chartConfig?.statistic as
                  | "mean"
                  | "median"
                  | "mode"
                  | "min"
                  | "max") || "mean", // Use statistic from config
                {
                  title: chartMetadata?.title || "Summary Point Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Vertical Bar & Line Chart":
              chartNode = chartUtils.createBarAndLineChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Vertical Bar & Line Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Vertical Bar & Line Chart2":
              chartNode = chartUtils.createBarAndLineChart2(
                chartDataPoints,
                width,
                height,
                useAxis
              );
              break;
            case "Dual Axes Scatter Plot":
              chartNode = chartUtils.createDualAxesScatterPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Dual Axes Scatter Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "3D Bar Chart (ECharts)":
              chartNode = chartUtils.createECharts3DBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Dual Axes Scatter Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "3D Scatter Plot (ECharts)":
              chartNode = chartUtils.createECharts3DScatterPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Dual Axes Scatter Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Stacked 3D Bar Chart (ECharts)":
              chartNode = chartUtils.createEChartsStacked3DBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Stacked 3D Bar Chart ",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;

            case "Clustered 3D Bar Chart (ECharts)":
              chartNode = chartUtils.createEChartsClustered3DBarChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Clustered 3D Bar Chart ",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.chartColor
                // chartConfig?.axisScaleOptions,
              );
              break;
            case "Grouped 3D Scatter Plot (ECharts)":
              chartNode = chartUtils.createEChartsGrouped3DScatterPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Grouped 3D Scatter Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Density Chart":
              chartNode = chartUtils.createDensityChart(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Density Chart",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Violin Plot":
              chartNode = chartUtils.createViolinPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Vioin Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Stem And Leaf Plot":
              chartNode = chartUtils.createStemAndLeafPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Stem And Leaf Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "Normal QQ Plot":
              chartNode = chartUtils.createNormalQQPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "Normal QQ Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            case "P-P Plot":
              chartNode = chartUtils.createPPPlot(
                chartDataPoints,
                width,
                height,
                useAxis,
                {
                  title: chartMetadata?.title || "P-P Plot",
                  subtitle: chartMetadata?.subtitle,
                  titleFontSize: chartMetadata?.titleFontSize || 16,
                  subtitleFontSize: chartMetadata?.subtitleFontSize || 12,
                },
                chartConfig?.axisLabels,
                chartConfig?.axisScaleOptions,
                chartConfig?.chartColor
              );
              break;
            default:
              console.warn(`Unsupported chart type: ${chartType}`);
          }
          const uniqueId = `chart-${Date.now()}-${index}`;
          return { id: uniqueId, chartNode, chartType, width, height };
        }
      );
      setChartNodes(nodes);
    }
  }, [chartDimensions, parsedData]);

  // Menentukan ukuran kontainer berdasarkan dimensi chart
  const containerStyle = {
    width: `${chartDimensions.width}px`,
    height: `${chartDimensions.height}px`,
    position: "relative" as const,
  };

  return (
    <div>
      {chartNodes.map(({ id, chartNode, chartType, width, height }, idx) => (
        <div
          key={id}
          className="relative group mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          style={{ minHeight: 400 }}
          onMouseEnter={() => {
            if (actionTimers.current[id])
              clearTimeout(actionTimers.current[id]!);
            actionTimers.current[id] = setTimeout(() => {
              setActionsHidden((prev) => ({ ...prev, [id]: true }));
            }, 3000);
          }}
          onMouseLeave={() => {
            if (actionTimers.current[id])
              clearTimeout(actionTimers.current[id]!);
            setActionsHidden((prev) => ({ ...prev, [id]: false }));
          }}
        >
          <div
            className={
              "absolute top-2 right-2 flex gap-2 z-10 transition-opacity chart-actions " +
              (actionsHidden[id]
                ? "opacity-0"
                : "opacity-0 group-hover:opacity-100 pointer-events-auto")
            }
            onMouseEnter={() => {
              if (actionTimers.current[id])
                clearTimeout(actionTimers.current[id]!);
              setActionsHidden((prev) => ({ ...prev, [id]: false }));
            }}
            onMouseLeave={() => {
              actionTimers.current[id] = setTimeout(() => {
                setActionsHidden((prev) => ({ ...prev, [id]: true }));
              }, 3000);
            }}
          >
            <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                copied[id]?.svg ? "text-green-600" : ""
              } ${
                loadingStates[id]?.svg ? "opacity-50 cursor-not-allowed" : ""
              } ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() =>
                !loadingStates[id]?.svg && handleCopyChart(id, "svg")
              }
              disabled={loadingStates[id]?.svg}
              title="Copy as SVG"
            >
              {loadingStates[id]?.svg ? (
                <div className="w-4 h-4 inline-block mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              ) : copied[id]?.svg ? (
                <Check className="w-4 h-4 inline-block mr-1" />
              ) : (
                <Copy className="w-4 h-4 inline-block mr-1" />
              )}
              <FileType className="w-4 h-4 inline-block mr-1" />
              <span className="text-xs">SVG</span>
            </button>
            <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                copied[id]?.png ? "text-green-600" : ""
              } ${
                loadingStates[id]?.png ? "opacity-50 cursor-not-allowed" : ""
              } ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() =>
                !loadingStates[id]?.png && handleCopyChart(id, "png")
              }
              disabled={loadingStates[id]?.png}
              title="Copy as PNG"
            >
              {loadingStates[id]?.png ? (
                <div className="w-4 h-4 inline-block mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              ) : copied[id]?.png ? (
                <Check className="w-4 h-4 inline-block mr-1" />
              ) : (
                <Copy className="w-4 h-4 inline-block mr-1" />
              )}
              <LucideImage className="w-4 h-4 inline-block mr-1" />
              <span className="text-xs">PNG</span>
            </button>
            <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                loadingStates[id]?.svg ? "opacity-50 cursor-not-allowed" : ""
              } ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() =>
                !loadingStates[id]?.svg && handleDownloadChart(id, "svg")
              }
              disabled={loadingStates[id]?.svg}
              title="Download as SVG"
            >
              {loadingStates[id]?.svg ? (
                <div className="w-4 h-4 inline-block mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              ) : (
                <Download className="w-4 h-4 inline-block mr-1" />
              )}
              <FileType className="w-4 h-4 inline-block mr-1" />
              <span className="text-xs">SVG</span>
            </button>
            <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                loadingStates[id]?.png ? "opacity-50 cursor-not-allowed" : ""
              } ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() =>
                !loadingStates[id]?.png && handleDownloadChart(id, "png")
              }
              disabled={loadingStates[id]?.png}
              title="Download as PNG"
            >
              {loadingStates[id]?.png ? (
                <div className="w-4 h-4 inline-block mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              ) : (
                <Download className="w-4 h-4 inline-block mr-1" />
              )}
              <LucideImage className="w-4 h-4 inline-block mr-1" />
              <span className="text-xs">PNG</span>
            </button>
            {/* <button
              className={`p-2 bg-white rounded-md shadow-sm hover:bg-gray-100 ${
                actionsHidden[id] ? "pointer-events-none cursor-default" : ""
              }`}
              onClick={() => {
                setPreviewChart(
                  chartNode
                    ? (chartNode.cloneNode(true) as HTMLElement | SVGElement)
                    : null
                );
                setPreviewOpen(true);
              }}
              title="Preview Chart"
            >
              <View className="w-4 h-4" />
            </button> */}
          </div>
          {/* Chart type indicator */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                {chartType} Output
              </span>
            </div>
          </div>

          <div className="w-full h-full flex items-center justify-center">
            <div
              id={id}
              className="border border-gray-200 rounded-lg p-4 shadow-inner"
              style={{
                width: width + 32, // Extra space for pie chart legend
                height: height + 32, // Add padding space
              }}
            >
              {/* Render chartNode as HTML */}
              {chartNode && (
                <div
                  className="w-full h-full flex items-center justify-center"
                  ref={(el) => {
                    if (el && chartNode) {
                      el.innerHTML = "";
                      el.appendChild(chartNode);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ))}
      {/* <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex flex-col items-center justify-center max-w-4xl w-full h-[80vh]">
          {previewChart && (
            <div className="overflow-auto w-full h-full flex items-center justify-center">
              <div
                ref={(el) => {
                  if (el && previewChart) {
                    el.innerHTML = "";
                    el.appendChild(previewChart);
                  }
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default React.memo(
  GeneralChartContainer,
  (prevProps, nextProps) =>
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
);
